# PROMPT: CRIAR TABELA SINAPI NO SUPABASE

> **Destinatário:** GPT (agente de dados)  
> **Objetivo:** Analisar Excel SINAPI e criar estrutura otimizada no Supabase

---

## CONTEXTO

Tenho a base de dados SINAPI em arquivo Excel que precisa ser importada para o Supabase (PostgreSQL).

Esta base será consultada pelo Claude.ai durante o processo de orçamentação de obras para:
- Buscar composições de serviços
- Obter valores de referência
- Calcular custos estimados
- Sugerir itens automaticamente

**Requisitos críticos:**
- Performance em buscas textuais (busca por descrição)
- Consulta rápida por código
- Suporte a filtros por categoria
- Preparado para expansão futura (dados de terceiros, parceiros)

---

## TAREFA

Você deve executar 4 etapas em sequência:

---

## ETAPA 1: ANALISAR ESTRUTURA DO EXCEL

**Primeiro, analise o arquivo Excel que vou fornecer e identifique:**

### Estrutura de Colunas:
- [ ] Quais colunas existem?
- [ ] Qual coluna tem o código SINAPI?
- [ ] Qual coluna tem a descrição do serviço?
- [ ] Quais colunas têm valores monetários?
- [ ] Existe coluna de unidade de medida (m², m³, un)?
- [ ] Existe coluna de categoria/grupo?
- [ ] Existem colunas de composição/insumos?
- [ ] Existem colunas de produtividade/rendimento?
- [ ] Existem datas de referência dos valores?

### Qualidade dos Dados:
- [ ] Quantas linhas de dados existem?
- [ ] Existem linhas de cabeçalho/totalizadores?
- [ ] Existem células mescladas?
- [ ] Existem valores nulos/vazios?
- [ ] Formato dos valores monetários (vírgula, ponto)?
- [ ] Formato das datas?

### Mapeamento:
Criar tabela de mapeamento:

```
Coluna Excel → Nome Supabase → Tipo PostgreSQL
Exemplo:
A (Código) → codigo → TEXT
B (Descrição) → descricao → TEXT
C (Unidade) → unidade → TEXT
D (Valor) → valor_unitario → DECIMAL(10,2)
```

---

## ETAPA 2: CRIAR DDL (SQL) OTIMIZADO

Com base na análise, criar schema PostgreSQL otimizado:

### Requisitos do DDL:

1. **Nome da tabela:** `sinapi_composicoes`

2. **Campos obrigatórios mínimos:**
```sql
- id (UUID, chave primária)
- codigo (TEXT, único, não nulo) -- Código SINAPI
- descricao (TEXT, não nulo) -- Descrição do serviço
- unidade (TEXT, não nulo) -- m², m³, un, kg, etc
- valor_unitario (DECIMAL(10,2)) -- Valor base
- categoria (TEXT) -- Grupo/categoria
- ativo (BOOLEAN, default true)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

3. **Campos opcionais** (se existirem no Excel):
```sql
- subcategoria (TEXT)
- composicao (JSONB) -- Detalhamento de insumos
- produtividade (TEXT) -- Rendimento
- valor_data (DATE) -- Data de referência do valor
- origem (TEXT, default 'SINAPI')
- observacoes (TEXT)
```

4. **Índices obrigatórios:**
```sql
-- Busca por código (exata)
CREATE INDEX idx_sinapi_codigo ON sinapi_composicoes(codigo);

-- Busca por categoria (filtro)
CREATE INDEX idx_sinapi_categoria ON sinapi_composicoes(categoria);

-- Busca textual (descrição) - Full Text Search
CREATE INDEX idx_sinapi_descricao_fts 
  ON sinapi_composicoes 
  USING gin(to_tsvector('portuguese', descricao));

-- Busca por ativo (filtro)
CREATE INDEX idx_sinapi_ativo ON sinapi_composicoes(ativo);
```

5. **Comentários:**
```sql
COMMENT ON TABLE sinapi_composicoes IS 'Base de referência SINAPI para orçamentação';
COMMENT ON COLUMN sinapi_composicoes.codigo IS 'Código único SINAPI (ex: 04.004.00002)';
COMMENT ON COLUMN sinapi_composicoes.valor_unitario IS 'Valor base de referência em R$';
```

6. **Constraints:**
```sql
-- Código único
ALTER TABLE sinapi_composicoes ADD CONSTRAINT uq_sinapi_codigo UNIQUE(codigo);

