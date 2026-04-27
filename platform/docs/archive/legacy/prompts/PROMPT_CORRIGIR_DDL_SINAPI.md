# PROMPT: CORRIGIR DDL SINAPI - ERRO IMMUTABLE

> **Destinatário:** GPT (orçamentista)  
> **Contexto:** Erro ao executar create_table_sinapi.sql no Supabase

---

## ERRO ENCONTRADO

Ao executar o DDL `create_table_sinapi.sql` no Supabase SQL Editor, ocorreu este erro:

```
ERROR: 42P17: functions in index expression must be marked IMMUTABLE
```

---

## CAUSA DO ERRO

O erro está no índice de Full Text Search:

```sql
CREATE INDEX idx_sinapi_descricao_fts 
  ON sinapi_composicoes 
  USING gin(to_tsvector('portuguese', descricao));
```

**Problema:** 
- A função `to_tsvector('portuguese', descricao)` não é `IMMUTABLE`
- PostgreSQL não permite funções não-IMMUTABLE em índices
- Isso acontece porque o comportamento de `to_tsvector` pode variar dependendo da configuração do banco

---

## TAREFA

**Corrigir o arquivo `create_table_sinapi.sql` usando uma das soluções abaixo:**

---

## SOLUÇÃO RECOMENDADA: Coluna Computed STORED

### Abordagem:

1. **Adicionar coluna tsvector computed** (gerada automaticamente)
2. **Criar índice sobre a coluna computed** (não sobre a função)

### Implementação:

```sql
-- Adicionar após a criação da tabela e ANTES dos índices:

ALTER TABLE public.sinapi_composicoes 
  ADD COLUMN descricao_tsv tsvector 
  GENERATED ALWAYS AS (to_tsvector('portuguese', descricao)) STORED;

-- Depois criar o índice sobre a coluna (não sobre a função):

CREATE INDEX idx_sinapi_descricao_fts 
  ON public.sinapi_composicoes 
  USING gin(descricao_tsv);
```

### Vantagens:
- ✅ Resolve o erro IMMUTABLE
- ✅ Performance melhor (tsvector pré-computado)
- ✅ Atualização automática quando `descricao` muda
- ✅ Consultas mais simples

---

## COMO FICA A CONSULTA

### Antes (não funciona):
```sql
WHERE to_tsvector('portuguese', descricao) 
      @@ to_tsquery('portuguese', 'demolição')
```

### Depois (corrigido):
```sql
WHERE descricao_tsv @@ to_tsquery('portuguese', 'demolição')
```

**Mais simples e mais rápido!**

---

## OUTRAS SOLUÇÕES ALTERNATIVAS (se preferir)

### Solução 2: Função Wrapper IMMUTABLE

```sql
-- Criar função wrapper marcada como IMMUTABLE
CREATE OR REPLACE FUNCTION to_tsvector_pt_immutable(text)
RETURNS tsvector
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT to_tsvector('portuguese', $1);
$$;

-- Usar a função wrapper no índice
CREATE INDEX idx_sinapi_descricao_fts 
  ON public.sinapi_composicoes 
  USING gin(to_tsvector_pt_immutable(descricao));
```

**Desvantagem:** Menos eficiente que coluna STORED

---

### Solução 3: Remover Locale (não recomendado)

```sql
-- Sem especificar 'portuguese' (usa configuração padrão do banco)
CREATE INDEX idx_sinapi_descricao_fts 
  ON public.sinapi_composicoes 
  USING gin(to_tsvector(descricao));
```

**Desvantagem:** Pode não funcionar bem com português

---

## AÇÃO NECESSÁRIA

1. **Atualizar** o arquivo `create_table_sinapi.sql`
2. **Aplicar** a Solução Recomendada (coluna STORED)
3. **Documentar** a mudança em `ANALISE_SINAPI.md`
4. **Atualizar** `test_queries_sinapi.sql` (usar `descricao_tsv` em vez de `to_tsvector(...)`)

---

## ESTRUTURA COMPLETA ESPERADA

O DDL corrigido deve seguir esta ordem:

```sql
-- 1. CREATE TABLE
CREATE TABLE public.sinapi_composicoes (...);

-- 2. ADICIONAR COLUNA COMPUTED (NOVO)
ALTER TABLE public.sinapi_composicoes 
  ADD COLUMN descricao_tsv tsvector 
  GENERATED ALWAYS AS (to_tsvector('portuguese', descricao)) STORED;

-- 3. CRIAR ÍNDICES
CREATE INDEX idx_sinapi_codigo ON ...;
CREATE INDEX idx_sinapi_categoria ON ...;
CREATE INDEX idx_sinapi_descricao_fts ON ... USING gin(descricao_tsv); -- Corrigido

-- 4. CONSTRAINTS
ALTER TABLE ... ADD CONSTRAINT ...;

-- 5. COMENTÁRIOS
COMMENT ON TABLE ...;
COMMENT ON COLUMN ...;
COMMENT ON COLUMN sinapi_composicoes.descricao_tsv IS 
  'Coluna computada para Full Text Search (gerada automaticamente)'; -- Novo

-- 6. TRIGGERS (se houver)
CREATE TRIGGER ...;
```

---

## VALIDAÇÃO APÓS CORREÇÃO

Depois de corrigir o DDL, ele deve executar sem erros e retornar:

```sql
-- Verificar coluna tsvector criada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sinapi_composicoes' 
  AND column_name = 'descricao_tsv';
-- Esperado: 1 linha (descricao_tsv | tsvector)

-- Verificar índice criado
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'sinapi_composicoes' 
  AND indexname = 'idx_sinapi_descricao_fts';
-- Esperado: 1 linha (idx_sinapi_descricao_fts)

-- Testar FTS (depois de importar dados)
SELECT codigo, descricao 
FROM sinapi_composicoes 
WHERE descricao_tsv @@ to_tsquery('portuguese', 'demolição')
LIMIT 3;
-- Deve retornar resultados quando houver dados
```

---

## ARQUIVOS A ATUALIZAR

### 1. `create_table_sinapi.sql`
- [ ] Adicionar coluna `descricao_tsv` STORED
- [ ] Modificar índice FTS para usar `descricao_tsv`
- [ ] Adicionar comentário sobre a coluna

### 2. `test_queries_sinapi.sql`
- [ ] Atualizar queries FTS:
  ```sql
  -- Antes:
  WHERE to_tsvector('portuguese', descricao) @@ ...
  
  -- Depois:
  WHERE descricao_tsv @@ ...
  ```

### 3. `ANALISE_SINAPI.md`
- [ ] Documentar a mudança no índice FTS
- [ ] Explicar uso da coluna computed STORED
- [ ] Atualizar exemplos de consulta

---

## CHECKLIST FINAL

Antes de entregar a correção:

- [ ] `create_table_sinapi.sql` corrigido
- [ ] Coluna `descricao_tsv` adicionada
- [ ] Índice FTS usando `descricao_tsv`
- [ ] Comentário da coluna adicionado
- [ ] `test_queries_sinapi.sql` atualizado
- [ ] `ANALISE_SINAPI.md` documentado
- [ ] Testado localmente (se possível) ou validado sintaxe

---

## FORMATO DE ENTREGA

Retorne os arquivos corrigidos:

1. ✅ `create_table_sinapi.sql` (corrigido)
2. ✅ `test_queries_sinapi.sql` (atualizado)
3. ✅ `ANALISE_SINAPI.md` (documentado)

---

**AGORA CORRIJA O DDL E ATUALIZE OS ARQUIVOS!**
