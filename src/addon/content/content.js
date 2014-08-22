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

Components.utils.import( "resource://znotes/utils.js", ru.akman.znotes );

ru.akman.znotes.Content = function() {

  // !!!! %%%% !!!! STRINGS_BUNDLE
  return function( aWindow, aStyle ) {

    var Utils = ru.akman.znotes.Utils;
    var Common = ru.akman.znotes.Common;

    var currentWindow = null;
    var currentStyle = null;
    
    var contentTree = null;
    var contentTreeChildren = null;

    var currentNote = null;
    var currentContent = null;

    var noteStateListener = null;

    //
    // COMMANDS
    //
    
    var contentCommands = {
      "znotes_contentaddfile_command": null,
      "znotes_contentopen_command": null,
      "znotes_contentopenwith_command": null,
      "znotes_contentsave_command": null,
      "znotes_contentdelete_command": null
    };
    
    var contentController = {
      supportsCommand: function( cmd ) {
        if ( !( cmd in contentCommands ) ) {
          return false;
        }
        return true;
        /*
        var focusedWindow = currentWindow.top.document.commandDispatcher.focusedWindow;
        return ( focusedWindow == currentWindow );
        */
      },
      isCommandEnabled: function( cmd ) {
        if ( !( cmd in contentCommands ) ) {
          return false;
        }
        if ( !currentNote || currentNote.isLoading() ) {
          return false;
        }
        switch ( cmd ) {
          case "znotes_contentaddfile_command":
            return true;
          case "znotes_contentopen_command":
          case "znotes_contentopenwith_command":
          case "znotes_contentsave_command":
          case "znotes_contentdelete_command":
            return isContentSelected();
        }
        return false;
      },
      doCommand: function( cmd ) {
        if ( !( cmd in contentCommands ) ) {
          return;
        }
        switch ( cmd ) {
          case "znotes_contentaddfile_command":
            var nsIFilePicker = Components.interfaces.nsIFilePicker;
            var fp = Components.classes["@mozilla.org/filepicker;1"]
                               .createInstance( nsIFilePicker );
            fp.init(
              currentWindow,
              Utils.STRINGS_BUNDLE.getString( "content.addfiledialog.title" ),
              nsIFilePicker.modeOpen
            );
            fp.appendFilters( nsIFilePicker.filterAll );
            var result = fp.show();
            if ( result == nsIFilePicker.returnOK ) {
              createContent( fp.file );
            }
            break;
          case "znotes_contentopen_command":
            openContent( currentContent );
            break;
          case "znotes_contentopenwith_command":
            openContent( currentContent, true );
            break;
          case "znotes_contentsave_command":
            var nsIFilePicker = Components.interfaces.nsIFilePicker;
            var fp = Components.classes["@mozilla.org/filepicker;1"]
                               .createInstance( nsIFilePicker );
            fp.defaultString = getContentId( currentContent )
            fp.init(
              currentWindow,
              Utils.STRINGS_BUNDLE.getString(
                "content.savecontentdialog.title"
              ),
              nsIFilePicker.modeSave
            );
            fp.appendFilters( nsIFilePicker.filterAll );
            var result = fp.show();
            if ( result == nsIFilePicker.returnOK ||
                 result == nsIFilePicker.returnReplace ) {
              saveContent( currentContent, fp.file );
            }
            break;
          case "znotes_contentdelete_command":
            var aRow = currentContent;
            var aColumn =
              contentTree.columns.getNamedColumn( "contentTreeName" );
            var currentContentName =
              contentTree.view.getCellText( aRow, aColumn );
            var params = {
              input: {
                title: Utils.STRINGS_BUNDLE.getString(
                  "content.confirmDelete.title"
                ),
                message1: Utils.STRINGS_BUNDLE.getFormattedString(
                  "content.confirmDelete.message1", [ currentContentName ]
                ),
                message2: Utils.STRINGS_BUNDLE.getString(
                  "content.confirmDelete.message2"
                )
              },
              output: null
            };
            currentWindow.openDialog(
              "chrome://znotes/content/confirmdialog.xul",
              "",
              "chrome,dialog=yes,modal=yes,centerscreen,resizable=no",
              params
            ).focus();
            if ( params.output && params.output.result ) {
              deleteContent( currentContent );
            }
            break;
        }
      },
      onEvent: function( event ) {
      },
      getName: function() {
        return "CONTENT";
      },
      getCommand: function( cmd ) {
        if ( cmd in contentCommands ) {
          return currentWindow.document.getElementById( cmd );
        }
        return null;
      },
      register: function() {
        try {
          currentWindow.controllers.insertControllerAt( 0, this );
          this.getId = function() {
            return currentWindow.controllers.getControllerId( this );
          };
        } catch ( e ) {
          Components.utils.reportError(
            "An error occurred registering '" + this.getName() +
            "' controller: " + e
          );
        }
      },
      unregister: function() {
        for ( var cmd in contentCommands ) {
          Common.goSetCommandEnabled( cmd, false, currentWindow );
        }
        try {
          currentWindow.controllers.removeController( this );
        } catch ( e ) {
          Components.utils.reportError(
            "An error occurred unregistering '" + this.getName() +
            "' controller: " + e
          );
        }
      }
    };

    function updateCommands() {
      var id = contentController.getId();
      Common.goUpdateCommand( "znotes_contentaddfile_command", id, currentWindow );
      Common.goUpdateCommand( "znotes_contentopen_command", id, currentWindow );
      Common.goUpdateCommand( "znotes_contentopenwith_command", id, currentWindow );
      Common.goUpdateCommand( "znotes_contentsave_command", id, currentWindow );
      Common.goUpdateCommand( "znotes_contentdelete_command", id, currentWindow );
    };
    
    function createContent( file ) {
      currentNote.addContent( [ file.leafName, file.parent.path ] );
    };

    function deleteContent( anContentIndex ) {
      currentNote.removeContent( getContentId( anContentIndex ) );
    };

    function saveContent( anContentIndex, entry ) {
      var src = currentNote.getContentEntry(
        getContentId( anContentIndex ) );
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
      var entry = currentNote.getContentEntry(
        getContentId( anContentIndex ) );
      if ( entry ) {
        var ioService =
          Components.classes["@mozilla.org/network/io-service;1"]
                    .getService( Components.interfaces.nsIIOService );
        var fph =
          ioService.getProtocolHandler( "file" )
                   .QueryInterface(
                     Components.interfaces.nsIFileProtocolHandler );
        var url = fph.getURLSpecFromFile( entry );
        var title = Utils.STRINGS_BUNDLE.getString(
          "utils.openuri.apppicker.title" );
        Utils.openURI( url, force, currentWindow, title );
      }
      updateContentTreeItem( anContentIndex );
    };

    // E V E N T S

    function onSelect( event ) {
      if ( contentTree.currentIndex == currentContent ) {
        event.stopPropagation();
        event.preventDefault();
        return false;
      }
      currentContent = contentTree.currentIndex;
      updateCommands();
      return true;
    };

    function onDblClick( event ) {
      if ( event.button != "0" ) {
        event.stopPropagation();
        event.preventDefault();
        return false;
      }
      if ( !isContentSelected() ) {
        return true;
      }
      openContent( currentContent );
      return true;
    };

    // VIEW

    function createContentTreeItem( id, icon, name, description ) {
      var treeItem = null;
      var treeRow = null;
      var treeCell = null;
      treeRow = currentWindow.document.createElement( "treerow" );
      treeCell = currentWindow.document.createElement( "treecell" );
      treeCell.setAttribute( "label", name );
      treeCell.setAttribute( "src", icon );
      treeCell.setAttribute( "properties", "content" );
      treeRow.appendChild( treeCell );
      treeCell = currentWindow.document.createElement( "treecell" );
      treeCell.setAttribute( "label", description );
      treeRow.appendChild( treeCell );
      treeItem = currentWindow.document.createElement( "treeitem" );
      treeItem.appendChild( treeRow );
      treeItem.setAttribute( "value", id );
      return treeItem;
    };

    function updateContentTreeItem( itemIndex ) {
      var anItem = contentTree.view.getItemAtIndex( itemIndex );
      var id = anItem.getAttribute( "value" )
      var name = null;
      var icon = null;
      var description = null;
      var entry = currentNote.getContentEntry( id );
      if ( entry != null ) {
        name = getFileName( entry );
        icon = getFileIcon( entry, 16 );
        description = getFileDescription( entry );
      }
      var treeRow = anItem.firstChild;
      var treeCell = treeRow.childNodes[
        contentTree.columns.getNamedColumn( "contentTreeName" ).index
      ];
      treeCell.setAttribute( "label", name );
      treeCell.setAttribute( "src", icon );
      treeCell.setAttribute( "properties", "content" );
      var treeCell = treeRow.childNodes[
        contentTree.columns.getNamedColumn( "contentTreeDescription" ).index
      ];
      treeCell.setAttribute( "label", description );
    };

    // HELPERS

    function isContentSelected() {
      return ( contentTree.currentIndex >= 0 && currentContent != null );
    };

    function getContentId( index ) {
      if ( !isContentSelected() ) {
        return null;
      }
      var treeItem = contentTree.view.getItemAtIndex( index );
      var parseInfo = treeItem.getAttribute( "value" ).split( "\u0000" );
      return parseInfo[0];
    };
    
    function getFileName( entry ) {
      var result = Utils.STRINGS_BUNDLE.getString( "content.filenotfound" );
      if ( entry.exists() && !entry.isDirectory() ) {
        result = entry.leafName;
      }
      return result;
    };

    function getFileDescription( entry ) {
      var result = Utils.STRINGS_BUNDLE.getString( "content.filenotfound" );
      if ( entry.exists() && !entry.isDirectory() ) {
        result = Utils.STRINGS_BUNDLE.getString( "content.filesize" ) + ": ";
        if ( entry.fileSize < 1024 ) {
          result += entry.fileSize + " " +
            Utils.STRINGS_BUNDLE.getString( "content.bytes" );
        } else {
          result += Math.round( entry.fileSize / 1024 ) + " " +
            Utils.STRINGS_BUNDLE.getString( "content.kib" );
        }
      }
      return result;
    };

    function getFileIcon( entry, size ) {
      var result = null;
      if ( entry.exists() && !entry.isDirectory() ) {
        result = Utils.getEntryIcon( entry, size );
      }
      return result;
    };

    function getContentInfo( content ) {
      var result = {
        id: content[0],
        visible: true
      };
      var entry = currentNote.getContentEntry( result.id );
      if ( entry != null ) {
        result.name = getFileName( entry );
        result.icon = getFileIcon( entry, 16 );
        result.description = getFileDescription( entry );
      }
      return result;
    };
    
    // NOTE EVENTS

    function onNoteDeleted( aCategory, aNote ) {
      if ( currentNote == aNote ) {
        currentNote = null;
      }
    };

    function onNoteContentAppended( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.changedNote;
      var anInfo = e.data.contentInfo;
      var id = anInfo[0];
      var name = null;
      var icon = null;
      var description = null;
      var treeItem = null;
      var aRow = -1;
      for ( var i = 0; i < contentTree.view.rowCount; i++ ) {
        treeItem = contentTree.view.getItemAtIndex( i );
        if ( id == treeItem.getAttribute( "value" ) ) {
          aRow = i;
          break;
        }
      }
      if ( aRow == -1 ) {
        var entry = aNote.getContentEntry( id );
        name = getFileName( entry );
        icon = getFileIcon( entry, 16 );
        description = getFileDescription( entry );
        var treeItem = createContentTreeItem( id, icon, name, description );
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

    // VIEW
    
    function clearContentTree() {
      while ( contentTreeChildren.firstChild ) {
        contentTreeChildren.removeChild( contentTreeChildren.firstChild );
      }
    };
    
    function showCurrentView() {
      contentTree.removeAttribute( "disabled" );
      var count = 0;
      var info = null;
      var contents = currentNote.getContents();
      for ( var i = 0; i < contents.length; i++ ) {
        info = getContentInfo( contents[i] );
        if ( info.visible ) {
          count += 1;
          contentTreeChildren.appendChild(
            createContentTreeItem(
              info.id,
              info.icon,
              info.name,
              info.description
            )
          );
        }
      }
      contentTree.view.selection.select( count > 0 ? 0 : -1 );
    };
    
    function hideCurrentView() {
      contentTree.setAttribute( "disabled", "true" );
    };
    
    function show( aNote, aForced ) {
      if ( currentNote && currentNote == aNote && !aForced ) {
        return;
      }
      removeEventListeners();
      clearContentTree();
      currentNote = aNote;
      if ( currentNote && currentNote.isExists() ) {
        addEventListeners();
        showCurrentView();
      } else {
        hideCurrentView();
      }
      updateCommands();
    };
    
    // LISTENERS

    function addEventListeners() {
      if ( !currentNote ) {
        return;
      }
      contentTree.addEventListener( "select", onSelect, false );
      contentTree.addEventListener( "dblclick", onDblClick, true );
      currentNote.addStateListener( noteStateListener );
    };

    function removeEventListeners() {
      if ( !currentNote ) {
        return;
      }
      contentTree.removeEventListener( "select", onSelect, false );
      contentTree.removeEventListener( "dblclick", onDblClick, true );
      currentNote.removeStateListener( noteStateListener );
    };
    
    // PUBLIC

    this.onStyleChanged = function( event ) {
    };
    
    this.onNoteChanged = function( event ) {
      var aNote = event.data.note;
      var aForced = event.data.forced;
      show( aNote, aForced );
    };
    
    this.onRelease = function( event ) {
      removeEventListeners();
      contentController.unregister();
    };
    
    // CONSTRUCTOR ( aWindow, aStyle )

    currentWindow = aWindow ? aWindow : window;
    if ( aStyle ) {
      currentStyle = aStyle;
    }
    contentTree = currentWindow.document.getElementById( "contentTree" );
    contentTreeChildren = currentWindow.document.getElementById( "contentTreeChildren" );
    noteStateListener = {
      name: "CONTENT",
      onNoteDeleted: onNoteDeleted,
      onNoteContentAppended: onNoteContentAppended,
      onNoteContentRemoved: onNoteContentRemoved,
    };
    contentController.register();
  };

}();
