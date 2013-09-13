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

Components.utils.import( "resource://znotes/utils.js"  , ru.akman.znotes );

var EXPORTED_SYMBOLS = ["Document"];

var Document = function() {

  var DocumentException = function( message ) {
    this.name = "DocumentException";
    this.message = message;
    this.toString = function() {
      return this.name + ": " + this.message;
    }
  };

  var pub = {};

  pub.getInfo = function() {
    return {
      url: "chrome://znotes_documents/content/text/",
      iconURL: "chrome://znotes_images/skin/documents/text/text.png",
      type: "text/plain",
      defaultNS: "",
      errorNS: "",
      name: "text",
      version: "1.0",
      description: "Plain Text Document",
    };
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

  return pub;

}();
