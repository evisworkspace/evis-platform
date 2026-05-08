# EVIS - Staging Baseline Execution Runbook — Fase 4B.S4.E.P

> Fase: 4B.S4.E.P  
> Tipo: runbook documental para execucao futura do baseline schema no staging  
> Status: runbook criado; sem SQL executado; sem migration aplicada; sem banco alterado  
> Staging autorizado: `vtlepoljlqmjwuauygni`  
> Producao bloqueada: `jwutiebpfauwzzltwgbb`

## 1. Objetivo

Definir um runbook seguro e auditavel para executar o baseline schema no Supabase staging
(`vtlepoljlqmjwuauygni`) script por script, com pre-checks e pos-checks read-only, antes de
qualquer autorizacao de execucao real.

Esta fase nao executa SQL, nao altera banco, nao aplica migration e nao avanca para 4B.1.

## 2. Ambiente

| Item | Valor |
|------|-------|
| Staging autorizado | `vtlepoljlqmjwuauygni` |
| Producao bloqueada | `jwutiebpfauwzzltwgbb` |
| Estado atual do staging | Vazio (PostgreSQL 17.6, zero tabelas publicas) |
| pgcrypto instalado | SIM (v1.3) |
| gen_random_uuid() funcional | SIM (confirmado em 4B.S3) |
| 9 tabelas pipeline | AUSENTES (confirmado em 4B.S3) |

Regras absolutas:
- Nunca usar `jwutiebpfauwzzltwgbb` neste runbook.
- Confirmar o ref antes de cada bloco de execucao.
- Executar um script por vez.
- Executar pos-check read-only apos cada script.
- Abortar se qualquer pos-check falhar.

## 3. Scripts Candidatos — Auditoria Completa

### 3.1 `docs/SCHEMA_OFICIAL_V1.sql`

| Item | Detalhe |
|------|---------|
| Finalidade | Criar base operacional de Obra: obras, servicos, equipes, presenca, diario, notas, pendencias, fotos, alias_conhecimento, _schema_version |
| Tabelas criadas | `obras`, `servicos`, `equipes_cadastro`, `equipes_presenca`, `diario_obra`, `notas`, `pendencias`, `fotos`, `alias_conhecimento`, `_schema_version` |
| Dependencias | Nenhuma — script independente |
| CREATE TABLE IF NOT EXISTS | SIM — todas as tabelas |
| DROP / TRUNCATE | NAO |
| DELETE | NAO |
| UPDATE | NAO |
| INSERT | SIM — `INSERT INTO public._schema_version ... ON CONFLICT DO NOTHING` (idempotente, metadado de versao) |
| ALTER | NAO |
| Policies/RLS | NAO — RLS apenas comentado no script |
| Riscos | INSERT de metadado em `_schema_version` (inofensivo e idempotente). Cria tabelas extras alem do minimo (servicos, equipes, etc.) — aceitavel para base operacional de Obra. |
| Status | **APROVADO para execucao** |

### 3.2 `docs/06_CREATE_OPPORTUNITIES_MVP.sql`

| Item | Detalhe |
|------|---------|
| Finalidade | Criar nucleo de CRM/Oportunidades: contacts, opportunities, opportunity_events, opportunity_files |
| Tabelas criadas | `contacts`, `opportunities`, `opportunity_events`, `opportunity_files` |
| Dependencias | `public.obras(id)` — FK em `opportunities.obra_id ON DELETE SET NULL`. Requer `SCHEMA_OFICIAL_V1.sql` executado antes. |
| CREATE TABLE IF NOT EXISTS | SIM — todas as tabelas |
| DROP / TRUNCATE | NAO |
| DELETE | NAO |
| UPDATE | NAO |
| INSERT | NAO |
| ALTER | NAO |
| Policies/RLS | NAO |
| Riscos | Falha se `public.obras` nao existir. Cria `opportunity_files` como FK-alvo do migration candidate. |
| Status | **APROVADO para execucao apos SCHEMA_OFICIAL_V1** |

### 3.3 `platform/docs/sql_proposals/ORCAMENTISTA_002_BASELINE_ORCAMENTOS_ORCAMENTO_ITENS.sql`

