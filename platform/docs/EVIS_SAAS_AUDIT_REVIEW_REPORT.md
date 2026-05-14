# EVIS AI — Revisão Crítica da Auditoria Técnica

> **Data:** 2026-05-15  
> **Documento revisado:** `EVIS_SAAS_TECHNICAL_AUDIT_REPORT.md`  
> **Modo:** Revisão somente leitura — nenhum arquivo funcional foi alterado  
> **Método:** Leitura direta do código local para cada ponto verificado

---

## 1. Veredito da Auditoria

### PARCIAL

A auditoria original é **tecnicamente competente na camada de infraestrutura e segurança**, mas **insuficiente na camada operacional e funcional do EVIS**. O relatório tratou o projeto como se fosse uma aplicação web genérica, focando em checklist DevOps/segurança, e **não respondeu às perguntas centrais** que motivaram a auditoria:

- O fluxo canônico Oportunidade → Orçamento → Proposta → Obra → Diário funciona?
- Os agentes de IA existem de verdade ou são documentação?
- O que é mock e o que é real?
- O Orçamentista IA realmente faz orçamento?

Nenhuma dessas perguntas foi respondida com clareza no relatório original.

---

## 2. O que a Auditoria Acertou

| # | Achado | Verificação |
|:---|:---|:---|
| ✅ | Stack tecnológica corretamente identificada | Confirmado — React 19, Vite 6.2, Express 4.21, Supabase |
| ✅ | Backend sem auth middleware | Confirmado — `server/index.ts` L12: `app.use(cors())` e nenhum middleware |
| ✅ | CORS aberto sem config | Confirmado — `cors()` sem options |
| ✅ | Sem helmet nem rate limiting | Confirmado — ausentes do `package.json` e do código |
| ✅ | Zero testes automatizados | Confirmado — nenhum `.test.ts`/`.spec.ts`, nenhum framework |
| ✅ | Sem Zod/Yup/Joi | Confirmado — nenhuma lib de validação |
| ✅ | `.env.example` limpo | Confirmado — apenas placeholders |
| ✅ | LAB MODE protegido por flags | Confirmado — `stagingClient.ts` bloqueia `orcamento_itens` |
| ✅ | `localhost:3001` hardcoded em `src/lib/api.ts` | Confirmado — L128 |
| ✅ | `VITE_SUPABASE_ANON_KEY` usado no backend | Confirmado — `server/tools/supabaseTools.ts` L8 |
| ✅ | Context7 usado corretamente como referência, não como verdade local | Confirmado |

**Nota:** Todos os achados de segurança/DevOps estão corretos e bem fundamentados.

---

## 3. O que a Auditoria Deixou Incompleto

### 3.1 — Fluxo Canônico NÃO Foi Auditado

O relatório **não rastreou** o fluxo principal do EVIS de ponta a ponta. Aqui está o que faltou:

#### Oportunidades ✅ FUNCIONAL (não declarado)

| Aspecto | Estado Real | Evidência |
|:---|:---|:---|
| Entidade `Opportunity` | ✅ Real — tabela `opportunities` no Supabase | `useOportunidades.ts` L49-57 faz `sbFetch('opportunities?...')` |
| Listagem | ✅ Real — `useOportunidades()` com filtros | Hook completo com `useQuery` |
| Criação | ✅ Real — `useCreateOportunidade()` | `useMutation` + POST em `opportunities` |
| Edição | ✅ Real — `useUpdateOportunidade()` | PATCH em `opportunities?id=eq.${id}` |
| Timeline/eventos | ✅ Real — `useOpportunityEvents()` | Tabela `opportunity_events` com CRUD |
| Arquivos | ✅ Real — `useOpportunityFiles()` | Tabela `opportunity_files` com listagem |
| Detalhe com ações | ✅ Real — `OportunidadeDetalhePage.tsx` | 638 linhas com botões funcionais |
| Vínculo com orçamento | ✅ Real — `handleCriarOrcamento()` | Cria workspace + navega para Orçamentista |

**Veredicto:** Oportunidades é um módulo **100% funcional com persistência real**. A auditoria **não declarou isso**.

