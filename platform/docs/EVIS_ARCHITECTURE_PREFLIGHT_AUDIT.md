# EVIS - Architecture Preflight Audit

> Fase: 4A.P  
> Tipo: auditoria e documentacao  
> Status: sem codigo operacional, sem UI, sem migration, sem banco  
> Fonte primaria: repositorio local atual em `C:\Users\User\Evis AI`

## 1. Objetivo

Mapear a arquitetura atual do EVIS antes de seguir para migrations e persistencia real do Orçamentista IA.

Esta auditoria consolida:

- estrutura geral do repositorio;
- modulos ativos;
- modulos legados ou paralelos;
- fluxo canonico Lead/Oportunidade -> Orçamentista IA -> Proposta -> Obra -> Diario de Obra IA;
- estado real versus mock/local;
- riscos de arquitetura, dados e schema;
- regras inviolaveis para as proximas fases;
- roadmap recomendado ate o Orçamentista IA operacional em 90%-100%.

Nenhum SQL foi executado. Nenhuma migration foi criada. Nenhum arquivo de codigo operacional ou UI foi alterado.

## 2. Arquivos lidos e auditados

Leitura direta de conteudo:

- `platform/docs/EVIS_CANONICAL_PROCESS.md`
- `platform/docs/EVIS_NAVIGATION_AND_ENTITY_MODEL.md`
- `platform/docs/EVIS_WORKFLOW_OPORTUNIDADE_OBRA.md`
- `platform/docs/SCHEMA_GAP_REPORT.md`
- `platform/maps/EVIS_MODULES_STATUS.md`
- `platform/maps/EVIS_PRODUCT_FLOW.md`
- `platform/maps/EVIS_AI_PIPELINE.md`
- `platform/maps/EVIS_DATABASE_MAP.md`
- `orcamentista/docs/EVIS_ORCAMENTISTA_IA_CANONICAL.md`
- `orcamentista/docs/EVIS_ORCAMENTISTA_DATA_MODEL.md`
- `orcamentista/docs/EVIS_ORCAMENTISTA_PIPELINE.md`
- `orcamentista/docs/EVIS_ORCAMENTISTA_FIRST_REAL_READER_SANDBOX.md`
- `orcamentista/docs/EVIS_ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_SCHEMA_AUDIT.md`
- `docs/06_CREATE_OPPORTUNITIES_MVP.sql`
- `docs/07_RLS_OPPORTUNITIES_MVP.sql`
- `docs/08_CREATE_PROPOSTAS_MVP.sql`
- `docs/SCHEMA_OFICIAL_V1.sql`
- `platform/docs/sql_proposals/ORCAMENTISTA_001_ORCAMENTOS_OBRA_ID_NULLABLE.sql`
- `src/types.ts`
- `src/lib/api.ts`
- `src/lib/supabase.ts`
- `src/App.tsx`
- `src/hooks/useOportunidades.ts`
- `src/hooks/useOportunidadeOrcamento.ts`
- `src/hooks/useOrcamento.ts`
- `src/hooks/usePropostas.ts`
- `src/pages/Oportunidade/OrcamentistaTab.tsx`
- `src/pages/Oportunidade/OrcamentistaManualItemsPanel.tsx`
- `src/pages/OportunidadeDetalhePage.tsx`
- `src/pages/OportunidadesPage.tsx`
- `src/pages/PropostaPage.tsx`
- `src/pages/DashboardPage.tsx`
- `src/pages/OrcamentistaChat.tsx`
- `server/index.ts`
- `platform/server/index.ts`
- `platform/server/routes/orcamentista.ts`
- `package.json`

Leitura por inventario, busca e cruzamento de padroes:

- `platform/docs/**`
- `orcamentista/docs/**`
- `docs/**`
- `src/hooks/**`
- `src/lib/orcamentista/**`
- `src/pages/Oportunidade/**`
- `src/pages/**`
- `server/**`
- `platform/server/**`
- arquivos SQL/schema/migration existentes no repositorio.

Arquivos em `docs/archive/**`, `platform/docs/archive/**`, backups, build outputs e vaults foram tratados como historico ou referencia operacional, nao como fonte de verdade quando divergem do repositorio atual.

