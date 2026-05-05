import {
  OrcamentistaBlockedProjectContext,
  OrcamentistaContextPropagationStatus,
  OrcamentistaNextDocumentRequest,
  OrcamentistaPendingProjectContext,
  OrcamentistaProjectReadingSession,
  OrcamentistaReadingHitlQuestion,
  OrcamentistaReadingPhase,
  OrcamentistaReadingValidationDecision,
  OrcamentistaValidatedProjectContext,
} from '../../types';
import {
  buildNextDocumentRequest,
  canAdvanceReadingPhase,
  getMissingDocumentsForCurrentPhase,
} from './guidedProjectIntakePolicy';

export type OrcamentistaReadingSessionSummary = {
  total_phases: number;
  current_phase: OrcamentistaReadingPhase;
  received_documents_count: number;
  missing_documents_count: number;
  open_hitls_count: number;
  blocking_hitls_count: number;
  validated_context_count: number;
  pending_context_count: number;
  blocked_context_count: number;
  can_advance_phase: boolean;
  can_start_quantities: boolean;
  can_start_costs: boolean;
};

export type OrcamentistaContextPropagationResult = {
  status: OrcamentistaContextPropagationStatus;
  can_propagate_to_next_phase: boolean;
  can_feed_quantities: boolean;
  can_feed_costs: boolean;
  blocked_reason: string | null;
  pending_requirements: string[];
};

const ALL_PHASES_COUNT = 12;

function allPendingQuestions(session: OrcamentistaProjectReadingSession) {
  return session.context_story.pending_contexts.flatMap((context) => context.pending_questions);
}

function decisions(session: OrcamentistaProjectReadingSession) {
  return session.context_story.validated_contexts.flatMap((context) => context.human_corrections);
}

function decisionMatchesQuestion(
  decision: OrcamentistaReadingValidationDecision,
  question: OrcamentistaReadingHitlQuestion
) {
  return decision.question_id === question.id;
}

function questionIsResolved(
  question: OrcamentistaReadingHitlQuestion,
  validationDecisions: OrcamentistaReadingValidationDecision[]
) {
  return validationDecisions.some((decision) => decisionMatchesQuestion(decision, question));
}

function uniquePhases(phases: OrcamentistaReadingPhase[]) {
  return [...new Set(phases)];
}

export function groupHitlQuestionsByPhase(questions: OrcamentistaReadingHitlQuestion[]) {
  return questions.reduce<Partial<Record<OrcamentistaReadingPhase, OrcamentistaReadingHitlQuestion[]>>>(
    (acc, question) => ({
      ...acc,
      [question.phase]: [...(acc[question.phase] ?? []), question],
    }),
    {}
  );
}

export function getOpenReadingHitls(session: OrcamentistaProjectReadingSession) {
  const validationDecisions = decisions(session);
  return allPendingQuestions(session).filter((question) => !questionIsResolved(question, validationDecisions));
}

export function getBlockingReadingHitls(session: OrcamentistaProjectReadingSession) {
  return getOpenReadingHitls(session).filter((question) => question.blocks_context_propagation);
}

export function getContextPropagationStatus(
  session: OrcamentistaProjectReadingSession
): OrcamentistaContextPropagationResult {
  const openHitls = getOpenReadingHitls(session);
  const blockingHitls = openHitls.filter((question) => question.blocks_context_propagation);
  const blockedContexts = session.context_story.blocked_contexts;
  const pendingRequirements = [
    ...openHitls.map((question) => question.question),
    ...session.context_story.pending_contexts.flatMap((context) =>
      context.missing_documents.map((document) => document.label)
    ),
  ];
  const blockedReason = blockedContexts.length
    ? blockedContexts.flatMap((context) => context.block_reasons).join(' ')
    : blockingHitls.length
      ? blockingHitls.map((question) => question.reason).join(' ')
      : null;

  if (blockedContexts.length > 0 || blockingHitls.length > 0) {
    return {
      status: 'blocked',
      can_propagate_to_next_phase: false,
      can_feed_quantities: false,
      can_feed_costs: false,
      blocked_reason: blockedReason,
      pending_requirements: pendingRequirements,
    };
  }

  if (openHitls.length > 0 || session.context_story.pending_contexts.length > 0) {
    return {
      status: 'pending',
      can_propagate_to_next_phase: true,
      can_feed_quantities: false,
      can_feed_costs: false,
      blocked_reason: null,
      pending_requirements: pendingRequirements,
    };
  }

  return {
    status: 'validated',
    can_propagate_to_next_phase: true,
    can_feed_quantities: true,
    can_feed_costs: true,
    blocked_reason: null,
    pending_requirements: [],
  };
}

