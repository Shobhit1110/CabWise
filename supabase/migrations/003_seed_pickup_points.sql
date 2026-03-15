-- Seed pickup points for central London (replace with your target area)
-- ST_Point(longitude, latitude) — longitude comes first!
insert into pickup_points (name, location, avg_saving_gbp, avg_walk_secs, provider_hints) values
  ('Waterloo Station Main Entrance',  st_point(-0.1134, 51.5031)::geography, 2.50, 90,  '{"uber": true, "bolt": true}'),
  ('Southbank Side Street',           st_point(-0.1155, 51.5050)::geography, 1.80, 60,  '{"uber": true}'),
  ('Westminster Bridge Bus Stop',     st_point(-0.1218, 51.5007)::geography, 3.00, 120, '{"bolt": true}'),
  ('Lambeth North Station',           st_point(-0.1099, 51.4988)::geography, 2.20, 150, '{"uber": true, "bolt": true}'),
  ('The Cut / Blackfriars Rd',        st_point(-0.1049, 51.5045)::geography, 1.50, 45,  '{"uber": true}'),
  ('Kings Cross Station Entrance',    st_point(-0.1240, 51.5320)::geography, 2.80, 100, '{"uber": true, "bolt": true}'),
  ('Euston Road Bus Stop',            st_point(-0.1330, 51.5282)::geography, 1.90, 75,  '{"uber": true}'),
  ('Liverpool Street Exit A',         st_point(-0.0826, 51.5178)::geography, 2.30, 80,  '{"uber": true, "bolt": true}'),
  ('Paddington Station Praed St',     st_point(-0.1757, 51.5154)::geography, 2.60, 110, '{"bolt": true}'),
  ('Victoria Station Forecourt',      st_point(-0.1440, 51.4952)::geography, 2.10, 70,  '{"uber": true, "bolt": true}');
