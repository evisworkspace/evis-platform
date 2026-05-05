import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock3,
  GitBranch,
  Lock,
  Send,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { OrcamentistaAgentDispatchJob, OrcamentistaAgentDispatchStatus, OrcamentistaHitlIssueSeverity } from '../../types';
import { mockAgentDispatchJobs } from '../../lib/orcamentista/agentDispatchMock';
import {
  canGeneratePreviewFromAgentOutputs,
  canRunDomainAgent,
  getAgentBlockerReasons,
  getAgentDispatchStatusLabel,
  getAgentOutputStatusLabel,
  getBlockedDispatchJobs,
  getCompletedAgentOutputs,
  getRunnableDispatchJobs,
  groupDispatchJobsByStatus,
  summarizeAgentDispatch,
} from '../../lib/orcamentista/agentDispatchUtils';

function statusClass(status: OrcamentistaAgentDispatchStatus) {
  switch (status) {
    case 'completed':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
    case 'released':
      return 'border-blue-500/30 bg-blue-500/10 text-blue-300';
    case 'running_mock':
      return 'border-purple-500/30 bg-purple-500/10 text-purple-300';
    case 'blocked':
      return 'border-red-500/30 bg-red-500/10 text-red-300';
    case 'waiting':
    default:
      return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
  }
}

function severityClass(severity: OrcamentistaHitlIssueSeverity) {
  switch (severity) {
    case 'critica':
      return 'border-red-500/30 bg-red-500/10 text-red-300';
    case 'alta':
      return 'border-orange-500/30 bg-orange-500/10 text-orange-300';
    case 'media':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
    default:
      return 'border-blue-500/30 bg-blue-500/10 text-blue-300';
  }
}

function StatusIcon({ status }: { status: OrcamentistaAgentDispatchStatus }) {
  if (status === 'completed') return <CheckCircle2 className="h-4 w-4" />;
  if (status === 'blocked') return <Ban className="h-4 w-4" />;
  if (status === 'released' || status === 'running_mock') return <Send className="h-4 w-4" />;
  return <Clock3 className="h-4 w-4" />;
}

function scoreLabel(score?: number) {
  if (score === undefined) return 'sem output';
  return `${Math.round(score * 100)}%`;
}

function summaryCard(label: string, value: number, className: string) {
  return (
    <div className={`rounded-lg border px-4 py-3 ${className}`}>
      <p className="font-mono text-[9px] font-bold uppercase tracking-widest opacity-80">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

function JobMiniFacts({ job }: { job: OrcamentistaAgentDispatchJob }) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      <div className="rounded border border-white/10 bg-white/[0.03] px-2 py-1.5">
        <p className="font-mono text-[8px] uppercase tracking-widest text-t4">Páginas</p>
        <p className="text-xs font-bold text-t2">{job.source_page_ids.length}</p>
      </div>
      <div className="rounded border border-white/10 bg-white/[0.03] px-2 py-1.5">
        <p className="font-mono text-[8px] uppercase tracking-widest text-t4">Reader</p>
        <p className="text-xs font-bold text-t2">{job.source_reader_run_ids.length}</p>
      </div>
      <div className="rounded border border-white/10 bg-white/[0.03] px-2 py-1.5">
        <p className="font-mono text-[8px] uppercase tracking-widest text-t4">HITL</p>
        <p className="text-xs font-bold text-t2">{job.source_hitl_issue_ids.length}</p>
      </div>
    </div>
  );
}

