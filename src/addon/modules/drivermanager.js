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

var EXPORTED_SYMBOLS = ["DriverManager"];

var DriverManager = function() {

  var Utils = ru.akman.znotes.Utils;

  var pub = {};

  var drivers = null;

  function registerDriver( directoryName ) {
    var url = "chrome://znotes_drivers/content/" +
              directoryName + "/driver.js";
    unregisterDriver( directoryName );
    if ( !ru ) var ru = {};
    if ( !ru.akman ) ru.akman = {};
    if ( !ru.akman.znotes ) ru.akman.znotes = {};
    if ( !ru.akman.znotes.data ) ru.akman.znotes.data = {};
    try {
      ru.akman.znotes.data[ directoryName ] = {};
      Components.utils.import( url, ru.akman.znotes.data[ directoryName ] );
      var driver = ru.akman.znotes.data[ directoryName ].Driver;
      drivers[ directoryName ] = driver;
    } catch ( e ) {
      delete ru.akman.znotes.data[ directoryName ];
      throw e;
    }
    return driver;
  };

  function unregisterDriver( directoryName ) {
    if ( !ru ) var ru = {};
    if ( !ru.akman ) ru.akman = {};
    if ( !ru.akman.znotes ) ru.akman.znotes = {};
    if ( !ru.akman.znotes.data ) ru.akman.znotes.data = {};
    if ( ru.akman.znotes.data[ directoryName ] ) {
      delete ru.akman.znotes.data[ directoryName ];
    }
    if ( drivers[ directoryName ] ) {
      delete drivers[ directoryName ];
    }
  };

  // CONSTRUCTOR
  
  function init() {
    if ( drivers ) {
      return;
    }
    drivers = {};
    var driverDirectory = Utils.getDriverDirectory();
    var entries = driverDirectory.directoryEntries;
    var driver = null;
    var name = null;
    var entry = null;
    while( entries.hasMoreElements() ) {
      entry = entries.getNext();
      entry.QueryInterface( Components.interfaces.nsIFile );
      if ( !entry.isDirectory() ) {
        continue;
      }
      name = entry.leafName;
      try {
        driver = registerDriver( name );
      } catch ( e ) {
        driver = null;
        Utils.log( e );
      }
      if ( driver == null ) {
        Utils.log( "Error registering driver: " + entry.path );
      }
    }
  };
  
  // PUBLIC
  
  pub.getDrivers = function() {
    return drivers;
  };

  pub.getDriver = function( driverName ) {
    if ( driverName === "default" ) {
      return pub.getDefaultDriver();
    }
    if ( driverName in drivers ) {
      return drivers[ driverName ];
    }
    return null;
  };

  pub.getDefaultDriver = function() {
    var driver;
    for ( var name in drivers ) {
      driver = drivers[ name ];
      if ( ( "default" in driver ) && driver["default"] ) {
        return driver;
      }
    }
    return null;
  };

  pub.getInstance = function() {
    return this;
  };
  
  init();
  
  return pub;

}();
