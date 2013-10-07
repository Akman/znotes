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
Components.utils.import( "resource://znotes/sessionmanager.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/tabmonitor.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/prefsmanager.js",
  ru.akman.znotes
);

ru.akman.znotes.ZNotes = function() {

  var pub = {};

  var Utils = ru.akman.znotes.Utils;

  //
  // C O M M A N D S
  //

  var platformCommands = {
    "znotes_openmaintab_command": null
  };

  var platformController = {
    supportsCommand: function( cmd ) {
      //Utils.log( this.getName() + "::supportsCommand() '" + cmd + "'" );
      if ( !( cmd in platformCommands ) ) {
        return false;
      }
      return true;
    },
    isCommandEnabled: function( cmd ) {
      //Utils.log( this.getName() + "::isCommandEnabled() '" + cmd + "'" );
      if ( !( cmd in platformCommands ) ) {
        return false;
      }
      return true;
    },
    doCommand: function( cmd ) {
      Utils.log( this.getName() + "::doCommand() '" + cmd + "'" );
      if ( !( cmd in platformCommands ) ) {
        return;
      }
      switch ( cmd ) {
        case "znotes_openmaintab_command":
          openMainTab( true );
          break;
      }
    },
    onEvent: function( event ) {
      Utils.log( this.getName() + "::onEvent() '" + event + "'" );
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
    register: function() {
      Utils.appendAccelText( platformCommands, document );
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
      Utils.removeAccelText( platformCommands, document );
    }
  };
  
  // T A B S
  
  function setupTabs() {
    var tabMail = ru.akman.znotes.Utils.getTabMail();
    if ( !tabMail ) {
      return;
    }
    tabMail.registerTabType( ru.akman.znotes.MainTabType );
    tabMail.registerTabType( ru.akman.znotes.ContentTabType );
    tabMail.registerTabMonitor( ru.akman.znotes.TabMonitor );
  };

  // P E R S I S T I N G  S T A T E
  
  function getState() {
    var state = {
      open: false,
      active: false
    };
    var prefsManager = ru.akman.znotes.PrefsManager.getInstance();
    if ( !prefsManager.hasPref( "isOpened" ) ) {
      prefsManager.setBoolPref( "isOpened", false );
    } else {
      state.open = prefsManager.getBoolPref( "isOpened" );
    }
    if ( !prefsManager.hasPref( "isActive" ) ) {
      prefsManager.setBoolPref( "isActive", false );
    } else {
      state.active = prefsManager.getBoolPref( "isActive" );
    }
    return state;
  };

  function openMainTab( isActive, persistedState ) {
    var mail3PaneWindow = ru.akman.znotes.Utils.getMail3PaneWindow();
    var tabMail = ru.akman.znotes.Utils.getTabMail();
    if ( tabMail ) {
      setTimeout(
        function() { 
          tabMail.openTab(
            "znotesMainTab",
            {
              contentPage: "chrome://znotes/content/main.xul",
              background: !isActive,
              persistedState: persistedState
            }
          );
        },
        0
      );
    } else if ( mail3PaneWindow ) {
      setTimeout(
        function() { 
          mail3PaneWindow.openDialog(
            "chrome://messenger/content/",
            "_blank",
            "chrome,dialog=no,all,centerscreen",
            null,
            {
              tabType: "znotesMainTab",
              tabParams: {
                contentPage: "chrome://znotes/content/main.xul",
                background: !isActive,
                persistedState: persistedState
              }
            }
          );
        },
        0
      );
    } else {
      window.openDialog(
        "chrome://znotes/content/main.xul",
        "_blank",
        "chrome,dialog=no,all,centerscreen",
        {
          contentPage: "chrome://znotes/content/main.xul",
          background: !isActive,
          persistedState: persistedState
        }
      );
    }
  };

  pub.load = function() {
    window.removeEventListener( "load", ru.akman.znotes.ZNotes.load, false );
    setupTabs();
    platformController.register();
    var state = getState();
    var persistedState = ru.akman.znotes.SessionManager.getPersistedState();
    if ( persistedState.tabs.length > 0 ) {
      openMainTab( state.active, persistedState );
    } else {
      if ( state.open ) {
        openMainTab( state.active, null );
      }
    }
  };
  
  return pub;

}();

window.addEventListener( "load"  , ru.akman.znotes.ZNotes.load, false );
