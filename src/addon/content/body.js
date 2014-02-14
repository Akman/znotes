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
Components.utils.import( "resource://znotes/prefsmanager.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/event.js",
  ru.akman.znotes.core
);

ru.akman.znotes.Body = function() {

  // !!!! %%%% !!!! STRINGS_BUNDLE & IS_STANDALONE
  return function( anArguments ) {

    var Utils = ru.akman.znotes.Utils;
    var Common = ru.akman.znotes.Common;

    var prefsBundle = ru.akman.znotes.PrefsManager.getInstance();
    
    var observers = [];

    var self = this;

    var currentWindow = null;    
    var currentName = "*unnamed*";
    var currentMode = null;
    var currentStyle = null;
    var currentToolbox = null;
    
    var currentNote = null;
    var tagList = null;

    var noteBodyView = null;
    var noteViewDeck = null;
    var noteMainBox = null;
    var noteBodySplitter = null;
    var noteAddonsBox = null;
    
    var bodyAddonsButton = null;
    var bodyTagsMenu = null;
    var bodyTagsMenuButton = null;
    var bodyTagsMenuButtonMenuPopup = null;
    var bodyTypesMenu = null;
    var bodyTypesMenuButton = null;
    var bodyTypesMenuButtonMenuPopup = null;
    var bodyToolbar = null;
    var bodyToolbox = null;
    var bodyToolbarSpacer = null;
    var bodyToolboxPalette = null;

    var noteStateListener = null;
    var tagListStateListener = null;
    var mutationObservers = null;
    
    var prefObserver = {
      onPrefChanged: function( event ) {
        switch( event.data.name ) {
          case "bodyToolbarCurrentSet":
            restoreToolbarCurrentSet();
            break;
        }
      }
    };
    
    //
    // COMMANDS
    //
    
    var bodyCommands = {
      "znotes_bodycustomizetoolbar_command": null,
      "znotes_bodydeletenote_command": null,
      "znotes_bodyrenamenote_command": null,
      "znotes_bodytagsmenu_command": null,
      "znotes_bodytypesmenu_command": null,
      "znotes_bodyaddonspanel_command": null
    };
    
    var bodyController = {
      supportsCommand: function( cmd ) {
        if ( !( cmd in bodyCommands ) ) {
          return false;
        }
        return true;
        /*
        var focusedWindow =
          currentWindow.top.document.commandDispatcher.focusedWindow;
        if ( focusedWindow != currentWindow ) {
          Utils.log( focusedWindow.name + " >> " + focusedWindow.location );
        }
        return ( focusedWindow == currentWindow );
        */
      },
      isCommandEnabled: function( cmd ) {
        if ( !( cmd in bodyCommands ) ) {
          return false;
        }
        return ( currentNote && currentNote.isExists() && !currentNote.isLoading() );
      },
      doCommand: function( cmd ) {
        if ( !( cmd in bodyCommands ) ) {
          return;
        }
        switch ( cmd ) {
          case "znotes_bodydeletenote_command":
            var params = {
              input: {
                title: Utils.STRINGS_BUNDLE.getString( "main.note.confirmDelete.title" ),
                message1: Utils.STRINGS_BUNDLE.getFormattedString( "main.note.confirmDelete.message1", [ currentNote.name ] ),
                message2: Utils.STRINGS_BUNDLE.getString( "main.note.confirmDelete.message2" )
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
            break;
          case "znotes_bodyrenamenote_command":
            if ( currentName == "main" ) {
              Common.goDoCommand(
                "znotes_renamenote_command",
                this.getCommand( "znotes_bodyrenamenote_command" )
              );
              return;
            }
            var params = {
              input: {
                title: Utils.STRINGS_BUNDLE.getString( "main.note.confirmRename.title" ),
                caption: " " + Utils.STRINGS_BUNDLE.getString( "main.note.confirmRename.caption" ) + " ",
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
            break;
          case "znotes_bodycustomizetoolbar_command":
            currentWindow.openDialog(
              "chrome://global/content/customizeToolbar.xul",
              "",
              "chrome,all,dependent,centerscreen",
              currentToolbox
            ).focus();
            break;
          case "znotes_bodytagsmenu_command":
            // if bodyTagsMenuButton is not in toolbar
            // then bodyTagsMenuButton == null
            if ( !bodyTagsMenuButton ) {
              return;
            }
            if ( bodyTagsMenu.state == "open" ) {
              bodyTagsMenu.hidePopup();
            } else {
              bodyTagsMenu.openPopup(
                bodyTagsMenuButton,
                "after_start",
                0,
                0,
                false,
                false,
                null
              );
            }
            break;
          case "znotes_bodytypesmenu_command":
            // if bodyTypesMenuButton is not in toolbar
            // then bodyTypesMenuButton == null
            if ( !bodyTypesMenuButton ) {
              return;
            }
            if ( bodyTypesMenu.state == "open" ) {
              bodyTypesMenu.hidePopup();
            } else {
              bodyTypesMenu.openPopup(
                bodyTypesMenuButton,
                "after_start",
                0,
                0,
                false,
                false,
                null
              );
            }
            break;
          case "znotes_bodyaddonspanel_command":
            var isCollapsed =
              ( noteBodySplitter.getAttribute( "state" ) == "collapsed" );
            if ( isCollapsed ) {
              noteBodySplitter.removeAttribute( "collapsed" );
              noteBodySplitter.setAttribute( "state", "open" );
            } else {
              noteBodySplitter.setAttribute( "state", "collapsed" );
              noteBodySplitter.setAttribute( "collapsed", "true" );
            }
            Common.goSetCommandAttribute( "znotes_bodyaddonspanel_command",
              "checked", !isCollapsed, currentWindow );
            Common.goSetCommandAttribute( "znotes_bodyaddonspanel_command",
              "checkState", !isCollapsed, currentWindow );
            break;
        }
      },
      onEvent: function( event ) {
      },
      getName: function() {
        return "BODY";
      },
      getCommand: function( cmd ) {
        if ( cmd in bodyCommands ) {
          return currentWindow.document.getElementById( cmd );
        }
        return null;
      },
      register: function() {
        try {
          currentWindow.controllers.insertControllerAt( 0, this );
          this.getId = function() {
            return currentWindow.controllers.getControllerId( this );
          };
        } catch ( e ) {
          Components.utils.reportError(
            "An error occurred registering '" + this.getName() + "' controller: " + e
          );
        }
      },
      unregister: function() {
        for ( var cmd in bodyCommands ) {
          Common.goSetCommandEnabled( cmd, false, currentWindow );
        }
        try {
          currentWindow.controllers.removeController( this );
        } catch ( e ) {
          Components.utils.reportError(
            "An error occurred unregistering '" + this.getName() + "' controller: " + e
          );
        }
      }
    };
    
    function updateCommands() {
      var id = bodyController.getId( currentWindow );
      Common.goUpdateCommand( "znotes_bodycustomizetoolbar_command", id, currentWindow );
      Common.goUpdateCommand( "znotes_bodytagsmenu_command", id, currentWindow );
      Common.goUpdateCommand( "znotes_bodytypesmenu_command", id, currentWindow );
      Common.goUpdateCommand( "znotes_bodyaddonspanel_command", id, currentWindow );
      Common.goUpdateCommand( "znotes_bodyrenamenote_command", id, currentWindow );
      Common.goUpdateCommand( "znotes_bodydeletenote_command", id, currentWindow );
      if ( currentNote && !currentNote.isLoading() ) {
        enableTagButtons();
      } else {
        disableTagButtons();
      }
    };
    
    // HELPERS

    function updateStyle( node, style ) {
      for ( var attr in style ) {
        node.setAttribute( attr, style[attr] );
      }
      var len = node.children.length;
      var child = null;
      for ( var i = 0; i < len; i++ ) {
        child = node.children[i];
        updateStyle( child, style );
      }
    };
    
    // PREFERENCES
    
    function connectMutationObservers() {
      mutationObservers = [];
      mutationObservers.push( connectMutationObserver(
        noteMainBox, "height", "noteMainBoxHeight" ) );
      mutationObservers.push( connectMutationObserver(
        noteBodySplitter, "state", "noteBodySplitterState" ) );
      mutationObservers.push( connectMutationObserver(
        noteAddonsBox, "height", "noteAddonsBoxHeight" ) );
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
                    bodyAddonsButton.checked = false;
                    noteBodySplitter.setAttribute( "collapsed", "true" );
                    currentNote.savePreference( "noteBodySplitterState",
                      "collapsed" );
                  } else {
                    bodyAddonsButton.checked = true;
                    noteBodySplitter.removeAttribute( "collapsed" );
                    currentNote.savePreference( "noteBodySplitterState",
                      "open" );
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
    
    function restoreCurrentNotePreferences() {
      noteMainBox.setAttribute( "height",
        currentNote.loadPreference( "noteMainBoxHeight", "700" ) );
      noteAddonsBox.setAttribute( "height",
        currentNote.loadPreference( "noteAddonsBoxHeight", "100" ) );
      var noteBodySplitterState = currentNote.loadPreference(
        "noteBodySplitterState",
        currentNote.hasAttachments() ? "open" : "collapsed"
      );
      if ( noteBodySplitterState == "collapsed" ) {
        bodyAddonsButton.checked = false;
        noteBodySplitter.setAttribute( "state", "collapsed" );
        noteBodySplitter.setAttribute( "collapsed", "true" );
      } else {
        bodyAddonsButton.checked = true;
        noteBodySplitter.removeAttribute( "collapsed" );
        noteBodySplitter.setAttribute( "state", "open" );
      }
    };

    // TAGS BAR & TAG MENU

    function refreshTagMenu( aMenu, aCmdTagMenuClear, aCmdTagMenuClick ) {
      while ( aMenu.firstChild ) {
        aMenu.removeChild( aMenu.firstChild );
      }
      var menuItem = currentWindow.document.createElement( "menuitem" );
      menuItem.className = "menuitem-iconic";
      menuItem.setAttribute( "label",
        Utils.STRINGS_BUNDLE.getString( "body.tagmenu.clearalltags" ) );
      menuItem.addEventListener( "command", aCmdTagMenuClear, false );
      aMenu.appendChild( menuItem );
      aMenu.appendChild( currentWindow.document.createElement( "menuseparator" ) );
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
        var menuItem = currentWindow.document.createElement( "menuitem" );
        var image = ru.akman.znotes.Utils.makeTagImage( color, false, 16 );
        menuItem.setAttribute( "class", "menuitem-iconic" );
        menuItem.setAttribute( "image", image );
        menuItem.setAttribute( "label", name );
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
      var len = bodyToolbar.children.length;
      var deletedButtons = [];
      for ( var i = 0; i < len; i++ ) {
        var toolBarButton = bodyToolbar.children[i];
        if ( toolBarButton.hasAttribute( "istag" ) &&
          toolBarButton.getAttribute( "istag" ) == "true" ) {
          deletedButtons.push( toolBarButton );
        }
      }
      for ( var i = 0; i < deletedButtons.length; i++ ) {
        bodyToolbar.removeChild( deletedButtons[i] );
      }
      if ( aNote != null ) {
        for ( var i = 0; i < tags.length; i++ ) {
          var tag = tags[i];
          if ( tag ) {
            var toolBarButton = currentWindow.document.createElement( "toolbarbutton" );
            toolBarButton.setAttribute( "istag", "true" );
            toolBarButton.setAttribute( "id", tag.getId() );
            toolBarButton.setAttribute( "class", "toolbarbutton-1" );
            toolBarButton.setAttribute( "pack", "start" );
            toolBarButton.setAttribute( "tooltiptext", tag.getName() );
            toolBarButton.setAttribute( "image",
              ru.akman.znotes.Utils.makeTagImage( tag.getColor(), true,
                ( currentStyle.iconsize == "small" ) ? 16 : 24 ) );
            toolBarButton.addEventListener( "command", aCmdTagButtonClick,
              false );
            bodyToolbar.insertBefore( toolBarButton, bodyToolbarSpacer );
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
          aMenuItem.setAttribute( "image",
            ru.akman.znotes.Utils.makeTagImage( color, true, 16 ) );
        } else {
          arr[0] = "0";
          aMenuItem.setAttribute( "value", arr.join(";") );
          aMenuItem.setAttribute( "image",
            ru.akman.znotes.Utils.makeTagImage( color, false, 16 ) );
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

    function onCmdTagButtonClick( event ) {
      var id = "" + event.target.id;
      currentNote.setMainTag( id );
    };

    function onCmdTagMenuClick( event ) {
      var id = "" + event.target.id;
      for ( var i = 2; i < bodyTagsMenu.children.length; i++ ) {
        var aMenuItem = bodyTagsMenu.children[i];
        var arr = aMenuItem.getAttribute("value").split(";");
        if ( arr[1] == id ) {
          arr[0] = ( arr[0] == "0" ) ? "1" : "0";
          aMenuItem.setAttribute( "value", arr.join(";") );
          aMenuItem.setAttribute( "image",
            ru.akman.znotes.Utils.makeTagImage( arr[2], arr[0] == "1", 16 ) );
          break;
        }
      }
      updateNoteTags( currentNote, bodyTagsMenu );
      return true;
    };
    
    function onCmdTagMenuClear() {
      currentNote.setTags( [] );
      return true;
    };
    
    function onBodyTagsMenuButtonMenuPopupShowing() {
      Common.goDoCommand( "znotes_bodytagsmenu_command", bodyTagsMenuButton );
      return false;
    };

    function disableTagButtons() {
      var buttons = bodyToolbar.childNodes;
      for ( var i = 0; i < buttons.length; i++ ) {
        if ( buttons[i].hasAttribute( "istag" ) &&
             buttons[i].getAttribute( "istag" ) == "true" ) {
          buttons[i].setAttribute( "disabled", "true" );
          buttons[i].setAttribute( "image",
            ru.akman.znotes.Utils.makeTagImage( "#C0C0C0", true,
              ( currentStyle.iconsize == "small" ) ? 16 : 24 ) );
        }
      }
    };
    
    function enableTagButtons() {
      if ( currentNote ) {
        updateTagsButtons( currentNote, onCmdTagButtonClick );
      }
    };

    // TYPES MENU

    function refreshTypeMenu( aMenu, aCmdTypeMenuClick ) {
      while ( aMenu.firstChild ) {
        aMenu.removeChild( aMenu.firstChild );
      }
      var aType, aNoteType = currentNote.getType();
      var menuItem, doc;
      var docs = ru.akman.znotes.DocumentManager.getInstance().getDocuments();
      for ( var name in docs ) {
        doc = docs[name];
        aType = doc.getType();
        menuItem = currentWindow.document.createElement( "menuitem" );
        menuItem.className = "menuitem-iconic";
        menuItem.setAttribute( "id", "bodytypes_menupopup_" + doc.getName() );
        menuItem.setAttribute( "tooltiptext", doc.getName() +
          "-" + doc.getVersion() + " : " + doc.getType() );
        menuItem.style.setProperty( "list-style-image",
          "url( '" + doc.getIconURL() + "' )" , "important" );
        if ( aNoteType === aType ) {
          menuItem.setAttribute( "label", "\u2713 " + doc.getDescription() );
        } else {
          menuItem.setAttribute( "label", "  " + doc.getDescription() );
          menuItem.addEventListener( "command", aCmdTypeMenuClick, false );
        }
        aMenu.appendChild( menuItem );
      }
    };

    function onCmdTypeMenuClick( event ) {
      var id = "" + event.target.id;
      if ( id.indexOf( "bodytypes_menupopup_" ) != 0 ) {
        return true;
      }
      var doc = ru.akman.znotes.DocumentManager
                               .getInstance()
                               .getDocumentByName(
        // document name starts from position 20 of id
        // bodytypes_menupopup_XXXXXXXXX
        // 012345678901234567890123
        id.substr( 20 )
      );
      if ( !doc ) {
        return true;
      }
      currentNote.setType( doc.getType() );
      return true;
    };
    
    function onBodyTypesMenuButtonMenuPopupShowing() {
      Common.goDoCommand( "znotes_bodytypesmenu_command", bodyTypesMenuButton );
      return false;
    };

    // SPLITTER

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
    
    // NOTE EVENTS
    
    function onNoteDeleted( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.deletedNote;
      if ( currentNote == aNote ) {
        currentNote = null;
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
      refreshTagMenu( bodyTagsMenu, onCmdTagMenuClear, onCmdTagMenuClick );
      updateTagMenu( aNote, bodyTagsMenu );
    };
    
    function onNoteTypeChanged( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.changedNote;
      var oldTags = e.data.oldValue;
      var newTags = e.data.newValue;
      if ( currentNote != aNote ) {
        return;
      }
      refreshTypeMenu( bodyTypesMenu, onCmdTypeMenuClick );
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
            bodyAddonsButton.checked = false;
            noteBodySplitter.setAttribute( "state", "collapsed" );
            noteBodySplitter.setAttribute( "collapsed", "true" );
          } else {
            bodyAddonsButton.checked = true;
            noteBodySplitter.removeAttribute( "collapsed" );
            noteBodySplitter.setAttribute( "state", "open" );
          }
          break;
      }
    };
    
    // TAG LIST EVENTS

    function onTagChanged( e ) {
      var aTag = e.data.changedTag;
      refreshTagMenu( bodyTagsMenu, onCmdTagMenuClear, onCmdTagMenuClick );
      if ( currentNote ) {
        updateTagsButtons( currentNote, onCmdTagButtonClick );
        updateTagMenu( currentNote, bodyTagsMenu );
      }
    };

    function onTagDeleted( e ) {
      var aTag = e.data.deletedTag;
      refreshTagMenu( bodyTagsMenu, onCmdTagMenuClear, onCmdTagMenuClick );
      if ( currentNote ) {
        updateTagsButtons( currentNote, onCmdTagButtonClick );
        updateTagMenu( currentNote, bodyTagsMenu );
      }
    };

    function onTagCreated( e ) {
      var aTag = e.data.createdTag;
      refreshTagMenu( bodyTagsMenu, onCmdTagMenuClear, onCmdTagMenuClick );
    };
    
    // V I E W
    
    function showCurrentView() {
      noteViewDeck.selectedIndex = 0; // or 1 or 2 or ...
      refreshTagMenu( bodyTagsMenu, onCmdTagMenuClear, onCmdTagMenuClick );
      updateTagMenu( currentNote, bodyTagsMenu );
      updateTagsButtons( currentNote, onCmdTagButtonClick );
      refreshTypeMenu( bodyTypesMenu, onCmdTypeMenuClick );
      noteBodySplitter.removeAttribute( "disabled" );
      noteBodyView.removeAttribute( "disabled" );
      restoreCurrentNotePreferences();
    };

    function hideCurrentView() {
      noteViewDeck.selectedIndex = 0; // only 0
      noteBodySplitter.setAttribute( "state", "collapsed" );
      noteBodySplitter.setAttribute( "collapsed", "true" );
      noteBodySplitter.setAttribute( "disabled", "true" );
      noteBodyView.setAttribute( "disabled", "true" );
    };
    
    // L I S T E N E R S

    function addEventListeners() {
      if ( !currentNote ) {
        return;
      }
      currentNote.addStateListener( noteStateListener );
      tagList = currentNote.getBook().getTagList();
      tagList.addStateListener( tagListStateListener );
      noteBodySplitter.addEventListener( "dblclick",
        onSplitterDblClick, false );
      connectMutationObservers();
    };
    
    function removeEventListeners() {
      if ( !currentNote ) {
        return;
      }
      disconnectMutationObservers();
      noteBodySplitter.removeEventListener( "dblclick",
        onSplitterDblClick, false );
      tagList.removeStateListener( tagListStateListener );
      currentNote.removeStateListener( noteStateListener );
    };
    
    // TOOLBAR
    
    function restoreToolbarCurrentSet() {
      var toolbar = currentToolbox.querySelector( "#znotes_bodytoolbar" );
      var currentset = toolbar.getAttribute( "defaultset" );
      if ( prefsBundle.hasPref( "bodyToolbarCurrentSet" ) ) {
        currentset = prefsBundle.getCharPref( "bodyToolbarCurrentSet" );
      }
      toolbar.setAttribute( "currentset", currentset );
      toolbar.currentSet = currentset;
      // if bodyTagsMenuButton is not in toolbar
      // then bodyTagsMenuButton == null
      // and bodyTagsMenuButtonMenuPopup == null
      bodyTagsMenuButton =
        currentWindow.document.getElementById( "znotes_bodytagsmenu_button" );
      bodyTagsMenuButtonMenuPopup =
        currentWindow.document.getElementById( "znotes_bodytagsmenu_menupopup" );
      if ( bodyTagsMenuButtonMenuPopup ) {
        bodyTagsMenuButtonMenuPopup.addEventListener(
          "popupshowing",
          onBodyTagsMenuButtonMenuPopupShowing,
          false
        );
      }
      enableTagButtons();
      // if bodyTypesMenuButton is not in toolbar
      // then bodyTypesMenuButton == null
      // and bodyTypesMenuButtonMenuPopup == null
      bodyTypesMenuButton =
        currentWindow.document.getElementById( "znotes_bodytypesmenu_button" );
      bodyTypesMenuButtonMenuPopup =
        currentWindow.document.getElementById( "znotes_bodytypesmenu_menupopup" );
      if ( bodyTypesMenuButtonMenuPopup ) {
        bodyTypesMenuButtonMenuPopup.addEventListener(
          "popupshowing",
          onBodyTypesMenuButtonMenuPopupShowing,
          false
        );
      }
    };
    
    function saveToolbarCurrentSet() {
      var toolbar = currentToolbox.querySelector( "#znotes_bodytoolbar" );
      var currentset = toolbar.currentSet;
      if ( currentset != "__empty" ) {
        currentset = currentset.substring(
          currentset.indexOf( "znotes_bodytoolbar_spacer" )
        );
        prefsBundle.setCharPref( "bodyToolbarCurrentSet", currentset );
      }
    };

    // OBSERVERS
    
    function notifyObservers( event ) {
      for ( var i = 0; i < observers.length; i++ ) {
        if ( observers[i][ "on" + event.type ] ) {
          observers[i][ "on" + event.type ]( event );
        }
      }
    };

    function addObserver( aObserver ) {
      if ( observers.indexOf( aObserver ) < 0 ) {
        observers.push( aObserver );
      }
    };
    
    function removeObserver( aObserver ) {
      var index = observers.indexOf( aObserver );
      if ( index < 0 ) {
        return;
      }
      observers.splice( index, 1 );
    };
    
    // PUBLIC
    
    this.updateStyle = function( style ) {
      if ( !Utils.cloneObject( style, currentStyle ) ) {
        return;
      }
      updateStyle( currentToolbox, style );
      enableTagButtons();
      notifyObservers(
        new ru.akman.znotes.core.Event(
          "StyleChanged",
          {
            style: style,
          }
        )
      );
    };
    
    this.show = function( aNote, aForced ) {
      if ( currentNote && currentNote == aNote && !aForced ) {
        return;
      }
      removeEventListeners();
      currentNote = aNote;
      if ( currentNote && currentNote.isExists() ) {
        addEventListeners();
        showCurrentView();
      } else {
        hideCurrentView();
      }
      updateCommands();
      notifyObservers(
        new ru.akman.znotes.core.Event(
          "NoteChanged",
          {
            note: aNote,
            forced: aForced,
          }
        )
      );
    };

    this.release = function() {
      notifyObservers(
        new ru.akman.znotes.core.Event(
          "Release",
          {}
        )
      );
      removeEventListeners();
      prefsBundle.removeObserver( prefObserver );
      bodyController.unregister();
    };
    
    // CONSTRUCTOR

    if ( anArguments.window ) {
      currentWindow = anArguments.window;
    }
    if ( anArguments.name ) {
      currentName = anArguments.name;
    }
    currentMode = "viewer";
    if ( anArguments.mode && anArguments.mode == "editor" ) {
      currentMode = anArguments.mode;
    }
    currentStyle = {
      iconsize: "small"
    }
    if ( anArguments.style ) {
      Utils.cloneObject( anArguments.style, currentStyle );
    }
    if ( anArguments.toolbox ) {
      currentToolbox = anArguments.toolbox;
    }
    noteBodyView = currentWindow.document.getElementById( "noteBodyView" );
    noteMainBox = currentWindow.document.getElementById( "noteMainBox" );
    noteViewDeck = currentWindow.document.getElementById( "noteViewDeck" );
    noteBodySplitter = currentWindow.document.getElementById( "noteBodySplitter" );
    noteAddonsBox = currentWindow.document.getElementById( "noteAddonsBox" );
    //
    bodyAddonsButton = currentWindow.document.getElementById( "znotes_bodyaddonspanel_button" );
    bodyTagsMenu = currentWindow.document.getElementById( "znotes_bodytags_menupopup" );
    bodyTypesMenu = currentWindow.document.getElementById( "znotes_bodytypes_menupopup" );
    bodyToolbox = currentWindow.document.getElementById( "znotes_bodytoolbox" );
    bodyToolboxPalette = bodyToolbox.palette;
    bodyToolbar = currentWindow.document.getElementById( "znotes_bodytoolbar" );
    bodyToolbarSpacer = currentWindow.document.getElementById( "znotes_bodytoolbar_spacer" );
    if ( currentToolbox ) {
      bodyToolbar.classList.remove( "znotes_bodytoolbar" );
      bodyToolbar.classList.add( "znotes_viewertoolbar" );
      while ( currentToolbox.firstChild ) {
        currentToolbox.removeChild( currentToolbox.firstChild );
      }
      while ( bodyToolbox.firstChild ) {
        currentToolbox.appendChild( bodyToolbox.firstChild )
      }
      currentToolbox.palette = bodyToolboxPalette;
      bodyToolbox.setAttribute( "collapsed", "true" );
    } else {
      currentToolbox = bodyToolbox;
    }
    currentToolbox.customizeDone = function( isChanged ) {
      self.updateStyle(
        {
          iconsize: currentToolbox.querySelector( "#znotes_bodytoolbar" )
                                  .getAttribute( "iconsize" )
        }
      );
      saveToolbarCurrentSet();
    };
    restoreToolbarCurrentSet();
    updateStyle( currentToolbox, currentStyle );
    //
    prefsBundle.addObserver( prefObserver );
    bodyController.register();
    noteStateListener = {
      name: "BODY",
      onNoteDeleted: onNoteDeleted,
      onNoteTagsChanged: onNoteTagsChanged,
      onNoteTypeChanged: onNoteTypeChanged,
      onNoteMainTagChanged: onNoteMainTagChanged,
      onNotePrefChanged: onNotePrefChanged
    };
    tagListStateListener = {
      onTagCreated: onTagCreated,
      onTagChanged: onTagChanged,
      onTagDeleted: onTagDeleted,
    };
    //
    addObserver( new ru.akman.znotes.Attachments( currentWindow, currentStyle ) );
    addObserver( new ru.akman.znotes.Content( currentWindow, currentStyle ) );
    addObserver( new ru.akman.znotes.Relator( currentWindow, currentStyle ) );
    addObserver( new ru.akman.znotes.Editor( currentWindow, currentMode, currentStyle ) );
  };

}();
