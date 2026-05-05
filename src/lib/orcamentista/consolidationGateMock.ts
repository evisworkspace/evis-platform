import { OrcamentistaConsolidationGate } from '../../types';
import { MOCK_CONSOLIDATED_PREVIEW } from './consolidatedPreviewMock';
import {
  buildSimulatedBudgetItemPayload,
  canWriteConsolidationToBudget,
  getConsolidationApprovedItems,
  getConsolidationBlockedItems,
  getConsolidationPendingHitlItems,
  getConsolidationWriteBlockedReason,
  resolveConsolidationGateStatus,
  summarizeConsolidationGate,
  validatePreviewServiceForConsolidation,
} from './consolidationGateUtils';

const preview = MOCK_CONSOLIDATED_PREVIEW;

const approvedItems = getConsolidationApprovedItems(preview);
const blockedItems = getConsolidationBlockedItems(preview);
const pendingHitlItems = getConsolidationPendingHitlItems(preview);
const simulatedPayload = approvedItems.map(buildSimulatedBudgetItemPayload);
const validationIssues = preview.services.flatMap(validatePreviewServiceForConsolidation);

const gateWriteContext = {
  blocked_items: blockedItems,
  pending_hitl_items: pendingHitlItems,
  validation_issues: validationIssues,
  simulated_payload: simulatedPayload,
};

const canWriteToBudget = canWriteConsolidationToBudget(gateWriteContext);
const writeBlockedReason = getConsolidationWriteBlockedReason(gateWriteContext);

const baseGate = {
  id: 'gate-consolidation-mock-2i-001',
  preview_id: preview.id,
  opportunity_id: preview.opportunity_id,
  orcamento_id: preview.orcamento_id,
  status: resolveConsolidationGateStatus(gateWriteContext),
  approved_items: approvedItems,
  blocked_items: blockedItems,
  pending_hitl_items: pendingHitlItems,
  simulated_payload: simulatedPayload,
  validation_issues: validationIssues,
  can_write_to_budget: canWriteToBudget,
  write_blocked_reason: writeBlockedReason,
  generated_at: '2026-05-05T12:00:00.000Z',
};

export const MOCK_CONSOLIDATION_GATE: OrcamentistaConsolidationGate = {
  ...baseGate,
  summary: summarizeConsolidationGate({
    ...baseGate,
    can_write_to_budget: canWriteToBudget,
    write_blocked_reason: writeBlockedReason,
  }),
};
