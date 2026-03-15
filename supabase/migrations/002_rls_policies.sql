-- Enable Row Level Security on all tables
alter table users enable row level security;
alter table searches enable row level security;
alter table bookings enable row level security;
alter table provider_tokens enable row level security;
alter table quotes enable row level security;
alter table pickup_points enable row level security;
alter table surge_history enable row level security;

-- Pickup points: public read, no client writes
create policy "pickup_points_read" on pickup_points
  for select using (true);

-- Users: read/update own row only
create policy "users_read_own" on users
  for select using (auth.uid() = id);
create policy "users_update_own" on users
  for update using (auth.uid() = id);
create policy "users_insert_own" on users
  for insert with check (auth.uid() = id);

-- Searches: own rows only
create policy "searches_insert_own" on searches
  for insert with check (auth.uid() = user_id);
create policy "searches_read_own" on searches
  for select using (auth.uid() = user_id);

-- Bookings: own rows only
create policy "bookings_read_own" on bookings
  for select using (auth.uid() = user_id);
create policy "bookings_insert_own" on bookings
  for insert with check (auth.uid() = user_id);

-- Provider tokens: own rows only
create policy "tokens_all_own" on provider_tokens
  for all using (auth.uid() = user_id);

-- Quotes: readable if you own the parent search
create policy "quotes_read" on quotes
  for select using (
    exists (select 1 from searches s where s.id = quotes.search_id and s.user_id = auth.uid())
  );

-- Surge history: public read (for best-time-to-book)
create policy "surge_read" on surge_history
  for select using (true);
