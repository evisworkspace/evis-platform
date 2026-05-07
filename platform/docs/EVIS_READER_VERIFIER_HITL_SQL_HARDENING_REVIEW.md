# EVIS — Reader / Verifier / HITL SQL Draft Hardening Review

> Fase: 4A.3
> Tipo: verificacao de schema real + endurecimento do SQL draft
> Status: documento de hardening; sem SQL de escrita; sem migration aplicada; sem banco alterado
> Arquivo auditado: `platform/docs/sql_proposals/ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_DRAFT.sql`

## 1. Objetivo

Verificar o schema real (documentado) de referencia e endurecer o SQL draft antes de ele se tornar migration candidate.

Nenhum SQL de escrita foi executado. Nenhuma migration foi aplicada. Nenhum banco foi alterado. Nenhum codigo operacional ou UI foi alterado.

## 2. Arquivos lidos

- `platform/docs/sql_proposals/ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_DRAFT.sql`
- `platform/docs/EVIS_READER_VERIFIER_HITL_MIGRATION_DRAFT.md`
- `platform/docs/SCHEMA_GAP_REPORT.md`
- `platform/docs/EVIS_ARCHITECTURE_PREFLIGHT_AUDIT.md`
- `docs/06_CREATE_OPPORTUNITIES_MVP.sql`
- `docs/08_CREATE_PROPOSTAS_MVP.sql`
- `docs/SCHEMA_OFICIAL_V1.sql`
- `docs/07_RLS_OPPORTUNITIES_MVP.sql`
- `platform/docs/sql_proposals/ORCAMENTISTA_001_ORCAMENTOS_OBRA_ID_NULLABLE.sql`
- `server/tools/supabaseTools.ts`
- `src/lib/api.ts`

## 3. Introspeccao real ou apenas documental

Introspeccao apenas documental.

Nao houve acesso direto ao banco real nesta fase. O schema real foi inferido cruzando:

- `docs/06_CREATE_OPPORTUNITIES_MVP.sql` — fonte mais confiavel para `contacts`, `opportunities`, `opportunity_events`, `opportunity_files`;
- `docs/08_CREATE_PROPOSTAS_MVP.sql` — fonte para `propostas`;
- `docs/SCHEMA_OFICIAL_V1.sql` — fonte para `obras` e tabelas de Obra;
- `platform/docs/sql_proposals/ORCAMENTISTA_001_ORCAMENTOS_OBRA_ID_NULLABLE.sql` — confirma existencia de `orcamentos` (ALTER aplicado em 2026-05-04);
- `platform/docs/EVIS_ARCHITECTURE_PREFLIGHT_AUDIT.md` — mapa de modulos, tabelas confirmadas e relacoes reais.

Proxima auditoria de introspeccao real deve usar somente queries `information_schema` / `pg_catalog` read-only no painel Supabase, conforme Fase 4A.P1 do roadmap.

## 4. Tabelas base confirmadas

| Tabela | Status | Fonte de confirmacao |
|--------|--------|----------------------|
| `opportunities` | CONFIRMADA | `06_CREATE_OPPORTUNITIES_MVP.sql` |
| `opportunity_files` | CONFIRMADA | `06_CREATE_OPPORTUNITIES_MVP.sql` |
| `opportunity_events` | CONFIRMADA | `06_CREATE_OPPORTUNITIES_MVP.sql` |
| `contacts` | CONFIRMADA | `06_CREATE_OPPORTUNITIES_MVP.sql` |
| `propostas` | CONFIRMADA | `08_CREATE_PROPOSTAS_MVP.sql` |
| `obras` | CONFIRMADA | `SCHEMA_OFICIAL_V1.sql` |
| `orcamentos` | CONFIRMADA (indireta) | `ORCAMENTISTA_001_ORCAMENTOS_OBRA_ID_NULLABLE.sql` — ALTER aplicado; `orcamentos.obra_id` agora nullable |
| `orcamento_itens` | REFERENCIADA em codigo | Sem CREATE SQL proprio no repositorio; confirmada por uso real em hooks e SCHEMA_GAP_REPORT |