## 3. Estrutura geral do repositorio

Visao atual:

```text
src/
  App principal, componentes operacionais, paginas, hooks, lib e tipos.

src/pages/Oportunidade/
  Aba contextual do Orçamentista IA e paineis da esteira mock/local.

src/lib/orcamentista/
  Contratos, policies, mocks, normalizadores, comparadores, gates e utilitarios puros.

server/
  Backend legado/menor, centrado no Diario de Obra e agentes operacionais.

platform/server/
  Backend paralelo mais amplo, com Diario, Orçamentista, referencias, SINAPI, workspaces, GCS e rotas experimentais.

docs/
  SQLs e documentacao historica/ativa de schema, oportunidades, propostas e Supabase.

platform/docs/
  Documentacao canonica de produto, mapas, schema gap e propostas SQL.

orcamentista/docs/
  Documentacao canonica tecnica do Orçamentista IA.

domains/orcamentista/
  Logica/vault/ferramentas do Orçamentista fora do frontend principal.

domains/institucional/
  Site institucional separado; nao e fonte de verdade do produto EVIS operacional.
```

## 4. Fluxo canonico vigente

A fonte primaria de fluxo e `platform/docs/EVIS_CANONICAL_PROCESS.md`.

Fluxo inviolavel:

```text
Lead/Oportunidade
  -> Orçamentista IA
  -> Proposta
  -> Obra
  -> Diario de Obra IA
```

Consequencias:

- Oportunidade nasce antes de Obra.
- Orçamentista IA atua somente em pre-obra, dentro da Oportunidade.
- Proposta nasce de orcamento estruturado e validado.
- Obra nasce apos oportunidade ganha/fechada.
- Diario de Obra IA atua somente depois de existir Obra.
- IA pode propor; humano valida; sistema registra somente depois de aprovacao explicita.

## 5. Mapa de modulos ativos

| Modulo | Local atual | Estado observado | Persistencia |
|---|---|---|---|
| Dashboard/Home | `src/pages/DashboardPage.tsx` | Hub simples para modulos | Sem indicadores reais profundos |
| Oportunidades | `src/pages/OportunidadesPage.tsx`, `useOportunidades.ts` | MVP funcional: lista e criacao | Real em `contacts` e `opportunities` |
| Detalhe da Oportunidade | `src/pages/OportunidadeDetalhePage.tsx` | Dados, eventos, abrir Orçamentista, gerar proposta, converter em obra | Real em `opportunities`, `opportunity_events`, `propostas`, `obras` |
| Orçamentista IA contextual | `src/pages/Oportunidade/OrcamentistaTab.tsx` | Aba contextual com orcamento real + workspace IA local/mock | Misto: real para orcamento manual; mock/local para IA |
| Orçamento manual da Oportunidade | `useOportunidadeOrcamento.ts`, `OrcamentistaManualItemsPanel.tsx` | Cria orcamento e CRUD de itens manuais | Real em `orcamentos` e `orcamento_itens` |
| Propostas | `usePropostas.ts`, `PropostaPage.tsx` | Gera snapshot a partir de orcamento + itens | Real em `propostas` |
| Obras | `src/App.tsx`, componentes de Obra | Modulo operacional preservado em `/obras` e `/obras/:obraId` | Real em `obras` e tabelas por `obra_id` |
| Diario de Obra IA | `src/components/Diario.tsx`, `server/routes/diario.ts` | Cockpit operacional parcial, orquestrador backend legado | Real/parcial em `diario_obra`, `notas`, etc. apos HITL/sync |
| Configuracoes | `ConfigPage`, `AppContext` | Configura Supabase/chaves/obra ativa | Local/config frontend |

## 6. Mapa de modulos legados ou paralelos

