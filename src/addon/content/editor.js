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

var Cc = Components.classes;
var Ci = Components.interfaces;
var Cr = Components.results;
var Cu = Components.utils;

if ( !ru ) var ru = {};
if ( !ru.akman ) ru.akman = {};
if ( !ru.akman.znotes ) ru.akman.znotes = {};

Cu.import( "resource://znotes/utils.js", ru.akman.znotes );
Cu.import( "resource://znotes/documentmanager.js", ru.akman.znotes );

ru.akman.znotes.Editor = function() {

  return function( aWindow, aMode, aStyle ) {

    var Utils = ru.akman.znotes.Utils;
    var log = Utils.getLogger( "content.editor" );
    var Common = ru.akman.znotes.Common;

    var observerService =
      Cc["@mozilla.org/observer-service;1"]
      .getService( Ci.nsIObserverService );

    var currentWindow = null;
    var currentMode = "viewer";
    var currentStyle = {
      iconsize: "small"
    };

    var currentEditor = null;
    var editorStateListener = null;

    var editorView = null;
    var editorToolbar = null;

    var currentNote = null;
    var noteStateListener = null;

    // COMMANDS

    var editorCommands = {
      "znotes_editoredit_command": null,
      "znotes_editorsave_command": null,
      "znotes_editorprint_command": null
    };

    var editorController = {
      supportsCommand: function( cmd ) {
        if ( !( cmd in editorCommands ) ) {
          return false;
        }
        return true;
      },
      isCommandEnabled: function( cmd ) {
        if ( !( cmd in editorCommands ) ) {
          return false;
        }
        if ( !currentNote || !currentNote.isExists() ||
             !currentEditor || currentNote.isLoading() ) {
          return false;
        }
        switch ( cmd ) {
          case "znotes_editoredit_command":
          case "znotes_editorprint_command":
            return true;
          case "znotes_editorsave_command":
            return ( currentEditor && currentEditor.isDirty() );
        }
        return false;
      },
      doCommand: function( cmd ) {
        if ( !( cmd in editorCommands ) ) {
          return;
        }
        switch ( cmd ) {
          case "znotes_editoredit_command":
            currentEditor.edit();
            break;
          case "znotes_editorsave_command":
            currentEditor.save();
            break;
          case "znotes_editorprint_command":
            currentEditor.print();
            break;
        }
      },
      onEvent: function( event ) {
      },
      getName: function() {
        return "EDITOR";
      },
      getCommand: function( cmd ) {
        if ( cmd in editorCommands ) {
          return currentWindow.document.getElementById( cmd );
        }
        return null;
      },
      register: function() {
        try {
          currentWindow.controllers.insertControllerAt( 0, this );
          this.getId = function() {
            return currentWindow.controllers.getControllerId( this );
          };
        } catch ( e ) {
          log.warn(
            "An error occurred registering '" + this.getName() +
            "' controller\n" + e
          );
        }
      },
      unregister: function() {
        for ( var cmd in editorCommands ) {
          Common.goSetCommandEnabled( cmd, false, currentWindow );
        }
        try {
          currentWindow.controllers.removeController( this );
        } catch ( e ) {
          log.warn(
            "An error occurred unregistering '" + this.getName() +
            "' controller\n" + e
          );
        }
      }
    };

    function updateCommands() {
      var id = editorController.getId();
      Common.goSetCommandHidden( "znotes_editorsave_command", true, currentWindow );
      Common.goSetCommandHidden( "znotes_editoredit_command", false, currentWindow );
      Common.goUpdateCommand( "znotes_editorsave_command", id, currentWindow );
      Common.goUpdateCommand( "znotes_editoredit_command", id, currentWindow );
      Common.goUpdateCommand( "znotes_editorprint_command", id, currentWindow );
    };

    // HELPERS

    function confirm() {
      var params = {
        input: {
          kind: 2,
          title: Utils.STRINGS_BUNDLE.getString(
            "body.confirmSave.title"
          ),
          message1: Utils.STRINGS_BUNDLE.getFormattedString(
            "body.confirmSave.message1",
            [ currentNote.getName() ]
          ),
          message2: Utils.STRINGS_BUNDLE.getString(
            "body.confirmSave.message2"
          )
        },
        output: null
      };
      currentWindow.openDialog(
        "chrome://znotes/content/confirmdialog.xul",
        "",
        "chrome,dialog,modal,centerscreen,resizable=no",
        params
      ).focus();
      if ( params.output ) {
        return ( params.output.result ? 1 : 0 );
      }
      return -1;
    };

    // LISTENERS

    function addEventListeners() {
      if ( currentNote ) {
        currentNote.addStateListener( noteStateListener );
      }
    };

    function removeEventListeners() {
      if ( currentNote ) {
        currentNote.removeStateListener( noteStateListener );
      }
    };

    function addEditorEventListeners() {
      if ( currentEditor ) {
        currentEditor.addStateListener( editorStateListener );
      }
    };

    function removeEditorEventListeners() {
      if ( currentEditor ) {
        currentEditor.removeStateListener( editorStateListener );
      }
    };

    // NOTE EVENTS

    function onNoteDeleted( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.deletedNote;
      if ( currentNote && currentNote === aNote && currentEditor ) {
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
      aNote.setMode( aMode );
      var aFlag = ( aMode == "editor" );
      if ( currentNote && currentNote == aNote && currentEditor ) {
        Common.goSetCommandHidden( "znotes_editoredit_command", aFlag, currentWindow );
        Common.goSetCommandHidden( "znotes_editorsave_command", !aFlag, currentWindow );
      }
    };

    function onEditorStateChanged( e ) {
      var aNote = e.data.note;
      var isDirty = e.data.dirty;
      if ( currentNote && currentNote == aNote && currentEditor ) {
        Common.goUpdateCommand( "znotes_editorsave_command",
          editorController.getId(), currentWindow );
      }
    };

    // PUBLIC EVENTS

    this.onBeforeCurrentNoteChange = function( event ) {
      if ( currentNote && currentNote.isExists() &&
           currentEditor && currentEditor.isDirty() ) {
        var res = confirm();
        if ( res === -1 ) {
          event.data.canChange = false;
          return;
        }
        if ( res ) {
          currentEditor.save();
        } else {
          currentEditor.cancel();
        }
      }
    };

    this.onNoteChanged = function( event ) {
      var aNote = event.data.note;
      var aForced = event.data.forced;
      if ( currentNote && currentNote == aNote && !aForced ) {
        return;
      }
      if ( currentEditor && !currentEditor.isReady() ) {
        // This possible when welcome note created only
        return;
      }
      if ( currentEditor ) {
        currentEditor.close();
      }
      removeEditorEventListeners();
      removeEventListeners();
      currentNote = aNote;
      if ( currentNote && currentNote.isExists() && !currentNote.isLoading() ) {
        // currentEditor is always a new instance of Editor
        // @see documentmanager.js
        currentEditor = ru.akman.znotes.DocumentManager
                                       .getInstance()
                                       .getDocument( currentNote.getType() )
                                       .getEditor();
        addEventListeners();
        addEditorEventListeners();
        if ( editorView.hasAttribute( "hidden" ) ) {
          editorView.removeAttribute( "hidden" );
        }
        if ( editorToolbar.hasAttribute( "hidden" ) ) {
          editorToolbar.removeAttribute( "hidden" );
        }
        if ( currentEditor ) {
          currentEditor.open( currentWindow, currentWindow.document,
            currentNote, currentStyle );
        }
      } else {
        editorView.setAttribute( "hidden", true );
        editorToolbar.setAttribute( "hidden", true );
        currentEditor = null;
      }
      updateCommands();
    };

    this.onStyleChanged = function( event ) {
      var style = event.data.style;
      Utils.cloneObject( style, currentStyle );
      if ( currentEditor ) {
        currentEditor.updateStyle( style );
      }
    };

    this.onRelease = function( event ) {
      if ( currentEditor ) {
        currentEditor.close();
      }
      removeEditorEventListeners();
      removeEventListeners();
      editorController.unregister();
    };

    // CONSTRUCTOR ( aWindow, aMode, aStyle )

    currentWindow = aWindow ? aWindow : window;
    if ( aMode ) {
      currentMode = aMode;
    }
    if ( aStyle ) {
      Utils.cloneObject( aStyle, currentStyle );
    }
    editorView = currentWindow.document.getElementById( "editorView" );
    editorToolbar = currentWindow.document.getElementById( "znotes_editor_toolbar" );
    if ( Utils.IS_STANDALONE ) {
      editorToolbar.removeAttribute( "thunderbird" );
    } else {
      editorToolbar.setAttribute( "thunderbird", "true" );
    }
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
