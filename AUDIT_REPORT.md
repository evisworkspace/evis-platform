# EVIS — Auditoria Arquitetural

**Data:** 2026-05-19
**Branch auditada:** feat/orcamentista-integrate-approved-line
**Commit base:** 910acf8
**Agente:** Codex GPT-5

## Sumário executivo

- 13 findings: P0=3, P1=7, P2=3
- Top 3 riscos para o produto nos próximos 90 dias:
  - Drift entre contrato oficial (`CLAUDE.md`/`CODING_STANDARDS.md`) e código legado ainda em produção (`codigo_referencia`, `id_servico`, cache local antigo).
  - Orçamentista cresceu com múltiplos mocks e painéis grandes ainda importados no runtime, dificultando distinguir fluxo produtivo de laboratório.
  - Backend/frontend têm contratos `/api/orcamentista/*` espalhados sem client único tipado, elevando custo de mudança de endpoint.
- Estimativa total de cleanup: 8-12 dias-pessoa

## Inventário

### Domínios auditados

| Área | Arquivos TS/TSX | LOC aprox. | Último commit |
|---|---:|---:|---|
| `src/` | ver módulos abaixo | 18k+ | 2026-05-18 |
| `server/` | rotas + agents + services | auditado por `rg` | 2026-05-18 |
| `platform/server/` | rotas + domínio orcamentista | auditado por `rg` | 2026-05-18 |
| `domains/orcamentista/` | MCP/logic | auditado por `rg` | 2026-05-07 |
| `skills/` | 6 skills locais | baixo | 2026-04-15 |

`domains/institucional/`, `node_modules/`, `dist/`, `.env*` e `domains/orcamentista/vault/` ficaram fora do escopo conforme o orquestrador. `domains/orcamentista/vault/` não foi aberto.

### Módulos frontend

| Módulo | Arquivos | LOC |
|---|---:|---:|
| `src/components/Orcamento` | 2 | 494 |
| `src/components/ui` | 10 | 676 |
| `src/pages/Oportunidade` | 19 | 7104 |
| `src/pages/Orcamentista` | 6 | 1766 |

Além dessas subpastas, há componentes soltos em `src/components/*.tsx` e páginas soltas em `src/pages/*.tsx`; os maiores aparecem em Hot-spots e P1/P2.

### Hooks

| Hook | LOC | React Query | Mutations | `fetch(` | `sbFetch` |
|---|---:|---:|---:|---:|---:|
| `useAnalyzeOpportunity.ts` | 140 | 2 | 2 | 1 | 0 |
| `useAuth.ts` | 43 | 0 | 0 | 0 | 0 |
| `useDashboardCentral.ts` | 243 | 6 | 0 | 0 | 6 |
| `useOportunidadeOrcamento.ts` | 387 | 5 | 0 | 0 | 8 |
| `useOportunidades.ts` | 213 | 11 | 5 | 0 | 10 |
| `useOrcamentistaWorkspaceState.ts` | 80 | 2 | 0 | 1 | 0 |
| `useOrcamento.ts` | 184 | 10 | 7 | 0 | 9 |
| `usePropostas.ts` | 102 | 6 | 3 | 0 | 5 |
| `useRealtimeSync.ts` | 53 | 2 | 0 | 0 | 0 |
| `useSupabaseQuery.ts` | 38 | 3 | 0 | 0 | 2 |

### Rotas Express reais

| Arquivo | Método/path |
|---|---|
| `server/routes/orcamentista.ts:148` | `GET /llm-providers` |
| `server/routes/orcamentista.ts:207` | `POST /opportunities/:opportunityId/analyze` |
| `server/routes/orcamentista.ts:494` | `POST /opportunities/:opportunityId/files` |
| `server/routes/orcamentista.ts:570` | `POST /manual-run` |
| `server/routes/orcamentista.ts:598` | `GET /pipeline-view` |
| `server/routes/orcamentista.ts:630` | `GET /workspaces` |
| `server/routes/orcamentista.ts:641` | `POST /workspaces` |
| `server/routes/orcamentista.ts:653` | `GET /workspaces/:id/attachments` |
| `server/routes/orcamentista.ts:664` | `GET /workspaces/:id/state` |
| `server/routes/orcamentista.ts:735` | `POST /workspaces/:id/files` |
| `server/routes/orcamentista.ts:775` | `GET /workspaces/:id/preview` |
| `server/routes/orcamentista.ts:792` | `POST /chat/stream` |
| `server/routes/orcamentista.ts:839` | `POST /workspaces/:workspaceId/generate-official-budget` |
| `server/routes/diario.ts:7` | `POST /processar-diario` |
| `server/routes/diario.ts:35` | `POST /rascunho` |

