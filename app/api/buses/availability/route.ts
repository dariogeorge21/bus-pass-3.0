import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('bus_availability')
      .select('bus_route, available_seats');

    if (error) {
      throw error;
    }

    const availability: { [key: string]: number } = {};
    data?.forEach((bus) => {
      availability[bus.bus_route] = bus.available_seats;
    });

    return NextResponse.json(availability);
  } catch (error) {
    return NextResponse.json({}, { status: 500 });
  }
}