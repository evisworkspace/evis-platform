# EVIS Orcamentista IA - Real Connection Audit

Data da auditoria: 2026-05-13

## Escopo e restricoes aplicadas

Esta auditoria foi feita por leitura estatica do codigo e documentos locais.

Nao foi executado staging. Nao foi executado SQL. Nao foi usado Supabase CLI. Nao foi usado `supabase/.temp`. Nao foi lido `.env`. Nao houve alteracao de UI, backend, banco ou endpoint. O unico arquivo criado foi este relatorio.

Consequencia direta: o estado real de existencia das tabelas no banco nao foi confirmado nesta rodada. Quando este relatorio diz "tabela existente", significa "tabela prevista/consumida pelo codigo ou por SQL proposal lido", nao introspeccao em banco.

## Arquivos lidos

- `package.json`
- `vite.config.ts`
- `server/index.ts`
- `server/routes/orcamentista.ts`
- `platform/server/index.ts`
- `platform/server/routes/orcamentista.ts`
- `src/App.tsx`
- `src/pages/OportunidadeDetalhePage.tsx`
- `src/pages/Oportunidade/OrcamentistaTab.tsx`
- `src/pages/Oportunidade/OrcamentistaInternalActionPanel.tsx`
- `src/pages/Oportunidade/OrcamentistaManualItemsPanel.tsx`
- `src/pages/Oportunidade/OrcamentistaAgentDispatchPanel.tsx`
- `src/pages/Oportunidade/OrcamentistaReaderVerifierPanel.tsx`
- `src/pages/Oportunidade/OrcamentistaHitlPanel.tsx`
- `src/pages/Oportunidade/OrcamentistaConsolidationGatePanel.tsx`
- `src/pages/OrcamentistaChat.tsx`
- `src/pages/Orcamentista/dashboard/index.tsx`
- `src/pages/Orcamentista/dashboard/DashboardApp.tsx`
- `src/hooks/useOportunidadeOrcamento.ts`
- `src/hooks/useOrcamento.ts`
- `src/hooks/useOportunidades.ts`
- `src/lib/api.ts`
- `src/lib/orcamentista/agentRegistry.ts`
- `src/lib/orcamentista/agentDispatchMock.ts`
- `src/lib/orcamentista/agentDispatchUtils.ts`
- `platform/server/orcamentista/controlledManualAction.ts`
- `platform/server/orcamentista/orcamentistaManualRun.ts`
- `platform/server/orcamentista/manualRunCli.ts`
- `platform/server/orcamentista/pipelineView.ts`
- `platform/server/orcamentista/pipelineViewCli.ts`
- `platform/server/orcamentista/etapa0.ts`
- `platform/server/orcamentista/graphEtapa0.ts`
- `platform/server/orcamentista/engine.ts`
- `platform/server/orcamentista/multiagent.ts`
- `platform/server/orcamentista/contracts.ts`
- `platform/server/orcamentista/specialistCatalog.ts`
- `platform/server/orcamentista/specialistKnowledge.ts`
- `platform/server/orcamentista/agentKnowledge.ts`
- `platform/server/orcamentista/engine/ReaderAgent.ts`
- `platform/server/orcamentista/engine/PlannerAgent.ts`
- `platform/server/orcamentista/engine/QuantitativosAgent.ts`
- `platform/server/orcamentista/persistence/guards.ts`
- `platform/server/orcamentista/persistence/stagingClient.ts`
- `platform/server/orcamentista/persistence/repository.ts`
- `platform/server/orcamentista/persistence/readerPersistence.ts`
- `platform/server/orcamentista/persistence/verifierPersistence.ts`
- `platform/server/orcamentista/persistence/hitlPersistence.ts`
- `platform/server/orcamentista/persistence/readModels.ts`
- `platform/docs/sql_proposals/ORCAMENTISTA_002_BASELINE_ORCAMENTOS_ORCAMENTO_ITENS.sql`
- `platform/docs/sql_proposals/ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_MIGRATION_CANDIDATE.sql`

## Resumo executivo

O sistema esta dividido em tres fluxos diferentes, com niveis de conexao distintos.

1. Fluxo de oportunidade/orcamento manual: esta conectado na UI, usa Supabase REST pelo client, le e escreve `orcamentos`, `orcamento_itens`, `opportunities` e `opportunity_files` conforme configuracao do usuario no front. Isso e operacional no app, mas nao e o pipeline IA Reader/Verifier/HITL.

