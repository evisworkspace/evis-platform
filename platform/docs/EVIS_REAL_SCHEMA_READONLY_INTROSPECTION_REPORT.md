# EVIS — Real Schema Read-Only Introspection Report

> Fase: 4A.4
> Tipo: introspecção read-only do schema real
> Status: documento de leitura; sem SQL de escrita; sem migration aplicada; sem banco alterado
> Metodo: Supabase Management API — queries read-only via `information_schema`, `pg_tables`, `pg_policies`, `pg_indexes`, `pg_extension`
> Data: 2026-05-07

## 1. Objetivo

Confirmar o schema real do banco Supabase usando apenas queries read-only contra `information_schema` e catálogos `pg_*`. Verificar compatibilidade com o SQL draft 4A.3 antes de qualquer migration real.

Nenhum SQL de escrita foi executado. Nenhuma migration foi aplicada. Nenhum banco foi alterado. Nenhum código operacional ou UI foi alterado.

## 2. Método de Acesso

Ferramenta: Supabase Management API
Endpoint: `POST https://api.supabase.com/v1/projects/jwutiebpfauwzzltwgbb/database/query`
Autenticação: SUPABASE_ACCESS_TOKEN (Bearer)
Projeto: `jwutiebpfauwzzltwgbb`

Todas as queries são SELECT-only contra:
- `information_schema.tables`
- `information_schema.columns`
- `information_schema.table_constraints`
- `information_schema.key_column_usage`
- `information_schema.constraint_column_usage`
- `information_schema.referential_constraints`
- `information_schema.triggers`
- `pg_tables`
- `pg_policies`
- `pg_indexes`
- `pg_extension`

## 3. Tabelas Existentes no Schema Public

Total de tabelas encontradas: **25**

| Tabela | Status para pipeline |
|--------|---------------------|
| `alias_conhecimento` | Tabela de suporte (Obra) |
| `brain_narrativas` | Tabela de suporte (IA) |
| `catalogo_servicos_evis` | Tabela de catálogo |
| `composicoes_modelo` | Tabela de catálogo |
| `contacts` | **BASE CONFIRMADA** |
| `cotacoes_reais` | Tabela de catálogo |
| `diario_obra` | Tabela de suporte (Obra) |
| `equipes_cadastro` | Tabela de suporte (Obra) |
| `equipes_presenca` | Tabela de suporte (Obra) |
| `fotos` | Tabela de suporte (Obra) |
| `notas` | Tabela de suporte (Obra) |
| `obras` | **BASE CONFIRMADA** |
| `opportunities` | **BASE CONFIRMADA — âncora principal do pipeline** |
| `opportunity_events` | **BASE CONFIRMADA** |
| `opportunity_files` | **BASE CONFIRMADA** |
| `orcamento_itens` | **BASE CONFIRMADA** |
| `orcamentos` | **BASE CONFIRMADA** |
| `pendencias` | Tabela de suporte (Obra) |
| `precos_referencia_historico` | Tabela de catálogo |
| `propostas` | **BASE CONFIRMADA** |
| `servicos` | Tabela de suporte (Obra) |
| `servicos_referencia_origem` | Tabela de catálogo |
| `sinapi_composicoes` | Tabela de catálogo |
| `snapshot_orcamento_itens` | Tabela de catálogo |
| `sugestoes_catalogo` | Tabela de catálogo |

### 3.1 Pipeline Tables (Draft 4A.3)

**Nenhuma das 9 tabelas do draft pipeline existe no banco real.** Confirmação de que o SQL draft nunca foi aplicado:

- `orc_reader_runs` — NÃO EXISTE
- `orc_reader_outputs` — NÃO EXISTE
- `orc_reader_safety_evaluations` — NÃO EXISTE
- `orc_verifier_runs` — NÃO EXISTE
- `orc_reader_verifier_comparisons` — NÃO EXISTE
- `orc_reader_verifier_divergences` — NÃO EXISTE
- `orc_hitl_issues` — NÃO EXISTE
- `orc_hitl_decisions` — NÃO EXISTE
- `orc_context_snapshots` — NÃO EXISTE

## 4. Colunas Críticas Confirmadas

### 4.1 `opportunities`

