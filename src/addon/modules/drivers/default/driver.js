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

Components.utils.import( "resource://znotes/utils.js"  , ru.akman.znotes );

var EXPORTED_SYMBOLS = ["Driver"];

var Driver = function() {

  // D E S C R I P T O R

  var Utils = ru.akman.znotes.Utils;
  
  var DescriptorException = function( message ) {
    this.name = "DescriptorException";
    this.message = message;
    this.toString = function() {
      return this.name + ": " + this.message;
    }
  };

  var Descriptor = function( entryPath, encoding, entryName ) {

    var parseString = function( str ) {
      return str.split( "\u0000" );
    };

    var composeString = function( data ) {
      return data.join( "\u0000" );
    };

    var trimString = function( s ) {
      return s.replace( /(^\s+)|(\s+$)/g, "" );
    };

    this.readDescriptorFile = function() {
      var content = ru.akman.znotes.Utils.readFileContent(
        this.entry,
        this.encoding
      );
      return content.split(/\r\n|\r|\n/);
    };

    this.writeDescriptorFile = function( data ) {
      ru.akman.znotes.Utils.writeFileContent(
        this.entry,
        this.encoding,
        data.join("\r\n")
      );
    };

    this.getItems = function() {
      var data = this.readDescriptorFile();
      var result = [];
      var str = null;
      for ( var i = 0; i < data.length; i++ ) {
        str = trimString( data[i] );
        if ( str.length == 0 )
          continue;
        result.push( parseString( str ) )
      }
      return result;
    };

    this.addItem = function( info ) {
      var data = this.readDescriptorFile();
      var arr = [];
      var str = null;
      for ( var i = 0; i < data.length; i++ ) {
        str = trimString( data[i] );
        if ( str.length == 0 )
          continue;
        arr.push( str );
      }
      str = composeString( info );
      arr.push( str );
      this.writeDescriptorFile( arr );
      return info[0];
    };

    this.removeItem = function( id ) {
      var data = this.readDescriptorFile();
      var arr = [];
      var isChanged = false;
      var parseInfo = null;
      var str = null;
      for ( var i = 0; i < data.length; i++ ) {
        str = trimString( data[i] );
        if ( str.length == 0 )
          continue;
        parseInfo = parseString( str );
        if ( parseInfo[0] == id ) {
          isChanged = true;
        } else {
          arr.push( str );
        }
      }
      if ( isChanged ) {
        this.writeDescriptorFile( arr );
      } else {
        throw new DescriptorException( "Item with ID='" + id + "' was not found." );
      }
    };

    this.getItem = function( id ) {
      var data = this.readDescriptorFile();
      var result = null;
      var parseInfo = null;
      var str = null;
      for ( var i = 0; i < data.length; i++ ) {
        str = trimString( data[i] );
        if ( str.length == 0 )
          continue;
        parseInfo = parseString( str );
        if ( parseInfo[0] == id )
          result = parseInfo;
      }
      return result;
    };

    this.setItem = function( info ) {
      var data = this.readDescriptorFile();
      var arr = [];
      var isChanged = false;
      var parseInfo = null;
      var str = null;
      for ( var i = 0; i < data.length; i++ ) {
        str = trimString( data[i] );
        if ( str.length == 0 )
          continue;
        parseInfo = parseString( str );
        if ( parseInfo[0] == info[0] ) {
          str = composeString( info );
          isChanged = true;
        }
        arr.push( str );
      }
      if ( !isChanged ) {
        throw new DescriptorException( "Item with ID='"+info[0]+"' was not found." );
      }
      this.writeDescriptorFile( arr );
    };

    this.refresh = function( newEntryPath ) {
      this.entryPath = newEntryPath.clone();
      this.entry = newEntryPath.clone();
      this.entry.append( this.entryName );
    };

    this.entryPath = entryPath.clone();
    this.entryName = entryName;
    this.encoding = encoding;

    this.entry = entryPath.clone();
    this.entry.append( entryName );
    if ( this.entry.exists() && this.entry.isDirectory() ) {
      throw new DescriptorException( "Can't create descriptor file. Directory with the same name already exists." );
    }
    if ( !this.entry.exists() ) {
      this.entry.create( Components.interfaces.nsIFile.NORMAL_FILE_TYPE, parseInt( "0644", 8 ) );
    }

  };

  // E N T R Y

  var EntryException = function( message ) {
    this.name = "EntryException";
    this.message = message;
    this.toString = function() {
      return this.name + ": " + this.message;
    }
  };

  var Entry = function( aParent, anEntry, anEncoding ) {

    var NOTE_FILENAME_SUFFIX = ".znote";
    var ENTRY_DESCRIPTOR_FILENAME = ".znotes";
    var NOTE_CONTENT_DIRECTORY_SUFFIX = "_files";
    var NOTE_ATTACHMENTS_DIRECTORY_SUFFIX = "_attachments";
    
    var getValidFileName = function( name ) {
      return name.replace(/\u005C/g, "%5C")  // '\'
                 .replace(/\u002F/g, "%2F")  // '/'
                 .replace(/\u003A/g, "%3A")  // ':'
                 .replace(/\u002A/g, "%2A")  // '*'
                 .replace(/\u003F/g, "%3F")  // '?'
                 .replace(/\u0022/g, "%22")  // '"'
                 .replace(/\u003C/g, "%3C")  // '<'
                 .replace(/\u003E/g, "%3E")  // '>'
                 .replace(/\u007C/g, "%7C"); // '|'
    };

    var getNameByFileName = function( fileName ) {
      return fileName.replace(/%5C/g, "\u005C")  // '\'
                     .replace(/%2F/g, "\u002F")  // '/'
                     .replace(/%3A/g, "\u003A")  // ':'
                     .replace(/%2A/g, "\u002A")  // '*'
                     .replace(/%3F/g, "\u003F")  // '?'
                     .replace(/%22/g, "\u0022")  // '"'
                     .replace(/%3C/g, "\u003C")  // '<'
                     .replace(/%3E/g, "\u003E")  // '>'
                     .replace(/%7C/g, "\u007C"); // '|'
    };

    var compareEntries = function( e1, e2 ) {
      return e1.getIndex() - e2.getIndex();
    };

    // *************************************************************************

    this.createCategory = function( name ) {
      if ( !this.isCategory() )
        throw new EntryException( "Can't create category within a note." );
      var entry = this.entry.clone();
      var leafName = getValidFileName( name );
      entry.append( leafName );
      if ( !entry.exists() ) {
        entry.create( Components.interfaces.nsIFile.DIRECTORY_TYPE, parseInt( "0755", 8 ) );
      } else {
        throw new EntryException( "Can't create category. File or directory with the same name already exists." );
      }
      var result = new Entry( this, entry, this.encoding );
      result.setName( name );
      return result;
    };

    this.createNote = function( name ) {
      if ( !this.isCategory() )
        throw new EntryException( "Can't create note within another note." );
      var entry = this.entry.clone();
      var leafName = getValidFileName( name ) + NOTE_FILENAME_SUFFIX;
      entry.append( leafName );
      if( !entry.exists() ) {
        entry.create( Components.interfaces.nsIFile.NORMAL_FILE_TYPE, parseInt( "0644", 8 ) );
      } else {
        throw new EntryException( "Can't create note. File or directory with the same name already exists." );
      }
      var datetime = Date.now();
      var result = new Entry( this, entry, this.encoding );
      result.setName( name );
      result.setCreateDateTime( datetime );
      result.setUpdateDateTime( datetime );
      return result;
    };

    this.exists = function( name, isNote ) {
      var entry = this.entry.clone();
      var leafName = getValidFileName( name );
      if ( isNote )
        leafName = leafName + NOTE_FILENAME_SUFFIX;
      entry.append( leafName );
      return entry.exists();
    };

    this.getSize = function() {
      if ( this.isCategory() )
        throw new EntryException( "Can't get size of a category." );
      return this.entry.fileSize;
    };
    
    this.remove = function() {
      var leafName = this.getLeafName();
      var entry = this.entry.clone();
      var descriptor = this.getDescriptor();
      if ( this.entry.isDirectory() ) {
        entry.append( ENTRY_DESCRIPTOR_FILENAME );
        if ( entry.exists() )
          entry.remove( false );
      } else {
        var name = leafName.substring( 0, leafName.length - NOTE_FILENAME_SUFFIX.length );
        var contentDirName = name + NOTE_CONTENT_DIRECTORY_SUFFIX;
        entry = this.entry.parent.clone();
        entry.append( contentDirName );
        if ( entry.exists() ) {
          entry.remove( true );
        }
        var attachmentsDirName = name + NOTE_ATTACHMENTS_DIRECTORY_SUFFIX;
        entry = this.entry.parent.clone();
        entry.append( attachmentsDirName );
        if ( entry.exists() ) {
          entry.remove( true );
        }
      }
      this.entry.remove( false );
      descriptor.removeItem( leafName );
    };

    this.refresh = function( aParent ) {
      var leafName = this.getLeafName();
      var entry = aParent.entry.clone();
      entry.append( leafName );
      this.entry = entry.clone();
      this.parent = aParent;
      if ( this.isCategory() ) {
        this.descriptor.refresh( this.entry );
      } else {
        var name = leafName.substring( 0, leafName.length - NOTE_FILENAME_SUFFIX.length );
        var contentDirName = name + NOTE_CONTENT_DIRECTORY_SUFFIX;
        var contentDirEntry = this.entry.parent.clone();
        contentDirEntry.append( contentDirName );
        this.contentsDescriptor.refresh( contentDirEntry );
        var attachmentsDirName = name + NOTE_ATTACHMENTS_DIRECTORY_SUFFIX;
        var attachmentsDirEntry = this.entry.parent.clone();
        attachmentsDirEntry.append( attachmentsDirName );
        this.attachmentsDescriptor.refresh( attachmentsDirEntry );
      }
    };

    this.moveTo = function( category ) {
      var leafName = this.getLeafName();
      var descriptor = this.getDescriptor();
      var data = descriptor.getItem( leafName );
      var targetEntry = category.entry.clone();
      targetEntry.append( leafName );
      if ( this.isCategory() ) {
        if ( !targetEntry.exists() ) {
          this.entry.moveTo( category.entry, null );
        } else {
          throw new EntryException( "Can't move category. File or directory with the same name already exists in target directory." );
        }
      } else {
        var name = leafName.substring( 0, leafName.length - NOTE_FILENAME_SUFFIX.length );
        var contentsDescriptor = this.getContentsDescriptor();
        var contentDirName = name + NOTE_CONTENT_DIRECTORY_SUFFIX;
        var contentDirEntry = this.entry.parent.clone();
        contentDirEntry.append( contentDirName );
        var targetContentDirEntry = category.entry.clone();
        targetContentDirEntry.append( contentDirName );
        var attachmentsDescriptor = this.getAttachmentsDescriptor();
        var attachmentsDirName = name + NOTE_ATTACHMENTS_DIRECTORY_SUFFIX;
        var attachmentsDirEntry = this.entry.parent.clone();
        attachmentsDirEntry.append( attachmentsDirName );
        var targetAttachmentsDirEntry = category.entry.clone();
        targetAttachmentsDirEntry.append( attachmentsDirName );
        if ( targetEntry.exists() ) {
          throw new EntryException( "Can't move note. File or directory with the same name already exists in target directory." );
        }
        if ( targetContentDirEntry.exists() ) {
          throw new EntryException( "Can't move note's content directory. File or directory with the same name already exists in target directory." );
        }
        if ( targetAttachmentsDirEntry.exists() ) {
          throw new EntryException( "Can't move note's attachments directory. File or directory with the same name already exists in target directory." );
        }
        if ( !contentDirEntry.exists() ) {
          throw new EntryException( "Can't move note's content directory. Note's content directory does not exist." );
        }
        if ( !attachmentsDirEntry.exists() ) {
          throw new EntryException( "Can't move note's attachments directory. Note's attachments directory does not exist." );
        }
        this.entry.moveTo( category.entry, null );
        contentDirEntry.moveTo( category.entry, null );
        contentsDescriptor.refresh( targetContentDirEntry );
        attachmentsDirEntry.moveTo( category.entry, null );
        attachmentsDescriptor.refresh( targetAttachmentsDirEntry );
      }
      descriptor.removeItem( leafName );
      this.parent = category;
      descriptor = this.getDescriptor();
      descriptor.addItem( data );
    };

    this.createDefaultItemInfo = function( leafName ) {
      var info = [];
      info.push( leafName );
      this.fillDefaultItemInfo( info );
      return info;
    };

    this.fillDefaultItemInfo = function( info ) {
      if ( this.entry == null )
        return false;
      if ( !this.entry.exists() )
        return false;
      var name = info[0];
      if ( !this.entry.isDirectory() )
        name = name.substring( 0, name.lastIndexOf( "." ) );
      name = getNameByFileName( name );
      var index = -1;
      var openState = false;
      var tagsIDs = "";
      var selectedIndex = -1;
      var createdDateTime = this.entry.lastModifiedTime;
      var updatedDateTime = this.entry.lastModifiedTime;
      var id = ru.akman.znotes.Utils.createUUID();
      var type = this.entry.isDirectory() ? "" : "unknown";
      var data = "{}";
      var result = false;
      if ( info[1] === undefined ) {
        info[1] = name;
        result = true;
      }
      if ( info[2] === undefined ) {
        info[2] = index;
        result = true;
      }
      if ( info[3] === undefined ) {
        info[3] = openState;
        result = true;
      }
      if ( info[4] === undefined ) {
        info[4] = tagsIDs;
        result = true;
      }
      if ( info[5] === undefined ) {
        info[5] = selectedIndex;
        result = true;
      }
      if ( info[6] === undefined ) {
        info[6] = createdDateTime;
        result = true;
      }
      if ( info[7] === undefined ) {
        info[7] = updatedDateTime;
        result = true;
      }
      if ( info[8] === undefined ) {
        info[8] = id;
        result = true;
      }
      if ( info[9] === undefined ) {
        info[9] = type;
        result = true;
      }
      if ( info[10] === undefined ) {
        info[10] = data;
        result = true;
      }
      if ( info.length > 11 ) {
        info.splice( 11 );
        result = true;
      }
      return result;
    };

    this.getDescriptorItemField = function( index ) {
      var descriptor = this.getDescriptor();
      var leafName = this.getLeafName();
      var info = descriptor.getItem( leafName );
      if ( info == null ) {
        info = this.createDefaultItemInfo( leafName );
        descriptor.addItem( info );
      }
      if ( this.fillDefaultItemInfo( info ) )
        descriptor.setItem( info );
      return info[index];
    };

    this.setDescriptorItemField = function( index, value ) {
      var descriptor = this.getDescriptor();
      var leafName = this.getLeafName();
      var data = descriptor.getItem( leafName );
      if ( data == null ) {
        data = this.createDefaultItemInfo( leafName );
        descriptor.addItem( data );
      }
      data[index] = value;
      descriptor.setItem( data );
    };

    this.getLeafName = function() {
      return this.entry.leafName;
    };

    this.getName = function() {
      if ( this.isRoot() ) {
        return null;
      }
      return this.getDescriptorItemField( 1 );
    };

    this.setLeafName = function( leafName ) {
      var oldLeafName = this.getLeafName();
      var descriptor = this.getDescriptor();
      var data = descriptor.getItem( oldLeafName );
      var targetEntry = this.entry.parent.clone();
      targetEntry.append( leafName );
      if ( this.isCategory() ) {
        if ( !targetEntry.exists() ) {
          this.entry.moveTo( null, leafName );
        } else {
          throw new EntryException( "Can't rename category. File or directory with the same name already exists in current directory." );
        }
      } else {
        var name = oldLeafName.substring( 0, oldLeafName.length - NOTE_FILENAME_SUFFIX.length );
        var contentsDescriptor = this.getContentsDescriptor();
        var contentDirName = name + NOTE_CONTENT_DIRECTORY_SUFFIX;
        var contentDirEntry = this.entry.parent.clone();
        contentDirEntry.append( contentDirName );
        var targetContentName = leafName.substring( 0, leafName.length - NOTE_FILENAME_SUFFIX.length );
        var targetContentDirName = targetContentName + NOTE_CONTENT_DIRECTORY_SUFFIX;
        var targetContentDirEntry = this.entry.parent.clone();
        targetContentDirEntry.append( targetContentDirName );
        var attachmentsDescriptor = this.getAttachmentsDescriptor();
        var attachmentsDirName = name + NOTE_ATTACHMENTS_DIRECTORY_SUFFIX;
        var attachmentsDirEntry = this.entry.parent.clone();
        attachmentsDirEntry.append( attachmentsDirName );
        var targetAttachmentsName = leafName.substring( 0, leafName.length - NOTE_FILENAME_SUFFIX.length );
        var targetAttachmentsDirName = targetAttachmentsName + NOTE_ATTACHMENTS_DIRECTORY_SUFFIX;
        var targetAttachmentsDirEntry = this.entry.parent.clone();
        targetAttachmentsDirEntry.append( targetAttachmentsDirName );
        if ( targetEntry.exists() ) {
          throw new EntryException( "Can't rename note. File or directory with the same name already exists in current directory." );
        }
        if ( targetContentDirEntry.exists() ) {
          throw new EntryException( "Can't rename note's content directory. File or directory with the same name already exists in current directory." );
        }
        if ( targetAttachmentsDirEntry.exists() ) {
          throw new EntryException( "Can't rename note's attachments directory. File or directory with the same name already exists in current directory." );
        }
        if ( !contentDirEntry.exists() ) {
          throw new EntryException( "Can't rename note's content directory. Note's content directory does not exist." );
        }
        if ( !attachmentsDirEntry.exists() ) {
          throw new EntryException( "Can't rename note's attachments directory. Note's attachments directory does not exist." );
        }
        contentDirEntry.moveTo( null, targetContentDirName );
        contentsDescriptor.refresh( targetContentDirEntry );
        attachmentsDirEntry.moveTo( null, targetAttachmentsDirName );
        attachmentsDescriptor.refresh( targetAttachmentsDirEntry );
        this.entry.moveTo( null, leafName );
      }
      descriptor.removeItem( oldLeafName );
      data[0] = leafName;
      descriptor.addItem( data );
    };

    this.setName = function( name ) {
      if ( this.isRoot() )
        return;
      var leafName = getValidFileName( name );
      if ( !this.isCategory() )
        leafName = leafName + NOTE_FILENAME_SUFFIX;
      if ( this.getLeafName() != leafName ) {
        try {
          this.setLeafName( leafName );
        } catch ( e ) {
          // On Windows system file/directory names "Abc" and "ABC" are equal
          if ( this.getLeafName().toLowerCase() != leafName.toLowerCase() ) {
            throw e;
          }
        }
      }
      this.setDescriptorItemField( 1, name );
    };

    this.getIndex = function() {
      if ( this.isRoot() ) {
        return 0;
      }
      return this.getDescriptorItemField( 2 );
    };

    this.getOpenState = function() {
      if ( !this.isCategory() ) {
        throw new EntryException( "Can't get note's 'OpenState' property. This property does not exist." );
      }
      if ( this.isRoot() ) {
        return true;
      }
      return this.getDescriptorItemField( 3 ) == "true" ? true : false;
    };

    this.getTags = function() {
      if ( this.isCategory() )
        throw new EntryException( "Cant't get category's 'Tags' property. This property does not exist." );
      var result = this.getDescriptorItemField( 4 );
      if ( result ) {
        result = result.split(",");
        if ( result.length == 1 && result[0] == "" ) {
          result.splice( 0, 1 );
        }
      } else {
        result = [];
      }
      return result;
    };

    this.getSelectedIndex = function() {
      if ( !this.isCategory() )
        throw new EntryException( "Can't get note's 'SelectedIndex' property. This property does not exist." );
      if ( this.isRoot() )
        return -1;
      return this.getDescriptorItemField( 5 );
    };

    this.getCreateDateTime = function() {
      if ( this.isCategory() )
        throw new EntryException( "Can't get category's 'CreateDateTime' property. This property does not exist." );
      return new Date( parseInt( this.getDescriptorItemField( 6 ) ) );
    };

    this.getUpdateDateTime = function() {
      if ( this.isCategory() )
        throw new EntryException( "Can't get category's 'UpdateDateTime' property. This property does not exist." );
      return new Date( parseInt( this.getDescriptorItemField( 7 ) ) );
    };

    this.getId = function() {
      if ( this.isCategory() )
        throw new EntryException( "Can't get category's 'Id' property. This property does not exist." );
      return this.getDescriptorItemField( 8 );
    };
    
    this.getType = function() {
      if ( this.isCategory() )
        throw new EntryException( "Can't get category's 'Type' property. This property does not exist." );
      return this.getDescriptorItemField( 9 );
    };

    this.getData = function() {
      if ( this.isCategory() )
        throw new EntryException( "Can't get category's 'Data' property. This property does not exist." );
      return this.getDescriptorItemField( 10 );
    };
    
    this.setData = function( data ) {
      if ( this.isCategory() )
        throw new EntryException( "Can't set category's 'Data' property. This property does not exist." );
      this.setDescriptorItemField( 10, data );
    };

    this.setType = function( type ) {
      if ( this.isCategory() )
        throw new EntryException( "Can't set category's 'Type' property. This property does not exist." );
      this.setDescriptorItemField( 9, type );
    };
    
    this.setId = function( id ) {
      if ( this.isCategory() )
        throw new EntryException( "Can't set category's 'Id' property. This property does not exist." );
      this.setDescriptorItemField( 8, id );
    };

    this.setIndex = function( index ) {
      if ( this.isRoot() )
        return;
      this.setDescriptorItemField( 2, index );
    };

    this.setOpenState = function( state ) {
      if ( !this.isCategory() || this.isRoot() ) {
        throw new EntryException( "Can't set note's 'OpenState' property. This property does not exist." );
      }
      this.setDescriptorItemField( 3, "" + state );
    };

    this.setTags = function( ids ) {
      if ( this.isCategory() )
        throw new EntryException( "Can't set category's 'Tags' property. This property does not exist." );
      this.setDescriptorItemField( 4, ids.join( "," ) );
    };

    this.setSelectedIndex = function( index ) {
      if ( !this.isCategory() || this.isRoot() )
        throw new EntryException( "Can't set note's 'SelectedIndex' property. This property does not exist." );
      this.setDescriptorItemField( 5, index );
    };

    this.setCreateDateTime = function( datetime ) {
      if ( this.isCategory() )
        throw new EntryException( "Can't set category's 'CreateDateTime' property. This property does not exist." );
      this.setDescriptorItemField( 6, datetime );
    };

    this.setUpdateDateTime = function( datetime ) {
      if ( this.isCategory() )
        throw new EntryException( "Can't set category's 'UpdateDateTime' property. This property does not exist." );
      this.setDescriptorItemField( 7, datetime );
    };

    this.getMainContent = function() {
      if ( this.isCategory() )
        throw new EntryException( "Can't get category's 'MainContent' property. This property does not exist." );
      return ru.akman.znotes.Utils.readFileContent( this.entry, this.encoding);
    };

    this.setMainContent = function( data ) {
      if ( this.isCategory() )
        throw new EntryException( "Can't set category's 'MainContent' property. This property does not exist." );
      ru.akman.znotes.Utils.writeFileContent( this.entry, this.encoding, data );
      var datetime = Date.now();
      this.setUpdateDateTime( datetime );
    };

    // ***********************************************************************

    this.hasContents = function() {
      if ( this.isCategory() )
        throw new EntryException( "Can't call category's 'hasContents' method. This method does not exist." );
      var result = false;
      var items = this.contentsDescriptor.getItems();
      return items.length > 0;
      return result;
    };

    this.getContents = function() {
      if ( this.isCategory() )
        throw new EntryException( "Can't call category's 'getContents' method. This method does not exist." );
      var contentsDescriptor = this.getContentsDescriptor();
      return contentsDescriptor.getItems();
    }

    this.getContent = function( leafName ) {
      if ( this.isCategory() )
        throw new EntryException( "Can't call category's 'getContent' method. This method does not exist." );
      var contentsDescriptor = this.getContentsDescriptor();
      return contentsDescriptor.getItem( leafName );
    }

    this.getContentEntry = function( leafName ) {
      var entry = this.getContentDirectory();
      entry = entry.clone();
      entry.append( leafName );
      return entry;
    };

    this.addContent = function( data ) {
      if ( this.isCategory() )
        throw new EntryException( "Can't call category's 'addContent' method. This method does not exist." );
      var contentsDescriptor = this.getContentsDescriptor();
      var leafName = data[0];
      var isItemExists = true;
      var info = contentsDescriptor.getItem( leafName );
      if ( info == null ) {
        info = [ leafName ];
        isItemExists = false;
      }
      var contentDirectoryEntry = this.getContentDirectory();
      var sourceDirectoryEntry = Components.classes["@mozilla.org/file/local;1"]
                                           .createInstance( Components.interfaces.nsIFile );
      sourceDirectoryEntry.initWithPath( data[1] );
      if ( sourceDirectoryEntry.leafName == ENTRY_DESCRIPTOR_FILENAME ) {
        return null;
      }
      if ( sourceDirectoryEntry.path != contentDirectoryEntry.path ) {
        var srcEntry = sourceDirectoryEntry.clone();
        srcEntry.append( leafName );
        var dstEntry = contentDirectoryEntry.clone();
        dstEntry.append( leafName );
        try {
          if ( dstEntry.exists() ) {
            dstEntry.remove( false );
          }
          srcEntry.copyTo( contentDirectoryEntry, null );
        } catch ( e ) {
          Utils.log( e );
          return null;
        }
      }
      if ( isItemExists ) {
        contentsDescriptor.setItem( info );
      } else {
        contentsDescriptor.addItem( info );
      }
      return info;
    };

    this.removeContent = function( leafName ) {
      if ( this.isCategory() )
        throw new EntryException( "Can't call category's 'removeContent' method. This method does not exist." );
      var contentsDescriptor = this.getContentsDescriptor();
      var info = contentsDescriptor.getItem( leafName );
      if ( info == null ) {
        throw new EntryException( "Can't remove content. Content descriptor item not found." );
      }
      var contentDirectoryEntry = this.getContentDirectory();
      var fileEntry = contentDirectoryEntry.clone();
      fileEntry.append( leafName );
      try {
        if ( fileEntry.exists() ) {
          fileEntry.remove( false );
        }
      } catch ( e ) {
        Utils.log( e );
      }
      contentsDescriptor.removeItem( leafName );
      return info;
    };

    // ***********************************************************************

    this.hasAttachments = function() {
      if ( this.isCategory() )
        throw new EntryException( "Can't call category's 'hasAttachments' method. This method does not exist." );
      var result = false;
      var items = this.attachmentsDescriptor.getItems();
      return items.length > 0;
      return result;
    };

    this.getAttachments = function() {
      if ( this.isCategory() )
        throw new EntryException( "Can't call category's 'getAttachments' method. This method does not exist." );
      var attachmentsDescriptor = this.getAttachmentsDescriptor();
      return attachmentsDescriptor.getItems();
    }

    this.getAttachment = function( leafName ) {
      if ( this.isCategory() )
        throw new EntryException( "Can't call category's 'getAttachment' method. This method does not exist." );
      var attachmentsDescriptor = this.getAttachmentsDescriptor();
      return attachmentsDescriptor.getItem( leafName );
    }

    this.getAttachmentEntry = function( leafName ) {
      var entry = this.getAttachmentsDirectory();
      entry = entry.clone();
      entry.append( leafName );
      return entry;
    };

    this.addAttachment = function( data ) {
      if ( this.isCategory() )
        throw new EntryException( "Can't call category's 'addAttachment' method. This method does not exist." );
      var attachmentsDescriptor = this.getAttachmentsDescriptor();
      var leafName = data[0];
      var type = data[1];
      var isItemExists = true;
      var info = attachmentsDescriptor.getItem( leafName );
      if ( info == null ) {
        info = [ leafName ];
        isItemExists = false;
      }
      info[1] = type;
      switch ( type ) {
        case "file" :
          var attachmentsDirectoryEntry = this.getAttachmentsDirectory();
          var sourceDirectoryEntry = Components.classes["@mozilla.org/file/local;1"]
                                               .createInstance( Components.interfaces.nsIFile );
          sourceDirectoryEntry.initWithPath( data[2] );
          if ( sourceDirectoryEntry.leafName == ENTRY_DESCRIPTOR_FILENAME ) {
            return null;
          }
          if ( sourceDirectoryEntry.path != attachmentsDirectoryEntry.path ) {
            var srcEntry = sourceDirectoryEntry.clone();
            srcEntry.append( leafName );
            var dstEntry = attachmentsDirectoryEntry.clone();
            dstEntry.append( leafName );
            try {
              if ( dstEntry.exists() ) {
                dstEntry.remove( false );
              }
              srcEntry.copyTo( attachmentsDirectoryEntry, null );
            } catch ( e ) {
              Utils.log( e );
              return null;
            }
          }
          break;
        case "contact" :
          break;
      }
      if ( isItemExists ) {
        attachmentsDescriptor.setItem( info );
      } else {
        attachmentsDescriptor.addItem( info );
      }
      return info;
    };

    this.removeAttachment = function( leafName ) {
      if ( this.isCategory() )
        throw new EntryException( "Can't call category's 'removeAttachment' method. This method does not exist." );
      var attachmentsDescriptor = this.getAttachmentsDescriptor();
      var info = attachmentsDescriptor.getItem( leafName );
      if ( info == null ) {
        throw new EntryException( "Can't remove attachment. Attachment descriptor item not found." );
      }
      var type = info[1];
      switch ( type ) {
        case "file" :
          var attachmentsDirectoryEntry = this.getAttachmentsDirectory();
          var fileEntry = attachmentsDirectoryEntry.clone();
          fileEntry.append( leafName );
          try {
            if ( fileEntry.exists() ) {
              fileEntry.remove( false );
            }
          } catch ( e ) {
            Utils.log( e );
          }
          break;
        case "contact" :
          break;
      }
      attachmentsDescriptor.removeItem( leafName );
      return info;
    };

    // ***********************************************************************

    this.getEntries = function() {
      if ( !this.isCategory() )
        throw new EntryException( "Can't call note's 'getEntries' method. This method does not exist." );
      var categories = [];
      var notes = [];
      var dirs = [];
      var entry = null;
      var note = null;
      var name = null;
      var ignore = false;
      var entries = this.entry.directoryEntries;
      while( entries.hasMoreElements() ) {
        entry = entries.getNext();
        entry.QueryInterface( Components.interfaces.nsIFile );
        if ( !entry.isDirectory() ) {
          if ( entry.leafName.length > NOTE_FILENAME_SUFFIX.length &&
               entry.leafName.substring(
                 entry.leafName.length - NOTE_FILENAME_SUFFIX.length
               ) == NOTE_FILENAME_SUFFIX )
            notes.push( new Entry( this, entry, this.encoding ) );
        } else {
          dirs.push( entry );
        }
      }
      for each ( entry in dirs ) {
        entry.QueryInterface( Components.interfaces.nsIFile );
        ignore = false;
        for each ( var note in notes ) {
          var name = note.entry.leafName;
          name = name.substring( 0, name.length - NOTE_FILENAME_SUFFIX.length );
          if ( entry.leafName == ( name + NOTE_CONTENT_DIRECTORY_SUFFIX ) ) {
            ignore = true;
            break;
          }
          if ( entry.leafName == ( name + NOTE_ATTACHMENTS_DIRECTORY_SUFFIX ) ) {
            ignore = true;
            break;
          }
        }
        if ( !ignore )
          categories.push( new Entry( this, entry, this.encoding ) );
      }
      categories.sort( compareEntries );
      notes.sort( compareEntries );
      var result = [];
      for ( var i = 0; i < categories.length; i++ ) {
        categories[i].setIndex( i );
        result.push( categories[i] );
      }
      for ( var i = 0; i < notes.length; i++ ) {
        notes[i].setIndex( i );
        result.push( notes[i] );
      }
      return result;
    };

    this.isCategory = function() {
      if ( this.entry && this.entry.exists() ) {
        return this.entry.isDirectory();
      } else {
        return false;
      }
    };

    this.isRoot = function() {
      return this.parent == null;
    };

    this.getDescriptor = function() {
      if ( this.isRoot() )
        return null;
      return this.parent.descriptor;
    };

    this.getContentsDescriptor = function() {
      if ( this.isCategory() )
        throw new EntryException( "Can't call category's 'getContentsDescriptor' method. This method does not exist." );
      return this.contentsDescriptor;
    };

    this.getAttachmentsDescriptor = function() {
      if ( this.isCategory() )
        throw new EntryException( "Can't call category's 'getAttachmentsDescriptor' method. This method does not exist." );
      return this.attachmentsDescriptor;
    };

    this.getURI = function() {
      if ( this.isCategory() )
        throw new EntryException( "Can't call category's 'getURI' method. This method does not exist." );
      var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                                .getService( Components.interfaces.nsIIOService );
      var fph = ioService.getProtocolHandler( "file" )
                         .QueryInterface( Components.interfaces.nsIFileProtocolHandler );
      return fph.newFileURI( this.entry );
    };

    this.getBaseURI = function() {
      if ( this.isCategory() )
        throw new EntryException( "Can't call category's 'getBaseURI' method. This method does not exist." );
      var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                                .getService( Components.interfaces.nsIIOService );
      var fph = ioService.getProtocolHandler( "file" )
                         .QueryInterface( Components.interfaces.nsIFileProtocolHandler );
      return fph.newFileURI( this.getContentDirectory() );
    };

    this.getContentDirectory = function() {
      if ( this.isCategory() )
        throw new EntryException( "Can't call category's 'getContentDirectory' method. This method does not exist." );
      var leafName = this.getLeafName();
      var contentDirectoryName = leafName.substring( 0, leafName.length - NOTE_FILENAME_SUFFIX.length );
      contentDirectoryName += NOTE_CONTENT_DIRECTORY_SUFFIX;
      var contentDirectoryEntry = this.entry.parent.clone();
      contentDirectoryEntry.append( contentDirectoryName );
      return contentDirectoryEntry;
    };

    this.loadContentDirectory = function( fromDirectoryEntry, flagMove ) {
      var toDirectoryEntry = this.getContentDirectory();
      var entries = fromDirectoryEntry.directoryEntries;
      while( entries.hasMoreElements() ) {
        var entry = entries.getNext();
        entry.QueryInterface( Components.interfaces.nsIFile );
        if ( flagMove ) {
          entry.moveTo( toDirectoryEntry, entry.leafName );
        } else {
          entry.copyTo( toDirectoryEntry, entry.leafName );
        }
      }
      this.updateContentsDescriptor( toDirectoryEntry );
    };

    this.getAttachmentsDirectory = function() {
      if ( this.isCategory() )
        throw new EntryException( "Can't call category's 'getAttachmentsDirectory' method. This method does not exist." );
      var leafName = this.getLeafName();
      var attachmentsDirectoryName = leafName.substring( 0, leafName.length - NOTE_FILENAME_SUFFIX.length );
      attachmentsDirectoryName += NOTE_ATTACHMENTS_DIRECTORY_SUFFIX;
      var attachmentsDirectoryEntry = this.entry.parent.clone();
      attachmentsDirectoryEntry.append( attachmentsDirectoryName );
      return attachmentsDirectoryEntry;
    };

    this.getEncoding = function() {
      return this.encoding;
    };

    this.toString = function() {
      var parentEntryPath = "*NULL*";
      if ( this.parent ) {
        parentEntryPath = this.parent.entry.path;
      }
      return "'" + this.entry.path + "'\n" +
        "'" + parentEntryPath + "'\n" +
        this.isCategory() ? "" : this.encoding + "\n" +
        "isCategory = " + this.isCategory();
    };

    this.updateAttachmentsDescriptor = function( attachmentsDirectoryEntry ) {
      var items = this.attachmentsDescriptor.getItems();
      for ( var i = 0; i < items.length; i++ ) {
        var item = items[i];
        if ( item[1] == "file" ) {
          var itemEntry = attachmentsDirectoryEntry.clone();
          itemEntry.append( item[0] );
          if ( !itemEntry.exists() )
            this.attachmentsDescriptor.removeItem( item[0] );
        }
      }
      var entries = attachmentsDirectoryEntry.directoryEntries;
      while( entries.hasMoreElements() ) {
        var entry = entries.getNext();
        entry.QueryInterface( Components.interfaces.nsIFile );
        if ( !entry.isDirectory() ) {
          var name = entry.leafName;
          if ( name != ENTRY_DESCRIPTOR_FILENAME ) {
            if ( this.attachmentsDescriptor.getItem( name ) == null ) {
              this.attachmentsDescriptor.addItem( [ name, "file" ] );
            }
          }
        }
      }
    };

    this.updateContentsDescriptor = function( contentDirectoryEntry ) {
      var items = this.contentsDescriptor.getItems();
      for ( var i = 0; i < items.length; i++ ) {
        var item = items[i];
        var itemEntry = contentDirectoryEntry.clone();
        itemEntry.append( item[0] );
        if ( !itemEntry.exists() )
          this.contentsDescriptor.removeItem( item[0] );
      }
      var entries = contentDirectoryEntry.directoryEntries;
      while( entries.hasMoreElements() ) {
        var entry = entries.getNext();
        entry.QueryInterface( Components.interfaces.nsIFile );
        if ( !entry.isDirectory() ) {
          var name = entry.leafName;
          if ( name != ENTRY_DESCRIPTOR_FILENAME ) {
            if ( this.contentsDescriptor.getItem( name ) == null ) {
              this.contentsDescriptor.addItem( [ name ] );
            }
          }
        }
      }
    };

    this.parent = aParent;
    this.entry = anEntry;
    this.encoding = anEncoding;
    this.descriptor = null;
    this.contentsDescriptor = null;
    this.attachmentsDescriptor = null;
    if ( this.isCategory() ) {
      var descriptorEntry = this.entry.clone();
      this.descriptor = new Descriptor(
        descriptorEntry,
        this.encoding,
        ENTRY_DESCRIPTOR_FILENAME
      );
      var items = this.descriptor.getItems();
      for ( var i = 0; i < items.length; i++ ) {
        var item = items[i];
        var itemEntry = this.entry.clone();
        itemEntry.append( item[0] );
        if ( !itemEntry.exists() )
          this.descriptor.removeItem( item[0] );
      }
    } else {
      var contentDirectoryEntry = this.getContentDirectory();
      if ( !contentDirectoryEntry.exists() ) {
        contentDirectoryEntry.create( Components.interfaces.nsIFile.DIRECTORY_TYPE, parseInt( "0755", 8 ) );
      }
      this.contentsDescriptor = new Descriptor(
        contentDirectoryEntry,
        this.encoding,
        ENTRY_DESCRIPTOR_FILENAME
      );
      this.updateContentsDescriptor( contentDirectoryEntry );
      var attachmentsDirectoryEntry = this.getAttachmentsDirectory();
      if ( !attachmentsDirectoryEntry.exists() ) {
        attachmentsDirectoryEntry.create( Components.interfaces.nsIFile.DIRECTORY_TYPE, parseInt( "0755", 8 ) );
      }
      this.attachmentsDescriptor = new Descriptor(
        attachmentsDirectoryEntry,
        this.encoding,
        ENTRY_DESCRIPTOR_FILENAME
      );
      this.updateAttachmentsDescriptor( attachmentsDirectoryEntry );
    }

  };

  // D R I V E R

  var DriverException = function( message ) {
    this.name = "DriverException";
    this.message = message;
    this.toString = function() {
      return this.name + ": " + this.message;
    }
  };

  var pub = {};

  pub["default"] = true;
  
  pub.getInfo = function() {
    return {
      name: "default",
      version: "1.0",
      description: "Local file system driver"
    };
  };

  pub.getName = function() {
    return pub.getInfo().name;
  };

  pub.getVersion = function() {
    return pub.getInfo().version;
  };

  pub.getDescription = function() {
    return pub.getInfo().description;
  };

  pub.getParameters = function() {
    var defaultDataPath = ru.akman.znotes.Utils.getDataPath();
    do {
      var defaultDirName = ru.akman.znotes.Utils.createUUID();
      var defaultDirEntry = defaultDataPath.clone();
      defaultDirEntry.append( defaultDirName );
    } while ( defaultDirEntry.exists() );
    defaultDataPath.append( defaultDirName );
    return {
      encoding: "UTF-8",
      path: defaultDataPath.path
    };
  };

  pub.getConnection = function( params ) {

    // I N I T I A L I Z A T I O N

    var path = params.path;
    var encoding = params.encoding;
    var dataPath = Components.classes["@mozilla.org/file/local;1"]
                             .createInstance( Components.interfaces.nsIFile );
    try {
      dataPath.initWithPath( path );
    } catch ( e ) {
      throw new DriverException( "Invalid path: " + path );
    }

    // C O N N E C T I O N

    var connection = {};

    var tagListDescriptor = null;
    connection.getTagListDescriptor = function() {
      if ( !this.exists() ) {
        throw new DriverException( "Directory doesn't exists: " + dataPath.path );
      }
      if ( !this.permits() ) {
        throw new DriverException( "Access denied: " + dataPath.path );
      }
      if ( !tagListDescriptor ) {
        tagListDescriptor = new Descriptor(
          dataPath,
          encoding,
          ".ztags"
        );
      }
      return tagListDescriptor;
    };

    var rootCategoryEntry = null;
    connection.getRootCategoryEntry = function() {
      if ( !this.exists() ) {
        throw new DriverException( "Directory doesn't exists: " + dataPath.path );
      }
      if ( !this.permits() ) {
        throw new DriverException( "Access denied: " + dataPath.path );
      }
      if ( !rootCategoryEntry ) {
        rootCategoryEntry = new Entry(
          null,
          dataPath,
          encoding
        );
      }
      return rootCategoryEntry;
    };

    connection.exists = function() {
      return dataPath.exists() && dataPath.isDirectory();
    };

    connection.permits = function() {
      if ( !this.exists() ) {
        return false;
      }
      var result = true;
      var entry = null;
      do {
        entry = dataPath.clone();
        entry.append( ru.akman.znotes.Utils.createUUID() );
      } while ( entry.exists() )
      try {
        entry.create( Components.interfaces.nsIFile.DIRECTORY_TYPE, parseInt( "0755", 8 ) );
        entry.remove( true );
      } catch ( e ) {
        result = false;
      }
      return result;
    };

    connection.create = function() {
      if ( !this.exists() ) {
        try {
          dataPath.create( Components.interfaces.nsIFile.DIRECTORY_TYPE, parseInt( "0755", 8 ) );
        } catch ( e ) {
          throw new DriverException( "Can't create directory: " + dataPath.path );
        }
      }
    };

    connection.remove = function() {
      if ( this.exists() ) {
        try {
          dataPath.remove( true );
        } catch ( e ) {
          throw new DriverException( "Can't remove directory: " + dataPath.path );
        }
      }
    };

    return connection;

  };

  return pub;

}();
