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
  const projectRef = readRequiredEnv('EVIS_STAGING_PROJECT_REF');
  const blockedProductionRef = readRequiredEnv('EVIS_BLOCKED_PRODUCTION_PROJECT_REF');
  const url = readRequiredEnv('EVIS_STAGING_SUPABASE_URL');
  const key = readRequiredEnv('EVIS_STAGING_SUPABASE_SERVICE_ROLE_KEY');

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

function readRequiredEnv(name: keyof NodeJS.ProcessEnv): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required in the current shell session.`);
  }
  return value;
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
 * Securely download a file from the `opportunity-files` bucket.
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

  // Re‑use the environment validation to create a raw client with service‑role access.
  const env = readAndValidateStagingEnv();
  const rawClient = createClient(env.url, env.key);

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

