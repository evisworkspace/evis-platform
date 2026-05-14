# EVIS AI — Relatório de Auditoria Técnica SaaS

> **Data:** 2026-05-15
> **Branch auditada:** `feat/orcamentista-integrate-approved-line`
> **Modo:** Somente leitura — nenhum arquivo foi modificado
> **Fonte principal:** Projeto local (`c:\Users\User\Evis AI`)
> **Fonte de apoio:** Context7 (Supabase, Vite, Express.js — citados inline)

---

## 1. Visão Geral da Arquitetura

### 1.1 Stack Tecnológica

| Camada | Tecnologia | Versão |
|:---|:---|:---|
| Frontend | React 19 + TypeScript 5.8 | `react@^19.0.0` |
| Bundler | Vite 6.2 | `vite@^6.2.0` |
| Estilos | Tailwind CSS 4.1 (via `@tailwindcss/vite`) | `tailwindcss@^4.1.14` |
| Roteamento | React Router DOM 7.14 | `react-router-dom@^7.14.0` |
| Estado servidor | TanStack React Query 5.97 | `@tanstack/react-query@^5.97.0` |
| Backend | Express 4.21 + tsx (dev server) | `express@^4.21.2` |
| Banco de dados | Supabase (hosted) | `@supabase/supabase-js@^2.103.0` |
| IA | Google Gemini (`@google/genai@^1.29.0`) | Controlado por flag |
| Animações | Motion (Framer Motion) 12.23 | `motion@^12.23.24` |
| Componentes UI | shadcn 4.2 + Lucide React | Base UI / CVA |

### 1.2 Topologia do Projeto

```
Evis AI/
├── server/            ← Backend Express (porta 3001)
│   ├── index.ts       ← Entrypoint (2 rotas: /api/diario, /api/orcamentista)
│   ├── routes/        ← diario.ts, orcamentista.ts
│   ├── agents/        ← Orchestrator IA (diário de obra)
│   └── tools/         ← supabaseTools.ts
├── platform/
│   └── server/
│       └── orcamentista/  ← Módulo LAB MODE (persistence, engine, providers)
├── src/               ← Frontend React
│   ├── App.tsx         ← Roteamento principal
│   ├── AppContext.tsx   ← Estado global (localStorage + Supabase)
│   ├── hooks/          ← 9 hooks customizados
│   ├── pages/          ← Dashboard, Oportunidades, Orçamentista, Login, Proposta
│   ├── components/     ← 12 componentes + Orcamento subdir
│   ├── lib/            ← API client, supabase client, utils, orcamentista/
│   └── types.ts        ← 2237 linhas de tipos (60KB)
├── domains/           ← Módulos de domínio (institucional, orcamentista, proposta)
├── infra/             ← docker-compose.yml (Evolution API, n8n, Redis)
├── platform/docs/     ← 50+ documentos de arquitetura e ADRs
└── .env.example       ← Template de variáveis (auditado — sem secrets)
```

### 1.3 Rotas da Aplicação

| Rota | Componente | Layout |
|:---|:---|:---|
| `/` `/dashboard` | `DashboardPage` | GlobalLayout (sidebar) |
| `/oportunidades` | `OportunidadesPage` | GlobalLayout |
| `/propostas` | `PropostaPage` | GlobalLayout |
| `/oportunidades/:id` | `OportunidadeDetalhePage` | Layout próprio |
| `/oportunidades/:id/orcamentista` | `OrcamentistaTab` | Layout próprio |
| `/orcamentista` | `OrcamentistaChat` | Layout próprio |
| `/obras` `/obras/:obraId` | `Main` (obra ativa) | Layout próprio |

### 1.4 API Backend (Express)

| Método | Rota | Função |
|:---|:---|:---|
| `POST` | `/api/diario/processar-diario` | Orquestrador IA (8 camadas) para diário de obra |
| `POST` | `/api/diario/rascunho` | Salvar rascunho Telegram → notas |
| `POST` | `/api/orcamentista/opportunities/:id/analyze` | Análise de arquivos LAB |
| `POST` | `/api/orcamentista/opportunities/:id/files` | Upload LAB de arquivos |
| `POST` | `/api/orcamentista/manual-run` | Execução manual controlada |
| `GET` | `/api/orcamentista/pipeline-view/:id` | Visualização do pipeline |
| `GET` | `/health` | Health check |

---

## 2. Segurança

