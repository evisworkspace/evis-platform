# EVIS - Reader / Verifier / HITL 4B.0 Environment Preflight

> Fase: 4B.0  
> Tipo: preflight de ambiente staging/sandbox  
> Status: bloqueado para 4B.1; sem SQL de escrita; sem migration aplicada; sem banco alterado  
> Candidate: `platform/docs/sql_proposals/ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_MIGRATION_CANDIDATE.sql`

## 1. Objetivo

Confirmar se existe um ambiente seguro de staging, sandbox descartavel ou clone controlado para executar futuramente a migration candidate Reader / Verifier / HITL.

Esta fase nao aplica migration e nao executa SQL de escrita. Como nao foi encontrado ambiente staging/sandbox inequivoco, nenhuma query foi executada contra banco remoto nesta fase.

## 2. Arquivos lidos

- `platform/docs/EVIS_READER_VERIFIER_HITL_STAGING_SANDBOX_EXECUTION_PLAN.md`
- `platform/docs/sql_proposals/ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_MIGRATION_CANDIDATE.sql`
- `platform/docs/EVIS_REAL_SCHEMA_READONLY_INTROSPECTION_REPORT.md`
- `platform/docs/SCHEMA_GAP_REPORT.md`
- `.env`
- `.env.example`
- `domains/institucional/web/.env`
- `domains/institucional/web/.env.example`
- `supabase/.temp/project-ref`
- `supabase/.temp/linked-project.json`
- `supabase/.temp/pooler-url`
- arquivos de configuracao Supabase no codigo, apenas para identificar nomes de variaveis e refs, sem exibir secrets.

## 3. Ambientes encontrados

| Ambiente | Status | Evidencia | Decisao |
|----------|--------|-----------|---------|
| Producao / real | Encontrado | Project ref `jwutiebpfauwzzltwgbb`, mesmo ref usado na introspeccao real 4A.4 | Nao usar para 4B.1 |
| Staging | Nao confirmado | Nenhum project ref separado encontrado | Pendente |
| Sandbox descartavel | Nao confirmado | Nenhum project ref separado encontrado | Pendente |
| Clone seguro | Nao confirmado | Nenhum snapshot/clone identificado | Pendente |
| Local | Repositorio local encontrado | Sem Supabase local confirmado para esta migration | Nao suficiente para 4B.1 |

Project ref detectado:

```text
jwutiebpfauwzzltwgbb
```

Nome do projeto detectado em `supabase/.temp/linked-project.json`:

```text
Evis TechAI's Project
```

URL Supabase mascarada:

```text
https://jwut...wgbb.supabase.co
```

## 4. Variaveis detectadas sem secrets

Variaveis Supabase encontradas em `.env`:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ACCESS_TOKEN
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Variaveis Supabase encontradas em `.env.example`:

```text
SUPABASE_SERVICE_ROLE_KEY
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Observacoes:

- os valores nao foram exibidos;
- os nomes indicam acesso ao Supabase, inclusive credenciais administrativas;
- o ref detectado aponta para o mesmo projeto real documentado na 4A.4;
- nao foi encontrada separacao clara por nomes como staging, sandbox, clone ou disposable;
- nao foram encontradas variaveis de shell ativas separadas para staging/sandbox.

## 5. Candidate e plano

O plano 4A.7 exige:

- staging, sandbox descartavel ou clone seguro;
- confirmacao explicita de que o ambiente nao e producao;
- backup ou snapshot confirmado;
- pre-checks read-only registrados;
- ausencia das 9 tabelas pipeline confirmada;
- baseline de nao contaminacao registrado;
- testes positivos, negativos, RLS e rollback preparados.

O migration candidate esta marcado como:

```text
MIGRATION CANDIDATE ONLY. DO NOT EXECUTE IN PRODUCTION.
```

Portanto, o candidate nao deve ser aplicado no project ref encontrado nesta fase sem confirmacao humana de que ele e staging/sandbox.

## 6. Queries read-only

Nenhuma query foi executada contra banco remoto nesta fase.

Motivo:

- o unico project ref Supabase encontrado coincide com o ambiente real ja usado na introspeccao 4A.4;
- nao ha confirmacao de que esse project ref seja staging, sandbox ou clone descartavel;
- a regra da fase 4B.0 exige evitar producao quando staging/sandbox nao estiver claro.

Consultas que permanecem pendentes para o ambiente seguro:

- `information_schema.tables`
- `information_schema.columns`
- `pg_extension`
- `pg_tables`
- `pg_policies`
- `pg_indexes`

## 7. Pre-checks de ambiente

| Pre-check | Resultado 4B.0 | Observacao |
|-----------|----------------|------------|
| Project ref / URL registrado | Parcial | Ref real detectado: `jwutiebpfauwzzltwgbb` |
| Confirmacao de que NAO e producao | Falhou | Ambiente nao-producao nao confirmado |
| Staging/sandbox confirmado | Falhou | Nao ha ref separado |
| Backup/snapshot confirmado | Pendente | Nenhum snapshot identificado |
| Role/usuario executor confirmado | Pendente | Credenciais existem, mas nao devem ser usadas sem staging |
| Candidate congelado no repositorio | Confirmado documentalmente | Arquivo candidate encontrado |
| Pre-checks read-only executados | Nao executados | Bloqueados por ausencia de staging claro |
| Ausencia das 9 tabelas pipeline | Pendente para staging | Confirmada apenas no relatorio real 4A.4 |
| Baseline operacional | Pendente para staging | Nenhuma contagem executada nesta fase |
| Rollback a mao | Parcial | Plano/candidate contem rollback comentado; nao testado |

## 8. Tabelas base

As tabelas base foram confirmadas anteriormente no banco real pela 4A.4, mas precisam ser confirmadas novamente no staging/sandbox antes de 4B.1:

```text
opportunities
orcamentos
opportunity_files
orcamento_itens
propostas
obras
diario_obra
```

Status 4B.0:

```text
PENDENTE em staging/sandbox.
```

## 9. Nove tabelas pipeline

Tabelas que devem estar ausentes antes da migration candidate:

```text
orc_reader_runs
orc_reader_outputs
orc_reader_safety_evaluations
orc_verifier_runs
orc_reader_verifier_comparisons
orc_reader_verifier_divergences
orc_hitl_issues
orc_hitl_decisions
orc_context_snapshots
```

Status 4B.0:

```text
PENDENTE em staging/sandbox.
```

Observacao: a ausencia foi confirmada apenas no relatorio real 4A.4. Essa confirmacao nao libera execucao em producao.

## 10. pgcrypto / gen_random_uuid

O relatorio real 4A.4 confirmou `pgcrypto 1.3` e `gen_random_uuid()` no banco real.

Status 4B.0:

```text
PENDENTE em staging/sandbox.
```

## 11. RLS e policies

O relatorio real 4A.4 confirmou RLS habilitado nas tabelas existentes e policies abertas MVP em algumas tabelas base do banco real.

Status 4B.0:

```text
PENDENTE em staging/sandbox.
```

Antes da 4B.1, o ambiente alvo deve registrar:

- RLS atual das tabelas base;
- policies atuais;
- ausencia de policies nas 9 tabelas pipeline antes da migration;
- comportamento esperado apos a migration candidate.

## 12. Baseline operacional

Nenhuma contagem foi executada nesta fase.

Baseline pendente para staging/sandbox:

```text
opportunities
orcamentos
orcamento_itens
propostas
obras
diario_obra
```

O baseline deve ser usado para confirmar nao contaminacao apos testes positivos, negativos, RLS e rollback.

## 13. Bloqueios para 4B.1

4B.1 esta bloqueada pelos seguintes pontos:

- staging/sandbox/clone seguro nao confirmado;
- unico project ref detectado coincide com o ambiente real documentado na 4A.4;
- confirmacao explicita de "NAO e producao" ausente;
- backup/snapshot nao identificado;
- pre-checks read-only nao executados em ambiente seguro;
- ausencia das 9 tabelas pipeline nao confirmada em staging;
- baseline operacional nao registrado em staging;
- operador/role de execucao nao confirmado para ambiente nao-producao.

## 14. Recomendacao

Nao avancar para 4B.1 ainda.

Antes de qualquer execucao do migration candidate:

1. Criar ou confirmar um Supabase staging/sandbox/clone descartavel.
2. Registrar project ref e URL mascarada do ambiente.
3. Confirmar explicitamente que o ambiente nao e producao.
4. Confirmar backup/snapshot.
5. Configurar variaveis separadas para staging/sandbox, sem reutilizar o ref real por engano.
6. Reexecutar esta 4B.0 com queries read-only somente contra o ambiente seguro.
7. Liberar 4B.1 apenas se todos os pre-checks do checklist executivo 4A.7 passarem.

## 15. Confirmacoes da fase

- nenhum SQL de escrita executado;
- nenhuma query remota executada nesta fase;
- nenhuma migration aplicada;
- nenhum banco alterado;
- nenhum dado alterado;
- nenhum Supabase alterado;
- nenhum codigo operacional alterado;
- nenhuma UI alterada;
- nenhum commit realizado;
- 4B.1 permanece bloqueada ate confirmacao de staging/sandbox.
