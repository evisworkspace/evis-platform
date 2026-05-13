import type { PersistenceResult } from './persistence/contracts';
import { canWriteConsolidationToBudget } from './persistence/guards';
import {
  createOrcamentistaPersistenceRepository,
  type SupabaseLikeResponse
} from './persistence/repository';
import { persistContextSnapshot, persistHitlStage } from './persistence/hitlPersistence';
import { persistReaderStage } from './persistence/readerPersistence';
import { persistVerifierStage } from './persistence/verifierPersistence';
import {
  getLatestContextSnapshot,
  getOpportunityPipelineSummary,
  type LatestContextSnapshot,
  type OpportunityPipelineSummary
} from './persistence/readModels';
import {
  createStagingClientFromEnv,
  type GuardedStagingClient,
  type StagingClientBundle
} from './persistence/stagingClient';

export type OrcamentistaManualRunMode = 'manual_test' | 'existing';

export type OrcamentistaManualRunInput = {
  mode: OrcamentistaManualRunMode;
  opportunityId?: string;
  orcamentoId?: string | null;
  opportunityFileId?: string | null;
  marker?: string;
};

export type OrcamentistaManualRunSummary = {
  mode: OrcamentistaManualRunMode;
  marker: string;
  projectRef: string;
  opportunityId: string;
  orcamentoId: string | null;
  opportunityFileId: string;
  readerRunId: string;
  readerOutputId: string;
  safetyEvaluationId: string;
  verifierRunId: string;
  comparisonId: string;
  divergenceIds: string[];
  hitlIssueId: string;
  hitlDecisionId?: string;
  hitlContextSnapshotId?: string;
  finalContextSnapshotId: string;
  pipelineSummary: OpportunityPipelineSummary;
  latestContextSnapshot: LatestContextSnapshot | null;
  canWriteConsolidationToBudget: false;
  touchedTables: string[];
  touchedBudgetItemsTable: boolean;
};

type AnchorIds = {
  opportunityId: string;
  orcamentoId: string | null;
  opportunityFileId?: string | null;
};

type IdRow = { id: string };

const DEFAULT_MARKER = 'EVIS_TEST_MANUAL_RUN_MVP';

