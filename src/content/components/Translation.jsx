import { h, Component } from 'preact'
import t from '@/helpers/t'

export default class Translation extends Component {
  render({ status, translation, single, showTranslatedLanguage, buttons, closing, onClose }) {
    return (
      <div className={`translation ${closing ? 'm-closing' : ''}`}>
        <div className="translation_background" onClick={onClose}/>
        <div className="translation_content">
          {status === 'loading' && <div className="translation_loader"/>}
          {status === 'success' && (
            <div className="translation_info">
              {translation.main && (
                <div className={`translation_main ${single ? 'm-single' : ''}`}>{translation.main}</div>
              )}
              {translation.secondary.length !== 0 && (
                <div className="translation_secondary">
                  {translation.secondary.map(({ pos, words }) => (
                    <div key={pos} className="translation_pos">
                      {t(pos)}: {words.join(', ')}
                    </div>
                  ))}
                </div>
              )}
              {showTranslatedLanguage &&
                translation.language && (
                  <div className="translation_language">
                    {t('language')}: {t(translation.language)}
                  </div>
                )}
            </div>
          )}
          {status === 'failed' && (
            <div className="translation_error">
              <div className="translation_error-sign">❌</div>
              {t('requestError')}
            </div>
          )}
          <div className="translation_buttons">
            {buttons.map(({ text, primary, onClick }) => (
              <div key={text} className={`translation_button ${primary ? 'm-primary' : ''}`} onClick={onClick}>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
}
