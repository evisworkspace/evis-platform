# EVIS - Supabase Staging Baseline Schema Plan

> Fase: 4B.S4.P  
> Tipo: plano documental para aplicacao futura do schema base no staging  
> Status: plano criado; sem SQL executado; sem migration aplicada; sem banco alterado  
> Staging permitido: `vtlepoljlqmjwuauygni`  
> Producao bloqueada: `jwutiebpfauwzzltwgbb`

## 1. Objetivo

Preparar, sem executar, uma ordem segura para aplicar o schema base minimo no Supabase staging antes da migration candidate Reader / Verifier / HITL.

A Fase 4B.S3 confirmou que o staging existe, esta vazio, usa PostgreSQL 17.6, possui `pgcrypto` e `gen_random_uuid()` funcionais, e nao possui as 9 tabelas pipeline. O bloqueio atual e a ausencia do schema base operacional exigido pelas FKs do candidate.

Esta fase nao executa SQL, nao aplica migration, nao altera banco, nao altera codigo/UI e nao avanca para 4B.1.

## 2. Ambiente alvo permitido

Unico alvo permitido para execucao futura controlada:

```text
vtlepoljlqmjwuauygni
```

Regras:

- usar apenas variaveis locais de staging;
- confirmar o ref antes de qualquer execucao futura;
- registrar qualquer resultado futuro como staging;
- nunca misturar URL/key/ref de producao com staging.

## 3. Ambiente bloqueado

Ref de producao/ambiente real:

```text
jwutiebpfauwzzltwgbb
```

Esse ref permanece bloqueado para qualquer execucao desta linha 4B.S4/4B.1. Nenhum script de baseline, preflight de liberacao ou migration candidate deve ser executado contra ele.

## 4. Arquivos e scripts lidos

Documentos de contexto:

- `platform/docs/EVIS_SUPABASE_STAGING_PREFLIGHT_4BS3.md`
- `platform/docs/EVIS_SUPABASE_STAGING_ENVIRONMENT_SETUP.md`
- `platform/docs/EVIS_SUPABASE_STAGING_SANDBOX_SETUP_PLAN.md`
- `platform/docs/SCHEMA_GAP_REPORT.md`
- `platform/docs/EVIS_REAL_SCHEMA_READONLY_INTROSPECTION_REPORT.md`

Scripts SQL principais:

- `docs/SCHEMA_OFICIAL_V1.sql`
- `docs/06_CREATE_OPPORTUNITIES_MVP.sql`
- `docs/08_CREATE_PROPOSTAS_MVP.sql`
- `docs/07_RLS_OPPORTUNITIES_MVP.sql`
- `platform/docs/sql_proposals/ORCAMENTISTA_001_ORCAMENTOS_OBRA_ID_NULLABLE.sql`

Scripts SQL auxiliares/localizados na busca:

- `schema-completo.sql`
- `schema-discovery.sql`
- `DIAGNOSTICO_SCHEMA.sql`
- `platform/docs/sql/schema-completo.sql`
- `platform/docs/ops/DDL_CATALOGO_RESIDENCIAL_EVIS.sql`
- `docs/05_FIX_SUPABASE_WARNINGS.sql`

## 5. Tabelas esperadas por script

| Script | Tabelas criadas | Observacao |
|--------|-----------------|------------|
| `docs/SCHEMA_OFICIAL_V1.sql` | `obras`, `servicos`, `equipes_cadastro`, `equipes_presenca`, `diario_obra`, `notas`, `pendencias`, `fotos`, `alias_conhecimento`, `_schema_version` | Base de Obra. Inclui mais tabelas do que o minimo, mas fornece `obras` e `diario_obra`. |
| `docs/06_CREATE_OPPORTUNITIES_MVP.sql` | `contacts`, `opportunities`, `opportunity_events`, `opportunity_files` | Cria `opportunity_files` canonico. Depende de `obras`. |
| `docs/08_CREATE_PROPOSTAS_MVP.sql` | `propostas` | Depende de `opportunities`. Habilita RLS e cria policy aberta MVP. |
| `docs/07_RLS_OPPORTUNITIES_MVP.sql` | nenhuma tabela | Cria policies para `contacts`, `opportunities`, `opportunity_events`, `opportunity_files`; nao habilita RLS. |
| `platform/docs/sql_proposals/ORCAMENTISTA_001_ORCAMENTOS_OBRA_ID_NULLABLE.sql` | nenhuma tabela | ALTER proposto para `orcamentos.obra_id`; nao serve como CREATE baseline. |
| `platform/docs/ops/DDL_CATALOGO_RESIDENCIAL_EVIS.sql` | catalogo/referencias e `snapshot_orcamento_itens` | Nao cria `orcamentos` nem `orcamento_itens`; fora do baseline minimo 4B.S4. |

