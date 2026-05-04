import { useQuery } from '@tanstack/react-query';
import { sbFetch } from '../lib/api';
import { Config, Orcamento, OrcamentoItem } from '../types';
import { useOportunidade } from './useOportunidades';
import { orcamentoKeys } from './useOrcamento';

export const oportunidadeOrcamentoKeys = {
  root: ['oportunidade_orcamento'] as const,
  orcamento: (orcamentoId: string) => ['oportunidade_orcamento', 'orcamento', orcamentoId] as const,
};

export type CreateOportunidadeOrcamentoPlaceholder = {
  status: 'not_implemented';
  canCreateOrcamento: true;
  opportunityId: string;
  message: string;
};

function normalizeError(error: unknown): Error | null {
  if (!error) return null;
  return error instanceof Error ? error : new Error(String(error));
}

export function useOportunidadeOrcamento(opportunityId: string, config: Config) {
  const oportunidade = useOportunidade(opportunityId, config);
  const orcamentoId = oportunidade.data?.orcamento_id ?? '';
  const opportunity = oportunidade.data ?? null;

  const orcamento = useQuery<Orcamento | null>({
    queryKey: oportunidadeOrcamentoKeys.orcamento(orcamentoId),
    queryFn: async () => {
      const data = await sbFetch(`orcamentos?id=eq.${orcamentoId}&limit=1`, {}, config);
      const rows = Array.isArray(data) ? data : [];
      return (rows[0] ?? null) as Orcamento | null;
    },
    enabled: !!(config.url && config.key && orcamentoId),
    staleTime: 1000 * 60 * 5,
  });

  const itens = useQuery<OrcamentoItem[]>({
    queryKey: orcamentoKeys.itens(orcamentoId),
    queryFn: async () => {
      const data = await sbFetch(
        `orcamento_itens?orcamento_id=eq.${orcamentoId}&order=created_at.asc&limit=500`,
        {},
        config
      );
      return data as OrcamentoItem[];
    },
    enabled: !!(config.url && config.key && orcamentoId),
    staleTime: 1000 * 60 * 5,
  });

  const createOrcamentoPlaceholder = (): CreateOportunidadeOrcamentoPlaceholder => ({
    status: 'not_implemented',
    canCreateOrcamento: true,
    opportunityId,
    message:
      'Criação de orçamento por oportunidade depende da próxima fase e não executa escrita automática.',
  });

  return {
    opportunity,
    orcamento: orcamento.data ?? null,
    itens: itens.data ?? [],
    orcamentoId: orcamentoId || null,
    hasOrcamento: Boolean(orcamentoId && orcamento.data),
    canCreateOrcamento: Boolean(opportunityId && !orcamentoId),
    isLoading: oportunidade.isLoading || orcamento.isLoading || itens.isLoading,
    isError: oportunidade.isError || orcamento.isError || itens.isError,
    error:
      normalizeError(oportunidade.error) ??
      normalizeError(orcamento.error) ??
      normalizeError(itens.error),
    createOrcamentoPlaceholder,
  };
}
