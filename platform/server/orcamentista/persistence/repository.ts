/**
 * PERSISTENCE REPOSITORY SKELETON - ORCAMENTISTA IA
 * Fase 4C.2: Skeleton server-side da camada de repository.
 *
 * Regras desta fase:
 * - Nenhum client Supabase real e instanciado aqui.
 * - O client e sempre INJETADO pelo chamador. Em 4C.2 nao ha chamador real.
 * - Toda funcao passa por validatePersistenceIntent antes de qualquer escrita.
 * - Nenhuma referencia a `orcamento_itens`, `orcamentos`, `opportunities`,
 *   `servicos` ou `obras` como destino de INSERT/UPDATE/DELETE.
 * - Consolidacao oficial fica bloqueada por `canWriteConsolidationToBudget=false`.
 */

import type {
  RegisterOpportunityFileInput,
  CreateReaderRunInput,
  CreateReaderOutputInput,
  CreateSafetyEvaluationInput,
  CreateVerifierRunInput,
  CreateReaderVerifierComparisonInput,
  CreateDivergenceInput,
  CreateHitlIssueInput,
  CreateHitlDecisionInput,
  CreateContextSnapshotInput,
  PersistenceResult
} from './contracts';

import { validatePersistenceIntent } from './guards';
import { toPersistenceErrorResult, type PersistenceStage } from './errors';

// ============================================================================
// Supabase-like client interface (injetado pelo chamador)
// ============================================================================

export type SupabaseLikeResponse<T> = {
  data: T | null;
  error: { message?: string; code?: string; details?: string } | null;
};

export interface SupabaseLikeSingleBuilder<T> {
  single(): Promise<SupabaseLikeResponse<T>>;
}

export interface SupabaseLikeSelectBuilder<T> {
  select(columns?: string): SupabaseLikeSingleBuilder<T>;
}

export interface SupabaseLikeFromBuilder {
  insert(row: Record<string, unknown>): SupabaseLikeSelectBuilder<Record<string, unknown>>;
}

export interface SupabaseLikeClient {
  from(table: string): SupabaseLikeFromBuilder;
}

// ============================================================================
// Tipos persistidos minimos retornados pelo skeleton
// ============================================================================

export type PersistedOpportunityFile = {
  id: string;
  opportunity_id: string;
  nome: string;
  storage_path?: string | null;
};

export type PersistedRow = { id: string };

// Mapeamento canonico de tabelas (referenciadas por nome para casar com allowlist).
const TABLE = {
  opportunity_files: 'opportunity_files',
  orc_reader_runs: 'orc_reader_runs',
  orc_reader_outputs: 'orc_reader_outputs',
  orc_reader_safety_evaluations: 'orc_reader_safety_evaluations',
  orc_verifier_runs: 'orc_verifier_runs',
  orc_reader_verifier_comparisons: 'orc_reader_verifier_comparisons',
  orc_reader_verifier_divergences: 'orc_reader_verifier_divergences',
  orc_hitl_issues: 'orc_hitl_issues',
  orc_hitl_decisions: 'orc_hitl_decisions',
  orc_context_snapshots: 'orc_context_snapshots'
} as const;

// ============================================================================
// Helper de execucao com guard
// ============================================================================

async function persistRow<T extends Record<string, unknown>>(
  client: SupabaseLikeClient,
  tableName: string,
  row: Record<string, unknown>,
  selectColumns: string,
  stage: PersistenceStage
): Promise<PersistenceResult<T>> {
  const intent = validatePersistenceIntent(tableName, row);
  if (intent.status !== 'success') {
    return intent as PersistenceResult<T>;
  }

  try {
    const response = await client
      .from(tableName)
      .insert(row)
      .select(selectColumns)
      .single();

    if (response.error) {
      return toPersistenceErrorResult<T>(stage, response.error);
    }
    if (!response.data) {
      return toPersistenceErrorResult<T>(stage, new Error('EMPTY_RESPONSE'));
    }

    return {
      status: 'success',
      data: response.data as T,
      message: `${tableName} persisted.`
    };
  } catch (err) {
    return toPersistenceErrorResult<T>(stage, err);
  }
}

// ============================================================================
// 1. opportunity_files
// ============================================================================

