`const { classes: Cc, interfaces: Ci, utils: Cu } = Components;`

Cu.import "resource://gre/modules/Services.jsm"

TapTranslate =
  _prefsBranch: "extensions.taptranslate."
  _prefs: null
  _contextMenus: []

  init: (@addonData) ->
    @_setDefaultPrefs()
    @_prefs = Services.prefs.getBranch @_prefsBranch

  uninit: ->
    @_prefs = null

  setTranslationLanguage: (language) ->
    @_prefs.setCharPref "translation_language", language

  showTranslatedLanguage: ->
    @_prefs.getBoolPref "show_translated_language"

  _setDefaultPrefs: ->
    prefs = Services.prefs.getDefaultBranch @_prefsBranch
    prefs.setCharPref "translation_language", "en"
    prefs.setBoolPref "show_translated_language", false

  install: ->

  uninstall: ->

  load: (aWindow) ->
    return unless aWindow
    @setupUI aWindow

  unload: (aWindow) ->
    return unless aWindow
    @cleanupUI aWindow

  setupUI: (aWindow) ->
    label = utils.t "Translate"
    translate = (aElement) =>
      text = utils.getSelectedText aWindow
      aWindow.SelectionHandler._closeSelection()
      @_translate aWindow, text

    action =
      label: label
      id: "translate"
      icon: @addonData.resourceURI.spec + "assets/translate.png"
      action: translate
      showAsAction: false
      order: 0

    # For FF 45+
    if aWindow.ActionBarHandler?
      aWindow.ActionBarHandler.actions.TRANSLATE = Object.assign {}, action,
        selector: aWindow.ActionBarHandler.actions.COPY.selector

    if aWindow.SelectionHandler?
      aWindow.SelectionHandler.addAction Object.assign {}, action,
        selector: aWindow.SelectionHandler.actions.COPY.selector

  cleanupUI: (aWindow) ->
    aWindow.SelectionHandler.removeAction "TRANSLATE"

  _translate: (aWindow, text) ->
    translationLanguage = @_prefs.getCharPref "translation_language"

    request = requestBuilder.build(
      text
      translationLanguage
      (event) =>
        translation = JSON.parse event.target.responseText.replace(/,+/g, ',')
        @_showTranslation aWindow, translation
      =>
        @_translationErrorNotify aWindow
    )

    request.send()

  _showTranslation: (aWindow, translation) ->
    translation = new Translation translation
    translation.show aWindow

  _translationErrorNotify: (aWindow) ->
    msg = utils.t "TranslationRequestError"
    aWindow.NativeWindow.toast.show msg

class Translation
  constructor: (@response) ->

  show: (aWindow) ->
    aWindow.NativeWindow.doorhanger.show(
      @_message()
      "Translation"
      [
        {
          label: utils.t("Copy")
          callback: =>
            @_copyToClipboard()
            aWindow.NativeWindow.toast.show(utils.t("TranslationCopied"), "short")
        },
        {
          label: utils.t("Close")
          callback: ->
          positive: true
        }
      ]
    )

  main: ->
    return unless @response[0]?
    @_main ||= @response[0]
      .filter (part) -> part[0]?
      .map (part) -> part[0]
      .join ""

  secondary: ->
    return unless Array.isArray @response[1]
    @_secondary ||= @response[1]
      .filter (part) -> part[0]? and part[1]?
      .map (part) -> "#{part[0]}: #{part[1].join(", ")}"
      .join "; "

  source: ->
    lang = if Array.isArray(@response[1]) then @response[2] else @response[1]
    utils.t lang

  _message: ->
    msg = ""
    if TapTranslate.showTranslatedLanguage()
      msg += @source()
      msg += "; "
    msg += @main()
    if @secondary()
      msg += "; "
      msg += @secondary()
    msg

  _copyToClipboard: ->
    utils.copyToClipboard @main()

requestBuilder =
  url: "https://translate.google.com/translate_a/single"

  createXMLHttpRequest: (params) ->
    Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest)

  build: (text, translationLanguage, successHandler, errorHandler) ->
    params =
      client: "t"
      sl: "auto"
      tl: translationLanguage
      hl: "en"
      dt: ["bd", "t"]
      tk: @generateTK(text).tk
      q: text

    query = []
    for param, value of params
      if Array.isArray value
        value.forEach (v) -> query.push "#{param}=#{encodeURIComponent(v)}"
      else
        query.push "#{param}=#{encodeURIComponent(value)}"
    query = query.join "&"
    url = "#{@url}?#{query}"

    request = @createXMLHttpRequest()
    request.open "POST", url
    request.setRequestHeader "Content-type", "application/x-www-form-urlencoded"
    request.addEventListener "load", successHandler, false
    request.addEventListener "error", errorHandler, false
    request

  generateTK: (text)->
    # https://addons.mozilla.org/en-US/firefox/files/browse/376615/file/chrome/content/utils.js#L994
    # https://translate.google.hu/translate/releases/twsfe_w_20151214_RC03/r/js/desktop_module_main.js
    `var generate = function(text, SL) {
      var SL = (SL) ? SL : null;
      var QL=function(a){return function(){return a}};
      var cb="&";
      var k="";
      var mf="=";
      var RL=function(a,b){for(var c=0;c<b.length-2;c+=3){var d=b.charAt(c+2),d=d>=t?d.charCodeAt(0)-87:Number(d),d=b.charAt(c+1)==Tb?a>>>d:a<<d;a=b.charAt(c)==Tb?a+d&4294967295:a^d}return a};
      var Vb="+-a^+6";
      var t="a";
      var Tb="+";
      var Ub="+-3^+b+-f";
      var dd=".";
      var TL=function(a){
        var b;
        if(null===SL){
          SL = Math.floor(Math.random() * 1000000);
        }
        b=SL;
        var d=QL(String.fromCharCode(116)),
        c=QL(String.fromCharCode(107)),
        d=[d(),d()];
        d[1]=c();
        for(var c=cb+d.join(k)+mf,d=[],e=0,f=0;f<a.length;f++){
          var g=a.charCodeAt(f);
          128>g?d[e++]=g:(2048>g?d[e++]=g>>6|192:(55296==(g&64512)&&f+1<a.length&&56320==(a.charCodeAt(f+1)&64512)?(g=65536+((g&1023)<<10)+(a.charCodeAt(++f)&1023),d[e++]=g>>18|240,d[e++]=g>>12&63|128):d[e++]=g>>12|224,d[e++]=g>>6&63|128),d[e++]=g&63|128)
        }
        a=b||0;
        for(e=0;e<d.length;e++) { a+=d[e],a=RL(a,Vb); }
        a=RL(a,Ub);
        0>a&&(a=(a&2147483647)+2147483648);
        a%=1E6;

        return a.toString()+dd+(a^b);
      }
      return { 'tk' : TL(text), 'SL' : SL };
    }`
    generate text

utils =
  _translations: null
  _translationsUri: "chrome://taptranslate/locale/taptranslate.properties"

  t: (name) ->
    @_translations ||= Services.strings.createBundle @_translationsUri

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

  copyToClipboard: (text) ->
    @_clipboardHelper ||= Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper)
    @_clipboardHelper.copyString text

  randomNumber: (min, max) ->
    Math.floor(Math.random() * (max - min)) + min

install = (aData, aReason) ->
  TapTranslate.install()

uninstall = (aData, aReason) ->
  TapTranslate.uninstall if aReason == ADDON_UNINSTALL

startup = (aData, aReason) ->
  TapTranslate.init aData

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
