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
Components.utils.import( "resource://znotes/prefsmanager.js" , ru.akman.znotes );
Components.utils.import( "resource://znotes/documentmanager.js" , ru.akman.znotes );

ru.akman.znotes.Options = function() {

  var pub = {};

  var prefsBundle = null;

  var tb_place_name = null;
  var cb_is_save_position = null;
  var cb_is_edit_source_enabled = null;
  var cb_is_play_sound = null;
  var ml_default_document_type = null;
  var mp_default_document_type = null;

  var defaultDocumentType = ru.akman.znotes.DocumentManager.getDefaultDocument().getType();
  var currentDocumentType = defaultDocumentType;
  
  function populateDocumentTypePopup() {
    ml_default_document_type.selectedItem = null;
    while ( mp_default_document_type.firstChild ) {
      mp_default_document_type.removeChild( mp_default_document_type.firstChild );
    }
    var docs = ru.akman.znotes.DocumentManager.getDocuments();
    var defaultMenuItem = null;
    for ( var name in docs ) {
      var doc = docs[ name ];
      var label = doc.getDescription();
      var value = doc.getType();
      var text = doc.getName() + "-" + doc.getVersion() + " : " + value;
      var menuItem = document.createElement( "menuitem" );
      menuItem.className = "menuitem-iconic";
      menuItem.setAttribute( "id", "menuitem_" + doc.getName() );
      menuItem.setAttribute( "label", label );
      menuItem.setAttribute( "tooltiptext", text );
      menuItem.setAttribute( "image", doc.getIconURL() );
      menuItem.setAttribute( "value", value );
      var style = menuItem.style;
      // BUG: DOES NOT WORK!
      // style.setProperty( "list-style-image", "url( '" + doc.getIconURL() + "' )" , "important" );
      style.setProperty( "background-image", "url( '" + doc.getIconURL() + "' )" );
      style.setProperty( "background-repeat", "no-repeat" );
      style.setProperty( "background-position", "0 50%" );
      style.setProperty( "padding-left", "20px" );
      mp_default_document_type.appendChild( menuItem );
      if ( value == defaultDocumentType ) {
        defaultMenuItem = menuItem;
      }
      if ( value == currentDocumentType ) {
        ml_default_document_type.selectedItem = menuItem;
        ml_default_document_type.setAttribute( "tooltiptext", text );
      }
    }
    if ( !ml_default_document_type.selectedItem ) {
      currentDocumentType = defaultDocumentType;
      ml_default_document_type.selectedItem = defaultMenuItem;
      ml_default_document_type.setAttribute( "tooltiptext", defaultMenuItem.getAttribute( "tooltiptext" ) );
    }
  };
  
  pub.onLoad = function() {
    tb_place_name = document.getElementById( "tb_place_name" );
    cb_is_save_position = document.getElementById( "cb_is_save_position" );
    cb_is_edit_source_enabled = document.getElementById( "cb_is_edit_source_enabled" );
    cb_is_play_sound = document.getElementById( "cb_is_play_sound" );
    ml_default_document_type = document.getElementById( "ml_default_document_type" );
    mp_default_document_type = document.getElementById( "mp_default_document_type" );
    prefsBundle = ru.akman.znotes.PrefsManager.getInstance();
    if ( prefsBundle.hasPref( "placeName" ) ) {
      tb_place_name.value = prefsBundle.getCharPref( "placeName" );
    } else {
      tb_place_name.value = "";
    }
    if ( prefsBundle.hasPref( "defaultDocumentType" ) ) {
      currentDocumentType = prefsBundle.getCharPref( "defaultDocumentType" );
    }
    if ( prefsBundle.getBoolPref( "isSavePosition" ) ) {
      cb_is_save_position.setAttribute( "checked", "true" );
    }
    if ( prefsBundle.getBoolPref( "isEditSourceEnabled" ) ) {
      cb_is_edit_source_enabled.setAttribute( "checked", "true" );
    }
    if ( prefsBundle.getBoolPref( "isPlaySound" ) ) {
      cb_is_play_sound.setAttribute( "checked", "true" );
    }
    populateDocumentTypePopup();
  };

  pub.onDialogAccept = function() {
    prefsBundle.setCharPref( "placeName", tb_place_name.value );
    prefsBundle.setBoolPref( "isSavePosition", cb_is_save_position.hasAttribute( "checked" ) );
    prefsBundle.setBoolPref( "isEditSourceEnabled", cb_is_edit_source_enabled.hasAttribute( "checked" ) );
    prefsBundle.setBoolPref( "isPlaySound", cb_is_play_sound.hasAttribute( "checked" ) );
    prefsBundle.setCharPref( "defaultDocumentType", ml_default_document_type.value );
    return true;
  };

  return pub;

}();

window.addEventListener( "load"  , function() { ru.akman.znotes.Options.onLoad(); }, false );
window.addEventListener( "dialogaccept", function() { ru.akman.znotes.Options.onDialogAccept(); }, false );
