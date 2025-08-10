#!/usr/bin/env node

/**
 * Test Script for Seat Management and Booking Tracking System
 * 
 * This script tests the following functionality:
 * 1. Database schema changes (total_seats, current_bookings)
 * 2. Seat reset functionality
 * 3. Booking counter integration
 * 4. Statistics API endpoints
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSeatManagement() {
  console.log('🚌 Testing Seat Management and Booking Tracking System\n');

  try {
    // Test 1: Check if new columns exist
    console.log('1. Checking database schema...');
    
    const { data: buses, error: busesError } = await supabase
      .from('buses')
      .select('*')
      .limit(1);
    
    if (busesError) {
      console.error('❌ Error checking buses table:', busesError);
      return;
    }

    if (buses.length > 0) {
      const bus = buses[0];
      if ('total_seats' in bus) {
        console.log('✅ total_seats column exists in buses table');
      } else {
        console.log('❌ total_seats column missing from buses table');
      }
    }

    const { data: adminSettings, error: settingsError } = await supabase
      .from('admin_settings')
      .select('*')
      .limit(1);
    
    if (settingsError) {
      console.error('❌ Error checking admin_settings table:', settingsError);
      return;
    }

    if (adminSettings.length > 0) {
      const settings = adminSettings[0];
      if ('current_bookings' in settings) {
        console.log('✅ current_bookings column exists in admin_settings table');
      } else {
        console.log('❌ current_bookings column missing from admin_settings table');
      }
    }

    // Test 2: Check if functions exist
    console.log('\n2. Checking database functions...');
    
    try {
      const { data: stats, error: statsError } = await supabase.rpc('get_booking_statistics');
      if (statsError) {
        console.log('❌ get_booking_statistics function not found or error:', statsError.message);
      } else {
        console.log('✅ get_booking_statistics function works');
        console.log('   Statistics:', stats);
      }
    } catch (error) {
      console.log('❌ get_booking_statistics function not found');
    }

    // Test 3: Test seat reset functionality
    console.log('\n3. Testing seat reset functionality...');
    
    try {
      const { error: resetError } = await supabase.rpc('reset_all_bus_seats');
      if (resetError) {
        console.log('❌ reset_all_bus_seats function error:', resetError.message);
      } else {
        console.log('✅ reset_all_bus_seats function works');
      }
    } catch (error) {
      console.log('❌ reset_all_bus_seats function not found');
    }

    // Test 4: Check current data
    console.log('\n4. Checking current data...');
    
    const { data: currentBuses, error: currentBusesError } = await supabase
      .from('buses')
      .select('name, route_code, total_seats, is_active');
    
    if (currentBusesError) {
      console.error('❌ Error fetching current buses:', currentBusesError);
    } else {
      console.log('✅ Current buses:');
      currentBuses.forEach(bus => {
        console.log(`   - ${bus.name} (${bus.route_code}): ${bus.total_seats} total seats`);
      });
    }

    const { data: currentAvailability, error: availabilityError } = await supabase
      .from('bus_availability')
      .select('bus_route, available_seats');
    
    if (availabilityError) {
      console.error('❌ Error fetching bus availability:', availabilityError);
    } else {
      console.log('✅ Current bus availability:');
      currentAvailability.forEach(avail => {
        console.log(`   - ${avail.bus_route}: ${avail.available_seats} available seats`);
      });
    }

    const { data: currentSettings, error: settingsError2 } = await supabase
      .from('admin_settings')
      .select('booking_enabled, current_bookings');
    
    if (settingsError2) {
      console.error('❌ Error fetching admin settings:', settingsError2);
    } else if (currentSettings.length > 0) {
      const settings = currentSettings[0];
      console.log('✅ Current admin settings:');
      console.log(`   - Booking enabled: ${settings.booking_enabled}`);
      console.log(`   - Current bookings: ${settings.current_bookings}`);
    }

    // Test 5: Check bookings table
    console.log('\n5. Checking bookings table...');
    
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, payment_status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (bookingsError) {
      console.error('❌ Error fetching bookings:', bookingsError);
    } else {
      console.log(`✅ Found ${bookings.length} recent bookings`);
      const paidBookings = bookings.filter(b => b.payment_status).length;
      console.log(`   - Paid bookings: ${paidBookings}`);
      console.log(`   - Pending bookings: ${bookings.length - paidBookings}`);
    }

    console.log('\n🎉 Seat management system test completed!');
    console.log('\n📋 Summary:');
    console.log('   - Check the output above for any ❌ errors');
    console.log('   - If functions are missing, run: npx supabase db push');
    console.log('   - If columns are missing, check the migration file');
    console.log('   - Test the admin dashboard to verify the UI works correctly');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testSeatManagement().catch(console.error); 