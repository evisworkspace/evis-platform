import { useState } from 'react';
import { CheckCircle2, Edit3, Loader2, Trash2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import type { AnalyzePreviewItem } from '../../hooks/useAnalyzeOpportunity';
import type { CreateManualBudgetItemInput, ManualBudgetItemActionResult } from '../../types';

// ──────────────────────────────────────────────
// OrcamentistaAiReviewPanel — MVP Sprint 7
//
// Tabela de decisão humana sobre itens sugeridos pela IA.
// Ações: aprovar, editar, descartar.
// Itens aprovados são persistidos via criarItemManual().
// Nenhum item é gravado sem ação explícita do usuário.
// ──────────────────────────────────────────────

type ReviewItem = AnalyzePreviewItem & {
  _localId: number;
  _editing: boolean;
  _editDescricao: string;
  _editUnidade: string;
  _editQuantidade: number;
  _editValorUnitario: number;
};

function confidenceBadge(confianca: number | null) {
  const value = confianca ?? 0;
  if (value >= 0.85) return { label: 'Alta', className: 'border-green-500/30 bg-green-500/10 text-green-400' };
  if (value >= 0.60) return { label: 'Média', className: 'border-amber-500/30 bg-amber-500/10 text-amber-400' };
  return { label: 'Baixa', className: 'border-red-500/30 bg-red-500/10 text-red-400' };
}

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });
}

function confidenceBar(value: number | null) {
  const pct = Math.round((value ?? 0) * 100);
  const color = pct >= 85 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-[10px] text-t3">{pct}%</span>
    </div>
  );
}

type Props = {
  items: AnalyzePreviewItem[];
  resumo: string | null;
  warnings: string[];
  analyzedAt: string | null;
  analyzedFileCount: number;
  criarItemManual: (payload: CreateManualBudgetItemInput) => Promise<ManualBudgetItemActionResult>;
};

