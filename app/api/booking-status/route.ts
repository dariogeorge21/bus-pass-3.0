import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('booking_enabled')
      .single();

    if (error) {
      return NextResponse.json({ enabled: true });
    }

    return NextResponse.json({ enabled: data?.booking_enabled || false });
  } catch (error) {
    return NextResponse.json({ enabled: false }, { status: 500 });
  }
}