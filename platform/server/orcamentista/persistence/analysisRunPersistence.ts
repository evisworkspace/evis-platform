/**
 * ANALYSIS RUN PERSISTENCE — ORCAMENTISTA IA (Etapa 2)
 *
 * Persiste os artefatos run-scoped do endpoint POST /analyze nas tabelas:
 *   - orc_analysis_runs
 *   - orc_file_reads
 *   - orc_evidences
 *   - orc_preview_items
 *
 * Decisão arquitetural:
 *   - Camada run-scoped. Não invade Reader/Verifier page-scoped do candidate antigo.
 *   - Não escreve em orcamento_itens (bloqueada pela allowlist/guards).
 *   - Defensiva: se o schema não existir, retorna 'schema_not_ready'
 *     e o /analyze responde sem quebrar a UI.
 */

/**
 * Minimal client shape this helper needs.
 * Compatible with @supabase/supabase-js SupabaseClient and the project's
 * GuardedStagingClient wrapper. Keeps the dependency surface narrow.
 */
export interface AnalysisRunPersistenceClient {
  from(table: string): any;
}

// ============================================================================
// Tipos públicos
// ============================================================================

export type AnalysisRunPersistInput = {
  opportunityId: string;
  orcamentoId?: string | null;
  workspaceId: string;
  status:
    | 'started'
    | 'file_access_only'
    | 'file_text_extracted'
    | 'ai_extracted'
    | 'review_required'
    | 'backend_ai_not_configured'
    | 'completed'
    | 'failed';
  source?: string;
  previewSource?:
    | 'metadata_only'
    | 'file_access_only'
    | 'file_text_extracted'
    | 'ai_extracted'
    | null;
  modelProvider?: string | null;
  modelName?: string | null;
  warnings: string[];
  pendenciasHitl: string[];
  safetyFlags: Record<string, unknown>;
  createdBy?: string;
  fileReads: AnalysisRunFileReadInput[];
  evidences: AnalysisRunEvidenceInput[];
  previewItems: AnalysisRunPreviewItemInput[];
};

export type AnalysisRunFileReadInput = {
  /** Correlation tag used to link to evidences before IDs exist. */
  clientTag: string;
  opportunityFileId: string;
  fileName: string | null;
  mimeType: string | null;
  storagePath: string | null;
  storagePathPresent: boolean;
  downloadStatus:
    | 'missing_storage_path'
    | 'skipped_too_large'
    | 'download_failed'
    | 'downloaded';
  readStatus?:
    | 'file_content_unavailable'
    | 'file_too_large'
    | 'text_extracted'
    | 'text_empty'
    | 'pdf_text_extracted'
    | 'pdf_image_detected'
    | 'pdf_parser_unavailable'
    | 'unsupported_file_type'
    | null;
  downloadedBytes?: number | null;
  extractedChars?: number | null;
  warning?: string | null;
};

export type AnalysisRunEvidenceInput = {
  /** Correlation tag linking back to fileReads[].clientTag. */
  fileReadTag?: string | null;
  opportunityFileId?: string | null;
  evidenceType: 'text_excerpt' | 'metadata_only' | 'inference' | 'ai_extracted';
  contentExcerpt: string;
  page?: number | null;
  confidence?: number | null;
};

export type AnalysisRunPreviewItemInput = {
  codigo?: string | null;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  categoria?: string | null;
  origem?: string | null;
  confidence?: number | null;
  observacoes?: string | null;
  rawAiPayload?: Record<string, unknown>;
  /**
   * Correlation tags into evidences (index-based: 0..n).
   * Resolved to UUIDs after the evidences batch is inserted.
   */
  sourceEvidenceTags?: number[];
};

export type AnalysisRunPersistResult =
  | {
      status: 'success';
      runId: string;
      counts: {
        fileReads: number;
        evidences: number;
        previewItems: number;
      };
    }
  | {
      status: 'schema_not_ready';
      missingTable: string;
      message: string;
    }
  | {
      status: 'persistence_error';
      stage: 'analysis_run' | 'file_reads' | 'evidences' | 'preview_items';
      message: string;
    };

