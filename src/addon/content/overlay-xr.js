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
Components.utils.import( "resource://znotes/prefsmanager.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/sessionmanager.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/tabmonitor.js",
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
  var tabMonitor = ru.akman.znotes.TabMonitor.getInstance();

  var mainWindow = null;
  var isMainLoaded = false;
  var keySet = null;
  
  // PLATFORM

  var platformShutdownObserver = {
    observe: function( aSubject, aTopic, aData ) {
      Utils.IS_QUIT_ENABLED = true;
      observerService.notifyObservers( null, "znotes-quit-requested", null );
      if ( Utils.IS_QUIT_ENABLED ) {
        tabMonitor.setActive( false );
        observerService.notifyObservers( null, "znotes-quit-accepted", null );
      }
      aSubject.data = Utils.IS_QUIT_ENABLED;
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
  
  // COMMANDS
  
  var platformCommands = {
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
      var mainWindow = Utils.getZNotesMainWindow();
      return true;
    },
    doCommand: function( cmd ) {
      if ( !( cmd in platformCommands ) ) {
        return;
      }
    },
    onEvent: function( event ) {
    },
    getName: function() {
      return "PLATFORM";
    },
    getCommand: function( cmd ) {
      if ( cmd in platformCommands ) {
        return document.getElementById( cmd );
      }
      return null;
    },
    updateCommands: function() {
      for ( var cmd in platformCommands ) {
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
  };
  
  // HELPERS
  
  function closeAllWindows() {
    var windowService =
      Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                .getService( Components.interfaces.nsIWindowWatcher );
    var windowEnumerator = windowService.getWindowEnumerator();
    while ( windowEnumerator.hasMoreElements() ) {
      win = windowEnumerator.getNext().QueryInterface(
        Components.interfaces.nsIDOMWindow );
      win.close();
    }
  };

  function showNewVersionInfo() {
    var infoURL = "chrome://znotes_changes/content/index_" +
                  Utils.getSiteLanguage() + ".xhtml";
    var win = window.open(
        "chrome://znotes/content/info.xul",
        "znotes:info",
        "chrome,toolbar,status,resizable,centerscreen"
      );
    win.arguments = [ { contentPage: infoURL, windowMode: "maximized" } ];
  };
  
  // PUBLIC

  pub.load = function( event ) {
    window.removeEventListener( "load", ru.akman.znotes.ZNotes.load, false );
    Utils.initGlobals();
    platformShutdownObserver.register();    
    prefsBundle.loadPrefs();
    sessionManager.init();
    setupKeyset();
    updateKeyset();
    platformController.register();
    prefsBundleObserver.register();
    mainStartupObserver.register();
    mainShutdownObserver.register();
    document.getElementById( "znotes_maintabbrowser" )
            .setAttribute( "src", "chrome://znotes/content/main.xul" );
    if ( prefsBundle.getCharPref( "version" ) != Utils.VERSION ) {
      prefsBundle.setCharPref( "version", Utils.VERSION );
      showNewVersionInfo();
    }
  };

  pub.unload = function( event ) {
    platformController.unregister();
    platformShutdownObserver.unregister();    
    closeAllWindows();
    return true;
  };

  pub.close = function( event ) {
    Utils.IS_QUIT_ENABLED = true;
    observerService.notifyObservers( null, "znotes-quit-requested", null );
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
window.addEventListener( "close", ru.akman.znotes.ZNotes.close, false );
window.addEventListener( "unload", ru.akman.znotes.ZNotes.unload, false );