| Coluna | Tipo Real | Nullable | Default | Status |
|--------|-----------|----------|---------|--------|
| `id` | `uuid` | NO | `gen_random_uuid()` | CONFIRMADO |
| `titulo` | `text` | NO | — | CONFIRMADO |
| `status` | `text` | NO | `'novo'::text` | CONFIRMADO |
| `contact_id` | `uuid` | YES | — | CONFIRMADO (FK real) |
| `orcamentista_workspace_id` | `text` | YES | — | CONFIRMADO |
| `orcamento_id` | `uuid` | YES | — | CONFIRMADO (sem FK formal) |
| `proposta_id` | `uuid` | YES | — | CONFIRMADO (sem FK formal) |
| `obra_id` | `uuid` | YES | — | CONFIRMADO (FK real → obras.id) |
| `created_at` | `timestamptz` | NO | `now()` | CONFIRMADO |
| `updated_at` | `timestamptz` | NO | `now()` | CONFIRMADO |

### 4.2 `opportunity_files`

| Coluna | Tipo Real | Nullable | Default | Status |
|--------|-----------|----------|---------|--------|
| `id` | `uuid` | NO | `gen_random_uuid()` | CONFIRMADO |
| `opportunity_id` | `uuid` | NO | — | CONFIRMADO (FK NOT NULL) |
| `nome` | `text` | NO | — | CONFIRMADO |
| `url` | `text` | YES | — | CONFIRMADO |
| `storage_path` | `text` | YES | — | CONFIRMADO |
| `categoria` | `text` | YES | — | CONFIRMADO |
| `mime_type` | `text` | YES | — | CONFIRMADO |
| `tamanho_bytes` | `bigint` | YES | — | CONFIRMADO |
| `created_at` | `timestamptz` | NO | `now()` | CONFIRMADO |

### 4.3 `orcamentos`

| Coluna | Tipo Real | Nullable | Default | Status |
|--------|-----------|----------|---------|--------|
| `id` | `uuid` | NO | `gen_random_uuid()` | CONFIRMADO |
| `obra_id` | **`text`** | YES | — | CONFIRMADO — tipo TEXT, não UUID |
| `nome` | `text` | NO | — | CONFIRMADO |
| `cliente` | `text` | YES | — | CONFIRMADO |
| `status` | `text` | NO | `'rascunho'::text` | CONFIRMADO |
| `bdi` | `numeric` | NO | `25` | CONFIRMADO |
| `total_bruto` | `numeric` | NO | `0` | CONFIRMADO |
| `total_final` | `numeric` | NO | `0` | CONFIRMADO |
| `observacoes` | `text` | YES | — | CONFIRMADO |
| `created_at` | `timestamptz` | YES | `now()` | CONFIRMADO |
| `updated_at` | `timestamptz` | YES | `now()` | CONFIRMADO |

**Nota crítica:** `orcamentos.obra_id` é `text NULL`, **não** UUID com FK. Confirma CODING_STANDARDS.md: "obra_id nas tabelas: tipo TEXT (não UUID com FK)". O draft 4A.3 faz FK para `orcamentos.id` (uuid), não para `orcamentos.obra_id` — sem impacto.

### 4.4 `orcamento_itens`

| Coluna | Tipo Real | Nullable | Default | Status |
|--------|-----------|----------|---------|--------|
| `id` | `uuid` | NO | `gen_random_uuid()` | CONFIRMADO |
| `orcamento_id` | `uuid` | NO | — | CONFIRMADO (FK NOT NULL) |
| `codigo` | `text` | YES | — | CONFIRMADO (campo correto: `codigo`, não `codigo_referencia`) |
| `descricao` | `text` | NO | — | CONFIRMADO |
| `unidade` | `text` | NO | `'un'::text` | CONFIRMADO |
| `quantidade` | `numeric` | NO | `1` | CONFIRMADO |
| `valor_unitario` | `numeric` | NO | `0` | CONFIRMADO |
| `valor_total` | `numeric` | NO | `0` | CONFIRMADO |
| `origem` | `text` | NO | `'manual'::text` | CONFIRMADO |
| `created_at` | `timestamptz` | YES | `now()` | CONFIRMADO |

### 4.5 `contacts`

| Coluna | Tipo Real | Nullable | Default | Status |
|--------|-----------|----------|---------|--------|
| `id` | `uuid` | NO | `gen_random_uuid()` | CONFIRMADO |
| `nome` | `text` | NO | — | CONFIRMADO |
| `telefone` | `text` | YES | — | CONFIRMADO |
| `email` | `text` | YES | — | CONFIRMADO |
| `created_at` | `timestamptz` | NO | `now()` | CONFIRMADO |
| `updated_at` | `timestamptz` | NO | `now()` | CONFIRMADO |

