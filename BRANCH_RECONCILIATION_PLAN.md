# EVIS — Plano de Reconciliação de Branches

**Data:** 2026-05-19
**Worktree de origem:** `claude/mystifying-brown-9152ed`
**Estado inicial:** 11 branches paralelas tocando `orcamentista`, `main` congelada em `7da8e31`

---

## Sumário executivo

Das 11 branches encontradas, **3 têm trabalho único** que importa, **2 são duplicatas exatas**, **4 são zumbis** (atrás de main, zero commits únicos) e **2 são subsets** já contidas em branches maiores.

Conclusão prática: a árvore real do projeto é uma estrela de 3 pontas saindo de `main`, não 11 ramos independentes.

---

## Inventário canônico

### As 3 linhas únicas

| Branch | Tip | Commits | Arquivos | Conteúdo |
|---|---|---:|---:|---|
| `feat/orcamentista-integrate-approved-line` | `910acf8` | 14 | 66 | Integração end-to-end oportunidade→proposta, sidebar/dashboard EVIS, separação Modo Produto/Laboratório, validação visual noturna concluída |
| `claude/angry-zhukovsky-8e156f` | `07f6509` | 10 | 25 | Infra IA real: pdf-parse local, Gemini extraction, pgvector RAG, controlled official commit endpoint, human review decisions, ADRs |
| `claude/mystifying-brown-9152ed` | `a9b2b0e` | 3 | 6 | Sessão noturna 2026-05-19: selector `useOrcamentistaAnalyzeResult`, `analyzeAdapters`, wire-up HITL/AiPipeline/AiPreview |

### As 2 duplicatas

| Branch | Tip | Por quê | Ação |
|---|---|---|---|
| `backup/current-feat-orcamentista-real-vs-lab` | `ed18913` | == `feat/orcamentista-real-vs-lab` (mesmo tip exato) | Apagar — é tag disfarçada de branch, e a tag de backup já cobre |
| `feat/orcamentista-real-vs-lab` | `ed18913` | Subset de `feat/orcamentista-integrate-approved-line` (seus 4 commits estão lá dentro) | Apagar após merge da integrate em main |

### Os 2 subsets de angry-zhukovsky

| Branch | Tip | Contida em | Ação |
|---|---|---|---|
| `backup/night-experimental` | `7f91688` | `claude/angry-zhukovsky-8e156f` | Apagar após merge da angry em main |
| `backup/night-approved` | `bc9cb54` | `claude/angry-zhukovsky-8e156f` (e em night-experimental) | Apagar após merge da angry em main |

### Os 4 zumbis

| Branch | Tip | Status | Ação |
|---|---|---|---|
| `claude/gifted-austin-9c0026` | `7da8e31` | == main exato | Apagar |
| `claude/hopeful-pascal-d841cd` | `2a89c3f` | 144 commits atrás de main, zero únicos | Apagar |
| `claude/pedantic-clarke-1cd157` | `7ef27be` | 87 commits atrás de main, zero únicos | Apagar |
| `feat/orquestrador-backend` | `435a06e` | 137 commits atrás de main, zero únicos | Apagar |

---

## Mapa de conflitos por arquivo

Arquivos tocados por mais de uma linha única:

| Arquivo | integrate | angry-zhukovsky | mystifying-brown | Severidade |
|---|---|---|---|---|
| `src/pages/Oportunidade/OrcamentistaTab.tsx` | ✓ (+287/-140) | ✓ (+331/-170) | ✓ (+48/-8) | **CRÍTICA — épico** |
| `package.json` | ✓ (5 novas deps) | ✓ (1 nova dep + types) | — | média (pdf-parse é a mesma versão; resto não conflita) |
| `package-lock.json` | ✓ | ✓ | — | mecânica (regenerável) |
| `platform/server/orcamentista/fileTextExtraction.ts` | ✓ | ✓ | — | alta |
| `platform/server/orcamentista/persistence/stagingClient.ts` | ✓ | ✓ | — | alta |
| `server/routes/orcamentista.ts` | ✓ | ✓ | — | alta |
| `src/hooks/useAnalyzeOpportunity.ts` | ✓ | ✓ | — | média |