### Tipos

`src/types.ts` tem 2237 LOC e 192 `export type`. O arquivo virou ponto único real, mas está inchado e contém legado conflitante com regra atual.

### Mocks

Mocks em `src/lib/orcamentista/`: `agentDispatchMock.ts`, `consolidatedPreviewMock.ts`, `consolidationGateMock.ts`, `documentIntakeMock.ts`, `estimatedScopeFallbackMock.ts`, `hitlMock.ts`, `mockPipeline.ts`, `pageProcessingMock.ts`, `payloadReviewMock.ts`, `pdfReaderMock.ts`, `readerVerifierMock.ts`, `readingHitlContextMock.ts`.

Consumidores em runtime incluem `src/pages/Oportunidade/OrcamentistaAgentDispatchPanel.tsx:14`, `src/pages/Oportunidade/OrcamentistaConsolidatedPreviewPanel.tsx:6`, `src/pages/Oportunidade/OrcamentistaHitlPanel.tsx:14`, `src/pages/Oportunidade/OrcamentistaTab.tsx:26`, `src/pages/Oportunidade/OrcamentistaReaderVerifierPanel.tsx:17`, `src/pages/Oportunidade/OrcamentistaMissingProjectFallbackPanel.tsx:7`, `src/pages/Oportunidade/OrcamentistaPageProcessingPanel.tsx:13`, `src/pages/Oportunidade/OrcamentistaPayloadReviewPanel.tsx:19`.

### SQL solto

Arquivos SQL encontrados na raiz: `DIAGNOSTICO_SCHEMA.sql`, `LIMPAR_BANCO.sql`, `schema-completo.sql`, `schema-discovery.sql`.

Arquivos SQL em `platform/docs/`: `archive/P3.3_SUPABASE_SCHEMA_CORRECTIONS.sql`, `ops/*`, `sql/*`, `sql_proposals/*`. Há propostas recentes para `orcamentos.obra_id` nullable e baseline Orçamentista.

### Skills

Skills locais existentes em `skills/`: `avanco_servicos`, `executor_autonomo`, `notas_tecnicas`, `presenca_equipes`, `relative_weekly`, `seguranca_trabalho`. `CLAUDE.md` não declara uma lista de skills por nome; ele referencia apenas `@platform/docs/CODING_STANDARDS.md`. Não foi possível comparar com `~/.claude/skills/` sem extrapolar fora do contrato local.

## Findings P0 (ação imediata)

### P0-01 — `codigo_referencia` ainda aparece em código produtivo

- **Onde:** `src/types.ts:5`, `src/lib/servicoCodigo.ts:221`, `platform/server/orcamentista/workspaces.ts:663`, `platform/server/orcamentista/workspaces.ts:1019`
- **Regra violada:** `CLAUDE.md` regra "Campo do item de orçamento: codigo (não codigo_referencia)" e `CODING_STANDARDS.md` seção 10.
- **Por que é débito:** O contrato oficial proíbe `codigo_referencia`, mas o tipo central e lógica de workspace ainda leem/escrevem esse nome, o que sustenta drift com banco e UI.
- **Recomendação:** Separar legado de `Servico` em um adaptador explícito e remover `codigo_referencia` de payloads produtivos; manter apenas migração/SQL histórico comentado.
- **Esforço:** M

### P0-02 — Contrato `obra_id` diverge entre padrões e SQL autoritativo antigo

