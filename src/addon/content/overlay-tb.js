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

  var log = ru.akman.znotes.Utils.log;
  
  var setupTabs = function() {
    var tabMail = ru.akman.znotes.Utils.getTabMail();
    tabMail.registerTabType( ru.akman.znotes.MainTabType );
    tabMail.registerTabType( ru.akman.znotes.ContentTabType );
    tabMail.registerTabMonitor( ru.akman.znotes.TabMonitor );
  };

  var getState = function() {
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

  var updateTooltipText = function() {
    setTimeout( function() {
      var command = document.getElementById( "znotes_openmaintab_command" );
      var tooltiptext = command.getAttribute( "tooltiptext" );
      var popupset = document.getElementById( "znotes_popupset" );
      var items = document.createElement( "menupopup" );
      popupset.appendChild( items );
      var item = document.createElement( "menuitem" );
      item.setAttribute( "key", "znotes_openmaintab_key" );
      items.appendChild( item );
      items.openPopup( null, null, 0, 0, true, false, null );
      items.hidePopup();
      var acceltext = item.getAttribute( "acceltext" );
      tooltiptext += "\n" + acceltext;
      command.setAttribute( "tooltiptext", tooltiptext );
      while ( items.firstChild ) {
        items.removeChild( items.firstChild );
      }
      popupset.removeChild( items );
    }, 0 );
  };
  
  pub.load = function() {
    removeEventListener( "load", ru.akman.znotes.ZNotes.load, false );
    updateTooltipText();
    setupTabs();
    var state = getState();
    var persistedState = ru.akman.znotes.SessionManager.getPersistedState();
    if ( persistedState.tabs.length > 0 ) {
      pub.openMainTab( state.active, persistedState );
    } else {
      if ( state.open ) {
        pub.openMainTab( state.active, null );
      }
    }
  };

  pub.openMainTab = function( isActive, persistedState ) {
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

  return pub;

}();

window.addEventListener( "load"  , ru.akman.znotes.ZNotes.load, false );
