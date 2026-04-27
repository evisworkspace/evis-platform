import { Dispatch } from './orchestrator';

/**
 * Agente de Serviços (Recomendado: qwen2.5-coder:7b)
 * Extrai avanços percentuais e status dos serviços citados.
 */
export async function agentServicos(dispatch: Dispatch, transcricaoOriginal: string) {
  const { acoes, contexto_obra } = dispatch.payload;
  const servicosAtivos = contexto_obra.status_atual.servicos_em_andamento || [];

  console.log(`[Agente Serviços] Processando ${acoes.length} ações de orçamento. Serviços ativos: ${servicosAtivos.length}.`);

  const prompt = `
ATUE COMO UM ENGENHEIRO AVALIADOR DE OBRAS.
SUA TAREFA É INFERIR O AVANÇO FÍSICO COM BASE NO RELATO DIÁRIO.

NARRATIVA ORIGINAL: "${transcricaoOriginal}"

AÇÕES PROPOSTAS (ORQUESTRADOR):
${JSON.stringify(acoes.map(a => a.dados), null, 2)}

SERVIÇOS EM ANDAMENTO NO CRONOGRAMA OFICIAL:
${JSON.stringify(servicosAtivos.map((s: any) => ({ id: s.id, nome: s.nome, avanco_atual: s.avanco_atual })), null, 2)}

REGRAS DA INFERÊNCIA:
1. Cruze as ações com os serviços ativos oficiais. 
2. Retorne o "id_servico_oficial" se houver uma correspondência certa. Se não houver, preencha com null.
3. Infira o avanço (0 a 100). "Concluiu" = 100%. "Começou" = avanço_atual + pequena %. "Quase pronto" = ~90%.
4. Retorne apenas o que houve mudança.

RETORNE ESTRITAMENTE NESTE FORMATO JSON:
[
  { "id_servico_oficial": "uuid ou null", "nome_mencionado": "string", "avanco": numero, "status": "em_andamento|concluido", "justificativa": "trecho de prova" }
]
  `;

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5-coder:7b', // Recomendado: Qwen é robusto para lógica técnica json
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
    console.error('[Agente Serviços] Erro na inferência:', error);
    return [];
  }
}
