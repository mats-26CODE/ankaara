-- Short URLs for sale SMS: /l/{slug} → dashboard sale (see app/l/[slug]/route.ts).

create table public.sale_short_links (
  sale_id uuid primary key references public.sales (id) on delete cascade,
  slug text not null unique,
  created_at timestamptz not null default now(),
  constraint sale_short_links_slug_format check (slug ~ '^[a-z0-9]{10}$')
);

comment on table public.sale_short_links is 'Maps 10-char slug to sale for SMS; inserted by send-sale-sms-alert.';

alter table public.sale_short_links enable row level security;

-- No direct SELECT for anon/auth: use resolve_sale_short_link() to avoid listing.

create or replace function public.resolve_sale_short_link(p_slug text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select sale_id
  from public.sale_short_links
  where slug = lower(trim(p_slug))
  limit 1;
$$;

comment on function public.resolve_sale_short_link(text) is 'Public resolver for /l/{slug}; returns sale id or null.';

grant execute on function public.resolve_sale_short_link(text) to anon, authenticated;

revoke all on table public.sale_short_links from anon, authenticated;
