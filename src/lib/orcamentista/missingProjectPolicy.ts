import {
  OrcamentistaEstimateBasis,
  OrcamentistaFallbackDecisionType,
  OrcamentistaFallbackWarning,
  OrcamentistaMissingProjectDiscipline,
} from '../../types';

export type OrcamentistaMissingProjectDisciplinePolicy = {
  discipline: OrcamentistaMissingProjectDiscipline;
  label: string;
  required_project: boolean;
  fallback_allowed: boolean;
  default_fallback_modes: OrcamentistaFallbackDecisionType[];
  default_estimate_basis: OrcamentistaEstimateBasis[];
  requires_hitl_when_missing: boolean;
  blocks_execution_when_missing: boolean;
  blocks_final_consolidation_when_missing: boolean;
  warning_message: string;
  notes: string[];
};

const ESTIMATED_WITHOUT_PROJECT_WARNING =
  'Estimado sem projeto. Revisar após recebimento do projeto executivo.';

const INDIRECT_EVIDENCE_WARNING =
  'Estimado sem projeto específico, com base em evidências indiretas de outros documentos e referências técnicas. Revisar após recebimento do projeto executivo.';

function basis(
  type: OrcamentistaEstimateBasis['type'],
  label: string,
  description: string,
  sourceReference: string,
  indirectEvidence: string[] = []
): OrcamentistaEstimateBasis {
  return {
    type,
    label,
    description,
    source_reference: sourceReference,
    indirect_evidence: indirectEvidence,
    requires_user_validation: true,
  };
}

