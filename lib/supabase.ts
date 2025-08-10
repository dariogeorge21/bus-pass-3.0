import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Public client for general operations (client-side)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations requiring elevated privileges
// Only create this on the server side where the service key is available
export const supabaseAdmin = (() => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey) {
    // Return a proxy that throws an error if used
    return new Proxy({} as any, {
      get() {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is required but not defined. Please check your environment variables.');
      }
    });
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
})();

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: number;
          username: string;
          password_hash: string;
          email: string;
          full_name: string;
          role: string;
          is_active: boolean;
          last_login: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          username: string;
          password_hash: string;
          email: string;
          full_name: string;
          role?: string;
          is_active?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          username?: string;
          password_hash?: string;
          email?: string;
          full_name?: string;
          role?: string;
          is_active?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      admin_sessions: {
        Row: {
          id: number;
          user_id: number;
          token_hash: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          user_id: number;
          token_hash: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          user_id?: number;
          token_hash?: string;
          expires_at?: string;
          created_at?: string;
        };
      };
      buses: {
        Row: {
          id: number;
          name: string;
          route_code: string;
          capacity: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          route_code: string;
          capacity?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          route_code?: string;
          capacity?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      route_stops: {
        Row: {
          id: number;
          route_code: string;
          stop_name: string;
          fare: number;
          stop_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          route_code: string;
          stop_name: string;
          fare: number;
          stop_order: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          route_code?: string;
          stop_name?: string;
          fare?: number;
          stop_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: number;
          admission_number: string;
          student_name: string;
          bus_route: string;
          destination: string;
          payment_status: boolean;
          razorpay_payment_id: string | null;
          razorpay_order_id: string | null;
          razorpay_signature: string | null;
          created_at: string;
        };
        Insert: {
          admission_number: string;
          student_name: string;
          bus_route: string;
          destination: string;
          payment_status?: boolean;
          razorpay_payment_id?: string | null;
          razorpay_order_id?: string | null;
          razorpay_signature?: string | null;
          created_at?: string;
        };
        Update: {
          admission_number?: string;
          student_name?: string;
          bus_route?: string;
          destination?: string;
          payment_status?: boolean;
          razorpay_payment_id?: string | null;
          razorpay_order_id?: string | null;
          razorpay_signature?: string | null;
          created_at?: string;
        };
      };
      admin_settings: {
        Row: {
          id: number;
          booking_enabled: boolean;
          go_date: string | null;
          return_date: string | null;
          updated_at: string;
        };
        Insert: {
          booking_enabled?: boolean;
          go_date?: string | null;
          return_date?: string | null;
          updated_at?: string;
        };
        Update: {
          booking_enabled?: boolean;
          go_date?: string | null;
          return_date?: string | null;
          updated_at?: string;
        };
      };
      bus_availability: {
        Row: {
          id: number;
          bus_route: string;
          available_seats: number;
          updated_at: string;
        };
        Insert: {
          bus_route: string;
          available_seats?: number;
          updated_at?: string;
        };
        Update: {
          bus_route?: string;
          available_seats?: number;
          updated_at?: string;
        };
      };
    };
  };
};