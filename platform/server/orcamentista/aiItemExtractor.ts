/**
 * AI ITEM EXTRACTOR — ORCAMENTISTA IA (Etapa B)
 *
 * Chama Gemini para extrair itens orçamentários preliminares a partir de
 * evidências textuais extraídas de arquivos de oportunidade.
 *
 * Habilitado com EVIS_ORCAMENTISTA_ENABLE_AI_ANALYZE=true.
 * Requer EVIS_GEMINI_API_KEY ou GEMINI_API_KEY no ambiente do servidor.
 *
 * Saída vai para orc_preview_items (status=pending) via persistAnalysisRun().
 * Nenhum item vai direto para orcamento_itens.
 */

import { GoogleGenAI } from '@google/genai';
import type { AnalysisRunPreviewItemInput } from './persistence/analysisRunPersistence';
import type { FileTextEvidence } from './fileTextExtraction';

export type AiExtractorResult =
  | {
      status: 'success';
      items: AnalysisRunPreviewItemInput[];
      rawResponse: string;
      model: string;
    }
  | {
      status: 'disabled';
      message: string;
    }
  | {
      status: 'no_key';
      message: string;
    }
  | {
      status: 'no_evidences';
      message: string;
    }
  | {
      status: 'ai_error';
      message: string;
      rawResponse?: string;
    }
  | {
      status: 'parse_error';
      message: string;
      rawResponse: string;
    };

type RawAiItem = {
  codigo?: string | null;
  description?: string;
  descricao?: string;
  unit?: string;
  unidade?: string;
  quantity?: number | string;
  quantidade?: number | string;
  unit_price?: number | string;
  valor_unitario?: number | string;
  total_price?: number | string;
  valor_total?: number | string;
  categoria?: string | null;
  confidence?: number | null;
  observacoes?: string | null;
  evidence_index?: number | null;
};

function safeNumber(v: unknown): number {
  const n = Number(String(v ?? '0').replace(/[^\d.,]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function normalizeItem(
  raw: RawAiItem,
  evidenceIdsByIndex: number[],
): AnalysisRunPreviewItemInput | null {
  const description = (raw.description ?? raw.descricao ?? '').trim();
  if (!description) return null;

  const unit = (raw.unit ?? raw.unidade ?? 'un').trim() || 'un';
  const quantity = safeNumber(raw.quantity ?? raw.quantidade ?? 0);
  const unitPrice = safeNumber(raw.unit_price ?? raw.valor_unitario ?? 0);
  const totalPrice = safeNumber(raw.total_price ?? raw.valor_total ?? quantity * unitPrice);
  const confidence =
    typeof raw.confidence === 'number' && raw.confidence >= 0 && raw.confidence <= 1
      ? raw.confidence
      : null;
  const evidenceIdx =
    typeof raw.evidence_index === 'number' && evidenceIdsByIndex.includes(raw.evidence_index)
      ? raw.evidence_index
      : null;

  return {
    codigo: raw.codigo ?? null,
    description,
    unit,
    quantity,
    unitPrice,
    totalPrice,
    categoria: raw.categoria ?? null,
    origem: 'ia_orcamentista',
    confidence,
    observacoes: raw.observacoes ?? null,
    sourceEvidenceTags: evidenceIdx !== null ? [evidenceIdx] : [],
  };
}

const AI_EXTRACTION_PROMPT = (evidenceBlock: string) => `
Você é um especialista em orçamentação de obras civis (SINAPI, TCPO, NBR).
Analise os trechos abaixo, extraídos de documentos de uma oportunidade de obra.
Identifique SOMENTE itens de serviço com quantitativos mencionados explicitamente.
NAO invente quantidades ou precos que nao estejam nos trechos.
Se nao houver quantitativos claros, retorne lista vazia.

TRECHOS ANALISADOS:
${evidenceBlock}

Retorne SOMENTE um JSON valido com o seguinte formato (sem texto adicional, sem markdown):
{
  "items": [
    {
      "description": "Descricao clara do servico",
      "unit": "m2",
      "quantity": 120.5,
      "unit_price": 0,
      "categoria": "revestimento",
      "confidence": 0.8,
      "codigo": null,
      "observacoes": "trecho: linha X do documento Y",
      "evidence_index": 0
    }
  ]
}

Campos obrigatorios: description, unit, quantity.
Campos opcionais: unit_price (0 se nao mencionado), codigo (SINAPI se identificado), confidence (0-1), observacoes, evidence_index (indice do trecho acima, 0-based).
`.trim();

export async function extractItemsWithAi(
  evidences: FileTextEvidence[],
): Promise<AiExtractorResult> {
  const enabled = process.env['EVIS_ORCAMENTISTA_ENABLE_AI_ANALYZE'] === 'true';
  if (!enabled) {
    return {
      status: 'disabled',
      message: 'IA de análise desabilitada. Defina EVIS_ORCAMENTISTA_ENABLE_AI_ANALYZE=true.',
    };
  }

  if (evidences.length === 0) {
    return {
      status: 'no_evidences',
      message: 'Nenhuma evidência textual disponível para análise IA.',
    };
  }

  const apiKey =
    process.env['EVIS_GEMINI_API_KEY'] ?? process.env['GEMINI_API_KEY'] ?? '';
  if (!apiKey) {
    return {
      status: 'no_key',
      message:
        'Chave Gemini não configurada no servidor. Defina EVIS_GEMINI_API_KEY ou GEMINI_API_KEY.',
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.0-flash';

  const evidenceBlock = evidences
    .map((ev, idx) => `[${idx}] ${ev.fileName ?? 'arquivo'}: ${ev.content}`)
    .join('\n\n');

  const evidenceIdsByIndex = evidences.map((_, idx) => idx);
  const prompt = AI_EXTRACTION_PROMPT(evidenceBlock);

  let rawResponse = '';
  try {
    const response = await ai.models.generateContent({ model, contents: prompt });
    rawResponse = response.text ?? '';
  } catch (err: any) {
    return {
      status: 'ai_error',
      message: err?.message ?? 'Gemini retornou erro desconhecido.',
    };
  }

  // Strip markdown code fences if present
  const cleaned = rawResponse.replace(/```json\n?|```/g, '').trim();

  let parsed: { items?: RawAiItem[] };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return {
      status: 'parse_error',
      message: 'Gemini retornou resposta que não é JSON válido.',
      rawResponse,
    };
  }

  const rawItems: RawAiItem[] = Array.isArray(parsed.items) ? parsed.items : [];
  const items: AnalysisRunPreviewItemInput[] = rawItems
    .map((raw) => normalizeItem(raw, evidenceIdsByIndex))
    .filter((item): item is AnalysisRunPreviewItemInput => item !== null);

  return { status: 'success', items, rawResponse: cleaned, model };
}