- **Onde:** `CLAUDE.md:13`, `platform/docs/sql/SCHEMA_OFICIAL_V1.sql:32`, `platform/docs/sql/SCHEMA_OFICIAL_V1.sql:122`, `platform/docs/sql_proposals/ORCAMENTISTA_001_ORCAMENTOS_OBRA_ID_NULLABLE.sql:27`
- **Regra violada:** `CLAUDE.md` regra "`obra_id` nas tabelas: tipo TEXT (não UUID com FK)".
- **Por que é débito:** O repositório mantém um `SCHEMA_OFICIAL_V1.sql` com `obra_id UUID REFERENCES public.obras(id)` enquanto docs recentes dizem TEXT/nullable; qualquer agente pode aplicar o SQL errado.
- **Recomendação:** Marcar `SCHEMA_OFICIAL_V1.sql` como obsoleto ou substituir por schema autoritativo atual; concentrar propostas em uma pasta "draft" sem nome oficial.
- **Esforço:** S

### P0-03 — Cache local viola prefixo obrigatório

- **Onde:** `src/AppContext.tsx:69`, `src/AppContext.tsx:102`, `src/AppContext.tsx:119`, `src/AppContext.tsx:123`, `src/AppContext.tsx:153`
- **Regra violada:** `AUDIT_ORCHESTRATOR.md` invariantes herdadas, regra 8: prefixo `deka_cache_v2_` obrigatório.
- **Por que é débito:** Estado e config usam `badida_state_v3`/`badida_cfg_v2`, criando cache fora do namespace obrigatório e risco de migração invisível.
- **Recomendação:** Criar migração de leitura das chaves antigas para `deka_cache_v2_*`, depois remover as antigas com rotina controlada.
- **Esforço:** S

## Findings P1 (próximos 30 dias)

### P1-01 — Mocks do Orçamentista são importados por painéis runtime

- **Onde:** `src/pages/Oportunidade/OrcamentistaTab.tsx:26`, `src/pages/Oportunidade/OrcamentistaAgentDispatchPanel.tsx:14`, `src/pages/Oportunidade/OrcamentistaHitlPanel.tsx:14`, `src/pages/Oportunidade/OrcamentistaConsolidatedPreviewPanel.tsx:6`
- **Regra violada:** `AUDIT_ORCHESTRATOR.md` Fase C3: mock consumido em runtime é débito.
- **Por que é débito:** O fluxo de produto e o laboratório convivem no bundle de produção; isso aumenta risco de usuário interpretar mock como leitura real.
- **Recomendação:** Colocar mocks atrás de feature flag/lab route isolada e trocar imports diretos por um provider de dados explícito.
- **Esforço:** M

### P1-02 — Contratos `/api/orcamentista/*` estão espalhados sem client tipado

- **Onde:** `src/components/ConfigPage.tsx:16`, `src/hooks/useAnalyzeOpportunity.ts:110`, `src/pages/OrcamentistaChat.tsx:285`, `src/pages/Oportunidade/OrcamentistaInternalActionPanel.tsx:74`, `src/pages/Oportunidade/OrcamentistaContextStatePanel.tsx:77`
- **Regra violada:** `CODING_STANDARDS.md` seção 5 exige padrão de hooks para dados.
- **Por que é débito:** Chamadas internas `/api/*` são permitidas, mas paths, parsing e erros estão duplicados em componentes/hooks sem contrato central.
- **Recomendação:** Criar `src/lib/orcamentistaApi.ts` ou hooks por endpoint com tipos de request/response, mantendo `fetch` interno encapsulado.
- **Esforço:** M

### P1-03 — `AppContext` expõe superfície ampla e mantém storage diretamente

- **Onde:** `src/AppContext.tsx:4`, `src/AppContext.tsx:69`, `src/AppContext.tsx:118`, `src/AppContext.tsx:159`
- **Regra violada:** `CODING_STANDARDS.md` seção 8: contexto é o caminho oficial de config/estado.
- **Por que é débito:** O provider acumula estado global, persistência local, toast e reset em um único arquivo, dificultando migração de cache e teste de contexto.
- **Recomendação:** Extrair persistência local para helper versionado e manter o provider como composição de estado, sem acesso direto a chaves.
- **Esforço:** S

### P1-04 — Cálculo/formatador financeiro está duplicado

