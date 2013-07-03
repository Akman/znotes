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

Components.utils.import( "resource://znotes/utils.js" , ru.akman.znotes );
Components.utils.import( "resource://znotes/documentmanager.js" , ru.akman.znotes );

ru.akman.znotes.Body = function() {

  // !!!! %%%% !!!! STRINGS_BUNDLE & IS_STANDALONE
  return function( anArguments ) {

    var stringsBundle = ru.akman.znotes.Utils.STRINGS_BUNDLE;
    var isStandalone = ru.akman.znotes.Utils.IS_STANDALONE;
    var log = ru.akman.znotes.Utils.log;
    
    var tagList = null;

    var currentBodyName = "*unnamed*";
    var currentWindow = null;
    var currentDocument = null;
    var currentCommands = null;
    var currentStyle = null;
    var currentToolbox = null;
    var currentCommandset = null;
    var currentBrowserId = "";

    var noteViewDeck = null;
    
    var currentNote = null;
    var currentMode = null;

    var cmdNoteTag = null;
    var cmdNoteRename = null;
    var cmdNoteDelete = null;
    var cmdNoteAddons = null;

    var noteButtonTag = null;
    var noteButtonAddons = null;

    var tagMenu = null;
    var toolBar = null;
    var toolBox = null;
    var toolBarSpacer = null;

    var noteBodyView = null;

    var noteMainBox = null;
    var noteBodySplitter = null;
    var noteAddonsBox = null;

    var noteStateListener = null;
    var tagListStateListener = null;
    
    var mutationObservers = null;
    
    var editor = null;
    var content = null;
    var attachments = null;
    var loader = null;
    var adviewer = null;

    // H E L P E R S

    function processStyleSheet( sheet, processor ) {
      var rulesCount = sheet.cssRules.length;
      for ( var i = 0; i < rulesCount; i++ ) {
        var rule = sheet.cssRules[i];
        switch ( rule.type ) {
          case 3: // IMPORT_RULE
            if ( rule.styleSheet ) {
              processStyleSheet( rule.styleSheet, processor );
            }
            break;
          case 1: // STYLE_RULE
            processor( rule );
            break;
        }
      }
    };
    
    function connectMutationObservers() {
      mutationObservers = [];
      mutationObservers.push( connectMutationObserver(   noteMainBox, "height", "noteMainBoxHeight" ) );
      mutationObservers.push( connectMutationObserver(   noteBodySplitter, "state", "noteBodySplitterState" ) );
      mutationObservers.push( connectMutationObserver(   noteAddonsBox, "height", "noteAddonsBoxHeight" ) );
    };
    
    function connectMutationObserver( target, attrName, prefName ) {
      var mutationObserver = new MutationObserver(
        function( mutations ) {
          mutations.forEach(
            function( mutation ) {
              if ( currentNote ) {
                var attrValue = mutation.target.getAttribute( attrName );
                if ( prefName == "noteBodySplitterState" ) {
                  if ( attrValue == "collapsed" ) {
                    noteButtonAddons.checked = false;
                    noteBodySplitter.setAttribute( "collapsed", "true" );
                    currentNote.savePreference( "noteBodySplitterState", "collapsed" );
                  } else {
                    noteButtonAddons.checked = true;
                    noteBodySplitter.removeAttribute( "collapsed" );
                    currentNote.savePreference( "noteBodySplitterState", "open" );
                  }
                } else {
                  currentNote.savePreference( prefName, attrValue );
                }
              }
            }
          );
        }
      );
      mutationObserver.observe(
        target,
        {
          attributes: true,
          attributeFilter: [ attrName ]
        }
      );
      return mutationObserver;
    };
    
    function disconnectMutationObservers() {
      if ( !mutationObservers ) {
        return;
      }
      for ( var i = 0; i < mutationObservers.length; i++ ) {
        mutationObservers[i].disconnect();
      }
    };
    
    function saveCurrentNotePreferences() {
      if ( !currentNote ) {
        return;
      }
      currentNote.savePreference( "noteMainBoxHeight", noteMainBox.getAttribute( "height" ) );
      currentNote.savePreference( "noteAddonsBoxHeight", noteAddonsBox.getAttribute( "height" ) );
    };

    function restoreCurrentNotePreferences() {
      if ( !currentNote ) {
        return;
      }
      noteMainBox.setAttribute( "height", currentNote.loadPreference( "noteMainBoxHeight", "300" ) );
      noteAddonsBox.setAttribute( "height", currentNote.loadPreference( "noteAddonsBoxHeight", "100" ) );
      var noteBodySplitterState = currentNote.loadPreference(
        "noteBodySplitterState",
        currentNote.hasAttachments() ? "open" : "collapsed"
      );
      if ( noteBodySplitterState == "collapsed" ) {
        noteButtonAddons.checked = false;
        noteBodySplitter.setAttribute( "state", "collapsed" );
        noteBodySplitter.setAttribute( "collapsed", "true" );
      } else {
        noteButtonAddons.checked = true;
        noteBodySplitter.removeAttribute( "collapsed" );
        noteBodySplitter.setAttribute( "state", "open" );
      }
    };

    // TAGS BAR & TAG MENU

    function refreshTagMenu( aMenu, aCmdTagMenuClear, aCmdTagMenuClick ) {
      while ( aMenu.firstChild ) {
        aMenu.removeChild( aMenu.firstChild );
      }
      var menuItem = currentDocument.createElement( "menuitem" );
      menuItem.className = "menuitem-iconic";
      menuItem.setAttribute( "label", " " + stringsBundle.getString( "body.tagmenu.clearalltags" ) );
      menuItem.addEventListener( "command", aCmdTagMenuClear, false );
      aMenu.appendChild( menuItem );
      aMenu.appendChild( currentDocument.createElement( "menuseparator" ) );
      //
      var tags = tagList.getTagsAsArray();
      for ( var i = 0; i < tags.length; i++ ) {
        var tag = tags[i];
        if ( tag.isNoTag() ) {
          continue;
        }
        var id = tag.getId();
        var name = tag.getName();
        var color = tag.getColor();
        var menuItem = currentDocument.createElement( "menuitem" );
        var image = ru.akman.znotes.Utils.makeTagImage( color, false, 16 );
        menuItem.setAttribute( "class", "menuitem-iconic" );
        menuItem.setAttribute( "image", image );
        menuItem.setAttribute( "label", " " + name );
        menuItem.setAttribute( "value", "0;" + id + ";" + color );
        menuItem.setAttribute( "id", id );
        menuItem.addEventListener( "command", aCmdTagMenuClick, false );
        aMenu.appendChild( menuItem );
      }
    };

    function updateTagsButtons( aNote, aCmdTagButtonClick ) {
      if ( currentNote != aNote ) {
        return;
      }
      var tags = [];
      if ( aNote != null ) {
        var tagIDs = aNote.getTags();
        if ( tagIDs.length > 0 ) {
          for ( var i = 0; i < tagIDs.length; i++ ) {
            tags.push( tagList.getTagById( tagIDs[i] ) );
          }
        } else {
          tags.push( tagList.getNoTag() );
        }
      }
      var toolBarLength = toolBar.children.length;
      var deletedButtons = [];
      for ( var i = 0; i < toolBarLength; i++ ) {
        var toolBarButton = toolBar.children[i];
        if ( toolBarButton.getUserData( "type" ) == "tag" ) {
          deletedButtons.push( toolBarButton );
        }
      }
      for ( var i = 0; i < deletedButtons.length; i++ ) {
        toolBar.removeChild( deletedButtons[i] );
      }
      if ( aNote != null ) {
        for ( var i = 0; i < tags.length; i++ ) {
          var tag = tags[i];
          if ( tag ) {
            var toolBarButton = currentDocument.createElement( "toolbarbutton" );
            toolBarButton.setUserData( "type", "tag", null );
            toolBarButton.setAttribute( "id", tag.getId() );
            toolBarButton.setAttribute( "pack", "start" );
            toolBarButton.setAttribute( "tooltiptext", tag.getName() );
            toolBarButton.setAttribute( "image", ru.akman.znotes.Utils.makeTagImage( tag.getColor(), true, ( currentStyle.iconsize == "small" ) ? 16 : 24 ) );
            toolBarButton.addEventListener( "command", aCmdTagButtonClick, false );
            toolBar.insertBefore( toolBarButton, toolBarSpacer );
          }
        }
      }
    };

    function updateTagMenu( aNote, aMenu ) {
      if ( currentNote != aNote ) {
        return;
      }
      var tags = aNote.getTags();
      for ( var i = 2; i < aMenu.children.length; i++ ) {
        var aMenuItem = aMenu.children[i];
        var arr = aMenuItem.getAttribute("value").split(";");
        var checked = ( arr[0] == "1" );
        var id = arr[1];
        var color = arr[2];
        if ( tags.indexOf( id ) >= 0 ) {
          arr[0] = "1";
          aMenuItem.setAttribute( "value", arr.join(";") );
          aMenuItem.setAttribute( "image", ru.akman.znotes.Utils.makeTagImage( color, true, 16 ) );
        } else {
          arr[0] = "0";
          aMenuItem.setAttribute( "value", arr.join(";") );
          aMenuItem.setAttribute( "image", ru.akman.znotes.Utils.makeTagImage( color, false, 16 ) );
        }
      }
    };

    function updateNoteTags( aNote, aMenu ) {
      var mainTagID = aNote.getMainTag();
      var tags = [];
      for ( var i = 2; i < aMenu.children.length; i++ ) {
        var aMenuItem = aMenu.children[i];
        var arr = aMenuItem.getAttribute("value").split(";");
        var checked = ( arr[0] == "1" );
        var id = arr[1];
        var color = arr[2];
        if ( checked ) {
          if ( mainTagID != null && mainTagID == id ) {
            tags.splice( 0, 0, id );
          } else {
            tags.push( id );
          }
        }
      }
      aNote.setTags( tags );
    };

    // A D D O N S  B O X  S P L I T T E R  S T A T E

    function onSplitterDblClick( event ) {
      var source = event.target;
      var state = source.getAttribute( "state" );
      if ( !state ) {
        state = "open";
      }
      if ( state == "open" ) {
        source.setAttribute( "state", "collapsed" );
      } else if ( state == "collapsed" ) {
        source.setAttribute( "state", "open" );
      }
      return true;
    };
    
    // C O M M A N D S

    function onCmdNoteAddons( source ) {
      if ( noteButtonAddons.checked ) {
        noteBodySplitter.removeAttribute( "collapsed" );
        noteBodySplitter.setAttribute( "state", "open" );
      } else {
        noteBodySplitter.setAttribute( "state", "collapsed" );
        noteBodySplitter.setAttribute( "collapsed", "true" );
      }
    };
    
    function onCmdNoteDelete( source ) {
      var params = {
        input: {
          title: stringsBundle.getString( "main.note.confirmDelete.title" ),
          message1: stringsBundle.getFormattedString( "main.note.confirmDelete.message1", [ currentNote.name ] ),
          message2: stringsBundle.getString( "main.note.confirmDelete.message2" )
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
        currentNote.remove();
      }
    };

    function onCmdNoteRename( source ) {
      if ( currentCommands && currentCommands.cmdRenameNote ) {
        currentCommands.cmdRenameNote();
        return true;
      }
      var params = {
        input: {
          title: stringsBundle.getString( "main.note.confirmRename.title" ),
          caption: " " + stringsBundle.getString( "main.note.confirmRename.caption" ) + " ",
          value: currentNote.name
        },
        output: null
      };
      currentWindow.openDialog(
        "chrome://znotes/content/inputdialog.xul",
        "",
        "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
        params
      ).focus();
      if ( params.output ) {
        var name = params.output.result;
        name = name.replace(/(^\s+)|(\s+$)/g, "");
        if ( name.length > 0 ) {
          currentNote.rename( name );
        }
      }
      return true;
    };

    function onCmdNoteTag( source ) {
      tagMenu.openPopup( noteButtonTag, "after_start", null, null, false, false, null );
    };

    function onCmdTagButtonClick( event ) {
      var id = "" + event.target.id;
      currentNote.setMainTag( id );
    };

    function onCmdTagMenuClick( event ) {
      var id = "" + event.target.id;
      for ( var i = 2; i < tagMenu.children.length; i++ ) {
        var aMenuItem = tagMenu.children[i];
        var arr = aMenuItem.getAttribute("value").split(";");
        if ( arr[1] == id ) {
          arr[0] = ( arr[0] == "0" ) ? "1" : "0";
          aMenuItem.setAttribute( "value", arr.join(";") );
          aMenuItem.setAttribute( "image", ru.akman.znotes.Utils.makeTagImage( arr[2], arr[0] == "1", 16 ) );
          break;
        }
      }
      updateNoteTags( currentNote, tagMenu );
      return true;
    };

    function onCmdTagMenuClear() {
      currentNote.setTags( [] );
      return true;
    };

    // NOTE EVENTS
    
    function onNoteDeleted( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.deletedNote;
      if ( currentNote == aNote ) {
        currentNote = null;
      }
    };

    function onNoteContentLoaded( e ) {
      var aNote = e.data.changedNote;
      if ( currentNote == aNote ) {
        if ( currentMode == "editor" ) {
          content.show( currentNote );
        } else {
          attachments.show( currentNote );
        }
      }
    };

    function onNoteContentAppended( e ) {
      var aNote = e.data.changedNote;
      if ( currentNote == aNote ) {
      }
    };

    function onNoteContentRemoved( e ) {
      var aNote = e.data.changedNote;
      if ( currentNote == aNote ) {
      }
    };

    function onNoteAttachmentAppended( e ) {
      var aNote = e.data.changedNote;
      if ( currentNote == aNote ) {
      }
    };

    function onNoteAttachmentRemoved( e ) {
      var aNote = e.data.changedNote;
      if ( currentNote == aNote ) {
      }
    };

    function onNoteTagsChanged( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.changedNote;
      var oldTags = e.data.oldValue;
      var newTags = e.data.newValue;
      updateTagsButtons(
        aNote,
        onCmdTagButtonClick
      );
      refreshTagMenu( tagMenu, onCmdTagMenuClear, onCmdTagMenuClick );
      updateTagMenu( aNote, tagMenu );
    };

    function onNoteMainTagChanged( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.changedNote;
      var oldTag = e.data.oldValue;
      var newTag = e.data.newValue;
      updateTagsButtons(
        aNote,
        onCmdTagButtonClick
      );
    };

    function onNotePrefChanged( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.changedNote;
      if ( currentNote != aNote ) {
        return;
      }
      var aPrefName = e.data.prefName;
      var oldValue = e.data.oldValue;
      var newValue = e.data.newValue;
      switch ( aPrefName ) {
        case "noteBodySplitterState":
          if ( newValue == "collapsed" ) {
            noteButtonAddons.checked = false;
            noteBodySplitter.setAttribute( "state", "collapsed" );
            noteBodySplitter.setAttribute( "collapsed", "true" );
          } else {
            noteButtonAddons.checked = true;
            noteBodySplitter.removeAttribute( "collapsed" );
            noteBodySplitter.setAttribute( "state", "open" );
          }
          break;
      }
    };
    
    // TAG LIST EVENTS

    function onTagChanged( e ) {
      var aTag = e.data.changedTag;
      refreshTagMenu( tagMenu, onCmdTagMenuClear, onCmdTagMenuClick );
      if ( currentNote ) {
        updateTagsButtons( currentNote, onCmdTagButtonClick );
        updateTagMenu( currentNote, tagMenu );
      }
    };

    function onTagDeleted( e ) {
      var aTag = e.data.deletedTag;
      refreshTagMenu( tagMenu, onCmdTagMenuClear, onCmdTagMenuClick );
      if ( currentNote ) {
        updateTagsButtons( currentNote, onCmdTagButtonClick );
        updateTagMenu( currentNote, tagMenu );
      }
    };

    function onTagCreated( e ) {
      var aTag = e.data.createdTag;
      refreshTagMenu( tagMenu, onCmdTagMenuClear, onCmdTagMenuClick );
    };

    // V I E W

    function enableLoadingView() {
      loader.enable();
      noteViewDeck.selectedIndex = 1;
    };
    
    function disableLoadingView() {
      loader.disable();
      noteViewDeck.selectedIndex = 0;
    };
    
    function disableCurrentView() {
      var buttons = toolBar.childNodes;
      for ( var i = 0; i < buttons.length; i++ ) {
        if ( buttons[i].getUserData( "type" ) == "tag" ) {
          buttons[i].setAttribute( "disabled", "true" );
          buttons[i].setAttribute( "image", ru.akman.znotes.Utils.makeTagImage( "#C0C0C0", true, ( currentStyle.iconsize == "small" ) ? 16 : 24 ) );
        }
      }
      cmdNoteTag.setAttribute( "disabled", "true" );
      cmdNoteDelete.setAttribute( "disabled", "true" );
      cmdNoteRename.setAttribute( "disabled", "true" );
      cmdNoteAddons.setAttribute( "disabled", "true" );
      attachments.disable();
      content.disable();
      editor.disable();
      adviewer.disable();
    };
    
    function enableCurrentView() {
      updateTagsButtons( currentNote, onCmdTagButtonClick );
      cmdNoteTag.removeAttribute( "disabled" );
      cmdNoteDelete.removeAttribute( "disabled" );
      cmdNoteRename.removeAttribute( "disabled" );
      cmdNoteAddons.removeAttribute( "disabled" );
      noteBodySplitter.removeAttribute( "disabled" );
      noteBodyView.removeAttribute( "disabled" );
      attachments.enable();
      content.enable();
      editor.enable();
      adviewer.enable();
    };

    function hideCurrentView() {
      updateTagsButtons( currentNote, onCmdTagButtonClick );
      cmdNoteTag.setAttribute( "disabled", "true" );
      cmdNoteDelete.setAttribute( "disabled", "true" );
      cmdNoteRename.setAttribute( "disabled", "true" );
      cmdNoteAddons.setAttribute( "disabled", "true" );
      noteBodySplitter.setAttribute( "state", "collapsed" );
      noteBodySplitter.setAttribute( "collapsed", "true" );
      noteBodySplitter.setAttribute( "disabled", "true" );
      noteBodyView.setAttribute( "disabled", "true" );
      disableLoadingView();
      loader.hide();
      attachments.hide();
      content.hide();
      editor.hide();
      adviewer.hide();
    };

    function showCurrentView() {
      if ( currentNote.isLoading() ) {
        disableCurrentView();
        enableLoadingView();
        loader.show( currentNote );
      } else {
        refreshTagMenu( tagMenu, onCmdTagMenuClear, onCmdTagMenuClick );
        updateTagMenu( currentNote, tagMenu );
        disableLoadingView();
        loader.hide();
        enableCurrentView();
        editor.show( currentNote );
        content.show( currentNote );
        attachments.show( currentNote );
        adviewer.show( currentNote );
      }
      restoreCurrentNotePreferences();
    };

    // L I S T E N E R S

    function addEventListeners() {
      cmdNoteTag.addEventListener( "command", onCmdNoteTag, false );
      cmdNoteRename.addEventListener( "command", onCmdNoteRename, false );
      cmdNoteDelete.addEventListener( "command", onCmdNoteDelete, false );
      cmdNoteAddons.addEventListener( "command", onCmdNoteAddons, false );
      noteBodySplitter.addEventListener( "dblclick", onSplitterDblClick, false );
      if ( currentNote ) {
        currentNote.addStateListener( noteStateListener );
        tagList.addStateListener( tagListStateListener );
      }
      connectMutationObservers();
    };
    
    function removeEventListeners() {
      disconnectMutationObservers();
      cmdNoteTag.removeEventListener( "command", onCmdNoteTag, false );
      cmdNoteRename.removeEventListener( "command", onCmdNoteRename, false );
      cmdNoteDelete.removeEventListener( "command", onCmdNoteDelete, false );
      cmdNoteAddons.removeEventListener( "command", onCmdNoteAddons, false );
      noteBodySplitter.removeEventListener( "dblclick", onSplitterDblClick, false );
      if ( currentNote ) {
        currentNote.removeStateListener( noteStateListener );
        tagList.removeStateListener( tagListStateListener );
      }
    };

    // P U B L I C  M E T H O D S

    this.updateStyle = function( style ) {
      if ( !ru.akman.znotes.Utils.copyObject( style, currentStyle ) ) {
        return;
      }
      toolBox.setAttribute( "iconsize", currentStyle.iconsize );
      toolBar.setAttribute( "iconsize", currentStyle.iconsize );
      if ( currentNote ) {
        updateTagsButtons( currentNote, onCmdTagButtonClick );
      }
      editor.updateStyle( style );
      loader.updateStyle( style );
      adviewer.updateStyle( style );
    };
    
    this.print = function() {
      editor.print();
    };

    this.show = function( aNote, aForced ) {
      if ( currentNote && currentNote == aNote && !aForced ) {
        return;
      }
      removeEventListeners();
      currentNote = aNote;
      if ( currentNote && currentNote.isExists() ) {
        tagList = currentNote.getBook().getTagList();
        addEventListeners();
        showCurrentView();
      } else {
        hideCurrentView();
      }
    };

    this.unload = function() {
      editor.unload();
      content.unload();
      attachments.unload();
      loader.unload();
      adviewer.unload();
      removeEventListeners();
    };
    
    // C O N S T R U C T O R

    if ( anArguments.name ) {
      currentBodyName = anArguments.name;
    }
    currentWindow = anArguments.window;
    currentDocument = anArguments.document;
    if ( anArguments.commands ) {
      currentCommands = anArguments.commands;
    }
    currentMode = "viewer";
    if ( anArguments.mode && anArguments.mode == "editor" ) {
      currentMode = anArguments.mode;
    }
    currentStyle = {
      iconsize: "small"
    }
    if ( anArguments.style ) {
      currentStyle = anArguments.style;
    }
    if ( anArguments.browserid != null ) {
      currentBrowserId = anArguments.browserid;
    }
    if ( anArguments.toolbox ) {
      currentToolbox = anArguments.toolbox;
    }
    if ( anArguments.commandset ) {
      currentCommandset = anArguments.commandset;
    }
    //
    content = new ru.akman.znotes.Content( currentWindow, currentDocument );
    attachments = new ru.akman.znotes.Attachments( currentWindow, currentDocument );
    editor = new ru.akman.znotes.Editor( currentWindow, currentDocument, currentMode, currentStyle );
    loader = new ru.akman.znotes.Loader( currentWindow, currentDocument, currentStyle );
    adviewer = new ru.akman.znotes.AdViewer( currentWindow, currentDocument, currentStyle );
    //
    noteBodyView = currentDocument.getElementById( "noteBodyView" );
    noteMainBox = currentDocument.getElementById( "noteMainBox" );
    noteViewDeck = currentDocument.getElementById( "noteViewDeck" );
    noteBodySplitter = currentDocument.getElementById( "noteBodySplitter" );
    noteAddonsBox = currentDocument.getElementById( "noteAddonsBox" );
    //
    noteButtonTag = currentDocument.getElementById( "noteButtonTag" );
    noteButtonAddons = currentDocument.getElementById( "noteButtonAddons" );
    //
    cmdNoteTag = currentDocument.getElementById( "cmdNoteTag" );
    cmdNoteRename = currentDocument.getElementById( "cmdNoteRename" );
    cmdNoteDelete = currentDocument.getElementById( "cmdNoteDelete" );
    cmdNoteAddons = currentDocument.getElementById( "cmdNoteAddons" );
    //
    tagMenu = currentDocument.getElementById( "tagMenu" );
    //
    toolBox = currentDocument.getElementById( "toolBox" );
    toolBox.setAttribute( "iconsize", currentStyle.iconsize );
    toolBar = currentDocument.getElementById( "toolBar" );
    toolBar.setAttribute( "iconsize", currentStyle.iconsize );
    toolBarSpacer = currentDocument.getElementById( "toolBarSpacer" );
    if ( currentBodyName != "main" ) {
      if ( ru.akman.znotes.Utils.IS_STANDALONE ) {
        noteBodyView.classList.add( "noteBodyViewStandalone" );
      } else {
        noteBodyView.classList.add( "noteBodyViewAddon" );
      }
    }
    // only the separate tab has currentToolbox
    if ( currentToolbox ) {
      noteBodyView.classList.add( "znotes_contentbodyview" );
      while ( currentToolbox.firstChild ) {
        currentToolbox.removeChild( currentToolbox.firstChild );
      }
      while ( currentCommandset.firstChild ) {
        currentCommandset.removeChild( currentCommandset.firstChild );
      }
      var cssRules = [];
      for ( var i = 0; i < currentDocument.styleSheets.length; i++ ) {
        processStyleSheet(
          currentDocument.styleSheets[i],
          function( rule ) {
            selectorText = rule.selectorText;
            declarationText = rule.cssText.substring( selectorText.length );
            for ( var k = 1; k < toolBar.children.length; k++ ) {
              selectorEnabled = '#' + toolBar.children[k].getAttribute( 'id' );
              selectorDisabled = selectorEnabled + '[disabled="true"]';
              selectorSmallEnabled = 'toolbar[iconsize="small"] ' + selectorEnabled;
              selectorSmallDisabled = 'toolbar[iconsize="small"] ' + selectorDisabled;
              if ( selectorText == selectorEnabled ) {
                cssRules.push( selectorText + currentBrowserId + declarationText );
              } else if ( selectorText == selectorDisabled ) {
                cssRules.push( selectorText.substring( 0, selectorText.length - 17 ) + currentBrowserId + '[disabled="true"]' + declarationText );
              } else if ( selectorText == selectorSmallEnabled ) {
                cssRules.push( selectorText + currentBrowserId + declarationText );
              } else if ( selectorText == selectorSmallDisabled ) {
                cssRules.push( selectorText.substring( 0, selectorText.length - 17 ) + currentBrowserId + '[disabled="true"]' + declarationText );
              }
            }
          }
        );
      }
      while ( toolBox.firstChild ) {
        currentToolbox.appendChild( toolBox.firstChild );
      }
      toolBar.setAttribute( "id", toolBar.getAttribute( "id" ) + currentBrowserId );
      for ( var i = 1; i < toolBar.children.length; i++ ) {
        var button = toolBar.children[i];
        var buttonId = button.getAttribute( "id" );
        if ( button.nodeName == "toolbarbutton" ) {
          var buttonCommand = button.getAttribute( "command" );
          var command = currentDocument.getElementById( buttonCommand );
          command.setAttribute( "id", buttonCommand + currentBrowserId );
          currentCommandset.appendChild( command );
          button.setAttribute( "command", buttonCommand + currentBrowserId );
        }
        button.setAttribute( "id", buttonId + currentBrowserId );
      }
      var styleSheet = toolBar.ownerDocument.styleSheets[0];
      for ( var i = 0; i < cssRules.length; i++ ) {
        styleSheet.insertRule( cssRules[i], styleSheet.cssRules.length - 1 );
      }
      while ( toolBox.firstChild ) {
        toolBox.removeChild( toolBox.firstChild );
      }
      toolBox.setAttribute( "collapsed", "true" );
    }
    noteStateListener = {
      name: "BODY",
      onNoteDeleted: onNoteDeleted,
      onNoteTagsChanged: onNoteTagsChanged,
      onNoteMainTagChanged: onNoteMainTagChanged,
      onNoteContentLoaded: onNoteContentLoaded,
      onNoteContentAppended: onNoteContentAppended,
      onNoteContentRemoved: onNoteContentRemoved,
      onNoteAttachmentAppended: onNoteAttachmentAppended,
      onNoteAttachmentRemoved: onNoteAttachmentRemoved,
      onNotePrefChanged: onNotePrefChanged
    };
    //
    tagListStateListener = {
      onTagCreated: onTagCreated,
      onTagChanged: onTagChanged,
      onTagDeleted: onTagDeleted,
    };
    
  };

}();
