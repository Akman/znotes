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

Components.utils.import( "resource://znotes/utils.js" , ru.akman.znotes );
Components.utils.import( "resource://znotes/updatemanager.js" , ru.akman.znotes );

ru.akman.znotes.Debug = function() {

  var pub = {};

  var Utils = ru.akman.znotes.Utils;
  
  var mozPrefs = Components.classes["@mozilla.org/preferences-service;1"]
                           .getService( Components.interfaces.nsIPrefBranch );

  var debugTextBox = null;
  var alwaysRaisedButton = null;
  var ctx = null;
  var win = null;
  var doc = null;
  var tests = [];

  function log( msg ) {
    debugTextBox.value += msg + "\n";
  };
  
  function debugCommand( event ) {
    var testIndex = parseInt( event.target.value );
    var delimiter = "========" + new Array( tests[testIndex].name.length + 1 ).join( "=" );
    var header = "[BEGIN] " + tests[testIndex].name;
    log( header );
    log( delimiter );
    try {
      tests[testIndex].code( event );
    } catch ( e ) {
      log( e );
    }
    log( delimiter + "\n" );
  };
  
  pub.onLoad = function( event ) {
    Utils.IS_DEBUG_ACTIVE = true;
    mozPrefs.setBoolPref( "extensions.znotes.debug.active", true );
    debugTextBox = document.getElementById( "debugTextBox" );
    Utils.DEBUG_TEXTBOX = debugTextBox;
    alwaysRaisedButton = document.getElementById( "alwaysRaisedButton" );
    alwaysRaisedButton.checked = Utils.IS_DEBUG_RAISED;
    pub.alwaysRaised();
    ctx = window.arguments[0];
    win = ctx.win;
    doc = ctx.doc;
  };
  
  pub.onClose = function( event ) {
    Utils.DEBUG_TEXTBOX = null;
    Utils.IS_DEBUG_ACTIVE = false;
    mozPrefs.setBoolPref( "extensions.znotes.debug.active", false );
  };
  
  pub.clearDebugView = function( event ) {
    debugTextBox.value = "";
    return true;
  };

  pub.execTest = function( event ) {
    var debugMenu = document.getElementById( "debugMenu" );
    while ( debugMenu.firstChild ) {
      debugMenu.removeChild( debugMenu.firstChild );
    }
    for ( var i = 0; i < tests.length; i++ ) {
      var test = tests[i];
      var menuItem = document.createElement( "menuitem" );
      menuItem.className = "menuitem-iconic testmenuitem";
      menuItem.setAttribute( "value", i );
      menuItem.setAttribute( "label", test.name );
      menuItem.setAttribute( "tooltiptext", test.description );
      menuItem.addEventListener( "command", debugCommand, false );
      debugMenu.appendChild( menuItem );
    }
    var execTestButton = document.getElementById( "execTestButton" );
    debugMenu.openPopup(
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
    var xulWin = window.QueryInterface( Components.interfaces.nsIInterfaceRequestor )
                       .getInterface( Components.interfaces.nsIWebNavigation )
                       .QueryInterface( Components.interfaces.nsIDocShellTreeItem ).treeOwner
                       .QueryInterface( Components.interfaces.nsIInterfaceRequestor)
                       .getInterface( Components.interfaces.nsIXULWindow );
    var value = alwaysRaisedButton.checked
    Utils.IS_DEBUG_RAISED = value;
    mozPrefs.setBoolPref( "extensions.znotes.debug.raised", value );
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
        var chromeRegistry = Components.classes ["@mozilla.org/chrome/chrome-registry;1"]
                                       .getService( Components.interfaces.nsIXULChromeRegistry );
        var cl3 = chromeRegistry.getSelectedLocale( "znotes" );

        var localeService = Components.classes["@mozilla.org/intl/nslocaleservice;1"]
                                      .getService( Components.interfaces.nsILocaleService );
        var cl0 = localeService.getSystemLocale().getCategory( "NSILOCALE_CTYPE" );
        var cl1 = localeService.getApplicationLocale().getCategory( "NSILOCALE_CTYPE" );
        var cl2 = localeService.getLocaleComponentForUserAgent();

        debugTextBox.value += "selected: " + cl3 + "\n" +
                              "system: " + cl0 + "\n" +
                              "application: " + cl1 + "\n" +
                              "useragent: " + cl2 + "\n\n" +
                              "languages: " + Utils.LANGUAGES.join( ", " ) + "\n";
      }
    }
  );

  tests.push(
    {
      name: "GetId",
      description: "Get Id of current note",
      code: function () {
        debugTextBox.value += ctx.note.getId() + "\n";
      }
    }
  );

  tests.push(
    {
      name: "getURI & getBaseURI",
      description: "Get URIs of current note",
      code: function () {
        var designFrame = doc.getElementById( "designEditor" );
        debugTextBox.value += "getBaseURI() :: " + decodeURIComponent( ctx.note.getBaseURI().spec ) + "\n";
        debugTextBox.value += "getURI() :: " + decodeURIComponent( ctx.note.getURI().spec ) + "\n";
        debugTextBox.value += "BaseURI :: " + decodeURIComponent( designFrame.contentDocument.baseURIObject.spec ) + "\n";
        debugTextBox.value += "DocumentURI :: " + decodeURIComponent( designFrame.contentDocument.documentURIObject.spec ) + "\n";
      }
    }
  );

  tests.push(
    {
      name: "Welcome",
      description: "Create welcome note",
      code: function () {
        var note = ctx.createWelcomeNote( ctx.book );
        debugTextBox.value += note;
      }
    }
  );

  tests.push(
    {
      name: "Info",
      description: "Get application info",
      code: function () {
        debugTextBox.value += "\n";
        debugTextBox.value += "ID :: "  + Utils.ID + "\n";
        debugTextBox.value += "BUNDLE :: "  + Utils.BUNDLE + "\n";
        debugTextBox.value += "NAME :: "  + Utils.NAME + "\n";
        debugTextBox.value += "VENDOR :: "  + Utils.VENDOR + "\n";
        debugTextBox.value += "VERSION :: "  + Utils.VERSION + "\n";
        debugTextBox.value += "BUILD :: "  + Utils.BUILD + "\n";
        debugTextBox.value += "LANGUAGES :: "  + Utils.LANGUAGES + "\n";
        debugTextBox.value += "SITE :: "  + Utils.SITE + "\n";
        debugTextBox.value += "SITE_LANGUAGES :: "  + Utils.SITE_LANGUAGES + "\n";
        debugTextBox.value += "TITLE :: "  + Utils.decodeUTF8( Utils.TITLE ) + "\n";
        debugTextBox.value += "DESCRIPTION :: "  + Utils.decodeUTF8( Utils.DESCRIPTION ) + "\n";
        debugTextBox.value += "LICENSES :: \n";
        for ( var i = 0; i < Utils.LICENSES.length; i++ ) {
          var license = Utils.LICENSES[i];
          debugTextBox.value += "[" + (i+1) + "] name = " + license.name + "\n";
          debugTextBox.value += "[" + (i+1) + "] link = " + license.link + "\n";
        }
        debugTextBox.value += "REPOSITORIES :: \n";
        for ( var i = 0; i < Utils.REPOSITORIES.length; i++ ) {
          var repository = Utils.REPOSITORIES[i];
          debugTextBox.value += "[" + (i+1) + "] name = " + repository.name + "\n";
          debugTextBox.value += "[" + (i+1) + "] link = " + repository.link + "\n";
        }
        debugTextBox.value += "CREATORS :: \n";
        for ( var i = 0; i < Utils.CREATORS.length; i++ ) {
          var creator = Utils.CREATORS[i];
          debugTextBox.value += "[" + (i+1) + "] name = " + Utils.decodeUTF8( creator.name ) + "\n";
          debugTextBox.value += "[" + (i+1) + "] link = " + creator.link + "\n";
        }
        debugTextBox.value += "CONTRIBUTORS :: \n";
        for ( var i = 0; i < Utils.CONTRIBUTORS.length; i++ ) {
          var contributor = Utils.CONTRIBUTORS[i];
          debugTextBox.value += "[" + (i+1) + "] name = " + Utils.decodeUTF8( contributor.name ) + "\n";
          debugTextBox.value += "[" + (i+1) + "] title = " + Utils.decodeUTF8( contributor.title ) + "\n";
          debugTextBox.value += "[" + (i+1) + "] description = " + Utils.decodeUTF8( contributor.description ) + "\n";
          debugTextBox.value += "[" + (i+1) + "] link = " + contributor.link + "\n";
          debugTextBox.value += "  LICENSES :: \n";
          for ( var j = 0; j < contributor.licenses.length; j++ ) {
            debugTextBox.value += "  [" + (j+1) + "] name = " + Utils.decodeUTF8( contributor.licenses[j].name ) + "\n";
            debugTextBox.value += "  [" + (j+1) + "] link = " + contributor.licenses[j].link + "\n";
          }
        }
        debugTextBox.value += "CREDITS :: \n";
        for ( var i = 0; i < Utils.CREDITS.length; i++ ) {
          var credit = Utils.CREDITS[i];
          debugTextBox.value += "[" + (i+1) + "] name = " + Utils.decodeUTF8( credit.name ) + "\n";
          debugTextBox.value += "[" + (i+1) + "] title = " + Utils.decodeUTF8( credit.title ) + "\n";
          debugTextBox.value += "[" + (i+1) + "] description = " + Utils.decodeUTF8( credit.description ) + "\n";
          debugTextBox.value += "[" + (i+1) + "] link = " + credit.link + "\n";
          debugTextBox.value += "  LICENSES :: \n";
          for ( var j = 0; j < credit.licenses.length; j++ ) {
            debugTextBox.value += "  [" + (j+1) + "] name = " + Utils.decodeUTF8( credit.licenses[j].name ) + "\n";
            debugTextBox.value += "  [" + (j+1) + "] link = " + credit.licenses[j].link + "\n";
          }
        }
        debugTextBox.value += "TRANSLATORS :: \n";
        for ( var i = 0; i < Utils.TRANSLATORS.length; i++ ) {
          var translator = Utils.TRANSLATORS[i];
          debugTextBox.value += "[" + (i+1) + "] name = " + Utils.decodeUTF8( translator.name ) + "\n";
          debugTextBox.value += "[" + (i+1) + "] link = " + translator.link + "\n";
        }
        debugTextBox.value += "COPYRIGHTS :: \n";
        for ( var i = 0; i < Utils.COPYRIGHTS.length; i++ ) {
          var copyright = Utils.COPYRIGHTS[i];
          debugTextBox.value += "[" + (i+1) + "] prefix = " + Utils.decodeUTF8( copyright.prefix ) + "\n";
          debugTextBox.value += "[" + (i+1) + "] year = " + copyright.year + "\n";
          debugTextBox.value += "[" + (i+1) + "] author = " + Utils.decodeUTF8( copyright.author ) + "\n";
          debugTextBox.value += "[" + (i+1) + "] reserved = " + Utils.decodeUTF8( copyright.reserved ) + "\n";
        }
        debugTextBox.value += "URLS :: \n";
        debugTextBox.value += "index = " + Utils.SITE + Utils.URLS.index + "\n";
        debugTextBox.value += "forum = " + Utils.SITE + Utils.URLS.forum + "\n";
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
        win.openDialog(
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
            log( json );
          }
        }
      }
    }
  );
  
  tests.push(
    {
      name: "Driver path",
      description: "Get driver path",
      code: function () {
        var ios = Components.classes["@mozilla.org/network/io-service;1"]
                            .getService( Components.interfaces.nsIIOService );
        var fph = ios.getProtocolHandler( "file" )
                     .QueryInterface( Components.interfaces.nsIFileProtocolHandler );
        var chr = Components.classes["@mozilla.org/chrome/chrome-registry;1"]
                            .getService(Components.interfaces.nsIChromeRegistry);
        var uri = ios.newURI( "chrome://znotes_drivers/content/filename.js", null, null );
        var dir = fph.getFileFromURLSpec( chr.convertChromeURL( uri ).spec ).parent.clone();
        log( dir.path );
      }
    }
  );

  tests.push(
    {
      name: "DOM",
      description: "Create DOM",
      code: function () {
        var defaultNS = 'http://www.w3.org/1999/xhtml';
        var impl = win.document.implementation;
        var dom = impl.createDocument(
          defaultNS,
          'html',
          impl.createDocumentType( 'html', '', '' )
        );
        dom.insertBefore(
          dom.createProcessingInstruction(
            'xml',
            'version="1.0" encoding="UTF-8" '
          ),
          dom.firstChild
        );
        dom.documentElement.appendChild(
          dom.createElementNS( defaultNS, 'head' )
        );
        dom.documentElement.appendChild(
          dom.createElementNS( defaultNS, 'body' )
        );
        var serializer = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"]
                                   .createInstance( Components.interfaces.nsIDOMSerializer );
        log( serializer.serializeToString( dom ) );
      }
    }
  );

  tests.push(
    {
      name: "Import",
      description: "Async import notes",
      code: function () {
        //
        var aNote1 = ctx.createNote(
          ctx.book,
          ctx.category,
          "debug note 1",
          Utils.DEFAULT_DOCUMENT_TYPE
        );
        var aNote2 = ctx.createNote(
          ctx.book,
          ctx.category,
          "debug note 2",
          Utils.DEFAULT_DOCUMENT_TYPE
        );
        aNote1.load( "https://developer.mozilla.org/ru/docs/DOM/Node.replaceChild" );
        aNote2.load( "https://developer.mozilla.org/ru/docs/DOM/Node.appendChild" );
      }
    }
  );

  tests.push(
    {
      name: "Fonts",
      description: "Font's prefs",
      code: function () {
        var fontMapping = Utils.getDefaultFontMapping();
        log( "default-name: " + fontMapping.defaultName );
        log( "default-value: " + fontMapping.defaultValue );
        log( "" );
        log( "serif: " + fontMapping.generics["serif"] );
        log( "sans-serif: " + fontMapping.generics["sans-serif"] );
        log( "cursive: " + fontMapping.generics["cursive"] );
        log( "fantasy: " + fontMapping.generics["fantasy"] );
        log( "monospace: " + fontMapping.generics["monospace"] );
        log( "" );
        log( "size-variable: " + fontMapping.varSize );
        log( "size-fixed: " + fontMapping.fixSize );
      }
    }
  );

  tests.push( {
    name: "Screen",
    description: "Screen geometry",
    code: function () {
      var screenX = win.screenX;
      var screenY = win.screenY;
      var availLeft = win.screen.availLeft;
      var availTop = win.screen.availTop;
      var outerWidth = win.outerWidth
      var outerHeight = win.outerHeight;
      var availWidth = win.screen.availWidth;
      var availHeight = win.screen.availHeight;
      log( "screenX = " + screenX );
      log( "screenY = " + screenY );
      log( "availLeft = " + availLeft );
      log( "availTop = " + availTop );
      log( "outerWidth = " + outerWidth );
      log( "outerHeight = " + outerHeight );
      log( "availWidth = " + availWidth );
      log( "availHeight = " + availHeight );
    }
  } );

  tests.push( {
    name: "Messenger",
    description: "Get message info",
    code: function () {
      var mWindow = Utils.getMail3PaneWindow();
      if ( !mWindow ) {
        log( "TB required" );
        return;
      }
      var gFolderDisplay = mWindow.gFolderDisplay;
      var messenger = mWindow.messenger;
      var uris = gFolderDisplay.selectedMessageUris;
      for ( var i = 0; i < uris.length; i++ ) {
        var uri = uris[i];
        var msgHdr = messenger.messageServiceFromURI( uri )
                              .messageURIToMsgHdr( uri );
        var msgFolder = msgHdr.folder;
        var name = msgHdr.mime2DecodedSubject;
        if ( msgHdr.flags & Components.interfaces.nsMsgMessageFlags.HasRe ) {
          name = ( name ) ? "Re: " + name : "Re: ";
        }
        log( uri );
        log( name );
        var streamListener = Components.classes["@mozilla.org/network/sync-stream-listener;1"]
                                       .createInstance( Components.interfaces.nsISyncStreamListener );
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
        log( plainTextMessage );
      }
    }
  } );

  tests.push( {
    name: "Updater",
    description: "Get updater info",
    code: function () {
      var mgr = ru.akman.znotes.UpdateManager;
      if ( !mgr.isSupported() ) {
        log( "Update service is not supported." );
        return;
      }
      log( "Can Update: " + mgr.canUpdate() );
      log( "Is Active: " + mgr.isActive() );
      if ( mgr.isActive() ) {
        log( "Update name: " + mgr.getName() );
      }
      switch ( mgr.getState() ) {
        case "default":
          log( "Check for updates ..." );
          break;
        case "downloading":
          log( "Downloading updates ..." );
          break;
        case "paused":
          log( "Resume downloading updates ..." );
          break;
        case "pending":
          log( "Apply downloaded updates now ..." );
          break;
      }
    }
  } );
  
  return pub;

}();

window.addEventListener( "load"  , function() { ru.akman.znotes.Debug.onLoad(); }, false );
window.addEventListener( "close"  , function() { ru.akman.znotes.Debug.onClose(); }, false );
