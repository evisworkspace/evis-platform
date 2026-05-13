import { Lock, ShieldAlert, Terminal, Play, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

// ──────────────────────────────────────────────
// OrcamentistaInternalActionPanel — smoke interno controlado
//
// Regras:
// - Read-only do client. Chama API do backend.
// - Nao usa service_role no client. Nao usa supabase/.temp.
// - orcamento_itens permanece bloqueado no backend.
// - canWriteConsolidationToBudget permanece false no backend.
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
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col justify-between rounded-lg border border-purple-500/20 bg-purple-500/5 px-4 py-3 transition-colors hover:border-purple-500/40">
      <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-purple-300/60">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-purple-100">{value}</div>
    </div>
  );
}

export default function OrcamentistaInternalActionPanel({ opportunityId }: Props) {
  const [view, setView] = useState<OrcamentistaInternalActionPipelineView | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchPipelineView = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orcamentista/pipeline-view?opportunityId=${opportunityId}`);
      const json = await res.json();
      if (res.ok && json.status === 'success') {
        setView(json.data);
      } else {
        // Ignora erros de "not found" ou pipeline não iniciado, pois a view pode ser nula inicialmente
        if (json.status !== 'not_found' && json.status !== 'validation_error') {
          setError(json.message || 'Erro ao carregar Pipeline View');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError('Falha de rede ao carregar Pipeline View');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelineView();
  }, [opportunityId]);

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/orcamentista/manual-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId,
          mode: 'manual_test',
          marker: 'UI_MANUAL_RUN'
        })
      });
      const json = await res.json();

      if (res.ok && json.status === 'success') {
        setSuccess('Smoke interno concluído com sucesso.');
        await fetchPipelineView();
      } else {
        setError(json.message || 'Erro ao executar smoke interno');
      }
    } catch (err: any) {
      console.error(err);
      setError('Falha de rede ao executar smoke interno');
    } finally {
      setRunning(false);
    }
  };

  const fmtCount = (value: number | null | undefined) =>
    typeof value === 'number' ? String(value) : '—';
  const fmtStatus = (value: string | null | undefined) =>
    value && value.length > 0 ? value : '—';

  return (
    <div className="rounded-xl border border-b1 bg-s1 p-6 space-y-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal size={18} className="text-purple-400" />
            <h3 className="text-base font-bold text-t1">
              Smoke interno — pipeline Orçamentista
            </h3>
          </div>
          <p className="mt-1 text-sm text-t3">
            Aciona um fluxo controlado e sintético para testar persistência Reader/Verifier/HITL. Não processa os arquivos reais da oportunidade e não afeta o orçamento oficial.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full border border-purple-500/40 bg-purple-500/15 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-purple-300">
            STAGING · SMOKE INTERNO
          </span>
          {view?.latestContextStatus && (
            <span className={`rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest border ${
              view.latestContextStatus === 'blocked'
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                : 'border-green-500/30 bg-green-500/10 text-green-400'
            }`}>
              GATE: {view.latestContextStatus}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
        <MetricCell label="Arquivos" value={fmtCount(view?.total_files)} />
        <MetricCell label="Reader runs" value={fmtCount(view?.total_reader_runs)} />
        <MetricCell label="Verifier runs" value={fmtCount(view?.total_verifier_runs)} />
        <MetricCell label="HITL em aberto" value={fmtCount(view?.open_hitl_issues)} />
        <MetricCell label="Context status" value={fmtStatus(view?.latestContextStatus)} />
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
        <div className="flex flex-1 flex-col justify-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <Lock size={14} className="text-amber-400" />
            <p className="text-xs font-medium text-amber-300">
              Consolidação automática no orçamento oficial: <span className="font-bold">BLOQUEADA</span>
            </p>
          </div>
          <p className="pl-6 font-mono text-[10px] text-amber-300/60">
            canWriteConsolidationToBudget = false
          </p>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldAlert size={14} className="text-red-400" />
            <p className="text-xs font-medium text-red-300">
              Proteção ativa na tabela <span className="font-mono bg-red-500/20 px-1 py-0.5 rounded text-[10px]">orcamento_itens</span>
            </p>
          </div>
          <p className="pl-6 font-mono text-[10px] text-red-300/60">
            Produção não acessada · touchedBudgetItemsTable = false
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}

      <div className="flex flex-col items-center gap-3 border-t border-b1 pt-6">
        <button
          type="button"
          onClick={handleRun}
          disabled={running || loading}
          className="flex w-full max-w-sm items-center justify-center gap-2 rounded-lg bg-purple-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-purple-500 focus:ring-4 focus:ring-purple-500/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Executando smoke...</span>
            </>
          ) : (
            <>
              <Play size={16} fill="currentColor" />
              <span>Rodar smoke interno do pipeline</span>
            </>
          )}
        </button>
        <p className="text-center text-[11px] text-t4">
          Smoke server-side controlado. Não é execução real completa do Orçamentista IA.
        </p>
      </div>
    </div>
  );
}
