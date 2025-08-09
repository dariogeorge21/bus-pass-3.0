import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth, createApiResponse, handleApiError, validateRequestBody } from '@/lib/middleware';

// GET /api/admin/route-stops - Get all route stops or by route
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const routeCode = searchParams.get('route_code');

    let query = supabase
      .from('route_stops')
      .select('*')
      .order('route_code')
      .order('stop_order');

    if (routeCode) {
      query = query.eq('route_code', routeCode);
    }

    const { data: routeStops, error } = await query;

    if (error) {
      throw error;
    }

    return createApiResponse(routeStops);
  } catch (error) {
    return handleApiError(error, 'Failed to fetch route stops');
  }
}

// POST /api/admin/route-stops - Create a new route stop
export async function POST(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const body = await req.json();
      
      // Validate request body
      const validation = validateRequestBody<{
        route_code: string;
        stop_name: string;
        fare: number;
        stop_order: number;
      }>(body, ['route_code', 'stop_name', 'fare', 'stop_order']);

      if (!validation.isValid) {
        return NextResponse.json(
          { error: 'Validation failed', details: validation.errors },
          { status: 400 }
        );
      }

      const { route_code, stop_name, fare, stop_order, is_active = true } = body;

      // Validate that the route exists
      const { data: bus, error: busError } = await supabaseAdmin
        .from('buses')
        .select('id')
        .eq('route_code', route_code)
        .single();

      if (busError || !bus) {
        return NextResponse.json(
          { error: 'Invalid route code' },
          { status: 400 }
        );
      }

      // Check if stop already exists for this route
      const { data: existingStop } = await supabaseAdmin
        .from('route_stops')
        .select('id')
        .eq('route_code', route_code)
        .eq('stop_name', stop_name)
        .single();

      if (existingStop) {
        return NextResponse.json(
          { error: 'Stop already exists for this route' },
          { status: 409 }
        );
      }

      // Check if stop_order already exists for this route
      const { data: existingOrder } = await supabaseAdmin
        .from('route_stops')
        .select('id')
        .eq('route_code', route_code)
        .eq('stop_order', stop_order)
        .single();

      if (existingOrder) {
        return NextResponse.json(
          { error: 'Stop order already exists for this route' },
          { status: 409 }
        );
      }

      // Create new route stop
      const { data: newStop, error } = await supabaseAdmin
        .from('route_stops')
        .insert({
          route_code,
          stop_name,
          fare,
          stop_order,
          is_active
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return createApiResponse(newStop, undefined, 201);
    } catch (error) {
      return handleApiError(error, 'Failed to create route stop');
    }
  });
}

// PUT /api/admin/route-stops - Update a route stop
export async function PUT(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const body = await req.json();
      
      // Validate request body
      const validation = validateRequestBody<{
        id: number;
        stop_name: string;
        fare: number;
        stop_order: number;
      }>(body, ['id', 'stop_name', 'fare', 'stop_order']);

      if (!validation.isValid) {
        return NextResponse.json(
          { error: 'Validation failed', details: validation.errors },
          { status: 400 }
        );
      }

      const { id, stop_name, fare, stop_order, is_active } = body;

      // Get current stop to check route_code
      const { data: currentStop, error: fetchError } = await supabaseAdmin
        .from('route_stops')
        .select('route_code')
        .eq('id', id)
        .single();

      if (fetchError || !currentStop) {
        return NextResponse.json(
          { error: 'Route stop not found' },
          { status: 404 }
        );
      }

      // Check if new stop_order conflicts with existing stops (excluding current)
      const { data: conflictingOrder } = await supabaseAdmin
        .from('route_stops')
        .select('id')
        .eq('route_code', currentStop.route_code)
        .eq('stop_order', stop_order)
        .neq('id', id)
        .single();

      if (conflictingOrder) {
        return NextResponse.json(
          { error: 'Stop order already exists for this route' },
          { status: 409 }
        );
      }

      // Update route stop
      const { data: updatedStop, error } = await supabaseAdmin
        .from('route_stops')
        .update({
          stop_name,
          fare,
          stop_order,
          is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return createApiResponse(updatedStop);
    } catch (error) {
      return handleApiError(error, 'Failed to update route stop');
    }
  });
}

// DELETE /api/admin/route-stops - Delete a route stop
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');

      if (!id) {
        return NextResponse.json(
          { error: 'Route stop ID is required' },
          { status: 400 }
        );
      }

      // Delete route stop
      const { error } = await supabaseAdmin
        .from('route_stops')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return createApiResponse({ message: 'Route stop deleted successfully' });
    } catch (error) {
      return handleApiError(error, 'Failed to delete route stop');
    }
  });
}
