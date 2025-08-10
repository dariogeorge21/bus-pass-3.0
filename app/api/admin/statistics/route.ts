import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // Call the get_booking_statistics function
    const { data, error } = await supabaseAdmin.rpc('get_booking_statistics');
    console.log('Statistics fetched successfully:', data);
    
    if (error) {
      console.error('Error fetching statistics:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch statistics',
        details: error.message 
      }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ 
        error: 'No statistics data found' 
      }, { status: 404 });
    }

    const stats = data[0];
    console.log('Statistics fetched successfully:', stats);
    
    return NextResponse.json({
      success: true,
      statistics: {
        totalBuses: stats.total_buses || 0,
        totalBookings: stats.total_bookings || 0,
        currentBookings: stats.current_bookings || 0,
        availableSeats: stats.available_seats || 0
      }
    });
  } catch (error) {
    console.error('Unexpected error fetching statistics:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 