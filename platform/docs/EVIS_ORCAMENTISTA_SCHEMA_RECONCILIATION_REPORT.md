# EVIS — Relatório de Reconciliação de Schema do Orçamentista IA

> **Data:** 2026-05-16  
> **Etapa:** 9 — Reconciliação de Banco / Pipeline Staging  
> **Modo:** Diagnóstico read-only (nenhum SQL executado, nenhum banco alterado)  
> **Responsável:** Database Architect + Backend Lead

---

## 1. Veredito

**DIVERGENTE — APONTAMENTO DE BANCO INCORRETO (P0).**

A causa-raiz **não é** migration ausente.  
A migration **já foi aplicada** com sucesso, conforme [EVIS_READER_VERIFIER_HITL_MIGRATION_EXECUTION_REPORT_4B1E.md](platform/docs/EVIS_READER_VERIFIER_HITL_MIGRATION_EXECUTION_REPORT_4B1E.md) e validada em [EVIS_READER_VERIFIER_HITL_POST_MIGRATION_VALIDATION_EXECUTION_4B2E.md](platform/docs/EVIS_READER_VERIFIER_HITL_POST_MIGRATION_VALIDATION_EXECUTION_4B2E.md).

O problema é que **a migration foi aplicada em um projeto Supabase, e o backend local está apontando para outro**.

| Recurso | Projeto Supabase | Status |
|:---|:---|:---|
| Migration aplicada | `vtlepoljlqmjwuauygni` (staging autorizado) | ✅ 9 tabelas + 59 índices + 3 triggers + 2 funções + RLS |
| Backend local roda contra | `jwutiebpfauwzzltwgbb` (ref bloqueada nos docs de staging) | ❌ Pipeline Reader/Verifier/HITL **ausente** |

O backend chega a esse banco "errado" porque [.env](.env) tem `EVIS_ALLOW_MAIN_SUPABASE_DEV_MODE=true` e não define `EVIS_STAGING_PROJECT_REF`/`EVIS_STAGING_SUPABASE_URL`. O `stagingClient` cai no fallback "main dev mode" e usa `VITE_SUPABASE_URL` (= `jwutiebpfauwzzltwgbb`).

> Resultado prático: o código está correto. O schema esperado existe — só não no banco que o backend está consultando.

---

## 2. Fluxo Afetado

A esteira completa do Orçamentista IA está montada e operacional do lado do código. O ponto de falha é uma única escrita:

```
POST /api/orcamentista/opportunities/:id/analyze
└─ baixa arquivos do Storage ......................... ✅ funciona
└─ extrai texto local ................................ ✅ funciona
└─ chama Gemini ...................................... ✅ funciona
└─ persistContextSnapshot() → orc_context_snapshots .. ❌ FALHA AQUI
   (relation "orc_context_snapshots" does not exist)
```

