# ISATS Authentication and Sessions

This implementation keeps the existing React + Vite frontend, Node.js HTTP API, and PostgreSQL database. It does not add a student dashboard or LMS.

## Included

- Email/password registration and login. Passwords are salted and hashed with Node.js `scrypt`; plaintext passwords are never stored.
- Google OAuth login and explicit Google account linking.
- PostgreSQL-backed sessions with a seven-day fixed lifetime.
- One session per browser/device; signing in again in the same browser replaces that browser's previous session.
- `GET /api/auth/me` restores login state after refresh.
- `POST /api/auth/logout` revokes the current session.
- `GET /api/auth/sessions` lists active sessions.
- `DELETE /api/auth/sessions/:id` revokes one session belonging to the signed-in user.
- `DELETE /api/auth/sessions` signs out all other sessions.
- Hourly cleanup of expired/revoked sessions and expired OAuth state records.
- Basic profile editing at `/profile`; profile completion at `/profile/complete`.

## 1. Configure environment

From the project root, copy `.env.example` to `.env`. Set your actual PostgreSQL connection values. Do not commit `.env`.

```dotenv
API_PORT=5001
PGHOST=localhost
PGPORT=5432
PGDATABASE=isats
PGUSER=your_database_user
PGPASSWORD=your_actual_database_password
PGPOOL_MAX=10
FRONTEND_URL=http://localhost:5173
APP_ORIGIN=http://localhost:5173
NODE_ENV=development
```

The example file intentionally does not contain a real password. Use the credentials configured for your own PostgreSQL installation.

## 2. Apply the authentication schema

Run from the directory containing `package.json`:

```bash
npm install
npm run db:migrate
```

The migration runner creates `schema_migrations`, applies SQL migrations in order, and records the migrations it has applied. The authentication migration creates `users`, `user_profiles`, `auth_identities`, `user_sessions`, and `oauth_states`. It does not alter or delete the existing course data.

## 3. Configure Google OAuth

Email/password works without Google OAuth credentials. To enable Google:

1. Open Google Cloud Console and select/create a project.
2. Configure the OAuth consent screen for the appropriate audience.
3. Create an OAuth client ID of type **Web application**.
4. Add this authorized redirect URI for local development:

   `http://localhost:5001/api/auth/google/callback`

5. Copy the client ID and client secret into `.env`:

   ```dotenv
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:5001/api/auth/google/callback
   ```

6. Restart the API server.

For production, register the exact HTTPS callback URL and use production secrets. Never put `GOOGLE_CLIENT_SECRET` in frontend environment variables or React code.

Google returns a verified identity to the backend. If an account already exists with the same email through another login method, the system does not silently merge it. The user must first sign in to the existing account and explicitly link Google from `/profile`.

## 4. Run locally

Terminal 1 — API:

```bash
npm run server
```

Terminal 2 — frontend:

```bash
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`. Vite proxies `/api` to `http://localhost:5001`.

Verify the API and database:

- `http://localhost:5001/api/health`
- `http://localhost:5001/api/auth/me`

The unauthenticated `/api/auth/me` response should be `authenticated: false`.

## 5. Session behaviour

- Session lifetime is seven days from creation; activity does not extend the expiry.
- The cookie is `HttpOnly`, `SameSite=Lax`, path `/`, and receives `Secure` when `NODE_ENV=production`.
- The raw random session token exists only in the cookie. PostgreSQL stores its SHA-256 hash.
- Logout revokes the server-side session and clears the cookie.
- Other devices have independent sessions and can be signed out from the Profile page.
- Expired sessions are rejected even before cleanup deletes their rows. Cleanup runs at API startup and hourly while the API is running.

## 6. Production deployment requirements

- Serve the frontend and `/api` on the same site/origin, with a reverse proxy routing `/api/*` to the Node API. The Vite proxy is development-only.
- Set `NODE_ENV=production`, `FRONTEND_URL` and `APP_ORIGIN` to the actual HTTPS website origin.
- Set `GOOGLE_REDIRECT_URI` to the exact HTTPS callback registered with Google.
- Keep PostgreSQL private; do not expose port 5432 publicly. Use a dedicated least-privilege database user.
- Use HTTPS, secret management, automated backups, and tested restore procedures.
- Schedule the API process with a service manager/process supervisor and monitor logs. Do not rely on a developer terminal to keep production running.
- Email verification and password-reset email delivery are not included yet. Password accounts are marked `email_verified=false`; Google accounts are marked verified based on Google's verified-email response. Do not represent email/password accounts as verified until an email verification flow is implemented.

## 7. Validation

Run syntax checks and the included unit tests:

```bash
node --check server/index.js
node --check server/auth.js
node --check server/migrate.js
npm test
npm run build
```

`npm run db:migrate` requires the PostgreSQL database configured in `.env` to be reachable. The tests do not require a live database.
