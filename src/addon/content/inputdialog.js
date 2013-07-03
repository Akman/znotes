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

ru.akman.znotes.InputDialog = function() {

  var args = null;
  var textbox = null;
  var caption = null;

  var pub = {};

  pub.onLoad = function() {
    args = window.arguments[0];
    textbox = document.getElementById( "textbox" );
    caption = document.getElementById( "caption" );
    document.title = args.input.title;
    caption.label = args.input.caption;
    textbox.value = args.input.value;
  };

  pub.onDialogAccept = function() {
    args.output = {
      result: textbox.value
    };
    return true;
  };

  return pub;

}();

window.addEventListener( "load"  , function() { ru.akman.znotes.InputDialog.onLoad(); }, false );
window.addEventListener( "dialogaccept", function() { ru.akman.znotes.InputDialog.onDialogAccept(); }, false );
