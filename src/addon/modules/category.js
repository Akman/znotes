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

Components.utils.import( "resource://znotes/event.js", ru.akman.znotes.core );
Components.utils.import( "resource://znotes/note.js", ru.akman.znotes.core );
Components.utils.import( "resource://znotes/utils.js", ru.akman.znotes );

var EXPORTED_SYMBOLS = ["Category"];

var Category = function( aBook, anEntry, aParent ) {

  var Utils = ru.akman.znotes.Utils;

  /*
   * aProcessor
   *
  var data1 = {};
  var data2 = {};
  ...
  var dataN = {};
  var aProcessor = {
    param1: data1,
    param2: data2,
    ...
    paramN: dataN,
    processCategory: function( aCategory ) {
      ...
      this.param1 ... this.paramN
      ...
    },
    processNote: function( aNote ) {
      ...
      this.param1 ... this.paramN
      ...
    }
  };
  */
  this.process = function( aProcessor ) {
    if ( "processCategory" in aProcessor ) {
      aProcessor.processCategory( this );
    }
    if ( "processNote" in aProcessor ) {
      for ( var i = 0; i < this.notes.length; i++ ) {
        aProcessor.processNote( this.notes[i] );
      }
    }
    for ( var i = 0; i < this.categories.length; i++ ) {
      this.categories[i].process( aProcessor );
    }
  };

  this.getCategoryWithSubcategoriesAsArray = function() {
    var result = [];
    var categoryProcessor = {
      categories: result,
      processCategory: function( aCategory ) {
        this.categories.push( aCategory );
      }
    };
    this.process( categoryProcessor );
    return result;
  };

  this.refresh = function() {
    this.entry.refresh( this.parent.entry );
    for ( var i = 0; i < this.notes.length; i++ ) {
      this.notes[i].refresh();
    }
    for ( var i = 0; i < this.categories.length; i++ ) {
      this.categories[i].refresh();
    }
  };

  this.isRoot = function() {
    return ( this.parent == null );
  };

  this.getBook = function() {
    return this.book;
  };

  this.getParent = function() {
    return this.parent;
  };

  this.noteExists = function( name, aType ) {
    return this.entry.exists( name, aType );
  };

  this.canCreateNote = function( name, aType ) {
    return this.entry.canCreate( name, aType );
  };
  
  this.categoryExists = function( name ) {
    return this.entry.exists( name );
  };

  this.canCreateCategory = function( name ) {
    return this.entry.canCreate( name );
  };
  
  this.depth = function() {
    var result = this.categories.length;
    for ( var i = 0; i < this.categories.length; i++ )
      result += this.categories[i].depth();
    return result;
  };

  this.isOpen = function() {
    if ( this.isRoot() )
      return true;
    return this.openState;
  };

  this.getOpenState = function() {
    return this.openState;
  };
  
  this.setOpenState = function( aState ) {
    if ( this.isRoot() ) {
      return;
    }
    if ( this.openState !== aState ) {
      this.entry.setOpenState( aState );
      this.openState = aState;

      this.notifyStateListener(
        new ru.akman.znotes.core.Event(
          "CategoryChanged",
          { parentCategory: this.getParent(), changedCategory: this }
        )
      );

    }
  };

  this.getSelectedIndex = function() {
    return this.selectedIndex;
  };

  this.setSelectedIndex = function( anIndex ) {
    if ( this.selectedIndex != anIndex ) {
      this.entry.setSelectedIndex( anIndex );
      this.selectedIndex = anIndex;
    }
  };

  this.getIndex = function() {
    return this.index;
  };

  this.setIndex = function( index ) {
    if ( this.index == index ) {
      return;
    }
    this.index = index;
    this.entry.setIndex( index );
  };

  this.isLocked = function() {
    return this.locked;
  };

  this.isExists = function() {
    return this.exists;
  };

  this.getId = function() {
    return this.id;
  };
  
  this.getName = function() {
    if ( this.isRoot() ) {
      return this.getBook().getName();
    }
    return this.name;
  };

  this.hasNotes = function() {
    return this.notes.length > 0;
  };

  this.getNotes = function() {
    return this.notes.slice(0);
  };
  
  this.getNoteByName = function( aName ) {
    for ( var i = 0; i < this.notes.length; i++ ) {
      if ( this.notes[i].getName() === aName ) {
        return this.notes[i];
      }
    }
    return null;
  };

  this.getNotesCount = function() {
    return this.notes.length;
  };

  this.hasNote = function( aNote ) {
    return this.notes.indexOf( aNote ) >= 0;
  };

  this.hasCategories = function() {
    return this.categories.length > 0;
  };

  this.getCategories = function() {
    return this.categories.slice(0);
  };

  this.getCategoriesCount = function() {
    return this.categories.length;
  };

  this.hasCategory = function( aCategory ) {
    return this.categories.indexOf( aCategory ) >= 0;
  };

  this.getCategoryByIndex = function( anIndex ) {
    if ( anIndex >= 0 && anIndex <= this.categories.length - 1 ) {
      return this.categories[anIndex];
    }
    return null;
  };

  this.remove = function() {
    if ( this.isRoot() ) {
      return;
    }
    var parent = this.getParent();
    var categories = this.getCategories();
    for ( var i = 0; i < categories.length; i++ ) {
      categories[i].remove();
    }
    var notes = this.getNotes();
    for ( var i = 0; i < notes.length; i++ ) {
      notes[i].remove();
    }
    this.entry.remove();
    this.exists = false;
    parent.removeCategory( this );
    parent.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "CategoryDeleted",
        { parentCategory: parent, deletedCategory: this }
      )
    );
  };

  this.rename = function( aNewName ) {
    if ( this.isRoot() ) {
      return;
    }
    if ( this.name != aNewName ) {
      this.entry.setName( aNewName );
      this.name = aNewName;
      this.refresh();
      this.notifyStateListener(
        new ru.akman.znotes.core.Event(
          "CategoryChanged",
          { parentCategory: this.getParent(), changedCategory: this }
        )
      );
    }
  };

  this.moveInto = function( aNewRoot ) {
    this.entry.moveTo( aNewRoot.entry );
    this.getParent().removeCategory( this );
    aNewRoot.appendCategory( this );
    this.refresh();
    return this;
  };

  this.moveTo = function( anIndex ) {
    this.getParent().removeCategory( this );
    this.getParent().insertCategory( this, anIndex );
    return this;
  };

  this.createCategory = function( aName ) {
    var aCategory = new Category(
      this.book,
      this.entry.createCategory( aName ),
      this
    );
    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "CategoryCreated",
        { parentCategory: this, createdCategory: aCategory }
      )
    );
    return aCategory;
  };

  this.appendCategory = function( aCategory ) {
    this.categories.push( aCategory );
    aCategory.parent = this;
    aCategory.setIndex( this.categories.length - 1 );
    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "CategoryAppended",
        { parentCategory: this, appendedCategory: aCategory }
      )
    );
    return aCategory;
  };

  this.insertCategory = function( aCategory, anIndex ) {
    if ( anIndex < 0 || anIndex > this.categories.length ) {
      return null;
    }
    this.categories.splice( anIndex, 0, aCategory );
    aCategory.parent = this;
    for ( var i = anIndex; i < this.categories.length; i++ ) {
      this.categories[i].setIndex( i );
    }
    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "CategoryInserted",
        { parentCategory: this, insertedCategory: aCategory, insertedIndex: anIndex }
      )
    );
    return aCategory;
  };

  this.removeCategory = function( aCategory ) {
    this.categories.splice( aCategory.getIndex(), 1 );
    for ( var i = 0; i < this.categories.length; i++ ) {
      if ( this.categories[i].getIndex() != i ) {
        this.categories[i].setIndex( i );
      }
    }
    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "CategoryRemoved",
        { parentCategory: this, removedCategory: aCategory }
      )
    );
    return aCategory;
  };
  
  this.deleteCategory = function( aCategory ) {
    aCategory.remove();
  };

  this.createNote = function( aName, aType, aTag ) {
    var aNote = new ru.akman.znotes.core.Note(
      this.book,
      this.entry.createNote( aName, aType ),
      this,
      aType,
      aTag
    );
    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "NoteCreated",
        { parentCategory: this, createdNote: aNote }
      )
    );
    return aNote;
  };

  this.appendNote = function( aNote ) {
    this.notes.push( aNote );
    aNote.parent = this;
    aNote.setIndex( this.notes.length - 1 );

    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "NoteAppended",
        { parentCategory: this, appendedNote: aNote }
      )
    );

    return aNote;
  };

  this.insertNote = function( aNote, anIndex ) {
    if ( anIndex < 0 || anIndex > this.notes.length ) {
      return null;
    }
    this.notes.splice( anIndex, 0, aNote );
    aNote.parent = this;
    for ( var i = anIndex; i < this.notes.length; i++ ) {
      this.notes[i].setIndex( i );
    }

    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "NoteInserted",
        { parentCategory: this, insertedNote: aNote, insertedIndex: anIndex }
      )
    );

    return aNote;
  };

  this.removeNote = function( aNote ) {
    var anIndex = aNote.getIndex();
    if ( anIndex < 0 ) {
      return;
    }
    this.notes.splice( anIndex, 1 );
    for ( var i = 0; i < this.notes.length; i++ ) {
      if ( this.notes[i].getIndex() != i ) {
        this.notes[i].setIndex( i );
      }
    }
    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "NoteRemoved",
        { parentCategory: this, removedNote: aNote }
      )
    );
    return aNote;
  };

  this.deleteNote = function( aNote ) {
    aNote.remove();
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
    var parent = this.getParent();
    if ( parent ) {
      parent.notifyStateListener( event );
    }
  };

  this.toString = function() {
    var parent = this.getParent();
    var parentName = parent ? parent.getName() : "*NULL*";
    return "{ " +
      "'" + this.getName() + "', " +
      "'" + parentName + "', " +
      this.index + ", " +
      this.selectedIndex +
      " }\n{ " +
      "locked = " + this.locked + ", " +
      "exists = " + this.exists + ", " +
      "listeners = " + this.listeners.length +
      " }\n" +
      this.entry
  };

  this.locked = true;
  this.exists = true;
  this.book = aBook;
  this.listeners = [];
  this.categories = [];
  this.notes = [];
  this.parent = aParent;
  this.entry = anEntry;
  this.id = this.parent ? this.entry.getId() : this.book.getId();
  this.name = this.entry.getName();
  this.index = this.entry.getIndex();
  this.openState = this.entry.getOpenState();
  this.selectedIndex = this.entry.getSelectedIndex();
  if ( this.parent ) {
    this.parent.appendCategory( this );
  }
  this.locked = false;
  
};
