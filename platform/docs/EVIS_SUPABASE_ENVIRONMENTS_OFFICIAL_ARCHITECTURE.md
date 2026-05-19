# EVIS — Arquitetura Oficial de Ambientes Supabase

> **Status:** SCAFFOLD — aguardando preenchimento de decisões de governança  
> **Criado em:** 2026-05-16  
> **Etapa:** 10 — Reconciliação Oficial de Ambientes  
> **Natureza:** Fonte canônica operacional. Quando houver dúvida de ambiente, a resposta vem daqui.

> ⚠️ **Este documento não é descritivo, é prescritivo.** Decisões aqui registradas viram regra. Mudanças exigem revisão explícita.

---

## 0. Como usar este documento

| Situação | Ação |
|:---|:---|
| Vai criar uma nova feature que toca o banco | Consulte §3 (Política de conexão) e §6 (Migrations) |
| Vai aplicar SQL em algum ambiente | Consulte §6 e §9 |
| Recebeu erro `relation does not exist` ou `permission denied` | Consulte §5 (Fallback) e §11 (Incidentes) |
| Vai compartilhar credenciais com alguém | Consulte §4 e §9 |
| Algo deu errado de forma inesperada | Registre em §11 antes de tudo |

---

## 1. Objetivo

Formalizar:

| Item | Objetivo |
|:---|:---|
| Isolamento de ambientes | Segurança — escrita em um ambiente nunca afeta outro |
| Prevenção de cross-write | Integridade — backend de dev não escreve em produção |
| Regras de service_role | Governança — quem pode usar a chave master, e onde |
| Pipelines permitidos | Estabilidade — migrations seguem trilho previsível |
| Fallback policy | Previsibilidade — sistema falha explícito, nunca silencioso |

---

## 2. Ambientes oficiais

> **TODO operador:** preencher refs e confirmar finalidade. Onde já há fato confirmado nesta sessão, pré-preenchi entre `[brackets]`.

| Ambiente | Ref Supabase | URL | Finalidade | Status | Owner |
|:---|:---|:---|:---|:---|:---|
| **local** | _(TBD — se existe Supabase local via CLI, registrar)_ | _(TBD)_ | Desenvolvimento local sem rede | _(TBD)_ | _(TBD)_ |
| **staging** | `vtlepoljlqmjwuauygni` | `https://vtlepoljlqmjwuauygni.supabase.co` | Homologação IA, smoke tests do Orçamentista pipeline | ✅ Ativo (migrations 4B.1.E aplicadas) | _(TBD)_ |
| **produção** | `jwutiebpfauwzzltwgbb` _(a confirmar)_ | `https://jwutiebpfauwzzltwgbb.supabase.co` | _(TBD — confirmar se é produção real ou banco dev unificado)_ | ⚠️ **Conflito documental:** docs 4B.* tratam como "ref bloqueada de produção"; `.env` local usa como banco principal | _(TBD)_ |
| **sandbox** | _(TBD — recomendado criar)_ | _(TBD)_ | Testes destrutivos (DROP, TRUNCATE, migrations experimentais) | ❌ Não existe ainda | _(TBD)_ |

### 2.1 Pendência crítica de §2

A natureza real de `jwutiebpfauwzzltwgbb` precisa ser confirmada antes de fechar este documento:

```
[ ] é produção real com dados de cliente?
[ ] é banco dev unificado (e os docs 4B.* estão desatualizados)?
[ ] é dev compartilhado entre operador e equipe?
```

Sem essa decisão, §3, §6 e §7 ficam pendentes.

---

## 3. Política de Conexão

> **TODO operador:** marcar ✅ permitido, ❌ proibido, ⚠️ permitido com restrição.

