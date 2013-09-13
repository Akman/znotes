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

Components.utils.import( "resource://znotes/utils.js"           , ru.akman.znotes );
Components.utils.import( "resource://znotes/drivermanager.js"   , ru.akman.znotes );
Components.utils.import( "resource://znotes/documentmanager.js" , ru.akman.znotes );
Components.utils.import( "resource://znotes/commandmanager.js"  , ru.akman.znotes );
Components.utils.import( "resource://znotes/booklist.js"        , ru.akman.znotes.core );
Components.utils.import( "resource://znotes/event.js"           , ru.akman.znotes.core );
Components.utils.import( "resource://znotes/tabmonitor.js"      , ru.akman.znotes );
Components.utils.import( "resource://znotes/sessionmanager.js"  , ru.akman.znotes );
Components.utils.import( "resource://znotes/prefsmanager.js"    , ru.akman.znotes );
Components.utils.import( "resource://znotes/addonsmanager.js"    , ru.akman.znotes );
Components.utils.import( "resource://znotes/updatemanager.js"    , ru.akman.znotes );

ru.akman.znotes.Main = function() {

  var log = ru.akman.znotes.Utils.log;

  var mainWindow = null;
  var tabMail = null;
  var isStandalone = null;

  var windowsMonitor = null;
  var windowsList = null;
  var currentWindow = null;
  
  var commandManager = null;
  var mainController = null;

  var statusBarPanel = null;
  var statusBarLogo = null;
  var statusBarLabel = null;

  var bShowAppMenu = null;
  var popupAppMenu = null;
  var newNoteButton = null;
  var newNoteButtonMenuPopup = null;
  var importNoteButton = null;
  var importNoteButtonMenuPopup = null;
  
  var mainToolBox = null;
  var mainMenuBar = null;
  var mainToolBar = null;

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

  var mozPrefObserver = null;  
  var prefObserver = null;
  var prefsBundle = null;

  var mutationObservers = null;

  var stringsBundle = null;

  var bookTreeMenu = null;
  var noteTreeMenu = null;
  var tagTreeMenu = null;

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

  // ------------------------------------

  var books = null;

  var booksStateListener = null;
  var contentTreeStateListener = null;
  var tagListStateListener = null;

  var booksList = null;
  var categoriesList = null;
  var tagsList = null;
  var notesList = null;

  var currentBook = null;
  var currentTree = null;
  var currentCategory = null;
  var currentTag = null;
  var currentNote = null;

  var welcomeNote = null;
  
  var body = null;

  // -------------------------------------

  var cmdExit = null;
  var cmdPageSetup = null;
  var cmdPrint = null;
  var cmdShowMainMenubar = null;
  var cmdShowMainToolbar = null;
  var cmdCustomizeMainToolbar = null;
  var cmdOpenOptionsDialog = null;
  var cmdDebug = null;
  var cmdAddons = null;
  var cmdUpdate = null;
  var cmdOpenHelp = null;
  var cmdOpenAbout = null;
  var cmdShowFilterBar = null;
  var cmdShowAppMenu = null;

  var cmdOpenBook = null;
  var cmdCloseBook = null;
  var cmdAppendBook = null;
  var cmdDeleteBook = null;
  var cmdDeleteBookData = null;
  var cmdEditBook = null;
  var cmdRenameBook = null;
  var cmdRefreshBookTree = null;

  var cmdNewCategory = null;
  var cmdDeleteCategory =null;
  var cmdRenameCategory = null;
  var cmdRefreshFolderTree = null;

  var cmdNewNote = null;
  var cmdDeleteNote = null;
  var cmdImportNote = null;
  var cmdRenameNote = null;
  var cmdProcessNote = null;
  var cmdRefreshNoteTree = null;
  var cmdUpdateNote = null;

  var cmdNewTag = null;
  var cmdDeleteTag = null;
  var cmdRenameTag = null;
  var cmdColorTag = null;
  var cmdRefreshTagTree = null;

  // -------------------------------------
  
  var oldValue = null;
  var newValue = null;

  var selectedPopupItem = null;
  
  var anEditCategory = null;
  var anEditNote = null;
  var anEditTagIndex = null;
  var anEditBookIndex = null;

  var hiddenFrame = null;

  var debugTextBox = null;

  var pub = {};

  // E R R O R  D I A L O G
  function openErrorDialog( message1, message2 ) {
    var params = {
      input: {
        title: stringsBundle.getString( "main.errordialog.title" ),
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

  //
  // C O M M A N D S
  //

  function initCommandManager() {
    commandManager = ru.akman.znotes.CommandManager;
    commandManager.init( mainWindow );
  };

  function doneCommandManager() {
    commandManager.done();
  };
  
  function initCommandController() {
    mainController = {
      supportsCommand: function( cmd ) {
        //log( "mainController :: supportsCommand() :: " + cmd );
        switch ( cmd ) {
          case "cmd_print" :
            return ( isStandalone || ru.akman.znotes.Utils.isTabActive() );
        }
        return commandManager.supportsCommand( cmd );
      },
      isCommandEnabled: function( cmd ) {
        //log( "mainController :: isCommandEnabled() :: " + cmd );
        switch ( cmd ) {
          case "cmd_print" :
            return ( isStandalone || ru.akman.znotes.Utils.isTabActive() );
        }
        return commandManager.isCommandEnabled( cmd );
      },
      doCommand: function( cmd ) {
        log( "mainController :: doCommand() :: " + cmd );
        switch ( cmd ) {
          case "znotes_pagesetup_command" :
            doPageSetup();
            break;
          case "cmd_print" :
          case "znotes_print_command" :
            doPrint();
            break;
          case "znotes_exit_command" :
            doExit();
            break;
          case "znotes_showmainmenubar_command" :
            doShowMainMenubar();
            break;
          case "znotes_showmaintoolbar_command" :
            doShowMainToolbar();
            break;
          case "znotes_customizemaintoolbar_command" :
            doCustomizeMainToolbar();
            break;
          case "znotes_openoptionsdialog_command" :
            doOpenOptionsDialog();
            break;
          case "znotes_debug_command" :
            doOpenDebugWindow();
            break;
          case "znotes_addons_command" :
            doOpenAddonsManager();
            break;
          case "znotes_update_command" :
            doOpenUpdateManager();
            break;
          case "znotes_openhelp_command" :
            doOpenHelp();
            break;
          case "znotes_openabout_command" :
            doOpenAbout();
            break;
          case "znotes_openbook_command" :
            doOpenBook();
            break;
          case "znotes_closebook_command" :
            doCloseBook();
            break;
          case "znotes_appendbook_command" :
            doAppendBook();
            break;
          case "znotes_deletebook_command" :
            doDeleteBook();
            break;
          case "znotes_deletebookdata_command" :
            doDeleteBookData();
            break;
          case "znotes_editbook_command" :
            doEditBook();
            break;
          case "znotes_renamebook_command" :
            doRenameBook();
            break;
          case "znotes_refreshbooktree_command" :
            doRefreshBookTree();
            break;
          case "znotes_refreshfoldertree_command" :
            doRefreshFolderTree();
            break;
          case "znotes_newcategory_command" :
            doNewCategory();
            break;
          case "znotes_deletecategory_command" :
            doDeleteCategory();
            break;
          case "znotes_renamecategory_command" :
            doRenameCategory();
            break;
          case "znotes_refreshtagtree_command" :
            doRefreshTagTree();
            break;
          case "znotes_newtag_command" :
            doNewTag();
            break;
          case "znotes_deletetag_command" :
            doDeleteTag();
            break;
          case "znotes_renametag_command" :
            doRenameTag();
            break;
          case "znotes_colortag_command" :
            doColorTag();
            break;
          case "znotes_newnote_command" :
            doNewNote();
            break;
          case "znotes_importnote_command" :
            doImportNote();
            break;
          case "znotes_deletenote_command" :
            doDeleteNote();
            break;
          case "znotes_renamenote_command" :
            doRenameNote();
            break;
          case "znotes_processnote_command" :
            doProcessNote();
            break;
          case "znotes_updatenote_command" :
            doUpdateNote();
            break;
          case "znotes_refreshnotetree_command" :
            doRefreshNoteTree();
            break;
          case "znotes_showfilterbar_command" :
            doToggleFilterBar();
            break;
          case "znotes_showappmenu_command" :
            doShowAppMenu();
            break;
          default:
            log( "mainController :: doCommand() :: WAS NOT FOUND DEFAULT HANDLER" );
        }
      },
      onEvent: function( event ) {
      }
    };
    try {
      mainWindow.controllers.insertControllerAt( 0, mainController );
      commandManager.updateCommands();
    } catch ( e ) {
      log( e );
    }
  };
  
  function doneCommandController() {
    if ( !mainController ) {
      return;
    }
    try {
      mainWindow.controllers.removeController( mainController );
      mainController = null;
    } catch ( e ) {
      log( e );
    }
  };
  
  function initCommands() {
    cmdPrint = commandManager.getCommand( "znotes_print_command" );
    cmdPageSetup = commandManager.getCommand( "znotes_pagesetup_command" );
    cmdExit = commandManager.getCommand( "znotes_exit_command" );
    cmdShowMainMenubar = commandManager.getCommand( "znotes_showmainmenubar_command" );
    cmdShowMainToolbar = commandManager.getCommand( "znotes_showmaintoolbar_command" );
    cmdCustomizeMainToolbar = commandManager.getCommand( "znotes_customizemaintoolbar_command" );
    cmdOpenOptionsDialog = commandManager.getCommand( "znotes_openoptionsdialog_command" );
    cmdDebug = commandManager.getCommand( "znotes_debug_command" );
    cmdAddons = commandManager.getCommand( "znotes_addons_command" );
    cmdUpdate = commandManager.getCommand( "znotes_update_command" );
    cmdOpenHelp = commandManager.getCommand( "znotes_openhelp_command" );
    cmdOpenAbout = commandManager.getCommand( "znotes_openabout_command" );
    cmdShowAppMenu = commandManager.getCommand( "znotes_showappmenu_command" );
    cmdShowFilterBar = commandManager.getCommand( "znotes_showfilterbar_command" );
    cmdAppendBook = commandManager.getCommand( "znotes_appendbook_command" );
    cmdDeleteBook = commandManager.getCommand( "znotes_deletebook_command" );
    cmdDeleteBookData = commandManager.getCommand( "znotes_deletebookdata_command" );
    cmdEditBook = commandManager.getCommand( "znotes_editbook_command" );
    cmdOpenBook = commandManager.getCommand( "znotes_openbook_command" );
    cmdCloseBook = commandManager.getCommand( "znotes_closebook_command" );
    cmdRenameBook = commandManager.getCommand( "znotes_renamebook_command" );
    cmdRefreshBookTree = commandManager.getCommand( "znotes_refreshbooktree_command" );
    cmdRefreshFolderTree = commandManager.getCommand( "znotes_refreshfoldertree_command" );
    cmdNewCategory = commandManager.getCommand( "znotes_newcategory_command" );
    cmdDeleteCategory = commandManager.getCommand( "znotes_deletecategory_command" );
    cmdRenameCategory = commandManager.getCommand( "znotes_renamecategory_command" );
    cmdNewNote = commandManager.getCommand( "znotes_newnote_command" );
    cmdDeleteNote = commandManager.getCommand( "znotes_deletenote_command" );
    cmdImportNote = commandManager.getCommand( "znotes_importnote_command" );
    cmdRenameNote = commandManager.getCommand( "znotes_renamenote_command" );
    cmdProcessNote = commandManager.getCommand( "znotes_processnote_command" );
    cmdRefreshNoteTree = commandManager.getCommand( "znotes_refreshnotetree_command" );
    cmdUpdateNote = commandManager.getCommand( "znotes_updatenote_command" );
    cmdNewTag = commandManager.getCommand( "znotes_newtag_command" );
    cmdDeleteTag = commandManager.getCommand( "znotes_deletetag_command" );
    cmdRenameTag = commandManager.getCommand( "znotes_renametag_command" );
    cmdColorTag = commandManager.getCommand( "znotes_colortag_command" );
    cmdRefreshTagTree = commandManager.getCommand( "znotes_refreshtagtree_command" );
  };

  function disableCommands() {
    cmdPageSetup.setAttribute( "disabled", "true" );
    cmdPrint.setAttribute( "disabled", "true" );
    cmdExit.setAttribute( "disabled", "true" );
    cmdShowMainMenubar.setAttribute( "disabled", "true" );
    cmdShowMainToolbar.setAttribute( "disabled", "true" );
    cmdCustomizeMainToolbar.setAttribute( "disabled", "true" );
    cmdOpenOptionsDialog.setAttribute( "disabled", "true" );
    cmdDebug.setAttribute( "disabled", "true" );
    cmdAddons.setAttribute( "disabled", "true" );
    cmdUpdate.setAttribute( "disabled", "true" );
    cmdOpenHelp.setAttribute( "disabled", "true" );
    cmdOpenAbout.setAttribute( "disabled", "true" );
    cmdShowAppMenu.setAttribute( "disabled", "true" );
    cmdShowFilterBar.setAttribute( "disabled", "true" );
    cmdOpenBook.setAttribute( "disabled", "true" );
    cmdCloseBook.setAttribute( "disabled", "true" );
    cmdAppendBook.setAttribute( "disabled", "true" );
    cmdDeleteBook.setAttribute( "disabled", "true" );
    cmdDeleteBookData.setAttribute( "disabled", "true" );
    cmdEditBook.setAttribute( "disabled", "true" );
    cmdRenameBook.setAttribute( "disabled", "true" );
    cmdRefreshBookTree.setAttribute( "disabled", "true" );
    cmdNewCategory.setAttribute( "disabled", "true" );
    cmdDeleteCategory.setAttribute( "disabled", "true" );
    cmdRenameCategory.setAttribute( "disabled", "true" );
    cmdRefreshFolderTree.setAttribute( "disabled", "true" );
    cmdNewNote.setAttribute( "disabled", "true" );
    cmdDeleteNote.setAttribute( "disabled", "true" );
    cmdImportNote.setAttribute( "disabled", "true" );
    cmdRenameNote.setAttribute( "disabled", "true" );
    cmdProcessNote.setAttribute( "disabled", "true" );
    cmdRefreshNoteTree.setAttribute( "disabled", "true" );
    cmdUpdateNote.setAttribute( "disabled", "true" );
    cmdNewTag.setAttribute( "disabled", "true" );
    cmdDeleteTag.setAttribute( "disabled", "true" );
    cmdRenameTag.setAttribute( "disabled", "true" );
    cmdColorTag.setAttribute( "disabled", "true" );
    cmdRefreshTagTree.setAttribute( "disabled", "true" );
  };
  
  //
  
  function updateSelectedPopupItem( event ) {
    selectedPopupItem = event.target;
  };
  
  function updateNewNoteMenuPopup() {
    newNoteButton = mainWindow.document.getElementById( "znotes_newnote_button" );
    if ( !newNoteButton ) {
      return;
    }
    newNoteButtonMenuPopup = mainWindow.document.getElementById( "znotes_newnote_button_menupopup" );
    if ( !newNoteButtonMenuPopup ) {
      newNoteButtonMenuPopup = mainWindow.document.createElement( "menupopup" );
      newNoteButtonMenuPopup.setAttribute( "id", "znotes_newnote_button_menupopup" );
      newNoteButton.appendChild( newNoteButtonMenuPopup );
    } else {
      while ( newNoteButtonMenuPopup.firstChild ) {
        newNoteButtonMenuPopup.removeChild( newNoteButtonMenuPopup.firstChild );
      }
    }
    var docs = ru.akman.znotes.DocumentManager.getDocuments();
    for ( var name in docs ) {
      var doc = docs[name];
      var menuItem = mainWindow.document.createElement( "menuitem" );
      menuItem.className = "menuitem-iconic";
      menuItem.setAttribute( "id", "newNoteButtonMenuPopup_" + doc.getName() );
      menuItem.setAttribute( "label", " " + doc.getDescription() );
      menuItem.setAttribute( "tooltiptext", doc.getName() + "-" + doc.getVersion() + " : " + doc.getType() );
      menuItem.style.setProperty( "list-style-image", "url( '" + doc.getIconURL() + "' )" , "important" );
      menuItem.addEventListener( "command", updateSelectedPopupItem, false );
      newNoteButtonMenuPopup.appendChild( menuItem );
    }
 };
  
  function updateImportNoteMenuPopup() {
    importNoteButton = mainWindow.document.getElementById( "znotes_importnote_button" );
    if ( !importNoteButton ) {
      return;
    }
    importNoteButtonMenuPopup = mainWindow.document.getElementById( "znotes_importnote_button_menupopup" );
    if ( !importNoteButtonMenuPopup ) {
      importNoteButtonMenuPopup = mainWindow.document.createElement( "menupopup" );
      importNoteButtonMenuPopup.setAttribute( "id", "znotes_importnote_button_menupopup" );
      importNoteButton.appendChild( importNoteButtonMenuPopup );
    } else {
      while ( importNoteButtonMenuPopup.firstChild ) {
        importNoteButtonMenuPopup.removeChild( importNoteButtonMenuPopup.firstChild );
      }
    }
    var docs = ru.akman.znotes.DocumentManager.getDocuments();
    for ( var name in docs ) {
      var doc = docs[name];
      var menuItem = mainWindow.document.createElement( "menuitem" );
      menuItem.className = "menuitem-iconic";
      menuItem.setAttribute( "id", "importNoteButtonMenuPopup_" + doc.getName() );
      menuItem.setAttribute( "label", " " + doc.getDescription() );
      menuItem.setAttribute( "tooltiptext", doc.getName() + "-" + doc.getVersion() + " : " + doc.getType() );
      menuItem.style.setProperty( "list-style-image", "url( '" + doc.getIconURL() + "' )" , "important" );
      menuItem.addEventListener( "command", updateSelectedPopupItem, false );
      importNoteButtonMenuPopup.appendChild( menuItem );
    }
  };
  
  function refreshCommandState( aCommand ) {
    var hasAttr = aCommand.hasAttribute( "disabled" );
    aCommand.setAttribute( "disabled", "true" );
    if ( !hasAttr ) {
      aCommand.removeAttribute( "disabled" );
    }
    switch ( aCommand ) {
      case cmdDebug:
        if ( !ru.akman.znotes.Utils.IS_DEBUG_ENABLED ) {
          cmdDebug.setAttribute( "disabled", "true" );
          cmdDebug.setAttribute( "hidden", "true" );
        } else {
          if ( cmdDebug.hasAttribute( "hidden" ) ) {
            cmdDebug.removeAttribute( "hidden" );
          }
          if ( cmdDebug.hasAttribute( "disabled" ) ) {
            cmdDebug.removeAttribute( "disabled" );
          }
        }
        break;
      case cmdAddons:
        cmdAddons.setAttribute( "disabled", "true" );
        /** NOW ALWAYS DISABLED
        if ( !ru.akman.znotes.Utils.IS_STANDALONE ) {
          cmdAddons.setAttribute( "disabled", "true" );
        } else {
          if ( cmdAddons.hasAttribute( "disabled" ) ) {
            cmdAddons.removeAttribute( "disabled" );
          }
        }
        */
        break;
      case cmdUpdate:
        cmdUpdate.setAttribute( "disabled", "true" );
        /** NOW ALWAYS DISABLED 
        if ( !ru.akman.znotes.Utils.IS_STANDALONE ) {
          cmdUpdate.setAttribute( "disabled", "true" );
        } else {
          if ( ru.akman.znotes.UpdateManager.canUpdate() ) {
            cmdUpdate.removeAttribute( "disabled" );
          } else {
            cmdUpdate.setAttribute( "disabled", "true" );
          }
        }
        */
        break;
      case cmdNewNote:
        updateNewNoteMenuPopup();
        break;
      case cmdImportNote:
        updateImportNoteMenuPopup();
      case cmdShowFilterBar:
        var isCollapsed = true;
        if ( !qfBox.hasAttribute( "collapsed" ) ) {
          isCollapsed = false;
        } else {
          if ( qfBox.getAttribute( "collapsed" ) == "false" ) {
            isCollapsed = false;
          }
        }
        if ( isCollapsed ) {
          qfButton.setAttribute( "checked" , "false" );
          qfButton.setAttribute( "checkState" , "0" );
        } else {
          qfButton.setAttribute( "checked" , "true" );
          qfButton.setAttribute( "checkState" , "1" );
        }
        break;
    }
  };

  pub.customizeMainToolbarDone = function( isChanged ) {
    body.updateStyle( { iconsize: mainToolBar.getAttribute( "iconsize" ) } );
    pub.onAppMenuShowing();
  };

  // znotes_exit_command
  function doExit() {
    var appStartupSvc = Components.classes["@mozilla.org/toolkit/app-startup;1"]
                                  .getService(Components.interfaces.nsIAppStartup);
    /*
      eConsiderQuit 0x01  Attempt to quit if all windows are closed.
      eAttemptQuit  0x02  Try to close all windows, then quit if successful.
      eForceQuit    0x03  Force all windows to close, then quit.
      eRestart      0x10  Restart the application after quitting. The application will be restarted with the same profile and an empty command line.
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
        log( e );
      }
      if ( settings ) {
        settings.isCancelled = false;
      }
      printingPromptService.showPageSetup( window, settings, null );
      if ( gSavePrintSettings ) {
        printSettingsService.savePrintSettingsToPrefs( settings, true, settings.kInitSaveNativeData );
      }
    } catch (e) {
      log( e );
      return false;
    }
    return true;
  };

  // znotes_print_command
  function doPrint() {
    body.print();
    return true;
  };

  // znotes_showmainmenubar_command
  function doShowMainMenubar() {
    prefsBundle.setBoolPref( "isMainMenubarVisible", !ru.akman.znotes.Utils.IS_MAINMENUBAR_VISIBLE );
    return true;
  };

  // znotes_showmaintoolbar_command
  function doShowMainToolbar() {
    prefsBundle.setBoolPref( "isMainToolbarVisible", !ru.akman.znotes.Utils.IS_MAINTOOLBAR_VISIBLE );
    return true;
  };

  // znotes_customizemaintoolbar_command
  function doCustomizeMainToolbar() {
    var win = ru.akman.znotes.Utils.MAIN_WINDOW;
    win.openDialog(
      "chrome://global/content/customizeToolbar.xul",
      "",
      "chrome,all,dependent",
      win.document.getElementById( "znotes_maintoolbox" )
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
    var win = windowService.getWindowByName( "znotes:debug", null );
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
    ru.akman.znotes.Utils.openLinkExternally(
      ru.akman.znotes.Utils.SITE + ru.akman.znotes.Utils.getSiteLanguage() + "/documentation.xhtml"
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
      var name = stringsBundle.getString( "main.tag.newName" );
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
        title: stringsBundle.getString( "main.tag.confirmDelete.title" ),
        message1: stringsBundle.getFormattedString( "main.tag.confirmDelete.message1", [ currentTag.getName() ] ),
        message2: stringsBundle.getString( "main.tag.confirmDelete.message2" )
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
        title: stringsBundle.getString( "main.tag.colorselectdialog.title" ),
        message: stringsBundle.getFormattedString( "main.tag.colorselectdialog.message", [ currentTag.getName() ] ),
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
  function doNewNote() {
    var id = selectedPopupItem ? selectedPopupItem.getAttribute( "id" ) : "";
    selectedPopupItem = null;
    var docType = ru.akman.znotes.Utils.DEFAULT_DOCUMENT_TYPE;
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
    if ( currentTree == "Tags" ) {
      category = currentBook.getContentTree().getRoot();
    }
    var name = stringsBundle.getString( "main.note.newName" );
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
  function doImportNote() {
    var id = selectedPopupItem ? selectedPopupItem.getAttribute( "id" ) : "";
    selectedPopupItem = null;
    var docType = ru.akman.znotes.Utils.DEFAULT_DOCUMENT_TYPE;
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
        title: stringsBundle.getString( "main.note.import.title" ),
        caption: " " + stringsBundle.getString( "main.note.import.caption" ) + " ",
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
    if ( currentTree == "Tags" )
      category = currentBook.getContentTree().getRoot();
    var name = stringsBundle.getString( "main.note.import.name" );
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
        title: stringsBundle.getString( "main.note.confirmDelete.title" ),
        message1: stringsBundle.getFormattedString( "main.note.confirmDelete.message1", [ currentNote.name ] ),
        message2: stringsBundle.getString( "main.note.confirmDelete.message2" )
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
    var title = stringsBundle.getString( "utils.openuri.apppicker.title" );
    ru.akman.znotes.Utils.openURI( currentNote.getURI(), true, mainWindow, title );
    return true;
  };

  // znotes_appendbook_command
  function doAppendBook() {
    var defaultDriver = ru.akman.znotes.DriverManager.getDefaultDriver();
    var params = {
      input: {
        name: stringsBundle.getString( "main.book.newName" ),
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
        title: stringsBundle.getString( "main.book.confirmDelete.title" ),
        message1: stringsBundle.getFormattedString( "main.book.confirmDelete.message1", [ currentBook.getName() ] ),
        message2: stringsBundle.getString( "main.book.confirmDelete.message2" )
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
        title: stringsBundle.getString( "main.book.confirmDeleteData.title" ),
        message1: stringsBundle.getFormattedString( "main.book.confirmDeleteData.message1", [ currentBook.getName() ] ),
        message2: stringsBundle.getString( "main.book.confirmDeleteData.message2" )
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
    openBook( currentBook );
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
    var name = stringsBundle.getString( "main.category.newName" );
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
    folderTree.startEditing( aRow, folderTree.columns.getNamedColumn( "folderTreeName" ) );
    return true;
  };

  // znotes_deletecategory_command
  function doDeleteCategory() {
    var params = {
      input: {
        title: stringsBundle.getString( "main.category.confirmDelete.title" ),
        message1: stringsBundle.getFormattedString(
          "main.category.confirmDelete.message1",
          [ currentCategory.name ]
        ),
        message2: stringsBundle.getString( "main.category.confirmDelete.message2" )
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
    refreshNotesList();
    restoreNotesTreeSelection();
    return true;
  };

  // znotes_showfilterbar_command
  function doToggleFilterBar() {
    var isCollapsed = false;
    if ( !qfBox.hasAttribute( "collapsed" ) ) {
      isCollapsed = true;
    } else {
      if ( qfBox.getAttribute( "collapsed" ) == "false" ) {
        isCollapsed = true;
      }
    }
    qfBox.setAttribute( "collapsed", isCollapsed );
    if ( currentBook ) {
      currentBook.savePreference( "qfBoxCollapsed", isCollapsed );
    }
    if ( isCollapsed ) {
      qfButton.setAttribute( "checked" , "false" );
      qfButton.setAttribute( "checkState" , "0" );
    } else {
      qfButton.setAttribute( "checked" , "true" );
      qfButton.setAttribute( "checkState" , "1" );
    }
    return true;
  };

  // znotes_showappmenu_command
  function doShowAppMenu() {
    popupAppMenu.openPopup( bShowAppMenu, "after_end", null, null, false, false, null );
    return true;
  };
  
  //
  // C O M M O N  E V E N T S
  //

  pub.onSplitterDblClick = function( event ) {
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
  
  //
  // A P P L I C A T I O N  M E N U
  //
  
  pub.onAppMenuShowing = function( event ) {
    refreshCommandState( cmdDebug );
    updateDebugButtonState();
    //
    refreshCommandState( cmdAddons );
    refreshCommandState( cmdUpdate );
    updateUpdateAndAddonsButtonsState();    
    //
    refreshCommandState( cmdPageSetup );
    refreshCommandState( cmdPrint );
    refreshCommandState( cmdExit );
    //
    refreshCommandState( cmdShowMainMenubar );
    refreshCommandState( cmdShowMainToolbar );
    refreshCommandState( cmdCustomizeMainToolbar );
    //
    refreshCommandState( cmdOpenOptionsDialog );
    refreshCommandState( cmdOpenHelp );
    refreshCommandState( cmdOpenAbout );
    refreshCommandState( cmdShowFilterBar );
    refreshCommandState( cmdShowAppMenu );
    //
    refreshCommandState( cmdOpenBook );
    refreshCommandState( cmdCloseBook );
    refreshCommandState( cmdAppendBook );
    refreshCommandState( cmdDeleteBook );
    refreshCommandState( cmdDeleteBookData );
    refreshCommandState( cmdEditBook );
    refreshCommandState( cmdRenameBook );
    refreshCommandState( cmdRefreshBookTree );
    //
    refreshCommandState( cmdNewCategory );
    refreshCommandState( cmdDeleteCategory );
    refreshCommandState( cmdRenameCategory );
    refreshCommandState( cmdRefreshFolderTree );
    //
    refreshCommandState( cmdNewNote );
    refreshCommandState( cmdDeleteNote );
    refreshCommandState( cmdImportNote );
    refreshCommandState( cmdRenameNote );
    refreshCommandState( cmdProcessNote );
    refreshCommandState( cmdRefreshNoteTree );
    refreshCommandState( cmdUpdateNote );
    //
    refreshCommandState( cmdNewTag );
    refreshCommandState( cmdDeleteTag );
    refreshCommandState( cmdRenameTag );
    refreshCommandState( cmdColorTag );
    refreshCommandState( cmdRefreshTagTree );
  };
  
  //
  // F O L D E R  T R E E
  //

  /*
  function getFolderTreeItem( aCategory )
  function getFolderTreeItemAtItemIndex( anItemIndex )
  function getFolderTreeItemAndCategoryAtRowIndex( aRowIndex )
  function getFolderTreeItemRowDepth( anItem )
  function getFolderTreeRow( aCategory )
  */

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

  //
  // C A T E G O R I E S
  //

  function enableCategoriesList() {
    folderTree.removeAttribute( "disabled" );
    cmdNewCategory.removeAttribute( "disabled" );
    cmdDeleteCategory.removeAttribute( "disabled" );
    cmdRenameCategory.removeAttribute( "disabled" );
    cmdRefreshFolderTree.removeAttribute( "disabled" );
  };

  function disableCategoriesList() {
    folderTree.setAttribute( "disabled", "true" );
    cmdNewCategory.setAttribute( "disabled", "true" );
    cmdDeleteCategory.setAttribute( "disabled", "true" );
    cmdRenameCategory.setAttribute( "disabled", "true" );
    cmdRefreshFolderTree.setAttribute( "disabled", "true" );
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
    folderTree.removeEventListener( "select", pub.onFolderSelect, false );
    while ( folderTreeChildren.firstChild ) {
      folderTreeChildren.removeChild( folderTreeChildren.firstChild );
    }
    if ( categoriesList && categoriesList[0] ) {
      createFolderTreeChildren( categoriesList[0], folderTreeChildren );
      enableCategoriesList();
    } else {
      disableCategoriesList();
    }
    folderTree.addEventListener( "select", pub.onFolderSelect, false );
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
      folderTree.removeEventListener( "select", pub.onFolderSelect, false );
      treeChildren = treeItem.lastChild;
      while ( treeChildren.firstChild ) {
        treeChildren.removeChild( treeChildren.firstChild );
      }
      var categories = aCategory.getCategories();
      for ( var i = 0; i < categories.length; i++ ) {
        createFolderTreeChildren( categories[i], treeChildren );
      }
      folderTree.addEventListener( "select", pub.onFolderSelect, false );
      //
      treeItem.setAttribute( "container", aCategory.hasCategories() ? "true" : "false" );
      treeItem.setAttribute( "open", aCategory.isOpen() ? "true" : "false" );
    }
  };

  function createCategory( aRoot, aName ) {
    return aRoot.createCategory( aName );
  };

  function renameCategory( aCategory, aNewName ) {
    try {
      aCategory.rename( aNewName );
    } catch ( e ) {
      log( e );
      openErrorDialog(
        stringsBundle.getFormattedString( "main.errordialog.category", [ aCategory.getName() ] ),
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
    folderTree.removeEventListener( "select", pub.onFolderSelect, false );
    folderTree.view.selection.select( aSelectionRow );
    folderTree.addEventListener( "select", pub.onFolderSelect, false );
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
      folderTree.removeEventListener( "select", pub.onFolderSelect, false );
      folderTree.view.selection.select( aSelectionRow );
      folderTree.addEventListener( "select", pub.onFolderSelect, false );
    } catch ( e ) {
      log( e );
      openErrorDialog(
        stringsBundle.getFormattedString( "main.errordialog.category", [ currentCategory.getName() ] ),
        e.message
      );
      throw e;
    }
  };

  // C A T E G O R I E S  T R E E  E V E N T S

  pub.onFolderClick = function( event ) {
    event.preventDefault();
    event.stopPropagation();
    folderTree.removeEventListener( "select", pub.onFolderSelect, false );
    restoreCategoriesTreeSelection();
    folderTree.addEventListener( "select", pub.onFolderSelect, false );
    if ( event.button != "2" ) {
      return false;
    }
    folderTreeMenu.openPopupAtScreen(
      event.clientX + window.mozInnerScreenX + 2,
      event.clientY + window.mozInnerScreenY + 2,
      false
    );
    return true;
  };

  pub.onFolderDblClick = function( event ) {
    event.preventDefault();
    event.stopPropagation();
    if ( event.button != "0" || anEditCategory != null ) {
      return false;
    }
    var aRow = folderTreeBoxObject.getRowAt( event.clientX, event.clientY );
    if ( aRow >= 0 && aRow <= folderTree.view.rowCount - 1 ) {
      var anInfo = getFolderTreeItemAndCategoryAtRowIndex( aRow );
      var aCategory = anInfo.category;
      if ( aCategory ) {
        aCategory.setOpenState( !aCategory.isOpen() );
      }
    }
    return true;
  };

  pub.onFolderSelect = function( event ) {
    if ( isDragDropActive ) {
      event.stopPropagation();
      event.preventDefault();
      return;
    }
    var category = null;
    if ( folderTree.currentIndex >= 0 ) {
      category = getFolderTreeItemAndCategoryAtRowIndex( folderTree.currentIndex ).category;
    }
    if ( currentTree && currentTree == "Categories" && currentCategory && currentCategory == category ) {
      event.stopPropagation();
      event.preventDefault();
      return;
    }
    tagTree.removeEventListener( "select", pub.onTagSelect, false );
    tagTree.view.selection.select( -1 );
    tagTree.addEventListener( "select", pub.onTagSelect, false );
    selectTree( "Categories" );
    currentBook.savePreference( "currentTree", currentTree );
    currentCategory = category;
    currentCategoryChanged();
    if ( currentCategory ) {
      refreshNotesList();
      restoreNotesTreeSelection();
    }
  };

  pub.onFolderTreeTextBoxEvent = function( event ) {
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

  // Drag & Drop

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

  pub.onFolderDragDrop = function( event ) {
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
      ( currentTree == "Tags" ) ||
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
        folderTree.removeEventListener( "select", pub.onFolderSelect, false );
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
        folderTree.addEventListener( "select", pub.onFolderSelect, false );
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
  // N O T E S
  //

  function updateNoteCommands() {
    if ( currentBook && currentBook.isOpen() && currentNote ) {
      if ( !currentNote.isLoading() ) {
        cmdDeleteNote.removeAttribute( "disabled" );
        cmdProcessNote.removeAttribute( "disabled" );
        cmdRenameNote.removeAttribute( "disabled" );
        cmdUpdateNote.removeAttribute( "disabled" );
        cmdPrint.removeAttribute( "disabled" );
      } else {
        cmdDeleteNote.setAttribute( "disabled", "true" );
        cmdProcessNote.setAttribute( "disabled", "true" );
        cmdRenameNote.setAttribute( "disabled", "true" );
        cmdUpdateNote.setAttribute( "disabled", "true" );
        cmdPrint.setAttribute( "disabled", "true" );
      }
    } else {
      cmdDeleteNote.setAttribute( "disabled", "true" );
      cmdProcessNote.setAttribute( "disabled", "true" );
      cmdRenameNote.setAttribute( "disabled", "true" );
      cmdUpdateNote.setAttribute( "disabled", "true" );
      cmdPrint.setAttribute( "disabled", "true" );
    }
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
        if ( currentTree == "Categories" ) {
          notesList = currentCategory.getNotes();
        } else if ( currentTree == "Tags" ) {
          notesList = contentTree.getNotesByTag( currentTag.getId() );
        }
      } else {
        notesList = null;
      }
    } else {
      notesList = null;
    }
  };

  function enableNotesList() {
    noteTree.removeAttribute( "disabled" );
    cmdNewNote.removeAttribute( "disabled" );
    cmdImportNote.removeAttribute( "disabled" );
    cmdDeleteNote.removeAttribute( "disabled" );
    cmdProcessNote.removeAttribute( "disabled" );
    cmdPrint.removeAttribute( "disabled" );
    cmdRenameNote.removeAttribute( "disabled" );
    cmdRefreshNoteTree.removeAttribute( "disabled" );
  };

  function disableNotesList() {
    noteTree.setAttribute( "disabled", "true" );
    cmdNewNote.setAttribute( "disabled", "true" );
    cmdImportNote.setAttribute( "disabled", "true" );
    cmdDeleteNote.setAttribute( "disabled", "true" );
    cmdProcessNote.setAttribute( "disabled", "true" );
    cmdPrint.setAttribute( "disabled", "true" );
    cmdRenameNote.setAttribute( "disabled", "true" );
    cmdRefreshNoteTree.setAttribute( "disabled", "true" );
  };

  function showNotesList() {
    noteTree.removeEventListener( "select", pub.onNoteSelect, false );
    while ( noteTreeChildren.firstChild ) {
      noteTreeChildren.removeChild( noteTreeChildren.firstChild );
    }
    if ( notesList ) {
      for ( var i = 0; i < notesList.length; i++ ) {
        noteTreeChildren.appendChild( createNoteTreeItem( notesList[i] ) );
      }
    }
    noteTree.addEventListener( "select", pub.onNoteSelect, false );
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
      treeCell.setAttribute( "label", " " + stringsBundle.getString( "main.note.loading" ) );
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
        treeCell.setAttribute( "label", " " + stringsBundle.getString( "main.note.loading" ) );
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
    if ( currentBook && currentBook == aBook && currentTree == "Tags" ) {
      aTagID = currentTag.getId();
      if ( aTagID == "00000000000000000000000000000000" ) {
        aTagID = null;
      }
    }
    return aRoot.createNote( aName, aType, aTagID );
  };

  function renameNote( aNote, aNewName ) {
    try {
      aNote.rename( aNewName );
    } catch ( e ) {
      log( e );
      openErrorDialog(
        stringsBundle.getFormattedString( "main.errordialog.note", [ currentNote.getName() ] ),
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
    noteTree.removeEventListener( "select", pub.onNoteSelect, false );
    noteTree.view.selection.select( aNewNoteIndex );
    noteTree.addEventListener( "select", pub.onNoteSelect, false );
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
      log( e );
      openErrorDialog(
        stringsBundle.getFormattedString( "main.errordialog.note", [ currentNote.getName() ] ),
        e.message
      );
      throw e;
    }
  };

  // N O T E S  T R E E  E V E N T S

  pub.onNoteClick = function( event ) {
    event.preventDefault();
    event.stopPropagation();
    if ( event.button != "2" ) {
      return false;
    }
    updateNoteCommands();
    noteTreeMenu.openPopupAtScreen(
      event.clientX + window.mozInnerScreenX + 2,
      event.clientY + window.mozInnerScreenY + 2,
      false
    );
    return true;
  };

  pub.onNoteSelect = function( event ) {
    if ( isDragDropActive ) {
      event.stopPropagation();
      event.preventDefault();
      return;
    }
    var note = null;
    if ( noteTree.currentIndex >= 0 ) {
      note = notesList[noteTree.currentIndex];
    }
    if ( currentNote && currentNote == note ) {
      event.stopPropagation();
      event.preventDefault();
      return;
    }
    currentNote = note;
    currentNoteChanged();
  };

  pub.onNoteDblClick = function( event ) {
    event.stopPropagation();
    event.preventDefault();
    if ( event.button != "0" || anEditNote != null ) {
      return false;
    }
    if ( isDragDropActive || noteTree.currentIndex < 0 || currentNote == null ) {
      return false;
    }
    showNoteWindow( currentNote, false );
    return true;
  };

  pub.onNoteTreeTextBoxEvent = function( event ) {
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

  // Drag & Drop

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

  pub.onNoteDragDrop = function( event ) {
    var dropEffect = event.dataTransfer.dropEffect;
    var isNote = event.dataTransfer.types.contains("znotes/x-note");
    var aRow = noteTreeBoxObject.getRowAt( event.clientX, event.clientY );
    if ( aRow > noteTree.view.rowCount - 1 )
      aRow = -1;
    var isDisabled = (
      ( currentNote == null ) ||
      ( currentTree == "Tags" ) ||
      ( !isNote ) ||
      ( dropEffect != "move" ) ||
      ( aRow == currentNote.getIndex() ) ||
      ( aRow == currentNote.getIndex() + 1 ) ||
      ( aRow == -1 && currentNote.getIndex() == currentCategory.notes.length - 1 )
    );
    switch ( event.type ) {
      case "dragstart" :
        noteTree.removeEventListener( "select", pub.onNoteSelect, false );
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
        noteTree.addEventListener( "select", pub.onNoteSelect, false );
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
  // T A G S
  //

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

  function enableTagsList() {
    tagTree.removeAttribute( "disabled" );
    cmdNewTag.removeAttribute( "disabled" );
    cmdDeleteTag.removeAttribute( "disabled" );
    cmdRenameTag.removeAttribute( "disabled" );
    cmdColorTag.removeAttribute( "disabled" );
    cmdRefreshTagTree.removeAttribute( "disabled" );
  };

  function disableTagsList() {
    tagTree.setAttribute( "disabled", "true" );
    cmdNewTag.setAttribute( "disabled", "true" );
    cmdDeleteTag.setAttribute( "disabled", "true" );
    cmdRenameTag.setAttribute( "disabled", "true" );
    cmdColorTag.setAttribute( "disabled", "true" );
    cmdRefreshTagTree.setAttribute( "disabled", "true" );
  };

  function showTagsList() {
    tagTree.removeEventListener( "select", pub.onTagSelect, false );
    while ( tagTreeChildren.firstChild ) {
      tagTreeChildren.removeChild( tagTreeChildren.firstChild );
    }
    if ( tagsList ) {
      for ( var i = 0; i < tagsList.length; i++ ) {
        tagTreeChildren.appendChild( createTagTreeItem( tagsList[i] ) );
      }
    }
    tagTree.addEventListener( "select", pub.onTagSelect, false );
    if ( tagsList ) {
      enableTagsList();
    } else {
      disableTagsList();
    }
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
    ru.akman.znotes.Utils.addCSSRule(
      document,
      "treechildren::-moz-tree-cell(TAG_" + id + ")",
      "background-color: " + color + ";border: 1px solid;"
    );
    ru.akman.znotes.Utils.addCSSRule(
      document,
      "treechildren::-moz-tree-image(NOTE_TAG_" + id + ")",
      "list-style-image: url('" + ru.akman.znotes.Utils.makeTagImage( color, true, 16 ) + "');"
    );
    ru.akman.znotes.Utils.addCSSRule(
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
    treeCell.setAttribute( "properties", "TAG_" + id );
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
      ru.akman.znotes.Utils.changeCSSRule(
        document,
        "treechildren::-moz-tree-cell(TAG_" + id + ")",
        "background-color: " + color + ";border: 1px solid;"
      );
      ru.akman.znotes.Utils.changeCSSRule(
        document,
        "treechildren::-moz-tree-image(NOTE_TAG_" + id + ")",
        "list-style-image: url('" + ru.akman.znotes.Utils.makeTagImage( color, true, 16 ) + "');"
      );
      ru.akman.znotes.Utils.changeCSSRule(
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
    tagTree.removeEventListener( "select", pub.onTagSelect, false );
    tagTree.view.selection.select( aNewTagIndex );
    tagTree.addEventListener( "select", pub.onTagSelect, false );
  };

  // T A G S  T R E E  E V E N T S

  pub.onTagClick = function( event ) {
    event.preventDefault();
    event.stopPropagation();
    tagTree.removeEventListener( "select", pub.onTagSelect, false );
    restoreTagsTreeSelection();
    tagTree.addEventListener( "select", pub.onTagSelect, false );
    if ( event.button != "2" ) {
      return false;
    }
    tagTreeMenu.openPopupAtScreen(
      event.clientX + window.mozInnerScreenX + 2,
      event.clientY + window.mozInnerScreenY + 2,
      false
    );
    return true;
  };

  pub.onTagDblClick = function( event ) {
    event.stopPropagation();
    event.preventDefault();
    if ( event.button != "0" || anEditTagIndex != null ) {
      return false;
    }
    if ( isDragDropActive || tagTree.currentIndex < 0 || currentTag == null ) {
      return false;
    }
    /*
    var aRow = tagTreeBoxObject.getRowAt( event.clientX, event.clientY );
    if ( aRow == -1 || aRow > tagTree.view.rowCount - 1 ) {
      return;
    }
    */
    doColorTag();
    return true;
  };

  pub.onTagSelect = function( event ) {
    if ( isDragDropActive ) {
      event.stopPropagation();
      event.preventDefault();
      return;
    }
    var tag = null;
    if ( tagTree.currentIndex >= 0 ) {
      tag = tagsList[tagTree.currentIndex];
    }
    if ( currentTree && currentTree == "Tags" && currentTag && currentTag == tag ) {
      event.stopPropagation();
      event.preventDefault();
      return;
    }
    folderTree.removeEventListener( "select", pub.onFolderSelect, false );
    folderTree.view.selection.select( -1 );
    folderTree.addEventListener( "select", pub.onFolderSelect, false );
    selectTree( "Tags" );
    currentBook.savePreference( "currentTree", currentTree );
    currentTag = tag;
    currentTagChanged();
    if ( currentTag ) {
      refreshNotesList();
      restoreNotesTreeSelection();
    }
  };

  pub.onTagTreeTextBoxEvent = function( event ) {
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
            log( e );
            tagTree.view.setCellText( aRow, aColumn, oldValue );
          }
        }
        anEditTagIndex = null;
        tagTree.setAttribute( "editable", "false" );
        break;
    }
  };

  // Drag & Drop

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

  pub.onTagDragDrop = function( event ) {
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
        tagTree.removeEventListener( "select", pub.onTagSelect, false );
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
        tagTree.addEventListener( "select", pub.onTagSelect, false );
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
  // B O O K S
  //

  function createBooksList() {
    if ( booksList ) {
      booksList.splice( 0, booksList.length );
    }
    if ( books ) {
      booksList = books.getBooksAsArray();
    } else {
      booksList = [];
    }
  };

  function showBooksList() {
    bookTree.removeEventListener( "select", pub.onBookSelect, false );
    while ( bookTreeChildren.firstChild ) {
      bookTreeChildren.removeChild( bookTreeChildren.firstChild );
    }
    for ( var i = 0; i < booksList.length; i++ ) {
      bookTreeChildren.appendChild( createBookTreeItem( booksList[i] ) );
    }
    bookTree.addEventListener( "select", pub.onBookSelect, false );
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
    if ( book == null ) {
      return;
    }
    if ( bookTree.view.rowCount == 0 ) {
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

  function updateCurrentBookView() {
    refreshCategoriesList();
    refreshTagsList();
    restoreCurrentBookPreferences();
    if ( currentBook && currentBook.isOpen() ) {
      selectTree( currentBook.loadPreference( "currentTree", "Categories" ) );
      if ( currentTree == "Categories" ) {
        restoreCategoriesTreeSelection();
      } else if ( currentTree == "Tags" ) {
        restoreTagsTreeSelection();
      }
    } else {
      refreshNotesList();
      currentNoteChanged();
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
       message = stringsBundle.getString( "main.book.openerror.already_opened" );
       break;
     case DRIVER_ERROR:
       message = stringsBundle.getString( "main.book.openerror.driver_error" );
       break;
     case NOT_EXISTS:
       message = stringsBundle.getString( "main.book.openerror.not_exists" );
       break;
     case NOT_PERMITS:
       message = stringsBundle.getString( "main.book.openerror.not_permits" );
       break;
     case CONNECTION_ERROR:
       if ( !message ) {
         message = stringsBundle.getString( "main.book.openerror.connection_error" );
       }
       break;
    }
    params = {
      input: {
        title: stringsBundle.getString( "main.book.openerror.title" ),
        message1: stringsBundle.getFormattedString(
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
    params.input.message1 = stringsBundle.getFormattedString(
      "main.book.confirmCreate.message1",
      [ aBook.getName() ]
    );
    params.input.message2 = stringsBundle.getString( "main.book.confirmCreate.message2" );
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
        params.input.title = stringsBundle.getString( "main.book.createerror.title" );
        params.input.message1 = stringsBundle.getFormattedString(
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
    saveCurrentBookPreferences();
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
    if ( ru.akman.znotes.Utils.compareObjects( params.output.connection, params.input.connection ) ) {
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
    bookTree.removeEventListener( "select", pub.onBookSelect, false );
    bookTree.view.selection.select( anIndex );
    bookTree.addEventListener( "select", pub.onBookSelect, false );
  };

  // B O O K  T R E E  E V E N T S

  pub.onBookClick = function( event ) {
    event.preventDefault();
    event.stopPropagation();
    if ( event.button != "2" ) {
      return false;
    }
    bookTreeMenu.openPopupAtScreen(
      event.clientX + window.mozInnerScreenX + 2,
      event.clientY + window.mozInnerScreenY + 2,
      false
    );
    return true;
  };

  pub.onBookSelect = function( event ) {
    if ( isDragDropActive ) {
      event.stopPropagation();
      event.preventDefault();
      return;
    }
    var book = null;
    if ( bookTree.currentIndex >= 0 ) {
      book = booksList[bookTree.currentIndex];
    }
    if ( currentBook && currentBook == book ) {
      event.stopPropagation();
      event.preventDefault();
      return;
    }
    saveCurrentBookPreferences();
    currentBook = book;
    currentBookChanged();
  };

  pub.onBookTreeTextBoxEvent = function( event ) {
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
            log( e );
            bookTree.view.setCellText( anEditBookIndex, aColumn, oldValue );
          }
        }
        anEditBookIndex = null;
        bookTree.setAttribute( "editable", "false" );
        break;
    }
    return true;
  };

  pub.onBookDblClick = function( event ) {
    event.stopPropagation();
    event.preventDefault();
    if ( event.button != "0" || anEditBookIndex != null ) {
      return false;
    }
    if ( isDragDropActive || bookTree.currentIndex < 0 || currentBook == null ) {
      return false;
    }
    if ( !currentBook.isOpen() ) {
      doOpenBook();
    }
    return true;
  };

  // Drag & Drop

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

  pub.onBookDragDrop = function( event ) {
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
        bookTree.removeEventListener( "select", pub.onBookSelect, false );
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
        bookTree.addEventListener( "select", pub.onBookSelect, false );
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
  // CONTENT TREE EVENTS
  //

  /*
  function onCategoryCreated( e ) {
    var aCategory = e.data.parentCategory;
    var aCreatedCategory = e.data.createdCategory;
  };
  */

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

  /*
  function onCategoryDeleted( e ) {
    var aCategory = e.data.parentCategory;
    var aDeletedCategory = e.data.deletedCategory;
  };
  */

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
    if ( currentTree == "Tags" ) {
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
        noteTree.removeEventListener( "select", pub.onNoteSelect, false );
        noteTreeChildren.appendChild( aTreeItem );
        noteTree.addEventListener( "select", pub.onNoteSelect, false );
      }
    } else if ( currentTree == "Categories" ) {
      if ( currentCategory != aCategory ) {
        return;
      }
      if ( notesList.indexOf( anAppendedNote ) < 0 ) {
        aRow = anAppendedNote.getIndex();
        notesList.splice( aRow, 0, anAppendedNote );
        aTreeItem = createNoteTreeItem( anAppendedNote );
        noteTree.removeEventListener( "select", pub.onNoteSelect, false );
        if ( aRow == notesList.length - 1 ) {
          noteTreeChildren.appendChild( aTreeItem );
        } else {
          noteTreeChildren.insertBefore( aTreeItem, noteTree.view.getItemAtIndex( aRow ) );
        }
        noteTree.addEventListener( "select", pub.onNoteSelect, false );
      }
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
    if ( currentTree == "Tags" ) {
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
    } else if ( currentTree == "Categories" ) {
      if ( currentCategory != aCategory ) {
        return;
      }
    }
    anItemInfo = getNoteTreeItemAndIndex( aRemovedNote );
    aTreeItem = anItemInfo.item;
    aTreeIndex = anItemInfo.index;
    if ( aTreeItem ) {
      notesList.splice( aTreeIndex, 1 );
      if ( aTreeIndex == ( noteTree.view.rowCount - 1 ) ) {
        aTreeIndex--;
      }
      noteTree.removeEventListener( "select", pub.onNoteSelect, false );
      aTreeItem.parentNode.removeChild( aTreeItem );
      noteTree.addEventListener( "select", pub.onNoteSelect, false );
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
    if ( currentTree == "Categories" ) {
      return;
    } else if ( currentTree == "Tags" ) {
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
        noteTree.removeEventListener( "select", pub.onNoteSelect, false );
        noteTreeChildren.appendChild( createNoteTreeItem( aNote ) );
        noteTree.addEventListener( "select", pub.onNoteSelect, false );
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
          noteTree.removeEventListener( "select", pub.onNoteSelect, false );
          anItem.parentNode.removeChild( anItem );
          noteTree.addEventListener( "select", pub.onNoteSelect, false );
          if ( currentNote == aNote ) {
            noteTree.view.selection.select( anIndex );
          }
        }
      }
    }
  };

  function onNoteLoadingChanged( e ) {
    var aCategory = e.data.parentCategory;
    var aNote = e.data.changedNote;
    var oldLoading = e.data.oldValue;
    var newLoading = e.data.newValue;
    var aBook = aCategory.getBook();
    if ( currentBook && currentBook == aBook ) {
      updateNoteTreeItem( aNote );
      if ( currentNote == aNote ) {
        if ( !currentNote.isLoading() ) {
          currentNoteChanged( true );
        }
      }
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
        ru.akman.znotes.Utils.showPopup(
          "chrome://znotes/skin/message-32x32.png",
          stringsBundle.getString( "main.note.import.title" ),
          stringsBundle.getString( "main.note.loading.success" )
        );
        break;
      case "error" :
        ru.akman.znotes.Utils.showPopup(
          "chrome://znotes/skin/warning-32x32.png",
          stringsBundle.getString( "main.note.import.title" ),
          newStatus.message
        );
        var params = {
          input: {
            title: stringsBundle.getString( "main.note.confirmDelete.title" ),
            message1: stringsBundle.getFormattedString( "main.note.confirmDelete.message1", [ aNote.getName() ] ),
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
            title: stringsBundle.getString( "main.note.confirmDelete.title" ),
            message1: stringsBundle.getFormattedString( "main.note.confirmDelete.message1", [ aNote.getName() ] ),
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
    if ( currentNote == aNote ) {
      if ( !currentNote.isLoading() ) {
        currentNoteChanged( true );
      }
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
  // TAGS LIST EVENTS
  //

  /*
  function onTagCreated( e ) {
    var aTag = e.data.createdTag;
  };
  */

  /*
  function onTagDeleted( e ) {
    var aTag = e.data.deletedTag;
  };
  */

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
      tagTree.removeEventListener( "select", pub.onTagSelect, false );
      if ( aRow == tagsList.length - 1 ) {
        tagTreeChildren.appendChild( aTreeItem );
      } else {
        tagTreeChildren.insertBefore( aTreeItem, tagTree.view.getItemAtIndex( aRow ) );
      }
      tagTree.addEventListener( "select", pub.onTagSelect, false );
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
      tagTree.removeEventListener( "select", pub.onTagSelect, false );
      aTreeItem.parentNode.removeChild( aTreeItem );
      tagTree.addEventListener( "select", pub.onTagSelect, false );
    }
  };

  //
  // BOOKS LIST EVENTS
  //

  /*
  function onBookCreated( e ) {
    var aBook = e.data.createdBook;
  };
  */

  /*
  function onBookDeleted( e ) {
    var aBook = e.data.deletedBook;
  };
  */

  function onBookOpened( e ) {
    var aBook = e.data.openedBook;
    var tagList = aBook.getTagList();
    tagList.getNoTag().setName( stringsBundle.getString( "main.notag.name" ) );
    tagList.addStateListener( tagListStateListener );
    var contentTree = aBook.getContentTree();
    contentTree.addStateListener( contentTreeStateListener );
    if ( booksList && booksList.indexOf( aBook ) >= 0 ) {
      updateBookTreeItem( aBook );
    }
    if ( currentBook && currentBook == aBook ) {
      currentBookChanged();
    }
  };

  function onBookClosed( e ) {
    var aBook = e.data.closedBook;
    if ( currentBook && currentBook == aBook ) {
      selectTree( null );
      currentCategory = null;
      currentTag = null;
      currentNote = null;
      updateBookTreeItem( aBook );
      currentBookChanged();
    }
  };

  function onBookChanged( e ) {
    var aBook = e.data.changedBook;
    if ( currentBook && currentBook == aBook ) {
      updateBookTreeItem( aBook );
      if ( aBook.isOpen() ) {
        var tagList = aBook.getTagList();
        tagList.getNoTag().setName( stringsBundle.getString( "main.notag.name" ) );
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
      bookTree.removeEventListener( "select", pub.onBookSelect, false );
      if ( aRow == booksList.length - 1 ) {
        bookTreeChildren.appendChild( aTreeItem );
      } else {
        bookTreeChildren.insertBefore( aTreeItem, bookTree.view.getItemAtIndex( aRow ) );
      }
      bookTree.addEventListener( "select", pub.onBookSelect, false );
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
      bookTree.removeEventListener( "select", pub.onBookSelect, false );
      aTreeItem.parentNode.removeChild( aTreeItem );
      bookTree.addEventListener( "select", pub.onBookSelect, false );
    }
  };

  // S T A T E
  
  function selectTree( aTree ) {
    currentTree = aTree;
    if ( currentTree == null ) {
      cmdNewTag.setAttribute( "disabled", "true" );
      cmdDeleteTag.setAttribute( "disabled", "true" );
      cmdRenameTag.setAttribute( "disabled", "true" );
      cmdColorTag.setAttribute( "disabled", "true" );
      cmdRefreshTagTree.setAttribute( "disabled", "true" );
      //
      cmdNewCategory.setAttribute( "disabled", "true" );
      cmdDeleteCategory.setAttribute( "disabled", "true" );
      cmdRenameCategory.setAttribute( "disabled", "true" );
      cmdRefreshFolderTree.setAttribute( "disabled", "true" );
    } else if ( currentTree == "Categories" ) {
      cmdNewTag.setAttribute( "disabled", "true" );
      cmdDeleteTag.setAttribute( "disabled", "true" );
      cmdRenameTag.setAttribute( "disabled", "true" );
      cmdColorTag.setAttribute( "disabled", "true" );
      cmdRefreshTagTree.setAttribute( "disabled", "true" );
      //
      cmdNewCategory.removeAttribute( "disabled" );
      cmdDeleteCategory.removeAttribute( "disabled" );
      cmdRenameCategory.removeAttribute( "disabled" );
      cmdRefreshFolderTree.removeAttribute( "disabled" );
    } else if ( currentTree == "Tags" ) {
      cmdNewCategory.setAttribute( "disabled", "true" );
      cmdDeleteCategory.setAttribute( "disabled", "true" );
      cmdRenameCategory.setAttribute( "disabled", "true" );
      cmdRefreshFolderTree.setAttribute( "disabled", "true" );
      //
      cmdNewTag.removeAttribute( "disabled" );
      cmdDeleteTag.removeAttribute( "disabled" );
      cmdRenameTag.removeAttribute( "disabled" );
      cmdColorTag.removeAttribute( "disabled" );
      cmdRefreshTagTree.removeAttribute( "disabled" );
    }
  };
  
  function currentBookChanged() {
    if ( currentBook == null ) {
      selectTree( null );
      currentCategory = null;
      currentTag = null;
      currentNote = null;
      cmdDeleteBook.setAttribute( "disabled", "true" );
      cmdDeleteBookData.setAttribute( "disabled", "true" );
      cmdRenameBook.setAttribute( "disabled", "true" );
      cmdOpenBook.setAttribute( "disabled", "true" );
      cmdEditBook.setAttribute( "disabled", "true" );
      cmdCloseBook.setAttribute( "disabled", "true" );
    } else {
      cmdDeleteBook.removeAttribute( "disabled" );
      cmdDeleteBookData.removeAttribute( "disabled" );
      cmdRenameBook.removeAttribute( "disabled" );
      if ( currentBook.isOpen() ) {
        cmdOpenBook.setAttribute( "disabled", "true" );
        cmdEditBook.setAttribute( "disabled", "true" );
        cmdCloseBook.removeAttribute( "disabled" );
      } else {
        selectTree( null );
        currentCategory = null;
        currentTag = null;
        currentNote = null;
        cmdOpenBook.removeAttribute( "disabled" );
        cmdEditBook.removeAttribute( "disabled" );
        cmdCloseBook.setAttribute( "disabled", "true" );
      }
    }
    cmdRefreshBookTree.removeAttribute( "disabled" );
    cmdAppendBook.removeAttribute( "disabled" );
    updateCurrentBookView();
    saveBooksTreeSelection();
  };

  function currentNoteChanged( forced ) {
    updateNoteCommands();
    body.show( currentNote, !!forced );
    saveNotesTreeSelection();
  };

  function currentCategoryChanged() {
    if ( currentCategory == null ) {
      folderTree.view.selection.select( -1 );
      return;
    }
    if ( categoriesList.indexOf( currentCategory ) == 0 ) {
      cmdDeleteCategory.setAttribute( "disabled", "true" );
      cmdRenameCategory.setAttribute( "disabled", "true" );
    } else {
      cmdDeleteCategory.removeAttribute( "disabled" );
      cmdRenameCategory.removeAttribute( "disabled" );
    }
    saveCategoriesTreeSelection();
  };

  function currentTagChanged() {
    if ( currentTag.isNoTag() ) {
      cmdDeleteTag.setAttribute( "disabled", "true" );
      cmdRenameTag.setAttribute( "disabled", "true" );
    } else {
      cmdDeleteTag.removeAttribute( "disabled" );
      cmdRenameTag.removeAttribute( "disabled" );
    }
    saveTagsTreeSelection();
  };

  // W I N D O W S

  function onWindowLoad( win, bookId, noteId ) {
    windowsList.push( win.name );
    if ( windowsMonitor && "onTabOpened" in windowsMonitor ) {
      windowsMonitor.onTabOpened(
        {
          bookId: bookId,
          noteId: noteId,
          mode: {
            name: "znotesContentTab"
          }
        }
      );
    }
  };

  function onWindowUnload( win, bookId, noteId ) {
    var index = windowsList.indexOf( win.name );
    if ( index != -1 ) {
      windowsList.splice( index, 1 );
    }
    var tab = {
      bookId: bookId,
      noteId: noteId,
      mode: {
        name: "znotesContentTab"
      }
    };
    if ( windowsMonitor && "onTabClosing" in windowsMonitor ) {
      windowsMonitor.onTabClosing( tab );
    }
  };

  function showNoteWindow( aNote, aBackground ) {
    if ( !aNote ) {
      return;
    }
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
              iconsize: mainToolBox.getAttribute( "iconsize" )
            }
          }
        );
      } else {
        var tabContainer = ru.akman.znotes.Utils.getTabContainer();
        tabContainer.selectedIndex = tabIndex;
      }
    } else {
      var windowService = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                                    .getService( Components.interfaces.nsIWindowWatcher );
      var win = windowService.getWindowByName( windowName, null );
      if ( win ) {
        windowService.activeWindow = win;
      } else {
        win = window.open(
          "chrome://znotes/content/viewer.xul?" + windowName,
          windowName,
          "chrome,resizable,centerscreen"
        );
        win.arguments = [
          "chrome://znotes/content/viewer.xul?" + windowName,
          aNote,
          aBackground,
          {
            iconsize: mainToolBox.getAttribute( "iconsize" )
          }
        ];
        win.addEventListener( "load"  , function() { onWindowLoad( win, bookId, noteId ); }, false );
        win.addEventListener( "unload"  , function() { onWindowUnload( win, bookId, noteId ); }, false );
        if ( aBackground ) {
          setTimeout(
            function() {
              windowService.activeWindow = mainWindow;
            },
            0
          );
        }
      }
    }
  };

  // P R E F E R E N S E S

  function saveBooksTreeSelection() {
    var currentBookIndex = -1;
    if ( currentBook ) {
      currentBookIndex = currentBook.getIndex();
    }
    prefsBundle.setIntPref( "currentBook", currentBookIndex );
  };

  function restoreBooksTreeSelection() {
    var currentBookIndex = -1;
    try {
      if ( !prefsBundle.hasPref( "currentBook" ) ) {
        prefsBundle.setIntPref( "currentBook", currentBookIndex );
      } else {
        currentBookIndex = prefsBundle.getIntPref( "currentBook" );
      }
    } catch ( e ) {
      log( e );
    }
    if ( currentBookIndex < 0 || currentBookIndex > bookTree.view.rowCount - 1 ) {
      currentBookIndex = books.hasBooks() ? 0 : -1;
    } else {
      bookTreeBoxObject.ensureRowIsVisible( currentBookIndex );
    }
    bookTree.view.selection.select( currentBookIndex );
  };

  function saveCategoriesTreeSelection() {
    if ( currentBook && currentBook.isOpen() ) {
      currentBook.savePreference( "currentCategory", categoriesList.indexOf( currentCategory ) );
    }
  };

  function restoreCategoriesTreeSelection() {
    if ( currentBook && currentBook.isOpen() ) {
      tagTree.view.selection.select( -1 );
      var currentItemIndex = currentBook.loadPreference( "currentCategory", 0 );
      var currentTreeItem = getFolderTreeItemAtItemIndex( currentItemIndex );
      var currentRow = 0;
      if ( currentTreeItem ) {
        currentRow = folderTree.view.getIndexOfItem( currentTreeItem );
      }
      folderTreeBoxObject.ensureRowIsVisible( currentRow );
      folderTree.view.selection.select( currentRow );
    }
  };

  function saveTagsTreeSelection() {
    if ( currentBook && currentBook.isOpen() ) {
      currentBook.savePreference( "currentTag", currentTag.getIndex() );
    }
  };

  function restoreTagsTreeSelection() {
    if ( currentBook && currentBook.isOpen() ) {
      folderTree.view.selection.select( -1 );
      var currentTagIndex = currentBook.loadPreference( "currentTag", 0 );
      if ( currentTagIndex < 0 || currentTagIndex > tagTree.view.rowCount - 1 ) {
        currentTagIndex = 0;
      }
      tagTreeBoxObject.ensureRowIsVisible( currentTagIndex );
      tagTree.view.selection.select( currentTagIndex );
    }
  };

  function saveNotesTreeSelection() {
    if ( currentBook && currentBook.isOpen() ) {
      var index = notesList.indexOf( currentNote );
      if ( ru.akman.znotes.Utils.IS_SAVE_POSITION ) {
        if ( currentTree == "Categories" && currentCategory != null ) {
          if ( currentCategory.isRoot() ) {
            currentBook.savePreference( "rootPosition", index );
          } else {
            currentCategory.setSelectedIndex( index );
          }
        } else if ( currentTree == "Tags" && currentTag != null ) {
          currentTag.setSelectedIndex( index );
        }
      }
    }
  };

  function restoreNotesTreeSelection() {
    if ( currentBook && currentBook.isOpen() ) {
      var index = 0;
      if ( currentTree == "Categories" ) {
        if ( noteTree.view.rowCount > 0 ) {
          if ( ru.akman.znotes.Utils.IS_SAVE_POSITION ) {
            if ( currentCategory.isRoot() ) {
              index = currentBook.loadPreference( "rootPosition", -1 );
            } else {
              index = currentCategory.getSelectedIndex();
            }
            if ( index < 0 ) {
              index = 0;
            }
          }
          noteTreeBoxObject.ensureRowIsVisible( index );
          noteTree.view.selection.select( index );
        } else {
          noteTree.view.selection.select( -1 );
        }
      } else if ( currentTree == "Tags" ) {
        if ( noteTree.view.rowCount > 0 ) {
          if ( ru.akman.znotes.Utils.IS_SAVE_POSITION ) {
            index = currentTag.getSelectedIndex();
            if ( index < 0 ) {
              index = 0;
            }
          }
          noteTreeBoxObject.ensureRowIsVisible( index );
          noteTree.view.selection.select( index );
        } else {
          noteTree.view.selection.select( -1 );
        }
      }
    }
  };

  function connectMutationObservers() {
    mutationObservers = [];
    mutationObservers.push( connectMutationObserver( folderBox, "width", "folderBoxWidth" ) );
    mutationObservers.push( connectMutationObserver(   bookTreeView, "height", "bookTreeViewHeight" ) );
    mutationObservers.push( connectMutationObserver(   bookSplitter, "state", "bookSplitterState" ) );
    mutationObservers.push( connectMutationObserver(   categoryBox, "height", "categoryBoxHeight" ) );
    mutationObservers.push( connectMutationObserver(     folderTreeView, "height", "folderTreeViewHeight" ) );
    mutationObservers.push( connectMutationObserver(     tagSplitter, "state", "tagSplitterState" ) );
    mutationObservers.push( connectMutationObserver(     tagTreeView, "height", "tagTreeViewHeight" ) );
    mutationObservers.push( connectMutationObserver( folderSplitter, "state", "folderSplitterState" ) );
    mutationObservers.push( connectMutationObserver( noteBox, "width", "noteBoxWidth" ) );
    mutationObservers.push( connectMutationObserver(   noteTreeView, "height", "noteTreeViewHeight" ) );
    mutationObservers.push( connectMutationObserver(   noteTreeSplitter, "state", "noteTreeSplitterState" ) );
    mutationObservers.push( connectMutationObserver(   noteBodyBox, "height", "noteBodyBoxHeight" ) );
    mutationObservers.push( connectMutationObserver(     noteBodyView, "height", "noteBodyViewHeight" ) );
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

  function restoreCurrentBookPreferences() {
    if ( currentBook == null ) {
      return;
    }
    folderBox.setAttribute( "width", currentBook.loadPreference( "folderBoxWidth", "200" ) );
      bookTreeView.setAttribute( "height", currentBook.loadPreference( "bookTreeViewHeight", "250" ) );
      bookSplitter.setAttribute( "state", currentBook.loadPreference( "bookSplitterState", "open" ) );
      categoryBox.setAttribute( "height", currentBook.loadPreference( "categoryBoxHeight", "700" ) );
        folderTreeView.setAttribute( "height", currentBook.loadPreference( "folderTreeViewHeight", "500" ) );
        tagSplitter.setAttribute( "state", currentBook.loadPreference( "tagSplitterState", "open" ) );
        tagTreeView.setAttribute( "height", currentBook.loadPreference( "tagTreeViewHeight", "300" ) );
    folderSplitter.setAttribute( "state", currentBook.loadPreference( "folderSplitterState", "open" ) );
    noteBox.setAttribute( "width", currentBook.loadPreference( "noteBoxWidth", "800" ) );
      noteTreeView.setAttribute( "height", currentBook.loadPreference( "noteTreeViewHeight", "250" ) );
      noteTreeSplitter.setAttribute( "state", currentBook.loadPreference( "noteTreeSplitterState", "open" ) );
      noteBodyBox.setAttribute( "height", currentBook.loadPreference( "noteBodyBoxHeight", "700" ) );
      noteBodyView.setAttribute( "height", currentBook.loadPreference( "noteBodyViewHeight", "700" ) );
    qfBox.setAttribute( "collapsed", currentBook.loadPreference( "qfBoxCollapsed", "true" ) );
    if ( qfBox.getAttribute( "collapsed" ) == "true" ) {
      qfButton.setAttribute( "checked" , "false" );
      qfButton.setAttribute( "checkState" , "0" );
    } else {
      qfButton.setAttribute( "checked" , "true" );
      qfButton.setAttribute( "checkState" , "1" );
    }
  };

  function saveCurrentBookPreferences() {
    if ( currentBook == null ) {
      return;
    }
    currentBook.savePreference( "folderBoxWidth", folderBox.getAttribute( "width" ) );
      currentBook.savePreference( "bookTreeViewHeight", bookTreeView.getAttribute( "height" ) );
      currentBook.savePreference( "bookSplitterState", bookSplitter.getAttribute( "state" ) );
      currentBook.savePreference( "categoryBoxHeight", categoryBox.getAttribute( "height" ) );
        currentBook.savePreference( "folderTreeViewHeight", folderTreeView.getAttribute( "height" ) );
        currentBook.savePreference( "tagSplitterState", tagSplitter.getAttribute( "state" ) );
        currentBook.savePreference( "tagTreeViewHeight", tagTreeView.getAttribute( "height" ) );
    currentBook.savePreference( "folderSplitterState", folderSplitter.getAttribute( "state" ) );
    currentBook.savePreference( "noteBoxWidth", noteBox.getAttribute( "width" ) );
      currentBook.savePreference( "noteTreeViewHeight", noteTreeView.getAttribute( "height" ) );
      currentBook.savePreference( "noteTreeSplitterState", noteTreeSplitter.getAttribute( "state" ) );
      currentBook.savePreference( "noteBodyBoxHeight", noteBodyBox.getAttribute( "height" ) );
        currentBook.savePreference( "noteBodyViewHeight", noteBodyView.getAttribute( "height" ) );
  };

  function definePrefObservers() {
    prefObserver = {
      onPrefChanged: function( event ) {
        switch( event.data.name ) {
          case "isSavePosition":
            ru.akman.znotes.Utils.IS_SAVE_POSITION = event.data.newValue;
            currentNoteChanged();
            break;
          case "isEditSourceEnabled":
            ru.akman.znotes.Utils.IS_EDIT_SOURCE_ENABLED = event.data.newValue;
            currentNoteChanged();
            break;
          case "isOpened":
            var isOpened = event.data.newValue;
            if ( !isOpened ) {
              done();
            }
            break;
          case "isMainMenubarVisible":
            ru.akman.znotes.Utils.IS_MAINMENUBAR_VISIBLE = event.data.newValue;
            cmdShowMainMenubar.setAttribute( "checked", ru.akman.znotes.Utils.IS_MAINMENUBAR_VISIBLE );
            updateMainMenubarView();
            break;
          case "isMainToolbarVisible":
            ru.akman.znotes.Utils.IS_MAINTOOLBAR_VISIBLE = event.data.newValue;
            cmdShowMainToolbar.setAttribute( "checked", ru.akman.znotes.Utils.IS_MAINTOOLBAR_VISIBLE );
            updateMainToolbarView();
            break;
          case "defaultDocumentType":
            ru.akman.znotes.Utils.DEFAULT_DOCUMENT_TYPE = event.data.newValue;
            break;
        }
      }
    };
    mozPrefObserver = {
      observe: function( subject, topic, data ) {
        switch ( data ) {
          case "debug":
            ru.akman.znotes.Utils.IS_DEBUG_ENABLED = 
              this.branch.getBoolPref( "debug" );
            pub.onAppMenuShowing();
            break;
        }
      },
      register: function() {
        var prefService = Components.classes["@mozilla.org/preferences-service;1"]
                                    .getService( Components.interfaces.nsIPrefService );
        this.branch = prefService.getBranch( "extensions.znotes.");
        this.branch.addObserver( "", this, false );
      },
      unregister: function() {
        this.branch.removeObserver( "", this );
      }
    };
  };

  function connectPrefsObservers() {
    prefsBundle.addObserver( prefObserver );
    mozPrefObserver.register();
  };
  
  function disconnectPrefsObservers() {
    prefsBundle.removeObserver( prefObserver );
    mozPrefObserver.unregister();
  };
  
  function loadPrefs() {
    var mozPrefs = Components.classes["@mozilla.org/preferences-service;1"]
                             .getService( Components.interfaces.nsIPrefBranch );
    if ( mozPrefs.prefHasUserValue( "extensions.znotes.debug" ) ) {
      ru.akman.znotes.Utils.IS_DEBUG_ENABLED = mozPrefs.getBoolPref( "extensions.znotes.debug" );
    }
    if ( mozPrefs.prefHasUserValue( "extensions.znotes.debug.active" ) ) {
      ru.akman.znotes.Utils.IS_DEBUG_ACTIVE = mozPrefs.getBoolPref( "extensions.znotes.debug.active" );
    }
    if ( mozPrefs.prefHasUserValue( "extensions.znotes.debug.raised" ) ) {
      ru.akman.znotes.Utils.IS_DEBUG_RAISED = mozPrefs.getBoolPref( "extensions.znotes.debug.raised" );
    }
    if ( mozPrefs.prefHasUserValue( "extensions.znotes.sanitize" ) ) {
      ru.akman.znotes.Utils.IS_SANITIZE_ENABLED = mozPrefs.getBoolPref( "extensions.znotes.sanitize" );
    }
    if ( mozPrefs.prefHasUserValue( "extensions.znotes.ad" ) ) {
      ru.akman.znotes.Utils.IS_AD_ENABLED = mozPrefs.getBoolPref( "extensions.znotes.ad" );
    }
    var version = ru.akman.znotes.Utils.VERSION;
    var isFirstRun = ru.akman.znotes.Utils.IS_FIRST_RUN;
    var isSavePosition = ru.akman.znotes.Utils.IS_SAVE_POSITION;
    var isEditSourceEnabled = ru.akman.znotes.Utils.IS_EDIT_SOURCE_ENABLED;
    var isPlaySound = ru.akman.znotes.Utils.IS_PLAY_SOUND;
    var isMainMenubarVisible = ru.akman.znotes.Utils.IS_MAINMENUBAR_VISIBLE;
    var isMainToolbarVisible = ru.akman.znotes.Utils.IS_MAINTOOLBAR_VISIBLE;
    var defaultDocumentType = ru.akman.znotes.Utils.DEFAULT_DOCUMENT_TYPE;
    prefsBundle = ru.akman.znotes.PrefsManager.getInstance();
    try {
      //
      if ( !prefsBundle.hasPref( "version" ) ) {
        prefsBundle.setCharPref( "version", version );
      } else {
        version = prefsBundle.getCharPref( "version" );
      }
      //
      if ( !prefsBundle.hasPref( "isFirstRun" ) ) {
        prefsBundle.setBoolPref( "isFirstRun", isFirstRun );
      } else {
        isFirstRun = prefsBundle.getBoolPref( "isFirstRun" );
      }
      //
      if ( version != ru.akman.znotes.Utils.VERSION ) {
        prefsBundle.setCharPref( "version", ru.akman.znotes.Utils.VERSION );
        isFirstRun = true;
      }
      if ( isFirstRun ) {
        prefsBundle.setBoolPref( "isFirstRun", false );
      }
      ru.akman.znotes.Utils.IS_FIRST_RUN = isFirstRun;
      //
      if ( !prefsBundle.hasPref( "isSavePosition" ) ) {
        prefsBundle.setBoolPref( "isSavePosition", isSavePosition );
      } else {
        isSavePosition = prefsBundle.getBoolPref( "isSavePosition" );
      }
      ru.akman.znotes.Utils.IS_SAVE_POSITION = isSavePosition;
      //
      if ( !prefsBundle.hasPref( "isEditSourceEnabled" ) ) {
        prefsBundle.setBoolPref( "isEditSourceEnabled", isEditSourceEnabled );
      } else {
        isEditSourceEnabled = prefsBundle.getBoolPref( "isEditSourceEnabled" );
      }
      ru.akman.znotes.Utils.IS_EDIT_SOURCE_ENABLED = isEditSourceEnabled;
      //
      if ( !prefsBundle.hasPref( "isPlaySound" ) ) {
        prefsBundle.setBoolPref( "isPlaySound", isPlaySound );
      } else {
        isPlaySound = prefsBundle.getBoolPref( "isPlaySound" );
      }
      ru.akman.znotes.Utils.IS_PLAY_SOUND = isPlaySound;
      //
      if ( !prefsBundle.hasPref( "isMainMenubarVisible" ) ) {
        prefsBundle.setBoolPref( "isMainMenubarVisible", isMainMenubarVisible );
      } else {
        isMainMenubarVisible = prefsBundle.getBoolPref( "isMainMenubarVisible" );
      }
      ru.akman.znotes.Utils.IS_MAINMENUBAR_VISIBLE = isMainMenubarVisible;
      //
      if ( !prefsBundle.hasPref( "isMainToolbarVisible" ) ) {
        prefsBundle.setBoolPref( "isMainToolbarVisible", isMainToolbarVisible );
      } else {
        isMainToolbarVisible = prefsBundle.getBoolPref( "isMainToolbarVisible" );
      }
      ru.akman.znotes.Utils.IS_MAINTOOLBAR_VISIBLE = isMainToolbarVisible;
      //
      if ( !prefsBundle.hasPref( "defaultDocumentType" ) ) {
        prefsBundle.setCharPref( "defaultDocumentType", defaultDocumentType );
      } else {
        defaultDocumentType = prefsBundle.getCharPref( "defaultDocumentType" );
      }
      ru.akman.znotes.Utils.DEFAULT_DOCUMENT_TYPE = defaultDocumentType;
      //
    } catch ( e ) {
      log( e );
    }
    definePrefObservers();
    //
    if ( ru.akman.znotes.Utils.IS_FIRST_RUN || ru.akman.znotes.Utils.IS_DEBUG_ENABLED ) {
      var observerService = Components.classes["@mozilla.org/observer-service;1"]
                                      .getService( Components.interfaces.nsIObserverService );
		  observerService.notifyObservers( null, "startupcache-invalidate", null );
		  observerService.notifyObservers( null, "chrome-flush-skin-caches", null );
		  observerService.notifyObservers( null, "chrome-flush-caches", null );
    }
  };

  // D R I V E R  M A N A G E R

  function loadDrivers() {
    var driverDirectory = ru.akman.znotes.Utils.getDriverDirectory();
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
        log( e );
      }
      if ( driver == null ) {
        log( "Error loading driver: " + entry.path );
      }
    }
  };

  // D O C U M E N T  M A N A G E R

  function loadDocuments() {
    var documentDirectory = ru.akman.znotes.Utils.getDocumentDirectory();
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
        log( e );
      }
      if ( doc == null ) {
        log( "Error loading document: " + entry.path );
      }
    }
  };
  
  function loadBooks() {
    books = new ru.akman.znotes.core.BookList();
    books.addStateListener( booksStateListener );
    books.load();
    if ( !books.hasBooks() ) {
      var defaultBook = books.createBook();
      if ( defaultBook ) {
        try {
          defaultBook.createData();
          if ( defaultBook.open() == 0 ) {
            welcomeNote = createWelcomeNote( defaultBook );
            if ( !isStandalone ) {
              var data = welcomeNote.getData();
              data.isAddonsVisible = true;
              welcomeNote.setData();
            }
          }
        } catch ( e ) {
          log( e );
        }
      }
    }
  };

  // S E S S I O N  M A N A G E R

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
    var message = null;
    if ( !book.isOpen() ) {
      try {
        result = book.open();
      } catch ( e ) {
         message = e.message;
      }
      if ( result != 0 ) {
        var message = "";
        switch ( result ) {
          case ALREADY_OPENED:
            message = stringsBundle.getString( "main.book.openerror.already_opened" );
            break;
          case DRIVER_ERROR:
            message = stringsBundle.getString( "main.book.openerror.driver_error" );
            break;
          case CONNECTION_ERROR:
            if ( !message ) {
              message = stringsBundle.getString( "main.book.openerror.connection_error" );
            }
            break;
          case NOT_EXISTS:
            message = stringsBundle.getString( "main.book.openerror.not_exists" );
            break;
          case NOT_PERMITS:
            message = stringsBundle.getString( "main.book.openerror.not_permits" );
            break;
        }
        var params = {
          input: {
            title: stringsBundle.getString( "main.book.openerror.title" ),
            message1: stringsBundle.getFormattedString( "main.book.openerror.message", [ book.getName() ] ),
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

  function getPersistedState() {
    var persistedState = null;
    if ( isStandalone ) {
      persistedState = ru.akman.znotes.SessionManager.getPersistedState();
    } else {
      var tab = ru.akman.znotes.Utils.getMainTab();
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
    for ( var i = 0; i < persistedState.tabs.length; i++ ) {
      var mode = persistedState.tabs[i].mode;
      if ( mode != "znotesContentTab" ) {
        continue;
      }
      var state = persistedState.tabs[i].state;
      var note = getNoteByBookIdAndNoteId( state.bookId, state.noteId );
      var background = state.background;
      if ( !tabMail ) {
        background = true;
      }
      if ( note ) {
        showNoteWindow( note, background );
      }
    }
  };

  // W I N D O W  E V E N T S

  function addEventListeners() {
    connectPrefsObservers();
    connectMutationObservers();
    // popups
    popupAppMenu.addEventListener( "popupshowing", pub.onAppMenuShowing, false );
    mainMenuBar.addEventListener( "popupshowing", pub.onAppMenuShowing, false );
    // splitters
    bookSplitter.addEventListener( "dblclick", pub.onSplitterDblClick, false );
    tagSplitter.addEventListener( "dblclick", pub.onSplitterDblClick, false );
    folderSplitter.addEventListener( "dblclick", pub.onSplitterDblClick, false );
    noteTreeSplitter.addEventListener( "dblclick", pub.onSplitterDblClick, false );
    // books
    bookTree.addEventListener( "click", pub.onBookClick, true );
    bookTree.addEventListener( "dblclick", pub.onBookDblClick, true );
    bookTree.addEventListener( "select", pub.onBookSelect, false );
    bookTreeChildren.addEventListener( "dragstart", pub.onBookDragDrop, false );
    bookTreeChildren.addEventListener( "dragenter", pub.onBookDragDrop, false );
    bookTreeChildren.addEventListener( "dragover", pub.onBookDragDrop, false );
    bookTreeChildren.addEventListener( "dragleave", pub.onBookDragDrop, false );
    bookTreeChildren.addEventListener( "drag", pub.onBookDragDrop, false );
    bookTreeChildren.addEventListener( "drop", pub.onBookDragDrop, false );
    bookTreeChildren.addEventListener( "dragend", pub.onBookDragDrop, false );
    bookTreeTextBox.addEventListener( "focus", pub.onBookTreeTextBoxEvent, false );
    bookTreeTextBox.addEventListener( "keypress", pub.onBookTreeTextBoxEvent, false );
    bookTreeTextBox.addEventListener( "blur", pub.onBookTreeTextBoxEvent, false );
    // categories
    folderTree.addEventListener( "click", pub.onFolderClick, true );
    folderTree.addEventListener( "dblclick", pub.onFolderDblClick, true );
    folderTree.addEventListener( "select", pub.onFolderSelect, false );
    folderTreeChildren.addEventListener( "dragstart", pub.onFolderDragDrop, false );
    folderTreeChildren.addEventListener( "dragenter", pub.onFolderDragDrop, false );
    folderTreeChildren.addEventListener( "dragover", pub.onFolderDragDrop, false );
    folderTreeChildren.addEventListener( "dragleave", pub.onFolderDragDrop, false );
    folderTreeChildren.addEventListener( "drag", pub.onFolderDragDrop, false );
    folderTreeChildren.addEventListener( "drop", pub.onFolderDragDrop, false );
    folderTreeChildren.addEventListener( "dragend", pub.onFolderDragDrop, false );
    folderTreeTextBox.addEventListener( "focus", pub.onFolderTreeTextBoxEvent, false );
    folderTreeTextBox.addEventListener( "keypress", pub.onFolderTreeTextBoxEvent, false );
    folderTreeTextBox.addEventListener( "blur", pub.onFolderTreeTextBoxEvent, false );
    // notes
    noteTree.addEventListener( "click", pub.onNoteClick, true );
    noteTree.addEventListener( "dblclick", pub.onNoteDblClick, true );
    noteTree.addEventListener( "select", pub.onNoteSelect, false );
    noteTreeChildren.addEventListener( "dragstart", pub.onNoteDragDrop, false );
    noteTreeChildren.addEventListener( "dragenter", pub.onNoteDragDrop, false );
    noteTreeChildren.addEventListener( "dragover", pub.onNoteDragDrop, false );
    noteTreeChildren.addEventListener( "dragleave", pub.onNoteDragDrop, false );
    noteTreeChildren.addEventListener( "drag", pub.onNoteDragDrop, false );
    noteTreeChildren.addEventListener( "drop", pub.onNoteDragDrop, false );
    noteTreeChildren.addEventListener( "dragend", pub.onNoteDragDrop, false );
    noteTreeTextBox.addEventListener( "focus", pub.onNoteTreeTextBoxEvent, false );
    noteTreeTextBox.addEventListener( "keypress", pub.onNoteTreeTextBoxEvent, false );
    noteTreeTextBox.addEventListener( "blur", pub.onNoteTreeTextBoxEvent, false );
    // tags
    tagTree.addEventListener( "click", pub.onTagClick, true );
    tagTree.addEventListener( "dblclick", pub.onTagDblClick, true );
    tagTree.addEventListener( "select", pub.onTagSelect, false );
    tagTreeChildren.addEventListener( "dragstart", pub.onTagDragDrop, false );
    tagTreeChildren.addEventListener( "dragenter", pub.onTagDragDrop, false );
    tagTreeChildren.addEventListener( "dragover", pub.onTagDragDrop, false );
    tagTreeChildren.addEventListener( "dragleave", pub.onTagDragDrop, false );
    tagTreeChildren.addEventListener( "drag", pub.onTagDragDrop, false );
    tagTreeChildren.addEventListener( "drop", pub.onTagDragDrop, false );
    tagTreeChildren.addEventListener( "dragend", pub.onTagDragDrop, false );
    tagTreeTextBox.addEventListener( "focus", pub.onTagTreeTextBoxEvent, false );
    tagTreeTextBox.addEventListener( "keypress", pub.onTagTreeTextBoxEvent, false );
    tagTreeTextBox.addEventListener( "blur", pub.onTagTreeTextBoxEvent, false );
  };

  function removeEventListeners() {
    disconnectMutationObservers();
    disconnectPrefsObservers();
    // books
    bookTree.removeEventListener( "click", pub.onBookClick, true );
    bookTree.removeEventListener( "dblclick", pub.onBookDblClick, true );
    bookTree.removeEventListener( "select", pub.onBookSelect, false );
    bookTreeChildren.removeEventListener( "dragstart", pub.onBookDragDrop, false );
    bookTreeChildren.removeEventListener( "dragenter", pub.onBookDragDrop, false );
    bookTreeChildren.removeEventListener( "dragover", pub.onBookDragDrop, false );
    bookTreeChildren.removeEventListener( "dragleave", pub.onBookDragDrop, false );
    bookTreeChildren.removeEventListener( "drag", pub.onBookDragDrop, false );
    bookTreeChildren.removeEventListener( "drop", pub.onBookDragDrop, false );
    bookTreeChildren.removeEventListener( "dragend", pub.onBookDragDrop, false );
    bookTreeTextBox.removeEventListener( "focus", pub.onBookTreeTextBoxEvent, false );
    bookTreeTextBox.removeEventListener( "keypress", pub.onBookTreeTextBoxEvent, false );
    bookTreeTextBox.removeEventListener( "blur", pub.onBookTreeTextBoxEvent, false );
    // categories
    folderTree.removeEventListener( "click", pub.onFolderClick, true );
    folderTree.removeEventListener( "dblclick", pub.onFolderDblClick, true );
    folderTree.removeEventListener( "select", pub.onFolderSelect, false );
    folderTreeChildren.removeEventListener( "dragstart", pub.onFolderDragDrop, false );
    folderTreeChildren.removeEventListener( "dragenter", pub.onFolderDragDrop, false );
    folderTreeChildren.removeEventListener( "dragover", pub.onFolderDragDrop, false );
    folderTreeChildren.removeEventListener( "dragleave", pub.onFolderDragDrop, false );
    folderTreeChildren.removeEventListener( "drag", pub.onFolderDragDrop, false );
    folderTreeChildren.removeEventListener( "drop", pub.onFolderDragDrop, false );
    folderTreeChildren.removeEventListener( "dragend", pub.onFolderDragDrop, false );
    folderTreeTextBox.removeEventListener( "focus", pub.onFolderTreeTextBoxEvent, false );
    folderTreeTextBox.removeEventListener( "keypress", pub.onFolderTreeTextBoxEvent, false );
    folderTreeTextBox.removeEventListener( "blur", pub.onFolderTreeTextBoxEvent, false );
    // notes
    noteTree.removeEventListener( "click", pub.onNoteClick, true );
    noteTree.removeEventListener( "dblclick", pub.onNoteDblClick, true );
    noteTree.removeEventListener( "select", pub.onNoteSelect, false );
    noteTreeChildren.removeEventListener( "dragstart", pub.onNoteDragDrop, false );
    noteTreeChildren.removeEventListener( "dragenter", pub.onNoteDragDrop, false );
    noteTreeChildren.removeEventListener( "dragover", pub.onNoteDragDrop, false );
    noteTreeChildren.removeEventListener( "dragleave", pub.onNoteDragDrop, false );
    noteTreeChildren.removeEventListener( "drag", pub.onNoteDragDrop, false );
    noteTreeChildren.removeEventListener( "drop", pub.onNoteDragDrop, false );
    noteTreeChildren.removeEventListener( "dragend", pub.onNoteDragDrop, false );
    noteTreeTextBox.removeEventListener( "focus", pub.onNoteTreeTextBoxEvent, false );
    noteTreeTextBox.removeEventListener( "keypress", pub.onNoteTreeTextBoxEvent, false );
    noteTreeTextBox.removeEventListener( "blur", pub.onNoteTreeTextBoxEvent, false );
    // tags
    tagTree.removeEventListener( "click", pub.onTagClick, true );
    tagTree.removeEventListener( "dblclick", pub.onTagDblClick, true );
    tagTree.removeEventListener( "select", pub.onTagSelect, false );
    tagTreeChildren.removeEventListener( "dragstart", pub.onTagDragDrop, false );
    tagTreeChildren.removeEventListener( "dragenter", pub.onTagDragDrop, false );
    tagTreeChildren.removeEventListener( "dragover", pub.onTagDragDrop, false );
    tagTreeChildren.removeEventListener( "dragleave", pub.onTagDragDrop, false );
    tagTreeChildren.removeEventListener( "drag", pub.onTagDragDrop, false );
    tagTreeChildren.removeEventListener( "drop", pub.onTagDragDrop, false );
    tagTreeChildren.removeEventListener( "dragend", pub.onTagDragDrop, false );
    tagTreeTextBox.removeEventListener( "focus", pub.onTagTreeTextBoxEvent, false );
    tagTreeTextBox.removeEventListener( "keypress", pub.onTagTreeTextBoxEvent, false );
    tagTreeTextBox.removeEventListener( "blur", pub.onTagTreeTextBoxEvent, false );
    // splitters
    bookSplitter.removeEventListener( "dblclick", pub.onSplitterDblClick, false );
    tagSplitter.removeEventListener( "dblclick", pub.onSplitterDblClick, false );
    folderSplitter.removeEventListener( "dblclick", pub.onSplitterDblClick, false );
    noteTreeSplitter.removeEventListener( "dblclick", pub.onSplitterDblClick, false );
    // popups
    popupAppMenu.removeEventListener( "popupshowing", pub.onAppMenuShowing, false );
    mainMenuBar.removeEventListener( "popupshowing", pub.onAppMenuShowing, false );
  };

  function updateDebugButtonState() {
    // when button removed from toolbar then getElementById() returns NULL
    var debugButton = mainWindow.document.getElementById( "znotes_debug_button" );
    var debugMenuBarItem = mainWindow.document.getElementById( "znotes_mainmenubar_tools_popup_debug" );
    var debugAppMenuItem = mainWindow.document.getElementById( "znotes_appdebug_menuitem" );
    var debugMailMenuBarItem = mainWindow.document.getElementById( "znotes_debug_menuitem" );
    if ( ru.akman.znotes.Utils.IS_STANDALONE ) {
      debugAppMenuItem = mainWindow.document.getElementById( "znotes_appmenu_debug" );
      debugMailMenuBarItem = debugAppMenuItem;
    }
    if ( ru.akman.znotes.Utils.IS_DEBUG_ENABLED ) {
      if ( debugButton && debugButton.hasAttribute( "hidden" ) ) {
        debugButton.removeAttribute( "hidden" );
      }
      if ( debugAppMenuItem.hasAttribute( "hidden" ) ) {
        debugAppMenuItem.removeAttribute( "hidden" );
      }
      if ( debugMenuBarItem.hasAttribute( "hidden" ) ) {
        debugMenuBarItem.removeAttribute( "hidden" );
      }
      if ( debugMailMenuBarItem.hasAttribute( "hidden" ) ) {
        debugMailMenuBarItem.removeAttribute( "hidden" );
      }
    } else {
      if ( debugButton ) {
        debugButton.setAttribute( "hidden", "true" );
      }
      debugAppMenuItem.setAttribute( "hidden", "true" );
      debugMenuBarItem.setAttribute( "hidden", "true" );
      debugMailMenuBarItem.setAttribute( "hidden", "true" );
    }
  };

  function updateUpdateAndAddonsButtonsState() {
    // when button removed from toolbar then getElementById() returns NULL
    var addonsButton = mainWindow.document.getElementById( "znotes_addons_button" );
    var addonsMenuBarItem = mainWindow.document.getElementById( "znotes_mainmenubar_tools_popup_addons" );
    var addonsAppMenuItem = mainWindow.document.getElementById( "znotes_appmenu_addons" );
    var addonsMailMenuBarItem = mainWindow.document.getElementById( "znotes_addons_menuitem" );
    var updateButton = mainWindow.document.getElementById( "znotes_update_button" );
    var updateMenuBarItem = mainWindow.document.getElementById( "znotes_mainmenubar_tools_popup_update" );
    var updateAppMenuItem = mainWindow.document.getElementById( "znotes_appmenu_update" );
    var updateMailMenuBarItem = mainWindow.document.getElementById( "znotes_update_menuitem" );
    if ( ru.akman.znotes.Utils.IS_STANDALONE ) {
      addonsAppMenuItem = mainWindow.document.getElementById( "znotes_appmenu_addons" );
      addonsMailMenuBarItem = addonsAppMenuItem;
      updateAppMenuItem = mainWindow.document.getElementById( "znotes_appmenu_update" );
      updateMailMenuBarItem = updateAppMenuItem;
      if ( addonsButton && addonsButton.hasAttribute( "hidden" ) ) {
        addonsButton.removeAttribute( "hidden" );
      }
      if ( addonsAppMenuItem.hasAttribute( "hidden" ) ) {
        addonsAppMenuItem.removeAttribute( "hidden" );
      }
      if ( addonsMenuBarItem.hasAttribute( "hidden" ) ) {
        addonsMenuBarItem.removeAttribute( "hidden" );
      }
      if ( addonsMailMenuBarItem.hasAttribute( "hidden" ) ) {
        addonsMailMenuBarItem.removeAttribute( "hidden" );
      }
      if ( updateButton && updateButton.hasAttribute( "hidden" ) ) {
        updateButton.removeAttribute( "hidden" );
      }
      if ( updateAppMenuItem.hasAttribute( "hidden" ) ) {
        updateAppMenuItem.removeAttribute( "hidden" );
      }
      if ( updateMenuBarItem.hasAttribute( "hidden" ) ) {
        updateMenuBarItem.removeAttribute( "hidden" );
      }
      if ( updateMailMenuBarItem.hasAttribute( "hidden" ) ) {
        updateMailMenuBarItem.removeAttribute( "hidden" );
      }
    } else {
      addonsAppMenuItem = addonsMailMenuBarItem;
      updateAppMenuItem = updateMailMenuBarItem;
      if ( addonsButton ) { 
        addonsButton.setAttribute( "hidden", "true" );
      }
      addonsAppMenuItem.setAttribute( "hidden", "true" );
      addonsMenuBarItem.setAttribute( "hidden", "true" );
      addonsMailMenuBarItem.setAttribute( "hidden", "true" );
      if ( updateButton ) { 
        updateButton.setAttribute( "hidden", "true" );
      }
      updateAppMenuItem.setAttribute( "hidden", "true" );
      updateMenuBarItem.setAttribute( "hidden", "true" );
      updateMailMenuBarItem.setAttribute( "hidden", "true" );
    }
  };
  
  function updateMainMenubarView() {
    if ( ru.akman.znotes.Utils.IS_MAINMENUBAR_VISIBLE ) {
      mainMenuBar.removeAttribute( "autohide" );
    } else {
      mainMenuBar.setAttribute( "autohide", "true" );
    }
  };

  function updateMainToolbarView() {
    if ( ru.akman.znotes.Utils.IS_MAINTOOLBAR_VISIBLE ) {
      mainToolBar.removeAttribute( "hidden" );
    } else {
      mainToolBar.setAttribute( "hidden", "true" );
    }
  };

  function updateWindowSize( win ) {
    if ( !ru.akman.znotes.Utils.IS_STANDALONE ) {
      return;
    }
    var availLeft = win.screen.availLeft;
    var availTop = win.screen.availTop;
    var availWidth = win.screen.availWidth;
    var availHeight = win.screen.availHeight;
    if ( ru.akman.znotes.Utils.IS_FIRST_RUN ) {
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
  
  function initGlobals() {
    ru.akman.znotes.Utils.initGlobals( pub );
    mainWindow = ru.akman.znotes.Utils.MAIN_WINDOW;
    stringsBundle = ru.akman.znotes.Utils.STRINGS_BUNDLE;
    isStandalone = ru.akman.znotes.Utils.IS_STANDALONE;
    if ( isStandalone ) {
      tabMail = null;
      windowsList = [];
      windowsMonitor = ru.akman.znotes.TabMonitor;
    } else {
      tabMail = ru.akman.znotes.Utils.getTabMail();
    }
  };
  
  function initUI() {
    document.title = stringsBundle.getString( "main.window.title" );
    statusBarPanel = mainWindow.document.getElementById( "znotes_statusbarpanel" );
    /*
    if ( statusBarPanel.hasAttribute( "hidden" ) ) {
      statusBarPanel.removeAttribute( "hidden" );
    }
    */
    statusBarLogo = mainWindow.document.getElementById( "znotes_statusbarpanellogo" );
    statusBarLabel = mainWindow.document.getElementById( "znotes_statusbarpanellabel" );
    mainMenuBar = mainWindow.document.getElementById( "znotes_mainmenutoolbar" );
    mainToolBox = mainWindow.document.getElementById( "znotes_maintoolbox" );
    mainToolBar = mainWindow.document.getElementById( "znotes_maintoolbar" );
    mainToolBox.customizeDone = function( isChanged ) {
      pub.customizeMainToolbarDone( isChanged );
    }
    qfButton = mainWindow.document.getElementById( "znotes_showfilterbar_button" );
    newNoteButton = mainWindow.document.getElementById( "znotes_newnote_button" );
    newNoteButtonMenuPopup = mainWindow.document.getElementById( "znotes_newnote_button_menupopup" );
    importNoteButton = mainWindow.document.getElementById( "znotes_importnote_button" );
    importNoteButtonMenuPopup = mainWindow.document.getElementById( "znotes_importnote_button_menupopup" );
    popupAppMenu = mainWindow.document.getElementById( "znotes_appmenu_popup" );
    bShowAppMenu = mainWindow.document.getElementById( "znotes_showappmenu_button" );
    if ( isStandalone ) {
      if ( !bShowAppMenu.classList.contains( "znotes_showappmenu_button" ) ) {
        bShowAppMenu.classList.add( "znotes_showappmenu_button" );
      }
    } else {
      if ( !bShowAppMenu.classList.contains( "button-appmenu" ) ) {
        bShowAppMenu.classList.add( "button-appmenu" );
      }
    }
    //
    hiddenFrame = document.getElementById( "hiddenFrame" );
    qfBox = document.getElementById( "filterBox" );
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
    //
    bookTree = document.getElementById( "bookTree" );
    bookTreeChildren = document.getElementById( "bookTreeChildren" );
    bookTreeTextBox = bookTree.inputField;
    bookTreeTextBox.setAttribute( "clickSelectsAll", "true" );
    bookTreeSeparator = document.createElement( "treeseparator" );
    bookTreeSeparator.setAttribute( "properties", "booktreeseparator" );
    bookTreeBoxObject = bookTree.boxObject;
    bookTreeBoxObject.QueryInterface( Components.interfaces.nsITreeBoxObject );
    bookTreeMenu = mainWindow.document.getElementById( "bookTreeMenu" );
    bookTree.setAttribute( "editable", "false" );
    //
    folderTree = document.getElementById( "folderTree" );
    folderTreeChildren = document.getElementById( "folderTreeChildren" );
    folderTreeTextBox = folderTree.inputField;
    folderTreeTextBox.setAttribute( "clickSelectsAll", "true" );
    folderTreeSeparator = document.createElement( "treeseparator" );
    folderTreeSeparator.setAttribute( "properties", "foldertreeseparator" );
    folderTreeBoxObject = folderTree.boxObject;
    folderTreeBoxObject.QueryInterface( Components.interfaces.nsITreeBoxObject );
    folderTreeMenu = mainWindow.document.getElementById( "folderTreeMenu" );
    folderTree.setAttribute( "editable", "false" );
    //
    noteTree = document.getElementById( "noteTree" );
    noteTreeChildren = document.getElementById( "noteTreeChildren" );
    noteTreeTextBox = noteTree.inputField;
    noteTreeTextBox.setAttribute( "clickSelectsAll", "true" );
    noteTreeSeparator = document.createElement( "treeseparator" );
    noteTreeSeparator.setAttribute( "properties", "notetreeseparator" );
    noteTreeBoxObject = noteTree.boxObject;
    noteTreeBoxObject.QueryInterface( Components.interfaces.nsITreeBoxObject );
    noteTreeMenu = mainWindow.document.getElementById( "noteTreeMenu" );
    noteTree.setAttribute( "editable", "false" );
    //
    tagTree = document.getElementById( "tagTree" );
    tagTreeChildren = document.getElementById( "tagTreeChildren" );
    tagTreeTextBox = tagTree.inputField;
    tagTreeTextBox.setAttribute( "clickSelectsAll", "true" );
    tagTreeSeparator = document.createElement( "treeseparator" );
    tagTreeSeparator.setAttribute( "properties", "tagtreeseparator" );
    tagTreeBoxObject = tagTree.boxObject;
    tagTreeBoxObject.QueryInterface( Components.interfaces.nsITreeBoxObject );
    tagTreeMenu = mainWindow.document.getElementById( "tagTreeMenu" );
    tagTree.setAttribute( "editable", "false" );
    //
    cmdPrint.removeAttribute( "disabled" );
    cmdPageSetup.removeAttribute( "disabled" );
    cmdExit.removeAttribute( "disabled" );
    cmdShowMainMenubar.removeAttribute( "disabled" );
    cmdShowMainToolbar.removeAttribute( "disabled" );
    cmdCustomizeMainToolbar.removeAttribute( "disabled" );
    cmdOpenOptionsDialog.removeAttribute( "disabled" );
    if ( ru.akman.znotes.Utils.IS_DEBUG_ENABLED ) {
      cmdDebug.removeAttribute( "disabled" );
    }
    if ( ru.akman.znotes.Utils.IS_STANDALONE ) {
      cmdAddons.removeAttribute( "disabled" );
      if ( ru.akman.znotes.UpdateManager.canUpdate() ) {
        cmdUpdate.removeAttribute( "disabled" );
      }
    }
    cmdOpenHelp.removeAttribute( "disabled" );
    cmdOpenAbout.removeAttribute( "disabled" );
    cmdShowAppMenu.removeAttribute( "disabled" );
    cmdShowFilterBar.removeAttribute( "disabled" );
  };
  
  function initListeners() {
    booksStateListener = {
      onBookChanged: onBookChanged,
      onBookOpened: onBookOpened,
      onBookClosed: onBookClosed,
      onBookAppended: onBookAppended,
      onBookRemoved: onBookRemoved,
      onBookInserted: onBookInserted
    };
    contentTreeStateListener = {
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
    tagListStateListener = {
      onTagChanged: onTagChanged,
      onTagAppended: onTagAppended,
      onTagRemoved: onTagRemoved,
      onTagInserted: onTagInserted
    };
  };
  
  function createInstance() {
    body = new ru.akman.znotes.Body(
      {
        name: "main",
        window: window,
        document: document,
        mode: "viewer",
        style: {
          iconsize: mainToolBar.getAttribute( "iconsize" )
        },
        commands: {
          cmdRenameNote: doRenameNote // znotes_renamenote_command
        }
      }
    );
  };
  
  function init() {
    initGlobals();
    initCommandManager();
    initCommands();
    initListeners();
    initUI();
    loadPrefs();
    loadDrivers();
    loadDocuments();
    createInstance();
    loadBooks();
    createBooksList();
    loadPersistedSession();
    showBooksList();
    addEventListeners();
    updateDebugButtonState();
    updateUpdateAndAddonsButtonsState();
    updateMainMenubarView();
    updateMainToolbarView();
    updateNewNoteMenuPopup();
    updateImportNoteMenuPopup();
    restoreBooksTreeSelection();
    setTimeout(
      function() {
        updateWindowSize( mainWindow );
        initCommandController();
        if ( ru.akman.znotes.Utils.IS_PLAY_SOUND ) {
          playSound();
        }
        if ( ru.akman.znotes.Utils.IS_DEBUG_ACTIVE ) {
          doOpenDebugWindow();
        }
      },
      0
    );
  };

  function done() {
    disableCommands();
    doneCommandManager();
    doneCommandController();
    removeEventListeners();
    saveCurrentBookPreferences();
    if ( ru.akman.znotes.Utils.IS_STANDALONE ) {
      var windowService = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                                    .getService( Components.interfaces.nsIWindowWatcher );
      var windowEnumerator = windowService.getWindowEnumerator();
      while ( windowEnumerator.hasMoreElements() ) {
        win = windowEnumerator.getNext().QueryInterface( Components.interfaces.nsIDOMWindow );
        win.close();
      }
    }
  };

  function playSound() {
    ( new Audio( "chrome://znotes_sounds/skin/notify.wav" ) ).play();
  };

  // L O A D  &  U N L O A D  &  C L O S E

  pub.onLoad = function() {
    init();
  };

  pub.onUnload = function() {
    done();
  };

  pub.onClose = function() {
    windowsMonitor = null;
    var windowService = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                                  .getService( Components.interfaces.nsIWindowWatcher );
    var win;
    for ( var i = 0; i < windowsList.length; i++ ) {
      win = windowService.getWindowByName( windowsList[i], null );
      if ( win ) {
        win.close();
      }
    }
    win = windowService.getWindowByName( "znotes:debug", null );
    if ( win ) {
      win.close();
    }
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
    var name = stringsBundle.getString( "main.welcome.notename" );
    var index = 1;
    var suffix = "";
    while ( aRoot.noteExists( name + suffix ) ) {
      index++;
      suffix = " (" + index + ")";
    }
    name = name + suffix;
    var note = createNote( aBook, aRoot, name, "application/xhtml+xml" );
    if ( !ru.akman.znotes.Utils.IS_STANDALONE ) {
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
        var creator = ru.akman.znotes.Utils.CREATORS[0];
        var vendor = ru.akman.znotes.Utils.VENDOR;
        var firstName = ru.akman.znotes.Utils.decodeUTF8( creator.name.substring( 0, creator.name.indexOf( " " ) ) );
        var lastName = ru.akman.znotes.Utils.decodeUTF8( creator.name.substr( creator.name.indexOf( " " ) + 1 ) );
        var primaryEmail = creator.link.substr( creator.link.indexOf( ":" ) + 1 );
        found = false;
        cards = directory.childCards;
        while ( cards.hasMoreElements() ) {
          card = cards.getNext().QueryInterface( Components.interfaces.nsIAbCard );
          if ( card instanceof Components.interfaces.nsIAbCard ) {
            if ( card.firstName == firstName &&
                 card.lastName == lastName ) {
              found = true;
              note.addAttachment( [ card.directoryId + "\t" + card.localId, "contact" ] );
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
          card.setProperty( "PhotoURI", "http://www.gravatar.com/avatar/bc59d4f48198e2e6c4145c995fe9d339.png" );
          try {
            card = directory.addCard( card );
          } catch( e ) {
            card = null;
          }
          if ( card ) {
            cards = directory.childCards;
            while ( cards.hasMoreElements() ) {
              card = cards.getNext().QueryInterface( Components.interfaces.nsIAbCard );
              if ( card instanceof Components.interfaces.nsIAbCard ) {
                if ( card.firstName == firstName &&
                     card.lastName == lastName ) {
                  found = true;
                  note.addAttachment( [ card.directoryId + "\t" + card.localId, "contact" ] );
                  break;
                }
              }
            }
          }
        }
      }
    }
    var url = "chrome://znotes_welcome/content/index_" + ru.akman.znotes.Utils.getSiteLanguage() + ".xhtml";
    note.load( url );
    return note;
  };

  function getDebugContext() {
    return {
      // window
      win: window,
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

  return pub;

}();

window.addEventListener( "load"  , function() { ru.akman.znotes.Main.onLoad(); }, false );
window.addEventListener( "unload", function() { ru.akman.znotes.Main.onUnload(); }, false );
window.addEventListener( "close"  , function() { ru.akman.znotes.Main.onClose(); }, false );
