/* ***** BEGIN LICENSE BLOCK *****
 *
 * Version: GPL 3.0
 *
 * ZNotes
 * Copyright (C) 2012 Alexander Kapitman
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * The Original Code is ZNotes.
 *
 * Initial Developer(s):
 *   Alexander Kapitman <akman.ru@gmail.com>
 *
 * Portions created by the Initial Developer are Copyright (C) 2012
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * ***** END LICENSE BLOCK ***** */

if ( !ru ) var ru = {};
if ( !ru.akman ) ru.akman = {};
if ( !ru.akman.znotes ) ru.akman.znotes = {};

Components.utils.import( "resource://znotes/utils.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/documentmanager.js",
  ru.akman.znotes
);

ru.akman.znotes.Editor = function() {

  return function( aMode, aStyle ) {

    var Utils = ru.akman.znotes.Utils;
    var Common = ru.akman.znotes.Common;

    var currentMode = "viewer";
    var currentStyle = {
      iconsize: "small"
    };

    var currentNote = null;
    var noteStateListener = null;
    
    var currentEditor = null;
    var isEditorDirty = false;
    
    var editorView = null;
    
    var editorStateListener = null;
    
    //
    // COMMANDS
    //
    
    var editorCommands = {
      "znotes_editoredit_command": null,
      "znotes_editorsave_command": null,
      "znotes_editorprint_command": null
    };
    
    var basicCommands = {
      "cmd_saveAsFile": null,
      "cmd_print": null
    };
    
    var editorController = {
      supportsCommand: function( cmd ) {
        if ( cmd.indexOf( "cmd_" ) == 0 ) {
          Utils.log( this.getName() + "::supportsCommand() '" + cmd + "'" );
        }
        if ( !( cmd in editorCommands ) && !( cmd in basicCommands ) ) {
          return false;
        }
        return true;
      },
      isCommandEnabled: function( cmd ) {
        if ( cmd.indexOf( "cmd_" ) == 0 ) {
          Utils.log( this.getName() + "::isCommandEnabled() '" + cmd + "'" );
        }
        if ( !( cmd in editorCommands ) && !( cmd in basicCommands ) ) {
          return false;
        }
        if ( !currentNote || !currentNote.isExists() ||
             !currentEditor || currentNote.isLoading() ) {
          return false;
        }
        switch ( cmd ) {
          case "znotes_editoredit_command":
          case "znotes_editorprint_command":
          case "cmd_print":
            return true;
          case "znotes_editorsave_command":
          case "cmd_saveAsFile":
            return isEditorDirty;
        }
        return false;
      },
      doCommand: function( cmd ) {
        Utils.log( this.getName() + "::doCommand() '" + cmd + "'" );
        if ( !( cmd in editorCommands ) && !( cmd in basicCommands ) ) {
          return;
        }
        switch ( cmd ) {
          case "znotes_editoredit_command":
            currentEditor.edit();
            break;
          case "znotes_editorsave_command":
          case "cmd_saveAsFile":
            currentEditor.save();
            break;
          case "znotes_editorprint_command":
          case "cmd_print":
            currentEditor.print();
            break;
        }
      },
      onEvent: function( event ) {
        Utils.log( this.getName() + "::onEvent() '" + event + "'" );
      },
      getName: function() {
        return "EDITOR";
      },
      getCommand: function( cmd ) {
        if ( cmd in editorCommands ) {
          return document.getElementById( cmd );
        }
        return null;
      },
      register: function() {
        Utils.appendAccelText( editorCommands, document );
        try {
          top.controllers.insertControllerAt( 0, this );
        } catch ( e ) {
          Components.utils.reportError(
            "An error occurred registering '" + this.getName() +
            "' controller: " + e
          );
        }
      },
      unregister: function() {
        try {
          top.controllers.removeController( this );
        } catch ( e ) {
          Components.utils.reportError(
            "An error occurred unregistering '" + this.getName() +
            "' controller: " + e
          );
        }
        Utils.removeAccelText( editorCommands, document );
      }
    };
    
    function updateCommands() {
      window.focus();
      Common.goSetCommandHidden( "znotes_editorsave_command", true );
      Common.goSetCommandHidden( "znotes_editoredit_command", false );
      Common.goUpdateCommand( "znotes_editorsave_command" );
      Common.goUpdateCommand( "znotes_editoredit_command" );
      Common.goUpdateCommand( "znotes_editorprint_command" );
    };
    
    // NOTE EVENTS

    function onNoteDeleted( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.deletedNote;
      if ( currentNote && currentNote == aNote && currentEditor ) {
        currentEditor.close();
      }
    };
    
    // EDITOR EVENTS
    
    function onEditorOpened( e ) {
      var aNote = e.data.note;
      if ( currentNote && currentNote == aNote && currentEditor ) {
        if ( currentMode == "editor" ) {
          currentEditor.edit();
        }
      }
    };

    function onEditorClose( e ) {
      var aNote = e.data.note;
      if ( currentNote && currentNote == aNote && currentEditor ) {
      }
    };
    
    function onEditorModeChanged( e ) {
      var aNote = e.data.note;
      var aMode = e.data.mode;
      var aFlag = ( aMode == "editor" );
      if ( currentNote && currentNote == aNote && currentEditor ) {
        window.focus();
        Common.goSetCommandHidden( "znotes_editoredit_command", aFlag );
        Common.goSetCommandHidden( "znotes_editorsave_command", !aFlag );
      }
    };

    function onEditorStateChanged( e ) {
      var aNote = e.data.note;
      var isDirty = e.data.dirty;
      if ( currentNote && currentNote == aNote && currentEditor ) {
        isEditorDirty = isDirty;
        window.focus();
        Common.goUpdateCommand( "znotes_editorsave_command" );
      }
    };
    
    // VIEW

    function showCurrentView() {
      if ( editorView.hasAttribute( "hidden" ) ) {
        editorView.removeAttribute( "hidden" );
      }
      if ( currentEditor ) {
        currentEditor.open( window, document, currentNote, currentStyle );
      }
    };
    
    function hideCurrentView() {
      editorView.setAttribute( "hidden", true );
    };
    
    function show( aNote, aForced ) {
      if ( currentNote && currentNote == aNote && !aForced ) {
        return;
      }
      if ( currentEditor ) {
        currentEditor.close();
      }
      removeEditorEventListeners();
      removeEventListeners();
      currentNote = aNote;
      if ( currentNote && currentNote.isExists() && !currentNote.isLoading() ) {
        currentEditor = ru.akman.znotes.DocumentManager
                                       .getDocument( currentNote.getType() )
                                       .getEditor();
        addEventListeners();
        addEditorEventListeners();
        showCurrentView();
      } else {
        currentEditor = null;
        hideCurrentView();
      }
      updateCommands();
    };
    
    // LISTENERS
    
    function addEventListeners() {
      if ( !currentNote ) {
        return;
      }
      currentNote.addStateListener( noteStateListener );
    };

    function removeEventListeners() {
      if ( !currentNote ) {
        return;
      }
      currentNote.removeStateListener( noteStateListener );
    };

    function addEditorEventListeners() {
      if ( !currentEditor ) {
        return;
      }
      currentEditor.addStateListener( editorStateListener );
    };
    
    function removeEditorEventListeners() {
      if ( !currentEditor ) {
        return;
      }
      currentEditor.removeStateListener( editorStateListener );
    };
    
    // PUBLIC

    this.onStyleChanged = function( event ) {
      var style = event.data.style;
      Utils.copyObject( style, currentStyle );
      if ( currentEditor ) {
        currentEditor.updateStyle( style );
      }
    };
    
    this.onNoteChanged = function( event ) {
      var note = event.data.note;
      var forced = event.data.forced;
      show( note, forced );
    };
    
    this.onRelease = function( event ) {
      if ( currentEditor ) {
        currentEditor.close();
      }
      removeEditorEventListeners();
      removeEventListeners();
      editorController.unregister();
    };
    
    // CONSTRUCTOR ( aMode, aStyle )

    if ( aMode ) {
      currentMode = aMode;
    }
    if ( aStyle ) {
      Utils.copyObject( aStyle, currentStyle );
    }
    editorView = document.getElementById( "editorView" );
    noteStateListener = {
      name: "EDITOR",
      onNoteDeleted: onNoteDeleted,
    };
    editorStateListener = {
      onOpened: onEditorOpened,
      onClose: onEditorClose,
      onModeChanged: onEditorModeChanged,
      onStateChanged: onEditorStateChanged
    };
    editorController.register();
  };

}();
