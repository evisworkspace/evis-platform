# EVIS — Arquitetura Canônica Oficial

> **Data:** 2026-05-15 | **Versão:** 1.0  
> **Base:** `EVIS_SAAS_TECHNICAL_AUDIT_REPORT.md` + `EVIS_SAAS_AUDIT_REVIEW_REPORT.md`  
> **Modo:** Somente leitura — nenhum arquivo foi modificado

---

## 1. Resumo Executivo

O EVIS é uma plataforma SaaS de gestão de obras de construção civil com IA embarcada. O sistema cobre o ciclo completo: captação comercial (oportunidades), orçamentação assistida por IA, geração de propostas, conversão em obra, diário de obra com IA de 8 camadas, e gestão operacional.

**Estado consolidado após auditoria e revisão:**

- **Fluxo canônico pré-obra** (Oportunidade → Orçamento manual → Proposta → Conversão) — **FUNCIONAL** com persistência Supabase real.
- **Diário de Obra IA** — **FUNCIONAL** com orchestrator de 8 camadas, resolução de entidades contra o banco, e saída HITL.
- **Orçamentista IA** — **PARCIAL**: backend real para extração de texto e workspaces; pipeline de agentes especialistas ainda em LAB/mock.
- **Segurança/DevOps** — **INSUFICIENTE** para produção: sem auth middleware, sem helmet, CORS aberto, zero testes.
- ~~**P0 único**~~ — constraint `obra_id NOT NULL` **já resolvida** (migration aplicada em 2026-05-04). Fluxo pré-obra desbloqueado.

---

## 2. Fluxo Canônico Oficial

```
PRÉ-OBRA                                    PÓS-CONVERSÃO
────────────────────────────────────────     ────────────────────────────────────
                                             
Lead/Contato                                 Obra (ATIVA)
  │                                            │
  ▼                                            ├── Diário de Obra IA (8 camadas)
Oportunidade ────────┐                         │     └── Orchestrator → Subagentes
  │                  │                         │         └── HITL → Persistência
  ▼                  │                         │
Orçamentista IA      │                         ├── Cronograma
  │ (LAB parcial)    │                         ├── Equipes / Presença
  ▼                  │                         ├── Pendências
Orçamento Manual ◄───┘                         ├── Notas / Fotos
  │                                            ├── Custos / Medições
  ▼                                            │
Proposta Comercial                             └── Relatórios Semanais
  │
  ▼
Aprovação → Conversão em Obra ──────────────────►
```

### Regra: separação estrita pré-obra / pós-obra

- **Pré-obra:** Oportunidade, Orçamentista IA, Orçamento, Proposta
- **Pós-obra:** Diário IA, Cronograma, Equipes, Pendências, Relatórios
- Orçamentista IA **nunca** opera no contexto de uma obra ativa
- Diário de Obra IA **nunca** opera sem `obra_id` válido

---

## 3. Separação de Domínios

### 3.1 Oportunidades — REAL FUNCIONAL

| Aspecto | Detalhe |
|:---|:---|
| Função | Pipeline comercial: captação, qualificação, acompanhamento |
| Estado | ✅ CRUD completo com persistência Supabase |
| Arquivos | `useOportunidades.ts`, `OportunidadeDetalhePage.tsx`, `OportunidadesPage.tsx` |
| Tabelas | `opportunities`, `opportunity_events`, `opportunity_files`, `contacts` |
| Risco | Baixo |
| Prioridade | Manutenção — funcional |

### 3.2 Orçamentista IA — PARCIAL (LAB + Real)

| Aspecto | Detalhe |
|:---|:---|
| Função | Análise de documentos para gerar orçamento assistido por IA |
| Estado | ⚠️ Backend real (extração texto, workspaces, snapshots) + Frontend ~12 mocks |
| Arquivos backend | `server/routes/orcamentista.ts` (741 linhas), `platform/server/orcamentista/` |
| Arquivos frontend | `OrcamentistaTab.tsx` + 16 sub-painéis, `src/lib/orcamentista/` (39 arquivos) |
| Tabelas | `opportunity_files` (leitura), `orc_context_snapshots` (escrita LAB) |
| Risco | Médio — muitos mocks podem confundir o que funciona |
| Prioridade | Alta — consolidar mínimo funcional |

