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

ru.akman.znotes.Content = function() {

  // !!!! %%%% !!!! STRINGS_BUNDLE & IS_STANDALONE
  return function( aWindow, aDocument, aNoteUpdateCallback ) {

    var stringsBundle = ru.akman.znotes.Utils.STRINGS_BUNDLE;
    var isStandalone = ru.akman.znotes.Utils.IS_STANDALONE;
    var log = ru.akman.znotes.Utils.log;

    var contentTree = null;
    var contentTreeChildren = null;
    var contentTreeBoxObject = null;

    var contentTreeMenu = null;

    var cmdNewContent = null;
    var cmdOpenContent = null;
    var cmdOpenWithContent = null;
    var cmdSaveContent = null;
    var cmdDeleteContent = null;

    var currentWindow = null;
    var currentDocument = null;
    var currentNote = null;
    var currentContent = null;

    var noteStateListener = null;

    // C O M M A N D S

    function onCmdNewContent( source ) {
      var nsIFilePicker = Components.interfaces.nsIFilePicker;
      var fp = Components.classes["@mozilla.org/filepicker;1"]
                         .createInstance( nsIFilePicker );
      fp.init(
        currentWindow,
        stringsBundle.getString( "content.addfiledialog.title" ),
        nsIFilePicker.modeOpen
      );
      fp.appendFilters( nsIFilePicker.filterAll );
      var result = fp.show();
      if ( result == nsIFilePicker.returnOK ) {
        createContent( fp.file );
      }
    };

    function onCmdOpenContent( source ) {
      if ( currentContent == null || currentContent == -1 )
        return;
      openContent( currentContent );
    };

    function onCmdOpenWithContent( source ) {
      if ( currentContent == null || currentContent == -1 )
        return;
      openContent( currentContent, true );
    };

    function onCmdSaveContent( source ) {
      if ( currentContent == null || currentContent == -1 )
        return false;
      var treeItem = contentTree.view.getItemAtIndex( currentContent );
      var parseInfo = treeItem.getAttribute( "value" ).split( "\u0000" );
      var id = parseInfo[0];
      var nsIFilePicker = Components.interfaces.nsIFilePicker;
      var fp = Components.classes["@mozilla.org/filepicker;1"]
                         .createInstance( nsIFilePicker );
      fp.defaultString = id;
      fp.init(
        currentWindow,
        stringsBundle.getString( "content.savecontentdialog.title" ),
        nsIFilePicker.modeSave
      );
      fp.appendFilters( nsIFilePicker.filterAll );
      var result = fp.show();
      if ( result == nsIFilePicker.returnOK || result == nsIFilePicker.returnReplace ) {
        saveContent( currentContent, fp.file );
      }
      return true;
    };

    function onCmdDeleteContent( source ) {
      var aRow = currentContent;
      var aColumn = contentTree.columns.getNamedColumn( "contentTreeName" );
      var currentContentName = contentTree.view.getCellText( aRow, aColumn );
      var params = {
        input: {
          title: stringsBundle.getString( "content.confirmDelete.title" ),
          message1: stringsBundle.getFormattedString( "content.confirmDelete.message1", [ currentContentName ] ),
          message2: stringsBundle.getString( "content.confirmDelete.message2" )
        },
        output: null
      };
      currentWindow.openDialog(
        "chrome://znotes/content/confirmdialog.xul",
        "",
        "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
        params
      ).focus();
      if ( params.output ) {
        deleteContent( currentContent );
        currentContentChanged();
      }
      return true;
    };

    // E V E N T S

    function onSelect( event ) {
      if ( contentTree.currentIndex == currentContent ) {
        event.stopPropagation();
        event.preventDefault();
        return;
      }
      currentContent = contentTree.currentIndex;
      currentContentChanged();
    };

    function onClick( event ) {
      event.preventDefault();
      event.stopPropagation();
      if ( event.button != "2" ) {
        return false;
      }
      contentTreeMenu.openPopupAtScreen(
        event.clientX + window.mozInnerScreenX + 2,
        event.clientY + window.mozInnerScreenY + 2,
        false
      );
      return true;
    };

    function onDblClick( event ) {
      event.stopPropagation();
      event.preventDefault();
      if ( event.button != "0" ) {
        return false;
      }
      if ( contentTree.currentIndex < 0 || currentContent == null ) {
        return false;
      }
      openContent( currentContent );
      return true;
    };

    // S T A T E

    function currentContentChanged() {
      if ( currentContent == null || currentContent == -1 ) {
        contentTree.view.selection.select( -1 );
        cmdOpenContent.setAttribute( "disabled", "true" );
        cmdOpenWithContent.setAttribute( "disabled", "true" );
        cmdSaveContent.setAttribute( "disabled", "true" );
        cmdDeleteContent.setAttribute( "disabled", "true" );
      } else {
        cmdOpenContent.removeAttribute( "disabled" );
        cmdOpenWithContent.removeAttribute( "disabled" );
        cmdSaveContent.removeAttribute( "disabled" );
        cmdDeleteContent.removeAttribute( "disabled" );
      }
    };

    // V I E W

    function createContentTreeItem( contentID, contentIcon, contentName, contentDescription ) {
      var treeItem = null;
      var treeRow = null;
      var treeCell = null;
      treeRow = currentDocument.createElement( "treerow" );
      treeCell = currentDocument.createElement( "treecell" );
      treeCell.setAttribute( "label", contentName );
      treeCell.setAttribute( "src", contentIcon );
      treeCell.setAttribute( "properties", "content" );
      treeRow.appendChild( treeCell );
      treeCell = currentDocument.createElement( "treecell" );
      treeCell.setAttribute( "label", contentDescription );
      treeRow.appendChild( treeCell );
      treeItem = currentDocument.createElement( "treeitem" );
      treeItem.appendChild( treeRow );
      treeItem.setAttribute( "value", contentID );
      return treeItem;
    };

    function updateContentTreeItem( itemIndex ) {
      var anItem = contentTree.view.getItemAtIndex( itemIndex );
      var id = anItem.getAttribute( "value" )
      var contentName = null;
      var contentIcon = null;
      var contentDescription = null;
      var entry = currentNote.getContentEntry( id );
      if ( entry != null ) {
        contentName = getFileName( entry );
        contentIcon = getFileIcon( entry, 16 );
        contentDescription = getFileDescription( entry );
      }
      var treeRow = anItem.firstChild;
      var treeCell = treeRow.childNodes[ contentTree.columns.getNamedColumn( "contentTreeName" ).index ];
      treeCell.setAttribute( "label", contentName );
      treeCell.setAttribute( "src", contentIcon );
      treeCell.setAttribute( "properties", "content" );
      var treeCell = treeRow.childNodes[ contentTree.columns.getNamedColumn( "contentTreeDescription" ).index ];
      treeCell.setAttribute( "label", contentDescription );
    };

    // A C T I O N S

    function createContent( file ) {
      currentNote.addContent( [ file.leafName, file.parent.path ] );
    };

    function deleteContent( anContentIndex ) {
      var treeItem = contentTree.view.getItemAtIndex( anContentIndex );
      var id = treeItem.getAttribute( "value" );
      currentNote.removeContent( id );
    };

    function saveContent( anContentIndex, entry ) {
      var treeItem = contentTree.view.getItemAtIndex( anContentIndex );
      var id = treeItem.getAttribute( "value" );
      var src = currentNote.getContentEntry( id );
      var parentDir = entry.parent.clone();
      var fileName = entry.leafName;
      try {
        if ( entry.exists() ) {
          entry.remove( false );
        }
        src.copyTo( parentDir, fileName );
      } catch ( e ) {
        log( e );
      }
    };

    function openContent( anContentIndex, force ) {
      var treeItem = contentTree.view.getItemAtIndex( anContentIndex );
      var id = treeItem.getAttribute( "value" );
      var entry = currentNote.getContentEntry( id );
      if ( entry ) {
        var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                                  .getService( Components.interfaces.nsIIOService );
        var fph = ioService.getProtocolHandler( "file" )
                           .QueryInterface( Components.interfaces.nsIFileProtocolHandler );
        var url = fph.getURLSpecFromFile( entry );
        var title = stringsBundle.getString( "utils.openuri.apppicker.title" );
        ru.akman.znotes.Utils.openURI( url, force, currentWindow, title );
      }
      updateContentTreeItem( anContentIndex );
    };

    // U T I L S

    function getFileName( entry ) {
      var result = stringsBundle.getString( "content.filenotfound" );
      if ( entry.exists() && !entry.isDirectory() ) {
        result = entry.leafName;
      }
      return result;
    };

    function getFileDescription( entry ) {
      var result = stringsBundle.getString( "content.filenotfound" );
      if ( entry.exists() && !entry.isDirectory() ) {
        result = stringsBundle.getString( "content.filesize" ) + ": " +
                 Math.round( entry.fileSize / 1000 ) + " " +
                 stringsBundle.getString( "content.kib" );
      }
      return result;
    };

    function getFileIcon( entry, size ) {
      var result = null;
      if ( entry.exists() && !entry.isDirectory() ) {
        result = ru.akman.znotes.Utils.getEntryIcon( entry, size );
      }
      return result;
    };

    // NOTE EVENTS

    function onNoteDeleted( aCategory, aNote ) {
      if ( currentNote == aNote ) {
        currentNote = null;
      }
    };

    /*
    function onNoteChanged( e ) {
      var aCategory = e.data.parentCategory;
      var aChangedNote = e.data.changedNote;
    }
    */

    /*
    function onNoteTagsChanged( e ) {
      var aCategory = e.data.parentCategory;
      var aChangedNote = e.data.changedNote;
      var oldTags = e.data.oldValue;
      var newTags = e.data.newValue;
    }
    */

    /*
    function onNoteMainTagChanged( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.changedNote;
      var oldTag = e.data.oldValue;
      var newTag = e.data.newValue;
    }
    */

    /*
    function onNoteContentChanged( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.changedNote;
      var oldContent = e.data.oldValue;
      var newContent = e.data.newValue;
    }
    */

    /*
    function onNoteContentLoaded( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.changedNote;
    }
    */

    /*
    function onNoteAttachmentAppended( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.changedNote;
      var anInfo = e.data.attachmentInfo;
    }
    */

    /*
    function onNoteAttachmentRemoved( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.changedNote;
      var anInfo = e.data.attachmentInfo;
    }
    */

    function onNoteContentAppended( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.changedNote;
      var anInfo = e.data.contentInfo;
      var contentID = anInfo[0];
      var contentName = null;
      var contentIcon = null;
      var contentDescription = null;
      var treeItem = null;
      var id = null;
      var aRow = -1;
      for ( var i = 0; i < contentTree.view.rowCount; i++ ) {
        treeItem = contentTree.view.getItemAtIndex( i );
        id = treeItem.getAttribute( "value" );
        if ( contentID == id ) {
          aRow = i;
          break;
        }
      }
      if ( aRow == -1 ) {
        var entry = aNote.getContentEntry( contentID );
        contentName = getFileName( entry );
        contentIcon = getFileIcon( entry, 16 );
        contentDescription = getFileDescription( entry );
        var treeItem = createContentTreeItem(  contentID, contentIcon, contentName, contentDescription );
        contentTreeChildren.appendChild( treeItem );
        aRow = contentTree.view.rowCount - 1;
      }
      contentTree.view.selection.select( aRow );
    };

    function onNoteContentRemoved( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.changedNote;
      var anInfo = e.data.contentInfo;
      var contentID = anInfo[0];
      var treeItem = null;
      var id = null;
      var index = contentTree.currentIndex;
      var aRow = -1;
      for ( var i = 0; i < contentTree.view.rowCount; i++ ) {
        treeItem = contentTree.view.getItemAtIndex( i );
        id = treeItem.getAttribute( "value" );
        if ( contentID == id ) {
          aRow = i;
          break;
        }
      }
      if ( aRow != -1 ) {
        if ( index == contentTree.view.rowCount - 1 )
          index--;
        treeItem.parentNode.removeChild( treeItem );
        if ( index < 0 ) {
          currentContent = null;
          contentTree.view.selection.select( -1 );
        } else {
          contentTree.view.selection.select( index );
        }
      }
    };

    // L I S T E N E R S

    function addEventListeners() {
      contentTree.addEventListener( "select", onSelect, false );
      contentTree.addEventListener( "click", onClick, true );
      contentTree.addEventListener( "dblclick", onDblClick, true );
      cmdNewContent.addEventListener( "command", onCmdNewContent, false );
      cmdOpenContent.addEventListener( "command", onCmdOpenContent, false );
      cmdOpenWithContent.addEventListener( "command", onCmdOpenWithContent, false );
      cmdSaveContent.addEventListener( "command", onCmdSaveContent, false );
      cmdDeleteContent.addEventListener( "command", onCmdDeleteContent, false );
      if ( currentNote ) {
        currentNote.addStateListener( noteStateListener );
      }
    };

    function removeEventListeners() {
      contentTree.removeEventListener( "select", onSelect, false );
      contentTree.removeEventListener( "click", onClick, true );
      contentTree.removeEventListener( "dblclick", onDblClick, true );
      cmdNewContent.removeEventListener( "command", onCmdNewContent, false );
      cmdOpenContent.removeEventListener( "command", onCmdOpenContent, false );
      cmdOpenWithContent.removeEventListener( "command", onCmdOpenWithContent, false );
      cmdSaveContent.removeEventListener( "command", onCmdSaveContent, false );
      cmdDeleteContent.removeEventListener( "command", onCmdDeleteContent, false );
      if ( currentNote ) {
        currentNote.removeStateListener( noteStateListener );
      }
    };

    // V I E W

    this.enable = function() {
      contentTree.removeAttribute( "disabled" );
      cmdNewContent.removeAttribute( "disabled" );
    };

    this.disable = function() {
      contentTree.setAttribute( "disabled", "true" );
      cmdNewContent.setAttribute( "disabled", "true" );
    };

    this.hide = function() {
      while ( contentTreeChildren.firstChild ) {
        contentTreeChildren.removeChild( contentTreeChildren.firstChild );
      }
      contentTree.setAttribute( "disabled", "true" );
      cmdNewContent.setAttribute( "disabled", "true" );
      removeEventListeners();
    }

    this.show = function( aNote ) {
      var contents = null;
      var treeItem = null;
      var content = null;
      var entry = null;
      var card = null;
      var contentID = null;
      var contentName = null;
      var contentIcon = null;
      var contentDescription = null;
      var isVisible = null;
      var count = 0;
      //
      if ( currentNote ) {
        this.hide();
      }
      currentNote = aNote;
      if ( currentNote == null || !currentNote.isExists() ) {
        this.hide();
        return;
      }
      addEventListeners();
      contentTree.removeAttribute( "disabled" );
      cmdNewContent.removeAttribute( "disabled" );
      //
      contents = currentNote.getContents();
      currentContent = null;
      while ( contentTreeChildren.firstChild )
        contentTreeChildren.removeChild( contentTreeChildren.firstChild );
      if ( currentNote != null ) {
        if ( contents.length > 0 ) {
          for ( var i = 0; i < contents.length; i++ ) {
            content = contents[i];
            isVisible = true;
            contentID = content[0];
            entry = currentNote.getContentEntry( contentID );
            if ( entry != null ) {
              contentName = getFileName( entry );
              contentIcon = getFileIcon( entry, 16 );
              contentDescription = getFileDescription( entry );
            }
            if ( isVisible ) {
              count += 1;
              treeItem = createContentTreeItem( contentID, contentIcon, contentName, contentDescription );
              contentTreeChildren.appendChild( treeItem );
            }
          }
        }
      }
      contentTree.view.selection.select( count > 0 ? 0 : -1 );
      currentContentChanged();
    };

    this.unload = function() {
      removeEventListeners();
    };

    // C O N S T R U C T O R

    currentWindow = aWindow;
    currentDocument = aDocument;
    contentTree = currentDocument.getElementById( "contentTree" );
    contentTreeBoxObject = contentTree.boxObject;
    contentTreeBoxObject.QueryInterface( Components.interfaces.nsITreeBoxObject );
    contentTreeChildren = currentDocument.getElementById( "contentTreeChildren" );
    contentTreeMenu = document.getElementById( "contentTreeMenu" );
    cmdNewContent = currentDocument.getElementById( "cmdNewContent" );
    cmdOpenContent = currentDocument.getElementById( "cmdOpenContent" );
    cmdOpenWithContent = currentDocument.getElementById( "cmdOpenWithContent" );
    cmdSaveContent = currentDocument.getElementById( "cmdSaveContent" );
    cmdDeleteContent = currentDocument.getElementById( "cmdDeleteContent" );
    noteStateListener = {
      name: "CONTENT",
      // onNoteChanged: onNoteChanged,
      onNoteDeleted: onNoteDeleted,
      // onNoteTagsChanged: onNoteTagsChanged,
      // onNoteMainTagChanged: onNoteMainTagChanged,
      // onNoteContentChanged: onNoteContentChanged,
      // onNoteContentLoaded: onNoteContentLoaded,
      onNoteContentAppended: onNoteContentAppended,
      onNoteContentRemoved: onNoteContentRemoved,
      // onNoteAttachmentAppended: onNoteAttachmentAppended,
      // onNoteAttachmentRemoved: onNoteAttachmentRemoved
    };
    currentContentChanged();
  };

}();
