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
Components.utils.import( "resource://znotes/domutils.js" , ru.akman.znotes );
Components.utils.import( "resource://znotes/updatemanager.js" , ru.akman.znotes );

ru.akman.znotes.TestSuite = function() {

  var pub = {};

  var Utils = ru.akman.znotes.Utils;
  var DOMUtils = ru.akman.znotes.DOMUtils;
  
  var mozPrefs = Components.classes["@mozilla.org/preferences-service;1"]
                           .getService( Components.interfaces.nsIPrefBranch );

  var testTextBox = null;
  var alwaysRaisedButton = null;
  var ctx = null;
  var win = null;
  var doc = null;
  var tests = [];

  function testCommand( event ) {
    var testIndex = parseInt( event.target.value );
    var delimiter = "========" + new Array( tests[testIndex].name.length + 1 ).join( "=" );
    var header = "[BEGIN] " + tests[testIndex].name;
    Utils.log( header );
    Utils.log( delimiter );
    try {
      tests[testIndex].code( event );
    } catch ( e ) {
      Utils.log( e );
    }
    Utils.log( delimiter + "\n" );
  };
  
  pub.onLoad = function( event ) {
    Utils.IS_TEST_ACTIVE = true;
    mozPrefs.setBoolPref( "extensions.znotes.test.active", true );
    testTextBox = document.getElementById( "testTextBox" );
    Utils.DEBUG_TEXTBOX = testTextBox;
    alwaysRaisedButton = document.getElementById( "alwaysRaisedButton" );
    alwaysRaisedButton.checked = Utils.IS_TEST_RAISED;
    pub.alwaysRaised();
    ctx = window.arguments[0];
    win = ctx.win;
    doc = ctx.doc;
  };
  
  pub.onClose = function( event ) {
    Utils.DEBUG_TEXTBOX = null;
    Utils.IS_TEST_ACTIVE = false;
    mozPrefs.setBoolPref( "extensions.znotes.test.active", false );
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
    var xulWin = window.QueryInterface( Components.interfaces.nsIInterfaceRequestor )
                       .getInterface( Components.interfaces.nsIWebNavigation )
                       .QueryInterface( Components.interfaces.nsIDocShellTreeItem ).treeOwner
                       .QueryInterface( Components.interfaces.nsIInterfaceRequestor)
                       .getInterface( Components.interfaces.nsIXULWindow );
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
        var chromeRegistry = Components.classes ["@mozilla.org/chrome/chrome-registry;1"]
                                       .getService( Components.interfaces.nsIXULChromeRegistry );
        var cl3 = chromeRegistry.getSelectedLocale( "znotes" );

        var localeService = Components.classes["@mozilla.org/intl/nslocaleservice;1"]
                                      .getService( Components.interfaces.nsILocaleService );
        var cl0 = localeService.getSystemLocale().getCategory( "NSILOCALE_CTYPE" );
        var cl1 = localeService.getApplicationLocale().getCategory( "NSILOCALE_CTYPE" );
        var cl2 = localeService.getLocaleComponentForUserAgent();

        testTextBox.value += "selected: " + cl3 + "\n" +
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
        testTextBox.value += ctx.note.getId() + "\n";
      }
    }
  );

  tests.push(
    {
      name: "getURI & getBaseURI",
      description: "Get URIs of current note",
      code: function () {
        var designFrame = doc.getElementById( "designEditor" );
        testTextBox.value += "getBaseURI() :: " + decodeURIComponent( ctx.note.getBaseURI().spec ) + "\n";
        testTextBox.value += "getURI() :: " + decodeURIComponent( ctx.note.getURI().spec ) + "\n";
        testTextBox.value += "BaseURI :: " + decodeURIComponent( designFrame.contentDocument.baseURIObject.spec ) + "\n";
        testTextBox.value += "DocumentURI :: " + decodeURIComponent( designFrame.contentDocument.documentURIObject.spec ) + "\n";
      }
    }
  );

  tests.push(
    {
      name: "Welcome",
      description: "Create welcome note",
      code: function () {
        var note = ctx.createWelcomeNote( ctx.book );
        testTextBox.value += note;
      }
    }
  );

  tests.push(
    {
      name: "Info",
      description: "Get application info",
      code: function () {
        testTextBox.value += "\n";
        testTextBox.value += "ID :: "  + Utils.ID + "\n";
        testTextBox.value += "BUNDLE :: "  + Utils.BUNDLE + "\n";
        testTextBox.value += "NAME :: "  + Utils.NAME + "\n";
        testTextBox.value += "VENDOR :: "  + Utils.VENDOR + "\n";
        testTextBox.value += "VERSION :: "  + Utils.VERSION + "\n";
        testTextBox.value += "BUILD :: "  + Utils.BUILD + "\n";
        testTextBox.value += "LANGUAGES :: "  + Utils.LANGUAGES + "\n";
        testTextBox.value += "SITE :: "  + Utils.SITE + "\n";
        testTextBox.value += "SITE_LANGUAGES :: "  + Utils.SITE_LANGUAGES + "\n";
        testTextBox.value += "TITLE :: "  + Utils.decodeUTF8( Utils.TITLE ) + "\n";
        testTextBox.value += "DESCRIPTION :: "  + Utils.decodeUTF8( Utils.DESCRIPTION ) + "\n";
        testTextBox.value += "LICENSES :: \n";
        for ( var i = 0; i < Utils.LICENSES.length; i++ ) {
          var license = Utils.LICENSES[i];
          testTextBox.value += "[" + (i+1) + "] name = " + license.name + "\n";
          testTextBox.value += "[" + (i+1) + "] link = " + license.link + "\n";
        }
        testTextBox.value += "REPOSITORIES :: \n";
        for ( var i = 0; i < Utils.REPOSITORIES.length; i++ ) {
          var repository = Utils.REPOSITORIES[i];
          testTextBox.value += "[" + (i+1) + "] name = " + repository.name + "\n";
          testTextBox.value += "[" + (i+1) + "] link = " + repository.link + "\n";
        }
        testTextBox.value += "CREATORS :: \n";
        for ( var i = 0; i < Utils.CREATORS.length; i++ ) {
          var creator = Utils.CREATORS[i];
          testTextBox.value += "[" + (i+1) + "] name = " + Utils.decodeUTF8( creator.name ) + "\n";
          testTextBox.value += "[" + (i+1) + "] link = " + creator.link + "\n";
        }
        testTextBox.value += "CONTRIBUTORS :: \n";
        for ( var i = 0; i < Utils.CONTRIBUTORS.length; i++ ) {
          var contributor = Utils.CONTRIBUTORS[i];
          testTextBox.value += "[" + (i+1) + "] name = " + Utils.decodeUTF8( contributor.name ) + "\n";
          testTextBox.value += "[" + (i+1) + "] title = " + Utils.decodeUTF8( contributor.title ) + "\n";
          testTextBox.value += "[" + (i+1) + "] description = " + Utils.decodeUTF8( contributor.description ) + "\n";
          testTextBox.value += "[" + (i+1) + "] link = " + contributor.link + "\n";
          testTextBox.value += "  LICENSES :: \n";
          for ( var j = 0; j < contributor.licenses.length; j++ ) {
            testTextBox.value += "  [" + (j+1) + "] name = " + Utils.decodeUTF8( contributor.licenses[j].name ) + "\n";
            testTextBox.value += "  [" + (j+1) + "] link = " + contributor.licenses[j].link + "\n";
          }
        }
        testTextBox.value += "CREDITS :: \n";
        for ( var i = 0; i < Utils.CREDITS.length; i++ ) {
          var credit = Utils.CREDITS[i];
          testTextBox.value += "[" + (i+1) + "] name = " + Utils.decodeUTF8( credit.name ) + "\n";
          testTextBox.value += "[" + (i+1) + "] title = " + Utils.decodeUTF8( credit.title ) + "\n";
          testTextBox.value += "[" + (i+1) + "] description = " + Utils.decodeUTF8( credit.description ) + "\n";
          testTextBox.value += "[" + (i+1) + "] link = " + credit.link + "\n";
          testTextBox.value += "  LICENSES :: \n";
          for ( var j = 0; j < credit.licenses.length; j++ ) {
            testTextBox.value += "  [" + (j+1) + "] name = " + Utils.decodeUTF8( credit.licenses[j].name ) + "\n";
            testTextBox.value += "  [" + (j+1) + "] link = " + credit.licenses[j].link + "\n";
          }
        }
        testTextBox.value += "TRANSLATORS :: \n";
        for ( var i = 0; i < Utils.TRANSLATORS.length; i++ ) {
          var translator = Utils.TRANSLATORS[i];
          testTextBox.value += "[" + (i+1) + "] name = " + Utils.decodeUTF8( translator.name ) + "\n";
          testTextBox.value += "[" + (i+1) + "] link = " + translator.link + "\n";
        }
        testTextBox.value += "COPYRIGHTS :: \n";
        for ( var i = 0; i < Utils.COPYRIGHTS.length; i++ ) {
          var copyright = Utils.COPYRIGHTS[i];
          testTextBox.value += "[" + (i+1) + "] prefix = " + Utils.decodeUTF8( copyright.prefix ) + "\n";
          testTextBox.value += "[" + (i+1) + "] year = " + copyright.year + "\n";
          testTextBox.value += "[" + (i+1) + "] author = " + Utils.decodeUTF8( copyright.author ) + "\n";
          testTextBox.value += "[" + (i+1) + "] reserved = " + Utils.decodeUTF8( copyright.reserved ) + "\n";
        }
        testTextBox.value += "URLS :: \n";
        testTextBox.value += "index = " + Utils.SITE + Utils.URLS.index + "\n";
        testTextBox.value += "forum = " + Utils.SITE + Utils.URLS.forum + "\n";
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
            Utils.log( json );
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
        var ios = Components.classes["@mozilla.org/network/io-service;1"]
                            .getService( Components.interfaces.nsIIOService );
        var fph = ios.getProtocolHandler( "file" )
                     .QueryInterface( Components.interfaces.nsIFileProtocolHandler );
        var chr = Components.classes["@mozilla.org/chrome/chrome-registry;1"]
                            .getService(Components.interfaces.nsIChromeRegistry);
        var uri = ios.newURI( chromeURL, null, null );
        var file = fph.getFileFromURLSpec( chr.convertChromeURL( uri ).spec ).clone();
        Utils.log( chromeURL + "\n" + file.path );
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
        Utils.log( dir.path );
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
        Utils.log( serializer.serializeToString( dom ) );
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
      var name, note;
      for each ( var param in params ) {
        Utils.log( "type: '" + param.type + "'" );
        Utils.log( "name: '" + param.name + "'" );
        name = getValidNoteName( category, param.name, param.type );
        Utils.log( "----> '" + name + "'" );
        note = ctx.createNote( book, category, name, param.type );
        Utils.log( note );
      }
    }
  } );

  tests.push(
    {
      name: "Fonts",
      description: "Font's prefs",
      code: function () {
        var fontMapping = Utils.getDefaultFontMapping();
        Utils.log( "default-name: " + fontMapping.defaultName );
        Utils.log( "default-value: " + fontMapping.defaultValue );
        Utils.log( "" );
        Utils.log( "serif: " + fontMapping.generics["serif"] );
        Utils.log( "sans-serif: " + fontMapping.generics["sans-serif"] );
        Utils.log( "cursive: " + fontMapping.generics["cursive"] );
        Utils.log( "fantasy: " + fontMapping.generics["fantasy"] );
        Utils.log( "monospace: " + fontMapping.generics["monospace"] );
        Utils.log( "" );
        Utils.log( "size-variable: " + fontMapping.varSize );
        Utils.log( "size-fixed: " + fontMapping.fixSize );
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
      Utils.log( "screenX = " + screenX );
      Utils.log( "screenY = " + screenY );
      Utils.log( "availLeft = " + availLeft );
      Utils.log( "availTop = " + availTop );
      Utils.log( "outerWidth = " + outerWidth );
      Utils.log( "outerHeight = " + outerHeight );
      Utils.log( "availWidth = " + availWidth );
      Utils.log( "availHeight = " + availHeight );
    }
  } );

  tests.push( {
    name: "Messenger",
    description: "Get message in .eml format",
    code: function () {
      var mWindow = Utils.getMail3PaneWindow();
      if ( !mWindow ) {
        Utils.log( "TB required" );
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
        if ( msgHdr.flags & Components.interfaces.nsMsgMessageFlags.HasRe ) {
          name = ( name ) ? "Re: " + name : "Re: ";
        }
        Utils.log( uri );
        Utils.log( name );
        var streamListener =
          Components.classes["@mozilla.org/network/sync-stream-listener;1"]
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
        Utils.log( plainTextMessage );
      }
    }
  } );

  tests.push( {
    name: "Updater",
    description: "Get updater info",
    code: function () {
      var mgr = ru.akman.znotes.UpdateManager;
      if ( !mgr.isSupported() ) {
        Utils.log( "Update service is not supported." );
        return;
      }
      Utils.log( "Can Update: " + mgr.canUpdate() );
      Utils.log( "Is Active: " + mgr.isActive() );
      if ( mgr.isActive() ) {
        Utils.log( "Update name: " + mgr.getName() );
      }
      switch ( mgr.getState() ) {
        case "default":
          Utils.log( "Check for updates ..." );
          break;
        case "downloading":
          Utils.log( "Downloading updates ..." );
          break;
        case "paused":
          Utils.log( "Resume downloading updates ..." );
          break;
        case "pending":
          Utils.log( "Apply downloaded updates now ..." );
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
            if ( !node.hasAttribute( "disabled" ) ) {
              Utils.log( cmd + " -> ENABLED" );
            }
          }
          node = node.nextSibling;
        }
      };
      process(
        Utils.MAIN_WINDOW.document.getElementById( "znotes_commandset" )
      );
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
        Utils.log( "[" + tests[i] + "]" );
        Utils.log( "=========================")
        Utils.log( "result: [" );
        var result = Utils.getPermutations( tests[i] );
        for ( var j = 0; j < result.length; j++ ) {
          Utils.log( "  " + Object.prototype.toString.call( result ) +
                     "[" + result[j] + "]" );
        }
        Utils.log( "]" );
        Utils.log( "\n")
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
        win = window.open(
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
      Utils.log( params.output.aBook.getName() );
      Utils.log( params.output.aNote.getName() );
    }
  } );

  tests.push( {
    name: "Save note",
    description: "Save note dialog",
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
      Utils.log( params.output.aBook.getName() );
      Utils.log( params.output.aCategory.getName() );
      Utils.log( params.output.aTags );
      Utils.log( params.output.aType );
      Utils.log( params.output.aName );
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
      Utils.log( params.output.aBook.getName() );
      Utils.log( params.output.aCategory.getName() );
    }
  } );
  
  tests.push( {
    name: "Save category",
    description: "Save category dialog",
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
      Utils.log( params.output.aBook.getName() );
      Utils.log( params.output.aCategory.getName() );
      Utils.log( params.output.aName );
      Utils.log( params.output.aTags );
      Utils.log( params.output.aType );
    }
  } );

  tests.push( {
    name: "Show many alerts",
    description: "Show popups by alerts service",
    code: function () {
      var alertsService =
        Components.classes['@mozilla.org/alerts-service;1']
                  .getService( Components.interfaces.nsIAlertsService );
      var observer = {
        observe: function( subject, topic, data ) {
          switch ( topic ) {
            case "alertshow":
              Utils.log( "alertshow: " + data );
              break;
            case "alertclickcallback":
              Utils.log( "alertclickcallback: " + data );
              break;
            case "alertfinished":
              Utils.log( "alertfinished: " + data );
              break;
          }
        }
      };
      for ( var i = 0; i < 5; i++ ) {
        try {
          alertsService.showAlertNotification(
            "chrome://znotes_images/skin/message-32x32.png",
            "POPUP" + i,
            "( =" + i + "= )",
            true,
            "data" + i,
            observer,
            "popup" + i
          );
        } catch ( e ) {
          Utils.log( e );
        }
      }
    }
  } );
  
  tests.push( {
    name: "Show many popups",
    description: "Show popups by window mediator",
    code: function () {
      function showPopup( image, title, text, clickable, cookie, observer, name ) {
        var win = window.open(
          "chrome://global/content/alerts/alert.xul",
          "znotes:popup",
          "chrome,titlebar=no,popup=yes"
        );
        win.arguments = [ image, title, text, clickable, cookie, observer, name ];
      };
      var observer = {
        observe: function( subject, topic, data ) {
          switch ( topic ) {
            case "alertshow":
              Utils.log( "alertshow: " + data );
              break;
            case "alertclickcallback":
              Utils.log( "alertclickcallback: " + data );
              break;
            case "alertfinished":
              Utils.log( "alertfinished: " + data );
              break;
          }
        }
      };
      for ( var i = 0; i < 5; i++ ) {
        showPopup(
          "chrome://znotes_images/skin/message-32x32.png",
          "POPUP" + i,
          "( =" + i + "= )",
          true,
          "data" + i,
          observer,
          "popup" + i
        );
      }
    }
  } );

  tests.push( {
    name: "Parse & Serialize HTML",
    description: "Parse & serialize text/html",
    code: function () {
      var aDOM, aText, anURI, aBaseURI, aPrincipal;
      var tmpBrowser, tmpFile, tmpURL;
      var ioService =
        Components.classes["@mozilla.org/network/io-service;1"]
                  .getService( Components.interfaces.nsIIOService );
      var securityManager =
        Components.classes["@mozilla.org/scriptsecuritymanager;1"]
                  .getService( Components.interfaces.nsIScriptSecurityManager );
      var domParser =
        Components.classes["@mozilla.org/xmlextras/domparser;1"]
                  .createInstance( Components.interfaces.nsIDOMParser );
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
      Utils.log( "SOURCE TEXT:\n" + aText + "\n" );
      anURI = ioService.newURI( "file:///F:\Development/workspace/gecko/znotes/etc/Samples/sample1.html", null, null );
      aBaseURI = ioService.newURI( "file:///F:\Development/workspace/gecko/znotes/etc/Samples/sample1_files/", null, null );
      aPrincipal = securityManager.getCodebasePrincipal( anURI );
      domParser.init( aPrincipal, null /* anURI */, aBaseURI, null );
      aDOM = domParser.parseFromString( aText, "text/html" );
      Utils.log( "SERIALIZED TEXT:\n" + DOMUtils.serializeHTMLToString( aDOM ) + "\n" );
    }
  } );

  tests.push( {
    name: "Split selector",
    description: "Split css selector",
    code: function () {
    
      function splitSelector( selector ) {
        var index = -1;
        do {
          index = selector.indexOf( ":", index + 1 );
        } while ( index > 0 && selector.charAt( index - 1) === "\\" );
        if ( index !== -1 ) {
          return [ selector.substring( 0, index ), selector.substring( index ) ];
        }
        return [ selector, "" ];
      };

      Utils.log( "abc\\:xyz:123\\:456" );
      Utils.log( splitSelector( "abc\\:xyz:123:456" ) );
      Utils.log( "abc:xyz\\:123\\:456" );
      Utils.log( splitSelector( "abc:xyz\\:123\\:456" ) );
      Utils.log( "abc" );
      Utils.log( splitSelector( "abc" ) );
      Utils.log( "abc:xyz" );
      Utils.log( splitSelector( "abc:xyz" ) );
      
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

      Utils.log( "abc" );
      Utils.log( checkName( "abc" ) );

      Utils.log( "br=clear" );
      Utils.log( checkName( "br=clear" ) );

      Utils.log( "fb:like:xxxxx" );
      Utils.log( checkName( "fb:like:xxxxx" ) );
      
    }
  } );

  tests.push( {
    name: "Maximize window",
    description: "Maximize application window",
    code: function () {
      window.maximize();
    }
  } );
  
  return pub;

}();

window.addEventListener( "load"  , function() { ru.akman.znotes.TestSuite.onLoad(); }, false );
window.addEventListener( "close"  , function() { ru.akman.znotes.TestSuite.onClose(); }, false );
