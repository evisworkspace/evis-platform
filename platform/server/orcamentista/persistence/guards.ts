/**
 * PERSISTENCE GUARDS - ORCAMENTISTA IA
 * Fase 4C.1: Guards de segurança para proteger o banco oficial.
 */

import type { PersistenceResult } from './contracts';

/**
 * Tabelas permitidas para persistência nesta fase.
 */
export const PERSISTENCE_ALLOWLIST = [
  'opportunity_files',
  'orc_reader_runs',
  'orc_reader_outputs',
  'orc_reader_safety_evaluations',
  'orc_verifier_runs',
  'orc_reader_verifier_comparisons',
  'orc_reader_verifier_divergences',
  'orc_hitl_issues',
  'orc_hitl_decisions',
  'orc_context_snapshots',
  // ORCAMENTISTA_003 — run-scoped analysis persistence
  'orc_analysis_runs',
  'orc_file_reads',
  'orc_evidences',
  'orc_preview_items'
] as const;

/**
 * Tabelas explicitamente proibidas para escrita direta via IA nesta fase.
 */
export const PERSISTENCE_BLOCKLIST = [
  'orcamento_itens',
  'orcamentos',
  'opportunities',
  'servicos',
  'obras'
] as const;

/**
 * Flag explícita para bloquear consolidação orçamentária oficial.
 */
export const canWriteConsolidationToBudget = false;

const BUDGET_ITEM_INTENT_KEYS = new Set([
  'orcamento_itens',
  'budget_items',
  'official_budget_items',
  'items_to_insert',
  'items_to_update',
  'items_to_upsert',
  'items_to_delete'
]);

const CONSOLIDATION_TRUE_INTENT_KEYS = new Set([
  'can_write_to_budget',
  'write_to_budget',
  'write_budget_items',
  'consolidate_to_budget',
  'consolidation_released'
]);

/**
 * Verifica se o nome da tabela está na allowlist.
 */
export function isTableAllowed(tableName: string): boolean {
  return (PERSISTENCE_ALLOWLIST as readonly string[]).includes(tableName);
}

/**
 * Verifica se o nome da tabela está na blocklist.
 */
export function isTableBlocked(tableName: string): boolean {
  return (PERSISTENCE_BLOCKLIST as readonly string[]).includes(tableName);
}

/**
 * Guard contra escrita em orcamento_itens.
 */
export function assertNoBudgetItemWrite(tableName: string): PersistenceResult<void> {
  if (tableName === 'orcamento_itens' || isTableBlocked(tableName)) {
    return {
      status: 'blocked',
      reason: 'WRITING_TO_OFFICIAL_TABLE_PROHIBITED',
      message: `Escrita na tabela ${tableName} é proibida nesta fase.`
    };
  }
  return { status: 'success', data: undefined, message: 'OK' };
}

/**
 * Guard para validar payload mínimo (opportunity_id).
 */
export function assertOpportunityId(payload: { opportunity_id?: string | null }): PersistenceResult<void> {
  if (!payload.opportunity_id) {
    return {
      status: 'validation_error',
      errors: ['opportunity_id_missing'],
      message: 'O campo opportunity_id é obrigatório para persistência do Orçamentista.'
    };
  }
  return { status: 'success', data: undefined, message: 'OK' };
}

function hasBlockedConsolidationIntent(value: unknown, seen = new WeakSet<object>()): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }

  if (seen.has(value)) {
    return false;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.some((item) => hasBlockedConsolidationIntent(item, seen));
  }

  return Object.entries(value as Record<string, unknown>).some(([key, nested]) => {
    if (BUDGET_ITEM_INTENT_KEYS.has(key)) {
      return true;
    }

    if (CONSOLIDATION_TRUE_INTENT_KEYS.has(key) && nested === true) {
      return true;
    }

    return hasBlockedConsolidationIntent(nested, seen);
  });
}

/**
 * Guard para impedir tentativa de consolidação orçamentária.
 */
export function assertNoConsolidationIntent(payload?: unknown): PersistenceResult<void> {
  if (!canWriteConsolidationToBudget && hasBlockedConsolidationIntent(payload)) {
    return {
      status: 'blocked',
      reason: 'CONSOLIDATION_BLOCKED',
      message: 'Payload com intenção de consolidação oficial no orçamento está bloqueado nesta fase.'
    };
  }
  return { status: 'success', data: undefined, message: 'OK' };
}

/**
 * Guard mestre para qualquer tentativa de persistência.
 */
export function validatePersistenceIntent(
  tableName: string,
  payload: { opportunity_id?: string | null } & Record<string, unknown>
): PersistenceResult<void> {
  // 1. Verificar allowlist
  if (!isTableAllowed(tableName)) {
    return {
      status: 'blocked',
      reason: 'TABLE_NOT_IN_ALLOWLIST',
      message: `Tabela ${tableName} não está na lista de permissões do Orçamentista.`
    };
  }

  // 2. Verificar blocklist explícita
  const blockCheck = assertNoBudgetItemWrite(tableName);
  if (blockCheck.status !== 'success') return blockCheck;

  // 3. Verificar payload
  const oppCheck = assertOpportunityId(payload);
  if (oppCheck.status !== 'success') return oppCheck;

  // 4. Verificar consolidação
  const consolidationCheck = assertNoConsolidationIntent(payload);
  if (consolidationCheck.status !== 'success') return consolidationCheck;

  return { status: 'success', data: undefined, message: 'Intent validado.' };
}
