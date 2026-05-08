# EVIS - Orcamentos Baseline Schema Review — Fase 4B.S4.O.R

> Fase: 4B.S4.O.R  
> Tipo: revisao documental do SQL draft de baseline  
> Status: revisao concluida; SQL aprovado para commit documental; sem SQL executado; sem banco alterado  
> Staging permitido para execucao futura: `vtlepoljlqmjwuauygni`  
> Producao bloqueada: `jwutiebpfauwzzltwgbb`

## 1. Objetivo

Auditar o SQL draft canonico minimo para `orcamentos` e `orcamento_itens` criado na Fase 4B.S4.O antes de qualquer commit ou execucao, verificando:

- ausencia de comandos proibidos;
- fidelidade ao schema real introspectado em 4A.4;
- compatibilidade com tipos TypeScript (`src/types.ts`);
- compatibilidade com hooks existentes (`useOrcamento.ts`, `useOportunidadeOrcamento.ts`);
- compatibilidade com baseline futuro de staging;
- compatibilidade com futura migration candidate Reader/Verifier/HITL;
- decisoes de RLS/policies;
- riscos remanescentes.

## 2. Arquivos Lidos

- `platform/docs/sql_proposals/ORCAMENTISTA_002_BASELINE_ORCAMENTOS_ORCAMENTO_ITENS.sql`
- `platform/docs/EVIS_ORCAMENTOS_BASELINE_SCHEMA_DRAFT_4BS4O.md`
- `platform/docs/EVIS_SUPABASE_STAGING_BASELINE_SCHEMA_PLAN_4BS4P.md`
- `platform/docs/EVIS_REAL_SCHEMA_READONLY_INTROSPECTION_REPORT.md`
- `docs/06_CREATE_OPPORTUNITIES_MVP.sql`
- `src/types.ts`
- `src/hooks/useOrcamento.ts`
- `src/hooks/useOportunidadeOrcamento.ts`

Arquivos referenciados via contexto (nao relidos):

- `platform/docs/EVIS_SUPABASE_STAGING_PREFLIGHT_4BS3.md`
- `platform/docs/SCHEMA_GAP_REPORT.md`
- `docs/08_CREATE_PROPOSTAS_MVP.sql`
- `platform/docs/sql_proposals/ORCAMENTISTA_001_ORCAMENTOS_OBRA_ID_NULLABLE.sql`

## 3. Comandos Proibidos

Busca executada por:

```
grep -nE "DROP|TRUNCATE|DELETE|UPDATE|INSERT|ALTER"
```

Resultado:

| Linha | Conteudo | Classificacao |
|-------|----------|---------------|
| 21 | `-- Nao inclui seed, dados de teste, DROP, TRUNCATE, RLS ou policies.` | Comentario — inofensivo |
| 36 | `-- com ON DELETE CASCADE, conforme schema real introspectado.` | Comentario — inofensivo |
| 66 | `orcamento_id uuid NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE` | Clausula FK dentro de CREATE TABLE — inofensivo |

**Conclusao: nenhum comando DROP, TRUNCATE, DELETE, UPDATE, INSERT ou ALTER real encontrado no SQL.** ✓

## 4. Estrutura do SQL Draft

O SQL draft contem exclusivamente:

- `BEGIN` (abertura de transacao)
- `CREATE TABLE IF NOT EXISTS public.orcamentos`
- `CREATE TABLE IF NOT EXISTS public.orcamento_itens`
- `CREATE INDEX IF NOT EXISTS idx_orcamentos_obra_id`
- `CREATE INDEX IF NOT EXISTS idx_orcamento_itens_orcamento_id`
- `COMMIT` (fechamento de transacao)
- Cabecalho documental com comentarios de fonte, decisoes e bloqueios

Nenhuma escrita em tabelas fora de `orcamentos` e `orcamento_itens`. ✓  
Nenhuma referencia a tabelas externas em SQL executavel (somente nos comentarios de cabecalho). ✓

## 5. Validacao por Tabela

### 5.1 `public.orcamentos`

Comparacao coluna a coluna com o schema real introspectado em 4A.4:

| Coluna | Draft | Real (4A.4) | Compativel |
|--------|-------|-------------|------------|
| `id` | `uuid PRIMARY KEY DEFAULT gen_random_uuid()` | `uuid NOT NULL DEFAULT gen_random_uuid()` | SIM ✓ |
| `obra_id` | `text NULL` | `text NULL` | SIM ✓ |
| `nome` | `text NOT NULL` | `text NOT NULL` | SIM ✓ |
| `cliente` | `text NULL` | `text NULL` | SIM ✓ |
| `status` | `text NOT NULL DEFAULT 'rascunho'` | `text NOT NULL DEFAULT 'rascunho'` | SIM ✓ |
| `bdi` | `numeric NOT NULL DEFAULT 25` | `numeric NOT NULL DEFAULT 25` | SIM ✓ |
| `total_bruto` | `numeric NOT NULL DEFAULT 0` | `numeric NOT NULL DEFAULT 0` | SIM ✓ |
| `total_final` | `numeric NOT NULL DEFAULT 0` | `numeric NOT NULL DEFAULT 0` | SIM ✓ |
| `observacoes` | `text NULL` | `text NULL` | SIM ✓ |
| `created_at` | `timestamptz DEFAULT now()` | `timestamptz NULL DEFAULT now()` | SIM ✓ |
| `updated_at` | `timestamptz DEFAULT now()` | `timestamptz NULL DEFAULT now()` | SIM ✓ |

**Resultado: todos os campos de `orcamentos` estao corretos.** ✓

### 5.2 `public.orcamento_itens`

Comparacao coluna a coluna com o schema real introspectado em 4A.4:

| Coluna | Draft | Real (4A.4) | Compativel |
|--------|-------|-------------|------------|
| `id` | `uuid PRIMARY KEY DEFAULT gen_random_uuid()` | `uuid NOT NULL DEFAULT gen_random_uuid()` | SIM ✓ |
| `orcamento_id` | `uuid NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE` | `uuid NOT NULL FK → orcamentos.id CASCADE` | SIM ✓ |
| `codigo` | `text NULL` | `text NULL` (campo correto: `codigo`, nao `codigo_referencia`) | SIM ✓ |
| `descricao` | `text NOT NULL` | `text NOT NULL` | SIM ✓ |
| `unidade` | `text NOT NULL DEFAULT 'un'` | `text NOT NULL DEFAULT 'un'` | SIM ✓ |
| `quantidade` | `numeric NOT NULL DEFAULT 1` | `numeric NOT NULL DEFAULT 1` | SIM ✓ |
| `valor_unitario` | `numeric NOT NULL DEFAULT 0` | `numeric NOT NULL DEFAULT 0` | SIM ✓ |
| `valor_total` | `numeric NOT NULL DEFAULT 0` | `numeric NOT NULL DEFAULT 0` | SIM ✓ |
| `origem` | `text NOT NULL DEFAULT 'manual'` | `text NOT NULL DEFAULT 'manual'` | SIM ✓ |
| `created_at` | `timestamptz DEFAULT now()` | `timestamptz NULL DEFAULT now()` | SIM ✓ |
| `updated_at` | ausente no draft | ausente no real | SIM ✓ |

**Resultado: todos os campos de `orcamento_itens` estao corretos.** ✓

## 6. Validacao das FKs

| FK | Draft | Real | Decisao |
|----|-------|------|---------|
| `orcamento_itens.orcamento_id → orcamentos.id` | ON DELETE CASCADE | ON DELETE CASCADE | SIM ✓ — replica o real |
| `orcamentos.obra_id → obras.id` | AUSENTE | AUSENTE (obra_id e text sem FK) | CORRETO ✓ |
| `opportunities.orcamento_id → orcamentos.id` | AUSENTE | AUSENTE (uuid avulso sem FK) | CORRETO ✓ |
| `propostas.orcamento_id → orcamentos.id` | AUSENTE | AUSENTE (uuid avulso sem FK) | CORRETO ✓ |
| `orcamentos → orcamento_itens` (inversa) | AUSENTE | AUSENTE | CORRETO ✓ |

**Resultado: todas as FKs presentes e ausentes estao corretas.** ✓

## 7. Validacao dos Indices

| Indice | Tabela | Coluna | Draft | Real (4A.4) | Compativel |
|--------|--------|--------|-------|-------------|------------|
| `idx_orcamentos_obra_id` | `orcamentos` | `obra_id` | SIM | SIM | ✓ |
| `idx_orcamento_itens_orcamento_id` | `orcamento_itens` | `orcamento_id` | SIM | SIM | ✓ |

