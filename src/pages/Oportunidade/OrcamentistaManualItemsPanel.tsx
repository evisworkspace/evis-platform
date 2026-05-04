import { useState } from 'react';
import type {
  CreateManualBudgetItemInput,
  ManualBudgetItemActionResult,
  Orcamento,
  OrcamentoItem,
  UpdateManualBudgetItemInput,
} from '../../types';

// ──────────────────────────────────────────────
// OrcamentistaManualItemsPanel — Fase 1D
//
// Painel de itens manuais do orçamento vinculado à oportunidade.
//
// Regras:
//  - Itens criados apenas por ação explícita do usuário.
//  - Sem IA, sem pipeline, sem geração automática.
//  - Sem obra_id.
//  - Todas as operações dependem de orcamento_id via props.
// ──────────────────────────────────────────────

// ── Unidades comuns para seleção rápida ──────
const UNIDADES_COMUNS = ['m²', 'm³', 'm', 'un', 'kg', 'h', 'vb', 'cj', 'l', 'ml'];

// ── Formatação de moeda ──────────────────────
function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ── Estado do formulário ─────────────────────
type FormState = {
  descricao: string;
  unidade: string;
  quantidade: string;
  valor_unitario: string;
  codigo: string;
};

const FORM_VAZIO: FormState = {
  descricao: '',
  unidade: 'm²',
  quantidade: '1',
  valor_unitario: '0',
  codigo: '',
};

// ── Props do componente ──────────────────────
type OrcamentistaManualItemsPanelProps = {
  orcamento: Orcamento;
  itens: OrcamentoItem[];
  isLoadingItens?: boolean;
  criarItemManual: (payload: CreateManualBudgetItemInput) => Promise<ManualBudgetItemActionResult>;
  atualizarItemManual: (itemId: string, patch: UpdateManualBudgetItemInput) => Promise<ManualBudgetItemActionResult>;
  removerItemManual: (itemId: string) => Promise<ManualBudgetItemActionResult>;
};

