import express, { Router, Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buscarReferencias } from '../lib/referenciasSearch';
import { getServerEnv } from '../lib/serverEnv';
import {
  ETAPA0_EXTRACTION_INSTRUCTION,
  ETAPA0_RESPONSE_SCHEMA,
  formatEtapa0Markdown,
  validateEtapa0,
} from '../orcamentista/etapa0';
import { syncWorkspaceAttachmentsToGcs } from '../orcamentista/gcsWorkspaceSync';
import { runMultiAgentProjectAnalysis } from '../orcamentista/multiagent';
import { VertexDocumentRuntimeProvider } from '../orcamentista/providers/VertexDocumentRuntimeProvider';
import { StateManager } from '../orcamentista/stateManager';
import {
  createOrcamentistaWorkspace,
  loadWorkspaceAttachmentsForRuntime,
  listWorkspaceAttachmentFiles,
  listOrcamentistaWorkspaces,
  persistInitialAnalysisToWorkspace,
  persistConsolidatedAnalysisToWorkspace,
  saveAttachmentToWorkspace,
  saveChatHistoryToWorkspace,
  loadChatHistoryFromWorkspace,
} from '../orcamentista/workspaces';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// ─── Carrega TODAS as Skills + Docs do Orquestrador ───────────────────────────
function carregarSystemPrompt(): string {
  const base = path.resolve(__dirname, '../../../domains/orcamentista/logic');

  // Ordem importa: orquestrador primeiro, depois as skills especializadas, depois os docs
  const arquivos = [
    // 1. Orquestrador Mestre (define fluxo e HITL)
    path.join(base, 'SKILL_ORQUESTRADOR.md'),
    // 2. Skills especialistas (exatamente como planejado)
    path.join(base, 'skills/SKILL_LEITURA_PROJETO.md'),
    path.join(base, 'skills/SKILL_QUANTITATIVOS.md'),
    path.join(base, 'skills/SKILL_COMPOSICAO_CUSTOS.md'),
    path.join(base, 'skills/SKILL_BDI_ENCARGOS.md'),
    path.join(base, 'skills/SKILL_CRONOGRAMA.md'),
    path.join(base, 'skills/SKILL_JSON_EXPORT.md'),
    // 3. Regras de negócio e schema
    path.join(base, 'docs/REGRAS_DE_NEGOCIO.md'),
    path.join(base, 'docs/SCHEMA_JSON_EVIS.md'),
    path.join(base, 'docs/ESPECIFICACAO_CODIGO_SERVICO.md'),
    // 4. Padrões técnicos EVIS (SINAPI, HITL, BDI, encargos)
    path.resolve(__dirname, '../../docs/EVIS_RULES.md'),
  ];

  const partes: string[] = [];
  for (const arq of arquivos) {
    try {
      const conteudo = fs.readFileSync(arq, 'utf-8');
      const nome = path.basename(arq);
      partes.push(`\n\n${'='.repeat(80)}\n# ${nome}\n${'='.repeat(80)}\n\n${conteudo}`);
      console.log(`[Orçamentista] ✅ Skill carregada: ${nome} (${Math.round(conteudo.length / 1024)}KB)`);
    } catch {
      console.warn(`[Orçamentista] ⚠️  Arquivo não encontrado: ${arq}`);
    }
  }

  const total = partes.join('');
  console.log(`[Orçamentista] System prompt total: ${Math.round(total.length / 1024)}KB (${arquivos.length} arquivos)`);
  return total.trim();
}

const SYSTEM_PROMPT = carregarSystemPrompt();

function construirSystemInstruction(contextoMultiagente: string): string {
  return [
    SYSTEM_PROMPT,
    contextoMultiagente
      ? [
          '',
          '='.repeat(80),
          '# CONTEXTO MULTIAGENTE AUDITADO',
          '='.repeat(80),
          '',
          'Use o relatório multiagente abaixo como contexto prioritário para leitura do projeto.',
          'Se houver conflito ou lacuna, trate como pendência a validar pelo usuário.',
          '',
          contextoMultiagente,
        ].join('\n')
      : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function isGeminiQuotaError(err: unknown): boolean {
  const message = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    message.includes('resource_exhausted') ||
    message.includes('quota exceeded') ||
    message.includes('current quota') ||
    message.includes('"code":429')
  );
}

function isGeminiAuthError(err: unknown): boolean {
  const message = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    message.includes('api_key_invalid') ||
    message.includes('api key expired') ||
    message.includes('api key not valid') ||
    message.includes('authentication') ||
    message.includes('unauthenticated')
  );
}

