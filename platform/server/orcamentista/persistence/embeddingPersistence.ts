/**
 * EMBEDDING PERSISTENCE — ORCAMENTISTA IA (Etapa C)
 *
 * Gera embeddings de evidências via Gemini e os grava em
 * orc_evidence_embeddings (pgvector, migration 006).
 *
 * Habilitado com EVIS_ORCAMENTISTA_ENABLE_RAG=true.
 * Requer EVIS_GEMINI_API_KEY ou GEMINI_API_KEY.
 *
 * Interface VectorStore: PgVectorStore implementada aqui.
 * Qdrant pode implementar a mesma interface no futuro.
 */

import { GoogleGenAI } from '@google/genai';

export interface VectorMatch {
  evidenceId: string;
  contentExcerpt: string;
  opportunityFileId: string | null;
  similarity: number;
}

export interface VectorStore {
  upsert(id: string, vector: number[], payload: Record<string, unknown>): Promise<void>;
  search(
    vector: number[],
    filter?: Record<string, unknown>,
    topK?: number,
  ): Promise<VectorMatch[]>;
}

export interface EmbeddingClient {
  from(table: string): any;
}

export type EmbedEvidencesInput = {
  evidences: Array<{
    id: string;
    contentExcerpt: string;
  }>;
};

export type EmbedEvidencesResult =
  | {
      status: 'success';
      embedded: number;
      skipped: number;
    }
  | { status: 'disabled'; message: string }
  | { status: 'no_key'; message: string }
  | { status: 'schema_not_ready'; missingTable: string; message: string }
  | { status: 'ai_error'; message: string }
  | { status: 'persistence_error'; message: string };

const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIM = 768;

function isSchemaNotReadyError(error: {
  message?: string;
  code?: string;
  details?: string;
} | null): boolean {
  if (!error) return false;
  if (error.code === '42P01') return true;
  if (error.code === 'PGRST205') return true;
  const msg = `${error.message ?? ''} ${error.details ?? ''}`.toLowerCase();
  if (msg.includes('could not find the table')) return true;
  if (msg.includes('relation') && msg.includes('does not exist')) return true;
  if (msg.includes('schema cache')) return true;
  return false;
}

async function generateEmbedding(
  ai: GoogleGenAI,
  text: string,
): Promise<number[] | null> {
  try {
    const result = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text,
    });
    const values = result.embeddings?.[0]?.values;
    if (!Array.isArray(values) || values.length !== EMBEDDING_DIM) return null;
    return values as number[];
  } catch {
    return null;
  }
}

/**
 * Generates Gemini embeddings for a batch of evidence rows and upserts them
 * into orc_evidence_embeddings (pgvector). Each row uses ON CONFLICT DO UPDATE
 * so re-running is safe.
 */
export async function embedEvidences(
  client: EmbeddingClient,
  input: EmbedEvidencesInput,
): Promise<EmbedEvidencesResult> {
  const ragEnabled = process.env['EVIS_ORCAMENTISTA_ENABLE_RAG'] === 'true';
  if (!ragEnabled) {
    return {
      status: 'disabled',
      message: 'RAG desabilitado. Defina EVIS_ORCAMENTISTA_ENABLE_RAG=true.',
    };
  }

  if (input.evidences.length === 0) {
    return { status: 'success', embedded: 0, skipped: 0 };
  }

  const apiKey =
    process.env['EVIS_GEMINI_API_KEY'] ?? process.env['GEMINI_API_KEY'] ?? '';
  if (!apiKey) {
    return {
      status: 'no_key',
      message: 'Chave Gemini não configurada. Defina EVIS_GEMINI_API_KEY.',
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  let embedded = 0;
  let skipped = 0;

  for (const evidence of input.evidences) {
    const vector = await generateEmbedding(ai, evidence.contentExcerpt);
    if (!vector) {
      skipped++;
      continue;
    }

    const row = {
      evidence_id: evidence.id,
      // pgvector expects a string representation: '[0.1, 0.2, ...]'
      embedding: `[${vector.join(',')}]`,
      model: EMBEDDING_MODEL,
    };

    const upsertResult = await (client.from('orc_evidence_embeddings') as any)
      .upsert(row, { onConflict: 'evidence_id' });

    if (upsertResult.error) {
      if (isSchemaNotReadyError(upsertResult.error)) {
        return {
          status: 'schema_not_ready',
          missingTable: 'orc_evidence_embeddings',
          message:
            'Tabela orc_evidence_embeddings não encontrada. Aplicar migration 006.',
        };
      }
      return {
        status: 'persistence_error',
        message: upsertResult.error.message ?? 'Falha ao upsert orc_evidence_embeddings.',
      };
    }

    embedded++;
  }

  return { status: 'success', embedded, skipped };
}

/**
 * PgVectorStore — implementação de VectorStore sobre pgvector/Supabase.
 * Busca via função `match_orc_evidences` definida na migration 006.
 */
export class PgVectorStore implements VectorStore {
  constructor(private readonly client: EmbeddingClient) {}

  async upsert(
    id: string,
    vector: number[],
    _payload: Record<string, unknown>,
  ): Promise<void> {
    const row = {
      evidence_id: id,
      embedding: `[${vector.join(',')}]`,
      model: EMBEDDING_MODEL,
    };
    await (this.client.from('orc_evidence_embeddings') as any).upsert(row, {
      onConflict: 'evidence_id',
    });
  }

  async search(
    vector: number[],
    filter?: Record<string, unknown>,
    topK = 5,
  ): Promise<VectorMatch[]> {
    const opportunityId = (filter?.opportunity_id as string) ?? '';
    const threshold = typeof filter?.threshold === 'number' ? filter.threshold : 0.7;

    const result = await (this.client.from('orc_evidence_embeddings') as any).rpc(
      'match_orc_evidences',
      {
        query_embedding: `[${vector.join(',')}]`,
        opportunity_id: opportunityId,
        match_threshold: threshold,
        match_count: topK,
      },
    );

    if (result.error || !Array.isArray(result.data)) return [];

    return (result.data as any[]).map((row) => ({
      evidenceId: row.evidence_id,
      contentExcerpt: row.content_excerpt,
      opportunityFileId: row.opportunity_file_id ?? null,
      similarity: row.similarity,
    }));
  }
}
