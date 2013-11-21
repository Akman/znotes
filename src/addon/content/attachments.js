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

ru.akman.znotes.Attachments = function() {

  // !!!! %%%% !!!! STRINGS_BUNDLE & IS_STANDALONE
  return function( aWindow, aStyle ) {

    var Utils = ru.akman.znotes.Utils;
    var Common = ru.akman.znotes.Common;

    var currentWindow = null;
    var currentStyle = null;

    var attachmentTree = null;
    var attachmentTreeChildren = null;
    
    var currentNote = null;
    var currentAttachment = null;

    var noteStateListener = null;

    //
    // COMMANDS
    //
    
    var attachmentsCommands = {
      "znotes_attachmentsaddcontact_command": null,
      "znotes_attachmentsaddfile_command": null,
      "znotes_attachmentsopen_command": null,
      "znotes_attachmentsopenwith_command": null,
      "znotes_attachmentssave_command": null,
      "znotes_attachmentsdelete_command": null
    };
    
    var attachmentsController = {
      supportsCommand: function( cmd ) {
        if ( !( cmd in attachmentsCommands ) ) {
          return false;
        }
        return true;
        /*
        var focusedWindow = currentWindow.top.document.commandDispatcher.focusedWindow;
        return ( focusedWindow == currentWindow );
        */
      },
      isCommandEnabled: function( cmd ) {
        if ( !( cmd in attachmentsCommands ) ) {
          return false;
        }
        if ( !currentNote || currentNote.isLoading() ) {
          return false;
        }
        var type = getCurrentAttachmentType();
        switch ( cmd ) {
          case "znotes_attachmentsaddcontact_command":
          case "znotes_attachmentsaddfile_command":
            return true;
          case "znotes_attachmentsopen_command":
            if ( !isAttachmentSelected() ) {
              return false;
            }
            switch ( type ) {
              case "file" :
              case "contact" :
                return true;
            }
            break;
          case "znotes_attachmentsopenwith_command":
            if ( !isAttachmentSelected() ) {
              return false;
            }
            switch ( type ) {
              case "file" :
                return true;
            }
            break;
          case "znotes_attachmentssave_command":
            if ( !isAttachmentSelected() ) {
              return false;
            }
            switch ( type ) {
              case "file" :
              case "contact" :
                return true;
            }
            break;
          case "znotes_attachmentsdelete_command":
            if ( !isAttachmentSelected() ) {
              return false;
            }
            return true;
        }
        return false;
      },
      doCommand: function( cmd ) {
        if ( !( cmd in attachmentsCommands ) ) {
          return;
        }
        switch ( cmd ) {
          case "znotes_attachmentsaddcontact_command":
            var params = {
              input: {
              },
              output: null
            };
            currentWindow.openDialog(
              "chrome://znotes/content/abpicker.xul",
              "",
              "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
              params
            ).focus();
            if ( params.output ) {
              if ( params.output.cards.length > 0 ) {
                createContacts( params.output.cards );
              }
            }
            break;
          case "znotes_attachmentsaddfile_command":
            var nsIFilePicker = Components.interfaces.nsIFilePicker;
            var fp = Components.classes["@mozilla.org/filepicker;1"]
                               .createInstance( nsIFilePicker );
            fp.init(
              currentWindow,
              Utils.STRINGS_BUNDLE.getString(
                "attachments.addfiledialog.title" ),
              nsIFilePicker.modeOpen
            );
            fp.appendFilters( nsIFilePicker.filterAll );
            var result = fp.show();
            if ( result == nsIFilePicker.returnOK ) {
              createAttachment( fp.file );
            }
            break;
          case "znotes_attachmentsopen_command":
            openAttachment( currentAttachment );
            break;
          case "znotes_attachmentsopenwith_command":
            openAttachment( currentAttachment, true );
            break;
          case "znotes_attachmentssave_command":
            var treeItem = attachmentTree.view.getItemAtIndex(
              currentAttachment );
            var parseInfo = treeItem.getAttribute( "value" )
                                    .split( "\u0000" );
            var id = parseInfo[0];
            var type = parseInfo[1];
            var nsIFilePicker = Components.interfaces.nsIFilePicker;
            var fp = Components.classes["@mozilla.org/filepicker;1"]
                               .createInstance( nsIFilePicker );
            switch ( type ) {
              case "file" :
                fp.defaultString = id;
                break;
              case "contact" :
                var card = getContactCardById( id );
                if ( card != null )
                  fp.defaultString = getContactName( card.abCard ) + ".json";
                break;
              default :
            }
            fp.init(
              currentWindow,
              Utils.STRINGS_BUNDLE.getString(
                "attachments.saveattachmentdialog.title" ),
              nsIFilePicker.modeSave
            );
            fp.appendFilters( nsIFilePicker.filterAll );
            var result = fp.show();
            if ( result == nsIFilePicker.returnOK ||
                 result == nsIFilePicker.returnReplace ) {
              saveAttachment( currentAttachment, fp.file );
            }
            break;
          case "znotes_attachmentsdelete_command":
            var aRow = currentAttachment;
            var aColumn =
              attachmentTree.columns.getNamedColumn( "attachmentTreeName" );
            var currentAttachmentName =
              attachmentTree.view.getCellText( aRow, aColumn );
            var params = {
              input: {
                title: Utils.STRINGS_BUNDLE.getString(
                  "attachments.confirmDelete.title"
                ),
                message1: Utils.STRINGS_BUNDLE.getFormattedString(
                  "attachments.confirmDelete.message1",
                  [ currentAttachmentName ]
                ),
                message2: Utils.STRINGS_BUNDLE.getString(
                  "attachments.confirmDelete.message2"
                )
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
              deleteAttachment( currentAttachment );
            }
            break;
        }
      },
      onEvent: function( event ) {
      },
      getName: function() {
        return "ATTACHMENTS";
      },
      getCommand: function( cmd ) {
        if ( cmd in attachmentsCommands ) {
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
        for ( var cmd in attachmentsCommands ) {
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
      var id = attachmentsController.getId();
      Common.goUpdateCommand( "znotes_attachmentsaddcontact_command", id, currentWindow );
      Common.goUpdateCommand( "znotes_attachmentsaddfile_command", id, currentWindow );
      Common.goUpdateCommand( "znotes_attachmentsopen_command", id, currentWindow );
      Common.goUpdateCommand( "znotes_attachmentsopenwith_command", id, currentWindow );
      Common.goUpdateCommand( "znotes_attachmentssave_command", id, currentWindow );
      Common.goUpdateCommand( "znotes_attachmentsdelete_command", id, currentWindow );
    };    
    
    function createContacts( cards ) {
      for ( var i = 0; i < cards.length; i++ ) {
        var contact = cards[i]
        var directoryId = contact.directoryId;
        var localId = contact.localId;
        pabName = directoryId.substring( 0, directoryId.indexOf( "&" ) );
        var id = pabName + "\t" + localId;
        currentNote.addAttachment( [ id, "contact" ] );
      }
    };

    function createJSON( card ) {
      var result = '{\n';
      for ( var name in card ) {
        if ( name == 'properties' ) {
          continue;
        }
        var value = card[name];
        var type = typeof( value );
        switch ( type ) {
          case 'function':
          case 'object':
            continue;
          case 'boolean':
          case 'number':
            result += '  "' + name + '": ' + value + ',\n';
            break;
          default:
            result += '  "' + name + '": "' + value + '",\n';
            break;
        }
      }
      result += '  "properties": {\n';
      var properties = card.properties;
      while ( properties.hasMoreElements() ) {
        var property = properties.getNext().QueryInterface(
          Components.interfaces.nsIProperty );
        var type = typeof( property.value );
        switch ( type ) {
          case 'function':
          case 'object':
            continue;
          case 'boolean':
          case 'number':
            result += '    "' + property.name + '": ' + property.value +
              ',\n';
            break;
          default:
            result += '    "' + property.name + '": "' + property.value +
              '",\n';
            break;
        }
      }
      return result.substring( 0, result.length - 2 ) + "\n  }\n}";
    };
    
    function createAttachment( file ) {
      currentNote.addAttachment( [ file.leafName, "file", file.parent.path ] );
    };

    function deleteAttachment( anAttachmentIndex ) {
      var treeItem = attachmentTree.view.getItemAtIndex( anAttachmentIndex );
      var parseInfo = treeItem.getAttribute( "value" ).split( "\u0000" );
      var id = parseInfo[0];
      currentNote.removeAttachment( id );
    };

    function saveAttachment( anAttachmentIndex, entry ) {
      var treeItem = attachmentTree.view.getItemAtIndex( anAttachmentIndex );
      var parseInfo = treeItem.getAttribute( "value" )
                              .split( "\u0000" );
      var id = parseInfo[0];
      var type = parseInfo[1];
      switch ( type ) {
        case "file" :
          var src = currentNote.getAttachmentEntry( id );
          var parentDir = entry.parent.clone();
          var fileName = entry.leafName;
          try {
            if ( entry.exists() ) {
              entry.remove( false );
            }
            src.copyTo( parentDir, fileName );
          } catch ( e ) {
            Utils.log( e );
          }
          break;
        case "contact" :
          var card = getContactCardById( id );
          if ( card != null ) {
            Utils.writeFileContent(
              entry, "UTF-8", createJSON( card.abCard ) );
          }
          break;
      }
    };

    function openAttachment( anAttachmentIndex, force ) {
      var treeItem = attachmentTree.view.getItemAtIndex( anAttachmentIndex );
      var parseInfo = treeItem.getAttribute( "value" ).split( "\u0000" );
      var id = parseInfo[0];
      var type = parseInfo[1];
      switch ( type ) {
        case "file" :
          var entry = currentNote.getAttachmentEntry( id );
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
          break;
        case "contact" :
          var card = getContactCardById( id );
          if ( card ) {
            var abURI = card.abURI;
            var card = card.abCard;
            currentWindow.openDialog(
              "chrome://messenger/content/addressbook/abEditCardDialog.xul",
              "",
              "chrome,resizable=no,modal,titlebar,centerscreen",
              { abURI: abURI, card: card }
            );
          }
          break;
      }
      updateAttachmentTreeItem( anAttachmentIndex );
    };
    
    // EVENTS

    function onSelect( event ) {
      if ( attachmentTree.currentIndex == currentAttachment ) {
        event.stopPropagation();
        event.preventDefault();
        return false;
      }
      currentAttachment = attachmentTree.currentIndex;
      updateCommands();
      return true;
    };

    function onDblClick( event ) {
      if ( event.button != "0" ) {
        event.stopPropagation();
        event.preventDefault();
        return false;
      }
      if ( attachmentTree.currentIndex < 0 || currentAttachment == null ) {
        return true;
      }
      openAttachment( currentAttachment );
      return true;
    };

    // HELPERS

    function getFileName( entry ) {
      var result = Utils.STRINGS_BUNDLE.getString(
        "attachments.filenotfound" );
      if ( entry.exists() && !entry.isDirectory() ) {
        result = entry.leafName;
      }
      return result;
    };

    function getFileDescription( entry ) {
      var result = Utils.STRINGS_BUNDLE.getString(
        "attachments.filenotfound" );
      if ( entry.exists() && !entry.isDirectory() ) {
        result = Utils.STRINGS_BUNDLE.getString( "attachments.filesize" ) +
          ": " + Math.round( entry.fileSize / 1000 ) + " " +
          Utils.STRINGS_BUNDLE.getString( "attachments.kib" );
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

    function getContactName( card ) {
      return card.getProperty( "DisplayName", "" );
    };

    function getContactDescription( card ) {
      if ( Utils.IS_STANDALONE )
        return null;
      var directoryId = card.directoryId;
      var abManager = Components.classes["@mozilla.org/abmanager;1"]
                            .getService( Components.interfaces.nsIAbManager );
      var directories = abManager.directories;
      while ( directories.hasMoreElements() ) {
        var directory = directories.getNext().QueryInterface(
          Components.interfaces.nsIAbDirectory );
        if ( directory instanceof Components.interfaces.nsIAbDirectory ) {
          var id = directory.dirPrefId + "&" + directory.dirName;
          if ( id == directoryId ) {
            return directory.dirName;
          }
        }
      }
      return "";
    };

    function getContactIcon( card, size ) {
      return card.getProperty( "PhotoURI",
        "chrome://znotes_images/skin/contact-16x16.png" );
    };

    function getContactCardById( id ) {
      if ( Utils.IS_STANDALONE ) {
        return null;
      }
      var parseInfo = id.split( "\t" );
      var pabName = parseInfo[0];
      var pos = pabName.indexOf( "&" );
      if ( pos >= 0 ) {
        pabName = pabName.substring( 0, pos );
      }
      var localId = parseInfo[1];
      var directory = null;
      var isFound = false;
      var abManager =
        Components.classes["@mozilla.org/abmanager;1"]
                  .getService( Components.interfaces.nsIAbManager );
      var directories = abManager.directories;
      while ( directories.hasMoreElements() ) {
        directory = directories.getNext().QueryInterface(
          Components.interfaces.nsIAbDirectory );
        if ( directory instanceof Components.interfaces.nsIAbDirectory ) {
          if ( directory.dirPrefId == pabName ) {
            isFound = true;
            break;
          }
        }
      }
      if ( !isFound ) {
        return null;
      }
      //
      var cards = directory.childCards;
      while ( cards.hasMoreElements() ) {
        var card = cards.getNext().QueryInterface(
          Components.interfaces.nsIAbCard );
        if ( card instanceof Components.interfaces.nsIAbCard ) {
          if ( card.localId == localId ) {
            return { abCard: card, abURI: directory.URI };
          }
        }
      }
      return null;
    };

    function getAttachmentInfo( attachment ) {
      var result = {
        id: attachment[0],
        type: attachment[1],
        visible: true
      };
      switch ( result.type ) {
        case "file" :
          var entry = currentNote.getAttachmentEntry( result.id );
          if ( entry != null ) {
            result.name = getFileName( entry );
            result.icon = getFileIcon( entry, 16 );
            result.description = getFileDescription( entry );
          }
          break;
        case "contact" :
          var card = getContactCardById( result.id );
          if ( card != null ) {
            card = card.abCard;
            result.name = getContactName( card );
            result.icon = getContactIcon( card, 16 );
            result.description = getContactDescription( card );
          } else {
            result.name = Utils.STRINGS_BUNDLE.getString(
              "attachments.unknowncontact.name" );
            result.icon = null;
            result.description = null;
          }
          result.visible = !Utils.IS_STANDALONE;
          break;
        default :
          result.name = Utils.STRINGS_BUNDLE.getString(
            "attachments.unknowntype.name" );
          result.icon = null;
          result.description = Utils.STRINGS_BUNDLE.getString(
            "attachments.unknowntype.description" );
      }
      return result;
    };
    
    function getCurrentAttachmentType() {
      if ( !isAttachmentSelected() ) {
        return null;
      }
      var currentTreeItem = attachmentTree.view.getItemAtIndex(
        currentAttachment );
      var parseInfo = currentTreeItem.getAttribute( "value" )
                                     .split( "\u0000" );
      return parseInfo[1];
    };

    function getCurrentAttachmentId() {
      if ( !isAttachmentSelected() ) {
        return null;
      }
      var currentTreeItem = attachmentTree.view.getItemAtIndex(
        currentAttachment );
      var parseInfo = currentTreeItem.getAttribute( "value" )
                                     .split( "\u0000" );
      return parseInfo[0];
    };
    
    function isAttachmentSelected() {
      return ( currentAttachment != null && currentAttachment != -1 );
    };
    
    // NOTE EVENTS

    function onNoteDeleted( aCategory, aNote ) {
      if ( currentNote == aNote ) {
        currentNote = null;
      }
    };

    function onNoteAttachmentAppended( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.changedNote;
      var anInfo = e.data.attachmentInfo;
      var id = anInfo[0];
      var type = anInfo[1];
      var name = null;
      var icon = null;
      var description = null;
      var treeItem = null;
      var parseInfo = null;
      var aRow = -1;
      for ( var i = 0; i < attachmentTree.view.rowCount; i++ ) {
        treeItem = attachmentTree.view.getItemAtIndex( i );
        parseInfo = treeItem.getAttribute( "value" ).split( "\u0000" );
        if ( id == parseInfo[0] ) {
          aRow = i;
          break;
        }
      }
      if ( aRow == -1 ) {
        switch ( type ) {
          case "file" :
            var entry = aNote.getAttachmentEntry( id );
            name = getFileName( entry );
            icon = getFileIcon( entry, 16 );
            description = getFileDescription( entry );
            break;
          case "contact" :
            var card = getContactCardById( id ).abCard;
            name = getContactName( card );
            icon = getContactIcon( card, 16 );
            description = getContactDescription( card );
            break;
          default :
            name = Utils.STRINGS_BUNDLE.getString(
              "attachments.unknowntype.name" );
            icon = null;
            description = Utils.STRINGS_BUNDLE.getString(
              "attachments.unknowntype.description" );
            break;
        }
        var treeItem =
          createAttachmentTreeItem( id, type, icon, name, description );
        attachmentTreeChildren.appendChild( treeItem );
        aRow = attachmentTree.view.rowCount - 1;
      }
      attachmentTree.view.selection.select( aRow );
    };

    function onNoteAttachmentRemoved( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.changedNote;
      var anInfo = e.data.attachmentInfo;
      var attachmentID = anInfo[0];
      var attachmentType = anInfo[1];
      var treeItem = null;
      var parseInfo = null;
      var id = null;
      var index = attachmentTree.currentIndex;
      var aRow = -1;
      for ( var i = 0; i < attachmentTree.view.rowCount; i++ ) {
        treeItem = attachmentTree.view.getItemAtIndex( i );
        parseInfo = treeItem.getAttribute( "value" ).split( "\u0000" );
        id = parseInfo[0];
        if ( attachmentID == id ) {
          aRow = i;
          break;
        }
      }
      if ( aRow != -1 ) {
        if ( index == attachmentTree.view.rowCount - 1 )
          index--;
        treeItem.parentNode.removeChild( treeItem );
        if ( index < 0 ) {
          currentAttachment = null;
          attachmentTree.view.selection.select( -1 );
        } else {
          attachmentTree.view.selection.select( index );
        }
      }
    };

    // VIEW

    function getAttachmentInfoFromItem( anItem ) {
      var parseInfo = anItem.getAttribute( "value" )
                            .split( "\u0000" );
      var result = {
        id: parseInfo[0],
        type: parseInfo[1],
        name: null,
        icon: null,
        description: null
      };
      switch ( result.type ) {
        case "file" :
          var entry = currentNote.getAttachmentEntry( result.id );
          if ( entry != null ) {
            result.name = getFileName( entry );
            result.icon = getFileIcon( entry, 16 );
            result.description = getFileDescription( entry );
          }
          break;
        case "contact" :
          var card = getContactCardById( result.id );
          if ( card != null ) {
            card = card.abCard;
            result.name = getContactName( card );
            result.icon = getContactIcon( card, 16 );
            result.description = getContactDescription( card );
          }
          break;
        default :
          result.name = Utils.STRINGS_BUNDLE.getString(
            "attachments.unknowntype.name" );
          result.icon = null;
          result.description = Utils.STRINGS_BUNDLE.getString(
            "attachments.unknowntype.description" );
      }
      return result;
    };
    
    function createAttachmentTreeItem( id, type, icon, name, description ) {
      var treeItem = null;
      var treeRow = null;
      var treeCell = null;
      treeRow = currentWindow.document.createElement( "treerow" );
      treeCell = currentWindow.document.createElement( "treecell" );
      treeCell.setAttribute( "label", name );
      treeCell.setAttribute( "src", icon );
      treeCell.setAttribute( "properties", "attachment" );
      treeRow.appendChild( treeCell );
      treeCell = currentWindow.document.createElement( "treecell" );
      treeCell.setAttribute( "label", description );
      treeRow.appendChild( treeCell );
      treeItem = currentWindow.document.createElement( "treeitem" );
      treeItem.appendChild( treeRow );
      treeItem.setAttribute( "value", id + "\u0000" + type );
      return treeItem;
    };

    function updateAttachmentTreeItem( itemIndex ) {
      var anItem = attachmentTree.view.getItemAtIndex( itemIndex );
      var anInfo = getAttachmentInfoFromItem( anItem );
      var treeRow = anItem.firstChild;
      var treeCell = treeRow.childNodes[
        attachmentTree.columns
                      .getNamedColumn( "attachmentTreeName" ).index
      ];
      treeCell.setAttribute( "label", anInfo.name );
      treeCell.setAttribute( "src", anInfo.icon );
      treeCell.setAttribute( "properties", "attachment" );
      var treeCell = treeRow.childNodes[
        attachmentTree.columns
                      .getNamedColumn( "attachmentTreeDescription" ).index
      ];
      treeCell.setAttribute( "label", anInfo.description );
    };
    
    function clearAttachmentsTree() {
      while ( attachmentTreeChildren.firstChild ) {
        attachmentTreeChildren.removeChild(
          attachmentTreeChildren.firstChild );
      }
    };
    
    function showCurrentView() {
      attachmentTree.removeAttribute( "disabled" );
      var count = 0;
      var info = null;
      var attachments = currentNote.getAttachments();
      for ( var i = 0; i < attachments.length; i++ ) {
        info = getAttachmentInfo( attachments[i] );
        if ( info.visible ) {
          count += 1;
          attachmentTreeChildren.appendChild(
            createAttachmentTreeItem(
              info.id,
              info.type,
              info.icon,
              info.name,
              info.description
            )
          );
        }
      }
      attachmentTree.view.selection.select( count > 0 ? 0 : -1 );
    };
    
    function hideCurrentView() {
      attachmentTree.setAttribute( "disabled", "true" );
    };
    
    function show( aNote, aForced ) {
      if ( currentNote && currentNote == aNote && !aForced ) {
        return;
      }
      removeEventListeners();
      clearAttachmentsTree();
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
      attachmentTree.addEventListener( "dblclick", onDblClick, true );
      attachmentTree.addEventListener( "select", onSelect, false );
      currentNote.addStateListener( noteStateListener );
    };

    function removeEventListeners() {
      if ( !currentNote ) {
        return;
      }
      currentNote.removeStateListener( noteStateListener );
      attachmentTree.removeEventListener( "select", onSelect, false );
      attachmentTree.removeEventListener( "dblclick", onDblClick, true );
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
      attachmentsController.unregister();
    };

    // CONSTRUCTOR ( aWindow, aStyle )

    currentWindow = aWindow ? aWindow : window;
    if ( aStyle ) {
      currentStyle = aStyle;
    }
    attachmentTree = currentWindow.document.getElementById( "attachmentTree" );
    attachmentTreeChildren =
      currentWindow.document.getElementById( "attachmentTreeChildren" );
    noteStateListener = {
      name: "ATTACHMENTS",
      onNoteDeleted: onNoteDeleted,
      onNoteAttachmentAppended: onNoteAttachmentAppended,
      onNoteAttachmentRemoved: onNoteAttachmentRemoved
    };
    Common.goSetCommandHidden(
      "znotes_attachmentsaddcontact_command",
      Utils.IS_STANDALONE,
      currentWindow
    );
    attachmentsController.register();
  };

}();
