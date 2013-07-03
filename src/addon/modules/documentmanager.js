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

var EXPORTED_SYMBOLS = ["DocumentManager"];

var DocumentManager = function() {

  var pub = {};

  var docs = {};

  pub.registerDocument = function( name ) {
    pub.unregisterDocument( name );
    if ( !ru ) var ru = {};
    if ( !ru.akman ) ru.akman = {};
    if ( !ru.akman.znotes ) ru.akman.znotes = {};
    if ( !ru.akman.znotes.doc ) ru.akman.znotes.doc = {};
    var url = "chrome://znotes_documents/content/" + name + "/";
    try {
      ru.akman.znotes.doc[ name ] = {};
      Components.utils.import( url + "editor.js", ru.akman.znotes.doc[ name ] );
      Components.utils.import( url + "document.js", ru.akman.znotes.doc[ name ] );
      var doc = ru.akman.znotes.doc[ name ].Document;
      ru.akman.znotes.doc[ name ].Editor.prototype.getDocument = function() {
        return doc;
      };
      doc.getEditor = function( dom ) {
        return new ru.akman.znotes.doc[ name ].Editor();
      };
      docs[ name ] = doc;
    } catch ( e ) {
      delete ru.akman.znotes.doc[ name ];
      throw e;
    }
    return doc;
  };

  pub.unregisterDocument = function( name ) {
    if ( !ru ) var ru = {};
    if ( !ru.akman ) ru.akman = {};
    if ( !ru.akman.znotes ) ru.akman.znotes = {};
    if ( !ru.akman.znotes.doc ) ru.akman.znotes.doc = {};
    if ( ru.akman.znotes.doc[ name ] ) {
      delete ru.akman.znotes.doc[ name ];
    }
    if ( docs[ name ] ) {
      delete docs[ name ];
    }
  };

  pub.getDocuments = function() {
    return docs;
  };

  pub.getDocumentByName = function( name ) {
    if ( name in docs ) {
      return docs[ name ];
    }
    return null;
  };

  pub.getDefaultDocument = function() {
    if ( "default" in docs ) {
      return docs[ "default" ];
    }
    return null;
  };

  pub.getDocument = function( type ) {
    for ( var name in docs ) {
      var value = docs[ name ];
      if ( value.getType() == type ) {
        return value;
      }
    }
    return null;
  };

  return pub;

}();
