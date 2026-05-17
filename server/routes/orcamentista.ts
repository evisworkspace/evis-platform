import express, { Router, type Request, type Response } from 'express';
import fs from 'fs';
import { analyzeWithGemini } from '../services/geminiOrcamentista';
import path from 'path';
import { runControlledManualOrcamentistaAction } from '../../platform/server/orcamentista/controlledManualAction';
import { getOrcamentistaPipelineView } from '../../platform/server/orcamentista/pipelineView';
import { createStagingClientFromEnv, createMainReadClientFromEnv, downloadOpportunityFile, readAndValidateStagingEnv } from '../../platform/server/orcamentista/persistence/stagingClient';
import { createOrcamentistaPersistenceRepository } from '../../platform/server/orcamentista/persistence/repository';
import { persistContextSnapshot } from '../../platform/server/orcamentista/persistence/hitlPersistence';
import type { OrcamentistaPreview, OrcamentistaPreviewItem } from '../../platform/server/orcamentista/contracts';
import {
  extractTextEvidenceFromFile,
  type FileTextEvidence,
} from '../../platform/server/orcamentista/fileTextExtraction';
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
// MVP — Sprint 7. Análise real de arquivos com Gemini.
//
// Garantias:
// - Não escreve em orcamento_itens (persistência é feita pelo frontend via HITL).
// - Não escreve orçamento oficial. Não escreve proposta.
// - Chama Gemini quando EVIS_ORCAMENTISTA_ENABLE_AI_ANALYZE=true.
// - Persiste somente em orc_context_snapshots (já existente na allowlist).
// - Itens retornados são PREVIEW — nenhum é persistido sem aprovação humana.
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
          const extraction = extractTextEvidenceFromFile({
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

    const isAiEnabled = process.env.EVIS_ORCAMENTISTA_ENABLE_AI_ANALYZE === 'true';
    const hasExtractedText = evidences.length > 0;

    // Build extracted text from evidences for Gemini prompt
    const extractedTextForAi = evidences
      .map((ev) => `[${ev.fileName ?? 'arquivo'}]\n${ev.content}`)
      .join('\n\n---\n\n');

    // Fetch opportunity title for prompt context
    let opportunityTitle = `Oportunidade ${opportunityId}`;
    try {
      const oppQuery = await (bundle.client.from('opportunities') as any)
        .select('titulo')
        .eq('id', opportunityId)
        .single();
      if (oppQuery.data?.titulo) {
        opportunityTitle = oppQuery.data.titulo;
      }
    } catch { /* fallback title is fine */ }

    const fileNames = rawFiles.map((f) => f.nome ?? f.id);

    // Call Gemini or fallback
    let items: OrcamentistaPreviewItem[] = [];
    let geminiWarnings: string[] = [];
    let geminiResumo: string | null = null;
    let previewSource: string;
    let responseStatus: string;

    if (isAiEnabled && hasExtractedText) {
      const geminiResult = await analyzeWithGemini(extractedTextForAi, opportunityTitle, fileNames);
      geminiWarnings = geminiResult.warnings;
      geminiResumo = geminiResult.resumo;

      if (geminiResult.ok && geminiResult.items.length > 0) {
        items = geminiResult.items.map((gi) => ({
          codigo: null,
          descricao: gi.descricao,
          unidade: gi.unidade,
          quantidade: gi.quantidade,
          valor_unitario: gi.valor_unitario,
          valor_total: gi.quantidade * gi.valor_unitario,
          categoria: gi.categoria,
          origem: 'ia_gemini',
          confianca: gi.confianca,
          observacoes: gi.observacoes,
          evidencia: gi.evidencia,
        }));
        previewSource = 'ai_extracted';
        responseStatus = 'ai_items_generated';
      } else {
        previewSource = 'file_text_extracted';
        responseStatus = 'review_required';
      }
    } else if (hasExtractedText) {
      previewSource = 'file_text_extracted';
      responseStatus = 'review_required';
    } else {
      previewSource = 'file_access_only';
      responseStatus = 'ai_lab_disabled';
    }

    const pendenciasHitl = items.length > 0
      ? ['Itens gerados por IA. Revisão humana obrigatória antes da consolidação.']
      : isAiEnabled && hasExtractedText
        ? ['IA ativada mas nenhum item identificado. Verifique os arquivos ou adicione itens manualmente.']
        : hasExtractedText
          ? ['Texto extraído localmente. IA desativada (EVIS_ORCAMENTISTA_ENABLE_AI_ANALYZE=false).']
          : ['Arquivo físico acessado. Extração textual local indisponível para os arquivos selecionados.'];

    warnings.push(...geminiWarnings);

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
        items,
        evidences,
        pendencias_hitl: pendenciasHitl,
        warnings,
        backend_ai_configured: isAiEnabled,
      },
      created_by: 'orcamentista_analyze_endpoint',
    });

    // Snapshot is observability-only — a FK violation (cross-DB opportunity_id) must not block analysis.
    if (snapshotResult.status !== 'success') {
      warnings.push(`Snapshot não persistido: ${snapshotResult.message}`);
    }

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
        items,
        warnings,
        pendencias_hitl: pendenciasHitl,
        safety: {
          officialBudgetWrite: 'blocked' as const,
          canWriteConsolidationToBudget: false as const,
          touchedBudgetItemsTable: false as const,
        },
        snapshot: {
          id: snapshotResult.status === 'success' ? snapshotResult.data.id : null,
          context_status: 'blocked' as const,
        },
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

