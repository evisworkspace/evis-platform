# EVIS - Orcamentista IA Controlled Smoke Test Execution

> Fase: 4B.3.E
> Tipo: relatorio documental de execucao de smoke test tecnico controlado
> Data de execucao: 2026-05-12
> Status: smoke test tecnico aprovado
> Staging usado: `vtlepoljlqmjwuauygni`
> Producao bloqueada: `jwutiebpfauwzzltwgbb`

## 1. Objetivo da fase

Executar um smoke test funcional minimo e controlado do Orçamentista IA no Supabase staging, validando o fluxo logico de persistencia:

Lead/Oportunidade sintetica -> opportunity_file sintetico -> Reader Run -> Reader Output -> Safety Evaluation -> Verifier Run -> Reader/Verifier Comparison -> Divergence -> HITL Issue -> HITL Decision -> Context Snapshot -> Gate/contexto -> confirmacao de que `orcamento_itens` nao recebeu escrita direta.

O teste foi executado em transacao explicita com `BEGIN; ... ROLLBACK;`, usando somente dados sinteticos com marcador `EVIS_TEST_4B3`.

## 2. Ambiente e seguranca de alvo

| Item | Resultado |
|------|-----------|
| Project ref usado | `vtlepoljlqmjwuauygni` |
| Endpoint usado | `POST https://api.supabase.com/v1/projects/vtlepoljlqmjwuauygni/database/query` |
| Project ref de producao bloqueado | `jwutiebpfauwzzltwgbb` |
| Producao | Nao usada |
| `supabase/.temp` | Nao usado |
| Plano de referencia | `platform/docs/EVIS_ORCAMENTISTA_SMOKE_TEST_PLAN_4B3P.md` |
| Documentos de apoio | `platform/docs/EVIS_READER_VERIFIER_HITL_POST_MIGRATION_VALIDATION_EXECUTION_4B2E.md`; `platform/docs/sql_proposals/ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_MIGRATION_CANDIDATE.sql` |
| Secrets | Nao expostos |
| `.env` | Nao alterado |
| Codigo/UI | Nao alterados |
| Schema/RLS/policies | Nao alterados |
| Migration | Nenhuma migration aplicada |
| UI/app end-to-end | Nao executado |
| Commit | Nenhum commit realizado |

Todas as chamadas remotas usaram endpoint hardcoded para `vtlepoljlqmjwuauygni`. Nenhuma chamada foi feita ao endpoint de producao.

## 3. Pre-checks read-only executados

| Check | Expected outcome | Actual outcome |
|-------|------------------|----------------|
| `SELECT version()` | PostgreSQL remoto acessivel | PostgreSQL 17.6 confirmado |
| Tabelas `public` | 26 tabelas | 26 tabelas |
| Tabelas pipeline presentes | 9 tabelas | 9 tabelas |
| Contagem inicial das 9 pipeline | Todas 0 | Todas 0 |
| `orcamento_itens` inicial | Contagem conhecida antes do teste | 0 |
| RLS nas 9 pipeline | `relrowsecurity = true` | 9/9 true |
| Policies nas 9 pipeline | 0 policies | 0 |
| Triggers principais | 3 triggers | 3 |
| `supabase/.temp` | Nao usado | Confirmado |

Triggers confirmados:

- `trg_orc_reader_outputs_prevent_raw_update`
- `trg_orc_hitl_decisions_no_update_delete`
- `trg_orc_hitl_decisions_no_truncate`

## 4. Dados sinteticos usados

Marcador obrigatorio: `EVIS_TEST_4B3`.