export function canUseContextInNextPhase(session: OrcamentistaProjectReadingSession) {
  return getContextPropagationStatus(session).can_propagate_to_next_phase;
}

export function summarizeReadingSession(session: OrcamentistaProjectReadingSession): OrcamentistaReadingSessionSummary {
  const openHitls = getOpenReadingHitls(session);
  const blockingHitls = getBlockingReadingHitls(session);
  const missingDocuments = getMissingDocumentsForCurrentPhase({
    currentPhase: session.current_phase,
    receivedDocuments: session.received_documents,
  });
  const propagation = getContextPropagationStatus(session);
  const blockedPhases = session.context_story.blocked_contexts.map((context) => context.phase);

  return {
    total_phases: ALL_PHASES_COUNT,
    current_phase: session.current_phase,
    received_documents_count: session.received_documents.length,
    missing_documents_count: missingDocuments.length,
    open_hitls_count: openHitls.length,
    blocking_hitls_count: blockingHitls.length,
    validated_context_count: session.context_story.validated_contexts.length,
    pending_context_count: session.context_story.pending_contexts.length,
    blocked_context_count: session.context_story.blocked_contexts.length,
    can_advance_phase: canAdvanceReadingPhase({
      currentPhase: session.current_phase,
      receivedDocuments: session.received_documents,
      validatedPhases: session.context_story.validated_contexts.map((context) => context.phase),
      blockedPhases,
    }),
    can_start_quantities: propagation.can_feed_quantities && !blockedPhases.includes('quantitativos'),
    can_start_costs: propagation.can_feed_costs && !blockedPhases.includes('custos'),
  };
}

function removeResolvedQuestionFromPendingContexts(
  pendingContexts: OrcamentistaPendingProjectContext[],
  decision: OrcamentistaReadingValidationDecision
) {
  return pendingContexts
    .map((context) => ({
      ...context,
      pending_questions: context.pending_questions.filter(
        (question) => !decisionMatchesQuestion(decision, question)
      ),
    }))
    .filter((context) => context.pending_questions.length > 0 || context.missing_documents.length > 0);
}

function appendDecisionToValidatedContext(
  contexts: OrcamentistaValidatedProjectContext[],
  decision: OrcamentistaReadingValidationDecision
) {
  const fact = decision.corrected_value
    ? `${decision.corrected_value} (${decision.notes})`
    : decision.notes;
  const existing = contexts.find((context) => context.phase === decision.phase);

  if (existing) {
    return contexts.map((context) =>
      context.id === existing.id
        ? {
            ...context,
            validated_facts: [...context.validated_facts, fact],
            human_corrections: [...context.human_corrections, decision],
            can_feed_next_phases: decision.decision_type !== 'keep_context_pending',
            can_feed_final_quantities: false,
          }
        : context
    );
  }

  const nextContext: OrcamentistaValidatedProjectContext = {
    id: `validated-context-${decision.phase}-${decision.id}`,
    phase: decision.phase,
    document_ids: [],
    validated_facts: [fact],
    human_corrections: [decision],
    context_propagation_status: 'validated',
    can_feed_next_phases: decision.decision_type !== 'keep_context_pending',
    can_feed_final_quantities: false,
    validated_at: decision.decided_at,
  };

  return [...contexts, nextContext];
}

function appendBlockedContext(
  contexts: OrcamentistaBlockedProjectContext[],
  decision: OrcamentistaReadingValidationDecision
) {
  const nextContext: OrcamentistaBlockedProjectContext = {
    id: `blocked-context-${decision.phase}-${decision.id}`,
    phase: decision.phase,
    document_ids: [],
    block_reasons: [decision.notes],
    required_actions:
      decision.decision_type === 'request_document'
        ? ['Solicitar documento indicado pela decisao humana.']
        : ['Manter leitura bloqueada ate nova decisao humana.'],
    context_propagation_status: 'blocked',
    blocks_next_phases: true,
    blocks_final_quantities: true,
    created_at: decision.decided_at,
  };

  return [...contexts, nextContext];
}

