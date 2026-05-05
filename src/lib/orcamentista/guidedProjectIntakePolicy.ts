import {
  OrcamentistaContextPropagationStatus,
  OrcamentistaExpectedDocument,
  OrcamentistaMissingProjectDiscipline,
  OrcamentistaNextDocumentRequest,
  OrcamentistaReadingPhase,
  OrcamentistaReceivedDocumentContext,
} from '../../types';
import { canProceedWithoutProject } from './missingProjectPolicy';

export const ORCAMENTISTA_READING_PHASE_ORDER: OrcamentistaReadingPhase[] = [
  'arquitetonico_implantacao',
  'sondagem_topografia',
  'estrutural_fundacao',
  'estrutural_superestrutura',
  'lajes_cobertura_caixa_dagua',
  'hidrossanitario',
  'eletrico_dados_automacao',
  'ppci_gas_climatizacao',
  'memorial_acabamentos',
  'compatibilizacao',
  'quantitativos',
  'custos',
];

const STATIC_POLICY_TIMESTAMP = '2026-05-05T17:00:00.000Z';

function expectedDocument({
  id,
  phase,
  label,
  description,
  required,
  acceptedDisciplines,
  acceptedFileHints,
  missingProjectDiscipline,
  unlocksPhases = [],
  blocksFinalQuantitiesIfMissing,
  canActivateMissingProjectFallback,
}: {
  id: string;
  phase: OrcamentistaReadingPhase;
  label: string;
  description: string;
  required: boolean;
  acceptedDisciplines: string[];
  acceptedFileHints: string[];
  missingProjectDiscipline?: OrcamentistaMissingProjectDiscipline;
  unlocksPhases?: OrcamentistaReadingPhase[];
  blocksFinalQuantitiesIfMissing: boolean;
  canActivateMissingProjectFallback: boolean;
}): OrcamentistaExpectedDocument {
  return {
    id,
    phase,
    label,
    description,
    required,
    accepted_disciplines: acceptedDisciplines,
    accepted_file_hints: acceptedFileHints,
    missing_project_discipline: missingProjectDiscipline,
    unlocks_phases: unlocksPhases,
    blocks_final_quantities_if_missing: blocksFinalQuantitiesIfMissing,
    can_activate_missing_project_fallback: canActivateMissingProjectFallback,
  };
}

export const ORCAMENTISTA_EXPECTED_DOCUMENTS_BY_PHASE: Record<
  OrcamentistaReadingPhase,
  OrcamentistaExpectedDocument[]
