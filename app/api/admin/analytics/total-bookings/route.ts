import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Get total count of all bookings (both paid and unpaid)
    const { count, error } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching total bookings:', error);
      return NextResponse.json({ 
        success: false,
        error: 'Failed to fetch total bookings count',
        data: 0
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: count || 0,
      error: null
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=30'
      }
    });
  } catch (error) {
    console.error('Unexpected error fetching total bookings:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      data: 0
    }, { status: 500 });
  }
}
