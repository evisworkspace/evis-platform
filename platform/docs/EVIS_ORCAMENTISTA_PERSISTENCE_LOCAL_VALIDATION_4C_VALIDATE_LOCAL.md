# EVIS Orçamentista - Persistence Local Validation 4C.VALIDATE.LOCAL

## Objetivo

Validar localmente a camada de persistência do pipeline do Orçamentista com um client fake in-memory, sem conexão com banco, sem Supabase real, sem endpoint HTTP e sem alteração de schema.

## Arquivos

- `platform/server/orcamentista/persistence/fakePersistenceClient.ts`
- `platform/server/orcamentista/persistence/persistenceLocalValidation.ts`
- `platform/server/orcamentista/persistence/index.ts`

## Fake client

O `FakePersistenceClient` implementa os contratos locais `SupabaseLikeClient` e `SupabaseLikeReadClient`.

Ele registra:

- tabela acessada
- operação simulada
- payload recebido
- colunas selecionadas
- ordem das chamadas

O armazenamento é in-memory e restrito às tabelas da allowlist do pipeline. Acesso a tabelas bloqueadas, incluindo a tabela oficial de itens de orçamento, retorna erro fake `P0001`.

## Fluxo validado

`runPersistenceLocalValidation()` cobre:

- `persistReaderStage`
- `persistVerifierStage`
- `persistHitlStage`
- `persistContextSnapshot`
- `getOpportunityPipelineSummary`
- `getReaderVerifierHitlTimeline`
- `getLatestContextSnapshot`
- `getPendingHitlIssues`
- `getPipelineHealthForOpportunity`

## Casos locais

- happy path completo do pipeline
- payload sem `opportunity_id`
- tabela fora da allowlist
- tentativa simulada de acesso à tabela oficial de itens de orçamento bloqueada
- erro FK simulado via código `23503`
- erro UNIQUE simulado via código `23505`
- erro CHECK simulado via código `23514`

## Garantias da fase

- client sempre injetado
- nenhum client Supabase real importado ou criado
- nenhum SQL remoto executado
- nenhum banco alterado
- nenhuma migration aplicada
- nenhuma integração de UI
- nenhum endpoint HTTP público
- consolidação orçamentária permanece bloqueada por `canWriteConsolidationToBudget=false`
- a tabela oficial de itens de orçamento permanece bloqueada e não é usada como destino de persistência
