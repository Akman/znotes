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

const EXPORTED_SYMBOLS = ["Clipper"];

var Cc = Components.classes;
var Ci = Components.interfaces;
var Cr = Components.results;
var Cu = Components.utils;

if ( !ru ) var ru = {};
if ( !ru.akman ) ru.akman = {};
if ( !ru.akman.znotes ) ru.akman.znotes = {};

Cu.import( "resource://znotes/utils.js", ru.akman.znotes );
Cu.import( "resource://znotes/cssutils.js", ru.akman.znotes );
Cu.import( "resource://znotes/domevents.js", ru.akman.znotes );

var Utils = ru.akman.znotes.Utils;
var CSSUtils = ru.akman.znotes.CSSUtils;
var DOMEvents = ru.akman.znotes.DOMEvents;

var log = Utils.getLogger( "modules.clipper" );

var HTML5NS = CSSUtils.Namespaces.knowns["html"];
var DOMEventHandlers = DOMEvents.getEventHandlers();

var ioService = Cc["@mozilla.org/network/io-service;1"].getService(
  Ci.nsIIOService );
var chromeService = Cc["@mozilla.org/chrome/chrome-registry;1"].getService(
  Ci.nsIChromeRegistry );
var mimeService = Cc["@mozilla.org/mime;1"].getService(
  Ci.nsIMIMEService );

// Substitution

function Substitution() {
  this.mTags = {};
}
Substitution.prototype = {
  add: function( namespaceURI, localName, substitute ) {
    this.mTags[localName] = {};
    this.mTags[localName][namespaceURI] = {
      namespaceURI: substitute.namespaceURI,
      localName: substitute.localName,
      className: substitute.className
    };
  },
  get: function( tag, flag ) {
    var result = null;
    var namespaceURI = tag.namespaceURI ? tag.namespaceURI.toLowerCase() : "";
    var localName = tag.localName.toLowerCase();
    if ( localName in this.mTags ) {
      result = {
        elementInfo: null,
        className: null
      };
      if ( namespaceURI ) {
        if ( !this.mTags[localName][namespaceURI].className && flag ) {
          this.mTags[localName][namespaceURI].className =
            localName.replace( /\:/g, "-" ) + "-" + createUUID();
        }
        result.className = this.mTags[localName][namespaceURI].className;
        result.elementInfo = {
          namespaceURI: this.mTags[localName][namespaceURI].namespaceURI,
          localName: this.mTags[localName][namespaceURI].localName
        };
      } else {
        if ( !this.mTags[localName].className && flag ) {
          this.mTags[localName].className =
            localName.replace( /\:/g, "-" ) + "-all-ns-" + createUUID();
        }
        result.className = this.mTags[localName].className;
      }
    }
    return result;
  }
}
Substitution.create = function() {
  return new Substitution();
}

// HELPERS

function createHTML5Substitutes( aSubstitution ) {
  // an article in the document
  aSubstitution.add( HTML5NS, "article", {
    namespaceURI: HTML5NS,
    localName: "div",
    className: null
  } );
  // content aside from the page content
  aSubstitution.add( HTML5NS, "aside", {
    namespaceURI: HTML5NS,
    localName: "div",
    className: null
  } );
  // additional details that the user can view or hide
  aSubstitution.add( HTML5NS, "details", {
    namespaceURI: HTML5NS,
    localName: "div",
    className: null
  } );
  // a caption for a <figure> element
  aSubstitution.add( HTML5NS, "figcaption", {
    namespaceURI: HTML5NS,
    localName: "h3",
    className: null
  } ),
  // self-contained content, like illustrations, etc.
  aSubstitution.add( HTML5NS, "figure", {
    namespaceURI: HTML5NS,
    localName: "div",
    className: null
  } );
  // a footer for the document or a section
  aSubstitution.add( HTML5NS, "footer", {
    namespaceURI: HTML5NS,
    localName: "div",
    className: null
  } );
  // header for the document or a section
  aSubstitution.add( HTML5NS, "header", {
    namespaceURI: HTML5NS,
    localName: "div",
    className: null
  } );
  // the main content of a document
  aSubstitution.add( HTML5NS, "main", {
    namespaceURI: HTML5NS,
    localName: "div",
    className: null
  } );
  // marked or highlighted text
  aSubstitution.add( HTML5NS, "mark", {
    namespaceURI: HTML5NS,
    localName: "strong",
    className: null
  } );
  // navigation links in the document
  aSubstitution.add( HTML5NS, "nav", {
    namespaceURI: HTML5NS,
    localName: "div",
    className: null
  } );
  // a section in the document
  aSubstitution.add( HTML5NS, "section", {
    namespaceURI: HTML5NS,
    localName: "div",
    className: null
  } );
  // a visible heading for a <details> element
  aSubstitution.add( HTML5NS, "summary", {
    namespaceURI: HTML5NS,
    localName: "h3",
    className: null
  } );
  // a possible line-break
  aSubstitution.add( HTML5NS, "wbr", {
    namespaceURI: HTML5NS,
    localName: "br",
    className: null
  } );
  // an example of a code in the document
  aSubstitution.add( HTML5NS, "xmp", {
    namespaceURI: HTML5NS,
    localName: "pre",
    className: null
  } );
};

function getErrorName( code ) {
  for ( var name in Cr ) {
    if ( Cr[name] == "" + code ) {
      return name;
    }
  }
  var e = new Components.Exception( "", code );
  if ( e.name ) {
    return e.name;
  }
  return "0x" + Number( code ).toString( 16 ).toUpperCase();
};

function createUUID() {
  var s = [], hexDigits = "0123456789ABCDEF";
  for ( var i = 0; i < 32; i++ ) {
    s[i] = hexDigits.substr(
      Math.floor( Math.random() * parseInt( "0x10", 16 ) ), 1 );
  }
  s[12] = "4";
  s[16] = hexDigits.substr(
    ( s[16] & parseInt( "0x3", 16 ) ) | parseInt( "0x8", 16 ), 1 );
  return s.join( "" );
};

function serializeXMLToString( dom ) {
  return Cc["@mozilla.org/xmlextras/xmlserializer;1"].createInstance(
    Ci.nsIDOMSerializer ).serializeToString( dom );
};

function serializeHTMLToString( dom ) {
  var documentEncoder =
    Cc["@mozilla.org/layout/documentEncoder;1?type=text/html"]
    .createInstance( Ci.nsIDocumentEncoder );
  documentEncoder.init( dom, "text/html",
    Ci.nsIDocumentEncoder.OutputLFLineBreak |
    Ci.nsIDocumentEncoder.OutputRaw
  );
  documentEncoder.setCharset( "utf-8" );
  return documentEncoder.encodeToString();
};

function getFileURI( file ) {
  var fph = ioService.getProtocolHandler( "file" ).QueryInterface(
    Ci.nsIFileProtocolHandler );
  return fph.newFileURI( file ).QueryInterface( Ci.nsIURL );
};

function resolveURL( url, href ) {
  var result, uri;
  try {
    uri = ioService.newURI( href, null, null );
    result = uri.resolve( url );
  } catch ( e ) {
    log.warn( e + "\n" + Utils.dumpStack() );
    result = url;
  }
  return result;
};

function checkURL( url ) {
  var uri;
  try {
    uri = ioService.newURI( url, null, null );
  } catch ( e ) {
    uri = ioService.newURI( "about:blank", null, null );
  }
  return ( uri.scheme.toLowerCase() !== "about" );
};

function getValidFileNameChunk( name ) {
  name = decodeURIComponent( name );
  name = name.replace( /\u005C/g, "\u0000" )  // '\'
             .replace( /\u002F/g, "\u0000" )  // '/'
             .replace( /\u003A/g, "\u0000" )  // ':'
             .replace( /\u002A/g, "\u0000" )  // '*'
             .replace( /\u003F/g, "\u0000" )  // '?'
             .replace( /\u0022/g, "\u0000" )  // '"'
             .replace( /\u003C/g, "\u0000" )  // '<'
             .replace( /\u003E/g, "\u0000" )  // '>'
             .replace( /\u007C/g, "\u0000" ); // '|'
             /*
             .replace( /[\"\?!~`]+/g,    "" )
             .replace( /[\*\&]+/g,      "+" )
             .replace( /[\\\/\|\:;]+/g, "-" )
             .replace( /[\<]+/g,        "(" )
             .replace( /[\>]+/g,        ")" )
             .replace( /[\s]+/g,        "_" )
             .replace( /[%]+/g,         "@" )
             */
  name = name.split( "\u0000" );
  return name[name.length - 1];
};

// TODO: must returns URL-encoded name
function getSuitableFileName( url, contentType, defaultType ) {
  var uri = ioService.newURI( url, null, null );
  var query, name, mime, path, ext, mime_ext, index;
  if ( uri.scheme.toLowerCase() === "mailbox" ) {
    mime = ( contentType ? contentType : ( defaultType ? defaultType : "" ) );
    try {
      uri.QueryInterface( Ci.nsIURL );
      name = getValidFileNameChunk( uri.fileBaseName );
      ext = getValidFileNameChunk( uri.fileExtension );
      query = uri.query.split( "&" );
      for ( var i = 0; i < query.length; i++ ) {
        index = query[i].toLowerCase().indexOf( "filename=" );
        if ( index === 0 ) {
          name = decodeURIComponent( query[i].substring( index + 9 ) );
          index = name.lastIndexOf( "." );
          if ( index === -1 ) {
            ext = "";
          } else {
            ext = name.substring( index + 1 );
            name = name.substring( 0, index );
          }
          break;
        }
      }
    } catch ( e ) {
      name = "";
      ext = "";
    }
    if ( !name.length ) {
      name = "noname_" + createUUID().toLowerCase();
    }
  } else if ( uri.scheme.toLowerCase() === "data" ) {
    path = uri.path;
    index = path.indexOf( ";" );
    if ( index === -1 ) {
      index = path.indexOf( "," );
    }
    mime = path.substring( path.indexOf( ":" ) + 1, index );
    name = "data_" + createUUID().toLowerCase();
    ext = "";
  } else {
    mime = ( contentType ? contentType : ( defaultType ? defaultType : "" ) );
    try {
      uri.QueryInterface( Ci.nsIURL );
      name = getValidFileNameChunk( uri.fileBaseName );
      ext = getValidFileNameChunk( uri.fileExtension );
    } catch ( e ) {
      name = "";
      ext = "";
    }
    if ( !name.length ) {
      name = "noname_" + createUUID().toLowerCase();
    }
  }
  mime_ext = "";
  if ( mime.length ) {
    try {
      mime_ext = mimeService.getPrimaryExtension( mime, null ).toLowerCase();
    } catch ( e ) {
      if ( mime.toLowerCase().indexOf( "javascript" ) !== -1 ) {
        mime_ext = "js";
      } else {
        mime_ext = "";
      }
    }
  }
  if ( mime_ext.length ) {
    ext = mime_ext;
  }
  return {
    name: name,
    ext: ext
  };
};

