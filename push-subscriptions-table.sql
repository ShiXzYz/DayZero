-- Run this in your Supabase SQL editor

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast lookup by user
create index if not exists push_subscriptions_user_id_idx on push_subscriptions(user_id);

-- RLS: users can only see/manage their own subscriptions
alter table push_subscriptions enable row level security;

create policy "Users can manage their own push subscriptions"
  on push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role bypass (needed for server-side reads when sending notifications)
create policy "Service role can read all push subscriptions"
  on push_subscriptions
  for select
  using (true);
