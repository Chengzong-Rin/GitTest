import { useEffect, useState } from 'react'
import MockExam from './MockExam.jsx'
import './App.css'

function App() {
  const [mode, setMode] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState('')
  const [user, setUser] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetch('/api/auth/me')
      .then(async (response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!cancelled && data?.user) setUser(data.user)
      })
      .catch(() => {
        if (!cancelled) setStatus('Could not connect to the sign-in service.')
      })

    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const isRegistering = mode === 'register'
    const email = formData.get('email')
    const password = formData.get('password')

    if (isRegistering && password !== formData.get('confirmPassword')) {
      setStatus('Your passwords do not match.')
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

      if (!response.ok) throw new Error(data.error || 'Unable to sign in.')
      setUser(data.user)
      setStatus(isRegistering ? 'Your account is ready.' : 'You are signed in.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to reach the sign-in service.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSignOut() {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      if (!response.ok) throw new Error('Unable to sign out. Please try again.')
      setUser(null)
      setStatus('You have been signed out.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to sign out.')
    }
  }

  if (user) return <MockExam user={user} onSignOut={handleSignOut} />

  return (
    <main className="login-layout">
      <section className="visual-panel" aria-label="Fieldnote studio">
        <img
          className="visual-image"
          src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1800&q=85"
          alt="Warm, refined living space with elegant modern furnishings"
        />
        <div className="visual-shade" aria-hidden="true" />
        <a className="brand" href="#sign-in" aria-label="Fieldnote home">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span>fieldnote</span>
        </a>
        <div className="visual-caption">
          <span className="overline">A SPACE FOR YOUR NEXT CHAPTER</span>
          <p>Make room for <em>good ideas.</em></p>
          <span className="image-credit">STUDIO NOTES / 04</span>
        </div>
      </section>

      <section className="login-panel" id="sign-in">
        <div className="login-content">
          <span className="overline panel-overline">YOUR STUDIO, IN ONE PLACE</span>
          <h1>{mode === 'login' ? 'Welcome back.' : 'Create your account.'}</h1>
          <p className="intro">
            {mode === 'login' ? 'Pick up where your best work left off.' : 'Join your Fieldnote studio workspace.'}
          </p>

          <div className="auth-switch" role="tablist" aria-label="Account options">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => { setMode('login'); setStatus('') }}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              onClick={() => { setMode('register'); setStatus('') }}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="you@example.com"
                maxLength={254}
                required
              />
            </div>

            <div className="field-group">
              <label htmlFor="password">Password</label>
              <div className="password-field">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  placeholder={mode === 'register' ? 'At least 8 characters' : 'Enter your password'}
                  minLength={mode === 'register' ? 8 : undefined}
                  maxLength={72}
                  required
                />
                <button
                  className="visibility-toggle"
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {mode === 'register' ? (
              <div className="field-group">
                <label htmlFor="confirm-password">Confirm password</label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Enter your password again"
                  minLength={8}
                  maxLength={72}
                  required
                />
              </div>
            ) : (
              <div className="form-options">
                <label className="remember-option">
                  <input type="checkbox" name="rememberMe" />
                  <span>Keep me signed in</span>
                </label>
                <span className="member-hint">Secure studio access</span>
              </div>
            )}

            <button className="submit-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Please wait...' : mode === 'register' ? 'Create account' : 'Sign in'}
            </button>
            <p className="form-status" role="status" aria-live="polite">{status}</p>
          </form>

          <p className="member-note">Create an account or sign in to your workspace.</p>
        </div>
        <footer className="page-footer">
          <span>FIELDNOTE STUDIO</span>
          <span>PRIVATE WORKSPACE</span>
        </footer>
      </section>
    </main>
  )
}

export default App