### 4.6 `propostas`

| Coluna | Tipo Real | Nullable | Default | Status |
|--------|-----------|----------|---------|--------|
| `id` | `uuid` | NO | `gen_random_uuid()` | CONFIRMADO |
| `opportunity_id` | `uuid` | YES | — | CONFIRMADO (FK, nullable — SET NULL) |
| `orcamento_id` | `uuid` | YES | — | CONFIRMADO (sem FK formal) |
| `titulo` | `text` | NO | — | CONFIRMADO |
| `status` | `text` | NO | `'rascunho'::text` | CONFIRMADO |
| `payload` | `jsonb` | NO | `'{}'::jsonb` | CONFIRMADO |
| `created_at` | `timestamptz` | NO | `now()` | CONFIRMADO |
| `updated_at` | `timestamptz` | NO | `now()` | CONFIRMADO |

### 4.7 `obras`

| Coluna | Tipo Real | Nullable | Default | Status |
|--------|-----------|----------|---------|--------|
| `id` | `uuid` | NO | `gen_random_uuid()` | CONFIRMADO |
| `nome` | `text` | NO | — | CONFIRMADO |
| `status` | `text` | YES | `'ATIVA'::text` | CONFIRMADO |
| `cliente` | `text` | YES | — | CONFIRMADO |
| `created_at` | `timestamptz` | YES | `now()` | CONFIRMADO |

## 5. Foreign Keys Reais Confirmadas

| Tabela | Coluna | Tabela Alvo | Coluna Alvo | Delete Rule |
|--------|--------|-------------|-------------|-------------|
| `opportunities` | `contact_id` | `contacts` | `id` | SET NULL |
| `opportunities` | `obra_id` | `obras` | `id` | SET NULL |
| `opportunity_events` | `opportunity_id` | `opportunities` | `id` | CASCADE |
| `opportunity_files` | `opportunity_id` | `opportunities` | `id` | CASCADE |
| `orcamento_itens` | `orcamento_id` | `orcamentos` | `id` | CASCADE |
| `propostas` | `opportunity_id` | `opportunities` | `id` | SET NULL |
| `brain_narrativas` | `obra_id` | `obras` | `id` | CASCADE |
| `diario_obra` | `obra_id` | `obras` | `id` | CASCADE |
| `equipes_cadastro` | `obra_id` | `obras` | `id` | CASCADE |
| `equipes_presenca` | `obra_id` | `obras` | `id` | CASCADE |
| `fotos` | `obra_id` | `obras` | `id` | CASCADE |
| `notas` | `obra_id` | `obras` | `id` | CASCADE |
| `pendencias` | `obra_id` | `obras` | `id` | CASCADE |
| `servicos` | `obra_id` | `obras` | `id` | CASCADE |

### 5.1 Ausência de FK confirmada

| Campo | Tabela | Observação |
|-------|--------|------------|
| `opportunities.orcamento_id` | `opportunities` | uuid avulso — sem FK formal para `orcamentos.id` |
| `opportunities.proposta_id` | `opportunities` | uuid avulso — sem FK formal para `propostas.id` |
| `propostas.orcamento_id` | `propostas` | uuid avulso — sem FK formal para `orcamentos.id` |
| `orcamentos.obra_id` | `orcamentos` | text avulso — sem FK para `obras.id` |

### 5.2 Compatibilidade com SQL Draft 4A.3

O SQL draft cria FKs das 9 novas tabelas para:
- `opportunities(id)` — uuid NOT NULL, existe, PK ✓ COMPATÍVEL
- `orcamentos(id)` — uuid NOT NULL, existe, PK ✓ COMPATÍVEL
- `opportunity_files(id)` — uuid NOT NULL, existe, PK ✓ COMPATÍVEL

Nenhuma FK do draft aponta para `orcamentos.obra_id` (text) — sem impacto de tipo.

## 6. Índices Confirmados

### 6.1 Tabelas Base

