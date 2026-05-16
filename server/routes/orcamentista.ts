import express, { Router, type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { runControlledManualOrcamentistaAction } from '../../platform/server/orcamentista/controlledManualAction';
import { getOrcamentistaPipelineView } from '../../platform/server/orcamentista/pipelineView';
import { createStagingClientFromEnv, createRawStagingClientFromEnv, createMainReadClientFromEnv, downloadOpportunityFile } from '../../platform/server/orcamentista/persistence/stagingClient';
import { createOrcamentistaPersistenceRepository } from '../../platform/server/orcamentista/persistence/repository';
import { persistContextSnapshot } from '../../platform/server/orcamentista/persistence/hitlPersistence';
import type { OrcamentistaPreview, OrcamentistaPreviewItem } from '../../platform/server/orcamentista/contracts';
import {
  extractTextEvidenceFromFile,
  type FileTextEvidence,
} from '../../platform/server/orcamentista/fileTextExtraction';
import { extractItemsWithAi } from '../../platform/server/orcamentista/aiItemExtractor';
import { embedEvidences } from '../../platform/server/orcamentista/persistence/embeddingPersistence';
import {
  persistAnalysisRun,
  type AnalysisRunFileReadInput,
  type AnalysisRunEvidenceInput,
} from '../../platform/server/orcamentista/persistence/analysisRunPersistence';
import {
  persistHitlDecision,
  validateHitlDecisionInput,
} from '../../platform/server/orcamentista/persistence/hitlDecisionPersistence';
import {
  persistCommitBatch,
  validateCommitBatchInput,
} from '../../platform/server/orcamentista/persistence/commitBatchPersistence';
import {
  createOrcamentistaWorkspace,
  listOrcamentistaWorkspaces,
  listWorkspaceAttachmentFiles,
  saveAttachmentToWorkspace,
  type OrcamentistaWorkspace,
  type WorkspaceAttachmentFile,
  type WorkspaceAttachmentCategory,
} from '../../platform/server/orcamentista/workspaces';

const router = Router();

type OrcamentistaStreamEvent = Record<string, unknown>;
type WorkspacePreviewStatus = 'available' | 'empty' | 'workspace_missing' | 'workspace_root_missing' | 'error';

type OrcamentistaWorkspaceState = {
  opportunityId: string | null;
  workspaceId: string;
  generated_at: string;
  workspace: {
    exists: boolean;
    nome: string | null;
    unavailable_reason?: string;
  };
  attachments: WorkspaceAttachmentFile[];
  preview: {
    status: WorkspacePreviewStatus;
    data: OrcamentistaPreview | null;
    warnings: string[];
  };
  safety: {
    canWriteConsolidationToBudget: false;
    touchedBudgetItemsTable: false;
    officialBudgetWrite: 'blocked';
  };
};

function sendStreamEvent(res: Response, event: OrcamentistaStreamEvent) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

function buildPreviewFromWorkspace(workspace: OrcamentistaWorkspace): {
  status: WorkspacePreviewStatus;
  data: OrcamentistaPreview | null;
  warnings: string[];
} {
  const memoryPath = path.join(workspace.fullPath, '01_MEMORIA_ORCAMENTO.json');

  if (!fs.existsSync(memoryPath)) {
    const preview: OrcamentistaPreview = {
      workspace_id: workspace.id,
      generated_at: new Date().toISOString(),
      source_file: '01_MEMORIA_ORCAMENTO.json',
      items: [],
      warnings: [
        'Nenhuma memória estruturada encontrada no workspace.',
        'Preview em modo laboratório; não grava orçamento oficial.',
      ],
    };

    return { status: 'empty', data: preview, warnings: preview.warnings };
  }

  try {
    const raw = JSON.parse(fs.readFileSync(memoryPath, 'utf-8'));
    const composicoes = Array.isArray(raw.composicoes_candidatas) ? raw.composicoes_candidatas : [];
    const warnings: string[] = [];

    const items: OrcamentistaPreviewItem[] = composicoes.map((item: any, index: number) => {
      const quantidade = Number(item.quantidade ?? 0);
      const valorUnitario = Number(item.valor_unitario ?? item.custo_unitario ?? 0);

      if (!Number.isFinite(quantidade) || quantidade <= 0) {
        warnings.push(`Item ${index + 1} sem quantidade numérica confiável.`);
      }

      if (!Number.isFinite(valorUnitario) || valorUnitario <= 0) {
        warnings.push(`Item ${index + 1} sem valor unitário confiável.`);
      }

      return {
        codigo: item.codigo ?? item.codigo_sinapi ?? null,
        descricao: item.descricao ?? item.servico ?? `Item candidato ${index + 1}`,
        unidade: item.unidade ?? 'un',
        quantidade: Number.isFinite(quantidade) ? quantidade : 0,
        valor_unitario: Number.isFinite(valorUnitario) ? valorUnitario : 0,
        valor_total: Number.isFinite(quantidade * valorUnitario) ? quantidade * valorUnitario : 0,
        categoria: item.categoria ?? null,
        origem: item.origem ?? 'ia_composicao_lab',
        confianca: typeof item.confianca === 'number' ? item.confianca : null,
        observacoes: item.observacoes ?? null,
      };
    });

    const preview: OrcamentistaPreview = {
      workspace_id: workspace.id,
      generated_at: new Date().toISOString(),
      source_file: '01_MEMORIA_ORCAMENTO.json',
      items,
      warnings,
    };

    return {
      status: items.length > 0 ? 'available' : 'empty',
      data: preview,
      warnings,
    };
  } catch (error: any) {
    return {
      status: 'error',
      data: null,
      warnings: [`Falha ao ler preview do workspace: ${error.message}`],
    };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/orcamentista/opportunities/:opportunityId/analyze
//
// MVP — Sprint 3. Análise inicial de arquivos reais para orçamento.
//
// Garantias:
// - Não escreve em orcamento_itens (bloqueada no stagingClient).
// - Não escreve orçamento oficial. Não escreve proposta.
// - Não chama provider IA. Retorna estado controlado quando IA não conectada.
// - Persiste somente em orc_context_snapshots (já existente na allowlist).
// - Sem mock. Sem item fabricado. Sem quantidade estimada.
// ──────────────────────────────────────────────────────────────────────────────
type AnalyzeRequestBody = {
  fileIds?: unknown;
  workspaceId?: unknown;
};

type AnalyzeFileRow = {
  id: string;
  opportunity_id: string;
  nome: string | null;
  categoria: string | null;
  mime_type: string | null;
  tamanho_bytes: number | null;
  storage_path: string | null;
  url: string | null;
};

router.post('/opportunities/:opportunityId/analyze', async (req: Request, res: Response) => {
  const opportunityId = req.params.opportunityId;
  const body = (req.body ?? {}) as AnalyzeRequestBody;

  if (!opportunityId || typeof opportunityId !== 'string') {
    return res.status(400).json({
      success: false,
      status: 'validation_error',
      erro: 'opportunityId é obrigatório.',
    });
  }

  const fileIds = Array.isArray(body.fileIds)
    ? body.fileIds.filter((value): value is string => typeof value === 'string' && value.length > 0)
    : [];
  const workspaceId =
    typeof body.workspaceId === 'string' && body.workspaceId.length > 0
      ? body.workspaceId
      : `opp_${opportunityId}`;

  if (fileIds.length === 0) {
    return res.status(400).json({
      success: false,
      status: 'validation_error',
      erro: 'Selecione ao menos um arquivo para análise.',
    });
  }

  try {
    const bundle = createStagingClientFromEnv();
    // opportunity_files lives in the MAIN Supabase — use the main read client for file validation.
    const mainClient = createMainReadClientFromEnv();

    const filesQuery = await (mainClient
      .from('opportunity_files')
      .select('id, opportunity_id, nome, categoria, mime_type, tamanho_bytes, storage_path, url')
      .eq('opportunity_id', opportunityId)
      .in('id', fileIds) as unknown as Promise<{
        data: AnalyzeFileRow[] | null;
        error: { message?: string } | null;
      }>);

    const filesError = filesQuery.error;
    if (filesError) {
      return res.status(500).json({
        success: false,
        status: 'persistence_error',
        erro: filesError.message ?? 'Falha ao ler opportunity_files.',
      });
    }

    const rawFiles = (filesQuery.data ?? []) as AnalyzeFileRow[];
    const foundIds = new Set(rawFiles.map((file) => file.id));
    const missingIds = fileIds.filter((id) => !foundIds.has(id));

    if (missingIds.length > 0) {
      return res.status(400).json({
        success: false,
        status: 'validation_error',
        erro: 'Um ou mais fileIds não pertencem à oportunidade informada.',
        missingFileIds: missingIds,
      });
    }

    // Sprint 4A/4B: download from Supabase Storage, then extract only safe text formats.
    const MAX_DOWNLOAD_BYTES = 10 * 1024 * 1024; // 10 MiB limit for this sprint
    const MAX_EXTRACTED_CHARS = 20_000;
    const MAX_EVIDENCES_PER_FILE = 3;
    const MAX_EVIDENCE_CHARS = 800;
    const sourceFiles = [] as any[];
    const evidences: FileTextEvidence[] = [];
    const warnings: string[] = [];

    for (const file of rawFiles) {
      const entry: any = {
        id: file.id,
        nome: file.nome,
        mime_type: file.mime_type,
        storage_path_present: !!file.storage_path,
      };

      if (!file.storage_path) {
        entry.download_status = 'missing_storage_path';
        entry.read_status = 'file_content_unavailable';
        sourceFiles.push(entry);
        continue;
      }

      // Try safe download
      const { buffer, size, error } = await downloadOpportunityFile({
        storagePath: file.storage_path,
        maxBytes: MAX_DOWNLOAD_BYTES,
      });

      if (error) {
        if (error.includes('exceeds limit')) {
          entry.download_status = 'skipped_too_large';
          entry.read_status = 'file_too_large';
        } else {
          entry.download_status = 'download_failed';
          entry.read_status = 'file_content_unavailable';
        }
      } else {
        entry.download_status = 'downloaded';
        entry.downloaded_bytes = size ?? 0;

        if (buffer) {
          const extraction = await extractTextEvidenceFromFile({
            fileId: file.id,
            fileName: file.nome,
            mimeType: file.mime_type,
            buffer,
            maxExtractedChars: MAX_EXTRACTED_CHARS,
            maxEvidences: MAX_EVIDENCES_PER_FILE,
            maxEvidenceChars: MAX_EVIDENCE_CHARS,
          });

          entry.read_status = extraction.read_status;
          entry.extracted_chars = extraction.extracted_chars;
          evidences.push(...extraction.evidences);

          if (extraction.warning) {
            warnings.push(`${file.nome ?? file.id}: ${extraction.warning}`);
          }
        } else {
          entry.read_status = 'file_content_unavailable';
        }
      }

      sourceFiles.push(entry);
    }

    // ── Etapa B: extração IA de itens preliminares (gated por flag) ──────────
    const aiResult = await extractItemsWithAi(evidences);
    const aiPreviewItems =
      aiResult.status === 'success' ? aiResult.items : [];
    const aiWarnings: string[] = [];
    if (aiResult.status === 'ai_error' || aiResult.status === 'parse_error') {
      aiWarnings.push(`IA: ${aiResult.message}`);
    }

    const hasExtractedText = evidences.length > 0;
    const hasPdfImages = sourceFiles.some(
      (sf) => sf.read_status === 'pdf_image_detected',
    );
    const hasAiItems = aiPreviewItems.length > 0;
    const previewSource = hasAiItems
      ? 'ai_extracted'
      : hasExtractedText
        ? 'file_text_extracted'
        : 'file_access_only';
    const responseStatus =
      hasAiItems || hasExtractedText ? 'review_required' : 'backend_ai_not_configured';
    const pendenciasHitl = hasAiItems
      ? [`${aiPreviewItems.length} item(ns) preliminar(es) gerado(s) pela IA. Revisar no painel HITL antes do commit oficial.`]
      : hasExtractedText
        ? ['Texto extraído. IA de análise desabilitada — quantitativos exigem validação humana.']
        : hasPdfImages
          ? ['PDF sem camada de texto detectado (scan/desenho técnico). Habilite EVIS_ORCAMENTISTA_ENABLE_AI_ANALYZE para leitura multimodal.']
          : ['Arquivo físico acessado pelo backend. Extração textual local indisponível para os arquivos selecionados.'];

    // ─────────────────────────────────────────────────────────────────────
    // ETAPA 2 — Persistência run-scoped defensiva (orc_analysis_runs &c).
    //
    // Regra central:
    //   Arquivo gera evidência → evidência justifica item →
    //   item precisa de decisão humana → só aprovado vira oficial.
    //
    // Se o schema da migration 003 não estiver aplicado, o helper retorna
    // 'schema_not_ready' e seguimos respondendo /analyze normalmente.
    // Nenhuma escrita em orcamento_itens acontece aqui.
    // ─────────────────────────────────────────────────────────────────────
    const fileReadsForPersist: AnalysisRunFileReadInput[] = sourceFiles.map((sf) => ({
      clientTag: sf.id,
      opportunityFileId: sf.id,
      fileName: sf.nome ?? null,
      mimeType: sf.mime_type ?? null,
      storagePath: rawFiles.find((rf) => rf.id === sf.id)?.storage_path ?? null,
      storagePathPresent: Boolean(sf.storage_path_present),
      downloadStatus: sf.download_status ?? 'missing_storage_path',
      readStatus: sf.read_status ?? null,
      downloadedBytes: typeof sf.downloaded_bytes === 'number' ? sf.downloaded_bytes : null,
      extractedChars: typeof sf.extracted_chars === 'number' ? sf.extracted_chars : null,
      warning: null,
    }));

    const evidencesForPersist: AnalysisRunEvidenceInput[] = evidences.map((ev) => ({
      fileReadTag: ev.fileId,
      opportunityFileId: ev.fileId,
      evidenceType: 'text_excerpt' as const,
      contentExcerpt: ev.content,
      page: null,
      confidence: null,
    }));

    const allWarnings = [...warnings, ...aiWarnings];
    const analysisRunPersistResult = await persistAnalysisRun(bundle.client, {
      opportunityId,
      workspaceId,
      status: responseStatus,
      previewSource,
      warnings: allWarnings,
      pendenciasHitl,
      safetyFlags: {
        officialBudgetWrite: 'blocked',
        canWriteConsolidationToBudget: false,
        touchedBudgetItemsTable: false,
      },
      fileReads: fileReadsForPersist,
      evidences: evidencesForPersist,
      previewItems: aiPreviewItems,
    });

    // ── Etapa C: embed evidences into pgvector (gated by EVIS_ORCAMENTISTA_ENABLE_RAG) ──
    if (
      analysisRunPersistResult.status === 'success' &&
      evidences.length > 0
    ) {
      // Fetch the inserted evidence IDs from the run to correlate with excerpts.
      const evQuery = await (bundle.client.from('orc_evidences') as any)
        .select('id, content_excerpt')
        .eq('analysis_run_id', analysisRunPersistResult.runId)
        .order('created_at', { ascending: true });

      if (!evQuery.error && Array.isArray(evQuery.data)) {
        const { client: rawClient } = createRawStagingClientFromEnv();
        await embedEvidences(rawClient, {
          evidences: (evQuery.data as Array<{ id: string; content_excerpt: string }>).map((r) => ({
            id: r.id,
            contentExcerpt: r.content_excerpt ?? '',
          })),
        });
        // Fire-and-forget: embed errors don't block the /analyze response.
      }
    }

    const repository = createOrcamentistaPersistenceRepository(bundle.client);
    const snapshotResult = await persistContextSnapshot(repository, {
      opportunity_id: opportunityId,
      source_type: 'orcamentista_analyze_v0',
      source_ref: workspaceId,
      phase: 'analyze_initial',
      context_status: 'blocked',
      context_snapshot_json: {
        marker: 'orcamentista_analyze_v0',
        workspace_id: workspaceId,
        analyzed_file_ids: fileIds,
        source_files: sourceFiles,
        preview_source: previewSource,
        items: [],
        evidences,
        pendencias_hitl: pendenciasHitl,
        warnings,
        backend_ai_configured: false,
      },
      created_by: 'orcamentista_analyze_endpoint',
    });

    // Snapshot is observability-only — a FK violation (cross-DB opportunity_id) must not block analysis.
    if (snapshotResult.status !== 'success') {
      warnings.push(`Snapshot não persistido: ${snapshotResult.message}`);
    }

    const analysisRunBlock =
      analysisRunPersistResult.status === 'success'
        ? {
            schema_status: 'ready' as const,
            run_id: analysisRunPersistResult.runId,
            counts: analysisRunPersistResult.counts,
          }
        : analysisRunPersistResult.status === 'schema_not_ready'
          ? {
              schema_status: 'schema_not_ready' as const,
              missing_table: analysisRunPersistResult.missingTable,
              message: analysisRunPersistResult.message,
            }
          : {
              schema_status: 'persistence_error' as const,
              stage: analysisRunPersistResult.stage,
              message: analysisRunPersistResult.message,
            };

    return res.status(200).json({
      success: true,
      status: responseStatus,
      data: {
        opportunity_id: opportunityId,
        workspace_id: workspaceId,
        generated_at: new Date().toISOString(),
        preview_source: previewSource,
        source_files: sourceFiles,
        evidences,
        items: [] as OrcamentistaPreviewItem[],
        warnings: allWarnings,
        pendencias_hitl: pendenciasHitl,
        ai_extraction: {
          status: aiResult.status,
          items_generated: aiPreviewItems.length,
          model: aiResult.status === 'success' ? aiResult.model : null,
        },
        safety: {
          officialBudgetWrite: 'blocked' as const,
          canWriteConsolidationToBudget: false as const,
          touchedBudgetItemsTable: false as const,
        },
        snapshot: {
          id: snapshotResult.status === 'success' ? snapshotResult.data.id : null,
          context_status: 'blocked' as const,
        },
        analysis_run: analysisRunBlock,
      },
    });
  } catch (error: any) {
    console.error('Error in orcamentista analyze endpoint:', error);
    return res.status(500).json({
      success: false,
      status: 'persistence_error',
      erro: error?.message ?? 'Internal server error',
    });
  }
});

// POST /api/orcamentista/manual-run
router.post('/manual-run', async (req, res) => {
  try {
    const { opportunityId, orcamentoId, opportunityFileId, mode, marker } = req.body;
    
    // Explicit server-side staging execution
    const bundle = createStagingClientFromEnv();
    
    const result = await runControlledManualOrcamentistaAction({
      opportunityId,
      orcamentoId,
      opportunityFileId,
      mode: mode || 'manual_test',
      marker: marker || 'UI_MANUAL_RUN',
      confirmStagingWrite: true,
    }, bundle);

    if (result.status !== 'success') {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Error running orcamentista manual action:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// GET /api/orcamentista/pipeline-view
router.get('/pipeline-view', async (req, res) => {
  try {
    const { opportunityId } = req.query;
    if (!opportunityId || typeof opportunityId !== 'string') {
      return res.status(400).json({ error: 'opportunityId is required' });
    }

    const bundle = createStagingClientFromEnv();
    const result = await getOrcamentistaPipelineView({ opportunityId }, bundle);

    if (result.status !== 'success') {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Error fetching pipeline view:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// GET /api/orcamentista/workspaces
router.get('/workspaces', async (_req, res) => {
  try {
    const workspaces = await listOrcamentistaWorkspaces();
    return res.json({ success: true, data: workspaces });
  } catch (error: any) {
    console.error('Error listing orcamentista workspaces:', error);
    return res.status(500).json({ success: false, erro: error.message });
  }
});

// POST /api/orcamentista/workspaces
router.post('/workspaces', async (req, res) => {
  try {
    const { nomeObra, cliente } = req.body ?? {};
    const workspace = await createOrcamentistaWorkspace({ nomeObra, cliente });
    return res.status(201).json({ success: true, data: workspace });
  } catch (error: any) {
    console.error('Error creating orcamentista workspace:', error);
    return res.status(500).json({ success: false, erro: error.message });
  }
});

// GET /api/orcamentista/workspaces/:id/attachments
router.get('/workspaces/:id/attachments', async (req, res) => {
  try {
    const attachments = await listWorkspaceAttachmentFiles(req.params.id);
    return res.json({ success: true, data: attachments });
  } catch (error: any) {
    console.error('Error listing orcamentista workspace attachments:', error);
    return res.status(500).json({ success: false, erro: error.message });
  }
});

// GET /api/orcamentista/workspaces/:id/state
router.get('/workspaces/:id/state', async (req, res) => {
  const workspaceId = req.params.id;
  const opportunityId = typeof req.query.opportunityId === 'string' ? req.query.opportunityId : null;

  const baseState: Omit<OrcamentistaWorkspaceState, 'workspace' | 'attachments' | 'preview'> = {
    opportunityId,
    workspaceId,
    generated_at: new Date().toISOString(),
    safety: {
      canWriteConsolidationToBudget: false,
      touchedBudgetItemsTable: false,
      officialBudgetWrite: 'blocked',
    },
  };

  try {
    const workspace = (await listOrcamentistaWorkspaces()).find((item) => item.id === workspaceId);

    if (!workspace) {
      const data: OrcamentistaWorkspaceState = {
        ...baseState,
        workspace: {
          exists: false,
          nome: null,
          unavailable_reason: 'workspace_not_found',
        },
        attachments: [],
        preview: {
          status: 'workspace_missing',
          data: null,
          warnings: ['Workspace local não encontrado para este ID.'],
        },
      };

      return res.json({ success: true, data });
    }

    const attachments = await listWorkspaceAttachmentFiles(workspaceId);
    const preview = buildPreviewFromWorkspace(workspace);
    const data: OrcamentistaWorkspaceState = {
      ...baseState,
      workspace: {
        exists: true,
        nome: workspace.nome,
      },
      attachments,
      preview,
    };

    return res.json({ success: true, data });
  } catch (error: any) {
    const data: OrcamentistaWorkspaceState = {
      ...baseState,
      workspace: {
        exists: false,
        nome: null,
        unavailable_reason: error.message,
      },
      attachments: [],
      preview: {
        status: 'workspace_root_missing',
        data: null,
        warnings: ['Não foi possível consultar a pasta local de workspaces.'],
      },
    };

    return res.json({ success: true, data });
  }
});

// POST /api/orcamentista/workspaces/:id/files
router.post('/workspaces/:id/files', express.raw({ type: '*/*', limit: '50mb' }), async (req: Request, res: Response) => {
  try {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ success: false, erro: 'Arquivo vazio ou corpo inválido.' });
    }

    const rawFileName = req.headers['x-file-name'];
    const fileName = decodeURIComponent(Array.isArray(rawFileName) ? rawFileName[0] : rawFileName || 'arquivo');
    const mimeTypeHeader = req.headers['x-file-type'];
    const mimeType = Array.isArray(mimeTypeHeader) ? mimeTypeHeader[0] : mimeTypeHeader || 'application/octet-stream';
    const categoryHeader = req.headers['x-file-category'];
    const requestedCategory = Array.isArray(categoryHeader) ? categoryHeader[0] : categoryHeader || 'projeto';
    const categoria: WorkspaceAttachmentCategory =
      requestedCategory === 'fornecedores' || requestedCategory === 'referencias'
        ? requestedCategory
        : 'projeto';

    const saved = await saveAttachmentToWorkspace(
      req.params.id,
      categoria,
      fileName,
      req.body
    );

    return res.status(201).json({
      success: true,
      data: {
        nome: path.basename(saved.relativePath),
        mimeType,
        relativePath: saved.relativePath,
        categoria,
      },
    });
  } catch (error: any) {
    console.error('Error saving orcamentista workspace file:', error);
    return res.status(500).json({ success: false, erro: error.message });
  }
});

// GET /api/orcamentista/workspaces/:id/preview
router.get('/workspaces/:id/preview', async (req, res) => {
  try {
    const workspace = (await listOrcamentistaWorkspaces()).find((item) => item.id === req.params.id);

    if (!workspace) {
      return res.status(404).json({ success: false, erro: 'Workspace não encontrado.' });
    }

    const preview = buildPreviewFromWorkspace(workspace);
    return res.json({ success: true, data: preview.data });
  } catch (error: any) {
    console.error('Error building orcamentista preview:', error);
    return res.status(500).json({ success: false, erro: error.message });
  }
});

// POST /api/orcamentista/chat/stream
router.post('/chat/stream', (req, res) => {
  const { mensagem, sessionId, workspaceId } = req.body ?? {};

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ erro: 'sessionId é obrigatório.' });
  }

  if (!mensagem || typeof mensagem !== 'string') {
    return res.status(400).json({ erro: 'mensagem é obrigatória.' });
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  (res as Response & { flushHeaders?: () => void }).flushHeaders?.();

  sendStreamEvent(res, {
    type: 'multiagente_warning',
    message: 'Chat standalone em modo laboratório na Sprint 1. Use o Orçamentista dentro da oportunidade para o fluxo produtivo.',
  });

  sendStreamEvent(res, {
    type: 'token',
    text: [
      'Orçamentista IA em modo laboratório nesta rota.',
      '',
      'O fluxo produtivo canônico vive dentro da oportunidade. Nesta sprint, este endpoint existe para não quebrar a interface, mas não executa processamento real de arquivos, não aciona agentes especialistas e não grava orçamento oficial.',
      workspaceId ? `Workspace informado: ${workspaceId}.` : 'Nenhum workspace informado.',
      '',
      'Use a aba Orçamentista da oportunidade para acompanhar o smoke interno e os estados reais disponíveis.',
    ].join('\n'),
  });

  sendStreamEvent(res, {
    type: 'done',
    multiagente: {
      ativo: false,
      scoreConsistencia: 0,
      planner: null,
    },
    workspace: workspaceId ? { id: workspaceId } : null,
  });

  res.end();
});

// ─────────────────────────────────────────────────────────────────────────────
// ETAPA 3 — HITL real sobre preview_items
//
// Regra central:
//   Arquivo gera evidência → evidência justifica item →
//   item precisa de decisão humana → só aprovado vira oficial.
//
// NESTAS ROTAS o item aprovado NÃO vira orcamento_itens.
// O commit oficial é responsabilidade da Etapa 4 (endpoint separado, com flag).
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/orcamentista/analysis-runs/:runId/preview-items
// Lista os preview_items de um run para a UI HITL. Defensivo:
// se schema 003 não existir, retorna lista vazia + schema_status='schema_not_ready'.
router.get('/analysis-runs/:runId/preview-items', async (req: Request, res: Response) => {
  const runId = req.params.runId;
  if (!runId || typeof runId !== 'string') {
    return res.status(400).json({ success: false, erro: 'runId é obrigatório.' });
  }

  try {
    const bundle = createStagingClientFromEnv();
    const query = await (bundle.client.from('orc_preview_items') as any)
      .select(
        'id, analysis_run_id, opportunity_id, codigo, description, unit, quantity, unit_price, total_price, categoria, origem, confidence, status, source_evidence_ids, observacoes, created_at, updated_at',
      )
      .eq('analysis_run_id', runId)
      .order('created_at', { ascending: true });

    if (query.error) {
      const code = query.error.code;
      const msg = `${query.error.message ?? ''} ${query.error.details ?? ''}`.toLowerCase();
      const schemaMissing =
        code === '42P01' ||
        code === 'PGRST205' ||
        msg.includes('could not find the table') ||
        (msg.includes('relation') && msg.includes('does not exist'));

      if (schemaMissing) {
        return res.json({
          success: true,
          schema_status: 'schema_not_ready',
          missing_table: 'orc_preview_items',
          data: [],
        });
      }

      return res.status(500).json({
        success: false,
        erro: query.error.message ?? 'Falha ao listar preview_items.',
      });
    }

    return res.json({
      success: true,
      schema_status: 'ready',
      data: query.data ?? [],
    });
  } catch (error: any) {
    console.error('Error listing preview items:', error);
    return res.status(500).json({ success: false, erro: error?.message ?? 'Internal error' });
  }
});

// POST /api/orcamentista/preview-items/:id/decision
// Persiste decisão humana sobre preview_item.
// Body: { decision: approve|edit|reject|request_review, edited_payload?, reason?, decided_by? }
router.post('/preview-items/:id/decision', async (req: Request, res: Response) => {
  const previewItemId = req.params.id;
  const body = (req.body ?? {}) as Record<string, unknown>;

  const validation = validateHitlDecisionInput({
    previewItemId,
    decision: body.decision as any,
    editedPayload:
      body.editedPayload != null
        ? (body.editedPayload as Record<string, unknown>)
        : (body.edited_payload as Record<string, unknown> | undefined) ?? null,
    reason: body.reason as string | null | undefined,
    decidedBy: (body.decidedBy ?? body.decided_by) as string | undefined,
  });

  if (!validation.ok) {
    return res.status(400).json({
      success: false,
      status: 'validation_error',
      erro: validation.message,
      field: validation.field,
    });
  }

  try {
    const bundle = createStagingClientFromEnv();
    const result = await persistHitlDecision(bundle.client, validation.data);

    if (result.status === 'schema_not_ready') {
      return res.status(200).json({
        success: true,
        status: 'schema_not_ready',
        missing_table: result.missingTable,
        message: result.message,
      });
    }

    if (result.status === 'not_found') {
      return res.status(404).json({ success: false, status: 'not_found', erro: result.message });
    }

    if (result.status === 'validation_error') {
      return res.status(400).json({ success: false, status: 'validation_error', erro: result.message });
    }

    if (result.status === 'persistence_error') {
      return res.status(500).json({
        success: false,
        status: 'persistence_error',
        stage: result.stage,
        erro: result.message,
      });
    }

    return res.json({
      success: true,
      status: 'success',
      data: {
        decision_id: result.decisionId,
        preview_item_id: validation.data.previewItemId,
        preview_item_status_after: result.previewItemStatusAfter,
        safety: {
          officialBudgetWrite: 'blocked' as const,
          canWriteConsolidationToBudget: false as const,
          touchedBudgetItemsTable: false as const,
        },
      },
    });
  } catch (error: any) {
    console.error('Error persisting HITL decision:', error);
    return res.status(500).json({ success: false, erro: error?.message ?? 'Internal error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ETAPA 4 — Commit oficial controlado
//
// Regra central:
//   Só itens com status 'approved' ou 'edited' são promovidos.
//   Itens sem source_evidence_ids ou sem description são pulados.
//   Cada batch é registrado em orc_commit_batches (append-only).
//   Flag EVIS_ORCAMENTISTA_ENABLE_OFFICIAL_COMMIT=true é obrigatória.
//
// É a ÚNICA rota controlada de escrita em orcamento_itens por IA.
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/orcamentista/analysis-runs/:runId/commit-approved-items
// Body: { orcamento_id: string, opportunity_id: string, committed_by?: string }
router.post('/analysis-runs/:runId/commit-approved-items', async (req: Request, res: Response) => {
  const flagEnabled = process.env['EVIS_ORCAMENTISTA_ENABLE_OFFICIAL_COMMIT'] === 'true';
  if (!flagEnabled) {
    return res.status(200).json({
      success: true,
      status: 'official_commit_disabled',
      message:
        'Commit oficial não habilitado neste ambiente. Defina EVIS_ORCAMENTISTA_ENABLE_OFFICIAL_COMMIT=true para habilitar.',
    });
  }

  const runId = req.params.runId;
  const body = (req.body ?? {}) as Record<string, unknown>;

  const validation = validateCommitBatchInput({
    runId,
    orcamentoId: body.orcamento_id as string | undefined,
    opportunityId: body.opportunity_id as string | undefined,
    committedBy: body.committed_by as string | undefined,
  });

  if (!validation.ok) {
    return res.status(400).json({
      success: false,
      status: 'validation_error',
      erro: validation.message,
      field: validation.field,
    });
  }

  try {
    const bundle = createStagingClientFromEnv();
    const { client: rawClient } = createRawStagingClientFromEnv();

    const result = await persistCommitBatch(bundle.client, rawClient, validation.data);

    if (result.status === 'flag_disabled') {
      return res.status(200).json({ success: true, status: 'official_commit_disabled', message: result.message });
    }

    if (result.status === 'no_approved_items') {
      return res.status(200).json({ success: true, status: 'no_approved_items', message: result.message });
    }

    if (result.status === 'schema_not_ready') {
      return res.status(200).json({
        success: true,
        status: 'schema_not_ready',
        missing_table: result.missingTable,
        message: result.message,
      });
    }

    if (result.status === 'validation_error') {
      return res.status(400).json({ success: false, status: 'validation_error', erro: result.message });
    }

    if (result.status === 'persistence_error') {
      return res.status(500).json({
        success: false,
        status: 'persistence_error',
        stage: result.stage,
        erro: result.message,
      });
    }

    return res.json({
      success: true,
      status: 'success',
      data: {
        batch_id: result.batchId,
        total_committed: result.totalCommitted,
        total_skipped: result.totalSkipped,
        committed_item_ids: result.committedItemIds,
        skip_reasons: result.skipReasons,
        safety: {
          officialBudgetWrite: 'executed_via_etapa4',
          flag: 'EVIS_ORCAMENTISTA_ENABLE_OFFICIAL_COMMIT',
        },
      },
    });
  } catch (error: any) {
    console.error('Error in commit-approved-items endpoint:', error);
    return res.status(500).json({ success: false, erro: error?.message ?? 'Internal error' });
  }
});

// GET /api/orcamentista/analysis-runs/:runId/commit-batches
// Lista os batches de commit oficiais de um run. Defensivo: schema_not_ready
// se migration 005 não estiver aplicada.
router.get('/analysis-runs/:runId/commit-batches', async (req: Request, res: Response) => {
  const runId = req.params.runId;
  if (!runId || typeof runId !== 'string') {
    return res.status(400).json({ success: false, erro: 'runId é obrigatório.' });
  }

  try {
    const bundle = createStagingClientFromEnv();
    const query = await (bundle.client.from('orc_commit_batches') as any)
      .select(
        'id, analysis_run_id, opportunity_id, orcamento_id, total_items_committed, total_items_skipped, committed_item_ids, skip_reasons_json, safety_flags_json, committed_by, created_at',
      )
      .eq('analysis_run_id', runId)
      .order('created_at', { ascending: false });

    if (query.error) {
      const code = query.error.code;
      const msg = `${query.error.message ?? ''} ${query.error.details ?? ''}`.toLowerCase();
      const schemaMissing =
        code === '42P01' ||
        code === 'PGRST205' ||
        msg.includes('could not find the table') ||
        (msg.includes('relation') && msg.includes('does not exist'));

      if (schemaMissing) {
        return res.json({
          success: true,
          schema_status: 'schema_not_ready',
          missing_table: 'orc_commit_batches',
          data: [],
        });
      }

      return res.status(500).json({
        success: false,
        erro: query.error.message ?? 'Falha ao listar commit_batches.',
      });
    }

    return res.json({ success: true, schema_status: 'ready', data: query.data ?? [] });
  } catch (error: any) {
    return res.status(500).json({ success: false, erro: error?.message ?? 'Internal error' });
  }
});

// POST /api/orcamentista/workspaces/:workspaceId/generate-official-budget
router.post('/workspaces/:workspaceId/generate-official-budget', (_req, res) => {
  return res.status(410).json({
    success: false,
    erro: 'Geração oficial via rota legada está em quarentena. Escrita de IA em orcamento_itens permanece bloqueada nesta sprint.',
    code: 'legacy_official_budget_generation_quarantined',
  });
});

export default router;