export async function createOpportunityFile(
  client: SupabaseLikeClient,
  input: RegisterOpportunityFileInput
): Promise<PersistenceResult<PersistedOpportunityFile>> {
  const row: Record<string, unknown> = {
    opportunity_id: input.opportunity_id,
    nome: input.nome,
    url: input.url ?? null,
    storage_path: input.storage_path ?? null,
    categoria: input.categoria ?? null,
    mime_type: input.mime_type ?? null,
    tamanho_bytes: input.tamanho_bytes ?? null
  };
  return persistRow<PersistedOpportunityFile & Record<string, unknown>>(
    client,
    TABLE.opportunity_files,
    row,
    'id, opportunity_id, nome, storage_path',
    'file'
  );
}

// ============================================================================
// 2. orc_reader_runs
// ============================================================================

export async function createReaderRun(
  client: SupabaseLikeClient,
  input: CreateReaderRunInput
): Promise<PersistenceResult<PersistedRow>> {
  const row: Record<string, unknown> = {
    opportunity_id: input.opportunity_id,
    orcamento_id: input.orcamento_id ?? null,
    opportunity_file_id: input.opportunity_file_id,
    page_number: input.page_number,
    document_id: input.document_id ?? null,
    reader_motor: input.reader_motor,
    source_quality: input.source_quality,
    status: input.status,
    source_refs_json: input.source_refs_json ?? {}
  };
  return persistRow<PersistedRow & Record<string, unknown>>(
    client,
    TABLE.orc_reader_runs,
    row,
    'id',
    'reader_run'
  );
}

// ============================================================================
// 3. orc_reader_outputs
// ============================================================================

export async function createReaderOutput(
  client: SupabaseLikeClient,
  input: CreateReaderOutputInput
): Promise<PersistenceResult<PersistedRow>> {
  const row: Record<string, unknown> = {
    reader_run_id: input.reader_run_id,
    opportunity_id: input.opportunity_id,
    orcamento_id: input.orcamento_id ?? null,
    opportunity_file_id: input.opportunity_file_id,
    page_number: input.page_number,
    document_id: input.document_id ?? null,
    raw_output_json: input.raw_output_json,
    normalized_output_json: input.normalized_output_json,
    identified_count: input.identified_count,
    inferred_count: input.inferred_count,
    missing_count: input.missing_count,
    confidence_score: input.confidence_score ?? null,
    source_refs_json: input.source_refs_json ?? {}
  };
  return persistRow<PersistedRow & Record<string, unknown>>(
    client,
    TABLE.orc_reader_outputs,
    row,
    'id',
    'reader_output'
  );
}

// ============================================================================
// 4. orc_reader_safety_evaluations
// ============================================================================

export async function createSafetyEvaluation(
  client: SupabaseLikeClient,
  input: CreateSafetyEvaluationInput
): Promise<PersistenceResult<PersistedRow>> {
  const row: Record<string, unknown> = {
    reader_run_id: input.reader_run_id,
    reader_output_id: input.reader_output_id,
    opportunity_id: input.opportunity_id,
    orcamento_id: input.orcamento_id ?? null,
    opportunity_file_id: input.opportunity_file_id,
    page_number: input.page_number,
    document_id: input.document_id ?? null,
    safety_gate_json: input.safety_gate_json,
    dimensional_checks_json: input.dimensional_checks_json,
    requires_verifier: input.requires_verifier,
    requires_hitl: input.requires_hitl,
    blocks_consolidation: input.blocks_consolidation,
    allowed_to_dispatch: input.allowed_to_dispatch,
    source_refs_json: input.source_refs_json ?? {}
  };
  return persistRow<PersistedRow & Record<string, unknown>>(
    client,
    TABLE.orc_reader_safety_evaluations,
    row,
    'id',
    'safety_evaluation'
  );
}

// ============================================================================
// 5. orc_verifier_runs
// ============================================================================

export async function createVerifierRun(
  client: SupabaseLikeClient,
  input: CreateVerifierRunInput
): Promise<PersistenceResult<PersistedRow>> {
  const row: Record<string, unknown> = {
    reader_run_id: input.reader_run_id,
    reader_output_id: input.reader_output_id,
    opportunity_id: input.opportunity_id,
    orcamento_id: input.orcamento_id ?? null,
    opportunity_file_id: input.opportunity_file_id,
    page_number: input.page_number,
    document_id: input.document_id ?? null,
    verifier_motor: input.verifier_motor,
    verifier_output_json: input.verifier_output_json,
    status: input.status,
    source_refs_json: input.source_refs_json ?? {}
  };
  return persistRow<PersistedRow & Record<string, unknown>>(
    client,
    TABLE.orc_verifier_runs,
    row,
    'id',
    'verifier_run'
  );
}