| Índice | Tabela | Campo | Tipo |
|--------|--------|-------|------|
| `opportunities_pkey` | `opportunities` | `id` | UNIQUE btree |
| `idx_opportunities_contact_id` | `opportunities` | `contact_id` | btree |
| `idx_opportunities_obra_id` | `opportunities` | `obra_id` | btree |
| `idx_opportunities_status` | `opportunities` | `status` | btree |
| `opportunity_files_pkey` | `opportunity_files` | `id` | UNIQUE btree |
| `idx_opportunity_files_opportunity_id` | `opportunity_files` | `opportunity_id` | btree |
| `orcamentos_pkey` | `orcamentos` | `id` | UNIQUE btree |
| `idx_orcamentos_obra_id` | `orcamentos` | `obra_id` | btree |
| `orcamento_itens_pkey` | `orcamento_itens` | `id` | UNIQUE btree |
| `idx_orcamento_itens_orcamento_id` | `orcamento_itens` | `orcamento_id` | btree |
| `contacts_pkey` | `contacts` | `id` | UNIQUE btree |
| `propostas_pkey` | `propostas` | `id` | UNIQUE btree |
| `idx_propostas_opportunity_id` | `propostas` | `opportunity_id` | btree |
| `idx_propostas_orcamento_id` | `propostas` | `orcamento_id` | btree |
| `idx_propostas_status` | `propostas` | `status` | btree |

### 6.2 Índices Pipeline (Draft 4A.3)

Nenhum índice pipeline existe (tabelas ainda não criadas) — esperado.

O draft 4A.3 inclui 37+ índices para as 9 novas tabelas (incluindo 7 adicionados na hardening 4A.3).

## 7. Extensões Instaladas

| Extensão | Versão | Relevância |
|----------|--------|------------|
| `pgcrypto` | 1.3 | `gen_random_uuid()` disponível — padrão do projeto ✓ |
| `uuid-ossp` | 1.1 | `uuid_generate_v4()` disponível (não usado no projeto) |
| `pg_trgm` | 1.6 | Busca textual por trigrama |
| `unaccent` | 1.1 | Normalização de texto sem acentos |
| `pg_stat_statements` | 1.11 | Monitoramento de queries |
| `plpgsql` | 1.0 | Linguagem procedural |
| `supabase_vault` | 0.3.1 | Gerenciamento de segredos |

**Conclusão:** `gen_random_uuid()` está disponível nativamente. O padrão do draft é correto e executável.

## 8. RLS — Status Real

Todas as 25 tabelas têm RLS habilitado: **rowsecurity = true**

### 8.1 Políticas nas Tabelas Base

| Tabela | Políticas | Tipo de Acesso |
|--------|-----------|----------------|
| `opportunities` | 4 políticas `mvp_open_*` (SELECT/INSERT/UPDATE/DELETE) | Aberto — MVP local |
| `opportunity_files` | 4 políticas `mvp_open_*` | Aberto — MVP local |
| `opportunity_events` | 4 políticas `mvp_open_*` | Aberto — MVP local |
| `contacts` | 4 políticas `mvp_open_*` | Aberto — MVP local |
| `propostas` | `propostas_open_access` — ALL USING(true) | Aberto — MVP local |
| `orcamentos` | `acesso_livre_orcamentos` — ALL USING(true) | Aberto — MVP local |
| `orcamento_itens` | `acesso_livre_orcamento_itens` — ALL USING(true) | Aberto — MVP local |
| `obras` | Mix: 4 mvp_open_* + 3 obra_*_authenticated | Dupla política — mvp + auth |

### 8.2 Conclusão para Pipeline

As 9 tabelas pipeline não existem — não há políticas de RLS para elas. O SQL draft mantém RLS como proposta comentada. Correto para esta fase.

Quando criadas, não devem ter `USING (true)` aberto — conforme diretriz 4A.3 seção 10.

## 9. Triggers Existentes

| Trigger | Tabela | Evento | Ação |
|---------|--------|--------|------|
| `trg_catalogo_servicos_evis_updated_at` | `catalogo_servicos_evis` | UPDATE | `set_updated_at()` |
| `trg_composicoes_modelo_updated_at` | `composicoes_modelo` | UPDATE | `set_updated_at()` |
| `trg_cotacoes_reais_updated_at` | `cotacoes_reais` | UPDATE | `set_updated_at()` |
| `trg_precos_referencia_historico_updated_at` | `precos_referencia_historico` | UPDATE | `set_updated_at()` |
| `trg_servicos_referencia_origem_updated_at` | `servicos_referencia_origem` | UPDATE | `set_updated_at()` |
| `trg_sinapi_composicoes_updated_at` | `sinapi_composicoes` | UPDATE | `set_updated_at()` |
| `trg_sugestoes_catalogo_updated_at` | `sugestoes_catalogo` | UPDATE | `set_updated_at()` |

