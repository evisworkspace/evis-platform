import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Loader2,
  Pencil,
  ShieldAlert,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import {
  useAnalysisRunPreviewItems,
  useDecidePreviewItem,
  type AnalysisRunPreviewItem,
  type DecisionType,
  type PreviewItemStatus,
} from '../../hooks/useAnalysisRunPreviewItems';

// ──────────────────────────────────────────────
// OrcamentistaPreviewItemsHitlPanel — Etapa 3
//
// Painel real de revisão humana sobre orc_preview_items.
// Recebe runId vindo do retorno do /analyze (campo data.analysis_run.run_id).
// - Sem runId → estado vazio explicando que análise não rodou ainda.
// - schema_not_ready → mensagem honesta.
// - 0 itens com schema ready → estado vazio honesto.
// - N itens → lista com ações: aprovar / pedir revisão / rejeitar / editar.
//
// Aprovar item AINDA NÃO grava em orcamento_itens.
// Etapa 4 cria endpoint dedicado de commit oficial atrás de flag.
// ──────────────────────────────────────────────

type Props = {
  runId: string | null;
  schemaStatusFromAnalyze?: 'ready' | 'schema_not_ready' | 'persistence_error' | null;
};

function formatBRL(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '—';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function statusBadge(status: PreviewItemStatus) {
  const map: Record<PreviewItemStatus, { label: string; className: string }> = {
    pending: {
      label: 'pendente',
      className: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    },
    approved: {
      label: 'aprovado',
      className: 'border-green-500/30 bg-green-500/10 text-green-400',
    },
    rejected: {
      label: 'rejeitado',
      className: 'border-red-500/30 bg-red-500/10 text-red-400',
    },
    edited: {
      label: 'editado',
      className: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    },
    request_review: {
      label: 'revisão pedida',
      className: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
    },
  };
  const spec = map[status] ?? map.pending;
  return (
    <span
      className={`rounded border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${spec.className}`}
    >
      {spec.label}
    </span>
  );
}

function EmptyState({
  title,
  description,
  tone = 'neutral',
}: {
  title: string;
  description: string;
  tone?: 'neutral' | 'warn';
}) {
  const colors =
    tone === 'warn'
      ? 'border-amber-500/30 bg-amber-500/5 text-amber-200'
      : 'border-b1 bg-s1/40 text-t3';
  return (
    <div className={`rounded-lg border border-dashed p-5 ${colors}`}>
      <p className="text-sm font-semibold text-t1">{title}</p>
      <p className="mt-1 text-xs leading-relaxed">{description}</p>
    </div>
  );
}

function PreviewItemCard({
  item,
  runId,
}: {
  item: AnalysisRunPreviewItem;
  runId: string;
}) {
  const decideMutation = useDecidePreviewItem(runId);
  const [reason, setReason] = useState('');
  const [editing, setEditing] = useState(false);
  const [editDescription, setEditDescription] = useState(item.description);
  const [editQuantity, setEditQuantity] = useState(String(item.quantity));
  const [editUnitPrice, setEditUnitPrice] = useState(String(item.unit_price));

  const isBusy = decideMutation.isPending;
  const isFinal =
    item.status === 'approved' || item.status === 'rejected' || item.status === 'edited';

  const submit = (decision: DecisionType, extra?: Record<string, unknown>) => {
    decideMutation.mutate({
      previewItemId: item.id,
      decision,
      reason: reason.trim() ? reason.trim() : null,
      editedPayload:
        decision === 'edit'
          ? {
              description: editDescription,
              quantity: Number(editQuantity.replace(',', '.')) || 0,
              unit_price: Number(editUnitPrice.replace(',', '.')) || 0,
              ...(extra ?? {}),
            }
          : null,
    });
  };

  return (
    <div className="rounded-lg border border-b1 bg-s1/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            {statusBadge(item.status)}
            {item.codigo && (
              <span className="font-mono text-[10px] uppercase text-t4">{item.codigo}</span>
            )}
            {item.origem && (
              <span className="rounded border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-purple-400">
                {item.origem}
              </span>
            )}
            {item.confidence != null && (
              <span className="text-[10px] text-t4">
                confiança {(item.confidence * 100).toFixed(0)}%
              </span>
            )}
          </div>
          {editing ? (
            <input
              className="w-full rounded border border-b1 bg-bg px-2 py-1 text-sm text-t1"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
          ) : (
            <p className="break-words text-sm font-semibold text-t1">{item.description}</p>
          )}
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-t3 sm:grid-cols-4">
            <div>
              <span className="text-t4">Unidade</span>
              <p className="text-t1">{item.unit}</p>
            </div>
            <div>
              <span className="text-t4">Quantidade</span>
              {editing ? (
                <input
                  className="w-full rounded border border-b1 bg-bg px-1 py-0.5 text-t1"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                />
              ) : (
                <p className="text-t1">{item.quantity}</p>
              )}
            </div>
            <div>
              <span className="text-t4">Valor unitário</span>
              {editing ? (
                <input
                  className="w-full rounded border border-b1 bg-bg px-1 py-0.5 text-t1"
                  value={editUnitPrice}
                  onChange={(e) => setEditUnitPrice(e.target.value)}
                />
              ) : (
                <p className="text-t1">{formatBRL(item.unit_price)}</p>
              )}
            </div>
            <div>
              <span className="text-t4">Total</span>
              <p className="text-t1">{formatBRL(item.total_price)}</p>
            </div>
          </div>
          {item.source_evidence_ids?.length > 0 ? (
            <p className="mt-2 text-[10px] text-t4">
              {item.source_evidence_ids.length} evidência(s) vinculada(s)
            </p>
          ) : (
            <p className="mt-2 flex items-center gap-1 text-[10px] text-amber-400">
              <AlertTriangle className="h-3 w-3" />
              Item sem evidência vinculada — não passará no commit oficial (Etapa 4).
            </p>
          )}
        </div>
      </div>

      {!isFinal && (
        <div className="mt-3 space-y-2 border-t border-b1 pt-3">
          <textarea
            className="w-full rounded border border-b1 bg-bg px-2 py-1 text-xs text-t1 placeholder:text-t4"
            placeholder="Motivo / observação (opcional)"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isBusy}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => submit('approve')}
              disabled={isBusy || editing}
              className="inline-flex items-center gap-1 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs font-bold text-green-400 transition-colors hover:bg-green-500/20 disabled:opacity-50"
            >
              <ThumbsUp className="h-3 w-3" />
              Aprovar
            </button>
            <button
              type="button"
              onClick={() => submit('request_review')}
              disabled={isBusy || editing}
              className="inline-flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-bold text-purple-300 transition-colors hover:bg-purple-500/20 disabled:opacity-50"
            >
              <ShieldAlert className="h-3 w-3" />
              Pedir revisão
            </button>
            <button
              type="button"
              onClick={() => submit('reject')}
              disabled={isBusy || editing}
              className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
            >
              <ThumbsDown className="h-3 w-3" />
              Rejeitar
            </button>
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={() => submit('edit')}
                  disabled={isBusy}
                  className="inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-400 transition-colors hover:bg-blue-500/20 disabled:opacity-50"
                >
                  <Edit3 className="h-3 w-3" />
                  Salvar edição
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setEditDescription(item.description);
                    setEditQuantity(String(item.quantity));
                    setEditUnitPrice(String(item.unit_price));
                  }}
                  disabled={isBusy}
                  className="text-xs text-t3 underline disabled:opacity-50"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                disabled={isBusy}
                className="inline-flex items-center gap-1 rounded-lg border border-b1 px-3 py-1.5 text-xs font-semibold text-t2 transition-colors hover:bg-s2/40 disabled:opacity-50"
              >
                <Pencil className="h-3 w-3" />
                Editar
              </button>
            )}
            {isBusy && (
              <span className="inline-flex items-center gap-1 text-xs text-t4">
                <Loader2 className="h-3 w-3 animate-spin" />
                Salvando…
              </span>
            )}
          </div>
          {decideMutation.isError && (
            <p className="text-xs text-red-400">
              Falha ao salvar decisão: {decideMutation.error?.message}
            </p>
          )}
          {decideMutation.data?.status === 'schema_not_ready' && (
            <p className="text-xs text-amber-400">
              HITL persistente ainda não configurado ({decideMutation.data.missing_table}).
            </p>
          )}
        </div>
      )}

      {isFinal && (
        <p className="mt-3 flex items-center gap-1 border-t border-b1 pt-3 text-xs text-t3">
          <CheckCircle2 className="h-3 w-3 text-green-400" />
          Decisão registrada. Item aprovado/editado segue aguardando commit oficial (Etapa 4).
        </p>
      )}
    </div>
  );
}

