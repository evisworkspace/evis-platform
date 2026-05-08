# EVIS - Orcamentos Baseline Schema Draft

> Fase: 4B.S4.O  
> Tipo: draft documental de SQL para baseline futuro de staging  
> Status: SQL draft criado; sem SQL executado; sem migration aplicada; sem banco alterado  
> Staging permitido para execucao futura revisada: `vtlepoljlqmjwuauygni`  
> Producao bloqueada: `jwutiebpfauwzzltwgbb`

## 1. Objetivo

Criar, sem executar, um SQL draft canonico, minimo e auditavel para as tabelas:

- `public.orcamentos`
- `public.orcamento_itens`

O draft existe para destravar revisao humana da 4B.S4.O.R e preparar uma execucao futura controlada somente no staging. Esta fase nao aplica SQL, nao altera banco, nao altera `.env`, nao altera codigo/UI e nao avanca para 4B.S4.E.

## 2. Arquivos lidos

Arquivos solicitados:

- `platform/docs/EVIS_SUPABASE_STAGING_BASELINE_SCHEMA_PLAN_4BS4P.md`
- `platform/docs/EVIS_SUPABASE_STAGING_PREFLIGHT_4BS3.md`
- `platform/docs/EVIS_REAL_SCHEMA_READONLY_INTROSPECTION_REPORT.md`
- `platform/docs/SCHEMA_GAP_REPORT.md`
- `docs/06_CREATE_OPPORTUNITIES_MVP.sql`
- `docs/08_CREATE_PROPOSTAS_MVP.sql`
- `docs/SCHEMA_OFICIAL_V1.sql`
- `platform/docs/sql_proposals/ORCAMENTISTA_001_ORCAMENTOS_OBRA_ID_NULLABLE.sql`

Arquivos adicionais lidos por busca/referencia:

- `platform/docs/EVIS_SUPABASE_STAGING_SANDBOX_SETUP_PLAN.md`
- `platform/docs/CODING_STANDARDS.md`
- `platform/docs/EVIS_ARCHITECTURE_PREFLIGHT_AUDIT.md`
- `orcamentista/docs/EVIS_ORCAMENTISTA_DATA_MODEL.md`
- `src/types.ts`
- `src/hooks/useOrcamento.ts`
- `src/hooks/useOportunidadeOrcamento.ts`

Busca executada localmente:

- `CREATE TABLE ... orcamentos`
- `CREATE TABLE ... orcamento_itens`
- `orcamentos`
- `orcamento_itens`

Resultado da busca: nao foi encontrado `CREATE TABLE` canonico existente para `orcamentos` ou `orcamento_itens`. Foram encontradas referencias de codigo, docs, introspeccao, `ORCAMENTISTA_001` como ALTER/precheck, e `snapshot_orcamento_itens`, que nao substitui `orcamento_itens`.

## 3. Origem das decisoes de schema

### 3.1 Schema real introspectado

Fonte principal: `platform/docs/EVIS_REAL_SCHEMA_READONLY_INTROSPECTION_REPORT.md`.

Decisoes absorvidas:

- `orcamentos.id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `orcamentos.obra_id text NULL`
- `orcamentos.obra_id` sem FK para `obras.id`
- `orcamentos.nome text NOT NULL`
- `orcamentos.status text NOT NULL DEFAULT 'rascunho'`
- `orcamentos.bdi numeric NOT NULL DEFAULT 25`
- `orcamentos.total_bruto numeric NOT NULL DEFAULT 0`
- `orcamentos.total_final numeric NOT NULL DEFAULT 0`
- `orcamento_itens.id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `orcamento_itens.orcamento_id uuid NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE`
- campo correto em itens e `codigo`, nao `codigo_referencia`
- indices reais: `idx_orcamentos_obra_id` e `idx_orcamento_itens_orcamento_id`

### 3.2 Scripts antigos e docs existentes

`ORCAMENTISTA_001_ORCAMENTOS_OBRA_ID_NULLABLE.sql` foi tratado como referencia de decisao de dominio, nao como baseline:

- confirma que `obra_id` deve aceitar `NULL`;
- confirma que orcamentos de Oportunidade nao devem usar `obra_id = opp_<id>`;
- nao cria `orcamentos`;
- nao cria `orcamento_itens`;
- contem `ALTER TABLE`, prechecks e rollback, portanto fica fora do baseline vazio.

`docs/06_CREATE_OPPORTUNITIES_MVP.sql` e `docs/08_CREATE_PROPOSTAS_MVP.sql` confirmam que:

- `opportunities.orcamento_id` existe como uuid avulso sem FK formal;
- `propostas.orcamento_id` existe como uuid avulso sem FK formal;
- o baseline de `orcamentos` nao deve tentar alterar essas tabelas nesta fase.

### 3.3 Necessario para staging baseline

Necessario para o staging minimo:

- criar `orcamentos`;
- criar `orcamento_itens`;
- garantir `orcamentos.id` como alvo uuid compativel para as FKs futuras do candidate Reader / Verifier / HITL;
- garantir FK de itens para orcamentos;
- garantir indice em `orcamentos(obra_id)`;
- garantir indice em `orcamento_itens(orcamento_id)`;
- manter `obra_id text NULL` para permitir orcamento de oportunidade antes de existir Obra.

### 3.4 Fora do escopo para evitar excesso de camada

Ficou fora do draft:

- tabelas de versao, arquivos, leituras, agentes, ambientes, servicos e custos do modelo conceitual expandido;
- `snapshot_orcamento_itens`;
- catalogo/SINAPI/seeds;
- `opportunity_id` em `orcamentos`;
- FKs novas em `opportunities.orcamento_id` ou `propostas.orcamento_id`;
- triggers de `updated_at`;
- constraints adicionais de status/origem nao confirmadas na introspeccao;
- RLS/policies abertas;
- qualquer `DROP`, `TRUNCATE`, `INSERT`, `UPDATE`, `DELETE` ou dado de teste.

## 4. Arquivo SQL criado

Arquivo criado:

- `platform/docs/sql_proposals/ORCAMENTISTA_002_BASELINE_ORCAMENTOS_ORCAMENTO_ITENS.sql`

Status do arquivo:

- draft de revisao;
- nao executado;
- nao e migration aprovada;
- requer revisao humana antes de qualquer uso;
- permitido somente para staging `vtlepoljlqmjwuauygni` em fase futura.

## 5. Tabelas propostas

### 5.1 `public.orcamentos`

Tabela de cabecalho do orcamento oficial/manual usado por Obra e por Oportunidade.

Colunas propostas:

| Coluna | Tipo | Nullable | Default | Motivo |
|--------|------|----------|---------|--------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK e alvo das FKs do pipeline |
| `obra_id` | `text` | YES | - | Compatibilidade real; orcamento de oportunidade fica sem obra |
| `nome` | `text` | NO | - | Nome legivel do orcamento |
| `cliente` | `text` | YES | - | Snapshot simples do cliente |
| `status` | `text` | NO | `'rascunho'` | Estado inicial atual |
| `bdi` | `numeric` | NO | `25` | Default real introspectado |
| `total_bruto` | `numeric` | NO | `0` | Total antes do BDI |
| `total_final` | `numeric` | NO | `0` | Total final do orcamento |
| `observacoes` | `text` | YES | - | Observacoes livres |
| `created_at` | `timestamptz` | YES | `now()` | Data de criacao |
| `updated_at` | `timestamptz` | YES | `now()` | Data de atualizacao |

### 5.2 `public.orcamento_itens`

Tabela de itens oficiais/manuais do orcamento.

Colunas propostas:

| Coluna | Tipo | Nullable | Default | Motivo |
|--------|------|----------|---------|--------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `orcamento_id` | `uuid` | NO | - | FK obrigatoria para `orcamentos.id` |
| `codigo` | `text` | YES | - | Codigo opcional; nome real confirmado |
| `descricao` | `text` | NO | - | Descricao do item |
| `unidade` | `text` | NO | `'un'` | Unidade padrao |
| `quantidade` | `numeric` | NO | `1` | Quantidade padrao |
| `valor_unitario` | `numeric` | NO | `0` | Preco unitario |
| `valor_total` | `numeric` | NO | `0` | Total do item |
| `origem` | `text` | NO | `'manual'` | Origem atual dos itens oficiais |
| `created_at` | `timestamptz` | YES | `now()` | Data de criacao |

## 6. FKs propostas

| Tabela | Coluna | Referencia | Delete rule | Justificativa |
|--------|--------|------------|-------------|---------------|
| `orcamento_itens` | `orcamento_id` | `public.orcamentos(id)` | `ON DELETE CASCADE` | Igual ao schema real introspectado; itens pertencem ao orcamento |

Ausencias intencionais:

- sem FK de `orcamentos.obra_id` para `obras.id`, porque `obra_id` real e `text NULL`;
- sem FK de `opportunities.orcamento_id` para `orcamentos.id`, porque a tabela `opportunities` nao e escopo desta fase;
- sem FK de `propostas.orcamento_id` para `orcamentos.id`, porque a tabela `propostas` nao e escopo desta fase;
- sem FK para `orcamento_itens` a partir das tabelas Reader / Verifier / HITL.

## 7. Indices propostos

| Indice | Tabela | Coluna | Motivo |
|--------|--------|--------|--------|
| `idx_orcamentos_obra_id` | `orcamentos` | `obra_id` | Fluxo legado de Obra consulta por `obra_id` |
| `idx_orcamento_itens_orcamento_id` | `orcamento_itens` | `orcamento_id` | Listagem de itens por orcamento e suporte a FK |

## 8. RLS e policies

