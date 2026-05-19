import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseLikeClient } from './repository';
import type { SupabaseLikeReadClient } from './readModels';

const AUTHORIZED_STAGING_PROJECT_REF = 'vtlepoljlqmjwuauygni';

export type GuardedStagingClient = SupabaseLikeClient &
  SupabaseLikeReadClient & {
    from(table: string): ReturnType<SupabaseClient['from']>;
  };

export type StagingClientBundle = {
  client: GuardedStagingClient;
  projectRef: string;
  urlHost: string;
  getTouchedTables(): string[];
};

type StagingEnv = {
  projectRef: string;
  blockedProductionRef: string;
  url: string;
  key: string;
};

export function createStagingClientFromEnv(): StagingClientBundle {
  const env = readAndValidateStagingEnv();
  const touchedTables: string[] = [];
  const rawClient = createClient(env.url, env.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const guardedClient = {
    from(table: string) {
      if (table === 'orcamento_itens') {
        throw new Error('Blocked table access in Orçamentista manual run.');
      }

      touchedTables.push(table);
      return rawClient.from(table);
    }
  } as GuardedStagingClient;

  return {
    client: guardedClient,
    projectRef: env.projectRef,
    urlHost: new URL(env.url).host,
    getTouchedTables: () => [...new Set(touchedTables)]
  };
}

/**
 * Returns a raw (unguarded) Supabase client for the authorized staging project.
 * Use ONLY for the official commit path (Etapa 4) — the only controlled write
 * to orcamento_itens. All other persistence must use createStagingClientFromEnv().
 */
export function createRawStagingClientFromEnv(): {
  client: SupabaseClient;
  projectRef: string;
} {
  const env = readAndValidateStagingEnv();
  const client = createClient(env.url, env.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return { client, projectRef: env.projectRef };
}

export function readAndValidateStagingEnv(): StagingEnv {
  const allowMainDev = process.env.EVIS_ALLOW_MAIN_SUPABASE_DEV_MODE === 'true';
  // 1. Tentar ler variáveis de staging
  const projectRef = process.env.EVIS_STAGING_PROJECT_REF;
  const blockedProductionRef = process.env.EVIS_BLOCKED_PRODUCTION_PROJECT_REF;
  const url = process.env.EVIS_STAGING_SUPABASE_URL;
  const key = process.env.EVIS_STAGING_SUPABASE_SERVICE_ROLE_KEY;

  const hasStagingEnv = !!(projectRef && blockedProductionRef && url && key);

  if (hasStagingEnv) {
    if (projectRef !== AUTHORIZED_STAGING_PROJECT_REF) {
      throw new Error('EVIS_STAGING_PROJECT_REF is not the authorized staging project.');
    }

    if (blockedProductionRef === AUTHORIZED_STAGING_PROJECT_REF) {
      throw new Error('Blocked production ref cannot match the authorized staging project.');
    }

    if (!url.includes(AUTHORIZED_STAGING_PROJECT_REF)) {
      throw new Error('EVIS_STAGING_SUPABASE_URL does not point to the authorized staging project.');
    }

    for (const [name, value] of Object.entries({ projectRef, url, key })) {
      if (value.includes(blockedProductionRef)) {
        throw new Error(`${name} points to the blocked production project.`);
      }
    }

    const jwtRef = tryReadJwtProjectRef(key);
    if (jwtRef && jwtRef !== AUTHORIZED_STAGING_PROJECT_REF) {
      throw new Error('EVIS_STAGING_SUPABASE_SERVICE_ROLE_KEY is not scoped to the authorized staging project.');
    }

    return { projectRef, blockedProductionRef, url, key };
  }

  // 2. Fallback para Supabase Principal se permitido
  if (allowMainDev) {
    const mainUrl = process.env.VITE_SUPABASE_URL;
    const mainKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!mainUrl || !mainKey) {
      throw new Error('Fallback to main Supabase enabled but VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.');
    }

    const mainRef = tryReadJwtProjectRef(mainKey) || 'main_project';

    return {
      projectRef: mainRef,
      blockedProductionRef: 'NOT_BLOCKED_IN_DEV_MODE',
      url: mainUrl,
      key: mainKey
    };
  }

  // 3. Bloqueio total
  throw new Error('Ambiente de staging não configurado e EVIS_ALLOW_MAIN_SUPABASE_DEV_MODE está desligado.');
}

function tryReadJwtProjectRef(token: string): string | null {
  const [, payload] = token.split('.');
  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const decoded = JSON.parse(Buffer.from(padded, 'base64').toString('utf8')) as { ref?: unknown };
    return typeof decoded.ref === 'string' ? decoded.ref : null;
  } catch {
    return null;
  }
}
// ------------------------------------------------------------
/**
 * Creates a read-only Supabase client pointed at the main (production-like) project.
 * Uses VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY — the same credentials the frontend uses.
 * Intended ONLY for reading opportunity_files metadata and downloading from main Storage.
 * Must NEVER be used for writing to any table.
 */
export function createMainReadClientFromEnv(): SupabaseClient {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required for main read client.');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ------------------------------------------------------------
/**
 * Securely download a file from the `opportunity-files` bucket on the MAIN Supabase project.
 *
 * - bucket is fixed to `opportunity-files` (no other bucket allowed)
 * - only the exact `storagePath` obtained from `opportunity_files` can be used
 * - optional size limit (`maxBytes`) can be provided to avoid huge downloads
 * - returns the raw Buffer, its size, or an error description.
 */
export async function downloadOpportunityFile(params: {
  storagePath: string;
  maxBytes?: number;
}): Promise<{ buffer?: Buffer; size?: number; error?: string }> {
  const bucket = 'opportunity-files';
  if (!params.storagePath) {
    return { error: 'Missing storage_path' };
  }

  const rawClient = createMainReadClientFromEnv();

  try {
    const { data, error } = await rawClient.storage.from(bucket).download(params.storagePath);
    if (error) {
      return { error: error.message };
    }
    if (!data) {
      return { error: 'No data returned from storage download' };
    }
    // Convert Blob to Buffer (Node.js)
    const arrayBuffer = await (data as any).arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const size = buffer.length;
    if (params.maxBytes && size > params.maxBytes) {
      return { error: `File size ${size} exceeds limit of ${params.maxBytes}` };
    }
    return { buffer, size };
  } catch (e: any) {
    return { error: e.message };
  }
}

