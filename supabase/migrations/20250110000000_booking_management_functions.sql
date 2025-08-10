/*
  # Booking Management and Admin Statistics Functions
  
  This migration creates database functions and triggers for automatic booking
  management and real-time statistics tracking.
  
  Functions created:
  1. handle_new_booking() - Trigger function for new bookings
  2. reset_all_bookings() - Function to reset the booking system
  3. Trigger on bookings table to automatically update statistics
  
  Note: The get_booking_statistics() function already exists and should not be modified.
*/

-- First, ensure admin_settings table has the required columns
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS current_bookings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS paid_bookings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unpaid_bookings INTEGER DEFAULT 0;

-- Initialize the statistics if they don't exist
INSERT INTO admin_settings (id, booking_enabled, current_bookings, paid_bookings, unpaid_bookings)
VALUES (1, false, 0, 0, 0)
ON CONFLICT (id) DO UPDATE SET
  current_bookings = COALESCE(admin_settings.current_bookings, 0),
  paid_bookings = COALESCE(admin_settings.paid_bookings, 0),
  unpaid_bookings = COALESCE(admin_settings.unpaid_bookings, 0);

-- Function 1: Handle new booking insertions
CREATE OR REPLACE FUNCTION handle_new_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment current_bookings by 1
  UPDATE admin_settings 
  SET current_bookings = COALESCE(current_bookings, 0) + 1,
      updated_at = NOW()
  WHERE id = 1;
  
  -- Update paid/unpaid bookings based on payment status
  IF NEW.payment_status = true THEN
    UPDATE admin_settings 
    SET paid_bookings = COALESCE(paid_bookings, 0) + 1,
        updated_at = NOW()
    WHERE id = 1;
  ELSE
    UPDATE admin_settings 
    SET unpaid_bookings = COALESCE(unpaid_bookings, 0) + 1,
        updated_at = NOW()
    WHERE id = 1;
  END IF;
  
  -- Decrement available_seats for the specific bus route
  UPDATE buses 
  SET available_seats = GREATEST(COALESCE(available_seats, 0) - 1, 0),
      updated_at = NOW()
  WHERE route_code = NEW.bus_route AND is_active = true;
  
  -- Log the booking for debugging (optional)
  RAISE NOTICE 'New booking processed: Student %, Route %, Payment Status %', 
    NEW.student_name, NEW.bus_route, NEW.payment_status;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the booking insertion
    RAISE WARNING 'Error in handle_new_booking trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 2: Reset all bookings and statistics
CREATE OR REPLACE FUNCTION reset_all_bookings()
RETURNS VOID AS $$
DECLARE
  bus_record RECORD;
  default_seats INTEGER := 10; -- Default seats per bus
BEGIN
  -- Reset all bus available_seats to default capacity
  -- Since we don't have a total_seats column, we'll use a default value
  FOR bus_record IN SELECT id, route_code FROM buses WHERE is_active = true LOOP
    UPDATE buses 
    SET available_seats = default_seats,
        updated_at = NOW()
    WHERE id = bus_record.id;
  END LOOP;
  
  -- Reset all booking statistics in admin_settings
  UPDATE admin_settings 
  SET current_bookings = 0,
      paid_bookings = 0,
      unpaid_bookings = 0,
      updated_at = NOW()
  WHERE id = 1;
  
  -- Log the reset operation
  RAISE NOTICE 'All booking statistics and bus seats have been reset';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error resetting bookings: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS booking_statistics_trigger ON bookings;

-- Create trigger that automatically calls handle_new_booking() after each INSERT
CREATE TRIGGER booking_statistics_trigger
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_booking();

-- Function 3: Get current booking statistics (enhanced version)
-- This function works with the existing get_booking_statistics but provides more detailed info
CREATE OR REPLACE FUNCTION get_detailed_booking_statistics()
RETURNS TABLE(
  total_buses BIGINT,
  total_bookings BIGINT,
  current_bookings INTEGER,
  paid_bookings INTEGER,
  unpaid_bookings INTEGER,
  available_seats BIGINT,
  total_capacity BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM buses WHERE is_active = true) as total_buses,
    (SELECT COUNT(*) FROM bookings) as total_bookings,
    (SELECT COALESCE(admin_settings.current_bookings, 0) FROM admin_settings WHERE id = 1) as current_bookings,
    (SELECT COALESCE(admin_settings.paid_bookings, 0) FROM admin_settings WHERE id = 1) as paid_bookings,
    (SELECT COALESCE(admin_settings.unpaid_bookings, 0) FROM admin_settings WHERE id = 1) as unpaid_bookings,
    (SELECT COALESCE(SUM(available_seats), 0) FROM buses WHERE is_active = true) as available_seats,
    (SELECT COUNT(*) * 50 FROM buses WHERE is_active = true) as total_capacity; -- Assuming 50 seats per bus
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 4: Update booking payment status (for when payments are processed later)
CREATE OR REPLACE FUNCTION update_booking_payment_status(booking_id INTEGER, new_payment_status BOOLEAN)
RETURNS VOID AS $$
DECLARE
  old_payment_status BOOLEAN;
BEGIN
  -- Get the current payment status
  SELECT payment_status INTO old_payment_status
  FROM bookings
  WHERE id = booking_id;

  -- Only update if the status is actually changing
  IF old_payment_status IS DISTINCT FROM new_payment_status THEN
    -- Update the booking
    UPDATE bookings
    SET payment_status = new_payment_status
    WHERE id = booking_id;

    -- Update statistics based on the change
    IF old_payment_status = false AND new_payment_status = true THEN
      -- Changed from unpaid to paid
      UPDATE admin_settings
      SET paid_bookings = COALESCE(paid_bookings, 0) + 1,
          unpaid_bookings = GREATEST(COALESCE(unpaid_bookings, 0) - 1, 0),
          updated_at = NOW()
      WHERE id = 1;
    ELSIF old_payment_status = true AND new_payment_status = false THEN
      -- Changed from paid to unpaid
      UPDATE admin_settings
      SET paid_bookings = GREATEST(COALESCE(paid_bookings, 0) - 1, 0),
          unpaid_bookings = COALESCE(unpaid_bookings, 0) + 1,
          updated_at = NOW()
      WHERE id = 1;
    END IF;

    RAISE NOTICE 'Booking % payment status updated from % to %', booking_id, old_payment_status, new_payment_status;
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error updating booking payment status: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_bus_route ON bookings(bus_route);
CREATE INDEX IF NOT EXISTS idx_admin_settings_id ON admin_settings(id);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_new_booking() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION reset_all_bookings() TO authenticated;
GRANT EXECUTE ON FUNCTION get_detailed_booking_statistics() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_booking_payment_status(INTEGER, BOOLEAN) TO authenticated;