Decisao desta fase: **deixar RLS/policies para fase posterior de revisao**, sem SQL executavel no draft.

Justificativa:

- a fase 4B.S4.O pediu um baseline minimo das duas tabelas;
- o real possui RLS habilitado com policies abertas MVP (`USING (true)`), mas reproduzir isso automaticamente ampliaria superficie de acesso;
- `CREATE POLICY` nao tem o mesmo padrao simples de idempotencia usado por `CREATE TABLE IF NOT EXISTS` e `CREATE INDEX IF NOT EXISTS`;
- `DROP POLICY` foi explicitamente evitado no escopo desta fase;
- a decisao de auth/tenant/company continua pendente;
- para o objetivo imediato da migration candidate Reader / Verifier / HITL, o requisito critico e a existencia de `orcamentos(id)` como uuid PK.

Pendencia: criar fase posterior especifica para RLS baseline de `orcamentos` e `orcamento_itens`, alinhada com a decisao de Oportunidades/Propostas e sem expor producao.

## 9. Compatibilidade

Compatibilidade com `opportunities`:

- o draft nao altera `opportunities`;
- `opportunities.orcamento_id` pode continuar apontando logicamente para `orcamentos.id`;
- nenhuma FK formal nova e criada nesta fase.

Compatibilidade com `propostas`:

- o draft nao altera `propostas`;
- `propostas.orcamento_id` pode continuar como uuid avulso;
- a geracao de proposta pode consultar `orcamento_itens` via `orcamento_id`.

Compatibilidade com o candidate Reader / Verifier / HITL:

- `orcamentos.id` passa a existir como `uuid PRIMARY KEY DEFAULT gen_random_uuid()`;
- o candidate pode criar FKs para `public.orcamentos(id)`;
- nenhuma FK para `orcamento_itens` e adicionada;
- nenhuma escrita automatica em `orcamento_itens` e introduzida.

## 10. Riscos

- O draft replica o formato real minimo, mas nao substitui uma introspeccao pos-execucao no staging.
- RLS/policies ficam pendentes; se o draft for executado isoladamente, comportamento de acesso via API precisa ser validado antes de qualquer uso aplicativo.
- `updated_at` tem default, mas nao ha trigger para atualizacao automatica; o codigo atual atualiza manualmente em alguns fluxos.
- `status` e `origem` ficam como `text` sem check constraint para evitar divergencia com o real; isso permite valores fora do contrato TypeScript se a aplicacao nao validar.
- `ON DELETE CASCADE` em `orcamento_itens` segue o real, mas deve ser entendido antes de qualquer delete de orcamento.
- `obra_id text NULL` preserva compatibilidade, mas exige disciplina operacional para nunca usar `obra_id = opp_<id>`.
- Sem FK formal de `opportunities.orcamento_id` e `propostas.orcamento_id`, a integridade desses vinculos permanece responsabilidade da aplicacao nesta fase.

## 11. Pendencias

Antes de qualquer execucao real da 4B.S4.E:

- revisao humana do SQL `ORCAMENTISTA_002`;
- confirmacao explicita do alvo `vtlepoljlqmjwuauygni`;
- confirmacao de que `jwutiebpfauwzzltwgbb` nao sera usado;
- revalidar `pgcrypto` e `gen_random_uuid()` no staging;
- revisar se `bdi` default deve ser `25` ou `0` para orcamentos de oportunidade;
- decidir RLS/policies de `orcamentos` e `orcamento_itens`;
- preparar validacao read-only pos-execucao;
- preparar rollback/teste de rollback em staging;
- confirmar ordem de execucao com `SCHEMA_OFICIAL_V1`, `06_CREATE_OPPORTUNITIES_MVP` e `08_CREATE_PROPOSTAS_MVP`;
- manter 4B.1 bloqueada ate o baseline completo ser aplicado e validado no staging.

## 12. Decisao objetiva

Decisao: **pronto para revisao SQL 4B.S4.O.R; bloqueado para execucao**.

Justificativa:

- o SQL draft minimo foi criado;
- nao ha `CREATE TABLE` canonico concorrente no repositorio;
- o draft segue o schema real introspectado e o plano 4B.S4.P;
- ainda falta revisao humana, decisao de RLS/policies, plano de validacao pos-execucao e aprovacao explicita antes de qualquer aplicacao no staging.

## 13. Confirmacoes da 4B.S4.O

- nenhum SQL executado;
- nenhuma migration aplicada;
- nenhum banco alterado;
- nenhum Supabase remoto alterado;
- producao `jwutiebpfauwzzltwgbb` nao foi usada;
- staging `vtlepoljlqmjwuauygni` foi usado apenas como referencia documental permitida;
- nenhum dado alterado;
- nenhum codigo operacional/UI alterado;
- nenhum `.env` alterado;
- nenhum secret documentado;
- nenhum commit realizado;
- 4B.S4.E permanece bloqueada;
- 4B.1 permanece bloqueada.
