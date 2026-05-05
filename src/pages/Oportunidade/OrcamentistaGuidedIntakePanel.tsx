import { useMemo, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileQuestion,
  FileText,
  GitBranch,
  LockKeyhole,
  Route,
} from 'lucide-react';
import {
  OrcamentistaReadingHitlQuestion,
  OrcamentistaReadingPhase,
  OrcamentistaReadingValidationDecision,
} from '../../types';
import { ORCAMENTISTA_READING_PHASE_ORDER } from '../../lib/orcamentista/guidedProjectIntakePolicy';
import { MOCK_PROJECT_READING_SESSION } from '../../lib/orcamentista/readingHitlContextMock';
import {
  applyReadingValidationDecision,
  buildTechnicalStorytellingSummary,
  getBlockingReadingHitls,
  getContextPropagationStatus,
  getNextDocumentRequests,
  getOpenReadingHitls,
  groupHitlQuestionsByPhase,
  summarizeReadingSession,
} from '../../lib/orcamentista/readingHitlContextUtils';

const PHASE_LABELS: Record<OrcamentistaReadingPhase, string> = {
  arquitetonico_implantacao: 'Arquitetônico / implantação',
  sondagem_topografia: 'Sondagem / topografia',
  estrutural_fundacao: 'Fundação',
  estrutural_superestrutura: 'Superestrutura',
  lajes_cobertura_caixa_dagua: 'Lajes / cobertura / caixa d’água',
  hidrossanitario: 'Hidrossanitário',
  eletrico_dados_automacao: 'Elétrico / dados / automação',
  ppci_gas_climatizacao: 'PPCI / gás / climatização',
  memorial_acabamentos: 'Memorial de acabamentos',
  compatibilizacao: 'Compatibilização',
  quantitativos: 'Quantitativos',
  custos: 'Custos',
};

const DECISION_LABELS: Record<OrcamentistaReadingValidationDecision['decision_type'], string> = {
  approve_reading: 'Validar valor detectado',
  correct_reading: 'Corrigir manualmente',
  request_document: 'Solicitar novo documento',
  activate_missing_project_fallback: 'Marcar como estimado',
  block_reading: 'Manter bloqueado',
  keep_context_pending: 'Manter pendente',
};

const ACTIONS: Array<{
  type: OrcamentistaReadingValidationDecision['decision_type'];
  label: string;
}> = [
  { type: 'approve_reading', label: 'Validar valor detectado' },
  { type: 'correct_reading', label: 'Corrigir manualmente' },
  { type: 'request_document', label: 'Solicitar novo documento' },
  { type: 'activate_missing_project_fallback', label: 'Marcar como estimado' },
  { type: 'block_reading', label: 'Manter bloqueado' },
];

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function getDetectedValue(question: OrcamentistaReadingHitlQuestion) {
  const detectedValues: Record<string, string> = {
    'hitl-reading-pile-quantity-21': '21 estacas',
    'hitl-reading-c25-r25-nomenclature': 'C25/R25',
    'hitl-reading-p6-nasce': 'P6 = nasce',
    'hitl-reading-p23-corte': 'P23 em corte, fora da tabela principal',
    'hitl-reading-sondagem-ausente': 'Sondagem/topografia ausente',
    'hitl-reading-relatorio-esforcos-ausente': 'Relatório de esforços ausente',
    'hitl-reading-fck-divergente': 'Nota geral C30 x tabela C25',
  };

  return detectedValues[question.id] ?? 'Valor depende de validação humana';
}

function getSuggestedCorrection(question: OrcamentistaReadingHitlQuestion) {
  const corrections: Record<string, string> = {
    'hitl-reading-pile-quantity-21': '21 estacas validadas pela tabela principal',
    'hitl-reading-c25-r25-nomenclature': 'C25 = estaca Ø25 cm neste contrato',
    'hitl-reading-p6-nasce': 'P6 nasce - manter pendente até superestrutura',
    'hitl-reading-p23-corte': 'P23 em corte - não consolidar em quantitativo final',
    'hitl-reading-sondagem-ausente': 'Solicitar sondagem/topografia antes de consolidar fundação',
    'hitl-reading-relatorio-esforcos-ausente': 'Solicitar relatório de esforços da fundação',
    'hitl-reading-fck-divergente': 'Confirmar fck por elemento antes de quantitativos',
  };

  return corrections[question.id] ?? getDetectedValue(question);
}

function getQuestionTitle(question: OrcamentistaReadingHitlQuestion) {
  return question.question.replace(/\.$/, '');
}

