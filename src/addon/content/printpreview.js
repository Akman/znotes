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

ru.akman.znotes.PrintPreview = function() {

  var log = ru.akman.znotes.Utils.log;
  
  var aSourceTitle = null;
  var aSourceWindow = null;

  var aPreviewBrowser = null;
  var aContentBrowser = null;

  var aWebBrowserPrintForPreviewBrowser = null;

  var aPrintSettings = null;
  var gPrintSettingsAreGlobal = false;
  var gSavePrintSettings = false;

  var aWebProgressListener = {};
  var aPrintProgressParams = {};
  var aNotifyOnOpen = {};

  var currentPage = 0;
  var totalPagesCount = 0;

  var isScrollbarsUpdated = false;

  var printingPromptService = Components.classes["@mozilla.org/embedcomp/printingprompt-service;1"]
                                        .getService( Components.interfaces.nsIPrintingPromptService );

  var printSettingsService = Components.classes["@mozilla.org/gfx/printsettings-service;1"]
                                       .getService( Components.interfaces.nsIPrintSettingsService );

  var preferencesService = Components.classes["@mozilla.org/preferences-service;1"]
                                     .getService( Components.interfaces.nsIPrefBranch );

  var openDialogObserver = {
    observe: function( aSubject, aTopic, aData ) {
      enterPrintPreview();
    },
    QueryInterface : function( iid ) {
      if ( iid.equals( Components.interfaces.nsIObserver ) ||
           iid.equals( Components.interfaces.nsISupportsWeakReference ) ||
           iid.equals( Components.interfaces.nsISupports ) ) {
        return this;
      }
      throw Components.results.NS_NOINTERFACE;
    }
  };

  function setPrinterDefaultsForSelectedPrinter( settings ) {
    if ( !settings.printerName ) {
      settings.printerName = printSettingsService.defaultPrinterName;
    }
    printSettingsService.initPrintSettingsFromPrinter(
      settings.printerName,
      settings
    );
    printSettingsService.initPrintSettingsFromPrefs(
      settings,
      true,
      settings.kInitSaveAll
    );
  };

  function getPrintSettings() {
    if ( preferencesService ) {
      gPrintSettingsAreGlobal = preferencesService.getBoolPref(
        "print.use_global_printsettings", false
      );
      gSavePrintSettings = preferencesService.getBoolPref(
        "print.save_print_settings", false
      );
    }
    var result = null;
    try {
      if ( gPrintSettingsAreGlobal ) {
        result = printSettingsService.globalPrintSettings;
        setPrinterDefaultsForSelectedPrinter( result );
      } else {
        result = printSettingsService.newPrintSettings;
      }
    } catch (e) {
      log( e );
    }
    if ( result ) {
      result.isCancelled = false;
    }
    return result;
  };

  function showPreviewProgress() {
    try {
      printingPromptService.showProgress(
        // a DOM windows the dialog will be parented to
        window,
        // represents the document to be printed
        aWebBrowserPrintForPreviewBrowser,
        // PrintSettings for print job
        aPrintSettings,
        // an observer that will be notifed when the dialog is opened
        // nsIObserver openDialogObserver
        openDialogObserver,
        // isForPrinting
        // true - for printing, false for print preview
        false,
        // additional listener can be registered for progress notifications
        aWebProgressListener,
        // parameter object for passing progress state
        // nsIPrintProgressParams printProgressParams
        aPrintProgressParams,
        // this indicates that the observer will be notified
        // when the progress dialog has been opened.
        // If false is returned it means the observer (usually the caller)
        // shouldn't wait
        // For Print Preview Progress there is intermediate progress
        aNotifyOnOpen
      );
      if ( aSourceTitle && aPrintProgressParams.value ) {
        aPrintProgressParams.value.docTitle = aSourceTitle;
        aPrintProgressParams.value.docURL = "";
      }
      if ( !aNotifyOnOpen.value ) {
        enterPrintPreview();
      }
    } catch (e) {
      log( e ) ;
    }
  };

  function enterPrintPreview() {
    aPrintSettings = getPrintSettings();
    aWebBrowserPrintForPreviewBrowser.printPreview(
      aPrintSettings,
      aContentBrowser.contentWindow,
      aWebProgressListener.value
    );
    totalPagesCount = aWebBrowserPrintForPreviewBrowser.printPreviewNumPages;
    currentPage = 1;
    updateToolbar();
    updateScrollbars();
  };

  function updateToolbar() {
    var number_textbox = document.getElementById( "number_textbox" );
    var total_label = document.getElementById( "total_label" );
    var portrait_button = document.getElementById( "portrait_button" );
    var landscape_button = document.getElementById( "landscape_button" );
    var scale_menulist = document.getElementById( "scale_menulist" );
    var shrink_checkbox = document.getElementById( "shrink_checkbox" );
    total_label.value = totalPagesCount;
    number_textbox.max = totalPagesCount;
    number_textbox.value = currentPage;
    if ( aPrintSettings.orientation == 0 ) {
      landscape_button.setAttribute( "checked", false );
      portrait_button.setAttribute( "checked", true );
    } else {
      portrait_button.setAttribute( "checked", false );
      landscape_button.setAttribute( "checked", true );
    }
    if ( aPrintSettings.shrinkToFit ) {
      shrink_checkbox.setAttribute( "checked", true );
      scale_menulist.selectedIndex = -1;
      scale_menulist.setAttribute( "disabled", "true" );
    } else {
      shrink_checkbox.setAttribute( "checked", false );
      scale_menulist.setAttribute( "disabled", "false" );
      if ( aPrintSettings.scaling == 0.3 ) {
        scale_menulist.selectedIndex = 0;
      } else if ( aPrintSettings.scaling == 0.4 ) {
        scale_menulist.selectedIndex = 1;
      } else if ( aPrintSettings.scaling == 0.5 ) {
        scale_menulist.selectedIndex = 2;
      } else if ( aPrintSettings.scaling == 0.6 ) {
        scale_menulist.selectedIndex = 3;
      } else if ( aPrintSettings.scaling == 0.7 ) {
        scale_menulist.selectedIndex = 4;
      } else if ( aPrintSettings.scaling == 0.8 ) {
        scale_menulist.selectedIndex = 5;
      } else if ( aPrintSettings.scaling == 0.9 ) {
        scale_menulist.selectedIndex = 6;
      } else if ( aPrintSettings.scaling == 1 ) {
        scale_menulist.selectedIndex = 7;
      } else if ( aPrintSettings.scaling == 1.25 ) {
        scale_menulist.selectedIndex = 8;
      } else if ( aPrintSettings.scaling == 1.5 ) {
        scale_menulist.selectedIndex = 9;
      } else if ( aPrintSettings.scaling == 1.75 ) {
        scale_menulist.selectedIndex = 10;
      } else if ( aPrintSettings.scaling == 2 ) {
        scale_menulist.selectedIndex = 11;
      }
    }
  };

  function setupPreviewContent() {
    var contentDocument = aContentBrowser.contentDocument;
    var html = contentDocument.documentElement;
    html.removeChild( contentDocument.head );
    var head = contentDocument.importNode( aSourceWindow.document.head, true );
    html.appendChild( head );
    var aSourceSelection = aSourceWindow.getSelection();
    if ( aSourceSelection != "" ) {
      var ranges = [];
      var body = contentDocument.body;
      for( var i = 0; i < aSourceSelection.rangeCount; i++ ) {
        ranges.push( aSourceSelection.getRangeAt( i ) );
      }
      for( var i = 0; i < ranges.length; i++ ) {
        body.appendChild( ranges[i].cloneContents() );
      }
    } else {
      html.removeChild( contentDocument.body );
      var range = aSourceWindow.document.createRange();
      range.selectNode( aSourceWindow.document.body );
      html.appendChild( range.cloneContents() );
    }
    aWebBrowserPrintForPreviewBrowser = aPreviewBrowser.docShell.printPreview;
    aPrintSettings = getPrintSettings();
  };

  function updateScrollbars() {
    if ( isScrollbarsUpdated ) {
      return;
    }
    window.resizeTo( window.outerWidth, window.outerHeight - 1 );
    window.resizeTo( window.outerWidth, window.outerHeight + 1 );
    isScrollbarsUpdated = true;
  };

  var pub = {};

  pub.setup = function() {
    try {
      var settings = getPrintSettings();
      printingPromptService.showPageSetup( window, settings, null );
      if ( gSavePrintSettings ) {
        printSettingsService.savePrintSettingsToPrefs( settings, true, settings.kInitSaveNativeData );
      }
      enterPrintPreview();
    } catch (e) {
      return false;
    }
    return true;
  };

  pub.print = function() {
    aPrintSettings = getPrintSettings();
    try {
      aWebBrowserPrintForPreviewBrowser.print( aPrintSettings, null );
      if ( gPrintSettingsAreGlobal && gSavePrintSettings ) {
        printSettingsService.savePrintSettingsToPrefs(
          aPrintSettings,
          true,
          aPrintSettings.kInitSaveAll
        );
        printSettingsService.savePrintSettingsToPrefs(
          aPrintSettings,
          false,
          aPrintSettings.kInitSavePrinterName
        );
      }
    } catch (e) {
    }
  };

  pub.cancel = function() {
    if ( aWebBrowserPrintForPreviewBrowser && aWebBrowserPrintForPreviewBrowser.doingPrint ) {
      aWebBrowserPrintForPreviewBrowser.cancel();
    }
  };

  pub.navigate = function( aType, aPage ) {
    if ( aType == 'home' ) {
      if ( currentPage != 1 ) {
        currentPage = 1;
      } else {
        return;
      }
      aWebBrowserPrintForPreviewBrowser.printPreviewNavigate(
        aWebBrowserPrintForPreviewBrowser.PRINTPREVIEW_HOME,
        0
      );
    } else if ( aType == 'prev' ) {
      if ( currentPage > 1 ) {
        currentPage--;
      } else {
        return;
      }
      aWebBrowserPrintForPreviewBrowser.printPreviewNavigate(
        aWebBrowserPrintForPreviewBrowser.PRINTPREVIEW_GOTO_PAGENUM,
        currentPage
      );
    } else if ( aType == 'next' ) {
      if ( currentPage < totalPagesCount ) {
        currentPage++;
      } else {
        return;
      }
      aWebBrowserPrintForPreviewBrowser.printPreviewNavigate(
        aWebBrowserPrintForPreviewBrowser.PRINTPREVIEW_GOTO_PAGENUM,
        currentPage
      );
    } else if ( aType == 'end' ) {
      if ( currentPage != totalPagesCount ) {
        currentPage = totalPagesCount;
      } else {
        return;
      }
      aWebBrowserPrintForPreviewBrowser.printPreviewNavigate(
        aWebBrowserPrintForPreviewBrowser.PRINTPREVIEW_END,
        0
      );
    } else if ( aType == 'page' ) {
      pageNumber = parseInt( aPage );
      if ( pageNumber >= 1 && pageNumber <= totalPagesCount ) {
        aWebBrowserPrintForPreviewBrowser.printPreviewNavigate(
          aWebBrowserPrintForPreviewBrowser.PRINTPREVIEW_GOTO_PAGENUM,
          pageNumber
        );
        currentPage = pageNumber;
      } else {
        return;
      }
    }
    updateToolbar();
  };

  pub.scale = function( value ) {
    var settings = getPrintSettings();
    if ( settings.scaling == parseFloat( value ) ) {
      return;
    }
    settings.scaling = parseFloat( value );
    if ( gSavePrintSettings ) {
      printSettingsService.savePrintSettingsToPrefs( settings, true, settings.kInitSaveScaling );
    }
    enterPrintPreview();
  };

  pub.shrink = function( value ) {
    var settings = getPrintSettings();
    if ( settings.shrinkToFit == value ) {
      return;
    }
    settings.shrinkToFit = value;
    if ( gSavePrintSettings ) {
      printSettingsService.savePrintSettingsToPrefs( settings, true, settings.kInitSaveShrinkToFit );
    }
    enterPrintPreview();
  };

  pub.orient = function( value ) {
    var settings = getPrintSettings();
    if ( settings.orientation == parseInt( value ) ) {
      return;
    }
    settings.orientation = parseInt( value );
    if ( gSavePrintSettings ) {
      printSettingsService.savePrintSettingsToPrefs( settings, true, settings.kInitSaveOrientation );
    }
    enterPrintPreview();
  };

  pub.close = function() {
    window.close();
  };

  pub.onLoad = function() {
    if ( !window.arguments || window.arguments[0] == null ) {
      window.close();
    }
    var anArgs = window.arguments[0];
    if ( ( "aWindow" in anArgs ) && anArgs.aWindow ) {
      aSourceWindow = anArgs.aWindow;
    } else {
      window.close();
    }
    if ( ( "aTitle" in anArgs ) && anArgs.aTitle ) {
      aSourceTitle = anArgs.aTitle;
    }
    if ( aSourceTitle ) {
      document.title += " - " + aSourceTitle;
    }
    window.moveTo( 0, 0 );
    window.resizeTo( screen.availWidth, screen.availHeight );
    aContentBrowser = document.getElementById( "contentBrowser" );
    aPreviewBrowser = document.getElementById( "previewBrowser" );
    setupPreviewContent();
    showPreviewProgress();
  };

  pub.onClose = function() {
    if ( aWebBrowserPrintForPreviewBrowser && aWebBrowserPrintForPreviewBrowser.doingPrintPreview ) {
      aWebBrowserPrintForPreviewBrowser.exitPrintPreview();
    }
  };

  return pub;

}();

window.addEventListener( "load"  , function() { ru.akman.znotes.PrintPreview.onLoad(); }, false );
window.addEventListener( "close"  , function() { ru.akman.znotes.PrintPreview.onClose(); }, false );