| Entidade | Dado sintetico |
|----------|----------------|
| `opportunities` | `EVIS_TEST_4B3 Smoke Opportunity` |
| Cliente snapshot | `EVIS_TEST_4B3 Synthetic Client` |
| Workspace | `EVIS_TEST_4B3_workspace` |
| `opportunity_files` | `EVIS_TEST_4B3_document.pdf` |
| Storage path | `EVIS_TEST_4B3/document.pdf` |
| `orcamentos` | `EVIS_TEST_4B3 Smoke Budget` |
| Reader motor | `EVIS_TEST_4B3_reader_v1` |
| Verifier motor | `EVIS_TEST_4B3_verifier_v1` |
| Documento logico | `EVIS_TEST_4B3_DOC_001` |
| Dedupe key | `EVIS_TEST_4B3_DEDUPE_QUANTITY_PAGE_1` |
| Reviewer sintetico | `EVIS_TEST_4B3_SYNTHETIC_REVIEWER` |

Nenhum dado real de cliente, obra, documento, CPF, CNPJ ou valor real foi usado.

## 5. Fluxo executado dentro da transacao

O bloco transacional criou anchors sinteticos e uma linha minima coerente em cada tabela pipeline:

1. `opportunities`
2. `orcamentos`
3. `opportunity_files`
4. `orc_reader_runs`
5. `orc_reader_outputs`
6. `orc_reader_safety_evaluations`
7. `orc_verifier_runs`
8. `orc_reader_verifier_comparisons`
9. `orc_reader_verifier_divergences`
10. `orc_hitl_issues`
11. `orc_hitl_decisions`
12. `orc_context_snapshots`

As tabelas pipeline tocadas dentro da transacao foram:

| Tabela pipeline | Linha criada dentro da transacao |
|-----------------|----------------------------------|
| `orc_reader_runs` | 1 |
| `orc_reader_outputs` | 1 |
| `orc_reader_safety_evaluations` | 1 |
| `orc_verifier_runs` | 1 |
| `orc_reader_verifier_comparisons` | 1 |
| `orc_reader_verifier_divergences` | 1 |
| `orc_hitl_issues` | 1 |
| `orc_hitl_decisions` | 1 |
| `orc_context_snapshots` | 1 |

O teste terminou com `ROLLBACK` obrigatorio.

## 6. Validacao do lineage

O lineage Reader/Verifier/HITL foi validado dentro da transacao por join completo entre:

- `orc_reader_runs`
- `orc_reader_outputs`
- `orc_reader_safety_evaluations`
- `orc_verifier_runs`
- `orc_reader_verifier_comparisons`
- `orc_reader_verifier_divergences`
- `orc_hitl_issues`
- `orc_hitl_decisions`
- `orc_context_snapshots`

| Expected outcome | Actual outcome |
|------------------|----------------|
| Join completo retorna exatamente 1 fluxo coerente | Sucesso |
| Todas as linhas compartilham a mesma `opportunity_id` sintetica | Sucesso |
| `reader_output` referencia o `reader_run` correto | Sucesso |
| `safety_evaluation` referencia `reader_run` e `reader_output` corretos | Sucesso |
| `verifier_run` referencia `reader_run` e `reader_output` corretos | Sucesso |
| `comparison` referencia `reader_output` e `verifier_run` corretos | Sucesso |
| `divergence` referencia `comparison`, `reader_output` e `verifier_run` corretos | Sucesso |
| `hitl_issue` referencia `comparison` e `divergence` corretos | Sucesso |
| `hitl_decision` referencia `hitl_issue` correto | Sucesso |
| `context_snapshot` referencia `hitl_issue` e `comparison` corretos | Sucesso |

Resultado do lineage: aprovado.

## 7. Validacao do gate/context snapshot

O context snapshot foi criado dentro da transacao com:

| Campo | Valor |
|-------|-------|
| `phase` | `4B.3.E controlled smoke test` |
| `context_status` | `blocked` |
| `source_type` | `hitl_decision` |
| `gate` no JSON | `blocked` |
| `can_write_to_budget` no JSON | `false` |
| `dispatch_released` no JSON | `false` |
| `consolidation_released` no JSON | `false` |

| Expected outcome | Actual outcome |
|------------------|----------------|
| Context snapshot representa gate bloqueado | Sucesso |
| `context_status = 'blocked'` | Sucesso |
| `can_write_to_budget = false` | Sucesso |
| Consolidacao oficial permanece bloqueada | Sucesso |

