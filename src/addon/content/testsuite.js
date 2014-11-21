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

Cu.import( "resource://znotes/utils.js" , ru.akman.znotes );
Cu.import( "resource://znotes/domutils.js" , ru.akman.znotes );
Cu.import( "resource://znotes/updatemanager.js" , ru.akman.znotes );
Cu.import( "resource://znotes/cssutils.js" , ru.akman.znotes );

ru.akman.znotes.TestSuite = function() {

  var pub = {};

  var Utils = ru.akman.znotes.Utils;
  var DOMUtils = ru.akman.znotes.DOMUtils;
  var CSSUtils = ru.akman.znotes.CSSUtils;

  var log = Utils.getLogger( "content.testsuite" );
  var loggerLevel = Utils.LOGGER_LEVEL;

  var mozPrefs =
    Cc["@mozilla.org/preferences-service;1"].getService( Ci.nsIPrefBranch );

  var consoleService =
    Cc["@mozilla.org/consoleservice;1"].getService( Ci.nsIConsoleService );

  var consoleObserver = {
    observe: function( aMessage ) {
      var message = aMessage instanceof Ci.nsIScriptError ?
        aMessage.errorMessage : aMessage.message;
      for ( var i = 0; i < 3; i++ ) {
        message = message.replace( /[^\s]+\s+/, "" );
      }
      testTextBox.value += message + "\n";
    },
    register: function() {
      consoleService.registerListener( this );
    },
    unregister: function() {
      consoleService.unregisterListener( this );
    }
  };

  var testTextBox = null;
  var alwaysRaisedButton = null;
  var ctx = null;
  var tests = [];

  function testCommand( event ) {
    var testIndex = parseInt( event.target.value );
    var delimiter = "========" +
                    new Array( tests[testIndex].name.length + 1 ).join( "=" );
    var header = tests[testIndex].name;
    log.trace( header );
    log.trace( delimiter );
    try {
      ctx = Utils.MAIN_CONTEXT();
      tests[testIndex].code( event );
    } catch ( e ) {
      log.warn( e );
    }
    log.trace( delimiter );
  };

  pub.onLoad = function( event ) {
    testTextBox = document.getElementById( "testTextBox" );
    consoleObserver.register();
    Utils.LOGGER_LEVEL = "ALL";
    Utils.IS_TEST_ACTIVE = true;
    mozPrefs.setBoolPref( "extensions.znotes.test.active", true );
    alwaysRaisedButton = document.getElementById( "alwaysRaisedButton" );
    alwaysRaisedButton.checked = Utils.IS_TEST_RAISED;
    pub.alwaysRaised();
  };

  pub.onClose = function( event ) {
    Utils.LOGGER_LEVEL = loggerLevel;
    Utils.IS_TEST_ACTIVE = false;
    mozPrefs.setBoolPref( "extensions.znotes.test.active", false );
  };

  pub.onUnload = function( event ) {
    consoleObserver.unregister();
  };

  pub.clearTestView = function( event ) {
    testTextBox.value = "";
    return true;
  };

  pub.execTest = function( event ) {
    var testMenu = document.getElementById( "testMenu" );
    while ( testMenu.firstChild ) {
      testMenu.removeChild( testMenu.firstChild );
    }
    for ( var i = 0; i < tests.length; i++ ) {
      var test = tests[i];
      var menuItem = document.createElement( "menuitem" );
      menuItem.className = "menuitem-iconic testmenuitem";
      menuItem.setAttribute( "value", i );
      menuItem.setAttribute( "label", test.name );
      menuItem.setAttribute( "tooltiptext", test.description );
      menuItem.addEventListener( "command", testCommand, false );
      testMenu.appendChild( menuItem );
    }
    var execTestButton = document.getElementById( "execTestButton" );
    testMenu.openPopup(
      execTestButton,
      "end_before",
      null,
      null,
      false,
      true,
      event
    );
    return true;
  };

  pub.alwaysRaised = function( event ) {
    var xulWin = window.QueryInterface( Ci.nsIInterfaceRequestor )
                       .getInterface( Ci.nsIWebNavigation )
                       .QueryInterface( Ci.nsIDocShellTreeItem ).treeOwner
                       .QueryInterface( Ci.nsIInterfaceRequestor)
                       .getInterface( Ci.nsIXULWindow );
    var value = alwaysRaisedButton.checked
    Utils.IS_TEST_RAISED = value;
    mozPrefs.setBoolPref( "extensions.znotes.test.raised", value );
    value = value ? xulWin.raisedZ : xulWin.normalZ;
    window.setTimeout(
      function() {
        xulWin.zLevel = value;
      },
      0
    );
    return true;
  };

  /****************************************************************************/

  tests.push(
    {
      name: "Locales",
      description: "Get system, application and user agent locales",
      code: function () {
        var chromeRegistry = Cc ["@mozilla.org/chrome/chrome-registry;1"]
                                       .getService( Ci.nsIXULChromeRegistry );
        var cl3 = chromeRegistry.getSelectedLocale( "znotes" );

        var localeService = Cc["@mozilla.org/intl/nslocaleservice;1"]
                                      .getService( Ci.nsILocaleService );
        var cl0 = localeService.getSystemLocale().getCategory( "NSILOCALE_CTYPE" );
        var cl1 = localeService.getApplicationLocale().getCategory( "NSILOCALE_CTYPE" );
        var cl2 = localeService.getLocaleComponentForUserAgent();

        log.trace( "selected: " + cl3 );
        log.trace( "system: " + cl0 );
        log.trace( "application: " + cl1 );
        log.trace( "useragent: " + cl2 );
        log.trace( "languages: " + Utils.LANGUAGES.join( ", " ) );

      }
    }
  );

  tests.push(
    {
      name: "Note's getId()",
      description: "Get ID of the current note",
      code: function () {
        if ( !ctx.note ) {
          return;
        }
        log.trace( ctx.note.getId() );
      }
    }
  );

  tests.push(
    {
      name: "Note's getURI() & getBaseURI()",
      description: "Get URIs of the current note",
      code: function () {
        if ( !ctx.note ) {
          return;
        }
        var designFrame = ctx.document.getElementById( "designEditor" );
        log.trace( "getBaseURI() :: " + decodeURIComponent( ctx.note.getBaseURI().spec ) );
        log.trace( "getURI() :: " + decodeURIComponent( ctx.note.getURI().spec ) );
        log.trace( "BaseURI :: " + decodeURIComponent( designFrame.contentDocument.baseURIObject.spec ) );
        log.trace( "DocumentURI :: " + decodeURIComponent( designFrame.contentDocument.documentURIObject.spec ) );
      }
    }
  );

  tests.push(
    {
      name: "Welcome",
      description: "Create welcome note",
      code: function () {
        var note = ctx.createWelcomeNote( ctx.book );
        log.trace( "\n" + note.toString() );
      }
    }
  );

  tests.push(
    {
      name: "Info",
      description: "Get application info",
      code: function () {
        log.trace( "ID :: "  + Utils.ID );
        log.trace( "BUNDLE :: "  + Utils.BUNDLE );
        log.trace( "NAME :: "  + Utils.NAME );
        log.trace( "VENDOR :: "  + Utils.VENDOR );
        log.trace( "VERSION :: "  + Utils.VERSION );
        log.trace( "BUILD :: "  + Utils.BUILD );
        log.trace( "LANGUAGES :: "  + Utils.LANGUAGES );
        log.trace( "SITE :: "  + Utils.SITE );
        log.trace( "SITE_LANGUAGES :: "  + Utils.SITE_LANGUAGES );
        log.trace( "TITLE :: "  + Utils.decodeUTF8( Utils.TITLE ) );
        log.trace( "DESCRIPTION :: "  + Utils.decodeUTF8( Utils.DESCRIPTION ) );
        log.trace( "LICENSES" );
        for ( var i = 0; i < Utils.LICENSES.length; i++ ) {
          var license = Utils.LICENSES[i];
          log.trace( "[" + (i+1) + "] name = " + license.name );
          log.trace( "[" + (i+1) + "] link = " + license.link );
        }
        log.trace( "REPOSITORIES" );
        for ( var i = 0; i < Utils.REPOSITORIES.length; i++ ) {
          var repository = Utils.REPOSITORIES[i];
          log.trace( "[" + (i+1) + "] name = " + repository.name );
          log.trace( "[" + (i+1) + "] link = " + repository.link );
        }
        log.trace( "CREATORS" );
        for ( var i = 0; i < Utils.CREATORS.length; i++ ) {
          var creator = Utils.CREATORS[i];
          log.trace( "[" + (i+1) + "] name = " + Utils.decodeUTF8( creator.name ) );
          log.trace( "[" + (i+1) + "] link = " + creator.link );
        }
        log.trace( "CONTRIBUTORS" );
        for ( var i = 0; i < Utils.CONTRIBUTORS.length; i++ ) {
          var contributor = Utils.CONTRIBUTORS[i];
          log.trace( "[" + (i+1) + "] name = " + Utils.decodeUTF8( contributor.name ) );
          log.trace( "[" + (i+1) + "] title = " + Utils.decodeUTF8( contributor.title ) );
          log.trace( "[" + (i+1) + "] description = " + Utils.decodeUTF8( contributor.description ) );
          log.trace( "[" + (i+1) + "] link = " + contributor.link );
          log.trace( "  LICENSES" );
          for ( var j = 0; j < contributor.licenses.length; j++ ) {
            log.trace( "  [" + (j+1) + "] name = " + Utils.decodeUTF8( contributor.licenses[j].name ) );
            log.trace( "  [" + (j+1) + "] link = " + contributor.licenses[j].link );
          }
        }
        log.trace( "CREDITS" );
        for ( var i = 0; i < Utils.CREDITS.length; i++ ) {
          var credit = Utils.CREDITS[i];
          log.trace( "[" + (i+1) + "] name = " + Utils.decodeUTF8( credit.name ) );
          log.trace( "[" + (i+1) + "] title = " + Utils.decodeUTF8( credit.title ) );
          log.trace( "[" + (i+1) + "] description = " + Utils.decodeUTF8( credit.description ) );
          log.trace( "[" + (i+1) + "] link = " + credit.link );
          log.trace( "  LICENSES" );
          for ( var j = 0; j < credit.licenses.length; j++ ) {
            log.trace( "  [" + (j+1) + "] name = " + Utils.decodeUTF8( credit.licenses[j].name ) );
            log.trace( "  [" + (j+1) + "] link = " + credit.licenses[j].link );
          }
        }
        log.trace( "TRANSLATORS" );
        for ( var i = 0; i < Utils.TRANSLATORS.length; i++ ) {
          var translator = Utils.TRANSLATORS[i];
          log.trace( "[" + (i+1) + "] name = " + Utils.decodeUTF8( translator.name ) );
          log.trace( "[" + (i+1) + "] link = " + translator.link );
        }
        log.trace( "COPYRIGHTS" );
        for ( var i = 0; i < Utils.COPYRIGHTS.length; i++ ) {
          var copyright = Utils.COPYRIGHTS[i];
          log.trace( "[" + (i+1) + "] prefix = " + Utils.decodeUTF8( copyright.prefix ) );
          log.trace( "[" + (i+1) + "] year = " + copyright.year );
          log.trace( "[" + (i+1) + "] author = " + Utils.decodeUTF8( copyright.author ) );
          log.trace( "[" + (i+1) + "] reserved = " + Utils.decodeUTF8( copyright.reserved ) );
        }
        log.trace( "URLS" );
        log.trace( "index = " + Utils.SITE + Utils.URLS.index );
        log.trace( "forum = " + Utils.SITE + Utils.URLS.forum );
        //
        log.trace( "VARS" );
        log.trace( "IS_SANITIZE_ENABLED: " + !!Utils.IS_SANITIZE_ENABLED );
        log.trace( "IS_AD_ENABLED: " + !!Utils.IS_AD_ENABLED );
        log.trace( "IS_DEBUG_ENABLED: " + !!Utils.IS_DEBUG_ENABLED );
      }
    }
  );

  tests.push(
    {
      name: "Contact",
      description: "Get contact info",
      code: function () {
        var params = {
          input: {
          },
          output: null
        };
        ctx.window.openDialog(
          "chrome://znotes/content/abpicker.xul",
          "",
          "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
          params
        ).focus();
        if ( params.output && params.output.cards.length > 0 ) {
          for ( var i = 0; i < params.output.cards.length; i++ ) {
            var card = params.output.cards[i];
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
              var property = properties.getNext().QueryInterface( Ci.nsIProperty );
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
            log.trace( "\n" + json );
          }
        }
      }
    }
  );

  tests.push(
    {
      name: "Chrome URI to path",
      description: "Get chrome URI as file path",
      code: function () {
        var chromeURL = "chrome://global/locale/viewSource.dtd";
        var ios = Cc["@mozilla.org/network/io-service;1"]
                            .getService( Ci.nsIIOService );
        var fph = ios.getProtocolHandler( "file" )
                     .QueryInterface( Ci.nsIFileProtocolHandler );
        var chr = Cc["@mozilla.org/chrome/chrome-registry;1"]
                            .getService(Ci.nsIChromeRegistry);
        var uri = ios.newURI( chromeURL, null, null );
        var file = fph.getFileFromURLSpec( chr.convertChromeURL( uri ).spec ).clone();
        log.trace( chromeURL );
        log.trace( file.path );
      }
    }
  );

  tests.push(
    {
      name: "Driver path",
      description: "Get driver path",
      code: function () {
        var ios = Cc["@mozilla.org/network/io-service;1"]
                            .getService( Ci.nsIIOService );
        var fph = ios.getProtocolHandler( "file" )
                     .QueryInterface( Ci.nsIFileProtocolHandler );
        var chr = Cc["@mozilla.org/chrome/chrome-registry;1"]
                            .getService(Ci.nsIChromeRegistry);
        var uri = ios.newURI( "chrome://znotes_drivers/content/filename.js", null, null );
        var dir = fph.getFileFromURLSpec( chr.convertChromeURL( uri ).spec ).parent.clone();
        log.trace( dir.path );
      }
    }
  );

  tests.push(
    {
      name: "DOM",
      description: "Create DOM",
      code: function () {
        var defaultNS = 'http://www.w3.org/1999/xhtml';
        var impl = ctx.window.document.implementation;
        var dom = impl.createDocument(
          defaultNS,
          'html',
          impl.createDocumentType( 'html', '', '' )
        );
        dom.documentElement.appendChild(
          dom.createElementNS( defaultNS, 'head' )
        );
        dom.documentElement.appendChild(
          dom.createElementNS( defaultNS, 'body' )
        );
        var serializer = Cc["@mozilla.org/xmlextras/xmlserializer;1"]
                                   .createInstance( Ci.nsIDOMSerializer );
        log.trace( "\n" +
          '<?xml version="1.0" encoding="UTF-8"?>\n' +
          serializer.serializeToString( dom ) );
      }
    }
  );

  tests.push( {
    name: "Validate name",
    description: "Validate note name",
    code: function () {
      function getValidNoteName( category, name, aType ) {
        var index = 0, suffix = "";
        while ( !category.canCreateNote( name + suffix, aType ) ) {
          suffix = " (" + ++index + ")";
        }
        return name + suffix;
      };
      var book = ctx.book;
      var category = ctx.category;
      var params = [
        { name: "abc", type: "text/plain" },
        { name: "abc", type: "application/xhtml+xml" },
        { name: "abc", type: "text/plain" },
        { name: "abc", type: "application/xhtml+xml" },
      ];
      var name;
      for each ( var param in params ) {
        log.trace( "type: '" + param.type + "'" );
        log.trace( "name: '" + param.name + "'" );
        name = getValidNoteName( category, param.name, param.type );
        log.trace( "----> '" + name + "'" );
        category.createNote( name, param.type );
      }
    }
  } );

  tests.push(
    {
      name: "Fonts",
      description: "Font's prefs",
      code: function () {
        var fontMapping = Utils.getDefaultFontMapping();
        log.trace( "default-name: " + fontMapping.defaultName );
        log.trace( "default-value: " + fontMapping.defaultValue );
        log.trace( "" );
        log.trace( "serif: " + fontMapping.generics["serif"] );
        log.trace( "sans-serif: " + fontMapping.generics["sans-serif"] );
        log.trace( "cursive: " + fontMapping.generics["cursive"] );
        log.trace( "fantasy: " + fontMapping.generics["fantasy"] );
        log.trace( "monospace: " + fontMapping.generics["monospace"] );
        log.trace( "" );
        log.trace( "size-variable: " + fontMapping.varSize );
        log.trace( "size-fixed: " + fontMapping.fixSize );
      }
    }
  );

  tests.push( {
    name: "Screen",
    description: "Screen geometry",
    code: function () {
      var screenX = ctx.window.screenX;
      var screenY = ctx.window.screenY;
      var availLeft = ctx.window.screen.availLeft;
      var availTop = ctx.window.screen.availTop;
      var outerWidth = ctx.window.outerWidth
      var outerHeight = ctx.window.outerHeight;
      var availWidth = ctx.window.screen.availWidth;
      var availHeight = ctx.window.screen.availHeight;
      log.trace( "screenX = " + screenX );
      log.trace( "screenY = " + screenY );
      log.trace( "availLeft = " + availLeft );
      log.trace( "availTop = " + availTop );
      log.trace( "outerWidth = " + outerWidth );
      log.trace( "outerHeight = " + outerHeight );
      log.trace( "availWidth = " + availWidth );
      log.trace( "availHeight = " + availHeight );
    }
  } );

  tests.push( {
    name: "Messenger",
    description: "Get message in .eml format",
    code: function () {
      var mWindow = Utils.getMail3PaneWindow();
      if ( !mWindow ) {
        log.trace( "TB required" );
        return;
      }
      var gFolderDisplay = mWindow.gFolderDisplay;
      var messenger = mWindow.messenger;
      var uris = gFolderDisplay.selectedMessageUris;
      if ( !uris ) {
        return;
      }
      for ( var i = 0; i < uris.length; i++ ) {
        var uri = uris[i];
        var msgHdr = messenger.messageServiceFromURI( uri )
                              .messageURIToMsgHdr( uri );
        var msgFolder = msgHdr.folder;
        var name = msgHdr.mime2DecodedSubject;
        if ( msgHdr.flags & Ci.nsMsgMessageFlags.HasRe ) {
          name = ( name ) ? "Re: " + name : "Re: ";
        }
        log.trace( uri );
        log.trace( name );
        var streamListener =
          Cc["@mozilla.org/network/sync-stream-listener;1"]
                    .createInstance( Ci.nsISyncStreamListener );
        messenger.messageServiceFromURI( uri ).streamMessage(
          uri,
          streamListener,
          null,
          null,
          false,
          "",
          false
        );
        var plainTextMessage = "";
        plainTextMessage = msgFolder.getMsgTextFromStream(
          streamListener.inputStream,
          msgHdr.Charset,
          65536,
          32768,
          false,
          true,
          {}
        );
        log.trace( plainTextMessage );
      }
    }
  } );

  tests.push( {
    name: "Updater",
    description: "Get updater info",
    code: function () {
      var mgr = ru.akman.znotes.UpdateManager;
      if ( !mgr.isSupported() ) {
        log.trace( "Update service is not supported." );
        return;
      }
      log.trace( "Can Update: " + mgr.canUpdate() );
      log.trace( "Is Active: " + mgr.isActive() );
      if ( mgr.isActive() ) {
        log.trace( "Update name: " + mgr.getName() );
      }
      switch ( mgr.getState() ) {
        case "default":
          log.trace( "Check for updates ..." );
          break;
        case "downloading":
          log.trace( "Downloading updates ..." );
          break;
        case "paused":
          log.trace( "Resume downloading updates ..." );
          break;
        case "pending":
          log.trace( "Apply downloaded updates now ..." );
          break;
      }
    }
  } );

  tests.push( {
    name: "Platform commands",
    description: "Platform commands",
    code: function () {
      var process = function( commandset ) {
        var node = commandset.firstChild;
        var cmd, enabled;
        while ( node ) {
          if ( node.nodeName == "commandset" ) {
            process( node );
          } else if ( node.hasAttribute( "id" ) ) {
            cmd = node.getAttribute( "id" );
            if ( !node.hasAttribute( "disabled" ) ||
                 node.getAttribute( "disabled" ) === "false" ) {
              log.trace( cmd + " -> ENABLED" );
            } else {
              log.trace( cmd + " -> DISABLED" );
            }
          }
          node = node.nextSibling;
        }
      };
      process(
        ctx.document.getElementById( "znotes_commandset" )
      );
    }
  } );

  tests.push( {
    name: "Platform assigned shortcuts",
    description: "Show platform assigned shortcuts",
    code: function () {
      log.trace( Utils.dumpObject( Utils.getPlatformAssignedShortcuts() ) );
    }
  } );

  tests.push( {
    name: "Permutation",
    description: "Permutation of char",
    code: function () {
      var tests = [
        [],
        [ "Alt" ],
        [ "Alt", "Ctrl" ],
        [ "Alt", "Ctrl", "Meta" ],
        [ "Alt", "Ctrl", "Meta", "Shift" ]
      ];
      for ( var i = 0; i < tests.length; i++ ) {
        log.trace( "[" + tests[i] + "]" );
        log.trace( "=========================")
        log.trace( "result: [" );
        var result = Utils.getPermutations( tests[i] );
        for ( var j = 0; j < result.length; j++ ) {
          log.trace( "  " + Object.prototype.toString.call( result ) +
                     "[" + result[j] + "]" );
        }
        log.trace( "]" );
        log.trace( "\n")
      }
    }
  } );

  tests.push( {
    name: "Info Tab",
    description: "Info Tab",
    code: function () {
      var tabMail = Utils.getTabMail();
      if ( tabMail ) {
        tabMail.openTab(
          "znotesInfoTab",
          {
            contentPage: "chrome://znotes_welcome/content/index_ru.xhtml"
          }
        );
      } else {
        var win = window.open(
          "chrome://znotes/content/info.xul",
          "znotes:info",
          "chrome,toolbar,status,resizable,centerscreen"
        );
        win.arguments = [
          {
            contentPage: "chrome://znotes_welcome/content/index_ru.xhtml",
            windowMode: "maximized"
          }
        ];
      }
    }
  } );

  tests.push( {
    name: "Content Tab",
    description: "Content Tab",
    code: function () {
      var tabMail = Utils.getTabMail();
      if ( !tabMail ) {
        return;
      }
      tabMail.openTab(
        "contentTab",
        {
          contentPage: "chrome://znotes_welcome/content/index_ru.xhtml"
        }
      );
    }
  } );

  tests.push( {
    name: "Open note",
    description: "Open note dialog",
    code: function () {
      var params = {
        input: {
          title: "Select note",
          aBook: ctx.book,
          aCategory: ctx.category,
          aTag: ctx.tag,
          aNote: ctx.note
        },
        output: null
      };
      window.openDialog(
        "chrome://znotes/content/opensavedialog.xul?mode=open&type=note",
        "",
        "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
        params
      ).focus();
      if ( !params.output ) {
        return;
      }
      log.trace( params.output.aBook.getName() );
      log.trace( params.output.aNote.getName() );
    }
  } );

  tests.push( {
    name: "Save note (can overwrite)",
    description: "Save note (can overwrite) dialog",
    code: function () {
      var params = {
        input: {
          title: "Save note",
          canOverwrite: true,
          aBook: ctx.book,
          aCategory: ctx.category,
          aTag: ctx.tag,
          aNote: ctx.note
        },
        output: null
      };
      window.openDialog(
        "chrome://znotes/content/opensavedialog.xul?mode=save&type=note",
        "",
        "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
        params
      ).focus();
      if ( !params.output ) {
        return;
      }
      log.trace( params.output.aBook.getName() );
      log.trace( params.output.aCategory.getName() );
      log.trace( params.output.aTags );
      log.trace( params.output.aType );
      log.trace( params.output.aName );
    }
  } );

  tests.push( {
    name: "Save note",
    description: "Save note dialog",
    code: function () {
      var params = {
        input: {
          title: "Save note",
          aBook: ctx.book,
          aCategory: ctx.category,
          aTag: ctx.tag,
          aNote: ctx.note,
          aName: "defaul name for a note"
        },
        output: null
      };
      window.openDialog(
        "chrome://znotes/content/opensavedialog.xul?mode=save&type=note",
        "",
        "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
        params
      ).focus();
      if ( !params.output ) {
        return;
      }
      log.trace( params.output.aBook.getName() );
      log.trace( params.output.aCategory.getName() );
      log.trace( params.output.aTags );
      log.trace( params.output.aType );
      log.trace( params.output.aName );
    }
  } );

  tests.push( {
    name: "Open category",
    description: "Open category dialog",
    code: function () {
      var params = {
        input: {
          title: "Open category",
          aBook: ctx.book,
          aCategory: ctx.category,
          aTag: ctx.tag,
          aNote: ctx.note
        },
        output: null
      };
      window.openDialog(
        "chrome://znotes/content/opensavedialog.xul?mode=open&type=category",
        "",
        "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
        params
      ).focus();
      if ( !params.output ) {
        return;
      }
      log.trace( params.output.aBook.getName() );
      log.trace( params.output.aCategory.getName() );
    }
  } );

  tests.push( {
    name: "Save category (can overwrite)",
    description: "Save category (can overwrite) dialog",
    code: function () {
      var params = {
        input: {
          title: "Save category",
          canOverwrite: true,
          aBook: ctx.book,
          aCategory: ctx.category,
          aTag: ctx.tag,
          aNote: ctx.note
        },
        output: null
      };
      window.openDialog(
        "chrome://znotes/content/opensavedialog.xul?mode=save&type=category",
        "",
        "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
        params
      ).focus();
      if ( !params.output ) {
        return;
      }
      log.trace( params.output.aBook.getName() );
      log.trace( params.output.aCategory.getName() );
      log.trace( params.output.aName );
      log.trace( params.output.aTags );
      log.trace( params.output.aType );
    }
  } );

  tests.push( {
    name: "Save category",
    description: "Save category dialog",
    code: function () {
      var params = {
        input: {
          title: "Save category",
          aBook: ctx.book,
          aCategory: ctx.category,
          aTag: ctx.tag,
          aNote: ctx.note
        },
        output: null
      };
      window.openDialog(
        "chrome://znotes/content/opensavedialog.xul?mode=save&type=category",
        "",
        "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
        params
      ).focus();
      if ( !params.output ) {
        return;
      }
      log.trace( params.output.aBook.getName() );
      log.trace( params.output.aCategory.getName() );
      log.trace( params.output.aName );
      log.trace( params.output.aTags );
      log.trace( params.output.aType );
    }
  } );

  tests.push( {
    name: "Parse & Serialize HTML",
    description: "Parse & serialize text/html",
    code: function () {
      var aDOM, aText, anURI, aBaseURI, aPrincipal;
      var tmpBrowser, tmpFile, tmpURL;
      var ioService =
        Cc["@mozilla.org/network/io-service;1"]
                  .getService( Ci.nsIIOService );
      var securityManager =
        Cc["@mozilla.org/scriptsecuritymanager;1"]
                  .getService( Ci.nsIScriptSecurityManager );
      var domParser =
        Cc["@mozilla.org/xmlextras/domparser;1"]
                  .createInstance( Ci.nsIDOMParser );
      aText =
        '<!-- before document -->\n' +
        //'<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN"\n' +
        //'  "http://www.w3.org/TR/html4/strict.dtd">\n' +
        //'<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"\n' +
        //'  "http://www.w3.org/TR/html4/loose.dtd">\n' +
        //'<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Frameset//EN"\n' +
        //'  "http://www.w3.org/TR/html4/frameset.dtd">\n' +
        '<!DOCTYPE html>\n' +
        '<!-- after doctype -->\n' +
        '<html>\n' +
        '    <!-- before head -->\n' +
        '    <head>\n' +
        '        <meta charset="utf-8"></meta>\n' +
        '        <base href="file:///F:\Development/workspace/gecko/znotes/etc/Samples/sample1_files/"></base>\n' +
        '        <title>title</title>\n' +
        '    </head>\n' +
        '    <!-- after head -->\n' +
        '    <body>\n' +
        '        <img src="fox.jpg"></img>\n' +
        '    </body>\n' +
        '    <!-- after body -->\n' +
        '</html>\n' +
        '<!-- after document -->\n';
      log.trace( "SOURCE TEXT:\n" + aText + "\n" );
      anURI = ioService.newURI( "file:///F:\Development/workspace/gecko/znotes/etc/Samples/sample1.html", null, null );
      aBaseURI = ioService.newURI( "file:///F:\Development/workspace/gecko/znotes/etc/Samples/sample1_files/", null, null );
      aPrincipal = securityManager.getCodebasePrincipal( anURI );
      // TODO: anURI cause message in error console, what principal must be use?
      domParser.init( aPrincipal, null /* anURI */, aBaseURI, null );
      aDOM = domParser.parseFromString( aText, "text/html" );
      log.trace( "SERIALIZED TEXT:\n" + DOMUtils.serializeHTMLToString( aDOM ) + "\n" );
    }
  } );

  tests.push( {
    name: "Check name",
    description: "Validate XML Name",
    code: function () {

      function checkName( name ) {
        var re = new RegExp(
          "^[\:A-Z_a-z" +
          "\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF" +
          "\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF" +
          "\uFDF0-\uFFFD]" +
          "[\:A-Z_a-z" +
          "\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF" +
          "\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF" +
          "\uFDF0-\uFFFD" +
          "\-\.0-9\u00B7\u0300-\u036F\u203F-\u2040]*"
        );
        /*
        var re = new RegExp(
          "^[\:_A-Za-z" +
          "\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF" +
          "\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF" +
          "\uFDF0-\uFFFD]" +
          "[\-\.\:_A-Za-z0-9" +
          "\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u036F\u0370-\u037D\u037F-\u1FFF" +
          "\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF" +
          "\uF900-\uFDCF\uFDF0-\uFFFD]*"
        );
        */
        var result = re.exec( name );
        return ( result ? result[0] : "" );
      };

      log.trace( "abc" );
      log.trace( checkName( "abc" ) );

      log.trace( "br=clear" );
      log.trace( checkName( "br=clear" ) );

      log.trace( "fb:like:xxxxx" );
      log.trace( checkName( "fb:like:xxxxx" ) );

    }
  } );

  tests.push( {
    name: "Maximize window",
    description: "Maximize application window",
    code: function () {
      window.maximize();
    }
  } );

  tests.push( {
    name: "Clipper flags",
    description: "Show web-clipper flags",
    code: function () {
      log.trace( Utils.CLIPPER_FLAGS.toString( 16 ) );
    }
  } );

  tests.push( {
    name: "Selectors",
    description: "Parse CSS selector",
    code: function () {

      var namespaces = CSSUtils.Namespaces.create()
            .set( CSSUtils.Namespaces.knowns["html"] )
            .set( CSSUtils.Namespaces.knowns["xlink"], "xlink" )
            .set( CSSUtils.Namespaces.knowns["og"], "og" )
            .set( CSSUtils.Namespaces.knowns["fb"], "fb" )
            .set( CSSUtils.Namespaces.knowns["g"], "g" )
            .set( CSSUtils.Namespaces.knowns["svg"], "svg" )
            .set( CSSUtils.Namespaces.knowns["math"], "math" );

      function test( str, namespaces ) {
        var selectors, space, pointer;
        log.trace( str );
        try {
          selectors = CSSUtils.parseSelectors( str, namespaces );
          if ( str === selectors.serialize() ) {
            log.trace( "OK" );
          } else {
            log.trace( selectors.dump() );
            log.trace( "FAIL" );
          }
        } catch ( e ) {
          if ( ( "position" in e ) && ( "length" in e ) ) {
            space = new Array( e.position + 1 ).join( " " );
            pointer = new Array( e.length + 1 ).join( "^" );
            if ( !pointer ) {
              pointer = "^";
            }
            log.trace(
              space + pointer + "\n" +
              space + "+--- [ " + e.position + " / " + e.length + "] --- " + e.message
            );
          } else {
            log.warn( e );
          }
        }
      }

      var selectors = [
        "LI, /* abc */\n" +
        "UL /* 123 */ LI, html|*:not(:link):not(:visited),\n" +
        "svg|sp\\23 an[hello='Cleveland']" +
        '[fb|goodbye="Colum\\' + "\n" +
        'bus"]',
        "",
        "'abc\\" + "xyz'",
        "'abc\\" + "\\xyz'",
        "'abc\\" + "'" + "def'",
        '"abc\\' + '"' + 'def"',
        "'abc\\" + "\n" + "def'",
        "'abc\\" + "def'",
        "http://znotes.net\\2f docume\\" + "\n" + "ntation.xhtml'",
        '"http://znotes.net\\2f docume\\' + '\n' + 'ntation.xhtml"',
        "@import url( http://znotes.net )",
        "@import url(  'http://znotes.net'  )",
        "@import 'http://znotes.net'",
        '@import url( "http://znotes.net\\2f docume\\' + '\n' + 'ntation.xhtml" )',
        "@import url( http://znotes.net\\2f docume\\" + "\n" + "ntation.xhtml )",
        "@import url( http://znotes.net\\2f documentation.xhtml )",
        "@import url( 'http://znotes.net\\2f documentation.xhtml' )",
        '@import url( "http://znotes.net\\2f documentation.xhtml" )',
        '@import url( "http://znotes.net\\00002fdocumentation.xhtml" )',
        '@import url( "http://znotes.net\\00002f documentation.xhtml" )',
        "#IDENT\\000023NUM",
        "#IDENT\\23NUM",
        "#IDENT\\23 NUM",
        "#IDENT\\23  NUM",
        "#IDENT\\000023\\000023NUM",
        "#IDENT\\23\\000023NUM",
        "#IDENT\\000023\\23 NUM",
        "#IDENT\\000023\\23  NUM",
        "u+",
        "u+?",
        "u+??????",
        "u+???????",
        "u+002D",
        "U+2D?",
        "u+002D??",
        "U+?-002F",
        "IDENT\\00002fSLASH",
        "IDENT\\2FSLASH",
        "IDENT\\2F SLASH",
        "IDENT\\2F  SLASH",
        "IDENT\\00002fALPHA",
        "IDENT\\2fALPHA",
        "IDENT\\2F ALPHA",
        "IDENT\\2F  ALPHA",
        "*",
        "UL LI",
        "UL OL+LI",
        "H1 + *[REL=up]",
        "UL OL LI.red",
        "LI.red.level",
        "#x34y",
        "div ol>li p",
        "h1.opener + h2",
        "div p *[href]",
        "ol > li:last-child",
        "#s12:not(FOO)",
        ":lang(fr-be) > q",
        "*:target::before",
        "*:target",
        "p.note:target",
        "button:not([DISABLED])",
        "tr > td:last-of-type",
        "[foo|att=val]",
        "[*|att]",
        "[|att]",
        "[att]",
        "*|*[foo='bar']",
        "*|UL[svg|r='10']",
        "|UL[|r='10']",
        "html|*[attr='10']",
        "html|*:not(:link):not(:visited)",
        "*|*:not(:hover)",
        "*|*:not(*)",
        "p[title*='hello']",
        "a[href$='.html']",
        "object[type^='image/']",
        "a[hreflang|='en']",
        "span[hello='Cleveland'][goodbye='Columbus']",
        ":nth-child( 3n + 1 )",
        ":nth-child( +3n - 2 )",
        ":nth-child( -n+ 6)",
        ":nth-child( +n+ 6)",
        ":nth-child( +6 )",
        ":nth-child( 3 n )",
        ":nth-child( + 2n)",
        ":nth-child(+ 2)",
        "img:nth-of-type(2n+1)",
        "img:nth-of-type(-2n+1)",
        "img:nth-of-type(2n-1)",
        "img:nth-of-type(-2n-1)",
        "tr:nth-child(odd)",
        "#main-nav.expand > ul > li:not(:last-child)",
        "html[dir='rtl'] #main-header .logo",
        "#main-header:before, #main-header:after",
        ".error, .error > :-moz-any(.start-tag, .end-tag, .comment, .cdata)",
        ".error, .error > :-moz-any(.start-tag, .end-tag, .comment, .cdata )",
        ".error, .error > :-moz-any( .start-tag, .end-tag, .comment, .cdata)",
        ".error, .error > :-moz-any( .start-tag, .end-tag, .comment, .cdata )"
      ];

      for ( var i = 0; i < selectors.length; i++ ) {
        test( selectors[i] );
      }

    }
  } );

  tests.push( {
    name: "namespace at-rule",
    description: "Parse namespace at-rule",
    code: function () {

      function test( str ) {
        var ns, space, pointer;
        log.trace( str );
        try {
          ns = CSSUtils.parseNamespaceRule( str );
          log.trace( ns.dump() );
          log.trace( str === ns.serialize() ? "OK" : "FAIL" );
        } catch ( e ) {
          if ( ( "position" in e ) && ( "length" in e ) ) {
            space = new Array( e.position + 1 ).join( " " );
            pointer = new Array( e.length + 1 ).join( "^" );
            if ( !pointer ) {
              pointer = "^";
            }
            log.trace(
              space + pointer + "\n" +
              space + "+--- [ " + e.position + " / " + e.length + "] --- " + e.message
            );
          } else {
            log.warn( e );
          }
        }
      }

      var rules = [
        '@namespace     "http://www.w3.org/1999/xhtml";',
        "@namespace     'http://base.google.com/ns/1.0';",
        '@namespace url("http://www.w3.org/1999/xhtml");',
        '@namespace  url(http://www.w3.org/1999/xhtml);',
        "@namespace url('http://www.w3.org/1999/xhtml');",
        //
        '@namespace fb        "http://ogp.me/ns/fb#";',
        "@namespace xlink     'http://www.w3.org/1999/xlink';",
        '@namespace math   url(http://www.w3.org/1998/Math/MathML);',
        '@namespace svg   url("http://www.w3.org/2000/svg");',
        "@namespace og    url('http://ogp.me/ns#');",
        //
        "@namespace empty '';",
        "@namespace '';",
        '@namespace "";',
        '@namespace url("");',
        "@namespace url('');",
        '@namespace url();'
      ];

      for ( var i = 0; i < rules.length; i++ ) {
        test( rules[i] );
      }

    }
  } );

  tests.push( {
    name: "Show many alerts by alerts service",
    description: "Show alerts by alerts service",
    code: function () {
      var alertsService =
        Cc['@mozilla.org/alerts-service;1']
                  .getService( Ci.nsIAlertsService );
      var windowMediator =
        Cc["@mozilla.org/appshell/window-mediator;1"]
                  .getService( Ci.nsIWindowMediator );
      var observer = {
        observe: function( subject, topic, data ) {
          switch ( topic ) {
            case "alertshow":
              log.trace( "alertshow: " + data );
              break;
            case "alertclickcallback":
              log.trace( "alertclickcallback: " + data );
              break;
            case "alertfinished":
              log.trace( "alertfinished: " + data );
              break;
          }
        }
      };
      var i, win, wins;
      for ( i = 0; i < 5; i++ ) {
        try {
          wins = windowMediator.getEnumerator( 'alert:alert' );
          while ( wins.hasMoreElements() ) {
            win = wins.getNext();
            if ( win.outerHeight < 10 ) {
              win.close();
            }
          }
          alertsService.showAlertNotification(
            "chrome://znotes_images/skin/message-32x32.png",
            "TITLE-" + i,
            "TEXT-" + i,
            true,
            "COOCKIE-" + i,
            observer,
            "NAME-" + i,
            null,
            null
          );
        } catch ( e ) {
          log.warn( e );
        }
      }
    }
  } );

  tests.push( {
    name: "Show many alerts by window mediator",
    description: "Show popups by window mediator",
    code: function () {
      function showPopup( imageUrl, title, text, textClickable, cookie,
                          origin, bidi, lang,
                          replacedWindow, alertListener ) {
        var win, wins =
          Cc["@mozilla.org/appshell/window-mediator;1"]
                    .getService( Ci.nsIWindowMediator )
                    .getEnumerator( 'alert:alert' );
        while ( wins.hasMoreElements() ) {
          win = wins.getNext();
          if ( win.outerHeight < 10 ) {
            win.close();
          }
        }
        /*
        win =
          Cc["@mozilla.org/embedcomp/window-watcher;1"]
                    .getService( Ci.nsIWindowWatcher )
                    .openWindow(
            null, "chrome://znotes/content/alert.xul",
            "_blank", "chrome,titlebar=no,popup=yes", null
          );
        */
        win = window.open(
          "chrome://global/content/alerts/alert.xul",
          "",
          "chrome,titlebar=no,popup=yes"
        );
        win.arguments = [
          imageUrl,       // the image src url
          title,          // the alert title
          text,           // the alert text
          textClickable,  // is the text clickable
          cookie,         // the alert cookie to be passed back to the listener
          origin,         // the alert origin reported by the look and feel
          bidi,           // bidi
          lang,           // lang
          replacedWindow, // replaced alert window (nsIDOMWindow)
          alertListener   // an optional callback listener (nsIObserver)
        ];
        return win;
      };
      var observer = {
        observe: function( subject, topic, data ) {
          switch ( topic ) {
            case "alertshow":
              log.trace( "alertshow: " + data );
              break;
            case "alertclickcallback":
              log.trace( "alertclickcallback: " + data );
              break;
            case "alertfinished":
              log.trace( "alertfinished: " + data );
              break;
          }
        }
      };
      for ( var i = 0; i < 5; i++ ) {
        showPopup(
          "chrome://znotes_images/skin/message-32x32.png",
          "TITLE-" + i,
          "TEXT-" + i,
          true,
          "COOCKIE-" + i,
          0,
          null,
          null,
          null,
          observer
        );
      }
    }
  } );

  tests.push( {
    name: "Show many alerts by fixed alert",
    description: "Show popups by fixed alert",
    code: function () {
      var observer = {
        observe: function( subject, topic, data ) {
          switch ( topic ) {
            case "alertshow":
              log.trace( "alertshow: " + data );
              break;
            case "alertclickcallback":
              log.trace( "alertclickcallback: " + data );
              break;
            case "alertfinished":
              log.trace( "alertfinished: " + data );
              break;
          }
        }
      };
      for ( var i = 0; i < 5; i++ ) {
        Utils.showPopup(
          "chrome://znotes_images/skin/message-32x32.png",
          "TITLE-" + i,
          "TEXT-" + i,
          true,
          "COOCKIE-" + i,
          0,
          null,
          null,
          null,
          observer
        );
      }
    }
  } );

  tests.push( {
    name: "Logger levels",
    description: "Log all possible logger levels",
    code: function () {
      /*
      FATAL    Severe errors that cause premature termination.
               Expect these to be immediately visible on a status console.
      ERROR    Other runtime errors or unexpected conditions.
               Expect these to be immediately visible on a status console.
      WARN     Use of deprecated APIs, poor use of API, 'almost' errors,
               other runtime situations that are undesirable or unexpected,
                but not necessarily "wrong". Expect these to be immediately
                visible on a status console.
      INFO     Interesting runtime events (startup/shutdown).
               Expect these to be immediately visible on a console, so be
               conservative and keep to a minimum.
      CONFIG   Information regarding important configuration options the system
               is using that affects how it runs.
      DEBUG    Detailed information on the flow through the system.
               Expect these to be written to logs only.
      TRACE    Most detailed information. Expect these to be written to logs only.
      */
      log.fatal( "Fatal" );
      log.error( "Error" );
      log.warn( "Warn" );
      log.trace( "Info" );
      log.config( "Config" );
      log.debug( "Debug" );
      log.trace( "Trace" );
    }
  } );

  tests.push( {
    name: "SQLite experiments",
    description: "SQLite with Task + Sqlite",
    code: function () {
      Cu.import( "resource://gre/modules/Task.jsm" );
      Cu.import( "resource://gre/modules/Sqlite.jsm" );
      Task.spawn( function* () {
        let version;
        let result, data = [
          {
            title: "This is a title one",
            body: "Body one is very small"
          },
          {
            title: "This is a title two",
            body: "Body two is bigger\nBig body text in blob"
          },
          {
            title: "This is a title three",
            body: "Body three is XXL\nXXL text in blob\nXL text in blob\nAll in blob"
          },
          {
            title: "Название",
            body: "Четвертое содержимое"
          },
        ];
        let conn = yield Sqlite.openConnection( {
          path: Utils.getDBFile().path,
          sharedMemoryCache: false
        } );
        try {
          yield conn.execute( "PRAGMA synchronous = FULL" );
          yield conn.execute( "PRAGMA case_sensitive_like = TRUE" );
          result =
            yield conn.execute( "SELECT sqlite_version() as version" );
          version =
            result.length ? result[0].getResultByName( "version" ) : null;
          log.trace( "sqliteVersion: " + version );
          if ( !( yield conn.tableExists( "NOTES" ) ) ) {
            log.trace( "Table 'NOTES' does not exist" );
            yield conn.execute(
              "CREATE VIRTUAL TABLE NOTES USING fts4( title, body )" );
            log.trace( "Table 'NOTES' created successfully" );
            for ( let row of data ) {
              yield conn.execute(
                "INSERT INTO NOTES VALUES ( :title, :body )", row );
            }
            log.trace( "Table 'NOTES' populated successfully" );
          } else {
            log.trace( "Table 'NOTES' exists already" );
          }
          result = yield conn.execute(
            "SELECT * FROM NOTES WHERE body LIKE :value",
            { value: "%верт%" }
          );
          log.trace( "title\tbody" );
          log.trace( "=============================" );
          for ( let row of result ) {
            log.trace( row.getResultByName( "title" ) + "\t" +
              row.getResultByName( "body" ) );
          }
        } finally {
          yield conn.close();
        }
      } ).catch( function( e ) {
        log.warn( e );
      } );
    }
  } );
  
  return pub;

}();

window.addEventListener( "load", ru.akman.znotes.TestSuite.onLoad, false );
window.addEventListener( "unload", ru.akman.znotes.TestSuite.onUnload, false );
window.addEventListener( "close", ru.akman.znotes.TestSuite.onClose, false );