// ============================================================================
// 6. orc_reader_verifier_comparisons
// ============================================================================

export async function createReaderVerifierComparison(
  client: SupabaseLikeClient,
  input: CreateReaderVerifierComparisonInput
): Promise<PersistenceResult<PersistedRow>> {
  const row: Record<string, unknown> = {
    reader_output_id: input.reader_output_id,
    verifier_run_id: input.verifier_run_id,
    opportunity_id: input.opportunity_id,
    orcamento_id: input.orcamento_id ?? null,
    opportunity_file_id: input.opportunity_file_id,
    page_number: input.page_number,
    document_id: input.document_id ?? null,
    agreement_score: input.agreement_score,
    agreement_band: input.agreement_band,
    comparison_json: input.comparison_json,
    dispatch_decision_json: input.dispatch_decision_json,
    requires_hitl: input.requires_hitl,
    blocks_consolidation: input.blocks_consolidation,
    allowed_to_dispatch: input.allowed_to_dispatch,
    status: input.status,
    source_refs_json: input.source_refs_json ?? {}
  };
  return persistRow<PersistedRow & Record<string, unknown>>(
    client,
    TABLE.orc_reader_verifier_comparisons,
    row,
    'id',
    'comparison'
  );
}

// ============================================================================
// 7. orc_reader_verifier_divergences
// ============================================================================

export async function createReaderVerifierDivergence(
  client: SupabaseLikeClient,
  input: CreateDivergenceInput
): Promise<PersistenceResult<PersistedRow>> {
  const row: Record<string, unknown> = {
    comparison_id: input.comparison_id,
    reader_output_id: input.reader_output_id,
    verifier_run_id: input.verifier_run_id,
    opportunity_id: input.opportunity_id,
    orcamento_id: input.orcamento_id ?? null,
    opportunity_file_id: input.opportunity_file_id,
    page_number: input.page_number,
    document_id: input.document_id ?? null,
    category: input.category,
    technical_field: input.technical_field,
    affected_item: input.affected_item ?? null,
    discipline: input.discipline ?? null,
    title: input.title,
    reader_value: input.reader_value ?? null,
    verifier_value: input.verifier_value ?? null,
    reason: input.reason,
    severity: input.severity,
    requires_hitl: input.requires_hitl,
    blocks_consolidation: input.blocks_consolidation,
    dedupe_key: input.dedupe_key,
    status: input.status ?? 'aberta',
    source_refs_json: input.source_refs_json ?? {}
  };
  return persistRow<PersistedRow & Record<string, unknown>>(
    client,
    TABLE.orc_reader_verifier_divergences,
    row,
    'id',
    'divergence'
  );
}

// ============================================================================
// 8. orc_hitl_issues
// ============================================================================

export async function createHitlIssue(
  client: SupabaseLikeClient,
  input: CreateHitlIssueInput
): Promise<PersistenceResult<PersistedRow>> {
  const row: Record<string, unknown> = {
    comparison_id: input.comparison_id ?? null,
    reader_run_id: input.reader_run_id ?? null,
    reader_output_id: input.reader_output_id ?? null,
    verifier_run_id: input.verifier_run_id ?? null,
    divergence_id: input.divergence_id ?? null,
    opportunity_id: input.opportunity_id,
    orcamento_id: input.orcamento_id ?? null,
    opportunity_file_id: input.opportunity_file_id ?? null,
    page_number: input.page_number ?? null,
    document_id: input.document_id ?? null,
    source_type: input.source_type,
    source_id: input.source_id ?? null,
    source_ref: input.source_ref ?? null,
    issue_type: input.issue_type,
    severity: input.severity,
    status: input.status,
    title: input.title,
    description: input.description,
    evidence_summary: input.evidence_summary,
    recommended_action: input.recommended_action,
    blocks_dispatch: input.blocks_dispatch,
    blocks_consolidation: input.blocks_consolidation,
    source_refs_json: input.source_refs_json ?? {}
  };
  return persistRow<PersistedRow & Record<string, unknown>>(
    client,
    TABLE.orc_hitl_issues,
    row,
    'id',
    'hitl_issue'
  );
}

// ============================================================================
// 9. orc_hitl_decisions (append-only)
// ============================================================================

