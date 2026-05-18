import { generateCompletion, LLMProvider } from './llmRouter';

// ──────────────────────────────────────────────
// geminiOrcamentista.ts — Serviço Unificado para o Orçamentista MVP
//
// Responsabilidades:
//   1. Receber texto extraído dos arquivos da oportunidade.
//   2. Montar prompt técnico com JSON schema.
//   3. Chamar o provedor LLM configurado com fallback automático.
//   4. Retornar array de OrcamentistaGeminiItem.
//   5. Em caso de falha total, retornar fallback seguro com warnings.
//
// Ordem de fallback: provider configurado → gemini → openrouter → erro
// ──────────────────────────────────────────────

export type OrcamentistaGeminiItem = {
  descricao: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  categoria: string | null;
  confianca: number;
  evidencia: string | null;
  observacoes: string | null;
};

export type OrcamentistaGeminiResult = {
  ok: boolean;
  source: 'gemini' | 'ollama' | 'openrouter' | 'fallback';
  items: OrcamentistaGeminiItem[];
  resumo: string | null;
  warnings: string[];
  model: string;
  rawTextUsed: number;
  providerAttempts?: { provider: string; error: string }[];
};

const SYSTEM_PROMPT = `Você é o Orçamentista IA do sistema EVIS de engenharia civil.

Sua função é analisar textos técnicos (memoriais descritivos, especificações, levantamentos) e sugerir itens de orçamento estruturados.

REGRAS ESTRITAS:
1. Retorne APENAS JSON válido, sem texto adicional, sem markdown, sem blocos de código.
2. NÃO use \`\`\`json ou qualquer formatação markdown. Retorne APENAS o objeto JSON puro.
3. Cada item deve ter evidência — trecho do texto que justifica o item.
4. Se não houver evidência clara para quantidade ou valor, use confianca < 0.60.
5. Não invente dados que não existam no texto.
6. Valores unitários são ESTIMATIVAS — marque como tal em observacoes.
7. Unidades devem ser: m², m³, m, un, vb, kg, l, h, cj (conjunto).
8. Categorias: Demolição, Alvenaria, Estrutura, Elétrica, Hidráulica, Pintura, Revestimento, Cobertura, Esquadrias, Impermeabilização, Paisagismo, Administração, Outros.

FORMATO DE RESPOSTA OBRIGATÓRIO (JSON puro, sem nada antes ou depois):
{"items":[{"descricao":"descrição clara do serviço","unidade":"m²","quantidade":100,"valor_unitario":50.00,"categoria":"Alvenaria","confianca":0.85,"evidencia":"trecho exato do texto","observacoes":"nota ou null"}],"resumo":"resumo geral","alertas":["alerta 1"]}`;

function parseJsonSafe(content: string): { items: any[]; resumo: string | null; alertas: string[] } | null {
  // Remove markdown code blocks if present
  let clean = content
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // Try to find JSON object pattern
  const patterns = [
    /\{[\s\S]*\}/,               // standard full object
    /\{[\s\S]*"items"[\s\S]*\}/, // object with items key
  ];

  for (const pattern of patterns) {
    const match = clean.match(pattern);
    if (!match) continue;

    try {
      const parsed = JSON.parse(match[0]);
      if (parsed && typeof parsed === 'object') {
        return {
          items: Array.isArray(parsed.items) ? parsed.items : [],
          resumo: parsed.resumo ? String(parsed.resumo) : null,
          alertas: Array.isArray(parsed.alertas) ? parsed.alertas.map(String) : [],
        };
      }
    } catch {
      // try next pattern
    }
  }

  // Last resort: try to extract just the items array
  const itemsMatch = clean.match(/"items"\s*:\s*(\[[\s\S]*?\])/);
  if (itemsMatch) {
    try {
      const items = JSON.parse(itemsMatch[1]);
      return { items: Array.isArray(items) ? items : [], resumo: null, alertas: [] };
    } catch {
      // nothing left to try
    }
  }

  return null;
}

function normalizeItems(rawItems: any[]): OrcamentistaGeminiItem[] {
  return rawItems
    .filter((item: any) => item.descricao && typeof item.descricao === 'string')
    .map((item: any) => ({
      descricao: String(item.descricao).trim(),
      unidade: String(item.unidade ?? 'vb').trim(),
      quantidade: typeof item.quantidade === 'number' && item.quantidade > 0 ? item.quantidade : 1,
      valor_unitario: typeof item.valor_unitario === 'number' && item.valor_unitario >= 0 ? item.valor_unitario : 0,
      categoria: item.categoria ? String(item.categoria).trim() : null,
      confianca: typeof item.confianca === 'number' ? Math.max(0, Math.min(1, item.confianca)) : 0.5,
      evidencia: item.evidencia ? String(item.evidencia).trim() : null,
      observacoes: item.observacoes ? String(item.observacoes).trim() : null,
    }));
}