- **Onde:** `src/hooks/useOrcamento.ts:17`, `platform/server/routes/orcamentista.ts:1465`, `src/pages/Oportunidade/OrcamentistaProductView.tsx:134`, `src/pages/Oportunidade/OrcamentistaManualItemsPanel.tsx:77`, `src/pages/PropostaPage.tsx:48`
- **Regra violada:** `AUDIT_ORCHESTRATOR.md` Fase C1: regras de negócio duplicadas.
- **Por que é débito:** Total de orçamento e formatação BRL aparecem em frontend, backend e proposta; uma alteração de BDI ou arredondamento tende a divergir.
- **Recomendação:** Centralizar cálculo em helper compartilhado por camada ou ao menos criar contrato de cálculo único e testes de regressão.
- **Esforço:** M

### P1-05 — Status de oportunidades duplicado em mapas locais

- **Onde:** `src/types.ts:421`, `src/pages/OportunidadesPage.tsx:34`, `src/pages/OportunidadeDetalhePage.tsx:27`
- **Regra violada:** `AUDIT_ORCHESTRATOR.md` Fase C2: status enum duplicado.
- **Por que é débito:** O union type é central, mas labels/classes são recriados nas páginas; mudança de status exige atualizar múltiplos arquivos.
- **Recomendação:** Mover labels/cores de `OpportunityStatus` para `src/lib/opportunityStatus.ts` e consumir em todas as páginas.
- **Esforço:** S

### P1-06 — Arquivos críticos grandes e quentes sem teste local

- **Onde:** `src/types.ts` hot-spot 30 alterações/60 dias e 2237 LOC; `src/pages/Oportunidade/OrcamentistaTab.tsx` 24 alterações/60 dias e 536 LOC; `src/App.tsx` 15 alterações/60 dias e 515 LOC; nenhum `*.test.*` encontrado por `rg --files`.
- **Regra violada:** `AUDIT_ORCHESTRATOR.md` Fase F3: arquivo crítico sem teste.
- **Por que é débito:** Hot-spots grandes concentram regras e regressões; ausência de teste torna refactors caros.
- **Recomendação:** Começar por testes de helpers/hooks (`useOrcamento`, status utils, cálculo de proposta) antes de testar UI pesada.
- **Esforço:** L

### P1-07 — `any` explícito em código de domínio e UI crítica

- **Onde:** `server/routes/orcamentista.ts:83`, `server/routes/orcamentista.ts:283`, `src/pages/PropostaPage.tsx:34`, `src/components/Diario.tsx:59`, `src/pages/Oportunidade/OrcamentistaProductView.tsx:153`
- **Regra violada:** `CODING_STANDARDS.md` seção 3: tipos oficiais em `src/types.ts`.
- **Por que é débito:** O repositório declara tipos centrais, mas trechos críticos perdem contrato com `any`, principalmente ao cruzar IA, orçamento e proposta.
- **Recomendação:** Priorizar DTOs de resposta de API e modelos de proposta; tolerar `unknown` em bordas com normalização explícita.
- **Esforço:** M

## Findings P2 (oportunista)

### P2-01 — Muitos componentes acima de 300 LOC

- **Onde:** `src/pages/Orcamentista/dashboard/DashboardApp.tsx:1` (1443 LOC), `src/pages/OrcamentistaChat.tsx:1` (1000 LOC), `src/pages/OportunidadeDetalhePage.tsx:1` (667 LOC), `src/pages/PropostaPage.tsx:1` (629 LOC), `src/components/Cronograma.tsx:1` (525 LOC)
- **Regra violada:** `AUDIT_ORCHESTRATOR.md` Fase E5.
- **Por que é débito:** Arquivos longos dificultam revisão e aumentam conflito de merge, mas não quebram produção por si.
- **Recomendação:** Extrair subcomponentes apenas quando tocar nessas áreas por feature; não fazer refactor isolado em massa.
- **Esforço:** L

### P2-02 — `console.*` em frontend produtivo