function isWorkspaceInventoryIntent(text: string): boolean {
  const normalized = text.toLowerCase();
  const mentionsFiles = /(arquivo|arquivos|anexo|anexos|pasta|pastas|inventario|inventário)/.test(normalized);
  const mentionsLookup = /(buscar|busque|listar|liste|inspecionar|inspecione|vasculhar|vasculhe|procurar|procure|mapear|mapa|verificar|verifique)/.test(normalized);
  return mentionsFiles && mentionsLookup;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildWorkspaceInventoryReply(workspaceId: string): string {
  const files = listWorkspaceAttachmentFiles(workspaceId);

  if (!files.length) {
    return [
      '## Inventário local do workspace',
      '',
      '| Categoria | Arquivos encontrados |',
      '| --- | ---: |',
      '| Projeto | 0 |',
      '| Fornecedores | 0 |',
      '| Referências | 0 |',
      '',
      'Não encontrei arquivos dentro de `anexos/projeto`, `anexos/fornecedores` ou `anexos/referencias` deste workspace.',
      'Se quiser, posso seguir preenchendo o briefing inicial apenas com a descrição textual da obra.',
    ].join('\n');
  }

  const contagem = {
    projeto: files.filter((file) => file.categoria === 'projeto').length,
    fornecedores: files.filter((file) => file.categoria === 'fornecedores').length,
    referencias: files.filter((file) => file.categoria === 'referencias').length,
  };

  const rows = files
    .map(
      (file) =>
        `| \`${file.relativePath}\` | ${file.categoria} | ${file.mimeType} | ${formatFileSize(file.tamanhoBytes)} |`
    )
    .join('\n');

  return [
    '## Inventário local do workspace',
    '',
    '| Categoria | Arquivos encontrados |',
    '| --- | ---: |',
    `| Projeto | ${contagem.projeto} |`,
    `| Fornecedores | ${contagem.fornecedores} |`,
    `| Referências | ${contagem.referencias} |`,
    '',
    '### Arquivos localizados',
    '',
    '| Arquivo | Categoria | Tipo | Tamanho |',
    '| --- | --- | --- | ---: |',
    rows,
    '',
    'Encontrei o material local do orçamento e já podemos iniciar pela Etapa 0.',
    'Para leitura técnica profunda de PDF e imagem, a rota multimodal da Gemini precisa estar disponível; enquanto isso, conseguimos seguir com inventário, briefing e validação inicial.',
  ].join('\n');
}

function normalizeOpenRouterText(content: unknown): string {
  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((chunk) => {
        if (typeof chunk === 'string') return chunk;
        if (chunk && typeof chunk === 'object' && 'text' in chunk && typeof chunk.text === 'string') {
          return chunk.text;
        }
        return '';
      })
      .join('\n')
      .trim();
  }

  return '';
}

function buildOpenRouterMessages(
  systemInstruction: string,
  historico: Array<{ role: 'user' | 'model'; parts: Array<{ text?: string }> }>
) {
  const messages: Array<Record<string, unknown>> = [
    {
      role: 'system',
      content: systemInstruction,
    },
  ];

  for (const item of historico) {
    const content = item.parts
      .map((part) => (typeof part.text === 'string' ? part.text : ''))
      .join('\n')
      .trim();

    if (!content) {
      continue;
    }

    messages.push({
      role: item.role === 'model' ? 'assistant' : 'user',
      content,
    });
  }

  return messages;
}

async function gerarRespostaOpenRouter(params: {
  systemInstruction: string;
  historico: Array<{ role: 'user' | 'model'; parts: Array<{ text?: string }> }>;
}): Promise<string> {
  const apiKey = getServerEnv('OPENROUTER_API_KEY', ['VITE_OPENROUTER_API_KEY']);
  if (!apiKey) {
    throw new Error('Fallback OpenRouter não configurado.');
  }

  const model = getServerEnv('ORCAMENTISTA_OPENROUTER_MODEL') || 'openai/gpt-4o-mini';
  const messages = buildOpenRouterMessages(params.systemInstruction, params.historico);
  const openRouterTools = [
    {
      type: 'function',
      function: {
        name: 'buscar_referencias_custo',
        description:
          'Busca referências de custo para um serviço de construção no banco de dados local. Prioriza o Catálogo Residencial EVIS e usa o SINAPI como fallback. Use esta tool ANTES de apresentar qualquer valor de custo ao usuário.',
        parameters: {
          type: 'object',
          properties: {
            termo: {
              type: 'string',
              description: 'Descrição do serviço a buscar (ex: "reboco traçado", "porcelanato 60x60", "alvenaria blocos")',
            },
            limite: {
              type: 'number',
              description: 'Número máximo de resultados (padrão: 5)',
            },
          },
          required: ['termo'],
        },
      },
    },
  ];

  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'EVIS Orçamentista',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 1400,
        tools: openRouterTools,
        tool_choice: 'auto',
      }),
    });

    const data = await response.json().catch(() => null) as {
      choices?: Array<{
        message?: {
          content?: unknown;
          reasoning?: string;
          tool_calls?: Array<{
            id: string;
            type: string;
            function?: {
              name?: string;
              arguments?: string;
            };
          }>;
        };
      }>;
      error?: { message?: string } | string;
    } | null;

    if (!response.ok) {
      const message =
        typeof data?.error === 'string'
          ? data.error
          : data?.error?.message || `Fallback OpenRouter falhou (${response.status}).`;
      throw new Error(message);
    }

    const message = data?.choices?.[0]?.message;
    if (!message) {
      throw new Error('Fallback OpenRouter retornou resposta vazia.');
    }

    if (Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
      messages.push({
        role: 'assistant',
        content: normalizeOpenRouterText(message.content),
        tool_calls: message.tool_calls,
      });

      for (const toolCall of message.tool_calls) {
        const functionName = toolCall.function?.name;
        if (!functionName) {
          continue;
        }

        let parsedArgs: Record<string, unknown> = {};
        try {
          parsedArgs = toolCall.function?.arguments ? JSON.parse(toolCall.function.arguments) : {};
        } catch {
          parsedArgs = {};
        }

        const result = await executarTool(functionName, parsedArgs);
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: result,
        });
      }

      continue;
    }

    const content = normalizeOpenRouterText(message.content);
    if (content) {
      return content;
    }

    const reasoning = typeof message.reasoning === 'string' ? message.reasoning.trim() : '';
    if (reasoning) {
      return reasoning.split(/\n+/).slice(-1)[0].trim() || reasoning;
    }

    throw new Error('Fallback OpenRouter retornou conteúdo vazio.');
  }

  throw new Error('Fallback OpenRouter excedeu o limite de tentativas.');
}

