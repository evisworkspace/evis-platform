import { Etapa0Schema } from '../contracts';

export interface DocumentRuntimeProvider {
  /**
   * Prepara os documentos na infraestrutura do provedor gerando um Cache reutilizável.
   * Evita o envio repetitivo de Base64 em múltiplas etapas.
   */
  createCache(input: {
    workspaceId: string;
    files: Array<{ uri: string; mimeType: string; sha256?: string; id: string }>;
    ttlSeconds?: number; // Padrão recomendado: 3600 (60 minutos)
  }): Promise<{ cacheName: string; expiresAt?: string }>;

  /**
   * Executa a extração determinística via Structured Outputs.
   * O retorno T reflete estritamente a tipagem do schema fornecido.
   */
  extractStructured<T>(input: {
    cacheName: string;
    schema: object; // O JSON Schema rígido correspondente ao tipo T
    instruction: string;
    filesBackup?: Array<{ uri: string; mimeType: string }>; // Fallback para Opção 2
  }): Promise<T>;
}