| Camada | local | staging | produção | sandbox |
|:---|:---:|:---:|:---:|:---:|
| Frontend (Vite, browser) — `anon` key | _(TBD)_ | _(TBD)_ | _(TBD)_ | _(TBD)_ |
| Frontend — `service_role` | ❌ NUNCA | ❌ NUNCA | ❌ NUNCA | ❌ NUNCA |
| Backend (Express) — `service_role` | _(TBD)_ | _(TBD)_ | _(TBD)_ | _(TBD)_ |
| Migrations (CLI/Management API) | _(TBD)_ | _(TBD)_ | _(TBD)_ | _(TBD)_ |
| Smoke tests / E2E | _(TBD)_ | _(TBD)_ | _(TBD)_ | _(TBD)_ |
| Endpoint `/analyze` (Orçamentista IA) | _(TBD)_ | _(TBD)_ | _(TBD)_ | _(TBD)_ |
| Storage uploads `opportunity-files` | _(TBD)_ | _(TBD)_ | _(TBD)_ | _(TBD)_ |
| CLI manual (`pipelineViewCli`, `manualRunCli`) | _(TBD)_ | _(TBD)_ | _(TBD)_ | _(TBD)_ |

Referências de código relevantes para o preenchimento:
- [platform/server/orcamentista/persistence/stagingClient.ts:55-113](platform/server/orcamentista/persistence/stagingClient.ts#L55-L113) — onde o fallback é decidido hoje.
- [.env.example](.env.example) — quais variáveis o sistema espera por camada.

---

## 4. Política de Secrets

> **TODO operador:** preencher escopo e regras.

| Secret | Origem | Escopo permitido | Pode ir pro frontend? | Rotação |
|:---|:---|:---|:---:|:---|
| `SUPABASE_ANON_KEY` | Supabase Dashboard → API | _(TBD)_ | _(TBD — tradicionalmente sim, mas confirmar)_ | _(TBD)_ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → API | _(TBD)_ | ❌ NUNCA | _(TBD)_ |
| `EVIS_STAGING_SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard (staging) | Backend, CLI tools | ❌ NUNCA | _(TBD)_ |
| `GEMINI_API_KEY` | Google AI Studio | _(TBD)_ | _(TBD)_ | _(TBD)_ |
| `OPENROUTER_API_KEY` | OpenRouter | _(TBD)_ | _(TBD)_ | _(TBD)_ |
| `ANTHROPIC_API_KEY` | Anthropic Console | _(TBD)_ | _(TBD)_ | _(TBD)_ |
| `SUPABASE_ACCESS_TOKEN` | Supabase Account → Tokens | _(TBD — usado pela Management API para migrations)_ | ❌ NUNCA | _(TBD)_ |
| `VITE_IMGBB_API_KEY` | ImgBB | _(TBD)_ | _(TBD)_ | _(TBD)_ |

### 4.1 Regra estrutural (não negociável)

Qualquer secret com prefixo `VITE_` **é embutido no bundle do frontend** durante o build. Portanto:

- ✅ `VITE_*` só para chaves que podem ser públicas (anon keys, project URLs, ImgBB).
- ❌ Nunca prefixar `service_role`, `access_token`, `api_key` de serviços de IA pagos com `VITE_*`.

### 4.2 Pendência crítica de §4

`.env` atual tem `VITE_OPENROUTER_API_KEY` definido com o mesmo valor de `OPENROUTER_API_KEY` ([.env:17](.env#L17)). Isso significa que **a chave do OpenRouter está exposta no bundle do frontend**.

- [ ] Decidir se OpenRouter realmente precisa ser chamado do frontend (provavelmente não).
- [ ] Se não precisa, remover `VITE_OPENROUTER_API_KEY` e mover chamadas para o backend.
- [ ] Em qualquer caso, rotacionar a chave atual.

---

## 5. Política de Fallback

> Esta seção é crítica porque é exatamente onde a divergência silenciosa do incidente §11.1 aconteceu.

### 5.1 Princípios

1. **Fallback é privilégio, não default.** Sistema parte de "exigir configuração explícita".
2. **Falha deve ser ruidosa, não silenciosa.** Variável faltante = erro claro com instrução. Nunca degradação invisível.
3. **`project_ref` deve ser validado em runtime.** Se a chave JWT diz `ref=X` e a URL aponta para `Y`, falhar.
4. **Nunca permitir que dev mode toque produção.** Mesmo via fallback. Mesmo "temporariamente".

### 5.2 Decisões pendentes

| Pergunta | Resposta |
|:---|:---|
| `EVIS_ALLOW_MAIN_SUPABASE_DEV_MODE=true` deve continuar existindo? | _(TBD)_ |
| Se sim, em quais ambientes pode estar ligado? | _(TBD — recomendação: apenas com ref = local ou sandbox)_ |
| Se a chave de fallback apontar para `jwutiebpfauwzzltwgbb` e ele for produção, o backend deve abortar? | _(TBD — recomendação: SIM)_ |
| Devemos adicionar uma allowlist explícita de refs permitidos para fallback? | _(TBD — recomendação: SIM, lista de refs autorizados em código)_ |

### 5.3 Estado atual do código (descritivo, não prescritivo)

Hoje, [stagingClient.ts:55-113](platform/server/orcamentista/persistence/stagingClient.ts#L55-L113):

- Aceita qualquer `VITE_SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` se `EVIS_ALLOW_MAIN_SUPABASE_DEV_MODE=true`.
- **Não** valida o `project_ref` do fallback contra uma allowlist.
- **Não** distingue se a chave aponta para produção ou dev.
- Resultado: o backend pode estar conectado a produção sem perceber. Aconteceu (§11.1).

Após decisão em §5.2, o código deve ser endurecido para refletir.

---

## 6. Política de Migrations

> **TODO operador:** preencher.

| Ambiente | Migration automática (CI)? | Migration manual permitida? | Quem aprova? | Onde fica o histórico? |
|:---|:---:|:---:|:---|:---|
| local | _(TBD)_ | _(TBD)_ | _(TBD)_ | _(TBD)_ |
| staging | _(TBD)_ | _(TBD)_ | _(TBD)_ | _(TBD)_ |
| produção | _(TBD — recomendação: NÃO automática)_ | _(TBD)_ | _(TBD — recomendação: dupla aprovação)_ | _(TBD)_ |
| sandbox | _(TBD — recomendação: livre)_ | _(TBD)_ | _(TBD)_ | _(TBD)_ |

### 6.1 Pendência crítica de §6

Não existe diretório `supabase/migrations/` versionado. Toda a evolução do schema está em arquivos `*.sql` dentro de `platform/docs/sql_proposals/` + relatórios narrativos.

Decisões necessárias:
- [ ] Adotar `supabase/migrations/` versionado com timestamps?
- [ ] Migrar os SQL "candidate" existentes para esse formato?
- [ ] Adicionar `supabase migration up` no setup de um dev novo?

---

## 7. Política de Dados

> **TODO operador:** decidir o que pode existir em cada ambiente.

| Tipo de dado | local | staging | produção | sandbox |
|:---|:---:|:---:|:---:|:---:|
| Dados reais de cliente (CNPJ, contato, endereço) | _(TBD)_ | _(TBD)_ | ✅ | _(TBD)_ |
| Documentos reais de obra (PDFs, plantas) | _(TBD)_ | _(TBD)_ | ✅ | _(TBD)_ |
| Memoriais/orçamentos identificados | _(TBD)_ | _(TBD)_ | ✅ | _(TBD)_ |
| Dados sintéticos / mockados | _(TBD)_ | _(TBD)_ | ❌ | _(TBD)_ |
| Dados anonimizados (cópia mascarada de produção) | _(TBD)_ | _(TBD)_ | n/a | _(TBD)_ |
| Credenciais de IA (Gemini, OpenRouter) reais | _(TBD)_ | _(TBD)_ | ✅ | _(TBD — recomendação: chaves separadas com quota baixa)_ |

### 7.1 Pergunta de proteção (LGPD)

- [ ] Existe alguma obrigação contratual/regulatória que impeça cópia de dados de produção para staging?
- [ ] Se sim, qual é o processo de anonimização aprovado?

---

## 8. Fluxo Oficial de Deploy

> **TODO operador:** confirmar o fluxo. Esboço inicial:

```
desenvolvimento local
    │
    ▼  (PR, code review)
staging (vtlepoljlqmjwuauygni)
    │
    ▼  (smoke tests F1→F11, migrations aplicadas, validação manual)
produção (TBD)
```

Decisões pendentes:
- [ ] Smoke tests obrigatórios antes de produção?
- [ ] Lista mínima de checks pré-deploy.
- [ ] Janela de deploy (horário, dia, freeze).
- [ ] Procedimento de rollback.

---

## 9. Regras Invioláveis

> Estas regras vencem qualquer pressa, qualquer "só essa vez", qualquer atalho.

1. **Nunca usar `service_role` no frontend.** Sem exceção. Sem feature flag. Sem ambiente de teste.
2. **Nunca permitir fallback silencioso para produção.** Sistema deve abortar com erro explícito se a configuração estiver ambígua.
3. **Nunca rodar migration direta em produção sem validação prévia em staging.** Mesmo "trivial". Mesmo "só uma coluna".
4. **Nunca compartilhar secrets em chat, ticket, documento ou PR description.** Use o cofre de secrets. Cole apenas no `.env` local (gitignored).
5. **Nunca commitar `.env`.** Verificar `.gitignore` antes de qualquer commit que toque o diretório raiz.
6. **Nunca usar a mesma chave `service_role` em mais de um ambiente.** Cada ref tem sua própria chave.
7. **Nunca aplicar SQL "candidate" sem revisão e sem registro de execução.** Toda aplicação real gera um `*_EXECUTION_REPORT_*.md`.
8. **Nunca migrar dados entre ambientes sem aprovação explícita e procedimento documentado.**

> Adicionar nova regra aqui exige discussão. Remover regra daqui também.

---

## 10. Glossário operacional

| Termo | Significado neste projeto |
|:---|:---|
| **Ref Supabase** | Subdomínio único de cada projeto Supabase (ex.: `vtlepoljlqmjwuauygni`). Aparece no JWT da chave. |
| **`service_role`** | Chave master do projeto. Bypassa RLS. Nunca vai pro frontend. |
| **`anon`** | Chave pública do projeto. Respeita RLS. Pode ir pro frontend. |
| **Allowlist de tabelas** | Lista de tabelas em [guards.ts](platform/server/orcamentista/persistence/guards.ts) que o Orçamentista pode escrever. Bloqueia escrita em `orcamento_itens` no caminho IA. |
| **Pipeline staging** | As 9 tabelas `orc_*` que compõem Reader/Verifier/HITL/Snapshot. Não é o ambiente "staging" — é o staging *de dados* antes da consolidação oficial. |
| **Consolidação oficial** | Gravar item aprovado em `orcamento_itens`. Hoje feito apenas via `criarItemManual()` (HITL client-side). |

---

## 11. Histórico de Incidentes

> Memória operacional institucional. Cada incidente que mudou ou poderia ter mudado a arquitetura entra aqui.

### 11.1 — 2026-05-16: Backend apontando silenciosamente para ref incorreto via fallback dev

**Sintoma:** Endpoint `/api/orcamentista/opportunities/:id/analyze` retornava HTTP 500 com `relation "orc_context_snapshots" does not exist`.

**Causa raiz:** [stagingClient.ts:92-109](platform/server/orcamentista/persistence/stagingClient.ts#L92-L109) caía no fallback "main dev mode" porque `.env` não tinha `EVIS_STAGING_*` configurado e tinha `EVIS_ALLOW_MAIN_SUPABASE_DEV_MODE=true`. O fallback usa `VITE_SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`, que apontam para `jwutiebpfauwzzltwgbb` — banco onde a migration do pipeline IA (9 tabelas `orc_*`) **nunca foi aplicada**.

**Por que passou despercebido:**
- Migration foi aplicada e validada em `vtlepoljlqmjwuauygni` (Fase 4B.1.E, 4B.2.E) — relatórios passaram.
- `EVIS_ALLOW_MAIN_SUPABASE_DEV_MODE=true` desliga a validação de ref do `stagingClient`.
- Itens manuais (`orcamento_itens`) funcionavam normalmente, mascarando o problema até a primeira chamada de `/analyze`.
- Logs não mostravam qual ref estava em uso.

**Impacto real:** Bloqueio funcional do MVP do Orçamentista IA. Nenhum dado corrompido (a escrita falhou antes de qualquer mutação).

**Impacto potencial:** Se o `analyze` tivesse uma escrita em tabela que existe nos dois bancos (ex: `opportunity_files`), o backend teria escrito em `jwutiebpfauwzzltwgbb` (potencialmente produção) achando que estava em staging. Isso é o risco real desta classe de bug.

**Resolução imediata:** Adicionar ao `.env` as variáveis `EVIS_STAGING_PROJECT_REF`, `EVIS_BLOCKED_PRODUCTION_PROJECT_REF`, `EVIS_STAGING_SUPABASE_URL`, `EVIS_STAGING_SUPABASE_SERVICE_ROLE_KEY` apontando para `vtlepoljlqmjwuauygni`. Detalhe em [EVIS_ORCAMENTISTA_SCHEMA_RECONCILIATION_REPORT.md §9.4](platform/docs/EVIS_ORCAMENTISTA_SCHEMA_RECONCILIATION_REPORT.md#L189).

**Lição estrutural (vira regra em §9):**
- Fallback silencioso é uma vulnerabilidade arquitetural, não conveniência.
- Validação de `project_ref` em runtime contra allowlist explícita.
- Logs devem sempre exprimir qual ref está sendo usado por requisição.

**Status:** ⏳ Aguardando configuração do `.env` com chave service_role do staging. Mudança de código (endurecimento do fallback) entrará na ETAPA 11 ou ETAPA 12 conforme prioridade.

**Documentos relacionados:**
- [EVIS_ORCAMENTISTA_SCHEMA_RECONCILIATION_REPORT.md](platform/docs/EVIS_ORCAMENTISTA_SCHEMA_RECONCILIATION_REPORT.md)
- [EVIS_ORCAMENTISTA_MVP_VALIDATION_REPORT.md](platform/docs/EVIS_ORCAMENTISTA_MVP_VALIDATION_REPORT.md)
- [EVIS_READER_VERIFIER_HITL_MIGRATION_EXECUTION_REPORT_4B1E.md](platform/docs/EVIS_READER_VERIFIER_HITL_MIGRATION_EXECUTION_REPORT_4B1E.md)

---

## 12. Checklist de adoção deste documento

Antes de fechar a ETAPA 10:

- [ ] Confirmar natureza real de `jwutiebpfauwzzltwgbb` (§2.1).
- [ ] Preencher §2 (refs e owners).
- [ ] Preencher §3 (política de conexão).
- [ ] Preencher §4 + decidir rotação dos secrets do §4.2.
- [ ] Decidir §5.2 (fallback policy) e abrir issue para hardening do `stagingClient`.
- [ ] Adotar `supabase/migrations/` versionado (§6.1) ou justificar por que não.
- [ ] Preencher §7 (política de dados) + checar LGPD em §7.1.
- [ ] Confirmar §8 (fluxo de deploy).
- [ ] Revisar §9 com a equipe — adicionar/remover regras conscientemente.
- [ ] Linkar este documento no CLAUDE.md e no README do repo para virar canônico.

---

> **Próximas etapas dependentes deste documento:**  
> ETAPA 11 — Observabilidade (logs/correlation-id/telemetry) consome §5 (fallback) e §11 (incidentes).  
> ETAPA 12 — Segurança (auth/rate limit/helmet/CORS) consome §4 (secrets) e §9 (invariantes).