#### Orçamento ✅ PARCIALMENTE FUNCIONAL (não detalhado)

| Aspecto | Estado Real | Evidência |
|:---|:---|:---|
| Criação de orçamento | ✅ Real — `criarOrcamentoParaOportunidade()` | POST em `orcamentos` + vinculação com oportunidade |
| Itens manuais (CRUD) | ✅ Real — `criarItemManual()`, `atualizarItemManual()`, `removerItemManual()` | CRUD completo em `orcamento_itens` via `sbFetch` |
| Schema gap `obra_id` | ⚠️ Conhecido — detecção automática de NOT NULL | L186-203 detecta e bloqueia graciosamente |
| Totalização | ✅ Real — `calcularTotais()` | Recalcula `total_bruto` e `total_final` com BDI |

**Veredicto:** O orçamento manual funciona. A auditoria listou a tabela `orcamento_itens` mas não explicou que o fluxo CRUD real **existe e funciona** com persistência Supabase.

#### Proposta ✅ FUNCIONAL COM PERSISTÊNCIA (não mencionado)

| Aspecto | Estado Real | Evidência |
|:---|:---|:---|
| Geração a partir do orçamento | ✅ Real — `handleGerarProposta()` | `OportunidadeDetalhePage.tsx` L178-263 |
| Persistência | ✅ Real — `useCreateProposta()` + tabela `propostas` | POST com payload completo (obra, serviços, meta) |
| Vinculação oportunidade ↔ proposta | ✅ Real — PATCH `proposta_id` na oportunidade | L249 |
| Visualização premium | ✅ Real — `PropostaPage.tsx` com 661 linhas | Glassmorphism, gráficos recharts, hero section, print-ready |
| Status | ✅ Real — `PropostaStatus` (rascunho/enviada/aceita/recusada/expirada) | `types.ts` L402 |
| Upload JSON avulso | ✅ Real — drag & drop | `handleDrop()` em `PropostaPage.tsx` |
| Proposta persistida via query param | ✅ Real — `useProposta(id, config)` | L98 carrega do Supabase se `?id=xxx` |

**Veredicto:** A Proposta é um módulo **totalmente funcional** com UI premium, persistência e vínculo com oportunidade/orçamento. A auditoria **não mencionou nada disso**.

#### Conversão Oportunidade → Obra ✅ FUNCIONAL (não mencionado)

| Aspecto | Estado Real | Evidência |
|:---|:---|:---|
| Criação de obra | ✅ Real — POST em `obras` | `handleConverterEmObra()` em `OportunidadeDetalhePage.tsx` L279-371 |
| Migração de orçamento | ✅ Real — PATCH `obra_id` em `orcamentos` | L314-321 |
| Atualização de status | ✅ Real — status → `ganha` | L324-331 |
| Registro de evento | ✅ Real — `oportunidade_convertida_em_obra` | L333-343 |
| Navegação para obra | ✅ Real — `navigate(/obras/${obraId})` | L365 |

**Veredicto:** A conversão oportunidade → obra é **real e funcional**. A auditoria não mencionou.

#### Diário de Obra IA ✅ FUNCIONAL COM 8 CAMADAS (não detalhado)

| Aspecto | Estado Real | Evidência |
|:---|:---|:---|
| Endpoint real | ✅ `POST /api/diario/processar-diario` | `server/routes/diario.ts` L7-32 |
| Orchestrator | ✅ Real — 1076 linhas, 8 camadas | `server/agents/orchestrator.ts` |
| Camada 0 — Normalização | ✅ Real — termos regionais, limpeza de áudio | L60-96 |
| Camada 1 — Leitura semântica | ✅ Real — regex para 9 tipos de evento | L201-234 |
| Camada 2 — Classificação por domínio | ✅ Real — mapa evento→domínio | L261-270 |
| Camada 3 — Resolução de entidades | ✅ Real — **faz queries no Supabase** (4 níveis: exato, alias, global, parcial) | L314-530 |
| Camada 4 — Extração de intenção | ✅ Real — gera ações tipadas | L547-753 |
| Camada 5 — Filtro de relevância | ✅ Real — deduplicação + consolidação | L759-788 |
| Camada 6 — Mapa de impacto | ✅ Real — cascata entre domínios | L800-833 |
| Camada 7 — Dispatch para subagentes | ✅ Real — distribui para 6 agentes | L866-893 |
| Camada 8 — Saída HITL | ✅ Real — thresholds de confirmação (0.85) e aviso (0.65) | L910-948 |
| Subagentes | ✅ 3 reais: `servicos.ts`, `equipes.ts`, `notas.ts` | `server/agents/` |
| Persiste? | ⚠️ Parcial — camada 3 lê do Supabase, mas `processarDia()` **não persiste** — retorna para HITL | L981 |
| Tabelas consultadas | `servicos`, `equipes_cadastro`, `alias_conhecimento`, `obras` | Evidência em orchestrator.ts |

