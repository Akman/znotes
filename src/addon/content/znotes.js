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
Cu.import( "resource://gre/modules/devtools/dbg-server.jsm" );

var Utils = ru.akman.znotes.Utils;
var log = Utils.getLogger( "content.znotes" );

function toOpenWindowByType( inType, inURI ) {
  var win =
    Cc["@mozilla.org/appshell/window-mediator;1"]
      .getService( Ci.nsIWindowMediator )
      .getMostRecentWindow( inType );
  if ( win ) {
    win.focus();
  } else {
    win = window.open(
      inURI,
      "_blank",
      "chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar"
    );
  }
  return win;
};

function toJavaScriptConsole() {
  return toOpenWindowByType(
    "global:console",
    "chrome://global/content/console.xul"
  );
};

/**
 * @see https://developer.mozilla.org/en-US/docs/Tools/Remote_Debugging/Debugging_Firefox_Desktop
 *
 * Note: By default, and for security reasons,
 * the "devtools.debugger.force-local" option is set.
 * If you want to debug a Firefox instance from an external machine,
 * you can change this option, but only do this on a trusted network or set
 * a strong firewall rule to lock down which machines can access it.
 */
function startDebuggerServer() {
  var debuggerListener;
  var debuggerEnabled = false, debuggerPort = 6000;
  var xulAppInfo = Cc["@mozilla.org/xre/app-info;1"].getService( Ci.nsIXULAppInfo );
  var versionComparator =
    Cc["@mozilla.org/xpcom/version-comparator;1"].getService(
      Ci.nsIVersionComparator );
  var prefBranch =
    Cc["@mozilla.org/preferences-service;1"].getService( Ci.nsIPrefBranch );
  debuggerEnabled = prefBranch.getBoolPref( "devtools.debugger.remote-enabled" );
  debuggerPort = prefBranch.getIntPref( "devtools.debugger.remote-port" );
  if ( !debuggerEnabled ) {
    return;
  }
  if ( !DebuggerServer.initialized ) {
    DebuggerServer.init();
    DebuggerServer.addBrowserActors(
      "znotes:platform" /* chrome */,
      false /* registerTabActors */
    );
    DebuggerServer.allowChromeProcess = true;
  }
  if ( versionComparator.compare( xulAppInfo.platformVersion, "37.0" ) >= 0 ) {
    debuggerListener = DebuggerServer.createListener();
    debuggerListener.portOrPath = debuggerPort;
    debuggerListener.open();
  } else {
    DebuggerServer.openListener( debuggerPort );
  }
};

function stopDebuggerServer() {
};
