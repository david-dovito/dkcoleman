# David Coleman - Personal Website

Personal website with a blog, projects, resources, resume, about page, and a Real Estate section. Content is stored in Neon Postgres and edited through a password-gated CMS at `/admin`. Built with Next.js 16 and deployed on Vercel.

A separate rentals app lives in `rentals/` and deploys to `rentals.dkcoleman.com`.

- Live site: https://dkcoleman.com
- Architecture: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- Runbooks (deploy, secrets, restore, migrations): [`docs/RUNBOOKS.md`](./docs/RUNBOOKS.md)
- Admin CMS setup and usage: [`ADMIN_SETUP.md`](./ADMIN_SETUP.md)

## Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS + shadcn/ui, WebGL background (OGL), GSAP/Lenis
- **Database:** Neon Postgres via `@neondatabase/serverless`
- **CMS:** custom password-gated admin at `/admin`, registry-driven CRUD
- **Hosting:** Vercel (serverless runtime)
- **DNS:** Cloudflare in DNS-only mode (grey cloud) pointing at Vercel
- **Analytics:** Google Analytics 4 via `@next/third-parties` (optional)

There is no Notion, GitHub Pages, Cloudflare Worker, or Telegram in the current stack. Those belonged to an earlier static-export setup and have been removed. `lib/notion.ts` keeps its name and the `NotionPost` type for import stability but reads from the Neon `public.blog_posts` table.

## How content works

1. Sign in at `/admin` with `ADMIN_PASSWORD`.
2. Edit collections (blog, real estate, projects, resources, about, resume) through the CMS. Every collection is defined once in `lib/cms/schema.ts`, which drives both the admin form and the SQL layer.
3. The CMS writes to Neon (`public.*` tables) through `/api/admin/**` route handlers.
4. Public pages read from Neon on render. Dynamic routes (for example `/real-estate`) reflect edits immediately; `/blog` is revalidated hourly (ISR).

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the request/render and caching model and the full data model.

## Getting started

Prerequisites: Node.js 18+ and npm, and a Neon Postgres database.

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Fill in DATABASE_URL, ADMIN_PASSWORD, ADMIN_SECRET (see below)

# Run the dev server
npm run dev
```

Visit http://localhost:3000. Without `DATABASE_URL`, pages render small sample values and the CMS has no database to talk to.

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Neon pooled connection string; source of all content |
| `ADMIN_PASSWORD` | Yes | Password for `/admin` sign-in |
| `ADMIN_SECRET` | Yes | Signs the admin session cookie (falls back to `JWT_SECRET`) |
| `NEXT_PUBLIC_GA_ID` | No | Google Analytics 4 measurement ID |

`NOTION_*` variables in `.env.example` are legacy and unused. Generate a secret with `openssl rand -hex 32`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server at localhost:3000 |
| `npm run build` | Build for production |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Run ESLint |

## Deployment

Deploys go to Vercel. The helper script links the project, pushes env vars to the production scope, and runs `vercel deploy --prod`:

```bash
scripts/vercel-deploy.sh main      # main site (dkcoleman.com)
scripts/vercel-deploy.sh rentals   # rentals app (rentals.dkcoleman.com)
```

Full deploy, rollback, secret-rotation, database-restore, and migration procedures are in [`docs/RUNBOOKS.md`](./docs/RUNBOOKS.md).

## Project layout

```
app/                  Next.js App Router
  admin/              CMS UI (login, dashboard, collection list + edit)
  api/admin/          CMS CRUD route handlers (Node runtime)
  blog/ projects/ resources/ resume/ about/ real-estate/   public pages
components/           UI + admin components (AdminShell, CmsForm)
lib/
  db.ts               Neon client
  cms/schema.ts       Collection registry (source of truth for tables/fields)
  cms/db.ts           Generic parameterized CRUD driven by the registry
  notion.ts           Blog data adapter (Neon-backed despite the name)
  listings.ts         Real estate data adapter
middleware.ts         Gates /admin and /api/admin on the signed session cookie
scripts/vercel-deploy.sh   Deploy helper for both apps
docs/                 Architecture and runbooks
rentals/              Separate rentals app (Auth.js + Stripe), own Vercel project
```

Note: `worker/`, `CNAME`, `.nojekyll`, `.env.production`, and `CUSTOM_DOMAIN_SETUP.md` are leftovers from the retired GitHub Pages / Cloudflare Worker setup and are not used by the running apps.

## License

MIT.
