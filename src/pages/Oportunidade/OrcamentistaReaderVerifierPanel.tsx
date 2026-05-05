import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  Bot,
  CheckCircle2,
  FileSearch,
  GitCompareArrows,
  Lock,
  ShieldAlert,
} from 'lucide-react';
import {
  OrcamentistaReaderEvidenceItem,
  OrcamentistaReaderVerifierSummary,
  OrcamentistaVerifierDisagreement,
} from '../../types';
import { mockReaderVerifierSummaries } from '../../lib/orcamentista/readerVerifierMock';
import {
  getAgreementBand,
  getReaderConfidenceBand,
  getVerifierStatusLabel,
  groupDisagreementsBySeverity,
  shouldBlockReaderConsolidation,
  shouldDispatchToAgents,
  shouldRequireReaderHitl,
  summarizeReaderVerifierRuns,
} from '../../lib/orcamentista/readerVerifierUtils';

function scoreClass(score: number, kind: 'confidence' | 'agreement') {
  const band = kind === 'confidence' ? getReaderConfidenceBand(score) : getAgreementBand(score);
  if (band === 'HIGH') return 'text-emerald-300';
  if (band === 'MEDIUM') return 'text-amber-300';
  return 'text-red-300';
}

function statusClass(summary: OrcamentistaReaderVerifierSummary) {
  if (shouldBlockReaderConsolidation(summary)) return 'border-red-500/30 bg-red-500/10 text-red-300';
  if (shouldRequireReaderHitl(summary)) return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
  if (shouldDispatchToAgents(summary)) return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  return 'border-white/10 bg-white/5 text-t3';
}

function severityClass(severity: OrcamentistaVerifierDisagreement['severity']) {
  switch (severity) {
    case 'critical':
      return 'border-red-500/30 bg-red-500/10 text-red-300';
    case 'high':
      return 'border-orange-500/30 bg-orange-500/10 text-orange-300';
    case 'medium':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
    default:
      return 'border-blue-500/30 bg-blue-500/10 text-blue-300';
  }
}

function pageStatusLabel(summary: OrcamentistaReaderVerifierSummary) {
  if (shouldBlockReaderConsolidation(summary)) return 'Bloqueada';
  if (shouldRequireReaderHitl(summary)) return 'HITL';
  if (shouldDispatchToAgents(summary)) return 'Liberada p/ agentes';
  return 'Em revisão';
}

function EvidenceRow({ item }: { item: OrcamentistaReaderEvidenceItem }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-t2">{item.label}</span>
        <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-emerald-300">
          {item.evidence_status}
        </span>
        <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-widest text-t3">
          {item.evidence_type}
        </span>
        {item.quantity && (
          <span className="rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 font-mono text-[8px] text-blue-300">
            {item.quantity}
          </span>
        )}
      </div>
      <p className="mt-1 text-[11px] leading-5 text-t3">{item.description}</p>
      <p className="mt-1 font-mono text-[9px] text-t4">
        {item.source_reference} · conf. {Math.round(item.confidence_score * 100)}%
      </p>
    </div>
  );
}

