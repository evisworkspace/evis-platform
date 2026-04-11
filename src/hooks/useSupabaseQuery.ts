import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { sbFetch } from '../lib/api';
import { Config } from '../types';
import { logger } from '../services/logger';

/**
 * Hook wrapper around useQuery for Supabase API calls
 * Provides automatic TypeScript types and error handling with logging
 */
export function useSupabaseQuery<T = unknown>(
  key: string | string[],
  path: string,
  config: Config,
  options?: Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'>
) {
  const queryKey = Array.isArray(key) ? key : [key];

  return useQuery<T, Error>({
    queryKey,
    queryFn: async () => {
      try {
        if (!config.url || !config.key) {
          throw new Error('Configure Supabase nas Configurações.');
        }
        const result = await sbFetch(path, {}, config);
        logger.info(`Query successful: ${queryKey.join('/')}`, { path, resultCount: Array.isArray(result) ? result.length : 1 });
        return result;
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error(`Query failed: ${queryKey.join('/')}`, { path, error: msg });
        throw error instanceof Error ? error : new Error(msg);
      }
    },
    enabled: !!(config.url && config.key), // Only run query if config is available
    ...options,
  });
}
