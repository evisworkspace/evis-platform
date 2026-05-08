# EVIS - Supabase Staging Environment Preflight — Fase 4B.S3

> Fase: 4B.S3  
> Tipo: preflight read-only no ambiente staging  
> Status: preflight concluido; 4B.1 permanece bloqueada; sem SQL de escrita; sem migration aplicada; sem banco alterado  
> Staging project ref: vtlepoljlqmjwuauygni  
> Producao project ref (bloqueado): jwutiebpfauwzzltwgbb

## 1. Objetivo

Executar verificacoes read-only contra o ambiente Supabase staging criado manualmente (`evis-staging`, project ref `vtlepoljlqmjwuauygni`) para:

- confirmar isolamento do staging em relacao ao ambiente real;
- mapear o estado atual do banco staging;
- verificar disponibilidade de pgcrypto e gen_random_uuid();
- verificar ausencia das 9 tabelas pipeline;
- verificar presenca do schema base operacional;
- verificar tipos das FK-alvo do migration candidate;
- verificar estado de RLS e policies;
- decidir objetivamente se 4B.1 pode avancar.

## 2. Confirmacao de Isolamento

| Check | Resultado |
|-------|-----------|
| Staging project ref | `vtlepoljlqmjwuauygni` |
| Producao project ref | `jwutiebpfauwzzltwgbb` |
| Refs sao diferentes | SIM ✓ |
| Staging usado nesta fase | `vtlepoljlqmjwuauygni` exclusivamente ✓ |
| Producao usada nesta fase | NAO ✓ |
| Secrets expostos no chat | NAO ✓ |

## 3. Metodo de Acesso

Supabase Management API — somente queries SELECT:

```
POST https://api.supabase.com/v1/projects/vtlepoljlqmjwuauygni/database/query
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>  [nao exposto]
Content-Type: application/json
```

Variavel usada: `SUPABASE_ACCESS_TOKEN` (token de conta, nivel Management API).  
Nenhuma credencial de staging separada foi necessaria para as queries read-only via Management API.

## 4. Queries Executadas

Todas SELECT-only:

1. `SELECT current_database(), version()` — confirmar conexao e versao PostgreSQL
2. `SELECT name, default_version, installed_version FROM pg_available_extensions WHERE name IN ('pgcrypto', 'uuid-ossp')` — verificar extensoes
3. `SELECT gen_random_uuid() as test_uuid` — confirmar funcao disponivel
4. `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name` — listar tabelas publicas
5. `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('orc_reader_runs', 'orc_reader_outputs', 'orc_reader_safety_evaluations', 'orc_verifier_runs', 'orc_reader_verifier_comparisons', 'orc_reader_verifier_divergences', 'orc_hitl_issues', 'orc_hitl_decisions', 'orc_context_snapshots')` — verificar 9 tabelas pipeline
6. `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('opportunities', 'opportunity_files', 'orcamentos', 'orcamento_itens', 'contacts', 'propostas', 'obras', 'diario_obra', 'opportunity_events')` — verificar baseline operacional
7. `SELECT table_name, column_name, udt_name, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name IN ('opportunities', 'orcamentos', 'opportunity_files') AND column_name = 'id'` — verificar tipos FK-alvo
8. `SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'` — verificar RLS
9. `SELECT pol.polname, cls.relname FROM pg_policy pol JOIN pg_class cls ON pol.polrelid = cls.oid ...` — verificar policies

## 5. Ambiente Confirmado

| Item | Resultado |
|------|-----------|
| Banco | `postgres` |
| Versao PostgreSQL | 17.6 (aarch64-unknown-linux-gnu, GCC 15.2.0, 64-bit) |
| Ambiente | Fresh / vazio |

## 6. Extensoes

| Extensao | Versao disponivel | Versao instalada | Status |
|----------|-------------------|------------------|--------|
| `pgcrypto` | 1.3 | 1.3 | INSTALADA ✓ |
| `uuid-ossp` | 1.1 | 1.1 | INSTALADA ✓ |

## 7. gen_random_uuid()

Resultado: `37109a7d-c257-4a63-bfb4-0ac7ff6145ee`

Status: FUNCIONAL ✓ — sem necessidade de invocacao explicita de pgcrypto no migration candidate.

## 8. Tabelas no Schema Public

Total de tabelas no schema public: **0**

O staging e um projeto Supabase recentemente criado e completamente vazio. Nenhuma tabela foi criada ainda.

## 9. Status das 9 Tabelas Pipeline

| Tabela | Status no Staging |
|--------|------------------|
| `orc_reader_runs` | AUSENTE ✓ |
| `orc_reader_outputs` | AUSENTE ✓ |
| `orc_reader_safety_evaluations` | AUSENTE ✓ |
| `orc_verifier_runs` | AUSENTE ✓ |
| `orc_reader_verifier_comparisons` | AUSENTE ✓ |
| `orc_reader_verifier_divergences` | AUSENTE ✓ |
| `orc_hitl_issues` | AUSENTE ✓ |
| `orc_hitl_decisions` | AUSENTE ✓ |
| `orc_context_snapshots` | AUSENTE ✓ |

Nenhuma das 9 tabelas pipeline existe no staging — migration candidate nao foi aplicada. Sem conflito de CREATE. ✓

## 10. Status do Schema Base Operacional