export const MISSING_PROJECT_DISCIPLINE_POLICIES: OrcamentistaMissingProjectDisciplinePolicy[] = [
  {
    discipline: 'arquitetonico',
    label: 'Arquitetônico',
    required_project: true,
    fallback_allowed: false,
    default_fallback_modes: ['request_project', 'keep_pending'],
    default_estimate_basis: [],
    requires_hitl_when_missing: true,
    blocks_execution_when_missing: true,
    blocks_final_consolidation_when_missing: true,
    warning_message:
      'Projeto arquitetônico ausente bloqueia leitura racional da obra. Solicitar prancha base antes de estimar escopo principal.',
    notes: [
      'Arquitetônico é documento base para áreas, ambientes e compatibilização mínima.',
      'Sem arquitetônico, estimativas de outras disciplinas perdem lastro operacional.',
    ],
  },
  {
    discipline: 'sondagem',
    label: 'Sondagem',
    required_project: true,
    fallback_allowed: true,
    default_fallback_modes: ['manual_allowance', 'request_project', 'keep_pending'],
    default_estimate_basis: [
      basis(
        'premissa_manual',
        'Verba técnica preliminar de fundação',
        'Reserva preliminar sem validação geotécnica; não dimensiona fundação.',
        'Premissa manual + histórico interno'
      ),
    ],
    requires_hitl_when_missing: true,
    blocks_execution_when_missing: true,
    blocks_final_consolidation_when_missing: true,
    warning_message:
      'Sondagem ausente não bloqueia orçamento preliminar, mas bloqueia validação de fundação e consolidação executiva.',
    notes: [
      'Não converter leitura de fundação em item executivo sem sondagem ou projeto validado.',
      'Qualquer verba deve ser marcada como estimativa e revisada por HITL.',
    ],
  },
  {
    discipline: 'estrutural',
    label: 'Estrutural',
    required_project: true,
    fallback_allowed: true,
    default_fallback_modes: ['manual_allowance', 'request_project', 'keep_pending'],
    default_estimate_basis: [
      basis(
        'cub',
        'Reserva estrutural por referência macro',
        'Estimativa preliminar por área e padrão construtivo, sem detalhamento de aço/concreto/formas.',
        'CUB/SINAPI + histórico interno'
      ),
    ],
    requires_hitl_when_missing: true,
    blocks_execution_when_missing: true,
    blocks_final_consolidation_when_missing: true,
    warning_message:
      'Projeto estrutural ausente bloqueia orçamento estrutural detalhado; apenas verba técnica preliminar é permitida.',
    notes: [
      'Aço, concreto e forma não podem ser identificados sem projeto estrutural ou memória validada.',
      'Fundação e estrutura são disciplinas críticas.',
    ],
  },
  {
    discipline: 'eletrico',
    label: 'Elétrico',
    required_project: true,
    fallback_allowed: true,
    default_fallback_modes: ['estimate_by_reference', 'request_project', 'manual_allowance', 'keep_pending', 'exclude_scope'],
    default_estimate_basis: [
      basis(
        'evidencia_indireta',
        'Evidências indiretas do arquitetônico/memorial',
        'Área construída, ambientes, áreas molhadas, áreas externas e equipamentos aparentes orientam estimativa preliminar.',
        'Arquitetônico/memorial/layout/interiores',
        [
          'área construída',
          'quantidade e tipo de ambientes',
          'banheiros, cozinha, lavanderia e área gourmet',
          'áreas externas',
          'forros, sancas ou luminotécnica indicados',
          'equipamentos especiais identificados',
        ]
      ),
      basis(
        'sinapi',
        'Composições SINAPI de instalações elétricas',
        'Referência técnica para pontos, eletrodutos, cabos e quadros em nível preliminar.',
        'SINAPI + premissas EVIS'
      ),
      basis(
        'cub',
        'CUB por padrão da obra',
        'Referência macro para validar ordem de grandeza.',
        'CUB regional + padrão de acabamento'
      ),
    ],
    requires_hitl_when_missing: true,
    blocks_execution_when_missing: true,
    blocks_final_consolidation_when_missing: true,
    warning_message: INDIRECT_EVIDENCE_WARNING,
    notes: [
      'Sem projeto elétrico, nunca usar IDENTIFIED_FROM_PROJECT.',
      'Itens estimados podem alimentar orçamento preliminar e proposta com aviso.',
    ],
  },
  {
    discipline: 'hidrossanitario',
    label: 'Hidrossanitário',
    required_project: true,
    fallback_allowed: true,
    default_fallback_modes: ['estimate_by_reference', 'request_project', 'manual_allowance', 'keep_pending', 'exclude_scope'],
    default_estimate_basis: [
      basis(
        'evidencia_indireta',
        'Ambientes molhados e memorial',
        'Banheiros, cozinha, lavanderia, área gourmet, pontos de água/esgoto prováveis e louças/metais descritos.',
        'Arquitetônico/memorial/layout',
        ['banheiros', 'cozinha', 'lavanderia', 'área gourmet', 'louças e metais', 'áreas molhadas']
      ),
      basis(
        'sinapi',
        'Composições SINAPI hidrossanitárias',
        'Referência de tubulações, conexões, caixas, louças e metais em nível preliminar.',
        'SINAPI + premissas EVIS'
      ),
    ],
    requires_hitl_when_missing: true,
    blocks_execution_when_missing: true,
    blocks_final_consolidation_when_missing: true,
    warning_message: INDIRECT_EVIDENCE_WARNING,
    notes: [
      'Pode estimar por ambientes e aparelhos, mas deve ser revisado quando o projeto executivo chegar.',
      'Não tratar pontos hidráulicos prováveis como identificados em projeto hidráulico.',
    ],
  },
  {
    discipline: 'ppci',
    label: 'PPCI',
    required_project: true,
    fallback_allowed: true,
    default_fallback_modes: ['manual_allowance', 'request_project', 'keep_pending', 'exclude_scope'],
    default_estimate_basis: [
      basis(
        'referencia_tecnica',
        'Verba preliminar de legalização e proteção',
        'Reserva de custo para itens típicos, sem substituir projeto aprovado ou exigências legais.',
        'Referência técnica + premissa manual'
      ),
    ],
    requires_hitl_when_missing: true,
    blocks_execution_when_missing: true,
    blocks_final_consolidation_when_missing: true,
    warning_message:
      'PPCI ausente exige alerta alto: verba preliminar pode ser estimada, mas consolidação executiva e legalização ficam bloqueadas.',
    notes: [
      'Escopo impacta segurança e legalização.',
      'Sem projeto/aprovação, qualquer valor é verba preliminar com ressalva.',
    ],
  },
  {
    discipline: 'hvac_climatizacao',
    label: 'HVAC/Climatização',
    required_project: false,
    fallback_allowed: true,
    default_fallback_modes: ['estimate_by_reference', 'manual_allowance', 'request_project', 'keep_pending', 'exclude_scope'],
    default_estimate_basis: [
      basis(
        'evidencia_indireta',
        'Ambientes climatizados prováveis',
        'Área, ambientes, insolação aparente, padrão da obra e equipamentos solicitados orientam verba preliminar.',
        'Arquitetônico/memorial/premissas do cliente',
        ['área dos ambientes', 'padrão da obra', 'equipamentos especiais', 'premissas do cliente']
      ),
      basis(
        'historico_interno',
        'Histórico interno por m²/ambiente',
        'Estimativa por obras similares e padrão de equipamento.',
        'Histórico EVIS'
      ),
    ],
    requires_hitl_when_missing: true,
    blocks_execution_when_missing: true,
    blocks_final_consolidation_when_missing: true,
    warning_message: INDIRECT_EVIDENCE_WARNING,
    notes: [
      'Fallback é permitido quando o escopo de climatização é conhecido ou solicitado.',
      'Sem projeto, não dimensionar carga térmica definitiva.',
    ],
  },
  {
    discipline: 'acabamentos_memorial',
    label: 'Acabamentos/Memorial',
    required_project: true,
    fallback_allowed: true,
    default_fallback_modes: ['estimate_by_reference', 'manual_allowance', 'request_project', 'keep_pending'],
    default_estimate_basis: [
      basis(
        'premissa_manual',
        'Padrão de acabamento assumido',
        'Premissas por padrão baixo/médio/alto e áreas arquitetônicas disponíveis.',
        'Premissa do usuário + CUB/SINAPI'
      ),
      basis(
        'cub',
        'CUB por padrão da obra',
        'Baliza macro para validar ordem de grandeza de acabamento.',
        'CUB regional'
      ),
    ],
    requires_hitl_when_missing: true,
    blocks_execution_when_missing: true,
    blocks_final_consolidation_when_missing: true,
    warning_message:
      'Memorial de acabamentos ausente permite premissas de padrão, mas não identifica especificações reais de materiais.',
    notes: [
      'Itens por padrão de acabamento devem aparecer como premissa manual ou estimativa sem projeto.',
      'Proposta futura precisa exibir ressalva clara.',
    ],
  },
];

