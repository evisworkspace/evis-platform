import { GoogleGenAI } from '@google/genai';

// ──────────────────────────────────────────────
// geminiOrcamentista.ts — Serviço Gemini para o Orçamentista MVP
//
// Responsabilidades:
//   1. Receber texto extraído dos arquivos da oportunidade.
//   2. Montar prompt técnico com JSON schema.
//   3. Chamar Gemini e parsear resposta.
//   4. Retornar array de OrcamentistaPreviewItem.
//   5. Em caso de falha, retornar fallback seguro com warnings.
//
// Regras:
//   - Nunca escreve no banco.
//   - Nunca expõe API key.
//   - Se Gemini não estiver configurado, retorna fallback.
//   - Confiança baixa quando evidência é fraca.
//   - Não inventa quantidades sem evidência.
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
  source: 'gemini' | 'fallback';
  items: OrcamentistaGeminiItem[];
  resumo: string | null;
  warnings: string[];
  model: string;
  rawTextUsed: number;
};

const MODEL = process.env.ORCAMENTISTA_GEMINI_MODEL || 'gemini-2.5-flash';

const SYSTEM_PROMPT = `Você é o Orçamentista IA do sistema EVIS de engenharia civil.

Sua função é analisar textos técnicos (memoriais descritivos, especificações, levantamentos) e sugerir itens de orçamento estruturados.

REGRAS ESTRITAS:
1. Retorne APENAS JSON válido, sem texto adicional.
2. Cada item deve ter evidência — trecho do texto que justifica o item.
3. Se não houver evidência clara para quantidade ou valor, use confianca < 0.60.
4. Não invente dados que não existam no texto.
5. Valores unitários são ESTIMATIVAS — marque como tal em observacoes.
6. Unidades devem ser: m², m³, m, un, vb, kg, l, h, cj (conjunto).
7. Categorias: Demolição, Alvenaria, Estrutura, Elétrica, Hidráulica, Pintura, Revestimento, Cobertura, Esquadrias, Impermeabilização, Paisagismo, Administração, Outros.

FORMATO DE RESPOSTA (JSON):
{
  "items": [
    {
      "descricao": "descrição clara do serviço",
      "unidade": "m²",
      "quantidade": 100,
      "valor_unitario": 50.00,
      "categoria": "Alvenaria",
      "confianca": 0.85,
      "evidencia": "trecho exato do texto que fundamenta este item",
      "observacoes": "nota relevante ou null"
    }
  ],
  "resumo": "resumo geral dos itens identificados",
  "alertas": ["alerta 1", "alerta 2"]
}`;

export async function analyzeWithGemini(
  extractedText: string,
  opportunityTitle: string,
  fileNames: string[]
): Promise<OrcamentistaGeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Fallback: Gemini não configurado
  if (!apiKey) {
    console.warn('[GeminiOrcamentista] GEMINI_API_KEY não configurada. Retornando fallback.');
    return {
      ok: false,
      source: 'fallback',
      items: [],
      resumo: null,
      warnings: ['GEMINI_API_KEY não configurada no servidor. Configure no .env para ativar a análise IA.'],
      model: MODEL,
      rawTextUsed: 0,
    };
  }

  if (!extractedText.trim()) {
    return {
      ok: false,
      source: 'fallback',
      items: [],
      resumo: null,
      warnings: ['Nenhum texto extraído dos arquivos selecionados.'],
      model: MODEL,
      rawTextUsed: 0,
    };
  }

  // Limitar texto para controle de custo
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

Analise o texto acima e retorne os itens de orçamento identificados no formato JSON especificado.`;

  try {
    console.log(`[GeminiOrcamentista] Enviando ${trimmedText.length} chars para ${MODEL}...`);

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }, { text: userPrompt }] },
      ],
      config: { temperature: 0.2 },
    });

    const rawText = response.text ?? '';

    // Parse JSON defensivo
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[GeminiOrcamentista] Resposta sem JSON válido:', rawText.slice(0, 300));
      return {
        ok: false,
        source: 'fallback',
        items: [],
        resumo: null,
        warnings: ['Gemini retornou resposta sem JSON válido. Tente novamente.'],
        model: MODEL,
        rawTextUsed: trimmedText.length,
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(parsed.items)) {
      return {
        ok: false,
        source: 'fallback',
        items: [],
        resumo: null,
        warnings: ['Gemini retornou JSON sem campo "items". Tente novamente.'],
        model: MODEL,
        rawTextUsed: trimmedText.length,
      };
    }

    // Normalizar itens
    const items: OrcamentistaGeminiItem[] = parsed.items
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

    const alertas = Array.isArray(parsed.alertas) ? parsed.alertas.map(String) : [];

    console.log(`[GeminiOrcamentista] ✅ ${items.length} itens retornados pelo modelo.`);

    return {
      ok: true,
      source: 'gemini',
      items,
      resumo: parsed.resumo ? String(parsed.resumo) : null,
      warnings: alertas,
      model: MODEL,
      rawTextUsed: trimmedText.length,
    };
  } catch (err) {
    console.error('[GeminiOrcamentista] Erro ao chamar Gemini:', err);
    return {
      ok: false,
      source: 'fallback',
      items: [],
      resumo: null,
      warnings: [`Erro na chamada ao Gemini: ${(err as Error).message}`],
      model: MODEL,
      rawTextUsed: trimmedText.length,
    };
  }
}