2. Fluxo interno Manual Run/Pipeline View: existe UI em `OrcamentistaInternalActionPanel`, endpoints em `server/routes/orcamentista.ts`, camada server-side em `platform/server/orcamentista/*` e repository de persistencia. Este e o unico fluxo Reader/Verifier/HITL persistente conectado a uma UI. Ele grava dados sinteticos/controlados e mantem `orcamento_itens` bloqueada. O botao "Rodar Orcamentista IA" esta habilitado no codigo.

3. Fluxo chat/workspace/Etapa 0: a UI `OrcamentistaChat` chama endpoints relativos `/api/orcamentista/workspaces`, `/chat/stream`, `/files`, `/preview` e `/generate-official-budget`, mas esses endpoints estao em `platform/server/routes/orcamentista.ts`. O script oficial `npm run server` sobe `server/index.ts`, que registra apenas `server/routes/orcamentista.ts`. Portanto, no caminho padrao do projeto, o chat chama endpoints que nao estao registrados. Alem disso, `vite.config.ts` nao tem proxy `/api`, entao chamadas relativas a `/api` tambem nao sao encaminhadas automaticamente ao Express em desenvolvimento.

## Mapa real do sistema

### Entrada pela UI

Rotas registradas em `src/App.tsx`:

| Rota | Componente | Status real |
| --- | --- | --- |
| `/oportunidades/:id/orcamentista` | `OrcamentistaTab` | Rota ativa |
| `/orcamentista` | `OrcamentistaChat` | Rota ativa |
| `src/pages/Orcamentista/dashboard/index.tsx` | `DashboardApp` | Existe, mas nao esta roteado em `App.tsx` |

Na tela de detalhe da oportunidade:

- Botao `Orçamento com IA`: chama `handleAbrirOrcamentista`, atualiza `opportunities.orcamentista_workspace_id` quando ausente, cria evento `orcamentista_aberto` e navega para `/oportunidades/:id/orcamentista`.
- Botao `Orçamento`: link direto para `/oportunidades/:id/orcamentista` quando ja existe `orcamento_id`.
- Botao de iniciar orcamento: cria evento `orcamento_iniciado`, garante workspace e navega para a aba.

### Aba `OrcamentistaTab`

Componentes renderizados de verdade quando ha `orcamento_id`:

- `OrcamentistaInternalActionPanel`
- `OrcamentistaGuidedIntakePanel`
- `OrcamentistaDocumentsPanel`
- `OrcamentistaMissingProjectFallbackPanel`
- `OrcamentistaPageProcessingPanel`
- `OrcamentistaReaderVerifierPanel`
- `OrcamentistaHitlPanel`
- `OrcamentistaAgentDispatchPanel`
- `OrcamentistaConsolidatedPreviewPanel`
- `OrcamentistaConsolidationGatePanel`
- `OrcamentistaPayloadReviewPanel`
- `OrcamentistaRealReaderSandboxPanel`
- `OrcamentistaAiPipelinePanel`
- `OrcamentistaAiPreviewPanel`
- `OrcamentistaChat`

Componentes renderizados quando nao ha `orcamento_id`:

- Estado vazio de orcamento oficial.
- Botao `Criar orçamento da oportunidade`, quando `canCreateOrcamento` e verdadeiro.

### Dados reais vs mock/static/demo

| Area | Dado exibido | Origem | Classificacao |
| --- | --- | --- | --- |
| Cabecalho oportunidade | `opportunity.titulo`, `orcamento_id`, `proposta_id` | Supabase REST via `useOportunidadeOrcamento` | Real |
| Orcamento oficial | `orcamentos` | Supabase REST via `sbFetch` | Real |
| Itens oficiais | `orcamento_itens` | Supabase REST via `sbFetch` | Real/manual |
| Arquivos da oportunidade | `opportunity_files` | Supabase REST via `useOpportunityFiles` | Real para inventario basico |
| Documentos recebidos no painel IA | `buildMockDocumentIntakeFiles(...)` usando `opportunityFiles` como entrada | Hibrido: arquivos reais envelopados em modelo mock | Parcialmente real |
| Guided intake | `MOCK_PROJECT_READING_SESSION` | Mock | Mock |
| Missing project fallback | `buildMockEstimatedScopeFallbacks` | Mock | Mock |
| Page processing | `MOCK_PAGE_PROCESSING_JOB`, `getMockRenderedPages` | Mock | Mock |
| Reader + Verifier visual | `mockReaderVerifierSummaries` | Mock | Mock |
| HITL visual | `mockOrcamentistaHitlIssues` | Mock com decisoes locais | Mock |
| Agent dispatch visual | `mockAgentDispatchJobs` | Mock | Mock |
| Preview consolidado visual | `MOCK_CONSOLIDATED_PREVIEW` | Mock derivado de mock dispatch | Mock |
| Gate consolidacao visual | `MOCK_CONSOLIDATION_GATE` | Mock/payload simulado | Mock |
| Payload review visual | `MOCK_PAYLOAD_REVIEW_SESSION` | Mock | Mock |
| Pipeline IA legado | `mockPipelineSteps`, `mockAiPreview` | Mock | Mock |
| Painel interno Manual Run | `GET /api/orcamentista/pipeline-view` | Server-side staging client, se servidor em `localhost:3001` estiver ativo | Real server-side controlado |
| Chat Orçamentista | `/api/orcamentista/chat/stream` | Endpoint existe apenas em `platform/server/routes/orcamentista.ts` | Quebrado no servidor padrao |