function getRecommendedDecision(question: OrcamentistaReadingHitlQuestion) {
  if (question.id.includes('sondagem') || question.id.includes('relatorio')) return 'request_document';
  if (question.id.includes('p23')) return 'keep_context_pending';
  if (question.id.includes('fck')) return 'correct_reading';
  if (question.id.includes('c25')) return 'correct_reading';
  return question.suggested_decisions[0] ?? 'keep_context_pending';
}

function getPhaseStatusClass(status: 'complete' | 'current' | 'pending' | 'blocked') {
  const classes = {
    complete: 'border-brand-green/30 bg-brand-green/10 text-brand-green',
    current: 'border-brand-blue/40 bg-brand-blue/10 text-brand-blue',
    pending: 'border-white/10 bg-white/3 text-t3',
    blocked: 'border-red-500/30 bg-red-500/10 text-red-300',
  };

  return classes[status];
}

function getPhaseStatusLabel(status: 'complete' | 'current' | 'pending' | 'blocked') {
  const labels = {
    complete: 'Completa',
    current: 'Atual',
    pending: 'Pendente',
    blocked: 'Bloqueada',
  };

  return labels[status];
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/3 px-3 py-2">
      <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-t3">{label}</p>
      <p className="mt-1 text-sm font-semibold text-t1">{value}</p>
    </div>
  );
}

function ContextList({
  title,
  tone,
  children,
}: {
  title: string;
  tone: 'green' | 'amber' | 'red';
  children: ReactNode;
}) {
  const toneClass = {
    green: 'border-brand-green/20 bg-brand-green/10 text-brand-green',
    amber: 'border-brand-amber/20 bg-brand-amber/10 text-brand-amber',
    red: 'border-red-500/20 bg-red-500/10 text-red-300',
  };

  return (
    <div className="rounded-lg border border-white/10 bg-white/3">
      <div className="border-b border-white/10 px-4 py-3">
        <span className={`rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${toneClass[tone]}`}>
          {title}
        </span>
      </div>
      <div className="space-y-3 p-4 text-sm text-t2">{children}</div>
    </div>
  );
}

