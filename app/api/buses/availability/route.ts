import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('buses')
      .select('route_code, available_seats')
      .eq('is_active', true);

    if (error) {
      throw error;
    }

    const availability: { [key: string]: number } = {};
    data?.forEach((bus) => {
      availability[bus.route_code] = bus.available_seats;
    });

    return NextResponse.json(availability);
  } catch (error) {
    return NextResponse.json({}, { status: 500 });
  }
}