export default function OrcamentistaPreviewItemsHitlPanel({
  runId,
  schemaStatusFromAnalyze,
}: Props) {
  const enabled = Boolean(runId);
  const { data, isFetching, error } = useAnalysisRunPreviewItems(enabled ? runId : null);

  // 1. Sem runId: análise não rodou ainda OU schema ausente desde o /analyze.
  if (!enabled) {
    if (schemaStatusFromAnalyze === 'schema_not_ready') {
      return (
        <EmptyState
          tone="warn"
          title="HITL persistente ainda não configurado"
          description="A migration 003 (orc_analysis_runs/file_reads/evidences/preview_items) e a 004 (orc_hitl_decisions) ainda não foram aplicadas. Rode uma análise quando o schema estiver pronto."
        />
      );
    }
    return (
      <EmptyState
        title="Aguardando primeira análise"
        description="Selecione arquivos na seção 1 e dispare a análise na seção 2. Os itens preliminares aparecerão aqui para revisão humana."
      />
    );
  }

  if (isFetching && !data) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-b1 bg-s1/40 p-4 text-sm text-t3">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando itens preliminares…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
        Falha ao listar itens preliminares: {error.message}
      </div>
    );
  }

  if (data?.schema_status === 'schema_not_ready') {
    return (
      <EmptyState
        tone="warn"
        title="HITL persistente ainda não configurado"
        description={`A tabela ${data.missing_table ?? 'orc_preview_items'} ainda não existe. Aplicar migrations 003 e 004 em staging para habilitar revisão humana.`}
      />
    );
  }

  const items = data?.data ?? [];
  if (items.length === 0) {
    return (
      <EmptyState
        title="Nenhum item preliminar neste run"
        description="A análise atual extraiu evidências mas não gerou itens preliminares. Quando a IA LAB estiver habilitada (EVIS_ORCAMENTISTA_ENABLE_AI_ANALYZE=true), os itens aparecerão aqui."
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-t3">
        {items.length} item(ns) preliminar(es). Aprovar ainda não grava no orçamento oficial —
        commit dedicado entra na Etapa 4.
      </p>
      {items.map((item) => (
        <PreviewItemCard key={item.id} item={item} runId={runId!} />
      ))}
    </div>
  );
}
