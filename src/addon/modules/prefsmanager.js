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

Components.utils.import( "resource://znotes/utils.js" , ru.akman.znotes );
Components.utils.import( "resource://znotes/event.js"  , ru.akman.znotes.core );

var EXPORTED_SYMBOLS = ["PrefsManager"];

var PrefsManager = function() {

  var log = ru.akman.znotes.Utils.log;

  var prefs = null;
  var observers = [];

  var getEntry = function() {
    var entry = ru.akman.znotes.Utils.getPlacesPath();
    var placeId = ru.akman.znotes.Utils.getPlaceId();
    entry.append( placeId );
    if ( !entry.exists() || !entry.isDirectory() ) {
      entry.create( Components.interfaces.nsIFile.DIRECTORY_TYPE, parseInt( "0755", 8 ) );
    }
    entry.append( "prefs.json" );
    return entry.clone();
  };

  var loadPrefs = function() {
    var entry = getEntry();
    if ( !entry.exists() ) {
      prefs = {};
      savePrefs();
      return;
    }
    try {
      var data = ru.akman.znotes.Utils.readFileContent( entry, "UTF-8" );
      prefs = JSON.parse( data );
    } catch ( e ) {
      log( e );
      prefs = {};
      savePrefs();
    }
  };

  var savePrefs = function() {
    var entry = getEntry();
    var data = JSON.stringify( prefs );
    ru.akman.znotes.Utils.writeFileContent( entry, "UTF-8", data );
  };
  
  var notifyObservers = function( event ) {
    for ( var i = 0; i < observers.length; i++ ) {
      if ( observers[i][ "on" + event.type ] ) {
        observers[i][ "on" + event.type ]( event );
      }
    }
  };

  var pub = {};

  pub.hasPref = function( name ) {
    return ( name in prefs );
  };

  pub.removePref = function( name ) {
    if ( !pub.hasPref( name ) ) {
      return;
    }
    var value = prefs[name];
    delete prefs[name];
    savePrefs();
    notifyObservers(
      new ru.akman.znotes.core.Event(
        "PrefRemoved",
        {
          name: name,
          value: value
        }
      )
    );
  };
  
  pub.getBoolPref = function( name ) {
    if ( !pub.hasPref( name ) ) {
      return null;
    }
    return prefs[name];
  };

  pub.setBoolPref = function( name, value ) {
    if ( name in prefs && prefs[name] === value ) {
      return;
    }
    var oldValue = prefs[name];
    prefs[name] = value;
    savePrefs();
    notifyObservers(
      new ru.akman.znotes.core.Event(
        "PrefChanged",
        {
          name: name,
          oldValue: oldValue,
          newValue: value
        }
      )
    );
  };

  pub.getCharPref = function( name ) {
    if ( !pub.hasPref( name ) ) {
      return null;
    }
    return prefs[name];
  };

  pub.setCharPref = function( name, value ) {
    if ( name in prefs && prefs[name] === value ) {
      return;
    }
    var oldValue = prefs[name];
    prefs[name] = value;
    savePrefs();
    notifyObservers(
      new ru.akman.znotes.core.Event(
        "PrefChanged",
        {
          name: name,
          oldValue: oldValue,
          newValue: value
        }
      )
    );
  };

  pub.getIntPref = function( name ) {
    if ( !pub.hasPref( name ) ) {
      return null;
    }
    return prefs[name];
  };

  pub.setIntPref = function( name, value ) {
    if ( name in prefs && prefs[name] === value ) {
      return;
    }
    var oldValue = prefs[name];
    prefs[name] = value;
    savePrefs();
    notifyObservers(
      new ru.akman.znotes.core.Event(
        "PrefChanged",
        {
          name: name,
          oldValue: oldValue,
          newValue: value
        }
      )
    );
  };

  pub.getInstance = function() {
    return this;
  };

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

  // C O N S T R U C T O R

  loadPrefs();

  return pub;

}();
