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

ru.akman.znotes.Relator = function( aWindow, aStyle ) {

  // !!!! %%%% !!!! IS_AD_ENABLED
  return function() {

    var Utils = ru.akman.znotes.Utils;
    var log = Utils.getLogger( "content.relator" );

    var Common = ru.akman.znotes.Common;

    var currentWindow = null;
    var currentStyle = null;

    var currentNote = null;

    var noteStateListener = null;

    var adBrowser = null;
    var noteAdViewPanel = null;
    var addonsTabAd = null;

    //
    // COMMANDS
    //

    var relatorCommands = {
    };

    var relatorController = {
      supportsCommand: function( cmd ) {
        if ( !( cmd in relatorCommands ) ) {
          return false;
        }
        return true;
        /*
        var focusedWindow = currentWindow.top.document.commandDispatcher.focusedWindow;
        return ( focusedWindow == currentWindow );
        */
      },
      isCommandEnabled: function( cmd ) {
        if ( !( cmd in relatorCommands ) ) {
          return false;
        }
        if ( !currentNote || currentNote.isLoading() ) {
          return false;
        }
        return false;
      },
      doCommand: function( cmd ) {
        if ( !( cmd in relatorCommands ) ) {
          return;
        }
      },
      onEvent: function( event ) {
      },
      getName: function() {
        return "RELATOR";
      },
      getCommand: function( cmd ) {
        if ( cmd in relatorCommands ) {
          return currentWindow.document.getElementById( cmd );
        }
        return null;
      },
      register: function() {
        try {
          currentWindow.controllers.insertControllerAt( 0, this );
          this.getId = function() {
            return currentWindow.controllers.getControllerId( this );
          };
        } catch ( e ) {
          log.warn(
            "An error occurred registering '" + this.getName() +
            "' controller\n" + e
          );
        }
      },
      unregister: function() {
        for ( var cmd in relatorCommands ) {
          Common.goSetCommandEnabled( cmd, false, currentWindow );
        }
        try {
          currentWindow.controllers.removeController( this );
        } catch ( e ) {
          log.warn(
            "An error occurred unregistering '" + this.getName() +
            "' controller\n" + e
          );
        }
      }
    };

    function updateCommands() {
    };

    // NOTE EVENTS

    function onNoteDeleted( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.deletedNote;
      if ( currentNote && currentNote == aNote ) {
      }
    };

    function onNoteChanged( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.changedNote;
      if ( currentNote && currentNote == aNote ) {
        load();
      }
    };

    function onNoteTagsChanged( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.changedNote;
      var oldTags = e.data.oldValue;
      var newTags = e.data.newValue;
      if ( currentNote && currentNote == aNote ) {
        load();
      }
    };

    function onNoteMainContentChanged( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.changedNote;
      var oldContent = e.data.oldValue;
      var newContent = e.data.newValue;
      if ( currentNote && currentNote == aNote ) {
        load();
      }
    };

    // BROWSER EVENTS

    function onClick( event ) {
      if ( !event.isTrusted ) {
        event.stopPropagation();
        event.preventDefault();
        return false;
      }
      var href = Utils.getHREFForClickEvent( event );
      if ( !href ) {
        return true;
      }
      event.stopPropagation();
      event.preventDefault();
      var svc =
        Cc["@mozilla.org/uriloader/external-protocol-service;1"]
        .getService( Ci.nsIExternalProtocolService );
      var ioService =
        Cc["@mozilla.org/network/io-service;1"]
        .getService( Ci.nsIIOService );
      var uri = ioService.newURI( href, null, null );
      if ( uri.schemeIs( "znotes" ) || uri.schemeIs( "chrome" ) ) {
        return false;
      }
      Utils.openLinkExternally( href );
      return false;
    };

    function onLoad( event ) {
      adBrowser.removeEventListener( "load", onLoad, true );
      /*
      var serializer =
        Cc["@mozilla.org/xmlextras/xmlserializer;1"]
        .createInstance( Ci.nsIDOMSerializer );
      log.debug( serializer.serializeToString( adBrowser.contentDocument ) );
      log.debug( "Done." );
      */
      if ( adBrowser.contentDocument.body ) {
        adBrowser.contentDocument.body.style.setProperty(
          'background-color',
          'white'
        );
      }
    };

    // DATA

    function createPostData( keywords ) {
      var stringStream =
        Cc["@mozilla.org/io/string-input-stream;1"]
        .createInstance( Ci.nsIStringInputStream );
      stringStream.data =
        "keywords=" + encodeURIComponent( keywords.join( " " ) );
      var result =
        Cc["@mozilla.org/network/mime-input-stream;1"]
        .createInstance( Ci.nsIMIMEInputStream );
      result.addHeader( "Content-Type", "application/x-www-form-urlencoded" );
      result.addContentLength = true;
      result.setData( stringStream );
      return result;
    };

    // VIEW

    function load() {
      if ( !Utils.IS_AD_ENABLED ) {
        return;
      }
      var language = encodeURIComponent( Utils.getLanguage() );
      var keywords = [ "test", "advertising", "keyword" ]; //currentNote.getKeyWords();
      var url = Utils.SITE + "adv/?language=" + language;
      //"&flag=" + ( new Date() ).getTime();
      //log.debug( "Loading: " + url );
      adBrowser.addEventListener( "load", onLoad, true );
      adBrowser.webNavigation.loadURI(
        url,
        Ci.nsIWebNavigation.LOAD_FLAGS_BYPASS_CACHE,
        null, // nsIURI referer
        createPostData( keywords ),
        null // nsIInputStream headers
      );
    };

    function showCurrentView() {
      load();
      adBrowser.removeAttribute( "disabled" );
    };

    function hideCurrentView() {
      adBrowser.setAttribute( "disabled", "true" );
    };

    function show( aNote, aForced ) {
      if ( currentNote && currentNote == aNote && !aForced ) {
        return;
      }
      removeEventListeners();
      currentNote = aNote;
      if ( currentNote && currentNote.isExists() ) {
        addEventListeners();
        showCurrentView();
      } else {
        hideCurrentView();
      }
      updateCommands();
    };

    // EVENT LISTENERS

    function addEventListeners() {
      if ( !currentNote ) {
        return;
      }
      adBrowser.addEventListener( "click", onClick, true );
      currentNote.addStateListener( noteStateListener );
    };

    function removeEventListeners() {
      if ( !currentNote ) {
        return;
      }
      adBrowser.removeEventListener( "click", onClick, true );
      currentNote.removeStateListener( noteStateListener );
    };

    // PUBLIC

    this.onStyleChanged = function( event ) {
    };

    this.onNoteChanged = function( event ) {
      var aNote = event.data.note;
      var aForced = event.data.forced;
      show( aNote, aForced );
    };

    this.onRelease = function( event ) {
      removeEventListeners();
      relatorController.unregister();
    };

    // CONSTRUCTOR ( aWindow, aStyle )

    currentWindow = aWindow ? aWindow : window;
    if ( aStyle ) {
      currentStyle = aStyle;
    }
    addonsTabAd = currentWindow.document.getElementById( "addonsTabAd" );
    noteAdViewPanel = currentWindow.document.getElementById( "noteAdViewPanel" );
    adBrowser = currentWindow.document.getElementById( "adBrowser" );
    noteStateListener = {
      name: "RELATOR",
      onNoteDeleted: onNoteDeleted,
      onNoteChanged: onNoteChanged,
      onNoteTagsChanged: onNoteTagsChanged,
      onNoteMainContentChanged: onNoteMainContentChanged
    };
    if ( Utils.IS_AD_ENABLED ) {
      addonsTabAd.removeAttribute( "hidden" );
      noteAdViewPanel.removeAttribute( "hidden" );
    } else {
      addonsTabAd.setAttribute( "hidden", "true" );
      noteAdViewPanel.setAttribute( "hidden", "true" );
    }
    relatorController.register();
  };

}();
