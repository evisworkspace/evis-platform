# EVIS - Staging Baseline Execution Report — Fase 4B.S4.E

> Fase: 4B.S4.E  
> Tipo: relatorio de execucao do baseline schema no staging  
> Status: baseline aplicado com sucesso; todos os criterios de sucesso atingidos  
> Project ref staging usado: `vtlepoljlqmjwuauygni`  
> Producao bloqueada (nao usada): `jwutiebpfauwzzltwgbb`

## 1. Objetivo

Aplicar o schema base minimo no Supabase staging (`vtlepoljlqmjwuauygni`) para preparar o ambiente antes da futura execucao do migration candidate do pipeline Reader/Verifier/HITL (4B.1).

## 2. Confirmacao de Isolamento

| Check | Resultado |
|-------|-----------|
| Project ref staging usado | `vtlepoljlqmjwuauygni` |
| Producao usada | NAO ✓ |
| Ref bloqueado (`jwutiebpfauwzzltwgbb`) usado | NAO ✓ |
| Secrets expostos no chat | NAO ✓ |
| Metodo de acesso | Supabase Management API, Bearer token de conta |
| Endpoint | `https://api.supabase.com/v1/projects/vtlepoljlqmjwuauygni/database/query` |

## 3. Pre-checks Executados

| Pre-check | Query | Resultado | Status |
|-----------|-------|-----------|--------|
| Conexao e versao | `SELECT current_database(), version()` | PostgreSQL 17.6, banco `postgres` | PASSOU ✓ |
| gen_random_uuid() | `SELECT gen_random_uuid()` | UUID valido retornado | PASSOU ✓ |
| Tabelas publicas atuais | `information_schema.tables WHERE table_schema='public'` | `[]` — staging vazio | PASSOU ✓ |
| 9 tabelas pipeline ausentes | IN ('orc_reader_runs', ...) | `[]` — ausentes | PASSOU ✓ |
| Ref confirmado | Hardcoded em todas as chamadas como `vtlepoljlqmjwuauygni` | Confirmado | PASSOU ✓ |

Todos os 5 pre-checks passaram. Execucao iniciada.

## 4. Scripts Executados

### Etapa 1 — `docs/SCHEMA_OFICIAL_V1.sql`

| Item | Detalhe |
|------|---------|
| Resultado da chamada API | `[]` (sucesso — ultimo statement foi INSERT idempotente) |
| Erro | Nenhum |
| Encoding | UTF-8 (necessario devido a caracteres especiais no arquivo) |
| Status | SUCESSO ✓ |

Pos-check parcial:

```json
[
  {"table_name":"_schema_version"},
  {"table_name":"alias_conhecimento"},
  {"table_name":"diario_obra"},
  {"table_name":"equipes_cadastro"},
  {"table_name":"equipes_presenca"},
  {"table_name":"fotos"},
  {"table_name":"notas"},
  {"table_name":"obras"},
  {"table_name":"pendencias"},
  {"table_name":"servicos"}
]
```

10 tabelas criadas. `obras` presente — dependencia da Etapa 2 satisfeita. ✓

---

### Etapa 2 — `docs/06_CREATE_OPPORTUNITIES_MVP.sql`

| Item | Detalhe |
|------|---------|
| Resultado da chamada API | `[]` (sucesso — COMMIT) |
| Erro | Nenhum |
| Status | SUCESSO ✓ |

Pos-check parcial:

```json
[
  {"table_name":"contacts"},
  {"table_name":"opportunities"},
  {"table_name":"opportunity_events"},
  {"table_name":"opportunity_files"}
]
```

4 tabelas criadas. `opportunities` e `opportunity_files` presentes — FK-alvo do migration candidate satisfeitos. ✓

---

### Etapa 3 — `platform/docs/sql_proposals/ORCAMENTISTA_002_BASELINE_ORCAMENTOS_ORCAMENTO_ITENS.sql`

