import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentName, admissionNumber, busRoute, destination, paymentStatus, timestamp } = body;

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        student_name: studentName,
        admission_number: admissionNumber,
        bus_route: busRoute,
        destination: destination,
        payment_status: paymentStatus,
        created_at: timestamp,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

      // Update bus availability directly on buses (guarded)
  const { data: decOk, error: updateError } = await supabaseAdmin.rpc('decrease_buses_available_seats_guarded', {
    route: busRoute,
  });

      if (updateError || decOk === false) {
      console.error('Failed to update bus availability:', updateError || 'No seats left');
      // Roll back booking insert if no seats
      if (data?.id) {
        await supabase
          .from('bookings')
          .delete()
          .eq('id', data.id);
      }
      return NextResponse.json({ error: 'No seats available for this route' }, { status: 400 });
    }

    return NextResponse.json({ success: true, booking: data });
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}