### 4.1 Campos criticos confirmados

| Campo | Tipo/Constraint | Fonte |
|-------|-----------------|-------|
| `opportunities.id` | `uuid PK DEFAULT gen_random_uuid()` | `06_CREATE_OPPORTUNITIES_MVP.sql:44` |
| `opportunities.orcamento_id` | `uuid` (sem FK formal; uuid avulso) | `06_CREATE_OPPORTUNITIES_MVP.sql:59` |
| `opportunities.proposta_id` | `uuid` (sem FK formal; uuid avulso) | `06_CREATE_OPPORTUNITIES_MVP.sql:60` |
| `opportunities.obra_id` | `uuid REFERENCES obras(id) ON DELETE SET NULL` | `06_CREATE_OPPORTUNITIES_MVP.sql:61` |
| `opportunities.orcamentista_workspace_id` | `text` (identificador operacional, nao FK relacional) | `06_CREATE_OPPORTUNITIES_MVP.sql:58` |
| `opportunity_files.id` | `uuid PK DEFAULT gen_random_uuid()` | `06_CREATE_OPPORTUNITIES_MVP.sql:104` |
| `opportunity_files.opportunity_id` | `uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE` | `06_CREATE_OPPORTUNITIES_MVP.sql:105` |
| `orcamentos.id` | `uuid PK` (inferido; sem CREATE SQL proprio) | Confirmado via ALTER em ORCAMENTISTA_001 |
| `orcamentos.obra_id` | `text NULL` (nullable desde 2026-05-04) | `ORCAMENTISTA_001_ORCAMENTOS_OBRA_ID_NULLABLE.sql` |

### 4.2 Divergencias encontradas

| Campo | Esperado pelo draft | Realidade confirmada | Impacto |
|-------|--------------------|-----------------------|---------|
| `opportunities.orcamento_id` | FK formal para `orcamentos.id` | UUID sem FK (raw column) | Sem impacto no draft de Reader/Verifier — o draft nao cria FK para este campo |
| `opportunities.proposta_id` | FK formal para `propostas.id` | UUID sem FK (raw column) | Sem impacto |
| `orcamentos` | CREATE SQL proprio em docs | Confirmada apenas indiretamente via ALTER | Recomenda-se documentar CREATE completo em fase futura |
| `orcamento_itens` | Existencia confirmada | Sem CREATE SQL proprio | Sem impacto no draft — nenhuma FK para `orcamento_itens` no draft |

Nenhuma divergencia bloqueia o SQL draft desta fase.

## 5. Padrao UUID identificado

Padrao unico em todo o repositorio: `gen_random_uuid()`.

Nenhuma referencia a `uuid_generate_v4()` ou `pgcrypto` explicitamente necessaria foi encontrada.

Em Supabase (PostgreSQL 14+), `gen_random_uuid()` esta disponivel nativamente via modulo `pgcrypto` pre-instalado. O SQL draft ja usa este padrao corretamente e contem nota de referencia sobre pgcrypto no cabecalho.

Decisao: manter `DEFAULT gen_random_uuid()` no draft sem alteracao.

## 6. Decisao: harmonizacao de severity

### 6.1 Problema identificado

`orc_reader_verifier_divergences.severity` usava ingles (`low/medium/high/critical`) enquanto `orc_hitl_issues.severity` usava portugues (`baixa/media/alta/critica`).

Inconsistencia entre camadas do mesmo pipeline e risco operacional: queries de agregacao por severidade precisariam tratar dois vocabularios distintos.

### 6.2 Convencao do projeto

O EVIS usa portugues para enums de dominio em todo o repositorio:

- `pendencias.prioridade`: `baixa/media/alta/critica` (SCHEMA_OFICIAL_V1.sql)
- `orc_hitl_issues.severity`: `baixa/media/alta/critica` (draft original)
- `opportunities.prioridade`: `baixa/media/alta/urgente` (06_CREATE_OPPORTUNITIES_MVP.sql)

