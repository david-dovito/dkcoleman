# Architecture

This repository holds two related web apps that share one Neon Postgres database:

1. **Main site** (`dkcoleman.com`) - a personal website with a blog, projects, resources, resume, about, and a Real Estate section. Content is stored in Neon and edited through a password-gated CMS at `/admin`. This is the code in the repository root.
2. **Rentals app** (`rentals.dkcoleman.com`) - a separate Next.js app for rental listings and payments. It uses Auth.js (Google OAuth) for sign-in and Stripe for payments, backed by its own `rentals.*` schema in the same Neon project. Its source lives in the `rentals/` subdirectory and deploys as its own Vercel project.

Both apps are Next.js 16 (App Router) on the Vercel serverless runtime. There is no Notion, no GitHub Pages, no Cloudflare Worker, and no Telegram in the current stack. Those were part of an earlier static-export architecture and have been removed. Some legacy files remain in the tree (`worker/`, `CNAME`, `.nojekyll`, `.env.production`, `CUSTOM_DOMAIN_SETUP.md`, and the `NOTION_*` env vars) but nothing in the running apps reads them.

## Hosting and DNS

| Concern | Main site | Rentals app |
|---------|-----------|-------------|
| Framework | Next.js 16 App Router | Next.js 16 App Router |
| Vercel project | `dkcoleman-` | `dkcoleman-rentals` |
| Vercel root dir | repo root | `rentals/` |
| Domain | `dkcoleman.com` | `rentals.dkcoleman.com` |
| DNS record | A `@` -> `76.76.21.21` | CNAME `rentals` -> `cname.vercel-dns.com` |
| Runtime | Vercel serverless (Node) | Vercel serverless (Node) |

DNS is managed at Cloudflare in **DNS-only mode** (grey cloud, no Cloudflare proxy). Cloudflare only resolves the records to Vercel; TLS, caching, and routing are handled by Vercel.

`next.config.ts` in the main app runs a dynamic server (not a static export). `images.unoptimized` is `true`, so the Next image optimizer is bypassed and image URLs are served as-is.

## Data model (Neon Postgres)

Both apps use `@neondatabase/serverless` (`lib/db.ts` in the main app) with a `DATABASE_URL` pooled connection string. `getSql()` returns `null` when `DATABASE_URL` is unset, and the content adapters fall back to small sample values so local dev works without a database.

### Main site: `public.*` content tables

The CMS registry (`lib/cms/schema.ts`) is the source of truth for which tables exist and which columns are editable. Current collections:

| Collection key | Table | Notes |
|----------------|-------|-------|
| `blog` | `public.blog_posts` | `content` markdown column; `word_count` and `reading_time` are computed on save |
| `listings` | `public.listings` | Real Estate; `kind` (sale/rent), `status`, `photos`/`features` as JSONB arrays |
| `projects` | `public.projects` | |
| `resources` | `public.resources` | `categories` JSONB array |
| `about` | `public.about_sections` | keyed sections, `order` column |
| `resume-narrative` | `public.resume_narrative` | ordered narrative blocks |
| `resume` | `public.resume` | single resume body; no `updated_at` column |

Conventions used by the generic SQL layer (`lib/cms/db.ts`):

- `tags` and `images` fields are stored as JSONB arrays.
- Every table has an integer `id` primary key.
- Every table except `public.resume` has an `updated_at` column, set to `now()` on update.
- `public.blog_posts` and `public.listings` also carry a `published` boolean; public pages only read `published = true` rows.

### Rentals app: `rentals.*` schema

The rentals app keeps its tables under a `rentals.*` schema in the same Neon project (listings, bookings/orders, and Auth.js session/account tables). Its detailed schema lives with the `rentals/` source and is out of scope for this repository's content model.

## Request, render, and caching model

The main app mixes static, incrementally-revalidated, and fully dynamic rendering, chosen per route:

| Route | Rendering | Directive |
|-------|-----------|-----------|
| `/blog` | ISR, revalidated hourly | `export const revalidate = 3600` |
| `/blog/[slug]` | Prerendered at build via `generateStaticParams` | (default) |
| `/real-estate`, `/real-estate/[slug]` | Server-rendered per request | `export const dynamic = 'force-dynamic'` |
| `/admin/**` (pages) | Server-rendered per request | `export const dynamic = 'force-dynamic'` |
| `/api/admin/**` | Dynamic route handlers, Node runtime | `runtime = 'nodejs'`, `dynamic = 'force-dynamic'` |
| `manifest.ts` | Static | `dynamic = 'force-static'` |

Because content lives in Neon (not baked into a static export), edits made in `/admin` appear on dynamic routes immediately and on ISR routes within the revalidation window (or on the next deploy). Google Analytics is wired in `app/layout.tsx` via `@next/third-parties` only when `NEXT_PUBLIC_GA_ID` is set.