Resultado do gate/context snapshot: aprovado.

## 8. Protecao de `orcamento_itens`

O smoke test nao executou `INSERT`, `UPDATE` ou `DELETE` em `public.orcamento_itens`.

Protecoes aplicadas:

- guard local bloqueando padroes proibidos no SQL antes da chamada remota;
- somente `SELECT count(*)` em `orcamento_itens`;
- comparacao de contagem antes/depois dentro da transacao;
- pos-check read-only apos rollback.

| Check | Expected outcome | Actual outcome |
|-------|------------------|----------------|
| Contagem inicial de `orcamento_itens` | Valor conhecido | 0 |
| Contagem dentro da transacao apos pipeline | Igual ao inicial | 0 |
| Contagem final apos rollback | Igual ao inicial | 0 |
| Escrita direta em `orcamento_itens` | Nenhuma | Confirmado |

Resultado: `orcamento_itens` nao recebeu escrita direta.

## 9. Rollback e cleanup

O teste foi executado com:

```sql
BEGIN;
  -- anchors sinteticas
  -- 9 linhas pipeline
  -- asserts de lineage, gate e orcamento_itens
ROLLBACK;
```

Pos-checks apos rollback:

| Check | Expected outcome | Actual outcome |
|-------|------------------|----------------|
| Total nas 9 pipeline | 0 | 0 |
| Marcador `EVIS_TEST_4B3` nas 9 pipeline | 0 | 0 |
| Marcador `EVIS_TEST_4B3` em `opportunities` | 0 | 0 |
| Marcador `EVIS_TEST_4B3` em `opportunity_files` | 0 | 0 |
| Marcador `EVIS_TEST_4B3` em `orcamentos` | 0 | 0 |
| `orcamento_itens` | Sem mudanca | 0 |
| Tabelas `public` | 26 | 26 |
| RLS nas pipeline | 9/9 true | 9/9 true |
| Policies nas pipeline | 0 | 0 |
| Triggers principais | 3 | 3 |

Contagem final das 9 tabelas pipeline:

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

Cleanup defensivo nao foi necessario.

## 10. Erros encontrados

Nenhum erro inesperado foi observado.

Nenhum assert transacional falhou.

Nenhuma linha residual foi encontrada.

## 11. Confirmacoes de escopo

| Restricao | Resultado |
|-----------|-----------|
| Nao usar producao | Cumprido |
| Nao usar `jwutiebpfauwzzltwgbb` em endpoint/chamada | Cumprido |
| Nao usar `supabase/.temp` | Cumprido |
| Nao alterar `.env` | Cumprido |
| Nao alterar codigo/UI | Cumprido |
| Nao alterar schema | Cumprido |
| Nao aplicar migration | Cumprido |
| Nao criar policies | Cumprido |
| Nao alterar RLS | Cumprido |
| Nao executar UI/app end-to-end | Cumprido |
| Nao usar dados reais | Cumprido |
| Nao deixar residuos | Cumprido |
| Nao escrever em `orcamento_itens` | Cumprido |

## 12. Decisao objetiva

**Smoke test tecnico aprovado.**

O fluxo minimo foi validado em staging com dados sinteticos, dentro de transacao rollbackavel, cobrindo Reader -> Output -> Safety -> Verifier -> Comparison -> Divergence -> HITL Issue -> HITL Decision -> Context Snapshot/Gate.

## 13. Recomendacao

Avancar para a **camada de persistencia do Orçamentista**, implementando service/server adapters oficiais para:

- registrar `opportunity_files`;
- persistir as 9 tabelas pipeline Reader/Verifier/HITL;
- manter a consolidacao em `orcamento_itens` bloqueada ate fase futura de consolidacao controlada.

Nao recomendar ainda smoke end-to-end via UI/app, pois a camada canonica de persistencia do pipeline ainda nao existe.
