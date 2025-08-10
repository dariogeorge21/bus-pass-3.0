import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // Call the reset_all_bus_seats function
    const { error } = await supabaseAdmin.rpc('reset_all_bus_seats');
    
    if (error) {
      console.error('Error resetting seats:', error);
      return NextResponse.json({ 
        error: 'Failed to reset seats',
        details: error.message 
      }, { status: 500 });
    }

    console.log('Seats reset successfully');
    return NextResponse.json({ 
      success: true, 
      message: 'All bus seats have been reset to their total capacity' 
    });
  } catch (error) {
    console.error('Unexpected error in seat reset:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 