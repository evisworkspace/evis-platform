# EVIS - Supabase Staging/Sandbox Setup Plan

> Fase: 4B.S  
> Tipo: plano de criacao/configuracao de staging/sandbox  
> Status: plano documental; sem SQL executado; sem migration aplicada; sem banco alterado  
> Bloqueio atual: 4B.1 nao liberada

## 1. Objetivo

Definir como criar ou confirmar um ambiente Supabase staging/sandbox separado para testar a migration candidate Reader / Verifier / HITL sem tocar no banco real.

Esta fase nao executa SQL, nao cria tabela, nao aplica migration e nao altera nenhum banco. Ela apenas define o plano operacional para criar o campo de testes.

## 2. Por que 4B.1 esta bloqueada

A Fase 4B.0 encontrou apenas um project ref Supabase:

```text
jwutiebpfauwzzltwgbb
```

Esse ref coincide com o ambiente real ja documentado na introspeccao 4A.4. Nenhum project ref separado de staging, sandbox ou clone descartavel foi encontrado.

Consequencia:

- a migration candidate nao deve ser aplicada;
- pre-checks remotos nao devem ser executados contra esse ref para liberar 4B.1;
- 4B.1 continua bloqueada ate existir ambiente nao-producao confirmado.

## 3. Ambientes avaliados

| Opcao | Descricao | Vantagens | Riscos / desvantagens | Decisao |
|-------|-----------|-----------|------------------------|---------|
| A | Novo projeto Supabase staging (`evis-staging`) | Separacao forte, risco baixo para producao, ref proprio | Precisa replicar schema base antes do teste | Recomendada |
| B | Clone/branch Supabase do projeto real | Schema mais fiel ao real, reduz divergencia estrutural | Pode confundir refs se o clone nao for claramente identificado | Aceitavel se disponivel |
| C | Supabase local/descartavel | Barato, seguro, facil de destruir | Pode divergir do Supabase remoto real e das policies do projeto | Util para ensaio auxiliar, nao substitui staging remoto |

## 4. Opcao recomendada

Recomendacao principal:

```text
Opcao A - criar novo projeto Supabase staging separado.
```

Nome sugerido:

```text
evis-staging
```

Justificativa:

- evita qualquer risco direto ao project ref real;
- obriga registro explicito de um ref diferente;
- facilita destruir/recriar o ambiente se o teste falhar;
- deixa claro para humanos e automacoes que a 4B.1 nao roda em producao.

Opcao B tambem e aceitavel se a conta Supabase permitir branch/clone com project ref proprio e nomenclatura inequivoca. Nesse caso, o clone deve ser tratado como staging e nunca como producao.

## 5. Padrao de nomes

### 5.1 Projeto Supabase

Nome recomendado:

```text
evis-staging
```

Nome alternativo aceitavel:

```text
evis-sandbox-reader-verifier-hitl
```

Regras:

- o nome deve conter `staging`, `sandbox` ou `clone`;
- o project ref deve ser diferente de `jwutiebpfauwzzltwgbb`;
- o project ref deve ser registrado no documento de preflight futuro;
- a URL deve ser registrada de forma mascarada em documentos.

### 5.2 Variaveis de ambiente

Variaveis sugeridas para uso local/manual:

```text
EVIS_STAGING_SUPABASE_PROJECT_REF
EVIS_STAGING_SUPABASE_URL
EVIS_STAGING_SUPABASE_ANON_KEY
EVIS_STAGING_SUPABASE_SERVICE_ROLE_KEY
EVIS_STAGING_SUPABASE_ACCESS_TOKEN
```

Se alguma ferramenta exigir nomes padrao, usar arquivo local separado e deixar o contexto explicito:

```text
.env.staging.local
```

Regras:

- nunca commitar `.env.staging.local`;
- nunca commitar service role;
- nunca colar keys em documentos;
- nunca sobrescrever `.env` de uso real sem aprovacao humana explicita;
- nunca misturar URL/ref real com service role de staging ou vice-versa.

### 5.3 Arquivos locais que nao devem ser commitados

```text
.env
.env.local
.env.staging.local
.env.sandbox.local
supabase/.temp/*
*.dump
*.backup
*.sql.local
*.secrets.*
```

