import { pathToFileURL } from 'node:url';

import type { PersistenceResult } from './contracts';
import { canWriteConsolidationToBudget, PERSISTENCE_ALLOWLIST, validatePersistenceIntent } from './guards';
import {
  createOrcamentistaPersistenceRepository,
  type OrcamentistaPersistenceRepository,
  type PersistedRow
} from './repository';
import {
  getLatestContextSnapshot,
  getOpportunityPipelineSummary,
  getPendingHitlIssues,
  getPipelineHealthForOpportunity,
  getReaderVerifierHitlTimeline
} from './readModels';
import { persistContextSnapshot, persistHitlStage } from './hitlPersistence';
import { persistReaderStage, type PersistReaderStageInput } from './readerPersistence';
import { persistVerifierStage } from './verifierPersistence';
import { FakePersistenceClient, type FakePersistenceCall } from './fakePersistenceClient';

export type LocalValidationCaseResult = {
  name: string;
  passed: boolean;
  status: string;
  details?: string;
};

export type PersistenceLocalValidationReport = {
  status: 'success' | 'failed';
  canWriteConsolidationToBudget: false;
  touchedTables: string[];
  disallowedTablesTouched: string[];
  happyPath: LocalValidationCaseResult;
  readModels: LocalValidationCaseResult[];
  blockingTests: LocalValidationCaseResult[];
  simulatedConstraintTests: LocalValidationCaseResult[];
  calls: FakePersistenceCall[];
};

type HappyPathData = {
  client: FakePersistenceClient;
  reader: PersistedRow;
  readerOutput: PersistedRow;
  comparison: PersistedRow;
};

const OPPORTUNITY_ID = 'opp-local-4c-validate';

export async function runPersistenceLocalValidation(): Promise<PersistenceLocalValidationReport> {
  const happyPathData = await runHappyPath();
  const readModels = await runReadModelValidation(happyPathData.client);
  const blockingTests = await runBlockingValidation();
  const simulatedConstraintTests = await runSimulatedConstraintValidation();

  const touchedTables = happyPathData.client.getTouchedTables();
  const disallowedTablesTouched = touchedTables.filter(
    (table) => !(PERSISTENCE_ALLOWLIST as readonly string[]).includes(table)
  );

  const happyPath: LocalValidationCaseResult = {
    name: 'happy_path_complete_pipeline',
    passed:
      happyPathData.reader.id.length > 0 &&
      happyPathData.readerOutput.id.length > 0 &&
      happyPathData.comparison.id.length > 0 &&
      disallowedTablesTouched.length === 0 &&
      canWriteConsolidationToBudget === false,
    status: 'success',
    details: `calls=${happyPathData.client.getCalls().length}`
  };

  const allCases = [happyPath, ...readModels, ...blockingTests, ...simulatedConstraintTests];

  return {
    status: allCases.every((test) => test.passed) ? 'success' : 'failed',
    canWriteConsolidationToBudget,
    touchedTables,
    disallowedTablesTouched,
    happyPath,
    readModels,
    blockingTests,
    simulatedConstraintTests,
    calls: happyPathData.client.getCalls()
  };
}

