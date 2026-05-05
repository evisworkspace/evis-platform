import {
  OrcamentistaConsolidationGate,
  OrcamentistaConsolidationPayloadItem,
  OrcamentistaPayloadReviewDecision,
  OrcamentistaPayloadReviewItem,
  OrcamentistaPayloadReviewItemStatus,
  OrcamentistaPayloadReviewSession,
  OrcamentistaPayloadReviewStatus,
  OrcamentistaPayloadReviewSummary,
} from '../../types';

const FUTURE_WRITE_BLOCKED_REASON =
  'Fase 2J e simulada: gravacao real em orcamento_itens exige autorizacao explicita em fase futura.';

function hasTraceability(payload: OrcamentistaConsolidationPayloadItem) {
  return (
    payload.source_agent_ids.length > 0 &&
    payload.source_page_refs.length > 0 &&
    payload.source_evidence_refs.length > 0 &&
    payload.traceability_score >= 1
  );
}

function recalculatePayloadTotal(payload: OrcamentistaConsolidationPayloadItem) {
  return {
    ...payload,
    valor_total: payload.quantidade * payload.valor_unitario,
  };
}

function resolveSessionStatus(summary: OrcamentistaPayloadReviewSummary): OrcamentistaPayloadReviewStatus {
  const reviewedCount = summary.approved_count + summary.edited_count + summary.rejected_count;

  if (summary.blocked_count > 0 || summary.validation_requested_count > 0) {
    return 'blocked';
  }

  if (reviewedCount === 0) {
    return 'not_started';
  }

  if (summary.pending_count > 0) {
    return 'partially_reviewed';
  }

  return 'ready_for_future_write';
}

export function getPayloadReviewBlockingReasons(item: OrcamentistaPayloadReviewItem) {
  const reasons: string[] = [];
  const payload = item.edited_payload ?? item.original_payload;

  if (item.requires_traceability && !item.has_required_traceability) {
    reasons.push('Rastreabilidade obrigatoria ausente.');
  }

  if (item.requires_hitl_resolution || payload.requires_hitl) {
    reasons.push('HITL pendente ou validacao humana ainda nao registrada.');
  }

  if (payload.blocks_consolidation) {
    reasons.push('Item possui bloqueio de consolidacao ativo.');
  }

  if (!payload.simulated_only) {
    reasons.push('Payload nao esta marcado como simulacao.');
  }

  if (payload.confidence_score < 0.7) {
    reasons.push('Confianca geral abaixo do minimo recomendado.');
  }

  return reasons;
}

export function canApprovePayloadItem(item: OrcamentistaPayloadReviewItem) {
  return getPayloadReviewBlockingReasons(item).length === 0 && item.status !== 'rejected';
}

export function canEditPayloadItem(item: OrcamentistaPayloadReviewItem) {
  return item.status !== 'rejected';
}

export function canRejectPayloadItem(item: OrcamentistaPayloadReviewItem) {
  return item.status !== 'rejected';
}

export function summarizePayloadReview(
  session: Pick<OrcamentistaPayloadReviewSession, 'items' | 'can_write_to_budget' | 'write_blocked_reason'>
): OrcamentistaPayloadReviewSummary {
  const totalOriginalValue = session.items.reduce((sum, item) => sum + item.original_payload.valor_total, 0);
  const totalReviewedValue = session.items.reduce((sum, item) => {
    if (item.status === 'rejected') return sum;
    return sum + (item.edited_payload ?? item.original_payload).valor_total;
  }, 0);

  return {
    total_items: session.items.length,
    approved_count: session.items.filter((item) => item.status === 'approved').length,
    edited_count: session.items.filter((item) => item.status === 'edited').length,
    rejected_count: session.items.filter((item) => item.status === 'rejected').length,
    pending_count: session.items.filter((item) => item.status === 'pending').length,
    blocked_count: session.items.filter((item) => item.status === 'blocked').length,
    validation_requested_count: session.items.filter((item) => item.status === 'validation_requested').length,
    total_original_value: totalOriginalValue,
    total_reviewed_value: totalReviewedValue,
    can_write_to_budget: false,
    write_blocked_reason: session.write_blocked_reason || FUTURE_WRITE_BLOCKED_REASON,
  };
}

