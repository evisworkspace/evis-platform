/**
 * COMMIT BATCH PERSISTENCE — ORCAMENTISTA IA (Etapa 4)
 *
 * Promove preview_items aprovados/editados para orcamento_itens (oficial).
 * Esta é a ÚNICA rota controlada de escrita em orcamento_itens por IA.
 *
 * Regras invioláveis:
 *   1. Endpoint só executa com EVIS_ORCAMENTISTA_ENABLE_OFFICIAL_COMMIT=true.
 *   2. Só itens com status 'approved' ou 'edited' são promovidos.
 *   3. Itens sem source_evidence_ids são rejeitados (sem origem rastreável).
 *   4. Itens sem description são rejeitados.
 *   5. Cada batch é registrado em orc_commit_batches (append-only).
 *
 * O caller (endpoint) é responsável por verificar a flag de env antes de chamar.
 * Este módulo aceita dois clients:
 *   - readClient: lê orc_preview_items (pode ser o GuardedStagingClient)
 *   - writeClient: escreve em orcamento_itens + orc_commit_batches (raw client)
 */

export interface CommitBatchReadClient {
  from(table: string): any;
}

export interface CommitBatchWriteClient {
  from(table: string): any;
}

export type CommitBatchInput = {
  runId: string;
  orcamentoId: string;
  opportunityId: string;
  committedBy?: string;
};

type PreviewItemRow = {
  id: string;
  analysis_run_id: string;
  opportunity_id: string;
  orcamento_id: string | null;
  codigo: string | null;
  description: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  categoria: string | null;
  origem: string | null;
  confidence: number | null;
  status: 'approved' | 'edited' | 'pending' | 'rejected' | 'request_review';
  source_evidence_ids: string[];
  edited_payload_json?: Record<string, unknown> | null;
  observacoes: string | null;
};

type SkipReason = {
  preview_item_id: string;
  reason: 'no_evidence' | 'empty_description' | 'status_not_approved';
};

export type CommitBatchResult =
  | {
      status: 'success';
      batchId: string;
      totalCommitted: number;
      totalSkipped: number;
      committedItemIds: string[];
      skipReasons: SkipReason[];
    }
  | {
      status: 'flag_disabled';
      message: string;
    }
  | {
      status: 'no_approved_items';
      message: string;
    }
  | {
      status: 'schema_not_ready';
      missingTable: string;
      message: string;
    }
  | {
      status: 'validation_error';
      message: string;
      field?: string;
    }
  | {
      status: 'persistence_error';
      stage: 'fetch_preview_items' | 'insert_orcamento_itens' | 'insert_commit_batch';
      message: string;
    };

const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function validateCommitBatchInput(
  input: Partial<CommitBatchInput> & { runId?: string }
):
  | { ok: true; data: CommitBatchInput }
  | { ok: false; field: string; message: string } {
  if (!input.runId || !UUID_RE.test(input.runId)) {
    return { ok: false, field: 'runId', message: 'runId deve ser UUID válido.' };
  }
  if (
    !input.orcamentoId ||
    typeof input.orcamentoId !== 'string' ||
    input.orcamentoId.trim().length === 0
  ) {
    return {
      ok: false,
      field: 'orcamentoId',
      message: 'orcamentoId é obrigatório.',
    };
  }
  if (
    !input.opportunityId ||
    typeof input.opportunityId !== 'string' ||
    input.opportunityId.trim().length === 0
  ) {
    return {
      ok: false,
      field: 'opportunityId',
      message: 'opportunityId é obrigatório.',
    };
  }
  return {
    ok: true,
    data: {
      runId: input.runId,
      orcamentoId: input.orcamentoId.trim(),
      opportunityId: input.opportunityId.trim(),
      committedBy: input.committedBy ?? 'unknown_user',
    },
  };
}

function isSchemaNotReadyError(error: {
  message?: string;
  code?: string;
  details?: string;
} | null): boolean {
  if (!error) return false;
  if (error.code === '42P01') return true;
  if (error.code === 'PGRST205') return true;
  const msg = `${error.message ?? ''} ${error.details ?? ''}`.toLowerCase();
  if (msg.includes('could not find the table')) return true;
  if (msg.includes('relation') && msg.includes('does not exist')) return true;
  if (msg.includes('schema cache')) return true;
  return false;
}

/**
 * Fetches approved/edited preview items for a run and promotes them to
 * orcamento_itens using the write client (raw, not guarded).
 *
 * @param readClient  - any client that can read orc_preview_items
 * @param writeClient - raw (unguarded) client that can write orcamento_itens
 * @param input       - validated commit input
 */
