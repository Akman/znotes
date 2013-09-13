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

var EXPORTED_SYMBOLS = ["CommandManager"];

var CommandManager = function() {

  var log = ru.akman.znotes.Utils.log;
  var win = null;

  var pub = {};

  var CommandManagerException = function( message ) {
    this.name = "CommandManagerException";
    this.message = message;
    this.toString = function() {
      return this.name + ": " + this.message;
    }
  };
  
  var getCommand = function( cmd ) {
    if ( cmd in commands ) {
      return commands[cmd];
    }
    throw new CommandManagerException( "Command: '" + cmd + "' was not found." );    
  };
  
  var commands = {
    "znotes_showmainmenubar_command": null,
    "znotes_showmaintoolbar_command": null,
    "znotes_customizemaintoolbar_command": null,
    "znotes_openoptionsdialog_command": null,
    "znotes_openhelp_command": null,
    "znotes_openabout_command": null,
    "znotes_openbook_command": null,
    "znotes_closebook_command": null,
    "znotes_appendbook_command": null,
    "znotes_deletebook_command": null,
    "znotes_deletebookdata_command": null,
    "znotes_editbook_command": null,
    "znotes_renamebook_command": null,
    "znotes_refreshbooktree_command": null,
    "znotes_refreshfoldertree_command": null,
    "znotes_newcategory_command": null,
    "znotes_deletecategory_command": null,
    "znotes_renamecategory_command": null,
    "znotes_refreshtagtree_command": null,
    "znotes_newtag_command": null,
    "znotes_deletetag_command": null,
    "znotes_renametag_command": null,
    "znotes_colortag_command": null,
    "znotes_newnote_command": null,
    "znotes_importnote_command": null,
    "znotes_deletenote_command": null,
    "znotes_renamenote_command": null,
    "znotes_processnote_command": null,
    "znotes_updatenote_command": null,
    "znotes_refreshnotetree_command": null,
    "znotes_exit_command": null,
    "znotes_pagesetup_command": null,
    "znotes_showfilterbar_command": null,
    "znotes_showappmenu_command": null,
    "znotes_debug_command": null,
    "znotes_addons_command": null,
    "znotes_update_command": null,
    "znotes_print_command": null,
    "znotes_undo_command": null,
    "znotes_redo_command": null,
    "znotes_cut_command": null,
    "znotes_copy_command": null,
    "znotes_paste_command": null,
    "znotes_delete_command": null,
    "znotes_selectall_command": null
  };
  
  pub.init = function( aWindow ) {
    if ( win ) {
      return;
    }
    win = aWindow;
    var doc = win.document;
    var item = null;
    var command = null;
    var tooltiptext = null;
    var acceltext = null;
    var popupset = doc.getElementById( "znotes_popupset" );
    var items = doc.createElement( "menupopup" );
    popupset.appendChild( items );
    for ( var cmd in commands ) {
      command = doc.getElementById( cmd );
      item = doc.createElement( "menuitem" );
      // znotes_xxxxxx_command
      //        ^^^^^^
      item.setAttribute(
        "key",
        "znotes_" + cmd.substring( 7, cmd.length - 8 ) + "_key"
      );
      commands[ cmd ] = {
        command: command,
        item: item
      };
      items.appendChild( item );
    }
    items.openPopup( null, null, 0, 0, true, false, null );
    items.hidePopup();
    for ( var cmd in commands ) {
      command = commands[cmd].command;
      item = commands[cmd].item;
      tooltiptext = command.getAttribute( "tooltiptext" );
      acceltext = item.getAttribute( "acceltext" );
      if ( acceltext.length > 0 ) {
        tooltiptext += "\n" + acceltext;
        command.setAttribute( "tooltiptext", tooltiptext );
      }
      commands[cmd] = command;
    }
    while ( items.firstChild ) {
      items.removeChild( items.firstChild );
    }
    popupset.removeChild( items );
  };
  
  pub.done = function() {
    for ( var cmd in commands ) {
      var command = commands[cmd];
      if ( command ) {
        var tooltiptext = command.getAttribute( "tooltiptext" );
        var index = tooltiptext.indexOf( "\n" );
        if ( index >= 0 ) {
          tooltiptext = tooltiptext.substring( 0, index );
          command.setAttribute( "tooltiptext", tooltiptext );
        }
        commands[cmd] = null;
      }
    }
    win = null;
  };

  pub.supportsCommand = function( cmd ) {
    if ( !win ) {
      throw new CommandManagerException( "CommandManager was not initialized." );
    }
    return ( cmd in commands );
  };
  
  pub.getCommand = function( cmd ) {
    if ( !win ) {
      throw new CommandManagerException( "CommandManager was not initialized." );
    }
    return getCommand( cmd );
  };
  
  pub.setCommandEnabled = function( cmd, enabled ) {
    var command = pub.getCommand( cmd );
    if ( command.hasAttribute( "enabled" ) ) {
      command.removeAttribute( "enabled" );
    }
    if ( enabled ) {
      if ( command.hasAttribute( "disabled" ) ) {
        command.removeAttribute( "disabled" );
      }
    } else {
      command.setAttribute( "disabled", "true" );
    }
  };
  
  pub.isCommandEnabled = function( cmd ) {
    var command = pub.getCommand( cmd );
    if ( !command.hasAttribute( "disabled" ) ) {
      return true;
    }
    return ( command.getAttribute( "disabled" ).toLowerCase() == "false" );
  };
  
  pub.updateCommand = function( cmd ) {
    var command = pub.getCommand( cmd );
    try {
      var controller = win.top.document.commandDispatcher
                          .getControllerForCommand( cmd );
      var enabled = false;
      if ( controller ) {
        enabled = controller.isCommandEnabled( cmd );
      }  
      pub.setCommandEnabled( cmd, enabled );
    } catch ( e ) {
      log( e );
    }
  };

  pub.updateCommands = function() {
    for ( var cmd in commands ) {
      var command = pub.getCommand( cmd );
      try {
        var controller = win.top.document.commandDispatcher
                            .getControllerForCommand( cmd );
        var enabled = false;
        if ( controller ) {
          enabled = controller.isCommandEnabled( cmd );
        }  
        pub.setCommandEnabled( cmd, enabled );
      } catch ( e ) {
        log( e );
      }
    }
  };
  
  pub.doCommand = function( cmd ) {
    var command = pub.getCommand( cmd );
    try {
      var controller = win.top.document.commandDispatcher
                          .getControllerForCommand( cmd );
      if ( controller && controller.isCommandEnabled( cmd ) ) {
        controller.doCommand( cmd );
      }
    } catch ( e ) {
      log( e );
    }
  };
  
  return pub;

}();
