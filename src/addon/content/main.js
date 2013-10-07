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
Components.utils.import( "resource://znotes/drivermanager.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/documentmanager.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/booklist.js",
  ru.akman.znotes.core
);
Components.utils.import( "resource://znotes/event.js",
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

ru.akman.znotes.Main = function() {

  var pub = {};

  var Utils = ru.akman.znotes.Utils;
  var Common = ru.akman.znotes.Common;

  var prefsMozilla =
    Components.classes["@mozilla.org/preferences-service;1"]
              .getService( Components.interfaces.nsIPrefBranch );
  var prefsBundle = ru.akman.znotes.PrefsManager.getInstance();

  var windowsList = null;
  var windowsMonitor = null;
  
  var mainToolBox = null;
  var mainMenuBar = null;
  var mainToolBar = null;

  var statusBarPanel = null;
  var statusBarLogo = null;
  var statusBarLabel = null;

  var newNoteButtonMenuPopup = null;
  var importNoteButtonMenuPopup = null;
  var selectedPopupItem = null;
  
  var mutationObservers = null;
  
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

  var books = null;
  
  var booksList = null;
  var categoriesList = null;
  var tagsList = null;
  var notesList = null;
  
  var currentBook = null;
  var currentTree = null;
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
  
  var booksStateListener = {
    onBookChanged: onBookChanged,
    onBookOpened: onBookOpened,
    onBookClosed: onBookClosed,
    onBookAppended: onBookAppended,
    onBookRemoved: onBookRemoved,
    onBookInserted: onBookInserted
  };
  
  var contentTreeStateListener = {
    onCategoryChanged: onCategoryChanged,
    onNoteChanged: onNoteChanged,
    onNoteLoadingChanged: onNoteLoadingChanged,
    onNoteStatusChanged: onNoteStatusChanged,
    onNoteTagsChanged: onNoteTagsChanged,
    onNoteMainTagChanged: onNoteMainTagChanged,
    onNoteMainContentChanged: onNoteMainContentChanged,
    onNoteContentLoaded: onNoteContentLoaded,
    onNoteContentAppended: onNoteContentAppended,
    onNoteContentRemoved: onNoteContentRemoved,
    onNoteAttachmentAppended: onNoteAttachmentAppended,
    onNoteAttachmentRemoved: onNoteAttachmentRemoved,
    onCategoryAppended: onCategoryAppended,
    onCategoryInserted: onCategoryInserted,
    onCategoryRemoved: onCategoryRemoved,
    onNoteAppended: onNoteAppended,
    onNoteInserted: onNoteInserted,
    onNoteRemoved: onNoteRemoved
  };
  
  var tagListStateListener = {
    onTagChanged: onTagChanged,
    onTagAppended: onTagAppended,
    onTagRemoved: onTagRemoved,
    onTagInserted: onTagInserted
  };
  
  //
  // SHUTDOWN
  //
  
  var platformBundleObserver = {
    onPlatformClose: function( event ) {
      event.data.canClose = close();
    },
    register: function() {
      if ( Utils.IS_STANDALONE ) {
        Utils.MAIN_WINDOW.ru.akman.znotes.ZNotes.addObserver( this );
      }
    },
    unregister: function() {
      if ( Utils.IS_STANDALONE ) {
        Utils.MAIN_WINDOW.ru.akman.znotes.ZNotes.removeObserver( this );
      }
    }
  };
  
  //
  // PREFERENCES
  //
  
  var prefsBundleObserver = {
    onPrefChanged: function( event ) {
      switch( event.data.name ) {
        case "isSavePosition":
          Utils.IS_SAVE_POSITION = event.data.newValue;
          saveNotesTreeSelection();
          break;
        case "isEditSourceEnabled":
          Utils.IS_EDIT_SOURCE_ENABLED = event.data.newValue;
          currentNoteChanged();
          break;
        case "isOpened":
          var isOpened = event.data.newValue;
          if ( !isOpened ) {
            unload();
          }
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
          Common.goSetCommandHidden( "znotes_debug_command",
            !Utils.IS_DEBUG_ENABLED );
          Common.goUpdateCommand( "znotes_debug_command" );
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
    if ( prefsMozilla.prefHasUserValue( "extensions.znotes.debug" ) ) {
      Utils.IS_DEBUG_ENABLED =
        prefsMozilla.getBoolPref( "extensions.znotes.debug" );
    }
    if ( prefsMozilla.prefHasUserValue( "extensions.znotes.debug.active" ) ) {
      Utils.IS_DEBUG_ACTIVE =
        prefsMozilla.getBoolPref( "extensions.znotes.debug.active" );
    }
    if ( prefsMozilla.prefHasUserValue( "extensions.znotes.debug.raised" ) ) {
      Utils.IS_DEBUG_RAISED =
        prefsMozilla.getBoolPref( "extensions.znotes.debug.raised" );
    }
    if ( prefsMozilla.prefHasUserValue( "extensions.znotes.sanitize" ) ) {
      Utils.IS_SANITIZE_ENABLED =
        prefsMozilla.getBoolPref( "extensions.znotes.sanitize" );
    }
    if ( prefsMozilla.prefHasUserValue( "extensions.znotes.ad" ) ) {
      Utils.IS_AD_ENABLED =
        prefsMozilla.getBoolPref( "extensions.znotes.ad" );
    }
    try {
      if ( !prefsBundle.hasPref( "isFirstRun" ) ) {
        prefsBundle.setBoolPref( "isFirstRun",
          Utils.IS_FIRST_RUN );
      }
      Utils.IS_FIRST_RUN =
        prefsBundle.getBoolPref( "isFirstRun" );
      //
      if ( Utils.IS_FIRST_RUN ) {
        prefsBundle.setBoolPref( "isFirstRun", false );
      }
      // -----------------------------------------------------------------------
      if ( !prefsBundle.hasPref( "version" ) ) {
        prefsBundle.setCharPref( "version",
          Utils.VERSION );
      }
      if ( prefsBundle.getCharPref( "version" ) != Utils.VERSION ) {
        prefsBundle.setCharPref( "version",
          Utils.VERSION );
        Utils.IS_FIRST_RUN = true;
      }
      // -----------------------------------------------------------------------
      if ( !prefsBundle.hasPref( "isSavePosition" ) ) {
        prefsBundle.setBoolPref( "isSavePosition",
          Utils.IS_SAVE_POSITION );
      }
      Utils.IS_SAVE_POSITION =
        prefsBundle.getBoolPref( "isSavePosition" );
      //
      if ( !prefsBundle.hasPref( "isEditSourceEnabled" ) ) {
        prefsBundle.setBoolPref( "isEditSourceEnabled",
          Utils.IS_EDIT_SOURCE_ENABLED );
      }
      Utils.IS_EDIT_SOURCE_ENABLED =
        prefsBundle.getBoolPref( "isEditSourceEnabled" );
      //
      if ( !prefsBundle.hasPref( "isPlaySound" ) ) {
        prefsBundle.setBoolPref( "isPlaySound",
          Utils.IS_PLAY_SOUND );
      }
      Utils.IS_PLAY_SOUND =
        prefsBundle.getBoolPref( "isPlaySound" );
      //
      if ( !prefsBundle.hasPref( "isMainMenubarVisible" ) ) {
        prefsBundle.setBoolPref( "isMainMenubarVisible",
          Utils.IS_MAINMENUBAR_VISIBLE );
      }
      Utils.IS_MAINMENUBAR_VISIBLE =
        prefsBundle.getBoolPref( "isMainMenubarVisible" );
      //
      if ( !prefsBundle.hasPref( "isMainToolbarVisible" ) ) {
        prefsBundle.setBoolPref( "isMainToolbarVisible",
          Utils.IS_MAINTOOLBAR_VISIBLE );
      }
      Utils.IS_MAINTOOLBAR_VISIBLE =
        prefsBundle.getBoolPref( "isMainToolbarVisible" );
      //
      if ( !prefsBundle.hasPref( "defaultDocumentType" ) ) {
        prefsBundle.setCharPref( "defaultDocumentType",
          Utils.DEFAULT_DOCUMENT_TYPE );
      }
      Utils.DEFAULT_DOCUMENT_TYPE =
        prefsBundle.getCharPref( "defaultDocumentType" );
    } catch ( e ) {
      Utils.log( e );
    }
    if ( Utils.IS_FIRST_RUN || Utils.IS_DEBUG_ENABLED ) {
      var observerService =
        Components.classes["@mozilla.org/observer-service;1"]
                  .getService( Components.interfaces.nsIObserverService );
		  observerService.notifyObservers( null, "startupcache-invalidate", null );
		  observerService.notifyObservers( null, "chrome-flush-skin-caches", null );
		  observerService.notifyObservers( null, "chrome-flush-caches", null );
    }
  };
  
  // DRIVERS

  function loadDrivers() {
    var driverDirectory = Utils.getDriverDirectory();
    var entries = driverDirectory.directoryEntries;
    var driver = null;
    var name = null;
    var entry = null;
    while( entries.hasMoreElements() ) {
      entry = entries.getNext();
      entry.QueryInterface( Components.interfaces.nsIFile );
      if ( !entry.isDirectory() ) {
        continue;
      }
      name = entry.leafName;
      try {
        driver = ru.akman.znotes.DriverManager.registerDriver( name );
      } catch ( e ) {
        driver = null;
        Utils.log( e );
      }
      if ( driver == null ) {
        Utils.log( "Error loading driver: " + entry.path );
      }
    }
  };

  // DOCUMENTS

  function loadDocuments() {
    var documentDirectory = Utils.getDocumentDirectory();
    var entries = documentDirectory.directoryEntries;
    var doc = null;
    var name = null;
    var entry = null;
    while( entries.hasMoreElements() ) {
      entry = entries.getNext();
      entry.QueryInterface( Components.interfaces.nsIFile );
      if ( !entry.isDirectory() ) {
        continue;
      }
      name = entry.leafName;
      try {
        doc = ru.akman.znotes.DocumentManager.registerDocument( name );
      } catch ( e ) {
        doc = null;
        Utils.log( e );
      }
      if ( doc == null ) {
        Utils.log( "Error loading document: " + entry.path );
      }
    }
  };
  
  //
  // COMMANDS
  //

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
    "znotes_debug_command": null,
    "znotes_addons_command": null,
    "znotes_update_command": null,
    // edit
    "znotes_undo_command": null,
    "znotes_redo_command": null,
    "znotes_cut_command": null,
    "znotes_copy_command": null,
    "znotes_paste_command": null,
    "znotes_delete_command": null,
    "znotes_selectall_command": null
  };

  var mainController = {
    supportsCommand: function( cmd ) {
      if ( !( cmd in mainCommands ) ) {
        return false;
      }
      //Utils.log( this.getName() + "::supportsCommand() '" + cmd + "'" );
      return true;
    },
    isCommandEnabled: function( cmd ) {
      if ( !( cmd in mainCommands ) ) {
        return false;
      }
      var activeElementId = document.activeElement.getAttribute( "id" );
      switch ( cmd ) {
        // platform
        case "znotes_debug_command":
          return Utils.IS_DEBUG_ENABLED;
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
        case "znotes_deletecategory_command":
        case "znotes_renamecategory_command":
          return currentBook && currentBook.isOpen() &&
                 currentBook.getSelectedTree() == "Categories" &&
                 currentCategory &&
                 ( categoriesList.indexOf( currentCategory ) != 0 );
        case "znotes_refreshfoldertree_command":
        case "znotes_newcategory_command":
          return currentBook && currentBook.isOpen() &&
                 currentBook.getSelectedTree() == "Categories";
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
        case "znotes_newnote_command":
        case "znotes_importnote_command":
        case "znotes_refreshnotetree_command":
          return currentBook && currentBook.isOpen();
        // edit
        case "znotes_undo_command":
        case "znotes_redo_command":
        case "znotes_paste_command":
        case "znotes_selectall_command":
        case "znotes_copy_command":
        case "znotes_cut_command":
          return false;
        case "znotes_delete_command":
          switch ( activeElementId ) {
            case "bookTree":
              return currentBook;
            case "folderTree":
              return currentBook && currentBook.isOpen() &&
                     currentBook.getSelectedTree() == "Categories" &&
                     currentCategory &&
                     ( categoriesList.indexOf( currentCategory ) != 0 );
            case "tagTree":
              return currentBook && currentBook.isOpen() &&
                     currentBook.getSelectedTree() == "Tags" &&
                     currentTag && !currentTag.isNoTag();
            case "noteTree":
              return currentBook && currentBook.isOpen() && currentNote;
          }
          return false;
      }
      //Utils.log( this.getName() + "::isCommandEnabled() '" + cmd + "'" );
      return false;
    },
    doCommand: function( cmd ) {
      if ( !( cmd in mainCommands ) ) {
        return;
      }
      //Utils.log( this.getName() + "::doCommand() '" + cmd + "'" );
      var activeElementId = document.activeElement.getAttribute( "id" );
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
        case "znotes_debug_command":
          doOpenDebugWindow();
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
        // edit
        case "znotes_undo_command":
          doUndo();
          break;
        case "znotes_redo_command":
          doRedo();
          break;
        case "znotes_selectall_command":
          switch ( activeElementId ) {
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
          switch ( activeElementId ) {
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
          switch ( activeElementId ) {
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
          switch ( activeElementId ) {
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
          switch ( activeElementId ) {
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
      Utils.log( this.getName() + "::onEvent() '" + event + "'" );
    },
    getName: function() {
      return "MAIN";
    },
    getCommand: function( cmd ) {
      if ( cmd in mainCommands ) {
        return document.getElementById( cmd );
      }
      return null;
    },
    register: function() {
      Utils.appendAccelText( mainCommands, document );
      try {
        top.controllers.insertControllerAt( 0, this );
      } catch ( e ) {
        Components.utils.reportError(
          "An error occurred registering '" + this.getName() + "' controller: " + e
        );
      }
    },
    unregister: function() {
      try {
        top.controllers.removeController( this );
      } catch ( e ) {
        Components.utils.reportError(
          "An error occurred unregistering '" + this.getName() + "' controller: " + e
        );
      }
      Utils.removeAccelText( mainCommands, document );
    }
  };

  function updateCommandsVisibility() {
    Common.goSetCommandHidden( "znotes_addons_command", !Utils.IS_STANDALONE );
    Common.goSetCommandHidden( "znotes_update_command", !Utils.IS_STANDALONE );
    Common.goSetCommandHidden( "znotes_debug_command", !Utils.IS_DEBUG_ENABLED );
  };
  
  function updateCommands() {
    for ( var cmd in mainCommands ) {
      ru.akman.znotes.Common.goUpdateCommand( cmd );
    }
  };

  function updatePlatformCommands() {
    Common.goUpdateCommand( "znotes_debug_command" );
    Common.goUpdateCommand( "znotes_addons_command" );
    Common.goUpdateCommand( "znotes_update_command" );
    Common.goUpdateCommand( "znotes_showappmenu_command" );
    Common.goUpdateCommand( "znotes_exit_command" );
    Common.goUpdateCommand( "znotes_showmainmenubar_command" );
    Common.goUpdateCommand( "znotes_showmaintoolbar_command" );
    Common.goUpdateCommand( "znotes_customizemaintoolbar_command" );
    Common.goUpdateCommand( "znotes_openoptionsdialog_command" );
    Common.goUpdateCommand( "znotes_openhelp_command" );
    Common.goUpdateCommand( "znotes_openabout_command" );
    Common.goUpdateCommand( "znotes_pagesetup_command" );
  };
  
  function updateBookCommands() {
    Common.goUpdateCommand( "znotes_openbook_command" );
    Common.goUpdateCommand( "znotes_closebook_command" );
    Common.goUpdateCommand( "znotes_appendbook_command" );
    Common.goUpdateCommand( "znotes_deletebook_command" );
    Common.goUpdateCommand( "znotes_deletebookdata_command" );
    Common.goUpdateCommand( "znotes_editbook_command" );
    Common.goUpdateCommand( "znotes_renamebook_command" );
    Common.goUpdateCommand( "znotes_refreshbooktree_command" );
    Common.goUpdateCommand( "znotes_showfilterbar_command" );
  };
  
  function updateCategoryCommands() {
    Common.goUpdateCommand( "znotes_refreshfoldertree_command" );
    Common.goUpdateCommand( "znotes_newcategory_command" );
    Common.goUpdateCommand( "znotes_deletecategory_command" );
    Common.goUpdateCommand( "znotes_renamecategory_command" );
  };
  
  function updateTagCommands() {
    Common.goUpdateCommand( "znotes_refreshtagtree_command" );
    Common.goUpdateCommand( "znotes_newtag_command" );
    Common.goUpdateCommand( "znotes_deletetag_command" );
    Common.goUpdateCommand( "znotes_renametag_command" );
    Common.goUpdateCommand( "znotes_colortag_command" );
  };

  function updateNoteCommands() {
    Common.goUpdateCommand( "znotes_newnote_command" );
    Common.goUpdateCommand( "znotes_importnote_command" );
    Common.goUpdateCommand( "znotes_deletenote_command" );
    Common.goUpdateCommand( "znotes_renamenote_command" );
    Common.goUpdateCommand( "znotes_processnote_command" );
    Common.goUpdateCommand( "znotes_updatenote_command" );
    Common.goUpdateCommand( "znotes_refreshnotetree_command" );
  };

  function updateEditCommands() {
    Common.goUpdateCommand( "znotes_undo_command" );
    Common.goUpdateCommand( "znotes_redo_command" );
    Common.goUpdateCommand( "znotes_cut_command" );
    Common.goUpdateCommand( "znotes_copy_command" );
    Common.goUpdateCommand( "znotes_paste_command" );
    Common.goUpdateCommand( "znotes_delete_command" );
    Common.goUpdateCommand( "znotes_selectall_command" );
  };
  
  // znotes_exit_command
  function doExit() {
    if ( !close() ) {
      return true;
    }
    // This is necessary for correct session saving
    var appStartupSvc =
      Components.classes["@mozilla.org/toolkit/app-startup;1"]
                .getService( Components.interfaces.nsIAppStartup );
    /*
      eConsiderQuit 0x01  Attempt to quit if all windows are closed.
      eAttemptQuit  0x02  Try to close all windows, then quit if successful.
      eForceQuit    0x03  Force all windows to close, then quit.
      eRestart      0x10  Restart the application after quitting.
                          The application will be restarted with the same
                          profile and an empty command line.
    */
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
        Utils.log( e );
      }
      if ( settings ) {
        settings.isCancelled = false;
      }
      printingPromptService.showPageSetup( window, settings, null );
      if ( gSavePrintSettings ) {
        printSettingsService.savePrintSettingsToPrefs( settings, true, settings.kInitSaveNativeData );
      }
    } catch (e) {
      Utils.log( e );
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
      "checked", Utils.IS_MAINMENUBAR_VISIBLE );
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
      "checked", Utils.IS_MAINTOOLBAR_VISIBLE );
  };

  function doShowMainToolbar() {
    prefsBundle.setBoolPref( "isMainToolbarVisible", !Utils.IS_MAINTOOLBAR_VISIBLE );
    return true;
  };

  // znotes_customizemaintoolbar_command
  function doCustomizeMainToolbar() {
    window.openDialog(
      "chrome://global/content/customizeToolbar.xul",
      "",
      "chrome,all,dependent",
      document.getElementById( "znotes_maintoolbox" )
    ).focus();
    return true;
  };

  // znotes_openoptionsdialog_command
  function doOpenOptionsDialog() {
    window.openDialog(
      "chrome://znotes/content/options.xul",
      "_blank",
      "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes"
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
  
  // znotes_debug_command
  function doOpenDebugWindow() {
    var windowService = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                                  .getService( Components.interfaces.nsIWindowWatcher );
    var windowMediator = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                                   .getService( Components.interfaces.nsIWindowMediator );
    var win = windowMediator.getMostRecentWindow( "znotes:debug" );
    /*
    var win = windowService.getWindowByName( "znotes:debug", null );
    */
    if ( win ) {
      windowService.activeWindow = win;
    } else {
      win = window.open(
        "chrome://znotes/content/debug.xul",
        "znotes:debug",
        "chrome,dialog=no,modal=no,resizable=yes,centerscreen"
      );
      win.arguments = [
        getDebugContext()
      ];
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
      "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
      params
    ).focus();
    if ( params.output ) {
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

  // znotes_newnote_command

  function updateNewNoteMenuPopup() {
    while ( newNoteButtonMenuPopup.firstChild ) {
      newNoteButtonMenuPopup.removeChild( newNoteButtonMenuPopup.firstChild );
    }
    var docs = ru.akman.znotes.DocumentManager.getDocuments();
    for ( var name in docs ) {
      var doc = docs[name];
      var menuItem = document.createElement( "menuitem" );
      menuItem.className = "menuitem-iconic";
      menuItem.setAttribute( "id",
        "newNoteButtonMenuPopup_" + doc.getName() );
      menuItem.setAttribute( "label", " " + doc.getDescription() );
      menuItem.setAttribute( "tooltiptext", doc.getName() +
        "-" + doc.getVersion() + " : " + doc.getType() );
      menuItem.style.setProperty( "list-style-image",
        "url( '" + doc.getIconURL() + "' )" , "important" );
      menuItem.addEventListener( "command", updateSelectedPopupItem, false );
      newNoteButtonMenuPopup.appendChild( menuItem );
    }
  };
  
  function doNewNote() {
    var id = selectedPopupItem ? selectedPopupItem.getAttribute( "id" ) : "";
    selectedPopupItem = null;
    var docType = Utils.DEFAULT_DOCUMENT_TYPE;
    if ( id.indexOf( "newNoteButtonMenuPopup_" ) == 0 ) {
      var doc = ru.akman.znotes.DocumentManager.getDocumentByName(
        // document name starts from position 23 of id
        // newNoteButtonMenuPopup_XXXXXXXXX
        // 012345678901234567890123
        id.substr( 23 )
      );
      if ( doc ) {
        docType = doc.getType();
      }
    }
    var category = currentCategory;
    if ( currentBook.getSelectedTree() == "Tags" ) {
      category = currentBook.getContentTree().getRoot();
    }
    var name = getString( "main.note.newName" );
    var index = 1;
    var suffix = "";
    while ( category.noteExists( name + suffix ) ) {
      index++;
      suffix = " (" + index + ")";
    }
    var newNote = createNote( currentBook, category, name + suffix, docType );
    var aRow = notesList.indexOf( newNote );
    noteTreeBoxObject.ensureRowIsVisible( aRow );
    noteTree.view.selection.select( aRow );
    noteTree.setAttribute( "editable", "true" );
    noteTree.startEditing( aRow, noteTree.columns.getNamedColumn( "noteTreeName" ) );
    return true;
  };

  // znotes_importnote_command
  
  function updateImportNoteMenuPopup() {
    while ( importNoteButtonMenuPopup.firstChild ) {
      importNoteButtonMenuPopup.removeChild(
        importNoteButtonMenuPopup.firstChild );
    }
    var docs = ru.akman.znotes.DocumentManager.getDocuments();
    for ( var name in docs ) {
      var doc = docs[name];
      var menuItem = document.createElement( "menuitem" );
      menuItem.className = "menuitem-iconic";
      menuItem.setAttribute( "id", "importNoteButtonMenuPopup_" +
        doc.getName() );
      menuItem.setAttribute( "label", " " + doc.getDescription() );
      menuItem.setAttribute( "tooltiptext", doc.getName() +
        "-" + doc.getVersion() + " : " + doc.getType() );
      menuItem.style.setProperty( "list-style-image",
        "url( '" + doc.getIconURL() + "' )" , "important" );
      menuItem.addEventListener( "command", updateSelectedPopupItem, false );
      importNoteButtonMenuPopup.appendChild( menuItem );
    }
  };
  
  function doImportNote() {
    var id = selectedPopupItem ? selectedPopupItem.getAttribute( "id" ) : "";
    selectedPopupItem = null;
    var docType = Utils.DEFAULT_DOCUMENT_TYPE;
    if ( id.indexOf( "importNoteButtonMenuPopup_" ) == 0 ) {
      var doc = ru.akman.znotes.DocumentManager.getDocumentByName(
        // document name starts from position 26
        // importNoteButtonMenuPopup_XXXXXXXXX
        // 012345678901234567890123456
        id.substr( 26 )
      );
      if ( doc ) {
        docType = doc.getType();
      }
    }
    var params = {
      input: {
        title: getString( "main.note.import.title" ),
        caption: " " + getString( "main.note.import.caption" ) + " ",
        value: "http://"
      },
      output: null
    };
    window.openDialog(
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
    var category = currentCategory;
    if ( currentBook.getSelectedTree() == "Tags" )
      category = currentBook.getContentTree().getRoot();
    var name = getString( "main.note.import.name" );
    var index = 1;
    var suffix = "";
    while ( category.noteExists( name + suffix ) ) {
      index++;
      suffix = " (" + index + ")";
    }
    var aNote = createNote( currentBook, category, name + suffix, docType );
    aNote.load( url );
    var aRow = notesList.indexOf( aNote );
    noteTreeBoxObject.ensureRowIsVisible( aRow );
    noteTree.view.selection.select( aRow );
    return true;
  };

  // znotes_deletenote_command
  function doDeleteNote() {
    var params = {
      input: {
        title: getString( "main.note.confirmDelete.title" ),
        message1: getFormattedString(
          "main.note.confirmDelete.message1", [ currentNote.name ] ),
        message2: getString( "main.note.confirmDelete.message2" )
      },
      output: null
    };
    window.openDialog(
      "chrome://znotes/content/confirmdialog.xul",
      "",
      "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
      params
    ).focus();
    if ( params.output ) {
      currentNote.remove();
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
    var defaultDriver = ru.akman.znotes.DriverManager.getDefaultDriver();
    var params = {
      input: {
        name: getString( "main.book.newName" ),
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
    var newBook = createBook( params.output.name );
    newBook.setDescription( params.output.description );
    newBook.setDriver( params.output.driver );
    newBook.setConnection( params.output.connection );
    var aRow = booksList.indexOf( newBook );
    bookTreeBoxObject.ensureRowIsVisible( aRow );
    bookTree.view.selection.select( aRow );
    return true;
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
      "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
      params
    ).focus();
    if ( params.output ) {
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
      "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
      params
    ).focus();
    if ( params.output ) {
      deleteBookData( currentBook );
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
    if ( currentBook && !currentBook.isOpen() ) {
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
    while ( currentCategory.categoryExists( name + suffix ) ) {
      index++;
      suffix = " (" + index + ")";
    }
    var newCategory = createCategory( currentCategory, name + suffix );
    currentCategory.setOpenState( true );
    var aRow = getFolderTreeRow( newCategory );
    folderTreeBoxObject.ensureRowIsVisible( aRow );
    folderTree.view.selection.select( aRow );
    folderTree.setAttribute( "editable", "true" );
    folderTree.startEditing( aRow,
      folderTree.columns.getNamedColumn( "folderTreeName" ) );
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
        message2: getString( "main.category.confirmDelete.message2" )
      },
      output: null
    };
    window.openDialog(
      "chrome://znotes/content/confirmdialog.xul",
      "",
      "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
      params
    ).focus();
    if ( params.output ) {
      deleteCategory( currentCategory );
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

  // znotes_togglecategorystate_command ( not command )
  function doToggleCategoryState() {
    if ( currentCategory ) {
      toggleCategoryState( currentCategory );
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
    window.focus();
    body.updateStyle( { iconsize: mainToolBar.getAttribute( "iconsize" ) } );
    updateCommands();
    updateQuickFilterState();
    return true;
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
    if ( anItem.nodeName != "treeitem" ||
         anItem.getAttribute( "container" ) != "true" ||
         anItem.getAttribute( "open" ) != "true" ) {
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
      if ( aCategory == null ) {
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
    treeRow.setAttribute( "properties", "folderrow" );
    treeCell = document.createElement( "treecell" );
    treeCell.setAttribute( "label", "" + aCategory.getName() );
    treeCell.setAttribute( "properties", "folder" );
    treeRow.appendChild( treeCell );
    treeCell = document.createElement( "treecell" );
    treeCell.setAttribute( "label", "" + aCategory.getNotesCount() );
    treeRow.appendChild( treeCell );
    treeItem.appendChild( treeRow );
    treeItem.setAttribute( "container", aCategory.hasCategories() ? "true" : "false" );
    treeItem.setAttribute( "open", aCategory.isOpen() ? "true" : "false" );
    treeChildren = document.createElement( "treechildren" );
    treeItem.appendChild( treeChildren );
    return treeItem;
  };

  function updateFolderTreeItem( aCategory ) {
    var treeChildren = null;
    var treeRow = null;
    var treeCell = null;
    var treeItem = getFolderTreeItem( aCategory );
    if ( treeItem ) {
      treeRow = treeItem.firstChild;
      treeCell = treeRow.childNodes[ folderTree.columns.getNamedColumn( "folderTreeName" ).index ];
      treeCell.setAttribute( "label", "" + aCategory.getName() );
      treeCell = treeRow.childNodes[ folderTree.columns.getNamedColumn( "folderTreeCount" ).index ];
      treeCell.setAttribute( "label", "" + aCategory.getNotesCount() );
      treeItem.setAttribute( "open", "false" );
      treeItem.setAttribute( "container", "false" );
      //
      folderTree.removeEventListener( "select", onFolderSelect, false );
      treeChildren = treeItem.lastChild;
      while ( treeChildren.firstChild ) {
        treeChildren.removeChild( treeChildren.firstChild );
      }
      var categories = aCategory.getCategories();
      for ( var i = 0; i < categories.length; i++ ) {
        createFolderTreeChildren( categories[i], treeChildren );
      }
      folderTree.addEventListener( "select", onFolderSelect, false );
      //
      treeItem.setAttribute( "container", aCategory.hasCategories() ? "true" : "false" );
      treeItem.setAttribute( "open", aCategory.isOpen() ? "true" : "false" );
    }
  };

  function toggleCategoryState( aCategory ) {
    aCategory.setOpenState( !aCategory.isOpen() );
  };
  
  function createCategory( aRoot, aName ) {
    return aRoot.createCategory( aName );
  };

  function renameCategory( aCategory, aNewName ) {
    try {
      aCategory.rename( aNewName );
    } catch ( e ) {
      Utils.log( e );
      openErrorDialog(
        getFormattedString( "main.errordialog.category", [ aCategory.getName() ] ),
        e.message
      );
      throw e;
    }
    return aCategory;
  };

  function deleteCategory( aCategory ) {
    var aParent = aCategory.getParent();
    aParent.deleteCategory( aCategory );
    var aRow = null;
    if ( aParent.hasCategories() ) {
      var anIndex = aCategory.getIndex();
      if ( anIndex > aParent.getCategoriesCount() - 1 ) {
        anIndex--;
      }
      aRow = getFolderTreeRow( aParent.getCategoryByIndex( anIndex ) );
    } else {
      aRow = getFolderTreeRow( aParent );
    }
    folderTree.view.selection.select( aRow );
    return aCategory;
  };

  function categoryMoveTo( aRow ) {
    var anIndex = null;
    var aTargetInfo = getFolderTreeItemAndCategoryAtRowIndex( aRow );
    if ( aTargetInfo.category == null ) {
      anIndex = currentCategory.getParent().getCategoriesCount() - 1;
    } else {
      if ( aTargetInfo.category.getParent() != currentCategory.getParent() ) {
        anIndex = currentCategory.getParent().getCategoriesCount() - 1;
      } else {
        anIndex = aTargetInfo.category.getIndex();
        if ( anIndex > currentCategory.getIndex() ) {
          anIndex--;
        }
      }
    }
    currentCategory.moveTo( anIndex );
    var aSelectionRow = getFolderTreeRow( currentCategory );
    folderTree.removeEventListener( "select", onFolderSelect, false );
    folderTree.view.selection.select( aSelectionRow );
    folderTree.addEventListener( "select", onFolderSelect, false );
  };

  function categoryMoveInto( aRow ) {
    var aNewParent = getFolderTreeItemAndCategoryAtRowIndex( aRow ).category;
    try {
      currentCategory.moveInto( aNewParent );
      while ( !aNewParent.isRoot() ) {
        aNewParent.setOpenState( true );
        aNewParent = aNewParent.getParent();
      }
      var aSelectionRow = getFolderTreeRow( currentCategory );
      folderTree.removeEventListener( "select", onFolderSelect, false );
      folderTree.view.selection.select( aSelectionRow );
      folderTree.addEventListener( "select", onFolderSelect, false );
    } catch ( e ) {
      Utils.log( e );
      openErrorDialog(
        getFormattedString( "main.errordialog.category", [ currentCategory.getName() ] ),
        e.message
      );
      throw e;
    }
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
  
  function onFolderSelect( event ) {
    if ( isDragDropActive ) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
    var category = null;
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
      return true;
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
  
  function onFolderDblClick( event ) {
    var aRow = folderTreeBoxObject.getRowAt( event.clientX, event.clientY );
    if ( event.button != "0" || anEditCategory != null ||
         aRow < 0 || aRow > folderTree.view.rowCount - 1 ) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    doToggleCategoryState();
    return true;
  };

  function onFolderContextMenu( event ) {
    var aRow = folderTreeBoxObject.getRowAt( event.clientX, event.clientY );
    if ( folderTree.view.rowCount > 0 && ( aRow < 0 || aRow > folderTree.view.rowCount - 1 ) ) {
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
            folderTreeTextBox.setSelectionRange( 0, 0 );
            break;
          case event.DOM_VK_END :
            var textLength = folderTreeTextBox.textLength;
            if ( textLength > 0 ) {
              folderTreeTextBox.setSelectionRange( textLength, textLength );
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
    if ( currentCategory == null )
      return;
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
    if ( infoDragDrop.folderTreeRowCount != folderTree.view.rowCount ) {
      getDragDropInfo();
    }
    if ( aRow > folderTree.view.rowCount - 1 ) {
      aRow = -1;
    }
    var isDisabled = (
      ( currentBook && currentBook.getSelectedTree() == "Tags" ) ||
      ( !isNote && !isCategory ) ||
      ( isNote && dropEffect != "move" ) ||
      ( isCategory && dropEffect != "copy" && dropEffect != "move" ) ||
      ( isCategory && dropEffect == "move" &&
        aRow == -1 &&
        infoDragDrop.rowOfCategoryParent + infoDragDrop.depthOfCategoryParent - ( folderTreeSeparatorRow == null ? 0 : 1 ) <= folderTree.view.rowCount - ( folderTreeSeparatorRow == null ? 0 : 1 ) - 1 &&
        infoDragDrop.rowOfCategoryParent + infoDragDrop.depthOfCategoryParent - ( folderTreeSeparatorRow == null ? 0 : 1 ) == infoDragDrop.rowOfCategory + infoDragDrop.depthOfCategory
      ) ||
      ( isCategory && dropEffect == "move" &&
        aRow >= infoDragDrop.rowOfCategory - ( folderTreeSeparatorRow == null ? 0 : 1 ) &&
        aRow <= infoDragDrop.rowOfCategory + infoDragDrop.depthOfCategory + 1
      ) ||
      ( isCategory && dropEffect == "move" &&
        aRow != -1 &&
        aRow != infoDragDrop.rowOfCategoryParent + infoDragDrop.depthOfCategoryParent + 1 &&
        infoDragDrop.rowOfCategoryParent != folderTree.view.getParentIndex( aRow )
      ) ||
      ( isCategory && dropEffect == "copy" &&
        aRow == -1
      ) ||
      ( isCategory && dropEffect == "copy" &&
        aRow >= infoDragDrop.rowOfCategory &&
        aRow <= infoDragDrop.rowOfCategory + infoDragDrop.depthOfCategory
      ) ||
      ( isCategory && dropEffect == "copy" &&
        aRow == infoDragDrop.rowOfCategoryParent
      ) ||
      ( isNote && ( aRow == -1 || aRow == infoDragDrop.rowOfNoteParent ) )
    );
    switch ( event.type ) {
      case "dragstart" :
        if ( currentCategory.isRoot() ) {
          return;
        }
        getDragDropInfo();
        folderTree.removeEventListener( "select", onFolderSelect, false );
        isDragDropActive = true;
        event.dataTransfer.setData( "znotes/x-category", "CATEGORY" );
        return;
      case "dragenter" :
      case "drag" :
        event.stopPropagation();
        event.preventDefault();
        return;
      case "dragleave" :
        clearFolderTreeDragMarkers();
        event.stopPropagation();
        event.preventDefault();
        return;
      case "dragover" :
        if ( isDisabled ) {
          clearFolderTreeDragMarkers();
          event.dataTransfer.dropEffect = "none";
          return;
        }
        event.stopPropagation();
        event.preventDefault();
        if ( isCategory ) {
          if ( dropEffect == "move" ) {
            if ( aRow == folderTreeSeparatorRow ) {
              return;
            }
            clearFolderTreeDragMarkers();
            showFolderTreeSeparator( aRow );
          }
          if ( dropEffect == "copy" ) {
            if ( aRow == folderTreeDropRow )
              return;
            clearFolderTreeDragMarkers();
            showFolderTreeDropRow( aRow );
          }
        }
        if ( isNote ) {
          if ( aRow == folderTreeDropRow )
            return;
          clearFolderTreeDropRow();
          showFolderTreeDropRow( aRow );
        }
        return;
      case "drop" :
        if ( isDisabled ) {
          event.dataTransfer.dropEffect = "none";
          return;
        }
        event.stopPropagation();
        event.preventDefault();
        if ( isCategory && event.dataTransfer.getData( "znotes/x-category" ) == "CATEGORY" ) {
          infoDragDrop.row = aRow;
          if ( dropEffect == "move" &&
               aRow != -1 &&
               infoDragDrop.rowOfCategoryParent != folderTree.view.getParentIndex( aRow ) )
            infoDragDrop.row = -1;
          infoDragDrop.dropEffect = dropEffect;
          break;
        }
        if ( isNote && event.dataTransfer.getData( "znotes/x-note" ) == "NOTE" ) {
          infoDragDrop.row = aRow;
          infoDragDrop.dropEffect = "copy";
          break;
        }
        clearFolderTreeDragMarkers();
        return;
      case "dragend" :
        clearFolderTreeDragMarkers();
        clearNoteTreeDragMarkers();
        isDragDropActive = false;
        folderTree.addEventListener( "select", onFolderSelect, false );
        if ( dropEffect == "none" ) {
          return;
        }
        switch ( infoDragDrop.dropEffect ) {
          case "move" :
            categoryMoveTo( infoDragDrop.row );
            break;
          case "copy" :
            categoryMoveInto( infoDragDrop.row );
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
            notesList = currentCategory.getNotes();
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
    if ( !currentBook || !currentBook.isOpen() || !aNote || aNote.getBook() != currentBook ) {
      return null;
    }
    //
    var aName = aNote.getName();
    var isLoading = aNote.isLoading();
    var aCategoryName = aNote.getParent().getName();
    var hasAttachments = aNote.hasAttachments();
    var aCreateDateTime = aNote.getCreateDateTime().toLocaleString();
    var anUpdateDateTime = aNote.getUpdateDateTime().toLocaleString();
    //
    var tagList = aNote.getBook().getTagList();
    var aNoTag = tagList.getNoTag();
    var aTagName = aNoTag.getName();
    var aTagColor = aNoTag.getColor();
    var aTagID = aNote.getMainTag();
    if ( aTagID != null ) {
      var aTag = tagList.getTagById( aTagID );
      aTagName = aTag.getName();
      aTagColor = aTag.getColor();
    } else {
      aTagID = "00000000000000000000000000000000";
    }
    //
    var treeItem = null;
    var treeRow = null;
    var treeCell = null;
    treeRow = document.createElement( "treerow" );
    treeCell = document.createElement( "treecell" );
    if ( hasAttachments )
      treeCell.setAttribute( "properties", "attachment" );
    treeRow.appendChild(treeCell);
    treeCell = document.createElement( "treecell" );
    if ( isLoading ) {
      treeCell.setAttribute( "properties", "loading" );
      treeCell.setAttribute( "label", " " + getString( "main.note.loading" ) );
    } else {
    treeCell.setAttribute( "properties", "note" );
      treeCell.setAttribute( "label", aName );
    }
    treeRow.appendChild(treeCell);
    treeCell = document.createElement( "treecell" );
    treeCell.setAttribute( "label", aCategoryName );
    treeRow.appendChild( treeCell );
    treeCell = document.createElement( "treecell" );
    treeCell.setAttribute( "label", aTagName );
    treeCell.setAttribute( "properties", "NOTE_TAG_" + aTagID );
    treeRow.appendChild( treeCell );
    treeCell = document.createElement( "treecell" );
    treeCell.setAttribute( "label", aCreateDateTime );
    treeRow.appendChild( treeCell );
    treeCell = document.createElement( "treecell" );
    treeCell.setAttribute( "label", anUpdateDateTime );
    treeRow.appendChild( treeCell );
    treeItem = document.createElement( "treeitem" );
    treeItem.appendChild( treeRow );
    return treeItem;
  };

  function updateNoteTreeItem( aNote ) {
    if ( !currentBook || !currentBook.isOpen() || !aNote || aNote.getBook() != currentBook ) {
      return;
    }
    var anItemInfo = getNoteTreeItemAndIndex( aNote );
    var anItem = anItemInfo.item;
    var anIndex = anItemInfo.index;
    if ( anItem ) {
      var treeRow = anItem.firstChild;
      // Attachments
      treeCell = treeRow.childNodes[ noteTree.columns.getNamedColumn( "noteTreeAttachments" ).index ];
      if ( aNote.hasAttachments() ) {
        treeCell.setAttribute( "properties", "attachment" );
      } else {
        if ( treeCell.hasAttribute( "properties" ) )
          treeCell.removeAttribute( "properties" );
      }
      // Name
      var treeCell = treeRow.childNodes[ noteTree.columns.getNamedColumn( "noteTreeName" ).index ];
      var isLoading = aNote.isLoading();
      if ( isLoading ) {
        treeCell.setAttribute( "properties", "loading" );
        treeCell.setAttribute( "label", " " + getString( "main.note.loading" ) );
      } else {
        treeCell.setAttribute( "properties", "note" );
        treeCell.setAttribute( "label", aNote.getName() );
      }
      // Category
      var treeCell = treeRow.childNodes[ noteTree.columns.getNamedColumn( "noteTreeCategory" ).index ];
      treeCell.setAttribute( "label", aNote.getParent().getName() );
      // Tag
      var treeCell = treeRow.childNodes[ noteTree.columns.getNamedColumn( "noteTreeTag" ).index ];
      var id = aNote.getMainTag();
      var tagList = aNote.getBook().getTagList();
      var noTag = tagList.getNoTag();
      var tagName = noTag.getName();
      var tagID = "00000000000000000000000000000000";
      var tag = null;
      if ( id != null ) {
        tag = tagList.getTagById( id );
        tagName = tag.getName();
        tagID = id;
      }
      treeCell.setAttribute( "label", tagName );
      treeCell.setAttribute( "properties", "NOTE_TAG_" + tagID );
      // Update DateTime
      var noteUpdateDateTime = aNote.getUpdateDateTime().toLocaleString();
      treeCell = treeRow.childNodes[ noteTree.columns.getNamedColumn( "noteTreeUpdateDateTime" ).index ];
      treeCell.setAttribute( "label", noteUpdateDateTime );
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

  function createNote( aBook, aRoot, aName, aType ) {
    if ( !aBook || !aBook.isOpen() ) {
      return null;
    }
    var aTagID = null;
    if ( currentBook && currentBook == aBook && currentBook.getSelectedTree() == "Tags" ) {
      aTagID = currentTag.getId();
      if ( aTagID == "00000000000000000000000000000000" ) {
        aTagID = null;
      }
    }
    return aRoot.createNote( aName, aType, aTagID );
  };
  
  function createWelcomeNote( aBook ) {
    var card = null;
    var cards = null;
    var abManager = null;
    var directories = null;
    var directory = null;
    var dir = null;
    var found = null;
    if ( !aBook || !aBook.isOpen() ) {
      return null;
    }
    var contentTree = aBook.getContentTree();
    var aRoot = contentTree.getRoot();
    var name = getString( "main.welcome.notename" );
    var index = 1;
    var suffix = "";
    while ( aRoot.noteExists( name + suffix ) ) {
      index++;
      suffix = " (" + index + ")";
    }
    name = name + suffix;
    var note = createNote( aBook, aRoot, name, "application/xhtml+xml" );
    if ( !Utils.IS_STANDALONE ) {
      abManager = Components.classes["@mozilla.org/abmanager;1"]
                            .getService( Components.interfaces.nsIAbManager );
      directories = abManager.directories;
      while ( directories.hasMoreElements() ) {
        dir = directories.getNext().QueryInterface( Components.interfaces.nsIAbDirectory );
        if ( dir instanceof Components.interfaces.nsIAbDirectory ) {
          directory = dir;
          if ( directory.fileName == "abook.mab" && directory.dirType == 2 ) {
            break;
          }
        }
      }
      if ( directory != null ) {
        var creator = Utils.CREATORS[0];
        var vendor = Utils.VENDOR;
        var firstName = Utils.decodeUTF8(
          creator.name.substring( 0, creator.name.indexOf( " " ) ) );
        var lastName = Utils.decodeUTF8( creator.name.substr(
          creator.name.indexOf( " " ) + 1 ) );
        var primaryEmail = creator.link.substr(
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
    var url = "chrome://znotes_welcome/content/index_" +
      Utils.getSiteLanguage() + ".xhtml";
    note.load( url );
    return note;
  };

  function renameNote( aNote, aNewName ) {
    try {
      aNote.rename( aNewName );
    } catch ( e ) {
      Utils.log( e );
      openErrorDialog(
        getFormattedString( "main.errordialog.note", [ currentNote.getName() ] ),
        e.message
      );
      throw e;
    }
    return aNote;
  };

  function noteMoveTo( aRow ) {
    if ( aRow == noteTree.view.rowCount ) {
      aRow = -1;
    }
    var aCurrentNoteIndex = currentNote.getIndex();
    var aNewNoteIndex = currentNote.getParent().getNotesCount() - 1;
    if ( aRow != -1 ) {
      aNewNoteIndex = aRow;
      if ( aNewNoteIndex > aCurrentNoteIndex ) {
        aNewNoteIndex--;
      }
    }
    currentNote.moveTo( aNewNoteIndex );
    noteTree.removeEventListener( "select", onNoteSelect, false );
    noteTree.view.selection.select( aNewNoteIndex );
    noteTree.addEventListener( "select", onNoteSelect, false );
    saveNotesTreeSelection();
  };

  function noteMoveInto( aRow ) {
    var aNewParent = getFolderTreeItemAndCategoryAtRowIndex( aRow ).category;
    var anOldIndex = currentNote.getIndex();
    var anIndex =  notesList.indexOf( currentNote );
    if ( anIndex == ( notesList.length - 1 ) ) {
      anIndex--;
    }
    try {
      currentNote.moveInto( aNewParent );
      noteTree.view.selection.select( anIndex );
    } catch ( e ) {
      Utils.log( e );
      openErrorDialog(
        getFormattedString( "main.errordialog.note", [ currentNote.getName() ] ),
        e.message
      );
      throw e;
    }
  };

  function getNoteByBookIdAndNoteId( bookId, noteId ) {
    if ( !books ) {
      return null;
    }
    var book = books.getBookById( bookId );
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
        Utils.log( e );
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
    var notes = book.getContentTree().getNoteById( noteId );
    return ( notes.length > 0 ) ? notes[0] : null;
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
      var windowService =
        Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                  .getService( Components.interfaces.nsIWindowWatcher );
      var win = windowService.getWindowByName( windowName, null );
      if ( win ) {
        windowService.activeWindow = win;
        win.focus();        
      } else {
        win = window.open(
          "chrome://znotes/content/viewer.xul?" + windowName,
          windowName,
          "chrome,toolbar,resizable,centerscreen"
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
        win.addEventListener( "load"  , function() {
          windowsList.push( win.name );
          if ( windowsMonitor && "onTabOpened" in windowsMonitor ) {
            windowsMonitor.onTabOpened(
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
        win.addEventListener( "unload"  , function() {
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
          if ( windowsMonitor && "onTabClosing" in windowsMonitor ) {
            windowsMonitor.onTabClosing( tab );
          }
        }, false );
        if ( aBackground ) {
          setTimeout(
            function() {
              windowService.activeWindow = window;
              window.focus();
            },
            0
          );
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
    if ( isDragDropActive ) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
    var note = noteTree.currentIndex >= 0 ?
      notesList[noteTree.currentIndex] : null;
    if ( currentNote && currentNote == note ) {
      event.stopPropagation();
      event.preventDefault();
      return true;
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
            noteTreeTextBox.setSelectionRange( 0, 0 );
            break;
          case event.DOM_VK_END :
            var textLength = noteTreeTextBox.textLength;
            if ( textLength > 0 ) {
              noteTreeTextBox.setSelectionRange( textLength, textLength );
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
        if ( oldValue != newValue ) {
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
    if ( aRow > noteTree.view.rowCount - 1 )
      aRow = -1;
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
        noteTree.addEventListener( "select", onNoteSelect, false );
        if ( dropEffect != "none" ) {
          switch ( infoDragDrop.dropEffect ) {
            case "move" :
              noteMoveTo( infoDragDrop.row );
              break;
            case "copy" :
              noteMoveInto( infoDragDrop.row );
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
    if ( isDragDropActive ) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
    var tag = null;
    if ( tagTree.currentIndex >= 0 ) {
      tag = tagsList[tagTree.currentIndex];
    }
    if ( currentBook &&
         currentBook.getSelectedTree() == "Tags" &&
         currentTag &&
         currentTag == tag ) {
      event.stopPropagation();
      event.preventDefault();
      return true;
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
            tagTreeTextBox.setSelectionRange( 0, 0 );
            break;
          case event.DOM_VK_END :
            var textLength = tagTreeTextBox.textLength;
            if ( textLength > 0 ) {
              tagTreeTextBox.setSelectionRange( textLength, textLength );
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
            Utils.log( e );
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
    var currentIndex = currentTag.getIndex();
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
        tagTree.addEventListener( "select", onTagSelect, false );
        if ( dropEffect == "none" ) {
          return;
        }
        switch ( infoDragDrop.dropEffect ) {
          case "move" :
            tagMoveTo( infoDragDrop.row );
            break;
        }
        return;
    }
  };

  //
  // BOOK
  //

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
  
  function loadBooks() {
    books = new ru.akman.znotes.core.BookList();
    books.load();
    var bookList = books.getBooksAsArray();
    var book = null;
    var tagList = null;
    var contentTree = null;
    for ( var i = 0; i < bookList.length; i++ ) {
      book = bookList[i];
      if ( book.isOpen() ) {
        tagList = book.getTagList();
        tagList.getNoTag().setName( getString( "main.notag.name" ) );
        tagList.addStateListener( tagListStateListener );
        contentTree = book.getContentTree();
        contentTree.addStateListener( contentTreeStateListener );
      }
    }
    books.addStateListener( booksStateListener );
    if ( books.hasBooks() || !Utils.IS_FIRST_RUN ) {
      return;
    }
    try {
      var defaultBook = books.createBook();
      if ( defaultBook ) {
        defaultBook.createData();
        if ( defaultBook.open() == 0 ) {
          welcomeNote = createWelcomeNote( defaultBook );
          if ( welcomeNote && !Utils.IS_STANDALONE ) {
            var data = welcomeNote.getData();
            data.isAddonsVisible = true;
            welcomeNote.setData();
          }
        }
      }
    } catch ( e ) {
      Utils.log( e );
    }
  };
  
  function createBooksList() {
    if ( booksList ) {
      booksList.splice( 0, booksList.length );
    }
    loadBooks();
    booksList = books ? books.getBooksAsArray() : [];
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
    if ( book == null || bookTree.view.rowCount == 0 ) {
      return;
    }
    var index = booksList.indexOf( book );
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

  function createBook( aName ) {
    return books.createBook( aName );
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
    try {
      result = aBook.open();
    } catch ( e ) {
       message = e.message;
    }
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
      "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
      params
    ).focus();
    result = 0;
    if ( params.output ) {
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
    if ( !aBook.isOpen() ) {
      return;
    }
    aBook.close();
  };

  function deleteBook( aBook ) {
    if ( aBook.isOpen() ) {
      aBook.close();
    }
    var anIndex = booksList.indexOf( aBook );
    if ( anIndex == booksList.length - 1 ) {
      anIndex--;
    }
    books.deleteBook( aBook );
    bookTree.view.selection.select( anIndex );
    return aBook;
  };

  function deleteBookData( aBook ) {
    if ( aBook.isOpen() ) {
      aBook.close();
    }
    var anIndex = booksList.indexOf( aBook );
    if ( anIndex == booksList.length - 1 ) {
      anIndex--;
    }
    books.deleteBookWithAllData( aBook );
    bookTree.view.selection.select( anIndex );
    return aBook;
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
    if ( params.output.name != params.input.name ) {
      aBook.setName( params.output.name );
    }
    if ( params.output.description != params.input.description ) {
      aBook.setDescription( params.output.description );
    }
    if ( params.output.driver != params.input.driver ) {
      aBook.setDriver( params.output.driver );
    }
    if ( Utils.compareObjects( params.output.connection, params.input.connection ) ) {
      aBook.setConnection( params.output.connection );
    }
  };

  function bookMoveTo( aRow ) {
    if ( aRow > bookTree.view.rowCount - 1 ) {
      aRow = -1;
    }
    var anIndex = aRow;
    if ( anIndex == -1 ) {
      anIndex = books.getCount() - 1;
    } else {
      if ( anIndex > currentBook.getIndex() ) {
        anIndex--;
      }
    }
    books.moveBook( currentBook, anIndex );
    bookTree.removeEventListener( "select", onBookSelect, false );
    bookTree.view.selection.select( anIndex );
    bookTree.addEventListener( "select", onBookSelect, false );
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
    if ( isDragDropActive ) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
    var book = bookTree.currentIndex >= 0 ?
      booksList[bookTree.currentIndex] : null;
    if ( currentBook && currentBook == book ) {
      event.stopPropagation();
      event.preventDefault();
      return true;
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
            bookTreeTextBox.setSelectionRange( 0, 0 );
            break;
          case event.DOM_VK_END :
            var textLength = bookTreeTextBox.textLength;
            if ( textLength > 0 ) {
              bookTreeTextBox.setSelectionRange( textLength, textLength );
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
            var book = books.getBookById( treeItem.getAttribute( "value" ) );
            renameBook( book, newValue );
          } catch ( e ) {
            Utils.log( e );
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
    var currentIndex = currentBook.getIndex();
    var isDisabled = (
      ( !isBook ) ||
      ( dropEffect != "move" ) ||
      ( aRow == currentIndex ) ||
      ( aRow == currentIndex + 1 ) ||
      ( aRow == -1 && currentIndex == books.getCount() - 1 )
    );
    switch ( event.type ) {
      case "dragstart" :
        bookTree.removeEventListener( "select", onBookSelect, false );
        isDragDropActive = true;
        event.dataTransfer.setData("znotes/x-book", "BOOK" );
        return;
      case "dragenter" :
      case "drag" :
        event.stopPropagation();
        event.preventDefault();
        return;
      case "dragleave" :
        clearBookTreeDragMarkers();
        event.stopPropagation();
        event.preventDefault();
        return;
      case "dragover" :
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
      case "drop" :
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
      case "dragend" :
        clearBookTreeDragMarkers();
        isDragDropActive = false;
        bookTree.addEventListener( "select", onBookSelect, false );
        if ( dropEffect == "none" ) {
          return;
        }
        switch ( infoDragDrop.dropEffect ) {
          case "move" :
            bookMoveTo( infoDragDrop.row );
            break;
        }
        return;
    }
  };

  //
  // CONTENTTREE STATE LISTENER
  //

  function onCategoryChanged( e ) {
    var aCategory = e.data.parentCategory;
    var aChangedCategory = e.data.changedCategory;
    var aBook = aCategory.getBook();
    if ( !currentBook || currentBook != aBook ) {
      return;
    }
    updateFolderTreeItem( aChangedCategory );
    var aNotesList = aChangedCategory.getNotes();
    for ( var i = 0; i < aNotesList.length; i++ ) {
      updateNoteTreeItem( aNotesList[i] );
    }
  };

  function onCategoryAppended( e ) {
    var aCategory = e.data.parentCategory;
    var anAppendedCategory = e.data.appendedCategory;
    var aBook = aCategory.getBook();
    if ( !currentBook || currentBook != aBook ) {
      return;
    }
    var arr = anAppendedCategory.getCategoryWithSubcategoriesAsArray();
    var index = categoriesList.indexOf( aCategory ) + ( aCategory.depth() - arr.length ) + 1;
    for ( var i = 0; i < arr.length; i++ ) {
      categoriesList.splice( index++, 0, arr[i] );
    }
    updateFolderTreeItem( aCategory );
  };

  function onCategoryInserted( e ) {
    var aCategory = e.data.parentCategory;
    var anInsertedCategory = e.data.insertedCategory;
    var anIndex = e.data.insertedIndex;
    var aBook = aCategory.getBook();
    if ( !currentBook || currentBook != aBook ) {
      return;
    }
    var index = categoriesList.indexOf( aCategory );
    for ( var i = 0; i < anIndex; i++ ) {
      index += 1 + aCategory.categories[i].depth();
    }
    index += 1;
    var arr = anInsertedCategory.getCategoryWithSubcategoriesAsArray();
    for ( var i = 0; i < arr.length; i++ ) {
      categoriesList.splice( index++, 0, arr[i] );
    }
    updateFolderTreeItem( aCategory );
  };

  function onCategoryRemoved( e ) {
    var aCategory = e.data.parentCategory;
    var aRemovedCategory = e.data.removedCategory;
    var aBook = aCategory.getBook();
    if ( !currentBook || currentBook != aBook ) {
      return;
    }
    categoriesList.splice( categoriesList.indexOf( aRemovedCategory ), aRemovedCategory.depth() + 1 );
    updateFolderTreeItem( aCategory );
  };

  function onNoteAppended( e ) {
    var aCategory = e.data.parentCategory;
    var anAppendedNote = e.data.appendedNote;
    var aBook = aCategory.getBook();
    if ( !currentBook || currentBook != aBook ) {
      return;
    }
    var aRow = null;
    var aTreeItem = null;
    updateFolderTreeItem( aCategory );
    switch ( currentBook.getSelectedTree() ) {
      case "Tags":
        var aCurrentTagID = currentTag.getId();
        var anAppendedNoteIDs = anAppendedNote.getTags();
        if ( currentTag.isNoTag() ) {
          if ( anAppendedNoteIDs.length > 0 ) {
            return;
          }
        } else {
          if ( anAppendedNoteIDs.indexOf( aCurrentTagID ) < 0 ) {
            return;
          }
        }
        if ( notesList.indexOf( anAppendedNote ) < 0 ) {
          notesList.push( anAppendedNote );
          aRow = notesList.length - 1;
          aTreeItem = createNoteTreeItem( anAppendedNote );
          noteTree.removeEventListener( "select", onNoteSelect, false );
          noteTreeChildren.appendChild( aTreeItem );
          noteTree.addEventListener( "select", onNoteSelect, false );
        }
        break;
      case "Categories":
        if ( currentCategory != aCategory ) {
          return;
        }
        if ( notesList.indexOf( anAppendedNote ) < 0 ) {
          aRow = anAppendedNote.getIndex();
          notesList.splice( aRow, 0, anAppendedNote );
          aTreeItem = createNoteTreeItem( anAppendedNote );
          noteTree.removeEventListener( "select", onNoteSelect, false );
          if ( aRow == notesList.length - 1 ) {
            noteTreeChildren.appendChild( aTreeItem );
          } else {
            noteTreeChildren.insertBefore( aTreeItem, noteTree.view.getItemAtIndex( aRow ) );
          }
          noteTree.addEventListener( "select", onNoteSelect, false );
        }
        break;
    }
  };

  function onNoteInserted( e ) {
    e.data.appendedNote = e.data.insertedNote;
    onNoteAppended( e );
  };

  function onNoteRemoved( e ) {
    var aCategory = e.data.parentCategory;
    var aRemovedNote = e.data.removedNote;
    var aBook = aCategory.getBook();
    if ( !currentBook || currentBook != aBook ) {
      return;
    }
    var aRow = null;
    var aTreeItem = null;
    var anItemInfo = null;
    var aTreeIndex = null;
    updateFolderTreeItem( aCategory );
    switch ( currentBook.getSelectedTree() ) {
      case "Tags":
        var aCurrentTagID = currentTag.getId();
        var aRemovedNoteIDs = aRemovedNote.getTags();
        if ( currentTag.isNoTag() ) {
          if ( aRemovedNoteIDs.length > 0 ) {
            return;
          }
        } else {
          if ( aRemovedNoteIDs.indexOf( aCurrentTagID ) < 0 ) {
            return;
          }
        }
        break;
      case "Categories":
        if ( currentCategory != aCategory ) {
          return;
        }
        break;
    }
    anItemInfo = getNoteTreeItemAndIndex( aRemovedNote );
    aTreeItem = anItemInfo.item;
    aTreeIndex = anItemInfo.index;
    if ( aTreeItem ) {
      notesList.splice( aTreeIndex, 1 );
      if ( aTreeIndex == ( noteTree.view.rowCount - 1 ) ) {
        aTreeIndex--;
      }
      noteTree.removeEventListener( "select", onNoteSelect, false );
      aTreeItem.parentNode.removeChild( aTreeItem );
      noteTree.addEventListener( "select", onNoteSelect, false );
      if ( !currentNote.isExists() && currentNote == aRemovedNote ) {
        noteTree.view.selection.select( aTreeIndex );
      }
    }
  };

  function onNoteTagsChanged( e ) {
    var aCategory = e.data.parentCategory;
    var aNote = e.data.changedNote;
    var oldTags = e.data.oldValue;
    var newTags = e.data.newValue;
    var aBook = aCategory.getBook();
    if ( !currentBook || currentBook != aBook ) {
      return;
    }
    switch ( currentBook.getSelectedTree() ) {
      case "Categories":
        return;
      case "Tags":
        var aCurrentTagID = currentTag.getId();
        var aNoteIDs = aNote.getTags();
        var isNoteMustBeInNotesList = true;
        if ( currentTag.isNoTag() ) {
          if ( aNoteIDs.length > 0 ) {
            isNoteMustBeInNotesList = false;
          }
        } else {
          if ( aNoteIDs.indexOf( aCurrentTagID ) < 0 ) {
            isNoteMustBeInNotesList = false;
          }
        }
        var anItemInfo = null;
        var anIndex = null;
        var anItem = null;
        var aRow = null;
        if ( isNoteMustBeInNotesList ) {
          if ( currentNote == aNote ) {
            return;
          }
          notesList.push( aNote );
          noteTree.removeEventListener( "select", onNoteSelect, false );
          noteTreeChildren.appendChild( createNoteTreeItem( aNote ) );
          noteTree.addEventListener( "select", onNoteSelect, false );
          if ( noteTree.view.rowCount == 1 ) {
            noteTree.view.selection.select( 0 );
          }
        } else {
          anItemInfo = getNoteTreeItemAndIndex( aNote );
          anItem = anItemInfo.item;
          anIndex = anItemInfo.index;
          if ( anItem ) {
            notesList.splice( anIndex, 1 );
            if ( anIndex == ( noteTree.view.rowCount - 1 ) ) {
              anIndex--;
            }
            noteTree.removeEventListener( "select", onNoteSelect, false );
            anItem.parentNode.removeChild( anItem );
            noteTree.addEventListener( "select", onNoteSelect, false );
            if ( currentNote == aNote ) {
              noteTree.view.selection.select( anIndex );
            }
          }
        }
        break;
    }
  };

  function onNoteLoadingChanged( e ) {
    var aCategory = e.data.parentCategory;
    var aNote = e.data.changedNote;
    var oldLoading = e.data.oldValue;
    var newLoading = e.data.newValue;
    var aBook = aCategory.getBook();
    if ( !currentBook || currentBook != aBook ) {
      return;
    }
    updateNoteTreeItem( aNote );
    if ( currentNote && currentNote == aNote && !currentNote.isLoading() ) {
      currentNoteChanged( true );
    }
  };

  function onNoteStatusChanged( e ) {
    var aCategory = e.data.parentCategory;
    var aNote = e.data.changedNote;
    var oldStatus = e.data.oldValue;
    var newStatus = e.data.newValue;
    if ( welcomeNote && welcomeNote == aNote ) {
      return;
    }
    switch ( newStatus.type ) {
      case "success" :
        Utils.showPopup(
          "chrome://znotes/skin/message-32x32.png",
          getString( "main.note.import.title" ),
          getString( "main.note.loading.success" )
        );
        break;
      case "error" :
        Utils.showPopup(
          "chrome://znotes/skin/warning-32x32.png",
          getString( "main.note.import.title" ),
          newStatus.message
        );
        var params = {
          input: {
            title: getString( "main.note.confirmDelete.title" ),
            message1: getFormattedString( "main.note.confirmDelete.message1", [ aNote.getName() ] ),
            message2: aNote.getOrigin()
          },
          output: null
        };
        window.openDialog(
          "chrome://znotes/content/confirmdialog.xul",
          "",
          "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
          params
        ).focus();
        if ( params.output ) {
          aNote.remove();
        }
        break;
      case "abort" :
        var params = {
          input: {
            title: getString( "main.note.confirmDelete.title" ),
            message1: getFormattedString( "main.note.confirmDelete.message1", [ aNote.getName() ] ),
            message2: aNote.getOrigin()
          },
          output: null
        };
        window.openDialog(
          "chrome://znotes/content/confirmdialog.xul",
          "",
          "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
          params
        ).focus();
        if ( params.output ) {
          aNote.remove();
        }
        break;
    }
  };
  
  function onNoteChanged( e ) {
    var aCategory = e.data.parentCategory;
    var aNote = e.data.changedNote;
    var aBook = aCategory.getBook();
    if ( currentBook && currentBook == aBook ) {
      updateNoteTreeItem( aNote );
    }
  };

  function onNoteMainTagChanged( e ) {
    var aCategory = e.data.parentCategory;
    var aNote = e.data.changedNote;
    var oldTag = e.data.oldValue;
    var newTag = e.data.newValue;
    var aBook = aCategory.getBook();
    if ( !currentBook || currentBook != aBook ) {
      return;
    }
    updateNoteTreeItem( aNote );
  };

  // @@@@ onNoteMainContentChanged() What this do here for? 
  function onNoteMainContentChanged( e ) {
    var aCategory = e.data.parentCategory;
    var aNote = e.data.changedNote;
    var oldContent = e.data.oldValue;
    var newContent = e.data.newValue;
    var aBook = aCategory.getBook();
    if ( !currentBook || currentBook != aBook ) {
      return;
    }
    updateNoteTreeItem( aNote );
  };

  function onNoteContentLoaded( e ) {
    var aCategory = e.data.parentCategory;
    var aNote = e.data.changedNote;
    var aBook = aNote.getBook();
    if ( !currentBook || currentBook != aBook ) {
      return;
    }
    if ( currentNote && currentNote == aNote &&
         !currentNote.isLoading() ) {
      currentNoteChanged( true );
    }
  };

  function onNoteContentAppended( e ) {
    var aCategory = e.data.parentCategory;
    var aNote = e.data.changedNote;
    var aContentInfo = e.data.contentInfo;
    var aBook = aCategory.getBook();
    if ( !currentBook || currentBook != aBook ) {
      return;
    }
  };

  function onNoteContentRemoved( e ) {
    var aCategory = e.data.parentCategory;
    var aNote = e.data.changedNote;
    var aContentInfo = e.data.contentInfo;
    var aBook = aCategory.getBook();
    if ( !currentBook || currentBook != aBook ) {
      return;
    }
  };

  function onNoteAttachmentAppended( e ) {
    var aCategory = e.data.parentCategory;
    var aNote = e.data.changedNote;
    var anAttachmentInfo = e.data.attachmentInfo;
    var aBook = aCategory.getBook();
    if ( !currentBook || currentBook != aBook ) {
      return;
    }
    updateNoteTreeItem( aNote );
  };

  function onNoteAttachmentRemoved( e ) {
    var aCategory = e.data.parentCategory;
    var aNote = e.data.changedNote;
    var anAttachmentInfo = e.data.attachmentInfo;
    var aBook = aCategory.getBook();
    if ( !currentBook || currentBook != aBook ) {
      return;
    }
    updateNoteTreeItem( aNote );
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
    contentTree.addStateListener( contentTreeStateListener );
    updateBookTreeItem( aBook );
    if ( currentBook && currentBook == aBook ) {
      currentBookChanged();
    }
  };

  function onBookClosed( e ) {
    var aBook = e.data.closedBook;
    updateBookTreeItem( aBook );
    if ( currentBook && currentBook == aBook ) {
      currentBookChanged();
    }
  };

  function onBookChanged( e ) {
    var aBook = e.data.changedBook;
    updateBookTreeItem( aBook );
    if ( currentBook && currentBook == aBook ) {
      if ( aBook.isOpen() ) {
        var tagList = aBook.getTagList();
        tagList.getNoTag().setName( getString( "main.notag.name" ) );
        var contentTree = aBook.getContentTree();
        var aRoot = contentTree.getRoot();
        updateFolderTreeItem( aRoot );
      }
    }
  };

  function onBookAppended( e ) {
    var aBook = e.data.appendedBook;
    if ( booksList && booksList.indexOf( aBook ) < 0 ) {
      var aRow = aBook.getIndex();
      booksList.splice( aRow, 0, aBook );
      var aTreeItem = createBookTreeItem( aBook );
      bookTree.removeEventListener( "select", onBookSelect, false );
      if ( aRow == booksList.length - 1 ) {
        bookTreeChildren.appendChild( aTreeItem );
      } else {
        bookTreeChildren.insertBefore( aTreeItem, bookTree.view.getItemAtIndex( aRow ) );
      }
      bookTree.addEventListener( "select", onBookSelect, false );
    }
  };

  function onBookInserted( e ) {
    e.data.appendedBook = e.data.insertedBook;
    onBookAppended( e );
  };

  function onBookRemoved( e ) {
    var aBook = e.data.removedBook;
    var aTreeIndex = booksList.indexOf( aBook );
    var aTreeItem = bookTree.view.getItemAtIndex( aTreeIndex );
    if ( aTreeItem ) {
      booksList.splice( aTreeIndex, 1 );
      bookTree.removeEventListener( "select", onBookSelect, false );
      aTreeItem.parentNode.removeChild( aTreeItem );
      bookTree.addEventListener( "select", onBookSelect, false );
    }
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
    var currentBookIndex = books.hasBooks() ? 0 : -1;
    if ( !prefsBundle.hasPref( "currentBook" ) ) {
      prefsBundle.setIntPref( "currentBook", currentBookIndex );
    } else {
      currentBookIndex = prefsBundle.getIntPref( "currentBook" );
    }
    if ( currentBookIndex < 0 ||
         currentBookIndex > bookTree.view.rowCount - 1 ) {
      currentBookIndex = books.hasBooks() ? 0 : -1;
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
      )
    }
  };

  function restoreCategoriesTreeSelection() {
    if ( !currentBook || !currentBook.isOpen() ) {
      return;
    }
    var currentCategoryIndex = currentBook.getSelectedCategory();
    if ( currentCategoryIndex < 0 ||
         currentCategoryIndex > folderTree.view.rowCount - 1 ) {
      currentCategoryIndex = 0;
    }
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
    if ( currentTagIndex < 0 || currentTagIndex > tagTree.view.rowCount - 1 ) {
      currentTagIndex = 0;
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
    if ( !currentBook && !currentBook.isOpen() ) {
      return;
    }
    var index = -1;
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
            index = index < 0 ? 0 : index;
          }
        }
        break;
      case "Tags":
        if ( noteTree.view.rowCount > 0 ) {
          index = 0;
          if ( Utils.IS_SAVE_POSITION ) {
            index = currentTag.getSelectedIndex();
            index = index < 0 ? 0 : index;
          }
        }
        break;
    }
    if ( index != -1 ) {
      noteTreeBoxObject.ensureRowIsVisible( index );
    }
    noteTree.view.selection.select( index );
  };

  function restoreCurrentBookLayout() {
    if ( currentBook == null ) {
      var defaultPreferences = books.getDefaultPreferences();
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
        currentBook.loadPreference( "folderBoxWidth", "200" ) );
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
        currentBook.loadPreference( "noteBoxWidth", "800" ) );
      noteTreeView.setAttribute( "height",
        currentBook.loadPreference( "noteTreeViewHeight", "250" ) );
      noteTreeSplitter.setAttribute( "state",
        currentBook.loadPreference( "noteTreeSplitterState", "open" ) );
      noteBodyBox.setAttribute( "height",
        currentBook.loadPreference( "noteBodyBoxHeight", "700" ) );
      noteBodyView.setAttribute( "height",
        currentBook.loadPreference( "noteBodyViewHeight", "700" ) );
      qfBox.setAttribute( "collapsed",
        currentBook.loadPreference( "qfBoxCollapsed", "true" ) );
    }
    updateQuickFilterState();
  };

  // SESSIONS

  function getPersistedState() {
    var persistedState = null;
    if ( Utils.IS_STANDALONE ) {
      persistedState = ru.akman.znotes.SessionManager.getPersistedState();
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
    if ( !Utils.IS_STANDALONE ) {
      return;
    }
    // XR only
    platformBundleObserver.register();
    windowsList = [];
    windowsMonitor = ru.akman.znotes.TabMonitor;
  };
  
  function initMain() {
    document.title = getString( "main.window.title" );
    // toolbox
    mainMenuBar = document.getElementById( "znotes_mainmenutoolbar" );
    mainToolBox = document.getElementById( "znotes_maintoolbox" );
    mainToolBar = document.getElementById( "znotes_maintoolbar" );
    mainToolBox.customizeDone = onCustomizeMainToolbarDone;
    // statusbar
    statusBarPanel = Utils.getStatusbarPanel();
    /*
    if ( statusBarPanel.hasAttribute( "hidden" ) ) {
      statusBarPanel.removeAttribute( "hidden" );
    }
    */
    statusBarLogo = statusBarPanel.querySelector(
      "znotes_statusbarpanellogo" );
    statusBarLabel = statusBarPanel.querySelector(
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
    // doctype menupopups
    newNoteButtonMenuPopup = document.getElementById(
      "znotes_newnote_button_menupopup" );
    importNoteButtonMenuPopup = document.getElementById(
      "znotes_importnote_button_menupopup" );
  };
  
  function addEventListeners() {
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
    folderTree.addEventListener( "focus", onFolderFocus, false );
    folderTree.addEventListener( "blur", onFolderBlur, false );
    folderTree.addEventListener( "dblclick", onFolderDblClick, true );
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
    folderTree.removeEventListener( "focus", onFolderFocus, false );
    folderTree.removeEventListener( "blur", onFolderBlur, false );
    folderTree.removeEventListener( "dblclick", onFolderDblClick, true );
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
  
  function addControllers() {
    mainController.register();
  };

  function removeControllers() {
    mainController.unregister();
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
  };
  
  function connectPrefsObservers() {
    prefsBundleObserver.register();
    prefsMozillaObserver.register();
  };
  
  function disconnectPrefsObservers() {
    prefsBundleObserver.unregister();
    prefsMozillaObserver.unregister();
  };
  
  function initBody() {
    body = new ru.akman.znotes.Body(
      {
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
  
  function updateUI() {
    window.focus();
    updateNewNoteMenuPopup();
    updateImportNoteMenuPopup();
    updateMainMenubarVisibility();
    updateMainToolbarVisibility();
    updateCommandsVisibility();
    updatePlatformCommands();
  };
  
  function load() {
    // The order of calling is important !
    initGlobals();
    loadPrefs();
    loadDrivers();
    loadDocuments();
    initMain();
    addControllers();
    addEventListeners();
    connectPrefsObservers();
    connectMutationObservers();
    initBody();
    updateUI();
    //
    refreshBooksList();
    restoreBooksTreeSelection();
    loadPersistedSession();
    if ( Utils.IS_STANDALONE ) {
      updateWindowSizeAndPosition();
    }
    if ( Utils.IS_DEBUG_ACTIVE ) {
      doOpenDebugWindow();
    }
    if ( Utils.IS_PLAY_SOUND ) {
      playSound();
    }
  };

  function unload() {
    doneBody();
    removeControllers();
    removeEventListeners();
    disconnectMutationObservers();
    disconnectPrefsObservers();
  };
  
  function close() {
    var canClose = true;
    //
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
      "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
      params
    ).focus();
    canClose = params.output;
    //
    if ( !canClose ) {
      return false;
    }
    if ( !Utils.IS_STANDALONE ) {
      return canClose;
    }
    windowsMonitor = null;
    var windowService =
      Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                .getService( Components.interfaces.nsIWindowWatcher );
    var win = null;
    // znotes:viewer
    for ( var i = 0; i < windowsList.length; i++ ) {
      win = windowService.getWindowByName( windowsList[i], null );
      if ( win ) {
        win.close();
      }
    }
    // znotes:debug
    win = windowService.getWindowByName( "znotes:debug", null );
    if ( win ) {
      win.close();
    }
    return true;
  };  
  
  // HELPERS
  
  function getString( name ) {
    return Utils.STRINGS_BUNDLE.getString( name );
  };
  
  function getFormattedString( name, values ) {
    return Utils.STRINGS_BUNDLE.getFormattedString( name, values );
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
        title: Utils.STRINGS_BUNDLE.getString( "main.errordialog.title" ),
        message1: message1,
        message2: message2
      },
      output: null
    };
    window.openDialog(
      "chrome://znotes/content/messagedialog.xul",
      "",
      "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
      params
    ).focus();
  }
  
  function getDebugContext() {
    return {
      // window
      win: window,
      // document
      doc: document,
      // objects
      book: currentBook,
      category: currentCategory,
      tag: currentTag,
      note: currentNote,
      // functions
      createWelcomeNote: createWelcomeNote,
      createNote: createNote
    };
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
  
  // PUBLIC

  pub.onLoad = function() {
    load();
  };

  pub.onUnload = function() {
    unload();
  };

  return pub;

}();

window.addEventListener( "load", function() { ru.akman.znotes.Main.onLoad(); }, false );
window.addEventListener( "unload", function() { ru.akman.znotes.Main.onUnload(); }, false );
