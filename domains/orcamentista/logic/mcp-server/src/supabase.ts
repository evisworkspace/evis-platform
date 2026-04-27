import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../../.env'), override: false });

// Lazy init — env vars podem vir do Claude Desktop (injetadas via mcpServers.env)
// ou do .env carregado pelo dotenv antes desta importação
let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    '';

  if (!url || !key) {
    throw new Error(
      'Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY nas env vars.'
    );
  }

  _client = createClient(url, key);
  return _client;
}

// Alias para compatibilidade com imports existentes
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop];
  },
});
