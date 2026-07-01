# Rentals Portal — Prototype

**Route (dev/preview):** `/rentals-portal/` (served from `public/rentals-portal/index.html`)
**Target production host:** `rentals.dkcoleman.com`
**Status:** Working client-side prototype for design + flow approval. Not yet wired to auth, Stripe, or a database.

## What this is

A single self-contained HTML prototype (no build step) of a two-sided rentals portal:

- **Renter portal** — dashboard, billing (upcoming scheduled charges, card/ACH payment methods, invoice history + receipts), maintenance requests (3-stage board, photo required on submit), documents (lease + HOA), profile (Google sign-in framing).
- **Admin / management portal** — dashboard, maintenance kanban (New / Received / Completed, drag to move), billing controls (per-tenant rent + cycle days, recurring charge schedules, invoices), property setup (pricing, billing cycles, per-property documents), user management (roles, property assignment, invite).

Everything is inline-editable and every action works client-side. State persists to `localStorage` (`rentals_proto_v1`); the "Reset" control in the dev bar clears it. The top-right toggle switches Renter / Admin; the dropdown switches tenant/property.

## How to review

Run the site (`npm run dev`) and open `http://localhost:3000/rentals-portal/`, or just open `public/rentals-portal/index.html` directly in a browser. External deps are Google Fonts (Roboto) and the Lucide icon CDN, so it needs a connection.

## Design

Neutral light-gray glass system built on the app.dovito.com / GHL tokens (GHL blue `#155EEF` reserved for primary actions and focus only). Roboto throughout.

## The `DB` object → Supabase tables

The prototype's in-memory `DB` object mirrors the intended schema. Each collection maps to a `rentals.*` table:

| `DB` collection | Table | Notes |
|---|---|---|
| `properties` | `rentals.properties` | name, address, floorplan, base_rent, lease_day, util_day, util_est, status |
| `tenants` | `rentals.tenants` (+ `users`) | linked to a property; role (renter/admin) |
| `pmethods` | `rentals.payment_methods` | Stripe payment-method id, card/ACH, is_default |
| `schedule` | `rentals.charge_schedules` | recurring charge: type (lease/util), amount, day-of-month, next_date → Stripe subscription schedule |
| `invoices` | `rentals.invoices` | Stripe invoice id, amount, status, receipt url |
| `tickets` | `rentals.tickets` | stage (new/received/completed), category, photo(s) in Storage |
| `documents` | `rentals.documents` | lease/HOA files in Storage; `shared` flag controls renter visibility |

## To connect it (next phase — see the project spec)

1. **Auth:** Supabase Auth with Google OAuth. Gate the portal; derive role (renter vs admin) from the user record.
2. **Data:** create the `rentals.*` tables above; replace the `DB` literal + `localStorage` with Supabase queries. The mutation points are centralized (`upd`, `del`, `saveCharge`, `submitTicket`, `saveMethod`, `addProperty`, `addDoc`, `doInvite`, `toggleShared`, `advance`, drag-drop) — each becomes a Supabase write.
3. **Billing:** Stripe. Card + ACH via SetupIntents; base lease on the 15th and utilities on the 25th as subscription schedules; webhooks to populate `invoices`; receipt PDFs.
4. **Storage:** Supabase Storage buckets for ticket photos and lease/HOA documents.
5. **Server runtime:** this is currently a static-export Next site (`output: 'export'`) with no server. The production portal needs a server runtime (Next server / route handlers or a small API) for OAuth sessions, Stripe webhooks, and DB writes — likely a separate deployment on `rentals.dkcoleman.com`.

Open items flagged during review: photo-required-to-submit (hard vs soft), and locking the renter side to read-only for billing schedules (admin-only create/edit) in production.