export function applyReadingValidationDecision(
  session: OrcamentistaProjectReadingSession,
  decision: OrcamentistaReadingValidationDecision
): OrcamentistaProjectReadingSession {
  const pendingContexts = removeResolvedQuestionFromPendingContexts(
    session.context_story.pending_contexts,
    decision
  );
  const shouldValidate =
    decision.decision_type === 'approve_reading' || decision.decision_type === 'correct_reading';
  const shouldBlock =
    decision.decision_type === 'block_reading' || decision.decision_type === 'request_document';
  const validatedContexts = shouldValidate
    ? appendDecisionToValidatedContext(session.context_story.validated_contexts, decision)
    : session.context_story.validated_contexts;
  const blockedContexts = shouldBlock
    ? appendBlockedContext(session.context_story.blocked_contexts, decision)
    : session.context_story.blocked_contexts;
  const blockedPropagations = uniquePhases(blockedContexts.map((context) => context.phase));
  const nextRequest = buildNextDocumentRequest({
    currentPhase: session.current_phase,
    receivedDocuments: session.received_documents,
    blockedPhases: blockedPropagations,
    createdAt: decision.decided_at,
  });

  return {
    ...session,
    context_story: {
      ...session.context_story,
      validated_contexts: validatedContexts,
      pending_contexts: pendingContexts,
      blocked_contexts: blockedContexts,
      next_document_request: nextRequest,
      blocked_propagations: blockedPropagations,
      updated_at: decision.decided_at,
    },
    updated_at: decision.decided_at,
  };
}

export function buildValidatedContextFromDecisions({
  phase,
  decisions: validationDecisions,
  documentIds = [],
}: {
  phase: OrcamentistaReadingPhase;
  decisions: OrcamentistaReadingValidationDecision[];
  documentIds?: string[];
}): OrcamentistaValidatedProjectContext {
  const approvedDecisions = validationDecisions.filter(
    (decision) =>
      decision.phase === phase &&
      (decision.decision_type === 'approve_reading' || decision.decision_type === 'correct_reading')
  );

  return {
    id: `validated-context-from-decisions-${phase}`,
    phase,
    document_ids: documentIds,
    validated_facts: approvedDecisions.map((decision) => decision.corrected_value ?? decision.notes),
    human_corrections: approvedDecisions,
    context_propagation_status: 'validated',
    can_feed_next_phases: approvedDecisions.length > 0,
    can_feed_final_quantities: false,
    validated_at: approvedDecisions.at(-1)?.decided_at ?? new Date(0).toISOString(),
  };
}

export function getNextDocumentRequests(
  session: OrcamentistaProjectReadingSession
): OrcamentistaNextDocumentRequest[] {
  const blockedPhases = session.context_story.blocked_contexts.map((context) => context.phase);
  const currentRequest = buildNextDocumentRequest({
    currentPhase: session.current_phase,
    receivedDocuments: session.received_documents,
    blockedPhases,
    createdAt: session.updated_at,
  });
  const pendingRequests = session.context_story.pending_contexts
    .filter((context) => context.missing_documents.length > 0)
    .map((context) =>
      buildNextDocumentRequest({
        currentPhase: context.phase,
        receivedDocuments: session.received_documents,
        blockedPhases,
        createdAt: session.updated_at,
      })
    );

  return [currentRequest, ...pendingRequests];
}

export function buildTechnicalStorytellingSummary(session: OrcamentistaProjectReadingSession) {
  const validated = session.context_story.validated_contexts
    .flatMap((context) => context.validated_facts)
    .join(' ');
  const pending = session.context_story.pending_contexts
    .flatMap((context) => [
      ...context.pending_questions.map((question) => question.question),
      ...context.missing_documents.map((document) => `Documento pendente: ${document.label}`),
    ])
    .join(' ');
  const blocked = session.context_story.blocked_contexts
    .flatMap((context) => context.block_reasons)
    .join(' ');
  const nextDocuments = session.context_story.next_document_request.requested_documents
    .map((document) => document.label)
    .join(', ');

  return [
    `Dados validados: ${validated || 'nenhum contexto validado.'}`,
    `Pendências: ${pending || 'sem pendências abertas.'}`,
    `Bloqueios: ${blocked || 'sem bloqueios ativos.'}`,
    `Próximo documento recomendado: ${nextDocuments || 'nenhum documento obrigatório pendente.'}`,
  ].join('\n');
}
