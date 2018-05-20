import languages from '@/helpers/languages'

const uiLanguage = browser.i18n.getUILanguage()
const shortUiLanguage = uiLanguage.split('-')[0]
const defaultLanguage = languages.find((language) => language === uiLanguage || language === shortUiLanguage) || 'en'

const defaultSettings = {
  translationLanguage: defaultLanguage,
  showTranslatedLanguage: true,
  buttonPosition: 'corner'
}

export default () => browser.storage.local.get(defaultSettings)
