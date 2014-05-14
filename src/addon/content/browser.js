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
Components.utils.import( "resource://znotes/keyset.js",
  ru.akman.znotes
);

ru.akman.znotes.Browser = function() {

  var Utils = ru.akman.znotes.Utils;
  var Common = ru.akman.znotes.Common;

  var context = null;
  
  var browserToolBox = null;
  var browserToolBar = null
  var browserURLTextBox = null;
  var browserSpinner = null;
  var browserView = null;
  var gBrowser = null;
  var statusBar = null;
  var statusBarPanel = null;
  var statusBarImage = null;
  var statusBarLabel = null;

  var nsIWebNavigation = Components.interfaces.nsIWebNavigation;
  var nsIWebProgress = Components.interfaces.nsIWebProgress;
  var nsIWebProgressListener = Components.interfaces.nsIWebProgressListener;
  var nsIWebProgressListener2 = Components.interfaces.nsIWebProgressListener2;
  var nsISupportsWeakReference = Components.interfaces.nsISupportsWeakReference;
  var nsISupports = Components.interfaces.nsISupports;
  
  var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                            .getService( Components.interfaces.nsIIOService );

  var windowWatcher =
    Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
              .getService( Components.interfaces.nsIWindowWatcher );

  var observerService =
    Components.classes["@mozilla.org/observer-service;1"]
              .getService( Components.interfaces.nsIObserverService );

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
        Utils.log( e );
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
          return gBrowser.webNavigation.canGoBack;
          break;
        case "znotes_next_command":
          return gBrowser.webNavigation.canGoForward;
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
            gBrowser.webNavigation.loadURI(
              browserURLTextBox.value,
              nsIWebNavigation.LOAD_FLAGS_NONE,
              null,
              null,
              null
            );
          } catch ( e ) {
            //
          }
          break;
        case "znotes_prev_command":
          gBrowser.webNavigation.goBack();
          break;
        case "znotes_next_command":
          gBrowser.webNavigation.goForward();        
          break;
        case "znotes_stop_command":
          gBrowser.webNavigation.stop( nsIWebNavigation.STOP_ALL );
          break;
        case "znotes_reload_command":
          gBrowser.webNavigation.reload(
            nsIWebNavigation.LOAD_FLAGS_NONE );
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
        Components.utils.reportError(
          "An error occurred registering '" + this.getName() +
          "' controller: " + e
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
        Components.utils.reportError(
          "An error occurred unregistering '" + this.getName() +
          "' controller: " + e
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
      aSubject.QueryInterface( Components.interfaces.nsIHttpChannel );
      var url = aSubject.URI.spec;
      switch ( aTopic ) {
        case "http-on-modify-request":
          // aSubject.setRequestHeader(
          //   "Referer", "http://referer.com", false );
          // aSubject.cancel( Components.results.NS_BINDING_ABORTED );
          break;
        case "http-on-examine-response":
          // aSubject.setRequestHeader(
          //   "Referer", "http://referer.com", false );
          // aSubject.cancel( Components.results.NS_BINDING_ABORTED );
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
      if ( aIID.equals( nsIWebProgressListener ) ||
           aIID.equals( nsIWebProgressListener2 ) ||
           aIID.equals( nsISupportsWeakReference ) ||
           aIID.equals( nsISupports ) ) {
        return this;
      }
      throw Components.results.NS_NOINTERFACE;
    },
    onLocationChange: function( aWebProgress, aRequest, aLocation,
                                aFlags ) {
      // if ( aRequest && !Components.isSuccessCode( aRequest.status ) ) {
      //   load failure
      // }
      // if ( aRequest instanceof Components.interfaces.nsHTTPChannel ) {
      //   test aRequest.responseStatus ( HTTP STATUS )
      // }
      // if ( aFlags & nsIWebProgressListener.LOCATION_CHANGE_SAME_DOCUMENT ) {
      //   anchor clicked!
      // }
      var location = Utils.getURLFromURI( aLocation );
      if ( location ) {
        browserURLTextBox.value = location;
        browserURLTextBox.select();
        updateCommands();
      }
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
      aWebProgress.DOMWindow.location.assign( aRefreshURI.spec );
      // BUG: return PR_TRUE still cancel redirect
      // var aResult =
      //   Components.classes["@mozilla.org/supports-PRBool;1"]
      //             .createInstance( Components.interfaces.nsISupportsPRBool );
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
      if ( aStateFlags & nsIWebProgressListener.STATE_STOP ) {
        if ( aStateFlags & nsIWebProgressListener.STATE_IS_DOCUMENT ) {
          browserSpinner.setAttribute( "src", getFavoriteIconURL() );
          gBrowser.contentWindow.scrollbars.visible = true;
        }
        statusBarImage.className = "browserBlack";
        statusBarLabel.value = "";
      } else if ( aStateFlags & nsIWebProgressListener.STATE_START ) {
        if ( aStateFlags & nsIWebProgressListener.STATE_IS_DOCUMENT ) {
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
    gBrowser = document.getElementById( "gBrowser" );
    gBrowser.webNavigation.allowAuth = true;
    gBrowser.webNavigation.allowImages = true;
    gBrowser.webNavigation.allowJavascript = true;
    gBrowser.webNavigation.allowMetaRedirects = true;
    gBrowser.webNavigation.allowPlugins = true;
    gBrowser.webNavigation.allowSubframes = true;
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
    var nodeList = gBrowser.contentDocument.getElementsByTagName( "link" );
    for ( var i = 0; i < nodeList.length; i++ ) {
      if ( ( nodeList[i].getAttribute( "rel" ) === "icon" ) ||
           ( nodeList[i].getAttribute( "rel" ) === "shortcut icon" ) ) {
        result = nodeList[i].getAttribute( "href" );
        break;
      }
    }
    if ( result ) {
      var documentURI = ioService.newURI(
        gBrowser.contentDocument.documentURI,
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
    gBrowser.addEventListener( "mouseover", mouseOverHandler, false );
    gBrowser.addEventListener( "click", mouseClickHandler, false );
    gBrowser.addEventListener( "load", onBrowserLoad, true );
    gBrowser.docShell.QueryInterface( nsIWebProgress );
    gBrowser.docShell.addProgressListener( progressListener,
      nsIWebProgress.NOTIFY_ALL );
  };
  
  function removeEventListeners() {
    gBrowser.docShell.removeProgressListener( progressListener );
    gBrowser.removeEventListener( "load", onBrowserLoad, true );
    gBrowser.removeEventListener( "click", mouseClickHandler, false );
    gBrowser.removeEventListener( "mouseover", mouseOverHandler, false );
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