| Item | Detalhe |
|------|---------|
| Finalidade | Criar tabelas canonicas de orcamento: orcamentos, orcamento_itens |
| Tabelas criadas | `orcamentos`, `orcamento_itens` |
| Dependencias | Nenhuma externa — `obra_id` e `text NULL` sem FK. FK interna de `orcamento_itens.orcamento_id → orcamentos.id` e criada no mesmo script. |
| CREATE TABLE IF NOT EXISTS | SIM — ambas as tabelas |
| DROP / TRUNCATE | NAO |
| DELETE | NAO |
| UPDATE | NAO |
| INSERT | NAO |
| ALTER | NAO |
| Policies/RLS | NAO |
| Riscos | Nenhum novo. `ON DELETE CASCADE` em `orcamento_itens` seguindo o real — documentado e aceito. |
| Status | **APROVADO para execucao** (pode executar apos SCHEMA_OFICIAL_V1 ou independentemente) |

### 3.4 `docs/08_CREATE_PROPOSTAS_MVP.sql`

| Item | Detalhe |
|------|---------|
| Finalidade | Criar tabela de propostas com RLS e policy aberta MVP |
| Tabelas criadas | `propostas` |
| Dependencias | `public.opportunities(id)` — FK em `propostas.opportunity_id ON DELETE SET NULL`. Requer `06_CREATE_OPPORTUNITIES_MVP.sql` executado antes. |
| CREATE TABLE IF NOT EXISTS | SIM |
| DROP / TRUNCATE | NAO de dados |
| DELETE | NAO de dados |
| UPDATE | NAO |
| INSERT | NAO |
| ALTER | SIM — `ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY` |
| Policies/RLS | SIM — `DROP POLICY IF EXISTS propostas_open_access` + `CREATE POLICY propostas_open_access FOR ALL USING (true) WITH CHECK (true)` |
| Riscos | Policy aberta MVP (`USING (true)`) — aceitavel para staging/MVP interno. Habilita RLS + policy no mesmo script. `DROP POLICY IF EXISTS` e idempotente. |
| Status | **APROVADO para execucao apos 06_CREATE_OPPORTUNITIES_MVP** |

### 3.5 `docs/07_RLS_OPPORTUNITIES_MVP.sql`

| Item | Detalhe |
|------|---------|
| Finalidade | Criar policies de acesso aberto MVP para contacts, opportunities, opportunity_events, opportunity_files |
| Tabelas criadas | Nenhuma |
| Dependencias | Todas as 4 tabelas de `06_CREATE_OPPORTUNITIES_MVP.sql` devem existir |
| CREATE TABLE IF NOT EXISTS | NAO |
| DROP / TRUNCATE | NAO de dados |
| DELETE | NAO de dados |
| UPDATE | NAO |
| INSERT | NAO |
| ALTER | NAO — nao executa `ENABLE ROW LEVEL SECURITY` |
| Policies/RLS | SIM — 16 `DROP POLICY IF EXISTS` + 16 `CREATE POLICY` abertas MVP |
| Riscos | **CRITICO:** o script cria policies mas NAO habilita RLS (`ENABLE ROW LEVEL SECURITY`) nas 4 tabelas. No staging, tabelas novas nao tem RLS habilitado por default. As policies criadas ficam ativas mas o RLS estara desabilitado — as policies serao ignoradas. Para o objetivo do baseline (executar o migration candidate via service_role), esse estado e aceitavel: service_role bypassa RLS. Para uso via anon key, seria necessario habilitar RLS separadamente. |
| Status | **BLOQUEADO para execucao automatica neste runbook** — ver secao 4.2 |

## 4. Decisao sobre Scripts

### 4.1 Scripts aprovados para execucao

| Ordem | Script | Status |
|-------|--------|--------|
| 1 | `docs/SCHEMA_OFICIAL_V1.sql` | APROVADO |
| 2 | `docs/06_CREATE_OPPORTUNITIES_MVP.sql` | APROVADO |
| 3 | `platform/docs/sql_proposals/ORCAMENTISTA_002_BASELINE_ORCAMENTOS_ORCAMENTO_ITENS.sql` | APROVADO |
| 4 | `docs/08_CREATE_PROPOSTAS_MVP.sql` | APROVADO |

### 4.2 Scripts bloqueados

