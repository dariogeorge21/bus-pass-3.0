import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: {
          id: number;
          admission_number: string;
          student_name: string;
          bus_route: string;
          destination: string;
          payment_status: boolean;
          created_at: string;
        };
        Insert: {
          admission_number: string;
          student_name: string;
          bus_route: string;
          destination: string;
          payment_status?: boolean;
          created_at?: string;
        };
        Update: {
          admission_number?: string;
          student_name?: string;
          bus_route?: string;
          destination?: string;
          payment_status?: boolean;
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