- **Onde:** `src/App.tsx:65`, `src/hooks/useRealtimeSync.ts:15`, `src/pages/Oportunidade/OrcamentistaProductView.tsx:225`, `src/pages/OrcamentistaChat.tsx:424`
- **Regra violada:** `AUDIT_ORCHESTRATOR.md` Fase E2.
- **Por que é débito:** Logs diretos poluem console e bypassam `src/services/logger.ts`.
- **Recomendação:** Trocar por `logger` com nível e ambiente, ou remover logs de diagnóstico antigos.
- **Esforço:** XS

### P2-03 — SQL autoritativo e SQL de proposta convivem sem índice de status

- **Onde:** `schema-completo.sql:1`, `platform/docs/sql/SCHEMA_OFICIAL_V1.sql:32`, `platform/docs/sql_proposals/ORCAMENTISTA_002_BASELINE_ORCAMENTOS_ORCAMENTO_ITENS.sql:31`, `platform/docs/sql_proposals/ORCAMENTISTA_CLEANUP_TEST_DATA.sql:1`
- **Regra violada:** `MAPA_DO_PROJETO.md` manutenção: evitar desorganização na raiz; `AUDIT_ORCHESTRATOR.md` Fase A7/E.
- **Por que é débito:** Existem SQLs de diagnóstico, schema oficial antigo e propostas sem manifesto único de aplicação.
- **Recomendação:** Criar `platform/docs/sql/README.md` com status (`authoritative`, `proposal`, `archive`, `diagnostic`) e mover SQLs soltos da raiz.
- **Esforço:** S

## Apêndices

### A. Lista completa de TODO/FIXME

- `platform/server/orcamentista/graphEtapa0.ts:86` — TODO para chamada LLM com Structured Output.

### B. Hot-spots (top 30 arquivos mais alterados)

| Alterações | Arquivo |
|---:|---|
| 30 | `src/types.ts` |
| 24 | `src/pages/Oportunidade/OrcamentistaTab.tsx` |
| 15 | `src/App.tsx` |
| 11 | `src/pages/OportunidadeDetalhePage.tsx` |
| 10 | `server/routes/orcamentista.ts` |
| 10 | `src/pages/OrcamentistaChat.tsx` |
| 9 | `src/components/Diario.tsx` |
| 9 | `src/components/ConfigPage.tsx` |
| 7 | `src/pages/Oportunidade/OrcamentistaInternalActionPanel.tsx` |
| 7 | `src/lib/api.ts` |
| 6 | `src/pages/Oportunidade/OrcamentistaRealReaderSandboxPanel.tsx` |
| 6 | `src/AppContext.tsx` |
| 6 | `src/components/Cronograma.tsx` |
| 5 | `src/components/Equipes.tsx` |
| 5 | `src/index.css` |
| 5 | `src/components/Servicos.tsx` |
| 5 | `src/components/Relatorios.tsx` |
| 4 | `src/hooks/useOportunidades.ts` |
| 4 | `src/hooks/useAnalyzeOpportunity.ts` |
| 4 | `platform/server/routes/orcamentista.ts` |
| 4 | `src/hooks/useOportunidadeOrcamento.ts` |
| 4 | `src/pages/Oportunidade/OrcamentistaContextStatePanel.tsx` |
| 4 | `platform/server/orcamentista/persistence/stagingClient.ts` |
| 4 | `src/components/Notas.tsx` |
| 4 | `platform/server/orcamentista/persistence/index.ts` |
| 4 | `src/pages/OportunidadesPage.tsx` |
| 4 | `src/services/geminiService.ts` |
| 4 | `platform/server/orcamentista/contracts.ts` |
| 3 | `src/initialData.ts` |
| 3 | `src/main.tsx` |

### C. Endpoints órfãos / hooks órfãos

Consumidos:

- `GET /llm-providers` por `src/components/ConfigPage.tsx:16`.
- `POST /opportunities/:opportunityId/analyze` por `src/hooks/useAnalyzeOpportunity.ts:110`.
- `POST /opportunities/:opportunityId/files` por `src/pages/Oportunidade/OrcamentistaContextStatePanel.tsx:77`.
- `GET /pipeline-view` por `src/pages/Oportunidade/OrcamentistaInternalActionPanel.tsx:74`.
- `POST /manual-run` por `src/pages/Oportunidade/OrcamentistaInternalActionPanel.tsx:116`.
- `GET /workspaces`, `GET /workspaces/:id/preview`, `POST /workspaces/:id/files`, `POST /chat/stream`, `POST /workspaces/:workspaceId/generate-official-budget` por `src/pages/OrcamentistaChat.tsx`.
- `GET /workspaces/:id/state` por `src/hooks/useOrcamentistaWorkspaceState.ts:66`.
- `POST /api/diario/processar-diario` por `src/lib/api.ts:134`.

