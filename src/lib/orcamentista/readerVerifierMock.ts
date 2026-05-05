import {
  OrcamentistaReaderDispatchDecision,
  OrcamentistaReaderEvidenceItem,
  OrcamentistaReaderInferredItem,
  OrcamentistaReaderMissingInfo,
  OrcamentistaReaderRun,
  OrcamentistaReaderVerifierSummary,
  OrcamentistaVerifierDisagreement,
  OrcamentistaVerifierRun,
} from '../../types';

const architecturalEvidence: OrcamentistaReaderEvidenceItem[] = [
  {
    id: 'ev-arch-demolicao-001',
    label: 'Parede a demolir',
    description: 'Anotação DEM-01 indica remoção de parede entre sala e circulação.',
    quantity: '1 trecho',
    evidence_type: 'DRAWING_ANNOTATION',
    evidence_status: 'IDENTIFIED',
    source_reference: 'Projeto Arquitetônico.pdf · A-03 · marca DEM-01',
    confidence_score: 0.91,
  },
  {
    id: 'ev-arch-porta-001',
    label: 'Porta existente a remover',
    description: 'Símbolo de porta removida junto ao trecho de demolição.',
    quantity: '1 un',
    evidence_type: 'DRAWING_ANNOTATION',
    evidence_status: 'IDENTIFIED',
    source_reference: 'Projeto Arquitetônico.pdf · A-03 · eixo 2/B',
    confidence_score: 0.84,
  },
];

const architecturalInferred: OrcamentistaReaderInferredItem[] = [
  {
    id: 'inf-arch-reforco-001',
    element: 'Possível reforço local em verga',
    reasoning: 'Inferido pela abertura criada em parede existente sem detalhe estrutural associado.',
    source_references: ['Projeto Arquitetônico.pdf · A-03 · DEM-01'],
    confidence_score: 0.58,
    can_be_treated_as_fact: false,
  },
];

const architecturalMissing: OrcamentistaReaderMissingInfo[] = [
  {
    id: 'miss-arch-estrutura-001',
    description: 'Não há detalhe estrutural confirmando se a parede a demolir é estrutural.',
    impact: 'Pode alterar escopo, custo, responsabilidade técnica e segurança da intervenção.',
    severity: 'critical',
    suggested_action: 'Solicitar validação estrutural antes de qualquer consolidação.',
  },
];

const architecturalDisagreements: OrcamentistaVerifierDisagreement[] = [
  {
    id: 'disc-arch-critical-001',
    field: 'identified_items[parede_demolir]',
    reader_value: 'Parede a demolir',
    verifier_value: 'Não é possível descartar interferência estrutural',
    reason: 'A prancha arquitetônica indica demolição, mas não contém validação estrutural nem compatibilização com pilares/vigas.',
    severity: 'critical',
    requires_hitl: true,
    blocks_consolidation: true,
    target_agents: ['estrutural', 'compatibilizacao_tecnica'],
  },
];

const electricalEvidence: OrcamentistaReaderEvidenceItem[] = [
  {
    id: 'ev-elec-pontos-001',
    label: 'Pontos de tomada térreo',
    description: 'Quadro de pontos identifica tomadas TUG distribuídas em sala e cozinha.',
    quantity: '18 pontos',
    evidence_type: 'TABLE_ROW',
    evidence_status: 'IDENTIFIED',
    source_reference: 'Planta Elétrica.pdf · E-01 · quadro de pontos',
    confidence_score: 0.93,
  },
  {
    id: 'ev-elec-quadro-001',
    label: 'Quadro de distribuição QD-01',
    description: 'Diagrama unifilar indica QD-01 com circuitos C1 a C8.',
    quantity: '1 un',
    evidence_type: 'DRAWING_ANNOTATION',
    evidence_status: 'IDENTIFIED',
    source_reference: 'Planta Elétrica.pdf · E-04 · diagrama unifilar',
    confidence_score: 0.9,
  },
];

const electricalInferred: OrcamentistaReaderInferredItem[] = [
  {
    id: 'inf-elec-eletroduto-001',
    element: 'Eletrodutos e cabeamento por circuito',
    reasoning: 'Inferido pela existência dos circuitos e pontos indicados, mas sem quantitativo linear na prancha.',
    source_references: ['Planta Elétrica.pdf · E-01', 'Planta Elétrica.pdf · E-04'],
    confidence_score: 0.72,
    can_be_treated_as_fact: false,
  },
];