Se algum arquivo temporario precisar ser compartilhado, remover secrets e registrar apenas nomes de variaveis, refs mascarados e checksums.

## 6. Checklist manual para criar staging

- [ ] Criar novo projeto Supabase chamado `evis-staging` ou equivalente.
- [ ] Registrar project ref do staging.
- [ ] Confirmar que o project ref e diferente de `jwutiebpfauwzzltwgbb`.
- [ ] Registrar URL mascarada do staging.
- [ ] Guardar anon key e service role apenas em arquivo local nao commitado.
- [ ] Confirmar que o dashboard/organization/projeto nao e producao.
- [ ] Confirmar regiao/plano compatíveis com o teste.
- [ ] Confirmar backup/snapshot ou disposability do ambiente.
- [ ] Confirmar operador/role responsavel pela execucao.
- [ ] Registrar data, responsavel e finalidade do ambiente.
- [ ] Rodar novamente a 4B.0 somente contra esse staging/sandbox.

## 7. Como evitar producao

Regras obrigatorias:

- nunca usar o project ref `jwutiebpfauwzzltwgbb` para 4B.1;
- antes de qualquer SQL, comparar o ref alvo com o ref real bloqueado;
- exigir confirmacao humana textual: `confirmo que este ambiente nao e producao`;
- manter URL/ref staging em variaveis com prefixo `EVIS_STAGING_`;
- mascarar URLs em documentos: `https://abcd...wxyz.supabase.co`;
- nao executar comandos com secrets colados em chat, docs ou historico versionado;
- nao usar `supabase/.temp/project-ref` como fonte de staging enquanto ele apontar para o ref real;
- registrar prints/logs sem secrets quando necessario;
- interromper a execucao se houver qualquer duvida sobre o ambiente.

## 8. Preparacao do schema base

Antes da migration candidate das 9 tabelas, o staging precisa conter o schema base minimo usado pelas FKs e pelo baseline de nao contaminacao.

Tabelas minimas:

```text
contacts
opportunities
opportunity_events
opportunity_files
propostas
orcamentos
orcamento_itens
obras
diario_obra
```

### 8.1 Ordem recomendada

1. Confirmar `pgcrypto` / `gen_random_uuid()` no staging.
2. Criar schema de Obra base, incluindo `obras` e `diario_obra`.
3. Criar Oportunidades: `contacts`, `opportunities`, `opportunity_events`, `opportunity_files`.
4. Criar `orcamentos` e `orcamento_itens` com estrutura compativel com o real.
5. Criar `propostas`.
6. Aplicar somente em staging qualquer ajuste base necessario para compatibilidade, como `orcamentos.obra_id` nullable, se o schema criado exigir.
7. Rodar pre-check read-only 4B.0 no staging.
8. Somente depois considerar 4B.1.

### 8.2 Fontes documentais disponiveis

| Fonte | Uso no staging | Observacao |
|-------|----------------|------------|
| `docs/SCHEMA_OFICIAL_V1.sql` | Base de `obras` e `diario_obra` | Contem tambem tabelas operacionais de Obra e `_schema_version` |
| `docs/06_CREATE_OPPORTUNITIES_MVP.sql` | Base de `contacts`, `opportunities`, `opportunity_events`, `opportunity_files` | Depende de `obras` para FK opcional |
| `docs/08_CREATE_PROPOSTAS_MVP.sql` | Base de `propostas` | Depende de `opportunities` |
| `platform/docs/sql_proposals/ORCAMENTISTA_001_ORCAMENTOS_OBRA_ID_NULLABLE.sql` | Referencia para tornar `orcamentos.obra_id` nullable | E ALTER apenas; nao cria `orcamentos` |
| `platform/docs/EVIS_REAL_SCHEMA_READONLY_INTROSPECTION_REPORT.md` | Referencia do schema real de `orcamentos` e `orcamento_itens` | Deve orientar criacao de script base revisado |

### 8.3 Pendencia de schema base

Nao foi encontrado nos arquivos listados um `CREATE TABLE` canonico para:

```text
orcamentos
orcamento_itens
```

Antes de 4B.1, criar um script de setup de staging ou documento SQL revisado para essas duas tabelas, baseado no relatorio real 4A.4. Esse script deve ser revisado humanamente antes de qualquer execucao.

Campos minimos esperados conforme 4A.4:

