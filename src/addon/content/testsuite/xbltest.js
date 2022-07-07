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
Cu.import( "resource://znotes/documentmanager.js", ru.akman.znotes );
Cu.import( "resource://znotes/bookmanager.js", ru.akman.znotes.core );

ru.akman.znotes.tests.XBLTest = function() {

  var pub = {};

  var Utils = ru.akman.znotes.Utils;
  var DateUtils = ru.akman.znotes.DateUtils;
  var Common = ru.akman.znotes.Common;

  var log = Utils.getLogger( "content.tests.xbltest" );
  var loggerLevel = Utils.LOGGER_LEVEL;
  
  var mainController = null;

  var currentBook = null;
  var currentCategory = null;
  var currentTag = null;
  var currentNote = null;

  var noteList = null;
  var noteTreeDetails = null;
  var selectedPopupItem = null;
  
  // CONTROLLERS
  
  function setupMainController() {
    mainController = {
      _commands: {
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
        "znotes_showfilterbar_command": null
      },
      supportsCommand: function( cmd ) {
        return ( cmd in this._commands );
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
            return currentBook && currentBook.isOpen() && currentNote;
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
        return ( cmd in this._commands ) ? document.getElementById( cmd ) : null;
      },
      updateCommands: function() {
        for ( var cmd in this._commands ) {
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
        for ( var cmd in this._commands ) {
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
  };

  // COMMANDS

  function doNewNote() {
    var aName, aType, aTagID, aSticky, aCategory, aNote;
    aCategory = currentCategory;
    aType = selectedPopupItem ? selectedPopupItem.getAttribute( "value" ) :
      Utils.DEFAULT_DOCUMENT_TYPE;
    selectedPopupItem = null;
    aName = getString( "main.note.newName" );
    aSticky = noteList.filter.isActive;
    aTagID = null;
    if ( currentTag ) {
      aCategory = currentBook.getContentTree().getRoot();
      aTagID = currentTag.getId();
      if ( aTagID === "00000000000000000000000000000000" ) {
        aTagID = null;
      }
    }
    aName = getValidNoteName( aCategory, aName, aType );
    aNote = aCategory.createNote( aName, aType, aTagID, aSticky );
    if ( currentNote !== aNote ) {
      setNoteTreeSelection( getIndexOfNote( aNote ) );
    }
    doRenameNote();
  };

  function doDeleteNote() {
    var params = {
      input: {
        title: getString( "main.note.confirmDelete.title" ),
        message1: getFormattedString(
          "main.note.confirmDelete.message1", [ currentNote.name ] ),
        message2: ( currentNote.isInBin() ?
                      getString( "main.category.confirmClearBin.message1" ) :
                      getString( "main.note.confirmDelete.message2" ) )
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
      currentNote.remove();
    }
  };
  
  function doRenameNote() {
    var row = noteList.getNoteTreeSelection();
    var column = noteTree.columns.getNamedColumn( "noteTreeName" );
    noteTree.setAttribute( "editable", "true" );
    noteTree.startEditing( row, column );
    noteTree.removeAttribute( "editable" );
  };

  function doToggleFilterBar() {
    var isCollapsed = !loadQFCollapsedState();
    saveQFCollapsedState( isCollapsed );
    if ( isCollapsed ) {
      onFilterChange();
    }
    //updateQuickFilterView();
    return true;
  };

  // OBJECTS
  
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
    },
    serialize: function() {
      return JSON.stringify( this, function ( key, value ) {
        if ( typeof( value ) === 'object' &&
          value.constructor.name === "DateIntervals" ) {
          return value.toString();
        }
        return value;        
      } );
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
    },
    serialize: function() {
      return JSON.stringify( this );
    }
  };

  function NoteTreeSelection() {
    this.reset();
  };
  NoteTreeSelection.prototype = {
    reset: function() {
      this.index = -1;
    }
  };
  
  // HELPERS

  function initContext() {
    var ctx = Utils.MAIN_CONTEXT();
    currentBook = ctx.book;
    currentCategory = ctx.category;
    currentTag = ctx.tag;
    currentNote = ctx.note;
  };
  
  function initUI() {
    noteList = document.getElementById( "noteList" );
    noteTreeDetails = document.getElementById( "noteTreeDetails" );
    updateNewNoteMenuPopup();
  };

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
    var result = [];
    var dateIntervals = DateUtils.getDateIntervals( Utils.FIRST_DAY_OF_WEEK );
    dateIntervals.forEach( function( dateInterval ) {
      result.push( {
        name: getString( "main.dateIntervals." + dateInterval.toString() ),
        value: dateInterval
      } );
    } );
    return result;
  };

  function updateNewNoteMenuPopup() {
    var noteTypes = getNoteTypes();
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
        selectedPopupItem = event.target;
      }, false );
      newNoteButtonMenuPopup.appendChild( menuItem );
    } );
  };

  function addControllers() {
    setupMainController();
    mainController.register();
  };

  function removeControllers() {
    mainController.unregister();
  };

  function updateCommands() {
    mainController.updateCommands();
  };

  function setupNoteList() {
    noteList.context = {
      bookManager: ru.akman.znotes.core.BookManager.getInstance(),
      currentBook: currentBook,
      currentCategory: currentCategory,
      currentTag: currentTag,
      currentNote: currentNote
    };
    noteList.dataProvider = getNoteListDataProvider();
    noteList.noteTypes = getNoteTypes();
    noteList.dateIntervals = getDateIntervals();
    noteList.filter = loadNoteTreeFilter();
    noteList.sort = loadNoteTreeSort();
    noteList.selection = loadNoteTreeSelection();
    noteList.load();
    noteList.focus();
  };

  function getString( name ) {
    var str = "?" + name + "?";
    try {
      str = Utils.STRINGS_BUNDLE.getString( name );
    } catch ( e ) {
      log.warn( "Main.getString() : '" + name + "'\n" + e + "\n" +
        Utils.dumpStack() );
    }
    return str;
  };
  
  function getValidNoteName( aCategory, aName, aType ) {
    var index = 0, suffix = "";
    while ( !aCategory.canCreateNote( aName + suffix, aType ) ) {
      suffix = " (" + ++index + ")";
    }
    return aName + suffix;
  };

  function getNoteListDataProvider() {
    return {
      fetch: function() {
        switch ( currentTag ? "Tags" : "Categories" ) {
          case "Categories":
            return currentCategory.getNotes();
          case "Tags":
            return contentTree.getNotesByTag( currentTag.getId(), true );
        }
        return [];
      }
    };
  };
  
  function loadNoteTreeSort() {
    var loaded, sort = new NoteTreeSort();
    sort.reset();
    if ( currentBook ) {
      loaded = JSON.parse( currentBook.loadPreference( "noteTreeSort",
        sort.serialize() ) );
      if ( "isActive" in loaded &&
        typeof( loaded.isActive ) === "boolean" ) {
        sort.isActive = loaded.isActive;
      }
      if ( "order" in loaded &&
        typeof( loaded.order ) === "number" &&
        ( loaded.order === -1 || loaded.order === 0 || loaded.order === 1 ) ) {
        sort.order = loaded.order;
      }
      if ( "column" in loaded &&
        typeof( loaded.column ) === "number" &&
        loaded.column >= 0 && loaded.column <= 7 ) {
        sort.column = loaded.column;
      }
    }
    return sort;
  };
  
  function saveNoteTreeSort() {
    if ( currentBook ) {
      currentBook.savePreference( "noteTreeSort",
        noteList.sort.serialize() );
    }
  };
  
  function loadNoteTreeFilter() {
    var loaded;
    var noteTypes = getNoteTypes();
    var dateIntervals = DateUtils.getDateIntervals( Utils.FIRST_DAY_OF_WEEK );
    var filter = new NoteTreeFilter();
    filter.reset();
    if ( currentBook ) {
      loaded = JSON.parse(
        currentBook.loadPreference( "noteTreeFilter", filter.serialize() ) );
      if ( "isActive" in loaded &&
        typeof( loaded.isActive ) === "boolean" ) {
        filter.isActive = loaded.isActive;
      }
      if ( "isPined" in loaded &&
        typeof( loaded.isPined ) === "boolean" ) {
        filter.isPined = loaded.isPined;
      }
      if ( "flagAttachments" in loaded &&
        typeof( loaded.flagAttachments ) === "boolean" ) {
        filter.flagAttachments = loaded.flagAttachments;
      }
      if ( "selectedTypes" in loaded &&
        typeof( loaded.selectedTypes ) === "object" &&
        loaded.selectedTypes.constructor.name === "Array" ) {
        loaded.selectedTypes.forEach( function ( t ) {
          for each ( var noteType in noteTypes ) {
            if ( noteType.contentType === t ) {
              filter.selectedTypes.push( t );
              break;
            }
          }
        } );
      }
      if ( "flagType" in loaded &&
        typeof( loaded.flagType ) === "boolean" ) {
        filter.flagType = loaded.flagType &&
          !!filter.selectedTypes.length;
      }
      if ( "selectedCreated" in loaded &&
        typeof( loaded.selectedCreated ) === "object" &&
        loaded.selectedCreated.constructor.name === "Array" ) {
        loaded.selectedCreated.forEach( function ( id ) {
          if ( id in dateIntervals ) {
            filter.selectedCreated.push( dateIntervals[id] );
          }
        } );
      }
      if ( "flagCreated" in loaded &&
        typeof( loaded.flagCreated ) === "boolean" ) {
        filter.flagCreated = loaded.flagCreated &&
          !!filter.selectedCreated.length;
      }
      if ( "selectedUpdated" in loaded &&
        typeof( loaded.selectedUpdated ) === "object" &&
        loaded.selectedUpdated.constructor.name === "Array" ) {
        loaded.selectedUpdated.forEach( function ( id ) {
          if ( id in dateIntervals ) {
            filter.selectedUpdated.push( dateIntervals[id] );
          }
        } );
      }
      if ( "flagUpdated" in loaded &&
        typeof( loaded.flagUpdated ) === "boolean" ) {
        filter.flagUpdated = loaded.flagUpdated &&
          !!filter.selectedUpdated.length;
      }
      if ( "flagCategory" in loaded &&
        typeof( loaded.flagCategory ) === "boolean" ) {
        filter.flagCategory = loaded.flagCategory;
      }
      if ( "flagTag" in loaded &&
        typeof( loaded.flagTag ) === "boolean" ) {
        filter.flagTag = loaded.flagTag;
      }
      if ( "flagName" in loaded &&
        typeof( loaded.flagName ) === "boolean" ) {
        filter.flagName = loaded.flagName;
      }
      if ( "flagBody" in loaded &&
        typeof( loaded.flagBody ) === "boolean" ) {
        filter.flagBody = loaded.flagBody;
      }
      if ( "text" in loaded &&
        typeof( loaded.text ) === "string" ) {
        filter.text = loaded.text;
      }
    }
    return filter;
  };
  
  function saveNoteTreeFilter() {
    if ( currentBook ) {
      currentBook.savePreference( "noteTreeFilter",
        noteList.filter.serialize() );
    }
  };

  function loadNoteTreeSelection() {
    var selection = new NoteTreeSelection();
    selection.reset();
    if ( currentBook && currentBook.isOpen() && Utils.IS_SAVE_POSITION ) {
      switch ( currentBook.getSelectedTree() ) {
        case "Categories":
          selection.index = currentCategory.isRoot() ?
            currentBook.loadPreference( "rootPosition", 0 ) :
            currentCategory.getSelectedIndex();
          break;
        case "Tags":
          selection.index = currentTag.getSelectedIndex();
          break;
      }
    }
    return selection;
  };

  function saveNoteTreeSelection() {
  };
  
  function showNoteDetails( note, prefix ) {
    noteTreeDetails.value = ( prefix ? prefix + " : " : "" ) + "\n" +
      ( note ? note.toString() : "<NULL>" );
    updateCommands();
  };
  
  function onSelectNote( event ) {
    showNoteDetails( event.detail.note, "*select*" );
  };

  function onUpdateNote( event ) {
    showNoteDetails( event.detail.note, "*update*" );
  };
  
  function addEventListeners() {
    noteList.addEventListener( "selectNote", onSelectNote, false );
    noteList.addEventListener( "updateNote", onUpdateNote, false );
  };
  
  function removeEventListeners() {
    noteList.removeEventListener( "selectNote", onSelectNote, false );
    noteList.removeEventListener( "updateNote", onUpdateNote, false );
  };
  
  // PUBLIC
  
  pub.onLoad = function( event ) {
    Utils.LOGGER_LEVEL = "ALL";
    initContext();
    initUI();
    addEventListeners();
    addControllers();
    setupNoteList();
    updateCommands();
  };
  
  pub.onClose = function( event ) {
    saveNoteTreeSelection();
    saveNoteTreeFilter();
    saveNoteTreeSort();
    Utils.LOGGER_LEVEL = loggerLevel;
  };

  pub.onUnload = function( event ) {
    removeEventListeners();
    removeControllers();
  };

  return pub;

}();

window.addEventListener( "load", ru.akman.znotes.tests.XBLTest.onLoad, false );
window.addEventListener( "unload", ru.akman.znotes.tests.XBLTest.onUnload, false );
window.addEventListener( "close", ru.akman.znotes.tests.XBLTest.onClose, false );
