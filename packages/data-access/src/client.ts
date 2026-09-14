import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Untyped client pinned to the recoveryos schema; generated DB types land with
// the typed-client work in Phase 3.
type RecoveryOSClient = SupabaseClient<any, any, 'recoveryos'>;

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

let client: RecoveryOSClient | null = null;

/**
 * Create (once) and return the shared Supabase client.
 * Apps call configureSupabase at bootstrap with their env values; all
 * repositories then share the singleton.
 */
export function configureSupabase(config: SupabaseConfig): RecoveryOSClient {
  if (!client) {
    client = createClient(config.url, config.anonKey, {
      // The canonical model lives in its own schema on the shared live
      // project, alongside the legacy schemas (docs/migration/README.md).
      db: { schema: 'recoveryos' },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}

export function getSupabase(): RecoveryOSClient {
  if (!client) {
    throw new Error('Supabase client not configured. Call configureSupabase() at app bootstrap.');
  }
  return client;
}
