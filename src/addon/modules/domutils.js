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

Components.utils.import( "resource://znotes/utils.js",
  ru.akman.znotes
);

var EXPORTED_SYMBOLS = ["DOMUtils"];

var DOMUtils = function() {

  var Utils = ru.akman.znotes.Utils;

  var pub = {};

  pub.NODE = {
    ELEMENT_NODE: 1,
    ATTRIBUTE_NODE: 2,
    TEXT_NODE: 3,
    CDATA_SECTION_NODE: 4,
    ENTITY_REFERENCE_NODE: 5,
    ENTITY_NODE: 6,
    PROCESSING_INSTRUCTION_NODE: 7,
    COMMENT_NODE: 8,
    DOCUMENT_NODE: 9,
    DOCUMENT_TYPE_NODE: 10,
    DOCUMENT_FRAGMENT_NODE: 11,
    NOTATION_NODE: 12
  };
  
  // STYLE
  
  pub.getElementStyle = function( element ) {
    if ( !element || !element.style ) {
      return null;
    }
    var result = null;
    var elementStyle = element.style;
    var splitStyle = elementStyle.cssText.split( ";" );
    var index, declaration, name, value, priority;
    for ( var i = 0; i < splitStyle.length; i++ ) {
      declaration = splitStyle[i].trim();
      index = declaration.indexOf( ":" );
      if ( index != -1 ) {
        if ( !result ) {
          result = {};
        }
        name = declaration.substring( 0, index );
        result[ name ] = {
          value: elementStyle.getPropertyValue( name ),
          priority: elementStyle.getPropertyPriority( name )
        }
      }
    }
    return result;
  };
  
  pub.getElementTextDecoration = function( element ) {
    if ( !element || !element.style ) {
      return null;
    }
    var win = element.ownerDocument.defaultView;
    var textDecoration = [];
    var style, computedStyle;
    try {
      while ( element && element.nodeType == pub.NODE.ELEMENT_NODE ) {
        style = element.style;
        computedStyle = win.getComputedStyle( element, null );
        if ( style.textDecoration ) {
          textDecoration = textDecoration.concat(
            style.textDecoration.split( /\s+/ )
          );
        }
        textDecoration = textDecoration.concat(
          computedStyle.textDecoration.split( /\s+/ )
        );
        element = element.parentNode;
      }
    } catch ( e ) {
      Utils.log( e );
    }
    return textDecoration;
  };
  
  pub.getElementColor = function( element ) {
    if ( !element || !element.style ) {
      return null;
    }
    var win = element.ownerDocument.defaultView;
    var color, style, computedStyle;
    try {
      style = element.style;
      computedStyle = win.getComputedStyle( element, null );
      if ( style.color ) {
        color = style.color;
      } else {
        color = computedStyle.color; 
      }
    } catch ( e ) {
      Utils.log( e );
    }
    return color;
  };
  
  pub.getElementBackgroundColor = function( element ) {
    if ( !element || !element.style ) {
      return null;
    }
    var win = element.ownerDocument.defaultView;
    var style, computedStyle, color;
    try {
      while ( element && element.nodeType == pub.NODE.ELEMENT_NODE ) {
        style = element.style;
        computedStyle = win.getComputedStyle( element, null );
        if ( style.backgroundColor ) {
          color = style.backgroundColor;
        } else {
          color = computedStyle.backgroundColor;
        }
        if ( color != "transparent" ) {
          return color;
        }
        element = element.parentNode;
      }
    } catch ( e ) {
      Utils.log( e );
    }
    return color;
  };  
  
  // SELECTION
  
  pub.cloneSelection = function( win ) {
    var selection = win.getSelection();
    if ( !selection || selection.rangeCount == 0 ) {
      return null;
    }
    var doc = win.document;
    var fragment = doc.createDocumentFragment();
    for ( var i = 0; i < selection.rangeCount; i++ ) {
      pub.cloneRange( fragment, selection.getRangeAt( i ) )
    }
    return fragment;
  };
  
  pub.cloneRange = function( target, range ) {
    var state = {
      processFlag: false,
      breakFlag: false,
      rootFlag: true
    };
    pub.cloneNode(
      target,
      range.commonAncestorContainer,
      range.startContainer,
      range.startOffset,
      range.endContainer,
      range.endOffset,
      state
    );
  };
  
  pub.cloneStyle = function( from, to ) {
    var fromStyle = from.style;
    var toStyle = to.style;
    var name, value, priority;
    for ( var i = 0; i < fromStyle.length; i++ ) {
      name = fromStyle[i];
      value = fromStyle.getPropertyValue( name );
      priority = fromStyle.getPropertyPriority( name );
      toStyle.setProperty( name, value, priority );
    }
  };

  pub.cloneComputedStyle = function( from, to ) {
    var win = from.ownerDocument.defaultView;
    var fromStyle = win.getComputedStyle( from, null );
    var toStyle = to.style;
    var name, value, priority;
    for ( var i = 0; i < fromStyle.length; i++ ) {
      name = fromStyle[i];
      value = fromStyle.getPropertyValue( name );
      priority = fromStyle.getPropertyPriority( name );
      toStyle.setProperty( name, value, priority );
    }
  };
  
  pub.cloneLinks = function( from, to ) {
    if ( from.hasAttribute( "src" ) ) {
      to.setAttribute(
        "src",
        from.baseURIObject.resolve( from.getAttribute( "src" ) )
      );
    }
    if ( from.hasAttribute( "href" ) ) {
      to.setAttribute(
        "href",
        from.baseURIObject.resolve( from.getAttribute( "href" ) )
      );
    }
  };
  
  pub.cloneNode = function( target, root, startContainer, startOffset, endContainer, endOffset, state ) {
    var doc = root.ownerDocument;
    var textNode;
    var targetNode;
    var span;
    var isBody = (
      root &&
      root.nodeType == 1 &&
      root.nodeName.toLowerCase() == "body"
    );
    switch ( root.nodeType ) {
      case pub.NODE.TEXT_NODE:
        if ( root == startContainer && root == endContainer ) {
          textNode = root.cloneNode( false );
          textNode.nodeValue =
            textNode.nodeValue.substring( startOffset, endOffset );
          span = doc.createElement( "span" );
          pub.cloneComputedStyle( root.parentNode, span );
          span.appendChild( textNode );
          target.appendChild( span );
          state.breakFlag = true;
          return;
        }
        if ( root == startContainer && root != endContainer ) {
          textNode = root.cloneNode( false );
          textNode.nodeValue = textNode.nodeValue.substring( startOffset );
          target.appendChild( textNode );
          state.processFlag = true;
          return;
        }
        if ( root != startContainer && root == endContainer ) {
          textNode = root.cloneNode( false );
          textNode.nodeValue = textNode.nodeValue.substring( 0, endOffset );
          target.appendChild( textNode );
          state.processFlag = false;
          state.breakFlag = true;
          return;
        }
        if ( state.processFlag ) {
          textNode = root.cloneNode( false );
          target.appendChild( textNode );
          return;
        }
        break;
      case pub.NODE.ELEMENT_NODE:
        if ( isBody ) {
          targetNode = doc.createElement( "div" );
        } else {
          targetNode = root.cloneNode( false );
          if ( targetNode.hasAttribute( "id" ) ) {
            targetNode.removeAttribute( "id" );
          }
        }
        if ( state.rootFlag ) {
          state.rootFlag = false;
          if ( isBody ) {
            pub.cloneStyle( root, targetNode );
            targetNode.style.removeProperty( "background-color" ); 
            if ( targetNode.style.length == 0 ) {
              targetNode.removeAttribute( "style" );
            }
          } else {
            pub.cloneComputedStyle( root, targetNode );
          }
        }
        pub.cloneLinks( root, targetNode );
        target.appendChild( targetNode );
        if ( root == startContainer ) {
          state.processFlag = true;
        }
        var node = root.firstChild;
        while ( node ) {
          var nextSibling = node.nextSibling;
          pub.cloneNode(
            targetNode,
            node,
            startContainer,
            startOffset,
            endContainer,
            endOffset,
            state
          );
          if ( state.breakFlag ) {
            return;
          }
          node = nextSibling;
        }
        if ( root == endContainer ) {
          state.processFlag = false;
          state.breakFlag = true;
        }
        break;
    }
  };
  
  pub.processSelection = function( selection, processor ) {
    if ( !selection || selection.rangeCount == 0 || !processor ) {
      return false;
    }
    var offsets = [];
    var endContainer = null;
    var endOffset;
    for ( var i = 0; i < selection.rangeCount; i++ ) {
      var r = selection.getRangeAt( i );
      if ( r.startContainer != endContainer &&
           r.endContainer != endContainer ) {
        offsets.push( null );
      } else {
        offsets.push( {
          startOffset: r.startContainer == endContainer ?
            r.startOffset - endOffset : -1,
          endOffset: r.endContainer == endContainer ?
            r.endOffset - endOffset : -1
        } );
      }
      endContainer = r.endContainer;
      endOffset = r.endOffset;
    }
    var ranges = [];
    var result = {
      tailNode: null
    };
    for ( var i = 0; i < selection.rangeCount; i++ ) {
      if ( result.tailNode ) {
        for ( var j = i; j < selection.rangeCount; j++ ) {
          var r = selection.getRangeAt( j );
          if ( offsets[j] ) {
            if ( offsets[j].startOffset != -1 ) {
              r.setStart( result.tailNode, offsets[j].startOffset );
            }
            if ( offsets[j].endOffset != -1 ) {
              r.setEnd( result.tailNode, offsets[j].endOffset );
            }
          }
        }
      }
      result.tailNode = null;
      ranges.push(
        pub.processRange( selection.getRangeAt( i ), processor, result )
      );
    }
    if ( ranges.length > 0 ) {
      selection.removeAllRanges();
      for ( var i = 0; i < ranges.length; i++ ) {
        selection.addRange( ranges[i] );
      }
      return true;
    }
    return false;
  };
  
  pub.processRange = function( range, processor, result ) {
    var state = {
      processFlag: false,
      breakFlag: false,
      singleFlag: false,
      tailNode: null
    };
    var root = range.commonAncestorContainer;
    var rng = root.ownerDocument.createRange();
    pub.processNode(
      root,
      range.startContainer,
      range.startOffset,
      range.endContainer,
      range.endOffset,
      state,
      processor,
      rng,
      root.childNodes.length < 2
    );
    result.tailNode = state.tailNode;
    return rng;
  };
  
  pub.processNode = function( root, startContainer, startOffset, endContainer, endOffset, state, processor, range, singleFlag ) {
    var doc = root.ownerDocument;
    switch ( root.nodeType ) {
      case pub.NODE.TEXT_NODE:
        var parentNode = root.parentNode;
        var rootValue = root.nodeValue;
        var rootLength = rootValue.length;
        var spanElement;
        var textNode;
        if ( root == startContainer && root == endContainer ) {
          if ( singleFlag && startOffset == 0 &&
               endOffset == rootLength ) {
            processor( parentNode );
            range.setStart( startContainer, startOffset );
            range.setEnd( endContainer, endOffset );
          } else {
            if ( startOffset > 0 ) {
              parentNode.insertBefore(
                doc.createTextNode(
                  rootValue.substring( 0, startOffset )
                ),
                root
              );
            }
            spanElement =
              doc.createElement( "span" );
            textNode = doc.createTextNode(
              rootValue.substring( startOffset, endOffset )
            );
            spanElement.appendChild( textNode );
            processor( spanElement );
            parentNode.insertBefore( spanElement, root );
            if ( endOffset < rootLength ) {
              state.tailNode = parentNode.insertBefore(
                doc.createTextNode(
                  rootValue.substring( endOffset )
                ),
                root
              );
            }
            parentNode.removeChild( root );
            range.setStart( textNode, 0 );
            range.setEnd( textNode, endOffset - startOffset );
          }
          state.breakFlag = true;
          return;
        }
        if ( root == startContainer && root != endContainer ) {
          if ( startOffset == 0 ) {
            processor( parentNode );
            range.setStart( startContainer, startOffset );
          } else {
            parentNode.insertBefore(
              doc.createTextNode(
                rootValue.substring( 0, startOffset )
              ),
              root
            );
            spanElement =
              doc.createElement( "span" );
            textNode = doc.createTextNode(
              rootValue.substring( startOffset )
            );
            spanElement.appendChild( textNode );
            parentNode.insertBefore( spanElement, root );
            parentNode.removeChild( root );
            processor( spanElement );
            range.setStart( textNode, 0 );
          }
          state.processFlag = true;
          return;
        }
        if ( root != startContainer && root == endContainer ) {
          if ( endOffset == rootLength ) {
            processor( parentNode );
            range.setEnd( endContainer, endOffset );
          } else {
            spanElement =
              doc.createElement( "span" );
            textNode = doc.createTextNode(
              rootValue.substring( 0, endOffset )
            );
            spanElement.appendChild( textNode );
            parentNode.insertBefore( spanElement, root );
            state.tailNode = parentNode.insertBefore(
              doc.createTextNode(
                rootValue.substring( endOffset )
              ),
              root
            );
            parentNode.removeChild( root );
            processor( spanElement );
            range.setEnd( textNode, endOffset );
          }
          state.processFlag = false;
          state.breakFlag = true;
          return;
        }
        if ( state.processFlag ) {
          if ( singleFlag ) {
            processor( parentNode );
          } else {
            spanElement =
              doc.createElement( "span" );
            textNode = doc.createTextNode(
              rootValue
            );
            spanElement.appendChild( textNode );
            parentNode.insertBefore( spanElement, root );
            parentNode.removeChild( root );
            processor( spanElement );
          }
          return;
        }
        break;
      case pub.NODE.ELEMENT_NODE:
        if ( root == startContainer ) {
          state.processFlag = true;
        }
        var node = root.firstChild;
        var flag = ( root.childNodes.length < 2 );
        while ( node ) {
          var nextSibling = node.nextSibling;
          pub.processNode(
            node,
            startContainer,
            startOffset,
            endContainer,
            endOffset,
            state,
            processor,
            range,
            flag
          );
          if ( state.breakFlag ) {
            return;
          }
          node = nextSibling;
        }
        if ( root == endContainer ) {
          state.processFlag = false;
          state.breakFlag = true;
        }
        break;
    }
  };
  
  return pub;

}();
