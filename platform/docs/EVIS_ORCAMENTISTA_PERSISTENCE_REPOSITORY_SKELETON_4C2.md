# EVIS - Orcamentista Persistence Repository Skeleton

> Fase: 4C.2
> Tipo: skeleton server-side do repository de persistencia
> Data: 2026-05-12
> Status: skeleton criado; sem chamada real ao banco; sem integracao com UI
> Staging autorizado (documental): `vtlepoljlqmjwuauygni`
> Producao bloqueada: `jwutiebpfauwzzltwgbb`

## 1. Objetivo da fase

Criar a estrutura base do repository server-side da camada de persistencia do Orcamentista IA, sobre os contratos e guards da 4C.1, sem executar escrita real e sem integrar ao fluxo funcional.

Esta fase nao instancia client Supabase real, nao executa SQL, nao toca banco e nao escreve em `orcamento_itens`.

## 2. Arquivos lidos

Codigo:

- `platform/server/orcamentista/persistence/contracts.ts`
- `platform/server/orcamentista/persistence/guards.ts`
- `platform/server/orcamentista/persistence/index.ts`
- `platform/server/tools/supabaseTools.ts` (padrao existente de acesso Supabase com anon key — referencia)

Documentos:

- `platform/docs/EVIS_ORCAMENTISTA_PERSISTENCE_CONTRACTS_GUARDS_4C1.md`
- `platform/docs/EVIS_ORCAMENTISTA_PERSISTENCE_LAYER_ARCHITECTURE_4C0.md`
- `platform/docs/sql_proposals/ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_MIGRATION_CANDIDATE.sql`

## 3. Arquivos criados/alterados

| Arquivo | Tipo |
|--------|------|
| `platform/server/orcamentista/persistence/errors.ts` | criado |
| `platform/server/orcamentista/persistence/repository.ts` | criado |
| `platform/server/orcamentista/persistence/index.ts` | alterado (export de `errors` e `repository`) |
| `platform/docs/EVIS_ORCAMENTISTA_PERSISTENCE_REPOSITORY_SKELETON_4C2.md` | criado |

Nada fora da pasta `persistence/` foi alterado. Nenhum codigo legado do Orcamentista foi tocado. Nenhuma migration foi modificada. Nenhum `.env` alterado.

## 4. Estrutura do skeleton

### 4.1 `errors.ts`

- `PersistenceStage`: union literal cobrindo os 10 estagios (`file`, `reader_run`, `reader_output`, `safety_evaluation`, `verifier_run`, `comparison`, `divergence`, `hitl_issue`, `hitl_decision`, `context_snapshot`).
- `PersistenceErrorCode`: union para classificar erros (`FOREIGN_KEY_VIOLATION`, `UNIQUE_VIOLATION`, `CHECK_VIOLATION`, `TRIGGER_BLOCKED`, `NOT_NULL_VIOLATION`, `PERMISSION_DENIED`, `NETWORK_ERROR`, `EMPTY_RESPONSE`, `UNKNOWN`).
- `OrcamentistaPersistenceError`: tipo conforme proposto na 4C.0 (code/message/stage/retryable/source_ref).
- `mapPersistenceError(stage, err)`: traduz erros Postgrest-like (com `code` SQLSTATE) para o tipo canonico. Mapeia 23503, 23505, 23514, 23502, 42501, P0001.
- `toPersistenceErrorResult<T>(stage, err)`: retorna `PersistenceResult<T>` no formato `persistence_error`.

### 4.2 `repository.ts`

- `SupabaseLikeClient`: interface minima descrevendo o subset `from(table).insert(row).select(cols).single()`. Estruturalmente compativel com `@supabase/supabase-js`, mas o skeleton nao importa essa biblioteca nem instancia client. O client e sempre INJETADO pelo chamador.
- `SupabaseLikeResponse<T>`, `SupabaseLikeSingleBuilder<T>`, `SupabaseLikeSelectBuilder<T>`, `SupabaseLikeFromBuilder`: tipos auxiliares para tipar o chain.
- `PersistedOpportunityFile`, `PersistedRow`: tipos de retorno minimos.
- `TABLE`: const com nomes canonicos das 10 tabelas, batendo com a allowlist em `guards.ts`.
- `persistRow<T>(...)`: helper interno que:
  1. Chama `validatePersistenceIntent(tableName, payload)` (guard mestre 4C.1).
  2. Se intent falhar (bloqueado, allowlist miss, opportunity_id ausente, consolidacao desativada), retorna o resultado bloqueado sem chamar client.
  3. Se intent passar, faz `client.from(tableName).insert(row).select(cols).single()`.
  4. Mapeia erro via `toPersistenceErrorResult`.
  5. Retorna `PersistenceResult<T>`.

