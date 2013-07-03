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

ru.akman.znotes.MessageDialog = function() {

  var args = null;
  var kind = 0;

  var pub = {};

  pub.onLoad = function() {
    args = window.arguments[0];
    document.title = args.input.title;
    document.getElementById("message1").value = args.input.message1;
    document.getElementById("message2").value = args.input.message2;
    if ( args.input.kind ) {
      kind = args.input.kind;
    }
    if ( kind == 2 ) {
      // exclamation
      document.getElementById("imgMessage2").removeAttribute( "hidden" );
    } else if ( kind == 1 ) {
      // warning
      document.getElementById("imgMessage1").removeAttribute( "hidden" );
    } else {
      // info
      document.getElementById("imgMessage0").removeAttribute( "hidden" );
    }
    window.sizeToContent();
  };

  pub.onDialogAccept = function() {
    args.output = {
    };
    return true;
  };

  return pub;

}();

window.addEventListener( "load"  , function() { ru.akman.znotes.MessageDialog.onLoad(); }, false );
window.addEventListener( "dialogaccept", function() { ru.akman.znotes.MessageDialog.onDialogAccept(); }, false );
