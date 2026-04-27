import fs from 'fs';
import path from 'path';
import {
  ETAPA0_EXTRACTION_INSTRUCTION,
  ETAPA0_RESPONSE_SCHEMA,
  formatEtapa0Markdown,
  validateEtapa0,
} from '../orcamentista/etapa0';
import { syncWorkspaceAttachmentsToGcs } from '../orcamentista/gcsWorkspaceSync';
import { VertexDocumentRuntimeProvider } from '../orcamentista/providers/VertexDocumentRuntimeProvider';
import { StateManager } from '../orcamentista/stateManager';
import { listOrcamentistaWorkspaces } from '../orcamentista/workspaces';

async function main() {
  const workspaceId = process.argv[2] || process.env.ORCAMENTISTA_WORKSPACE_ID || '';

  if (!workspaceId) {
    const workspaces = listOrcamentistaWorkspaces().map((workspace) => workspace.id);
    console.log('Informe o workspaceId como argumento. Workspaces encontrados:');
    for (const workspace of workspaces) console.log(`- ${workspace}`);
    process.exitCode = 1;
    return;
  }

  const workspace = listOrcamentistaWorkspaces().find((item) => item.id === workspaceId);
  if (!workspace) {
    throw new Error(`Workspace nao encontrado: ${workspaceId}`);
  }

  console.log(`[Etapa0] Sincronizando anexos do workspace ${workspaceId} para GCS...`);
  const sync = await syncWorkspaceAttachmentsToGcs({ workspaceId });
  if (!sync.files.length) {
    throw new Error('Nenhum arquivo elegivel foi sincronizado para GCS.');
  }

  console.log(`[Etapa0] ${sync.files.length} arquivo(s) em GCS. Criando cache/extraindo JSON...`);
  const provider = new VertexDocumentRuntimeProvider({ fallbackOnCacheError: true });
  const cache = await provider.createCache({
    workspaceId,
    files: sync.files,
    ttlSeconds: Number(process.env.ORCAMENTISTA_CACHE_TTL_SECONDS || 3600),
  });

  const etapa0 = await provider.extractEtapa0({
    cacheName: cache.cacheName,
    filesBackup: sync.files,
    instruction: ETAPA0_EXTRACTION_INSTRUCTION,
    schema: ETAPA0_RESPONSE_SCHEMA,
  });
  const validation = validateEtapa0(etapa0);
  const payload = { cache, etapa0, files: sync.files, sync, validation };

  const state = new StateManager(workspaceId, process.env.ORCAMENTOS_ROOT || 'Or\u00e7amentos_2026');
  state.saveFragment('etapa0', payload);

  const jsonPath = path.join(workspace.fullPath, '02_ETAPA_0_EXTRACAO.json');
  const markdownPath = path.join(workspace.fullPath, '02_ETAPA_0_EXTRACAO.md');
  fs.writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
  fs.writeFileSync(markdownPath, formatEtapa0Markdown(etapa0, validation), 'utf-8');

  console.log('[Etapa0] Concluido.');
  console.log(`- Status: ${validation.status}`);
  console.log(`- Documentos: ${etapa0.documentos.length}`);
  console.log(`- Evidencias: ${etapa0.evidencias.length}`);
  console.log(`- Pendencias HITL: ${etapa0.pendencias_hitl.length}`);
  console.log(`- JSON: ${jsonPath}`);
  console.log(`- Markdown: ${markdownPath}`);
}

main().catch((error) => {
  console.error('[Etapa0] Falha:', error);
  process.exitCode = 1;
});
