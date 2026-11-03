# Inscription

A full-stack web application built with React, TypeScript, Express, and MongoDB.

## Editing website content

Sign in as an administrator and open **Dashboard → Site Content** (`/admin/content`). Choose a section to edit contact details, Home, About, Services, Introduction, Translation, navigation, or footer copy. Banner/gallery images can be replaced using complete HTTP/HTTPS image URLs. Home quick-link destinations are editable too. Click **Publish Changes** to save to MongoDB and update the public website. Shared contact fields update the header, footer, contact page, and enquiry email destination together.

**Restore Default** removes an individual override; publish to apply it. **Reload / Discard** retrieves the latest saved version. Conflicting administrator saves are rejected so an older editor cannot silently overwrite newer changes. Public content falls back to bundled defaults when the API is unavailable. The database user needs `readWrite` on the application's configured database; MongoDB creates the `sitecontents` collection on first publication.

Use **Inscriptions** for inscription descriptions, images, locations, script/period metadata, source text, and translations. Use **User Management → Manage** to change a normal/academic user's name, email, institution, role, or status. Passwords and administrator access remain protected. API keys, database credentials, and infrastructure configuration remain server environment settings.

Content endpoints: public `GET /api/site-content`, administrator-only `PUT /api/admin/site-content`. The editable field catalog is `shared/siteContent.json`; saved overrides include revision and administrator audit information. Changes are visible to visitors on their next page load or window focus. Existing note author names/institutions are historical submission snapshots.

## Prerequisites

- [Node.js](https://nodejs.org/) (20.19+ or 22.12+; Node 24 is supported)
- [MongoDB](https://www.mongodb.com/) running locally or a MongoDB Atlas connection string

## Setup

1. **Clone the repo and install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Copy the example env file and fill in your values:

   ```bash
   cp .env.example .env
   ```

   Edit `.env`:

   ```env
   MONGO_URI=mongodb://localhost:27017/inscriptions
   PORT=6000
   NODE_ENV=development
   JWT_SECRET=your_long_random_secret_here
   ```

   `JWT_SECRET` is required — the server will refuse to start without it.

## Running the App

The app has two parts that need to run concurrently: the Express API server and the Vite dev server.

**Terminal 1 — API server:**

```bash
npm run server:dev
```

Starts the Express server on [http://localhost:6000](http://localhost:6000) with auto-reload via nodemon.

**Terminal 2 — Frontend:**

```bash
npm run dev
```

Starts the Vite dev server. Open [http://localhost:5173](http://localhost:5173) in your browser. API requests are proxied to `localhost:6000` automatically.

## Other Scripts

| Command | Description |
|---|---|
| `npm run build` | Type-check and build the frontend for production |
| `npm run preview` | Preview the production build locally |
| `npm run server` | Start the API server without auto-reload |
| `npm run lint` | Run ESLint |
| `npm test` | Run isolated role and note-moderation API tests (no MongoDB connection) |
| `npm run admin:promote -- owner@example.com` | Give an existing account administrator access |

## Accounts and administrator setup

Public registration offers **Normal User** and **Academic** accounts. Academic registration requires a university/institution. These accounts cannot manage inscriptions, users, or note publication. Academic status is self-declared at registration; administrators can change it through User Management.

To establish your administrator account:

1. Configure `MONGO_URI` and `JWT_SECRET` in the root `.env` file.
2. Start the application and register your own account with your email address.
3. From the project root, run the following, replacing the example email with that account's email:

   ```bash
   npm run admin:promote -- owner@example.com
   ```

4. Sign out and sign in again. Administrators land at `/admin`.

The promotion command updates the specified account in the database configured by `MONGO_URI`. It does not create an account or change its password. Do not promote accounts you do not intend to trust as administrators. There are no default production admin credentials or public admin-registration endpoints.

Existing accounts remain in the `admins` collection to preserve their passwords and IDs. **Legacy records without a role are treated as normal users**, because the previous registration endpoint allowed anyone to register. Explicitly promote the intended owner; existing passwords continue to work.

The admin dashboard includes:

- `/admin`: user, inscription, and review statistics.
- `/admin/users`: search/filter users, change normal/academic roles, suspend/reactivate accounts. Administrator accounts cannot be demoted or suspended through this interface.
- `/admin/notes`: pending, published, and rejected notes; approval, rejection, unpublishing, feedback, and the latest reviewer/date.
- `/admin/inscriptions`: the existing inscription management tools.

## Academic note workflow

1. An academic signs in and opens an inscription's detail page.
2. **Add Note → Submit for Review** stores a new MongoDB `notes` record with `pending` status. Author identity comes from the signed-in account, not a form field.
3. The author can follow its status and read admin feedback in **My Account → My Notes**.
4. An administrator reviews it in **Note Reviews**. **Approve & Publish → Confirm & Publish** makes it publicly visible. Rejected and pending notes are never returned by the public notes endpoint.
5. Administrators can unpublish a previously approved note. Public pages fetch approved notes when opened/refreshed; they are not a live push feed.

Only academics may submit notes; normal users and administrators do not get the Add Note control. The API enforces these permissions independently of the frontend. Inscription mutations and per-inscription OCR/translation tools are restricted to administrators. The standalone public translation tool remains available to visitors.

Account roles and suspension status are checked against MongoDB on every protected API request. A role claim in a JWT cannot grant access. Suspension prevents further authenticated requests, but does not automatically remove previously approved notes; an admin can unpublish those separately.

Older browser-local notes are **not automatically imported or published**. They were never reviewed and cannot be reliably attributed to a verified account. Bookmarks remain browser-local.

## Verification

`npm test` exercises real Express routes, authorization middleware, controllers, and schema validation with in-memory model adapters. It covers public-registration restrictions, role checks, approval visibility, rejection, unpublishing, author privacy, suspension, legacy accounts, and conflicting reviews. It does not replace a real MongoDB/Atlas integration check.

For isolated browser QA after `npm run build`, `node server/tests/preview.js` serves the built UI at `http://127.0.0.1:6101` with fake in-memory users (`admin@preview.invalid`, `academic@preview.invalid`, `user@preview.invalid`; password `PreviewOnly2026!`). This test-only entry point never loads `.env` or connects to MongoDB. Stop it with Ctrl+C after testing; never deploy it as the production entry point.
