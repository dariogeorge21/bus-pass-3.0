import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth, createApiResponse, handleApiError, validateRequestBody } from '@/lib/middleware';

export async function GET() {
  try {
    // Get admin settings
    const { data: adminData, error: adminError } = await supabase
      .from('admin_settings')
      .select('*')
      .single();

    if (adminError) {
      console.error('Error fetching admin settings:', adminError);
    }

    // Get bus availability from buses table
    const { data: busData, error: busError } = await supabase
      .from('buses')
      .select('route_code, available_seats');

    if (busError) {
      console.error('Error fetching bus availability:', busError);
    }

    const busAvailability: { [key: string]: number } = {};
    busData?.forEach((bus) => {
      busAvailability[bus.route_code] = bus.available_seats;
    });

    return createApiResponse({
      bookingEnabled: adminData?.booking_enabled || false,
      goDate: adminData?.go_date || '',
      returnDate: adminData?.return_date || '',
      busAvailability,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch settings');
  }
}

export async function PATCH(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const body = await req.json();

      // Validate request body
      const validation = validateRequestBody<{
        bookingEnabled: boolean;
        goDate: string;
        returnDate: string;
        busAvailability: { [key: string]: number };
      }>(body, ['bookingEnabled']);

      if (!validation.isValid) {
        return NextResponse.json(
          { error: 'Validation failed', details: validation.errors },
          { status: 400 }
        );
      }

      const { bookingEnabled, goDate, returnDate, busAvailability } = body;

      // Update admin settings using admin client for elevated privileges
      const { error: adminError } = await supabaseAdmin
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
      if (busAvailability) {
        for (const [busRoute, seats] of Object.entries(busAvailability)) {
          const { error: busError } = await supabaseAdmin
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
      }

      return createApiResponse({ message: 'Settings updated successfully' });
    } catch (error) {
      return handleApiError(error, 'Failed to update settings');
    }
  });
}