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

Components.utils.import( "resource://znotes/utils.js"   , ru.akman.znotes );
Components.utils.import( "resource://znotes/event.js"   , ru.akman.znotes.core );
Components.utils.import( "resource://znotes/book.js"    , ru.akman.znotes.core );
Components.utils.import( "resource://znotes/drivermanager.js"  , ru.akman.znotes );

var EXPORTED_SYMBOLS = ["BookList"];

var BookList = function() {

  var log = ru.akman.znotes.Utils.log;

  var getEntry = function() {
    var entry = ru.akman.znotes.Utils.getPlacesPath();
    var placeId = ru.akman.znotes.Utils.getPlaceId();
    entry.append( placeId );
    if ( !entry.exists() || !entry.isDirectory() ) {
      entry.create( Components.interfaces.nsIFile.DIRECTORY_TYPE, parseInt( "0755", 8 ) );
    }
    entry.append( "notebooks.json" );
    return entry.clone();
  };

  this.updateRegistryObject = function() {
    this.registryObject.splice( 0, this.registryObject.length );
    for ( var i = 0; i < this.books.length; i++ ) {
      var book = this.books[i];
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
      this.registryObject.push( info );
    }
    var data = JSON.stringify( this.registryObject );
    ru.akman.znotes.Utils.writeFileContent( this.registryPath, "UTF-8", data );
  };

  this.loadRegistryObject = function() {
    if ( !this.registryPath.exists() ) {
      this.registryObject = [];
      return;
    }
    try {
      this.registryObject = JSON.parse( ru.akman.znotes.Utils.readFileContent( this.registryPath, "UTF-8" ) );
    } catch ( e ) {
      log( e );
      this.registryObject = [];
    }
  };

  this.hasBook = function( book ) {
    return this.books.indexOf( book ) >= 0;
  };

  this.hasBooks = function() {
    return this.books.length > 0;
  };

  this.getBookById = function( id ) {
    for ( var i = 0; i < this.books.length; i++ ) {
      var book = this.books[i];
      if ( book.getId() == id ) {
        return book;
      }
    }
    return null;
  };

  this.getBookByIndex = function( index ) {
    if ( index >= 0 && index < this.books.length ) {
      return this.books[index];
    }
    return null;
  };

  this.getBooksAsArray = function() {
    return this.books.slice( 0 );
  };

  this.createBook = function( name, description, driver, connection, preferences ) {
    var defaultDriver = ru.akman.znotes.DriverManager.getDefaultDriver();
    if ( name === undefined ) {
      name = ru.akman.znotes.Utils.STRINGS_BUNDLE.getString( "booklist.default.book.name" );
    }
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
        defaultDriver = ru.akman.znotes.DriverManager.getDriver( driver );
        if ( defaultDriver ) {
          connection = defaultDriver.getParameters();
        } else {
          return null;
        }
      }
    }
    if ( preferences === undefined ) {
      var preferences = {

        // data
        currentTree: "Categories",
        currentCategory: 0,
        currentTag: 0,
        rootPosition: -1,

        // view
        "folderBoxWidth": "200",
        "bookTreeViewHeight": "250",
        "bookSplitterState": "open",
        "categoryBoxHeight": "700",
        "folderTreeViewHeight": "500",
        "tagSplitterState": "open",
        "tagTreeViewHeight": "300",
        "folderSplitterState": "open",
        "noteBoxWidth": "800",
        "noteTreeViewHeight": "250",
        "noteTreeSplitterState": "open",
        "noteBodyBoxHeight": "700",
        "noteBodyViewHeight": "700",
        "noteMainViewWidth": "700",
        "noteMainBoxHeight": "300",
        "noteBodySplitterState": "open",
        "noteAddonsBoxHeight": "100"

      };
    }
    var id = ru.akman.znotes.Utils.createUUID();
    var index = this.books.length;
    var opened = false;
    var book = new ru.akman.znotes.core.Book( this, id, name, description,
      driver, connection, preferences, index, opened );
    this.appendBook( book );
    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "BookCreated",
        { createdBook: book }
      )
    );
    return book;
  };

  this.appendBook = function( book ) {
    this.books.push( book );
    this.updateRegistryObject();
    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "BookAppended",
        { appendedBook: book }
      )
    );
    return book;
  };

  this.insertBook = function( book, index ) {
    if ( index < 0 || index > this.books.length ) {
      return null;
    }
    this.books.splice( index, 0, book );
    for ( var i = index; i < this.books.length; i++ ) {
      this.books[i].setIndex( i );
    }
    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "BookInserted",
        { insertedBook: book, insertedIndex: index }
      )
    );
    return book;
  };

  this.removeBook = function( book ) {
    var index = book.getIndex();
    if ( index < 0 ) {
      return null;
    }
    this.books.splice( index, 1 );
    for ( var i = index; i < this.books.length; i++ ) {
      this.books[i].setIndex( i );
    }
    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "BookRemoved",
        { removedBook: book }
      )
    );
    return book;
  };

  this.moveBook = function( book, index ) {
    if ( this.removeBook( book ) ) {
      return this.insertBook( book, index );
    }
    return null;
  };

  this.deleteBook = function( book ) {
    this.removeBook( book );
    book.remove();
  };

  this.deleteBookWithAllData = function( book ) {
    this.removeBook( book );
    book.removeWithAllData();
  };

  this.getCount = function() {
    return this.books.length;
  };

  this.load = function() {
    this.loadRegistryObject();
    this.books.splice( 0, this.books.length );
    for ( var i = 0; i < this.registryObject.length; i++ ) {
      var id = this.registryObject[i].id;
      var name = ""
      if ( "name" in this.registryObject[i] ) {
        name = this.registryObject[i].name;
      }
      var description = "";
      if ( "description" in this.registryObject[i] ) {
        description = this.registryObject[i].description;
      }
      var driver = "default";
      if ( "driver" in this.registryObject[i] ) {
        driver = this.registryObject[i].driver;
      }
      var connection = {};
      if ( "connection" in this.registryObject[i] ) {
        if ( typeof( this.registryObject[i].connection ) == "object" ) {
          connection = this.registryObject[i].connection;
        }
      }
      var preferences = {

        // data
        currentTree: "Categories",
        currentCategory: 0,
        currentTag: 0,
        rootPosition: -1,

        // view
        "folderBoxWidth": "200",
        "bookTreeViewHeight": "250",
        "bookSplitterState": "open",
        "categoryBoxHeight": "700",
        "folderTreeViewHeight": "500",
        "tagSplitterState": "open",
        "tagTreeViewHeight": "300",
        "folderSplitterState": "open",
        "noteBoxWidth": "800",
        "noteTreeViewHeight": "250",
        "noteTreeSplitterState": "open",
        "noteBodyBoxHeight": "700",
        "noteMainViewWidth": "700",
        "noteBodyViewHeight": "700",
        "noteMainBoxHeight": "300",
        "noteBodySplitterState": "open",
        "noteAddonsBoxHeight": "100"

      };
      if ( "preferences" in this.registryObject[i] ) {
        if ( typeof( this.registryObject[i].preferences ) == "object" ) {
          preferences = this.registryObject[i].preferences;
        }
      }
      var index = -1;
      if ( "index" in this.registryObject[i] ) {
        index = this.registryObject[i].index;
      }
      var opened = false;
      if ( "opened" in this.registryObject[i] ) {
        opened = this.registryObject[i].opened;
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
        this.books.push( book );
      } else {
        var index = this.books.length;
        for ( var j = 0; j < this.books.length; j++ ) {
          if ( this.books[j].getIndex() < 0 ) {
            index = j;
            break;
          } else {
            if ( book.getIndex() < this.books[j].getIndex() ) {
              index = j;
              break;
            }
          }
        }
        this.books.splice( index, 0, book );
      }
    }
    for ( var i = 0; i < this.books.length; i++ ) {
      this.books[i].setIndex( i );
    }
    this.updateRegistryObject();
  };

  this.isLocked = function() {
    return this.locked;
  };

  this.addStateListener = function( stateListener ) {
    if ( this.listeners.indexOf( stateListener ) < 0 ) {
      this.listeners.push( stateListener );
    }
  };

  this.removeStateListener = function( stateListener ) {
    var index = this.listeners.indexOf( stateListener );
    if ( index < 0 ) {
      return;
    }
    this.listeners.splice( index, 1 );
  };

  this.notifyStateListener = function( event ) {
    if ( this.isLocked() ) {
      return;
    }
    for ( var i = 0; i < this.listeners.length; i++ ) {
      if ( this.listeners[i][ "on" + event.type ] ) {
        this.listeners[i][ "on" + event.type ]( event );
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

  this.locked = true;
  this.registryPath = getEntry();
  this.registryObject = [];
  this.isListenersActive = true;
  this.listeners = [];
  this.books = [];
  this.locked = false;

};