export async function runOrcamentistaManualRun(
  input: OrcamentistaManualRunInput,
  bundle: StagingClientBundle = createStagingClientFromEnv()
): Promise<PersistenceResult<OrcamentistaManualRunSummary>> {
  if (canWriteConsolidationToBudget !== false) {
    return {
      status: 'blocked',
      reason: 'CONSOLIDATION_FLAG_NOT_BLOCKED',
      message: 'Manual run aborted because budget consolidation is not blocked.'
    };
  }

  const marker = input.marker ?? DEFAULT_MARKER;

  try {
    const anchors = await resolveAnchors(bundle.client, input, marker);
    const repository = createOrcamentistaPersistenceRepository(bundle.client);

    const readerStage = await persistReaderStage(repository, {
      opportunityFile: anchors.opportunityFileId
        ? undefined
        : {
          opportunity_id: anchors.opportunityId,
          nome: `${marker}_document.pdf`,
          storage_path: `${marker}/document.pdf`,
          categoria: 'manual_test',
          mime_type: 'application/pdf',
          tamanho_bytes: 1024
        },
      readerRun: {
        opportunity_id: anchors.opportunityId,
        orcamento_id: anchors.orcamentoId,
        opportunity_file_id: anchors.opportunityFileId ?? 'pending-opportunity-file',
        page_number: 1,
        document_id: `${marker}_DOC_001`,
        reader_motor: `${marker}_reader_mvp`,
        source_quality: 'manual_synthetic',
        status: 'ready_for_verifier',
        source_refs_json: { marker }
      },
      readerOutput: {
        opportunity_id: anchors.opportunityId,
        orcamento_id: anchors.orcamentoId,
        page_number: 1,
        document_id: `${marker}_DOC_001`,
        raw_output_json: {
          marker,
          extracted_text: 'Manual run synthetic document: area 10 m2, missing finish specification.'
        },
        normalized_output_json: {
          marker,
          areas: [{ tipo: 'construida', valor_m2: 10 }],
          lacunas: ['Especificacao de acabamento pendente para revisao humana.']
        },
        identified_count: 1,
        inferred_count: 0,
        missing_count: 1,
        confidence_score: 0.82,
        source_refs_json: { marker }
      },
      safetyEvaluation: {
        opportunity_id: anchors.opportunityId,
        orcamento_id: anchors.orcamentoId,
        page_number: 1,
        document_id: `${marker}_DOC_001`,
        safety_gate_json: {
          marker,
          gate: 'blocked',
          can_write_to_budget: false,
          reason: 'manual_run_requires_hitl'
        },
        dimensional_checks_json: {
          marker,
          units_checked: true,
          missing_required_fields: ['acabamento']
        },
        requires_verifier: true,
        requires_hitl: true,
        blocks_consolidation: true,
        allowed_to_dispatch: false,
        source_refs_json: { marker }
      }
    });
    if (readerStage.status !== 'success') return readerStage;

    const verifierStage = await persistVerifierStage(repository, {
      verifierRun: {
        opportunity_id: anchors.opportunityId,
        orcamento_id: anchors.orcamentoId,
        reader_run_id: readerStage.data.lineage.reader_run_id,
        reader_output_id: readerStage.data.lineage.reader_output_id,
        opportunity_file_id: readerStage.data.lineage.opportunity_file_id,
        page_number: 1,
        document_id: `${marker}_DOC_001`,
        verifier_motor: `${marker}_verifier_mvp`,
        verifier_output_json: {
          marker,
          verified: false,
          reason: 'Synthetic verifier keeps HITL gate closed.'
        },
        status: 'requires_hitl',
        source_refs_json: { marker }
      },
      comparison: {
        opportunity_id: anchors.opportunityId,
        orcamento_id: anchors.orcamentoId,
        reader_output_id: readerStage.data.lineage.reader_output_id,
        opportunity_file_id: readerStage.data.lineage.opportunity_file_id,
        page_number: 1,
        document_id: `${marker}_DOC_001`,
        agreement_score: 0.55,
        agreement_band: 'medium',
        comparison_json: {
          marker,
          divergence: 'Verifier requires human confirmation for finish specification.'
        },
        dispatch_decision_json: {
          marker,
          allowed_to_dispatch: false,
          can_write_to_budget: false
        },
        requires_hitl: true,
        blocks_consolidation: true,
        allowed_to_dispatch: false,
        status: 'requires_hitl',
        source_refs_json: { marker }
      },
      divergences: [
        {
          opportunity_id: anchors.opportunityId,
          orcamento_id: anchors.orcamentoId,
          reader_output_id: readerStage.data.lineage.reader_output_id,
          opportunity_file_id: readerStage.data.lineage.opportunity_file_id,
          page_number: 1,
          document_id: `${marker}_DOC_001`,
          category: 'documentacao',
          technical_field: 'acabamento',
          title: `${marker} - acabamento pendente`,
          reason: 'Reader encontrou lacuna que exige decisao humana antes de qualquer orcamento oficial.',
          severity: 'media',
          requires_hitl: true,
          blocks_consolidation: true,
          dedupe_key: `${marker}_DEDUPE_ACABAMENTO_001`,
          source_refs_json: { marker }
        }
      ]
    });
    if (verifierStage.status !== 'success') return verifierStage;

    const hitlStage = await persistHitlStage(repository, {
      issue: {
        opportunity_id: anchors.opportunityId,
        orcamento_id: anchors.orcamentoId,
        comparison_id: verifierStage.data.lineage.comparison_id,
        reader_run_id: readerStage.data.lineage.reader_run_id,
        reader_output_id: readerStage.data.lineage.reader_output_id,
        verifier_run_id: verifierStage.data.lineage.verifier_run_id,
        divergence_id: verifierStage.data.lineage.divergence_ids[0],
        opportunity_file_id: readerStage.data.lineage.opportunity_file_id,
        page_number: 1,
        document_id: `${marker}_DOC_001`,
        source_type: 'manual_run_mvp',
        source_id: verifierStage.data.lineage.comparison_id,
        issue_type: 'missing_specification',
        severity: 'media',
        status: 'pendente',
        title: `${marker} - revisar especificacao pendente`,
        description: 'Manual Run MVP gerou pendencia HITL sintetica para manter o gate fechado.',
        evidence_summary: 'Documento sintetico indica area, mas nao especifica acabamento.',
        recommended_action: 'Orçamentista humano deve confirmar acabamento antes de qualquer consolidacao.',
        blocks_dispatch: true,
        blocks_consolidation: true,
        source_refs_json: { marker }
      },
      decision: {
        opportunity_id: anchors.opportunityId,
        orcamento_id: anchors.orcamentoId,
        decision_type: 'manter_bloqueado',
        notes: 'Manual Run MVP mantem gate bloqueado por seguranca.',
        decided_by: `${marker}_synthetic_reviewer`,
        dispatch_released: false,
        consolidation_released: false,
        source_refs_json: { marker },
        issue_snapshot_json: { marker, status: 'pendente' },
        decision_payload_json: {
          marker,
          gate: 'blocked',
          can_write_to_budget: false
        }
      },
      contextSnapshot: {
        opportunity_id: anchors.opportunityId,
        orcamento_id: anchors.orcamentoId,
        opportunity_file_id: readerStage.data.lineage.opportunity_file_id,
        page_number: 1,
        document_id: `${marker}_DOC_001`,
        reader_run_id: readerStage.data.lineage.reader_run_id,
        reader_output_id: readerStage.data.lineage.reader_output_id,
        verifier_run_id: verifierStage.data.lineage.verifier_run_id,
        comparison_id: verifierStage.data.lineage.comparison_id,
        source_type: 'hitl_issue',
        source_id: verifierStage.data.lineage.comparison_id,
        phase: 'manual_run_mvp_hitl',
        context_status: 'blocked',
        context_snapshot_json: {
          marker,
          gate: 'blocked',
          can_write_to_budget: false,
          dispatch_released: false,
          consolidation_released: false
        },
        created_by: 'manual_run_mvp',
        source_refs_json: { marker }
      }
    });
    if (hitlStage.status !== 'success') return hitlStage;

    const finalSnapshot = await persistContextSnapshot(repository, {
      opportunity_id: anchors.opportunityId,
      orcamento_id: anchors.orcamentoId,
      opportunity_file_id: readerStage.data.lineage.opportunity_file_id,
      page_number: 1,
      document_id: `${marker}_DOC_001`,
      reader_run_id: readerStage.data.lineage.reader_run_id,
      reader_output_id: readerStage.data.lineage.reader_output_id,
      verifier_run_id: verifierStage.data.lineage.verifier_run_id,
      comparison_id: verifierStage.data.lineage.comparison_id,
      hitl_issue_id: hitlStage.data.lineage.hitl_issue_id,
      source_type: 'manual_run_mvp',
      source_id: hitlStage.data.lineage.hitl_issue_id,
      phase: 'manual_run_mvp_final_gate',
      context_status: 'blocked',
      context_snapshot_json: {
        marker,
        gate: 'blocked',
        can_write_to_budget: false,
        dispatch_released: false,
        consolidation_released: false,
        summary: 'Pipeline persisted; official budget write remains blocked.'
      },
      created_by: 'manual_run_mvp',
      source_refs_json: { marker }
    });
    if (finalSnapshot.status !== 'success') return finalSnapshot;

    const pipelineSummary = await getOpportunityPipelineSummary(bundle.client, anchors.opportunityId);
    if (pipelineSummary.status !== 'success') return pipelineSummary;

    const latestContextSnapshot = await getLatestContextSnapshot(bundle.client, anchors.opportunityId);
    if (latestContextSnapshot.status !== 'success') return latestContextSnapshot;

    const touchedTables = bundle.getTouchedTables();
    const touchedBudgetItemsTable = touchedTables.includes('orcamento_itens');

    if (touchedBudgetItemsTable) {
      return {
        status: 'blocked',
        reason: 'BUDGET_ITEMS_TABLE_TOUCHED',
        message: 'Manual run touched the official budget items table and was blocked.'
      };
    }

    return {
      status: 'success',
      data: {
        mode: input.mode,
        marker,
        projectRef: bundle.projectRef,
        opportunityId: anchors.opportunityId,
        orcamentoId: anchors.orcamentoId,
        opportunityFileId: readerStage.data.lineage.opportunity_file_id,
        readerRunId: readerStage.data.lineage.reader_run_id,
        readerOutputId: readerStage.data.lineage.reader_output_id,
        safetyEvaluationId: readerStage.data.lineage.safety_evaluation_id,
        verifierRunId: verifierStage.data.lineage.verifier_run_id,
        comparisonId: verifierStage.data.lineage.comparison_id,
        divergenceIds: verifierStage.data.lineage.divergence_ids,
        hitlIssueId: hitlStage.data.lineage.hitl_issue_id,
        hitlDecisionId: hitlStage.data.lineage.hitl_decision_id,
        hitlContextSnapshotId: hitlStage.data.lineage.context_snapshot_id,
        finalContextSnapshotId: finalSnapshot.data.id,
        pipelineSummary: pipelineSummary.data,
        latestContextSnapshot: latestContextSnapshot.data,
        canWriteConsolidationToBudget,
        touchedTables,
        touchedBudgetItemsTable
      },
      message: 'Orçamentista Manual Run MVP completed.'
    };
  } catch (error) {
    return {
      status: 'persistence_error',
      error,
      message: error instanceof Error ? error.message : 'Manual run failed.'
    };
  }
}

