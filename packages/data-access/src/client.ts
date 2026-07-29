import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

let client: SupabaseClient | null = null;

/**
 * Create (once) and return the shared Supabase client.
 * Apps call configureSupabase at bootstrap with their env values; all
 * repositories then share the singleton.
 */
export function configureSupabase(config: SupabaseConfig): SupabaseClient {
  if (!client) {
    client = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}

export function getSupabase(): SupabaseClient {
  if (!client) {
    throw new Error(
      'Supabase client not configured. Call configureSupabase() at app bootstrap.',
    );
  }
  return client;
}