```text
orcamentos:
  id uuid primary key default gen_random_uuid()
  obra_id text null
  nome text not null
  cliente text null
  status text not null default 'rascunho'
  bdi numeric not null default 25
  total_bruto numeric not null default 0
  total_final numeric not null default 0
  observacoes text null
  created_at timestamptz
  updated_at timestamptz

orcamento_itens:
  id uuid primary key default gen_random_uuid()
  orcamento_id uuid not null references orcamentos(id) on delete cascade
  codigo text null
  descricao text not null
  unidade text not null default 'un'
  quantidade numeric not null default 1
  valor_unitario numeric not null default 0
  valor_total numeric not null default 0
  origem text not null default 'manual'
  created_at timestamptz
```

Essa criacao de base ainda nao deve acontecer nesta fase.

## 9. Validacao de que nao e producao

Antes de qualquer SQL no staging, registrar:

- project ref;
- URL mascarada;
- nome do projeto;
- data/hora;
- operador;
- confirmacao humana de que o ref nao e `jwutiebpfauwzzltwgbb`;
- confirmacao humana de que o projeto nao e producao;
- origem do schema base aplicado;
- backup/snapshot ou justificativa de ambiente descartavel.

Bloquear se:

- o ref alvo for `jwutiebpfauwzzltwgbb`;
- o nome do projeto nao indicar staging/sandbox/clone;
- a URL nao bater com o ref staging registrado;
- qualquer secret estiver documentado em arquivo versionado;
- houver duvida entre producao e staging.

## 10. Confirmacao das 9 tabelas pipeline

Antes de 4B.1, a 4B.0 deve ser reexecutada contra staging para confirmar que estas tabelas ainda nao existem:

```text
orc_reader_runs
orc_reader_outputs
orc_reader_safety_evaluations
orc_verifier_runs
orc_reader_verifier_comparisons
orc_reader_verifier_divergences
orc_hitl_issues
orc_hitl_decisions
orc_context_snapshots
```

Resultado esperado:

```text
zero tabelas encontradas
```

Se qualquer uma existir, interromper 4B.1 e reconciliar o staging antes de aplicar o candidate.

## 11. Criterios para liberar 4B.1

4B.1 so pode avancar quando todos os itens abaixo estiverem cumpridos:

- staging/sandbox/clone confirmado com project ref proprio;
- project ref diferente de `jwutiebpfauwzzltwgbb`;
- URL do staging registrada e mascarada;
- backup/snapshot ou ambiente descartavel confirmado;
- variaveis staging guardadas apenas localmente e sem commit;
- schema base minimo criado e validado no staging;
- `orcamentos` e `orcamento_itens` reconciliados no staging;
- `pgcrypto` / `gen_random_uuid()` confirmado no staging;
- tabelas base confirmadas no staging;
- ausencia das 9 tabelas pipeline confirmada no staging;
- RLS/policies baseline registradas;
- baseline operacional registrado para `opportunities`, `orcamentos`, `orcamento_itens`, `propostas`, `obras`, `diario_obra`;
- rollback/teste de rollback preparado;
- aprovacao humana explicita registrada.

## 12. Criterios para manter 4B.1 bloqueada

Manter 4B.1 bloqueada se qualquer item abaixo ocorrer:

- unico ref disponivel continua sendo `jwutiebpfauwzzltwgbb`;
- nao ha confirmacao explicita de nao-producao;
- staging nao possui schema base minimo;
- `orcamentos`/`orcamento_itens` nao foram criados ou reconciliados;
- as 9 tabelas pipeline ja existem no staging sem explicacao;
- `pgcrypto`/`gen_random_uuid()` nao foi confirmado;
- baseline operacional nao foi registrado;
- backup/snapshot nao foi confirmado;
- service role ou access token foi exposto em documento;
- operador nao consegue explicar rollback;
- qualquer SQL seria executado contra ambiente incerto.

## 13. Confirmacoes desta fase

- nenhum SQL executado;
- nenhuma migration aplicada;
- nenhum banco alterado;
- nenhum Supabase alterado;
- nenhum dado alterado;
- nenhum codigo operacional alterado;
- nenhuma UI alterada;
- nenhum commit realizado;
- 4B.1 continua bloqueada ate criacao/confirmacao de staging ou sandbox seguro.
