# EVIS — Orquestrador de Auditoria Arquitetural

**Autor:** sessão Claude Opus 4.7 (madrugada 2026-05-19)
**Destinatário:** agente executor (qualquer modelo capaz de ler/grep/diff em codebase grande)
**Produto único deste documento:** instruções suficientes para o agente entregar `AUDIT_REPORT.md` na raiz, sem fazer perguntas de volta.

---

## 1. Missão

O EVIS saiu da fase **"MVP acelerado"** e entrou em **"engenharia de produto"**. Antes que a próxima feature seja escrita, é necessário **diagnosticar** o estado arquitetural atual.

A missão é gerar um **relatório priorizado de dívida técnica, acoplamento, duplicações, inconsistências de padrão e riscos de manutenção**, com evidência arquivo:linha para cada item. **Não executar refatoração nenhuma.** Auditar e reportar. Refatoração vira sessão separada, após o humano priorizar.

O custo de um relatório errado é alto: o humano vai usar essa lista para decidir o que tocar nos próximos meses. Honestidade > completude > polidez.

---

## 2. Escopo

### Dentro do escopo
- `src/` inteira (frontend React/Vite)
- `server/` (Express + agents)
- `platform/server/` (lógica de domínio do orcamentista)
- `domains/orcamentista/` (lógica de negócio do orcamentista)
- `skills/` (skills declaradas vs existentes)
- Arquivos `.sql` na raiz e em `platform/docs/`
- `CLAUDE.md`, `MAPA_DO_PROJETO.md`, `platform/docs/CODING_STANDARDS.md` — fonte das regras do projeto

### Fora do escopo (NÃO auditar nesta rodada)
- `domains/institucional/` — sub-projeto separado com dependências firebase ausentes. Pré-existente, fora do produto SaaS.
- `node_modules/`, `dist/`, `.vite/`, qualquer artefato de build
- Arquivos de configuração `.env*` (não abrir, não logar)
- `domains/orcamentista/vault/` — pode conter dados de cliente; auditar apenas presença/estrutura, NÃO conteúdo

### Saídas proibidas nesta rodada
- Não editar código nenhum
- Não rodar `git add`, `git commit`, `git rm`, `git mv`
- Não criar branches
- Não rodar migrations
- Não chamar APIs externas (apenas leitura local da codebase)
- Não rodar `npm install` ou modificar `package.json`
- Não alterar `package-lock.json`

A única escrita permitida é o arquivo `AUDIT_REPORT.md` na raiz.

---

## 3. Invariantes herdadas (de `CLAUDE.md` e `CODING_STANDARDS.md`)

São as **regras inegociáveis** do projeto. Toda violação encontrada vira finding:

1. **Tipos**: tudo em `src/types.ts`. Componente que define type ad-hoc paralelo é violação.
2. **API**: sempre `sbFetch` de `src/lib/api.ts`. `fetch()` direto para Supabase é violação. (`fetch()` para `/api/*` interno do Express é OK.)
3. **Config**: sempre via `useAppContext()`. Props manuais de config é violação.
4. **Campo de item de orçamento**: `codigo` (não `codigo_referencia`).
5. **`obra_id`**: TEXT (não UUID com FK). Nunca usar `obra_id = opp_<id>` para vincular orçamento.
6. **Tailwind v4**: não usar `@apply` com classes inexistentes (ex: `leading-relaxed`).
7. **Markdown em IA**: zero markdown em outputs renderizados em HTML; sempre passar por `mdToHtml()`.
8. **Cache localStorage**: prefixo `deka_cache_v2_` obrigatório; outras chaves são bug.
9. **Estado global**: React Context (`AppContext`), não Redux/Zustand.
10. **Cache/fetch**: TanStack React Query v5 — não usar `useEffect` + `useState` para dados de servidor (é anti-padrão neste projeto).

Cite o nome da regra quando reportar a violação.

---

## 4. Âncoras de contexto (leia antes de auditar)

Leitura obrigatória antes de qualquer análise — sem essas, o relatório vira opinião:

