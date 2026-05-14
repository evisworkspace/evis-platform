import { useMutation, useQueryClient } from '@tanstack/react-query';

// ──────────────────────────────────────────────
// useAnalyzeOpportunity — Sprint 3 MVP
//
// Aciona POST /api/orcamentista/opportunities/:id/analyze.
// Não escreve em orcamento_itens. Não fabrica item.
// Resposta honesta: se IA não está conectada, retorna status
// 'backend_ai_not_configured' com items vazio e pendências explícitas.
// ──────────────────────────────────────────────

export type AnalyzeStatus =
  | 'ai_lab_disabled'
  | 'ai_items_generated'
  | 'review_required'
  | 'ai_analyzed'
  | 'validation_error'
  | 'persistence_error';

export type AnalyzeReadStatus =
  | 'file_content_unavailable'
  | 'file_too_large'
  | 'text_extracted'
  | 'text_empty'
  | 'pdf_parser_unavailable'
  | 'unsupported_file_type';

export type AnalyzeSourceFile = {
  id: string;
  nome: string | null;
  mime_type: string | null;
  storage_path_present?: boolean;
  download_status?:
    | 'missing_storage_path'
    | 'skipped_too_large'
    | 'download_failed'
    | 'downloaded';
  read_status?: AnalyzeReadStatus;
  downloaded_bytes?: number;
  extracted_chars?: number;
};

export type AnalyzeEvidence = {
  fileId: string;
  fileName: string | null;
  type: 'text_excerpt';
  content: string;
  page: null;
};

export type AnalyzePreviewItem = {
  codigo: string | null;
  descricao: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  categoria: string | null;
  origem: string | null;
  confianca: number | null;
  observacoes: string | null;
};

export type AnalyzeData = {
  opportunity_id: string;
  workspace_id: string;
  generated_at: string;
  preview_source: 'metadata_only' | 'file_access_only' | 'file_text_extracted' | 'ai_extracted';
  source_files: AnalyzeSourceFile[];
  evidences: AnalyzeEvidence[];
  items: AnalyzePreviewItem[];
  warnings: string[];
  pendencias_hitl: string[];
  safety: {
    officialBudgetWrite: 'blocked';
    canWriteConsolidationToBudget: false;
    touchedBudgetItemsTable: false;
  };
  snapshot: {
    id: string;
    context_status: 'blocked' | 'pending' | 'incomplete' | 'validated';
  };
};

export type AnalyzeResponse = {
  success: true;
  status: AnalyzeStatus;
  data: AnalyzeData;
};

export type AnalyzeInput = {
  fileIds: string[];
  workspaceId: string;
};

export const analyzeKeys = {
  result: (opportunityId: string) => ['orcamentista_analyze', opportunityId] as const,
};

export function useAnalyzeOpportunity(opportunityId: string) {
  const queryClient = useQueryClient();

  return useMutation<AnalyzeResponse, Error, AnalyzeInput>({
    mutationFn: async ({ fileIds, workspaceId }) => {
      const response = await fetch(
        `/api/orcamentista/opportunities/${encodeURIComponent(opportunityId)}/analyze`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileIds, workspaceId }),
        }
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        const message =
          payload?.erro ||
          payload?.message ||
          `Falha ao analisar arquivos (HTTP ${response.status}).`;
        throw new Error(message);
      }

      return payload as AnalyzeResponse;
    },
    onSuccess: (result) => {
      queryClient.setQueryData(analyzeKeys.result(opportunityId), result);
    },
  });
}