Possivelmente órfãos nesta rodada:

- `POST /workspaces` (`server/routes/orcamentista.ts:641`) não apareceu como chamado no `src/`.
- `GET /workspaces/:id/attachments` (`server/routes/orcamentista.ts:653`) não apareceu como chamado no `src/`.
- `POST /api/diario/rascunho` (`server/routes/diario.ts:35`) não apareceu como chamado no `src/`.

### D. Skills declaradas vs existentes

Existentes localmente:

- `skills/avanco_servicos/SKILL.md`
- `skills/executor_autonomo/SKILL.md`
- `skills/notas_tecnicas/SKILL.md`
- `skills/presenca_equipes/SKILL.md`
- `skills/relative_weekly/SKILL.md`
- `skills/seguranca_trabalho/SKILL.md`

Discrepância: `CLAUDE.md` não lista skills por nome, então não há base declarativa local para comparar. `~/.claude/skills/` não foi auditado por estar fora do workspace do produto.

### E. SQL solto vs autoritativo

- `schema-completo.sql` na raiz não apresentou evidência de RLS/policies no grep executado.
- `platform/docs/sql/SCHEMA_OFICIAL_V1.sql` contém `obra_id UUID REFERENCES public.obras(id)` em múltiplas tabelas, divergindo da regra atual.
- `platform/docs/sql_proposals/ORCAMENTISTA_002_BASELINE_ORCAMENTOS_ORCAMENTO_ITENS.sql` documenta `orcamentos.obra_id text NULL` e `orcamento_itens.codigo text NULL`, alinhado com a regra atual.
- `platform/docs/sql_proposals/ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_MIGRATION_CANDIDATE.sql:15` explicita RLS sem `USING (true)`, enquanto SQLs antigos em `platform/docs/sql/02_CORRECOES_BANCO.sql:103` e `platform/docs/archive/P3.3_SUPABASE_SCHEMA_CORRECTIONS.sql:171` mantêm policies abertas.

### F. Dependency map

- Ciclos de import não foram detectados por ferramenta dedicada nesta rodada; não houve evidência via `rg` suficiente para reportar finding.
- Imports profundos `../../../` ou mais em `src/` não apareceram no `rg` executado.
- Cross-domain proibido de componente importando página não apareceu no `rg` executado.

### G. Estado dos contratos

- `types.ts` inclui `Orcamento.obra_id?: string` em `src/types.ts:164`, compatível com proposta nullable, mas `CODING_STANDARDS.md` ainda mostra `obra_id: string` no exemplo oficial.
- `types.ts` inclui `Servico.id_servico?: string` e `Servico.codigo_referencia?: string` em `src/types.ts:3` e `src/types.ts:5`, incompatível com a regra atual sem adaptador de legado.
- RLS atual não pôde ser confirmado contra banco real porque a auditoria não chama APIs externas nem migrations. Evidência local indica policies abertas antigas (`USING (true)`) e propostas novas sem policies abertas.

### Decisões tomadas em ambiguidade

- `NOITE_RELATORIO.md` era leitura obrigatória, mas não existe na raiz; a auditoria continuou com `CLAUDE.md`, `CODING_STANDARDS.md`, `MAPA_DO_PROJETO.md` e código local.
- `fetch()` para `/api/*` interno foi classificado como OK pela regra D1, mas a dispersão dos contratos internos virou P1 por manutenção.
- `fetch()` para `https://api.imgbb.com` e `ollama` não foi classificado como violação de Supabase; são integrações externas/client-side a revisar em segurança separada.
- SQL em `platform/docs/archive/` foi usado como evidência de risco documental, não como schema vigente.
