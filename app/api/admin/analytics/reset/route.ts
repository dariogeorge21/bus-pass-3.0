import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      // Use the new database function to reset all bookings and statistics
      // This will:
      // 1. Delete all bookings
      // 2. Reset all bus available_seats to default capacity (50)
      // 3. Reset all booking statistics in admin_settings

      // First, delete all bookings
      // const { error: deleteError } = await supabaseAdmin
      //   .from('bookings')
      //   .delete()
      //   .neq('id', 0); // Delete all records

      // if (deleteError) {
      //   console.error('Error deleting bookings:', deleteError);
      //   return NextResponse.json({
      //     success: false,
      //     error: 'Failed to delete existing bookings',
      //     data: null
      //   }, { status: 500 });
      // }

      // Call the database function to reset all booking statistics and bus seats
      const { error: resetError } = await supabaseAdmin
        .rpc('reset_all_bookings');

      if (resetError) {
        console.error('Error calling reset_all_bookings function:', resetError);
        return NextResponse.json({
          success: false,
          error: 'Failed to reset booking statistics and bus seats',
          data: null
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: {
          message: 'All booking data reset successfully using database functions',
          deletedBookings: true,
          resetSeats: true,
          resetStatistics: true
        },
        error: null
      });
    } catch (error) {
      console.error('Unexpected error resetting booking data:', error);
      return NextResponse.json({
        success: false,
        error: 'Internal server error',
        data: null
      }, { status: 500 });
    }
  });
}
