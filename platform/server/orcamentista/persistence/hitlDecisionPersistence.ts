/**
 * HITL DECISION PERSISTENCE — ORCAMENTISTA IA (Etapa 3)
 *
 * Persiste decisão humana sobre orc_preview_items na tabela
 * orc_hitl_decisions (run-scoped, preview-item-scoped, append-only).
 *
 * Regra central:
 *   Arquivo gera evidência → evidência justifica item →
 *   item precisa de decisão humana → só aprovado vira oficial.
 *
 * NESTA ETAPA o item aprovado NÃO vira orcamento_itens.
 * O commit oficial é responsabilidade da Etapa 4.
 *
 * Defensiva: se schema 004 não estiver aplicado, retorna 'schema_not_ready'
 * e o caller responde sem quebrar a UI.
 */

export interface HitlDecisionPersistenceClient {
  from(table: string): any;
}

export type HitlDecisionInput = {
  previewItemId: string;
  decision: 'approve' | 'edit' | 'reject' | 'request_review';
  editedPayload?: Record<string, unknown> | null;
  reason?: string | null;
  decidedBy?: string;
};

export type PreviewItemLookup = {
  id: string;
  analysis_run_id: string;
  opportunity_id: string;
  orcamento_id: string | null;
};

export type HitlDecisionResult =
  | {
      status: 'success';
      decisionId: string;
      previewItemStatusAfter:
        | 'approved'
        | 'edited'
        | 'rejected'
        | 'request_review';
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
      status: 'not_found';
      message: string;
    }
  | {
      status: 'persistence_error';
      stage: 'lookup_preview_item' | 'insert_decision';
      message: string;
    };

/** Códigos/mensagens que indicam tabela ausente no PostgREST/Supabase. */
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

/** Códigos/mensagens que indicam linha não encontrada no PostgREST. */
function isNotFoundError(error: {
  message?: string;
  code?: string;
  details?: string;
} | null): boolean {
  if (!error) return false;
  // PostgREST single() retorna PGRST116 quando não há linhas.
  if (error.code === 'PGRST116') return true;
  return false;
}

export function validateHitlDecisionInput(
  input: Partial<HitlDecisionInput> & { previewItemId?: string }
): { ok: true; data: HitlDecisionInput } | { ok: false; field: string; message: string } {
  if (
    typeof input.previewItemId !== 'string' ||
    !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      input.previewItemId
    )
  ) {
    return { ok: false, field: 'previewItemId', message: 'preview_item_id inválido.' };
  }

  if (
    typeof input.decision !== 'string' ||
    !['approve', 'edit', 'reject', 'request_review'].includes(input.decision)
  ) {
    return {
      ok: false,
      field: 'decision',
      message: 'decision deve ser approve | edit | reject | request_review.',
    };
  }

  if (input.decision === 'edit') {
    if (
      !input.editedPayload ||
      typeof input.editedPayload !== 'object' ||
      Array.isArray(input.editedPayload)
    ) {
      return {
        ok: false,
        field: 'editedPayload',
        message: 'editedPayload é obrigatório (objeto) quando decision = edit.',
      };
    }
  } else if (input.editedPayload != null) {
    return {
      ok: false,
      field: 'editedPayload',
      message: 'editedPayload só é permitido quando decision = edit.',
    };
  }

  if (input.reason != null && typeof input.reason !== 'string') {
    return { ok: false, field: 'reason', message: 'reason deve ser string ou null.' };
  }

  if (input.decidedBy != null && typeof input.decidedBy !== 'string') {
    return { ok: false, field: 'decidedBy', message: 'decidedBy deve ser string.' };
  }

  return {
    ok: true,
    data: {
      previewItemId: input.previewItemId,
      decision: input.decision as HitlDecisionInput['decision'],
      editedPayload: input.editedPayload ?? null,
      reason: input.reason ?? null,
      decidedBy: input.decidedBy ?? 'unknown_user',
    },
  };
}

export async function persistHitlDecision(
  client: HitlDecisionPersistenceClient,
  input: HitlDecisionInput
): Promise<HitlDecisionResult> {
  // 1. Lookup do preview_item para preencher FKs (analysis_run_id, opportunity_id).
  const lookup = await (client.from('orc_preview_items') as any)
    .select('id, analysis_run_id, opportunity_id, orcamento_id')
    .eq('id', input.previewItemId)
    .single();

  if (lookup.error) {
    if (isSchemaNotReadyError(lookup.error)) {
      return {
        status: 'schema_not_ready',
        missingTable: 'orc_preview_items',
        message:
          'Schema run-scoped (orc_preview_items) ainda não aplicado. Aplicar migration 003 antes.',
      };
    }
    if (isNotFoundError(lookup.error)) {
      return {
        status: 'not_found',
        message: 'preview_item_id não encontrado.',
      };
    }
    return {
      status: 'persistence_error',
      stage: 'lookup_preview_item',
      message: lookup.error.message ?? 'Falha ao consultar orc_preview_items.',
    };
  }

  const previewItem = lookup.data as PreviewItemLookup;

  // 2. Insert da decisão.
  const decisionRow = {
    analysis_run_id: previewItem.analysis_run_id,
    preview_item_id: previewItem.id,
    opportunity_id: previewItem.opportunity_id,
    decision: input.decision,
    edited_payload_json: input.editedPayload ?? null,
    reason: input.reason ?? null,
    decided_by: input.decidedBy ?? 'unknown_user',
  };

  const decisionInsert = await (client.from('orc_hitl_decisions') as any)
    .insert(decisionRow)
    .select('id')
    .single();

  if (decisionInsert.error) {
    if (isSchemaNotReadyError(decisionInsert.error)) {
      return {
        status: 'schema_not_ready',
        missingTable: 'orc_hitl_decisions',
        message:
          'Schema HITL (orc_hitl_decisions) ainda não aplicado. Aplicar migration 004.',
      };
    }
    return {
      status: 'persistence_error',
      stage: 'insert_decision',
      message: decisionInsert.error.message ?? 'Falha ao inserir orc_hitl_decisions.',
    };
  }

  const previewItemStatusAfter =
    input.decision === 'approve'
      ? 'approved'
      : input.decision === 'edit'
        ? 'edited'
        : input.decision === 'reject'
          ? 'rejected'
          : 'request_review';

  return {
    status: 'success',
    decisionId: decisionInsert.data?.id,
    previewItemStatusAfter,
  };
}
