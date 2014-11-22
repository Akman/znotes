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

/* main */

pref("toolkit.defaultChromeURI", "chrome://znotes/content/znotes.xul");
pref("toolkit.singletonWindowType", true);
pref("toolkit.defaultChromeFeatures", "chrome=yes,dialog=no,resizable=yes,centerscreen=yes,menubar=yes,toolbar=yes,status=yes");
pref("intl.locale.matchOS", false);
pref("browser.chromeURL", "chrome://znotes/content/browser.xul");
pref("accessibility.typeaheadfind.flashBar", 0);
pref("print.use_global_printsettings", true);
pref("print.save_print_settings", true);
pref("layout.xml.prettyprint", true);
/* debug mode */

/*
pref("browser.dom.window.dump.enabled", true);
pref("javascript.options.showInConsole", true);
pref("javascript.options.strict", true);
pref("nglayout.debug.disable_xul_cache", true);
pref("nglayout.debug.disable_xul_fastload", true);
*/
pref("devtools.debugger.remote-enabled", true);

/* extensions */

pref("xpinstall.dialog.confirm", "chrome://mozapps/content/xpinstall/xpinstallConfirm.xul");
pref("xpinstall.dialog.progress.skin", "chrome://mozapps/content/extensions/extensions.xul?type=themes");
pref("xpinstall.dialog.progress.chrome", "chrome://mozapps/content/extensions/extensions.xul?type=extensions");
pref("xpinstall.dialog.progress.type.skin", "Extension:Manager-themes");
pref("xpinstall.dialog.progress.type.chrome", "Extension:Manager-extensions");
pref("extensions.dss.enabled", false);
pref("extensions.dss.switchPending", false);
pref("extensions.ignoreMTimeChanges", false);
pref("extensions.logging.enabled", false);
pref("general.skins.selectedSkin", "classic/1.0");

/* extensions update */

pref("extensions.getAddons.cache.enabled", true);
pref("extensions.update.enabled", false);
pref("extensions.update.interval", 86400);
pref("extensions.update.url", "chrome://mozapps/locale/extensions/extensions.properties");
pref("extensions.getMoreExtensionsURL", "chrome://mozapps/locale/extensions/extensions.properties");
pref("extensions.getMoreThemesURL", "chrome://mozapps/locale/extensions/extensions.properties");

/* application update */

// Whether or not app updates are enabled
pref("app.update.enabled", false); // true
// This preference turns on app.update.mode and allows automatic download and
// install to take place. We use a separate boolean toggle for this to make
// the UI easier to construct.pref("app.update.auto", true);
pref("app.update.auto", false); // true
// Defines how the Application Update Service notifies the user about updates:
//
// AUM Set to:        Minor Releases:     Major Releases:
// 0                  download no prompt  download no prompt
// 1                  download no prompt  download no prompt
//                                        if no incompatibilities
// 2                  download no prompt  prompt
//
// See chart in nsUpdateService.js.in for more details
pref("app.update.mode", 1);
// If set to true, the Update Service will present no UI for any event.
pref("app.update.silent", false);
// Update service URL:
// You do not need to use all the %VAR% parameters.
// Use what you need, %PRODUCT%,%VERSION%,%BUILD_ID%,%CHANNEL% for example
// Full: https://yourserver.net/update/3/%PRODUCT%/%VERSION%/%BUILD_ID%/%BUILD_TARGET%/%LOCALE%/%CHANNEL%/%OS_VERSION%/%DISTRIBUTION%/%DISTRIBUTION_VERSION%/update.xml
// '3' is the schema version
// PRODUCT: App name (e.g., 'Firefox')
// VERSION: App version (e.g. '3.0a8pre')
// BUILD_ID: Build ID (e.g., '2007083015')
// BUILD_TARGET: Build target (e.g., 'Darwin_x86-gcc3')
// LOCALE: App locale (e.g., 'en-US')
// CHANNEL: AUS channel (e.g., 'default')
// OS_VERSION: Operating System version (e.g., 'Darwin%208.10.1')
// DISTRIBUTION: Name of customized distribution, if any (e.g., 'testpartner')
// DISTRIBUTION_VERSION: Version of the customized distribution (e.g., '1.0)
pref("app.update.url", "http://znotes.net/update/%LOCALE%/%VERSION%/%BUILD_TARGET%/update.xml");
// User-settable override to app.update.url for testing purposes.
//pref("app.update.url.override", "");
// URL user can browse to manually if for some reason all update installation
// attempts fail.
pref("app.update.url.manual", "http://znotes.net/%LOCALE%/downloads.xhtml");
// A default value for the "More information about this update" link
// supplied in the "An update is available" page of the update wizard.
pref("app.update.url.details", "http://znotes.net/%LOCALE%/news.xhtml");
// Interval: Time between checks for a new version (in seconds)
//           default=1 day
// 1d = 24h * 60m * 60s = 86400s
pref("app.update.interval", 86400);
// Interval: Time before prompting the user to download a new version that
//           is available (in seconds) default=1 day
pref("app.update.nagTimer.download", 86400);
// Interval: Time before prompting the user to restart to install the latest
//           download (in seconds) default=30 minutes
pref("app.update.nagTimer.restart", 1800);
// Interval: When all registered timers should be checked (in milliseconds)
//           default=5 seconds
pref("app.update.timer", 600000);
// Whether or not we show a dialog box informing the user that the update was
// successfully applied. This is off in Firefox by default since we show a
// upgrade start page instead! Other apps may wish to show this UI, and supply
// a whatsNewURL field in their brand.properties that contains a link to a page
// which tells users what's new in this new update.
pref("app.update.showInstalledUI", false);
// 0 = suppress prompting for incompatibilities if there are updates available
//     to newer versions of installed addons that resolve them.
// 1 = suppress prompting for incompatibilities only if there are VersionInfo
//     updates available to installed addons that resolve them, not newer
//     versions.
pref("app.update.incompatible.mode", 0);
// Update channel
pref("app.update.channel", "default");