### 3.3 Orçamentos — REAL FUNCIONAL

| Aspecto | Detalhe |
|:---|:---|
| Função | CRUD de orçamentos e itens manuais |
| Estado | ✅ Criação, vinculação com oportunidade, CRUD de itens |
| Arquivos | `useOportunidadeOrcamento.ts`, `useOrcamento.ts` |
| Tabelas | `orcamentos`, `orcamento_itens` |
| Risco | ~~P0~~ **Descartado** — `obra_id` nullable desde 2026-05-04 |
| Prioridade | Verificar constraint imediatamente |

### 3.4 Propostas — REAL FUNCIONAL

| Aspecto | Detalhe |
|:---|:---|
| Função | Geração de proposta comercial a partir do orçamento |
| Estado | ✅ Geração, persistência, visualização premium, impressão/PDF |
| Arquivos | `usePropostas.ts`, `PropostaPage.tsx` (661 linhas), `OportunidadeDetalhePage.tsx` |
| Tabelas | `propostas` |
| Risco | Baixo |
| Prioridade | Manutenção — funcional |

### 3.5 Obras — REAL FUNCIONAL

| Aspecto | Detalhe |
|:---|:---|
| Função | Gestão da obra: serviços, equipes, pendências, cronograma, fotos, notas |
| Estado | ✅ Módulo mais maduro — roteamento completo em `App.tsx` |
| Arquivos | Componentes em `src/components/` (Cronograma, Diario, Equipes, Fotos, etc.) |
| Tabelas | `obras`, `servicos`, `equipes_cadastro`, `equipes_presenca`, `pendencias`, `notas`, `fotos` |
| Risco | Baixo |
| Prioridade | Manutenção |

### 3.6 Diário de Obra IA — REAL FUNCIONAL

| Aspecto | Detalhe |
|:---|:---|
| Função | Processamento de narrativas do dia com IA de 8 camadas |
| Estado | ✅ Orchestrator completo com queries Supabase reais |
| Arquivos | `server/agents/orchestrator.ts` (1076 linhas), `servicos.ts`, `equipes.ts`, `notas.ts` |
| Endpoint | `POST /api/diario/processar-diario` |
| Tabelas consultadas | `servicos`, `equipes_cadastro`, `alias_conhecimento`, `obras` |
| HITL | ✅ Thresholds 0.85 (confirmação) / 0.65 (aviso) |
| Risco | Médio — `processarDia()` não persiste (retorna para HITL) |
| Prioridade | Manutenção + completar persistência pós-HITL |

### 3.7 Autenticação/Segurança — INSUFICIENTE

| Aspecto | Detalhe |
|:---|:---|
| Frontend | ✅ Supabase Auth OTP |
| Backend | ❌ Zero auth middleware |
| Prioridade | P1 — antes de qualquer deploy |

### 3.8 DevOps — AUSENTE

| Aspecto | Detalhe |
|:---|:---|
| CI/CD | ❌ Workflows vazios |
| Testes | ❌ Zero |
| Prioridade | P2 |

---

## 4. Matriz Real vs LAB vs Mock vs Futuro

### Módulos REAL FUNCIONAL

| Módulo | Evidência | Opera? |
|:---|:---|:---|
| CRUD Oportunidades | `useOportunidades.ts` → `opportunities` | ✅ |
| Timeline de Eventos | `useOpportunityEvents()` → `opportunity_events` | ✅ |
| Arquivos da Oportunidade | `useOpportunityFiles()` → `opportunity_files` | ✅ |
| Criação de Orçamento | `criarOrcamentoParaOportunidade()` → `orcamentos` | ✅* |
| CRUD Itens Manuais | `criarItemManual()` → `orcamento_itens` | ✅ |
| Geração de Proposta | `handleGerarProposta()` → `propostas` | ✅ |
| Visualização de Proposta | `PropostaPage.tsx` (premium, print-ready) | ✅ |
| Conversão em Obra | `handleConverterEmObra()` → `obras` | ✅ |
| Diário de Obra IA | Orchestrator 8 camadas + 3 subagentes | ✅ |
| Auth Frontend | `useAuth.ts` → Supabase OTP | ✅ |

