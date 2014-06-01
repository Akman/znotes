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

var Utils = ru.akman.znotes.Utils;
var nsIDOMNode = Components.interfaces.nsIDOMNode;
var nsIDOMCSSRule = Components.interfaces.nsIDOMCSSRule;

var EXPORTED_SYMBOLS = ["Clipper"];

var NAMESPACES = {
  "html"  : "http://www.w3.org/1999/xhtml",
  "math"  : "http://www.w3.org/1998/Math/MathML",
  "svg"   : "http://www.w3.org/2000/svg",
  "xlink" : "http://www.w3.org/1999/xlink",
  "og"    : "http://ogp.me/ns#",
  "fb"    : "http://ogp.me/ns/fb#",
  "g"     : "http://base.google.com/ns/1.0"
};

var TAGS = {
  "article"    : "div",    // an article in the document
  "aside"      : "div",    // content aside from the page content
  "details"    : "div",    // additional details that the user can view or hide
  "figcaption" : "h3",     // a caption for a <figure> element
  "figure"     : "div",    // self-contained content, like illustrations, etc.
  "footer"     : "div",    // a footer for the document or a section
  "header"     : "div",    // header for the document or a section
  "main"       : "div",    // the main content of a document
  "mark"       : "strong", // marked or highlighted text
  "nav"        : "div",    // navigation links in the document
  "section"    : "div",    // a section in the document
  "summary"    : "h3",     // a visible heading for a <details> element
  "wbr"        : "br",     // a possible line-break
  "xmp"        : "pre"     // an example of a code in the document
};

// HELPERS
            