## Frontend para API

### Chamadas feitas pela aba Orçamentista

| Origem | Endpoint/servico chamado | Registrado em `npm run server`? | Observacao |
| --- | --- | --- | --- |
| `useOportunidadeOrcamento` | Supabase REST `opportunities`, `orcamentos`, `orcamento_itens` | Nao passa pelo Express | Funciona pelo client se `config.url/key` estiverem corretos |
| `useOpportunityFiles` | Supabase REST `opportunity_files` | Nao passa pelo Express | Leitura real |
| `OrcamentistaInternalActionPanel` | `http://localhost:3001/api/orcamentista/pipeline-view` | Sim | Endpoint real em `server/routes/orcamentista.ts` |
| `OrcamentistaInternalActionPanel` | `http://localhost:3001/api/orcamentista/manual-run` | Sim | Endpoint real em `server/routes/orcamentista.ts` |
| `OrcamentistaChat` | `/api/orcamentista/workspaces` | Nao | Existe em `platform/server/routes/orcamentista.ts`, nao no servidor padrao |
| `OrcamentistaChat` | `/api/orcamentista/workspaces/:id/preview` | Nao | Existe em `platform/server/routes/orcamentista.ts`, nao no servidor padrao |
| `OrcamentistaChat` | `/api/orcamentista/workspaces/:id/files` | Nao | Existe em `platform/server/routes/orcamentista.ts`, nao no servidor padrao |
| `OrcamentistaChat` | `/api/orcamentista/chat/stream` | Nao | Existe em `platform/server/routes/orcamentista.ts`, nao no servidor padrao |
| `OrcamentistaChat` | `/api/orcamentista/workspaces/:id/generate-official-budget` | Nao | Existe em rota nao registrada no servidor padrao; tambem esta quarentenado por flag |

### Hooks existentes e usados

| Hook | Usado onde | Funcao real |
| --- | --- | --- |
| `useOportunidadeOrcamento` | `OrcamentistaTab` | Le oportunidade, orcamento, itens; cria orcamento; cria/atualiza/remove itens manuais |
| `useOpportunityFiles` | `OrcamentistaTab` | Le `opportunity_files` |
| `useOportunidade` | Dentro de `useOportunidadeOrcamento` e detalhe da oportunidade | Le oportunidade |
| `useOrcamentoItens` | `OrcamentoEditor` | Le itens oficiais |
| `useCreateOrcamento`, `useCreateItem`, `useUpdateItem`, `useDeleteItem` | `OrcamentoEditor` | Operacoes REST diretas no Supabase |

## API e server

### Servidor padrao do projeto

`package.json` define:

```text
npm run server -> tsx watch server/index.ts
```

`server/index.ts` registra:

- `/api/diario`
- `/api/orcamentista`
- `/health`

Para `/api/orcamentista`, o arquivo ativo e `server/routes/orcamentista.ts`.

### Rotas realmente ativas em `npm run server`

| Rota | Funcao server chamada | Retorna dado real? | Placeholder? |
| --- | --- | --- | --- |
| `POST /api/orcamentista/manual-run` | `runControlledManualOrcamentistaAction` | Sim, se env staging estiver valido | Nao e placeholder, mas gera fluxo sintetico/controlado |
| `GET /api/orcamentista/pipeline-view` | `getOrcamentistaPipelineView` | Sim, le tabelas do pipeline permitido | Nao |

### Rotas existentes mas nao ativas no servidor padrao

`platform/server/index.ts` registra `platform/server/routes/orcamentista.ts`, mas esse servidor nao e o script `npm run server`.

Rotas ali existentes:

- `POST /api/orcamentista/chat/stream`
- `POST /api/orcamentista/chat`
- `DELETE /api/orcamentista/sessao/:id`
- `GET /api/orcamentista/sessao/:id`
- `GET /api/orcamentista/workspaces`
- `GET /api/orcamentista/workspaces/:id/attachments`
- `POST /api/orcamentista/workspaces/:id/files`
- `POST /api/orcamentista/workspaces/:id/sync-gcs`
- `POST /api/orcamentista/etapa0/extract`
- `POST /api/orcamentista/workspaces`
- `GET /api/orcamentista/workspaces/:id/preview`
- `POST /api/orcamentista/workspaces/:workspaceId/generate-official-budget`

Essas rotas nao estao chamadas pelo `server/index.ts` usado pelo script oficial.

## Backend Orçamentista

| Item | Existe | Chamado por outro modulo | Conectado a API | Conectado a UI | Conectado ao banco | Classificacao |
| --- | --- | --- | --- | --- | --- | --- |
| `controlledManualAction.ts` | Sim | Sim, por `server/routes/orcamentista.ts` e CLI | Sim | Sim, via painel interno | Sim, via repository/staging client | Funcao implementada e conectada |
| `orcamentistaManualRun.ts` | Sim | Sim | Sim indiretamente | Sim indiretamente | Sim | Funcao implementada, mas gera dados sinteticos |
| `manualRunCli.ts` | Sim | Executavel direto | Nao | Nao | Sim se executado | CLI operacional, nao UI |
| `pipelineView.ts` | Sim | Sim | Sim | Sim | Sim, leitura allowlist | Funcao implementada e conectada |
| `pipelineViewCli.ts` | Sim | Executavel direto | Nao | Nao | Sim se executado | CLI operacional, nao UI |
| Etapa 0 `etapa0.ts` | Sim | Sim em `platform/server/routes/orcamentista.ts` e `engine.ts` | Sim apenas no servidor platform | Nao no servidor padrao | Persistencia local em workspace no servidor platform | Implementada, mas desconectada do servidor padrao |
| `graphEtapa0.ts` | Sim | Nao encontrado uso ativo | Nao | Nao | Nao | Mock/preview de grafo |
| Reader visual | Sim no front mock | Sim por painel | Nao | Sim | Nao | Mock UI |
| Reader real `ReaderAgent.ts` | Sim | Nao encontrado uso ativo | Nao | Nao | Nao | Modulo executavel desconectado |
| Verifier | Persistencia existe; visual mock existe | Manual Run sintetico chama persistencia | Sim no Manual Run | Sim via painel interno | Sim | Implementado para persistencia sintetica, nao verifier real |
| HITL | Persistencia existe; visual mock existe | Manual Run chama `persistHitlStage` | Sim no Manual Run | Sim via painel interno; mock nos demais paineis | Sim | Persistencia real controlada + UI mock |
| Agentes especialistas front | Sim em `agentRegistry.ts` | Sim por paineis mock | Nao | Sim | Nao | Registry/tipos/mock, sem execucao |
| Agentes especialistas server catalog | Sim em `specialistCatalog.ts` | Sim por script de baseline | Nao | Nao | Nao | Catalogo/prompts para avaliacao, nao app |
| Dispatch | Sim em `agentDispatchMock.ts` | Sim por painel mock | Nao | Sim | Nao | Mock |
| Context snapshot | Sim | Manual Run persiste e Pipeline View le | Sim | Sim via painel interno | Sim | Implementado e conectado |
| Persistence layer | Sim | Manual Run e Pipeline View | Sim | Sim indiretamente | Sim | Implementado para allowlist |

## Agentes especialistas

### Agentes definidos no frontend

`src/lib/orcamentista/agentRegistry.ts` define 21 agentes como metadados para UI:

1. `reader_multimodal`
2. `reader_verifier`
3. `classificador_documentos`
4. `planner_tecnico`
5. `civil_arquitetonico`
6. `estrutural`
7. `eletrica_dados_automacao`
8. `hidrossanitario`
9. `impermeabilizacao`
10. `climatizacao_exaustao_ventilacao`
11. `ppci_incendio`
12. `marcenaria_mobiliario_tecnico`
13. `vidros_esquadrias_serralheria`
14. `acabamentos`
15. `documentacao_aprovacoes`
16. `administracao_gestao_obra`
17. `compatibilizacao_tecnica`
18. `quantitativo`
19. `custos`
20. `auditor`
21. `hitl_review`
22. `consolidador_preview`

Observacao: a lista contem 22 entradas no arquivo, embora a documentacao antiga mencione 21 em alguns pontos.

Natureza: tipos/metadados para UI. Nao sao modulos executaveis.

### Agentes definidos no servidor

`platform/server/orcamentista/specialistCatalog.ts` define 14 especialistas:

- Civil e Execucao
- Estrutural
- Geotecnica e Fundacoes
- Hidraulica e Sanitaria
- Eletrica
- Custos e Orcamentacao
- Telecom e Dados
- Climatizacao e HVAC
- Automacao Residencial
- Seguranca Contra Incendio e PPCI
- Impermeabilizacao
- Acustica
- Iluminacao e Luminotecnica
- Producao e Gestao de Obra

Natureza: catalogo, conhecimento e prompts. O uso encontrado e em `platform/server/scripts/run_discipline_baseline.ts`, nao na UI.

### Agentes executaveis

Existem funcoes executaveis:

- `executeReader` em `platform/server/orcamentista/engine/ReaderAgent.ts`
- `executePlanner` em `platform/server/orcamentista/engine/PlannerAgent.ts`
- `executeQuantitativos` em `platform/server/orcamentista/engine/QuantitativosAgent.ts`
- `OrcamentistaEngine.processarEtapa0` em `platform/server/orcamentista/engine.ts`

Uso real encontrado:

- `executeReader`, `executePlanner`, `executeQuantitativos`: nao ha caller ativo encontrado.
- `OrcamentistaEngine`: nao ha rota ativa no servidor padrao.
- `runMultiAgentProjectAnalysis`: e chamado por `platform/server/routes/orcamentista.ts`, mas essa rota nao esta no servidor padrao. Alem disso, a funcao atualmente salva registry e retorna `AGUARDANDO_ETAPA_0`, sem executar Reader/Planner/Quantitativos reais.

### Dispatcher real

Nao existe dispatcher real conectado a UI. O que existe e:

- `agentDispatchMock.ts`: jobs mockados.
- `agentDispatchUtils.ts`: funcoes deterministicas de agrupamento/status.
- `OrcamentistaAgentDispatchPanel`: renderiza mock e botao de gerar preview desabilitado.

A UI nao chama dispatcher server-side.

### Persistencia dos agentes

Nao foi encontrado fluxo que persista resultado de agentes especialistas em tabelas do pipeline. O Manual Run persiste Reader/Verifier/HITL/context snapshot sinteticos. Os outputs de agentes especialistas do painel sao objetos mockados locais.

## Banco e persistencia

### Tabelas previstas/consumidas

Tabelas oficiais de orcamento manual:

- `orcamentos`
- `orcamento_itens`
- `opportunities`
- `opportunity_files`
- `opportunity_events`

Tabelas do pipeline Reader/Verifier/HITL previstas no SQL proposal e usadas pelo repository:

- `opportunity_files`
- `orc_reader_runs`
- `orc_reader_outputs`
- `orc_reader_safety_evaluations`
- `orc_verifier_runs`
- `orc_reader_verifier_comparisons`
- `orc_reader_verifier_divergences`
- `orc_hitl_issues`
- `orc_hitl_decisions`
- `orc_context_snapshots`

### Funcoes que gravam

| Funcao | Tabelas destino | Chamada pela UI? | Observacao |
| --- | --- | --- | --- |
| `criarOrcamentoParaOportunidade` | `orcamentos`, `opportunities` | Sim | Acao manual do usuario |
| `criarItemManual` | `orcamento_itens` | Sim | Acao manual do usuario, nao IA |
| `atualizarItemManual` | `orcamento_itens` | Sim | Acao manual do usuario |
| `removerItemManual` | `orcamento_itens` | Sim | Acao manual do usuario |
| `runOrcamentistaManualRun` | `orcamentos`, `opportunities` no modo `manual_test`; pipeline allowlist; nunca `orcamento_itens` | Sim via painel interno/API | No modo `manual_test`, cria ancoras sinteticas em `orcamentos` e `opportunities` antes do pipeline |
| `persistReaderStage` | `opportunity_files`, `orc_reader_runs`, `orc_reader_outputs`, `orc_reader_safety_evaluations` | Sim indiretamente via Manual Run | Pipeline sintetico |
| `persistVerifierStage` | `orc_verifier_runs`, `orc_reader_verifier_comparisons`, `orc_reader_verifier_divergences` | Sim indiretamente via Manual Run | Pipeline sintetico |
| `persistHitlStage` | `orc_hitl_issues`, `orc_hitl_decisions`, `orc_context_snapshots` | Sim indiretamente via Manual Run | Pipeline sintetico |
| `persistContextSnapshot` | `orc_context_snapshots` | Sim indiretamente via Manual Run | Gate final bloqueado |
| `generate-official-budget` | `orcamentos`, `opportunities`, `orcamento_itens`, `opportunity_events` | Nao no servidor padrao; sim em `OrcamentistaChat` se rota platform estiver ativa | Quarentenado por flag `LEGACY_ORCAMENTISTA_OFFICIAL_WRITE_ENABLED` |

