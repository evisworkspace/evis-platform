import { useMutation, useQueryClient } from '@tanstack/react-query';
import { previewItemsKeys } from './useAnalysisRunPreviewItems';

export type CommitApprovedItemsInput = {
  runId: string;
  orcamentoId: string;
  opportunityId: string;
};

export type CommitApprovedItemsResponse =
  | {
      success: true;
      status: 'success';
      data: {
        batch_id: string;
        total_committed: number;
        total_skipped: number;
        committed_item_ids: string[];
        skip_reasons: Array<{ preview_item_id: string; reason: string }>;
        safety: { officialBudgetWrite: string; flag: string };
      };
    }
  | { success: true; status: 'official_commit_disabled'; message: string }
  | { success: true; status: 'no_approved_items'; message: string }
  | {
      success: true;
      status: 'schema_not_ready';
      missing_table: string;
      message: string;
    };

export function useCommitApprovedItems() {
  const queryClient = useQueryClient();

  return useMutation<CommitApprovedItemsResponse, Error, CommitApprovedItemsInput>({
    mutationFn: async (input) => {
      const response = await fetch(
        `/api/orcamentista/analysis-runs/${encodeURIComponent(input.runId)}/commit-approved-items`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orcamento_id: input.orcamentoId,
            opportunity_id: input.opportunityId,
          }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.erro || `HTTP ${response.status}`);
      }
      return payload as CommitApprovedItemsResponse;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: previewItemsKeys.byRun(variables.runId) });
    },
  });
}
