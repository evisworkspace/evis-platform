import {
  OrcamentistaEstimatedScopeItem,
  OrcamentistaFallbackDecisionType,
  OrcamentistaMissingProjectDiscipline,
  OrcamentistaMissingProjectFallback,
  OrcamentistaScopeOriginType,
} from '../../types';
import { getMissingProjectPolicyForDiscipline, getWarningForEstimatedScope } from './missingProjectPolicy';

const MOCK_CREATED_AT = '2026-05-05T16:00:00.000Z';
const DEFAULT_WARNING =
  'Estimado sem projeto. Revisar após recebimento do projeto executivo.';
const INDIRECT_WARNING =
  'Estimado sem projeto específico, com base em evidências indiretas de outros documentos e referências técnicas. Revisar após recebimento do projeto executivo.';

function estimatedItem({
  id,
  discipline,
  description,
  unit,
  estimatedQuantity,
  estimatedUnitCost,
  originType,
  confidenceLevel,
  sourceReference,
  warningMessage,
}: {
  id: string;
  discipline: OrcamentistaMissingProjectDiscipline;
  description: string;
  unit: string;
  estimatedQuantity: number;
  estimatedUnitCost: number;
  originType: OrcamentistaScopeOriginType;
  confidenceLevel: OrcamentistaEstimatedScopeItem['confidence_level'];
  sourceReference: string;
  warningMessage: string;
}): OrcamentistaEstimatedScopeItem {
  const policy = getMissingProjectPolicyForDiscipline(discipline);

  return {
    id,
    discipline,
    description,
    unit,
    estimated_quantity: estimatedQuantity,
    estimated_unit_cost: estimatedUnitCost,
    estimated_total: Number((estimatedQuantity * estimatedUnitCost).toFixed(2)),
    origin_type: originType,
    estimate_basis: policy.default_estimate_basis,
    confidence_level: confidenceLevel,
    source_reference: sourceReference,
    warning_message: warningMessage,
    requires_hitl: true,
    can_feed_preliminary_budget: policy.fallback_allowed,
    can_feed_proposal_with_warning: policy.fallback_allowed,
    can_feed_execution: false,
    blocks_final_consolidation: true,
  };
}

function fallback({
  id,
  opportunityId,
  orcamentoId,
  discipline,
  projectAvailable,
  userDecision,
  estimatedItems,
}: {
  id: string;
  opportunityId: string;
  orcamentoId: string | null;
  discipline: OrcamentistaMissingProjectDiscipline;
  projectAvailable: boolean;
  userDecision: OrcamentistaFallbackDecisionType;
  estimatedItems: OrcamentistaEstimatedScopeItem[];
}): OrcamentistaMissingProjectFallback {
  const policy = getMissingProjectPolicyForDiscipline(discipline);
  const warning = getWarningForEstimatedScope(discipline);

  return {
    id,
    opportunity_id: opportunityId,
    orcamento_id: orcamentoId,
    discipline,
    required_project: policy.required_project,
    project_available: projectAvailable,
    fallback_allowed: projectAvailable ? false : policy.fallback_allowed,
    fallback_mode: policy.default_fallback_modes,
    estimate_basis: policy.default_estimate_basis,
    estimated_items: estimatedItems,
    warnings: projectAvailable ? [] : [warning],
    requires_hitl: !projectAvailable && policy.requires_hitl_when_missing,
    blocks_execution: !projectAvailable && policy.blocks_execution_when_missing,
    blocks_final_consolidation: !projectAvailable && policy.blocks_final_consolidation_when_missing,
    user_decision: userDecision,
    created_at: MOCK_CREATED_AT,
  };
}

