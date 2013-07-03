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

ru.akman.znotes.About = function() {

  var pub = {};

  var Utils = ru.akman.znotes.Utils;
  var obj = null;
  var lbl = null;
  var hbx = null;
  var vbx1 = null;
  var vbx2 = null;
  var spr = null;

  pub.onLoad = function() {
    document.getElementById( "name" ).setAttribute( "value", Utils.NAME );
    document.getElementById( "version" ).setAttribute( "value", Utils.VERSION );
    document.getElementById( "description" ).setAttribute( "value", Utils.decodeUTF8( Utils.TITLE ) );
    //
    var copyrights = document.getElementById( "copyrights" );
    for ( var i = 0; i < Utils.COPYRIGHTS.length; i++ ) {
      obj = Utils.COPYRIGHTS[i];
      lbl = document.createElement( "label" );
      lbl.setAttribute( "id", "lblCopyright" + i + "1" );
      lbl.setAttribute( "value", Utils.decodeUTF8( obj.prefix + " " + obj.year + " " + obj.author ) );
      copyrights.appendChild( lbl );
      lbl = document.createElement( "label" );
      lbl.setAttribute( "id", "lblCopyright" + i + "2" );
      lbl.setAttribute( "value", Utils.decodeUTF8( obj.reserved ) );
      copyrights.appendChild( lbl );
    }
    //
    var sitelink = document.getElementById( "sitelink" );
    sitelink.setAttribute( "href", Utils.SITE + Utils.URLS.index );
    sitelink.setAttribute( "tooltiptext", Utils.SITE + Utils.URLS.index );
    var forumlink = document.getElementById( "forumlink" );
    forumlink.setAttribute( "href", Utils.SITE + Utils.URLS.forum );
    forumlink.setAttribute( "tooltiptext", Utils.SITE + Utils.URLS.forum );
    //
    var licenses = document.getElementById( "licensescontainer" );
    for ( var i = 0; i < Utils.LICENSES.length; i++ ) {
      obj = Utils.LICENSES[i];
      hbx = document.createElement( "hbox" );
      hbx.setAttribute( "id", "hbxLicense" + i );
      lbl = document.createElement( "label" );
      lbl.setAttribute( "id", "lblLicense" + i + "1" );
      lbl.setAttribute( "class", "text-link link shiftright" );
      lbl.setAttribute( "value", obj.name );
      lbl.setAttribute( "href", obj.link );
      lbl.setAttribute( "tooltiptext", obj.link );
      lbl.addEventListener( "click"  , ru.akman.znotes.About.onClick, false );
      hbx.appendChild( lbl );
      licenses.appendChild( hbx );
    }
    //
    var repositories = document.getElementById( "repositoriescontainer" );
    for ( var i = 0; i < Utils.REPOSITORIES.length; i++ ) {
      obj = Utils.REPOSITORIES[i];
      hbx = document.createElement( "hbox" );
      hbx.setAttribute( "id", "hbxRepository" + i );
      lbl = document.createElement( "label" );
      lbl.setAttribute( "id", "lblRepository" + i + "1" );
      lbl.setAttribute( "class", "text-link link shiftright" );
      lbl.setAttribute( "value", obj.name );
      lbl.setAttribute( "href", obj.link );
      lbl.setAttribute( "tooltiptext", obj.link );
      lbl.addEventListener( "click"  , ru.akman.znotes.About.onClick, false );
      hbx.appendChild( lbl );
      repositories.appendChild( hbx );
    }
    //
    var translators = document.getElementById( "translatorscontainer" );
    for ( var i = 0; i < Utils.TRANSLATORS.length; i++ ) {
      obj = Utils.TRANSLATORS[i];
      hbx = document.createElement( "hbox" );
      hbx.setAttribute( "id", "hbxTranslation" + i );
      lbl = document.createElement( "label" );
      lbl.setAttribute( "id", "lblTranslation" + i + "1" );
      lbl.setAttribute( "class", "text-link link shiftright" );
      lbl.setAttribute( "value", Utils.decodeUTF8( obj.name ) );
      lbl.setAttribute( "href", obj.link );
      lbl.setAttribute( "tooltiptext", obj.link );
      lbl.addEventListener( "click"  , ru.akman.znotes.About.onClick, false );
      hbx.appendChild( lbl );
      translators.appendChild( hbx );
    }
    //
    var creators = document.getElementById( "creatorscontainer" );
    for ( var i = 0; i < Utils.CREATORS.length; i++ ) {
      obj = Utils.CREATORS[i];
      hbx = document.createElement( "hbox" );
      hbx.setAttribute( "id", "hbxCreator" + i );
      lbl = document.createElement( "label" );
      lbl.setAttribute( "id", "lblCreator" + i + "1" );
      lbl.setAttribute( "class", "text-link link shiftright" );
      lbl.setAttribute( "value", Utils.decodeUTF8( obj.name ) );
      lbl.setAttribute( "href", obj.link );
      lbl.setAttribute( "tooltiptext", obj.link );
      lbl.addEventListener( "click"  , ru.akman.znotes.About.onClick, false );
      hbx.appendChild( lbl );
      creators.appendChild( hbx );
    }
    //
    var contributors = document.getElementById( "contributorscontainer" );
    if ( Utils.CONTRIBUTORS.length == 0 ) {
      contributors.setAttribute( "collapsed", "true" );
    }
    for ( var i = 0; i < Utils.CONTRIBUTORS.length; i++ ) {
      obj = Utils.CONTRIBUTORS[i];
      hbx = document.createElement( "hbox" );
      hbx.setAttribute( "id", "hbxContributor" + i );
      vbx1 = document.createElement( "vbox" );
      vbx1.setAttribute( "id", "vbxContributor1" + i );
      hbx.appendChild( vbx1 );
      lbl = document.createElement( "label" );
      lbl.setAttribute( "id", "lblContributor" + i + "2" );
      lbl.setAttribute( "class", "text-link link shiftright shifttopbottom" );
      lbl.setAttribute( "value", Utils.decodeUTF8( obj.name ) );
      lbl.setAttribute( "href", obj.link );
      lbl.setAttribute( "tooltiptext", obj.link );
      lbl.addEventListener( "click"  , ru.akman.znotes.About.onClick, false );
      vbx1.appendChild( lbl );
      lbl = document.createElement( "description" );
      lbl.setAttribute( "id", "lblContributor" + i + "1" );
      lbl.setAttribute( "class", "description" );
      lbl.textContent = Utils.decodeUTF8( obj.title );
      lbl.setAttribute( "tooltiptext", Utils.decodeUTF8( obj.description ) );
      vbx1.appendChild( lbl );
      contributors.appendChild( hbx );
    }
    //
    var credits = document.getElementById( "creditscontainer" );
    for ( var i = 0; i < Utils.CREDITS.length; i++ ) {
      obj = Utils.CREDITS[i];
      hbx = document.createElement( "hbox" );
      hbx.setAttribute( "id", "hbxCredits" + i );
      vbx1 = document.createElement( "vbox" );
      vbx1.setAttribute( "id", "vbxCredits1" + i );
      hbx.appendChild( vbx1 );
      lbl = document.createElement( "label" );
      lbl.setAttribute( "id", "lblCredits" + i + "2" );
      lbl.setAttribute( "class", "text-link link shiftright shifttopbottom" );
      lbl.setAttribute( "value", Utils.decodeUTF8( obj.name ) );
      lbl.setAttribute( "href", obj.link );
      lbl.setAttribute( "tooltiptext", obj.link );
      lbl.addEventListener( "click"  , ru.akman.znotes.About.onClick, false );
      vbx1.appendChild( lbl );
      lbl = document.createElement( "description" );
      lbl.setAttribute( "id", "lblCredits" + i + "1" );
      lbl.setAttribute( "class", "description" );
      lbl.textContent = Utils.decodeUTF8( obj.title );
      lbl.setAttribute( "tooltiptext", Utils.decodeUTF8( obj.description ) );
      vbx1.appendChild( lbl );
      credits.appendChild( hbx );
    }
    //
    document.documentElement.getButton('accept').setAttribute( "hidden", "true" );
    document.documentElement.centerWindowOnScreen();
    window.sizeToContent();
  };

  pub.onClick = function( aEvent ) {
    var target = aEvent.target;
    if ( target && target.href ) {
      aEvent.stopPropagation();
      aEvent.preventDefault();
      Utils.openLinkExternally( target.href );
    }
  };

  pub.onDonate = function( aEvent ) {
    Utils.openLinkExternally( Utils.SITE + Utils.getLanguage() + "/donations.xhtml" );
  };
  
  return pub;

}();

window.addEventListener( "load"  , function() { ru.akman.znotes.About.onLoad(); }, false );