| Area | Evidencia | Risco |
|---|---|---|
| Rota standalone `/orcamentista` | `src/pages/OrcamentistaChat.tsx` e rota em `src/App.tsx` | Pode operar fora do contexto canonico de Oportunidade se nao for isolada como legado |
| Backend duplicado | `server/` e `platform/server/` | Duas fontes de rotas/agentes podem divergir; `platform/server` e mais completo, `server` e legado |
| Build output versionado | `platform/server/build/**` apareceu no inventario | Nao deve ser fonte de verdade para arquitetura |
| Docs duplicados | `docs/**` e `platform/docs/**` contem arquivos equivalentes de schema/referencia | Risco de divergencia entre schema oficial, gap report e SQLs historicos |
| Orçamentista em vault/local | `domains/orcamentista/vault/**`, `platform/server/orcamentista/workspaces.ts` | Workspace filesystem/GCS nao substitui persistencia canonica no Supabase |
| Rota backend de geracao oficial | `platform/server/routes/orcamentista.ts` endpoint `generate-official-budget`, chamado por `src/pages/OrcamentistaChat.tsx` | Pode inserir em `orcamento_itens` a partir de preview e usar `obra_id = workspaceId`; nao e codigo morto e precisa quarentena/auditoria antes de uso |
| Site institucional | `domains/institucional/web/**` | Modulo separado; nao deve influenciar schema/fluxo EVIS operacional |

## 7. Fonte canonica atual do schema

Nao houve introspeccao do banco real nesta fase. A fonte mais confiavel hoje e a combinacao:

1. Codigo atual que efetivamente le/escreve (`src/hooks/**`, `src/App.tsx`, `src/pages/**`).
2. SQLs de criacao recentes para Oportunidades e Propostas (`docs/06_CREATE_OPPORTUNITIES_MVP.sql`, `docs/08_CREATE_PROPOSTAS_MVP.sql`).
3. `platform/docs/SCHEMA_GAP_REPORT.md` como reconciliacao documental viva.
4. `docs/SCHEMA_OFICIAL_V1.sql` / `platform/docs/sql/SCHEMA_OFICIAL_V1.sql` como base historica oficial de Obra, mas incompleta para Oportunidades, Propostas e Orçamentos.

Arquivos como `schema-completo.sql`, `schema-discovery.sql` e diagnosticos sao apoio de investigacao. Eles nao devem prevalecer sobre codigo atual + migrations/propostas revisadas + gap report.

## 8. Tabelas existentes relevantes

Confirmadas em SQL/documentacao/codigo:

- `contacts`
- `opportunities`
- `opportunity_events`
- `opportunity_files`
- `propostas`
- `orcamentos`
- `orcamento_itens`
- `obras`
- `servicos`
- `equipes_cadastro`
- `equipes_presenca`
- `diario_obra`
- `notas`
- `pendencias`
- `fotos`
- `alias_conhecimento`

Referenciadas por codigo/documentacao e ainda exigindo reconciliacao conforme `SCHEMA_GAP_REPORT.md`:

- `brain_narrativas`
- `relatorios_semanais`
- `sinapi_composicoes`
- `catalogo_servicos_evis`
- `servicos_referencia_origem`
- `composicoes_modelo`
- `precos_referencia_historico`
- `cotacoes_reais`
- `snapshot_orcamento_itens`
- `sugestoes_catalogo`
- `vw_referencias_servicos_evis`

Ausentes hoje para persistencia do Reader/Verifier/HITL:

- `orc_reader_runs`
- `orc_reader_outputs`
- `orc_reader_safety_evaluations`
- `orc_verifier_runs`
- `orc_reader_verifier_comparisons`
- `orc_reader_verifier_divergences`
- `orc_hitl_issues`
- `orc_hitl_decisions`
- `orc_context_snapshots`

## 9. Relacoes reais entre entidades

Relacoes observadas em SQL e hooks:

```text
contacts.id
  -> opportunities.contact_id

opportunities.id
  -> opportunity_events.opportunity_id
  -> opportunity_files.opportunity_id
  -> propostas.opportunity_id

opportunities.orcamento_id
  -> orcamentos.id
  -> orcamento_itens.orcamento_id

opportunities.proposta_id
  -> propostas.id

opportunities.obra_id
  -> obras.id

obras.id
  -> servicos.obra_id
  -> equipes_cadastro.obra_id
  -> equipes_presenca.obra_id
  -> diario_obra.obra_id
  -> notas.obra_id
  -> pendencias.obra_id
  -> fotos.obra_id
```

