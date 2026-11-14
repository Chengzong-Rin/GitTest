# Fieldnote

Fieldnote is a React sign-in page with a local Express API and SQLite user store.

## Run locally

```bash
npm install
npm run dev
```

Open the Vite URL printed in the terminal. The Vite development server proxies `/api` requests to the Express API on port `3001`.

Create an account from the page, then sign in with that email and password. User records and hashed login sessions are stored in `data/fieldnote.sqlite`, which is ignored by Git. Passwords are hashed with bcrypt and are never stored as plain text. The “Keep me signed in” option sets a 30-day session; otherwise, the session cookie lasts until the browser closes and the server expires the session after one day.

## Mock exams

The interface supports Japanese, English, and Thai. The selected language is remembered in the browser and applies to the sign-in flow, exam screens, questions, and explanations.

After signing in, choose IT Passport or Fundamental Information Technology Engineer (FE). Each track currently has 10 original questions and a 15-minute timer, with question navigation, scoring, and explanations. Attempt history is saved per account in that browser's local storage; it is separate from the SQLite authentication database.

The supplied `kihonjouho_mondai-main/kakomon` JSON files informed the topic coverage. The app uses newly written practice questions, not copied official exam questions.

## Production

Build and run the Express server:

```bash
npm run build
npm start
```

The server serves the built app and API on port `3001` by default. Set `PORT` to change it, and set `DB_PATH` to choose another SQLite file. Production cookies are marked `Secure`, so deploy behind HTTPS. Back up the SQLite database file to preserve accounts.

Authentication includes basic rate limiting and server-side session revocation on sign-out. For a public production deployment, also configure HTTPS, database backups, monitoring, and an appropriate account recovery flow.