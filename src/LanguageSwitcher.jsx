import { getMessage, supportedLanguages } from './translations.js'

const languageNames = {
  ja: '日本語',
  en: 'English',
  th: 'ไทย',
}

function LanguageSwitcher({ language, onChange }) {
  return (
    <div className="language-switch" role="group" aria-label={getMessage(language, 'language')}>
      {supportedLanguages.map((option) => (
        <button
          key={option}
          type="button"
          aria-label={languageNames[option]}
          aria-pressed={language === option}
          title={languageNames[option]}
          onClick={() => onChange(option)}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

export default LanguageSwitcher