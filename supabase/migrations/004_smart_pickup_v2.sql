-- Migration: Upgrade nearby_pickup_points to use real distance-based scoring
-- with distance decay, popularity weighting, and point quality rating.

-- Add popularity column to pickup_points for demand-weighted scoring
alter table pickup_points
  add column if not exists weekly_rides int default 0,
  add column if not exists rating numeric(3,2) default 4.0;

-- Drop and recreate with improved scoring algorithm
create or replace function nearby_pickup_points(
  user_lat float,
  user_lng float,
  radius_m float default 600
)
returns table (
  id uuid,
  name text,
  avg_saving_gbp numeric,
  avg_walk_secs int,
  distance_m float,
  walk_minutes float,
  weekly_rides int,
  rating numeric,
  score float,
  lat float,
  lng float
)
language sql stable as $$
  with user_point as (
    select st_point(user_lng, user_lat)::geography as geog
  ),
  candidates as (
    select
      pp.id,
      pp.name,
      pp.avg_saving_gbp,
      pp.avg_walk_secs,
      pp.weekly_rides,
      st_distance(pp.location, up.geog) as dist_m,
      -- Real walk time: distance / 1.3 m/s = distance / 78 m/min
      greatest(st_distance(pp.location, up.geog) / 78.0, 0.5) as walk_min,
      -- Distance decay: linear falloff from 1.0 at 0m to 0.0 at radius_m
      greatest(1.0 - st_distance(pp.location, up.geog) / radius_m, 0.0) as decay,
      -- Popularity boost: log scale so high-traffic points get mild preference
      ln(greatest(pp.weekly_rides, 1) + 1) as popularity,
      pp.rating,
      st_y(pp.location::geometry)::float as point_lat,
      st_x(pp.location::geometry)::float as point_lng
    from pickup_points pp
    cross join user_point up
    where st_dwithin(pp.location, up.geog, radius_m)
  )
  select
    c.id,
    c.name,
    c.avg_saving_gbp,
    -- Return estimated walk seconds based on real distance
    (c.walk_min * 60)::int as avg_walk_secs,
    round(c.dist_m::numeric, 1)::float as distance_m,
    round(c.walk_min::numeric, 2)::float as walk_minutes,
    c.weekly_rides,
    c.rating,
    -- Final score: (savings per walk minute) * distance decay * popularity factor
    -- savings_efficiency: how much you save per minute of walking
    -- decay: closer points get exponentially preferred
    -- popularity: mildly prefer proven pickup spots (capped contribution)
    round(
      (c.avg_saving_gbp / c.walk_min)
      * c.decay
      * (1.0 + least(c.popularity / 10.0, 0.3))
      * (c.rating / 5.0)
    ::numeric, 4)::float as score,
    c.point_lat as lat,
    c.point_lng as lng
  from candidates c
  where c.decay > 0
  order by score desc
  limit 5;
$$;
