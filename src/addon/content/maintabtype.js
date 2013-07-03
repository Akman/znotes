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

ru.akman.znotes.MainTabType = function() {

  var pub = {

    // @see chrome://chrome/messenger/content/messenger/specialTabs.js
    __proto__: contentTabBaseType,
    name: "znotesMainTab",
    panelId: "znotes_maintabpanel",
    title: "Notes",

    get loadingTabString() {
      delete this.loadingTabString;
      return this.loadingTabString = document.getElementById( "bundle_messenger" )
                                             .getString( "loadingTab" );
    },

    modes: {
      znotesMainTab: {
        type: "znotesMainTab",
        maxTabs: 1
      }
    },

    defaultClickHandler: function( aEvent ) {
      return ru.akman.znotes.Utils.clickHandler( aEvent );
    },
    
    openTab: function( aTab, aArgs ) {
      if ( !("contentPage" in aArgs) ) {
        return;
      }
      if ( "persistedState" in aArgs && aArgs.persistedState ) {
        aTab.persistedState = aArgs.persistedState;
      }
      this.title = document.getElementById( "znotes_stringbundle" )
                           .getString( "main.window.title" );
      // Start setting up the browser.
      aTab.browser = document.getElementById( "znotes_maintabbrowser" );
      aTab.toolbar = document.getElementById( "znotes_maintoolbar" );
      // As we're opening this tab, showTab may not get called, so set
      // the type according to if we're opening in background or not.
      var background = ( "background" in aArgs ) && aArgs.background;
      aTab.browser.setAttribute( "type", background ? "content-targetable" : "content-primary" );
      aTab.clickHandler = ru.akman.znotes.MainTabType.defaultClickHandler;
      aTab.browser.addEventListener( "click", aTab.clickHandler, false );
      // Set this attribute so that when favicons fail to load, we remove the
      // image attribute and just show the default tab icon.
      aTab.tabNode.addEventListener( "error", function() { this.removeAttribute( 'image' ); }, false );
      aTab.browser.addEventListener( "DOMLinkAdded", DOMLinkHandler, false );
      gPluginHandler.addEventListeners( aTab.browser );
      // Now initialise the find bar.
      aTab.findbar = document.getElementById( "znotes_maintabfindbar" );
      // Default to reload being disabled.
      aTab.reloadEnabled = false;
      // Now set up the listeners.
      this._setUpLoadListener( aTab );
      this._setUpTitleListener( aTab );
      this._setUpCloseWindowListener( aTab );
      if ( "onLoad" in aArgs ) {
        aTab.browser.addEventListener(
          "load",
          function _znotes_onLoad( event ) {
            aArgs.onLoad( event, aTab.browser );
            aTab.browser.removeEventListener( "load", _znotes_onLoad, true );
          },
          true
        );
      }
      // Create a filter and hook it up to our browser
      var filter = Components.classes["@mozilla.org/appshell/component/browser-status-filter;1"]
                             .createInstance( Components.interfaces.nsIWebProgress );
      aTab.filter = filter;
      aTab.browser.webProgress.addProgressListener( filter, Components.interfaces.nsIWebProgress.NOTIFY_ALL );
      // Wire up a progress listener to the filter for this browser
      aTab.progressListener = new tabProgressListener( aTab, false );
      filter.addProgressListener( aTab.progressListener, Components.interfaces.nsIWebProgress.NOTIFY_ALL );
      if ( "onListener" in aArgs ) {
        aArgs.onListener( aTab.browser, aTab.progressListener );
      }
      // Now start loading the content.
      aTab.title = this.loadingTabString;
      aTab.browser.loadURI( aArgs.contentPage );
    },

    tryCloseTab: function( aTab ) {
      var docShell = aTab.browser.docShell;
      // If we have a docshell, a contentViewer, and it forbids us from closing
      // the tab, then we return false, which means, we can't close the tab. All
      // other cases return true.
      var canClose = !( docShell && docShell.contentViewer && !docShell.contentViewer.permitUnload() );
      if ( canClose ) {
      }
      return canClose;
    },

    onTitleChanged: function( aTab ) {
      aTab.title = this.title;
    }

  };

  return pub;

}();
