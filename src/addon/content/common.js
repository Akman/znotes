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
if ( !ru.akman.znotes.core ) ru.akman.znotes.core = {};

Components.utils.import( "resource://znotes/utils.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/event.js",
  ru.akman.znotes.core
);

ru.akman.znotes.Common = function() {

  var pub = {};

  var Utils = ru.akman.znotes.Utils;

  // COMMANDS
  
  pub.goDoCommand = function( command, target ) {
    var result = false;
    var win = target ? target.ownerDocument.defaultView : top;
    try {
      var controller = win.controllers.getControllerForCommand( command );
      if ( !controller ) {
        controller =
          top.document.commandDispatcher.getControllerForCommand( command );
      }
      if ( controller ) {
        if ( controller.isCommandEnabled( command ) ) {
          controller.doCommand( command );
          result = true;
        }
      }
    } catch ( e ) {
      Components.utils.reportError(
        "An error occurred executing the '" + command + "' command: " + e
      );
    }
    return result;
  };

  pub.goUpdateCommand = function( command, id, cmdwin ) {
    var win = cmdwin ? cmdwin : top;
    try {
      var enabled = false;
      var controller = id ? win.controllers.getControllerById( id ) :
        win.controllers.getControllerForCommand( command );
      if ( controller ) {
        enabled = controller.isCommandEnabled( command );
      }
      pub.goSetCommandEnabled( command, enabled, cmdwin );
    } catch ( e ) {
      Components.utils.reportError(
        "An error occurred updating the '" + command + "' command:\n" + e
      );
    }
  };

  pub.isCommandEnabled = function( command, id, cmdwin ) {
    var win = cmdwin ? cmdwin : top;
    var enabled = false;
    try {
      var controller = id ? win.controllers.getControllerById( id ) :
        win.controllers.getControllerForCommand( command );
      if ( controller ) {
        enabled = controller.isCommandEnabled( command );
      }
    } catch ( e ) {
      Components.utils.reportError(
        "An error occurred accessing the '" + command + "' command: " + e
      );
    }
    return enabled;
  };
  
  pub.goSetCommandEnabled = function( command, enabled, cmdwin ) {
    var win = cmdwin ? cmdwin : top;
    var node = win.document.getElementById( command );
    if ( node ) {
      node.setAttribute( "disabled", "true" );
      node.removeAttribute( "disabled" );
      if ( !enabled ) {
        node.setAttribute( "disabled", "true" );
      } else {
        node.removeAttribute( "disabled" );
      }
    }
  };

  pub.goSetCommandHidden = function( command, hidden, cmdwin ) {
    var win = cmdwin ? cmdwin : top;
    var node = win.document.getElementById( command );
    if ( node ) {
      node.setAttribute( "hidden", "true" );
      node.removeAttribute( "hidden" );
      if ( hidden ) {
        node.setAttribute( "hidden", "true" );
      } else {
        node.removeAttribute( "hidden" );
      }
    }
  };

  pub.goSetCommandAttribute = function( command, name, value, cmdwin ) {
    var win = cmdwin ? cmdwin : top;
    var node = win.document.getElementById( command );
    if ( node ) {
      node.setAttribute( name, value );
      node.removeAttribute( name );
      node.setAttribute( name, value );
    }
  };

  pub.goGetCommandAttribute = function( command, name, cmdwin ) {
    var win = cmdwin ? cmdwin : top;
    var node = win.document.getElementById( command );
    if ( node ) {
      return ( node.getAttribute( name ) === "true" );
    }
    return null;
  };
  
  pub.goDoCommandWithParams = function( command, params, target ) {
    var win = target ? target.ownerDocument.defaultView : top;
    try {
      var controller = win.controllers.getControllerForCommand( command );
      if ( !controller ) {
        controller =
          top.document.commandDispatcher.getControllerForCommand( command );
      }
      if ( controller ) {
        if ( controller.isCommandEnabled( command ) ) {
          if ( controller instanceof Components.interfaces.nsICommandController ) {
            controller.doCommandWithParams( command, params );
          } else {
            controller.doCommand( command );
          }
        }
      }
    } catch ( e ) {
      Components.utils.reportError(
        "An error occurred executing the '" + command + "' command: " + e
      );
    }
  };
  
  pub.createCommandParamsObject = function() {
    try {
      return Components.classes["@mozilla.org/embedcomp/command-params;1"]
                       .createInstance( Components.interfaces.nsICommandParams );
    } catch ( e ) {
      Components.utils.reportError(
        "An error occurred in createCommandParamsObject: " + e
      );
    }
    return null;
  };

  return pub;

}();
