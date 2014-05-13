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

Components.utils.import( "resource://znotes/utils.js", ru.akman.znotes );
Components.utils.import( "resource://znotes/domutils.js", ru.akman.znotes );

var EXPORTED_SYMBOLS = ["Document"];

var Document = function() {

  // PUBLIC
  
  var pub = {};
  
  pub["default"] = true;
  
  pub.getInfo = function() {
    return {
      url: "chrome://znotes_documents/content/xhtml/",
      iconURL: "chrome://znotes_images/skin/documents/xhtml/icon-16x16.png",
      types: {
        "application/xhtml+xml": {
          extension: ".xhtml"
        }
      },
      // !!! DO NOT CHANGE NAME !!!
      // The name used as suffix for ids in options.xul
      name: "XHTML",
      version: "1.0",
      description: "XHTML Document"
    };
  };

  pub.getType = function() {
    return "application/xhtml+xml";
  };

  var Utils = ru.akman.znotes.Utils;
  var DOMUtils = ru.akman.znotes.DOMUtils;
  var Node = Components.interfaces.nsIDOMNode;
  
  
  var DocumentException = function( message ) {
    this.name = "DocumentException";
    this.message = message;
    this.toString = function() {
      return this.name + ": " + this.message;
    }
  };

  var observers = [];

  // HELPERS
  
  function getErrorNS() {
    return "http://www.mozilla.org/newlayout/xml/parsererror.xml";
  };
  
  function getDefaultNS() {
    return "http://www.w3.org/1999/xhtml";
  };
  
  function getMeta( metas, name, value, ignorecase ) {
    var meta;
    if ( metas ) {
      for ( var i = 0; i < metas.length; i++ ) {
        meta = metas[i];
        if ( meta.hasAttribute( name ) ) {
          if ( value !== undefined ) {
            if ( ignorecase ) {
              if ( meta.getAttribute( name ).toLowerCase() ===
                   value.toLowerCase() ) {
                return meta;
              }
            } else {
              if ( meta.getAttribute( name ) === value ) {
                return meta;
              }
            }
          } else {
            return meta;
          }
        }
      }
    }
    return null;
  };

  function fixupAttribute( element, name, value ) {
    if ( value !== null ) {
      if ( value !== element.getAttribute( name ) ) {
        element.setAttribute( name, value );
        return true;
      } 
    } else {
      if ( element.hasAttribute( name ) ) {
        element.removeAttribute( name );
        return true;
      }
    }
    return false;
  };
  
  function fixupTextContent( element, value ) {
    if ( value !== null ) {
      if ( value !== element.textContent ) {
        element.textContent = value;
        return true;
      }
    } else {
      if ( element.textContent ) {
        element.textContent = "";
        return true;
      }
    }
    return false;
  };
  
  function markupDocument( aDOM ) {
    var head, element, mark, index;
    var result = {
      mark: null,
      lang: null,
      charset: null,
      characterset: aDOM.characterSet,
      author: null,
      base: null,
      title: null
    };
    var namespaceURI = aDOM.documentElement.namespaceURI;
    if ( aDOM.documentElement.hasAttribute( "lang" ) ) {
      result.lang = { value: aDOM.documentElement.getAttribute( "lang" ) };
    }
    head = aDOM.getElementsByTagNameNS( namespaceURI, "head" )[0];
    mark = Utils.createUUID();
    result.mark = mark;
    index = 0;
    element = head.firstElementChild;
    while ( element ) {
      head.insertBefore( aDOM.createComment( mark + ":" + index ), element );
      switch ( element.tagName.toLowerCase() ) {
        case "meta":
          if ( element.hasAttribute( "charset" ) ) {
            result.charset = {
              value: element.getAttribute( "charset" ),
              index: index
            };
            break;
          }
          if ( element.hasAttribute( "name" ) &&
               element.getAttribute( "name" ) === "author" ) {
            result.author = {
              value: element.getAttribute( "content" ),
              index: index
            }
            break;
          }
          break;
        case "base":
          result.base = {
            href: element.getAttribute( "href" ),
            target: element.getAttribute( "target" ),
            index: index
          }
          break;
        case "title":
          result.title = {
            value: element.textContent,
            index: index
          }
          break;
      }
      index++;
      element = element.nextElementSibling;
    }
    return result;
  };
  
  function fixupDocument( aDOM, anURI, aBaseURI, aTitle, aMarkup ) {
    var elements, element, node, next, index;
    var result = false;
    var mark = aMarkup.mark + ":";
    var namespaceURI = aDOM.documentElement.namespaceURI;
    var head = aDOM.getElementsByTagNameNS( namespaceURI, "head" )[0];
    var metas = aDOM.getElementsByTagNameNS( namespaceURI, "meta" );
    if ( fixupAttribute( aDOM.documentElement, "lang",
      aMarkup.lang ? aMarkup.lang.value : null ) ) {
      result = true;
    }
    node = head.firstChild;
    while ( node ) {
      next = node.nextSibling;
      if ( node.nodeType === Node.COMMENT_NODE &&
           node.nodeValue.indexOf( mark ) === 0 ) {
        index = parseInt( node.nodeValue.substr( mark.length ) );
        if ( aMarkup.charset && aMarkup.charset.index === index ) {
          // charset
          element = ( ( next &&
                        next.nodeType === Node.ELEMENT_NODE ) ?
            next : null );
          if ( !element ) {
            element = node.parentNode.insertBefore(
              aDOM.createElementNS( namespaceURI, "meta" ), node );
            result = true;
          }
          if ( fixupAttribute( element, "charset", aMarkup.charset.value ) ) {
            result = true;
          }
        } else if ( aMarkup.author && aMarkup.author.index === index ) {
          // author
          element = ( ( next &&
                        next.nodeType === Node.ELEMENT_NODE ) ?
            next : null );
          if ( !element ) {
            element = node.parentNode.insertBefore(
              aDOM.createElementNS( namespaceURI, "meta" ), node );
            element.setAttribute( "name", "author" );
            result = true;
          }
          if ( fixupAttribute( element, "content", aMarkup.author.value ) ) {
            result = true;
          }
        } else if ( aMarkup.base && aMarkup.base.index === index ) {
          // base
          element = ( ( next &&
                        next.nodeType === Node.ELEMENT_NODE ) ?
            next : null );
          if ( !element ) {
            element = node.parentNode.insertBefore(
              aDOM.createElementNS( namespaceURI, "base" ), node );
            result = true;
          }
          if ( fixupAttribute( element, "href", aMarkup.base.href ) ) {
            result = true;
          }
          if ( fixupAttribute( element, "target", aMarkup.base.target ) ) {
            result = true;
          }
        } else if ( aMarkup.title && aMarkup.title.index === index ) {
          // title
          element = ( ( next &&
                        next.nodeType === Node.ELEMENT_NODE ) ?
            next : null );
          if ( !element ) {
            element = node.parentNode.insertBefore(
              aDOM.createElementNS( namespaceURI, "title" ), node );
            result = true;
          }
          if ( fixupTextContent( element, aTitle ) ) {
            result = true;
          }
        }
        node.parentNode.removeChild( node );
      }
      node = next;
    }
    // charset
    element = head.firstElementChild;
    node = getMeta( metas, "charset" );
    if ( !node ) {
      node = aDOM.createElementNS( namespaceURI, "meta" );
      node.setAttribute( "charset", aMarkup.characterset );
      head.insertBefore( aDOM.createTextNode( "\n" ), element );
      head.insertBefore( node, element );
      result = true;
    } else {
      if ( element !== node ) {
        head.insertBefore( node.parentNode.removeChild( node ), element );
        head.insertBefore( aDOM.createTextNode( "\n" ), element );
        result = true;
      } else {
        element = element.nextElementSibling;
      }
    }
    // remove meta 
    while ( element && element.tagName.toLowerCase() === "meta" ) {
      element = element.nextElementSibling;
    }
    // base
    elements = aDOM.getElementsByTagNameNS( namespaceURI, "base" );
    if ( !elements.length ) {
      node = aDOM.createElementNS( namespaceURI, "base" );
      node.setAttribute( "href", aBaseURI.spec );
      head.insertBefore( aDOM.createTextNode( "\n" ), element );
      head.insertBefore( node, element );
      result = true;
    } else {
      node = elements[0];
      if ( element !== node ) {
        head.insertBefore( node.parentNode.removeChild( node ), element );
        head.insertBefore( aDOM.createTextNode( "\n" ), element );
        result = true;
      } else {
        element = element.nextElementSibling;
      }
    }
    // title
    elements = aDOM.getElementsByTagNameNS( namespaceURI, "title" );
    if ( !elements.length ) {
      node = aDOM.createElementNS( namespaceURI, "title" );
      node.textContent = aTitle;
      head.insertBefore( aDOM.createTextNode( "\n" ), element );
      head.insertBefore( node, element );
      result = true;
    }
    return result;
  };
  
  function getErrorDocument( anURI, aBaseURI, aTitle, errorText, sourceText ) {
    var dom = pub.getBlankDocument( anURI, aBaseURI, aTitle );
    var namespaceURI = dom.documentElement.namespaceURI;
    var body = dom.getElementsByTagNameNS( namespaceURI, "body" )[0];
    var parsererror = dom.createElementNS( getErrorNS(), "parsererror" );
    var sourcetext = dom.createElementNS( getErrorNS(), "sourcetext" );
    if ( errorText ) {
      parsererror.textContent = errorText;
    }
    if ( sourceText ) {
      sourcetext.textContent = sourceText;
    }
    parsererror.appendChild( sourcetext );
    body.appendChild( parsererror );
    return dom;
  };
  
  // !!!! %%%% !!!! STRINGS_BUNDLE
  function checkDocument( aDOM, anURI, aBaseURI, aTitle ) {
    var stringsBundle = ru.akman.znotes.Utils.STRINGS_BUNDLE;
    var errorText = stringsBundle.getFormattedString(
      "document.driver.parsing.error",
      [ decodeURIComponent( anURI.spec ) ]
    );
    var namespaceURI = aDOM.documentElement.namespaceURI;
    if ( aDOM.documentElement.tagName.toLowerCase() !== "html" ) {
      return getErrorDocument(
        anURI,
        aBaseURI,
        aTitle,
        errorText,
        stringsBundle.getFormattedString(
          "document.driver.parsing.error.html",
          [ namespaceURI ]
        )
      );
    }
    if ( aDOM.getElementsByTagNameNS( namespaceURI, "head" ).length !== 1 ) {
      return getErrorDocument(
        anURI,
        aBaseURI,
        aTitle,
        errorText,
        stringsBundle.getFormattedString(
          "document.driver.parsing.error.head",
          [ namespaceURI ]
        )
      );
    }
    if ( aDOM.getElementsByTagNameNS( namespaceURI, "body" ).length !== 1 ) {
      return getErrorDocument(
        anURI,
        aBaseURI,
        aTitle,
        errorText,
        stringsBundle.getFormattedString(
          "document.driver.parsing.error.body",
          [ namespaceURI ]
        )
      );
    }
    return null;
  };
  
  function sanitizeDocument( aDOM, anURI, aBaseURI ) {
    // ALWAYS AND FOREVER
    // IS_SANITIZE_ENABLED === true
    if ( !ru.akman.znotes.Utils.IS_SANITIZE_ENABLED ) {
      return;
    }
    // BUG: sanitizer removes valid tags as for example <main>
    var parserUtils =
      Components.classes["@mozilla.org/parserutils;1"]
                .getService( Components.interfaces.nsIParserUtils );
    var xmlSerializer =
      Components.classes["@mozilla.org/xmlextras/xmlserializer;1"]
                .createInstance( Components.interfaces.nsIDOMSerializer );
    var node, next;
    var head, headFragment, headString;
    var body, bodyFragment, bodyString;
    var namespaceURI = aDOM.documentElement.namespaceURI;
    // head
    head = aDOM.getElementsByTagNameNS( namespaceURI, "head" )[0];
    headString = xmlSerializer.serializeToString( head );
    while ( head.firstChild ) {
      head.removeChild( head.firstChild );
    }
    headFragment = parserUtils.parseFragment(
      headString,
      parserUtils.SanitizerAllowComments + parserUtils.SanitizerAllowStyle,
      true,
      aBaseURI,
      head
    );
    if ( headFragment.hasChildNodes ) {
      head.appendChild( headFragment );
    }
    // body
    body = aDOM.getElementsByTagNameNS( namespaceURI, "body" )[0];
    bodyString = xmlSerializer.serializeToString( body );
    while ( body.firstChild ) {
      body.removeChild( body.firstChild );
    }
    bodyFragment = parserUtils.parseFragment(
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
  
  // PUBLIC
  
  pub.addObserver = function( aObserver ) {
    if ( observers.indexOf( aObserver ) < 0 ) {
      observers.push( aObserver );
    }
  };

  pub.removeObserver = function( aObserver ) {
    var index = observers.indexOf( aObserver );
    if ( index < 0 ) {
      return;
    }
    observers.splice( index, 1 );
  };

  pub.notifyObservers = function( event ) {
    for ( var i = 0; i < observers.length; i++ ) {
      if ( observers[i][ "on" + event.type ] ) {
        observers[i][ "on" + event.type ]( event );
      }
    }
  };
  
  pub.getId = function() {
    var info = pub.getInfo();
    return info.name + "-" + info.version;
  };
  
  pub.getURL = function() {
    return pub.getInfo().url;
  };
  
  pub.getIconURL = function() {
    return pub.getInfo().iconURL;
  };
  
  pub.getTypes = function() {
    return Object.keys( pub.getInfo().types );
  }
  
  pub.supportsType = function( aType ) {
    return ( aType in pub.getInfo().types );
  };

  pub.getExtension = function( aType ) {
    var contentType = ( aType && pub.supportsType( aType ) ) ?
      aType : pub.getType();
    return pub.getInfo().types[ contentType ].extension;
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

  pub.getDefaultPreferences = function() {
    return {
      author: "",
    };
  };

  // !!!! %%%% !!!! MAIN_WINDOW
  pub.getBlankDocument = function( anURI, aBaseURI, aTitle, aCommentFlag, aParams ) {
    var dom, head, body, meta_charset, meta_author, base, title;
    var namespaceURI, doctype;
    var prefs = pub.getPreferences();
    var win = ru.akman.znotes.Utils.MAIN_WINDOW;
    var dom, impl = win.document.implementation;
    if ( aParams && ( "namespaceURI" in aParams ) && aParams.namespaceURI ) {
      namespaceURI = aParams.namespaceURI;
    } else {
      namespaceURI = getDefaultNS();
    }
    doctype = impl.createDocumentType( 'html', '', '' );
    dom = impl.createDocument( namespaceURI, 'html', doctype );
    dom.insertBefore( dom.createProcessingInstruction(
      'xml',
      'version="1.0" encoding="UTF-8"'
    ), dom.firstChild );
    if ( !aParams || !( "lang" in aParams ) || aParams.lang ) {
      dom.documentElement.setAttribute( "lang", Utils.getLanguage() );
    }
    if ( aCommentFlag ) {
      dom.insertBefore( dom.createComment( " Created by ZNotes! " ),
        dom.documentElement );
    }
    dom.documentElement.appendChild( dom.createTextNode( "\n  " ) );
    head = dom.createElementNS( namespaceURI, "head" );
    dom.documentElement.appendChild( head );
    meta_charset = dom.createElementNS( namespaceURI, "meta" );
    meta_charset.setAttribute( "charset", "utf-8" );
    head.appendChild( dom.createTextNode( "\n    " ) );
    head.appendChild( meta_charset );
    if ( prefs.author &&
         ( !aParams || !( "author" in aParams ) || aParams.author ) ) {
      meta_author = dom.createElementNS( namespaceURI, "meta" );
      meta_author.setAttribute( "name", "author" );
      meta_author.setAttribute( "content", prefs.author );
      head.appendChild( dom.createTextNode( "\n    " ) );
      head.appendChild( meta_author );
    }
    if ( aBaseURI ) {
      base = dom.createElementNS( namespaceURI, "base" );
      base.setAttribute( "href", aBaseURI.spec );
      head.appendChild( dom.createTextNode( "\n    " ) );
      head.appendChild( base );
    }
    if ( aTitle ) {
      title = dom.createElementNS( namespaceURI, "title" );
      title.textContent = aTitle;
      head.appendChild( dom.createTextNode( "\n    " ) );
      head.appendChild( title );
    }
    if ( aCommentFlag ) {
      head.appendChild( dom.createTextNode( "\n    " ) );
      head.appendChild( dom.createComment( " Insert your code here ... " ) );
      head.appendChild( dom.createTextNode( "\n  " ) );
    }
    dom.documentElement.appendChild( dom.createTextNode( "\n  " ) );
    body = dom.createElementNS( namespaceURI, "body" );
    if ( aCommentFlag ) {
      body.appendChild( dom.createTextNode( "\n    " ) );
      body.appendChild( dom.createComment( " Insert your code here ... " ) );
      body.appendChild( dom.createTextNode( "\n  " ) );
    }
    dom.documentElement.appendChild( body );
    dom.documentElement.appendChild( dom.createTextNode( "\n" ) );
    return dom;
  };
  
  pub.serializeToString = function( aDOM, anURI, aBaseURI ) {
    var result;
    var elements = aDOM.getElementsByTagNameNS(
      aDOM.documentElement.namespaceURI, "base" );
    var base = elements.length ? elements[0] : null;
    if ( base && base.hasAttribute( "href" ) ) {
      anURI.QueryInterface( Components.interfaces.nsIURL );
      aBaseURI.QueryInterface( Components.interfaces.nsIURL );
      base.setAttribute( "href", anURI.getRelativeSpec( aBaseURI ) );
    }
    result =
      Components.classes["@mozilla.org/xmlextras/xmlserializer;1"]
                .createInstance( Components.interfaces.nsIDOMSerializer )
                .serializeToString( aDOM );
    if ( base && base.hasAttribute( "href" ) ) {
      base.setAttribute( "href", aBaseURI.spec );
    }
    return result.replace( /\r\n/g, "\n" );
  };
  
  pub.parseFromString = function( aData, anURI, aBaseURI, aTitle ) {
    var dom, err, tmp, parsererror, principal, markup;
    var domParser =
      Components.classes["@mozilla.org/xmlextras/domparser;1"]
                .createInstance( Components.interfaces.nsIDOMParser );
    var securityManager =
      Components.classes["@mozilla.org/scriptsecuritymanager;1"]
                .getService( Components.interfaces.nsIScriptSecurityManager );
    // TODO: nsIDOMParser.init()
    // anURI cause message in error console
    // principal ?!
    principal = securityManager.getCodebasePrincipal( anURI );
    domParser.init( principal, null /* anURI */, aBaseURI, null );
    tmp = domParser.parseFromString( aData, pub.getType() );
    if ( tmp.documentElement &&
         tmp.documentElement.localName.toLowerCase() === "parsererror" &&
         tmp.documentElement.namespaceURI === getErrorNS() ) {
      dom = getErrorDocument( anURI, aBaseURI, aTitle,
        decodeURIComponent( tmp.documentElement.firstChild.textContent ),
        tmp.documentElement.firstElementChild.textContent
      );
      return { result: false, dom: dom, changed: false };
    }
    err = checkDocument( tmp, anURI, aBaseURI, aTitle );
    if ( err ) {
      return { result: false, dom: err, changed: false };
    }
    markup = markupDocument( tmp );
    sanitizeDocument( tmp, anURI, aBaseURI );
    fixupDocument( tmp, anURI, aBaseURI, aTitle, markup );
    return {
      result: true,
      dom: tmp,
      changed: ( aData !== pub.serializeToString( tmp, anURI, aBaseURI ) )
    };
  };
  
  pub.importDocument = function( aDOM, anURI, aBaseURI, aTitle, aParams ) {
    var metas, element, next, name, value, namespaceURI;
    var dom = pub.getBlankDocument( anURI, aBaseURI, aTitle, false, aParams );
    var node = aDOM.firstChild, namespaceURI = dom.documentElement.namespaceURI;
    var domHead, domBody, aDOMHead, aDOMBody;
    // before documentElement
    while ( node && node != aDOM.documentElement ) {
      // skip doctype
      if ( node.nodeType !== Node.DOCUMENT_TYPE_NODE ) {
        dom.insertBefore( dom.importNode( node, true ), dom.documentElement );
      }
      node = node.nextSibling;
    }
    // skip documentElement
    node = node.nextSibling;
    // after documentElement
    while ( node ) {
      dom.appendChild( dom.importNode( node, true ) );
      node = node.nextSibling;
    }
    // documentElement itself
    element = aDOM.documentElement;
    for ( var i = element.attributes.length - 1; i >= 0; i-- ) {
      name = element.attributes[i].name;
      value = element.attributes[i].value;
      // skip default namespace
      if ( name !== "xmlns" ) {
        dom.documentElement.setAttribute( name, value );
      }
    }
    // documentElement content
    domHead = dom.getElementsByTagNameNS( namespaceURI, "head" )[0];
    domBody = dom.getElementsByTagNameNS( namespaceURI, "body" )[0];
    aDOMHead = aDOM.getElementsByTagNameNS( namespaceURI, "head" )[0];
    aDOMBody = aDOM.getElementsByTagNameNS( namespaceURI, "body" )[0];
    element = domHead;
    node = aDOM.documentElement.firstChild;
    while ( node ) {
      next = node.nextSibling;
      if ( node == aDOMHead ) {
        dom.documentElement.replaceChild(
          dom.importNode( node, true ), domHead );
        element = domBody;
      } else if ( node == aDOMBody ) {
        dom.documentElement.replaceChild(
          dom.importNode( node, true ), domBody );
        element = null;
      } else {
        dom.documentElement.insertBefore(
          dom.importNode( node, true ), element );
      }
      node = next;
    };
    metas = dom.getElementsByTagNameNS( namespaceURI, "meta" );
    node = getMeta( metas, "http-equiv", "Content-Type", true );
    if ( node ) {
      node.parentNode.removeChild( node );
    }
    return dom;
  };
  
  return pub;

}();