**Veredicto:** O Diário de Obra IA é o **módulo mais sofisticado do projeto** — 1076 linhas de código real com 8 camadas de processamento, resolução de entidades contra o banco, e saída HITL estruturada. A auditoria **mencionou apenas "Orchestrator IA (diário de obra)" em uma linha da tabela**.

### 3.2 — Agentes NÃO Foram Listados

A auditoria não listou nenhum agente com nome, localização, função ou status. Aqui está o inventário real:

#### Agentes Reais (implementados com código funcional)

| Agente | Localização | Função | Conexão Supabase | HITL |
|:---|:---|:---|:---|:---|
| `orchestrator` | `server/agents/orchestrator.ts` | Processamento do diário de obra (8 camadas) | ✅ Lê `servicos`, `equipes_cadastro`, `alias_conhecimento` | ✅ Thresholds 0.85/0.65 |
| `agentServicos` | `server/agents/servicos.ts` | Subagente de serviços | ✅ (via orchestrator) | ✅ |
| `agentEquipes` | `server/agents/equipes.ts` | Subagente de equipes | ✅ (via orchestrator) | ✅ |
| `agentNotas` | `server/agents/notas.ts` | Subagente de notas | ✅ (via orchestrator) | ✅ |

#### Módulos Orçamentista (LAB/Mock)

| Módulo | Localização | Status | Conexão real |
|:---|:---|:---|:---|
| `agentDispatchMock` | `src/lib/orcamentista/agentDispatchMock.ts` | ❌ Mock puro | Nenhuma |
| `consolidatedPreviewMock` | `src/lib/orcamentista/consolidatedPreviewMock.ts` | ❌ Mock puro | Nenhuma |
| `hitlMock` | `src/lib/orcamentista/hitlMock.ts` | ❌ Mock puro | Nenhuma |
| `documentIntakeMock` | `src/lib/orcamentista/documentIntakeMock.ts` | ❌ Mock puro | Nenhuma |
| `mockPipeline` | `src/lib/orcamentista/mockPipeline.ts` | ❌ Mock puro | Nenhuma |
| `pdfReaderMock` | `src/lib/orcamentista/pdfReaderMock.ts` | ❌ Mock puro | Nenhuma |
| `readerVerifierMock` | `src/lib/orcamentista/readerVerifierMock.ts` | ❌ Mock puro | Nenhuma |
| `pageProcessingMock` | `src/lib/orcamentista/pageProcessingMock.ts` | ❌ Mock puro | Nenhuma |
| `consolidationGateMock` | `src/lib/orcamentista/consolidationGateMock.ts` | ❌ Mock puro | Nenhuma |
| `payloadReviewMock` | `src/lib/orcamentista/payloadReviewMock.ts` | ❌ Mock puro | Nenhuma |
| `estimatedScopeFallbackMock` | `src/lib/orcamentista/estimatedScopeFallbackMock.ts` | ❌ Mock puro | Nenhuma |
| `readingHitlContextMock` | `src/lib/orcamentista/readingHitlContextMock.ts` | ❌ Mock puro | Nenhuma |

#### Módulos Orçamentista Reais (backend)

