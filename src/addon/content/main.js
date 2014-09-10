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

Components.utils.import( "resource://znotes/utils.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/domutils.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/drivermanager.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/documentmanager.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/bookmanager.js",
  ru.akman.znotes.core
);
Components.utils.import( "resource://znotes/event.js",
  ru.akman.znotes.core
);
Components.utils.import( "resource://znotes/clipper.js",
  ru.akman.znotes.core
);
Components.utils.import( "resource://znotes/tabmonitor.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/sessionmanager.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/prefsmanager.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/addonsmanager.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/updatemanager.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/keyset.js",
  ru.akman.znotes
);

ru.akman.znotes.Main = function() {

  var pub = {};

  var Utils = ru.akman.znotes.Utils;
  var DOMUtils = ru.akman.znotes.DOMUtils;
  var Common = ru.akman.znotes.Common;
  
  var Node = Components.interfaces.nsIDOMNode;
  
  var observerService =
    Components.classes["@mozilla.org/observer-service;1"]
              .getService( Components.interfaces.nsIObserverService );
  
  var prefsMozilla =
    Components.classes["@mozilla.org/preferences-service;1"]
              .getService( Components.interfaces.nsIPrefBranch );

  var ioService =
    Components.classes["@mozilla.org/network/io-service;1"]
              .getService( Components.interfaces.nsIIOService );
              
  var prefsBundle = ru.akman.znotes.PrefsManager.getInstance();
  var sessionManager = ru.akman.znotes.SessionManager.getInstance();
  var tabMonitor = ru.akman.znotes.TabMonitor.getInstance();
  var bookManager = ru.akman.znotes.core.BookManager.getInstance();

  var clipper = null;
  
  var consoleWindow = null;
  var consoleFlag = false;
  
  var windowsList = null;
  
  var mainPanel = null;
  var mainToolBox = null;
  var mainMenuBar = null;
  var mainToolBar = null;
  var mainKeySet = null;
  var mainAppMenu = null;
  var mainMenu = null;
  
  var statusBar = null;
  var statusBarPanel = null;
  var statusBarLogo = null;
  var statusBarLabel = null;
  
  var newNoteButtonMenuPopup = null;
  var selectedPopupItem = null;
  
  var mutationObservers = null;
  var folderTreeOpenStateMutationObserver = null;
  
  var folderBox = null;
  var bookTreeView = null;
  var bookSplitter = null;
  var categoryBox = null;
  var folderTreeView = null;
  var tagSplitter = null;
  var tagTreeView = null;
  var folderSplitter = null;
  var noteBox = null;
  var noteTreeView = null;
  var noteTreeSplitter = null;
  var noteBodyBox = null;
  var noteBodyView = null;
  
  var qfButton = null;
  var qfBox = null;

  var bookTree = null;
  var bookTreeChildren = null;
  var bookTreeTextBox = null;
  var bookTreeSeparatorRow = null;
  var bookTreeDropRow = null;
  var bookTreeSeparator = null;
  var bookTreeBoxObject = null;

  var folderTree = null;
  var folderTreeChildren = null;
  var folderTreeTextBox = null;
  var folderTreeSeparatorRow = null;
  var folderTreeDropRow = null;
  var folderTreeSeparator = null;
  var folderTreeBoxObject = null;
  var folderTreeMenu = null;

  var noteTree = null;
  var noteTreeChildren = null;
  var noteTreeTextBox = null;
  var noteTreeSeparatorRow = null;
  var noteTreeDropRow = null;
  var noteTreeSeparator = null;
  var noteTreeBoxObject = null;

  var tagTree = null;
  var tagTreeChildren = null;
  var tagTreeTextBox = null;
  var tagTreeSeparatorRow = null;
  var tagTreeDropRow = null;
  var tagTreeSeparator = null;
  var tagTreeBoxObject = null;

  // DRAG & DROP INFO
  var isDragDropActive = false;
  var infoDragDrop = {
    folderTreeRowCount: null,
    itemOfCategory: null,
    rowOfCategory: null,
    itemOfCategoryParent: null,
    rowOfCategoryParent: null,
    depthOfCategoryParent: null,
    depthOfCategory: null,
    rowOfNoteParent: null,
    row: null,
    dropEffect: null
  };
  
  var booksList = null;
  var categoriesList = null;
  var tagsList = null;
  var notesList = null;
  
  var currentBook = null;
  var currentCategory = null;
  var currentTag = null;
  var currentNote = null;
  
  var anEditCategory = null;
  var anEditNote = null;
  var anEditTagIndex = null;
  var anEditBookIndex = null;

  var oldValue = null;
  var newValue = null;
  var welcomeNote = null;
  
  var body = null;
  
  //
  // DOMAIN MODEL LISTENERS
  //
  
  /*
  Main.createBook()            ->   BookManager.createBook()
  Main.bookMoveTo()            ->   BookManager.moveBookTo()
  Main.renameBook()            ->   Book.setName()
  Main.deleteBook()            ->   Book.remove()
  Main.deleteBookWithAllData() ->   Book.removeWithAllData()
  Main.openBook()              ->   Book.open()
  Main.closeBook()             ->   Book.close()
  Main.editBook()              ->   Book.setName()
                                    Book.setDescription()
                                    Book.setDriver()
                                    Book.setConnection()
  */
  var booksStateListener = {
    onBookChanged: onBookChanged,    // Book.setName()
                                     // Book.setDescription()
                                     // Book.setDriver()
                                     // Book.setConnection()
    onBookOpened: onBookOpened,      // Book.open()
    onBookClosed: onBookClosed,      // Book.close()
    //onBookDeleted: onBookDeleted,  // Book.remove()
    //onBookDeletedWithAllData: onBookDeletedWithAllData, // Book.removeWithAllData()
    //onBookCreated: onBookCreated,  // BookManager.createBook()
    onBookAppended: onBookAppended,  // BookManager.appendBook()
    onBookRemoved: onBookRemoved,    // BookManager.removeBook()
    onBookMovedTo: onBookMovedTo     // BookManager.moveBookTo()
  };
  
  var tagListStateListener = {
    onTagChanged: onTagChanged,
    onTagAppended: onTagAppended,
    onTagRemoved: onTagRemoved,
    onTagInserted: onTagInserted
  };

  /*
  Main.createNote()    ->   Category.createNote()
  Main.renameNote()    ->   Note.rename()
  Main.deleteNote()    ->   Note.remove()
  Main.noteMoveTo()    ->   Note.moveTo()
  Main.noteMoveInto()  ->   Note.moveInto()

  Main.createCategory()    ->   Category.createCategory()
  Main.renameCategory()    ->   Category.rename()
  Main.deleteCategory()    ->   Category.remove()
  Main.categoryMoveTo()    ->   Category.moveTo()
  Main.categoryMoveInto()  ->   Category.moveInto()
  */
  var contentTreeStateListener = {
    //onCategoryCreated: onCategoryCreated,   // Category.createCategory()
    //onCategoryDeleted: onCategoryDeleted,   // Category.remove(), in Bin
    onCategoryAppended: onCategoryAppended,   // Category.appendCategory()
    onCategoryRemoved: onCategoryRemoved,     // Category.removeCategory()
    onCategoryMovedTo: onCategoryMovedTo,     // Category.moveTo()
    onCategoryMovedInto: onCategoryMovedInto, // Category.moveInto()
                                              
    onCategoryChanged: onCategoryChanged,     // Category.rename()
                                              
    //onNoteCreated: onNoteCreated,           // Category.createNote()
    //onNoteDeleted: onNoteDeleted,           // Note.remove() in Bin
    onNoteAppended: onNoteAppended,           // Category.appendNote()
    onNoteRemoved: onNoteRemoved,             // Category.removeNote() in Bin
    onNoteMovedTo: onNoteMovedTo,             // Note.moveTo()
    onNoteMovedInto: onNoteMovedInto,         // Note.moveInto()

    onNoteChanged: onNoteChanged,                       // Note.rename()
    onNoteTypeChanged: onNoteTypeChanged,               // Note.setType()
    onNoteLoadingChanged: onNoteLoadingChanged,         // Note.setLoading()
    //onNoteModeChanged: onNoteModeChanged,             // Note.setMode()
    
    //onNoteDataChanged: onNoteDataChanged,             // Note.setData()
    //onNotePrefChanged: onNotePrefChanged,             // Note.savePreference()
    
    onNoteTagsChanged: onNoteTagsChanged,               // Note.setTags()
    onNoteMainTagChanged: onNoteMainTagChanged,         // Note.setTags()
    
    onNoteMainContentChanged: onNoteMainContentChanged, // Note.setMainContent()
    onNoteContentLoaded: onNoteContentLoaded,           // Note.loadContentDirectory()
    //onNoteContentAppended: onNoteContentAppended,     // Note.addContent()
    //onNoteContentRemoved: onNoteContentRemoved,       // Note.removeContent()
    
    onNoteAttachmentAppended: onNoteAttachmentAppended, // Note.addAttachment()
    onNoteAttachmentRemoved: onNoteAttachmentRemoved    // Note.removeAttachment()
  };
  
  //
  // CLOSE
  //
  
  var platformQuitObserver = {
    observe: function( aSubject, aTopic, aData ) {
      switch ( aTopic ) {
        case "znotes-quit-requested":
          Utils.IS_QUIT_ENABLED = true;
          var testWindowFlag = false;
          var windowMediator =
            Components.classes["@mozilla.org/appshell/window-mediator;1"]
                      .getService( Components.interfaces.nsIWindowMediator );
          var win = windowMediator.getMostRecentWindow( "znotes:test" );
          if ( win ) {
            testWindowFlag = true;
            win.close();
          }
          if ( Utils.IS_CONFIRM_EXIT ) {
            var params = {
              input: {
                title: getString( "main.confirmQuit.title" ),
                message1: getString( "main.confirmQuit.message" ),
                kind: 1 // question
              },
              output: null
            };
            window.openDialog(
              "chrome://znotes/content/confirmdialog.xul",
              "",
              "chrome,dialog=yes,modal=yes,centerscreen,resizable=no",
              params
            ).focus();
            Utils.IS_QUIT_ENABLED = !( !params.output || !params.output.result );
            if ( !Utils.IS_QUIT_ENABLED && testWindowFlag ) {
              doOpenTestSuiteWindow();
            }
          }
          break;
        case "znotes-quit-accepted":
          quit();
          break;
      }
    },
    register: function() {
      observerService.addObserver( this, "znotes-quit-requested", false );
      observerService.addObserver( this, "znotes-quit-accepted", false );
    },
    unregister: function() {
      observerService.removeObserver( this, "znotes-quit-accepted" );
      observerService.removeObserver( this, "znotes-quit-requested" );
    }
  };
  
  // HELPER OBSERVER
  
  var helperObserver = {
    observe: function( aSubject, aTopic, aData ) {
      var uri;
      switch ( aTopic ) {
        case "znotes-href":
          if ( aSubject !== window || !currentNote ||
               currentNote.getMode() === "editor" ) {
            break;
          }
          try {
            uri = ioService.newURI( aData, null, null );
          } catch ( e ) {
            uri = null;
          }
          if ( uri ) {
            if ( uri.equalsExceptRef( currentNote.getURI() ) ) {
              aData = "#" + uri.ref;
            }
            statusBarLabel.setAttribute( "value", aData );
          } else {
            statusBarLabel.setAttribute( "value", "" );
          }
          break;
      }
    },
    register: function() {
      observerService.addObserver( this, "znotes-href", false );
    },
    unregister: function() {
      observerService.removeObserver( this, "znotes-href" );
    }
  };
  
  // PREFERENCES
  
  var prefsBundleObserver = {
    onPrefChanged: function( event ) {
      switch( event.data.name ) {
        case "placeName":
          Utils.PLACE_NAME = event.data.newValue;
          break;
        case "isPlaySound":
          Utils.IS_PLAY_SOUND = event.data.newValue;
          break;
        case "isClearBinOnExit":
          Utils.IS_CLEAR_BIN_ON_EXIT = event.data.newValue;
          break;
        case "isClipperPlaySound":
          Utils.IS_CLIPPER_PLAY_SOUND = event.data.newValue;
          break;
        case "clipperSaveScripts":
          if ( event.data.newValue ) {
            Utils.CLIPPER_FLAGS |= 0x00000001;
          } else {
            Utils.CLIPPER_FLAGS &= 0x11111110;
          }
          break;
        case "clipperSaveFrames":
          if ( event.data.newValue ) {
            Utils.CLIPPER_FLAGS |= 0x00000010;
          } else {
            Utils.CLIPPER_FLAGS &= 0x11111101;
          }
          break;
        case "clipperSeparateFrames":
          if ( event.data.newValue ) {
            Utils.CLIPPER_FLAGS |= 0x00000100;
          } else {
            Utils.CLIPPER_FLAGS &= 0x11111011;
          }
          break;
        case "clipperPreserveHTML5Tags":
          if ( event.data.newValue ) {
            Utils.CLIPPER_FLAGS |= 0x00001000;
          } else {
            Utils.CLIPPER_FLAGS &= 0x11110111;
          }
          break;
        case "clipperSaveStyles":
          if ( event.data.newValue ) {
            Utils.CLIPPER_FLAGS |= 0x00010000;
          } else {
            Utils.CLIPPER_FLAGS &= 0x11101111;
          }
          break;
        case "clipperSingleStylesheet":
          if ( event.data.newValue ) {
            Utils.CLIPPER_FLAGS |= 0x00100000;
          } else {
            Utils.CLIPPER_FLAGS &= 0x11011111;
          }
          break;
        case "clipperSeparateStylesheets":
          if ( event.data.newValue ) {
            Utils.CLIPPER_FLAGS |= 0x01000000;
          } else {
            Utils.CLIPPER_FLAGS &= 0x10111111;
          }
          break;
        case "clipperSaveActiveRulesOnly":
          if ( event.data.newValue ) {
            Utils.CLIPPER_FLAGS |= 0x10000000;
          } else {
            Utils.CLIPPER_FLAGS &= 0x01111111;
          }
          break;
        case "isReplaceBackground":
          Utils.IS_REPLACE_BACKGROUND = event.data.newValue;
          break;
        case "isConfirmExit":
          Utils.IS_CONFIRM_EXIT = event.data.newValue;
          break;
        case "isExitQuitTB":
          Utils.IS_EXIT_QUIT_TB = event.data.newValue;
          break;
        case "isHighlightRow":
          Utils.IS_HIGHLIGHT_ROW = event.data.newValue;
          updateTagsCSSRules();
          break;
        case "isCloseBrowserAfterImport":
          Utils.IS_CLOSE_BROWSER_AFTER_IMPORT = event.data.newValue;
          break;
        case "isSavePosition":
          Utils.IS_SAVE_POSITION = event.data.newValue;
          saveNotesTreeSelection();
          break;
        case "isEditSourceEnabled":
          Utils.IS_EDIT_SOURCE_ENABLED = event.data.newValue;
          currentNoteChanged();
          break;
        case "isMainMenubarVisible":
          Utils.IS_MAINMENUBAR_VISIBLE = event.data.newValue;
          updateMainMenubarVisibility();
          break;
        case "isMainToolbarVisible":
          Utils.IS_MAINTOOLBAR_VISIBLE = event.data.newValue;
          updateMainToolbarVisibility();
          break;
        case "defaultDocumentType":
          Utils.DEFAULT_DOCUMENT_TYPE = event.data.newValue;
          break;
        case "main_shortcuts":
          Utils.MAIN_SHORTCUTS = event.data.newValue;
          updateKeyset();
          break;
      }
    },
    register: function() {
      prefsBundle.addObserver( this );
    },
    unregister: function() {
      prefsBundle.removeObserver( this );
    }
  };
  
  var prefsMozillaObserver = {
    observe: function( subject, topic, data ) {
      switch ( data ) {
        case "debug":
          Utils.IS_DEBUG_ENABLED = this.branch.getBoolPref( "debug" );
          updateCommandsVisibility();
          Common.goUpdateCommand( "znotes_testsuite_command", mainController.getId(), window );
          Common.goUpdateCommand( "znotes_console_command", mainController.getId(), window );
          Common.goUpdateCommand( "znotes_debugger_command", mainController.getId(), window );
          Common.goUpdateCommand( "znotes_inspector_command", mainController.getId(), window );
          break;
        case "sanitize":
          Utils.IS_SANITIZE_ENABLED = this.branch.getBoolPref( "sanitize" );
          if ( Utils.IS_SANITIZE_ENABLED ) {
            Utils.CLIPPER_FLAGS &= 0x10010000;
            // SAVE_STYLES
            if ( !prefsBundle.hasPref( "clipperSaveStyles" ) ) {
              prefsBundle.setBoolPref( "clipperSaveStyles",
                !!( Utils.CLIPPER_FLAGS & 0x00010000 ) );
            }
            if ( prefsBundle.getBoolPref( "clipperSaveStyles" ) ) {
              Utils.CLIPPER_FLAGS |= 0x00010000;
            } else {
              Utils.CLIPPER_FLAGS &= 0x11101111;
            }
            // SAVE_ACTIVE_RULES_ONLY
            if ( !prefsBundle.hasPref( "clipperSaveActiveRulesOnly" ) ) {
              prefsBundle.setBoolPref( "clipperSaveActiveRulesOnly",
                !!( Utils.CLIPPER_FLAGS & 0x10000000 ) );
            }
            //if ( prefsBundle.getBoolPref( "clipperSaveActiveRulesOnly" ) ) {
              Utils.CLIPPER_FLAGS |= 0x10000000;
            //} else {
            //  Utils.CLIPPER_FLAGS &= 0x01111111;
            //}
          } else {
            if ( !prefsBundle.hasPref( "clipperSaveScripts" ) ) {
              prefsBundle.setBoolPref( "clipperSaveScripts",
                !!( Utils.CLIPPER_FLAGS & 0x00000001 ) );
            }
            if ( prefsBundle.getBoolPref( "clipperSaveScripts" ) ) {
              Utils.CLIPPER_FLAGS |= 0x00000001;
            } else {
              Utils.CLIPPER_FLAGS &= 0x11111110;
            }
            //
            if ( !prefsBundle.hasPref( "clipperSaveFrames" ) ) {
              prefsBundle.setBoolPref( "clipperSaveFrames",
                !!( Utils.CLIPPER_FLAGS & 0x00000010 ) );
            }
            if ( prefsBundle.getBoolPref( "clipperSaveFrames" ) ) {
              Utils.CLIPPER_FLAGS |= 0x00000010;
            } else {
              Utils.CLIPPER_FLAGS &= 0x11111101;
            }
            //
            if ( !prefsBundle.hasPref( "clipperSeparateFrames" ) ) {
              prefsBundle.setBoolPref( "clipperSeparateFrames",
                !!( Utils.CLIPPER_FLAGS & 0x00000100 ) );
            }
            if ( prefsBundle.getBoolPref( "clipperSeparateFrames" ) ) {
              Utils.CLIPPER_FLAGS |= 0x00000100;
            } else {
              Utils.CLIPPER_FLAGS &= 0x11111011;
            }
            //
            if ( !prefsBundle.hasPref( "clipperPreserveHTML5Tags" ) ) {
              prefsBundle.setBoolPref( "clipperPreserveHTML5Tags",
                !!( Utils.CLIPPER_FLAGS & 0x00001000 ) );
            }
            if ( prefsBundle.getBoolPref( "clipperPreserveHTML5Tags" ) ) {
              Utils.CLIPPER_FLAGS |= 0x00001000;
            } else {
              Utils.CLIPPER_FLAGS &= 0x11110111;
            }
            //
            if ( !prefsBundle.hasPref( "clipperSaveStyles" ) ) {
              prefsBundle.setBoolPref( "clipperSaveStyles",
                !!( Utils.CLIPPER_FLAGS & 0x00010000 ) );
            }
            if ( prefsBundle.getBoolPref( "clipperSaveStyles" ) ) {
              Utils.CLIPPER_FLAGS |= 0x00010000;
            } else {
              Utils.CLIPPER_FLAGS &= 0x11101111;
            }
            //
            if ( !prefsBundle.hasPref( "clipperSingleStylesheet" ) ) {
              prefsBundle.setBoolPref( "clipperSingleStylesheet",
                !!( Utils.CLIPPER_FLAGS & 0x00100000 ) );
            }
            if ( prefsBundle.getBoolPref( "clipperSingleStylesheet" ) ) {
              Utils.CLIPPER_FLAGS |= 0x00100000;
            } else {
              Utils.CLIPPER_FLAGS &= 0x11011111;
            }
            //
            if ( !prefsBundle.hasPref( "clipperSeparateStylesheets" ) ) {
              prefsBundle.setBoolPref( "clipperSeparateStylesheets",
                !!( Utils.CLIPPER_FLAGS & 0x01000000 ) );
            }
            if ( prefsBundle.getBoolPref( "clipperSeparateStylesheets" ) ) {
              Utils.CLIPPER_FLAGS |= 0x01000000;
            } else {
              Utils.CLIPPER_FLAGS &= 0x10111111;
            }
            //
            if ( !prefsBundle.hasPref( "clipperSaveActiveRulesOnly" ) ) {
              prefsBundle.setBoolPref( "clipperSaveActiveRulesOnly",
                !!( Utils.CLIPPER_FLAGS & 0x10000000 ) );
            }
            if ( prefsBundle.getBoolPref( "clipperSaveActiveRulesOnly" ) ) {
              Utils.CLIPPER_FLAGS |= 0x10000000;
            } else {
              Utils.CLIPPER_FLAGS &= 0x01111111;
            }
          }
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
  
  function loadPrefs() {
    prefsBundle.loadPrefs();
    if ( Utils.IS_FIRST_RUN ) {
      prefsBundle.setBoolPref( "isFirstRun", false );
    }
    if ( Utils.IS_FIRST_RUN || Utils.IS_DEBUG_ENABLED ) {
		  observerService.notifyObservers( null, "startupcache-invalidate", null );
		  observerService.notifyObservers( null, "chrome-flush-skin-caches", null );
		  observerService.notifyObservers( null, "chrome-flush-caches", null );
    }
  };
  
  // COMMANDS

  var mainCommandController = {
    controller: null,
    context: null,
    commands: null,
    init: function( aContext ) {
      try {
        // controller
        this.controller =
          Components.classes["@mozilla.org/embedcomp/base-command-controller;1"]
                    .createInstance();
        // context
        this.context = this.controller.QueryInterface(
          Components.interfaces.nsIControllerContext );
        this.context.init( null );
        this.context.setCommandContext( aContext === undefined ? null : aContext );
        // commands
        this.commands = this.controller.QueryInterface(
          Components.interfaces.nsIInterfaceRequestor ).getInterface(
            Components.interfaces.nsIControllerCommandTable );
      } catch ( e ) {
        Components.utils.reportError(
          "An error occurred initializing controller '" + this.getName() +
          "': " + e
        );
      }
    },
    getController: function() {
      if ( !this.controller ) {
        Components.utils.reportError(
          "An error occurred accessing controller '" + this.getName() +
          "', controller was not initialized!"
        );
      }
      return this.controller;
    },
    getCommands: function() {
      if ( !this.commands ) {
        Components.utils.reportError(
          "An error occurred accessing controller '" + this.getName() +
          "', controller was not initialized!"
        );
      }
      return this.commands;
    },
    getContext: function() {
      if ( !this.context ) {
        Components.utils.reportError(
          "An error occurred accessing controller '" + this.getName() +
          "', controller was not initialized!"
        );
      }
      return this.context;
    },
    getName: function() {
      return "main::mainCommandController";
    },
    registerCommand: function( cmd, command ) {
      if ( !this.commands ) {
        Components.utils.reportError(
          "An error occurred registering command '" + cmd +
          "', controller was not initialized!"
        );
        return;
      }
      try {
        this.commands.registerCommand( cmd, command );
      } catch ( e ) {
        Components.utils.reportError(
          "An error occurred registering command '" + cmd + "': " + e
        );
      }
    },
    register: function() {
      if ( !this.controller ) {
        Components.utils.reportError(
          "An error occurred registering controller '" + this.getName() +
          "', controller was not initialized!"
        );
        return;
      }
      try {
        window.controllers.insertControllerAt( 0, this.controller );
        this.getId = function() {
          return window.controllers.getControllerId( this.controller );
        };
      } catch ( e ) {
        Components.utils.reportError(
          "An error occurred registering '" + this.getName() + "' controller: " + e
        );
      }
    },
    unregister: function() {
      if ( !this.controller ) {
        Components.utils.reportError(
          "An error occurred registering controller '" + this.getName() +
          "', controller was not initialized!"
        );
        return;
      }
      try {
        window.controllers.removeController( this.controller );
      } catch ( e ) {
        Components.utils.reportError(
          "An error occurred unregistering '" + this.getName() + "' controller: " + e
        );
      }
    }
  };
  
  var saveMessageCommand = {
    isCommandEnabled: function( cmd ) {
      return true;
    },
    getCommandStateParams: function( cmd, params ) {
    },
    doCommandParams: function( cmd, params ) {
      var book, category, parent, note, bookId, noteId, data, row;
      data = params.getStringValue( "id" ).split( "&" );
      bookId = data[0];
      noteId = data[1];
      note = getNoteByBookIdAndNoteId( bookId, noteId );
      if ( !note ) {
        return;
      }
      row = -1;
      for ( var i = 0; i < booksList.length; i++ ) {
        book = booksList[i];
        if ( book.getId() === bookId && book.isOpen() ) {
          row = i;
          break;
        }
      }
      if ( row === -1 ) {
        return;
      }
      if ( book !== currentBook ) {
        bookTreeBoxObject.ensureRowIsVisible( row );
        bookTree.view.selection.select( row );
      }
      if ( currentBook && currentBook.isOpen() ) {
        row = notesList.indexOf( note );
        if ( row === -1 ) {
          category = note.getParent();
          parent = category;
          while ( !parent.isRoot() ) {
            parent.setOpenState( true );
            updateFolderTreeItem( parent );
            parent = parent.getParent();
          }
          row = folderTree.view.getIndexOfItem( getFolderTreeItem( category ) );
          folderTreeBoxObject.ensureRowIsVisible( row );
          folderTree.view.selection.select( row );
          row = notesList.indexOf( note );
        }
        noteTreeBoxObject.ensureRowIsVisible( row );
        noteTree.view.selection.select( row );
      }
    },
    doCommand: function( cmd ) {
    }
  };
  
  var mainCommands = {
    // book
    "znotes_openbook_command": null,
    "znotes_closebook_command": null,
    "znotes_appendbook_command": null,
    "znotes_deletebook_command": null,
    "znotes_deletebookdata_command": null,
    "znotes_editbook_command": null,
    "znotes_renamebook_command": null,
    "znotes_refreshbooktree_command": null,
    // category
    "znotes_refreshfoldertree_command": null,
    "znotes_newcategory_command": null,
    "znotes_deletecategory_command": null,
    "znotes_clearbin_command": null,
    "znotes_renamecategory_command": null,
    // tag
    "znotes_refreshtagtree_command": null,
    "znotes_newtag_command": null,
    "znotes_deletetag_command": null,
    "znotes_renametag_command": null,
    "znotes_colortag_command": null,
    // note
    "znotes_newnote_command": null,
    "znotes_importnote_command": null,
    "znotes_deletenote_command": null,
    "znotes_renamenote_command": null,
    "znotes_processnote_command": null,
    "znotes_updatenote_command": null,
    "znotes_refreshnotetree_command": null,
    // platform
    "znotes_showappmenu_command": null,
    "znotes_exit_command": null,
    "znotes_showmainmenubar_command": null,
    "znotes_showmaintoolbar_command": null,
    "znotes_customizemaintoolbar_command": null,
    "znotes_openoptionsdialog_command": null,
    "znotes_openhelp_command": null,
    "znotes_openabout_command": null,
    "znotes_pagesetup_command": null,
    "znotes_showfilterbar_command": null,
    "znotes_testsuite_command": null,
    "znotes_console_command": null,
    "znotes_debugger_command": null,
    "znotes_inspector_command": null,
    "znotes_addons_command": null,
    "znotes_update_command": null
  };
  
  var mainController = {
    supportsCommand: function( cmd ) {
      return ( cmd in mainCommands );
    },
    isCommandEnabled: function( cmd ) {
      switch ( cmd ) {
        // platform
        case "znotes_testsuite_command":
        case "znotes_console_command":
          return Utils.IS_DEBUG_ENABLED;
        case "znotes_debugger_command":
          return Utils.IS_DEBUG_ENABLED && Utils.IS_STANDALONE && Utils.IS_DEBUGGER_INSTALLED;
        case "znotes_inspector_command":
          return Utils.IS_DEBUG_ENABLED && Utils.IS_STANDALONE && Utils.IS_INSPECTOR_INSTALLED;
        case "znotes_addons_command":
          return Utils.IS_STANDALONE; 
        case "znotes_update_command":
          return Utils.IS_STANDALONE &&
            ru.akman.znotes.UpdateManager.canUpdate(); 
        case "znotes_showappmenu_command":
        case "znotes_exit_command":
        case "znotes_showmainmenubar_command":
        case "znotes_showmaintoolbar_command":
        case "znotes_customizemaintoolbar_command":
        case "znotes_openoptionsdialog_command":
        case "znotes_openhelp_command":
        case "znotes_openabout_command":
        case "znotes_pagesetup_command":
          return true;
        // book
        case "znotes_openbook_command":
        case "znotes_editbook_command":
          return currentBook && !currentBook.isOpen();
        case "znotes_closebook_command":
        case "znotes_showfilterbar_command":
          return currentBook && currentBook.isOpen();
        case "znotes_renamebook_command":
        case "znotes_deletebook_command":
        case "znotes_deletebookdata_command":
          return currentBook;
        case "znotes_appendbook_command":
        case "znotes_refreshbooktree_command":
          return true;
        // category
        case "znotes_clearbin_command":
          return currentBook && currentBook.isOpen() &&
                 currentBook.getContentTree().getBin() &&
                 !currentBook.getContentTree().getBin().isEmpty();
        case "znotes_deletecategory_command":
        case "znotes_renamecategory_command":
          return currentBook && currentBook.isOpen() &&
                 currentBook.getSelectedTree() === "Categories" &&
                 currentCategory &&
                 !currentCategory.isRoot() &&
                 !currentCategory.isBin();
        case "znotes_refreshfoldertree_command":
        case "znotes_newcategory_command":
          return currentBook && currentBook.isOpen() &&
                 currentBook.getSelectedTree() === "Categories";
          // tag
        case "znotes_deletetag_command":
        case "znotes_renametag_command":
          return currentBook && currentBook.isOpen() &&
                 currentBook.getSelectedTree() == "Tags" &&
                 currentTag && !currentTag.isNoTag();
        case "znotes_refreshtagtree_command":
        case "znotes_newtag_command":
          return currentBook && currentBook.isOpen() &&
                 currentBook.getSelectedTree() == "Tags";
        case "znotes_colortag_command":
          return currentBook && currentBook.isOpen() &&
                 currentBook.getSelectedTree() == "Tags" &&
                 currentTag;
          // note
        case "znotes_deletenote_command":
        case "znotes_renamenote_command":
        case "znotes_processnote_command":
        case "znotes_updatenote_command":
          return currentBook && currentBook.isOpen() && currentNote;
        case "znotes_importnote_command":
          return currentBook;
        case "znotes_newnote_command":
        case "znotes_refreshnotetree_command":
          return currentBook && currentBook.isOpen();
      }
      return false;
    },
    doCommand: function( cmd ) {
      switch ( cmd ) {
        case "znotes_pagesetup_command":
          doPageSetup();
          break;
        case "znotes_exit_command":
          doExit();
          break;
        case "znotes_showmainmenubar_command":
          doShowMainMenubar();
          break;
        case "znotes_showmaintoolbar_command":
          doShowMainToolbar();
          break;
        case "znotes_customizemaintoolbar_command":
          doCustomizeMainToolbar();
          break;
        case "znotes_openoptionsdialog_command":
          doOpenOptionsDialog();
          break;
        case "znotes_testsuite_command":
          doOpenTestSuiteWindow();
          break;
        case "znotes_console_command":
          doOpenConsoleWindow();
          break;
        case "znotes_debugger_command":
          doOpenDebuggerWindow();
          break;
        case "znotes_inspector_command":
          doOpenInspectorWindow();
          break;
        case "znotes_addons_command":
          doOpenAddonsManager();
          break;
        case "znotes_update_command":
          doOpenUpdateManager();
          break;
        case "znotes_openhelp_command":
          doOpenHelp();
          break;
        case "znotes_openabout_command":
          doOpenAbout();
          break;
        case "znotes_openbook_command":
          doOpenBook();
          break;
        case "znotes_closebook_command":
          doCloseBook();
          break;
        case "znotes_appendbook_command":
          doAppendBook();
          break;
        case "znotes_deletebook_command":
          doDeleteBook();
          break;
        case "znotes_deletebookdata_command":
          doDeleteBookData();
          break;
        case "znotes_editbook_command":
          doEditBook();
          break;
        case "znotes_renamebook_command":
          doRenameBook();
          break;
        case "znotes_refreshbooktree_command":
          doRefreshBookTree();
          break;
        case "znotes_refreshfoldertree_command":
          doRefreshFolderTree();
          break;
        case "znotes_newcategory_command":
          doNewCategory();
          break;
        case "znotes_deletecategory_command":
          doDeleteCategory();
          break;
        case "znotes_clearbin_command":
          doClearBin();
          break;
        case "znotes_renamecategory_command":
          doRenameCategory();
          break;
        case "znotes_refreshtagtree_command":
          doRefreshTagTree();
          break;
        case "znotes_newtag_command":
          doNewTag();
          break;
        case "znotes_deletetag_command":
          doDeleteTag();
          break;
        case "znotes_renametag_command":
          doRenameTag();
          break;
        case "znotes_colortag_command":
          doColorTag();
          break;
        case "znotes_newnote_command":
          doNewNote();
          break;
        case "znotes_importnote_command":
          doImportNote();
          break;
        case "znotes_deletenote_command":
          doDeleteNote();
          break;
        case "znotes_renamenote_command":
          doRenameNote();
          break;
        case "znotes_processnote_command":
          doProcessNote();
          break;
        case "znotes_updatenote_command":
          doUpdateNote();
          break;
        case "znotes_refreshnotetree_command":
          doRefreshNoteTree();
          break;
        case "znotes_showfilterbar_command":
          doToggleFilterBar();
          break;
        case "znotes_showappmenu_command":
          break;
      }
    },
    onEvent: function( event ) {
    },
    getName: function() {
      return "main::mainController";
    },
    getCommand: function( cmd ) {
      return ( cmd in mainCommands ) ? document.getElementById( cmd ) : null;
    },
    updateCommands: function() {
      for ( var cmd in mainCommands ) {
        Common.goUpdateCommand( cmd, this.getId(), window );
      }
    },
    register: function() {
      try {
        window.controllers.insertControllerAt( 0, this );
        this.getId = function() {
          return window.controllers.getControllerId( this );
        };
      } catch ( e ) {
        Components.utils.reportError(
          "An error occurred registering '" + this.getName() + "' controller: " + e
        );
      }
    },
    unregister: function() {
      for ( var cmd in mainCommands ) {
        Common.goSetCommandEnabled( cmd, false, window );
      }
      try {
        window.controllers.removeController( this );
      } catch ( e ) {
        Components.utils.reportError(
          "An error occurred unregistering '" + this.getName() + "' controller: " + e
        );
      }
    }
  };

  var editCommands = {
    "znotes_undo_command": null,
    "znotes_redo_command": null,
    "znotes_cut_command": null,
    "znotes_copy_command": null,
    "znotes_paste_command": null,
    "znotes_delete_command": null,
    "znotes_selectall_command": null
  };

  var editUpdater = {
    register: function() {
      var commandDispatcher = top.document.commandDispatcher;
      var updaterElement =
        document.getElementById( "znotes_editupdater");
      try {
        updaterElement.addEventListener( "commandupdate", this.onEvent, false );
        commandDispatcher.addCommandUpdater( updaterElement, "focus", "*" );
      } catch ( e ) {
        Components.utils.reportError(
          "An error occurred registering 'editUpdater' updater:\n" +
          e
        );
      }
    },
    unregister: function() {
      var commandDispatcher = top.document.commandDispatcher;
      var updaterElement =
        document.getElementById( "znotes_editupdater");
      try {
        updaterElement.removeEventListener(
          "commandupdate", this.onEvent, false );
        commandDispatcher.removeCommandUpdater( updaterElement );
      } catch ( e ) {
        Components.utils.reportError(
          "An error occurred unregistering 'editUpdater' updater:\n" +
          e
        );
      }
    },
    onEvent: function( event ) {
      updateEditCommands();
    }
  };
  
  var editController = {
    supportsCommand: function( cmd ) {
      if ( !( cmd in editCommands ) ) {
        return false;
      }
      var focusedWindow = top.document.commandDispatcher.focusedWindow;
      if ( focusedWindow != window ) {
        return false;
      }
      var focusedElement = top.document.commandDispatcher.focusedElement;
      switch ( cmd ) {
        case "znotes_undo_command":
        case "znotes_redo_command":
        case "znotes_paste_command":
        case "znotes_selectall_command":
        case "znotes_copy_command":
        case "znotes_cut_command":
        case "znotes_delete_command":
          switch ( getElementId( focusedElement ) ) {
            case "bookTree":
            case "folderTree":
            case "tagTree":
            case "noteTree":
              return focusedElement.id;
          }
          break;
      }
      return false;
    },
    isCommandEnabled: function( cmd ) {
      var focusedElementId =
        getElementId( top.document.commandDispatcher.focusedElement );
      switch ( cmd ) {
        case "znotes_undo_command":
        case "znotes_redo_command":
        case "znotes_paste_command":
        case "znotes_selectall_command":
        case "znotes_copy_command":
        case "znotes_cut_command":
          return false;
        case "znotes_delete_command":
          switch ( focusedElementId ) {
            case "bookTree":
              return currentBook;
            case "folderTree":
              return currentBook && currentBook.isOpen() &&
                     currentBook.getSelectedTree() == "Categories" &&
                     currentCategory &&
                     !currentCategory.isRoot() &&
                     !currentCategory.isBin();
            case "tagTree":
              return currentBook && currentBook.isOpen() &&
                     currentBook.getSelectedTree() == "Tags" &&
                     currentTag && !currentTag.isNoTag();
            case "noteTree":
              return currentBook && currentBook.isOpen() && currentNote;
          }
          break;
      }
      return false;
    },
    doCommand: function( cmd ) {
      var focusedElementId =
        getElementId( top.document.commandDispatcher.focusedElement );
      switch ( cmd ) {
        case "znotes_undo_command":
          doUndo();
          break;
        case "znotes_redo_command":
          doRedo();
          break;
        case "znotes_selectall_command":
          switch ( focusedElementId ) {
            case "bookTree":
              doSelectAllBook();
              break;
            case "folderTree":
              doSelectAllCategory();
              break;
            case "tagTree":
              doSelectAllTag();
              break;
            case "noteTree":
              doSelectAllNote();
              break;
          }
          break;
        case "znotes_paste_command":
          switch ( focusedElementId ) {
            case "bookTree":
              doPasteBook();
              break;
            case "folderTree":
              doPasteCategory();
              break;
            case "tagTree":
              doPasteTag();
              break;
            case "noteTree":
              doPasteNote();
              break;
          }
          break;
        case "znotes_copy_command":
          switch ( focusedElementId ) {
            case "bookTree":
              doCopyBook();
              break;
            case "folderTree":
              doCopyCategory();
              break;
            case "tagTree":
              doCopyTag();
              break;
            case "noteTree":
              doCopyNote();
              break;
          }
          break;
        case "znotes_cut_command":
          switch ( focusedElementId ) {
            case "bookTree":
              doCutBook();
              break;
            case "folderTree":
              doCutCategory();
              break;
            case "tagTree":
              doCutTag();
              break;
            case "noteTree":
              doCutNote();
              break;
          }
          break;
        case "znotes_delete_command":
          switch ( focusedElementId ) {
            case "bookTree":
              doDeleteBook();
              break;
            case "folderTree":
              doDeleteCategory();
              break;
            case "tagTree":
              doDeleteTag();
              break;
            case "noteTree":
              doDeleteNote();
              break;
          }
          break;
      }
    },
    onEvent: function( event ) {
    },
    getName: function() {
      return "main::editController";
    },
    getCommand: function( cmd ) {
      return ( cmd in editCommands ) ? document.getElementById( cmd ) : null;
    },
    updateCommands: function() {
      for ( var cmd in editCommands ) {
        Common.goUpdateCommand( cmd, this.getId(), window );
      }
    },
    register: function() {
      try {
        window.controllers.insertControllerAt( 0, this );
        this.getId = function() {
          return window.controllers.getControllerId( this );
        };
      } catch ( e ) {
        Components.utils.reportError(
          "An error occurred registering '" + this.getName() + "' controller: " + e
        );
      }
    },
    unregister: function() {
      for ( var cmd in editCommands ) {
        Common.goSetCommandEnabled( cmd, false, window );
      }
      try {
        window.controllers.removeController( this );
      } catch ( e ) {
        Components.utils.reportError(
          "An error occurred unregistering '" + this.getName() + "' controller: " + e
        );
      }
    }
  };

  function updateMainCommands() {
    mainController.updateCommands();
  };

  function updateEditCommands() {
    editController.updateCommands();
  };
  
  function updateCommandsVisibility() {
    var appmenuDebugSeparator =
      document.getElementById( "znotes_appmenu_debug_separator" );
    var mainmenuDebugSeparator =
      document.getElementById( "znotes_mainmenubar_debug_separator" );
    if ( Utils.IS_DEBUG_ENABLED ) {
      appmenuDebugSeparator.removeAttribute( "hidden" );
      mainmenuDebugSeparator.removeAttribute( "hidden" );
    } else {
      appmenuDebugSeparator.setAttribute( "hidden", "true" );
      mainmenuDebugSeparator.setAttribute( "hidden", "true" );
    }
    Common.goSetCommandHidden( "znotes_addons_command", !Utils.IS_STANDALONE, window );
    Common.goSetCommandHidden( "znotes_update_command", !Utils.IS_STANDALONE, window );
    Common.goSetCommandHidden( "znotes_testsuite_command", !Utils.IS_DEBUG_ENABLED, window );
    Common.goSetCommandHidden( "znotes_console_command", !Utils.IS_DEBUG_ENABLED, window );
    Common.goSetCommandHidden( "znotes_debugger_command", !( Utils.IS_DEBUG_ENABLED && Utils.IS_STANDALONE && Utils.IS_DEBUGGER_INSTALLED ), window );
    Common.goSetCommandHidden( "znotes_inspector_command", !( Utils.IS_DEBUG_ENABLED && Utils.IS_STANDALONE && Utils.IS_INSPECTOR_INSTALLED ), window );
    if ( Utils.IS_DEBUG_ENABLED && Utils.IS_STANDALONE ) {
      Utils.MAIN_WINDOW.startDebuggerServer();
    }
  };

  function updateCommonCommands() {
    Common.goUpdateCommand( "znotes_testsuite_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_console_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_debugger_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_inspector_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_addons_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_update_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_showappmenu_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_exit_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_showmainmenubar_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_showmaintoolbar_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_customizemaintoolbar_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_openoptionsdialog_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_openhelp_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_openabout_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_pagesetup_command", mainController.getId(), window );
  };
  
  function updateBookCommands() {
    Common.goUpdateCommand( "znotes_openbook_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_closebook_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_appendbook_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_deletebook_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_deletebookdata_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_editbook_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_renamebook_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_refreshbooktree_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_showfilterbar_command", mainController.getId(), window );
  };
  
  function updateCategoryCommands() {
    var isHidden = currentCategory && currentCategory.isBin();
    Common.goUpdateCommand( "znotes_refreshfoldertree_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_newcategory_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_deletecategory_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_renamecategory_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_clearbin_command", mainController.getId(), window );
    Common.goSetCommandHidden( "znotes_renamecategory_command", isHidden, window );
    Common.goSetCommandHidden( "znotes_clearbin_command", !isHidden, window );
  };
  
  function updateNoteCommands() {
    Common.goUpdateCommand( "znotes_newnote_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_importnote_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_deletenote_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_renamenote_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_processnote_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_updatenote_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_refreshnotetree_command", mainController.getId(), window );
  };

  function updateTagCommands() {
    Common.goUpdateCommand( "znotes_refreshtagtree_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_newtag_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_deletetag_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_renametag_command", mainController.getId(), window );
    Common.goUpdateCommand( "znotes_colortag_command", mainController.getId(), window );
  };  
  
  // znotes_exit_command
  function doExit() {
    Utils.IS_QUIT_ENABLED = true;
    observerService.notifyObservers( null, "znotes-quit-requested", null );
    if ( !Utils.IS_QUIT_ENABLED ) {
      return true;
    }
    tabMonitor.setActive( false );
    observerService.notifyObservers( null, "znotes-quit-accepted", null );
    if ( !Utils.IS_STANDALONE ) {
      Utils.getTabMail().closeTab( Utils.getMainTab() );
      if ( !Utils.IS_EXIT_QUIT_TB ) {
        return true;
      }
    }
    var appStartupSvc =
      Components.classes["@mozilla.org/toolkit/app-startup;1"]
                .getService( Components.interfaces.nsIAppStartup );
    appStartupSvc.quit( Components.interfaces.nsIAppStartup.eAttemptQuit );
    return true;
  };

  // znotes_pagesetup_command
  function doPageSetup() {
    var printSettingsService = Components.classes["@mozilla.org/gfx/printsettings-service;1"]
                                         .getService( Components.interfaces.nsIPrintSettingsService );
    var printingPromptService = Components.classes["@mozilla.org/embedcomp/printingprompt-service;1"]
                                          .getService( Components.interfaces.nsIPrintingPromptService );
    var preferencesService = Components.classes["@mozilla.org/preferences-service;1"]
                                       .getService( Components.interfaces.nsIPrefBranch );
    var gSavePrintSettings = false;
    var gPrintSettingsAreGlobal = false;
    var gSavePrintSettings = false;
    try {
      if ( preferencesService ) {
        gPrintSettingsAreGlobal = preferencesService.getBoolPref(
          "print.use_global_printsettings", false
        );
        gSavePrintSettings = preferencesService.getBoolPref(
          "print.save_print_settings", false
        );
      }
      var settings = null;
      try {
        if ( gPrintSettingsAreGlobal ) {
          settings = printSettingsService.globalPrintSettings;
          if ( !settings.printerName ) {
            settings.printerName = printSettingsService.defaultPrinterName;
          }
          printSettingsService.initPrintSettingsFromPrinter(
            settings.printerName,
            settings
          );
          printSettingsService.initPrintSettingsFromPrefs(
            settings,
            true,
            settings.kInitSaveAll
          );
        } else {
          settings = printSettingsService.newPrintSettings;
        }
      } catch (e) {
        Utils.log( e + "\n" + Utils.dumpStack() );
      }
      if ( settings ) {
        settings.isCancelled = false;
      }
      printingPromptService.showPageSetup( window, settings, null );
      if ( gSavePrintSettings ) {
        printSettingsService.savePrintSettingsToPrefs( settings, true, settings.kInitSaveNativeData );
      }
    } catch (e) {
      Utils.log( e + "\n" + Utils.dumpStack() );
      return false;
    }
    return true;
  };

  // znotes_showmainmenubar_command

  function updateMainMenubarVisibility() {
    if ( Utils.IS_MAINMENUBAR_VISIBLE ) {
      mainMenuBar.removeAttribute( "autohide" );
    } else {
      mainMenuBar.setAttribute( "autohide", "true" );
    }
    Common.goSetCommandAttribute( "znotes_showmainmenubar_command",
      "checked", Utils.IS_MAINMENUBAR_VISIBLE, window );
  };

  function doShowMainMenubar() {
    prefsBundle.setBoolPref( "isMainMenubarVisible", !Utils.IS_MAINMENUBAR_VISIBLE );
    return true;
  };

  // znotes_showmaintoolbar_command

  function updateMainToolbarVisibility() {
    if ( Utils.IS_MAINTOOLBAR_VISIBLE ) {
      mainToolBar.removeAttribute( "hidden" );
    } else {
      mainToolBar.setAttribute( "hidden", "true" );
    }
    Common.goSetCommandAttribute( "znotes_showmaintoolbar_command",
      "checked", Utils.IS_MAINTOOLBAR_VISIBLE, window );
  };

  function doShowMainToolbar() {
    prefsBundle.setBoolPref( "isMainToolbarVisible", !Utils.IS_MAINTOOLBAR_VISIBLE );
    return true;
  };

  // znotes_customizemaintoolbar_command
  function doCustomizeMainToolbar() {
    window.openDialog(
      "chrome://global/content/customizeToolbar.xul",
      "_blank",
      "chrome,all,dependent,centerscreen",
      document.getElementById( "znotes_maintoolbox" )
    ).focus();
    return true;
  };

  // znotes_openoptionsdialog_command
  function doOpenOptionsDialog() {
    window.open(
      "chrome://znotes/content/options.xul",
      "",
      "chrome,dialog,modal,centerscreen,resizable=yes"
    ).focus();
    return true;
  };

  // znotes_update_command
  function doOpenUpdateManager() {
    ru.akman.znotes.UpdateManager.open();
  };
  
  // znotes_addons_command
  function doOpenAddonsManager() {
    ru.akman.znotes.AddonsManager.open();
  };

  // znotes_testsuite_command
  function doOpenTestSuiteWindow() {
    var windowWatcher =
      Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                .getService( Components.interfaces.nsIWindowWatcher );
    var windowMediator =
      Components.classes["@mozilla.org/appshell/window-mediator;1"]
                .getService( Components.interfaces.nsIWindowMediator );
    var win = windowMediator.getMostRecentWindow( "znotes:test" );
    if ( win ) {
      windowWatcher.activeWindow = win;
    } else {
      if ( Utils.checkChromeURL( "chrome://znotes/content/testsuite.xul" ) ) {
        win = window.open(
          "chrome://znotes/content/testsuite.xul",
          "znotes:test",
          "chrome,dialog=no,modal=no,resizable=yes,centerscreen"
        );
        win.arguments = [
          {
            // window
            win: window,
            // document
            doc: document,
            // objects
            book: currentBook,
            category: currentCategory,
            tag: currentTag,
            note: currentNote,
            // keyset
            keyset: mainKeySet,
            // functions
            createWelcomeNote: createWelcomeNote,
            createNote: createNote
          }
        ];
      }
    }
    return true;
  };

  // znotes_console_command
  function doOpenConsoleWindow() {
    if ( consoleWindow ) {
      consoleWindow.focus();
    } else {
      consoleWindow = window.open(
        "chrome://global/content/console.xul",
        "_blank",
        "chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar"
      );
      consoleWindow.addEventListener( "close", onConsoleClose, true );
    }
    return true;
  };

  // znotes_inspector_command
  function doOpenInspectorWindow() {
    var platformWindow = Utils.getZNotesPlatformWindow();
    try {
      Utils.loadScript(
        "chrome://inspector/content/hooks.js",
        platformWindow,
        "UTF-8"
      );
      platformWindow.inspectDOMDocument( document );
    } catch ( e ) {
      // silent if inspector not installed
    }
    return true;
  };

  // znotes_debugger_command
  function doOpenDebuggerWindow() {
    var platformWindow = Utils.getZNotesPlatformWindow();
    try {
      Utils.loadScript(
        "chrome://venkman/content/venkman-overlay.js",
        platformWindow,
        "UTF-8"
      );
      platformWindow.start_venkman();
    } catch ( e ) {
      // silent if debugger not installed
    }
    return true;
  };
  
  // znotes_openhelp_command
  function doOpenHelp() {
    Utils.openLinkExternally(
      Utils.SITE + Utils.getSiteLanguage() + "/documentation.xhtml"
    );
    return true;
  };

  // znotes_openabout_command
  function doOpenAbout() {
    window.openDialog(
      "chrome://znotes/content/about.xul",
      "_blank",
      "chrome,dialog=yes,modal=yes,centerscreen,resizable=no"
    );
    return true;
  };

  // znotes_newtag_command
  function doNewTag() {
    if ( currentBook && currentBook.isOpen() ) {
      var name = getString( "main.tag.newName" );
      var color = "#FFFFFF";
      var newTag = createTag( currentBook, name, color );
      var aRow = tagsList.indexOf( newTag );
      tagTreeBoxObject.ensureRowIsVisible( aRow );
      tagTree.view.selection.select( aRow );
      tagTree.setAttribute( "editable", "true" );
      tagTree.startEditing( aRow, tagTree.columns.getNamedColumn( "tagTreeName" ) );
    }
    return true;
  };

  // znotes_deletetag_command
  function doDeleteTag() {
    if ( currentTag.isNoTag() ) {
      return true;
    }
    var params = {
      input: {
        title: getString( "main.tag.confirmDelete.title" ),
        message1: getFormattedString( "main.tag.confirmDelete.message1", [ currentTag.getName() ] ),
        message2: getString( "main.tag.confirmDelete.message2" )
      },
      output: null
    };
    window.openDialog(
      "chrome://znotes/content/confirmdialog.xul",
      "",
      "chrome,dialog=yes,modal=yes,centerscreen,resizable=no",
      params
    ).focus();
    if ( params.output && params.output.result ) {
      deleteTag( currentTag );
    }
    return true;
  };

  // znotes_renametag_command
  function doRenameTag() {
    if ( currentTag.isNoTag() ) {
      return true;
    }
    var aRow = tagTree.currentIndex;
    var aColumn = tagTree.columns.getNamedColumn( "tagTreeName" );
    tagTree.setAttribute( "editable", "true" );
    tagTree.startEditing( aRow, aColumn );
    return true;
  };

  // znotes_colortag_command
  function doColorTag() {
    var params = {
      input: {
        title: getString( "main.tag.colorselectdialog.title" ),
        message: getFormattedString( "main.tag.colorselectdialog.message", [ currentTag.getName() ] ),
        color: currentTag.getColor()
      },
      output: null
    };
    window.openDialog(
      "chrome://znotes/content/colorselectdialog.xul",
      "",
      "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
      params
    ).focus();
    if ( params.output ) {
      colorTag( currentTag, params.output.color );
    }
    return true;
  };

  // znotes_refreshtagtree_command
  function doRefreshTagTree() {
    refreshTagsList();
    restoreTagsTreeSelection();
    return true;
  };

  function updateNewNoteMenuPopup() {
    newNoteButtonMenuPopup = document.getElementById(
      "znotes_newnote_button_menupopup" );
    if ( !newNoteButtonMenuPopup ) {
      return;
    }
    while ( newNoteButtonMenuPopup.firstChild ) {
      newNoteButtonMenuPopup.removeChild( newNoteButtonMenuPopup.firstChild );
    }
    var types, doc, docs = ru.akman.znotes.DocumentManager
                                          .getInstance().getDocuments();
    var contentType, menuItem;
    for ( var name in docs ) {
      doc = docs[name];
      types = doc.getTypes();
      for ( var i = 0; i < types.length; i++ ) {
        contentType = types[i];
        menuItem = document.createElement( "menuitem" );
        menuItem.className = "menuitem-iconic";
        menuItem.setAttribute( "id",
          "newNoteButtonMenuPopup_" + doc.getName() + "_" + i );
        menuItem.setAttribute( "value", contentType );
        menuItem.setAttribute( "label", " " + doc.getDescription() );
        menuItem.setAttribute( "tooltiptext", contentType );
        menuItem.style.setProperty( "list-style-image",
          "url( '" + doc.getIconURL() + "' )" , "important" );
        menuItem.addEventListener( "command", updateSelectedPopupItem, false );
        newNoteButtonMenuPopup.appendChild( menuItem );
      }
    }
  };
  
  // znotes_newnote_command
  function doNewNote() {
    var aCategory, aName, aType, aTagID;
    aType = selectedPopupItem ?
      selectedPopupItem.getAttribute( "value" ) : Utils.DEFAULT_DOCUMENT_TYPE;
    selectedPopupItem = null;
    aCategory = currentCategory;
    aTagID = null;
    if ( currentBook.getSelectedTree() === "Tags" ) {
      aCategory = currentBook.getContentTree().getRoot();
      aTagID = currentTag.getId();
      if ( aTagID === "00000000000000000000000000000000" ) {
        aTagID = null;
      }
    }
    aName = getString( "main.note.newName" );
    aName = getValidNoteName( aCategory, aName, aType );
    createNote( aCategory, aName, aType, aTagID );
  };

  // znotes_importnote_command
  function doImportNote() {
    window.open(
      "chrome://znotes/content/browser.xul",
      "",
      "chrome,toolbar,dialog=no,status,resizable,centerscreen"
    ).focus();
  };

  // znotes_deletenote_command
  function doDeleteNote() {
    var params = {
      input: {
        title: getString( "main.note.confirmDelete.title" ),
        message1: getFormattedString(
          "main.note.confirmDelete.message1", [ currentNote.name ] ),
        message2: ( currentNote.isInBin() ?
                      getString( "main.category.confirmClearBin.message1" ) :
                      getString( "main.note.confirmDelete.message2" ) )
      },
      output: null
    };
    window.openDialog(
      "chrome://znotes/content/confirmdialog.xul",
      "",
      "chrome,dialog=yes,modal=yes,centerscreen,resizable=no",
      params
    ).focus();
    if ( params.output && params.output.result ) {
      deleteNote( currentNote );
    }
    return true;
  };

  // znotes_renamenote_command
  function doRenameNote() {
    var aRow = noteTree.currentIndex;
    var aColumn = noteTree.columns.getNamedColumn( "noteTreeName" );
    noteTree.setAttribute( "editable", "true" );
    noteTree.startEditing( aRow, aColumn );
    return true;
  };

  // znotes_processnote_command
  function doProcessNote() {
    var title = getString( "utils.openuri.apppicker.title" );
    Utils.openURI( currentNote.getURI(), true, window, title );
    return true;
  };

  // znotes_appendbook_command
  function doAppendBook() {
    var name = getString( "main.book.newName" );
    var index = 0, suffix = "";
    while ( bookManager.exists( name + suffix ) ) {
      suffix = " (" + ++index + ")";
    }
    name += suffix;
    var defaultDriver = ru.akman.znotes.DriverManager
                                       .getInstance().getDefaultDriver();
    var params = {
      input: {
        name: name,
        description: "",
        driver: defaultDriver.getName(),
        connection: defaultDriver.getParameters()
      },
      output: null
    };
    window.openDialog(
      "chrome://znotes/content/book.xul",
      "",
      "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
      params
    ).focus();
    if ( !params.output ) {
      return false;
    }
    createBook( params.output );
  };

  // znotes_deletebook_command
  function doDeleteBook() {
    var params = {
      input: {
        title: getString( "main.book.confirmDelete.title" ),
        message1: getFormattedString(
          "main.book.confirmDelete.message1", [ currentBook.getName() ] ),
        message2: getString( "main.book.confirmDelete.message2" )
      },
      output: null
    };
    window.openDialog(
      "chrome://znotes/content/confirmdialog.xul",
      "",
      "chrome,dialog=yes,modal=yes,centerscreen,resizable=no",
      params
    ).focus();
    if ( params.output && params.output.result ) {
      deleteBook( currentBook );
    }
    return true;
  };

  // znotes_deletebookdata_command
  function doDeleteBookData() {
    var params = {
      input: {
        title: getString( "main.book.confirmDeleteData.title" ),
        message1: getFormattedString(
          "main.book.confirmDeleteData.message1", [ currentBook.getName() ] ),
        message2: getString( "main.book.confirmDeleteData.message2" )
      },
      output: null
    };
    window.openDialog(
      "chrome://znotes/content/confirmdialog.xul",
      "",
      "chrome,dialog=yes,modal=yes,centerscreen,resizable=no",
      params
    ).focus();
    if ( params.output && params.output.result ) {
      deleteBookWithAllData( currentBook );
    }
    return true;
  };

  // znotes_renamebook_command
  function doRenameBook() {
    var aRow = bookTree.currentIndex;
    var aColumn = bookTree.columns.getNamedColumn( "bookTreeName" );
    bookTree.setAttribute( "editable", "true" );
    bookTree.startEditing( aRow, aColumn );
    return true;
  };

  // znotes_editbook_command
  function doEditBook() {
    editBook( currentBook );
    return true;
  };

  // znotes_openbook_command
  function doOpenBook() {
    if ( !currentBook.isOpen() ) {
      openBook( currentBook );
    }
    return true;
  };

  // znotes_closebook_command
  function doCloseBook() {
    closeBook( currentBook );
    return true;
  };

  // znotes_refreshbooktree_command
  function doRefreshBookTree() {
    refreshBooksList();
    restoreBooksTreeSelection();
    return true;
  };

  // znotes_refreshfoldertree_command
  function doRefreshFolderTree() {
    refreshCategoriesList();
    restoreCategoriesTreeSelection();
    return true;
  };

  // znotes_newcategory_command
  function doNewCategory() {
    var name = getString( "main.category.newName" );
    var index = 1;
    var suffix = "";
    while ( !currentCategory.canCreateCategory( name + suffix ) ) {
      index++;
      suffix = " (" + index + ")";
    }
    createCategory( currentCategory, name + suffix );
    return true;
  };

  // znotes_deletecategory_command
  function doDeleteCategory() {
    var params = {
      input: {
        title: getString( "main.category.confirmDelete.title" ),
        message1: getFormattedString(
          "main.category.confirmDelete.message1",
          [ currentCategory.name ]
        ),
        message2: ( currentCategory.isInBin() ?
                      getString( "main.category.confirmClearBin.message1" ) :
                      getString( "main.category.confirmDelete.message2" ) )
      },
      output: null
    };
    window.openDialog(
      "chrome://znotes/content/confirmdialog.xul",
      "",
      "chrome,dialog=yes,modal=yes,centerscreen,resizable=no",
      params
    ).focus();
    if ( params.output && params.output.result ) {
      deleteCategory( currentCategory );
    }
    return true;
  };

  // znotes_clearbin_command
  function doClearBin() {
    var params = {
      input: {
        title: getString( "main.category.confirmClearBin.title" ),
        message1: getFormattedString(
          "main.category.confirmClearBin.message1",
          [ currentCategory.name ]
        ),
        message2: getString( "main.category.confirmClearBin.message2" )
      },
      output: null
    };
    window.openDialog(
      "chrome://znotes/content/confirmdialog.xul",
      "",
      "chrome,dialog=yes,modal=yes,centerscreen,resizable=no",
      params
    ).focus();
    if ( params.output && params.output.result ) {
      clearBin();
    }
    return true;
  };
  
  // znotes_renamecategory_command
  function doRenameCategory() {
    var aRow = getFolderTreeRow( currentCategory );
    var aColumn = folderTree.columns.getNamedColumn( "folderTreeName" );
    folderTree.setAttribute( "editable", "true" );
    folderTree.startEditing( aRow, aColumn );
    return true;
  };

  // znotes_updatenote_command
  function doUpdateNote() {
    updateNoteTreeItem( currentNote );
    currentNoteChanged( true );
    return true;
  };

  // znotes_refreshnotetree_command
  function doRefreshNoteTree() {
    updateNoteView();
    return true;
  };

  // znotes_showfilterbar_command
  
  function isQuickFilterCollapsed() {
    var isCollapsed = true;
    if ( !qfBox.hasAttribute( "collapsed" ) ) {
      isCollapsed = false;
    } else {
      if ( qfBox.getAttribute( "collapsed" ) == "false" ) {
        isCollapsed = false;
      }
    }
    return isCollapsed;
  };

  function updateQuickFilterState() {
    if ( isQuickFilterCollapsed() ) {
      qfButton.setAttribute( "checked" , "false" );
      qfButton.setAttribute( "checkState" , "0" );
    } else {
      qfButton.setAttribute( "checked" , "true" );
      qfButton.setAttribute( "checkState" , "1" );
    }
  };
  
  function doToggleFilterBar() {
    var isCollapsed = !isQuickFilterCollapsed();
    qfBox.setAttribute( "collapsed", isCollapsed );
    if ( currentBook ) {
      currentBook.savePreference( "qfBoxCollapsed", isCollapsed );
    }
    updateQuickFilterState();
    return true;
  };

  // edit commands

  // selectAll
  
  function doSelectAllBook() {
  };
  
  function doSelectAllCategory() {
  };
  
  function doSelectAllTag() {
  };
  
  function doSelectAllNote() {
  };

  // copy
  
  function doCopyBook() {
  };
  
  function doCopyCategory() {
  };
  
  function doCopyTag() {
  };
  
  function doCopyNote() {
  };

  // cut
  
  function doCutBook() {
  };
  
  function doCutCategory() {
  };
  
  function doCutTag() {
  };
  
  function doCutNote() {
  };
  
  // paste
  
  function doPasteBook() {
  };
  
  function doPasteCategory() {
  };
  
  function doPasteTag() {
  };
  
  function doPasteNote() {
  };
  
  // undo
  
  function doUndo() {
  };
  
  // redo
  
  function doRedo() {
  };

  // znotes_shownote_command ( not command )
  function doShowNote() {
    if ( currentNote ) {
      showNote( currentNote, false );
    }
  };

  //
  // COMMON EVENTS 
  //

  function onSplitterDblClick( event ) {
    var source = event.target;
    var state = source.getAttribute( "state" );
    if ( !state ) {
      state = "open";
    }
    if ( state == "open" ) {
      source.setAttribute( "state", "collapsed" );
    } else if ( state == "collapsed" ) {
      source.setAttribute( "state", "open" );
    }
    return true;
  };

  function onCustomizeMainToolbarDone( isChanged ) {
    body.updateStyle( { iconsize: mainToolBar.getAttribute( "iconsize" ) } );
    updateNewNoteMenuPopup();
    updateMainCommands();
    updateEditCommands();
    updateQuickFilterState();
    return true;
  };

  function onConsoleClose( event ) {
    consoleWindow.minimize();
    event.preventDefault();
    event.stopPropagation();
    return false;
  };
  
  //
  // CATEGORIES
  //

  function processFolderTree( aTreeChildren, aProcessor ) {
    for ( var i = 0; i < aTreeChildren.children.length; i++ ) {
      var aTreeItem = aTreeChildren.children[i];
      if ( aTreeItem.nodeName != "treeitem" ) {
        continue;
      }
      if ( aProcessor.process( aTreeItem ) ) {
        return true;
      }
      if ( aTreeItem.children.length > 1 ) {
        if ( processFolderTree( aTreeItem.children[1], aProcessor ) ) {
          return true;
        }
      }
    }
    return false;
  };

  function getFolderTreeItemAtItemIndex( anItemIndex ) {
    var aProcessor = {
      treeItem: null,
      counterIndex: -1,
      locateIndex: anItemIndex,
      process: function( aTreeItem ) {
        this.counterIndex++;
        if ( this.counterIndex == this.locateIndex ) {
          this.treeItem = aTreeItem;
          return true;
        }
        return false;
      }
    };
    processFolderTree( folderTreeChildren, aProcessor );
    return aProcessor.treeItem;
  };

  function getFolderTreeItemAndCategoryAtRowIndex( aRowIndex ) {
    var aProcessor = {
      category: null,
      treeItem: null,
      counterIndex: -1,
      rowIndex: aRowIndex,
      process: function( aTreeItem ) {
        this.counterIndex++;
        var aTreeItemIndex = folderTree.view.getIndexOfItem( aTreeItem );
        if ( aTreeItemIndex == this.rowIndex ) {
          this.treeItem = aTreeItem;
          this.category = categoriesList[this.counterIndex];
          return true;
        }
        return false;
      }
    };
    processFolderTree( folderTreeChildren, aProcessor );
    return { category: aProcessor.category, item: aProcessor.treeItem };
  };

  function getFolderTreeItem( aCategory ) {
    return getFolderTreeItemAtItemIndex(
      categoriesList.indexOf( aCategory )
    );
  };

  function getFolderTreeRow( aCategory ) {
    var item = getFolderTreeItem( aCategory );
    if ( item == null ) {
      return -1;
    }
    return folderTree.view.getIndexOfItem( item );
  };

  function getFolderTreeItemRowDepth( anItem ) {
    if ( anItem.nodeName !== "treeitem" ||
         anItem.getAttribute( "container" ) !== "true" ||
         anItem.getAttribute( "open" ) !== "true" ) {
      return 0;
    }
    var aChildrenItems = anItem.lastElementChild;
    var result = aChildrenItems.children.length;
    for ( var i = 0; i < aChildrenItems.children.length; i++ ) {
      var aChildrenItem = aChildrenItems.children[i];
      result += getFolderTreeItemRowDepth( aChildrenItem );
    };
    return result;
  };

  function enableCategoriesList() {
    folderTree.removeAttribute( "disabled" );
  };

  function disableCategoriesList() {
    folderTree.setAttribute( "disabled", "true" );
  };
  
  function createCategoriesList() {
    var append = function( aCategory ) {
      if ( !aCategory ) {
        return;
      }
      categoriesList.push( aCategory );
      var categories = aCategory.getCategories();
      for ( var i = 0; i < categories.length; i++ ) {
        append( categories[i] );
      }
    };
    if ( currentBook && currentBook.isOpen() ) {
      var contentTree = currentBook.getContentTree();
      if ( contentTree ) {
        if ( categoriesList ) {
          categoriesList.splice( 0, categoriesList.length );
        } else {
          categoriesList = [];
        }
        append( contentTree.getRoot() );
      } else {
        categoriesList = null;
      }
    } else {
      categoriesList = null;
    }
  };

  function createFolderTreeChildren( aCategory, aTreeChildren ) {
    var treeItem = createFolderTreeItem( aCategory );
    var treeChildren = treeItem.lastChild;
    aTreeChildren.appendChild( treeItem );
    var categories = aCategory.getCategories();
    for ( var i = 0; i < categories.length; i++ ) {
      createFolderTreeChildren( categories[i], treeChildren );
    }
  };
  
  function updateFolderTreeChildren( aCategory ) {
    var treeChildren, categories;
    var treeItem = getFolderTreeItem( aCategory );
    if ( treeItem ) {
      treeChildren = treeItem.lastChild;
      folderTree.removeEventListener( "select", onFolderSelect, false );
      while ( treeChildren.firstChild ) {
        treeChildren.removeChild( treeChildren.firstChild );
      }
      categories = aCategory.getCategories();
      for ( var i = 0; i < categories.length; i++ ) {
        createFolderTreeChildren( categories[i], treeChildren );
      }
      folderTree.addEventListener( "select", onFolderSelect, false );
    }
  };

  function showCategoriesList() {
    folderTree.removeEventListener( "select", onFolderSelect, false );
    while ( folderTreeChildren.firstChild ) {
      folderTreeChildren.removeChild( folderTreeChildren.firstChild );
    }
    if ( categoriesList && categoriesList[0] ) {
      createFolderTreeChildren( categoriesList[0], folderTreeChildren );
      enableCategoriesList();
    } else {
      disableCategoriesList();
    }
    folderTree.addEventListener( "select", onFolderSelect, false );
  }

  function refreshCategoriesList() {
    createCategoriesList();
    showCategoriesList();
    folderTreeBoxObject.clearStyleAndImageCaches();
  };

  function createFolderTreeItem( aCategory ) {
    var treeItem = null;
    var treeRow = null;
    var treeCell = null;
    var treeChildren = null;
    treeItem = document.createElement( "treeitem" );
    treeRow = document.createElement( "treerow" );
    Utils.setProperty( treeRow, "folderrow" );
    if ( aCategory.isBin() ) {
      Utils.addProperty( treeRow, "binrow" );
    }
    treeCell = document.createElement( "treecell" );
    treeCell.setAttribute( "label", "" + aCategory.getName() );
    Utils.setProperty( treeCell, "folder" );
    if ( aCategory.isBin() ) {
      Utils.addProperty( treeCell, "bin" );
      if ( !aCategory.hasCategories() && !aCategory.hasNotes() ) {
        Utils.addProperty( treeCell, "empty" );
      }
    } else if ( aCategory.isRoot() ) {
      Utils.addProperty( treeCell, "root" );
    }
    treeRow.appendChild( treeCell );
    treeCell = document.createElement( "treecell" );
    treeCell.setAttribute( "label", "" + aCategory.getNotesCount() );
    treeRow.appendChild( treeCell );
    treeItem.appendChild( treeRow );
    if ( aCategory.hasCategories() ) {
      treeItem.setAttribute( "container", "true" );
    }
    if ( aCategory.isOpen() ) {
      treeItem.setAttribute( "open", "true" );
    }
    treeChildren = document.createElement( "treechildren" );
    treeItem.appendChild( treeChildren );
    return treeItem;
  };
  
  function updateFolderTreeItem( aCategory ) {
    var treeRow, treeCell;
    var treeItem = getFolderTreeItem( aCategory );
    if ( treeItem ) {
      treeRow = treeItem.firstChild;
      treeCell = treeRow.childNodes[
        folderTree.columns.getNamedColumn( "folderTreeName" ).index ];
      treeCell.setAttribute( "label", "" + aCategory.getName() );
      if ( aCategory.isBin() ) {
        Utils.addProperty( treeCell, "bin" );
        if ( aCategory.hasCategories() || aCategory.hasNotes() ) {
          Utils.removeProperty( treeCell, "empty" );
        } else {
          Utils.addProperty( treeCell, "empty" );
        }
      } else if ( aCategory.isRoot() ) {
        Utils.addProperty( treeCell, "root" );
      }
      treeCell = treeRow.childNodes[
        folderTree.columns.getNamedColumn( "folderTreeCount" ).index ];
      treeCell.setAttribute( "label", "" + aCategory.getNotesCount() );
      if ( aCategory.hasCategories() ) {
        treeItem.setAttribute( "container", "true" );
      } else {
        treeItem.removeAttribute( "container" );
      }
      folderTree.removeEventListener( "select", onFolderSelect, false );
      if ( aCategory.isOpen() ) {
        treeItem.setAttribute( "open", "true" );
      } else {
        treeItem.removeAttribute( "open" );
      }
      folderTree.addEventListener( "select", onFolderSelect, false );
    }
  };

  function createCategory( aRoot, aName ) {
    var aRow;
    aRoot.setOpenState( true );
    updateFolderTreeItem( aRoot );
    aRow = getFolderTreeRow( aRoot.createCategory( aName ) );
    folderTreeBoxObject.ensureRowIsVisible( aRow );
    folderTree.view.selection.select( aRow );
    folderTree.setAttribute( "editable", "true" );
    folderTree.startEditing( aRow,
      folderTree.columns.getNamedColumn( "folderTreeName" ) );
  };

  function renameCategory( aCategory, aNewName ) {
    try {
      aCategory.rename( aNewName );
    } catch ( e ) {
      openErrorDialog(
        getFormattedString( "main.errordialog.category", [ aNewName ] ),
        e.message
      );
      throw e;
    }
    return aCategory;
  };

  function deleteCategory( aCategory ) {
    aCategory.remove();
  };

  function clearBin() {
    if ( currentBook && currentBook.isOpen() ) {
      currentBook.getContentTree().clearBin();
    }
  };
  
  function categoryMoveTo( aCategory, anIndex ) {
    aCategory.moveTo( anIndex );
  };

  function categoryMoveInto( aCategory, aParent ) {
    aCategory.moveInto( aParent );
  };

  // CATEGORIES EVENTS

  function onFolderBlur( event ) {
    updateEditCommands();
  };

  function onFolderFocus( event ) {
    switch ( currentBook.getSelectedTree() ) {
      case "Categories":
        break;
      case "Tags":
        restoreCategoriesTreeSelection();
        break;
    }
    updateEditCommands();
    return true;
  };
  
  function restoreCurrentSelection() {
    if ( !currentBook ) {
      return;
    }
    var row = booksList.indexOf( currentBook );
    bookTree.removeEventListener( "select", onBookSelect, false );
    if ( row >=0 && row < bookTree.view.rowCount ) {
      bookTreeBoxObject.ensureRowIsVisible( row );
    }
    bookTree.view.selection.select( row );
    bookTree.addEventListener( "select", onBookSelect, false );
    switch ( currentBook.getSelectedTree() ) {
      case "Categories":
        row = ( currentCategory ? getFolderTreeRow( currentCategory ) : -1 );
        folderTree.removeEventListener( "select", onFolderSelect, false );
        if ( row >=0 && row < noteTree.view.rowCount ) {
          folderTreeBoxObject.ensureRowIsVisible( row );
        }
        folderTree.view.selection.select( row );
        folderTree.addEventListener( "select", onFolderSelect, false );
        tagTree.removeEventListener( "select", onTagSelect, false );
        tagTree.view.selection.select( -1 );
        tagTree.addEventListener( "select", onTagSelect, false );
        break;
      case "Tags":
        row = ( currentTag ? tagsList.indexOf( currentTag ) : -1 );
        tagTree.removeEventListener( "select", onTagSelect, false );
        if ( row >=0 && row < noteTree.view.rowCount ) {
          tagTreeBoxObject.ensureRowIsVisible( row );
        }
        tagTree.view.selection.select( row );
        tagTree.addEventListener( "select", onTagSelect, false );
        folderTree.removeEventListener( "select", onFolderSelect, false );
        folderTree.view.selection.select( -1 );
        folderTree.addEventListener( "select", onFolderSelect, false );
        break;
    }
    row = ( currentNote ? notesList.indexOf( currentNote ) : -1 );
    noteTree.removeEventListener( "select", onNoteSelect, false );
    if ( row >=0 && row < noteTree.view.rowCount ) {
      noteTreeBoxObject.ensureRowIsVisible( row );
    }
    noteTree.view.selection.select( row );
    noteTree.addEventListener( "select", onNoteSelect, false );
  };
  
  function onFolderSelect( event ) {
    var category, data, row;
    if ( isDragDropActive ) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
    category = null;
    if ( folderTree.currentIndex >= 0 ) {
      category = getFolderTreeItemAndCategoryAtRowIndex(
        folderTree.currentIndex ).category;
    }
    if ( currentBook &&
         currentBook.getSelectedTree() == "Categories" &&
         currentCategory &&
         currentCategory == category ) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
    data = { canChange: true };
    body.notify(
      new ru.akman.znotes.core.Event( "BeforeCurrentNoteChange", data )
    );
    if ( !data.canChange ) {
      restoreCurrentSelection();
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
    currentCategory = category;
    currentTag = null;
    currentNote = null;
    currentBook.setSelectedTree( "Categories" );
    saveCategoriesTreeSelection();
    clearTagTreeSelection();
    currentCategoryChanged();
    return true;
  };

  function clearFolderTreeSelection() {
    folderTree.removeEventListener( "select", onFolderSelect, false );
    folderTree.view.selection.select( -1 );
    folderTree.addEventListener( "select", onFolderSelect, false );
  };

  function onFolderContextMenu( event ) {
    var aRow = folderTreeBoxObject.getRowAt( event.clientX, event.clientY );
    if ( anEditCategory !== null ||
         aRow < 0 || aRow > folderTree.view.rowCount - 1 ) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
    return true;
  };  

  function onFolderTreeTextBoxEvent( event ) {
    var aRow = null;
    var aColumn = null;
    switch ( event.type ) {
      case "keypress" :
        switch ( event.keyCode ) {
          case event.DOM_VK_HOME :
            if ( event.shiftKey ) {
              folderTreeTextBox.setSelectionRange( 0, folderTreeTextBox.selectionEnd );
            } else {
              folderTreeTextBox.setSelectionRange( 0, 0 );
            }
            break;
          case event.DOM_VK_END :
            var textLength = folderTreeTextBox.textLength;
            if ( textLength > 0 ) {
              if ( event.shiftKey ) {
                folderTreeTextBox.setSelectionRange( folderTreeTextBox.selectionStart, textLength );
              } else {
                folderTreeTextBox.setSelectionRange( textLength, textLength );
              }
            }
            break;
        }
        break;
      case "focus" :
        anEditCategory = currentCategory;
        aRow = getFolderTreeRow( anEditCategory );
        aColumn = folderTree.columns.getNamedColumn( "folderTreeName" );
        oldValue = folderTree.view.getCellText( aRow, aColumn );
        break;
      case "blur" :
        aRow = getFolderTreeRow( anEditCategory );
        aColumn = folderTree.columns.getNamedColumn( "folderTreeName" );
        newValue = folderTree.view.getCellText( aRow, aColumn );
        if ( newValue.replace(/(^\s+)|(\s+$)/g, "").length == 0 ) {
          folderTree.view.setCellText( aRow, aColumn, oldValue );
          anEditCategory = null;
          folderTree.setAttribute( "editable", "false" );
          break;
        }
        if ( oldValue != newValue ) {
          try {
            renameCategory( anEditCategory, newValue );
          } catch ( e ) {
            folderTree.view.setCellText( aRow, aColumn, oldValue );
          }
        }
        anEditCategory = null;
        folderTree.setAttribute( "editable", "false" );
        break;
    }
    return true;
  };

  // CATEGORIES DRAG & DROP
  
  function clearFolderTreeSeparator() {
    if ( folderTreeSeparatorRow != null ) {
      if ( folderTreeSeparator.parentNode != null )
        folderTreeSeparator = folderTreeSeparator.parentNode.removeChild( folderTreeSeparator );
    }
    folderTreeSeparatorRow = null;
  };

  function showFolderTreeSeparator( aRow ) {
    folderTreeSeparatorRow = aRow;
    if ( folderTreeSeparatorRow > folderTree.view.rowCount - 1 )
      folderTreeSeparatorRow = -1;
    if ( folderTreeSeparatorRow == -1 ||
      folderTreeSeparatorRow == infoDragDrop.rowOfCategoryParent + infoDragDrop.depthOfCategoryParent + 1 ) {
      infoDragDrop.itemOfCategoryParent.lastChild.appendChild( folderTreeSeparator );
    } else {
      var anItem = folderTree.view.getItemAtIndex( folderTreeSeparatorRow );
      anItem.parentNode.insertBefore( folderTreeSeparator, anItem );
    }
  };

  function clearFolderTreeDropRow() {
    if ( folderTreeDropRow != null ) {
      var anItem = folderTree.view.getItemAtIndex( folderTreeDropRow );
      anItem.firstChild.removeAttribute( "properties", "folderdroprow" );
    }
    folderTreeDropRow = null;
  };

  function showFolderTreeDropRow( aRow ) {
    folderTreeDropRow = aRow;
    var anItem = folderTree.view.getItemAtIndex( folderTreeDropRow );
    anItem.firstChild.setAttribute( "properties", "folderdroprow" );
  };

  function clearFolderTreeDragMarkers() {
    clearFolderTreeSeparator();
    clearFolderTreeDropRow();
  };

  function getDragDropInfo() {
    if ( !currentCategory ) {
      return;
    }
    infoDragDrop.folderTreeRowCount = folderTree.view.rowCount;
    infoDragDrop.itemOfCategory = getFolderTreeItemAtItemIndex(
        categoriesList.indexOf( currentCategory )
    );
    infoDragDrop.rowOfCategory = folderTree.view.getIndexOfItem(
      infoDragDrop.itemOfCategory
    );
    if ( !currentCategory.isRoot() ) {
      infoDragDrop.rowOfCategoryParent = folderTree.view.getParentIndex(
        infoDragDrop.rowOfCategory
      );
      infoDragDrop.itemOfCategoryParent = folderTree.view.getItemAtIndex(
        infoDragDrop.rowOfCategoryParent
      );
      infoDragDrop.depthOfCategoryParent = getFolderTreeItemRowDepth(
        infoDragDrop.itemOfCategoryParent
      );
    } else {
      infoDragDrop.rowOfCategoryParent = null;
      infoDragDrop.itemOfCategoryParent = null;
      infoDragDrop.depthOfCategoryParent = null;
    };
    infoDragDrop.depthOfCategory = getFolderTreeItemRowDepth(
      infoDragDrop.itemOfCategory
    );
    infoDragDrop.itemOfBin = getFolderTreeItemAtItemIndex(
        categoriesList.indexOf( currentCategory.getBin() )
    );
    infoDragDrop.rowOfBin = folderTree.view.getIndexOfItem(
      infoDragDrop.itemOfBin
    );
    infoDragDrop.depthOfBin = getFolderTreeItemRowDepth(
      infoDragDrop.itemOfBin
    );
    infoDragDrop.rowOfNoteParent = -1;
    if ( currentNote != null ) {
      infoDragDrop.rowOfNoteParent = folderTree.view.getIndexOfItem(
        getFolderTreeItemAtItemIndex( categoriesList.indexOf( currentNote.getParent() ) )
      );
    }
  };

  function onFolderDragDrop( event ) {
    var dropEffect = event.dataTransfer.dropEffect;
    var isCategory = event.dataTransfer.types.contains( "znotes/x-category" );
    var isNote = event.dataTransfer.types.contains( "znotes/x-note" );
    var aRow = folderTreeBoxObject.getRowAt( event.clientX, event.clientY );
    var separatorAmend = folderTreeSeparatorRow === null ? 0 : 1;
    var aTargetInfo, anIndex, anOldIndex, aParent;
    if ( infoDragDrop.folderTreeRowCount !== folderTree.view.rowCount ) {
      getDragDropInfo();
    }
    if ( aRow > folderTree.view.rowCount - 1 ) {
      aRow = -1;
    }
    var isDisabled = (
      ( currentBook && currentBook.getSelectedTree() === "Tags" ) ||
      ( !isNote && !isCategory ) ||
      ( isNote && dropEffect !== "move" ) ||
      ( isCategory && dropEffect !== "copy" && dropEffect !== "move" ) ||
      // MOVE
      ( isCategory && dropEffect === "move" && aRow === -1 &&
        infoDragDrop.rowOfCategory < infoDragDrop.rowOfBin
      ) ||
      ( isCategory && dropEffect === "move" && aRow === -1 &&
        infoDragDrop.rowOfCategory ===
        infoDragDrop.folderTreeRowCount - infoDragDrop.depthOfCategory - 1
      ) ||
      ( isCategory && dropEffect === "move" && aRow !== -1 &&
        aRow > infoDragDrop.rowOfBin - separatorAmend &&
        infoDragDrop.rowOfCategory < infoDragDrop.rowOfBin
      ) ||
      ( isCategory && dropEffect === "move" && aRow !== -1 &&
        aRow >= infoDragDrop.rowOfCategory - separatorAmend &&
        aRow <= infoDragDrop.rowOfCategory + infoDragDrop.depthOfCategory + 1
      ) ||
      ( isCategory && dropEffect === "move" && aRow !== -1 &&
        aRow !== infoDragDrop.rowOfCategoryParent +
                 infoDragDrop.depthOfCategoryParent + 1 &&
        infoDragDrop.rowOfCategoryParent !==
        folderTree.view.getParentIndex( aRow )
      ) ||
      // COPY
      ( isCategory && dropEffect === "copy" && aRow === -1 ) ||
      ( isCategory && dropEffect === "copy" &&
        aRow >= infoDragDrop.rowOfCategory &&
        aRow <= infoDragDrop.rowOfCategory + infoDragDrop.depthOfCategory
      ) ||
      ( isCategory && dropEffect === "copy" &&
        aRow === infoDragDrop.rowOfCategoryParent
      ) ||
      ( isNote && ( aRow === -1 || aRow === infoDragDrop.rowOfNoteParent ) )
    );
    switch ( event.type ) {
      case "dragstart":
        if ( currentCategory &&
             ( currentCategory.isRoot() || currentCategory.isBin() ) ) {
          return;
        }
        getDragDropInfo();
        folderTree.removeEventListener( "select", onFolderSelect, false );
        isDragDropActive = true;
        event.dataTransfer.setData( "znotes/x-category", "CATEGORY" );
        return;
      case "dragenter":
      case "drag":
        event.stopPropagation();
        event.preventDefault();
        return;
      case "dragleave":
        clearFolderTreeDragMarkers();
        event.stopPropagation();
        event.preventDefault();
        return;
      case "dragover":
        if ( isDisabled ) {
          clearFolderTreeDragMarkers();
          event.dataTransfer.dropEffect = "none";
          return;
        }
        event.stopPropagation();
        event.preventDefault();
        if ( isCategory ) {
          if ( dropEffect === "move" ) {
            if ( aRow === folderTreeSeparatorRow ) {
              return;
            }
            clearFolderTreeDragMarkers();
            showFolderTreeSeparator( aRow );
          }
          if ( dropEffect === "copy" ) {
            if ( aRow === folderTreeDropRow )
              return;
            clearFolderTreeDragMarkers();
            showFolderTreeDropRow( aRow );
          }
        }
        if ( isNote ) {
          if ( aRow === folderTreeDropRow )
            return;
          clearFolderTreeDropRow();
          showFolderTreeDropRow( aRow );
        }
        return;
      case "drop":
        if ( isDisabled ) {
          event.dataTransfer.dropEffect = "none";
          return;
        }
        event.stopPropagation();
        event.preventDefault();
        if ( isCategory &&
             event.dataTransfer.getData( "znotes/x-category" ) === "CATEGORY" ) {
          infoDragDrop.row = aRow;
          if ( dropEffect === "move" &&
               aRow !== -1 &&
               infoDragDrop.rowOfCategoryParent !==
               folderTree.view.getParentIndex( aRow ) )
            infoDragDrop.row = -1;
          infoDragDrop.dropEffect = dropEffect;
          break;
        }
        if ( isNote &&
             event.dataTransfer.getData( "znotes/x-note" ) === "NOTE" ) {
          infoDragDrop.row = aRow;
          infoDragDrop.dropEffect = "copy";
          break;
        }
        clearFolderTreeDragMarkers();
        return;
      case "dragend":
        clearFolderTreeDragMarkers();
        clearNoteTreeDragMarkers();
        isDragDropActive = false;
        event.stopPropagation();
        event.preventDefault();
        folderTree.addEventListener( "select", onFolderSelect, false );
        if ( dropEffect === "none" ) {
          return;
        }
        switch ( infoDragDrop.dropEffect ) {
          case "move":
            aParent = currentCategory.getParent();
            anOldIndex = currentCategory.getIndex();
            aTargetInfo = getFolderTreeItemAndCategoryAtRowIndex( infoDragDrop.row );
            if ( !aTargetInfo.category ) {
              anIndex = aParent.getCategoriesCount() - 1;
              if ( aParent.isRoot() ) {
                anIndex--;
              }
            } else {
              if ( aTargetInfo.category.getParent() !== aParent ) {
                anIndex = aParent.getCategoriesCount() - 1;
                if ( aParent.isRoot() ) {
                  anIndex--;
                }
              } else {
                anIndex = aTargetInfo.category.getIndex();
                if ( anIndex > anOldIndex ) {
                  anIndex--;
                }
              }
            }
            try {
              categoryMoveTo( currentCategory, anIndex );
            } catch ( e ) {
              openErrorDialog(
                getFormattedString( "main.errordialog.category", [ currentCategory.getName() ] ),
                e.message
              );
            }
            break;
          case "copy":
            aTargetInfo = getFolderTreeItemAndCategoryAtRowIndex( infoDragDrop.row );
            try {
              if ( aTargetInfo.category ) {
                categoryMoveInto( currentCategory, aTargetInfo.category );
              }
            } catch ( e ) {
              openErrorDialog(
                getFormattedString( "main.errordialog.category", [ currentCategory.getName() ] ),
                e.message
              );
            }
            break;
        }
        return;
    }
  };

  //
  // NOTES
  //

  function enableNotesList() {
    noteTree.removeAttribute( "disabled" );
  };

  function disableNotesList() {
    noteTree.setAttribute( "disabled", "true" );
  };
  
  function createNotesList() {
    if ( currentBook && currentBook.isOpen() ) {
      var contentTree = currentBook.getContentTree();
      if ( contentTree ) {
        if ( notesList ) {
          notesList.splice( 0, notesList.length );
        } else {
          notesList = [];
        }
        switch ( currentBook.getSelectedTree() ) {
          case "Categories":
            if ( currentCategory ) {
              notesList = currentCategory.getNotes();
            }
            break;
          case "Tags":
            notesList = contentTree.getNotesByTag( currentTag.getId() );
            break;
        }
      } else {
        notesList = null;
      }
    } else {
      notesList = null;
    }
  };

  function showNotesList() {
    noteTree.removeEventListener( "select", onNoteSelect, false );
    while ( noteTreeChildren.firstChild ) {
      noteTreeChildren.removeChild( noteTreeChildren.firstChild );
    }
    if ( notesList ) {
      for ( var i = 0; i < notesList.length; i++ ) {
        noteTreeChildren.appendChild( createNoteTreeItem( notesList[i] ) );
      }
    }
    noteTree.addEventListener( "select", onNoteSelect, false );
    if ( notesList ) {
      enableNotesList();
    } else {
      disableNotesList();
    }
  };

  function refreshNotesList() {
    createNotesList();
    showNotesList();
    noteTreeBoxObject.clearStyleAndImageCaches();
  };

  function createNoteTreeItem( aNote ) {
    if ( !currentBook || !currentBook.isOpen() ||
         !aNote || aNote.getBook() !== currentBook ) {
      return null;
    }
    //
    var aName = aNote.getName();
    var isLoading = aNote.isLoading();
    var aCategoryName = aNote.getParent().getName();
    var hasAttachments = aNote.hasAttachments();
    var aCreateDateTime = aNote.getCreateDateTime().toLocaleString();
    var anUpdateDateTime = aNote.getUpdateDateTime().toLocaleString();
    var aTypeName = aNote.getType();
    //
    var tagList = aNote.getBook().getTagList();
    var aNoTag = tagList.getNoTag();
    var aTagName = aNoTag.getName();
    var aTagColor = aNoTag.getColor();
    var aTagID = aNote.getMainTag();
    if ( aTagID != null ) {
      var aTag = tagList.getTagById( aTagID );
      if ( aTag ) {
        aTagName = aTag.getName();
        aTagColor = aTag.getColor();
      } else {
        aTagID = "00000000000000000000000000000000";
      }
    } else {
      aTagID = "00000000000000000000000000000000";
    }
    //
    var treeItem = null;
    var treeRow = null;
    var treeCell = null;
    treeRow = document.createElement( "treerow" );
    Utils.addProperty( treeRow, "NOTE_TAG_ROW_" + aTagID );
    treeCell = document.createElement( "treecell" );
    if ( hasAttachments ) {
      Utils.addProperty( treeCell, "attachment" );
    }
    Utils.addProperty( treeCell, "NOTE_TAG_ROW_" + aTagID );
    treeRow.appendChild( treeCell );
    treeCell = document.createElement( "treecell" );
    if ( isLoading ) {
      Utils.removeProperty( treeCell, "note" );
      Utils.addProperty( treeCell, "loading" );
      treeCell.setAttribute( "label", " " + getString( "main.note.loading" ) );
    } else {
      Utils.removeProperty( treeCell, "loading" );
      Utils.addProperty( treeCell, "note" );
      treeCell.setAttribute( "label", aName );
    }
    Utils.addProperty( treeCell, "NOTE_TAG_ROW_" + aTagID );
    treeRow.appendChild( treeCell );
    treeCell = document.createElement( "treecell" );
    treeCell.setAttribute( "label", aCategoryName );
    Utils.addProperty( treeCell, "NOTE_TAG_ROW_" + aTagID );
    treeRow.appendChild( treeCell );
    treeCell = document.createElement( "treecell" );
    treeCell.setAttribute( "label", aTagName );
    Utils.addProperty( treeCell, "NOTE_TAG_" + aTagID );
    Utils.addProperty( treeCell, "NOTE_TAG_ROW_" + aTagID );
    treeRow.appendChild( treeCell );
    treeCell = document.createElement( "treecell" );
    treeCell.setAttribute( "label", aTypeName );
    Utils.addProperty( treeCell, "NOTE_TAG_ROW_" + aTagID );
    treeRow.appendChild( treeCell );
    treeCell = document.createElement( "treecell" );
    treeCell.setAttribute( "label", aCreateDateTime );
    Utils.addProperty( treeCell, "NOTE_TAG_ROW_" + aTagID );
    treeRow.appendChild( treeCell );
    treeCell = document.createElement( "treecell" );
    treeCell.setAttribute( "label", anUpdateDateTime );
    Utils.addProperty( treeCell, "NOTE_TAG_ROW_" + aTagID );
    treeRow.appendChild( treeCell );
    treeItem = document.createElement( "treeitem" );
    treeItem.appendChild( treeRow );
    return treeItem;
  };

  function updateNoteTreeItem( aNote ) {
    if ( !currentBook || !currentBook.isOpen() ||
         !aNote || aNote.getBook() !== currentBook ) {
    //     || !noteTree || !noteTree.view ) {
      return;
    }
    var anItemInfo = getNoteTreeItemAndIndex( aNote );
    var anItem = anItemInfo.item;
    var anIndex = anItemInfo.index;
    if ( anItem ) {
      var id = aNote.getMainTag();
      var tagList = aNote.getBook().getTagList();
      var noTag = tagList.getNoTag();
      var tagName = noTag.getName();
      var tagID = "00000000000000000000000000000000";
      var tag = null;
      if ( id != null ) {
        tag = tagList.getTagById( id );
        if ( tag ) {
          tagName = tag.getName();
          tagID = id;
        }
      }
      var isLoading = aNote.isLoading();
      var noteUpdateDateTime = aNote.getUpdateDateTime().toLocaleString();
      var typeName = aNote.getType();
      var treeCell, treeRow = anItem.firstChild;
      Utils.setProperty( treeRow, "NOTE_TAG_ROW_" + tagID );
      // Attachments
      treeCell = treeRow.childNodes[ noteTree.columns.getNamedColumn( "noteTreeAttachments" ).index ];
      if ( aNote.hasAttachments() ) {
        Utils.setProperty( treeCell, "attachment" );
      } else {
        Utils.removeProperty( treeCell, "attachment" );
      }
      Utils.addProperty( treeCell, "NOTE_TAG_ROW_" + tagID );
      // Name
      treeCell = treeRow.childNodes[ noteTree.columns.getNamedColumn( "noteTreeName" ).index ];
      if ( isLoading ) {
        treeCell.setAttribute( "label", " " + getString( "main.note.loading" ) );
        Utils.setProperty( treeCell, "loading" );
      } else {
        treeCell.setAttribute( "label", aNote.getName() );
        Utils.setProperty( treeCell, "note" );
      }
      Utils.addProperty( treeCell, "NOTE_TAG_ROW_" + tagID );
      // Category
      treeCell = treeRow.childNodes[ noteTree.columns.getNamedColumn( "noteTreeCategory" ).index ];
      treeCell.setAttribute( "label", aNote.getParent().getName() );
      Utils.setProperty( treeCell, "NOTE_TAG_ROW_" + tagID );
      // Tag
      treeCell = treeRow.childNodes[ noteTree.columns.getNamedColumn( "noteTreeTag" ).index ];
      treeCell.setAttribute( "label", tagName );
      Utils.setProperty( treeCell, "NOTE_TAG_" + tagID );
      Utils.addProperty( treeCell, "NOTE_TAG_ROW_" + tagID );
      // Type
      treeCell = treeRow.childNodes[ noteTree.columns.getNamedColumn( "noteTreeType" ).index ];
      treeCell.setAttribute( "label", typeName );
      Utils.setProperty( treeCell, "NOTE_TAG_ROW_" + tagID );
      // Update DateTime
      treeCell = treeRow.childNodes[ noteTree.columns.getNamedColumn( "noteTreeUpdateDateTime" ).index ];
      treeCell.setAttribute( "label", noteUpdateDateTime );
      Utils.setProperty( treeCell, "NOTE_TAG_ROW_" + tagID );
      //
      noteTreeBoxObject.clearStyleAndImageCaches();
    }
  };

  function getNoteTreeItemAndIndex( aNote ) {
    var result = {
      item: null,
      index: notesList.indexOf( aNote )
    };
    if ( result.index >= 0 ) {
      result.item = noteTree.view.getItemAtIndex( result.index );
    }
    return result;
  };

  function createWelcomeNote( book ) {
    var abManager, directories, directory, dir;
    var creator, vendor, firstName, lastName, primaryEmail, found, card, cards;
    var wBrowser;
    var url = "chrome://znotes_welcome/content/index_" +
              Utils.getSiteLanguage() + ".xhtml";
    var aRoot = book.getContentTree().getRoot();
    var aType = Utils.DEFAULT_DOCUMENT_TYPE;
    var aName =
      getValidNoteName( aRoot, getString( "main.welcome.notename" ), aType );
    var note = aRoot.createNote( aName, aType );
    if ( !Utils.IS_STANDALONE ) {
      abManager = Components.classes["@mozilla.org/abmanager;1"]
                            .getService( Components.interfaces.nsIAbManager );
      directories = abManager.directories;
      while ( directories.hasMoreElements() ) {
        dir =
          directories.getNext()
                     .QueryInterface( Components.interfaces.nsIAbDirectory );
        if ( dir instanceof Components.interfaces.nsIAbDirectory ) {
          directory = dir;
          if ( directory.fileName == "abook.mab" && directory.dirType == 2 ) {
            break;
          }
        }
      }
      if ( directory != null ) {
        creator = Utils.CREATORS[0];
        vendor = Utils.VENDOR;
        firstName = Utils.decodeUTF8(
          creator.name.substring( 0, creator.name.indexOf( " " ) ) );
        lastName = Utils.decodeUTF8( creator.name.substr(
          creator.name.indexOf( " " ) + 1 ) );
        primaryEmail = creator.link.substr(
          creator.link.indexOf( ":" ) + 1 );
        found = false;
        cards = directory.childCards;
        while ( cards.hasMoreElements() ) {
          card = cards.getNext().QueryInterface(
            Components.interfaces.nsIAbCard );
          if ( card instanceof Components.interfaces.nsIAbCard ) {
            if ( card.firstName == firstName &&
                 card.lastName == lastName ) {
              found = true;
              note.addAttachment( [ card.directoryId + "\t" +
                card.localId, "contact" ] );
              break;
            }
          }
        }
        if ( !found ) {
          card = Components.classes["@mozilla.org/addressbook/cardproperty;1"]
                           .createInstance( Components.interfaces.nsIAbCard );
          card.firstName = firstName;
          card.lastName = lastName;
          card.displayName = firstName + " " + lastName;
          card.primaryEmail = primaryEmail;
          card.setProperty( "Company", vendor );
          card.setProperty( "NickName", "Akman" );
          card.setProperty( "PhotoType", "web" );
          card.setProperty( "PhotoURI", "http://www.gravatar.com/avatar/" +
            "bc59d4f48198e2e6c4145c995fe9d339.png" );
          try {
            card = directory.addCard( card );
          } catch( e ) {
            card = null;
          }
          if ( card ) {
            cards = directory.childCards;
            while ( cards.hasMoreElements() ) {
              card = cards.getNext().QueryInterface(
                Components.interfaces.nsIAbCard );
              if ( card instanceof Components.interfaces.nsIAbCard ) {
                if ( card.firstName == firstName &&
                     card.lastName == lastName ) {
                  found = true;
                  note.addAttachment( [ card.directoryId + "\t" +
                    card.localId, "contact" ] );
                  break;
                }
              }
            }
          }
        }
      }
    }
    wBrowser = document.createElement( "browser" );
    wBrowser.setAttribute( "id", "welcomeBrowser" );
    wBrowser.setAttribute( "type", "content" );
    wBrowser.setAttribute( "collapsed", "true" );
    wBrowser.setAttribute( "src", url );
    mainPanel.appendChild( wBrowser );
    wBrowser.addEventListener(
      "load",
      function onWelcomeBrowserLoad( event ) {
        wBrowser.removeEventListener( "load", onWelcomeBrowserLoad, true );
        var contentEntries = Utils.getEntriesToSaveContent( ".xhtml", "_files" );
        var aFile = contentEntries.fileEntry;
        var aDirectory = contentEntries.directoryEntry;
        var aResultObj = { value: null };
        var anObserver = {
          onLoaderStarted: function( anEvent ) {
            note.setLoading( true );
          },
          onLoaderStopped: function( anEvent ) {
            var aStatus = anEvent.getData().status;
            if ( !aStatus ) {
              try {
                note.loadContentDirectory( aDirectory, true );
              } catch ( e ) {
                Utils.log( e + "\n" + Utils.dumpStack() );
              }
              try {
                if ( aFile.exists() ) {
                  aFile.remove( false );
                }
              } catch ( e ) {
                Utils.log( e + "\n" + Utils.dumpStack() );
              }
              try {
                note.importDocument( aResultObj.value );
              } catch ( e ) {
                Utils.log( e + "\n" + Utils.dumpStack() );
              }
            }
            note.setLoading( false );
            if ( wBrowser ) {
              mainPanel.removeChild( wBrowser );
              wBrowser = null;
            }
          }
        };
        clipper = new ru.akman.znotes.core.Clipper();
        clipper.save(
          wBrowser.contentDocument,
          aResultObj,
          aFile,
          aDirectory,
          /*
          0x00000001 SAVE_SCRIPTS
          0x00000010 SAVE_FRAMES
          0x00000100 SAVE_FRAMES_IN_SEPARATE_DIRECTORY
          0x00001000 PRESERVE_HTML5_TAGS
          0x00010000 SAVE_STYLES
          0x00100000 SAVE_STYLESHEETS_IN_SINGLE_FILE
          0x01000000 SAVE_STYLESHEETS_IN_SEPARATE_FILES
          0x10000000 SAVE_ACTIVE_RULES_ONLY
          */
          0x10010000,
          anObserver
        );
      },
      true
    );
    return note;
  };

  function createNote( aRoot, aName, aType, aTagID ) {
    var aRow = notesList.indexOf( aRoot.createNote( aName, aType, aTagID ) );
    noteTreeBoxObject.ensureRowIsVisible( aRow );
    noteTree.view.selection.select( aRow );
    noteTree.setAttribute( "editable", "true" );
    noteTree.startEditing( aRow,
      noteTree.columns.getNamedColumn( "noteTreeName" ) );
  };

  function renameNote( aNote, aNewName ) {
    try {
      aNote.rename( aNewName );
    } catch ( e ) {
      openErrorDialog(
        getFormattedString( "main.errordialog.note", [ aNewName ] ),
        e.message
      );
      throw e;
    }
    return aNote;
  };

  function deleteNote( aNote ) {
    aNote.remove();
  };
  
  function noteMoveTo( aNote, anIndex ) {
    aNote.moveTo( anIndex );
  };

  function noteMoveInto( aNote, aCategory ) {
    aNote.moveInto( aCategory );
  };

  function getNoteByBookIdAndNoteId( bookId, noteId ) {
    if ( !bookManager ) {
      return null;
    }
    var book = bookManager.getBookById( bookId );
    if ( !book ) {
      return null;
    }
    var ALREADY_OPENED = 2;
    var DRIVER_ERROR = 4;
    var CONNECTION_ERROR = 8;
    var NOT_EXISTS = 16;
    var NOT_PERMITS = 32;
    var result = CONNECTION_ERROR;
    if ( !book.isOpen() ) {
      try {
        result = book.open();
      } catch ( e ) {
        Utils.log( e + "\n" + Utils.dumpStack() );
      }
      if ( result != 0 ) {
        var message = "";
        switch ( result ) {
          case ALREADY_OPENED:
            message = getString( "main.book.openerror.already_opened" );
            break;
          case DRIVER_ERROR:
            message = getString( "main.book.openerror.driver_error" );
            break;
          case CONNECTION_ERROR:
            if ( !message ) {
              message = getString( "main.book.openerror.connection_error" );
            }
            break;
          case NOT_EXISTS:
            message = getString( "main.book.openerror.not_exists" );
            break;
          case NOT_PERMITS:
            message = getString( "main.book.openerror.not_permits" );
            break;
        }
        var params = {
          input: {
            title: getString( "main.book.openerror.title" ),
            message1: getFormattedString( "main.book.openerror.message", [ book.getName() ] ),
            message2: message
          },
          output: null
        };
        window.openDialog(
          "chrome://znotes/content/messagedialog.xul",
          "",
          "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
          params
        ).focus();
        return null;
      }
    }
    return book.getContentTree().getNoteById( noteId );
  };
  
  function showNote( aNote, aBackground ) {
    if ( !aNote ) {
      return;
    }
    var tabMail = Utils.getTabMail();
    var bookId = aNote.getBook().getId();
    var noteId = aNote.getId();
    var windowName = bookId + "&" + noteId;
    if ( tabMail ) {
      var tabInfo = tabMail.tabInfo;
      var tabIndex = -1;
      for ( var i = 0; i < tabInfo.length; i++ ) {
        var tab = tabInfo[i];
        if ( tab.mode.type == "znotesContentTab" &&
             tab.noteId == noteId &&
             tab.bookId == bookId ) {
          tabIndex = i;
          break;
        }
      }
      if ( tabIndex < 0 ) { 
        tabMail.openTab(
          "znotesContentTab",
          {
            contentPage: "chrome://znotes/content/viewer.xul?" + windowName,
            note: aNote,
            background: aBackground,
            style: {
              iconsize: mainToolBar.getAttribute( "iconsize" )
            }
          }
        );
      } else {
        var tabContainer = Utils.getTabContainer();
        tabContainer.selectedIndex = tabIndex;
      }
    } else {
      var windowWatcher =
        Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                  .getService( Components.interfaces.nsIWindowWatcher );
      var win = windowWatcher.getWindowByName( windowName, null );
      if ( win ) {
        windowWatcher.activeWindow = win;
        win.focus();        
      } else {
        win = window.open(
          "chrome://znotes/content/viewer.xul?" + windowName,
          windowName,
          "chrome,toolbar,status,resizable,centerscreen"
        );
        win.arguments = [
          "chrome://znotes/content/viewer.xul?" + windowName,
          aNote,
          aBackground,
          {
            iconsize: mainToolBar.getAttribute( "iconsize" )
          }
        ];
        // session support for windows (not tabs)
        win.addEventListener( "load", function() {
          windowsList.push( win.name );
          if ( tabMonitor && "onTabOpened" in tabMonitor ) {
            tabMonitor.onTabOpened(
              {
                window: win,
                bookId: bookId,
                noteId: noteId,
                mode: {
                  name: "znotesContentTab"
                }
              }
            );
          }
        }, false );
        win.addEventListener( "close", function() {
          var index = windowsList.indexOf( win.name );
          if ( index != -1 ) {
            windowsList.splice( index, 1 );
          }
          var tab = {
            window: win,
            bookId: bookId,
            noteId: noteId,
            mode: {
              name: "znotesContentTab"
            }
          };
          if ( tabMonitor && "onTabClosing" in tabMonitor ) {
            tabMonitor.onTabClosing( tab );
          }
        }, false );
        if ( aBackground ) {
        }
      }
    }
  };
  
  // NOTES EVENTS

  function onNoteBlur( event ) {
    updateEditCommands();
  };

  function onNoteFocus( event ) {
    updateEditCommands();
    return true;
  };
  
  function onNoteSelect( event ) {
    var note, data, row;
    if ( isDragDropActive ) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
    note = ( noteTree.currentIndex >= 0 ?
      notesList[noteTree.currentIndex] : null );
    if ( currentNote && currentNote == note ) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
    data = { canChange: true };
    body.notify(
      new ru.akman.znotes.core.Event( "BeforeCurrentNoteChange", data )
    );
    if ( !data.canChange ) {
      restoreCurrentSelection();
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
    currentNote = note;
    saveNotesTreeSelection();
    currentNoteChanged();
    return true;
  };

  function onNoteDblClick( event ) {
    var aRow = noteTreeBoxObject.getRowAt( event.clientX, event.clientY );
    if ( !currentNote || event.button != "0" || anEditNote != null ||
         aRow < 0 || aRow > noteTree.view.rowCount - 1 ||
         isDragDropActive || noteTree.currentIndex < 0 ) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
    doShowNote();
    return true;
  };
  
  function onNoteContextMenu( event ) {
    var aRow = noteTreeBoxObject.getRowAt( event.clientX, event.clientY );
    if ( noteTree.view.rowCount > 0 && ( aRow < 0 || aRow > noteTree.view.rowCount - 1 ) ) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
    return true;
  };  

  function onNoteTreeTextBoxEvent( event ) {
    var aRow = null;
    var aColumn = null;
    switch ( event.type ) {
      case "keypress" :
        switch ( event.keyCode ) {
          case event.DOM_VK_HOME :
            if ( event.shiftKey ) {
              noteTreeTextBox.setSelectionRange( 0, noteTreeTextBox.selectionEnd );
            } else {
              noteTreeTextBox.setSelectionRange( 0, 0 );
            }
            break;
          case event.DOM_VK_END :
            var textLength = noteTreeTextBox.textLength;
            if ( textLength > 0 ) {
              if ( event.shiftKey ) {
                noteTreeTextBox.setSelectionRange( noteTreeTextBox.selectionStart, textLength );
              } else {
                noteTreeTextBox.setSelectionRange( textLength, textLength );
              }
            }
            break;
        }
        break;
      case "focus" :
        anEditNote = currentNote;
        aRow = noteTree.currentIndex;
        aColumn = noteTree.columns.getNamedColumn( "noteTreeName" );
        oldValue = noteTree.view.getCellText( aRow, aColumn );
        break;
      case "blur" :
        var anItemInfo = getNoteTreeItemAndIndex( anEditNote );
        var aRow = anItemInfo.index;
        aColumn = noteTree.columns.getNamedColumn( "noteTreeName" );
        newValue = noteTree.view.getCellText( aRow, aColumn );
        if ( newValue.replace(/(^\s+)|(\s+$)/g, "").length == 0 ) {
          noteTree.view.setCellText( aRow, aColumn, oldValue );
          anEditNote = null;
          noteTree.setAttribute( "editable", "false" );
          break;
        }
        if ( oldValue !== newValue ) {
          try {
            renameNote( anEditNote, newValue );
          } catch ( e ) {
            noteTree.view.setCellText( aRow, aColumn, oldValue );
          }
        }
        anEditNote = null;
        noteTree.setAttribute( "editable", "false" );
        break;
    }
  };

  // NOTES DRAG & DROP

  function clearNoteTreeSeparator() {
    if ( noteTreeSeparatorRow != null ) {
      if ( noteTreeSeparator.parentNode != null )
        noteTreeSeparator = noteTreeSeparator.parentNode.removeChild( noteTreeSeparator );
    }
    noteTreeSeparatorRow = null;
  };

  function showNoteTreeSeparator( aRow ) {
    noteTreeSeparatorRow = aRow;
    if ( noteTreeSeparatorRow > noteTree.view.rowCount - 1 )
      noteTreeSeparatorRow = -1;
    if ( noteTreeSeparatorRow == -1 ) {
      noteTreeChildren.appendChild( noteTreeSeparator );
    } else {
      var anItem = noteTree.view.getItemAtIndex( noteTreeSeparatorRow );
      anItem.parentNode.insertBefore( noteTreeSeparator, anItem );
    }
  };

  function clearNoteTreeDragMarkers() {
    clearNoteTreeSeparator();
  };

  function onNoteDragDrop( event ) {
    var dropEffect = event.dataTransfer.dropEffect;
    var isNote = event.dataTransfer.types.contains("znotes/x-note");
    var aRow = noteTreeBoxObject.getRowAt( event.clientX, event.clientY );
    var aCurrentNoteIndex, aNewNoteIndex, aTargetInfo;
    if ( aRow > noteTree.view.rowCount - 1 ) {
      aRow = -1;
    }
    var isDisabled = (
      ( currentNote == null ) ||
      ( currentBook && currentBook.getSelectedTree() == "Tags" ) ||
      ( !isNote ) ||
      ( dropEffect != "move" ) ||
      ( aRow == currentNote.getIndex() ) ||
      ( aRow == currentNote.getIndex() + 1 ) ||
      ( aRow == -1 && currentNote.getIndex() == currentCategory.notes.length - 1 )
    );
    switch ( event.type ) {
      case "dragstart" :
        noteTree.removeEventListener( "select", onNoteSelect, false );
        isDragDropActive = true;
        getDragDropInfo();
        event.dataTransfer.setData("znotes/x-note", "NOTE" );
        return;
      case "dragenter" :
      case "drag" :
        event.stopPropagation();
        event.preventDefault();
        return;
      case "dragleave" :
        clearNoteTreeDragMarkers();
        event.stopPropagation();
        event.preventDefault();
        return;
      case "dragover" :
        if ( isDisabled ) {
          clearNoteTreeDragMarkers();
          event.dataTransfer.dropEffect = "none";
          return;
        }
        event.stopPropagation();
        event.preventDefault();
        if ( aRow == noteTreeSeparatorRow )
          return;
        clearNoteTreeDragMarkers();
        showNoteTreeSeparator( aRow );
        return;
      case "drop" :
        if ( isDisabled ) {
          event.dataTransfer.dropEffect = "none";
          return;
        }
        event.stopPropagation();
        event.preventDefault();
        clearNoteTreeDragMarkers();
        if ( isNote && event.dataTransfer.getData("znotes/x-note") == "NOTE" ) {
          infoDragDrop.row = aRow;
          infoDragDrop.dropEffect = dropEffect;
        }
        return;
      case "dragend" :
        clearFolderTreeDragMarkers();
        clearNoteTreeDragMarkers();
        isDragDropActive = false;
        event.stopPropagation();
        event.preventDefault();
        noteTree.addEventListener( "select", onNoteSelect, false );
        if ( dropEffect != "none" ) {
          switch ( infoDragDrop.dropEffect ) {
            case "move" :
              aCurrentNoteIndex = currentNote.getIndex();
              aNewNoteIndex = currentNote.getParent().getNotesCount() - 1;
              aRow = infoDragDrop.row;
              if ( aRow === noteTree.view.rowCount ) {
                aRow = -1;
              }
              if ( aRow !== -1 ) {
                aNewNoteIndex = aRow;
                if ( aNewNoteIndex > aCurrentNoteIndex ) {
                  aNewNoteIndex--;
                }
              }
              try {
                noteMoveTo( currentNote, aNewNoteIndex );
              } catch ( e ) {
                openErrorDialog(
                  getFormattedString( "main.errordialog.note", [ currentNote.getName() ] ),
                  e.message
                );
              }
              break;
            case "copy" :
              aTargetInfo =
                getFolderTreeItemAndCategoryAtRowIndex( infoDragDrop.row );
              try {
                if ( aTargetInfo.category ) {
                  noteMoveInto( currentNote, aTargetInfo.category );
                }
              } catch ( e ) {
                openErrorDialog(
                  getFormattedString( "main.errordialog.note", [ currentNote.getName() ] ),
                  e.message
                );
              }
              break;
          }
        }
        return;
    }
  };

  //
  // TAGS
  //

  function enableTagsList() {
    tagTree.removeAttribute( "disabled" );
  };

  function disableTagsList() {
    tagTree.setAttribute( "disabled", "true" );
  };
  
  function createTagsList() {
    if ( currentBook && currentBook.isOpen() ) {
      var tagList = currentBook.getTagList();
      if ( tagList ) {
        if ( tagsList ) {
          tagsList.splice( 0, tagsList.length );
        } else {
          tagsList = [];
        }
        tagsList = tagList.getTagsAsArray();
      } else {
        tagsList = null;
      }
    } else {
      tagsList = null;
    }
  };

  function showTagsList() {
    tagTree.removeEventListener( "select", onTagSelect, false );
    while ( tagTreeChildren.firstChild ) {
      tagTreeChildren.removeChild( tagTreeChildren.firstChild );
    }
    if ( tagsList ) {
      for ( var i = 0; i < tagsList.length; i++ ) {
        tagTreeChildren.appendChild( createTagTreeItem( tagsList[i] ) );
      }
      enableTagsList();
    } else {
      disableTagsList();
    }
    tagTree.addEventListener( "select", onTagSelect, false );
  };

  function refreshTagsList() {
    createTagsList();
    showTagsList();
    updateTagsCSSRules();
    tagTreeBoxObject.clearStyleAndImageCaches();
  };

  function createTagTreeItem( tag ) {
    var treeItem = null;
    var treeRow = null;
    var treeCell = null;
    var id = tag.getId();
    var name = tag.getName();
    var color = tag.getColor();
    Utils.addCSSRule(
      document,
      "treechildren::-moz-tree-cell(TAG_" + id + ")",
      "background-color: " + color + ";border: 1px solid;"
    );
    Utils.addCSSRule(
      document,
      "treechildren::-moz-tree-image(NOTE_TAG_" + id + ")",
      "list-style-image: url('" + Utils.makeTagImage( color, true, 16 ) + "');"
    );
    Utils.addCSSRule(
      document,
      "treechildren::-moz-tree-cell-text(NOTE_TAG_" + id + ")",
      "padding-left: 3px;"
    );
    treeRow = document.createElement( "treerow" );
    treeCell = document.createElement( "treecell" );
    treeCell.setAttribute( "label", name );
    treeCell.setAttribute( "properties", "tag" );
    treeRow.appendChild( treeCell );
    treeCell = document.createElement( "treecell" );
    treeCell.setAttribute( "label", "" );
    treeCell.setAttribute( "properties", "tag_color TAG_" + id );
    treeRow.appendChild( treeCell );
    treeItem = document.createElement( "treeitem" );
    treeItem.appendChild( treeRow );
    treeItem.setAttribute( "value", id );
    return treeItem;
  };

  function updateTagTreeItem( tag ) {
    if ( tag == null ) {
      return;
    }
    var id = tag.getId();
    var name = tag.getName();
    var color = tag.getColor();
    var index = tag.getIndex();
    var treeItem = tagTree.view.getItemAtIndex( index );
    if ( treeItem ) {
      var treeRow = treeItem.firstChild;
      // Name
      var treeCell = treeRow.childNodes[ tagTree.columns.getNamedColumn( "tagTreeName" ).index ];
      treeCell.setAttribute( "label", name );
      // Color
      Utils.changeCSSRule(
        document,
        "treechildren::-moz-tree-cell(TAG_" + id + ")",
        "background-color: " + color + ";border: 1px solid;"
      );
      Utils.changeCSSRule(
        document,
        "treechildren::-moz-tree-image(NOTE_TAG_" + id + ")",
        "list-style-image: url('" + Utils.makeTagImage( color, true, 16 ) + "');"
      );
      Utils.changeCSSRule(
        document,
        "treechildren::-moz-tree-cell-text(NOTE_TAG_" + id + ")",
        "padding-left: 3px;"
      );
      tagTreeBoxObject.clearStyleAndImageCaches();
    }
  };

  function updateTagsCSSRules() {
    if ( !tagsList ) {
      return;
    }
    for ( var i = 0; i < tagsList.length; i++ ) {
      updateTagCSSRules( tagsList[i] );
    }
  };
  
  function updateTagCSSRules( tag ) {
    var id = tag.getId();
    var colors = Utils.getHighlightColors( tag.getColor(), "#FFFFFF" );
    var rules = [];
    rules.push( {
      selector: "treechildren::-moz-tree-cell-text(NOTE_TAG_ROW_" + id + ")",
      declaration: "color: " + colors.fgColor + ";"
    } );
    rules.push( {
      selector:
        "treechildren::-moz-tree-cell-text(selected,focus,NOTE_TAG_ROW_" +
        id + ")",
      declaration: "color: " + colors.fgColorSelected + " !important;"
    } );
    rules.push( {
      selector: "treechildren::-moz-tree-row(NOTE_TAG_ROW_" + id + ")",
      declaration: "background-color: " + colors.bgColor + " !important;"
    } );
    rules.push( {
      selector: "treechildren::-moz-tree-row(selected,focus,NOTE_TAG_ROW_" +
                id + ")",
      declaration: "background-color: " + colors.bgColorSelected +
                   " !important;"
    } );
    for ( var i = 0; i < rules.length; i++ ) {
      Utils.deleteCSSRule( document, rules[i].selector );
    }
    if ( Utils.IS_HIGHLIGHT_ROW ) {
      for ( var i = 0; i < rules.length; i++ ) {
        Utils.addCSSRule( document, rules[i].selector, rules[i].declaration );
      }
    }
    noteTreeBoxObject.clearStyleAndImageCaches();
  };
  
  function createTag( aBook, aName, aColor ) {
    return aBook.getTagList().createTag( aName, aColor );
  };

  function renameTag( aTag, aName ) {
    aTag.setName( aName );
  };

  function colorTag( aTag, aColor ) {
    aTag.setColor( aColor );
  };

  function deleteTag( aTag ) {
    var anIndex = tagsList.indexOf( aTag );
    if ( anIndex == ( tagsList.length - 1 ) ) {
      anIndex--;
    }
    aTag.getTagList().deleteTag( aTag );
    if ( currentTag && currentTag == aTag ) {
      tagTreeBoxObject.ensureRowIsVisible( anIndex );
      tagTree.view.selection.select( anIndex );
    }
    return aTag;
  };

  function tagMoveTo( aRow ) {
    if ( aRow > tagTree.view.rowCount - 1 ) {
      aRow = -1;
    }
    var aCurrentTagIndex = currentTag.getIndex();
    var aNewTagIndex = tagsList.length - 1;
    if ( aRow != -1 ) {
      aNewTagIndex = aRow;
      if ( aNewTagIndex > aCurrentTagIndex ) {
        aNewTagIndex--;
      }
    }
    currentTag.getBook().getTagList().moveTag( currentTag, aNewTagIndex );
    tagTree.removeEventListener( "select", onTagSelect, false );
    tagTreeBoxObject.ensureRowIsVisible( aNewTagIndex );
    tagTree.view.selection.select( aNewTagIndex );
    tagTree.addEventListener( "select", onTagSelect, false );
  };

  // TAG EVENTS

  function onTagBlur( event ) {
    updateEditCommands();
  };

  function onTagFocus( event ) {
    switch ( currentBook.getSelectedTree() ) {
      case "Categories":
        restoreTagsTreeSelection();
        break;
      case "Tags":
        break;
    }
    updateEditCommands();
    return true;
  };
  
  function onTagSelect( event ) {
    var tag, data, row;
    if ( isDragDropActive ) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
    tag = null;
    if ( tagTree.currentIndex >= 0 ) {
      tag = tagsList[tagTree.currentIndex];
    }
    if ( currentBook &&
         currentBook.getSelectedTree() == "Tags" &&
         currentTag &&
         currentTag == tag ) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
    data = { canChange: true };
    body.notify(
      new ru.akman.znotes.core.Event( "BeforeCurrentNoteChange", data )
    );
    if ( !data.canChange ) {
      restoreCurrentSelection();
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
    currentTag = tag;
    currentCategory = null;
    currentNote = null;
    currentBook.setSelectedTree( "Tags" );
    saveTagsTreeSelection();
    clearFolderTreeSelection();
    currentTagChanged();
    return true;
  };

  function clearTagTreeSelection() {
    tagTree.removeEventListener( "select", onTagSelect, false );
    tagTree.view.selection.select( -1 );
    tagTree.addEventListener( "select", onTagSelect, false );
  };
  
  function onTagDblClick( event ) {
    var aRow = tagTreeBoxObject.getRowAt( event.clientX, event.clientY );
    if ( !currentTag || event.button != "0" || anEditTagIndex != null ||
         aRow < 0 || aRow > tagTree.view.rowCount - 1 ||
         isDragDropActive || tagTree.currentIndex < 0 ) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
    doColorTag();
    return true;
  };

  function onTagContextMenu( event ) {
    var aRow = tagTreeBoxObject.getRowAt( event.clientX, event.clientY );
    if ( tagTree.view.rowCount > 0 && ( aRow < 0 || aRow > tagTree.view.rowCount - 1 ) ) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
    return true;
  };  

  function onTagTreeTextBoxEvent( event ) {
    var aRow = null;
    var aColumn = null;
    switch ( event.type ) {
      case "keypress" :
        switch ( event.keyCode ) {
          case event.DOM_VK_HOME :
            if ( event.shiftKey ) {
              tagTreeTextBox.setSelectionRange( 0, tagTreeTextBox.selectionEnd );
            } else {
              tagTreeTextBox.setSelectionRange( 0, 0 );
            }
            break;
          case event.DOM_VK_END :
            var textLength = tagTreeTextBox.textLength;
            if ( textLength > 0 ) {
              if ( event.shiftKey ) {
                tagTreeTextBox.setSelectionRange( tagTreeTextBox.selectionStart, textLength );
              } else {
                tagTreeTextBox.setSelectionRange( textLength, textLength );
              }
            }
            break;
        }
        break;
      case "focus" :
        anEditTagIndex = tagTree.currentIndex;
        aRow = anEditTagIndex;
        aColumn = tagTree.columns.getNamedColumn( "tagTreeName" );
        oldValue = tagTree.view.getCellText( aRow, aColumn );
        break;
      case "blur" :
        aRow = anEditTagIndex;
        aColumn = tagTree.columns.getNamedColumn( "tagTreeName" );
        newValue = tagTree.view.getCellText( aRow, aColumn );
        if ( newValue.replace(/(^\s+)|(\s+$)/g, "").length == 0 ) {
          tagTree.view.setCellText( aRow, aColumn, oldValue );
          anEditTagIndex = null;
          tagTree.setAttribute( "editable", "false" );
          break;
        }
        if ( oldValue != newValue ) {
          try {
            var treeItem = tagTree.view.getItemAtIndex( anEditTagIndex );
            var tag = currentBook.getTagList().getTagById( treeItem.getAttribute( "value" ) );
            renameTag( tag, newValue );
          } catch ( e ) {
            Utils.log( e + "\n" + Utils.dumpStack() );
            tagTree.view.setCellText( aRow, aColumn, oldValue );
          }
        }
        anEditTagIndex = null;
        tagTree.setAttribute( "editable", "false" );
        break;
    }
  };

  // TAG DRAG & DROP

  function clearTagTreeSeparator() {
    if ( tagTreeSeparatorRow != null ) {
      if ( tagTreeSeparator.parentNode != null )
        tagTreeSeparator = tagTreeSeparator.parentNode.removeChild( tagTreeSeparator );
    }
    tagTreeSeparatorRow = null;
  };

  function showTagTreeSeparator( aRow ) {
    tagTreeSeparatorRow = aRow;
    if ( tagTreeSeparatorRow > tagTree.view.rowCount - 1 )
      tagTreeSeparatorRow = -1;
    if ( tagTreeSeparatorRow == -1 ) {
      tagTreeChildren.appendChild( tagTreeSeparator );
    } else {
      var anItem = tagTree.view.getItemAtIndex( tagTreeSeparatorRow );
      anItem.parentNode.insertBefore( tagTreeSeparator, anItem );
    }
  };

  function clearTagTreeDragMarkers() {
    clearTagTreeSeparator();
  };

  function onTagDragDrop( event ) {
    var dropEffect = event.dataTransfer.dropEffect;
    var isTag = event.dataTransfer.types.contains("znotes/x-tag");
    var aRow = tagTreeBoxObject.getRowAt( event.clientX, event.clientY );
    if ( aRow > tagTree.view.rowCount - 1 ) {
      aRow = -1;
    }
    var currentIndex = ( currentTag ? currentTag.getIndex() : -1 );
    var isDisabled = (
      ( !isTag ) ||
      ( dropEffect != "move" ) ||
      ( aRow == 0 ) ||
      ( aRow == currentIndex ) ||
      ( aRow == currentIndex + 1 ) ||
      ( aRow == -1 && currentIndex == currentBook.getTagList().getCount() - 1 )
    );
    switch ( event.type ) {
      case "dragstart" :
        if ( aRow == 0 ) {
          return;
        }
        tagTree.removeEventListener( "select", onTagSelect, false );
        isDragDropActive = true;
        event.dataTransfer.setData("znotes/x-tag", "TAG" );
        return;
      case "dragenter" :
      case "drag" :
        event.stopPropagation();
        event.preventDefault();
        return;
      case "dragleave" :
        clearTagTreeDragMarkers();
        event.stopPropagation();
        event.preventDefault();
        return;
      case "dragover" :
        if ( isDisabled ) {
          clearTagTreeDragMarkers();
          event.dataTransfer.dropEffect = "none";
          return;
        }
        event.stopPropagation();
        event.preventDefault();
        if ( aRow == tagTreeSeparatorRow )
          return;
        clearTagTreeDragMarkers();
        showTagTreeSeparator( aRow );
        return;
      case "drop" :
        if ( isDisabled ) {
          event.dataTransfer.dropEffect = "none";
          return;
        }
        event.stopPropagation();
        event.preventDefault();
        clearTagTreeDragMarkers();
        if ( isTag && event.dataTransfer.getData("znotes/x-tag") == "TAG" ) {
          infoDragDrop.row = aRow;
          infoDragDrop.dropEffect = dropEffect;
        }
        return;
      case "dragend" :
        clearTagTreeDragMarkers();
        isDragDropActive = false;
        event.stopPropagation();
        event.preventDefault();
        tagTree.addEventListener( "select", onTagSelect, false );
        if ( dropEffect == "none" ) {
          return;
        }
        switch ( infoDragDrop.dropEffect ) {
          case "move" :
            try {
              tagMoveTo( infoDragDrop.row );
            } catch ( e ) {
              Utils.log( e + "\n" + Utils.dumpStack() );
              openErrorDialog(
                getFormattedString( "main.errordialog.tag", [ currentTag.getName() ] ),
                e.message
              );
            }
            break;
        }
        return;
    }
  };

  //
  // BOOK
  //

  function addStateListeners() {
    var book, tagList, contentTree, contentTreeBin;
    for ( var i = 0; i < booksList.length; i++ ) {
      book = booksList[i];
      if ( book.isOpen() ) {
        tagList = book.getTagList();
        tagList.getNoTag().setName( getString( "main.notag.name" ) );
        tagList.addStateListener( tagListStateListener );
        contentTree = book.getContentTree();
        contentTreeBin = contentTree.getBin();
        if ( contentTreeBin ) {
          contentTreeBin.rename( getString( "main.bin.name" ) );
        }
        contentTree.addStateListener( contentTreeStateListener );
      }
    }
    bookManager.addStateListener( booksStateListener );
  };
  
  function removeStateListeners() {
    if ( !booksList ) {
      return;
    }
    var book;
    for ( var i = 0; i < booksList.length; i++ ) {
      book = booksList[i];
      if ( book.isOpen() ) {
        book.getTagList().removeStateListener( tagListStateListener );
        book.getContentTree().removeStateListener( contentTreeStateListener );
      }
    }
    bookManager.removeStateListener( booksStateListener );
  };
  
  function doneBooks() {
    removeStateListeners();
    if ( booksList ) {
      if ( Utils.IS_CLEAR_BIN_ON_EXIT ) {
        for each ( var book in booksList ) {
          if ( book.isOpen() ) {
            book.getContentTree().clearBin();
          }
        }
      }
      booksList.splice( 0, booksList.length );
    }
    booksList = null;
  };
  
  function updateBookView() {
    refreshCategoriesList();
    refreshTagsList();
    if ( !currentBook || !currentBook.isOpen() ) {
      updateNoteView();
      return;
    }
    switch ( currentBook.getSelectedTree() ) {
      case "Categories":
        restoreCategoriesTreeSelection();
        break;
      case "Tags":
        restoreTagsTreeSelection();
        break;
    }
  };
  
  function createBooksList() {
    var defaultBook;
    removeStateListeners();
    bookManager.load();
    if ( !bookManager.hasBooks() &&
         ( Utils.IS_FIRST_RUN || Utils.IS_DEBUG_ENABLED ) ) {
      try {
        defaultBook = bookManager.createBook();
        if ( defaultBook ) {
          defaultBook.createData();
          if ( defaultBook.open() == 0 ) {
            welcomeNote = createWelcomeNote( defaultBook );
            if ( welcomeNote && !Utils.IS_STANDALONE ) {
              welcomeNote.getData().isAddonsVisible = true;
              welcomeNote.setData();
            }
          }
        }
      } catch ( e ) {
        Utils.log( e + "\n" + Utils.dumpStack() );
      }
    }
    booksList = bookManager.getBooksAsArray();
    addStateListeners();
  };

  function showBooksList() {
    bookTree.removeEventListener( "select", onBookSelect, false );
    while ( bookTreeChildren.firstChild ) {
      bookTreeChildren.removeChild( bookTreeChildren.firstChild );
    }
    for ( var i = 0; i < booksList.length; i++ ) {
      bookTreeChildren.appendChild( createBookTreeItem( booksList[i] ) );
    }
    bookTree.addEventListener( "select", onBookSelect, false );
  };

  function refreshBooksList() {
    createBooksList();
    showBooksList();
    bookTreeBoxObject.clearStyleAndImageCaches();
  };

  function createBookTreeItem( book ) {
    var treeItem = null;
    var treeRow = null;
    var treeCell = null;
    var id = book.getId();
    var name = book.getName();
    treeRow = document.createElement( "treerow" );
    // Name
    treeCell = document.createElement( "treecell" );
    treeCell.setAttribute( "label", name );
    // State
    if ( book.isOpen() ) {
      treeCell.setAttribute( "properties", "book opened" );
    } else {
      treeCell.setAttribute( "properties", "book" );
    }
    treeRow.appendChild( treeCell );
    treeItem = document.createElement( "treeitem" );
    treeItem.appendChild( treeRow );
    treeItem.setAttribute( "value", id );
    return treeItem;
  };

  function updateBookTreeItem( book ) {
    var index = booksList.indexOf( book );
    if ( index == -1 ) {
      return;
    }
    var treeItem = bookTree.view.getItemAtIndex( index );
    if ( treeItem ) {
      var treeRow = treeItem.firstChild;
      // Name
      var treeCell = treeRow.childNodes[ bookTree.columns.getNamedColumn( "bookTreeName" ).index ];
      treeCell.setAttribute( "label", book.getName() );
      // State
      if ( book.isOpen() ) {
        treeCell.setAttribute( "properties", "book opened" );
      } else {
        treeCell.setAttribute( "properties", "book" );
      }
    }
  };

  function createBook( aParams ) {
    var aRow = booksList.indexOf( bookManager.createBook(
      aParams.name,
      aParams.description,
      aParams.driver,
      aParams.connection
    ) );
    bookTreeBoxObject.ensureRowIsVisible( aRow );
    bookTree.view.selection.select( aRow );
    return true;
  };

  function renameBook( aBook, aName ) {
    aBook.setName( aName );
  };

  function openBook( aBook ) {
    var ALREADY_OPENED = 2;
    var DRIVER_ERROR = 4;
    var CONNECTION_ERROR = 8;
    var NOT_EXISTS = 16;
    var NOT_PERMITS = 32;
    var result = CONNECTION_ERROR;
    var message = null;
    var params = null;
    window.setCursor( "wait" );
    try {
      result = aBook.open();
    } catch ( e ) {
      message = e.message;
    }
    window.setCursor( "auto" );
    if ( result == 0 ) {
      return result;
    }
    switch ( result ) {
     case ALREADY_OPENED:
       message = getString( "main.book.openerror.already_opened" );
       break;
     case DRIVER_ERROR:
       message = getString( "main.book.openerror.driver_error" );
       break;
     case NOT_EXISTS:
       message = getString( "main.book.openerror.not_exists" );
       break;
     case NOT_PERMITS:
       message = getString( "main.book.openerror.not_permits" );
       break;
     case CONNECTION_ERROR:
       if ( !message ) {
         message = getString( "main.book.openerror.connection_error" );
       }
       break;
    }
    params = {
      input: {
        title: getString( "main.book.openerror.title" ),
        message1: getFormattedString(
          "main.book.openerror.message",
          [ aBook.getName() ]
        ),
        message2: message,
        kind: 1
      },
      output: null
    };
    if ( result != NOT_EXISTS ) {
      window.openDialog(
        "chrome://znotes/content/messagedialog.xul",
        "",
        "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
        params
      ).focus();
      return result;
    }
    // BOOK DOES NOT EXISTS
    params.input.message1 = getFormattedString(
      "main.book.confirmCreate.message1",
      [ aBook.getName() ]
    );
    params.input.message2 = getString( "main.book.confirmCreate.message2" );
    params.input.kind = 1;
    window.openDialog(
      "chrome://znotes/content/confirmdialog.xul",
      "",
      "chrome,dialog=yes,modal=yes,centerscreen,resizable=no",
      params
    ).focus();
    result = 0;
    if ( params.output && params.output.result ) {
      try {
        if ( aBook.createData() ) {
          openBook( aBook );
        }
      } catch ( e ) {
        result = CONNECTION_ERROR;
        params.input.title = getString( "main.book.createerror.title" );
        params.input.message1 = getFormattedString(
          "main.book.createerror.message",
          [ aBook.getName() ]
        );
        params.input.message2 = e.message;
        params.input.kind = 1;
        window.openDialog(
          "chrome://znotes/content/messagedialog.xul",
          "",
          "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
          params
        ).focus();
      }
    }
    return result;
  };

  function closeBook( aBook ) {
    aBook.close();
  };

  function deleteBook( aBook ) {
    aBook.remove();
  };

  function deleteBookWithAllData( aBook ) {
    aBook.removeWithAllData();
  };

  function editBook( aBook ) {
    var params = {
      input: {
        name: aBook.getName(),
        description: aBook.getDescription(),
        driver: aBook.getDriver(),
        connection: aBook.getConnection()
      },
      output: null
    };
    window.openDialog(
      "chrome://znotes/content/book.xul",
      "",
      "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
      params
    ).focus();
    if ( !params.output ) {
      return;
    }
    if ( params.output.name !== params.input.name ) {
      aBook.setName( params.output.name );
    }
    if ( params.output.description !== params.input.description ) {
      aBook.setDescription( params.output.description );
    }
    if ( params.output.driver !== params.input.driver ) {
      aBook.setDriver( params.output.driver );
    }
    if ( !Utils.isObjectsEqual( params.output.connection, params.input.connection ) ) {
      aBook.setConnection( params.output.connection );
    }
  };

  function bookMoveTo( aBook, anIndex ) {
    bookManager.moveBookTo( aBook, anIndex );
  };

  // BOOK EVENTS

  function onBookBlur( event ) {
    updateEditCommands();
  };

  function onBookFocus( event ) {
    updateEditCommands();
    return true;
  };
  
  function onBookSelect( event ) {
    var book, data;
    if ( isDragDropActive ) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
    book = bookTree.currentIndex >= 0 ?
      booksList[bookTree.currentIndex] : null;
    if ( currentBook && currentBook == book ) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
    data = { canChange: true };
    body.notify(
      new ru.akman.znotes.core.Event( "BeforeCurrentNoteChange", data )
    );
    if ( !data.canChange ) {
      restoreCurrentSelection();
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
    currentBook = book;
    currentCategory = null;
    currentTag = null;
    currentNote = null;
    saveBooksTreeSelection();
    restoreCurrentBookLayout();
    currentBookChanged();
    return true;
  };

  function onBookTreeTextBoxEvent( event ) {
    var aColumn = null;
    switch ( event.type ) {
      case "keypress" :
        switch ( event.keyCode ) {
          case event.DOM_VK_HOME :
            if ( event.shiftKey ) {
              bookTreeTextBox.setSelectionRange( 0, bookTreeTextBox.selectionEnd );
            } else {
              bookTreeTextBox.setSelectionRange( 0, 0 );
            }
            break;
          case event.DOM_VK_END :
            var textLength = bookTreeTextBox.textLength;
            if ( textLength > 0 ) {
              if ( event.shiftKey ) {
                bookTreeTextBox.setSelectionRange( bookTreeTextBox.selectionStart, textLength );
              } else {
                bookTreeTextBox.setSelectionRange( textLength, textLength );
              }
            }
            break;
        }
        break;
      case "focus" :
        anEditBookIndex = bookTree.currentIndex;
        aColumn = bookTree.columns.getNamedColumn( "bookTreeName" );
        oldValue = bookTree.view.getCellText( anEditBookIndex, aColumn );
        break;
      case "blur" :
        aColumn = bookTree.columns.getNamedColumn( "bookTreeName" );
        newValue = bookTree.view.getCellText( anEditBookIndex, aColumn );
        if ( newValue.replace(/(^\s+)|(\s+$)/g, "").length == 0 ) {
          bookTree.view.setCellText( anEditBookIndex, aColumn, oldValue );
          anEditBookIndex = null;
          bookTree.setAttribute( "editable", "false" );
          break;
        }
        if ( oldValue != newValue ) {
          try {
            var treeItem = bookTree.view.getItemAtIndex( anEditBookIndex );
            var book = bookManager.getBookById( treeItem.getAttribute( "value" ) );
            renameBook( book, newValue );
          } catch ( e ) {
            Utils.log( e + "\n" + Utils.dumpStack() );
            bookTree.view.setCellText( anEditBookIndex, aColumn, oldValue );
          }
        }
        anEditBookIndex = null;
        bookTree.setAttribute( "editable", "false" );
        break;
    }
    return true;
  };

  function onBookDblClick( event ) {
    var aRow = bookTreeBoxObject.getRowAt( event.clientX, event.clientY );
    if ( event.button != "0" || !currentBook || isDragDropActive ||
         aRow < 0 || aRow > bookTree.view.rowCount - 1 ||
         anEditBookIndex != null || bookTree.currentIndex < 0 ) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    doOpenBook();
    return true;
  };
  
  function onBookContextMenu( event ) {
    var aRow = bookTreeBoxObject.getRowAt( event.clientX, event.clientY );
    if ( bookTree.view.rowCount > 0 && ( aRow < 0 || aRow > bookTree.view.rowCount - 1 ) ) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
    return true;
  };  
  
  // BOOK DRAG & DROP

  function clearBookTreeSeparator() {
    if ( bookTreeSeparatorRow != null ) {
      if ( bookTreeSeparator.parentNode != null )
        bookTreeSeparator = bookTreeSeparator.parentNode.removeChild( bookTreeSeparator );
    }
    bookTreeSeparatorRow = null;
  };

  function showBookTreeSeparator( aRow ) {
    bookTreeSeparatorRow = aRow;
    if ( bookTreeSeparatorRow > bookTree.view.rowCount - 1 )
      bookTreeSeparatorRow = -1;
    if ( bookTreeSeparatorRow == -1 ) {
      bookTreeChildren.appendChild( bookTreeSeparator );
    } else {
      var anItem = bookTree.view.getItemAtIndex( bookTreeSeparatorRow );
      anItem.parentNode.insertBefore( bookTreeSeparator, anItem );
    }
  };

  function clearBookTreeDragMarkers() {
    clearBookTreeSeparator();
  };

  function onBookDragDrop( event ) {
    var dropEffect = event.dataTransfer.dropEffect;
    var isBook = event.dataTransfer.types.contains("znotes/x-book");
    var aRow = bookTreeBoxObject.getRowAt( event.clientX, event.clientY );
    if ( aRow > bookTree.view.rowCount - 1 ) {
      aRow = -1;
    }
    var currentIndex = ( currentBook ? currentBook.getIndex() : -1 );
    var isDisabled = (
      ( !isBook ) ||
      ( dropEffect != "move" ) ||
      ( aRow == currentIndex ) ||
      ( aRow == currentIndex + 1 ) ||
      ( aRow == -1 && currentIndex == bookManager.getCount() - 1 )
    );
    switch ( event.type ) {
      case "dragstart":
        bookTree.removeEventListener( "select", onBookSelect, false );
        isDragDropActive = true;
        event.dataTransfer.setData("znotes/x-book", "BOOK" );
        return;
      case "dragenter":
      case "drag":
        event.stopPropagation();
        event.preventDefault();
        return;
      case "dragleave":
        clearBookTreeDragMarkers();
        event.stopPropagation();
        event.preventDefault();
        return;
      case "dragover":
        if ( isDisabled ) {
          clearBookTreeDragMarkers();
          event.dataTransfer.dropEffect = "none";
          return;
        }
        event.stopPropagation();
        event.preventDefault();
        if ( aRow == bookTreeSeparatorRow )
          return;
        clearBookTreeDragMarkers();
        showBookTreeSeparator( aRow );
        return;
      case "drop":
        if ( isDisabled ) {
          event.dataTransfer.dropEffect = "none";
          return;
        }
        event.stopPropagation();
        event.preventDefault();
        clearBookTreeDragMarkers();
        if ( isBook && event.dataTransfer.getData("znotes/x-book") == "BOOK" ) {
          infoDragDrop.row = aRow;
          infoDragDrop.dropEffect = dropEffect;
        }
        return;
      case "dragend":
        clearBookTreeDragMarkers();
        isDragDropActive = false;
        bookTree.addEventListener( "select", onBookSelect, false );
        if ( dropEffect == "none" ) {
          return;
        }
        switch ( infoDragDrop.dropEffect ) {
          case "move":
            if ( infoDragDrop.row > bookTree.view.rowCount - 1 ) {
              infoDragDrop.row = -1;
            }
            if ( infoDragDrop.row === -1 ) {
              infoDragDrop.row = bookManager.getCount() - 1;
            } else {
              if ( infoDragDrop.row > currentBook.getIndex() ) {
                infoDragDrop.row--;
              }
            }
            try {
              bookMoveTo( currentBook, infoDragDrop.row );
            } catch ( e ) {
              openErrorDialog(
                getFormattedString( "main.errordialog.book",
                  [ currentBook.getName() ] ),
                e.message
              );
            }
            break;
        }
        return;
    }
  };

  //
  // CONTENTTREE STATE LISTENER
  //

  function onCategoryAppended( e ) {
    var aTreeChildren, aBinItem, anIndex, aSubcategoriesList;
    var aParent = e.data.parentCategory;
    var aCategory = e.data.appendedCategory;
    var aBook = aParent.getBook();
    if ( !currentBook || currentBook !== aBook ) {
      return;
    }
    switch ( currentBook.getSelectedTree() ) {
      case "Tags":
        break;
      case "Categories":
        if ( currentCategory === aParent ) {
          updateCategoryCommands();
        }
        break;
    }
    aTreeChildren = getFolderTreeItem( aParent ).lastChild;
    aBinItem = aParent.isRoot() ? aTreeChildren.lastChild : null;
    aSubcategoriesList = aCategory.getCategoryWithSubcategoriesAsArray();
    anIndex = categoriesList.indexOf( aParent ) +
              ( aParent.depth() - aSubcategoriesList.length ) + 1;
    if ( aParent.isRoot() ) {
      anIndex -= aParent.getBin().depth() + 1;
    }
    for ( var i = 0; i < aSubcategoriesList.length; i++ ) {
      categoriesList.splice( anIndex++, 0, aSubcategoriesList[i] );
    }
    folderTree.removeEventListener( "select", onFolderSelect, false );
    aTreeChildren.insertBefore( createFolderTreeItem( aCategory ), aBinItem );
    folderTree.addEventListener( "select", onFolderSelect, false );
    updateFolderTreeItem( aParent );
  };

  function onCategoryRemoved( e ) {
    var aTargetCategory, anIndex, aRow, aTreeItem;
    var aParent = e.data.parentCategory;
    var aCategory = e.data.removedCategory;
    var aBook = aParent.getBook();
    if ( !currentBook || currentBook !== aBook ) {
      return;
    }
    switch ( currentBook.getSelectedTree() ) {
      case "Tags":
        break;
      case "Categories":
        if ( currentCategory === aParent ) {
          updateCategoryCommands();
        }
        if ( currentCategory === aCategory ||
             currentCategory.isDescendantOf( aCategory ) ) {
          anIndex = aCategory.getIndex();
          if ( aParent.hasCategories() ) {
            if ( anIndex > aParent.getCategoriesCount() - 1 ) {
              anIndex--;
            }
            aTargetCategory = aParent.getCategoryByIndex( anIndex );
          } else {
            aTargetCategory = aParent;
          }
        }
        break;
    }
    aTreeItem = getFolderTreeItem( aCategory );
    anIndex = categoriesList.indexOf( aCategory );
    categoriesList.splice( anIndex, aCategory.depth() + 1 );
    folderTree.removeEventListener( "select", onFolderSelect, false );
    aTreeItem.parentNode.removeChild( aTreeItem );
    folderTree.addEventListener( "select", onFolderSelect, false );
    if ( !aParent.hasCategories() ) {
      aParent.setOpenState( false );
    }
    updateFolderTreeItem( aParent );
    if ( aTargetCategory ) {
      aRow = getFolderTreeRow( aTargetCategory );
      folderTreeBoxObject.ensureRowIsVisible( aRow );
      folderTree.view.selection.select( aRow );
    }
  };

  function onCategoryMovedTo( e ) {
    var aTargetCategory, aMovedToList, aSiblings, anIndex;
    var aTreeItem, aTreeChildren, aNextItem;
    var aParent = e.data.parentCategory;
    var aCategory = e.data.movedToCategory;
    var anOldIndex = e.data.oldValue;
    var aNewIndex = e.data.newValue;
    var aBook = aParent.getBook();
    if ( !currentBook || currentBook !== aBook ) {
      return;
    }
    switch ( currentBook.getSelectedTree() ) {
      case "Tags":
        break;
      case "Categories":
        if ( currentCategory === aCategory ||
             currentCategory.isDescendantOf( aCategory ) ) {
          aTargetCategory = currentCategory;
        }
        break;
    }
    anIndex = categoriesList.indexOf( aCategory );
    aTreeItem = getFolderTreeItem( aCategory );
    aTreeChildren = aTreeItem.parentNode;
    aMovedToList = categoriesList.splice( anIndex, aCategory.depth() + 1 );
    anIndex = categoriesList.indexOf( aParent ) + 1;
    aSiblings = aParent.getCategories();
    folderTree.removeEventListener( "select", onFolderSelect, false );
    aTreeChildren.removeChild( aTreeItem );
    aNextItem = aTreeChildren.firstChild;
    for ( var i = 0; i < aNewIndex; i++ ) {
      anIndex += aSiblings[i].depth() + 1;
      aNextItem = aNextItem.nextSibling;
    }
    aTreeChildren.insertBefore( aTreeItem, aNextItem );
    folderTree.addEventListener( "select", onFolderSelect, false );
    for ( var i = 0; i < aMovedToList.length; i++ ) {
      categoriesList.splice( anIndex++, 0, aMovedToList[i] );
    }
    if ( aTargetCategory ) {
      aRow = getFolderTreeRow( aTargetCategory );
      folderTreeBoxObject.ensureRowIsVisible( aRow );
      folderTree.removeEventListener( "select", onFolderSelect, false );
      folderTree.view.selection.select( aRow );
      folderTree.addEventListener( "select", onFolderSelect, false );
      saveCategoriesTreeSelection();
    }
  };

  function onCategoryMovedInto( e ) {
    var aMovedIntoList, aTargetCategory, aRow, anIndex, aCount;
    var aTreeChildren, aTreeItem, aBinItem;
    var anOldParent = e.data.oldParentCategory;
    var anOldIndex = e.data.oldIndex;
    var aNewParent = e.data.newParentCategory;
    var aNewIndex = e.data.newIndex;
    var aCategory = e.data.movedIntoCategory;
    var aBook = anOldParent.getBook();
    if ( !currentBook || currentBook !== aBook ) {
      return;
    }
    switch ( currentBook.getSelectedTree() ) {
      case "Tags":
        break;
      case "Categories":
        if ( currentCategory === anOldParent ||
             currentCategory === aNewParent ) {
          updateCategoryCommands();
        }
        if ( currentCategory === aCategory ||
             currentCategory.isDescendantOf( aCategory ) ) {
          if ( !( anOldParent.isInBin() || anOldParent.isBin() ) &&
               aNewParent.isBin() ) {
            aCount = anOldParent.getCategoriesCount();
            if ( !anOldParent.isRoot() && aCount === 0 ||
                 anOldParent.isRoot() && aCount === 1 ) {
              aTargetCategory = anOldParent;
            } else {
              if ( anOldIndex > aCount - ( anOldParent.isRoot() ? 2 : 1 ) ) {
                anOldIndex--;
              }
              aTargetCategory = anOldParent.getCategoryByIndex( anOldIndex );
            }
          } else {
            aTargetCategory = currentCategory;
          }
        }
        break;
    }
    aTreeItem = getFolderTreeItem( aCategory );
    aTreeChildren = getFolderTreeItem( aNewParent ).lastChild;
    aBinItem = aNewParent.isRoot() ? aTreeChildren.lastChild : null;
    anIndex = categoriesList.indexOf( aCategory );
    aMovedIntoList = categoriesList.splice( anIndex, aCategory.depth() + 1 );
    anIndex = categoriesList.indexOf( aNewParent ) + 1;
    anIndex += aNewParent.depth() - aMovedIntoList.length;
    if ( aNewParent.isRoot() ) {
      anIndex -= aNewParent.getBin().depth() + 1;
    }
    for ( var i = 0; i < aMovedIntoList.length; i++ ) {
      categoriesList.splice( anIndex++, 0, aMovedIntoList[i] );
    }
    folderTree.removeEventListener( "select", onFolderSelect, false );
    aTreeItem.parentNode.removeChild( aTreeItem );
    aTreeChildren.insertBefore( aTreeItem, aBinItem );
    folderTree.addEventListener( "select", onFolderSelect, false );
    if ( !anOldParent.hasCategories() ) {
      anOldParent.setOpenState( false );
    }
    updateFolderTreeItem( anOldParent );
    updateFolderTreeItem( aNewParent );
    updateFolderTreeItem( aCategory );
    if ( aTargetCategory ) {
      if ( aTargetCategory === currentCategory ) {
        while ( !aNewParent.isRoot() ) {
          aNewParent.setOpenState( true );
          updateFolderTreeItem( aNewParent );
          aNewParent = aNewParent.getParent();
        }
      }
      aRow = getFolderTreeRow( aTargetCategory );
      folderTreeBoxObject.ensureRowIsVisible( aRow );
      if ( aTargetCategory === currentCategory ) {
        folderTree.removeEventListener( "select", onFolderSelect, false );
        folderTree.view.selection.select( aRow );
        folderTree.addEventListener( "select", onFolderSelect, false );
        saveCategoriesTreeSelection();
      } else {
        folderTree.view.selection.select( aRow );
      }
    }
  };
  
  function onCategoryChanged( e ) {
    var aParent = e.data.parentCategory;
    var aCategory = e.data.changedCategory;
    var aBook = aParent.getBook();
    if ( !currentBook || currentBook !== aBook ) {
      return;
    }
    updateFolderTreeItem( aCategory );
    for ( var i = 0; i < notesList.length; i++ ) {
      updateNoteTreeItem( notesList[i] );
    }
  };
  
  function onNoteAppended( e ) {
    var aParent = e.data.parentCategory;
    var aNote = e.data.appendedNote;
    var aBook = aParent.getBook();
    if ( !currentBook || currentBook != aBook ) {
      return;
    }
    var aRow = null;
    var aTreeItem = null;
    updateFolderTreeItem( aParent );
    switch ( currentBook.getSelectedTree() ) {
      case "Tags":
        var aCurrentTagID = currentTag.getId();
        var anAppendedNoteIDs = aNote.getTags();
        if ( currentTag.isNoTag() ) {
          if ( anAppendedNoteIDs.length > 0 ) {
            break;
          }
        } else {
          if ( anAppendedNoteIDs.indexOf( aCurrentTagID ) < 0 ) {
            break;
          }
        }
        if ( notesList.indexOf( aNote ) < 0 ) {
          notesList.push( aNote );
          aRow = notesList.length - 1;
          aTreeItem = createNoteTreeItem( aNote );
          noteTree.removeEventListener( "select", onNoteSelect, false );
          noteTreeChildren.appendChild( aTreeItem );
          noteTree.addEventListener( "select", onNoteSelect, false );
          if ( notesList.length === 1 ) {
            noteTreeBoxObject.ensureRowIsVisible( aRow );
            noteTree.view.selection.select( aRow );
          }
        }
        break;
      case "Categories":
        if ( currentCategory === aParent ) {
          updateCategoryCommands();
          if ( notesList.indexOf( aNote ) < 0 ) {
            aRow = aNote.getIndex();
            notesList.splice( aRow, 0, aNote );
            aTreeItem = createNoteTreeItem( aNote );
            noteTree.removeEventListener( "select", onNoteSelect, false );
            if ( aRow === notesList.length - 1 ) {
              noteTreeChildren.appendChild( aTreeItem );
            } else {
              noteTreeChildren.insertBefore( aTreeItem,
                noteTree.view.getItemAtIndex( aRow ) );
            }
            noteTree.addEventListener( "select", onNoteSelect, false );
            if ( notesList.length === 1 ) {
              noteTreeBoxObject.ensureRowIsVisible( aRow );
              noteTree.view.selection.select( aRow );
            }
          }
        }
        break;
    }
  };

  function onNoteRemoved( e ) {
    var aParent = e.data.parentCategory;
    var aNote = e.data.removedNote;
    var aBook = aParent.getBook();
    if ( !currentBook || currentBook != aBook ) {
      return;
    }
    var aTreeItem = null;
    var anItemInfo = null;
    var aTreeIndex = null;
    updateFolderTreeItem( aParent );
    switch ( currentBook.getSelectedTree() ) {
      case "Tags":
        break;
      case "Categories":
        if ( currentCategory === aParent ) {
          updateCategoryCommands();
        }
        break;
    }
    anItemInfo = getNoteTreeItemAndIndex( aNote );
    if ( anItemInfo ) {
      aTreeItem = anItemInfo.item;
      if ( aTreeItem ) {
        aTreeIndex = anItemInfo.index;
        notesList.splice( aTreeIndex, 1 );
        if ( aTreeIndex === ( noteTree.view.rowCount - 1 ) ) {
          aTreeIndex--;
        }
        noteTree.removeEventListener( "select", onNoteSelect, false );
        noteTreeChildren.removeChild( aTreeItem );
        noteTree.addEventListener( "select", onNoteSelect, false );
        if ( currentNote === aNote ) {
          if ( aTreeIndex !== -1 ) {
            noteTreeBoxObject.ensureRowIsVisible( aTreeIndex );
          }
          noteTree.view.selection.select( aTreeIndex );
        }
      }
    }
  };

  function onNoteMovedTo( e ) {
    var aParent = e.data.parentCategory;
    var aNote = e.data.movedToNote;
    var aBook = aParent.getBook();
    var anOldIndex = e.data.oldValue;
    var aNewIndex = e.data.newValue;
    var anItemInfo, aTreeItem;
    if ( !currentBook || currentBook !== aBook ) {
      return;
    }
    switch ( currentBook.getSelectedTree() ) {
      case "Tags":
        break;
      case "Categories":
        if ( currentCategory === aParent ) {
          anItemInfo = getNoteTreeItemAndIndex( aNote );
          if ( anItemInfo ) {
            aTreeItem = anItemInfo.item;
            if ( aTreeItem ) {
              notesList.splice( anOldIndex, 1 );
              notesList.splice( aNewIndex, 0, aNote );
              noteTree.removeEventListener( "select", onNoteSelect, false );
              noteTreeChildren.removeChild( aTreeItem );
              if ( aNewIndex === notesList.length - 1 ) {
                noteTreeChildren.appendChild( aTreeItem );
              } else {
                noteTreeChildren.insertBefore(
                  aTreeItem, noteTree.view.getItemAtIndex( aNewIndex ) );
              }
              if ( currentNote === aNote ) {
                noteTreeBoxObject.ensureRowIsVisible( aNewIndex );
                noteTree.view.selection.select( aNewIndex );
                saveNotesTreeSelection();
              }
              noteTree.addEventListener( "select", onNoteSelect, false );
            }
          }
        }
        break;
    }
  };

  function onNoteMovedInto( e ) {
    var anOldParent = e.data.oldParentCategory;
    var anOldIndex = e.data.oldIndex;
    var aNewParent = e.data.newParentCategory;
    var aNewIndex = e.data.newIndex;
    var aNote = e.data.movedIntoNote;
    var aBook = anOldParent.getBook();
    var anItemInfo, aTreeItem, aTreeIndex;
    if ( !currentBook || currentBook !== aBook ) {
      return;
    }
    updateFolderTreeItem( anOldParent );
    updateFolderTreeItem( aNewParent );
    switch ( currentBook.getSelectedTree() ) {
      case "Tags":
        updateNoteTreeItem( aNote );
        break;
      case "Categories":
        if ( currentCategory === anOldParent ) {
          updateCategoryCommands();
          anItemInfo = getNoteTreeItemAndIndex( aNote );
          if ( anItemInfo ) {
            aTreeItem = anItemInfo.item;
            if ( aTreeItem ) {
              aTreeIndex = anItemInfo.index;
              noteTree.removeEventListener( "select", onNoteSelect, false );
              noteTreeChildren.removeChild( aTreeItem );
              noteTree.addEventListener( "select", onNoteSelect, false );
              notesList.splice( aTreeIndex, 1 );
              if ( aTreeIndex === noteTree.view.rowCount ) {
                aTreeIndex--;
              }
              if ( currentNote === aNote ) {
                noteTreeBoxObject.ensureRowIsVisible( aTreeIndex );
                noteTree.view.selection.select( aTreeIndex );
              }
            }
          }
        } else if ( currentCategory === aNewParent ) {
          updateCategoryCommands();
          aTreeIndex = aNote.getIndex();
          notesList.splice( aTreeIndex, 0, aNote );
          aTreeItem = createNoteTreeItem( aNote );
          noteTree.removeEventListener( "select", onNoteSelect, false );
          if ( aTreeItem === notesList.length - 1 ) {
            noteTreeChildren.appendChild( aTreeItem );
          } else {
            noteTreeChildren.insertBefore( aTreeItem,
              noteTree.view.getItemAtIndex( aTreeIndex ) );
          }
          noteTree.addEventListener( "select", onNoteSelect, false );
          if ( !currentNote ) {
            noteTreeBoxObject.ensureRowIsVisible( aTreeIndex );
            noteTree.view.selection.select( aTreeIndex );
          }
        }
        break;
    }
  };
  
  function onNoteChanged( e ) {
    var aParent = e.data.parentCategory;
    var aNote = e.data.changedNote;
    var aBook = aParent.getBook();
    if ( currentBook && currentBook === aBook ) {
      updateNoteTreeItem( aNote );
    }
  };
  
  function onNoteTypeChanged( e ) {
    var aParent = e.data.parentCategory;
    var aNote = e.data.changedNote;
    var aBook = aParent.getBook();
    if ( currentBook && currentBook === aBook ) {
      updateNoteTreeItem( aNote );
      if ( currentNote && currentNote === aNote &&
           !currentNote.isLoading() ) {
        currentNoteChanged( true );
      }
    }
  };

  function onNoteLoadingChanged( e ) {
    var aParent = e.data.parentCategory;
    var aNote = e.data.changedNote;
    var oldLoading = e.data.oldValue;
    var newLoading = e.data.newValue;
    var aBook = aParent.getBook();
    if ( currentBook && currentBook === aBook ) {
      updateNoteTreeItem( aNote );
      if ( currentNote && currentNote === aNote &&
           !currentNote.isLoading() ) {
        currentNoteChanged( true );
      }
    }
  };

  function onNoteTagsChanged( e ) {
    var aParent = e.data.parentCategory;
    var aNote = e.data.changedNote;
    var oldTags = e.data.oldValue;
    var newTags = e.data.newValue;
    var aBook = aParent.getBook();
    if ( !currentBook || currentBook !== aBook ) {
      return;
    }
    switch ( currentBook.getSelectedTree() ) {
      case "Categories":
        updateNoteTreeItem( aNote );
        return;
      case "Tags":
        var aCurrentTagID = currentTag.getId();
        var aNoteIDs = aNote.getTags();
        var isNoteMustBeInNotesList = currentTag.isNoTag() ?
          aNoteIDs.length === 0 : aNoteIDs.indexOf( aCurrentTagID ) !== -1;
        var anItemInfo, anIndex, anItem, aRow;
        if ( isNoteMustBeInNotesList ) {
          if ( notesList.indexOf( aNote ) === -1 ) {
            notesList.push( aNote );
            noteTree.removeEventListener( "select", onNoteSelect, false );
            noteTreeChildren.appendChild( createNoteTreeItem( aNote ) );
            noteTree.addEventListener( "select", onNoteSelect, false );
            if ( noteTree.view.rowCount === 1 ) {
              noteTreeBoxObject.ensureRowIsVisible( 0 );
              noteTree.view.selection.select( 0 );
            }
          } else {
            updateNoteTreeItem( aNote );
          }
        } else {
          anItemInfo = getNoteTreeItemAndIndex( aNote );
          anItem = anItemInfo.item;
          anIndex = anItemInfo.index;
          if ( anItem ) {
            noteTree.removeEventListener( "select", onNoteSelect, false );
            noteTreeChildren.removeChild( anItem );
            noteTree.addEventListener( "select", onNoteSelect, false );
            notesList.splice( anIndex, 1 );
            if ( anIndex === noteTree.view.rowCount ) {
              anIndex--;
            }
            if ( currentNote === aNote ) {
              noteTreeBoxObject.ensureRowIsVisible( anIndex );
              noteTree.view.selection.select( anIndex );
            }
          }
        }
        break;
    }
  };
  
  function onNoteMainTagChanged( e ) {
    var aCategory = e.data.parentCategory;
    var aNote = e.data.changedNote;
    var oldTag = e.data.oldValue;
    var newTag = e.data.newValue;
    var aBook = aCategory.getBook();
    if ( currentBook && currentBook === aBook ) {
      updateNoteTreeItem( aNote );
    }
  };

  function onNoteMainContentChanged( e ) {
    var aCategory = e.data.parentCategory;
    var aNote = e.data.changedNote;
    var oldContent = e.data.oldValue;
    var newContent = e.data.newValue;
    var aBook = aCategory.getBook();
    if ( currentBook && currentBook === aBook ) {
      updateNoteTreeItem( aNote );
    }
  };

  function onNoteContentLoaded( e ) {
    var aCategory = e.data.parentCategory;
    var aNote = e.data.changedNote;
    var aBook = aNote.getBook();
    if ( currentBook && currentBook === aBook ) {
      if ( currentNote && currentNote === aNote &&
           !currentNote.isLoading() ) {
        currentNoteChanged( true );
      }
    }
  };

  function onNoteAttachmentAppended( e ) {
    var aCategory = e.data.parentCategory;
    var aNote = e.data.changedNote;
    var anAttachmentInfo = e.data.attachmentInfo;
    var aBook = aCategory.getBook();
    if ( currentBook && currentBook === aBook ) {
      updateNoteTreeItem( aNote );
    }
  };

  function onNoteAttachmentRemoved( e ) {
    var aCategory = e.data.parentCategory;
    var aNote = e.data.changedNote;
    var anAttachmentInfo = e.data.attachmentInfo;
    var aBook = aCategory.getBook();
    if ( currentBook && currentBook === aBook ) {
      updateNoteTreeItem( aNote );
    }
  };

  //
  // TAGLIST STATE LISTENER
  //

  function onTagChanged( e ) {
    var aTag = e.data.changedTag;
    var aBook = aTag.getBook();
    if ( !currentBook || currentBook != aBook ) {
      return;
    }
    updateTagTreeItem( aTag );
    for ( var i = 0; i < notesList.length; i++ ) {
      updateNoteTreeItem( notesList[i] );
    }
    updateTagCSSRules( aTag );
  };

  function onTagAppended( e ) {
    var aTag = e.data.appendedTag;
    if ( tagsList.indexOf( aTag ) < 0 ) {
      var aRow = aTag.getIndex();
      tagsList.splice( aRow, 0, aTag );
      var aTreeItem = createTagTreeItem( aTag );
      tagTree.removeEventListener( "select", onTagSelect, false );
      if ( aRow == tagsList.length - 1 ) {
        tagTreeChildren.appendChild( aTreeItem );
      } else {
        tagTreeChildren.insertBefore( aTreeItem, tagTree.view.getItemAtIndex( aRow ) );
      }
      tagTree.addEventListener( "select", onTagSelect, false );
      updateTagCSSRules( aTag );
    }
  };

  function onTagInserted( e ) {
    e.data.appendedTag = e.data.insertedTag;
    onTagAppended( e );
  };

  function onTagRemoved( e ) {
    var aTag = e.data.removedTag;
    var aTreeIndex = tagsList.indexOf( aTag );
    var aTreeItem = tagTree.view.getItemAtIndex( aTreeIndex );
    if ( aTreeItem ) {
      tagsList.splice( aTreeIndex, 1 );
      tagTree.removeEventListener( "select", onTagSelect, false );
      aTreeItem.parentNode.removeChild( aTreeItem );
      tagTree.addEventListener( "select", onTagSelect, false );
    }
    updateTagCSSRules( aTag );
  };

  //
  // BOOKS STATE LISTENER
  //

  function onBookOpened( e ) {
    var aBook = e.data.openedBook;
    var tagList = aBook.getTagList();
    tagList.getNoTag().setName( getString( "main.notag.name" ) );
    tagList.addStateListener( tagListStateListener );
    var contentTree = aBook.getContentTree();
    var contentTreeBin = contentTree.getBin();
    if ( contentTreeBin ) {
      contentTreeBin.rename( getString( "main.bin.name" ) );
    }
    contentTree.addStateListener( contentTreeStateListener );
    updateBookTreeItem( aBook );
    if ( currentBook && currentBook === aBook ) {
      currentBookChanged();
    }
  };

  function onBookClosed( e ) {
    var aBook = e.data.closedBook;
    updateBookTreeItem( aBook );
    if ( currentBook && currentBook === aBook ) {
      currentBookChanged();
    }
  };

  function onBookChanged( e ) {
    var aBook = e.data.changedBook;
    updateBookTreeItem( aBook );
    if ( currentBook && currentBook === aBook ) {
      if ( aBook.isOpen() ) {
        var tagList = aBook.getTagList();
        tagList.getNoTag().setName( getString( "main.notag.name" ) );
        tagList.addStateListener( tagListStateListener );
        var contentTree = aBook.getContentTree();
        var contentTreeBin = contentTree.getBin();
        if ( contentTreeBin ) {
          contentTreeBin.rename( getString( "main.bin.name" ) );
        }
        contentTree.addStateListener( contentTreeStateListener );
        var aRoot = contentTree.getRoot();
        updateFolderTreeItem( aRoot );
      }
    }
  };

  function onBookAppended( e ) {
    var aBook = e.data.appendedBook;
    var anIndex = aBook.getIndex();
    var aTreeItem = createBookTreeItem( aBook );
    booksList.splice( anIndex, 0, aBook );
    bookTree.removeEventListener( "select", onBookSelect, false );
    if ( anIndex === bookTree.view.rowCount ) {
      bookTreeChildren.appendChild( aTreeItem );
    } else {
      bookTreeChildren.insertBefore( aTreeItem,
        bookTree.view.getItemAtIndex( anIndex ) );
    }
    bookTree.addEventListener( "select", onBookSelect, false );
    if ( booksList.length === 1 ) {
      bookTreeBoxObject.ensureRowIsVisible( anIndex );
      bookTree.view.selection.select( anIndex );
    }
  };

  function onBookRemoved( e ) {
    var aBook = e.data.removedBook;
    var anIndex = aBook.getIndex();
    var aTreeItem = bookTree.view.getItemAtIndex( anIndex );
    booksList.splice( anIndex, 1 );
    if ( anIndex === bookTree.view.rowCount - 1 ) {
      anIndex--;
    }
    bookTree.removeEventListener( "select", onBookSelect, false );
    aTreeItem.parentNode.removeChild( aTreeItem );
    bookTree.addEventListener( "select", onBookSelect, false );
    if ( currentBook && currentBook === aBook ) {
      if ( anIndex !== -1 ) {
        bookTreeBoxObject.ensureRowIsVisible( anIndex );
      }
      bookTree.view.selection.select( anIndex );
    }
  };

  function onBookMovedTo( e ) {
    var aBook = e.data.movedToBook;
    var anOldIndex = e.data.oldValue;
    var aNewIndex = e.data.newValue;
    var aTreeItem = bookTree.view.getItemAtIndex( anOldIndex );
    booksList.splice( anOldIndex, 1 );
    booksList.splice( aNewIndex, 0, aBook );
    bookTree.removeEventListener( "select", onBookSelect, false );
    bookTreeChildren.removeChild( aTreeItem );
    if ( aNewIndex === bookTree.view.rowCount ) {
      bookTreeChildren.appendChild( aTreeItem );
    } else {
      bookTreeChildren.insertBefore(
        aTreeItem, bookTree.view.getItemAtIndex( aNewIndex ) );
    }
    if ( currentBook && currentBook === aBook ) {
      bookTreeBoxObject.ensureRowIsVisible( aNewIndex );
      bookTree.view.selection.select( aNewIndex );
      saveBooksTreeSelection();
    }
    bookTree.addEventListener( "select", onBookSelect, false );
  };
  
  // STATE CHANGED
  
  function updateNoteView() {
    refreshNotesList();
    restoreNotesTreeSelection();
  };

  function updateBodyView( forced ) {
    body.show( currentNote, forced );
  };
  
  function currentBookChanged() {
    updateEditCommands();
    updateBookCommands();
    if ( !currentBook || !currentBook.isOpen() ) {
      updateCategoryCommands();
      updateTagCommands();
    }
    updateBookView();
  };

  function currentCategoryChanged() {
    updateEditCommands();
    updateCategoryCommands();
    updateTagCommands();
    updateNoteView();
  };

  function currentTagChanged() {
    updateEditCommands();
    updateCategoryCommands();
    updateTagCommands();
    updateNoteView();
  };
  
  function currentNoteChanged( forced ) {
    updateEditCommands();
    updateNoteCommands();
    updateBodyView( !!forced );
  };

  // PREFERENSES

  function saveBooksTreeSelection() {
    prefsBundle.setIntPref( "currentBook",
      currentBook ? currentBook.getIndex() : -1 );
  };

  function restoreBooksTreeSelection() {
    var currentBookIndex = bookManager.hasBooks() ? 0 : -1;
    if ( !prefsBundle.hasPref( "currentBook" ) ) {
      prefsBundle.setIntPref( "currentBook", currentBookIndex );
    } else {
      currentBookIndex = prefsBundle.getIntPref( "currentBook" );
    }
    if ( currentBookIndex < 0 ) {
      currentBookIndex = bookManager.hasBooks() ? 0 : -1;
      prefsBundle.setIntPref( "currentBook", currentBookIndex );
    } else if ( currentBookIndex > bookTree.view.rowCount - 1 ) {
      currentBookIndex = bookManager.hasBooks() ? bookTree.view.rowCount - 1 : -1;
      prefsBundle.setIntPref( "currentBook", currentBookIndex );
    }
    if ( currentBookIndex >= 0 ) {
      bookTreeBoxObject.ensureRowIsVisible( currentBookIndex );
    }
    bookTree.view.selection.select( currentBookIndex );
  };

  function saveCategoriesTreeSelection() {
    if ( currentBook && currentBook.isOpen() ) {
      currentBook.setSelectedCategory(
        categoriesList.indexOf( currentCategory )
      );
    }
  };

  function restoreCategoriesTreeSelection() {
    if ( !currentBook || !currentBook.isOpen() ) {
      return;
    }
    var currentCategoryIndex = currentBook.getSelectedCategory();
    var currentTreeItem = getFolderTreeItemAtItemIndex( currentCategoryIndex );
    var currentRow = currentTreeItem ?
      folderTree.view.getIndexOfItem( currentTreeItem ) : 0;
    folderTreeBoxObject.ensureRowIsVisible( currentRow );
    folderTree.view.selection.select( currentRow );
  };

  function saveTagsTreeSelection() {
    if ( currentBook && currentBook.isOpen() ) {
      currentBook.setSelectedTag( currentTag.getIndex() );
    }
  };

  function restoreTagsTreeSelection() {
    if ( !currentBook || !currentBook.isOpen() ) {
      return;
    }
    var currentTagIndex = currentBook.getSelectedTag();
    if ( currentTagIndex < 0 ) {
      currentTagIndex = 0;
    } else if ( currentTagIndex > tagTree.view.rowCount - 1 ) {
      currentTagIndex = tagTree.view.rowCount - 1;
    }
    tagTreeBoxObject.ensureRowIsVisible( currentTagIndex );
    tagTree.view.selection.select( currentTagIndex );
  };

  function saveNotesTreeSelection() {
    if ( !currentBook || !currentBook.isOpen() || !currentNote ||
         !Utils.IS_SAVE_POSITION ) {
      return;
    }
    var index = notesList.indexOf( currentNote );
    switch ( currentBook.getSelectedTree() ) {
      case "Categories":
        if ( currentCategory != null ) {
          if ( currentCategory.isRoot() ) {
            currentBook.savePreference( "rootPosition", index );
          } else {
            currentCategory.setSelectedIndex( index );
          }
        }
        break;
      case "Tags":
        if ( currentTag != null ) {
          currentTag.setSelectedIndex( index );
        }
        break;
    }
  };

  function restoreNotesTreeSelection() {
    var index = -1;
    if ( currentBook && currentBook.isOpen() ) {
      switch ( currentBook.getSelectedTree() ) {
        case "Categories":
          if ( noteTree.view.rowCount > 0 ) {
            index = 0;
            if ( Utils.IS_SAVE_POSITION ) {
              if ( currentCategory.isRoot() ) {
                index = currentBook.loadPreference( "rootPosition", 0 );
              } else {
                index = currentCategory.getSelectedIndex();
              }
            }
          }
          break;
        case "Tags":
          if ( noteTree.view.rowCount > 0 ) {
            index = 0;
            if ( Utils.IS_SAVE_POSITION ) {
              index = currentTag.getSelectedIndex();
            }
          }
          break;
      }
      if ( index < 0 ) {
        index = 0;
      } else if ( index > noteTree.view.rowCount - 1 ) {
        index = noteTree.view.rowCount - 1;
      }
    }
    if ( index != -1 ) {
      noteTreeBoxObject.ensureRowIsVisible( index );
    }
    noteTree.view.selection.select( index );
  };

  function restoreCurrentBookLayout() {
    if ( currentBook == null ) {
      var defaultPreferences = bookManager.getDefaultPreferences();
      folderBox.setAttribute( "width",
        defaultPreferences["folderBoxWidth"] );
      bookTreeView.setAttribute( "height",
        defaultPreferences["bookTreeViewHeight"] );
      bookSplitter.setAttribute( "state",
        defaultPreferences["bookSplitterState"] );
      categoryBox.setAttribute( "height",
        defaultPreferences["categoryBoxHeight"] );
      folderTreeView.setAttribute( "height",
        defaultPreferences["folderTreeViewHeight"] );
      tagSplitter.setAttribute( "state",
        defaultPreferences["tagSplitterState"] );
      tagTreeView.setAttribute( "height",
        defaultPreferences["tagTreeViewHeight"] );
      folderSplitter.setAttribute( "state",
        defaultPreferences["folderSplitterState"] );
      noteBox.setAttribute( "width",
        defaultPreferences["noteBoxWidth"] );
      noteTreeView.setAttribute( "height",
        defaultPreferences["noteTreeViewHeight"] );
      noteTreeSplitter.setAttribute( "state",
        defaultPreferences["noteTreeSplitterState"] );
      noteBodyBox.setAttribute( "height",
        defaultPreferences["noteBodyBoxHeight"] );
      noteBodyView.setAttribute( "height",
        defaultPreferences["noteBodyViewHeight"] );
      qfBox.setAttribute( "collapsed",
        defaultPreferences["qfBoxCollapsed"] );
    } else {
      folderBox.setAttribute( "width",
        currentBook.loadPreference( "folderBoxWidth", "50" ) );
      bookTreeView.setAttribute( "height",
        currentBook.loadPreference( "bookTreeViewHeight", "250" ) );
      bookSplitter.setAttribute( "state",
        currentBook.loadPreference( "bookSplitterState", "open" ) );
      categoryBox.setAttribute( "height",
        currentBook.loadPreference( "categoryBoxHeight", "700" ) );
      folderTreeView.setAttribute( "height",
        currentBook.loadPreference( "folderTreeViewHeight", "500" ) );
      tagSplitter.setAttribute( "state",
        currentBook.loadPreference( "tagSplitterState", "open" ) );
      tagTreeView.setAttribute( "height",
        currentBook.loadPreference( "tagTreeViewHeight", "300" ) );
      folderSplitter.setAttribute( "state",
        currentBook.loadPreference( "folderSplitterState", "open" ) );
      noteBox.setAttribute( "width",
        currentBook.loadPreference( "noteBoxWidth", "900" ) );
      noteTreeView.setAttribute( "height",
        currentBook.loadPreference( "noteTreeViewHeight", "150" ) );
      noteTreeSplitter.setAttribute( "state",
        currentBook.loadPreference( "noteTreeSplitterState", "open" ) );
      noteBodyBox.setAttribute( "height",
        currentBook.loadPreference( "noteBodyBoxHeight", "900" ) );
      noteBodyView.setAttribute( "height",
        currentBook.loadPreference( "noteBodyViewHeight", "900" ) );
      qfBox.setAttribute( "collapsed",
        currentBook.loadPreference( "qfBoxCollapsed", "true" ) );
    }
    updateQuickFilterState();
  };

  // SESSIONS

  function getPersistedState() {
    var persistedState = null;
    if ( Utils.IS_STANDALONE ) {
      persistedState = sessionManager.getPersistedState();
    } else {
      var tab = Utils.getMainTab();
      if ( tab && tab.persistedState ) {
        persistedState = tab.persistedState;
      }
    }
    return persistedState;
  };

  function loadPersistedSession() {
    var persistedState = getPersistedState();
    if ( !persistedState ) {
      return;
    }
    var tabMail = Utils.getTabMail();
    for ( var i = 0; i < persistedState.tabs.length; i++ ) {
      var mode = persistedState.tabs[i].mode;
      if ( mode != "znotesContentTab" ) {
        continue;
      }
      var state = persistedState.tabs[i].state;
      var note = getNoteByBookIdAndNoteId( state.bookId, state.noteId );
      var background = tabMail ? state.background : true;
      if ( note ) {
        showNote( note, background );
      }
    }
  };

  // INIT & DONE
  
  function initGlobals() {
    Utils.initGlobals();
    if ( Utils.IS_STANDALONE ) {
      windowsList = [];
    }
    tabMonitor.setActive( true );
    Utils.MAIN_CONTEXT = getContext;
  };
  
  function initMain() {
    document.title = getString( "main.window.title" );
    // panel
    mainPanel = document.getElementById( "mainPanel" );
    if ( Utils.IS_STANDALONE ) {
      mainPanel.classList.add( "mainPanelXR" );
    }
    // toolbox
    mainMenuBar = document.getElementById( "znotes_mainmenutoolbar" );
    mainToolBox = document.getElementById( "znotes_maintoolbox" );
    mainToolBar = document.getElementById( "znotes_maintoolbar" );
    mainToolBox.customizeDone = onCustomizeMainToolbarDone;
    // menubar & appmenu
    mainMenu = document.getElementById( "znotes_mainmenubar" );
    mainAppMenu = document.getElementById( "znotes_appmenu_popup" );
    // keyset
    mainKeySet = new ru.akman.znotes.Keyset(
      document.getElementById( "znotes_keyset" ) );
    // statusbar
    statusBar = Utils.MAIN_WINDOW.document.getElementById(
      "znotes_statusbar" );
    if ( !Utils.IS_STANDALONE ) {
      statusBar = Utils.MAIN_WINDOW.document.getElementById(
        "status-bar" );
    }
    statusBarPanel = Utils.MAIN_WINDOW.document.getElementById(
      "znotes_statusbarpanel" );
    statusBarLogo = Utils.MAIN_WINDOW.document.getElementById(
      "znotes_statusbarpanellogo" );
    statusBarLabel = Utils.MAIN_WINDOW.document.getElementById(
      "znotes_statusbarpanellabel" );
    // view
    folderBox = document.getElementById( "folderBox" );
    bookTreeView = document.getElementById( "bookTreeView" );
    bookSplitter = document.getElementById( "bookSplitter" );
    categoryBox = document.getElementById( "categoryBox" );
    folderTreeView = document.getElementById( "folderTreeView" );
    tagSplitter = document.getElementById( "tagSplitter" );
    tagTreeView = document.getElementById( "tagTreeView" );
    folderSplitter = document.getElementById( "folderSplitter" );
    noteBox = document.getElementById( "noteBox" );
    noteTreeView = document.getElementById( "noteTreeView" );
    noteTreeSplitter = document.getElementById( "noteTreeSplitter" );
    noteBodyBox = document.getElementById( "noteBodyBox" );
    noteBodyView = document.getElementById( "noteBodyView" );
    // book
    bookTree = document.getElementById( "bookTree" );
    bookTreeChildren = document.getElementById( "bookTreeChildren" );
    bookTreeTextBox = bookTree.inputField;
    bookTreeTextBox.setAttribute( "clickSelectsAll", "true" );
    bookTreeSeparator = document.createElement( "treeseparator" );
    bookTreeSeparator.setAttribute( "properties", "booktreeseparator" );
    bookTreeBoxObject = bookTree.boxObject;
    bookTreeBoxObject.QueryInterface(
      Components.interfaces.nsITreeBoxObject );
    bookTree.setAttribute( "editable", "false" );
    // category
    folderTree = document.getElementById( "folderTree" );
    folderTreeChildren = document.getElementById( "folderTreeChildren" );
    folderTreeTextBox = folderTree.inputField;
    folderTreeTextBox.setAttribute( "clickSelectsAll", "true" );
    folderTreeSeparator = document.createElement( "treeseparator" );
    folderTreeSeparator.setAttribute( "properties", "foldertreeseparator" );
    folderTreeBoxObject = folderTree.boxObject;
    folderTreeBoxObject.QueryInterface(
      Components.interfaces.nsITreeBoxObject );
    folderTreeMenu = document.getElementById( "folderTreeMenu" );
    folderTree.setAttribute( "editable", "false" );
    // tag
    tagTree = document.getElementById( "tagTree" );
    tagTreeChildren = document.getElementById( "tagTreeChildren" );
    tagTreeTextBox = tagTree.inputField;
    tagTreeTextBox.setAttribute( "clickSelectsAll", "true" );
    tagTreeSeparator = document.createElement( "treeseparator" );
    tagTreeSeparator.setAttribute( "properties", "tagtreeseparator" );
    tagTreeBoxObject = tagTree.boxObject;
    tagTreeBoxObject.QueryInterface(
      Components.interfaces.nsITreeBoxObject );
    tagTree.setAttribute( "editable", "false" );
    // note
    noteTree = document.getElementById( "noteTree" );
    noteTreeChildren = document.getElementById( "noteTreeChildren" );
    noteTreeTextBox = noteTree.inputField;
    noteTreeTextBox.setAttribute( "clickSelectsAll", "true" );
    noteTreeSeparator = document.createElement( "treeseparator" );
    noteTreeSeparator.setAttribute( "properties", "notetreeseparator" );
    noteTreeBoxObject = noteTree.boxObject;
    noteTreeBoxObject.QueryInterface(
      Components.interfaces.nsITreeBoxObject );
    noteTree.setAttribute( "editable", "false" );
    // quick filter
    qfButton = document.getElementById( "znotes_showfilterbar_button" );
    qfBox = document.getElementById( "filterBox" );
  };
  
  function addEventListeners() {
    // keyset
    mainKeySet.activate();
    // splitters
    bookSplitter.addEventListener( "dblclick", onSplitterDblClick, false );
    tagSplitter.addEventListener( "dblclick", onSplitterDblClick, false );
    folderSplitter.addEventListener( "dblclick", onSplitterDblClick, false );
    noteTreeSplitter.addEventListener( "dblclick", onSplitterDblClick, false );
    // books
    bookTree.addEventListener( "select", onBookSelect, false );
    bookTree.addEventListener( "focus", onBookFocus, false );
    bookTree.addEventListener( "blur", onBookBlur, false );
    bookTree.addEventListener( "dblclick", onBookDblClick, true );
    bookTree.addEventListener( "contextmenu", onBookContextMenu, true );
    bookTreeChildren.addEventListener( "dragstart", onBookDragDrop, false );
    bookTreeChildren.addEventListener( "dragenter", onBookDragDrop, false );
    bookTreeChildren.addEventListener( "dragover", onBookDragDrop, false );
    bookTreeChildren.addEventListener( "dragleave", onBookDragDrop, false );
    bookTreeChildren.addEventListener( "drag", onBookDragDrop, false );
    bookTreeChildren.addEventListener( "drop", onBookDragDrop, false );
    bookTreeChildren.addEventListener( "dragend", onBookDragDrop, false );
    bookTreeTextBox.addEventListener( "focus", onBookTreeTextBoxEvent, false );
    bookTreeTextBox.addEventListener( "keypress", onBookTreeTextBoxEvent, false );
    bookTreeTextBox.addEventListener( "blur", onBookTreeTextBoxEvent, false );
    // categories
    folderTree.addEventListener( "select", onFolderSelect, false );
    folderTree.addEventListener( "focus", onFolderFocus, true );
    folderTree.addEventListener( "blur", onFolderBlur, false );
    folderTree.addEventListener( "contextmenu", onFolderContextMenu, true );
    folderTreeChildren.addEventListener( "dragstart", onFolderDragDrop, false );
    folderTreeChildren.addEventListener( "dragenter", onFolderDragDrop, false );
    folderTreeChildren.addEventListener( "dragover", onFolderDragDrop, false );
    folderTreeChildren.addEventListener( "dragleave", onFolderDragDrop, false );
    folderTreeChildren.addEventListener( "drag", onFolderDragDrop, false );
    folderTreeChildren.addEventListener( "drop", onFolderDragDrop, false );
    folderTreeChildren.addEventListener( "dragend", onFolderDragDrop, false );
    folderTreeTextBox.addEventListener( "focus", onFolderTreeTextBoxEvent, false );
    folderTreeTextBox.addEventListener( "keypress", onFolderTreeTextBoxEvent, false );
    folderTreeTextBox.addEventListener( "blur", onFolderTreeTextBoxEvent, false );
    // tags
    tagTree.addEventListener( "select", onTagSelect, false );
    tagTree.addEventListener( "focus", onTagFocus, false );
    tagTree.addEventListener( "blur", onTagBlur, false );
    tagTree.addEventListener( "dblclick", onTagDblClick, true );
    tagTree.addEventListener( "contextmenu", onTagContextMenu, true );
    tagTreeChildren.addEventListener( "dragstart", onTagDragDrop, false );
    tagTreeChildren.addEventListener( "dragenter", onTagDragDrop, false );
    tagTreeChildren.addEventListener( "dragover", onTagDragDrop, false );
    tagTreeChildren.addEventListener( "dragleave", onTagDragDrop, false );
    tagTreeChildren.addEventListener( "drag", onTagDragDrop, false );
    tagTreeChildren.addEventListener( "drop", onTagDragDrop, false );
    tagTreeChildren.addEventListener( "dragend", onTagDragDrop, false );
    tagTreeTextBox.addEventListener( "focus", onTagTreeTextBoxEvent, false );
    tagTreeTextBox.addEventListener( "keypress", onTagTreeTextBoxEvent, false );
    tagTreeTextBox.addEventListener( "blur", onTagTreeTextBoxEvent, false );
    // notes
    noteTree.addEventListener( "select", onNoteSelect, false );
    noteTree.addEventListener( "focus", onNoteFocus, false );
    noteTree.addEventListener( "blur", onNoteBlur, false );
    noteTree.addEventListener( "dblclick", onNoteDblClick, true );
    noteTree.addEventListener( "contextmenu", onNoteContextMenu, true );
    noteTreeChildren.addEventListener( "dragstart", onNoteDragDrop, false );
    noteTreeChildren.addEventListener( "dragenter", onNoteDragDrop, false );
    noteTreeChildren.addEventListener( "dragover", onNoteDragDrop, false );
    noteTreeChildren.addEventListener( "dragleave", onNoteDragDrop, false );
    noteTreeChildren.addEventListener( "drag", onNoteDragDrop, false );
    noteTreeChildren.addEventListener( "drop", onNoteDragDrop, false );
    noteTreeChildren.addEventListener( "dragend", onNoteDragDrop, false );
    noteTreeTextBox.addEventListener( "focus", onNoteTreeTextBoxEvent, false );
    noteTreeTextBox.addEventListener( "keypress", onNoteTreeTextBoxEvent, false );
    noteTreeTextBox.addEventListener( "blur", onNoteTreeTextBoxEvent, false );
  };

  function removeEventListeners() {
    // keyset
    mainKeySet.deactivate();
    // splitters
    bookSplitter.removeEventListener( "dblclick", onSplitterDblClick, false );
    folderSplitter.removeEventListener( "dblclick", onSplitterDblClick, false );
    tagSplitter.removeEventListener( "dblclick", onSplitterDblClick, false );
    noteTreeSplitter.removeEventListener( "dblclick", onSplitterDblClick, false );
    // books
    bookTree.removeEventListener( "select", onBookSelect, false );
    bookTree.removeEventListener( "focus", onBookFocus, false );
    bookTree.removeEventListener( "blur", onBookBlur, false );
    bookTree.removeEventListener( "dblclick", onBookDblClick, true );
    bookTree.removeEventListener( "contextmenu", onBookContextMenu, true );
    bookTreeChildren.removeEventListener( "dragstart", onBookDragDrop, false );
    bookTreeChildren.removeEventListener( "dragenter", onBookDragDrop, false );
    bookTreeChildren.removeEventListener( "dragover", onBookDragDrop, false );
    bookTreeChildren.removeEventListener( "dragleave", onBookDragDrop, false );
    bookTreeChildren.removeEventListener( "drag", onBookDragDrop, false );
    bookTreeChildren.removeEventListener( "drop", onBookDragDrop, false );
    bookTreeChildren.removeEventListener( "dragend", onBookDragDrop, false );
    bookTreeTextBox.removeEventListener( "focus", onBookTreeTextBoxEvent, false );
    bookTreeTextBox.removeEventListener( "keypress", onBookTreeTextBoxEvent, false );
    bookTreeTextBox.removeEventListener( "blur", onBookTreeTextBoxEvent, false );
    // categories
    folderTree.removeEventListener( "select", onFolderSelect, false );
    folderTree.removeEventListener( "focus", onFolderFocus, true );
    folderTree.removeEventListener( "blur", onFolderBlur, false );
    folderTree.removeEventListener( "contextmenu", onFolderContextMenu, true );
    folderTreeChildren.removeEventListener( "dragstart", onFolderDragDrop, false );
    folderTreeChildren.removeEventListener( "dragenter", onFolderDragDrop, false );
    folderTreeChildren.removeEventListener( "dragover", onFolderDragDrop, false );
    folderTreeChildren.removeEventListener( "dragleave", onFolderDragDrop, false );
    folderTreeChildren.removeEventListener( "drag", onFolderDragDrop, false );
    folderTreeChildren.removeEventListener( "drop", onFolderDragDrop, false );
    folderTreeChildren.removeEventListener( "dragend", onFolderDragDrop, false );
    folderTreeTextBox.removeEventListener( "focus", onFolderTreeTextBoxEvent, false );
    folderTreeTextBox.removeEventListener( "keypress", onFolderTreeTextBoxEvent, false );
    folderTreeTextBox.removeEventListener( "blur", onFolderTreeTextBoxEvent, false );
    // tags
    tagTree.removeEventListener( "select", onTagSelect, false );
    tagTree.removeEventListener( "focus", onTagFocus, false );
    tagTree.removeEventListener( "blur", onTagBlur, false );
    tagTree.removeEventListener( "dblclick", onTagDblClick, true );
    tagTree.removeEventListener( "contextmenu", onTagContextMenu, true );
    tagTreeChildren.removeEventListener( "dragstart", onTagDragDrop, false );
    tagTreeChildren.removeEventListener( "dragenter", onTagDragDrop, false );
    tagTreeChildren.removeEventListener( "dragover", onTagDragDrop, false );
    tagTreeChildren.removeEventListener( "dragleave", onTagDragDrop, false );
    tagTreeChildren.removeEventListener( "drag", onTagDragDrop, false );
    tagTreeChildren.removeEventListener( "drop", onTagDragDrop, false );
    tagTreeChildren.removeEventListener( "dragend", onTagDragDrop, false );
    tagTreeTextBox.removeEventListener( "focus", onTagTreeTextBoxEvent, false );
    tagTreeTextBox.removeEventListener( "keypress", onTagTreeTextBoxEvent, false );
    tagTreeTextBox.removeEventListener( "blur", onTagTreeTextBoxEvent, false );
    // notes
    noteTree.removeEventListener( "select", onNoteSelect, false );
    noteTree.removeEventListener( "focus", onNoteFocus, false );
    noteTree.removeEventListener( "blur", onNoteBlur, false );
    noteTree.removeEventListener( "dblclick", onNoteDblClick, true );
    noteTree.removeEventListener( "contextmenu", onNoteContextMenu, true );
    noteTreeChildren.removeEventListener( "dragstart", onNoteDragDrop, false );
    noteTreeChildren.removeEventListener( "dragenter", onNoteDragDrop, false );
    noteTreeChildren.removeEventListener( "dragover", onNoteDragDrop, false );
    noteTreeChildren.removeEventListener( "dragleave", onNoteDragDrop, false );
    noteTreeChildren.removeEventListener( "drag", onNoteDragDrop, false );
    noteTreeChildren.removeEventListener( "drop", onNoteDragDrop, false );
    noteTreeChildren.removeEventListener( "dragend", onNoteDragDrop, false );
    noteTreeTextBox.removeEventListener( "focus", onNoteTreeTextBoxEvent, false );
    noteTreeTextBox.removeEventListener( "keypress", onNoteTreeTextBoxEvent, false );
    noteTreeTextBox.removeEventListener( "blur", onNoteTreeTextBoxEvent, false );
  };

  function setupControllers() {
    mainCommandController.init();
    mainCommandController.registerCommand(
      "znotes_savemessage_command", saveMessageCommand );
  };

  function addControllers() {
    mainController.register();
    editController.register();
    mainCommandController.register();
  };

  function removeControllers() {
    mainCommandController.unregister();
    editController.unregister();
    mainController.unregister();
  };
  
  function addUpdaters() {
    //editUpdater.register();
  };
  
  function removeUpdaters() {
    //editUpdater.unregister();
  };
  
  function connectMutationObservers() {
    mutationObservers = [];
    mutationObservers.push( connectMutationObserver(
      folderBox, "width", "folderBoxWidth" ) );
    mutationObservers.push( connectMutationObserver(
      bookTreeView, "height", "bookTreeViewHeight" ) );
    mutationObservers.push( connectMutationObserver(
      bookSplitter, "state", "bookSplitterState" ) );
    mutationObservers.push( connectMutationObserver(
      categoryBox, "height", "categoryBoxHeight" ) );
    mutationObservers.push( connectMutationObserver(
      folderTreeView, "height", "folderTreeViewHeight" ) );
    mutationObservers.push( connectMutationObserver(
      tagSplitter, "state", "tagSplitterState" ) );
    mutationObservers.push( connectMutationObserver(
      tagTreeView, "height", "tagTreeViewHeight" ) );
    mutationObservers.push( connectMutationObserver(
      folderSplitter, "state", "folderSplitterState" ) );
    mutationObservers.push( connectMutationObserver(
      noteBox, "width", "noteBoxWidth" ) );
    mutationObservers.push( connectMutationObserver(
      noteTreeView, "height", "noteTreeViewHeight" ) );
    mutationObservers.push( connectMutationObserver(
      noteTreeSplitter, "state", "noteTreeSplitterState" ) );
    mutationObservers.push( connectMutationObserver(
      noteBodyBox, "height", "noteBodyBoxHeight" ) );
    mutationObservers.push( connectMutationObserver(
      noteBodyView, "height", "noteBodyViewHeight" ) );
    folderTreeOpenStateMutationObserver = new MutationObserver(
      function( mutations ) {
        mutations.forEach(
          function( mutation ) {
            var category;
            var state = mutation.target.hasAttribute( "open" );
            var state = ( state &&
                          mutation.target.getAttribute( "open" ) === "true" );
            var index = folderTree.view.getIndexOfItem( mutation.target );
            if ( index != -1 ) {
              category =
                getFolderTreeItemAndCategoryAtRowIndex( index ).category;
              if ( category ) {
                category.setOpenState( state );
              }
            }
          }
        );
      }
    );
    folderTreeOpenStateMutationObserver.observe(
      folderTreeChildren,
      {
        subtree: true,
        attributes: true,
        attributeFilter: [ "open" ]
      }
    );    
  };

  function connectMutationObserver( target, attrName, prefName ) {
    var mutationObserver = new MutationObserver(
      function( mutations ) {
        mutations.forEach(
          function( mutation ) {
            if ( currentBook ) {
              currentBook.savePreference(
                prefName,
                mutation.target.getAttribute( attrName )
              );
            }
          }
        );
      }
    );
    mutationObserver.observe(
      target,
      {
        attributes: true,
        attributeFilter: [ attrName ]
      }
    );
    return mutationObserver;
  };

  function disconnectMutationObservers() {
    for ( var i = 0; i < mutationObservers.length; i++ ) {
      mutationObservers[i].disconnect();
    }
    folderTreeOpenStateMutationObserver.disconnect();
  };
  
  function connectPrefsObservers() {
    prefsBundleObserver.register();
    prefsMozillaObserver.register();
  };
  
  function disconnectPrefsObservers() {
    prefsBundleObserver.unregister();
    prefsMozillaObserver.unregister();
  };
  
  function connectPlatformObservers() {
    platformQuitObserver.register();
  };

  function disconnectPlatformObservers() {
    platformQuitObserver.unregister();
  };
  
  function connectHelperObservers() {
    helperObserver.register();
  };

  function disconnectHelperObservers() {
    helperObserver.unregister();
  };
  
  function connectConsoleObserver() {
    consoleFlag = false;
    consoleWindow =
      Components.classes["@mozilla.org/appshell/window-mediator;1"]
                .getService( Components.interfaces.nsIWindowMediator )
                .getMostRecentWindow( "global:console" );
    if ( consoleWindow ) {
      consoleFlag = true;
      consoleWindow.addEventListener( "close", onConsoleClose, true );
    }
  };

  function initBody() {
    body = new ru.akman.znotes.Body(
      {
        window: window,
        name: "main",
        mode: "viewer",
        style: {
          iconsize: mainToolBar.getAttribute( "iconsize" )
        }
      }
    );
  };
  
  function doneBody() {
    if ( !body ) {
      return;
    }
    body.release();
    body = null;
  };
  
  function updateKeyset() {
    var shortcuts = {};
    try {
      shortcuts = JSON.parse( Utils.MAIN_SHORTCUTS );
      if ( typeof( shortcuts ) !== "object" ) {
        shortcuts = {};
      }
    } catch ( e ) {
      Utils.log( e + "\n" + Utils.dumpStack() );
      shortcuts = {};
    }
    mainKeySet.update( shortcuts );
    Utils.updateKeyAttribute( mainAppMenu );
    Utils.updateKeyAttribute( mainMenu );
  };
  
  function updateUI() {
    updateNewNoteMenuPopup();
    updateMainMenubarVisibility();
    updateMainToolbarVisibility();
    updateCommandsVisibility();
    updateCommonCommands();
    updateKeyset();    
  };
  
  function updateFocus() {
    window.focus();
    if ( currentNote ) {
      noteTree.focus();
      return;
    }
    if ( currentCategory ) {
      folderTree.focus();
      return;
    }
    if ( currentTag ) {
      tagTree.focus();
      return;
    }
    bookTree.focus();
  };
  
  function load() {
    // The order of calling is important !
    initGlobals();
    loadPrefs();
    initMain();
    setupControllers();
    addControllers();
    addEventListeners();
    addUpdaters();
    connectConsoleObserver();
    connectPlatformObservers();
    connectPrefsObservers();
    connectMutationObservers();
    connectHelperObservers();
    initBody();
    updateUI();
    //
    refreshBooksList();
    restoreBooksTreeSelection();
    loadPersistedSession();
    if ( Utils.IS_STANDALONE ) {
      updateWindowSizeAndPosition();
    }
    if ( Utils.IS_TEST_ACTIVE ) {
      doOpenTestSuiteWindow();
    }
    if ( Utils.IS_PLAY_SOUND ) {
      playSound();
    }
    updateFocus();
    updateEditCommands();
    observerService.notifyObservers( window, "znotes-main-startup", null );
    if ( prefsBundle.getCharPref( "version" ) != Utils.VERSION ) {
      prefsBundle.setCharPref( "version", Utils.VERSION );
      Utils.showNewVersionInfo( "maximized" );
    }
  };

  function unload() {
  };
  
  function quit() {
    doneBody();
    doneBooks();
    removeUpdaters();
    removeControllers();
    removeEventListeners();
    disconnectPlatformObservers();
    disconnectHelperObservers();
    disconnectMutationObservers();
    disconnectPrefsObservers();
    closeWindows();
  };
  
  // HELPERS

  function getElementId( element ) {
    if ( !element ) {
      return null;
    }
    if ( element.nodeType == Node.ELEMENT_NODE ) {
      if ( element.hasAttribute( "id" ) ) {
        return element.getAttribute( "id" );
      }
    }
    return getElementId( element.parentNode );
  };
  
  function getValidNoteName( category, name, aType ) {
    var index = 0, suffix = "";
    while ( !category.canCreateNote( name + suffix, aType ) ) {
      suffix = " (" + ++index + ")";
    }
    return name + suffix;
  };
  
  function getString( name ) {
    var str;
    try {
      str = Utils.STRINGS_BUNDLE.getString( name );
    } catch ( e ) {
      str = "?" + name + "?";
      Utils.log( e + "\n'" + name + "'\n" + Utils.dumpStack() );
    }
    return str;
  };
  
  function getFormattedString( name, values ) {
    var str;
    try {
      str = Utils.STRINGS_BUNDLE.getFormattedString( name, values );
    } catch ( e ) {
      str = "?" + name + "?";
      Utils.log( e + "\n'" + name + "'\n" + Utils.dumpStack() );
    }
    return str;
  };
  
  function updateSelectedPopupItem( event ) {
    selectedPopupItem = event.target;
  };
  
  function playSound() {
    ( new Audio( "chrome://znotes_sounds/skin/notify.wav" ) ).play();
  };
  
  function openErrorDialog( message1, message2 ) {
    var params = {
      input: {
        title: getString( "main.errordialog.title" ),
        message1: message1,
        message2: message2
      },
      output: null
    };
    window.setTimeout(
      function() {
        window.openDialog(
          "chrome://znotes/content/messagedialog.xul",
          "",
          "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
          params
        ).focus();
      },
      0
    );
  }

  function getContext() {
    return {
      window: window,
      book: currentBook,
      category: currentCategory,
      tag: currentTag,
      note: currentNote
    };
  };
  
  function dumpCategoriesList( title ) {
    Utils.log( title );
    for ( var i = 0; i < categoriesList.length; i++ ) {
      Utils.log( i + ": " + categoriesList[i].getName() );
    }
  };
  
  // XR only
  function updateWindowSizeAndPosition() {
    var win = Utils.MAIN_WINDOW;
    var availLeft = win.screen.availLeft;
    var availTop = win.screen.availTop;
    var availWidth = win.screen.availWidth;
    var availHeight = win.screen.availHeight;
    if ( Utils.IS_FIRST_RUN ) {
      win.moveTo( availLeft, availTop );
      win.resizeTo( availWidth - availLeft, availHeight - availTop );
      return;
    }
    // maximized
    if ( win.windowState == 1 ) {
      win.maximize();
      return;
    }
    // normal
    var availRight = availLeft + availWidth - 1;
    var availBottom = availTop + availHeight - 1;
    var screenL = win.screenX;
    var screenT = win.screenY;
    var flagMove = false;
    if ( screenL < availLeft ) {
      flagMove = true;
      screenL = availLeft;
    }
    if ( screenT < availTop ) {
      flagMove = true;
      screenT = availTop;
    }
    if ( flagMove ) {
      win.moveTo( screenL, screenT );
    }
    //
    var outerWidth = win.outerWidth
    var outerHeight = win.outerHeight;
    var screenR = screenL + outerWidth - 1;
    var screenB = screenT + outerHeight - 1;
    //
    var flagResize = false;
    if ( screenR > ( availRight - availLeft ) ) {
      flagResize = true;
      outerWidth -= ( screenR - ( availRight - availLeft ) );
    }
    if ( screenB > ( availBottom - availTop ) ) {
      flagResize = true;
      outerHeight -= ( screenB - ( availBottom - availTop ) );
    }
    if ( flagResize ) {
      win.resizeTo( outerWidth, outerHeight );
    }
  };
  
  function closeWindows() {
    var win, windowEnumerator;
    var windowWatcher =
      Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                .getService( Components.interfaces.nsIWindowWatcher );
    // consoleWindow
    if ( consoleWindow ) {
      consoleWindow.removeEventListener( "close", onConsoleClose, true );
      if ( !consoleFlag ) {
        consoleWindow.close();
      }
    }
    // browserWindow
    windowEnumerator = windowWatcher.getWindowEnumerator();
    while ( windowEnumerator.hasMoreElements() ) {
      win = windowEnumerator.getNext().QueryInterface(
        Components.interfaces.nsIDOMWindow );
      if ( win.document.location.href.indexOf(
             "chrome://znotes/content/browser.xul" ) === 0 ) {
        win.close();
      };
    }
  };
  
  // PUBLIC
  
  pub.onLoad = function() {
    load();
  };

  pub.onClose = function() {
    Utils.IS_QUIT_ENABLED = true;
    observerService.notifyObservers( null, "znotes-quit-requested", null );
    if ( Utils.IS_QUIT_ENABLED ) {
      if ( !Utils.IS_STANDALONE ) {
        prefsBundle.setBoolPref( "isOpened", false );
      }
      tabMonitor.setActive( false );
      observerService.notifyObservers( null, "znotes-quit-accepted", null );
    }
    return Utils.IS_QUIT_ENABLED;
  };
  
  pub.onUnload = function() {
    unload();
    observerService.notifyObservers( window, "znotes-main-shutdown", null );
  };
  
  return pub;

}();

window.addEventListener( "load", ru.akman.znotes.Main.onLoad, false );
window.addEventListener( "close", ru.akman.znotes.Main.onClose, false );
window.addEventListener( "unload", ru.akman.znotes.Main.onUnload, false );
