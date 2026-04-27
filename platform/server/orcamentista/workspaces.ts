// @ts-nocheck
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  OrcamentistaAttachment,
  QuantitativoCandidato,
  ComposicaoCustoCandidata,
  SpecialistConflict,
} from './multiagent';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface OrcamentistaWorkspace {
  id: string;
  nome: string;
  fullPath: string;
}

export type WorkspaceAttachmentCategory = 'projeto' | 'fornecedores' | 'referencias';

export interface WorkspaceAttachmentFile {
  categoria: WorkspaceAttachmentCategory;
  nome: string;
  relativePath: string;
  mimeType: string;
  tamanhoBytes: number;
  atualizadoEm: string;
}

export interface WorkspaceRuntimeAttachmentLoadResult {
  attachments: OrcamentistaAttachment[];
  skipped: Array<{ relativePath: string; reason: string }>;
  totalBytes: number;
}

interface CreateWorkspaceInput {
  nomeObra: string;
  cliente?: string;
  ano?: number;
}

type OrcamentoMemory = {
  _meta?: { data_geracao?: string; [key: string]: unknown };
  fontes_entrada?: Array<Record<string, unknown>>;
  premissas?: string[];
  pendencias?: string[];
  // ── Blocos consolidados (gerados por persistConsolidatedAnalysisToWorkspace) ──
  disciplinas_analisadas?: string[];
  especialistas_acionados?: Array<{ id: string; nome: string; disciplina: string; escopo: string }>;
  quantitativos_candidatos?: QuantitativoCandidato[];
  composicoes_candidatas?: ComposicaoCustoCandidata[];
  perguntas_hitl?: string[];
  conflitos?: SpecialistConflict[];
};


function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function findOrcamentosRoot(): string {
  // O arquivo está em platform/server/orcamentista/workspaces.ts
  // Precisamos subir 3 níveis para chegar na raiz e então entrar em domains/orcamentista/vault
  const domainsRoot = path.resolve(__dirname, '../../../domains/orcamentista/vault');
  
  if (fs.existsSync(domainsRoot)) {
    console.log(`[Workspaces] Root detectado em: ${domainsRoot}`);
    return domainsRoot;
  }

  // Fallback para ambiente de desenvolvimento ou variáveis de ambiente
  const envRoot = process.env.ORCAMENTOS_ROOT;
  if (envRoot && fs.existsSync(envRoot)) {
    return envRoot;
  }

  console.error(`[Workspaces] ERRO: Pasta de orçamentos não encontrada em ${domainsRoot}`);
  throw new Error(`Pasta raiz de orçamentos não encontrada.`);
}

function ensureWorkspacePath(workspaceId: string): string {
  const root = findOrcamentosRoot();
  const target = path.resolve(root, workspaceId);

  const relative = path.relative(root, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Workspace inválido.');
  }

  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
    throw new Error('Workspace não encontrado.');
  }

  return target;
}

function toSlug(text: string): string {
  return normalizeText(text)
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
}

function guessMimeType(fileName: string): string {
  const extension = path.extname(fileName).toLowerCase();
  const knownTypes: Record<string, string> = {
    '.csv': 'text/csv',
    '.gif': 'image/gif',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.json': 'application/json',
    '.md': 'text/markdown',
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain',
    '.webp': 'image/webp',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls': 'application/vnd.ms-excel',
  };

  return knownTypes[extension] || 'application/octet-stream';
}

function collectWorkspaceFiles(
  workspacePath: string,
  currentPath: string,
  categoria: WorkspaceAttachmentCategory,
  files: WorkspaceAttachmentFile[]
) {
  if (!fs.existsSync(currentPath) || !fs.statSync(currentPath).isDirectory()) {
    return;
  }

  const entries = fs.readdirSync(currentPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(currentPath, entry.name);

    if (entry.isDirectory()) {
      collectWorkspaceFiles(workspacePath, fullPath, categoria, files);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const stats = fs.statSync(fullPath);
    files.push({
      categoria,
      nome: entry.name,
      relativePath: path.relative(workspacePath, fullPath).replace(/\\/g, '/'),
      mimeType: guessMimeType(entry.name),
      tamanhoBytes: stats.size,
      atualizadoEm: stats.mtime.toISOString(),
    });
  }
}

function nextWorkspaceCode(root: string, ano: number): string {
  const regex = new RegExp(`^ORC_${ano}-(\\d{3})_`);
  const values = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const match = entry.name.match(regex);
      return match ? Number(match[1]) : null;
    })
    .filter((value): value is number => value !== null);

  const next = values.length ? Math.max(...values) + 1 : 1;
  return `ORC_${ano}-${String(next).padStart(3, '0')}`;
}

function writeUtf8(filePath: string, content: string) {
  fs.writeFileSync(filePath, content, 'utf-8');
}

function sanitizeFileName(fileName: string): string {
  return path.basename(fileName).replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_');
}

function copyDirectorySafe(source: string, destination: string) {
  fs.mkdirSync(destination, { recursive: true });

  const entries = fs.readdirSync(source, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDirectorySafe(sourcePath, destinationPath);
      continue;
    }

    if (entry.isFile()) {
      fs.copyFileSync(sourcePath, destinationPath);
    }
  }
}

function sectionBlock(title: string, body: string): string {
  return [
    '',
    `## ${title}`,
    '',
    '<!-- AUTO:EVIS_ORCAMENTISTA_START -->',
    body.trim(),
    '<!-- AUTO:EVIS_ORCAMENTISTA_END -->',
    '',
  ].join('\n');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function upsertAutoSection(content: string, title: string, body: string): string {
  const section = sectionBlock(title, body);
  const markerRegex = new RegExp(
    `\\n## ${escapeRegExp(title)}\\n\\n<!-- AUTO:EVIS_ORCAMENTISTA_START -->[\\s\\S]*?<!-- AUTO:EVIS_ORCAMENTISTA_END -->\\n?`,
    'm'
  );

  if (markerRegex.test(content)) {
    return content.replace(markerRegex, `\n${section}`);
  }

  const trimmed = content.trimEnd();
  return `${trimmed}\n${section}`;
}

function attachmentsTable(anexos: OrcamentistaAttachment[]): string {
  if (!anexos.length) {
    return '| Arquivo | Categoria | Leitura prevista |\n| --- | --- | --- |\n| Nenhum anexo recebido nesta rodada | projeto | A confirmar |';
  }

  const rows = anexos.map((anexo) => {
    const categoria = anexo.mimeType.includes('json') || anexo.mimeType.includes('csv') ? 'referencia' : 'projeto';
    const leitura =
      anexo.mimeType === 'application/pdf'
        ? 'Leitura multimodal de projeto'
        : anexo.mimeType.startsWith('image/')
        ? 'Leitura visual de prancha/imagem'
        : 'Leitura textual estruturada';

    return `| ${anexo.nome} | ${categoria} | ${leitura} |`;
  });

  return ['| Arquivo | Categoria | Leitura prevista |', '| --- | --- | --- |', ...rows].join('\n');
}

function dedupeStrings(values: Array<string | null | undefined>): string[] {
  const next: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    if (typeof value !== 'string') {
      continue;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }

    const key = normalizeText(trimmed).toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    next.push(trimmed);
  }

  return next;
}

