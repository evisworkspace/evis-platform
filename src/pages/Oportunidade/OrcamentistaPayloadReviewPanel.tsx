import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Edit3,
  FileJson,
  Lock,
  PauseCircle,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import {
  OrcamentistaPayloadReviewEditPatch,
  OrcamentistaPayloadReviewItem,
  OrcamentistaPayloadReviewItemStatus,
} from '../../types';
import { MOCK_PAYLOAD_REVIEW_SESSION } from '../../lib/orcamentista/payloadReviewMock';
import {
  applyPayloadReviewDecision,
  canApprovePayloadItem,
  canEditPayloadItem,
  canRejectPayloadItem,
  getPayloadReviewBlockingReasons,
  getPayloadReviewItemStatusLabel,
  getPayloadReviewStatusLabel,
} from '../../lib/orcamentista/payloadReviewUtils';

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

function itemStatusClass(status: OrcamentistaPayloadReviewItemStatus) {
  switch (status) {
    case 'approved':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
    case 'rejected':
      return 'border-red-500/30 bg-red-500/10 text-red-200';
    case 'edited':
      return 'border-blue-500/30 bg-blue-500/10 text-blue-200';
    case 'blocked':
      return 'border-red-500/30 bg-red-500/10 text-red-200';
    case 'validation_requested':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
    default:
      return 'border-white/10 bg-white/[0.04] text-t3';
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

function payloadSummary(item: OrcamentistaPayloadReviewItem) {
  const payload = item.edited_payload ?? item.original_payload;
  return {
    payload,
    blockers: getPayloadReviewBlockingReasons(item),
  };
}

export default function OrcamentistaPayloadReviewPanel() {
  const [session, setSession] = useState(MOCK_PAYLOAD_REVIEW_SESSION);
  const [selectedItemId, setSelectedItemId] = useState(session.items[0]?.id ?? '');
  const selectedItem = session.items.find((item) => item.id === selectedItemId) ?? session.items[0];
  const selectedData = useMemo(() => selectedItem ? payloadSummary(selectedItem) : null, [selectedItem]);
  const [editPatch, setEditPatch] = useState<OrcamentistaPayloadReviewEditPatch>({});

  useEffect(() => {
    if (!selectedItem) return;
    const payload = selectedItem.edited_payload ?? selectedItem.original_payload;
    setEditPatch({
      descricao: payload.descricao,
      unidade: payload.unidade,
      quantidade: payload.quantidade,
      valor_unitario: payload.valor_unitario,
      codigo: payload.codigo,
    });
  }, [selectedItem]);

  function decide(
    item: OrcamentistaPayloadReviewItem,
    decisionType: 'approve' | 'reject' | 'edit' | 'keep_pending' | 'request_validation',
    reason: string,
    patch?: OrcamentistaPayloadReviewEditPatch
  ) {
    setSession((current) =>
      applyPayloadReviewDecision(current, {
        item_id: item.id,
        decision_type: decisionType,
        reason,
        edit_patch: patch,
        decided_at: new Date().toISOString(),
      })
    );
  }

  if (!selectedItem || !selectedData) {
    return (
      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-5 text-sm text-t3">
        Nenhum payload simulado disponivel para revisao humana.
      </section>
    );
  }

  const selectedPayload = selectedData.payload;
  const selectedOriginalJson = JSON.stringify(selectedItem.original_payload, null, 2);
  const selectedEditedJson = selectedItem.edited_payload
    ? JSON.stringify(selectedItem.edited_payload, null, 2)
    : 'Sem edicao local aplicada.';

  return (
    <section className="space-y-5 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-cyan-300" />
            <h2 className="text-sm font-bold text-t1">Revisão humana do payload</h2>
          </div>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-t3">
            Validação item por item antes da futura gravação no orçamento oficial.
            Revisão humana simulada: nenhuma decisão foi persistida.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <span className="w-fit rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-cyan-200">
            Fase 2J · Revisão local
          </span>
          <span className="w-fit rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-t3">
            {getPayloadReviewStatusLabel(session.status)}
          </span>
        </div>
      </header>

      <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
        <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-t4">
          Documento → Página → Reader/Verifier → HITL → Agentes → Preview → Gate → Revisão humana → Gravação futura
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
        {summaryCard('Total', session.summary.total_items, 'border-white/10 bg-white/[0.03] text-t1')}
        {summaryCard('Aprovados', session.summary.approved_count, 'border-emerald-500/20 bg-emerald-500/5 text-emerald-200')}
        {summaryCard('Editados', session.summary.edited_count, 'border-blue-500/20 bg-blue-500/5 text-blue-200')}
        {summaryCard('Rejeitados', session.summary.rejected_count, 'border-red-500/20 bg-red-500/5 text-red-200')}
        {summaryCard('Pendentes', session.summary.pending_count, 'border-amber-500/20 bg-amber-500/5 text-amber-200')}
        {summaryCard('Bloqueados', session.summary.blocked_count, 'border-red-500/20 bg-red-500/5 text-red-200')}
        {summaryCard('Pode gravar', session.can_write_to_budget ? 'sim' : 'não', 'border-red-500/20 bg-red-500/5 text-red-200')}
        {summaryCard('Valor rev.', formatCurrency(session.summary.total_reviewed_value), 'border-cyan-500/20 bg-cyan-500/5 text-cyan-200')}
      </div>

      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
          <div>
            <p className="text-sm font-semibold text-red-100">Gravação real bloqueada</p>
            <p className="mt-1 text-xs leading-5 text-red-200">{session.summary.write_blocked_reason}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="space-y-3">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <FileJson className="h-4 w-4 text-cyan-300" />
            <h3 className="text-sm font-bold text-t1">Itens do payload em revisão</h3>
          </div>

          <div className="space-y-3">
            {session.items.map((item) => {
              const payload = item.edited_payload ?? item.original_payload;
              const blockers = getPayloadReviewBlockingReasons(item);
              const isSelected = item.id === selectedItem.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItemId(item.id)}
                  className={`w-full rounded-lg border p-4 text-left transition ${
                    isSelected ? 'border-cyan-400/60 bg-cyan-500/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-t1">{payload.descricao}</p>
                      <p className="mt-1 text-xs text-t3">
                        {payload.categoria} · {payload.unidade} · {formatNumber(payload.quantidade)} × {formatCurrency(payload.valor_unitario)}
                      </p>
                    </div>
                    <span className={`w-fit rounded border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${itemStatusClass(item.status)}`}>
                      {getPayloadReviewItemStatusLabel(item.status)}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 md:grid-cols-4">
                    <div className="rounded border border-white/10 bg-white/[0.03] px-3 py-2">
                      <p className="font-mono text-[8px] uppercase tracking-widest text-t4">Total</p>
                      <p className="mt-1 text-xs font-semibold text-t2">{formatCurrency(payload.valor_total)}</p>
                    </div>
                    <div className="rounded border border-white/10 bg-white/[0.03] px-3 py-2">
                      <p className="font-mono text-[8px] uppercase tracking-widest text-t4">Origem</p>
                      <p className="mt-1 text-xs text-t2">{payload.origem}</p>
                    </div>
                    <div className="rounded border border-white/10 bg-white/[0.03] px-3 py-2">
                      <p className="font-mono text-[8px] uppercase tracking-widest text-t4">Rastreabilidade</p>
                      <p className="mt-1 text-xs text-t2">
                        {item.has_required_traceability ? 'completa' : 'incompleta'} · {formatPercent(payload.traceability_score)}
                      </p>
                    </div>
                    <div className="rounded border border-white/10 bg-white/[0.03] px-3 py-2">
                      <p className="font-mono text-[8px] uppercase tracking-widest text-t4">Bloqueios</p>
                      <p className="mt-1 text-xs text-t2">{blockers.length > 0 ? blockers.length : 'nenhum'}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </article>

        <article className="space-y-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <h3 className="text-sm font-bold text-t1">Detalhe do item</h3>
              <p className="mt-1 text-xs text-t3">{selectedPayload.descricao}</p>
            </div>
            <span className={`shrink-0 rounded border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${itemStatusClass(selectedItem.status)}`}>
              {getPayloadReviewItemStatusLabel(selectedItem.status)}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded border border-white/10 bg-white/[0.03] px-3 py-2">
              <p className="font-mono text-[8px] uppercase tracking-widest text-t4">Confiança</p>
              <p className="mt-1 text-xs text-t2">{formatPercent(selectedPayload.confidence_score)}</p>
            </div>
            <div className="rounded border border-white/10 bg-white/[0.03] px-3 py-2">
              <p className="font-mono text-[8px] uppercase tracking-widest text-t4">Simulado</p>
              <p className="mt-1 text-xs text-t2">{selectedPayload.simulated_only ? 'simulated_only = true' : 'não'}</p>
            </div>
          </div>

          <div className="grid gap-3">
            {refList('source_agent_ids', selectedPayload.source_agent_ids)}
            {refList('source_page_refs', selectedPayload.source_page_refs)}
            {refList('source_evidence_refs', selectedPayload.source_evidence_refs)}
          </div>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-3">
            <p className="text-xs font-semibold text-amber-100">Bloqueios e requisitos</p>
            {selectedData.blockers.length > 0 ? (
              <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-200">
                {selectedData.blockers.map((reason) => (
                  <li key={reason}>- {reason}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-amber-200">Sem bloqueio local para aprovação simulada.</p>
            )}
          </div>

          <div className="space-y-3 rounded-lg border border-white/10 bg-black/10 p-3">
            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-t4">Edição local/mockada</p>
            <label className="block text-xs text-t3">
              Descrição
              <input
                value={editPatch.descricao ?? ''}
                onChange={(event) => setEditPatch((current) => ({ ...current, descricao: event.target.value }))}
                className="mt-1 w-full rounded border border-white/10 bg-black/20 px-3 py-2 text-xs text-t1 outline-none focus:border-cyan-400/60"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-xs text-t3">
                Unidade
                <input
                  value={editPatch.unidade ?? ''}
                  onChange={(event) => setEditPatch((current) => ({ ...current, unidade: event.target.value }))}
                  className="mt-1 w-full rounded border border-white/10 bg-black/20 px-3 py-2 text-xs text-t1 outline-none focus:border-cyan-400/60"
                />
              </label>
              <label className="block text-xs text-t3">
                Quantidade
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editPatch.quantidade ?? 0}
                  onChange={(event) => setEditPatch((current) => ({ ...current, quantidade: Number(event.target.value) }))}
                  className="mt-1 w-full rounded border border-white/10 bg-black/20 px-3 py-2 text-xs text-t1 outline-none focus:border-cyan-400/60"
                />
              </label>
              <label className="block text-xs text-t3">
                Valor unitário
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editPatch.valor_unitario ?? 0}
                  onChange={(event) => setEditPatch((current) => ({ ...current, valor_unitario: Number(event.target.value) }))}
                  className="mt-1 w-full rounded border border-white/10 bg-black/20 px-3 py-2 text-xs text-t1 outline-none focus:border-cyan-400/60"
                />
              </label>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={!canApprovePayloadItem(selectedItem)}
              onClick={() => decide(selectedItem, 'approve', 'Item aprovado em revisao humana simulada.')}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckCircle2 className="h-4 w-4" />
              Aprovar item
            </button>
            <button
              type="button"
              disabled={!canRejectPayloadItem(selectedItem)}
              onClick={() => decide(selectedItem, 'reject', 'Item rejeitado em revisao humana simulada.')}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <XCircle className="h-4 w-4" />
              Rejeitar item
            </button>
            <button
              type="button"
              disabled={!canEditPayloadItem(selectedItem)}
              onClick={() => decide(selectedItem, 'edit', 'Item editado localmente na revisao simulada.', editPatch)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-200 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Edit3 className="h-4 w-4" />
              Editar item localmente
            </button>
            <button
              type="button"
              onClick={() => decide(selectedItem, 'keep_pending', 'Item mantido pendente em revisao local.')}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-t3 transition hover:bg-white/[0.08]"
            >
              <PauseCircle className="h-4 w-4" />
              Manter pendente
            </button>
            <button
              type="button"
              onClick={() => decide(selectedItem, 'request_validation', 'Validacao humana adicional solicitada.')}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/20 sm:col-span-2"
            >
              <ShieldAlert className="h-4 w-4" />
              Solicitar validação
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <p className="mb-1 font-mono text-[9px] font-bold uppercase tracking-widest text-t4">Payload original</p>
              <pre className="max-h-[220px] overflow-auto rounded border border-white/10 bg-black/30 p-3 text-[11px] leading-5 text-t2">
                {selectedOriginalJson}
              </pre>
            </div>
            <div>
              <p className="mb-1 font-mono text-[9px] font-bold uppercase tracking-widest text-t4">Payload editado</p>
              <pre className="max-h-[220px] overflow-auto rounded border border-white/10 bg-black/30 p-3 text-[11px] leading-5 text-t2">
                {selectedEditedJson}
              </pre>
            </div>
          </div>
        </article>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-300" />
            <p className="text-xs font-semibold text-t2">Nenhuma decisão foi persistida.</p>
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-red-300" />
            <p className="text-xs font-semibold text-t2">Nenhum item foi gravado em orcamento_itens.</p>
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-t3" />
            <p className="text-xs font-semibold text-t2">A gravação real exigirá autorização explícita em fase futura.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-t3">
          Itens sem rastreabilidade não podem ser aprovados. Itens com HITL pendente iniciam pendentes
          e itens inferidos exigem validação humana explícita.
        </p>
        <button
          type="button"
          disabled
          className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-t3 opacity-70"
        >
          <Lock className="h-4 w-4" />
          Gravar itens aprovados no orçamento oficial — fase futura
        </button>
      </div>
    </section>
  );
}
