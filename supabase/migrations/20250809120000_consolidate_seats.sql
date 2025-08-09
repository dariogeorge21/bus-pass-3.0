/*
  # Consolidate seat availability into buses table

  1) Add available_seats to buses (default 10, not null)
  2) Migrate data from bus_availability
  3) Create safe increment/decrement functions on buses
  4) Drop old RPC functions and bus_availability table
*/

-- 1) Add column if not exists
ALTER TABLE buses
ADD COLUMN IF NOT EXISTS available_seats INTEGER NOT NULL DEFAULT 10;

-- 2) Migrate existing data from bus_availability to buses.available_seats
DO $$
BEGIN
  IF to_regclass('public.bus_availability') IS NOT NULL THEN
    UPDATE buses b
    SET available_seats = ba.available_seats
    FROM bus_availability ba
    WHERE ba.bus_route = b.route_code;
  END IF;
END $$;

-- 3) Create safe decrement/increment functions for buses
CREATE OR REPLACE FUNCTION decrease_buses_available_seats(route TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE buses
  SET available_seats = GREATEST(available_seats - 1, 0),
      updated_at = NOW()
  WHERE route_code = route;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increase_buses_available_seats(route TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE buses
  SET available_seats = available_seats + 1,
      updated_at = NOW()
  WHERE route_code = route;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) Drop old functions and table if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'decrease_bus_availability' AND n.nspname = 'public'
  ) THEN
    DROP FUNCTION public.decrease_bus_availability(TEXT);
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'increase_bus_availability' AND n.nspname = 'public'
  ) THEN
    DROP FUNCTION public.increase_bus_availability(TEXT);
  END IF;

  IF to_regclass('public.bus_availability') IS NOT NULL THEN
    DROP TABLE public.bus_availability;
  END IF;
END $$; 