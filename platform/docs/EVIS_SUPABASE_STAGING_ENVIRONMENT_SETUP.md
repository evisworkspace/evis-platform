# EVIS - Supabase Staging Environment Setup

> Fase: 4B.S1  
> Tipo: checklist operacional para criacao/configuracao de staging Supabase  
> Status: plano documental; sem SQL executado; sem migration aplicada; sem banco alterado  
> Bloqueio atual: 4B.1 nao liberada

## 1. Objetivo

Preparar de forma segura a criacao ou configuracao manual de um ambiente Supabase staging/sandbox para testar futuramente a migration candidate Reader / Verifier / HITL.

Esta fase nao cria tabelas, nao executa SQL, nao aplica migration, nao altera Supabase remoto e nao altera codigo/UI. O objetivo e deixar claro o procedimento manual, as variaveis locais necessarias e os criterios de seguranca antes de qualquer preflight remoto ou execucao controlada.

## 2. Confirmacao do ambiente real bloqueado

O unico project ref Supabase identificado ate esta fase continua sendo:

```text
jwutiebpfauwzzltwgbb
```

Esse ref ja foi usado como ambiente real na introspeccao 4A.4 e foi novamente registrado como unico ref encontrado na 4B.0.

Nesta 4B.S1, `supabase/.temp/project-ref` tambem aponta para:

```text
jwutiebpfauwzzltwgbb
```

Conclusao:

- `jwutiebpfauwzzltwgbb` deve ser tratado como ambiente real/produtivo;
- `supabase/.temp/project-ref` nao deve ser usado como fonte de staging enquanto apontar para esse ref;
- 4B.1 continua bloqueada;
- qualquer staging/sandbox/clone precisa ter project ref proprio e diferente.

## 3. Bloqueios de seguranca

Manter estes bloqueios ate existir staging confirmado:

- nao executar SQL;
- nao aplicar migration;
- nao rodar pre-check remoto contra `jwutiebpfauwzzltwgbb` para liberar 4B.1;
- nao usar `jwutiebpfauwzzltwgbb` como staging, sandbox ou clone;
- nao colar anon key, service role, access token ou connection string em chat, documento versionado ou commit;
- nao commitar `.env`, `.env.local`, `.env.staging.local`, dumps, backups ou arquivos com secrets;
- nao sobrescrever variaveis de producao com variaveis de staging;
- nao alterar codigo, UI, hooks, rotas ou schema nesta fase;
- interromper o processo se houver duvida sobre qual ambiente esta selecionado.

## 4. Checklist manual no Supabase Dashboard

Executar manualmente no Dashboard Supabase, sem informar secrets no chat:

- [ ] Criar um novo projeto Supabase separado, preferencialmente chamado `evis-staging`.
- [ ] Alternativamente, criar clone/branch/sandbox com identificacao inequívoca de nao-producao.
- [ ] Confirmar que o nome do projeto contem `staging`, `sandbox` ou `clone`.
- [ ] Registrar localmente o project ref do staging.
- [ ] Confirmar que o project ref do staging e diferente de `jwutiebpfauwzzltwgbb`.
- [ ] Registrar localmente a URL do staging.
- [ ] Registrar em documento apenas URL mascarada, se necessario.
- [ ] Guardar anon key, service role key e access token somente em arquivo local nao commitado.
- [ ] Confirmar que o projeto pertence a organizacao correta e nao e o projeto real.
- [ ] Confirmar regiao/plano compativeis com teste controlado.
- [ ] Confirmar backup/snapshot ou confirmar que o ambiente e descartavel.
- [ ] Definir operador responsavel pela configuracao e execucao futura.
- [ ] Nao vincular a CLI/local project ao staging sem decisao explicita.
- [ ] Nao executar nenhum SQL ate o staging ser confirmado e a proxima fase ser autorizada.

## 5. Variaveis locais necessarias

As variaveis abaixo devem existir somente em ambiente local nao commitado, preferencialmente em `.env.staging.local`.

Obrigatorias para identificar o staging:

```text
EVIS_STAGING_SUPABASE_PROJECT_REF=
EVIS_STAGING_SUPABASE_URL=
EVIS_STAGING_SUPABASE_ANON_KEY=
```

Necessaria apenas para operacoes administrativas futuras em staging:

```text
EVIS_STAGING_SUPABASE_SERVICE_ROLE_KEY=
```

Necessaria apenas se a futura auditoria read-only usar Supabase Management API:

```text
EVIS_STAGING_SUPABASE_ACCESS_TOKEN=
```

Regras:

- deixar os valores vazios em documentos versionados;
- nunca registrar service role ou access token em Markdown;
- nunca commitar `.env.staging.local`;
- nunca misturar `EVIS_STAGING_*` com variaveis do ambiente real;
- nao usar nomes genericos como `SUPABASE_SERVICE_ROLE_KEY` para staging sem isolamento explicito.

## 6. Schema base necessario futuramente

Antes de qualquer execucao da migration candidate das 9 tabelas Reader / Verifier / HITL, o staging precisa conter o schema base minimo:

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

Fontes documentais ja identificadas:

- `docs/SCHEMA_OFICIAL_V1.sql` para `obras`, `diario_obra` e base operacional de Obra;
- `docs/06_CREATE_OPPORTUNITIES_MVP.sql` para `contacts`, `opportunities`, `opportunity_events` e `opportunity_files`;
- `docs/08_CREATE_PROPOSTAS_MVP.sql` para `propostas`;
- `platform/docs/EVIS_REAL_SCHEMA_READONLY_INTROSPECTION_REPORT.md` como referencia real para reconciliar `orcamentos` e `orcamento_itens`.

Pendencia:

- ainda nao ha `CREATE TABLE` canonico documentado para `orcamentos` e `orcamento_itens`;
- antes da 4B.1, sera necessario criar/revisar um script base de staging para essas duas tabelas, coerente com o schema real 4A.4;
- esse script nao deve ser executado nesta fase.

## 7. Criterios para considerar staging confirmado

O staging so pode ser considerado confirmado quando todos os itens abaixo estiverem satisfeitos:

- project ref staging registrado localmente;
- project ref staging diferente de `jwutiebpfauwzzltwgbb`;
- URL staging registrada localmente e, se documentada, mascarada;
- confirmacao humana explicita de que o projeto nao e producao;
- backup/snapshot ou descartabilidade confirmada;
- variaveis `EVIS_STAGING_*` configuradas localmente sem commit;
- nenhum secret presente em documento versionado;
- schema base minimo preparado ou plano de setup base aprovado;
- `orcamentos` e `orcamento_itens` reconciliados para staging;
- 4B.0 read-only reexecutada contra o staging, e nao contra o ref real;
- ausencia das 9 tabelas pipeline confirmada no staging;
- `pgcrypto` / `gen_random_uuid()` confirmado no staging;
- RLS/policies e baseline operacional registrados no staging.

## 8. Criterios para manter 4B.1 bloqueada

Manter 4B.1 bloqueada se qualquer item abaixo ocorrer:

- unico ref disponivel continua sendo `jwutiebpfauwzzltwgbb`;
- `supabase/.temp/project-ref` continua apontando para `jwutiebpfauwzzltwgbb` e nao ha outro ref confirmado;
- project ref staging nao foi registrado;
- project ref staging e igual ao ref real;
- nao existe confirmacao humana de nao-producao;
- URL, project ref ou nome do projeto estao ambiguos;
- qualquer secret foi exposto em documento, chat ou arquivo versionado;
- `.env.staging.local` foi commitado ou preparado para commit;
- schema base minimo ainda nao existe no staging;
- `orcamentos` e `orcamento_itens` continuam sem script base revisado;
- 4B.0 read-only ainda nao foi reexecutada contra staging;
- as 9 tabelas pipeline ja existem no staging sem justificativa documentada;
- rollback/teste de rollback ainda nao foi preparado;
- qualquer SQL seria executado contra ambiente incerto.

## 9. Proximos passos apos criar o staging

Depois que o projeto staging for criado manualmente:

1. Registrar somente o project ref staging e a URL mascarada, sem secrets.
2. Confirmar textualmente que o staging nao e producao e que o ref e diferente de `jwutiebpfauwzzltwgbb`.
3. Configurar variaveis `EVIS_STAGING_*` em arquivo local nao commitado.
4. Criar ou revisar o setup base de staging, principalmente `orcamentos` e `orcamento_itens`.
5. Reexecutar a 4B.0 como preflight read-only somente contra o staging.
6. Registrar resultado de tabelas base, extensoes, RLS/policies e ausencia das 9 tabelas pipeline.
7. Somente depois avaliar se a 4B.1 pode ser planejada, ainda com aprovacao humana explicita.

## 10. Confirmacoes da 4B.S1

- nenhum SQL executado;
- nenhuma migration aplicada;
- nenhum banco alterado;
- nenhum Supabase remoto alterado;
- nenhum dado alterado;
- nenhum codigo operacional/UI alterado;
- nenhuma rota criada;
- nenhum hook criado;
- nenhum arquivo `.env` criado ou alterado;
- nenhum secret documentado;
- nenhum commit realizado;
- 4B.1 permanece bloqueada ate staging/sandbox/clone seguro ser criado, confirmado e validado por preflight read-only.
