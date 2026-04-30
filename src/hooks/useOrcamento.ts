import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sbFetch } from '../lib/api';
import { Orcamento, OrcamentoItem, Config } from '../types';

// ──────────────────────────────────────────────
// KEYS DE CACHE
// ──────────────────────────────────────────────
export const orcamentoKeys = {
  all: (obraId: string) => ['orcamentos', obraId] as const,
  itens: (orcamentoId: string) => ['orcamento_itens', orcamentoId] as const,
};

// ──────────────────────────────────────────────
// HELPERS DE CÁLCULO
// ──────────────────────────────────────────────
export function calcularTotais(itens: OrcamentoItem[], bdi: number) {
  const total_bruto = itens.reduce((acc, item) => acc + item.valor_total, 0);
  const total_final = total_bruto * (1 + bdi / 100);
  return { total_bruto, total_final };
}

// ──────────────────────────────────────────────
// ORÇAMENTOS — LIST
// ──────────────────────────────────────────────
export function useOrcamentos(obraId: string, config: Config) {
  return useQuery<Orcamento[]>({
    queryKey: orcamentoKeys.all(obraId),
    queryFn: async () => {
      const data = await sbFetch(
        `orcamentos?obra_id=eq.${obraId}&order=created_at.desc&limit=100`,
        {},
        config
      );
      return data as Orcamento[];
    },
    enabled: !!(config.url && config.key && obraId),
    staleTime: 1000 * 60 * 5, // 5 min cache
  });
}

// ──────────────────────────────────────────────
// ITENS DE UM ORÇAMENTO — LIST
// ──────────────────────────────────────────────
export function useOrcamentoItens(orcamentoId: string, config: Config) {
  return useQuery<OrcamentoItem[]>({
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
}

// ──────────────────────────────────────────────
// CRIAR ORÇAMENTO
// ──────────────────────────────────────────────
export function useCreateOrcamento(config: Config) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Orcamento, 'id' | 'created_at' | 'updated_at'>) => {
      const data = await sbFetch('orcamentos', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, config);
      return Array.isArray(data) ? data[0] : data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: orcamentoKeys.all(vars.obra_id) });
    },
  });
}

// ──────────────────────────────────────────────
// ATUALIZAR ORÇAMENTO (header + totais)
// ──────────────────────────────────────────────
export function useUpdateOrcamento(config: Config) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Orcamento> }) => {
      const data = await sbFetch(`orcamentos?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
      }, config);
      return Array.isArray(data) ? data[0] : data;
    },
    onSuccess: (data) => {
      const obraId = (data as Orcamento)?.obra_id;
      if (obraId) qc.invalidateQueries({ queryKey: orcamentoKeys.all(obraId) });
    },
  });
}

// ──────────────────────────────────────────────
// DELETAR ORÇAMENTO
// ──────────────────────────────────────────────
export function useDeleteOrcamento(config: Config) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, obraId }: { id: string; obraId: string }) => {
      await sbFetch(`orcamentos?id=eq.${id}`, { method: 'DELETE', prefer: 'return=minimal' }, config);
      return { id, obraId };
    },
    onSuccess: (vars) => {
      qc.invalidateQueries({ queryKey: orcamentoKeys.all(vars.obraId) });
    },
  });
}

// ──────────────────────────────────────────────
// CRIAR ITEM
// ──────────────────────────────────────────────
export function useCreateItem(config: Config) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<OrcamentoItem, 'id' | 'created_at'>) => {
      const itemComTotal = {
        ...payload,
        valor_total: payload.quantidade * payload.valor_unitario,
      };
      const data = await sbFetch('orcamento_itens', {
        method: 'POST',
        body: JSON.stringify(itemComTotal),
      }, config);
      return Array.isArray(data) ? data[0] : data;
    },
    onSuccess: (data) => {
      const item = data as OrcamentoItem;
      qc.invalidateQueries({ queryKey: orcamentoKeys.itens(item.orcamento_id) });
    },
  });
}

// ──────────────────────────────────────────────
// ATUALIZAR ITEM
// ──────────────────────────────────────────────
export function useUpdateItem(config: Config) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch, orcamentoId }: { id: string; patch: Partial<OrcamentoItem>; orcamentoId: string }) => {
      const patchComTotal = { ...patch };
      if (
        patch.valor_total === undefined &&
        patch.quantidade !== undefined &&
        patch.valor_unitario !== undefined
      ) {
        // recalcula total quando o patch contem os dois operandos
        patchComTotal.valor_total = (patch.quantidade ?? 1) * (patch.valor_unitario ?? 0);
      }
      await sbFetch(`orcamento_itens?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patchComTotal),
      }, config);
      return { id, orcamentoId };
    },
    onSuccess: (vars) => {
      qc.invalidateQueries({ queryKey: orcamentoKeys.itens(vars.orcamentoId) });
    },
  });
}

// ──────────────────────────────────────────────
// DELETAR ITEM
// ──────────────────────────────────────────────
export function useDeleteItem(config: Config) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, orcamentoId }: { id: string; orcamentoId: string }) => {
      await sbFetch(`orcamento_itens?id=eq.${id}`, { method: 'DELETE', prefer: 'return=minimal' }, config);
      return { id, orcamentoId };
    },
    onSuccess: (vars) => {
      qc.invalidateQueries({ queryKey: orcamentoKeys.itens(vars.orcamentoId) });
    },
  });
}