export function createPayloadReviewSession(
  gate: OrcamentistaConsolidationGate,
  items?: OrcamentistaPayloadReviewItem[]
): OrcamentistaPayloadReviewSession {
  const reviewItems =
    items ??
    gate.simulated_payload.map((payload) => ({
      id: `payload-review-item-${payload.id}`,
      payload_item_id: payload.id,
      original_payload: payload,
      status: 'pending' as const,
      requires_traceability: true,
      has_required_traceability: hasTraceability(payload),
      requires_hitl_resolution: payload.requires_hitl,
      blocks_write: true,
    }));

  const baseSession: OrcamentistaPayloadReviewSession = {
    id: `payload-review-session-${gate.id}`,
    consolidation_gate_id: gate.id,
    opportunity_id: gate.opportunity_id,
    orcamento_id: gate.orcamento_id,
    status: 'in_review',
    items: reviewItems,
    summary: {
      total_items: 0,
      approved_count: 0,
      edited_count: 0,
      rejected_count: 0,
      pending_count: 0,
      blocked_count: 0,
      validation_requested_count: 0,
      total_original_value: 0,
      total_reviewed_value: 0,
      can_write_to_budget: false,
      write_blocked_reason: FUTURE_WRITE_BLOCKED_REASON,
    },
    can_write_to_budget: false,
    write_blocked_reason: FUTURE_WRITE_BLOCKED_REASON,
    created_at: '2026-05-05T13:00:00.000Z',
    updated_at: '2026-05-05T13:00:00.000Z',
  };

  const summary = summarizePayloadReview(baseSession);

  return {
    ...baseSession,
    status: resolveSessionStatus(summary),
    summary,
  };
}

export function applyPayloadReviewDecision(
  session: OrcamentistaPayloadReviewSession,
  decision: OrcamentistaPayloadReviewDecision
): OrcamentistaPayloadReviewSession {
  const items = session.items.map((item) => {
    if (item.id !== decision.item_id) return item;

    const currentPayload = item.edited_payload ?? item.original_payload;
    const baseUpdate = {
      decision_type: decision.decision_type,
      decision_reason: decision.reason,
      reviewed_by: 'orcamentista_reviewer_mock',
      reviewed_at: decision.decided_at,
    };

    if (decision.decision_type === 'approve') {
      if (!canApprovePayloadItem(item)) {
        return {
          ...item,
          ...baseUpdate,
          status: 'blocked' as OrcamentistaPayloadReviewItemStatus,
          blocks_write: true,
          decision_reason: getPayloadReviewBlockingReasons(item).join(' '),
        };
      }

      return {
        ...item,
        ...baseUpdate,
        status: 'approved' as OrcamentistaPayloadReviewItemStatus,
        blocks_write: false,
      };
    }

    if (decision.decision_type === 'reject') {
      return {
        ...item,
        ...baseUpdate,
        status: 'rejected' as OrcamentistaPayloadReviewItemStatus,
        blocks_write: false,
      };
    }

    if (decision.decision_type === 'edit') {
      if (!canEditPayloadItem(item)) {
        return {
          ...item,
          ...baseUpdate,
          status: 'blocked' as OrcamentistaPayloadReviewItemStatus,
          blocks_write: true,
        };
      }

      const editedPayload = recalculatePayloadTotal({
        ...currentPayload,
        ...decision.edit_patch,
      });
      const editedItem = {
        ...item,
        ...baseUpdate,
        edited_payload: editedPayload,
        has_required_traceability: hasTraceability(editedPayload),
        status: 'edited' as OrcamentistaPayloadReviewItemStatus,
      };

      return {
        ...editedItem,
        blocks_write: getPayloadReviewBlockingReasons(editedItem).length > 0,
      };
    }

    if (decision.decision_type === 'request_validation') {
      return {
        ...item,
        ...baseUpdate,
        status: 'validation_requested' as OrcamentistaPayloadReviewItemStatus,
        blocks_write: true,
      };
    }

    return {
      ...item,
      ...baseUpdate,
      status: 'pending' as OrcamentistaPayloadReviewItemStatus,
      blocks_write: true,
    };
  });

  const updatedSession = {
    ...session,
    items,
    updated_at: decision.decided_at,
    can_write_to_budget: false,
    write_blocked_reason: FUTURE_WRITE_BLOCKED_REASON,
  };
  const summary = summarizePayloadReview(updatedSession);

  return {
    ...updatedSession,
    status: resolveSessionStatus(summary),
    summary,
  };
}

export function getPayloadReviewStatusLabel(status: OrcamentistaPayloadReviewStatus) {
  switch (status) {
    case 'not_started':
      return 'Nao iniciada';
    case 'in_review':
      return 'Em revisao';
    case 'partially_reviewed':
      return 'Parcialmente revisada';
    case 'blocked':
      return 'Bloqueada';
    case 'ready_for_future_write':
      return 'Pronta para fase futura';
    default:
      return status;
  }
}

export function getPayloadReviewItemStatusLabel(status: OrcamentistaPayloadReviewItemStatus) {
  switch (status) {
    case 'pending':
      return 'Pendente';
    case 'approved':
      return 'Aprovado';
    case 'rejected':
      return 'Rejeitado';
    case 'edited':
      return 'Editado localmente';
    case 'blocked':
      return 'Bloqueado';
    case 'validation_requested':
      return 'Validacao solicitada';
    default:
      return status;
  }
}
