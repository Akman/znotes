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

Components.utils.import( "resource://znotes/utils.js" , ru.akman.znotes );
Components.utils.import( "resource://znotes/sessionmanager.js" , ru.akman.znotes );

ru.akman.znotes.Viewer = function() {

  var currentPage = null;
  var currentNote = null;
  var currentBackground = null;
  var currentStyle = null;

  var title = null;
  var currentStatusbar = null;  
  var currentTab = null;
  var currentToolbox = null;
  var currentCommandset = null;
  var currentBrowserId = null;
  var body = null;
  var noteStateListener = null;

  function getCurrentTab() {
    var tabMail = ru.akman.znotes.Utils.getTabMail();
    if ( !tabMail ) {
      return null;
    }
    var location = document.location.toString();
    var tabInfo = tabMail.tabInfo;
    for ( var i = 0; i < tabInfo.length; i++ ) {
      var tab = tabInfo[i];
      if ( tab.mode.type == "znotesContentTab" && tab.browser.currentURI.spec == location ) {
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

  function onNoteDeleted( e ) {
    var aCategory = e.data.parentCategory;
    var aNote = e.data.deletedNote;
    if ( currentNote == aNote ) {
      document.defaultView.close();
    }
  };

  var pub = {};

  pub.onLoad = function() {
    currentStatusbar = document.getElementById( "statusbar" );
    if ( ru.akman.znotes.Utils.IS_STANDALONE ) {
      if ( currentStatusbar.hasAttribute( "hidden" ) ) {
        currentStatusbar.removeAttribute( "hidden" );
      }
    } else {
      currentStatusbar.setAttribute( "hidden", "true" );
      currentStatusbar = ru.akman.znotes.Utils.MAIN_WINDOW.document.getElementById( "status-bar" );
    }
    currentNote = null;
    currentTab = getCurrentTab();
    if ( currentTab ) {
      //
      currentPage = currentTab.contentPage;
      currentNote = currentTab.note;
      currentBackground = currentTab.background;
      currentStyle = currentTab.style;
      //
      currentBrowserId = currentTab.browserId;
      currentToolbox = currentTab.toolbox;
      currentCommandset = currentTab.commandset;
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
      currentBrowserId = null;
      currentToolbox = null;
      currentCommandset = null;
    }
    if ( !currentNote ) {
      var tabMail = ru.akman.znotes.Utils.getTabMail();
      if ( tabMail ) {
        tabMail.closeTab();
        return;
      }
    }
    noteStateListener = {
      name: "VIEWER",
      onNoteChanged: onNoteChanged,
      onNoteDeleted: onNoteDeleted
    };
    currentNote.addStateListener( noteStateListener );
    document.title = currentNote.name;
    body = new ru.akman.znotes.Body(
      {
        name: "viewer",
        window: window,
        document: document,
        mode: "viewer",
        style: currentStyle,
        commands: {
        },
        toolbox: currentToolbox,
        commandset: currentCommandset,
        browserid: currentBrowserId
      }
    );
    body.show( currentNote );
  };

  pub.onUnLoad = function() {
    if ( currentNote ) {
      currentNote.removeStateListener( noteStateListener );
    }
    if ( body ) {
      body.unload();
    }
  };

  return pub;

}();

window.addEventListener( "load"  , function() { ru.akman.znotes.Viewer.onLoad(); }, false );
window.addEventListener( "unload"  , function() { ru.akman.znotes.Viewer.onUnLoad(); }, false );
