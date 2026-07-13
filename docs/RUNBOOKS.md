# Runbooks

Operational procedures for the main site (`dkcoleman.com`) and the rentals app (`rentals.dkcoleman.com`). Both are Next.js 16 apps on Vercel backed by one Neon Postgres project. See `docs/ARCHITECTURE.md` for the overall picture.

Prerequisites for most runbooks:

- The `vercel` CLI installed and a Vercel token (`VERCEL_TOKEN`), created at https://vercel.com/account/tokens.
- `psql` (or the Neon SQL editor) for database work, plus the `DATABASE_URL` for the environment you are touching.
- Access to the Cloudflare DNS zone for `dkcoleman.com`.

## Deploy

Both apps deploy to production with the Vercel CLI. The helper script `scripts/vercel-deploy.sh` links the project, pushes the local env vars to the Vercel production scope, and then runs `vercel deploy --prod`.

**Main site:**

```bash
# reads VERCEL_TOKEN and env values from .env.local at the repo root
scripts/vercel-deploy.sh main
```

This links the `dkcoleman-` project, pushes `DATABASE_URL`, `ADMIN_PASSWORD`, `ADMIN_SECRET`, `NEXT_PUBLIC_GA_ID` (and, for now, the legacy `NOTION_*` and `JWT_SECRET` values) to production, then deploys.

**Rentals app:**

```bash
# reads rentals/.env.local
scripts/vercel-deploy.sh rentals
```

This changes into `rentals/`, links the `dkcoleman-rentals` project, pushes the Auth.js, Stripe, and `DATABASE_URL` values, then deploys.

**Manual deploy** (if you are not using the script), from the app's root directory:

```bash
vercel link --yes          # first time only, selects the correct project
vercel deploy --prod --yes
```

After a first-time deploy, confirm the domain in the Vercel project settings:

- Main: `dkcoleman.com`, DNS A `@` -> `76.76.21.21` at Cloudflare (grey cloud / DNS-only).
- Rentals: `rentals.dkcoleman.com`, DNS CNAME `rentals` -> `cname.vercel-dns.com`.

**Rollback:** in the Vercel dashboard, open the project, find the last known-good deployment, and use "Promote to Production" (or "Instant Rollback"). No database change is involved in a rollback because content lives in Neon.

## Rotate secrets

Set the new value in Vercel (Project -> Settings -> Environment Variables, Production), then redeploy so the running app picks it up. Env var changes do not take effect until the next deployment. The deploy script also re-pushes values from `.env.local`, so keep that file in sync if you use the script.

| Secret | Effect of rotation | Notes |
|--------|--------------------|-------|
| `ADMIN_SECRET` | Invalidates every existing `dk_admin` admin session. All admins must sign in to `/admin` again. | Cookie is HMAC-signed with this secret; a new secret fails verification of old cookies. Falls back to `JWT_SECRET` if `ADMIN_SECRET` is unset, so rotate/remove both together. |
| `ADMIN_PASSWORD` | Changes the `/admin` login password. Existing sessions stay valid until their 14-day cookie expires or `ADMIN_SECRET` is rotated. | Share the new password out of band. |
| `DATABASE_URL` | Points the app at a different Neon connection. Wrong value breaks all content reads (public pages fall back to sample data) and all CMS writes. | Rotate the Neon role password from the Neon dashboard, copy the new pooled connection string, update it in Vercel for both apps that use it, then redeploy. |
| `AUTH_SECRET` (rentals) | Invalidates all rentals sign-in sessions; users re-authenticate with Google. | |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` (rentals) | New key takes effect on redeploy; update the webhook signing secret in the Stripe dashboard to match. | Roll the key in Stripe first, then update Vercel. |

After rotating, deploy the affected app(s) and verify:

- Main: sign in at `/admin`, load a public page.
- Rentals: complete a Google sign-in and a Stripe test event.

## Restore the database (Neon)

Content is stored in Neon Postgres. Neon provides point-in-time recovery (PITR) within its history-retention window.

1. In the Neon dashboard, open the project and go to **Branches** / **Restore**.
2. Choose a restore point (a timestamp within the retention window, or a named branch).
3. Restore to a new branch first so you can inspect it before cutting over. This avoids overwriting current data.
4. Verify the restored data (row counts on `public.blog_posts`, `public.listings`, etc.).
5. To cut over, point `DATABASE_URL` at the restored branch's pooled connection string in Vercel (both apps if the rentals schema is affected) and redeploy.

**Nightly logical backup (to configure):** a `pg_dump` of the `public.*` and `rentals.*` schemas on a schedule, stored off Neon (for example object storage), is the recommended second layer beyond PITR. This is not wired up yet. Once it exists, restoring from it is `pg_restore` (or `psql < dump.sql`) into a fresh Neon branch, then the same cut-over as above.

## Incident response basics

1. **Confirm scope.** Is it the main site, the rentals app, or both? Check the public URL and the Vercel deployment status for each project.
2. **Check recent changes.** Look at the latest Vercel deployment and the latest commits. If a deploy correlates with the incident, roll back first (see Deploy -> Rollback), then investigate.
3. **Check the database.** If pages show sample/placeholder content or CMS writes fail, suspect `DATABASE_URL` or Neon availability. Verify the Neon project is up and the connection string is current.
4. **Check auth.** `/admin` locked out for everyone usually means `ADMIN_SECRET`/`ADMIN_PASSWORD` was changed or unset (`lib/auth.ts` fails closed if the secret is missing). Rentals sign-in failures usually mean an Auth.js env var or the Google OAuth client changed.
5. **Read logs.** Use the Vercel dashboard (or `vercel logs`) for runtime and function errors. Stripe issues also surface in the Stripe dashboard's events/webhooks view.
6. **Contain, then fix.** Prefer rollback or an env-var correction plus redeploy over hot edits. Record what changed.
7. **Escalate keys if a secret leaked.** Rotate the affected secret per "Rotate secrets", then redeploy.

## Run a database migration

The schema is small and there is no migration framework wired into the repo today. Migrations are applied directly against Neon. Keep migration SQL in `db/migrations/` named so it sorts in apply order (for example `0001_add_listings.sql`, `0002_add_closed_date.sql`), and apply files in order. The directory may not exist until the first migration is committed.

1. Write the migration as a `.sql` file under `db/migrations/`. Prefer additive, reversible changes (add columns/tables) so a bad deploy can roll back without a schema break.
2. Apply it to a Neon branch first (create a branch in the Neon dashboard, or restore one) and test.
3. Apply to production:

   ```bash
   psql "$DATABASE_URL" -f db/migrations/0002_add_closed_date.sql
   ```

   Or paste the SQL into the Neon SQL editor for the production branch.

4. If a new column must appear in the CMS, add it to the matching collection in `lib/cms/schema.ts`. The admin form and the SQL layer pick it up automatically. Ship code that reads a new column at the same time as (or after) the migration that adds it, never before.
5. Redeploy the app if the code changed, then verify in `/admin` and on the affected public page.

Note: the JSONB array columns (`tags`, `images`, `features`, `categories`, `photos`) and the per-table `updated_at` column (`public.resume` excepted) are conventions the generic CRUD layer relies on. New content tables should follow them.
