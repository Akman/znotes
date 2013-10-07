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

ru.akman.znotes.ZNotes = function() {

  var pub = {};

  var Utils = ru.akman.znotes.Utils;

  //
  // OBSERVERS
  //
  
  var observers = [];
  
  function notifyObservers( event ) {
    for ( var i = 0; i < observers.length; i++ ) {
      if ( observers[i][ "on" + event.type ] ) {
        observers[i][ "on" + event.type ]( event );
      }
    }
  };
  
  //
  // COMMANDS
  //

  var platformCommands = {
  };

  var platformController = {
    supportsCommand: function( cmd ) {
      Utils.log( this.getName() + "::supportsCommand() '" + cmd + "' = true" );
      if ( !( cmd in platformCommands ) ) {
        return false;
      }
      return true;
    },
    isCommandEnabled: function( cmd ) {
      Utils.log( this.getName() + "::isCommandEnabled() '" + cmd + "' = true" );
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
  
  // PUBLIC  

  pub.addObserver = function( aObserver ) {
    if ( observers.indexOf( aObserver ) < 0 ) {
      observers.push( aObserver );
    }
  };

  pub.removeObserver = function( aObserver ) {
    var index = observers.indexOf( aObserver );
    if ( index < 0 ) {
      return;
    }
    observers.splice( index, 1 );
  };
  
  pub.load = function() {
    window.removeEventListener( "load", ru.akman.znotes.ZNotes.load, false );
    platformController.register();
    document.getElementById( "znotes_maintabbrowser" )
            .setAttribute( "src", "chrome://znotes/content/main.xul" );
    notifyObservers(
      new ru.akman.znotes.core.Event(
        "PlatformLoad",
        {}
      )
    );
  };

  pub.unload = function() {
    platformController.unregister();
    notifyObservers(
      new ru.akman.znotes.core.Event(
        "PlatformUnload",
        {}
      )
    );
    closeAllWindows();
  };
  
  pub.close = function( event ) {
    var data = {
      canClose: true
    };
    notifyObservers(
      new ru.akman.znotes.core.Event(
        "PlatformClose",
        data
      )
    );
    if ( !data.canClose ) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    return true;
  };
  
  return pub;

}();

window.addEventListener( "load"  , ru.akman.znotes.ZNotes.load, false );
window.addEventListener( "close", ru.akman.znotes.ZNotes.close, false );
window.addEventListener( "unload"  , ru.akman.znotes.ZNotes.unload, false );
