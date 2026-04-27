import { createClient } from '@supabase/supabase-js';

type AppSupabaseClient = ReturnType<typeof createSupabaseClient>;

let cachedClient: AppSupabaseClient | null = null;

function createSupabaseClient() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

function getSupabaseClient(): AppSupabaseClient {
  if (!cachedClient) {
    cachedClient = createSupabaseClient();
  }
  return cachedClient;
}

export const supabase = new Proxy({} as AppSupabaseClient, {
  get(_target, property, receiver) {
    const client = getSupabaseClient();
    return Reflect.get(client as object, property, receiver);
  },
});