import { h, Component } from 'preact'
import t from '@/helpers/t'
import languages from '@/helpers/languages'
import getSettings from '@/helpers/get-settings'

export default class Main extends Component {
  constructor() {
    super()

    this.languages = languages.map((language) => ({
      id: language,
      name: t(language)
    }))
  }

  async componentWillMount() {
    const settings = await getSettings()
    this.setState((state) => ({ ...state, ...settings }))
  }

  onTranslationLanguageChange = (event) => {
    this.setSetting('translationLanguage', event.target.value)
  }

  onShowTranslatedLanguageChange = (event) => {
    this.setSetting('showTranslatedLanguage', event.target.checked)
  }

  setSetting(key, value) {
    this.setState((state) => ({ ...state, [key]: value }))
    browser.storage.local.set({ [key]: value })
  }

  render(_, { translationLanguage, showTranslatedLanguage }) {
    return (
      <div id="options">
        <label>
          {t('translationLanguage')}
          <select value={translationLanguage} onChange={this.onTranslationLanguageChange}>
            {this.languages.map(({ id, name }) => (
              <option key={id} value={id} selected={id === translationLanguage}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('showTranslatedLanguage')}
          <input type="checkbox" checked={showTranslatedLanguage} onChange={this.onShowTranslatedLanguageChange}/>
        </label>
      </div>
    )
  }
}
