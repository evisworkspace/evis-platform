import { useQuery } from '@tanstack/react-query';

export type CommitBatch = {
  id: string;
  analysis_run_id: string;
  opportunity_id: string;
  orcamento_id: string;
  total_items_committed: number;
  total_items_skipped: number;
  committed_item_ids: string[];
  skip_reasons_json: Array<{ preview_item_id: string; reason: string }>;
  safety_flags_json: Record<string, unknown>;
  committed_by: string;
  created_at: string;
};

export type CommitBatchesResponse =
  | { success: true; schema_status: 'ready'; data: CommitBatch[] }
  | { success: true; schema_status: 'schema_not_ready'; missing_table: string; data: [] };

export const commitBatchKeys = {
  byRun: (runId: string | null) => ['orc_commit_batches', runId] as const,
};

export function useCommitBatches(runId: string | null) {
  return useQuery<CommitBatchesResponse>({
    queryKey: commitBatchKeys.byRun(runId),
    queryFn: async () => {
      const response = await fetch(
        `/api/orcamentista/analysis-runs/${encodeURIComponent(runId ?? '')}/commit-batches`,
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.erro || `HTTP ${response.status}`);
      }
      return payload as CommitBatchesResponse;
    },
    enabled: Boolean(runId),
    staleTime: 1000 * 30,
  });
}
