import {
  OrcamentistaBlockedProjectContext,
  OrcamentistaPendingProjectContext,
  OrcamentistaProjectContextStory,
  OrcamentistaProjectReadingSession,
  OrcamentistaReadingHitlQuestion,
  OrcamentistaReadingValidationDecision,
  OrcamentistaReceivedDocumentContext,
  OrcamentistaValidatedProjectContext,
} from '../../types';
import {
  buildNextDocumentRequest,
  getExpectedDocumentsForPhase,
} from './guidedProjectIntakePolicy';

const MOCK_TIMESTAMP = '2026-05-05T18:00:00.000Z';

export const MOCK_READING_RECEIVED_DOCUMENTS: OrcamentistaReceivedDocumentContext[] = [
  {
    id: 'received-context-arq-parcial',
    document_id: 'doc-arq-implantacao-parcial',
    file_name: 'Projeto Arquitetônico e Implantação - parcial.pdf',
    detected_phase: 'arquitetonico_implantacao',
    expected_phase: 'arquitetonico_implantacao',
    received_order: 1,
    allowed_to_read: true,
    out_of_order: false,
    context_status: 'validated',
    missing_prior_phases: [],
    can_feed_final_quantities: false,
    can_activate_missing_project_fallback: false,
    created_at: MOCK_TIMESTAMP,
  },
  {
    id: 'received-context-fundacao-fora-ordem',
    document_id: 'doc-estrutural-fundacao-f01',
    file_name: 'Estrutural Fundação - F01 Estacas e Blocos.pdf',
    detected_phase: 'estrutural_fundacao',
    expected_phase: 'sondagem_topografia',
    received_order: 2,
    allowed_to_read: true,
    out_of_order: true,
    context_status: 'incomplete',
    missing_prior_phases: ['sondagem_topografia'],
    can_feed_final_quantities: false,
    can_activate_missing_project_fallback: true,
    created_at: MOCK_TIMESTAMP,
  },
];

export const MOCK_READING_HITL_QUESTIONS: OrcamentistaReadingHitlQuestion[] = [
  {
    id: 'hitl-reading-pile-quantity-21',
    phase: 'estrutural_fundacao',
    document_id: 'doc-estrutural-fundacao-f01',
    question: 'Confirmar se a tabela principal indica 21 estacas ou se ha ambiguidade textual com outro total.',
    reason: 'A prancha F01 mostra total de 21 estacas, mas a anotacao lateral pode ser lida como complemento textual.',
    severity: 'high',
    required_before_phase: 'quantitativos',
    blocks_context_propagation: true,
    suggested_decisions: ['approve_reading', 'correct_reading', 'keep_context_pending'],
  },
  {
    id: 'hitl-reading-c25-r25-nomenclature',
    phase: 'estrutural_fundacao',
    document_id: 'doc-estrutural-fundacao-f01',
    question: 'Validar se C25/R25 significa estaca de diâmetro Ø25 cm no contrato desta prancha.',
    reason: 'A nomenclatura aparece como C25 em tabela e R25 em chamada visual; precisa padronizacao humana.',
    severity: 'high',
    required_before_phase: 'quantitativos',
    blocks_context_propagation: true,
    suggested_decisions: ['approve_reading', 'correct_reading', 'keep_context_pending'],
  },
  {
    id: 'hitl-reading-p6-nasce',
    phase: 'estrutural_fundacao',
    document_id: 'doc-estrutural-fundacao-f01',
    question: 'Confirmar o significado de P6 indicado como “nasce”.',
    reason: 'P6 aparece com anotacao de nascimento em elemento estrutural, mas sem contexto completo de superestrutura.',
    severity: 'medium',
    required_before_phase: 'estrutural_superestrutura',
    blocks_context_propagation: false,
    suggested_decisions: ['approve_reading', 'keep_context_pending', 'request_document'],
  },
  {
    id: 'hitl-reading-p23-corte',
    phase: 'estrutural_fundacao',
    document_id: 'doc-estrutural-fundacao-f01',
    question: 'P23 aparece em corte, mas nao esta consolidado na tabela principal. Deve entrar como pendencia?',
    reason: 'Elemento visivel em corte sem consolidacao na tabela principal nao pode virar quantitativo final.',
    severity: 'high',
    required_before_phase: 'quantitativos',
    blocks_context_propagation: true,
    suggested_decisions: ['keep_context_pending', 'request_document', 'block_reading'],
  },
  {
    id: 'hitl-reading-sondagem-ausente',
    phase: 'sondagem_topografia',
    question: 'Sondagem/topografia esta ausente. Manter fundacao bloqueada para consolidacao?',
    reason: 'Projeto de fundacao chegou fora de ordem e nao ha base geotecnica para validar profundidade ou solucao.',
    severity: 'critical',
    required_before_phase: 'estrutural_fundacao',
    blocks_context_propagation: true,
    suggested_decisions: ['request_document', 'activate_missing_project_fallback', 'keep_context_pending'],
  },
  {
    id: 'hitl-reading-relatorio-esforcos-ausente',
    phase: 'estrutural_fundacao',
    document_id: 'doc-estrutural-fundacao-f01',
    question: 'Relatório de esforços da fundação está ausente. Solicitar antes de validar dimensionamento?',
    reason: 'Sem esforços, nao ha rastreabilidade para validar cargas, blocos e criterio de fundacao.',
    severity: 'critical',
    required_before_phase: 'quantitativos',
    blocks_context_propagation: true,
    suggested_decisions: ['request_document', 'keep_context_pending', 'block_reading'],
  },
  {
    id: 'hitl-reading-fck-divergente',
    phase: 'estrutural_fundacao',
    document_id: 'doc-estrutural-fundacao-f01',
    question: 'Confirmar fck/concreto por elemento quando nota geral e tabela divergem.',
    reason: 'Nota geral indica concreto C30, enquanto tabela de fundacao sugere C25 para determinados elementos.',
    severity: 'high',
    required_before_phase: 'quantitativos',
    blocks_context_propagation: true,
    suggested_decisions: ['correct_reading', 'request_document', 'keep_context_pending'],
  },
];

