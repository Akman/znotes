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
if ( !ru.akman.znotes.core ) ru.akman.znotes.core = {};

Components.utils.import( "resource://znotes/utils.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/event.js",
  ru.akman.znotes.core
);
Components.utils.import( "resource://znotes/documentmanager.js",
  ru.akman.znotes
);

var EXPORTED_SYMBOLS = ["Editor"];

var Editor = function() {

  return function() {

    // !!!! %%%% !!!! STRINGS_BUNDLE
    var Utils = ru.akman.znotes.Utils;
    var stringsBundle = Utils.STRINGS_BUNDLE;
    var editorStringsBundle = null;
    
    var EditorException = function( message ) {
      this.name = "EditorException";
      this.message = message;
      this.toString = function() {
        return this.name + ": " + this.message;
      }
    };
    
    var listeners = [];
    
    var currentWindow = null;
    var currentDocument = null;
    var currentNote = null;
    var currentMode = null;
    var currentStyle = null;

    var currentState = null; // isDirty
    
    var currentNoteMainTagColor = null;
    var tagList = null;
    var noteStateListener = null;
    var tagListStateListener = null;
    var documentStateListener = null;
    
    var isParseError = false;
    var isSourceMustBeUpdated = false;
    var isDesignMustBeUpdated = false;
    var isSourceEditingActive = false;
    var isDesignEditingActive = false;
    
    var editorTabs = null;
    var editorTabDesign = null;
    var editorTabSource = null;
    var editorTabClose = null;
    
    var designFrame = null;
    var designEditor = null;
    var designHTMLEditor = null;
    
    var designToolBox = null;
    var editorToolBar1 = null;
    var editorToolBar2 = null;
    
    var editMenuPopup = null;
    
    var sourceFrame = null;
    var sourceWindow = null;
    var sourceEditor = null;
    var sourceEditorLibrary = null;
    var sourceEditorHeight = null;
    var sourceEditorHScrollbarHeight = null;
    var sourcePrintFrame = null;
    var sourceToolBox = null;
    var sourceToolBar = null;
    
    var fontNameMenuPopup = null;
    var fontNameMenuList = null;
    var fontSizeTextBox = null;
    var formatBlockMenuPopup = null;
    var formatBlockMenuList = null;
    var foreColorEditorButton = null;
    var foreColorDeleteEditorButton = null;
    var backColorEditorButton = null;
    var backColorDeleteEditorButton = null;
    
    var boldEditorButton = null;
    var italicEditorButton = null;
    var underlineEditorButton = null;
    var strikeThroughEditorButton = null;
    
    var justifyCenterEditorButton = null;
    var justifyLeftEditorButton = null;
    var justifyRightEditorButton = null;
    var justifyFullEditorButton = null;
    
    var srcBeautify = null;
    
    var fontArray = [];
    var fontMapping = Utils.getDefaultFontMapping();
    
    var formatBlockObject = {};

    // CONTROLLERS
    
    var designViewerController = {
      supportsCommand: function ( cmd ) {
        return false;
      },
      isCommandEnabled: function ( cmd ) {
        return false;
      },
      doCommand: function ( cmd ) {
      },
      onEvent: function ( event ) {
      }
    };
    
    var designEditorController = {
      supportsCommand: function ( cmd ) {
        return false;
      },
      isCommandEnabled: function ( cmd ) {
        return false;
      },
      doCommand: function ( cmd ) {
      },
      onEvent: function ( event ) {
      }
    };
    
    var sourceEditorController = {
      supportsCommand: function ( cmd ) {
        return false;
      },
      isCommandEnabled: function ( cmd ) {
        return false;
      },
      doCommand: function ( cmd ) {
      },
      onEvent: function ( event ) {
      }
    };
    
    // HELPERS
    
    function createFontNameMenuList() {
      var fontNameArray = Utils.getFontNameArray();
      if ( fontArray.length > 0 ) {
        fontArray.splice( 0, fontArray.length );
      }
      while ( fontNameMenuPopup.firstChild )
        fontNameMenuPopup.removeChild( fontNameMenuPopup.firstChild );
      for ( var i = 0; i < fontNameArray.length; i++ ) {
        var fontName = fontNameArray[i];
        var menuItem = currentDocument.createElement( "menuitem" );
        menuItem.setAttribute( "label", fontName );
        menuItem.setAttribute( "value", fontName );
        var style = "font-style: normal;font-variant: normal;" +
                    "font-weight: normal;font-family: '"+fontName+"';";
        menuItem.setAttribute( "style", style );
        menuItem.addEventListener( "command", onEdtFontName, false );
        fontNameMenuPopup.appendChild( menuItem );
        fontArray.push( fontName.toLowerCase() );
      }
    };
    
    function createFormatBlockMenuList() {
      while ( formatBlockMenuPopup.firstChild )
        formatBlockMenuPopup.removeChild( formatBlockMenuPopup.firstChild );
      for ( var name in formatBlockObject ) {
        var value = formatBlockObject[name];
        var menuItem = currentDocument.createElement( "menuitem" );
        menuItem.setAttribute( "label", name );
        menuItem.setAttribute( "value", value );
        menuItem.setAttribute( "description", value );
        menuItem.addEventListener( "command", onEdtFormatBlock, false );
        formatBlockMenuPopup.appendChild( menuItem );
      }
    };
    
    function setColorButtonsImages() {
      var iconSize = ( currentStyle.iconsize == "small" ) ? 16 : 24;
      foreColorEditorButton.setAttribute(
        "image",
        Utils.makeForeColorImage(
          "#000000", iconSize, "#000000" )
      );
      backColorEditorButton.setAttribute(
        "image",
        Utils.makeBackColorImage( "#000000", iconSize )
      );
    };
    
    function setBackgroundColor( aNote, aColor ) {
      if ( currentNote != aNote ) {
        return;
      }
      designFrame.contentDocument.body.setAttribute(
        "style",
        "background-color: " + aColor + ";"
      );
    };
    
    function getElementColor( element ) {
      var color = null;
      try {
      var style = element.style;
      color = style.getPropertyValue( "color" );
      if ( !color ) {
        style = currentWindow.getComputedStyle( element, null );
        color = style.getPropertyValue( "color" ); 
      }
      } catch ( e ) {
        Utils.log( e );
      }
      return color;
    };
    
    function getElementBackgroundColor( element ) {
      var color = null;
      var display;
      var flag;
      var el;
      try {
      var style = element.style;
      color = style.getPropertyValue( "background-color" );
      if ( !color ) {
        el = element;
        while ( el ) {
          style = currentWindow.getComputedStyle( el, null );
          color = style.getPropertyValue( "background-color" );
          display = style.getPropertyValue( "display" );
          if ( display == "block" ) {
            flag = true;
          }
          if ( color != "transparent" &&
               ( !flag || ( flag && display == "block" ) ) ) {
            break;
          }
          el = el.parentNode;
        }
      }
      } catch ( e ) {
        Utils.log( e );
      }
      return color;
    };
    
    function getSelectionStartElement() {
      var selection = designFrame.contentWindow.getSelection();
      if ( !selection || selection.rangeCount == 0 ) {
        return null;
      }
      var startContainer = selection.getRangeAt( 0 ).startContainer;
      if ( startContainer.nodeType == 3 ) {
        startContainer = startContainer.parentNode;
      }
      return startContainer;
    };

    function hasSelection() {
      var selection = designFrame.contentWindow.getSelection();
      return ( selection && !selection.isCollapsed &&
               selection.rangeCount != 0 );
    };
    
    function cloneSelection() {
      var selection = designFrame.contentWindow.getSelection();
      if ( !selection || selection.rangeCount == 0 ) {
        return null;
      }
      var doc = designFrame.contentDocument;
      var fragment = doc.createDocumentFragment();
      for ( var i = 0; i < selection.rangeCount; i++ ) {
        cloneRange( fragment, selection.getRangeAt( i ) )
      }
      return fragment;
    };
    
    function cloneRange( target, range ) {
      var state = {
        processFlag: false,
        breakFlag: false,
        rootFlag: true
      };
      cloneNode(
        target,
        range.commonAncestorContainer,
        range.startContainer,
        range.startOffset,
        range.endContainer,
        range.endOffset,
        state
      );
    };
    
    function cloneStyle( from, to ) {
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

    function cloneComputedStyle( from, to ) {
      var fromStyle = currentWindow.getComputedStyle( from, null );
      var toStyle = to.style;
      var name, value, priority;
      for ( var i = 0; i < fromStyle.length; i++ ) {
        name = fromStyle[i];
        value = fromStyle.getPropertyValue( name );
        priority = fromStyle.getPropertyPriority( name );
        toStyle.setProperty( name, value, priority );
      }
    };
    
    function cloneLinks( from, to ) {
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
    
    function cloneNode( target, root, startContainer, startOffset,
      endContainer, endOffset, state ) {
      var textNode;
      var targetNode;
      var span;
      var isBody = (
        root &&
        root.nodeType == 1 &&
        root.nodeName.toLowerCase() == "body"
      );
      switch ( root.nodeType ) {
        case 3: // TEXT_NODE
          if ( root == startContainer && root == endContainer ) {
            textNode = root.cloneNode( false );
            textNode.nodeValue =
              textNode.nodeValue.substring( startOffset, endOffset );
            span = designFrame.contentDocument.createElement( "span" );
            cloneComputedStyle( root.parentNode, span );
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
        case 1: // ELEMENT_NODE
          if ( isBody ) {
            targetNode = designFrame.contentDocument.createElement( "div" );
          } else {
            targetNode = root.cloneNode( false );
            if ( targetNode.hasAttribute( "id" ) ) {
              targetNode.removeAttribute( "id" );
            }
          }
          if ( state.rootFlag ) {
            state.rootFlag = false;
            if ( isBody ) {
              cloneStyle( root, targetNode );
              targetNode.style.removeProperty( "background-color" ); 
              if ( targetNode.style.length == 0 ) {
                targetNode.removeAttribute( "style" );
              }
            } else {
              cloneComputedStyle( root, targetNode );
            }
          }
          cloneLinks( root, targetNode );
          target.appendChild( targetNode );
          if ( root == startContainer ) {
            state.processFlag = true;
          }
          var node = root.firstChild;
          while ( node ) {
            var nextSibling = node.nextSibling;
            cloneNode(
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
    
    function processSelection( processor ) {
      var selection = designFrame.contentWindow.getSelection();
      if ( !selection || selection.rangeCount == 0 ) {
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
          processRange( selection.getRangeAt( i ), processor, result )
        );
      }
      if ( ranges.length > 0 ) {
        onDocumentStateChanged( true );
        selection.removeAllRanges();
        for ( var i = 0; i < ranges.length; i++ ) {
          selection.addRange( ranges[i] );
        }
      }
      return true;
    };
    
    function processRange( range, processor, result ) {
      var state = {
        processFlag: false,
        breakFlag: false,
        singleFlag: false,
        tailNode: null
      };
      var rng = currentDocument.createRange();
      var root = range.commonAncestorContainer;
      processNode(
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
    
    function processNode( root, startContainer, startOffset, endContainer,
      endOffset, state, processor, range, singleFlag ) {
      switch ( root.nodeType ) {
        case 3: // TEXT_NODE
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
                  designFrame.contentDocument.createTextNode(
                    rootValue.substring( 0, startOffset )
                  ),
                  root
                );
              }
              spanElement =
                designFrame.contentDocument.createElement( "span" );
              textNode = designFrame.contentDocument.createTextNode(
                rootValue.substring( startOffset, endOffset )
              );
              spanElement.appendChild( textNode );
              processor( spanElement );
              parentNode.insertBefore( spanElement, root );
              if ( endOffset < rootLength ) {
                state.tailNode = parentNode.insertBefore(
                  designFrame.contentDocument.createTextNode(
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
                designFrame.contentDocument.createTextNode(
                  rootValue.substring( 0, startOffset )
                ),
                root
              );
              spanElement =
                designFrame.contentDocument.createElement( "span" );
              textNode = designFrame.contentDocument.createTextNode(
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
                designFrame.contentDocument.createElement( "span" );
              textNode = designFrame.contentDocument.createTextNode(
                rootValue.substring( 0, endOffset )
              );
              spanElement.appendChild( textNode );
              parentNode.insertBefore( spanElement, root );
              state.tailNode = parentNode.insertBefore(
                designFrame.contentDocument.createTextNode(
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
                designFrame.contentDocument.createElement( "span" );
              textNode = designFrame.contentDocument.createTextNode(
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
        case 1: // ELEMENT_NODE
          if ( root == startContainer ) {
            state.processFlag = true;
          }
          var node = root.firstChild;
          var flag = ( root.childNodes.length < 2 );
          while ( node ) {
            var nextSibling = node.nextSibling;
            processNode(
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

    /*
    function onEdtTest( event ) {
      Utils.log( "onEdtTest()" );
      var selection = designFrame.contentWindow.getSelection();
      var r = selection.getRangeAt( 0 );
      Utils.log( r.commonAncestorContainer );
      Utils.log( r.startContainer );
      Utils.log( r.startOffset );
      Utils.log( r.endContainer );
      Utils.log( r.endOffset );
      // -> designEditor.beginTransaction()
      // -> designEditor.endTransaction()
      // parent.insertBefore( node, root ) -> 
      // parent.appendChild( root ) -> 
      // parent.removeChild( root ) -> designEditor.deleteNode( root )
      // document.createTextNode -> 
      // document.createElement( tagName ) -> designHTMLEditor.createElementWithDefaults( tagName )
      // element.style.setProperty( name, value ) -> 
      // element.style.removeProperty( name ) -> 
      // -----------------------------------------------------------------------
      // void designEditor.setAttribute(in nsIDOMElement aElement, in AString attributestr,in AString attvalue);
      // boolean designEditor.getAttributeValue(in nsIDOMElement aElement, in AString attributestr, out AString resultValue);
      // void designEditor.removeAttribute(in nsIDOMElement aElement, in AString aAttribute);
      // void designEditor.cloneAttribute(in AString aAttribute, in nsIDOMNode aSourceNode);
      // void designEditor.cloneAttributes(in nsIDOMNode destNode, in nsIDOMNode sourceNode);
      // nsIDOMNode designEditor.createNode(in AString tag, in nsIDOMNode parent, in long position);
      // void designEditor.insertNode(in nsIDOMNode node, in nsIDOMNode parent, in long aPosition);
      // void designEditor.splitNode(in nsIDOMNode existingRightNode, in long offset, out nsIDOMNode newLeftNode);
      // void designEditor.joinNodes(in nsIDOMNode leftNode, in nsIDOMNode rightNode, in nsIDOMNode parent);
      // void designEditor.deleteNode(in nsIDOMNode child);
      // void designEditor.markNodeDirty(in nsIDOMNode node);      
      try {
      } catch ( e ) {
        Utils.log( e );
      }
      onSelectionChanged();
      return true;
    };
    */
    
    function updateColorButtons( containerElement ) {
      var iconSize = ( currentStyle.iconsize == "small" ) ? 16 : 24;
      var foregroundColor = getElementColor( containerElement );
      var backgroundColor = getElementBackgroundColor( containerElement );
      backColorEditorButton.setAttribute(
        "image",
        Utils.makeBackColorImage( backgroundColor, iconSize )
      );
      foreColorEditorButton.setAttribute(
        "image",
        Utils.makeForeColorImage(
          foregroundColor, iconSize, backgroundColor )
      );
    };
    
    function updateControls( containerElement ) {
      var iconSize = ( currentStyle.iconsize == "small" ) ? 16 : 24;
      var computedStyle =
        currentWindow.getComputedStyle( containerElement, null );
      var fontFamily = null;
      var fontSize = null;
      var fontStyle = null;
      var fontWeight = null;
      var textDecoration = null;
      var textAlign = null;
      var element = null;
      var style = null;
      var index = -1;
      var found = false;
      // font-family
      fontFamily = computedStyle.getPropertyValue( "font-family" );
      if ( fontFamily ) {
        var fontList = fontFamily.split( "," );
        for ( var i = 0; i < fontList.length; i++ ) {
          fontFamily = fontList[i];
          if ( fontFamily.charAt( 0 ) == "'" ||
               fontFamily.charAt( 0 ) == '"' ) {
            fontFamily = fontFamily.substring( 1, fontFamily.length - 1 );
          }
          if ( fontFamily in fontMapping.generics ) {
            fontFamily = fontMapping.generics[ fontFamily ];
          }
          fontFamily = fontFamily.toLowerCase();
          index = fontArray.indexOf( fontFamily );
          if ( index != -1 ) {
            break;
          }
        }
      }
      fontNameMenuList.selectedIndex = index;
      // font-size
      fontSize = computedStyle.getPropertyValue( "font-size" );
      if ( fontSize == null ) {
        fontSizeTextBox.value = "";
      } else {
        fontSizeTextBox.value = parseInt(
          fontSize.substring( 0, fontSize.indexOf( "px" ) )
        );
      }
      // text-align
      // left || right || center || justify
      textAlign = computedStyle.getPropertyValue( "text-align" );
      if ( textAlign == null ) {
        justifyLeftEditorButton.checked = false;
        justifyCenterEditorButton.checked = false;
        justifyRightEditorButton.checked = false;
        justifyFullEditorButton.checked = false;
      } else {
        switch ( textAlign ) {
          case "left":
          case "start":
            justifyLeftEditorButton.checked = true;
            justifyCenterEditorButton.checked = false;
            justifyRightEditorButton.checked = false;
            justifyFullEditorButton.checked = false;
            break;
          case "right":
          case "end":
            justifyLeftEditorButton.checked = false;
            justifyCenterEditorButton.checked = false;
            justifyRightEditorButton.checked = true;
            justifyFullEditorButton.checked = false;
            break;
          case "center":
            justifyLeftEditorButton.checked = false;
            justifyCenterEditorButton.checked = true;
            justifyRightEditorButton.checked = false;
            justifyFullEditorButton.checked = false;
            break;
          case "justify":
            justifyLeftEditorButton.checked = false;
            justifyCenterEditorButton.checked = false;
            justifyRightEditorButton.checked = false;
            justifyFullEditorButton.checked = true;
            break;
        }
      }
      // font-style
      // italic || normal
      fontStyle = computedStyle.getPropertyValue( "font-style" );
      italicEditorButton.checked = ( fontStyle == "italic" );
      // font-weight
      // 700 || 400
      fontWeight = computedStyle.getPropertyValue( "font-weight" );
      boldEditorButton.checked = ( fontWeight == "700" );
      // text-decoration
      // underline + line-through || none
      element = containerElement;
      underlineEditorButton.checked = false;
      strikeThroughEditorButton.checked = false;
      while ( element ) {
        style = element.style;
        textDecoration = style ?
          style.getPropertyValue( "text-decoration" ) : null;
        if ( textDecoration ) {
          if ( textDecoration == "underline" ) {
            underlineEditorButton.checked = true;
          } else if ( textDecoration == "line-through" ) {
            strikeThroughEditorButton.checked = true;
          } else if ( textDecoration == "none" ) {
            break;
          }
        }
        element = element.parentNode;
      }
      updateColorButtons( containerElement );
      // format block
      element = containerElement;
      found = false;
      while ( element ) {
        var tagName = element.nodeName.toLowerCase();
        index = 0;
        for ( var blockName in formatBlockObject ) {
          if ( formatBlockObject[blockName] == tagName ) {
            found = true;
            break;
          }
          index++;
        }
        if ( found ) {
          break;
        }
        element = element.parentNode;
      }
      formatBlockMenuList.selectedIndex = ( found ? index : 0 );
    };
    
    // C O P Y  &  C U T  &  P A S T E  C O M M A N D S
    
    function onCmdCopy( event ) {
      var transferable = Components.Constructor(
        "@mozilla.org/widget/transferable;1",
        "nsITransferable"
      )();
      transferable.init(
        currentWindow.QueryInterface(
          Components.interfaces.nsIInterfaceRequestor
        ).getInterface( Components.interfaces.nsIWebNavigation )
      );
      if ( isSourceEditingActive ) {
        // text/unicode
        transferable.addDataFlavor( "text/unicode" );
        var textData = sourceEditor.getSelection();
        var textSupportsString = Components.Constructor(
          "@mozilla.org/supports-string;1",
          "nsISupportsString"
        )();
        textSupportsString.data = textData;
        transferable.setTransferData(
          "text/unicode", textSupportsString, textData.length * 2 );
      } else {
        var fragment = cloneSelection();
        // text/html
        transferable.addDataFlavor( "text/html" );
        var xmlSerializer =
          Components.classes["@mozilla.org/xmlextras/xmlserializer;1"]
                    .createInstance( Components.interfaces.nsIDOMSerializer );
        var xmlData = xmlSerializer.serializeToString( fragment );
        var xmlSupportsString = Components.Constructor(
          "@mozilla.org/supports-string;1",
          "nsISupportsString"
        )();
        xmlSupportsString.data = xmlData;
        transferable.setTransferData(
          "text/html", xmlSupportsString, xmlData.length * 2 );
        // text/unicode
        transferable.addDataFlavor( "text/unicode" );
        var textData = fragment.textContent;
        var textSupportsString = Components.Constructor(
          "@mozilla.org/supports-string;1",
          "nsISupportsString"
        )();
        textSupportsString.data = textData;
        transferable.setTransferData(
          "text/unicode", textSupportsString, textData.length * 2 );
      }
      var clipboard =
        Components.classes['@mozilla.org/widget/clipboard;1']
                  .createInstance( Components.interfaces.nsIClipboard );
      clipboard.setData( transferable, null, clipboard.kGlobalClipboard );
      return true;
    };
    
    function onCmdCut( event ) {
      onCmdCopy( event );
      if ( !isSourceEditingActive && !isDesignEditingActive ) {
        return false;
      }
      return onCmdDelete( event );
    };
    
    function onCmdPaste( event ) {
      if ( !isSourceEditingActive && !isDesignEditingActive ) {
        return false;
      }
      if ( isSourceEditingActive ) {
        var transferable = Components.Constructor(
          "@mozilla.org/widget/transferable;1",
          "nsITransferable"
        )();
        transferable.init(
          currentWindow.QueryInterface(
            Components.interfaces.nsIInterfaceRequestor
          ).getInterface( Components.interfaces.nsIWebNavigation )
        );
        transferable.addDataFlavor( "text/unicode" );
        var clipboard =
          Components.classes['@mozilla.org/widget/clipboard;1']
                    .createInstance( Components.interfaces.nsIClipboard );
        clipboard.getData( transferable, clipboard.kGlobalClipboard );
        var textData = {};
        var textDataLength = {};
        transferable.getTransferData(
          "text/unicode", textData, textDataLength );
        if ( textData ) {
          sourceEditor.replaceSelection(
            textData.value
                    .QueryInterface( Components.interfaces.nsISupportsString )
                    .data,
            "end"
          );
        }
      } else {
        designFrame.contentDocument.execCommand( 'paste', false, null );
      }
      onSelectionChanged();
      return true;
    };
    
    function onCmdDelete( event ) {
      if ( !isSourceEditingActive && !isDesignEditingActive ) {
        return false;
      }
      if ( isSourceEditingActive ) {
        sourceEditor.replaceSelection( "" );
      } else {
        designFrame.contentDocument.execCommand( 'delete', false, null );
      }
      onSelectionChanged();
      return true;
    };
    
    function onCmdSelectAll( event ) {
      if ( isSourceEditingActive ) {
        sourceEditor.execCommand( "selectAll" );
      } else {
        designFrame.contentWindow.getSelection().selectAllChildren(
          designFrame.contentDocument.body
        );
      }
      onSelectionChanged();
      return true;
    };
    
    // UNDO & REDO

    function onCmdUndo( event ) {
      if ( !isSourceEditingActive && !isDesignEditingActive ) {
        return false;
      }
      if ( isSourceEditingActive ) {
        sourceEditor.undo();
      } else {
        designFrame.contentDocument.execCommand( 'undo', false, null );
        designFrame.focus();
      }
      onSelectionChanged();
      if ( isSourceEditingActive ) {
        if ( sourceEditor.historySize().undo == 0 ) {
          onSourceDocumentStateChanged( false );
        }
      } else {
        var oEnabled = {}, oCan = {};
        designEditor.canUndo( oEnabled, oCan );
        if ( !oCan.value ) {
          onDocumentStateChanged( false );
        }
      }
      return true;
    };
    
    function onCmdRedo( event ) {
      if ( !isSourceEditingActive && !isDesignEditingActive ) {
        return false;
      }
      if ( isSourceEditingActive ) {
        sourceEditor.redo();
      } else {
        designFrame.contentDocument.execCommand( 'redo', false, null );
        designFrame.focus();
      }
      onSelectionChanged();
      if ( isSourceEditingActive ) {
        onSourceDocumentStateChanged( true );
      } else {
        onDocumentStateChanged( true );
      }
      return true;
    };

    // D E S I G N  C O M M A N D S
    
    function onEdtBold( source ) {
      // boldEditorButton.checked = !boldEditorButton.checked;
      Utils.log( "onEdtBold()" );
      designFrame.contentDocument.execCommand( 'bold', false, null );
      /*
      processSelection( function( element ) {
        if ( boldEditorButton.checked ) {
          element.style.setProperty( "font-weight", "bold" );
        } else {
          element.style.removeProperty( "font-weight" );
          if ( element.style.length == 0 ) {
            element.removeAttribute( "style" );
          }
        }
      } );
      */
      designFrame.focus();
      return true;
    };
    
    function onEdtItalic( source ) {
      //designFrame.contentDocument.execCommand(
      //  'italic', false, null );
      processSelection( function( element ) {
        if ( italicEditorButton.checked ) {
          element.style.setProperty( "font-style", "italic" );
        } else {
          element.style.removeProperty( "font-style" );
          if ( element.style.length == 0 ) {
            element.removeAttribute( "style" );
          }
        }
      } );
      designFrame.focus();
      return true;
    };
    
    function onEdtUnderline( source ) {
      //designFrame.contentDocument.execCommand(
      //  'underline', false, null );
      processSelection( function( element ) {
        if ( underlineEditorButton.checked ) {
          element.style.setProperty( "text-decoration", "underline" );
        } else {
          element.style.removeProperty( "text-decoration" );
          if ( element.style.length == 0 ) {
            element.removeAttribute( "style" );
          }
        }
      } );
      designFrame.focus();
      return true;
    };
    
    function onEdtStrikeThrough( source ) {
      //designFrame.contentDocument.execCommand(
      //  'strikeThrough', false, null );
      processSelection( function( element ) {
        if ( strikeThroughEditorButton.checked ) {
          element.style.setProperty( "text-decoration", "line-through" );
        } else {
          element.style.removeProperty( "text-decoration" );
          if ( element.style.length == 0 ) {
            element.removeAttribute( "style" );
          }
        }
      } );
      designFrame.focus();
      return true;
    };
    
    function onEdtJustifyCenter( source ) {
      //designFrame.contentDocument.execCommand(
      //  'justifyCenter', false, null );
      processSelection( function( element ) {
        if ( justifyCenterEditorButton.checked ) {
          element.style.setProperty( "text-align", "center" );
        } else {
          element.style.removeProperty( "text-align" );
          if ( element.style.length == 0 ) {
            element.removeAttribute( "style" );
          }
        }
      } );
      justifyFullEditorButton.checked = false;
      justifyLeftEditorButton.checked = false;
      justifyRightEditorButton.checked = false;
      designFrame.focus();
      return true;
    };
    
    function onEdtJustifyLeft( source ) {
      //designFrame.contentDocument.execCommand(
      //  'justifyLeft', false, null );
      processSelection( function( element ) {
        if ( justifyLeftEditorButton.checked ) {
          element.style.setProperty( "text-align", "left" );
        } else {
          element.style.removeProperty( "text-align" );
          if ( element.style.length == 0 ) {
            element.removeAttribute( "style" );
          }
        }
      } );
      justifyFullEditorButton.checked = false;
      justifyCenterEditorButton.checked = false;
      justifyRightEditorButton.checked = false;
      designFrame.focus();
      return true;
    };
    
    function onEdtJustifyRight( source ) {
      //designFrame.contentDocument.execCommand(
      //  'justifyRight', false, null );
      processSelection( function( element ) {
        if ( justifyRightEditorButton.checked ) {
          element.style.setProperty( "text-align", "right" );
        } else {
          element.style.removeProperty( "text-align" );
          if ( element.style.length == 0 ) {
            element.removeAttribute( "style" );
          }
        }
      } );
      justifyFullEditorButton.checked = false;
      justifyLeftEditorButton.checked = false;
      justifyCenterEditorButton.checked = false;
      designFrame.focus();
      return true;
    };
    
    function onEdtJustifyFull( source ) {
      //designFrame.contentDocument.execCommand(
      //  'justifyFull', false, null );
      processSelection( function( element ) {
        if ( justifyFullEditorButton.checked ) {
          element.style.setProperty( "text-align", "justify" );
        } else {
          element.style.removeProperty( "text-align" );
          if ( element.style.length == 0 ) {
            element.removeAttribute( "style" );
          }
        }
      } );
      justifyCenterEditorButton.checked = false;
      justifyLeftEditorButton.checked = false;
      justifyRightEditorButton.checked = false;
      designFrame.focus();
      return true;
    };

    function onEdtRemoveFormat( source ) {
      //designFrame.contentDocument.execCommand(
      //  'removeFormat', false, null );
      processSelection( function( element ) {
        if ( element.hasAttribute( "style" ) ) {
          element.removeAttribute( "style" );
        }
      } );
      designFrame.focus();
      return true;
    };
    
    function onEdtFontName( source ) {
      var fontName = fontNameMenuList.selectedItem.value;
      //designFrame.contentDocument.execCommand(
      //  'fontName', false, fontName );
      processSelection( function( element ) {
        element.style.setProperty( "font-family", fontName );
      } );
      designFrame.focus();
      return true;
    };
    
    function onEdtFontSize( source ) {
      var fontSize = parseInt( fontSizeTextBox.value );
      fontSizeTextBox.setAttribute( "value", fontSize );
      processSelection( function( element ) {
        element.style.setProperty( "font-size", fontSize + "px" );
      } );
      designFrame.focus();
      return true;
    };
    
    function onEdtForeColor( source ) {
      var params = {
        input: {
          title: stringsBundle.getString(
            "body.colorselectdialog.title"
          ),
          message: stringsBundle.getString(
            "body.forecolorselectdialog.message"
          ),
          color: "#000000"
        },
        output: null
      };
      currentWindow.openDialog(
        "chrome://znotes/content/colorselectdialog.xul",
        "",
        "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
        params
      ).focus();
      if ( params.output ) {
        processSelection( function( element ) {
          element.style.setProperty( "color", params.output.color );
        } );
        var element = getSelectionStartElement();
        if ( element ) {
          updateColorButtons( element );
        }
      }
      designFrame.focus();
      return true;
    };
    
    function onEdtBackColor( source ) {
      var params = {
        input: {
          title: stringsBundle.getString(
            "body.colorselectdialog.title"
          ),
          message: stringsBundle.getString(
            "body.backcolorselectdialog.message"
          ),
          color: "#000000"
        },
        output: null
      };
      currentWindow.openDialog(
        "chrome://znotes/content/colorselectdialog.xul",
        "",
        "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
        params
      ).focus();
      if ( params.output ) {
        processSelection( function( element ) {
          element.style.setProperty( "background-color", params.output.color );
        } );
        var element = getSelectionStartElement();
        if ( element ) {
          updateColorButtons( element );
        }
      }
      designFrame.focus();
      return true;
    };
    
    function onEdtForeColorDelete( source ) {
      var bodyColor = getElementColor( designFrame.contentDocument.body );
      processSelection( function( element ) {
        var style = element.style;
        var color = style ? style.getPropertyValue( "color" ) : null;
        if ( color ) {
          style.removeProperty( "color" );
          if ( style.length == 0 ) {
            element.removeAttribute( "style" );
          }
        }
        if ( getElementColor( element ) != bodyColor ) {
          style.setProperty( "color", bodyColor );
        }
      } );
      var element = getSelectionStartElement();
      if ( element ) {
        updateColorButtons( element );
      }
      designFrame.focus();
      return true;
    };

    function onEdtBackColorDelete( source ) {
      var bodyBackgroundColor =
        getElementBackgroundColor( designFrame.contentDocument.body );
      processSelection( function( element ) {
        var style = element.style;
        var color = style ?
          style.getPropertyValue( "background-color" ) : null;
        if ( color && element.nodeName.toLowerCase() != "body" ) {
          style.removeProperty( "background-color" );
          if ( style.length == 0 ) {
            element.removeAttribute( "style" );
          }
        }
        if ( getElementBackgroundColor( element ) != bodyBackgroundColor ) {
          style.setProperty( "background-color", bodyBackgroundColor );
        }
      } );
      var element = getSelectionStartElement();
      if ( element ) {
        updateColorButtons( element );
      }
      designFrame.focus();
      return true;
    };
    
    function onEdtSuperscript( source ) {
      designFrame.contentDocument.execCommand(
        'superscript', false, null );
      return true;
    };
    
    function onEdtSubscript( source ) {
      designFrame.contentDocument.execCommand(
        'subscript', false, null );
      return true;
    };
    
    function onEdtIndent( source ) {
      designFrame.contentDocument.execCommand(
        'indent', false, null );
      return true;
    };
    
    function onEdtOutdent( source ) {
      designFrame.contentDocument.execCommand(
        'outdent', false, null );
      return true;
    };
    
    function onEdtInsertOrderedList( source ) {
      designFrame.contentDocument.execCommand(
        'insertOrderedList', false, null );
      return true;
    };
    
    function onEdtInsertUnorderedList( source ) {
      designFrame.contentDocument.execCommand(
        'insertUnorderedList', false, null );
      return true;
    };
    
    function onEdtInsertHorizontalRule( source ) {
      designFrame.contentDocument.execCommand(
        'insertHorizontalRule', false, null );
      return true;
    };
    
    function onEdtInsertParagraph( source ) {
      designFrame.contentDocument.execCommand(
        'insertParagraph', false, null );
      return true;
    };

    function onEdtFormatBlock( source ) {
      var aBlockFormat = formatBlockMenuList.selectedItem.value;
      designHTMLEditor.setParagraphFormat( aBlockFormat );
      designFrame.focus();
      return true;
    };
    
    function onEdtUnlink( source ) {
      designFrame.contentDocument.execCommand( 'unLink', false, null );
      return true;
    };
    
    function onEdtLink( source ) {
      var params = {
        input: {
          title: stringsBundle.getString( "editor.addLink.title" ),
          caption: " " + stringsBundle.getString( "editor.addLink.caption" ) +
                   " ",
          value: "http://"
        },
        output: null
      };
      currentWindow.openDialog(
        "chrome://znotes/content/inputdialog.xul",
        "",
        "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
        params
      ).focus();
      if ( !params.output ) {
        return true;
      }
      var url = params.output.result;
      url = url.replace(/(^\s+)|(\s+$)/g, "");
      if ( url.length == 0 ) {
        return true;
      }
      var anAnchor = designHTMLEditor.createElementWithDefaults( "a" );
      anAnchor.setAttribute( "href", encodeURI( url ) );
      designHTMLEditor.insertLinkAroundSelection( anAnchor );
      return true;
    };
    
    function onEdtInsertImage( source ) {
      var params = {
        input: {
          title: stringsBundle.getString( "editor.addImage.title" ),
          note: currentNote
        },
        output: null
      };
      currentWindow.openDialog(
        "chrome://znotes/content/imageselectdialog.xul",
        "",
        "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
        params
      ).focus();
      if ( !params.output ) {
        return true;
      }
      var url = params.output.result;
      url = url.replace(/(^\s+)|(\s+$)/g, "");
      if ( url.length == 0 ) {
        return true;
      }
      var anImage = designHTMLEditor.createElementWithDefaults( "img" );
      anImage.setAttribute( "src", encodeURI( url ) );
      designHTMLEditor.insertElementAtSelection(
        anImage, true /* aDeleteSelection */ );
      designHTMLEditor.selectElement( anImage );
      return true;
    };
    
    function onEdtInsertTable( source ) {
      var aTable = designHTMLEditor.createElementWithDefaults( "table" );
      aTable.setAttribute( "border", "1" );
      for ( var row = 0; row < 2; row++ ) {
        var aRow = designHTMLEditor.createElementWithDefaults( "tr" );
        for ( var col = 0; col < 3; col++ ) {
          var aColumn = designHTMLEditor.createElementWithDefaults( "td" );
          aColumn.setAttribute( "width", "30" );
          aRow.appendChild( aColumn );
        }
        aTable.appendChild( aRow );
      }
      designHTMLEditor.insertElementAtSelection(
        aTable, true /* aDeleteSelection */ );
      designHTMLEditor.selectElement( aTable );
      return true;
    };
    
    // S O U R C E  C O M M A N D S
    
    function onSrcBeautify( source ) {
      if ( !sourceEditor.somethingSelected() ) {
        return false;
      }
      sourceEditor.autoFormatRange(
        sourceEditor.getCursor( "start" ),
        sourceEditor.getCursor( "end" )
      );
      onSelectionChanged();
      return true;
    };
    
    // E V E N T S

    function contextMenuHandler( event ) {
      event.stopPropagation();
      event.preventDefault();
      var popupBox = editMenuPopup.getBoundingClientRect();
      var width = parseInt( popupBox.width );
      var height = parseInt( popupBox.height );
      var clientX = event.clientX;
      var clientY = event.clientY;
      if ( event.screenX + width > currentWindow.screen.availWidth ) {
        clientX -= width;
      }
      if ( event.screenY + height > currentWindow.screen.availHeight ) {
        clientY -= height;
      }
      editMenuPopup.openPopup(
        isSourceEditingActive ? sourceFrame : designFrame,
        null,
        clientX,
        clientY,
        true,
        false,
        null
      );
      return true;
    };
    
    function onEditMenuPopupShowing( event ) {
      /*
      currentWindow.goUpdateCommand( 'znotes_delete' );
      currentDocument.getElementById( "deleteEditorButton" )
                     .setAttribute(
        "tooltiptext",
        currentDocument.getElementById( "znotes_edit_delete_menuitem" )
                       .getAttribute( "label" ) +
        "\n" +
        currentDocument.getElementById( "znotes_edit_delete_menuitem" )
                       .getAttribute( "acceltext" )
      );
      */
      /*
      var oEnabled, oCan;
      edtUndo.setAttribute( "disabled", "true" );
      edtRedo.setAttribute( "disabled", "true" );
      if ( isSourceEditingActive ) {
        edtUndo.setAttribute( "disabled", "true" );
        edtRedo.setAttribute( "disabled", "true" );
        edtCut.setAttribute( "disabled", "true" );
        edtCopy.setAttribute( "disabled", "true" );
        edtDelete.setAttribute( "disabled", "true" );
        edtPaste.setAttribute( "disabled", "true" );
        srcBeautify.setAttribute( "disabled", "true" );
        //
        if ( sourceEditor.historySize().undo > 0 ) {
          edtUndo.removeAttribute( "disabled" );
        }
        if ( sourceEditor.historySize().redo > 0 ) {
          edtRedo.removeAttribute( "disabled" );
        }
        if ( sourceEditor.somethingSelected() ) {
          edtCut.removeAttribute( "disabled" );
          edtCopy.removeAttribute( "disabled" );
          edtDelete.removeAttribute( "disabled" );
          srcBeautify.removeAttribute( "disabled" );
        }
        edtPaste.removeAttribute( "disabled" );
      } else {
        if ( isDesignEditingActive && designEditor ) {
          oEnabled = {};
          oCan = {};
          designEditor.canUndo( oEnabled, oCan );
          if ( oCan.value ) {
            edtUndo.removeAttribute( "disabled" );
          }
          oEnabled = {};
          oCan = {};
          designEditor.canRedo( oEnabled, oCan );
          if ( oCan.value ) {
            edtRedo.removeAttribute( "disabled" );
          }
        }
        edtCut.setAttribute( "disabled", "true" );
        edtCopy.setAttribute( "disabled", "true" );
        edtDelete.setAttribute( "disabled", "true" );
        edtPaste.setAttribute( "disabled", "true" );
        var selection = designFrame.contentWindow.getSelection();
        if ( !selection || selection.rangeCount == 0 ||
             selection.isCollapsed ) {
          if ( isDesignEditingActive ) {
            edtPaste.removeAttribute( "disabled" );
          }
        } else {
          edtCopy.removeAttribute( "disabled" );
          if ( isDesignEditingActive ) {
            edtPaste.removeAttribute( "disabled" );
            edtCut.removeAttribute( "disabled" );
            edtDelete.removeAttribute( "disabled" );
          }
        }
      }
      */
      return true;
    };    
 
    function onSelectionChanged( event ) {
      if ( event && event.button ) {
        return true;
      }
      onEditMenuPopupShowing();
      if ( !isSourceEditingActive ) {
        var element = getSelectionStartElement();
        if ( element ) {
          updateControls( element );
        }
      }
      return true;
    };
 
    function onFontSizeTextBoxFocus( event ) {
      fontSizeTextBox.select();
      return true;
    };
    
    function onEditorTabClose( event ) {
      stop();
      switchMode( "viewer" );
    };
    
    function onEditorTabSelect( event ) {
      switch ( editorTabs.selectedIndex ) {
        case 0:
          showDesign();
          break;
        case 1:
          showSource();
          break;
      }
      return true;
    };
    
    function onSourceWindowResize( event ) {
      var sourceWindowInnerHeight = sourceWindow.innerHeight;
      if ( !sourceEditorHScrollbarHeight ) {
        var frameDocumentOffsetHeight =
          sourceWindow.document.documentElement.offsetHeight;
        var sourceEditorWrapperElementHeight =
          sourceEditor.getWrapperElement().style.height;
        var pxIndex = sourceEditorWrapperElementHeight.indexOf( "px" );
        pxIndex = pxIndex < 0 ?
          sourceEditorWrapperElementHeight.length : pxIndex;
        sourceEditorWrapperElementHeight =
          parseInt( sourceEditorWrapperElementHeight.substring( 0, pxIndex ) );
        sourceEditorHScrollbarHeight =
          frameDocumentOffsetHeight - sourceEditorWrapperElementHeight;
      }
      var updatedSourceEditorHeight =
        sourceWindowInnerHeight - sourceEditorHScrollbarHeight;
      if ( sourceEditorHeight != updatedSourceEditorHeight ) {
        sourceEditorHeight = updatedSourceEditorHeight;
        sourceEditor.setSize( null, sourceEditorHeight );
        sourceEditor.refresh();
        sourceEditor.focus();
      }
    };
    
    function onDocumentStateChanged( nowDirty ) {
      if ( nowDirty ) {
        isSourceMustBeUpdated = true;
      }
      switchState( nowDirty );
      return true;
    };

    function onSourceEditorChange( instance, changeObj ) {
      onSourceDocumentStateChanged( true );
    };
    
    function onSourceDocumentStateChanged( nowDirty ) {
      if ( nowDirty ) {
        isDesignMustBeUpdated = true;
      }
      switchState( nowDirty );
      return true;
    };
    
    // TAG LIST EVENTS
    
    function onTagChanged( e ) {
      var aTag = e.data.changedTag;
      if ( currentNote ) {
        var tagColor = tagList.getNoTag().getColor();
        var tagID = currentNote.getMainTag();
        if ( tagID ) {
          tagColor = tagList.getTagById( tagID ).getColor();
        }
        setBackgroundColor( currentNote, tagColor );
      }
    };
    
    function onTagDeleted( e ) {
      var aTag = e.data.deletedTag;
      if ( currentNote ) {
        var tagColor = tagList.getNoTag().getColor();
        var tagID = currentNote.getMainTag();
        if ( tagID ) {
          tagColor = tagList.getTagById( tagID ).getColor();
        }
        setBackgroundColor( currentNote, tagColor );
      }
    };
    
    // NOTE EVENTS
    
    function onNoteMainTagChanged( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.changedNote;
      var oldTag = e.data.oldValue;
      var newTag = e.data.newValue;
      if ( aNote == currentNote ) {
        currentNoteMainTagColor = tagList.getNoTag().getColor();
        var tagID = aNote.getMainTag();
        if ( tagID ) {
          currentNoteMainTagColor = tagList.getTagById( tagID ).getColor();
        }
        setBackgroundColor( aNote, currentNoteMainTagColor );
      }
    };
    
    function onNoteDeleted( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.deletedNote;
      if ( currentNote == aNote ) {
        removeEventListeners();
        currentNote = null;
        currentDocument = null;
        currentWindow = null;
      }
    };
    
    // @@@@ 1 onNoteMainContentChanged
    function onNoteMainContentChanged( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.changedNote;
      var oldContent = e.data.oldValue;
      var newContent = e.data.newValue;
      var status = {};
      if ( aNote == currentNote ) {
        if ( currentMode == "editor" ) {
          if ( isDesignEditingActive ) {
            doneDesignEditing();
            isDesignMustBeUpdated = true;
          } else if ( isSourceEditingActive ) {
            doneSourceEditing();
            isSourceMustBeUpdated = true;
          }
        }
        sourceEditor.setValue( newContent );
        isParseError = loadDesign( newContent, status );
        setBackgroundColor( currentNote, currentNoteMainTagColor );
        if ( currentMode == "editor" ) {
          if ( isSourceMustBeUpdated ) {
            isSourceMustBeUpdated = false;
            if ( !isParseError ) {
              loadSource( designFrame.contentDocument );
            }
            initSourceEditing();
          } else if ( isDesignMustBeUpdated ) {
            isDesignMustBeUpdated = false;
            initDesignEditing();
          }
          switchState( false );
        }
      }
    };
    
    // P R I V A T E  M E T H O D S
    
    function loadDesign( data, status ) {
      var doc = ru.akman.znotes.DocumentManager.getDocument(
        currentNote.getType()
      );
      var obj = doc.parseFromString(
        data,
        currentNote.getURI(),
        currentNote.getBaseURI(),
        currentNote.getName()
      );
      var dom = obj.dom;
      if ( status ) {
        status.value = obj.changed;
      }
      // clone dom to designFrame.contentDocument
      var node = designFrame.contentDocument.firstChild;
      while ( node ) {
        var next = node.nextSibling;
        if ( node != designFrame.contentDocument.documentElement ) {
          designFrame.contentDocument.removeChild( node )
        }
        node = next;
      }
      var node = dom.firstChild;
      while ( node && node != dom.documentElement ) {
        designFrame.contentDocument.insertBefore(
          designFrame.contentDocument.importNode( node, true ),
          designFrame.contentDocument.documentElement
        );
        node = node.nextSibling;
      }
      node = node.nextSibling;
      while ( node ) {
        designFrame.contentDocument.appendChild(
          designFrame.contentDocument.importNode( node, true )
        );
        node = node.nextSibling;
      }
      designFrame.contentDocument.replaceChild(
        dom.documentElement,
        designFrame.contentDocument.documentElement
      );
      return !obj.result;
    };
    
    function loadSource( dom ) {
      var doc = ru.akman.znotes.DocumentManager.getDocument(
        currentNote.getType() );
      sourceEditor.setValue( doc.serializeToString( dom ) );
    };
    
    function showDesign() {
      var status = {};
      if ( isSourceEditingActive ) {
        doneSourceEditing();
      } else if ( isDesignEditingActive ) {
        doneDesignEditing();
      }
      if ( isDesignMustBeUpdated ) {
        isDesignMustBeUpdated = false;
        isParseError = loadDesign( sourceEditor.getValue(), status );
        setBackgroundColor( currentNote, currentNoteMainTagColor );
        if ( status.value ) {
          isSourceMustBeUpdated = true;
        }
      }
      if ( !isParseError && currentMode == "editor" ) {
        initDesignEditing();
      }
    };
    
    function showSource() {
      if ( isDesignEditingActive ) {
        doneDesignEditing();
      }
      if ( isSourceMustBeUpdated ) {
        isSourceMustBeUpdated = false;
        if ( !isParseError ) {
          loadSource( designFrame.contentDocument );
        }
      }
      initSourceEditing();
    };
    
    function initDesignEditing() {
      if ( isDesignEditingActive ) {
        return;
      }
      isDesignEditingActive = true;
      createFontNameMenuList();
      createFormatBlockMenuList();
      setColorButtonsImages();
      if ( designToolBox.hasAttribute( "collapsed" ) ) {
        designToolBox.removeAttribute( "collapsed" );
      }
      designFrame.contentDocument.designMode = "on";
      designFrame.contentDocument.execCommand( 'styleWithCSS',
        false, null );
      designFrame.contentDocument.execCommand( 'enableInlineTableEditing',
        false, null );
      designFrame.contentDocument.execCommand( 'enableObjectResizing',
        false, null );
      designFrame.contentDocument.execCommand( 'insertBrOnReturn',
        false, null );
      designFrame.contentDocument.addEventListener( "mouseup",
        onSelectionChanged, false );
      designFrame.contentDocument.addEventListener( "keyup",
        onSelectionChanged, false );
      designHTMLEditor =
        designFrame.getHTMLEditor( designFrame.contentWindow );
      designEditor = designFrame.getEditor( designFrame.contentWindow );
      designEditor.addDocumentStateListener( documentStateListener );
      //designEditorController.defaultController =
      //  designFrame.contentWindow.controllers
      //                           .getControllerForCommand( "cmd_copy" );
      //designFrame.contentWindow.controllers
      //                         .insertControllerAt( 0,
      //                           designEditorController );
      // Restore last position of a cursor ...
      // Where is my focus ?!
      // We need to use setTimeout method :( !?
      currentWindow.setTimeout( function() {
        designFrame.focus();
        onSelectionChanged();
      }, 0 );
    };
    
    function doneDesignEditing() {
      if ( !isDesignEditingActive ) {
        return;
      }
      isDesignEditingActive = false;
      designToolBox.setAttribute( "collapsed", "true" );
      if ( designEditor ) {
        designEditor.removeDocumentStateListener( documentStateListener );
      }
      designEditor = null;
      designHTMLEditor = null;
      designFrame.contentDocument.removeEventListener( "mouseup",
        onSelectionChanged, false );
      designFrame.contentDocument.removeEventListener( "keyup",
        onSelectionChanged, false );
      //designFrame.contentWindow.controllers
      //                         .removeController( designEditorController );
      designFrame.contentDocument.designMode = "off";
      designFrame.blur();
    };
    
    function initSourceEditing() {
      if ( isSourceEditingActive ) {
        return;
      }
      isSourceEditingActive = true;
      if ( sourceToolBox.hasAttribute( "collapsed" ) ) {
        sourceToolBox.removeAttribute( "collapsed" );
      }
      sourceWindow.addEventListener( "resize",
        onSourceWindowResize, false );
      sourceFrame.contentDocument.addEventListener( "mouseup",
        onSelectionChanged, false );
      sourceFrame.contentDocument.addEventListener( "keyup",
        onSelectionChanged, false );
      sourceEditor.on( "change", onSourceEditorChange );
      onSourceWindowResize();
      sourceEditor.clearHistory();
      // Restore last position of a cursor ...
      // Where is my focus ?!
      // We need to use setTimeout method :( !?
      currentWindow.setTimeout( function() {
        sourceEditor.focus();
        onSelectionChanged();
      }, 0 );
    };
    
    function doneSourceEditing() {
      if ( !isSourceEditingActive ) {
        return;
      }
      isSourceEditingActive = false;
      sourceToolBox.setAttribute( "collapsed", "true" );
      sourceEditor.off( "change", onSourceEditorChange );
      sourceFrame.contentDocument.removeEventListener( "mouseup",
        onSelectionChanged, false );
      sourceFrame.contentDocument.removeEventListener( "keyup",
        onSelectionChanged, false );
      sourceWindow.removeEventListener( "resize",
        onSourceWindowResize, false );
    };
    
    function switchToDesignTab() {
      if ( editorTabs.selectedIndex == 1 ) {
        editorTabs.selectedIndex = 0;
      } else {
        onEditorTabSelect();
      }
    };
    
    function switchToSourceTab() {
      if ( editorTabs.selectedIndex == 0 ) {
        editorTabs.selectedIndex = 1;
      } else {
        onEditorTabSelect();
      }
    };
    
    function editorModeInit() {
      if ( editorTabs.hasAttribute( "hidden" ) ) {
        editorTabs.removeAttribute( "hidden" );
      }
      if ( Utils.IS_EDIT_SOURCE_ENABLED ) {
        if ( editorTabSource.hasAttribute( "hidden" ) ) {
          editorTabSource.removeAttribute( "hidden" );
        }
      } else {
        editorTabSource.setAttribute( "hidden", "true" );
      }
      if ( editorTabClose.hasAttribute( "hidden" ) ) {
        editorTabClose.removeAttribute( "hidden" );
      }
      switchState( false );
      if ( !isParseError ) {
        initDesignEditing();
      }
    };
    
    function viewerModeInit() {
      editorTabs.setAttribute( "hidden", "true" );
      editorTabSource.setAttribute( "hidden", "true" );
      editorTabClose.setAttribute( "hidden", "true" );
      designToolBox.setAttribute( "collapsed", "true" );
      sourceToolBox.setAttribute( "collapsed", "true" );
      switchToDesignTab();
    };
    
    function addDefaultHandlers() {
      designFrame.contentDocument.addEventListener( "click",
        Utils.clickHandler, false );
      sourceFrame.contentDocument.addEventListener( "contextmenu",
        contextMenuHandler, true );
      designFrame.contentDocument.addEventListener( "contextmenu",
        contextMenuHandler, true );
      //designViewerController.defaultController =
      //  designFrame.contentWindow.controllers
      //                           .getControllerForCommand( "cmd_copy" );
      //designFrame.contentWindow.controllers
      //                         .insertControllerAt( 0,
      //                           designViewerController );
      //sourceEditorController.defaultController =
      //  sourceFrame.contentWindow.controllers
      //                           .getControllerForCommand( "cmd_copy" );
      //sourceFrame.contentWindow.controllers
      //                         .insertControllerAt( 0,
      //                           sourceEditorController );
    };
    
    function removeDefaultHandlers() {
      if ( designFrame ) {
        designFrame.contentDocument.removeEventListener( "click",
          Utils.clickHandler, false );
        try {
          //designFrame.contentWindow.controllers.removeController(
          //  designViewerController );
        } catch ( e ) {
          Utils.log( e );
        }
        designFrame.contentDocument.removeEventListener( "contextmenu",
          contextMenuHandler, true );
      }
      if ( sourceFrame ) {
        try {
          //sourceFrame.contentWindow.controllers.removeController(
          //  sourceEditorController );
        } catch ( e ) {
          Utils.log( e );
        }
        sourceFrame.contentDocument.removeEventListener( "contextmenu",
          contextMenuHandler, true );
      }
    };

    function addEventListeners() {
      editorTabs.addEventListener( "select", onEditorTabSelect, false );
      editorTabClose.addEventListener( "command", onEditorTabClose, false );
      editMenuPopup.addEventListener( "popupshowing",
        onEditMenuPopupShowing, false );
      fontSizeTextBox.addEventListener( "change", onEdtFontSize, false );
      fontSizeTextBox.addEventListener( "focus",
        onFontSizeTextBoxFocus, false );
      currentNote.addStateListener( noteStateListener );
      tagList.addStateListener( tagListStateListener );
    };
    
    function removeEventListeners() {
      editorTabs.removeEventListener( "select", onEditorTabSelect, false );
      editorTabClose.removeEventListener( "command", onEditorTabClose, false );
      editMenuPopup.removeEventListener( "popupshowing",
        onEditMenuPopupShowing, false );
      fontSizeTextBox.removeEventListener( "change", onEdtFontSize, false );
      fontSizeTextBox.removeEventListener( "focus",
        onFontSizeTextBoxFocus, false );
      currentNote.removeStateListener( noteStateListener );
      tagList.removeStateListener( tagListStateListener );
    };
    
    function initSourceEditor() {
      sourceWindow = sourceFrame.contentWindow;
      sourceEditorLibrary = sourceWindow.Source.getLibrary();
      sourceEditor = sourceWindow.Source.getEditor();
    };
    
    function initDesignEditor() {
      designFrame.contentDocument.designMode = "on";
      designFrame.contentDocument.designMode = "off";
    };
    
    function init( callback, wait ) {
      var initProgress = 0;
      var onCallback = function() {
        if ( initProgress == 10 ) {
          // @@@@ 1 getMainContent
          sourceEditor.setValue( currentNote.getMainContent() );
          addEventListeners();
          callback();
        }
      };
      var onInitDone = function() {
        initProgress += 4;
        onCallback();
      };
      tagList = currentNote.getBook().getTagList();
      currentNoteMainTagColor = tagList.getNoTag().getColor();
      var tagId = currentNote.getMainTag();
      if ( tagId ) {
        currentNoteMainTagColor = tagList.getTagById( tagId ).getColor();
      }
      noteStateListener = {
        name: "EDITOR(default)",
        onNoteDeleted: onNoteDeleted,
        onNoteMainTagChanged: onNoteMainTagChanged,
        onNoteMainContentChanged: onNoteMainContentChanged,
      };
      tagListStateListener = {
        onTagChanged: onTagChanged,
        onTagDeleted: onTagDeleted
      };
      documentStateListener = {
        NotifyDocumentStateChanged: onDocumentStateChanged,
        NotifyDocumentCreated: function() {},
        NotifyDocumentWillBeDestroyed: function() {}
      };
      isParseError = false;
      isSourceMustBeUpdated = true;
      isDesignMustBeUpdated = true;
      //
      editorStringsBundle =
        currentDocument.getElementById( "default.editor.stringbundle" );
      //
      formatBlockObject[
        editorStringsBundle.getString( "editor.formatblock.text" )
      ] = "";
      formatBlockObject[
        editorStringsBundle.getString( "editor.formatblock.paragraph" )
      ] = "p";
      formatBlockObject[
        editorStringsBundle.getString( "editor.formatblock.heading1" )
      ] = "h1";
      formatBlockObject[
        editorStringsBundle.getString( "editor.formatblock.heading2" )
      ] = "h2";
      formatBlockObject[
        editorStringsBundle.getString( "editor.formatblock.heading3" )
      ] = "h3";
      formatBlockObject[
        editorStringsBundle.getString( "editor.formatblock.heading4" )
      ] = "h4";
      formatBlockObject[
        editorStringsBundle.getString( "editor.formatblock.heading5" )
      ] = "h5";
      formatBlockObject[
        editorStringsBundle.getString( "editor.formatblock.heading6" )
      ] = "h6";
      formatBlockObject[
        editorStringsBundle.getString( "editor.formatblock.address" )
      ] = "address";
      formatBlockObject[
        editorStringsBundle.getString( "editor.formatblock.formatted" )
      ] = "pre";
      formatBlockObject[
        editorStringsBundle.getString( "editor.formatblock.blockquote" )
      ] = "blockquote";
      //
      editorTabs = currentDocument.getElementById( "editorTabs" );
      editorTabSource = currentDocument.getElementById( "editorTabSource" );
      editorTabDesign = currentDocument.getElementById( "editorTabDesign" );
      editorTabClose = currentDocument.getElementById( "editorTabClose" );
      designToolBox = currentDocument.getElementById( "designToolBox" );
      editorToolBar1 = currentDocument.getElementById( "editorToolBar1" );
      editorToolBar2 = currentDocument.getElementById( "editorToolBar2" );
      sourceToolBox = currentDocument.getElementById( "sourceToolBox" );
      sourceToolBar = currentDocument.getElementById( "sourceToolBar" );
      //
      fontNameMenuPopup =
        currentDocument.getElementById( "fontNameMenuPopup" );
      fontNameMenuList =
        currentDocument.getElementById( "fontNameMenuList" );
      fontSizeTextBox =
        currentDocument.getElementById( "fontSizeTextBox" );
      formatBlockMenuPopup =
        currentDocument.getElementById( "formatBlockMenuPopup" );
      formatBlockMenuList =
        currentDocument.getElementById( "formatBlockMenuList" );
      foreColorEditorButton =
        currentDocument.getElementById( "foreColorEditorButton" );
      foreColorDeleteEditorButton =
        currentDocument.getElementById( "foreColorDeleteEditorButton" );
      backColorEditorButton =
        currentDocument.getElementById( "backColorEditorButton" );
      backColorDeleteEditorButton =
        currentDocument.getElementById( "backColorDeleteEditorButton" );
      italicEditorButton =
        currentDocument.getElementById( "italicEditorButton" );
      underlineEditorButton =
        currentDocument.getElementById( "underlineEditorButton" );
      strikeThroughEditorButton =
        currentDocument.getElementById( "strikeThroughEditorButton" );
      boldEditorButton =
        currentDocument.getElementById( "boldEditorButton" );
      justifyCenterEditorButton =
        currentDocument.getElementById( "justifyCenterEditorButton" );
      justifyLeftEditorButton =
        currentDocument.getElementById( "justifyLeftEditorButton" );
      justifyRightEditorButton =
        currentDocument.getElementById( "justifyRightEditorButton" );
      justifyFullEditorButton =
        currentDocument.getElementById( "justifyFullEditorButton" );
      //
      designFrame = currentDocument.getElementById( "designEditor" );
      sourceFrame = currentDocument.getElementById( "sourceEditor" );
      sourcePrintFrame = currentDocument.getElementById( "sourcePrintFrame" );
      //
      editMenuPopup = currentDocument.getElementById( "znotes_edit_menupopup" );
      // we have to start to open and hide editMenuPopup
      // to correctly determine the size of it's boxObject,
      // that are necessary in contextMenuHandler() later
      editMenuPopup.openPopup( designFrame, null, 0, 0, true, false, null );
      editMenuPopup.hidePopup();
      //
      updateStyle();
      //
      if ( wait ) {
        var onDesignFrameLoad = function() {
          designFrame.removeEventListener( "load", onDesignFrameLoad, true );
          initProgress += 1;
          initDesignEditor();
          onCallback();
        };
        var onSourceFrameLoad = function() {
          sourceFrame.removeEventListener( "load", onSourceFrameLoad, true );
          // setTimeout()
          currentWindow.setTimeout( function() {
            initProgress += 2;
            initSourceEditor();
            onCallback();
          }, 0 );
        };
        var onPrintFrameLoad = function() {
          sourcePrintFrame.removeEventListener( "load",
            onPrintFrameLoad, true );
          initProgress += 3;
          onCallback();
        };
        designFrame.addEventListener( "load", onDesignFrameLoad, true );
        sourceFrame.addEventListener( "load", onSourceFrameLoad, true );
        sourcePrintFrame.addEventListener( "load", onPrintFrameLoad, true );
      } else {
        initProgress = 6;
        initSourceEditor();
        initDesignEditor();
      }
      onInitDone();
    };
    
    function done() {
      removeDefaultHandlers();
      removeEventListeners();
      if ( currentMode == "editor" ) {
        if ( currentNote.isExists() ) {
          stop();
          switchMode( "viewer" );
        }
      }
    };
    
    function switchMode( mode ) {
      if ( currentMode && currentMode == mode ) {
        return;
      }
      currentMode = mode;
      if ( currentMode == "viewer" ) {
        viewerModeInit();
      } else {
        editorModeInit();
      }
      notifyStateListener(
        new ru.akman.znotes.core.Event(
          "ModeChanged",
          { note: currentNote, mode: currentMode }
        )
      );
    };
    
    function switchSourceState( value ) {
    };
    
    function switchState( value ) {
      if ( currentState == value ) {
        return;
      }
      currentState = value;
      notifyStateListener(
        new ru.akman.znotes.core.Event(
          "StateChanged",
          { note: currentNote, dirty: currentState }
        )
      );
    };
    
    function save() {
      var status = {};
      var position = isSourceEditingActive ?
        sourceEditor.getCursor() : null;
      if ( isSourceMustBeUpdated ) {
        isSourceMustBeUpdated = false;
        doneDesignEditing();
        loadSource( designFrame.contentDocument );
        initDesignEditing();
      } else if ( isDesignMustBeUpdated ) {
        isDesignMustBeUpdated = false;
        isParseError = loadDesign( sourceEditor.getValue(), status );
        setBackgroundColor( currentNote, currentNoteMainTagColor );
        if ( !isParseError ) {
          loadSource( designFrame.contentDocument );
        }
      }
      // @@@@ 1 setMainContent
      currentNote.setMainContent( sourceEditor.getValue() );
      switchState( false );
      if ( position ) {
        sourceEditor.setCursor( position );
      }
    };
    
    function cancel() {
      isParseError = false;
      isSourceMustBeUpdated = true;
      isDesignMustBeUpdated = true;
      // @@@@ 1 getMainContent
      sourceEditor.setValue( currentNote.getMainContent() );
      switchState( false );
      switchToDesignTab();
    };
    
    function stop() {
      if ( currentState ) {
        confirm() ? save() : cancel();
      }
    };
    
    function confirm() {
      var params = {
        input: {
          title: stringsBundle.getString(
            "body.confirmSave.title"
          ),
          message1: stringsBundle.getFormattedString(
            "body.confirmSave.message1",
            [ currentNote.getName() ]
          ),
          message2: stringsBundle.getString(
            "body.confirmSave.message2"
          )
        },
        output: null
      };
      currentWindow.openDialog(
        "chrome://znotes/content/confirmdialog.xul",
        "",
        "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
        params
      ).focus();
      if ( params.output ) {
        return true;
      }
      return false;
    };
    
    function print() {
      var aContentWindow = designFrame.contentWindow;
      if ( editorTabs.selectedIndex == 1 ) {
        var sourceText;
        var rowBegin;
        if ( sourceEditor.somethingSelected() ) {
          sourceText = sourceEditor.getSelection();
          rowBegin = parseInt( sourceEditor.getCursor( "start" ).line ) + 1;
        } else {
          sourceText = sourceEditor.getValue();
          rowBegin = 1;
        }
        var lineCount = sourceText.length > 0 ? 1 : 0;
        var pos = sourceText.indexOf( "\n" );
        while ( pos != -1 ) {
          lineCount++;
          pos = sourceText.indexOf( "\n", pos + 1 );
        }
        var lineFieldWidth = ( "" + lineCount ).length;
        var node = sourcePrintFrame.contentWindow
                                   .document.getElementById( "printView" );
        while ( node.firstChild ) {
          node.removeChild( node.firstChild );
        }
        var row = rowBegin;
        var sp = node.appendChild(
          node.ownerDocument.createElement( "span" )
        );
        var lineField = "" + row;
        while ( lineField.length < lineFieldWidth ) {
          lineField = " " + lineField;
        }
        sp.appendChild(
          node.ownerDocument.createTextNode( lineField + " " )
        );
        var col = 0;
        var callback = function ( text, style ) {
          if ( text == "\n" ) {
            row++;
            node.appendChild( node.ownerDocument.createElement( "br" ) );
            var sp = node.appendChild(
              node.ownerDocument.createElement( "span" )
            );
            var lineField = "" + row;
            while ( lineField.length < lineFieldWidth ) {
              lineField = " " + lineField;
            }
            sp.appendChild(
              node.ownerDocument.createTextNode( lineField + " " )
            );
            col = 0;
            return;
          }
          var content = "";
          // replace tabs
          for ( var pos = 0; ; ) {
            var idx = text.indexOf( "\t", pos );
            if ( idx == -1 ) {
              content += text.slice( pos );
              col += text.length - pos;
              break;
            } else {
              col += idx - pos;
              content += text.slice( pos, idx );
              var size = tabSize - col % tabSize;
              col += size;
              for ( var i = 0; i < size; ++i ) {
                content += " ";
              }
              pos = idx + 1;
            }
          }
          if ( style ) {
            var sp = node.appendChild(
              node.ownerDocument.createElement( "span" )
            );
            sp.className = "cm-" + style.replace( / +/g, " cm-" );
            sp.appendChild( node.ownerDocument.createTextNode( content ) );
          } else {
            node.appendChild( node.ownerDocument.createTextNode( content ) );
          }
        };
        sourceEditorLibrary.runMode( sourceText, "htmlmixed", callback );
        aContentWindow = sourcePrintFrame.contentWindow;
      }
      var aTitle = currentNote.getName();
      currentWindow.openDialog(
        "chrome://znotes/content/printpreview.xul",
        "",
        "chrome,dialog=no,all,modal=yes,centerscreen,resizable=yes",
        {
          aWindow: aContentWindow,
          aTitle: aTitle
        }
      ).focus();
    };
    
    function updateStyle() {
      designToolBox.setAttribute( "iconsize", currentStyle.iconsize );
      editorToolBar1.setAttribute( "iconsize", currentStyle.iconsize );
      editorToolBar2.setAttribute( "iconsize", currentStyle.iconsize );
      sourceToolBox.setAttribute( "iconsize", currentStyle.iconsize );
      sourceToolBar.setAttribute( "iconsize", currentStyle.iconsize );
      setColorButtonsImages();
    };
    
    function editorInit( win, doc, note, style, wait ) {
      removeDefaultHandlers();
      currentWindow = win;
      currentDocument = doc;
      currentNote = note;
      currentMode = null;
      currentState = null;
      currentStyle = {};
      Utils.copyObject( style, currentStyle );
      init(
        function() {
          notifyStateListener(
            new ru.akman.znotes.core.Event(
              "Opened",
              { note: currentNote }
            )
          );
          addDefaultHandlers(); 
          switchMode( "viewer" );
        },
        wait
      );
    };
    
    // LISTENERS
    
    function notifyStateListener( event ) {
      for ( var i = 0; i < listeners.length; i++ ) {
        if ( listeners[i][ "on" + event.type ] ) {
          listeners[i][ "on" + event.type ]( event );
        }
      }
    };
    
    // PUBLIC
    
    /**
     * Open editor for a note
     * @param win Window in which Document live
     * @param doc Document in which will be loaded the editor
     * @param note Note that will be opened in the editor
     * @param style Style that will be applied to the editor
     */
    this.open = function( win, doc, note, style ) {
      var editorView = doc.getElementById( "editorView" );
      var noteType = note.getType();
      var editorType = editorView.hasAttribute( "type" ) ?
        editorView.getAttribute( "type" ) : "";
      if ( editorType == noteType ) {
        editorInit( win, doc, note, style );
      } else {
        editorView.setAttribute( "type", noteType );
        while ( editorView.firstChild ) {
          editorView.removeChild( editorView.firstChild );
        }
        doc.loadOverlay(
          this.getDocument().getURL() + "editor.xul",
          {
            observe: function( subject, topic, data ) {
              if ( topic == "xul-overlay-merged" ) {
                editorInit( win, doc, note, style, true );
              }
            }
          }
        );
      }
    };
    
    /**
     * Close editor for current note
     */
    this.close = function() {
      if ( !currentDocument ) {
        throw new EditorException( "Editor was not loaded." );
      }
      notifyStateListener(
        new ru.akman.znotes.core.Event(
          "Close",
          { note: currentNote }
        )
      );
      done();
      currentNote = null;
      currentDocument = null;
      currentWindow = null;
    };
    
    /**
     * Switch to editor mode
     */
    this.edit = function() {
      if ( !currentDocument ) {
        throw new EditorException( "Editor was not loaded." );
      }
      switchMode( "editor" );
    };
    
    /**
     * Save changes
     */
    this.save = function() {
      if ( !currentDocument ) {
        throw new EditorException( "Editor was not loaded." );
      }
      save();
    };
    
    /**
     * Discard changes
     */
    this.cancel = function() {
      if ( !currentDocument ) {
        throw new EditorException( "Editor was not loaded." );
      }
      cancel();
    };
    
    /**
     * Print current view
     */
    this.print = function() {
      if ( !currentDocument ) {
        throw new EditorException( "Editor was not loaded." );
      }
      print();
    };
    
    /**
     * Update style of toolbars
     * @param style { iconsize: "small" || "normal" }
     */
    this.updateStyle = function( style ) {
      if ( !currentDocument ) {
        throw new EditorException( "Editor was not loaded." );
      }
      if ( !Utils.copyObject( style, currentStyle ) ) {
        return;
      }
      updateStyle();
    };
    
    /**
     * Add state listener
     * @param stateListener Listener
     */
    this.addStateListener = function( stateListener ) {
      if ( listeners.indexOf( stateListener ) < 0 ) {
        listeners.push( stateListener );
      }
    };
    
    /**
     * Remove state listener
     * @param stateListener Listener
     */
    this.removeStateListener = function( stateListener ) {
      var index = listeners.indexOf( stateListener );
      if ( index < 0 ) {
        return;
      }
      listeners.splice( index, 1 );
    };
      
  };

}();
