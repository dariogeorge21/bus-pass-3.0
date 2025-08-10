import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Get current/active bookings for the upcoming trip
    // This counts bookings that are considered "current" - typically paid bookings
    // or all bookings within a certain timeframe for the upcoming trip
    
    // First, get admin settings to check if there are specific travel dates
    const { data: settings } = await supabaseAdmin
      .from('admin_settings')
      .select('go_date, return_date')
      .single();

    let query = supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true });

    // If we have travel dates set, we can filter bookings for the current trip
    // For now, we'll count all paid bookings as "current bookings"
    // This can be adjusted based on business logic
    query = query.eq('payment_status', true);

    const { count, error } = await query;

    if (error) {
      console.error('Error fetching current bookings:', error);
      return NextResponse.json({ 
        success: false,
        error: 'Failed to fetch current bookings count',
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
    console.error('Unexpected error fetching current bookings:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      data: 0
    }, { status: 500 });
  }
}