function getErrorName( code ) {
  var results = Components.results;
  for ( var name in results ) {
    if ( results[name] == "" + code ) {
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
  return Components.classes["@mozilla.org/xmlextras/xmlserializer;1"]
                   .createInstance( Components.interfaces.nsIDOMSerializer )
                   .serializeToString( dom );
};

function serializeHTMLToString( dom ) {
  var nsIDocumentEncoder = Components.interfaces.nsIDocumentEncoder;
  var documentEncoder =
    Components.classes["@mozilla.org/layout/documentEncoder;1?type=text/html"]
              .createInstance( nsIDocumentEncoder );
  documentEncoder.init( dom, "text/html",
    nsIDocumentEncoder.OutputLFLineBreak |
    nsIDocumentEncoder.OutputRaw
  );
  documentEncoder.setCharset( "utf-8" );
  return documentEncoder.encodeToString();
};

function getFileURI( file ) {
  var ioService =
    Components.classes["@mozilla.org/network/io-service;1"]
              .getService( Components.interfaces.nsIIOService );
  var fph =
    ioService.getProtocolHandler( "file" )
             .QueryInterface( Components.interfaces.nsIFileProtocolHandler );
  return fph.newFileURI( file ).QueryInterface( Components.interfaces.nsIURL );
};

function resolveURL( url, href ) {
  var ioService =
    Components.classes["@mozilla.org/network/io-service;1"]
              .getService( Components.interfaces.nsIIOService );
  var result, uri;
  try {
    uri = ioService.newURI( href, null, null );
    result = uri.resolve( url );
  } catch ( e ) {
    result = url;
  }
  return result;
};

function checkURL( url ) {
  var ioService =
    Components.classes["@mozilla.org/network/io-service;1"]
              .getService( Components.interfaces.nsIIOService );
  var uri;
  try {
    uri = ioService.newURI( url, null, null );
  } catch ( e ) {
    uri = ioService.newURI( "about:blank", null, null );
  }
  return ( uri.scheme !== "about" );
};

function getValidFileNameChunk( name ) {
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

function getSuitableFileName( url, contentType, defaultType ) {
  var ioService =
    Components.classes["@mozilla.org/network/io-service;1"]
              .getService( Components.interfaces.nsIIOService );
  var mimeService =
    Components.classes["@mozilla.org/mime;1"]
              .getService( Components.interfaces.nsIMIMEService );
  var uri = ioService.newURI( url, null, null );
  var name, mime, path, ext, mime_ext, index;
  if ( uri.scheme === "data" ) {
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
      uri.QueryInterface( Components.interfaces.nsIURL );
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
  try {
    if ( mime.length ) {
      mime_ext = mimeService.getPrimaryExtension( mime, null ).toLowerCase();
    }
  } catch ( e ) {
    if ( mime.toLowerCase().indexOf( "javascript" ) !== -1 ) {
      mime_ext = "js";
    } else {
      mime_ext = "";
    }
  }
  if ( mime_ext && mime_ext !== ext.toLowerCase() ) {
    if ( mime_ext === "jpg" && ext === "jpeg" ||
         mime_ext === "jpeg" && ext === "jpg" ||
         mime_ext === "htm" && ext === "html" ||
         mime_ext === "html" && ext === "htm" ||
         mime_ext === "xht" && ext === "xhtml" ||
         mime_ext === "xhtml" && ext === "xht" ) {
      ext = "";
    }
    if ( ext ) {
      name += "." + ext;
    }
    ext = mime_ext;
  }
  return {
    name: name,
    ext: ext
  };
};

function getFileEntryFromURL( url ) {
  var ios = Components.classes["@mozilla.org/network/io-service;1"]
                      .getService( Components.interfaces.nsIIOService );
  var fph = ios.getProtocolHandler( "file" )
               .QueryInterface( Components.interfaces.nsIFileProtocolHandler );
  var chr = Components.classes["@mozilla.org/chrome/chrome-registry;1"]
                      .getService( Components.interfaces.nsIChromeRegistry );
  var uri = ios.newURI( url, null, null );
  return fph.getFileFromURLSpec( chr.convertChromeURL( uri ).spec ).clone();
};

function createFileEntry( dir, name ) {
  var ostream =
    Components.classes["@mozilla.org/network/file-output-stream;1"]
              .createInstance( Components.interfaces.nsIFileOutputStream );
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
    Components.classes["@mozilla.org/network/file-output-stream;1"]
              .createInstance( Components.interfaces.nsIFileOutputStream );
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
  dirEntry.create(
    Components.interfaces.nsIFile.DIRECTORY_TYPE,
    parseInt( "0774", 8 )
  );
  return {
    fileEntry: fileEntry.clone(),
    dirEntry: dirEntry.clone()
  };
};

function writeFileEntry( entry, encoding, data ) {
  var isInit = false, enc = encoding;
  var cstream =
    Components.classes["@mozilla.org/intl/converter-output-stream;1"]
              .createInstance( Components.interfaces.nsIConverterOutputStream );
  var ostream =
    Components.classes["@mozilla.org/network/file-output-stream;1"]
              .createInstance( Components.interfaces.nsIFileOutputStream );
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
          Components.interfaces.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER
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

function loadURLToFileEntry( url, referrer, ctx,
                             entry, mode, perm, bufsize, listener ) {
  var nsIIOService = Components.interfaces.nsIIOService;
  var nsIScriptableInputStream = Components.interfaces.nsIScriptableInputStream;
  var nsIFileOutputStream = Components.interfaces.nsIFileOutputStream;
  var nsIBufferedOutputStream = Components.interfaces.nsIBufferedOutputStream;
  var nsISafeOutputStream = Components.interfaces.nsISafeOutputStream;
  var nsIHttpChannel = Components.interfaces.nsIHttpChannel;
  var ioService =
    Components.classes["@mozilla.org/network/io-service;1"]
              .getService( nsIIOService );
  var fileOutputStream =
    Components.classes["@mozilla.org/network/safe-file-output-stream;1"]
              .createInstance( nsIFileOutputStream );
  var bufferedOutputStream =
    Components.classes["@mozilla.org/network/buffered-output-stream;1"]
              .createInstance( nsIBufferedOutputStream );
  var status, uri, channel = null;
  try {
    uri = ioService.newURI( url, null, null );
    channel = ioService.newChannelFromURI( uri );
    if ( uri.scheme.indexOf( "http" ) !== -1 &&
         channel instanceof nsIHttpChannel &&
         referrer ) {
      channel.referrer = ioService.newURI( referrer, null, null );
    }
    channel.asyncOpen(
      {
        onStartRequest: function ( aRequest, aContext ) {
          var isRequestSucceeded = true;
          if ( listener && listener.onstart ) {
            listener.onstart( channel, aRequest, aContext );
          }
          if ( channel instanceof nsIHttpChannel ) {
            try {
              isRequestSucceeded = channel.requestSucceeded;
            } catch ( e ) {
              isRequestSucceeded = false;
            }
          }
          if ( isRequestSucceeded ) {
            fileOutputStream.init( entry, mode, perm,
              nsIFileOutputStream.DEFER_OPEN );
            bufferedOutputStream.init( fileOutputStream, bufsize );
          } else {
            aRequest.cancel( Components.results.NS_ERROR_FILE_NOT_FOUND );
          }
        },
        onStopRequest: function ( aRequest, aContext, aStatusCode ) {
          bufferedOutputStream.flush();
          if ( fileOutputStream instanceof nsISafeOutputStream ) {
            fileOutputStream.finish();
          } else {
            fileOutputStream.close();
          }
          if ( listener && listener.onstop ) {
            listener.onstop( channel, aRequest, aContext, aStatusCode );
          }
        },
        onDataAvailable: function ( aRequest, aContext, aStream,
                                    aOffset, aCount ) {
          var count = aCount;
          while ( count > 0 ) {
            count -= bufferedOutputStream.writeFrom( aStream, count );
          }
          if ( listener && listener.onprogress ) {
            listener.onprogress( channel, aRequest, aContext, aOffset, aCount );
          }
        }
      },
      ctx
    );
  } catch ( e ) {
    if ( e.name && ( e.name in Components.results ) ) {
      status = Components.results[e.name];
    } else {
      status = Components.results.NS_ERROR_UNEXPECTED;
    }
    if ( listener && listener.onstop ) {
      listener.onstop( channel, null, ctx, status );
    }
  }
};

function getNSPrefixies( element ) {
  /** 
   * Reserved Prefixes and Namespace Names
   *
   * "xml"   : "http://www.w3.org/XML/1998/namespace"
   * "xmlns" : "http://www.w3.org/2000/xmlns/"
   */
  var name, result = [ "xml", "xmlns" ];
  while ( element ) {
    for ( var i = element.attributes.length - 1; i >= 0; i-- ) {
      name = element.attributes[i].name.toLowerCase();
      if ( name.indexOf( "xmlns:" ) === 0 ) {
        name = name.substring( 6 );
        if ( result.indexOf( name ) === -1 ) {
          result.push( name );
        }
      }
    }
    element = element.parentElement;
  }
  return result;
};

function getDefaultNS( element ) {
  var documentElement = element.ownerDocument.documentElement;
  while ( element && element !== documentElement ) {
    for ( var i = element.attributes.length - 1; i >= 0; i-- ) {
      if ( element.attributes[i].name.toLowerCase() === "xmlns" ) {
        return element.attributes[i].value;
      }
    }
    element = element.parentElement;
  }
  return element.namespaceURI;
};

function fixupName( anElement, aName ) {
  var prefix, localName, index, prefixies;
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
  result = ( result ? result[0] : "" );
  index = result.indexOf( ":" );
  if ( index !== -1 ) {
    prefix = result.substring( 0, index );
    localName = result.substring( index + 1 );
    if ( prefix.length && localName.length ) {
      prefixies = getNSPrefixies( anElement );
      if ( prefixies.indexOf( prefix ) === -1 ) {
        if ( prefix in NAMESPACES ) {
          anElement.setAttribute( "xmlns:" + prefix, NAMESPACES[prefix] );
        } else {
          localName = prefix + ":" + localName;
          prefix = "";
        }
      }
    } else if ( prefix.length && !localName.length ) {
      localName = prefix + ":";
      prefix = "";
    } else if ( !prefix.length && localName.length ) {
    } else if ( !prefix.length && !localName.length ) {
      localName = ":";
      prefix = "";
    }
    prefix = ( prefix.length ? prefix + ":" : "" );
    localName = localName.replace( /\:/g, "_" );
    result = prefix + localName;
  }
  return result;
};

// CSS

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

function getSelectorFromChanges( aChanges, aSelector ) {
  for each ( var aChange in aChanges ) {
    if ( aSelector === aChange.nodeName ) {
      return aChange;
    }
  }
  return null;
};

function checkSelector( aChanges, aDocument, aSelectors ) {
  if ( !aSelectors ) {
    return true;
  }
  var selectors = aSelectors.split( "," );
  for each ( var selector in selectors ) {
    selector = selector.trim();
    if ( selector.length ) {
      selector = splitSelector( selector )[0];
      if ( selector.length ) {
        if ( getSelectorFromChanges( aChanges, selector ) ) {
          return true;
        }
        try {
          if ( aDocument.querySelector( selector ) ) {
            return true;
          }
        } catch ( e ) {
          // SYNTAX_ERR
          return true;
        }
      }
    }
  }
  return false;
};

function inspectRule( aChanges, aRule, aSheetURL, aDocumentURL,
                      aLoader, aDirectory, aCallback, aLines, anIndex ) {
  var selector, chunks, change, flag = false;
  var selectorText = aRule.selectorText ? aRule.selectorText : "";
  var selectors = selectorText.split( "," );
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
  for ( var i = 0; i < selectors.length; i++ ) {
    selectors[i] = selectors[i].trim();
    if ( selectors[i].length ) {
      chunks = splitSelector( selectors[i] );
      change = getSelectorFromChanges( aChanges, chunks[0] );
      if ( change ) {
        selectors[i] = "." + change.className + chunks[1];
        flag = true;
      }
    }
  }
  if ( flag ) {
    selectorText = selectors.join( ", " );
  }
  cssText =
    ( selectorText + cssText ).replace( /([^\{\}])(\r|\n|\r\n)/g, "$1" );
  return cssText;
};

function processStyleSheet( aRules, aChanges, aDocument, aSheet, aLoader,
                            aDirectory, aFlags ) {
  if ( !aSheet || aSheet.disabled ) {
    return;
  }
  var aDocumentURL = aDocument.documentURI;
  var sheet = aSheet, href = aSheet.href;
  var media, supports, keyframe, rule, matchMedia;
  var cssIndex, cssText, rules = {
    href: href,
    lines: []
  };
  if ( href ) {
    for ( var i = 0; i < aRules.length; i++ ) {
      if ( aRules[i].href === href ) {
        return;
      }
    }
  }
  aRules.push( rules );
  while ( !href ) {
    if ( sheet.parentStyleSheet ) {
      sheet = sheet.parentStyleSheet;
      href = sheet.href;
    } else {
      href = aDocument.baseURI;
    }
  }
  for ( var i = 0; i < aSheet.cssRules.length; i++ ) {
    rule = aSheet.cssRules[i];
    switch ( rule.type ) {
      case nsIDOMCSSRule.IMPORT_RULE:
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
        */
        matchMedia = true;
        if ( rule.conditionText ) {
          matchMedia = aDocument.defaultView.matchMedia( rule.conditionText );
          matchMedia = matchMedia && matchMedia.matches;
        }
        if ( matchMedia ) {
          sheet = rule.styleSheet;
          if ( sheet ) {
            processStyleSheet( aRules, aChanges, aDocument, sheet, aLoader,
              aDirectory, aFlags );
          }
        }  
        break;
      // TODO: Conditional group rules
      case nsIDOMCSSRule.SUPPORTS_RULE:
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
        boolValue = CSS.supports(propertyName, value);
        boolValue = CSS.supports(supportCondition);
        */
        if ( rule.supports( rule.conditionText ) ) {
          for ( var j = 0; j < rule.cssRules.length; j++ ) {
            supports = rule.cssRules[j];
            if ( supports.cssText &&
                 checkSelector( aChanges, aDocument, supports.selectorText ) ) {
              cssIndex = rules.lines.length;
              cssText = inspectRule( aChanges, supports, href, aDocumentURL,
                                     aLoader, aDirectory,
                function( job, lines, index ) {
                  lines[index] = lines[index].replace(
                    job.getURL(),
                    encodeURI( job.getEntry().leafName ),
                    "g"
                  );
                },
                rules.lines,
                cssIndex
              );
              rules.lines.push( cssText );
            }
          }
        }
      break;
      // TODO: Conditional group rules
      case nsIDOMCSSRule.MEDIA_RULE:
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
        matchMedia = aDocument.defaultView.matchMedia( rule.conditionText );
        matchMedia = matchMedia && matchMedia.matches;
        if ( matchMedia ) {
          for ( var j = 0; j < rule.cssRules.length; j++ ) {
            media = rule.cssRules[j];
            if ( media.cssText &&
                 checkSelector( aChanges, aDocument, media.selectorText ) ) {
              cssIndex = rules.lines.length;
              cssText = inspectRule( aChanges, media, href, aDocumentURL,
                                     aLoader, aDirectory,
                function( job, lines, index ) {
                  lines[index] = lines[index].replace(
                    job.getURL(),
                    encodeURI( job.getEntry().leafName ),
                    "g"
                  );
                },
                rules.lines,
                cssIndex
              );
              rules.lines.push( cssText );
            }
          }
        }
        break;
      case nsIDOMCSSRule.STYLE_RULE:
        if ( rule.cssText &&
             checkSelector( aChanges, aDocument, rule.selectorText ) ) {
          cssIndex = rules.lines.length;
          cssText = inspectRule( aChanges, rule, href, aDocumentURL, aLoader,
            aDirectory,
            function( job, lines, index ) {
              lines[index] = lines[index].replace(
                job.getURL(),
                encodeURI( job.getEntry().leafName ),
                "g"
              );
            },
            rules.lines,
            cssIndex
          );
          rules.lines.push( cssText );
        }
        break;
      case nsIDOMCSSRule.NAMESPACE_RULE:
        /**
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
        if ( rule.cssText ) {
          rules.lines.push( rule.cssText );
        }
        break;
      case nsIDOMCSSRule.CHARSET_RULE:
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
        break;
      // TODO: Conditional group rules
      case nsIDOMCSSRule.DOCUMENT_RULE:
        /*
        CSS4 (deferred)
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
        if ( rule.cssText ) {
          rules.lines.push( rule.cssText );
        }
        break;
      case nsIDOMCSSRule.KEYFRAMES_RULE:
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
        if ( rule.cssText ) {
          rules.lines.push( "@keyframes " + rule.name + "{" );
          for ( var j = 0; j < rule.cssRules.length; j++ ) {
            keyframe = rule.cssRules[j];
            if ( keyframe.cssText ) {
              cssIndex = rules.lines.length;
              cssText = inspectRule( aChanges, keyframe, href, aDocumentURL,
                                     aLoader, aDirectory,
                function( job, lines, index ) {
                  lines[index] = lines[index].replace(
                    job.getURL(),
                    encodeURI( job.getEntry().leafName ),
                    "g"
                  );
                },
                rules.lines,
                cssIndex
              );
              rules.lines.push( cssText );
            }
          }
          rules.lines.push( "}" );
        }
        break;
      case nsIDOMCSSRule.PAGE_RULE:
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
        if ( rule.cssText ) {
          rules.lines.push( rule.cssText );
        }
        break;
      default:
        /**
          UNKNOWN_RULE
        */
        if ( rule.cssText ) {
          rules.lines.push( rule.cssText );
        }
        break;
    }
  }
};

function collectStyles( aRules, aChanges, aDocument, aLoader, aDirectory,
                        aFlags ) {
  for ( var i = 0; i < aDocument.styleSheets.length; i++ ) {
    processStyleSheet( aRules, aChanges, aDocument, aDocument.styleSheets[i],
                       aLoader, aDirectory, aFlags );
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
    Utils.log(
      Utils.dumpStack() + "\n" +
      anElement.nodeName + "." + aName + ": " + aValue + "\n" +
      e
    );
  }
};

function replaceElement( anElement, aNodeName, aClassName ) {
  var prefix, localName, namespaceURI;
  var index, node, next, element, name, value;
  index = aNodeName.indexOf( ":" );
  if ( index === -1 ) {
    prefix = "";
    localName = aNodeName;
  } else {
    prefix = aNodeName.substring( 0, index );
    localName = aNodeName.substring( index + 1 );
  }
  if ( prefix ) {
    namespaceURI = NAMESPACES[prefix];
  } else {
    namespaceURI = getDefaultNS( anElement );
  }
  element = anElement.ownerDocument.createElementNS( namespaceURI, localName );
  node = anElement.firstChild;
  while ( node ) {
    next = node.nextSibling;
    element.appendChild( node );
    node = next;
  }
  for ( var i = anElement.attributes.length - 1; i >= 0; i-- ) {
    name = anElement.attributes[i].name;
    value = anElement.attributes[i].value;
    setElementAttribute( element, name, value );
  }
  if ( aClassName ) {
    element.classList.add( aClassName );
  }
  anElement.parentNode.replaceChild( element, anElement );
  return element;
};

function fixupElement( anElement, aChanges, aFlags ) {
  var prefix, localName, namespaceURI
  var attrName, nodeName, className;
  var attr, attrs = [];
  var name, value, index;
  // fixup attribute names
  for ( var i = 0; i < anElement.attributes.length; i++ ) {
    attrs.push( anElement.attributes[i] );
  }
  for ( var i = 0; i < attrs.length; i++ ) {
    attr = attrs[i];
    prefix = ( attr.prefix ? attr.prefix : "" );
    localName = ( attr.localName ? attr.localName : "" );
    name = ( prefix.length ? prefix + ":" : "" ) + localName;
    attrName = fixupName( anElement, name );
    if ( attrName ) {
      if ( attrName !== name ) {
        value = anElement.attributes[name].value;
        anElement.removeAttribute( name );
        anElement.setAttribute( attrName, value );
      }
    } else {
      anElement.removeAttribute( name );
    }
  }
  // fixup tag name
  prefix = ( anElement.prefix ? anElement.prefix : "" );
  localName = ( anElement.localName ? anElement.localName : "" );
  name = ( prefix.length ? prefix + ":" : "" ) + localName;
  nodeName = fixupName( anElement, name );
  index = nodeName.indexOf( ":" );
  if ( index === -1 ) {
    prefix = "";
    localName = nodeName;
  } else {
    prefix = nodeName.substring( 0, index );
    localName = nodeName.substring( index + 1 );
  }
  if ( prefix ) {
    namespaceURI = NAMESPACES[prefix];
  } else {
    namespaceURI = getDefaultNS( anElement );
  }
  if ( !localName.length ) {
    if ( namespaceURI === NAMESPACES["html"] ) {
      localName = "div";
    } else {
      anElement.parentNode.removeChild( anElement );
      return null;
    }
  }
  if ( namespaceURI === NAMESPACES["html"] && ( localName in TAGS ) &&
       !( aFlags & 0x00001000 /* PRESERVE_HTML5_TAGS */ ) ) {
    localName = TAGS[localName];
  }
  nodeName = ( prefix.length ? prefix + ":" : "" ) + localName;
  if ( nodeName !== name ) {
    className = ( aFlags & 0x00010000 /* SAVE_STYLES */ ) ?
      localName + "_" + createUUID() : null;
    aChanges.push( {
      nodeName: name.replace( /\:/g, "\\:" ),
      className: className
    } );
    anElement = replaceElement( anElement, nodeName, className );
  }
  return anElement;
};

function addJobObserver( aJob, aCallback, aLines, anIndex ) {
  var aLoader = aJob.getLoader();
  var anObserver = {
    onJobStopped: function( anEvent ) {
      if ( anEvent.getData().job === aJob ) {
        if ( !aJob.getStatus() ) {
          aCallback( aJob, aLines, anIndex );
        }
        aLoader.removeObserver( anObserver );
      }
    }
  };
  aLoader.addObserver( anObserver );
  return aJob;
};

function inspectElement( aRules, aChanges, anElement, aDocumentURL, aBaseURL,
                         aFrames, aDirectory, aLoader, aFlags ) {
  var ioService =
    Components.classes["@mozilla.org/network/io-service;1"]
              .getService( Components.interfaces.nsIIOService );
  var anURL, anURI, aDocument, aFile, aContentType;
  var aResultObj = { value: null };
  var aDocumentURI = ioService.newURI( aDocumentURL, null, null );
  var frameEntries, fileNameObj, oldCSSText, newCSSText;
  if ( anElement.namespaceURI === "http://www.w3.org/1999/xhtml" ) {
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
        return anElement.parentNode.removeChild( anElement );
      case "script":
      case "noscript":
        if ( aFlags & 0x00000001 /* SAVE_SCRIPTS */ ) {
          if ( anElement.src ) {
            if ( anElement.hasAttribute( "type" ) ) {
              aContentType = anElement.getAttribute( "type" ).trim();
            } else {
              aContentType = "";
            }
            if ( !aContentType.length ) {
              aContentType = "text/javascript";
            }
            anURL = resolveURL( anElement.src, aBaseURL );
            if ( checkURL( anURL ) ) {
              addJobObserver(
                aLoader.createJob( aDirectory, anURL, aDocumentURL, aContentType,
                                   aDocumentURL ),
                function( job ) {
                  setElementAttribute(
                    anElement,
                    "src",
                    encodeURI( job.getEntry().leafName )
                  );
                }
              );
              setElementAttribute( anElement, "src", anURL );
            }
          }
          return anElement;
        } else {
          return anElement.parentNode.removeChild( anElement );
        }
      case "link":
        if ( anElement.hasAttribute( "rel" ) ) {
          if ( anElement.hasAttribute( "type" ) ) {
            aContentType = anElement.getAttribute( "type" ).trim();
          } else {
            aContentType = "";
          }
          switch ( anElement.rel.toLowerCase() ) {
            case "stylesheet":
              return anElement.parentNode.removeChild( anElement );
            case "icon":
            case "shortcut icon":
              if ( anElement.href ) {
                anURL = resolveURL( anElement.href, aBaseURL );
                if ( checkURL( anURL ) ) {
                  addJobObserver(
                    aLoader.createJob( aDirectory, anURL, aDocumentURL,
                                       aContentType, aDocumentURL ),
                    function( job ) {
                      setElementAttribute(
                        anElement,
                        "href",
                        encodeURI( job.getEntry().leafName )
                      );
                    }
                  );
                  setElementAttribute( anElement, "href", anURL );
                }
              }
              return anElement;
          }
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
                                 aDocumentURL ),
              function( job ) {
                setElementAttribute(
                  anElement,
                  "src",
                  encodeURI( job.getEntry().leafName )
                );
              }
            );
            setElementAttribute( anElement, "src", anURL );
          }
        }
        anElement.removeAttribute( "livesrc" );
        break;
      case "embed":
        if ( anElement.src ) {
          if ( anElement.hasAttribute( "type" ) ) {
            aContentType = anElement.getAttribute( "type" ).trim();
          } else {
            aContentType = "";
          }
          anURL = resolveURL( anElement.src, aBaseURL );
          if ( checkURL( anURL ) ) {
            addJobObserver(
              aLoader.createJob( aDirectory, anURL, aDocumentURL, aContentType,
                                 aDocumentURL ),
              function( job ) {
                setElementAttribute(
                  anElement,
                  "src",
                  encodeURI( job.getEntry().leafName )
                );
              }
            );
            setElementAttribute( anElement, "src", anURL );
          }
        }
        anElement.removeAttribute( "livesrc" );
        break;
      case "object":
        if ( anElement.data ) {
          if ( anElement.hasAttribute( "type" ) ) {
            aContentType = anElement.getAttribute( "type" ).trim();
          } else {
            aContentType = "";
          }
          anURL = resolveURL( anElement.data, aBaseURL );
          if ( checkURL( anURL ) ) {
            addJobObserver(
              aLoader.createJob( aDirectory, anURL, aDocumentURL,
                                 aContentType, aDocumentURL ),
              function( job ) {
                setElementAttribute(
                  anElement,
                  "data",
                  encodeURI( job.getEntry().leafName )
                );
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
                                 aDocumentURL ),
              function( job ) {
                setElementAttribute(
                  anElement,
                  "background",
                  encodeURI( job.getEntry().leafName )
                );
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
                                     "", aDocumentURL ),
                  function( job ) {
                    setElementAttribute(
                      anElement,
                      "src",
                      encodeURI( job.getEntry().leafName )
                    );
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
        aDocument = aFrames.shift();
        if ( aFlags & 0x00000010 /* SAVE_FRAMES */ ) {
          if ( anElement.src ) {
            anURL = resolveURL( anElement.src, aBaseURL );
            fileNameObj = getSuitableFileName( anURL, aDocument.contentType );
            if ( aFlags & 0x00000100 /* SAVE_FRAMES_IN_SEPARATE_DIRECTORY */ ) {
              frameEntries = createEntriesToSaveFrame(
                aDirectory,
                fileNameObj.name,
                fileNameObj.ext,
                "_files"
              );
              aFile = frameEntries.fileEntry;
              saveDocument( aDocument, aResultObj, aFile, frameEntries.dirEntry,
                aLoader, aFlags );
            } else {
              aFile = createFileEntry(
                aDirectory,
                fileNameObj.name + ( fileNameObj.ext ? "." + fileNameObj.ext : "" )
              );
              saveDocument( aDocument, aResultObj, aFile, aDirectory, aLoader,
                aFlags );
            }
            setElementAttribute( anElement, "src", encodeURI( aFile.leafName ) );
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
      var oldCSSText = anElement.style.cssText;
      var newCSSText = inspectRule(
        aChanges, anElement.style, aBaseURL, aDocumentURL, aLoader,
        aDirectory,
        function( job ) {
          var cssText = anElement.style.cssText.replace(
            job.getURL(),
            encodeURI( job.getEntry().leafName ),
            "g"
          );
          anElement.style.cssText = cssText;
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

function createStyles( aDocument, aRules, aBaseURL, aFile, aDirectory, aFlags ) {
  var aStyle, anURL, aText, aCSSFile, aCSSFileName, prefix;
  var line, index, anAtLines = [];
  for ( var i = aRules.length - 1; i >= 0 ; i-- ) {
    for ( var j = aRules[i].lines.length - 1; j >= 0 ; j-- ) {
      line = aRules[i].lines[j].trim();
      if ( line.length ) {
        if ( !( aFlags & 0x01000000 /* SAVE_STYLESHEETS_IN_SEPARATE_FILES */ ) &&
             line.indexOf( "@namespace" ) === 0 ) {
          index = anAtLines.indexOf( line );
          if ( index === -1 ) {
            anAtLines.push( line );
          }
          aRules[i].lines.splice( j, 1 );
        }
      } else {
        aRules[i].lines.splice( j, 1 );
      }
    }
  }
  aText = "";
  for ( var i = 0; i < aRules.length; i++ ) {
    if ( aRules[i].lines.length ) {
      anURL = aRules[i].href;
      if ( anURL ) {
        if ( aFlags & 0x01000000 /* SAVE_STYLESHEETS_IN_SEPARATE_FILES */ ) {
          aText = "/***** " + anURL + " *****/\n" +
                  aRules[i].lines.join( "\n" );
          aCSSFileName = getSuitableFileName( anURL, "text/css" );
          prefix = "";
          do {
            aCSSFile = aDirectory.clone();
            aCSSFile.append( prefix + aCSSFileName.name +
                             "." + aCSSFileName.ext );
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
          aDocument.getElementsByTagName( "head" )[0].appendChild(
            aDocument.createTextNode( "\n" ) );
          aDocument.getElementsByTagName( "head" )[0].appendChild( aStyle );
        } else if ( aFlags & 0x00100000 /* SAVE_STYLESHEETS_IN_SINGLE_FILE */ ) {
          aText += ( i ? "\n" : "" ) +
                   "/***** " + anURL + " *****/\n" +
                   aRules[i].lines.join( "\n" );
        } else {
          aText += ( i ? "\n      " : "" ) +
                   "/***** " + anURL + " *****/\n      " +
                   aRules[i].lines.join( "\n      " );
        }
      } else {
        if ( aFlags & 0x01000000 /* SAVE_STYLESHEETS_IN_SEPARATE_FILES */ ) {
          aText = aRules[i].lines.join( "\n      " );
          aStyle = aDocument.createElementNS(
            aDocument.documentElement.namespaceURI,
            "style"
          );
          aStyle.textContent = aText + "\n    ";
          aDocument.getElementsByTagName( "head" )[0].appendChild(
            aDocument.createTextNode( "\n" ) );
          aDocument.getElementsByTagName( "head" )[0].appendChild( aStyle );
        } else if ( aFlags & 0x00100000 /* SAVE_STYLESHEETS_IN_SINGLE_FILE */ ) {
          aText += ( i ? "\n" : "" ) +
                   "/***** internal style sheet *****/\n" +
                   aRules[i].lines.join( "\n" );
        } else {
          aText += ( i ? "\n      " : "" ) +
                   "/***** internal style sheet *****/\n      " +
                   aRules[i].lines.join( "\n      " );
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
    aDocument.getElementsByTagName( "head" )[0].appendChild(
      aDocument.createTextNode( "\n" ) );
    aDocument.getElementsByTagName( "head" )[0].appendChild( aStyle );
  }
};

function processElement( aRules, aChanges, aRoot, aDocumentURL,
                         aBaseURL, aFrames, aDirectory, aLoader, aFlags ) {
  var aNextElementSibling, anElement = aRoot.firstElementChild;
  while ( anElement ) {
    aNextElementSibling = anElement.nextElementSibling;
    try {
      anElement = fixupElement( anElement, aChanges, aFlags );
      if ( anElement ) {
        anElement = inspectElement( aRules, aChanges, anElement, aDocumentURL,
                                    aBaseURL, aFrames, aDirectory, aLoader, aFlags );
        processElement( aRules, aChanges, anElement, aDocumentURL,
                        aBaseURL, aFrames, aDirectory, aLoader, aFlags );
      }
    } catch ( e ) {
      Utils.log( e );
    }
    anElement = aNextElementSibling;
  }
};

function collectFrames( aDocument ) {
  var result = [], frames = aDocument.defaultView.frames;
  for ( var i = 0; i < frames.length; i++ ) {
    result.push( frames[i].document );
  }
  return result;
};

function doneDocument( aDocument, aResult, aRules, aBaseURL, aFile, aDirectory, aFlags ) {
  var aHead, aStyle, aMeta, aCollection, aBase, aBaseTarget;
  var namespaceURI = aResult.documentElement.namespaceURI;
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
  // STYLE
  if ( aFlags & 0x00010000 /* SAVE_STYLES */ ) {
    createStyles( aResult, aRules, aBaseURL, aFile, aDirectory, aFlags );
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
  // META
  aMeta = aResult.createElementNS( namespaceURI, "meta" );
  aHead.insertBefore( aMeta, aHead.firstElementChild );
  if ( isDocumentHTML5( aDocument ) ) {
    setElementAttribute( aMeta, "charset", "utf-8" );
  } else {
    setElementAttribute( aMeta, "http-equiv", "Content-Type" );
    setElementAttribute( aMeta, "content", aDocument.contentType + "; charset=utf-8" );
  }
  // WRITE
  writeDocument( aResult, aDocument.contentType, aFile );
};

function saveDocument( aDocument, aResultObj, aFile, aDirectory, aLoader,
                       aFlags ) {
  var aResult = aResultObj.value = cloneDocument( aDocument );
  var isFrame = ( aDocument.defaultView.top !== aDocument.defaultView.self );
  var aBaseURL = getFileURI( aFile.parent ).getRelativeSpec(
    getFileURI( aDirectory ) );
  var aRules = [];
  var aChanges = [];
  processElement(
    aRules,
    aChanges,
    aResult.documentElement,
    aDocument.documentURI,
    aDocument.baseURI,
    collectFrames( aDocument ),
    aDirectory,
    aLoader,
    aFlags
  );
  if ( aFlags & 0x00010000 /* SAVE_STYLES */ ) {
    collectStyles(
      aRules,
      aChanges,
      aDocument,
      aLoader,
      aDirectory,
      aFlags
    );
  }
  if ( aLoader.hasGroupJobs( aDocument.documentURI ) ) {
    aLoader.addObserver( {
      onGroupStopped: function( anEvent ) {
        if ( anEvent.getData().id === aDocument.documentURI ) {
          doneDocument( aDocument, aResult, aRules, aBaseURL, aFile, aDirectory, aFlags );
        }
      }
    } );
  } else {
    doneDocument( aDocument, aResult, aRules, aBaseURL, aFile, aDirectory, aFlags );
  }
};

function cloneDocument( aDocument ) {
  var aNode, aResult = aDocument.implementation.createDocument(
    aDocument.documentElement.namespaceURI,
    null,
    aDocument.doctype ?
      aDocument.doctype :
      aDocument.implementation.createDocumentType( 'html', '', '' )
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
  writeFileEntry(
    aFile,
    "utf-8",
    aType.indexOf( "xml" ) !== -1 ?
      serializeXMLToString( aDocument ) :
      serializeHTMLToString( aDocument )
  );
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
        onstart: function( aChannel, aRequest, aContext ) {
          var mime, fileNameObj, name, entry;
          if ( aChannel instanceof Components.interfaces.nsIHttpChannel ) {
            try {
              mime = ( aChannel.requestSucceeded ? aChannel.contentType : null );
            } catch ( e ) {
              mime = null;
            }
          } else {
            mime = null;
          }
          fileNameObj = getSuitableFileName(
             self.getURL(), mime, self.mContentType );
          name = fileNameObj.name;
          if ( fileNameObj.ext ) {
            name += "." + fileNameObj.ext;
          }
          entry = createFileEntry( self.getDirectory(), name );
          self.mEntry.initWithFile( entry );
          self.mRequest = aRequest;
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
        this.mRequest.cancel( Components.results.NS_BINDING_ABORTED );
      }
      this.stop( Components.results.NS_BINDING_ABORTED );
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
