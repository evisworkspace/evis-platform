import { useMemo } from 'react';
import { Ban, FileJson, GitCompareArrows, Lock, ShieldCheck, TriangleAlert } from 'lucide-react';
import { runRealReaderSandbox } from '../../lib/orcamentista/realReaderSandbox';

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

export default function OrcamentistaRealReaderSandboxPanel() {
  const sandbox = useMemo(() => runRealReaderSandbox(), []);
  const normalized = sandbox.normalized_output;
  const safety = sandbox.safety_runner_result;

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