| Caminho | O que tem |
|---|---|
| `CLAUDE.md` | Regras inegociáveis, estado atual do módulo Orcamentista, arquivos críticos |
| `platform/docs/CODING_STANDARDS.md` | Stack oficial, padrões de hooks/componentes, anti-padrões |
| `MAPA_DO_PROJETO.md` | Sistema de tags, arquitetura de pastas, política de manutenção |
| `src/types.ts` | TODOS os tipos. Auditar bloating, duplicações, types órfãos |
| `src/AppContext.tsx` | Estado global + provider. Auditar surface (o que expõe) |
| `src/lib/api.ts` | `sbFetch` — único caminho permitido para Supabase |
| `src/hooks/useOportunidadeOrcamento.ts` | Hook de referência do padrão correto |
| `src/components/Orcamento/index.tsx` | Componente de referência do padrão correto |
| `server/routes/orcamentista.ts` | Roteador Express principal — listar endpoints reais |
| `server/agents/orchestrator.ts` | Orquestrador de agents IA — auditar acoplamento |
| `skills/` (listar) | Skills declaradas em `CLAUDE.md` que existem ou não no FS |
| `NOITE_RELATORIO.md` | Último relatório (madrugada 2026-05-19) — contexto recente |

---

## 5. Fases de execução (em ordem rígida)

### Fase A — Inventário (não opinativo)

Produzir uma tabela bruta antes de qualquer análise:

A1. **Domínios** — listar todas as pastas top-level com contagem de arquivos `.ts/.tsx`, LOC total, idade do último commit.
A2. **Módulos frontend** — para cada pasta em `src/components/` e `src/pages/`, listar arquivos e LOC.
A3. **Hooks** — todos os `use*` em `src/hooks/` + dependências React Query, mutações.
A4. **Rotas Express** — `grep router\.(get|post|patch|delete|put)` em `server/routes/` — listar todos os endpoints com método + path + handler.
A5. **Tipos** — count de `export type` em `src/types.ts`, LOC do arquivo.
A6. **Mocks** — listar tudo em `src/lib/orcamentista/*Mock*` ou `*mock*` — arquivo, exports, quem consome.
A7. **SQL solto** — listar todos os `.sql` na raiz + `platform/docs/` com 1 linha de descrição (do header do arquivo).
A8. **Skills** — comparar a lista declarada em `CLAUDE.md` global com `skills/` do projeto e `~/.claude/skills/` global. Listar discrepâncias.

Salvar como seção `## Inventário` no relatório. Estritamente factual.

### Fase B — Dependency map

B1. **Import graph** — para cada arquivo em `src/`, listar imports. Detectar:
   - Ciclos (`A imports B imports A`)
   - Cross-domain forbidden (`src/components/Diario.tsx` importando de `src/pages/Orcamentista/`)
   - Imports profundos (`../../../../`) que sinalizam pasta no lugar errado
B2. **Backend ↔ frontend contract** — para cada endpoint Express, identificar qual hook do frontend o consome. Listar:
   - Endpoints **órfãos** (nenhum hook consome)
   - Hooks que chamam endpoints **inexistentes**
   - Endpoints chamados via `fetch()` direto em vez de via hook tipado
B3. **AppContext surface** — listar tudo que `useAppContext` expõe vs o que é realmente consumido. Itens não consumidos são candidatos a remoção.

### Fase C — Duplicação e regras espalhadas

C1. **Regras de negócio duplicadas** — buscar:
   - Mais de um lugar calculando o mesmo total (`reduce((acc, item) => acc + item.valor_total, 0)` por exemplo)
   - Mais de um lugar normalizando datas / moeda / unidade
   - Validações repetidas de `Config` (`!config.url || !config.key`)
C2. **Status enum duplicado** — comparar:
   - Status de oportunidade (`novo`, `qualificando`, …) entre `types.ts`, `OportunidadeDetalhePage.tsx`, `useOportunidades.ts`, backend
   - Status de orcamento (`rascunho`, `aprovado`, …)
   - Status de pendência, severidade, etc.
   Qualquer divergência é P0 ou P1.
