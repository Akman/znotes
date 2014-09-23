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
Cu.import( "resource://znotes/prefsmanager.js", ru.akman.znotes );
Cu.import( "resource://znotes/keyset.js", ru.akman.znotes );

ru.akman.znotes.Viewer = function() {

  var Utils = ru.akman.znotes.Utils;
  var log = Utils.getLogger( "content.viewer" );

  var Common = ru.akman.znotes.Common;

  var ioService = Cc["@mozilla.org/network/io-service;1"].getService(
    Ci.nsIIOService );

  var observerService = Cc["@mozilla.org/observer-service;1"].getService(
    Ci.nsIObserverService );

  var prefsBundle = ru.akman.znotes.PrefsManager.getInstance();

  var keySet = null;

  var currentPage = null;
  var currentNote = null;
  var currentBackground = null;
  var currentStyle = null;
  var currentStatusbar = null;
  var currentStatusbarPanel = null;
  var currentStatusbarLogo = null;
  var currentStatusbarLabel = null;
  var currentToolbox = null;
  var currentTab = null;
  var noteBodyView = null;

  var body = null;
  var noteStateListener = null;

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
            currentStatusbarLabel.setAttribute( "value", aData );
          } else {
            currentStatusbarLabel.setAttribute( "value", "" );
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

  // COMMANDS

  var viewerCommands = {
  };

  var viewerController = {
    supportsCommand: function( cmd ) {
      if ( !( cmd in viewerCommands ) ) {
        return false;
      }
      return true;
    },
    isCommandEnabled: function( cmd ) {
      if ( !( cmd in viewerCommands ) ) {
        return false;
      }
      return true;
    },
    doCommand: function( cmd ) {
      if ( !( cmd in viewerCommands ) ) {
        return;
      }
    },
    onEvent: function( event ) {
    },
    getName: function() {
      return "VIEWER";
    },
    getCommand: function( cmd ) {
      if ( cmd in viewerCommands ) {
        return document.getElementById( cmd );
      }
      return null;
    },
    updateCommands: function() {
      for ( var cmd in viewerCommands ) {
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
        log.warn(
          "An error occurred registering '" + this.getName() +
          "' controller\n" + e
        );
      }
    },
    unregister: function() {
      for ( var cmd in viewerCommands ) {
        Common.goSetCommandEnabled( cmd, false, window );
      }
      try {
        window.controllers.removeController( this );
      } catch ( e ) {
        log.warn(
          "An error occurred unregistering '" + this.getName() +
          "' controller\n" + e
        );
      }
    }
  };

  var mainBundleObserver = {
    observe: function( aSubject, aTopic, aData ) {
      var tabMail = Utils.getTabMail();
      if ( tabMail ) {
        var tabInfo = tabMail.tabInfo;
        var tabIndex = -1;
        for ( var i = 0; i < tabInfo.length; i++ ) {
          var tab = tabInfo[i];
          if ( tab == currentTab ) {
            tabIndex = i;
            break;
          }
        }
        if ( tabIndex != -1 ) {
          Utils.getTabContainer().selectedIndex = tabIndex;
        }
        Utils.getTabMail().closeTab( currentTab );
      } else {
        var windowService =
          Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(
            Ci.nsIWindowWatcher );
        windowService.activeWindow = window;
        window.focus();
        pub.onClose();
        window.close();
      }
    },
    register: function() {
      observerService.addObserver( this, "znotes-quit-accepted", false );
    },
    unregister: function() {
      observerService.removeObserver( this, "znotes-quit-accepted" );
    }
  };

  var prefsBundleObserver = {
    onPrefChanged: function( event ) {
      switch( event.data.name ) {
        case "shortcuts":
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

  // SHORTCUTS

  function setupKeyset() {
    keySet = new ru.akman.znotes.Keyset(
      document.getElementById( "znotes_keyset" )
    );
  };

  function activateKeyset() {
    keySet.activate();
  };

  function deactivateKeyset() {
    keySet.deactivate();
  };

  function updateKeyset() {
    var shortcuts = {};
    try {
      shortcuts = JSON.parse( Utils.MAIN_SHORTCUTS );
      if ( typeof( shortcuts ) !== "object" ) {
        shortcuts = {};
      }
    } catch ( e ) {
      log.warn( e + "\n" + Utils.dumpStack() );
      shortcuts = {};
    }
    keySet.update( shortcuts );
  };

  // TABS

  function getCurrentTab() {
    var tabMail = Utils.getTabMail();
    if ( !tabMail ) {
      return null;
    }
    var location = document.location.toString();
    var tabInfo = tabMail.tabInfo;
    for ( var i = 0; i < tabInfo.length; i++ ) {
      var tab = tabInfo[i];
      if ( tab.mode.type == "znotesContentTab" &&
        tab.browser.currentURI.spec == location ) {
        return tab;
      }
    }
    return null;
  };

  // NOTE EVENTS

  function onNoteChanged( e ) {
    var aCategory = e.data.parentCategory;
    var aNote = e.data.changedNote;
    if ( currentNote == aNote ) {
      document.title = currentNote.name;
    }
  };

  function onNoteTypeChanged( e ) {
    var aCategory = e.data.parentCategory;
    var aNote = e.data.changedNote;
    var aBook = aCategory.getBook();
    if ( currentNote && currentNote == aNote && !currentNote.isLoading() ) {
      body.show( currentNote, true );
    }
  };

  function onNoteDeleted( e ) {
    var aCategory = e.data.parentCategory;
    var aNote = e.data.deletedNote;
    if ( currentNote == aNote ) {
      if ( currentTab ) {
        Utils.getTabMail().closeTab( currentTab );
      } else {
        pub.onClose();
        window.close();
      }
    }
  };

  var pub = {};

  pub.onLoad = function() {
    var mainWindow = Utils.MAIN_WINDOW;
    setupKeyset();
    noteBodyView = document.getElementById( "noteBodyView" );
    if ( Utils.IS_STANDALONE ) {
      noteBodyView.classList.add( "noteBodyViewXR" );
    }
    currentToolbox = document.getElementById( "znotes_viewertoolbox" );
    currentStatusbar = document.getElementById( "znotes_statusbar" );
    currentStatusbarPanel = document.getElementById(
      "znotes_statusbarpanel" );
    currentStatusbarLogo = document.getElementById(
      "znotes_statusbarpanellogo" );
    currentStatusbarLabel = document.getElementById(
      "znotes_statusbarpanellabel" );
    if ( !Utils.IS_STANDALONE ) {
      currentStatusbar.setAttribute( "hidden", "true" );
      currentStatusbar = mainWindow.document.getElementById( "status-bar" );
      currentStatusbarPanel = mainWindow.document.getElementById(
        "znotes_statusbarpanel" );
      currentStatusbarLogo = mainWindow.document.getElementById(
        "znotes_statusbarpanellogo" );
      currentStatusbarLabel = mainWindow.document.getElementById(
        "znotes_statusbarpanellabel" );
    }
    currentNote = null;
    currentTab = getCurrentTab();
    if ( currentTab ) {
      currentPage = currentTab.contentPage;
      currentNote = currentTab.note;
      currentBackground = currentTab.background;
      currentStyle = currentTab.style;
    }
    if ( !currentNote ) {
      if ( window.arguments.length == 4 ) {
        currentPage = window.arguments[0];
        currentNote = window.arguments[1];
        currentBackground = window.arguments[2];
        currentStyle = window.arguments[3];
      }
      if ( !currentNote ) {
        window.close();
      }
    }
    if ( !currentNote ) {
      var tabMail = Utils.getTabMail();
      if ( tabMail ) {
        tabMail.closeTab( currentTab );
        return;
      }
    }
    noteStateListener = {
      name: "VIEWER",
      onNoteChanged: onNoteChanged,
      onNoteDeleted: onNoteDeleted,
      onNoteTypeChanged: onNoteTypeChanged
    };
    currentNote.addStateListener( noteStateListener );
    document.title = currentNote.getName();
    viewerController.register();
    prefsBundleObserver.register();
    mainBundleObserver.register();
    helperObserver.register();
    body = new ru.akman.znotes.Body(
      {
        window: window,
        name: "viewer",
        mode: "viewer",
        style: currentStyle,
        toolbox: currentToolbox
      }
    );
    updateKeyset();
    activateKeyset();
    body.show( currentNote );
  };

  pub.onClose = function() {
    helperObserver.unregister();
    mainBundleObserver.unregister();
    prefsBundleObserver.unregister();
    viewerController.unregister();
    deactivateKeyset();
    if ( currentNote && currentNote.isExists() ) {
      currentNote.removeStateListener( noteStateListener );
      if ( body ) {
        body.release();
      }
    }
    return true;
  };

  return pub;

}();

window.addEventListener( "load", ru.akman.znotes.Viewer.onLoad, false );
window.addEventListener( "close", ru.akman.znotes.Viewer.onClose, false );
