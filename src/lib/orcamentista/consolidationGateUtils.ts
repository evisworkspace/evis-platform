import {
  OrcamentistaConsolidatedPreview,
  OrcamentistaConsolidatedPreviewService,
  OrcamentistaConsolidationBlockedItem,
  OrcamentistaConsolidationCandidateItem,
  OrcamentistaConsolidationGate,
  OrcamentistaConsolidationGateStatus,
  OrcamentistaConsolidationGateSummary,
  OrcamentistaConsolidationPayloadItem,
  OrcamentistaConsolidationPendingHitlItem,
  OrcamentistaConsolidationValidationIssue,
  OrcamentistaHitlIssueSeverity,
} from '../../types';

const MIN_QUANTITY_CONFIDENCE = 0.7;
const MIN_COST_CONFIDENCE = 0.7;

const BLOCKED_ITEM_CODES: OrcamentistaConsolidationValidationIssue['code'][] = [
  'blocks_consolidation',
  'missing_source_agent_ids',
  'missing_source_page_refs',
  'missing_source_evidence_refs',
  'low_quantity_confidence',
  'low_cost_confidence',
];

const PENDING_HITL_CODES: OrcamentistaConsolidationValidationIssue['code'][] = [
  'requires_hitl',
  'inferred_without_validation',
  'manual_assumption_without_validation',
];

function issueId(serviceId: string, code: OrcamentistaConsolidationValidationIssue['code']) {
  return `gate-issue-${serviceId}-${code}`;
}

function calculateServiceTraceabilityScore(service: OrcamentistaConsolidatedPreviewService) {
  const traceabilityChecks = [
    service.source_agent_ids.length > 0,
    service.source_page_refs.length > 0,
    service.source_evidence_refs.length > 0,
  ];

  return traceabilityChecks.filter(Boolean).length / traceabilityChecks.length;
}

function averageConfidence(service: OrcamentistaConsolidatedPreviewService) {
  return (service.quantity_confidence + service.cost_confidence) / 2;
}

function makeIssue(
  service: OrcamentistaConsolidatedPreviewService,
  code: OrcamentistaConsolidationValidationIssue['code'],
  severity: OrcamentistaHitlIssueSeverity,
  field: string,
  message: string,
  requiredAction: string,
  blocksConsolidation: boolean
): OrcamentistaConsolidationValidationIssue {
  return {
    id: issueId(service.id, code),
    source_service_id: service.id,
    code,
    severity,
    field,
    message,
    blocks_payload: true,
    blocks_consolidation: blocksConsolidation,
    required_action: requiredAction,
  };
}

export function buildConsolidationCandidateItem(
  service: OrcamentistaConsolidatedPreviewService
): OrcamentistaConsolidationCandidateItem {
  return {
    id: `gate-candidate-${service.id}`,
    preview_service_id: service.id,
    description: service.description,
    category: service.category,
    discipline: service.discipline,
    unit: service.unit,
    quantity: service.estimated_quantity,
    unit_cost: service.estimated_unit_cost,
    total_cost: service.estimated_total,
    origin: 'consolidated_preview_mock',
    identification_type: service.identification_type,
    source_agent_ids: service.source_agent_ids,
    source_page_refs: service.source_page_refs,
    source_evidence_refs: service.source_evidence_refs,
    quantity_confidence: service.quantity_confidence,
    cost_confidence: service.cost_confidence,
    confidence_score: averageConfidence(service),
    traceability_score: calculateServiceTraceabilityScore(service),
    requires_hitl: service.requires_hitl,
    blocks_consolidation: service.blocks_consolidation,
  };
}

