import { Dispatch } from './orchestrator';

/**
 * Agente de Equipes (Recomendado: llama3.2)
 * Identifica trabalhadores presentes e normaliza referências ambíguas.
 */
export async function agentEquipes(dispatch: Dispatch, transcricaoOriginal: string) {
  const { acoes, contexto_obra } = dispatch.payload;
  const equipesCadastradas = contexto_obra.status_atual.equipes_presentes || [];

  console.log(`[Agente Equipes] Processando ${acoes.length} ações. Equipes ativas: ${equipesCadastradas.length}.`);

  const prompt = `
ATUE COMO UM ASSISTENTE DE RH DE OBRAS.
SUA TAREFA É VALIDAR QUAIS EQUIPES ESTAVAM PRESENTES E TRABALHANDO NO DIA.

NARRATIVA: "${transcricaoOriginal}"

AÇÕES PROPOSTAS PELO ORQUESTRADOR:
${JSON.stringify(acoes.map(a => a.dados), null, 2)}

EQUIPES CADASTRADAS NO SISTEMA:
${JSON.stringify(equipesCadastradas.map((e: any) => ({ id: e.id, nome: e.nome, funcao: e.funcao })), null, 2)}

REGRAS:
1. Revise a narrativa cruzando as informações com as equipes cadastradas.
2. Identifique o ID oficial para cada equipe. Se não tiver ID válido, preencha com null.
3. Se a equipe estava presente, retorne "presente": true. Inclua uma breve justificativa citando um trecho.

RETORNE ESTRITAMENTE NESTE FORMATO JSON:
[
  { "id": "uuid ou null", "nome_inferido": "nome", "presente": true, "justificativa": "trecho" }
]
  `;

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2',
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
    console.error('[Agente Equipes] Erro:', error);
    return [];
  }
}