### 4.3 Funcoes skeleton criadas

| # | Funcao | Tabela | Stage | Output |
|---|--------|--------|-------|--------|
| 1 | `createOpportunityFile` | `opportunity_files` | `file` | `PersistedOpportunityFile` |
| 2 | `createReaderRun` | `orc_reader_runs` | `reader_run` | `PersistedRow` |
| 3 | `createReaderOutput` | `orc_reader_outputs` | `reader_output` | `PersistedRow` |
| 4 | `createSafetyEvaluation` | `orc_reader_safety_evaluations` | `safety_evaluation` | `PersistedRow` |
| 5 | `createVerifierRun` | `orc_verifier_runs` | `verifier_run` | `PersistedRow` |
| 6 | `createReaderVerifierComparison` | `orc_reader_verifier_comparisons` | `comparison` | `PersistedRow` |
| 7 | `createReaderVerifierDivergence` | `orc_reader_verifier_divergences` | `divergence` | `PersistedRow` |
| 8 | `createHitlIssue` | `orc_hitl_issues` | `hitl_issue` | `PersistedRow` |
| 9 | `createHitlDecision` | `orc_hitl_decisions` | `hitl_decision` | `PersistedRow` |
| 10 | `createContextSnapshot` | `orc_context_snapshots` | `context_snapshot` | `PersistedRow` |

Cada funcao:
- Recebe `client: SupabaseLikeClient` e o input tipado da 4C.1.
- Constroi `row` aplicando defaults seguros (`?? null`, `?? {}` para JSONB opcionais).
- Delega ao helper `persistRow` que dispara o guard mestre antes de qualquer escrita.
- Retorna `PersistenceResult<T>`.

## 5. Como os guards da 4C.1 foram aplicados

| Guard | Aplicacao no repository |
|-------|------------------------|
| `validatePersistenceIntent(tableName, payload)` | Chamado em `persistRow` antes de qualquer chamada a `client.from()`. Funciona como gate unico para toda funcao do repository. |
| `isTableAllowed` | Disparado dentro de `validatePersistenceIntent`. As 10 funcoes usam nomes do mapa `TABLE` que casam exatamente com a allowlist. |
| `assertNoBudgetItemWrite` | Disparado dentro de `validatePersistenceIntent`. Garante que `orcamento_itens`, `orcamentos`, `opportunities`, `servicos` e `obras` nao sao alcancaveis. |
| `assertOpportunityId` | Cada funcao passa `{ opportunity_id: input.opportunity_id }` para o guard mestre. Inputs como `CreateHitlDecisionInput` que nao herdam de `PipelineBaseInput` tambem expoem `opportunity_id` obrigatorio. |
| `assertNoConsolidationIntent` | Disparado dentro de `validatePersistenceIntent`. `canWriteConsolidationToBudget=false` ainda barra todo o fluxo. |

Resultado: nenhuma funcao do repository chega a chamar `client.from()` se o intent estiver bloqueado.

## 6. Confirmacao: nenhuma escrita direta em `orcamento_itens`

- Nenhum arquivo da pasta `persistence/` contem a string `orcamento_itens` como destino de escrita. O termo aparece apenas em `guards.ts` (blocklist) e em comentarios documentais.
- `TABLE` so referencia as 10 tabelas da allowlist.
- `validatePersistenceIntent` rejeita qualquer chamada com `tableName='orcamento_itens'` antes de qualquer escrita.
- `canWriteConsolidationToBudget` permanece `false`. Mesmo que um chamador externo invente um `tableName='orcamento_itens'` e tente burlar a allowlist (impossivel pelos guards), `assertNoConsolidationIntent` adiciona um segundo nivel de bloqueio logico no fluxo.

## 7. Confirmacao: nenhum client Supabase real hardcoded

- `repository.ts` NAO importa `@supabase/supabase-js`.
- `repository.ts` NAO importa nem usa `platform/server/tools/supabaseTools.ts`.
- `errors.ts` NAO importa client Supabase.
- Nenhuma variavel de ambiente `SUPABASE_*` e referenciada.
- `dotenv` nao e carregado.
- O client e sempre INJETADO via parametro `client: SupabaseLikeClient` nas 10 funcoes.
- Em 4C.2 nao ha nenhum chamador real instanciando esse client.