| Script | Motivo |
|--------|--------|
| `docs/07_RLS_OPPORTUNITIES_MVP.sql` | Cria policies sem habilitar RLS. Estado resultante e inconsistente para uso via anon key. Para o objetivo de destravar o migration candidate (que usa service_role), o script e desnecessario nesta fase. Pode ser revisado e executado em fase posterior de RLS baseline. |
| `platform/docs/sql_proposals/ORCAMENTISTA_001_ORCAMENTOS_OBRA_ID_NULLABLE.sql` | Script de ALTER de banco existente, nao de criacao. Depende de `public.orcamentos` ja existir. Fora do escopo do baseline vazio. |

## 5. Ordem Final Proposta de Execucao

```
Etapa 1: docs/SCHEMA_OFICIAL_V1.sql
Etapa 2: docs/06_CREATE_OPPORTUNITIES_MVP.sql
Etapa 3: platform/docs/sql_proposals/ORCAMENTISTA_002_BASELINE_ORCAMENTOS_ORCAMENTO_ITENS.sql
Etapa 4: docs/08_CREATE_PROPOSTAS_MVP.sql
```

Justificativa da ordem:

- Etapa 1 cria `obras`, exigida por FK em `opportunities.obra_id` (Etapa 2).
- Etapa 2 cria `opportunities`, exigida por FK em `propostas.opportunity_id` (Etapa 4).
- Etapa 2 tambem cria `opportunity_files`, exigida como FK-alvo do migration candidate.
- Etapa 3 e independente das Etapas 2 e 4 (nenhuma FK externa), mas vem antes de Etapa 4 por convencao de dominio.
- Etapa 4 pode executar apos Etapas 1 e 2 concluidas; a ordem relativa com Etapa 3 e flexivel.

## 6. Pre-checks Read-Only (antes de qualquer execucao)

Executar contra `vtlepoljlqmjwuauygni` exclusivamente. Nenhuma dessas queries altera dados.

### Pre-check 1 — Confirmar conexao e ref

```sql
SELECT current_database(), version();
```

Resultado esperado: `postgres`, PostgreSQL 17.x.

### Pre-check 2 — Confirmar staging vazio

```sql
SELECT COUNT(*) as total_tabelas
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
```

Resultado esperado antes de qualquer execucao: `0`.

### Pre-check 3 — Confirmar pgcrypto e gen_random_uuid()

```sql
SELECT name, installed_version
FROM pg_available_extensions
WHERE name IN ('pgcrypto', 'uuid-ossp');

SELECT gen_random_uuid() as test;
```

Resultado esperado: pgcrypto 1.3 instalado, uuid valido retornado.

### Pre-check 4 — Confirmar ausencia das 9 tabelas pipeline

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'orc_reader_runs',
    'orc_reader_outputs',
    'orc_reader_safety_evaluations',
    'orc_verifier_runs',
    'orc_reader_verifier_comparisons',
    'orc_reader_verifier_divergences',
    'orc_hitl_issues',
    'orc_hitl_decisions',
    'orc_context_snapshots'
  );
```

Resultado esperado: vazio (zero linhas).

### Pre-check 5 — Confirmar ausencia das tabelas baseline

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'obras', 'contacts', 'opportunities', 'opportunity_events',
    'opportunity_files', 'orcamentos', 'orcamento_itens', 'propostas',
    'servicos', 'diario_obra', 'equipes_cadastro', 'equipes_presenca',
    'notas', 'pendencias', 'fotos', 'alias_conhecimento', '_schema_version'
  );
```

Resultado esperado antes de qualquer execucao: vazio.

### Pre-check 6 — Confirmar ref ativo (checagem de isolamento)

Verificar manualmente no Supabase Dashboard que o projeto ativo e `evis-staging` com ref `vtlepoljlqmjwuauygni`.  
Confirmar que a URL usada na variavel de ambiente de staging NAO contem `jwutiebpfauwzzltwgbb`.

## 7. Execucao Planejada — Script por Script

### Etapa 1: `docs/SCHEMA_OFICIAL_V1.sql`

Acao:
- Executar via Supabase Dashboard > SQL Editor no projeto `vtlepoljlqmjwuauygni`.
- OU via Management API com token de conta, confirmando o ref antes.

