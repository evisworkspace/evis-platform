# EVIS Orcamentista IA - UI Functional Delivery

## Resumo

O painel interno do Orçamentista foi transformado em uma interface totalmente funcional, integrada aos componentes server-side através de endpoints internos. 
O frontend aciona a execução sem ter acesso a chaves privilegiadas e a execução em Staging é rigidamente separada da produção.

## Endpoints Criados (Server-side)

- **`POST /api/orcamentista/manual-run`**: Aciona o processo `runControlledManualOrcamentistaAction` para a oportunidade, utilizando as credenciais de *staging* do servidor (sem tráfego de secrets no front).
- **`GET /api/orcamentista/pipeline-view`**: Consulta os dados atualizados do *pipeline* via `getOrcamentistaPipelineView`.

## Arquivos UI Alterados

- `src/pages/Oportunidade/OrcamentistaInternalActionPanel.tsx`: Refatorado de *dumb component* para componente de estado completo (React hook) com chamadas nativas de *fetch*.
- `src/pages/Oportunidade/OrcamentistaTab.tsx`: Atualizada assinatura do painel (removeu prop `pipelineView`, já que a UI gerencia o próprio estado).
- `server/index.ts` e `server/routes/orcamentista.ts`: Roteamento e *endpoints* implementados.

## Como Executar Manualmente pela UI

1. Navegue até uma Oportunidade que possua Orçamento Oficial (ou crie o orçamento da oportunidade).
2. Na aba **Orçamentista IA**, encontre a seção "Ação interna — Orçamentista IA".
3. Clique em **"Rodar Orçamentista IA"**.
4. O botão indicará o status de "Executando Pipeline...".
5. Em caso de sucesso, os *cards* de métricas (*Reader runs*, *Verifier runs*, *Context status*, etc) e o status do *Gate* serão atualizados automaticamente na tela.

## Garantias de Segurança

- **Produção:** Não foi usada (`jwutiebpfauwzzltwgbb`). O ambiente de execução permanece em `staging` (`vtlepoljlqmjwuauygni`).
- **Segregação de Secrets:** Nenhuma service_role key foi vazada para o client, elas vivem exclusivamente na execução Node.js.
- **Isolamento de Banco:** A tabela oficial `orcamento_itens` não é escrita, mantendo `touchedBudgetItemsTable = false` e `canWriteConsolidationToBudget = false`.
- **Nenhum JWT no Repositório:** A varredura contra secrets `eyJ*` no código foi executada com sucesso.

## O que ainda não está liberado

- Execução na base de produção (ainda bloqueada ativamente).
- Auto-consolidação para a tabela oficial (`orcamento_itens`).
- Interface voltada ao cliente ou aprovação automática final de propostas baseadas nesses dados.