### 6.3 Decisao aplicada

Padronizar `orc_reader_verifier_divergences.severity` para portugues: `IN ('baixa', 'media', 'alta', 'critica')`.

Ajuste aplicado no SQL draft na linha 171.

## 7. Decisao: source_type em orc_hitl_decisions

### 7.1 Problema identificado

`orc_hitl_decisions.source_type` estava como `text NULL`, enquanto tabelas contextuais similares (`orc_hitl_issues`, `orc_context_snapshots`) definem `source_type text NOT NULL`.

### 7.2 Analise

Decisoes sao sempre vinculadas a uma issue via `hitl_issue_id NOT NULL`, portanto a rastreabilidade de origem e garantida via FK. Porem:

- Manter `source_type NULL` cria dependencia obrigatoria de join para contexto minimo de auditoria.
- Tornar `NOT NULL DEFAULT 'hitl_issue'` garante que toda linha de decisao seja auto-descritiva sem join.
- Decisoes sobre issues de origem `reader_safety`, `reader_confidence`, `verifier_isolated` ou `comparison_divergence` podem ser identificadas diretamente sem join.

### 7.3 Decisao aplicada

`source_type text NOT NULL DEFAULT 'hitl_issue' CHECK (length(trim(source_type)) > 0)`.

O valor default `'hitl_issue'` e correto para o caso padrao (decisao sobre uma HITL issue). Quando a decisao tiver contexto de origem diferente, o campo deve ser preenchido explicitamente.

Ajuste aplicado no SQL draft na linha 254.

## 8. Indices adicionais recomendados

### 8.1 Ausentes identificados na auditoria 4A.2

| Indice | Tabela | Campo | Justificativa |
|--------|--------|-------|---------------|
| `idx_orc_verifier_runs_reader_run_id` | `orc_verifier_runs` | `reader_run_id` | FK presente mas sem indice proprio; queries por reader_run_id sem join em reader_output |
| `idx_orc_context_snapshots_reader_run_id` | `orc_context_snapshots` | `reader_run_id` | FK sem indice; historico de contexto por execucao Reader |
| `idx_orc_context_snapshots_reader_output_id` | `orc_context_snapshots` | `reader_output_id` | FK sem indice |
| `idx_orc_context_snapshots_verifier_run_id` | `orc_context_snapshots` | `verifier_run_id` | FK sem indice |
| `idx_orc_context_snapshots_comparison_id` | `orc_context_snapshots` | `comparison_id` | FK sem indice; frequente em queries de contexto por comparacao |
| `idx_orc_hitl_issues_severity` | `orc_hitl_issues` | `severity` | Triagem operacional da fila HITL por criticidade |
| `idx_orc_hitl_decisions_decided_at` | `orc_hitl_decisions` | `decided_at` | Timeline de revisao humana; audit trail cronologico |

### 8.2 Aplicados no SQL draft

Todos os 7 indices acima foram adicionados no bloco de indices do SQL draft, na secao de lineage ids e apos o bloco de status/created_at.

## 9. Triggers futuras recomendadas

Ja documentadas como comentario no SQL draft. Nenhuma implementacao executavel nesta fase.

### 9.1 Imutabilidade de raw_output_json

```sql
-- ANTES DO EXECUTE: revisar e adaptar para Supabase
CREATE OR REPLACE FUNCTION fn_orc_reader_outputs_immutable_raw()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.raw_output_json IS DISTINCT FROM NEW.raw_output_json THEN
    RAISE EXCEPTION 'raw_output_json e imutavel apos insert';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_orc_reader_outputs_immutable_raw
  BEFORE UPDATE ON public.orc_reader_outputs
  FOR EACH ROW EXECUTE FUNCTION fn_orc_reader_outputs_immutable_raw();
```

### 9.2 Append-only para orc_hitl_decisions