### Confirmacao de `orcamento_itens`

O pipeline server-side novo bloqueia `orcamento_itens` em tres camadas:

- `PERSISTENCE_BLOCKLIST` inclui `orcamento_itens`.
- `canWriteConsolidationToBudget = false`.
- `createStagingClientFromEnv().from(table)` lança erro se `table === 'orcamento_itens'`.

No entanto, `orcamento_itens` continua sendo gravada pela UI manual oficial (`criarItemManual`, `atualizarItemManual`, `removerItemManual`). Isso nao e escrita IA; e o editor manual do orcamento oficial.

O endpoint legado `generate-official-budget` ainda contem codigo que escreve em `orcamento_itens`, mas:

- esta em `platform/server/routes/orcamentista.ts`, nao no servidor padrao;
- retorna 410 se `LEGACY_ORCAMENTISTA_OFFICIAL_WRITE_ENABLED !== 'true'` ou `NODE_ENV === 'production'`;
- e rotulado no codigo como caminho quarentenado.

## Fluxo real atual

### Fluxo A - Abrir aba pela oportunidade

Usuario na UI:

1. Clica `Orçamento com IA` em `OportunidadeDetalhePage`.
2. `handleAbrirOrcamentista` calcula `workspaceId = item.orcamentista_workspace_id || opp_<id>`.
3. Se necessario, faz PATCH em `opportunities.orcamentista_workspace_id` via `sbFetch`.
4. Cria evento `opportunity_events` do tipo `orcamentista_aberto`.
5. Navega para `/oportunidades/:id/orcamentista`.
6. `OrcamentistaTab` carrega oportunidade, orcamento, itens e arquivos.

Quebra possivel:

- Se Supabase client nao estiver configurado no front, a tela nao carrega dados reais.
- Se nao houver `orcamento_id`, o workspace IA completo nao aparece; aparece o estado de criacao de orcamento.

### Fluxo B - Criar orcamento oficial manual

Usuario:

1. Clica `Criar orçamento da oportunidade`.
2. `useOportunidadeOrcamento.criarOrcamentoParaOportunidade` faz POST em `orcamentos`.
3. Faz PATCH em `opportunities` com `orcamento_id`.
4. UI invalida caches e passa a mostrar painel de itens oficiais.

Persistencia:

- `orcamentos`
- `opportunities`

Nao chama pipeline IA.

### Fluxo C - Criar/editar/remover item oficial manual

Usuario:

1. Preenche formulario em `OrcamentistaManualItemsPanel`.
2. Clica `Adicionar item`.
3. Hook chama POST em `orcamento_itens` com `origem: manual`.
4. UI recarrega lista de itens.

Persistencia:

- `orcamento_itens`

Nao e IA. Nao passa por Reader/Verifier/HITL.

### Fluxo D - Painel interno Manual Run/Pipeline View

Usuario:

1. Abre `/oportunidades/:id/orcamentista`.
2. `OrcamentistaInternalActionPanel` monta.
3. `useEffect` chama `http://localhost:3001/api/orcamentista/pipeline-view?opportunityId=<id>`.
4. `server/routes/orcamentista.ts` chama `getOrcamentistaPipelineView`.
5. `pipelineView.ts` le `opportunity_files`, `orc_reader_runs`, `orc_verifier_runs`, `orc_hitl_issues`, `orc_context_snapshots`.
6. UI mostra contadores e status.

Quando clica `Rodar Orçamentista IA`:

1. UI chama `http://localhost:3001/api/orcamentista/manual-run`.
2. Endpoint chama `runControlledManualOrcamentistaAction`.
3. `runControlledManualOrcamentistaAction` exige `confirmStagingWrite: true` e `canWriteConsolidationToBudget === false`.
4. `runOrcamentistaManualRun` resolve ancoras.
5. No modo `manual_test`, cria `orcamentos` e `opportunities` sinteticos.
6. Persiste Reader stage sintetico.
7. Persiste Verifier stage sintetico.
8. Persiste HITL issue, decision e context snapshot sinteticos.
9. Persiste final context snapshot com `context_status: blocked`.
10. Le summary e latest snapshot.
11. Bloqueia se `orcamento_itens` foi tocada.
12. UI mostra sucesso e recarrega Pipeline View.

Esse e o fluxo IA persistente mais conectado hoje, mas ele e sintetico/controlado e nao processa arquivos reais da oportunidade.

