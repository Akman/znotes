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

var EXPORTED_SYMBOLS = ["Source"];

var Source = function() {

  var editor = null;

  var pub = {};

  pub.getEditor = function() {
    return editor;
  };

  pub.getLibrary = function() {
    return CodeMirror;
  };

  pub.onLoad = function() {
    var foldFunc = CodeMirror.newFoldFunction( CodeMirror.tagRangeFinder );
    var keyMap = {
      "Ctrl-Q": function( cm ) {
        foldFunc( cm, cm.getCursor().line );
      }
    };
    editor = CodeMirror(
      document.getElementById( "editorView" ),
      {
        theme: "eclipse",
        mode: "htmlmixed", // mode required: javascript, xml, css
        lineNumbers: true,
        lineWrapping: false,
        styleActiveLine: true,
        autoCloseTags: true,
        indentUnit: 2,
        tabSize: 2,
        undoDepth: 1000,
        extraKeys: keyMap
      }
    );
    editor.on( "gutterClick", function( cm, n ) {
      foldFunc( cm, n );
    });
    editor.setSize( null, 100 );
  };

  return pub;

}();

window.addEventListener( "load"  , function() { Source.onLoad(); }, false );