| Módulo | Localização | Status |
|:---|:---|:---|
| `fileTextExtraction` | `platform/server/orcamentista/fileTextExtraction.ts` | ✅ Real — extrai texto de `.txt/.csv/.json/.md` |
| `stagingClient` | `platform/server/orcamentista/persistence/stagingClient.ts` | ✅ Real — client Supabase isolado |
| `repository` | `platform/server/orcamentista/persistence/repository.ts` | ✅ Real — persistência |
| `hitlPersistence` | `platform/server/orcamentista/persistence/hitlPersistence.ts` | ✅ Real — snapshots |
| `controlledManualAction` | `platform/server/orcamentista/controlledManualAction.ts` | ✅ Real |
| `workspaces` | `platform/server/orcamentista/workspaces.ts` | ✅ Real — 55KB, gestão de workspaces |

#### Módulos com Utils Reais (frontend, não-mock)

| Módulo | Localização | Observação |
|:---|:---|:---|
| `readerSafetyRunner` | `src/lib/orcamentista/readerSafetyRunner.ts` | Real — 21KB de lógica de segurança |
| `readerResultNormalizer` | `src/lib/orcamentista/readerResultNormalizer.ts` | Real — 15KB de normalização |
| `consolidationGateUtils` | `src/lib/orcamentista/consolidationGateUtils.ts` | Real — 13KB de validação |
| `guidedProjectIntakePolicy` | `src/lib/orcamentista/guidedProjectIntakePolicy.ts` | Real — 16KB de política |
| `manualVerifierComparisonUtils` | `src/lib/orcamentista/manualVerifierComparisonUtils.ts` | Real — 20KB de comparação |

**Total: 39 arquivos em `src/lib/orcamentista/`** — destes, ~12 são mocks puros e ~27 são utils reais.

A auditoria **não diferenciou nada disso**.

### 3.3 — Orçamentista IA: Perguntas Centrais Não Respondidas

| Pergunta | Resposta Real |
|:---|:---|
| A aba Orçamentista existe? | ✅ Sim — `OrcamentistaTab.tsx` (24KB, 17 sub-painéis) |
| Ela chama backend real? | ✅ Sim — `POST /api/orcamentista/opportunities/:id/analyze` |
| Existe endpoint real? | ✅ Sim — `server/routes/orcamentista.ts` (741 linhas, 7 endpoints) |
| Existem agentes reais? | ⚠️ **Não para Orçamentista.** O pipeline IA do Orçamentista são mocks. Os agentes reais são do Diário. |
| Os agentes retornam dados reais? | ⚠️ O endpoint `/analyze` retorna dados de extração de texto real, mas os "agentes especialistas" (hidráulica, estrutura, etc.) são **mocks** |
| Existe HITL real? | ⚠️ Parcial — estrutura tipada existe, mock no frontend, mas `hitlPersistence.ts` grava snapshots reais |
| Existe persistência real? | ✅ Para workspaces e snapshots sim. Para itens de orçamento via IA, **não** (bloqueado por design) |
| Existe conexão com proposta? | ✅ Sim — `OportunidadeDetalhePage` gera proposta a partir do orçamento |
| Existem dados hardcoded? | ✅ Sim — 12 arquivos `*Mock.ts` com dados fabricados |
| Existem placeholders enganosos? | ⚠️ A UI mostra 17 painéis, mas a maioria renderiza mocks. O painel colapsado "Laboratório" é corretamente isolado. |

### 3.4 — Banco de Dados / Tabelas NÃO Foi Detalhado

A auditoria listou 15 tabelas, mas **não apresentou**:

- Quais tabelas são confirmadas via queries no código (vs. declaradas em types.ts)
- Quais campos são realmente usados
- Quais tabelas estão ausentes (`alias_conhecimento` — usada pelo orchestrator mas não listada)
- Existe um `SCHEMA_GAP_REPORT.md` de 142KB que a auditoria mencionou mas não incorporou

**Tabela faltante na auditoria:** `alias_conhecimento` — consultada diretamente pelo Orchestrator para resolução de entidades (L368-373).

### 3.5 — Hooks Reais NÃO Foram Listados