function mergeStringArray(current: unknown, additions: string[]): string[] {
  const currentValues = Array.isArray(current)
    ? current.filter((item): item is string => typeof item === 'string')
    : [];

  return dedupeStrings([...currentValues, ...additions]);
}

function mergeRecordArray<T extends Record<string, unknown>>(
  current: unknown,
  additions: T[],
  getKey: (item: Record<string, unknown>) => string,
  compare?: (left: Record<string, unknown>, right: Record<string, unknown>) => number
): Array<Record<string, unknown>> {
  const merged = new Map<string, Record<string, unknown>>();

  if (Array.isArray(current)) {
    for (const entry of current) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        continue;
      }

      const record = { ...(entry as Record<string, unknown>) };
      const key = getKey(record);
      if (key) {
        merged.set(key, record);
      }
    }
  }

  for (const entry of additions) {
    const record = { ...entry };
    const key = getKey(record);
    if (!key) {
      continue;
    }

    const existing = merged.get(key);
    merged.set(key, existing ? { ...existing, ...record } : record);
  }

  const values = Array.from(merged.values());
  if (compare) {
    values.sort(compare);
  }

  return values;
}

function analysisSummary(analysis: MultiAgentAnalysis): string {
  const knowledgeSummary = analysis.meta?.knowledge_sources
    ? [
        `- reader: ${analysis.meta.knowledge_sources.reader.join(', ')}`,
        `- planner: ${analysis.meta.knowledge_sources.planner.join(', ')}`,
        `- specialists_phase1: ${analysis.meta.knowledge_sources.specialists_phase1.join(', ')}`,
        `- specialist_quantitativos: ${analysis.meta.knowledge_sources.specialist_quantitativos.join(', ')}`,
        `- specialist_composicao: ${analysis.meta.knowledge_sources.specialist_composicao.join(', ')}`,
        `- specialist: ${analysis.meta.knowledge_sources.specialist.join(', ')}`,
        `- auditor: ${analysis.meta.knowledge_sources.auditor.join(', ')}`,
        analysis.meta.knowledge_sources.auditor_arbiter
          ? `- auditor_arbiter: ${analysis.meta.knowledge_sources.auditor_arbiter.join(', ')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n')
    : '- Pacotes de conhecimento não registrados.';

  return [
    `**Gerado em:** ${analysis.generatedAt}`,
    `**Disciplina piloto:** ${analysis.planner.disciplina_piloto}`,
    `**Status auditoria:** ${analysis.auditor.status}`,
    `**Score consistência:** ${analysis.auditor.score_consistencia}`,
    analysis.meta
      ? `**Auditoria IA:** ${analysis.meta.auditor_provider} · ${analysis.meta.auditor_model}${
          analysis.meta.auditor_escalated ? ' (com escalonamento)' : ''
        }`
      : '',
    analysis.meta?.auditor_escalation_pending
      ? `**Escalada premium pendente:** ${analysis.meta.auditor_escalation_reason || 'A validar pelo usuário antes de acionar Opus.'}`
      : '',
    '',
    '### Pacotes de conhecimento',
    knowledgeSummary,
    '',
    '### Resumo executivo',
    analysis.reader.resumo_executivo,
    '',
    '### Especialistas acionados',
    analysis.specialists_phase1.length
      ? analysis.specialists_phase1
          .map(
            (item) =>
              `- ${item.specialist_nome} (${item.specialist_id}) -> ${item.disciplina}: ${item.escopo}`
          )
          .join('\n')
      : '- Nenhum especialista Fase 1 executado nesta rodada.',
    '',
    '### Itens críticos',
    analysis.reader.itens_criticos.length
      ? analysis.reader.itens_criticos.map((item) => `- ${item}`).join('\n')
      : '- Nenhum item crítico explícito identificado.',
    '',
    '### Lacunas',
    analysis.reader.lacunas.length
      ? analysis.reader.lacunas.map((item) => `- ${item}`).join('\n')
      : '- Nenhuma lacuna registrada.',
  ].join('\n');
}

export function saveChatHistoryToWorkspace(workspaceId: string, history: any[]) {
  try {
    const root = findOrcamentosRoot();
    const filePath = path.join(root, workspaceId, 'chat_history.json');
    fs.writeFileSync(filePath, JSON.stringify(history, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[Workspaces] Erro ao salvar histórico de chat:`, err);
  }
}

export function loadChatHistoryFromWorkspace(workspaceId: string): any[] {
  try {
    const root = findOrcamentosRoot();
    const filePath = path.join(root, workspaceId, 'chat_history.json');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(`[Workspaces] Erro ao carregar histórico de chat:`, err);
  }
  return [];
}