Pos-check da Etapa 1:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Esperado: `_schema_version`, `alias_conhecimento`, `diario_obra`, `equipes_cadastro`, `equipes_presenca`, `fotos`, `notas`, `obras`, `pendencias`, `servicos` (10 tabelas).

```sql
SELECT version FROM public._schema_version;
```

Esperado: `1.0.0`.

Abortar se: tabelas inesperadas aparecerem, ou `obras` estiver ausente.

---

### Etapa 2: `docs/06_CREATE_OPPORTUNITIES_MVP.sql`

Acao: executar apos Etapa 1 confirmada.

Pos-check da Etapa 2:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('contacts', 'opportunities', 'opportunity_events', 'opportunity_files')
ORDER BY table_name;
```

Esperado: 4 tabelas presentes.

```sql
SELECT column_name, udt_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'opportunities'
  AND column_name IN ('id', 'obra_id', 'orcamento_id', 'opportunity_files')
ORDER BY column_name;
```

Verificar:
- `id`: uuid, NOT NULL.
- `obra_id`: uuid, nullable.
- `orcamento_id`: uuid, nullable.

```sql
SELECT column_name, udt_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'opportunity_files'
  AND column_name = 'id';
```

Esperado: uuid, NOT NULL.

Abortar se: `opportunities` ou `opportunity_files` estiverem ausentes.

---

### Etapa 3: `platform/docs/sql_proposals/ORCAMENTISTA_002_BASELINE_ORCAMENTOS_ORCAMENTO_ITENS.sql`

Acao: executar apos Etapas 1 e 2 confirmadas.

Pos-check da Etapa 3:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('orcamentos', 'orcamento_itens')
ORDER BY table_name;
```

Esperado: 2 tabelas presentes.

```sql
SELECT column_name, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'orcamentos'
ORDER BY ordinal_position;
```

Verificar:
- `id`: uuid, NOT NULL, default gen_random_uuid().
- `obra_id`: text, nullable.
- `nome`: text, NOT NULL.
- `status`: text, NOT NULL, default 'rascunho'.
- `bdi`: numeric, NOT NULL, default 25.

```sql
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table,
  ccu.column_name AS foreign_column,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
JOIN information_schema.constraint_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'orcamento_itens'
  AND tc.constraint_type = 'FOREIGN KEY';
```

Esperado: FK `orcamento_id → orcamentos(id)` com `DELETE_RULE = CASCADE`.

```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('orcamentos', 'orcamento_itens')
ORDER BY tablename, indexname;
```

Esperado:
- `idx_orcamentos_obra_id` em `orcamentos`.
- `idx_orcamento_itens_orcamento_id` em `orcamento_itens`.
- PKs respectivas.

Abortar se: `orcamentos` ou `orcamento_itens` estiverem ausentes, FK ausente, ou indices ausentes.

---

### Etapa 4: `docs/08_CREATE_PROPOSTAS_MVP.sql`

Acao: executar apos Etapas 1 e 2 confirmadas (Etapa 3 pode ser paralela).

Pos-check da Etapa 4:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'propostas';
```

Esperado: `propostas` presente.

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'propostas';
```

Esperado: `rowsecurity = true`.

```sql
SELECT polname, polcmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'propostas';
```

Esperado: `propostas_open_access` com permissao `*` (ALL).

Abortar se: `propostas` ausente, ou RLS nao habilitado.

## 8. Pos-checks Finais Read-Only (apos todas as etapas)

### Pos-check F1 — Total de tabelas criadas

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Esperado (14+ tabelas):
`_schema_version`, `alias_conhecimento`, `contacts`, `diario_obra`, `equipes_cadastro`, `equipes_presenca`, `fotos`, `notas`, `obras`, `opportunity_events`, `opportunity_files`, `opportunities`, `orcamento_itens`, `orcamentos`, `pendencias`, `propostas`, `servicos`.

### Pos-check F2 — FK-alvo do migration candidate

```sql
SELECT column_name, udt_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('opportunities', 'orcamentos', 'opportunity_files')
  AND column_name = 'id'
ORDER BY table_name;
```

Esperado: 3 linhas, todas uuid, NOT NULL.

### Pos-check F3 — 9 tabelas pipeline ainda ausentes

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'orc_reader_runs', 'orc_reader_outputs', 'orc_reader_safety_evaluations',
    'orc_verifier_runs', 'orc_reader_verifier_comparisons',
    'orc_reader_verifier_divergences', 'orc_hitl_issues',
    'orc_hitl_decisions', 'orc_context_snapshots'
  );
