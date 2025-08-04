import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    // Update bus availability
    const { error: updateError } = await supabase.rpc('decrease_bus_availability', {
      route: busRoute,
    });

    if (updateError) {
      console.error('Failed to update bus availability:', updateError);
    }

    return NextResponse.json({ success: true, booking: data });
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}