C3. **Mocks ainda consumidos em produção** — para cada mock listado em A6, confirmar se é importado por arquivo `*Tab.tsx` ou similar fora de teste. Mock consumido em runtime é débito.

### Fase D — Consistência de padrão

D1. **`sbFetch` vs `fetch`** — grep `fetch\(` em `src/` e listar todo uso de `fetch()` direto. Para cada, classificar:
   - OK: `/api/*` interno
   - Violação: chamada para Supabase REST direta
D2. **`useAppContext` vs props** — buscar componentes que recebem `config`, `obraId`, `url`, `key` por prop em vez de via contexto.
D3. **Naming** — verificar:
   - Componentes em `PascalCase`
   - Hooks com prefixo `use`
   - Arquivos `kebab-case` vs `PascalCase` — qual é o padrão? Quais violam?
D4. **`codigo` vs `codigo_referencia`** — grep ambos. Qualquer ocorrência de `codigo_referencia` em código de produção (fora de comentário/types legados) é P0.
D5. **`obra_id`** — buscar todos os usos. Sinalizar qualquer `obra_id = opp_*` ou criação de `obra_id` no momento de criar orçamento (proibido por arquitetura).

### Fase E — Anti-padrões e dead code

E1. **`TODO` / `FIXME` / `HACK` / `XXX`** — listar todos com arquivo:linha. Marcar como P2 por padrão; P1 se tocar regra de negócio; P0 se tocar segurança/dado.
E2. **`console.log` / `console.error`** — listar em `src/`. Lib externa OK; código de produção é débito.
E3. **`any` explícito** — `grep ": any"` em `src/` (excluir `.d.ts`). Listar.
E4. **`useEffect` para fetch de dados de servidor** — anti-padrão; deveria ser React Query. Listar.
E5. **Componentes >300 LOC** — listar arquivos `.tsx` com >300 linhas. Cada um é candidato a quebrar.
E6. **Imports não usados / variáveis não usadas** — se tooling permitir.
E7. **Arquivos sem export usado** — buscar arquivos cujo export ninguém importa.

### Fase F — Hot-spots de risco

F1. **Arquivos mais alterados recentemente** — `git log --pretty=format: --name-only --since="60 days ago" | sort | uniq -c | sort -rg | head -30`. Top 10 é hot-spot. Cruzar com LOC: hot-spot + grande + sem teste = risco alto.
F2. **Arquivos com mais autores diferentes** — `git shortlog -sn -- <file>` para cada candidato. Muitos autores em arquivo curto = regra disputada.
F3. **Arquivos críticos sem teste** — verificar se há `.test.*` ou `.spec.*` adjacente. (Espera-se que não haja muita cobertura — apenas reportar.)

### Fase G — Estado dos contratos

G1. **Schema do banco vs `types.ts`** — abrir `schema-completo.sql` e `infra/` se existir; comparar com os types frontend. Listar:
   - Campos do banco não tipados no frontend
   - Campos no frontend que não existem no banco
   - Tipos diferentes (TEXT no banco, UUID no front, etc.)
G2. **RLS policies** — listar tabelas com RLS habilitado e a política. CLAUDE.md diz "acesso livre (`USING (true)`)" — confirmar e listar todas as tabelas que precisarão de policy real quando Auth chegar.

---

## 6. Severidade — rubrica

Toda finding recebe **uma** etiqueta. Sem inflação. Sem deflação.

| Tag | Definição | Exemplos |
|---|---|---|
| **P0** | Quebra produção, perde dado, viola regra de segurança, ou diverge de contrato com banco a ponto de causar bug agora. | Uso de `codigo_referencia`, `fetch()` direto para Supabase, ciclo de import, regra de cálculo de total divergente entre páginas, type drift schema↔frontend |
| **P1** | Não quebra hoje, mas multiplica custo de manutenção a cada mudança. | Duplicação de regra de negócio em 3 lugares, AppContext surface inchada, hot-spot grande sem teste, mock consumido em produção |
| **P2** | Higiene. Vale 30 min de cleanup mas não bloqueia nada. | `TODO` antigos, `console.log`, naming inconsistente em arquivos isolados, imports não usados, `.sql` solto na raiz |

