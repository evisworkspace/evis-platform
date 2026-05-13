import { Lock, ShieldAlert, Terminal } from 'lucide-react';

// ──────────────────────────────────────────────
// OrcamentistaInternalActionPanel — Fase 4D.2
//
// Painel interno minimo para acompanhar a acao manual controlada
// do Orcamentista IA em staging.
//
// Regras:
// - Read-only. Nao executa chamada remota a partir do client.
// - Nao usa service_role. Nao usa supabase/.temp.
// - Botao "Rodar Orcamentista IA" fica desabilitado nesta fase.
//   Execucao ocorre via CLI server-side (manualRunCli / pipelineViewCli).
// - orcamento_itens permanece bloqueado.
// - canWriteConsolidationToBudget permanece false.
// ──────────────────────────────────────────────

export type OrcamentistaInternalActionPipelineView = {
  total_files: number | null;
  total_reader_runs: number | null;
  total_verifier_runs: number | null;
  open_hitl_issues: number | null;
  latestContextStatus: string | null;
  canWriteConsolidationToBudget: false;
  touchedBudgetItemsTable: false;
};

interface Props {
  opportunityId: string;
  pipelineView?: OrcamentistaInternalActionPipelineView | null;
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/40">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold text-white/80">{value}</div>
    </div>
  );
}

export default function OrcamentistaInternalActionPanel({ opportunityId, pipelineView }: Props) {
  const view = pipelineView ?? null;

  const fmtCount = (value: number | null) =>
    typeof value === 'number' ? String(value) : '—';
  const fmtStatus = (value: string | null) =>
    value && value.length > 0 ? value : '—';

  return (
    <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-purple-400" />
            <span className="text-sm font-bold text-purple-300">
              Ação interna — Orçamentista IA
            </span>
          </div>
          <p className="mt-0.5 text-xs text-white/40">
            Status do pipeline staging desta oportunidade. Leitura apenas.
          </p>
        </div>
        <span className="rounded border border-purple-500/40 bg-purple-500/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-purple-300">
          STAGING · USO INTERNO
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        <MetricCell label="Arquivos" value={fmtCount(view?.total_files ?? null)} />
        <MetricCell label="Reader runs" value={fmtCount(view?.total_reader_runs ?? null)} />
        <MetricCell label="Verifier runs" value={fmtCount(view?.total_verifier_runs ?? null)} />
        <MetricCell label="HITL em aberto" value={fmtCount(view?.open_hitl_issues ?? null)} />
        <MetricCell label="Context status" value={fmtStatus(view?.latestContextStatus ?? null)} />
        <MetricCell label="Oportunidade" value={opportunityId.slice(0, 8) || '—'} />
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
          <Lock size={12} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="text-[11px] leading-snug text-amber-300">
            Consolidação automática em orçamento bloqueada nesta fase.
            <span className="ml-1 font-mono text-[10px] text-amber-300/70">
              canWriteConsolidationToBudget=false
            </span>
          </p>
        </div>
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
          <ShieldAlert size={12} className="mt-0.5 shrink-0 text-red-400" />
          <p className="text-[11px] leading-snug text-red-300">
            Escrita em orcamento_itens bloqueada no client staging guard.
            <span className="ml-1 font-mono text-[10px] text-red-300/70">
              touchedBudgetItemsTable=false
            </span>
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          disabled
          aria-disabled
          title="Execução disponível apenas via CLI/server-side nesta fase."
          className="w-full cursor-not-allowed rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/40"
        >
          Rodar Orçamentista IA
        </button>
        <p className="text-center text-[11px] text-white/40">
          Execução disponível apenas via CLI/server-side nesta fase.
        </p>
      </div>

      <div className="rounded-lg border border-white/5 bg-white/3 px-3 py-2">
        <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
          Como executar
        </p>
        <p className="mt-1 text-[11px] leading-snug text-white/40">
          Manual Run e Pipeline View rodam apenas server-side em staging, com variáveis de ambiente
          seguras já injetadas na sessão e service_role rotacionada. Service role nunca trafega
          pelo browser.
        </p>
      </div>
    </div>
  );
}