const electricalMissing: OrcamentistaReaderMissingInfo[] = [
  {
    id: 'miss-elec-carga-001',
    description: 'Tabela de cargas não informa demanda total consolidada.',
    impact: 'Exige validação futura antes de dimensionamento final, mas não bloqueia dispatch técnico inicial.',
    severity: 'medium',
    suggested_action: 'Enviar para agente elétrico para análise de escopo e pendências.',
  },
];

const electricalDisagreements: OrcamentistaVerifierDisagreement[] = [
  {
    id: 'disc-elec-medium-001',
    field: 'inferred_items[eletrodutos]',
    reader_value: 'Eletrodutos e cabeamento por circuito',
    verifier_value: 'Inferência plausível, mas sem metragem confirmada',
    reason: 'Verifier confirma que a inferência pode orientar agente especialista, mas não pode virar quantitativo oficial.',
    severity: 'medium',
    requires_hitl: false,
    blocks_consolidation: false,
    target_agents: ['eletrica_dados_automacao', 'quantitativo'],
  },
];

const memorialEvidence: OrcamentistaReaderEvidenceItem[] = [
  {
    id: 'ev-memorial-piso-001',
    label: 'Porcelanato em áreas sociais',
    description: 'Memorial especifica porcelanato 90x90 em sala e circulação.',
    quantity: undefined,
    evidence_type: 'TEXT_EXPLICIT',
    evidence_status: 'IDENTIFIED',
    source_reference: 'Memorial Descritivo.pdf · MD-03 · pisos e acabamentos',
    confidence_score: 0.88,
  },
];

const memorialInferred: OrcamentistaReaderInferredItem[] = [
  {
    id: 'inf-memorial-rodape-001',
    element: 'Rodapé compatível com porcelanato',
    reasoning: 'Inferido por padrão de acabamento, mas o memorial não especifica rodapé.',
    source_references: ['Memorial Descritivo.pdf · MD-03'],
    confidence_score: 0.64,
    can_be_treated_as_fact: false,
  },
];

const memorialMissing: OrcamentistaReaderMissingInfo[] = [
  {
    id: 'miss-memorial-area-001',
    description: 'Área de aplicação dos pisos não foi informada no memorial.',
    impact: 'Impede quantitativo confiável sem cruzamento com plantas.',
    severity: 'high',
    suggested_action: 'Exigir HITL ou cruzamento futuro com planta baixa antes de consolidar.',
  },
];

const memorialDisagreements: OrcamentistaVerifierDisagreement[] = [
  {
    id: 'disc-memorial-high-001',
    field: 'missing_information[area_piso]',
    reader_value: 'Área não informada',
    verifier_value: 'Área pode ser parcialmente estimada pela planta, mas não pelo memorial isolado',
    reason: 'Verifier exige revisão humana para decidir se a estimativa por cruzamento documental é aceitável.',
    severity: 'high',
    requires_hitl: true,
    blocks_consolidation: false,
    target_agents: ['civil_arquitetonico', 'acabamentos', 'quantitativo'],
  },
];

function buildReaderRun({
  id,
  renderedPageId,
  documentId,
  documentName,
  pageNumber,
  pageLabel,
  pageType,
  discipline,
  evidence,
  inferred,
  missing,
  confidenceScore,
  requiresHitl,
  blocksConsolidation,
}: {
  id: string;
  renderedPageId: string;
  documentId: string;
  documentName: string;
  pageNumber: number;
  pageLabel: string;
  pageType: OrcamentistaReaderRun['page_type'];
  discipline: string;
  evidence: OrcamentistaReaderEvidenceItem[];
  inferred: OrcamentistaReaderInferredItem[];
  missing: OrcamentistaReaderMissingInfo[];
  confidenceScore: number;
  requiresHitl: boolean;
  blocksConsolidation: boolean;
}): OrcamentistaReaderRun {
  return {
    id,
    rendered_page_id: renderedPageId,
    document_id: documentId,
    document_name: documentName,
    page_number: pageNumber,
    page_label: pageLabel,
    page_type: pageType,
    discipline,
    identified_items: evidence.filter((item) => item.evidence_status === 'IDENTIFIED'),
    inferred_items: inferred,
    missing_information: missing,
    confidence_score: confidenceScore,
    evidence_items: evidence,
    source_references: Array.from(new Set(evidence.map((item) => item.source_reference))),
    requires_hitl: requiresHitl,
    blocks_consolidation: blocksConsolidation,
  };
}

