/**
 * PIPELINE READ MODELS - ORCAMENTISTA IA
 * Fase 4C.READ: Consultas agregadas ao pipeline.
 *
 * Regras:
 * - Nenhum client Supabase real é importado.
 * - Nenhuma escrita é realizada.
 * - `orcamento_itens` não é tocado (consultado ou modificado).
 */

import { PersistenceResult } from './contracts';
import { toPersistenceErrorResult, PersistenceStage } from './errors';

// ============================================================================
// Tipos auxiliares para Read Client (injetado)
// ============================================================================

export type ReadResponse<T> = {
  data: T | null;
  error: { message?: string; code?: string; details?: string } | null;
};

export interface ReadFilterBuilder<T> extends Promise<ReadResponse<T>> {
  eq(column: string, value: unknown): ReadFilterBuilder<T>;
  order(column: string, options?: { ascending?: boolean }): ReadFilterBuilder<T>;
  limit(count: number): ReadFilterBuilder<T>;
  single(): Promise<ReadResponse<T extends (infer U)[] ? U : T>>;
}

export interface ReadSelectBuilder<T> {
  select(columns?: string): ReadFilterBuilder<T>;
}

export interface SupabaseLikeReadClient {
  from(table: string): ReadSelectBuilder<any[]>;
}

// ============================================================================
// Modelos de Retorno
// ============================================================================

export type OpportunityPipelineSummary = {
  opportunity_id: string;
  total_files: number;
  total_reader_runs: number;
  total_verifier_runs: number;
  open_hitl_issues: number;
  latest_context_status: string | null;
};

export type ReaderVerifierHitlTimelineItem = {
  id: string;
  type: 'reader' | 'verifier' | 'comparison' | 'hitl_issue' | 'hitl_decision' | 'context_snapshot';
  created_at: string;
  status: string;
  details?: unknown;
};

export type LatestContextSnapshot = {
  id: string;
  phase: string;
  context_status: 'validated' | 'pending' | 'blocked' | 'incomplete';
  context_snapshot_json: Record<string, unknown>;
  created_at: string;
};

export type PendingHitlIssue = {
  id: string;
  issue_type: string;
  severity: string;
  title: string;
  status: string;
  created_at: string;
};

export type PipelineHealth = {
  opportunity_id: string;
  is_healthy: boolean;
  warnings: string[];
  blockers: string[];
};

// ============================================================================
// Helper de Execução de Leitura Segura
// ============================================================================

const ALLOWED_READ_TABLES = [
  'opportunity_files',
  'orc_reader_runs',
  'orc_reader_outputs',
  'orc_reader_safety_evaluations',
  'orc_verifier_runs',
  'orc_reader_verifier_comparisons',
  'orc_reader_verifier_divergences',
  'orc_hitl_issues',
  'orc_hitl_decisions',
  'orc_context_snapshots'
];

function assertTableAllowedForRead(tableName: string) {
  if (!ALLOWED_READ_TABLES.includes(tableName)) {
    throw new Error(`Leitura bloqueada: Tabela ${tableName} não permitida nesta fase.`);
  }
}

// ============================================================================
// Read Models Implementations
// ============================================================================

export async function getOpportunityPipelineSummary(
  client: SupabaseLikeReadClient,
  opportunityId: string
): Promise<PersistenceResult<OpportunityPipelineSummary>> {
  try {
    assertTableAllowedForRead('opportunity_files');
    assertTableAllowedForRead('orc_reader_runs');
    assertTableAllowedForRead('orc_verifier_runs');
    assertTableAllowedForRead('orc_hitl_issues');
    assertTableAllowedForRead('orc_context_snapshots');

    // Executa as leituras agregadas simulando count/fetch (assumindo API fluente padrão)
    const [filesRes, readersRes, verifiersRes, hitlRes, snapshotRes] = await Promise.all([
      client.from('opportunity_files').select('id').eq('opportunity_id', opportunityId),
      client.from('orc_reader_runs').select('id').eq('opportunity_id', opportunityId),
      client.from('orc_verifier_runs').select('id').eq('opportunity_id', opportunityId),
      client.from('orc_hitl_issues').select('id, status').eq('opportunity_id', opportunityId),
      client.from('orc_context_snapshots')
        .select('context_status')
        .eq('opportunity_id', opportunityId)
        .order('created_at', { ascending: false })
        .limit(1)
    ]);

    if (filesRes.error) throw filesRes.error;

    const summary: OpportunityPipelineSummary = {
      opportunity_id: opportunityId,
      total_files: filesRes.data?.length ?? 0,
      total_reader_runs: readersRes.data?.length ?? 0,
      total_verifier_runs: verifiersRes.data?.length ?? 0,
      open_hitl_issues: hitlRes.data?.filter((i: any) => i.status === 'pendente' || i.status === 'em_revisao').length ?? 0,
      latest_context_status: snapshotRes.data?.[0]?.context_status ?? null
    };

    return { status: 'success', data: summary, message: 'Summary gerado.' };
  } catch (error) {
    return toPersistenceErrorResult<OpportunityPipelineSummary>('context_snapshot', error);
  }
}

