# EVIS Orcamentista IA - Internal Action UI 4D.2

## Objetivo

Adicionar uma acao interna minima na aba Orcamentista da Oportunidade para acompanhar visualmente o pipeline staging do Orcamentista IA e preparar o ponto de entrada da execucao manual controlada, sem expor service_role no client e sem permitir escrita em `orcamento_itens`.

## Escopo desta fase

- Apenas UI read-only.
- Sem endpoint publico novo.
- Sem fetch remoto a partir do browser nesta fase.
- Sem service_role no client.
- Sem escrita em `orcamento_itens`.
- Execucao real do pipeline continua exclusiva via CLI server-side (`manualRunCli`, `pipelineViewCli`).

## Arquivos alterados

- `src/pages/Oportunidade/OrcamentistaInternalActionPanel.tsx` (novo)
- `src/pages/Oportunidade/OrcamentistaTab.tsx` (import + insercao do painel na secao Workspace IA)
- `platform/docs/EVIS_ORCAMENTISTA_INTERNAL_ACTION_UI_4D2.md` (novo, este relatorio)

## O que a UI mostra

O painel `OrcamentistaInternalActionPanel` exibe:

- Cabecalho `Acao interna - Orcamentista IA` com pill `STAGING - USO INTERNO`.
- Grid de metricas do pipeline (uma celula por campo):
  - `Arquivos` (`total_files`)
  - `Reader runs` (`total_reader_runs`)
  - `Verifier runs` (`total_verifier_runs`)
  - `HITL em aberto` (`open_hitl_issues`)
  - `Context status` (`latestContextStatus`)
  - `Oportunidade` (primeiros 8 caracteres do id)
- Alerta amber: consolidacao automatica bloqueada. Mostra explicitamente `canWriteConsolidationToBudget=false`.
- Alerta vermelho: escrita em `orcamento_itens` bloqueada no client staging guard. Mostra explicitamente `touchedBudgetItemsTable=false`.
- Botao `Rodar Orcamentista IA` desabilitado, com a mensagem oficial: `Execucao disponivel apenas via CLI/server-side nesta fase.`
- Bloco final explicando que Manual Run e Pipeline View rodam apenas server-side em staging com variaveis seguras ja injetadas e key rotacionada.

Quando `pipelineView` ainda nao e fornecido pelo parent, todas as celulas mostram `-`. O contrato `OrcamentistaInternalActionPipelineView` ja casa com o shape exposto pelo `getOrcamentistaPipelineView` server-side, de modo que uma camada server-side segura possa, em fase futura, fornecer os dados sem precisar redesenhar a UI.

## Status do botao

O botao `Rodar Orcamentista IA` ficou **desabilitado** nesta fase. Motivo: nao existe endpoint server-side seguro acessivel pelo browser que dispare a acao manual controlada, e a regra desta fase proibe (a) criar endpoint publico inseguro, (b) usar service_role no client e (c) chamar Supabase direto do client com privilegio server. A execucao continua via CLI:

```
npx tsx platform/server/orcamentista/manualRunCli.ts --mode manual_test --confirm-staging-write --marker <marker>
npx tsx platform/server/orcamentista/pipelineViewCli.ts --opportunity-id <uuid>
```

## Como a seguranca foi mantida

- Painel nao importa `@supabase/supabase-js` e nao chama `createClient`.
- Painel nao le `.env` e nao recebe service_role como prop.
- Painel nao chama `sbFetch` para tabelas server-side restritas.
- Painel nao escreve em `orcamento_itens`. O nome aparece somente como alerta visual de bloqueio.
- Botao de execucao desabilitado e com mensagem explicita. Nao ha caminho de codigo no client que dispare a acao manual controlada.
- O ref bloqueado de producao `jwutiebpfauwzzltwgbb` nao aparece no client. Continua mencionado apenas em documentacao e em validacao server-side (`stagingClient.ts`) como producao bloqueada.

## Confirmacao: service_role nao foi para o client

Nenhum valor de service_role foi gravado, importado ou referenciado no painel. O painel nao tem acesso direto a chave staging. A unica forma de obter os numeros reais do pipeline continua sendo via CLI server-side com variaveis injetadas fora do repositorio.

## Confirmacao: orcamento_itens segue bloqueado

- `canWriteConsolidationToBudget` permanece `false` no codigo (`platform/server/orcamentista/persistence/guards.ts`).
- O staging client guard (`platform/server/orcamentista/persistence/stagingClient.ts`) continua lancando erro em qualquer tentativa de acessar `orcamento_itens`.
- O painel client-side nao tem caminho de escrita; apenas exibe que a tabela esta bloqueada.

## Proximos passos

1. Rotacionar a service_role key do staging no Supabase (acao operacional fora do repositorio).
2. Em fase futura, avaliar a criacao de um endpoint server-side seguro especifico para fornecer o `pipelineView` ao painel sem service_role no client. Esse endpoint deveria:
   - rodar somente em ambiente server-side;
   - exigir ambiente staging;
   - bloquear producao;
   - nao aceitar tabela arbitraria;
   - nao aceitar payload de consolidacao;
   - nao tocar `orcamento_itens`;
   - retornar apenas o resumo seguro ja modelado em `OrcamentistaPipelineView`.
3. Manter o botao `Rodar Orcamentista IA` desabilitado ate que (2) exista, e mesmo entao avaliar deixa-lo restrito a usuarios internos com confirmacao explicita.
