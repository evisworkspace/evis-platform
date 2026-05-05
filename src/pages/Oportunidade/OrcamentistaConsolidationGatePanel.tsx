import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ClipboardList,
  Database,
  FileJson,
  Lock,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import {
  OrcamentistaConsolidationGateStatus,
  OrcamentistaHitlIssueSeverity,
} from '../../types';
import { MOCK_CONSOLIDATION_GATE } from '../../lib/orcamentista/consolidationGateMock';
import {
  getConsolidationGateStatusLabel,
  getConsolidationIssueSeverityLabel,
} from '../../lib/orcamentista/consolidationGateUtils';

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatNumber(value: number) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
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

function statusClass(status: OrcamentistaConsolidationGateStatus) {
  switch (status) {
    case 'blocked':
      return 'border-red-500/30 bg-red-500/10 text-red-300';
    case 'pending_hitl':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
    case 'payload_simulated':
      return 'border-blue-500/30 bg-blue-500/10 text-blue-300';
    default:
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  }
}

function summaryCard(label: string, value: string | number, className: string) {
  return (
    <div className={`rounded-lg border px-4 py-3 ${className}`}>
      <p className="font-mono text-[9px] font-bold uppercase tracking-widest opacity-80">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

function refList(label: string, refs: string[]) {
  return (
    <div>
      <p className="font-mono text-[8px] font-bold uppercase tracking-widest text-t4">{label}</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {refs.length > 0 ? (
          refs.map((ref) => (
            <span
              key={ref}
              className="max-w-[220px] truncate rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] text-t3"
              title={ref}
            >
              {ref}
            </span>
          ))
        ) : (
          <span className="rounded border border-red-500/20 bg-red-500/5 px-2 py-0.5 text-[10px] text-red-200">
            ausente
          </span>
        )}
      </div>
    </div>
  );
}

export default function OrcamentistaConsolidationGatePanel() {
  const gate = MOCK_CONSOLIDATION_GATE;
  const payloadJson = JSON.stringify(gate.simulated_payload, null, 2);

  return (
    <section className="space-y-5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
            <h2 className="text-sm font-bold text-t1">Gate de consolidação</h2>
          </div>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-t3">
            Validação final antes de transformar preview em itens oficiais. Nesta fase,
            apenas payload simulado para revisão humana.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <span className="w-fit rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-emerald-200">
            Fase 2I · Payload simulado
          </span>
          <span className={`w-fit rounded border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${statusClass(gate.status)}`}>
            {getConsolidationGateStatusLabel(gate.status)}
          </span>
        </div>
      </header>

      <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
        <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-t4">
          Documento → Página → Reader/Verifier → HITL → Agentes especialistas → Preview consolidado → Gate de consolidação → Orçamento oficial futuro
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
        {summaryCard('Candidatos', gate.summary.total_candidates, 'border-white/10 bg-white/[0.03] text-t1')}
        {summaryCard('Aprovados', gate.summary.approved_count, 'border-emerald-500/20 bg-emerald-500/5 text-emerald-200')}
        {summaryCard('Bloqueados', gate.summary.blocked_count, 'border-red-500/20 bg-red-500/5 text-red-200')}
        {summaryCard('HITL', gate.summary.pending_hitl_count, 'border-amber-500/20 bg-amber-500/5 text-amber-200')}
        {summaryCard('Payload', gate.summary.simulated_payload_count, 'border-blue-500/20 bg-blue-500/5 text-blue-200')}
        {summaryCard('Valor sim.', formatCurrency(gate.summary.total_simulated_value), 'border-purple-500/20 bg-purple-500/5 text-purple-200')}
        {summaryCard('Pode gravar', gate.can_write_to_budget ? 'sim' : 'não', 'border-red-500/20 bg-red-500/5 text-red-200')}
        {summaryCard('Críticas', gate.summary.critical_issues, 'border-red-500/20 bg-red-500/5 text-red-200')}
      </div>

      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
          <div>
            <p className="text-sm font-semibold text-red-100">Gravação oficial bloqueada nesta fase</p>
            <p className="mt-1 text-xs leading-5 text-red-200">{gate.write_blocked_reason}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <article className="space-y-3">
            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              <h3 className="text-sm font-bold text-t1">Itens aprovados para payload simulado</h3>
            </div>

            {gate.approved_items.length > 0 ? (
              <div className="space-y-3">
                {gate.approved_items.map((item) => (
                  <div key={item.id} className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-t1">{item.description}</p>
                        <p className="mt-1 text-xs text-t3">
                          {item.category} · {item.unit} · {formatNumber(item.quantity)} × {formatCurrency(item.unit_cost)}
                        </p>
                      </div>
                      <span className="w-fit rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-emerald-200">
                        Total {formatCurrency(item.total_cost)}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <div className="rounded border border-white/10 bg-white/[0.03] px-3 py-2">
                        <p className="font-mono text-[8px] uppercase tracking-widest text-t4">Origem</p>
                        <p className="mt-1 text-xs text-t2">{item.origin}</p>
                        <p className="mt-1 text-[10px] text-t4">Tipo: {item.identification_type}</p>
                      </div>
                      <div className="rounded border border-white/10 bg-white/[0.03] px-3 py-2">
                        <p className="font-mono text-[8px] uppercase tracking-widest text-t4">Confiança</p>
                        <p className="mt-1 text-xs text-t2">
                          Qtd {formatPercent(item.quantity_confidence)} · Custo {formatPercent(item.cost_confidence)}
                        </p>
                        <p className="mt-1 text-[10px] text-t4">Score {formatPercent(item.confidence_score)}</p>
                      </div>
                      <div className="rounded border border-white/10 bg-white/[0.03] px-3 py-2">
                        <p className="font-mono text-[8px] uppercase tracking-widest text-t4">Rastreabilidade</p>
                        <p className="mt-1 text-xs text-t2">{formatPercent(item.traceability_score)}</p>
                        <p className="mt-1 text-[10px] text-t4">Pré-oficial e auditável</p>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      {refList('source_agent_ids', item.source_agent_ids)}
                      {refList('source_page_refs', item.source_page_refs)}
                      {refList('source_evidence_refs', item.source_evidence_refs)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-t3">
                Nenhum item aprovado para o payload simulado.
              </p>
            )}
          </article>

          <article className="space-y-3">
            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
              <Ban className="h-4 w-4 text-red-300" />
              <h3 className="text-sm font-bold text-t1">Itens bloqueados</h3>
            </div>

            <div className="space-y-3">
              {gate.blocked_items.map((item) => (
                <div key={item.id} className="rounded-lg border border-red-500/20 bg-red-500/[0.04] p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-t1">{item.description}</p>
                      <p className="mt-1 text-xs leading-5 text-red-200">{item.reason}</p>
                    </div>
                    <span className={`w-fit rounded border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${severityClass(item.severity)}`}>
                      {getConsolidationIssueSeverityLabel(item.severity)}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <div className="rounded border border-white/10 bg-white/[0.03] px-3 py-2">
                      <p className="font-mono text-[8px] uppercase tracking-widest text-t4">Campo ausente</p>
                      <p className="mt-1 text-xs text-t2">
                        {item.missing_fields.length > 0 ? item.missing_fields.join(', ') : 'sem campo ausente'}
                      </p>
                    </div>
                    <div className="rounded border border-white/10 bg-white/[0.03] px-3 py-2 md:col-span-2">
                      <p className="font-mono text-[8px] uppercase tracking-widest text-t4">Ação necessária</p>
                      <p className="mt-1 text-xs leading-5 text-t2">{item.required_action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="space-y-5">
          <article className="space-y-3">
            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
              <UserCheck className="h-4 w-4 text-amber-300" />
              <h3 className="text-sm font-bold text-t1">Pendências HITL</h3>
            </div>

            <div className="space-y-3">
              {gate.pending_hitl_items.map((item) => (
                <div key={item.id} className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-t1">{item.description}</p>
                      <p className="mt-1 text-xs leading-5 text-amber-200">{item.reason}</p>
                    </div>
                    <span className={`shrink-0 rounded border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${severityClass(item.severity)}`}>
                      {getConsolidationIssueSeverityLabel(item.severity)}
                    </span>
                  </div>
                  <div className="mt-3 rounded border border-white/10 bg-white/[0.03] px-3 py-2">
                    <p className="font-mono text-[8px] uppercase tracking-widest text-t4">Ação humana requerida</p>
                    <p className="mt-1 text-xs leading-5 text-t2">{item.required_human_action}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="space-y-3">
            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
              <FileJson className="h-4 w-4 text-blue-300" />
              <h3 className="text-sm font-bold text-t1">Payload simulado</h3>
            </div>

            <div className="rounded-lg border border-blue-500/20 bg-blue-500/[0.04] p-4">
              <div className="flex items-start gap-3">
                <Database className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
                <div>
                  <p className="text-sm font-semibold text-blue-100">Não enviado ao Supabase</p>
                  <p className="mt-1 text-xs leading-5 text-blue-200">
                    Payload simulado para revisão. Nenhum item foi gravado em orcamento_itens.
                  </p>
                </div>
              </div>
              <pre className="mt-4 max-h-[380px] overflow-auto rounded border border-white/10 bg-black/30 p-3 text-[11px] leading-5 text-t2">
                {payloadJson}
              </pre>
            </div>
          </article>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-t3" />
            <p className="text-xs font-semibold text-t2">Payload simulado para revisão.</p>
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-300" />
            <p className="text-xs font-semibold text-t2">Itens inferidos exigem validação humana.</p>
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-300" />
            <p className="text-xs font-semibold text-t2">Nenhum item foi gravado em orcamento_itens.</p>
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-t3" />
            <p className="text-xs font-semibold text-t2">A gravação real será fase futura.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-t3">
          Orçamento oficial permanece separado. Este Gate nao altera proposta, obra ativa ou Diario de Obra.
        </p>
        <button
          type="button"
          disabled
          className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-t3 opacity-70"
        >
          <Lock className="h-4 w-4" />
          Gravar no orçamento oficial — fase futura
        </button>
      </div>
    </section>
  );
}
