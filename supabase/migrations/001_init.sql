create extension if not exists postgis;
create extension if not exists pgcrypto;

-- Users table
create table if not exists users (
  id              uuid primary key default gen_random_uuid(),
  email           text unique,
  phone           text unique,
  full_name       text,
  preferred_service text,
  home_location   geography(Point, 4326),
  work_location   geography(Point, 4326),
  saved_places    jsonb default '[]',
  created_at      timestamptz default now()
);

-- Pickup points (pre-computed from OSM)
create table if not exists pickup_points (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  location        geography(Point, 4326) not null,
  avg_saving_gbp  numeric(6,2) default 0,
  avg_walk_secs   int default 0,
  provider_hints  jsonb default '{}',
  osm_node_id     bigint,
  updated_at      timestamptz default now()
);

create index if not exists pickup_points_location_idx
  on pickup_points using gist(location);

-- Searches (for analytics & cache warming)
create table if not exists searches (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references users(id) on delete set null,
  origin          geography(Point, 4326) not null,
  destination     geography(Point, 4326) not null,
  origin_label    text,
  dest_label      text,
  created_at      timestamptz default now()
);

create index if not exists searches_user_id_idx on searches(user_id);
create index if not exists searches_origin_idx  on searches using gist(origin);

-- Quotes (short-lived, TTL 90s)
create table if not exists quotes (
  id              uuid primary key default gen_random_uuid(),
  search_id       uuid references searches(id) on delete cascade,
  provider        text not null,
  vehicle_type    text,
  price_min       numeric(8,2),
  price_max       numeric(8,2),
  price_display   text,
  surge_multiplier numeric(4,2) default 1.0,
  eta_seconds     int,
  currency        text default 'GBP',
  raw_response    jsonb,
  fetched_at      timestamptz default now(),
  expires_at      timestamptz default (now() + interval '90 seconds')
);

create index if not exists quotes_search_id_idx  on quotes(search_id);
create index if not exists quotes_expires_at_idx on quotes(expires_at);

-- Bookings
create type booking_status as enum (
  'pending', 'confirmed', 'driver_assigned',
  'in_progress', 'completed', 'cancelled'
);

create table if not exists bookings (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references users(id),
  quote_id            uuid references quotes(id),
  pickup_point_id     uuid references pickup_points(id),
  status              booking_status default 'pending',
  provider            text not null,
  provider_booking_ref text,
  final_fare          numeric(8,2),
  currency            text default 'GBP',
  driver_name         text,
  driver_rating       numeric(3,2),
  vehicle_plate       text,
  started_at          timestamptz,
  completed_at        timestamptz,
  created_at          timestamptz default now()
);

create index if not exists bookings_user_id_idx on bookings(user_id);
create index if not exists bookings_status_idx  on bookings(status);

-- Provider OAuth tokens (encrypted at app layer)
create table if not exists provider_tokens (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references users(id) on delete cascade,
  provider          text not null,
  access_token_enc  text not null,
  refresh_token_enc text,
  expires_at        timestamptz,
  scope             text,
  updated_at        timestamptz default now(),
  unique(user_id, provider)
);

-- Surge history (for "best time to book")
create table if not exists surge_history (
  id              bigserial primary key,
  provider        text not null,
  geohash5        text not null,
  hour_of_week    smallint not null,
  surge_avg       numeric(4,2),
  sample_count    int default 1,
  recorded_at     timestamptz default now()
);

create index if not exists surge_history_lookup_idx
  on surge_history(provider, geohash5, hour_of_week);

-- RPC: nearby_pickup_points
create or replace function nearby_pickup_points(
  user_lat float, user_lng float, radius_m float default 600
)
returns table (
  id uuid, name text, avg_saving_gbp numeric,
  avg_walk_secs int, distance_m float, score float,
  lat float, lng float
)
language sql stable as $$
  select
    pp.id, pp.name, pp.avg_saving_gbp, pp.avg_walk_secs,
    st_distance(pp.location, st_point(user_lng, user_lat)::geography),
    pp.avg_saving_gbp / greatest(pp.avg_walk_secs / 60.0, 0.5),
    st_y(pp.location::geometry)::float,
    st_x(pp.location::geometry)::float
  from pickup_points pp
  where st_dwithin(pp.location, st_point(user_lng, user_lat)::geography, radius_m)
  order by 6 desc
  limit 5;
$$;