async function runHappyPath(): Promise<HappyPathData> {
  const client = new FakePersistenceClient();
  const repository = createOrcamentistaPersistenceRepository(client);

  const readerStage = await persistReaderStage(repository, buildReaderStageInput());
  assertSuccess('persistReaderStage', readerStage);

  const verifierStage = await persistVerifierStage(repository, {
    verifierRun: {
      opportunity_id: OPPORTUNITY_ID,
      reader_run_id: readerStage.data.lineage.reader_run_id,
      reader_output_id: readerStage.data.lineage.reader_output_id,
      opportunity_file_id: readerStage.data.lineage.opportunity_file_id,
      page_number: 1,
      verifier_motor: 'fake-verifier',
      verifier_output_json: { items: 1 },
      status: 'requires_hitl'
    },
    comparison: {
      reader_output_id: readerStage.data.lineage.reader_output_id,
      opportunity_id: OPPORTUNITY_ID,
      opportunity_file_id: readerStage.data.lineage.opportunity_file_id,
      page_number: 1,
      agreement_score: 0.72,
      agreement_band: 'medium',
      comparison_json: { delta: 'unit_price' },
      dispatch_decision_json: { allowed: false },
      requires_hitl: true,
      blocks_consolidation: true,
      allowed_to_dispatch: false,
      status: 'requires_hitl'
    },
    divergences: [
      {
        reader_output_id: readerStage.data.lineage.reader_output_id,
        opportunity_id: OPPORTUNITY_ID,
        opportunity_file_id: readerStage.data.lineage.opportunity_file_id,
        page_number: 1,
        category: 'quantidade',
        technical_field: 'area',
        title: 'Divergencia de area',
        reason: 'Valores diferentes entre reader e verifier',
        severity: 'media',
        requires_hitl: true,
        blocks_consolidation: true,
        dedupe_key: 'opp-local-area-1'
      }
    ]
  });
  assertSuccess('persistVerifierStage', verifierStage);

  const hitlStage = await persistHitlStage(repository, {
    issue: {
      opportunity_id: OPPORTUNITY_ID,
      comparison_id: verifierStage.data.lineage.comparison_id,
      reader_run_id: readerStage.data.lineage.reader_run_id,
      reader_output_id: readerStage.data.lineage.reader_output_id,
      verifier_run_id: verifierStage.data.lineage.verifier_run_id,
      divergence_id: verifierStage.data.lineage.divergence_ids[0],
      opportunity_file_id: readerStage.data.lineage.opportunity_file_id,
      page_number: 1,
      source_type: 'comparison',
      source_id: verifierStage.data.lineage.comparison_id,
      issue_type: 'divergence',
      severity: 'media',
      status: 'pendente',
      title: 'Validar area divergente',
      description: 'Reader e verifier divergiram sobre area medida.',
      evidence_summary: 'Comparacao local fake.',
      recommended_action: 'Revisar documento original.',
      blocks_dispatch: true,
      blocks_consolidation: true
    },
    decision: {
      opportunity_id: OPPORTUNITY_ID,
      decision_type: 'manter_bloqueado',
      notes: 'Validacao local fake manteve bloqueio.',
      decided_by: 'local-validation',
      dispatch_released: false,
      consolidation_released: false
    },
    contextSnapshot: {
      opportunity_id: OPPORTUNITY_ID,
      source_type: 'hitl_issue',
      source_id: verifierStage.data.lineage.comparison_id,
      phase: 'hitl',
      context_status: 'blocked',
      context_snapshot_json: { stage: 'hitl', blocked: true },
      created_by: 'local-validation'
    }
  });
  assertSuccess('persistHitlStage', hitlStage);

  const contextSnapshot = await persistContextSnapshot(repository, {
    opportunity_id: OPPORTUNITY_ID,
    reader_run_id: readerStage.data.lineage.reader_run_id,
    reader_output_id: readerStage.data.lineage.reader_output_id,
    verifier_run_id: verifierStage.data.lineage.verifier_run_id,
    comparison_id: verifierStage.data.lineage.comparison_id,
    source_type: 'pipeline',
    source_id: verifierStage.data.lineage.comparison_id,
    phase: 'validation',
    context_status: 'validated',
    context_snapshot_json: { stage: 'validation', complete: true },
    created_by: 'local-validation'
  });
  assertSuccess('persistContextSnapshot', contextSnapshot);

  return {
    client,
    reader: readerStage.data.readerRun,
    readerOutput: readerStage.data.readerOutput,
    comparison: verifierStage.data.comparison
  };
}

async function runReadModelValidation(client: FakePersistenceClient): Promise<LocalValidationCaseResult[]> {
  const summary = await getOpportunityPipelineSummary(client, OPPORTUNITY_ID);
  const timeline = await getReaderVerifierHitlTimeline(client, OPPORTUNITY_ID);
  const latestSnapshot = await getLatestContextSnapshot(client, OPPORTUNITY_ID);
  const pendingHitl = await getPendingHitlIssues(client, OPPORTUNITY_ID);
  const health = await getPipelineHealthForOpportunity(client, OPPORTUNITY_ID);

  return [
    {
      name: 'getOpportunityPipelineSummary',
      passed: summary.status === 'success' && summary.data.total_reader_runs === 1,
      status: summary.status
    },
    {
      name: 'getReaderVerifierHitlTimeline',
      passed: timeline.status === 'success' && timeline.data.length >= 3,
      status: timeline.status
    },
    {
      name: 'getLatestContextSnapshot',
      passed: latestSnapshot.status === 'success' && latestSnapshot.data?.context_status === 'validated',
      status: latestSnapshot.status
    },
    {
      name: 'getPendingHitlIssues',
      passed: pendingHitl.status === 'success' && pendingHitl.data.length === 1,
      status: pendingHitl.status
    },
    {
      name: 'getPipelineHealthForOpportunity',
      passed: health.status === 'success' && health.data.is_healthy === false,
      status: health.status
    }
  ];
}

