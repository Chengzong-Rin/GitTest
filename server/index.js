import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import bcrypt from 'bcryptjs'
import Database from 'better-sqlite3'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'

const app = express()
const port = Number(process.env.PORT ?? 3001)
const host = process.env.HOST ?? '127.0.0.1'
const isProduction = process.env.NODE_ENV === 'production'
const databasePath = resolve(process.env.DB_PATH ?? 'data/fieldnote.sqlite')
const cookieName = 'fieldnote_session'
const dayInMilliseconds = 24 * 60 * 60 * 1000

mkdirSync(dirname(databasePath), { recursive: true })

const database = new Database(databasePath)
database.pragma('journal_mode = WAL')
database.pragma('foreign_keys = ON')
database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    display_name TEXT NOT NULL DEFAULT '',
    avatar_data_url TEXT,
    two_factor_enabled INTEGER NOT NULL DEFAULT 0,
    two_factor_secret TEXT,
    two_factor_pending_secret TEXT,
    recovery_codes TEXT NOT NULL DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    session_id TEXT,
    created_at INTEGER,
    user_agent TEXT NOT NULL DEFAULT ''
  );

  CREATE INDEX IF NOT EXISTS sessions_expires_at ON sessions(expires_at);
`)

function addColumnIfMissing(table, column, definition) {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all()
  if (!columns.some((entry) => entry.name === column)) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

addColumnIfMissing('users', 'display_name', "TEXT NOT NULL DEFAULT ''")
addColumnIfMissing('users', 'avatar_data_url', 'TEXT')
addColumnIfMissing('users', 'two_factor_enabled', 'INTEGER NOT NULL DEFAULT 0')
addColumnIfMissing('users', 'two_factor_secret', 'TEXT')
addColumnIfMissing('users', 'two_factor_pending_secret', 'TEXT')
addColumnIfMissing('users', 'recovery_codes', "TEXT NOT NULL DEFAULT '[]'")
addColumnIfMissing('sessions', 'session_id', 'TEXT')
addColumnIfMissing('sessions', 'created_at', 'INTEGER')
addColumnIfMissing('sessions', 'user_agent', "TEXT NOT NULL DEFAULT ''")
database.prepare('UPDATE sessions SET session_id = lower(hex(randomblob(16))) WHERE session_id IS NULL').run()
database.prepare('UPDATE sessions SET created_at = ? WHERE created_at IS NULL').run(Date.now())
database.exec('CREATE UNIQUE INDEX IF NOT EXISTS sessions_session_id ON sessions(session_id)')

function loadTotpEncryptionKey() {
  const configuredKey = process.env.TOTP_ENCRYPTION_KEY
  if (configuredKey) {
    const key = Buffer.from(configuredKey, 'base64')
    if (key.length !== 32) throw new Error('TOTP_ENCRYPTION_KEY must be a base64-encoded 32-byte key.')
    return key
  }
  if (isProduction) throw new Error('TOTP_ENCRYPTION_KEY must be configured in production.')

  const keyPath = resolve('data/totp-encryption.key')
  try {
    return readFileSync(keyPath)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    const key = randomBytes(32)
    try {
      writeFileSync(keyPath, key, { flag: 'wx', mode: 0o600 })
      chmodSync(keyPath, 0o600)
      return key
    } catch (writeError) {
      if (writeError.code !== 'EEXIST') throw writeError
      return readFileSync(keyPath)
    }
  }
}

const totpEncryptionKey = loadTotpEncryptionKey()
const findUserByEmail = database.prepare('SELECT * FROM users WHERE email = ?')
const findUserById = database.prepare('SELECT * FROM users WHERE id = ?')
const findSessionUser = database.prepare(`
  SELECT sessions.session_id, users.id, users.email, users.created_at,
    users.display_name, users.avatar_data_url, users.two_factor_enabled
  FROM sessions JOIN users ON users.id = sessions.user_id
  WHERE sessions.token_hash = ? AND sessions.expires_at > ?
`)
const insertSession = database.prepare(`
  INSERT INTO sessions (token_hash, user_id, expires_at, session_id, created_at, user_agent)
  VALUES (?, ?, ?, ?, ?, ?)
