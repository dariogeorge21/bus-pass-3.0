import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from './supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
}

export interface SessionData {
  userId: number;
  username: string;
  role: string;
  sessionId: number;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for session management
 */
export function generateToken(payload: SessionData): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): SessionData | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionData;
  } catch (error) {
    return null;
  }
}

/**
 * Authenticate admin user with username and password
 */
export async function authenticateAdmin(username: string, password: string): Promise<AdminUser | null> {
  try {
    // Get user from database
    const { data: user, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return null;
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return null;
    }

    // Update last login
    await supabaseAdmin
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Return user without password hash
    const { password_hash, ...adminUser } = user;
    return adminUser;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Create a new admin session
 */
export async function createSession(user: AdminUser): Promise<{ token: string; sessionId: number } | null> {
  try {
    // Generate token
    const sessionData: SessionData = {
      userId: user.id,
      username: user.username,
      role: user.role,
      sessionId: 0 // Will be updated after session creation
    };

    const token = generateToken(sessionData);
    const tokenHash = await hashPassword(token);
    const expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString();

    // Create session in database
    const { data: session, error } = await supabaseAdmin
      .from('admin_sessions')
      .insert({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt
      })
      .select('id')
      .single();

    if (error || !session) {
      return null;
    }

    // Update session data with actual session ID
    sessionData.sessionId = session.id;
    const finalToken = generateToken(sessionData);

    // Update session with new token hash
    await supabaseAdmin
      .from('admin_sessions')
      .update({ token_hash: await hashPassword(finalToken) })
      .eq('id', session.id);

    return { token: finalToken, sessionId: session.id };
  } catch (error) {
    console.error('Session creation error:', error);
    return null;
  }
}

/**
 * Validate an admin session
 */
export async function validateSession(token: string): Promise<AdminUser | null> {
  try {
    // Decode token
    const sessionData = verifyToken(token);
    if (!sessionData) {
      return null;
    }

    // Check session in database
    const { data: session, error } = await supabaseAdmin
      .from('admin_sessions')
      .select('*')
      .eq('id', sessionData.sessionId)
      .eq('user_id', sessionData.userId)
      .single();

    if (error || !session) {
      return null;
    }

    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      // Clean up expired session
      await supabaseAdmin
        .from('admin_sessions')
        .delete()
        .eq('id', session.id);
      return null;
    }

    // Verify token hash
    const isValidToken = await verifyPassword(token, session.token_hash);
    if (!isValidToken) {
      return null;
    }

    // Get user data
    const { data: user, error: userError } = await supabaseAdmin
      .from('admin_users')
      .select('id, username, email, full_name, role, is_active, last_login')
      .eq('id', session.user_id)
      .eq('is_active', true)
      .single();

    if (userError || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

/**
 * Destroy an admin session
 */
export async function destroySession(token: string): Promise<boolean> {
  try {
    const sessionData = verifyToken(token);
    if (!sessionData) {
      return false;
    }

    const { error } = await supabaseAdmin
      .from('admin_sessions')
      .delete()
      .eq('id', sessionData.sessionId)
      .eq('user_id', sessionData.userId);

    return !error;
  } catch (error) {
    console.error('Session destruction error:', error);
    return false;
  }
}

/**
 * Clean up expired sessions
 */
export async function cleanExpiredSessions(): Promise<void> {
  try {
    await supabaseAdmin.rpc('clean_expired_sessions');
  } catch (error) {
    console.error('Error cleaning expired sessions:', error);
  }
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: number): Promise<any[]> {
  try {
    const { data: sessions, error } = await supabaseAdmin
      .from('admin_sessions')
      .select('id, created_at, expires_at')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    return sessions || [];
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    return [];
  }
}