-- Valor não negativo
ALTER TABLE sinapi_composicoes 
  ADD CONSTRAINT ck_valor_positivo CHECK (valor_unitario >= 0);
```

---

## ETAPA 3: CRIAR SCRIPT DE IMPORTAÇÃO

Criar script para importar dados do Excel para o Supabase.

### Opções de script (escolher a mais adequada):

#### **Opção A: Python com Pandas** (recomendado)
```python
import pandas as pd
from supabase import create_client, Client
import os
from datetime import datetime

# Configuração
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
EXCEL_FILE = "caminho/para/sinapi.xlsx"

# Conectar
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Ler Excel
df = pd.read_excel(EXCEL_FILE, sheet_name='NomeDaPlanilha')

# Transformar dados
# [VOCÊ DEVE IMPLEMENTAR A TRANSFORMAÇÃO BASEADO NA ESTRUTURA]

# Inserir em lotes
BATCH_SIZE = 100
# [IMPLEMENTAR LÓGICA DE INSERÇÃO]
```

#### **Opção B: Node.js**
```javascript
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

// [IMPLEMENTAR LÓGICA SIMILAR]
```

#### **Opção C: SQL COPY** (se CSV)
```sql
-- Se converter Excel → CSV primeiro
COPY sinapi_composicoes (codigo, descricao, unidade, valor_unitario, categoria)
FROM '/caminho/para/sinapi.csv'
DELIMITER ','
CSV HEADER;
```

### Requisitos do script:

1. **Limpeza de dados:**
   - Remover linhas de cabeçalho duplicadas
   - Remover totalizadores
   - Converter vírgula → ponto (valores decimais)
   - Normalizar textos (trim, uppercase/lowercase conforme necessário)
   - Tratar células vazias → NULL

2. **Validação:**
   - Verificar código único antes de inserir
   - Validar formato de valores monetários
   - Validar unidades de medida
   - Log de erros/avisos

3. **Performance:**
   - Inserção em lotes (batch de 100-500 registros)
   - Usar transações
   - Desabilitar triggers temporariamente (se houver)

4. **Logging:**
   - Total de linhas lidas
   - Total de linhas inseridas
   - Erros encontrados
   - Tempo de execução

---

## ETAPA 4: CRIAR QUERIES DE TESTE E VALIDAÇÃO

Criar queries SQL para validar a importação e testar consultas:

### Validação básica:
```sql
-- Total de registros
SELECT COUNT(*) FROM sinapi_composicoes;

-- Registros por categoria
SELECT categoria, COUNT(*) 
FROM sinapi_composicoes 
GROUP BY categoria 
ORDER BY COUNT(*) DESC;

-- Verificar valores nulos em campos críticos
SELECT 
  COUNT(*) FILTER (WHERE codigo IS NULL) as sem_codigo,
  COUNT(*) FILTER (WHERE descricao IS NULL) as sem_descricao,
  COUNT(*) FILTER (WHERE unidade IS NULL) as sem_unidade,
  COUNT(*) FILTER (WHERE valor_unitario IS NULL) as sem_valor
FROM sinapi_composicoes;

-- Verificar duplicados de código
SELECT codigo, COUNT(*) 
FROM sinapi_composicoes 
GROUP BY codigo 
HAVING COUNT(*) > 1;
```

### Queries de consulta (simular uso pelo Claude.ai):

```sql
-- Busca por código exato
SELECT * FROM sinapi_composicoes 
WHERE codigo = '04.004.00002';

-- Busca textual na descrição
SELECT codigo, descricao, unidade, valor_unitario
FROM sinapi_composicoes
WHERE to_tsvector('portuguese', descricao) @@ to_tsquery('portuguese', 'demolição & alvenaria')
LIMIT 10;

