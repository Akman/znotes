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

Components.utils.import( "resource://znotes/utils.js"          , ru.akman.znotes );
Components.utils.import( "resource://znotes/event.js"          , ru.akman.znotes.core );
Components.utils.import( "resource://znotes/drivermanager.js"  , ru.akman.znotes );
Components.utils.import( "resource://znotes/contenttree.js"    , ru.akman.znotes.core );
Components.utils.import( "resource://znotes/taglist.js"        , ru.akman.znotes.core );

var EXPORTED_SYMBOLS = ["Book"];

var Book = function( aList, anId, aName, aDescription, aDriver, aConnection, aPreferences, anIndex, anOpened ) {

  var Utils = ru.akman.znotes.Utils;

  this.updateRegistryObject = function() {
    this.list.updateRegistryObject();
  };

  this.getPlaces = function() {
    return this.places;
  };

  this.getTagList = function() {
    return this.tagList;
  };

  this.getContentTree = function() {
    return this.contentTree;
  };

  this.getId = function() {
    return this.id;
  };

  this.getName = function() {
    return this.name;
  };

  this.setName = function( name ) {
    if ( this.getName() == name ) {
      return;
    }
    this.name = name;
    this.updateRegistryObject();
    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "BookChanged",
        { changedBook: this }
      )
    );
  };

  this.getDescription = function() {
    return this.description;
  };

  this.setDescription = function( description ) {
    if ( this.getDescription() == description ) {
      return;
    }
    this.description = description;
    this.updateRegistryObject();
    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "BookChanged",
        { changedBook: this }
      )
    );
  };

  this.getDriver = function() {
    return this.driver;
  };

  this.setDriver = function( driver ) {
    if ( this.isOpen() ) {
      return;
    }
    if ( this.getDriver() == driver ) {
      return;
    }
    this.driver = driver;
    this.updateRegistryObject();
    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "BookChanged",
        { changedBook: this }
      )
    );
  };

  this.getConnection = function() {
    var result = {};
    ru.akman.znotes.Utils.cloneObject( this.connection, result );
    return result;
  };

  this.setConnection = function( connection ) {
    if ( this.isOpen() ) {
      return;
    }
    if ( !ru.akman.znotes.Utils.cloneObject( connection, this.connection ) ) {
      return;
    }
    this.updateRegistryObject();
    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "BookChanged",
        { changedBook: this }
      )
    );
  };

  this.getPreferences = function() {
    var result = {};
    ru.akman.znotes.Utils.cloneObject( this.preferences, result );
    return result;
  };

  this.setPreferences = function( preferences ) {
    if ( !ru.akman.znotes.Utils.cloneObject( preferences, this.preferences ) ) {
      return;
    }
    this.updateRegistryObject();
    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "BookChanged",
        { changedBook: this }
      )
    );
  };

  this.getIndex = function() {
    return this.index;
  };

  this.setIndex = function( index ) {
    if ( this.getIndex() == index ) {
      return;
    }
    this.index = index;
    if ( !this.isLocked() ) {
      this.updateRegistryObject();
    }
  };

  this.getSelectedTree = function() {
    var selectedTree = this.loadPreference( "currentTree", "Categories" );
    switch ( selectedTree ) {
      case "Categories":
      case "Tags":
        break;
      default:
        selectedTree = "Categories";
    }
    return selectedTree;
  };
  
  this.setSelectedTree = function( selectedTree ) {
    switch ( selectedTree ) {
      case "Categories":
      case "Tags":
        break;
      default:
        selectedTree = "Categories";
    }
    if ( this.getSelectedTree() == selectedTree ) {
      return;
    }
    this.savePreference( "currentTree", selectedTree );
  };

  this.getSelectedCategory = function() {
    return this.loadPreference( "currentCategory", 0 );
  };
  
  this.setSelectedCategory = function( selectedCategory ) {
    if ( this.getSelectedCategory() == selectedCategory ) {
      return;
    }
    this.savePreference( "currentCategory", selectedCategory );
  };

  this.getSelectedTag = function() {
    return this.loadPreference( "currentTag", 0 );
  };
  
  this.setSelectedTag = function( selectedTag ) {
    if ( this.getSelectedTag() == selectedTag ) {
      return;
    }
    this.savePreference( "currentTag", selectedTag );
  };

  this.remove = function() {
    this.updateRegistryObject();
    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "BookDeleted",
        { deletedBook: this }
      )
    );
  };

  this.removeWithAllData = function() {
    var driver = ru.akman.znotes.DriverManager.getInstance().getDriver( this.getDriver() );
    if ( !driver ) {
      return;
    }
    var connection = driver.getConnection( this.getConnection() );
    connection.remove();
    this.updateRegistryObject();
    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "BookDeleted",
        { deletedBook: this }
      )
    );
  };

  this.createData = function() {
    var driver = ru.akman.znotes.DriverManager.getInstance().getDriver( this.getDriver() );
    if ( !driver ) {
      return false;
    }
    var connection = driver.getConnection( this.getConnection() );
    connection.create();
    return true;
  };

  this.close = function() {
    if ( !this.isOpen() ) {
      return;
    }
    this.tagList = null;
    this.contentTree = null;
    this.opened = false;
    if ( !this.isLocked() ) {
      this.updateRegistryObject();
    }
    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "BookClosed",
        { closedBook: this }
      )
    );
  };

  this.open = function() {
    var OK = 0;
    var ALREADY_OPENED = 2;
    var DRIVER_ERROR = 4;
    var CONNECTION_ERROR = 8;
    var NOT_EXISTS = 16;
    var NOT_PERMITS = 32;
    if ( this.isOpen() ) {
      return ALREADY_OPENED;
    }
    var driver = ru.akman.znotes.DriverManager.getInstance().getDriver( this.getDriver() );
    if ( !driver ) {
      return DRIVER_ERROR;
    }
    var parameters = this.getConnection();
    var connection = driver.getConnection( parameters );
    if ( connection == null ) {
      return CONNECTION_ERROR;
    }
    if ( !connection.exists() ) {
      return NOT_EXISTS;
    }
    if ( !connection.permits() ) {
      return NOT_PERMITS;
    }
    // *************************************************************************
    this.tagList = new ru.akman.znotes.core.TagList(
      this,
      connection.getTagListDescriptor()
    );
    this.tagList.load();
    this.contentTree = new ru.akman.znotes.core.ContentTree(
      this,
      connection.getRootCategoryEntry()
    );
    this.contentTree.load();
    // *************************************************************************
    this.opened = true;
    if ( !this.isLocked() ) {
      this.updateRegistryObject();
    }
    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "BookOpened",
        { openedBook: this }
      )
    );
    return OK;
  };

  this.isOpen = function() {
    return this.opened;
  };

  this.savePreference = function( name, value ) {
    if ( this.hasPreference( name ) ) {
      if ( this.preferences[name] == value ) {
        return;
      }
    }
    this.preferences[name] = value;
    this.updateRegistryObject();
  };

  this.loadPreference = function( name, value ) {
    if ( this.hasPreference( name ) ) {
      return this.preferences[name];
    } else {
      if ( value === undefined ) {
        return null;
      }
    }
    this.savePreference( name, value );
    return value;
  };

  this.hasPreference = function( name ) {
    return name in this.preferences;
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
    if ( !this.isLocked() ) {
      for ( var i = 0; i < this.listeners.length; i++ ) {
        if ( this.listeners[i][ "on" + event.type ] ) {
          this.listeners[i][ "on" + event.type ]( event );
        }
      }
    }
    this.list.notifyStateListener( event );
  };

  /*
  BookChanged( aChangedBook )
  BookDeleted( aDeletedBook )
  BookOpened( anOpenedBook )
  BookClosed( aClosedBook )
  */

  this.toString = function() {
    return "{ '" +
      this.id + "', '" +
      this.name + "', '" +
      this.description + "', '" +
      this.driver + "', '" +
      this.index +
      " }\n" +
      "{ locked = " + this.locked + ", " +
      " listeners = " + this.listeners.length +
      " }";
  };

  this.locked = true;
  this.list = aList;
  this.listeners = [];
  this.id = anId;
  this.name = aName;
  this.description = aDescription;
  this.driver = aDriver;
  this.places = {};
  this.connection = aConnection;
  this.preferences = aPreferences;
  this.index = anIndex;
  this.tagList = null;
  this.contentTree = null;
  this.opened = false;
  if ( anOpened ) {
    try {
      if ( this.open() > 2 ) {
        this.opened = false;
      };
    } catch ( e ) {
      this.opened = false;
    }
  }
  this.locked = false;

};
