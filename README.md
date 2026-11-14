# Fieldnote

Fieldnote is a React study app with IT Passport and FE mini-mocks, a local Express API, and a SQLite user store.

## Run locally

```bash
npm install
npm run dev
```

Open the Vite URL printed in the terminal. The Vite development server proxies `/api` requests to the Express API on port `3001`.

Create an account from the page, then sign in with that email and password. User records and hashed login sessions are stored in `data/fieldnote.sqlite`, which is ignored by Git. Passwords are hashed with bcrypt and are never stored as plain text. The “Keep me signed in” option sets a 30-day session; otherwise, the session cookie lasts until the browser closes and the server expires the session after one day.

## Mock exams

The interface supports Japanese, English, and Thai. The selected language is remembered in the browser and applies to the sign-in flow, exam screens, questions, and explanations.

After signing in, choose IT Passport or Fundamental Information Technology Engineer (FE). Each mock exam uses 10 original questions and a 15-minute timer, with question navigation, scoring, and explanations. Attempt history is saved per account in that browser's local storage; it is separate from the SQLite authentication database.

The dashboard also offers a 10-question Daily Quest mixed from both tracks, separate review sessions for questions answered incorrectly in completed mock exams, Daily Quest, or custom practice, and customizable practice sessions for either track. Customize sessions include a selectable 2019–2025 practice-year range, and the available question count updates to match that range. Practice-year labels are groupings for this original question bank, not years from official exam papers. Practice modes show correctness and the explanation immediately after an answer is selected. Correct answers in a review session remove those questions from future reviews; answering one incorrectly in a mock exam, Daily Quest, or custom session adds it back. Review tracking is saved in that browser per account; older mock results may not contain the individual answers needed for review.

The supplied `kihonjouho_mondai-main/kakomon` JSON files informed the topic coverage. The app uses newly written practice questions, not copied official exam questions. Questions can be bookmarked, and completed attempts record topic-level accuracy to highlight areas to review.

## AI study assistant

The signed-in app includes a Gemini-powered study chat using the Interactions API. The Gemini API key is used only by the Express server and must not be added to client-side environment variables or committed to the repository. Set `GEMINI_API_KEY` in the server environment before starting the app; `GEMINI_MODEL` can optionally select a Gemini model (the default is `gemini-3.5-flash-lite`). Chat requests require a signed-in session and are rate-limited. Conversation history stays in the browser and is sent to the server only when making a chat request. The API request opts out of server-side interaction storage and uses minimal thinking effort for faster chat replies. The chat can optionally capture the visible Fieldnote app screen; screenshots are off by default, exclude the chat widget, and are sent to Gemini only when the user checks the screen-sharing option. Drag the resize handle in the chat panel's lower-left corner to adjust its size; dimensions are saved in that browser.

## My Page

My Page includes an editable display name and avatar, exam history and statistics, saved questions, weak-topic summaries, language and theme preferences, active-session management, password changes, authenticator-based two-factor authentication, JSON data export, and account deletion. Attempt history and bookmarks are stored in that browser's local storage; profile and security data are stored in SQLite. Email addresses are not verified because this app has no email delivery provider.

Two-factor setup uses a TOTP authenticator app and provides one-time recovery codes. In development, the encryption key is generated in `data/totp-encryption.key`; back up this file alongside the SQLite database. In production, set `TOTP_ENCRYPTION_KEY` to a persistent base64-encoded 32-byte key. Generate it once with `openssl rand -base64 32`, store it securely, and do not rotate it while accounts have two-factor authentication enabled.

## Production

Build and run the Express server:

```bash
npm run build
npm start
```

The server serves the built app and API on port `3001` by default. Set `PORT` to change it, and set `DB_PATH` to choose another SQLite file. Production cookies are marked `Secure`, so deploy behind HTTPS. Back up the SQLite database file to preserve accounts.

Authentication includes basic rate limiting, bcrypt password hashing, encrypted TOTP secrets, and revocable server-side sessions. For a public production deployment, also configure HTTPS, secure persistent secrets, database/key backups, monitoring, and an email verification or recovery provider.