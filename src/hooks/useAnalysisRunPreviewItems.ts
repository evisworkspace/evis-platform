import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ──────────────────────────────────────────────
// useAnalysisRunPreviewItems — Etapa 3 (HITL real)
//
// Lista os orc_preview_items de um analysis_run para a UI de revisão humana.
// Defensivo: se schema 003 não estiver aplicado, retorna lista vazia com
// schema_status = 'schema_not_ready'.
// ──────────────────────────────────────────────

export type PreviewItemStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'edited'
  | 'request_review';

export type AnalysisRunPreviewItem = {
  id: string;
  analysis_run_id: string;
  opportunity_id: string;
  codigo: string | null;
  description: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  categoria: string | null;
  origem: string | null;
  confidence: number | null;
  status: PreviewItemStatus;
  source_evidence_ids: string[];
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type PreviewItemsSchemaStatus = 'ready' | 'schema_not_ready';

export type AnalysisRunPreviewItemsResponse = {
  success: true;
  schema_status: PreviewItemsSchemaStatus;
  missing_table?: string;
  data: AnalysisRunPreviewItem[];
};

export const previewItemsKeys = {
  byRun: (runId: string | null) => ['orcamentista_preview_items', runId] as const,
};

export function useAnalysisRunPreviewItems(runId: string | null) {
  return useQuery<AnalysisRunPreviewItemsResponse>({
    queryKey: previewItemsKeys.byRun(runId),
    queryFn: async () => {
      const response = await fetch(
        `/api/orcamentista/analysis-runs/${encodeURIComponent(runId ?? '')}/preview-items`,
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.erro || `HTTP ${response.status}`);
      }

      return payload as AnalysisRunPreviewItemsResponse;
    },
    enabled: Boolean(runId),
    staleTime: 1000 * 15,
  });
}

// ──────────────────────────────────────────────
// useDecidePreviewItem — Etapa 3
//
// Envia decisão humana sobre um preview_item.
// Aprovar item AINDA NÃO grava em orcamento_itens.
// O commit oficial é responsabilidade da Etapa 4.
// ──────────────────────────────────────────────

export type DecisionType = 'approve' | 'edit' | 'reject' | 'request_review';

export type DecideInput = {
  previewItemId: string;
  decision: DecisionType;
  editedPayload?: Record<string, unknown> | null;
  reason?: string | null;
  decidedBy?: string;
};

export type DecideResponse =
  | {
      success: true;
      status: 'success';
      data: {
        decision_id: string;
        preview_item_id: string;
        preview_item_status_after: 'approved' | 'edited' | 'rejected' | 'request_review';
        safety: {
          officialBudgetWrite: 'blocked';
          canWriteConsolidationToBudget: false;
          touchedBudgetItemsTable: false;
        };
      };
    }
  | {
      success: true;
      status: 'schema_not_ready';
      missing_table: string;
      message: string;
    };

export function useDecidePreviewItem(runId: string | null) {
  const queryClient = useQueryClient();

  return useMutation<DecideResponse, Error, DecideInput>({
    mutationFn: async (input) => {
      const response = await fetch(
        `/api/orcamentista/preview-items/${encodeURIComponent(input.previewItemId)}/decision`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decision: input.decision,
            edited_payload: input.editedPayload ?? null,
            reason: input.reason ?? null,
            decided_by: input.decidedBy ?? null,
          }),
        },
      );

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.erro || `HTTP ${response.status}`);
      }

      return payload as DecideResponse;
    },
    onSuccess: () => {
      if (runId) {
        queryClient.invalidateQueries({ queryKey: previewItemsKeys.byRun(runId) });
      }
    },
  });
}
