import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { withAuth, createApiResponse, handleApiError, validateRequestBody } from '@/lib/middleware';

// GET /api/admin/bookings - Get all bookings with optional filters
export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const busRoute = searchParams.get('bus_route');
      const paymentStatus = searchParams.get('payment_status');
      const startDate = searchParams.get('start_date');
      const endDate = searchParams.get('end_date');

      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from('bookings')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (busRoute) {
        query = query.eq('bus_route', busRoute);
      }

      if (paymentStatus !== null && paymentStatus !== undefined) {
        query = query.eq('payment_status', paymentStatus === 'true');
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data: bookings, error, count } = await query;

      if (error) {
        throw error;
      }

      return createApiResponse({
        bookings,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      });
    } catch (error) {
      return handleApiError(error, 'Failed to fetch bookings');
    }
  });
}

// PUT /api/admin/bookings - Update booking payment status
export async function PUT(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const body = await req.json();
      
      // Validate request body
      const validation = validateRequestBody<{
        id: number;
        payment_status: boolean;
      }>(body, ['id', 'payment_status']);

      if (!validation.isValid) {
        return NextResponse.json(
          { error: 'Validation failed', details: validation.errors },
          { status: 400 }
        );
      }

      const { id, payment_status } = body;

      // Update booking
      const { data: updatedBooking, error } = await supabaseAdmin
        .from('bookings')
        .update({
          payment_status
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!updatedBooking) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        );
      }

      return createApiResponse(updatedBooking);
    } catch (error) {
      return handleApiError(error, 'Failed to update booking');
    }
  });
}

// DELETE /api/admin/bookings - Delete a booking
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');

      if (!id) {
        return NextResponse.json(
          { error: 'Booking ID is required' },
          { status: 400 }
        );
      }

      // Get booking details before deletion to restore seat availability
      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('bus_route')
        .eq('id', id)
        .single();

      if (fetchError || !booking) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        );
      }

      // Delete booking
      const { error: deleteError } = await supabaseAdmin
        .from('bookings')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // Restore seat availability
      const { error: updateError } = await supabaseAdmin.rpc('increase_buses_available_seats', {
        route: booking.bus_route
      });

      if (updateError) {
        console.error('Failed to restore seat availability:', updateError);
      }

      return createApiResponse({ message: 'Booking deleted successfully' });
    } catch (error) {
      return handleApiError(error, 'Failed to delete booking');
    }
  });
}
