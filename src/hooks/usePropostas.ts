import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sbFetch } from '../lib/api';
import { Config, Proposta } from '../types';

export type CreatePropostaPayload = Pick<Proposta, 'titulo'> &
  Partial<Omit<Proposta, 'id' | 'titulo' | 'created_at' | 'updated_at'>>;

export type UpdatePropostaPayload = {
  id: string;
  patch: Partial<Omit<Proposta, 'id' | 'created_at'>>;
};

export const propostasKeys = {
  all: ['propostas'] as const,
  list: (opportunityId: string) => ['propostas', 'opportunity', opportunityId] as const,
  detail: (id: string) => ['propostas', 'detail', id] as const,
};

export function usePropostas(opportunityId: string, config: Config) {
  return useQuery<Proposta[]>({
    queryKey: propostasKeys.list(opportunityId),
    queryFn: async () => {
      const data = await sbFetch(
        `propostas?opportunity_id=eq.${opportunityId}&order=created_at.desc`,
        {},
        config
      );
      return data as Proposta[];
    },
    enabled: !!(config.url && config.key && opportunityId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useProposta(id: string, config: Config) {
  return useQuery<Proposta | null>({
    queryKey: propostasKeys.detail(id),
    queryFn: async () => {
      const data = await sbFetch(`propostas?id=eq.${id}&limit=1`, {}, config);
      const rows = Array.isArray(data) ? data : [];
      return (rows[0] ?? null) as Proposta | null;
    },
    enabled: !!(config.url && config.key && id),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateProposta(config: Config) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreatePropostaPayload) => {
      const data = await sbFetch(
        'propostas',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
        config
      );
      return (Array.isArray(data) ? data[0] : data) as Proposta;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: propostasKeys.all });
      if (data?.opportunity_id) {
        qc.invalidateQueries({ queryKey: propostasKeys.list(data.opportunity_id) });
      }
      if (data?.id) {
        qc.invalidateQueries({ queryKey: propostasKeys.detail(data.id) });
      }
    },
  });
}

export function useUpdateProposta(config: Config) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, patch }: UpdatePropostaPayload) => {
      const data = await sbFetch(
        `propostas?id=eq.${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
        },
        config
      );
      return (Array.isArray(data) ? data[0] : data) as Proposta;
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: propostasKeys.all });
      qc.invalidateQueries({ queryKey: propostasKeys.detail(variables.id) });
      if (data?.id) {
        qc.invalidateQueries({ queryKey: propostasKeys.detail(data.id) });
      }
      if (data?.opportunity_id) {
        qc.invalidateQueries({ queryKey: propostasKeys.list(data.opportunity_id) });
      }
    },
  });
}