async function tryProvider(
  provider: LLMProvider,
  model: string,
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
): Promise<{ content: string; error?: string }> {
  try {
    return await generateCompletion({ provider, model, temperature: 0.1 }, messages);
  } catch (err: any) {
    return { content: '', error: err?.message ?? 'Erro desconhecido' };
  }
}

export async function analyzeWithGemini(
  extractedText: string,
  opportunityTitle: string,
  fileNames: string[],
  overrides?: { provider?: LLMProvider; model?: string }
): Promise<OrcamentistaGeminiResult> {
  const modelMap: Record<LLMProvider, string> = {
    gemini: process.env.ORCAMENTISTA_GEMINI_MODEL || 'gemini-2.5-flash',
    ollama: process.env.ORCAMENTISTA_OLLAMA_MODEL || 'llama3.1',
    openrouter: process.env.ORCAMENTISTA_OPENROUTER_MODEL || 'minimax/minimax-01',
  };

  // Build ordered fallback chain: override → env → gemini → openrouter
  const primary: LLMProvider = overrides?.provider
    ?? (process.env.ORCAMENTISTA_LLM_PROVIDER as LLMProvider)
    ?? 'ollama';

  const fallbackChain: { provider: LLMProvider; model: string }[] = [
    { provider: primary, model: overrides?.model ?? modelMap[primary] },
  ];

  // Add fallbacks (avoid duplicates)
  const fallbackOrder: LLMProvider[] = ['gemini', 'openrouter', 'ollama'];
  for (const fb of fallbackOrder) {
    if (fb !== primary) {
      // Only add if the provider has credentials configured
      const hasCredentials =
        fb === 'ollama' ||
        (fb === 'gemini' && !!process.env.GEMINI_API_KEY) ||
        (fb === 'openrouter' && !!process.env.OPENROUTER_API_KEY);

      if (hasCredentials) {
        fallbackChain.push({ provider: fb, model: modelMap[fb] });
      }
    }
  }

  if (!extractedText.trim()) {
    return {
      ok: false,
      source: 'fallback',
      items: [],
      resumo: null,
      warnings: ['Nenhum texto extraído dos arquivos selecionados.'],
      model: fallbackChain[0].model,
      rawTextUsed: 0,
    };
  }

  const MAX_CHARS = 20_000;
  const trimmedText = extractedText.length > MAX_CHARS
    ? extractedText.slice(0, MAX_CHARS) + '\n\n[... texto truncado por limite de segurança ...]'
    : extractedText;

  const userPrompt = `Oportunidade: ${opportunityTitle}
Arquivos analisados: ${fileNames.join(', ')}

TEXTO EXTRAÍDO DOS DOCUMENTOS:
---
${trimmedText}
---

Analise o texto acima e retorne os itens de orçamento no formato JSON especificado. Responda APENAS com o JSON puro, sem markdown.`;

  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    { role: 'user' as const, content: userPrompt },
  ];

  const providerAttempts: { provider: string; error: string }[] = [];

  for (const { provider, model } of fallbackChain) {
    console.log(`[OrcamentistaIA] Tentando provedor ${provider} (modelo: ${model}) — ${trimmedText.length} chars...`);

    const { content, error } = await tryProvider(provider, model, messages);

    if (error || !content?.trim()) {
      const msg = error || 'Resposta vazia';
      console.warn(`[OrcamentistaIA] ⚠ Provedor ${provider} falhou: ${msg}`);
      providerAttempts.push({ provider, error: msg });
      continue;
    }

    const parsed = parseJsonSafe(content);
    if (!parsed) {
      const snippet = content.slice(0, 200).replace(/\n/g, ' ');
      console.warn(`[OrcamentistaIA] ⚠ ${provider} retornou resposta sem JSON válido: ${snippet}`);
      providerAttempts.push({ provider, error: `JSON inválido: ${snippet}` });
      continue;
    }

    const items = normalizeItems(parsed.items);
    console.log(`[OrcamentistaIA] ✅ ${items.length} itens via ${provider} (${model}).`);

    const warnings = [...parsed.alertas];
    if (providerAttempts.length > 0) {
      warnings.unshift(`Análise realizada via ${provider} (fallback de ${providerAttempts.map(a => a.provider).join(', ')}).`);
    }

    return {
      ok: true,
      source: provider as OrcamentistaGeminiResult['source'],
      items,
      resumo: parsed.resumo,
      warnings,
      model,
      rawTextUsed: trimmedText.length,
      providerAttempts: providerAttempts.length > 0 ? providerAttempts : undefined,
    };
  }

  // All providers failed
  console.error('[OrcamentistaIA] ❌ Todos os provedores falharam:', providerAttempts);
  return {
    ok: false,
    source: 'fallback',
    items: [],
    resumo: null,
    warnings: [
      'Todos os provedores de IA falharam.',
      ...providerAttempts.map(a => `${a.provider}: ${a.error}`),
      'Adicione itens manualmente ou verifique as configurações de IA.',
    ],
    model: fallbackChain[0].model,
    rawTextUsed: trimmedText.length,
    providerAttempts,
  };
}