*\* Depende da constraint `obra_id` — ver seção 7.1*

### Módulos PARCIAL

| Módulo | O que funciona | O que falta |
|:---|:---|:---|
| Orçamentista Backend | Extração de texto, workspaces, snapshots | Pipeline IA real com agentes |
| Orçamentista Endpoint `/analyze` | Lê arquivos, extrai texto, retorna evidências | Gemini não gera itens (flag off) |
| Persistência HITL (Orçamentista) | Snapshots de contexto | Decisões HITL completas |
| Diário Persistência pós-HITL | Orchestrator retorna ações | Gravação automática pós-aprovação |

### Módulos LAB MODE (protegidos por flags)

| Módulo | Proteção | Arquivo |
|:---|:---|:---|
| Análise IA Gemini | `EVIS_ORCAMENTISTA_ENABLE_AI_ANALYZE=true` | `orcamentista.ts` |
| Acesso Supabase principal | `EVIS_ALLOW_MAIN_SUPABASE_DEV_MODE=true` | `stagingClient.ts` |
| Escrita `orcamento_itens` via IA | ❌ Bloqueado por `stagingClient` | `stagingClient.ts` L38-39 |

### Módulos MOCK (12 arquivos — NÃO operam com dados reais)

| Mock | Arquivo | Decisão |
|:---|:---|:---|
| Pipeline de agentes | `mockPipeline.ts` | Congelar — substituir por real |
| Dispatch de agentes | `agentDispatchMock.ts` | Congelar |
| Preview consolidado | `consolidatedPreviewMock.ts` | Congelar |
| Gate de consolidação | `consolidationGateMock.ts` | Congelar |
| HITL mock | `hitlMock.ts` | Congelar |
| Intake de documentos | `documentIntakeMock.ts` | Congelar |
| PDF reader | `pdfReaderMock.ts` | Congelar — promover depois |
| Reader-verifier | `readerVerifierMock.ts` | Congelar |
| Page processing | `pageProcessingMock.ts` | Congelar |
| Payload review | `payloadReviewMock.ts` | Congelar |
| Estimated scope | `estimatedScopeFallbackMock.ts` | Congelar |
| Reading HITL context | `readingHitlContextMock.ts` | Congelar |

### Módulos FUTURO (documentados, não implementados)

| Módulo | Status |
|:---|:---|
| Portal do Cliente | Documentado — `PortalCliente.tsx` existe como shell |
| RAG / pgvector | ADR existe — não implementado |
| Fine-tuning | Não prioridade |
| Relatórios automatizados IA | Parcial — relatórios manuais existem |

---

## 5. Orçamentista IA — Definição Oficial

### Papel

O Orçamentista IA é o módulo que assiste a criação de orçamentos a partir de documentos da oportunidade. Ele opera **exclusivamente no contexto pré-obra**, vinculado a uma oportunidade.

### O que já existe (REAL)

1. **Upload de arquivos** → `POST /api/orcamentista/opportunities/:id/files`
2. **Extração de texto** → `fileTextExtraction.ts` (`.txt`, `.csv`, `.json`, `.md`)
3. **Endpoint de análise** → `POST /api/orcamentista/opportunities/:id/analyze`
4. **Workspaces** → `workspaces.ts` (55KB) — gestão completa de workspace por oportunidade
5. **Staging client** → `stagingClient.ts` — client Supabase isolado com guard de tabelas
6. **Snapshots de contexto** → `hitlPersistence.ts` → tabela `orc_context_snapshots`
7. **Preview de memória** → Lê `01_MEMORIA_ORCAMENTO.json` do workspace
8. **Ação manual controlada** → `controlledManualAction.ts`

