import {
  OrcamentistaConsolidationPayloadItem,
  OrcamentistaPayloadReviewItem,
  OrcamentistaPayloadReviewSession,
} from '../../types';
import { MOCK_CONSOLIDATION_GATE } from './consolidationGateMock';
import { createPayloadReviewSession } from './payloadReviewUtils';

const gate = MOCK_CONSOLIDATION_GATE;
const basePayload = gate.simulated_payload[0];

function clonePayload(
  suffix: string,
  patch: Partial<OrcamentistaConsolidationPayloadItem>
): OrcamentistaConsolidationPayloadItem {
  const source = basePayload ?? {
    id: 'simulated-orcamento-item-empty-review-seed',
    preview_service_id: 'preview-service-empty-review-seed',
    descricao: 'Item simulado indisponivel no Gate',
    categoria: 'Mock',
    unidade: 'un',
    quantidade: 1,
    valor_unitario: 0,
    valor_total: 0,
    origem: 'consolidated_preview_mock' as const,
    source_agent_ids: [],
    source_page_refs: [],
    source_evidence_refs: [],
    confidence_score: 0,
    traceability_score: 0,
    requires_hitl: true,
    blocks_consolidation: true,
    simulated_only: true as const,
  };

  const payload = {
    ...source,
    ...patch,
    id: `${source.id}-${suffix}`,
    preview_service_id: `${source.preview_service_id}-${suffix}`,
  };

  return {
    ...payload,
    valor_total: payload.quantidade * payload.valor_unitario,
  };
}

function makeReviewItem(
  payload: OrcamentistaConsolidationPayloadItem,
  status: OrcamentistaPayloadReviewItem['status'],
  patch: Partial<OrcamentistaPayloadReviewItem> = {}
): OrcamentistaPayloadReviewItem {
  return {
    id: `payload-review-item-${payload.id}`,
    payload_item_id: payload.id,
    original_payload: payload,
    status,
    decision_type: patch.decision_type,
    decision_reason: patch.decision_reason,
    requires_traceability: true,
    has_required_traceability:
      payload.source_agent_ids.length > 0 &&
      payload.source_page_refs.length > 0 &&
      payload.source_evidence_refs.length > 0 &&
      payload.traceability_score >= 1,
    requires_hitl_resolution: payload.requires_hitl,
    blocks_write: status === 'blocked' || status === 'pending' || status === 'validation_requested',
    reviewed_by: patch.reviewed_by,
    reviewed_at: patch.reviewed_at,
    edited_payload: patch.edited_payload,
  };
}

const approvedPayload = clonePayload('review-approved', {
  descricao: basePayload?.descricao ?? 'Pintura acrilica interna em paredes existentes',
});

const rejectedPayload = clonePayload('review-rejected', {
  descricao: 'Rodape em area social sem escopo comercial confirmado',
  categoria: 'Acabamentos',
  unidade: 'm',
  quantidade: 60,
  valor_unitario: 42,
  confidence_score: 0.74,
});

const editablePayload = clonePayload('review-edited', {
  descricao: 'Pintura acrilica interna em paredes revisada',
  quantidade: 80,
  valor_unitario: 38,
});

const editedPayload = {
  ...editablePayload,
  descricao: 'Pintura acrilica interna em paredes e teto revisada localmente',
  quantidade: 92,
  valor_unitario: 39,
  valor_total: 92 * 39,
};

const pendingHitlSource = gate.pending_hitl_items[0];
const pendingHitlPayload = clonePayload('review-pending-hitl', {
  descricao: pendingHitlSource?.description ?? 'Item inferido com HITL pendente',
  categoria: 'HITL',
  unidade: 'un',
  quantidade: 1,
  valor_unitario: 0,
  requires_hitl: true,
  blocks_consolidation: false,
  confidence_score: 0.68,
  traceability_score: 1,
});

const blockedSource = gate.blocked_items[0];
const blockedPayload = clonePayload('review-blocked-traceability', {
  descricao: blockedSource?.description ?? 'Item sem rastreabilidade obrigatoria',
  categoria: 'Rastreabilidade',
  unidade: 'un',
  quantidade: 1,
  valor_unitario: 0,
  source_page_refs: [],
  source_evidence_refs: [],
  confidence_score: 0.72,
  traceability_score: 0.33,
  requires_hitl: false,
  blocks_consolidation: true,
});

const reviewItems: OrcamentistaPayloadReviewItem[] = [
  makeReviewItem(approvedPayload, 'approved', {
    decision_type: 'approve',
    decision_reason: 'Item identificado com rastreabilidade completa no payload simulado.',
    reviewed_by: 'orcamentista_reviewer_mock',
    reviewed_at: '2026-05-05T13:05:00.000Z',
  }),
  makeReviewItem(rejectedPayload, 'rejected', {
    decision_type: 'reject',
    decision_reason: 'Escopo rejeitado localmente para evitar entrada indevida no orcamento oficial.',
    reviewed_by: 'orcamentista_reviewer_mock',
    reviewed_at: '2026-05-05T13:06:00.000Z',
  }),
  makeReviewItem(editablePayload, 'edited', {
    decision_type: 'edit',
    decision_reason: 'Quantidade e descricao ajustadas apenas em estado local/mockado.',
    reviewed_by: 'orcamentista_reviewer_mock',
    reviewed_at: '2026-05-05T13:07:00.000Z',
    edited_payload: editedPayload,
  }),
  makeReviewItem(pendingHitlPayload, 'pending', {
    decision_type: 'keep_pending',
    decision_reason: pendingHitlSource?.reason ?? 'Item inferido exige validacao humana explicita.',
  }),
  makeReviewItem(blockedPayload, 'blocked', {
    decision_type: 'request_validation',
    decision_reason: blockedSource?.reason ?? 'Item bloqueado por ausencia de rastreabilidade obrigatoria.',
  }),
];

export const MOCK_PAYLOAD_REVIEW_SESSION: OrcamentistaPayloadReviewSession =
  createPayloadReviewSession(gate, reviewItems);
