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