### 2.1 Autenticação

| Aspecto | Estado | Severidade |
|:---|:---|:---|
| Login frontend | ✅ Supabase Auth OTP (magic link) via `useAuth.ts` | — |
| Guard de rotas | ⚠️ Parcial — `App.tsx` verifica `session` mas sem HOC/middleware universal | MÉDIO |
| Backend auth middleware | ❌ **Inexistente** — nenhuma rota Express exige autenticação | **CRÍTICO** |
| JWT validation server-side | ❌ Ausente — rotas são abertas para qualquer requisição | **CRÍTICO** |

> **Encontrado no projeto:** `server/index.ts` L12 usa `app.use(cors())` sem restrição e nenhum middleware de autenticação nas rotas.
>
> **Boa prática validada via Context7 (Express.js):** Todo endpoint de API deve validar o token JWT do Supabase no servidor. Express deve usar middleware de autenticação antes das rotas de negócio.

### 2.2 Autorização e RLS

| Aspecto | Estado | Severidade |
|:---|:---|:---|
| RLS no Supabase | ⚠️ Não auditável localmente — depende do painel Supabase | MÉDIO |
| Backend usa anon key | ⚠️ `server/tools/supabaseTools.ts` usa `VITE_SUPABASE_ANON_KEY` no backend | **ALTO** |
| Service role key | ⚠️ Presente no `.env.example` como template (`""`) — staging client usa corretamente | BAIXO |

> **Encontrado no projeto:** `server/tools/supabaseTools.ts` L7-8 lê `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` — variáveis do frontend — para criar o client backend.
>
> **Boa prática validada via Context7 (Supabase):** O backend deve usar `SUPABASE_SERVICE_ROLE_KEY` (nunca anon key) quando precisa de acesso administrativo, ou um client autenticado com o JWT do usuário para respeitar RLS.

### 2.3 Segurança HTTP

| Aspecto | Estado | Severidade |
|:---|:---|:---|
| CORS | ❌ `cors()` sem configuração — aceita qualquer origem | **ALTO** |
| Helmet (security headers) | ❌ Ausente — nenhum header de segurança | **ALTO** |
| Rate limiting | ❌ Ausente — sem proteção contra brute force/DDoS | **ALTO** |
| Body size limits | ⚠️ Parcial — endpoint de upload limita a 10MB, demais usam padrão Express | MÉDIO |

> **Boa prática validada via Context7 (Express.js):** Em produção, CORS deve ser restrito a origens específicas, `helmet()` deve estar sempre ativo, e `express-rate-limit` deve proteger pelo menos `/api/`.

### 2.4 Variáveis de Ambiente

| Aspecto | Estado | Severidade |
|:---|:---|:---|
| `.env` no `.gitignore` | ✅ Correto — `.env*` ignorado, `!.env.example` preservado | — |
| `.env.example` sem secrets | ✅ Auditado — apenas placeholders | — |
| `VITE_GEMINI_API_KEY` no `.env.example` | ⚠️ Template expõe que Gemini é chamado no frontend | BAIXO |
| Gemini client-side bloqueado | ✅ `src/lib/api.ts` L78 — `geminiCall` lança erro | — |
| `VITE_` usado para secrets backend | ⚠️ `server/tools/supabaseTools.ts` usa `VITE_SUPABASE_ANON_KEY` | MÉDIO |

> **Boa prática validada via Context7 (Vite):** Variáveis `VITE_` são embutidas no bundle frontend. Nunca devem conter secrets. O backend deve usar variáveis sem prefixo `VITE_`.

### 2.5 Hardcoded URLs

| Arquivo | Linha | URL | Severidade |
|:---|:---|:---|:---|
| `src/lib/api.ts` | 128 | `http://localhost:3001/api/diario/processar-diario` | MÉDIO |

> **Nota:** O Vite proxy em `vite.config.ts` já redireciona `/api` → `localhost:3001`. A chamada em `api.ts` L128 bypassa o proxy e hardcoda a URL.

### 2.6 Docker/Infra

| Aspecto | Estado | Severidade |
|:---|:---|:---|
| `docker-compose.yml` com secrets hardcoded | ⚠️ `evis-secret`, `evis-ai-secret-key` em plaintext | MÉDIO |
| Evolution API auth token hardcoded | ⚠️ `AUTH_API_KEY=evis-ai-secret-key` | MÉDIO |

---