async function runBlockingValidation(): Promise<LocalValidationCaseResult[]> {
  const client = new FakePersistenceClient();
  const repository = createOrcamentistaPersistenceRepository(client);

  const missingOpportunity = await repository.createReaderRun({
    ...buildReaderStageInput().readerRun,
    opportunity_id: ''
  });

  const outsideAllowlist = validatePersistenceIntent('outside_pipeline_table', {
    opportunity_id: OPPORTUNITY_ID
  });

  const blockedBudgetTable = validatePersistenceIntent('orcamento_itens', {
    opportunity_id: OPPORTUNITY_ID
  });

  const directBudgetAccess = await client
    .from('orcamento_itens')
    .insert({ opportunity_id: OPPORTUNITY_ID })
    .select('id')
    .single();

  return [
    {
      name: 'payload_without_opportunity_id',
      passed: missingOpportunity.status === 'validation_error',
      status: missingOpportunity.status
    },
    {
      name: 'table_outside_allowlist',
      passed: outsideAllowlist.status === 'blocked',
      status: outsideAllowlist.status
    },
    {
      name: 'budget_items_write_blocked_by_guard',
      passed: blockedBudgetTable.status === 'blocked' && canWriteConsolidationToBudget === false,
      status: blockedBudgetTable.status
    },
    {
      name: 'budget_items_access_blocked_by_fake_client',
      passed: directBudgetAccess.error?.code === 'P0001',
      status: directBudgetAccess.error?.code ?? 'unexpected_success'
    }
  ];
}

async function runSimulatedConstraintValidation(): Promise<LocalValidationCaseResult[]> {
  const fkResult = await runSimulatedInsertError(
    'orc_reader_runs',
    '23503',
    (repository) => repository.createReaderRun(buildReaderStageInput().readerRun)
  );

  const uniqueResult = await runSimulatedInsertError(
    'orc_hitl_issues',
    '23505',
    (repository) => repository.createHitlIssue({
      opportunity_id: OPPORTUNITY_ID,
      source_type: 'comparison',
      issue_type: 'divergence',
      severity: 'media',
      status: 'pendente',
      title: 'Duplicidade simulada',
      description: 'Erro UNIQUE local simulado.',
      evidence_summary: 'Fake client.',
      recommended_action: 'Validar dedupe.',
      blocks_dispatch: true,
      blocks_consolidation: true
    })
  );

  const checkResult = await runSimulatedInsertError(
    'orc_context_snapshots',
    '23514',
    (repository) => repository.createContextSnapshot({
      opportunity_id: OPPORTUNITY_ID,
      source_type: 'pipeline',
      phase: 'validation',
      context_status: 'validated',
      context_snapshot_json: { simulated: true },
      created_by: 'local-validation'
    })
  );

  return [
    {
      name: 'simulated_fk_error',
      passed: fkResult.status === 'persistence_error',
      status: fkResult.status
    },
    {
      name: 'simulated_unique_error',
      passed: uniqueResult.status === 'persistence_error',
      status: uniqueResult.status
    },
    {
      name: 'simulated_check_error',
      passed: checkResult.status === 'persistence_error',
      status: checkResult.status
    }
  ];
}

async function runSimulatedInsertError(
  table: string,
  code: string,
  execute: (repository: OrcamentistaPersistenceRepository) => Promise<PersistenceResult<PersistedRow>>
): Promise<PersistenceResult<PersistedRow>> {
  const client = new FakePersistenceClient({
    simulatedErrors: [
      {
        table,
        operation: 'insert',
        once: true,
        error: {
          code,
          message: `Simulated ${code} local validation error.`
        }
      }
    ]
  });
  return execute(createOrcamentistaPersistenceRepository(client));
}

function buildReaderStageInput(): PersistReaderStageInput {
  return {
    opportunityFile: {
      opportunity_id: OPPORTUNITY_ID,
      nome: 'memorial-local.pdf',
      storage_path: 'local/fake/memorial-local.pdf',
      categoria: 'memorial',
      mime_type: 'application/pdf',
      tamanho_bytes: 1024
    },
    readerRun: {
      opportunity_id: OPPORTUNITY_ID,
      opportunity_file_id: 'pending-file-id',
      page_number: 1,
      reader_motor: 'fake-reader',
      source_quality: 'local_fake',
      status: 'ready_for_verifier'
    },
    readerOutput: {
      opportunity_id: OPPORTUNITY_ID,
      page_number: 1,
      raw_output_json: { text: 'Area 10m2' },
      normalized_output_json: { area_m2: 10 },
      identified_count: 1,
      inferred_count: 0,
      missing_count: 0,
      confidence_score: 0.91
    },
    safetyEvaluation: {
      opportunity_id: OPPORTUNITY_ID,
      page_number: 1,
      safety_gate_json: { status: 'ok' },
      dimensional_checks_json: { units: 'ok' },
      requires_verifier: true,
      requires_hitl: false,
      blocks_consolidation: true,
      allowed_to_dispatch: false
    }
  };
}

function assertSuccess<T>(stage: string, result: PersistenceResult<T>): asserts result is Extract<
  PersistenceResult<T>,
  { status: 'success' }
> {
  if (result.status !== 'success') {
    throw new Error(`${stage} failed: ${result.message}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runPersistenceLocalValidation()
    .then((report) => {
      console.log(JSON.stringify(report, null, 2));
      if (report.status !== 'success') {
        process.exitCode = 1;
      }
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    });
}