> = {
  arquitetonico_implantacao: [
    expectedDocument({
      id: 'expected-arquitetonico-base',
      phase: 'arquitetonico_implantacao',
      label: 'Arquitetônico / implantação',
      description: 'Projeto base para area, ambientes, implantação, acessos e leitura racional da obra.',
      required: true,
      acceptedDisciplines: ['ARQUITETURA', 'IMPLANTACAO', 'LAYOUT', 'INTERIORES'],
      acceptedFileHints: ['arquitetonico', 'arquitetônico', 'implantacao', 'implantação', 'layout'],
      missingProjectDiscipline: 'arquitetonico',
      unlocksPhases: ['sondagem_topografia', 'hidrossanitario', 'eletrico_dados_automacao'],
      blocksFinalQuantitiesIfMissing: true,
      canActivateMissingProjectFallback: false,
    }),
  ],
  sondagem_topografia: [
    expectedDocument({
      id: 'expected-sondagem',
      phase: 'sondagem_topografia',
      label: 'Sondagem / topografia',
      description: 'Sondagem e topografia para validar fundação, cotas e riscos de implantação.',
      required: true,
      acceptedDisciplines: ['SONDAGEM', 'TOPOGRAFIA', 'GEOTECNIA'],
      acceptedFileHints: ['sondagem', 'spt', 'topografia', 'levantamento'],
      missingProjectDiscipline: 'sondagem',
      unlocksPhases: ['estrutural_fundacao'],
      blocksFinalQuantitiesIfMissing: true,
      canActivateMissingProjectFallback: true,
    }),
  ],
  estrutural_fundacao: [
    expectedDocument({
      id: 'expected-estrutural-fundacao',
      phase: 'estrutural_fundacao',
      label: 'Estrutural - fundação',
      description: 'Projeto de fundação, blocos, sapatas, estacas, vigas baldrame e detalhes associados.',
      required: true,
      acceptedDisciplines: ['ESTRUTURAL', 'FUNDACAO', 'FUNDAÇÃO'],
      acceptedFileHints: ['fundacao', 'fundação', 'estaca', 'sapata', 'bloco', 'baldrame'],
      missingProjectDiscipline: 'estrutural',
      unlocksPhases: ['estrutural_superestrutura'],
      blocksFinalQuantitiesIfMissing: true,
      canActivateMissingProjectFallback: true,
    }),
  ],
  estrutural_superestrutura: [
    expectedDocument({
      id: 'expected-estrutural-superestrutura',
      phase: 'estrutural_superestrutura',
      label: 'Estrutural - superestrutura',
      description: 'Pilares, vigas, formas, armaduras, concreto e detalhes da superestrutura.',
      required: true,
      acceptedDisciplines: ['ESTRUTURAL'],
      acceptedFileHints: ['estrutura', 'pilar', 'viga', 'forma', 'armadura'],
      missingProjectDiscipline: 'estrutural',
      unlocksPhases: ['lajes_cobertura_caixa_dagua'],
      blocksFinalQuantitiesIfMissing: true,
      canActivateMissingProjectFallback: true,
    }),
  ],
  lajes_cobertura_caixa_dagua: [
    expectedDocument({
      id: 'expected-lajes-cobertura',
      phase: 'lajes_cobertura_caixa_dagua',
      label: 'Lajes / cobertura / caixa d’água',
      description: 'Lajes, cobertura, reservatórios, detalhes de impermeabilização e interfaces estruturais.',
      required: true,
      acceptedDisciplines: ['ESTRUTURAL', 'COBERTURA', 'IMPERMEABILIZACAO'],
      acceptedFileHints: ['laje', 'cobertura', 'telhado', 'caixa d agua', 'caixa d’água', 'impermeabilizacao'],
      missingProjectDiscipline: 'estrutural',
      unlocksPhases: ['hidrossanitario'],
      blocksFinalQuantitiesIfMissing: true,
      canActivateMissingProjectFallback: true,
    }),
  ],
  hidrossanitario: [
    expectedDocument({
      id: 'expected-hidrossanitario',
      phase: 'hidrossanitario',
      label: 'Hidrossanitário',
      description: 'Água fria/quente, esgoto, pluvial, caixas, louças/metais e pontos por ambiente.',
      required: true,
      acceptedDisciplines: ['HIDRAULICA', 'HIDROSSANITARIO', 'PLUVIAL'],
      acceptedFileHints: ['hidraulico', 'hidráulico', 'hidrossanitario', 'sanitario', 'esgoto', 'pluvial'],
      missingProjectDiscipline: 'hidrossanitario',
      unlocksPhases: ['eletrico_dados_automacao'],
      blocksFinalQuantitiesIfMissing: true,
      canActivateMissingProjectFallback: true,
    }),
  ],
  eletrico_dados_automacao: [
    expectedDocument({
      id: 'expected-eletrico-dados-automacao',
      phase: 'eletrico_dados_automacao',
      label: 'Elétrico / dados / automação',
      description: 'Pontos, circuitos, cargas, quadros, dados, automação, iluminação e equipamentos.',
      required: true,
      acceptedDisciplines: ['ELETRICA', 'DADOS', 'AUTOMACAO', 'LUMINOTECNICA'],
      acceptedFileHints: ['eletrico', 'elétrico', 'dados', 'automacao', 'automação', 'luminotecnica'],
      missingProjectDiscipline: 'eletrico',
      unlocksPhases: ['ppci_gas_climatizacao'],
      blocksFinalQuantitiesIfMissing: true,
      canActivateMissingProjectFallback: true,
    }),
  ],
  ppci_gas_climatizacao: [
    expectedDocument({
      id: 'expected-ppci-gas-climatizacao',
      phase: 'ppci_gas_climatizacao',
      label: 'PPCI / gás / climatização',
      description: 'Prevenção contra incêndio, gás, exaustão, ventilação e climatização.',
      required: false,
      acceptedDisciplines: ['PPCI', 'GAS', 'CLIMATIZACAO', 'HVAC', 'EXAUSTAO'],
      acceptedFileHints: ['ppci', 'incendio', 'incêndio', 'gas', 'gás', 'climatizacao', 'hvac', 'exaustao'],
      missingProjectDiscipline: 'ppci',
      unlocksPhases: ['memorial_acabamentos'],
      blocksFinalQuantitiesIfMissing: true,
      canActivateMissingProjectFallback: true,
    }),
  ],
  memorial_acabamentos: [
    expectedDocument({
      id: 'expected-memorial-acabamentos',
      phase: 'memorial_acabamentos',
      label: 'Memorial de acabamentos',
      description: 'Padrão, materiais, marcas, linhas, premissas e exclusões de acabamento.',
      required: true,
      acceptedDisciplines: ['MEMORIAL', 'ACABAMENTOS', 'ESPECIFICACAO'],
      acceptedFileHints: ['memorial', 'acabamento', 'especificacao', 'especificação'],
      missingProjectDiscipline: 'acabamentos_memorial',
      unlocksPhases: ['compatibilizacao'],
      blocksFinalQuantitiesIfMissing: true,
      canActivateMissingProjectFallback: true,
    }),
  ],
  compatibilizacao: [
    expectedDocument({
      id: 'expected-compatibilizacao',
      phase: 'compatibilizacao',
      label: 'Compatibilização',
      description: 'Cruzamento entre disciplinas, conflitos, omissões, pendências e premissas.',
      required: true,
      acceptedDisciplines: ['COMPATIBILIZACAO', 'TODAS'],
      acceptedFileHints: ['compatibilizacao', 'compatibilização', 'rfi', 'pendencias'],
      unlocksPhases: ['quantitativos'],
      blocksFinalQuantitiesIfMissing: true,
      canActivateMissingProjectFallback: false,
    }),
  ],
  quantitativos: [
    expectedDocument({
      id: 'expected-quantitativos',
      phase: 'quantitativos',
      label: 'Quantitativos',
      description: 'Memórias de cálculo, quadros, levantamentos e quantitativos por disciplina.',
      required: true,
      acceptedDisciplines: ['QUANTITATIVO', 'MEMORIA_CALCULO'],
      acceptedFileHints: ['quantitativo', 'memoria', 'memória', 'levantamento'],
      unlocksPhases: ['custos'],
      blocksFinalQuantitiesIfMissing: true,
      canActivateMissingProjectFallback: false,
    }),
  ],
  custos: [
    expectedDocument({
      id: 'expected-custos',
      phase: 'custos',
      label: 'Custos',
      description: 'Composições, referências SINAPI/CUB, cotações, BDI, margens e premissas comerciais.',
      required: true,
      acceptedDisciplines: ['CUSTOS', 'ORCAMENTO', 'SINAPI', 'CUB'],
      acceptedFileHints: ['custo', 'orcamento', 'orçamento', 'sinapi', 'cub', 'cotacao', 'cotação'],
      unlocksPhases: [],
      blocksFinalQuantitiesIfMissing: false,
      canActivateMissingProjectFallback: false,
    }),
  ],
};

