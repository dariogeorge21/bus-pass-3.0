/*
  # Initial Schema for Bus Pass Booking System

  1. New Tables
    - `bookings`
      - `id` (serial, primary key)
      - `admission_number` (varchar(7), not null)
      - `student_name` (varchar(100), not null)
      - `bus_route` (varchar(50), not null)
      - `destination` (varchar(100), not null)
      - `payment_status` (boolean, default false)
      - `created_at` (timestamp, default now)

    - `admin_settings`
      - `id` (serial, primary key)
      - `booking_enabled` (boolean, default false)
      - `go_date` (date, nullable)
      - `return_date` (date, nullable)
      - `updated_at` (timestamp, default now)

    - `bus_availability`
      - `id` (serial, primary key)
      - `bus_route` (varchar(50), unique, not null)
      - `available_seats` (integer, default 0)
      - `updated_at` (timestamp, default now)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users and admin access

  3. Functions
    - Function to decrease bus availability on booking
*/

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  admission_number VARCHAR(7) NOT NULL,
  student_name VARCHAR(100) NOT NULL,
  bus_route VARCHAR(50) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  payment_status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create admin_settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id SERIAL PRIMARY KEY,
  booking_enabled BOOLEAN DEFAULT FALSE,
  go_date DATE,
  return_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bus_availability table
CREATE TABLE IF NOT EXISTS bus_availability (
  id SERIAL PRIMARY KEY,
  bus_route VARCHAR(50) UNIQUE NOT NULL,
  available_seats INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_availability ENABLE ROW LEVEL SECURITY;

-- Create policies for bookings (allow inserts for all, selects for authenticated)
CREATE POLICY "Allow public bookings insert"
  ON bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated bookings select"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for admin_settings (read for all, write for authenticated)
CREATE POLICY "Allow public admin_settings select"
  ON admin_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow authenticated admin_settings update"
  ON admin_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for bus_availability (read for all, write for authenticated)
CREATE POLICY "Allow public bus_availability select"
  ON bus_availability
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow authenticated bus_availability update"
  ON bus_availability
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert initial admin settings
INSERT INTO admin_settings (id, booking_enabled) VALUES (1, false) ON CONFLICT (id) DO NOTHING;

-- Insert initial bus availability data
INSERT INTO bus_availability (bus_route, available_seats) VALUES
  ('bus-1', 50), ('bus-2', 50), ('bus-3', 50), ('bus-4', 50), ('bus-5', 50),
  ('bus-6', 50), ('bus-7', 50), ('bus-8', 50), ('bus-9', 50), ('bus-10', 50),
  ('bus-11', 50), ('bus-12', 50), ('bus-13', 50), ('bus-14', 50), ('bus-15', 50),
  ('bus-16', 50), ('bus-17', 50), ('bus-18', 50), ('bus-19', 50), ('bus-20', 50),
  ('bus-21', 50), ('bus-22', 50)
ON CONFLICT (bus_route) DO NOTHING;

-- Create function to decrease bus availability
CREATE OR REPLACE FUNCTION decrease_bus_availability(route TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE bus_availability 
  SET available_seats = GREATEST(available_seats - 1, 0),
      updated_at = NOW()
  WHERE bus_route = route;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increase bus availability
CREATE OR REPLACE FUNCTION increase_bus_availability(route TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE bus_availability 
  SET available_seats = available_seats + 1,
      updated_at = NOW()
  WHERE bus_route = route;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;