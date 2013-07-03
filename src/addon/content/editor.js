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

Components.utils.import( "resource://znotes/utils.js" , ru.akman.znotes );
Components.utils.import( "resource://znotes/documentmanager.js" , ru.akman.znotes );

ru.akman.znotes.Editor = function() {

  return function( aWindow, aDocument, aMode, aStyle ) {

    // !!!! %%%% !!!! STRINGS_BUNDLE
    var stringsBundle = ru.akman.znotes.Utils.STRINGS_BUNDLE;

    var currentMode = "viewer";
    var currentStyle = {
      iconsize: "small"
    };

    var currentNote = null;
    var noteStateListener = null;
    
    var currentEditor = null;
    var editorStateListener = null;

    var editorView = null;
    
    var cmdNoteEdit = null;
    var cmdNoteSave = null;
    var cmdNotePrint = null;

    var noteButtonEdit = null;
    var noteButtonSave = null;
    
    // N O T E  E V E N T S

    function onNoteDeleted( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.deletedNote;
      if ( currentNote && currentNote == aNote ) {
        this.unload();
      }
    };
    
    // E D I T O R  E V E N T S
    
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
      if ( currentNote && currentNote == aNote && currentEditor ) {
        switchMode( aMode );
      }
    };

    function onEditorStateChanged( e ) {
      var aNote = e.data.note;
      var isDirty = e.data.dirty;
      if ( currentNote && currentNote == aNote && currentEditor ) {
        switchState( isDirty );
      }
    };
    
    // E D I T O R  C O M A N D S

    function onCmdNoteEdit( source ) {
      if ( currentNote && currentNote.isExists() && currentEditor ) {
        currentEditor.edit();
      }
    };

    function onCmdNoteSave( source ) {
      if ( currentNote && currentNote.isExists() && currentEditor ) {
        currentEditor.save();
      }
    };

    function onCmdNotePrint( source ) {
      if ( currentNote && currentNote.isExists() && currentEditor ) {
        currentEditor.print();
      }
    };
    
    // E D I T O R  V I E W

    function enableView() {
      if ( noteButtonEdit.hasAttribute( "disabled" ) ) {
        noteButtonEdit.removeAttribute( "disabled" );
      }
      if ( cmdNotePrint.hasAttribute( "disabled" ) ) {
        cmdNotePrint.removeAttribute( "disabled" );
      }
    };
    
    function showView() {
      if ( editorView.hasAttribute( "hidden" ) ) {
        editorView.removeAttribute( "hidden" );
      }
      noteButtonSave.setAttribute( "hidden", "true" );
      enableView();
    };

    function disableView() {
      noteButtonEdit.setAttribute( "disabled", "true" );
      cmdNotePrint.setAttribute( "disabled", "true" );
    };
    
    function hideView() {
      editorView.setAttribute( "hidden", true );
      noteButtonSave.setAttribute( "hidden", "true" );
      disableView();
    };

    function switchMode( mode ) {
      if ( mode == "editor" ) {
        noteButtonEdit.setAttribute( "hidden", "true" );
        if ( noteButtonSave.hasAttribute( "hidden" ) ) {
          noteButtonSave.removeAttribute( "hidden" );
        }
      } else {
        noteButtonSave.setAttribute( "hidden", "true" );
        if ( noteButtonEdit.hasAttribute( "hidden" ) ) {
          noteButtonEdit.removeAttribute( "hidden" );
        }
      }
    };

    function switchState( dirty ) {
      if ( dirty && noteButtonSave.hasAttribute( "disabled" ) ) {
        noteButtonSave.removeAttribute( "disabled" );
      } else {
        noteButtonSave.setAttribute( "disabled", "true" );
      }
    };
    
    // E D I T O R

    function open() {
      currentEditor = ru.akman.znotes.DocumentManager
                                     .getDocument( currentNote.getType() )
                                     .getEditor( aDocument );
      addEventListeners();
      if ( currentEditor ) {
        currentEditor.open( aWindow, aDocument, currentNote, currentStyle );
      }
    };

    function close() {
      if ( currentEditor ) {
        currentEditor.close();
      }
      removeEventListeners();
      currentNote = null;
      currentEditor = null;
    };

    // E V E N T  L I S T E N E R S
    
    function addEventListeners() {
      cmdNoteEdit.addEventListener( "command", onCmdNoteEdit, false );
      cmdNoteSave.addEventListener( "command", onCmdNoteSave, false );
      cmdNotePrint.addEventListener( "command", onCmdNotePrint, false );
      if ( currentNote ) {
        currentNote.addStateListener( noteStateListener );
      }
      if ( currentEditor ) {
        currentEditor.addStateListener( editorStateListener );
      }
    };

    function removeEventListeners() {
      cmdNoteEdit.removeEventListener( "command", onCmdNoteEdit, false );
      cmdNoteSave.removeEventListener( "command", onCmdNoteSave, false );
      cmdNotePrint.removeEventListener( "command", onCmdNotePrint, false );
      if ( currentEditor ) {
        currentEditor.removeStateListener( editorStateListener );
      }
      if ( currentNote ) {
        currentNote.removeStateListener( noteStateListener );
      }
    };
    
    // P U B L I C  M E T H O D S

    /**
     * Update style of toolbars
     * @param style { iconsize: "small" || "normal" }
     */
    this.updateStyle = function( style ) {
      if ( currentEditor ) {
        currentEditor.updateStyle( style );
      }
    };
    
    /**
     * Print current view
     */
    this.print = function() {
      if ( currentNote && currentNote.isExists() && currentEditor ) {
        currentEditor.print();
      }
    };
    
    /**
     * Enable buttons in parent toolbars if they placed there
     */
    this.enable = function() {
      enableView();
      if ( currentEditor ) {
        currentEditor.enable();
      }
    };

    /**
     * Disable buttons in parent toolbars if they placed there
     */
    this.disable = function() {
      disableView();
      if ( currentEditor ) {
        currentEditor.disable();
      }
    };
    
    /**
     * Open a note and show it in the editor's view
     */
    this.show = function( aNote ) {
      this.unload();
      currentNote = aNote;
      if ( currentNote && currentNote.isExists() ) {
        showView();
        open();
      } else {
        hideView();
      }
    };

    /**
     * Close the current note and hide the editor's view
     */
    this.hide = function() {
      this.unload();
      hideView();
    };

    /**
     * Close the current note
     */
    this.unload = function() {
      if ( currentNote ) {
        close();
      }
    };

    // C O N S T R U C T O R  ( aWindow, aDocument, aMode, aStyle )

    if ( aMode ) {
      currentMode = aMode;
    }
    if ( aStyle ) {
      ru.akman.znotes.Utils.copyObject( aStyle, currentStyle );
    }
    editorView = aDocument.getElementById( "editorView" );
    noteButtonEdit = aDocument.getElementById( "noteButtonEdit" );
    noteButtonSave = aDocument.getElementById( "noteButtonSave" );
    cmdNoteEdit = aDocument.getElementById( "cmdNoteEdit" );
    cmdNoteSave = aDocument.getElementById( "cmdNoteSave" );
    cmdNotePrint = aDocument.getElementById( "cmdNotePrint" );
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
  };

}();
