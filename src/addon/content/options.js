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

var Cc = Components.classes;
var Ci = Components.interfaces;
var Cr = Components.results;
var Cu = Components.utils;

if ( !ru ) var ru = {};
if ( !ru.akman ) ru.akman = {};
if ( !ru.akman.znotes ) ru.akman.znotes = {};

Cu.import( "resource://znotes/utils.js", ru.akman.znotes );
Cu.import( "resource://znotes/prefsmanager.js", ru.akman.znotes );
Cu.import( "resource://znotes/documentmanager.js", ru.akman.znotes );

ru.akman.znotes.Options = function() {

  var Utils = ru.akman.znotes.Utils;
  var log = Utils.getLogger( "content.options" );

  var DocumentManager = ru.akman.znotes.DocumentManager;
  var prefsBundle = ru.akman.znotes.PrefsManager.getInstance();

  var pub = {};

  var currentWindow = null;
  var optionsTabs = null;
  var optionsPanels = null;
  var optionsPrefs = {};
  var platformPrefs = null;
  var currentOptions = null;
  var isOptionsChanged = false;

  var placeName = null;
  var isSavePosition = null;
  var isEditSourceEnabled = null;
  var isPlaySound = null;
  var isClearBinOnExit = null;
  var isHighlightRow = null;
  var isCloseBrowserAfterImport = null;
  var isReplaceBackground = null;
  var isConfirmExit = null;
  var isExitQuitTB = null;
  var isClipperPlaySound = null;
  
  var clipperSaveScripts = null;
  var clipperSaveFrames = null;
  var clipperSeparateFrames = null;
  var clipperPreserveHTML5Tags = null;
  var clipperSaveInlineResources = null;
  var clipperSaveStyles = null;
  var clipperInlineStylesheets = null;
  var clipperSaveActiveRulesOnly = null;

  var docTypeMenuList = null;
  var docTypeMenuPopup = null;
  var keysPlatformGroupBox = null;
  var keysPlatformListBox = null;
  var keysListBox = null;
  var acceptButton = null;
  var cancelButton = null;
  var defaultsButton = null;
  var defaultDocumentType = null;

  var platformAssignedKeys = null;
  var platformKeyset = null;
  var platformShortcuts = {};
  var mainKeyset = null;
  var mainShortcuts = {};

  // HELPERS

  function getString( name ) {
    return Utils.STRINGS_BUNDLE.getString( name );
  };

  function fetchPlatformAssignedKeys() {
    platformAssignedKeys = {};
    var keysets = Utils.MAIN_WINDOW.document.getElementsByTagName( "keyset" );
    var process = function( keyset ) {
      var shortcut, key, keycode, modifiers;
      var node = keyset.firstChild;
      while ( node ) {
        if ( node.nodeName == "keyset" ) {
          process( node );
          node = node.nextSibling;
          continue;
        }
        if ( node.nodeName != "key" ) {
          node = node.nextSibling;
          continue;
        }
        if ( node.hasAttribute( "id" ) &&
             node.getAttribute( "id" ).indexOf( "znotes_" ) == 0 ) {
          node = node.nextSibling;
          continue;
        }
        key = node.hasAttribute( "key" ) ?
          node.getAttribute( "key" ).trim() : "";
        keycode = node.hasAttribute( "keycode" ) ?
          node.getAttribute( "keycode" ).trim() : "";
        modifiers = node.hasAttribute( "modifiers" ) ?
          node.getAttribute( "modifiers" ).trim() : "";
        if ( !key.length && !keycode.length ) {
          node = node.nextSibling;
          continue;
        }
        // extend key with "any" in modifiers attribute to proper keys
        var m = ( modifiers == "" ) ?
          [] : modifiers.split( /\s*,\s*|\s+/ );
        modifiers = [];
        for ( var i = 0; i < m.length; i++ ) {
          if ( m[i].trim().length ) {
            modifiers.push( m[i].toLowerCase() );
          }
        }
        m = [ [] ];
        var i = modifiers.indexOf( "any" );
        if ( i >= 0 ) {
          m = modifiers.slice( 0, i );
          modifiers = modifiers.slice( i + 1 );
          if ( !m.length ) {
            m = [ [] ];
          } else {
            m = Utils.getPermutations( m );
          }
        }
        for ( var j = 0; j < m.length; j++ ) {
          shortcut = Utils.getShortcutFromAttributes(
            key, keycode, m[j].concat( modifiers ).join( "," ) );
          if ( shortcut ) {
            platformAssignedKeys[ shortcut ] = null;
          }
        }
        //
        node = node.nextSibling;
      }
    };
    for ( var i = 0; i < keysets.length; i++ ) {
      process( keysets[i] );
    }
  };

  function clearContainers( containers ) {
    var id, node;
    for ( var i = 0; i < containers.length; i++ ) {
      id = containers[i];
      node = document.getElementById( id );
      while ( node && node.firstChild ) {
        node.removeChild( node.firstChild );
      }
    }
  };

  function isShortcutChanged( shortcuts, name ) {
    var value = ( shortcuts[name]["original"] === null ) ?
      shortcuts[name]["default"] : shortcuts[name]["original"];
    return shortcuts[name]["current"] !== value;
  };

  function getTabShortcuts( defaultShortcuts, currentShortcuts ) {
    var name, result = {};
    for ( var id in defaultShortcuts ) {
      name = Utils.getNameFromId( id );
      if ( name in currentShortcuts ) {
        result[name] = currentShortcuts[name];
      } else {
        result[name] = Utils.getShortcutFromAttributes(
          defaultShortcuts[id].key,
          defaultShortcuts[id].keycode,
          defaultShortcuts[id].modifiers
        );
      }
    }
    return result;
  };

  function getPlatformShortcuts() {
    var name, result = {};
    for ( var name in platformShortcuts ) {
      result[name] = platformShortcuts[name]["current"];
    }
    return result;
  };

  function getMainShortcuts() {
    var name, result = {};
    for ( var name in mainShortcuts ) {
      result[name] = mainShortcuts[name]["current"];
    }
    return result;
  };

  /**
   * Check existence of shortcut in platform
   * @param shortcut - string representing shortcut, ex: "Alt+Ctrl+Z"
   * @return boolean
   */
  function checkPlatformShortcut( shortcut ) {
    return shortcut in platformAssignedKeys;
  };

  function checkShortcut( shortcuts, name, shortcut ) {
    for ( var n in shortcuts ) {
      if ( n != name && shortcuts[n] === shortcut ) {
        return true;
      }
    }
    return false;
  };

  function isPlatformShortcutExists( name, shortcut ) {
    var shortcuts = getPlatformShortcuts();
    if ( checkShortcut( shortcuts, name, shortcut ) ) {
      return 1;
    }
    if ( checkPlatformShortcut( shortcut ) ) {
      return 2;
    }
    return 0;
  };

  function isShortcutExists( name, shortcut ) {
    var shortcuts;
    for ( var tab in optionsPrefs ) {
      if ( tab == "main" ) {
        shortcuts = getMainShortcuts();
        if ( checkShortcut( shortcuts, name, shortcut ) ) {
          return 2;
        }
      } else {
        shortcuts = getTabShortcuts(
          optionsPrefs[tab]["default"].editor.shortcuts,
          optionsPrefs[tab]["current"].editor.shortcuts
        );
        var cs = checkShortcut( shortcuts, name, shortcut );
        if ( cs ) {
          return 3;
        }
      }
    }
    return 0;
  };

  /**
   * existsFlag == 0 shortcut does not exist yet
   * existsFlag == 1 shortcut exists in current shrortcuts
   * existsFlag == 2 shortcut exists in main shortcuts
   * existsFlag == 3 shortcut exists in other shortcuts
   */
  function alertTextbox( shortcuts, textbox, message, value, existsFlag ) {
    var win = textbox.ownerDocument.defaultView;
    var flag = ( existsFlag === undefined ) ? 1 : existsFlag;
    if ( flag == 1 ) {
      textbox.inputField.style.setProperty( "background-color", "red" );
    } else if ( flag == 2 ) {
      textbox.inputField.style.setProperty( "background-color", "magenta" );
    } else if ( flag == 3 ) {
      textbox.inputField.style.setProperty( "background-color", "tomato" );
    }
    textbox.style.setProperty( "font-style", "italic" );
    textbox.style.removeProperty( "color" );
    textbox.style.removeProperty( "font-weight" );
    textbox.value = message;
    Utils.beep();
    win.setTimeout(
      function () {
        textbox.value = value;
        updateTextboxStyle( shortcuts, textbox );
      },
      1200
    );
  };

  function updateTextboxStyle( shortcuts, textbox ) {
    var name = Utils.getNameFromId( textbox.getAttribute( "id" ) );
    textbox.inputField.style.setProperty( "letter-spacing", "1px" );
    textbox.inputField.style.removeProperty( "background-color" );
    if ( isShortcutChanged( shortcuts, name ) ) {
      textbox.style.setProperty( "color", "red" );
    } else {
      textbox.style.removeProperty( "color" );
    }
    if ( textbox.value !== "" ) {
      textbox.style.removeProperty( "font-style" );
      textbox.style.setProperty( "font-weight", "bold" );
    } else {
      textbox.style.setProperty( "font-style", "italic" );
      textbox.style.removeProperty( "font-weight" );
    }
  };

  // SHORTCUTS

  function loadShortcuts( keyset, shortcuts, origPrefs, currPrefs ) {
    var doc = keyset.ownerDocument;
    var originalShortcuts = ( "shortcuts" in origPrefs ) ?
      origPrefs.shortcuts : {};
    var currentShortcuts = ( "shortcuts" in currPrefs ) ?
      currPrefs.shortcuts : {};
    var node = keyset.firstChild;
    var name, command;
    for ( name in shortcuts ) {
      delete shortcuts[name];
    }
    while ( node ) {
      if ( node.nodeName != "key" || !node.hasAttribute( "command" ) ||
           !node.hasAttribute( "id" ) ) {
        node = node.nextSibling;
        continue;
      }
      name = Utils.getNameFromId( node.getAttribute( "id" ) );
      if ( !name ) {
        node = node.nextSibling;
        continue;
      }
      command = node.getAttribute( "command" );
      if ( !doc.getElementById( command ) ) {
        node = node.nextSibling;
        continue;
      }
      shortcuts[name] = {
        "command": command,
        "default": Utils.getShortcutFromAttributes(
          node.getAttribute( "key" ),
          node.getAttribute( "keycode" ),
          node.getAttribute( "modifiers" )
        ),
        "original": null,
        "current": null
      };
      if ( name in currentShortcuts ) {
        shortcuts[name]["current"] = currentShortcuts[name];
      } else {
        shortcuts[name]["current"] = shortcuts[name]["default"];
      }
      if ( name in originalShortcuts ) {
        shortcuts[name]["original"] = originalShortcuts[name];
      } else {
        shortcuts[name]["original"] = null;
      }
      node = node.nextSibling;
    }
  };

  // VIEW

  function createItem( doc, shortcuts, name, suffix ) {
    var cmd = doc.getElementById(
      shortcuts[name].command );
    var tooltiptext = cmd.getAttribute( "tooltiptext" );
    var item = doc.createElement( "richlistitem" );
    item.setAttribute( "id", "znotes_" + name + "_richlistitem" + suffix );
    item.setAttribute( "class", "key_item" );
    item.setAttribute( "tooltiptext", tooltiptext );
    var hbox = doc.createElement( "hbox" );
    hbox.setAttribute( "id", "znotes_" + name + "_hbox" + suffix );
    hbox.setAttribute( "class", "key_hbox" );
    hbox.setAttribute( "flex", "1" );
    var image = doc.createElement( "image" );
    image.setAttribute( "id", "znotes_" + name + "_image" + suffix );
    image.setAttribute( "class", "znotes_" + name + "_class key_image" );
    hbox.appendChild( image );
    var label = doc.createElement( "label" );
    label.setAttribute( "id", "znotes_" + name + "_label" + suffix );
    label.setAttribute( "class", "key_label" );
    label.setAttribute( "flex", "1" );
    label.setAttribute( "crop", "center" );
    label.setAttribute( "value", tooltiptext );
    hbox.appendChild( label );
    var textbox = doc.createElement( "textbox" );
    textbox.setAttribute( "id", "znotes_" + name + "_textbox" + suffix );
    textbox.setAttribute( "minwidth", "200" );
    textbox.setAttribute( "value", shortcuts[name]["current"] );
    if ( shortcuts[name]["current"] !== "" ) {
      textbox.style.setProperty( "font-weight", "bold" );
    }
    textbox.setAttribute( "placeholder",
      getString( "options.key.notassigned" ) );
    textbox.setAttribute( "class", "key_textbox" );
    textbox.setAttribute( "tooltiptext",
      getString( "options.key.pressakey" ) );
    hbox.appendChild( textbox );
    var bDefault = doc.createElement( "toolbarbutton" );
    bDefault.setAttribute( "id",
      "znotes_" + name + "_toolbarbutton1" + suffix );
    bDefault.setAttribute( "class", "key_default" );
    bDefault.setAttribute( "tooltiptext", getString( "options.key.default" ) );
    hbox.appendChild( bDefault );
    var bClear = doc.createElement( "toolbarbutton" );
    bClear.setAttribute( "id", "znotes_" + name + "_toolbarbutton2" + suffix );
    bClear.setAttribute( "class", "key_clear" );
    bClear.setAttribute( "tooltiptext", getString( "options.key.clear" ) );
    hbox.appendChild( bClear );
    item.appendChild( hbox );
    textbox.addEventListener( "keypress", onKeyPress, true );
    bDefault.addEventListener( "command", onDefaultPress, false );
    bClear.addEventListener( "command", onClearPress, false );
    return {
      item: item,
      textbox: textbox
    };
  };

  function populateShortcutsListBox( shortcuts, listbox, appendix ) {
    var suffix = ( appendix === undefined ) ? "" : appendix;
    var doc = listbox.ownerDocument;
    while ( listbox.firstChild ) {
      listbox.removeChild( listbox.firstChild );
    }
    var item, cmd;
    for ( var name in shortcuts ) {
      cmd = doc.getElementById( shortcuts[name].command );
      item = createItem( doc, shortcuts, name, suffix );
      listbox.appendChild( item.item );
      updateTextboxStyle( shortcuts, item.textbox );
    }
  };

  function populateDocumentTypePopup() {
    var docs = DocumentManager.getInstance().getDocuments();
    var doc, types, contentType, tooltiptext, menuItem, style;
    docTypeMenuList.selectedItem = null;
    while ( docTypeMenuPopup.firstChild ) {
      docTypeMenuPopup.removeChild( docTypeMenuPopup.firstChild );
    }
    for ( var name in docs ) {
      doc = docs[ name ];
      types = doc.getTypes();
      for ( var i = 0; i < types.length; i++ ) {
        contentType = types[i];
        tooltiptext = contentType;
        menuItem = document.createElement( "menuitem" );
        menuItem.className = "menuitem-iconic";
        menuItem.setAttribute( "id", "menuitem_" + doc.getName() + "_" + i );
        menuItem.setAttribute( "label", doc.getDescription() );
        menuItem.setAttribute( "tooltiptext", tooltiptext );
        menuItem.setAttribute( "image", doc.getIconURL() );
        menuItem.setAttribute( "value", contentType );
        menuItem.addEventListener( "command", onDocTypeSelect, false );
        style = menuItem.style;
        // BUG: DOES NOT WORK!
        // style.setProperty( "list-style-image", "url( '" + doc.getIconURL() + "' )" , "important" );
        style.setProperty( "background-image", "url( '" + doc.getIconURL() + "' )" );
        style.setProperty( "background-repeat", "no-repeat" );
        style.setProperty( "background-position", "0 50%" );
        style.setProperty( "padding-left", "20px" );
        docTypeMenuPopup.appendChild( menuItem );
        if ( contentType == defaultDocumentType ) {
          docTypeMenuList.selectedItem = menuItem;
          docTypeMenuList.setAttribute( "tooltiptext", tooltiptext );
        }
      }
    }
  };

  // EVENTS

  function onKeyPress( event ) {
    var id = event.target.getAttribute( "id" );
    var name = Utils.getNameFromId( id );
    var doc = event.target.ownerDocument;
    var textbox = doc.getElementById(
      "znotes_" + name + "_textbox" );
    var shortcut = Utils.getShortcutFromEvent( event );
    var listbox = doc.getElementById(
      "znotes_" + name + "_richlistitem" ).parentNode;
    var shortcuts, existsFlag;
    if ( listbox == keysPlatformListBox ) {
      shortcuts = platformShortcuts;
      existsFlag = isPlatformShortcutExists( name, shortcut );
    } else {
      shortcuts = mainShortcuts;
      existsFlag = isShortcutExists( name, shortcut );
    }
    if ( existsFlag ) {
      alertTextbox(
        shortcuts,
        textbox,
        getString( "options.key.duplicated" ),
        shortcuts[name]["current"],
        existsFlag
      );
    } else {
      textbox.value = shortcut;
      shortcuts[name]["current"] = shortcut;
      updateTextboxStyle( shortcuts, textbox );
    }
    event.preventDefault();
    event.stopPropagation();
    return false;
  };

  function onClearPress( event ) {
    var id = event.target.getAttribute( "id" );
    var name = Utils.getNameFromId( id );
    var doc = event.target.ownerDocument;
    var textbox = doc.getElementById(
      "znotes_" + name + "_textbox" );
    textbox.value = "";
    var listbox = doc.getElementById(
      "znotes_" + name + "_richlistitem" ).parentNode;
    var shortcuts = ( listbox == keysPlatformListBox ) ?
      platformShortcuts : mainShortcuts;
    shortcuts[name]["current"] = "";
    updateTextboxStyle( shortcuts, textbox );
  };

  function onDefaultPress( event ) {
    var id = event.target.getAttribute( "id" );
    var name = Utils.getNameFromId( id );
    var doc = event.target.ownerDocument;
    var textbox = doc.getElementById(
      "znotes_" + name + "_textbox" );
    var listbox = doc.getElementById(
      "znotes_" + name + "_richlistitem" ).parentNode;
    var shortcuts = ( listbox == keysPlatformListBox ) ?
      platformShortcuts : mainShortcuts;
    textbox.value = shortcuts[name]["default"];
    shortcuts[name]["current"] = shortcuts[name]["default"];
    updateTextboxStyle( shortcuts, textbox );
  };

  function onAccept( event ) {
    if ( currentOptions ) {
      currentOptions.close();
    }
    closeMainTab();
    saveAllPreferences();
    window.removeEventListener( "close", ru.akman.znotes.Options.onClose, true );
    window.close();
  };

  function onCancel( event ) {
    window.removeEventListener( "close", ru.akman.znotes.Options.onClose, true );
    window.close();
  };

  function confirmSave() {
    var params = {
      input: {
        kind: 2,
        title: getString( "options.confirm.exit.title" ),
        message1: getString( "options.confirm.exit.message1" ),
        message2: getString( "options.confirm.exit.message2" )
      },
      output: null
    };
    window.openDialog(
      "chrome://znotes/content/confirmdialog.xul",
      "",
      "chrome,dialog,modal,centerscreen,resizable=no",
      params
    ).focus();
    if ( params.output ) {
      return ( params.output.result ? 1 : 0 );
    }
    return -1;
  };

  function onDefaults( event ) {
    if ( currentOptions ) {
      currentOptions.defaults( event );
      return;
    }
    placeName.value = optionsPrefs["main"]["default"].placeName;
    isSavePosition.checked = optionsPrefs["main"]["default"].isSavePosition;
    isEditSourceEnabled.checked = optionsPrefs["main"]["default"].isEditSourceEnabled;
    isPlaySound.checked = optionsPrefs["main"]["default"].isPlaySound;
    isClearBinOnExit.checked = optionsPrefs["main"]["default"].isClearBinOnExit;
    isReplaceBackground.checked = optionsPrefs["main"]["default"].isReplaceBackground;
    isConfirmExit.checked = optionsPrefs["main"]["default"].isConfirmExit;
    isExitQuitTB.checked = optionsPrefs["main"]["default"].isExitQuitTB;
    isHighlightRow.checked = optionsPrefs["main"]["default"].isHighlightRow;
    isCloseBrowserAfterImport.checked = optionsPrefs["main"]["default"].isCloseBrowserAfterImport;
    isClipperPlaySound.checked = optionsPrefs["main"]["default"].isClipperPlaySound;
    
    clipperSaveScripts.checked = optionsPrefs["main"]["default"].clipperSaveScripts;
    clipperSaveFrames.checked = optionsPrefs["main"]["default"].clipperSaveFrames;
    clipperSeparateFrames.checked = optionsPrefs["main"]["default"].clipperSeparateFrames;
    clipperPreserveHTML5Tags.checked = optionsPrefs["main"]["default"].clipperPreserveHTML5Tags;
    clipperSaveInlineResources.checked = optionsPrefs["main"]["default"].clipperSaveInlineResources;
    clipperSaveStyles.checked = optionsPrefs["main"]["default"].clipperSaveStyles;
    clipperInlineStylesheets.checked = optionsPrefs["main"]["default"].clipperInlineStylesheets;
    clipperSaveActiveRulesOnly.checked = optionsPrefs["main"]["default"].clipperSaveActiveRulesOnly;
    
    onSaveStylesChanged();
    defaultDocumentType = optionsPrefs["main"]["default"].defaultDocumentType;
    populateDocumentTypePopup();
    var doc = event.target.ownerDocument;
    var textbox;
    for ( var name in platformShortcuts ) {
      textbox = doc.getElementById(
        "znotes_" + name + "_textbox" );
      platformShortcuts[name]["current"] = platformShortcuts[name]["default"];
      textbox.value = platformShortcuts[name]["default"];
      updateTextboxStyle( platformShortcuts, textbox );
    }
    for ( var name in mainShortcuts ) {
      textbox = doc.getElementById(
        "znotes_" + name + "_textbox" );
      mainShortcuts[name]["current"] = mainShortcuts[name]["default"];
      textbox.value = mainShortcuts[name]["default"];
      updateTextboxStyle( mainShortcuts, textbox );
    }
  };

  function onSaveStylesChanged( event ) {
    if ( clipperSaveStyles.checked ) {
      clipperInlineStylesheets.removeAttribute( "disabled" );
      clipperSaveActiveRulesOnly.removeAttribute( "disabled" );
    } else {
      clipperInlineStylesheets.setAttribute( "disabled", "true" );
      clipperSaveActiveRulesOnly.setAttribute( "disabled", "true" );
    }
  };

  function onDocTypeSelect( event ) {
    defaultDocumentType = event.target.getAttribute( "value" );
  };

  function onTabSelect( event ) {
    if ( currentOptions ) {
      currentOptions.close();
    } else {
      closeMainTab();
    }
    var id = optionsTabs.selectedItem.getAttribute( "id" );
    var name = id.substr( 4 );
    if ( name === "main" || name === "mainshortcuts" ) {
      currentOptions = null;
      openMainTab();
      return;
    }
    // clear
    clearContainers(
      [
        "znotes_editor_commandset",
        "znotes_editor_keyset",
        "znotes_editor_popupset",
        "znotes_editor_stringbundleset"
      ]
    );
    var optionsView = document.getElementById( "optionsView" );
    if ( optionsView ) {
      optionsView.parentNode.removeChild( optionsView );
    }
    // load
    var panel = document.getElementById( "panel-" + name );
    optionsView = document.createElement( "vbox" );
    optionsView.setAttribute( "id", "optionsView" );
    optionsView.setAttribute( "flex", "1" );
    panel.appendChild( optionsView );
    var doc = DocumentManager.getInstance().getDocumentByName( name );
    currentOptions = doc.getOptions();
    document.loadOverlay(
      doc.getURL() + "editor.xul",
      {
        observe: function( subject, topic, data ) {
          if ( topic == "xul-overlay-merged" ) {
            currentOptions.open( window, document, optionsPrefs );
          }
        }
      }
    );
  };

  // PREFERENCES

  function updateShortcutPreferences( currPrefs, shortcuts ) {
    var shortcut;
    var result = {};
    var isChanged = false;
    for ( var name in shortcuts ) {
      shortcut = shortcuts[name]["current"];
      shortcut = ( shortcuts[name]["default"] === shortcut ) ?
        null : shortcut;
      if ( shortcut !== shortcuts[name]["original"] ) {
        shortcuts[name]["original"] = shortcut;
        isChanged = true;
      }
      if ( shortcut !== null ) {
        result[name] = shortcut;
      }
    }
    currPrefs.shortcuts = result;
    return isChanged;
  };

  function updateMainPreferences( currentPrefs, originalPrefs ) {
    var isChanged = false;
    currentPrefs.defaultDocumentType = defaultDocumentType;
    isChanged = isChanged ||
      ( currentPrefs.defaultDocumentType !== originalPrefs.defaultDocumentType );
    currentPrefs.placeName = placeName.value;
    isChanged = isChanged ||
      ( currentPrefs.placeName !== originalPrefs.placeName );
    currentPrefs.isSavePosition = isSavePosition.checked;
    isChanged = isChanged ||
      ( currentPrefs.isSavePosition !== originalPrefs.isSavePosition );
    currentPrefs.isEditSourceEnabled = isEditSourceEnabled.checked;
    isChanged = isChanged ||
      ( currentPrefs.isEditSourceEnabled !== originalPrefs.isEditSourceEnabled );
    currentPrefs.isPlaySound = isPlaySound.checked;
    isChanged = isChanged ||
      ( currentPrefs.isPlaySound !== originalPrefs.isPlaySound );
    currentPrefs.isClearBinOnExit = isClearBinOnExit.checked;
    isChanged = isChanged ||
      ( currentPrefs.isClearBinOnExit !== originalPrefs.isClearBinOnExit );
    currentPrefs.isReplaceBackground = isReplaceBackground.checked;
    isChanged = isChanged ||
      ( currentPrefs.isReplaceBackground !== originalPrefs.isReplaceBackground );
    currentPrefs.isConfirmExit = isConfirmExit.checked;
    isChanged = isChanged ||
      ( currentPrefs.isConfirmExit !== originalPrefs.isConfirmExit );
    currentPrefs.isExitQuitTB = isExitQuitTB.checked;
    isChanged = isChanged ||
      ( currentPrefs.isExitQuitTB !== originalPrefs.isExitQuitTB );
    currentPrefs.isHighlightRow = isHighlightRow.checked;
    isChanged = isChanged ||
      ( currentPrefs.isHighlightRow !== originalPrefs.isHighlightRow );
    currentPrefs.isCloseBrowserAfterImport = isCloseBrowserAfterImport.checked;
    isChanged = isChanged ||
      ( currentPrefs.isCloseBrowserAfterImport !== originalPrefs.isCloseBrowserAfterImport );
    currentPrefs.isClipperPlaySound = isClipperPlaySound.checked;
    isChanged = isChanged ||
      ( currentPrefs.isClipperPlaySound !== originalPrefs.isClipperPlaySound );
    currentPrefs.clipperSaveScripts = clipperSaveScripts.checked;
    isChanged = isChanged ||
      ( currentPrefs.clipperSaveScripts !== originalPrefs.clipperSaveScripts );
    currentPrefs.clipperSaveFrames = clipperSaveFrames.checked;
    isChanged = isChanged ||
      ( currentPrefs.clipperSaveFrames !== originalPrefs.clipperSaveFrames );
    currentPrefs.clipperSeparateFrames = clipperSeparateFrames.checked;
    isChanged = isChanged ||
      ( currentPrefs.clipperSeparateFrames !== originalPrefs.clipperSeparateFrames );
    currentPrefs.clipperPreserveHTML5Tags = clipperPreserveHTML5Tags.checked;
    isChanged = isChanged ||
      ( currentPrefs.clipperPreserveHTML5Tags !== originalPrefs.clipperPreserveHTML5Tags );
    currentPrefs.clipperSaveInlineResources = clipperSaveInlineResources.checked;
    isChanged = isChanged ||
      ( currentPrefs.clipperSaveInlineResources !== originalPrefs.clipperSaveInlineResources );
    currentPrefs.clipperSaveStyles = clipperSaveStyles.checked;
    isChanged = isChanged ||
      ( currentPrefs.clipperSaveStyles !== originalPrefs.clipperSaveStyles );
    currentPrefs.clipperInlineStylesheets = clipperInlineStylesheets.checked;
    isChanged = isChanged ||
      ( currentPrefs.clipperInlineStylesheets !== originalPrefs.clipperInlineStylesheets );
    currentPrefs.clipperSaveActiveRulesOnly = clipperSaveActiveRulesOnly.checked;
    isChanged = isChanged ||
      ( currentPrefs.clipperSaveActiveRulesOnly !== originalPrefs.clipperSaveActiveRulesOnly );
    return isChanged;
  };

  function getPlatformDefaultPreferences() {
    var result = {};
    result.shortcuts = {};
    var id, name, command, count = 0;
    var node = platformKeyset.firstChild;
    while ( node ) {
      if ( node.nodeName != "key" || !node.hasAttribute( "command" ) ||
           !node.hasAttribute( "id" ) ) {
        node = node.nextSibling;
        continue;
      }
      var id = node.getAttribute( "id" );
      name = Utils.getNameFromId( id );
      if ( !name ) {
        node = node.nextSibling;
        continue;
      }
      command = node.getAttribute( "command" );
      if ( !document.getElementById( command ) ) {
        node = node.nextSibling;
        continue;
      }
      result.shortcuts[id] = {
        "command": command,
        "key": node.getAttribute( "key" ),
        "keycode": node.getAttribute( "keycode" ),
        "modifiers": node.getAttribute( "modifiers" )
      };
      count++;
      node = node.nextSibling;
    }
    if ( count ) {
      keysPlatformGroupBox.removeAttribute( "hidden" );
    }
    return result;
  };

  function getPlatformPreferences() {
    var result = {};
    try {
      result.shortcuts = JSON.parse( Utils.PLATFORM_SHORTCUTS );
      if ( typeof( result.shortcuts ) !== "object" ) {
        result.shortcuts = {};
      }
    } catch ( e ) {
      log.warn( e + "\n" + Utils.dumpStack() );
      result.shortcuts = {};
    }
    return result;
  };

  function setPlatformPreferences( prefs ) {
    prefsBundle.setCharPref( "platform_shortcuts",
      JSON.stringify( prefs.shortcuts, null, 2 ) );
  };

  function getMainDefaultPreferences() {
    var result = {
      "placeName": "",
      "defaultDocumentType": "application/xhtml+xml",
      "isSavePosition": true,
      "isEditSourceEnabled": true,
      "isPlaySound": true,
      "isClearBinOnExit": false,
      "isReplaceBackground": true,
      "isConfirmExit": true,
      "isExitQuitTB": true,
      "isHighlightRow": false,
      "isCloseBrowserAfterImport": true,
      "isClipperPlaySound": true,
      "clipperSaveScripts": false,
      "clipperSaveFrames": false,
      "clipperSeparateFrames": false,
      "clipperPreserveHTML5Tags": false,
      "clipperSaveInlineResources": false,
      "clipperSaveStyles": true,
      "clipperInlineStylesheets": true,
      "clipperSaveActiveRulesOnly": true
    };
    result.shortcuts = {};
    var id, name, command;
    var node = mainKeyset.firstChild;
    while ( node ) {
      if ( node.nodeName != "key" || !node.hasAttribute( "command" ) ||
           !node.hasAttribute( "id" ) ) {
        node = node.nextSibling;
        continue;
      }
      var id = node.getAttribute( "id" );
      name = Utils.getNameFromId( id );
      if ( !name ) {
        node = node.nextSibling;
        continue;
      }
      command = node.getAttribute( "command" );
      if ( !document.getElementById( command ) ) {
        node = node.nextSibling;
        continue;
      }
      result.shortcuts[id] = {
        "command": command,
        "key": node.getAttribute( "key" ),
        "keycode": node.getAttribute( "keycode" ),
        "modifiers": node.getAttribute( "modifiers" )
      };
      node = node.nextSibling;
    }
    return result;
  };

  function getMainPreferences() {
    var result = {
      "placeName": Utils.PLACE_NAME,
      "defaultDocumentType": Utils.DEFAULT_DOCUMENT_TYPE,
      "isSavePosition": Utils.IS_SAVE_POSITION,
      "isEditSourceEnabled": Utils.IS_EDIT_SOURCE_ENABLED,
      "isPlaySound": Utils.IS_PLAY_SOUND,
      "isClearBinOnExit": Utils.IS_CLEAR_BIN_ON_EXIT,
      "isReplaceBackground": Utils.IS_REPLACE_BACKGROUND,
      "isConfirmExit": Utils.IS_CONFIRM_EXIT,
      "isExitQuitTB": Utils.IS_EXIT_QUIT_TB,
      "isHighlightRow": Utils.IS_HIGHLIGHT_ROW,
      "isCloseBrowserAfterImport": Utils.IS_CLOSE_BROWSER_AFTER_IMPORT,
      "isClipperPlaySound":       Utils.IS_CLIPPER_PLAY_SOUND,
      "clipperSaveScripts":         !!( Utils.CLIPPER_FLAGS & 0x00000001 ),
      "clipperSaveFrames":          !!( Utils.CLIPPER_FLAGS & 0x00000010 ),
      "clipperSeparateFrames":      !!( Utils.CLIPPER_FLAGS & 0x00000100 ),
      "clipperPreserveHTML5Tags":   !!( Utils.CLIPPER_FLAGS & 0x00001000 ),
      "clipperSaveStyles":          !!( Utils.CLIPPER_FLAGS & 0x00010000 ),
      "clipperSaveInlineResources": !!( Utils.CLIPPER_FLAGS & 0x00100000 ),
      "clipperInlineStylesheets":   !!( Utils.CLIPPER_FLAGS & 0x01000000 ),
      "clipperSaveActiveRulesOnly": !!( Utils.CLIPPER_FLAGS & 0x10000000 )
    };
    try {
      result.shortcuts = JSON.parse( Utils.MAIN_SHORTCUTS );
      if ( typeof( result.shortcuts ) !== "object" ) {
        result.shortcuts = {};
      }
    } catch ( e ) {
      result.shortcuts = {};
      log.warn( e + "\n" + Utils.dumpStack() );
    }
    return result;
  };

  function setMainPreferences( prefs ) {
    prefsBundle.setCharPref( "placeName", prefs.placeName );
    prefsBundle.setBoolPref( "isSavePosition", prefs.isSavePosition );
    prefsBundle.setBoolPref( "isEditSourceEnabled", prefs.isEditSourceEnabled );
    prefsBundle.setBoolPref( "isPlaySound", prefs.isPlaySound );
    prefsBundle.setBoolPref( "isClearBinOnExit", prefs.isClearBinOnExit );
    prefsBundle.setBoolPref( "isReplaceBackground", prefs.isReplaceBackground );
    prefsBundle.setBoolPref( "isConfirmExit", prefs.isConfirmExit );
    prefsBundle.setBoolPref( "isExitQuitTB", prefs.isExitQuitTB );
    prefsBundle.setBoolPref( "isHighlightRow", prefs.isHighlightRow );
    prefsBundle.setBoolPref( "isCloseBrowserAfterImport", prefs.isCloseBrowserAfterImport );
    prefsBundle.setCharPref( "defaultDocumentType", prefs.defaultDocumentType );
    prefsBundle.setCharPref( "main_shortcuts", JSON.stringify( prefs.shortcuts, null, 2 ) );
    prefsBundle.setBoolPref( "isClipperPlaySound", prefs.isClipperPlaySound );
    prefsBundle.setBoolPref( "clipperSaveScripts", prefs.clipperSaveScripts );
    prefsBundle.setBoolPref( "clipperSaveFrames", prefs.clipperSaveFrames );
    prefsBundle.setBoolPref( "clipperSeparateFrames", prefs.clipperSeparateFrames );
    prefsBundle.setBoolPref( "clipperPreserveHTML5Tags", prefs.clipperPreserveHTML5Tags );
    prefsBundle.setBoolPref( "clipperSaveInlineResources", prefs.clipperSaveInlineResources );
    prefsBundle.setBoolPref( "clipperSaveStyles", prefs.clipperSaveStyles );
    prefsBundle.setBoolPref( "clipperInlineStylesheets", prefs.clipperInlineStylesheets );
    prefsBundle.setBoolPref( "clipperSaveActiveRulesOnly", prefs.clipperSaveActiveRulesOnly );
  };

  // TABS

  function createTabs() {
    platformKeyset = document.getElementById( "znotes_platform_keyset" );
    platformPrefs = {
      "default": {},
      "original": {},
      "current": {},
    };
    Utils.cloneObject( getPlatformDefaultPreferences(), platformPrefs["default"] );
    Utils.cloneObject( getPlatformPreferences(), platformPrefs["original"] );
    Utils.cloneObject( getPlatformPreferences(), platformPrefs["current"] );
    optionsPrefs["main"] = {
      "default": {},
      "original": {},
      "current": {},
      activeElement: null
    };
    Utils.cloneObject( getMainDefaultPreferences(), optionsPrefs["main"]["default"] );
    Utils.cloneObject( getMainPreferences(), optionsPrefs["main"]["original"] );
    Utils.cloneObject( getMainPreferences(), optionsPrefs["main"]["current"] );
    var docs = DocumentManager.getInstance().getDocuments();
    var doc, opt, tab, panel;
    var editorDefaults, documentDefaults;
    for ( var name in docs ) {
      doc = docs[ name ];
      opt = doc.getOptions();
      if ( !opt.isSupported() ) {
        continue;
      }
      // tab
      tab = document.createElement( "tab" );
      tab.setAttribute( "id", "tab-" + name );
      tab.setAttribute( "label", " " + doc.getDescription() + " " );
      tab.setAttribute( "class", "optionsTab" );
      tab.setAttribute( "image", doc.getIconURL() );
      optionsTabs.appendChild( tab );
      // panel
      panel = document.createElement( "tabpanel" );
      panel.setAttribute( "id", "panel-" + name );
      panel.setAttribute( "orient", "vertical" );
      panel.setAttribute( "flex", "1" );
      optionsPanels.appendChild( panel );
      // prefs
      var documentPrefs = opt.getDocumentPreferences();
      var editorPrefs = opt.getEditorPreferences();
      if ( !( "shortcuts" in editorPrefs ) ||
           !( typeof( editorPrefs["shortcuts"] ) == "object" ) ) {
        editorPrefs["shortcuts"] = {};
      }
      optionsPrefs[name] = {
        "default": {
          editor: {},
          document: {}
        },
        "original": {
          editor: {},
          document: {}
        },
        "current": {
          editor: {},
          document: {}
        },
        activeElement: null
      };
      Utils.cloneObject( opt.getEditorDefaultPreferences(), optionsPrefs[name]["default"].editor );
      Utils.cloneObject( editorPrefs, optionsPrefs[name]["original"].editor );
      Utils.cloneObject( editorPrefs, optionsPrefs[name]["current"].editor );
      Utils.cloneObject( opt.getDocumentDefaultPreferences(), optionsPrefs[name]["default"].document );
      Utils.cloneObject( documentPrefs, optionsPrefs[name]["original"].document );
      Utils.cloneObject( documentPrefs, optionsPrefs[name]["current"].document );
    }
  };

  function openMainTab() {
    var originalPrefs = optionsPrefs["main"].original;
    var currentPrefs = optionsPrefs["main"].current;
    placeName.value = currentPrefs.placeName;
    isSavePosition.checked = currentPrefs.isSavePosition;
    isEditSourceEnabled.checked = currentPrefs.isEditSourceEnabled;
    isPlaySound.checked = currentPrefs.isPlaySound;
    isClearBinOnExit.checked = currentPrefs.isClearBinOnExit;
    isReplaceBackground.checked = currentPrefs.isReplaceBackground;
    isConfirmExit.checked = currentPrefs.isConfirmExit;
    isExitQuitTB.checked = currentPrefs.isExitQuitTB;
    isHighlightRow.checked = currentPrefs.isHighlightRow;
    isCloseBrowserAfterImport.checked = currentPrefs.isCloseBrowserAfterImport;
    isClipperPlaySound.checked = currentPrefs.isClipperPlaySound;
    clipperSaveScripts.checked = currentPrefs.clipperSaveScripts;
    clipperSaveFrames.checked = currentPrefs.clipperSaveFrames;
    clipperSeparateFrames.checked = currentPrefs.clipperSeparateFrames;
    clipperPreserveHTML5Tags.checked = currentPrefs.clipperPreserveHTML5Tags;
    clipperSaveInlineResources.checked = currentPrefs.clipperSaveInlineResources;
    clipperSaveStyles.checked = currentPrefs.clipperSaveStyles;
    clipperInlineStylesheets.checked = currentPrefs.clipperInlineStylesheets;
    clipperSaveActiveRulesOnly.checked = currentPrefs.clipperSaveActiveRulesOnly;
    onSaveStylesChanged();
    defaultDocumentType = currentPrefs.defaultDocumentType;
    populateDocumentTypePopup();
    loadShortcuts( mainKeyset, mainShortcuts, originalPrefs, currentPrefs );
    populateShortcutsListBox( mainShortcuts, keysListBox );
    loadShortcuts( platformKeyset, platformShortcuts,
      platformPrefs.original, platformPrefs.current );
    populateShortcutsListBox( platformShortcuts, keysPlatformListBox );
    if ( optionsPrefs["main"].activeElement ) {
      optionsPrefs["main"].activeElement.focus();
    }
  };

  function closeMainTab() {
    var originalPrefs = optionsPrefs["main"].original;
    var currentPrefs = optionsPrefs["main"].current;
    var isChanged = false;
    if ( updateMainPreferences( currentPrefs, originalPrefs ) ) {
      isChanged = true;
    }
    if ( updateShortcutPreferences( currentPrefs, mainShortcuts ) ) {
      isChanged = true;
    }
    if ( updateShortcutPreferences(
      platformPrefs.current, platformShortcuts ) ) {
      isChanged = true;
    }
    optionsPrefs["main"].activeElement = document.activeElement;
    return isChanged;
  };

  function saveAllPreferences() {
    var opt, docs = DocumentManager.getInstance().getDocuments();
    for ( var name in optionsPrefs ) {
      if ( name === "main" ) {
        setMainPreferences( optionsPrefs[name].current );
        setPlatformPreferences( platformPrefs.current );
        continue;
      }
      opt = docs[ name ].getOptions();
      opt.setDocumentPreferences( optionsPrefs[name].current.document );
      opt.setEditorPreferences( optionsPrefs[name].current.editor );
    }
  };

  // LISTENERS

  function addEventListeners() {
    optionsTabs.addEventListener( "select", onTabSelect, false );
    acceptButton.addEventListener( "command", onAccept, false );
    cancelButton.addEventListener( "command", onCancel, false );
    defaultsButton.addEventListener( "command", onDefaults, false );
    clipperSaveStyles.addEventListener( "command", onSaveStylesChanged, false );
  };

  // PUBLIC

  pub.onLoad = function() {
    Utils.initGlobals();
    prefsBundle.loadPrefs();
    currentWindow = window;
    placeName = document.getElementById( "placeName" );
    isSavePosition = document.getElementById( "isSavePosition" );
    isEditSourceEnabled = document.getElementById( "isEditSourceEnabled" );
    isPlaySound = document.getElementById( "isPlaySound" );
    isClearBinOnExit = document.getElementById( "isClearBinOnExit" );
    isReplaceBackground = document.getElementById( "isReplaceBackground" );
    isConfirmExit = document.getElementById( "isConfirmExit" );
    isExitQuitTB = document.getElementById( "isExitQuitTB" );
    if ( Utils.IS_STANDALONE ) {
      isExitQuitTB.setAttribute( "hidden", true );
    }
    isHighlightRow = document.getElementById( "isHighlightRow" );
    isCloseBrowserAfterImport = document.getElementById( "isCloseBrowserAfterImport" );
    isClipperPlaySound = document.getElementById( "isClipperPlaySound" );
    clipperSaveScripts = document.getElementById( "clipperSaveScripts" );
    clipperSaveFrames = document.getElementById( "clipperSaveFrames" );
    clipperSeparateFrames = document.getElementById( "clipperSeparateFrames" );
    clipperPreserveHTML5Tags = document.getElementById( "clipperPreserveHTML5Tags" );
    clipperSaveInlineResources = document.getElementById( "clipperSaveInlineResources" );
    clipperSaveStyles = document.getElementById( "clipperSaveStyles" );
    clipperInlineStylesheets = document.getElementById( "clipperInlineStylesheets" );
    clipperSaveActiveRulesOnly = document.getElementById( "clipperSaveActiveRulesOnly" );
    clipperSeparateFrames.setAttribute( "hidden", "true" );
    if ( Utils.IS_SANITIZE_ENABLED ) {
      clipperSaveScripts.setAttribute( "hidden", "true" );
      clipperSaveFrames.setAttribute( "hidden", "true" );
      clipperPreserveHTML5Tags.setAttribute( "hidden", "true" );
      clipperInlineStylesheets.setAttribute( "hidden", "true" );
      clipperSaveActiveRulesOnly.setAttribute( "hidden", "true" );
    } else {
      clipperSaveScripts.removeAttribute( "hidden" );
      clipperSaveFrames.removeAttribute( "hidden" );
      clipperPreserveHTML5Tags.removeAttribute( "hidden" );
      clipperInlineStylesheets.removeAttribute( "hidden" );
      clipperSaveActiveRulesOnly.removeAttribute( "hidden" );
    }
    docTypeMenuList = document.getElementById( "docTypeMenuList" );
    docTypeMenuPopup = document.getElementById( "docTypeMenuPopup" );
    keysListBox = document.getElementById( "keysListBox" );
    optionsTabs = document.getElementById( "optionsTabs" );
    optionsPanels = document.getElementById( "optionsPanels" );
    acceptButton = document.getElementById( "acceptButton" );
    cancelButton = document.getElementById( "cancelButton" );
    defaultsButton = document.getElementById( "defaultsButton" );
    keysPlatformGroupBox = document.getElementById( "keysPlatformGroupBox" );
    keysPlatformListBox = document.getElementById( "keysPlatformListBox" );
    mainKeyset = document.getElementById( "znotes_keyset" );
    fetchPlatformAssignedKeys();
    addEventListeners();
    platformKeyset = null;
    document.loadOverlay(
      Utils.IS_STANDALONE ? "chrome://znotes/content/common-xr.xul" :
        "chrome://znotes/content/common-tb.xul",
      {
        observe: function( subject, topic, data ) {
          if ( topic == "xul-overlay-merged" ) {
            createTabs();
            openMainTab();
            window.sizeToContent();
          }
        }
      }
    );
  };

  pub.onClose = function( event ) {
    var confirm, isChanged = false;
    if ( currentOptions ) {
      if ( currentOptions.close() ) {
        isChanged = true;
      }
    }
    if ( closeMainTab() ) {
      isChanged = true;
    }
    if ( !isChanged ) {
      return true;
    }
    confirm = confirmSave();
    if ( confirm === -1 ) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    if ( confirm === 1 ) {
      saveAllPreferences();
    }
    return true;
  };

  return pub;

}();

window.addEventListener( "load", ru.akman.znotes.Options.onLoad, false );
window.addEventListener( "close", ru.akman.znotes.Options.onClose, true );
