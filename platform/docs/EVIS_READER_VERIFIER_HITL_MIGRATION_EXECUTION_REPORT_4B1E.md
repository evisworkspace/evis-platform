# EVIS - Reader/Verifier/HITL Migration Execution Report

> Fase: 4B.1.E
> Tipo: relatorio de execucao real da migration candidate no staging
> Status: migration aplicada com sucesso; todos os criterios de sucesso atingidos
> Project ref usado: `vtlepoljlqmjwuauygni` (staging)
> Producao bloqueada (nao usada): `jwutiebpfauwzzltwgbb`

## 1. Objetivo

Aplicar a migration candidate Reader/Verifier/HITL no Supabase staging (`vtlepoljlqmjwuauygni`) para criar as 9 tabelas de persistencia auditavel do Orcamentista IA, com pre-checks e pos-checks read-only.

## 2. Confirmacao de Isolamento

| Check | Resultado |
|-------|-----------|
| Project ref usado | `vtlepoljlqmjwuauygni` |
| Producao usada | NAO |
| Ref bloqueado (`jwutiebpfauwzzltwgbb`) referenciado | NAO |
| Secrets expostos no chat/logs | NAO |
| Metodo de acesso | Supabase Management API, Bearer token de conta |
| Endpoint | `https://api.supabase.com/v1/projects/vtlepoljlqmjwuauygni/database/query` |
| User-Agent | `evis-staging-runner/1.0` |

Defesa adicional: o script de execucao realiza `assert 'jwutiebpfauwzzltwgbb' not in REF` antes de qualquer chamada e tambem verifica que o token bloqueado nao consta no SQL enviado.

## 3. Arquivo SQL Executado

```
platform/docs/sql_proposals/ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_MIGRATION_CANDIDATE.sql
```

| Item | Detalhe |
|------|---------|
| Tamanho | 27.859 caracteres |
| Linhas | 496 |
| Encoding | UTF-8 |
| Hash de sanidade | nenhum `jwutiebpfauwzzltwgbb` no conteudo |
| Origem | Fase 4A.5/4A.6 — Security Hardened Candidate |
| Aprovacao | Fase 4B.1.P — `EVIS_READER_VERIFIER_HITL_MIGRATION_FINAL_REVIEW_4B1P.md` |

## 4. Pre-checks Executados

| # | Pre-check | Resultado | Status |
|---|-----------|-----------|--------|
| 1 | `current_database()` + `version()` | `postgres`, PostgreSQL 17.6 aarch64 | PASSOU |
| 2 | Baseline tables presentes | 17 tabelas conforme 4B.S5 | PASSOU |
| 3 | Tipos das FK-alvo | `opportunities.id`, `opportunity_files.id`, `orcamentos.id` = uuid NOT NULL | PASSOU |
| 4 | 9 tabelas pipeline ausentes | `[]` | PASSOU |
| 5 | pgcrypto instalado | versao 1.3 | PASSOU |
| 6 | `gen_random_uuid()` funcional | UUID valido retornado | PASSOU |

Todos os 6 pre-checks passaram. Execucao autorizada.

## 5. Resultado da Execucao

| Item | Detalhe |
|------|---------|
| Endpoint | `POST /v1/projects/vtlepoljlqmjwuauygni/database/query` |
| HTTP status | 201 |
| Tempo de execucao | ~1.5s |
| Response body | `[]` (ultimo statement nao retorna linhas) |
| Erro | Nenhum |
| Statements executados | CREATE TABLE x9, COMMENT, CREATE INDEX x49, CREATE FUNCTION x2, CREATE TRIGGER x3, ALTER ENABLE RLS x9 |
| Status | SUCESSO |

A migration foi enviada como uma unica chamada API contendo todo o conteudo do SQL. PostgreSQL executou em transacao implicita.

## 6. As 9 Tabelas Criadas

Confirmadas via `information_schema.tables`:

| # | Tabela | Presente |
|---|--------|---------|
| 1 | `orc_reader_runs` | SIM |
| 2 | `orc_reader_outputs` | SIM |
| 3 | `orc_reader_safety_evaluations` | SIM |
| 4 | `orc_verifier_runs` | SIM |
| 5 | `orc_reader_verifier_comparisons` | SIM |
| 6 | `orc_reader_verifier_divergences` | SIM |
| 7 | `orc_hitl_issues` | SIM |
| 8 | `orc_hitl_decisions` | SIM |
| 9 | `orc_context_snapshots` | SIM |

Total geral apos execucao: **26 tabelas publicas** (17 baseline + 9 pipeline).

## 7. FKs Externas Confirmadas (para tabelas do baseline)

26 FKs externas confirmadas, todas `ON DELETE RESTRICT`:

