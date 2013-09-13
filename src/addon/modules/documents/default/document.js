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
if ( !ru.akman.znotes.doc ) ru.akman.znotes.doc = {};

Components.utils.import( "resource://znotes/utils.js"  , ru.akman.znotes );

var EXPORTED_SYMBOLS = ["Document"];

var Document = function() {

  var DocumentException = function( message ) {
    this.name = "DocumentException";
    this.message = message;
    this.toString = function() {
      return this.name + ": " + this.message;
    }
  };

  var pub = {};

  pub.getInfo = function() {
    return {
      url: "chrome://znotes_documents/content/default/",
      iconURL: "chrome://znotes_images/skin/documents/default/default.png",
      type: "application/xhtml+xml",
      defaultNS: "http://www.w3.org/1999/xhtml",
      errorNS: "http://www.mozilla.org/newlayout/xml/parsererror.xml",
      name: "default",
      version: "1.0",
      description: "XHTML5 Document",
    };
  };

  pub.getURL = function() {
    return pub.getInfo().url;
  };
  
  pub.getIconURL = function() {
    return pub.getInfo().iconURL;
  };
  
  pub.getType = function() {
    return pub.getInfo().type;
  };

  pub.getDefaultNS = function() {
    return pub.getInfo().defaultNS;
  };

  pub.getErrorNS = function() {
    return pub.getInfo().errorNS;
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

  // !!!! %%%% !!!! MAIN_WINDOW
  pub.getBlankDocument = function( aBaseURI, aTitle, aCommentFlag ) {
    var win = ru.akman.znotes.Utils.MAIN_WINDOW;
    var impl = win.document.implementation;
    var dom = impl.createDocument(
      pub.getDefaultNS(),
      'html',
      impl.createDocumentType( 'html', '', '' )
    );
    var firstChild = dom.firstChild;
    dom.insertBefore(
      dom.createProcessingInstruction(
        'xml',
        'version="1.0" encoding="UTF-8"'
      ), firstChild
    );
    if ( aCommentFlag ) {
      dom.insertBefore( dom.createComment( " Created by ZNotes! " ), firstChild );
    }
    dom.documentElement.appendChild( dom.createTextNode( "\n  " ) );
    var head = dom.createElementNS( pub.getDefaultNS(), 'head' );
    dom.documentElement.appendChild( head );
    if ( aBaseURI ) {
      var base = dom.createElementNS( pub.getDefaultNS(), "base" );
      base.setAttribute( "href", aBaseURI.spec );
      head.appendChild( dom.createTextNode( "\n    " ) );
      head.appendChild( base );
    }
    if ( aTitle ) {
      var title = dom.createElementNS( pub.getDefaultNS(), "title" );
      title.textContent = "\n      " + aTitle + "\n    ";
      head.appendChild( dom.createTextNode( "\n    " ) );
      head.appendChild( title );
    }
    if ( aCommentFlag ) {
      head.appendChild( dom.createTextNode( "\n    " ) );
      head.appendChild( dom.createComment( " Insert your code here ... " ) );
      head.appendChild( dom.createTextNode( "\n  " ) );
    }
    dom.documentElement.appendChild( dom.createTextNode( "\n  " ) );
    var body = dom.createElementNS( pub.getDefaultNS(), 'body' );
    if ( aCommentFlag ) {
      body.appendChild( dom.createTextNode( "\n    " ) );
      body.appendChild( dom.createComment( " Insert your code here ... " ) );
      body.appendChild( dom.createTextNode( "\n  " ) );
    }
    dom.documentElement.appendChild( body );
    dom.documentElement.appendChild( dom.createTextNode( "\n" ) );
    return dom;
  };
  
  pub.getErrorDocument = function( aBaseURI, aTitle, errorText, sourceText ) {
    var dom = pub.getBlankDocument( aBaseURI, aTitle );
    var body = dom.getElementsByTagNameNS( pub.getDefaultNS(), 'body' )[0];
    var parsererror = dom.createElementNS( pub.getErrorNS(), 'parsererror' );
    if ( errorText ) {
      parsererror.textContent = errorText;
    }
    var sourcetext = dom.createElementNS( pub.getErrorNS(), 'sourcetext' );
    if ( sourceText ) {
      sourcetext.textContent = sourceText;
    }
    parsererror.appendChild( sourcetext );
    body.appendChild( parsererror );
    return dom;
  };
  
  pub.parseFromString = function( aData, anURI, aBaseURI, aTitle ) {
    var domParser = Components.classes["@mozilla.org/xmlextras/domparser;1"]
                              .createInstance( Components.interfaces.nsIDOMParser );
    domParser.init( null, anURI, aBaseURI, null );
    var tmp = domParser.parseFromString( aData, pub.getType() );
    if ( tmp.documentElement &&
         tmp.documentElement.localName == "parsererror" &&
         tmp.documentElement.namespaceURI == pub.getErrorNS() ) {
      var dom = pub.getBlankDocument( aBaseURI, aTitle );
      var parsererror = dom.importNode( tmp.documentElement, true );
      parsererror.firstChild.textContent = decodeURIComponent(
        parsererror.firstChild.textContent
      );
      dom.body.appendChild( parsererror );
      return { result: false, dom: dom, changed: false };
    }
    var err = pub.checkDocument( tmp, anURI, aBaseURI, aTitle );
    if ( err ) {
      return { result: false, dom: err, changed: false };
    }
    pub.sanitizeDocument( tmp, aBaseURI );
    pub.fixupDocument( tmp, aBaseURI, aTitle );
    return { result: true, dom: tmp, changed: ( aData != pub.serializeToString( tmp ) ) };
  };

  // !!!! %%%% !!!! STRINGS_BUNDLE
  pub.checkDocument = function( aDOM, anURI, aBaseURI, aTitle ) {
    var stringsBundle = ru.akman.znotes.Utils.STRINGS_BUNDLE;
    var errorText = stringsBundle.getFormattedString(
      "document.driver.parsing.error",
      [ decodeURIComponent( anURI.spec ) ]
    );
    if ( aDOM.documentElement.tagName != "html" ||
         aDOM.documentElement.namespaceURI != pub.getDefaultNS() ) {
      return pub.getErrorDocument(
        aBaseURI,
        aTitle,
        errorText,
        stringsBundle.getFormattedString(
          "document.driver.parsing.error.html",
          [ pub.getDefaultNS() ]
        )
      );
    }
    if ( aDOM.getElementsByTagNameNS( pub.getDefaultNS(), "head" ).length != 1 ) {
      return pub.getErrorDocument(
        aBaseURI,
        aTitle,
        errorText,
        stringsBundle.getFormattedString(
          "document.driver.parsing.error.head",
          [ pub.getDefaultNS() ]
        )
      );
    }
    if ( aDOM.getElementsByTagNameNS( pub.getDefaultNS(), "body" ).length != 1 ) {
      return pub.getErrorDocument(
        aBaseURI,
        aTitle,
        errorText,
        stringsBundle.getFormattedString(
          "document.driver.parsing.error.body",
          [ pub.getDefaultNS() ]
        )
      );
    }
    return null;
  };
  
  pub.sanitizeDocument = function( aDOM, aBaseURI ) {
    // ALWAYS AND FOREVER
    // IS_SANITIZE_ENABLED === true
    if ( !ru.akman.znotes.Utils.IS_SANITIZE_ENABLED ) {
      return;
    }
    var parserUtils = Components.classes["@mozilla.org/parserutils;1"]
                                .getService( Components.interfaces.nsIParserUtils );
    var xmlSerializer = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"]
                                  .createInstance( Components.interfaces.nsIDOMSerializer );
    // head
    var head = aDOM.getElementsByTagNameNS( pub.getDefaultNS(), "head" )[0];
    var headString = xmlSerializer.serializeToString( head );
    while ( head.firstChild ) {
      head.removeChild( head.firstChild );
    }
    var headFragment = parserUtils.parseFragment(
      headString,
      parserUtils.SanitizerAllowComments + parserUtils.SanitizerAllowStyle,
      true,
      aBaseURI,
      head
    );
    // clean up head
    var node = headFragment.firstChild;
    while ( node ) {
      var next = node.nextSibling;
      if ( node.nodeType == 3 ) {
        headFragment.removeChild( node );
      }
      node = next;
    }
    // fix up indents
    if ( headFragment.hasChildNodes ) {
      head.appendChild( headFragment );
      node = head.firstChild;
      while ( node ) {
        var next = node.nextSibling;
        head.insertBefore( aDOM.createTextNode( "\n    " ), node );
        node = next;
      }
    }
    // body
    var body = aDOM.getElementsByTagNameNS( pub.getDefaultNS(), "body" )[0];
    var bodyString = xmlSerializer.serializeToString( body );
    while ( body.firstChild ) {
      body.removeChild( body.firstChild );
    }
    var bodyFragment = parserUtils.parseFragment(
      bodyString,
      parserUtils.SanitizerAllowComments + parserUtils.SanitizerAllowStyle,
      true,
      aBaseURI,
      body
    );
    if ( bodyFragment.hasChildNodes ) {
      body.appendChild( bodyFragment );
    }
  };
  
  pub.serializeToString = function( aDOM ) {
    var base = aDOM.getElementsByTagName( "base" ).length > 0 ? aDOM.getElementsByTagName( "base" )[0] : null;
    if ( base ) {
      var fullHREF = base.getAttribute( "href" );
      var relativeHREF = fullHREF.substring( 0, fullHREF.length - 1 );
      relativeHREF = relativeHREF.substring( relativeHREF.lastIndexOf( "/" ) + 1 ) + "/";
      base.setAttribute( "href", relativeHREF );
    }
    var result = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"]
                           .createInstance( Components.interfaces.nsIDOMSerializer )
                           .serializeToString( aDOM );
    if ( base ) {
      base.setAttribute( "href", fullHREF );
    }
    return result.replace( /\r\n/g, "\n" );
  };
  
  pub.fixupDocument = function( aDOM, aBaseURI, aTitle ) {
    var result = false;
    var head = aDOM.getElementsByTagNameNS( pub.getDefaultNS(), "head" )[0];
    var body = aDOM.getElementsByTagNameNS( pub.getDefaultNS(), "body" )[0];
    var firstHeadChild = head.firstChild;
    var firstChildElementOfHead = head.firstElementChild;
    var href = aBaseURI.spec;
    // fix base tag, this one must be in first place in head
    var base = null;
    var text = null;
    if ( aDOM.getElementsByTagNameNS( pub.getDefaultNS(), "base" ).length == 0 ) {
      base = aDOM.createElementNS( pub.getDefaultNS(), "base" );
      if ( firstHeadChild ) {
        text = head.insertBefore( aDOM.createTextNode( "\n    " ), firstHeadChild );
        head.insertBefore( base, firstHeadChild );
      } else {
        text = head.appendChild( aDOM.createTextNode( "\n    " ) );
        head.appendChild( base );
      }
      firstHeadChild = text;
      firstChildElementOfHead = base;
      result = true;
    } else {
      base = aDOM.getElementsByTagNameNS( pub.getDefaultNS(), "base" )[0];
    }
    if ( firstChildElementOfHead != base ) {
      base = head.removeChild( base );
      if ( firstHeadChild ) {
        text = head.insertBefore( aDOM.createTextNode( "\n    " ), firstHeadChild );
        head.insertBefore( base, firstHeadChild );
      } else {
        text = head.appendChild( aDOM.createTextNode( "\n    " ) );
        head.appendChild( base );
      }
      firstHeadChild = text;
      firstChildElementOfHead = base;
      result = true;
    }
    var currHREF = base.getAttribute( "href" );
    if ( currHREF != href ) {
      base.setAttribute( "href", href );
      result = true;
    }
    // fix title tag, this one must be in second place in head
    var title = null;
    var nextBaseSibling = base.nextSibling;
    var nextBaseElementSibling = base.nextElementSibling;
    if ( aDOM.getElementsByTagNameNS( pub.getDefaultNS(), "title" ).length == 0 ) {
      title = aDOM.createElementNS( pub.getDefaultNS(), "title" );
      if ( nextBaseSibling ) {
        text = head.insertBefore( aDOM.createTextNode( "\n    " ), nextBaseSibling );
        head.insertBefore( title, nextBaseSibling );
      } else {
        text = head.appendChild( aDOM.createTextNode( "\n    " ) );
        head.appendChild( title );
      }
      nextBaseSibling = text;
      nextBaseElementSibling = title;
      result = true;
    } else {
      title = aDOM.getElementsByTagNameNS( pub.getDefaultNS(), "title" )[0];
      if ( nextBaseElementSibling != title ) {
        title = head.removeChild( title );
        if ( nextBaseSibling ) {
          text = head.insertBefore( aDOM.createTextNode( "\n    " ), nextBaseSibling );
          head.insertBefore( title, nextBaseSibling );
        } else {
          text = head.appendChild( aDOM.createTextNode( "\n    " ) );
          head.appendChild( title );
        }
        nextBaseSibling = text;
        nextBaseElementSibling = title;
        result = true;
      }
    }
    if ( title.textContent != "\n      " + aTitle + "\n    " ) {
      title.textContent = "\n      " + aTitle + "\n    ";
      result = true;
    };
    // fix indents with two space
    var doc = aDOM.documentElement;
    var node = doc.firstChild;
    while ( node && node.nodeType == 3 ) {
      node = node.nextSibling;
    }
    while ( node ) {
      var next = node.nextSibling;
      while ( next && next.nodeType == 3 ) {
        next = next.nextSibling;
      }
      var prev = node.previousSibling;
      while ( prev && prev.nodeType == 3 ) {
        prev = prev.previousSibling;
      }
      text = "";
      var ps = node.previousSibling;
      while ( ps && ( ps != prev ) ) {
        text = ps.textContent + text;
        ps = ps.previousSibling;
      }
      if ( text != "\n  " ) {
        ps = node.previousSibling;
        while ( ps && ( ps != prev ) ) {
          var ns = ps.previousSibling;
          doc.removeChild( ps );
          ps = ns;
        }
        doc.insertBefore( aDOM.createTextNode( "\n  " ), node );
        result = true;
      }
      node = next;
    }
    if ( !doc.lastChild || doc.lastChild.nodeType != 3 || doc.lastChild.textContent != "\n" ) {
      doc.appendChild( aDOM.createTextNode( "\n" ) );
      result = true;
    }
    //
    if ( !head.lastChild || head.lastChild.nodeType != 3 || head.lastChild.textContent != "\n  " ) {
      head.appendChild( aDOM.createTextNode( "\n  " ) );
      result = true;
    }
    //
    text = "";
    node = body.lastChild;
    while ( node && node.nodeType == 3 ) {
      node = node.previousSibling;
    }
    node = node ? node.nextSibling : null;
    while ( node ) {
      next = node.nextSibling;
      text += node.textContent;
      body.removeChild( node );
      node = next;
    }
    node = body.appendChild( aDOM.createTextNode( text ) );
    var tail = /(\n\u0020*)$/.exec( text );
    if ( tail ) {
      var count = 3 - tail[1].length;
      if ( count != 0 ) {
        result = true;
      }
      if ( count < 0 ) {
        node.textContent = node.textContent.substr( 0, node.textContent.length + count );
        count = 0;
      }
      while ( count > 0 ) {
        node.textContent += " ";
        count--;
      }
    } else {
      node.textContent += "\n  ";
      result = true;
    }
    return result;
  };
  
  pub.importDocument = function( aDOM, aBaseURI, aTitle ) {
    var dom = pub.getBlankDocument( aBaseURI, aTitle );
    // process nodes before documentElement
    var node = aDOM.firstChild;
    while ( node && node != aDOM.documentElement ) {
      // DOCUMENT_TYPE_NODE
      if ( node.nodeType != 10 ) {
        dom.insertBefore(
          dom.importNode( node, true ),
          dom.documentElement
        );
      }
      node = node.nextSibling;
    }
    // skip documentElement
    node = node.nextSibling;
    // process nodes after documentElement
    while ( node ) {
      // DOCUMENT_TYPE_NODE
      if ( node.nodeType != 10 ) {
        dom.appendChild(
          dom.importNode( node, true )
        );
      }
      node = node.nextSibling;
    }
    // process documentElement
    var element = dom.head;
    node = aDOM.documentElement.firstChild;
    while ( node ) {
      var next = node.nextSibling;
      // DOCUMENT_TYPE_NODE
      if ( node.nodeType != 10 ) {
        if ( node == aDOM.head ) {
          dom.documentElement.replaceChild( node, dom.head );
          element = dom.body;
        } else if ( node == aDOM.body ) {
          dom.documentElement.replaceChild( node, dom.body );
          element = null;
        } else {
          if ( element ) {
            dom.documentElement.insertBefore( dom.importNode( node, true ), element );
          } else {
            dom.documentElement.appendChild( dom.importNode( node, true ) );
          }
        }
      }
      node = next;
    };
    return dom;
  };

  return pub;

}();
