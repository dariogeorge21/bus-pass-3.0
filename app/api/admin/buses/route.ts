import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { withAuth, createApiResponse, handleApiError, validateRequestBody } from '@/lib/middleware';

// GET /api/admin/buses - Get all buses
export async function GET() {
  try {
    const { data: buses, error } = await supabase
      .from('buses')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return createApiResponse(buses);
  } catch (error) {
    return handleApiError(error, 'Failed to fetch buses');
  }
}

// POST /api/admin/buses - Create a new bus
export async function POST(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const body = await req.json();
      
      // Validate request body
      const validation = validateRequestBody<{
        name: string;
        route_code: string;
        total_seats?: number;
        available_seats?: number;
        is_active?: boolean;
      }>(body, ['name', 'route_code']);

      if (!validation.isValid) {
        return NextResponse.json(
          { error: 'Validation failed', details: validation.errors },
          { status: 400 }
        );
      }

      const { name, route_code, total_seats = 10, available_seats = 10, is_active = true } = body;
      const supabaseAdmin = getSupabaseAdmin();

      // Check if route_code already exists
      const { data: existingBus } = await supabaseAdmin
        .from('buses')
        .select('id')
        .eq('route_code', route_code)
        .single();

      if (existingBus) {
        return NextResponse.json(
          { error: 'Bus with this route code already exists' },
          { status: 409 }
        );
      }

      // Create new bus
      const { data: newBus, error } = await supabaseAdmin
        .from('buses')
        .insert({
          name,
          route_code,
          total_seats,
          is_active
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Create corresponding bus availability record
      await supabaseAdmin
        .from('bus_availability')
        .insert({
          bus_route: route_code,
          available_seats: available_seats
        });

      return createApiResponse(newBus, undefined, 201);
    } catch (error) {
      return handleApiError(error, 'Failed to create bus');
    }
  });
}

// PUT /api/admin/buses - Update a bus
export async function PUT(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const body = await req.json();
      
      // Validate request body
      const validation = validateRequestBody<{
        id: number;
        name: string;
        total_seats?: number;
        available_seats?: number;
        is_active?: boolean;
      }>(body, ['id', 'name']);

      if (!validation.isValid) {
        return NextResponse.json(
          { error: 'Validation failed', details: validation.errors },
          { status: 400 }
        );
      }

      const { id, name, total_seats, available_seats, is_active } = body;
      const supabaseAdmin = getSupabaseAdmin();

      // Update bus
      const { data: updatedBus, error } = await supabaseAdmin
        .from('buses')
        .update({
          name,
          total_seats,
          is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update bus availability if available_seats changed
      if (available_seats !== undefined) {
        await supabaseAdmin
          .from('bus_availability')
          .update({
            available_seats: available_seats,
            updated_at: new Date().toISOString()
          })
          .eq('bus_route', updatedBus.route_code);
      }

      return createApiResponse(updatedBus);
    } catch (error) {
      return handleApiError(error, 'Failed to update bus');
    }
  });
}

// DELETE /api/admin/buses - Delete a bus
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');

      if (!id) {
        return NextResponse.json(
          { error: 'Bus ID is required' },
          { status: 400 }
        );
      }

      const supabaseAdmin = getSupabaseAdmin();

      // Get bus details first
      const { data: bus, error: fetchError } = await supabaseAdmin
        .from('buses')
        .select('route_code')
        .eq('id', id)
        .single();

      if (fetchError || !bus) {
        return NextResponse.json(
          { error: 'Bus not found' },
          { status: 404 }
        );
      }

      // Delete bus (this will cascade delete route_stops due to foreign key)
      const { error: deleteError } = await supabaseAdmin
        .from('buses')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // Delete corresponding bus availability record
      await supabaseAdmin
        .from('bus_availability')
        .delete()
        .eq('bus_route', bus.route_code);

      return createApiResponse({ message: 'Bus deleted successfully' });
    } catch (error) {
      return handleApiError(error, 'Failed to delete bus');
    }
  });
}