### O que é MOCK (frontend — 12 arquivos em `src/lib/orcamentista/`)

Todos os arquivos `*Mock.ts` geram dados fabricados para simular o pipeline completo (agentes especialistas, reader-verifier, consolidação, HITL). **Nenhum deles acessa Supabase ou Gemini.**

### O que é LAB (controlado por flags)

Quando `EVIS_ORCAMENTISTA_ENABLE_AI_ANALYZE=true`, o endpoint `/analyze` pode chamar Gemini para gerar preview de itens. Mesmo assim, **nunca escreve em `orcamento_itens`**.

### Primeira entrega funcional (definição oficial)

```
Oportunidade
  → Upload de arquivos reais
  → Extração de texto local
  → Gemini gera itens sugeridos (preview LAB)
  → Usuário revisa e aprova itens (HITL manual)
  → Itens aprovados são criados via criarItemManual() existente
  → Orçamento vira base para proposta
```

**Não requer:** novos agentes, PDF parser, RAG, pgvector, pipeline mock.

---

## 6. Diário de Obra IA — Definição Oficial

### Papel

O Diário de Obra IA processa narrativas diárias (texto, áudio transcrito) e gera ações estruturadas para atualizar o estado da obra. Opera **exclusivamente pós-conversão em obra**.

### Arquitetura (8 camadas — REAL)

| Camada | Função | Conexão DB |
|:---|:---|:---|
| C0 | Normalização (termos regionais, limpeza áudio) | — |
| C1 | Leitura semântica (9 tipos de evento via regex) | — |
| C2 | Classificação por domínio (7 domínios) | — |
| C3 | Resolução de entidades (4 níveis de confiança) | ✅ `servicos`, `equipes_cadastro`, `alias_conhecimento` |
| C4 | Extração de intenção (ações tipadas) | — |
| C5 | Filtro de relevância (deduplicação) | — |
| C6 | Mapa de impacto (cascata entre domínios) | — |
| C7 | Dispatch para 6 subagentes | — |
| C8 | Saída HITL (thresholds 0.85/0.65) | — |

### Subagentes reais

| Agente | Arquivo | Função |
|:---|:---|:---|
| `agentServicos` | `server/agents/servicos.ts` | Atualização de serviços |
| `agentEquipes` | `server/agents/equipes.ts` | Presença de equipes |
| `agentNotas` | `server/agents/notas.ts` | Criação de notas |
| `cronograma_agent` | Declarado, dispatch montado | ⚠️ Sem implementação própria |
| `pendencias_agent` | Declarado, dispatch montado | ⚠️ Sem implementação própria |
| `fotos_agent` | Declarado, dispatch montado | ⚠️ Sem implementação própria |

### Regra: `processarDia()` NUNCA persiste

A função retorna `ProcessamentoOrquestrador` com todas as ações propostas. A persistência deve ocorrer **somente após aprovação HITL**.

---

## 7. Banco de Dados — Regras Canônicas

### Tabelas confirmadas por queries no código

| Tabela | Módulo | Operação |
|:---|:---|:---|
| `opportunities` | Oportunidades | CRUD |
| `opportunity_events` | Oportunidades | CRUD |
| `opportunity_files` | Oportunidades + Orçamentista | Read + Upload |
| `contacts` | Oportunidades | CRUD |
| `orcamentos` | Orçamento | CRUD |
| `orcamento_itens` | Orçamento | CRUD (bloqueado para IA) |
| `propostas` | Propostas | CRUD |
| `obras` | Obras | CRUD |
| `servicos` | Obras + Diário IA | Read + Update |
| `equipes_cadastro` | Obras + Diário IA | Read |
| `equipes_presenca` | Obras | Read + Insert |
| `pendencias` | Obras | CRUD |
| `notas` | Obras + Diário | CRUD |
| `fotos` | Obras | CRUD |
| `alias_conhecimento` | Diário IA (Orchestrator C3) | Read |
| `orc_context_snapshots` | Orçamentista LAB | Insert |