function phaseIndex(phase: OrcamentistaReadingPhase) {
  return ORCAMENTISTA_READING_PHASE_ORDER.indexOf(phase);
}

function hasReceivedExpectedDocument(
  expectedDocumentItem: OrcamentistaExpectedDocument,
  receivedDocuments: OrcamentistaReceivedDocumentContext[]
) {
  return receivedDocuments.some(
    (document) =>
      document.detected_phase === expectedDocumentItem.phase &&
      document.allowed_to_read &&
      document.context_status !== 'blocked'
  );
}

export function getExpectedDocumentsForPhase(phase: OrcamentistaReadingPhase): OrcamentistaExpectedDocument[] {
  return ORCAMENTISTA_EXPECTED_DOCUMENTS_BY_PHASE[phase];
}

export function getNextReadingPhase({
  currentPhase,
  completedPhases = [],
}: {
  currentPhase: OrcamentistaReadingPhase;
  completedPhases?: OrcamentistaReadingPhase[];
}): OrcamentistaReadingPhase | null {
  const currentIndex = phaseIndex(currentPhase);
  const nextPhase = ORCAMENTISTA_READING_PHASE_ORDER
    .slice(currentIndex + 1)
    .find((phase) => !completedPhases.includes(phase));

  return nextPhase ?? null;
}

export function canAdvanceReadingPhase({
  currentPhase,
  receivedDocuments,
  validatedPhases = [],
  blockedPhases = [],
}: {
  currentPhase: OrcamentistaReadingPhase;
  receivedDocuments: OrcamentistaReceivedDocumentContext[];
  validatedPhases?: OrcamentistaReadingPhase[];
  blockedPhases?: OrcamentistaReadingPhase[];
}) {
  if (blockedPhases.includes(currentPhase)) return false;
  if (validatedPhases.includes(currentPhase)) return true;

  const requiredDocuments = getExpectedDocumentsForPhase(currentPhase).filter((document) => document.required);
  return requiredDocuments.every((document) => hasReceivedExpectedDocument(document, receivedDocuments));
}

export function shouldAllowOutOfOrderReading({
  currentPhase,
  receivedPhase,
}: {
  currentPhase: OrcamentistaReadingPhase;
  receivedPhase: OrcamentistaReadingPhase;
}) {
  return phaseIndex(receivedPhase) !== phaseIndex(currentPhase);
}