`)
const deleteSession = database.prepare('DELETE FROM sessions WHERE token_hash = ?')

function encryptSecret(secret) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', totpEncryptionKey, iv)
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()])
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64')).join('.')
}

function decryptSecret(value) {
  if (!value) return null
  try {
    const [iv, tag, encrypted] = value.split('.').map((part) => Buffer.from(part, 'base64'))
    const decipher = createDecipheriv('aes-256-gcm', totpEncryptionKey, iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.created_at,
    displayName: user.display_name,
    avatarDataUrl: user.avatar_data_url,
    twoFactorEnabled: Boolean(user.two_factor_enabled),
  }
}

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
})
const accountRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
})

app.disable('x-powered-by')
app.use(express.json({ limit: '350kb' }))

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

function getSessionToken(request) {
  const cookie = request.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`))

  return cookie?.slice(cookieName.length + 1)
}

function setSessionCookie(response, token, rememberMe) {
  const attributes = [
    `${cookieName}=${token}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
  ]

  if (rememberMe) attributes.push(`Max-Age=${30 * 24 * 60 * 60}`)
  if (isProduction) attributes.push('Secure')
  response.setHeader('Set-Cookie', attributes.join('; '))
}

function createSession(response, userId, rememberMe, userAgent = '') {
  const token = randomBytes(32).toString('base64url')
  const sessionId = randomBytes(16).toString('base64url')
  const createdAt = Date.now()
  const lifetime = (rememberMe ? 30 : 1) * dayInMilliseconds

  database.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now())
  insertSession.run(hashToken(token), userId, createdAt + lifetime, sessionId, createdAt, userAgent)
  setSessionCookie(response, token, rememberMe)
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function isValidEmail(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function hashRecoveryCode(code) {
  return createHash('sha256').update(code.replace(/[-\s]/g, '').toUpperCase()).digest()
}

function consumeRecoveryCode(user, code) {
  if (typeof code !== 'string' || !code) return false
  let codes
  try {
    codes = JSON.parse(user.recovery_codes)
  } catch {
    return false
  }

  const candidate = hashRecoveryCode(code)
  const index = codes.findIndex((saved) => {
    const savedHash = Buffer.from(saved, 'hex')
    return savedHash.length === candidate.length && timingSafeEqual(savedHash, candidate)
  })
  if (index === -1) return false

  codes.splice(index, 1)
  database.prepare('UPDATE users SET recovery_codes = ? WHERE id = ?').run(JSON.stringify(codes), user.id)
  return true
}

function verifySecondFactor(user, code) {
  if (typeof code !== 'string') return false
  const token = code.trim()
  const secret = decryptSecret(user.two_factor_secret)
  if (/^\d{6}$/.test(token) && secret && authenticator.verify({ token, secret })) return true
  return consumeRecoveryCode(user, token)
}

function makeRecoveryCodes() {
  return Array.from({ length: 8 }, () => {
    const raw = randomBytes(5).toString('hex').toUpperCase()
    return `${raw.slice(0, 5)}-${raw.slice(5)}`
  })
}

function validAvatarDataUrl(value) {
  if (value === null || value === '') return true
  if (typeof value !== 'string' || value.length > 260_000) return false
  if (!/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) return false
  return Buffer.from(value.slice(value.indexOf(',') + 1), 'base64').length <= 192_000
}

function requireUser(request, response, next) {
  if (!request.user) return response.status(401).json({ error: 'Not signed in.' })
  return next()
}

app.use((request, _response, next) => {
  const token = getSessionToken(request)
  if (token) {
    const tokenHash = hashToken(token)
    const session = findSessionUser.get(tokenHash, Date.now())
    if (!session) {
      deleteSession.run(tokenHash)
    } else {
      request.sessionId = session.session_id
      request.user = {
        id: session.id,
        email: session.email,
        created_at: session.created_at,
        display_name: session.display_name,
        avatar_data_url: session.avatar_data_url,
        two_factor_enabled: session.two_factor_enabled,
      }
    }
  }
  next()
})

app.post('/api/auth/register', authRateLimit, async (request, response, next) => {
  const email = normalizeEmail(request.body?.email)
  const password = request.body?.password
  const passwordBytes = typeof password === 'string' ? Buffer.byteLength(password) : 0

  if (!isValidEmail(email)) {
    return response.status(400).json({ error: 'Enter a valid email address.' })
  }
  if (passwordBytes < 8 || passwordBytes > 72) {
    return response.status(400).json({ error: 'Password must be between 8 and 72 bytes.' })
  }
  if (findUserByEmail.get(email)) {
    return response.status(409).json({ error: 'An account with that email already exists.' })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12)
    const result = database.prepare(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
    ).run(email, passwordHash)
    const userId = Number(result.lastInsertRowid)
    createSession(response, userId, false, request.get('user-agent') ?? '')
    return response.status(201).json({ user: toPublicUser(findUserById.get(userId)) })
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return response.status(409).json({ error: 'An account with that email already exists.' })
    }
    return next(error)
  }
})

app.post('/api/auth/login', authRateLimit, async (request, response, next) => {
  const email = normalizeEmail(request.body?.email)
  const password = request.body?.password
  if (!isValidEmail(email) || typeof password !== 'string') {
    return response.status(400).json({ error: 'Enter a valid email address and password.' })
  }

  try {
    const user = findUserByEmail.get(email)
    const validPassword = user && await bcrypt.compare(password, user.password_hash)
    if (!validPassword) {
      return response.status(401).json({ error: 'Invalid email or password.' })
    }

    if (user.two_factor_enabled) {
      if (!request.body?.twoFactorCode) return response.json({ requiresTwoFactor: true })
      if (!verifySecondFactor(user, request.body.twoFactorCode)) {
        return response.status(401).json({ error: 'Invalid email or password.' })
      }
    }

    createSession(response, user.id, request.body?.rememberMe === true, request.get('user-agent') ?? '')
    return response.json({ user: toPublicUser(findUserById.get(user.id)) })
  } catch (error) {
    return next(error)
  }
})

app.get('/api/auth/me', (request, response) => {
  if (!request.user) return response.status(401).json({ error: 'Not signed in.' })
  return response.json({ user: toPublicUser(findUserById.get(request.user.id)) })
})

app.patch('/api/account/profile', requireUser, accountRateLimit, (request, response) => {
  const displayName = typeof request.body?.displayName === 'string'
    ? request.body.displayName.trim()
    : ''
  const avatarDataUrl = request.body?.avatarDataUrl ?? null

  if (displayName.length > 60) {
    return response.status(400).json({ error: 'Display name must be 60 characters or fewer.' })
  }
  if (!validAvatarDataUrl(avatarDataUrl)) {
    return response.status(400).json({ error: 'Avatar must be a PNG, JPEG, or WebP image under 192 KB.' })
  }

  database.prepare('UPDATE users SET display_name = ?, avatar_data_url = ? WHERE id = ?')
    .run(displayName, avatarDataUrl || null, request.user.id)
  return response.json({ user: toPublicUser(findUserById.get(request.user.id)) })
})

app.get('/api/auth/sessions', requireUser, (request, response) => {
  const sessions = database.prepare(`
    SELECT session_id, created_at, user_agent, expires_at
    FROM sessions WHERE user_id = ? AND expires_at > ? ORDER BY created_at DESC
  `).all(request.user.id, Date.now())
  return response.json({
    sessions: sessions.map((session) => ({
      id: session.session_id,
      createdAt: session.created_at,
      userAgent: session.user_agent,
      expiresAt: session.expires_at,
      current: session.session_id === request.sessionId,
    })),
  })
})

app.delete('/api/auth/sessions/:sessionId', requireUser, accountRateLimit, (request, response) => {
  if (request.params.sessionId === request.sessionId) {
    return response.status(400).json({ error: 'The current session cannot be revoked here.' })
  }
  const result = database.prepare('DELETE FROM sessions WHERE session_id = ? AND user_id = ?')
    .run(request.params.sessionId, request.user.id)
  if (!result.changes) return response.status(404).json({ error: 'Session not found.' })
  return response.status(204).end()
})

app.post('/api/account/password', requireUser, accountRateLimit, async (request, response) => {
  const currentPassword = request.body?.currentPassword
  const newPassword = request.body?.newPassword
  const passwordBytes = typeof newPassword === 'string' ? Buffer.byteLength(newPassword) : 0
  const user = findUserById.get(request.user.id)

  if (passwordBytes < 8 || passwordBytes > 72) {
    return response.status(400).json({ error: 'Password must be between 8 and 72 bytes.' })
  }
  if (typeof currentPassword !== 'string' || !await bcrypt.compare(currentPassword, user.password_hash)) {
    return response.status(401).json({ error: 'Current password is incorrect.' })
  }
  if (user.two_factor_enabled && !verifySecondFactor(user, request.body?.twoFactorCode)) {
    return response.status(401).json({ error: 'A valid authenticator code is required.' })
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)
  database.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, user.id)
  database.prepare('DELETE FROM sessions WHERE user_id = ? AND session_id != ?').run(user.id, request.sessionId)
  return response.json({ message: 'Password updated. Other sessions have been signed out.' })
})

app.post('/api/account/2fa/setup', requireUser, accountRateLimit, async (request, response) => {
  const user = findUserById.get(request.user.id)
  if (user.two_factor_enabled) return response.status(409).json({ error: 'Two-factor authentication is already enabled.' })

  const secret = authenticator.generateSecret()
  const otpauthUrl = authenticator.keyuri(user.email, 'Fieldnote', secret)
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl, { width: 220, margin: 1 })
  database.prepare('UPDATE users SET two_factor_pending_secret = ? WHERE id = ?')
    .run(encryptSecret(secret), user.id)
  return response.json({ secret, qrDataUrl })
})

app.post('/api/account/2fa/enable', requireUser, accountRateLimit, (request, response) => {
  const user = findUserById.get(request.user.id)
  const pendingSecret = decryptSecret(user.two_factor_pending_secret)
  const token = typeof request.body?.code === 'string' ? request.body.code.trim() : ''
  if (!pendingSecret || !/^\d{6}$/.test(token) || !authenticator.verify({ token, secret: pendingSecret })) {
    return response.status(400).json({ error: 'Enter the current six-digit authenticator code.' })
  }

  const recoveryCodes = makeRecoveryCodes()
  const recoveryHashes = recoveryCodes.map((code) => hashRecoveryCode(code).toString('hex'))
  database.prepare(`
    UPDATE users SET two_factor_enabled = 1, two_factor_secret = ?,
      two_factor_pending_secret = NULL, recovery_codes = ? WHERE id = ?
  `).run(user.two_factor_pending_secret, JSON.stringify(recoveryHashes), user.id)
  return response.json({ recoveryCodes, user: toPublicUser(findUserById.get(user.id)) })
})

app.post('/api/account/2fa/disable', requireUser, accountRateLimit, async (request, response) => {
  const user = findUserById.get(request.user.id)
  const passwordValid = typeof request.body?.password === 'string'
    && await bcrypt.compare(request.body.password, user.password_hash)
  if (!passwordValid || !verifySecondFactor(user, request.body?.code)) {
    return response.status(401).json({ error: 'Password or authenticator code is incorrect.' })
  }

  database.prepare(`
    UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL,
      two_factor_pending_secret = NULL, recovery_codes = '[]' WHERE id = ?
  `).run(user.id)
  return response.json({ user: toPublicUser(findUserById.get(user.id)) })
})

app.delete('/api/account', requireUser, accountRateLimit, async (request, response) => {
  const user = findUserById.get(request.user.id)
  const passwordValid = typeof request.body?.password === 'string'
    && await bcrypt.compare(request.body.password, user.password_hash)
  if (!passwordValid) return response.status(401).json({ error: 'Password is incorrect.' })
  if (user.two_factor_enabled && !verifySecondFactor(user, request.body?.twoFactorCode)) {
    return response.status(401).json({ error: 'A valid authenticator code is required.' })
  }

  database.prepare('DELETE FROM users WHERE id = ?').run(user.id)
  response.clearCookie(cookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
  })
  return response.status(204).end()
})

app.post('/api/auth/logout', (request, response) => {
  const token = getSessionToken(request)
  if (token) deleteSession.run(hashToken(token))
  response.clearCookie(cookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
  })
  return response.status(204).end()
})

app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'API route not found.' })
})

app.use(express.static(resolve('dist')))
app.use((error, _request, response, _next) => {
  console.error(error)
  response.status(500).json({ error: 'Something went wrong. Please try again.' })
})

const server = app.listen(port, host, () => {
  console.log(`Fieldnote API listening on http://${host}:${port}`)
  console.log(`SQLite database: ${databasePath}`)
})

function shutdown() {
  server.close(() => {
    database.close()
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)