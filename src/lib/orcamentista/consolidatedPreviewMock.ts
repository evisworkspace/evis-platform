import {
  OrcamentistaAgentDispatchJob,
  OrcamentistaConsolidatedPreview,
  OrcamentistaConsolidatedPreviewExclusion,
  OrcamentistaConsolidatedPreviewHitl,
  OrcamentistaConsolidatedPreviewPremise,
  OrcamentistaConsolidatedPreviewRisk,
  OrcamentistaConsolidatedPreviewService,
  OrcamentistaDomainAgentOutput,
  OrcamentistaPreviewConsolidationBlocker,
} from '../../types';
import { mockAgentDispatchJobs } from './agentDispatchMock';
import {
  calculateTraceabilityScore,
  canConsolidatePreview,
  summarizeConsolidatedPreview,
} from './consolidatedPreviewUtils';

type DispatchJobWithOutput = OrcamentistaAgentDispatchJob & {
  output: OrcamentistaDomainAgentOutput;
};

function hasOutput(job: OrcamentistaAgentDispatchJob): job is DispatchJobWithOutput {
  return !!job.output;
}

const completedAgentJobs = mockAgentDispatchJobs.filter(hasOutput);

function jobByAgent(agentId: string) {
  const job = completedAgentJobs.find((item) => item.agent_id === agentId);
  if (!job) {
    throw new Error(`Mock de preview consolidado requer output existente para ${agentId}.`);
  }
  return job;
}

function evidenceRefsFor(job: ReturnType<typeof jobByAgent>, serviceId: string) {
  return [
    ...job.output.findings.map((finding) => finding.id),
    serviceId,
  ];
}

const civilJob = jobByAgent('civil_arquitetonico');
const eletricaJob = jobByAgent('eletrica_dados_automacao');
const acabamentosJob = jobByAgent('acabamentos');

const services: OrcamentistaConsolidatedPreviewService[] = [
  {
    id: 'preview-service-civil-piso-001',
    category: 'Civil',
    discipline: civilJob.discipline,
    description: civilJob.output.suggested_services[0]?.description ?? 'Serviço civil sugerido',
    unit: civilJob.output.suggested_services[0]?.unit ?? 'm2',
    estimated_quantity: 45,
    quantity_confidence: 0.72,
    estimated_unit_cost: 120,
    estimated_total: 5400,
    cost_confidence: 0.78,
    source_agent_ids: [civilJob.output.agent_id],
    source_page_refs: civilJob.source_page_ids,
    source_evidence_refs: evidenceRefsFor(civilJob, civilJob.output.suggested_services[0]?.id ?? 'svc-civil-piso-001'),
    identification_type: 'identified',
    requires_hitl: true,
    blocks_consolidation: true,
  },
  {
    id: 'preview-service-eletrica-tomadas-001',
    category: 'Elétrica',
    discipline: eletricaJob.discipline,
    description: eletricaJob.output.suggested_services[0]?.description ?? 'Serviço elétrico sugerido',
    unit: eletricaJob.output.suggested_services[0]?.unit ?? 'ponto',
    estimated_quantity: 18,
    quantity_confidence: 0.78,
    estimated_unit_cost: 180,
    estimated_total: 3240,
    cost_confidence: 0.76,
    source_agent_ids: [eletricaJob.output.agent_id],
    source_page_refs: eletricaJob.source_page_ids,
    source_evidence_refs: evidenceRefsFor(
      eletricaJob,
      eletricaJob.output.suggested_services[0]?.id ?? 'svc-elec-tomadas-001'
    ),
    identification_type: 'identified',
    requires_hitl: eletricaJob.output.hitl_requests.length > 0,
    blocks_consolidation: eletricaJob.output.blocks_consolidation,
  },
  {
    id: 'preview-service-acabamentos-rodape-001',
    category: 'Acabamentos',
    discipline: acabamentosJob.discipline,
    description: acabamentosJob.output.suggested_services[0]?.description ?? 'Serviço de acabamento sugerido',
    unit: acabamentosJob.output.suggested_services[0]?.unit ?? 'm',
    estimated_quantity: 60,
    quantity_confidence: 0.61,
    estimated_unit_cost: 42,
    estimated_total: 2520,
    cost_confidence: 0.67,
    source_agent_ids: [acabamentosJob.output.agent_id],
    source_page_refs: acabamentosJob.source_page_ids,
    source_evidence_refs: evidenceRefsFor(
      acabamentosJob,
      acabamentosJob.output.suggested_services[0]?.id ?? 'svc-acab-rodape-001'
    ),
    identification_type: 'inferred',
    requires_hitl: true,
    blocks_consolidation: true,
  },
];