Observacoes:

- `opportunities.orcamento_id` e ponte real usada pelo frontend, mas nao aparece como FK formal no SQL de Oportunidades.
- `propostas.orcamento_id` tambem fica sem FK ate reconciliacao formal.
- `orcamentos.obra_id` continua usado pelo fluxo legado de Obra.
- Para orcamentos de Oportunidade, a estrategia segura atual e `obra_id = NULL`, nunca `obra_id = opp_<id>`.
- `orcamentista_workspace_id` e textual/operacional; nao e tabela relacional canonica.
- `orcamentista_workspace_id` esta semanticamente sobrecarregado: em alguns fluxos representa workspace/oportunidade (`opp_<id>`), enquanto apos conversao pode ser tratado como `obraId`. Essa ambiguidade aumenta o risco de usar `obra_id` incorretamente em etapa pre-obra.
- `opportunity_files` ainda nao tem pagina estruturada, status de leitura persistido ou vinculo com outputs Reader/Verifier.

## 10. Estado atual do Orçamentista IA

### 10.1 Real hoje

- Criacao/consulta de Oportunidade em `opportunities`.
- Criacao/consulta de eventos em `opportunity_events`.
- Abertura contextual do Orçamentista em `/oportunidades/:id/orcamentista`.
- Gravacao de `orcamentista_workspace_id` textual quando a area e aberta.
- Criacao explicita de orcamento oficial da oportunidade em `orcamentos`.
- Vinculo `opportunities.orcamento_id`.
- CRUD manual de itens oficiais em `orcamento_itens`.
- Leitura read-only de `opportunity_files`.
- Geracao de proposta persistida em `propostas` a partir de `orcamento_itens`.
- Conversao manual de oportunidade em obra com insert em `obras`, patch em `opportunities.obra_id` e patch em `orcamentos.obra_id` quando ha orcamento.

### 10.2 Mock/local hoje

- Intake guiado e contexto tecnico (`OrcamentistaGuidedIntakePanel`).
- Inventario enriquecido de documentos e paginas (`documentIntakeMock`, `documentInventory`).
- Fallback para projeto ausente (`missingProjectPolicy`, `estimatedScopeFallbackMock`).
- Processamento de paginas/renderizacao (`pageProcessingMock`).
- Reader + Verifier visual (`readerVerifierMock`).
- HITL do Orçamentista (`hitlMock`, estado local).
- Dispatch para agentes especialistas (`agentDispatchMock`).
- Preview consolidado (`consolidatedPreviewMock`).
- Gate de consolidacao (`consolidationGateMock`).
- Revisao humana do payload simulado (`payloadReviewMock`, estado local).
- Sandbox de primeira leitura real controlada: gera prompt package e aplica normalizacao/safety local; nao chama IA.
- Ingestao manual de JSON do Reader: parse local de JSON colado, normalizacao, safety gate e dimensional checks.
- Ingestao manual de JSON do Verifier: parse local de JSON colado e comparacao local Reader x Verifier.
- Pipeline visual e preview IA legado (`mockPipeline`, `mockAiPreview`).

### 10.3 Parcial/experimental fora da aba principal

- `OrcamentistaChat` e rotas em `platform/server/routes/orcamentista.ts` podem operar sobre workspace local/vault, anexos, GCS, OpenRouter/Vertex e preview.
- Essa camada e poderosa, mas ainda e paralela ao contrato seguro da aba contextual. Deve ser tratada como experimental ate ser reconciliada com Oportunidade, Reader/Verifier/HITL persistido e gates.

## 11. O que e real versus mock

