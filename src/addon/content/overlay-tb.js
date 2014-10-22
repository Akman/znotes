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

var Cc = Components.classes;
var Ci = Components.interfaces;
var Cr = Components.results;
var Cu = Components.utils;

if ( !ru ) var ru = {};
if ( !ru.akman ) ru.akman = {};
if ( !ru.akman.znotes ) ru.akman.znotes = {};
if ( !ru.akman.znotes.core ) ru.akman.znotes.core = {};
if ( !ru.akman.znotes.mime ) ru.akman.znotes.mime = {};

Cu.import( "resource://znotes/utils.js", ru.akman.znotes );
Cu.import( "resource://znotes/event.js", ru.akman.znotes.core );
Cu.import( "resource://znotes/clipper.js", ru.akman.znotes.core );
Cu.import( "resource://znotes/tabmonitor.js", ru.akman.znotes );
Cu.import( "resource://znotes/prefsmanager.js", ru.akman.znotes );
Cu.import( "resource://znotes/sessionmanager.js", ru.akman.znotes );
Cu.import( "resource://znotes/keyset.js", ru.akman.znotes );
Cu.import( "resource://app/modules/gloda/mimemsg.js", ru.akman.znotes.mime );

ru.akman.znotes.ZNotes = function() {

  var pub = {};

  var Utils = ru.akman.znotes.Utils;
  var log = Utils.getLogger( "content.overlay-tb" );

  var Mime = ru.akman.znotes.mime;
  var Common = ru.akman.znotes.Common;
  var prefsBundle = ru.akman.znotes.PrefsManager.getInstance();
  var sessionManager = ru.akman.znotes.SessionManager.getInstance();
  var tabMonitor = ru.akman.znotes.TabMonitor.getInstance();

  var observerService = Cc["@mozilla.org/observer-service;1"].getService(
    Ci.nsIObserverService );

  var bookManager = null;
  var driverManager = null;

  var mailWindow = null;
  var folderTree = null;
  var threadTree = null;

  var keySet = null;
  var isMainLoaded = false;
  var mainWindow = null;
  var mainWindowState = null;

  var alertObserver = null;

  // HELPERS

  function getString( name ) {
    return Utils.STRINGS_BUNDLE.getString( name );
  };

  function getValidNoteName( category, name, aType ) {
    var index = 0, suffix = "";
    while ( !category.canCreateNote( name + suffix, aType ) ) {
      suffix = " (" + ++index + ")";
    }
    return name + suffix;
  };

  function createNote( aBook, aRoot, aName, aType ) {
    if ( !aBook || !aBook.isOpen() ) {
      return null;
    }
    return aRoot.createNote( aName, aType, null /* tagId */ );
  };

  function setupAlertObserver() {
    alertObserver = {
      observe: function( subject, topic, data ) {
        var params;
        switch ( topic ) {
          case "alertclickcallback":
            doOpenMainWindow();
            if ( mainWindow ) {
              params = Common.createCommandParamsObject();
              if ( params ) {
                params.setStringValue( "id", data );
                Common.goDoCommandWithParams(
                  "znotes_savemessage_command",
                  params,
                  mainWindow.document.getElementById( "znotes_dummy_command" )
                );
              }
            }
            break;
        }
      }
    };
  };

  /**
   * How to Find or Validate an Email Address
   * @author Jan Goyvaerts
   * @see http://www.regular-expressions.info/email.html
   */
  function getEmail( anAuthor ) {
    var result = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b/i.exec( anAuthor );
    return result ? result[0] : null;
  };

  function processMessagePart( part, textBodies, htmlBodies ) {
    if ( !part ) {
      return;
    }
    /**
     * MimeMessage || MimeUnknown || MimeContainer
     * parts [] The list of the MIME part children of this message
     * contentType The content type of this part
     */
    if ( part instanceof Mime.MimeMessage ||
         part instanceof Mime.MimeContainer ||
         part instanceof Mime.MimeUnknown ) {
      for ( var i = 0; i < part.parts.length; i++ ) {
        processMessagePart( part.parts[i], textBodies, htmlBodies );
      }
      return;
    }
    /**
     * MimeBody
     * body The actual body content
     * contentType The content type of this part
     */
    if ( part instanceof Mime.MimeBody ) {
      if ( part.contentType == "text/plain" ) {
        textBodies.push( part.body );
      } else {
        htmlBodies.push( part.body );
      }
      return;
    }
    /**
     * MimeMessageAttachment
     * name The filename of this attachment
     * contentType The MIME content type of this part
     * url The URL to stream if you want the contents of this part
     * isExternal Is the attachment stored someplace else than in the message?
     */
    if ( part instanceof Mime.MimeMessageAttachment ) {
      return;
    }
  };

  function getContactByEmail( anEmail ) {
    var dir, directories, card, cards, abManager;
    if ( anEmail ) {
      abManager = Cc["@mozilla.org/abmanager;1"].getService( Ci.nsIAbManager );
      directories = abManager.directories;
      while ( directories.hasMoreElements() ) {
        dir = directories.getNext().QueryInterface( Ci.nsIAbDirectory );
        if ( dir instanceof Ci.nsIAbDirectory ) {
          cards = dir.childCards;
          while ( cards.hasMoreElements() ) {
            card = cards.getNext().QueryInterface( Ci.nsIAbCard );
            if ( card instanceof Ci.nsIAbCard ) {
              if ( card.primaryEmail && card.primaryEmail === anEmail ) {
                return card;
              }
            }
          }
        }
      }
    }
    return null;
  };

  function addContact( aNote, aContact ) {
    var directoryId, localId, pabName, id;
    if ( aContact ) {
      directoryId = aContact.directoryId;
      localId = aContact.localId;
      pabName = directoryId.substring( 0, directoryId.indexOf( "&" ) );
      id = pabName + "\t" + localId;
      aNote.addAttachment( [ id, "contact" ] );
    }
  };

  function addAttachments( aNote, anAttachments ) {
    var urls = {}, tmpfile;
    var tmpdir = Cc["@mozilla.org/file/directory_service;1"].getService(
      Ci.nsIProperties ).get( "TmpD", Ci.nsIFile );
    tmpdir.append( Utils.createUUID() );
    tmpdir.createUnique( Ci.nsIFile.DIRECTORY_TYPE, parseInt( "0774", 8 ) );
    for ( var i = 0; i < anAttachments.length; i++ ) {
      tmpfile = tmpdir.clone();
      tmpfile.append( anAttachments[i].name );
      urls[ anAttachments[i].url ] = tmpfile.leafName;
      try {
        // TODO: @see clipper.js :: loadURLToFileEntry()
        Utils.saveURLToFile(
          tmpfile, // file entry
          -1, // file mode
          parseInt( "0644", 8 ), // file permitions
          0x8000, // buffer size
          anAttachments[i].url,
          anAttachments[i].contentType,
          null, // context
          {
            OnStartRunningUrl: function ( aURL, aTotal ) {
            },
            OnStopRunningUrl: function ( aURL, aExitCode ) {
              var url = aURL.spec;
              if ( url in urls ) {
                if ( !aExitCode ) {
                  aNote.addAttachment( [
                    urls[url], "file", tmpdir.path
                  ] );
                } else {
                  log.warn(
                    getString( "main.note.saving.attachments.error" ) +
                    ": " + urls[url] + "\n" +
                    getString( "main.note.loading.error" ) + " " +
                    aExitCode + " " + Utils.getErrorName( aExitCode )
                  );
                }
                delete urls[url];
              }
              if ( !Object.keys( urls ).length && tmpdir.exists() ) {
                try {
                  tmpdir.remove( true );
                } catch ( e ) {
                  log.warn( e + "\n" + Utils.dumpStack() );
                }
              }
            },
            OnProgressUrl: function ( aURL, aCount ) {
            }
          }
        );
      } catch ( e ) {
        delete urls[ anAttachments[i].url ];
        log.warn(
          getString( "main.note.saving.attachments.error" ) +
          ": " + urls[url] + "\n" +
          getString( "main.note.loading.error" ) + " " + e
        );
      }
    }
    if ( !Object.keys( urls ).length && tmpdir.exists() ) {
      try {
        tmpdir.remove( true );
      } catch ( e ) {
        log.warn( e + "\n" + Utils.dumpStack() );
      }
    }
  };

  function saveMessageToNote( aNote, aBody, anAttachments, aContact, aCallback ) {
    var securityManager, codebasePrincipal, domParser, dom;
    var anEntries, aFile, aDirectory, aResultObj;
    aNote.setLoading( true );
    try {
      addAttachments( aNote, anAttachments );
      addContact( aNote, aContact );
      securityManager = Cc["@mozilla.org/scriptsecuritymanager;1"].getService(
        Ci.nsIScriptSecurityManager );
      codebasePrincipal = securityManager.getCodebasePrincipal( aNote.getURI() );
      domParser = Cc["@mozilla.org/xmlextras/domparser;1"].createInstance(
        Ci.nsIDOMParser );
      // TODO: anURI cause message in error console, what principal must be use?
      domParser.init( codebasePrincipal, null /* aNote.getURI() */,
        aNote.getBaseURI(), null );
      dom = domParser.parseFromString( aBody, "text/html" );
      switch( aNote.getType() ) {
        case "application/xhtml+xml":
          anEntries = Utils.getEntriesToSaveContent( ".xhtml", "_files" );
          aFile = anEntries.fileEntry;
          aDirectory = anEntries.directoryEntry;
          aResultObj = { value: null };
          clipper = new ru.akman.znotes.core.Clipper();
          clipper.save(
            dom,
            aResultObj,
            aFile,
            aDirectory,
            /*
            0x00000001 SAVE_SCRIPTS
            0x00000010 SAVE_FRAMES
            0x00000100 SAVE_FRAMES_IN_SEPARATE_DIRECTORY
            0x00001000 PRESERVE_HTML5_TAGS
            0x00010000 SAVE_STYLES
            0x00100000 SAVE_STYLESHEETS_IN_SINGLE_FILE
            0x01000000 SAVE_STYLESHEETS_IN_SEPARATE_FILES
            0x10000000 SAVE_ACTIVE_RULES_ONLY
            */
            0x10010000,
            {
              onLoaderStarted: function( anEvent ) {
              },
              onLoaderStopped: function( anEvent ) {
                try {
                  aNote.loadContentDirectory( aDirectory, true );
                } catch ( e ) {
                  log.warn( e + "\n" + Utils.dumpStack() );
                }
                try {
                  aFile.remove( false );
                } catch ( e ) {
                  log.warn( e + "\n" + Utils.dumpStack() );
                }
                try {
                  aNote.importDocument( aResultObj.value );
                } catch ( e ) {
                  log.warn( e + "\n" + Utils.dumpStack() );
                }
                aNote.setLoading( false );
                if ( aCallback ) {
                  aCallback( aNote );
                }
              }
            }
          );
          break;
        case "text/plain":
          aNote.importDocument( dom );
          aNote.setLoading( false );
          if ( aCallback ) {
            aCallback( aNote );
          }
          break;
      }
    } catch ( e ) {
      log.warn( e + "\n" + Utils.dumpStack() );
      aNote.setLoading( false );
      if ( aCallback ) {
        aCallback( aNote, true );
      }
    }
  };

  // PLATFORM

  var platformShutdownObserver = {
    observe: function( aSubject, aTopic, aData ) {
      Utils.IS_QUIT_ENABLED = true;
      // uncomment this to confirming exiting tb application
      // observerService.notifyObservers( null, "znotes-quit-requested", null );
      if ( Utils.IS_QUIT_ENABLED ) {
        tabMonitor.setActive( false );
        observerService.notifyObservers( null, "znotes-quit-accepted", null );
      }
      aSubject.data = !Utils.IS_QUIT_ENABLED;
    },
    register: function() {
      observerService.addObserver( this, "quit-application-requested", false );
    },
    unregister: function() {
      observerService.removeObserver( this, "quit-application-requested" );
    }
  };

  var mainStartupObserver = {
    observe: function( aSubject, aTopic, aData ) {
      mainWindow = aSubject;
      isMainLoaded = true;
      updateCommands();
    },
    register: function() {
      observerService.addObserver( this, "znotes-main-startup", false );
    },
    unregister: function() {
      observerService.removeObserver( this, "znotes-main-startup" );
    }
  };

  var mainShutdownObserver = {
    observe: function( aSubject, aTopic, aData ) {
      mainWindow = null;
      isMainLoaded = false;
      updateCommands();
    },
    register: function() {
      observerService.addObserver( this, "znotes-main-shutdown", false );
    },
    unregister: function() {
      observerService.removeObserver( this, "znotes-main-shutdown" );
    }
  };

  // PREFERENCES

  var prefsBundleObserver = {
    onPrefChanged: function( event ) {
      switch( event.data.name ) {
        case "platform_shortcuts":
          Utils.PLATFORM_SHORTCUTS = event.data.newValue;
          updateKeyset();
          break;
      }
    },
    register: function() {
      prefsBundle.addObserver( this );
    },
    unregister: function() {
      prefsBundle.removeObserver( this );
    }
  };

  var prefsMozillaObserver = {
    observe: function( subject, topic, data ) {
      switch ( data ) {
        case "debug":
          Utils.IS_DEBUG_ENABLED = this.branch.getBoolPref( "debug" );
          updateCommandsVisibility();
          Common.goUpdateCommand( "znotes_tbtestsuite_command", platformController.getId(), window );
          Common.goUpdateCommand( "znotes_tbconsole_command", platformController.getId(), window );
          break;
      }
    },
    register: function() {
      var prefService = Cc["@mozilla.org/preferences-service;1"].getService(
        Ci.nsIPrefService );
      this.branch = prefService.getBranch( "extensions.znotes.");
      this.branch.addObserver( "", this, false );
    },
    unregister: function() {
      this.branch.removeObserver( "", this );
    }
  };

  // COMMANDS

  var platformCommands = {
    "znotes_tbopenmaintab_command": null,
    "znotes_tbnewbook_command": null,
    "znotes_tbnewnote_command": null,
    "znotes_tbsaveasnote_command": null,
    "znotes_tbopenoptionsdialog_command": null,
    "znotes_tbtestsuite_command": null,
    "znotes_tbconsole_command": null,
    "znotes_tbshowmainmenubar_command": null,
    "znotes_tbshowmaintoolbar_command": null,
    "znotes_tbopenhelp_command": null,
    "znotes_tbopenabout_command": null
  };

  var platformController = {
    supportsCommand: function( cmd ) {
      if ( !( cmd in platformCommands ) ) {
        return false;
      }
      return true;
    },
    isCommandEnabled: function( cmd ) {
      if ( !( cmd in platformCommands ) ) {
        return false;
      }
      if ( !isMainLoaded &&
           cmd !== "znotes_tbopenmaintab_command" &&
           cmd !== "znotes_tbnewbook_command" &&
           cmd !== "znotes_tbsaveasnote_command" ) {
        return false;
      }
      switch ( cmd ) {
        case "znotes_tbopenmaintab_command":
        case "znotes_tbnewbook_command":
          return true;
        case "znotes_tbsaveasnote_command":
          return getNumSelectedMessages() > 0;
        case "znotes_tbnewnote_command":
          return Common.isCommandEnabled( "znotes_newnote_command", null, mainWindow );
        case "znotes_tbopenoptionsdialog_command":
          return Common.isCommandEnabled( "znotes_openoptionsdialog_command", null, mainWindow );
        case "znotes_tbtestsuite_command":
          return Common.isCommandEnabled( "znotes_testsuite_command", null, mainWindow );
        case "znotes_tbconsole_command":
          return Common.isCommandEnabled( "znotes_console_command", null, mainWindow );
        case "znotes_tbshowmainmenubar_command":
          return Common.isCommandEnabled( "znotes_showmainmenubar_command", null, mainWindow );
        case "znotes_tbshowmaintoolbar_command":
          return Common.isCommandEnabled( "znotes_showmaintoolbar_command", null, mainWindow );
        case "znotes_tbopenhelp_command":
          return Common.isCommandEnabled( "znotes_openhelp_command", null, mainWindow );
        case "znotes_tbopenabout_command":
          return Common.isCommandEnabled( "znotes_openabout_command", null, mainWindow );
      }
      return false;
    },
    doCommand: function( cmd ) {
      switch ( cmd ) {
        case "znotes_tbopenmaintab_command":
          doOpenMainWindow();
          break;
        case "znotes_tbnewbook_command":
          doNewBook();
          break;
        case "znotes_tbnewnote_command":
          Utils.switchToMainTab();
          Common.goDoCommand(
            "znotes_newnote_command",
            mainWindow.document.getElementById( "znotes_newnote_command" )
          );
          break;
        case "znotes_tbsaveasnote_command":
          doSaveSelectedMessages();
          break;
        case "znotes_tbopenoptionsdialog_command":
          Common.goDoCommand(
            "znotes_openoptionsdialog_command",
            mainWindow.document.getElementById( "znotes_openoptionsdialog_command" )
          );
          break;
        case "znotes_tbtestsuite_command":
          Common.goDoCommand(
            "znotes_testsuite_command",
            mainWindow.document.getElementById( "znotes_testsuite_command" )
          );
          break;
        case "znotes_tbconsole_command":
          Common.goDoCommand(
            "znotes_console_command",
            mainWindow.document.getElementById( "znotes_console_command" )
          );
          break;
        case "znotes_tbshowmainmenubar_command":
          Common.goDoCommand(
            "znotes_showmainmenubar_command",
            mainWindow.document.getElementById( "znotes_showmainmenubar_command" )
          );
          break;
        case "znotes_tbshowmaintoolbar_command":
          Common.goDoCommand(
            "znotes_showmaintoolbar_command",
            mainWindow.document.getElementById( "znotes_showmaintoolbar_command" )
          );
          break;
        case "znotes_tbopenhelp_command":
          Common.goDoCommand(
            "znotes_openhelp_command",
            mainWindow.document.getElementById( "znotes_openhelp_command" )
          );
          break;
        case "znotes_tbopenabout_command":
          Common.goDoCommand(
            "znotes_openabout_command",
            mainWindow.document.getElementById( "znotes_openabout_command" )
          );
          break;
      }
    },
    onEvent: function( event ) {
    },
    getName: function() {
      return "PLATFORM";
    },
    getCommand: function( cmd ) {
      if ( !( cmd in platformCommands ) ) {
        return null;
      }
      return document.getElementById( cmd );
    },
    updateCommands: function() {
      for ( var cmd in platformCommands ) {
        if ( cmd !== "znotes_tbnewbook_command" ) {
          Common.goUpdateCommand( cmd, this.getId(), window );
        }
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
      for ( var cmd in platformCommands ) {
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

  function updateCommands() {
    platformController.updateCommands();
  };

  function updateCommandsVisibility() {
    Common.goSetCommandHidden( "znotes_tbtestsuite_command",
      !Utils.IS_DEBUG_ENABLED, window );
    Common.goSetCommandHidden( "znotes_tbconsole_command",
      !Utils.IS_DEBUG_ENABLED, window );
  };

  function doNewBook() {
    window.setCursor( "wait" );
    if ( !driverManager ) {
      Cu.import( "resource://znotes/drivermanager.js",
        ru.akman.znotes
      );
      driverManager = ru.akman.znotes.DriverManager.getInstance();
    }
    if ( !bookManager ) {
      Cu.import( "resource://znotes/bookmanager.js",
        ru.akman.znotes.core
      );
      bookManager = ru.akman.znotes.core.BookManager.getInstance();
      bookManager.load();
    }
    var defaultDriver = driverManager.getDefaultDriver();
    var name = getString( "main.book.newName" );
    var index = 0, suffix = "";
    while ( bookManager.exists( name + suffix ) ) {
      suffix = " (" + ++index + ")";
    }
    name += suffix;
    var params = {
      input: {
        name: name,
        description: "",
        driver: defaultDriver.getName(),
        connection: defaultDriver.getParameters()
      },
      output: null
    };
    window.setCursor( "auto" );
    window.openDialog(
      "chrome://znotes/content/book.xul",
      "",
      "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
      params
    ).focus();
    if ( !params.output ) {
      return;
    }
    var newBook = bookManager.createBook( params.output.name );
    newBook.setDescription( params.output.description );
    newBook.setDriver( params.output.driver );
    newBook.setConnection( params.output.connection );
    doOpenMainWindow();
  };

  function doSaveSelectedMessages() {
    var messageURIs = mailWindow.gFolderDisplay.selectedMessageUris;
    if ( !messageURIs ) {
      return;
    }
    window.setCursor( "wait" );
    var ctx = Utils.MAIN_CONTEXT ? Utils.MAIN_CONTEXT() : null;
    var args, arr, index;
    var book = null, category = null;
    if ( !ctx ) {
      if ( !bookManager ) {
        Cu.import( "resource://znotes/bookmanager.js",
          ru.akman.znotes.core
        );
        bookManager = ru.akman.znotes.core.BookManager.getInstance();
        bookManager.load();
      }
      index = bookManager.hasBooks() ? 0 : -1;
      if ( prefsBundle.hasPref( "currentBook" ) ) {
        index = prefsBundle.getIntPref( "currentBook" );
      }
      arr = bookManager.getBooksAsArray();
      if ( index >= 0 && index < arr.length ) {
        book = arr[index];
      }
      if ( book && book.isOpen() ) {
        if ( book.getSelectedTree() === "Tags" ) {
          category = book.getContentTree().getRoot();
        } else {
          index = book.getSelectedCategory();
          arr = book.getContentTree().getRoot()
                                     .getCategoryWithSubcategoriesAsArray();
          if ( index >= 0 && index < arr.length ) {
            category = arr[index];
          }
        }
      }
    } else {
      book = ctx.book;
      category = ( book.getSelectedTree() === "Tags" ?
          book.getContentTree().getRoot() : ctx.category );
    }
    args = {
      input: {
        title: getString(
          "main.note.import.message.title" ),
        aBook: book,
        aCategory: category
      },
      output: null
    };
    window.setCursor( "auto" );
    window.openDialog(
      "chrome://znotes/content/opensavedialog.xul?mode=save&type=category",
      "",
      "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
      args
    ).focus();
    if ( !args.output ) {
      return;
    }
    book = args.output.aBook;
    category = args.output.aCategory;
    doSaveMessages( messageURIs, book, category );
  };

  function saveCallback( aNote, isError ) {
    var name = aNote.getName();
    var id = aNote.getBook().getId() + "&" + aNote.getId();
    if ( isError ) {
      Utils.showPopup(
        "chrome://znotes_images/skin/warning-32x32.png",
        getString( "main.note.loading.fail" ),
        name,
        true,
        id,
        0,
        null,
        null,
        null,
        alertObserver
      );
    } else {
      Utils.showPopup(
        "chrome://znotes_images/skin/message-32x32.png",
        getString( "main.note.loading.success" ),
        name,
        true,
        id,
        0,
        null,
        null,
        null,
        alertObserver
      );
    }
  };

  function doSaveMessages( uris, book, category ) {
    if ( Utils.IS_STANDALONE ) {
      return null;
    }
    var msgService, msgHdr, mailWindow = Utils.getMail3PaneWindow();
    var note, uri, contentType, contentData;
    var textBodies, htmlBodies, contact, attachments, author, subject;
    for ( var i = 0; i < uris.length; i++ ) {
      uri = uris[i];
      msgService = mailWindow.messenger.messageServiceFromURI( uri );
      msgHdr = msgService.messageURIToMsgHdr( uri );
      Mime.MsgHdrToMimeMessage( msgHdr, null, function( aMsgHdr, aMimeMsg ) {
        author = aMsgHdr.mime2DecodedAuthor;
        subject = aMsgHdr.mime2DecodedSubject;
        if ( aMsgHdr.flags & Ci.nsMsgMessageFlags.HasRe ) {
          subject = subject ? "Re: " + subject : "Re: ";
        }
        if ( !subject ) {
          subject = "no subject";
        }
        textBodies = [], htmlBodies = [];
        processMessagePart( aMimeMsg, textBodies, htmlBodies );
        contact = getContactByEmail( getEmail( author ) );
        attachments = aMimeMsg.allAttachments;
        if ( htmlBodies.length || textBodies.length ) {
          contentType = htmlBodies.length ?
            "application/xhtml+xml" : "text/plain";
          contentData = htmlBodies.length ?
            htmlBodies.join( "" ) : textBodies.join( "" );
          note = createNote(
            book,
            category,
            getValidNoteName( category, subject, contentType ),
            contentType
          );
          saveMessageToNote(
            note,
            contentData,
            attachments,
            contact,
            saveCallback
          );
        }
      } );
    }
  };

  function doOpenMainWindow( background ) {
    if ( mainWindow ) {
      Utils.switchToMainTab();
    } else {
      sessionManager.init();
      var persistedState = sessionManager.getPersistedState();
      if ( persistedState.tabs.length > 0 ) {
        Utils.openMainTab( !background, persistedState );
      } else {
        Utils.openMainTab( !background, null );
      }
    }
  };

  // FOLDER & THREAD TREE

  function getNumSelectedMessages() {
    return mailWindow.gDBView ? mailWindow.gDBView.numSelected : 0;
  };

  function onMessengerEvent( event ) {
    try {
      Common.goUpdateCommand( "znotes_tbsaveasnote_command",
        platformController.getId(), window );
    } catch ( e ) {
      log.warn( e + "\n" + Utils.dumpStack() );
    }
  };

  // SHORTCUTS

  function setupKeyset() {
    keySet = new ru.akman.znotes.Keyset(
      document.getElementById( "znotes_platform_keyset" )
    );
  };

  function updateKeyset() {
    var element, shortcuts = {};
    try {
      shortcuts = JSON.parse( Utils.PLATFORM_SHORTCUTS );
      if ( typeof( shortcuts ) !== "object" ) {
        shortcuts = {};
      }
    } catch ( e ) {
      log.warn( e + "\n" + Utils.dumpStack() );
      shortcuts = {};
    }
    keySet.update( shortcuts );
    element = document.getElementById( "mail-menubar" );
    if ( element ) {
      Utils.updateKeyAttribute( element );
    }
    element = document.getElementById( "appmenuPrimaryPane" );
    if ( element ) {
      Utils.updateKeyAttribute( element );
    }
    element = document.getElementById( "appmenuSecondaryPane" );
    if ( element ) {
      Utils.updateKeyAttribute( element );
    }
    element = document.getElementById( "mailContext" );
    if ( element ) {
      Utils.updateKeyAttribute( element );
    }
    element = document.getElementById( "button-newMsgPopup" );
    if ( element ) {
      Utils.updateKeyAttribute( element );
    }
  };

  // TABS

  function setupTabs() {
    var tabMail = Utils.getTabMail();
    if ( !tabMail ) {
      return;
    }
    tabMail.registerTabType( ru.akman.znotes.MainTabType );
    tabMail.registerTabType( ru.akman.znotes.ContentTabType );
    tabMail.registerTabType( ru.akman.znotes.InfoTabType );
    tabMail.registerTabMonitor( tabMonitor );
  };

  // PERSISTING STATE

  function getState() {
    var state = {
      open: false,
      active: false
    };
    if ( !prefsBundle.hasPref( "isOpened" ) ) {
      prefsBundle.setBoolPref( "isOpened", false );
    } else {
      state.open = prefsBundle.getBoolPref( "isOpened" );
    }
    if ( !prefsBundle.hasPref( "isActive" ) ) {
      prefsBundle.setBoolPref( "isActive", false );
    } else {
      state.active = prefsBundle.getBoolPref( "isActive" );
    }
    return state;
  };

  // INIT

  function addMessengerListeners() {
    folderTree = mailWindow.document.getElementById( "folderTree" );
    threadTree = mailWindow.document.getElementById( "threadTree" );
    folderTree.addEventListener( "select", onMessengerEvent, false );
    threadTree.addEventListener( "select", onMessengerEvent, false );
    folderTree.addEventListener( "focus", onMessengerEvent, false );
    folderTree.addEventListener( "blur", onMessengerEvent, false );
    threadTree.addEventListener( "focus", onMessengerEvent, false );
    threadTree.addEventListener( "blur", onMessengerEvent, false );
  };

  function fixupMessengerOverlay() {
    var button, name, names = [
      "znotes_tbopenmaintab",
      "znotes_tbsaveasnote"
    ];
    for each ( name in names ) {
      button = mailWindow.document.getElementById( name + "_button" );
      if ( button ) {
        button.classList.add( "toolbarbutton-1" );
        button.classList.add( name + "_class" );
      }
    }
  };

  function init() {
    Utils.initGlobals();
    mailWindow = Utils.getMail3PaneWindow();
    mailWindow.addEventListener( "close", ru.akman.znotes.ZNotes.close, false );
    prefsBundle.loadPrefs();
    mainWindowState = getState();
    fixupMessengerOverlay();
    setupTabs();
    setupKeyset();
    updateKeyset();
    setupAlertObserver();
    platformController.register();
    prefsBundleObserver.register();
    prefsMozillaObserver.register();
    platformShutdownObserver.register();
    mainStartupObserver.register();
    mainShutdownObserver.register();
    updateCommandsVisibility();
    if ( mainWindowState.open ) {
      doOpenMainWindow( !mainWindowState.active );
    } else {
      if ( prefsBundle.getCharPref( "version" ) != Utils.VERSION ) {
        prefsBundle.setCharPref( "version", Utils.VERSION );
        Utils.showNewVersionInfo( "maximized" );
      }
    }
    addMessengerListeners();
  };

  // PUBLIC

  pub.load = function( event ) {
    window.removeEventListener( "load", ru.akman.znotes.ZNotes.load, false );
    init();
  };

  pub.close = function( event ) {
    Utils.IS_QUIT_ENABLED = true;
    // uncomment this to enable confirm when closing tb window
    // observerService.notifyObservers( null, "znotes-quit-requested", null );
    if ( !Utils.IS_QUIT_ENABLED ) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
    tabMonitor.setActive( false );
    observerService.notifyObservers( null, "znotes-quit-accepted", null );
    return true;
  };

  return pub;

}();

window.addEventListener( "load", ru.akman.znotes.ZNotes.load, false );