## 6. Dependencias entre scripts

Dependencias confirmadas:

- `docs/06_CREATE_OPPORTUNITIES_MVP.sql` depende de `public.obras(id)` por FK em `opportunities.obra_id`.
- `docs/08_CREATE_PROPOSTAS_MVP.sql` depende de `public.opportunities(id)` por FK em `propostas.opportunity_id`.
- `docs/07_RLS_OPPORTUNITIES_MVP.sql` depende das tabelas criadas por `docs/06_CREATE_OPPORTUNITIES_MVP.sql`.
- `platform/docs/sql_proposals/ORCAMENTISTA_001_ORCAMENTOS_OBRA_ID_NULLABLE.sql` depende de `public.orcamentos` ja existir.
- `orcamento_itens` deve depender de `orcamentos(id)`.
- O migration candidate Reader / Verifier / HITL depende de `opportunities(id)`, `orcamentos(id)` e `opportunity_files(id)`.

Extensoes/funcoes necessarias:

- `gen_random_uuid()` e exigido pelos scripts principais.
- A 4B.S3 confirmou `pgcrypto` instalado e `gen_random_uuid()` funcional no staging.
- Nenhum script principal contem `CREATE EXTENSION`; isso e aceitavel para o staging atual, mas deve ser rechecado antes da execucao real.

## 7. Auditoria dos scripts principais

### 7.1 `docs/SCHEMA_OFICIAL_V1.sql`

Classificacao: apto para execucao controlada em staging, com aprovacao humana.

Achados:

- usa `CREATE TABLE IF NOT EXISTS`;
- usa `CREATE INDEX IF NOT EXISTS`;
- nao possui `DROP TABLE`;
- nao possui `UPDATE` ou `DELETE`;
- possui `INSERT INTO public._schema_version ... ON CONFLICT DO NOTHING`;
- possui comentarios de RLS, mas nao executa `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`;
- depende de `gen_random_uuid()`;
- cria tabelas adicionais alem do minimo exigido, mas isso e coerente com a base operacional de Obra.

### 7.2 `docs/06_CREATE_OPPORTUNITIES_MVP.sql`

Classificacao: apto para execucao controlada em staging depois de `docs/SCHEMA_OFICIAL_V1.sql`.

Achados:

- usa `BEGIN` / `COMMIT`;
- usa `CREATE TABLE IF NOT EXISTS`;
- usa `CREATE INDEX IF NOT EXISTS`;
- cria `opportunity_files` canonicamente;
- nao possui `INSERT`, `UPDATE`, `DELETE`, `DROP TABLE` ou `ALTER TABLE`;
- nao cria RLS/policies;
- falha se `public.obras` nao existir antes.

### 7.3 `docs/08_CREATE_PROPOSTAS_MVP.sql`

Classificacao: apto para execucao controlada em staging depois de `docs/06_CREATE_OPPORTUNITIES_MVP.sql`, com atencao a RLS aberta MVP.

Achados:

- usa `BEGIN` / `COMMIT`;
- usa `CREATE TABLE IF NOT EXISTS`;
- usa `CREATE INDEX IF NOT EXISTS`;
- habilita RLS em `public.propostas`;
- executa `DROP POLICY IF EXISTS propostas_open_access`;
- cria policy aberta `USING (true)` / `WITH CHECK (true)` para MVP;
- nao possui `DROP TABLE`, `UPDATE` ou `DELETE`;
- depende de `public.opportunities`.

### 7.4 `docs/07_RLS_OPPORTUNITIES_MVP.sql`

Classificacao: precisa de revisao antes de execucao.

Achados:

- usa `BEGIN` / `COMMIT`;
- nao cria tabelas;
- executa varios `DROP POLICY IF EXISTS`;
- cria policies abertas MVP para `contacts`, `opportunities`, `opportunity_events`, `opportunity_files`;
- nao executa `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`;
- depende das tabelas de Oportunidades ja existirem;
- pode ser util depois de `docs/06_CREATE_OPPORTUNITIES_MVP.sql`, mas nao e suficiente para igualar o baseline real se RLS precisar estar habilitado.

### 7.5 `platform/docs/sql_proposals/ORCAMENTISTA_001_ORCAMENTOS_OBRA_ID_NULLABLE.sql`

Classificacao: bloqueado para baseline vazio.