**Boa notícia:** minha noite (mystifying-brown) só conflita em **1 arquivo** (Tab.tsx). Os outros 5 arquivos da noite (`useOrcamentistaAnalyzeResult.ts`, `analyzeAdapters.ts`, `OrcamentistaHitlPanel.tsx`, `skills/evis-orcamentista-night/SKILL.md`, `NOITE_RELATORIO.md`) são novos ou exclusivos.

**Má notícia:** `integrate × angry-zhukovsky` colidem em 7 arquivos e reescreveram independentemente o Tab.tsx (épico). Esse é o nó górdio.

---

## Decisão estratégica sobre minha noite

Olhando os commits de `angry-zhukovsky`:

- `2c04671 feat(orcamentista): add controlled official commit endpoint for approved items`
- `381b1b1 feat(orcamentista): add human review decisions for preview items`
- `db70897 feat(orcamentista): add Gemini AI extraction for preview items in analyze`

Esses commits implementam **o caminho REAL** do que minha noite fez como wire-up de fachada (selector + adapters distribuindo `AnalyzeData` mock para painéis). Em outras palavras: o trabalho de `angry-zhukovsky` torna minha noite parcialmente redundante e provavelmente obsoleta como abstração.

**Decisão proposta:** após mergear `integrate` e `angry-zhukovsky` em main, **NÃO mergear a noite mecânica**. Em vez disso:
1. Verificar se `analyzeAdapters.ts` e `useOrcamentistaAnalyzeResult.ts` ainda fazem sentido frente ao novo backend de IA real
2. Se não fazem, **cherry-pick apenas o que sobra de valor**: provavelmente o `NOITE_RELATORIO.md` (como documento histórico) e talvez polish do HitlPanel
3. A skill `evis-orcamentista-night` vira documento histórico de uma noite específica, fica em `skills/` arquivada

Isso é **descartar trabalho com elegância**, não desperdício — minha noite foi a abstração correta dado o contexto que eu via, mas existia trabalho mais profundo em paralelo.

---

## Ordem de merge proposta

### Passo 1 — `feat/orcamentista-integrate-approved-line` → `main`
- **Tipo:** fast-forward simples
- **Conflitos:** zero (main não tem nada que integrate não tem)
- **Risco:** baixíssimo
- **Estado pós-passo:** main avança 14 commits, contém integração + dashboard + separação Produto/Lab + UX nova do Tab
- **Verificação:** `npx tsc --noEmit` + `npm run build`

### Passo 2 — `claude/angry-zhukovsky-8e156f` → `main` (atualizada)
- **Tipo:** merge com resolução de conflitos
- **Conflitos esperados:** 7 arquivos, com `OrcamentistaTab.tsx` sendo o épico
- **Risco:** alto. Os dois reescreveram o Tab independentemente.
- **Estratégia:**
  - `package.json`: aceitar union (pdf-parse já é mesma versão em ambos; demais deps de cada lado coexistem)
  - `package-lock.json`: deletar e regerar com `npm install`
  - `Tab.tsx`: **PAUSAR e apresentar ao humano**. Não tentar merge automático em arquivo épico com duas reescritas paralelas. Opções a apresentar:
    - (a) Tomar a versão da `angry-zhukovsky` como base e replicar manualmente as novidades de UX da integrate (sidebar/dashboard, separação Produto/Lab)
    - (b) Tomar a versão da `integrate` como base e replicar manualmente os pontos de IA real da angry (controlled commit endpoint, human review)
    - (c) Reescrever do zero usando ambas como referência
  - Demais 4 arquivos (`fileTextExtraction.ts`, `stagingClient.ts`, `orcamentista.ts`, `useAnalyzeOpportunity.ts`): tentar `git mergetool`; se conflito for trivial, resolver; se não, pausar igual ao Tab
