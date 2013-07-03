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

Components.utils.import( "resource://znotes/product.js" , ru.akman.znotes );
Components.utils.import( "resource://znotes/pnglib.js" , ru.akman.znotes );

var EXPORTED_SYMBOLS = ["Utils"];

var Utils = function() {

  var isDebugEnabled = false;
  var isDebugActive = false;
  var isDebugRaised = false;
  var isSanitizeEnabled = true;
  var isAdEnabled = false;
  var isFirstRun = true;
  
  var app_version = ru.akman.znotes.Product.Version;

  var systemInfo = null;

  var application = null;
  var mainWindow = null;
  var stringsBundle = null;
  var isStandalone = true;

  var debugTextBox = null;

  var isSavePosition = true;
  var isEditSourceEnabled = true;
  var isPlaySound = true;
  var isMainMenubarVisible = false;
  var isMainToolbarVisible = true;
  var defaultDocumentType = "application/xhtml+xml";

  function getVersion( addonID, callback ) {
    var aScope = {};
    if ( typeof( Components.classes["@mozilla.org/extensions/manager;1"] ) != 'undefined' ) {
      var extMan = Components.classes["@mozilla.org/extensions/manager;1"]
                             .getService( Components.interfaces.nsIExtensionManager );
      var ext = extMan.getItemForID( addonID );
      ext.QueryInterface( Components.interfaces.nsIUpdateItem );
      callback( ext.version );
      return;
    }
    if ( typeof( Components.utils ) != 'undefined' && typeof( Components.utils.import ) != 'undefined' ) {
      Components.utils.import( "resource://gre/modules/AddonManager.jsm", aScope );
    }
    aScope.AddonManager.getAddonByID( addonID, function( addon ) { if ( addon ) { callback( addon.version ); } } );
  };

  var pub = {

    get IS_DEBUG_ENABLED() {
      return isDebugEnabled;
    },
    
    set IS_DEBUG_ENABLED( value ) {
      isDebugEnabled = value;
    },

    get IS_DEBUG_ACTIVE() {
      return isDebugActive;
    },
    
    set IS_DEBUG_ACTIVE( value ) {
      isDebugActive = value;
    },
    
    get IS_DEBUG_RAISED() {
      return isDebugRaised;
    },
    
    set IS_DEBUG_RAISED( value ) {
      isDebugRaised = value;
    },
    
    get IS_SANITIZE_ENABLED() {
      return isSanitizeEnabled;
    },
    
    set IS_SANITIZE_ENABLED( value ) {
      isSanitizeEnabled = value;
    },

    get IS_AD_ENABLED() {
      return isAdEnabled;
    },
    
    set IS_AD_ENABLED( value ) {
      isAdEnabled = value;
    },
    
    get IS_FIRST_RUN() {
      return isFirstRun;
    },
    
    set IS_FIRST_RUN( value ) {
      isFirstRun = value;
    },
    
    get NAME() {
      return ru.akman.znotes.Product.Name;
    },

    get ID() {
      return ru.akman.znotes.Product.Id;
    },

    get VERSION() {
      getVersion( pub.ID, function( ver ) { app_version = ver; } );
      return app_version;
    },

    get SITE() {
      return ru.akman.znotes.Product.Site;
    },

    get VENDOR() {
      return ru.akman.znotes.Product.Vendor;
    },

    get BUNDLE() {
      return ru.akman.znotes.Product.Bundle;
    },

    get BUILD() {
      return ru.akman.znotes.Product.Build;
    },

    get LANGUAGES() {
      return ru.akman.znotes.Product.ApplicationLanguages.split( "," );
    },

    get SITE_LANGUAGES() {
      return ru.akman.znotes.Product.SiteLanguages.split( "," );
    },

    get LICENSES() {
      return ru.akman.znotes.Product.Licenses;
    },

    get REPOSITORIES() {
      return ru.akman.znotes.Product.Repositories;
    },

    get URLS() {
      return ru.akman.znotes.Product.Urls[ pub.getLanguage() ];
    },

    get CREATORS() {
      return ru.akman.znotes.Product.Creators[ pub.getLanguage() ];
    },

    get CONTRIBUTORS() {
      return ru.akman.znotes.Product.Contributors[ pub.getLanguage() ];
    },

    get CREDITS() {
      return ru.akman.znotes.Product.Credits[ pub.getLanguage() ];
    },

    get TRANSLATORS() {
      return ru.akman.znotes.Product.Translators[ pub.getLanguage() ];
    },

    get COPYRIGHTS() {
      return ru.akman.znotes.Product.Copyrights[ pub.getLanguage() ];
    },

    get TITLE() {
      return ru.akman.znotes.Product.Title[ pub.getLanguage() ];
    },

    get DESCRIPTION() {
      return ru.akman.znotes.Product.Description[ pub.getLanguage() ];
    },

    // C O M M O N  V A L U E S

    get APPLICATION() {
      return application;
    },

    set APPLICATION( value ) {
      application = value;
    },

    get MAIN_WINDOW() {
      return mainWindow;
    },

    set MAIN_WINDOW( value ) {
      mainWindow = value;
    },

    get STRINGS_BUNDLE() {
      return stringsBundle;
    },

    set STRINGS_BUNDLE( value ) {
      stringsBundle = value;
    },

    get IS_STANDALONE() {
      return isStandalone;
    },

    set IS_STANDALONE( value ) {
      isStandalone = value;
    },

    get DEFAULT_DOCUMENT_TYPE() {
      return defaultDocumentType;
    },
    
    set DEFAULT_DOCUMENT_TYPE( value ) {
      defaultDocumentType = value;
    },
    
    get DEBUG_TEXTBOX() {
      return debugTextBox;
    },

    set DEBUG_TEXTBOX( value ) {
      debugTextBox = value;
    },

    // C O M M O N  P R E F E R E N S E S

    get IS_SAVE_POSITION() {
      return isSavePosition;
    },

    set IS_SAVE_POSITION( value ) {
      isSavePosition = value;
    },

    get IS_EDIT_SOURCE_ENABLED() {
      return isEditSourceEnabled;
    },

    set IS_EDIT_SOURCE_ENABLED( value ) {
      isEditSourceEnabled = value;
    },

    get IS_PLAY_SOUND() {
      return isPlaySound;
    },

    set IS_PLAY_SOUND( value ) {
      isPlaySound = value;
    },

    get IS_MAINMENUBAR_VISIBLE() {
      return isMainMenubarVisible;
    },

    set IS_MAINMENUBAR_VISIBLE( value ) {
      isMainMenubarVisible = value;
    },

    get IS_MAINTOOLBAR_VISIBLE() {
      return isMainToolbarVisible;
    },

    set IS_MAINTOOLBAR_VISIBLE( value ) {
      isMainToolbarVisible = value;
    }

  };

  var fontNameArray = null;

  pub.showPopup = function( img, title, text ) {
    try {
      Components.classes['@mozilla.org/alerts-service;1']
                .getService( Components.interfaces.nsIAlertsService )
                .showAlertNotification(
        img,
        title,
        text,
        false,
        '',
        null
      );
    } catch(e) {
    }
  };
  
  pub.dump = function( obj ) {
    var msg = obj.toString() + "\n{\n";
    for ( var name in obj ) {
      msg += "  " + name + " = '" + obj[name] + "',\n";
    }
    msg += "}\n";
    pub.log( msg );
  };

  pub.getStackDump = function() {
    var lines = [];
    for ( var frame = Components.stack; frame; frame = frame.caller ) {
      lines.push( frame.name + " :: " + frame.filename + " (" + frame.lineNumber + ")" );
    }
    lines.splice( 0, 1 );
    return lines.join( "\n" );
  };

  pub.getSystemInfo = function() {
    if ( systemInfo ) {
      return systemInfo;
    }
    var xulRuntime = Components.classes["@mozilla.org/xre/app-info;1"]
                               .getService( Components.interfaces.nsIXULRuntime );
    systemInfo = {};
    systemInfo.OS = xulRuntime.OS;
    systemInfo.widgetToolkit = xulRuntime.widgetToolkit;
    var dnsService = Components.classes["@mozilla.org/network/dns-service;1"]
                               .createInstance( Components.interfaces.nsIDNSService );
    systemInfo.hostName = dnsService.myHostName;
    return systemInfo;
  };

  pub.getPlaceId = function() {
    var placeId = pub.createUUID();
    var directoryService = Components.classes["@mozilla.org/file/directory_service;1"]
                                     .getService( Components.interfaces.nsIProperties );
    var placeEntry = directoryService.get( "Home", Components.interfaces.nsIFile );
    placeEntry.append( ".znotes" );
    if ( !placeEntry.exists() || !placeEntry.isFile() ) {
      placeEntry.create( Components.interfaces.nsIFile.NORMAL_FILE_TYPE, parseInt( "0644", 8 ) );
      pub.writeFileContent( placeEntry, "UTF-8", placeId );
    } else {
      placeId = pub.readFileContent( placeEntry, "UTF-8" );
    }
    return placeId;
  };

  pub.getDataPath = function() {
    var directoryService = Components.classes["@mozilla.org/file/directory_service;1"]
                                     .getService( Components.interfaces.nsIProperties );
    var profileDir = directoryService.get( "ProfD", Components.interfaces.nsIFile );
    var dataPath = profileDir.clone();
    dataPath.append( pub.NAME );
    if ( !dataPath.exists() || !dataPath.isDirectory() ) {
      dataPath.create( Components.interfaces.nsIFile.DIRECTORY_TYPE, parseInt( "0774", 8 ) );
    }
    return dataPath;
  };

  pub.getPlacesPath = function() {
    var placesPath = pub.getDataPath();
    placesPath.append( "places" );
    if ( !placesPath.exists() || !placesPath.isDirectory() ) {
      placesPath.create( Components.interfaces.nsIFile.DIRECTORY_TYPE, parseInt( "0774", 8 ) );
    }
    return placesPath;
  };

  pub.getDriverDirectory = function() {
    var ios = Components.classes["@mozilla.org/network/io-service;1"]
                        .getService( Components.interfaces.nsIIOService );
    var fph = ios.getProtocolHandler( "file" )
                 .QueryInterface( Components.interfaces.nsIFileProtocolHandler );
    var chr = Components.classes["@mozilla.org/chrome/chrome-registry;1"]
                        .getService(Components.interfaces.nsIChromeRegistry);
    var uri = ios.newURI( "chrome://znotes_drivers/content/", null, null );
    return fph.getFileFromURLSpec( chr.convertChromeURL( uri ).spec ).parent.clone();
  };

  pub.getDocumentDirectory = function() {
    var ios = Components.classes["@mozilla.org/network/io-service;1"]
                        .getService( Components.interfaces.nsIIOService );
    var fph = ios.getProtocolHandler( "file" )
                 .QueryInterface( Components.interfaces.nsIFileProtocolHandler );
    var chr = Components.classes["@mozilla.org/chrome/chrome-registry;1"]
                        .getService(Components.interfaces.nsIChromeRegistry);
    var uri = ios.newURI( "chrome://znotes_documents/content/", null, null );
    return fph.getFileFromURLSpec( chr.convertChromeURL( uri ).spec ).parent.clone();
  };
  
  pub.getLocale = function() {
    var aLocale = null;
    try {
      var chromeRegistry = Components.classes ["@mozilla.org/chrome/chrome-registry;1"]
                                     .getService( Components.interfaces.nsIXULChromeRegistry );
      aLocale = chromeRegistry.getSelectedLocale( "znotes" );
    } catch ( e ) {
      aLocale = "en-US";
    }
    return aLocale;
  };

  pub.getLanguage = function() {
    var lang = pub.getLocale().substr( 0, 2 );
    if ( pub.LANGUAGES.indexOf( lang ) < 0 ) {
      return "en";
    }
    return lang;
  };

  pub.getSiteLanguage = function() {
    var lang = pub.getLanguage();
    if ( pub.SITE_LANGUAGES.indexOf( lang ) < 0 ) {
      return "en";
    }
    return lang;
  };

  pub.getTabMail = function() {
    var mail3PaneWindow = pub.getMail3PaneWindow();
    var tabMail = null;
    if ( mail3PaneWindow ) {
      tabMail = mail3PaneWindow.document.getElementById( "tabmail" );
    }
    return tabMail;
  };

  pub.getTabContainer = function() {
    var mail3PaneWindow = pub.getMail3PaneWindow();
    var tabContainer = null;
    if ( mail3PaneWindow ) {
      tabContainer = mail3PaneWindow.document.getElementById( "tabcontainer" );
    }
    return tabContainer;
  };

  pub.getMainTab = function() {
    var tabMail = pub.getTabMail();
    if ( !tabMail ) {
      return null;
    }
    var tabInfo = tabMail.tabInfo;
    var tab = null;
    for ( var i = 0; i < tabInfo.length; i++ ) {
      tab = tabInfo[i];
      if ( tab.mode.type == "znotesMainTab" ) {
        return tab;
      }
    }
    return null;
  };

  pub.getSelectedTab = function() {
    var tabMail = pub.getTabMail();
    if ( !tabMail ) {
      return null;
    }
    var tabContainer = pub.getTabContainer();
    if ( !tabContainer ) {
      return null;
    }
    return tabMail.tabInfo[ tabContainer.selectedIndex ];
  };

  pub.getMail3PaneWindow = function() {
    return Components.classes["@mozilla.org/appshell/window-mediator;1"]
                     .getService( Components.interfaces.nsIWindowMediator )
                     .getMostRecentWindow( "mail:3pane" );
  };

  pub.clone = function( o ) {
	  if( !o || "object" !== typeof o )  {
	  	return o;
	  }
	  var c = "function" === typeof o.pop ? [] : {};
	  for( var p in o ) {
	  	if( o.hasOwnProperty( p ) ) {
	  		var v = o[p];
	  		if( v && "object" === typeof v ) {
	  			c[p] = pub.clone( v );
	  		} else {
          c[p] = v;
        }
	  	}
	  }
	  return c;
  };

  pub.cloneObject = function( from, to ) {
    var modified = false;
	  for ( var p in from ) {
	  	if ( from.hasOwnProperty( p ) ) {
        if ( to.hasOwnProperty( p ) ) {
  	  	  if( from[p] && "object" === typeof from[p] ) {
            if ( !to[p] || "object" !== typeof to[p] ) {
              delete to[p];
              to[p] = "function" === typeof from[p].pop ? [] : {};
              modified = true;
            }
            if ( pub.cloneObject( from[p], to[p] ) ) {
              modified = true;
            }
          } else {
            if ( to[p] != from[p] ) {
              to[p] = from[p];
              modified = true;
            }
          }
        } else {
  	  	  if( from[p] && "object" === typeof from[p] ) {
            to[p] = "function" === typeof from[p].pop ? [] : {};
            if ( pub.cloneObject( from[p], to[p] ) ) {
              modified = true;
            }
          } else {
            to[p] = from[p];
            modified = true;
          }
        }
	  	}
	  }
    for ( var p in to ) {
	  	if ( to.hasOwnProperty( p ) && !from.hasOwnProperty( p ) ) {
        delete to[p];
        modified = true;
      }
    }
	  return modified;
  };
  
  pub.copyObject = function( from, to ) {
    var modified = false;
    for ( var name in from ) {
      if ( name in to ) {
        if ( to[name] != from[name] ) {
          to[name] = from[name];
          modified = true;
        }
      } else {
        to[name] = from[name];
        modified = true;
      }
    }
    for ( var name in to ) {
      if ( name in from ) {
      } else {
        delete to[name];
        modified = true;
      }
    }
    return modified;
  };

  pub.compareObjects = function( from, to ) {
    var modified = false;
    for ( var name in from ) {
      if ( name in to ) {
        if ( to[name] != from[name] ) {
          modified = true;
          break;
        }
      } else {
        modified = true;
        break;
      }
    }
    for ( var name in to ) {
      if ( name in from ) {
      } else {
        modified = true;
        break;
      }
    }
    return modified;
  };

  pub.log = function( aText ) {
    var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                                   .getService( Components.interfaces.nsIConsoleService );
    consoleService.logStringMessage( "[" + pub.NAME + "] " + aText );

    if ( pub.DEBUG_TEXTBOX ) {
      pub.DEBUG_TEXTBOX.value += aText + "\n";
    }

  };

  pub.encodeUTF8 = function( s ) {
    return unescape( encodeURIComponent( s ) );
  };

  pub.decodeUTF8 = function( s ) {
    return decodeURIComponent( escape( s ) );
  };

  pub.lengthUTF8 = function( s ) {
    var result = 0;
    for ( var i = 0; i < s.length; i++ ) {
      var code = s.charCodeAt( i );
      if ( code < 128 ) {
        result++;
      } else if ( code > 127 && code < 2048 ) {
        result += 2;
      } else {
        result += 3;
      }
    }
    return result;
  };
  
  pub.readFileContent = function( entry, encoding ) {
    var data = "";
    var istream = Components.classes["@mozilla.org/network/file-input-stream;1"]
                            .createInstance( Components.interfaces.nsIFileInputStream );
    var cstream = Components.classes["@mozilla.org/intl/converter-input-stream;1"]
                            .createInstance( Components.interfaces.nsIConverterInputStream );
    istream.init( entry, -1, 0, 0 );
    try {
      var isInit = false;
      var enc = encoding ? encoding : "UTF-8";
      while ( !isInit ) {
        try {
          cstream.init(
            istream,
            enc,
            0,
            Components.interfaces.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER
          );
          var str = {};
          var read = 0;
          do {
            read = cstream.readString( parseInt( "0xffffffff", 16 ), str );
            data += str.value;
          } while ( read != 0 );
          isInit = true;
        } catch( e ) {
          pub.log( e );
          if ( enc == "UTF-8" )
            isInit = true;
          enc = "UTF-8";
        }
      }
    } finally {
      cstream.close();
      istream.close();
    }
    return data;
  };

  pub.writeFileContent = function( entry, encoding, data ) {
    var ostream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                             .createInstance( Components.interfaces.nsIFileOutputStream );
    ostream.init(
      entry,
      // PR_WRONLY | PR_CREATE_FILE | PR_TRUNCATE
      parseInt( "0x02", 16 ) | parseInt( "0x08", 16 ) | parseInt( "0x20", 16 ),
      parseInt( "0644", 8 ),
      0
    );
    var cstream = Components.classes["@mozilla.org/intl/converter-output-stream;1"]
                              .createInstance( Components.interfaces.nsIConverterOutputStream );
    try {
      var isInit = false;
      var enc = encoding;
      while ( !isInit ) {
        try {
          cstream.init(
            ostream,
            enc,
            0,
            Components.interfaces.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER
          );
          cstream.writeString( data );
          isInit = true;
        } catch( e ) {
          pub.log( e );
          if ( enc == "UTF-8" )
            isInit = true;
          enc = "UTF-8";
        }
      }
    } finally {
      cstream.close();
      ostream.close();
    }
  };

  pub.createUUID = function() {
    var s = [];
    var hexDigits = "0123456789ABCDEF";
    for ( var i = 0; i < 32; i++ )
      s[i] = hexDigits.substr( Math.floor( Math.random() * parseInt( "0x10", 16 ) ), 1 );
    s[12] = "4";
    s[16] = hexDigits.substr( ( s[16] & parseInt( "0x3", 16 ) ) | parseInt( "0x8", 16 ), 1 );
    return s.join("");
  };

  pub.rgbToHex = function( r, g, b ) {
    var red = r.toString( 16 );
    while ( red.length < 2 ) red = "0" + red;
    var green = g.toString( 16 );
    while ( green.length < 2 ) green = "0" + green;
    var blue = b.toString( 16 );
    while ( blue.length < 2 ) blue = "0" + blue;
    return "#"+red+green+blue;
  };

  pub.makeTagImage = function( color, checked, size ) {
    if ( color == null ) {
      return null;
    }
    var red, green, blue;
    var rgb = /\s*rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)\s*/i.exec( color );
    if ( rgb ) {
      red = parseInt( rgb[1] );
      green = parseInt( rgb[2] );
      blue = parseInt( rgb[3] );
    } else {
      red = parseInt( color.substr( 1, 2 ), 16 );
      green = parseInt( color.substr( 3, 2 ), 16 );
      blue = parseInt( color.substr( 5, 2 ), 16 );
    }
    var sizeX = size;
    var sizeY = size;
    var p = new ru.akman.znotes.PNGLib.PNG( sizeX, sizeY, 256 );
    var background = p.color( 0, 0, 0, 0 );
    var foreground = p.color( red, green, blue );
    for ( var x = 0; x < sizeX; x++ ) {
      for ( var y = 0; y < sizeY; y++ ) {
        p.buffer[ p.index( x, y ) ] = background;
        if ( x == 0 || x == sizeX - 1 || y == 0 || y == sizeY - 1 )
          p.buffer[ p.index( x, y ) ] = foreground;
        if ( x == 1 || x == sizeX - 2 || y == 1 || y == sizeY - 2 )
          p.buffer[ p.index( x, y ) ] = foreground;
        if ( checked && x > 3 && x < sizeX - 4 && y > 3 && y < sizeY - 4 )
          p.buffer[ p.index( x, y ) ] = foreground;
      }
    }
    var result = 'data:image/png;base64,'+p.getBase64();
    return result;
  };

  pub.makeForeColorImage = function( color, size, bcolor ) {
    if ( color == null ) {
      return null;
    }
    var transparent = ( color.toLowerCase() == "transparent" );
    var red, green, blue;
    if ( transparent ) {
      red = 0;
      green = 0;
      blue = 0;
    } else {
      var rgb = /\s*rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)\s*/i.exec( color );
      if ( rgb ) {
        red = parseInt( rgb[1] );
        green = parseInt( rgb[2] );
        blue = parseInt( rgb[3] );
      } else {
        red = parseInt( color.substr( 1, 2 ), 16 );
        green = parseInt( color.substr( 3, 2 ), 16 );
        blue = parseInt( color.substr( 5, 2 ), 16 );
      }
    }
    var sizeX = size;
    var sizeY = size;
    var p = new ru.akman.znotes.PNGLib.PNG( sizeX, sizeY, 256 );
    var foreground = p.color( red, green, blue );
    var bred = 0;
    var bgreen = 0;
    var bblue = 0;
    if ( bcolor ) {
      var brgb = /\s*rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)\s*/i.exec( bcolor );
      if ( brgb ) {
        bred = parseInt( brgb[1] );
        bgreen = parseInt( brgb[2] );
        bblue = parseInt( brgb[3] );
      } else {
        bred = parseInt( bcolor.substr( 1, 2 ), 16 );
        bgreen = parseInt( bcolor.substr( 3, 2 ), 16 );
        bblue = parseInt( bcolor.substr( 5, 2 ), 16 );
      }
    }
    var background = p.color( bred, bgreen, bblue );
    var foretransp = p.color( 105, 105, 105 );
    for ( var x = 0; x < sizeX; x++ ) {
      for ( var y = 0; y < sizeY; y++ ) {
        p.buffer[ p.index( x, y ) ] = background;
        if ( x > 3 && x < sizeX - 4 && y > 3 && y < sizeY - 4 )
          if ( transparent ) {
            if ( x % 2 == 0 || y % 2 == 0 ) {
              p.buffer[ p.index( x, y ) ] = foretransp;
            }
          } else {
            p.buffer[ p.index( x, y ) ] = foreground;
          }
      }
    }
    var result = 'data:image/png;base64,'+p.getBase64();
    return result;
  };

  pub.makeBackColorImage = function( color, size ) {
    if ( color == null ) {
      return null;
    }
    var transparent = ( color.toLowerCase() == "transparent" );
    var red, green, blue;
    if ( transparent ) {
      red = 255;
      green = 255;
      blue = 255;
    } else {
      var rgb = /\s*rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)\s*/i.exec( color );
      if ( rgb ) {
        red = parseInt( rgb[1] );
        green = parseInt( rgb[2] );
        blue = parseInt( rgb[3] );
      } else {
        red = parseInt( color.substr( 1, 2 ), 16 );
        green = parseInt( color.substr( 3, 2 ), 16 );
        blue = parseInt( color.substr( 5, 2 ), 16 );
      }
    }
    var sizeX = size;
    var sizeY = size;
    var p = new ru.akman.znotes.PNGLib.PNG( sizeX, sizeY, 256 );
    var background = p.color( red, green, blue );
    var foreground = p.color( 105, 105, 105 );
    for ( var x = 0; x < sizeX; x++ ) {
      for ( var y = 0; y < sizeY; y++ ) {
        p.buffer[ p.index( x, y ) ] = background;
        if ( transparent && ( x % 2 == 0 || y % 2 == 0 ) ) {
          p.buffer[ p.index( x, y ) ] = foreground;
        }
      }
    }
    var result = 'data:image/png;base64,'+p.getBase64();
    return result;
  };

  pub.addCSSRule = function( doc, selector, declaration ) {
    var styleSheet = doc.styleSheets[0];
    var rule = selector + " { " + declaration + " }";
    styleSheet.insertRule( rule, styleSheet.cssRules.length );
  };

  pub.deleteCSSRule = function( doc, selector ) {
    var index = pub.findCSSRule( doc, selector );
    if ( index != -1 ) {
      var styleSheet = doc.styleSheets[0];
      styleSheet.deleteRule( index );
    }
  };

  pub.findCSSRule = function( doc, selector ) {
    var index = -1;
    var s = selector;
    s = s.toLowerCase();
    // before: treechildren::-moz-tree-cell(TAG_C43735473EA642839B4BAE41783063E8)
    // after: treechildren::-moz-tree-cellTAG_C43735473EA642839B4BAE41783063E8
    s = s.replace( /\(|\)/g, "" );
    var styleSheet = doc.styleSheets[0];
    var rules = styleSheet.cssRules;
    for ( var i = 0; i < rules.length; i++ ) {
      var ruleSelector = rules[i].selectorText;
      if ( ruleSelector ) {
        ruleSelector = ruleSelector.toLowerCase();
        if ( ruleSelector == s ) {
          index = i;
          break;
        }
      }
    }
    return index;
  };

  pub.changeCSSRule = function( doc, selector, declaration ) {
    pub.deleteCSSRule( doc, selector );
    pub.addCSSRule( doc, selector, declaration );
  };

  pub.getFontNameArray = function() {
    if ( fontNameArray == null ) {
      fontNameArray = Components.classes["@mozilla.org/gfx/fontenumerator;1"]
                                .getService( Components.interfaces.nsIFontEnumerator )
                                .EnumerateAllFonts( {} );
    }
    return fontNameArray;
  };

  pub.getDefaultFontMapping = function() {
    var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                          .getService( Components.interfaces.nsIPrefService )
                          .getDefaultBranch( "font." );
    var languageGroup = Components.classes["@mozilla.org/intl/stringbundle;1"]
                                  .getService( Components.interfaces.nsIStringBundleService )
                                  .createBundle( prefs.getCharPref( "language.group" ) )
                                  .GetStringFromName( "font.language.group" );
    var defaultFontName = prefs.getCharPref( "default." + languageGroup );
    var defaultFontValue = prefs.getCharPref( "name." + defaultFontName + "." + languageGroup );
    var serif, sansserif, cursive, fantasy, monospace;
    try {
      serif = prefs.getCharPref( "name.serif." + languageGroup );
    } catch ( e ) {
      serif = defaultFontValue;
    }
    try {
      sansserif = prefs.getCharPref( "name.sans-serif." + languageGroup );
    } catch ( e ) {
      sansserif = defaultFontValue;
    }
    try {
      cursive = prefs.getCharPref( "name.cursive." + languageGroup );
    } catch ( e ) {
      cursive = defaultFontValue;
    }
    try {
      fantasy = prefs.getCharPref( "name.fantasy." + languageGroup );
    } catch ( e ) {
      fantasy = defaultFontValue;
    }
    try {
      monospace = prefs.getCharPref( "name.monospace." + languageGroup );
    } catch ( e ) {
      monospace = defaultFontValue;
    }
    var varSize, fixSize;
    try {
      varSize = prefs.getIntPref( "size.variable." + languageGroup );
    } catch ( e ) {
      varSize = 16;
    }
    try {
      fixSize = prefs.getIntPref( "size.fixed." + languageGroup );
    } catch ( e ) {
      fixSize = 13;
    }
    return {
      generics: {
        "serif"      : serif,
        "sans-serif" : sansserif,
        "cursive"    : cursive,
        "fantasy"    : fantasy,
        "monospace"  : monospace
      },
      "defaultName"  : defaultFontName,
      "defaultValue" : defaultFontValue,
      "varSize" : varSize,
      "fixSize" : fixSize
    };
  };
  
  pub.getEntryIcon = function( entry, size ) {
    if ( !entry.exists() || entry.isDirectory() ) {
      return null;
    }
    var fph = Components.classes["@mozilla.org/network/io-service;1"]
                        .getService( Components.interfaces.nsIIOService )
                        .getProtocolHandler( "file" )
                        .QueryInterface( Components.interfaces.nsIFileProtocolHandler );
    var urlSpec = fph.getURLSpecFromFile( entry );
    return "moz-icon://" + urlSpec + "?size=" + size;
  };

  pub.getMimeTypeIcon = function( mimeType, size ) {
    return "moz-icon://goat?size=" + size + "&contentType=" + mimeType;
  };

  pub.getExtensionIcon = function( ext, size ) {
    return "moz-icon://goat." + ext + "?size=" + size;
  };
  
  pub.openURI = function( uri, force, win, title ) {
    if ( force === undefined ) {
      force = false;
    }
    var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                              .getService( Components.interfaces.nsIIOService );
    var fph = ioService.getProtocolHandler( "file" )
                       .QueryInterface( Components.interfaces.nsIFileProtocolHandler );
    var mimeService = Components.classes["@mozilla.org/mime;1"]
                                .getService( Components.interfaces.nsIMIMEService );
    if ( !( uri instanceof Components.interfaces.nsIURI ) ) {
      uri = ioService.newURI( uri, null, null );
    }
    var contentType = "unknown";
    var file = null;
    if ( uri.schemeIs( "file" ) ) {
      file = fph.getFileFromURLSpec( uri.spec );
      if ( file && file.exists() && !file.isDirectory() ) {
        var i = file.leafName.lastIndexOf( "." );
        var ext = "";
        if ( i >= 0 ) {
          ext = file.leafName.substr( i + 1 );
          try {
            contentType = mimeService.getTypeFromExtension( ext );
          } catch ( e ) {
            // pub.log( e ); // NS_ERROR_NOT_AVAILABLE
          }
        }
      } else {
        throw {
          name: "openURI",
          message: "File does not exist."
        };
        return;
      }
    } else {
      try {
        contentType = mimeService.getTypeFromURI( uri );
      } catch ( e ) {
        // pub.log( e ); // NS_ERROR_NOT_AVAILABLE
      }
    }
    var mimeInfo = mimeService.getFromTypeAndExtension( contentType, ext );
    var handlerService = Components.classes["@mozilla.org/uriloader/handler-service;1"]
                                   .getService(Components.interfaces.nsIHandlerService);
    if ( !mimeInfo.preferredApplicationHandler || force ) {
      var params = {};
      params.title = title;
      params.description = null;
      params.filename = null;
      params.handlerApp = null;
      params.mimeInfo = mimeInfo;
      try {
        win.openDialog(
          "chrome://global/content/appPicker.xul",
          null,
          "chrome,modal,centerscreen,titlebar,dialog=yes",
          params
        );
      } catch ( e ) {
        return;
      }
      if ( !params.handlerApp || !params.handlerApp.executable ) {
        return;
      }
      try {
        if ( params.handlerApp.executable.isFile() ) {
          mimeInfo.preferredApplicationHandler = params.handlerApp;
          mimeInfo.alwaysAskBeforeHandling = false;
          mimeInfo.preferredAction = Components.interfaces.nsIHandlerInfo.useHelperApp;
          handlerService.store( mimeInfo );
        }
      } catch ( e ) {
        return;
      }
    }
    if ( file ) {
      mimeInfo.launchWithFile( file );
    } else {
      mimeInfo.preferredApplicationHandler.launchWithURI( uri );
    }
  };

  pub.saveContent = function( doc, fileEntry, dirEntry, mime, onsave, onerror ) {
    var ciWBP = Components.interfaces.nsIWebBrowserPersist;
    var ciWPL = Components.interfaces.nsIWebProgressListener;
    var ciSWR = Components.interfaces.nsISupportsWeakReference;
    var ciS = Components.interfaces.nsISupports;
    var webBrowserPersist =
      Components.classes["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"]
                .createInstance( ciWBP );
                
    /*
    PERSIST_STATE_READY       Persister is ready to save data.
    PERSIST_STATE_SAVING      Persister is saving data.
    PERSIST_STATE_FINISHED    Persister has finished saving data.
    */
    /*
    ENCODE_FLAGS_SELECTION_ONLY            Output only the current selection as opposed to the whole document.
    ENCODE_FLAGS_FORMATTED2                For plain text output. Convert html to plain text that looks like the html. Implies wrap (except inside <pre>), since html wraps. HTML output: always do prettyprinting, ignoring existing formatting.
    ENCODE_FLAGS_RAW                       Output without formatting or wrapping the content. This flag may be used to preserve the original formatting as much as possible.
    ENCODE_FLAGS_BODY_ONLY                 Output only the body section, no HTML tags.
    ENCODE_FLAGS_PREFORMATTED              Wrap even if when not doing formatted output (for example for text fields).
    ENCODE_FLAGS_WRAP                      Wrap documents at the specified column.
    ENCODE_FLAGS_FORMAT_FLOWED             For plain text output. Output for format flowed (RFC 2646). This is used when converting to text for mail sending. This differs just slightly but in an important way from normal formatted, and that is that lines are space stuffed. This can't (correctly) be done later.
    ENCODE_FLAGS_ABSOLUTE_LINKS            Convert links to absolute links where possible.
    ENCODE_FLAGS_ENCODE_W3C_ENTITIES       Attempt to encode entities standardized at W3C (HTML, MathML, and so on.). This is a catch-all flag for documents with mixed contents. Beware of interoperability issues. See below for other flags which might likely do what you want.
    ENCODE_FLAGS_CR_LINEBREAKS             Output with carriage return line breaks. May also be combined with ENCODE_FLAGS_LF_LINEBREAKS and if neither is specified, the platform default format is used.
    ENCODE_FLAGS_LF_LINEBREAKS             Output with linefeed line breaks. May also be combined with ENCODE_FLAGS_CR_LINEBREAKS and if neither is specified, the platform default format is used.
    ENCODE_FLAGS_NOSCRIPT_CONTENT          For plain text output. Output the content of noscript elements.
    ENCODE_FLAGS_NOFRAMES_CONTENT          For plain text output. Output the content of noframes elements.
    ENCODE_FLAGS_ENCODE_BASIC_ENTITIES     Encode basic entities, for example output   instead of character code 0xa0. The basic set is just   & < > " for interoperability with older products that don't support ? and friends.
    ENCODE_FLAGS_ENCODE_LATIN1_ENTITIES    Encode Latin1 entities. This includes the basic set and accented letters between 128 and 255.
    ENCODE_FLAGS_ENCODE_HTML_ENTITIES      Encode HTML4 entities. This includes the basic set, accented letters, Greek letters and certain special markup symbols.
    */
    /*
    PERSIST_FLAGS_NONE                           No special persistence behavior.
    PERSIST_FLAGS_FROM_CACHE                     Only use cached data (could result in failure if data is not cached).
  + PERSIST_FLAGS_BYPASS_CACHE                   Bypass the cached data.
    PERSIST_FLAGS_IGNORE_REDIRECTED_DATA         Ignore any redirected data (usually adverts).
    PERSIST_FLAGS_IGNORE_IFRAMES                 Ignore iframe content (usually adverts).
    PERSIST_FLAGS_NO_CONVERSION                  Do not run the incoming data through a content converter for example to decompress it.
  + PERSIST_FLAGS_REPLACE_EXISTING_FILES         Replace existing files on the disk (use with due diligence!)
    PERSIST_FLAGS_NO_BASE_TAG_MODIFICATIONS      Don't modify or add base tags.
  + PERSIST_FLAGS_FIXUP_ORIGINAL_DOM             Make changes to original DOM rather than cloning nodes.
    PERSIST_FLAGS_FIXUP_LINKS_TO_DESTINATION     Fix links relative to destination location (not origin)
    PERSIST_FLAGS_DONT_FIXUP_LINKS               Do not make any adjustments to links.
    PERSIST_FLAGS_SERIALIZE_OUTPUT               Force serialization of output (one file at a time; not concurrent)
    PERSIST_FLAGS_DONT_CHANGE_FILENAMES          Don't make any adjustments to filenames.
    PERSIST_FLAGS_FAIL_ON_BROKEN_LINKS           Fail on broken in-line links.
    PERSIST_FLAGS_CLEANUP_ON_FAILURE             Automatically cleanup after a failed or cancelled operation, deleting all created files and directories. This flag does nothing for failed upload operations to remote servers.
  + PERSIST_FLAGS_AUTODETECT_APPLY_CONVERSION    Let the WebBrowserPersist decide whether the incoming data is encoded and whether it needs to go through a content converter, for example to decompress it. Requires Gecko 1.8
    PERSIST_FLAGS_APPEND_TO_FILE                 Append the downloaded data to the target file. This can only be used when persisting to a local file. Requires Gecko 1.9
    PERSIST_FLAGS_FORCE_ALLOW_COOKIES            Force relevant cookies to be sent with this load even if normally they wouldn't be.
    */
    var persistFlags =
      ciWBP.PERSIST_FLAGS_FIXUP_ORIGINAL_DOM |
      ciWBP.PERSIST_FLAGS_BYPASS_CACHE |
      ciWBP.PERSIST_FLAGS_REPLACE_EXISTING_FILES |
      ciWBP.PERSIST_FLAGS_AUTODETECT_APPLY_CONVERSION;
    var encodingFlags = null;
    var progressListener = {
      QueryInterface: function( aIID ) {
        if ( aIID.equals( ciWPL ) || aIID.equals( ciSWR ) || aIID.equals( ciS ) ) {
          return this;
        }
        throw Components.results.NS_NOINTERFACE;
      },
      onStateChange: function( aWebProgress, aRequest, aStateFlags, aStatus ) {
        if ( aStateFlags & ciWPL.STATE_IS_NETWORK && aStateFlags & ciWPL.STATE_STOP ) {
          webBrowserPersist.progressListener = null;
          if ( !Components.isSuccessCode( aStatus ) ) {
            onerror( pub.getErrorName( aStatus ) );
          } else {
            onsave();
          }
        }
        return 0;
      },
      onLocationChange: function( aWebProgress, aRequest, aLocation, aFlags ) {
        return 0;
      },
      onProgressChange: function( aWebProgress, aRequest, aCurSelfProgress, aMaxSelfProgress, aCurTotalProgress, aMaxTotalProgress ) {
        return 0;
      },
      onSecurityChange: function( aWebProgress, aRequest, aState ) {
        return 0;
      },
      onStatusChange: function( aWebProgress, aRequest, aStatus, aMessage ) {
        return 0;
      }
    };
    webBrowserPersist.persistFlags = persistFlags;
    webBrowserPersist.progressListener = progressListener;
    webBrowserPersist.saveDocument(
      doc,
      fileEntry,
      dirEntry,
      mime,
      encodingFlags,
      null
    );
  };

  pub.fixupContent = function( dom, dirEntry ) {
    pub.fixupLinks( dom, dirEntry );
  };

  pub.fixupLinks = function( dom, dirEntry ) {
    var href = dirEntry.leafName + "/";
    var result = false;
    // <img src="xxx" ... />
    var tags = dom.getElementsByTagName( "img" );
    for ( var i = 0; i < tags.length; i++ ) {
      var tag = tags[i];
      if ( tag.hasAttribute( "src" ) ) {
        var source = tag.getAttribute( "src" );
        var index = source.indexOf( href );
        if ( index >= 0 ) {
          source = source.substring( index + href.length );
          tag.setAttribute( "src", source );
          result = true;
        }
      }
    }
    // <script src="xxx" ... />
    tags = dom.getElementsByTagName( "script" );
    for ( var i = 0; i < tags.length; i++ ) {
      var tag = tags[i];
      if ( tag.hasAttribute( "src" ) ) {
        var source = tag.getAttribute( "src" );
        var index = source.indexOf( href );
        if ( index >= 0 ) {
          source = source.substring( index + href.length );
          tag.setAttribute( "src", source );
          result = true;
        }
      }
    }
    // <link type="text/css" href="xxx" ... />
    tags = dom.getElementsByTagName( "link" );
    for ( var i = 0; i < tags.length; i++ ) {
      var tag = tags[i];
      if ( tag.hasAttribute( "type") && tag.getAttribute( "type") == "text/css" ) {
        if ( tag.hasAttribute( "href" ) ) {
          var source = tag.getAttribute( "href" );
          var index = source.indexOf( href );
          if ( index >= 0 ) {
            source = source.substring( index + href.length );
            tag.setAttribute( "href", source );
            result = true;
          }
        }
      }
    }
    // <input type="image" src="xxx" ... />
    tags = dom.getElementsByTagName( "input" );
    for ( var i = 0; i < tags.length; i++ ) {
      var tag = tags[i];
      if ( tag.hasAttribute( "type") && tag.getAttribute( "type") == "image" ) {
        if ( tag.hasAttribute( "src" ) ) {
          var source = tag.getAttribute( "src" );
          var index = source.indexOf( href );
          if ( index >= 0 ) {
            source = source.substring( index + href.length );
            tag.setAttribute( "src", source );
            result = true;
          }
        }
      }
    }
    // <iframe src="xxx" ... />
    tags = dom.getElementsByTagName( "iframe" );
    for ( var i = 0; i < tags.length; i++ ) {
      var tag = tags[i];
      if ( tag.hasAttribute( "src" ) ) {
        var source = tag.getAttribute( "src" );
        var index = source.indexOf( href );
        if ( index >= 0 ) {
          source = source.substring( index + href.length );
          tag.setAttribute( "src", source );
          result = true;
        }
      }
    }
    return result;
  };

  pub.loadResource = function( url, fileEntry, ondone ) {
    var XMLHttpRequest = Components.Constructor( "@mozilla.org/xmlextras/xmlhttprequest;1" );
    var request = XMLHttpRequest();
    var onError = function() {
      request.removeEventListener( "load", onLoad, false );
      request.removeEventListener( "error", onError, false );
      request.removeEventListener( "abort", onAbort, false );
      ondone( url, fileEntry, -1 );
    };
    var onAbort = function() {
      request.removeEventListener( "load", onLoad, false );
      request.removeEventListener( "error", onError, false );
      request.removeEventListener( "abort", onAbort, false );
      ondone( url, fileEntry, -2 );
    };
    var onLoad = function() {
      if ( !request.response ) {
        onError();
        return;
      }
      var uint8Array = new Uint8Array( request.response );
      var data = "";
      for( var i = 0; i < uint8Array.length; i++ ) {
        data += String.fromCharCode( uint8Array[i] );
      }
      var ostream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                              .createInstance( Components.interfaces.nsIFileOutputStream );
      try {
        ostream.init(
          fileEntry,
          // PR_WRONLY | PR_CREATE_FILE | PR_TRUNCATE
          parseInt( "0x02", 16 ) | parseInt( "0x08", 16 ) | parseInt( "0x20", 16 ),
          parseInt( "0755", 8 ),
          0
        );
        ostream.write( data, data.length );
        ostream.close();
      } catch ( e ) {
        pub.log( e );
        ostream.close();
        onError();
        return;
      }
      request.removeEventListener( "load", onLoad, false );
      request.removeEventListener( "error", onError, false );
      request.removeEventListener( "abort", onAbort, false );
      ondone( url, fileEntry, 0 );
    };
    request.addEventListener( "load", onLoad, false );
    request.addEventListener( "error", onError, false );
    request.addEventListener( "abort", onError, false );
    try {
      request.open( "GET", url );
      request.responseType = "arraybuffer";
      request.send( null );
    } catch ( e ) {
      pub.log( e );
      onError();
    }
  };
  
  // https://bugzilla.mozilla.org/show_bug.cgi?id=115107
  // Bug 115107 - CSS not fixed up by webbrowserpersist.
  pub.inlineStyles = function( dom, dirEntry, onsave ) {
    var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                              .getService( Components.interfaces.nsIIOService );
    var processStyleSheet = function( sheet, rules, urls, dir, onloadresource ) {
      var rulesCount = 0;
      try {
        rulesCount = sheet.cssRules.length;
      } catch ( e ) {
      }
      var current = sheet;
      var href = current.href;
      while ( !href ) {
        if ( current.parentStyleSheet ) {
          current = current.parentStyleSheet;
          href = current.href;
        } else {
          href = dom.documentURI;
        }
      }
      var sheetURI = ioService.newURI( href, null, null );
      var commentFlag = false;
      for ( var j = 0; j < rulesCount; j++ ) {
        var rule = sheet.cssRules[j];
        // NOT IMPORT_RULE
        if ( !commentFlag && rule.type != 3 ) {
          commentFlag = true;
          rules.push( "/* " + sheetURI.spec + " */" );
        }
        switch ( rule.type ) {
          case 3: // IMPORT_RULE
            if ( rule.styleSheet ) {
              processStyleSheet( rule.styleSheet, rules, urls, dir, onloadresource );
            }
            break;
          case 4: // MEDIA_RULE
            rules.push( rule.cssText );
            break;
          case 5: // FONT_FACE_RULE
            rules.push( rule.cssText );
            break;
          case 1: // STYLE_RULE
          case 6: // PAGE_RULE
            var style = rule.style;
            var propertiesCount = style.length;
            var urlFlag = false;
            var cssText = rule.selectorText + " {";
            for ( var k = 0; k < propertiesCount; k++ ) {
              var name = style[k];
              var value = style.getPropertyValue( name );
              var priority = style.getPropertyPriority( name );
              var urlRes = /^(url\(\")(.+)(\"\))$/i.exec( value );
              if ( urlRes ) {
                urlFlag = true;
                var url = sheetURI.resolve( urlRes[2] );
                if ( ! ( url in urls ) ) {
                  var uri = ioService.newURI( url, null, null );
                  var fileName = uri.path.substr( uri.path.lastIndexOf( "/" ) + 1 );
                  var index = fileName.indexOf( "?" );
                  fileName = index < 0 ? fileName : fileName.substring( 0, index );
                  var fileEntry = dirEntry.clone();
                  fileEntry.append( fileName );
                  while ( fileEntry.exists() && !fileEntry.isDirectory() ) {
                    fileName = "_" + fileName;
                    fileEntry = dirEntry.clone();
                    fileEntry.append( fileName );                  
                  }
                  urls[url] = fileEntry;
                  urls.length++;
                  pub.loadResource( url, fileEntry, onloadresource );
                }
                value = 'url( "' + urls[url].leafName + '" )';
              }
              cssText += " " + name + ": " + value + ( priority == "" ? "" : " " + priority ) + ";"; 
            }
            cssText += " }";
            rules.push( urlFlag ? cssText : rule.cssText );
            break;
          default: // UNKNOWN
            rules.push( rule.cssText );
            break;
        }
      }
      if ( sheet.ownerNode ) {
        sheet.ownerNode.parentNode.removeChild( sheet.ownerNode );
      }
    };
    //
    var saveFlag = false;
    var urls = {};
    urls.length = 0;
    var onLoadResource = function( url, entry, result ) {
      if ( url in urls ) {
        delete urls[url];
        urls.length--;
        if ( urls.length == 0 ) {
          if ( !saveFlag ) {
            saveFlag = true;
            onsave();
          }
        }
      }
    };
    //
    var rules = [];
    for ( var i = 0; i < dom.styleSheets.length; i++ ) {
      processStyleSheet( dom.styleSheets[i], rules, urls, dirEntry, onLoadResource );
    }
    if ( rules.length == 0 ) {
      if ( !saveFlag ) {
        saveFlag = true;
        onsave();
      }
      return;
    }
    var style = dom.createElement( "style" );
    style.textContent += "\n";
    for ( var i = 0; i < rules.length; i++ ) {
      style.textContent += "      " + rules[i] + "\n";
    }
    style.textContent += "    ";
    dom.head.appendChild( style );
    if ( urls.length == 0 ) {
      if ( !saveFlag ) {
        saveFlag = true;
        onsave();
      }
    }
  };
  
  /**
   * @see /chrome/comm/content/communicator/contentAreaClick.js
   *
   * Extract the href from the link click event.
   * We look for HTMLAnchorElement, HTMLAreaElement, HTMLLinkElement,
   * HTMLInputElement.form.action, and nested anchor tags.
   *
   * @return href for the url being clicked
   */
  pub.getHREFForClickEvent = function( aEvent, aDontCheckInputElement ) {
    var href = null;
    var target = aEvent.target;
    var name = target.nodeName.toLowerCase();
    if ( name == "a" || name == "area" || name == "link" ) {
      if ( target.hasAttribute( "href" ) ) {
        href = target.href;
      }
    } else if ( !aDontCheckInputElement && name == "input" ) {
      if ( target.form && target.form.action ) {
        href = target.form.action;
      }
    } else {
      // we may be nested inside of a link node
      var linkNode = aEvent.originalTarget;
      while ( linkNode && !( linkNode.nodeName.toLowerCase() == "a" ) ) {
        linkNode = linkNode.parentNode;
      }
      if ( linkNode ) {
        href = linkNode.href;
      }
    }
    return href;
  };

  /**
   * @see /chrome/comm/content/communicator/contentAreaClick.js
   *
   * Forces a url to open in an external application according to the protocol
   * service settings.
   *
   * @param url  A url string or an nsIURI containing the url to open.
   */
  pub.openLinkExternally = function( url ) {
    var uri = url;
    if ( !( uri instanceof Components.interfaces.nsIURI ) ) {
      uri = Components.classes["@mozilla.org/network/io-service;1"]
                      .getService( Components.interfaces.nsIIOService )
                      .newURI( url, null, null );
    }
    Components.classes["@mozilla.org/uriloader/external-protocol-service;1"]
              .getService( Components.interfaces.nsIExternalProtocolService )
              .loadUrl( uri );
  };

  pub.clickHandler = function( aEvent ) {
    if ( !aEvent.isTrusted || aEvent.getPreventDefault() || aEvent.button ) {
      return true;
    }
    var href = pub.getHREFForClickEvent( aEvent, true );
    if ( !href ) {
      return true;
    }
    var svc = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"]
                        .getService( Components.interfaces.nsIExternalProtocolService );
    var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                              .getService( Components.interfaces.nsIIOService );
    var uri = ioService.newURI( href, null, null );
    if ( uri.schemeIs( "znotes" ) ) {
      aEvent.stopPropagation();
      aEvent.preventDefault();
      return pub.openNoteLink( href );
    } else if ( uri.schemeIs( "chrome" ) ) {
      aEvent.stopPropagation();
      aEvent.preventDefault();
      return false;
    } else {
      aEvent.preventDefault();
      pub.openLinkExternally( href );
      return true;
    }
  };

  pub.openNoteLink = function( href ) {
    return true;
  };

  pub.getErrorName = function( code ) {
    var results = Components.results;
    for ( var name in results ) {
      if ( results[name] == "" + code ) {
        return name;
      }
    }
    return "" + code;
  };

  return pub;

}();
