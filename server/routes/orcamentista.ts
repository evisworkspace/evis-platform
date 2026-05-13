import express, { Router, type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { runControlledManualOrcamentistaAction } from '../../platform/server/orcamentista/controlledManualAction';
import { getOrcamentistaPipelineView } from '../../platform/server/orcamentista/pipelineView';
import { createStagingClientFromEnv } from '../../platform/server/orcamentista/persistence/stagingClient';
import type { OrcamentistaPreview, OrcamentistaPreviewItem } from '../../platform/server/orcamentista/contracts';
import {
  createOrcamentistaWorkspace,
  listOrcamentistaWorkspaces,
  listWorkspaceAttachmentFiles,
  saveAttachmentToWorkspace,
  type WorkspaceAttachmentCategory,
} from '../../platform/server/orcamentista/workspaces';

const router = Router();

type OrcamentistaStreamEvent = Record<string, unknown>;

function sendStreamEvent(res: Response, event: OrcamentistaStreamEvent) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

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

      return res.json({ success: true, data: preview });
    }

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

    return res.json({ success: true, data: preview });
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
