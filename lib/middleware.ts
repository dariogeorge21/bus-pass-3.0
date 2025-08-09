import { NextRequest, NextResponse } from 'next/server';
import { validateSession, AdminUser } from './auth';

export interface AuthenticatedRequest extends NextRequest {
  user?: AdminUser;
}

/**
 * Middleware to validate admin authentication
 */
export async function withAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Get token from Authorization header or cookie
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
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

    // Add user to request
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = user;

    return handler(authenticatedRequest);
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

/**
 * Middleware to validate admin role
 */
export async function withAdminAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  requiredRole: string = 'admin'
): Promise<NextResponse> {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    const user = req.user!;
    
    // Check if user has required role
    if (requiredRole === 'super_admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return handler(req);
  });
}

/**
 * Extract user from authenticated request
 */
export function getUser(request: AuthenticatedRequest): AdminUser | null {
  return request.user || null;
}

/**
 * Validate request body against schema
 */
export function validateRequestBody<T>(
  body: any,
  requiredFields: (keyof T)[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const field of requiredFields) {
    // Only check for presence (not truthiness) so that false/0/'' are accepted when intended
    const hasField = Object.prototype.hasOwnProperty.call(body, field as string);
    const value = (body as any)[field as string];
    if (!hasField || value === undefined || value === null) {
      errors.push(`${String(field)} is required`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Create standardized API response
 */
export function createApiResponse<T>(
  data?: T,
  error?: string,
  status: number = 200
): NextResponse {
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json({ data, success: true }, { status });
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: any, defaultMessage: string = 'Internal server error'): NextResponse {
  console.error('API Error:', error);
  
  // If it's a known error with a message, use that
  if (error?.message) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }

  // Otherwise use default message
  return NextResponse.json(
    { error: defaultMessage },
    { status: 500 }
  );
}

/**
 * Set secure cookie for admin token
 */
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/'
  });
}

/**
 * Clear auth cookie
 */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set('admin_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/'
  });
}
