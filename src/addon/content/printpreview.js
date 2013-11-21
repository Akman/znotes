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

Components.utils.import( "resource://znotes/utils.js", ru.akman.znotes );

ru.akman.znotes.PrintPreview = function() {

  var Utils = ru.akman.znotes.Utils;
  
  var pub = {};
  
  var aSourceTitle = null;
  var aSourceWindow = null;
  var aPreviewBrowser = null;
  var aContentBrowser = null;
  var aPreviewToolbox = null;
  
  var PrintPreviewListener = {
    getPrintPreviewBrowser: function () {
      return aPreviewBrowser;
    },
    getSourceBrowser: function () {
      return aContentBrowser;
    },
    getNavToolbox: function () {
      return aPreviewToolbox;
    },
    onEnter: function () {
    },
    onExit: function () {
      window.close();
    }
  };
  
  function setupContentBrowser() {
    var contentDocument = aContentBrowser.contentDocument;
    var html = contentDocument.documentElement;
    html.removeChild( contentDocument.head );
    var head = contentDocument.importNode( aSourceWindow.document.head, true );
    html.appendChild( head );
    var aSourceSelection = aSourceWindow.getSelection();
    var ranges, range, body;
    if ( aSourceSelection != "" ) {
      ranges = [];
      body = contentDocument.body;
      for( var i = 0; i < aSourceSelection.rangeCount; i++ ) {
        ranges.push( aSourceSelection.getRangeAt( i ) );
      }
      for( var i = 0; i < ranges.length; i++ ) {
        body.appendChild( ranges[i].cloneContents() );
      }
    } else {
      html.removeChild( contentDocument.body );
      range = aSourceWindow.document.createRange();
      range.selectNode( aSourceWindow.document.body );
      html.appendChild( range.cloneContents() );
    }
  };
  
  pub.onLoad = function() {
    if ( !window.arguments || window.arguments[0] == null ) {
      window.close();
    }
    var anArgs = window.arguments[0];
    if ( ( "aWindow" in anArgs ) && anArgs.aWindow ) {
      aSourceWindow = anArgs.aWindow;
    } else {
      window.close();
    }
    if ( ( "aTitle" in anArgs ) && anArgs.aTitle ) {
      aSourceTitle = anArgs.aTitle;
    }
    if ( aSourceTitle ) {
      document.title += " - " + aSourceTitle;
    }
    aContentBrowser = document.getElementById( "contentBrowser" );
    aPreviewBrowser = document.getElementById( "previewBrowser" );
    aPreviewToolbox = document.getElementById( "previewToolbox" );
    setupContentBrowser();
    PrintUtils.printPreview( PrintPreviewListener );
  };

  return pub;

}();

window.addEventListener( "load"  , function() { ru.akman.znotes.PrintPreview.onLoad(); }, false );
