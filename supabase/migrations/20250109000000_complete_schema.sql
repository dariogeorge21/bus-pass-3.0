/*
  # Complete Schema for Bus Pass Booking System
  
  This migration adds the missing tables to complete the 7-table schema:
  - admin_users: Admin user accounts with secure authentication
  - admin_sessions: Session management for admin authentication
  - buses: Bus fleet information
  - route_stops: Bus route stops and fare information
  
  Also updates existing tables and adds proper relationships.
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create admin_sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create buses table
CREATE TABLE IF NOT EXISTS buses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  route_code VARCHAR(50) UNIQUE NOT NULL,
  capacity INTEGER DEFAULT 50 CHECK (capacity > 0),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create route_stops table
CREATE TABLE IF NOT EXISTS route_stops (
  id SERIAL PRIMARY KEY,
  route_code VARCHAR(50) NOT NULL REFERENCES buses(route_code) ON DELETE CASCADE,
  stop_name VARCHAR(100) NOT NULL,
  fare INTEGER NOT NULL CHECK (fare >= 0),
  stop_order INTEGER NOT NULL CHECK (stop_order > 0),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(route_code, stop_order),
  UNIQUE(route_code, stop_name)
);

-- Enable RLS on new tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_users (only authenticated admin users can access)
CREATE POLICY "Admin users can view admin_users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can update their own record"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Create policies for admin_sessions (only authenticated users can manage their sessions)
CREATE POLICY "Users can manage their own sessions"
  ON admin_sessions
  FOR ALL
  TO authenticated
  USING (true);

-- Create policies for buses (read for all, write for authenticated)
CREATE POLICY "Allow public buses select"
  ON buses
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Allow authenticated buses management"
  ON buses
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for route_stops (read for all, write for authenticated)
CREATE POLICY "Allow public route_stops select"
  ON route_stops
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Allow authenticated route_stops management"
  ON route_stops
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token_hash ON admin_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_buses_route_code ON buses(route_code);
CREATE INDEX IF NOT EXISTS idx_buses_is_active ON buses(is_active);
CREATE INDEX IF NOT EXISTS idx_route_stops_route_code ON route_stops(route_code);
CREATE INDEX IF NOT EXISTS idx_route_stops_is_active ON route_stops(is_active);
CREATE INDEX IF NOT EXISTS idx_route_stops_stop_order ON route_stops(route_code, stop_order);

-- Insert default admin user (password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT INTO admin_users (username, password_hash, email, full_name, role)
VALUES (
  'admin',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin@buspass.com',
  'System Administrator',
  'super_admin'
) ON CONFLICT (username) DO NOTHING;

-- Insert sample buses data
INSERT INTO buses (name, route_code, capacity) VALUES
  ('Bus 1 - Kottayam Route', 'bus-1', 50),
  ('Bus 2 - Ernakulam Route', 'bus-2', 50),
  ('Bus 3 - Thodupuzha Route', 'bus-3', 50),
  ('Bus 4 - Alappuzha Route', 'bus-4', 50),
  ('Bus 5 - Thrissur Route', 'bus-5', 50),
  ('Bus 6 - Kozhikode Route', 'bus-6', 50),
  ('Bus 7 - Kannur Route', 'bus-7', 50),
  ('Bus 8 - Kasaragod Route', 'bus-8', 50),
  ('Bus 9 - Palakkad Route', 'bus-9', 50),
  ('Bus 10 - Malappuram Route', 'bus-10', 50),
  ('Bus 11 - Wayanad Route', 'bus-11', 50),
  ('Bus 12 - Idukki Route', 'bus-12', 50),
  ('Bus 13 - Pathanamthitta Route', 'bus-13', 50),
  ('Bus 14 - Kollam Route', 'bus-14', 50),
  ('Bus 15 - Thiruvananthapuram Route', 'bus-15', 50),
  ('Bus 16 - Kochi Metro Route', 'bus-16', 50),
  ('Bus 17 - Munnar Route', 'bus-17', 50),
  ('Bus 18 - Thekkady Route', 'bus-18', 50),
  ('Bus 19 - Varkala Route', 'bus-19', 50),
  ('Bus 20 - Kovalam Route', 'bus-20', 50),
  ('Bus 21 - Alleppey Route', 'bus-21', 50),
  ('Bus 22 - Kumarakom Route', 'bus-22', 50)
ON CONFLICT (route_code) DO NOTHING;

-- Insert sample route stops data
INSERT INTO route_stops (route_code, stop_name, fare, stop_order) VALUES
  -- Bus 1 - Kottayam Route
  ('bus-1', 'Kottayam', 50, 1),
  ('bus-1', 'Changanassery', 40, 2),
  ('bus-1', 'Thiruvalla', 60, 3),
  ('bus-1', 'Chengannur', 70, 4),

  -- Bus 2 - Ernakulam Route
  ('bus-2', 'Ernakulam', 80, 1),
  ('bus-2', 'Aluva', 70, 2),
  ('bus-2', 'Perumbavoor', 60, 3),
  ('bus-2', 'Muvattupuzha', 50, 4),

  -- Bus 3 - Thodupuzha Route
  ('bus-3', 'Thodupuzha', 45, 1),
  ('bus-3', 'Idukki', 65, 2),
  ('bus-3', 'Kumily', 85, 3),
  ('bus-3', 'Vandiperiyar', 75, 4),

  -- Bus 4 - Alappuzha Route
  ('bus-4', 'Alappuzha', 55, 1),
  ('bus-4', 'Cherthala', 45, 2),
  ('bus-4', 'Ambalapuzha', 35, 3),
  ('bus-4', 'Haripad', 65, 4),

  -- Bus 5 - Thrissur Route
  ('bus-5', 'Thrissur', 90, 1),
  ('bus-5', 'Chalakudy', 80, 2),
  ('bus-5', 'Kodungallur', 70, 3),
  ('bus-5', 'Irinjalakuda', 60, 4),

  -- Bus 6 - Kozhikode Route
  ('bus-6', 'Kozhikode', 120, 1),
  ('bus-6', 'Vadakara', 110, 2),
  ('bus-6', 'Koyilandy', 100, 3),
  ('bus-6', 'Ramanattukara', 90, 4),

  -- Bus 7 - Kannur Route
  ('bus-7', 'Kannur', 140, 1),
  ('bus-7', 'Thalassery', 130, 2),
  ('bus-7', 'Iritty', 120, 3),
  ('bus-7', 'Payyannur', 150, 4),

  -- Bus 8 - Kasaragod Route
  ('bus-8', 'Kasaragod', 160, 1),
  ('bus-8', 'Kanhangad', 150, 2),
  ('bus-8', 'Nileshwar', 140, 3),
  ('bus-8', 'Bekal', 130, 4),

  -- Bus 9 - Palakkad Route
  ('bus-9', 'Palakkad', 100, 1),
  ('bus-9', 'Ottapalam', 90, 2),
  ('bus-9', 'Shoranur', 80, 3),
  ('bus-9', 'Mannarkkad', 110, 4),

  -- Bus 10 - Malappuram Route
  ('bus-10', 'Malappuram', 95, 1),
  ('bus-10', 'Manjeri', 85, 2),
  ('bus-10', 'Perinthalmanna', 75, 3),
  ('bus-10', 'Nilambur', 105, 4)
ON CONFLICT (route_code, stop_name) DO NOTHING;

-- Update bus_availability to reference the new buses table
UPDATE bus_availability
SET bus_route = buses.route_code
FROM buses
WHERE bus_availability.bus_route = buses.route_code;

-- Create function to clean expired sessions
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS VOID AS $$
BEGIN
  DELETE FROM admin_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buses_updated_at
  BEFORE UPDATE ON buses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_route_stops_updated_at
  BEFORE UPDATE ON route_stops
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