export default function OrcamentistaGuidedIntakePanel() {
  const [session, setSession] = useState(MOCK_PROJECT_READING_SESSION);
  const [localActions, setLocalActions] = useState<Record<string, string>>({});

  const summary = useMemo(() => summarizeReadingSession(session), [session]);
  const openHitls = useMemo(() => getOpenReadingHitls(session), [session]);
  const blockingHitls = useMemo(() => getBlockingReadingHitls(session), [session]);
  const hitlsByPhase = useMemo(() => groupHitlQuestionsByPhase(openHitls), [openHitls]);
  const propagation = useMemo(() => getContextPropagationStatus(session), [session]);
  const nextRequests = useMemo(() => getNextDocumentRequests(session), [session]);
  const storyLines = useMemo(() => buildTechnicalStorytellingSummary(session).split('\n'), [session]);

  const allRequestedDocuments = uniqueStrings(
    nextRequests.flatMap((request) => request.requested_documents.map((document) => document.label))
  );
  const expectedDocuments = uniqueStrings(session.expected_documents.map((document) => document.label));
  const receivedDocuments = session.received_documents.map((document) => document.file_name);
  const missingDocuments = uniqueStrings(
    session.context_story.pending_contexts.flatMap((context) =>
      context.missing_documents.map((document) => document.label)
    )
  );
  const outOfOrderDocuments = session.received_documents.filter((document) => document.out_of_order);
  const blockedPhases = session.context_story.blocked_contexts.map((context) => context.phase);
  const validatedPhases = session.context_story.validated_contexts.map((context) => context.phase);

  function handleAction(
    question: OrcamentistaReadingHitlQuestion,
    decisionType: OrcamentistaReadingValidationDecision['decision_type']
  ) {
    const decision: OrcamentistaReadingValidationDecision = {
      id: `local-decision-${question.id}-${decisionType}`,
      question_id: question.id,
      phase: question.phase,
      decision_type: decisionType,
      corrected_value:
        decisionType === 'approve_reading' || decisionType === 'correct_reading'
          ? getSuggestedCorrection(question)
          : undefined,
      notes: `${DECISION_LABELS[decisionType]} aplicado localmente no painel 3D-C para: ${question.question}`,
      decided_by: 'human',
      decided_at: new Date().toISOString(),
    };

    setSession((currentSession) => applyReadingValidationDecision(currentSession, decision));
    setLocalActions((currentActions) => ({
      ...currentActions,
      [question.id]: DECISION_LABELS[decisionType],
    }));
  }

  return (
    <section className="rounded-lg border border-white/10 bg-s1 p-5 text-t1">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-brand-green">
            <Route size={14} />
            Intake guiado
          </div>
          <h2 className="text-xl font-extrabold text-t1">Intake guiado e contexto técnico</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-t3">
            O EVIS guia a ordem de leitura, valida dúvidas por etapa e impede que erro de uma
            prancha contamine as próximas fases.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MiniMetric label="Fases" value={summary.total_phases} />
          <MiniMetric label="HITLs abertos" value={summary.open_hitls_count} />
          <MiniMetric label="Bloqueantes" value={summary.blocking_hitls_count} />
          <MiniMetric label="Pode avançar" value={summary.can_advance_phase ? 'Sim' : 'Não'} />
        </div>
      </div>

      <div className="mt-5 grid gap-5">
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="mb-4 flex items-center gap-2">
            <GitBranch size={16} className="text-brand-blue" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-t2">Timeline de leitura</h3>
          </div>

          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {ORCAMENTISTA_READING_PHASE_ORDER.map((phase, index) => {
              const status =
                phase === session.current_phase
                  ? 'current'
                  : blockedPhases.includes(phase) || session.phase_status[phase] === 'blocked'
                    ? 'blocked'
                    : validatedPhases.includes(phase) || session.phase_status[phase] === 'validated'
                      ? 'complete'
                      : 'pending';

              return (
                <div
                  key={phase}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${getPhaseStatusClass(status)}`}
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[9px] font-bold uppercase tracking-widest opacity-70">
                      {String(index + 1).padStart(2, '0')}
                    </p>
                    <p className="truncate text-xs font-semibold">{PHASE_LABELS[phase]}</p>
                  </div>
                  <span className="shrink-0 rounded bg-black/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
                    {getPhaseStatusLabel(status)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="mb-4 flex items-center gap-2">
              <FileText size={16} className="text-brand-green" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-t2">Documentos</h3>
            </div>

            <div className="grid gap-3 text-sm">
              <div>
                <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-t3">
                  Esperados
                </p>
                <div className="flex flex-wrap gap-2">
                  {expectedDocuments.map((label) => (
                    <span key={label} className="rounded border border-white/10 bg-white/3 px-2 py-1 text-xs text-t2">
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-t3">
                  Recebidos
                </p>
                <div className="space-y-2">
                  {receivedDocuments.map((label) => (
                    <div key={label} className="rounded border border-brand-green/20 bg-brand-green/10 px-3 py-2 text-xs text-brand-green">
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-t3">
                  Ausentes
                </p>
                <div className="space-y-2">
                  {missingDocuments.map((label) => (
                    <div key={label} className="rounded border border-brand-amber/20 bg-brand-amber/10 px-3 py-2 text-xs text-brand-amber">
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {outOfOrderDocuments.length > 0 && (
                <div>
                  <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-t3">
                    Fora de ordem
                  </p>
                  <div className="space-y-2">
                    {outOfOrderDocuments.map((document) => (
                      <div key={document.id} className="rounded border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                        {document.file_name}
                        <span className="ml-2 text-red-300">
                          aguardando {PHASE_LABELS[document.expected_phase]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-t3">
                  Próximo documento solicitado
                </p>
                <div className="rounded border border-brand-blue/20 bg-brand-blue/10 px-3 py-2 text-xs text-brand-blue">
                  {allRequestedDocuments.join(', ') || 'Nenhum documento obrigatório pendente.'}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="mb-4 flex items-center gap-2">
              <ClipboardCheck size={16} className="text-brand-amber" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-t2">Storytelling técnico</h3>
            </div>

            <div className="space-y-3">
              {storyLines.map((line) => {
                const [label, ...rest] = line.split(':');
                return (
                  <div key={line} className="rounded-lg border border-white/10 bg-white/3 p-3">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-t3">{label}</p>
                    <p className="mt-1 text-sm leading-6 text-t2">{rest.join(':').trim()}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-lg border border-white/10 bg-white/3 p-3 text-xs text-t3">
              <p>Status de propagação: <span className="font-semibold text-t1">{propagation.status}</span></p>
              <p className="mt-1">
                Quantitativos finais: {propagation.can_feed_quantities ? 'liberados' : 'bloqueados'} · Custos:{' '}
                {propagation.can_feed_costs ? 'liberados' : 'bloqueados'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="mb-4 flex items-center gap-2">
            <FileQuestion size={16} className="text-brand-amber" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-t2">HITLs da leitura</h3>
          </div>

          <div className="space-y-4">
            {Object.entries(hitlsByPhase).map(([phase, questions]) => (
              <div key={phase} className="rounded-lg border border-white/10 bg-white/3">
                <div className="border-b border-white/10 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-t2">
                    {PHASE_LABELS[phase as OrcamentistaReadingPhase]}
                  </p>
                </div>

                <div className="divide-y divide-white/10">
                  {(questions ?? []).map((question) => {
                    const isBlocking = blockingHitls.some((hitl) => hitl.id === question.id);
                    const recommendedDecision = getRecommendedDecision(question);

                    return (
                      <div key={question.id} className="p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-t1">{getQuestionTitle(question)}</p>
                            <p className="mt-1 text-xs leading-5 text-t3">{question.reason}</p>
                          </div>
                          <span className={`shrink-0 rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            isBlocking
                              ? 'border-red-500/30 bg-red-500/10 text-red-300'
                              : 'border-brand-amber/30 bg-brand-amber/10 text-brand-amber'
                          }`}
                          >
                            {isBlocking ? 'Bloqueante' : 'Aberto'}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                          <MiniMetric label="Valor detectado" value={getDetectedValue(question)} />
                          <MiniMetric label="Decisão recomendada" value={DECISION_LABELS[recommendedDecision]} />
                          <MiniMetric label="Bloqueia fase" value={question.blocks_context_propagation ? 'Sim' : 'Não'} />
                          <MiniMetric
                            label="Bloqueia consolidação"
                            value={question.required_before_phase === 'quantitativos' || question.blocks_context_propagation ? 'Sim' : 'Não'}
                          />
                        </div>

                        <div className="mt-3">
                          <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-t3">
                            Opções
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {question.suggested_decisions.map((decision) => (
                              <span key={decision} className="rounded border border-white/10 bg-white/3 px-2 py-1 text-[11px] text-t2">
                                {DECISION_LABELS[decision]}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {ACTIONS.map((action) => (
                            <button
                              key={action.type}
                              type="button"
                              onClick={() => handleAction(question, action.type)}
                              className="rounded border border-white/10 bg-white/3 px-3 py-2 text-xs font-semibold text-t2 transition hover:border-brand-green/30 hover:bg-brand-green/10 hover:text-brand-green"
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>

                        {localActions[question.id] && (
                          <p className="mt-3 rounded border border-brand-blue/20 bg-brand-blue/10 px-3 py-2 text-xs text-brand-blue">
                            Decisão local aplicada: {localActions[question.id]}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <ContextList title="Contexto validado" tone="green">
            {session.context_story.validated_contexts.map((context) => (
              <div key={context.id}>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-green">
                  {PHASE_LABELS[context.phase]}
                </p>
                <ul className="space-y-1 text-xs leading-5 text-t2">
                  {context.validated_facts.map((fact) => (
                    <li key={fact} className="flex gap-2">
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-brand-green" />
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </ContextList>

          <ContextList title="Contexto pendente" tone="amber">
            {session.context_story.pending_contexts.map((context) => (
              <div key={context.id}>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-amber">
                  {PHASE_LABELS[context.phase]}
                </p>
                <ul className="space-y-1 text-xs leading-5 text-t2">
                  {context.pending_questions.map((question) => (
                    <li key={question.id} className="flex gap-2">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0 text-brand-amber" />
                      <span>{question.question}</span>
                    </li>
                  ))}
                  {context.missing_documents.map((document) => (
                    <li key={document.id} className="flex gap-2">
                      <FileQuestion size={14} className="mt-0.5 shrink-0 text-brand-amber" />
                      <span>{document.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </ContextList>

          <ContextList title="Contexto bloqueado" tone="red">
            {session.context_story.blocked_contexts.map((context) => (
              <div key={context.id}>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-red-300">
                  {PHASE_LABELS[context.phase]}
                </p>
                <ul className="space-y-1 text-xs leading-5 text-t2">
                  {context.block_reasons.map((reason) => (
                    <li key={reason} className="flex gap-2">
                      <LockKeyhole size={14} className="mt-0.5 shrink-0 text-red-300" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </ContextList>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {[
            'Contexto pendente não alimenta quantitativos finais.',
            'Correções humanas substituem leituras ambíguas.',
            'Documento fora de ordem pode ser lido, mas bloqueia consolidação até completar contexto.',
          ].map((warning) => (
            <div key={warning} className="rounded-lg border border-brand-amber/20 bg-brand-amber/10 p-3 text-xs leading-5 text-brand-amber">
              {warning}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