| Tabela | FK para `opportunities(id)` | FK para `opportunity_files(id)` | FK para `orcamentos(id)` |
|--------|---------------------------|--------------------------------|-------------------------|
| `orc_reader_runs` | SIM (NOT NULL) | SIM (NOT NULL) | SIM (NULL) |
| `orc_reader_outputs` | SIM (NOT NULL) | SIM (NOT NULL) | SIM (NULL) |
| `orc_reader_safety_evaluations` | SIM (NOT NULL) | SIM (NOT NULL) | SIM (NULL) |
| `orc_verifier_runs` | SIM (NOT NULL) | SIM (NOT NULL) | SIM (NULL) |
| `orc_reader_verifier_comparisons` | SIM (NOT NULL) | SIM (NOT NULL) | SIM (NULL) |
| `orc_reader_verifier_divergences` | SIM (NOT NULL) | SIM (NOT NULL) | SIM (NULL) |
| `orc_hitl_issues` | SIM (NOT NULL) | SIM (NULL) | SIM (NULL) |
| `orc_hitl_decisions` | SIM (NOT NULL) | NAO (correto) | SIM (NULL) |
| `orc_context_snapshots` | SIM (NOT NULL) | SIM (NULL) | SIM (NULL) |

Tipos uuid → uuid coerentes em todas as FKs externas.

## 8. FKs Internas Confirmadas (entre tabelas pipeline)

21 FKs internas confirmadas, todas `ON DELETE RESTRICT`:

| Tabela filha | FKs internas |
|--------------|-------------|
| `orc_reader_outputs` | `reader_run_id` → `orc_reader_runs(id)` |
| `orc_reader_safety_evaluations` | `reader_run_id`, `reader_output_id` |
| `orc_verifier_runs` | `reader_run_id`, `reader_output_id` |
| `orc_reader_verifier_comparisons` | `reader_output_id`, `verifier_run_id` |
| `orc_reader_verifier_divergences` | `comparison_id`, `reader_output_id`, `verifier_run_id` |
| `orc_hitl_issues` | `comparison_id`, `divergence_id`, `reader_output_id`, `reader_run_id`, `verifier_run_id` (todas NULL) |
| `orc_hitl_decisions` | `hitl_issue_id` |
| `orc_context_snapshots` | `comparison_id`, `hitl_issue_id`, `reader_output_id`, `reader_run_id`, `verifier_run_id` (todas NULL) |

Lineage do pipeline integralmente mapeado.

## 9. Indices Confirmados

| Tabela | Indices criados (incluindo PK) |
|--------|-------------------------------|
| `orc_context_snapshots` | 9 |
| `orc_hitl_decisions` | 5 |
| `orc_hitl_issues` | 6 |
| `orc_reader_outputs` | 5 |
| `orc_reader_runs` | 6 |
| `orc_reader_safety_evaluations` | 6 |
| `orc_reader_verifier_comparisons` | 6 |
| `orc_reader_verifier_divergences` | 8 (inclui UNIQUE `orc_divergences_dedupe_unique`) |
| `orc_verifier_runs` | 8 |

Total: **59 indices** (49 secundarios + 9 PKs + 1 unique).

Indices criticos verificados:
- `idx_orc_reader_runs_opp_file_page` (composto opportunity_id + opportunity_file_id + page_number)
- `idx_orc_verifier_runs_opp_status_created` (composto)
- `idx_orc_divergences_comparison_dedupe` (composto)
- Todos os 9 indices `*_opportunity_id`
- Todos os 9 indices `*_orcamento_id`

## 10. Constraints de Integridade

| Tipo | Quantidade | Destaques |
|------|-----------|-----------|
| CHECK constraints (named) | 4 | `orc_reader_safety_block_dispatch_ck`, `orc_comp_block_dispatch_ck`, `orc_hitl_issue_has_source_ck`, `orc_context_snapshot_has_source_ck` |
| CHECK constraints (auto-named) | 43 | Todos os CHECKs inline (status, severity, page_number > 0, length(trim(...)) > 0, etc) |
| UNIQUE constraint | 1 | `orc_divergences_dedupe_unique (comparison_id, dedupe_key)` |

## 11. Triggers de Protecao Confirmados

Verificados via `pg_trigger`:

| Trigger | Tabela | Tipo | Eventos |
|---------|--------|------|---------|
| `trg_orc_reader_outputs_prevent_raw_update` | `orc_reader_outputs` | BEFORE / ROW | UPDATE |
| `trg_orc_hitl_decisions_no_update_delete` | `orc_hitl_decisions` | BEFORE / ROW | UPDATE, DELETE |
| `trg_orc_hitl_decisions_no_truncate` | `orc_hitl_decisions` | BEFORE / STATEMENT | TRUNCATE |

