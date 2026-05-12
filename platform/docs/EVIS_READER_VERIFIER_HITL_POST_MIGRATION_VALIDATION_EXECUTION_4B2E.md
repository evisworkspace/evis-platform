# EVIS - Reader/Verifier/HITL Post-Migration Validation Execution

> Fase: 4B.2.E
> Tipo: relatorio documental de execucao de testes de validacao pos-migration
> Data de execucao: 2026-05-12
> Status: validacao pos-migration aprovada
> Staging usado: `vtlepoljlqmjwuauygni`
> Producao bloqueada: `jwutiebpfauwzzltwgbb`

## 1. Objetivo da fase

Executar testes controlados no Supabase staging para validar funcionalmente as 9 tabelas Reader/Verifier/HITL criadas na Fase 4B.1.E:

- inserts minimos validos;
- constraints CHECK;
- FKs externas;
- FKs internas;
- UNIQUE/dedupe;
- triggers de protecao;
- imutabilidade e append-only;
- auditoria RLS;
- ausencia de residuos apos rollback.

## 2. Ambiente e seguranca de alvo

| Item | Resultado |
|------|-----------|
| Project ref usado | `vtlepoljlqmjwuauygni` |
| Endpoint usado | `POST https://api.supabase.com/v1/projects/vtlepoljlqmjwuauygni/database/query` |
| Plano de referencia | `platform/docs/EVIS_READER_VERIFIER_HITL_POST_MIGRATION_VALIDATION_PLAN_4B2P.md` |
| Marcador sintetico | `EVIS_TEST_4B2` |
| Producao | Nao usada |
| Ref de producao bloqueado | `jwutiebpfauwzzltwgbb` |
| Configuracao local `supabase/.temp` | Aponta para producao e nao foi usada |
| Secrets | Nao expostos |
| `.env` | Nao alterado |
| Codigo/UI/schema/RLS/policies | Nao alterados |
| Migrations | Nenhuma migration aplicada |
| Commit | Nenhum commit realizado |

Todas as chamadas SQL foram feitas com endpoint hardcoded para `vtlepoljlqmjwuauygni`. Nenhuma chamada foi feita ao endpoint de producao.

## 3. Pre-checks read-only executados

| Check | Expected outcome | Actual outcome |
|-------|------------------|----------------|
| `SELECT version()` | PostgreSQL remoto acessivel | PostgreSQL 17.6 confirmado |
| Tabelas `public` | 26 tabelas | 26 tabelas |
| Tabelas pipeline presentes | 9 tabelas | 9 tabelas |
| RLS habilitado nas pipeline | 9 tabelas com `rowsecurity = true` | 9 |
| Policies nas pipeline | 0 policies | 0 |
| Triggers de protecao | 3 triggers | 3 |
| Funcoes `fn_orc_*` | 2 funcoes | 2 |
| UNIQUE dedupe | 1 constraint | 1 (`orc_divergences_dedupe_unique`) |
| Dados antes dos testes | `count(*) = 0` nas 9 pipeline | todas 0 |

Triggers confirmados:

- `trg_orc_reader_outputs_prevent_raw_update`
- `trg_orc_hitl_decisions_no_update_delete`
- `trg_orc_hitl_decisions_no_truncate`

Funcoes confirmadas:

- `fn_orc_reader_outputs_prevent_raw_update`
- `fn_orc_hitl_decisions_append_only`

## 4. Testes validos executados

### Bloco B - Happy path completo

Executado em transacao explicita com `BEGIN; ... ROLLBACK;`.

Fluxo validado:

1. `opportunities`
2. `opportunity_files`
3. `orcamentos`
4. `orc_reader_runs`
5. `orc_reader_outputs`
6. `orc_reader_safety_evaluations`
7. `orc_verifier_runs`
8. `orc_reader_verifier_comparisons`
9. `orc_reader_verifier_divergences`
10. `orc_hitl_issues`
11. `orc_hitl_decisions`
12. `orc_context_snapshots`