### Fluxo E - Chat Orçamentista

Usuario:

1. Usa o chat embutido ou rota `/orcamentista`.
2. `OrcamentistaChat` tenta buscar `/api/orcamentista/workspaces`.
3. Tenta enviar mensagens para `/api/orcamentista/chat/stream`.
4. Tenta upload para `/api/orcamentista/workspaces/:id/files`.
5. Tenta preview em `/api/orcamentista/workspaces/:id/preview`.

Ponto de quebra:

- Essas rotas nao existem em `server/routes/orcamentista.ts`.
- Elas existem em `platform/server/routes/orcamentista.ts`, mas esse arquivo nao e registrado pelo `npm run server`.
- `vite.config.ts` nao tem proxy `/api`.
- Portanto, no caminho padrao de desenvolvimento, o chat nao chama backend operacional.

## Tabela geral: existe / conectado / usado / mock / pendente

| Item | Existe | Conectado API | Usado UI | Mock | Pendente |
| --- | --- | --- | --- | --- | --- |
| Aba `/oportunidades/:id/orcamentista` | Sim | Parcial | Sim | Parcial | Conectar paineis reais |
| `/orcamentista` standalone | Sim | Quebrado no servidor padrao | Sim | Parcial | Registrar endpoints/proxy |
| Orcamento manual oficial | Sim | Supabase REST client | Sim | Nao | Nenhum para fluxo manual |
| Itens manuais oficiais | Sim | Supabase REST client | Sim | Nao | Nenhum para fluxo manual |
| Painel interno Manual Run | Sim | Sim | Sim | Nao na chamada; dados sinteticos | Decidir se botao deve permanecer habilitado |
| Pipeline View | Sim | Sim | Sim | Nao | Ampliar leitura quando houver pipeline real |
| Chat stream | Sim em platform route | Nao no servidor padrao | UI chama | Nao | Registrar no servidor correto |
| Workspaces locais | Sim em platform route | Nao no servidor padrao | UI chama | Nao | Registrar no servidor correto |
| Upload workspace | Sim em platform route | Nao no servidor padrao | UI chama | Nao | Registrar no servidor correto |
| Etapa 0 HTTP | Sim em platform route | Nao no servidor padrao | Nao chamada pela aba | Nao | Conectar UI e servidor |
| Reader visual | Sim | Nao | Sim | Sim | Trocar mock por read model/API |
| Verifier visual | Sim | Nao | Sim | Sim | Trocar mock por read model/API |
| HITL visual | Sim | Nao | Sim | Sim | Trocar mock por read model/API |
| Agent dispatch visual | Sim | Nao | Sim | Sim | Implementar dispatcher real |
| Preview consolidado visual | Sim | Nao | Sim | Sim | Conectar a outputs reais |
| Gate consolidacao visual | Sim | Nao | Sim | Sim | Conectar a snapshot/gate real |
| Agentes especialistas server catalog | Sim | Nao | Nao | Nao | Conectar ao dispatcher |
| Agentes executaveis Reader/Planner/Quantitativos | Sim | Nao ativo | Nao | Parcial fallback | Integrar ou remover do fluxo |
| Persistence repository | Sim | Sim para Manual Run | Sim indiretamente | Nao | Expor fluxos reais por endpoint |
| `orcamento_itens` bloqueado para IA | Sim | Sim no pipeline novo | Sim indiretamente | Nao | Manter |

## Lacunas reais

