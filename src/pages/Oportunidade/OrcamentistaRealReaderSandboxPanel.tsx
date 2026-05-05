import { useMemo, useState } from 'react';
import { Ban, FileJson, GitCompareArrows, Lock, ShieldCheck, TriangleAlert } from 'lucide-react';
import { runRealReaderSandbox } from '../../lib/orcamentista/realReaderSandbox';
import { ingestManualReaderOutput } from '../../lib/orcamentista/manualReaderIngestion';
import {
  extractManualReaderCriticalDimensions,
  extractManualReaderHitlRequests,
  getManualIngestionBlockingReasons,
  getManualIngestionStatusLabel,
  getManualReaderDispatchDecision,
  getManualReaderTechnicalWarnings,
  getManualReaderTraceabilityWarnings,
  isValidJsonString,
  summarizeManualReaderEvaluation,
} from '../../lib/orcamentista/manualReaderIngestionUtils';
import { OrcamentistaManualReaderIngestionResult } from '../../types';

function statusClass(active: boolean) {
  return active
    ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
    : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-200';
}

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="max-h-72 overflow-auto rounded-lg border border-white/10 bg-black/20 p-3 text-[10px] leading-5 text-t3">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function ManualList({
  title,
  items,
  empty,
}: {
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <p className="mb-2 font-mono text-[9px] font-bold uppercase tracking-widest text-t4">{title}</p>
      {items.length > 0 ? (
        <ul className="space-y-1 text-xs leading-5 text-t2">
          {items.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-t4">{empty}</p>
      )}
    </div>
  );
}

function compactLabelDescription(label: string, description: string) {
  return label === description ? label : `${label}: ${description}`;
}

function readDisplayString(source: unknown, keys: string[]) {
  if (typeof source !== 'object' || source === null || Array.isArray(source)) return '';
  const record = source as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  return '';
}

export default function OrcamentistaRealReaderSandboxPanel() {
  const sandbox = useMemo(() => runRealReaderSandbox(), []);
  const [manualJson, setManualJson] = useState('');
  const [manualResult, setManualResult] = useState<OrcamentistaManualReaderIngestionResult | null>(null);
  const normalized = sandbox.normalized_output;
  const safety = sandbox.safety_runner_result;
  const manualSummary = manualResult ? summarizeManualReaderEvaluation(manualResult) : null;
  const manualHitls = manualResult ? extractManualReaderHitlRequests(manualResult) : [];
  const manualCriticalDimensions = manualResult ? extractManualReaderCriticalDimensions(manualResult) : [];
  const manualBlockingReasons = manualResult ? getManualIngestionBlockingReasons(manualResult) : [];
  const manualTraceabilityWarnings = manualResult ? getManualReaderTraceabilityWarnings(manualResult) : [];
  const manualTechnicalWarnings = manualResult ? getManualReaderTechnicalWarnings(manualResult) : [];
  const manualDispatch = manualResult ? getManualReaderDispatchDecision(manualResult) : null;
  const manualNormalized = manualResult?.normalized_output;

  function handleManualEvaluation() {
    setManualResult(ingestManualReaderOutput({ jsonString: manualJson }));
  }

  return (
    <section className="space-y-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-cyan-300" />
            <h2 className="text-sm font-bold text-t1">Primeira leitura real controlada</h2>
          </div>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-t3">
            Sandbox de uma página isolada. O pacote está pronto para execução manual em motor externo;
            esta tela não chama IA, não processa PDF inteiro e não grava no banco.
          </p>
        </div>
        <span className="w-fit rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-cyan-200">
          Fase 3B · manual model run ready
        </span>
      </header>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-t4">Página</p>
          <p className="mt-1 text-sm font-bold text-t1">{sandbox.page_number}</p>
          <p className="mt-0.5 truncate text-[11px] text-t3">{sandbox.file_name}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-t4">Reader</p>
          <p className="mt-1 font-mono text-sm font-bold text-cyan-200">{sandbox.reader_motor}</p>
          <p className="mt-0.5 text-[11px] text-t3">prompt package gerado</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-t4">Verifier</p>
          <p className="mt-1 font-mono text-sm font-bold text-purple-200">{sandbox.verifier_motor}</p>
          <p className="mt-0.5 text-[11px] text-t3">obrigatório se houver risco</p>
        </div>
        <div className={`rounded-lg border px-4 py-3 ${statusClass(sandbox.blocks_consolidation)}`}>
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest">Gate</p>
          <p className="mt-1 text-sm font-bold">
            {sandbox.blocks_consolidation ? 'Bloqueado' : 'Sem bloqueio'}
          </p>
          <p className="mt-0.5 text-[11px] opacity-80">{sandbox.status}</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className={`rounded-lg border px-3 py-2 text-xs ${statusClass(sandbox.requires_verifier)}`}>
          <div className="flex items-center gap-2 font-bold">
            <GitCompareArrows className="h-4 w-4" />
            Verifier
          </div>
          <p className="mt-1">{sandbox.requires_verifier ? 'Requerido' : 'Não requerido'}</p>
        </div>
        <div className={`rounded-lg border px-3 py-2 text-xs ${statusClass(sandbox.requires_hitl)}`}>
          <div className="flex items-center gap-2 font-bold">
            <TriangleAlert className="h-4 w-4" />
            HITL
          </div>
          <p className="mt-1">{sandbox.requires_hitl ? 'Obrigatório' : 'Sem pendência'}</p>
        </div>
        <div className={`rounded-lg border px-3 py-2 text-xs ${statusClass(!sandbox.allowed_to_dispatch)}`}>
          <div className="flex items-center gap-2 font-bold">
            <ShieldCheck className="h-4 w-4" />
            Dispatch
          </div>
          <p className="mt-1">{sandbox.allowed_to_dispatch ? 'Liberado' : 'Bloqueado'}</p>
        </div>
        <div className={`rounded-lg border px-3 py-2 text-xs ${statusClass(safety.confidence_cap_applied)}`}>
          <div className="flex items-center gap-2 font-bold">
            <Ban className="h-4 w-4" />
            Confiança
          </div>
          <p className="mt-1">
            {Math.round(normalized.confidence_score * 100)}% → {Math.round(safety.capped_confidence_score * 100)}%
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-t3">Prompt package do Reader</h3>
          <JsonBlock
            value={{
              id: sandbox.prompt_package.id,
              reader_motor: sandbox.prompt_package.reader_motor,
              source_quality: sandbox.prompt_package.source_quality,
              safety_notes: sandbox.prompt_package.safety_notes,
              user_prompt: sandbox.prompt_package.user_prompt,
            }}
          />
        </article>

        <article className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-t3">Output normalizado</h3>
          <JsonBlock
            value={{
              identified_items: normalized.identified_items,
              inferred_items: normalized.inferred_items,
              missing_information: normalized.missing_information,
              risks: normalized.risks,
              hitl_requests: normalized.hitl_requests,
              critical_dimensions: normalized.critical_dimensions,
            }}
          />
        </article>
      </div>

      <article className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-t3">Safety gates e sanity checks</h3>
        <JsonBlock
          value={{
            allowed_to_dispatch: sandbox.allowed_to_dispatch,
            requires_verifier: sandbox.requires_verifier,
            requires_hitl: sandbox.requires_hitl,
            blocks_consolidation: sandbox.blocks_consolidation,
            safety_gate_result: sandbox.safety_gate_result,
            dimensional_checks: sandbox.dimensional_checks,
            dispatch_block_reasons: safety.dispatch_block_reasons,
          }}
        />
      </article>

      <article className="space-y-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-t1">Colar JSON real do Reader</h3>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-t3">
              Cole aqui o JSON retornado por um motor externo. O EVIS apenas valida, normaliza e
              aplica os gates locais; nenhuma chamada de IA e nenhuma escrita em banco são executadas.
            </p>
          </div>
          <span
            className={`w-fit rounded border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${
              isValidJsonString(manualJson)
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
            }`}
          >
            {isValidJsonString(manualJson) ? 'JSON parseável' : 'Aguardando JSON válido'}
          </span>
        </div>

        <textarea
          value={manualJson}
          onChange={(event) => setManualJson(event.target.value)}
          spellCheck={false}
          placeholder={`{
  "page_summary": "Página de fundação com estacas...",
  "source_quality": "raster_pdf_clear",
  "confidence_score": 0.82,
  "identified_items": [],
  "inferred_items": [],
  "missing_information": [],
  "risks": [],
  "hitl_requests": [],
  "critical_dimensions": []
}`}
          className="min-h-64 w-full rounded-lg border border-white/10 bg-black/20 p-3 font-mono text-xs leading-5 text-t2 outline-none transition placeholder:text-t4 focus:border-cyan-500/40"
        />

        <button
          type="button"
          onClick={handleManualEvaluation}
          className="w-full rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-xs font-bold uppercase tracking-widest text-cyan-200 transition hover:bg-cyan-500/20"
        >
          Avaliar JSON colado
        </button>

        {manualResult && manualSummary && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <div className={`rounded-lg border px-4 py-3 ${statusClass(manualResult.parse_status !== 'evaluated_dispatch_ready')}`}>
                <p className="font-mono text-[9px] font-bold uppercase tracking-widest">Parse</p>
                <p className="mt-1 text-sm font-bold">{getManualIngestionStatusLabel(manualResult.parse_status)}</p>
              </div>
              <div className={`rounded-lg border px-4 py-3 ${statusClass(!manualResult.normalized_output)}`}>
                <p className="font-mono text-[9px] font-bold uppercase tracking-widest">Normalização</p>
                <p className="mt-1 text-sm font-bold">{manualResult.normalized_output ? 'Aplicada' : 'Não aplicada'}</p>
              </div>
              <div className={`rounded-lg border px-4 py-3 ${statusClass(manualResult.requires_verifier)}`}>
                <p className="font-mono text-[9px] font-bold uppercase tracking-widest">Verifier</p>
                <p className="mt-1 text-sm font-bold">{manualResult.requires_verifier ? 'Requerido' : 'Não requerido'}</p>
              </div>
              <div className={`rounded-lg border px-4 py-3 ${statusClass(manualResult.blocks_consolidation)}`}>
                <p className="font-mono text-[9px] font-bold uppercase tracking-widest">Consolidação</p>
                <p className="mt-1 text-sm font-bold">{manualResult.blocks_consolidation ? 'Bloqueada' : 'Sem bloqueio'}</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <div className={`rounded-lg border px-3 py-2 text-xs ${statusClass(manualResult.requires_hitl)}`}>
                <div className="flex items-center gap-2 font-bold">
                  <TriangleAlert className="h-4 w-4" />
                  HITL
                </div>
                <p className="mt-1">{manualResult.requires_hitl ? 'Obrigatório' : 'Sem pendência'}</p>
              </div>
              <div className={`rounded-lg border px-3 py-2 text-xs ${statusClass(!manualResult.allowed_to_dispatch)}`}>
                <div className="flex items-center gap-2 font-bold">
                  <ShieldCheck className="h-4 w-4" />
                  Dispatch
                </div>
                <p className="mt-1">{manualResult.allowed_to_dispatch ? 'Liberado' : 'Bloqueado'}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-t2">
                <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-t4">Cotas críticas</p>
                <p className="mt-1 font-bold text-t1">{manualSummary.critical_dimensions_count}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-t2">
                <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-t4">Sanity checks</p>
                <p className="mt-1 font-bold text-t1">{manualSummary.dimensional_checks_count}</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <ManualList
                title="Itens identificados"
                empty="Nenhum item identificado."
                items={
                  manualNormalized?.identified_items.map((item) =>
                    compactLabelDescription(item.label, item.description)
                  ) ?? []
                }
              />
              <ManualList
                title="Itens inferidos"
                empty="Nenhuma inferência."
                items={
                  manualNormalized?.inferred_items.map((item) =>
                    compactLabelDescription(item.element, item.reasoning)
                  ) ?? []
                }
              />
              <ManualList
                title="Informações pendentes"
                empty="Nenhuma informação pendente."
                items={manualNormalized?.missing_information.map((item) => `${item.description} (${item.severity})`) ?? []}
              />
              <ManualList
                title="Riscos"
                empty="Nenhum risco informado."
                items={manualNormalized?.risks.map((risk) => `${risk.description} (${risk.severity})`) ?? []}
              />
              <ManualList
                title="Cotas críticas"
                empty="Nenhuma cota crítica."
                items={manualCriticalDimensions.map(
                  (dimension) =>
                    `${dimension.label}: ${dimension.value}${dimension.unit} · ${dimension.source_reference || dimension.source_text}`
                )}
              />
              <ManualList
                title="HITLs"
                empty="Nenhum HITL gerado."
                items={manualHitls.map((hitl) => {
                  const requiredDecision = readDisplayString(hitl, ['required_decision', 'question']);
                  return `Decisão: ${requiredDecision} · Motivo: ${hitl.reason} (${hitl.severity})`;
                })}
              />
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <article className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-widest text-t3">Safety gate result</h4>
                <JsonBlock
                  value={{
                    safety_gate_result: manualResult.safety_gate_result,
                    allowed_to_dispatch: manualResult.allowed_to_dispatch,
                    requires_verifier: manualResult.requires_verifier,
                    requires_hitl: manualResult.requires_hitl,
                    blocks_consolidation: manualResult.blocks_consolidation,
                    dispatch_decision: manualDispatch,
                  }}
                />
              </article>

              <article className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-widest text-t3">Dimensional checks</h4>
                <JsonBlock value={manualResult.dimensional_checks} />
              </article>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              <ManualList
                title="Bloqueios principais"
                empty="Nenhum bloqueio principal ativo."
                items={manualBlockingReasons}
              />
              <ManualList
                title="Avisos agrupados de rastreabilidade"
                empty="Nenhum aviso de rastreabilidade."
                items={manualTraceabilityWarnings}
              />
              <ManualList
                title="Warnings técnicos detalhados"
                empty="Nenhum warning técnico adicional."
                items={manualTechnicalWarnings}
              />
            </div>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-4">
          {[
            'Este JSON foi colado manualmente.',
            'Nenhuma chamada de IA foi executada pelo EVIS.',
            'Nenhum dado foi gravado no banco.',
            'Resultado bloqueado não pode seguir para dispatch/consolidação.',
          ].map((warning) => (
            <div
              key={warning}
              className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-5 text-amber-200"
            >
              {warning}
            </div>
          ))}
        </div>
      </article>

      <button
        type="button"
        disabled
        className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold uppercase tracking-widest text-t4"
      >
        <Lock className="h-4 w-4" />
        Executar leitura real integrada — fase futura
      </button>
    </section>
  );
}
