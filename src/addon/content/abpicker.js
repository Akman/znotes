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

ru.akman.znotes.ABPicker = function() {

  var pub = {};

  var args = null;
  var btnAccept = null;
  var btnCancel = null;
  var directoryMenuList = null;
  var directoryMenuPopup = null;
  var cardsRichListBox = null;
  var abManager = null;
  var abDirectory = null;
  var directoryMenuListFormed = false;
  var cardsArray = [];

  function createDirectoryMenuList() {
    if ( directoryMenuListFormed )
      return;
    while ( directoryMenuPopup.firstChild )
      directoryMenuPopup.removeChild( directoryMenuPopup.firstChild );
    abManager = Components.classes["@mozilla.org/abmanager;1"]
                          .getService( Components.interfaces.nsIAbManager );
    var directories = abManager.directories;
    while ( directories.hasMoreElements() ) {
      var directory = directories.getNext().QueryInterface( Components.interfaces.nsIAbDirectory );
      if ( directory instanceof Components.interfaces.nsIAbDirectory ) {
        var menuItem = document.createElement( "menuitem" );
        menuItem.setAttribute( "label", directory.dirName );
        menuItem.setAttribute( "value", directory.URI );
        directoryMenuPopup.appendChild( menuItem );
      }
    }
    directoryMenuListFormed = true;
  };

  function createCardsListBox() {
    while ( cardsRichListBox.firstChild )
      cardsRichListBox.removeChild( cardsRichListBox.firstChild );
    cardsArray.splice(0);
    var cards = abDirectory.childCards;
    while ( cards.hasMoreElements() ) {
      var card = cards.getNext().QueryInterface( Components.interfaces.nsIAbCard );
      if ( card instanceof Components.interfaces.nsIAbCard ) {
        cardsArray.push( card );
        var richListItem = document.createElement( "richlistitem" );
        // ***
          var displayName = card.getProperty( "DisplayName", "" );
          var photoURI = card.getProperty( "PhotoURI", "chrome://znotes_images/skin/contact-32x32.png" );
          //
          var description = document.createElement( "description" );
          var image = document.createElement( "image" );
          image.setAttribute( "width", "32" );
          image.setAttribute( "height", "32" );
          image.setAttribute( "src", photoURI );
          description.setAttribute( "value", displayName );
          richListItem.appendChild( image );
          richListItem.appendChild( description );
        // ***
        cardsRichListBox.appendChild( richListItem );
      }
    }
  };

  pub.onLoad = function() {
    args = window.arguments[0];
    btnAccept = document.getElementById( "btnAccept" );
    btnCancel = document.getElementById( "btnCancel" );
    directoryMenuList = document.getElementById( "directoryMenuList" );
    directoryMenuPopup = document.getElementById( "directoryMenuPopup" );
    cardsRichListBox = document.getElementById( "cardsRichListBox" );
    cardsRichListBox.addEventListener( "dblclick", pub.onCardsRichListBoxDblClick, false );
    //
    createDirectoryMenuList();
    directoryMenuList.selectedIndex = 0;
    pub.onCmdSelectDirectory();
  };

  pub.onUnload = function() {
    cardsRichListBox.removeEventListener( "dblclick", pub.onCardsRichListBoxDblClick, false );
  }

  pub.onCardsRichListBoxDblClick = function( event ) {
    btnAccept.click();
    return true;
  }

  pub.onCmdSelectDirectory = function( source ) {
    var uri = directoryMenuList.selectedItem.value;
    abDirectory = abManager.getDirectory( uri );
    createCardsListBox();
    cardsRichListBox.selectedIndex = 0;
    cardsRichListBox.focus();
    return true;
  };

  pub.onDialogAccept = function() {
    var count = cardsRichListBox.selectedCount;
    var items = cardsRichListBox.selectedItems;
    args.output = {
      cards: []
    };
    for ( var i = 0; i < count; i++ ) {
      var index = cardsRichListBox.getIndexOfItem( items[i] );
      args.output.cards[i] = cardsArray[index];
    }
    return true;
  };

  return pub;

}();

window.addEventListener( "load"  , function() { ru.akman.znotes.ABPicker.onLoad(); }, false );
window.addEventListener( "unload"  , function() { ru.akman.znotes.ABPicker.onUnload(); }, false );
window.addEventListener( "dialogaccept", function() { ru.akman.znotes.ABPicker.onDialogAccept(); }, false );
