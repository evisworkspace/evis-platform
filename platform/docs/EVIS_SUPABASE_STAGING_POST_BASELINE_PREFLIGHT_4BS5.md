# EVIS - Supabase Staging Post-Baseline Preflight

> Fase: 4B.S5  
> Tipo: preflight read-only pos-baseline  
> Status: auditoria concluida; staging validado; sem SQL de escrita; sem migration aplicada; sem banco alterado  
> Staging: `vtlepoljlqmjwuauygni`  
> Producao bloqueada: `jwutiebpfauwzzltwgbb`

## 1. Objetivo

Confirmar se o ambiente de staging (`vtlepoljlqmjwuauygni`) possui o baseline de schema corretamente aplicado e se está pronto para receber a migration candidate Reader/Verifier/HITL (Fase 4B.1).

## 2. Confirmacao de Ambiente

- **Endpoint/Project Ref**: `vtlepoljlqmjwuauygni` ✓
- **Producao Bloqueada**: `jwutiebpfauwzzltwgbb` nao foi acessado ✓
- **Banco**: `postgres` (Supabase Staging)
- **Versao**: PostgreSQL 17.6 on aarch64-unknown-linux-gnu, compiled by gcc (GCC) 15.2.0, 64-bit

## 3. Tabelas Public Encontradas (17)

O baseline foi confirmado com as seguintes tabelas existentes:

1. `_schema_version`
2. `alias_conhecimento`
3. `contacts`
4. `diario_obra`
5. `equipes_cadastro`
6. `equipes_presenca`
7. `fotos`
8. `notas`
9. `obras`
10. `opportunities`
11. `opportunity_events`
12. `opportunity_files`
13. `orcamentos`
14. `orcamento_itens`
15. `pendencias`
16. `propostas`
17. `servicos`

## 4. Status das 9 Tabelas Pipeline

As tabelas do Orçamentista IA **NAO EXISTEM** no staging:

- `orc_reader_runs` (Ausente) ✓
- `orc_reader_outputs` (Ausente) ✓
- `orc_reader_safety_evaluations` (Ausente) ✓
- `orc_verifier_runs` (Ausente) ✓
- `orc_reader_verifier_comparisons` (Ausente) ✓
- `orc_reader_verifier_divergences` (Ausente) ✓
- `orc_hitl_issues` (Ausente) ✓
- `orc_hitl_decisions` (Ausente) ✓
- `orc_context_snapshots` (Ausente) ✓

## 5. Validacao de Colunas Criticas e FK-alvo

| Tabela | Coluna | Tipo | Nullable | Observacao |
| :--- | :--- | :--- | :--- | :--- |
| `opportunities` | `id` | `uuid` | NO | PK canonica ✓ |
| `opportunity_files` | `id` | `uuid` | NO | PK canonica ✓ |
| `orcamentos` | `id` | `uuid` | NO | PK canonica ✓ |
| `orcamento_itens` | `id` | `uuid` | NO | PK canonica ✓ |
| `orcamento_itens` | `orcamento_id` | `uuid` | NO | FK para orcamentos ✓ |
| `propostas` | `orcamento_id` | `uuid` | YES | Campo para vinculo futuro ✓ |

## 6. Integridade de FKs e Indices

- **FK `orcamento_itens_orcamento_id_fkey`**: Confirmada apontando para `orcamentos(id)`.
- **Indice `idx_orcamentos_obra_id`**: Confirmado.
- **Indice `idx_orcamento_itens_orcamento_id`**: Confirmado.
- **Indices Oportunidades**: Confirmados (`idx_opportunities_status`, `idx_opportunity_files_opportunity_id`, etc).

## 7. Auditoria de RLS e Policies

Query executada: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' ORDER BY tablename`

Estado real retornado:

| Tabela | RLS (rowsecurity) |
|--------|------------------|
| `_schema_version` | false |
| `alias_conhecimento` | false |
| `contacts` | false |
| `diario_obra` | false |
| `equipes_cadastro` | false |
| `equipes_presenca` | false |
| `fotos` | false |
| `notas` | false |
| `obras` | false |
| `opportunities` | false |
| `opportunity_events` | false |
| `opportunity_files` | false |
| `orcamento_itens` | false |
| `orcamentos` | false |
| `pendencias` | false |
| `propostas` | **true** |
| `servicos` | false |

- **RLS**: Habilitado somente em `propostas` (script `08_CREATE_PROPOSTAS_MVP.sql` executa `ALTER TABLE propostas ENABLE ROW LEVEL SECURITY`). As demais 16 tabelas tem `rowsecurity = false`.
- **Policies Detectadas**: `propostas_open_access` em `public.propostas` (cmd=ALL). Nenhuma policy nas demais tabelas.
- **Status 07_RLS**: Script bloqueado conforme instrucao; nenhuma policy de RLS para Oportunidades foi criada.
- **Impacto para 4B.1**: Aceitavel. O migration candidate sera executado via service_role (Management API), que bypassa RLS. As 9 tabelas pipeline tambem nao terao RLS habilitado na execucao inicial — consistente com o padrao atual do baseline.

## 8. Extensoes e UUID

- **`pgcrypto`**: Instalado e disponivel ✓
- **`gen_random_uuid()`**: Funcional e testado (via PKs do baseline) ✓

## 9. Divergencias Encontradas

| # | Item | Esperado no relatorio original | Real (query executada) | Impacto |
|---|------|-------------------------------|------------------------|---------|
| 1 | Versao PostgreSQL | "PostgreSQL 15+" | PostgreSQL 17.6 (aarch64) | Sem impacto — gen_random_uuid() funcional em ambas as versoes |
| 2 | RLS nas tabelas do baseline | "Habilitado em todas as tabelas" | Apenas `propostas` com `rowsecurity=true`; demais 16 tabelas com `rowsecurity=false` | Sem impacto para 4B.1 — execucao via service_role bypassa RLS |

Nenhuma divergencia bloqueia a execucao da 4B.1.

## 10. Decisao Objetiva

> [!IMPORTANT]
> **STAGING PRONTO PARA 4B.1**
> O ambiente `vtlepoljlqmjwuauygni` possui todas as ancoras necessarias para a persistencia do Orçamentista IA.

---
**Bloqueio**: 4B.1 ainda nao foi executada. Este relatorio encerra a preparacao do ambiente.
