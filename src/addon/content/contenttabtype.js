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

ru.akman.znotes.ContentTabType = function() {

  var pub = {

    // @see chrome://chrome/messenger/content/messenger/specialTabs.js
    __proto__: contentTabBaseType,
    name: "znotesContentTab",
    perTabPanel: "vbox",
    lastBrowserId: 0,

    get loadingTabString() {
      delete this.loadingTabString;
      return this.loadingTabString = document.getElementById( "bundle_messenger" )
                                             .getString( "loadingTab" );
    },

    modes: {
      znotesContentTab: {
        type: "znotesContentTab",
        maxTabs: 10
      }
    }

  };

  pub.openTab = function( aTab, aArgs ) {
    if ( !( "note" in aArgs ) ) {
      return;
    }
    if ( !( "contentPage" in aArgs ) ) {
      return;
    }
    //
    aTab.contentPage = aArgs.contentPage;
    aTab.note = aArgs.note;
    aTab.background = ( "background" in aArgs ) && aArgs.background;
    aTab.style = ( "style" in aArgs ) ? aArgs.style : null;
    //
    if ( aTab.note ) {
      aTab.bookId = aTab.note.getBook().getId();
      aTab.noteId = aTab.note.getId();
    }
    aTab.browserId = this.lastBrowserId;
    // First clone the page and set up the basics.
    var clone = document.getElementById( "znotesContentTab" ).firstChild.cloneNode( true );
    clone.setAttribute( "id", "znotes_contenttab" + this.lastBrowserId );
    clone.setAttribute( "collapsed", false );
    aTab.panel.setAttribute( "id", "znotes_contenttabpanel" + this.lastBrowserId );
    aTab.panel.appendChild( clone );
    aTab.root = clone;
    aTab.toolbox = aTab.panel.getElementsByTagName( "toolbox" )[0];
    aTab.toolbox.setAttribute( "id", "znotes_contenttoolbox" + this.lastBrowserId );
    aTab.commandset = aTab.panel.getElementsByTagName( "commandset" )[0];
    aTab.commandset.setAttribute( "id", "znotes_contentcommandset" + this.lastBrowserId );
    aTab.panel.getElementsByTagName( "vbox" )[0]
              .setAttribute( "id", "znotes_contenttabcontent" + this.lastBrowserId );
    // Start setting up the browser.
    aTab.browser = aTab.panel.getElementsByTagName( "browser" )[0];
    // As we're opening this tab, showTab may not get called, so set
    // the type according to if we're opening in background or not.
    aTab.browser.setAttribute( "type", aTab.background ? "content-targetable" : "content-primary" );
    aTab.browser.setAttribute( "id", "znotes_contenttabbrowser" + this.lastBrowserId );
    // Set this attribute so that when favicons fail to load, we remove the
    // image attribute and just show the default tab icon.
    aTab.tabNode.addEventListener( "error", function() { this.removeAttribute( 'image' ); }, false );
    aTab.browser.addEventListener( "DOMLinkAdded", DOMLinkHandler, false );
    gPluginHandler.addEventListeners( aTab.browser );
    // Now initialise the find bar.
    aTab.findbar = aTab.panel.getElementsByTagName( "findbar" )[0];
    aTab.findbar.setAttribute( "id", "znotes_contenttabfindbar" + this.lastBrowserId );
    aTab.findbar.setAttribute( "browserid", "znotes_contenttabbrowser" + this.lastBrowserId );
    // Default to reload being disabled.
    aTab.reloadEnabled = false;
    // Now set up the listeners.
    this._setUpLoadListener( aTab );
    this._setUpTitleListener( aTab );
    this._setUpCloseWindowListener( aTab );
    if ( "onLoad" in aArgs ) {
      aTab.browser.addEventListener(
        "load",
        function _znotesContentTab_onLoad( event ) {
          aTab.browser.removeEventListener( "load", _znotesContentTab_onLoad, true );
          aArgs.onLoad( event, aTab.browser );
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
    this.lastBrowserId++;
  };

  pub.tryCloseTab = function( aTab ) {
    var docShell = aTab.browser.docShell;
    // If we have a docshell, a contentViewer, and it forbids us from closing
    // the tab, then we return false, which means, we can't close the tab. All
    // other cases return true.
    if ( docShell && docShell.contentViewer && !docShell.contentViewer.permitUnload() ) {
      return false;
    } else {
      // Some things we doing before the tab being closed ...
      return true;
    }
  };

  pub.onTitleChanged = function( aTab ) {
    if ( aTab.note ) {
      aTab.title = aTab.note.getName();
    }
  };

  return pub;

}();