| Expected outcome | Actual outcome |
|------------------|----------------|
| Inserir o fluxo Reader -> Verifier -> Divergence -> HITL -> Decision -> Context Snapshot sem violacoes | Sucesso |
| Encerrar a transacao com rollback | Sucesso; retorno final `happy_path_rolled_back` |
| Nao persistir dados | Confirmado nos pos-checks |

### Controle positivo de trigger

| Teste | Expected outcome | Actual outcome |
|-------|------------------|----------------|
| F2 - `UPDATE orc_reader_outputs.normalized_output_json` | Permitido, pois somente `raw_output_json` e imutavel | Sucesso; rollback confirmado com retorno `normalized_update_rolled_back` |

## 5. Testes invalidos executados

Todos os testes negativos foram executados em transacoes isoladas com marcador `EVIS_TEST_4B2`. O erro HTTP retornado pela Management API foi `400 Bad Request`, contendo erro SQL esperado.

### Bloco C - CHECK constraints

| ID | Violacao | Expected outcome | Actual outcome |
|----|----------|------------------|----------------|
| C1 | `orc_reader_runs.page_number = 0` | `check_violation` | Erro esperado recebido |
| C2 | `orc_reader_runs.page_number = -1` | `check_violation` | Erro esperado recebido |
| C3 | `orc_reader_runs.reader_motor = ''` | `check_violation` | Erro esperado recebido |
| C4 | `orc_reader_runs.reader_motor = '   '` | `check_violation` | Erro esperado recebido |
| C5 | `orc_reader_runs.status = 'invalid_status'` | `check_violation` | Erro esperado recebido |
| C6 | `orc_hitl_issues.severity = 'invalid'` | `check_violation` | Erro esperado recebido |
| C7 | `orc_hitl_decisions.decision_type = 'invalid'` | `check_violation` | Erro esperado recebido |
| C8 | `orc_reader_verifier_comparisons.agreement_score = 1.5` | `check_violation` | Erro esperado recebido |
| C9 | `orc_reader_verifier_comparisons.agreement_score = -0.1` | `check_violation` | Erro esperado recebido |
| C10 | `orc_reader_verifier_comparisons.agreement_band = 'extreme'` | `check_violation` | Erro esperado recebido |
| C11 | `orc_reader_outputs.confidence_score = 2.0` | `check_violation` | Erro esperado recebido |
| C12 | `orc_reader_outputs.identified_count = -1` | `check_violation` | Erro esperado recebido |
| C13 | Safety com `blocks_consolidation = true` e `allowed_to_dispatch = true` | `check_violation` em `orc_reader_safety_block_dispatch_ck` | Erro esperado recebido |
| C14 | Comparison com `blocks_consolidation = true` e `allowed_to_dispatch = true` | `check_violation` em `orc_comp_block_dispatch_ck` | Erro esperado recebido |
| C15 | `orc_hitl_issues` sem fonte identificavel | `check_violation` em `orc_hitl_issue_has_source_ck` | Erro esperado recebido |
| C16 | `orc_context_snapshots` sem fonte identificavel | `check_violation` em `orc_context_snapshot_has_source_ck` | Erro esperado recebido |

Resultado do bloco CHECK: aprovado.

### Bloco D - FKs externas e internas

| ID | Violacao | Expected outcome | Actual outcome |
|----|----------|------------------|----------------|
| D1 | `orc_reader_runs.opportunity_id` inexistente | `foreign_key_violation` | Erro esperado recebido |
| D2 | `orc_reader_runs.opportunity_file_id` inexistente | `foreign_key_violation` | Erro esperado recebido |
| D3 | `orc_reader_outputs.reader_run_id` inexistente | `foreign_key_violation` | Erro esperado recebido |
| D4 | `orc_hitl_decisions.hitl_issue_id` inexistente | `foreign_key_violation` | Erro esperado recebido |
| D5 | `DELETE` de `opportunities` apos inserir `orc_reader_runs` dependente | `foreign_key_violation` por `RESTRICT` | Erro esperado recebido |

Resultado do bloco FK: aprovado.