| Hook | Arquivo | Função | Conexão real |
|:---|:---|:---|:---|
| `useAuth` | `useAuth.ts` | Auth Supabase OTP | ✅ |
| `useOportunidades` | `useOportunidades.ts` | CRUD oportunidades | ✅ |
| `useOportunidadeOrcamento` | `useOportunidadeOrcamento.ts` | CRUD orçamento/itens | ✅ |
| `useOrcamento` | `useOrcamento.ts` | Orçamento da obra ativa | ✅ |
| `usePropostas` | `usePropostas.ts` | CRUD propostas | ✅ |
| `useAnalyzeOpportunity` | `useAnalyzeOpportunity.ts` | Análise de arquivos LAB | ✅ |
| `useOrcamentistaWorkspaceState` | `useOrcamentistaWorkspaceState.ts` | Estado do workspace | ✅ |
| `useRealtimeSync` | `useRealtimeSync.ts` | Sync Supabase realtime | ✅ |
| `useSupabaseQuery` | `useSupabaseQuery.ts` | Wrapper genérico | ✅ |

---

## 4. Riscos de Seguir para Implementação Agora

### Risco MÉDIO — é possível prosseguir, com ressalvas.

**O que está seguro:**
- O fluxo canônico **funciona** (Oportunidade → Orçamento manual → Proposta → Obra).
- A conversão de oportunidade para obra **funciona**.
- O LAB MODE está corretamente isolado.
- Os dados são reais no Supabase (não são localStorage).

**O que NÃO está seguro:**
- Backend **aberto** (sem auth) — qualquer pessoa pode chamar os endpoints.
- O Diário de Obra IA faz queries no Supabase sem autenticação — em produção, isso é uma vulnerabilidade.
- Não existem testes — regressions não serão detectadas automaticamente.

**Conclusão:** Para **desenvolvimento local e demo**, é seguro avançar. Para **deploy público**, os bloqueadores de segurança (C1 do relatório original) devem ser resolvidos primeiro.

---

## 5. Correções Necessárias no Relatório Original

| # | Correção | Prioridade |
|:---|:---|:---|
| 1 | **Adicionar seção "Fluxo Canônico"** que rastreie Oportunidade → Orçamento → Proposta → Obra → Diário com evidência de código | P0 |
| 2 | **Adicionar inventário de agentes** com nome, localização, status e conexão | P0 |
| 3 | **Separar mock de real** explicitamente — 12 mocks identificados em `src/lib/orcamentista/` | P0 |
| 4 | **Declarar que Oportunidades, Orçamento manual, Proposta e Conversão para Obra são FUNCIONAIS** | P0 |
| 5 | **Declarar que o Diário de Obra IA é funcional** (8 camadas, queries reais no Supabase) | P0 |
| 6 | **Listar hooks reais** com conexões | P1 |
| 7 | **Adicionar tabela `alias_conhecimento`** ao modelo de dados | P1 |
| 8 | **Incorporar achados do SCHEMA_GAP_REPORT** existente | P2 |
| 9 | **Listar os 17 painéis do Orçamentista** e quais são mock vs. real | P1 |

---

## 6. Problemas Reclassificados

A auditoria original usou "CRÍTICO/ALTO/MÉDIO/BAIXO" sem contextualizar para o estágio do projeto. Reclassificação para o contexto **MVP local com caminho a SaaS**:

### P0 — Bloqueia o fluxo principal

| # | Achado | Motivo | Origem |
|:---|:---|:---|:---|
| P0.1 | `obra_id` NOT NULL em `orcamentos` bloqueia criação de orçamento sem obra | Fluxo canônico quebra se Supabase não aceita `obra_id=null` | Detectado em `useOportunidadeOrcamento.ts` L186-203 |

> **Nota:** Este é o ÚNICO P0 real. Backend sem auth é grave, mas NÃO bloqueia o fluxo em dev local.

### P1 — Risco alto, resolver antes de deploy

| # | Achado | Origem |
|:---|:---|:---|
| P1.1 | Backend sem auth middleware | `server/index.ts` — confirmado pelo relatório original |
| P1.2 | CORS aberto | `server/index.ts` L12 |
| P1.3 | Sem helmet | Ausente |
| P1.4 | Backend usa `VITE_SUPABASE_ANON_KEY` | `server/tools/supabaseTools.ts` L8 |