| Tabela | Status no Staging |
|--------|------------------|
| `contacts` | AUSENTE — BLOQUEADOR |
| `opportunities` | AUSENTE — BLOQUEADOR |
| `opportunity_events` | AUSENTE — BLOQUEADOR |
| `opportunity_files` | AUSENTE — BLOQUEADOR |
| `propostas` | AUSENTE — BLOQUEADOR |
| `orcamentos` | AUSENTE — BLOQUEADOR |
| `orcamento_itens` | AUSENTE — BLOQUEADOR |
| `obras` | AUSENTE — BLOQUEADOR |
| `diario_obra` | AUSENTE — BLOQUEADOR |

O schema base operacional **nao existe no staging**. O migration candidate possui FKs para `opportunities`, `orcamentos` e `opportunity_files` — essas tabelas precisam existir antes da execucao do candidate.

## 11. Tipos das Colunas FK-alvo

| Tabela | Coluna | Tipo esperado | Status no staging |
|--------|--------|---------------|------------------|
| `opportunities` | `id` | uuid NOT NULL | TABELA AUSENTE — pendente |
| `orcamentos` | `id` | uuid NOT NULL | TABELA AUSENTE — pendente |
| `opportunity_files` | `id` | uuid NOT NULL | TABELA AUSENTE — pendente |

Impossivel verificar tipos FK-alvo porque as tabelas base nao existem ainda no staging.

Referencia de tipos confirmados no ambiente real (4A.4):

| Campo | Tipo Real (jwutiebpfauwzzltwgbb) |
|-------|----------------------------------|
| `opportunities.id` | `uuid NOT NULL DEFAULT gen_random_uuid()` |
| `orcamentos.id` | `uuid NOT NULL DEFAULT gen_random_uuid()` |
| `opportunity_files.id` | `uuid NOT NULL DEFAULT gen_random_uuid()` |
| `orcamentos.obra_id` | `text NULL` (sem FK) |

## 12. RLS e Policies

| Item | Status |
|------|--------|
| Tabelas com RLS configurado | 0 (nenhuma tabela existe) |
| Policies no schema public | 0 |

Nada a verificar — staging vazio. RLS sera verificado novamente apos aplicacao do schema base.

## 13. Divergencias e Bloqueadores

| # | Item | Status | Acao necessaria |
|---|------|--------|-----------------|
| 1 | Schema base operacional | AUSENTE — BLOQUEADOR | Aplicar script base no staging antes de 4B.1 |
| 2 | FK-alvo nao verificaveis | pendente | Sera verificado apos schema base aplicado |
| 3 | RLS/policies no baseline | pendente | Sera verificado apos schema base aplicado |

Nao ha bloqueadores tecnicos de infra:
- PostgreSQL 17.6 ✓
- pgcrypto instalado ✓
- gen_random_uuid() funcional ✓
- 9 tabelas pipeline ausentes ✓ (sem conflito)
- Staging isolado do real ✓

O unico bloqueador e a ausencia do schema base operacional.

## 14. Decisao: 4B.1

**4B.1 PERMANECE BLOQUEADA.**

Motivo: o migration candidate possui FKs obrigatorias para `opportunities`, `orcamentos` e `opportunity_files`. Essas tabelas nao existem no staging. A execucao do candidate falharia ao tentar criar as FKs.

Antes de 4B.1, e necessario:

1. Aplicar script base de schema operacional no staging (fase 4B.S4).
2. Re-executar verificacoes read-only para confirmar baseline.
3. Confirmar tipos FK-alvo no staging.
4. Confirmar ausencia das 9 tabelas pipeline apos schema base.
5. Confirmar RLS/policies do baseline.
6. Somente entao considerar 4B.1.

## 15. Proxima Fase Recomendada

**Fase 4B.S4 — Apply Baseline Schema to Staging**

Scripts documentais disponiveis para preparar o staging:

| Script | Conteudo |
|--------|----------|
| `docs/SCHEMA_OFICIAL_V1.sql` | `obras`, `diario_obra` e base operacional de Obra |
| `docs/06_CREATE_OPPORTUNITIES_MVP.sql` | `contacts`, `opportunities`, `opportunity_events`, `opportunity_files` |
| `docs/08_CREATE_PROPOSTAS_MVP.sql` | `propostas` |
| `platform/docs/EVIS_REAL_SCHEMA_READONLY_INTROSPECTION_REPORT.md` | referencia para `orcamentos` e `orcamento_itens` (sem CREATE canonico proprio) |

Pendencia registrada desde 4B.S:

- nao ha `CREATE TABLE` canonico documentado para `orcamentos` e `orcamento_itens` nos arquivos do repositorio;
- antes de aplicar no staging, verificar se existe script completo ou consolidar a partir da introspeccao real 4A.4;
- a aplicacao deve ser autorizada explicitamente para cada script antes de execucao.

## 16. Saidas de Verificacao Local

```
npm run lint:
> react-example@0.0.0 lint
> tsc --noEmit
[sem erros — saida limpa]

git diff --check:
CLEAN

git status --short --branch:
## main...origin/main
[sem alteracoes locais pendentes]
```

## 17. Confirmacoes da Fase 4B.S3

- Nenhum SQL de escrita executado.
- Nenhuma migration aplicada.
- Nenhum banco alterado.
- Nenhum Supabase real (jwutiebpfauwzzltwgbb) usado.
- Nenhum dado alterado.
- Nenhum codigo operacional/UI alterado.
- Nenhuma rota criada.
- Nenhum hook criado.
- Nenhuma FK criada.
- Nenhuma escrita em orcamento_itens.
- Nenhum secret exposto no chat.
- Nenhum commit realizado.
- 4B.1 permanece bloqueada.
