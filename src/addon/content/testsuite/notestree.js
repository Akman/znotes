/* ***** BEGIN LICENSE BLOCK *****
 *
 * Version: GPL 3.0
 *
 * ZNotes
 * Copyright (C) 2015 Alexander Kapitman
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
 * Portions created by the Initial Developer are Copyright (C) 2015
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
if ( !ru.akman.znotes.core ) ru.akman.znotes.core = {};
if ( !ru.akman.znotes.tests ) ru.akman.znotes.tests = {};

Cu.import( "resource://znotes/utils.js", ru.akman.znotes );
Cu.import( "resource://znotes/dateutils.js", ru.akman.znotes );
Cu.import( "resource://znotes/images.js", ru.akman.znotes );
Cu.import( "resource://znotes/documentmanager.js", ru.akman.znotes );
Cu.import( "resource://znotes/bookmanager.js", ru.akman.znotes.core );
Cu.import( "resource://znotes/event.js", ru.akman.znotes.core );

ru.akman.znotes.tests.NotesTree = function() {

  var pub = {};

  var Utils = ru.akman.znotes.Utils;
  var Common = ru.akman.znotes.Common;
  var Images = ru.akman.znotes.Images;

  var log = Utils.getLogger( "content.tests.notestree" );
  var loggerLevel = Utils.LOGGER_LEVEL;
  
  var bookManager = null;
  var contentTree = null;
  var tagList = null;

  var currentBook = null;
  var currentCategory = null;
  var currentTag = null;

  var defaultType = null;
  var noteTypes = null;
  var dateIntervals = null;

  var noteTreeModel = null;
  var noteTreeView = null;
  var noteTreeFilterView = null;

  var qfButton = null;
  var qfBox = null;
  var qfText = null;
  var qfMatch = null;
  var qfPin = null;
  var qfAttachments = null;
  var qfType = null;
  var qfTypeMenuPopup = null;
  var qfCreated = null;
  var qfCreatedMenuPopup = null;
  var qfUpdated = null;
  var qfUpdatedMenuPopup = null;
  var qfCategory = null;
  var qfTag = null;
  var qfName = null;
  var qfBody = null;
  var noteTree = null;
  var noteTreeTextBox = null;
  var noteTreeChildren = null;
  var noteTreeDetails = null;
  
  // CONTROLLER
  
  var mainController = {
    commands: {
      // book
      "znotes_openbook_command": null,
      "znotes_closebook_command": null,
      "znotes_appendbook_command": null,
      "znotes_deletebook_command": null,
      "znotes_deletebookdata_command": null,
      "znotes_editbook_command": null,
      "znotes_renamebook_command": null,
      "znotes_refreshbooktree_command": null,
      // category
      "znotes_refreshfoldertree_command": null,
      "znotes_newcategory_command": null,
      "znotes_deletecategory_command": null,
      "znotes_clearbin_command": null,
      "znotes_renamecategory_command": null,
      // tag
      "znotes_refreshtagtree_command": null,
      "znotes_newtag_command": null,
      "znotes_deletetag_command": null,
      "znotes_renametag_command": null,
      "znotes_colortag_command": null,
      // note
      "znotes_newnote_command": null,
      "znotes_importnote_command": null,
      "znotes_deletenote_command": null,
      "znotes_renamenote_command": null,
      "znotes_processnote_command": null,
      "znotes_updatenote_command": null,
      "znotes_refreshnotetree_command": null,
      // platform
      "znotes_showfilterbar_command": null,
    },
    supportsCommand: function( cmd ) {
      return ( cmd in this.commands );
    },
    isCommandEnabled: function( cmd ) {
      switch ( cmd ) {
        // book
        case "znotes_openbook_command":
        case "znotes_editbook_command":
          return currentBook && !currentBook.isOpen();
        case "znotes_closebook_command":
        case "znotes_showfilterbar_command":
          return currentBook && currentBook.isOpen();
        case "znotes_renamebook_command":
        case "znotes_deletebook_command":
        case "znotes_deletebookdata_command":
          return currentBook;
        case "znotes_appendbook_command":
        case "znotes_refreshbooktree_command":
          return true;
        // category
        case "znotes_clearbin_command":
          return currentBook && currentBook.isOpen() &&
                 currentBook.getContentTree().getBin() &&
                 !currentBook.getContentTree().getBin().isEmpty();
        case "znotes_deletecategory_command":
        case "znotes_renamecategory_command":
          return currentBook && currentBook.isOpen() &&
                 ( currentTag ? "Tags" : "Categories" ) === "Categories" &&
                 currentCategory &&
                 !currentCategory.isRoot() &&
                 !currentCategory.isBin();
        case "znotes_refreshfoldertree_command":
        case "znotes_newcategory_command":
          return currentBook && currentBook.isOpen() &&
                 ( currentTag ? "Tags" : "Categories" ) === "Categories";
          // tag
        case "znotes_deletetag_command":
        case "znotes_renametag_command":
          return currentBook && currentBook.isOpen() &&
                 ( currentTag ? "Tags" : "Categories" ) === "Tags" &&
                 currentTag && !currentTag.isNoTag();
        case "znotes_refreshtagtree_command":
        case "znotes_newtag_command":
          return currentBook && currentBook.isOpen() &&
                 ( currentTag ? "Tags" : "Categories" ) === "Tags";
        case "znotes_colortag_command":
          return currentBook && currentBook.isOpen() &&
                 ( currentTag ? "Tags" : "Categories" ) === "Tags" &&
                 currentTag;
          // note
        case "znotes_deletenote_command":
        case "znotes_renamenote_command":
        case "znotes_processnote_command":
        case "znotes_updatenote_command":
          return currentBook && currentBook.isOpen() &&
            noteTreeView._selection.selectedNote;
        case "znotes_importnote_command":
          return currentBook;
        case "znotes_newnote_command":
        case "znotes_refreshnotetree_command":
        case "znotes_showfilterbar_command":
          return currentBook && currentBook.isOpen();
      }
      return false;
    },
    doCommand: function( cmd ) {
      switch ( cmd ) {
        case "znotes_newnote_command":
          doNewNote();
          break;
        case "znotes_deletenote_command":
          doDeleteNote();
          break;
        case "znotes_renamenote_command":
          doRenameNote();
          break;
        case "znotes_processnote_command":
          break;
        case "znotes_updatenote_command":
          break;
        case "znotes_refreshnotetree_command":
          break;
        case "znotes_showfilterbar_command":
          doToggleFilterBar();
          break;
        default:
          break;
      }
    },
    onEvent: function( event ) {
    },
    getName: function() {
      return "main::mainController";
    },
    getCommand: function( cmd ) {
      return ( cmd in this.commands ) ? document.getElementById( cmd ) : null;
    },
    updateCommands: function() {
      for ( var cmd in this.commands ) {
        Common.goUpdateCommand( cmd, this.getId(), window );
      }
    },
    register: function() {
      try {
        window.controllers.insertControllerAt( 0, this );
        this.getId = function() {
          return window.controllers.getControllerId( this );
        };
      } catch ( e ) {
        log.warn(
          "An error occurred registering '" + this.getName() +
          "' controller\n" + e
        );
      }
    },
    unregister: function() {
      for ( var cmd in this.commands ) {
        Common.goSetCommandEnabled( cmd, false, window );
      }
      try {
        window.controllers.removeController( this );
      } catch ( e ) {
        log.warn(
          "An error occurred unregistering '" + this.getName() +
          "' controller\n" + e
        );
      }
    }
  };

  // MODEL

  function NoteTreeModel() {
    this.noteList = [];
    this.listeners = [];
  };
  NoteTreeModel.prototype = {
    _columns: {
      ATTACHMENTS: 0,
      STICKY: 1,
      NAME: 2,
      CATEGORY: 3,
      TAG: 4,
      TYPE: 5,
      CREATED: 6,
      UPDATED: 7
    },
    get columns() {
      return this._columns;
    },
    get types() {
      return noteTypes;
    },
    get intervals() {
      return dateIntervals;
    },
    get canReorder() {
      return !currentTag;
    },
    fetch: function() {
      switch ( currentTag ? "Tags" : "Categories" ) {
        case "Categories":
          this.noteList = currentCategory.getNotes();
          break;
        case "Tags":
          this.noteList = contentTree.getNotesByTag( currentTag.getId(), true );
          break;
        default:
          this.noteList = [];
      }
    },
    loadPreference: function( name, value ) {
      switch ( name ) {
        case "noteTreeFilter":
        case "noteTreeSort":
        case "qfBoxCollapsed":
          value = currentBook.loadPreference( name, value );
          break;
        case "noteTreeSelection":
          value = -1;
          if ( currentBook.isOpen() && Utils.IS_SAVE_POSITION ) {
            switch ( currentBook.getSelectedTree() ) {
              case "Categories":
                value = currentCategory.isRoot() ?
                  currentBook.loadPreference( "rootPosition", 0 ) :
                  currentCategory.getSelectedIndex();
                break;
              case "Tags":
                value = currentTag.getSelectedIndex();
                break;
            }
          }
          value = this.getNoteAtIndex( value );
          break;
      }
      return value;
    },
    savePreference: function( name, value ) {
      switch ( name ) {
        case "noteTreeFilter":
        case "noteTreeSort":
        case "qfBoxCollapsed":
          currentBook.savePreference( name, value );
          break;
        case "noteTreeSelection":
          value = this.getIndexOfNote( value );
          if ( currentBook.isOpen() && Utils.IS_SAVE_POSITION ) {
            switch ( currentBook.getSelectedTree() ) {
              case "Categories":
                if ( currentCategory.isRoot() ) {
                  currentBook.savePreference( "rootPosition", value );
                } else {
                  currentCategory.setSelectedIndex( value );
                }
                break;
              case "Tags":
                currentTag.setSelectedIndex( value );
                break;
            }
          }
          break;
      }
    },
    register: function() {
      tagList.addStateListener( this );
      contentTree.addStateListener( this );
      bookManager.addStateListener( this );
    },
    unregister: function() {
      tagList.removeStateListener( this );
      contentTree.removeStateListener( this );
      bookManager.removeStateListener( this );
    },
    // ------------------------------------------------------------------------
    get rowCount() {
      return this.noteList.length;
    },
    forEach: function( f ) {
      this.noteList.forEach( f );
    },
    getIndexOfNote: function( note ) {
      return this.noteList.indexOf( note );
    },
    getNoteAtIndex: function( index ) {
      if ( index >=0 && index < this.noteList.length ) {
        return this.noteList[index];
      }
      return null;
    },
    compareNotes: function( a, b ) {
      return this.getIndexOfNote( a ) - this.getIndexOfNote( b );
    },
    insert: function( index, note ) {
      this.noteList.splice( index, 0, note );
      this.notifyListeners(
        new ru.akman.znotes.core.Event(
          "NoteInserted",
          { note: note }
        )
      );
      return this;
    },
    update: function( note ) {
      this.notifyListeners(
        new ru.akman.znotes.core.Event(
          "NoteUpdated",
          { note: note }
        )
      );
      return this;
    },
    move: function( from, to ) {
      var note = this.noteList.splice( from, 1 )[0];
      this.noteList.splice( to, 0, note );
      this.notifyListeners(
        new ru.akman.znotes.core.Event(
          "NoteMoved",
          { note: note }
        )
      );
      return this;
    },
    remove: function( note ) {
      var index = this.getIndexOfNote( note );
      if ( index !== -1 ) {
        this.noteList.splice( index, 1 );
        this.notifyListeners(
          new ru.akman.znotes.core.Event(
            "NoteRemoved",
            { note: note }
          )
        );
      }
      return this;
    },
    addListener: function( listener ) {
      if ( this.listeners.indexOf( listener ) === -1 ) {
        this.listeners.push( listener );
      }
    },
    removeListener: function( listener ) {
      var index = this.listeners.indexOf( listener );
      if ( index !== -1 ) {
        this.listeners.splice( index, 1 );
      }
    },
    notifyListeners: function( event ) {
      var name = "on" + event.type;
      this.listeners.forEach( function( listener ) {
        if ( name in listener ) {
          listener[name]( event );
        }
      } );
    },
    isNoteMustBeInList: function( note ) {
      var result = false;
      var ids = note.getTags();
      switch ( currentTag ? "Tags" : "Categories" ) {
        case "Tags":
          result = currentTag.isNoTag() ?
            ids.length === 0 : ids.indexOf( currentTag.getId() ) !== -1;
          break;
        case "Categories":
          result = ( currentCategory === note.getParent() );
          break;
      }
      return result;
    },
    /**
    Main.createBook()            ->   BookManager.createBook()
    Main.bookMoveTo()            ->   BookManager.moveBookTo()
    Main.renameBook()            ->   Book.setName()
    Main.deleteBook()            ->   Book.remove()
    Main.deleteBookWithAllData() ->   Book.removeWithAllData()
    Main.openBook()              ->   Book.open()
    Main.closeBook()             ->   Book.close()
    Main.editBook()              ->   Book.setName()
                                      Book.setDescription()
                                      Book.setDriver()
                                      Book.setConnection()
    */
    /*
    Book.setName()
    Book.setDescription()
    Book.setDriver()
    Book.setConnection()
    */
    onBookChanged: function( e ) {},
    /* Book.open() */
    onBookOpened: function( e ) {},
    /* Book.close() */
    onBookClosed: function( e ) {},
    /* Book.remove() */
    //onBookDeleted: function( e ) {},
    /* Book.removeWithAllData() */
    //onBookDeletedWithAllData: function( e ) {},
    /* BookManager.createBook() */
    //onBookCreated: function( e ) {},
    /* BookManager.appendBook() */
    onBookAppended: function( e ) {},
    /* BookManager.removeBook() */
    onBookRemoved: function( e ) {},
    /* BookManager.moveBookTo() */
    onBookMovedTo: function( e ) {},
    /**
    Main.createNote()    ->   Category.createNote()
    Main.renameNote()    ->   Note.rename()
    Main.deleteNote()    ->   Note.remove()
    Main.noteMoveTo()    ->   Note.moveTo()
    Main.noteMoveInto()  ->   Note.moveInto()
    
    Main.createCategory()    ->   Category.createCategory()
    Main.renameCategory()    ->   Category.rename()
    Main.deleteCategory()    ->   Category.remove()
    Main.categoryMoveTo()    ->   Category.moveTo()
    Main.categoryMoveInto()  ->   Category.moveInto()
    */
    /* Category.createCategory() */
    //onCategoryCreated: function( e ) {},
    /* Category.remove(), in Bin */
    //onCategoryDeleted: function( e ) {},
    /* Category.appendCategory() */
    onCategoryAppended: function( e ) {},
    /* Category.removeCategory() */
    onCategoryRemoved: function( e ) {},
    /* Category.moveTo() */
    onCategoryMovedTo: function( e ) {},
    /* Category.moveInto() */
    onCategoryMovedInto: function( e ) {},
    /* Category.rename() */
    onCategoryChanged: function( e ) {},
    /* Category.createNote() */
    //onNoteCreated: function( e ) {},
    /* Note.remove() in Bin */
    //onNoteDeleted: function( e ) {},
    /* Category.appendNote() */
    onNoteAppended: function( e ) {
      log.trace( "onNoteAppended()" );
      var aParent = e.data.parentCategory;
      var aNote = e.data.appendedNote;
      var aBook = aParent.getBook();
      var aRow;
      if ( !currentBook || currentBook !== aBook ) {
        return;
      }
      //updateFolderTreeItem( aParent );
      if ( this.isNoteMustBeInList( aNote ) ) {
        switch ( currentTag ? "Tags" : "Categories" ) {
          case "Tags":
            aRow = this.rowCount;
            break;
          case "Categories":
            //updateCategoryCommands();
            aRow = aNote.getIndex();
            break;
        }
        this.insert( aRow, aNote );
      }
    },
    /* Category.removeNote() in Bin */
    onNoteRemoved: function( e ) {
      log.trace( "onNoteRemoved()" );
      var aParent = e.data.parentCategory;
      var aNote = e.data.removedNote;
      var aBook = aParent.getBook();
      if ( !currentBook || currentBook !== aBook ) {
        return;
      }
      //updateFolderTreeItem( aParent );
      switch ( currentTag ? "Tags" : "Categories" ) {
        case "Tags":
          break;
        case "Categories":
          if ( currentCategory === aParent ) {
            //updateCategoryCommands();
          }
          break;
      }
      this.remove( aNote );
    },
    /* Note.moveTo() */
    onNoteMovedTo: function( e ) {
      log.trace( "onNoteMovedTo()" );
      var aParent = e.data.parentCategory;
      var aNote = e.data.movedToNote;
      var aBook = aParent.getBook();
      var anOldIndex = e.data.oldValue;
      var aNewIndex = e.data.newValue;
      if ( !currentBook || currentBook !== aBook ) {
        return;
      }
      switch ( currentTag ? "Tags" : "Categories" ) {
        case "Tags":
          break;
        case "Categories":
          if ( currentCategory === aParent ) {
            this.move( anOldIndex, aNewIndex );
          }
          break;
      }
    },
    /* Note.moveInto() */
    onNoteMovedInto: function( e ) {
      log.trace( "onNoteMovedInto()" );
      var anOldParent = e.data.oldParentCategory;
      var anOldIndex = e.data.oldIndex;
      var aNewParent = e.data.newParentCategory;
      var aNewIndex = e.data.newIndex;
      var aNote = e.data.movedIntoNote;
      var aBook = anOldParent.getBook();
      var aRow;
      if ( !currentBook || currentBook !== aBook ) {
        return;
      }
      //updateFolderTreeItem( anOldParent );
      //updateFolderTreeItem( aNewParent );
      switch ( currentTag ? "Tags" : "Categories" ) {
        case "Tags":
          this.update( aNote );
          break;
        case "Categories":
          if ( currentCategory === anOldParent ) {
            //updateCategoryCommands();
            this.remove( aNote );
          } else if ( currentCategory === aNewParent ) {
            //updateCategoryCommands();
            aRow = aNote.getIndex();
            this.insert( aRow, aNote );
          }
          break;
      }
    },
    /* Note.rename() */
    onNoteChanged: function( e ) {
      log.trace( "onNoteChanged()" );
      var aParent = e.data.parentCategory;
      var aNote = e.data.changedNote;
      var aBook = aParent.getBook();
      if ( !currentBook || currentBook !== aBook ) {
        return;
      }
      this.update( aNote );
    },
    /* Note.setType() */
    onNoteTypeChanged: function( e ) {
      log.trace( "onNoteTypeChanged()" );
      var aParent = e.data.parentCategory;
      var aNote = e.data.changedNote;
      var aBook = aParent.getBook();
      if ( !currentBook || currentBook !== aBook ) {
        return;
      }
      this.update( aNote );
    },
    /* Note.setLoading() */
    onNoteLoadingChanged: function( e ) {
      log.trace( "onNoteLoadingChanged()" );
      var aParent = e.data.parentCategory;
      var aNote = e.data.changedNote;
      var aBook = aParent.getBook();
      if ( !currentBook || currentBook !== aBook ) {
        return;
      }
      this.update( aNote );
    },
    /* Note.setMode() */
    //onNoteModeChanged: function( e ) {},
    /* Note.setData() */
    //onNoteDataChanged: function( e ) {},
    /* Note.savePreference() */
    //onNotePrefChanged: function( e ) {},
    /* Note.setTags() */
    onNoteTagsChanged: function( e ) {
      log.trace( "onNoteTagsChanged()" );
      var aParent = e.data.parentCategory;
      var aNote = e.data.changedNote;
      var oldTags = e.data.oldValue;
      var newTags = e.data.newValue;
      var aBook = aParent.getBook();
      var aRow;
      if ( !currentBook || currentBook !== aBook ) {
        return;
      }
      switch ( currentTag ? "Tags" : "Categories" ) {
        case "Categories":
          this.update( aNote );
          break;
        case "Tags":
          aRow = this.getIndexOfNote( aNote );
          if ( this.isNoteMustBeInList( aNote ) ) {
            if ( aRow === -1 ) {
              aRow = this.rowCount;
              this.insert( aRow, aNote );
            } else {
              this.update( aNote );
            }
          } else {
            this.remove( aNote );
          }
          break;
      }
    },
    /* Note.setTags() */
    onNoteMainTagChanged: function( e ) {
      log.trace( "onNoteMainTagChanged()" );
      var aCategory = e.data.parentCategory;
      var aNote = e.data.changedNote;
      var oldTag = e.data.oldValue;
      var newTag = e.data.newValue;
      var aBook = aCategory.getBook();
      if ( !currentBook || currentBook !== aBook ) {
        return;
      }
      this.update( aNote );
    },
    /* Note.setMainContent() */
    onNoteMainContentChanged: function( e ) {
      log.trace( "onNoteMainContentChanged()" );
      var aCategory = e.data.parentCategory;
      var aNote = e.data.changedNote;
      var oldContent = e.data.oldValue;
      var newContent = e.data.newValue;
      var aBook = aCategory.getBook();
      if ( !currentBook || currentBook !== aBook ) {
        return;
      }
      this.update( aNote );
    },
    /* Note.loadContentDirectory() */
    onNoteContentLoaded: function( e ) {
      log.trace( "onNoteContentLoaded()" );
      var aCategory = e.data.parentCategory;
      var aNote = e.data.changedNote;
      var aBook = aNote.getBook();
      if ( !currentBook || currentBook !== aBook ) {
        return;
      }
      this.update( aNote );
    },
    /* Note.addContent() */
    //onNoteContentAppended: function( e ) {},
    /* Note.removeContent() */
    //onNoteContentRemoved: function( e ) {},
    /* Note.addAttachment() */
    onNoteAttachmentAppended: function( e ) {
      log.trace( "onNoteAttachmentAppended()" );
      var aCategory = e.data.parentCategory;
      var aNote = e.data.changedNote;
      var anAttachmentInfo = e.data.attachmentInfo;
      var aBook = aCategory.getBook();
      if ( !currentBook || currentBook !== aBook ) {
        return;
      }
      this.update( aNote );
    },
    /* Note.removeAttachment() */
    onNoteAttachmentRemoved: function( e ) {
      log.trace( "onNoteAttachmentRemoved()" );
      var aCategory = e.data.parentCategory;
      var aNote = e.data.changedNote;
      var anAttachmentInfo = e.data.attachmentInfo;
      var aBook = aCategory.getBook();
      if ( !currentBook || currentBook !== aBook ) {
        return;
      }
      this.update( aNote );
    },
    /**
    Main.createTag()   ->   TagList.createTag()
    Main.tagMoveTo()   ->   TagList.moveTagTo()
    Main.renameTag()   ->   Tag.setName()
    Main.colorTag()    ->   Tag.setColor()
    Main.deleteTag()   ->   Tag.remove()
    */
    /*
    Tag.setName()
    Tag.setColor()
    */
    onTagChanged: function( e ) {},
    /* TagList.createTag() */
    //onTagCreated: function( e ) {},
    /* Tag.remove() */
    //onTagDeleted: function( e ) {},
    /* TagList.appendTag() */
    onTagAppended: function( e ) {},
    /* TagList.removeTag() */
    onTagRemoved: function( e ) {},
    /* TagList.moveTagTo() */
    onTagMovedTo: function( e ) {}
  };

  // VIEW

  function NoteTreeFilter() {
    this.reset();
  };
  NoteTreeFilter.prototype = {
    reset: function() {
      this.isActive = false;
      this.isPined = false;
      this.flagAttachments = false;
      this.flagType = false;
      this.selectedTypes = [];
      this.flagCreated = false;
      this.selectedCreated = [];
      this.flagUpdated = false;
      this.selectedUpdated = [];
      this.flagCategory = false;
      this.flagTag = false;
      this.flagName = true;
      this.flagBody = false;
      this.text = "";
      return this;
    },
    serialize: function() {
      return JSON.stringify( this, function ( key, value ) {
        if ( typeof( value ) === 'object' &&
          value.constructor.name === "DateIntervals" ) {
          return value.toString();
        }
        return value;        
      } );
    },
    parse: function( types, intervals, str ) {
      var parsed, that = this;
      try {
        parsed = JSON.parse( str );
        if ( "isActive" in parsed &&
          typeof( parsed.isActive ) === "boolean" ) {
          this.isActive = parsed.isActive;
        }
        if ( "isPined" in parsed &&
          typeof( parsed.isPined ) === "boolean" ) {
          this.isPined = parsed.isPined;
        }
        if ( "flagAttachments" in parsed &&
          typeof( parsed.flagAttachments ) === "boolean" ) {
          this.flagAttachments = parsed.flagAttachments;
        }
        if ( "selectedTypes" in parsed &&
          typeof( parsed.selectedTypes ) === "object" &&
          parsed.selectedTypes.constructor.name === "Array" ) {
          parsed.selectedTypes.forEach( function ( t ) {
            for each ( var noteType in types ) {
              if ( noteType.contentType === t ) {
                that.selectedTypes.push( t );
                break;
              }
            }
          } );
        }
        if ( "flagType" in parsed &&
          typeof( parsed.flagType ) === "boolean" ) {
          this.flagType = parsed.flagType &&
            !!this.selectedTypes.length;
        }
        if ( "selectedCreated" in parsed &&
          typeof( parsed.selectedCreated ) === "object" &&
          parsed.selectedCreated.constructor.name === "Array" ) {
          parsed.selectedCreated.forEach( function ( id ) {
            for each ( var dateInterval in intervals ) {
              if ( id === dateInterval.value.toString() ) {
                that.selectedCreated.push( dateInterval.value );
                break;
              }
            }
          } );
        }
        if ( "flagCreated" in parsed &&
          typeof( parsed.flagCreated ) === "boolean" ) {
          this.flagCreated = parsed.flagCreated &&
            !!this.selectedCreated.length;
        }
        if ( "selectedUpdated" in parsed &&
          typeof( parsed.selectedUpdated ) === "object" &&
          parsed.selectedUpdated.constructor.name === "Array" ) {
          parsed.selectedUpdated.forEach( function ( id ) {
            for each ( var dateInterval in intervals ) {
              if ( id === dateInterval.value.toString() ) {
                that.selectedUpdated.push( dateInterval.value );
                break;
              }
            }
          } );
        }
        if ( "flagUpdated" in parsed &&
          typeof( parsed.flagUpdated ) === "boolean" ) {
          this.flagUpdated = parsed.flagUpdated &&
            !!this.selectedUpdated.length;
        }
        if ( "flagCategory" in parsed &&
          typeof( parsed.flagCategory ) === "boolean" ) {
          this.flagCategory = parsed.flagCategory;
        }
        if ( "flagTag" in parsed &&
          typeof( parsed.flagTag ) === "boolean" ) {
          this.flagTag = parsed.flagTag;
        }
        if ( "flagName" in parsed &&
          typeof( parsed.flagName ) === "boolean" ) {
          this.flagName = parsed.flagName;
        }
        if ( "flagBody" in parsed &&
          typeof( parsed.flagBody ) === "boolean" ) {
          this.flagBody = parsed.flagBody;
        }
        if ( "text" in parsed &&
          typeof( parsed.text ) === "string" ) {
          this.text = parsed.text;
        }
      } catch ( e ) {
        log.warn( e );
      }
      return this;
    }
  };

  function NoteTreeSort() {
    this.reset();
  };
  NoteTreeSort.prototype = {
    reset: function() {
      this.isActive = false;
      this.order = 0;
      this.column = 0;
      return this;
    },
    serialize: function() {
      return JSON.stringify( this );
    },
    parse: function( columns, str ) {
      var parsed;
      try {
        parsed = JSON.parse( str );
        if ( "isActive" in parsed &&
          typeof( parsed.isActive ) === "boolean" ) {
          this.isActive = parsed.isActive;
        }
        if ( "order" in parsed &&
          typeof( parsed.order ) === "number" &&
          ( parsed.order === -1 || parsed.order === 0 || parsed.order === 1 ) ) {
          this.order = parsed.order;
        }
        if ( "column" in parsed &&
          typeof( parsed.column ) === "number" &&
          parsed.column >= columns.ATTACHMENTS &&
          parsed.column <= columns.UPDATED ) {
          this.column = parsed.column;
        }
      } catch ( e ) {
        log.warn( e );
      }
      return this;
    }
  };

  function NoteTreeSelection( view ) {
    this._view = view;
    this._selectedNote = null;
    this._prevSelectedNote = null;
    this._lastSelectedNote = null;
  };
  NoteTreeSelection.prototype = {
    get selectedNote() {
      return this._selectedNote;
    },
    select: function( note ) {
      var row = this._view.getIndexOfNote( note );
      if ( this._view.rowCount ) {
        this._view.treebox.ensureRowIsVisible( 0 );
      }
      if ( row >= 0 && row < this._view.rowCount ) {
        this._view.treebox.ensureRowIsVisible( row );
      }
      this._view.selection.select( row );
    }
  };
  
  function NoteTreeView( model ) {
    this.model = model;
    this._selection = new NoteTreeSelection( this );
    this.sort = new NoteTreeSort();
    this.filter = new NoteTreeFilter();
    this.table = [];
    this.updateBatchFlag = false;
  };
  NoteTreeView.prototype = {
    get columns() {
      return this.model.columns;
    },
    get canReorder() {
      return this.model.canReorder;
    },
    getIndexOfNote: function( note ) {
      return note ? this.table.indexOf( note ) : -1;
    },
    getNoteAtIndex: function( row ) {
      if ( row >= 0 && row < this.rowCount ) {
        return this.table[row];
      }
      return null;
    },
    contains: function( note ) {
      return this.getIndexOfNote( note ) !== -1;
    },
    compareNotes: function( a, b ) {
      if ( !this.sort.isActive && !this.canReorder ) {
        return this.model.compareNotes( a, b );
      }
      return a.compare( b, this.sort );
    },
    calcIndexOfNote: function( note ) {
      var index, flag, order, start, end;
      start = 0;
      end = this.rowCount - 1;
      if ( end === -1 ) {
        return 0;
      }
      if ( end === 0 ) {
        flag = this.compareNotes( note, this.table[start] );
        return ( flag < 0 ? start : end + 1 );
      }
      order = this.compareNotes( this.table[end], this.table[start] );
      if ( order === 0 ) {
        flag = this.compareNotes( note, this.table[start] );
        return ( flag < 0 ? start : end + 1 );
      }
      while ( start < end ) {
        index = Math.round( ( start + end ) / 2 );
        flag = order * this.compareNotes( note, this.table[index] );
        if ( flag < 0 ) {
          end = index - 1;
        } else {
          start = index + 1;
        }
      }
      index = end;
      flag = order * this.compareNotes( note, this.table[index] );
      return ( flag < 0 ? index : index + 1 );
    },
    beginUpdateBatch: function() {
      this.updateBatchFlag = true;
      this.treebox.beginUpdateBatch();
    },
    endUpdateBatch: function() {
      this.treebox.endUpdateBatch();
      this.updateBatchFlag = false;
    },
    invalidateRange: function( oldIndex, newIndex ) {
      if ( oldIndex > newIndex ) {
        this.treebox.invalidateRange( newIndex, oldIndex );
      } else {
        this.treebox.invalidateRange( oldIndex, newIndex );
      }
    },
    createNote: function( note ) {
      var row = -1;
      if ( note.meet( this.filter ) ) {
        row = this.calcIndexOfNote( note );
        this.beginUpdateBatch();
        this.table.splice( row, 0, note );
        this.treebox.rowCountChanged( row, 1 );
        this.endUpdateBatch();
      }
      return row;
    },
    deleteNote: function( note ) {
      var row = this.getIndexOfNote( note );
      if ( row !== -1 ) {
        this.beginUpdateBatch();
        this.table.splice( row, 1 );
        this.treebox.rowCountChanged( row, -1 );
        this.endUpdateBatch();
      }
      return row;
    },
    updateNote: function( note ) {
      var oldIndex = this.getIndexOfNote( note );
      var newIndex = -1;
      var selectedNote = this._selection.selectedNote;
      this.beginUpdateBatch();
      if ( oldIndex !== -1 ) {
        this.table.splice( oldIndex, 1 );
        this.treebox.rowCountChanged( oldIndex, -1 );
      }
      if ( note.meet( this.filter ) ) {
        newIndex = this.calcIndexOfNote( note );
        this.table.splice( newIndex, 0, note );
        this.treebox.rowCountChanged( newIndex, 1 );
      }
      if ( oldIndex !== -1 && newIndex !== -1 ) {
        this.invalidateRange( oldIndex, newIndex );
        this._selection.select( selectedNote );
      }
      this.endUpdateBatch();
      return { oldIndex: oldIndex, newIndex: newIndex };
    },
    update: function( filterFlag, sortFlag ) {
      var that = this;
      this.beginUpdateBatch();
      if ( filterFlag ) {
        this.table.splice( 0, this.rowCount );
        this.model.forEach( function( note ) {
          if ( note.meet( that.filter ) ) {
            that.table.push( note );
          }
        } );
      }
      if ( sortFlag ) {
    	  this.table.sort( function ( a, b ) {
          return that.compareNotes( a, b );
        } );
      }
      this.treebox.invalidate();
      this.endUpdateBatch();
      if ( this.contains( this._selection.selectedNote ) ) {
        this.beginUpdateBatch();
        this._selection.select( this._selection.selectedNote );
        this.endUpdateBatch();
      } else {
        this._selection.select( this._selection._lastSelectedNote );
      }
    },
    loadPreferences: function() {
      this.filter.parse( this.model.types, this.model.intervals,
        this.model.loadPreference( "noteTreeFilter", "{}" ) );
      this.sort.parse( this.columns,
        this.model.loadPreference( "noteTreeSort", "{}" ) );
      this._selection._lastSelectedNote =
        this.model.loadPreference( "noteTreeSelection", null );
    },
    savePreferences: function() {
      this.model.savePreference( "noteTreeFilter", this.filter.serialize() );
      this.model.savePreference( "noteTreeSort", this.sort.serialize() );
      this.model.savePreference( "noteTreeSelection", this.filter.isActive ?
        this._selection._lastSelectedNote : this._selection.selectedNote );
    },
    register: function() {
      this.model.addListener( this );
    },
    unregister: function() {
      this.model.removeListener( this );
    },
    onNoteInserted: function( event ) {
      var note = event.data.note;
      var row = this.createNote( note );
      if ( row !== -1 && this.rowCount === 1 ) {
        this._selection.select( note );
      }
    },
    onNoteUpdated: function( event ) {
      var note = event.data.note;
      var selectedNote = this._selection.selectedNote;
      var rows = this.updateNote( note );
      if ( selectedNote === note && rows.newIndex === -1 ) {
        if ( rows.oldIndex > this.rowCount - 1 ) {
          rows.oldIndex = this.rowCount - 1;
        }
        this._selection.select( this.getNoteAtIndex( rows.oldIndex ) );
        return;
      }
      if ( rows.oldIndex === -1 && rows.newIndex === 0 &&
        this.rowCount === 1 ) {
        this._selection.select( this.getNoteAtIndex( rows.newIndex ) );
        return;
      }
      // TODO: move following into detailsView.onNoteUpdated() event handler
      if ( selectedNote && selectedNote === note &&
        !selectedNote.isLoading() ) {
        updateNoteDetails();
      }
    },
    onNoteMoved: function( event ) {
      this.updateNote( event.data.note );
    },
    onNoteRemoved: function( event ) {
      var note = event.data.note;
      var row = this.deleteNote( note );
      if ( note === this._selection.selectedNote ) {
        if ( row > this.rowCount - 1 ) {
          row = this.rowCount - 1;
        }
        this._selection.select( this.getNoteAtIndex( row ) );
      }
    },
    // ------------------------------------------------------------------------
    get rowCount() {
      return this.table.length;
    },
  	getCellText: function( row, col ) {
      if ( row === -1 ) {
        return;
      }
      var note = this.table[row];
      switch ( col.index ) {
        case this.columns.ATTACHMENTS:
          return "";
        case this.columns.STICKY:
          return "";
        case this.columns.NAME:
          return note.isLoading() ?
            " " + Utils.getString( "main.note.loading" ) : note.getName();
        case this.columns.CATEGORY:
          return note.getParent().getName();
        case this.columns.TAG:
          return note.getMainTagName();
        case this.columns.TYPE:
          return note.getType();
        case this.columns.CREATED:
          return note.getCreateDateTime().toLocaleString();
        case this.columns.UPDATED:
          return note.getUpdateDateTime().toLocaleString();
      }
      return "";
  	},
  	setCellText: function( row, col, value ) {
      var note = this.getNoteAtIndex( row );
      value = value.replace( /(^\s+)|(\s+$)/g, "" );
      if ( note && value.length && value !== note.getName() ) {
        try {
          note.rename( value );
        } catch ( e ) {
          // TODO: fire `error` event          
          openErrorDialog(
            Utils.getFormattedString( "main.errordialog.note", [ value ] ),
            e.message
          );
        }
      }
    },
  	getCellValue: function( row, col ) { return ""; },
    setCellValue: function( row, col, value ) {},
  	setTree: function( treebox ) {
  		this.treebox = treebox;
  	},
    isSelectable: function( row, col ) { return false; },
  	isEditable: function( row, col ) {
  		return col.editable;
  	},
    isContainer: function( row ) { return false; },
    isSeparator: function( row ) { return false; },
    isSorted: function() {
      return this.sort && this.sort.isActive;
    },
    getLevel: function( row ) { return 0; },
    getImageSrc: function( row, col ) {
      if ( row === -1 ) {
        return;
      }
      switch ( col.index ) {
        case this.columns.TAG:
          return Images.makeTagImage(
            this.table[row].getMainTagColor(), true, 16 );
      }
      return "";
    },
    getRowProperties: function( row, props ) {
      if ( row === -1 ) {
        return;
      }
      var values = [ "NOTE_TAG_ROW_" + this.table[row].getMainTagId() ];
      if ( props ) {
        values.forEach( function( value ) {
          props.AppendElement( value );
        } );
      } else {
        return values.join( " " );
      }
    },
    getCellProperties: function( row, col, props ) {
      if ( row === -1 ) {
        return;
      }
      var note = this.table[row];
      var tagId = note.getMainTagId();
      var values = [ "NOTE_TAG_ROW_" + tagId ];
      switch ( col.index ) {
        case this.columns.ATTACHMENTS:
          if ( note.hasAttachments() ) {
            values.push( "attachment" );
          }
          break;
        case this.columns.STICKY:
          if ( note.isSticky() ) {
            values.push( "sticky" );
          }
          break;
        case this.columns.NAME:
          if ( note.isLoading() ) {
            values.push( "loading" );
          } else {
            values.push( "note" );
          }
          break;
        case this.columns.TAG:
          values.push( "tag" );
          values.push( "NOTE_TAG_" + tagId );
          break;
      }
      if ( props ) {
        values.forEach( function( value ) {
          props.AppendElement( value );
        } );
      } else {
        return values.join( " " );
      }
    },
    getColumnProperties: function( colid, col, props ) {},
    cycleHeader: function( col, elem ) {},
    cycleCell: function( row, col ) {},
    getProgressMode: function( row, col ) { return 3; },
    getParentIndex: function( row ) { return -1; },
    hasNextSibling: function( row, after ) { return false },
    isContainerEmpty: function( row ) { return true; },
    isContainerOpen: function( row ) { return false; },
    toggleOpenState: function( row ) {},
    performAction: function( action ) {},
    performActionOnRow: function( action, row ) {},
    performActionOnCell: function( action, row, col ) {},
    selectionChanged: function() {
      var note, start = new Object(), end = new Object();
      if ( !this.updateBatchFlag ) {
        this.selection.getRangeAt( 0, start, end );
        note = this.getNoteAtIndex( start.value );
        this._selection._selectedNote = note;
        if ( note && note !== this._selection._lastSelectedNote ) {
          this._selection._lastSelectedNote = note;
        }
        if ( !note && !this._selection._prevSelectedNote ||
          note !== this._selection._prevSelectedNote ) {
          this._selection._prevSelectedNote = note;
          // TODO: fire `select` event
          updateNoteDetails();
        }
      }
    },
    canDrop: function( row, orientation, dataTransfer ) {
      var selectedRow = this.getIndexOfNote( this._selection.selectedNote );
      if ( !this.canReorder ||
        this.sort.isActive || this.filter.isActive ||
        !dataTransfer.types.contains( "znotes/x-note" ) ||
        dataTransfer.getData( "znotes/x-note" ) !== "NOTE" ||
        dataTransfer.dropEffect !== "move" ||
        selectedRow === row || selectedRow === row + orientation ) {
        dataTransfer.dropEffect = "none";
        return false;
      }
      return true;
    },
    drop: function( row, orientation, dataTransfer ) {
      var note = this._selection.selectedNote;
      if ( orientation === 1 ) {
        ++row;
      }
      if ( row > this.getIndexOfNote( note ) ) {
        --row;
      }
      note.moveTo( row );
    }
  };

  function NoteTreeFilterView( model ) {
    this.model = model;
    this._collapsed = true;
  };
  NoteTreeFilterView.prototype = {
    get isCollapsed() {
      return this._collapsed;
    },
    toggleOpenState: function() {
      this._collapsed = !this._collapsed;
    },
    loadPreferences: function() {
      var value = "" + this.model.loadPreference( "qfBoxCollapsed", "true" );
      this._collapsed = value.toLowerCase() === "true";
    },
    savePreferences: function() {
      this.model.savePreference( "qfBoxCollapsed", this._collapsed );
    },
    register: function() {
      this.model.addListener( this );
    },
    unregister: function() {
      this.model.removeListener( this );
    },
    onNoteInserted: function( event ) {
      updateFilterMatchState( noteTreeView.filter );
    },
    onNoteUpdated: function( event ) {
      updateFilterMatchState( noteTreeView.filter );
    },
    onNoteMoved: function( event ) {
      updateFilterMatchState( noteTreeView.filter );
    },
    onNoteRemoved: function( event ) {
      updateFilterMatchState( noteTreeView.filter );
    }
  };
  
  // COMMANDS

  function doNewNote() {
    var aName, aTagID, aSticky, aCategory, aNote;
    aCategory = currentCategory;
    aName = Utils.getString( "main.note.newName" );
    aSticky = noteTreeView.filter.isActive;
    aTagID = null;
    if ( currentTag ) {
      aCategory = currentBook.getContentTree().getRoot();
      aTagID = currentTag.getId();
      if ( aTagID === "00000000000000000000000000000000" ) {
        aTagID = null;
      }
    }
    aName = aCategory.getValidNoteName( aName, defaultType );
    aNote = aCategory.createNote( aName, defaultType, aTagID, aSticky );
    if ( noteTreeView._selection.selectedNote !== aNote ) {
      noteTreeView._selection.select( aNote );
    }
    doRenameNote();
  };

  function doDeleteNote() {
    var note = noteTreeView._selection.selectedNote;
    var params = {
      input: {
        title: Utils.getString( "main.note.confirmDelete.title" ),
        message1: Utils.getFormattedString(
          "main.note.confirmDelete.message1", [ note.name ] ),
        message2: ( note.isInBin() ?
                      Utils.getString( "main.category.confirmClearBin.message1" ) :
                      Utils.getString( "main.note.confirmDelete.message2" ) )
      },
      output: null
    };
    window.openDialog(
      "chrome://znotes/content/confirmdialog.xul",
      "",
      "chrome,dialog=yes,modal=yes,centerscreen,resizable=no",
      params
    ).focus();
    if ( params.output && params.output.result ) {
      note.remove();
    }
  };
  
  function doRenameNote() {
    var note = noteTreeView._selection.selectedNote;
    var row = noteTreeView.getIndexOfNote( note );
    var col = noteTree.columns.getColumnAt( noteTreeView.columns.NAME );
    noteTree.setAttribute( "editable", "true" );
    noteTree.startEditing( row, col );
    noteTree.removeAttribute( "editable" );
  };

  function doToggleFilterBar() {
    noteTreeFilterView.toggleOpenState();
    onFilterChange();
  };

  // UI EVENT HANDLERS

  function addEventListeners() {
    qfText.addEventListener( "command", onFilterChange, false );
    qfPin.addEventListener( "command", onFilterChange, false );
    qfAttachments.addEventListener( "command", onFilterChange, false );
    qfType.addEventListener( "command", onFilterChange, false );
    qfCreated.addEventListener( "command", onFilterChange, false );
    qfUpdated.addEventListener( "command", onFilterChange, false );
    qfCategory.addEventListener( "command", onFilterChange, false );
    qfTag.addEventListener( "command", onFilterChange, false );
    qfName.addEventListener( "command", onFilterChange, false );
    qfBody.addEventListener( "command", onFilterChange, false );
    noteTree.addEventListener( "select", onSelectNoteTree, false );
    noteTree.addEventListener( "click", onClickNoteTree, true );
    noteTreeChildren.addEventListener( "contextmenu", onContextMenuNoteTree, true );
    noteTreeChildren.addEventListener( "dragstart", onDragNoteTree, false );
    noteTreeTextBox.addEventListener( "keyup", onKeyupNoteTree, false );
  };

  function removeEventListeners() {
    qfText.removeEventListener( "command", onFilterChange, false );
    qfPin.removeEventListener( "command", onFilterChange, false );
    qfAttachments.removeEventListener( "command", onFilterChange, false );
    qfType.removeEventListener( "command", onFilterChange, false );
    qfCreated.removeEventListener( "command", onFilterChange, false );
    qfUpdated.removeEventListener( "command", onFilterChange, false );
    qfCategory.removeEventListener( "command", onFilterChange, false );
    qfTag.removeEventListener( "command", onFilterChange, false );
    qfName.removeEventListener( "command", onFilterChange, false );
    qfBody.removeEventListener( "command", onFilterChange, false );
    noteTree.removeEventListener( "select", onSelectNoteTree, false );
    noteTree.removeEventListener( "click", onClickNoteTree, true );
    noteTreeChildren.removeEventListener( "contextmenu", onContextMenuNoteTree, true );
    noteTreeChildren.removeEventListener( "dragstart", onDragNoteTree, false );
    noteTreeTextBox.removeEventListener( "keyup", onKeyupNoteTree, false );
  };
  
  function onSelectNoteTree( event ) {
    noteTree.view.selectionChanged();
  };
  
  function onDragNoteTree( event ) {
    var note = noteTreeView._selection.selectedNote;
    if ( !note ) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
    event.dataTransfer.effectAllowed = "copyMove";
    event.dataTransfer.setData( "znotes/x-note", "NOTE" );
  };

  function onContextMenuNoteTree( event ) {
    var row = noteTree.treeBoxObject.getRowAt( event.clientX, event.clientY );
    var count = noteTreeView.rowCount;
    if ( event.detail !== 1 || count > 0 && ( row < 0 || row > count - 1 ) ) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
    return true;
  };

  function onClickNoteTree( event ) {
    var count, note;
    var row = new Object(), col = new Object(), child = new Object();
    switch ( event.originalTarget.localName ) {
      case "treecol":
        if ( event.button === 0 && event.detail === 1 ) {
          // click
          onSortChange( event );
        }
        break;
      case "treechildren":
        count = noteTreeView.rowCount;
        noteTree.treeBoxObject.getCellAt( event.clientX, event.clientY, row, col, child );
        if ( event.detail === 1 ) {
          if ( event.button === 0 ) {
            if ( row.value >= 0 && row.value < count ) {
              // click
              switch ( col.value.index ) {
                case noteTreeView.columns.STICKY:
                  noteTreeView.getNoteAtIndex( row.value ).toggleSticky();
                  break;
              }
              return true;
            }
          } else {
            if ( !count || row.value >= 0 && row.value < count ) {
              // context
              return true;
            }
          }
        } else {
          if ( event.button === 0 ) {
            if ( count && row.value >= 0 && row.value < count ) {
              if ( col.value.index !== noteTreeView.columns.STICKY ) {
                // dblclick
              }
            }
          }
        }
        break;
      default:
        return true;
    }
    event.stopPropagation();
    event.preventDefault();
    return false;
  };
  
  function onKeyupNoteTree( event ) {
    var len = noteTreeTextBox.textLength;
    switch ( event.keyCode ) {
      case event.DOM_VK_HOME:
        if ( event.shiftKey ) {
          noteTreeTextBox.setSelectionRange( 0,
            noteTreeTextBox.selectionEnd );
        } else {
          noteTreeTextBox.setSelectionRange( 0, 0 );
        }
        break;
      case event.DOM_VK_END:
        if ( len > 0 ) {
          if ( event.shiftKey ) {
            noteTreeTextBox.setSelectionRange(
              noteTreeTextBox.selectionStart, len );
          } else {
            noteTreeTextBox.setSelectionRange( len, len );
          }
        }
        break;
    }
  };
  
  function onSortChange( event ) {
    var sort = noteTreeView.sort;
    var column = noteTree.columns.getColumnFor( event.originalTarget ).index;
    if ( !sort.isActive ) {
      sort.isActive = true;
      sort.order = 1;
      sort.column = column;
    } else {
      if ( sort.column === column ) {
        switch ( sort.order ) {
          case -1:
            sort.isActive = false;
            break;
          case 1:
            sort.order = -1;
            break;
        }
      } else {
        sort.column = column;
        sort.order = 1;
      }
    }
    updateView( false /* filter */, true /* sort */ );
  };

  function onFilterChange( event ) {
    var target = event ? event.target : { id: "qfButton" };
    var prefix = getIdPrefix( target.id );
    var of = {}, nf = noteTreeView.filter, qfFlag = false;
    Utils.cloneObject( nf, of );
    switch ( prefix ) {
      // TODO: qfFlag - fack! noteTreeFilterView.isCollapsed
      case "qfButton":
        if ( !qfButton.checked ) {
          nf.reset();
        }
        qfFlag = true;
        break;
      case "qfPin":
        nf.isPined = target.checked;
        break;
      case "qfText":
        nf.text = target.value;
        break;
      case "qfAttachments":
        nf.flagAttachments = target.checked;
        break;
      case "qfType":
        nf.flagType = nf.selectedTypes.length &&
          !isButtonChecked( target );
        setButtonChecked( target, nf.flagType );
        break;
      case "qfTypeMenuPopup":
        nf.selectedTypes = getCheckedItems( qfTypeMenuPopup );
        switch ( nf.selectedTypes.length ) {
          case 0:
            nf.flagType = false;
            setButtonChecked( qfType, false );
            break;
          case 1:
            nf.flagType = true;
            setButtonChecked( qfType, true );
            break;
        }
        break;
      case "qfCreated":
        nf.flagCreated = nf.selectedCreated.length &&
          !isButtonChecked( target );
        setButtonChecked( target, nf.flagCreated );
        break;
      case "qfCreatedMenuPopup":
        nf.selectedCreated = [];
        getCheckedItems( qfCreatedMenuPopup ).forEach( function ( id ) {
          for each ( var dateInterval in dateIntervals ) {
            if ( id === dateInterval.value.toString() ) {
              nf.selectedCreated.push( dateInterval.value );
              break;
            }
          }
        } );
        switch ( nf.selectedCreated.length ) {
          case 0:
            nf.flagCreated = false;
            setButtonChecked( qfCreated, false );
            break;
          case 1:
            nf.flagCreated = true;
            setButtonChecked( qfCreated, true );
            break;
        }
        break;
      case "qfUpdated":
        nf.flagUpdated = nf.selectedUpdated.length &&
          !isButtonChecked( target );
        setButtonChecked( target, nf.flagUpdated );
        break;
      case "qfUpdatedMenuPopup":
        nf.selectedUpdated = [];
        getCheckedItems( qfUpdatedMenuPopup ).forEach( function ( id ) {
          for each ( var dateInterval in dateIntervals ) {
            if ( id === dateInterval.value.toString() ) {
              nf.selectedUpdated.push( dateInterval.value );
              break;
            }
          }
        } );
        switch ( nf.selectedUpdated.length ) {
          case 0:
            nf.flagUpdated = false;
            setButtonChecked( qfUpdated, false );
            break;
          case 1:
            nf.flagUpdated = true;
            setButtonChecked( qfUpdated, true );
            break;
        }
        break;
      case "qfCategory":
        nf.flagCategory = target.checked;
        break;
      case "qfTag":
        nf.flagTag = target.checked;
        break;
      case "qfName":
        nf.flagName = target.checked;
        break;
      case "qfBody":
        nf.flagBody = target.checked;
        break;
    }
    nf.isActive = nf.flagAttachments ||
      nf.flagType || nf.flagCreated || nf.flagUpdated ||
      nf.text.length && ( nf.flagCategory || nf.flagTag ||
      nf.flagName || nf.flagBody );
    // TODO: qfFlag - fack!
    if ( qfFlag || !nf.isActive && of.isActive ||
      nf.isActive && !of.isActive ||
      nf.isActive && of.isActive && (
        nf.text.toLowerCase() !== of.text.toLowerCase() ||
        nf.flagAttachments !== of.flagAttachments ||
        nf.flagType !== of.flagType ||
        !haveSameValues( nf.selectedTypes, of.selectedTypes ) ||
        nf.flagCreated !== of.flagCreated ||
        !haveSameValues( nf.selectedCreated, of.selectedCreated ) ||
        nf.flagUpdated !== of.flagUpdated ||
        !haveSameValues( nf.selectedUpdated, of.selectedUpdated ) ||
        nf.flagCategory !== of.flagCategory ||
        nf.flagTag !== of.flagTag ||
        nf.flagName !== of.flagName ||
        nf.flagBody !== of.flagBody ) ) {
      updateView( true /* filter */, true /* sort */ );
    }
  };
  
  // UI

  function updateNoteDetails() {
    var note = noteTreeView._selection.selectedNote;
    mainController.updateCommands();
    noteTreeDetails.value = note ? note.toString() : "<NULL>";
  };
  
  function updateNewNoteMenuPopup() {
    var newNoteButtonMenuPopup = document.getElementById(
      "znotes_newnote_button_menupopup" );
    if ( !newNoteButtonMenuPopup ) {
      return;
    }
    while ( newNoteButtonMenuPopup.firstChild ) {
      newNoteButtonMenuPopup.removeChild(
        newNoteButtonMenuPopup.firstChild );
    }
    noteTypes.forEach( function( noteType ) {
      var menuItem = document.createElement( "menuitem" );
      menuItem.className = "menuitem-iconic";
      menuItem.setAttribute( "id", "newNoteButtonMenuPopup_" +
        noteType.name + "_" + noteType.contentIndex );
      menuItem.setAttribute( "value", noteType.contentType );
      menuItem.setAttribute( "label", " " + noteType.description );
      menuItem.setAttribute( "tooltiptext", noteType.contentType );
      menuItem.style.setProperty( "list-style-image",
        "url( '" + noteType.iconURL + "' )" , "important" );
      menuItem.addEventListener( "command", function( event ) {
        defaultType = event.target.getAttribute( "value" );
      }, false );
      newNoteButtonMenuPopup.appendChild( menuItem );
    } );
  };

  function updateQFTypeMenuPopup() {
    while ( qfTypeMenuPopup.firstChild ) {
      qfTypeMenuPopup.removeChild( qfTypeMenuPopup.firstChild );
    }
    noteTypes.forEach( function( noteType ) {
      var menuItem = document.createElement( "menuitem" );
      menuItem.className = "menuitem-iconic";
      menuItem.setAttribute( "type", "checkbox" );
      menuItem.setAttribute( "checked", "false" );
      menuItem.setAttribute( "closemenu", "none" );
      menuItem.className = "menuitem-iconic";
      menuItem.setAttribute( "id", "qfTypeMenuPopup_" +
        noteType.name + "_" + noteType.contentIndex );
      menuItem.setAttribute( "value", noteType.contentType );
      menuItem.setAttribute( "label", noteType.description );
      menuItem.setAttribute( "tooltiptext", noteType.contentType );
      menuItem.style.setProperty( "list-style-image",
        "url( '" + noteType.iconURL + "' )" , "important" );
      qfTypeMenuPopup.appendChild( menuItem );
    } );
  };

  function updateQFCreatedMenuPopup() {
    var index = 0;
    while ( qfCreatedMenuPopup.firstChild ) {
      qfCreatedMenuPopup.removeChild( qfCreatedMenuPopup.firstChild );
    }
    dateIntervals.forEach( function( dateInterval ) {
      var menuItem = document.createElement( "menuitem" );
      menuItem.setAttribute( "type", "checkbox" );
      menuItem.setAttribute( "checked", "false" );
      menuItem.setAttribute( "closemenu", "none" );
      menuItem.className = "menuitem-iconic";
      menuItem.setAttribute( "id", "qfCreatedMenuPopup_" + index++ );
      menuItem.setAttribute( "value", dateInterval.value.toString() );
      menuItem.setAttribute( "label", dateInterval.name );
      qfCreatedMenuPopup.appendChild( menuItem );
    } );
  };

  function updateQFUpdatedMenuPopup() {
    var index = 0;
    while ( qfUpdatedMenuPopup.firstChild ) {
      qfUpdatedMenuPopup.removeChild( qfUpdatedMenuPopup.firstChild );
    }
    dateIntervals.forEach( function( dateInterval ) {
      var menuItem = document.createElement( "menuitem" );
      menuItem.setAttribute( "type", "checkbox" );
      menuItem.setAttribute( "checked", "false" );
      menuItem.setAttribute( "closemenu", "none" );
      menuItem.className = "menuitem-iconic";
      menuItem.setAttribute( "id", "qfUpdatedMenuPopup_" + index++ );
      menuItem.setAttribute( "value", dateInterval.value.toString() );
      menuItem.setAttribute( "label", dateInterval.name );
      qfUpdatedMenuPopup.appendChild( menuItem );
    } );
  };

  function updateQFView() {
    var filter = noteTreeView.filter;
    var isCollapsed = noteTreeFilterView.isCollapsed;
    updateCBState( qfPin, filter.isPined );
    updateCBState( qfAttachments, filter.flagAttachments );
    setCheckedItems( qfTypeMenuPopup, filter.selectedTypes );
    updateCBState( qfType, filter.flagType );
    setCheckedItems( qfCreatedMenuPopup, filter.selectedCreated );
    updateCBState( qfCreated, filter.flagCreated );
    setCheckedItems( qfUpdatedMenuPopup, filter.selectedUpdated );
    updateCBState( qfUpdated, filter.flagUpdated );
    updateCBState( qfCategory, filter.flagCategory );
    updateCBState( qfTag, filter.flagTag );
    updateCBState( qfName, filter.flagName );
    updateCBState( qfBody, filter.flagBody );
    qfText.value = filter.text;
    if ( !filter.isActive && isCollapsed ) {
      qfBox.setAttribute( "collapsed", true );
      updateCBState( qfButton, false );
    } else {
      qfBox.removeAttribute( "collapsed" );
      updateCBState( qfButton, true );
    }
  };

  function updateView( filterFlag, sortFlag ) {
    updateQFView();
    updateFilterSearchState( noteTreeView.filter );
    noteTreeView.update( filterFlag, sortFlag );
    updateFilterMatchState( noteTreeView.filter );
    updateSortState( noteTreeView.sort );
  };

  function updateFilterSearchState( filter ) {
    if ( !filter.isActive ) {
      noteTree.removeAttribute( "filterActive" );
    } else {
      noteTree.setAttribute( "filterActive", "searching" );
    }
  };

  function updateFilterMatchState( filter ) {
    if ( filter.isActive ) {
      qfMatch.removeAttribute( "collapsed" );
      if ( noteTreeView.rowCount ) {
        noteTree.setAttribute( "filterActive", "matches" );
        qfMatch.setAttribute( "filterActive", "matches" );
        qfMatch.value = Utils.getFormattedString(
          "main.note.filter.matches", [ noteTreeView.rowCount ] );
      } else {
        noteTree.setAttribute( "filterActive", "nomatches" );
        qfMatch.setAttribute( "filterActive", "nomatches" );
        qfMatch.value = Utils.getString( "main.note.filter.nomatches" );
      }
    } else {
      noteTree.removeAttribute( "filterActive" );
      qfMatch.setAttribute( "collapsed", true );
    }
  };
  
  function updateSortState( sort ) {
    var column = sort.isActive ? sort.column : -1;
    var order = sort.isActive ? sort.order : 0;
    var direction = "natural";
    if ( order < 0 ) {
      direction = "descending";
    }
    if ( order > 0 ) {
      direction = "ascending";
    }
    for ( var i = 0; i < noteTree.columns.length; i++ ) {
      if ( noteTree.columns[i].index === column ) {
        noteTree.columns[i].element.setAttribute(
          "sortDirection", direction );
      } else {
        noteTree.columns[i].element.removeAttribute(
          "sortDirection" );
      }
    }
  };

  // UI HELPERS
  
  function updateCBState( cb, state ) {
    if ( state ) {
      cb.setAttribute( "checked", "true" );
    } else {
      cb.removeAttribute( "checked" );
    }
  };

  function isButtonChecked( button ) {
    return button.getAttribute( "checked" ) === "true";
  };

  function setButtonChecked( button, state ) {
    button.setAttribute( "checked", state );
    return state;
  };
  
  function forEachMenuItem( menupopup, func ) {
    var items = menupopup.childNodes;
    for ( var i = 0; i < items.length; i++ ) {
      func( items[i] );
    }
  };

  function getCheckedItems( menupopup ) {
    var result = [];
    forEachMenuItem( menupopup, function( item ) {
      if ( item.getAttribute( "checked" ) === "true" ) {
        result.push( item.getAttribute( "value" ) );
      }
    } );
    return result;
  };

  function setCheckedItems( menupopup, values ) {
    forEachMenuItem( menupopup, function( item ) {
      var flag = false;
      var value = item.getAttribute( "value" );
      for each ( var v in values ) {
        if ( v == value ) {
          flag = true;
          break;
        }
      }
      item.setAttribute( "checked", flag );
    } );
  };

  function haveSameValues( arr1, arr2 ) {
    var flag, val1, val2;
    if ( arr1.length !== arr2.length ) {
      return false;
    }
    for each ( val1 in arr1 ) {
      if ( typeof( val1 ) === "object" ) {
        flag = false;
        for each ( val2 in arr2 ) {
          if ( val1.toString() === val2.toString() ) {
            flag = true;
            break;
          }
        }
        if ( !flag ) {
          return false;
        }
      } else {
        if ( arr2.indexOf( val1 ) === -1 ) {
          return false;
        }
      }
    }
    return true;
  };

  function getIdPrefix( id ) {
    var pos = id.indexOf( "_" );
    return pos === -1 ? id : id.substring( 0, pos );
  };

  // CONTEXT
  
  function initContext() {
    var ctx = Utils.MAIN_CONTEXT();
    currentBook = ctx.book;
    currentCategory = ctx.category;
    currentTag = ctx.tag;
    bookManager = ru.akman.znotes.core.BookManager.getInstance();
    tagList = currentBook.getTagList();
    contentTree = currentBook.getContentTree();
    dateIntervals = getDateIntervals();
    defaultType = Utils.DEFAULT_DOCUMENT_TYPE;
    noteTypes = getNoteTypes();
  };
  
  // HELPERS

  function getNoteTypes() {
    var types, doc, contentType;
    var docs =
      ru.akman.znotes.DocumentManager.getInstance().getDocuments();
    var result = [];
    for ( var name in docs ) {
      doc = docs[name];
      types = doc.getTypes();
      for ( var i = 0; i < types.length; i++ ) {
        result.push( {
          contentIndex: i,
          contentType: types[i],
          name: doc.getName(),
          description: doc.getDescription(),
          iconURL: doc.getIconURL()
        } );
      }
    }
    return result;
  };
  
  function getDateIntervals() {
    var dio =
      ru.akman.znotes.DateUtils.getDateIntervals( Utils.FIRST_DAY_OF_WEEK );
    var result = [];
    dio.forEach( function( dateInterval ) {
      result.push( {
        name: Utils.getString( "main.dateIntervals." +
          dateInterval.toString() ),
        value: dateInterval
      } );
    } );
    return result;
  };
  
  function openErrorDialog( message1, message2 ) {
    var params = {
      input: {
        title: Utils.getString( "main.errordialog.title" ),
        message1: message1,
        message2: message2
      },
      output: null
    };
    window.setTimeout(
      function() {
        window.openDialog(
          "chrome://znotes/content/messagedialog.xul",
          "",
          "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
          params
        ).focus();
      },
      0
    );
  };
  
  // PUBLIC

  pub.onLoad = function( event ) {
    Utils.LOGGER_LEVEL = "ALL";
    qfButton = document.getElementById( "znotes_showfilterbar_button" );
    qfBox = document.getElementById( "filterBox" );
    qfText = document.getElementById( "qfText" );
    qfMatch = document.getElementById( "qfMatch" );
    qfPin = document.getElementById( "qfPin" );
    qfAttachments = document.getElementById( "qfAttachments" );
    qfType = document.getElementById( "qfType" );
    qfTypeMenuPopup = document.getElementById( "qfTypeMenuPopup" );
    qfCreated = document.getElementById( "qfCreated" );
    qfCreatedMenuPopup = document.getElementById( "qfCreatedMenuPopup" );
    qfUpdated = document.getElementById( "qfUpdated" );
    qfUpdatedMenuPopup = document.getElementById( "qfUpdatedMenuPopup" );
    qfCategory = document.getElementById( "qfCategory" );
    qfTag = document.getElementById( "qfTag" );
    qfName = document.getElementById( "qfName" );
    qfBody = document.getElementById( "qfBody" );
    noteTree = document.getElementById( "noteTree" );
    noteTreeChildren = document.getElementById( "noteTreeChildren" );
    noteTreeTextBox = noteTree.inputField;
    noteTreeTextBox.setAttribute( "clickSelectsAll", "true" );
    noteTreeDetails = document.getElementById( "noteTreeDetails" );
    initContext();
    updateNewNoteMenuPopup();
    updateQFTypeMenuPopup();
    updateQFCreatedMenuPopup();
    updateQFUpdatedMenuPopup();
    noteTreeModel = new NoteTreeModel();
    noteTreeView = new NoteTreeView( noteTreeModel );
    noteTreeFilterView = new NoteTreeFilterView( noteTreeModel );
    noteTreeFilterView.loadPreferences();
    noteTreeModel.fetch();
    noteTreeView.loadPreferences();
    noteTreeView.register();
    noteTreeFilterView.register();
    noteTreeModel.register();
    mainController.register();
    addEventListeners();
    noteTree.view = noteTreeView;
    updateView( true /* filter */, true /* sort */ );
    noteTree.focus();
  };
  
  pub.onClose = function( event ) {
    noteTreeFilterView.savePreferences();
    noteTreeView.savePreferences();
    Utils.LOGGER_LEVEL = loggerLevel;
  };

  pub.onUnload = function( event ) {
    noteTreeFilterView.unregister();
    noteTreeView.unregister();
    noteTreeModel.unregister();
    removeEventListeners();
    mainController.unregister();
  };

  return pub;

}();

window.addEventListener( "load", ru.akman.znotes.tests.NotesTree.onLoad, false );
window.addEventListener( "unload", ru.akman.znotes.tests.NotesTree.onUnload, false );
window.addEventListener( "close", ru.akman.znotes.tests.NotesTree.onClose, false );
