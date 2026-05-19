import { useQuery, useQueryClient } from '@tanstack/react-query';
import { analyzeKeys, type AnalyzeData, type AnalyzeResponse } from './useAnalyzeOpportunity';

// ──────────────────────────────────────────────
// useOrcamentistaAnalyzeResult — Sprint Wire-up Noturno
//
// Selector compartilhado que lê o cache populado pela mutation
// `useAnalyzeOpportunity`. Não dispara fetch nem mutation.
// É a "planilha-base" que distribui slices da AnalyzeData para
// os múltiplos painéis-filtro do OrcamentistaTab.
//
// Princípio de design: Vobi-style — uma fonte de verdade,
// vários filtros visuais reorganizando a mesma planilha.
//
// Comportamento:
// - Antes do `analyze` rodar: data === undefined.
// - Após o `analyze` rodar com sucesso: data === AnalyzeResponse.
// - Reativo: qualquer painel se atualiza quando o cache muda.
// ──────────────────────────────────────────────

export function useOrcamentistaAnalyzeResult(opportunityId: string) {
  const qc = useQueryClient();

  const query = useQuery<AnalyzeResponse | null>({
    queryKey: analyzeKeys.result(opportunityId),
    queryFn: () => {
      // Não há fetcher real aqui — o dado é populado pela mutation.
      // Retornamos o que está no cache ou null se vazio.
      const cached = qc.getQueryData<AnalyzeResponse>(analyzeKeys.result(opportunityId));
      return cached ?? null;
    },
    enabled: Boolean(opportunityId),
    staleTime: Infinity,
    // Importante: não refetcha — só lê cache.
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const response: AnalyzeResponse | null = query.data ?? null;
  const data: AnalyzeData | null = response?.data ?? null;
  const status = response?.status ?? null;
  const hasData = data !== null;

  // Flags rápidas para UX dos painéis
  const isBackendAiConfigured = status !== null && status !== 'backend_ai_not_configured';
  const hasItems = (data?.items.length ?? 0) > 0;
  const hasEvidences = (data?.evidences.length ?? 0) > 0;
  const hasPendenciasHitl = (data?.pendencias_hitl.length ?? 0) > 0;
  const hasWarnings = (data?.warnings.length ?? 0) > 0;
  const hasSourceFiles = (data?.source_files.length ?? 0) > 0;

  return {
    response,
    data,
    status,
    hasData,
    isBackendAiConfigured,
    hasItems,
    hasEvidences,
    hasPendenciasHitl,
    hasWarnings,
    hasSourceFiles,
  };
}
