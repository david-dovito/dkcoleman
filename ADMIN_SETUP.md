# Admin CMS Setup and Usage

The site has a password-gated CMS at `/admin`. It edits content stored in Neon Postgres. There is no Telegram, Cloudflare Worker, or GitHub Pages involved; that older setup has been removed.

For the full picture of how the app is wired, see `docs/ARCHITECTURE.md`.

## How it works

- `/admin` is protected by `middleware.ts`. Any request under `/admin` or `/api/admin` (except the login/logout endpoints) needs a valid session cookie.
- Signing in posts your password to `/api/admin/login`, which compares it to `ADMIN_PASSWORD` and, on success, sets an HMAC-signed `dk_admin` cookie (14-day expiry). The cookie is signed with `ADMIN_SECRET`.
- The CMS is a single-admin tool. Everyone who has the password shares the same admin identity.
- All content is read from and written to Neon. Edits are live on dynamic pages immediately and on cached pages (for example `/blog`) within their revalidation window or on the next deploy.

## Required environment variables

Set these in Vercel (Production) and in `.env.local` for local development:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon pooled connection string. Without it the CMS cannot read or write, and public pages show sample content. |
| `ADMIN_PASSWORD` | The password you type at `/admin/login`. |
| `ADMIN_SECRET` | A long random string that signs the admin session cookie. If unset, the app falls back to `JWT_SECRET`; if neither is set, admin auth is disabled and login fails. |

Generate a secret with:

```bash
openssl rand -hex 32
```

## Signing in

1. Go to `https://dkcoleman.com/admin` (or `http://localhost:3000/admin` in dev). There is also a low-key "Admin" link in the site footer.
2. If you are not signed in, you are redirected to `/admin/login`.
3. Enter `ADMIN_PASSWORD` and submit. On success you land on the dashboard.
4. To sign out, use "Log out" in the sidebar. This clears the `dk_admin` cookie.

If everyone is locked out, the cause is almost always that `ADMIN_PASSWORD` or `ADMIN_SECRET` was changed or is missing. See `docs/RUNBOOKS.md` -> Rotate secrets.

## Managing content

The dashboard lists every content collection with a count. Click one to see its rows, then click a row to edit it, or use **New** to create one. The collections are defined in `lib/cms/schema.ts`:

| Collection | What it is |
|------------|-----------|
| Blog posts | `/blog` articles. `Content` is Markdown. Word count and reading time are computed automatically on save. |
| Real estate | `/real-estate` listings (for sale and for rent). See below. |
| Projects | `/projects` entries. |
| Resources | `/resources` link library. |
| About sections | Blocks on the About page, ordered by the `Order` field. |
| Resume narrative | Ordered narrative blocks on the resume. |
| Resume | The resume body. |

Editing notes that apply to every collection:

- **Publishing:** collections with a **Published** checkbox (blog posts, listings, projects, resources) only appear on the public site when it is checked. Leave it unchecked to keep a draft.
- **Featured:** the **Featured** checkbox pins an item to the top of its list.
- **Tags / Features / Photos / Categories:** these are list fields. Enter values comma-separated (for example `Faith, Growth, Business`). They are stored as JSON arrays.
- **Markdown fields:** blog content, listing descriptions, about and resume sections accept Markdown.
- **Dates:** enter ISO dates (for example `2025-01-14`).
- **Delete:** the edit screen has a Delete button. Deletes are immediate and permanent, so use care.

Saving redirects back to the collection list. Changes are written straight to Neon.

## Adding a Real Estate listing

1. From the dashboard, open **Real estate**, then click **New**.
2. Fill in the fields:
   - **Title** (required) and **Slug** (required). The slug is the URL path, for example `123-main-st` becomes `/real-estate/123-main-st`. Use lowercase and hyphens, and keep it unique.
   - **For** (`kind`): `sale` or `rent`.
   - **Status**: `active`, `pending`, `sold`, `rented`, or `off_market`. `active` and `pending` show under current listings; the others move to the closed/history section.
   - **Price**: the sale price, or the monthly rent for a rental. Leave blank to show "Contact for price".
   - **Address, City, State, Zip, Beds, Baths, Sq ft, Lot size, Year built**: property details, all optional.
   - **Description**: Markdown.
   - **Features**: comma-separated (for example `Garage, Fenced yard, New roof`).
   - **Photos**: comma-separated image URLs. The first URL is the cover image. Host the images somewhere public and paste their URLs.
   - **Listed date** and **Closed date**: `Closed date` is used for sold/rented history.
   - **Featured**: pins the listing to the top.
   - **Published**: check this to make the listing visible on `/real-estate`.
3. Click **Create**. The listing appears at `/real-estate` (and its own page at `/real-estate/<slug>`) once **Published** is checked.

To take a listing down without deleting it, either uncheck **Published** or set **Status** to `sold` / `rented` / `off_market` so it moves to the closed section.

## Local development

```bash
cp .env.example .env.local     # then fill in DATABASE_URL, ADMIN_PASSWORD, ADMIN_SECRET
npm install
npm run dev
```

Open `http://localhost:3000/admin`. Without `DATABASE_URL`, the CMS has no database to talk to and public pages render sample data.
