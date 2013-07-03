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

ru.akman.znotes.Attachments = function() {

  // !!!! %%%% !!!! STRINGS_BUNDLE & IS_STANDALONE
  return function( aWindow, aDocument, aNoteUpdateCallback ) {

    var stringsBundle = ru.akman.znotes.Utils.STRINGS_BUNDLE;
    var isStandalone = ru.akman.znotes.Utils.IS_STANDALONE;
    var log = ru.akman.znotes.Utils.log;

    var noteButtonContact = null;
    var noteButtonAttachment = null;

    var attachmentTree = null;
    var attachmentTreeChildren = null;
    var attachmentTreeBoxObject = null;

    var attachmentTreeMenu = null;

    var cmdNewContact = null;
    var cmdNewAttachment = null;
    var cmdOpenAttachment = null;
    var cmdOpenAttachmentWith = null;
    var cmdSaveAttachment = null;
    var cmdDeleteAttachment = null;

    var currentWindow = null;
    var currentDocument = null;
    var currentNote = null;
    var currentAttachment = null;

    var noteStateListener = null;

    // C O M M A N D S

    function onCmdNewAttachment( source ) {
      var nsIFilePicker = Components.interfaces.nsIFilePicker;
      var fp = Components.classes["@mozilla.org/filepicker;1"]
                         .createInstance( nsIFilePicker );
      fp.init(
        currentWindow,
        stringsBundle.getString( "attachments.addfiledialog.title" ),
        nsIFilePicker.modeOpen
      );
      fp.appendFilters( nsIFilePicker.filterAll );
      var result = fp.show();
      if ( result == nsIFilePicker.returnOK ) {
        createAttachment( fp.file );
      }
    };

    function onCmdNewContact( source ) {
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
    };

    function onCmdOpenAttachment( source ) {
      if ( currentAttachment == null || currentAttachment == -1 )
        return;
      openAttachment( currentAttachment );
    };

    function onCmdOpenAttachmentWith( source ) {
      if ( currentAttachment == null || currentAttachment == -1 )
        return;
      openAttachment( currentAttachment, true );
    };

    function onCmdSaveAttachment( source ) {
      if ( currentAttachment == null || currentAttachment == -1 )
        return false;
      var treeItem = attachmentTree.view.getItemAtIndex( currentAttachment );
      var parseInfo = treeItem.getAttribute( "value" ).split( "\u0000" );
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
        stringsBundle.getString( "attachments.saveattachmentdialog.title" ),
        nsIFilePicker.modeSave
      );
      fp.appendFilters( nsIFilePicker.filterAll );
      var result = fp.show();
      if ( result == nsIFilePicker.returnOK || result == nsIFilePicker.returnReplace ) {
        saveAttachment( currentAttachment, fp.file );
      }
      return true;
    };

    function onCmdDeleteAttachment( source ) {
      var aRow = currentAttachment;
      var aColumn = attachmentTree.columns.getNamedColumn( "attachmentTreeName" );
      var currentAttachmentName = attachmentTree.view.getCellText( aRow, aColumn );
      var params = {
        input: {
          title: stringsBundle.getString( "attachments.confirmDelete.title" ),
          message1: stringsBundle.getFormattedString( "attachments.confirmDelete.message1", [ currentAttachmentName ] ),
          message2: stringsBundle.getString( "attachments.confirmDelete.message2" )
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
        currentAttachmentChanged();
      }
      return true;
    };

    // E V E N T S

    function onSelect( event ) {
      if ( attachmentTree.currentIndex == currentAttachment ) {
        event.stopPropagation();
        event.preventDefault();
        return;
      }
      currentAttachment = attachmentTree.currentIndex;
      currentAttachmentChanged();
    };

    function onClick( event ) {
      event.preventDefault();
      event.stopPropagation();
      if ( event.button != "2" ) {
        return false;
      }
      attachmentTreeMenu.openPopupAtScreen(
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
      if ( attachmentTree.currentIndex < 0 || currentAttachment == null ) {
        return false;
      }
      openAttachment( currentAttachment );
      return true;
    };

    // S T A T E

    function currentAttachmentChanged() {
      if ( currentAttachment == null || currentAttachment == -1 ) {
        attachmentTree.view.selection.select( -1 );
        cmdOpenAttachment.setAttribute( "disabled", "true" );
        cmdOpenAttachmentWith.setAttribute( "disabled", "true" );
        cmdSaveAttachment.setAttribute( "disabled", "true" );
        cmdDeleteAttachment.setAttribute( "disabled", "true" );
      } else {
        var currentTreeItem = attachmentTree.view.getItemAtIndex( currentAttachment );
        var parseInfo = currentTreeItem.getAttribute( "value" ).split( "\u0000" );
        var id = parseInfo[0];
        var type = parseInfo[1];
        switch ( type ) {
          case "file" :
            cmdOpenAttachment.removeAttribute( "disabled" );
            cmdOpenAttachmentWith.removeAttribute( "disabled" );
            cmdSaveAttachment.removeAttribute( "disabled" );
            cmdDeleteAttachment.removeAttribute( "disabled" );
            break;
          case "contact" :
            cmdOpenAttachment.setAttribute( "disabled", "true" );
            cmdOpenAttachmentWith.setAttribute( "disabled", "true" );
            cmdSaveAttachment.removeAttribute( "disabled" );
            cmdDeleteAttachment.removeAttribute( "disabled" );
            break;
          default :
            cmdOpenAttachment.setAttribute( "disabled", "true" );
            cmdOpenAttachmentWith.setAttribute( "disabled", "true" );
            cmdSaveAttachment.setAttribute( "disabled", "true" );
            cmdDeleteAttachment.removeAttribute( "disabled" );
        }
      }
    };

    // V I E W

    function createAttachmentTreeItem( attachmentID, attachmentType, attachmentIcon, attachmentName, attachmentDescription ) {
      var treeItem = null;
      var treeRow = null;
      var treeCell = null;
      treeRow = currentDocument.createElement( "treerow" );
      treeCell = currentDocument.createElement( "treecell" );
      treeCell.setAttribute( "label", attachmentName );
      treeCell.setAttribute( "src", attachmentIcon );
      treeCell.setAttribute( "properties", "attachment" );
      treeRow.appendChild( treeCell );
      treeCell = currentDocument.createElement( "treecell" );
      treeCell.setAttribute( "label", attachmentDescription );
      treeRow.appendChild( treeCell );
      treeItem = currentDocument.createElement( "treeitem" );
      treeItem.appendChild( treeRow );
      treeItem.setAttribute( "value", attachmentID + "\u0000" + attachmentType );
      return treeItem;
    };

    function updateAttachmentTreeItem( itemIndex ) {
      var anItem = attachmentTree.view.getItemAtIndex( itemIndex );
      var parseInfo = anItem.getAttribute( "value" ).split( "\u0000" );
      var id = parseInfo[0];
      var type = parseInfo[1];
      var attachmentName = null;
      var attachmentIcon = null;
      var attachmentDescription = null;
      switch ( type ) {
        case "file" :
          var entry = currentNote.getAttachmentEntry( id );
          if ( entry != null ) {
            attachmentName = getFileName( entry );
            attachmentIcon = getFileIcon( entry, 16 );
            attachmentDescription = getFileDescription( entry );
          }
          break;
        case "contact" :
          var card = getContactCardById( id );
          if ( card != null ) {
            card = card.abCard;
            attachmentName = getContactName( card );
            attachmentIcon = getContactIcon( card, 16 );
            attachmentDescription = getContactDescription( card );
          }
          break;
        default :
          attachmentName = stringsBundle.getString( "attachments.unknowntype.name" );
          attachmentIcon = null;
          attachmentDescription = stringsBundle.getString( "attachments.unknowntype.description" );
      }
      var treeRow = anItem.firstChild;
      var treeCell = treeRow.childNodes[ attachmentTree.columns.getNamedColumn( "attachmentTreeName" ).index ];
      treeCell.setAttribute( "label", attachmentName );
      treeCell.setAttribute( "src", attachmentIcon );
      treeCell.setAttribute( "properties", "attachment" );
      var treeCell = treeRow.childNodes[ attachmentTree.columns.getNamedColumn( "attachmentTreeDescription" ).index ];
      treeCell.setAttribute( "label", attachmentDescription );
    };

    // A C T I O N S

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
      var parseInfo = treeItem.getAttribute( "value" ).split( "\u0000" );
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
            log( e );
          }
          break;
        case "contact" :
          var card = getContactCardById( id );
          if ( card != null ) {
            card = card.abCard;
            var json = '{\n';
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
                  json += '  "' + name + '": ' + value + ',\n';
                  break;
                default:
                  json += '  "' + name + '": "' + value + '",\n';
                  break;
              }
            }
            json += '  "properties": {\n';
            var properties = card.properties;
            while ( properties.hasMoreElements() ) {
              var property = properties.getNext().QueryInterface( Components.interfaces.nsIProperty );
              var type = typeof( property.value );
              switch ( type ) {
                case 'function':
                case 'object':
                  continue;
                case 'boolean':
                case 'number':
                  json += '    "' + property.name + '": ' + property.value + ',\n';
                  break;
                default:
                  json += '    "' + property.name + '": "' + property.value + '",\n';
                  break;
              }
            }
            json = json.substring( 0, json.length - 2 ) + "\n  }\n}";
            ru.akman.znotes.Utils.writeFileContent( entry, "UTF-8", json );
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
            var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                                      .getService( Components.interfaces.nsIIOService );
            var fph = ioService.getProtocolHandler( "file" )
                               .QueryInterface( Components.interfaces.nsIFileProtocolHandler );
            var url = fph.getURLSpecFromFile( entry );
            var title = stringsBundle.getString( "utils.openuri.apppicker.title" );
            ru.akman.znotes.Utils.openURI( url, force, currentWindow, title );
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

    // U T I L S

    function getFileName( entry ) {
      var result = stringsBundle.getString( "attachments.filenotfound" );
      if ( entry.exists() && !entry.isDirectory() ) {
        result = entry.leafName;
      }
      return result;
    };

    function getFileDescription( entry ) {
      var result = stringsBundle.getString( "attachments.filenotfound" );
      if ( entry.exists() && !entry.isDirectory() ) {
        result = stringsBundle.getString( "attachments.filesize" ) + ": " +
                 Math.round( entry.fileSize / 1000 ) + " " +
                 stringsBundle.getString( "attachments.kib" );
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

    function getContactName( card ) {
      return card.getProperty( "DisplayName", "" );
    };

    function getContactDescription( card ) {
      if ( isStandalone )
        return null;
      var directoryId = card.directoryId;
      var abManager = Components.classes["@mozilla.org/abmanager;1"]
                            .getService( Components.interfaces.nsIAbManager );
      var directories = abManager.directories;
      while ( directories.hasMoreElements() ) {
        var directory = directories.getNext().QueryInterface( Components.interfaces.nsIAbDirectory );
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
      return card.getProperty( "PhotoURI", "chrome://znotes/skin/contact-16x16.png" );
    };

    function getContactCardById( id ) {
      if ( isStandalone ) {
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
      var abManager = Components.classes["@mozilla.org/abmanager;1"]
                                .getService( Components.interfaces.nsIAbManager );
      var directories = abManager.directories;
      while ( directories.hasMoreElements() ) {
        directory = directories.getNext().QueryInterface( Components.interfaces.nsIAbDirectory );
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
        var card = cards.getNext().QueryInterface( Components.interfaces.nsIAbCard );
        if ( card instanceof Components.interfaces.nsIAbCard ) {
          if ( card.localId == localId ) {
            return { abCard: card, abURI: directory.URI };
          }
        }
      }
      return null;
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
    function onNoteContentAppended( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.changedNote;
      var anInfo = e.data.contentInfo;
    }
    */

    /*
    function onNoteContentRemoved( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.changedNote;
      var anInfo = e.data.contentInfo;
    }
    */

    function onNoteAttachmentAppended( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.changedNote;
      var anInfo = e.data.attachmentInfo;
      var attachmentID = anInfo[0];
      var attachmentType = anInfo[1];
      var attachmentName = null;
      var attachmentIcon = null;
      var attachmentDescription = null;
      var treeItem = null;
      var parseInfo = null;
      var id = null;
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
      if ( aRow == -1 ) {
        switch ( attachmentType ) {
          case "file" :
            var entry = aNote.getAttachmentEntry( attachmentID );
            attachmentName = getFileName( entry );
            attachmentIcon = getFileIcon( entry, 16 );
            attachmentDescription = getFileDescription( entry );
            break;
          case "contact" :
            var card = getContactCardById( attachmentID ).abCard;
            attachmentName = getContactName( card );
            attachmentIcon = getContactIcon( card, 16 );
            attachmentDescription = getContactDescription( card );
            break;
          default :
            attachmentName = stringsBundle.getString( "attachments.unknowntype.name" );
            attachmentIcon = null;
            attachmentDescription = stringsBundle.getString( "attachments.unknowntype.description" );
            break;
        }
        var treeItem = createAttachmentTreeItem(  attachmentID, attachmentType, attachmentIcon, attachmentName, attachmentDescription );
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

    // L I S T E N E R S

    function addEventListeners() {
      attachmentTree.addEventListener( "click", onClick, true );
      attachmentTree.addEventListener( "dblclick", onDblClick, true );
      attachmentTree.addEventListener( "select", onSelect, false );
      cmdNewContact.addEventListener( "command", onCmdNewContact, false );
      cmdNewAttachment.addEventListener( "command", onCmdNewAttachment, false );
      cmdOpenAttachment.addEventListener( "command", onCmdOpenAttachment, false );
      cmdOpenAttachmentWith.addEventListener( "command", onCmdOpenAttachmentWith, false );
      cmdSaveAttachment.addEventListener( "command", onCmdSaveAttachment, false );
      cmdDeleteAttachment.addEventListener( "command", onCmdDeleteAttachment, false );
      if ( currentNote ) {
        currentNote.addStateListener( noteStateListener );
      }
    };

    function removeEventListeners() {
      attachmentTree.removeEventListener( "select", onSelect, false );
      attachmentTree.removeEventListener( "click", onClick, true );
      attachmentTree.removeEventListener( "dblclick", onDblClick, true );
      cmdNewContact.removeEventListener( "command", onCmdNewContact, false );
      cmdNewAttachment.removeEventListener( "command", onCmdNewAttachment, false );
      cmdOpenAttachment.removeEventListener( "command", onCmdOpenAttachment, false );
      cmdOpenAttachmentWith.removeEventListener( "command", onCmdOpenAttachmentWith, false );
      cmdSaveAttachment.removeEventListener( "command", onCmdSaveAttachment, false );
      cmdDeleteAttachment.removeEventListener( "command", onCmdDeleteAttachment, false );
      if ( currentNote ) {
        currentNote.removeStateListener( noteStateListener );
      }
    };

    // V I E W

    this.enable = function() {
      attachmentTree.removeAttribute( "disabled" );
      cmdNewContact.removeAttribute( "disabled" );
      cmdNewAttachment.removeAttribute( "disabled" );
    };

    this.disable = function() {
      attachmentTree.setAttribute( "disabled", "true" );
      cmdNewContact.setAttribute( "disabled", "true" );
      cmdNewAttachment.setAttribute( "disabled", "true" );
    };

    this.hide = function() {
      while ( attachmentTreeChildren.firstChild ) {
        attachmentTreeChildren.removeChild( attachmentTreeChildren.firstChild );
      }
      attachmentTree.setAttribute( "disabled", "true" );
      cmdNewContact.setAttribute( "disabled", "true" );
      cmdNewAttachment.setAttribute( "disabled", "true" );
      removeEventListeners();
    }

    this.show = function( aNote ) {
      var attachments = null;
      var treeItem = null;
      var attachment = null;
      var entry = null;
      var card = null;
      var attachmentID = null;
      var attachmentName = null;
      var attachmentType = null;
      var attachmentIcon = null;
      var attachmentDescription = null;
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
      attachmentTree.removeAttribute( "disabled" );
      cmdNewContact.removeAttribute( "disabled" );
      cmdNewAttachment.removeAttribute( "disabled" );
      //
      attachments = currentNote.getAttachments();
      currentAttachment = null;
      while ( attachmentTreeChildren.firstChild )
        attachmentTreeChildren.removeChild( attachmentTreeChildren.firstChild );
      if ( currentNote != null ) {
        if ( attachments.length > 0 ) {
          for ( var i = 0; i < attachments.length; i++ ) {
            attachment = attachments[i];
            // ***
            isVisible = true;
            attachmentID = attachment[0];
            attachmentType = attachment[1];
            switch ( attachmentType ) {
              case "file" :
                entry = currentNote.getAttachmentEntry( attachmentID );
                if ( entry != null ) {
                  attachmentName = getFileName( entry );
                  attachmentIcon = getFileIcon( entry, 16 );
                  attachmentDescription = getFileDescription( entry );
                }
                break;
              case "contact" :
                card = getContactCardById( attachmentID );
                if ( card != null ) {
                  card = card.abCard;
                  attachmentName = getContactName( card );
                  attachmentIcon = getContactIcon( card, 16 );
                  attachmentDescription = getContactDescription( card );
                } else {
                  attachmentName = stringsBundle.getString( "attachments.unknowncontact.name" );
                  attachmentIcon = null;
                  attachmentDescription = null;
                }
                if ( isStandalone ) {
                  isVisible = false;
                }
                break;
              default :
                attachmentName = stringsBundle.getString( "attachments.unknowntype.name" );
                attachmentIcon = null;
                attachmentDescription = stringsBundle.getString( "attachments.unknowntype.description" );;
            }
            // ***
            if ( isVisible ) {
              count += 1;
              treeItem = createAttachmentTreeItem( attachmentID, attachmentType, attachmentIcon, attachmentName, attachmentDescription );
              attachmentTreeChildren.appendChild( treeItem );
            }
          }
        }
      }
      attachmentTree.view.selection.select( count > 0 ? 0 : -1 );
      currentAttachmentChanged();
    };

    this.unload = function() {
      removeEventListeners();
    };

    // C O N S T R U C T O R

    currentWindow = aWindow;
    currentDocument = aDocument;
    attachmentTree = currentDocument.getElementById( "attachmentTree" );
    attachmentTreeBoxObject = attachmentTree.boxObject;
    attachmentTreeBoxObject.QueryInterface( Components.interfaces.nsITreeBoxObject );
    attachmentTreeChildren = currentDocument.getElementById( "attachmentTreeChildren" );
    attachmentTreeMenu = document.getElementById( "attachmentTreeMenu" );
    noteButtonContact = currentDocument.getElementById( "noteButtonContact" );
    if ( !isStandalone ) {
      noteButtonContact.removeAttribute( "hidden" );
    } else {
      noteButtonContact.setAttribute( "hidden", "true" );
    }
    noteButtonAttachment = currentDocument.getElementById( "noteButtonAttachment" );
    cmdNewContact = currentDocument.getElementById( "cmdNewContact" );
    cmdNewAttachment = currentDocument.getElementById( "cmdNewAttachment" );
    cmdOpenAttachment = currentDocument.getElementById( "cmdOpenAttachment" );
    cmdOpenAttachmentWith = currentDocument.getElementById( "cmdOpenAttachmentWith" );
    cmdSaveAttachment = currentDocument.getElementById( "cmdSaveAttachment" );
    cmdDeleteAttachment = currentDocument.getElementById( "cmdDeleteAttachment" );
    noteStateListener = {
      name: "ATTACHMENTS",
      // onNoteChanged: onNoteChanged,
      onNoteDeleted: onNoteDeleted,
      // onNoteTagsChanged: onNoteTagsChanged,
      // onNoteMainTagChanged: onNoteMainTagChanged,
      // onNoteContentChanged: onNoteContentChanged,
      // onNoteContentLoaded: onNoteContentLoaded,
      // onNoteContentAppended: onNoteContentAppended,
      // onNoteContentRemoved: onNoteContentRemoved,
      onNoteAttachmentAppended: onNoteAttachmentAppended,
      onNoteAttachmentRemoved: onNoteAttachmentRemoved
    };
    currentAttachmentChanged();
  };

}();
