import { useState } from 'react'
import './App.css'

function App() {
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    setStatus('This demo is not connected to an authentication service yet.')
  }

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
          <h1>Welcome back.</h1>
          <p className="intro">Pick up where your best work left off.</p>

          <form onSubmit={handleSubmit}>
            <div className="field-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="you@example.com"
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
                  autoComplete="current-password"
                  placeholder="Enter your password"
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

            <div className="form-options">
              <label className="remember-option">
                <input type="checkbox" name="remember" />
                <span>Keep me signed in</span>
              </label>
              <button
                className="text-button"
                type="button"
                onClick={() => setStatus('Contact your studio administrator to reset your password.')}
              >
                Forgot password?
              </button>
            </div>

            <button className="submit-button" type="submit">Sign in</button>
            <p className="form-status" role="status" aria-live="polite">{status}</p>
          </form>

          <p className="member-note">Access is limited to invited studio members.</p>
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
