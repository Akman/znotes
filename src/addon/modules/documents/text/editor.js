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

var EXPORTED_SYMBOLS = ["Editor"];

var Editor = function() {

  return function() {

    // !!!! %%%% !!!! STRINGS_BUNDLE
    var Utils = ru.akman.znotes.Utils;
    var stringsBundle = Utils.STRINGS_BUNDLE;
    
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
    
    var currentState = null;
    
    var currentNoteMainTagColor = null;
    var tagList = null;
    var noteStateListener = null;
    var tagListStateListener = null;
    var documentStateListener = null;

    var isDesignEditingActive = false;
    
    var editor = null;
    var originalContent = null;
    
    var editorTabs = null;
    var editorTabDesign = null;
    var editorTabClose = null;
    
    var designFrame = null;
    var designEditor = null;
    
    var designViewer = null;
    
    var designToolBox = null;
    var designToolBar = null;
    var printFrame = null;

    var fontNameMenuPopup = null;
    var fontNameMenuList = null;
    var foreColorEditorButton = null;
    var italicEditorButton = null;
    var boldEditorButton = null;
    var underlineEditorButton = null;
    var justifyCenterEditorButton = null;
    var justifyLeftEditorButton = null;
    var justifyRightEditorButton = null;
    var justifyFullEditorButton = null;
    
    var edtBold = null;
    var edtItalic = null;
    var edtUnderline = null;
    var edtForeColor = null;
    var edtFontSize = null;
    var edtJustifyCenter = null;
    var edtJustifyLeft = null;
    var edtJustifyRight = null;
    var edtJustifyFull = null;
    
    var editMenuPopup = null;
    
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
    
    // HELPERS
    
    function createFontNameMenuList() {
      var fontNameArray = ru.akman.znotes.Utils.getFontNameArray();
      while ( fontNameMenuPopup.firstChild ) {
        fontNameMenuPopup.removeChild( fontNameMenuPopup.firstChild );
      }
      for ( var i = 0; i < fontNameArray.length; i++ ) {
        var fontFamily = fontNameArray[i];
        var menuItem = currentDocument.createElement( "menuitem" );
        menuItem.setAttribute( "label", fontFamily );
        menuItem.setAttribute( "value", fontFamily );
        var style = menuItem.style;
        style.setProperty( 'font-family', "'" + fontFamily + "'" );
        menuItem.addEventListener( "command", onEdtFontName, false );
        fontNameMenuPopup.appendChild( menuItem );
      }
    };

    function setFontProperties() {
      var fontNameArray = ru.akman.znotes.Utils.getFontNameArray();
      var fontFamily = getFontFamily( currentNote );
      fontNameMenuList.selectedIndex = fontNameArray.indexOf( fontFamily );
      if ( fontNameMenuList.selectedIndex != -1 ) {
        var style = fontNameMenuList.style;
        style.setProperty( 'font-family', "'" + fontFamily + "'" );
      }
      edtFontSize.value = getFontSize( currentNote );
      italicEditorButton.checked =
        ( getFontStyle( currentNote ) == "italic" );
      boldEditorButton.checked =
        ( getFontWeight( currentNote ) == "bold" );
      underlineEditorButton.checked =
        ( getTextDecoration( currentNote ) == "underline" );
      justifyCenterEditorButton.checked =
        ( getTextAlign( currentNote ) == "center" );
      justifyLeftEditorButton.checked =
        ( getTextAlign( currentNote ) == "start" );
      justifyRightEditorButton.checked =
        ( getTextAlign( currentNote ) == "end" );
      justifyFullEditorButton.checked =
        ( getTextAlign( currentNote ) == "justify" );
    };
    
    function setColorButtonsImages() {
      foreColorEditorButton.setAttribute(
        "image",
        ru.akman.znotes.Utils.makeForeColorImage(
          getColor( currentNote ),
          currentStyle.iconsize == "small" ? 16 : 24
        )
      );
    };
    
    function setBackgroundColor( aNote, aColor ) {
      if ( currentNote != aNote ) {
        return;
      }
      var style = designFrame.inputField.style;
      style.setProperty( 'background-color', aColor );
      style = designViewer.contentDocument.body.style;
      style.setProperty( 'background-color', aColor );
    };
    
    function setDisplayStyle( aNote ) {
      var style = designFrame.inputField.style;
      style.setProperty( 'font-family', "'" + getFontFamily( aNote ) + "'" );
      style.setProperty( 'font-size', getFontSize( aNote ) + "px" );
      style.setProperty( 'font-style', getFontStyle( aNote ) );
      style.setProperty( 'font-weight', getFontWeight( aNote ) );
      style.setProperty( 'color', getColor( aNote ) );
      style.setProperty( 'text-decoration', getTextDecoration( aNote ) );
      style.setProperty( 'text-align', getTextAlign( aNote ) );
      style = designViewer.contentDocument.getElementById( "content" ).style;
      style.setProperty( 'font-family', "'" + getFontFamily( aNote ) + "'" );
      style.setProperty( 'font-size', getFontSize( aNote ) + "px" );
      style.setProperty( 'font-style', getFontStyle( aNote ) );
      style.setProperty( 'font-weight', getFontWeight( aNote ) );
      style.setProperty( 'color', getColor( aNote ) );
      style.setProperty( 'text-decoration', getTextDecoration( aNote ) );
      style.setProperty( 'text-align', getTextAlign( aNote ) );
    };
    
    function getFontFamily( aNote ) {
      var data = aNote.getData();
      return data.fontFamily ? data.fontFamily : "Courier New";
    };

    function getFontSize( aNote ) {
      var data = aNote.getData();
      return data.fontSize ? data.fontSize : "16";
    };
    
    function getColor( aNote ) {
      var data = aNote.getData();
      return data.color ? data.color : "#000000";
    };

    function getFontStyle( aNote ) {
      var data = aNote.getData();
      return data.fontStyle ? data.fontStyle : "normal";
    };
    
    function getFontWeight( aNote ) {
      var data = aNote.getData();
      return data.fontWeight ? data.fontWeight : "normal";
    };

    function getTextDecoration( aNote ) {
      var data = aNote.getData();
      return data.textDecoration ? data.textDecoration : "none";
    };
    
    function getTextAlign( aNote ) {
      var data = aNote.getData();
      return data.textAlign ? data.textAlign : "start";
    };

    function setDesignFrameContent( aContent ) {
      designFrame.value = aContent;
      var content = designViewer.contentDocument.getElementById( "content" );
      if ( !content ) {
        content = designViewer.contentDocument.body.appendChild(
          designViewer.contentDocument.createElement( "pre" )
        );
        content.setAttribute( "id", "content" );
      }
      content.textContent = aContent;
    };

    function getDesignFrameContent() {
      return designFrame.value;
    };
    
    // VIEW COMMANDS
    
    function onEdtBold( event ) {
      var fontWeight = boldEditorButton.checked ? "bold" : "normal";
      var data = currentNote.getData();
      data.fontWeight = fontWeight;
      currentNote.setData(); 
      setDisplayStyle( currentNote );
      designFrame.focus();
      return true;
    };

    function onEdtItalic( event ) {
      var fontStyle = italicEditorButton.checked ? "italic" : "normal";
      var data = currentNote.getData();
      data.fontStyle = fontStyle;
      currentNote.setData(); 
      setDisplayStyle( currentNote );
      designFrame.focus();
      return true;
    };
    
    function onEdtUnderline( event ) {
      var textDecoration = underlineEditorButton.checked ? "underline" : "none";
      var data = currentNote.getData();
      data.textDecoration = textDecoration;
      currentNote.setData(); 
      setDisplayStyle( currentNote );
      designFrame.focus();
      return true;
    };

    function onEdtJustifyCenter( event ) {
      var textAlign = "auto";
      if ( justifyCenterEditorButton.checked ) {
        textAlign = "center";
      }
      justifyFullEditorButton.checked = false;
      justifyLeftEditorButton.checked = false;
      justifyRightEditorButton.checked = false;
      var data = currentNote.getData();
      data.textAlign = textAlign;
      currentNote.setData(); 
      setDisplayStyle( currentNote );
      designFrame.focus();
      return true;
    };

    function onEdtJustifyLeft( event ) {
      var textAlign = "auto";
      if ( justifyLeftEditorButton.checked ) {
        textAlign = "start";
      }
      justifyFullEditorButton.checked = false;
      justifyCenterEditorButton.checked = false;
      justifyRightEditorButton.checked = false;
      var data = currentNote.getData();
      data.textAlign = textAlign;
      currentNote.setData(); 
      setDisplayStyle( currentNote );
      designFrame.focus();
      return true;
    };

    function onEdtJustifyRight( event ) {
      var textAlign = "auto";
      if ( justifyRightEditorButton.checked ) {
        textAlign = "end";
      }
      justifyFullEditorButton.checked = false;
      justifyLeftEditorButton.checked = false;
      justifyCenterEditorButton.checked = false;
      var data = currentNote.getData();
      data.textAlign = textAlign;
      currentNote.setData(); 
      setDisplayStyle( currentNote );
      designFrame.focus();
      return true;
    };

    function onEdtJustifyFull( event ) {
      var textAlign = "auto";
      if ( justifyFullEditorButton.checked ) {
        textAlign = "justify";
      }
      justifyCenterEditorButton.checked = false;
      justifyLeftEditorButton.checked = false;
      justifyRightEditorButton.checked = false;
      var data = currentNote.getData();
      data.textAlign = textAlign;
      currentNote.setData(); 
      setDisplayStyle( currentNote );
      designFrame.focus();
      return true;
    };
    
    function onEdtForeColor( event ) {
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
        var data = currentNote.getData();
        data.color = params.output.color;
        currentNote.setData(); 
        setDisplayStyle( currentNote );
        setColorButtonsImages();
      }
      return true;
    };

    function onEdtFontName( event ) {
      var fontFamily = fontNameMenuList.selectedItem.value;
      var style = fontNameMenuList.style;
      style.setProperty( 'font-family', "'" + fontFamily + "'" );
      var data = currentNote.getData();
      data.fontFamily = fontFamily;
      currentNote.setData(); 
      setDisplayStyle( currentNote );
      designFrame.focus();
      return true;
    };
    
    function onEdtFontSize( event ) {
      var fontSize = edtFontSize.value;
      var data = currentNote.getData();
      data.fontSize = fontSize;
      currentNote.setData(); 
      setDisplayStyle( currentNote );
      designFrame.focus();
      return true;
    };
    
    function onEdtFontSizeFocus( event ) {
      edtFontSize.select();
      return true;
    };
    
    // EDITOR COMMANDS
    
    function onEdtSelectAll( source ) {
      if ( isDesignEditingActive ) {
        designEditor.selectAll();
        onSelectionChanged();
      } else {
        designViewer.contentWindow.getSelection().selectAllChildren(
          designViewer.contentDocument.body
        );
      }
      return true;
    };
    
    function onEdtCopy( source ) {
      if ( isDesignEditingActive ) {
        designEditor.copy();
        onSelectionChanged();
      } else {
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
        var textData = designViewer.contentWindow.getSelection().toString();
        var textSupportsString = Components.Constructor(
          "@mozilla.org/supports-string;1",
          "nsISupportsString"
        )();
        textSupportsString.data = textData;
        transferable.setTransferData(
          "text/unicode", textSupportsString, textData.length * 2 );
        var clipboard =
          Components.classes['@mozilla.org/widget/clipboard;1']
                    .createInstance( Components.interfaces.nsIClipboard );
        clipboard.setData( transferable, null, clipboard.kGlobalClipboard );
      }
      return true;
    };
    
    function onEdtCut( source ) {
      designEditor.cut();
      onSelectionChanged();
      return true;
    };
    
    function onEdtPaste( source ) {
      designEditor.paste( 1 );
      onSelectionChanged();
      return true;
    };
    
    function onEdtUndo( source ) {
      designEditor.undo( 1 );
      designEditor.incrementModificationCount( -1 );
      if ( designEditor.getModificationCount() == 0 ) {
        notifyStateListener(
          new ru.akman.znotes.core.Event(
            "StateChanged",
            { note: currentNote, dirty: false }
          )
        );
      }
      onSelectionChanged();
      return true;
    };
    
    function onEdtRedo( source ) {
      designEditor.redo( 1 );
      designEditor.incrementModificationCount( 1 );
      onSelectionChanged();
      return true;
    };
    
    function onEdtDelete( source ) {
      designEditor.deleteSelection( null, null );
      onSelectionChanged();
      return true;
    };
    
    // EVENTS

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
        designViewer, null, clientX, clientY, true, false, null
      );
      return true;
    };
    
    function defaultClickHandler( event ) {
      return ru.akman.znotes.Utils.clickHandler( event );
    };

    function onEditMenuPopupShowing( event ) {
      /*
      if ( !isDesignEditingActive ) {
        edtCut.setAttribute( "disabled", "true" );
        edtDelete.setAttribute( "disabled", "true" );
        edtPaste.setAttribute( "disabled", "true" );
        edtCopy.setAttribute( "disabled", "true" );
        var selection = designViewer.contentWindow.getSelection();
        if ( selection && selection.rangeCount != 0 &&
             !selection.isCollapsed ) {
          edtCopy.removeAttribute( "disabled" );
        }
      } else {
        onSelectionChanged();
      }
      */
      return true;
    };    
    
    function updateCommands() {
      /*
      if ( !isDesignEditingActive ) {
        edtUndo.setAttribute( "disabled", "true" );
        edtRedo.setAttribute( "disabled", "true" );
        edtPaste.setAttribute( "disabled", "true" );
        return;
      }
      var isEnabled = {}, canUndo = {}, canRedo = {};
      designEditor.canUndo( isEnabled, canUndo );
      designEditor.canRedo( isEnabled, canRedo );
      if ( canUndo.value && ( designEditor.getModificationCount() > 0 ) ) {
        edtUndo.removeAttribute( "disabled" );
        onDocumentStateChanged( true );
      } else {
        edtUndo.setAttribute( "disabled", "true" );
        onDocumentStateChanged( false );
      }
      if ( canRedo.value ) {
        edtRedo.removeAttribute( "disabled" );
      } else {
        edtRedo.setAttribute( "disabled", "true" );
      }
      if ( designEditor.canPaste( 1 ) ) {
        edtPaste.removeAttribute( "disabled" );
      } else {
        edtPaste.setAttribute( "disabled", "true" );
      }
      */
    };
    
    function onSelectionChanged( event ) {
      /*
      if ( !isDesignEditingActive ) {
        if ( edtCopy.hasAttribute( "disabled" ) ) {
          edtCopy.removeAttribute( "disabled" );
        }
        edtDelete.setAttribute( "disabled", "true" );
        edtCut.setAttribute( "disabled", "true" );
      } else {
        var selectionStart = designFrame.selectionStart;
        var selectionEnd = designFrame.selectionEnd;
        if ( selectionStart != selectionEnd ) {
          edtDelete.removeAttribute( "disabled" );
          edtCopy.removeAttribute( "disabled" );
          edtCut.removeAttribute( "disabled" );
        } else {
          edtDelete.setAttribute( "disabled", "true" );
          edtCopy.setAttribute( "disabled", "true" );
          edtCut.setAttribute( "disabled", "true" );
        }
      }
      updateCommands();
      */
      return true;
    };
    
    function onEditorTabClose( event ) {
      stop();
      switchMode( "viewer" );
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
        close();
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
        doneDesignEditing();
        setDesignFrameContent( newContent );
        if ( currentMode == "editor" ) {
          switchState( false );
          initDesignEditing();
        }
      }
    };
    
    function onNoteDataChanged( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.changedNote;
      if ( aNote == currentNote ) {
        setDisplayStyle( aNote );
      }
    };
    
    // EDITOR EVENTS
    
    function onDocumentStateChanged( nowDirty ) {
      switchState( nowDirty );
      return true;
    };
    
    // PRIVATE

    function initDesignEditing() {
      if ( isDesignEditingActive ) {
        return;
      }
      isDesignEditingActive = true;
      createFontNameMenuList();
      setFontProperties();
      setColorButtonsImages();
      if ( designToolBox.hasAttribute( "collapsed" ) ) {
        designToolBox.removeAttribute( "collapsed" );
      }
      originalContent = getDesignFrameContent();
      designViewer.setAttribute( "hidden", "true" );
      designFrame.removeAttribute( "hidden" );
      designFrame.addEventListener( "keyup", onSelectionChanged, false );
      designFrame.addEventListener( "mouseup", onSelectionChanged, false );
      designFrame.focus();
      designEditor = designFrame.editor;
      designEditor.resetModificationCount();
      designEditor.enableUndo( true );
      designEditor.beginningOfDocument();
      //designEditor.addDocumentStateListener( documentStateListener );
      onSelectionChanged();
    };
    
    function doneDesignEditing() {
      if ( !isDesignEditingActive ) {
        return;
      }
      isDesignEditingActive = false;
      designFrame.removeEventListener( "keyup", onSelectionChanged, false );
      designFrame.removeEventListener( "mouseup", onSelectionChanged, false );
      designToolBox.setAttribute( "collapsed", "true" );
      //designEditor.removeDocumentStateListener( documentStateListener );
      designEditor.enableUndo( false );
      designEditor = null;
      designFrame.setAttribute( "hidden", "true" );
      designViewer.removeAttribute( "hidden" );
    };
    
    function editorModeInit() {
      if ( editorTabs.hasAttribute( "hidden" ) ) {
        editorTabs.removeAttribute( "hidden" );
      }
      if ( editorTabClose.hasAttribute( "hidden" ) ) {
        editorTabClose.removeAttribute( "hidden" );
      }
      designViewer.setAttribute( "hidden", "true" );
      designFrame.removeAttribute( "hidden" );
      switchState( false );
      initDesignEditing();
    };
    
    function viewerModeInit() {
      editorTabs.setAttribute( "hidden", "true" );
      editorTabClose.setAttribute( "hidden", "true" );
      designToolBox.setAttribute( "collapsed", "true" );
      designFrame.setAttribute( "hidden", "true" );
      designViewer.removeAttribute( "hidden" );
      doneDesignEditing();
    };

    function addDefaultHandlers() {
      designFrame.addEventListener( "contextmenu", contextMenuHandler, true );
      designFrame.addEventListener( "click", defaultClickHandler, false );
      designViewer.contentDocument.addEventListener(
        "contextmenu", contextMenuHandler, true );
      designViewer.contentDocument.addEventListener( "click",
        defaultClickHandler, false );
      //designViewer.contentWindow.controllers
      //                          .insertControllerAt( 0,
      //                            designViewerController );
      //designFrame.controllers
      //           .insertControllerAt( 0, designEditorController );
    };
    
    function addEventListeners() {
      editMenuPopup.addEventListener( "popupshowing",
        onEditMenuPopupShowing, false );
      edtBold.addEventListener( "command", onEdtBold, false );
      edtItalic.addEventListener( "command", onEdtItalic, false );
      edtUnderline.addEventListener( "command", onEdtUnderline, false );
      edtForeColor.addEventListener( "command", onEdtForeColor, false );
      edtFontSize.addEventListener( "change", onEdtFontSize, false );
      edtFontSize.addEventListener( "focus", onEdtFontSizeFocus, false );
      edtJustifyCenter.addEventListener( "command", onEdtJustifyCenter, false );
      edtJustifyLeft.addEventListener( "command", onEdtJustifyLeft, false );
      edtJustifyRight.addEventListener( "command", onEdtJustifyRight, false );
      edtJustifyFull.addEventListener( "command", onEdtJustifyFull, false );
      editorTabClose.addEventListener( "command", onEditorTabClose, false );
      currentNote.addStateListener( noteStateListener );
      tagList.addStateListener( tagListStateListener );
      addDefaultHandlers();
    };
    
    function removeDefaultHandlers() {
      if ( designFrame ) {
        designFrame.removeEventListener( "contextmenu",
          contextMenuHandler, true );
        designFrame.removeEventListener( "click", defaultClickHandler, false );
      }
      if ( designViewer ) {
        designViewer.contentDocument.removeEventListener( "contextmenu",
          contextMenuHandler, true );
        designViewer.contentDocument.removeEventListener( "click",
          defaultClickHandler, false );
      }
      if ( designViewer && designViewer.contentWindow &&
           designViewer.contentWindow.controllers ) {
        //designViewer.contentWindow.controllers
        //                          .removeController( designViewerController );
      }
      if ( designFrame && designFrame.controllers ) {    
        //designFrame.controllers.removeController( designEditorController );
      }
    };
    
    function removeEventListeners() {
      editMenuPopup.removeEventListener( "popupshowing",
        onEditMenuPopupShowing, false );
      edtBold.removeEventListener( "command", onEdtBold, false );
      edtItalic.removeEventListener( "command", onEdtItalic, false );
      edtUnderline.removeEventListener( "command", onEdtUnderline, false );
      edtForeColor.removeEventListener( "command", onEdtForeColor, false );
      edtFontSize.removeEventListener( "change", onEdtFontSize, false );
      edtFontSize.removeEventListener( "focus", onEdtFontSizeFocus, false );
      edtJustifyCenter.removeEventListener( "command",
        onEdtJustifyCenter, false );
      edtJustifyLeft.removeEventListener( "command", onEdtJustifyLeft, false );
      edtJustifyRight.removeEventListener( "command",
        onEdtJustifyRight, false );
      edtJustifyFull.removeEventListener( "command", onEdtJustifyFull, false );
      editorTabClose.removeEventListener( "command", onEditorTabClose, false );
      currentNote.removeStateListener( noteStateListener );
      tagList.removeStateListener( tagListStateListener );
      removeDefaultHandlers();
    };
    
    function init( callback, wait ) {
      var initProgress = 0;
      var onCallback = function() {
        if ( initProgress == 6 ) {
          // @@@@ 1 getMainContent
          setDesignFrameContent( currentNote.getMainContent() );
          setBackgroundColor( currentNote, currentNoteMainTagColor );
          setDisplayStyle( currentNote );
          addEventListeners();
          callback();
        }
      };
      var onInitDone = function() {
        initProgress += 3;
        onCallback();
      };
      //
      tagList = currentNote.getBook().getTagList();
      currentNoteMainTagColor = tagList.getNoTag().getColor();
      var tagId = currentNote.getMainTag();
      if ( tagId ) {
        currentNoteMainTagColor = tagList.getTagById( tagId ).getColor();
      }
      noteStateListener = {
        name: "EDITOR(text)",
        onNoteDeleted: onNoteDeleted,
        onNoteMainTagChanged: onNoteMainTagChanged,
        onNoteMainContentChanged: onNoteMainContentChanged,
        onNoteDataChanged: onNoteDataChanged
      };
      tagListStateListener = {
        onTagChanged: onTagChanged,
        onTagDeleted: onTagDeleted
      };
      //documentStateListener = {
      //  NotifyDocumentStateChanged: onDocumentStateChanged,
      //  NotifyDocumentCreated: function() {},
      //  NotifyDocumentWillBeDestroyed: function() {}
      //};
      editorTabs = currentDocument.getElementById( "editorTabs" );
      editorTabDesign = currentDocument.getElementById( "editorTabDesign" );
      editorTabClose = currentDocument.getElementById( "editorTabClose" );
      designToolBox = currentDocument.getElementById( "designToolBox" );
      designToolBar = currentDocument.getElementById( "designToolBar" );
      designFrame = currentDocument.getElementById( "designEditor" );
      designViewer = currentDocument.getElementById( "designViewer" );
      printFrame = currentDocument.getElementById( "printFrame" );
      fontNameMenuPopup =
        currentDocument.getElementById( "fontNameMenuPopup" );
      fontNameMenuList =
        currentDocument.getElementById( "fontNameMenuList" );
      foreColorEditorButton =
        currentDocument.getElementById( "foreColorEditorButton" );
      italicEditorButton =
        currentDocument.getElementById( "italicEditorButton" );
      boldEditorButton =
        currentDocument.getElementById( "boldEditorButton" );
      underlineEditorButton =
        currentDocument.getElementById( "underlineEditorButton" );
      justifyCenterEditorButton =
        currentDocument.getElementById( "justifyCenterEditorButton" );
      justifyLeftEditorButton =
        currentDocument.getElementById( "justifyLeftEditorButton" );
      justifyRightEditorButton =
        currentDocument.getElementById( "justifyRightEditorButton" );
      justifyFullEditorButton =
        currentDocument.getElementById( "justifyFullEditorButton" );
      //
      edtBold = currentDocument.getElementById( "edtBold" );
      edtItalic = currentDocument.getElementById( "edtItalic" );
      edtUnderline = currentDocument.getElementById( "edtUnderline" );
      edtForeColor = currentDocument.getElementById( "edtForeColor" );
      edtFontSize = currentDocument.getElementById( "edtFontSize" );
      edtJustifyCenter = currentDocument.getElementById( "edtJustifyCenter" );
      edtJustifyLeft = currentDocument.getElementById( "edtJustifyLeft" );
      edtJustifyRight = currentDocument.getElementById( "edtJustifyRight" );
      edtJustifyFull = currentDocument.getElementById( "edtJustifyFull" );
      //
      editMenuPopup =
        currentDocument.getElementById( "znotes_edit_menupopup" );
      // we have to start to open and hide editMenuPopup
      // to correctly determine the size of it's boxObject,
      // that are necessary in contextMenuHandler() later
      editMenuPopup.openPopup( designViewer, null, 0, 0, true, false, null );
      editMenuPopup.hidePopup();
      //
      updateStyle();
      //
      if ( wait ) {
        var onPrintFrameLoad = function() {
          printFrame.removeEventListener( "load", onPrintFrameLoad, true );
          initProgress += 1;
          onCallback();
        };
        printFrame.addEventListener( "load", onPrintFrameLoad, true );
        var onDesignViewerLoad = function() {
          designViewer.removeEventListener( "load", onDesignViewerLoad, true );
          initProgress += 2;
          onCallback();
        };
        designViewer.addEventListener( "load", onDesignViewerLoad, true );
      } else {
        initProgress = 3;
      }
      onInitDone();
    };
    
    function done() {
      removeEventListeners();
      if ( currentMode == "editor" ) {
        if ( currentNote.isExists() ) {
          stop();
          // switchMode( "viewer" );
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
      // @@@@ 1 setMainContent
      currentNote.setMainContent( getDesignFrameContent() );
      switchState( false );
    };
    
    function cancel() {
      // @@@@ 1 getMainContent
      setDesignFrameContent( currentNote.getMainContent() );
      switchState( false );
    };
    
    function stop() {
      currentState && confirm() ? save() : cancel();
    };

    function confirm() {
      var params = {
        input: {
          title: stringsBundle.getString(
            "body.confirmSave.title"
          ),
          message1: stringsBundle.getFormattedString(
            "body.confirmSave.message1", [ currentNote.getName() ]
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
        "chrome,dialog,modal,centerscreen,resizable",
        params
      ).focus();
      if ( params.output ) {
        return true;
      }
      return false;
    };

    function print() {
      printFrame.contentDocument.body.style.setProperty(
        'background-color',
        currentNoteMainTagColor
      );
      var content = printFrame.contentDocument.getElementById( "content" );
      if ( !content ) {
        content = printFrame.contentDocument.body.appendChild(
          printFrame.contentDocument.createElement( "pre" )
        );
        content.setAttribute( "id", "content" );
      }
      content.style.setProperty( 'font-family',
        "'" + getFontFamily( currentNote ) + "'" );
      content.style.setProperty( 'font-size',
        getFontSize( currentNote ) + "px" );
      content.style.setProperty( 'font-style',
        getFontStyle( currentNote ) );
      content.style.setProperty( 'font-weight',
        getFontWeight( currentNote ) );
      content.style.setProperty( 'color',
        getColor( currentNote ) );
      content.style.setProperty( 'text-decoration',
        getTextDecoration( currentNote ) );
      content.style.setProperty( 'text-align',
        getTextAlign( currentNote ) );
      content.textContent = designFrame.value;
      currentWindow.openDialog(
        "chrome://znotes/content/printpreview.xul",
        "",
        "chrome,dialog=no,all,modal,centerscreen,resizable",
        {
          aWindow: printFrame.contentWindow,
          aTitle: currentNote.getName()
        }
      ).focus();
    };
    
    function updateStyle() {
      designToolBox.setAttribute( "iconsize", currentStyle.iconsize );
      designToolBar.setAttribute( "iconsize", currentStyle.iconsize );
      if ( currentNote ) {
        setColorButtonsImages();
      }
    };
    
    function editorInit( win, doc, note, style, wait ) {
      currentWindow = win;
      currentDocument = doc;
      currentNote = note;
      currentMode = null;
      currentState = null;
      currentStyle = {};
      ru.akman.znotes.Utils.copyObject( style, currentStyle );
      init( function() {
        notifyStateListener(
          new ru.akman.znotes.core.Event(
            "Opened",
            { note: currentNote }
          )
        );
        switchMode( "viewer" );
      }, wait );
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
      if ( !ru.akman.znotes.Utils.copyObject( style, currentStyle ) ) {
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
