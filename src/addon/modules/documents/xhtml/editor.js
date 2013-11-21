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
if ( !ru.akman.znotes.core ) ru.akman.znotes.core = {};
if ( !ru.akman.znotes.spellchecker ) ru.akman.znotes.spellchecker = {};

Components.utils.import( "resource://znotes/utils.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/domutils.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/event.js",
  ru.akman.znotes.core
);
Components.utils.import( "resource://znotes/prefsmanager.js",
  ru.akman.znotes
);
Components.utils.import( "resource://gre/modules/InlineSpellChecker.jsm",
  ru.akman.znotes.spellchecker
);
Components.utils.import( "resource://znotes/keyset.js",
  ru.akman.znotes
);

var EXPORTED_SYMBOLS = ["Editor"];

var Editor = function() {

  return function() {

    var nsIHTMLEditor = Components.interfaces.nsIHTMLEditor;
    var Utils = ru.akman.znotes.Utils;
    var DOMUtils = ru.akman.znotes.DOMUtils;
    // can't be initialized at once
    var Common = null; 
    var prefsBundle = null;
    var stringsBundle = null;

    var atomService =
      Components.classes["@mozilla.org/atom-service;1"]
                .getService( Components.interfaces.nsIAtomService );
    
    var self = this;

    var EditorException = function( message ) {
      this.name = "EditorException";
      this.message = message;
      this.toString = function() {
        return this.name + ": " + this.message;
      }
    };

    var listeners = [];
    
    var currentWindow = null;
    var currentDocument = null;
    var currentNote = null;
    var currentMode = null;
    var currentStyle = null;
    var currentPreferences = null;

    var currentBookTagList = null;
    
    var noteStateListener = null;
    var tagListStateListener = null;
    var documentStateListener = null;
    
    var isDesignEditingActive = false;
    var isSourceEditingActive = false;
    var isEditorDirty = false;
    var isParseError = false;
    var isParseModified = false;

    var undoState = {
      modifications: null,
      index: -1,
      clear: function() {
        this.modifications = [{
          design: 0,
          source: 0,
          error: isParseError
        }];
        this.index = 0;
      },
      getCurrent: function() {
        return {
          design: designEditor.numberOfUndoItems,
          source: sourceEditor.getDoc().historySize().undo,
          error: isParseError
        };
      },
      getLast: function() {
        if ( this.index < 0 ) {
          return this.modifications[0];
        }
        if ( this.index > this.modifications.length - 1 ) {
          return this.modifications[this.modifications.length-1];
        }
        return this.modifications[this.index];
      }
    };
    
    var editorTabs = null;
    var editorTabSource = null;
    
    var designFrame = null;
    var designEditor = null;
    var designToolBox = null;
    var designToolBar1 = null;
    var designToolBar2 = null;
    var prevDesignEditorCursor = null;

    var sourceFrame = null;
    var sourceWindow = null;
    var sourceEditor = null;
    var sourceEditorLibrary = null;
    var sourceEditorHeight = null;
    var sourceEditorHScrollbarHeight = null;
    var sourcePrintFrame = null;
    var sourceToolBox = null;
    var sourceToolBar1 = null;
    var sourceToolBar2 = null;
    var prevSourceEditorCursor = null;
    
    var editMenuPopup = null;
    var editSpellMenuPopup = null;
    var spellCheckerUI = null;
    var editorKeyset = null;

    var fontNameMenuPopup = null;
    var fontNameMenuList = null;
    var fontSizeTextBox = null;
    var formatBlockObject = null;
    var formatBlockMenuPopup = null;
    var formatBlockMenuList = null;

    var foreColorButton = null;
    var backColorButton = null;
    
    // PREFERENCES
    
    var prefsMozillaObserver = {
      observe: function( subject, topic, data ) {
        switch ( data ) {
          case "debug":
            Utils.IS_DEBUG_ENABLED = this.branch.getBoolPref( "debug" );
            Common.goSetCommandHidden( "znotes_editordebug_command",
              !Utils.IS_DEBUG_ENABLED, currentWindow );
            Common.goUpdateCommand( "znotes_editordebug_command", editorController.getId(), currentWindow );
            break;
        }
      },
      register: function() {
        var prefService =
          Components.classes["@mozilla.org/preferences-service;1"]
                    .getService( Components.interfaces.nsIPrefService );
        this.branch = prefService.getBranch( "extensions.znotes.");
        this.branch.addObserver( "", this, false );
      },
      unregister: function() {
        this.branch.removeObserver( "", this );
      }
    };
    
    var prefObserver = {
      onPrefChanged: function( event ) {
        var docName = self.getDocument().getName();
        switch( event.data.name ) {
          case "designToolbar1CurrentSet." + docName:
          case "designToolbar2CurrentSet." + docName:
          case "sourceToolbar1CurrentSet." + docName:
          case "sourceToolbar2CurrentSet." + docName:
            restoreToolbarCurrentSet();
            break;
          case "isReplaceBackground":
            Utils.IS_REPLACE_BACKGROUND =
              prefsBundle.getBoolPref( "isReplaceBackground" );          
            if ( !isDesignEditingActive && !isSourceEditingActive ) {
              setBackgroundColor();
            }
            break;
        }
      }
    };

    var docPrefObserver = {
      onEditorPreferencesChanged: onEditorPreferencesChanged,
      onDocumentPreferencesChanged: onDocumentPreferencesChanged
    };
    
    // SPELL CONTROLLER
    
    var spellEditCommands = {
      "znotes_addtodictionary_command": null,
      "znotes_undoaddtodictionary_command": null,
      "znotes_spellcheckenabled_command": null
    };
    
    var spellEditController = {
      supportsCommand: function( cmd ) {
        return ( cmd in spellEditCommands ) && isInEditorWindow() &&
               spellCheckerUI;
      },
      isCommandEnabled: function( cmd ) {
        return spellCheckerUI;
      },                                                                           
      doCommand: function( cmd ) {
        if ( !spellCheckerUI ) {
          return;
        }
        switch ( cmd ) {
          case "znotes_addtodictionary_command":
            spellCheckerUI.addToDictionary();
            break;
          case "znotes_undoaddtodictionary_command":
            spellCheckerUI.undoAddToDictionary();
            break;
          case "znotes_spellcheckenabled_command":
            setCommandState( "znotes_spellcheckenabled_command",
              spellCheckerUI && !spellCheckerUI.enabled );
            designEditor.setSpellcheckUserOverride(
              spellCheckerUI && !spellCheckerUI.enabled );
            break;
        }
      },
      onEvent: function( event ) {
      },
      getName: function() {
        return "EDITOR:XHTML:spellEditController";
      },
      getCommand: function( cmd ) {
        return ( cmd in spellEditCommands ) ?
          currentDocument.getElementById( cmd ) : null;
      },
      updateCommands: function() {
        for ( var cmd in spellEditCommands ) {
          Common.goUpdateCommand( cmd, this.getId(), currentWindow );
        }
      },
      register: function() {
        try {
          currentWindow.controllers.insertControllerAt( 0, this );
          this.getId = function() {
            return currentWindow.controllers.getControllerId( this );
          };
        } catch ( e ) {
          Components.utils.reportError(
            "An error occurred registering '" + this.getName() +
            "' controller: " + e
          );
        }
      },
      unregister: function() {
        try {
          currentWindow.controllers.removeController( this );
        } catch ( e ) {
        }
      }
    };
    
    function updateSpellCommands() {
      spellEditController.updateCommands();
    };

    function onEditSpellMenuPopupShowing() {
      updateEditCommands();
      updateSpellCommands();
      var addtodictionary =
        currentDocument.getElementById( "znotes_addtodictionary_menuitem" );
      var undoaddtodictionary =
        currentDocument.getElementById( "znotes_undoaddtodictionary_menuitem" );
      var spellcheckenabled =
        currentDocument.getElementById( "znotes_spellcheckenabled_menuitem" );
      var spellnosuggestions =
        currentDocument.getElementById( "znotes_spellnosuggestions_menuitem" );
      var spellsuggestionssep =
        currentDocument.getElementById( "znotes_edit_menupopup_spellsuggestions_separator" );
      var spellchecksep =
        currentDocument.getElementById( "znotes_edit_menupopup_spellcheck_separator" );
      var spelldictionariesmenu =
        currentDocument.getElementById( "znotes_spelldictionaries_menu" );
      var spelldictionariespopup =
        currentDocument.getElementById( "znotes_spelldictionaries_menupopup" );
      if ( !spellCheckerUI || !spellCheckerUI.canSpellCheck ) {
        addtodictionary.setAttribute( "hidden", "true" );
        undoaddtodictionary.setAttribute( "hidden", "true" );
        spellcheckenabled.setAttribute( "hidden", "true" );
        spellnosuggestions.setAttribute( "hidden", "true" );
        spellsuggestionssep.setAttribute( "hidden", "true" );
        spellchecksep.setAttribute( "hidden", "true" );
        spelldictionariesmenu.setAttribute( "hidden", "true" );
        return;
      }
      spellCheckerUI.initFromEvent(
        currentDocument.popupRangeParent,
        currentDocument.popupRangeOffset
      );
      var enabled = spellCheckerUI.enabled;
      var showUndo = spellCheckerUI.canSpellCheck && spellCheckerUI.canUndo();
      var overMisspelling = spellCheckerUI.overMisspelling;
      spellcheckenabled.setAttribute( "checked", enabled );
      if ( showUndo ) {
        undoaddtodictionary.removeAttribute( "hidden" );
      } else {
        undoaddtodictionary.setAttribute( "hidden", "true" );
      }
      if ( overMisspelling || showUndo ) {
        spellsuggestionssep.removeAttribute( "hidden" );
      } else {
        spellsuggestionssep.setAttribute( "hidden", "true" );
      }
      var numsug = spellCheckerUI.addSuggestionsToMenu(
        editSpellMenuPopup,
        spellsuggestionssep,
        5 /* max number of suggestions */
      );
      if ( overMisspelling && numsug == 0 ) {
        spellnosuggestions.removeAttribute( "hidden" );
      } else {
        spellnosuggestions.setAttribute( "hidden", "true" );
      }
      if ( overMisspelling ) {
        addtodictionary.removeAttribute( "hidden" );
      } else {
        addtodictionary.setAttribute( "hidden", "true" );
      }
      var numdicts = spellCheckerUI.addDictionaryListToMenu(
        spelldictionariespopup,
        null
      );
      if ( enabled && numdicts > 1 ) {
        spelldictionariesmenu.removeAttribute( "hidden" );
      } else {
        spelldictionariesmenu.setAttribute( "hidden", "true" );
      }
    };
    
    function onEditSpellMenuPopupHiding() {
      if ( !spellCheckerUI ) {
        return;
      }
      spellCheckerUI.clearSuggestionsFromMenu();
      spellCheckerUI.clearDictionaryListFromMenu();
    };

    // EDIT CONTROLLER
    
    var editCommands = {
      "znotes_undo_command": null,
      "znotes_redo_command": null,
      "znotes_cut_command": null,
      "znotes_copy_command": null,
      "znotes_paste_command": null,
      "znotes_delete_command": null,
      "znotes_selectall_command": null
    };
    
    var editController = {
      supportsCommand: function( cmd ) {
        return ( cmd in editCommands ) && isInEditorWindow();
      },
      isCommandEnabled: function( cmd ) {
        if ( !currentNote || currentNote.isLoading() ) {
          return false;
        }
        var isEnabled, canUndo, canRedo, selection, clipboard;
        switch ( cmd ) {
          case "znotes_undo_command":
            if ( isDesignEditingActive ) {
              isEnabled = {};
              canUndo = {};
              designEditor.canUndo( isEnabled, canUndo );
              return canUndo.value;
            } else if ( isSourceEditingActive ) {
              return sourceEditor.getDoc().historySize().undo;
            }
            return false;
          case "znotes_redo_command":
            if ( isDesignEditingActive ) {
              isEnabled = {};
              canRedo = {};
              designEditor.canRedo( isEnabled, canRedo );
              return canRedo.value;
            } else if ( isSourceEditingActive ) {
              return sourceEditor.getDoc().historySize().redo;
            }
            return false;
          case "znotes_paste_command":
            if ( isDesignEditingActive ) {
              return !isParseError && designEditor.canPaste( 1 );
            } else if ( isSourceEditingActive ) {
              clipboard =
                Components.classes['@mozilla.org/widget/clipboard;1']
                          .createInstance( Components.interfaces.nsIClipboard );
              return clipboard.hasDataMatchingFlavors(
                [ "text/unicode" ], 1, clipboard.kGlobalClipboard );            
            }
            return false;
          case "znotes_copy_command":
            if ( isSourceEditingActive ) {
              return sourceEditor.getDoc().somethingSelected();
            }
            selection = designFrame.contentWindow.getSelection();
            return selection && !selection.isCollapsed;
          case "znotes_cut_command":
          case "znotes_delete_command":
            if ( isSourceEditingActive ) {
              return sourceEditor.getDoc().somethingSelected();
            } else if ( isDesignEditingActive ) {
              selection = designFrame.contentWindow.getSelection();
              return !isParseError && selection && !selection.isCollapsed;
            }
            return false;
          case "znotes_selectall_command":
            return true;
        }
        return false;
      },
      doCommand: function( cmd ) {
        switch ( cmd ) {
          case "znotes_undo_command":
            doUndo();
            break;
          case "znotes_redo_command":
            doRedo();
            break;
          case "znotes_selectall_command":
            doSelectAll();
            break;
          case "znotes_paste_command":
            doPaste();
            break;
          case "znotes_copy_command":
            doCopy();
            break;
          case "znotes_cut_command":
            doCut();
            break;
          case "znotes_delete_command":
            doDelete();
            break;
        }
        onSelectionChanged();
      },
      onEvent: function( event ) {
      },
      getName: function() {
        return "EDITOR:XHTML:editController";
      },
      getCommand: function( cmd ) {
        return ( cmd in editCommands ) ?
          currentDocument.getElementById( cmd ) : null;
      },
      updateCommands: function() {
        for ( var cmd in editCommands ) {
          Common.goUpdateCommand( cmd, this.getId(), currentWindow );
        }
      },
      register: function() {
        try {
          currentWindow.controllers.insertControllerAt( 0, this );
          this.getId = function() {
            return currentWindow.controllers.getControllerId( this );
          };
        } catch ( e ) {
          Components.utils.reportError(
            "An error occurred registering '" + this.getName() +
            "' controller: " + e
          );
        }
      },
      unregister: function() {
        try {
          currentWindow.controllers.removeController( this );
        } catch ( e ) {
        }
      }
    };
    
    function updateEditCommands() {
      editController.updateCommands();
    };

    function onEditMenuPopupShowing() {
      updateEditCommands();
    };
    
    function doSelectAll() {
      if ( isDesignEditingActive ) {
        designEditor.selectAll();
      } else if ( isSourceEditingActive ) {
        var doc = sourceEditor.getDoc();
        var lastLineIndex = doc.lastLine();
        doc.setSelection(
          { line: 0, ch: 0 }, 
          { line: lastLineIndex , ch: doc.getLine( lastLineIndex ).length }
        );
      } else {
        designFrame.contentWindow.getSelection().selectAllChildren(
          designFrame.contentDocument.body
        );
      }
      return true;
    };
    
    function doCopy() {
      var dataText, dataFlavor;
      var fragment, serializer;
      if ( isSourceEditingActive ) {
        dataFlavor = "text/unicode";
        dataText = sourceEditor.getDoc().getSelection();
      } else {
        dataFlavor = "text/html";
        try {
          fragment = DOMUtils.cloneSelection( designFrame.contentWindow );
          serializer =
            Components.classes["@mozilla.org/xmlextras/xmlserializer;1"]
                      .createInstance( Components.interfaces.nsIDOMSerializer );
          dataText = serializer.serializeToString( fragment );
        } catch ( e ) {
          Utils.log( e );
          return;
        }
      }
      try {
        var transferable = Components.Constructor(
          "@mozilla.org/widget/transferable;1",
          "nsITransferable"
        )();
        transferable.init(
          currentWindow.QueryInterface(
            Components.interfaces.nsIInterfaceRequestor
          ).getInterface( Components.interfaces.nsIWebNavigation )
        );
        transferable.addDataFlavor( dataFlavor );
        var textSupportsString = Components.Constructor(
          "@mozilla.org/supports-string;1",
          "nsISupportsString"
        )();
        textSupportsString.data = dataText;
        transferable.setTransferData(
          dataFlavor, textSupportsString, dataText.length * 2 );
        var clipboard =
          Components.classes['@mozilla.org/widget/clipboard;1']
                    .createInstance( Components.interfaces.nsIClipboard );
        clipboard.setData( transferable, null, clipboard.kGlobalClipboard );
      } catch ( e ) {
        Utils.log( e );
      }
      return true;
    };
    
    function doCut() {
      if ( isDesignEditingActive ) {
        designEditor.cut();
      } else if ( isSourceEditingActive ) {
        doCopy();
        doDelete();
      }
      return true;
    };
    
    function doPaste() {
      if ( isDesignEditingActive ) {
        designEditor.paste( 1 );
      } else if ( isSourceEditingActive ) {
        try {
          var clipboard =
            Components.classes['@mozilla.org/widget/clipboard;1']
                      .createInstance( Components.interfaces.nsIClipboard );
          var transferable = Components.Constructor(
            "@mozilla.org/widget/transferable;1",
            "nsITransferable"
          )();
          transferable.init(
            currentWindow.QueryInterface(
              Components.interfaces.nsIInterfaceRequestor
            ).getInterface( Components.interfaces.nsIWebNavigation )
          );
          transferable.addDataFlavor( "text/unicode" );
          clipboard.getData( transferable, clipboard.kGlobalClipboard );
          var strData = {}, strLength = {};
          transferable.getTransferData( "text/unicode", strData, strLength );
          if ( strData ) {
            var textData = strData.value.QueryInterface(
              Components.interfaces.nsISupportsString ).data;
            sourceEditor.getDoc().replaceSelection( textData );
          }
        } catch ( e ) {
          Utils.log( e );
        }
      }
      return true;
    };
    
    function doUndo() {
      var lastUndoState = undoState.getLast();
      var currentUndoState = undoState.getCurrent();
      var count;
      setDocumentEditable( true );
      if ( isDesignEditingActive ) {
        designEditor.undo( 1 );
        if ( currentUndoState.design == lastUndoState.design ) {
          undoState.index--;
          count = lastUndoState.source - undoState.getLast().source;
          for ( var i = 0; i < count; i++ ) {
            sourceEditor.getDoc().undo();
          }
        }
      } else if ( isSourceEditingActive ) {
        sourceEditor.getDoc().undo();
        if ( currentUndoState.source == lastUndoState.source ) {
          undoState.index--;
          count = lastUndoState.design - undoState.getLast().design;
          designEditor.undo( count );
        }
      }
      isParseError = undoState.getLast().error;
      setDocumentEditable( !isParseError );
      return true;
    };
    
    function doRedo() {
      var lastUndoState = undoState.getLast();
      var currentUndoState, count;
      setDocumentEditable( true );
      if ( isDesignEditingActive ) {
        designEditor.redo( 1 );
        currentUndoState = undoState.getCurrent();
        if ( ( ( undoState.index + 1 ) < undoState.modifications.length ) &&
             undoState.modifications[undoState.index + 1].design == currentUndoState.design ) {
          undoState.index++;
          count = undoState.getLast().source - lastUndoState.source;
          for ( var i = 0; i < count; i++ ) {
            sourceEditor.getDoc().redo();
          }
        }
      } else if ( isSourceEditingActive ) {
        sourceEditor.getDoc().redo();
        currentUndoState = undoState.getCurrent();
        if ( ( ( undoState.index + 1 ) < undoState.modifications.length ) &&
             undoState.modifications[undoState.index + 1].source == currentUndoState.source ) {
          undoState.index++;
          count = undoState.getLast().design - lastUndoState.design;
          designEditor.redo( count );
        }
      }
      isParseError = undoState.getLast().error;
      setDocumentEditable( !isParseError );
      return true;
    };
    
    function doDelete() {
      if ( isDesignEditingActive ) {
        designEditor.deleteSelection( null, null );
      } else if ( isSourceEditingActive ) {
        sourceEditor.getDoc().replaceSelection( "", "start" );
      }
      return true;
    };
    
    // EDITOR CONTROLLER
    
    var editorCommands = {
      "znotes_close_command": null,
      "znotes_editorcustomizetoolbar_command": null,
      "znotes_bold_command": null,
      "znotes_italic_command": null,
      "znotes_underline_command": null,
      "znotes_strikethrough_command": null,
      "znotes_forecolor_command": null,
      "znotes_forecolordelete_command": null,
      "znotes_backcolor_command": null,
      "znotes_backcolordelete_command": null,
      "znotes_justifycenter_command": null,
      "znotes_justifyleft_command": null,
      "znotes_justifyright_command": null,
      "znotes_justifyfull_command": null,
      "znotes_subscript_command": null,
      "znotes_superscript_command": null,
      "znotes_indent_command": null,
      "znotes_outdent_command": null,
      "znotes_link_command": null,
      "znotes_unlink_command": null,
      "znotes_removeformat_command": null,
      "znotes_insertorderedlist_command": null,
      "znotes_insertunorderedlist_command": null,
      "znotes_inserthorizontalrule_command": null,
      "znotes_inserttable_command": null,
      "znotes_insertimage_command": null,
      "znotes_insertparagraph_command": null,
      "znotes_sourcebeautify_command": null,
      "znotes_editordebug_command": null,
    };
    
    var editorController = {
      supportsCommand: function( cmd ) {
        return ( cmd in editorCommands );
      },
      isCommandEnabled: function( cmd ) {
        if ( !currentNote || currentNote.isLoading() ) {
          return false;
        }
        switch ( cmd ) {
          case "znotes_close_command":
          case "znotes_editorcustomizetoolbar_command":
            return isDesignEditingActive || isSourceEditingActive;
          case "znotes_bold_command":
          case "znotes_italic_command":
          case "znotes_underline_command":
          case "znotes_strikethrough_command":
          case "znotes_forecolor_command":
          case "znotes_forecolordelete_command":
          case "znotes_backcolor_command":
          case "znotes_backcolordelete_command":
          case "znotes_justifycenter_command":
          case "znotes_justifyleft_command":
          case "znotes_justifyright_command":
          case "znotes_justifyfull_command":
          case "znotes_subscript_command":
          case "znotes_superscript_command":
          case "znotes_indent_command":
          case "znotes_outdent_command":
          case "znotes_link_command":
          case "znotes_unlink_command":
          case "znotes_removeformat_command":
          case "znotes_insertorderedlist_command":
          case "znotes_insertunorderedlist_command":
          case "znotes_inserthorizontalrule_command":
          case "znotes_inserttable_command":
          case "znotes_insertimage_command":
          case "znotes_insertparagraph_command":
          case "znotes_editordebug_command":
            return isDesignEditingActive;
          case "znotes_sourcebeautify_command":
            return isSourceEditingActive && sourceEditor &&
              sourceEditor.getDoc().somethingSelected();
        }
        return false;
      },                                                                           
      doCommand: function( cmd ) {
        switch ( cmd ) {
          case "znotes_editordebug_command":
            doDebug();
            break;
          case "znotes_close_command":
            doClose();
            break;
          case "znotes_bold_command":
            doBold();
            break;
          case "znotes_italic_command":
            doItalic();
            break;
          case "znotes_underline_command":
            doUnderline();
            break;
          case "znotes_strikethrough_command":
            doStrike();
            break;
          case "znotes_forecolor_command":
            doForeColor();
            break;
          case "znotes_forecolordelete_command":
            doForeColorDelete();
            break;
          case "znotes_backcolor_command":
            doBackColor();
            break;
          case "znotes_backcolordelete_command":
            doBackColorDelete();
            break;
          case "znotes_justifycenter_command":
            doJustifyCenter();
            break;
          case "znotes_justifyleft_command":
            doJustifyLeft();
            break;
          case "znotes_justifyright_command":
            doJustifyRight();
            break;
          case "znotes_justifyfull_command":
            doJustifyFull();
            break;
          case "znotes_subscript_command":
            doSubScript();
            break;
          case "znotes_superscript_command":
            doSuperScript();
            break;
          case "znotes_indent_command":
            doIndent();
            break;
          case "znotes_outdent_command":
            doOutdent();
            break;
          case "znotes_link_command":
            doLink();
            break;
          case "znotes_unlink_command":
            doUnlink();
            break;
          case "znotes_removeformat_command":
            doRemoveFormat();
            break;
          case "znotes_insertorderedlist_command":
            doInsertOL();
            break;
          case "znotes_insertunorderedlist_command":
            doInsertUL();
            break;
          case "znotes_inserthorizontalrule_command":
            doInsertHR();
            break;
          case "znotes_inserttable_command":
            doInsertTable();
            break;
          case "znotes_insertimage_command":
            doInsertImage();
            break;
          case "znotes_insertparagraph_command":
            doInsertParagraph();
            break;
          case "znotes_sourcebeautify_command":
            doSourceBeautify();
            break;
          case "znotes_editorcustomizetoolbar_command":
            currentWindow.openDialog(
              "chrome://global/content/customizeToolbar.xul",
              "",
              "chrome,all,dependent,centerscreen",
              isSourceEditingActive ? sourceToolBox : designToolBox
            ).focus();
            break;
        }
        onSelectionChanged();
      },
      onEvent: function( event ) {
      },
      getName: function() {
        return "EDITOR:XHTML";
      },
      getCommand: function( cmd ) {
        return ( cmd in editorCommands ) ?
          currentDocument.getElementById( cmd ) : null;
      },
      updateCommands: function() {
        for ( var cmd in editorCommands ) {
          Common.goUpdateCommand( cmd, this.getId(), currentWindow );
        }
      },
      register: function() {
        try {
          currentWindow.controllers.insertControllerAt( 0, this );
          this.getId = function() {
            return currentWindow.controllers.getControllerId( this );
          };
        } catch ( e ) {
          Components.utils.reportError(
            "An error occurred registering '" + this.getName() +
            "' controller: " + e
          );
        }
      },
      unregister: function() {
        try {
          currentWindow.controllers.removeController( this );
        } catch ( e ) {
        }
      }
    };
    
    function updateEditorCommands() {
      editorController.updateCommands();
    };
    
    // COMMON COMMANDS
    
    function doClose() {
      stop();
      switchMode( "viewer" );
    };
    
    // DESIGN COMMANDS
    
    function doFontFamily() {
      var fontFamily = fontNameMenuList.selectedItem.value;
      designFrame.contentDocument.execCommand( 'fontName', false, fontFamily );
      /*
      designEditor.beginTransaction();
      DOMUtils.processSelection( designEditor.selection,
        function ( element ) {
          setCSSInlineProperty( element, "font-family", fontFamily );
        }
      );
      designEditor.endTransaction();
      */
    };

    function doFontSize() {
      var fontSize = parseInt( fontSizeTextBox.value );
      designEditor.beginTransaction();
      DOMUtils.processSelection( designEditor.selection,
        function ( element ) {
          setCSSInlineProperty( element, "font-size", fontSize + "px" );
        }
      );
      designEditor.endTransaction();
    };
    
    function doForeColor() {
      var params = {
        input: {
          title: getString( "body.colorselectdialog.title" ),
          message: getString( "body.forecolorselectdialog.message" ),
          color: "#000000"
        },
        output: null
      };
      currentWindow.openDialog(
        "chrome://znotes/content/colorselectdialog.xul",
        "",
        "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
        params
      ).focus();
      if ( params.output ) {
        designEditor.beginTransaction();
        DOMUtils.processSelection( designEditor.selection,
          function ( element ) {
            setCSSInlineProperty( element, "color", params.output.color );
          }
        );
        designEditor.endTransaction();
      }
    };
    
    function doForeColorDelete() {
      designEditor.beginTransaction();
      DOMUtils.processSelection( designEditor.selection,
        function ( element ) {
          removeCSSInlineProperty( element, "color" );
        }
      );
      designEditor.endTransaction();
    };
    
    function doBackColor() {
      var params = {
        input: {
          title: getString( "body.colorselectdialog.title" ),
          message: getString( "body.backcolorselectdialog.message" ),
          color: "#000000"
        },
        output: null
      };
      currentWindow.openDialog(
        "chrome://znotes/content/colorselectdialog.xul",
        "",
        "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
        params
      ).focus();
      if ( params.output ) {
        designEditor.beginTransaction();
        DOMUtils.processSelection( designEditor.selection,
          function ( element ) {
            setCSSInlineProperty( element, "background-color",
              params.output.color );
          }
        );
        designEditor.endTransaction();
      }
    };
    
    function doBackColorDelete() {
      designEditor.beginTransaction();
      DOMUtils.processSelection( designEditor.selection,
        function ( element ) {
          removeCSSInlineProperty( element, "background-color" );
        }
      );
      designEditor.endTransaction();
    };
    
    function doBold() {
      designFrame.contentDocument.execCommand( 'bold', false, null );
      /*
      var flag = !getCommandState( "znotes_bold_command" );
      try {
        designEditor.beginTransaction();
        DOMUtils.processSelection( designEditor.selection,
          function ( element ) {
            if ( flag ) {
              setCSSInlineProperty( element, "font-weight", "bold" );
            } else {
              removeCSSInlineProperty( element, "font-weight" );
            }
          }
        );
      } catch ( e ) {
        Utils.log( e );
      } finally {
        designEditor.endTransaction();
      }
      */
    };
    
    function doItalic() {
      designFrame.contentDocument.execCommand( 'italic', false, null );
      /*
      var flag = !getCommandState( "znotes_italic_command" );
      try {
        designEditor.beginTransaction();
        DOMUtils.processSelection( designEditor.selection,
          function ( element ) {
            if ( flag ) {
              setCSSInlineProperty( element, "font-style", "italic" );
            } else {
              removeCSSInlineProperty( element, "font-style" );
            }
          }
        );
      } catch ( e ) {
        Utils.log( e );
      } finally {
        designEditor.endTransaction();
      }
      */
    };
    
    function doUnderline() {
      designFrame.contentDocument.execCommand( 'underline', false, null );
      /*
      var flag = !getCommandState( "znotes_underline_command" );
      try {
        designEditor.beginTransaction();
        DOMUtils.processSelection( designEditor.selection,
          function ( element ) {
            if ( flag ) {
              setCSSInlinePropertyValue( element, "text-decoration", "underline" );
            } else {
              removeCSSInlinePropertyValue( element, "text-decoration", "underline" );
            }
          }
        );
      } catch ( e ) {
        Utils.log( e );
      } finally {
        designEditor.endTransaction();
      }
      */
    };
    
    function doStrike() {
      designFrame.contentDocument.execCommand( 'strikeThrough', false, null );
      /*
      var flag = !getCommandState( "znotes_strikethrough_command" );
      try {
        designEditor.beginTransaction();
        DOMUtils.processSelection( designEditor.selection,
          function ( element ) {
            if ( flag ) {
              setCSSInlinePropertyValue( element, "text-decoration", "line-through" );
            } else {
              removeCSSInlinePropertyValue( element, "text-decoration", "line-through" );
            }
          }
        );
      } catch ( e ) {
        Utils.log( e );
      } finally {
        designEditor.endTransaction();
      }
      */
    };
    
    function doJustifyCenter() {
      designFrame.contentDocument.execCommand( 'justifyCenter', false, null );
      /*
      var flag = !getCommandState( "znotes_justifycenter_command" );
      if ( !flag ) {
        return;
      }
      designEditor.beginTransaction();
      designEditor.align( "center" );
      designEditor.endTransaction();
      */
    };
    
    function doJustifyLeft() {
      designFrame.contentDocument.execCommand( 'justifyLeft', false, null );
      /*
      var flag = !getCommandState( "znotes_justifyleft_command" );
      if ( !flag ) {
        return;
      }
      designEditor.beginTransaction();
      designEditor.align( "left" );
      designEditor.endTransaction();
      */
    };
    
    function doJustifyRight() {
      designFrame.contentDocument.execCommand( 'justifyRight', false, null );
      /*
      var flag = !getCommandState( "znotes_justifyright_command" );
      if ( !flag ) {
        return;
      }
      designEditor.beginTransaction();
      designEditor.align( "right" );
      designEditor.endTransaction();
      */
    };
    
    function doJustifyFull() {
      designFrame.contentDocument.execCommand( 'justifyFull', false, null );
      /*
      var flag = !getCommandState( "znotes_justifyfull_command" );
      if ( !flag ) {
        return;
      }
      designEditor.beginTransaction();
      designEditor.align( "justify" );
      designEditor.endTransaction();
      */
    };
    
    function doSubScript() {
      designFrame.contentDocument.execCommand( 'subscript', false, null );
      /*
      var flag = !getCommandState( "znotes_subscript_command" );
      try {
        designEditor.beginTransaction();
        DOMUtils.processSelection( designEditor.selection,
          function ( element ) {
            var position = getElementPositionInParent( element );
            if ( flag ) {
            } else {
            }
          }
        );
      } catch ( e ) {
        Utils.log( e );
      } finally {
        designEditor.endTransaction();
      }
      */
    };
    
    function doSuperScript() {
      designFrame.contentDocument.execCommand( 'superscript', false, null );
      /*
      var flag = !getCommandState( "znotes_superscript_command" );
      try {
        designEditor.beginTransaction();
        DOMUtils.processSelection( designEditor.selection,
          function ( element ) {
            var position = getElementPositionInParent( element );
            if ( flag ) {
            } else {
            }
          }
        );
      } catch ( e ) {
        Utils.log( e );
      } finally {
        designEditor.endTransaction();
      }
      */
    };

    function doRemoveFormat() {
      designFrame.contentDocument.execCommand( 'removeFormat', false, null );
      /*
      designEditor.beginTransaction();
      DOMUtils.processSelection( designEditor.selection,
        function ( element ) {
          designEditor.removeAttributeOrEquivalent( element, "style", false );
        }
      );
      designEditor.endTransaction();
      */
    };
    
    function doIndent() {
      designFrame.contentDocument.execCommand( 'indent', false, null );
      /*
      designEditor.beginTransaction();
      designEditor.indent( "indent" );
      designEditor.endTransaction();
      */
    };
    
    function doOutdent() {
      designFrame.contentDocument.execCommand( 'outdent', false, null );
      /*
      designEditor.beginTransaction();
      designEditor.indent( "outdent" );
      designEditor.endTransaction();
      */
    };

    function doUnlink() {
      designFrame.contentDocument.execCommand( 'unLink', false, null );
      /*
      try {
        designEditor.beginTransaction();
        var element = designEditor.getSelectedElement( "href" );
        var position = getElementPositionInParent( element );
        while ( element.lastChild ) {
          designEditor.insertNode(
            element.lastChild.cloneNode( true ),
            element.parentNode,
            position
          );
          designEditor.deleteNode( element.lastChild );
        }
      } catch ( e ) {
        Utils.log( e );
      } finally {
        designEditor.endTransaction();
      }
      */
    };
    
    function doInsertOL() {
      designFrame.contentDocument.execCommand( 'insertOrderedList', false, null );
      /*
      var flag = !getCommandState( "znotes_insertorderedlist_command" );
      try {
        designEditor.beginTransaction();
        if ( flag ) {
          // A | a | I | i | 1
          designEditor.makeOrChangeList( "ol", false, "1" );
        } else {
          designEditor.removeList( "ol" );
        }
      } catch ( e ) {
        Utils.log( e );
      } finally {
        designEditor.endTransaction();
      }
      */
    };
    
    function doInsertUL() {
      designFrame.contentDocument.execCommand( 'insertUnorderedList', false, null );
      /*
      var flag = !getCommandState( "znotes_insertunorderedlist_command" );
      try {
        designEditor.beginTransaction();
        if ( flag ) {
          // disc | circle | square
          designEditor.makeOrChangeList( "ul", false, "disc" );
        } else {
          designEditor.removeList( "ul" );
        }
      } catch ( e ) {
        Utils.log( e );
      } finally {
        designEditor.endTransaction();
      }
      */
    };
    
    function doInsertHR() {
      designFrame.contentDocument.execCommand( 'insertHorizontalRule', false, null );
      /*
      designEditor.beginTransaction();
      var aHR = designEditor.createElementWithDefaults( "hr" );
      designEditor.insertElementAtSelection( aHR, true );
      designEditor.endTransaction();
      */
    };

    function doInsertParagraph() {
      designFrame.contentDocument.execCommand( 'insertParagraph', false, null );
      /*
      designEditor.beginTransaction();
      designEditor.setParagraphFormat( "p" );
      designEditor.endTransaction();
      */
    };

    function doBlockFormat() {
      var aBlockFormat = formatBlockMenuList.selectedItem.value;
      designEditor.beginTransaction();
      designEditor.setParagraphFormat( aBlockFormat );
      designEditor.endTransaction();
    };
    
    function doLink() {
      var params = {
        input: {
          title: getString( "editor.addLink.title" ),
          caption: " " + getString( "editor.addLink.caption" ) + " ",
          value: "http://"
        },
        output: null
      };
      currentWindow.openDialog(
        "chrome://znotes/content/inputdialog.xul",
        "",
        "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
        params
      ).focus();
      if ( !params.output ) {
        return true;
      }
      var url = params.output.result;
      url = url.replace(/(^\s+)|(\s+$)/g, "");
      if ( url.length == 0 ) {
        return true;
      }
      designEditor.beginTransaction();
      var anAnchor = designEditor.createElementWithDefaults( "a" );
      designEditor.setAttributeOrEquivalent( anAnchor, "href", encodeURI( url ), true );
      designEditor.insertLinkAroundSelection( anAnchor );
      designEditor.endTransaction();
    };
    
    function doInsertTable() {
      designEditor.beginTransaction();
      var aTable = designEditor.createElementWithDefaults( "table" );
      designEditor.setAttributeOrEquivalent( aTable, "border", "1", true );
      for ( var row = 0; row < 2; row++ ) {
        var aRow = designEditor.createElementWithDefaults( "tr" );
        for ( var col = 0; col < 3; col++ ) {
          var aColumn = designEditor.createElementWithDefaults( "td" );
          designEditor.setAttributeOrEquivalent( aColumn, "width", "100", true );
          aRow.appendChild( aColumn );
        }
        aTable.appendChild( aRow );
      }
      designEditor.insertElementAtSelection( aTable, true );
      designEditor.endTransaction();
      designEditor.selectElement( aTable );
    };
    
    function doInsertImage() {
      var params = {
        input: {
          title: getString( "editor.addImage.title" ),
          note: currentNote
        },
        output: null
      };
      currentWindow.openDialog(
        "chrome://znotes/content/imageselectdialog.xul",
        "",
        "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
        params
      ).focus();
      if ( !params.output ) {
        return true;
      }
      var url = params.output.result;
      url = url.replace(/(^\s+)|(\s+$)/g, "");
      if ( url.length == 0 ) {
        return true;
      }
      designEditor.beginTransaction();
      var anImage = designEditor.createElementWithDefaults( "img" );
      designEditor.setAttributeOrEquivalent( anImage, "src", encodeURI( url ), true );
      designEditor.insertElementAtSelection( anImage, true );
      var width = parseInt( anImage.width );
      var height = parseInt( anImage.height );
      if ( ( height > width ) && ( height > 100 ) ) {
        designEditor.setAttributeOrEquivalent( anImage, "height", 100, true );
      } else if ( ( height <= width ) && ( width > 100 ) ) {
        designEditor.setAttributeOrEquivalent( anImage, "width", 100, true );
      }
      designEditor.endTransaction();
      designEditor.selectElement( anImage );
    };
    
    // SOURCE COMMANDS
    
    function doSourceBeautify() {
      sourceEditor.autoFormatRange(
        sourceEditor.getCursor( "start" ),
        sourceEditor.getCursor( "end" )
      );
    };

    // HELPERS

    function isInEditorWindow() {
      var focusedWindow =
        currentWindow.top.document.commandDispatcher.focusedWindow;
      return ( focusedWindow == designFrame.contentWindow ||
               focusedWindow == sourceFrame.contentWindow );
    };
    
    function getCommandState( cmd ) {
      return Common.goGetCommandAttribute( cmd, "checked", currentWindow );
    };
    
    function setCommandState( cmd, flag ) {
      Common.goSetCommandAttribute( cmd, "checked", flag, currentWindow );
      Common.goSetCommandAttribute( cmd, "checkState", flag, currentWindow );
    };
    
    function isDesignFrameFocused() {
      return currentDocument.activeElement == designFrame;
    };

    function isSourceFrameFocused() {
      return currentDocument.activeElement == sourceFrame;
    };

    function isDesignModified() {
      return undoState.getLast().design != undoState.getCurrent().design;
    };

    function isSourceModified() {
      return undoState.getLast().source != undoState.getCurrent().source;
    };
    
    function notifyStateListener( event ) {
      for ( var i = 0; i < listeners.length; i++ ) {
        if ( listeners[i][ "on" + event.type ] ) {
          listeners[i][ "on" + event.type ]( event );
        }
      }
    };
    
    function getEditorString( name ) {
      return stringsBundle.getString( name );
    };
    
    function getString( name ) {
      return Utils.STRINGS_BUNDLE.getString( name );
    };
    
    function getFormattedString( name, values ) {
      return Utils.STRINGS_BUNDLE.getFormattedString( name, values );
    };
    
    function createFontNameMenuList() {
      var fontNameArray = Utils.getFontNameArray();
      while ( fontNameMenuPopup.firstChild ) {
        fontNameMenuPopup.removeChild( fontNameMenuPopup.firstChild );
      }
      var fontFamily, menuItem;
      for ( var i = 0; i < fontNameArray.length; i++ ) {
        fontFamily = fontNameArray[i];
        menuItem = currentDocument.createElement( "menuitem" );
        menuItem.setAttribute( "label", fontFamily );
        menuItem.setAttribute( "value", fontFamily );
        menuItem.style.setProperty( 'font-family', "'" + fontFamily + "'" );
        menuItem.addEventListener( "command", onFontNameChange, false );
        fontNameMenuPopup.appendChild( menuItem );
      }
    };
    
    function createFormatBlockObject() {
      formatBlockObject = {};
      formatBlockObject[ getEditorString( "formatblock.text" ) ] = "";
      formatBlockObject[ getEditorString( "formatblock.paragraph" ) ] = "p";
      formatBlockObject[ getEditorString( "formatblock.heading1" ) ] = "h1";
      formatBlockObject[ getEditorString( "formatblock.heading2" ) ] = "h2";
      formatBlockObject[ getEditorString( "formatblock.heading3" ) ] = "h3";
      formatBlockObject[ getEditorString( "formatblock.heading4" ) ] = "h4";
      formatBlockObject[ getEditorString( "formatblock.heading5" ) ] = "h5";
      formatBlockObject[ getEditorString( "formatblock.heading6" ) ] = "h6";
      formatBlockObject[ getEditorString( "formatblock.address" ) ] = "address";
      formatBlockObject[ getEditorString( "formatblock.formatted" ) ] = "pre";
      formatBlockObject[ getEditorString( "formatblock.blockquote" ) ] =
        "blockquote";
    };
    
    function createFormatBlockMenuList() {
      while ( formatBlockMenuPopup.firstChild ) {
        formatBlockMenuPopup.removeChild( formatBlockMenuPopup.firstChild );
      }
      var blockFormat, menuItem;
      for ( var name in formatBlockObject ) {
        blockFormat = formatBlockObject[name];
        menuItem = currentDocument.createElement( "menuitem" );
        menuItem.setAttribute( "label", name );
        menuItem.setAttribute( "value", blockFormat );
        menuItem.setAttribute( "description", blockFormat );
        menuItem.addEventListener( "command", onFormatBlockChange, false );
        formatBlockMenuPopup.appendChild( menuItem );
      }
    };
    
    function setBackgroundColor() {
      if ( !currentNote ) {
        return;
      }
      var tagColor = currentBookTagList.getNoTag().getColor();
      var tagID = currentNote.getMainTag();
      if ( tagID ) {
        tagColor = currentBookTagList.getTagById( tagID ).getColor();
      }
      var body = designFrame.contentDocument.body;
      var color = body && body.style ?
        body.style.getPropertyValue( 'background-color' ) :
        "";
      if ( !designFrame.hasAttribute( "body.backgroundColor" ) ) {
        designFrame.setAttribute( "body.backgroundColor", color );
      }
      if ( Utils.IS_REPLACE_BACKGROUND ) {
        if ( body && body.style ) {
          body.style.setProperty( 'background-color', tagColor );
        }
      } else {
        tagColor = designFrame.getAttribute( "body.backgroundColor" );
        if ( tagColor ) {
          if ( body && body.style ) {
            body.style.setProperty( 'background-color', tagColor );
          }
        } else {
          if ( body && body.style ) {
            body.style.removeProperty( 'background-color' );
            if ( body.style.length == 0 ) {
              body.removeAttribute( "style" );
            }
          }
        }
      }
    };
 
    function removeCSSInlineProperty( element, name ) {
      var cssText, style = DOMUtils.getElementStyle( element );
      if ( style ) {
        designEditor.removeAttributeOrEquivalent(
          element, "style", false
        );
      } else {
        style = {};
      }
      if ( name in style ) {
        delete style[name];
      }
      cssText = "";
      for ( var propertyName in style ) {
        if ( cssText ) {
          cssText += " ";
        }
        cssText += propertyName + ": " + style[propertyName].value;
        if ( style[propertyName].priority ) {
          cssText += " !" + style[propertyName].priority;
        }
        cssText += ";";
      }
      if ( cssText ) {
        designEditor.setAttributeOrEquivalent(
          element, "style", cssText, false
        );
      }
    };

    function setCSSInlineProperty( element, name, value, priority ) {
      var cssText, style = DOMUtils.getElementStyle( element );
      if ( style ) {
        designEditor.removeAttributeOrEquivalent(
          element, "style", false
        );
      } else {
        style = {};
      }
      if ( !( name in style ) ) {
        style[name] = {};
      }
      style[name].value = value;
      if ( priority !== undefined ) {
        style[name].priority = priority;
      }
      cssText = "";
      for ( var propertyName in style ) {
        if ( cssText ) {
          cssText += " ";
        }
        cssText += propertyName + ": " + style[propertyName].value;
        if ( style[propertyName].priority ) {
          cssText += " !" + style[propertyName].priority;
        }
        cssText += ";";
      }
      designEditor.setAttributeOrEquivalent(
        element, "style", cssText, false
      );
    };
    
    function removeCSSInlinePropertyValue( element, name, value ) {
      var propertyName, propertyValue, index, cssText;
      var style = DOMUtils.getElementStyle( element );
      if ( style ) {
        designEditor.removeAttributeOrEquivalent(
          element, "style", false
        );
      } else {
        style = {};
      }
      if ( name in style ) {
        propertyValue = style[name].value.split( /\s+/ );
        index = propertyValue.indexOf( value );
        if ( index != -1 ) {
          propertyValue.splice( index, 1 );
          if ( propertyValue.length ) {
            style[name].value = propertyValue.join( " " );
          } else {
            delete style[name];
          }
        }
      }
      cssText = "";
      for ( var propertyName in style ) {
        if ( cssText ) {
          cssText += " ";
        }
        cssText += propertyName + ": " + style[propertyName].value;
        if ( style[propertyName].priority ) {
          cssText += " !" + style[propertyName].priority;
        }
        cssText += ";";
      }
      if ( cssText ) {
        designEditor.setAttributeOrEquivalent(
          element, "style", cssText, false
        );
      }
    };
    
    function setCSSInlinePropertyValue( element, name, value, priority ) {
      var style = DOMUtils.getElementStyle( element );
      if ( style ) {
        designEditor.removeAttributeOrEquivalent(
          element, "style", false
        );
      } else {
        style = {};
      }
      if ( !( name in style ) ) {
        style[name] = {
          value: value,
          priority: ""
        };
      } else {
        propertyValue = style[name].value.split( /\s+/ );
        index = propertyValue.indexOf( value );
        if ( index == -1 ) {
          propertyValue.push( value );
          style[name].value = propertyValue.join( " " );
        }
      }
      if ( priority !== undefined ) {
        style[name].priority = priority;
      }
      var cssText = "";
      for ( var propertyName in style ) {
        if ( cssText ) {
          cssText += " ";
        }
        cssText += propertyName + ": " + style[propertyName].value;
        if ( style[propertyName].priority ) {
          cssText += " !" + style[propertyName].priority;
        }
        cssText += ";";
      }
      designEditor.setAttributeOrEquivalent(
        element, "style", cssText, false
      );
    };
    
    function setDocumentEditable( isDocumentEditable ) {
      var nsIPlaintextEditor = Components.interfaces.nsIPlaintextEditor;
      var readOnlyMask = nsIPlaintextEditor.eEditorReadonlyMask;
      var flags = designEditor.flags;
      designEditor.flags =
        isDocumentEditable ? flags &= ~readOnlyMask : flags | readOnlyMask;
    };
    
    function getTextProperty( property, attribute, value, firstHas, anyHas, allHas ) {
      try {
        var atom = gAtomService.getAtom( property );
        designEditor.getInlineProperty( atom, attribute, value, firstHas, anyHas, allHas );
      } catch ( e ) {
      }
    };

    function setTextProperty( property, attribute, value ) {
      try {
        var atom = gAtomService.getAtom( property );
        designEditor.setInlineProperty( atom, attribute, value );
      } catch( e ) {
      }
    };

    function removeTextProperty( property, attribute ) {
      try {
        var atom = gAtomService.getAtom( property );
        designEditor.removeInlineProperty( atom, attribute );
      } catch( e ) {
      }
    };

    function getElementPositionInParent( element ) {
      var result = 0;
      var node = element.parentNode.firstChild;
      while ( node && node != element ) {
        node = node.nextSibling;
        result++;
      }
      return result;
    };
    
    // TOOLBAR
    
    function restoreToolbarCurrentSet() {
      var currentSet, docName = self.getDocument().getName();
      //
      currentSet = designToolBar1.getAttribute( "defaultset" );
      if ( prefsBundle.hasPref( "designToolbar1CurrentSet." + docName ) ) {
        currentSet = prefsBundle.getCharPref( "designToolbar1CurrentSet." +
          docName );
      }
      designToolBar1.setAttribute( "currentset", currentSet );
      designToolBar1.currentSet = currentSet;
      //
      currentSet = designToolBar2.getAttribute( "defaultset" );
      if ( prefsBundle.hasPref( "designToolbar2CurrentSet." + docName ) ) {
        currentSet = prefsBundle.getCharPref( "designToolbar2CurrentSet." +
          docName );
      }
      designToolBar2.setAttribute( "currentset", currentSet );
      designToolBar2.currentSet = currentSet;
      //
      currentSet = sourceToolBar1.getAttribute( "defaultset" );
      if ( prefsBundle.hasPref( "sourceToolbar1CurrentSet." + docName ) ) {
        currentSet = prefsBundle.getCharPref( "sourceToolbar1CurrentSet." +
          docName );
      }
      sourceToolBar1.setAttribute( "currentset", currentSet );
      sourceToolBar1.currentSet = currentSet;
      //
      currentSet = sourceToolBar2.getAttribute( "defaultset" );
      if ( prefsBundle.hasPref( "sourceToolbar2CurrentSet." + docName ) ) {
        currentSet = prefsBundle.getCharPref( "sourceToolbar2CurrentSet." +
          docName );
      }
      sourceToolBar2.setAttribute( "currentset", currentSet );
      sourceToolBar2.currentSet = currentSet;
    };
    
    function saveToolbarCurrentSet() {
      var currentSet, docName = self.getDocument().getName();
      currentSet = designToolBar1.currentSet;
      if ( currentSet != "__empty" ) {
        prefsBundle.setCharPref( "designToolbar1CurrentSet." + docName,
          currentSet );
      }
      currentSet = designToolBar2.currentSet;
      if ( currentSet != "__empty" ) {
        prefsBundle.setCharPref( "designToolbar2CurrentSet." + docName,
          currentSet );
      }
      currentSet = sourceToolBar1.currentSet;
      if ( currentSet != "__empty" ) {
        prefsBundle.setCharPref( "sourceToolbar1CurrentSet." + docName,
          currentSet );
      }
      currentSet = sourceToolBar2.currentSet;
      if ( currentSet != "__empty" ) {
        prefsBundle.setCharPref( "sourceToolbar2CurrentSet." + docName,
          currentSet );
      }
    };

    // DEBUG
    
    function doDebug() {
      var focusedElement = getSelectionElement();
      if ( !focusedElement ) {
        return;
      }
      Utils.log(
        ( focusedElement.flag ? "[1] " : "[ ] " ) +
        "name: '" + focusedElement.node.nodeName + "'" +
        ( focusedElement.node.id ? ", id: '" + focusedElement.node.id + "'" : "" )
      );
      var selectionContainer = designEditor.getSelectionContainer();
      if ( selectionContainer != focusedElement.node ) {
        Utils.log(
          "selectionContainer: '" + selectionContainer.nodeName +
          "', id: '" + selectionContainer.id + "'"
        );
      }
      /*
      var firstHas = { value: null };
      var anyHas = { value: null };
      var allHas = { value: null };
      getTextProperty( "text", "decoration", "underline", firstHas, anyHas, allHas );
      Utils.log( "first: " + firstHas.value + ", any: " + anyHas.value + ", all: " + allHas.value );
      */
    };
    
    // CONTROLS
    
    function updateDesignControls() {
      var focusedElement = getSelectionElement();
      if ( !focusedElement ) {
        return;
      }
      var computedStyle =
        currentWindow.getComputedStyle( focusedElement.node, null );
      // font-size ( inherited ) computed-value: absolute length
      var fontSize = computedStyle.fontSize;
      if ( fontSize ) {
        fontSize = parseInt(
          fontSize.substring( 0, fontSize.indexOf( "px" ) )
        );
      } else {
        fontSize = "";
      }
      fontSizeTextBox.value = fontSize;
      // font-style ( inherited ) computed-value: as specified
      var fontStyle = computedStyle.fontStyle;
      setCommandState( "znotes_italic_command", fontStyle == "italic" );
      // font-weight ( inherited ) computed-value: 100-900
      var fontWeight = computedStyle.fontWeight;
      setCommandState( "znotes_bold_command", fontWeight == "700" );
      // text-decoration ( no inherited ) computed value: as specified
      var textDecoration = DOMUtils.getElementTextDecoration( focusedElement.node );
      var values = { underline: false, linethrough: false };
      values.underline = ( textDecoration.indexOf( "underline" ) != -1 );
      values.linethrough = ( textDecoration.indexOf( "line-through" ) != -1 );
      setCommandState( "znotes_underline_command", values.underline );
      setCommandState( "znotes_strikethrough_command", values.linethrough );
      // subscript
      var nodeName, found = false;
      var element = focusedElement.node;
      while ( element && element.nodeType == DOMUtils.NODE.ELEMENT_NODE ) {
        nodeName = element.nodeName.toLowerCase();
        if ( nodeName == "sub" ) {
          found = true;
          break;
        }
        element = element.parentNode;
      }
      setCommandState( "znotes_subscript_command", found );
      // superscript
      var nodeName, found = false;
      var element = focusedElement.node;
      while ( element && element.nodeType == DOMUtils.NODE.ELEMENT_NODE ) {
        nodeName = element.nodeName.toLowerCase();
        if ( nodeName == "sup" ) {
          found = true;
          break;
        }
        element = element.parentNode;
      }
      setCommandState( "znotes_superscript_command", found );
      // font-family
      var fontNameArray = Utils.getFontNameArray();
      var fontMapping = Utils.getDefaultFontMapping();
      var mixed = { value: null };
      fontFamily = designEditor.getFontFaceState( mixed );
      var name, index = fontNameArray.indexOf( fontMapping.defaultValue );
      if ( !mixed.value ) {
        fontFamily = fontFamily ?
          fontFamily.split( /\s*,\s*/ ) : [ fontMapping.defaultName ];
        index = -1;
        for ( var i = 0; i < fontFamily.length; i++ ) {
          name = fontFamily[i];
          if ( name.charAt( 0 ) == "'" || name.charAt( 0 ) == '"' ) {
            name = name.substring( 1, name.length - 1 );
          }
          if ( name in fontMapping.generics ) {
            name = fontMapping.generics[ name ];
          }
          index = fontNameArray.indexOf( name );
          if ( index != -1 ) {
            break;
          }
        }
      }
      fontNameMenuList.selectedIndex = index;
      // text-align
      var values = { left: false, center: false, right: false, full: false };
      mixed = { value: null };
      var align = { value: null };
      designEditor.getAlignment( mixed, align );
      if ( !mixed.value ) {
        switch ( align.value ) {
          case nsIHTMLEditor.eLeft:
            values.left = true;
            break;
          case nsIHTMLEditor.eRight:
            values.right = true;
            break;
          case nsIHTMLEditor.eCenter:
            values.center = true;
            break;
          case nsIHTMLEditor.eJustify:
            values.full = true;
            break;
        }
      }
      setCommandState( "znotes_justifyleft_command", values.left );
      setCommandState( "znotes_justifycenter_command", values.center );
      setCommandState( "znotes_justifyright_command", values.right );
      setCommandState( "znotes_justifyfull_command", values.full );
      // format block
      mixed = { value: null };
      var state = designEditor.getParagraphState( mixed );
      var found = false, index = 0;
      if ( !mixed.value ) {
        for ( var name in formatBlockObject ) {
          if ( formatBlockObject[name] == state ) {
            found = true;
            break;
          }
          index++;
        }
      }
      formatBlockMenuList.selectedIndex = ( found ? index : 0 );
      // colors
      var iconSize = ( currentStyle.iconsize == "small" ) ? 16 : 24;
      mixed = { value: null };
      var bgColor = designEditor.getHighlightColorState( mixed );
      var fgColor = designEditor.getFontColorState( mixed );
      var bColor = designEditor.getBackgroundColorState( mixed );
      backColorButton.setAttribute( "image",
        Utils.makeBackColorImage( bgColor, iconSize ) );
      foreColorButton.setAttribute( "image",
        Utils.makeForeColorImage( fgColor, iconSize, bgColor ) );
      // indent && outdent
      var canIndent = { value: null };
      var canOutdent = { value: null };
      designEditor.getIndentState( canIndent, canOutdent );
      Common.goSetCommandEnabled( "znotes_indent_command", canIndent.value, currentWindow );
      Common.goSetCommandEnabled( "znotes_outdent_command", canOutdent.value, currentWindow );
      // ol && ul
      mixed = { value: null };
      var ol = { value: null };
      var ul = { value: null };
      var dl = { value: null };
      designEditor.getListState( mixed, ol, ul, dl );
      setCommandState( "znotes_insertorderedlist_command", ol.value );
      setCommandState( "znotes_insertunorderedlist_command", ul.value );
      mixed = { value: null };
      var li = { value: null };
      var dt = { value: null };
      var dd = { value: null };
      designEditor.getListItemState( mixed, li, dt, dd );
    };
    
    function updateSourceControls() {
    };
    
    function updateControls() {
      if ( isDesignEditingActive ) {
        if ( !isParseError ) {
          updateDesignControls();
        }
      } else if ( isSourceEditingActive ) {
        updateSourceControls();
      }
    };
    
    function updateCommandsVisibility() {
      Common.goSetCommandHidden( "znotes_editordebug_command", !Utils.IS_DEBUG_ENABLED, currentWindow );
    };
    
    // SELECTION

    function getSelectionElement() {
      var selection = designEditor.selection;
      if ( !selection || selection.rangeCount == 0 ) {
        return null;
      }
      var result = {
        node: null,
        flag: false
      };
      var range = selection.getRangeAt( 0 );
      if ( selection.isCollapsed ) {
        result.node = range.startContainer;      
      } else {
        var rangeCount = selection.rangeCount;
        if ( rangeCount == 1 ) {
          result.node = designEditor.getSelectedElement( "" );
          if ( !result.node &&
               range.startContainer.nodeType == DOMUtils.NODE.TEXT_NODE &&
               range.startOffset == range.startContainer.length &&
               range.endContainer.nodeType == DOMUtils.NODE.TEXT_NODE &&
               range.endOffset == range.endContainer.length &&
               range.endContainer.nextSibling == null &&
               range.startContainer.nextSibling == range.endContainer.parentNode
             ) {
            result.node = range.endContainer.parentNode;
          }
          if ( !result.node ) {
            result.node = range.commonAncestorContainer;
          } else {
            result.flag = true;
          }
        } else {
          var container = range.startContainer;
          for ( var i = 1; i < rangeCount; i++ ) {
            range = selection.getRangeAt( i );
            if ( container != range.startContainer ) {
              container = container.parentNode;
              break;
            }
          }
          result.node = container;
        }
      }
      while ( result.node &&
              result.node.nodeType != DOMUtils.NODE.ELEMENT_NODE ) {
        result.node = result.node.parentNode;
      }
      while ( result.node && (
              result.node.hasAttribute( "_moz_editor_bogus_node" ) ||
              designEditor.isAnonymousElement( result.node ) ) ) {
        result.node = result.node.parentNode;
      }
      return result;
    };
    
    function onSelectionChanged( event ) {
      currentWindow.setTimeout(
        function() {
          if ( isSourceEditingActive ) {
            updateSourceEditorDirtyState();
            sourceEditor.focus();
          } else if ( isDesignEditingActive ) {
            updateDesignEditorDirtyState();
            designFrame.contentWindow.focus();
          } else {
            designFrame.focus();
          }
          updateCommandsVisibility();
          updateEditCommands();
          updateSpellCommands();
          updateEditorCommands();
          updateControls();
        },
        0
      );
    };
    
    // TAG LIST EVENTS
    
    function onTagChanged( e ) {
      var aTag = e.data.changedTag;
      if ( currentNote && !isDesignEditingActive && !isSourceEditingActive ) {
        setBackgroundColor();
      }
    };
    
    function onTagDeleted( e ) {
      var aTag = e.data.deletedTag;
      if ( currentNote && !isDesignEditingActive && !isSourceEditingActive ) {
        setBackgroundColor();
      }
    };
    
    // NOTE EVENTS
    
    function onNoteMainTagChanged( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.changedNote;
      var oldTag = e.data.oldValue;
      var newTag = e.data.newValue;
      if ( currentNote && currentNote == aNote &&
           !isDesignEditingActive && !isSourceEditingActive ) {
        setBackgroundColor();
      }
    };
    
    function onNoteDeleted( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.deletedNote;
      if ( currentNote && currentNote == aNote ) {
        done();
        currentNote = null;
        currentDocument = null;
        currentWindow = null;
      }
    };
    
    // @@@@ 1 onNoteMainContentChanged
    function onNoteMainContentChanged( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.changedNote;
      var oldContent = e.data.oldValue;
      var newContent = e.data.newValue;
      var status = {};
      if ( currentNote && aNote == currentNote ) {
        if ( !isDesignEditingActive && !isSourceEditingActive ) {
          load();
          setBackgroundColor();
          return;
        }
        var reloadFlag = true;
        if ( isEditorDirty ) {
          reloadFlag = false;
          var params = {
            input: {
              title: getString( "editor.confirmReload.title" ),
              message1: getFormattedString( "editor.confirmReload.message1", [ currentNote.getName() ] ),
              message2: getString( "editor.confirmReload.message2" )
            },
            output: null
          };
          currentWindow.openDialog(
            "chrome://znotes/content/confirmdialog.xul",
            "",
            "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
            params
          ).focus();
          if ( params.output ) {
            reloadFlag = true;
          }
        }
        if ( reloadFlag ) {
          cancel( true );
        }
      }
    };
 
    // VIEW EVENTS
 
    function onFontNameChange( event ) {
      doFontFamily();
      designFrame.focus();
      return true;
    };
    
    function onFormatBlockChange( event ) {
      doBlockFormat();
      designFrame.focus();
      return true;
    };
    
    function onFontSizeTextBoxChange( event ) {
      doFontSize();
      designFrame.focus();
      return true;
    };
    
    function onFontSizeTextBoxFocus( event ) {
      fontSizeTextBox.select();
      return true;
    };
    
    function onEditorTabSelect( event ) {
      switch ( editorTabs.selectedIndex ) {
        case 0:
          showDesign();
          break;
        case 1:
          showSource();
          break;
      }
      return true;
    };
    
    function onSourceWindowResize( event ) {
      var sourceWindowInnerHeight = sourceWindow.innerHeight;
      if ( !sourceEditorHScrollbarHeight ) {
        var frameDocumentOffsetHeight =
          sourceWindow.document.documentElement.offsetHeight;
        var sourceEditorWrapperElementHeight =
          sourceEditor.getWrapperElement().style.height;
        var pxIndex = sourceEditorWrapperElementHeight.indexOf( "px" );
        pxIndex = pxIndex < 0 ?
          sourceEditorWrapperElementHeight.length : pxIndex;
        sourceEditorWrapperElementHeight =
          parseInt( sourceEditorWrapperElementHeight.substring( 0, pxIndex ) );
        sourceEditorHScrollbarHeight =
          frameDocumentOffsetHeight - sourceEditorWrapperElementHeight;
      }
      var updatedSourceEditorHeight =
        sourceWindowInnerHeight - sourceEditorHScrollbarHeight;
      if ( sourceEditorHeight != updatedSourceEditorHeight ) {
        sourceEditorHeight = updatedSourceEditorHeight;
        sourceEditor.setSize( null, sourceEditorHeight );
        sourceEditor.refresh();
        sourceEditor.focus();
      }
    };
    
    function designClickHandler( event ) {
      if ( currentMode == "editor" ) {
        return true;
      }
      return Utils.clickHandler( event );
    };
    
    // DESIGN EDITOR EVENTS
    
    function updateDesignEditorDirtyState() {
      if ( !designEditor ) {
        return;
      }
      var isEnabled, canUndo;
      isEnabled = {};
      canUndo = {};
      designEditor.canUndo( isEnabled, canUndo );
      documentStateListener.NotifyDocumentStateChanged( canUndo.value );
    };
    
    function onDesignDocumentStateChanged( nowDirty ) {
      switchState( !!nowDirty );
      return true;
    };

    // SOURCE EDITOR EVENTS
    
    function updateSourceEditorDirtyState() {
      if ( !sourceEditor ) {
        return;
      }
      onSourceDocumentStateChanged( sourceEditor.getDoc().historySize().undo );
    };

    function onSourceEditorChange( instance, changeObj ) {
      onSourceDocumentStateChanged( true );
    };
    
    function onSourceDocumentStateChanged( nowDirty ) {
      switchState( !!nowDirty );
      return true;
    };
    
    // PREFERENCES
    
    function loadPrefs() {
      currentPreferences = self.getPreferences();
    };
    
    function onDocumentPreferencesChanged( event ) {
    };

    function onEditorPreferencesChanged( event ) {
      currentPreferences = event.data.preferences;
      if ( isDesignEditingActive ) {
        setCommandState( "znotes_spellcheckenabled_command",
          spellCheckerUI && currentPreferences.isSpellcheckEnabled );
        designEditor.setSpellcheckUserOverride(
          spellCheckerUI && currentPreferences.isSpellcheckEnabled );
      }
      updateKeyset();
    };
    
    // DESIGN & SOURCE
    
    function loadDesign() {
      var data = sourceEditor.getValue();
      var doc = self.getDocument();
      var obj = doc.parseFromString(
        data,
        currentNote.getURI(),
        currentNote.getBaseURI(),
        currentNote.getName()
      );
      var dom = obj.dom;
      isParseError = !obj.result;
      isParseModified = obj.changed;
      var designDocument;
      if ( currentMode == "editor" ) {
        designDocument = designEditor.document;
        try {
          designEditor.beginTransaction();
          // The following code is very very bad!
          // Only the changed portions must be affected!
          // diff/patch must be applied!
          while ( designDocument.firstChild ) {
            designEditor.deleteNode( designDocument.firstChild );
          }
          var node = dom.firstChild, position = 0;
          while ( node ) {
            designEditor.insertNode(
              designDocument.importNode( node, true ),
              designDocument,
              position++
            );
            node = node.nextSibling;
          }
        } catch ( e ) {
          Utils.log( e );
        } finally {
          designEditor.endTransaction();
        }
        undoState.modifications[++undoState.index] = undoState.getCurrent();
      } else {
        designDocument = designFrame.contentDocument;
        try {
          while ( designDocument.firstChild ) {
            designDocument.removeChild( designDocument.firstChild );
          }
          var node = dom.firstChild;
          while ( node ) {
            designDocument.appendChild(
              designDocument.importNode( node, true )
            );
            node = node.nextSibling;
          }
        } catch ( e ) {
          Utils.log( e );
        }
      }
    };

    function loadSource() {
      if ( isParseError ) {
        return;
      }
      var doc = self.getDocument();
      var dom = designFrame.contentDocument;
      if ( currentMode == "editor" ) {
        dom = designEditor.document;
      }
      isParseModified = false;
      // The following code is very very bad!
      // Only the changed portions must be affected!
      // diff/patch must be applied!
      sourceEditor.setValue( doc.serializeToString( dom ) );
      if ( currentMode == "editor" ) {
        undoState.modifications[++undoState.index] = undoState.getCurrent();
      }
    };

    function showDesign() {
      if ( currentMode == "editor" ) {
        if ( isSourceEditingActive ) {
          doneSourceEditing();
        }
        if ( isSourceModified() ) {
          loadDesign();
        }
        initDesignEditing();
      } else {
        setBackgroundColor();
      }
    };
    
    function showSource() {
      if ( currentMode == "editor" ) {
        if ( isDesignEditingActive ) {
          doneDesignEditing();
        }
        if ( !isParseError && ( isParseModified || isDesignModified() ) ) {
          loadSource();
        }
        initSourceEditing();
      }
    };
    
    function initDesignEditing() {
      if ( !isDesignEditingActive ) {
        isDesignEditingActive = true;
        if ( !isParseError ) {
          designFrame.setAttribute( "context", "znotes_editspell_menupopup" );
          setDocumentEditable( true );
          if ( designToolBox.hasAttribute( "collapsed" ) ) {
            designToolBox.removeAttribute( "collapsed" );
          }
          // restore selection begin
          if ( prevDesignEditorCursor ) {
            var selection = designFrame.contentWindow.getSelection();
            if ( selection.rangeCount > 0 ) {
              selection.removeAllRanges();
            }
            var body = designEditor.document.body;
            var commonAncestorContainer;
            var startContainer, startOffset;
            var endContainer, endOffset;
            var flag = false;
            for ( var i = 0; i < prevDesignEditorCursor.length; i++ ) {
              commonAncestorContainer =
                prevDesignEditorCursor[i].commonAncestorContainer;
              startContainer = prevDesignEditorCursor[i].startContainer;
              startOffset = prevDesignEditorCursor[i].startOffset;
              endContainer = prevDesignEditorCursor[i].endContainer;
              endOffset = prevDesignEditorCursor[i].endOffset;
              if ( body.contains( startContainer ) && body.contains( endContainer ) ) {
                selection.addRange( prevDesignEditorCursor[i] );
                flag = true;
              }
            }
            if ( !flag ) {
              designEditor.selection.collapse( designEditor.document.body, 0 );
            }
          } else {
            designEditor.selection.collapse( designEditor.document.body, 0 );
          }
          // restore selection end
        } else {
          designFrame.setAttribute( "context", "znotes_edit_menupopup" );
          setDocumentEditable( false );
        }
      }
      onSelectionChanged();
    };
    
    function doneDesignEditing() {
      if ( isDesignEditingActive ) {
        isDesignEditingActive = false;
        designToolBox.setAttribute( "collapsed", "true" );
        if ( !currentNote || !currentNote.isExists() ) {
          return;
        }
        // save selection begin
        var selection = designFrame.contentWindow.getSelection();
        prevDesignEditorCursor = null;
        if ( selection && selection.rangeCount > 0 ) {
          prevDesignEditorCursor = [];
          for ( var i = 0; i < selection.rangeCount; i++ ) {
            prevDesignEditorCursor.push(
              selection.getRangeAt( i ).cloneRange()
            );
          }
        }
        // save selection end
      }
    };
    
    function initSourceEditing() {
      if ( !isSourceEditingActive ) {
        isSourceEditingActive = true;
        if ( sourceToolBox.hasAttribute( "collapsed" ) ) {
          sourceToolBox.removeAttribute( "collapsed" );
        }
        // restore cursor position begin
        var doc = sourceEditor.getDoc();
        var lastLineIndex = doc.lastLine();
        var lastCharIndex = doc.getLine( lastLineIndex ).length;
        if ( prevSourceEditorCursor.line > lastLineIndex ) {
          prevSourceEditorCursor.line = lastLineIndex;
          prevSourceEditorCursor.ch = lastCharIndex;
        } else {
          lastCharIndex = doc.getLine( prevSourceEditorCursor.line ).length;
          if ( prevSourceEditorCursor.ch > lastCharIndex ) {
            prevSourceEditorCursor.ch = lastCharIndex;
          }
        }
        sourceEditor.setCursor( prevSourceEditorCursor );
        // restore cursor position end
        onSourceWindowResize();
      }
      onSelectionChanged();
    };
    
    function doneSourceEditing() {
      if ( isSourceEditingActive ) {
        isSourceEditingActive = false;
        sourceToolBox.setAttribute( "collapsed", "true" );
        // save cursor position begin
        prevSourceEditorCursor = sourceEditor.getCursor();
        // save cursor position end
      }
    };
    
    // KEYSET
    
    function setupKeyset() {
      editorKeyset = new ru.akman.znotes.Keyset(
        currentDocument.getElementById( "znotes_editor_keyset" ),
        self.getDefaultPreferences().shortcuts
      );
    };
    
    function updateKeyset() {
      editorKeyset.update( currentPreferences.shortcuts );
    };
    
    function activateKeyset() {
      editorKeyset.activate();
    };

    function deactivateKeyset() {
      editorKeyset.deactivate();
    };
    
    // LISTENERS
    
    function addEventListeners() {
      editorTabs.addEventListener( "select", onEditorTabSelect, false );
      designFrame.addEventListener( "click", designClickHandler, false );
      //
      designFrame.contentDocument.addEventListener( "mouseup",
        onSelectionChanged, false );
      designFrame.contentDocument.addEventListener( "keyup",
        onSelectionChanged, false );
      //
      sourceWindow.addEventListener( "resize",
        onSourceWindowResize, false );
      sourceFrame.contentDocument.addEventListener( "mouseup",
        onSelectionChanged, false );
      sourceFrame.contentDocument.addEventListener( "keyup",
        onSelectionChanged, false );
      //
      editMenuPopup.addEventListener( "popupshowing",
        onEditMenuPopupShowing, false );
      editSpellMenuPopup.addEventListener( "popupshowing",
        onEditSpellMenuPopupShowing, false );
      editSpellMenuPopup.addEventListener( "popuphiding",
        onEditSpellMenuPopupHiding, false );
      //
      fontSizeTextBox.addEventListener( "change",
        onFontSizeTextBoxChange, false );
      fontSizeTextBox.addEventListener( "focus",
        onFontSizeTextBoxFocus, false );
      //
      currentNote.addStateListener( noteStateListener );
      currentBookTagList.addStateListener( tagListStateListener );
    };
    
    function removeEventListeners() {
      editorTabs.removeEventListener( "select", onEditorTabSelect, false );
      designFrame.removeEventListener( "click", designClickHandler, false );
      //
      if ( currentNote && currentNote.isExists() ) {
        designFrame.contentDocument.removeEventListener( "mouseup",
          onSelectionChanged, false );
        designFrame.contentDocument.removeEventListener( "keyup",
          onSelectionChanged, false );
      }
      //
      sourceWindow.removeEventListener( "resize",
        onSourceWindowResize, false );
      if ( currentNote && currentNote.isExists() ) {
        sourceFrame.contentDocument.removeEventListener( "mouseup",
          onSelectionChanged, false );
        sourceFrame.contentDocument.removeEventListener( "keyup",
          onSelectionChanged, false );
      }
      //
      editMenuPopup.removeEventListener( "popupshowing",
        onEditMenuPopupShowing, false );
      editSpellMenuPopup.removeEventListener( "popupshowing",
        onEditSpellMenuPopupShowing, false );
      editSpellMenuPopup.removeEventListener( "popuphiding",
        onEditSpellMenuPopupHiding, false );
      //
      fontSizeTextBox.removeEventListener( "change",
        onFontSizeTextBoxChange, false );
      fontSizeTextBox.removeEventListener( "focus",
        onFontSizeTextBoxFocus, false );
      //
      currentNote.removeStateListener( noteStateListener );
      currentBookTagList.removeStateListener( tagListStateListener );
    };
    
    // INIT & DONE
    
    function initSourceEditor() {
      sourceWindow = sourceFrame.contentWindow;
      sourceEditorLibrary = sourceWindow.Source.getLibrary();
      sourceEditor = sourceWindow.Source.getEditor();
    };
    
    function initDesignEditor() {
      designFrame.contentDocument.designMode = "on";
      designFrame.contentDocument.designMode = "off";
    };
    
    function init( callback, wait ) {
      var initProgress = 0;
      var onCallback = function() {
        if ( initProgress == 10 ) {
          loadPrefs();
          prefsMozillaObserver.register();          
          prefsBundle.addObserver( prefObserver );
          self.getDocument().addObserver( docPrefObserver );
          editorController.register();
          editController.register();
          spellEditController.register();
          addEventListeners();
          restoreToolbarCurrentSet();
          setupKeyset();
          updateKeyset();
          activateKeyset();
          load();
          callback();
        }
      };
      var onInitDone = function() {
        initProgress += 4;
        onCallback();
      };
      //
      currentBookTagList = currentNote.getBook().getTagList();
      noteStateListener = {
        name: "EDITOR:XHTML",
        onNoteDeleted: onNoteDeleted,
        onNoteMainTagChanged: onNoteMainTagChanged,
        onNoteMainContentChanged: onNoteMainContentChanged,
      };
      tagListStateListener = {
        onTagChanged: onTagChanged,
        onTagDeleted: onTagDeleted
      };
      documentStateListener = {
        NotifyDocumentStateChanged: onDesignDocumentStateChanged,
        NotifyDocumentCreated: function() {},
        NotifyDocumentWillBeDestroyed: function() {}
      };
      createFormatBlockObject();
      //
      designToolBox = currentDocument.getElementById( "designToolBox" );
      designToolBox.customizeDone = function( isChanged ) {
        updateStyle();
        saveToolbarCurrentSet();
      };
      designToolBar1 = currentDocument.getElementById( "designToolBar1" );
      designToolBar2 = currentDocument.getElementById( "designToolBar2" );
      //
      sourceToolBox = currentDocument.getElementById( "sourceToolBox" );
      sourceToolBox.customizeDone = function( isChanged ) {
        updateStyle();
        saveToolbarCurrentSet();
      };
      sourceToolBar1 = currentDocument.getElementById( "sourceToolBar1" );
      sourceToolBar2 = currentDocument.getElementById( "sourceToolBar2" );
      //
      editMenuPopup =
        currentDocument.getElementById( "znotes_edit_menupopup" );
      editSpellMenuPopup =
        currentDocument.getElementById( "znotes_editspell_menupopup" );
      //
      fontNameMenuPopup =
        currentDocument.getElementById( "fontNameMenuPopup" );
      fontNameMenuList =
        currentDocument.getElementById( "fontNameMenuList" );
      fontSizeTextBox =
        currentDocument.getElementById( "fontSizeTextBox" );
      foreColorButton =
        currentDocument.getElementById( "znotes_forecolor_button" );
      backColorButton =
        currentDocument.getElementById( "znotes_backcolor_button" );
      formatBlockMenuPopup =
        currentDocument.getElementById( "formatBlockMenuPopup" );
      formatBlockMenuList =
        currentDocument.getElementById( "formatBlockMenuList" );
      //
      editorTabs = currentDocument.getElementById( "editorTabs" );
      editorTabSource = currentDocument.getElementById( "editorTabSource" );
      //
      designFrame = currentDocument.getElementById( "designEditor" );
      sourceFrame = currentDocument.getElementById( "sourceEditor" );
      sourcePrintFrame = currentDocument.getElementById( "sourcePrintFrame" );
      //
      if ( wait ) {
        var onDesignFrameLoad = function() {
          designFrame.removeEventListener( "load", onDesignFrameLoad, true );
          initProgress += 1;
          initDesignEditor();
          onCallback();
        };
        var onSourceFrameLoad = function() {
          sourceFrame.removeEventListener( "load", onSourceFrameLoad, true );
          currentWindow.setTimeout( function() {
            initProgress += 2;
            initSourceEditor();
            onCallback();
          }, 0 );
        };
        var onPrintFrameLoad = function() {
          sourcePrintFrame.removeEventListener( "load",
            onPrintFrameLoad, true );
          initProgress += 3;
          onCallback();
        };
        designFrame.addEventListener( "load", onDesignFrameLoad, true );
        sourceFrame.addEventListener( "load", onSourceFrameLoad, true );
        sourcePrintFrame.addEventListener( "load", onPrintFrameLoad, true );
      } else {
        initProgress = 6;
        initSourceEditor();
        initDesignEditor();
      }
      onInitDone();
    };
    
    function done() {
      prefsMozillaObserver.unregister();      
      self.getDocument().removeObserver( docPrefObserver );
      prefsBundle.removeObserver( prefObserver );
      deactivateKeyset();
      removeEventListeners();
      spellEditController.unregister();
      editController.unregister();
      editorController.unregister();
      if ( currentMode == "editor" ) {
        stop();
      }
      if ( designFrame.hasAttribute( "body.backgroundColor" ) ) {
        designFrame.removeAttribute( "body.backgroundColor" );
      }
    };

    // PRIVATE
    
    function switchToDesignTab() {
      if ( editorTabs.selectedIndex == 1 ) {
        editorTabs.selectedIndex = 0;
      } else {
        onEditorTabSelect();
      }
    };
    
    function switchMode( mode ) {
      if ( currentMode && currentMode == mode ) {
        return;
      }
      currentMode = mode;
      if ( currentMode == "editor" ) {
        start();
      }
      switchToDesignTab();
      notifyStateListener(
        new ru.akman.znotes.core.Event(
          "ModeChanged",
          { note: currentNote, mode: currentMode }
        )
      );
    };

    function switchState( value ) {
      if ( isEditorDirty === value ) {
        return;
      }
      isEditorDirty = value;
      notifyStateListener(
        new ru.akman.znotes.core.Event(
          "StateChanged",
          { note: currentNote, dirty: isEditorDirty }
        )
      );
    };
    
    function load() {
      // @@@@ 1 getMainContent
      sourceEditor.setValue( currentNote.getMainContent() );
      sourceEditor.clearHistory();
      loadDesign();
    };
    
    function start() {
      if ( editorTabs.hasAttribute( "hidden" ) ) {
        editorTabs.removeAttribute( "hidden" );
      }
      if ( Utils.IS_EDIT_SOURCE_ENABLED ) {
        if ( editorTabSource.hasAttribute( "hidden" ) ) {
          editorTabSource.removeAttribute( "hidden" );
        }
      } else {
        editorTabSource.setAttribute( "hidden", "true" );
      }
      var tagColor = designFrame.getAttribute( "body.backgroundColor" );
      var body = designFrame.contentDocument.body;
      if ( body && body.style ) {
        if ( tagColor ) {
          body.style.setProperty( 'background-color', tagColor );
        } else {
          body.style.removeProperty( 'background-color' );
          if ( body.style.length == 0 ) {
            body.removeAttribute( "style" );
          }
        }
      }
      Common.goSetCommandHidden( "znotes_close_command", false, currentWindow );
      createFontNameMenuList();
      createFormatBlockMenuList();
      sourceEditor.clearHistory();
      prevSourceEditorCursor = { line: 0, ch: 0 };
      sourceEditor.on( "change", onSourceEditorChange );
      designFrame.setAttribute( "context", "znotes_editspell_menupopup" );
      designFrame.contentDocument.designMode = "on";
      designFrame.contentDocument.execCommand(
        'styleWithCSS', false, null );
      designFrame.contentDocument.execCommand(
        'enableInlineTableEditing', false, null );
      designFrame.contentDocument.execCommand(
        'enableObjectResizing', false, null );
      designFrame.contentDocument.execCommand(
        'insertBrOnReturn', false, null );
      // designEditor is instance of nsIEditor && nsIHTMLEditor
      designEditor =
        designFrame.getEditor( designFrame.contentWindow )
                   .QueryInterface( nsIHTMLEditor );
      designEditor.resetModificationCount();
      designEditor.enableUndo( true );
      // BUG: Does not interact with the undo/redo system
      // designEditor.addDocumentStateListener( documentStateListener );
      spellCheckerUI = new ru.akman.znotes.spellchecker.InlineSpellChecker(
        designEditor );
      setCommandState( "znotes_spellcheckenabled_command",
        spellCheckerUI && currentPreferences.isSpellcheckEnabled );
      designEditor.setSpellcheckUserOverride(
        spellCheckerUI && currentPreferences.isSpellcheckEnabled );
      prevDesignEditorCursor = null;
      undoState.clear();
      isEditorDirty = false;
      designFrame.contentWindow.focus();
    };
    
    function stop() {
      if ( currentNote && currentNote.isExists() &&
           isEditorDirty && confirm() ) {
        save();
      } else {
        cancel();
      }
      // BUG: Does not interact with the undo/redo system
      // designEditor.removeDocumentStateListener( documentStateListener );
      if ( isSourceEditingActive ) {
        doneSourceEditing();
      }
      if ( isDesignEditingActive ) {
        doneDesignEditing();
      }
      // BUG: Editor has blinked cursor after close without following line
      designFrame.setAttribute( "context", "znotes_edit_menupopup" );
      editorTabs.setAttribute( "hidden", "true" );
      editorTabSource.setAttribute( "hidden", "true" );
      designToolBox.setAttribute( "collapsed", "true" );
      sourceToolBox.setAttribute( "collapsed", "true" );
      sourceEditor.off( "change", onSourceEditorChange );
      if ( currentNote && currentNote.isExists() ) {
        Common.goSetCommandHidden( "znotes_close_command", true, currentWindow );
        designEditor.selection.removeAllRanges();
        designFrame.contentDocument.designMode = "off";
        var body = designFrame.contentDocument.body;
        if ( body && body.style ) {
          designFrame.setAttribute(
            "body.backgroundColor",
            body.style.getPropertyValue( 'background-color' )
          );
        }
      }
      designEditor = null;
      spellCheckerUI = null;
    };
    
    function save() {
      if ( isEditorDirty ) {
        if ( isParseModified || isDesignModified() ) {
          loadSource();
        } else if ( isSourceModified() ) {
          loadDesign();
        }
        // @@@@ 1 setMainContent
        currentNote.removeStateListener( noteStateListener );
        currentNote.setMainContent( sourceEditor.getValue() );
        currentNote.addStateListener( noteStateListener );
        sourceEditor.clearHistory();
        designEditor.enableUndo( false );
        designEditor.resetModificationCount();
        designEditor.enableUndo( true );
        undoState.clear();
        switchState( false );
        onSelectionChanged();
      }
    };
    
    function cancel( force ) {
      if ( isEditorDirty || force ) {
        if ( currentNote && currentNote.isExists() ) {
          load();
        }
        designEditor.enableUndo( false );
        designEditor.resetModificationCount();
        designEditor.enableUndo( true );
        sourceEditor.clearHistory();
        undoState.clear();
        if ( currentNote && currentNote.isExists() ) {
          switchState( false );
          onSelectionChanged();
        }
      }
    };
    
    function confirm() {
      var params = {
        input: {
          title: getString(
            "body.confirmSave.title"
          ),
          message1: getFormattedString(
            "body.confirmSave.message1",
            [ currentNote.getName() ]
          ),
          message2: getString(
            "body.confirmSave.message2"
          )
        },
        output: null
      };
      currentWindow.openDialog(
        "chrome://znotes/content/confirmdialog.xul",
        "",
        "chrome,dialog,modal,centerscreen,resizable",
        params
      ).focus();
      if ( params.output ) {
        return true;
      }
      return false;
    };
    
    function print() {
      var aContentWindow = designFrame.contentWindow;
      if ( editorTabs.selectedIndex == 1 ) {
        var sourceText, rowBegin;
        if ( sourceEditor.somethingSelected() ) {
          sourceText = sourceEditor.getSelection();
          rowBegin = parseInt( sourceEditor.getCursor( "start" ).line ) + 1;
        } else {
          sourceText = sourceEditor.getValue();
          rowBegin = 1;
        }
        var lineCount = sourceText.length > 0 ? 1 : 0;
        var pos = sourceText.indexOf( "\n" );
        while ( pos != -1 ) {
          lineCount++;
          pos = sourceText.indexOf( "\n", pos + 1 );
        }
        var lineFieldWidth = ( "" + lineCount ).length;
        var node =
          sourcePrintFrame.contentWindow.document.getElementById( "printView" );
        while ( node.firstChild ) {
          node.removeChild( node.firstChild );
        }
        var row = rowBegin;
        var sp = node.appendChild(
          node.ownerDocument.createElement( "span" )
        );
        var lineField = "" + row;
        while ( lineField.length < lineFieldWidth ) {
          lineField = " " + lineField;
        }
        sp.appendChild(
          node.ownerDocument.createTextNode( lineField + " " )
        );
        var col = 0;
        var callback = function ( text, style ) {
          if ( text == "\n" ) {
            row++;
            node.appendChild( node.ownerDocument.createElement( "br" ) );
            var sp = node.appendChild(
              node.ownerDocument.createElement( "span" )
            );
            var lineField = "" + row;
            while ( lineField.length < lineFieldWidth ) {
              lineField = " " + lineField;
            }
            sp.appendChild(
              node.ownerDocument.createTextNode( lineField + " " )
            );
            col = 0;
            return;
          }
          var content = "";
          // replace tabs
          for ( var pos = 0; ; ) {
            var idx = text.indexOf( "\t", pos );
            if ( idx == -1 ) {
              content += text.slice( pos );
              col += text.length - pos;
              break;
            } else {
              col += idx - pos;
              content += text.slice( pos, idx );
              var size = tabSize - col % tabSize;
              col += size;
              for ( var i = 0; i < size; ++i ) {
                content += " ";
              }
              pos = idx + 1;
            }
          }
          if ( style ) {
            var sp = node.appendChild(
              node.ownerDocument.createElement( "span" )
            );
            sp.className = "cm-" + style.replace( / +/g, " cm-" );
            sp.appendChild( node.ownerDocument.createTextNode( content ) );
          } else {
            node.appendChild( node.ownerDocument.createTextNode( content ) );
          }
        };
        sourceEditorLibrary.runMode( sourceText, "htmlmixed", callback );
        aContentWindow = sourcePrintFrame.contentWindow;
      }
      var aTitle = currentNote.getName();
      currentWindow.openDialog(
        "chrome://znotes/content/printpreview.xul",
        "",
        "chrome,dialog=no,all,modal=yes,centerscreen,resizable=yes",
        {
          aWindow: aContentWindow,
          aTitle: aTitle
        }
      ).focus();
    };

    function updateStyle() {
      var elements = [
        designToolBox, designToolBar1, designToolBar2,
        sourceToolBox, sourceToolBar1, sourceToolBar2
      ];
      for ( var i = 0; i < elements.length; i++ ) {
        elements[i].setAttribute( "iconsize", currentStyle.iconsize );
      }
    };
    
    function editorInit( win, doc, note, style, wait ) {
      currentWindow = win;
      currentDocument = doc;
      currentNote = note;
      currentMode = null;
      currentStyle = {};
      Common = currentWindow.ru.akman.znotes.Common;
      prefsBundle = currentWindow.ru.akman.znotes.PrefsManager.getInstance();
      stringsBundle =
        currentDocument.getElementById( "znotes_editor_stringbundle" );
      Utils.cloneObject( style, currentStyle );
      init( function() {
        notifyStateListener(
          new ru.akman.znotes.core.Event(
            "Opened",
            { note: currentNote }
          )
        );
        switchMode( "viewer" );
      }, wait );
    };

    // PUBLIC

    /**
     * Open editor for a note
     * @param win Window in which Document live
     * @param doc Document in which will be loaded the editor
     * @param note Note that will be opened in the editor
     * @param style Style that will be applied to the editor
     */
    this.open = function( win, doc, note, style ) {
      var editorView = doc.getElementById( "editorView" );
      var noteType = note.getType();
      var editorType = editorView.hasAttribute( "type" ) ?
        editorView.getAttribute( "type" ) : "";
      if ( editorType == noteType ) {
        editorInit( win, doc, note, style );
      } else {
        var node;
        editorView.setAttribute( "type", noteType );
        node = doc.getElementById( "znotes_editor_commandset" );
        while ( node.firstChild ) {
          node.removeChild( node.firstChild );
        }
        node = doc.getElementById( "znotes_editor_keyset" );
        while ( node.firstChild ) {
          node.removeChild( node.firstChild );
        }
        node = doc.getElementById( "znotes_editor_popupset" );
        while ( node.firstChild ) {
          node.removeChild( node.firstChild );
        }
        node = doc.getElementById( "znotes_editor_stringbundleset" );
        while ( node.firstChild ) {
          node.removeChild( node.firstChild );
        }
        while ( editorView.firstChild ) {
          editorView.removeChild( editorView.firstChild );
        }
        doc.loadOverlay(
          this.getDocument().getURL() + "editor.xul",
          {
            observe: function( subject, topic, data ) {
              if ( topic == "xul-overlay-merged" ) {
                editorInit( win, doc, note, style, true );
              }
            }
          }
        );
      }
    };
    
    /**
     * Close editor for current note
     */
    this.close = function() {
      if ( !currentDocument ) {
        throw new EditorException( "Editor was not loaded." );
      }
      notifyStateListener(
        new ru.akman.znotes.core.Event(
          "Close",
          { note: currentNote }
        )
      );
      done();
      currentNote = null;
      currentDocument = null;
      currentWindow = null;
    };
    
    /**
     * Switch to editor mode
     */
    this.edit = function() {
      if ( !currentDocument ) {
        throw new EditorException( "Editor was not loaded." );
      }
      switchMode( "editor" );
    };
    
    /**
     * Save changes
     */
    this.save = function() {
      if ( !currentDocument ) {
        throw new EditorException( "Editor was not loaded." );
      }
      save();
    };
    
    /**
     * Discard changes
     */
    this.cancel = function() {
      if ( !currentDocument ) {
        throw new EditorException( "Editor was not loaded." );
      }
      cancel();
      switchToDesignTab();
    };

    /**
     * Print current view
     */
    this.print = function() {
      if ( !currentDocument ) {
        throw new EditorException( "Editor was not loaded." );
      }
      print();
    };
    
    /**
     * Update style of toolbars
     * @param style { iconsize: "small" || "normal" }
     */
    this.updateStyle = function( style ) {
      if ( !currentDocument ) {
        throw new EditorException( "Editor was not loaded." );
      }
      if ( !Utils.cloneObject( style, currentStyle ) ) {
        return;
      }
      updateStyle();
    };
    
    /**
     * Add state listener
     * @param stateListener Listener
     */
    this.addStateListener = function( stateListener ) {
      if ( listeners.indexOf( stateListener ) < 0 ) {
        listeners.push( stateListener );
      }
    };
    
    /**
     * Remove state listener
     * @param stateListener Listener
     */
    this.removeStateListener = function( stateListener ) {
      var index = listeners.indexOf( stateListener );
      if ( index < 0 ) {
        return;
      }
      listeners.splice( index, 1 );
    };
    
  };

}();