| Item | Detalhe |
|------|---------|
| Resultado da chamada API | `[]` (sucesso — COMMIT) |
| Erro | Nenhum |
| Status | SUCESSO ✓ |

Pos-check parcial:

```json
[
  {"table_name":"orcamento_itens"},
  {"table_name":"orcamentos"}
]
```

2 tabelas criadas. `orcamentos.id` presente como uuid PK — FK-alvo do migration candidate satisfeito. ✓

---

### Etapa 4 — `docs/08_CREATE_PROPOSTAS_MVP.sql`

| Item | Detalhe |
|------|---------|
| Resultado da chamada API | `[]` (sucesso — COMMIT) |
| Erro | Nenhum |
| Status | SUCESSO ✓ |

Pos-check parcial: `propostas` presente.

---

### Script bloqueado

`docs/07_RLS_OPPORTUNITIES_MVP.sql` — NAO executado nesta fase, conforme autorizacao. ✓

## 5. Pos-checks Finais

### F1 — Total de tabelas publicas criadas

**17 tabelas** (resultado exato):

| # | Tabela | Script origem | FK-alvo do migration candidate |
|---|--------|---------------|-------------------------------|
| 1 | `_schema_version` | SCHEMA_OFICIAL_V1 | NAO |
| 2 | `alias_conhecimento` | SCHEMA_OFICIAL_V1 | NAO |
| 3 | `contacts` | 06_CREATE_OPPORTUNITIES_MVP | NAO |
| 4 | `diario_obra` | SCHEMA_OFICIAL_V1 | NAO |
| 5 | `equipes_cadastro` | SCHEMA_OFICIAL_V1 | NAO |
| 6 | `equipes_presenca` | SCHEMA_OFICIAL_V1 | NAO |
| 7 | `fotos` | SCHEMA_OFICIAL_V1 | NAO |
| 8 | `notas` | SCHEMA_OFICIAL_V1 | NAO |
| 9 | `obras` | SCHEMA_OFICIAL_V1 | NAO (base para FK de opportunities) |
| 10 | `opportunities` | 06_CREATE_OPPORTUNITIES_MVP | **SIM** — `opportunity_id` em todas as 9 tabelas pipeline |
| 11 | `opportunity_events` | 06_CREATE_OPPORTUNITIES_MVP | NAO |
| 12 | `opportunity_files` | 06_CREATE_OPPORTUNITIES_MVP | **SIM** — `opportunity_file_id` no candidate |
| 13 | `orcamento_itens` | ORCAMENTISTA_002 | NAO |
| 14 | `orcamentos` | ORCAMENTISTA_002 | **SIM** — `orcamento_id` em todas as 9 tabelas pipeline |
| 15 | `pendencias` | SCHEMA_OFICIAL_V1 | NAO |
| 16 | `propostas` | 08_CREATE_PROPOSTAS_MVP | NAO |
| 17 | `servicos` | SCHEMA_OFICIAL_V1 | NAO |

### F2 — Colunas FK-alvo do migration candidate

| Tabela | Coluna | Tipo | Nullable | Status |
|--------|--------|------|----------|--------|
| `opportunities` | `id` | `uuid` | NO | CONFIRMADO ✓ |
| `opportunity_files` | `id` | `uuid` | NO | CONFIRMADO ✓ |
| `orcamentos` | `id` | `uuid` | NO | CONFIRMADO ✓ |

### F3 — 9 tabelas pipeline Reader/Verifier/HITL

Resultado: `[]` — todas ausentes. ✓

| Tabela pipeline | Status |
|-----------------|--------|
| `orc_reader_runs` | AUSENTE ✓ |
| `orc_reader_outputs` | AUSENTE ✓ |
| `orc_reader_safety_evaluations` | AUSENTE ✓ |
| `orc_verifier_runs` | AUSENTE ✓ |
| `orc_reader_verifier_comparisons` | AUSENTE ✓ |
| `orc_reader_verifier_divergences` | AUSENTE ✓ |
| `orc_hitl_issues` | AUSENTE ✓ |
| `orc_hitl_decisions` | AUSENTE ✓ |
| `orc_context_snapshots` | AUSENTE ✓ |

