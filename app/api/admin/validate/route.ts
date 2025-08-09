import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createApiResponse, handleApiError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header or cookie
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    // Validate session
    const user = await validateSession(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Return user data (excluding sensitive info)
    return createApiResponse({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        last_login: user.last_login
      },
      valid: true
    });
  } catch (error) {
    return handleApiError(error, 'Session validation failed');
  }
}
