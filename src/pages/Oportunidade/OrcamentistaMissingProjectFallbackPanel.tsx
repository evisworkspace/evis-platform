import { useMemo, useState } from 'react';
import { AlertTriangle, Ban, CircleDollarSign, ClipboardCheck, FileQuestion, ShieldAlert } from 'lucide-react';
import {
  OrcamentistaFallbackDecisionType,
  OrcamentistaMissingProjectFallback,
} from '../../types';
import { buildMockEstimatedScopeFallbacks } from '../../lib/orcamentista/estimatedScopeFallbackMock';
import {
  canFeedExecution,
  canFeedPreliminaryBudget,
  canFeedProposalWithWarnings,
  getFallbackDecisionLabel,
  getScopeOriginLabel,
  summarizeEstimatedFallbacks,
} from '../../lib/orcamentista/estimatedScopeUtils';
import { getMissingProjectPolicyForDiscipline } from '../../lib/orcamentista/missingProjectPolicy';

const DECISIONS: OrcamentistaFallbackDecisionType[] = [
  'estimate_by_reference',
  'request_project',
  'manual_allowance',
  'exclude_scope',
  'keep_pending',
];

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

function flagClass(active: boolean) {
  return active
    ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
    : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-200';
}

function yesNo(value: boolean) {
  return value ? 'Sim' : 'Não';
}