Requests to `/admin/**` and `/api/admin/**` pass through `middleware.ts` first (see Auth below).

## Auth model

### Main site: single-admin password + signed cookie

`/admin` is a single-admin CMS, not multi-user auth.

- `middleware.ts` matches `/admin/:path*` and `/api/admin/:path*`. It lets `/admin/login`, `/api/admin/login`, and `/api/admin/logout` through, and for everything else verifies a signed session cookie. Unauthenticated page requests redirect to `/admin/login?next=...`; unauthenticated API requests return `401`.
- Sign-in: `POST /api/admin/login` compares the submitted password against `ADMIN_PASSWORD` (constant-time-ish compare in `lib/auth.ts`). On success it issues an HMAC-SHA256-signed token stored in the `dk_admin` httpOnly cookie (14-day expiry).
- The token is signed and verified with `ADMIN_SECRET` (falling back to `JWT_SECRET`). `lib/auth.ts` throws if neither is set, so admin auth fails closed. Verification uses Web Crypto so the same code runs in both the Edge middleware and Node route handlers.
- Logout (`POST /api/admin/logout`) clears the cookie.

### Rentals app: Auth.js Google OAuth

The rentals app uses Auth.js (`next-auth`) with the Google provider. `AUTH_SECRET` signs sessions, `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` configure the OAuth client, `AUTH_URL` sets the canonical callback origin, and `ADMIN_EMAILS` is the allowlist of Google accounts granted admin access. Payments run through Stripe with a signed webhook.

## Content flow (CMS -> Neon -> pages)

```
Admin (browser)
   |  password login  ->  POST /api/admin/login  ->  dk_admin cookie
   v
/admin CMS UI (AdminShell + CmsForm, driven by COLLECTIONS registry)
   |  GET/POST/PUT/DELETE
   v
/api/admin/[collection][/id]  (Node route handlers, cookie verified by middleware)
   |  generic parameterized SQL (lib/cms/db.ts)
   v
Neon Postgres  public.* tables
   ^
   |  read on render (lib/db.ts -> content adapters: notion.ts*, listings.ts, projects.ts, ...)
   |
Public pages (/blog, /real-estate, /projects, /resources, /resume, /about)
```

\* `lib/notion.ts` keeps its historical name and the `NotionPost` type for import stability, but it reads from `public.blog_posts` in Neon. It is not a Notion integration.

The CMS is fully registry-driven. Adding a column to a collection in `lib/cms/schema.ts` surfaces it in both the admin form (`components/admin/CmsForm.tsx`) and the SQL layer, with no per-collection code. Column identifiers come only from the trusted registry and are double-quoted; all request values are passed as SQL parameters, so request bodies cannot inject SQL.

## System diagram

```
                       Cloudflare DNS  (DNS-only / grey cloud)
                       |                                   |
        dkcoleman.com                          rentals.dkcoleman.com
        A @ -> 76.76.21.21                     CNAME -> cname.vercel-dns.com
                       |                                   |
        +--------------------------+        +------------------------------+
        | Vercel: dkcoleman-       |        | Vercel: dkcoleman-rentals    |
        | Next 16 main site        |        | Next 16 rentals app          |
        | - public content pages   |        | - Auth.js (Google OAuth)     |
        | - /admin password CMS    |        | - Stripe payments            |
        | - /api/admin CRUD        |        | - own rentals.* schema       |
        +------------+-------------+        +---------------+--------------+
                     |                                      |
                     v                                      v
        +---------------------------------------------------------------+
        |                   Neon Postgres (serverless)                  |
        |     public.* content tables      |      rentals.* tables      |
        +---------------------------------------------------------------+
```

## Environment variables

### Main site

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Neon pooled connection string; source of all content |
| `ADMIN_PASSWORD` | Yes | Password for `/admin` sign-in |
| `ADMIN_SECRET` | Yes | Secret that signs the `dk_admin` session cookie (falls back to `JWT_SECRET`) |
| `NEXT_PUBLIC_GA_ID` | No | Google Analytics 4 measurement ID |
| `NOTION_*` | No | Legacy, unused. Safe to remove. |

### Rentals app (`rentals/`)

| Variable | Purpose |
|----------|---------|
| `AUTH_SECRET` | Signs Auth.js sessions |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth client |
| `AUTH_URL` | Canonical origin for OAuth callbacks |
| `ADMIN_EMAILS` | Allowlist of admin Google accounts |
| `DATABASE_URL` | Neon connection (rentals schema) |
| `STRIPE_SECRET_KEY` | Stripe server key |
| `STRIPE_WEBHOOK_SECRET` | Verifies incoming Stripe webhooks |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client key |
| `NOTIFY_WEBHOOK_URL` | Outbound notification webhook |