export function buildMockEstimatedScopeFallbacks({
  opportunityId = 'mock-opportunity',
  orcamentoId = 'mock-orcamento',
}: {
  opportunityId?: string;
  orcamentoId?: string | null;
} = {}): OrcamentistaMissingProjectFallback[] {
  return [
    fallback({
      id: 'fallback-eletrico-ausente',
      opportunityId,
      orcamentoId,
      discipline: 'eletrico',
      projectAvailable: false,
      userDecision: 'estimate_by_reference',
      estimatedItems: [
        estimatedItem({
          id: 'est-eletrico-pontos',
          discipline: 'eletrico',
          description: 'Pontos elétricos preliminares por ambientes e padrão residencial médio',
          unit: 'ponto',
          estimatedQuantity: 82,
          estimatedUnitCost: 148,
          originType: 'INDIRECT_EVIDENCE_FROM_PROJECT_DOCUMENTS',
          confidenceLevel: 'media',
          sourceReference:
            'Arquitetônico A-01/A-02 + memorial: área construída, ambientes, banheiros, cozinha, lavanderia, área gourmet e forros',
          warningMessage: INDIRECT_WARNING,
        }),
        estimatedItem({
          id: 'est-eletrico-quadro-circuitos',
          discipline: 'eletrico',
          description: 'Verba preliminar para quadro, circuitos, eletrodutos e cabeamento',
          unit: 'vb',
          estimatedQuantity: 1,
          estimatedUnitCost: 18500,
          originType: 'ESTIMATED_WITHOUT_PROJECT',
          confidenceLevel: 'baixa',
          sourceReference: 'SINAPI + CUB + histórico interno EVIS',
          warningMessage: DEFAULT_WARNING,
        }),
      ],
    }),
    fallback({
      id: 'fallback-hidraulico-ausente',
      opportunityId,
      orcamentoId,
      discipline: 'hidrossanitario',
      projectAvailable: false,
      userDecision: 'estimate_by_reference',
      estimatedItems: [
        estimatedItem({
          id: 'est-hidraulico-pontos',
          discipline: 'hidrossanitario',
          description: 'Pontos hidrossanitários preliminares por banheiros, cozinha, lavanderia e área gourmet',
          unit: 'ponto',
          estimatedQuantity: 34,
          estimatedUnitCost: 420,
          originType: 'INDIRECT_EVIDENCE_FROM_PROJECT_DOCUMENTS',
          confidenceLevel: 'media',
          sourceReference: 'Arquitetônico + memorial MD-04/MD-05: áreas molhadas e louças/metais',
          warningMessage: INDIRECT_WARNING,
        }),
      ],
    }),
    fallback({
      id: 'fallback-sondagem-ausente',
      opportunityId,
      orcamentoId,
      discipline: 'sondagem',
      projectAvailable: false,
      userDecision: 'keep_pending',
      estimatedItems: [
        estimatedItem({
          id: 'est-fundacao-verba-pendente',
          discipline: 'sondagem',
          description: 'Verba preliminar pendente para fundação sem validação geotécnica',
          unit: 'vb',
          estimatedQuantity: 1,
          estimatedUnitCost: 32000,
          originType: 'MANUAL_ASSUMPTION',
          confidenceLevel: 'baixa',
          sourceReference: 'Premissa manual; sondagem ausente',
          warningMessage: 'Sondagem ausente. Fundação bloqueada para consolidação executiva.',
        }),
      ],
    }),
    fallback({
      id: 'fallback-estrutural-ausente',
      opportunityId,
      orcamentoId,
      discipline: 'estrutural',
      projectAvailable: false,
      userDecision: 'manual_allowance',
      estimatedItems: [
        estimatedItem({
          id: 'est-estrutural-verba',
          discipline: 'estrutural',
          description: 'Verba estrutural preliminar sem detalhamento de aço, concreto e formas',
          unit: 'vb',
          estimatedQuantity: 1,
          estimatedUnitCost: 68000,
          originType: 'ESTIMATED_WITHOUT_PROJECT',
          confidenceLevel: 'baixa',
          sourceReference: 'CUB/SINAPI + histórico interno; projeto estrutural ausente',
          warningMessage:
            'Projeto estrutural ausente. A verba não identifica aço, concreto, formas ou fundação executiva.',
        }),
      ],
    }),
    fallback({
      id: 'fallback-ppci-ausente',
      opportunityId,
      orcamentoId,
      discipline: 'ppci',
      projectAvailable: false,
      userDecision: 'manual_allowance',
      estimatedItems: [
        estimatedItem({
          id: 'est-ppci-verba',
          discipline: 'ppci',
          description: 'Verba preliminar de PPCI, sinalização e regularização',
          unit: 'vb',
          estimatedQuantity: 1,
          estimatedUnitCost: 12500,
          originType: 'ESTIMATED_WITHOUT_PROJECT',
          confidenceLevel: 'baixa',
          sourceReference: 'Referência técnica + premissa manual; projeto PPCI ausente',
          warningMessage:
            'PPCI ausente. Verba preliminar não substitui projeto aprovado nem valida legalização.',
        }),
      ],
    }),
    fallback({
      id: 'fallback-memorial-acabamentos-ausente',
      opportunityId,
      orcamentoId,
      discipline: 'acabamentos_memorial',
      projectAvailable: false,
      userDecision: 'manual_allowance',
      estimatedItems: [
        estimatedItem({
          id: 'est-acabamentos-padrao-medio',
          discipline: 'acabamentos_memorial',
          description: 'Premissas de acabamento padrão médio para pisos, revestimentos e pintura',
          unit: 'm2',
          estimatedQuantity: 185,
          estimatedUnitCost: 390,
          originType: 'MANUAL_ASSUMPTION',
          confidenceLevel: 'media',
          sourceReference: 'CUB/SINAPI + premissa do usuário: padrão médio',
          warningMessage:
            'Memorial ausente. Materiais e marcas são premissas, não especificações identificadas.',
        }),
      ],
    }),
    fallback({
      id: 'fallback-arquitetonico-ausente',
      opportunityId,
      orcamentoId,
      discipline: 'arquitetonico',
      projectAvailable: false,
      userDecision: 'request_project',
      estimatedItems: [],
    }),
    fallback({
      id: 'fallback-hvac-ausente',
      opportunityId,
      orcamentoId,
      discipline: 'hvac_climatizacao',
      projectAvailable: false,
      userDecision: 'estimate_by_reference',
      estimatedItems: [
        estimatedItem({
          id: 'est-hvac-verba',
          discipline: 'hvac_climatizacao',
          description: 'Verba preliminar para climatização de ambientes sociais e suítes',
          unit: 'vb',
          estimatedQuantity: 1,
          estimatedUnitCost: 28000,
          originType: 'INDIRECT_EVIDENCE_FROM_PROJECT_DOCUMENTS',
          confidenceLevel: 'baixa',
          sourceReference: 'Arquitetônico/layout + premissa do cliente: climatização em salas e suítes',
          warningMessage: INDIRECT_WARNING,
        }),
      ],
    }),
  ];
}

export const mockEstimatedScopeFallbacks = buildMockEstimatedScopeFallbacks();