Achados:

- nao cria `orcamentos`;
- nao cria `orcamento_itens`;
- contem SELECTs de pre-check;
- contem `ALTER TABLE public.orcamentos ALTER COLUMN obra_id DROP NOT NULL`;
- contem rollback comentado para `ALTER COLUMN obra_id SET NOT NULL`;
- depende de `public.orcamentos` existir;
- nao deve ser usado no staging vazio como script de baseline.

### 7.6 Scripts auxiliares

Classificacao geral: bloqueados para a 4B.S4 baseline minima.

Achados:

- `schema-completo.sql`, `schema-discovery.sql` e `DIAGNOSTICO_SCHEMA.sql` sao scripts de introspeccao/leitura, nao criam baseline.
- `docs/05_FIX_SUPABASE_WARNINGS.sql` faz alteracoes amplas de RLS/policies, inclusive `DROP POLICY` em muitas tabelas; nao e baseline minimo.
- `platform/docs/ops/DDL_CATALOGO_RESIDENCIAL_EVIS.sql` cria catalogo e `snapshot_orcamento_itens`, mas nao cria `orcamentos` nem `orcamento_itens`.

## 8. Presenca de CREATE TABLE especificos

| Tabela | CREATE TABLE canonico encontrado? | Fonte |
|--------|-----------------------------------|-------|
| `opportunity_files` | SIM | `docs/06_CREATE_OPPORTUNITIES_MVP.sql` |
| `orcamentos` | NAO | Ausente nos SQLs auditados |
| `orcamento_itens` | NAO | Ausente nos SQLs auditados |

Observacao: `snapshot_orcamento_itens` existe em script de catalogo, mas nao substitui `orcamento_itens`.

## 9. Ordem proposta de execucao futura no staging

Ordem recomendada, somente apos aprovacao humana explicita e confirmacao do alvo `vtlepoljlqmjwuauygni`:

1. Confirmar novamente que o alvo e `vtlepoljlqmjwuauygni` e nao `jwutiebpfauwzzltwgbb`.
2. Confirmar `pgcrypto` / `gen_random_uuid()` no staging.
3. Executar `docs/SCHEMA_OFICIAL_V1.sql`.
4. Executar `docs/06_CREATE_OPPORTUNITIES_MVP.sql`.
5. Criar/revisar um novo script baseline para `orcamentos` e `orcamento_itens`.
6. Executar o script baseline revisado de `orcamentos` e `orcamento_itens`.
7. Executar `docs/08_CREATE_PROPOSTAS_MVP.sql`.
8. Revisar estrategia de RLS para `contacts`, `opportunities`, `opportunity_events` e `opportunity_files`.
9. Somente se aprovado, executar script de RLS revisado para Oportunidades.
10. Reexecutar preflight read-only no staging para confirmar tabelas, FKs, RLS/policies, tipos e ausencia das 9 tabelas pipeline.

Nota: a etapa 5 e bloqueadora. Sem ela, o baseline minimo continua incompleto e a migration candidate falhara nas FKs para `orcamentos(id)`.

## 10. Separacao por status

### Aptos para execucao controlada em staging

- `docs/SCHEMA_OFICIAL_V1.sql`
- `docs/06_CREATE_OPPORTUNITIES_MVP.sql`
- `docs/08_CREATE_PROPOSTAS_MVP.sql`

Condicoes:

- executar somente no staging `vtlepoljlqmjwuauygni`;
- manter producao bloqueada;
- executar na ordem proposta;
- revalidar apos execucao.

### Precisam de revisao

- `docs/07_RLS_OPPORTUNITIES_MVP.sql`

Motivo:

- cria policies abertas, mas nao habilita RLS;
- precisa ser reconciliado com o baseline esperado da 4B.S3 e com a decisao de auth/tenant futura.

### Bloqueados

- `platform/docs/sql_proposals/ORCAMENTISTA_001_ORCAMENTOS_OBRA_ID_NULLABLE.sql`
- `docs/05_FIX_SUPABASE_WARNINGS.sql`
- `platform/docs/ops/DDL_CATALOGO_RESIDENCIAL_EVIS.sql`
- `LIMPAR_BANCO.sql` e equivalentes
- scripts de seed/catalogo/alias com `INSERT`, `UPDATE` ou `DELETE`

Motivos:

- nao compoem o baseline minimo da 4B.S4;
- alguns fazem alteracoes amplas de policies;
- alguns pressupõem tabelas ou dados existentes;
- alguns sao destrutivos ou de seed, nao de baseline estrutural.