export async function getReaderVerifierHitlTimeline(
  client: SupabaseLikeReadClient,
  opportunityId: string
): Promise<PersistenceResult<ReaderVerifierHitlTimelineItem[]>> {
  try {
    assertTableAllowedForRead('orc_reader_runs');
    assertTableAllowedForRead('orc_verifier_runs');
    assertTableAllowedForRead('orc_hitl_issues');

    const [readers, verifiers, issues] = await Promise.all([
      client.from('orc_reader_runs').select('id, created_at, status').eq('opportunity_id', opportunityId),
      client.from('orc_verifier_runs').select('id, created_at, status').eq('opportunity_id', opportunityId),
      client.from('orc_hitl_issues').select('id, created_at, status, issue_type').eq('opportunity_id', opportunityId)
    ]);

    const timeline: ReaderVerifierHitlTimelineItem[] = [];

    readers.data?.forEach((r: any) => timeline.push({ id: r.id, type: 'reader', created_at: r.created_at, status: r.status }));
    verifiers.data?.forEach((v: any) => timeline.push({ id: v.id, type: 'verifier', created_at: v.created_at, status: v.status }));
    issues.data?.forEach((i: any) => timeline.push({ id: i.id, type: 'hitl_issue', created_at: i.created_at, status: i.status, details: { issue_type: i.issue_type } }));

    // Ordenar do mais recente para o mais antigo
    timeline.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return { status: 'success', data: timeline, message: 'Timeline extraída.' };
  } catch (error) {
    return toPersistenceErrorResult<ReaderVerifierHitlTimelineItem[]>('context_snapshot', error);
  }
}

export async function getLatestContextSnapshot(
  client: SupabaseLikeReadClient,
  opportunityId: string
): Promise<PersistenceResult<LatestContextSnapshot | null>> {
  try {
    assertTableAllowedForRead('orc_context_snapshots');

    const res = await client.from('orc_context_snapshots')
      .select('id, phase, context_status, context_snapshot_json, created_at')
      .eq('opportunity_id', opportunityId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (res.error) throw res.error;

    if (!res.data || res.data.length === 0) {
      return { status: 'success', data: null, message: 'Nenhum snapshot encontrado.' };
    }

    return { status: 'success', data: res.data[0] as LatestContextSnapshot, message: 'Snapshot obtido.' };
  } catch (error) {
    return toPersistenceErrorResult<LatestContextSnapshot | null>('context_snapshot', error);
  }
}

export async function getPendingHitlIssues(
  client: SupabaseLikeReadClient,
  opportunityId: string
): Promise<PersistenceResult<PendingHitlIssue[]>> {
  try {
    assertTableAllowedForRead('orc_hitl_issues');

    const res = await client.from('orc_hitl_issues')
      .select('id, issue_type, severity, title, status, created_at')
      .eq('opportunity_id', opportunityId);

    if (res.error) throw res.error;

    const pending = (res.data || []).filter((i: any) => i.status === 'pendente' || i.status === 'em_revisao');

    return { status: 'success', data: pending as PendingHitlIssue[], message: 'Fila HITL obtida.' };
  } catch (error) {
    return toPersistenceErrorResult<PendingHitlIssue[]>('hitl_issue', error);
  }
}

export async function getPipelineHealthForOpportunity(
  client: SupabaseLikeReadClient,
  opportunityId: string
): Promise<PersistenceResult<PipelineHealth>> {
  try {
    const summaryRes = await getOpportunityPipelineSummary(client, opportunityId);
    if (summaryRes.status !== 'success') return summaryRes as any;

    const health: PipelineHealth = {
      opportunity_id: opportunityId,
      is_healthy: true,
      warnings: [],
      blockers: []
    };

    const s = summaryRes.data;

    if (s.open_hitl_issues > 0) {
      health.is_healthy = false;
      health.blockers.push(`${s.open_hitl_issues} pendência(s) HITL requerem atenção.`);
    }

    if (s.latest_context_status === 'blocked') {
      health.is_healthy = false;
      health.blockers.push('O contexto está ativamente bloqueado.');
    }

    if (s.latest_context_status === 'incomplete') {
      health.is_healthy = false;
      health.warnings.push('O contexto mais recente está incompleto (possível erro no fluxo).');
    }

    if (s.total_files === 0) {
      health.warnings.push('Nenhum documento registrado no pipeline para esta oportunidade.');
    }

    return { status: 'success', data: health, message: 'Health status calculado.' };
  } catch (error) {
    return toPersistenceErrorResult<PipelineHealth>('context_snapshot', error);
  }
}
