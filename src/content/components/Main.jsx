import { h, Component } from 'preact'
import t from '@/helpers/t'
import translate from '@/helpers/translate'
import getSettings from '@/helpers/get-settings'
import pick from '@/helpers/pick'
import kebabCase from '@/helpers/kebab-case'
import copyToClipboard from '@/helpers/copy-to-clipboard'
import Translation from '@/content/components/Translation'

const animationDuration = 200
const settingKeys = ['showTranslatedLanguage', 'buttonPosition']

export default class Main extends Component {
  constructor() {
    super()

    this.selectedText = null
    this.currentText = null
    this.translation = null
    this.position = { top: 0, left: 0, width: 0, height: 0 }
    this.state = {
      showButton: false,
      requestStatus: 'pending',
      translationClosing: false,
      showTranslatedLanguage: null,
      buttonPosition: null
    }
  }

  async componentWillMount() {
    const { selectionListener, storageListener } = this.props
    selectionListener(this.onSelectionChange)
    storageListener(this.onStorageChange)

    const settings = await getSettings()
    this.setState((state) => ({ ...state, ...pick(settings, settingKeys) }))
  }

  onSelectionChange = (selection) => {
    this.selectedText = selection.toString()
    this.position = selection.getRangeAt(0).getBoundingClientRect()
    this.setState((state) => ({ ...state, showButton: !!this.selectedText }))
  }

  onStorageChange = (changes) => {
    const newSettings = Object.entries(pick(changes, settingKeys)).reduce((result, [key, { newValue }]) => {
      result[key] = newValue
      return result
    }, {})
    this.setState((state) => ({ ...state, ...newSettings }))
  }

  onTranslate = () => {
    window.getSelection().removeAllRanges()
    this.currentText = this.selectedText
    this.translate()
  }

  copyToClipboard = () => {
    copyToClipboard(this.translation.main)
    this.closeTranslation()
  }

  closeTranslation = () => {
    this.setState((state) => ({ ...state, translationClosing: true }))
    setTimeout(() => {
      this.setState((state) => ({ ...state, requestStatus: 'pending', translationClosing: false }))
    }, animationDuration)
  }

  translate = async () => {
    this.setState((state) => ({ ...state, showButton: false, requestStatus: 'loading' }))

    let newStatus
    try {
      this.translation = await translate(this.currentText)
      newStatus = 'success'
    } catch (ex) {
      newStatus = 'failed'
    } finally {
      if (this.state.requestStatus === 'loading' && !this.state.translationClosing) {
        this.setState((state) => ({ ...state, requestStatus: newStatus }))
      }
    }
  }

  buttonStyle() {
    const { buttonPosition } = this.state
    if (buttonPosition === 'corner') return {}
    return {
      top: this.position.top + this.position.height + window.scrollY,
      left: this.position.left + this.position.width + window.scrollX
    }
  }

  buttons() {
    const { requestStatus } = this.state

    if (requestStatus === 'loading') {
      return [
        {
          text: t('cancel'),
          primary: true,
          onClick: this.closeTranslation
        }
      ]
    }
    if (requestStatus === 'success') {
      return [
        {
          text: t('copyToClipboard'),
          onClick: this.copyToClipboard
        },
        {
          text: t('close'),
          primary: true,
          onClick: this.closeTranslation
        }
      ]
    }
    if (requestStatus === 'failed') {
      return [
        {
          text: t('tryAgain'),
          primary: true,
          onClick: this.translate
        }
      ]
    }
  }

  render(_, { showButton, requestStatus, translationClosing, showTranslatedLanguage, buttonPosition }) {
    return (
      <div className="container">
        {requestStatus !== 'pending' && (
          <Translation
            status={requestStatus}
            translation={this.translation}
            single={this.currentText.split(' ').length === 1}
            showTranslatedLanguage={showTranslatedLanguage}
            buttons={this.buttons()}
            closing={translationClosing}
            onClose={this.closeTranslation}
          />
        )}
        {showButton && (
          <div
            className={`translation-button m-${kebabCase(buttonPosition)}`}
            style={this.buttonStyle()}
            onClick={this.onTranslate}>
            <img className="translation-button_image" src={browser.runtime.getURL('icons/icon.png')}/>
          </div>
        )}
      </div>
    )
  }
}