```sql
-- ANTES DO EXECUTE: revisar e adaptar para Supabase
CREATE OR REPLACE FUNCTION fn_orc_hitl_decisions_append_only()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'orc_hitl_decisions e append-only: UPDATE e DELETE sao proibidos';
END;
$$;

CREATE TRIGGER trg_orc_hitl_decisions_no_update
  BEFORE UPDATE ON public.orc_hitl_decisions
  FOR EACH ROW EXECUTE FUNCTION fn_orc_hitl_decisions_append_only();

CREATE TRIGGER trg_orc_hitl_decisions_no_delete
  BEFORE DELETE ON public.orc_hitl_decisions
  FOR EACH ROW EXECUTE FUNCTION fn_orc_hitl_decisions_append_only();
```

Ambas as triggers sao propostas documentais. Devem ser revisadas e testadas antes de qualquer execucao no banco real. Manter como comentario no SQL draft ate aprovacao explicita.

## 10. RLS points pendentes

RLS deve permanecer como proposta comentada ate decisao de tenant/company_id.

Diretrizes mantidas do draft:

1. Segmentar por `opportunity_id` como eixo principal (e possivel `company_id`/tenant futuro).
2. Papeis distintos: `reader_writer`, `verifier_writer`, `human_decider`, `auditor_readonly`.
3. Evitar policies abertas do tipo `USING (true)` nas tabelas de Reader/Verifier/HITL.
4. Restringir `raw_output_json`, `issue_snapshot_json` e `decision_payload_json` por papel.
5. Planejar compatibilidade futura com `company_id`/tenant antes de qualquer uso multi-empresa.

Enquanto o projeto EVIS nao tiver autenticacao com `auth.uid()` e separacao de tenants, as 9 tabelas nao devem ser expostas com policies abertas. O padrao atual de `USING (true)` usado em oportunidades e propostas e aceito apenas para MVP local.

## 11. Ajustes aplicados no SQL draft

| # | Linha | Tipo | Antes | Depois |
|---|-------|------|-------|--------|
| 1 | 171 | Correcao obrigatoria | `severity IN ('low', 'medium', 'high', 'critical')` | `severity IN ('baixa', 'media', 'alta', 'critica')` |
| 2 | 254 | Correcao obrigatoria | `source_type text NULL,` | `source_type text NOT NULL DEFAULT 'hitl_issue' CHECK (length(trim(source_type)) > 0),` |
| 3 | 354+ | Adicao de indices opcionais | Ausentes | 7 indices adicionados no bloco de lineage ids |

Todas as correcoes sao documentais. O topo `-- DRAFT ONLY. DO NOT EXECUTE.` foi mantido.

## 12. Confirmacoes de conformidade

- Nenhum SQL de escrita executado.
- Nenhuma migration aplicada.
- Nenhum banco alterado.
- Nenhum codigo operacional/UI alterado.
- Nenhum trigger executavel final aplicado.
- Nenhuma FK para `orcamento_itens`.
- Nenhuma escrita direta em `orcamento_itens`.
- `opportunity_id` continua obrigatorio nas 9 tabelas.
- `orcamento_id` continua nullable nesta fase.
- `orc_hitl_decisions` continua append-only e sem cascade.
- `raw_output_json` continua imutavel por regra documental.

## 13. Proxima fase recomendada

Fase 4A.P1: Auditoria read-only real do banco Supabase.

Queries a executar no painel Supabase (read-only, information_schema apenas):

```sql
-- Verificar colunas de opportunities
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'opportunities'
ORDER BY ordinal_position;

-- Verificar colunas de opportunity_files
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'opportunity_files'
ORDER BY ordinal_position;

-- Verificar colunas de orcamentos
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'orcamentos'
ORDER BY ordinal_position;

-- Listar todas as tabelas existentes no schema public
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Verificar RLS habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verificar policies existentes
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verificar triggers existentes
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

Resultado deve ser comparado com `SCHEMA_GAP_REPORT.md` e este documento antes da Fase 4B (migration real).
