// -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * Original code: chrome://global/content/alerts/alert.js
 * This fixed version created by
 *   Alexander Kapitman <akman.ru@gmail.com>
 *
 * Portions created by Alexander Kapitman are Copyright (C) 2014
 * Alexander Kapitman. All Rights Reserved.
 *
 * Portions created by Alexander Kapitman marked as AK:FIXED:BEGIN/END
 */

var Cc = Components.classes;
var Ci = Components.interfaces;
var Cr = Components.results;
var Cu = Components.utils;

if ( !ru ) var ru = {};
if ( !ru.akman ) ru.akman = {};
if ( !ru.akman.znotes ) ru.akman.znotes = {};

Cu.import( "resource://znotes/utils.js", ru.akman.znotes );

var Utils = ru.akman.znotes.Utils;
var log = Utils.getLogger( "content.alert" );

var windowMediator =
  Cc["@mozilla.org/appshell/window-mediator;1"]
  .getService( Ci.nsIWindowMediator );

var prefsService =
  Cc["@mozilla.org/preferences-service;1"]
  .getService( Ci.nsIPrefService )
  .QueryInterface( Ci.nsIPrefBranch );

// Copied from nsILookAndFeel.h, see comments on eMetric_AlertNotificationOrigin
const NS_ALERT_HORIZONTAL = 1;
const NS_ALERT_LEFT = 2;
const NS_ALERT_TOP = 4;

const WINDOW_MARGIN = 10;

var gOrigin = 0; // Default value: alert from bottom right.
var gReplacedWindow = null;
var gAlertListener = null;
var gAlertTextClickable = false;
var gAlertCookie = "";
var gIsReplaced = false;

function prefillAlertInfo() {
  // unwrap all the args....
  // arguments[0] --> the image src url
  // arguments[1] --> the alert title
  // arguments[2] --> the alert text
  // arguments[3] --> is the text clickable?
  // arguments[4] --> the alert cookie to be passed back to the listener
  // arguments[5] --> the alert origin reported by the look and feel
  // arguments[6] --> bidi
  // arguments[7] --> lang
  // arguments[8] --> replaced alert window (nsIDOMWindow)
  // arguments[9] --> an optional callback listener (nsIObserver)

  switch (window.arguments.length) {
    default:
    case 10:
      gAlertListener = window.arguments[9];
    case 9:
      gReplacedWindow = window.arguments[8];
    case 6:
      gOrigin = window.arguments[5];
    case 5:
      gAlertCookie = window.arguments[4];
    case 4:
      gAlertTextClickable = window.arguments[3];
      if (gAlertTextClickable) {
        document.getElementById('alertNotification').setAttribute('clickable', true);
        // AK:FIXED:BEGIN
        // removed "plain" class, added "text-link" class
        let alertTextLabel = document.getElementById('alertTextLabel');
        alertTextLabel.setAttribute('clickable', true);
        alertTextLabel.classList.remove( "plain" );
        alertTextLabel.classList.add( "text-link" );
        // AK:FIXED:END
      }
    case 3:
      document.getElementById('alertTextLabel').textContent = window.arguments[2];
    case 2:
      document.getElementById('alertTitleLabel').setAttribute('value', window.arguments[1]);
    case 1:
      if (window.arguments[0]) {
        document.getElementById('alertImage').setAttribute('src', window.arguments[0]);
      }
    case 0:
      break;
  }
}

function onAlertLoad() {

  const ALERT_DURATION_IMMEDIATE = 4000;
  let alertTextBox = document.getElementById("alertTextBox");
  let alertImageBox = document.getElementById("alertImageBox");
  alertImageBox.style.minHeight = alertTextBox.scrollHeight + "px";

  sizeToContent();

  if (gReplacedWindow && !gReplacedWindow.closed) {
    moveWindowToReplace(gReplacedWindow);
    gReplacedWindow.gIsReplaced = true;
    gReplacedWindow.close();
  } else {
    moveWindowToEnd();
  }

  window.addEventListener("XULAlertClose", function() { window.close(); });

  if ( prefsService.getBoolPref("alerts.disableSlidingEffect")) {
    setTimeout(function() { window.close(); }, ALERT_DURATION_IMMEDIATE);
  }

  let alertBox = document.getElementById("alertBox");
  alertBox.addEventListener("animationend", function hideAlert(event) {
    if (event.animationName == "alert-animation") {
      alertBox.removeEventListener("animationend", hideAlert, false);
      window.close();
    }
  }, false);
  alertBox.setAttribute("animate", true);

  if (gAlertListener) {
    gAlertListener.observe(null, "alertshow", gAlertCookie);
  }
}

