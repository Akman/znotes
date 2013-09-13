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

// Called when the add-on needs to start itself up.
// This happens at application launch time, when the add-on
// is enabled after being disabled or after the add-on has
// been shut down in order to install an update.
// As such, this can be called many times during the lifetime
// of the application session. This is where user interface
// components should be injected.
function install() {
}

// Called when the add-on needs to shut itself down, such as
// when application is terminating or when the add-on is about
// to be upgraded or disabled. Any user interface components
// that has been injected must be removed, tasks shut down,
// and objects disposed of.
function uninstall() {
}

// Called by application before the first call to startup() after
// the add-on is installed, upgraded, or downgraded.
/**
 * data - A JavaScript object containing basic information about
 *        the add-on including id, version, and installPath
 * reason - A constant indicating why the API is being called
*/
function startup( data, reason ) {
}

// Called by application after the last call to shutdown() before
// a particular version of an add-on is uninstalled.
// Not called if install() was never called.
function shutdown( data, reason ) {
}

/*
APP_STARTUP	  1	startup() The application is starting up
APP_SHUTDOWN	2	shutdown() The application is shutting down	
ADDON_ENABLE	3	The add-on is being enabled	startup()
ADDON_DISABLE	4	The add-on is being disabled	shutdown()
ADDON_INSTALL	5	The add-on is being installed	startup()
install()
ADDON_UNINSTALL	6	The add-on is being uninstalled	shutdown()
uninstall()
ADDON_UPGRADE	7	The add-on is being upgraded	startup()
shutdown()
install()
uninstall()
ADDON_DOWNGRADE	8	The add-on is being downgraded	startup()
shutdown()
install()
uninstall()
*/