export default function OrcamentistaAiReviewPanel({
  items,
  resumo,
  warnings,
  analyzedAt,
  analyzedFileCount,
  criarItemManual,
}: Props) {
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>(() =>
    items.map((item, index) => ({
      ...item,
      _localId: index,
      _editing: false,
      _editDescricao: item.descricao,
      _editUnidade: item.unidade,
      _editQuantidade: item.quantidade,
      _editValorUnitario: item.valor_unitario,
    }))
  );
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => {
    const initial = new Set<number>();
    items.forEach((item, index) => {
      if ((item.confianca ?? 0) >= 0.60) initial.add(index);
    });
    return initial;
  });
  const [approving, setApproving] = useState(false);
  const [approvedCount, setApprovedCount] = useState(0);
  const [expandedEvidence, setExpandedEvidence] = useState<Set<number>>(new Set());
  const [lastError, setLastError] = useState<string | null>(null);

  if (reviewItems.length === 0 && approvedCount === 0) {
    return null;
  }

  if (reviewItems.length === 0 && approvedCount > 0) {
    return (
      <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-400" />
          <p className="text-sm font-semibold text-green-400">
            {approvedCount} {approvedCount === 1 ? 'item adicionado' : 'itens adicionados'} ao orçamento oficial.
          </p>
        </div>
        <p className="mt-1 text-xs text-green-400/70">
          Confira os itens na seção "Orçamento oficial" abaixo.
        </p>
      </div>
    );
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === reviewItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(reviewItems.map((r) => r._localId)));
    }
  };

  const discardItem = (id: number) => {
    setReviewItems((prev) => prev.filter((r) => r._localId !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleEdit = (id: number) => {
    setReviewItems((prev) =>
      prev.map((r) => {
        if (r._localId !== id) return r;
        if (r._editing) {
          // Save edit
          return {
            ...r,
            descricao: r._editDescricao,
            unidade: r._editUnidade,
            quantidade: r._editQuantidade,
            valor_unitario: r._editValorUnitario,
            valor_total: r._editQuantidade * r._editValorUnitario,
            _editing: false,
          };
        }
        return { ...r, _editing: true };
      })
    );
  };

  const updateEditField = (id: number, field: string, value: string | number) => {
    setReviewItems((prev) =>
      prev.map((r) => (r._localId === id ? { ...r, [field]: value } : r))
    );
  };

  const toggleEvidence = (id: number) => {
    setExpandedEvidence((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const approveSelected = async () => {
    const toApprove = reviewItems.filter((r) => selectedIds.has(r._localId));
    if (toApprove.length === 0) return;

    setApproving(true);
    setLastError(null);
    let approved = 0;

    for (const item of toApprove) {
      const result = await criarItemManual({
        descricao: item.descricao,
        unidade: item.unidade,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        origem: 'ia_gemini',
      });

      if (result.status === 'success') {
        approved++;
        discardItem(item._localId);
      } else {
        setLastError(result.message);
        break;
      }
    }

    setApprovedCount((prev) => prev + approved);
    setApproving(false);
  };

  const selectedTotal = reviewItems
    .filter((r) => selectedIds.has(r._localId))
    .reduce((sum, r) => sum + r.quantidade * r.valor_unitario, 0);

  return (
    <div className="space-y-4 rounded-lg border border-brand-blue/30 bg-brand-blue/5 p-5">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-blue" />
            <h3 className="text-sm font-bold text-t1">Resultado da Análise IA</h3>
          </div>
          {analyzedAt && (
            <p className="mt-1 text-xs text-t3">
              Análise de {new Date(analyzedAt).toLocaleString('pt-BR')} · {analyzedFileCount} arquivo(s) · {reviewItems.length} item(ns) sugerido(s)
            </p>
          )}
          {resumo && <p className="mt-1 text-xs text-t3 italic">{resumo}</p>}
        </div>
        {approvedCount > 0 && (
          <span className="shrink-0 rounded border border-green-500/30 bg-green-500/10 px-2 py-1 text-[10px] font-bold text-green-400">
            {approvedCount} aprovado(s)
          </span>
        )}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="rounded border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          {warnings.map((w, i) => (
            <p key={i} className="text-[11px] text-amber-400">⚠ {w}</p>
          ))}
        </div>
      )}

      {/* Alert */}
      <p className="text-[11px] text-t4">
        ⚠ Valores são estimativas da IA. Revise cada item antes de aprovar. Nada será gravado sem sua ação explícita.
      </p>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-b1 text-left">
              <th className="px-2 py-2 w-8">
                <input
                  type="checkbox"
                  checked={selectedIds.size === reviewItems.length && reviewItems.length > 0}
                  onChange={toggleSelectAll}
                  className="accent-brand-blue"
                />
              </th>
              <th className="px-2 py-2 font-mono text-[9px] font-bold uppercase tracking-widest text-t3">Descrição</th>
              <th className="px-2 py-2 font-mono text-[9px] font-bold uppercase tracking-widest text-t3 w-16">Unid</th>
              <th className="px-2 py-2 font-mono text-[9px] font-bold uppercase tracking-widest text-t3 text-right w-20">Qtd</th>
              <th className="px-2 py-2 font-mono text-[9px] font-bold uppercase tracking-widest text-t3 text-right w-24">V. Unit.</th>
              <th className="px-2 py-2 font-mono text-[9px] font-bold uppercase tracking-widest text-t3 text-right w-24">Total</th>
              <th className="px-2 py-2 font-mono text-[9px] font-bold uppercase tracking-widest text-t3 w-20">Conf.</th>
              <th className="px-2 py-2 font-mono text-[9px] font-bold uppercase tracking-widest text-t3 w-24">Ações</th>
            </tr>
          </thead>
          <tbody>
            {reviewItems.map((item) => {
              const badge = confidenceBadge(item.confianca);
              const isSelected = selectedIds.has(item._localId);
              const isExpanded = expandedEvidence.has(item._localId);

              return (
                <tr key={item._localId} className={`border-b border-b1/50 transition-colors ${isSelected ? 'bg-brand-blue/5' : 'hover:bg-s2/30'}`}>
                  <td className="px-2 py-3 align-top">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(item._localId)}
                      className="accent-brand-blue"
                    />
                  </td>
                  <td className="px-2 py-3 align-top">
                    {item._editing ? (
                      <input
                        value={item._editDescricao}
                        onChange={(e) => updateEditField(item._localId, '_editDescricao', e.target.value)}
                        className="w-full rounded border border-b1 bg-bg px-2 py-1 text-sm text-t1 outline-none focus:border-brand-blue"
                      />
                    ) : (
                      <div>
                        <span className="font-medium text-t1">{item.descricao}</span>
                        {item.categoria && (
                          <span className="ml-2 rounded border border-b1 bg-s2 px-1.5 py-0.5 text-[9px] font-bold uppercase text-t3">
                            {item.categoria}
                          </span>
                        )}
                      </div>
                    )}
                    {/* Evidence toggle */}
                    {(item as any).evidencia && (
                      <button
                        onClick={() => toggleEvidence(item._localId)}
                        className="mt-1 flex items-center gap-1 text-[10px] text-brand-blue hover:text-brand-blue/80"
                      >
                        📎 Evidência
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    )}
                    {isExpanded && (item as any).evidencia && (
                      <p className="mt-1 rounded bg-s2/50 px-2 py-1 text-[11px] italic text-t3">
                        "{(item as any).evidencia}"
                      </p>
                    )}
                  </td>
                  <td className="px-2 py-3 align-top">
                    {item._editing ? (
                      <input
                        value={item._editUnidade}
                        onChange={(e) => updateEditField(item._localId, '_editUnidade', e.target.value)}
                        className="w-16 rounded border border-b1 bg-bg px-2 py-1 text-sm text-t1 outline-none focus:border-brand-blue"
                      />
                    ) : (
                      <span className="text-t2">{item.unidade}</span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-right align-top">
                    {item._editing ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item._editQuantidade}
                        onChange={(e) => updateEditField(item._localId, '_editQuantidade', parseFloat(e.target.value) || 0)}
                        className="w-20 rounded border border-b1 bg-bg px-2 py-1 text-right text-sm text-t1 outline-none focus:border-brand-blue"
                      />
                    ) : (
                      <span className="font-mono text-t1">{item.quantidade}</span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-right align-top">
                    {item._editing ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item._editValorUnitario}
                        onChange={(e) => updateEditField(item._localId, '_editValorUnitario', parseFloat(e.target.value) || 0)}
                        className="w-24 rounded border border-b1 bg-bg px-2 py-1 text-right text-sm text-t1 outline-none focus:border-brand-blue"
                      />
                    ) : (
                      <span className="font-mono text-t2">{formatMoney(item.valor_unitario)}</span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-right align-top">
                    <span className="font-mono font-semibold text-t1">
                      {formatMoney(item._editing ? item._editQuantidade * item._editValorUnitario : item.valor_total)}
                    </span>
                  </td>
                  <td className="px-2 py-3 align-top">
                    <span className={`inline-block rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${badge.className}`}>
                      {badge.label}
                    </span>
                    {confidenceBar(item.confianca)}
                  </td>
                  <td className="px-2 py-3 align-top">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleEdit(item._localId)}
                        title={item._editing ? 'Salvar edição' : 'Editar'}
                        className="rounded p-1 text-t3 transition-colors hover:bg-s2 hover:text-brand-blue"
                      >
                        {item._editing ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Edit3 className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => discardItem(item._localId)}
                        title="Descartar"
                        className="rounded p-1 text-t3 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-3 border-t border-b1 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-t3">
          Subtotal selecionado: <span className="font-mono font-semibold text-t1">{formatMoney(selectedTotal)}</span>
          {' '}({selectedIds.size} de {reviewItems.length} itens)
        </div>
        <button
          onClick={approveSelected}
          disabled={approving || selectedIds.size === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-green px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-widest text-bg transition-colors hover:bg-brand-green2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {approving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Aprovando...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Aprovar {selectedIds.size} {selectedIds.size === 1 ? 'item' : 'itens'} → Orçamento oficial
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {lastError && (
        <div className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {lastError}
        </div>
      )}
    </div>
  );
}
