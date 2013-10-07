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

ru.akman.znotes.Viewer = function() {

  var Utils = ru.akman.znotes.Utils;

  var currentPage = null;
  var currentNote = null;
  var currentBackground = null;
  var currentStyle = null;
  var currentStatusbar = null;  
  var currentToolbox = null;
  var currentTab = null;

  var body = null;
  var noteStateListener = null;

  //
  // C O M M A N D S
  //

  var viewerCommands = {
  };

  var viewerController = {
    supportsCommand: function( cmd ) {
      if ( !( cmd in viewerCommands ) ) {
        return false;
      }
      Utils.log( this.getName() + "::supportsCommand() '" + cmd + "'" );
      return true;
    },
    isCommandEnabled: function( cmd ) {
      if ( !( cmd in viewerCommands ) ) {
        return false;
      }
      Utils.log( this.getName() + "::isCommandEnabled() '" + cmd + "'" );
      return true;
    },
    doCommand: function( cmd ) {
      if ( !( cmd in viewerCommands ) ) {
        return;
      }
      Utils.log( this.getName() + "::doCommand() '" + cmd + "'" );
    },
    onEvent: function( event ) {
      Utils.log( this.getName() + "::onEvent() '" + event + "'" );
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
    register: function() {
      Utils.appendAccelText( viewerCommands, document );
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
      Utils.removeAccelText( viewerCommands, document );
    }
  };
  
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

  function onNoteDeleted( e ) {
    var aCategory = e.data.parentCategory;
    var aNote = e.data.deletedNote;
    if ( currentNote == aNote ) {
      window.close();
    }
  };

  var pub = {};

  pub.onLoad = function() {
    var mainWindow = Utils.MAIN_WINDOW;
    currentToolbox = document.getElementById( "znotes_viewertoolbox" );
    currentStatusbar = document.getElementById( "znotes_statusbar" );
    currentNote = null;
    currentTab = getCurrentTab();
    if ( currentTab ) {
      currentStatusbar.setAttribute( "hidden", "true" );
      currentStatusbar = mainWindow.document.getElementById( "status-bar" );
      currentPage = currentTab.contentPage;
      currentNote = currentTab.note;
      currentBackground = currentTab.background;
      currentStyle = currentTab.style;
    }
    if ( !currentNote ) {
      if ( window.arguments.length == 4 ) {
        if ( currentStatusbar.hasAttribute( "hidden" ) ) {
          currentStatusbar.removeAttribute( "hidden" );
        }
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
    document.title = currentNote.getName();
    viewerController.register();
    body = new ru.akman.znotes.Body(
      {
        name: "viewer",
        mode: "viewer",
        style: currentStyle,
        toolbox: currentToolbox
      }
    );
    body.show( currentNote );
  };

  pub.onUnLoad = function() {
    if ( currentNote ) {
      currentNote.removeStateListener( noteStateListener );
    }
    if ( body ) {
      body.release();
    }
    viewerController.unregister();
  };

  return pub;

}();

window.addEventListener( "load"  , function() { ru.akman.znotes.Viewer.onLoad(); }, false );
window.addEventListener( "unload"  , function() { ru.akman.znotes.Viewer.onUnLoad(); }, false );
