import { Dispatch } from './orchestrator';

/**
 * Agente de Notas e Pendências (Recomendado: llama3.2)
 * Categoriza ocorrências, materiais e problemas técnicos.
 */
export async function agentNotas(dispatch: Dispatch, transcricaoOriginal: string) {
  const { acoes } = dispatch.payload;
  
  console.log(`[Agente Notas] Processando ${acoes.length} ações. Classificando tipo de pendência.`);

  const prompt = `
ATUE COMO UM GESTOR DE RISCOS DE OBRA.
SUA TAREFA É CATEGORIZAR AS NOTAS E PENDÊNCIAS COM BASE NA NARRATIVA.

NARRATIVA: "${transcricaoOriginal}"

ANÁLISE INICIAL DO ORQUESTRADOR:
${JSON.stringify(acoes.map(a => ({ tipo: a.tipo, dominio: a.dominio, dados: a.dados })), null, 2)}

CATEGORIAS PERMITIDAS: "Material", "Pendência", "Observação", "Clima", "Segurança", "Decisão"
GRAVIDADE: "baixa", "media", "alta"

REGRAS:
1. Agrupe ou refine os apontamentos que constam na análise do orquestrador.
2. Atribua uma categoria (estritamente das permitidas) e a gravidade para as pendências.
3. Retorne a lista refinada. 

RETORNE ESTRITAMENTE NESTE FORMATO JSON:
[
  { "tipo": "string", "descricao": "string descritiva", "gravidade": "baixa|media|alta", "requer_acao_imediata": true|false }
]
  `;

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2', // Recomendado: llama para categorização de texto rápida
        prompt,
        stream: false,
        format: 'json',
        options: { temperature: 0.1 }
      })
    });

    if (!response.ok) throw new Error(`Ollama falhou com status: ${response.status}`);
    const result = await response.json();
    return JSON.parse(result.response);
  } catch (error) {
    console.error('[Agente Notas] Erro:', error);
    return [];
  }
}
