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
        payment_status: paymentStatus ?? false,
        created_at: timestamp,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, booking: data });
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}