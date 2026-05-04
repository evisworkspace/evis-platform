import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { sbFetch } from '../lib/api';
import { Config, CreateOpportunityBudgetResult, Orcamento, OrcamentoItem } from '../types';
import { useOportunidade } from './useOportunidades';
import { oportunidadesKeys } from './useOportunidades';
import { orcamentoKeys } from './useOrcamento';

// ──────────────────────────────────────────────
// KEYS DE CACHE
// ──────────────────────────────────────────────
export const oportunidadeOrcamentoKeys = {
  root: ['oportunidade_orcamento'] as const,
  orcamento: (orcamentoId: string) =>
    ['oportunidade_orcamento', 'orcamento', orcamentoId] as const,
};

// ──────────────────────────────────────────────
// HELPER
// ──────────────────────────────────────────────
function normalizeError(error: unknown): Error | null {
  if (!error) return null;
  return error instanceof Error ? error : new Error(String(error));
}

// ──────────────────────────────────────────────
// HOOK PRINCIPAL
// ──────────────────────────────────────────────
export function useOportunidadeOrcamento(opportunityId: string, config: Config) {
  const qc = useQueryClient();

  const oportunidade = useOportunidade(opportunityId, config);
  const orcamentoId = oportunidade.data?.orcamento_id ?? '';
  const opportunity = oportunidade.data ?? null;

  // Estado local para feedback da ação de criação
  const [isCreating, setIsCreating] = useState(false);
  const [createResult, setCreateResult] = useState<CreateOpportunityBudgetResult | null>(null);

  // ── Leitura do orçamento vinculado ──────────
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

  // ── Leitura dos itens do orçamento ──────────
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

  // ── Ação explícita: criar e vincular orçamento ──
  //
  // Regras da Fase 1C:
  //  a) Se já existe orcamento_id, retorna 'already_linked' — sem criar outro.
  //  b) Se o campo obra_id for obrigatório no banco, a criação falhará com erro
  //     controlado (sem inventar obra_id falso).
  //  c) Se criar com sucesso, atualiza opportunities.orcamento_id via PATCH.
  //  d) Revalida as queries relevantes.
  //  e) Nunca cria automaticamente — só por chamada explícita.
  const criarOrcamentoParaOportunidade = useCallback(async (): Promise<CreateOpportunityBudgetResult> => {
    // Verificação de pré-condições
    if (!config.url || !config.key) {
      const result: CreateOpportunityBudgetResult = {
        status: 'blocked',
        reason: 'supabase_not_configured',
        message: 'Supabase não configurado. Configure URL e Key nas Configurações.',
      };
      setCreateResult(result);
      return result;
    }

    if (!opportunityId) {
      const result: CreateOpportunityBudgetResult = {
        status: 'blocked',
        reason: 'no_opportunity_id',
        message: 'ID da oportunidade não informado.',
      };
      setCreateResult(result);
      return result;
    }

    // a) Já existe orçamento vinculado — não criar outro
    const currentOrcamentoId = oportunidade.data?.orcamento_id;
    if (currentOrcamentoId) {
      const result: CreateOpportunityBudgetResult = {
        status: 'already_linked',
        orcamentoId: currentOrcamentoId,
        message: `Esta oportunidade já possui orçamento vinculado (id: ${currentOrcamentoId}).`,
      };
      setCreateResult(result);
      return result;
    }

    setIsCreating(true);
    setCreateResult(null);

    try {
      // b/c) Criar orçamento vazio sem obra_id (campo é opcional no schema do código)
      //      Se o banco exigir obra_id via constraint NOT NULL, o erro será capturado abaixo.
      const payload = {
        nome: `Orçamento — ${oportunidade.data?.titulo ?? opportunityId}`,
        status: 'rascunho' as const,
        bdi: 0,
        total_bruto: 0,
        total_final: 0,
        // obra_id: intencionalmente omitido — proibido usar obra_id = opp_<id>
      };

      const raw = await sbFetch(
        'orcamentos',
        { method: 'POST', body: JSON.stringify(payload) },
        config
      );
      const novoOrcamento = (Array.isArray(raw) ? raw[0] : raw) as Orcamento | null;

      if (!novoOrcamento?.id) {
        const result: CreateOpportunityBudgetResult = {
          status: 'error',
          error: 'Supabase não retornou o orçamento criado.',
          message: 'Falha ao criar orçamento: resposta inválida do servidor.',
        };
        setCreateResult(result);
        return result;
      }

      // d) Atualizar opportunities.orcamento_id com o orçamento recém-criado
      await sbFetch(
        `opportunities?id=eq.${opportunityId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            orcamento_id: novoOrcamento.id,
            updated_at: new Date().toISOString(),
          }),
        },
        config
      );

      // e) Revalidar cache
      qc.invalidateQueries({ queryKey: oportunidadesKeys.detail(opportunityId) });
      qc.invalidateQueries({ queryKey: oportunidadesKeys.all });
      qc.invalidateQueries({
        queryKey: oportunidadeOrcamentoKeys.orcamento(novoOrcamento.id),
      });

      const result: CreateOpportunityBudgetResult = {
        status: 'created',
        orcamento: novoOrcamento,
        message: `Orçamento "${novoOrcamento.nome}" criado e vinculado com sucesso.`,
      };
      setCreateResult(result);
      return result;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);

      // Detectar erro de constraint NOT NULL no banco (obra_id obrigatório no banco real)
      const isSchemaBlocked =
        errMsg.toLowerCase().includes('obra_id') ||
        errMsg.toLowerCase().includes('not-null') ||
        errMsg.toLowerCase().includes('null value') ||
        errMsg.toLowerCase().includes('violates not-null');

      if (isSchemaBlocked) {
        const result: CreateOpportunityBudgetResult = {
          status: 'blocked',
          reason: 'obra_id_required_in_db',
          message:
            'Criação bloqueada: o banco de dados exige obra_id em orcamentos. ' +
            'Uma migration será necessária para tornar obra_id opcional. ' +
            'Registrado como pendência no SCHEMA_GAP_REPORT.',
        };
        setCreateResult(result);
        return result;
      }

      const result: CreateOpportunityBudgetResult = {
        status: 'error',
        error: errMsg,
        message: `Erro ao criar orçamento: ${errMsg}`,
      };
      setCreateResult(result);
      return result;
    } finally {
      setIsCreating(false);
    }
  }, [opportunityId, config, oportunidade.data, qc]);

  return {
    opportunity,
    orcamento: orcamento.data ?? null,
    itens: itens.data ?? [],
    orcamentoId: orcamentoId || null,
    hasOrcamento: Boolean(orcamentoId && orcamento.data),
    canCreateOrcamento: Boolean(opportunityId && !orcamentoId),
    isLoading: oportunidade.isLoading || orcamento.isLoading || itens.isLoading,
    isCreating,
    isError: oportunidade.isError || orcamento.isError || itens.isError,
    error:
      normalizeError(oportunidade.error) ??
      normalizeError(orcamento.error) ??
      normalizeError(itens.error),
    createResult,
    criarOrcamentoParaOportunidade,
  };
}
