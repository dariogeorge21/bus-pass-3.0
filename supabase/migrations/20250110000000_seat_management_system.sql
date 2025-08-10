/*
  # Seat Management and Booking Tracking System
  
  This migration adds comprehensive seat management and booking tracking functionality:
  - Adds total_seats column to buses table
  - Adds current_bookings column to admin_settings table
  - Creates functions for seat management and booking tracking
  - Updates existing data to set proper total_seats values
*/

-- Add total_seats column to buses table
ALTER TABLE buses 
ADD COLUMN IF NOT EXISTS total_seats INTEGER DEFAULT 50 CHECK (total_seats > 0);

-- Add current_bookings column to admin_settings table
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS current_bookings INTEGER DEFAULT 0 CHECK (current_bookings >= 0);

-- Update existing buses to have total_seats if not set
UPDATE buses 
SET total_seats = 50 
WHERE total_seats IS NULL;

-- Update admin_settings to have current_bookings if not set
UPDATE admin_settings 
SET current_bookings = 0 
WHERE current_bookings IS NULL;

-- Create function to reset all bus seats to their total capacity
CREATE OR REPLACE FUNCTION reset_all_bus_seats()
RETURNS VOID AS $$
BEGIN
  -- Reset available_seats to total_seats for all buses
  UPDATE bus_availability 
  SET available_seats = b.total_seats,
      updated_at = NOW()
  FROM buses b
  WHERE bus_availability.bus_route = b.route_code
    AND b.is_active = true;
  
  -- Reset current_bookings counter to 0
  UPDATE admin_settings 
  SET current_bookings = 0,
      updated_at = NOW()
  WHERE id = 1;
  
  -- Log the reset operation
  RAISE NOTICE 'All bus seats have been reset to their total capacity. Current bookings counter reset to 0.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increment booking counter
CREATE OR REPLACE FUNCTION increment_booking_counter()
RETURNS VOID AS $$
BEGIN
  -- Increment current_bookings by 1
  UPDATE admin_settings 
  SET current_bookings = current_bookings + 1,
      updated_at = NOW()
  WHERE id = 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get booking statistics
CREATE OR REPLACE FUNCTION get_booking_statistics()
RETURNS TABLE (
  total_buses INTEGER,
  total_bookings BIGINT,
  current_bookings INTEGER,
  available_seats INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM buses WHERE is_active = true) as total_buses,
    (SELECT COUNT(*) FROM bookings) as total_bookings,
    (SELECT current_bookings FROM admin_settings WHERE id = 1) as current_bookings,
    (SELECT COALESCE(SUM(available_seats), 0) FROM bus_availability) as available_seats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically increment booking counter when a new booking is inserted
CREATE OR REPLACE FUNCTION trigger_increment_booking_counter()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment counter for successful bookings (payment_status = true)
  IF NEW.payment_status = true THEN
    PERFORM increment_booking_counter();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS increment_booking_counter_trigger ON bookings;
CREATE TRIGGER increment_booking_counter_trigger
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_increment_booking_counter();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION reset_all_bus_seats() TO authenticated;
GRANT EXECUTE ON FUNCTION increment_booking_counter() TO authenticated;
GRANT EXECUTE ON FUNCTION get_booking_statistics() TO authenticated; 