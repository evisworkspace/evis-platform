import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { ReaderOutput } from '../contracts';

const READER_MODEL = process.env.ORCAMENTISTA_MULTIAGENT_MODEL || 'gemini-2.5-flash';

const READER_PROMPT = `
Você é o Agente Reader do sistema EVIS de Orçamentação de Engenharia Civil.

Sua função é EXCLUSIVAMENTE extrair dados técnicos dos documentos recebidos.
Não elabore orçamentos. Não sugira soluções. Apenas extraia e classifique dados.

Para cada documento recebido, identifique:
1. TIPO: 'arquitetonico' | 'estrutural' | 'sondagem' | 'outros'
2. REVISÃO: número ou código de revisão (ex: R0, R1, Rev.A)
3. ACHADOS CRÍTICOS: lista de dados técnicos relevantes encontrados

Para o contexto geral da obra, extraia quando disponível:
- fck_previsto: resistência do concreto (ex: "Fck 25MPa", "C30")
- n_spt_max: maior valor de N-SPT encontrado na sondagem (número inteiro)
- area_total: área total construída em m² (número)

RESPONDA APENAS EM JSON VÁLIDO seguindo exatamente este schema:
{
  "documentos": [
    {
      "nome": "nome do arquivo",
      "tipo": "arquitetonico|estrutural|sondagem|outros",
      "revisao": "R0",
      "achados_criticos": ["achado 1", "achado 2"]
    }
  ],
  "contexto_geral": {
    "fck_previsto": "Fck 25MPa",
    "n_spt_max": 18,
    "area_total": 210
  }
}

Se não conseguir extrair um campo, use null. Não invente dados.
`;

/**
 * AGENTE READER — Conectado ao Gemini Real
 * Analisa PDFs e imagens de engenharia e retorna dados estruturados com rastreabilidade.
 */
export async function executeReader(
  ai: GoogleGenAI,
  anexos: any[],
  contextoChat: string
): Promise<ReaderOutput> {

  const gerarHash = (data: string) =>
    crypto.createHash('sha256').update(data).digest('hex').substring(0, 12);

  const revisaoRegistryId = `registry_${Date.now()}`;

  // Fallback estruturado para quando não há anexos ou a IA falha
  const fallback = (motivo: string): ReaderOutput => ({
    revisao_registry_id: revisaoRegistryId,
    documentos: anexos.map((a: any) => ({
      nome: a.nome,
      tipo: a.nome.toLowerCase().includes('sondagem') ? 'sondagem'
          : a.nome.toLowerCase().includes('estrutur') ? 'estrutural'
          : 'arquitetonico',
      revisao: 'R0',
      hash_conteudo: gerarHash(a.base64 || a.nome),
      achados_criticos: [`[Fallback: ${motivo}]`]
    })),
    contexto_geral: {}
  });

  // Se não há anexos com base64, retorna fallback
  const anexosComConteudo = anexos.filter((a: any) => a.base64);
  if (anexosComConteudo.length === 0) {
    console.warn('[ReaderAgent] Nenhum anexo com base64. Usando fallback.');
    return fallback('Sem conteúdo binário nos anexos');
  }

  try {
    console.log(`[ReaderAgent] Analisando ${anexosComConteudo.length} arquivo(s) com ${READER_MODEL}...`);

    // Monta as partes multimodais para o Gemini
    const parts: any[] = [{ text: READER_PROMPT }];

    for (const anexo of anexosComConteudo) {
      // Adiciona o arquivo como inlineData (suporte nativo Gemini)
      parts.push({
        inlineData: {
          mimeType: anexo.mimeType,
          data: anexo.base64
        }
      });
      parts.push({ text: `[Arquivo: ${anexo.nome}]` });
    }

    if (contextoChat.trim()) {
      parts.push({ text: `\nContexto adicional do usuário: ${contextoChat}` });
    }

    const response = await ai.models.generateContent({
      model: READER_MODEL,
      contents: [{ role: 'user', parts }],
      config: { temperature: 0.1 } // Baixa temperatura para extração precisa
    });

    const rawText = response.text ?? '';

    // Extrai o JSON da resposta (protege contra markdown code blocks)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[ReaderAgent] Resposta não contém JSON válido:', rawText.slice(0, 300));
      return fallback('Gemini não retornou JSON válido');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Valida schema mínimo
    if (!parsed.documentos || !Array.isArray(parsed.documentos)) {
      return fallback('Schema de documentos inválido na resposta');
    }

    // Enriquece com hashes e registry_id
    const resultado: ReaderOutput = {
      revisao_registry_id: revisaoRegistryId,
      documentos: parsed.documentos.map((doc: any, i: number) => ({
        nome: doc.nome || anexosComConteudo[i]?.nome || `doc_${i}`,
        tipo: doc.tipo || 'outros',
        revisao: doc.revisao || 'R0',
        hash_conteudo: gerarHash(anexosComConteudo[i]?.base64 || doc.nome || ''),
        achados_criticos: Array.isArray(doc.achados_criticos) ? doc.achados_criticos : []
      })),
      contexto_geral: {
        fck_previsto: parsed.contexto_geral?.fck_previsto ?? undefined,
        n_spt_max: typeof parsed.contexto_geral?.n_spt_max === 'number'
          ? parsed.contexto_geral.n_spt_max : undefined,
        area_total: typeof parsed.contexto_geral?.area_total === 'number'
          ? parsed.contexto_geral.area_total : undefined,
      }
    };

    console.log(`[ReaderAgent] ✅ ${resultado.documentos.length} documento(s) analisado(s). Registry: ${revisaoRegistryId}`);
    return resultado;

  } catch (err) {
    console.error('[ReaderAgent] Erro ao chamar Gemini:', err);
    return fallback(`Erro na chamada ao modelo: ${(err as Error).message}`);
  }
}