| Lacuna | Arquivo/local | Impacto | Correcao minima necessaria |
| --- | --- | --- | --- |
| Chat chama endpoints nao registrados no servidor padrao | `src/pages/OrcamentistaChat.tsx`, `server/index.ts`, `server/routes/orcamentista.ts`, `platform/server/routes/orcamentista.ts` | Chat/workspaces/upload/preview falham no caminho `npm run server` | Unificar ou montar as rotas de chat/workspaces no servidor realmente executado |
| Vite nao tem proxy `/api` | `vite.config.ts` | Chamadas relativas `/api/...` batem no Vite quando front roda em `localhost:3000` | Adicionar proxy ou padronizar base URL para API |
| Painel interno usa URL absoluta `http://localhost:3001` | `OrcamentistaInternalActionPanel.tsx` | Funciona apenas em dev local; quebra em deploy ou porta diferente | Trocar para base configuravel/relativa depois de resolver servidor/proxy |
| Botao `Rodar Orçamentista IA` esta habilitado | `OrcamentistaInternalActionPanel.tsx` | Contraria relatorio anterior que dizia UI desabilitada; pode executar staging se server/env estiverem ativos | Definir regra: se deve ficar bloqueado, desabilitar; se deve ser interno, proteger por flag/role |
| Manual Run nao processa arquivos reais da oportunidade | `orcamentistaManualRun.ts` | Resultado persistido e sintetico, nao prova fluxo real de Reader/Verifier | Conectar `opportunity_files` reais ou deixar claramente como smoke manual |
| Paineis Reader/Verifier/HITL/Dispatch/Gate usam mocks | `src/pages/Oportunidade/*Panel.tsx`, `src/lib/orcamentista/*Mock.ts` | UI aparenta pipeline completo, mas nao reflete estado persistido | Substituir dados mock por read models/API em ordem |
| Etapa 0 existe em rota platform, mas nao e chamada pela aba | `platform/server/routes/orcamentista.ts`, `OrcamentistaTab.tsx` | Extracao factual nao esta no fluxo da oportunidade | Criar/ligar chamada UI -> endpoint real depois de registrar servidor |
| Agentes especialistas sao catalogos/mocks, nao dispatch real | `agentRegistry.ts`, `specialistCatalog.ts`, `agentDispatchMock.ts` | Nao ha execucao nem persistencia de outputs especialistas | Implementar dispatcher real apenas depois de Reader/Verifier/HITL real |
| Repository nao tem endpoints CRUD reais para pipeline por oportunidade | `platform/server/orcamentista/persistence/*`, `server/routes/orcamentista.ts` | Persistencia so entra pelo Manual Run sintetico | Expor endpoints minimos para registrar arquivo, reader, verifier, HITL e snapshot |
| `platform/server/routes/orcamentista.ts` e `server/routes/orcamentista.ts` divergem | Ambos | Duas verdades de API; UI chama uma mistura | Escolher um servidor canonico e mover/registrar rotas nele |
| Dashboard Antigravity existe mas nao esta roteado | `src/pages/Orcamentista/dashboard/*`, `src/App.tsx` | Codigo existe sem entrada real no app | Registrar rota apenas se for parte do produto; caso contrario documentar como laboratorio |

## Plano de correcao enxuto

Ordem obrigatoria recomendada:

### A. Corrigir conexao UI -> endpoint

1. Escolher o servidor canonico para `/api/orcamentista`.
2. Fazer `OrcamentistaChat` e `OrcamentistaInternalActionPanel` chamarem a mesma base de API.
3. Resolver o proxy/base URL para dev e deploy.
4. Garantir que a aba nao renderize como operacional endpoints que nao existem no servidor ativo.

### B. Corrigir endpoint -> backend

1. Registrar as rotas realmente necessarias no servidor canonico.
2. Manter `manual-run` e `pipeline-view` sem regressao.
3. Registrar `chat/stream`, `workspaces`, `files`, `preview` e `etapa0/extract` somente se forem parte do fluxo atual.
4. Remover ou manter quarentenado explicitamente qualquer rota que possa escrever orcamento oficial por IA.

### C. Corrigir backend -> persistence

1. Criar endpoints minimos para persistir etapas reais do pipeline por oportunidade.
2. Reutilizar `persistence/repository.ts`, `readerPersistence.ts`, `verifierPersistence.ts`, `hitlPersistence.ts`.
3. Garantir que todo endpoint passe pela allowlist e pelo guard `canWriteConsolidationToBudget=false`.
4. Manter `orcamento_itens` fora do fluxo IA.

### D. Corrigir leitura de pipeline

1. Expandir `pipelineView.ts` ou criar read models especificos para Reader, Verifier, HITL, snapshots e pending issues.
2. Fazer os paineis usarem esses read models em vez de mocks.
3. Mostrar estados vazios reais quando nao houver execucao.
4. Diferenciar claramente Manual Run sintetico de execucao real em arquivos.

### E. So depois corrigir visual

1. Ajustar copys, badges e botoes para refletirem o estado real.
2. Remover marcadores que passam impressao de pipeline completo quando ha mock.
3. Reavaliar layout apenas depois de dados reais estarem conectados.

## Recomendacao objetiva

Nao evoluir visualmente agora.

O proximo trabalho deve ser uma correcao de conexao, nao de interface: unificar o servidor `/api/orcamentista`, fazer a UI chamar endpoints existentes no servidor realmente executado, e substituir os paineis mockados por leituras reais do pipeline persistido. Ate isso acontecer, o unico fluxo IA conectado ponta a ponta e o Manual Run interno sintetico. O chat, a Etapa 0 por HTTP, dispatch de agentes especialistas e preview/gate consolidado nao estao operacionalmente conectados ao fluxo real da aba no servidor padrao.