export const MOCK_READING_VALIDATION_DECISIONS: OrcamentistaReadingValidationDecision[] = [
  {
    id: 'decision-validate-21-piles',
    question_id: 'hitl-reading-pile-quantity-21',
    phase: 'estrutural_fundacao',
    decision_type: 'approve_reading',
    corrected_value: '21 estacas',
    notes: 'Usuario validou que a tabela principal consolida 21 estacas.',
    decided_by: 'human',
    decided_at: MOCK_TIMESTAMP,
  },
  {
    id: 'decision-validate-c25-diameter',
    question_id: 'hitl-reading-c25-r25-nomenclature',
    phase: 'estrutural_fundacao',
    decision_type: 'correct_reading',
    corrected_value: 'C25 = estaca Ø25 cm',
    notes: 'Usuario validou C25 como estaca de diametro 25 cm para este contrato.',
    decided_by: 'human',
    decided_at: MOCK_TIMESTAMP,
  },
  {
    id: 'decision-p6-pending',
    question_id: 'hitl-reading-p6-nasce',
    phase: 'estrutural_fundacao',
    decision_type: 'keep_context_pending',
    corrected_value: 'P6 nasce - pendente de prancha de superestrutura',
    notes: 'P6 permanece como contexto pendente ate receber superestrutura.',
    decided_by: 'human',
    decided_at: MOCK_TIMESTAMP,
  },
  {
    id: 'decision-sondagem-pending',
    question_id: 'hitl-reading-sondagem-ausente',
    phase: 'sondagem_topografia',
    decision_type: 'request_document',
    notes: 'Usuario marcou sondagem/topografia como documento pendente obrigatório.',
    decided_by: 'human',
    decided_at: MOCK_TIMESTAMP,
  },
  {
    id: 'decision-foundation-blocked',
    question_id: 'hitl-reading-relatorio-esforcos-ausente',
    phase: 'estrutural_fundacao',
    decision_type: 'request_document',
    notes: 'Fundacao permanece bloqueada para consolidacao ate receber relatorio de esforcos.',
    decided_by: 'human',
    decided_at: MOCK_TIMESTAMP,
  },
];