| Item | Estado |
|---|---|
| Oportunidade | Real |
| Contato | Real |
| Eventos da oportunidade | Real |
| Arquivos da oportunidade | Tabela real; UI atual usa leitura read-only e mocks enriquecidos |
| Orcamento da oportunidade | Real, criado explicitamente |
| Itens manuais | Reais em `orcamento_itens` |
| Itens gerados por IA | Mock/local na aba segura; endpoint backend paralelo existe e deve ficar bloqueado |
| Proposta | Real, snapshot em `propostas` |
| Conversao em Obra | Real, manual |
| Diario de Obra | Real/parcial no modulo Obra |
| Reader real automatico | Ainda nao |
| Verifier real automatico | Ainda nao |
| Safety gate | Logica local real, persistencia ausente |
| Dimensional checks | Logica local real, persistencia ausente |
| HITL Orçamentista | Local/mock, persistencia ausente |
| Comparacao Reader x Verifier | Local/mock/manual, persistencia ausente |
| Contexto validated/pending/blocked | Local/mock, persistencia ausente |
| Consolidacao IA em orçamento oficial | Nao deve ocorrer na aba segura; existe rota backend paralela arriscada |

## 12. Riscos arquiteturais

1. **Rota backend insegura para consolidacao IA.** O endpoint `POST /api/orcamentista/workspaces/:workspaceId/generate-official-budget` pode criar orcamento e inserir `orcamento_itens` a partir de preview, usando `obra_id: opportunity.orcamentista_workspace_id || workspaceId`. Isso conflita com a regra atual de nao usar `obra_id = opp_<id>` e com o gate Reader/Verifier/HITL persistente ainda inexistente. Essa rota e chamada por `src/pages/OrcamentistaChat.tsx`, portanto nao deve ser tratada como codigo morto.

2. **Standalone `/orcamentista` pode escapar do contexto.** A rota existe fora de `/oportunidades/:id/orcamentista`; deve ser marcada como legado/hub experimental ou exigir opportunity context.

3. **Dois backends paralelos.** `server/` e `platform/server/` coexistem. O segundo e mais amplo; o primeiro e legado. Sem decisao oficial, rotas e agentes podem divergir.

4. **Documentacao de status parcialmente otimista.** Alguns mapas indicam Reader/Planner/HITL "reais", mas o codigo atual da aba segura mostra mock/local/manual sem persistencia. A fonte de verdade deve ser o codigo atual + schema reconciliado.

5. **Conversao em obra ainda permissiva.** `OportunidadeDetalhePage` permite converter oportunidade em obra por acao manual mesmo sem proposta aceita. Isso e util para MVP, mas viola a regra canonica em uso produtivo.

6. **Orçamentista IA e Diario precisam continuar separados.** A interface atual preserva a separacao, mas rotas/backend experimentais devem ser impedidos de gravar execucao operacional a partir de pre-obra.

7. **Evento posterior nao substitui auditoria previa.** A rota `generate-official-budget` registra o evento `orcamento_oficial_gerado` depois da escrita em `orcamento_itens`. Esse evento documenta que a escrita ocorreu, mas nao substitui trilha auditavel previa de decisao humana, gate de consolidacao e autorizacao explicita.

## 13. Riscos de dados e schema

1. `orcamentos` e `orcamento_itens` sao reais, mas nao estao plenamente reconciliados no schema oficial base.
2. `opportunities.orcamento_id` e `propostas.orcamento_id` nao possuem FK formal documentada nos SQLs atuais.
3. `opportunity_files` nao possui estrutura persistente de paginas, status de leitura, qualidade de fonte, hashes ou lineage para Reader/Verifier.
4. Nao ha tabelas persistentes para raw Reader, normalized Reader, safety, Verifier, comparison, divergences, HITL issues, HITL decisions e context snapshots.
5. RLS atual de Propostas e amplo (`propostas_open_access` com `USING (true)`); RLS de Oportunidades e MVP amplo/autenticado. Isso nao serve para dados sensiveis de decisao humana, margem, custos e payloads brutos.
6. `propostas.payload` e snapshot JSON, mas falta versionamento formal de orcamento/proposta.
7. `relatorios_semanais` e `brain_narrativas` aparecem em codigo/sync, mas seguem como risco de divergencia de schema.
8. Sem coluna `company_id`/tenant consistente, o modelo nao esta pronto para SaaS multiempresa.
9. Decisoes HITL locais se perdem ao recarregar a tela e nao formam trilha auditavel.
10. Raw JSON de IA pode conter dados sensiveis; precisa politica de retencao, acesso e imutabilidade.

## 14. Riscos de UI