**4B.1 nao foi executada.** ✓

### F4 — RLS por tabela

| Tabela | RLS (rowsecurity) | Observacao |
|--------|------------------|------------|
| `_schema_version` | false | esperado |
| `alias_conhecimento` | false | esperado |
| `contacts` | false | esperado (07_RLS nao executado) |
| `diario_obra` | false | esperado |
| `equipes_cadastro` | false | esperado |
| `equipes_presenca` | false | esperado |
| `fotos` | false | esperado |
| `notas` | false | esperado |
| `obras` | false | esperado |
| `opportunities` | false | esperado (07_RLS nao executado) |
| `opportunity_events` | false | esperado (07_RLS nao executado) |
| `opportunity_files` | false | esperado (07_RLS nao executado) |
| `orcamento_itens` | false | esperado — RLS pendente para fase posterior |
| `orcamentos` | false | esperado — RLS pendente para fase posterior |
| `pendencias` | false | esperado |
| `propostas` | **true** | habilitado por 08_CREATE_PROPOSTAS_MVP ✓ |
| `servicos` | false | esperado |

Nota: staging sem RLS habilitado nas tabelas de Oportunidades e aceitavel para execucao do migration candidate via service_role (que bypassa RLS). Para uso via anon key, sera necessario habilitar RLS + policies em fase posterior.

### F5 — Policies

| Tabela | Policy | Operacao | Status |
|--------|--------|----------|--------|
| `propostas` | `propostas_open_access` | ALL | CONFIRMADA ✓ |

Nenhuma policy em outras tabelas — esperado (07_RLS_OPPORTUNITIES_MVP.sql nao executado).

### F6 — Foreign Keys confirmadas

| Tabela | Coluna | FK para | Delete rule | Status |
|--------|--------|---------|-------------|--------|
| `diario_obra` | `obra_id` | `obras.id` | CASCADE | ✓ |
| `equipes_cadastro` | `obra_id` | `obras.id` | CASCADE | ✓ |
| `equipes_presenca` | `obra_id` | `obras.id` | CASCADE | ✓ |
| `fotos` | `obra_id` | `obras.id` | CASCADE | ✓ |
| `notas` | `obra_id` | `obras.id` | CASCADE | ✓ |
| `opportunities` | `contact_id` | `contacts.id` | SET NULL | ✓ |
| `opportunities` | `obra_id` | `obras.id` | SET NULL | ✓ |
| `opportunity_events` | `opportunity_id` | `opportunities.id` | CASCADE | ✓ |
| `opportunity_files` | `opportunity_id` | `opportunities.id` | CASCADE | ✓ |
| `orcamento_itens` | `orcamento_id` | `orcamentos.id` | CASCADE | ✓ |
| `pendencias` | `obra_id` | `obras.id` | CASCADE | ✓ |
| `propostas` | `opportunity_id` | `opportunities.id` | SET NULL | ✓ |
| `servicos` | `obra_id` | `obras.id` | CASCADE | ✓ |

13 FKs confirmadas. FK critica `orcamento_itens.orcamento_id → orcamentos.id CASCADE` presente. ✓

### F6b — Indices em `orcamentos` e `orcamento_itens`

| Indice | Tabela | Status |
|--------|--------|--------|
| `orcamentos_pkey` | `orcamentos` | ✓ |
| `idx_orcamentos_obra_id` | `orcamentos` | ✓ |
| `orcamento_itens_pkey` | `orcamento_itens` | ✓ |
| `idx_orcamento_itens_orcamento_id` | `orcamento_itens` | ✓ |

## 6. Criterios de Sucesso — Checklist Final