export default function OrcamentistaManualItemsPanel({
  orcamento,
  itens,
  isLoadingItens,
  criarItemManual,
  atualizarItemManual,
  removerItemManual,
}: OrcamentistaManualItemsPanelProps) {
  const [form, setForm] = useState<FormState>(FORM_VAZIO);
  const [isSaving, setIsSaving] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<ManualBudgetItemActionResult | null>(null);

  // ID do item sendo editado inline (null = modo criação)
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(FORM_VAZIO);

  // ID do item aguardando confirmação de remoção
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  // ── Total calculado dos itens ────────────────
  const totalBruto = itens.reduce((acc, item) => acc + item.valor_total, 0);

  // ── Helpers ──────────────────────────────────
  function clearFeedback() {
    setActionFeedback(null);
  }

  function showFeedback(result: ManualBudgetItemActionResult) {
    setActionFeedback(result);
    setTimeout(clearFeedback, 5000);
  }

  function formToPayload(f: FormState): CreateManualBudgetItemInput {
    return {
      descricao: f.descricao.trim(),
      unidade: f.unidade.trim() || 'un',
      quantidade: Math.max(0, parseFloat(f.quantidade) || 0),
      valor_unitario: Math.max(0, parseFloat(f.valor_unitario) || 0),
      ...(f.codigo.trim() ? { codigo: f.codigo.trim() } : {}),
    };
  }

  // ── Criar item ───────────────────────────────
  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.descricao.trim()) return;

    setIsSaving(true);
    clearFeedback();
    try {
      const result = await criarItemManual(formToPayload(form));
      showFeedback(result);
      if (result.status === 'success') {
        setForm(FORM_VAZIO);
      }
    } finally {
      setIsSaving(false);
    }
  }

  // ── Iniciar edição inline ────────────────────
  function handleIniciarEdicao(item: OrcamentoItem) {
    setEditingItemId(item.id);
    setEditForm({
      descricao: item.descricao,
      unidade: item.unidade,
      quantidade: String(item.quantidade),
      valor_unitario: String(item.valor_unitario),
      codigo: item.codigo ?? '',
    });
    clearFeedback();
  }

  // ── Salvar edição ────────────────────────────
  async function handleSalvarEdicao(itemId: string) {
    setIsSaving(true);
    clearFeedback();
    try {
      const patch: UpdateManualBudgetItemInput = {
        descricao: editForm.descricao.trim(),
        unidade: editForm.unidade.trim() || 'un',
        quantidade: Math.max(0, parseFloat(editForm.quantidade) || 0),
        valor_unitario: Math.max(0, parseFloat(editForm.valor_unitario) || 0),
        ...(editForm.codigo.trim() ? { codigo: editForm.codigo.trim() } : {}),
      };
      const result = await atualizarItemManual(itemId, patch);
      showFeedback(result);
      if (result.status === 'success') {
        setEditingItemId(null);
      }
    } finally {
      setIsSaving(false);
    }
  }

  // ── Remover item ─────────────────────────────
  async function handleRemover(itemId: string) {
    // Primeiro clique: pede confirmação inline
    if (confirmRemoveId !== itemId) {
      setConfirmRemoveId(itemId);
      return;
    }
    // Segundo clique (confirmado): executa remoção
    setConfirmRemoveId(null);
    setIsSaving(true);
    clearFeedback();
    try {
      const result = await removerItemManual(itemId);
      showFeedback(result);
      if (result.status === 'removed' && editingItemId === itemId) {
        setEditingItemId(null);
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Cabeçalho do orçamento ── */}
      <div className="flex items-center justify-between rounded-lg border border-brand-green/20 bg-brand-green/5 px-5 py-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <p className="text-xs text-t3">Orçamento vinculado</p>
            <span className="rounded border border-brand-green/30 bg-brand-green/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-brand-green">
              OFICIAL
            </span>
          </div>
          <p className="font-semibold text-t1">{orcamento.nome}</p>
          <p className="mt-0.5 text-xs text-t3">
            Status: <span className="text-t2">{orcamento.status}</span>
            {' · '}BDI: <span className="text-t2">{orcamento.bdi}%</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-t3">Total bruto dos itens</p>
          <p className="text-lg font-bold text-t1">{formatBRL(totalBruto)}</p>
          <p className="text-xs text-t3">{itens.length} item(ns)</p>
        </div>
      </div>

      {/* ── Feedback de ação ── */}
      {actionFeedback && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            actionFeedback.status === 'success' || actionFeedback.status === 'removed'
              ? 'border-green-500/30 bg-green-500/10 text-green-400'
              : actionFeedback.status === 'blocked'
              ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
              : 'border-red-500/30 bg-red-500/10 text-red-400'
          }`}
        >
          {actionFeedback.message}
        </div>
      )}

      {/* ── Formulário de novo item ── */}
      <div className="rounded-lg border border-b1 bg-s1 p-5">
        <h3 className="mb-4 text-sm font-semibold text-t1">Adicionar item manual</h3>
        <form onSubmit={handleCriar} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-t3">Descrição *</label>
              <input
                id="manual-item-descricao"
                type="text"
                required
                placeholder="Ex: Laje nervurada 20cm"
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                className="w-full rounded-md border border-b1 bg-bg px-3 py-2 text-sm text-t1 placeholder-t3 focus:border-brand-blue focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-t3">Código (opcional)</label>
              <input
                id="manual-item-codigo"
                type="text"
                placeholder="Ex: SINAPI-123"
                value={form.codigo}
                onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
                className="w-full rounded-md border border-b1 bg-bg px-3 py-2 text-sm text-t1 placeholder-t3 focus:border-brand-blue focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-t3">Unidade *</label>
              <select
                id="manual-item-unidade"
                value={form.unidade}
                onChange={(e) => setForm((f) => ({ ...f, unidade: e.target.value }))}
                className="w-full rounded-md border border-b1 bg-bg px-3 py-2 text-sm text-t1 focus:border-brand-blue focus:outline-none"
              >
                {UNIDADES_COMUNS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-t3">Quantidade *</label>
              <input
                id="manual-item-quantidade"
                type="number"
                min="0"
                step="0.01"
                required
                value={form.quantidade}
                onChange={(e) => setForm((f) => ({ ...f, quantidade: e.target.value }))}
                className="w-full rounded-md border border-b1 bg-bg px-3 py-2 text-sm text-t1 focus:border-brand-blue focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-t3">Valor unitário (R$) *</label>
              <input
                id="manual-item-valor-unitario"
                type="number"
                min="0"
                step="0.01"
                required
                value={form.valor_unitario}
                onChange={(e) => setForm((f) => ({ ...f, valor_unitario: e.target.value }))}
                className="w-full rounded-md border border-b1 bg-bg px-3 py-2 text-sm text-t1 focus:border-brand-blue focus:outline-none"
              />
            </div>
          </div>

          {/* Prévia do valor total */}
          {parseFloat(form.quantidade) > 0 && parseFloat(form.valor_unitario) > 0 && (
            <p className="text-xs text-t3">
              Subtotal:{' '}
              <span className="font-medium text-t2">
                {formatBRL(parseFloat(form.quantidade) * parseFloat(form.valor_unitario))}
              </span>
            </p>
          )}

          <button
            id="btn-adicionar-item-manual"
            type="submit"
            disabled={isSaving || !form.descricao.trim()}
            className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? 'Salvando…' : '+ Adicionar item'}
          </button>
        </form>
      </div>

      {/* ── Lista de itens ── */}
      <div className="rounded-lg border border-b1 bg-s1">
        <div className="border-b border-b1 px-5 py-3">
          <h3 className="text-sm font-semibold text-t1">Itens oficiais do orçamento</h3>
          <p className="mt-0.5 text-xs text-t3">
            Estes itens estão gravados em <code className="rounded bg-s2 px-1 text-[10px]">orcamento_itens</code> e alimentam a proposta comercial.
          </p>
        </div>

        {isLoadingItens ? (
          <p className="px-5 py-6 text-sm text-t3">Carregando itens…</p>
        ) : itens.length === 0 ? (
          <p className="px-5 py-6 text-sm text-t3">
            Nenhum item adicionado ainda. Use o formulário acima para incluir o primeiro item.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-b1 text-left text-xs text-t3">
                  <th className="px-5 py-2 font-medium">Código</th>
                  <th className="px-5 py-2 font-medium">Descrição</th>
                  <th className="px-5 py-2 font-medium">Unid.</th>
                  <th className="px-5 py-2 font-medium text-right">Qtd.</th>
                  <th className="px-5 py-2 font-medium text-right">V. Unit.</th>
                  <th className="px-5 py-2 font-medium text-right">Total</th>
                  <th className="px-5 py-2 font-medium text-center">Origem</th>
                  <th className="px-5 py-2 font-medium text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item) =>
                  editingItemId === item.id ? (
                    // ── Linha de edição inline ──
                    <tr key={item.id} className="border-b border-b1 bg-brand-blue/5">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={editForm.codigo}
                          onChange={(e) => setEditForm((f) => ({ ...f, codigo: e.target.value }))}
                          placeholder="Código"
                          className="w-20 rounded border border-b1 bg-bg px-2 py-1 text-xs text-t1 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={editForm.descricao}
                          onChange={(e) => setEditForm((f) => ({ ...f, descricao: e.target.value }))}
                          className="w-full rounded border border-b1 bg-bg px-2 py-1 text-xs text-t1 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={editForm.unidade}
                          onChange={(e) => setEditForm((f) => ({ ...f, unidade: e.target.value }))}
                          className="rounded border border-b1 bg-bg px-2 py-1 text-xs text-t1 focus:outline-none"
                        >
                          {UNIDADES_COMUNS.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editForm.quantidade}
                          onChange={(e) => setEditForm((f) => ({ ...f, quantidade: e.target.value }))}
                          className="w-20 rounded border border-b1 bg-bg px-2 py-1 text-xs text-t1 focus:outline-none text-right"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editForm.valor_unitario}
                          onChange={(e) => setEditForm((f) => ({ ...f, valor_unitario: e.target.value }))}
                          className="w-24 rounded border border-b1 bg-bg px-2 py-1 text-xs text-t1 focus:outline-none text-right"
                        />
                      </td>
                      <td className="px-5 py-2 text-right text-xs text-t2">
                        {formatBRL(
                          parseFloat(editForm.quantidade || '0') *
                          parseFloat(editForm.valor_unitario || '0')
                        )}
                      </td>
                      <td className="px-5 py-2 text-center">
                        <span className="rounded-full bg-brand-blue/10 px-2 py-0.5 text-xs text-brand-blue">
                          {item.origem}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleSalvarEdicao(item.id)}
                            disabled={isSaving}
                            className="rounded bg-brand-blue px-2 py-1 text-xs text-white hover:opacity-90 disabled:opacity-50"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => setEditingItemId(null)}
                            className="rounded border border-b1 px-2 py-1 text-xs text-t2 hover:bg-s2"
                          >
                            Cancelar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    // ── Linha de leitura ──
                    <tr key={item.id} className="border-b border-b1 hover:bg-s2/50 transition-colors">
                      <td className="px-5 py-3 text-xs text-t3">{item.codigo ?? '—'}</td>
                      <td className="px-5 py-3 text-t1">{item.descricao}</td>
                      <td className="px-5 py-3 text-t2">{item.unidade}</td>
                      <td className="px-5 py-3 text-right text-t2">{item.quantidade}</td>
                      <td className="px-5 py-3 text-right text-t2">{formatBRL(item.valor_unitario)}</td>
                      <td className="px-5 py-3 text-right font-medium text-t1">{formatBRL(item.valor_total)}</td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`rounded border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${
                            item.origem === 'manual'
                              ? 'border-brand-blue/30 bg-brand-blue/10 text-brand-blue'
                              : item.origem === 'sinapi'
                              ? 'border-green-500/30 bg-green-500/10 text-green-400'
                              : 'border-purple-500/30 bg-purple-500/10 text-purple-400'
                          }`}
                        >
                          {item.origem === 'ia' ? 'PRÉVIA IA' : item.origem.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            id={`btn-editar-item-${item.id}`}
                            onClick={() => handleIniciarEdicao(item)}
                            className="rounded border border-b1 px-2 py-1 text-xs text-t2 hover:bg-s2 transition-colors"
                          >
                            Editar
                          </button>

                          {confirmRemoveId === item.id ? (
                            // ── Confirmação inline ──
                            <span className="flex items-center gap-1">
                              <button
                                id={`btn-confirmar-remover-item-${item.id}`}
                                onClick={() => handleRemover(item.id)}
                                disabled={isSaving}
                                className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:opacity-90 disabled:opacity-50"
                              >
                                Confirmar?
                              </button>
                              <button
                                onClick={() => setConfirmRemoveId(null)}
                                className="rounded border border-b1 px-1 py-1 text-xs text-t3 hover:bg-s2"
                              >
                                ✕
                              </button>
                            </span>
                          ) : (
                            <button
                              id={`btn-remover-item-${item.id}`}
                              onClick={() => handleRemover(item.id)}
                              disabled={isSaving}
                              className="rounded border border-red-500/30 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            >
                              Remover
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-b1 bg-s1">
                  <td colSpan={5} className="px-5 py-3 text-right text-xs font-medium text-t2">
                    Total bruto dos itens
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-t1">
                    {formatBRL(totalBruto)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-t3">
        * Itens com origem <strong>MANUAL</strong> são criados diretamente pelo usuário e gravados no banco.
        Itens com origem <strong>PRÉVIA IA</strong> (quando presentes) foram importados do workspace IA
        após validação humana explícita — não são gerados automaticamente.
      </p>
    </div>
  );
}
