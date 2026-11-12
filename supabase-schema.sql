-- Supabase schema for a future account sync.
-- Page metadata is stored once per user/page; annotation rows reference it by page_id.
-- Keep sync requests batched and pull rows by updated_at + id.

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  hostname text not null default '',
  title text not null default '',
  thumbnail_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (id, user_id),
  unique (user_id, url)
);

create table if not exists public.annotations (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  page_id uuid not null,
  quote text not null,
  note text not null default '',
  context_note text not null default '',
  color text not null default 'yellow'
    check (color in ('yellow', 'green', 'purple', 'red', 'blue', 'orange')),
  tags text[] not null default '{}',
  prefix text not null default '',
  suffix text not null default '',
  page_order integer,
  review jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  foreign key (page_id, user_id) references public.pages(id, user_id) on delete cascade
);

create index if not exists pages_user_updated_idx
  on public.pages (user_id, updated_at desc);
create index if not exists annotations_user_updated_idx
  on public.annotations (user_id, updated_at, id);
create index if not exists annotations_page_order_idx
  on public.annotations (user_id, page_id, page_order, created_at);
create index if not exists annotations_tags_idx
  on public.annotations using gin (tags);
create index if not exists annotations_search_idx
  on public.annotations using gin (
    to_tsvector('simple', coalesce(quote, '') || ' ' || coalesce(note, '') || ' ' || coalesce(context_note, ''))
  );

alter table public.pages enable row level security;
alter table public.annotations enable row level security;

drop policy if exists "Users manage their own pages" on public.pages;
create policy "Users manage their own pages"
  on public.pages for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
drop policy if exists "Users manage their own annotations" on public.annotations;
create policy "Users manage their own annotations"
  on public.annotations for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