Funcoes acompanhantes em `pg_proc`:
- `public.fn_orc_reader_outputs_prevent_raw_update`
- `public.fn_orc_hitl_decisions_append_only`

Ambas com `SET search_path = public, pg_temp`.

## 12. RLS e Policies

| Tabela | RLS | Policies |
|--------|-----|----------|
| `orc_reader_runs` | ENABLED | nenhuma |
| `orc_reader_outputs` | ENABLED | nenhuma |
| `orc_reader_safety_evaluations` | ENABLED | nenhuma |
| `orc_verifier_runs` | ENABLED | nenhuma |
| `orc_reader_verifier_comparisons` | ENABLED | nenhuma |
| `orc_reader_verifier_divergences` | ENABLED | nenhuma |
| `orc_hitl_issues` | ENABLED | nenhuma |
| `orc_hitl_decisions` | ENABLED | nenhuma |
| `orc_context_snapshots` | ENABLED | nenhuma |

Comportamento esperado e atingido: RLS habilitado sem policies. Acesso liberado apenas para `service_role` (via Management API ou backend autorizado). `anon` e `authenticated` ficam bloqueados ate criacao de policies em fase posterior.

## 13. Confirmacoes de Integridade do Baseline

| Verificacao | Resultado |
|------------|-----------|
| Baseline 17 tabelas preservado | SIM |
| Tabelas baseline alteradas | NAO |
| Linhas inseridas em qualquer tabela pipeline | 0 (todas as 9 tabelas com `count(*) = 0`) |
| Tabelas fora do escopo criadas | NENHUMA — apenas as 9 esperadas |
| Producao alterada | NAO |
| Cascata destrutiva acionada | NAO (todos os FKs sao RESTRICT) |
| Secrets expostos | NAO |

Total final do schema public: **26 tabelas (17 baseline + 9 pipeline)**, conforme planejado.

## 14. Erros e Warnings

| Item | Resultado |
|------|-----------|
| Erros SQL | Nenhum |
| Warnings durante execucao | Nenhum |
| Warnings de seguranca (search_path, RLS aberta) | Nenhum |
| Falhas em pre-checks | Nenhuma |
| Falhas em pos-checks | Nenhuma |

Observacao tecnica menor: a query de pos-check inicial tentou `LIKE 'orc\\_%' ESCAPE` mas retornou vazio devido a interacao entre encoding JSON e `standard_conforming_strings`. Refeito com `IN (...)` explicito e funcionou. Sem impacto no resultado da migration.

## 15. Decisao Objetiva

> [!IMPORTANT]
> **MIGRATION APLICADA COM SUCESSO**
>
> As 9 tabelas pipeline Reader/Verifier/HITL foram criadas no staging `vtlepoljlqmjwuauygni`:
> - Estrutura completa
> - 26 FKs externas + 21 FKs internas
> - 59 indices
> - 48 constraints (CHECK + UNIQUE)
> - 3 triggers de protecao (imutabilidade + append-only + anti-truncate)
> - 2 funcoes de protecao com `search_path` seguro
> - RLS habilitado nas 9 tabelas, sem policies abertas
> - Zero linhas inseridas
> - Baseline preservado integralmente
> - Producao intocada

## 16. Recomendacao

**AVANCAR PARA 4B.2 — Post-Migration Validation.**

Sugestoes para 4B.2:
- Validacao funcional: tentar INSERT de teste com FKs invalidas e confirmar bloqueio
- Validacao de imutabilidade: tentar UPDATE em `orc_reader_outputs.raw_output_json` e confirmar EXCEPTION
- Validacao de append-only: tentar UPDATE/DELETE em `orc_hitl_decisions` e confirmar EXCEPTION
- Validacao de TRUNCATE: tentar TRUNCATE em `orc_hitl_decisions` e confirmar EXCEPTION
- Validacao de unique dedupe: tentar duplicar `(comparison_id, dedupe_key)` e confirmar bloqueio
- Validacao de CHECK: tentar `blocks_consolidation=true AND allowed_to_dispatch=true` e confirmar bloqueio
- Validacao de RLS: confirmar que `anon`/`authenticated` ficam bloqueados sem policies

---

**Confirmacoes finais da Fase 4B.1.E:**

- Migration candidate aplicada no staging `vtlepoljlqmjwuauygni`;
- Producao `jwutiebpfauwzzltwgbb` nao foi usada;
- Nenhum dado de teste/seed foi inserido;
- Nenhum codigo operacional/UI foi alterado;
- Nenhum `.env` foi alterado;
- Nenhum secret foi exposto neste documento;
- 4B.2 esta autorizada a iniciar.
