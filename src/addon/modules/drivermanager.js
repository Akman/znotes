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

  var pub = {};

  var drivers = {};

  pub.registerDriver = function( driverName ) {
    var url = "chrome://znotes_drivers/content/" + driverName + "/driver.js";
    pub.unregisterDriver( driverName );
    if ( !ru ) var ru = {};
    if ( !ru.akman ) ru.akman = {};
    if ( !ru.akman.znotes ) ru.akman.znotes = {};
    if ( !ru.akman.znotes.data ) ru.akman.znotes.data = {};
    try {
      ru.akman.znotes.data[ driverName ] = {};
      Components.utils.import( url, ru.akman.znotes.data[ driverName ] );
      var driver = ru.akman.znotes.data[ driverName ].Driver;
      drivers[ driverName ] = driver;
    } catch ( e ) {
      delete ru.akman.znotes.data[ driverName ];
      throw e;
    }
    return driver;
  };

  pub.unregisterDriver = function( driverName ) {
    if ( !ru ) var ru = {};
    if ( !ru.akman ) ru.akman = {};
    if ( !ru.akman.znotes ) ru.akman.znotes = {};
    if ( !ru.akman.znotes.data ) ru.akman.znotes.data = {};
    if ( ru.akman.znotes.data[ driverName ] ) {
      delete ru.akman.znotes.data[ driverName ];
    }
    if ( drivers[ driverName ] ) {
      delete drivers[ driverName ];
    }
  };

  pub.getDrivers = function() {
    return drivers;
  };

  pub.getDriver = function( driverName ) {
    if ( driverName in drivers ) {
      return drivers[ driverName ];
    }
    return null;
  };

  pub.getDefaultDriver = function() {
    if ( "default" in drivers ) {
      return drivers[ "default" ];
    }
    return null;
  };

  return pub;

}();