// ============================================================================
// Detecção de schema ausente
// ============================================================================

/**
 * Códigos/mensagens que indicam tabela ausente no PostgREST/Supabase.
 *  - 42P01 = undefined_table (PostgreSQL)
 *  - PGRST205 = PostgREST não encontrou o schema cache da tabela
 *  - Mensagens contendo "Could not find the table" ou "relation ... does not exist"
 */
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

// ============================================================================
// Função principal
// ============================================================================

/**
 * Persiste um analysis run com defensividade.
 * Se qualquer tabela esperada não existir no banco, retorna 'schema_not_ready'
 * e o caller pode continuar respondendo o /analyze normalmente.
 */
export async function persistAnalysisRun(
  client: AnalysisRunPersistenceClient,
  input: AnalysisRunPersistInput
): Promise<AnalysisRunPersistResult> {
  // ---------------------------------------------------------------
  // 1. Inserir analysis_run
  // ---------------------------------------------------------------
  const runRow = {
    opportunity_id: input.opportunityId,
    orcamento_id: input.orcamentoId ?? null,
    workspace_id: input.workspaceId,
    status: input.status,
    source: input.source ?? 'orcamentista_analyze_endpoint',
    preview_source: input.previewSource ?? null,
    model_provider: input.modelProvider ?? null,
    model_name: input.modelName ?? null,
    total_files: input.fileReads.length,
    total_evidences: input.evidences.length,
    total_preview_items: input.previewItems.length,
    warnings_json: input.warnings,
    pendencias_hitl_json: input.pendenciasHitl,
    safety_flags_json: input.safetyFlags,
    created_by: input.createdBy ?? 'orcamentista_analyze_endpoint',
    completed_at: new Date().toISOString(),
  };

  const runInsert = await (client.from('orc_analysis_runs') as any)
    .insert(runRow)
    .select('id')
    .single();

  if (runInsert.error) {
    if (isSchemaNotReadyError(runInsert.error)) {
      return {
        status: 'schema_not_ready',
        missingTable: 'orc_analysis_runs',
        message:
          'Schema run-scoped (orc_analysis_runs) ainda não aplicado. /analyze segue funcionando sem persistência adicional.',
      };
    }
    return {
      status: 'persistence_error',
      stage: 'analysis_run',
      message: runInsert.error.message ?? 'Falha ao inserir orc_analysis_runs.',
    };
  }

  const runId: string = runInsert.data?.id;
  if (!runId) {
    return {
      status: 'persistence_error',
      stage: 'analysis_run',
      message: 'orc_analysis_runs inserido sem id retornado.',
    };
  }

  // ---------------------------------------------------------------
  // 2. Inserir file_reads em lote, preservando correlação por clientTag
  // ---------------------------------------------------------------
  const fileReadTagToId = new Map<string, string>();

  if (input.fileReads.length > 0) {
    const fileReadRows = input.fileReads.map((fr) => ({
      analysis_run_id: runId,
      opportunity_id: input.opportunityId,
      opportunity_file_id: fr.opportunityFileId,
      file_name: fr.fileName,
      mime_type: fr.mimeType,
      storage_path: fr.storagePath,
      storage_path_present: fr.storagePathPresent,
      download_status: fr.downloadStatus,
      read_status: fr.readStatus ?? null,
      downloaded_bytes: fr.downloadedBytes ?? null,
      extracted_chars: fr.extractedChars ?? null,
      warning: fr.warning ?? null,
      source_refs_json: { client_tag: fr.clientTag },
    }));

    const frInsert = await (client.from('orc_file_reads') as any)
      .insert(fileReadRows)
      .select('id, source_refs_json');

    if (frInsert.error) {
      if (isSchemaNotReadyError(frInsert.error)) {
        return {
          status: 'schema_not_ready',
          missingTable: 'orc_file_reads',
          message:
            'Schema parcial: orc_analysis_runs existe, orc_file_reads não. Aplicar migration 003 completa.',
        };
      }
      return {
        status: 'persistence_error',
        stage: 'file_reads',
        message: frInsert.error.message ?? 'Falha ao inserir orc_file_reads.',
      };
    }

    const returnedRows: Array<{
      id: string;
      source_refs_json: { client_tag?: string };
    }> = (frInsert.data as any) ?? [];
    for (const row of returnedRows) {
      const tag = row.source_refs_json?.client_tag;
      if (tag) fileReadTagToId.set(tag, row.id);
    }
  }

  // ---------------------------------------------------------------
  // 3. Inserir evidences (resolvendo fileReadTag → file_read_id)
  // ---------------------------------------------------------------
  const evidenceIdsByIndex: string[] = [];

  if (input.evidences.length > 0) {
    const evidenceRows = input.evidences.map((ev) => ({
      analysis_run_id: runId,
      file_read_id: ev.fileReadTag ? fileReadTagToId.get(ev.fileReadTag) ?? null : null,
      opportunity_id: input.opportunityId,
      opportunity_file_id: ev.opportunityFileId ?? null,
      evidence_type: ev.evidenceType,
      content_excerpt: ev.contentExcerpt,
      page: ev.page ?? null,
      confidence: ev.confidence ?? null,
    }));

    const evInsert = await (client.from('orc_evidences') as any)
      .insert(evidenceRows)
      .select('id');

    if (evInsert.error) {
      if (isSchemaNotReadyError(evInsert.error)) {
        return {
          status: 'schema_not_ready',
          missingTable: 'orc_evidences',
          message:
            'Schema parcial: orc_evidences ainda não aplicado. Aplicar migration 003 completa.',
        };
      }
      return {
        status: 'persistence_error',
        stage: 'evidences',
        message: evInsert.error.message ?? 'Falha ao inserir orc_evidences.',
      };
    }

    const rows: Array<{ id: string }> = (evInsert.data as any) ?? [];
    for (const row of rows) evidenceIdsByIndex.push(row.id);
  }

  // ---------------------------------------------------------------
  // 4. Inserir preview_items (resolvendo sourceEvidenceTags → uuids)
  // ---------------------------------------------------------------
  if (input.previewItems.length > 0) {
    const previewRows = input.previewItems.map((pi) => {
      const evidenceIds = (pi.sourceEvidenceTags ?? [])
        .map((idx) => evidenceIdsByIndex[idx])
        .filter((id): id is string => Boolean(id));

      return {
        analysis_run_id: runId,
        opportunity_id: input.opportunityId,
        orcamento_id: input.orcamentoId ?? null,
        codigo: pi.codigo ?? null,
        description: pi.description,
        unit: pi.unit,
        quantity: pi.quantity,
        unit_price: pi.unitPrice,
        total_price: pi.totalPrice,
        categoria: pi.categoria ?? null,
        origem: pi.origem ?? null,
        confidence: pi.confidence ?? null,
        status: 'pending' as const,
        source_evidence_ids: evidenceIds,
        raw_ai_payload_json: pi.rawAiPayload ?? {},
        observacoes: pi.observacoes ?? null,
      };
    });

    const piInsert = await (client.from('orc_preview_items') as any)
      .insert(previewRows)
      .select('id');

    if (piInsert.error) {
      if (isSchemaNotReadyError(piInsert.error)) {
        return {
          status: 'schema_not_ready',
          missingTable: 'orc_preview_items',
          message:
            'Schema parcial: orc_preview_items ainda não aplicado. Aplicar migration 003 completa.',
        };
      }
      return {
        status: 'persistence_error',
        stage: 'preview_items',
        message: piInsert.error.message ?? 'Falha ao inserir orc_preview_items.',
      };
    }
  }

  return {
    status: 'success',
    runId,
    counts: {
      fileReads: input.fileReads.length,
      evidences: input.evidences.length,
      previewItems: input.previewItems.length,
    },
  };
}