**Conclusão:** Função `set_updated_at()` existe e funciona. Nenhum trigger nas tabelas base (opportunities, orcamentos, etc.). Nenhum trigger pipeline. Nenhum conflito.

## 10. Divergências Encontradas vs. Documentação Prévia

| # | Campo/Tabela | Esperado (docs) | Real (introspecção) | Impacto no Draft |
|---|------|---------|------|-----------------|
| 1 | `orcamentos.obra_id` tipo | UUID (inferido) | **TEXT NULL** | Sem impacto — draft FK aponta para `orcamentos.id` (uuid), não `orcamentos.obra_id` |
| 2 | `opportunities.orcamento_id` FK | FK formal para `orcamentos.id` | UUID avulso sem FK | Sem impacto — draft não depende desta FK |
| 3 | `opportunities.proposta_id` FK | FK formal para `propostas.id` | UUID avulso sem FK | Sem impacto |
| 4 | `orcamento_itens.orcamento_id` delete rule | RESTRICT (recomendado) | CASCADE real | Sem impacto no draft — tabela já existe; draft não a modifica |
| 5 | `obras` schema | Colunas completas per SCHEMA_OFICIAL_V1 | Schema simplificado: id, nome, status, cliente, created_at, data_inicio, data_fim, descricao, orcamento_status | Sem impacto — draft FK só usa `obras.id` (uuid, confirmado) |

**Nenhuma divergência bloqueia a migration 4B.**

### 10.1 Descoberta Importante — `obras.orcamento_status`

A tabela `obras` tem campo `orcamento_status text NOT NULL DEFAULT 'rascunho'::text` — campo não documentado em SCHEMA_OFICIAL_V1.sql. Indica que o controle de status do orçamento é duplicado/espelhado na tabela `obras`. Este campo deve ser considerado ao projetar a transição Reader→Proposta→Obra.

## 11. Compatibilidade do SQL Draft 4A.3 com Schema Real

| Verificação | Resultado |
|-------------|-----------|
| `opportunities.id` uuid NOT NULL — âncora FK do draft | COMPATÍVEL ✓ |
| `orcamentos.id` uuid NOT NULL — alvo FK do draft | COMPATÍVEL ✓ |
| `opportunity_files.id` uuid NOT NULL — alvo FK do draft | COMPATÍVEL ✓ |
| `gen_random_uuid()` disponível via pgcrypto | COMPATÍVEL ✓ |
| Nenhuma pipeline table conflita com tabela existente | COMPATÍVEL ✓ |
| Prefixo `orc_` único para pipeline | COMPATÍVEL ✓ — só `orcamentos` e `orcamento_itens` usam `orc_` atualmente |
| RLS habilitado no banco | COMPATÍVEL ✓ — `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` executará sem erro |
| Triggers `set_updated_at()` em tabelas base | SEM CONFLITO ✓ — draft não adiciona triggers executáveis |

**Conclusão: o SQL draft 4A.3 está pronto para ser promovido a migration candidate.**

## 12. Confirmações de Conformidade

- Nenhum SQL de escrita executado.
- Nenhuma migration aplicada.
- Nenhum banco alterado.
- Nenhum código operacional ou UI alterado.
- Apenas queries SELECT contra `information_schema` e catálogos `pg_*`.
- As 9 tabelas pipeline confirmadamente não existem.
- Todas as FK alvo do draft confirmadas como existentes e compatíveis.
- `gen_random_uuid()` confirmado disponível.
- RLS habilitado em todas as tabelas existentes.

## 13. Próxima Fase Recomendada

**Fase 4B — Migration Real do Schema Reader/Verifier/HITL**

Pré-requisitos confirmados nesta fase:
- ✓ Schema base compatível
- ✓ FK alvos existem e são do tipo correto
- ✓ `gen_random_uuid()` disponível
- ✓ Nenhum conflito de nomenclatura
- ✓ RLS pronto para ser configurado por papel

Ação recomendada:
1. Promover `ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_DRAFT.sql` de DRAFT para migration candidate
2. Remover `-- DRAFT ONLY. DO NOT EXECUTE.` do cabeçalho
3. Executar no painel Supabase em ambiente de staging primeiro
4. Validar triggers de imutabilidade e append-only antes de produção
5. Definir políticas RLS por papel antes de expor via API
