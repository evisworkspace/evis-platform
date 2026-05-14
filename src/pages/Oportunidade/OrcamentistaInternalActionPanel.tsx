import { Lock, ShieldAlert, Terminal, Play, CheckCircle2, Loader2, AlertCircle, FileSearch, ListChecks, FlaskConical } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAnalyzeOpportunity, type AnalyzeData } from '../../hooks/useAnalyzeOpportunity';

// ──────────────────────────────────────────────
// OrcamentistaInternalActionPanel — Sprint 3
//
// Painel reaproveitado:
// - Ação principal: "Analisar arquivos para orçamento"
//   chama POST /api/orcamentista/opportunities/:id/analyze.
// - Ação secundária: smoke interno legado, mantido para diagnóstico.
//
// Regras:
// - Read-only do client. Chama API do backend.
// - Nao usa service_role no client. Nao usa supabase/.temp.
// - orcamento_itens permanece bloqueado no backend.
// - canWriteConsolidationToBudget permanece false no backend.
// - Nao fabrica item. Nao estima quantidade. Resposta honesta quando
//   IA backend nao esta conectada.
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
  workspaceId: string;
  selectedFileIds: string[];
  totalFilesAvailable: number;
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


export default function OrcamentistaInternalActionPanel({
  opportunityId,
  workspaceId,
  selectedFileIds,
  totalFilesAvailable,
}: Props) {
  const [view, setView] = useState<OrcamentistaInternalActionPipelineView | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const analyzeMutation = useAnalyzeOpportunity(opportunityId);
  const analyzeResult: AnalyzeData | null = analyzeMutation.data?.data ?? null;
  const analyzeStatus = analyzeMutation.data?.status ?? null;
  const isAnalyzing = analyzeMutation.isPending;
  const analyzeError = analyzeMutation.error?.message ?? null;
  const canAnalyze = selectedFileIds.length > 0 && !isAnalyzing;

  const fetchPipelineView = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orcamentista/pipeline-view?opportunityId=${opportunityId}`);
      const json = await res.json();
      if (res.ok && json.status === 'success') {
        setView(json.data);
      } else {
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

  const handleAnalyze = async () => {
    if (!canAnalyze) return;
    try {
      await analyzeMutation.mutateAsync({ fileIds: selectedFileIds, workspaceId });
    } catch {
      // erro tratado via analyzeMutation.error
    }
  };

  const handleRunSmoke = async () => {
    setRunning(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/orcamentista/manual-run`, {
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
            <FileSearch size={18} className="text-emerald-400" />
            <h3 className="text-base font-bold text-t1">
              Analisar arquivos para orçamento
            </h3>
          </div>
          <p className="mt-1 text-sm text-t3">
            Aciona análise inicial dos arquivos reais selecionados desta oportunidade. Não fabrica
            item de orçamento, não estima quantidade e não grava orçamento oficial. Quando a IA
            backend não está conectada, o retorno é explícito.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-300">
            REAL · ANÁLISE INICIAL
          </span>
          {analyzeStatus && (
            <span className={`rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest border ${
              analyzeStatus === 'backend_ai_not_configured'
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                : 'border-green-500/30 bg-green-500/10 text-green-400'
            }`}>
              STATUS: {analyzeStatus}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCell
          label="Arquivos selecionados"
          value={`${selectedFileIds.length} / ${totalFilesAvailable}`}
        />
        <MetricCell
          label="Itens auto. gerados"
          value={analyzeResult ? String(analyzeResult.items.length) : '—'}
        />
        <MetricCell
          label="Pendências humanas"
          value={analyzeResult ? String(analyzeResult.pendencias_hitl.length) : '—'}
        />
        <MetricCell
          label="IA backend"
          value={
            analyzeStatus === 'backend_ai_not_configured'
              ? 'NÃO CONECTADA'
              : analyzeStatus === 'ai_analyzed'
                ? 'CONECTADA'
                : '—'
          }
        />
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

      {analyzeError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle size={16} />
          <span>{analyzeError}</span>
        </div>
      )}

      {analyzeResult && (
        <div className="space-y-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2">
            <ListChecks size={14} className="text-emerald-300" />
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-200">
              Resultado da análise inicial
            </p>
          </div>

          <div className="space-y-1 rounded border border-white/10 bg-white/5 px-3 py-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">Origem do preview</p>
            <p className="text-xs font-semibold text-white/80">
              {analyzeResult.preview_source === 'metadata_only'
                ? 'Apenas metadados — IA backend não conectada'
                : analyzeResult.preview_source === 'file_text_extracted'
                  ? 'Texto real extraído localmente — sem IA'
                  : 'Arquivo acessado pelo backend — sem IA'}
            </p>
          </div>

          {(analyzeResult.evidences?.length ?? 0) > 0 && (
            <div className="space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-300/70">
                Evidências textuais extraídas
              </p>
              {(analyzeResult.evidences ?? []).map((evidence, index) => (
                <div
                  key={`${evidence.fileId}-${index}`}
                  className="space-y-1 rounded border border-emerald-500/20 bg-emerald-500/5 px-3 py-2"
                >
                  <p className="font-mono text-[9px] uppercase tracking-widest text-emerald-200/60">
                    {evidence.fileName ?? evidence.fileId}
                  </p>
                  <p className="text-[11px] leading-5 text-emerald-50/80">{evidence.content}</p>
                </div>
              ))}
            </div>
          )}

          {analyzeResult.warnings.length > 0 && (
            <div className="space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-widest text-amber-300/70">Avisos</p>
              {analyzeResult.warnings.map((warning) => (
                <div key={warning} className="rounded border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-200">
                  {warning}
                </div>
              ))}
            </div>
          )}

          {analyzeResult.pendencias_hitl.length > 0 && (
            <div className="space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-widest text-blue-300/70">
                Pendências para decisão humana
              </p>
              {analyzeResult.pendencias_hitl.map((pendencia) => (
                <div key={pendencia} className="rounded border border-blue-500/20 bg-blue-500/5 px-3 py-2 text-[11px] text-blue-200">
                  {pendencia}
                </div>
              ))}
            </div>
          )}

          {analyzeResult.items.length === 0 && (
            <p className="rounded border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/50">
              Nenhum item de orçamento foi gerado automaticamente. A inclusão de itens segue manual
              via painel oficial.
            </p>
          )}

          <p className="font-mono text-[9px] uppercase tracking-widest text-white/30">
            snapshot_id: {analyzeResult.snapshot.id} · status: {analyzeResult.snapshot.context_status}
          </p>
        </div>
      )}

      <div className="flex flex-col items-center gap-3 border-t border-b1 pt-6">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={!canAnalyze}
          className="flex w-full max-w-md items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-emerald-500 focus:ring-4 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Analisando arquivos...</span>
            </>
          ) : (
            <>
              <Play size={16} fill="currentColor" />
              <span>
                {selectedFileIds.length > 0
                  ? `Analisar ${selectedFileIds.length} arquivo(s) selecionado(s)`
                  : 'Selecione arquivos para analisar'}
              </span>
            </>
          )}
        </button>
        <p className="text-center text-[11px] text-t4">
          Seleção feita acima, em "Arquivos reais em opportunity_files". Sem mock, sem item
          fabricado, sem escrita oficial.
        </p>
      </div>

      <div className="space-y-4 rounded-lg border border-b1/60 bg-bg/60 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FlaskConical size={14} className="text-purple-400" />
              <h4 className="text-xs font-bold uppercase tracking-widest text-purple-300">
                Smoke interno legado (diagnóstico)
              </h4>
            </div>
            <p className="mt-1 text-[11px] text-t3">
              Mantido para validar persistência Reader/Verifier/HITL sintética. Não processa
              arquivos reais e não afeta orçamento oficial.
            </p>
          </div>
          <span className="rounded-full border border-purple-500/40 bg-purple-500/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-purple-300">
            STAGING · SMOKE
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <MetricCell label="Arquivos" value={fmtCount(view?.total_files)} />
          <MetricCell label="Reader runs" value={fmtCount(view?.total_reader_runs)} />
          <MetricCell label="Verifier runs" value={fmtCount(view?.total_verifier_runs)} />
          <MetricCell label="HITL em aberto" value={fmtCount(view?.open_hitl_issues)} />
          <MetricCell label="Context status" value={fmtStatus(view?.latestContextStatus)} />
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

        <button
          type="button"
          onClick={handleRunSmoke}
          disabled={running || loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-xs font-bold text-purple-200 transition-all hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Executando smoke...</span>
            </>
          ) : (
            <>
              <Terminal size={14} />
              <span>Rodar smoke interno do pipeline</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
