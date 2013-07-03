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

ru.akman.znotes.AdViewer = function() {

  return function( aWindow, aDocument, aStyle ) {

    // !!!! %%%% !!!! STRINGS_BUNDLE
    var stringsBundle = ru.akman.znotes.Utils.STRINGS_BUNDLE;
    var log = ru.akman.znotes.Utils.log;

    var currentStyle = {
      iconsize: "small"
    };

    var currentNote = null;
    var noteStateListener = null;

    var adBrowser = null;
    
    // N O T E  E V E N T S

    function onNoteDeleted( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.deletedNote;
      if ( currentNote && currentNote == aNote ) {
        this.unload();
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
    
    // C O N T E N T

    function onClick( event ) {
      if ( !event.isTrusted ) {
        event.stopPropagation();
        event.preventDefault();
        return false;
      }
      var href = ru.akman.znotes.Utils.getHREFForClickEvent( event );
      if ( !href ) {
        return true;
      }
      event.stopPropagation();
      event.preventDefault();
      var svc = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"]
                          .getService( Components.interfaces.nsIExternalProtocolService );
      var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                                .getService( Components.interfaces.nsIIOService );
      var uri = ioService.newURI( href, null, null );
      if ( uri.schemeIs( "znotes" ) || uri.schemeIs( "chrome" ) ) {
        return false;
      }
      ru.akman.znotes.Utils.openLinkExternally( href );
      return false;
    };
    
    function onLoad( event ) {
      adBrowser.removeEventListener( "load", onLoad, false );
      adBrowser.contentDocument.body.style.setProperty(
        'background-color',
        'white'
      );
    };
    
    function createPostData( keywords ) {
      var stringStream = Components.classes["@mozilla.org/io/string-input-stream;1"]
                                   .createInstance( Components.interfaces.nsIStringInputStream );
      stringStream.data = "keywords=" + encodeURIComponent( keywords.join( " " ) );
      var result = Components.classes["@mozilla.org/network/mime-input-stream;1"]
                             .createInstance( Components.interfaces.nsIMIMEInputStream );
      result.addHeader( "Content-Type", "application/x-www-form-urlencoded" );
      result.addContentLength = true;
      result.setData( stringStream );
      return result;
    };
    
    function load() {
      var ciWN = Components.interfaces.nsIWebNavigation;
      var language = ru.akman.znotes.Utils.getLanguage();
      var keywords = currentNote.getKeyWords();
      var url = ru.akman.znotes.Utils.SITE +
                "adv/?language=" +
                encodeURIComponent( language );
      try {
        // BUG ?!
        // Thunderbird :: adBrowser.webNavigation.sessionHistory === null
        // XULRunner :: adBrowser.webNavigation.sessionHistory !== null
        if ( !adBrowser.webNavigation.sessionHistory ) {
          var sessionHistory = Components.classes["@mozilla.org/browser/shistory;1"]
                                         .createInstance( Components.interfaces.nsISHistory );
          try {
            // * EXCEPTION *
            adBrowser.webNavigation.sessionHistory = sessionHistory;
          } catch ( e ) {
            log( e );
          }
        }
        adBrowser.addEventListener( "load", onLoad, false );
        adBrowser.webNavigation.loadURI(
          url,
          ciWN.LOAD_FLAGS_BYPASS_CACHE,
          null,
          createPostData( keywords ),
          null
        );
      } catch ( e ) {
        log( e );
      }
    };

    // V I E W

    function updateView() {
      if ( ru.akman.znotes.Utils.IS_AD_ENABLED ) {
      } else {
      }
    };
    
    function enableView() {
    };
    
    function disableView() {
    };

    function showView() {
      addonsTabAd.removeAttribute( "hidden" );
      noteAdViewPanel.removeAttribute( "hidden" );
      enableView();
    };

    function hideView() {
      addonsTabAd.setAttribute( "hidden", "true" );
      noteAdViewPanel.setAttribute( "hidden", "true" );
      disableView();
    };

    function open() {
      addEventListeners();
      load();
    };

    function close() {
      removeEventListeners();
      currentNote = null;
    };

    // E V E N T  L I S T E N E R S
    
    function addEventListeners() {
      adBrowser.addEventListener( "click", onClick, true );
      if ( currentNote ) {
        currentNote.addStateListener( noteStateListener );
      }
    };

    function removeEventListeners() {
      adBrowser.removeEventListener( "click", onClick, true );
      if ( currentNote ) {
        currentNote.removeStateListener( noteStateListener );
      }
    };
    
    // P U B L I C  M E T H O D S

    /**
     * Update style of toolbars
     * @param style { iconsize: "small" || "normal" }
     */
    this.updateStyle = function( style ) {
      ru.akman.znotes.Utils.copyObject( style, currentStyle );
    };
    
    /**
     * Enable buttons in parent toolbars if they placed there
     */
    this.enable = function() {
      enableView();
    };

    /**
     * Disable buttons in parent toolbars if they placed there
     */
    this.disable = function() {
      disableView();
    };
    
    /**
     * Open a note and show it in the editor's view
     */
    this.show = function( aNote ) {
      this.unload();
      currentNote = aNote;
      if ( ru.akman.znotes.Utils.IS_AD_ENABLED && currentNote && currentNote.isExists() ) {
        showView();
        open();
      } else {
        hideView();
      }
    };

    /**
     * Close the current note and hide the editor's view
     */
    this.hide = function() {
      this.unload();
      hideView();
    };

    /**
     * Close the current note
     */
    this.unload = function() {
      if ( currentNote ) {
        close();
      }
    };

    // C O N S T R U C T O R  ( aWindow, aDocument, aStyle )

    if ( aStyle ) {
      ru.akman.znotes.Utils.copyObject( aStyle, currentStyle );
    }
    addonsTabAd = aDocument.getElementById( "addonsTabAd" );
    noteAdViewPanel = aDocument.getElementById( "noteAdViewPanel" );
    adBrowser = aDocument.getElementById( "adBrowser" );
    noteStateListener = {
      name: "ADVIEWER",
      onNoteDeleted: onNoteDeleted,
      onNoteChanged: onNoteChanged,
      onNoteTagsChanged: onNoteTagsChanged,
      onNoteMainContentChanged: onNoteMainContentChanged
    };
    updateView();
    
  };

}();
