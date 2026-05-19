# ADR — Orçamentista IA: Arquitetura RAG

**Status:** Aceito  
**Data:** 2025-05  
**Autores:** time EVIS + Claude Opus 4.7  
**Etapa:** 6

---

## Contexto

O Orçamentista IA precisa responder perguntas como:
- "Qual o preço unitário atual do SINAPI para alvenaria de tijolo 9cm em SP?"
- "Existe alguma composição parecida com 'reboco interno' nos meus orçamentos anteriores?"
- "Este item da planta baixa corresponde a qual serviço do SINAPI?"

Essas perguntas exigem busca semântica sobre um corpus que não cabe num prompt único.
A abordagem RAG (Retrieval-Augmented Generation) indexa este corpus em vetores e
recupera apenas os trechos relevantes antes de chamar o modelo.

Este ADR define o que indexar, onde armazenar e qual stack usar.

---

## O que vai para RAG vs. relacional

### Relacional (Supabase PostgreSQL) — resposta exata

| Dado | Tabela | Razão |
|------|--------|-------|
| Preços SINAPI | `sinapi_itens` (futura) | Chave = código SINAPI. Busca exata por código. |
| Itens de orçamento | `orcamento_itens` | Agregações, totais, filtros por obra. |
| Decisões HITL | `orc_hitl_decisions` | Auditoria, append-only, rastreabilidade. |
| Evidências de arquivo | `orc_evidences` | FK para run e arquivo, consulta por run_id. |
| Preview items | `orc_preview_items` | Status machine, FK para run. |

Regra: se a busca é por chave, ID, status ou range numérico → relacional.

### RAG (busca vetorial) — similaridade semântica

| Dado | Corpus | Razão |
|------|--------|-------|
| Descrições de serviços SINAPI | ~90 mil composições | "reboco interno" ≈ "revestimento argamassado" |
| Trechos de arquivos de oportunidade | `orc_evidences.content_excerpt` | Correspondência entre trecho e serviço |
| Orçamentos históricos aprovados | descrições de `orcamento_itens` | Reutilização de preços de projetos anteriores |
| Normas técnicas / cadernos de encargos | documentos institucionais | Referência técnica livre (médio prazo) |

Regra: se a pergunta pode ser respondida com "parecido com X" → RAG.

---

## Opções de stack vetorial

### A — pgvector no Supabase (mesmo banco)

**Como funciona:** extensão PostgreSQL que armazena vetores `vector(1536)` e executa
`<->` (distância cosseno / L2) via índice HNSW ou IVFFlat.

**Vantagens:**
- Zero nova infraestrutura. Supabase já suporta pgvector nativamente.
- Transações ACID cruzando tabelas relacionais e vetoriais.
- RLS do Supabase aplica sobre tabelas vetoriais — mesmo modelo de segurança.
- SDK Supabase tem helpers para `match_documents()`.

**Desvantagens:**
- Performance degrada em corpora > 1 milhão de vetores sem tuning de índice.
- HNSW no Postgres consome RAM proporcional ao tamanho do índice.
- Não suporta filtragem híbrida tão eficiente quanto Qdrant para payloads complexos.

**Veredicto:** adequado para o horizonte de 0–500 mil vetores (SINAPI + histórico
da construtora). Stack simplificado. Escolha padrão para o MVP.

---

### B — Qdrant (instância dedicada)

**Como funciona:** banco de vetores dedicado (Rust), exposto via HTTP/gRPC.
Suporta `payload_filter` para combinar busca vetorial com filtros de metadados
(ex: `obra_id`, `data_referencia`).

**Vantagens:**
- Performance superior para corpora > 1 M vetores.
- Filtragem híbrida eficiente (vetor + metadados) nativamente.
- Interface de administração web incluída.
- Open-source, pode rodar self-hosted ou em Qdrant Cloud.

**Desvantagens:**
- Nova infraestrutura: container Docker ou instância Qdrant Cloud.
- Sincronização de dados entre Supabase e Qdrant exige pipeline de ingestão.
- Autenticação separada — mais superfície de segurança para gerenciar.
- Overhead de ops para times pequenos.

**Veredicto:** adequado quando o corpus ultrapassar 500 mil vetores ou quando
a filtragem híbrida por `obra_id` + vetor for crítica para performance.
Caminho de migração natural a partir do pgvector.

---

### C (Escolhida) — pgvector agora, Qdrant no horizonte de 1 M vetores

