import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG, isSupabaseConfigured } from '@/config/appConfig';
import { Database } from '@/types/database';

let supabaseInstance: SupabaseClient<Database> | null = null;

const isServer = typeof window === 'undefined';

const memoryStorage = {
  getItem: (_key: string) => Promise.resolve(null),
  setItem: (_key: string, _value: string) => Promise.resolve(),
  removeItem: (_key: string) => Promise.resolve(),
};

if (isSupabaseConfigured()) {
  try {
    supabaseInstance = createClient<Database>(
      APP_CONFIG.supabaseUrl,
      APP_CONFIG.supabaseAnonKey,
      {
        auth: {
          storage: isServer ? memoryStorage : AsyncStorage,
          autoRefreshToken: !isServer,
          persistSession: !isServer,
          detectSessionInUrl: false,
        },
      }
    );
  } catch (error) {
    console.warn('[SupabaseClient] Initialization failed. Falling back to local data.', error);
    supabaseInstance = null;
  }
}

export const supabase = supabaseInstance;

export function isSupabaseReady(): boolean {
  return supabaseInstance !== null;
}

export function getSupabase(): SupabaseClient<Database> | null {
  return supabaseInstance;
}
