# 01 — MAPEAMENTO E VALIDAÇÃO DAS TABELAS SUPABASE
> **Coach:** Este arquivo mapeia o estado real do banco de dados, identifica inconsistências e apresenta as correções necessárias com SQL pronto para executar.
> **Para o agente:** Execute cada bloco em sequência. Preencha o que encontrar. Não execute os SQLs de correção ainda — apenas apresente o diagnóstico completo primeiro.

---

## BLOCO 1 — Listar todas as tabelas existentes no Supabase

```sql
SELECT
  table_name,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) AS tamanho,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS total_colunas
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;
```

Apresente: nome de cada tabela, tamanho e total de colunas.

---

## BLOCO 2 — Estrutura detalhada de cada tabela

```sql
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

Apresente a estrutura completa coluna por coluna de cada tabela.

---

## BLOCO 3 — Contagem real de registros por tabela

```sql
SELECT 'obras'            AS tabela, COUNT(*) AS registros FROM obras
UNION ALL
SELECT 'servicos',                   COUNT(*) FROM servicos
UNION ALL
SELECT 'equipes_cadastro',           COUNT(*) FROM equipes_cadastro
UNION ALL
SELECT 'notas',                      COUNT(*) FROM notas
UNION ALL
SELECT 'pendencias',                 COUNT(*) FROM pendencias;
```

> Se houver outras tabelas além dessas 5, adicione-as na query acima e apresente todas.

---

## BLOCO 4 — Verificar tabelas referenciadas no código mas ausentes no banco

O levantamento anterior identificou que `fotos`, `usuarios` e `presenca` podem existir apenas nos hooks do frontend. Verifique:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('fotos', 'usuarios', 'presenca', 'avancos', 'medicoes', 'contratos');
```

Apresente: quais existem e quais estão ausentes.

---

## BLOCO 5 — Verificar chaves estrangeiras e relacionamentos

```sql
SELECT
  tc.table_name AS tabela_origem,
  kcu.column_name AS coluna,
  ccu.table_name AS tabela_destino,
  ccu.column_name AS coluna_destino
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

Apresente todos os relacionamentos encontrados.

---

## BLOCO 6 — Verificar RLS (Row Level Security)

```sql
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Apresente quais tabelas têm RLS ativo e quais não têm.

---

## BLOCO 7 — Cruzar tabelas do banco com o que o código espera

Com base no levantamento anterior, o código referencia estas tabelas e colunas:

| Tabela | Colunas esperadas pelo código |
|--------|-------------------------------|
| obras | id, nome, cliente, status, data_inicio, data_fim, descricao |
| servicos | id, obra_id, nome, status, responsavel, data_prevista, data_conclusao |
| equipes_cadastro | id, nome, funcao, contato, status |
| notas | id, obra_id, texto, created_at, autor |
| pendencias | id, obra_id, descricao, status, prioridade, created_at |

Execute para cada tabela:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'obras'
ORDER BY ordinal_position;
```

Repita para cada tabela e compare com as colunas esperadas acima. Apresente:
- ✅ Coluna existe
- ❌ Coluna ausente no banco
- ⚠️ Coluna existe no banco mas não está no código

---

## BLOCO 8 — DIAGNÓSTICO E CORREÇÕES

Após executar todos os blocos, compile o diagnóstico e as correções necessárias no formato abaixo:

```
══════════════════════════════════════════════
DIAGNÓSTICO — BASE DE DADOS EBS
══════════════════════════════════════════════

TABELAS EXISTENTES:
  - (lista)

TABELAS AUSENTES (referenciadas no código mas não existem):
  - (lista ou "nenhuma")

COLUNAS AUSENTES POR TABELA:
  - obras        : (lista ou "ok")
  - servicos     : (lista ou "ok")
  - equipes_cadastro: (lista ou "ok")
  - notas        : (lista ou "ok")
  - pendencias   : (lista ou "ok")

RLS ATIVO:
  - (quais tabelas têm RLS ativo)

RLS AUSENTE:
  - (quais tabelas não têm RLS — risco de segurança)

RELACIONAMENTOS MAPEADOS:
  - (lista de chaves estrangeiras encontradas)

INCONSISTÊNCIAS IDENTIFICADAS:
  - (qualquer divergência entre banco e código)

══════════════════════════════════════════════
```

---

## BLOCO 9 — SQL DE CORREÇÕES

> **Coach:** Após o diagnóstico ser validado, o agente executa apenas os SQLs necessários conforme os problemas encontrados. Cada bloco abaixo só deve ser executado se o problema correspondente foi confirmado no Bloco 8.

---

### CORREÇÃO A — Criar tabelas ausentes

> Execute apenas se tabelas estiverem ausentes no banco.

```sql
-- Tabela fotos (se ausente)
CREATE TABLE IF NOT EXISTS public.fotos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  obra_id UUID REFERENCES public.obras(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela presenca (se ausente)
CREATE TABLE IF NOT EXISTS public.presenca (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  obra_id UUID REFERENCES public.obras(id) ON DELETE CASCADE,
  equipe_id UUID REFERENCES public.equipes_cadastro(id),
  data DATE NOT NULL,
  presente BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### CORREÇÃO B — Adicionar colunas ausentes

> Execute apenas para colunas confirmadas como ausentes no Bloco 8.

```sql
-- Exemplo: adicionar coluna ausente em obras
-- ALTER TABLE public.obras ADD COLUMN IF NOT EXISTS cliente TEXT;
-- ALTER TABLE public.obras ADD COLUMN IF NOT EXISTS data_fim DATE;

-- Exemplo: adicionar coluna ausente em servicos
-- ALTER TABLE public.servicos ADD COLUMN IF NOT EXISTS data_conclusao DATE;
-- ALTER TABLE public.servicos ADD COLUMN IF NOT EXISTS responsavel TEXT;

-- Exemplo: adicionar coluna ausente em pendencias
-- ALTER TABLE public.pendencias ADD COLUMN IF NOT EXISTS prioridade TEXT DEFAULT 'media';
```

> ⚠️ Remova os comentários `--` apenas das linhas que correspondem a colunas confirmadas como ausentes.

---

### CORREÇÃO C — Ativar RLS nas tabelas sem proteção

> Execute para todas as tabelas que o Bloco 6 indicar sem RLS ativo.

```sql
ALTER TABLE public.obras            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipes_cadastro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pendencias       ENABLE ROW LEVEL SECURITY;

-- Política básica de acesso autenticado
CREATE POLICY "Acesso autenticado" ON public.obras
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso autenticado" ON public.servicos
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso autenticado" ON public.equipes_cadastro
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso autenticado" ON public.notas
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso autenticado" ON public.pendencias
  FOR ALL USING (auth.role() = 'authenticated');
```

---

### CORREÇÃO D — Adicionar chaves estrangeiras ausentes

> Execute apenas se o Bloco 5 confirmar relacionamentos ausentes.

```sql
-- Exemplo: garantir que servicos referencia obras
-- ALTER TABLE public.servicos
--   ADD CONSTRAINT fk_servicos_obra
--   FOREIGN KEY (obra_id) REFERENCES public.obras(id) ON DELETE CASCADE;
```

---

> **Após executar as correções:** Rode novamente os Blocos 1, 2 e 3 para confirmar que o banco está no estado esperado. Traga o resultado para validação.
> **Não avance para o próximo passo sem essa confirmação.**
