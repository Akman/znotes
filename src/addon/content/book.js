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

Components.utils.import( "resource://znotes/utils.js"         , ru.akman.znotes );
Components.utils.import( "resource://znotes/drivermanager.js" , ru.akman.znotes );

ru.akman.znotes.Book = function() {

  var pub = {};

  var drivers = null;
  var bookBox = null;
  var driverBox = null;
  var driverBoxItems = null;
  var textBookName = null;
  var textBookDescription = null;
  var menuBookDriver = null;

  var paramName = null;
  var paramDescription = null;
  var paramDriver = null;
  var paramConnection = null;

  function onFolderPicker( button, textbox ) {
    var nsIFilePicker = Components.interfaces.nsIFilePicker;
    var filePicker = Components.classes["@mozilla.org/filepicker;1"]
                               .createInstance( nsIFilePicker );
    filePicker.init(
      window,
      null,
      nsIFilePicker.modeGetFolder
    );
    var currentFolder = Components.classes["@mozilla.org/file/local;1"]
                                  .createInstance( Components.interfaces.nsIFile );
    try {
      currentFolder.initWithPath( textbox.value );
      while ( !currentFolder.exists() || !currentFolder.isDirectory() ) {
        currentFolder = currentFolder.parent;
      }
      filePicker.displayDirectory = currentFolder;
    } catch ( e ) {
      filePicker.displayDirectory = ru.akman.znotes.Utils.getDataPath();
    }
    var result = filePicker.show();
    if ( result == nsIFilePicker.returnOK || result == nsIFilePicker.returnReplace ) {
      textbox.value = filePicker.file.path;
    }
  };

  function createDriverBoxItem( name, value ) {
    var label = document.createElement( "label" );
    label.setAttribute( "id", "label_" + name );
    label.setAttribute( "value", name );
    driverBox.appendChild( label );
    var hbox = document.createElement( "hbox" );
    hbox.setAttribute( "id", "hbox_" + name );
    hbox.setAttribute( "flex", "1" );
    var textbox = document.createElement( "textbox" );
    textbox.setAttribute( "id", "textbox_" + name );
    textbox.setAttribute( "type", "text" );
    textbox.setAttribute( "value", value );
    textbox.setAttribute( "flex", "1" );
    hbox.appendChild( textbox );
    if ( name == "path" ) {
      var button = document.createElement( "button" );
      button.setAttribute( "id", "button_" + name );
      button.setAttribute( "label", "..." );
      button.addEventListener( "command", function() { onFolderPicker( button, textbox ) }, false );
      hbox.appendChild( button );
    }
    driverBox.appendChild( hbox );
    return textbox;
  };

  function onMenuBookDriverSelect( event ) {
    var driverName = menuBookDriver.selectedItem.value;
    var driver = drivers[driverName];
    var params = driver.getParameters();
    while ( driverBox.firstChild ) {
      driverBox.removeChild( driverBox.firstChild );
    }
    for ( var item in driverBoxItems ) {
      delete driverBoxItems[item];
    }
    for ( var p in params ) {
      if ( p in paramConnection ) {
        driverBoxItems[p] = createDriverBoxItem( p, paramConnection[p] );
      } else {
        driverBoxItems[p] = createDriverBoxItem( p, null );
      }
    }
    window.sizeToContent();
  };

  function createMenuBookDriver() {
    menuBookDriver.removeEventListener( "select", onMenuBookDriverSelect, false );
    menuBookDriver.removeAllItems();
    for ( var driverName in drivers ) {
      var info = drivers[driverName].getInfo();
      menuBookDriver.appendItem(
        " " + info.name +
        " " + info.version,
        driverName,
        " " + info.description
      );
    }
    menuBookDriver.addEventListener( "select", onMenuBookDriverSelect, false );
  };

  function selectMenuBookDriver( driver ) {
    var index = -1;
    var i = 0;
    for ( var driverName in drivers ) {
      if ( driverName == driver ) {
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
    paramConnection = window.arguments[0].input.connection;
    drivers = ru.akman.znotes.DriverManager.getInstance().getDrivers();
    bookBox = document.getElementById( "bookBox" );
    textBookName = document.getElementById( "textBookName" );
    textBookName.setAttribute( "value", paramName );
    textBookDescription = document.getElementById( "textBookDescription" );
    textBookDescription.setAttribute( "value", paramDescription );
    driverBox = document.getElementById( "driverBox" );
    driverBoxItems = {};
    menuBookDriver = document.getElementById( "menuBookDriver" );
    createMenuBookDriver();
    selectMenuBookDriver( paramDriver );
  };

  pub.onDialogAccept = function() {
    window.arguments[0].output = {};
    window.arguments[0].output.name = textBookName.value.replace( /\(|\)/g, "" );
    window.arguments[0].output.description = textBookDescription.value.replace( /\(|\)/g, "" );
    window.arguments[0].output.driver = menuBookDriver.selectedItem.value;
    window.arguments[0].output.connection = {};
    for ( var name in driverBoxItems ) {
      var value = driverBoxItems[name].value;
      window.arguments[0].output.connection[name] = value;
    }
    return true;
  };

  return pub;

}();

window.addEventListener( "load"  , function() { ru.akman.znotes.Book.onLoad(); }, false );
window.addEventListener( "dialogaccept", function() { ru.akman.znotes.Book.onDialogAccept(); }, false );