Editor.prototype.getDefaultPreferences = function() {
  return {
    isSpellcheckEnabled: false,
    shortcuts: {
      znotes_bold_key: {
        command: "znotes_bold_command",
        key: "B",
        modifiers: "accel",
        keycode: ""
      },
      znotes_italic_key: {
        command: "znotes_italic_command",
        key: "I",
        modifiers: "accel",
        keycode: ""
      },
      znotes_underline_key: {
        command: "znotes_underline_command",
        key: "U",
        modifiers: "accel",
        keycode: ""
      },
      znotes_strikethrough_key: {
        command: "znotes_strikethrough_command",
        key: "",
        modifiers: "",
        keycode: ""
      },
      znotes_subscript_key: {
        command: "znotes_subscript_command",
        key: "",
        modifiers: "",
        keycode: ""
      },
      znotes_superscript_key: {
        command: "znotes_superscript_command",
        key: "",
        modifiers: "",
        keycode: ""
      },
      znotes_forecolor_key: {
        command: "znotes_forecolor_command",
        key: "",
        modifiers: "",
        keycode: ""
      },
      znotes_forecolordelete_key: {
        command: "znotes_forecolordelete_command",
        key: "",
        modifiers: "",
        keycode: ""
      },
      znotes_backcolor_key: {
        command: "znotes_backcolor_command",
        key: "",
        modifiers: "",
        keycode: ""
      },
      znotes_backcolordelete_key: {
        command: "znotes_backcolordelete_command",
        key: "",
        modifiers: "",
        keycode: ""
      },
      znotes_justifyleft_key: {
        command: "znotes_justifyleft_command",
        key: "L",
        modifiers: "accel",
        keycode: ""
      },
      znotes_justifyright_key: {
        command: "znotes_justifyright_command",
        key: "R",
        modifiers: "accel",
        keycode: ""
      },
      znotes_justifycenter_key: {
        command: "znotes_justifycenter_command",
        key: "E",
        modifiers: "accel",
        keycode: ""
      },
      znotes_justifyfull_key: {
        command: "znotes_justifyfull_command",
        key: "J",
        modifiers: "accel",
        keycode: ""
      },
      znotes_indent_key: {
        command: "znotes_indent_command",
        key: "[",
        modifiers: "accel",
        keycode: ""
      },
      znotes_outdent_key: {
        command: "znotes_outdent_command",
        key: "]",
        modifiers: "accel",
        keycode: ""
      },
      znotes_insertparagraph_key: {
        command: "znotes_insertparagraph_command",
        key: "",
        modifiers: "",
        keycode: ""
      },
      znotes_link_key: {
        command: "znotes_link_command",
        key: "L",
        modifiers: "accel",
        keycode: ""
      },
      znotes_unlink_key: {
        command: "znotes_unlink_command",
        key: "K",
        modifiers: "accel,shift",
        keycode: ""
      },
      znotes_removeformat_key: {
        command: "znotes_removeformat_command",
        key: "Y",
        modifiers: "accel,shift",
        keycode: ""
      },
      znotes_insertorderedlist_key: {
        command: "znotes_insertorderedlist_command",
        key: "F12",
        modifiers: "",
        keycode: ""
      },
      znotes_insertunorderedlist_key: {
        command: "znotes_insertunorderedlist_command",
        key: "F12",
        modifiers: "shift",
        keycode: ""
      },
      znotes_inserthorizontalrule_key: {
        command: "znotes_inserthorizontalrule_command",
        key: "",
        modifiers: "",
        keycode: ""
      },
      znotes_inserttable_key: {
        command: "znotes_inserttable_command",
        key: "F12",
        modifiers: "accel",
        keycode: ""
      },
      znotes_insertimage_key: {
        command: "znotes_insertimage_command",
        key: "",
        modifiers: "",
        keycode: ""
      },
      znotes_sourcebeautify_key: {
        command: "znotes_sourcebeautify_command",
        key: "",
        modifiers: "",
        keycode: ""
      },
      znotes_close_key: {
        command: "znotes_close_command",
        key: "",
        modifiers: "",
        keycode: ""
      },
      znotes_editorcustomizetoolbar_key: {
        command: "znotes_editorcustomizetoolbar_command",
        key: "",
        modifiers: "",
        keycode: ""
      },
      znotes_editordebug_key: {
        command: "znotes_editordebug_command",
        key: "",
        modifiers: "",
        keycode: ""
      }
    }
  };
};