export async function persistCommitBatch(
  readClient: CommitBatchReadClient,
  writeClient: CommitBatchWriteClient,
  input: CommitBatchInput
): Promise<CommitBatchResult> {
  // ── 1. Fetch candidate preview items ────────────────────────────────────
  const fetchResult = await (readClient.from('orc_preview_items') as any)
    .select(
      'id, analysis_run_id, opportunity_id, orcamento_id, codigo, description, unit, quantity, unit_price, total_price, categoria, origem, confidence, status, source_evidence_ids, observacoes'
    )
    .eq('analysis_run_id', input.runId)
    .in('status', ['approved', 'edited']);

  if (fetchResult.error) {
    if (isSchemaNotReadyError(fetchResult.error)) {
      return {
        status: 'schema_not_ready',
        missingTable: 'orc_preview_items',
        message:
          'Tabela orc_preview_items não encontrada. Aplicar migration 003 antes de commit.',
      };
    }
    return {
      status: 'persistence_error',
      stage: 'fetch_preview_items',
      message: fetchResult.error.message ?? 'Falha ao consultar orc_preview_items.',
    };
  }

  const candidates: PreviewItemRow[] = fetchResult.data ?? [];

  if (candidates.length === 0) {
    return {
      status: 'no_approved_items',
      message:
        'Nenhum item com status approved/edited neste run. Revise os itens no painel HITL antes de commitar.',
    };
  }

  // ── 2. Filter and build orcamento_itens rows ─────────────────────────────
  const toInsert: Record<string, unknown>[] = [];
  const skipReasons: SkipReason[] = [];

  for (const item of candidates) {
    const evidenceIds: string[] = Array.isArray(item.source_evidence_ids)
      ? item.source_evidence_ids.filter(Boolean)
      : [];

    if (evidenceIds.length === 0) {
      skipReasons.push({ preview_item_id: item.id, reason: 'no_evidence' });
      continue;
    }

    const description = (item.description ?? '').trim();
    if (!description) {
      skipReasons.push({ preview_item_id: item.id, reason: 'empty_description' });
      continue;
    }

    toInsert.push({
      orcamento_id: input.orcamentoId,
      codigo: item.codigo ?? null,
      descricao: description,
      unidade: item.unit ?? 'un',
      quantidade: Number.isFinite(item.quantity) ? item.quantity : 0,
      valor_unitario: Number.isFinite(item.unit_price) ? item.unit_price : 0,
      valor_total: Number.isFinite(item.total_price) ? item.total_price : 0,
      origem: 'ia' as const,
    });
  }

  if (toInsert.length === 0) {
    return {
      status: 'no_approved_items',
      message: `${candidates.length} item(ns) aprovado(s), mas todos foram pulados (${skipReasons.length} sem evidência ou descrição). Revise os itens no painel HITL.`,
    };
  }

  // ── 3. Insert into orcamento_itens (raw write client) ───────────────────
  const insertResult = await (writeClient.from('orcamento_itens') as any)
    .insert(toInsert)
    .select('id');

  if (insertResult.error) {
    return {
      status: 'persistence_error',
      stage: 'insert_orcamento_itens',
      message: insertResult.error.message ?? 'Falha ao inserir orcamento_itens.',
    };
  }

  const committedItemIds: string[] = ((insertResult.data as any[]) ?? []).map(
    (row: { id: string }) => row.id
  );

  // ── 4. Record the batch in orc_commit_batches ────────────────────────────
  const batchRow = {
    analysis_run_id: input.runId,
    opportunity_id: input.opportunityId,
    orcamento_id: input.orcamentoId,
    total_items_committed: committedItemIds.length,
    total_items_skipped: skipReasons.length,
    committed_item_ids: committedItemIds,
    skip_reasons_json: skipReasons,
    safety_flags_json: {
      officialBudgetWrite: 'executed_via_etapa4',
      canWriteConsolidationToBudget: true,
      touchedBudgetItemsTable: true,
      flag: 'EVIS_ORCAMENTISTA_ENABLE_OFFICIAL_COMMIT',
    },
    committed_by: input.committedBy ?? 'unknown_user',
  };

  const batchInsert = await (writeClient.from('orc_commit_batches') as any)
    .insert(batchRow)
    .select('id')
    .single();

  if (batchInsert.error) {
    if (isSchemaNotReadyError(batchInsert.error)) {
      return {
        status: 'schema_not_ready',
        missingTable: 'orc_commit_batches',
        message:
          'Itens foram gravados em orcamento_itens, mas orc_commit_batches não existe. Aplicar migration 005.',
      };
    }
    return {
      status: 'persistence_error',
      stage: 'insert_commit_batch',
      message: batchInsert.error.message ?? 'Falha ao registrar orc_commit_batches.',
    };
  }

  const batchId: string = batchInsert.data?.id ?? '';

  return {
    status: 'success',
    batchId,
    totalCommitted: committedItemIds.length,
    totalSkipped: skipReasons.length,
    committedItemIds,
    skipReasons,
  };
}