function buildVerifierRun({
  id,
  readerRunId,
  agreementScore,
  verificationStatus,
  disagreementPoints,
  confirmedItems,
  disputedItems,
  omittedPossibleItems,
  requiresReanalysis,
  requiresHitl,
  blocksConsolidation,
  verifierNotes,
}: {
  id: string;
  readerRunId: string;
  agreementScore: number;
  verificationStatus: OrcamentistaVerifierRun['verification_status'];
  disagreementPoints: OrcamentistaVerifierDisagreement[];
  confirmedItems: string[];
  disputedItems: string[];
  omittedPossibleItems: string[];
  requiresReanalysis: boolean;
  requiresHitl: boolean;
  blocksConsolidation: boolean;
  verifierNotes: string[];
}): OrcamentistaVerifierRun {
  return {
    id,
    reader_run_id: readerRunId,
    agreement_score: agreementScore,
    verification_status: verificationStatus,
    disagreement_points: disagreementPoints,
    confirmed_items: confirmedItems,
    disputed_items: disputedItems,
    omitted_possible_items: omittedPossibleItems,
    requires_reanalysis: requiresReanalysis,
    requires_hitl: requiresHitl,
    blocks_consolidation: blocksConsolidation,
    verifier_notes: verifierNotes,
  };
}

function buildDispatchDecision({
  readerRunId,
  verifierRunId,
  targetAgents,
  allowedToDispatch,
  dispatchStatus,
  dispatchReason,
  blockedReason,
}: {
  readerRunId: string;
  verifierRunId: string;
  targetAgents: string[];
  allowedToDispatch: boolean;
  dispatchStatus: OrcamentistaReaderDispatchDecision['dispatch_status'];
  dispatchReason: string;
  blockedReason?: string;
}): OrcamentistaReaderDispatchDecision {
  return {
    reader_run_id: readerRunId,
    verifier_run_id: verifierRunId,
    target_agents: targetAgents,
    allowed_to_dispatch: allowedToDispatch,
    dispatch_status: dispatchStatus,
    dispatch_reason: dispatchReason,
    blocked_reason: blockedReason,
  };
}

const architectureReaderRun = buildReaderRun({
  id: 'reader-arch-001',
  renderedPageId: 'rendered-page-a03',
  documentId: 'doc-intake-arq',
  documentName: 'Projeto Arquitetônico.pdf',
  pageNumber: 3,
  pageLabel: 'A-03 Demolição e layout proposto',
  pageType: 'PLANTA_BAIXA',
  discipline: 'ARQUITETURA',
  evidence: architecturalEvidence,
  inferred: architecturalInferred,
  missing: architecturalMissing,
  confidenceScore: 0.78,
  requiresHitl: true,
  blocksConsolidation: true,
});

const architectureVerifierRun = buildVerifierRun({
  id: 'verifier-arch-001',
  readerRunId: architectureReaderRun.id,
  agreementScore: 0.61,
  verificationStatus: 'BLOCKED',
  disagreementPoints: architecturalDisagreements,
  confirmedItems: ['Porta existente a remover'],
  disputedItems: ['Parede a demolir'],
  omittedPossibleItems: ['Interferência estrutural não descartada'],
  requiresReanalysis: true,
  requiresHitl: true,
  blocksConsolidation: true,
  verifierNotes: [
    'A leitura de demolição existe, mas não basta para orçamento oficial.',
    'Necessário validar com agente estrutural e compatibilização técnica.',
  ],
});

const electricalReaderRun = buildReaderRun({
  id: 'reader-elec-001',
  renderedPageId: 'rendered-page-e01',
  documentId: 'doc-intake-eletrica',
  documentName: 'Planta Elétrica.pdf',
  pageNumber: 1,
  pageLabel: 'E-01 Pontos elétricos térreo',
  pageType: 'PLANTA_BAIXA',
  discipline: 'ELETRICA',
  evidence: electricalEvidence,
  inferred: electricalInferred,
  missing: electricalMissing,
  confidenceScore: 0.89,
  requiresHitl: false,
  blocksConsolidation: false,
});

