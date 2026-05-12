/**
 * PERSISTENCE ERRORS - ORCAMENTISTA IA
 * Fase 4C.2: Tipos e helpers para mapear erros do repository skeleton.
 *
 * Esta camada nao instancia client Supabase real e nao escreve em
 * `orcamento_itens`. Erros aqui sao apenas para tipar o retorno das
 * funcoes skeleton quando um client externo for injetado em fases futuras.
 */

import type { PersistenceResult } from './contracts';

export type PersistenceStage =
  | 'file'
  | 'reader_run'
  | 'reader_output'
  | 'safety_evaluation'
  | 'verifier_run'
  | 'comparison'
  | 'divergence'
  | 'hitl_issue'
  | 'hitl_decision'
  | 'context_snapshot';

export type PersistenceErrorCode =
  | 'UNKNOWN'
  | 'EMPTY_RESPONSE'
  | 'FOREIGN_KEY_VIOLATION'
  | 'UNIQUE_VIOLATION'
  | 'CHECK_VIOLATION'
  | 'TRIGGER_BLOCKED'
  | 'NOT_NULL_VIOLATION'
  | 'PERMISSION_DENIED'
  | 'NETWORK_ERROR';

export type OrcamentistaPersistenceError = {
  code: PersistenceErrorCode;
  message: string;
  stage: PersistenceStage;
  retryable: boolean;
  source_ref?: string;
};

type PostgrestLikeError = {
  message?: string;
  code?: string;
  details?: string;
};

const PG_CODE_MAP: Record<string, PersistenceErrorCode> = {
  '23503': 'FOREIGN_KEY_VIOLATION',
  '23505': 'UNIQUE_VIOLATION',
  '23514': 'CHECK_VIOLATION',
  '23502': 'NOT_NULL_VIOLATION',
  '42501': 'PERMISSION_DENIED',
  'P0001': 'TRIGGER_BLOCKED'
};

const RETRYABLE_CODES: ReadonlySet<PersistenceErrorCode> = new Set([
  'NETWORK_ERROR'
]);

function isPostgrestLikeError(value: unknown): value is PostgrestLikeError {
  return typeof value === 'object' && value !== null && ('message' in value || 'code' in value);
}

export function mapPersistenceError(stage: PersistenceStage, err: unknown): OrcamentistaPersistenceError {
  if (isPostgrestLikeError(err)) {
    const pgCode = err.code ?? '';
    const code = PG_CODE_MAP[pgCode] ?? 'UNKNOWN';
    return {
      code,
      message: err.message ?? `Erro nao especificado em ${stage}.`,
      stage,
      retryable: RETRYABLE_CODES.has(code)
    };
  }

  if (err instanceof Error) {
    return {
      code: 'UNKNOWN',
      message: err.message,
      stage,
      retryable: false
    };
  }

  return {
    code: 'UNKNOWN',
    message: `Erro nao identificado em ${stage}.`,
    stage,
    retryable: false
  };
}

export function toPersistenceErrorResult<T>(stage: PersistenceStage, err: unknown): PersistenceResult<T> {
  const mapped = mapPersistenceError(stage, err);
  return {
    status: 'persistence_error',
    error: mapped,
    message: mapped.message
  };
}
