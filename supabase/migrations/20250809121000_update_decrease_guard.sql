/*
  # Guarded decrement for buses.available_seats
  Creates a function that decrements seats only if > 0 and returns whether it succeeded.
*/

CREATE OR REPLACE FUNCTION decrease_buses_available_seats_guarded(route TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE buses
  SET available_seats = available_seats - 1,
      updated_at = NOW()
  WHERE route_code = route
    AND available_seats > 0;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 