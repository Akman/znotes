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
if ( !ru.akman.znotes.core ) ru.akman.znotes.core = {};

Components.utils.import( "resource://znotes/utils.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/clipper.js",
  ru.akman.znotes.core
);

ru.akman.znotes.ClipperDialog = function() {

  var Utils = ru.akman.znotes.Utils;
  
  var ioService =
    Components.classes["@mozilla.org/network/io-service;1"]
              .getService( Components.interfaces.nsIIOService );

  var aNote, aDocument, aFile, aDirectory, aFlags, aCallback;
  var aResultObj, aClipper, anObserver;
  var btnClose, btnCancel;
  var canClose = false;
  
  // OBSERVER
  
  function onLoaderStarted( anEvent ) {
    btnClose.setAttribute( "collapsed", "true" );
    btnCancel.removeAttribute( "collapsed" );
    canClose = false;
  };
  
  function onLoaderStopped( anEvent ) {
    var aStatus = anEvent.getData().status;
    try {
      aNote.loadContentDirectory( aDirectory );
      aNote.importDocument(
        aResultObj.value,
        {
          documentURI: aResultObj.documentURI,
          lang: false,
          author: false
        }
      );
      aNote.setLoading( false );
    } catch ( e ) {
      if ( e.name && ( e.name in Components.results ) ) {
        aStatus = Components.results[e.name];
      } else {
        aStatus = Components.results.NS_ERROR_UNEXPECTED;
      }
    }
    if ( aCallback ) {
      aCallback( aStatus );
    }
    canClose = true;
    if ( !aStatus ) {
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
    var jobList, jobItem, jobBox, jobLabel, jobProgress;
    var jobImg, jobImage, jobSpacer1, jobSpacer2;
    var aData = anEvent.getData();
    var aJob = aData.job;
    id = aJob.getId();
    uri = ioService.newURI( aJob.getURL(), null, null );
    try {
      uri.QueryInterface( Components.interfaces.nsIURL );
      url = uri.spec;
    } catch ( e ) {
      url = uri.scheme + "://";
    }
    jobList = document.getElementById( "jobList" );
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
      jobLabel.setAttribute( "value", Utils.getErrorName( status ) );
      jobLabel.classList.add( "error" );
      jobProgress = jobBox.childNodes[2];
      // TODO: jobProgress is undefined
      jobProgress.setAttribute( "collapsed", "true" );
    }
  };
  
  function onJobRemoved( anEvent ) {
    var aData = anEvent.getData();
    var aJob = aData.job;
    var id = aJob.getId();
    var jobItem = document.getElementById( id );
    jobItem.parentNode.removeChild( jobItem );
  };
  
  // HELPERS
  
  function doClip() {
    var aStatus;
    try {
      aNote.setLoading( true );
      aNote.setOrigin( aDocument.location.toString() );
      aResultObj.documentURI = aDocument.documentURI;
      aClipper.save(
        aDocument,
        aResultObj,
        aFile,
        aDirectory,
        aFlags,
        anObserver
      );
    } catch ( e ) {
      Utils.log( e + "\n" + Utils.dumpStack() );
      aClipper.abort();
    }
  };
  
  // PUBLIC
  
  var pub = {};
  
  pub.onLoad = function() {
    aNote = window.arguments[0].note;
    aDocument = window.arguments[0].doc;
    aFile = window.arguments[0].file;
    aDirectory = window.arguments[0].dir;
    aFlags = window.arguments[0].flags;
    aCallback = window.arguments[0].callback;
    btnCancel = document.getElementById( "btnCancel" );
    btnClose = document.getElementById( "btnClose" );
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
    aResultObj = { value: null };
    aClipper = new ru.akman.znotes.core.Clipper();
    doClip();
  };

  pub.onClose = function( event ) {
    if ( canClose ) {
      return true;
    }
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
