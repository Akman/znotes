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

Components.utils.import( "resource://znotes/utils.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/event.js",
  ru.akman.znotes.core
);
Components.utils.import( "resource://znotes/tabmonitor.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/prefsmanager.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/sessionmanager.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/keyset.js",
  ru.akman.znotes
);

ru.akman.znotes.ZNotes = function() {

  var pub = {};

  var observerService =
    Components.classes["@mozilla.org/observer-service;1"]
              .getService( Components.interfaces.nsIObserverService );
  
  var alertsService =
    Components.classes['@mozilla.org/alerts-service;1']
              .getService( Components.interfaces.nsIAlertsService );
  
  var Utils = ru.akman.znotes.Utils;
  var Common = ru.akman.znotes.Common;

  var prefsBundle = ru.akman.znotes.PrefsManager.getInstance();
  var sessionManager = ru.akman.znotes.SessionManager.getInstance();
  var tabMonitor = ru.akman.znotes.TabMonitor.getInstance();
  
  var bookManager = null;
  var driverManager = null;
  
  var mailWindow = null;
  var folderTree = null;
  var threadTree = null;
  
  var keySet = null;
  var isMainLoaded = false;
  var mainWindow = null;
  var mainWindowState = null;
  
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
          Common.goSetCommandHidden( "znotes_tbtestsuite_command",
            !Utils.IS_DEBUG_ENABLED, window );
          Common.goUpdateCommand( "znotes_tbtestsuite_command", platformController.getId(), window );
          Common.goSetCommandHidden( "znotes_tbconsole_command",
            !Utils.IS_DEBUG_ENABLED, window );
          Common.goUpdateCommand( "znotes_tbconsole_command", platformController.getId(), window );
          break;
        case "sanitize":
          Utils.IS_SANITIZE_ENABLED = this.branch.getBoolPref( "sanitize" );
          break;
      }
    },
    register: function() {
      var prefService =
        Components.classes["@mozilla.org/preferences-service;1"]
                  .getService( Components.interfaces.nsIPrefService );
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
          /*
          return ( getNumSelectedMessages() > 0 ) &&
                 Common.isCommandEnabled( "znotes_newnote_command", null, mainWindow );
          */
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
          Common.goDoCommand(
            "znotes_newnote_command",
            mainWindow.document.getElementById( "znotes_newnote_command" )
          );
          break;
        case "znotes_tbsaveasnote_command":
          doSaveMessages();
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
        Components.utils.reportError(
          "An error occurred registering '" + this.getName() +
          "' controller: " + e
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
        Components.utils.reportError(
          "An error occurred unregistering '" + this.getName() +
          "' controller: " + e
        );
      }
    }
  };
  
  function updateCommands() {
    platformController.updateCommands();
  };

  function updateCommandsVisibility() {
    Common.goSetCommandHidden( "znotes_tbtestsuite_command", !Utils.IS_DEBUG_ENABLED, window );
    Common.goSetCommandHidden( "znotes_tbconsole_command", !Utils.IS_DEBUG_ENABLED, window );
  };

  function doNewBook() {
    if ( !driverManager ) {
      Components.utils.import( "resource://znotes/drivermanager.js",
        ru.akman.znotes
      );
      driverManager = ru.akman.znotes.DriverManager.getInstance();
    }
    if ( !bookManager ) {
      Components.utils.import( "resource://znotes/bookmanager.js",
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
  
  function doSaveMessages() {
    var messageURIs = mailWindow.gFolderDisplay.selectedMessageUris;
    if ( !messageURIs ) {
      return;
    }
    var ctx = Utils.MAIN_CONTEXT ? Utils.MAIN_CONTEXT() : null;
    var arr, index;
    var book = null, category = null;
    if ( !ctx ) {
      if ( !bookManager ) {
        Components.utils.import( "resource://znotes/bookmanager.js",
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
    var args = {
      input: {
        title: getString(
          "main.note.import.message.title" ),
        aBook: book,
        aCategory: category
      },
      output: null
    };
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
    for ( var i = 0; i < messageURIs.length; i++ ) {
      doSaveMessage( messageURIs[i], book, category );
    }
    if ( isMainLoaded ) {
      Utils.switchToMainTab();
    }
  };

  function notifySaveMessage( note ) {
    var ids = note.getBook().getId() + "&" + note.getId();
    alertsService.showAlertNotification(
      "chrome://znotes_images/skin/message-32x32.png",
      getString( "main.note.loading.success" ),
      note.getName(),
      true,
      ids,
      {
        observe: function( subject, topic, data ) {
          switch ( topic ) {
            case "alertclickcallback":
              if ( !isMainLoaded ) {
                doOpenMainWindow();
              }
              break;
          }
        }
      }      
    );
    if ( !isMainLoaded ) {
      return;
    }
    var params = Common.createCommandParamsObject();
    if ( !params ) {
      return;
    }
    params.setStringValue( "id", ids );
    Common.goDoCommandWithParams(
      "znotes_savemessage_command",
      params,
      mainWindow.document.getElementById( "znotes_dummy_command" )
    );
  };
  
  function doSaveMessage( uri, book, category ) {
    if ( Utils.IS_STANDALONE ) {
      return null;
    }
    var note = null;
    var MIME = {};
    Components.utils.import( "resource://app/modules/gloda/mimemsg.js", MIME );
    var mailWindow = Utils.getMail3PaneWindow();
    var gFolderDisplay = mailWindow.gFolderDisplay;
    var messenger = mailWindow.messenger;
    var msgService = messenger.messageServiceFromURI( uri );
    var msgHdr = msgService.messageURIToMsgHdr( uri );
    var subject = msgHdr.mime2DecodedSubject;
    if ( msgHdr.flags & Components.interfaces.nsMsgMessageFlags.HasRe ) {
      subject = ( subject ) ? "Re: " + subject : "Re: ";
    }
    //
    var author = msgHdr.mime2DecodedAuthor;
    var directory, dir, card, cards, contact = null;
    /**
     * How to Find or Validate an Email Address
     * @author Jan Goyvaerts
     * @see http://www.regular-expressions.info/email.html
     */
    var authorEmail = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b/i.exec(
      author )[0];
    var abManager =
      Components.classes["@mozilla.org/abmanager;1"]
                .getService( Components.interfaces.nsIAbManager );
    var directories = abManager.directories;
    while ( !contact && directories.hasMoreElements() ) {
      dir = directories.getNext().QueryInterface(
        Components.interfaces.nsIAbDirectory );
      if ( dir instanceof Components.interfaces.nsIAbDirectory ) {
        cards = dir.childCards;
        while ( cards.hasMoreElements() ) {
          card = cards.getNext()
                      .QueryInterface( Components.interfaces.nsIAbCard );
          if ( card instanceof Components.interfaces.nsIAbCard ) {
            if ( card.primaryEmail && card.primaryEmail == authorEmail ) {
              contact = card;
              break;
            }
          }
        }
      }
    }
    // *************************************************************************
    var htmlBodies = [];
    var textBodies = [];
    var attachments = null;
    var process = function( part ) {
      /**
       * MimeMessage || MimeUnknown || MimeContainer
       * @parts [] The list of the MIME part children of this message
       * @contentType The content type of this part
       */
      if ( part instanceof MIME.MimeMessage ||
           part instanceof MIME.MimeUnknown ||
           part instanceof MIME.MimeContainer ) {
        for ( var i = 0; i < part.parts.length; i++ ) {
          process( part.parts[i] );
        }
        return;
      }
      /**
       * MimeBody
       * @body The actual body content
       * @contentType The content type of this part
       */
      if ( part instanceof MIME.MimeBody ) {
        if ( part.contentType == "text/plain" ) {
          textBodies.push( part.body );
        } else {
          htmlBodies.push( part.body );
        }
        return;
      }
      /**
       * MimeMessageAttachment
       * @name The filename of this attachment
       * @contentType The MIME content type of this part
       * @url The URL to stream if you want the contents of this part
       * @isExternal Is the attachment stored someplace else than in the message?
       */
      if ( part instanceof MIME.MimeMessageAttachment ) {
        return;
      }
    };
    var setAuthor = function( aNote ) {
      if ( !contact ) {
        return;
      }
      var directoryId = contact.directoryId;
      var localId = contact.localId;
      pabName = directoryId.substring( 0, directoryId.indexOf( "&" ) );
      var id = pabName + "\t" + localId;
      aNote.addAttachment( [ id, "contact" ] );
    };
    var setAttachments = function( aNote ) {
      var tmpfile, tmpdir =
        Components.classes["@mozilla.org/file/directory_service;1"]
                  .getService( Components.interfaces.nsIProperties )
                  .get( "TmpD", Components.interfaces.nsIFile );
      tmpdir.append( Utils.createUUID() );
      tmpdir.createUnique(
        Components.interfaces.nsIFile.DIRECTORY_TYPE,
        parseInt( "0774", 8 )
      );
      var urls = {};
      var urlListener = {
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
              Components.utils.reportError(
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
              //Utils.log( e );
            }
          }
        },
        OnProgressUrl: function ( aURL, aCount ) {
        }
      };
      for ( var i = 0; i < attachments.length; i++ ) {
        tmpfile = tmpdir.clone();
        tmpfile.append( attachments[i].name );
        urls[ attachments[i].url ] = tmpfile.leafName;
        try {
          Utils.saveURLToFile(
            tmpfile, // file entry
            -1, // file mode
            parseInt( "0644", 8 ), // file permitions
            0x8000, // buffer size
            attachments[i].url,
            attachments[i].contentType,
            null, // context
            urlListener
          );
          /*
          This method used the download manager UI ...
          messenger.saveAttachmentToFile(
            tmpfile,
            attachments[i].url,
            uri, 
            attachments[i].contentType,
            urlListener
          );
          */
        } catch ( e ) {
          delete urls[ attachments[i].url ];
          Components.utils.reportError(
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
          //Utils.log( e );
        }
      }
    };
    // *************************************************************************
    var mimeCallback = function( aMsgHdr, aMimeMsg ) {
      if ( !aMimeMsg ) {
        return;
      }
      process( aMimeMsg );
      attachments = aMimeMsg.allAttachments;
      var aName, aType, aPrincipal;
      var row;
      if ( textBodies.length ) {
        aType = "text/plain";
        aName = getValidNoteName( category, subject, aType );
        try {
          note = createNote( book, category, aName, aType );
          note.importDocument( textBodies.join( "" ) );
          setAttachments( note );
          setAuthor( note );
          notifySaveMessage( note );
        } catch ( e ) {
          note = null;
          Utils.log( e );
        }
      }
      if ( htmlBodies.length ) {
        aType = "application/xhtml+xml";
        aName = getValidNoteName( category, subject, aType );
        try {
          note = createNote( book, category, aName, aType );
          var securityManager =
            Components.classes["@mozilla.org/scriptsecuritymanager;1"]
                      .getService( Components.interfaces.nsIScriptSecurityManager );
          // TODO: ? getCodebasePrincipal
          aPrincipal = securityManager.getCodebasePrincipal( note.getURI() );
          var domParser =
            Components.classes["@mozilla.org/xmlextras/domparser;1"]
                      .createInstance( Components.interfaces.nsIDOMParser );
          domParser.init( aPrincipal, null /* note.getURI() */, note.getBaseURI(), null );
          var htmlDOM =
            domParser.parseFromString( htmlBodies.join( "" ), "text/html" );
          note.importDocument( htmlDOM );
          setAttachments( note );
          setAuthor( note );
          notifySaveMessage( note );
        } catch ( e ) {
          note = null;
          Utils.log( e );
        }
      }
    };
    MIME.MsgHdrToMimeMessage( msgHdr, null, mimeCallback );
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
  
  function onMessengerFocus( event ) {
    Common.goUpdateCommand( "znotes_tbsaveasnote_command", platformController.getId(), window );
  };

  // SHORTCUTS

  function setupKeyset() {
    keySet = new ru.akman.znotes.Keyset(
      document.getElementById( "znotes_platform_keyset" )
    );
  };

  function updateKeyset() {
    var shortcuts = {};
    try {
      shortcuts = JSON.parse( Utils.PLATFORM_SHORTCUTS );
      if ( typeof( shortcuts ) !== "object" ) {
        shortcuts = {};
      }
    } catch ( e ) {
      Utils.log( e );
      shortcuts = {};
    }
    keySet.update( shortcuts );
    Utils.updateKeyAttribute(
      document.getElementById( "mail-menubar" ) );
    Utils.updateKeyAttribute(
      document.getElementById( "appmenuPrimaryPane" ) );
    Utils.updateKeyAttribute(
      document.getElementById( "appmenuSecondaryPane" ) );
    Utils.updateKeyAttribute(
      document.getElementById( "mailContext" ) );
    var button_newMsgPopup = document.getElementById( "button-newMsgPopup" );
    if ( button_newMsgPopup ) {
      Utils.updateKeyAttribute( button_newMsgPopup );
    }
  };
  
  // TABS
  
  function setupTabs() {
    var tabMail = ru.akman.znotes.Utils.getTabMail();
    if ( !tabMail ) {
      return;
    }
    tabMail.registerTabType( ru.akman.znotes.MainTabType );
    tabMail.registerTabType( ru.akman.znotes.ContentTabType );
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
    folderTree.addEventListener( "focus", onMessengerFocus, false );
    folderTree.addEventListener( "blur", onMessengerFocus, false );
    threadTree.addEventListener( "focus", onMessengerFocus, false );
    threadTree.addEventListener( "blur", onMessengerFocus, false );
  };
  
  function init() {
    Utils.initGlobals();
    mailWindow = Utils.getMail3PaneWindow();
    mailWindow.addEventListener( "close", ru.akman.znotes.ZNotes.close, false );
    prefsBundle.loadPrefs();
    mainWindowState = getState();
    addMessengerListeners();
  };
  
  // PUBLIC

  pub.load = function( event ) {
    window.removeEventListener( "load", ru.akman.znotes.ZNotes.load, false );
    init();
    setupTabs();
    setupKeyset();
    updateKeyset();
    platformController.register();
    prefsBundleObserver.register();
    prefsMozillaObserver.register();
    platformShutdownObserver.register();
    mainStartupObserver.register();
    mainShutdownObserver.register();
    updateCommandsVisibility();
    if ( mainWindowState.open ) {
      doOpenMainWindow( !mainWindowState.active );
    }
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
