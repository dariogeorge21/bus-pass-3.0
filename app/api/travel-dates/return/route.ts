import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('return_date')
      .single();

    if (error) {
      return NextResponse.json({ date: null });
    }

    return NextResponse.json({ date: data?.return_date || null });
  } catch (error) {
    return NextResponse.json({ date: null }, { status: 500 });
  }
}