## 3. Qualidade de Código

### 3.1 TypeScript

| Aspecto | Estado |
|:---|:---|
| `strict: true` | ❌ Ausente — `strictNullChecks` e `strictFunctionTypes` habilitados individualmente |
| `noImplicitAny` | ✅ Habilitado |
| `noEmit` | ✅ Habilitado (type-check only) |
| `skipLibCheck` | ✅ Habilitado |
| `types.ts` monolítico | ⚠️ **2237 linhas / 60KB** — arquivo único com todos os tipos |

### 3.2 Testes

| Aspecto | Estado | Severidade |
|:---|:---|:---|
| Testes unitários | ❌ **Zero** — nenhum arquivo `.test.ts` ou `.spec.ts` encontrado | **CRÍTICO** |
| Framework de testes | ❌ Não instalado (sem vitest, jest, etc. no `package.json`) | **CRÍTICO** |
| Testes E2E | ❌ Ausente | ALTO |

### 3.3 Linting e Formatação

| Aspecto | Estado |
|:---|:---|
| ESLint | ❌ Não configurado (sem `.eslintrc`, sem dependência) |
| Prettier | ❌ Não configurado |
| Lint script | ⚠️ `"lint": "tsc --noEmit"` — apenas type-check, sem lint de estilo |

### 3.4 Validação de Entrada

| Aspecto | Estado | Severidade |
|:---|:---|:---|
| Zod / Yup / Joi | ❌ **Nenhuma biblioteca de validação de schema instalada** | **ALTO** |
| Validação manual | ⚠️ Parcial — `if (!transcricao)` em rotas, sem sanitização | ALTO |

> **Boa prática validada via Context7 (Express.js):** Toda entrada de API deve ser validada com schema (Zod recomendado para projetos TypeScript). Nunca confiar em dados do cliente.

---

## 4. Estado do Banco de Dados (Supabase)

### 4.1 Modelo de Dados Principal

Inferido a partir de `types.ts` e queries em `App.tsx`:

| Tabela | Uso |
|:---|:---|
| `obras` | Projetos de construção |
| `servicos` | Serviços/atividades por obra |
| `pendencias` | Pendências abertas |
| `diario_obra` | Registros de diário de obra |
| `notas` | Notas e observações |
| `fotos` | Registro fotográfico |
| `equipes_cadastro` | Cadastro de equipes |
| `equipes_presenca` | Presença diária |
| `oportunidades` | Pipeline comercial |
| `opportunity_files` | Arquivos de oportunidade |
| `opportunity_events` | Log de eventos |
| `contatos` | Cadastro de contatos |
| `orcamentos` | Orçamentos |
| `orcamento_itens` | Itens de orçamento (bloqueado para LAB) |
| `propostas` | Propostas comerciais |

### 4.2 Observações Importantes

- **Sem migrations versionadas locais** — pasta `supabase/` contém apenas `.temp/`
- **Schema gerenciado pelo painel Supabase** — sem controle de versão do DDL
- **Staging environment** configurado em `stagingClient.ts` com validação de project ref
- **`SCHEMA_GAP_REPORT.md`** existente (142KB) documenta gaps conhecidos

---

## 5. Orçamentista IA — Estado do LAB MODE

### 5.1 Proteções Implementadas

| Proteção | Status |
|:---|:---|
| `EVIS_ORCAMENTISTA_ENABLE_AI_ANALYZE` flag | ✅ Default `false` |
| `EVIS_ALLOW_MAIN_SUPABASE_DEV_MODE` flag | ✅ Default `false` |
| Bloqueio de escrita em `orcamento_itens` | ✅ Ativo |
| Upload marcado como `lab_upload` | ✅ `categoria: 'lab_upload'` |
| PDF bloqueado | ✅ Apenas `.txt/.csv/.json/.md` permitidos |
| Sem fallback silencioso para produção | ✅ Throws se flags desligadas |
| Snapshot de contexto persistido | ✅ `persistContextSnapshot` ativo |

### 5.2 Estrutura do Módulo

```
platform/server/orcamentista/
├── persistence/
│   ├── stagingClient.ts      ← Client isolado com validação de project ref
│   ├── repository.ts         ← Repository pattern
│   └── hitlPersistence.ts    ← Persistência HITL
├── contracts.ts              ← Tipos do pipeline
├── fileTextExtraction.ts     ← Extração local de texto
├── controlledManualAction.ts ← Ação manual controlada
├── engine.ts / engine/       ← Engine do pipeline
├── providers/                ← Providers de IA
└── workspaces.ts             ← Gestão de workspaces (55KB)
```