const electricalVerifierRun = buildVerifierRun({
  id: 'verifier-elec-001',
  readerRunId: electricalReaderRun.id,
  agreementScore: 0.92,
  verificationStatus: 'APPROVED_WITH_WARNINGS',
  disagreementPoints: electricalDisagreements,
  confirmedItems: ['Pontos de tomada térreo', 'Quadro de distribuição QD-01'],
  disputedItems: [],
  omittedPossibleItems: ['Metragem de eletrodutos depende de agente quantitativo'],
  requiresReanalysis: false,
  requiresHitl: false,
  blocksConsolidation: false,
  verifierNotes: [
    'Leitura suficiente para dispatch aos agentes especialistas.',
    'Inferências devem permanecer marcadas e não podem virar quantidade oficial.',
  ],
});

const memorialReaderRun = buildReaderRun({
  id: 'reader-memorial-001',
  renderedPageId: 'rendered-page-md03',
  documentId: 'doc-intake-memorial',
  documentName: 'Memorial Descritivo.pdf',
  pageNumber: 3,
  pageLabel: 'MD-03 Pisos e acabamentos',
  pageType: 'ESPECIFICACAO',
  discipline: 'ARQUITETURA',
  evidence: memorialEvidence,
  inferred: memorialInferred,
  missing: memorialMissing,
  confidenceScore: 0.73,
  requiresHitl: true,
  blocksConsolidation: false,
});

const memorialVerifierRun = buildVerifierRun({
  id: 'verifier-memorial-001',
  readerRunId: memorialReaderRun.id,
  agreementScore: 0.76,
  verificationStatus: 'HITL_REQUIRED',
  disagreementPoints: memorialDisagreements,
  confirmedItems: ['Porcelanato em áreas sociais'],
  disputedItems: ['Rodapé compatível com porcelanato'],
  omittedPossibleItems: ['Área de aplicação dos pisos'],
  requiresReanalysis: false,
  requiresHitl: true,
  blocksConsolidation: false,
  verifierNotes: [
    'Memorial confirma acabamento, mas não confirma quantitativo.',
    'HITL precisa decidir se a estimativa por cruzamento documental será permitida em fase futura.',
  ],
});

export const mockReaderVerifierSummaries: OrcamentistaReaderVerifierSummary[] = [
  {
    id: 'summary-arch-blocked',
    reader_run: architectureReaderRun,
    verifier_run: architectureVerifierRun,
    dispatch_decision: buildDispatchDecision({
      readerRunId: architectureReaderRun.id,
      verifierRunId: architectureVerifierRun.id,
      targetAgents: ['estrutural', 'compatibilizacao_tecnica'],
      allowedToDispatch: false,
      dispatchStatus: 'blocked',
      dispatchReason: 'Divergência crítica precisa de HITL e reanálise antes de qualquer despacho.',
      blockedReason: 'Não é possível descartar interferência estrutural na parede a demolir.',
    }),
  },
  {
    id: 'summary-elec-ready',
    reader_run: electricalReaderRun,
    verifier_run: electricalVerifierRun,
    dispatch_decision: buildDispatchDecision({
      readerRunId: electricalReaderRun.id,
      verifierRunId: electricalVerifierRun.id,
      targetAgents: ['eletrica_dados_automacao', 'quantitativo'],
      allowedToDispatch: true,
      dispatchStatus: 'ready_for_future_dispatch',
      dispatchReason: 'Leitura verificada com alta concordância; inferências permanecem marcadas.',
    }),
  },
  {
    id: 'summary-memorial-hitl',
    reader_run: memorialReaderRun,
    verifier_run: memorialVerifierRun,
    dispatch_decision: buildDispatchDecision({
      readerRunId: memorialReaderRun.id,
      verifierRunId: memorialVerifierRun.id,
      targetAgents: ['civil_arquitetonico', 'acabamentos', 'quantitativo'],
      allowedToDispatch: false,
      dispatchStatus: 'requires_hitl',
      dispatchReason: 'Leitura útil, mas pendência de área impede dispatch automático.',
      blockedReason: 'HITL obrigatório para validar premissa de quantitativo por cruzamento documental.',
    }),
  },
];
