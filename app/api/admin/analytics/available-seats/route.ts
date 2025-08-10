import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Get total available seats across all active buses
    const { data: buses, error } = await supabaseAdmin
      .from('buses')
      .select('available_seats')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching available seats:', error);
      return NextResponse.json({ 
        success: false,
        error: 'Failed to fetch available seats count',
        data: 0
      }, { status: 500 });
    }

    // Sum up all available seats
    const totalAvailableSeats = buses?.reduce((total, bus) => {
      return total + (bus.available_seats || 0);
    }, 0) || 0;

    return NextResponse.json({
      success: true,
      data: totalAvailableSeats,
      error: null
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=30'
      }
    });
  } catch (error) {
    console.error('Unexpected error fetching available seats:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      data: 0
    }, { status: 500 });
  }
}