### Regras de `obra_id` vs `opportunity_id`

- **Orçamento pré-obra:** vinculado via `opportunity.orcamento_id`, **não** via `orcamentos.obra_id`
- **Orçamento pós-conversão:** `obra_id` preenchido por `handleConverterEmObra()`
- **Proposta:** vinculada via `opportunity_id` e `orcamento_id`
- **Obra:** criada na conversão, recebe o `orcamento_id`

### 7.1 ~~Ponto Crítico~~ RESOLVIDO: `obra_id NOT NULL`

**Status: ✅ RESOLVIDO** — Migration aplicada em 2026-05-04.

**Histórico:** A tabela `orcamentos` originalmente tinha `obra_id NOT NULL`. A migration `ORCAMENTISTA_001_ORCAMENTOS_OBRA_ID_NULLABLE.sql` executou `ALTER TABLE public.orcamentos ALTER COLUMN obra_id DROP NOT NULL` com sucesso.

**Estado atual:** `obra_id` é `text NULL`, sem FK para `obras`, com índice btree neutro.

**Teste funcional:** Orçamento criado com `obra_id = NULL` via oportunidade — confirmado.

**Referência:** `EVIS_ORCAMENTOS_OBRA_ID_NULLABILITY_CHECK.md`

---

## 8. HITL — Human in the Loop

### Regras oficiais

| Situação | Ação IA | Requer HITL? |
|:---|:---|:---|
| Confiança ≥ 0.85 | Executar automaticamente | ❌ |
| Confiança 0.65–0.84 | Sugerir com aviso | ⚠️ Recomendado |
| Confiança < 0.65 | Bloquear — pedir input | ✅ Obrigatório |
| Impacto financeiro | Qualquer valor | ✅ Obrigatório |
| Alteração em proposta | Qualquer campo | ✅ Obrigatório |
| Alteração em cronograma | Datas ou marcos | ✅ Obrigatório |
| Escrita em `orcamento_itens` via IA | Sempre | ✅ Obrigatório (atualmente bloqueado) |
| Criação de obra | Sempre | ✅ Obrigatório |

### Thresholds do Orchestrator (implementados)

- `threshold_confirmacao: 0.85` — ação pode ser executada
- `threshold_aviso: 0.65` — ação sugerida com pergunta ao gestor

---

## 9. Segurança e DevOps

### P1 — Resolver antes de deploy

| Item | Estado | Ação |
|:---|:---|:---|
| Auth middleware Express | ❌ Ausente | Adicionar validação JWT Supabase |
| CORS restritivo | ❌ `cors()` aberto | Configurar origens permitidas |
| Helmet | ❌ Ausente | `npm install helmet` + `app.use(helmet())` |
| Backend usando `VITE_SUPABASE_ANON_KEY` | ⚠️ | Migrar para `SUPABASE_SERVICE_ROLE_KEY` |

### P2 — Resolver para qualidade

| Item | Estado | Ação |
|:---|:---|:---|
| Rate limiting | ❌ Ausente | `express-rate-limit` |
| Zod validation | ❌ Ausente | Validar schemas de request |
| Testes | ❌ Zero | Instalar Vitest |
| CI/CD | ❌ Workflows vazios | GitHub Action mínima |
| Error tracking | ❌ Ausente | Sentry ou equivalente |
| `localhost:3001` hardcoded | ⚠️ `src/lib/api.ts` L128 | Usar proxy do Vite |

---

## 10. Fine-tuning, RAG e MLOps

### Decisões oficiais

| Item | Decisão | Motivo |
|:---|:---|:---|
| Fine-tuning | ❄️ Congelado | Não há dados suficientes; fluxo mínimo primeiro |
| RAG / pgvector | ❄️ Congelado | ADR existe, implementar após contratos estáveis |
| Prompt engineering | ✅ Obrigatório | Templates versionados em `readerPromptTemplates.ts` |
| Schemas versionados | ✅ Obrigatório | Tipos em `types.ts` e `contracts.ts` |
| Logs de IA | ⚠️ Parcial | `console.log` no orchestrator — migrar para logger |
| Feedback HITL | ⚠️ Parcial | Snapshots existem, decisões não são capturadas |
| MLOps leve | ❄️ Futuro | Após estabilizar fluxo + testes + CI |