**Resultado: os dois indices replicam exatamente os indices reais.** ✓

## 8. Validacao das Decisoes Especificas

### 8.1 `obra_id text NULL` sem FK para `obras`

Status: CORRETO ✓

Justificativas confirmadas:
- schema real usa `text NULL` (nao uuid com FK);
- `CODING_STANDARDS.md` regra: "obra_id nas tabelas: tipo TEXT (nao UUID com FK)";
- `useOportunidadeOrcamento.ts` omite intencionalmente `obra_id` ao criar orcamento para oportunidade;
- comentario em `useOportunidadeOrcamento.ts` linha 141: `// obra_id: intencionalmente omitido — proibido usar obra_id = opp_<id>`.

### 8.2 `bdi numeric DEFAULT 25`

Status: CORRETO ✓

Justificativa: replica o default real introspectado em 4A.4.

Pendencia registrada no draft original: considerar se `DEFAULT 0` seria mais adequado para orcamentos de oportunidade. Essa divergencia nao e bloqueadora para o baseline — a camada de aplicacao pode sobrescrever o valor no momento da criacao.

### 8.3 `status text` sem CHECK constraint

Status: CORRETO e intencional ✓

Justificativa:
- o real nao tem CHECK constraint em `status`;
- o TypeScript define `OrcamentoStatus = 'rascunho' | 'aprovado' | 'importado'` como contrato de aplicacao;
- adicionar CHECK no baseline introduziria divergencia se o real nao tiver — risco maior que o beneficio;
- validacao de status e responsabilidade da camada de aplicacao nesta fase.

### 8.4 `origem text` sem CHECK constraint

Status: CORRETO e intencional ✓

Justificativa: mesmo racional que `status`. TypeScript define `origem: 'manual' | 'sinapi' | 'ia'`. Validacao na camada de aplicacao.

### 8.5 Ausencia de RLS/policies

Status: CORRETO ✓

Justificativa:
- o draft nao executa `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`;
- o draft nao cria nenhuma `CREATE POLICY`;
- a decisao de auth/tenant/company continua pendente;
- para o objetivo imediato (destravar FKs do migration candidate), apenas a existencia de `orcamentos(id)` como uuid PK e necessaria;
- RLS/policies de `orcamentos` e `orcamento_itens` ficam para fase posterior.

### 8.6 Ausencia de FK formal em `opportunities.orcamento_id`

Status: CORRETO ✓

O draft nao altera `opportunities`. A FK seria na tabela `opportunities`, fora do escopo desta fase. O schema real confirma que `opportunities.orcamento_id` e uuid avulso sem FK — essa decisao nao e criada nesta fase.

### 8.7 Ausencia de FK formal em `propostas.orcamento_id`

Status: CORRETO ✓

Mesmo racional: `propostas.orcamento_id` e uuid avulso sem FK no real. O draft nao altera `propostas`.

## 9. Compatibilidade com Tipos TypeScript

Comparacao com `src/types.ts`:

| Tipo TS | Campo | Draft SQL | Compativel |
|---------|-------|-----------|------------|
| `Orcamento.id` | `string` | `uuid NOT NULL PK` | SIM ✓ |
| `Orcamento.obra_id` | `string?` | `text NULL` | SIM ✓ |
| `Orcamento.nome` | `string` | `text NOT NULL` | SIM ✓ |
| `Orcamento.cliente` | `string?` | `text NULL` | SIM ✓ |
| `Orcamento.status` | `OrcamentoStatus` | `text NOT NULL DEFAULT 'rascunho'` | SIM ✓ |
| `Orcamento.bdi` | `number` | `numeric NOT NULL DEFAULT 25` | SIM ✓ |
| `Orcamento.total_bruto` | `number` | `numeric NOT NULL DEFAULT 0` | SIM ✓ |
| `Orcamento.total_final` | `number` | `numeric NOT NULL DEFAULT 0` | SIM ✓ |
| `Orcamento.observacoes` | `string?` | `text NULL` | SIM ✓ |
| `Orcamento.created_at` | `string?` | `timestamptz DEFAULT now()` | SIM ✓ |
| `Orcamento.updated_at` | `string?` | `timestamptz DEFAULT now()` | SIM ✓ |
| `OrcamentoItem.id` | `string` | `uuid NOT NULL PK` | SIM ✓ |
| `OrcamentoItem.orcamento_id` | `string` | `uuid NOT NULL FK` | SIM ✓ |
| `OrcamentoItem.codigo` | `string?` | `text NULL` | SIM ✓ |
| `OrcamentoItem.descricao` | `string` | `text NOT NULL` | SIM ✓ |
| `OrcamentoItem.unidade` | `string` | `text NOT NULL DEFAULT 'un'` | SIM ✓ |
| `OrcamentoItem.quantidade` | `number` | `numeric NOT NULL DEFAULT 1` | SIM ✓ |
| `OrcamentoItem.valor_unitario` | `number` | `numeric NOT NULL DEFAULT 0` | SIM ✓ |
| `OrcamentoItem.valor_total` | `number` | `numeric NOT NULL DEFAULT 0` | SIM ✓ |
| `OrcamentoItem.origem` | `'manual'|'sinapi'|'ia'` | `text NOT NULL DEFAULT 'manual'` | SIM ✓ |
| `OrcamentoItem.created_at` | `string?` | `timestamptz DEFAULT now()` | SIM ✓ |

**Resultado: compatibilidade total com os tipos TypeScript existentes.** ✓

## 10. Compatibilidade com Hooks Existentes

### 10.1 `useOrcamento.ts`

| Operacao | Hook | SQL Draft | Compativel |
|----------|------|-----------|------------|
| Listagem por `obra_id` | `orcamentos?obra_id=eq.${obraId}` | `obra_id text NULL` + indice | SIM ✓ |
| Listagem de itens por `orcamento_id` | `orcamento_itens?orcamento_id=eq.${orcamentoId}` | FK + indice | SIM ✓ |
| Criar orcamento | POST sem `id/created_at/updated_at` | defaults cobrem | SIM ✓ |
| Atualizar orcamento | PATCH + `updated_at` manual | coluna existe | SIM ✓ |
| Deletar orcamento | DELETE `orcamentos?id=eq.${id}` | PK uuid | SIM ✓ |
| Criar item | POST sem `id/created_at` | defaults cobrem | SIM ✓ |
| Atualizar item | PATCH | colunas existem | SIM ✓ |
| Deletar item | DELETE | CASCADE nao afeta outros orcamentos | SIM ✓ |

### 10.2 `useOportunidadeOrcamento.ts`

| Operacao | Hook | SQL Draft | Compativel |
|----------|------|-----------|------------|
| Criar orcamento sem `obra_id` | `obra_id` omitido (linha 141) | `obra_id text NULL` — aceita | SIM ✓ |
| Vincular via `opportunities.orcamento_id` | PATCH em `opportunities` | draft nao altera `opportunities` | SIM ✓ |
| Criar item manual sem `obra_id` | `obra_id` omitido (linha 247) | sem `obra_id` em `orcamento_itens` | SIM ✓ |
| `bdi: 0` para orcamento de oportunidade | payload sobrescreve default | `bdi numeric NOT NULL DEFAULT 25` — sobrescritavel | SIM ✓ |
| `origem: 'manual'` fixo | fixado no hook | `DEFAULT 'manual'` — coerente | SIM ✓ |

**Resultado: compatibilidade total com os dois hooks existentes.** ✓

## 11. Compatibilidade com Future Baseline e Migration Candidate

| Requisito | Status |
|-----------|--------|
| `orcamentos.id uuid PK` como alvo FK do migration candidate Reader/Verifier/HITL | SIM ✓ |
| `opportunity_files.id uuid PK` — criado por `06_CREATE_OPPORTUNITIES_MVP.sql`, nao alterado aqui | SIM ✓ |
| `opportunities.id uuid PK` — criado por `06_CREATE_OPPORTUNITIES_MVP.sql`, nao alterado aqui | SIM ✓ |
| Nenhuma FK de `orcamentos` para `orcamento_itens` — sem impacto no pipeline | SIM ✓ |
| `CREATE TABLE IF NOT EXISTS` — idempotente, pode ser re-executado sem erro | SIM ✓ |
| `CREATE INDEX IF NOT EXISTS` — idempotente | SIM ✓ |

**Resultado: o draft habilita as FKs que o migration candidate exige.** ✓