export function getMissingProjectPolicyForDiscipline(
  discipline: OrcamentistaMissingProjectDiscipline
): OrcamentistaMissingProjectDisciplinePolicy {
  const policy = MISSING_PROJECT_DISCIPLINE_POLICIES.find((item) => item.discipline === discipline);
  if (!policy) {
    throw new Error(`Missing project policy not found for discipline: ${discipline}`);
  }
  return policy;
}

export function canProceedWithoutProject(discipline: OrcamentistaMissingProjectDiscipline) {
  return getMissingProjectPolicyForDiscipline(discipline).fallback_allowed;
}

export function shouldBlockFinalConsolidationWithoutProject(
  discipline: OrcamentistaMissingProjectDiscipline
) {
  return getMissingProjectPolicyForDiscipline(discipline).blocks_final_consolidation_when_missing;
}

export function shouldRequireHitlForMissingProject(discipline: OrcamentistaMissingProjectDiscipline) {
  return getMissingProjectPolicyForDiscipline(discipline).requires_hitl_when_missing;
}

export function getFallbackModesForDiscipline(
  discipline: OrcamentistaMissingProjectDiscipline
): OrcamentistaFallbackDecisionType[] {
  return getMissingProjectPolicyForDiscipline(discipline).default_fallback_modes;
}

export function getWarningForEstimatedScope(
  discipline: OrcamentistaMissingProjectDiscipline
): OrcamentistaFallbackWarning {
  const policy = getMissingProjectPolicyForDiscipline(discipline);
  const severity =
    discipline === 'arquitetonico' || discipline === 'ppci' || discipline === 'sondagem' || discipline === 'estrutural'
      ? 'critical'
      : 'high';

  return {
    id: `missing-project-warning-${discipline}`,
    severity,
    message: policy.warning_message || ESTIMATED_WITHOUT_PROJECT_WARNING,
    blocks_execution: policy.blocks_execution_when_missing,
    blocks_final_consolidation: policy.blocks_final_consolidation_when_missing,
  };
}
