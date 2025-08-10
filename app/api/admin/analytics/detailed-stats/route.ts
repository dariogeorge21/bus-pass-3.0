import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Try to use the database function first, fallback to individual queries if it doesn't exist
    let stats;

    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_detailed_booking_statistics');

      if (!error && data && data.length > 0) {
        stats = data[0];
      } else {
        throw new Error('Database function not available');
      }
    } catch (functionError) {
      console.log('Database function not available, using fallback queries');

      // Fallback: Use individual queries to get the statistics
      const [
        totalBusesResult,
        totalBookingsResult,
        paidBookingsResult,
        unpaidBookingsResult,
        availableSeatsResult,
        adminSettingsResult
      ] = await Promise.all([
        // Total buses
        supabaseAdmin
          .from('buses')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),

        // Total bookings
        supabaseAdmin
          .from('bookings')
          .select('*', { count: 'exact', head: true }),

        // Paid bookings
        supabaseAdmin
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('payment_status', true),

        // Unpaid bookings
        supabaseAdmin
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('payment_status', false),

        // Available seats
        supabaseAdmin
          .from('buses')
          .select('buses.available_seats')
          .eq('is_active', true),

        // Admin settings for current_bookings
        supabaseAdmin
          .from('admin_settings')
          .select('current_bookings')
          .eq('id', 1)
          .single()
      ]);

      const totalBuses = totalBusesResult.count || 0;
      const totalBookings = totalBookingsResult.count || 0;
      const paidBookings = paidBookingsResult.count || 0;
      const unpaidBookings = unpaidBookingsResult.count || 0;
      const availableSeats = availableSeatsResult.data?.reduce((sum: number, bus: any) => sum + (bus.available_seats || 0), 0) || 0;
      const currentBookings = adminSettingsResult.data?.current_bookings || paidBookings; // Fallback to paid bookings if current_bookings doesn't exist
      const totalCapacity = totalBuses * 50; // Assuming 50 seats per bus

      stats = {
        total_buses: totalBuses,
        total_bookings: totalBookings,
        current_bookings: currentBookings,
        paid_bookings: paidBookings,
        unpaid_bookings: unpaidBookings,
        available_seats: availableSeats,
        total_capacity: totalCapacity
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        totalBuses: Number(stats.total_buses),
        totalBookings: Number(stats.total_bookings),
        currentBookings: Number(stats.current_bookings),
        paidBookings: Number(stats.paid_bookings),
        unpaidBookings: Number(stats.unpaid_bookings),
        availableSeats: Number(stats.available_seats),
        totalCapacity: Number(stats.total_capacity),
        occupancyRate: stats.total_capacity > 0 
          ? ((stats.total_capacity - stats.available_seats) / stats.total_capacity * 100).toFixed(1)
          : '0.0'
      },
      error: null
    }, {
      headers: {
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=15'
      }
    });
  } catch (error) {
    console.error('Unexpected error fetching detailed booking statistics:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      data: null
    }, { status: 500 });
  }
}