1. A aba do Orçamentista mistura, na mesma tela, orcamento oficial real e muitos paineis mock/local. Os avisos existem, mas o volume de blocos pode confundir usuario final.
2. Termos tecnicos como workspace, payload, Reader, Verifier e HITL ainda aparecem em UI experimental; documentos de produto recomendam linguagem mais clara para usuario final.
3. A rota `/orcamentista` fora da oportunidade pode induzir uso fora do fluxo canonico.
4. A conversao em obra por botao manual deve exibir guard forte quando nao houver proposta aceita.
5. `opportunity_files` e mostrado como consulta read-only, mas a UI enriquecida usa inventario mockado; isso precisa ficar visualmente separado ate haver upload/processamento real.

## 15. Riscos de multiplas fontes de verdade

Fontes concorrentes atuais:

- `docs/SCHEMA_OFICIAL_V1.sql`
- `platform/docs/sql/SCHEMA_OFICIAL_V1.sql`
- `docs/06_CREATE_OPPORTUNITIES_MVP.sql`
- `docs/08_CREATE_PROPOSTAS_MVP.sql`
- `platform/docs/SCHEMA_GAP_REPORT.md`
- `platform/maps/EVIS_DATABASE_MAP.md`
- hooks e tipos em `src/**`
- backend `platform/server/**`
- vault/workspaces em `domains/orcamentista/**`

Regra recomendada:

```text
Codigo atual que le/escreve + SQL revisado + SCHEMA_GAP_REPORT prevalecem.
Mapas, arquivos archive, vaults e builds sao referencia secundaria.
```

Antes de qualquer migration, gerar uma auditoria read-only do banco real e reconciliar com `SCHEMA_GAP_REPORT.md`.

## 16. Regras arquiteturais inviolaveis

1. O fluxo cronologico nao pode ser invertido: Oportunidade -> Orçamentista -> Proposta -> Obra -> Diario.
2. Orçamentista IA nunca grava Diario, medicao, produtividade, presenca real ou progresso fisico.
3. Diario de Obra IA nunca atua em oportunidade sem obra.
4. `opportunity_id` e a ancora obrigatoria do Orçamentista enquanto nao existe obra.
5. `orcamento_id` pode ser nulo nas leituras iniciais, mas e obrigatorio antes de consolidacao/escrita oficial.
6. `obra_id = opp_<id>` e proibido.
7. `orcamentista_workspace_id` nao e substituto relacional de `obra_id`, `opportunity_id` ou `orcamento_id`.
8. Reader/Verifier nunca escrevem direto em `orcamento_itens`.
9. Escrita em `orcamento_itens` por IA exige comparacao, safety, HITL resolvido, gate aprovado, revisao humana explicita e auditoria persistida.
10. Raw JSON e normalized JSON devem ser separados.
11. Verifier, comparacao, divergencias, HITL issue e HITL decision devem permanecer separados.
12. Decisao humana deve ser append-only ou auditavel, com ator, data, notas e payload da decisao.
13. Contexto `pending` ou `blocked` nao alimenta quantitativos finais.
14. Proposta deve ser snapshot de orcamento validado/versionado, nao view viva de dados mutaveis.
15. Conversao em obra deve exigir proposta aceita ou decisao humana formal registrada.
16. RLS/tenant devem ser decididos antes de persistir payloads sensiveis.

## 17. Roadmap recomendado ate Orçamentista IA 90%-100%

### Fase 4A.P0 - Quarentena e alinhamento

- Marcar `/orcamentista` standalone como legado/experimental ou exigir `opportunity_id`.
- Desabilitar ou proteger `generate-official-budget` ate existir gate persistido.
- Tratar `src/pages/OrcamentistaChat.tsx` como caller ativo de `POST /api/orcamentista/workspaces/:workspaceId/generate-official-budget`; a rota nao deve ser considerada codigo morto.
- Garantir que qualquer evento como `orcamento_oficial_gerado` seja apenas registro posterior, nunca substituto de decisao humana/gate/autorizacao antes da escrita.
- Registrar explicitamente que a aba segura nao consolida IA em `orcamento_itens`.
- Atualizar mapas que dizem "Reader/Planner/HITL reais" para "mock/local/manual" quando aplicavel.