### 5.3 UI do Orçamentista

17 painéis no diretório `src/pages/Oportunidade/`:
- **Produção:** `OrcamentistaContextStatePanel`, `OrcamentistaInternalActionPanel`, `OrcamentistaManualItemsPanel`
- **LAB/Mock:** Todos os demais, colapsados em "Laboratório avançado"
- **Hierarquia semântica:** 8 seções numeradas + laboratório colapsado

---

## 6. CI/CD e DevOps

| Aspecto | Estado | Severidade |
|:---|:---|:---|
| GitHub Actions | ❌ Pasta `.github/workflows/` existe mas vazia | **ALTO** |
| Pipeline de build | ❌ Sem CI — builds são locais | ALTO |
| Deploy automatizado | ❌ Ausente | ALTO |
| `npm audit` automatizado | ❌ Ausente | MÉDIO |
| Pre-commit hooks (Husky) | ❌ Ausente | MÉDIO |

---

## 7. Observabilidade

| Aspecto | Estado | Severidade |
|:---|:---|:---|
| Logger estruturado | ⚠️ `src/services/logger.ts` (1.3KB) — implementação básica | MÉDIO |
| Logs do backend | ⚠️ `console.log` / `console.error` direto | MÉDIO |
| APM / Tracing | ❌ Ausente | MÉDIO |
| Error tracking (Sentry) | ❌ Ausente | ALTO |
| Health check | ✅ `GET /health` retorna `{ status: 'ok' }` | — |

---

## 8. Performance e Escalabilidade

| Aspecto | Estado |
|:---|:---|
| React Query caching | ✅ `staleTime: 5min`, `gcTime: 10min`, `retry: 2` |
| Bundle size | ⚠️ **1.69MB JS** (gzip: 457KB) — acima do recomendado |
| Code splitting | ❌ Sem `lazy()` / `Suspense` — bundle monolítico |
| SSR/SSG | ❌ Não aplicável (SPA puro) |
| DB connection pooling | N/A — Supabase gerencia |
| CDN para assets estáticos | ❌ Sem configuração |

---

## 9. Branches e Git

### 9.1 Estado Atual

```
* feat/orcamentista-integrate-approved-line  ← Branch ativa (cherry-pick em progresso)
  feat/orcamentista-real-vs-lab              ← Branch LAB MODE
  main                                       ← Branch principal
  backup/current-feat-orcamentista-real-vs-lab
  backup/night-approved
  backup/night-experimental
  claude/*                                   ← 4 branches de agente
```

### 9.2 Últimos Commits (branch atual)

```
ed18913 feat(orcamentista): add controlled lab mode for upload and ai analysis
ebe166e chore(security): remove exposed secrets from examples and docs
0a63d8f feat(orcamentista): add lab mode for file upload and ai analysis
5355c09 feat(orcamentista): separar fluxo real de laboratorio mock
7da8e31 feat(orcamentista): extract supported file text locally
```

---

## 10. Matriz de Achados por Severidade

### CRÍTICO (Bloqueador para produção)

| # | Achado | Arquivo/Local |
|:---|:---|:---|
| C1 | Backend sem autenticação — todas as rotas são públicas | `server/index.ts` |
| C2 | Zero testes automatizados — sem framework de testes | Projeto inteiro |

### ALTO (Risco significativo)

| # | Achado | Arquivo/Local |
|:---|:---|:---|
| H1 | CORS aberto (`cors()` sem config) — aceita qualquer origem | `server/index.ts` L12 |
| H2 | Sem `helmet` — nenhum security header HTTP | `server/index.ts` |
| H3 | Sem rate limiting — vulnerável a DDoS/brute force | `server/index.ts` |
| H4 | Backend usa `VITE_SUPABASE_ANON_KEY` em vez de `service_role` | `server/tools/supabaseTools.ts` L8 |
| H5 | Sem validação de schema (Zod) nas rotas de API | `server/routes/*.ts` |
| H6 | Sem CI/CD — sem pipeline de build/deploy | `.github/workflows/` vazio |
| H7 | Sem error tracking (Sentry ou equivalente) | Projeto inteiro |
| H8 | Bundle JS monolítico de 1.69MB sem code splitting | Build output |

