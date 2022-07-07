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

const EXPORTED_SYMBOLS = ["NoteList"];

var Cc = Components.classes;
var Ci = Components.interfaces;
var Cr = Components.results;
var Cu = Components.utils;

if ( !ru ) var ru = {};
if ( !ru.akman ) ru.akman = {};
if ( !ru.akman.znotes ) ru.akman.znotes = {};

Cu.import( "resource://znotes/utils.js", ru.akman.znotes );
Cu.import( "resource://znotes/images.js", ru.akman.znotes );

var NoteList = function() {

  var Utils = ru.akman.znotes.Utils;
  var Images = ru.akman.znotes.Images;
  var log = Utils.getLogger( "content.bindings.notelist" );

  function Model() {
    this._notesView = [];
  };
  Model.prototype = {
    get rowCount() {
      return this._notesView.length;
    },
    get canReorder() {
      // TODO: canReorder === !currentTag && !sort.isActive && !filter.isActive
      return true;
    },
    getNoteAtIndex: function( index ) {
      if ( index >= 0 && index < this._notesView.length ) {
        return this._notesView[index];
      }
      return null;
    },
    getIndexOfNote: function( note ) {
      return note ? this._notesView.indexOf( note ) : -1;
    }
  };

  function View( model, boxObject ) {
    this.boxObject = boxObject;
    this.model = model;
  };
  View.prototype = {

    F_ATTACHMENTS: 0,
    F_STICKY: 1,
    F_NAME: 2,
    F_CATEGORY: 3,
    F_TAG: 4,
    F_TYPE: 5,
    F_CREATED: 6,
    F_UPDATED: 7,

    TAG_IMAGE_SIZE: 16,

    getSelection: function() {
      var start = new Object();
      var end = new Object();
      this.selection.getRangeAt( 0, start, end );
      return start.value;
    },
    setSelection: function( row ) {
      if ( this.rowCount ) {
        this.boxObject.ensureRowIsVisible( 0 );
      }
      if ( row >= 0 && row < this.rowCount ) {
        this.boxObject.ensureRowIsVisible( row );
      }
      this.selection.select( row );
      return row;
    },

    get rowCount() {
      return this.model.rowCount;
    },
  	getCellText: function( row, col ) {
      if ( row === -1 ) {
        return "";
      }
      var note = this.model.getNoteAtIndex( row );
      switch ( col.index ) {
        case this.F_ATTACHMENTS:
          return "";
        case this.F_STICKY:
          return "";
        case this.F_NAME:
          return note.isLoading() ?
            " " + Utils.getString( "main.note.loading" ) : note.getName();
        case this.F_CATEGORY:
          return note.getParent().getName();
        case this.F_TAG:
          return note.getMainTagName();
        case this.F_TYPE:
          return note.getType();
        case this.F_CREATED:
          return note.getCreateDateTime().toLocaleString();
        case this.F_UPDATED:
          return note.getUpdateDateTime().toLocaleString();
      }
      return "";
  	},
  	setCellText: function( row, col, value ) {
      var note = this.model.getNoteAtIndex( row );
      value = value.replace( /(^\s+)|(\s+$)/g, "" );
      if ( value.length && note && value !== note.getName() ) {
        // TODO: raise exception
        try {
          note.rename( value );
        } catch ( e ) {
          openErrorDialog( Utils.getFormattedString( "main.errordialog.note",
            [ value ] ), e.message );
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
    isSorted: function() { return false; },
    getLevel: function( row ) { return 0; },
    getImageSrc: function( row, col ) {
      if ( row === -1 ) {
        return;
      }
      var note = this.model.getNoteAtIndex( row );
      switch ( col.index ) {
        case this.F_TAG:
          return Images.makeTagImage( note.getMainTagColor(), true,
            TAG_IMAGE_SIZE );
      }
      return "";
    },
    getRowProperties: function( row, props ) {
      if ( row === -1 ) {
        return;
      }
      var note = this.model.getNoteAtIndex( row );
      var tagId = note.getMainTagId();
      var values = [ "NOTE_TAG_ROW_" + tagId ];
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
      var note = this.model.getNoteAtIndex( row );
      var tagId = note.getMainTagId();
      var values = [ "NOTE_TAG_ROW_" + tagId ];
      switch ( col.index ) {
        case F_ATTACHMENTS:
          if ( note.hasAttachments() ) {
            values.push( "attachment" );
          }
          break;
        case F_STICKY:
          if ( note.isSticky() ) {
            values.push( "sticky" );
          }
          break;
        case F_NAME:
          if ( note.isLoading() ) {
            values.push( "loading" );
          } else {
            values.push( "note" );
          }
          break;
        case F_TAG:
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
    selectionChanged: function() {},
    canDrop: function( index, orientation, dataTransfer ) {
      var row = this._getSelection();
      if ( !this.model.canReorder ||
        !dataTransfer.types.contains( "znotes/x-note" ) ||
        dataTransfer.getData( "znotes/x-note" ) !== "NOTE" ||
        dataTransfer.dropEffect !== "move" ||
        row === index ||
        row === index + orientation ) {
        dataTransfer.dropEffect = "none";
        return false;
      }
      return true;
    },
    drop: function( index, orientation, dataTransfer ) {
      var row = this._getSelection();
      var note = this.model.getNoteAtIndex( row );
      if ( orientation === 1 ) {
        ++index;
      }
      if ( index > row ) {
        --index;
      }
      // TODO: raise exception
      try {
        note.moveTo( index );
      } catch ( e ) {
        openErrorDialog( Utils.getFormattedString( "main.errordialog.note",
          [ note.getName() ] ), e.message );
      }
    }
  };

  // HELPERS

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

  var pub = {
    Model: Model,
    View: View
  };
  
  return pub;

}();