**Não inventar P0.** Se a única evidência é "parece feio", é P2. Se você acha que é P0 mas só viu em 1 arquivo, pense duas vezes — talvez seja P1.

**Toda finding precisa de:**
- Arquivo:linha (mínimo 1, idealmente 2-3 exemplos)
- Frase explicando o porquê é débito (1 linha)
- Recomendação concreta (1-2 linhas) — **sem implementar**
- Estimativa de esforço: `XS` (<30min) / `S` (30min-2h) / `M` (2h-1d) / `L` (>1d)

---

## 7. Template de saída — `AUDIT_REPORT.md`

Salvar na raiz, exatamente nesta estrutura:

```markdown
# EVIS — Auditoria Arquitetural

**Data:** YYYY-MM-DD
**Branch auditada:** <branch>
**Commit base:** <hash curto>
**Agente:** <modelo/sessão>

## Sumário executivo

- N findings: P0=<x>, P1=<y>, P2=<z>
- Top 3 riscos para o produto nos próximos 90 dias (1 linha cada)
- Estimativa total de cleanup: <X dias-pessoa>

## Inventário
(Fase A, tabelas factuais)

## Findings P0 (ação imediata)

### P0-01 — <título curto>
- **Onde:** `src/foo/bar.ts:42`, `src/foo/baz.ts:108`
- **Regra violada:** <referência ao CLAUDE.md / CODING_STANDARDS>
- **Por que é débito:** <1 linha>
- **Recomendação:** <1-2 linhas, sem implementar>
- **Esforço:** S

### P0-02 — …

## Findings P1 (próximos 30 dias)
…

## Findings P2 (oportunista)
…

## Apêndices
- A. Lista completa de TODO/FIXME
- B. Hot-spots (top 30 arquivos mais alterados)
- C. Endpoints órfãos / hooks órfãos
- D. Skills declaradas vs existentes
- E. SQL solto vs autoritativo
```

---

## 8. Condições de parada

O agente **deve parar e escrever `AUDIT_REPORT.md`** quando qualquer um for verdade:

1. Todas as 7 fases (A-G) concluídas.
2. Encontrou >50 findings — neste caso, escrever o que tem e marcar fases não concluídas como `[NÃO CONCLUÍDA]` no apêndice, com motivo.
3. Bateu em arquivo `.env*`, segredo ou dado de cliente real — parar imediatamente, NÃO incluir conteúdo no relatório, registrar apenas que parou e onde.
4. Detectou que precisaria fazer mudança em código para continuar (não deveria precisar; se precisar, parar).

**Não pedir confirmação humana no meio.** O orquestrador é o contrato. Se ficou ambíguo, o agente decide conservadoramente e registra a decisão numa seção "Decisões tomadas em ambiguidade" no fim do relatório.

---

## 9. Heurísticas anti-alucinação

- **Toda finding com evidência arquivo:linha.** Sem linha = descartar.
- **Toda regra citada com source.** "Viola padrão" sem citar onde o padrão está escrito = descartar.
- **Não recomendar refatoração grande sem ter visto ≥3 ocorrências do problema.** Uma ocorrência = não generaliza.
- **Não dar opinião sobre stack escolhida.** React/Vite/Supabase/Tailwind são dados; auditar uso, não escolha.
- **Não sugerir testes "porque tem que ter".** Apenas se F3 mostrar que arquivo crítico está sem teste.

---

## 10. Tempo esperado e custo

- Estimativa: 30-90 min de execução autônoma dependendo do modelo.
- Saída: 1 arquivo (`AUDIT_REPORT.md`), tipicamente 800-2000 linhas.
- Sem rede externa. Sem build. Sem migration. Sem refactor.

---

## Como o humano dispara

Cole no agente executor:

> Leia `AUDIT_ORCHESTRATOR.md` na raiz deste worktree e execute. Produza apenas `AUDIT_REPORT.md`. Pare nas condições da seção 8. Não pergunte de volta.

Fim do orquestrador.
