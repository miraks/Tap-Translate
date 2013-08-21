`const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;`

Cu.import "resource://gre/modules/Services.jsm"

DEBUG = false


TapTranslate =
  _prefsBranch: "extensions.taptranslate."
  _prefs: null
  _contextMenus: []

  init: ->
    @setDefaultPrefs()
    @_prefs = Services.prefs.getBranch @_prefsBranch

  uninit: ->
    @_prefs = null

  setDefaultPrefs: ->
    prefs = Services.prefs.getDefaultBranch @_prefsBranch
    prefs.setCharPref "translation_language", "en"

  setTranslationLanguage: (language) ->
    @_prefs.setCharPref "translation_language", language

  install: ->

  uninstall: ->

  load: (aWindow) ->
    return unless aWindow
    @setupUI aWindow

  unload: (aWindow) ->
    return unless aWindow
    @cleanupUI aWindow

  setupUI: (aWindow) ->
    searchOnContext =
      matches: (aElement, aX, aY) ->
        aWindow.SelectionHandler.shouldShowContextMenu aX, aY

    menu = aWindow.NativeWindow.contextmenus.add(
      utils.t("Translate")
      searchOnContext
      (target) =>
        text = utils.getSelectedText aWindow
        @_translate aWindow, text
    )

    @_contextMenus.push menu

  cleanupUI: (aWindow) ->
    @_contextMenus.forEach (menu) ->
      aWindow.NativeWindow.contextmenus.remove menu

    @_contextMenus = []

  _translate: (aWindow, text) ->
    translationLanguage = @_prefs.getCharPref "translation_language"

    request = requestBuilder.build(
      translationLanguage
      text
      (event) =>
        translation = JSON.parse event.target.responseText
        @_showTranslation aWindow, translation
      =>
        @_translationErrorNotify aWindow
    )

    request.send()

  _showTranslation: (aWindow, translation) ->
    msg = translation.sentences[0].trans

    if translation.dict
      msg += "\n"
      translation.dict.forEach (part) ->
        msg += "\n"
        pos = utils.capitalize part.pos
        msg += "#{pos}: #{part.terms.join(", ")}"

    aWindow.NativeWindow.doorhanger.show(
      msg
      "Translation"
      [{ label: utils.t("Close") }]
    )

  _translationErrorNotify: (aWindow) ->
    msg = utils.t "TranslationRequestError"
    aWindow.NativeWindow.toast.show msg


requestBuilder =
  url: "http://translate.google.com/translate_a/t"
  XMLHttpRequest: Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]

  createXMLHttpRequest: (params) ->
    return Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest)

  build: (translationLanguage, text, successHandler, errorHandler) ->
    params =
      client: "p"
      sl: "auto"
      tl: translationLanguage
      text: text

    query = []
    for param, value of params
      query.push "#{param}=#{encodeURIComponent(value)}"
    query = query.join "&"
    url = "#{@url}?#{query}"

    request = @createXMLHttpRequest()
    request.open "GET", url
    request.addEventListener "load", successHandler, false
    request.addEventListener "error", errorHandler, false
    request


utils =
  _translations: null
  _translations_uri: "chrome://taptranslate/locale/taptranslate.properties"

  log: (msg) ->
    return unless DEBUG
    msg = "log: #{msg}"
    Services.console.logStringMessage msg
    Cu.reportError msg

  inspect: (object, prefix = "") ->
    return unless DEBUG
    for key, value of object
      type = typeof value
      if @isObject value
        @inspect value, "#{prefix}{#{key}} "
      else
        @log "#{prefix}#{key} => (#{type}) value"

  isObject: (obj) ->
    !!obj and obj.constructor == Object

  t: (name) ->
    unless @_translations
      @_translations = Services.strings.createBundle @_translations_uri

    try
      @_translations.GetStringFromName name
    catch
      name

  getSelectedText: (aWindow) ->
    win = aWindow.BrowserApp.selectedTab.window
    selection = win.getSelection()
    return "" if !selection or selection.isCollapsed
    selection.toString().trim()

  capitalize: (word) ->
    word.charAt(0).toUpperCase() + word.slice(1)

install = (aData, aReason) ->
  TapTranslate.install()

uninstall = (aData, aReason) ->
  TapTranslate.uninstall if aReason == ADDON_UNINSTALL

startup = (aData, aReason) ->
  settingsObserver.init()
  TapTranslate.init()

  windows = Services.wm.getEnumerator "navigator:browser"
  while windows.hasMoreElements()
    win = windows.getNext().QueryInterface Ci.nsIDOMWindow
    TapTranslate.load win if win

  Services.wm.addListener windowListener

shutdown = (aData, aReason) ->
  return if aReason == APP_SHUTDOWN

  Services.wm.removeListener windowListener

  windows = Services.wm.getEnumerator "navigator:browser"
  while windows.hasMoreElements()
    win = windows.getNext().QueryInterface Ci.nsIDOMWindow
    TapTranslate.unload win if win

  TapTranslate.uninit()
  settingsObserver.uninit()

windowListener =
  onOpenWindow: (aWindow) ->
    win = aWindow.QueryInterface(Ci.nsIInterfaceRequestor)
                 .getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow)

    win.addEventListener "UIReady", ->
      win.removeEventListener "UIReady", arguments.callee, false
      TapTranslate.load win
    , false

  onCloseWindow: ->

  onWindowTitleChange: ->

#
# Fennec bug workaround
# See https://bugzilla.mozilla.org/show_bug.cgi?id=891736
#

settingsObserver =
  init: ->
    Services.obs.addObserver @, "addon-options-displayed", false

  uninit: ->
    Services.obs.removeObserver @, "addon-options-displayed"

  observe: (subject, topic, data) ->
    @fixTranslationMenu subject.QueryInterface(Ci.nsIDOMDocument)

  fixTranslationMenu: (doc) ->
    menu = doc.getElementById "tap-translate-translation-language-selector"
    return unless menu

    menu.watch "selectedIndex", (prop, oldIndex, newIndex) ->
      language = menu.getItemAtIndex(newIndex).value
      TapTranslate.setTranslationLanguage language
      newIndex