export function classifyReceivedDocumentForReadingPhase({
  documentId,
  fileName,
  detectedPhase,
  currentPhase,
  receivedOrder,
  createdAt = STATIC_POLICY_TIMESTAMP,
}: {
  documentId: string;
  fileName: string;
  detectedPhase: OrcamentistaReadingPhase;
  currentPhase: OrcamentistaReadingPhase;
  receivedOrder: number;
  createdAt?: string;
}): OrcamentistaReceivedDocumentContext {
  const detectedIndex = phaseIndex(detectedPhase);
  const currentIndex = phaseIndex(currentPhase);
  const missingPriorPhases = ORCAMENTISTA_READING_PHASE_ORDER
    .slice(0, detectedIndex)
    .filter((phase) => phaseIndex(phase) < currentIndex || phase !== currentPhase);
  const outOfOrder = shouldAllowOutOfOrderReading({ currentPhase, receivedPhase: detectedPhase });
  const contextStatus: OrcamentistaContextPropagationStatus = outOfOrder ? 'incomplete' : 'pending';

  return {
    id: `received-context-${documentId}`,
    document_id: documentId,
    file_name: fileName,
    detected_phase: detectedPhase,
    expected_phase: currentPhase,
    received_order: receivedOrder,
    allowed_to_read: true,
    out_of_order: outOfOrder,
    context_status: contextStatus,
    missing_prior_phases: outOfOrder ? missingPriorPhases : [],
    can_feed_final_quantities: !outOfOrder,
    can_activate_missing_project_fallback: getExpectedDocumentsForPhase(detectedPhase).some(
      (document) => document.can_activate_missing_project_fallback
    ),
    created_at: createdAt,
  };
}

export function getMissingDocumentsForCurrentPhase({
  currentPhase,
  receivedDocuments,
}: {
  currentPhase: OrcamentistaReadingPhase;
  receivedDocuments: OrcamentistaReceivedDocumentContext[];
}): OrcamentistaExpectedDocument[] {
  return getExpectedDocumentsForPhase(currentPhase).filter(
    (document) => document.required && !hasReceivedExpectedDocument(document, receivedDocuments)
  );
}

export function shouldActivateMissingProjectFallback({
  phase,
  receivedDocuments,
}: {
  phase: OrcamentistaReadingPhase;
  receivedDocuments: OrcamentistaReceivedDocumentContext[];
}) {
  const missingDocuments = getMissingDocumentsForCurrentPhase({ currentPhase: phase, receivedDocuments });

  return missingDocuments.some((document) => {
    if (!document.can_activate_missing_project_fallback || !document.missing_project_discipline) return false;
    return canProceedWithoutProject(document.missing_project_discipline);
  });
}

export function buildNextDocumentRequest({
  currentPhase,
  receivedDocuments,
  blockedPhases = [],
  createdAt = STATIC_POLICY_TIMESTAMP,
}: {
  currentPhase: OrcamentistaReadingPhase;
  receivedDocuments: OrcamentistaReceivedDocumentContext[];
  blockedPhases?: OrcamentistaReadingPhase[];
  createdAt?: string;
}): OrcamentistaNextDocumentRequest {
  const missingDocuments = getMissingDocumentsForCurrentPhase({ currentPhase, receivedDocuments });
  const fallbackAvailable = shouldActivateMissingProjectFallback({ phase: currentPhase, receivedDocuments });
  const nextPhase = missingDocuments.length
    ? currentPhase
    : getNextReadingPhase({ currentPhase, completedPhases: [] }) ?? currentPhase;
  const blocked = blockedPhases.includes(currentPhase);
  const priority: OrcamentistaNextDocumentRequest['priority'] = blocked
    ? 'critical'
    : fallbackAvailable
      ? 'high'
      : missingDocuments.some((document) => document.required)
        ? 'high'
        : 'medium';
  const requestedDocuments = missingDocuments.length
    ? missingDocuments
    : getExpectedDocumentsForPhase(nextPhase).filter((document) => document.required);

  return {
    id: `next-document-request-${currentPhase}`,
    next_phase: nextPhase,
    requested_documents: requestedDocuments,
    reason: blocked
      ? 'Contexto bloqueado por decisão HITL ou documento crítico ausente.'
      : fallbackAvailable
        ? 'Documento da fase está ausente; fallback pode ser ativado, mas o projeto ainda deve ser solicitado.'
        : requestedDocuments.length > 0
          ? 'Próximo documento necessário para manter o storytelling técnico da obra.'
          : 'Nenhum documento obrigatório pendente nesta fase.',
    priority,
    can_continue_with_current_context: !blocked,
    fallback_available: fallbackAvailable,
    message_to_user: fallbackAvailable
      ? 'Você pode seguir com estimativa preliminar controlada, mas envie o projeto executivo para validar a fase.'
      : 'Envie o próximo documento recomendado para completar o contexto antes de quantitativos finais.',
    created_at: createdAt,
  };
}