function getFileEntryFromURL( url ) {
  var fph =
    ioService.getProtocolHandler( "file" )
             .QueryInterface( Ci.nsIFileProtocolHandler );
  var uri = ioService.newURI( url, null, null );
  uri = chromeService.convertChromeURL( uri );
  return fph.getFileFromURLSpec( uri.spec ).clone();
};

function createFileEntry( dir, name ) {
  var ostream =
    Cc["@mozilla.org/network/file-output-stream;1"]
    .createInstance( Ci.nsIFileOutputStream );
  var entry, prefix = "";
  do {
    entry = dir.clone();
    entry.append( prefix + name );
    prefix += "_";
  } while ( entry.exists() && !entry.isDirectory() );
  try {
    ostream.init(
      entry,
      parseInt( "0x02", 16 ) | // PR_WRONLY
      parseInt( "0x08", 16 ) | // PR_CREATE_FILE
      parseInt( "0x20", 16 ),  // PR_TRUNCATE
      parseInt( "0644", 8 ),
      0
    );
  } finally {
    ostream.close();
  }
  return entry;
};

function createEntriesToSaveFrame( dir, name, ext, suffix ) {
  var ostream =
    Cc["@mozilla.org/network/file-output-stream;1"]
    .createInstance( Ci.nsIFileOutputStream );
  var fileEntry, dirEntry, fileExt, prefix = "";
  fileExt = ( ext ? "." + ext : ext );
  do {
    fileEntry = dir.clone();
    fileEntry.append( prefix + name + fileExt );
    dirEntry = dir.clone();
    dirEntry.append( prefix + name + suffix );
    prefix += "_";
  } while (
    dirEntry.exists() && dirEntry.isDirectory() ||
    fileEntry.exists() && !fileEntry.isDirectory()
  );
  try {
    ostream.init(
      fileEntry,
      parseInt( "0x02", 16 ) | // PR_WRONLY
      parseInt( "0x08", 16 ) | // PR_CREATE_FILE
      parseInt( "0x20", 16 ),  // PR_TRUNCATE
      parseInt( "0644", 8 ),
      0
    );
  } finally {
    ostream.close();
  }
  dirEntry.create( Ci.nsIFile.DIRECTORY_TYPE, parseInt( "0774", 8 ) );
  return {
    fileEntry: fileEntry.clone(),
    dirEntry: dirEntry.clone()
  };
};

function writeFileEntry( entry, encoding, data ) {
  var isInit = false, enc = encoding;
  var cstream =
    Cc["@mozilla.org/intl/converter-output-stream;1"]
    .createInstance( Ci.nsIConverterOutputStream );
  var ostream =
    Cc["@mozilla.org/network/file-output-stream;1"]
    .createInstance( Ci.nsIFileOutputStream );
  ostream.init(
    entry,
    // PR_WRONLY | PR_CREATE_FILE | PR_TRUNCATE
    parseInt( "0x02", 16 ) | parseInt( "0x08", 16 ) | parseInt( "0x20", 16 ),
    parseInt( "0644", 8 ),
    0
  );
  try {
    while ( !isInit ) {
      try {
        cstream.init(
          ostream,
          enc,
          0,
          Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER
        );
        cstream.writeString( data );
        isInit = true;
      } catch( e ) {
        if ( enc == "UTF-8" ) {
          isInit = true;
        }
        enc = "UTF-8";
      }
    }
  } finally {
    cstream.close();
    ostream.close();
  }
};

// TODO: nsIPrompt, nsIAuthPrompt/nsIAuthPrompt2
function ChannelObserver( channel, ctx, entry, mode, perm, bufsize, listener ) {
  this.mChannel = channel;
  this.mContext = ctx;
  this.mEntry = entry;
  this.mMode = mode;
  this.mPerm = perm;
  this.mBufsize = bufsize;
  this.mListener = listener;
  this.mFileOutputStream =
    Cc["@mozilla.org/network/safe-file-output-stream;1"]
    .createInstance( Ci.nsIFileOutputStream );
  this.mBufferedOutputStream =
    Cc["@mozilla.org/network/buffered-output-stream;1"]
    .createInstance( Ci.nsIBufferedOutputStream );
  this.mStatus = -1;
};
ChannelObserver.prototype = {
  QueryInterface: function( iid ) {
    if ( iid.equals( Components.interfaces.nsISupports ) ||
         iid.equals( Components.interfaces.nsIRequestObserver ) ||
         iid.equals( Components.interfaces.nsIStreamListener ) ||
         iid.equals( Components.interfaces.nsIInterfaceRequestor ) ||
         iid.equals( Components.interfaces.nsIProgressEventSink ) ||
         iid.equals( Components.interfaces.nsIChannelEventSink ) ) {
      return this;
    }
    throw Cr.NS_ERROR_NO_INTERFACE;
  },
  // nsIRequestObserver
  getInterface: function( iid ) {
    if ( iid.equals( Components.interfaces.nsIProgressEventSink ) ||
         iid.equals( Components.interfaces.nsIChannelEventSink ) ||
         iid.equals( Components.interfaces.nsIRequestObserver ) ||
         iid.equals( Components.interfaces.nsIStreamListener ) ) {
      return this;
    }
    return null;
  },
  // nsIChannelEventSink
  asyncOnChannelRedirect: function( oldChannel, newChannel, flags, callback ) {
    this.mChannel = newChannel;
    this.mChannel.notificationCallbacks = this;
    this.mChannel.asyncOpen( this, this.mContext );
    callback.onRedirectVerifyCallback( Cr.NS_OK );
  },
  // nsIRequestObserver
  onStartRequest: function( aRequest, aContext ) {
    var isRequestSucceeded = true;
    this.mStatus = 0;
    if ( this.mListener && this.mListener.onstart ) {
      this.mListener.onstart( this.mChannel, aRequest, aContext );
    }
    if ( this.mChannel instanceof Ci.nsIHttpChannel ) {
      try {
        isRequestSucceeded = this.mChannel.requestSucceeded;
      } catch ( e ) {
        isRequestSucceeded = false;
      }
    }
    if ( isRequestSucceeded ) {
      this.mFileOutputStream.init( this.mEntry, this.mMode, this.mPerm,
        Ci.nsIFileOutputStream.DEFER_OPEN );
      this.mBufferedOutputStream.init( this.mFileOutputStream, this.mBufsize );
    } else {
      aRequest.cancel( aRequest.status );
    }
  },
  onStopRequest: function( aRequest, aContext, aStatusCode ) {
    this.mStatus = 1;
    this.mBufferedOutputStream.flush();
    if ( this.mFileOutputStream instanceof Ci.nsISafeOutputStream ) {
      this.mFileOutputStream.finish();
    } else {
      this.mFileOutputStream.close();
    }
    if ( this.mListener && this.mListener.onstop ) {
      this.mListener.onstop( this.mChannel, aRequest, aContext, aStatusCode );
    }
  },
  // nsIStreamListener
  onDataAvailable: function( aRequest, aContext, aStream, aOffset, aCount ) {
    var count = aCount;
    while ( count > 0 ) {
      count -= this.mBufferedOutputStream.writeFrom( aStream, count );
    }
    if ( this.mListener && this.mListener.onprogress ) {
      this.mListener.onprogress( this.mChannel, aRequest, aContext, aOffset,
        aCount );
    }
  },
  // nsIProgressEventSink
  onProgress: function( aRequest, aContext, aProgress, aProgressMax ) {
    /*
    aProgress - Numeric value in the range 0 to aProgressMax indicating
                the number of bytes transfered thus far.
    aProgressMax - Numeric value indicating maximum number of bytes that will
                   be transfered (or 0xFFFFFFFFFFFFFFFF if total is unknown).
    */
  },
  onStatus: function( aRequest, aContext, aStatus, aStatusArg ) {
    /*
    aStatus - Status code (not necessarily an error code) indicating the state
              of the channel (usually the state of the underlying transport).
              @see nsISocketTransport for socket specific status codes.
    aStatusArg - Status code argument to be used with the string bundle service
                 to convert the status message into localized, human readable
                 text. the meaning of this parameter is specific to the value
                 of the status code. for socket status codes, this parameter
                 indicates the host:port associated with the status code.
    */
  }
};

function loadURLToFileEntry( url, referrer, ctx,
                             entry, mode, perm, bufsize, listener ) {
  var uri, status, observer, channel = null;
  try {
    uri = ioService.newURI( url, null, null );
    if ( uri.scheme.toLowerCase() === "mailbox" ) {
      uri.QueryInterface( Ci.nsIURL );
      if ( uri.query ) {
        /**
         * @see Implementation of nsIMimeEmitter in components/jsmimeemitter.js
         * @quote We need to strip our magic flags from the URL
         *
         * mailbox:///...?number=foo&header=filter&emitter=js&part=bar&filename=image.jpg
         *                           ^^^^^^^^^^^^^^^^^^^^^^^^^
         * mailbox:///...?number=foo&part=bar&filename=image.jpg
         */
        uri.query = uri.query.replace(
          /header=filter&emitter=js(&fetchCompleteMessage=false)?&?/,
          ""
        );
      }
    }
    channel = ioService.newChannelFromURI( uri );
    if ( channel ) {
      if ( uri.scheme.toLowerCase().indexOf( "http" ) === 0 &&
           channel instanceof Ci.nsIHttpChannel &&
           referrer ) {
        channel.referrer = ioService.newURI( referrer, null, null );
      }
      observer =
        new ChannelObserver( channel, ctx, entry, mode, perm, bufsize, listener );
      channel.notificationCallbacks = observer;
      channel.asyncOpen( observer, ctx );
    }
  } catch ( e ) {
    if ( e.name && ( e.name in Cr ) ) {
      status = Cr[e.name];
    } else {
      status = Cr.NS_ERROR_UNEXPECTED;
    }
    if ( listener && listener.onstop ) {
      listener.onstop( channel, null, ctx, status );
    }
  }
};

function parsePrefixAttribute( value ) {
  var prefix, uri;
  var result = {};
  var chunks = value.split( /\s+/ );
  for ( var i = 1; i < chunks.length; i += 2 ) {
    prefix = chunks[i - 1];
    uri = chunks[i];
    if ( prefix.length > 1 && prefix[prefix.length - 1] === ":" &&
         uri.length ) {
      prefix = prefix.substring( 0, prefix.length - 1 );
      result[prefix] = uri;
    }
  }
  return Object.keys( result ).length ? result : null;
};

function setupElementNamespaces( anElement, aNamespaces ) {
  var uri, prefix, prefixies = null;
  for ( var name, i = anElement.attributes.length - 1; i >= 0; i-- ) {
    name = anElement.attributes[i].name.toLowerCase();
    if ( name === "xmlns" ) {
      aNamespaces.set( anElement.attributes[i].value );
    } else if ( name.indexOf( "xmlns:" ) === 0 ) {
      aNamespaces.set( anElement.attributes[i].value, name.substring( 6 ) );
    } else if ( name === "prefix" ) {
      prefixies = parsePrefixAttribute( anElement.attributes[i].value );
    }
  }
  if ( prefixies ) {
    for ( prefix in prefixies ) {
      uri = prefixies[prefix];
      anElement.setAttribute( "xmlns:" + prefix, uri );
      aNamespaces.set( uri, prefix );
    }
  }
};

