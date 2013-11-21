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
if ( !ru.akman.znotes.doc ) ru.akman.znotes.doc = {};
if ( !ru.akman.znotes.core ) ru.akman.znotes.core = {};

Components.utils.import( "resource://znotes/utils.js", ru.akman.znotes );
Components.utils.import( "resource://znotes/event.js", ru.akman.znotes.core );

var EXPORTED_SYMBOLS = ["Document"];

var Document = function() {

  var Utils = ru.akman.znotes.Utils;

  var registryObject = null;
  
  var DocumentException = function( message ) {
    this.name = "DocumentException";
    this.message = message;
    this.toString = function() {
      return this.name + ": " + this.message;
    }
  };
  
  var observers = [];

  var pub = {};

  pub.getInfo = function() {
    return {
      url: "chrome://znotes_documents/content/text/",
      iconURL: "chrome://znotes_images/skin/documents/text/icon-16x16.png",
      type: "text/plain",
      defaultNS: "",
      errorNS: "",
      name: "TEXT",
      version: "1.0",
      description: "TEXT Document",
    };
  };

  pub.addObserver = function( aObserver ) {
    if ( observers.indexOf( aObserver ) < 0 ) {
      observers.push( aObserver );
    }
  };

  pub.removeObserver = function( aObserver ) {
    var index = observers.indexOf( aObserver );
    if ( index < 0 ) {
      return;
    }
    observers.splice( index, 1 );
  };

  pub.notifyObservers = function( event ) {
    for ( var i = 0; i < observers.length; i++ ) {
      if ( observers[i][ "on" + event.type ] ) {
        observers[i][ "on" + event.type ]( event );
      }
    }
  };

  pub.getId = function() {
    var info = pub.getInfo();
    return info.name + "-" + info.version;
  };
  
  pub.getURL = function() {
    return pub.getInfo().url;
  };
  
  pub.getIconURL = function() {
    return pub.getInfo().iconURL;
  };
  
  pub.getType = function() {
    return pub.getInfo().type;
  };

  pub.getDefaultNS = function() {
    return pub.getInfo().defaultNS;
  };

  pub.getErrorNS = function() {
    return pub.getInfo().errorNS;
  };

  pub.getName = function() {
    return pub.getInfo().name;
  };

  pub.getVersion = function() {
    return pub.getInfo().version;
  };

  pub.getDescription = function() {
    return pub.getInfo().description;
  };
  
  pub.getBlankDocument = function( aBaseURI, aTitle, aCommentFlag ) {
    var dom = "";
    if ( aTitle ) {
      dom += aTitle + "\n";
    }
    return dom;
  };
  
  pub.getErrorDocument = function( aBaseURI, aTitle, errorText, sourceText ) {
    var dom = pub.getBlankDocument( aBaseURI, aTitle );
    if ( errorText ) {
      dom += "\n" + errorText + "\n";
    }
    if ( sourceText ) {
      dom += "\n" + sourceText + "\n";
    }
    return dom;
  };
  
  pub.parseFromString = function( aData, anURI, aBaseURI, aTitle ) {
    return { result: true, dom: aData, changed: false };
  };

  pub.checkDocument = function( aDOM, anURI, aBaseURI, aTitle ) {
    return null;
  };
  
  pub.sanitizeDocument = function( aDOM, aBaseURI ) {
  };
  
  pub.serializeToString = function( aDOM ) {
    return aDOM;
  };
  
  pub.fixupDocument = function( aDOM, aBaseURI, aTitle ) {
    return false;
  };
  
  pub.importDocument = function( aDOM, aBaseURI, aTitle ) {
    var dom = pub.getBlankDocument( aBaseURI, aTitle );
    /*
    var serializer = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"]
                               .createInstance( Components.interfaces.nsIDOMSerializer );
    dom += serializer.serializeToString( aDOM );
    */
    dom += aDOM.documentElement.textContent;
    return dom;
  };

  pub.getDefaultPreferences = function() {
    return {};
  };
  
  return pub;

}();