-- Busca por categoria
SELECT codigo, descricao, valor_unitario
FROM sinapi_composicoes
WHERE categoria = 'DEMOLIÇÕES'
ORDER BY descricao
LIMIT 20;

-- Busca parcial por descrição (ILIKE)
SELECT codigo, descricao, unidade, valor_unitario
FROM sinapi_composicoes
WHERE descricao ILIKE '%pintura%'
LIMIT 10;

-- Busca com múltiplos filtros
SELECT codigo, descricao, unidade, valor_unitario
FROM sinapi_composicoes
WHERE categoria = 'PINTURA'
  AND valor_unitario BETWEEN 10 AND 100
  AND ativo = true
ORDER BY valor_unitario;
```

### Performance:
```sql
-- Verificar uso de índices
EXPLAIN ANALYZE
SELECT * FROM sinapi_composicoes
WHERE to_tsvector('portuguese', descricao) @@ to_tsquery('portuguese', 'elétrica');

-- Estatísticas da tabela
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename = 'sinapi_composicoes';
```

---

## FORMATO DE ENTREGA

Você deve entregar 4 arquivos:

### 1. `ANALISE_SINAPI.md`
```markdown
# Análise da Base SINAPI

## Estrutura do Excel
- Total de linhas: XXX
- Total de colunas: XXX
- Planilha(s): [nomes]

## Mapeamento de Colunas
[Tabela de mapeamento Excel → Supabase]

## Problemas Identificados
- [Lista de problemas/avisos]

## Decisões de Modelagem
- [Justificativas das escolhas]
```

### 2. `create_table_sinapi.sql`
```sql
-- DDL completo da tabela
-- Índices
-- Constraints
-- Comentários
```

### 3. `import_sinapi.py` (ou `.js`)
```python
# Script completo de importação
# Com logging
# Com validação
# Com tratamento de erros
```

### 4. `test_queries_sinapi.sql`
```sql
-- Queries de validação
-- Queries de teste
-- Queries de performance
```

---

## CHECKLIST FINAL

Antes de entregar, verificar:

- [ ] Analisou estrutura completa do Excel
- [ ] Criou mapeamento de todas as colunas
- [ ] DDL com todos os campos necessários
- [ ] Índices para performance criados
- [ ] FTS (Full Text Search) configurado
- [ ] Constraints de validação adicionadas
- [ ] Script de importação completo
- [ ] Tratamento de erros implementado
- [ ] Queries de validação criadas
- [ ] Queries de teste funcionando
- [ ] Documentação clara

---

## OBSERVAÇÕES IMPORTANTES

1. **Normalização:**
   - Se houver composições complexas, considere tabela separada
   - Se houver muitas categorias, considere tabela de lookup
   - Balance normalização vs performance de leitura

2. **Encoding:**
   - Garantir UTF-8 em todo processo
   - Caracteres especiais (m², m³) devem ser preservados

3. **Performance:**
   - Tabela será READ-HEAVY (muitas consultas, poucas escritas)
   - Priorize índices para leitura
   - FTS é crítico para busca inteligente

4. **Expansão futura:**
   - Deixar campo `origem` para diferenciar SINAPI de outras fontes
   - Campo `ativo` para desativar sem deletar
   - Estrutura preparada para dados de terceiros

---

**AGORA ANALISE O EXCEL SINAPI E EXECUTE AS 4 ETAPAS!**

---

## ANEXO: ESTRUTURA MÍNIMA ESPERADA

Se não conseguir identificar alguma coluna no Excel, use esta estrutura mínima:

```sql
CREATE TABLE public.sinapi_composicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL,
  unidade TEXT NOT NULL,
  valor_unitario DECIMAL(10,2),
  categoria TEXT,
  ativo BOOLEAN DEFAULT true,
  origem TEXT DEFAULT 'SINAPI',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sinapi_codigo ON sinapi_composicoes(codigo);
CREATE INDEX idx_sinapi_categoria ON sinapi_composicoes(categoria);
CREATE INDEX idx_sinapi_descricao_fts 
  ON sinapi_composicoes 
  USING gin(to_tsvector('portuguese', descricao));
```

Mas tente mapear o máximo de informações possível do Excel original!
