var Cc = Components.classes;
var Ci = Components.interfaces;
var Cr = Components.results;

function Console2Handler() {}
Console2Handler.prototype = {

  classDescription: "jsConsoleHandler",
  classID: Components.ID("{1280606b-2510-4fe0-97ef-9b5a22eafe81}"),
  // contractID: "@zeniko/console2-clh;1",
  contractID: "@mozilla.org/commandlinehandler/general-startup;1?type=console2",

  mClassName: "Console² Component",
  mCategory: "b-console2",
  mCategory2: "console2 command line handler", // XPFE

  _xpcom_categories: [{category: "command-line-handler", entry: this.mCategory}],

/* ........ nsIModule .............. */

  getClassObject: function(aCompMgr, aCID, aIID)
  {
    if (!aCID.equals(this.classID))
      throw Cr.NS_ERROR_NO_INTERFACE;
    if (!aIID.equals(Ci.nsIFactory))
      throw Cr.NS_ERROR_NOT_IMPLEMENTED;
    return this.QueryInterface(aIID);
  },

  registerSelf: function(aCompMgr, aFileSpec, aLocation, aType)
  {
    aCompMgr.QueryInterface(Ci.nsIComponentRegistrar);
    aCompMgr.registerFactoryLocation(this.classID,
                                     this.mCategory,
                                     this.contractID,
                                     aFileSpec,
                                     aLocation,
                                     aType);
    
    var catMan = Cc["@mozilla.org/categorymanager;1"]
                    .getService(Ci.nsICategoryManager);
    catMan.addCategoryEntry("command-line-handler",
                            this.mCategory,
                            this.contractID,
                            true,
                            true);
    catMan.addCategoryEntry("command-line-argument-handlers",
                            this.mCategory2,
                            this.contractID,
                            true,
                            true);
    catMan.addCategoryEntry("app-startup",
                            this.mClassName,
                            "service," + this.contractID,
                            true,
                            true);
  },

  unregisterSelf: function(aCompMgr, aLocation, aType)
  {
    aCompMgr.QueryInterface(Ci.nsIComponentRegistrar);
    aCompMgr.unregisterFactoryLocation(this.classID, aLocation);
    
    var catMan = Cc["@mozilla.org/categorymanager;1"]
                    .getService(Ci.nsICategoryManager);
    catMan.deleteCategoryEntry("command-line-handler",
                               this.mCategory, true);
    catMan.deleteCategoryEntry("command-line-argument-handlers",
                               this.mCategory2,
                               true);
    catMan.deleteCategoryEntry("app-startup",
                               "service," + this.contractID,
                               true);
  },

  canUnload: function(aCompMgr)
  {
    return true;
  },

/* ........ nsIFactory .............. */

  createInstance: function(aOuter, aIID)
  {
    if (aOuter != null)
      throw Cr.NS_ERROR_NO_AGGREGATION;
    return this.QueryInterface(aIID);
  },

  lockFactory: function(aLock) { },

/* ........ nsICommandLineHandler .............. */

  helpInfo: "   -console2          Open the Error Console.\n",

  handle: function(aCmdLine)
  {
    if (!aCmdLine.handleFlag("console2", false))
      return;

    var console = Cc["@mozilla.org/appshell/window-mediator;1"]
                    .getService(Ci.nsIWindowMediator)
                    .getMostRecentWindow("global:console");
    if (console)
      console.focus();
    else
      Cc["@mozilla.org/embedcomp/window-watcher;1"]
        .getService(Ci.nsIWindowWatcher)
        .openWindow(null,
                    "chrome://console2/content/console2.xul",
                    "_blank",
                    "chrome,dialog=no,all",
                    aCmdLine);

    //if (aCmdLine.state == Ci.nsICommandLine.STATE_REMOTE_AUTO) //Bug 395371.
      aCmdLine.preventDefault = true;
  },

/* ........ nsICmdLineHandler (XPFE) .............. */

  commandLineArgument: "-console2",
  prefNameForStartup: "general.startup.jsconsole",
  chromeUrlForTask: "chrome://console2/content/console2.xul",
  helpText: "-console2  Open the Error Console.",
  handlesArgs: false,
  defaultArgs: null,
  openWindowWithArgs: false,

/* ........ nsIObserver .............. */

  observe: function(aSubject, aTopic, aData)
  {
    switch (aTopic)
    {
    case "app-startup":
      Cc["@mozilla.org/observer-service;1"]
        .getService(Ci.nsIObserverService)
        .addObserver(this, "browser:purge-session-history", false);
      break;
    case "browser:purge-session-history":
      var cs = Cc["@mozilla.org/consoleservice;1"]
                 .getService(Ci.nsIConsoleService);
      if (!cs.reset && !Ci.nsIConsoleService_MOZILLA_1_8_BRANCH) // Firefox 1.5
      {
        // make sure to overwrite the whole buffer
        for (var i = 0; i < 250; i++)
          cs.logStringMessage(null);
      }
      break;
    }
  },

/* ........ QueryInterface .............. */

  QueryInterface: function(aIID)
  {
    if (aIID.equals(Ci.nsISupports) ||
      aIID.equals(Ci.nsIModule) ||
      aIID.equals(Ci.nsIFactory) ||
      aIID.equals(Ci.nsICommandLineHandler) ||
      aIID.equals(Ci.nsICmdLineHandler) ||
      aIID.equals(Ci.nsIObserver))
    {
      return this;
    }
    throw Components.results.NS_ERROR_NO_INTERFACE;
  }
};

try
{
  Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
}
catch(e) { }

/**
* XPCOMUtils.generateNSGetFactory was introduced in Mozilla 2 (Firefox 4).
* XPCOMUtils.generateNSGetModule is for Mozilla 1.9.1 (Firefox 3.5).
*/

if ("undefined" == typeof XPCOMUtils) // Firefox <= 2.0
{
  function NSGetModule(aComMgr, aFileSpec)
  {
    return new Console2Handler();
  }
}
else if (XPCOMUtils.generateNSGetFactory)
  var NSGetFactory = XPCOMUtils.generateNSGetFactory([Console2Handler]);
else
  var NSGetModule = XPCOMUtils.generateNSGetModule([Console2Handler]);
