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

Components.utils.import( "resource://znotes/utils.js", ru.akman.znotes );
Components.utils.import( "resource://znotes/event.js", ru.akman.znotes.core );
Components.utils.import( "resource://znotes/book.js", ru.akman.znotes.core );
Components.utils.import( "resource://znotes/drivermanager.js", ru.akman.znotes );

var EXPORTED_SYMBOLS = ["BookManager"];

var BookManager = function() {

  var Utils = ru.akman.znotes.Utils;

  var registryPath = null;
  var registryObject = null;

  var books = null;
  var listeners = null;
  var locked = false;
  
  var pub = {};
  
  function getEntry() {
    var entry = Utils.getPlacesPath();
    var placeId = Utils.getPlaceId();
    entry.append( placeId );
    if ( !entry.exists() || !entry.isDirectory() ) {
      entry.create( Components.interfaces.nsIFile.DIRECTORY_TYPE, parseInt( "0755", 8 ) );
    }
    entry.append( "notebooks.json" );
    return entry.clone();
  };
  
  function init() {
    registryPath = getEntry();
    registryObject = [];
    listeners = [];
    books = [];
  };

  pub.getDefaultPreferences = function() {
    return {
      // data
      currentTree: "Categories",
      currentCategory: 0,
      currentTag: 0,
      rootPosition: -1,
      // view
      "folderBoxWidth": "50",
      "bookTreeViewHeight": "250",
      "bookSplitterState": "open",
      "categoryBoxHeight": "700",
      "folderTreeViewHeight": "500",
      "tagSplitterState": "open",
      "tagTreeViewHeight": "300",
      "folderSplitterState": "open",
      "noteBoxWidth": "900",
      "noteTreeViewHeight": "150",
      "noteTreeSplitterState": "open",
      "noteBodyBoxHeight": "900",
      "noteBodyViewHeight": "900",
      "noteMainBoxHeight": "700",
      "noteBodySplitterState": "open",
      "noteAddonsBoxHeight": "100",
      "qfBoxCollapsed": "true"
    };
  };  
  
  pub.updateRegistryObject = function() {
    registryObject.splice( 0, registryObject.length );
    for ( var i = 0; i < books.length; i++ ) {
      var book = books[i];
      var info = {
        id: book.getId(),
        name: book.getName(),
        description: book.getDescription(),
        index: book.getIndex(),
        opened: book.isOpen(),
        driver: book.getDriver(),
        connection: book.getConnection(),
        preferences: book.getPreferences()
      };
      registryObject.push( info );
    }
    var data = JSON.stringify( registryObject );
    Utils.writeFileContent( registryPath, "UTF-8", data );
  };

  pub.loadRegistryObject = function() {
    if ( !registryPath.exists() ) {
      registryObject = [];
      return;
    }
    try {
      registryObject =
        JSON.parse( Utils.readFileContent( registryPath, "UTF-8" ) );
    } catch ( e ) {
      Utils.log( e + "\n" + Utils.dumpStack() );
      registryObject = [];
    }
  };

  pub.hasBook = function( book ) {
    return books.indexOf( book ) >= 0;
  };

  pub.hasBooks = function() {
    return books.length > 0;
  };

  pub.getBookById = function( id ) {
    for ( var i = 0; i < books.length; i++ ) {
      var book = books[i];
      if ( book.getId() == id ) {
        return book;
      }
    }
    return null;
  };

  pub.getBookByIndex = function( index ) {
    if ( index >= 0 && index < books.length ) {
      return books[index];
    }
    return null;
  };

  pub.exists = function( name ) {
    var result = false;
    for ( var i = 0; i < books.length; i++ ) {
      if ( books[i].getName() === name ) {
        result = true;
        break;
      }
    }
    return result;
  };
  
  pub.getBooksAsArray = function() {
    return books.slice( 0 );
  };

  pub.createBook = function( aName, description, driver, connection, preferences ) {
    var defaultDriver = ru.akman.znotes.DriverManager.getInstance().getDefaultDriver();
    var name = ( aName === undefined ?
      Utils.STRINGS_BUNDLE.getString( "booklist.default.book.name" ) : aName );
    var index = 0, suffix = "";
    while ( pub.exists( name + suffix ) ) {
      suffix = " (" + ++index + ")";
    }
    name += suffix;
    if ( description === undefined ) {
      description = "";
    }
    if ( driver === undefined ) {
      if ( defaultDriver ) {
        driver = defaultDriver.getName();
        connection = defaultDriver.getParameters();
      } else {
        return null;
      }
    } else {
      if ( connection === undefined ) {
        defaultDriver = ru.akman.znotes.DriverManager.getInstance()
                                                     .getDriver( driver );
        if ( defaultDriver ) {
          connection = defaultDriver.getParameters();
        } else {
          return null;
        }
      }
    }
    if ( preferences === undefined ) {
      var preferences = pub.getDefaultPreferences();
    }
    var id = Utils.createUUID();
    var index = books.length;
    var opened = false;
    var book = new ru.akman.znotes.core.Book( this, id, name, description,
      driver, connection, preferences, index, opened );
    pub.appendBook( book );
    return book;
  };

  pub.appendBook = function( book ) {
    books.push( book );
    pub.updateRegistryObject();
    pub.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "BookAppended",
        { appendedBook: book }
      )
    );
    return book;
  };

  pub.insertBook = function( book, index ) {
    if ( index < 0 || index > books.length ) {
      return null;
    }
    books.splice( index, 0, book );
    for ( var i = index; i < books.length; i++ ) {
      books[i].setIndex( i );
    }
    pub.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "BookInserted",
        { insertedBook: book, insertedIndex: index }
      )
    );
    return book;
  };

  pub.removeBook = function( book ) {
    var index = book.getIndex();
    if ( index < 0 ) {
      return null;
    }
    books.splice( index, 1 );
    for ( var i = index; i < books.length; i++ ) {
      books[i].setIndex( i );
    }
    pub.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "BookRemoved",
        { removedBook: book }
      )
    );
    return book;
  };

  pub.moveBook = function( book, index ) {
    if ( pub.removeBook( book ) ) {
      return pub.insertBook( book, index );
    }
    return null;
  };

  pub.deleteBook = function( book ) {
    pub.removeBook( book );
    book.remove();
  };

  pub.deleteBookWithAllData = function( book ) {
    pub.removeBook( book );
    book.removeWithAllData();
  };

  pub.getCount = function() {
    return books.length;
  };

  pub.load = function() {
    locked = true;
    pub.loadRegistryObject();
    books.splice( 0, books.length );
    for ( var i = 0; i < registryObject.length; i++ ) {
      var id = registryObject[i].id;
      var name = ""
      if ( "name" in registryObject[i] ) {
        name = registryObject[i].name;
      }
      var description = "";
      if ( "description" in registryObject[i] ) {
        description = registryObject[i].description;
      }
      var driver = "default";
      if ( "driver" in registryObject[i] ) {
        driver = registryObject[i].driver;
      }
      var connection = {};
      if ( "connection" in registryObject[i] ) {
        if ( typeof( registryObject[i].connection ) == "object" ) {
          connection = registryObject[i].connection;
        }
      }
      var preferences = pub.getDefaultPreferences();
      if ( "preferences" in registryObject[i] ) {
        if ( typeof( registryObject[i].preferences ) == "object" ) {
          preferences = registryObject[i].preferences;
        }
      }
      var index = -1;
      if ( "index" in registryObject[i] ) {
        index = registryObject[i].index;
      }
      var opened = false;
      if ( "opened" in registryObject[i] ) {
        opened = registryObject[i].opened;
      }
      var book = new ru.akman.znotes.core.Book(
        this,
        id,
        name,
        description,
        driver,
        connection,
        preferences,
        index, 
        opened
      );
      if ( book.getIndex() < 0 ) {
        books.push( book );
      } else {
        var index = books.length;
        for ( var j = 0; j < books.length; j++ ) {
          if ( books[j].getIndex() < 0 ) {
            index = j;
            break;
          } else {
            if ( book.getIndex() < books[j].getIndex() ) {
              index = j;
              break;
            }
          }
        }
        books.splice( index, 0, book );
      }
    }
    for ( var i = 0; i < books.length; i++ ) {
      books[i].setIndex( i );
    }
    pub.updateRegistryObject();
    locked = false;
  };

  pub.addStateListener = function( stateListener ) {
    if ( listeners.indexOf( stateListener ) < 0 ) {
      listeners.push( stateListener );
    }
  };

  pub.removeStateListener = function( stateListener ) {
    var index = listeners.indexOf( stateListener );
    if ( index < 0 ) {
      return;
    }
    listeners.splice( index, 1 );
  };

  pub.notifyStateListener = function( event ) {
    if ( locked ) {
      return;
    }
    for ( var i = 0; i < listeners.length; i++ ) {
      if ( listeners[i][ "on" + event.type ] ) {
        listeners[i][ "on" + event.type ]( event );
      }
    }
  };

  /*
  BookCreated( aCreatedBook )
  +BookChanged( aChangedBook )
  +BookDeleted( aDeletedBook )
  +BookOpened( anOpenedBook )
  +BookClosed( aClosedBook )
  BookAppended( anAppendedBook )
  BookRemoved( aRemovedBook )
  BookInserted( anInsertedBook )
  */
  
  pub.getInstance = function() {
    return this;
  };
  
  init();
  
  return pub;

}();
