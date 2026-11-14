import { useEffect, useState } from 'react'
import LanguageSwitcher from './LanguageSwitcher.jsx'
import MockExam from './MockExam.jsx'
import { supportedLanguages, translate, translateApiError } from './translations.js'
import './App.css'

function getSavedLanguage() {
  try {
    const savedLanguage = localStorage.getItem('fieldnote-language')
    return supportedLanguages.includes(savedLanguage) ? savedLanguage : 'en'
  } catch {
    return 'en'
  }
}

function App() {
  const [language, setLanguage] = useState(getSavedLanguage)
  const [mode, setMode] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState('')
  const [user, setUser] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    document.documentElement.lang = language
    try {
      localStorage.setItem('fieldnote-language', language)
    } catch {
      // The selected language still applies for this session when storage is unavailable.
    }
  }, [language])

  useEffect(() => {
    let cancelled = false

    fetch('/api/auth/me')
      .then(async (response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!cancelled && data?.user) setUser(data.user)
      })
      .catch(() => {
        if (!cancelled) setStatus(translate(language, 'connectError'))
      })

    return () => {
      cancelled = true
    }
  }, [language])

  async function handleSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const isRegistering = mode === 'register'
    const email = formData.get('email')
    const password = formData.get('password')

    if (isRegistering && password !== formData.get('confirmPassword')) {
      setStatus(translate(language, 'passwordMismatch'))
      return
    }

    setIsSubmitting(true)
    setStatus('')

    try {
      const response = await fetch(`/api/auth/${isRegistering ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          rememberMe: formData.get('rememberMe') === 'on',
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(translateApiError(language, data.error) || translate(language, 'signInError'))
      }
      setUser(data.user)
      setStatus(translate(language, isRegistering ? 'accountReady' : 'signedIn'))
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      setStatus(message === 'Failed to fetch' ? translate(language, 'connectError') : message || translate(language, 'signInError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSignOut() {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      if (!response.ok) throw new Error(translate(language, 'signOutError'))
      setUser(null)
      setStatus(translate(language, 'signedOut'))
    } catch (error) {
      setStatus(error instanceof Error ? error.message : translate(language, 'signOutError'))
    }
  }

  if (user) return <MockExam user={user} language={language} onLanguageChange={setLanguage} onSignOut={handleSignOut} />

  return (
    <main className="login-layout" lang={language}>
      <section className="visual-panel" aria-label={translate(language, 'loginRegion')}>
        <img
          className="visual-image"
          src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1800&q=85"
          alt={translate(language, 'loginImageAlt')}
        />
        <div className="visual-shade" aria-hidden="true" />
        <a className="brand" href="#sign-in" aria-label="Fieldnote home">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span>fieldnote</span>
        </a>
        <div className="visual-caption">
          <span className="overline">{translate(language, 'visualEyebrow')}</span>
          <p>{translate(language, 'visualTitleLead')} <em>{translate(language, 'visualTitleAccent')}</em></p>
          <span className="image-credit">{translate(language, 'heroCredit')}</span>
        </div>
      </section>

      <section className="login-panel" id="sign-in">
        <div className="login-language">
          <LanguageSwitcher language={language} onChange={setLanguage} />
        </div>
        <div className="login-content">
          <span className="overline panel-overline">{translate(language, 'loginKicker')}</span>
          <h1>{translate(language, mode === 'login' ? 'welcome' : 'registerTitle')}</h1>
          <p className="intro">
            {translate(language, mode === 'login' ? 'welcomeSubtitle' : 'registerSubtitle')}
          </p>

          <div className="auth-switch" role="tablist" aria-label={translate(language, 'accountOptions')}>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => { setMode('login'); setStatus('') }}
            >
              {translate(language, 'signIn')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              onClick={() => { setMode('register'); setStatus('') }}
            >
              {translate(language, 'createAccount')}
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field-group">
              <label htmlFor="email">{translate(language, 'email')}</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder={translate(language, 'emailPlaceholder')}
                maxLength={254}
                required
              />
            </div>

            <div className="field-group">
              <label htmlFor="password">{translate(language, 'password')}</label>
              <div className="password-field">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  placeholder={mode === 'register' ? translate(language, 'passwordHint') : translate(language, 'passwordPlaceholder')}
                  minLength={mode === 'register' ? 8 : undefined}
                  maxLength={72}
                  required
                />
                <button
                  className="visibility-toggle"
                  type="button"
                  aria-label={translate(language, showPassword ? 'hidePassword' : 'showPassword')}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {translate(language, showPassword ? 'hidePassword' : 'showPassword')}
                </button>
              </div>
            </div>

            {mode === 'register' ? (
              <div className="field-group">
                <label htmlFor="confirm-password">{translate(language, 'confirmPassword')}</label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder={translate(language, 'confirmPasswordPlaceholder')}
                  minLength={8}
                  maxLength={72}
                  required
                />
              </div>
            ) : (
              <div className="form-options">
                <label className="remember-option">
                  <input type="checkbox" name="rememberMe" />
                  <span>{translate(language, 'keepSignedIn')}</span>
                </label>
                <span className="member-hint">{translate(language, 'secureAccess')}</span>
              </div>
            )}

            <button className="submit-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? translate(language, 'pleaseWait') : translate(language, mode === 'register' ? 'createAccount' : 'signIn')}
            </button>
            <p className="form-status" role="status" aria-live="polite">{status}</p>
          </form>

          <p className="member-note">{translate(language, 'createOrSignIn')}</p>
        </div>
        <footer className="page-footer">
          <span>{translate(language, 'footerStudio')}</span>
          <span>{translate(language, 'footerPrivate')}</span>
        </footer>
      </section>
    </main>
  )
}

export default App