export default function OrcamentistaReaderVerifierPanel() {
  const runs = mockReaderVerifierSummaries;
  const summary = useMemo(() => summarizeReaderVerifierRuns(runs), [runs]);
  const [selectedId, setSelectedId] = useState(runs[0]?.id ?? '');
  const selected = runs.find((run) => run.id === selectedId) ?? runs[0];
  const groupedDisagreements = groupDisagreementsBySeverity(selected.verifier_run.disagreement_points);

  return (
    <section className="space-y-4 rounded-lg border border-purple-500/20 bg-purple-500/5 p-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <GitCompareArrows className="h-5 w-5 text-purple-300" />
            <h2 className="text-sm font-bold text-t1">Reader + Verifier</h2>
          </div>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-t3">
            Leitura primária e validação independente antes dos agentes especialistas. Esta camada
            transforma páginas renderizadas em evidências auditáveis; não gera orçamento, não grava
            itens oficiais e não consolida prévia.
          </p>
        </div>
        <span className="w-fit rounded border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-purple-200">
          Fase 2E · Mock
        </span>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-t4">Páginas lidas</p>
          <p className="mt-1 text-lg font-bold text-t1">{summary.totalPages}</p>
        </div>
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-blue-300">Verificadas</p>
          <p className="mt-1 text-lg font-bold text-blue-200">{summary.verifiedPages}</p>
        </div>
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-emerald-300">Liberadas</p>
          <p className="mt-1 text-lg font-bold text-emerald-200">{summary.dispatchReadyPages}</p>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-amber-300">HITL</p>
          <p className="mt-1 text-lg font-bold text-amber-200">{summary.hitlPages}</p>
        </div>
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-red-300">Bloqueadas</p>
          <p className="mt-1 text-lg font-bold text-red-200">{summary.blockedPages}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="space-y-2">
          {runs.map((run) => (
            <button
              key={run.id}
              type="button"
              onClick={() => setSelectedId(run.id)}
              className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                selected.id === run.id
                  ? 'border-purple-500/40 bg-purple-500/10'
                  : 'border-white/10 bg-white/[0.03] hover:bg-white/5'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-t1">
                    {run.reader_run.document_name} · pág. {run.reader_run.page_number}
                  </p>
                  <p className="mt-0.5 text-[11px] text-t3">{run.reader_run.page_label}</p>
                </div>
                <span className={`shrink-0 rounded border px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest ${statusClass(run)}`}>
                  {pageStatusLabel(run)}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded border border-white/10 bg-white/[0.03] px-2 py-1">
                  <span className="text-t4">Reader</span>
                  <span className={`ml-2 font-mono font-bold ${scoreClass(run.reader_run.confidence_score, 'confidence')}`}>
                    {Math.round(run.reader_run.confidence_score * 100)}%
                  </span>
                </div>
                <div className="rounded border border-white/10 bg-white/[0.03] px-2 py-1">
                  <span className="text-t4">Verifier</span>
                  <span className={`ml-2 font-mono font-bold ${scoreClass(run.verifier_run.agreement_score, 'agreement')}`}>
                    {Math.round(run.verifier_run.agreement_score * 100)}%
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <article className="space-y-4 rounded-lg border border-white/10 bg-s1 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-t4">
                {selected.reader_run.page_type} · {selected.reader_run.discipline}
              </p>
              <h3 className="mt-1 text-base font-bold text-t1">
                {selected.reader_run.document_name} · página {selected.reader_run.page_number}
              </h3>
              <p className="mt-1 text-xs text-t3">{selected.reader_run.page_label}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-[9px] text-t3">
                confidence_score{' '}
                <strong className={scoreClass(selected.reader_run.confidence_score, 'confidence')}>
                  {Math.round(selected.reader_run.confidence_score * 100)}%
                </strong>
              </span>
              <span className="rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-[9px] text-t3">
                agreement_score{' '}
                <strong className={scoreClass(selected.verifier_run.agreement_score, 'agreement')}>
                  {Math.round(selected.verifier_run.agreement_score * 100)}%
                </strong>
              </span>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-200">
                <CheckCircle2 className="h-4 w-4" />
                Itens identificados
              </div>
              <p className="mt-1 text-[11px] text-t3">Fatos com evidência direta na página.</p>
              <p className="mt-2 text-lg font-bold text-emerald-200">{selected.reader_run.identified_items.length}</p>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-200">
                <AlertTriangle className="h-4 w-4" />
                Itens inferidos
              </div>
              <p className="mt-1 text-[11px] text-t3">Hipóteses marcadas, nunca tratadas como fato.</p>
              <p className="mt-2 text-lg font-bold text-amber-200">{selected.reader_run.inferred_items.length}</p>
            </div>
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-red-200">
                <ShieldAlert className="h-4 w-4" />
                Pendências
              </div>
              <p className="mt-1 text-[11px] text-t3">Informações faltantes antes de consolidar.</p>
              <p className="mt-2 text-lg font-bold text-red-200">{selected.reader_run.missing_information.length}</p>
            </div>
          </div>

          <section className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-t3">Leitura primária · identificado</h4>
            {selected.reader_run.identified_items.map((item) => (
              <EvidenceRow key={item.id} item={item} />
            ))}
          </section>

          <section className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-t3">Inferido · não é fato</h4>
            {selected.reader_run.inferred_items.map((item) => (
              <div key={item.id} className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-amber-200">{item.element}</span>
                  <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-amber-300">
                    INFERRED
                  </span>
                  <span className="font-mono text-[9px] text-t4">
                    conf. {Math.round(item.confidence_score * 100)}%
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-5 text-t3">{item.reasoning}</p>
              </div>
            ))}
          </section>

          <section className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-t3">Pendente · requer decisão</h4>
            {selected.reader_run.missing_information.map((item) => (
              <div key={item.id} className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-red-200">{item.description}</span>
                  <span className={`rounded border px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest ${severityClass(item.severity)}`}>
                    {item.severity}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-5 text-t3">{item.impact}</p>
                <p className="mt-1 font-mono text-[9px] text-t4">{item.suggested_action}</p>
              </div>
            ))}
          </section>

          <section className="space-y-2">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-t3">
              <GitCompareArrows className="h-4 w-4" />
              Verificação independente
            </h4>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-t2">
                  {getVerifierStatusLabel(selected.verifier_run.verification_status)}
                </span>
                <span className={statusClass(selected) + ' rounded border px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest'}>
                  {pageStatusLabel(selected)}
                </span>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-t4">Confirmados</p>
                  <p className="mt-1 text-xs text-t3">{selected.verifier_run.confirmed_items.join(', ') || '-'}</p>
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-t4">Disputados</p>
                  <p className="mt-1 text-xs text-t3">{selected.verifier_run.disputed_items.join(', ') || '-'}</p>
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-t4">Possíveis omissões</p>
                  <p className="mt-1 text-xs text-t3">{selected.verifier_run.omitted_possible_items.join(', ') || '-'}</p>
                </div>
              </div>
            </div>

            {(['critical', 'high', 'medium', 'low'] as const).flatMap((severity) =>
              groupedDisagreements[severity].map((point) => (
                <div key={point.id} className={`rounded-lg border px-3 py-2 ${severityClass(point.severity)}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold">{point.field}</span>
                    <span className="rounded border border-current/30 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest">
                      {point.severity}
                    </span>
                    {point.requires_hitl && <span className="font-mono text-[8px] uppercase tracking-widest">HITL</span>}
                    {point.blocks_consolidation && <span className="font-mono text-[8px] uppercase tracking-widest">Bloqueia</span>}
                  </div>
                  <p className="mt-1 text-[11px] leading-5">{point.reason}</p>
                  <p className="mt-1 font-mono text-[9px] opacity-80">
                    Reader: {point.reader_value} · Verifier: {point.verifier_value}
                  </p>
                </div>
              ))
            )}
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-t3">
                  <Bot className="h-4 w-4" />
                  Decisão de dispatch
                </h4>
                <p className="mt-1 text-xs leading-5 text-t3">{selected.dispatch_decision.dispatch_reason}</p>
                {selected.dispatch_decision.blocked_reason && (
                  <p className="mt-1 text-xs leading-5 text-red-300">
                    {selected.dispatch_decision.blocked_reason}
                  </p>
                )}
              </div>
              <span className={`w-fit rounded border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-widest ${statusClass(selected)}`}>
                {selected.dispatch_decision.dispatch_status}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selected.dispatch_decision.target_agents.map((agent) => (
                <span
                  key={agent}
                  className="rounded border border-purple-500/20 bg-purple-500/10 px-2 py-1 text-[10px] text-purple-200"
                >
                  {agent}
                </span>
              ))}
            </div>
          </section>
        </article>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] leading-5 text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Identificado não é inferido. Inferência nunca pode ser tratada como fato.</span>
        </div>
        <div className="flex items-start gap-2 rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2 text-[11px] leading-5 text-purple-200">
          <FileSearch className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Prévia de leitura não é orçamento oficial e não grava em orcamento_itens.</span>
        </div>
        <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-[11px] leading-5 text-red-200">
          <Ban className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Consolidação será fase futura, com HITL e aprovação explícita.</span>
        </div>
      </div>

      <button
        type="button"
        disabled
        className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold uppercase tracking-widest text-t4"
      >
        <Lock className="h-4 w-4" />
        Enviar para agentes especialistas — fase futura
      </button>
    </section>
  );
}
