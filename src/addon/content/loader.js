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

ru.akman.znotes.Loader = function() {

  return function() {

    var Utils = ru.akman.znotes.Utils;
    var Common = ru.akman.znotes.Common;

    var currentNote = null;
    var noteStateListener = null;

    var loaderBox = null;
    var url = null;
    var indicator = null;
    var log = null;
    var error = null;
    
    //
    // COMMANDS
    //
    
    var loaderCommands = {
      "znotes_loaderabort_command": null
    };
    
    var loaderController = {
      supportsCommand: function( cmd ) {
        if ( !( cmd in loaderCommands ) ) {
          return false;
        }
        return true;
      },
      isCommandEnabled: function( cmd ) {
        if ( !( cmd in loaderCommands ) ) {
          return false;
        }
        if ( !currentNote || !currentNote.isLoading() ) {
          return false;
        }
        switch ( cmd ) {
          case "znotes_loaderabort_command":
            return true;
        }
        return false;
      },
      doCommand: function( cmd ) {
        if ( !( cmd in loaderCommands ) ) {
          return;
        }
        switch ( cmd ) {
          case "znotes_loaderabort_command":
            currentNote.loadAbort();
            break;
        }
      },
      onEvent: function( event ) {
      },
      getName: function() {
        return "LOADER";
      },
      getCommand: function( cmd ) {
        if ( cmd in loaderCommands ) {
          return document.getElementById( cmd );
        }
        return null;
      },
      register: function() {
        Utils.appendAccelText( loaderCommands, document );
        try {
          top.controllers.insertControllerAt( 0, this );
        } catch ( e ) {
          Components.utils.reportError(
            "An error occurred registering '" + this.getName() +
            "' controller: " + e
          );
        }
      },
      unregister: function() {
        try {
          top.controllers.removeController( this );
        } catch ( e ) {
          Components.utils.reportError(
            "An error occurred unregistering '" + this.getName() +
            "' controller: " + e
          );
        }
        Utils.removeAccelText( loaderCommands, document );
      }
    };
    
    function updateCommands() {
      window.focus();
      Common.goUpdateCommand( "znotes_loaderabort_command" );
    };
    
    // EVENTS
    
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
    
    function changeProgress( percent ) {
      indicator.value = percent;
    }
    
    // VIEW
    
    function showCurrentView() {
      loaderBox.removeAttribute( "disabled" );
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
    };
    
    function hideCurrentView() {
      loaderBox.setAttribute( "disabled", "true" );
    };
    
    function show( aNote, aForced ) {
      if ( currentNote && currentNote == aNote && !aForced ) {
        return;
      }
      removeEventListeners();
      currentNote = aNote;
      if ( currentNote && currentNote.isExists() &&
           currentNote.isLoading() ) {
        addEventListeners();
        showCurrentView();
      } else {
        hideCurrentView();
      }
      updateCommands();
    };
    
    // LISTENERS

    function addEventListeners() {
      if ( !currentNote ) {
        return;
      }
      currentNote.addStateListener( noteStateListener );
    };

    function removeEventListeners() {
      if ( !currentNote ) {
        return;
      }
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
      loaderController.unregister();
    };
        
    // CONSTRUCTOR

    noteStateListener = {
      name: "LOADER",
      onNoteStatusChanged: onNoteStatusChanged
    };
    loaderBox = document.getElementById( "loaderBox" );
    url = document.getElementById( "url" );
    indicator = document.getElementById( "indicator" );
    log = document.getElementById( "log" );
    error = document.getElementById( "error" );
    loaderController.register();
    
  };

}();