export const MOCK_VALIDATED_PROJECT_CONTEXT: OrcamentistaValidatedProjectContext[] = [
  {
    id: 'validated-context-arquitetonico',
    phase: 'arquitetonico_implantacao',
    document_ids: ['doc-arq-implantacao-parcial'],
    validated_facts: [
      'Tipo de obra: residencial unifamiliar.',
      'Endereco mockado: Rua das Amostras, 123 - lote residencial.',
      'Arquitetonico/implantacao recebido parcialmente e suficiente para storytelling inicial, mas nao para quantitativos finais.',
    ],
    human_corrections: [],
    context_propagation_status: 'validated',
    can_feed_next_phases: true,
    can_feed_final_quantities: false,
    validated_at: MOCK_TIMESTAMP,
  },
  {
    id: 'validated-context-fundacao-parcial',
    phase: 'estrutural_fundacao',
    document_ids: ['doc-estrutural-fundacao-f01'],
    validated_facts: [
      'Fundacao com 21 estacas validada somente quanto a quantidade.',
      'C25 validado como estaca Ø25 cm no contrato da prancha F01.',
      'Profundidade real das estacas nao validada.',
    ],
    human_corrections: MOCK_READING_VALIDATION_DECISIONS.filter((decision) =>
      ['hitl-reading-pile-quantity-21', 'hitl-reading-c25-r25-nomenclature'].includes(decision.question_id ?? '')
    ),
    context_propagation_status: 'validated',
    can_feed_next_phases: false,
    can_feed_final_quantities: false,
    validated_at: MOCK_TIMESTAMP,
  },
];

export const MOCK_PENDING_PROJECT_CONTEXT: OrcamentistaPendingProjectContext[] = [
  {
    id: 'pending-context-sondagem',
    phase: 'sondagem_topografia',
    document_ids: [],
    pending_questions: MOCK_READING_HITL_QUESTIONS.filter((question) =>
      ['hitl-reading-sondagem-ausente'].includes(question.id)
    ),
    missing_documents: getExpectedDocumentsForPhase('sondagem_topografia'),
    context_propagation_status: 'pending',
    can_feed_preliminary_reading: true,
    can_feed_final_quantities: false,
    created_at: MOCK_TIMESTAMP,
  },
  {
    id: 'pending-context-fundacao-detalhes',
    phase: 'estrutural_fundacao',
    document_ids: ['doc-estrutural-fundacao-f01'],
    pending_questions: MOCK_READING_HITL_QUESTIONS.filter((question) =>
      [
        'hitl-reading-p6-nasce',
        'hitl-reading-p23-corte',
        'hitl-reading-fck-divergente',
      ].includes(question.id)
    ),
    missing_documents: [
      {
        ...getExpectedDocumentsForPhase('estrutural_fundacao')[0],
        id: 'expected-relatorio-esforcos-fundacao',
        label: 'Relatório de esforços da fundação',
        description: 'Relatório de cargas/esforços para validar fundação, blocos e critérios de dimensionamento.',
        accepted_disciplines: ['ESTRUTURAL', 'RELATORIO_ESFORCOS'],
        accepted_file_hints: ['esforcos', 'esforços', 'cargas', 'relatorio fundacao'],
      },
    ],
    context_propagation_status: 'incomplete',
    can_feed_preliminary_reading: true,
    can_feed_final_quantities: false,
    created_at: MOCK_TIMESTAMP,
  },
];

export const MOCK_BLOCKED_PROJECT_CONTEXT: OrcamentistaBlockedProjectContext[] = [
  {
    id: 'blocked-context-fundacao-consolidacao',
    phase: 'estrutural_fundacao',
    document_ids: ['doc-estrutural-fundacao-f01'],
    block_reasons: [
      'Sondagem/topografia ausente.',
      'Relatorio de esforcos da fundacao ausente.',
      'Profundidade real das estacas nao validada.',
      'fck/concreto por elemento divergente entre nota geral e tabela.',
    ],
    required_actions: [
      'Solicitar sondagem/topografia.',
      'Solicitar relatorio de esforços da fundação.',
      'Validar profundidade das estacas.',
      'Confirmar fck por elemento.',
    ],
    context_propagation_status: 'blocked',
    blocks_next_phases: true,
    blocks_final_quantities: true,
    created_at: MOCK_TIMESTAMP,
  },
  {
    id: 'blocked-context-quantitativos-fundacao',
    phase: 'quantitativos',
    document_ids: ['doc-estrutural-fundacao-f01'],
    block_reasons: [
      'Quantitativos finais de fundacao dependem de contexto validado de sondagem, esforços, profundidade e fck.',
    ],
    required_actions: [
      'Resolver HITLs de fundação antes de iniciar quantitativos finais.',
    ],
    context_propagation_status: 'blocked',
    blocks_next_phases: true,
    blocks_final_quantities: true,
    created_at: MOCK_TIMESTAMP,
  },
];

