import { Dispatch } from './orchestrator';

/**
 * Agente de Cronograma (Recomendado: qwen2.5-coder:7b)
 * Analisa impactos no prazo, dependências e liberações de frentes de trabalho.
 */
export async function agentCronograma(dispatch: Dispatch, transcricaoOriginal: string) {
  const { acoes, contexto_obra } = dispatch.payload;
  const servicosAtivos = contexto_obra.status_atual.servicos_em_andamento || [];

  console.log(`[Agente Cronograma] Processando impactos no cronograma com ${acoes.length} ações recebidas.`);

  const prompt = `
ATUE COMO UM PLANEJADOR DE OBRAS.
SUA TAREFA É DETECTAR IMPACTOS NO CRONOGRAMA A PARTIR DA NARRATIVA DIÁRIA.

NARRATIVA: "${transcricaoOriginal}"

AÇÕES ENVIADAS PELO ORQUESTRADOR SOBRE SERVIÇOS/ORÇAMENTO:
${JSON.stringify(acoes.map(a => a.dados), null, 2)}

SERVIÇOS EM ANDAMENTO OFICIAIS:
${JSON.stringify(servicosAtivos.map((s: any) => ({ id: s.id, nome: s.nome })), null, 2)}

REGRAS:
1. Se foi mencionada a conclusão de um serviço (100%), este serviço "libera" alguma outra frente de trabalho normalmente na construção civil?
2. Se houve algum problema que causou atraso (chuva, falta material), indique o "impacto_de_atraso" em dias (estimado).
3. Seja conciso e realista. Se não houver impacto no cronograma além do avanço normal, retorne array vazio.

RETORNE ESTRITAMENTE NESTE FORMATO JSON:
[
  { 
    "servico_concluido": "nome do serviço se for o caso", 
    "servicos_liberados_sugestao": ["tarefa 1", "tarefa 2"], 
    "impacto_atraso_dias": 0, 
    "motivo": "resuma a inferência"
  }
]
  `;

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5-coder:7b',
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
    console.error('[Agente Cronograma] Erro:', error);
    return [];
  }
}
