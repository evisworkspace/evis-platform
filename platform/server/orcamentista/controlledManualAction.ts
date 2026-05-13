import type { PersistenceResult } from './persistence/contracts';
import { canWriteConsolidationToBudget } from './persistence/guards';
import { runOrcamentistaManualRun, type OrcamentistaManualRunInput } from './orcamentistaManualRun';
import type { OpportunityPipelineSummary } from './persistence/readModels';
import type { StagingClientBundle } from './persistence/stagingClient';

export type ControlledManualOrcamentistaActionInput = OrcamentistaManualRunInput & {
  confirmStagingWrite: boolean;
};

export type ControlledManualOrcamentistaActionSummary = {
  action: '4D.0_controlled_manual_orcamentista_action';
  mode: OrcamentistaManualRunInput['mode'];
  marker: string;
  projectRef: string;
  opportunityId: string;
  orcamentoId: string | null;
  opportunityFileId: string;
  readerRunId: string;
  verifierRunId: string;
  hitlIssueId: string;
  finalContextSnapshotId: string;
  pipelineSummary: OpportunityPipelineSummary;
  latestContextStatus: string | null;
  canWriteConsolidationToBudget: false;
  touchedTables: string[];
  touchedBudgetItemsTable: false;
};

export async function runControlledManualOrcamentistaAction(
  input: ControlledManualOrcamentistaActionInput,
  bundle?: StagingClientBundle
): Promise<PersistenceResult<ControlledManualOrcamentistaActionSummary>> {
  if (!input.confirmStagingWrite) {
    return {
      status: 'blocked',
      reason: 'STAGING_WRITE_NOT_CONFIRMED',
      message: 'Controlled manual action requires explicit staging write confirmation.'
    };
  }

  if (canWriteConsolidationToBudget !== false) {
    return {
      status: 'blocked',
      reason: 'CONSOLIDATION_FLAG_NOT_BLOCKED',
      message: 'Controlled manual action aborted because budget consolidation is not blocked.'
    };
  }

  const result = await runOrcamentistaManualRun(
    {
      mode: input.mode,
      opportunityId: input.opportunityId,
      orcamentoId: input.orcamentoId,
      opportunityFileId: input.opportunityFileId,
      marker: input.marker
    },
    bundle
  );

  if (result.status !== 'success') {
    return result;
  }

  const latestContextStatus = result.data.latestContextSnapshot?.context_status ?? null;
  if (latestContextStatus !== 'blocked' && latestContextStatus !== 'pending') {
    return {
      status: 'blocked',
      reason: 'UNSAFE_CONTEXT_STATUS',
      message: `Controlled manual action expected blocked or pending context, got ${latestContextStatus ?? 'null'}.`
    };
  }

  if (result.data.canWriteConsolidationToBudget !== false || result.data.touchedBudgetItemsTable) {
    return {
      status: 'blocked',
      reason: 'BUDGET_CONSOLIDATION_GUARD_FAILED',
      message: 'Controlled manual action violated a budget consolidation guard.'
    };
  }

  return {
    status: 'success',
    data: {
      action: '4D.0_controlled_manual_orcamentista_action',
      mode: result.data.mode,
      marker: result.data.marker,
      projectRef: result.data.projectRef,
      opportunityId: result.data.opportunityId,
      orcamentoId: result.data.orcamentoId,
      opportunityFileId: result.data.opportunityFileId,
      readerRunId: result.data.readerRunId,
      verifierRunId: result.data.verifierRunId,
      hitlIssueId: result.data.hitlIssueId,
      finalContextSnapshotId: result.data.finalContextSnapshotId,
      pipelineSummary: result.data.pipelineSummary,
      latestContextStatus,
      canWriteConsolidationToBudget: false,
      touchedTables: result.data.touchedTables,
      touchedBudgetItemsTable: false
    },
    message: 'Controlled manual Orçamentista action completed.'
  };
}
