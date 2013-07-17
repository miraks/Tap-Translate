const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");

let DEBUG = false;

/**
 * Main
 */

let TapTranslate = {
  _prefs: null,
  _contextMenus: [],

  init: function() {
    this.setDefaultPrefs();

    this._prefs = Services.prefs.getBranch("extensions.taptranslate.");
  },

  uninit: function() {
    this._prefs = null;
  },

  setDefaultPrefs: function() {
    let prefs = Services.prefs.getDefaultBranch("extensions.taptranslate.");

    prefs.setCharPref("translation_language", "en");
  },

  setTranslationLanguage: function(language) {
    this._prefs.setCharPref("translation_language", language);
  },

  install: function() {
  },

  uninstall: function() {
  },

  load: function(aWindow) {
    if (!aWindow)
        return;

    // Create UI
    this.setupUI(aWindow);
  },

  unload: function(aWindow) {
    if (!aWindow)
        return;

    // Clean up the UI
    this.cleanupUI(aWindow);
  },

  setupUI: function(aWindow) {
    let self = this;

    // See SelectionHandler and ClipboardHelper
    let searchOnContext = {
      matches: function(aElement, aX, aY) {
        return aWindow.SelectionHandler.shouldShowContextMenu(aX, aY);
      }
    };

    menu = aWindow.NativeWindow.contextmenus.add(
      utils.t("Translate"),
      searchOnContext,
      function(target) {
        text = utils.getSelectedText(aWindow);
        self._translate(aWindow, text);
      }
    );
    this._contextMenus.push(menu);
  },

  cleanupUI: function(aWindow) {
    this._contextMenus.forEach(function(menu) {
      aWindow.NativeWindow.contextmenus.remove(menu);
    });

    this._contextMenus = [];
  },

  _translate: function(aWindow, text) {
    let self = this;

    let translationLanguage = this._prefs.getCharPref("translation_language");
    let request = requestBuilder.build(
      translationLanguage,
      text,
      function(event) {
        let translation = JSON.parse(event.target.responseText);
        self._showTranslation(aWindow, translation);
      },
      function() {
        self._translationErrorNotify(aWindow);
      }
    );

    request.send();
  },

  _showTranslation: function(aWindow, translation) {
    let msg = translation.sentences[0].trans;

    if (translation.dict) {
      msg += "\n";
      translation.dict.forEach(function(part) {
        msg += "\n";
        let pos = part.pos.charAt(0).toUpperCase() + part.pos.slice(1);
        msg += pos + ": " + part.terms.join(", ");
      });
    }

    aWindow.NativeWindow.doorhanger.show(
      msg,
      "Translation",
      [{ label: utils.t("Close") }]
    );
  },

  _translationErrorNotify: function(aWindow) {
    let msg = utils.t("TranslationRequestError");
    aWindow.NativeWindow.toast.show(msg);
  }

};

let requestBuilder = {

  url: "http://translate.google.com/translate_a/t",
  XMLHttpRequest: Cc["@mozilla.org/xmlextras/xmlhttprequest;1"],

  createXMLHttpRequest: function(params) {
    return Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
  },

  build: function(translationLanguage, text, successHandler, errorHandler) {
    let params = {
      client: "p",
      sl: "auto",
      tl: translationLanguage,
      text: text
    };
    let query = [];
    for (let param in params) {
      query.push(param + "=" + params[param]);
    }
    query = query.join("&");
    let url = this.url + "?" + query;

    let request = this.createXMLHttpRequest();
    request.open("GET", url);
    request.addEventListener("load", successHandler, false);
    request.addEventListener("error", errorHandler, false);

    return request;
  },

};

/**
 * Utilities
 */

let utils = {

  _translations: null,

  log: function(msg) {
    if (!DEBUG)
      return;
    msg = "log: " + msg;
    Services.console.logStringMessage(msg);
    // For remote debugging
    Cu.reportError(msg);
  },

  inspect: function(object, prefix) {
    if (!DEBUG)
      return;

    if (typeof prefix === "undefined")
      prefix = "";

    for (let key in object) {
      let value = object[key];
      let type = typeof value;
      if (type === "object") {
        this.inspect(value, prefix + "{" + key + "} ");
      } else {
        this.log(prefix + key + " => (" + type + ") " + value);
      }
    }
  },

  t: function(name) {
    if (!this._translations) {
      let uri = "chrome://taptranslate/locale/taptranslate.properties";
      this._translations = Services.strings.createBundle(uri);
    }

    try {
      return this._translations.GetStringFromName(name);
    } catch (ex) {
      return name;
    }
  },

  getSelectedText: function(aWindow) {
    let win = aWindow.BrowserApp.selectedTab.window;
    let selection = win.getSelection();
    if (!selection || selection.isCollapsed) {
      return "";
    }
    return selection.toString().trim();
  },

};

/**
 * bootstrap.js API
 */

function install(aData, aReason) {
  TapTranslate.install();
}

function uninstall(aData, aReason) {
  if (aReason == ADDON_UNINSTALL)
    TapTranslate.uninstall();
}

function startup(aData, aReason) {
  // General setup
  settingsObserver.init();
  TapTranslate.init();

  // Load into any existing windows
  let windows = Services.wm.getEnumerator('navigator:browser');
  while (windows.hasMoreElements()) {
    let win = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    if (win)
      TapTranslate.load(win);
  }

  // Load into any new windows
  Services.wm.addListener(windowListener);
}

function shutdown(aData, aReason) {
  // When the application is shutting down we normally don't have to clean
  // up any UI changes made
  if (aReason == APP_SHUTDOWN)
    return;

  // Stop listening for new windows
  Services.wm.removeListener(windowListener);

  // Unload from any existing windows
  let windows = Services.wm.getEnumerator('navigator:browser');
  while (windows.hasMoreElements()) {
    let win = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    if (win)
      TapTranslate.unload(win);
  }

  // General teardown
  TapTranslate.uninit();
  settingsObserver.uninit();
}

let windowListener = {
  onOpenWindow: function(aWindow) {
    let win = aWindow.QueryInterface(Ci.nsIInterfaceRequestor)
                     .getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);

    win.addEventListener('UIReady', function() {
      win.removeEventListener('UIReady', arguments.callee, false);
      TapTranslate.load(win);
    }, false);
  },

  // Unused
  onCloseWindow: function(aWindow) {},
  onWindowTitleChange: function(aWindow, aTitle) {}
};

/*
 * Fennec bug workaround
 * See https://bugzilla.mozilla.org/show_bug.cgi?id=891736
*/

let settingsObserver = {
  init: function() {
    Services.obs.addObserver(this, "addon-options-displayed", false);
  },

  uninit: function() {
    Services.obs.removeObserver(this, "addon-options-displayed");
  },

  observe: function(subject, topic, data) {
    this.fixTranslationMenu(subject.QueryInterface(Ci.nsIDOMDocument));
  },

  fixTranslationMenu: function(doc) {
    let menu = doc.getElementById("tap-translate-translation-language-selector");
    if (!menu)
      return;

    menu.watch("selectedIndex", function(prop, oldIndex, newIndex) {
      let language = menu.getItemAtIndex(newIndex).value
      TapTranslate.setTranslationLanguage(language);

      return newIndex;
    });
  },


};