async function resolveAnchors(
  client: GuardedStagingClient,
  input: OrcamentistaManualRunInput,
  marker: string
): Promise<AnchorIds> {
  if (input.mode === 'existing') {
    if (!input.opportunityId) {
      throw new Error('existing mode requires opportunityId.');
    }

    return {
      opportunityId: input.opportunityId,
      orcamentoId: input.orcamentoId ?? null,
      opportunityFileId: input.opportunityFileId ?? null
    };
  }

  const orcamento = await insertAndReturnId(client, 'orcamentos', {
    nome: `${marker} Manual Run Budget`,
    cliente: `${marker} Synthetic Client`,
    status: 'rascunho',
    bdi: 25,
    total_bruto: 0,
    total_final: 0,
    observacoes: `${marker} synthetic budget anchor`
  });

  const opportunity = await insertAndReturnId(client, 'opportunities', {
    titulo: `${marker} Manual Run Opportunity`,
    status: 'em_orcamento',
    origem: 'manual_run_mvp',
    prioridade: 'media',
    cliente_nome_snapshot: `${marker} Synthetic Client`,
    orcamentista_workspace_id: `${marker}_workspace`,
    orcamento_id: orcamento.id,
    observacao: `${marker} synthetic opportunity anchor`
  });

  return {
    opportunityId: opportunity.id,
    orcamentoId: orcamento.id
  };
}

async function insertAndReturnId(
  client: GuardedStagingClient,
  table: 'opportunities' | 'orcamentos',
  row: Record<string, unknown>
): Promise<IdRow> {
  const response = await client
    .from(table)
    .insert(row)
    .select('id')
    .single() as SupabaseLikeResponse<IdRow>;

  if (response.error) {
    throw new Error(`${table} anchor insert failed: ${response.error.message ?? 'unknown error'}`);
  }

  if (!response.data?.id) {
    throw new Error(`${table} anchor insert returned no id.`);
  }

  return response.data;
}