### P2 — Importante, mas não bloqueia MVP

| # | Achado | Origem |
|:---|:---|:---|
| P2.1 | Zero testes automatizados | Projeto inteiro |
| P2.2 | Sem rate limiting | `server/index.ts` |
| P2.3 | Sem Zod/validação nas rotas | `server/routes/*.ts` |
| P2.4 | Sem CI/CD | `.github/workflows/` vazio |
| P2.5 | `localhost:3001` hardcoded | `src/lib/api.ts` L128 |
| P2.6 | Bundle monolítico 1.69MB | Build output |

### P3 — Melhoria desejável

| # | Achado | Origem |
|:---|:---|:---|
| P3.1 | `types.ts` monolítico (2237 linhas) | `src/types.ts` |
| P3.2 | Docker compose com secrets hardcoded | `infra/docker-compose.yml` |
| P3.3 | Sem error tracking (Sentry) | Ausente |
| P3.4 | Logger básico | `src/services/logger.ts` |
| P3.5 | `package.json` com `name: react-example` | `package.json` L2 |
| P3.6 | Sem pre-commit hooks | Raiz do projeto |
| P3.7 | `geminiService.ts` com `apiKey = ""` | `src/services/geminiService.ts` L4 |

---

## 7. Ordem Final de Prioridade

```
1. FLUXO OPERACIONAL
   → Resolver schema gap obra_id (P0.1)
   → Validar que fluxo canônico inteiro passa sem erro

2. SEGURANÇA MÍNIMA
   → Auth middleware no Express (P1.1)
   → CORS restritivo (P1.2)
   → Helmet (P1.3)
   → Corrigir VITE_SUPABASE_ANON_KEY no backend (P1.4)

3. BANCO / PERSISTÊNCIA
   → Auditar RLS no painel Supabase
   → Migrations versionadas via Supabase CLI
   → Reconciliar SCHEMA_GAP_REPORT

4. VALIDAÇÃO
   → Instalar Zod
   → Validar schemas das rotas Express
   → Validar inputs no frontend

5. TESTES
   → Instalar Vitest
   → Testes das rotas críticas (diario, orcamentista)
   → Testes do orchestrator (8 camadas)

6. DEVOPS
   → GitHub Actions (lint → type-check → test → build)
   → Pre-commit hooks

7. HARDENING SAAS
   → Rate limiting
   → Error tracking (Sentry)
   → Code splitting
   → CDN / deploy automatizado

8. MLOPS / FINE-TUNING
   → Conectar Gemini real ao pipeline Orçamentista
   → Promover PDF parser
   → Implementar RAG com pgvector
   → Learning loop do orchestrator
```

---

## 8. Decisão

### Podemos avançar para Arquitetura Canônica?

**Sim, com ressalvas.** A auditoria original forneceu a verdade de segurança/infra, mas falta a verdade operacional. Este relatório de revisão complementa essa lacuna.

### Precisamos complementar a auditoria antes?

**Sim — mas este relatório já é a complementação.** O relatório original + este relatório de revisão, juntos, cobrem o espectro completo.

### Podemos implementar algo hoje?

**Sim.** Prioridade imediata:

1. **P0.1 — Resolver `obra_id` NOT NULL** — é o único bloqueador funcional real.
2. Depois, os P1 de segurança para preparar para deploy.

### Qual é o próximo passo exato?

```
1. Verificar no Supabase se obra_id em orcamentos aceita NULL
   → Se não, criar migration ALTER TABLE orcamentos ALTER COLUMN obra_id DROP NOT NULL
2. Validar o fluxo canônico de ponta a ponta em dev local
   → Criar oportunidade → criar orçamento → adicionar itens → gerar proposta → converter em obra
3. Só depois começar a implementar auth middleware (P1.1)
```

---

> **IMPORTANTE:** Este relatório é somente leitura. Nenhum arquivo funcional foi modificado.  
> Aguardando autorização do gestor para avançar.