const risks: OrcamentistaConsolidatedPreviewRisk[] = [
  ...eletricaJob.output.risks.map((risk) => ({
    id: `preview-${risk.id}`,
    source_risk_id: risk.id,
    source_agent_id: eletricaJob.output.agent_id,
    description: risk.description,
    severity: risk.severity,
    impact: risk.impact,
    blocks_consolidation: risk.blocks_consolidation,
  })),
  ...acabamentosJob.output.risks.map((risk) => ({
    id: `preview-${risk.id}`,
    source_risk_id: risk.id,
    source_agent_id: acabamentosJob.output.agent_id,
    description: risk.description,
    severity: risk.severity,
    impact: risk.impact,
    blocks_consolidation: risk.blocks_consolidation,
  })),
];

const hitls: OrcamentistaConsolidatedPreviewHitl[] = [
  ...eletricaJob.output.hitl_requests.map((request) => ({
    id: `preview-${request.id}`,
    source_hitl_request_id: request.id,
    source_agent_id: eletricaJob.output.agent_id,
    title: request.title,
    reason: request.reason,
    severity: request.severity,
    source_references: request.source_references,
  })),
  {
    id: 'preview-hitl-acabamentos-rodape-001',
    source_hitl_request_id: 'svc-acab-rodape-001',
    source_agent_id: acabamentosJob.output.agent_id,
    title: 'Validar rodapé inferido',
    reason: 'Rodapé foi inferido pelo agente de acabamentos e não pode virar fato sem decisão humana.',
    severity: 'media',
    source_references: acabamentosJob.output.source_references,
  },
];

const premises: OrcamentistaConsolidatedPreviewPremise[] = [
  {
    id: 'preview-premise-civil-area-001',
    description: civilJob.output.missing_information[0] ?? 'Área de aplicação depende de validação futura.',
    source_agent_ids: [civilJob.output.agent_id],
  },
  {
    id: 'preview-premise-eletrica-rotas-001',
    description: eletricaJob.output.missing_information[0] ?? 'Rotas elétricas permanecem premissa técnica.',
    source_agent_ids: [eletricaJob.output.agent_id],
  },
];

const exclusions: OrcamentistaConsolidatedPreviewExclusion[] = [
  {
    id: 'preview-exclusion-official-write-001',
    description: 'Gravação em orcamento_itens e geração de proposta ficam fora da Fase 2H.',
    source_agent_ids: completedAgentJobs.map((job) => job.agent_id),
  },
];

const blockers: OrcamentistaPreviewConsolidationBlocker[] = [
  ...risks
    .filter((risk) => risk.blocks_consolidation)
    .map((risk) => ({
      id: `preview-blocker-${risk.id}`,
      reason: risk.description,
      severity: risk.severity,
      source_type: 'risk' as const,
      source_id: risk.id,
    })),
  ...hitls.map((hitl) => ({
    id: `preview-blocker-${hitl.id}`,
    reason: hitl.reason,
    severity: hitl.severity,
    source_type: 'hitl' as const,
    source_id: hitl.id,
  })),
  ...services
    .filter((service) => service.blocks_consolidation || service.requires_hitl)
    .map((service) => ({
      id: `preview-blocker-${service.id}`,
      reason: `${service.description} exige validação antes de qualquer consolidação.`,
      severity: service.identification_type === 'inferred' ? 'alta' as const : 'media' as const,
      source_type: 'agent_output' as const,
      source_id: service.id,
    })),
];

const basePreview: OrcamentistaConsolidatedPreview = {
  id: 'prev-mock-1001',
  opportunity_id: 'opp-123',
  orcamento_id: null,
  status: blockers.length > 0 ? 'blocked' : 'ready_for_validation',
  generated_from_agent_output_ids: completedAgentJobs.map((job) => job.output?.id).filter((id): id is string => !!id),
  confidence_score: 0.78,
  traceability_score: 0,
  can_consolidate: false,
  consolidation_blocked_reason: 'Preview mockado possui HITL, riscos e serviços que exigem validação humana.',
  generated_at: '2026-05-05T12:00:00.000Z',
  services,
  risks,
  hitls,
  premises,
  exclusions,
  blockers,
  summary: {
    total_services: 0,
    total_estimated_value: 0,
    average_confidence: 0,
    traceability_score: 0,
    total_risks: 0,
    total_hitls: 0,
    total_blockers: 0,
  },
};

export const MOCK_CONSOLIDATED_PREVIEW: OrcamentistaConsolidatedPreview = {
  ...basePreview,
  traceability_score: calculateTraceabilityScore(basePreview),
  can_consolidate: canConsolidatePreview(basePreview),
  summary: summarizeConsolidatedPreview(basePreview),
};