---

## Decisão

**Adotar pgvector no Supabase como stack primário, com porta de saída para Qdrant.**

### Fase 1 (sprint atual) — sem RAG

O endpoint `/analyze` já extrai evidências textuais e as grava em `orc_evidences`.
Nenhuma vetorização acontece ainda. Os `content_excerpt` ficam em texto puro.

### Fase 2 (próximo sprint habilitado) — RAG sobre evidências

1. Ao inserir `orc_evidences`, chamar `geminiService.embedText()` para gerar
   o vetor `float[]` da `content_excerpt`.
2. Gravar vetor na tabela `orc_evidence_embeddings`:
   ```sql
   CREATE TABLE orc_evidence_embeddings (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     evidence_id UUID REFERENCES orc_evidences(id) ON DELETE CASCADE,
     embedding vector(768),  -- Gemini text-embedding-004
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   CREATE INDEX ON orc_evidence_embeddings
     USING hnsw (embedding vector_cosine_ops);
   ```
3. Na análise IA, recuperar evidências similares via:
   ```sql
   SELECT e.content_excerpt, e.opportunity_file_id
   FROM orc_evidence_embeddings emb
   JOIN orc_evidences e ON e.id = emb.evidence_id
   WHERE e.opportunity_id = $1
   ORDER BY emb.embedding <=> $query_vector
   LIMIT 5;
   ```

### Fase 3 (médio prazo) — RAG sobre SINAPI

1. Importar tabela SINAPI (~90 mil composições com descrição + preço unitário).
2. Vetorizar todas as descrições offline (batch job one-shot).
3. Busca semântica: "qual composição SINAPI corresponde a este trecho?"
4. Retornar código SINAPI + preço como sugestão no preview_item.

### Porta de saída para Qdrant

Encapsular toda busca vetorial atrás de uma interface:

```typescript
interface VectorStore {
  upsert(id: string, vector: number[], payload: Record<string, unknown>): Promise<void>;
  search(vector: number[], filter?: Record<string, unknown>, topK?: number): Promise<VectorMatch[]>;
}
```

Implementações: `PgVectorStore` (atual) e `QdrantStore` (futura).
Trocar a implementação sem afetar o código do Orçamentista.

---

## Modelo de embedding

**Escolha:** Gemini `text-embedding-004` (768 dimensões).

**Razões:**
- Já usamos `@google/genai` no projeto (`geminiService.ts`).
- Sem nova dependência de SDK.
- 768 dimensões são suficientes para o corpus SINAPI (< 1 M documentos curtos).
- Custo: ~$0.00001 por 1 k tokens (muito barato para lotes SINAPI).

**Alternativa considerada:** OpenAI `text-embedding-ada-002` (1536 dim) — descartada
por adicionar dependência do SDK OpenAI ao projeto que já usa Gemini.

---

## O que NÃO vai para RAG

- Status de itens (`orc_preview_items.status`) — busca exata por enum, não semântica.
- Valores monetários — range numérico, sempre relacional.
- IDs de runs, decisões, usuários — chave exata, relacional.
- Dados de acesso em tempo real (presença, diário de obra) — irrelevante para RAG.

---

## Consequências

**Positivas:**
- MVP sem RAG funciona hoje. Evidências textuais já existem em `orc_evidences`.
- Migração para RAG é additive — sem reescrever o que já existe.
- pgvector no Supabase mantém zero infraestrutura adicional por enquanto.
- Interface `VectorStore` garante que a migração para Qdrant não quebre a lógica.

**Negativas / trade-offs:**
- pgvector com HNSW precisa de `lists` e `m` tuning quando o corpus crescer.
- Vetorizar 90 mil composições SINAPI one-shot pode levar ~30 minutos e custa
  ~$0.027 (aceitável, mas requer job isolado).
- Sem RAG ativo, sugestões de código SINAPI são impossíveis — usuário digita manual.

---

## Referências

- [pgvector no Supabase](https://supabase.com/docs/guides/ai/vector-columns)
- [Qdrant docs](https://qdrant.tech/documentation/)
- [Gemini text-embedding-004](https://ai.google.dev/gemini-api/docs/embeddings)
- [SINAPI CAIXA](https://www.caixa.gov.br/poder-publico/apoio-poder-publico/sinapi/)
- `platform/server/orcamentista/persistence/analysisRunPersistence.ts` — onde evidências são gravadas hoje