### Bloco E - UNIQUE/dedupe

| ID | Violacao | Expected outcome | Actual outcome |
|----|----------|------------------|----------------|
| E1 | Duas divergencias com mesmo `(comparison_id, dedupe_key)` | `unique_violation` em `orc_divergences_dedupe_unique` | Erro esperado recebido |

Resultado do bloco UNIQUE/dedupe: aprovado.

### Bloco F - Triggers de protecao

| ID | Acao | Expected outcome | Actual outcome |
|----|------|------------------|----------------|
| F1 | `UPDATE orc_reader_outputs.raw_output_json` | Exception `raw_output_json is immutable after insert` | Erro esperado recebido |
| F2 | `UPDATE orc_reader_outputs.normalized_output_json` | Sucesso | Sucesso com rollback |
| F3 | `UPDATE orc_hitl_decisions` | Exception `orc_hitl_decisions is append-only: UPDATE is not allowed` | Erro esperado recebido |
| F4 | `DELETE FROM orc_hitl_decisions` | Exception `orc_hitl_decisions is append-only: DELETE is not allowed` | Erro esperado recebido |
| F5 | `TRUNCATE public.orc_hitl_decisions` dentro de transacao | Exception `orc_hitl_decisions is append-only: TRUNCATE is not allowed` | Erro esperado recebido |

Resultado do bloco triggers: aprovado.

## 6. Auditoria RLS read-only

| Check | Expected outcome | Actual outcome |
|-------|------------------|----------------|
| RLS nas 9 tabelas pipeline | `rowsecurity = true` | 9/9 true |
| Policies nas 9 tabelas pipeline | 0 policies | 0 |
| Force RLS | `relforcerowsecurity = false` | 9/9 false |
| Criacao/alteracao de policies | Proibida | Nenhuma policy criada ou alterada |

Resultado da auditoria RLS: aprovado.

## 7. Pos-checks finais e cleanup

| Check | Expected outcome | Actual outcome |
|-------|------------------|----------------|
| Contagem final nas 9 pipeline | Todas 0 | Todas 0 |
| Marcador `EVIS_TEST_4B2` nas 9 pipeline | 0 ocorrencias persistidas | 0 |
| Tabelas `public` | 26 | 26 |
| Baseline | 17 tabelas baseline continuam presentes | Confirmado por 26 totais - 9 pipeline |
| Tabelas pipeline | 9 | 9 |
| Policies | 0 | 0 |
| Producao | Nao usada | Confirmado |

Contagem final:

| Tabela | `count(*)` | Marcadores persistidos |
|--------|------------|------------------------|
| `orc_reader_runs` | 0 | 0 |
| `orc_reader_outputs` | 0 | 0 |
| `orc_reader_safety_evaluations` | 0 | 0 |
| `orc_verifier_runs` | 0 | 0 |
| `orc_reader_verifier_comparisons` | 0 | 0 |
| `orc_reader_verifier_divergences` | 0 | 0 |
| `orc_hitl_issues` | 0 | 0 |
| `orc_hitl_decisions` | 0 | 0 |
| `orc_context_snapshots` | 0 | 0 |

Cleanup defensivo nao foi necessario, pois todas as escritas foram revertidas por rollback e os pos-checks ficaram zerados.

## 8. Erros inesperados

Nenhum erro inesperado foi observado.

Nenhum teste negativo retornou sucesso indevido.

Nenhum dado residual foi encontrado.

## 9. Decisao objetiva

**Validacao pos-migration aprovada.**

Todos os blocos obrigatorios foram executados:

- A - Pre-checks read-only: aprovado;
- B - Happy path completo: aprovado com rollback;
- C - CHECK constraints invalidas: aprovado;
- D - FKs externas/internas invalidas: aprovado;
- E - UNIQUE/dedupe: aprovado;
- F - Triggers e append-only: aprovado;
- G - RLS audit read-only: aprovado;
- H - Pos-checks finais: aprovado.

## 10. Recomendacao

Avancar para **4B.3 - Smoke Test Orçamentista IA**.

