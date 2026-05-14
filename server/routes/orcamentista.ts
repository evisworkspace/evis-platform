import express, { Router, type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { runControlledManualOrcamentistaAction } from '../../platform/server/orcamentista/controlledManualAction';
import { getOrcamentistaPipelineView } from '../../platform/server/orcamentista/pipelineView';
import { createStagingClientFromEnv, downloadOpportunityFile } from '../../platform/server/orcamentista/persistence/stagingClient';
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

    const filesBuilder = bundle.client.from('opportunity_files') as unknown as {
      select: (columns: string) => {
        eq: (column: string, value: unknown) => {
          in: (column: string, values: string[]) => Promise<{
            data: AnalyzeFileRow[] | null;
            error: { message?: string } | null;
          }>;
        };
      };
    };

    const filesQuery = await filesBuilder
      .select('id, opportunity_id, nome, categoria, mime_type, tamanho_bytes, storage_path, url')
      .eq('opportunity_id', opportunityId)
      .in('id', fileIds);

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

    const hasExtractedText = evidences.length > 0;
    const previewSource = hasExtractedText ? 'file_text_extracted' : 'file_access_only';
    const responseStatus = hasExtractedText ? 'review_required' : 'backend_ai_not_configured';
    const pendenciasHitl = hasExtractedText
      ? ['Texto extraído. Quantitativos ainda exigem validação humana.']
      : ['Arquivo físico acessado pelo backend. Extração textual local indisponível para os arquivos selecionados.'];

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

    if (snapshotResult.status !== 'success') {
      return res.status(500).json({
        success: false,
        status: snapshotResult.status,
        erro: snapshotResult.message,
      });
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
        items: [] as OrcamentistaPreviewItem[],
        warnings,
        pendencias_hitl: pendenciasHitl,
        safety: {
          officialBudgetWrite: 'blocked' as const,
          canWriteConsolidationToBudget: false as const,
          touchedBudgetItemsTable: false as const,
        },
        snapshot: {
          id: snapshotResult.data.id,
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

// POST /api/orcamentista/workspaces/:workspaceId/generate-official-budget
router.post('/workspaces/:workspaceId/generate-official-budget', (_req, res) => {
  return res.status(410).json({
    success: false,
    erro: 'Geração oficial via rota legada está em quarentena. Escrita de IA em orcamento_itens permanece bloqueada nesta sprint.',
    code: 'legacy_official_budget_generation_quarantined',
  });
});

export default router;
