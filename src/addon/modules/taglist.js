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

Components.utils.import( "resource://znotes/utils.js"  , ru.akman.znotes );
Components.utils.import( "resource://znotes/event.js"  , ru.akman.znotes.core );
Components.utils.import( "resource://znotes/tag.js"    , ru.akman.znotes.core );

var EXPORTED_SYMBOLS = ["TagList"];

var TagList = function( aBook, aDescriptor ) {

  this.getDescriptor = function() {
    return this.descriptor;
  };

  this.getBook = function() {
    return this.book;
  };

  this.getNoTag = function() {
    return this.tags[0];
  };

  this.hasTag = function( tag ) {
    return this.tags.indexOf( tag ) >= 0;
  };

  this.getTagById = function( id ) {
    for ( var i = 0; i < this.tags.length; i++ ) {
      var tag = this.tags[i];
      if ( tag.getId() == id ) {
        return tag;
      }
    }
    return null;
  };

  this.createTag = function( name, color ) {
    var id = ru.akman.znotes.Utils.createUUID();
    var index = this.tags.length;
    var selectedIndex = -1;
    var tag = new ru.akman.znotes.core.Tag( this, id, name, color, index, selectedIndex );
    this.getDescriptor().addItem( tag.getDescriptorItemInfo() );
    this.appendTag( tag );

    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "TagCreated",
        { createdTag: tag }
      )
    );

    return tag;
  };

  this.appendTag = function( tag ) {
    this.tags.push( tag );

    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "TagAppended",
        { appendedTag: tag }
      )
    );

    return tag;
  };

  this.insertTag = function( tag, index ) {
    if ( index <= 0 || index > this.tags.length ) {
      return null;
    }
    this.tags.splice( index, 0, tag );
    for ( var i = index; i < this.tags.length; i++ ) {
      this.tags[i].setIndex( i );
    }

    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "TagInserted",
        { insertedTag: tag, insertedIndex: index }
      )
    );

    return tag;
  };

  this.removeTag = function( tag ) {
    var index = tag.getIndex();
    if ( index <= 0 ) {
      return null;
    }
    this.tags.splice( index, 1 );
    for ( var i = index; i < this.tags.length; i++ ) {
      this.tags[i].setIndex( i );
    }

    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "TagRemoved",
        { removedTag: tag }
      )
    );

    return tag;
  };

  this.moveTag = function( tag, index ) {
    if ( this.removeTag( tag ) ) {
      return this.insertTag( tag, index );
    }
    return null;
  };

  this.deleteTag = function( tag ) {
    this.removeTag( tag );
    tag.remove();
  };

  this.getCount = function() {
    return this.tags.length;
  };

  this.getTagsAsObject = function() {
    var result = new Object();
    for ( var i = 0; i < this.tags.length; i++ ) {
      var tag = this.tags[i];
      var id = tag.getId();
      result[id] = tag;
    }
    return result;
  };

  this.getTagsAsArray = function() {
    return this.tags.slice( 0 );
  };

  this.getTagsIdsArray = function() {
    var result = [];
    for ( var i = 0; i < this.tags.length; i++ ) {
      result.push( this.tags[i].getId() );
    }
    return result;
  };

  this.checkTagsIdsArray = function( ids ) {
    var tagsIds = this.getTagsIdsArray();
    var resultIds = [];
    for ( var i = 0; i < ids.length; i++ ) {
      var id = ids[i];
      if ( tagsIds.indexOf( id ) < 0 ) {
        continue;
      }
      resultIds.push( id );
    }
    if ( ids.length != resultIds.length ) {
      ids.splice( 0, ids.length );
      for ( var i = 0; i < resultIds.length; i++ ) {
        ids.push( resultIds[i] );
      }
      return false;
    }
    return true;
  };

  this.fillDefaultItemInfo = function( info ) {
    var id = info[0];
    var name = id;
    var color = "#FFFF00";
    var index = -1;
    var selectedIndex = -1;
    var result = false;
    // name
    if ( info[1] === undefined ) {
      info[1] = id;
      result = true;
    }
    // color
    if ( info[2] === undefined ) {
      info[2] = color;
      result = true;
    }
    // index
    if ( info[3] === undefined ) {
      info[3] = index;
      result = true;
    } else {
      info[3] = parseInt( info[3], 10 );
    }
    // selectedIndex
    if ( info[4] === undefined ) {
      info[4] = selectedIndex;
      result = true;
    } else {
      info[4] = parseInt( info[4], 10 );
    }
    if ( info.length > 5 ) {
      info.splice( 5 );
      result = true;
    }
    return result;
  };

  this.load = function() {
    this.locked = true;
    var hasNoTag = false;
    var tag = null;
    var info = null;
    var isChanged = false;
    var index = 0;
    var items = null;
    this.tags.splice( 0, this.tags.length );
    items = this.getDescriptor().getItems();
    for ( var i = 0; i < items.length; i++ ) {
      info = items[i];
      isChanged = this.fillDefaultItemInfo( info );
      if ( info[0] == "00000000000000000000000000000000" ) {
        if ( hasNoTag ) {
          info[0] = ru.akman.znotes.Utils.createUUID();
          if ( info[3] == 0 ) {
            info[3] = -1;
          }
          isChanged = true;
        } else {
          hasNoTag = true;
          if ( info[3] != 0 ) {
            info[3] = 0;
            isChanged = true;
          }
        }
      } else {
        if ( info[3] == 0 ) {
          info[3] = -1;
          isChanged = true;
        }
      }
      if ( isChanged ) {
        this.getDescriptor().setItem( info );
      }
      tag = new ru.akman.znotes.core.Tag( this, info[0], info[1], info[2], info[3], info[4] );
      if ( tag.isNoTag() ) {
        this.tags.splice( 0, 0, tag );
      } else {
        if ( tag.getIndex() < 0 ) {
          this.tags.push( tag );
        } else {
          index = this.tags.length;
          for ( var j = 0; j < this.tags.length; j++ ) {
            if ( this.tags[j].getIndex() < 0 ) {
              index = j;
              break;
            } else {
              if ( tag.getIndex() < this.tags[j].getIndex() ) {
                index = j;
                break;
              }
            }
          }
          this.tags.splice( index, 0, tag );
        }
      }
    }
    if ( !hasNoTag ) {
      info = [
        "00000000000000000000000000000000",
        "No tag",
        "#CCFFFF",
        0,
        -1
      ];
      this.getDescriptor().addItem( info );
      tag = new ru.akman.znotes.core.Tag( this, info[0], info[1], info[2], info[3], info[4] );
      this.tags.splice( 0, 0, tag );
    }
    for ( var i = 0; i < this.tags.length; i++ ) {
      this.tags[i].setIndex( i );
    }
    this.locked = false;
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
  TagCreated( aCreatedTag )
  +TagChanged( aChangedTag )
  +TagDeleted( aDeletedTag )
  TagAppended( anAppendedTag )
  TagRemoved( aRemovedTag )
  TagInserted( anInsertedTag )
  */

  this.locked = true;
  this.isListenersActive = true;
  this.listeners = [];
  this.book = aBook;
  this.descriptor = aDescriptor;
  this.tags = [];
  this.locked = false;

};
