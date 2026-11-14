import { useEffect, useState } from 'react'
import LanguageSwitcher from './LanguageSwitcher.jsx'
import { translate } from './translations.js'
import './AccountSettings.css'

const dateFormatters = {
  ja: new Intl.DateTimeFormat('ja-JP', { dateStyle: 'medium', timeStyle: 'short' }),
  en: new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
  th: new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }),
}

function describeDevice(userAgent = '') {
  const browser = userAgent.includes('Edg/')
    ? 'Edge'
    : userAgent.includes('Firefox/')
      ? 'Firefox'
      : userAgent.includes('Chrome/')
        ? 'Chrome'
        : userAgent.includes('Safari/')
          ? 'Safari'
          : 'Browser'
  const operatingSystem = /Android|iPhone|iPad|Macintosh|Windows|Linux/.exec(userAgent)?.[0] ?? 'Device'
  return `${browser} · ${operatingSystem}`
}

function AccountSettings({
  user,
  language,
  onLanguageChange,
  theme,
  onThemeChange,
  history,
  bookmarks,
  onUserUpdate,
  onAccountDeleted,
}) {
  const [displayName, setDisplayName] = useState(user.displayName || '')
  const [avatarDataUrl, setAvatarDataUrl] = useState(user.avatarDataUrl || '')
  const [profileStatus, setProfileStatus] = useState('')
  const [passwordStatus, setPasswordStatus] = useState('')
  const [securityStatus, setSecurityStatus] = useState('')
  const [exportStatus, setExportStatus] = useState('')
  const [sessions, setSessions] = useState([])
  const [sessionRefresh, setSessionRefresh] = useState(0)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [isSettingUpTwoFactor, setIsSettingUpTwoFactor] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [twoFactorSetup, setTwoFactorSetup] = useState(null)
  const [recoveryCodes, setRecoveryCodes] = useState([])
  const [showDisableTwoFactor, setShowDisableTwoFactor] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/sessions')
      .then(async (response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!cancelled && data?.sessions) setSessions(data.sessions)
      })
      .catch(() => {
        if (!cancelled) setSessions([])
      })

    return () => {
      cancelled = true
    }
  }, [sessionRefresh, user.id])

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setProfileStatus(translate(language, 'avatarUploadError'))
      return
    }

    try {
      const image = await createImageBitmap(file)
      const scale = Math.min(1, 256 / Math.max(image.width, image.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
      image.close()
      setAvatarDataUrl(canvas.toDataURL('image/webp', 0.84))
      setProfileStatus('')
    } catch {
      setProfileStatus(translate(language, 'avatarUploadError'))
    }
  }

  async function handleProfileSave(event) {
    event.preventDefault()
    setIsSavingProfile(true)
    setProfileStatus('')
    try {
      const response = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, avatarDataUrl: avatarDataUrl || null }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      onUserUpdate(data.user)
      setDisplayName(data.user.displayName || '')
      setAvatarDataUrl(data.user.avatarDataUrl || '')
      setProfileStatus(translate(language, 'profileSaved'))
    } catch {
      setProfileStatus(translate(language, 'profileSaveError'))
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function handlePasswordChange(event) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    const newPassword = values.get('newPassword')
    setPasswordStatus('')
    if (newPassword !== values.get('confirmPassword')) {
      setPasswordStatus(translate(language, 'passwordMismatch'))
      return
    }

    setIsUpdatingPassword(true)
    try {
      const response = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: values.get('currentPassword'),
          newPassword,
          twoFactorCode: values.get('twoFactorCode'),
        }),
      })
      if (!response.ok) {
        setPasswordStatus(translate(language, response.status === 401 ? 'currentPasswordIncorrect' : 'profileSaveError'))
        return
      }
      form.reset()
      setPasswordStatus(translate(language, 'passwordChanged'))
      setSessionRefresh((value) => value + 1)
    } catch {
      setPasswordStatus(translate(language, 'profileSaveError'))
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  async function handleRevokeSession(sessionId) {
    setSecurityStatus('')
    try {
      const response = await fetch(`/api/auth/sessions/${encodeURIComponent(sessionId)}`, { method: 'DELETE' })
      if (!response.ok) throw new Error()
      setSessions((previous) => previous.filter((session) => session.id !== sessionId))
      setSecurityStatus(translate(language, 'sessionRevoked'))
    } catch {
      setSecurityStatus(translate(language, 'sessionRevokeError'))
    }
  }

  async function handleTwoFactorSetup() {
    setIsSettingUpTwoFactor(true)
    setSecurityStatus('')
    try {
      const response = await fetch('/api/account/2fa/setup', { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error()
      setTwoFactorSetup(data)
    } catch {
      setSecurityStatus(translate(language, 'twoFactorSetupError'))
    } finally {
      setIsSettingUpTwoFactor(false)
    }
  }

  async function handleTwoFactorEnable(event) {
    event.preventDefault()
    const form = event.currentTarget
    const code = new FormData(form).get('code')
    try {
      const response = await fetch('/api/account/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error()
      onUserUpdate(data.user)
      setRecoveryCodes(data.recoveryCodes)
      setTwoFactorSetup(null)
      setSecurityStatus(translate(language, 'twoFactorEnableSuccess'))
      form.reset()
    } catch {
      setSecurityStatus(translate(language, 'invalidVerificationCode'))
    }
  }

  async function handleTwoFactorDisable(event) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    try {
      const response = await fetch('/api/account/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: values.get('password'), code: values.get('code') }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error()
      onUserUpdate(data.user)
      setShowDisableTwoFactor(false)
      setSecurityStatus(translate(language, 'twoFactorDisableSuccess'))
      form.reset()
    } catch {
      setSecurityStatus(translate(language, 'accountActionError'))
    }
  }

  function handleExport() {
    const exportData = {
      exportedAt: new Date().toISOString(),
      profile: {
        displayName: user.displayName,
        email: user.email,
        createdAt: user.createdAt,
        avatarDataUrl: user.avatarDataUrl,
      },
      preferences: { language, theme },
      mockExamHistory: history,
      savedQuestions: bookmarks.map(({ id, category, prompt, options, answer, explanation }) => ({
        id, category, prompt, options, answer, explanation,
      })),
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'fieldnote-account-data.json'
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setExportStatus(translate(language, 'dataExported'))
  }

  async function handleDeleteAccount(event) {
    event.preventDefault()
    setIsDeletingAccount(true)
    try {
      const values = new FormData(event.currentTarget)
      const response = await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: values.get('password'),
          twoFactorCode: values.get('twoFactorCode'),
        }),
      })
      if (!response.ok) throw new Error()
      localStorage.removeItem(`fieldnote-mock-history:${user.id}`)
      localStorage.removeItem(`fieldnote-mock-bookmarks:${user.id}`)
      onAccountDeleted()
    } catch {
      setSecurityStatus(translate(language, 'accountDeleteError'))
      setIsDeletingAccount(false)
    }
  }

  const initials = (displayName.trim() || user.email).slice(0, 1).toUpperCase()

  return (
    <div className="account-settings-stack">
      <section className="account-settings-section" aria-labelledby="profile-settings-title">
        <div className="my-page-section-heading">
          <h2 id="profile-settings-title">{translate(language, 'editProfile')}</h2>
        </div>
        <form className="profile-settings-form" onSubmit={handleProfileSave}>
          <div className="settings-avatar">
            {avatarDataUrl
              ? <img src={avatarDataUrl} alt="" />
              : <span aria-hidden="true">{initials}</span>}
          </div>
          <div className="avatar-actions">
            <label className="small-action-button">
              {translate(language, 'changePhoto')}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarChange} />
            </label>
            {avatarDataUrl && (
              <button className="small-action-button" type="button" onClick={() => setAvatarDataUrl('')}>
                {translate(language, 'removePhoto')}
              </button>
            )}
          </div>
          <div className="settings-field">
            <label htmlFor="display-name">{translate(language, 'displayName')}</label>
            <input
              id="display-name"
              name="displayName"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={60}
              placeholder={translate(language, 'displayNamePlaceholder')}
            />
          </div>
          <button className="settings-primary-button" type="submit" disabled={isSavingProfile}>
            {isSavingProfile ? translate(language, 'pleaseWait') : translate(language, 'saveProfile')}
          </button>
          <p className="settings-status" role="status" aria-live="polite">{profileStatus}</p>
        </form>
      </section>

      <section className="account-settings-section" aria-labelledby="appearance-title">
        <div className="my-page-section-heading">
          <h2 id="appearance-title">{translate(language, 'appearance')}</h2>
        </div>
        <div className="settings-choice-row">
          <div>
            <strong>{translate(language, 'themePreference')}</strong>
            <p>{translate(language, 'themeHint')}</p>
          </div>
          <div className="theme-switch" role="group" aria-label={translate(language, 'themePreference')}>
            <button type="button" aria-pressed={theme === 'light'} onClick={() => onThemeChange('light')}>
              {translate(language, 'lightTheme')}
            </button>
            <button type="button" aria-pressed={theme === 'dark'} onClick={() => onThemeChange('dark')}>
              {translate(language, 'darkTheme')}
            </button>
          </div>
        </div>
      </section>

      <section className="account-settings-section" aria-labelledby="language-title">
        <div className="my-page-section-heading">
          <h2 id="language-title">{translate(language, 'languagePreference')}</h2>
        </div>
        <LanguageSwitcher language={language} onChange={onLanguageChange} />
        <p className="settings-helper">{translate(language, 'languagePreferenceHint')}</p>
      </section>

      <section className="account-settings-section" aria-labelledby="password-title">
        <div className="my-page-section-heading">
          <h2 id="password-title">{translate(language, 'passwordChange')}</h2>
        </div>
        <form className="settings-form-grid" onSubmit={handlePasswordChange}>
          <div className="settings-field">
            <label htmlFor="current-password">{translate(language, 'currentPassword')}</label>
            <input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required />
          </div>
          <div className="settings-field">
            <label htmlFor="new-password">{translate(language, 'newPassword')}</label>
            <input id="new-password" name="newPassword" type="password" autoComplete="new-password" minLength={8} maxLength={72} required />
          </div>
          <div className="settings-field">
            <label htmlFor="confirm-new-password">{translate(language, 'confirmNewPassword')}</label>
            <input id="confirm-new-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={72} required />
          </div>
          {user.twoFactorEnabled && (
            <div className="settings-field">
              <label htmlFor="password-two-factor-code">{translate(language, 'verificationCode')}</label>
              <input id="password-two-factor-code" name="twoFactorCode" inputMode="numeric" autoComplete="one-time-code" required />
            </div>
          )}
          <button className="settings-primary-button" type="submit" disabled={isUpdatingPassword}>
            {isUpdatingPassword ? translate(language, 'pleaseWait') : translate(language, 'updatePassword')}
          </button>
          <p className="settings-status" role="status" aria-live="polite">{passwordStatus}</p>
        </form>
      </section>

      <section className="account-settings-section" aria-labelledby="sessions-title">
        <div className="my-page-section-heading">
          <h2 id="sessions-title">{translate(language, 'sessions')}</h2>
          <span>{sessions.length}</span>
        </div>
        {sessions.length ? sessions.map((session) => (
          <div className="session-row" key={session.id}>
            <div className="session-device-mark" aria-hidden="true">{session.current ? '●' : '○'}</div>
            <div className="session-copy">
              <strong>{session.current ? translate(language, 'thisDevice') : describeDevice(session.userAgent)}</strong>
              <span>{translate(language, 'lastSeen')}: {dateFormatters[language].format(session.createdAt)}</span>
            </div>
            {session.current
              ? <span className="session-current-label">{translate(language, 'thisDevice')}</span>
              : <button className="small-action-button" type="button" onClick={() => handleRevokeSession(session.id)}>
                {translate(language, 'revokeSession')}
              </button>}
          </div>
        )) : <p className="settings-helper">{translate(language, 'noOtherSessions')}</p>}
      </section>

      <section className="account-settings-section" aria-labelledby="two-factor-title">
        <div className="my-page-section-heading">
          <h2 id="two-factor-title">{translate(language, 'twoFactor')}</h2>
          <span className={`security-status ${user.twoFactorEnabled ? 'is-enabled' : ''}`}>
            {translate(language, user.twoFactorEnabled ? 'twoFactorEnabled' : 'twoFactorDisabled')}
          </span>
        </div>
        <p className="settings-helper">{translate(language, 'twoFactorIntro')}</p>
        {!user.twoFactorEnabled && !twoFactorSetup && (
          <button className="settings-secondary-button" type="button" onClick={handleTwoFactorSetup} disabled={isSettingUpTwoFactor}>
            {isSettingUpTwoFactor ? translate(language, 'pleaseWait') : translate(language, 'setupTwoFactor')}
          </button>
        )}
        {twoFactorSetup && (
          <form className="two-factor-setup" onSubmit={handleTwoFactorEnable}>
            <p>{translate(language, 'scanQr')}</p>
            <img className="two-factor-qr" src={twoFactorSetup.qrDataUrl} alt="Authenticator setup QR code" />
            <label className="setup-secret">
              <span>{translate(language, 'manualSetupKey')}</span>
              <code>{twoFactorSetup.secret}</code>
            </label>
            <div className="settings-field">
              <label htmlFor="enable-two-factor-code">{translate(language, 'verificationCode')}</label>
              <input id="enable-two-factor-code" name="code" inputMode="numeric" autoComplete="one-time-code" required />
            </div>
            <button className="settings-primary-button" type="submit">{translate(language, 'enableTwoFactor')}</button>
          </form>
        )}
        {user.twoFactorEnabled && !showDisableTwoFactor && (
          <button className="small-action-button danger-link" type="button" onClick={() => setShowDisableTwoFactor(true)}>
            {translate(language, 'disableTwoFactor')}
          </button>
        )}
        {user.twoFactorEnabled && showDisableTwoFactor && (
          <form className="settings-form-grid" onSubmit={handleTwoFactorDisable}>
            <div className="settings-field">
              <label htmlFor="disable-two-factor-password">{translate(language, 'currentPassword')}</label>
              <input id="disable-two-factor-password" name="password" type="password" autoComplete="current-password" required />
            </div>
            <div className="settings-field">
              <label htmlFor="disable-two-factor-code">{translate(language, 'verificationCode')}</label>
              <input id="disable-two-factor-code" name="code" autoComplete="one-time-code" required />
            </div>
            <button className="settings-primary-button" type="submit">{translate(language, 'disableTwoFactor')}</button>
          </form>
        )}
        {recoveryCodes.length > 0 && (
          <div className="recovery-codes-panel">
            <strong>{translate(language, 'recoveryCodes')}</strong>
            <p>{translate(language, 'recoveryCodesWarning')}</p>
            <div className="recovery-code-grid">
              {recoveryCodes.map((code) => <code key={code}>{code}</code>)}
            </div>
            <button className="small-action-button" type="button" onClick={() => setRecoveryCodes([])}>
              {translate(language, 'cancel')}
            </button>
          </div>
        )}
        <p className="settings-status" role="status" aria-live="polite">{securityStatus}</p>
      </section>

      <section className="account-settings-section" aria-labelledby="privacy-title">
        <div className="my-page-section-heading">
          <h2 id="privacy-title">{translate(language, 'privacyAndData')}</h2>
        </div>
        <p className="settings-helper">{translate(language, 'exportDescription')}</p>
        <button className="settings-secondary-button" type="button" onClick={handleExport}>
          {translate(language, 'exportData')}
        </button>
        <p className="settings-status" role="status" aria-live="polite">{exportStatus}</p>
        <div className="delete-account-zone">
          <strong>{translate(language, 'deleteAccount')}</strong>
          <p>{translate(language, 'deleteAccountDescription')}</p>
          {!showDeleteAccount ? (
            <button className="small-action-button danger-link" type="button" onClick={() => setShowDeleteAccount(true)}>
              {translate(language, 'deleteAccount')}
            </button>
          ) : (
            <form className="settings-form-grid" onSubmit={handleDeleteAccount}>
              <p className="delete-warning">{translate(language, 'deleteAccountWarning')}</p>
              <div className="settings-field">
                <label htmlFor="delete-account-password">{translate(language, 'deleteAccountPassword')}</label>
                <input id="delete-account-password" name="password" type="password" autoComplete="current-password" required />
              </div>
              {user.twoFactorEnabled && (
                <div className="settings-field">
                  <label htmlFor="delete-account-code">{translate(language, 'deleteAccountCode')}</label>
                  <input id="delete-account-code" name="twoFactorCode" autoComplete="one-time-code" required />
                </div>
              )}
              <div className="delete-actions">
                <button className="small-action-button" type="button" onClick={() => setShowDeleteAccount(false)}>
                  {translate(language, 'cancel')}
                </button>
                <button className="settings-danger-button" type="submit" disabled={isDeletingAccount}>
                  {isDeletingAccount ? translate(language, 'pleaseWait') : translate(language, 'deletePermanently')}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}

export default AccountSettings