/**
 * POST /api/orcamentista/opportunities/:opportunityId/files
 *
 * Upload LAB de arquivos para oportunidade real.
 * Restrições:
 * - Limite 10 MiB
 * - Tipos: .txt, .csv, .json, .md (bloqueia .pdf por enquanto)
 * - Bucket: opportunity-files (privado)
 * - Sem URL pública.
 */
router.post('/opportunities/:opportunityId/files', express.raw({ type: '*/*', limit: '10mb' }), async (req: Request, res: Response) => {
  const opportunityId = req.params.opportunityId;
  const fileName = decodeURIComponent((req.headers['x-file-name'] as string) || 'arquivo_lab');
  const mimeType = (req.headers['x-file-type'] as string) || 'application/octet-stream';

  if (!opportunityId) {
    return res.status(400).json({ success: false, erro: 'opportunityId é obrigatório.' });
  }

  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    return res.status(400).json({ success: false, erro: 'Arquivo vazio ou corpo inválido.' });
  }

  // Validação de tipo de arquivo (extensão)
  const ext = path.extname(fileName).toLowerCase();
  const allowedExts = ['.txt', '.csv', '.json', '.md'];
  if (!allowedExts.includes(ext)) {
    return res.status(400).json({
      success: false,
      erro: `Tipo de arquivo não permitido no LAB: ${ext}. Use .txt, .csv, .json ou .md.`
    });
  }

  try {
    const bundle = createStagingClientFromEnv();
    const env = readAndValidateStagingEnv(); // redundant check but safe

    // Upload para Supabase Storage
    const bucket = 'opportunity-files';
    const timestamp = Date.now();
    const storagePath = `${opportunityId}/${timestamp}_${fileName}`;

    // Note: readAndValidateStagingEnv returns StagingEnv with url/key
    const { createClient } = await import('@supabase/supabase-js');
    const { error: storageError } = await createClient(env.url, env.key).storage
      .from(bucket)
      .upload(storagePath, req.body, {
        contentType: mimeType,
        upsert: false
      });

    if (storageError) {
      throw new Error(`Erro no storage: ${storageError.message}`);
    }

    // Create in MAIN Supabase
    const mainClient = createMainReadClientFromEnv();
    const { data: fileRecord, error: dbError } = await mainClient
      .from('opportunity_files')
      .insert({
        opportunity_id: opportunityId,
        nome: fileName,
        mime_type: mimeType,
        tamanho_bytes: req.body.length,
        storage_path: storagePath,
        categoria: 'lab_upload'
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Erro ao registrar arquivo no banco: ${dbError.message}`);
    }

    return res.status(201).json({
      success: true,
      data: fileRecord
    });

  } catch (error: any) {
    console.error('Error in LAB upload:', error);
    return res.status(500).json({ success: false, erro: error.message });
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
  const { opportunityId } = req.query;
  if (!opportunityId || typeof opportunityId !== 'string') {
    return res.status(400).json({ status: 'validation_error', message: 'opportunityId is required' });
  }

  let bundle: ReturnType<typeof createStagingClientFromEnv>;
  try {
    bundle = createStagingClientFromEnv();
  } catch {
    // Staging client not configured — return a non-error "not_configured" response so the
    // frontend does not show a scary error message in the product UI.
    return res.json({
      status: 'not_configured',
      message: 'Pipeline view indisponível: ambiente de staging não configurado.',
      data: null,
    });
  }

  try {
    const result = await getOrcamentistaPipelineView({ opportunityId }, bundle);
    if (result.status !== 'success') {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (error: any) {
    console.error('Error fetching pipeline view:', error);
    return res.status(500).json({ status: 'error', message: error.message ?? 'Internal server error' });
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

// POST /api/orcamentista/workspaces/:workspaceId/generate-official-budget
router.post('/workspaces/:workspaceId/generate-official-budget', (_req, res) => {
  return res.status(410).json({
    success: false,
    erro: 'Geração oficial via rota legada está em quarentena. Escrita de IA em orcamento_itens permanece bloqueada nesta sprint.',
    code: 'legacy_official_budget_generation_quarantined',
  });
});

export default router;