function StatCard({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string | number;
  tone?: 'neutral' | 'green' | 'amber' | 'red' | 'blue';
}) {
  const tones = {
    neutral: 'border-white/10 bg-white/[0.03] text-t2',
    green: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-200',
    amber: 'border-amber-500/20 bg-amber-500/5 text-amber-200',
    red: 'border-red-500/20 bg-red-500/5 text-red-200',
    blue: 'border-blue-500/20 bg-blue-500/5 text-blue-200',
  };

  return (
    <div className={`rounded-lg border px-4 py-3 ${tones[tone]}`}>
      <p className="font-mono text-[9px] font-bold uppercase tracking-widest opacity-70">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

function DecisionButtons({
  fallback,
  onDecision,
}: {
  fallback: OrcamentistaMissingProjectFallback;
  onDecision: (id: string, decision: OrcamentistaFallbackDecisionType) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {DECISIONS.map((decision) => {
        const enabled = fallback.fallback_mode.includes(decision);
        return (
          <button
            key={decision}
            type="button"
            disabled={!enabled}
            onClick={() => onDecision(fallback.id, decision)}
            className={`rounded border px-2 py-1 text-[10px] font-semibold transition ${
              fallback.user_decision === decision
                ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200'
                : enabled
                  ? 'border-white/10 bg-white/5 text-t3 hover:bg-white/10'
                  : 'cursor-not-allowed border-white/5 bg-white/[0.02] text-t4 opacity-50'
            }`}
          >
            {getFallbackDecisionLabel(decision)}
          </button>
        );
      })}
    </div>
  );
}

export default function OrcamentistaMissingProjectFallbackPanel() {
  const initialFallbacks = useMemo(() => buildMockEstimatedScopeFallbacks(), []);
  const [fallbacks, setFallbacks] = useState(initialFallbacks);
  const summary = useMemo(() => summarizeEstimatedFallbacks(fallbacks), [fallbacks]);

  function setDecision(id: string, decision: OrcamentistaFallbackDecisionType) {
    setFallbacks((current) =>
      current.map((fallback) =>
        fallback.id === id
          ? {
              ...fallback,
              user_decision: decision,
            }
          : fallback
      )
    );
  }

  return (
    <section className="space-y-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5 text-amber-300" />
            <h2 className="text-sm font-bold text-t1">Projetos ausentes e estimativas controladas</h2>
          </div>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-t3">
            Quando uma disciplina não possui projeto, o EVIS pode seguir com estimativa preliminar,
            mantendo aviso, HITL e bloqueio de consolidação executiva.
          </p>
        </div>
        <span className="w-fit rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-amber-200">
          Fase 3C · mock local
        </span>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <StatCard label="Com projeto" value={summary.projects_available} tone="green" />
        <StatCard label="Ausentes" value={summary.projects_missing} tone="amber" />
        <StatCard label="Estimáveis" value={summary.fallback_allowed_count} tone="blue" />
        <StatCard label="Bloqueios" value={summary.blocked_scopes_count} tone="red" />
        <StatCard label="HITL" value={summary.hitl_required_count} tone="amber" />
        <StatCard label="Preliminar" value={formatCurrency(summary.preliminary_estimated_total)} tone="neutral" />
      </div>

      <div className="grid gap-3">
        {fallbacks.map((fallback) => {
          const policy = getMissingProjectPolicyForDiscipline(fallback.discipline);
          const canPrelim = canFeedPreliminaryBudget(fallback);
          const canProposal = canFeedProposalWithWarnings(fallback);
          const canExecution = canFeedExecution(fallback);

          return (
            <article key={fallback.id} className="space-y-3 rounded-lg border border-white/10 bg-s1 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-t4">
                    {fallback.discipline}
                  </p>
                  <h3 className="mt-1 text-sm font-bold text-t1">{policy.label}</h3>
                  <p className="mt-1 text-xs leading-5 text-t3">{policy.warning_message}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded border px-2 py-1 font-mono text-[9px] ${flagClass(!fallback.project_available)}`}>
                    Projeto: {yesNo(fallback.project_available)}
                  </span>
                  <span className={`rounded border px-2 py-1 font-mono text-[9px] ${flagClass(!fallback.fallback_allowed)}`}>
                    Fallback: {yesNo(fallback.fallback_allowed)}
                  </span>
                  <span className={`rounded border px-2 py-1 font-mono text-[9px] ${flagClass(fallback.requires_hitl)}`}>
                    HITL: {yesNo(fallback.requires_hitl)}
                  </span>
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-4">
                <div className={`rounded-lg border px-3 py-2 text-[11px] ${flagClass(!canPrelim)}`}>
                  <ClipboardCheck className="mb-1 h-4 w-4" />
                  Orçamento preliminar: {yesNo(canPrelim)}
                </div>
                <div className={`rounded-lg border px-3 py-2 text-[11px] ${flagClass(!canProposal)}`}>
                  <AlertTriangle className="mb-1 h-4 w-4" />
                  Proposta com aviso: {yesNo(canProposal)}
                </div>
                <div className={`rounded-lg border px-3 py-2 text-[11px] ${flagClass(!canExecution)}`}>
                  <Ban className="mb-1 h-4 w-4" />
                  Execução: {yesNo(canExecution)}
                </div>
                <div className={`rounded-lg border px-3 py-2 text-[11px] ${flagClass(fallback.blocks_final_consolidation)}`}>
                  <ShieldAlert className="mb-1 h-4 w-4" />
                  Consolidação final: {fallback.blocks_final_consolidation ? 'Bloqueia' : 'Não bloqueia'}
                </div>
              </div>

              {fallback.estimate_basis.length > 0 && (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-t3">Base de estimativa</p>
                  <div className="grid gap-2 md:grid-cols-2">
                    {fallback.estimate_basis.map((basis) => (
                      <div key={`${fallback.id}-${basis.type}-${basis.label}`} className="rounded border border-white/10 bg-white/[0.03] px-3 py-2">
                        <p className="text-xs font-semibold text-t2">{basis.label}</p>
                        <p className="mt-1 text-[11px] leading-5 text-t3">{basis.description}</p>
                        <p className="mt-1 font-mono text-[9px] text-t4">{basis.source_reference}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {fallback.estimated_items.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-t3">Itens estimados</p>
                  {fallback.estimated_items.map((item) => (
                    <div key={item.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold text-t2">{item.description}</p>
                          <p className="mt-1 font-mono text-[9px] text-t4">
                            {item.estimated_quantity} {item.unit} × {formatCurrency(item.estimated_unit_cost)} ={' '}
                            {formatCurrency(item.estimated_total)}
                          </p>
                        </div>
                        <span className="w-fit rounded border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-cyan-200">
                          {getScopeOriginLabel(item.origin_type)}
                        </span>
                      </div>
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        <p className="rounded border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] leading-5 text-amber-200">
                          Estimado sem projeto. Não é item identificado em projeto. Revisar após recebimento do projeto executivo.
                        </p>
                        <p className="rounded border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] leading-5 text-t3">
                          {item.warning_message}
                        </p>
                      </div>
                      <p className="mt-2 font-mono text-[9px] text-t4">{item.source_reference}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs leading-5 text-red-200">
                  Sem item estimado: disciplina bloqueada ou pendente até recebimento do projeto.
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-t3">Ações mockadas</p>
                <DecisionButtons fallback={fallback} onDecision={setDecision} />
                <p className="font-mono text-[9px] text-t4">
                  Decisão local: {getFallbackDecisionLabel(fallback.user_decision)}. Não consolidado no orçamento oficial nesta fase.
                </p>
              </div>
            </article>
          );
        })}
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] leading-5 text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Estimado sem projeto. Revisar após recebimento do projeto executivo.</span>
        </div>
        <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-[11px] leading-5 text-red-200">
          <Ban className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Não é item identificado em projeto e não pode alimentar execução.</span>
        </div>
        <div className="flex items-start gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-[11px] leading-5 text-cyan-200">
          <CircleDollarSign className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Pode orientar orçamento preliminar e proposta futura apenas com ressalva.</span>
        </div>
        <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] leading-5 text-t3">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Não consolidado no orçamento oficial nesta fase.</span>
        </div>
      </div>
    </section>
  );
}
