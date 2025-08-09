export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { authenticateAdmin, createSession, cleanExpiredSessions } from '@/lib/auth';
import { validateRequestBody, createApiResponse, handleApiError, setAuthCookie } from '@/lib/middleware';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = validateRequestBody<{ username: string; password: string }>(
      body,
      ['username', 'password']
    );

    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const { username, password } = body;

    // Clean expired sessions periodically
    await cleanExpiredSessions();

    // Authenticate user
    const user = await authenticateAdmin(username, password);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create session
    const sessionResult = await createSession(user);
    if (!sessionResult) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    // Create response with user data (excluding sensitive info)
    const response = createApiResponse({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      token: sessionResult.token
    });

    // Set secure cookie
    setAuthCookie(response, sessionResult.token);

    return response;
  } catch (error) {
    return handleApiError(error, 'Login failed');
  }
}