export function saveCheckpoint(workspaceId: string, etapa: string, data: any) {
  try {
    const root = findOrcamentosRoot();
    const stateDir = path.join(root, workspaceId, 'state');
    if (!fs.existsSync(stateDir)) fs.mkdirSync(stateDir, { recursive: true });
    
    const filePath = path.join(stateDir, `checkpoint_${etapa}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    
    // Atualiza o estado geral da sessão
    const sessionPath = path.join(stateDir, 'session_state.json');
    let sessionState: any = { etapa_atual: etapa, ultima_atualizacao: new Date().toISOString() };
    if (fs.existsSync(sessionPath)) {
      sessionState = { ...JSON.parse(fs.readFileSync(sessionPath, 'utf-8')), ...sessionState };
    }
    fs.writeFileSync(sessionPath, JSON.stringify(sessionState, null, 2), 'utf-8');
    
    console.log(`[Checkpoint] ✅ Etapa ${etapa} salva para o workspace ${workspaceId}`);
  } catch (err) {
    console.error(`[Checkpoint] Erro ao salvar checkpoint ${etapa}:`, err);
  }
}

export function loadCheckpoint(workspaceId: string, etapa: string): any | null {
  try {
    const root = findOrcamentosRoot();
    const filePath = path.join(root, workspaceId, 'state', `checkpoint_${etapa}.json`);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (err) {
    console.error(`[Checkpoint] Erro ao carregar checkpoint ${etapa}:`, err);
  }
  return null;
}

function validatedAnalysisSection(analysis: any): string {
  const achadosQuantitativos = analysis.specialist_quantitativos.achados_quantitativos.length
    ? analysis.specialist_quantitativos.achados_quantitativos.map((item) => `- ${item}`).join('\n')
    : '- Nenhum achado de quantitativos consolidado.';
  const achadosCustos = analysis.specialist_composicao.achados_custos.length
    ? analysis.specialist_composicao.achados_custos.map((item) => `- ${item}`).join('\n')
    : '- Nenhum achado de composição de custos consolidado.';
  const conflitos = analysis.specialist.conflitos.length
    ? analysis.specialist.conflitos
        .map(
          (item) =>
            `- [${item.severidade}] ${item.titulo}: ${item.descricao}${
              item.evidencias.length ? ` | Evidências: ${item.evidencias.join('; ')}` : ''
            }`
        )
        .join('\n')
    : '- Nenhum conflito crítico registrado.';
  const perguntas = [
    ...analysis.specialist_quantitativos.perguntas_hitl,
    ...analysis.specialist_composicao.perguntas_hitl,
    ...analysis.auditor.perguntas_hitl,
  ];
  const composicoes = analysis.specialist_composicao.composicoes_candidatas.length
    ? analysis.specialist_composicao.composicoes_candidatas
        .map((item) => {
          const codigo = item.codigo_referencia || 'sem código';
          const quantidade = item.quantidade_base === null ? 'a confirmar' : String(item.quantidade_base);
          const unidade = item.unidade || 'sem unidade';
          const custoUnitario = item.custo_unitario === null ? 'a confirmar' : String(item.custo_unitario);
          const custoTotal = item.custo_total === null ? 'a confirmar' : String(item.custo_total);
          return `- ${item.servico}: código ${codigo}, base ${quantidade} ${unidade}, unitário ${custoUnitario}, total ${custoTotal} (${item.observacao})`;
        })
        .join('\n')
    : '- Nenhuma composição candidata registrada.';
  const knowledgeSummary = analysis.meta?.knowledge_sources
    ? [
        `- reader: ${analysis.meta.knowledge_sources.reader.join(', ')}`,
        `- planner: ${analysis.meta.knowledge_sources.planner.join(', ')}`,
        `- specialists_phase1: ${analysis.meta.knowledge_sources.specialists_phase1.join(', ')}`,
        `- specialist_quantitativos: ${analysis.meta.knowledge_sources.specialist_quantitativos.join(', ')}`,
        `- specialist_composicao: ${analysis.meta.knowledge_sources.specialist_composicao.join(', ')}`,
        `- specialist: ${analysis.meta.knowledge_sources.specialist.join(', ')}`,
        `- auditor: ${analysis.meta.knowledge_sources.auditor.join(', ')}`,
        analysis.meta.knowledge_sources.auditor_arbiter
          ? `- auditor_arbiter: ${analysis.meta.knowledge_sources.auditor_arbiter.join(', ')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n')
    : '- Pacotes de conhecimento não registrados.';

  return [
    `**Gerado em:** ${analysis.generatedAt}`,
    analysis.meta
      ? `**Auditoria IA:** ${analysis.meta.auditor_provider} · ${analysis.meta.auditor_model}${
          analysis.meta.auditor_escalated ? ' (com escalonamento)' : ''
        }`
      : '',
    analysis.meta?.auditor_escalation_pending
      ? `**Escalada premium pendente:** ${analysis.meta.auditor_escalation_reason || 'A validar pelo usuário antes de acionar Opus.'}`
      : '',
    '',
    '### Pacotes de conhecimento',
    knowledgeSummary,
    '',
    '### Escopo analisado',
    analysis.specialist.escopo,
    '',
    '### Especialistas Fase 1 executados',
    analysis.specialists_phase1.length
      ? analysis.specialists_phase1
          .map(
            (item) =>
              `- ${item.specialist_nome} (${item.specialist_id}) -> ${item.disciplina}: ${item.escopo}`
          )
          .join('\n')
      : '- Nenhum especialista Fase 1 executado nesta rodada.',
    '',
    '### Achados de quantitativos',
    achadosQuantitativos,
    '',
    '### Achados de composição de custos',
    achadosCustos,
    '',
    '### Composições candidatas',
    composicoes,
    '',
    '### Conflitos e divergências',
    conflitos,
    '',
    '### Omissões e riscos de auditoria',
    analysis.auditor.omissoes.length || analysis.auditor.riscos.length
      ? [...analysis.auditor.omissoes, ...analysis.auditor.riscos].map((item) => `- ${item}`).join('\n')
      : '- Nenhuma omissão ou risco adicional registrado.',
    '',
    '### Perguntas para validação do usuário',
    perguntas.length ? perguntas.map((item) => `- ${item}`).join('\n') : '- Sem perguntas adicionais nesta rodada.',
    '',
    '### Recomendação do auditor',
    analysis.auditor.recomendacao,
  ].join('\n');
}

function collectDisciplinasAnalisadas(analysis: MultiAgentAnalysis): string[] {
  return dedupeStrings([
    ...analysis.reader.disciplinas_detectadas,
    ...analysis.planner.disciplinas_priorizadas,
    ...analysis.planner.tarefas.map((task) => task.disciplina),
    ...analysis.planner.roteamento_especialistas.map((item) => item.disciplina),
    ...analysis.specialists_phase1.map((item) => item.disciplina),
    analysis.specialist.disciplina,
    analysis.specialist_quantitativos.disciplina,
    analysis.specialist_composicao.disciplina,
  ]).sort((left, right) => left.localeCompare(right, 'pt-BR'));
}

function collectEspecialistasAcionados(analysis: MultiAgentAnalysis): Array<Record<string, unknown>> {
  const planejados = analysis.planner.roteamento_especialistas.map((item) => {
    const executed = analysis.specialists_phase1.find((specialist) => specialist.specialist_id === item.specialist_id);
    return {
      especialista_id: item.specialist_id,
      especialista_nome: executed?.specialist_nome || item.specialist_id,
      disciplina: item.disciplina,
      escopo: item.objetivo,
      status: executed ? 'executado' : 'roteado',
      prioridade: item.prioridade,
      arquivos_relacionados: item.arquivos_relacionados,
      paginas_prioritarias: item.paginas_prioritarias || [],
      itens_analise: item.itens_analise,
      confianca: executed?.confianca ?? null,
    };
  });

  return mergeRecordArray(
    analysis.specialists_phase1.map((item) => ({
      especialista_id: item.specialist_id,
      especialista_nome: item.specialist_nome,
      disciplina: item.disciplina,
      escopo: item.escopo,
      status: 'executado',
      prioridade: null,
      arquivos_relacionados: [],
      paginas_prioritarias: [],
      itens_analise: [],
      confianca: item.confianca,
    })),
    planejados,
    (item) => [item.especialista_id, item.disciplina].map((value) => String(value || '')).join('|'),
    (left, right) => {
      const disciplinaCompare = String(left.disciplina || '').localeCompare(String(right.disciplina || ''), 'pt-BR');
      if (disciplinaCompare !== 0) {
        return disciplinaCompare;
      }

      return String(left.especialista_nome || '').localeCompare(String(right.especialista_nome || ''), 'pt-BR');
    }
  );
}

function collectQuantitativosCandidatos(analysis: MultiAgentAnalysis): Array<Record<string, unknown>> {
  const additions: Array<Record<string, unknown>> = [
    ...analysis.specialists_phase1.flatMap((specialist) =>
      specialist.quantitativos_chave.map((item) => ({
        origem: specialist.specialist_id,
        disciplina: specialist.disciplina,
        item: item.item,
        unidade: item.unidade,
        quantidade: item.quantidade,
        observacao: item.observacao,
      }))
    ),
    ...analysis.specialist.quantitativos_candidatos.map((item) => ({
      origem: 'specialist_consolidado',
      disciplina: analysis.specialist.disciplina,
      item: item.item,
      unidade: item.unidade,
      quantidade: item.quantidade,
      observacao: item.observacao,
    })),
    ...analysis.specialist_quantitativos.quantitativos_candidatos.map((item) => ({
      origem: 'specialist_quantitativos',
      disciplina: analysis.specialist_quantitativos.disciplina,
      item: item.item,
      unidade: item.unidade,
      quantidade: item.quantidade,
      observacao: item.observacao,
    })),
  ];

  return mergeRecordArray(
    [],
    additions,
    (item) =>
      [item.disciplina, item.item, item.unidade, item.origem]
        .map((value) => String(value || ''))
        .join('|'),
    (left, right) => {
      const disciplinaCompare = String(left.disciplina || '').localeCompare(String(right.disciplina || ''), 'pt-BR');
      if (disciplinaCompare !== 0) {
        return disciplinaCompare;
      }

      return String(left.item || '').localeCompare(String(right.item || ''), 'pt-BR');
    }
  );
}

function collectComposicoesCandidatas(analysis: MultiAgentAnalysis): Array<Record<string, unknown>> {
  return analysis.specialist_composicao.composicoes_candidatas.map((item) => ({
    origem: 'specialist_composicao',
    disciplina: analysis.specialist_composicao.disciplina,
    servico: item.servico,
    codigo_referencia: item.codigo_referencia,
    unidade: item.unidade,
    quantidade_base: item.quantidade_base,
    custo_unitario: item.custo_unitario,
    custo_total: item.custo_total,
    observacao: item.observacao,
  }));
}

function collectPerguntasHitl(analysis: MultiAgentAnalysis): Array<Record<string, unknown>> {
  const additions: Array<Record<string, unknown>> = [
    ...analysis.specialists_phase1.flatMap((specialist) =>
      specialist.perguntas_hitl.map((pergunta) => ({
        origem: specialist.specialist_id,
        disciplina: specialist.disciplina,
        pergunta,
      }))
    ),
    ...analysis.specialist.perguntas_hitl.map((pergunta) => ({
      origem: 'specialist_consolidado',
      disciplina: analysis.specialist.disciplina,
      pergunta,
    })),
    ...analysis.specialist_quantitativos.perguntas_hitl.map((pergunta) => ({
      origem: 'specialist_quantitativos',
      disciplina: analysis.specialist_quantitativos.disciplina,
      pergunta,
    })),
    ...analysis.specialist_composicao.perguntas_hitl.map((pergunta) => ({
      origem: 'specialist_composicao',
      disciplina: analysis.specialist_composicao.disciplina,
      pergunta,
    })),
    ...analysis.auditor.perguntas_hitl.map((pergunta) => ({
      origem: 'auditor',
      disciplina: analysis.specialist.disciplina,
      pergunta,
    })),
  ];

  return mergeRecordArray(
    [],
    additions,
    (item) => String(item.pergunta || ''),
    (left, right) => String(left.pergunta || '').localeCompare(String(right.pergunta || ''), 'pt-BR')
  );
}

function collectConflitos(analysis: MultiAgentAnalysis): Array<Record<string, unknown>> {
  const additions: Array<Record<string, unknown>> = [
    ...analysis.specialists_phase1.flatMap((specialist) =>
      specialist.conflitos.map((item) => ({
        origem: specialist.specialist_id,
        disciplina: specialist.disciplina,
        titulo: item.titulo,
        descricao: item.descricao,
        severidade: item.severidade,
        evidencias: item.evidencias,
      }))
    ),
    ...analysis.specialist.conflitos.map((item) => ({
      origem: 'specialist_consolidado',
      disciplina: analysis.specialist.disciplina,
      titulo: item.titulo,
      descricao: item.descricao,
      severidade: item.severidade,
      evidencias: item.evidencias,
    })),
    ...analysis.specialist_quantitativos.conflitos.map((item) => ({
      origem: 'specialist_quantitativos',
      disciplina: analysis.specialist_quantitativos.disciplina,
      titulo: item.titulo,
      descricao: item.descricao,
      severidade: item.severidade,
      evidencias: item.evidencias,
    })),
    ...analysis.specialist_composicao.conflitos.map((item) => ({
      origem: 'specialist_composicao',
      disciplina: analysis.specialist_composicao.disciplina,
      titulo: item.titulo,
      descricao: item.descricao,
      severidade: item.severidade,
      evidencias: item.evidencias,
    })),
  ];

  return mergeRecordArray(
    [],
    additions,
    (item) =>
      [item.disciplina, item.titulo, item.descricao, item.severidade]
        .map((value) => String(value || ''))
        .join('|'),
    (left, right) => {
      const severityWeight = { alta: 0, media: 1, baixa: 2 } as const;
      const leftWeight = severityWeight[String(left.severidade || 'baixa') as keyof typeof severityWeight] ?? 99;
      const rightWeight = severityWeight[String(right.severidade || 'baixa') as keyof typeof severityWeight] ?? 99;
      if (leftWeight !== rightWeight) {
        return leftWeight - rightWeight;
      }

      return String(left.titulo || '').localeCompare(String(right.titulo || ''), 'pt-BR');
    }
  );
}

function collectPendencias(analysis: MultiAgentAnalysis): string[] {
  return dedupeStrings([
    ...analysis.reader.lacunas,
    ...analysis.reader.inconsistencias_iniciais,
    ...analysis.auditor.divergencias,
    ...analysis.auditor.omissoes,
    ...analysis.auditor.riscos,
    ...analysis.specialist_composicao.pendencias_consulta,
  ]);
}

function mergeMemoryJson(
  current: OrcamentoMemory,
  analysis: MultiAgentAnalysis,
  anexos: OrcamentistaAttachment[]
): OrcamentoMemory {
  const next: OrcamentoMemory = { ...current };
  next._meta = {
    ...(current._meta || {}),
    data_geracao: analysis.generatedAt,
    ...(analysis.meta
      ? {
          auditor_provider: analysis.meta.auditor_provider,
          auditor_model: analysis.meta.auditor_model,
        }
      : {}),
  };

  const currentFontes = Array.isArray(current.fontes_entrada) ? current.fontes_entrada : [];
  next.fontes_entrada = anexos.map((anexo) => ({
    arquivo: anexo.nome,
    tipo: anexo.mimeType,
    origem: 'upload_chat_orcamentista',
  }));

  const currentPremissas = Array.isArray(current.premissas) ? current.premissas : [];
  next.premissas = Array.from(new Set([...currentPremissas, ...analysis.specialist.premissas]));

  const currentPendencias = Array.isArray(current.pendencias) ? current.pendencias : [];
  next.pendencias = Array.from(
    new Set([
      ...currentPendencias,
      ...analysis.reader.lacunas,
      ...analysis.auditor.omissoes,
      ...analysis.auditor.riscos,
      ...analysis.specialist_composicao.pendencias_consulta,
    ])
  );

  const _ = currentFontes; // quiet unused intent in case of future merge adjustments
  void _;
  return next;
}

function isIncrementalMultiAgentAnalysis(analysis: MultiAgentAnalysis): boolean {
  return Boolean(analysis?.reader?.documentos && analysis?.planner?.roteiro && analysis?.quantitativos?.itens);
}

function summarizeIncrementalAnalysis(analysis: MultiAgentAnalysis): string {
  const documentos = analysis.reader?.documentos || [];
  const roteiro = analysis.planner?.roteiro || [];
  const itens = analysis.quantitativos?.itens || [];
  const documentosTexto = documentos.length
    ? documentos.map((doc) => `- ${doc.nome} · ${doc.tipo} · rev ${doc.revisao}`).join('\n')
    : '_Nenhum documento classificado nesta rodada._';
  const roteiroTexto = roteiro.length
    ? roteiro.map((etapa) => `- ${etapa.etapa} (${etapa.agente_responsavel})`).join('\n')
    : '_Roteiro não disponível._';
  const contexto = analysis.reader?.contexto_geral || {};

  return [
    `**Status:** ${analysis.status}`,
    `**Score de consistência:** ${analysis.scoreConsistencia ?? 0}`,
    '',
    '### Documentos classificados',
    documentosTexto,
    '',
    '### Contexto geral detectado',
    `- FCK previsto: ${contexto.fck_previsto || 'não identificado'}`,
    `- N-SPT máximo: ${contexto.n_spt_max ?? 'não identificado'}`,
    `- Área total: ${contexto.area_total ?? 'não identificada'}`,
    '',
    '### Roteiro técnico proposto',
    roteiroTexto,
    '',
    `### Quantitativos candidatos gerados`,
    `- ${itens.length} item(ns) com rastreabilidade documental`,
  ].join('\n');
}

function validatedIncrementalAnalysisSection(analysis: MultiAgentAnalysis): string {
  const itens = analysis.quantitativos?.itens || [];
  const tabelaItens = itens.length
    ? [
        '| Código | Descrição | Unidade | Quantidade | Origem | Evidência |',
        '| --- | --- | --- | ---: | --- | --- |',
        ...itens.map((item) =>
          `| ${item.codigo_nm} | ${item.descricao} | ${item.unidade} | ${item.quantidade} | ${item.origem} | ${item.evidencia?.documento || '—'} |`
        ),
      ].join('\n')
    : '_Nenhum quantitativo candidato nesta rodada._';

  return [
    `**Status:** ${analysis.status}`,
    `**Score de consistência:** ${analysis.scoreConsistencia ?? 0}`,
    '',
    analysis.markdown || '_Sem relatório markdown nesta rodada._',
    '',
    '## Quantitativos validados na rodada',
    '',
    tabelaItens,
  ].join('\n');
}

function mergeIncrementalMemoryJson(
  current: OrcamentoMemory,
  analysis: MultiAgentAnalysis,
  anexos: OrcamentistaAttachment[]
): OrcamentoMemory {
  const next: OrcamentoMemory = { ...current };
  next._meta = {
    ...(current._meta || {}),
    data_geracao: new Date().toISOString(),
    origem_runtime: 'multiagent_incremental',
  };

  next.fontes_entrada = anexos.map((anexo) => ({
    arquivo: anexo.relativePath || anexo.nome,
    tipo: anexo.mimeType,
    origem: anexo.origem || 'workspace',
  }));

  const premissas = [
    analysis.reader?.contexto_geral?.fck_previsto ? `FCK previsto detectado: ${analysis.reader.contexto_geral.fck_previsto}` : null,
    analysis.reader?.contexto_geral?.n_spt_max != null ? `N-SPT máximo detectado: ${analysis.reader.contexto_geral.n_spt_max}` : null,
    analysis.reader?.contexto_geral?.area_total != null ? `Área total detectada: ${analysis.reader.contexto_geral.area_total} m²` : null,
  ];
  next.premissas = mergeStringArray(current.premissas, dedupeStrings(premissas));

  const pendencias = (analysis.planner?.roteiro || [])
    .filter((etapa) => etapa.hitl_obrigatorio)
    .map((etapa) => `Validação HITL obrigatória: ${etapa.etapa}`);
  next.pendencias = mergeStringArray(current.pendencias, pendencias);

  next.disciplinas_analisadas = dedupeStrings(
    (analysis.reader?.documentos || []).map((doc) => doc.tipo)
  );
  next.especialistas_acionados = (analysis.planner?.roteiro || []).map((etapa) => ({
    id: String(etapa.id),
    nome: etapa.agente_responsavel,
    disciplina: etapa.etapa,
    escopo: etapa.etapa,
  }));
  next.quantitativos_candidatos = (analysis.quantitativos?.itens || []).map((item) => ({
    codigo_nm: item.codigo_nm,
    descricao: item.descricao,
    unidade: item.unidade,
    quantidade: item.quantidade,
    origem: item.origem,
    confianca: item.evidencia?.confianca || analysis.scoreConsistencia || 0,
    fonte_documental: item.evidencia?.documento,
  }));
  next.composicoes_candidatas = current.composicoes_candidatas || [];
  next.perguntas_hitl = mergeStringArray(
    current.perguntas_hitl,
    pendencias
  );
  next.conflitos = current.conflitos || [];

  return next;
}

function buildIncrementalOrcamentoPreliminarMd(analysis: MultiAgentAnalysis): string {
  const itens = analysis.quantitativos?.itens || [];
  const roteiro = analysis.planner?.roteiro || [];
  const documentos = analysis.reader?.documentos || [];

  return [
    '# 03 — Orçamento Preliminar',
    '',
    '> Gerado automaticamente pelo Evis Orçamentista.',
    '',
    '<!-- AUTO:EVIS_ORC_PRELIMINAR_START -->',
    '',
    '## Metadados da análise',
    '',
    '| Campo | Valor |',
    '| --- | --- |',
    `| Status | ${analysis.status} |`,
    `| Score de consistência | ${analysis.scoreConsistencia ?? 0} |`,
    `| Documentos classificados | ${documentos.length} |`,
    `| Etapas planejadas | ${roteiro.length} |`,
    `| Quantitativos candidatos | ${itens.length} |`,
    '',
    '## Documentos classificados',
    '',
    documentos.length
      ? documentos.map((doc) => `- ${doc.nome} · ${doc.tipo} · rev ${doc.revisao}`).join('\n')
      : '_Nenhum documento classificado._',
    '',
    '## Roteiro técnico',
    '',
    roteiro.length
      ? roteiro.map((etapa) => `- ${etapa.etapa} — ${etapa.agente_responsavel}${etapa.hitl_obrigatorio ? ' · HITL' : ''}`).join('\n')
      : '_Roteiro indisponível._',
    '',
    '## Quantitativos candidatos',
    '',
    itens.length
      ? [
          '| Código | Descrição | Unidade | Quantidade | Origem | Evidência |',
          '| --- | --- | --- | ---: | --- | --- |',
          ...itens.map((item) =>
            `| ${item.codigo_nm} | ${item.descricao} | ${item.unidade} | ${item.quantidade} | ${item.origem} | ${item.evidencia?.documento || '—'} |`
          ),
        ].join('\n')
      : '_Nenhum quantitativo candidato gerado._',
    '',
    '<!-- AUTO:EVIS_ORC_PRELIMINAR_END -->',
    '',
  ].join('\n');
}

// ─── Bloco de persistência consolidada ────────────────────────────────────────

function buildOrcamentoPreliminarMd(analysis: MultiAgentAnalysis): string {
  const now = analysis.generatedAt;

  // Especialistas Fase 1
  const especialistasLinhas = analysis.specialists_phase1.length
    ? analysis.specialists_phase1
        .map((s) => `| ${s.specialist_nome} (${s.specialist_id}) | ${s.disciplina} | ${s.confianca.toFixed(2)} |`)
        .join('\n')
    : '| — | — | — |';

  // Quantitativos candidatos (fase1 + specialist_quantitativos)
  const quantCandidatos = [
    ...analysis.specialists_phase1.flatMap((s) => s.quantitativos_chave),
    ...analysis.specialist_quantitativos.quantitativos_candidatos,
  ];
  const quantLinhas = quantCandidatos.length
    ? quantCandidatos
        .map((q) => `| ${q.item} | ${q.unidade || '—'} | ${q.quantidade ?? 'a confirmar'} | ${q.observacao} |`)
        .join('\n')
    : '| — | — | — | — |';

  // Composições candidatas
  const compLinhas = analysis.specialist_composicao.composicoes_candidatas.length
    ? analysis.specialist_composicao.composicoes_candidatas
        .map((c) => {
          const cod = c.codigo_referencia || '—';
          const qtd = c.quantidade_base ?? 'a confirmar';
          const un = c.unidade || '—';
          const unit = c.custo_unitario != null ? `R$ ${c.custo_unitario.toFixed(2)}` : 'a confirmar';
          const total = c.custo_total != null ? `R$ ${c.custo_total.toFixed(2)}` : 'a confirmar';
          return `| ${c.servico} | ${cod} | ${qtd} | ${un} | ${unit} | ${total} | ${c.observacao} |`;
        })
        .join('\n')
    : '| — | — | — | — | — | — | — |';

  // Perguntas HITL consolidadas
  const perguntasHitl = Array.from(
    new Set([
      ...analysis.specialist_quantitativos.perguntas_hitl,
      ...analysis.specialist_composicao.perguntas_hitl,
      ...analysis.auditor.perguntas_hitl,
      ...analysis.specialists_phase1.flatMap((s) => s.perguntas_hitl),
    ])
  );
  const perguntasLinhas = perguntasHitl.length
    ? perguntasHitl.map((p, i) => `${i + 1}. ${p}`).join('\n')
    : '_Nenhuma pergunta pendente nesta rodada._';

  // Conflitos
  const conflitos = [
    ...analysis.specialist.conflitos,
    ...analysis.specialists_phase1.flatMap((s) => s.conflitos),
  ];
  const conflitosLinhas = conflitos.length
    ? conflitos
        .map((c) => `- **[${c.severidade.toUpperCase()}]** ${c.titulo}: ${c.descricao}`)
        .join('\n')
    : '_Nenhum conflito registrado nesta rodada._';

  return [
    '# 03 — Orçamento Preliminar',
    '',
    `> Gerado automaticamente pelo Evis Orçamentista em \`${now}\`.`,
    '> Não edite manualmente esta seção automática — use as seções manuais abaixo.',
    '',
    '<!-- AUTO:EVIS_ORC_PRELIMINAR_START -->',
    '',
    '## Metadados da análise',
    '',
    `| Campo | Valor |`,
    `| --- | --- |`,
    `| Gerado em | ${now} |`,
    `| Disciplina piloto | ${analysis.planner.disciplina_piloto} |`,
    `| Status auditoria | ${analysis.auditor.status} |`,
    `| Score consistência | ${analysis.auditor.score_consistencia} |`,
    analysis.meta ? `| Auditor | ${analysis.meta.auditor_provider} · ${analysis.meta.auditor_model} |` : '',
    '',
    '## Disciplinas analisadas',
    '',
    analysis.reader.disciplinas_detectadas.map((d) => `- ${d}`).join('\n') || '_Nenhuma disciplina detectada._',
    '',
    '## Especialistas acionados',
    '',
    '| Especialista | Disciplina | Confiança |',
    '| --- | --- | ---: |',
    especialistasLinhas,
    '',
    '## Quantitativos candidatos',
    '',
    '| Item | Un | Quantidade | Observação |',
    '| --- | --- | --- | --- |',
    quantLinhas,
    '',
    '## Composições de custo candidatas',
    '',
    '| Serviço | Cód. Ref. | Qtd | Un | Unitário | Total | Observação |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    compLinhas,
    '',
    '## Perguntas HITL — validação necessária',
    '',
    perguntasLinhas,
    '',
    '## Conflitos e divergências',
    '',
    conflitosLinhas,
    '',
    '## Recomendação do auditor',
    '',
    analysis.auditor.recomendacao,
    '',
    '<!-- AUTO:EVIS_ORC_PRELIMINAR_END -->',
    '',
    '---',
    '',
    '## Observações manuais do responsável',
    '',
    '_Espaço reservado para notas e decisões do orçamentista humano._',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

function upsertOrcamentoPreliminar(existingContent: string, analysis: MultiAgentAnalysis): string {
  const newAuto = buildOrcamentoPreliminarMd(analysis);
  const autoRegex =
    /<!-- AUTO:EVIS_ORC_PRELIMINAR_START -->[\s\S]*?<!-- AUTO:EVIS_ORC_PRELIMINAR_END -->/m;

  if (autoRegex.test(existingContent)) {
    const newBlock = newAuto.match(
      /<!-- AUTO:EVIS_ORC_PRELIMINAR_START -->[\s\S]*?<!-- AUTO:EVIS_ORC_PRELIMINAR_END -->/m
    )?.[0] || '';
    return existingContent.replace(autoRegex, newBlock);
  }

  // Arquivo novo — retorna o conteúdo completo gerado
  return newAuto;
}

function mergeMemoryJsonConsolidado(
  current: OrcamentoMemory,
  analysis: MultiAgentAnalysis
): OrcamentoMemory {
  const next: OrcamentoMemory = { ...current };

  // _meta: preserva campos existentes, atualiza campos automáticos
  next._meta = {
    ...(current._meta || {}),
    data_geracao_consolidado: analysis.generatedAt,
    ...(analysis.meta
      ? {
          auditor_provider: analysis.meta.auditor_provider,
          auditor_model: analysis.meta.auditor_model,
        }
      : {}),
  };

  // disciplinas_analisadas: union com existentes
  const currentDisciplinas = Array.isArray(current.disciplinas_analisadas) ? current.disciplinas_analisadas : [];
  next.disciplinas_analisadas = Array.from(
    new Set([...currentDisciplinas, ...analysis.reader.disciplinas_detectadas])
  );

  // especialistas_acionados: substituir pelos da última rodada
  next.especialistas_acionados = analysis.specialists_phase1.map((s) => ({
    id: s.specialist_id,
    nome: s.specialist_nome,
    disciplina: s.disciplina,
    escopo: s.escopo,
  }));

  // quantitativos_candidatos: union por item (sem duplicar)
  const currentQuant = Array.isArray(current.quantitativos_candidatos) ? current.quantitativos_candidatos : [];
  const newQuant = [
    ...analysis.specialists_phase1.flatMap((s) => s.quantitativos_chave),
    ...analysis.specialist_quantitativos.quantitativos_candidatos,
  ];
  const quantMap = new Map(currentQuant.map((q) => [q.item, q]));
  for (const q of newQuant) {
    quantMap.set(q.item, q); // última rodada prevalece
  }
  next.quantitativos_candidatos = Array.from(quantMap.values());

  // composicoes_candidatas: substituir pelos da última rodada
  next.composicoes_candidatas = analysis.specialist_composicao.composicoes_candidatas;

  // perguntas_hitl: union sem duplicatas
  const currentPerguntas = Array.isArray(current.perguntas_hitl) ? current.perguntas_hitl : [];
  const newPerguntas = [
    ...analysis.specialist_quantitativos.perguntas_hitl,
    ...analysis.specialist_composicao.perguntas_hitl,
    ...analysis.auditor.perguntas_hitl,
    ...analysis.specialists_phase1.flatMap((s) => s.perguntas_hitl),
  ];
  next.perguntas_hitl = Array.from(new Set([...currentPerguntas, ...newPerguntas]));

  // A atualização do estado monolítico foi desativada em prol do StateManager Incremental.
  // Mantido apenas para compatibilidade de tipagem local.
  return current;
}

export function listOrcamentistaWorkspaces(): OrcamentistaWorkspace[] {
  const root = findOrcamentosRoot();
  const entries = fs.readdirSync(root, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory() && entry.name !== 'Orcamentista_base')
    .map((entry) => ({
      id: entry.name,
      nome: entry.name,
      fullPath: path.join(root, entry.name),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

export function createOrcamentistaWorkspace(input: CreateWorkspaceInput): OrcamentistaWorkspace {
  const nomeObra = input.nomeObra.trim();
  if (!nomeObra) {
    throw new Error('Nome da obra é obrigatório.');
  }

  const cliente = input.cliente?.trim() || '';
  const ano = input.ano || new Date().getFullYear();
  const root = findOrcamentosRoot();
  const basePath = path.join(root, 'Orcamentista_base');

  if (!fs.existsSync(basePath) || !fs.statSync(basePath).isDirectory()) {
    throw new Error('Pasta Orcamentista_base não encontrada.');
  }

  const codigo = nextWorkspaceCode(root, ano);
  const slug = toSlug(nomeObra);
  if (!slug) {
    throw new Error('Não foi possível gerar o nome da pasta da obra.');
  }

  const folderName = `${codigo}_${slug}`;
  const fullPath = path.join(root, folderName);
  if (fs.existsSync(fullPath)) {
    throw new Error('Já existe uma pasta com este nome.');
  }

  copyDirectorySafe(basePath, fullPath);

  const briefingPath = path.join(fullPath, '00_BRIEFING.md');
  const memoryPath = path.join(fullPath, '01_MEMORIA_ORCAMENTO.json');

  if (fs.existsSync(briefingPath)) {
    let briefing = fs.readFileSync(briefingPath, 'utf-8');
    briefing = briefing.replace('ORC-AAAA-000', codigo);
    briefing = briefing.replace('| Nome da obra | |', `| Nome da obra | ${nomeObra} |`);
    if (cliente) {
      briefing = briefing.replace('| Cliente | |', `| Cliente | ${cliente} |`);
    }
    writeUtf8(briefingPath, briefing);
  }

  if (fs.existsSync(memoryPath)) {
    const memory = JSON.parse(fs.readFileSync(memoryPath, 'utf-8')) as Record<string, any>;
    memory.orcamento_id = codigo;
    memory.obra = {
      ...(memory.obra || {}),
      nome: nomeObra,
      cliente,
    };
    writeUtf8(memoryPath, `${JSON.stringify(memory, null, 2)}\n`);
  }

  return {
    id: folderName,
    nome: folderName,
    fullPath,
  };
}

export function listWorkspaceAttachmentFiles(workspaceId: string): WorkspaceAttachmentFile[] {
  const workspacePath = ensureWorkspacePath(workspaceId);
  const attachmentRoot = path.join(workspacePath, 'anexos');
  const files: WorkspaceAttachmentFile[] = [];

  collectWorkspaceFiles(workspacePath, path.join(attachmentRoot, 'projeto'), 'projeto', files);
  collectWorkspaceFiles(workspacePath, path.join(attachmentRoot, 'fornecedores'), 'fornecedores', files);
  collectWorkspaceFiles(workspacePath, path.join(attachmentRoot, 'referencias'), 'referencias', files);

  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath, 'pt-BR'));
}

export function saveAttachmentToWorkspace(
  workspaceId: string,
  categoria: WorkspaceAttachmentCategory,
  fileName: string,
  content: Buffer
): WorkspaceAttachmentFile {
  const workspacePath = ensureWorkspacePath(workspaceId);
  const targetDir = path.join(workspacePath, 'anexos', categoria);
  fs.mkdirSync(targetDir, { recursive: true });

  const safeName = sanitizeFileName(fileName) || `arquivo_${Date.now()}`;
  const extension = path.extname(safeName);
  const baseName = safeName.slice(0, safeName.length - extension.length) || 'arquivo';

  let finalName = safeName;
  let candidatePath = path.join(targetDir, finalName);
  let suffix = 1;

  while (fs.existsSync(candidatePath)) {
    finalName = `${baseName}_${suffix}${extension}`;
    candidatePath = path.join(targetDir, finalName);
    suffix += 1;
  }

  fs.writeFileSync(candidatePath, content);

  const stats = fs.statSync(candidatePath);
  return {
    categoria,
    nome: finalName,
    relativePath: path.relative(workspacePath, candidatePath).replace(/\\/g, '/'),
    mimeType: guessMimeType(finalName),
    tamanhoBytes: stats.size,
    atualizadoEm: stats.mtime.toISOString(),
  };
}

export function loadWorkspaceAttachmentsForRuntime(
  workspaceId: string,
  options?: {
    maxFiles?: number;
    maxPerFileBytes?: number;
    maxTotalBytes?: number;
    categorias?: WorkspaceAttachmentCategory[];
  }
): WorkspaceRuntimeAttachmentLoadResult {
  const workspacePath = ensureWorkspacePath(workspaceId);
  const maxFiles = options?.maxFiles ?? Number(process.env.ORCAMENTISTA_RUNTIME_MAX_FILES || 12);
  const maxPerFileBytes =
    options?.maxPerFileBytes ?? Number(process.env.ORCAMENTISTA_RUNTIME_MAX_FILE_BYTES || 15 * 1024 * 1024);
  const maxTotalBytes =
    options?.maxTotalBytes ?? Number(process.env.ORCAMENTISTA_RUNTIME_MAX_TOTAL_BYTES || 45 * 1024 * 1024);
  const categorias = options?.categorias ?? ['projeto', 'referencias', 'fornecedores'];
  const supportedMimeTypes = new Set([
    'application/json',
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain',
    'text/markdown',
    'text/csv',
  ]);

  const categoryOrder: Record<WorkspaceAttachmentCategory, number> = {
    projeto: 0,
    referencias: 1,
    fornecedores: 2,
  };

  const files = listWorkspaceAttachmentFiles(workspaceId)
    .filter((file) => categorias.includes(file.categoria))
    .sort((a, b) => {
      const categoryDiff = categoryOrder[a.categoria] - categoryOrder[b.categoria];
      if (categoryDiff !== 0) return categoryDiff;
      return a.relativePath.localeCompare(b.relativePath, 'pt-BR');
    });

  const attachments: OrcamentistaAttachment[] = [];
  const skipped: Array<{ relativePath: string; reason: string }> = [];
  let totalBytes = 0;

  for (const file of files) {
    if (!supportedMimeTypes.has(file.mimeType)) {
      skipped.push({ relativePath: file.relativePath, reason: `tipo não suportado (${file.mimeType})` });
      continue;
    }

    if (attachments.length >= maxFiles) {
      skipped.push({ relativePath: file.relativePath, reason: `limite de ${maxFiles} arquivos por rodada` });
      continue;
    }

    if (file.tamanhoBytes > maxPerFileBytes) {
      skipped.push({
        relativePath: file.relativePath,
        reason: `arquivo acima do limite individual de ${Math.round(maxPerFileBytes / (1024 * 1024))} MB`,
      });
      continue;
    }

    if (totalBytes + file.tamanhoBytes > maxTotalBytes) {
      skipped.push({
        relativePath: file.relativePath,
        reason: `orçamento de leitura acima de ${Math.round(maxTotalBytes / (1024 * 1024))} MB nesta rodada`,
      });
      continue;
    }

    const absolutePath = path.join(workspacePath, file.relativePath);
    const buffer = fs.readFileSync(absolutePath);

    attachments.push({
      nome: file.nome,
      mimeType: file.mimeType,
      base64: buffer.toString('base64'),
      tamanhoBytes: file.tamanhoBytes,
      relativePath: file.relativePath,
      categoria: file.categoria,
      origem: 'workspace',
    } as OrcamentistaAttachment);
    totalBytes += file.tamanhoBytes;
  }

  return { attachments, skipped, totalBytes };
}

export function persistInitialAnalysisToWorkspace(
  workspaceId: string,
  analysis: MultiAgentAnalysis,
  anexos: OrcamentistaAttachment[]
): { workspacePath: string } {
  const workspacePath = ensureWorkspacePath(workspaceId);
  const briefingPath = path.join(workspacePath, '00_BRIEFING.md');
  const analysisPath = path.join(workspacePath, '02_ANALISE_PROJETO.md');
  const memoryPath = path.join(workspacePath, '01_MEMORIA_ORCAMENTO.json');

  if (isIncrementalMultiAgentAnalysis(analysis)) {
    if (fs.existsSync(briefingPath)) {
      const current = fs.readFileSync(briefingPath, 'utf-8');
      const next = upsertAutoSection(
        current,
        'Registro Automatico da Analise Multiagente',
        [summarizeIncrementalAnalysis(analysis), '', '### Inventario encontrado nesta rodada', attachmentsTable(anexos)].join('\n')
      );
      fs.writeFileSync(briefingPath, next, 'utf-8');
    }

    if (fs.existsSync(analysisPath)) {
      const current = fs.readFileSync(analysisPath, 'utf-8');
      const next = upsertAutoSection(
        current,
        'Leitura Multiagente Validada',
        validatedIncrementalAnalysisSection(analysis)
      );
      fs.writeFileSync(analysisPath, next, 'utf-8');
    }

    if (fs.existsSync(memoryPath)) {
      const raw = fs.readFileSync(memoryPath, 'utf-8');
      const parsed = JSON.parse(raw) as OrcamentoMemory;
      const merged = mergeIncrementalMemoryJson(parsed, analysis, anexos);
      fs.writeFileSync(memoryPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf-8');
    }

    return { workspacePath };
  }

  if (fs.existsSync(briefingPath)) {
    const current = fs.readFileSync(briefingPath, 'utf-8');
    const next = upsertAutoSection(
      current,
      'Registro Automatico da Analise Multiagente',
      [analysisSummary(analysis), '', '### Inventario encontrado nesta rodada', attachmentsTable(anexos)].join('\n')
    );
    fs.writeFileSync(briefingPath, next, 'utf-8');
  }

  if (fs.existsSync(analysisPath)) {
    const current = fs.readFileSync(analysisPath, 'utf-8');
    const next = upsertAutoSection(
      current,
      'Leitura Multiagente Validada',
      validatedAnalysisSection(analysis)
    );
    fs.writeFileSync(analysisPath, next, 'utf-8');
  }

  if (fs.existsSync(memoryPath)) {
    const raw = fs.readFileSync(memoryPath, 'utf-8');
    const parsed = JSON.parse(raw) as OrcamentoMemory;
    const merged = mergeMemoryJson(parsed, analysis, anexos);
    fs.writeFileSync(memoryPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf-8');
  }

  return { workspacePath };
}

export function persistConsolidatedAnalysisToWorkspace(
  workspaceId: string,
  analysis: MultiAgentAnalysis,
  anexos: OrcamentistaAttachment[]
): { workspacePath: string; orcamentoPreliminarPath: string } {
  const workspacePath = ensureWorkspacePath(workspaceId);
  const orcamentoPreliminarPath = path.join(workspacePath, '03_ORCAMENTO_PRELIMINAR.md');
  const memoryPath = path.join(workspacePath, '01_MEMORIA_ORCAMENTO.json');

  if (isIncrementalMultiAgentAnalysis(analysis)) {
    writeUtf8(orcamentoPreliminarPath, buildIncrementalOrcamentoPreliminarMd(analysis));

    if (fs.existsSync(memoryPath)) {
      const raw = fs.readFileSync(memoryPath, 'utf-8');
      const parsed = JSON.parse(raw) as OrcamentoMemory;
      const merged = mergeIncrementalMemoryJson(parsed, analysis, anexos);
      writeUtf8(memoryPath, `${JSON.stringify(merged, null, 2)}\n`);
    }

    return { workspacePath, orcamentoPreliminarPath };
  }

  // 1. Upsert do 03_ORCAMENTO_PRELIMINAR.md
  const existingPreliminar = fs.existsSync(orcamentoPreliminarPath)
    ? fs.readFileSync(orcamentoPreliminarPath, 'utf-8')
    : '';
  const nextPreliminar = upsertOrcamentoPreliminar(existingPreliminar, analysis);
  writeUtf8(orcamentoPreliminarPath, nextPreliminar);

  // 2. Enriquecer 01_MEMORIA_ORCAMENTO.json com blocos consolidados
  if (fs.existsSync(memoryPath)) {
    const raw = fs.readFileSync(memoryPath, 'utf-8');
    const parsed = JSON.parse(raw) as OrcamentoMemory;
    // Primeiro aplica o merge básico (compatibilidade)
    const basemerged = mergeMemoryJson(parsed, analysis, anexos);
    // Depois enriquece com os novos blocos consolidados
    const consolidated = mergeMemoryJsonConsolidado(basemerged, analysis);
    writeUtf8(memoryPath, `${JSON.stringify(consolidated, null, 2)}\n`);
  }

  return { workspacePath, orcamentoPreliminarPath };
}
