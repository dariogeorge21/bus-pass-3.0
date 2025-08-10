import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('admin_settings')
      .select('booking_enabled')
      .single();

    if (error) {
      console.error('Error fetching booking status:', error);
      // Default to enabled if there's an error (fail-safe)
      return NextResponse.json({ enabled: true });
    }

    const bookingEnabled = data?.booking_enabled ?? true;
    console.log('Booking status:', { booking_enabled: bookingEnabled });

    return NextResponse.json({ enabled: bookingEnabled });
  } catch (error) {
    console.error('Unexpected error in booking status check:', error);
    // Default to enabled if there's an unexpected error (fail-safe)
    return NextResponse.json({ enabled: true }, { status: 500 });
  }
}