import { createHash, randomBytes } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import bcrypt from 'bcryptjs'
import Database from 'better-sqlite3'
import express from 'express'
import { rateLimit } from 'express-rate-limit'

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
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS sessions_expires_at ON sessions(expires_at);
`)

const findUserByEmail = database.prepare('SELECT * FROM users WHERE email = ?')
const findSessionUser = database.prepare(`
  SELECT users.id, users.email, users.created_at
  FROM sessions JOIN users ON users.id = sessions.user_id
  WHERE sessions.token_hash = ? AND sessions.expires_at > ?
`)
const insertSession = database.prepare(`
  INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)
`)
const deleteSession = database.prepare('DELETE FROM sessions WHERE token_hash = ?')

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
})

app.disable('x-powered-by')
app.use(express.json({ limit: '10kb' }))

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

function createSession(response, userId, rememberMe) {
  const token = randomBytes(32).toString('base64url')
  const lifetime = (rememberMe ? 30 : 1) * dayInMilliseconds

  database.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now())
  insertSession.run(hashToken(token), userId, Date.now() + lifetime)
  setSessionCookie(response, token, rememberMe)
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function isValidEmail(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

app.use((request, _response, next) => {
  const token = getSessionToken(request)
  if (token) {
    const tokenHash = hashToken(token)
    request.user = findSessionUser.get(tokenHash, Date.now())
    if (!request.user) deleteSession.run(tokenHash)
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
    createSession(response, Number(result.lastInsertRowid), false)
    return response.status(201).json({ user: { id: Number(result.lastInsertRowid), email } })
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

    createSession(response, user.id, request.body?.rememberMe === true)
    return response.json({ user: { id: user.id, email: user.email } })
  } catch (error) {
    return next(error)
  }
})

app.get('/api/auth/me', (request, response) => {
  if (!request.user) return response.status(401).json({ error: 'Not signed in.' })
  return response.json({ user: request.user })
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