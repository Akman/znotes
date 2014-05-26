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

Components.utils.import( "resource://znotes/utils.js",
  ru.akman.znotes
);

ru.akman.znotes.Info = function() {

  var Utils = ru.akman.znotes.Utils;
  var ioService =
    Components.classes["@mozilla.org/network/io-service;1"]
              .getService( Components.interfaces.nsIIOService );

  var infoBrowser = null;
  var infoURL = null;
  var windowMode = "normal";

  var pub = {};

  function mouseClickHandler( event ) {
    var href, uri;
    if ( event.defaultPrevented || event.button ) {
      return true;
    }
    if ( !event.isTrusted ) {
      return true;
    }
    href = Utils.getHREFForClickEvent( event, true );
    if ( !href ) {
      return true;
    }
    uri = ioService.newURI( href, null, null );
    if ( !uri.schemeIs( "chrome" ) &&
         !uri.schemeIs( "about" ) &&
         !uri.schemeIs( "znotes" ) ) {
      Utils.openLinkExternally( href );
    }
    event.stopPropagation();
    event.preventDefault();
    return false;
  };
  
  pub.onLoad = function() {
    var args = window.arguments[0];
    if ( args.contentPage ) {
      infoURL = args.contentPage;
    } else {
      window.close();
    }
    if ( args.windowMode ) {
      windowMode = args.windowMode;
    }
    infoBrowser = document.getElementById( "znotes_infotabbrowser" );
    infoBrowser.addEventListener( "click", mouseClickHandler, false );
    infoBrowser.loadURI( infoURL );
    if ( windowMode === "maximized" ) {
      setTimeout(
        function() {
          window.maximize();
        },
        0
      );
    }
  };

  return pub;

}();

window.addEventListener( "load", ru.akman.znotes.Info.onLoad, false );
