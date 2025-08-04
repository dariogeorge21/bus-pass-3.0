import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Get admin settings
    const { data: adminData, error: adminError } = await supabase
      .from('admin_settings')
      .select('*')
      .single();

    // Get bus availability
    const { data: busData, error: busError } = await supabase
      .from('bus_availability')
      .select('bus_route, available_seats');

    const busAvailability: { [key: string]: number } = {};
    busData?.forEach((bus) => {
      busAvailability[bus.bus_route] = bus.available_seats;
    });

    return NextResponse.json({
      bookingEnabled: adminData?.booking_enabled || false,
      goDate: adminData?.go_date || '',
      returnDate: adminData?.return_date || '',
      busAvailability,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { bookingEnabled, goDate, returnDate, busAvailability } = body;

    // Update admin settings
    const { error: adminError } = await supabase
      .from('admin_settings')
      .upsert({
        id: 1,
        booking_enabled: bookingEnabled,
        go_date: goDate || null,
        return_date: returnDate || null,
        updated_at: new Date().toISOString(),
      });

    if (adminError) {
      throw adminError;
    }

    // Update bus availability
    for (const [busRoute, seats] of Object.entries(busAvailability)) {
      const { error: busError } = await supabase
        .from('bus_availability')
        .upsert({
          bus_route: busRoute,
          available_seats: seats as number,
          updated_at: new Date().toISOString(),
        });

      if (busError) {
        console.error(`Failed to update ${busRoute}:`, busError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}