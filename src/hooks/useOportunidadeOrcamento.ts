import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { sbFetch } from '../lib/api';
import {
  Config,
  CreateManualBudgetItemInput,
  CreateOpportunityBudgetResult,
  ManualBudgetItemActionResult,
  Orcamento,
  OrcamentoItem,
  UpdateManualBudgetItemInput,
} from '../types';
import { oportunidadesKeys, useOportunidade } from './useOportunidades';
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

function guardSupabase(config: Config): ManualBudgetItemActionResult | null {
  if (!config.url || !config.key) {
    return {
      status: 'blocked',
      reason: 'supabase_not_configured',
      message: 'Supabase não configurado. Configure URL e Key nas Configurações.',
    };
  }
  return null;
}

function guardOrcamentoId(orcamentoId: string | null | undefined): ManualBudgetItemActionResult | null {
  if (!orcamentoId) {
    return {
      status: 'blocked',
      reason: 'no_orcamento',
      message: 'Não é possível operar sobre itens: nenhum orçamento vinculado à oportunidade. Crie o orçamento primeiro.',
    };
  }
  return null;
}

// ──────────────────────────────────────────────
// HOOK PRINCIPAL
// ──────────────────────────────────────────────
export function useOportunidadeOrcamento(opportunityId: string, config: Config) {
  const qc = useQueryClient();

  const oportunidade = useOportunidade(opportunityId, config);
  const orcamentoId = oportunidade.data?.orcamento_id ?? '';
  const opportunity = oportunidade.data ?? null;

  // Estado local para feedback da ação de criação de orçamento
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
      return (Array.isArray(data) ? data : []) as OrcamentoItem[];
    },
    enabled: !!(config.url && config.key && orcamentoId),
    staleTime: 1000 * 60 * 5,
  });

  // ──────────────────────────────────────────────
  // Ação 1: criar e vincular orçamento (Fase 1C)
  // ──────────────────────────────────────────────
  const criarOrcamentoParaOportunidade = useCallback(async (): Promise<CreateOpportunityBudgetResult> => {
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

      qc.invalidateQueries({ queryKey: oportunidadesKeys.detail(opportunityId) });
      qc.invalidateQueries({ queryKey: oportunidadesKeys.all });
      qc.invalidateQueries({ queryKey: oportunidadeOrcamentoKeys.orcamento(novoOrcamento.id) });

      const result: CreateOpportunityBudgetResult = {
        status: 'created',
        orcamento: novoOrcamento,
        message: `Orçamento "${novoOrcamento.nome}" criado e vinculado com sucesso.`,
      };
      setCreateResult(result);
      return result;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);

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

  // ──────────────────────────────────────────────
  // Ação 2: criar item manual (Fase 1D)
  //
  // Regras:
  //  - Bloqueia se não houver orcamento_id vinculado.
  //  - Não usa obra_id.
  //  - Calcula valor_total = quantidade * valor_unitario.
  //  - origem: 'manual' fixo.
  //  - Invalida a query de itens após sucesso.
  // ──────────────────────────────────────────────
  const criarItemManual = useCallback(
    async (payload: CreateManualBudgetItemInput): Promise<ManualBudgetItemActionResult> => {
      const sb = guardSupabase(config);
      if (sb) return sb;

      const currentId = orcamentoId || orcamento.data?.id || null;
      const guard = guardOrcamentoId(currentId);
      if (guard) return guard;

      try {
        const itemPayload = {
          orcamento_id: currentId!,
          descricao: payload.descricao,
          unidade: payload.unidade,
          quantidade: payload.quantidade,
          valor_unitario: payload.valor_unitario,
          valor_total: payload.quantidade * payload.valor_unitario,
          origem: 'manual' as const,
          ...(payload.codigo ? { codigo: payload.codigo } : {}),
          // obra_id: intencionalmente omitido
        };

        const raw = await sbFetch(
          'orcamento_itens',
          { method: 'POST', body: JSON.stringify(itemPayload) },
          config
        );
        const novoItem = (Array.isArray(raw) ? raw[0] : raw) as OrcamentoItem | null;

        if (!novoItem?.id) {
          return {
            status: 'error',
            error: 'Resposta inválida do servidor.',
            message: 'Falha ao criar item: Supabase não retornou o item criado.',
          };
        }

        qc.invalidateQueries({ queryKey: orcamentoKeys.itens(currentId!) });

        return {
          status: 'success',
          item: novoItem,
          message: `Item "${novoItem.descricao}" adicionado ao orçamento.`,
        };
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        return { status: 'error', error: errMsg, message: `Erro ao criar item: ${errMsg}` };
      }
    },
    [orcamentoId, orcamento.data, config, qc]
  );

  // ──────────────────────────────────────────────
  // Ação 3: atualizar item manual (Fase 1D)
  //
  // Recalcula valor_total se quantidade ou valor_unitario mudarem.
  // ──────────────────────────────────────────────
  const atualizarItemManual = useCallback(
    async (
      itemId: string,
      patch: UpdateManualBudgetItemInput
    ): Promise<ManualBudgetItemActionResult> => {
      const sb = guardSupabase(config);
      if (sb) return sb;

      const currentId = orcamentoId || orcamento.data?.id || null;
      const guard = guardOrcamentoId(currentId);
      if (guard) return guard;

      try {
        const patchComTotal: Record<string, unknown> = { ...patch };

        // Recalcular valor_total apenas se ambos os operandos estiverem no patch
        if (
          patch.quantidade !== undefined &&
          patch.valor_unitario !== undefined
        ) {
          patchComTotal.valor_total = patch.quantidade * patch.valor_unitario;
        }

        const raw = await sbFetch(
          `orcamento_itens?id=eq.${itemId}`,
          { method: 'PATCH', body: JSON.stringify(patchComTotal) },
          config
        );
        const itemAtualizado = (Array.isArray(raw) ? raw[0] : raw) as OrcamentoItem | null;

        qc.invalidateQueries({ queryKey: orcamentoKeys.itens(currentId!) });

        return {
          status: 'success',
          item: itemAtualizado ?? ({ id: itemId, orcamento_id: currentId! } as OrcamentoItem),
          message: 'Item atualizado com sucesso.',
        };
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        return { status: 'error', error: errMsg, message: `Erro ao atualizar item: ${errMsg}` };
      }
    },
    [orcamentoId, orcamento.data, config, qc]
  );

  // ──────────────────────────────────────────────
  // Ação 4: remover item manual (Fase 1D)
  // ──────────────────────────────────────────────
  const removerItemManual = useCallback(
    async (itemId: string): Promise<ManualBudgetItemActionResult> => {
      const sb = guardSupabase(config);
      if (sb) return sb;

      const currentId = orcamentoId || orcamento.data?.id || null;
      const guard = guardOrcamentoId(currentId);
      if (guard) return guard;

      try {
        await sbFetch(
          `orcamento_itens?id=eq.${itemId}`,
          { method: 'DELETE', prefer: 'return=minimal' },
          config
        );

        qc.invalidateQueries({ queryKey: orcamentoKeys.itens(currentId!) });

        return {
          status: 'removed',
          itemId,
          message: 'Item removido do orçamento.',
        };
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        return { status: 'error', error: errMsg, message: `Erro ao remover item: ${errMsg}` };
      }
    },
    [orcamentoId, orcamento.data, config, qc]
  );

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
    // Fase 1C
    criarOrcamentoParaOportunidade,
    // Fase 1D
    criarItemManual,
    atualizarItemManual,
    removerItemManual,
  };
}
