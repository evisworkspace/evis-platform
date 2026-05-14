-- ============================================================================
-- ORCAMENTISTA_006_EVIDENCE_EMBEDDINGS
--
-- Habilita busca semântica (RAG) sobre evidências textuais extraídas de
-- arquivos de oportunidade.
--
-- Pré-requisito:
--   - Migration 003 aplicada (orc_evidences existe).
--   - Extensão pgvector habilitada: CREATE EXTENSION IF NOT EXISTS vector;
--
-- Dimensão: 768 (Gemini text-embedding-004).
-- Índice: HNSW com operator class vector_cosine_ops (distância cosseno).
--
-- Etapa C — RAG sobre evidências.
-- ============================================================================

-- Habilitar extensão (no-op se já ativa)
CREATE EXTENSION IF NOT EXISTS vector;

-- ----------------------------------------------------------------------------
-- 1. Tabela de embeddings
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orc_evidence_embeddings (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id  UUID        NOT NULL
                           REFERENCES public.orc_evidences(id)
                           ON DELETE CASCADE,
  embedding    vector(768) NOT NULL,
  model        TEXT        NOT NULL DEFAULT 'text-embedding-004',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraint: um embedding por evidência (upsert via ON CONFLICT)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_orc_evidence_embeddings_evidence
  ON public.orc_evidence_embeddings(evidence_id);

-- ----------------------------------------------------------------------------
-- 2. Índice HNSW (busca aproximada — mais rápido que IVFFlat para N < 1M)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orc_evidence_embeddings_hnsw
  ON public.orc_evidence_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Índice operacional por evidência (lookup direto)
CREATE INDEX IF NOT EXISTS idx_orc_evidence_embeddings_evidence
  ON public.orc_evidence_embeddings(evidence_id);

-- ----------------------------------------------------------------------------
-- 3. Função de busca semântica por oportunidade
--
-- Uso:
--   SELECT * FROM match_orc_evidences(
--     query_embedding   => '[0.1, 0.2, ...]'::vector,
--     opportunity_id    => 'uuid-da-oportunidade',
--     match_threshold   => 0.7,
--     match_count       => 5
--   );
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION match_orc_evidences(
  query_embedding  vector(768),
  opportunity_id   TEXT,
  match_threshold  FLOAT    DEFAULT 0.7,
  match_count      INT      DEFAULT 5
)
RETURNS TABLE (
  evidence_id       UUID,
  content_excerpt   TEXT,
  opportunity_file_id TEXT,
  similarity        FLOAT
)
LANGUAGE sql STABLE AS $$
  SELECT
    e.id                          AS evidence_id,
    e.content_excerpt,
    e.opportunity_file_id::TEXT,
    1 - (emb.embedding <=> query_embedding) AS similarity
  FROM public.orc_evidence_embeddings emb
  JOIN public.orc_evidences e ON e.id = emb.evidence_id
  WHERE
    e.opportunity_id = match_orc_evidences.opportunity_id
    AND 1 - (emb.embedding <=> query_embedding) >= match_threshold
  ORDER BY emb.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ----------------------------------------------------------------------------
-- 4. RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.orc_evidence_embeddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS orc_evidence_embeddings_open ON public.orc_evidence_embeddings;
CREATE POLICY orc_evidence_embeddings_open
  ON public.orc_evidence_embeddings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- Fim da migration 006
-- NÃO EXECUTAR em produção sem revisão explícita do time.
-- ----------------------------------------------------------------------------
