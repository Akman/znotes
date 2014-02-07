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
Components.utils.import( "resource://znotes/event.js",
  ru.akman.znotes.core
);
Components.utils.import( "resource://znotes/drivermanager.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/booklist.js",
  ru.akman.znotes.core
);
Components.utils.import( "resource://znotes/tabmonitor.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/prefsmanager.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/sessionmanager.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/keyset.js",
  ru.akman.znotes
);

ru.akman.znotes.ZNotes = function() {

  var pub = {};

  var observerService =
    Components.classes["@mozilla.org/observer-service;1"]
              .getService( Components.interfaces.nsIObserverService );
  
  var Utils = ru.akman.znotes.Utils;
  var Common = ru.akman.znotes.Common;

  var prefsBundle = ru.akman.znotes.PrefsManager.getInstance();
  var sessionManager = ru.akman.znotes.SessionManager.getInstance();
  var tabMonitor = ru.akman.znotes.TabMonitor.getInstance();;
  
  var mailWindow = null;
  var folderTree = null;
  var threadTree = null;
  
  var keySet = null;
  var isMainLoaded = false;
  var mainWindow = null;
  var mainWindowState = null;
  
  // PLATFORM

  var platformShutdownObserver = {
    observe: function( aSubject, aTopic, aData ) {
      Utils.IS_QUIT_ENABLED = true;
      // uncomment this to confirming exiting tb application
      // observerService.notifyObservers( null, "znotes-quit-requested", null );
      if ( Utils.IS_QUIT_ENABLED ) {
        tabMonitor.setActive( false );
        observerService.notifyObservers( null, "znotes-quit-accepted", null );
      }
      aSubject.data = !Utils.IS_QUIT_ENABLED;
    },
    register: function() {
      observerService.addObserver( this, "quit-application-requested", false );
    },
    unregister: function() {
      observerService.removeObserver( this, "quit-application-requested" );
    }
  };

  var mainStartupObserver = {
    observe: function( aSubject, aTopic, aData ) {
      mainWindow = aSubject;
      isMainLoaded = true;
      updateCommands();
    },
    register: function() {
      observerService.addObserver( this, "znotes-main-startup", false );
    },
    unregister: function() {
      observerService.removeObserver( this, "znotes-main-startup" );
    }
  };

  var mainShutdownObserver = {
    observe: function( aSubject, aTopic, aData ) {
      mainWindow = null;
      isMainLoaded = false;
      updateCommands();
    },
    register: function() {
      observerService.addObserver( this, "znotes-main-shutdown", false );
    },
    unregister: function() {
      observerService.removeObserver( this, "znotes-main-shutdown" );
    }
  };
  
  // PREFERENCES
  
  var prefsBundleObserver = {
    onPrefChanged: function( event ) {
      switch( event.data.name ) {
        case "platform_shortcuts":
          Utils.PLATFORM_SHORTCUTS = event.data.newValue;
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
          Common.goSetCommandHidden( "znotes_tbtestsuite_command",
            !Utils.IS_DEBUG_ENABLED, window );
          Common.goUpdateCommand( "znotes_tbtestsuite_command", platformController.getId(), window );
          Common.goSetCommandHidden( "znotes_tbconsole_command",
            !Utils.IS_DEBUG_ENABLED, window );
          Common.goUpdateCommand( "znotes_tbconsole_command", platformController.getId(), window );
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

  // COMMANDS

  var platformCommands = {
    "znotes_tbopenmaintab_command": null,
    "znotes_tbnewbook_command": null,
    "znotes_tbnewnote_command": null,
    "znotes_tbsaveasnote_command": null,
    "znotes_tbopenoptionsdialog_command": null,
    "znotes_tbtestsuite_command": null,
    "znotes_tbconsole_command": null,
    "znotes_tbshowmainmenubar_command": null,
    "znotes_tbshowmaintoolbar_command": null,
    "znotes_tbopenhelp_command": null,
    "znotes_tbopenabout_command": null
  };

  var platformController = {
    supportsCommand: function( cmd ) {
      if ( !( cmd in platformCommands ) ) {
        return false;
      }
      return true;
    },
    isCommandEnabled: function( cmd ) {
      if ( !( cmd in platformCommands ) ) {
        return false;
      }
      if ( !isMainLoaded &&
           cmd !== "znotes_tbopenmaintab_command" &&
           cmd !== "znotes_tbnewbook_command" ) {
        return false;
      }
      switch ( cmd ) {
        case "znotes_tbopenmaintab_command":
        case "znotes_tbnewbook_command":
          return true;
        case "znotes_tbnewnote_command":
          return Common.isCommandEnabled( "znotes_newnote_command", null, mainWindow );
        case "znotes_tbsaveasnote_command":
          return ( getNumSelectedMessages() > 0 ) &&
                 Common.isCommandEnabled( "znotes_newnote_command", null, mainWindow );
        case "znotes_tbopenoptionsdialog_command":
          return Common.isCommandEnabled( "znotes_openoptionsdialog_command", null, mainWindow );
        case "znotes_tbtestsuite_command":
          return Common.isCommandEnabled( "znotes_testsuite_command", null, mainWindow );
        case "znotes_tbconsole_command":
          return Common.isCommandEnabled( "znotes_console_command", null, mainWindow );
        case "znotes_tbshowmainmenubar_command":
          return Common.isCommandEnabled( "znotes_showmainmenubar_command", null, mainWindow );
        case "znotes_tbshowmaintoolbar_command":
          return Common.isCommandEnabled( "znotes_showmaintoolbar_command", null, mainWindow );
        case "znotes_tbopenhelp_command":
          return Common.isCommandEnabled( "znotes_openhelp_command", null, mainWindow );
        case "znotes_tbopenabout_command":
          return Common.isCommandEnabled( "znotes_openabout_command", null, mainWindow );
      }
      return false;
    },
    doCommand: function( cmd ) {
      switch ( cmd ) {
        case "znotes_tbopenmaintab_command":
          doOpenMainWindow();
          break;
        case "znotes_tbnewbook_command":
          doNewBook();
          break;
        case "znotes_tbnewnote_command":
          Common.goDoCommand(
            "znotes_newnote_command",
            mainWindow.document.getElementById( "znotes_newnote_command" )
          );
          break;
        case "znotes_tbsaveasnote_command":
          doSaveMessages();
          break;
        case "znotes_tbopenoptionsdialog_command":
          Common.goDoCommand(
            "znotes_openoptionsdialog_command",
            mainWindow.document.getElementById( "znotes_openoptionsdialog_command" )
          );
          break;
        case "znotes_tbtestsuite_command":
          Common.goDoCommand(
            "znotes_testsuite_command",
            mainWindow.document.getElementById( "znotes_testsuite_command" )
          );
          break;
        case "znotes_tbconsole_command":
          Common.goDoCommand(
            "znotes_console_command",
            mainWindow.document.getElementById( "znotes_console_command" )
          );
          break;
        case "znotes_tbshowmainmenubar_command":
          Common.goDoCommand(
            "znotes_showmainmenubar_command",
            mainWindow.document.getElementById( "znotes_showmainmenubar_command" )
          );
          break;
        case "znotes_tbshowmaintoolbar_command":
          Common.goDoCommand(
            "znotes_showmaintoolbar_command",
            mainWindow.document.getElementById( "znotes_showmaintoolbar_command" )
          );
          break;
        case "znotes_tbopenhelp_command":
          Common.goDoCommand(
            "znotes_openhelp_command",
            mainWindow.document.getElementById( "znotes_openhelp_command" )
          );
          break;
        case "znotes_tbopenabout_command":
          Common.goDoCommand(
            "znotes_openabout_command",
            mainWindow.document.getElementById( "znotes_openabout_command" )
          );
          break;
      }
    },
    onEvent: function( event ) {
    },
    getName: function() {
      return "PLATFORM";
    },
    getCommand: function( cmd ) {
      if ( !( cmd in platformCommands ) ) {
        return null;
      }
      return document.getElementById( cmd );
    },
    updateCommands: function() {
      for ( var cmd in platformCommands ) {
        if ( cmd !== "znotes_tbnewbook_command" ) {
          Common.goUpdateCommand( cmd, this.getId(), window );
        }
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
          "An error occurred registering '" + this.getName() +
          "' controller: " + e
        );
      }
    },
    unregister: function() {
      for ( var cmd in platformCommands ) {
        Common.goSetCommandEnabled( cmd, false, window );
      }
      try {
        window.controllers.removeController( this );
      } catch ( e ) {
        Components.utils.reportError(
          "An error occurred unregistering '" + this.getName() +
          "' controller: " + e
        );
      }
    }
  };
  
  function updateCommands() {
    platformController.updateCommands();
  };

  function updateCommandsVisibility() {
    Common.goSetCommandHidden( "znotes_tbtestsuite_command", !Utils.IS_DEBUG_ENABLED, window );
    Common.goSetCommandHidden( "znotes_tbconsole_command", !Utils.IS_DEBUG_ENABLED, window );
  };

  function doNewBook() {
    var defaultDriver =
      ru.akman.znotes.DriverManager.getInstance().getDefaultDriver();
    var params = {
      input: {
        name: Utils.STRINGS_BUNDLE.getString( "main.book.newName" ),
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
      return;
    }
    var books = new ru.akman.znotes.core.BookList();
    books.load();
    var newBook = books.createBook( params.output.name );
    newBook.setDescription( params.output.description );
    newBook.setDriver( params.output.driver );
    newBook.setConnection( params.output.connection );
    doOpenMainWindow();
  };
  
  function doSaveMessages() {
    var messageURIs = mailWindow.gFolderDisplay.selectedMessageUris;
    if ( !messageURIs ) {
      return;
    }
    var params = Common.createCommandParamsObject();
    if ( !params ) {
      return;
    }
    params.setStringValue( "messageURIs", messageURIs.join( "\n" ) );
    Common.goDoCommandWithParams(
      "znotes_savemessage_command",
      params,
      mainWindow.document.getElementById( "znotes_dummy_command" )
    );
  };
  
  function doOpenMainWindow( background ) {
    if ( mainWindow ) {
      Utils.openMainTab( true );
    } else {
      sessionManager.init();
      var persistedState = sessionManager.getPersistedState();
      if ( persistedState.tabs.length > 0 ) {
        Utils.openMainTab( !background, persistedState );
      } else {
        Utils.openMainTab( !background, null );
      }
    }
  };
  
  // FOLDER & THREAD TREE
  
  function getNumSelectedMessages() {
    return mailWindow.gDBView ? mailWindow.gDBView.numSelected : 0;
  };
  
  function onMessengerFocus( event ) {
    Common.goUpdateCommand( "znotes_tbsaveasnote_command", platformController.getId(), window );
  };

  // SHORTCUTS

  function setupKeyset() {
    keySet = new ru.akman.znotes.Keyset(
      document.getElementById( "znotes_platform_keyset" )
    );
  };

  function updateKeyset() {
    var shortcuts = {};
    try {
      shortcuts = JSON.parse( Utils.PLATFORM_SHORTCUTS );
      if ( typeof( shortcuts ) !== "object" ) {
        shortcuts = {};
      }
    } catch ( e ) {
      Utils.log( e );
      shortcuts = {};
    }
    keySet.update( shortcuts );
    Utils.updateKeyAttribute(
      document.getElementById( "mail-menubar" ) );
    Utils.updateKeyAttribute(
      document.getElementById( "appmenuPrimaryPane" ) );
    Utils.updateKeyAttribute(
      document.getElementById( "appmenuSecondaryPane" ) );
    Utils.updateKeyAttribute(
      document.getElementById( "mailContext" ) );
    var button_newMsgPopup = document.getElementById( "button-newMsgPopup" );
    if ( button_newMsgPopup ) {
      Utils.updateKeyAttribute( button_newMsgPopup );
    }
  };
  
  // TABS
  
  function setupTabs() {
    var tabMail = ru.akman.znotes.Utils.getTabMail();
    if ( !tabMail ) {
      return;
    }
    tabMail.registerTabType( ru.akman.znotes.MainTabType );
    tabMail.registerTabType( ru.akman.znotes.ContentTabType );
    tabMail.registerTabMonitor( tabMonitor );
  };

  // PERSISTING STATE
  
  function getState() {
    var state = {
      open: false,
      active: false
    };
    if ( !prefsBundle.hasPref( "isOpened" ) ) {
      prefsBundle.setBoolPref( "isOpened", false );
    } else {
      state.open = prefsBundle.getBoolPref( "isOpened" );
    }
    if ( !prefsBundle.hasPref( "isActive" ) ) {
      prefsBundle.setBoolPref( "isActive", false );
    } else {
      state.active = prefsBundle.getBoolPref( "isActive" );
    }
    return state;
  };

  // INIT
  
  function addMessengerListeners() {
    folderTree = mailWindow.document.getElementById( "folderTree" );
    threadTree = mailWindow.document.getElementById( "threadTree" );
    folderTree.addEventListener( "focus", onMessengerFocus, false );
    folderTree.addEventListener( "blur", onMessengerFocus, false );
    threadTree.addEventListener( "focus", onMessengerFocus, false );
    threadTree.addEventListener( "blur", onMessengerFocus, false );
  };
  
  function init() {
    Utils.initGlobals();
    mailWindow = Utils.getMail3PaneWindow();
    mailWindow.addEventListener( "close", ru.akman.znotes.ZNotes.close, false );
    prefsBundle.loadPrefs();
    mainWindowState = getState();
    addMessengerListeners();
  };
  
  // PUBLIC

  pub.load = function( event ) {
    window.removeEventListener( "load", ru.akman.znotes.ZNotes.load, false );
    init();
    setupTabs();
    setupKeyset();
    updateKeyset();
    platformController.register();
    prefsBundleObserver.register();
    prefsMozillaObserver.register();
    platformShutdownObserver.register();
    mainStartupObserver.register();
    mainShutdownObserver.register();
    updateCommandsVisibility();
    if ( mainWindowState.open ) {
      doOpenMainWindow( !mainWindowState.active );
    }
  };
  
  pub.close = function( event ) {
    Utils.IS_QUIT_ENABLED = true;
    // uncomment this to confirming closing tb window
    // observerService.notifyObservers( null, "znotes-quit-requested", null );
    if ( !Utils.IS_QUIT_ENABLED ) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
    tabMonitor.setActive( false );
    observerService.notifyObservers( null, "znotes-quit-accepted", null );
    return true;
  };
  
  return pub;

}();

window.addEventListener( "load", ru.akman.znotes.ZNotes.load, false );
