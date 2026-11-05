# ISATS PostgreSQL connection

The frontend now reads course records from PostgreSQL through a small Node API.
It no longer uses the old 24-course database records when the API is available.

## 1. Configure PostgreSQL

The project expects the local database shown in pgAdmin:

- Host: `localhost`
- Port: `5432`
- Database: `isats`
- User: `postgres`
- Password: your PostgreSQL password

Copy `.env.example` to `.env` and set `PGPASSWORD`.

## 2. Install the PostgreSQL driver

Run once in the project folder:

```powershell
npm install pg
```

## 3. Replace the old course records

Run:

```powershell
npm run db:sync
```

This executes `src/data/coursesData.sql`. It keeps the `courses` table, adds any missing catalogue columns, removes the previous generic course IDs, and inserts/updates these three catalogue programs:

- Advanced CTL Program
- Trichology Certification Program
- Laser Certification Program

## 4. Start the PostgreSQL API

Terminal 1:

```powershell
npm run server
```

The API runs at `http://localhost:5001` (unless `API_PORT` is changed).

Check:

- `http://localhost:5000/api/health`
- `http://localhost:5000/api/courses`

## 5. Start Vite

Terminal 2:

```powershell
npm run dev
```

Vite proxies `/api` to the PostgreSQL API, so the React course pages load live records from PostgreSQL.

If PostgreSQL/API is temporarily unavailable, the UI falls back to the same current catalogue data supplied by ISATS; it does not fall back to the old 24-course database data.


## Authentication schema

See `README_AUTH.md` for Google OAuth setup, email/password login, seven-day PostgreSQL sessions, profile routes, device session controls, and production requirements. Apply the auth schema with `npm run db:migrate`.
