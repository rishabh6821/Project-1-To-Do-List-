# To Do List App — Overview

This document explains the app structure, logic, storage, backend behavior, and how to run and test the project. Use this to understand what each file does and how data flows.

---

## Project layout (important files)

- `index.html` / `dist/index.html` — App entry HTML served by Vite / static host.
- `src/main.jsx` — React entry point (mounts the app into `#root`).
- `src/Options.jsx` — Main application logic: user accounts, login/register, task management, storage, and admin view. This is the central file to read.
- `src/App.jsx` — ‘To Do’ UI for incomplete tasks (add/remove/toggle UI hooks).
- `src/Completed.jsx` — UI for completed tasks.
- `src/AllWorks.jsx` — UI for listing all tasks.
- `src/assets/notify.jsx` — Toast/notification helper.
- `api/tasks.js` — Serverless backend used originally (GET/POST/PUT/DELETE). Note: recent changes may have switched task mutations to `localStorage` only.
- `public/` and `assets/` — static assets like `mainLogo.png`.

---

## High-level behavior

1. Authentication & users
   - Users are stored in `localStorage` under the key `todo.users` as an array of objects: `{ name, password, isAdmin }`.
   - An `Admin` user is auto-created if missing (username `Admin`, password `admin123`).
   - Logged-in user is persisted in `localStorage` as `todo.currentUser` so reloads restore session.
   - Password change updates `todo.users` on the client side (stored plaintext in localStorage currently).

2. Tasks storage and flow
   - Tasks per user are stored in `localStorage` with key `todo.tasks.<username>` as an array of task objects: `{ id, text, completed }`.
   - The UI loads tasks from `localStorage` at login. Previously the app also attempted to call `/api/tasks` (serverless) — that flow was later switched to purely `localStorage` for mutations.
   - There are also import/export features (`Save to device` / `Load from device`) using the File System Access API (when supported) or fallback download/upload of a JSON file.

3. Task operations
   - `addTask()`: creates a new `{ id, text, completed:false }`, updates React state and saves to `localStorage`.
   - `removeTask(id)`: removes the task locally and updates `localStorage`.
   - `toggleComplete(id)`: flips `completed`, updates `localStorage`.
   - UI components (`App.jsx`, `Completed.jsx`, `AllWorks.jsx`) read the `tasks` prop and update automatically when `tasks` state changes.

4. Backend (`api/tasks.js`)
   - This file implements REST-like endpoints for tasks (GET/POST/PUT/DELETE) intended for server use (Vercel serverless). It keeps an in-memory `tasks` array and optionally reads/writes a `data/tasks.json` when `USE_FILE_STORAGE` is set.
   - Important: serverless file storage is ephemeral; do not rely on it in production. For persistence use a proper database (Supabase, Postgres, Vercel KV, Firebase, etc.).

---

## Security notes & limitations

- Passwords are stored in plaintext in `localStorage`. This is NOT secure. For production, use a backend with secure hashing, authentication flows (JWT / sessions), and HTTPS.
- Using `localStorage` is simple but tied to the browser/device. Users cannot access tasks from other devices unless you implement server-side storage or export/import JSON manually.
- `api/tasks.js` is not a secure, production-ready backend — it's a demo serverless handler.

---

## How to run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the dev server:

   ```bash
   npm run dev
   ```

3. Build (production):

   ```bash
   npm run build
   npm run preview  # preview build locally
   ```

4. Deploy: push to a repository connected to Vercel (or other static host). Vercel will run the build script and publish `dist/`.

---

## How to test the main flows (quick)

- Register user → Login → Add tasks → Mark complete / remove → Refresh page (session should persist) → Save to device (download JSON) → Logout → Login again.
- Change password: while logged in click "Change password", enter current + new password and confirm. Then logout and login with new password.

---

## How to convert this doc to a PDF (options)

Option A — Pandoc (command-line):

1. Install pandoc: https://pandoc.org/installing.html
2. Convert:

```bash
pandoc docs/App-Overview.md -o App-Overview.pdf
```

Option B — Chrome / browser print:

1. Open `docs/App-Overview.html` in a browser.
2. File → Print → Save as PDF.

Option C — wkhtmltopdf:

```bash
wkhtmltopdf docs/App-Overview.html App-Overview.pdf
```

Option D — Use `npx` tools (convert markdown to pdf) if you prefer quick utilities.

---

## Suggested next improvements

- Move authentication and task storage to a backend (use hashed passwords + a DB).
- Add user session expiration and logout everywhere.
- Improve UX: show loading states, confirmations for deletes, and input validation.
- Encrypt sensitive data or move it to server-side storage.

---

If you'd like, I can:
- Generate an HTML version of this doc here (done),
- Try to generate the PDF in this environment (I can attempt it if you allow installing a converter), or
- Create a short visual walkthrough with screenshots.

Tell me which option you prefer and I'll proceed.