## 12. Ajustes Realizados

**Nenhum ajuste foi necessario.** O SQL draft esta correto, fiel ao schema real e compativel com todos os contratos existentes.

## 13. Riscos Remanescentes

| # | Risco | Impacto | Mitigacao |
|---|-------|---------|-----------|
| 1 | `status` sem CHECK constraint | Aplicacao pode gravar valor fora do contrato TypeScript | Validacao na camada de aplicacao via `OrcamentoStatus` |
| 2 | `origem` sem CHECK constraint | Idem para `'manual' | 'sinapi' | 'ia'` | Idem — validacao na aplicacao |
| 3 | `bdi DEFAULT 25` pode ser inadequado para orcamentos de oportunidade | Valor excessivo se nao sobrescrito | Hook ja envia `bdi: 0` — nao e bloqueador |
| 4 | `updated_at` sem trigger de atualizacao automatica | Silencioso se a aplicacao nao enviar `updated_at` | Hook ja envia `updated_at: new Date().toISOString()` no PATCH — nao e bloqueador |
| 5 | RLS/policies ausentes | Sem controle de acesso por role ate fase posterior | Aceitavel enquanto nao houver API produtiva consumindo essas tabelas no staging |
| 6 | `ON DELETE CASCADE` em `orcamento_itens` | Delete de orcamento elimina todos os itens | Comportamento real, documentado, aceitavel para MVP |
| 7 | Sem FK formal de `opportunities.orcamento_id → orcamentos.id` | Integridade referencial por responsabilidade da aplicacao | Replica o real — nao e regressao |

Nenhum risco novo introduzido pelo draft. Todos pre-existem no schema real.

## 14. Verificacoes de Idempotencia

| Item | Idempotente | Razao |
|------|-------------|-------|
| `CREATE TABLE IF NOT EXISTS public.orcamentos` | SIM ✓ | Nao falha se tabela ja existe |
| `CREATE TABLE IF NOT EXISTS public.orcamento_itens` | SIM ✓ | Idem |
| `CREATE INDEX IF NOT EXISTS idx_orcamentos_obra_id` | SIM ✓ | Nao falha se indice ja existe |
| `CREATE INDEX IF NOT EXISTS idx_orcamento_itens_orcamento_id` | SIM ✓ | Idem |
| `BEGIN/COMMIT` | SIM ✓ | Transacao padrao; rollback automatico em caso de falha |

## 15. Decisao Objetiva

**SQL draft APROVADO para commit documental.**

Justificativas:

- nenhum comando proibido encontrado;
- todas as colunas replicam fielmente o schema real da 4A.4;
- tipos compativeis com `src/types.ts`;
- hooks `useOrcamento.ts` e `useOportunidadeOrcamento.ts` funcionam corretamente com o esquema proposto;
- FKs corretas (presentes e ausentes);
- indices corretos e identicos ao real;
- RLS/policies corretamente diferidos;
- sem FK para tabelas fora do escopo;
- sem escrita de dados;
- sem comandos destrutivos;
- sem risco novo introduzido.

**Proximo passo apos commit documental: autorizar 4B.S4.E (execucao no staging).**

4B.S4.E permanece bloqueada ate:

1. Revisao humana confirmada.
2. Ordem de execucao no staging definida (apos `SCHEMA_OFICIAL_V1`, `06_CREATE_OPPORTUNITIES_MVP`, `08_CREATE_PROPOSTAS_MVP`).
3. Confirmacao do alvo `vtlepoljlqmjwuauygni`.
4. Plano de validacao read-only pos-execucao preparado.
5. Aprovacao explicita antes de qualquer execucao.

## 16. Confirmacoes da Fase 4B.S4.O.R

- nenhum SQL executado;
- nenhuma migration aplicada;
- nenhum banco alterado;
- nenhum Supabase remoto alterado;
- producao `jwutiebpfauwzzltwgbb` nao foi usada;
- staging `vtlepoljlqmjwuauygni` referenciado como alvo documental;
- nenhum dado alterado;
- nenhum codigo operacional/UI alterado;
- nenhum `.env` alterado;
- nenhum secret documentado;
- nenhum ajuste necessario ao SQL draft;
- 4B.S4.E permanece bloqueada;
- 4B.1 permanece bloqueada.
