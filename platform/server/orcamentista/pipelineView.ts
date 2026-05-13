import type { PersistenceResult } from './persistence/contracts';
import { canWriteConsolidationToBudget } from './persistence/guards';
import {
  getLatestContextSnapshot,
  getOpportunityPipelineSummary,
  type OpportunityPipelineSummary
} from './persistence/readModels';
import {
  createStagingClientFromEnv,
  type StagingClientBundle
} from './persistence/stagingClient';

export type OrcamentistaPipelineViewInput = {
  opportunityId: string;
};

export type OrcamentistaPipelineView = {
  opportunityId: string;
  projectRef: string;
  total_files: number;
  total_reader_runs: number;
  total_verifier_runs: number;
  open_hitl_issues: number;
  latestContextStatus: OpportunityPipelineSummary['latest_context_status'];
  canWriteConsolidationToBudget: false;
  touchedBudgetItemsTable: false;
  touchedTables: string[];
};

export async function getOrcamentistaPipelineView(
  input: OrcamentistaPipelineViewInput,
  bundle: StagingClientBundle = createStagingClientFromEnv()
): Promise<PersistenceResult<OrcamentistaPipelineView>> {
  if (!input.opportunityId) {
    return {
      status: 'validation_error',
      errors: ['opportunity_id_missing'],
      message: 'opportunityId is required to read the Orçamentista pipeline view.'
    };
  }

  const summary = await getOpportunityPipelineSummary(bundle.client, input.opportunityId);
  if (summary.status !== 'success') return summary;

  const latestSnapshot = await getLatestContextSnapshot(bundle.client, input.opportunityId);
  if (latestSnapshot.status !== 'success') return latestSnapshot;

  const touchedTables = bundle.getTouchedTables();
  if (touchedTables.includes('orcamento_itens')) {
    return {
      status: 'blocked',
      reason: 'BUDGET_ITEMS_TABLE_TOUCHED',
      message: 'Pipeline view touched the official budget items table and was blocked.'
    };
  }

  return {
    status: 'success',
    data: {
      opportunityId: input.opportunityId,
      projectRef: bundle.projectRef,
      total_files: summary.data.total_files,
      total_reader_runs: summary.data.total_reader_runs,
      total_verifier_runs: summary.data.total_verifier_runs,
      open_hitl_issues: summary.data.open_hitl_issues,
      latestContextStatus: latestSnapshot.data?.context_status ?? summary.data.latest_context_status,
      canWriteConsolidationToBudget,
      touchedBudgetItemsTable: false,
      touchedTables
    },
    message: 'Orçamentista pipeline view generated.'
  };
}