- [x] Todos os 4 scripts executaram sem erro.
- [x] 17 tabelas publicas presentes apos execucao completa.
- [x] `opportunities.id` uuid NOT NULL presente.
- [x] `orcamentos.id` uuid NOT NULL presente.
- [x] `opportunity_files.id` uuid NOT NULL presente.
- [x] FK `orcamento_itens.orcamento_id → orcamentos.id CASCADE` presente.
- [x] FK `propostas.opportunity_id → opportunities.id SET NULL` presente.
- [x] FK `opportunities.obra_id → obras.id SET NULL` presente.
- [x] Indices `idx_orcamentos_obra_id` e `idx_orcamento_itens_orcamento_id` presentes.
- [x] 9 tabelas pipeline AUSENTES.
- [x] gen_random_uuid() funcional.
- [x] `propostas` com RLS habilitado e policy aberta MVP.
- [x] Nenhuma tabela inesperada criada.

**Todos os 13 criterios de sucesso atingidos.** ✓

## 7. Erros Encontrados

| Etapa | Erro | Resolucao |
|-------|------|-----------|
| Etapa 1 (1a tentativa) | UnicodeDecodeError — encoding cp1252 do sistema | Resolvido: `encoding='utf-8'` no open() |
| Pos-check F6c (1a tentativa) | Coluna `polname` inexistente em pg 17.6 | Resolvido: coluna correta e `policyname` |

Nenhum erro de SQL nos scripts. Nenhuma tabela parcialmente criada. Nenhum rollback necessario.

## 8. Pendencias Remanescentes

| # | Pendencia | Impacto | Quando tratar |
|---|-----------|---------|---------------|
| 1 | RLS nao habilitado em contacts, opportunities, opportunity_events, opportunity_files | Acesso via anon key sem controle por role | Fase posterior de RLS baseline — 07_RLS_OPPORTUNITIES_MVP.sql revisado |
| 2 | RLS e policies de orcamentos e orcamento_itens ausentes | Idem | Fase posterior de RLS baseline |
| 3 | 4B.1 ainda nao executada | Migration candidate ainda nao aplicada | Proximo passo apos este relatorio |

## 9. Decisao Objetiva

**BASELINE APLICADO COM SUCESSO.**

O staging `vtlepoljlqmjwuauygni` possui agora o schema base operacional minimo exigido pelas FKs do migration candidate Reader/Verifier/HITL:

- `opportunities.id` (uuid) ✓
- `orcamentos.id` (uuid) ✓
- `opportunity_files.id` (uuid) ✓

**4B.1 pode ser considerada na proxima fase (4B.S5 ou diretamente 4B.1), sujeita a autorizacao humana explicita.**

## 10. Recomendacao

**Avancar para 4B.S5 — Staging Preflight para 4B.1.**

Antes de executar o migration candidate:

1. Re-executar pre-checks read-only no staging para confirmar estado pos-baseline.
2. Confirmar que as 9 tabelas pipeline continuam ausentes.
3. Confirmar tipos FK-alvo (`opportunities.id`, `orcamentos.id`, `opportunity_files.id`).
4. Revisar o migration candidate (ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_MIGRATION_CANDIDATE.sql).
5. Obter autorizacao humana explicita para 4B.1.
6. Executar o migration candidate contra `vtlepoljlqmjwuauygni`.
7. Executar pos-checks de 4B.1.

## 11. Verificacoes Locais

```
npm run lint:
> react-example@0.0.0 lint
> tsc --noEmit
[sem erros]

git diff --check:
CLEAN

git status --short --branch:
## main...origin/main
[working tree limpa]
```

## 12. Confirmacoes da Fase 4B.S4.E

- 4 scripts SQL executados somente contra `vtlepoljlqmjwuauygni`.
- Nenhum script executado contra `jwutiebpfauwzzltwgbb`.
- Nenhum codigo operacional/UI alterado.
- Nenhum `.env` alterado.
- Nenhum secret exposto.
- Nenhum commit realizado.
- 4B.1 nao foi executada.
- Migration candidate Reader/Verifier/HITL nao foi aplicada.
- 9 tabelas pipeline continuam ausentes no staging.
