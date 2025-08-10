import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Get total count of active buses
    const { count, error } = await supabaseAdmin
      .from('buses')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching total buses:', error);
      return NextResponse.json({ 
        success: false,
        error: 'Failed to fetch total buses count',
        data: 0
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: count || 0,
      error: null
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error('Unexpected error fetching total buses:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      data: 0
    }, { status: 500 });
  }
}