Referência da chamada: [server/routes/orcamentista.ts:368-396](server/routes/orcamentista.ts#L368-L396).

Como o snapshot é gravado **antes** de a resposta voltar (linha 390 checa `snapshotResult.status !== 'success'` e retorna 500), o usuário nunca vê o preview, mesmo que o Gemini já tenha respondido com itens válidos.

---

## 3. Inventário Esperado pelo Código

### 3.1 Tabelas (10) — referenciadas em [guards.ts:11-22](platform/server/orcamentista/persistence/guards.ts#L11-L22) (`PERSISTENCE_ALLOWLIST`)

| # | Tabela | Onde usado | Obrigatório MVP? |
|---:|:---|:---|:---:|
| 1 | `opportunity_files` | Upload LAB, listagem, download | ✅ (já existe no baseline) |
| 2 | `orc_reader_runs` | Pipeline Reader — não disparado no MVP | ❌ futuro |
| 3 | `orc_reader_outputs` | Pipeline Reader — não disparado no MVP | ❌ futuro |
| 4 | `orc_reader_safety_evaluations` | Pipeline Reader — não disparado no MVP | ❌ futuro |
| 5 | `orc_verifier_runs` | Pipeline Verifier — não disparado no MVP | ❌ futuro |
| 6 | `orc_reader_verifier_comparisons` | Pipeline Verifier — não disparado no MVP | ❌ futuro |
| 7 | `orc_reader_verifier_divergences` | Pipeline Verifier — não disparado no MVP | ❌ futuro |
| 8 | `orc_hitl_issues` | HITL — não disparado no MVP (HITL é client-side) | ❌ futuro |
| 9 | `orc_hitl_decisions` | HITL — não disparado no MVP | ❌ futuro |
| 10 | **`orc_context_snapshots`** | **Endpoint `/analyze` (linha 369)** | ✅ **OBRIGATÓRIO MVP** |

### 3.2 Outros recursos do schema (do SQL candidate)

| Recurso | Quantidade | Função |
|:---|:---:|:---|
| Índices secundários | 49 | Performance de queries por `opportunity_id`, `orcamento_id`, `(opportunity_file_id, page_number)`, status, lineage |
| Constraint UNIQUE | 1 | `orc_divergences_dedupe_unique (comparison_id, dedupe_key)` |
| Funções `plpgsql` | 2 | `fn_orc_reader_outputs_prevent_raw_update`, `fn_orc_hitl_decisions_append_only` |
| Triggers | 3 | imutabilidade de `raw_output_json`, append-only de `orc_hitl_decisions` (UPDATE/DELETE/TRUNCATE) |
| RLS habilitado | 9 tabelas | Sem policies — bloqueia acesso direto por padrão |
| FKs externas | 26 | Para `opportunities`, `opportunity_files`, `orcamentos` (todas `ON DELETE RESTRICT`) |
| FKs internas (lineage) | 21 | Reader → Output → Safety → Verifier → Comparison → Divergence → HITL → Decision → Snapshot |

### 3.3 Tabelas baseline pré-existentes (necessárias como FK target)

| Tabela | Onde checada | Status no banco-alvo (`vtlepoljlqmjwuauygni`) |
|:---|:---|:---|
| `opportunities(id uuid PK)` | Pré-check 4B.1.E #3 | ✅ confirmada |
| `opportunity_files(id uuid PK)` | Pré-check 4B.1.E #3 | ✅ confirmada |
| `orcamentos(id uuid PK)` | Pré-check 4B.1.E #3 | ✅ confirmada |
| extensão `pgcrypto` + `gen_random_uuid()` | Pré-check 4B.1.E #5/#6 | ✅ confirmada |

---

## 4. Inventário Real do Banco

### 4.1 Projeto `vtlepoljlqmjwuauygni` (staging autorizado — não usado pelo backend local)

| Recurso | Existe? | Divergência |
|:---|:---:|:---|
| 9 tabelas pipeline | ✅ Sim | nenhuma |
| 59 índices | ✅ Sim | nenhuma |
| 3 triggers | ✅ Sim | nenhuma |
| 2 funções | ✅ Sim | nenhuma |
| RLS habilitado | ✅ Sim | nenhuma policy definida ainda (esperado) |
| Constraint UNIQUE de dedupe | ✅ Sim | nenhuma |
| Total: 26 tabelas no schema `public` | ✅ Sim | 17 baseline + 9 pipeline |

**Fonte:** [EVIS_READER_VERIFIER_HITL_POST_MIGRATION_VALIDATION_EXECUTION_4B2E.md](platform/docs/EVIS_READER_VERIFIER_HITL_POST_MIGRATION_VALIDATION_EXECUTION_4B2E.md) §3.

### 4.2 Projeto `jwutiebpfauwzzltwgbb` (que o backend está usando via fallback dev mode)

| Recurso | Existe? | Divergência |
|:---|:---:|:---|
| `opportunities`, `opportunity_files`, `orcamentos`, `orcamento_itens` | ✅ Provável (validação funcional de itens manuais passou) | — |
| **9 tabelas pipeline (`orc_*`)** | ❌ **Não** | **causa do erro 500** |
| 59 índices, 3 triggers, 2 funções, RLS | ❌ Não | consequência do gap acima |

**Evidência:** erro reportado em [EVIS_ORCAMENTISTA_MVP_VALIDATION_REPORT.md:29](platform/docs/EVIS_ORCAMENTISTA_MVP_VALIDATION_REPORT.md#L29):  
`relation "orc_context_snapshots" does not exist`.

---

## 5. Gap Analysis

| # | Gap | Severidade | Impacto |
|:---:|:---|:---:|:---|
| G1 | Backend aponta para `jwutiebpfauwzzltwgbb` em vez do staging autorizado `vtlepoljlqmjwuauygni` | **P0** | `/analyze` falha em 100% das chamadas porque grava em tabela inexistente |
| G2 | `.env` não define `EVIS_STAGING_PROJECT_REF`/`EVIS_STAGING_SUPABASE_URL`/`EVIS_STAGING_SUPABASE_SERVICE_ROLE_KEY` | **P0** (causa de G1) | Stagging client cai no fallback "main dev mode" |
| G3 | `EVIS_ALLOW_MAIN_SUPABASE_DEV_MODE=true` está ativo e permite o fallback | **P1** | Mascara a ausência das credenciais corretas de staging |
| G4 | O ref usado pelo backend (`jwutiebpfauwzzltwgbb`) é o mesmo que os docs 4B.1.E e 4B.2.E **proíbem** chamar como produção | **P1** | Conflito de nomenclatura: ou esse ref não é mais produção e os docs precisam ser atualizados, ou o dev mode está apontando para produção |
| G5 | `chat/stream` e `manual-run` também passam pelo `createStagingClientFromEnv` | **P2** | Mesmas chamadas vão acabar quebrando se também tentarem escrever em `orc_*` |
| G6 | Sem migration alguma versionada em `supabase/migrations/` ou similar — só SQL "candidate" em `platform/docs/sql_proposals/` | **P2** | Sem trilha de migration reproduzível em CI/setup novo |

> **G1+G2 são o mesmo bug em duas camadas.** Resolver G2 (env corretas) resolve G1 (apontamento) automaticamente.

---

## 6. Ordem Correta de Migrations (caso o caminho escolhido seja replicar no banco "main")

> ⚠️ Esta seção é **alternativa** a §7. A recomendação primária é **apontar para o staging que já tem o schema**, não migrar o banco principal.

Se for decidido aplicar o SQL candidate em `jwutiebpfauwzzltwgbb`, a ordem é:

```
Migration 1: pré-checks read-only
  └─ confirmar opportunities(id uuid), opportunity_files(id uuid), orcamentos(id uuid)
  └─ confirmar pgcrypto + gen_random_uuid()
  └─ confirmar que as 9 tabelas orc_* não existem

Migration 2: aplicar integralmente o arquivo
  └─ ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_MIGRATION_CANDIDATE.sql
  └─ uma única transação (já está escrita com CREATE TABLE IF NOT EXISTS, idempotente)

Migration 3: pós-checks read-only
  └─ 9 tabelas presentes
  └─ 59 índices presentes
  └─ 3 triggers + 2 funções + 1 UNIQUE
  └─ RLS = true nas 9 tabelas
```

Rollback comentado já existe no fim do arquivo SQL (linhas 477-495).

---

## 7. MVP Mínimo de Schema

A pergunta "qual é o conjunto mínimo de tabelas para destravar o fluxo IA?" tem **uma resposta cirúrgica:**

> **Apenas `orc_context_snapshots`** é o que o endpoint `/analyze` realmente toca hoje. As outras 8 tabelas (`orc_reader_*`, `orc_verifier_*`, `orc_hitl_*`) só seriam tocadas se o pipeline Reader/Verifier/HITL fosse disparado — o que o MVP atual **não faz** (HITL é client-side, persistência final usa `criarItemManual()` direto em `orcamento_itens`).

**Mas isso não significa que faça sentido criar só uma tabela.** O SQL candidate é coerente e auditado; criar 1 de 9 deixa o schema bagunçado.

| Cenário | Tabelas necessárias |
|:---|:---|
| Apenas destravar o erro 500 do MVP atual | `orc_context_snapshots` (1 tabela + FKs externas) |
| Pipeline completo (futuro) | Todas as 9 |
| **Recomendado** (consistência arquitetural) | **Todas as 9 — aplicar o SQL candidate inteiro** |

---

## 8. Riscos

### P0
- **Backend está consultando produção em dev mode.** O ref `jwutiebpfauwzzltwgbb` é tratado nos docs 4B.* como "ref bloqueada de produção", mas é exatamente o que o backend está chamando agora — com chave service_role. Qualquer mutação acidental nesse banco afeta dados reais.

### P1
- **`.env` versionado contém secrets reais.** O arquivo está gitignored (`.gitignore:7 .env*`), mas existem chaves de produção (Supabase service_role, Anthropic, OpenRouter, Gemini, IMGBB, Supabase Access Token) em texto plano. Se algum dia esse arquivo escapar do gitignore, todos os secrets vazam. Considerar **rotação** independentemente da migration.
- **Falta de migrations versionadas.** Não há diretório `supabase/migrations/` nem um índice de ordem de migrações aplicadas. Toda a evolução do schema está em SQL "candidate" + relatórios narrativos. Reproduzir o setup em uma máquina nova hoje é manual.

### P2
- **Sem RLS policies definitivas.** As 9 tabelas têm RLS habilitado mas **zero policies**. Em service_role isso não bloqueia escrita (bypass de RLS), mas qualquer acesso futuro via `anon`/`authenticated` será bloqueado silenciosamente. Está documentado como pendência intencional.
- **`scratch/conflict-orcamentista-tab/`** ainda gera 45 erros em `tsc` — não bloqueia mas polui (P3 do relatório anterior).

---

## 9. Recomendação Final

### 9.1 O banco pode ser reconciliado sem refatoração?
**Sim. Sem tocar uma linha de TypeScript.** O código está correto e o schema esperado existe — só não no banco que o backend está chamando agora.

### 9.2 O código atual está correto?
**Sim.** As 4 garantias inspecionadas batem:
- Allowlist coerente ([guards.ts:11-22](platform/server/orcamentista/persistence/guards.ts#L11-L22)).
- Repository monta payload conforme schema ([repository.ts:426-457](platform/server/orcamentista/persistence/repository.ts#L426-L457)).
- Rota grava só em `orc_context_snapshots` no MVP, não toca as outras 8.
- Guard `assertNoBudgetItemWrite` bloqueia escrita em `orcamento_itens` no caminho IA.

### 9.3 Qual migration deve ser aplicada primeiro?
**Nenhuma.** A migration já existe e já foi aplicada — em `vtlepoljlqmjwuauygni`. A ação correta é **reapontar o backend** para esse projeto.

### 9.4 O MVP pode ser destravado rapidamente?
**Sim — duas opções, em ordem de preferência:**

#### Opção A (recomendada): apontar para o staging autorizado
Acrescentar ao `.env`:
```
EVIS_STAGING_PROJECT_REF=vtlepoljlqmjwuauygni
EVIS_BLOCKED_PRODUCTION_PROJECT_REF=jwutiebpfauwzzltwgbb
EVIS_STAGING_SUPABASE_URL=https://vtlepoljlqmjwuauygni.supabase.co
EVIS_STAGING_SUPABASE_SERVICE_ROLE_KEY=<service_role do staging>
# manter EVIS_ALLOW_MAIN_SUPABASE_DEV_MODE=true para não quebrar outras rotas,
# mas as variáveis acima têm precedência e desativam o fallback
```
Pré-requisito: o `vtlepoljlqmjwuauygni` precisa ter as oportunidades/arquivos/orçamentos de teste, ou copiar uma oportunidade de teste para lá.

#### Opção B: aplicar o SQL candidate em `jwutiebpfauwzzltwgbb`
Rodar o arquivo `ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_MIGRATION_CANDIDATE.sql` no banco atual.  
**Risco:** esse ref está marcado como "produção bloqueada" nos relatórios anteriores. Se for de fato produção, essa migration deveria passar por revisão formal antes.  
**Vantagem:** mantém os dados de oportunidade que o usuário já vem usando para testar.

> **A decisão entre A e B exige confirmar o que `jwutiebpfauwzzltwgbb` realmente é.** Se for o banco "principal/dev unificado" do projeto e os relatórios 4B.* estão desatualizados, B é seguro. Se ainda for produção real, A é obrigatório.

### 9.5 Após reconciliação, basta repetir F6→F11?
**Sim.** Nenhuma mudança de código necessária. Após o backend escrever com sucesso em `orc_context_snapshots`, o endpoint `/analyze` retorna o preview, o `OrcamentistaAiReviewPanel` renderiza, e `criarItemManual({ origem: 'ia_gemini' })` continua persistindo em `orcamento_itens` no mesmo banco que já está sendo usado.

---

## 10. Próximo passo proposto

**ETAPA 10 — Decisão de Apontamento + Repetição de F6→F11**

1. Confirmar com o operador qual é a natureza real de `jwutiebpfauwzzltwgbb` (produção / dev unificado / abandonado).
2. Escolher Opção A ou B do §9.4.
3. Atualizar `.env` (ou aplicar SQL no banco escolhido).
4. Reiniciar `npm run server`.
5. Repetir F6→F11 conforme [EVIS_ORCAMENTISTA_MVP_VALIDATION_REPORT.md §4](platform/docs/EVIS_ORCAMENTISTA_MVP_VALIDATION_REPORT.md#L48).
6. Em caso de sucesso, corrigir os P2 cosméticos do Stepper e imports não-usados.
7. Commit.

> **Nenhum SQL aplicado nesta etapa. Nenhum arquivo de código alterado.** Apenas diagnóstico.

---

## 11. Apêndice — Cadeia de evidências

| Doc | Conteúdo relevante |
|:---|:---|
| [ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_MIGRATION_CANDIDATE.sql](platform/docs/sql_proposals/ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_MIGRATION_CANDIDATE.sql) | SQL completo das 9 tabelas |
| [EVIS_READER_VERIFIER_HITL_MIGRATION_EXECUTION_REPORT_4B1E.md](platform/docs/EVIS_READER_VERIFIER_HITL_MIGRATION_EXECUTION_REPORT_4B1E.md) | Migration aplicada em `vtlepoljlqmjwuauygni` em fase 4B.1.E |
| [EVIS_READER_VERIFIER_HITL_POST_MIGRATION_VALIDATION_EXECUTION_4B2E.md](platform/docs/EVIS_READER_VERIFIER_HITL_POST_MIGRATION_VALIDATION_EXECUTION_4B2E.md) | Validação pós-migration (26 tabelas, 9 RLS, 3 triggers, 2 funções) |
| [guards.ts:11-22](platform/server/orcamentista/persistence/guards.ts#L11-L22) | Allowlist de 10 tabelas |
| [repository.ts:69-81](platform/server/orcamentista/persistence/repository.ts#L69-L81) | Mapeamento canônico de nomes de tabela |
| [stagingClient.ts:55-113](platform/server/orcamentista/persistence/stagingClient.ts#L55-L113) | Lógica de fallback "main dev mode" |
| [server/routes/orcamentista.ts:368-396](server/routes/orcamentista.ts#L368-L396) | Onde o `/analyze` grava o snapshot e falha |
| `.env` (gitignored) | Confirma `VITE_SUPABASE_URL=https://jwutiebpfauwzzltwgbb.supabase.co` |
