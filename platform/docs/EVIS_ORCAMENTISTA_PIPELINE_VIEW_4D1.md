# EVIS Orcamentista IA - Pipeline View 4D.1

## Objetivo

Permitir leitura minima e segura do resultado do pipeline do Orçamentista para uma oportunidade, sem writes e sem criar UI complexa.

## Arquivos alterados

- `platform/server/orcamentista/pipelineView.ts`
- `platform/server/orcamentista/pipelineViewCli.ts`

## Funcao criada

`getOrcamentistaPipelineView({ opportunityId })` usa os read models existentes e retorna um resumo seguro:

- `opportunityId`
- `total_files`
- `total_reader_runs`
- `total_verifier_runs`
- `open_hitl_issues`
- `latestContextStatus`
- `canWriteConsolidationToBudget`
- `touchedBudgetItemsTable`

## Comando de leitura

```powershell
npx tsx platform/server/orcamentista/pipelineViewCli.ts --opportunity-id <uuid>
```

Este comando e read-only e nao exige `--confirm-staging-write`, porque nao executa persistencia. Ainda assim, ele usa o mesmo client staging seguro e falha se o ambiente nao estiver configurado na sessao atual.

## Regras de seguranca

- Leitura apenas.
- Nenhuma escrita remota.
- Nenhum endpoint publico criado.
- Nenhum secret no client.
- `orcamento_itens` nao e consultada nem modificada.
- `canWriteConsolidationToBudget` permanece `false`.

## Criterio minimo atingido

A visao minima cobre os campos pedidos para acompanhar o pipeline de uma oportunidade sem consolidar orcamento e sem abrir uma superficie nova de escrita.
