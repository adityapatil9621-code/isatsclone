# ISATS Website - Complete Node/Vite Structure

This package fixes the `npm error code ENOENT` shown in the terminal and the earlier Vite `coursesData.js` import error.

## Why your npm error happened

Your terminal was running npm in:

`C:\Users\pc\Desktop\isats updated`

but that folder did not contain `package.json`.

`npm install` and `npm run dev` must be executed from the project root — the folder that contains `package.json`.

## Correct project structure

```text
isats updated/
├── package.json
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── README_FIRST.md
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── index.css
    ├── components/
    │   ├── CourseGrid.jsx
    │   ├── Footer.jsx
    │   ├── GoogleMapPlaceholder.jsx
    │   ├── Header.jsx
    │   ├── ScrollToTop.jsx
    │   ├── WhatsAppButton.jsx
    │   └── ui/
    ├── data/
    │   ├── coursesData.js
    │   └── coursesData.sql
    ├── hooks/
    │   └── use-toast.js
    ├── lib/
    │   └── pdfGenerator.js
    └── pages/
        ├── AboutUsPage.jsx
        ├── AestheticsCourses.jsx
        ├── ClinicalAestheticsCourses.jsx
        ├── ContactUsPage.jsx
        ├── CoursesPage.jsx
        ├── HomePage.jsx
        └── TrichologyCourses.jsx
```

## Run in Visual Studio Code

1. Extract this ZIP.
2. Open **the extracted `isats updated` folder itself** in Visual Studio Code.
3. In VS Code choose **Terminal → New Terminal**.
4. Confirm the terminal is in the folder containing `package.json`:

```powershell
Get-ChildItem package.json
```

You should see `package.json` listed.

5. Install dependencies:

```powershell
npm install
```

6. Start the website:

```powershell
npm run dev
```

7. Open the Local URL printed by Vite, normally something like:

`http://localhost:5173/`

## If your terminal still shows ENOENT

Run:

```powershell
cd "C:\Users\pc\Desktop\isats updated"
Get-ChildItem package.json
npm install
npm run dev
```

If `Get-ChildItem package.json` says it cannot find the file, you are either in the wrong folder or the ZIP was extracted incorrectly. The `package.json` from this package must be directly inside `isats updated`, not inside another nested folder.

## Important database note

`src/data/coursesData.sql` is a SQL database script. A Vite browser application cannot import a `.sql` file directly.

For that reason this package contains both:

- `coursesData.sql` — database/source structure
- `coursesData.js` — frontend bridge used by the current React pages

The current course pages continue to use the existing imports such as:

```js
import { trichologyCourses } from '@/data/coursesData.js';
```

The current project includes a Node API that reads course data from PostgreSQL. Database credentials must never be placed in the React frontend.

## DPDP flow

The supplied consent gate remains in `App.jsx`. Required Privacy Policy and Terms & Conditions confirmation is required before the main website is shown, while the marketing checkbox remains optional. Authentication is implemented in the Node API: email/password and optional Google OAuth, PostgreSQL-backed profiles, seven-day sessions, logout, and active-device controls. See `README_AUTH.md` before running the authentication setup.

## Course catalogue update

The course data has been aligned with the supplied ISATS catalogue:

- Advanced CTL Program
- Trichology Certification Program
- Laser Certification Program

`src/data/coursesData.sql` is the PostgreSQL source-of-truth and now includes the catalogue modules, curriculum sections, outcomes, highlights and enrolment audiences. `src/data/coursesData.js` mirrors the same records for the current React frontend.

The supplied catalogue does not specify course duration or eligibility, so those fields are left `NULL` in PostgreSQL and are not displayed as invented values on the website.

---

## PostgreSQL connection added

The course pages now support live PostgreSQL data through the Node API in `server/`.

1. Copy `.env.example` to `.env` and set your PostgreSQL password.
2. Run `npm install`.
3. Run `npm run db:migrate` for the authentication schema when enabling login, then run `npm run db:sync` to replace the old course records with the current ISATS catalogue.
4. Run `npm run server` in one terminal.
5. Run `npm run dev` in another terminal.

See `README_POSTGRES.md` for the complete PostgreSQL setup.


## Temporary public course-enquiry workflow

- Public Login and Register navigation is hidden. `/login` redirects to `/admin/login`, and `/register` redirects to `/courses`.
- The administrator continues to use the existing configured admin account. Admin access is checked on the server using `ADMIN_EMAILS` and verified identity.
- Visitors can browse the course catalogue without creating an account.
- Each course Enquire Now button opens a form for name, international phone number and the selected course.
- The enquiry is inserted into PostgreSQL before WhatsApp opens with the prefilled message.
- Admins review enquiries at `/admin` and can update status (New, Contacted, Follow-up, Converted, Closed).

After deploying this version, apply the new database migration once:

```bash
npm run db:migrate
```

The migration creates `course_enquiries`; it does not delete or modify existing users, profiles or sessions. Keep the existing admin authentication credentials and `ADMIN_EMAILS` configuration. Never commit `.env` or the Firebase service-account JSON.
