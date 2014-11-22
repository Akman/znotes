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

ru.akman.znotes.ImageSelectDialog = function() {

  var Utils = ru.akman.znotes.Utils;
  var log = Utils.getLogger( "content.imageselectdialog" );

  var args = null;
  var currentNote = null;

  var urlTextBox = null;

  var imgBox = null;
  var imgBoxItem = null;

  var images = [];

  var image = null;
  var label = null;
  var uuid = null;

  var pub = {};

  function onImageSelect( event ) {
    urlTextBox.value = images[ imgBox.selectedIndex ].leafName;
  };

  function onImageDblclick( event ) {
    args.output = {
      result: urlTextBox.value
    };
    close();
  };

  pub.onLoad = function() {
    args = window.arguments[0];
    currentNote = args.input.note;
    document.title = args.input.title;
    urlTextBox = document.getElementById( "urlTextBox" );
    urlTextBox.value = "http://";
    imgBox = document.getElementById( "imgBox" );
    var ioService =
      Cc["@mozilla.org/network/io-service;1"]
      .getService( Ci.nsIIOService );
    var fph =
      ioService.getProtocolHandler( "file" ).QueryInterface(
        Ci.nsIFileProtocolHandler );
    var mimeService = Cc["@mozilla.org/mime;1"].getService( Ci.nsIMIMEService );
    var contents = currentNote.getContents();
    images.splice( 0, images.length );
    for ( var i = 0; i < contents.length; i++ ) {
      var content = contents[i];
      var entry = currentNote.getContentEntry( content[0] );
      if ( entry && entry.exists() && !entry.isDirectory() ) {
        var contentType = mimeService.getTypeFromURI( fph.newFileURI( entry ) );
        if ( contentType.indexOf( "image/" ) == 0 ) {
          images.push( entry );
        }
      }
    }
    for ( var i = 0; i < images.length; i++ ) {
      uuid = Utils.createUUID();
      imgBoxItem = document.createElement( "richlistitem" );
      imgBoxItem.setAttribute( "id", "item_" + uuid );
      imgBoxItem.setAttribute( "class", "boxItem" );
      image = document.createElement( "image" );
      image.setAttribute( "id", "image_" + uuid );
      image.setAttribute( "src", fph.newFileURI( images[i] ).spec );
      image.setAttribute( "class", "boxItemImage" );
      label = document.createElement( "label" );
      label.setAttribute( "id", "label_" + uuid );
      label.setAttribute( "value", images[i].leafName );
      label.setAttribute( "class", "boxItemLabel" );
      imgBoxItem.appendChild( image );
      imgBoxItem.appendChild( label );
      imgBox.appendChild( imgBoxItem );
    }
    imgBox.addEventListener( "select", onImageSelect, false );
    imgBox.addEventListener( "dblclick", onImageDblclick, false );
    centerWindowOnScreen();
  };

  pub.onDialogAccept = function() {
    args.output = {
      result: urlTextBox.value
    };
    return true;
  };

  return pub;

}();

window.addEventListener( "load"  , function() { ru.akman.znotes.ImageSelectDialog.onLoad(); }, false );
window.addEventListener( "dialogaccept", function() { ru.akman.znotes.ImageSelectDialog.onDialogAccept(); }, false );