function isTextAttachment(anexo: Anexo): boolean {
  return (
    anexo.mimeType === 'text/plain' ||
    anexo.mimeType === 'text/markdown' ||
    anexo.mimeType === 'text/csv' ||
    anexo.mimeType === 'application/json'
  );
}

// ─── Definição das Tools (Function Calling) ────────────────────────────────────
const tools = [
  {
    functionDeclarations: [
      {
        name: 'buscar_referencias_custo',
        description:
          'Busca referências de custo para um serviço de construção no banco de dados local. Prioriza o Catálogo Residencial EVIS e usa o SINAPI como fallback. Use esta tool ANTES de apresentar qualquer valor de custo ao usuário.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            termo: {
              type: Type.STRING,
              description: 'Descrição do serviço a buscar (ex: "reboco traçado", "porcelanato 60x60", "alvenaria blocos")',
            },
            limite: {
              type: Type.NUMBER,
              description: 'Número máximo de resultados (padrão: 5)',
            },
          },
          required: ['termo'],
        },
      },
    ],
  },
];

// ─── Gerenciamento de Sessões em memória ─────────────────────────────────────
interface Sessao {
  historico: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
  etapaAtual: number;
  criadoEm: number;
  ultimaAnaliseMultiagente?: any;
  workspaceId?: string;
}

const sessoes = new Map<string, Sessao>();

function obterOuCriarSessao(sessionId: string, workspaceId?: string): Sessao {
  if (!sessoes.has(sessionId)) {
    const historicoCarregado = workspaceId ? loadChatHistoryFromWorkspace(workspaceId) : [];
    sessoes.set(sessionId, {
      historico: historicoCarregado,
      etapaAtual: 0,
      criadoEm: Date.now(),
      workspaceId,
    });
  } else if (workspaceId && sessoes.get(sessionId)?.workspaceId !== workspaceId) {
    // Se trocou de workspace, recarrega o histórico
    const s = sessoes.get(sessionId)!;
    s.workspaceId = workspaceId;
    s.historico = loadChatHistoryFromWorkspace(workspaceId);
  }
  return sessoes.get(sessionId)!;
}

// Limpa sessões com mais de 4 horas
setInterval(() => {
  const limite = Date.now() - 4 * 60 * 60 * 1000;
  for (const [id, sessao] of sessoes.entries()) {
    if (sessao.criadoEm < limite) {
      sessoes.delete(id);
    }
  }
}, 30 * 60 * 1000);

