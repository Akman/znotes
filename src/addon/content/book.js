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
Cu.import( "resource://znotes/drivermanager.js", ru.akman.znotes );

ru.akman.znotes.Book = function() {

  var Utils = ru.akman.znotes.Utils;

  var log = Utils.getLogger( "content.book" );

  var pub = {};

  var drivers = null;

  var driver = null;
  var params = null;

  var paramName = null;
  var paramDescription = null;
  var paramDriver = null;

  var originalConnection = {};
  var currentConnection = {};

  var textBookName = null;
  var textBookDescription = null;
  var menuBookDriver = null;

  var bookStringBundleset = null;
  var paramsView = null;

  function clearContent( element ) {
    while ( element.firstChild ) {
      element.removeChild( element.firstChild );
    }
    return element;
  };

  function onMenuBookDriverSelect( event ) {
    driver = drivers[menuBookDriver.selectedItem.value];
    params = driver.getParams();
    currentConnection = driver.getParameters();
    Utils.fillObject( originalConnection, currentConnection );
    clearContent( bookStringBundleset );
    clearContent( paramsView );
    document.loadOverlay(
      driver.getURL() + "params.xul",
      {
        observe: function( subject, topic, data ) {
          if ( topic == "xul-overlay-merged" ) {
            window.sizeToContent();
            window.centerWindowOnScreen();
            params.open( window, document, driver, originalConnection, currentConnection );
          }
        }
      }
    );
  };

  function createMenuBookDriver() {
    for ( var name in drivers ) {
      var info = drivers[name].getInfo();
      menuBookDriver.appendItem(
        " " + info.name +
        " " + info.version,
        name,
        " " + info.description
      );
    }
    menuBookDriver.addEventListener( "select", onMenuBookDriverSelect, false );
  };

  function selectMenuBookDriver( aName ) {
    var name, index = -1, i = 0;
    for ( name in drivers ) {
      if ( name === aName ) {
        index = i;
        break;
      }
      i++;
    }
    menuBookDriver.selectedIndex = index;
  };

  pub.onLoad = function() {
    paramName = window.arguments[0].input.name;
    paramDescription = window.arguments[0].input.description;
    paramDriver = window.arguments[0].input.driver;
    Utils.cloneObject( window.arguments[0].input.connection,
      originalConnection );
    drivers = ru.akman.znotes.DriverManager.getInstance().getDrivers();
    textBookName = document.getElementById( "textBookName" );
    textBookDescription = document.getElementById( "textBookDescription" );
    menuBookDriver = document.getElementById( "menuBookDriver" );
    bookStringBundleset = document.getElementById( "bookStringBundleset" );
    paramsView = document.getElementById( "paramsView" );
    textBookName.setAttribute( "value", paramName );
    textBookDescription.setAttribute( "value", paramDescription );
    createMenuBookDriver();
    selectMenuBookDriver( paramDriver );
  };

  pub.onDialogAccept = function() {
    var args, msg1 = "", msg2 = "", conn = null;
    try {
      conn = driver.getConnection( currentConnection );
    } catch ( e ) {
      log.warn( e + "\n" + Utils.dumpStack() );
      msg1 = e.message;
      msg2 = e.param;
    }
    if ( !conn ) {
      args = {
        input: {
          title: Utils.STRINGS_BUNDLE.getString( "main.book.openerror.connection_error" ),
          message1: msg1,
          message2: msg2
        },
        output: null
      };
      currentWindow.openDialog(
        "chrome://znotes/content/messagedialog.xul",
        "",
        "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
        args
      ).focus();
      return false;
    }
    window.arguments[0].output = {};
    window.arguments[0].output.name = textBookName.value.trim();
    window.arguments[0].output.description = textBookDescription.value.trim();
    window.arguments[0].output.driver = menuBookDriver.selectedItem.value;
    window.arguments[0].output.connection = {};
    Utils.cloneObject( currentConnection,
      window.arguments[0].output.connection );
    if ( !conn.exists() || !conn.permits() ) {
      return true;
    }
    params.accept( conn );
    return true;
  };

  return pub;

}();

window.addEventListener( "load", ru.akman.znotes.Book.onLoad, false );
window.addEventListener( "dialogaccept", ru.akman.znotes.Book.onDialogAccept, false );