### MÉDIO (Melhoria necessária)

| # | Achado | Arquivo/Local |
|:---|:---|:---|
| M1 | Guard de rotas frontend parcial — sem proteção universal | `App.tsx` |
| M2 | URL hardcoded `localhost:3001` no frontend | `src/lib/api.ts` L128 |
| M3 | Docker compose com secrets em plaintext | `infra/docker-compose.yml` |
| M4 | `types.ts` monolítico (2237 linhas / 60KB) | `src/types.ts` |
| M5 | Sem ESLint/Prettier configurados | Raiz do projeto |
| M6 | Logger básico — sem logging estruturado no backend | `server/` |
| M7 | Sem pre-commit hooks (Husky/lint-staged) | Raiz do projeto |
| M8 | Sem migrations SQL versionadas localmente | `supabase/` |
| M9 | Body size limits inconsistentes entre rotas | `server/routes/orcamentista.ts` |
| M10 | `package.json` nomeado como `react-example` | `package.json` L2 |

### BAIXO (Melhoria desejável)

| # | Achado | Arquivo/Local |
|:---|:---|:---|
| L1 | `geminiService.ts` com `apiKey = ""` hardcoded (inativo) | `src/services/geminiService.ts` L4 |
| L2 | `VITE_GEMINI_API_KEY` no `.env.example` (apenas template) | `.env.example` L43 |
| L3 | `AppContext` usa localStorage key `badida_` (nome legado) | `src/AppContext.tsx` L69, L102 |

---

## 11. Context7 — Bibliotecas Consultadas

| Biblioteca | Motivo da Consulta | Achado Validado |
|:---|:---|:---|
| **Supabase** (supabase.com) | Validar uso de `anon_key` vs `service_role` no backend | H4 — backend deve usar `service_role` ou JWT do usuário, nunca `anon_key` |
| **Vite** (vite.dev) | Validar exposição de `VITE_` vars e impacto no bundle | Confirmado: `VITE_` é embutido no bundle e visível no client |
| **Express.js** (expressjs.com) | Validar checklist de produção (helmet, CORS, rate limit) | H1, H2, H3 — todos obrigatórios para produção |

---

## 12. Pontos Positivos

1. **LAB MODE bem isolado** — flags de proteção, bloqueio de escrita em `orcamento_itens`, staging client com validação de project ref
2. **Secrets limpos do repositório** — auditoria e rotação realizadas com sucesso
3. **IA client-side bloqueada** — `geminiCall`, `minimaxCall`, `claudeCall` lançam erro no frontend
4. **React Query configurado** — caching, retry e invalidação controlada
5. **Documentação arquitetural extensa** — 50+ documentos em `platform/docs/`
6. **Tipos TypeScript robustos** — cobertura ampla de domínios e contratos
7. **Hierarquia semântica do Orçamentista** — 8 estágios claros + laboratório colapsado

---

## 13. Próximos Passos Recomendados (Priorizado)

### Fase 0 — Bloqueadores (Antes de qualquer deploy)

1. **Adicionar auth middleware no Express** — validar JWT Supabase em todas as rotas `/api/*`
2. **Configurar CORS restritivo** — permitir apenas origens conhecidas
3. **Adicionar `helmet()`** — security headers padrão
4. **Adicionar `express-rate-limit`** — proteger contra abuso

### Fase 1 — Fundação de Qualidade

5. **Instalar Vitest** e escrever testes para rotas críticas e `stagingClient.ts`
6. **Instalar Zod** e validar schemas de request em todas as rotas
7. **Corrigir uso de `VITE_SUPABASE_ANON_KEY` no backend** — usar `SUPABASE_SERVICE_ROLE_KEY`
8. **Configurar ESLint + Prettier**

### Fase 2 — CI/CD e Observabilidade

9. **Criar GitHub Action** — lint → type-check → test → build
10. **Adicionar Sentry** ou error tracking equivalente
11. **Implementar code splitting** com `React.lazy()` + `Suspense`

### Fase 3 — Maturidade

12. **Migrations SQL versionadas** via Supabase CLI
13. **Pre-commit hooks** com Husky + lint-staged
14. **Renomear `package.json`** de `react-example` para `evis-ai`

---

> **IMPORTANTE:** Este relatório é somente leitura. Nenhum arquivo foi modificado.
> Aguardando autorização para avançar ao plano de implementação.
