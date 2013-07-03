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

ru.akman.znotes.Loader = function() {

  // !!!! %%%% !!!! STRINGS_BUNDLE
  return function( aWindow, aDocument, aStyle ) {

    var stringsBundle = ru.akman.znotes.Utils.STRINGS_BUNDLE;

    var currentWindow = null;
    var currentDocument = null;
    var currentStyle = {
      iconsize: "small"
    };
    
    var currentNote = null;
    var noteStateListener = null;

    var loaderBox = null;
    var url = null;
    var indicator = null;
    var log = null;
    var error = null;
    var cmdNoteImportAbort = null;
    
    function changeProgress( percent ) {
      indicator.value = percent;
    }
    
    // E V E N T S
    
    function onCmdNoteImportAbort( e ) {
      currentNote.loadAbort();
    };
    
    function onNoteStatusChanged( e ) {
      var aCategory = e.data.parentCategory;
      var aNote = e.data.changedNote;
      var oldStatus = e.data.oldValue;
      var newStatus = e.data.newValue;
      if ( currentNote != aNote ) {
        return;
      }
      changeProgress( processStatus( newStatus, indicator.value ) );
    };
    
    function processStatus( status, percent ) {
      var text = status.timestamp.toLocaleTimeString() + ' ';
      switch ( status.type ) {
        case "status" :
          // status
          // message
          text += status.message + "\n";
          log.value = text + log.value;
          break;
        case "location" :
          // location
          // flags
          text += status.location.spec + "\n";
          log.value = text + log.value;
          break;
        case "security" :
          // state
          break;
        case "state" :
          // state
          // status
          break;
        case "progress" :
          // currentSelfProgress
          // maximumSelfProgress
          // currentTotalProgress
          // maximumTotalProgress
          percent = ( percent == 90 ) ? 10 : ( percent + 10 );
          break;
        case "success" :
          percent = 100;
          break;
        case "error" :
          // message
          text += status.message + "\n";
          log.value = text + log.value;
          error.value = status.message;
          error.removeAttribute( "collapsed" );
          break;
        case "abort" :
          error.value = "ABORTED";
          error.removeAttribute( "collapsed" );
          text += error.value + "\n";
          log.value = text + log.value;
          break;
      }
      return percent;
    };
    
    // V I E W
    
    function enableView() {
    };
    
    function showView() {
      url.value = currentNote.getOrigin();
      error.value = "";
      error.setAttribute( "collapsed", "true" );
      log.value = "";
      indicator.value = 0;
      loaderBox.style.setProperty( "background-color", currentNote.getMainTagColor() );
      var history = currentNote.loadingProgress;
      var percent = 0;
      for ( var i = 0; i < history.length; i++ ) {
        percent = processStatus( history[i], percent );
      }
      changeProgress( percent );
      enableView();
    };

    function disableView() {
    };
    
    function hideView() {
      disableView();
    };
    
    // L O A D E R
    
    function open() {
      addEventListeners();
    };

    function close() {
      removeEventListeners();
      currentNote = null;
    };
    
    // E V E N T  L I S T E N E R S
    
    function addEventListeners() {
      cmdNoteImportAbort.addEventListener( "command", onCmdNoteImportAbort, false );
      if ( currentNote ) {
        currentNote.addStateListener( noteStateListener );
      }
    };

    function removeEventListeners() {
      cmdNoteImportAbort.removeEventListener( "command", onCmdNoteImportAbort, false );
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
     * Open a note and show it in the loader's view
     */
    this.show = function( aNote ) {
      this.unload();
      currentNote = aNote;
      if ( currentNote && currentNote.isExists() && currentNote.isLoading() ) {
        showView();
        open();
      } else {
        hideView();
      }
    };

    /**
     * Close the current note and hide the loader's view
     */
    this.hide = function() {
      this.unload();
      hideView();
    }
    
    /**
     * Close the current note
     */
    this.unload = function() {
      if ( currentNote ) {
        close();
      }
    };

    // C O N S T R U C T O R

    currentWindow = aWindow;
    currentDocument = aDocument;
    if ( aStyle ) {
      ru.akman.znotes.Utils.copyObject( aStyle, currentStyle );
    }
    noteStateListener = {
      name: "LOADER",
      onNoteStatusChanged: onNoteStatusChanged
    };
    loaderBox = currentDocument.getElementById( "loaderBox" );
    url = currentDocument.getElementById( "url" );
    indicator = currentDocument.getElementById( "indicator" );
    log = currentDocument.getElementById( "log" );
    error = currentDocument.getElementById( "error" );
    cmdNoteImportAbort = currentDocument.getElementById( "cmdNoteImportAbort" );
    
  };

}();
