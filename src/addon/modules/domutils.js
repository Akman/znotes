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
  
  // NODE
  
  pub.getNodeIndexInParent = function( aNode ) {
    var result = 0;
    var node = aNode.previousSibling;
    while ( node ) {
      node = node.previousSibling;
      result++;
    }
    return result;
  };
  
  pub.isElementDescendantOf = function( element, name ) {
    var nodeName, result = false;
    while ( element ) {
      nodeName = element.nodeName.toLowerCase();
      if ( nodeName == name.toLowerCase() ) {
        result = true;
        break;
      }
      element = element.parentElement;
    }
    return result;
  };
  
  pub.isRightSibling = function( baseNode, testedNode ) {
    var node = baseNode.nextSibling;
    while ( node ) {
      if ( node == testedNode ) {
        return true;
      }
      node = node.nextSibling;
    }
    return false;
  };
  
  pub.getNextTerminalNode = function( node ) {
    var body = node.ownerDocument.body;
    var result = node;
    while ( result && result != body && !result.nextSibling ) {
      result = result.parentNode;
    }
    result = ( result == body ) ? null : result.nextSibling;
    while ( result && result.firstChild ) {
      result = result.firstChild;
    }
    return result;
  };
  
  pub.getPrevTerminalNode = function( node ) {
    var body = node.ownerDocument.body;
    var result = node;
    while ( result && result != body && !result.previousSibling ) {
      result = result.parentNode;
    }
    result = ( result == body ) ? null : result.previousSibling;
    while ( result && result.lastChild ) {
      result = result.lastChild;
    }
    return result;
  };
  
  pub.normalizeRangeStart = function( range ) {
    var startContainer = range.startContainer;
    var startOffset = range.startOffset;
    var nextTerm = null;
    if ( startContainer.nodeType == pub.NODE.TEXT_NODE &&
         startOffset == startContainer.length ) {
      nextTerm = pub.getNextTerminalNode( startContainer );
    } else if ( startContainer.nodeType == pub.NODE.ELEMENT_NODE ) {
      if ( startOffset == startContainer.childNodes.length ) {
        nextTerm = pub.getNextTerminalNode( startContainer );
      } else if ( startContainer.childNodes.item( startOffset ).hasChildNodes() ) {
        nextTerm = startContainer.childNodes.item( startOffset ).firstChild;
        while ( nextTerm.firstChild ) {
          nextTerm = nextTerm.firstChild;
        }
      }
    } 
    if ( nextTerm ) {
      switch ( nextTerm.nodeType ) {
        case pub.NODE.TEXT_NODE:
          range.setStart( nextTerm, 0 );
          break;
        case pub.NODE.ELEMENT_NODE:
          range.setStart(
            nextTerm.parentNode,
            pub.getNodeIndexInParent( nextTerm )
          );
          break;
      }
    }
  };
  
  pub.normalizeRangeEnd = function( range ) {
    var endContainer = range.endContainer;
    var endOffset = range.endOffset;
    var prevTerm = null;
    if ( endContainer.nodeType == pub.NODE.TEXT_NODE &&
         endOffset == 0 ) {
      prevTerm = pub.getPrevTerminalNode( endContainer );
    } else if ( endContainer.nodeType == pub.NODE.ELEMENT_NODE ) {
      if ( endOffset == 0 ) {
        prevTerm = pub.getPrevTerminalNode( endContainer );
      } else if ( endContainer.childNodes.item( endOffset - 1 ).hasChildNodes() ) {
        prevTerm = endContainer.childNodes.item( endOffset - 1 ).lastChild;
        while ( prevTerm.lastChild ) {
          prevTerm = prevTerm.lastChild;
        }
      }
    } 
    if ( prevTerm ) {
      switch ( prevTerm.nodeType ) {
        case pub.NODE.TEXT_NODE:
          range.setEnd( prevTerm, prevTerm.length );
          break;
        case pub.NODE.ELEMENT_NODE:
          range.setEnd(
            prevTerm.parentNode,
            pub.getNodeIndexInParent( prevTerm ) + 1
          );
          break;
      }
    }
  };
  
  pub.convolveSelection = function( selection ) {
    if ( !selection || !selection.rangeCount || selection.isCollapsed ) {
      return;
    }
    var prevRange, nextRange, adjacentFlag, removedRanges = [];
    for ( var i = 0; i < selection.rangeCount; i++ ) {
      nextRange = selection.getRangeAt( i );
      pub.normalizeRangeStart( nextRange );
      pub.normalizeRangeEnd( nextRange );
      if ( prevRange ) {
        adjacentFlag = (
          prevRange.endContainer == nextRange.startContainer &&
          prevRange.endOffset == nextRange.startOffset
        ) || (
          (
            (
              prevRange.endContainer.nodeType == pub.NODE.TEXT_NODE &&
              prevRange.endOffset == prevRange.endContainer.length
            ) || (
              prevRange.endContainer.nodeType == pub.NODE.ELEMENT_NODE
            )
          ) && (
            (
              nextRange.startContainer.nodeType == pub.NODE.TEXT_NODE &&
              nextRange.startOffset == 0
            ) || (
              nextRange.startContainer.nodeType == pub.NODE.ELEMENT_NODE
            )
          ) && (
            pub.getNextTerminalNode( prevRange.endContainer ) ==
              nextRange.startContainer
          )
        );
        if ( adjacentFlag ) {
          nextRange.setStart( prevRange.startContainer, prevRange.startOffset );
          removedRanges.push( prevRange );
        }
      }
      prevRange = nextRange;
    }
    for ( var i = 0; i < removedRanges.length; i++ ) {
      selection.removeRange( removedRanges[i] );
    }
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
  
  return pub;

}();