// CSS

function splitNodeName( nodeName ) {
  var index = -1;
  do {
    index = nodeName.indexOf( ":", index + 1 );
  } while ( index > 0 && nodeName.charAt( index - 1) === "\\" );
  if ( index !== -1 ) {
    return [ nodeName.substring( 0, index ), nodeName.substring( index ) ];
  }
  return [ nodeName, "" ];
};

function inspectRule( aSubstitution, aGlobalNamespaces, aLocalNamespaces,
                      aRule, aSheetURL, aDocumentURL, aDirectory, aLoader,
                      aFlags, aCallback, aLines, anIndex ) {
  var selectors, selector, substitute, prefix, ns, flag = false;
  var selectorText = aRule.selectorText ? aRule.selectorText : "";
  var cssText = aRule.cssText;
  var index = selectorText ? cssText.indexOf( selectorText ) : -1;
  if ( index !== -1 ) {
    cssText = cssText.substr( index + selectorText.length );
  }
  cssText = cssText.replace( /url\s*\(\s*(['"]?)(\S+)\1\s*\)/img,
    function( s0, s1, s2 ) {
      var url = resolveURL( s2, aSheetURL );
      if ( checkURL( url ) ) {
        addJobObserver(
          aLoader.createJob( aDirectory, url, aSheetURL, "",
                             aDocumentURL ),
          aCallback,
          aLines,
          anIndex
        );
      }
      return "url(" + url + ")";
    }
  );
  if ( selectorText ) {
    try {
      selectors = CSSUtils.parseSelectors( selectorText, aLocalNamespaces );
      selectorText = selectors.serialize( function( production ) {
        var ns;
        switch( production.name.toLowerCase() ) {
          case "tag":
            substitute = aSubstitution.get(
              {
                localName: production.localName,
                namespaceURI: production.namespaceURI
              },
              true /* create className */
            );
            if ( substitute && substitute.className ) {
              return "." + substitute.className;
            }
            // no break
          case "universal":
          case "attr":
            if (
              // save stylesheets in separate files
              !aGlobalNamespaces ||
              // all namespaces
              production.prefix === "*" ||
              // attr is not in namespace
              production.namespaceURI === null ) {
              break;
            }
            ns = {
              uri: production.namespaceURI,
              prefix: null
            };
            if ( aGlobalNamespaces.lookupURI( ns ) ) {
              return ( ns.prefix !== null ? ns.prefix + "|" : "" ) +
                     production.get( "localNameSource" );
            } else {
              // At this point namespaceURI MUST be defined!
              // Otherwise it is a syntax error in style sheet i.e.,
              // used the namespace prefix defined in none at-namespace-rule.
              log.warn( "Unknown namespaceURI: " + production.namespaceURI );
            }
            break;
        }
        return null;
      } );
    } catch ( e ) {
      log.debug( selectorText );
      log.warn( e + "\n" + Utils.dumpStack() );
    }
  }
  cssText =
    ( selectorText + cssText ).replace( /([^\{\}])(\r|\n|\r\n)/g, "$1" );
  return cssText;
};

function processRule( aRule, aRules, aSubstitution,
                      aDocument, aSheet, aDirectory, aLoader, aFlags ) {
  var sheet, matchMedia, matchSupports, matchDocument;
  var fileName, filePrefix, sheetFile, url;
  var cssIndex, cssText;
  var prefixLines = null, suffixLines = null;
  var globalNamespaces, localNamespaces;
  var aDocumentURL = aDocument.documentURI;
  var aSheetURL = resolveSheetURL( aDocument, aSheet );
  globalNamespaces = aRules.namespaces;
  // get current sheet
  for ( var i = 0; i < aRules.sheets.length; i++ ) {
    sheet = aRules.sheets[i];
    if ( sheet.sheet === aSheet ) {
      break;
    }
  }
  localNamespaces = sheet.namespaces;
  /**
  @see https://developer.mozilla.org/en-US/docs/Web/API/CSSRule
  */
  switch ( aRule.type ) {
    case Ci.nsIDOMCSSRule.STYLE_RULE:
      if ( aRule.cssText ) {
        cssIndex = sheet.lines.length;
        cssText = inspectRule( aSubstitution, globalNamespaces, localNamespaces,
                               aRule, aSheetURL, aDocumentURL,
                               aDirectory, aLoader, aFlags,
          function( job, lines, index ) {
            if ( job.getStatus() ) {
              return;
            }
            lines[index] = lines[index].replace(
              job.getURL(),
              encodeURI( job.getEntry().leafName ),
              "g"
            );
          },
          sheet.lines,
          cssIndex
        );
        sheet.lines.push( cssText );
      }
      break;
    case Ci.nsIDOMCSSRule.FONT_FACE_RULE:
    case Ci.nsIDOMCSSRule.KEYFRAME_RULE:
      if ( aRule.cssText ) {
        cssIndex = sheet.lines.length;
        cssText = inspectRule( aSubstitution, globalNamespaces, localNamespaces,
                               aRule, aSheetURL, aDocumentURL,
                               aDirectory, aLoader, aFlags,
          function( job, lines, index ) {
            if ( job.getStatus() ) {
              return;
            }
            lines[index] = lines[index].replace(
              job.getURL(),
              encodeURI( job.getEntry().leafName ),
              "g"
            );
          },
          sheet.lines,
          cssIndex
        );
        sheet.lines.push( cssText );
      }
      break;
    case Ci.nsIDOMCSSRule.IMPORT_RULE:
      /**
      The @import CSS at-rule allows to import style rules from other style
      sheets. These rules must precede all other types of rules, except
      @charset rules; as it is not a nested statement, it cannot be used
      inside conditional group at-rules.
      @import url;
      @import url list-of-media-queries;
      Example:
      @import url("fineprint.css") print;
      @import url("bluish.css") projection, tv;
      @import 'custom.css';
      @import url("chrome://communicator/skin/");
      @import "common.css" screen, projection;
      @import url('landscape.css') screen and (orientation:landscape);
      Where relative url are used, they’re interpreted as being relative
      to the importing style sheet.
      */
      matchMedia = true;
      if ( aFlags & 0x10000000 /* SAVE_ACTIVE_RULES_ONLY */ ) {
        if ( aDocument.defaultView &&
             aRule.media && aRule.media.mediaText ) {
          matchMedia = aDocument.defaultView.matchMedia( aRule.media.mediaText );
          matchMedia = matchMedia && matchMedia.matches;
        }
      }
      if ( matchMedia && aRule.styleSheet ) {
        url = null;
        if ( aFlags & 0x01000000 /* SAVE_STYLESHEETS_IN_SEPARATE_FILES */ ) {
          fileName = getSuitableFileName( aRule.styleSheet.href, "text/css" );
          filePrefix = "";
          do {
            sheetFile = aDirectory.clone();
            sheetFile.append( filePrefix + fileName.name + "." + fileName.ext );
            filePrefix += "_";
          } while ( sheetFile.exists() && !sheetFile.isDirectory() );
          writeFileEntry( sheetFile, "utf-8", "" );
          url = sheetFile.leafName;
          cssText = '@import url( "' + url + '" )';
          if ( aRule.media && aRule.media.mediaText ) {
            cssText += " " + aRule.media.mediaText;
          }
          sheet.lines.push( cssText + ";" );
        } else if ( aFlags & 0x00100000 /* SAVE_STYLESHEETS_IN_SINGLE_FILE */ ) {
          if ( aRule.media && aRule.media.mediaText ) {
            prefixLines = [
              "@media " + aRule.media.mediaText + " {"
            ];
            suffixLines = [
              "}"
            ];
          }
        } else {
          if ( !( aFlags & 0x10000000 /* SAVE_ACTIVE_RULES_ONLY */ ) &&
               aRule.media && aRule.media.mediaText ) {
              prefixLines = [
                "@media " + aRule.media.mediaText + " {"
              ];
              suffixLines = [
                "}"
              ];
          }
        }
        processStyleSheet( aRules, aSubstitution, aDocument, aRule.styleSheet,
                           url, aDirectory, aLoader, aFlags,
                           prefixLines, suffixLines );

      }
      break;
    case Ci.nsIDOMCSSRule.SUPPORTS_RULE:
      /**
      Gecko 22 and Gecko 21 supported this feature only if the user enables
      it by setting the config value layout.css.supports-rule.enabled to true
      @supports not ( display: flex ) {
        body { width: 100%; height: 100%; background: white; color: black; }
        #navigation { width: 25%; }
        #article { width: 75%; }
      }
      The CSSOM class CSSSupportsRule, and the CSS.supports method
      allows to perform the same check via JavaScript
      The supports() methods returns a Boolean value indicating
      if the browser supports a given CSS feature, or not
      boolValue = CSS.supports( propertyName, value );
      boolValue = CSS.supports( supportCondition );
      */
      matchSupports = true;
      if ( aFlags & 0x10000000 /* SAVE_ACTIVE_RULES_ONLY */ ) {
        matchSupports = aRule.supports( aRule.conditionText );
      } else {
        sheet.lines.push( "@supports " + aRule.conditionText + " {" );
      }
      if ( matchSupports ) {
        for ( var j = 0; j < aRule.cssRules.length; j++ ) {
          processRule( aRule.cssRules[j], aRules, aSubstitution,
                       aDocument, aSheet, aDirectory, aLoader, aFlags );
        }
      }
      if ( !( aFlags & 0x10000000 /* SAVE_ACTIVE_RULES_ONLY */ ) ) {
        sheet.lines.push( "}" );
      }
      break;
    case Ci.nsIDOMCSSRule.MEDIA_RULE:
      /**
      The @media CSS at-rule associates a set of nested statements, in
      a CSS block, that is delimited by curly braces, with a condition
      defined by a media query. The @media at-rule may be used not only at
      the top level of a CSS, but also inside any CSS conditional-group
      at-rule.
      @media <media types> {
        media-specific rules
      }
      Firefox currently only implements the print and screen media types.
      interface CSSMediaRule {
        readonly attribute MediaList media;
        attribute DOMString conditionText;
        readonly attribute CSSRuleList cssRules;
      }
      */
      matchMedia = true;
      if ( aDocument.defaultView &&
           ( aFlags & 0x10000000 /* SAVE_ACTIVE_RULES_ONLY */ ) ) {
        matchMedia = aDocument.defaultView.matchMedia( aRule.conditionText );
        matchMedia = matchMedia && matchMedia.matches;
      } else {
        // aRule.media.mediaText === aRule.conditionText
        sheet.lines.push( "@media " + aRule.conditionText + " {" );
      }
      if ( matchMedia ) {
        for ( var j = 0; j < aRule.cssRules.length; j++ ) {
          processRule( aRule.cssRules[j], aRules, aSubstitution,
                       aDocument, aSheet, aDirectory, aLoader, aFlags );
        }
      }
      if ( !( aFlags & 0x10000000 /* SAVE_ACTIVE_RULES_ONLY */ ) ) {
        sheet.lines.push( "}" );
      }
      break;
    case Ci.nsIDOMCSSRule.DOCUMENT_RULE:
      /**
      CSS4 ( deferred )
      The @document rule is an at-rule that restricts the style rules
      contained within it based on the URL of the document.
      It is designed primarily for user style sheets.
      A @document rule can specify one or more matching functions.
      If any of the functions apply to a URL, the rule will take effect
      on that URL.
      The main use case is for user-defined stylesheets,
      though this at-rule can be used on author-defined stylesheets too.
      The functions available are:

      url(), which matches an exact URL
      url-prefix(), which matches if the document URL starts with
                    the value provided
      domain(), which matches if the document URL is on the domain
                provided (or a subdomain of it)
      regexp(), which matches if the document URL is matched by
                the regular expression provided. The expression must match
                the entire URL.

      The values provided to the url(), url-prefix(), and domain()
      functions can optionally be enclosed by single or double quotes.
      The values provided to the regexp() function must be enclosed in quotes.

      Escaped values provided to the regexp() function must additionally
      escaped from the CSS. For example, a . (period) matches any character
      in regular expressions. To match a literal period, you would first
      need to escape it using regular expression rules (to \.),
      then escape that string using CSS rules (to \\.).
      @document url(http://www.w3.org/),
                     url-prefix(http://www.w3.org/Style/),
                     domain(mozilla.org),
                     regexp("https:.*")
      {
        CSS rules here apply to:
        + The page "http://www.w3.org/".
        + Any page whose URL begins with "http://www.w3.org/Style/"
        + Any page whose URL's host is "mozilla.org" or ends with
          ".mozilla.org"
        + Any page whose URL starts with "https:"
      }
      */
      if ( aRule.cssText ) {
        sheet.lines.push( aRule.cssText );
      }
      break;
      // TODO: implementation of matchDocument()
      matchDocument = true;
      if ( aDocument.defaultView &&
           ( aFlags & 0x10000000 /* SAVE_ACTIVE_RULES_ONLY */ ) ) {
        // matchDocument = aDocument.defaultView.matchDocument( aRule.???? );
      } else {
        // sheet.lines.push( "@document " + aRule.conditionText + " {" );
      }
      if ( matchDocument ) {
        for ( var j = 0; j < aRule.cssRules.length; j++ ) {
          processRule( aRule.cssRules[j], aRules, aSubstitution,
                       aDocument, aSheet, aDirectory, aLoader, aFlags );
        }
      }
      if ( !( aFlags & 0x10000000 /* SAVE_ACTIVE_RULES_ONLY */ ) ) {
        // sheet.lines.push( "}" );
      }
      break;
    case Ci.nsIDOMCSSRule.NAMESPACE_RULE:
      /**
      Any @namespace rules must follow all @charset and @import rules and
      precede all other non-ignored at-rules and style rules in a style sheet.

      The @namespace rule is an at-rule that defines the XML namespaces
      that will be used in the style sheet. The namespaces defined can be used
      to restrict the universal, type, and attribute selectors to only select
      elements under that namespace. The @namespace rule is generally only
      useful when dealing with an XML document containing multiple
      namespaces - for example, an XHTML document with SVG embedded.
      @namespace url(http://www.w3.org/1999/xhtml);
      @namespace svg url(http://www.w3.org/2000/svg);
      This matches all XHTML <a> elements, as XHTML is the default namespace
      a {}
      This matches all SVG <a> elements
      svg|a {}
      This matches both XHTML and SVG <a> elements
      *|a {}
      interface CSSNamespaceRule : CSSRule {
        readonly attribute DOMString namespaceURI;
        readonly attribute DOMString? prefix;
      };
      */
      if ( ( aFlags & 0x01000000 /* SAVE_STYLESHEETS_IN_SEPARATE_FILES */ ) &&
            aRule.cssText ) {
        sheet.lines.push( aRule.cssText );
      }
      break;
    case Ci.nsIDOMCSSRule.CHARSET_RULE:
      /**
      The @charset CSS at-rule specifies the character encoding used in the
      style sheet. It must be the first element in the style sheet and not
      be preceded by any character; as it is not a nested statement,
      it cannot be used inside conditional group at-rules.
      If several @charset at-rules are defined, only the first one is used,
      and it cannot be used inside a style attribute on an HTML element
      or inside the <style> element where the character set of the HTML page
      is relevant.
      @charset charset;
      Set the encoding of the style sheet to Unicode UTF-8
      @charset "UTF-8";
      */
      // skip, always utf-8
      break;
    case Ci.nsIDOMCSSRule.KEYFRAMES_RULE:
      /**
        Describes the aspect of intermediate steps in a CSS animation sequence
        interface CSSKeyframesRule {
          attribute DOMString name;
          readonly attribute CSSRuleList cssRules;
        };
        To use keyframes, you create a @keyframes rule with a name that is
        then used by the animation-name property to match an animation to
        its keyframe list. Each @keyframes rule contains a style list of
        keyframe selectors, each of which is comprised of a percentage
        along the animation at which the keyframe occurs as well as
        a block containing the style information for that keyframe.
        @keyframes <identifier> {
          [ [ from | to | <percentage> ] [, from | to | <percentage> ]* block ]*
        }
        @keyframes animation_name {
          0% { top: 0; left: 0; }
          30% { top: 50px; }
          68%, 72% { left: 50px; }
          100% { top: 100px; left: 100%; }
        }
      */
      sheet.lines.push( "@keyframes " + aRule.name + " {" );
      for ( var j = 0; j < aRule.cssRules.length; j++ ) {
        processRule( aRule.cssRules[j], aRules, aSubstitution,
                     aDocument, aSheet, aDirectory, aLoader, aFlags );
      }
      sheet.lines.push( "}" );
      break;
    case Ci.nsIDOMCSSRule.PAGE_RULE:
      /**
        interface CSSPageRule {
          attribute DOMString selectorText;
          readonly attribute CSSStyleDeclaration style;
        };
        The @page CSS at-rule is used to modify some CSS properties when
        printing a document. You can't change all CSS properties with @page.
        You can only change the margins, orphans, widows, and page breaks
        of the document. Attempts to change any other CSS properties
        will be ignored.
        @page :pseudo-class {
          margin: 2in;
        }
      */
      if ( aRule.cssText ) {
        sheet.lines.push( aRule.cssText );
      }
      break;
    case Ci.nsIDOMCSSRule.REGION_STYLE_RULE:
      /**
      @see http://www.w3.org/TR/css3-regions/
      */
      if ( aRule.cssText ) {
        sheet.lines.push( aRule.cssText );
      }
      break;
    case Ci.nsIDOMCSSRule.VIEWPORT_RULE:
      /**
      @see http://www.w3.org/TR/css-device-adapt/
      */
      if ( aRule.cssText ) {
        sheet.lines.push( aRule.cssText );
      }
      break;
    case Ci.nsIDOMCSSRule.COUNTER_STYLE_RULE:
      /**
      @see http://www.w3.org/TR/css-counter-styles-3/
      */
      if ( aRule.cssText ) {
        sheet.lines.push( aRule.cssText );
      }
      break;
    case Ci.nsIDOMCSSRule.FONT_FEATURE_VALUES_RULE:
      /**
      @see http://www.w3.org/TR/css-fonts-3/
      */
      if ( aRule.cssText ) {
        sheet.lines.push( aRule.cssText );
      }
      break;
    case Ci.nsIDOMCSSRule.UNKNOWN_RULE:
    default:
      if ( aRule.cssText ) {
        sheet.lines.push( aRule.cssText );
      }
      break;
  }
};

function resolveSheetURL( aDocument, aSheet ) {
  var result = aSheet.href;
  while ( !result ) {
    if ( aSheet.parentStyleSheet ) {
      aSheet = aSheet.parentStyleSheet;
      result = aSheet.href;
    } else {
      result = aDocument.baseURI;
    }
  }
  return result;
};

function collectSheetNamespaces( aNamespaces, aSheet ) {
  var info, rule;
  for ( var i = 0; i < aSheet.cssRules.length; i++ ) {
    rule = aSheet.cssRules[i];
    if ( rule.type === Ci.nsIDOMCSSRule.NAMESPACE_RULE ) {
      try {
        info = CSSUtils.parseNamespaceRule( rule.cssText );
        aNamespaces.set( info.namespaceURI, info.prefix );
      } catch ( e ) {
        log.warn( e + "\n" + Utils.dumpStack() );
      }
    }
  }
};

function processStyleSheet( aRules, aSubstitution, aDocument, aSheet,
                            aSheetURL, aDirectory, aLoader, aFlags,
                            aPrefixLines, aSuffixLines ) {
  var sheet, namespaces;
  if ( !aSheet || aSheet.disabled ) {
    return;
  }
  if ( aSheet.href ) {
    for ( var i = 0; i < aRules.sheets.length; i++ ) {
      if ( aRules.sheets[i].href === aSheet.href ) {
        return;
      }
    }
  }
  namespaces = CSSUtils.Namespaces.create( aDocument.documentElement.namespaceURI );
  collectSheetNamespaces( namespaces, aSheet );
  sheet = {
    sheet: aSheet,
    owner: !!aSheet.ownerRule,
    url: aSheetURL,
    href: aSheet.href,
    namespaces: namespaces,
    lines: []
  };
  aRules.sheets.push( sheet );
  if ( aPrefixLines ) {
    for each ( var line in aPrefixLines ) {
      sheet.lines.push( line );
    }
  }
  if ( !( aFlags & 0x01000000 /* SAVE_STYLESHEETS_IN_SEPARATE_FILES */ ) ) {
    if ( !aRules.namespaces ) {
      aRules.namespaces = namespaces.clone();
    } else {
      aRules.namespaces.mixin( namespaces );
    }
  }
  for ( var i = 0; i < aSheet.cssRules.length; i++ ) {
    processRule( aSheet.cssRules[i], aRules, aSubstitution,
                 aDocument, aSheet, aDirectory, aLoader, aFlags );
  }
  if ( aSuffixLines ) {
    for each ( var line in aSuffixLines ) {
      sheet.lines.push( line );
    }
  }
};

function collectStyles( aRules, aSubstitution, aDocument, aDirectory, aLoader,
                        aFlags ) {
  for ( var i = 0; i < aDocument.styleSheets.length; i++ ) {
    processStyleSheet( aRules, aSubstitution, aDocument,
                       aDocument.styleSheets[i], null,
                       aDirectory, aLoader, aFlags );
  }
};

// DOM

function isDocumentHTML5( aDocument ) {
  if ( aDocument.doctype === null ) {
    return false;
  }
  var doctype = '<!DOCTYPE ' + aDocument.doctype.name;
  if ( aDocument.doctype.publicId ) {
    doctype += ' PUBLIC "' + aDocument.doctype.publicId + '"';
  }
  if ( !aDocument.doctype.publicId && aDocument.doctype.systemId ) {
    doctype += ' SYSTEM';
  }
  if ( aDocument.doctype.systemId ) {
    doctype += ' "' + aDocument.doctype.systemId + '"';
  }
  doctype += '>';
  return doctype === '<!DOCTYPE html>' ||
         doctype === '<!DOCTYPE html SYSTEM "about:legacy-compat">';
};

function setElementAttribute( anElement, aName, aValue ) {
  try {
    anElement.setAttribute( aName, aValue );
  } catch ( e ) {
    // TODO: Set attribute "data" of "object" element throws NS_ERROR_UNEXPECTED
    // TODO: Set attribute "src" of "embed" element throws NS_ERROR_UNEXPECTED
    log.warn(
      e + "\n" +
      anElement.nodeName + "." + aName + ": " + aValue + "\n" +
      Utils.dumpStack()
    );
  }
};

function replaceAttribute( element, attr, prefix, localName ) {
  var name, value;
  try {
    name = attr.name;
    value = attr.value;
    element.removeAttribute( name );
    element.setAttribute(
      ( prefix ? prefix + ":" : "" ) + localName,
      value
    );
  } catch ( e ) {
    log.warn(
      e + "\n" +
      element.nodeName + "." + name + ": " + value + "\n" +
      Utils.dumpStack()
    );
  }
};

function replaceElement( anElement, aSubstitute, aClassName ) {
  var node, next, element, name, value;
  if ( aSubstitute ) {
    if ( aSubstitute.namespaceURI ) {
      element = anElement.ownerDocument.createElementNS(
        aSubstitute.namespaceURI,
        aSubstitute.prefix ?
          aSubstitute.prefix + ":" + aSubstitute.localName :
          aSubstitute.localName
      );
    } else {
      element = anElement.ownerDocument.createElement(
        aSubstitute.prefix ?
          aSubstitute.prefix + ":" + aSubstitute.localName :
          aSubstitute.localName
      );
    }
    node = anElement.firstChild;
    while ( node ) {
      next = node.nextSibling;
      element.appendChild( node );
      node = next;
    }
    for ( var i = anElement.attributes.length - 1; i >= 0; i-- ) {
      name = anElement.attributes[i].name.toLowerCase();
      if ( name !== "xmlns" ||
           !aSubstitute.prefix ||
           name !== "xmlns:" + aSubstitute.prefix.toLowerCase() ) {
        value = anElement.attributes[i].value;
        setElementAttribute( element, anElement.attributes[i].name, value );
      }
    }
    anElement.parentNode.replaceChild( element, anElement );
  } else {
    element = anElement;
  }
  if ( aClassName ) {
    element.classList.add( aClassName );
  }
  return element;
};

function fixupName( aName ) {
  var result = ( new RegExp(
    "^[\:A-Z_a-z" +
    "\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF" +
    "\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF" +
    "\uFDF0-\uFFFD]" +
    "[\:A-Z_a-z" +
    "\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF" +
    "\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF" +
    "\uFDF0-\uFFFD" +
    "\-\.0-9\u00B7\u0300-\u036F\u203F-\u2040]*"
  ) ).exec( aName );
  return result ? result[0] : null;
};

function replaceElt( element, namespaceURI, prefix, localName ) {
  if ( localName ) {
    if ( element.localName !== localName ) {
      element = replaceElement( element, {
        prefix: prefix,
        localName: localName,
        namespaceURI: namespaceURI
      } );
    }
  } else {
    switch ( namespaceURI ) {
      case HTML5NS:
        element = replaceElement( element, {
          prefix: prefix,
          localName: "div",
          namespaceURI: HTML5NS
        } );
        break;
      default:
        element.parentNode.removeChild( element );
        element = null;
        break;
    }
  }
  return element;
};

function replaceAtr( element, attr, prefix, localName ) {
  if ( localName ) {
    if ( attr.localName !== localName ) {
      replaceAttribute( element, attr, prefix, localName );
    }
  } else {
    element.removeAttribute( attr.name );
  }
};

function fixupElement( anElement, aNamespaces, aFlags ) {
  var localName, prefix, namespaceURI;
  var nodeName, attrName;
  var attr, attrs = [];
  var name, value, index;
  // attributes
  for ( var i = 0; i < anElement.attributes.length; i++ ) {
    attrs.push( anElement.attributes[i] );
  }
  for ( var i = 0; i < attrs.length; i++ ) {
    attr = attrs[i];
    name = attr.name.toLowerCase();
    if ( !( aFlags & 0x00000001 /* SAVE_SCRIPTS */ ) &&
         ( name in DOMEventHandlers ) ) {
      anElement.removeAttribute( attr.name );
      continue;
    }
    attrName = attr.prefix ? attr.prefix + ":" : "";
    attrName += attr.localName;
    name = fixupName( attrName );
    if ( !name ) {
      anElement.removeAttribute( attr.name );
      continue;
    }
    if ( attr.prefix ) {
      prefix = attr.prefix;
      localName = name.substring( prefix.length + 1 )
                      .replace( /\:/g, "_" );
    } else {
      index = name.indexOf( ":" );
      if ( index < 1 ) {
        prefix = null;
        localName = name.replace( /\:/g, "_" );
      } else {
        prefix = name.substring( 0, index );
        localName = name.substring( index + 1 )
                        .replace( /\:/g, "_" );
        namespaceURI = aNamespaces.get( prefix );
        if ( !namespaceURI && ( prefix in CSSUtils.Namespaces.knowns ) ) {
          namespaceURI = CSSUtils.Namespaces.knowns[prefix];
          anElement.setAttribute( "xmlns:" + prefix, namespaceURI );
          aNamespaces.set( prefix, namespaceURI );
        }
        if ( !namespaceURI ) {
          // drop the prefix, localName becomes without the prefix now
          prefix = null;
        }
      }
    }
    replaceAtr( anElement, attr, prefix, localName );
  }
  // tag
  nodeName = anElement.prefix ? anElement.prefix + ":" : "";
  nodeName += anElement.localName;
  name = fixupName( nodeName );
  if ( !name ) {
    anElement.parentNode.removeChild( anElement );
    return null;
  }
  if ( anElement.prefix ) {
    prefix = anElement.prefix;
    localName = name.substring( prefix.length + 1 )
                    .replace( /\:/g, "_" );
    namespaceURI = anElement.namespaceURI;
  } else {
    index = name.indexOf( ":" );
    if ( index < 1 ) {
      prefix = null;
      localName = name.replace( /\:/g, "_" );
      namespaceURI = anElement.namespaceURI;
    } else {
      prefix = name.substring( 0, index );
      localName = name.substring( index + 1 )
                      .replace( /\:/g, "_" );
      namespaceURI = aNamespaces.get( prefix );
      if ( !namespaceURI && ( prefix in CSSUtils.Namespaces.knowns ) ) {
        namespaceURI = CSSUtils.Namespaces.knowns[prefix];
        aNamespaces.set( prefix, namespaceURI );
      }
      if ( !namespaceURI ) {
        // drop the prefix, localName becomes without the prefix now
        prefix = null;
        namespaceURI = anElement.namespaceURI;
      }
    }
  }
  return replaceElt( anElement, namespaceURI, prefix, localName );
};

function substituteElement( anElement, aSubstitution, aFlags ) {
  var elementInfo = null, className = null;
  var substitute = aSubstitution.get(
    {
      localName: anElement.localName,
      namespaceURI: anElement.namespaceURI
    },
    false /* create className */
  );
  if ( substitute ) {
    if ( substitute.className && ( aFlags & 0x00010000 /* SAVE_STYLES */ ) ) {
      className = substitute.className;
    }
    if ( substitute.elementInfo ) {
      elementInfo = substitute.elementInfo;
    }
  }
  if ( elementInfo || className ) {
    anElement = replaceElement( anElement, elementInfo, className );
  }
  return anElement;
};

function addJobObserver( aJob, aCallback, aLines, anIndex ) {
  var aLoader = aJob.getLoader();
  var anObserver = {
    onJobStopped: function( anEvent ) {
      if ( anEvent.getData().job === aJob ) {
        aCallback( aJob, aLines, anIndex )
        aLoader.removeObserver( anObserver );
      }
    }
  };
  aLoader.addObserver( anObserver );
  return aJob;
};

function inspectElement( aLinks, aRules, aSubstitution, anElement, aDocumentURL,
                         aBaseURL, aFrames, aDirectory, aLoader, aFlags ) {
  var anURI, anURL, aContentType, aDocument, aRelList;
  var frameEntries, fileNameObj, oldCSSText, newCSSText;
  if ( anElement.nodeType !== Ci.nsIDOMNode.ELEMENT_NODE ) {
    return anElement;
  }
  if ( !( aFlags & 0x00000001 /* SAVE_SCRIPTS */ ) && anElement.href ) {
    anURL = resolveURL( anElement.href, aBaseURL );
    try {
      anURI = ioService.newURI( anURL, null, null );
      if ( anURI.scheme.indexOf( "javascript" ) !== -1 ) {
        anElement.removeAttribute( "href" );
      }
    } catch ( e ) {
      log.warn(
        e + "\n" +
        anElement.localName + ".href = " + anElement.href + "\n" +
        Utils.dumpStack()
      );
    }
  }
  if ( anElement.namespaceURI === HTML5NS ) {
    switch ( anElement.localName.toLowerCase() ) {
      case "meta":
        if ( anElement.hasAttribute( "http-equiv" ) &&
             anElement.getAttribute( "http-equiv" )
                      .toLowerCase() === "content-type" ||
             anElement.hasAttribute( "content" ) &&
             anElement.getAttribute( "content" )
                      .toLowerCase().indexOf( "charset=" ) !== -1 ||
             anElement.hasAttribute( "charset" )
           ) {
          return anElement.parentNode.removeChild( anElement );
        }
        break;
      case "base":
      case "style":
        /*
        HTMLStyleElement
        .media - a DOMString representing the intended destination
                 medium for style information
        .type - a DOMString representing the type of style being applied
                by this statement
        .disabled - a Boolean value, with true if the stylesheet is disabled,
                    and false if not
        .sheet - read only - returns the StyleSheet object associated with
                 the given element, or null if there is none
        .scoped - a Boolean value indicating if the element applies to
                  the whole document (false) or only to the
                  parent's sub-tree (true)
        */
        return anElement.parentNode.removeChild( anElement );
      case "script":
      case "noscript":
        if ( aFlags & 0x00000001 /* SAVE_SCRIPTS */ ) {
          if ( anElement.src ) {
            aContentType = anElement.type ? anElement.type : "text/javascript";
            anURL = resolveURL( anElement.src, aBaseURL );
            if ( checkURL( anURL ) ) {
              addJobObserver(
                aLoader.createJob( aDirectory, anURL, aDocumentURL, aContentType,
                                   aDocumentURL /* groupId */ ),
                function( job ) {
                  var entry = job.getEntry();
                  var status = job.getStatus();
                  if ( status ) {
                    if ( entry.exists() ) {
                      entry.remove( false );
                    }
                    log.debug( "script/noscript : " + getErrorName( status ) + " : " + job.getURL() );
                  } else {
                    setElementAttribute(
                      anElement,
                      "src",
                      encodeURI( entry.leafName )
                    );
                  }
                }
              );
              setElementAttribute( anElement, "src", anURL );
            }
          }
          return anElement;
        }
        return anElement.parentNode.removeChild( anElement );
      case "link":
        aContentType = anElement.type.toLowerCase();
        aRelList = anElement.hasAttribute( "rel" ) ?
          anElement.getAttribute( "rel" ).toLowerCase().split( /\s+/ ) : [];
        if ( aRelList.length ) {
          if ( aRelList.indexOf( "stylesheet" ) !== -1 ) {
            if ( anElement.href && anElement.media &&
                 !( aFlags & 0x10000000 /* SAVE_ACTIVE_RULES_ONLY */ ) ) {
              aLinks.push( {
                href: anElement.href,
                media: anElement.media
              } );
            }
            return anElement.parentNode.removeChild( anElement );
          }
          if ( aRelList.indexOf( "icon" ) !== -1 ||
               aRelList.indexOf( "shortcut" ) !== -1 ) {
            if ( anElement.href ) {
              anURL = resolveURL( anElement.href, aBaseURL );
              if ( checkURL( anURL ) ) {
                addJobObserver(
                  aLoader.createJob( aDirectory, anURL, aDocumentURL,
                                     aContentType, aDocumentURL /* groupId */ ),
                  function( job ) {
                    var entry = job.getEntry();
                    var status = job.getStatus();
                    if ( status ) {
                      if ( entry.exists() ) {
                        entry.remove( false );
                      }
                      log.debug( "link rel icon/shortcut : " + getErrorName( status ) + " : " + job.getURL() );
                    } else {
                      setElementAttribute(
                        anElement,
                        "href",
                        encodeURI( entry.leafName )
                      );
                    }
                  }
                );
                setElementAttribute( anElement, "href", anURL );
              }
            }
            return anElement;
          }
        }
        if ( aContentType === "application/rss+xml" ||
             aContentType === "application/opensearchdescription+xml" ) {
          if ( anElement.href ) {
            anURL = resolveURL( anElement.href, aBaseURL );
            if ( checkURL( anURL ) ) {
              addJobObserver(
                aLoader.createJob( aDirectory, anURL, aDocumentURL,
                                   aContentType, aDocumentURL /* groupId */ ),
                function( job ) {
                  var entry = job.getEntry();
                  var status = job.getStatus();
                  if ( status ) {
                    if ( entry.exists() ) {
                      entry.remove( false );
                    }
                    log.debug( "link type xml : " + getErrorName( status ) + " : " + job.getURL() );
                  } else {
                    setElementAttribute(
                      anElement,
                      "href",
                      encodeURI( entry.leafName )
                    );
                  }
                }
              );
              setElementAttribute( anElement, "href", anURL );
            }
          }
          return anElement;
        }
        if ( anElement.href ) {
          anURL = resolveURL( anElement.href, aBaseURL );
          if ( checkURL( anURL ) ) {
            setElementAttribute( anElement, "href", anURL );
          }
        }
        return anElement;
      case "img":
        if ( anElement.src ) {
          anURL = resolveURL( anElement.src, aBaseURL );
          if ( checkURL( anURL ) ) {
            addJobObserver(
              aLoader.createJob( aDirectory, anURL, aDocumentURL, "",
                                 aDocumentURL /* groupId */ ),
              function( job ) {
                var entry = job.getEntry();
                var status = job.getStatus();
                if ( status ) {
                  if ( entry.exists() ) {
                    entry.remove( false );
                  }
                  log.debug( "img : " + getErrorName( status ) + " : " + job.getURL() );
                } else {
                  setElementAttribute(
                    anElement,
                    "src",
                    encodeURI( entry.leafName )
                  );
                }
              }
            );
            setElementAttribute( anElement, "src", anURL );
          }
        }
        anElement.removeAttribute( "livesrc" );
        break;
      case "embed":
        if ( anElement.src ) {
          aContentType = anElement.type ? anElement.type : "";
          anURL = resolveURL( anElement.src, aBaseURL );
          if ( checkURL( anURL ) ) {
            addJobObserver(
              aLoader.createJob( aDirectory, anURL, aDocumentURL, aContentType,
                                 aDocumentURL /* groupId */ ),
              function( job ) {
                var entry = job.getEntry();
                var status = job.getStatus();
                if ( status ) {
                  if ( entry.exists() ) {
                    entry.remove( false );
                  }
                  log.debug( "embed : " + getErrorName( status ) + " : " + job.getURL() );
                } else {
                  setElementAttribute(
                    anElement,
                    "src",
                    encodeURI( entry.leafName )
                  );
                }
              }
            );
            setElementAttribute( anElement, "src", anURL );
          }
        }
        anElement.removeAttribute( "livesrc" );
        break;
      case "object":
        if ( anElement.data ) {
          aContentType = anElement.type ? anElement.type : "";
          anURL = resolveURL( anElement.data, aBaseURL );
          if ( checkURL( anURL ) ) {
            addJobObserver(
              aLoader.createJob( aDirectory, anURL, aDocumentURL,
                                 aContentType, aDocumentURL /* groupId */ ),
              function( job ) {
                var entry = job.getEntry();
                var status = job.getStatus();
                if ( status ) {
                  if ( entry.exists() ) {
                    entry.remove( false );
                  }
                  log.debug( "object : " + getErrorName( status ) + " : " + job.getURL() );
                } else {
                  setElementAttribute(
                    anElement,
                    "data",
                    encodeURI( entry.leafName )
                  );
                }
              }
            );
            setElementAttribute( anElement, "data", anURL );
          }
        }
        break;
      case "body":
      case "table":
      case "tr":
      case "th":
      case "td":
        if ( anElement.background ) {
          anURL = resolveURL( anElement.background, aBaseURL );
          if ( checkURL( anURL ) ) {
            addJobObserver(
              aLoader.createJob( aDirectory, anURL, aDocumentURL, "",
                                 aDocumentURL /* groupId */ ),
              function( job ) {
                var entry = job.getEntry();
                var status = job.getStatus();
                if ( status ) {
                  if ( entry.exists() ) {
                    entry.remove( false );
                  }
                  log.debug( ".background : " + getErrorName( status ) + " : " + job.getURL() );
                } else {
                  setElementAttribute(
                    anElement,
                    "background",
                    encodeURI( entry.leafName )
                  );
                }
              }
            );
            setElementAttribute( anElement, "background", anURL );
          }
        }
        break;
      case "input" :
        switch ( anElement.type.toLowerCase() ) {
          case "image":
            if ( anElement.src ) {
              anURL = resolveURL( anElement.src, aBaseURL );
              if ( checkURL( anURL ) ) {
                addJobObserver(
                  aLoader.createJob( aDirectory, anURL, aDocumentURL,
                                     "", aDocumentURL /* groupId */ ),
                  function( job ) {
                    var entry = job.getEntry();
                    var status = job.getStatus();
                    if ( status ) {
                      if ( entry.exists() ) {
                        entry.remove( false );
                      }
                      log.debug( "input image : " + getErrorName( status ) + " : " + job.getURL() );
                    } else {
                      setElementAttribute(
                        anElement,
                        "src",
                        encodeURI( entry.leafName )
                      );
                    }
                  }
                );
                setElementAttribute( anElement, "src", anURL );
              }
            }
            break;
          case "text":
            setElementAttribute( anElement, "value", anElement.value );
            break;
          case "checkbox":
          case "radio":
            if ( anElement.checked ) {
              setElementAttribute( anElement, "checked", "checked" );
            } else {
              anElement.removeAttribute( "checked" );
            }
            break;
        }
        break;
      case "a":
      case "area":
        if ( anElement.href ) {
          anURL = resolveURL( anElement.href, aBaseURL );
          if ( checkURL( anURL ) ) {
            setElementAttribute( anElement, "href", anURL );
          }
        }
        break;
      case "form":
        if ( anElement.action ) {
          anURL = resolveURL( anElement.action, aBaseURL );
          if ( checkURL( anURL ) ) {
            setElementAttribute( anElement, "action", anURL );
          }
        }
        break;
      case "frame":
      case "iframe":
        if ( aFlags & 0x00000010 /* SAVE_FRAMES */ ) {
          aDocument = aFrames.shift();
          if ( aDocument ) {
            fileNameObj = getSuitableFileName(
              aDocument.documentURI,
              aDocument.contentType
            );
            if ( aFlags & 0x00000100 /* SAVE_FRAMES_IN_SEPARATE_DIRECTORY */ ) {
              frameEntries = createEntriesToSaveFrame(
                aDirectory,
                fileNameObj.name,
                fileNameObj.ext,
                "_files"
              );
            } else {
              frameEntries = {
                fileEntry: createFileEntry(
                  aDirectory,
                  fileNameObj.name +
                  ( fileNameObj.ext ? "." + fileNameObj.ext : "" )
                ),
                dirEntry: aDirectory.clone()
              };
            }
            saveDocument(
              aDocument,
              { value: null } /* aResult */,
              frameEntries.fileEntry,
              frameEntries.dirEntry,
              aLoader,
              aFlags
            );
            setElementAttribute(
              anElement,
              "src",
              encodeURI( frameEntries.fileEntry.leafName )
            );
          } else {
            return anElement.parentNode.removeChild( anElement );
          }
        } else {
          return anElement.parentNode.removeChild( anElement );
        }
        break;
    }
    anElement.removeAttribute( "_base_href" );
  }
  if ( aFlags & 0x00010000 /* SAVE_STYLES */ ) {
    if ( anElement.style && anElement.style.cssText ) {
      oldCSSText = anElement.style.cssText;
      newCSSText = inspectRule( aSubstitution, null /* globalNamespaces */,
        null /* localNamespaces */, anElement.style, aBaseURL, aDocumentURL,
        aDirectory, aLoader, aFlags,
        function( job ) {
          var entry = job.getEntry();
          var status = job.getStatus();
          if ( status ) {
            if ( entry.exists() ) {
              entry.remove( false );
            }
            log.debug( ".style : " + getErrorName( status ) + " : " + job.getURL() );
          } else {
            var cssText = anElement.style.cssText.replace(
              job.getURL(),
              encodeURI( job.getEntry().leafName ),
              "g"
            );
            anElement.style.cssText = cssText;
          }
        }
      );
      if ( oldCSSText !== newCSSText ) {
        anElement.style.cssText = newCSSText;
      }
    }
  } else {
    anElement.removeAttribute( "style" );
    anElement.removeAttribute( "class" );
  }
  return anElement;
};

function createStyles( aDocument, aLinks, aRules, aBaseURL, aFile, aDirectory, aFlags ) {
  var aStyle, anURL, aText, aCSSFile, aCSSFileName;
  var prefix, prefixies;
  var line, index, anAtLines = [];
  var aHead = aDocument.getElementsByTagName( "head" )[0];
  for ( var i = aRules.sheets.length - 1; i >= 0 ; i-- ) {
    for ( var j = aRules.sheets[i].lines.length - 1; j >= 0 ; j-- ) {
      line = aRules.sheets[i].lines[j].trim();
      if ( !line.length ) {
        aRules.sheets[i].lines.splice( j, 1 );
      }
    }
  }
  if ( aRules.namespaces ) {
    anURL = aRules.namespaces.get();
    if ( anURL && anURL !== HTML5NS ) {
      anAtLines.push( "@namespace url(" + anURL + ");" );
    }
    prefixies = aRules.namespaces.getPrefixies();
    for ( prefix in prefixies ) {
      if ( prefix !== "xml" && prefix !== "xmlns" ) {
        anURL = aRules.namespaces.get( prefix );
        anAtLines.push( "@namespace " + prefix + " url(" + anURL + ");" );
      }
    }
  }
  aText = "";
  for ( var i = 0; i < aRules.sheets.length; i++ ) {
    if ( aRules.sheets[i].lines.length ) {
      anURL = aRules.sheets[i].href;
      if ( anURL ) {
        if ( aFlags & 0x01000000 /* SAVE_STYLESHEETS_IN_SEPARATE_FILES */ ) {
          aText = "/***** " + anURL + " *****/\n" +
                  aRules.sheets[i].lines.join( "\n" );
          if ( aRules.sheets[i].url ) {
            aCSSFile = aDirectory.clone();
            aCSSFile.append( aRules.sheets[i].url );
          } else {
            aCSSFileName = getSuitableFileName( anURL, "text/css" );
            prefix = "";
            do {
              aCSSFile = aDirectory.clone();
              aCSSFile.append( prefix + aCSSFileName.name +
                               "." + aCSSFileName.ext );
              prefix += "_";
            } while ( aCSSFile.exists() && !aCSSFile.isDirectory() );
          }
          writeFileEntry( aCSSFile, "utf-8", aText );
          if ( !aRules.sheets[i].owner ) {
            aStyle = aDocument.createElementNS(
              aDocument.documentElement.namespaceURI,
              "link"
            );
            aStyle.setAttribute( "rel", "stylesheet" );
            aStyle.setAttribute( "type", "text/css" );
            aStyle.setAttribute( "href", aCSSFile.leafName );
            for ( var j = 0; j < aLinks.length; j++ ) {
              if ( aLinks[j].href === anURL ) {
                aStyle.setAttribute( "media", aLinks[j].media );
                break;
              }
            }
            aHead.appendChild( aDocument.createTextNode( "\n" ) );
            aHead.appendChild( aStyle );
          }
        } else if ( aFlags & 0x00100000 /* SAVE_STYLESHEETS_IN_SINGLE_FILE */ ) {
          aText += ( i ? "\n" : "" ) +
                   "/***** " + anURL + " *****/\n" +
                   aRules.sheets[i].lines.join( "\n" );
        } else {
          aText += ( i ? "\n      " : "" ) +
                   "/***** " + anURL + " *****/\n      " +
                   aRules.sheets[i].lines.join( "\n      " );
        }
      } else {
        if ( aFlags & 0x01000000 /* SAVE_STYLESHEETS_IN_SEPARATE_FILES */ ) {
          aText = aRules.sheets[i].lines.join( "\n      " );
          aStyle = aDocument.createElementNS(
            aDocument.documentElement.namespaceURI,
            "style"
          );
          aStyle.textContent = aText + "\n    ";
          aHead.appendChild( aDocument.createTextNode( "\n" ) );
          aHead.appendChild( aStyle );
        } else if ( aFlags & 0x00100000 /* SAVE_STYLESHEETS_IN_SINGLE_FILE */ ) {
          aText += ( i ? "\n" : "" ) +
                   "/***** internal style sheet *****/\n" +
                   aRules.sheets[i].lines.join( "\n" );
        } else {
          aText += ( i ? "\n      " : "" ) +
                   "/***** internal style sheet *****/\n      " +
                   aRules.sheets[i].lines.join( "\n      " );
        }
      }
    }
  }
  if ( aText.length &&
       !( aFlags & 0x01000000 /* SAVE_STYLESHEETS_IN_SEPARATE_FILES */ ) ) {
    if ( aFlags & 0x00100000 /* SAVE_STYLESHEETS_IN_SINGLE_FILE */ ) {
      if ( anAtLines.length ) {
        aText = anAtLines.join( "\n" ) + "\n" + aText + "\n";
      }
      prefix = "";
      do {
        aCSSFile = aDirectory.clone();
        aCSSFile.append( prefix + "styles.css" );
        prefix += "_";
      } while ( aCSSFile.exists() && !aCSSFile.isDirectory() );
      writeFileEntry( aCSSFile, "utf-8", aText );
      aStyle = aDocument.createElementNS(
        aDocument.documentElement.namespaceURI,
        "link"
      );
      aStyle.setAttribute( "rel", "stylesheet" );
      aStyle.setAttribute( "type", "text/css" );
      aStyle.setAttribute( "href", aCSSFile.leafName );
    } else {
      if ( anAtLines.length ) {
        aText = "\n      " + anAtLines.join( "\n      " ) +
                "\n      " + aText;
      } else {
        aText = "\n      " + aText;
      }
      aStyle = aDocument.createElementNS(
        aDocument.documentElement.namespaceURI,
        "style"
      );
      aStyle.textContent = aText + "\n    ";
    }
    aHead.appendChild( aDocument.createTextNode( "\n" ) );
    aHead.appendChild( aStyle );
  }
};

function processNode( aLinks, aRules, aSubstitution,
                         aRoot, aNamespaces,
                         aDocumentURL, aBaseURL, aFrames,
                         aDirectory, aLoader, aFlags ) {
  var aNode, aNext, anElementNamespaces;
  switch ( aRoot.nodeType ) {
    case Ci.nsIDOMNode.ELEMENT_NODE:
      anElementNamespaces = aNamespaces.clone();
      setupElementNamespaces( aRoot, anElementNamespaces );
      aRoot = fixupElement( aRoot, anElementNamespaces, aFlags );
      if ( aRoot ) {
        aRoot = substituteElement( aRoot, aSubstitution, aFlags );
        aRoot = inspectElement( aLinks, aRules, aSubstitution, aRoot,
                                aDocumentURL, aBaseURL, aFrames,
                                aDirectory, aLoader, aFlags );
      }
      break;
    case Ci.nsIDOMNode.COMMENT_NODE:
      aRoot.textContent = aRoot.textContent.replace( /\-\-/gm, " - - " )
                                           .replace( /^\-/gm, " - " )
                                           .replace( /\-$/gm, " - " );
      break;
    default:
      break;
  }
  if ( aRoot ) {
    aNode = aRoot.firstChild;
    while ( aNode ) {
      aNext = aNode.nextSibling;
      processNode( aLinks, aRules, aSubstitution,
                   aNode, anElementNamespaces,
                   aDocumentURL, aBaseURL, aFrames,
                   aDirectory, aLoader, aFlags );
      aNode = aNext;
    }
  }
};

function collectFrames( aDocument ) {
  var result = [];
  if ( aDocument.defaultView ) {
    frames = aDocument.defaultView.frames;
    for ( var i = 0; i < frames.length; i++ ) {
      result.push( frames[i].document );
    }
  }
  return result;
};

function doneDocument( aDocument, aResult, aLinks, aRules, aBaseURL, aFile, aDirectory, aFlags ) {
  var aHead, aStyle, aMeta, aCollection, aBase, aBaseTarget;
  var namespaceURI = aResult.documentElement.namespaceURI;
  if ( namespaceURI && namespaceURI === HTML5NS ) {
    // HEAD
    aCollection = aResult.getElementsByTagName( "head" );
    if ( !aCollection.length ) {
      aHead = aResult.createElementNS( namespaceURI, "head" );
      aResult.documentElement.insertBefore(
        aHead,
        aResult.documentElement.firstChild
      );
    } else {
      aHead = aCollection[0];
    }
    // BASE
    aCollection = aDocument.getElementsByTagName( "base" );
    aBaseTarget = null;
    if ( aCollection.length ) {
      aBaseTarget = aCollection[0].hasAttribute( "target" ) ?
        aCollection[0].getAttribute( "target" ) : null;
    }
    aBase = aResult.createElementNS( namespaceURI, "base" );
    aHead.insertBefore( aBase, aHead.firstElementChild );
    setElementAttribute( aBase, "href", aBaseURL );
    if ( aBaseTarget ) {
      setElementAttribute( aBase, "target", aBaseTarget );
    }
    // STYLE
    if ( aFlags & 0x00010000 /* SAVE_STYLES */ ) {
      createStyles( aResult, aLinks, aRules, aBaseURL, aFile, aDirectory, aFlags );
    }
  }
  // WRITE
  writeDocument( aResult, aDocument.contentType, aFile );
};

function saveDocument( aDocument, aResultObj, aFile, aDirectory, aLoader,
                       aFlags ) {
  var aNode, aNext;
  var aResult = aResultObj.value = cloneDocument( aDocument );
  var isFrame = aDocument.defaultView ?
    aDocument.defaultView.top !== aDocument.defaultView.self : false;
  var aBaseURL = getFileURI( aFile.parent ).getRelativeSpec(
    getFileURI( aDirectory ) );
  var aLinks = [];
  var aRules = {
    namespaces: null, // global namespaces for single sheet
    sheets: []
  };
  var aFrames = collectFrames( aDocument );
  var aNamespaces = CSSUtils.Namespaces.create();
  var aSubstitution = Substitution.create();
  if ( !( aFlags & 0x00001000 /* PRESERVE_HTML5_TAGS */ ) ) {
    createHTML5Substitutes( aSubstitution );
  }
  if ( aFlags & 0x00010000 /* SAVE_STYLES */ ) {
    collectStyles(
      aRules,
      aSubstitution,
      aDocument,
      aDirectory,
      aLoader,
      aFlags
    );
  }
  setupElementNamespaces( aResult.documentElement, aNamespaces );
  aNode = aResult.firstChild;
  while ( aNode ) {
    aNext = aNode.nextSibling;
    processNode(
      aLinks,
      aRules,
      aSubstitution,
      aNode,
      aNamespaces,
      aDocument.documentURI,
      aDocument.baseURI,
      aFrames,
      aDirectory,
      aLoader,
      aFlags
    );
    aNode = aNext;
  }
  if ( aLoader.hasGroupJobs( aDocument.documentURI ) ) {
    aLoader.addObserver( {
      onGroupStopped: function( anEvent ) {
        if ( anEvent.getData().id === aDocument.documentURI ) {
          doneDocument( aDocument, aResult, aLinks, aRules, aBaseURL, aFile, aDirectory, aFlags );
        }
      }
    } );
  } else {
    doneDocument( aDocument, aResult, aLinks, aRules, aBaseURL, aFile, aDirectory, aFlags );
  }
};

function cloneDocument( aDocument ) {
  var aNode, aResult = aDocument.implementation.createDocument(
    aDocument.documentElement.namespaceURI,
    null,
    aDocument.doctype
  );
  aResult.appendChild(
    aResult.importNode( aDocument.documentElement, true )
  );
  aNode = aDocument.firstChild;
  while ( aNode && aNode !== aDocument.documentElement ) {
    aResult.insertBefore(
      aResult.importNode( aNode, true ),
      aResult.documentElement
    );
    aNode = aNode.nextSibling;
  }
  if ( aNode ) {
    aNode = aNode.nextSibling;
  }
  while ( aNode ) {
    aResult.appendChild( aResult.importNode( aNode, true ) );
    aNode = aNode.nextSibling;
  }
  return aResult;
};

function writeDocument( aDocument, aType, aFile ) {
  var aData = aType.indexOf( "xml" ) !== -1 ?
    serializeXMLToString( aDocument ) :
    serializeHTMLToString( aDocument );
  writeFileEntry( aFile, "utf-8", aData );
};

// CLIPPER

var Event = function( aName, aData ) {
  this.mName = aName;
  this.mData = aData;
};
Event.prototype = {
  getName: function() {
    return this.mName;
  },
  getData: function() {
    return this.mData;
  }
};

var Job = function( aLoader, aDirectory, anURL, aReferrerURL, aContentType,
                    aGroupId ) {
  this.mLoader = aLoader;
  this.mDirectory = aDirectory;
  this.mURL = anURL;
  this.mReferrerURL = aReferrerURL;
  this.mContentType = aContentType ? aContentType : "";
  this.mGroupId = aGroupId ? aGroupId : "";
  this.mId = createUUID();
  this.mEntry = this.mDirectory.clone();
  this.mEntry.append( this.mId );
  this.mStatus = -1;
  this.mActive = false;
  this.mInitialized = false;
  this.mRequest = null;
};
Job.prototype = {
  getLoader: function() {
    return this.mLoader;
  },
  getDirectory: function() {
    return this.mDirectory.clone();
  },
  getGroupId: function() {
    return this.mGroupId;
  },
  getId: function() {
    return this.mId;
  },
  getURL: function() {
    return this.mURL;
  },
  getEntry: function() {
    return this.mEntry.clone();
  },
  getStatus: function() {
    return this.mStatus;
  },
  isActive: function() {
    return this.mActive;
  },
  start: function() {
    if ( this.mActive ) {
      return this;
    }
    this.getLoader()._initJob( this );
    this.mActive = true;
    var self = this;
    var ctx = null;
    var entryMode = parseInt( "0x02", 16 ) | // PR_WRONLY
                    parseInt( "0x08", 16 ) | // PR_CREATE_FILE
                    parseInt( "0x20", 16 );  // PR_TRUNCATE
    var entryPermissions = parseInt( "0644", 8 );
    var bufferSize = parseInt( "0x8000", 16 );
    loadURLToFileEntry(
      this.mURL,
      this.mReferrerURL,
      ctx,
      this.mEntry,
      entryMode,
      entryPermissions,
      bufferSize,
      {
        // TODO: onstart() may be called again and again ...
        onstart: function( aChannel, aRequest, aContext ) {
          if ( self.mInitialized ) {
            return;
          }
          var mime, fileNameObj, name, entry;
          if ( aChannel instanceof Ci.nsIHttpChannel ) {
            try {
              mime = ( aChannel.requestSucceeded ? aChannel.contentType : null );
            } catch ( e ) {
              mime = null;
            }
          } else {
            mime = null;
          }
          if ( mime && !self.mContentType ) {
            self.mContentType = mime;
          }
          fileNameObj = getSuitableFileName(
            aChannel.URI.spec,
            self.mContentType
          );
          name = fileNameObj.name;
          if ( fileNameObj.ext ) {
            name += "." + fileNameObj.ext;
          }
          entry = createFileEntry( self.getDirectory(), name );
          self.mEntry.initWithFile( entry );
          self.mRequest = aRequest;
          self.mInitialized = true;
          self.getLoader()._startJob( self );
        },
        onprogress: function( aChannel, aRequest, aContext, aOffset, aCount ) {
          self.mRequest = aRequest;
          self.getLoader()._progressJob( self, aCount, aChannel.contentLength,
                                         aOffset, aChannel.contentLength );
        },
        onstop: function( aChannel, aRequest, aContext, aStatusCode ) {
          self.mRequest = aRequest;
          self.stop( aStatusCode );
        }
      }
    );
    return this;
  },
  stop: function( aStatus ) {
    if ( !this.mActive ) {
      return;
    }
    this.mActive = false;
    this.mRequest = null;
    this.mStatus = aStatus;
    this.getLoader()._stopJob( this );
    return this;
  },
  abort: function() {
    if ( this.mActive ) {
      if ( this.mRequest ) {
        this.mRequest.cancel( Cr.NS_BINDING_ABORTED );
      }
      this.stop( Cr.NS_BINDING_ABORTED );
    }
  },
  remove: function() {
    this.getLoader()._removeJob( this );
    return this;
  }
};

var Loader = function() {
  this.mLength = 0;
  this.mJobs = {};
  this.mObservers = [];
};
Loader.prototype = {
  _initJob: function( aJob ) {
    if ( !this.hasActiveJobs() ) {
      this._startLoader();
    }
    if ( !this.hasActiveGroupJobs( aJob.getGroupId() ) ) {
      this._startGroup( aJob.getGroupId() );
    }
    return aJob;
  },
  _startJob: function( aJob ) {
    this.notifyObservers( new Event( "JobStarted", {
      job: aJob
    } ) );
    return aJob;
  },
  _progressJob: function( aJob, aCurSelfProgress, aMaxSelfProgress,
                                aCurTotalProgress, aMaxTotalProgress ) {
    this.notifyObservers( new Event( "JobProgress", {
      job: aJob,
      curSelfProgress: aCurSelfProgress,
      maxSelfProgress: aMaxSelfProgress,
      curTotalProgress: aCurTotalProgress,
      maxTotalProgress: aMaxTotalProgress
    } ) );
  },
  _stopJob: function( aJob ) {
    this.notifyObservers( new Event( "JobStopped", {
      job: aJob
    } ) );
    if ( !this.hasActiveGroupJobs( aJob.getGroupId() ) ) {
      this._stopGroup( aJob.getGroupId() );
    }
    if ( !this.hasActiveJobs() ) {
      this._stopLoader();
    }
    return aJob;
  },
  _removeJob: function( aJob ) {
    delete this.mJobs[ aJob.getURL() ];
    this.mLength--;
    this.notifyObservers( new Event( "JobRemoved", {
      job: aJob
    } ) );
    return aJob;
  },
  _startLoader: function() {
    this.notifyObservers( new Event( "LoaderStarted", {} ) );
  },
  _stopLoader: function() {
    this.notifyObservers( new Event( "LoaderStopped", {
      status: this.getStatus()
    } ) );
  },
  _startGroup: function( groupId ) {
    this.notifyObservers( new Event( "GroupStarted", {
      id: groupId
    } ) );
  },
  _stopGroup: function( groupId ) {
    this.notifyObservers( new Event( "GroupStopped", {
      id: groupId
    } ) );
  },
  getJob: function( anURL ) {
    return ( anURL in this.mJobs ) ? this.mJobs[anURL] : null;
  },
  getJobById: function( anId ) {
    for each ( var aJob in this.mJobs ) {
      if ( anId === aJob.getId() ) {
        return aJob;
      }
    }
    return null;
  },
  createJob: function( aDirectory, anURL, aReferrerURL, aContentType, aGroupId ) {
    var aJob = this.getJob( anURL );
    if ( aJob ) {
      return aJob;
    }
    aJob = new Job(
      this,
      aDirectory,
      anURL,
      aReferrerURL,
      aContentType,
      aGroupId
    );
    this.mJobs[anURL] = aJob;
    this.mLength++;
    this.notifyObservers( new Event( "JobCreated", {
      job: aJob
    } ) );
    return aJob;
  },
  getCount: function() {
    return this.mLength;
  },
  getStatus: function() {
    for each ( var aJob in this.mJobs ) {
      if ( !aJob.isActive() && aJob.getStatus() ) {
        return 1;
      }
    }
    return 0;
  },
  start: function() {
    for each ( var aJob in this.mJobs ) {
      if ( !aJob.isActive() ) {
        aJob.start();
      }
    }
  },
  stop: function() {
    if ( !this.hasJobs() ) {
      this._stopLoader();
    } else {
      this.abort();
    }
  },
  abort: function() {
    if ( !this.hasActiveJobs() ) {
      this.mStatus = -1;
      this._stopLoader();
    } else {
      for each ( var aJob in this.mJobs ) {
        if ( aJob.isActive() ) {
          aJob.abort();
        }
      }
    }
  },
  hasJobs: function() {
    return !!this.mLength;
  },
  hasGroupJobs: function( groupId ) {
    for each ( var aJob in this.mJobs ) {
      if ( aJob.getGroupId() === groupId ) {
        return true;
      }
    }
    return false;
  },
  hasActiveJobs: function() {
    for each ( var aJob in this.mJobs ) {
      if ( aJob.isActive() ) {
        return true;
      }
    }
    return false;
  },
  hasActiveGroupJobs: function( groupId ) {
    for each ( var aJob in this.mJobs ) {
      if ( aJob.getGroupId() === groupId && aJob.isActive() ) {
        return true;
      }
    }
    return false;
  },
  notifyObservers: function( anEvent ) {
    var aName = "on" + anEvent.getName();
    for ( var i = 0; i < this.mObservers.length; i++ ) {
      if ( this.mObservers[i][ aName ] ) {
        this.mObservers[i][ aName ]( anEvent );
      }
    }
    return this;
  },
  addObserver: function( anObserver ) {
    if ( this.mObservers.indexOf( anObserver ) == -1 ) {
      this.mObservers.push( anObserver );
    }
    return this;
  },
  removeObserver: function( anObserver ) {
    var anIndex = this.mObservers.indexOf( anObserver );
    if ( anIndex != -1 ) {
      this.mObservers.splice( anIndex, 1 );
    }
    return this;
  }
};

var Clipper = function() {
  this.mLoader = null;
};
Clipper.prototype = {
  save: function( aDocument, aResultObj, aFile, aDirectory, aFlags,
                  anObserver ) {
    this.mLoader = new Loader();
    if ( anObserver ) {
      this.mLoader.addObserver( anObserver );
    }
    saveDocument(
      aDocument,
      aResultObj,
      aFile,
      aDirectory,
      this.mLoader,
      aFlags === undefined ? 0x00000000 : aFlags
    );
    if ( this.mLoader.hasJobs() ) {
      this.mLoader.start();
    } else {
      this.mLoader.stop();
    }
  },
  abort: function() {
    if ( this.mLoader ) {
      this.mLoader.abort();
    }
  }
};