export async function createHitlDecision(
  client: SupabaseLikeClient,
  input: CreateHitlDecisionInput
): Promise<PersistenceResult<PersistedRow>> {
  // Append-only: nunca atualizar nem deletar. O trigger
  // `trg_orc_hitl_decisions_no_update_delete` bloqueia UPDATE/DELETE.
  const row: Record<string, unknown> = {
    hitl_issue_id: input.hitl_issue_id,
    opportunity_id: input.opportunity_id,
    orcamento_id: input.orcamento_id ?? null,
    decision_type: input.decision_type,
    notes: input.notes,
    decided_by: input.decided_by,
    dispatch_released: input.dispatch_released,
    consolidation_released: input.consolidation_released,
    source_refs_json: input.source_refs_json ?? {},
    issue_snapshot_json: input.issue_snapshot_json ?? {},
    decision_payload_json: input.decision_payload_json ?? {}
  };
  return persistRow<PersistedRow & Record<string, unknown>>(
    client,
    TABLE.orc_hitl_decisions,
    row,
    'id',
    'hitl_decision'
  );
}

// ============================================================================
// 10. orc_context_snapshots
// ============================================================================

export async function createContextSnapshot(
  client: SupabaseLikeClient,
  input: CreateContextSnapshotInput
): Promise<PersistenceResult<PersistedRow>> {
  const row: Record<string, unknown> = {
    opportunity_id: input.opportunity_id,
    orcamento_id: input.orcamento_id ?? null,
    opportunity_file_id: input.opportunity_file_id ?? null,
    page_number: input.page_number ?? null,
    document_id: input.document_id ?? null,
    reader_run_id: input.reader_run_id ?? null,
    reader_output_id: input.reader_output_id ?? null,
    verifier_run_id: input.verifier_run_id ?? null,
    comparison_id: input.comparison_id ?? null,
    hitl_issue_id: input.hitl_issue_id ?? null,
    source_type: input.source_type,
    source_id: input.source_id ?? null,
    source_ref: input.source_ref ?? null,
    phase: input.phase,
    context_status: input.context_status,
    context_snapshot_json: input.context_snapshot_json,
    created_by: input.created_by,
    source_refs_json: input.source_refs_json ?? {}
  };
  return persistRow<PersistedRow & Record<string, unknown>>(
    client,
    TABLE.orc_context_snapshots,
    row,
    'id',
    'context_snapshot'
  );
}

// ============================================================================
// Repository injetavel para services/coordinators
// ============================================================================

export type OrcamentistaPersistenceRepository = {
  createOpportunityFile(input: RegisterOpportunityFileInput): Promise<PersistenceResult<PersistedOpportunityFile>>;
  createReaderRun(input: CreateReaderRunInput): Promise<PersistenceResult<PersistedRow>>;
  createReaderOutput(input: CreateReaderOutputInput): Promise<PersistenceResult<PersistedRow>>;
  createSafetyEvaluation(input: CreateSafetyEvaluationInput): Promise<PersistenceResult<PersistedRow>>;
  createVerifierRun(input: CreateVerifierRunInput): Promise<PersistenceResult<PersistedRow>>;
  createReaderVerifierComparison(
    input: CreateReaderVerifierComparisonInput
  ): Promise<PersistenceResult<PersistedRow>>;
  createReaderVerifierDivergence(input: CreateDivergenceInput): Promise<PersistenceResult<PersistedRow>>;
  createHitlIssue(input: CreateHitlIssueInput): Promise<PersistenceResult<PersistedRow>>;
  createHitlDecision(input: CreateHitlDecisionInput): Promise<PersistenceResult<PersistedRow>>;
  createContextSnapshot(input: CreateContextSnapshotInput): Promise<PersistenceResult<PersistedRow>>;
};

export function createOrcamentistaPersistenceRepository(
  client: SupabaseLikeClient
): OrcamentistaPersistenceRepository {
  return {
    createOpportunityFile: (input) => createOpportunityFile(client, input),
    createReaderRun: (input) => createReaderRun(client, input),
    createReaderOutput: (input) => createReaderOutput(client, input),
    createSafetyEvaluation: (input) => createSafetyEvaluation(client, input),
    createVerifierRun: (input) => createVerifierRun(client, input),
    createReaderVerifierComparison: (input) => createReaderVerifierComparison(client, input),
    createReaderVerifierDivergence: (input) => createReaderVerifierDivergence(client, input),
    createHitlIssue: (input) => createHitlIssue(client, input),
    createHitlDecision: (input) => createHitlDecision(client, input),
    createContextSnapshot: (input) => createContextSnapshot(client, input)
  };
}
