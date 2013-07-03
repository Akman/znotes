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

Components.utils.import( "resource://znotes/utils.js"  , ru.akman.znotes );
Components.utils.import( "resource://znotes/event.js"  , ru.akman.znotes.core );
Components.utils.import( "resource://znotes/documentmanager.js" , ru.akman.znotes );

var EXPORTED_SYMBOLS = ["Editor"];

var Editor = function() {

  return function() {

    // !!!! %%%% !!!! STRINGS_BUNDLE
    var stringsBundle = ru.akman.znotes.Utils.STRINGS_BUNDLE;
    var editorStringsBundle = null;
    var log = ru.akman.znotes.Utils.log;
    
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
    var currentState = null;
    var currentStyle = null;
    
    //
    
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
    var nsIEditor = null;
    var designToolBox = null;
    var editorToolBar1 = null;
    var editorToolBar2 = null;
    
    var clipPopup = null;
    
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
    
    var edtBold = null;
    var edtItalic = null;
    var edtUnderline = null;
    var edtStrikeThrough = null;
    var edtCopy = null;
    var edtCopyKey = null;
    var edtCut = null;
    var edtCutKey = null;
    var edtPaste = null;
    var edtPasteKey = null;
    var edtDelete = null;
    var edtDeleteKey = null;
    var edtSelectAll = null;
    var edtSelectAllKey = null;
    var edtUndo = null;
    var edtRedo = null;
    var edtJustifyCenter = null;
    var edtJustifyLeft = null;
    var edtJustifyRight = null;
    var edtJustifyFull = null;
    var edtSubscript = null;
    var edtSuperscript = null;
    var edtIndent = null;
    var edtOutdent = null;
    var edtLink = null;
    var edtUnlink = null;
    var edtRemoveFormat = null;
    var edtInsertOrderedList = null;
    var edtInsertUnorderedList = null;
    var edtInsertHorizontalRule = null;
    var edtInsertTable = null;
    var edtInsertImage = null;
    var edtInsertParagraph = null;
    var edtForeColor = null;
    var edtForeColorDelete = null;
    var edtBackColor = null;
    var edtBackColorDelete = null;
    
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
    var fontMapping = ru.akman.znotes.Utils.getDefaultFontMapping();
    
    var formatBlockObject = {};
    
    // U T I L S
    
    function createFontNameMenuList() {
      var fontNameArray = ru.akman.znotes.Utils.getFontNameArray();
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
        var style = "font-style: normal;font-variant: normal;font-weight: normal;font-family: '"+fontName+"';";
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
        ru.akman.znotes.Utils.makeForeColorImage( "#000000", iconSize, "#000000" )
      );
      backColorEditorButton.setAttribute(
        "image",
        ru.akman.znotes.Utils.makeBackColorImage( "#000000", iconSize )
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
        log( e );
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
          if ( color != "transparent" && ( !flag || ( flag && display == "block" ) ) ) {
            break;
          }
          el = el.parentNode;
        }
      }
      } catch ( e ) {
        log( e );
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
    
    function cloneNode( target, root, startContainer, startOffset, endContainer, endOffset, state ) {
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
            textNode.nodeValue = textNode.nodeValue.substring( startOffset, endOffset );
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
        if ( r.startContainer != endContainer && r.endContainer != endContainer ) {
          offsets.push( null );
        } else {
          offsets.push( {
            startOffset: r.startContainer == endContainer ? r.startOffset - endOffset : -1,
            endOffset: r.endContainer == endContainer ? r.endOffset - endOffset : -1
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
    
    function processNode( root, startContainer, startOffset, endContainer, endOffset, state, processor, range, singleFlag ) {
      switch ( root.nodeType ) {
        case 3: // TEXT_NODE
          var parentNode = root.parentNode;
          var rootValue = root.nodeValue;
          var rootLength = rootValue.length;
          var spanElement;
          var textNode;
          if ( root == startContainer && root == endContainer ) {
            if ( singleFlag && startOffset == 0 && endOffset == rootLength ) {
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
              spanElement = designFrame.contentDocument.createElement( "span" );
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
              spanElement = designFrame.contentDocument.createElement( "span" );
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
              spanElement = designFrame.contentDocument.createElement( "span" );
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
              spanElement = designFrame.contentDocument.createElement( "span" );
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
      log( "onEdtTest()" );
      var selection = designFrame.contentWindow.getSelection();
      var r = selection.getRangeAt( 0 );
      log( r.commonAncestorContainer );
      log( r.startContainer );
      log( r.startOffset );
      log( r.endContainer );
      log( r.endOffset );
      // -> designEditor.beginTransaction()
      // -> designEditor.endTransaction()
      // parent.insertBefore( node, root ) -> 
      // parent.appendChild( root ) -> 
      // parent.removeChild( root ) -> designEditor.deleteNode( root )
      // document.createTextNode -> 
      // document.createElement( tagName ) -> designEditor.createElementWithDefaults( tagName )
      // element.style.setProperty( name, value ) -> 
      // element.style.removeProperty( name ) -> 
      // -----------------------------------------------------------------------
      // void setAttribute(in nsIDOMElement aElement, in AString attributestr,in AString attvalue);
      // boolean getAttributeValue(in nsIDOMElement aElement, in AString attributestr, out AString resultValue);
      // void removeAttribute(in nsIDOMElement aElement, in AString aAttribute);
      // void cloneAttribute(in AString aAttribute, in nsIDOMNode aSourceNode);
      // void cloneAttributes(in nsIDOMNode destNode, in nsIDOMNode sourceNode);
      // nsIDOMNode createNode(in AString tag, in nsIDOMNode parent, in long position);
      // void insertNode(in nsIDOMNode node, in nsIDOMNode parent, in long aPosition);
      // void splitNode(in nsIDOMNode existingRightNode, in long offset, out nsIDOMNode newLeftNode);
      // void joinNodes(in nsIDOMNode leftNode, in nsIDOMNode rightNode, in nsIDOMNode parent);
      // void deleteNode(in nsIDOMNode child);
      // void markNodeDirty(in nsIDOMNode node);      
      try {
      } catch ( e ) {
        log( e );
      }
      onSelectionChanged();
    };
    */
    
    function updateColorButtons( containerElement ) {
      var iconSize = ( currentStyle.iconsize == "small" ) ? 16 : 24;
      var foregroundColor = getElementColor( containerElement );
      var backgroundColor = getElementBackgroundColor( containerElement );
      backColorEditorButton.setAttribute(
        "image",
        ru.akman.znotes.Utils.makeBackColorImage( backgroundColor, iconSize )
      );
      foreColorEditorButton.setAttribute(
        "image",
        ru.akman.znotes.Utils.makeForeColorImage( foregroundColor, iconSize, backgroundColor )
      );
    };
    
    function updateControls( containerElement ) {
      var iconSize = ( currentStyle.iconsize == "small" ) ? 16 : 24;
      var computedStyle = currentWindow.getComputedStyle( containerElement, null );
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
          if ( fontFamily.charAt( 0 ) == "'" || fontFamily.charAt( 0 ) == '"' ) {
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
        fontSizeTextBox.value = parseInt( fontSize.substring( 0, fontSize.indexOf( "px" ) ) );
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
        textDecoration = style ? style.getPropertyValue( "text-decoration" ) : null;
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
    
    function onEdtCopy( source ) {
      var transferable = Components.Constructor( "@mozilla.org/widget/transferable;1", "nsITransferable" )();
      transferable.init(
        currentWindow.QueryInterface( Components.interfaces.nsIInterfaceRequestor )
                     .getInterface( Components.interfaces.nsIWebNavigation )
      );
      if ( isSourceEditingActive ) {
        // text/unicode
        transferable.addDataFlavor( "text/unicode" );
        var textData = sourceEditor.getSelection();
        var textSupportsString = Components.Constructor("@mozilla.org/supports-string;1", "nsISupportsString")();
        textSupportsString.data = textData;
        transferable.setTransferData( "text/unicode", textSupportsString, textData.length * 2 );
      } else {
        var fragment = cloneSelection();
        // text/html
        transferable.addDataFlavor( "text/html" );
        var xmlSerializer = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"]
                                      .createInstance( Components.interfaces.nsIDOMSerializer );
        var xmlData = xmlSerializer.serializeToString( fragment );
        var xmlSupportsString = Components.Constructor("@mozilla.org/supports-string;1", "nsISupportsString")();
        xmlSupportsString.data = xmlData;
        transferable.setTransferData( "text/html", xmlSupportsString, xmlData.length * 2 );
        // text/unicode
        transferable.addDataFlavor( "text/unicode" );
        var textData = fragment.textContent;
        var textSupportsString = Components.Constructor("@mozilla.org/supports-string;1", "nsISupportsString")();
        textSupportsString.data = textData;
        transferable.setTransferData( "text/unicode", textSupportsString, textData.length * 2 );
      }
      var clipboard = Components.classes['@mozilla.org/widget/clipboard;1']
                                .createInstance( Components.interfaces.nsIClipboard );
      clipboard.setData( transferable, null, clipboard.kGlobalClipboard );
      return true;
    };
    
    function onEdtCut( source ) {
      onEdtCopy( source );
      if ( !isSourceEditingActive && !isDesignEditingActive ) {
        return false;
      }
      onEdtDelete( source );
      return true;
    };
    
    function onEdtPaste( source ) {
      if ( !isSourceEditingActive && !isDesignEditingActive ) {
        return false;
      }
      if ( isSourceEditingActive ) {
        var transferable = Components.Constructor( "@mozilla.org/widget/transferable;1", "nsITransferable" )();
        transferable.init(
          currentWindow.QueryInterface( Components.interfaces.nsIInterfaceRequestor )
                       .getInterface( Components.interfaces.nsIWebNavigation )
        );
        transferable.addDataFlavor( "text/unicode" );
        var clipboard = Components.classes['@mozilla.org/widget/clipboard;1']
                                  .createInstance( Components.interfaces.nsIClipboard );
        clipboard.getData( transferable, clipboard.kGlobalClipboard );
        var textData = {};
        var textDataLength = {};
        transferable.getTransferData( "text/unicode", textData, textDataLength );
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
    
    function onEdtDelete( source ) {
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
    
    function onEdtSelectAll( source ) {
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
    
    // U N D O  &  R E D O  C O M M A N D S

    function onEdtUndo( source ) {
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
    
    function onEdtRedo( source ) {
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
      //designFrame.contentDocument.execCommand( 'bold', false, null );
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
      designFrame.focus();
      return true;
    };
    
    function onEdtItalic( source ) {
      //designFrame.contentDocument.execCommand( 'italic', false, null );
      processSelection( function( element ) {
        if ( boldEditorButton.checked ) {
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
      //designFrame.contentDocument.execCommand( 'underline', false, null );
      processSelection( function( element ) {
        if ( boldEditorButton.checked ) {
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
      //designFrame.contentDocument.execCommand( 'strikeThrough', false, null );
      processSelection( function( element ) {
        if ( boldEditorButton.checked ) {
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
      //designFrame.contentDocument.execCommand( 'justifyCenter', false, null );
      processSelection( function( element ) {
        if ( boldEditorButton.checked ) {
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
      //designFrame.contentDocument.execCommand( 'justifyLeft', false, null );
      processSelection( function( element ) {
        if ( boldEditorButton.checked ) {
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
      //designFrame.contentDocument.execCommand( 'justifyRight', false, null );
      processSelection( function( element ) {
        if ( boldEditorButton.checked ) {
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
      //designFrame.contentDocument.execCommand( 'justifyFull', false, null );
      processSelection( function( element ) {
        if ( boldEditorButton.checked ) {
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
      //designFrame.contentDocument.execCommand( 'removeFormat', false, null );
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
      //designFrame.contentDocument.execCommand( 'fontName', false, fontName );
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
          title: stringsBundle.getString( "body.colorselectdialog.title" ),
          message: stringsBundle.getString( "body.forecolorselectdialog.message" ),
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
          title: stringsBundle.getString( "body.colorselectdialog.title" ),
          message: stringsBundle.getString( "body.backcolorselectdialog.message" ),
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
      var bodyBackgroundColor = getElementBackgroundColor( designFrame.contentDocument.body );
      processSelection( function( element ) {
        var style = element.style;
        var color = style ? style.getPropertyValue( "background-color" ) : null;
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
      designFrame.contentDocument.execCommand( 'superscript', false, null );
      return true;
    };
    
    function onEdtSubscript( source ) {
      designFrame.contentDocument.execCommand( 'subscript', false, null );
      return true;
    };
    
    function onEdtIndent( source ) {
      designFrame.contentDocument.execCommand( 'indent', false, null );
      return true;
    };
    
    function onEdtOutdent( source ) {
      designFrame.contentDocument.execCommand( 'outdent', false, null );
      return true;
    };
    
    function onEdtInsertOrderedList( source ) {
      designFrame.contentDocument.execCommand( 'insertOrderedList', false, null );
      return true;
    };
    
    function onEdtInsertUnorderedList( source ) {
      designFrame.contentDocument.execCommand( 'insertUnorderedList', false, null );
      return true;
    };
    
    function onEdtInsertHorizontalRule( source ) {
      designFrame.contentDocument.execCommand( 'insertHorizontalRule', false, null );
      return true;
    };
    
    function onEdtInsertParagraph( source ) {
      designFrame.contentDocument.execCommand( 'insertParagraph', false, null );
      return true;
    };

    function onEdtFormatBlock( source ) {
      var aBlockFormat = formatBlockMenuList.selectedItem.value;
      designEditor.setParagraphFormat( aBlockFormat );
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
          caption: " " + stringsBundle.getString( "editor.addLink.caption" ) + " ",
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
      var anAnchor = designEditor.createElementWithDefaults( "a" );
      anAnchor.setAttribute( "href", encodeURI( url ) );
      designEditor.insertLinkAroundSelection( anAnchor );
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
      var anImage = designEditor.createElementWithDefaults( "img" );
      anImage.setAttribute( "src", encodeURI( url ) );
      designEditor.insertElementAtSelection( anImage, true /* aDeleteSelection */ );
      designEditor.selectElement( anImage );
      return true;
    };
    
    function onEdtInsertTable( source ) {
      var aTable = designEditor.createElementWithDefaults( "table" );
      aTable.setAttribute( "border", "1" );
      for ( var row = 0; row < 2; row++ ) {
        var aRow = designEditor.createElementWithDefaults( "tr" );
        for ( var col = 0; col < 3; col++ ) {
          var aColumn = designEditor.createElementWithDefaults( "td" );
          aColumn.setAttribute( "width", "30" );
          aRow.appendChild( aColumn );
        }
        aTable.appendChild( aRow );
      }
      designEditor.insertElementAtSelection( aTable, true /* aDeleteSelection */ );
      designEditor.selectElement( aTable );
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
      var popupBox = clipPopup.getBoundingClientRect();
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
      clipPopup.openPopup( designFrame, null, clientX, clientY, true, false, null );
      return false;
    };
    
    function defaultClickHandler( event ) {
      return ru.akman.znotes.Utils.clickHandler( event );
    };

    function defaultPressHandler( event ) {
      if ( !event.isChar && !event.ctrlKey &&
        !event.altKey && !event.shiftKey && !event.metaKey ) {
        switch ( event.keyCode ) {
          case event.DOM_VK_DELETE:
            event.stopPropagation();
            event.preventDefault();
            onEdtDelete();
            return;
        }
      }
      if ( !event.isChar && event.ctrlKey &&
        !event.altKey && !event.shiftKey && !event.metaKey ) {
        switch ( event.charCode ) {
          /*
          case event.DOM_VK_T:
            event.stopPropagation();
            event.preventDefault();
            onEdtTest();
            return;
          */
          case event.DOM_VK_A:
            event.stopPropagation();
            event.preventDefault();
            onEdtSelectAll();
            return;
          case event.DOM_VK_C:
            event.stopPropagation();
            event.preventDefault();
            onEdtCopy();
            return;
          case event.DOM_VK_V:
            event.stopPropagation();
            event.preventDefault();
            onEdtPaste();
            return;
          case event.DOM_VK_X:
            event.stopPropagation();
            event.preventDefault();
            onEdtCut();
            return;
          case event.DOM_VK_Z:
            event.stopPropagation();
            event.preventDefault();
            onEdtUndo();
            return;
          case event.DOM_VK_Y:
            event.stopPropagation();
            event.preventDefault();
            onEdtRedo();
            return;
        }        
      }
      return true;
    };
    
    function onClipPopupShowing( event ) {
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
        if ( isDesignEditingActive ) {
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
        if ( !selection || selection.rangeCount == 0 || selection.isCollapsed ) {
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
      return true;
    };    
 
    function onSelectionChanged( event ) {
      if ( event && event.button ) {
        return true;
      }
      onClipPopupShowing();
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
        var frameDocumentOffsetHeight = sourceWindow.document.documentElement.offsetHeight;
        var sourceEditorWrapperElementHeight = sourceEditor.getWrapperElement().style.height;
        var pxIndex = sourceEditorWrapperElementHeight.indexOf( "px" );
        pxIndex = pxIndex < 0 ? sourceEditorWrapperElementHeight.length : pxIndex;
        sourceEditorWrapperElementHeight = parseInt( sourceEditorWrapperElementHeight.substring( 0, pxIndex ) );
        sourceEditorHScrollbarHeight = frameDocumentOffsetHeight - sourceEditorWrapperElementHeight;
      }
      var updatedSourceEditorHeight = sourceWindowInnerHeight - sourceEditorHScrollbarHeight;
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
      var doc = ru.akman.znotes.DocumentManager.getDocument( currentNote.getType() );
      var obj = doc.parseFromString( data, currentNote.getURI(), currentNote.getBaseURI(), currentNote.getName() );
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
      var doc = ru.akman.znotes.DocumentManager.getDocument( currentNote.getType() );
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
      designFrame.contentDocument.execCommand( 'styleWithCSS', false, null );
      designFrame.contentDocument.execCommand( 'enableInlineTableEditing', false, null );
      designFrame.contentDocument.execCommand( 'enableObjectResizing', false, null );
      designFrame.contentDocument.execCommand( 'insertBrOnReturn', false, null );
      designFrame.contentDocument.addEventListener( "mouseup", onSelectionChanged, false );
      designFrame.contentDocument.addEventListener( "keyup", onSelectionChanged, false );
      designEditor = designFrame.getHTMLEditor( designFrame.contentWindow );
      designEditor.addDocumentStateListener( documentStateListener );
      designFrame.focus();
      onSelectionChanged();
    };
    
    function doneDesignEditing() {
      if ( !isDesignEditingActive ) {
        return;
      }
      isDesignEditingActive = false;
      designToolBox.setAttribute( "collapsed", "true" );
      try {
        if ( designEditor ) {
          designEditor.removeDocumentStateListener( documentStateListener );
        }
      } catch ( e ) {
        /*
         * BUG: throws exception
         * Message: "TypeError: editor is null"
         * Source: "chrome://global/content/bindings/editor.xml", line: 94
         */
      }
      designFrame.contentDocument.designMode = "off";
      designFrame.contentDocument.removeEventListener( "mouseup", onSelectionChanged, false );
      designFrame.contentDocument.removeEventListener( "keyup", onSelectionChanged, false );
      designEditor = null;
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
      sourceWindow.addEventListener( "resize", onSourceWindowResize, false );
      sourceFrame.contentDocument.addEventListener( "mouseup", onSelectionChanged, false );
      sourceFrame.contentDocument.addEventListener( "keyup", onSelectionChanged, false );
      sourceEditor.on( "change", onSourceEditorChange );
      onSourceWindowResize();
      sourceEditor.clearHistory();
      sourceEditor.focus();
      onSelectionChanged();
    };
    
    function doneSourceEditing() {
      if ( !isSourceEditingActive ) {
        return;
      }
      isSourceEditingActive = false;
      sourceToolBox.setAttribute( "collapsed", "true" );
      sourceEditor.off( "change", onSourceEditorChange );
      sourceFrame.contentDocument.removeEventListener( "mouseup", onSelectionChanged, false );
      sourceFrame.contentDocument.removeEventListener( "keyup", onSelectionChanged, false );
      sourceWindow.removeEventListener( "resize", onSourceWindowResize, false );
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
      if ( ru.akman.znotes.Utils.IS_EDIT_SOURCE_ENABLED ) {
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
      designFrame.contentDocument.designMode = "on";
      designFrame.contentDocument.designMode = "off";
      switchToDesignTab();
    };
    
    function addDefaultHandlers() {
      sourceFrame.contentDocument.addEventListener( "contextmenu", contextMenuHandler, true );
      designFrame.contentDocument.addEventListener( "contextmenu", contextMenuHandler, true );
      designFrame.contentDocument.addEventListener( "click", defaultClickHandler, true );
      designFrame.contentDocument.addEventListener( "keypress", defaultPressHandler, false );
    };
    
    function addEventListeners() {
      editorTabs.addEventListener( "select", onEditorTabSelect, false );
      editorTabClose.addEventListener( "command", onEditorTabClose, false );
      clipPopup.addEventListener( "popupshowing", onClipPopupShowing, false );
      edtBold.addEventListener( "command", onEdtBold, false );
      edtItalic.addEventListener( "command", onEdtItalic, false );
      edtUnderline.addEventListener( "command", onEdtUnderline, false );
      edtStrikeThrough.addEventListener( "command", onEdtStrikeThrough, false );
      edtCopy.addEventListener( "command", onEdtCopy, false );
      edtCopyKey.addEventListener( "command", onEdtCopy, false );
      edtCut.addEventListener( "command", onEdtCut, false );
      edtCutKey.addEventListener( "command", onEdtCut, false );
      edtPaste.addEventListener( "command", onEdtPaste, false );
      edtPasteKey.addEventListener( "command", onEdtPaste, false );
      edtDelete.addEventListener( "command", onEdtDelete, false );
      edtDeleteKey.addEventListener( "command", onEdtDelete, false );
      edtSelectAll.addEventListener( "command", onEdtSelectAll, false );
      edtSelectAllKey.addEventListener( "command", onEdtSelectAll, false );
      edtUndo.addEventListener( "command", onEdtUndo, false );
      edtRedo.addEventListener( "command", onEdtRedo, false );
      edtJustifyCenter.addEventListener( "command", onEdtJustifyCenter, false );
      edtJustifyLeft.addEventListener( "command", onEdtJustifyLeft, false );
      edtJustifyRight.addEventListener( "command", onEdtJustifyRight, false );
      edtJustifyFull.addEventListener( "command", onEdtJustifyFull, false );
      edtSubscript.addEventListener( "command", onEdtSubscript, false );
      edtSuperscript.addEventListener( "command", onEdtSuperscript, false );
      fontSizeTextBox.addEventListener( "change", onEdtFontSize, false );
      fontSizeTextBox.addEventListener( "focus", onFontSizeTextBoxFocus, false );
      edtIndent.addEventListener( "command", onEdtIndent, false );
      edtOutdent.addEventListener( "command", onEdtOutdent, false );
      edtLink.addEventListener( "command", onEdtLink, false );
      edtUnlink.addEventListener( "command", onEdtUnlink, false );
      edtRemoveFormat.addEventListener( "command", onEdtRemoveFormat, false );
      edtInsertOrderedList.addEventListener( "command", onEdtInsertOrderedList, false );
      edtInsertUnorderedList.addEventListener( "command", onEdtInsertUnorderedList, false );
      edtInsertHorizontalRule.addEventListener( "command", onEdtInsertHorizontalRule, false );
      edtInsertTable.addEventListener( "command", onEdtInsertTable, false );
      edtInsertImage.addEventListener( "command", onEdtInsertImage, false );
      edtInsertParagraph.addEventListener( "command", onEdtInsertParagraph, false );
      edtForeColor.addEventListener( "command", onEdtForeColor, false );
      edtForeColorDelete.addEventListener( "command", onEdtForeColorDelete, false );
      edtBackColor.addEventListener( "command", onEdtBackColor, false );
      edtBackColorDelete.addEventListener( "command", onEdtBackColorDelete, false );
      srcBeautify.addEventListener( "command", onSrcBeautify, false );
      //
      currentNote.addStateListener( noteStateListener );
      tagList.addStateListener( tagListStateListener );
    };

    function removeDefaultHandlers() {
      if ( sourceFrame && sourceFrame.contentDocument ) {
        sourceFrame.contentDocument.removeEventListener( "contextmenu", contextMenuHandler, true );
      }
      if ( designFrame && designFrame.contentDocument ) {
        designFrame.contentDocument.removeEventListener( "contextmenu", contextMenuHandler, true );
        designFrame.contentDocument.removeEventListener( "click", defaultClickHandler, true );
        designFrame.contentDocument.removeEventListener( "keypress", defaultPressHandler, false );
      }
    };
    
    function removeEventListeners() {
      editorTabs.removeEventListener( "select", onEditorTabSelect, false );
      editorTabClose.removeEventListener( "command", onEditorTabClose, false );
      clipPopup.removeEventListener( "popupshowing", onClipPopupShowing, false );
      edtBold.removeEventListener( "command", onEdtBold, false );
      edtItalic.removeEventListener( "command", onEdtItalic, false );
      edtUnderline.removeEventListener( "command", onEdtUnderline, false );
      edtStrikeThrough.removeEventListener( "command", onEdtStrikeThrough, false );
      edtCopy.removeEventListener( "command", onEdtCopy, false );
      edtCopyKey.removeEventListener( "command", onEdtCopy, false );
      edtCut.removeEventListener( "command", onEdtCut, false );
      edtCutKey.removeEventListener( "command", onEdtCut, false );
      edtPaste.removeEventListener( "command", onEdtPaste, false );
      edtPasteKey.removeEventListener( "command", onEdtPaste, false );
      edtDelete.removeEventListener( "command", onEdtDelete, false );
      edtDeleteKey.removeEventListener( "command", onEdtDelete, false );
      edtSelectAll.removeEventListener( "command", onEdtSelectAll, false );
      edtSelectAllKey.removeEventListener( "command", onEdtSelectAll, false );
      edtUndo.removeEventListener( "command", onEdtUndo, false );
      edtRedo.removeEventListener( "command", onEdtRedo, false );
      edtJustifyCenter.removeEventListener( "command", onEdtJustifyCenter, false );
      edtJustifyLeft.removeEventListener( "command", onEdtJustifyLeft, false );
      edtJustifyRight.removeEventListener( "command", onEdtJustifyRight, false );
      edtJustifyFull.removeEventListener( "command", onEdtJustifyFull, false );
      edtSubscript.removeEventListener( "command", onEdtSubscript, false );
      edtSuperscript.removeEventListener( "command", onEdtSuperscript, false );
      fontSizeTextBox.removeEventListener( "change", onEdtFontSize, false );
      fontSizeTextBox.removeEventListener( "focus", onFontSizeTextBoxFocus, false );
      edtIndent.removeEventListener( "command", onEdtIndent, false );
      edtOutdent.removeEventListener( "command", onEdtOutdent, false );
      edtLink.removeEventListener( "command", onEdtLink, false );
      edtUnlink.removeEventListener( "command", onEdtUnlink, false );
      edtRemoveFormat.removeEventListener( "command", onEdtRemoveFormat, false );
      edtInsertOrderedList.removeEventListener( "command", onEdtInsertOrderedList, false );
      edtInsertUnorderedList.removeEventListener( "command", onEdtInsertUnorderedList, false );
      edtInsertHorizontalRule.removeEventListener( "command", onEdtInsertHorizontalRule, false );
      edtInsertTable.removeEventListener( "command", onEdtInsertTable, false );
      edtInsertImage.removeEventListener( "command", onEdtInsertImage, false );
      edtInsertParagraph.removeEventListener( "command", onEdtInsertParagraph, false );
      edtForeColor.removeEventListener( "command", onEdtForeColor, false );
      edtForeColorDelete.removeEventListener( "command", onEdtForeColorDelete, false );
      edtBackColor.removeEventListener( "command", onEdtBackColor, false );
      edtBackColorDelete.removeEventListener( "command", onEdtBackColorDelete, false );
      srcBeautify.removeEventListener( "command", onSrcBeautify, false );
      //
      currentNote.removeStateListener( noteStateListener );
      tagList.removeStateListener( tagListStateListener );
    };
    
    function initSourceEditor() {
      sourceWindow = sourceFrame.contentWindow;
      sourceEditorLibrary = sourceWindow.Source.getLibrary();
      sourceEditor = sourceWindow.Source.getEditor();
      // @@@@ 1 getMainContent
      sourceEditor.setValue( currentNote.getMainContent() );
    };
    
    function init( callback, wait ) {
      var initProgress = 0;
      var onCallback = function() {
        if ( initProgress == 10 ) {
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
      editorStringsBundle = currentDocument.getElementById( "default.editor.stringbundle" );
      formatBlockObject[ editorStringsBundle.getString( "editor.formatblock.text" ) ] = "";
      formatBlockObject[ editorStringsBundle.getString( "editor.formatblock.paragraph" ) ] = "p";
      formatBlockObject[ editorStringsBundle.getString( "editor.formatblock.heading1" ) ] = "h1";
      formatBlockObject[ editorStringsBundle.getString( "editor.formatblock.heading2" ) ] = "h2";
      formatBlockObject[ editorStringsBundle.getString( "editor.formatblock.heading3" ) ] = "h3";
      formatBlockObject[ editorStringsBundle.getString( "editor.formatblock.heading4" ) ] = "h4";
      formatBlockObject[ editorStringsBundle.getString( "editor.formatblock.heading5" ) ] = "h5";
      formatBlockObject[ editorStringsBundle.getString( "editor.formatblock.heading6" ) ] = "h6";
      formatBlockObject[ editorStringsBundle.getString( "editor.formatblock.address" ) ] = "address";
      formatBlockObject[ editorStringsBundle.getString( "editor.formatblock.formatted" ) ] = "pre";
      formatBlockObject[ editorStringsBundle.getString( "editor.formatblock.blockquote" ) ] = "blockquote";
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
      fontNameMenuPopup = currentDocument.getElementById( "fontNameMenuPopup" );
      fontNameMenuList = currentDocument.getElementById( "fontNameMenuList" );
      fontSizeTextBox = currentDocument.getElementById( "fontSizeTextBox" );
      formatBlockMenuPopup = currentDocument.getElementById( "formatBlockMenuPopup" );
      formatBlockMenuList = currentDocument.getElementById( "formatBlockMenuList" );
      foreColorEditorButton = currentDocument.getElementById( "foreColorEditorButton" );
      foreColorDeleteEditorButton = currentDocument.getElementById( "foreColorDeleteEditorButton" );
      backColorEditorButton = currentDocument.getElementById( "backColorEditorButton" );
      backColorDeleteEditorButton = currentDocument.getElementById( "backColorDeleteEditorButton" );
      //
      clipPopup = currentDocument.getElementById( "clipPopup" );
      //
      boldEditorButton = currentDocument.getElementById( "boldEditorButton" );
      edtBold = currentDocument.getElementById( "edtBold" );
      italicEditorButton = currentDocument.getElementById( "italicEditorButton" );
      edtItalic = currentDocument.getElementById( "edtItalic" );
      underlineEditorButton = currentDocument.getElementById( "underlineEditorButton" );
      edtUnderline = currentDocument.getElementById( "edtUnderline" );
      strikeThroughEditorButton = currentDocument.getElementById( "strikeThroughEditorButton" );
      edtStrikeThrough = currentDocument.getElementById( "edtStrikeThrough" );
      edtCopy = currentDocument.getElementById( "edtCopy" );
      edtCopyKey = currentDocument.getElementById( "edtCopyKey" );
      edtCut = currentDocument.getElementById( "edtCut" );
      edtCutKey = currentDocument.getElementById( "edtCutKey" );
      edtPaste = currentDocument.getElementById( "edtPaste" );
      edtPasteKey = currentDocument.getElementById( "edtPasteKey" );
      edtDelete = currentDocument.getElementById( "edtDelete" );
      edtDeleteKey = currentDocument.getElementById( "edtDeleteKey" );
      edtSelectAll = currentDocument.getElementById( "edtSelectAll" );
      edtSelectAllKey = currentDocument.getElementById( "edtSelectAllKey" );
      edtUndo = currentDocument.getElementById( "edtUndo" );
      edtRedo = currentDocument.getElementById( "edtRedo" );
      edtJustifyCenter = currentDocument.getElementById( "edtJustifyCenter" );
      justifyCenterEditorButton = currentDocument.getElementById( "justifyCenterEditorButton" );
      edtJustifyLeft = currentDocument.getElementById( "edtJustifyLeft" );
      justifyLeftEditorButton = currentDocument.getElementById( "justifyLeftEditorButton" );
      edtJustifyRight = currentDocument.getElementById( "edtJustifyRight" );
      justifyRightEditorButton = currentDocument.getElementById( "justifyRightEditorButton" );
      edtJustifyFull = currentDocument.getElementById( "edtJustifyFull" );
      justifyFullEditorButton = currentDocument.getElementById( "justifyFullEditorButton" );
      edtSubscript = currentDocument.getElementById( "edtSubscript" );
      edtSuperscript = currentDocument.getElementById( "edtSuperscript" );
      edtIndent = currentDocument.getElementById( "edtIndent" );
      edtOutdent = currentDocument.getElementById( "edtOutdent" );
      edtLink = currentDocument.getElementById( "edtLink" );
      edtUnlink = currentDocument.getElementById( "edtUnlink" );
      edtRemoveFormat = currentDocument.getElementById( "edtRemoveFormat" );
      edtInsertOrderedList = currentDocument.getElementById( "edtInsertOrderedList" );
      edtInsertUnorderedList = currentDocument.getElementById( "edtInsertUnorderedList" );
      edtInsertHorizontalRule = currentDocument.getElementById( "edtInsertHorizontalRule" );
      edtInsertTable = currentDocument.getElementById( "edtInsertTable" );
      edtInsertImage = currentDocument.getElementById( "edtInsertImage" );
      edtInsertParagraph = currentDocument.getElementById( "edtInsertParagraph" );
      edtForeColor = currentDocument.getElementById( "edtForeColor" );
      edtForeColorDelete = currentDocument.getElementById( "edtForeColorDelete" );
      edtBackColor = currentDocument.getElementById( "edtBackColor" );
      edtBackColorDelete = currentDocument.getElementById( "edtBackColorDelete" );
      srcBeautify = currentDocument.getElementById( "srcBeautify" );
      designFrame = currentDocument.getElementById( "designEditor" );
      sourceFrame = currentDocument.getElementById( "sourceEditor" );
      sourcePrintFrame = currentDocument.getElementById( "sourcePrintFrame" );
      updateStyle();
      //
      if ( wait ) {
        var onDesignFrameLoad = function() {
          designFrame.removeEventListener( "load", onDesignFrameLoad, true );
          initProgress += 1;
          onCallback();
        };
        var onSourceFrameLoad = function() {
          sourceFrame.removeEventListener( "load", onSourceFrameLoad, true );
          // Without calling setTimeout()
          // sourceWindow.Source.getEditor() returns NULL
          currentWindow.setTimeout( function() {
            initProgress += 2;
            initSourceEditor();
            onCallback();
          }, 0 );
        };
        var onPrintFrameLoad = function() {
          sourcePrintFrame.removeEventListener( "load", onPrintFrameLoad, true );
          initProgress += 3;
          onCallback();
        };
        designFrame.addEventListener( "load", onDesignFrameLoad, true );
        sourceFrame.addEventListener( "load", onSourceFrameLoad, true );
        sourcePrintFrame.addEventListener( "load", onPrintFrameLoad, true );
      } else {
        initProgress = 6;
        initSourceEditor();
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
      var position = isSourceEditingActive ? sourceEditor.getCursor() : null;
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
          title: stringsBundle.getString( "body.confirmSave.title" ),
          message1: stringsBundle.getFormattedString( "body.confirmSave.message1", [ currentNote.getName() ] ),
          message2: stringsBundle.getString( "body.confirmSave.message2" )
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
        var node = sourcePrintFrame.contentWindow.document.getElementById( "printView" );
        while ( node.firstChild ) {
          node.removeChild( node.firstChild );
        }
        var row = rowBegin;
        var sp = node.appendChild( node.ownerDocument.createElement( "span" ) );
        var lineField = "" + row;
        while ( lineField.length < lineFieldWidth ) {
          lineField = " " + lineField;
        }
        sp.appendChild( node.ownerDocument.createTextNode( lineField + " " ) );
        var col = 0;
        var callback = function ( text, style ) {
          if ( text == "\n" ) {
            row++;
            node.appendChild( node.ownerDocument.createElement( "br" ) );
            var sp = node.appendChild( node.ownerDocument.createElement( "span" ) );
            var lineField = "" + row;
            while ( lineField.length < lineFieldWidth ) {
              lineField = " " + lineField;
            }
            sp.appendChild( node.ownerDocument.createTextNode( lineField + " " ) );
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
            var sp = node.appendChild( node.ownerDocument.createElement( "span" ) );
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
      ru.akman.znotes.Utils.copyObject( style, currentStyle );
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
    
    function notifyStateListener( event ) {
      for ( var i = 0; i < listeners.length; i++ ) {
        if ( listeners[i][ "on" + event.type ] ) {
          listeners[i][ "on" + event.type ]( event );
        }
      }
    };
    
    // P U B L I C  M E T H O D S
    
    /**
     * Open a note and show it in the editor's view
     * @param win Window in which Document live
     * @param doc Document in which will be loaded the editor
     * @param note Note that will be opened in the editor
     * @param style Style that will be applied to the editor
     */
    this.open = function( win, doc, note, style ) {
      var editorView = doc.getElementById( "editorView" );
      var noteType = note.getType();
      var editorType = editorView.hasAttribute( "type" ) ? editorView.getAttribute( "type" ) : "";
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
     * Close the current note and hide the editor's view
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
     * Enable buttons in parent toolbars if they placed there
     */
    this.enable = function() {
      if ( !currentDocument ) {
        throw new EditorException( "Editor was not loaded." );
      }
    };
    
    /**
     * Disable buttons in parent toolbars if they placed there
     */
    this.disable = function() {
      if ( !currentDocument ) {
        throw new EditorException( "Editor was not loaded." );
      }
    };
    
    /**
     * Update style of toolbars
     * @param style { iconsize: "small" || "normal" }
     */
    this.updateStyle = function( style ) {
      if ( !currentDocument ) {
        throw new EditorException( "Editor was not loaded." );
      }
      if ( !ru.akman.znotes.Utils.copyObject( style, currentStyle ) ) {
        return;
      }
      updateStyle();
    };
    
    /**
     * Add listener
     * @param stateListener Listener
     */
    this.addStateListener = function( stateListener ) {
      if ( listeners.indexOf( stateListener ) < 0 ) {
        listeners.push( stateListener );
      }
    };
    
    /**
     * Remove listener
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
