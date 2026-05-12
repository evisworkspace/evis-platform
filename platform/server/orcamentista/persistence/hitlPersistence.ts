import type {
  CreateContextSnapshotInput,
  CreateHitlDecisionInput,
  CreateHitlIssueInput,
  PersistenceResult
} from './contracts';
import { assertNoConsolidationIntent } from './guards';
import type {
  OrcamentistaPersistenceRepository,
  PersistedRow
} from './repository';

export type HitlDecisionStageInput = Omit<CreateHitlDecisionInput, 'hitl_issue_id'> & {
  hitl_issue_id?: string;
};

export type ContextSnapshotStageInput = Omit<CreateContextSnapshotInput, 'hitl_issue_id'> & {
  hitl_issue_id?: string | null;
};

export type PersistHitlStageInput = {
  issue: CreateHitlIssueInput;
  decision?: HitlDecisionStageInput;
  contextSnapshot?: ContextSnapshotStageInput;
};

export type PersistHitlStageData = {
  issue: PersistedRow;
  decision?: PersistedRow;
  contextSnapshot?: PersistedRow;
  lineage: {
    hitl_issue_id: string;
    hitl_decision_id?: string;
    context_snapshot_id?: string;
  };
};

export async function persistContextSnapshot(
  repository: OrcamentistaPersistenceRepository,
  input: CreateContextSnapshotInput
): Promise<PersistenceResult<PersistedRow>> {
  const consolidationCheck = assertNoConsolidationIntent(input);
  if (consolidationCheck.status !== 'success') return consolidationCheck;

  return repository.createContextSnapshot(input);
}

export async function persistHitlStage(
  repository: OrcamentistaPersistenceRepository,
  input: PersistHitlStageInput
): Promise<PersistenceResult<PersistHitlStageData>> {
  const consolidationCheck = assertNoConsolidationIntent(input);
  if (consolidationCheck.status !== 'success') return consolidationCheck;

  const issueResult = await repository.createHitlIssue(input.issue);
  if (issueResult.status !== 'success') return issueResult;

  let decision: PersistedRow | undefined;
  if (input.decision) {
    const decisionResult = await repository.createHitlDecision({
      ...input.decision,
      hitl_issue_id: input.decision.hitl_issue_id ?? issueResult.data.id
    });
    if (decisionResult.status !== 'success') return decisionResult;
    decision = decisionResult.data;
  }

  let contextSnapshot: PersistedRow | undefined;
  if (input.contextSnapshot) {
    const snapshotResult = await persistContextSnapshot(repository, {
      ...input.contextSnapshot,
      hitl_issue_id: input.contextSnapshot.hitl_issue_id ?? issueResult.data.id
    });
    if (snapshotResult.status !== 'success') return snapshotResult;
    contextSnapshot = snapshotResult.data;
  }

  return {
    status: 'success',
    data: {
      issue: issueResult.data,
      decision,
      contextSnapshot,
      lineage: {
        hitl_issue_id: issueResult.data.id,
        hitl_decision_id: decision?.id,
        context_snapshot_id: contextSnapshot?.id
      }
    },
    message: 'HITL stage persisted.'
  };
}