// ─── Executar uma Tool Call ────────────────────────────────────────────────────
async function executarTool(nome: string, args: Record<string, unknown>): Promise<string> {
  if (nome === 'buscar_referencias_custo') {
    const termo = String(args.termo || '');
    const limite = typeof args.limite === 'number' ? args.limite : 5;

    if (!termo.trim()) {
      return JSON.stringify({ erro: 'Termo de busca não informado.' });
    }

    try {
      const resultado = await buscarReferencias(termo, limite);
      return JSON.stringify(resultado, null, 2);
    } catch (err) {
      console.error('[Tool] Erro ao buscar referências:', err);
      return JSON.stringify({
        erro: 'Falha na consulta ao banco de dados.',
        detalhes: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return JSON.stringify({ erro: `Tool desconhecida: ${nome}` });
}

// ─── Tipos compartilhados ──────────────────────────────────────────────────────
interface Anexo {
  nome: string;
  mimeType: string;
  base64?: string;
  relativePath?: string;
  origem?: 'workspace' | 'inline';
}

type RuntimeAttachmentResolution = {
  attachments: Anexo[];
  hasMultimodalAttachments: boolean;
  source: 'inline' | 'workspace' | 'none';
  skipped: Array<{ relativePath: string; reason: string }>;
};

function buildAttachmentLabel(anexo: Anexo): string {
  return anexo.relativePath || anexo.nome;
}

function buildUserPartsFromAttachments(anexos: Anexo[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const partes: any[] = [];

  for (const anexo of anexos) {
    if (!anexo.base64) {
      continue;
    }

    const label = buildAttachmentLabel(anexo);
    if (isTextAttachment(anexo)) {
      const texto = Buffer.from(anexo.base64, 'base64').toString('utf-8');
      partes.push({ text: `\n\n--- ARQUIVO: ${label} ---\n${texto}\n--- FIM ---` });
    } else {
      partes.push({ inlineData: { mimeType: anexo.mimeType, data: anexo.base64 } });
      partes.push({ text: `[Arquivo: ${label} (${anexo.mimeType})]` });
    }
  }

  return partes;
}

function resolveRuntimeAttachments(params: {
  anexos?: Anexo[];
  workspaceId?: string;
  usarWorkspaceAttachments?: boolean;
}): RuntimeAttachmentResolution {
  const inlineAttachments = (params.anexos || []).filter((anexo) => typeof anexo.base64 === 'string' && anexo.base64);
  if (inlineAttachments.length > 0) {
    return {
      attachments: inlineAttachments,
      hasMultimodalAttachments: inlineAttachments.some((anexo) => !isTextAttachment(anexo)),
      source: 'inline',
      skipped: [],
    };
  }

  if (params.workspaceId && params.usarWorkspaceAttachments) {
    const loaded = loadWorkspaceAttachmentsForRuntime(params.workspaceId);
    return {
      attachments: loaded.attachments as Anexo[],
      hasMultimodalAttachments: loaded.attachments.some((anexo) => !isTextAttachment(anexo as Anexo)),
      source: loaded.attachments.length ? 'workspace' : 'none',
      skipped: loaded.skipped,
    };
  }

  return {
    attachments: [],
    hasMultimodalAttachments: false,
    source: 'none',
    skipped: [],
  };
}

// ─── POST /api/orcamentista/chat/stream (SSE) ──────────────────────────────────
router.post('/chat/stream', async (req: Request, res: Response) => {
  const {
    mensagem,
    sessionId,
    anexos,
    workspaceId: reqWorkspaceId,
    usarWorkspaceAttachments,
  } = req.body as {
    mensagem: string;
    sessionId: string;
    anexos?: Anexo[];
    workspaceId?: string;
    usarWorkspaceAttachments?: boolean;
  };

  if (!mensagem?.trim() || !sessionId) {
    return res.status(400).json({ erro: 'Campos "mensagem" e "sessionId" são obrigatórios.' });
  }

  // ── SSE headers ────────────────────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendEvent = (data: object) => {
    if (!res.writableEnded) res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const geminiApiKey = getServerEnv('GEMINI_API_KEY', ['VITE_GEMINI_API_KEY']);
    const geminiModel =
      getServerEnv('ORCAMENTISTA_CHAT_MODEL') ||
      getServerEnv('ORCAMENTISTA_MULTIAGENT_MODEL') ||
      'gemini-2.5-flash';

    if (!geminiApiKey) {
      sendEvent({ type: 'error', message: 'GEMINI_API_KEY não configurada no ambiente.' });
      return res.end();
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const sessao = obterOuCriarSessao(sessionId);
    if (reqWorkspaceId?.trim()) sessao.workspaceId = reqWorkspaceId.trim();

    const shouldUseWorkspaceAttachments =
      Boolean(usarWorkspaceAttachments) ||
      (Boolean(sessao.workspaceId) && (!anexos?.length || !(anexos || []).some((anexo) => anexo.base64)));

    const runtimeAttachments = resolveRuntimeAttachments({
      anexos,
      workspaceId: sessao.workspaceId,
      usarWorkspaceAttachments: shouldUseWorkspaceAttachments,
    });

    if (runtimeAttachments.source === 'workspace') {
      sendEvent({
        type: 'multiagente_progress',
        message: `Carregando ${runtimeAttachments.attachments.length} arquivo(s) diretamente do workspace...`,
      });
      if (runtimeAttachments.skipped.length) {
        sendEvent({
          type: 'multiagente_progress',
          message: `${runtimeAttachments.skipped.length} arquivo(s) ficaram fora desta rodada por limite de leitura.`,
        });
      }
    }

    // ── Montar partes do usuário ──────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const partesUsuario: any[] = [{ text: mensagem }];
    const attachmentsForRound = runtimeAttachments.attachments;
    const hasMultimodalAttachments = runtimeAttachments.hasMultimodalAttachments;
    partesUsuario.push(...buildUserPartsFromAttachments(attachmentsForRound));

    sessao.historico.push({
      role: 'user',
      parts: [{ text: mensagem + (attachmentsForRound.length ? ` [+${attachmentsForRound.length} arquivo(s)]` : '') }],
    });

    // ── Multiagente (blocking antes do stream) ────────────────────────────────
    let contextoMultiagente = '';
    if (attachmentsForRound.length && hasMultimodalAttachments) {
      sendEvent({ type: 'multiagente_progress', message: 'Iniciando análise multiagente auditada...' });
      try {
        const analise = await runMultiAgentProjectAnalysis({ 
          mensagem, 
          anexos: attachmentsForRound,
          workspaceId: sessao.workspaceId || '',
          onProgress: (msg) => sendEvent({ type: 'multiagente_progress', message: msg })
        });
        sessao.ultimaAnaliseMultiagente = analise;
        contextoMultiagente = `Status: ${analise.status}. Score Consistência: ${analise.scoreConsistencia}`;
        if (sessao.workspaceId) {
          try {
            persistInitialAnalysisToWorkspace(sessao.workspaceId, analise, attachmentsForRound);
            persistConsolidatedAnalysisToWorkspace(sessao.workspaceId, analise, attachmentsForRound);
            sendEvent({ type: 'multiagente_progress', message: 'Persistindo análise e pré-orçamento no workspace...' });
          } catch (persistError) {
            console.warn('[Stream] Persistência multiagente falhou:', persistError);
            sendEvent({
              type: 'multiagente_warning',
              message: 'A análise técnica terminou, mas falhou ao salvar todos os artefatos no workspace.',
            });
          }
        }
        sendEvent({
          type: 'multiagente_done',
          disciplinaPiloto: 'Engenharia Híbrida',
          score: analise.scoreConsistencia,
        });
      } catch (err) {
        console.warn('[Stream] Multiagente falhou:', err);
        sendEvent({ type: 'multiagente_warning', message: 'Análise multiagente falhou; seguindo com chat único.' });
      }
    } else if (sessao.ultimaAnaliseMultiagente) {
      contextoMultiagente = `Status: ${sessao.ultimaAnaliseMultiagente.status}. Score Consistência: ${sessao.ultimaAnaliseMultiagente.scoreConsistencia}`;
    }

    const systemInstruction = construirSystemInstruction(contextoMultiagente);
    const historicoCopia = [
      ...sessao.historico.slice(0, -1),
      { role: 'user' as const, parts: partesUsuario },
    ];

    // ── Loop com streaming + function calling ─────────────────────────────────
    let respostaFinal = '';
    let tentativas = 0;
    const MAX_TENTATIVAS = 5;

    while (tentativas < MAX_TENTATIVAS) {
      tentativas++;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const streamResp = await (ai.models as any).generateContentStream({
        model: geminiModel,
        config: { systemInstruction, tools: tools as any, temperature: 0.3 },
        contents: historicoCopia as any,
      });

      let accText = '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fcParts: any[] = [];
      let hasFc = false;

      for await (const chunk of streamResp) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parts: any[] = chunk.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (typeof part.text === 'string' && part.text) {
            accText += part.text;
            sendEvent({ type: 'token', text: part.text });
          }
          if (part.functionCall) { hasFc = true; fcParts.push(part); }
        }
      }

      if (!hasFc) { respostaFinal = accText; break; }

      // Processar function calls e iterar
      historicoCopia.push({
        role: 'model' as const,
        parts: [...(accText ? [{ text: accText }] : []), ...fcParts] as Array<{ text: string }>,
      });
      const toolResults = [];
      for (const part of fcParts) {
        const { name, args } = part.functionCall as { name: string; args: Record<string, unknown> };
        const resultado = await executarTool(name, args || {});
        toolResults.push({ functionResponse: { name, response: { output: resultado } } });
      }
      historicoCopia.push({ role: 'user' as const, parts: toolResults as any[] });
    }

    if (!respostaFinal) {
      respostaFinal = 'Não consegui gerar uma resposta. Tente novamente.';
      sendEvent({ type: 'token', text: respostaFinal });
    }

    sessao.historico.push({ role: 'model', parts: [{ text: respostaFinal }] });

    // Salva histórico no workspace se disponível
    if (sessao.workspaceId) {
      saveChatHistoryToWorkspace(sessao.workspaceId, sessao.historico);
    }

    sendEvent({
      type: 'done',
      etapaAtual: sessao.etapaAtual,
      multiagente: sessao.ultimaAnaliseMultiagente
        ? {
            ativo: true,
            disciplinaPiloto: 'Engenharia Híbrida',
            scoreConsistencia: sessao.ultimaAnaliseMultiagente.scoreConsistencia || 0,
            statusAuditoria: sessao.ultimaAnaliseMultiagente.status || 'OK',
            source: runtimeAttachments.source,
          }
        : { ativo: false },
      workspace: sessao.workspaceId ? { id: sessao.workspaceId } : null,
    });

    res.end();
  } catch (err) {
    console.error('[Stream] Erro:', err);
    sendEvent({ type: 'error', message: err instanceof Error ? err.message : 'Erro desconhecido.' });
    if (!res.writableEnded) res.end();
  }
});

// ─── POST /api/orcamentista/chat ───────────────────────────────────────────────


router.post('/chat', async (req: Request, res: Response) => {
  const { mensagem, sessionId, anexos, usarWorkspaceAttachments } = req.body as {
    mensagem: string;
    sessionId: string;
    anexos?: Anexo[];
    workspaceId?: string;
    usarWorkspaceAttachments?: boolean;
  };

  if (!mensagem?.trim() || !sessionId) {
    return res.status(400).json({ erro: 'Campos "mensagem" e "sessionId" são obrigatórios.' });
  }

  const geminiApiKey = getServerEnv('GEMINI_API_KEY', ['VITE_GEMINI_API_KEY']);
  const openRouterApiKey = getServerEnv('OPENROUTER_API_KEY', ['VITE_OPENROUTER_API_KEY']);
  const geminiModel = getServerEnv('ORCAMENTISTA_CHAT_MODEL') ||
    getServerEnv('ORCAMENTISTA_MULTIAGENT_MODEL') ||
    'gemini-2.5-flash';

  const sessao = obterOuCriarSessao(sessionId);
  if (typeof req.body.workspaceId === 'string' && req.body.workspaceId.trim()) {
    sessao.workspaceId = req.body.workspaceId.trim();
  }

  // ── Montar as partes da mensagem do usuário ─────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const partesUsuario: any[] = [{ text: mensagem }];
  const shouldUseWorkspaceAttachments =
    Boolean(usarWorkspaceAttachments) ||
    (Boolean(sessao.workspaceId) && (!anexos?.length || !(anexos || []).some((anexo) => anexo.base64)));
  const runtimeAttachments = resolveRuntimeAttachments({
    anexos,
    workspaceId: sessao.workspaceId,
    usarWorkspaceAttachments: shouldUseWorkspaceAttachments,
  });
  const hasMultimodalAttachments = runtimeAttachments.hasMultimodalAttachments;
  partesUsuario.push(...buildUserPartsFromAttachments(runtimeAttachments.attachments));

  // Adiciona mensagem do usuário ao histórico (somente texto, para não estourar memória)
  sessao.historico.push({
    role: 'user',
    parts: [{ text: mensagem + (runtimeAttachments.attachments.length ? ` [+${runtimeAttachments.attachments.length} arquivo(s)]` : '') }],
  });

  if (!anexos?.length && sessao.workspaceId && isWorkspaceInventoryIntent(mensagem)) {
    try {
      const respostaInventario = buildWorkspaceInventoryReply(sessao.workspaceId);
      sessao.historico.push({ role: 'model', parts: [{ text: respostaInventario }] });

      return res.json({
        resposta: respostaInventario,
        etapaAtual: sessao.etapaAtual,
        totalMensagens: sessao.historico.length,
        multiagente: sessao.ultimaAnaliseMultiagente
          ? {
              ativo: true,
              disciplinaPiloto: 'Engenharia Híbrida',
              scoreConsistencia: sessao.ultimaAnaliseMultiagente.scoreConsistencia || 0,
              statusAuditoria: sessao.ultimaAnaliseMultiagente.status || 'OK',
              auditorProvider: 'evis',
              auditorModel: geminiModel,
              auditorEscalated: false,
            }
          : { ativo: false },
        workspace: sessao.workspaceId ? { id: sessao.workspaceId } : null,
      });
    } catch (inventoryError) {
      console.warn('[Orçamentista] ⚠️ Falha ao montar inventário local do workspace.', inventoryError);
    }
  }

  if (!geminiApiKey && !openRouterApiKey) {
    return res.status(500).json({
      erro: 'Nenhuma IA configurada no ambiente.',
      detalhes: 'Configure GEMINI_API_KEY ou OPENROUTER_API_KEY para usar o chat do Orçamentista.',
    });
  }

  try {
    const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;
    let contextoMultiagente = '';

    if (runtimeAttachments.attachments.length > 0 && ai) {
      try {
        const analise = await runMultiAgentProjectAnalysis({
          mensagem,
          anexos: runtimeAttachments.attachments,
          workspaceId: sessao.workspaceId || '',
          onProgress: (msg) => console.log(msg)
        });

        sessao.ultimaAnaliseMultiagente = analise;
        contextoMultiagente = `Status: ${analise.status}. Score Consistência: ${analise.scoreConsistencia}`;
        console.log(
          `[Orçamentista] ✅ Análise multiagente gerada (Score ${analise.scoreConsistencia})`
        );

        if (sessao.workspaceId) {
          persistInitialAnalysisToWorkspace(sessao.workspaceId, analise, runtimeAttachments.attachments);
          persistConsolidatedAnalysisToWorkspace(sessao.workspaceId, analise, runtimeAttachments.attachments);
          console.log(`[Orçamentista] 💾 Workspace atualizado com análise e orçamento preliminar.`);
        }

      } catch (multiAgentError) {
        console.warn(
          '[Orçamentista] ⚠️ Falha na análise multiagente; seguindo com fallback do chat único.',
          multiAgentError
        );
      }
    } else if (runtimeAttachments.attachments.length > 0 && !ai && hasMultimodalAttachments) {
      throw new Error(
        'Leitura multimodal indisponível: a chave Gemini não está configurada no ambiente para analisar PDF e imagem.'
      );
    } else if (sessao.ultimaAnaliseMultiagente) {
      contextoMultiagente = sessao.ultimaAnaliseMultiagente.markdown;
    }

    // Loop de agentic execution com suporte a function calling
    let respostaFinal = '';
    let tentativas = 0;
    const MAX_TENTATIVAS = 5;

    // Histórico sem os anexos (não replicar binários em todo o histórico)
    // Os anexos são enviados UMA VEZ na primeira mensagem desta rodada
    const historicoCopia = [
      ...sessao.historico.slice(0, -1), // tudo exceto a última mensagem que acabamos de adicionar
      { role: 'user' as const, parts: partesUsuario },
    ];
    const systemInstruction = construirSystemInstruction(contextoMultiagente);

    if (!ai) {
      respostaFinal = await gerarRespostaOpenRouter({
        systemInstruction,
        historico: historicoCopia,
      });
    } else {
      while (tentativas < MAX_TENTATIVAS) {
        tentativas++;

        try {
          const response = await ai.models.generateContent({
            model: geminiModel,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            config: {
              systemInstruction,
              tools: tools as any,
              temperature: 0.3,
            },
            contents: historicoCopia as any,
          });

          const candidato = response.candidates?.[0];
          if (!candidato) break;

          const partes = candidato.content?.parts || [];
          const temFunctionCall = partes.some((p) => p.functionCall);

          if (!temFunctionCall) {
            respostaFinal = partes
              .map((p) => p.text || '')
              .join('')
              .trim();
            break;
          }

          // Processa function calls
          const respostaModel = { role: 'model' as const, parts: partes as Array<{ text: string }> };
          historicoCopia.push(respostaModel);

          const resultadosTools: Array<{ functionResponse: { name: string; response: { output: string } } }> = [];

          for (const parte of partes) {
            if (parte.functionCall) {
              const { name, args } = parte.functionCall as { name: string; args: Record<string, unknown> };
              console.log(`[Orçamentista] Executando tool: ${name}`, args);
              const resultado = await executarTool(name, args || {});
              resultadosTools.push({
                functionResponse: { name, response: { output: resultado } },
              });
            }
          }

          historicoCopia.push({
            role: 'user',
            parts: resultadosTools as unknown as Array<{ text: string }>,
          });
        } catch (geminiError) {
          if (!isGeminiQuotaError(geminiError)) {
            throw geminiError;
          }

          if (hasMultimodalAttachments) {
            throw new Error(
              'A leitura multimodal do Gemini está sem quota no momento. Tente novamente em alguns minutos ou siga com o inventário local do workspace.'
            );
          }

          console.warn('[Orçamentista] ⚠️ Gemini sem quota; ativando fallback OpenRouter.');
          respostaFinal = await gerarRespostaOpenRouter({
            systemInstruction,
            historico: historicoCopia,
          });
          break;
        }
      }
    }

    if (!respostaFinal) {
      respostaFinal = 'Desculpe, não consegui gerar uma resposta. Tente novamente.';
    }

    sessao.historico.push({ role: 'model', parts: [{ text: respostaFinal }] });

    return res.json({
      resposta: respostaFinal,
      etapaAtual: sessao.etapaAtual,
      totalMensagens: sessao.historico.length,
      multiagente: sessao.ultimaAnaliseMultiagente
        ? {
            ativo: true,
            disciplinaPiloto: 'Engenharia Híbrida',
            scoreConsistencia: sessao.ultimaAnaliseMultiagente.scoreConsistencia || 0,
            statusAuditoria: sessao.ultimaAnaliseMultiagente.status || 'OK',
            auditorProvider: 'evis',
            auditorModel: geminiModel,
            auditorEscalated: false,
            source: runtimeAttachments.source,
          }
        : { ativo: false },
      workspace: sessao.workspaceId ? { id: sessao.workspaceId } : null,
    });
  } catch (err) {
    console.error('[Orçamentista] Erro na geração:', err);
    if (isGeminiQuotaError(err)) {
      return res.status(429).json({
        erro: 'Cota da Gemini esgotada no momento.',
        detalhes:
          'A cota da Gemini para este projeto foi excedida. Para mensagens só de texto, o sistema agora tenta usar OpenRouter; para PDF e imagem, tente novamente quando a quota renovar.',
      });
    }

    if (isGeminiAuthError(err)) {
      return res.status(401).json({
        erro: 'Falha de autenticação da Gemini API.',
        detalhes:
          'A chave Gemini configurada no backend está inválida ou expirada. Gere uma nova chave no AI Studio e salve em GEMINI_API_KEY no .env.',
      });
    }

    return res.status(500).json({
      erro: 'Erro ao processar mensagem no Orçamentista.',
      detalhes: err instanceof Error ? err.message : String(err),
    });
  }
});


// ─── DELETE /api/orcamentista/sessao/:id ──────────────────────────────────────
router.delete('/sessao/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const existia = sessoes.has(id);
  sessoes.delete(id);
  return res.json({ ok: true, removida: existia });
});

// ─── GET /api/orcamentista/sessao/:id ─────────────────────────────────────────
router.get('/sessao/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const sessao = sessoes.get(id);
  if (!sessao) return res.json({ existe: false, historico: [] });
  return res.json({
    existe: true,
    totalMensagens: sessao.historico.length,
    etapaAtual: sessao.etapaAtual,
    workspaceId: sessao.workspaceId || null,
  });
});

router.get('/workspaces', (_req: Request, res: Response) => {
  try {
    const workspaces = listOrcamentistaWorkspaces().map((workspace) => ({
      id: workspace.id,
      nome: workspace.nome,
    }));
    return res.json({ success: true, data: workspaces });
  } catch (err) {
    return res.status(500).json({
      success: false,
      erro: 'Erro ao listar workspaces do orçamentista.',
      detalhes: err instanceof Error ? err.message : String(err),
    });
  }
});

router.get('/workspaces/:id/attachments', (req: Request, res: Response) => {
  try {
    const files = listWorkspaceAttachmentFiles(req.params.id);
    return res.json({ success: true, data: files });
  } catch (err) {
    return res.status(400).json({
      success: false,
      erro: 'Erro ao listar arquivos do workspace.',
      detalhes: err instanceof Error ? err.message : String(err),
    });
  }
});

router.post(
  '/workspaces/:id/files',
  express.raw({ type: '*/*', limit: '50mb' }),
  (req: Request, res: Response) => {
    const workspaceId = req.params.id;
    const fileNameHeader = req.header('x-file-name');
    const fileTypeHeader = req.header('x-file-type') || 'application/octet-stream';
    const categoryHeader = req.header('x-file-category') || 'projeto';
    const categoria = ['projeto', 'fornecedores', 'referencias'].includes(categoryHeader)
      ? (categoryHeader as 'projeto' | 'fornecedores' | 'referencias')
      : 'projeto';

    if (!fileNameHeader) {
      return res.status(400).json({ success: false, erro: 'Header x-file-name é obrigatório.' });
    }

    const bodyBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from([]);
    if (!bodyBuffer.length) {
      return res.status(400).json({ success: false, erro: 'Arquivo vazio.' });
    }

    try {
      const saved = saveAttachmentToWorkspace(workspaceId, categoria, decodeURIComponent(fileNameHeader), bodyBuffer);
      return res.status(201).json({
        success: true,
        data: {
          ...saved,
          mimeType: fileTypeHeader || saved.mimeType,
        },
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        erro: 'Erro ao salvar arquivo no workspace.',
        detalhes: err instanceof Error ? err.message : String(err),
      });
    }
  }
);

type Etapa0RuntimeFile = {
  id: string;
  mimeType: string;
  sha256?: string;
  uri: string;
};

type Etapa0ExtractBody = {
  backend?: 'vertex' | 'gemini';
  bucket?: string;
  disableCache?: boolean;
  files?: Array<Partial<Etapa0RuntimeFile>>;
  instruction?: string;
  prefix?: string;
  syncWorkspaceToGcs?: boolean;
  ttlSeconds?: number;
  workspaceId?: string;
};

function normalizeEtapa0RuntimeFiles(files: Array<Partial<Etapa0RuntimeFile>> | undefined): Etapa0RuntimeFile[] {
  return (files || [])
    .filter((file): file is Partial<Etapa0RuntimeFile> & { uri: string; mimeType: string } =>
      Boolean(file.uri && file.mimeType)
    )
    .map((file, index) => ({
      id: file.id || `file-${index + 1}`,
      mimeType: file.mimeType,
      sha256: file.sha256,
      uri: file.uri,
    }));
}

function persistEtapa0Artifacts(input: {
  cache: { cacheName: string; expiresAt?: string };
  etapa0: any;
  files: Etapa0RuntimeFile[];
  validation: ReturnType<typeof validateEtapa0>;
  workspaceId: string;
}) {
  const workspace = listOrcamentistaWorkspaces().find((item) => item.id === input.workspaceId);
  if (!workspace) {
    throw new Error(`Workspace nao encontrado: ${input.workspaceId}`);
  }

  const state = new StateManager(input.workspaceId, process.env.ORCAMENTOS_ROOT || 'Orçamentos_2026');
  const payload = {
    cache: input.cache,
    etapa0: input.etapa0,
    files: input.files,
    validation: input.validation,
  };

  state.saveFragment('etapa0', payload);

  const jsonPath = path.join(workspace.fullPath, '02_ETAPA_0_EXTRACAO.json');
  const markdownPath = path.join(workspace.fullPath, '02_ETAPA_0_EXTRACAO.md');
  fs.writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
  fs.writeFileSync(markdownPath, formatEtapa0Markdown(input.etapa0, input.validation), 'utf-8');

  return {
    jsonPath,
    markdownPath,
    statePath: path.join(workspace.fullPath, 'state', 'stage_etapa0.json'),
  };
}

router.post('/workspaces/:id/sync-gcs', async (req: Request, res: Response) => {
  try {
    const body = req.body as { bucket?: string; prefix?: string; maxFiles?: number };
    const sync = await syncWorkspaceAttachmentsToGcs({
      bucket: body.bucket,
      maxFiles: body.maxFiles,
      prefix: body.prefix,
      workspaceId: req.params.id,
    });

    return res.json({ success: true, data: sync });
  } catch (err) {
    return res.status(500).json({
      success: false,
      erro: 'Erro ao sincronizar anexos do workspace com GCS.',
      detalhes: err instanceof Error ? err.message : String(err),
    });
  }
});

router.post('/etapa0/extract', async (req: Request, res: Response) => {
  try {
    const body = req.body as Etapa0ExtractBody;
    let files = normalizeEtapa0RuntimeFiles(body.files);
    let syncResult: Awaited<ReturnType<typeof syncWorkspaceAttachmentsToGcs>> | null = null;

    if ((!files.length && body.workspaceId) || body.syncWorkspaceToGcs) {
      if (!body.workspaceId) {
        return res.status(400).json({
          success: false,
          erro: 'workspaceId e obrigatorio para sincronizar anexos locais com GCS.',
        });
      }

      syncResult = await syncWorkspaceAttachmentsToGcs({
        bucket: body.bucket,
        prefix: body.prefix,
        workspaceId: body.workspaceId,
      });
      files = normalizeEtapa0RuntimeFiles(syncResult.files);
    }

    if (!files.length) {
      return res.status(400).json({
        success: false,
        erro: 'Nenhum arquivo GCS informado para a ETAPA 0.',
        detalhes: 'Envie files com uri gs://... ou informe workspaceId para sincronizar os anexos locais.',
      });
    }

    const provider = new VertexDocumentRuntimeProvider({
      backend: body.backend,
      disableCache: body.disableCache,
      fallbackOnCacheError: true,
    });

    const cache = await provider.createCache({
      workspaceId: body.workspaceId || 'manual',
      files,
      ttlSeconds: body.ttlSeconds || 3600,
    });

    const etapa0 = await provider.extractEtapa0({
      cacheName: cache.cacheName,
      filesBackup: files,
      instruction: body.instruction || ETAPA0_EXTRACTION_INSTRUCTION,
      schema: ETAPA0_RESPONSE_SCHEMA,
    });
    const validation = validateEtapa0(etapa0);
    const artifacts = body.workspaceId
      ? persistEtapa0Artifacts({ cache, etapa0, files, validation, workspaceId: body.workspaceId })
      : null;

    return res.json({
      success: true,
      data: {
        artifacts,
        cache,
        etapa0,
        files,
        status: validation.status,
        sync: syncResult,
        validation,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      erro: 'Erro ao executar ETAPA 0.',
      detalhes: err instanceof Error ? err.message : String(err),
    });
  }
});

router.post('/workspaces', (req: Request, res: Response) => {
  const { nomeObra, cliente } = req.body as { nomeObra?: string; cliente?: string };

  if (!nomeObra?.trim()) {
    return res.status(400).json({ success: false, erro: 'Nome da obra é obrigatório.' });
  }

  try {
    const workspace = createOrcamentistaWorkspace({
      nomeObra,
      cliente,
    });

    return res.status(201).json({
      success: true,
      data: {
        id: workspace.id,
        nome: workspace.nome,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      erro: 'Erro ao criar nova obra do orçamentista.',
      detalhes: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