### Fase 4A.P1 - Auditoria read-only do banco real

- Rodar somente queries de introspeccao revisadas.
- Confirmar colunas, constraints, indexes, RLS e triggers de `opportunities`, `opportunity_files`, `orcamentos`, `orcamento_itens`, `propostas`, `obras`.
- Atualizar `SCHEMA_GAP_REPORT.md` com a diferenca real entre banco e repo.

### Fase 4B - Migration de persistencia Reader/Verifier/HITL

- Criar migration incremental para:
  - `orc_reader_runs`;
  - `orc_reader_outputs`;
  - `orc_reader_safety_evaluations`;
  - `orc_verifier_runs`;
  - `orc_reader_verifier_comparisons`;
  - `orc_reader_verifier_divergences`;
  - `orc_hitl_issues`;
  - `orc_hitl_decisions`;
  - `orc_context_snapshots`.
- Incluir RLS minima segura e indices por `opportunity_id`, `orcamento_id`, `opportunity_file_id`, `page_number`.

### Fase 4C - Arquivos e paginas

- Definir upload real de arquivos em `opportunity_files`.
- Criar ou definir estrutura para paginas/processamento se necessario.
- Persistir hash, mime, origem, qualidade, status de leitura e pagina.

### Fase 4D - Reader persistente manual

- Persistir JSON bruto colado, normalizado, safety gate e dimensional checks.
- Garantir imutabilidade do raw.
- Sem escrita em `orcamento_itens`.

### Fase 4E - Verifier persistente e comparacao

- Persistir output do Verifier, comparison, agreement score e divergencias deduplicadas.
- Gerar HITL issue persistente para divergencias high/critical.

### Fase 4F - HITL persistente

- Implementar fila de HITL persistente.
- Decisoes humanas auditaveis.
- Estados de contexto validated/pending/blocked.

### Fase 4G - Gate de consolidacao real

- Gate le somente dados persistidos.
- Gate produz payload candidato, sem escrever automaticamente.
- Revisao humana aprova item a item.

### Fase 4H - Escrita controlada em `orcamento_itens`

- Inserir apenas itens aprovados.
- Manter origem, confidence, lineage e referencia a decision/gate.
- Bloquear itens inferidos, pendentes ou sem rastreabilidade.

### Fase 4I - Proposta versionada

- Gerar proposta a partir de versao/gate aprovado.
- Preservar snapshot imutavel.
- Impedir alteracao silenciosa de proposta enviada.

### Fase 4J - Conversao robusta em Obra

- Converter apenas proposta aceita ou excecao formal.
- Migrar orcamento validado como base inicial, nao como execucao real.
- Preservar link historico com Oportunidade e Proposta.

### Fase 5 - IA operacional de producao

- Integrar motores reais de Reader e Verifier com jobs, filas, retries, logs e custos.
- Implementar observabilidade, testes de regressao com microcasos e auditoria de prompts.
- Aplicar tenant/RLS definitivo.
- Separar UI experimental de UI final de usuario.

## 18. Decisao preflight

O EVIS possui um esqueleto canonico correto e um MVP real de Oportunidade -> Orcamento manual -> Proposta -> Obra. O Orçamentista IA ja tem contratos, policies, mocks e UI experimental suficientes para orientar a implementacao, mas ainda nao tem persistencia auditavel do fluxo Reader/Verifier/HITL.

Antes de migrations produtivas, o passo correto e:

```text
1. Quarentenar caminhos paralelos que escrevem orcamento oficial.
2. Confirmar schema real por auditoria read-only.
3. Migrar persistencia Reader/Verifier/HITL.
4. Só depois liberar consolidacao controlada em orcamento_itens.
```

## 19. Confirmacoes

- Nenhuma migration criada nesta fase.
- Nenhum SQL executado nesta fase.
- Nenhum banco alterado nesta fase.
- Nenhum codigo operacional alterado nesta fase.
- Nenhuma UI alterada nesta fase.
- Arquivo criado nesta fase: `platform/docs/EVIS_ARCHITECTURE_PREFLIGHT_AUDIT.md`.
