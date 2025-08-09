import { NextRequest, NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';
import { createApiResponse, handleApiError, clearAuthCookie } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header or cookie
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No active session found' },
        { status: 400 }
      );
    }

    // Destroy session
    const success = await destroySession(token);
    
    const response = createApiResponse({
      message: success ? 'Logged out successfully' : 'Session already expired'
    });

    // Clear auth cookie
    clearAuthCookie(response);

    return response;
  } catch (error) {
    return handleApiError(error, 'Logout failed');
  }
}
