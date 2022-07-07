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

ru.akman.znotes.Clipper = function() {

  var pub = {};

  var Utils = ru.akman.znotes.Utils;
  var Common = ru.akman.znotes.Common;

  var log = Utils.getLogger( "content.clipper" );

  var ioService =
    Cc["@mozilla.org/network/io-service;1"].getService( Ci.nsIIOService );

  var alertObserver = null;
  var aContext = null;
  var aBrowser = null;
  var aBundle = null;
  var isLoading = false;
  var aPopup = null;
  var aButton = null;

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
    },
    onProgressChange: function( aWebProgress, aRequest, aCurSelfProgress,
                                aMaxSelfProgress, aCurTotalProgress,
                                aMaxTotalProgress ) {
      return this.onProgressChange64(
                                aWebProgress, aRequest, aCurSelfProgress,
                                aMaxSelfProgress, aCurTotalProgress,
                                aMaxTotalProgress );
    },
    onProgressChange64: function( aWebProgress, aRequest, aCurSelfProgress,
                                  aMaxSelfProgress, aCurTotalProgress,
                                  aMaxTotalProgress ) {
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
    },
    onSecurityChange: function( aWebProgress, aRequest, aState ) {
    },
    onStatusChange: function( aWebProgress, aRequest, aStatus, aMessage ) {
    },
    onStateChange: function( aWebProgress, aRequest, aStateFlags,
                             aStatus ) {
      if ( aStateFlags & Ci.nsIWebProgressListener.STATE_STOP &&
           ( aStateFlags & Ci.nsIWebProgressListener.STATE_IS_WINDOW ||
             aStateFlags & Ci.nsIWebProgressListener.STATE_IS_DOCUMENT ) ) {
        isLoading = false;
        updateCommands();
      } else if ( aStateFlags & Ci.nsIWebProgressListener.STATE_START &&
                  aStateFlags & Ci.nsIWebProgressListener.STATE_IS_NETWORK ) {
        isLoading = true;
        updateCommands();
      }
    }
  };

  // ALERT OBSERVER

  function setupAlertObserver() {
    alertObserver = {
      observe: function( subject, topic, data ) {
        var params;
        switch ( topic ) {
          case "alertclickcallback":
            if ( !Utils.IS_STANDALONE ) {
              Utils.switchToMainTab();
            }
            params = Common.createCommandParamsObject();
            if ( params ) {
              params.setStringValue( "id", data );
              Common.goDoCommandWithParams(
                "znotes_savemessage_command",
                params,
                aContext.window.document.getElementById( "znotes_dummy_command" )
              );
            }
            break;
        }
      }
    };
  };

  // COMMANDS

  var clipperCommands = {
    "znotes_clippersave_command": null,
    "znotes_clippersaveall_command": null
  };

  var clipperController = {
    supportsCommand: function( cmd ) {
      if ( !( cmd in clipperCommands ) ) {
        return false;
      }
      return true;
    },
    isCommandEnabled: function( cmd ) {
      if ( !( cmd in clipperCommands ) ) {
        return false;
      }
      var uri = ioService.newURI(
        aBrowser.contentDocument.documentURI, null, null );
      return !isLoading && !uri.schemeIs( "about" );
    },
    doCommand: function( cmd ) {
      if ( !( cmd in clipperCommands ) ) {
        return;
      }
      switch ( cmd ) {
        case "znotes_clippersave_command":
          if ( aPopup.state === "open" ) {
            aPopup.hidePopup();
          } else {
            aPopup.openPopup( aButton,
              "after_start", 0, 0, false, false, null );
          }
          break;
        case "znotes_clippersaveall_command":
          doSaveDocument();
          break;
      }
      this.updateCommands();
    },
    onEvent: function( event ) {
    },
    getName: function() {
      return "CLIPPER";
    },
    getCommand: function( cmd ) {
      if ( cmd in clipperCommands ) {
        return document.getElementById( cmd );
      }
      return null;
    },
    updateCommands: function() {
      for ( var cmd in clipperCommands ) {
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
      for ( var cmd in clipperCommands ) {
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
    clipperController.updateCommands();
  };

  function doSaveDocument() {
    var aParams, anIndex, aSuffix, aNote = null;
    var anInfo = selectNote();
    if ( !anInfo ) {
      return;
    }
    try {
      if ( !anInfo.aCategory.canCreateNote( anInfo.aName, anInfo.aType ) ) {
        aNote = anInfo.aCategory.getNoteByName( anInfo.aName );
        if ( !aNote ) {
          throw Cr.NS_ERROR_UNEXPECTED;
        }
        aParams = {
          input: {
            kind: 2,
            title: getString( "confirmOverwrite.title" ),
            message1: getString( "confirmOverwrite.message1" ),
            message2: getString( "confirmOverwrite.message2" )
          },
          output: null
        };
        window.openDialog(
          "chrome://znotes/content/confirmdialog.xul",
          "",
          "chrome,dialog=yes,modal=yes,centerscreen,resizable=no",
          aParams
        ).focus();
        if ( !aParams.output ) {
          return;
        }
        if ( aParams.output.result ) {
          aNote.remove();
        } else {
          anIndex = 2;
          aSuffix = " (" + anIndex++ + ")";
          while ( !anInfo.aCategory.canCreateNote( anInfo.aName + aSuffix,
                  anInfo.aType ) ) {
            aSuffix = " (" + anIndex++ + ")";
          }
          anInfo.aName = anInfo.aName + aSuffix;
        }
      }
      aNote = anInfo.aCategory.createNote( anInfo.aName, anInfo.aType );
      aNote.setTags( anInfo.aTags );
    } catch ( e ) {
      aParams = {
        input: {
          title: getString( "createError.title" ),
          message1: getString( "createError.message" ),
          message2: e
        },
        output: null
      };
      window.openDialog(
        "chrome://znotes/content/messagedialog.xul",
        "",
        "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
        aParams
      ).focus();
      return;
    }
    saveDocument( aBrowser.contentDocument, aNote );
  };

  // CLIPPER

  function saveDocument( aDocument, aNote ) {
    var contentEntries, contentFile, contentDirectory;
    var aResult = {
      value: null,
      status: 0
    };
    var id = aNote.getBook().getId() + "&" + aNote.getId();
    var mimeService = Cc["@mozilla.org/mime;1"].getService( Ci.nsIMIMEService );
    var contentExtension =
      mimeService.getPrimaryExtension( aDocument.contentType, null );
    contentExtension = ( contentExtension ? contentExtension : "html" );
    try {
      contentEntries =
        Utils.getEntriesToSaveContent( "." + contentExtension, "_files" );
      contentFile = contentEntries.fileEntry;
      contentDirectory = contentEntries.directoryEntry;
      window.openDialog(
        "chrome://znotes/content/clipperdialog.xul",
        "",
        "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
        {
          document: aDocument,
          result: aResult,
          file: contentFile,
          directory: contentDirectory,
          flags: Utils.CLIPPER_FLAGS,
          baseURI: aNote.getBaseURI(),
          onstart: function( result ) {
            aNote.setOrigin( aDocument.location.toString() );
            aNote.setLoading( true );
          },
          onstop: function( result ) {
            try {
              aNote.loadContentDirectory( contentDirectory );
            } catch ( e ) {
              log.warn( e + "\n" + Utils.dumpStack() );
            }
            try {
              aNote.importDocument( result.value, {
                documentURI: aDocument.documentURI,
                lang: false,
                author: false
              } );
            } catch ( e ) {
              log.warn( e + "\n" + Utils.dumpStack() );
            }
            try {
              if ( contentFile.exists() ) {
                contentFile.remove( false );
              }
              if ( contentDirectory.exists() ) {
                contentDirectory.remove( true );
              }
            } catch ( e ) {
              log.warn( e + "\n" + Utils.dumpStack() );
            }
            aNote.setLoading( false );
            if ( result.status ) {
              notifyFail( id, result.count, result.errors );
            } else {
              notifySuccess( id, result.count );
            }
          }
        }
      ).focus();
      if ( Utils.IS_CLOSE_BROWSER_AFTER_IMPORT ) {
        window.close();
      }
    } catch ( e ) {
      log.warn( e + "\n" + Utils.dumpStack() );
    }
  };

  // HELPERS

  function getString( name ) {
    return aBundle.getString( name );
  };

  function getFormattedString( name, values ) {
    return aBundle.getFormattedString( name, values );
  };
  
  function notifyFail( id, count, errors ) {
    if ( Utils.IS_CLIPPER_PLAY_SOUND ) {
      Utils.play( "chrome://znotes_sounds/skin/fail.wav" );
    }
    Utils.showPopup(
      "chrome://znotes_images/skin/warning-32x32.png",
      getFormattedString( "savePopup.fail", [ errors, count ] ),
      aBrowser.contentDocument.location.toString(),
      true,
      id,
      0,
      null,
      null,
      null,
      alertObserver
    );
  };
  
  function notifySuccess( id, count ) {
    if ( Utils.IS_CLIPPER_PLAY_SOUND ) {
      Utils.play( "chrome://znotes_sounds/skin/success.wav" );
    }
    Utils.showPopup(
      "chrome://znotes_images/skin/message-32x32.png",
      getFormattedString( "savePopup.success", [ count ] ),
      aBrowser.contentDocument.location.toString(),
      true,
      id,
      0,
      null,
      null,
      null,
      alertObserver
    );
  };
  
  function selectNote() {
    var aName = aBrowser.contentDocument.title.trim();
    if ( !aName ) {
      aName = aBrowser.contentDocument.documentURI;
    }
    var params = {
      input: {
        title: getString( "savedialog.title" ),
        canOverwrite: true,
        aBook: ( aContext ? aContext.book : null ),
        aCategory: ( aContext ? aContext.category : null ),
        aTag: ( aContext ? aContext.tag : null ),
        aNote: ( aContext ? aContext.note : null ),
        aName: aName,
        aType: "application/xhtml+xml"
      },
      output: null
    };
    window.openDialog(
      "chrome://znotes/content/opensavedialog.xul?mode=save&type=note",
      "",
      "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
      params
    ).focus();
    return params.output;
  };

  // PUBLIC

  pub.onLoad = function() {
    aContext = Utils.MAIN_CONTEXT ? Utils.MAIN_CONTEXT() : null;
    aBrowser = document.getElementById( "zBrowser" );
    aPopup = document.getElementById( "znotes_clippersave_menupopup" );
    aButton = document.getElementById( "znotes_clippersave_button" );
    aBundle = document.getElementById( "znotes_clipper_stringbundle" );
    clipperController.register();
    aBrowser.docShell.QueryInterface( Ci.nsIWebProgress );
    aBrowser.docShell.addProgressListener( progressListener,
      Ci.nsIWebProgress.NOTIFY_ALL );
    setupAlertObserver();
    updateCommands();
  };

  pub.onUnload = function() {
    if ( aBrowser && aBrowser.docShell ) {
      aBrowser.docShell.removeProgressListener( progressListener );
    }
    if ( clipperController ) {
      clipperController.unregister();
    }
  };

  return pub;

}();

window.addEventListener( "load", ru.akman.znotes.Clipper.onLoad, false );
window.addEventListener( "unload", ru.akman.znotes.Clipper.onUnload, false );
