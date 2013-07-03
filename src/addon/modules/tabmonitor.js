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

Components.utils.import( "resource://znotes/utils.js"          , ru.akman.znotes );
Components.utils.import( "resource://znotes/sessionmanager.js" , ru.akman.znotes );
Components.utils.import( "resource://znotes/prefsmanager.js"   , ru.akman.znotes );

var EXPORTED_SYMBOLS = ["TabMonitor"];

var TabMonitor = function() {

  var prefsManager = ru.akman.znotes.PrefsManager.getInstance();

  var pub = {

    monitorName: "znotesMonitor",

    onTabTitleChanged: function( aTab ) {
      if ( aTab.mode.name == "znotesContentTab" ) {
        ru.akman.znotes.SessionManager.updateState( aTab );
      }
    },

    onTabOpened: function( aTab ) {
      if ( aTab.mode.name == "znotesMainTab" ) {
        prefsManager.setBoolPref( "isOpened", true );
      }
      if ( aTab.mode.name == "znotesContentTab" ) {
        ru.akman.znotes.SessionManager.updateState( aTab, { opened: true, background: true } );
      }
    },

    onTabClosing: function( aTab ) {
      if ( aTab.mode.name == "znotesMainTab" ) {
        prefsManager.setBoolPref( "isOpened", false );
      }
      if ( aTab.mode.name == "znotesContentTab" ) {
        ru.akman.znotes.SessionManager.updateState( aTab, { opened: false } );
      }
    },

    onTabPersist: function( aTab ) {
    },

    onTabRestored: function( aTab ) {
    },

    // Unfortunately, tabmail doesn't provide a hideTab function on the tab
    // type definitions. To make sure the commands are correctly disabled,
    // we want to update template commands when switching away from
    // those tabs.
    onTabSwitched: function( aNewTab, anOldTab ) {
      if ( anOldTab.mode.name == "znotesMainTab" ) {
        prefsManager.setBoolPref( "isActive", false );
      }
      if ( anOldTab.mode.name == "znotesContentTab" ) {
        ru.akman.znotes.SessionManager.updateState( anOldTab, { background: true } );
      }
      if ( aNewTab.mode.name == "znotesMainTab" ) {
        prefsManager.setBoolPref( "isActive", true );
      }
      if ( aNewTab.mode.name == "znotesContentTab" ) {
        ru.akman.znotes.SessionManager.updateState( aNewTab, { background: false } );
      }
    }

  };

  return pub;

}();
