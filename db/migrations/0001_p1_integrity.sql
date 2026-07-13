-- P1: constraints, indexes, real date types, soft-delete, audit, rate-limit.
create unique index if not exists blog_posts_slug_uq on public.blog_posts (slug);
create index if not exists ix_blog_pub_date on public.blog_posts (published, date desc);
create index if not exists ix_listings_status on public.listings (status);
create index if not exists ix_listings_pub on public.listings (published);

alter table public.blog_posts alter column date drop default;
alter table public.blog_posts alter column date type date using nullif(date,'')::date;
alter table public.projects   alter column date drop default;
alter table public.projects   alter column date type date using nullif(date,'')::date;

alter table public.blog_posts       add column if not exists deleted_at timestamptz;
alter table public.listings         add column if not exists deleted_at timestamptz;
alter table public.projects         add column if not exists deleted_at timestamptz;
alter table public.resources        add column if not exists deleted_at timestamptz;
alter table public.resume_narrative add column if not exists deleted_at timestamptz;
alter table public.about_sections   add column if not exists deleted_at timestamptz;

create table if not exists public.audit_log (
  id bigserial primary key,
  actor text, action text not null, entity text, entity_id text,
  detail jsonb, created_at timestamptz not null default now());

create table if not exists public.rate_limits (
  key text primary key, count int not null default 0,
  window_start timestamptz not null default now());
alter table public.resume add column if not exists deleted_at timestamptz;
