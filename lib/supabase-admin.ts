import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase';

/**
 * Server-side only Supabase admin client
 * This should only be used in API routes and server-side code
 */
export function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required but not defined. Please check your environment variables.');
  }

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required but not defined. Please check your environment variables.');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Export a singleton instance for convenience
let adminClient: ReturnType<typeof createSupabaseAdmin> | null = null;

export function getSupabaseAdmin() {
  if (!adminClient) {
    adminClient = createSupabaseAdmin();
  }
  return adminClient;
}