## 8. O que ficou fora de escopo

- Service/coordinator que orquestra multiplas funcoes (4C.3+).
- Endpoint HTTP que exponha o repository (4C.6+).
- Integracao com a UI (`OrcamentistaTab.tsx`, `OrcamentistaChat.tsx`).
- Substituicao dos mocks de `mockPipeline.ts`, `hitlUtils.ts`, `consolidationGateUtils.ts`.
- Persistencia real em qualquer ambiente (staging ou producao).
- Adapter `pg` ou outra estrategia transacional multi-statement.
- Read models / queries agregadas (`GET /pipeline`).
- Autenticacao/autorizacao da rota.
- Conversao do output do Reader real (`realReaderSandbox`) para os inputs persistidos.
- Testes unitarios automatizados (planejados para 4C.3+).
- Consolidacao oficial em `orcamento_itens` (proibido em todo 4C).

## 9. Riscos

| Risco | Mitigacao |
|-------|-----------|
| Algum caller futuro instanciar um client com chave anon e burlar RLS | A 4C.1 ja documenta que RLS pipeline esta enabled sem policies; recomendar service_role apenas em 4C.6 ao integrar |
| Skeleton inflar com regras de negocio antes do service | Manter cada funcao fina e sem decisao logica; toda orquestracao deve ir para o service em 4C.3+ |
| Tipo `SupabaseLikeClient` divergir do real `SupabaseClient` | Subset estruturalmente compativel; quando o adapter real for criado em 4C.3, basta tipar como `SupabaseClient` (que satisfaz `SupabaseLikeClient`) |
| Funcao chamada sem client (passar `undefined`) | TypeScript previne em compile-time; testes em 4C.3 cobrirao runtime |
| Append-only de `orc_hitl_decisions` ser violado | Repository so expoe `create*`. Nao ha funcao `update*` nem `delete*`. Trigger no banco e segunda linha de defesa |
| Dedupe UNIQUE em divergencias surpreender o caller | Documentado no 4C.0; tratamento do erro `UNIQUE_VIOLATION` agora e categorizado e retornavel ao caller |

## 10. Sequencia recomendada apos 4C.2

### 4C.3 - Reader Persistence

Implementar service que:
- Recebe output normalizado do Reader.
- Chama `createReaderRun`, `createReaderOutput`, `createSafetyEvaluation` em ordem.
- Cria `orc_hitl_issues` se safety bloquear.
- Retorna estado agregado para o caller.

Antes de 4C.3, recomendado: definir adapter server-side oficial (`pg` direto ou Supabase com service_role) numa fase paralela 4C.2.1, ja que o repository depende de client injetado.

### 4C.4 - Verifier and Divergence Persistence
### 4C.5 - HITL and Context Snapshot Persistence
### 4C.6 - Read Models and UI Wiring
### 4C.7 - Controlled Staging Validation

Conforme arquitetura 4C.0, ainda sem consolidacao oficial.

## 11. Decisao objetiva

> [!IMPORTANT]
> **PRONTO PARA 4C.3 — Reader Persistence Service.**
>
> Skeleton completo, tipado, guard-protegido e desacoplado de client real:
> - 10 funcoes de repository
> - Helper `persistRow` aplicando guard mestre antes de qualquer escrita
> - Mapeamento de erros Postgrest-like para tipo canonico
> - Interface `SupabaseLikeClient` injetavel, sem dependencia de runtime
> - Index exporta camada consolidada
> - `npm run lint` (tsc --noEmit) limpo
>
> Antes de avancar para 4C.3, recomendado decidir formalmente o mecanismo de injecao do client real (adapter `pg` direto vs Supabase service_role). Essa decisao nao bloqueia o skeleton atual.

---

**Confirmacoes da Fase 4C.2:**

- nenhum SQL executado;
- nenhum banco alterado;
- nenhum Supabase remoto chamado;
- producao `jwutiebpfauwzzltwgbb` nao foi usada;
- staging `vtlepoljlqmjwuauygni` nao foi tocado;
- nenhum client Supabase real instanciado;
- nenhum secret exposto;
- nenhum `.env` lido nem alterado;
- nenhum codigo legado do Orcamentista alterado;
- nenhum endpoint HTTP criado;
- nenhuma integracao com UI realizada;
- `orcamento_itens` permanece bloqueado em tres niveis (blocklist, guard mestre, flag de consolidacao).