// AK:FIXED:BEGIN
// added helper function checkAlertWindow()
function checkAlertWindow( aWindow ) {
  return ( aWindow.outerHeight > WINDOW_MARGIN );
}
// AK:FIXED:END

function moveWindowToReplace(aReplacedAlert) {
  let heightDelta = window.outerHeight - aReplacedAlert.outerHeight;

  // Move windows that come after the replaced alert if the height is different.
  if (heightDelta != 0) {
    let windows = windowMediator.getEnumerator('alert:alert');
    while (windows.hasMoreElements()) {
      let alertWindow = windows.getNext();
      // AK:FIXED:BEGIN
      // added if ( checkAlertWindow() ...
      if ( checkAlertWindow( alertWindow ) ) {
      // AK:FIXED:END
        // boolean to determine if the alert window is after the replaced alert.
        let alertIsAfter = gOrigin & NS_ALERT_TOP ?
                           alertWindow.screenY > aReplacedAlert.screenY :
                           aReplacedAlert.screenY > alertWindow.screenY;
        if (alertIsAfter) {
          // The new Y position of the window.
          let adjustedY = gOrigin & NS_ALERT_TOP ?
                          alertWindow.screenY + heightDelta :
                          alertWindow.screenY - heightDelta;
          alertWindow.moveTo(alertWindow.screenX, adjustedY);
        }
      }
    }
  }

  let adjustedY = gOrigin & NS_ALERT_TOP ? aReplacedAlert.screenY :
                  aReplacedAlert.screenY - heightDelta;
  window.moveTo(aReplacedAlert.screenX, adjustedY);
}

function moveWindowToEnd() {
  // Determine position
  let x = gOrigin & NS_ALERT_LEFT ? screen.availLeft :
          screen.availLeft + screen.availWidth - window.outerWidth;
  let y = gOrigin & NS_ALERT_TOP ? screen.availTop :
          screen.availTop + screen.availHeight - window.outerHeight;

  // Position the window at the end of all alerts.
  let windows = windowMediator.getEnumerator('alert:alert');
  while (windows.hasMoreElements()) {
    let alertWindow = windows.getNext();
    // AK:FIXED:BEGIN
    // added checkAlertWindow()
    //if (alertWindow != window) {
    if (alertWindow !== window && checkAlertWindow( alertWindow ) ) {
    // AK:FIXED:END
      if (gOrigin & NS_ALERT_TOP) {
        y = Math.max(y, alertWindow.screenY + alertWindow.outerHeight);
      } else {
        y = Math.min(y, alertWindow.screenY - window.outerHeight);
      }
    }
  }

  // Offset the alert by WINDOW_MARGIN pixels from the edge of the screen
  y += gOrigin & NS_ALERT_TOP ? WINDOW_MARGIN : -WINDOW_MARGIN;
  x += gOrigin & NS_ALERT_LEFT ? WINDOW_MARGIN : -WINDOW_MARGIN;

  window.moveTo(x, y);
}

function onAlertBeforeUnload() {
  if (!gIsReplaced) {
    // Move other alert windows to fill the gap left by closing alert.
    let heightDelta = window.outerHeight + WINDOW_MARGIN;
    let windows = windowMediator.getEnumerator('alert:alert');
    while (windows.hasMoreElements()) {
      let alertWindow = windows.getNext();
      // AK:FIXED:BEGIN
      // added checkAlertWindow()
      //if (alertWindow != window) {
      if (alertWindow !== window && checkAlertWindow( alertWindow ) ) {
      // AK:FIXED:END
        if (gOrigin & NS_ALERT_TOP) {
          if (alertWindow.screenY > window.screenY) {
            alertWindow.moveTo(alertWindow.screenX, alertWindow.screenY - heightDelta);
          }
        } else {
          if (window.screenY > alertWindow.screenY) {
            alertWindow.moveTo(alertWindow.screenX, alertWindow.screenY + heightDelta);
          }
        }
      }
    }
  }
  if (gAlertListener) {
    gAlertListener.observe(null, "alertfinished", gAlertCookie);
  }
}

function onAlertClick() {
  if (gAlertListener && gAlertTextClickable) {
    gAlertListener.observe(null, "alertclickcallback", gAlertCookie);
  }
  window.close();
}