---

## 11. Definition of Done Oficial

Uma funcionalidade só é considerada **PRONTA** se:

- [ ] UI conectada a backend real (não mock)
- [ ] Backend com endpoint real e validação de entrada
- [ ] Persistência correta (Supabase), se aplicável
- [ ] Estado de loading, erro e sucesso na UI
- [ ] HITL quando confiança < 0.85 ou impacto financeiro/contratual
- [ ] Logs mínimos no backend (`console.log` estruturado)
- [ ] Build passando (`npm run build`)
- [ ] Type-check passando (`tsc --noEmit`)
- [ ] Teste manual documentado (screenshot ou descrição)
- [ ] Ausência de mock enganoso na UI produtiva

---

## 12. Ordem Oficial de Implementação

```
FASE 0 — Desbloqueio (P0) ✅ CONCLUÍDA
  1. ✅ Constraint obra_id NOT NULL verificada e resolvida (2026-05-04)
  2. ✅ Migration aplicada com sucesso
  3. Validar fluxo canônico ponta a ponta em dev local ← PRÓXIMO PASSO

FASE 1 — Orçamentista Mínimo Funcional
  4. Consolidar endpoint /analyze com Gemini (flag on)
  5. UI para revisar itens sugeridos pela IA (HITL manual)
  6. Aprovar itens → criarItemManual() existente
  7. Conectar Orçamentista → Proposta (já funciona)

FASE 2 — Segurança Mínima
  8. Auth middleware no Express (JWT Supabase)
  9. CORS restritivo
  10. Helmet
  11. Corrigir VITE_SUPABASE_ANON_KEY no backend

FASE 3 — Validação e Testes
  12. Instalar Zod — validar schemas de request
  13. Instalar Vitest — testes das rotas críticas
  14. Configurar ESLint + Prettier

FASE 4 — DevOps MVP
  15. GitHub Action (lint → typecheck → test → build)
  16. Pre-commit hooks (Husky)

FASE 5 — Hardening SaaS
  17. Rate limiting
  18. Error tracking (Sentry)
  19. Code splitting (React.lazy)
  20. Migrations SQL versionadas

FASE 6 — MLOps Leve (futuro)
  21. Conectar Gemini real ao pipeline completo
  22. PDF parser real
  23. RAG com pgvector
  24. Learning loop do orchestrator
```

---

## 13. O que Fica Congelado

| Item | Motivo |
|:---|:---|
| Fine-tuning de modelos | Sem dados suficientes |
| Novos agentes especialistas | Consolidar existentes primeiro |
| Portal do Cliente | Fora do fluxo mínimo |
| pgvector / RAG | Após contratos estáveis |
| Novos painéis mock no Orçamentista | 12 mocks existentes congelados |
| Refatoração ampla de `types.ts` | Não bloqueia operação |
| Melhorias estéticas | UI funcional é suficiente |
| Automações avançadas (n8n, Evolution API) | Pós-MVP |
| Batch history panel | Experimental — manter em quarentena |

---

## 14. Próxima Etapa Recomendada

### Ação imediata: Verificar P0

```bash
# No painel Supabase, verificar:
# Table Editor → orcamentos → coluna obra_id → Is Nullable?
# Ou via SQL Editor:
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orcamentos' AND column_name = 'obra_id';
```

- **Se `is_nullable = NO`:** P0 confirmado → criar migration
- **Se `is_nullable = YES`:** P0 descartado → avançar para validação ponta a ponta

### Depois do P0

1. Validar fluxo canônico completo em dev local
2. Gerar plano de implementação da Fase 1 (Orçamentista Mínimo Funcional)

---

> **Este documento é somente leitura. Nenhum arquivo funcional foi modificado.**  
> **Aguardando autorização para verificar P0 e avançar.**