export function validatePreviewServiceForConsolidation(
  service: OrcamentistaConsolidatedPreviewService
): OrcamentistaConsolidationValidationIssue[] {
  const issues: OrcamentistaConsolidationValidationIssue[] = [];

  if (service.requires_hitl) {
    issues.push(
      makeIssue(
        service,
        'requires_hitl',
        service.blocks_consolidation ? 'critica' : 'alta',
        'requires_hitl',
        'Item exige revisao humana antes de virar payload aprovado.',
        'Resolver HITL do Orcamentista e registrar decisao humana explicita.',
        service.blocks_consolidation
      )
    );
  }

  if (service.blocks_consolidation) {
    issues.push(
      makeIssue(
        service,
        'blocks_consolidation',
        'critica',
        'blocks_consolidation',
        'Item possui bloqueio de consolidacao ativo no preview consolidado.',
        'Remover o bloqueio apenas por decisao humana futura e rastreavel.',
        true
      )
    );
  }

  if (service.source_agent_ids.length === 0) {
    issues.push(
      makeIssue(
        service,
        'missing_source_agent_ids',
        'alta',
        'source_agent_ids',
        'Item nao possui agente de origem.',
        'Vincular agente especialista responsavel ou manter item bloqueado.',
        true
      )
    );
  }

  if (service.source_page_refs.length === 0) {
    issues.push(
      makeIssue(
        service,
        'missing_source_page_refs',
        'alta',
        'source_page_refs',
        'Item nao possui referencia de pagina.',
        'Vincular pagina renderizada/processada antes de simular payload aprovado.',
        true
      )
    );
  }

  if (service.source_evidence_refs.length === 0) {
    issues.push(
      makeIssue(
        service,
        'missing_source_evidence_refs',
        'alta',
        'source_evidence_refs',
        'Item nao possui referencia de evidencia.',
        'Vincular evidencia do Reader, Verifier ou agente antes de qualquer gravacao futura.',
        true
      )
    );
  }

  if (service.quantity_confidence < MIN_QUANTITY_CONFIDENCE) {
    issues.push(
      makeIssue(
        service,
        'low_quantity_confidence',
        'media',
        'quantity_confidence',
        'Confianca de quantidade abaixo do minimo contratual.',
        'Revisar quantitativo, pedir nova evidencia ou manter como pendencia.',
        false
      )
    );
  }

  if (service.cost_confidence < MIN_COST_CONFIDENCE) {
    issues.push(
      makeIssue(
        service,
        'low_cost_confidence',
        'media',
        'cost_confidence',
        'Confianca de custo abaixo do minimo contratual.',
        'Revisar fonte de custo antes de aprovar payload simulado.',
        false
      )
    );
  }

  if (service.identification_type === 'inferred') {
    issues.push(
      makeIssue(
        service,
        'inferred_without_validation',
        'alta',
        'identification_type',
        'Item inferido nao pode virar fato sem validacao humana.',
        'Enviar para fila HITL e manter marcado como inferencia.',
        false
      )
    );
  }

  if (service.identification_type === 'manual_assumption') {
    issues.push(
      makeIssue(
        service,
        'manual_assumption_without_validation',
        'media',
        'identification_type',
        'Premissa manual exige revisao antes de qualquer payload aprovado.',
        'Registrar decisao humana e fonte da premissa antes da fase de gravacao.',
        false
      )
    );
  }

  return issues.map((issue) => ({
    ...issue,
    candidate_item_id: `gate-candidate-${service.id}`,
  }));
}

export function buildSimulatedBudgetItemPayload(
  item: OrcamentistaConsolidationCandidateItem
): OrcamentistaConsolidationPayloadItem {
  return {
    id: `simulated-orcamento-item-${item.preview_service_id}`,
    preview_service_id: item.preview_service_id,
    descricao: item.description,
    categoria: item.category,
    unidade: item.unit,
    quantidade: item.quantity,
    valor_unitario: item.unit_cost,
    valor_total: item.total_cost,
    origem: item.origin,
    codigo: item.codigo,
    source_agent_ids: item.source_agent_ids,
    source_page_refs: item.source_page_refs,
    source_evidence_refs: item.source_evidence_refs,
    confidence_score: item.confidence_score,
    traceability_score: item.traceability_score,
    requires_hitl: item.requires_hitl,
    blocks_consolidation: item.blocks_consolidation,
    simulated_only: true,
  };
}

function highestSeverity(issues: OrcamentistaConsolidationValidationIssue[]): OrcamentistaHitlIssueSeverity {
  if (issues.some((issue) => issue.severity === 'critica')) return 'critica';
  if (issues.some((issue) => issue.severity === 'alta')) return 'alta';
  if (issues.some((issue) => issue.severity === 'media')) return 'media';
  return 'baixa';
}

export function getConsolidationBlockedItems(
  preview: OrcamentistaConsolidatedPreview
): OrcamentistaConsolidationBlockedItem[] {
  return preview.services.flatMap((service) => {
    const issues = validatePreviewServiceForConsolidation(service).filter((issue) =>
      BLOCKED_ITEM_CODES.includes(issue.code)
    );

    if (issues.length === 0) return [];

    return [
      {
        id: `gate-blocked-${service.id}`,
        candidate_item_id: `gate-candidate-${service.id}`,
        preview_service_id: service.id,
        description: service.description,
        reason: issues.map((issue) => issue.message).join(' '),
        severity: highestSeverity(issues),
        missing_fields: issues
          .filter((issue) => issue.code.startsWith('missing_'))
          .map((issue) => issue.field),
        required_action: issues[0]?.required_action ?? 'Manter item bloqueado.',
        validation_issues: issues,
      },
    ];
  });
}

