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
if ( !ru.akman.znotes.core ) ru.akman.znotes.core = {};

Cu.import( "resource://znotes/utils.js", ru.akman.znotes );
Cu.import( "resource://znotes/keyset.js", ru.akman.znotes );
Cu.import( "resource://znotes/clipper.js", ru.akman.znotes.core );

ru.akman.znotes.ClipperDialog = function() {

  var Utils = ru.akman.znotes.Utils;
  var Common = ru.akman.znotes.Common;

  var log = Utils.getLogger( "content.clipperdialog" );

  var ioService =
    Cc["@mozilla.org/network/io-service;1"].getService( Ci.nsIIOService );

  var aDocument, aResult, aFile, aDirectory, aFlags, aBaseURI, onStart, onStop;
  var aClipper, anObserver;
  var jobList, btnClose, btnCancel;

  var canClose = false;

  // KEYSET

  var dialogKeyset = {
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

  var dialogCommands = {
    "znotes_copy_command": null,
    "znotes_selectall_command": null
  };

  var dialogController = {
    supportsCommand: function( cmd ) {
      if ( !( cmd in dialogCommands ) ) {
        return false;
      }
      return true;
    },
    isCommandEnabled: function( cmd ) {
      if ( !( cmd in dialogCommands ) ) {
        return false;
      }
      switch ( cmd ) {
        case "znotes_copy_command":
          return true;
        case "znotes_selectall_command":
          return true;
      }
      return true;
    },
    doCommand: function( cmd ) {
      if ( !( cmd in dialogCommands ) ) {
        return;
      }
      switch ( cmd ) {
        case "znotes_copy_command":
          copySelectedItemsToClipboard();
          break;
        case "znotes_selectall_command":
          selectAllItems();
          break;
      }
      this.updateCommands();
    },
    onEvent: function( event ) {
    },
    getName: function() {
      return "CLIPPERDIALOG";
    },
    getCommand: function( cmd ) {
      if ( cmd in dialogCommands ) {
        return document.getElementById( cmd );
      }
      return null;
    },
    updateCommands: function() {
      for ( var cmd in dialogCommands ) {
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
      for ( var cmd in dialogCommands ) {
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
    dialogController.updateCommands();
  };
  
  // LOADER OBSERVER

  function onLoaderStarted( anEvent ) {
    btnClose.setAttribute( "collapsed", "true" );
    btnCancel.removeAttribute( "collapsed" );
    canClose = false;
    if ( onStart ) {
      onStart( aResult );
    }
  };

  function onLoaderStopped( anEvent ) {
    aResult.status = anEvent.getData().status;
    if ( onStop ) {
      onStop( aResult );
    }
    canClose = true;
    if ( !aResult.status ) {
      window.close();
    }
    btnCancel.setAttribute( "collapsed", "true" );
    btnClose.removeAttribute( "collapsed" );
  };

  function onGroupStarted( anEvent ) {
    var id = anEvent.getData().id;
  };

  function onGroupStopped( anEvent ) {
    var id = anEvent.getData().id;
  };

  function onJobCreated( anEvent ) {
    var id, url, uri;
    var jobItem, jobBox, jobLabel;
    var jobImg, jobImage, jobSpacer1, jobSpacer2;
    var aData = anEvent.getData();
    var aJob = aData.job;
    id = aJob.getId();
    uri = ioService.newURI( aJob.getURL(), null, null );
    try {
      uri.QueryInterface( Ci.nsIURL );
      url = uri.spec;
    } catch ( e ) {
      url = uri.scheme + "://";
    }
    jobItem = document.createElement( "richlistitem" );
    jobItem.setAttribute( "id", id );
    jobItem.setAttribute( "class", "item" );
    jobItem.setAttribute( "orient", "horizontal" );
    jobItem.setAttribute( "value", id );
    jobImg = document.createElement( "vbox" );
    jobImg.setAttribute( "id", "image_box_" + id );
    jobImg.setAttribute( "class", "image_box" );
    jobSpacer1 = document.createElement( "spacer" );
    jobSpacer1.setAttribute( "id", "spacer1_" + id );
    jobSpacer1.setAttribute( "flex", "1" );
    jobSpacer2 = document.createElement( "spacer" );
    jobSpacer2.setAttribute( "id", "spacer2_" + id );
    jobSpacer2.setAttribute( "flex", "1" );
    jobImage = document.createElement( "image" );
    jobImage.setAttribute( "id", "img_" + id );
    jobImage.setAttribute( "class", "spinner" );
    jobImg.appendChild( jobSpacer1 );
    jobImg.appendChild( jobImage );
    jobImg.appendChild( jobSpacer2 );
    jobBox = document.createElement( "vbox" );
    jobBox.setAttribute( "id", "label_box_" + id );
    jobBox.setAttribute( "flex", "1" );
    jobBox.setAttribute( "class", "box" );
    jobLabel = document.createElement( "label" );
    jobLabel.setAttribute( "id", "name_" + id );
    jobLabel.setAttribute( "class", "name" );
    jobLabel.setAttribute( "crop", "center" );
    jobLabel.setAttribute( "value", "" );
    jobLabel.setAttribute( "collapsed", "true" );
    jobBox.appendChild( jobLabel );
    jobLabel = document.createElement( "label" );
    jobLabel.setAttribute( "id", "url_" + id );
    jobLabel.setAttribute( "crop", "center" );
    jobLabel.setAttribute( "value", url );
    jobBox.appendChild( jobLabel );
    jobItem.appendChild( jobImg );
    jobItem.appendChild( jobBox );
    jobList.insertBefore( jobItem, jobList.firstChild );
  };

  function onJobStarted( anEvent ) {
    var aData = anEvent.getData();
    var aJob = aData.job;
    var id = aJob.getId();
    var jobLabel, jobProgress;
    var jobItem = document.getElementById( id );
    var jobBox = jobItem.childNodes[1];
    if ( jobBox.childNodes.length === 2 ) {
      jobLabel = jobBox.childNodes[0];
      jobLabel.setAttribute( "value", aJob.getEntry().leafName );
      jobLabel.removeAttribute( "collapsed" );
      jobLabel = jobBox.childNodes[1];
      jobLabel.setAttribute( "class", "url" );
      jobProgress = document.createElement( "progressmeter" );
      jobProgress.setAttribute( "id", "progress_" + id );
      jobProgress.setAttribute( "class", "progress" );
      jobBox.appendChild( jobProgress );
      jobProgress.value = 0;
    }
  };

  function onJobProgress( anEvent ) {
    var aData = anEvent.getData();
    var aJob = aData.job;
    var aCurSelfProgress = aData.curSelfProgress;
    var aMaxSelfProgress = aData.maxSelfProgress;
    var aCurTotalProgress = aData.curTotalProgress;
    var aMaxTotalProgress = aData.maxTotalProgress;
    var id = aJob.getId();
    var jobProgress;
    var jobItem = document.getElementById( id );
    var jobBox = jobItem.childNodes[1];
    if ( jobBox.childNodes.length === 3 ) {
      jobProgress = jobBox.childNodes[2];
      /**
       * aMaxSelfProgress === aMaxTotalProgress
       *   The length of the data if available
       *   a value of -1 indicates that the content length is unknown
       * aCurSelfProgress
       *   The number of bytes that currently were sent
       * aCurTotalProgress
       *   Total number of bytes that were sent
       */
      if ( aMaxTotalProgress > 0 ) {
        jobProgress.mode = "determined";
        jobProgress.value = Math.round(
          ( aCurSelfProgress + aCurTotalProgress ) / aMaxTotalProgress * 100
        );
      } else {
        jobProgress.mode = "undetermined";
      }
    }
  };

  function onJobStopped( anEvent ) {
    var aData = anEvent.getData();
    var aJob = aData.job;
    var id = aJob.getId();
    var status = aJob.getStatus();
    var statusText = aJob.getStatusText();
    var jobLabel, jobProgress;
    var jobItem = document.getElementById( id );
    var jobImage = jobItem.childNodes[0].childNodes[1];
    var jobBox = jobItem.childNodes[1];
    if ( !status ) {
      jobImage.setAttribute( "class", "ok" );
      if ( jobBox.childNodes.length === 3 ) {
        jobProgress = jobBox.childNodes[2];
        jobProgress.value = 100;
      }
    } else {
      jobImage.setAttribute( "class", "fail" );
      jobLabel = jobBox.childNodes[0];
      jobLabel.setAttribute( "value",
        statusText ? statusText : Utils.getErrorName( status ) );
      jobLabel.classList.add( "error" );
      if ( jobBox.childNodes.length === 3 ) {
        jobProgress = jobBox.childNodes[2];
        jobProgress.setAttribute( "collapsed", "true" );
      }
      jobList.insertBefore( jobList.removeChild( jobItem ),
        jobList.firstChild );
    }
  };

  function onJobRemoved( anEvent ) {
    var aData = anEvent.getData();
    var aJob = aData.job;
    var id = aJob.getId();
    var jobItem = document.getElementById( id );
    jobItem.parentNode.removeChild( jobItem );
  };

  function onJobListDblClick( anEvent ) {
    copySelectedItemsToClipboard();
  };
  
  function onJobListContextMenu( anEvent ) {
    var box, target = anEvent.target;
    while ( target && target.localName !== "richlistitem" ) {
      target = target.parentNode;
    }
    if ( !target ) {
      return;
    }
    document.getElementById( "znotes_edit_menupopup" ).openPopup(
      null,
      "after_pointer",
      anEvent.clientX,
      anEvent.clientY,
      true,
      true,
      anEvent
    );
  };
  
  // HELPERS

  function selectAllItems() {
    jobList.selectAll();
  };
  
  function copySelectedItemsToClipboard() {
    var box, lines = [], items = jobList.selectedItems;
    for each ( var item in items ) {
      box = item.childNodes[1];
      lines.push(
        box.childNodes[0].value + "\n" + box.childNodes[1].value
      );
    }
    if ( lines.length ) {
      copyToClipboard( lines.join( "\n" ) );
    }
  };
  
  function copyToClipboard( textData ) {
    var clipboard, transferable, textSupportsString;
    try {
      clipboard =
        Cc['@mozilla.org/widget/clipboard;1']
        .createInstance( Ci.nsIClipboard );
      transferable = Components.Constructor(
        "@mozilla.org/widget/transferable;1",
        "nsITransferable"
      )();
      textSupportsString = Components.Constructor(
        "@mozilla.org/supports-string;1",
        "nsISupportsString"
      )();
      transferable.init(
        window.QueryInterface( Ci.nsIInterfaceRequestor ).getInterface(
          Ci.nsIWebNavigation )
      );
      transferable.addDataFlavor( "text/unicode" );
      textSupportsString.data = textData;
      transferable.setTransferData(
        "text/unicode", textSupportsString, textData.length * 2 );
      clipboard.setData( transferable, null, clipboard.kGlobalClipboard );
    } catch ( e ) {
      log.warn( e );
    }
  };
  
  // PUBLIC

  var pub = {};

  pub.onLoad = function() {
    aDocument = window.arguments[0].document;
    aResult = window.arguments[0].result;
    aFile = window.arguments[0].file;
    aDirectory = window.arguments[0].directory;
    aFlags = window.arguments[0].flags;
    aBaseURI = window.arguments[0].baseURI;
    onStart = window.arguments[0].onstart;
    onStop = window.arguments[0].onstop;
    btnCancel = document.getElementById( "btnCancel" );
    btnClose = document.getElementById( "btnClose" );
    jobList = document.getElementById( "jobList" );
    jobList.addEventListener( "dblclick", onJobListDblClick, true );
    jobList.addEventListener( "contextmenu", onJobListContextMenu, true );
    jobList.selectedIndex = -1;
    jobList.currentIndex = -1;
    dialogKeyset.setup();
    dialogKeyset.update();
    dialogKeyset.activate();
    dialogController.register();
    updateCommands();
    anObserver = {
      onLoaderStarted: onLoaderStarted,
      onLoaderStopped: onLoaderStopped,
      onGroupStarted: onGroupStarted,
      onGroupStopped: onGroupStopped,
      onJobCreated: onJobCreated,
      onJobStarted: onJobStarted,
      onJobProgress: onJobProgress,
      onJobStopped: onJobStopped,
      onJobRemoved: onJobRemoved,
    };
    aClipper = new ru.akman.znotes.core.Clipper();
    try {
      aClipper.save(
        aDocument,
        aResult,
        aFile,
        aDirectory,
        aFlags,
        aBaseURI,
        anObserver
      );
    } catch ( e ) {
      aClipper.abort();
      log.warn( e + "\n" + Utils.dumpStack() );
    }
  };

  pub.onClose = function( event ) {
    if ( canClose ) {
      return true;
    }
    dialogKeyset.deactivate();
    dialogController.unregister();
    jobList.removeEventListener( "contextmenu", onJobListContextMenu, true );
    jobList.removeEventListener( "dblclick", onJobListDblClick, true );
    event.stopPropagation();
    event.preventDefault();
    aClipper.abort();
    return false;
  };

  return pub;

}();

window.addEventListener( "load", ru.akman.znotes.ClipperDialog.onLoad, false );
window.addEventListener( "dialogcancel", ru.akman.znotes.ClipperDialog.onClose, true );
window.addEventListener( "dialogaccept", ru.akman.znotes.ClipperDialog.onClose, true );
window.addEventListener( "close", ru.akman.znotes.ClipperDialog.onClose, true );
