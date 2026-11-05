# Email setup (about 5 minutes, no password)

The script runs inside the isats.sales1@gmail.com Google account and sends the
applications from that account to itself.

1. Sign in to Google as **isats.sales1@gmail.com** and open https://script.google.com
2. Click **New project**, delete the sample code, and paste everything from `Code.gs`.
3. Click **Deploy > New deployment**, choose type **Web app**:
   - Execute as: **Me (isats.sales1@gmail.com)**
   - Who has access: **Anyone**
4. Click **Deploy** and approve the permission prompts
   (Advanced > "Go to project" > Allow, so it can send email).
5. Copy the **Web app URL** (ends with `/exec`).
6. In the website project, copy `.env.example` to `.env` and set:
   `VITE_APPLICATION_API_URL=<the Web app URL>`
7. Restart `npm run dev`.

If you later edit the script, use **Deploy > Manage deployments > Edit > New version**
so the same URL keeps working.

Note: a free Gmail account can send roughly 100 emails per day through scripts
(each application uses up to 2), which is plenty for admissions.
