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

ru.akman.znotes.Common = function() {

  var pub = {};

  var Utils = ru.akman.znotes.Utils;

  pub.goDoCommand = function( event, command ) {
    try {
      var controller = top.document.commandDispatcher
                                   .getControllerForCommand( command );
      if ( controller ) {
        if ( controller.isCommandEnabled( command ) ) {
          // how about event
          controller.doCommand( command );
        }
      } else {
        Utils.log( "goDoCommand() :: " + command + " :: controller was not found!" );
      }
    } catch( e ) {
      Components.utils.reportError(
        "An error occurred executing the '" + command + "' command: " + e
      );
    }
  };
  
  pub.goUpdateCommand = function( command ) {
    try {
      var enabled = false;
      var controller = top.document.commandDispatcher
                          .getControllerForCommand( command );
      if ( controller ) {
        enabled = controller.isCommandEnabled( command );
      } else {
        Utils.log( "goUpdateCommand() :: " + command + " :: controller was not found!" );
      }
      pub.goSetCommandEnabled( command, enabled );
    } catch ( e ) {
      Components.utils.reportError(
        "An error occurred updating the '" + command + "' command: " + e
      );
    }
  };

  pub.goSetCommandEnabled = function( command, enabled ) {
    var node = document.getElementById( command );
    if ( !node ) {
      Utils.log( "goSetCommandEnabled() :: " + command + " :: command node was not found!" );
      return false;
    }
    node.setAttribute( "disabled", "true" );
    node.removeAttribute( "disabled" );
    if ( !enabled ) {
      node.setAttribute( "disabled", "true" );
    }
    return true;
  };

  pub.goSetCommandHidden = function( command, hidden ) {
    var node = document.getElementById( command );
    if ( !node ) {
      return false;
    }
    node.setAttribute( "hidden", "true" );
    node.removeAttribute( "hidden" );
    if ( hidden ) {
      node.setAttribute( "hidden", "true" );
    }
    return true;
  };

  pub.goSetCommandAttribute = function( command, name, value ) {
    var node = document.getElementById( command );
    if ( !node ) {
      return false;
    }
    if ( node.hasAttribute( name ) ) {
      node.removeAttribute( name );
    }
    node.setAttribute( name, value );
    return true;
  };
  
  pub.goDoCommandWithParams = function( event, command, params ) {
    try {
      var controller = top.document.commandDispatcher
                                   .getControllerForCommand( command );
      if ( controller ) {
        if ( controller.isCommandEnabled( command ) ) {
          if ( controller instanceof Components.interfaces.nsICommandController ) {
            controller.doCommandWithParams( command, params );
          } else {
            controller.doCommand( command );
          }
        }
      }
    } catch( e ) {
      Components.utils.reportError(
        "An error occurred executing the '" + command + "' command: " + e
      );
    }
  };
  
  pub.createCommandParamsObject = function() {
    try {
      return Components.classes["@mozilla.org/embedcomp/command-params;1"]
                       .createInstance( Components.interfaces.nsICommandParams );
    } catch( e ) {
      Components.utils.reportError(
        "An error occurred in createCommandParamsObject: " + e
      );
    }
    return null;
  };

  return pub;

}();
