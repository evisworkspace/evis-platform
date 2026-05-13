# EVIS Orcamentista IA - Controlled Manual Action 4D.0

## Objetivo

Transformar o Manual Run MVP em uma acao server-side reutilizavel pelo sistema, sem abrir endpoint publico e sem criar UI adicional nesta fase.

## Auditoria estrutural rapida

- Manual Run existente: `platform/server/orcamentista/orcamentistaManualRun.ts`.
- Entry point CLI existente: `platform/server/orcamentista/manualRunCli.ts`.
- Adapter Supabase staging: `platform/server/orcamentista/persistence/stagingClient.ts`.
- Contracts e guards: `platform/server/orcamentista/persistence/contracts.ts` e `guards.ts`.
- Repository e stages: `repository.ts`, `readerPersistence.ts`, `verifierPersistence.ts`, `hitlPersistence.ts`.
- Read models: `platform/server/orcamentista/persistence/readModels.ts`.
- Mock/preview UI atual: `src/pages/Oportunidade/OrcamentistaTab.tsx` e paineis relacionados.
- Escrita legada em orcamento_itens: permanece no fluxo manual/oficial da UI existente e no chat legado quarentenado por flag. Nao foi alterada nesta fase.

## Arquivos alterados

- `platform/server/orcamentista/controlledManualAction.ts`
- `platform/server/orcamentista/manualRunCli.ts`

## Funcao criada

`runControlledManualOrcamentistaAction(input)` encapsula o Manual Run MVP existente e adiciona um contrato explicito para uso futuro por endpoint interno ou UI controlada.

A funcao:

- exige `confirmStagingWrite=true`;
- reutiliza `runOrcamentistaManualRun`;
- aceita `manual_test` ou anchors existentes;
- retorna apenas resumo seguro;
- valida `latestContextStatus` como `blocked` ou `pending`;
- valida `canWriteConsolidationToBudget=false`;
- bloqueia se `touchedBudgetItemsTable=true`;
- nao imprime secrets;
- nao consolida orcamento;
- nao escreve em `orcamento_itens`.

## Como executar manualmente

Modo sintetico:

```powershell
npx tsx platform/server/orcamentista/manualRunCli.ts --mode manual_test --confirm-staging-write --marker EVIS_TEST_4D0_MANUAL_ACTION
```

Modo com anchors existentes:

```powershell
npx tsx platform/server/orcamentista/manualRunCli.ts --mode existing --opportunity-id <uuid> --orcamento-id <uuid> --confirm-staging-write
```

## Regras de seguranca

- Usar somente staging autorizado.
- Nao usar producao.
- Nao ler `.env`.
- Nao usar `supabase/.temp`.
- Nao registrar secrets.
- Nao alterar schema, migration, RLS ou policies.
- Parar se qualquer guard retornar `blocked`.

## Confirmacao de orcamento_itens bloqueado

O client staging bloqueia acesso direto a `orcamento_itens`. A acao controlada tambem bloqueia o resultado se a tabela aparecer em `touchedTables`.

## Proximos passos para UI

Antes de UI para usuario final, criar apenas um endpoint interno server-side com as mesmas garantias:

- sem secrets no client;
- sem payload arbitrario;
- somente staging/manual;
- gate HITL fechado por padrao;
- leitura do resumo via `getOrcamentistaPipelineView`.
