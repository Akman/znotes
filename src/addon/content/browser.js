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
Cu.import( "resource://znotes/keyset.js", ru.akman.znotes );

ru.akman.znotes.Browser = function() {

  var Utils = ru.akman.znotes.Utils;
  var Common = ru.akman.znotes.Common;

  var log = Utils.getLogger( "content.browser" );

  var context = null;

  var browserToolBox = null;
  var browserToolBar = null
  var browserURLTextBox = null;
  var browserSpinner = null;
  var browserView = null;
  var zBrowser = null;
  var statusBar = null;
  var statusBarPanel = null;
  var statusBarImage = null;
  var statusBarLabel = null;

  var ioService =
    Cc["@mozilla.org/network/io-service;1"].getService( Ci.nsIIOService );

  var windowWatcher =
    Cc["@mozilla.org/embedcomp/window-watcher;1"]
    .getService( Ci.nsIWindowWatcher );

  var observerService =
    Cc["@mozilla.org/observer-service;1"].getService( Ci.nsIObserverService );

  // KEYSET

  var browserKeyset = {
    mKeyset: null,
    mShortcuts: "{}",
    setup: function() {
      if ( this.mKeyset ) {
        return;
      }
      this.mKeyset = new ru.akman.znotes.Keyset(
        document.getElementById( "znotes_keyset" )
      );
    },
    activate: function() {
      if ( !this.mKeyset ) {
        return;
      }
      this.mKeyset.activate();
    },
    deactivate: function() {
      if ( !this.mKeyset ) {
        return;
      }
      this.mKeyset.deactivate();
    },
    update: function() {
      if ( !this.mKeyset ) {
        return;
      }
      var shortcuts = {};
      try {
        shortcuts = JSON.parse( this.mShortcuts );
        if ( typeof( shortcuts ) !== "object" ) {
          shortcuts = {};
        }
      } catch ( e ) {
        log.warn( e + "\n" + Utils.dumpStack() );
        shortcuts = {};
      }
      this.mKeyset.update( shortcuts );
    }
  };

  // COMMANDS

  var browserCommands = {
    "znotes_load_command": null,
    "znotes_prev_command": null,
    "znotes_next_command": null,
    "znotes_stop_command": null,
    "znotes_reload_command": null,
    "znotes_customizetoolbar_command": null
  };

  var browserController = {
    supportsCommand: function( cmd ) {
      if ( !( cmd in browserCommands ) ) {
        return false;
      }
      return true;
    },
    isCommandEnabled: function( cmd ) {
      if ( !( cmd in browserCommands ) ) {
        return false;
      }
      switch ( cmd ) {
        case "znotes_prev_command":
          return zBrowser.webNavigation.canGoBack;
          break;
        case "znotes_next_command":
          return zBrowser.webNavigation.canGoForward;
          break;
        case "znotes_stop_command":
          break;
        case "znotes_reload_command":
          break;
      }
      return true;
    },
    doCommand: function( cmd ) {
      if ( !( cmd in browserCommands ) ) {
        return;
      }
      switch ( cmd ) {
        case "znotes_load_command":
          try {
            zBrowser.webNavigation.loadURI(
              browserURLTextBox.value,
              Ci.nsIWebNavigation.LOAD_FLAGS_NONE,
              null,
              null,
              null
            );
          } catch ( e ) {
            //
          }
          break;
        case "znotes_prev_command":
          zBrowser.webNavigation.goBack();
          break;
        case "znotes_next_command":
          zBrowser.webNavigation.goForward();
          break;
        case "znotes_stop_command":
          zBrowser.webNavigation.stop( Ci.nsIWebNavigation.STOP_ALL );
          break;
        case "znotes_reload_command":
          zBrowser.webNavigation.reload( Ci.nsIWebNavigation.LOAD_FLAGS_NONE );
          break;
        case "znotes_customizetoolbar_command":
          window.openDialog(
            "chrome://global/content/customizeToolbar.xul",
            "",
            "chrome,all,dependent,centerscreen",
            browserToolBox
          ).focus();
          break;
      }
      this.updateCommands();
    },
    onEvent: function( event ) {
    },
    getName: function() {
      return "BROWSER";
    },
    getCommand: function( cmd ) {
      if ( cmd in browserCommands ) {
        return document.getElementById( cmd );
      }
      return null;
    },
    updateCommands: function() {
      for ( var cmd in browserCommands ) {
        Common.goUpdateCommand( cmd, this.getId(), window );
      }
    },
    register: function() {
      try {
        window.controllers.insertControllerAt( 0, this );
        this.getId = function() {
          return window.controllers.getControllerId( this );
        };
      } catch ( e ) {
        log.warn(
          "An error occurred registering '" + this.getName() +
          "' controller\n" + e
        );
      }
    },
    unregister: function() {
      for ( var cmd in browserCommands ) {
        Common.goSetCommandEnabled( cmd, false, window );
      }
      try {
        window.controllers.removeController( this );
      } catch ( e ) {
        log.warn(
          "An error occurred unregistering '" + this.getName() +
          "' controller\n" + e
        );
      }
    }
  };

  function updateCommands() {
    browserController.updateCommands();
  };

  // HTTP OBSERVER
  var HTTPObserver = {
    observe: function( aSubject, aTopic, aData ) {
      aSubject.QueryInterface( Ci.nsIHttpChannel );
      var url = aSubject.URI.spec;
      switch ( aTopic ) {
        case "http-on-modify-request":
          // aSubject.setRequestHeader(
          //   "Referer", "http://referer.com", false );
          // aSubject.cancel( Cr.NS_BINDING_ABORTED );
          break;
        case "http-on-examine-response":
          // aSubject.setRequestHeader(
          //   "Referer", "http://referer.com", false );
          // aSubject.cancel( Cr.NS_BINDING_ABORTED );
          break;
      }
    },
    register: function() {
      observerService.addObserver( this, "http-on-modify-request", false );
      observerService.addObserver( this, "http-on-examine-response", false );
    },
    unregister: function() {
      observerService.removeObserver( this, "http-on-modify-request" );
      observerService.removeObserver( this, "http-on-examine-response" );
    }
  };

  // PROGRESS LISTENER

  var progressListener = {
    QueryInterface: function( aIID ) {
      if ( aIID.equals( Ci.nsIWebProgressListener ) ||
           aIID.equals( Ci.nsIWebProgressListener2 ) ||
           aIID.equals( Ci.nsISupportsWeakReference ) ||
           aIID.equals( Ci.nsISupports ) ) {
        return this;
      }
      throw Cr.NS_NOINTERFACE;
    },
    onLocationChange: function( aWebProgress, aRequest, aLocation,
                                aFlags ) {
      // if ( aRequest && !Components.isSuccessCode( aRequest.status ) ) {
      //   load failure
      // }
      // if ( aRequest instanceof Ci.nsHTTPChannel ) {
      //   test aRequest.responseStatus ( HTTP STATUS )
      // }
      // if ( aFlags & Ci.nsIWebProgressListener.LOCATION_CHANGE_SAME_DOCUMENT ) {
      //   anchor clicked!
      // }
      browserURLTextBox.value = Utils.getURLFromURI( aLocation );
      browserURLTextBox.select();
      updateCommands();
    },
    onProgressChange: function( aWebProgress, aRequest, aCurSelfProgress,
                                aMaxSelfProgress, aCurTotalProgress,
                                aMaxTotalProgress ) {
      this.onProgressChange64( aWebProgress, aRequest, aCurSelfProgress,
                               aMaxSelfProgress, aCurTotalProgress,
                               aMaxTotalProgress );
    },
    onProgressChange64: function( aWebProgress, aRequest, aCurSelfProgress,
                                  aMaxSelfProgress, aCurTotalProgress,
                                  aMaxTotalProgress ) {
      //if ( aCurTotalProgress !== aMaxTotalProgress ) {
      //  statusBarLabel.value = aCurTotalProgress + " bytes";
      //}
    },
    onRefreshAttempted: function( aWebProgress, aRefreshURI, aMillis,
                                  aSameURI ) {
      var newLocation = Utils.getURLFromURI( aRefreshURI );
      var curLocation = aWebProgress.DOMWindow.location ?
        aWebProgress.DOMWindow.location.href : "";
      if ( newLocation &&
           newLocation.toLowerCase() !== curLocation.toLowerCase() ) {
        aWebProgress.DOMWindow.location.assign( newLocation );
      }
      // BUG: return PR_TRUE still cancel redirect
      // var aResult =
      //   Cc["@mozilla.org/supports-PRBool;1"]
      //             .createInstance( Ci.nsISupportsPRBool );
      // aResult.data = 1; // PR_TRUE
      // return aResult;
    },
    onSecurityChange: function( aWebProgress, aRequest, aState ) {
    },
    onStatusChange: function( aWebProgress, aRequest, aStatus, aMessage ) {
      statusBarLabel.value = aMessage;
      statusBarImage.className = "browserGreen";
    },
    onStateChange: function( aWebProgress, aRequest, aStateFlags,
                             aStatus ) {
      if ( aStateFlags & Ci.nsIWebProgressListener.STATE_STOP ) {
        if ( aStateFlags & Ci.nsIWebProgressListener.STATE_IS_DOCUMENT ) {
          browserSpinner.setAttribute( "src", getFavoriteIconURL() );
          zBrowser.contentWindow.scrollbars.visible = true;
        }
        statusBarImage.className = "browserBlack";
        statusBarLabel.value = "";
      } else if ( aStateFlags & Ci.nsIWebProgressListener.STATE_START ) {
        if ( aStateFlags & Ci.nsIWebProgressListener.STATE_IS_DOCUMENT ) {
          browserSpinner.setAttribute( "src",
            "chrome://znotes_images/skin/spinner-16x16.gif" );
        }
        statusBarImage.className = "browserGreen";
      }
    }
  };

  // EVENTS

  function onBrowserLoad( event ) {
    var doc = event.originalTarget;
    if ( doc instanceof HTMLDocument ) {
      if ( doc.defaultView.frameElement ) {
        // frame within a browser was loaded
        while ( doc.defaultView.frameElement ) {
          doc = doc.defaultView.frameElement.ownerDocument;
        }
      }
      // doc processing
    }
  };

  function onURLChanged( event ) {
    browserURLTextBox.value = browserURLTextBox.value.trim();
    browserURLTextBox.select();
    var uri;
    try {
      uri = ioService.newURI( browserURLTextBox.value, null, null );
    } catch ( e ) {
      uri = null;
    }
    if ( !Utils.IS_DEBUG_ENABLED && uri &&
         ( uri.schemeIs( "chrome" ) ||
           uri.schemeIs( "about" ) && uri.spec !== "about:config" ) ) {
      return;
    }
    Common.goDoCommand( 'znotes_load_command', browserURLTextBox );
  };

  function mouseOverHandler( event ) {
    var href = Utils.getHREFForClickEvent( event, true );
    statusBarLabel.value = href ? href : "";
  };

  function mouseClickHandler( event ) {
    if ( event.defaultPrevented || event.button ) {
      return true;
    }
    if ( !event.isTrusted ) {
      return true;
    }
    var href = Utils.getHREFForClickEvent( event, true );
    if ( !href ) {
      return true;
    }
    var uri = ioService.newURI( href, null, null );
    if ( !uri.schemeIs( "chrome" ) ) {
      browserURLTextBox.value = href;
      browserURLTextBox.select();
      return true;
    }
    event.stopPropagation();
    event.preventDefault();
    return false;
  };

  // HELPERS

  function getString( name ) {
    return Utils.STRINGS_BUNDLE.getString( name );
  };

  function setupUI() {
    browserView = document.getElementById( "browserView" );
    browserURLTextBox = document.getElementById( "znotes_url_textbox" );
    browserURLTextBox.value = "about:blank";
    browserURLTextBox.select();
    browserSpinner = document.createElement( "image" );
    browserSpinner.setAttribute( "id", "browserSpinner" );
    browserSpinner.setAttribute( "src",
      "chrome://znotes_images/skin/ready-16x16.png" );
    browserSpinner.className = "browserSpinner";
    browserURLTextBox.insertBefore( browserSpinner, browserURLTextBox.firstChild );
    zBrowser = document.getElementById( "zBrowser" );
    zBrowser.webNavigation.allowAuth = true;
    zBrowser.webNavigation.allowImages = true;
    zBrowser.webNavigation.allowJavascript = true;
    zBrowser.webNavigation.allowMetaRedirects = true;
    zBrowser.webNavigation.allowPlugins = true;
    zBrowser.webNavigation.allowSubframes = true;
    browserToolBox = document.getElementById( "browserToolBox" );
    browserToolBox.customizeDone = browserToolBoxCustomizeDone;
    browserToolBar = document.getElementById( "browserToolBar" );
    statusBar = document.getElementById( "browserStatusBar" );
    statusBarPanel = document.getElementById( "browserStatusBarPanel" );
    statusBarImage = document.getElementById( "browserStatusBarImage" );
    statusBarLabel = document.getElementById( "browserStatusBarLabel" );
  };

  function getFavoriteIconURL() {
    var result = null;
    var nodeList = zBrowser.contentDocument.getElementsByTagName( "link" );
    for ( var i = 0; i < nodeList.length; i++ ) {
      if ( ( nodeList[i].getAttribute( "rel" ) === "icon" ) ||
           ( nodeList[i].getAttribute( "rel" ) === "shortcut icon" ) ) {
        result = nodeList[i].getAttribute( "href" );
        break;
      }
    }
    if ( result ) {
      var documentURI = ioService.newURI(
        zBrowser.contentDocument.documentURI,
        null,
        null
      );
      result = documentURI.resolve( result );
    }
    return result ? result : "chrome://znotes_images/skin/ready-16x16.png";
  };

  function browserToolBoxCustomizeDone( isChanged ) {
    updateCommands();
  };

  function addEventListeners() {
    browserURLTextBox.addEventListener( "change", onURLChanged, false );
    zBrowser.addEventListener( "mouseover", mouseOverHandler, false );
    zBrowser.addEventListener( "click", mouseClickHandler, false );
    zBrowser.addEventListener( "load", onBrowserLoad, true );
    zBrowser.docShell.QueryInterface( Ci.nsIWebProgress );
    zBrowser.docShell.addProgressListener( progressListener,
      Ci.nsIWebProgress.NOTIFY_ALL );
  };

  function removeEventListeners() {
    zBrowser.docShell.removeProgressListener( progressListener );
    zBrowser.removeEventListener( "load", onBrowserLoad, true );
    zBrowser.removeEventListener( "click", mouseClickHandler, false );
    zBrowser.removeEventListener( "mouseover", mouseOverHandler, false );
    browserURLTextBox.removeEventListener( "change", onURLChanged, false );
  };

  // PUBLIC

  var pub = {};

  pub.onLoad = function() {
    setupUI();
    addEventListeners();
    browserKeyset.setup();
    browserKeyset.update();
    browserKeyset.activate();
    browserController.register();
    HTTPObserver.register();
    updateCommands();
  };

  pub.onClose = function() {
    removeEventListeners();
    browserKeyset.deactivate();
    HTTPObserver.unregister();
    browserController.unregister();
    return true;
  };

  return pub;

}();

window.addEventListener( "load", ru.akman.znotes.Browser.onLoad, false );
window.addEventListener( "close", ru.akman.znotes.Browser.onClose, true );