### Inexistentes / pendentes de criacao

- script `CREATE TABLE` canonico para `orcamentos`;
- script `CREATE TABLE` canonico para `orcamento_itens`;
- script de RLS baseline coerente para `orcamentos` e `orcamento_itens`, se necessario para igualar o MVP real.

## 11. Riscos encontrados

- Ausencia de `CREATE TABLE` canonico para `orcamentos` e `orcamento_itens`.
- `docs/SCHEMA_OFICIAL_V1.sql` cria apenas parte do schema real simplificado; o real possui campos extras em `obras`.
- `docs/07_RLS_OPPORTUNITIES_MVP.sql` cria policies, mas nao habilita RLS.
- `docs/08_CREATE_PROPOSTAS_MVP.sql` cria policy aberta `USING (true)`, aceitavel para MVP/staging, mas deve ser registrado como baseline temporario.
- `ORCAMENTISTA_001` e ALTER de banco existente, nao script de criacao para staging vazio.
- Scripts de catalogo e fix de warnings podem alterar muitas policies ou criar tabelas fora do escopo minimo.

## 12. Pendencias

Antes de executar a 4B.S4 real:

- criar um script baseline revisado para `orcamentos`;
- criar um script baseline revisado para `orcamento_itens`;
- garantir `orcamentos.obra_id text NULL`, sem FK obrigatoria para `obras`;
- garantir `orcamentos.id uuid PRIMARY KEY DEFAULT gen_random_uuid()`;
- garantir `orcamento_itens.orcamento_id uuid NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE`;
- criar indice em `orcamento_itens(orcamento_id)`;
- avaliar se criar indice em `orcamentos(obra_id)`;
- decidir RLS/policies de `orcamentos` e `orcamento_itens` para staging;
- decidir se `docs/07_RLS_OPPORTUNITIES_MVP.sql` deve ser revisado para habilitar RLS explicitamente.

## 13. Criterios para autorizar execucao real da 4B.S4

Autorizar a 4B.S4 real somente se todos os criterios abaixo forem atendidos:

- confirmacao humana explicita do alvo `vtlepoljlqmjwuauygni`;
- confirmacao de que `jwutiebpfauwzzltwgbb` nao sera usado;
- comando ou ferramenta de execucao revisado antes de rodar;
- ordem de execucao aprovada;
- script de `orcamentos` criado e revisado;
- script de `orcamento_itens` criado e revisado;
- decisao de RLS/policies documentada;
- plano de validacao read-only pos-execucao preparado;
- plano de rollback para staging preparado;
- nenhum secret exposto em documento ou chat.

## 14. Criterios para manter 4B.S4 bloqueada

Manter 4B.S4 bloqueada se qualquer item ocorrer:

- alvo nao confirmado ou diferente de `vtlepoljlqmjwuauygni`;
- qualquer risco de usar `jwutiebpfauwzzltwgbb`;
- ausencia do script de `orcamentos`;
- ausencia do script de `orcamento_itens`;
- tentativa de usar `ORCAMENTISTA_001` como CREATE baseline;
- tentativa de aplicar 4B.1 antes do baseline;
- tentativa de rodar scripts destrutivos ou amplos (`LIMPAR_BANCO`, `05_FIX_SUPABASE_WARNINGS`) como parte do baseline;
- ausencia de plano de validacao read-only apos execucao;
- secrets expostos.

## 15. Decisao objetiva

Decisao: **precisa corrigir/criar scripts antes da execucao real da 4B.S4**.

Justificativa:

- os scripts de Obra, Oportunidades e Propostas podem ser preparados para execucao controlada em staging;
- porem o baseline minimo continua incompleto sem `CREATE TABLE` canonico para `orcamentos` e `orcamento_itens`;
- sem essas tabelas, a migration candidate Reader / Verifier / HITL continuara falhando nas FKs para `orcamentos(id)`;
- portanto, nao avancar para execucao real ate criar e revisar o script baseline dessas duas tabelas.

## 16. Confirmacoes da 4B.S4.P

- nenhum SQL executado;
- nenhuma migration aplicada;
- nenhum banco alterado;
- nenhum Supabase remoto alterado;
- producao `jwutiebpfauwzzltwgbb` nao foi usada;
- staging `vtlepoljlqmjwuauygni` foi tratado apenas como alvo documental permitido;
- nenhum dado alterado;
- nenhum codigo operacional/UI alterado;
- nenhuma rota criada;
- nenhum hook criado;
- nenhum secret documentado;
- nenhum commit realizado;
- 4B.1 permanece bloqueada.
