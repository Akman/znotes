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

Components.utils.import( "resource://znotes/utils.js",
  ru.akman.znotes
);

ru.akman.znotes.ConfirmDialog = function() {

  var Utils = ru.akman.znotes.Utils;

  var args = null;
  var kind = 0;
  var btnReject = null;
  var btnCancel = null;
  
  var pub = {};

  pub.onLoad = function() {
    args = window.arguments[0];
    document.title = args.input.title ? args.input.title : "";
    document.getElementById("message1").value = args.input.message1 ?
      args.input.message1 : "";
    document.getElementById("message2").value = args.input.message2 ?
      args.input.message2 : "";
    kind = args.input.kind ? args.input.kind : 0;
    btnCancel = document.getElementById("btnCancel");
    btnReject = document.getElementById("btnReject");
    switch ( kind ) {
      case 2: // question+reject
        btnReject.removeAttribute( "hidden" );
        btnReject.addEventListener( "command", pub.onDialogReject, false );
        // no break
      case 1: // question
        btnCancel.addEventListener( "command", pub.onDialogCancel, false );
        document.getElementById("imgWarning1").removeAttribute( "hidden" );
        break;
      case 0: // warning
        document.getElementById("imgWarning0").removeAttribute( "hidden" );
        break;
    }
    window.sizeToContent();
    window.centerWindowOnScreen();
  };

  pub.onDialogAccept = function() {
    args.output = {
      result: true
    };
    return true;
  };

  pub.onDialogCancel = function() {
    args.output = {
      result: false
    };
    window.close();
    return true;
  };
  
  pub.onDialogReject = function() {
    window.close();
    return true;
  };

  return pub;

}();

window.addEventListener( "load"  , function() { ru.akman.znotes.ConfirmDialog.onLoad(); }, false );
window.addEventListener( "dialogaccept", function() { ru.akman.znotes.ConfirmDialog.onDialogAccept(); }, false );
