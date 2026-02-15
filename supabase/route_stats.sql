-- Route Stats: Distance, Speed, Elevation
-- All fields are optional (nullable)
-- Stored in imperial units (mi, mph, ft) with auto metric conversion on frontend

ALTER TABLE routes ADD COLUMN IF NOT EXISTS distance_mi DECIMAL(6,2);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS avg_speed_mph DECIMAL(5,1);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS uphill_ft INTEGER;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS downhill_ft INTEGER;
