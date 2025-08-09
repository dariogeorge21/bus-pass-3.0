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
      const { error: updateError } = await supabaseAdmin
        .from('bus_availability')
        .update({
          available_seats: supabaseAdmin.sql`available_seats + 1`,
          updated_at: new Date().toISOString()
        })
        .eq('bus_route', booking.bus_route);

      if (updateError) {
        console.error('Failed to restore seat availability:', updateError);
      }

      return createApiResponse({ message: 'Booking deleted successfully' });
    } catch (error) {
      return handleApiError(error, 'Failed to delete booking');
    }
  });
}

// GET /api/admin/bookings/stats - Get booking statistics
export async function GET_STATS(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      // Get total bookings
      const { count: totalBookings } = await supabaseAdmin
        .from('bookings')
        .select('*', { count: 'exact', head: true });

      // Get paid bookings
      const { count: paidBookings } = await supabaseAdmin
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('payment_status', true);

      // Get bookings by route
      const { data: routeStats } = await supabaseAdmin
        .from('bookings')
        .select('bus_route')
        .then(({ data }) => {
          const stats: { [key: string]: number } = {};
          data?.forEach(booking => {
            stats[booking.bus_route] = (stats[booking.bus_route] || 0) + 1;
          });
          return { data: Object.entries(stats).map(([route, count]) => ({ route, count })) };
        });

      // Get recent bookings (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: recentBookings } = await supabaseAdmin
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      return createApiResponse({
        totalBookings: totalBookings || 0,
        paidBookings: paidBookings || 0,
        pendingBookings: (totalBookings || 0) - (paidBookings || 0),
        recentBookings: recentBookings || 0,
        routeStats: routeStats || []
      });
    } catch (error) {
      return handleApiError(error, 'Failed to fetch booking statistics');
    }
  });
}