export function getConsolidationPendingHitlItems(
  preview: OrcamentistaConsolidatedPreview
): OrcamentistaConsolidationPendingHitlItem[] {
  return preview.services.flatMap((service) => {
    const issues = validatePreviewServiceForConsolidation(service).filter((issue) =>
      PENDING_HITL_CODES.includes(issue.code)
    );

    if (issues.length === 0) return [];

    return [
      {
        id: `gate-pending-hitl-${service.id}`,
        candidate_item_id: `gate-candidate-${service.id}`,
        preview_service_id: service.id,
        description: service.description,
        reason: issues.map((issue) => issue.message).join(' '),
        severity: highestSeverity(issues),
        required_human_action: issues[0]?.required_action ?? 'Revisar item em HITL.',
        validation_issues: issues,
      },
    ];
  });
}

export function getConsolidationApprovedItems(
  preview: OrcamentistaConsolidatedPreview
): OrcamentistaConsolidationCandidateItem[] {
  return preview.services
    .filter((service) => validatePreviewServiceForConsolidation(service).length === 0)
    .map(buildConsolidationCandidateItem);
}

export function canWriteConsolidationToBudget(
  gate: Pick<
    OrcamentistaConsolidationGate,
    'blocked_items' | 'pending_hitl_items' | 'validation_issues' | 'simulated_payload'
  >
) {
  void gate;
  return false;
}

export function getConsolidationWriteBlockedReason(
  gate: Pick<
    OrcamentistaConsolidationGate,
    'blocked_items' | 'pending_hitl_items' | 'validation_issues' | 'simulated_payload'
  >
) {
  if (gate.blocked_items.length > 0) {
    return 'Ha itens bloqueados por rastreabilidade, confianca ou bloqueio de consolidacao.';
  }

  if (gate.pending_hitl_items.length > 0) {
    return 'Ha itens pendentes de HITL; inferencias e ressalvas nao podem virar item oficial.';
  }

  if (gate.validation_issues.length > 0) {
    return 'Ha problemas de validacao que impedem gravacao oficial.';
  }

  if (gate.simulated_payload.length === 0) {
    return 'Nenhum payload simulado aprovado para revisao.';
  }

  return 'Fase 2I e apenas contratual: gravacao real em orcamento_itens sera fase futura.';
}

export function summarizeConsolidationGate(
  gate: Pick<
    OrcamentistaConsolidationGate,
    | 'approved_items'
    | 'blocked_items'
    | 'pending_hitl_items'
    | 'simulated_payload'
    | 'validation_issues'
    | 'can_write_to_budget'
    | 'write_blocked_reason'
  >
): OrcamentistaConsolidationGateSummary {
  const candidateIds = new Set([
    ...gate.approved_items.map((item) => item.id),
    ...gate.blocked_items.map((item) => item.candidate_item_id),
    ...gate.pending_hitl_items.map((item) => item.candidate_item_id),
  ]);

  return {
    total_candidates: candidateIds.size,
    approved_count: gate.approved_items.length,
    blocked_count: gate.blocked_items.length,
    pending_hitl_count: gate.pending_hitl_items.length,
    simulated_payload_count: gate.simulated_payload.length,
    total_simulated_value: gate.simulated_payload.reduce((sum, item) => sum + item.valor_total, 0),
    critical_issues: gate.validation_issues.filter((issue) => issue.severity === 'critica').length,
    can_write_to_budget: gate.can_write_to_budget,
    write_blocked_reason: gate.write_blocked_reason,
  };
}

export function getConsolidationGateStatusLabel(status: OrcamentistaConsolidationGateStatus) {
  switch (status) {
    case 'blocked':
      return 'Bloqueado';
    case 'pending_hitl':
      return 'Pendente de HITL';
    case 'payload_simulated':
      return 'Payload simulado';
    case 'ready_for_future_review':
      return 'Pronto para revisao futura';
    default:
      return status;
  }
}

export function getConsolidationIssueSeverityLabel(severity: OrcamentistaHitlIssueSeverity) {
  switch (severity) {
    case 'critica':
      return 'Crítica';
    case 'alta':
      return 'Alta';
    case 'media':
      return 'Média';
    default:
      return 'Baixa';
  }
}

export function resolveConsolidationGateStatus(
  gate: Pick<
    OrcamentistaConsolidationGate,
    'blocked_items' | 'pending_hitl_items' | 'simulated_payload' | 'validation_issues'
  >
): OrcamentistaConsolidationGateStatus {
  if (
    gate.blocked_items.length > 0 ||
    gate.validation_issues.some((issue) => issue.severity === 'critica' || issue.blocks_consolidation)
  ) {
    return 'blocked';
  }

  if (gate.pending_hitl_items.length > 0) {
    return 'pending_hitl';
  }

  if (gate.simulated_payload.length > 0) {
    return 'payload_simulated';
  }

  return 'ready_for_future_review';
}