export default function OrcamentistaAgentDispatchPanel() {
  const [selectedId, setSelectedId] = useState(mockAgentDispatchJobs[0]?.id ?? '');
  const summary = useMemo(() => summarizeAgentDispatch(mockAgentDispatchJobs), []);
  const grouped = useMemo(() => groupDispatchJobsByStatus(mockAgentDispatchJobs), []);
  const blockedJobs = useMemo(() => getBlockedDispatchJobs(mockAgentDispatchJobs), []);
  const runnableJobs = useMemo(() => getRunnableDispatchJobs(mockAgentDispatchJobs), []);
  const completedOutputs = useMemo(() => getCompletedAgentOutputs(mockAgentDispatchJobs), []);
  const canGeneratePreview = canGeneratePreviewFromAgentOutputs(mockAgentDispatchJobs);
  const selected =
    mockAgentDispatchJobs.find((job) => job.id === selectedId) ?? mockAgentDispatchJobs[0];

  if (!selected) return null;

  return (
    <section className="space-y-4 rounded-lg border border-blue-500/20 bg-blue-500/5 p-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-blue-300" />
            <h2 className="text-sm font-bold text-t1">Dispatch para agentes especialistas</h2>
          </div>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-t3">
            Encaminhamento mockado das leituras auditadas e decisões HITL para agentes técnicos.
            Dispatch não gera orçamento oficial, não grava itens e não consolida valores.
          </p>
        </div>
        <span className="w-fit rounded border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-blue-200">
          Fase 2G · Mock local
        </span>
      </header>

      <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
        <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-t4">
          Documento → Página → Reader/Verifier → HITL → Agentes especialistas → Preview → Consolidação futura
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {summaryCard('Agentes', summary.total_agents, 'border-white/10 bg-white/[0.03] text-t1')}
        {summaryCard('Liberados', summary.released_agents, 'border-blue-500/20 bg-blue-500/5 text-blue-200')}
        {summaryCard('Bloqueados', summary.blocked_agents, 'border-red-500/20 bg-red-500/5 text-red-200')}
        {summaryCard('Concluídos', summary.completed_agents, 'border-emerald-500/20 bg-emerald-500/5 text-emerald-200')}
        {summaryCard('Aguardando', summary.waiting_agents, 'border-amber-500/20 bg-amber-500/5 text-amber-200')}
        {summaryCard('HITL pendente', summary.hitl_pending_agents, 'border-purple-500/20 bg-purple-500/5 text-purple-200')}
      </div>

      <div className="grid gap-4 lg:grid-cols-[390px_1fr]">
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="font-mono text-[8px] uppercase tracking-widest text-t4">Ready</p>
              <p className="text-sm font-bold text-blue-200">{runnableJobs.length}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="font-mono text-[8px] uppercase tracking-widest text-t4">Blocked</p>
              <p className="text-sm font-bold text-red-200">{blockedJobs.length}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="font-mono text-[8px] uppercase tracking-widest text-t4">Outputs</p>
              <p className="text-sm font-bold text-emerald-200">{completedOutputs.length}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="font-mono text-[8px] uppercase tracking-widest text-t4">Preview</p>
              <p className="text-sm font-bold text-amber-200">{canGeneratePreview ? 'OK' : 'BLOQ'}</p>
            </div>
          </div>

          <div className="space-y-2">
            {mockAgentDispatchJobs.map((job) => {
              const output = job.output;
              const blockerReasons = getAgentBlockerReasons(job);
              return (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => setSelectedId(job.id)}
                  className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                    selected.id === job.id
                      ? 'border-blue-500/40 bg-blue-500/10'
                      : 'border-white/10 bg-white/[0.03] hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-t1">{job.agent_name}</p>
                      <p className="mt-0.5 text-[11px] text-t3">{job.discipline}</p>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded border px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest ${statusClass(job.status)}`}>
                      <StatusIcon status={job.status} />
                      {getAgentDispatchStatusLabel(job.status)}
                    </span>
                  </div>
                  <JobMiniFacts job={job} />
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className={`rounded border px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest ${
                      canRunDomainAgent(job)
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                        : 'border-white/10 bg-white/5 text-t3'
                    }`}>
                      {canRunDomainAgent(job) ? 'pode executar' : 'não executa'}
                    </span>
                    <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest text-t3">
                      confiança {scoreLabel(output?.confidence_score)}
                    </span>
                    {blockerReasons.slice(0, 1).map((reason) => (
                      <span key={reason} className="max-w-full truncate rounded border border-red-500/20 bg-red-500/5 px-2 py-0.5 text-[10px] text-red-200">
                        {reason}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <article className="space-y-4 rounded-lg border border-white/10 bg-s1 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-t4">
                {selected.agent_id} · {selected.discipline}
              </p>
              <h3 className="mt-1 text-base font-bold text-t1">{selected.agent_name}</h3>
              <p className="mt-1 text-xs leading-5 text-t3">{selected.input_summary.evidence_summary}</p>
            </div>
            <span className={`inline-flex w-fit items-center gap-1 rounded border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-widest ${statusClass(selected.status)}`}>
              <StatusIcon status={selected.status} />
              {getAgentDispatchStatusLabel(selected.status)}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-t4">Execução</p>
              <p className="mt-1 text-sm font-bold text-t1">
                {canRunDomainAgent(selected) ? 'Liberada' : 'Bloqueada/aguardando'}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-t4">Output</p>
              <p className="mt-1 text-sm font-bold text-t1">
                {selected.output ? getAgentOutputStatusLabel(selected.output.status) : 'Não iniciado'}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-t4">Preview</p>
              <p className="mt-1 text-sm font-bold text-t1">
                {selected.output?.blocks_preview || selected.blockers.some((blocker) => blocker.blocks_preview)
                  ? 'Bloqueia'
                  : 'Não bloqueia'}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-t4">Consolidação</p>
              <p className="mt-1 text-sm font-bold text-t1">
                {selected.output?.blocks_consolidation ||
                selected.blockers.some((blocker) => blocker.blocks_consolidation)
                  ? 'Bloqueia'
                  : 'Sem bloqueio local'}
              </p>
            </div>
          </div>

          <section className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-t3">Entrada do agente</h4>
            <p className="mt-2 text-xs leading-5 text-t2">{selected.input_summary.evidence_summary}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selected.input_summary.source_references.map((reference) => (
                <span key={reference} className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-t3">
                  {reference}
                </span>
              ))}
            </div>
            <ul className="mt-3 space-y-1 text-[11px] leading-5 text-t3">
              {selected.input_summary.constraints.map((constraint) => (
                <li key={constraint}>- {constraint}</li>
              ))}
            </ul>
          </section>

          {selected.blockers.length > 0 && (
            <section className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-200">
                <Lock className="h-4 w-4" />
                Motivos de bloqueio / espera
              </div>
              <div className="mt-3 space-y-2">
                {selected.blockers.map((blocker) => (
                  <div key={blocker.id} className="rounded border border-white/10 bg-white/[0.03] p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded border px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest ${severityClass(blocker.severity)}`}>
                        {blocker.severity}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-widest text-t4">
                        {blocker.source_type} · {blocker.source_id}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-t2">{blocker.reason}</p>
                    <p className="mt-1 text-[11px] text-t4">
                      Dispatch: {blocker.blocks_dispatch ? 'bloqueia' : 'não bloqueia'} · Preview:{' '}
                      {blocker.blocks_preview ? 'bloqueia' : 'não bloqueia'} · Consolidação:{' '}
                      {blocker.blocks_consolidation ? 'bloqueia' : 'não bloqueia'}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {selected.output ? (
            <section className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-t3">Output técnico mockado</h4>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-emerald-300">Achados</p>
                  <div className="mt-2 space-y-2">
                    {selected.output.findings.map((finding) => (
                      <div key={finding.id} className="rounded border border-white/10 bg-white/[0.03] p-2">
                        <p className="text-xs font-bold text-t1">{finding.title}</p>
                        <p className="mt-1 text-[11px] leading-5 text-t3">{finding.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-blue-300">
                    Serviços sugeridos
                  </p>
                  <div className="mt-2 space-y-2">
                    {selected.output.suggested_services.map((service) => (
                      <div key={service.id} className="rounded border border-white/10 bg-white/[0.03] p-2">
                        <p className="text-xs font-bold text-t1">{service.description}</p>
                        <p className="mt-1 text-[11px] leading-5 text-t3">
                          {service.unit} · {service.quantity_basis}
                        </p>
                        <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-amber-200">
                          não oficial
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {(selected.output.risks.length > 0 ||
                selected.output.hitl_requests.length > 0 ||
                selected.output.missing_information.length > 0) && (
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                    <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-amber-300">Riscos</p>
                    <ul className="mt-2 space-y-1 text-[11px] leading-5 text-t3">
                      {selected.output.risks.map((risk) => (
                        <li key={risk.id}>- {risk.description}</li>
                      ))}
                      {selected.output.risks.length === 0 && <li>- Sem risco mockado.</li>}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
                    <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-purple-300">HITL gerado</p>
                    <ul className="mt-2 space-y-1 text-[11px] leading-5 text-t3">
                      {selected.output.hitl_requests.map((request) => (
                        <li key={request.id}>- {request.title}</li>
                      ))}
                      {selected.output.hitl_requests.length === 0 && <li>- Nenhum HITL novo.</li>}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-t4">Pendências</p>
                    <ul className="mt-2 space-y-1 text-[11px] leading-5 text-t3">
                      {selected.output.missing_information.map((info) => (
                        <li key={info}>- {info}</li>
                      ))}
                      {selected.output.missing_information.length === 0 && <li>- Sem pendência mockada.</li>}
                    </ul>
                  </div>
                </div>
              )}
            </section>
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-xs leading-5 text-t3">
              Nenhum output técnico mockado foi gerado para este agente. O status atual indica bloqueio,
              dependência ou liberação futura sem execução real.
            </div>
          )}
        </article>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2 text-[11px] leading-5 text-blue-200">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Output de agente é prévia técnica e não orçamento oficial.</span>
        </div>
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] leading-5 text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Nenhum item foi gravado em orcamento_itens ou consolidado.</span>
        </div>
        <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-[11px] leading-5 text-red-200">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Consolidação será fase futura e depende de revisão humana.</span>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-t1">Gate global de agentes</p>
            <p className="mt-1 text-xs text-t3">
              Status: {grouped.completed.length} concluídos, {grouped.blocked.length} bloqueados,
              {grouped.waiting.length} aguardando. Preview consolidado mockado:{' '}
              {canGeneratePreview ? 'sem bloqueio local' : 'bloqueado por gates atuais'}.
            </p>
          </div>
          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-t4 opacity-70"
          >
            <Lock className="h-4 w-4" />
            Gerar preview consolidado — fase futura
          </button>
        </div>
      </div>
    </section>
  );
}