```

Esperado: vazio. Se qualquer resultado aparecer — ABORTAR e investigar.

### Pos-check F4 — gen_random_uuid() continua funcional

```sql
SELECT gen_random_uuid() as post_check_uuid;
```

Esperado: UUID valido.

### Pos-check F5 — RLS geral do baseline

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Esperado:
- `propostas`: `rowsecurity = true`.
- Demais tabelas: `rowsecurity = false` (default para novas tabelas sem script de enable).

### Pos-check F6 — Policies existentes

```sql
SELECT schemaname, tablename, polname, polcmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, polname;
```

Esperado: apenas `propostas_open_access` em `propostas`. Nenhuma policy nas outras tabelas baseline.

## 9. Criterios de Sucesso

A execucao do baseline e considerada bem-sucedida se:

- [ ] Todos os 4 scripts executaram sem erro.
- [ ] 17 tabelas publicas presentes apos execucao completa.
- [ ] `opportunities.id` uuid NOT NULL presente.
- [ ] `orcamentos.id` uuid NOT NULL presente.
- [ ] `opportunity_files.id` uuid NOT NULL presente.
- [ ] FK `orcamento_itens.orcamento_id → orcamentos.id CASCADE` presente.
- [ ] FK `propostas.opportunity_id → opportunities.id SET NULL` presente.
- [ ] FK `opportunities.obra_id → obras.id SET NULL` presente.
- [ ] Indices `idx_orcamentos_obra_id` e `idx_orcamento_itens_orcamento_id` presentes.
- [ ] 9 tabelas pipeline AUSENTES.
- [ ] gen_random_uuid() funcional.
- [ ] `propostas` com RLS habilitado e policy aberta MVP.
- [ ] Nenhuma tabela inesperada criada.

## 10. Criterios de Abortar

Abortar imediatamente e nao executar o proximo script se:

- Ref do alvo nao for confirmado como `vtlepoljlqmjwuauygni` antes da execucao.
- Qualquer pos-check de etapa falhar (tabela ausente, FK ausente, tipo errado).
- Alguma das 9 tabelas pipeline aparecer no pos-check F3.
- Qualquer script retornar erro irreversivel (nao apenas conflito idempotente).
- Erro de conexao que sugira alvo errado.
- Aparecimento de tabelas nao esperadas no schema public.

## 11. Riscos

| # | Risco | Probabilidade | Mitigacao |
|---|-------|---------------|-----------|
| 1 | Executar contra `jwutiebpfauwzzltwgbb` por engano | Baixa se ref confirmado | Confirmar ref explicitamente antes de cada etapa |
| 2 | `SCHEMA_OFICIAL_V1.sql` cria colunas a menos que o real | Media | Schema de staging nao precisa replicar o real 100%; apenas `obras.id` e obrigatorio para a FK |
| 3 | FK de `opportunities.obra_id → obras.id` falhar se `obras` nao existir antes | Baixa | Ordem de execucao controla isso |
| 4 | `07_RLS_OPPORTUNITIES_MVP.sql` nao habilitou RLS | Tratado | Script excluido do runbook; staging funcionara via service_role |
| 5 | Staging nao ter as mesmas extensoes que producao | Baixa | 4B.S3 confirmou pgcrypto e uuid-ossp instalados |
| 6 | Rollback parcial necessario | Media | Staging e descartavel — pode ser limpo ou recriado |

## 12. Plano de Rollback no Staging

Se necessario reverter o baseline do staging:

Opcao A — Dropar tabelas em ordem reversa (apenas no staging descartavel):

```sql
-- Executar somente em vtlepoljlqmjwuauygni, nunca em producao
DROP TABLE IF EXISTS public.propostas CASCADE;
DROP TABLE IF EXISTS public.orcamento_itens CASCADE;
DROP TABLE IF EXISTS public.orcamentos CASCADE;
DROP TABLE IF EXISTS public.opportunity_files CASCADE;
DROP TABLE IF EXISTS public.opportunity_events CASCADE;
DROP TABLE IF EXISTS public.opportunities CASCADE;
DROP TABLE IF EXISTS public.contacts CASCADE;
DROP TABLE IF EXISTS public.alias_conhecimento CASCADE;
DROP TABLE IF EXISTS public.fotos CASCADE;
DROP TABLE IF EXISTS public.pendencias CASCADE;
DROP TABLE IF EXISTS public.notas CASCADE;
DROP TABLE IF EXISTS public.diario_obra CASCADE;
DROP TABLE IF EXISTS public.equipes_presenca CASCADE;
DROP TABLE IF EXISTS public.equipes_cadastro CASCADE;
DROP TABLE IF EXISTS public.servicos CASCADE;
DROP TABLE IF EXISTS public._schema_version CASCADE;
DROP TABLE IF EXISTS public.obras CASCADE;
```

Opcao B — Recriar o projeto staging `evis-staging` do zero no Supabase Dashboard (mais seguro, garante estado limpo).

**Rollback no staging NAO deve ser modelo para producao.** Em producao, preferir migration corretiva.

## 13. Tabelas Esperadas Apos Execucao Completa

| # | Tabela | Script de origem | FK-alvo do migration candidate |
|---|--------|-----------------|-------------------------------|
| 1 | `_schema_version` | SCHEMA_OFICIAL_V1 | NAO |
| 2 | `alias_conhecimento` | SCHEMA_OFICIAL_V1 | NAO |
| 3 | `contacts` | 06_CREATE_OPPORTUNITIES_MVP | NAO |
| 4 | `diario_obra` | SCHEMA_OFICIAL_V1 | NAO |
| 5 | `equipes_cadastro` | SCHEMA_OFICIAL_V1 | NAO |
| 6 | `equipes_presenca` | SCHEMA_OFICIAL_V1 | NAO |
| 7 | `fotos` | SCHEMA_OFICIAL_V1 | NAO |
| 8 | `notas` | SCHEMA_OFICIAL_V1 | NAO |
| 9 | `obras` | SCHEMA_OFICIAL_V1 | NAO (base para FK de opportunities) |
| 10 | `opportunity_events` | 06_CREATE_OPPORTUNITIES_MVP | NAO |
| 11 | `opportunity_files` | 06_CREATE_OPPORTUNITIES_MVP | **SIM** — `opportunity_file_id` no candidate |
| 12 | `opportunities` | 06_CREATE_OPPORTUNITIES_MVP | **SIM** — `opportunity_id` em todas as 9 tabelas |
| 13 | `orcamento_itens` | ORCAMENTISTA_002 | NAO |
| 14 | `orcamentos` | ORCAMENTISTA_002 | **SIM** — `orcamento_id` em todas as 9 tabelas |
| 15 | `pendencias` | SCHEMA_OFICIAL_V1 | NAO |
| 16 | `propostas` | 08_CREATE_PROPOSTAS_MVP | NAO |
| 17 | `servicos` | SCHEMA_OFICIAL_V1 | NAO |

## 14. Decisao Objetiva

**Runbook pronto. Aguardando autorizacao humana explicita para execucao real da 4B.S4.E.**

Para autorizar a execucao:

1. Confirmar alvo `vtlepoljlqmjwuauygni` no Supabase Dashboard antes de iniciar.
2. Confirmar que `jwutiebpfauwzzltwgbb` nao sera usado.
3. Executar os 4 scripts na ordem proposta, um por vez.
4. Executar pos-check apos cada etapa antes de avancar.
5. Executar pos-checks finais F1 a F6 apos todas as etapas.
6. Registrar resultado em relatório 4B.S4.E.

Somente apos todos os criterios de sucesso da Secao 9 confirmados, 4B.1 podera ser considerada.

## 15. Confirmacoes da Fase 4B.S4.E.P

- nenhum SQL executado;
- nenhuma migration aplicada;
- nenhum banco alterado;
- nenhum Supabase remoto alterado;
- producao `jwutiebpfauwzzltwgbb` nao foi usada;
- staging `vtlepoljlqmjwuauygni` referenciado como alvo documental;
- nenhum dado alterado;
- nenhum codigo operacional/UI alterado;
- nenhum `.env` alterado;
- nenhum secret documentado;
- 4B.S4.E permanece bloqueada ate autorizacao humana;
- 4B.1 permanece bloqueada.