- **Estado pós-passo:** main contém integração + UX + infra IA real
- **Verificação:** `npx tsc --noEmit` + `npm run build` + `npm run server` smoke

### Passo 3 — Avaliar `claude/mystifying-brown-9152ed`
- **Tipo:** depende da decisão (ver "Decisão estratégica sobre minha noite")
- **Caminho A:** descartar a noite, manter como tag histórica `bkp/night-2026-05-19-mystifying-brown`
- **Caminho B:** cherry-pick seletivo de polish (e.g. badges visuais, relatório como doc)
- **Não fazer merge mecânico:** o trabalho de `angry-zhukovsky` provavelmente cobre o problema que a noite resolveu

### Passo 4 — Limpeza de cemitério
**SOMENTE após confirmação humana explícita.** Apagar branches:
- 4 zumbis (`gifted-austin`, `hopeful-pascal`, `pedantic-clarke`, `orquestrador-backend`)
- 2 duplicatas (`backup/current-feat-...`, `feat/orcamentista-real-vs-lab`)
- 2 subsets (`backup/night-experimental`, `backup/night-approved`)
- 1 a definir (`mystifying-brown`)
- 2 mergeadas se desejar (`feat/orcamentista-integrate-approved-line`, `claude/angry-zhukovsky-8e156f`)

Total para potencial exclusão: 9-11 branches. **Tags de backup preservam todos os tips** indefinidamente.

---

## Tags de backup criadas

Todas no formato `bkp/pre-reconciliation-20260519-095701/<branch_safe_name>`:

```
bkp/pre-reconciliation-20260519-095701/backup_current-feat-orcamentista-real-vs-lab → ed18913
bkp/pre-reconciliation-20260519-095701/backup_night-approved                          → bc9cb54
bkp/pre-reconciliation-20260519-095701/backup_night-experimental                      → 7f91688
bkp/pre-reconciliation-20260519-095701/claude_angry-zhukovsky-8e156f                  → 07f6509
bkp/pre-reconciliation-20260519-095701/claude_gifted-austin-9c0026                    → 7da8e31
bkp/pre-reconciliation-20260519-095701/claude_hopeful-pascal-d841cd                   → 2a89c3f
bkp/pre-reconciliation-20260519-095701/claude_mystifying-brown-9152ed                 → a9b2b0e
bkp/pre-reconciliation-20260519-095701/claude_pedantic-clarke-1cd157                  → 7ef27be
bkp/pre-reconciliation-20260519-095701/feat_orcamentista-integrate-approved-line      → 910acf8
bkp/pre-reconciliation-20260519-095701/feat_orcamentista-real-vs-lab                  → ed18913
bkp/pre-reconciliation-20260519-095701/feat_orquestrador-backend                      → 435a06e
bkp/pre-reconciliation-20260519-095701/main                                           → 7da8e31
```

Para reverter qualquer passo: `git reset --hard <tag>` na branch errada, ou criar nova branch a partir da tag.

---

## Status de execução

- [x] Fase A1 — Inventário das 11 branches
- [x] Fase A2 — Tags de backup criadas (12 tags)
- [x] Fase A3 — Relacionamentos mapeados (subsets/zumbis/únicas)
- [x] Fase A4 — Conflitos cruzados detectados (7 arquivos quentes)
- [x] Fase A5 — Este plano escrito
- [ ] Fase B1 — Passo 1 executado (merge integrate → main)
- [ ] Fase B2 — Passo 2 PAUSADO em conflito do Tab.tsx (esperado)
- [ ] Fase B3 — Decisão humana sobre noite (descartar/cherry-pick)
- [ ] Fase B4 — Cemitério executado (com confirmação)
