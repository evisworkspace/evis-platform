import { GoogleGenAI } from '@google/genai';
import { PlannerOutput, ReaderOutput } from '../contracts';

const PLANNER_MODEL = process.env.ORCAMENTISTA_MULTIAGENT_MODEL || 'gemini-2.5-flash';

const PLANNER_PROMPT = (readerJson: string) => `
Você é o Agente Planner do sistema EVIS de Orçamentação de Engenharia Civil.

Com base na análise documental abaixo (output do Reader), elabore o ROTEIRO DE ORÇAMENTAÇÃO.

ANÁLISE DOCUMENTAL RECEBIDA:
${readerJson}

Sua resposta deve definir:
1. A sequência técnica correta de etapas para orçar esta obra específica.
2. Qual agente especialista é responsável por cada etapa.
3. Quais etapas dependem de outras (dependencias).
4. Quais etapas exigem aprovação humana obrigatória (HITL) antes de avançar.
5. Se a sondagem está presente, ela SEMPRE tem prioridade geotécnica.

AGENTES DISPONÍVEIS:
- "geotecnico": para sondagem, fundação, estacas, aterro
- "estrutural": para concreto, aço, formas, lajes, vigas, pilares
- "arquitetonico": para alvenaria, revestimentos, cobertura, esquadrias
- "instalacoes": para elétrica, hidráulica, ar-condicionado
- "quantitativos": para levantamento consolidado e composição de custos

REGRAS:
- Etapas de fundação SEMPRE dependem da análise geotécnica (sondagem).
- Etapas estruturais SEMPRE dependem da fundação.
- Composição de custos SEMPRE é a última etapa.
- HITL é obrigatório em: sondagem, fundação, estrutura, e composição final.

RESPONDA APENAS EM JSON VÁLIDO seguindo exatamente este schema:
{
  "roteiro": [
    {
      "id": 1,
      "etapa": "nome da etapa",
      "agente_responsavel": "geotecnico",
      "dependencias": [],
      "hitl_obrigatorio": true
    }
  ],
  "prioridade_geotecnica": true
}
`;

/**
 * AGENTE PLANNER — Conectado ao Gemini Real
 * Elabora o roteiro técnico específico para a obra baseado no ReaderOutput.
 */
export async function executePlanner(
  ai: GoogleGenAI,
  readerData: ReaderOutput
): Promise<PlannerOutput> {

  // Fallback baseado em heurística dos documentos detectados
  const fallback = (): PlannerOutput => {
    const temSondagem = readerData.documentos.some(d => d.tipo === 'sondagem');
    const temEstrutura = readerData.documentos.some(d => d.tipo === 'estrutural');
    return {
      roteiro: [
        ...(temSondagem ? [{
          id: 1, etapa: 'Análise Geotécnica (SPT)',
          agente_responsavel: 'geotecnico', dependencias: [], hitl_obrigatorio: true
        }] : []),
        {
          id: 2, etapa: 'Fundação',
          agente_responsavel: 'geotecnico',
          dependencias: temSondagem ? [1] : [], hitl_obrigatorio: true
        },
        ...(temEstrutura ? [{
          id: 3, etapa: 'Estrutura e Lajes',
          agente_responsavel: 'estrutural', dependencias: [2], hitl_obrigatorio: true
        }] : []),
        {
          id: 4, etapa: 'Composição de Custos',
          agente_responsavel: 'quantitativos',
          dependencias: temEstrutura ? [3] : [2], hitl_obrigatorio: true
        }
      ],
      prioridade_geotecnica: temSondagem
    };
  };

  try {
    console.log(`[PlannerAgent] Elaborando roteiro com ${PLANNER_MODEL}...`);

    const readerJson = JSON.stringify(readerData, null, 2);
    const prompt = PLANNER_PROMPT(readerJson);

    const response = await ai.models.generateContent({
      model: PLANNER_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { temperature: 0.2 }
    });

    const rawText = response.text ?? '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.warn('[PlannerAgent] Gemini não retornou JSON. Usando fallback heurístico.');
      return fallback();
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.roteiro || !Array.isArray(parsed.roteiro) || parsed.roteiro.length === 0) {
      console.warn('[PlannerAgent] Roteiro inválido. Usando fallback heurístico.');
      return fallback();
    }

    const resultado: PlannerOutput = {
      roteiro: parsed.roteiro.map((etapa: any) => ({
        id: Number(etapa.id),
        etapa: String(etapa.etapa || ''),
        agente_responsavel: String(etapa.agente_responsavel || 'quantitativos'),
        dependencias: Array.isArray(etapa.dependencias)
          ? etapa.dependencias.map(Number) : [],
        hitl_obrigatorio: Boolean(etapa.hitl_obrigatorio)
      })),
      prioridade_geotecnica: Boolean(parsed.prioridade_geotecnica)
    };

    console.log(`[PlannerAgent] ✅ Roteiro com ${resultado.roteiro.length} etapa(s) gerado.`);
    return resultado;

  } catch (err) {
    console.error('[PlannerAgent] Erro ao chamar Gemini:', err);
    return fallback();
  }
}
