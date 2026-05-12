# EVIS - Orcamentista Persistence Core

> Fase: 4C.CORE
> Tipo: implementacao documental da camada core de persistencia server-side
> Data: 2026-05-12
> Status: core implementado; sem chamada remota real; sem integracao com UI

## 1. Objetivo da fase

Implementar os adapters core server-side para orquestrar, via repository injetado, a persistencia logica do pipeline Orçamentista IA:

- Reader persistence;
- Verifier/comparison/divergence persistence;
- HITL/context snapshot persistence.

Esta fase nao executou SQL, nao alterou banco, nao criou endpoint HTTP, nao integrou UI e nao chamou Supabase real. O repository continua dependendo de client injetado pelo chamador.

## 2. Arquivos lidos

- `platform/server/orcamentista/persistence/contracts.ts`
- `platform/server/orcamentista/persistence/guards.ts`
- `platform/server/orcamentista/persistence/errors.ts`
- `platform/server/orcamentista/persistence/repository.ts`
- `platform/server/orcamentista/persistence/index.ts`
- `platform/docs/EVIS_ORCAMENTISTA_PERSISTENCE_CONTRACTS_GUARDS_4C1.md`
- `platform/docs/EVIS_ORCAMENTISTA_PERSISTENCE_REPOSITORY_SKELETON_4C2.md`
- `platform/docs/EVIS_ORCAMENTISTA_PERSISTENCE_LAYER_ARCHITECTURE_4C0.md`

## 3. Arquivos criados ou alterados

| Arquivo | Acao |
|---------|------|
| `platform/server/orcamentista/persistence/readerPersistence.ts` | criado |
| `platform/server/orcamentista/persistence/verifierPersistence.ts` | criado |
| `platform/server/orcamentista/persistence/hitlPersistence.ts` | criado |
| `platform/server/orcamentista/persistence/repository.ts` | alterado para expor repository injetavel |
| `platform/server/orcamentista/persistence/guards.ts` | ajustado para bloquear intent de consolidacao, sem bloquear writes pipeline permitidos |
| `platform/server/orcamentista/persistence/index.ts` | alterado para exportar adapters core |
| `platform/docs/EVIS_ORCAMENTISTA_PERSISTENCE_CORE_4C_CORE.md` | criado |

Nada fora de `platform/server/orcamentista/persistence/` e `platform/docs/` foi alterado.

## 4. Funcoes implementadas

### 4.1 Reader

`persistReaderStage(repository, input)` em `readerPersistence.ts`:

1. opcionalmente registra `opportunity_files`;
2. cria `orc_reader_runs`;
3. cria `orc_reader_outputs`;
4. cria `orc_reader_safety_evaluations`;
5. retorna `PersistenceResult<PersistReaderStageData>` com lineage minimo:
   - `opportunity_file_id`;
   - `reader_run_id`;
   - `reader_output_id`;
   - `safety_evaluation_id`.

### 4.2 Verifier

`persistVerifierStage(repository, input)` em `verifierPersistence.ts`:

1. cria `orc_verifier_runs`;
2. cria `orc_reader_verifier_comparisons`;
3. cria zero ou mais `orc_reader_verifier_divergences`;
4. retorna `PersistenceResult<PersistVerifierStageData>` com lineage:
   - `verifier_run_id`;
   - `comparison_id`;
   - `divergence_ids`.

### 4.3 HITL e contexto

`persistHitlStage(repository, input)` em `hitlPersistence.ts`:

1. valida ausencia de intent de consolidacao oficial;
2. cria `orc_hitl_issues`;
3. opcionalmente cria `orc_hitl_decisions`;
4. opcionalmente cria `orc_context_snapshots`;
5. retorna `PersistenceResult<PersistHitlStageData>` com lineage:
   - `hitl_issue_id`;
   - `hitl_decision_id`;
   - `context_snapshot_id`.

`persistContextSnapshot(repository, input)` em `hitlPersistence.ts`:

1. valida ausencia de intent de consolidacao oficial;
2. delega a criacao de snapshot ao repository;
3. retorna `PersistenceResult<PersistedRow>`.

## 5. Repository injetavel

`repository.ts` agora exporta:

- `OrcamentistaPersistenceRepository`;
- `createOrcamentistaPersistenceRepository(client)`.

O factory apenas encapsula as funcoes skeleton existentes e continua exigindo um `SupabaseLikeClient` injetado. Nenhum client real e criado ou importado nesta fase.

## 6. Guards e bloqueios

O guard de consolidacao foi ajustado para bloquear payloads com intent de consolidacao oficial, incluindo:

- chaves de escrita de itens oficiais;
- flags explicitas de escrita em orcamento;
- `consolidation_released=true`.

`canWriteConsolidationToBudget` permanece `false`.

Esse ajuste evita o bloqueio indevido de inserts nas tabelas pipeline permitidas, mas continua bloqueando qualquer tentativa de liberar consolidacao orcamentaria.

## 7. Regra contra escrita em itens oficiais

A camada core nao cria funcao, endpoint ou repository para itens oficiais. A unica superficie de escrita segue limitada a:

- `opportunity_files`;
- 9 tabelas pipeline Reader/Verifier/HITL.

Nao ha implementacao de consolidacao orcamentaria. Qualquer payload que tente carregar intent de escrita oficial e bloqueado pelos guards antes de chegar ao repository.

## 8. Supabase real e ambiente

Confirmacoes desta fase:

- nenhum SQL executado;
- nenhum banco alterado;
- nenhum endpoint remoto chamado;
- nenhum client Supabase real instanciado;
- nenhuma chave ou secret lido;
- nenhuma config local de ambiente usada;
- nenhuma producao usada;
- nenhuma UI integrada.

## 9. Validacoes planejadas/executadas

Validacoes obrigatorias da fase:

- `npm run lint`;
- `git diff --check`;
- busca por uso indevido de itens oficiais em `platform/server/orcamentista/persistence`;
- busca por ref de producao;
- busca por config local temporaria proibida;
- busca por chave backend privilegiada;
- busca por criacao de client real;
- busca por import direto de biblioteca Supabase no core.

## 10. Pendencias

- Criar testes unitarios locais com fake repository/client.
- Definir mecanismo transacional real antes de executar writes multi-tabela remotos.
- Criar camada read model em fase posterior.
- Criar endpoints HTTP somente em fase explicitamente autorizada.
- Integrar UI somente apos core e read models estarem validados.
- Manter consolidacao em itens oficiais fora do escopo ate fase futura.

## 11. Decisao objetiva

**Core pronto para revisao e para avancar para 4C.READ, desde que lint e buscas de seguranca passem.**

Recomendacao: proxima fase deve focar em leitura agregada/read models ou testes unitarios locais com fake repository antes de qualquer chamada remota real.