const nextDocumentRequest = buildNextDocumentRequest({
  currentPhase: 'sondagem_topografia',
  receivedDocuments: MOCK_READING_RECEIVED_DOCUMENTS,
  blockedPhases: ['estrutural_fundacao', 'quantitativos'],
  createdAt: MOCK_TIMESTAMP,
});

export const MOCK_PROJECT_CONTEXT_STORY: OrcamentistaProjectContextStory = {
  id: 'story-reading-hitl-residential-zero',
  opportunity_id: 'mock-opportunity-residential-zero',
  orcamento_id: 'mock-orcamento-residential-zero',
  current_phase: 'sondagem_topografia',
  validated_contexts: MOCK_VALIDATED_PROJECT_CONTEXT,
  pending_contexts: MOCK_PENDING_PROJECT_CONTEXT,
  blocked_contexts: MOCK_BLOCKED_PROJECT_CONTEXT,
  next_document_request: {
    ...nextDocumentRequest,
    requested_documents: [
      ...nextDocumentRequest.requested_documents,
      {
        ...getExpectedDocumentsForPhase('estrutural_fundacao')[0],
        id: 'expected-relatorio-esforcos-fundacao-next',
        label: 'Relatório de esforços da fundação',
        description: 'Necessario para validar cargas e consolidar fundacao.',
        accepted_disciplines: ['ESTRUTURAL', 'RELATORIO_ESFORCOS'],
        accepted_file_hints: ['esforcos', 'esforços', 'cargas', 'relatorio fundacao'],
      },
    ],
    reason: 'Sondagem/topografia e relatorio de esforcos sao obrigatorios antes de consolidar fundacao.',
    priority: 'critical',
  },
  story_summary:
    'Obra residencial com arquitetonico parcial validado. Fundação chegou fora de ordem: 21 estacas C25/Ø25 cm foram validadas parcialmente, mas sondagem, esforços, profundidade e fck seguem pendentes.',
  open_assumptions: [
    'C25 representa Ø25 cm apenas neste contrato de prancha.',
    'P6 como “nasce” depende de prancha de superestrutura.',
    'P23 em corte ainda nao entra na tabela principal.',
  ],
  blocked_propagations: ['estrutural_fundacao', 'quantitativos', 'custos'],
  updated_at: MOCK_TIMESTAMP,
};

export const MOCK_PROJECT_READING_SESSION: OrcamentistaProjectReadingSession = {
  id: 'reading-session-residential-zero-hitl',
  opportunity_id: 'mock-opportunity-residential-zero',
  orcamento_id: 'mock-orcamento-residential-zero',
  current_phase: 'sondagem_topografia',
  phase_status: {
    arquitetonico_implantacao: 'validated',
    sondagem_topografia: 'waiting_document',
    estrutural_fundacao: 'context_incomplete',
    estrutural_superestrutura: 'blocked',
    quantitativos: 'blocked',
    custos: 'blocked',
  },
  received_documents: MOCK_READING_RECEIVED_DOCUMENTS,
  expected_documents: [
    ...getExpectedDocumentsForPhase('arquitetonico_implantacao'),
    ...getExpectedDocumentsForPhase('sondagem_topografia'),
    ...getExpectedDocumentsForPhase('estrutural_fundacao'),
  ],
  context_story: MOCK_PROJECT_CONTEXT_STORY,
  created_at: MOCK_TIMESTAMP,
  updated_at: MOCK_TIMESTAMP,
};
