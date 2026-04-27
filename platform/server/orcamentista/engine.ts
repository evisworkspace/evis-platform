import { VertexDocumentRuntimeProvider } from './providers/VertexDocumentRuntimeProvider';
import { Etapa0Schema } from './contracts';

/**
 * ENGINE CENTRAL DO ORÇAMENTISTA
 * Ponto de entrada para o processamento de novos projetos.
 */
export class OrcamentistaEngine {
  private provider: VertexDocumentRuntimeProvider;

  constructor() {
    this.provider = new VertexDocumentRuntimeProvider();
  }

  /**
   * Dispara a Etapa 0: Extração Factual e Análise de Projetos
   */
  async processarEtapa0(input: { 
    workspaceId: string;
    documentos: Array<{ uri: string; mimeType: string; id: string }> 
  }): Promise<Etapa0Schema> {
    console.log(`[Engine] Iniciando Etapa 0 para o workspace: ${input.workspaceId}`);

    // 1. Prepara o contexto (Cache ou Contingência)
    const cache = await this.provider.createCache({
      workspaceId: input.workspaceId,
      files: input.documentos
    });

    // 2. Define a instrução mestra (Prompt)
    const instruction = `
      Você é um Orçamentista Sênior especialista em obras residenciais de alto padrão.
      Analise os documentos anexados e extraia os fatos técnicos com 100% de precisão.
      
      REGRAS RÍGIDAS:
      1. Se uma metragem estiver anotada à mão na planta, use-a em vez da escala impressa.
      2. Identifique todos os conflitos de materiais (ex: planta diz porcelanato, memorial diz mármore).
      3. Liste lacunas críticas (ex: falta projeto de fundação).
      
      Responda estritamente no formato JSON definido no schema.
    `;

    // 3. Executa a extração estruturada
    const extraido = await this.provider.extractStructured<Etapa0Schema>({
      cacheName: cache.cacheName,
      schema: {
        type: 'object',
        properties: {
          revisao_registry_id: { type: 'string' },
          documentos: { type: 'array', items: { type: 'object', properties: { nome: { type: 'string' }, tipo: { type: 'string' }, hash_conteudo: { type: 'string' } } } },
          disciplinas: { type: 'array', items: { type: 'string' } },
          ambientes: { type: 'array', items: { type: 'object' } },
          areas: { type: 'array', items: { type: 'object' } },
          materiais: { type: 'array', items: { type: 'object' } },
          sistemas: { type: 'array', items: { type: 'string' } },
          lacunas: { type: 'array', items: { type: 'string' } },
          conflitos: { type: 'array', items: { type: 'object' } },
          alertas: { type: 'array', items: { type: 'object' } },
          evidencias: { type: 'array', items: { type: 'object' } },
          pendencias_hitl: { type: 'array', items: { type: 'string' } }
        }
      },
      instruction,
      filesBackup: input.documentos
    });

    console.log(`[Engine] Etapa 0 concluída com sucesso.`);
    return extraido;
  }
}
