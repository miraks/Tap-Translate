import { h, Component } from 'preact'
import t from '@/helpers/t'
import translate from '@/helpers/translate'
import getSettings from '@/helpers/get-settings'
import copyToClipboard from '@/helpers/copy-to-clipboard'
import Translation from '@/content/components/Translation'

const animationDuration = 200

export default class Main extends Component {
  constructor() {
    super()

    this.selectedText = null
    this.currentText = null
    this.translation = null
    this.state = {
      showButton: false,
      requestStatus: 'pending',
      translationClosing: false,
      showTranslatedLanguage: null
    }
  }

  async componentWillMount() {
    const { selectionListener, storageListener } = this.props
    selectionListener(this.onSelectionChange)
    storageListener(this.onStorageChange)

    const { showTranslatedLanguage } = await getSettings()
    this.setState((state) => ({ ...state, showTranslatedLanguage }))
  }

  onSelectionChange = (selection) => {
    this.selectedText = selection.toString()
    this.setState((state) => ({ ...state, showButton: !!this.selectedText }))
  }

  onStorageChange = ({ showTranslatedLanguage }) => {
    if (showTranslatedLanguage === undefined) return
    this.setState((state) => ({ ...state, showTranslatedLanguage: showTranslatedLanguage.newValue }))
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
    } else if (requestStatus === 'success') {
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
    } else if (requestStatus === 'failed') {
      return [
        {
          text: t('tryAgain'),
          primary: true,
          onClick: this.translate
        }
      ]
    }
  }

  render(_, { showButton, requestStatus, translationClosing, showTranslatedLanguage }) {
    return (
      <div id="tap-translate">
        {showButton && (
          <div className="translation-button" onClick={this.onTranslate}>
            <img className="translation-button_image" src={browser.runtime.getURL('icons/icon.png')}/>
          </div>
        )}
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
      </div>
    )
  }
}
