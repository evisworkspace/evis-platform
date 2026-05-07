# SCHEMA GAP REPORT - EVIS AI

> Tipo: auditoria curta de divergencia entre schema documentado, codigo atual e necessidade do modulo Oportunidades  
> Status: documento de orientacao, sem execucao de SQL  
> Escopo: nao altera banco, nao cria migration, nao implementa tela

## 1. Objetivo

Registrar oficialmente os gaps entre:

- schema oficial documentado;
- tabelas assumidas pelo codigo atual;
- entidades necessarias para o MVP de Oportunidades;
- decisoes arquiteturais antes da implementacao do fluxo comercial.

Este documento deve orientar a reconciliacao do Supabase antes de qualquer migration ou tela nova.

## 1.1 Fase 4A.1 - Migration Draft Reader / Verifier / HITL

> Status: proposta tecnica criada, sem execucao SQL e sem migration aplicada.

Foi adicionado o draft tecnico de persistencia:

- `platform/docs/EVIS_READER_VERIFIER_HITL_MIGRATION_DRAFT.md`

Escopo do draft:

- desenho das 9 tabelas de persistencia Reader/Verifier/HITL/contexto;
- campos, tipos sugeridos, FKs e nullable vs required;
- indices minimos por `opportunity_id`, `orcamento_id`, `opportunity_file_id`, status e `created_at`;
- constraints de seguranca e regras de imutabilidade (`raw_output_json` imutavel e decisions append-only);
- pontos de RLS (sem policy definitiva);
- ordem de criacao e rollback plan.

Regras chave mantidas:

- `opportunity_id` obrigatorio como coluna direta nas 9 tabelas propostas, mesmo quando derivavel por FK;
- `orcamento_id` nullable nas fases iniciais e obrigatorio apenas em fase oficial futura;
- referencia de fonte por `opportunity_file_id + page_number` obrigatoria nas tabelas page-scoped; em tabelas contextuais/globais, esses campos podem ser nullable com `source_type` e source refs suficientes;
- `orc_hitl_decisions` append-only, sem `ON DELETE CASCADE` a partir de HITL issue;
- `orc_hitl_issues.comparison_id` nullable para pendencias pre-comparacao;
- `dedupe_key` de divergencia deve ser especifica por categoria, campo tecnico, item, fonte/pagina, valores e disciplina quando aplicavel;
- Reader/Verifier/HITL sem escrita direta em `orcamento_itens`.

## 1.2 Fase 4A.2 - SQL Draft Review Reader / Verifier / HITL

> Status: SQL draft documental criado; nao executado; sem migration aplicada.

Arquivo criado:

- `platform/docs/sql_proposals/ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_DRAFT.sql`

Escopo do SQL draft:

- `CREATE TABLE IF NOT EXISTS` para as 9 tabelas de persistencia Reader/Verifier/HITL/contexto;
- `opportunity_id` obrigatorio como coluna direta em todas as tabelas principais;
- `orcamento_id` nullable nesta fase;
- tabelas page-scoped com `opportunity_file_id` + `page_number` obrigatorios e `document_id text null`;
- constraints de status, severidade, score (0..1), textos criticos e coerencia de bloqueio;
- `dedupe_key` + `unique (comparison_id, dedupe_key)` em divergencias;
- `orc_hitl_issues.comparison_id` nullable;
- `orc_hitl_decisions` append-only sem `ON DELETE CASCADE`, com `source_refs_json` e `issue_snapshot_json`;
- bloco RLS apenas comentado (sem policies definitivas);
- rollback order comentado em ordem reversa.

Confirmacoes da 4A.2:

- nenhum SQL executado;
- nenhuma migration aplicada;
- nenhum banco alterado;
- nenhuma alteracao em codigo operacional/UI.

## 2. Tabelas Confirmadas No Schema Oficial

As tabelas abaixo aparecem no schema oficial documentado em `docs/SCHEMA_OFICIAL_V1.sql`:

```text
obras
servicos
equipes_cadastro
equipes_presenca
diario_obra
notas
pendencias
fotos
alias_conhecimento
_schema_version
```

Leitura pratica:

- `obras` e a entidade operacional principal do EVIS Obra.
- `servicos`, `equipes_cadastro`, `equipes_presenca`, `diario_obra`, `notas`, `pendencias` e `fotos` dependem de `obra_id`.
- `alias_conhecimento` e uma base global de reconhecimento sem dependencia direta de obra.
- `_schema_version` registra versao do schema documentado.

## 3. Tabelas Usadas Pelo Codigo Mas Ausentes No Schema Oficial

As tabelas abaixo sao usadas ou assumidas pelo codigo/documentacao operacional, mas nao aparecem no schema oficial base:

```text
orcamentos
orcamento_itens
brain_narrativas
relatorios_semanais
sinapi_composicoes
catalogo_servicos_evis
servicos_referencia_origem
composicoes_modelo
precos_referencia_historico
cotacoes_reais
snapshot_orcamento_itens
sugestoes_catalogo
vw_referencias_servicos_evis
```

Leitura pratica:

- `orcamentos` e `orcamento_itens` sao usados pelo modulo de orcamento no frontend.
- `brain_narrativas` e `relatorios_semanais` aparecem no fluxo de sincronizacao do app.
- As tabelas e view de catalogo/referencias sustentam a camada EVIS/SINAPI.
- A ausencia dessas entidades no schema oficial cria risco de desenvolvimento sobre contrato incompleto.

## 4. Riscos Atuais

Antes de criar Oportunidades, os principais riscos sao:

- criar foreign keys para tabelas que talvez nao existam no banco real;
- duplicar cliente em `contacts`, `obras`, `orcamentos` e JSON de proposta sem regra clara;
- criar `obra` cedo demais para leads ainda nao fechados;
- acoplar o Orçamentista em `obra_id` antes de existir uma oportunidade comercial;
- criar `proposta_id` sem tabela real e persistida de propostas;
- aumentar a divergencia entre codigo, documentos e Supabase.

Risco adicional observado:

- ha codigo que consulta estruturas nao alinhadas ao schema documentado, como `pendencias.resolvido`, enquanto o schema oficial usa `pendencias.status`.

## 5. Modelo Recomendado Para Oportunidades

O MVP de Oportunidades deve comecar enxuto, com uma entidade central e historico:

```text
contacts
opportunities
opportunity_events
opportunity_files
opportunity_statuses
```

Uso recomendado:

- `contacts`: pessoas ou empresas relacionadas a oportunidades.
- `opportunities`: registro mestre do lead/oportunidade.
- `opportunity_events`: linha do tempo comercial, tecnica e operacional.
- `opportunity_files`: arquivos recebidos antes da obra existir.
- `opportunity_statuses`: opcional; usar se os status precisarem ser configuraveis. Para MVP, um enum/check constraint em `opportunities.status` pode ser suficiente.

## 6. Relacao De IDs

A relacao correta entre as entidades deve seguir este fluxo:

```text
contact_id
  -> opportunity_id
    -> orcamentista_workspace_id
    -> orcamento_id
    -> proposta_id
    -> project_id
    -> obra_id
```

Definicao de cada ID:

- `contact_id`: identifica o cliente, arquiteto, parceiro ou responsavel comercial.
- `opportunity_id`: identifica a oportunidade como origem do ciclo comercial.
- `orcamentista_workspace_id`: identifica o workspace local/operacional usado pelo Orçamentista.
- `orcamento_id`: identifica o orcamento estruturado, quando existir tabela reconciliada.
- `proposta_id`: identifica proposta comercial persistida, quando a tabela existir.
- `project_id`: entidade futura ou intermediaria de pre-obra/projeto, se o produto separar projeto de obra operacional.
- `obra_id`: identifica a obra operacional no EVIS Obra, criada apenas apos fechamento.

Regra de nascimento:

```text
contact_id e opportunity_id nascem cedo.
orcamentista_workspace_id nasce quando a oportunidade abre analise tecnica.
orcamento_id nasce quando ha orcamento salvo.
proposta_id nasce quando a proposta e persistida.
project_id nasce apenas se houver fase formal de pre-obra.
obra_id nasce apenas apos fechamento.
```

## 7. Decisao Arquitetural

As decisoes abaixo devem guiar a implementacao:

- Lead/Oportunidade nasce antes de obra.
- Obra so nasce depois de fechamento.
- Orçamentista deve se conectar a oportunidade, nao diretamente a obra.
- Supabase e a fonte unica da verdade para entidades de produto.
- Dados incompletos sao permitidos no inicio do lead.

Consequencia pratica:

- Oportunidades nao deve exigir cadastro completo.
- `obras` nao deve ser usada como CRM.
- `cliente` textual em tabelas antigas deve ser tratado como snapshot ou compatibilidade, nao como fonte principal futura.
- O fluxo comercial deve preservar rastreabilidade ate a obra operacional.

## 8. Ordem Segura De Execucao

A ordem segura antes de implementar o modulo e:

A. Validar schema real do Supabase.  
B. Reconciliar schema oficial.  
C. Criar migration de Oportunidades.  
D. Criar types/hooks.  
E. Implementar tela Oportunidades.  
F. Conectar Orçamentista a oportunidade.

## 9. Primeiro Patch Seguro Recomendado

O primeiro patch funcional, apos esta documentacao, deve ser pequeno:

- adicionar tipos TypeScript para `Contact`, `Opportunity`, `OpportunityEvent` e `OpportunityFile`;
- criar hooks read-only ou preparados para CRUD de oportunidades;
- manter a tela de Oportunidades sem fluxo produtivo ate a migration existir;
- nao criar FK para `orcamentos`, `propostas` ou `project_id` antes da reconciliacao do schema real.

## 10. Conclusao

O modulo Oportunidades e o proximo passo correto para transformar o EVIS em um SaaS mais competitivo, mas ele deve entrar como origem do ciclo de vida comercial, nao como extensao improvisada de `obras`.

A prioridade imediata e alinhar o contrato de dados: schema real do Supabase, schema oficial e codigo precisam apontar para as mesmas entidades antes da implementacao.

---

## 11. Gap Especifico - Orcamentista IA Fase 1A

> Status: orientacao tecnica, sem SQL, sem migration e sem alteracao de banco.  
> Escopo: fundacao segura para encaixar o Orçamentista IA dentro de Oportunidade.

### 11.1 Modelo canonico esperado

Os documentos em `orcamentista/docs/` definem que o Orçamentista IA pertence a fase de pre-obra:

```text
Oportunidade -> Orçamentista IA -> Orcamento -> Proposta -> Obra
```

O modelo canonico recomenda entidades versionadas e rastreaveis:

```text
orcamentos
orcamento_versoes
orcamento_arquivos
orcamento_leituras
orcamento_agent_runs
orcamento_ambientes
orcamento_servicos
orcamento_quantitativos
orcamento_custos
orcamento_bdi_margens
orcamento_equipes_previstas
orcamento_cronograma_inicial
orcamento_riscos
orcamento_premissas
orcamento_exclusoes
orcamento_hitl_validacoes
orcamento_hitl_auditoria
orcamento_auditorias
orcamento_propostas_base
```

Essas entidades ainda nao devem ser criadas nesta fase.

### 11.2 O que existe hoje

No codigo atual ja existem ou sao assumidos:

```text
opportunities
opportunity_events
opportunity_files
propostas
orcamentos
orcamento_itens
obras
```

Uso atual observado:

- `opportunities.orcamento_id` referencia o orcamento ativo ou principal da oportunidade.
- `propostas.opportunity_id` e `propostas.orcamento_id` vinculam a proposta ao contexto comercial.
- `orcamentos` e `orcamento_itens` sao usados pelo editor legado de orcamento.
- `orcamentos` ainda esta acoplado a `obra_id` no hook legado `useOrcamento.ts`.
- `orcamentista_workspace_id` funciona como identificador operacional do workspace do Orçamentista, nao como entidade relacional completa.

### 11.3 O que falta

Faltam campos ou entidades para representar corretamente o Orçamentista IA canonico:

- vinculo relacional direto `orcamentos.oportunidade_id` ou equivalente formal;
- versionamento de orcamento;
- arquivos de orcamento vinculados ao orcamento e versao;
- leituras tecnicas rastreaveis;
- execucoes de agentes;
- ambientes previstos;
- servicos previstos com origem, confianca e status canonico;
- quantitativos com origem;
- custos com fonte e confianca;
- BDI/margem versionados;
- riscos, premissas e exclusoes;
- HITL do Orçamentista separado do HITL do Diario de Obra;
- auditorias tecnicas de bloqueio;
- base de proposta associada a versao especifica do orcamento.

### 11.4 O que depende de migration futura

Depende de migration futura, apos validacao explicita:

- adicionar `opportunity_id`/`oportunidade_id` em `orcamentos`, se a estrategia escolhida for vinculo direto;
- criar tabelas de versao, arquivos, leituras, agentes, HITL, riscos e proposta-base;
- adicionar indices por `opportunity_id`, `orcamento_id` e `versao_id`;
- criar constraints para status criticos;
- ajustar RLS para separar contexto comercial de contexto de obra;
- formalizar migracao de orcamento validado para planejamento da obra apos proposta aprovada.

Nenhuma dessas alteracoes foi aplicada na Fase 1A.

### 11.5 Risco de usar `obra_id = opp_<id>`

Usar `obra_id = opp_<uuid>` como ponte para orcamento de oportunidade e arriscado porque:

- mistura pre-obra com execucao;
- cria identificador que parece obra, mas nao existe em `obras`;
- pode quebrar foreign keys quando o schema for endurecido;
- pode conflitar com politicas RLS baseadas em `obra_id`;
- induz telas de Obra a abrirem contexto comercial;
- viola a navegacao canonica do EVIS, que exige `/oportunidades/:id/orcamentista`.

Esse padrao deve ser tratado apenas como legado transitorio encontrado no codigo atual, nao como arquitetura da Fase 1.

### 11.6 Recomendacao provisoria sem migration

A fonte provisoria mais segura para orcamento pre-obra, sem alterar banco, e:

```text
opportunities.orcamento_id
  -> orcamentos.id
    -> orcamento_itens.orcamento_id
```

Regras provisoriais:

- o contexto de navegacao deve ser sempre a oportunidade;
- o workspace do Orçamentista pode continuar como staging/preview operacional;
- JSON do workspace nao deve ser fonte oficial;
- proposta deve nascer do `orcamento_id` vinculado a oportunidade;
- conversao para obra deve continuar explicita e posterior a proposta aprovada;
- o hook legado `useOrcamento.ts` deve permanecer intocado na Fase 1A para nao quebrar `/obras`.

### 11.7 Proxima reconciliacao recomendada

Na Fase 1B, antes de qualquer migration, decidir:

```text
A) manter opportunities.orcamento_id como vinculo mestre provisoriamente; ou
B) adicionar opportunity_id em orcamentos e migrar gradualmente o hook de orcamento; ou
C) criar nova camada feature/orcamentista com adaptador para o schema legado.
```

A opcao mais segura para evolucao incremental e B, desde que seja feita com migration revisada e mantendo compatibilidade com o orcamento legado da Obra.

### 11.8 Decisao provisoria aplicada na Fase 1B

A Fase 1B adotou a alternativa A como ponte segura sem migration:

```text
opportunities.orcamento_id
  -> orcamentos.id
    -> orcamento_itens.orcamento_id
```

Essa decisao permite que a rota contextual do Orçamentista consulte o orcamento oficial da oportunidade sem criar `orcamentos.opportunity_id` ainda.

Regras aplicadas:

- o adaptador de oportunidade deve ler `opportunities.orcamento_id`;
- se `orcamento_id` existir, o adaptador carrega `orcamentos.id` e seus `orcamento_itens`;
- se `orcamento_id` nao existir, o adaptador retorna estado vazio seguro, sem criacao automatica;
- `obra_id = opp_<id>` fica proibido como vinculo de orcamento por oportunidade;
- `orcamentos.opportunity_id` continua sendo recomendacao futura dependente de migration revisada;
- o hook legado `useOrcamento.ts` continua responsavel pelo fluxo operacional de Obra por `obra_id`.

Essa ponte e temporaria. A reconciliacao definitiva deve escolher entre adicionar `opportunity_id` em `orcamentos` ou criar uma camada canonica versionada para o Orçamentista IA.

### 11.9 Decisao aplicada na Fase 1C

> Status: implementado sem migration, sem alteracao de banco.  
> Escopo: criacao explicita e vinculacao de orcamento a oportunidade via acao manual do usuario.

#### 11.9.1 Auditoria de schema realizada

Arquivos lidos para auditoria:

- `src/types.ts`: campo `Orcamento.obra_id` e opcional (`obra_id?: string`). Nao e obrigatorio no contrato TypeScript. Campo `Opportunity.orcamento_id` existe e e `string | null`.
- `src/hooks/useOrcamento.ts`: `useCreateOrcamento` aceita payload sem `obra_id` (campo opcional no tipo). Sem validacao de presenca de `obra_id` no codigo.
- `src/hooks/useOportunidades.ts`: `useUpdateOportunidade` ja existe e permite PATCH em `opportunities` incluindo `orcamento_id`.
- `platform/docs/SCHEMA_GAP_REPORT.md`: Secoes 11.6, 11.7 e 11.8 confirmam ponte via `opportunities.orcamento_id`.

Conclusao da auditoria:

- `orcamentos.obra_id` e **opcional no codigo** (`obra_id?: string`).
- Nao ha validacao no hook que exija `obra_id` para criacao.
- Se o banco real tiver constraint `NOT NULL` em `obra_id`, o erro sera capturado de forma controlada.
- `opportunities.orcamento_id` existe e pode ser atualizado via PATCH sem migration.

#### 11.9.2 Decisao de implementacao

A criacao real de orcamento foi **implementada** como acao explicita do usuario, seguindo as regras:

```text
1. Nenhuma criacao automatica ao abrir a aba.
2. Acao disparada apenas pelo botao "Criar orcamento da oportunidade".
3. Verificacao de already_linked antes de qualquer escrita.
4. Criacao de orcamento sem obra_id (campo omitido intencionalmente).
5. Se banco bloquear por constraint NOT NULL em obra_id:
   - nenhum obra_id falso e inventado;
   - resultado retorna status 'blocked' com reason 'obra_id_required_in_db';
   - UI exibe mensagem: "Criacao bloqueada: schema atual ainda exige ajuste".
6. Se criacao for bem-sucedida:
   - PATCH em opportunities.orcamento_id com o id do orcamento criado;
   - cache invalidado (detail da oportunidade + query do orcamento).
7. obra_id = opp_<id> proibido em todo o codigo desta fase.
```

#### 11.9.3 Tipo adicionado em types.ts

```typescript
export type CreateOpportunityBudgetResult =
  | { status: 'already_linked'; orcamentoId: string; message: string }
  | { status: 'created'; orcamento: Orcamento; message: string }
  | { status: 'blocked'; reason: string; message: string }
  | { status: 'error'; error: string; message: string };
```

#### 11.9.4 Pendencia condicional de schema

Se o banco real tiver `orcamentos.obra_id NOT NULL`:

- A criacao ficara bloqueada pelo guard de erro do hook.
- A UI exibira mensagem clara de bloqueio.
- A pendencia a ser resolvida e: tornar `orcamentos.obra_id` nullable via migration ou criar coluna alternativa `opportunity_id` em `orcamentos`.
- Nenhuma migration foi criada nesta fase.

Se o banco permitir `obra_id` nulo ou ausente:

- A criacao real funcionara sem migration adicional.
- O orcamento criado tera apenas: `nome`, `status = 'rascunho'`, `bdi = 0`, `total_bruto = 0`, `total_final = 0`.
- Nenhum item de orcamento e criado nesta fase.

#### 11.9.5 Arquivos alterados na Fase 1C

- `src/hooks/useOportunidadeOrcamento.ts`: funcao `criarOrcamentoParaOportunidade` adicionada.
- `src/pages/Oportunidade/OrcamentistaTab.tsx`: UI de estado vazio, botao explicito e feedback de bloqueio/erro/sucesso.
- `src/types.ts`: tipo `CreateOpportunityBudgetResult` adicionado. Nenhum tipo legado quebrado.
- `platform/docs/SCHEMA_GAP_REPORT.md`: esta secao 11.9.

#### 11.9.6 Confirmacoes de conformidade

- Nenhum arquivo proibido foi alterado (HITLReview, geminiService, AppContext, Diario, Servicos, Cronograma, Relatorios).
- Nenhuma migration criada.
- Banco/schema nao alterado.
- Fluxo `/obras` e `/obras/:obraId` preservados intactos.
- `obra_id = opp_<id>` ausente em todo codigo desta fase.
- Criacao automatica ao abrir aba: **nao ocorre**.

#### 11.9.7 Resultado da validacao no Supabase real (Fase 1C)

Teste manual confirmou que `orcamentos.obra_id` possui constraint `NOT NULL` no banco real.

Mensagem de UI exibida: "Criacao bloqueada: o banco de dados exige obra_id em orcamentos."

O comportamento seguro implementado na Fase 1C funcionou corretamente: bloqueio detectado e reportado sem quebrar o app.

#### 11.9.8 Proposta de migration criada (Fase 1D.3)

> Status: PROPOSTA CRIADA — NAO APLICADA NO BANCO.  
> Arquivo: `platform/docs/sql_proposals/ORCAMENTISTA_001_ORCAMENTOS_OBRA_ID_NULLABLE.sql`

A migration proposta realiza **apenas** `ALTER TABLE public.orcamentos ALTER COLUMN obra_id DROP NOT NULL`.

Decisoes:

- Nao adicionar `orcamentos.opportunity_id` nesta migration.
- Nao remover a coluna `obra_id`.
- Manter FK de `obra_id` para `obras.id` (se existir).
- Manter filtro legado: `useOrcamento.ts` continua usando `obra_id` para carregar orcamento da Obra.
- Orçamentos de Oportunidade ficam com `obra_id = NULL`.
- Orçamentos de Obra existentes continuam com `obra_id` preenchido.
- `obra_id = opp_<id>` permanece proibido.
- RLS/policies devem ser auditadas antes da execucao real (Secao 1.3 do arquivo SQL).

Vinculos apos a migration:

```text
Por oportunidade (novo):
  opportunities.orcamento_id → orcamentos.id (obra_id = NULL)
                                → orcamento_itens.orcamento_id

Por obra (legado, preservado):
  orcamentos?obra_id=eq.{obraId} → orcamentos.obra_id (preenchido)
                                  → orcamento_itens.orcamento_id
```

Checklist de execucao — concluido em 2026-05-04:

- [x] Rodar pre-checks de coluna, constraints, policies e triggers.
- [x] Confirmar que nenhuma policy RLS usa obra_id como filtro obrigatorio. (qual = true em ambas)
- [x] Confirmar que nenhum trigger depende de obra_id NOT NULL. (nenhum trigger encontrado)
- [x] Executar validacao pos-migration. (is_nullable = YES confirmado)
- [x] Executar checklist de testes manuais completo.

#### 11.9.9 Migration aplicada e validada (2026-05-04)

> Status: **MIGRATION APLICADA NO BANCO REAL.**  
> Resultado: `orcamentos.obra_id` agora aceita `NULL`.

Resultado dos pre-checks antes da aplicacao:

```text
1.1: is_nullable = NO (baseline confirmado)
1.2: sem FK relacional em obra_id (apenas coluna text)
1.3: policies com qual = true (acesso livre, sem filtro por obra_id)
1.4: sem triggers em orcamentos ou orcamento_itens
1.5: idx_orcamentos_obra_id (btree, neutro — funciona com nullable)
1.6: 4 orcamentos, todos com obra_id preenchido
1.7: sem registros com obra_id = NULL antes da migration
```

Resultado da validacao pos-migration:

```text
is_nullable = YES ← confirmado
total_orcamentos = 4, com_obra_id = 4, sem_obra_id = 0 ← legados intactos
```

Resultado do teste funcional end-to-end (Fase 1C + 1D):

```text
Criacao do orcamento pela oportunidade: SUCESSO (obra_id = NULL aceito)
Adicionar item manual:                  SUCESSO (50 m2 x R$150 = R$7.500)
Editar item manual:                     SUCESSO (quantidade 50 → 60, total atualizado)
Remover item manual:                    CORRIGIDO (confirm() substituido por inline)
Legado de Obra (/obras/:obraId):        FUNCIONANDO (orcamento de R$10.106.375 carregado)
```

Contagem final pos-teste:

```text
total_orcamentos = 5
com_obra_id      = 4  ← orçamentos de Obra, intactos
sem_obra_id      = 1  ← orçamento de Oportunidade (TESTE 03)
```

Fix do botao Remover commitado: `fix: replace native confirm in opportunity budget items`


### 11.10 Decisao aplicada na Fase 1D

> Status: implementado sem migration, sem alteracao de banco.  
> Escopo: CRUD manual de itens no orcamento vinculado a oportunidade.

#### 11.10.1 Auditoria de OrcamentoItem

Campos confirmados em `src/types.ts`:

```text
id            string     obrigatorio
orcamento_id  string     obrigatorio — chave de vinculo
codigo        string?    opcional
descricao     string     obrigatorio
unidade       string     obrigatorio
quantidade    number     obrigatorio
valor_unitario number    obrigatorio
valor_total   number     calculado automaticamente (qtd * v_unit)
origem        manual|sinapi|ia   fixado como 'manual' nesta fase
created_at    string?    opcional
```

Campos minimos para criacao manual: `orcamento_id`, `descricao`, `unidade`, `quantidade`, `valor_unitario`, `valor_total`, `origem`.

#### 11.10.2 Funcoes implementadas

Todas as funcoes residem em `src/hooks/useOportunidadeOrcamento.ts`:

```text
criarItemManual(payload)         — POST orcamento_itens, origem='manual'
atualizarItemManual(itemId, patch) — PATCH orcamento_itens?id=eq.${itemId}
removerItemManual(itemId)        — DELETE orcamento_itens?id=eq.${itemId}
```

Regras comuns aplicadas em todas as funcoes:

- Guard de supabase: bloqueia se config.url ou config.key ausente.
- Guard de orcamento_id: bloqueia se nao houver orcamento vinculado a oportunidade.
- obra_id: intencionalmente omitido em todas as operacoes.
- Cache invalidado via `orcamentoKeys.itens(orcamentoId)` apos cada operacao bem-sucedida.
- Resultado tipado: `ManualBudgetItemActionResult` com status 'success' | 'removed' | 'blocked' | 'error'.

#### 11.10.3 Componente criado

`src/pages/Oportunidade/OrcamentistaManualItemsPanel.tsx`:

- Lista itens em tabela com colunas: codigo, descricao, unidade, quantidade, v.unit, total, origem, acoes.
- Formulario de criacao com campos minimos e previa de subtotal.
- Edicao inline por linha.
- Remocao com confirmacao via `confirm()`.
- Total bruto dos itens calculado no frontend como soma de `item.valor_total`.
- Feedback por acao (success, blocked, error) com auto-hide em 5s.
- Sem IA, sem pipeline, sem automacao.

#### 11.10.4 Integracao em OrcamentistaTab

`src/pages/Oportunidade/OrcamentistaTab.tsx` agora exibe:

```text
Quando !hasOrcamento:
  - Estado vazio + botao "Criar orcamento da oportunidade" (Fase 1C)

Quando hasOrcamento:
  - Secao 1: "Itens manuais do orcamento" -> OrcamentistaManualItemsPanel
  - Secao 2: "Orçamentista IA — workspace de analise" -> OrcamentistaChat
    com aviso de que dados do workspace sao staging, nao substituem itens oficiais.
```

#### 11.10.5 Tipos adicionados em types.ts

```typescript
CreateManualBudgetItemInput   — campos para criacao de item manual
UpdateManualBudgetItemInput   — Partial<CreateManualBudgetItemInput>
ManualBudgetItemActionResult  — resultado tipado das operacoes de item
```

Nenhum tipo legado foi alterado.

#### 11.10.6 Confirmacoes de conformidade

- Nenhum arquivo proibido alterado.
- Nenhuma migration criada.
- Banco/schema nao alterado.
- Fluxo `/obras` e `/obras/:obraId` preservados intactos.
- `obra_id = opp_<id>` ausente em todo codigo desta fase.
- Criacao automatica de itens: **nao ocorre**.
- `useOrcamento.ts` nao refatorado — legado de Obra preservado.

#### 11.10.7 Proximo passo executado

A Fase 1C e 1D foram validadas no banco real, a migration de `obra_id NOT NULL` foi aplicada e testada com sucesso.

### 11.11 Fase 1E: Vincular proposta ao orcamento oficial da oportunidade

> Status: validado no codigo e no banco sem necessidade de nova implementacao.
> Escopo: Auditoria e teste funcional do fluxo de geracao de proposta a partir de oportunidade.

#### 11.11.1 Auditoria do fluxo de propostas

A auditoria confirmou que a infraestrutura de propostas **ja estava completamente implementada** nas fases anteriores, aderente ao novo fluxo canonico:

1. **Schema no banco (`propostas`):**
   - Possui `id`, `opportunity_id`, `orcamento_id`, `titulo`, `status`, `valor_total`, `payload`, etc.
   - RLS `propostas_open_access` com `qual = true` (acesso livre).
   - FKs corretas, sem dependencias bloquentes de `obra_id`.

2. **Tipos (`src/types.ts`):**
   - `Proposta`, `PropostaStatus`, `CreatePropostaPayload`, `UpdatePropostaPayload` configurados.
   - `Opportunity` contem o campo `proposta_id`.

3. **Hooks (`src/hooks/usePropostas.ts`):**
   - `useCreateProposta`, `useProposta`, `usePropostas`, `useUpdateProposta` totalmente funcionais e em uso.

4. **Geracao no Frontend (`OportunidadeDetalhePage.tsx`):**
   - `handleGerarProposta()` implementada e ligada ao botao na UI.
   - Bloqueia criacao se a oportunidade nao tiver orcamento.
   - Bloqueia criacao se o orcamento vinculado nao tiver itens ("Adicione itens...").
   - Nao usa `obra_id`.
   - Popula corretamente o `payload` e salva o novo id em `opportunities.proposta_id`.

#### 11.11.2 Teste funcional end-to-end (Fase 1E)

Foi executado teste na aplicacao rodando localmente, na oportunidade "TESTE 03":

- **Passo 1:** Oportunidade possuia orcamento oficial criado e 1 item manual adicionado.
- **Passo 2:** Clique no botao "Gerar proposta comercial".
- **Passo 3:** O aplicativo validou os dados, montou o payload, inseriu na tabela `propostas`, atualizou `opportunities.proposta_id` e redirecionou para `/propostas?id=...`.
- **Passo 4:** No banco, a criacao foi confirmada (`select id, status, orcamento_id, opportunity_id, valor_total from public.propostas`).
  - `status`: 'rascunho'
  - `opportunity_id` preenchido
  - `orcamento_id` preenchido
  - `valor_total` correspondeu a soma dos itens.

#### 11.11.3 Confirmacoes de conformidade

- **Criacao automatica?** Nao. Apenas por acao explicita (`onClick={handleGerarProposta}`).
- **`obra_id = opp_<id>` usado?** Nao.
- **Criacao de Obra ou escrita em tabelas de obra?** Nao.
- **Fluxos legados / Diarios / Cronograma alterados?** Nao.
- **PDF/Envio/Workflow sofisticado?** Nao. O status inicial e estritamente "rascunho".

**Conclusao da Fase 1E:** A etapa de criacao de propostas a partir do orcamento da oportunidade esta concluida e 100% funcional.

---

### 11.12 Fase 2A: Pipeline IA Mockado

> Status: implementado sem IA real, sem migration, sem alteracao de banco.
> Escopo: estrutura visual e logica mockada do pipeline do Orcamentista IA.

#### 11.12.1 Objetivo

Criar a fundacao visual e estrutural do pipeline do Orcamentista IA, mantendo separacao
total entre a previa IA e o orcamento oficial. Nenhuma IA real foi acionada.

#### 11.12.2 Arquivos criados

- `src/lib/orcamentista/agentRegistry.ts`: registry com 21 agentes registrados.
- `src/lib/orcamentista/mockPipeline.ts`: pipeline mockado com 10 etapas e previa IA simulada.
- `src/pages/Oportunidade/OrcamentistaAiPipelinePanel.tsx`: painel visual das etapas do pipeline.
- `src/pages/Oportunidade/OrcamentistaAiPreviewPanel.tsx`: painel visual da previa IA mockada.

#### 11.12.3 Arquivos alterados

- `src/types.ts`: 6 novos tipos adicionados (OrcamentistaAgentDefinition, OrcamentistaPipelineStep,
  OrcamentistaPreviewService, OrcamentistaPreviewRisk, OrcamentistaPreviewHitl, OrcamentistaAiPreview).
- `src/pages/Oportunidade/OrcamentistaTab.tsx`: secao Workspace IA expandida com os 2 novos paineis.

#### 11.12.4 Agentes registrados (21)

reader_multimodal, classificador_documentos, planner_tecnico, civil_arquitetonico,
estrutural, eletrica_dados_automacao, hidrossanitario, impermeabilizacao,
climatizacao_exaustao_ventilacao, ppci_incendio, marcenaria_mobiliario_tecnico,
vidros_esquadrias_serralheria, acabamentos, documentacao_aprovacoes,
administracao_gestao_obra, compatibilizacao_tecnica, quantitativo, custos,
auditor, hitl_review, consolidador_preview.

#### 11.12.5 Etapas do pipeline (10)

1. briefing_inventario        — concluido (mock)
2. leitura_macro_projeto      — concluido (mock)
3. planejamento_tecnico       — concluido (mock)
4. agentes_dominio            — em_execucao 45% (mock)
5. quantitativos              — pendente
6. composicao_custos          — pendente
7. auditoria_cruzada          — pendente
8. hitl                       — pendente
9. preview_orcamento          — pendente
10. pronto_para_consolidacao  — pendente

#### 11.12.6 Confirmacoes de conformidade

- Nenhuma IA real acionada.
- Nenhum RAG.
- Nenhum PDF real lido.
- Nenhum item gravado em orcamento_itens automaticamente.
- Nenhuma consolidacao automatica.
- Orcamento oficial manual continua funcionando.
- Proposta existente nao foi alterada.
- Legado de Obra preservado.
- Arquivos proibidos nao alterados: HITLReview, geminiService, AppContext, Diario, Servicos, Cronograma, Relatorios.
- obra_id = opp_<id> ausente em todo o codigo desta fase.

#### 11.12.7 Proximo passo executado

O pipeline mockado visualizou a estrutura do fluxo de orcamento. O proximo passo executado foi criar as bases contratuais (Fase 2B) da leitura de documentos.

---

### 11.13 Fase 2B: PDF Reader + Verification Contract

> Status: implementado em nivel arquitetural (tipos e mocks) sem IA real, sem arquivos processados e sem banco alterado.
> Escopo: criar contrato rigoroso, tipagens estritas, mocks e documentacao de leitura/verificacao.

#### 11.13.1 Objetivo

Garantir que antes de qualquer IA real processar um PDF, exista um contrato tipado rigoroso. O "Reader" **nunca** gera orcamento, ele extrai "evidencias", que sofrem auditoria cruzada por um "Verifier". Se a confianca for alta e houver concordancia, os dados seguem para as disciplinas especialistas; caso contrario, o processo bloqueia na etapa de HITL.

#### 11.13.2 Arquivos criados

- `orcamentista/docs/EVIS_ORCAMENTISTA_PDF_READER_VERIFICATION_CONTRACT.md`: documento arquitetural.
- `src/lib/orcamentista/pdfReaderContract.ts`: definicao de limites/thresholds e validacoes booleanas sem IA.
- `src/lib/orcamentista/pdfReaderMock.ts`: mocks simulando inventario, renderizacao, classificacao e leitura de paginas.
- `src/lib/orcamentista/pdfReaderVerification.ts`: mock simulando a verificacao da segunda IA (com uma divergencia injetada de proposito para ativar HITL).

#### 11.13.3 Arquivos alterados

- `src/types.ts`: Adicao de multiplos tipos cobrindo todo o contrato de leitura, render, inferencia, divergencia e despacho (`OrcamentistaDocument`, `OrcamentistaPageType`, `OrcamentistaEvidenceType`, `OrcamentistaPageRender`, `OrcamentistaPageTextExtraction`, `OrcamentistaPageClassification`, `OrcamentistaExtractedItem`, `OrcamentistaInferredItem`, `OrcamentistaPrimaryPageReading`, `OrcamentistaReadingDisagreement`, `OrcamentistaReaderVerificationResult`, `OrcamentistaVerifiedPageReading`, `OrcamentistaReaderDispatchTarget`, `OrcamentistaReaderGateStatus`).
- `src/lib/orcamentista/agentRegistry.ts`: Adicionado o agente `reader_verifier` (Leitor Verificador / Auditor de Leitura).

#### 11.13.4 Confirmacoes de conformidade

- **Nenhum LLM chamado**. (Funcoes sao asynconas, simulam delay, e devolvem objetos pre-definidos).
- **Nenhum processamento de PDF real** (sem OCR ou bibliotecas geradoras de imagem).
- **Nenhum dado gravado no banco** (apenas mocks simulando comportamento).
- **Nenhuma alteracao nas tabelas/rotas de Obras ou Diarios**.
- Todo output da IA (quando existir) estara submetido a *Evidence Type* e diferenciado claramente entre *Identified* (encontrado visualmente/texto) e *Inferred* (raciocinio derivado).

#### 11.13.5 Proximo passo executado (Fase 2C)

A Fase 2C executou a camada de entrada e inventario de documentos antes de qualquer chamada real de IA.

---

### 11.14 Fase 2C: Document Intake / Upload e Inventario de Documentos

> Status: implementado como camada mockada e read-only, sem IA real, sem OCR, sem renderizacao real de PDF, sem migration e sem persistencia oficial nova.  
> Escopo: registrar visualmente documentos recebidos da oportunidade/orcamento e preparar o contrato tecnico para futura leitura por Reader + Verifier.

#### 11.14.1 Objetivo

Criar a primeira camada do fluxo documental do Orçamentista IA:

```text
Documentos recebidos
  -> inventario tecnico mockado
    -> Reader futuro
      -> Verifier futuro
        -> agentes especialistas futuros
          -> preview IA
            -> HITL
              -> consolidacao futura manual
```

Esta fase nao transforma documento em orcamento. O inventario e apenas uma leitura tecnica simulada de preparacao.

#### 11.14.2 Estrutura existente encontrada

O codigo ja possuia base segura para leitura de arquivos de oportunidade:

- `src/types.ts`: tipo `OpportunityFile`.
- `src/hooks/useOportunidades.ts`: hook `useOpportunityFiles(opportunityId, config)`.
- tabela conceitual/real esperada: `opportunity_files`.

Decisao aplicada:

- reaproveitar `useOpportunityFiles` apenas para leitura/listagem;
- nao criar upload real;
- nao criar bucket;
- nao criar migration;
- se nao houver registros ou a consulta falhar, usar fallback mockado local.

#### 11.14.3 Tipos adicionados

Foram adicionados tipos especificos do intake documental:

```text
OrcamentistaDocumentIntakeFile
OrcamentistaDocumentInventory
OrcamentistaDocumentInventoryPage
OrcamentistaDocumentProcessingStatus
OrcamentistaDocumentDisciplineSummary
OrcamentistaDocumentReadinessStatus
OrcamentistaDocumentUploadStatus
OrcamentistaDocumentInventoryPageStatus
```

Esses tipos preservam os vinculos corretos:

```text
opportunity_id
orcamento_id
```

Nao foi criado nem usado `obra_id = opp_<id>`.

#### 11.14.4 Mock de Document Intake

Arquivo criado:

- `src/lib/orcamentista/documentIntakeMock.ts`

Conteudo:

- documentos mockados da oportunidade:
  - `Projeto Arquitetônico.pdf`
  - `Memorial Descritivo.pdf`
  - `Planta Elétrica.pdf`
- status de upload/registro;
- status de processamento;
- inventario simulado;
- disciplinas detectadas;
- disciplinas ausentes;
- paginas simuladas;
- risco inicial por documento;
- adaptador para reaproveitar registros de `opportunity_files` em modo somente leitura.

#### 11.14.5 Utilitarios de inventario

Arquivo criado:

- `src/lib/orcamentista/documentInventory.ts`

Funcoes puras, sem IA e sem banco:

```text
summarizeDocumentInventory(documents)
getReadinessStatus(document)
getMissingDisciplines(documents)
getPagesRequiringVerification(document)
getBlockedPages(document)
canRunReader(document)
canDispatchToAgents(document)
```

Essas funcoes seguem as regras do contrato da Fase 2B:

- baixa confianca exige verificacao;
- pagina com HITL bloqueia evolucao automatica;
- pagina marcada como bloqueante impede consolidacao futura;
- despacho para agentes so e permitido quando Reader/Verifier/HITL nao estiverem pendentes.

#### 11.14.6 UI criada

Arquivo criado:

- `src/pages/Oportunidade/OrcamentistaDocumentsPanel.tsx`

A UI mostra:

- cabecalho "Documentos da oportunidade";
- aviso de que arquivo recebido nao e leitura validada;
- aviso de que inventario mockado nao e orcamento oficial;
- aviso de que IA real sera fase futura;
- lista de documentos;
- tipo, tamanho, fonte, status de upload, status de processamento e paginas;
- disciplinas detectadas e ausentes;
- readiness status;
- inventario por pagina com tipo, disciplina, confianca e flags:
  - Reader;
  - Verifier;
  - HITL;
  - bloqueio de consolidacao;
- alertas de documento parcial, disciplina ausente, pagina critica, baixa confianca e HITL obrigatorio;
- botao "Analisar documento" desabilitado.

#### 11.14.7 Integracao na aba do Orçamentista

Arquivo alterado:

- `src/pages/Oportunidade/OrcamentistaTab.tsx`

Hierarquia aplicada no Workspace IA:

```text
1. Documentos recebidos
2. Pipeline IA mockado
3. Previa IA mockada
4. Chat/workspace existente
```

A tela comunica que primeiro entram documentos, depois Reader/Verifier, depois agentes, depois preview, depois HITL e somente depois uma consolidacao futura manual.

#### 11.14.8 Confirmacoes de conformidade

- Nenhum LLM real chamado.
- Gemini nao foi chamado.
- OpenAI nao foi chamado.
- Claude API nao foi chamada.
- Nenhum OCR real implementado.
- Nenhum PDF real renderizado.
- Nenhuma pagina real processada.
- Nenhuma pipeline produtiva criada.
- Nenhuma migration criada.
- Schema/banco nao alterado.
- Nenhum item gravado automaticamente em `orcamento_itens`.
- Nenhuma previa consolidada no orcamento oficial.
- Proposta nao alterada.
- Diario de Obra nao alterado.
- Obra Ativa nao alterada.
- Rotas `/obras` e `/obras/:obraId` preservadas.

#### 11.14.9 Riscos restantes

- `opportunity_files` existe como hook/tipo, mas a UI de upload real ainda nao foi implementada nesta fase.
- O inventario por paginas e deterministico e mockado; ainda nao reflete paginas reais de PDFs.
- O chat/workspace existente continua separado e deve ser revisado em fase futura para alinhar totalmente com o novo intake.
- A liberacao real de Reader + Verifier dependera de decisao explicita de motor, armazenamento, custos, auditoria e HITL.

#### 11.14.10 Proximo passo executado

O passo seguinte (Fase 2D) foi estabelecer o contrato tecnico de renderizacao e processamento de paginas, atuando como ponte entre o documento bruto e a leitura IA.

---

### 11.15 Fase 2D: Page Rendering / Processing Contract

> Status: implementado como camada mockada e read-only, sem IA real, sem OCR real, sem renderizacao real de PDF, sem migration e sem persistencia oficial nova.  
> Escopo: criar o contrato tecnico (Page Processing Contract) que transforma documentos em paginas auditaveis isolando a IA do arquivo bruto.

#### 11.15.1 Objetivo

Garantir que a IA nunca interaja com o PDF bruto, prevenindo alucinacoes visuais, quebra de reprodutibilidade e falhas de rastreabilidade para o HITL. A plataforma EVIS deve desconstruir deterministicamente o PDF em imagens de alta resolucao e texto nativo por pagina antes de despachar para o Reader IA.

#### 11.15.2 Arquivos criados

- `orcamentista/docs/EVIS_ORCAMENTISTA_PAGE_RENDERING_PROCESSING_CONTRACT.md`: documento canonico descrevendo o objetivo, regras, status e pipeline futuro de renderizacao.
- `src/lib/orcamentista/pageProcessingContract.ts`: constantes, tipos de asset, limites e funcoes de pureza para gerir o ciclo de vida do render de uma pagina.
- `src/lib/orcamentista/pageProcessingMock.ts`: mock de `OrcamentistaPageProcessingJob` e `OrcamentistaRenderedPage` contendo exemplos de PDF com camada de texto, PDF vetorizado, planta escaneada e pagina corrompida.
- `src/lib/orcamentista/pageProcessingUtils.ts`: utilitarios para agrupar e resumir o inventario de imagens e textos.
- `src/pages/Oportunidade/OrcamentistaPageProcessingPanel.tsx`: painel visual de processamento de paginas.

#### 11.15.3 Arquivos alterados

- `src/types.ts`: adicionados tipos essenciais (`OrcamentistaPageProcessingStatus`, `OrcamentistaPageProcessingError`, `OrcamentistaPageReadinessForReader`, `OrcamentistaPageImageAsset`, `OrcamentistaPageTextAsset`, `OrcamentistaRenderedPage`, `OrcamentistaPageProcessingSummary`, `OrcamentistaPageProcessingJob`).
- `src/pages/Oportunidade/OrcamentistaTab.tsx`: o painel `OrcamentistaPageProcessingPanel` foi injetado imediatamente apos o painel de Intake de Documentos.

#### 11.15.4 Confirmacoes de conformidade

- **Nenhum LLM real chamado.** O processo foi inteiramente mockado para estabelecer o contrato.
- **Nenhum PDF real renderizado.** As resolucoes, caminhos e status sao strings mockadas.
- **Nenhum OCR real.** A definicao de `requires_ocr_future` atua como flag para infraestrutura futura.
- **Nenhum dado gravado no orcamento oficial.**
- **Obra/Diario totalmente preservados.**
- **Separacao de responsabilidades clara:** O documento mostra que arquivo nao e pagina renderizada, pagina nao e leitura IA, e leitura IA nao e orcamento.

#### 11.15.5 Riscos restantes

- O tamanho e custo de storage para PDFs pesados/arquitetonicos (milhares de PNGs a 300DPI) precisarao ser equacionados quando a renderizacao for implementada no backend.
- A orquestracao de OCR para plantas antigas/escaneadas e uma etapa custosa computacionalmente.

#### 11.15.6 Proximo passo executado

A Fase 2E criou o contrato visual Reader/Verifier em modo mockado, sem integracao real de IA. O objetivo foi expor a camada de leitura auditada entre paginas renderizadas e agentes especialistas.

---

### 11.16 Fase 2E: Reader/Verifier UI Contract

> Status: implementado como contrato visual e tecnico mockado, sem IA real, sem PDF real, sem banco e sem consolidacao.  
> Escopo: exibir leitura primaria, verificacao independente, divergencias, HITL, bloqueios e decisao de dispatch futuro para agentes especialistas.

#### 11.16.1 Objetivo

Criar a camada visual e contratual da leitura auditada:

```text
Documento
  -> Pagina renderizada
    -> Reader primario
      -> Verifier independente
        -> divergencias
          -> HITL
            -> bloqueio/liberacao
              -> dispatch futuro para agentes especialistas
```

Essa fase reforca que Reader nao gera orcamento. Reader produz evidencias estruturadas. Verifier audita a leitura e decide se a pagina pode seguir, exige HITL ou bloqueia consolidacao futura.

#### 11.16.2 Documento canonico criado

Arquivo criado:

- `orcamentista/docs/EVIS_ORCAMENTISTA_READER_VERIFIER_UI_CONTRACT.md`

Conteudo registrado:

- objetivo da camada Reader/Verifier;
- diferenca entre documento, pagina renderizada, leitura primaria e verificacao;
- por que Reader nao gera orcamento;
- por que Verifier nao consolida orcamento;
- diferenca entre identificado, inferido e pendente;
- `confidence_score`;
- `agreement_score`;
- `disagreement_points`;
- `requires_hitl`;
- `blocks_consolidation`;
- `dispatch_to_agents`;
- exemplos JSON;
- gates de seguranca.

#### 11.16.3 Tipos adicionados

Arquivo alterado:

- `src/types.ts`

Tipos adicionados:

```text
OrcamentistaReaderEvidenceStatus
OrcamentistaReaderEvidenceItem
OrcamentistaReaderInferredItem
OrcamentistaReaderMissingInfo
OrcamentistaReaderRun
OrcamentistaVerifierDisagreement
OrcamentistaVerifierRun
OrcamentistaReaderDispatchDecision
OrcamentistaReaderVerifierSummary
```

Esses tipos modelam:

- leitura primaria do Reader;
- evidencias identificadas;
- inferencias marcadas como nao-fato;
- informacoes pendentes;
- verificacao independente;
- divergencias por severidade;
- flags de HITL e bloqueio;
- decisao de dispatch futuro para agentes.

#### 11.16.4 Mock Reader/Verifier

Arquivo criado:

- `src/lib/orcamentista/readerVerifierMock.ts`

Cenarios simulados:

1. **Pagina de arquitetura bloqueada**
   - Reader identifica "parede a demolir".
   - Verifier aponta que nao e possivel descartar interferencia estrutural.
   - Resultado:
     - `requires_hitl = true`
     - `blocks_consolidation = true`
     - dispatch bloqueado
     - agentes alvo futuros: `estrutural`, `compatibilizacao_tecnica`

2. **Pagina eletrica liberada para agentes**
   - Reader identifica pontos eletricos e quadro de distribuicao.
   - Verifier aprova com avisos.
   - Resultado:
     - dispatch futuro permitido para `eletrica_dados_automacao` e `quantitativo`
     - inferencias permanecem marcadas como nao oficiais.

3. **Memorial exigindo HITL**
   - Reader identifica acabamento, infere rodape e marca area pendente.
   - Verifier exige HITL para decidir cruzamento documental.
   - Resultado:
     - HITL obrigatorio
     - sem consolidacao automatica.

#### 11.16.5 Utilitarios Reader/Verifier

Arquivo criado:

- `src/lib/orcamentista/readerVerifierUtils.ts`

Funcoes puras, sem IA, sem banco e sem API:

```text
getAgreementBand(score)
getReaderConfidenceBand(score)
shouldDispatchToAgents(summary)
shouldRequireReaderHitl(summary)
shouldBlockReaderConsolidation(summary)
getVerifierStatusLabel(status)
groupDisagreementsBySeverity(disagreements)
summarizeReaderVerifierRuns(runs)
```

Gates aplicados:

- baixa confianca do Reader aciona HITL;
- baixa concordancia do Verifier aciona HITL;
- divergencia `high` ou `critical` aciona HITL;
- divergencia `critical` ou `blocks_consolidation` bloqueia consolidacao futura;
- dispatch so e permitido quando Reader e Verifier nao exigem HITL, nao bloqueiam e ha agentes alvo.

#### 11.16.6 UI criada

Arquivo criado:

- `src/pages/Oportunidade/OrcamentistaReaderVerifierPanel.tsx`

A UI mostra:

- cabecalho "Reader + Verifier";
- explicacao de leitura primaria e validacao independente;
- cards de resumo:
  - paginas lidas;
  - paginas verificadas;
  - paginas liberadas para agentes;
  - paginas com HITL;
  - paginas bloqueadas;
- lista de paginas com:
  - documento;
  - pagina;
  - tipo;
  - disciplina;
  - `confidence_score`;
  - `agreement_score`;
  - status;
  - agentes alvo;
  - HITL;
  - bloqueio;
- detalhe da leitura:
  - itens identificados;
  - itens inferidos;
  - informacoes pendentes;
  - evidencias;
  - divergencias do Verifier;
  - decisao de dispatch;
- avisos:
  - "Identificado nao e inferido";
  - "Previa de leitura nao e orcamento oficial";
  - "Consolidacao sera fase futura";
- CTA desabilitado:
  - "Enviar para agentes especialistas - fase futura".

#### 11.16.7 Integracao na aba do Orçamentista

Arquivo alterado:

- `src/pages/Oportunidade/OrcamentistaTab.tsx`

Sequencia visual atual no Workspace IA:

```text
1. Documentos recebidos
2. Processamento de paginas
3. Reader + Verifier
4. Pipeline IA mockado
5. Previa IA mockada
6. Chat/workspace existente
```

Essa ordem comunica o fluxo correto:

```text
Documento -> Pagina renderizada -> Reader/Verifier -> Agentes -> Preview -> HITL -> Consolidacao futura
```

#### 11.16.8 Confirmacoes de conformidade

- Nenhuma IA real chamada.
- Gemini nao foi chamado.
- OpenAI nao foi chamado.
- Claude API nao foi chamada.
- Nenhum OCR real implementado.
- Nenhum PDF real processado.
- Nenhuma migration criada.
- Banco/schema nao alterado.
- Nenhum item gravado em `orcamento_itens`.
- Nenhuma consolidacao no orcamento oficial.
- Proposta nao alterada.
- Obra/Diario preservados.
- Rotas `/obras` e `/obras/:obraId` preservadas.

#### 11.16.9 Riscos restantes

- A execucao real do Reader e do Verifier ainda depende de definicao futura de motor, custo, observabilidade e estrategia de armazenamento.
- A UI usa mocks fixos e nao consome paginas renderizadas reais.
- O dispatch para agentes especialistas ainda e apenas decisao mockada; nenhum agente real e executado.
- HITL visual dedicado do Orçamentista ainda devera ser implementado antes de qualquer consolidacao.

#### 11.16.10 Proximo passo executado

A Fase 2F criou o HITL visual especifico do Orçamentista, ainda mockado, para revisar divergencias do Reader/Verifier antes de liberar qualquer dispatch real ou consolidacao futura.

---

### 11.17 Fase 2F: HITL Visual Especifico Do Orçamentista

> Status: implementado como camada visual mockada/local, sem IA real, sem banco, sem Diario de Obra e sem consolidacao.  
> Escopo: revisar pendencias do Orçamentista antes de dispatch futuro para agentes especialistas ou consolidacao futura.

#### 11.17.1 Objetivo

Criar uma camada dedicada de validacao humana pre-orcamento:

```text
Documento
  -> Pagina renderizada
    -> Reader primario
      -> Verifier independente
        -> Divergencia / pendencia / bloqueio
          -> HITL Orçamentista
            -> Decisao humana
              -> Liberar dispatch futuro ou manter bloqueado
```

Essa camada nao e o HITL operacional do Diario de Obra. Ela existe antes de qualquer consolidacao e apenas registra decisoes mockadas em estado local de UI.

#### 11.17.2 Documento canonico criado

Arquivo criado:

- `orcamentista/docs/EVIS_ORCAMENTISTA_HITL_UI_CONTRACT.md`

Conteudo registrado:

- objetivo do HITL do Orçamentista;
- diferenca entre HITL de orcamento e HITL do Diario;
- tipos de pendencia;
- tipos de decisao humana;
- quando bloquear consolidacao;
- quando liberar dispatch futuro;
- exemplos JSON;
- regras de seguranca.

#### 11.17.3 Tipos adicionados

Arquivo alterado:

- `src/types.ts`

Tipos adicionados:

```text
OrcamentistaHitlIssue
OrcamentistaHitlDecision
OrcamentistaHitlDecisionType
OrcamentistaHitlIssueSeverity
OrcamentistaHitlIssueStatus
OrcamentistaHitlResolution
OrcamentistaHitlQueueSummary
```

Campos previstos:

- `id`;
- `source_type`;
- `source_id`;
- `document_id`;
- `page_number`;
- `agent_id`;
- `issue_type`;
- `severity`;
- `title`;
- `description`;
- `evidence_summary`;
- `recommended_action`;
- `status`;
- `decision_type`;
- `decided_by`;
- `decided_at`;
- `blocks_consolidation`;
- `blocks_dispatch`.

#### 11.17.4 Mock HITL

Arquivo criado:

- `src/lib/orcamentista/hitlMock.ts`

Pendencias simuladas:

- demolicao sem validacao estrutural;
- baixa concordancia Reader/Verifier;
- quantidade inferida sem origem suficiente;
- disciplina estrutural ausente;
- custo sem fonte verificavel;
- PPCI pendente.

Essas pendencias cobrem severidades `critica`, `alta` e `media`, com bloqueios separados de dispatch e consolidacao.

#### 11.17.5 Utilitarios HITL

Arquivo criado:

- `src/lib/orcamentista/hitlUtils.ts`

Funcoes puras, sem API, banco ou IA:

```text
getHitlSeverityLabel()
getHitlStatusLabel()
groupHitlIssuesBySeverity()
getBlockingIssues()
canDispatchAfterHitl()
canConsolidateAfterHitl()
summarizeHitlQueue()
applyMockHitlDecision()
```

Gates aplicados:

- dispatch futuro permanece bloqueado enquanto houver `blocks_dispatch` ativo;
- consolidacao futura permanece bloqueada enquanto houver `blocks_consolidation` ativo;
- decisoes `manter_bloqueado`, `solicitar_documento` e `reanalisar_futuramente` mantem bloqueios;
- decisoes `aprovar_com_ressalva`, `marcar_como_verba` e `ignorar_nesta_fase` podem liberar dispatch local conforme o caso;
- nenhuma decisao transforma inferencia em fato.

#### 11.17.6 UI criada

Arquivo criado:

- `src/pages/Oportunidade/OrcamentistaHitlPanel.tsx`

A UI mostra:

- fila de pendencias HITL;
- resumo por severidade;
- itens bloqueantes;
- origem da pendencia;
- documento/pagina/agente relacionado;
- evidencia e acao recomendada;
- gates separados de dispatch e consolidacao;
- decisoes humanas mockadas:
  - Aprovar com ressalva;
  - Manter bloqueado;
  - Solicitar documento;
  - Marcar como verba;
  - Ignorar nesta fase;
  - Reanalisar futuramente;
- reset do mock local.

As acoes alteram apenas estado local do componente. Nada e persistido.

#### 11.17.7 Integracao na aba do Orçamentista

Arquivo alterado:

- `src/pages/Oportunidade/OrcamentistaTab.tsx`

Sequencia visual atual no Workspace IA:

```text
1. Documentos recebidos
2. Processamento de paginas
3. Reader + Verifier
4. HITL Orçamentista
5. Pipeline IA mockado
6. Previa IA mockada
7. Chat/workspace existente
```

Essa ordem comunica o fluxo correto:

```text
Documento -> Pagina -> Reader/Verifier -> HITL -> Agentes -> Preview -> Consolidacao futura
```

#### 11.17.8 Confirmacoes de conformidade

- Nenhuma IA real chamada.
- Gemini nao foi chamado.
- OpenAI nao foi chamado.
- Claude API nao foi chamada.
- Nenhum OCR real executado.
- Nenhum PDF real processado.
- Nenhuma migration criada.
- Banco/schema nao alterado.
- Nenhum item gravado em `orcamento_itens`.
- Nenhuma consolidacao no orcamento oficial.
- `src/components/HITLReview.tsx` nao foi alterado.
- Proposta nao alterada.
- Obra/Diario preservados.
- Rotas `/obras` e `/obras/:obraId` preservadas.

#### 11.17.9 Riscos restantes

- As decisoes HITL ainda sao locais e se perdem ao recarregar a tela.
- Ainda nao existe entidade persistida para auditoria HITL do Orçamentista.
- O painel nao consome pendencias reais do Reader/Verifier; usa mocks fixos.
- A liberacao real de dispatch para agentes especialistas ainda depende de orquestracao futura.

#### 11.17.10 Proximo passo executado

Fase 2G executada com contrato e UI de dispatch mockado para agentes especialistas, consumindo apenas paginas/leituras/HITLs liberados e mantendo a consolidacao oficial bloqueada.

---

### 11.18 Fase 2G: Dispatch Mockado Para Agentes Especialistas

> Status: implementado como contrato, mock e painel visual local, sem IA real, sem banco e sem consolidacao.  
> Escopo: ponte mockada entre Reader/Verifier + HITL e agentes especialistas de dominio.

#### 11.18.1 Objetivo

Criar a camada de dispatch para comunicar o fluxo:

```text
Documentos
  -> Paginas renderizadas
    -> Reader primario
      -> Verifier independente
        -> HITL Orcamentista
          -> Dispatch para agentes especialistas
            -> Outputs tecnicos mockados
              -> Preview futuro
                -> Consolidacao futura
```

Dispatch nao gera orcamento. Ele apenas encaminha evidencias auditadas e liberadas para agentes especialistas mockados.

#### 11.18.2 Documento canonico criado

Arquivo criado:

- `orcamentista/docs/EVIS_ORCAMENTISTA_AGENT_DISPATCH_CONTRACT.md`

Conteudo registrado:

- objetivo do dispatch;
- diferenca entre dispatch, agente especialista e consolidacao;
- por que dispatch nao gera orcamento;
- como o dispatch recebe dados do Reader/Verifier/HITL;
- criterios para liberar ou bloquear um agente;
- status possiveis;
- estrutura de input por agente;
- estrutura de output mockado;
- regras de seguranca;
- exemplos JSON.

#### 11.18.3 Tipos adicionados

Arquivo alterado:

- `src/types.ts`

Tipos adicionados:

```text
OrcamentistaAgentDispatchStatus
OrcamentistaAgentDispatchInput
OrcamentistaAgentDispatchJob
OrcamentistaAgentDispatchBlocker
OrcamentistaAgentOutputStatus
OrcamentistaDomainAgentOutput
OrcamentistaDomainAgentFinding
OrcamentistaDomainAgentSuggestedService
OrcamentistaDomainAgentRisk
OrcamentistaDomainAgentHitlRequest
OrcamentistaAgentDispatchSummary
```

Campos previstos:

- `id`;
- `agent_id`;
- `agent_name`;
- `discipline`;
- `status`;
- `source_page_ids`;
- `source_reader_run_ids`;
- `source_hitl_issue_ids`;
- `allowed_to_run`;
- `blockers`;
- `input_summary`;
- `started_at`;
- `finished_at`;
- `confidence_score`;
- `findings`;
- `suggested_services`;
- `risks`;
- `hitl_requests`;
- `missing_information`;
- `blocks_preview`;
- `blocks_consolidation`;
- `source_references`.

#### 11.18.4 Mock de dispatch

Arquivo criado:

- `src/lib/orcamentista/agentDispatchMock.ts`

Agentes simulados:

- `civil_arquitetonico`;
- `estrutural`;
- `eletrica_dados_automacao`;
- `hidrossanitario`;
- `ppci_incendio`;
- `acabamentos`;
- `compatibilizacao_tecnica`;
- `quantitativo`;
- `custos`;
- `auditor`.

Cenarios mockados:

- Civil liberado e concluido;
- Eletrica liberada e concluida com pendencia;
- Estrutural bloqueado por HITL;
- PPCI bloqueado por disciplina ausente;
- Acabamentos concluido com premissa inferida;
- Compatibilizacao bloqueada por baixa concordancia Reader/Verifier;
- Quantitativo aguardando outputs de dominio;
- Custos aguardando quantitativos e fonte;
- Auditor aguardando todos os agentes;
- Hidrossanitario cadastrado como slot tecnico futuro sem fonte vinculada.

#### 11.18.5 Utilitarios de dispatch

Arquivo criado:

- `src/lib/orcamentista/agentDispatchUtils.ts`

Funcoes puras, sem API, banco ou IA:

```text
getAgentDispatchStatusLabel()
getAgentOutputStatusLabel()
groupDispatchJobsByStatus()
getBlockedDispatchJobs()
getRunnableDispatchJobs()
getCompletedAgentOutputs()
summarizeAgentDispatch()
canRunDomainAgent()
canGeneratePreviewFromAgentOutputs()
getAgentBlockerReasons()
```

Gates aplicados:

- agente nao executa se `blocks_dispatch` estiver ativo;
- pendencia critica bloqueia dispatch;
- Reader/Verifier bloqueado impede agente relacionado;
- HITL bloqueante impede dispatch;
- disciplina ausente bloqueia agente compativel;
- dependencias de dominio bloqueiam quantitativo, custos e auditor;
- preview futuro fica bloqueado quando houver blocker de preview ou agente bloqueado;
- consolidacao futura permanece bloqueada quando output ou blocker marcar `blocks_consolidation`.

#### 11.18.6 UI criada

Arquivo criado:

- `src/pages/Oportunidade/OrcamentistaAgentDispatchPanel.tsx`

A UI mostra:

- cabecalho "Dispatch para agentes especialistas";
- aviso de que dispatch nao gera orcamento oficial;
- resumo de agentes totais, liberados, bloqueados, concluidos, aguardando e com HITL pendente;
- lista de agentes com status, disciplina, permissao de execucao, paginas/fontes e confianca;
- motivos de bloqueio;
- detalhe de entrada por agente;
- achados tecnicos;
- servicos sugeridos mockados marcados como nao oficiais;
- riscos;
- pendencias;
- HITL solicitado;
- flags de bloqueio de preview/consolidacao;
- CTA desabilitado "Gerar preview consolidado - fase futura".

#### 11.18.7 Integracao na aba do Orçamentista

Arquivo alterado:

- `src/pages/Oportunidade/OrcamentistaTab.tsx`

Sequencia visual atual no Workspace IA:

```text
1. Documentos recebidos
2. Processamento de paginas
3. Reader + Verifier
4. HITL Orçamentista
5. Dispatch para agentes
6. Pipeline IA mockado
7. Previa IA mockada
8. Chat/workspace existente
```

Essa ordem comunica o fluxo correto:

```text
Documento -> Pagina -> Reader/Verifier -> HITL -> Agentes especialistas -> Preview -> Consolidacao futura
```

#### 11.18.8 Confirmacoes de conformidade

- Nenhuma IA real chamada.
- Gemini nao foi chamado.
- OpenAI nao foi chamado.
- Claude API nao foi chamada.
- Nenhum OCR real executado.
- Nenhum PDF real processado.
- Nenhuma migration criada.
- Banco/schema nao alterado.
- Nenhum item gravado em `orcamento_itens`.
- Nenhuma consolidacao no orcamento oficial.
- Output de agente e apenas previa tecnica mockada.
- Proposta nao alterada.
- Obra/Diario preservados.
- Rotas `/obras` e `/obras/:obraId` preservadas.

#### 11.18.9 Riscos restantes

- O dispatch ainda e estatico e nao consome estado real de decisoes HITL locais.
- Dependencias entre agentes ainda sao declarativas no mock.
- Nao existe orquestrador real, fila real, persistencia de outputs ou auditoria operacional.
- Preview consolidado a partir de outputs de agentes ainda nao foi implementado.

#### 11.18.10 Proximo passo executado

A Fase 2H implementou o Preview Consolidado mockado a partir dos outputs dos agentes, ainda sem gravar em `orcamento_itens`, mantendo gates de HITL, preview e consolidacao separados.

---

### 11.19 Fase 2H: Preview Consolidado Mockado

> Status: implementado como camada visual mockada/local, sem IA real, sem banco, sem Diario de Obra e sem consolidacao oficial.
> Escopo: agregacao e centralizacao das recomendacoes dos agentes para validacao pre-oficial.

#### 11.19.1 Objetivo

Criar uma camada que consolida os outputs dos agentes especialistas em uma previa tecnica-orcamentaria unica, sem gravar nada no orcamento oficial, permitindo que a revisao ocorra em um painel unificado antes de qualquer acao destrutiva ou persistencia.

#### 11.19.2 Documento canonico criado

- `orcamentista/docs/EVIS_ORCAMENTISTA_CONSOLIDATED_PREVIEW_CONTRACT.md`

#### 11.19.3 Tipos adicionados

Tipos em `src/types.ts`:
- `OrcamentistaConsolidatedPreviewStatus`
- `OrcamentistaConsolidatedPreviewHitl`
- `OrcamentistaConsolidatedPreviewRisk`
- `OrcamentistaConsolidatedPreviewService`
- `OrcamentistaPreviewConsolidationBlocker`
- `OrcamentistaConsolidatedPreviewPremise`
- `OrcamentistaConsolidatedPreviewExclusion`
- `OrcamentistaConsolidatedPreviewSummary`
- `OrcamentistaConsolidatedPreview`

#### 11.19.4 Confirmacoes de conformidade

- Nenhuma IA real (Gemini, OpenAI, Claude) foi chamada.
- Nenhum PDF real processado (sem OCR real).
- Nenhuma migration criada, schema preservado.
- Nenhum item gravado em `orcamento_itens`.
- Nenhuma consolidacao no orcamento oficial.
- Proposta nao alterada.
- Obra/Diario preservados intactos.

#### 11.19.5 Proximo passo recomendado

Avancar para a Fase 2I como **Consolidation Gate Contract** / **Gate de Consolidacao Controlada**.

Essa proxima fase ainda deve ser contrato, validacao e payload simulado:

- sem gravacao direta no banco;
- sem inserts reais em `orcamento_itens`;
- sem proposta gerada a partir do preview;
- com HITL explicito de aceite do preview;
- com payload de consolidacao auditavel e rastreavel;
- com bloqueios separados para itens identificados, inferidos e premissas manuais.

A gravacao em `orcamento_itens` so deve ocorrer em fase posterior, depois de gate aprovado, HITL concluido, payload validado e autorizacao explicita.

---

### 11.20 Fase 2I: Gate de Consolidacao Mockado

> Status: implementado como camada visual/contratual mockada, sem IA real, sem banco, sem proposta, sem Obra/Diario e sem consolidacao oficial.
> Escopo: validar o preview consolidado e montar um payload simulado semelhante a `orcamento_itens` para revisao humana futura.

#### 11.20.1 Objetivo

Criar o Gate de Consolidacao entre o Preview Consolidado da Fase 2H e qualquer futura gravacao oficial. O Gate valida rastreabilidade, HITL, bloqueios, confianca de quantidade, confianca de custo e origem dos candidatos antes de montar um payload simulado.

#### 11.20.2 Documento canonico criado

- `orcamentista/docs/EVIS_ORCAMENTISTA_CONSOLIDATION_GATE_CONTRACT.md`

#### 11.20.3 Tipos adicionados

Tipos em `src/types.ts`:

- `OrcamentistaConsolidationGateStatus`
- `OrcamentistaConsolidationGate`
- `OrcamentistaConsolidationCandidateItem`
- `OrcamentistaConsolidationPayloadItem`
- `OrcamentistaConsolidationBlockedItem`
- `OrcamentistaConsolidationPendingHitlItem`
- `OrcamentistaConsolidationValidationIssue`
- `OrcamentistaConsolidationGateSummary`

#### 11.20.4 Mock e utilitarios

Arquivos criados:

- `src/lib/orcamentista/consolidationGateMock.ts`
- `src/lib/orcamentista/consolidationGateUtils.ts`

O mock usa `MOCK_CONSOLIDATED_PREVIEW` como origem e separa:

- itens aprovados para payload simulado;
- itens bloqueados por rastreabilidade, baixa confianca ou bloqueio de consolidacao;
- itens pendentes de HITL;
- issues de validacao por item;
- `can_write_to_budget = false` por contrato da fase.

Funcoes puras criadas:

```text
validatePreviewServiceForConsolidation()
buildSimulatedBudgetItemPayload()
getConsolidationBlockedItems()
getConsolidationPendingHitlItems()
getConsolidationApprovedItems()
canWriteConsolidationToBudget()
summarizeConsolidationGate()
getConsolidationGateStatusLabel()
getConsolidationIssueSeverityLabel()
```

Nenhuma funcao chama API, banco, Supabase, OCR ou IA.

#### 11.20.5 UI criada

Arquivo criado:

- `src/pages/Oportunidade/OrcamentistaConsolidationGatePanel.tsx`

A UI mostra:

- cabecalho "Gate de consolidacao";
- resumo de candidatos, aprovados, bloqueados, pendentes de HITL e payload simulado;
- indicacao "Pode gravar: nao";
- motivo do bloqueio;
- itens aprovados com quantidade, unidade, custo, origem, confianca e rastreabilidade;
- itens bloqueados com motivo, severidade, campo ausente e acao necessaria;
- pendencias HITL com acao humana requerida;
- JSON visual do payload simulado;
- CTA desabilitado "Gravar no orcamento oficial - fase futura";
- avisos de que nada foi gravado em `orcamento_itens`, o payload e simulado, itens inferidos exigem HITL e a gravacao real sera fase futura.

#### 11.20.6 Integracao na aba do Orçamentista

Arquivo alterado:

- `src/pages/Oportunidade/OrcamentistaTab.tsx`

Sequencia visual atual no Workspace IA:

```text
1. Documentos recebidos
2. Processamento de paginas
3. Reader + Verifier
4. HITL Orcamentista
5. Dispatch para agentes
6. Preview consolidado
7. Gate de consolidacao
8. Pipeline IA mockado
9. Previa IA mockada legada
10. Chat/workspace
```

#### 11.20.7 Confirmacoes de conformidade

- Nenhuma IA real chamada.
- Gemini nao foi chamado.
- OpenAI nao foi chamado.
- Claude API nao foi chamada.
- Nenhum OCR real executado.
- Nenhum PDF real processado.
- Nenhuma migration criada.
- Banco/schema nao alterado.
- Nenhum item gravado em `orcamento_itens`.
- Nenhuma consolidacao no orcamento oficial.
- Payload gerado e apenas simulado/local.
- Proposta nao alterada.
- Obra/Diario preservados.
- Rotas `/obras` e `/obras/:obraId` preservadas.

#### 11.20.8 Proximo passo recomendado

Revisar o payload simulado e criar uma fase posterior especifica para gravacao controlada, com aceite humano explicito, `orcamento_id` confirmado, auditoria e insert em `orcamento_itens` somente depois de todos os bloqueios e HITLs estarem resolvidos.

---

### 11.21 Fase 2J: Revisao Humana Do Payload Simulado

> Status: implementado como UI e contrato mockados, sem IA real, sem banco, sem proposta, sem Obra/Diario e sem gravacao oficial.
> Escopo: revisar item por item do payload simulado gerado pelo Gate de Consolidacao antes de qualquer fase futura de persistencia.

#### 11.21.1 Objetivo

Criar a camada Human Review / Payload Approval UI do Orçamentista IA:

```text
Payload simulado
  -> revisao humana local
    -> aprovar item
    -> rejeitar item
    -> editar item localmente
    -> manter pendente
    -> solicitar validacao
    -> resumo de aprovacao
    -> fase futura: gravacao controlada em orcamento_itens
```

#### 11.21.2 Documento canonico criado

- `orcamentista/docs/EVIS_ORCAMENTISTA_PAYLOAD_REVIEW_CONTRACT.md`

O documento registra:

- diferenca entre payload simulado, item aprovado e item gravado;
- motivo para nao gravar em `orcamento_itens` nesta fase;
- tipos de decisao humana;
- regras de aprovacao, rejeicao, edicao e pendencia;
- rastreabilidade obrigatoria;
- exemplos JSON;
- requisitos para futura gravacao real controlada.

#### 11.21.3 Tipos adicionados

Tipos em `src/types.ts`:

- `OrcamentistaPayloadReviewStatus`
- `OrcamentistaPayloadReviewItemStatus`
- `OrcamentistaPayloadReviewDecisionType`
- `OrcamentistaPayloadReviewSession`
- `OrcamentistaPayloadReviewItem`
- `OrcamentistaPayloadReviewDecision`
- `OrcamentistaPayloadReviewEditPatch`
- `OrcamentistaPayloadReviewSummary`

#### 11.21.4 Mock e utilitarios

Arquivos criados:

- `src/lib/orcamentista/payloadReviewMock.ts`
- `src/lib/orcamentista/payloadReviewUtils.ts`

O mock usa `MOCK_CONSOLIDATION_GATE` como origem e simula:

- item aprovado;
- item rejeitado;
- item editado localmente;
- item pendente de HITL;
- item bloqueado por rastreabilidade;
- sessao geral com `can_write_to_budget = false`.

Funcoes puras criadas:

```text
createPayloadReviewSession()
applyPayloadReviewDecision()
canApprovePayloadItem()
canEditPayloadItem()
canRejectPayloadItem()
getPayloadReviewBlockingReasons()
summarizePayloadReview()
getPayloadReviewStatusLabel()
getPayloadReviewItemStatusLabel()
```

Nenhuma funcao chama API, banco, Supabase, OCR ou IA.

#### 11.21.5 UI criada

Arquivo criado:

- `src/pages/Oportunidade/OrcamentistaPayloadReviewPanel.tsx`

A UI mostra:

- cabecalho "Revisao humana do payload";
- resumo de total, aprovados, editados, rejeitados, pendentes, bloqueados, valor revisado e "Pode gravar: nao";
- lista de itens com descricao, unidade, quantidade, valor unitario, total, origem, status, rastreabilidade, bloqueios e decisao atual;
- detalhe do item com payload original, payload editado, `source_agent_ids`, `source_page_refs`, `source_evidence_refs`, `confidence_score`, `traceability_score` e `simulated_only`;
- acoes mockadas locais: aprovar, rejeitar, editar, manter pendente e solicitar validacao;
- CTA desabilitado "Gravar itens aprovados no orcamento oficial - fase futura";
- avisos obrigatorios: nenhuma decisao foi persistida, nenhum item foi gravado em `orcamento_itens` e gravacao real exigira autorizacao explicita em fase futura.

#### 11.21.6 Integracao na aba do Orçamentista

Arquivo alterado:

- `src/pages/Oportunidade/OrcamentistaTab.tsx`

Sequencia visual atual no Workspace IA:

```text
1. Documentos recebidos
2. Processamento de paginas
3. Reader + Verifier
4. HITL Orcamentista
5. Dispatch para agentes
6. Preview consolidado
7. Gate de consolidacao
8. Revisao humana do payload
9. Pipeline IA mockado
10. Previa IA mockada legada
11. Chat/workspace
```

Essa ordem comunica:

```text
Documento -> Pagina -> Reader/Verifier -> HITL -> Agentes -> Preview -> Gate -> Revisao humana -> Gravacao futura
```

#### 11.21.7 Confirmacoes de conformidade

- Revisao humana nao grava no banco.
- Decisoes sao locais/mockadas.
- Nenhum item aprovado e enviado ao Supabase.
- Nenhum item rejeitado e deletado do banco.
- Edicao altera apenas estado local/mockado.
- Itens sem rastreabilidade nao podem ser aprovados.
- Itens com HITL pendente iniciam pendentes.
- Itens inferidos exigem validacao humana explicita.
- `can_write_to_budget` permanece `false`.
- Botao de gravacao real permanece desabilitado.
- Nenhuma IA real chamada.
- Gemini nao foi chamado.
- OpenAI nao foi chamado.
- Claude API nao foi chamada.
- Nenhum OCR real executado.
- Nenhum PDF real processado.
- Nenhuma migration criada.
- Banco/schema nao alterado.
- Nenhum item gravado em `orcamento_itens`.
- Nenhuma consolidacao no orcamento oficial.
- Proposta nao alterada.
- Obra/Diario preservados.
- Rotas `/obras` e `/obras/:obraId` preservadas.

#### 11.21.8 Proximo passo recomendado

A proxima fase deve ser uma gravacao controlada em `orcamento_itens` somente apos aprovacao explicita do usuario, confirmacao de `orcamento_id`, auditoria de RLS/schema, recalculo do payload final e persistencia auditavel das decisoes humanas.

---

### 11.22 Fase 3A: Motor Selection & Reader Safety Policy

> Status: implementado como politica tecnica e funcoes puras locais, sem IA real, sem banco, sem PDF/OCR real e sem alteracao de UI.
> Escopo: formalizar selecao de motores, safety rules do Reader e sanity checks dimensionais antes de qualquer leitura real.

#### 11.22.1 Benchmark de motores

Benchmark externo registrado:

- GPT-5.5 teve melhor equilibrio geral, boa organizacao e boa capacidade de auditoria, mas ainda exige schema rigido.
- Claude teve boa leitura ampla, mas cometeu erro critico de dimensao: leu estaca como `35 m` quando o correto era `3,5 m`, com confianca alta e sem HITL.
- Gemini 3.1 foi conservador e bloqueou dados ilegíveis, mas falhou como Reader primario em tabelas/imagens comprimidas.

Decisao:

```text
Nenhum motor pode consolidar dimensao critica sozinho.
```

#### 11.22.2 Documento canonico criado

- `orcamentista/docs/EVIS_ORCAMENTISTA_MOTOR_SELECTION_AND_READER_SAFETY_POLICY.md`

O documento registra:

- objetivo da politica;
- resultado do benchmark;
- funcao recomendada para cada motor;
- papeis de Reader, Verifier, Auditor final e agentes especialistas;
- regras para PDF rasterizado, PDF vetorial, tabelas ilegíveis, cotas criticas e quantitativos;
- regras para `confidence_score`, `agreement_score`, HITL e bloqueio de consolidacao;
- falhas esperadas;
- exemplo critico da estaca `35 m` vs `3,5 m`;
- politica de custo x beneficio.

#### 11.22.3 Tipos adicionados

Tipos em `src/types.ts`:

- `OrcamentistaAiMotorId`
- `OrcamentistaAiMotorRole`
- `OrcamentistaMotorCostProfile`
- `OrcamentistaMotorRiskProfile`
- `OrcamentistaMotorSelectionPolicy`
- `OrcamentistaMotorCapability`
- `OrcamentistaReaderSafetyRule`
- `OrcamentistaCriticalDimensionType`
- `OrcamentistaDimensionalSanityCheck`
- `OrcamentistaSafetyGateResult`
- `OrcamentistaReadingSourceQuality`
- `OrcamentistaCriticalReadingPolicy`

#### 11.22.4 Politica de selecao de motor

Arquivo criado:

- `src/lib/orcamentista/motorSelectionPolicy.ts`

Configuracao estatica:

- GPT-5.5 como Reader primario inicial e Auditor final;
- Gemini 3.1 como Verifier conservador e safety checker;
- Claude como apoio textual/qualitativo e compatibilizacao narrativa.

Funcoes puras:

```text
getRecommendedMotorForRole()
getMotorPolicy()
shouldUseSecondaryVerifier()
shouldUseClaudeForQualitativeReview()
getMotorRiskProfile()
```

Nenhuma funcao chama IA/API.

#### 11.22.5 Politica de seguranca do Reader

Arquivo criado:

- `src/lib/orcamentista/readerSafetyPolicy.ts`

Regras implementadas:

- PDF rasterizado reduz confianca maxima;
- tabela ilegivel bloqueia extracao quantitativa;
- cota critica exige Verifier;
- fundacao exige HITL;
- estaca exige HITL para profundidade, diametro e quantidade;
- quantitativo de aco exige fonte explicita ou quadro de armacao;
- volume de concreto derivado de cota visual exige sanity check;
- sondagem com endereco divergente bloqueia uso como evidencia;
- inferencia nunca pode virar fato.

Funcoes puras:

```text
getSafetyRulesForReadingContext()
applyReaderSafetyRules()
shouldForceHitlForReading()
shouldBlockReadingConsolidation()
getMaxAllowedConfidenceForSource()
classifyReadingSourceQuality()
```

Nenhuma funcao chama IA/API, banco ou OCR.

#### 11.22.6 Checagens dimensionais

Arquivo criado:

- `src/lib/orcamentista/dimensionalSanityChecks.ts`

Checagens iniciais:

- estaca residencial de diametro aproximado 25 cm acima de 15 m vira critica e bloqueia consolidacao;
- estaca acima de 8 m exige HITL;
- estaca menor que 1 m exige HITL;
- volume calculado de estaca que nao bate com resumo de concreto bloqueia;
- ambiguidade decimal `35 m` vs `3,5 m` bloqueia e exige HITL;
- area de laje calculada visualmente exige HITL;
- area de laje incompatível com ambiente/planta bloqueia;
- aco por coeficiente e inferido, nao identificado;
- sem quadro de armacao, aco nao consolida.

Funcoes puras:

```text
checkPileDepthSanity()
checkPileVolumeConsistency()
checkDecimalAmbiguity()
checkSlabAreaSanity()
checkSteelQuantitySource()
runDimensionalSanityChecks()
```

#### 11.22.7 Confirmacoes de conformidade

- Nenhuma IA real chamada.
- Gemini real nao foi chamado.
- OpenAI nao foi chamado.
- Claude API nao foi chamada.
- Nenhum OCR real executado.
- Nenhum PDF real processado.
- Nenhuma migration criada.
- Banco/schema nao alterado.
- Nenhum item gravado em `orcamento_itens`.
- Nenhuma consolidacao no orcamento oficial.
- Proposta nao alterada.
- Obra/Diario preservados.
- Rotas `/obras` e `/obras/:obraId` preservadas.
- UI nao foi alterada nesta fase.

#### 11.22.8 Proximo passo recomendado

Executar uma primeira leitura real controlada de uma pagina isolada somente depois de aplicar:

- output schema rigido;
- selecao de motor pela policy;
- Verifier obrigatorio quando houver cota critica, baixa qualidade visual ou inferencia;
- safety rules do Reader;
- sanity checks dimensionais;
- HITL antes de qualquer consolidacao;
- Gate e Revisao Humana antes de qualquer gravacao real em `orcamento_itens`.

---

### 11.23 Fase 3B: Primeira leitura real controlada em sandbox

> Status: implementado como sandbox local/manual, sem chamada real de IA, sem banco e sem PDF real.
> Escopo: uma pagina isolada, prompt package, normalizacao, safety runner e painel experimental.

#### 11.23.1 Objetivo aplicado

A Fase 3B criou a primeira estrutura segura para leitura real futura de uma unica pagina do Orçamentista IA.

Regras preservadas:

- uma pagina isolada;
- nenhum processamento de PDF inteiro;
- nenhum processamento multipagina;
- nenhuma gravacao em `orcamento_itens`;
- nenhuma consolidacao no orcamento oficial;
- nenhuma proposta criada;
- nenhuma Obra criada;
- Diario de Obra preservado;
- nenhuma migration ou alteracao de schema.

#### 11.23.2 Documento canonico criado

- `orcamentista/docs/EVIS_ORCAMENTISTA_FIRST_REAL_READER_SANDBOX.md`

O documento registra:

- objetivo da sandbox;
- motivo de limitar a uma pagina;
- motivo de nao gravar no banco;
- formato do prompt do Reader;
- formato do prompt do Verifier;
- JSON esperado;
- aplicacao das policies da Fase 3A;
- aplicacao dos sanity checks;
- regras para PDF rasterizado;
- regra para dimensoes criticas;
- tratamento do erro `35 m` vs `3,5 m`;
- criterios para avancar para leitura real de mais paginas.

#### 11.23.3 Tipos adicionados

Tipos em `src/types.ts`:

- `OrcamentistaFirstPageReadingStatus`
- `OrcamentistaReaderSourceRef`
- `OrcamentistaRawReaderItem`
- `OrcamentistaRawReaderRisk`
- `OrcamentistaRawReaderHitlRequest`
- `OrcamentistaReaderCriticalDimension`
- `OrcamentistaRawReaderModelOutput`
- `OrcamentistaNormalizedReaderOutput`
- `OrcamentistaReaderPromptPackage`
- `OrcamentistaVerifierPromptPackage`
- `OrcamentistaRealReaderSandboxInput`
- `OrcamentistaReaderSafetyRunnerResult`
- `OrcamentistaRealReaderSandboxResult`

#### 11.23.4 Prompt templates

Arquivo criado:

- `src/lib/orcamentista/readerPromptTemplates.ts`

Funcoes:

```text
buildPrimaryReaderPrompt()
buildVerifierPrompt()
```

O prompt do Reader instrui:

- nao gerar orcamento;
- nao criar item oficial;
- nao inventar;
- separar `identified_items`, `inferred_items`, `missing_information`, `risks` e `hitl_requests`;
- exigir fonte/evidencia;
- marcar `critical_dimensions`;
- exigir HITL em duvida;
- nao afirmar conformidade normativa.

#### 11.23.5 Normalizador

Arquivo criado:

- `src/lib/orcamentista/readerResultNormalizer.ts`

Funcoes puras:

```text
normalizeRawReaderOutput()
validateReaderOutputShape()
coerceReaderConfidenceScores()
extractCriticalDimensionsFromReaderOutput()
flagMissingSourceReferences()
```

O normalizador:

- valida se o output e JSON/objeto auditavel;
- exige arrays principais;
- limita confidence score;
- transforma identificado em evidencia;
- mantem inferido como `can_be_treated_as_fact: false`;
- preserva `missing_information`, `risks` e `hitl_requests`;
- extrai dimensoes criticas;
- sinaliza fonte ausente.

#### 11.23.6 Safety runner

Arquivo criado:

- `src/lib/orcamentista/readerSafetyRunner.ts`

Funcoes puras:

```text
runReaderSafetyGate()
applySourceQualityConfidenceCap()
applyCriticalDimensionChecks()
determineReaderVerifierRequirement()
determineReaderHitlRequirement()
determineReaderDispatchEligibility()
```

O runner aplica:

- `readerSafetyPolicy.ts`;
- `dimensionalSanityChecks.ts`;
- `motorSelectionPolicy.ts`;
- teto de confianca por qualidade de fonte;
- Verifier obrigatorio para cota critica, fundacao, estaca, inferencia ou fonte ruim;
- HITL para ambiguidades, fundacao/estaca e fonte insuficiente;
- bloqueio de consolidacao quando sanity checks ou safety rules exigirem.

#### 11.23.7 Sandbox implementada

Arquivo criado:

- `src/lib/orcamentista/realReaderSandbox.ts`

Pipeline:

```text
input de uma pagina
  -> prompt package do Reader
  -> raw output mock/manual
  -> normalizador
  -> safety runner
  -> prompt package do Verifier
  -> resultado final da sandbox
```

O arquivo contem mock estrutural do caso `35 m` vs `3,5 m` para validar bloqueio.

Status declarado:

```text
manual model run ready
```

Nao ha `fetch`, nao ha API key e nao ha chamada real de IA.

#### 11.23.8 UI experimental

Arquivos:

- `src/pages/Oportunidade/OrcamentistaRealReaderSandboxPanel.tsx`
- `src/pages/Oportunidade/OrcamentistaTab.tsx`

O painel foi integrado no final da secao Workspace IA e mostra:

- pagina isolada;
- motor recomendado;
- prompt package;
- output normalizado;
- safety gates;
- dimensional checks;
- HITL;
- bloqueios;
- CTA desabilitado: `Executar leitura real integrada — fase futura`.

O painel nao tem acao de escrita e nao chama IA/API.

#### 11.23.9 Tratamento do erro 35 m vs 3,5 m

O mock da sandbox declara uma profundidade de estaca:

```text
E1 Ø25 h=35m
```

Tratamento esperado:

- PDF rasterizado aplica teto de confianca;
- fundacao/estaca aciona Verifier obrigatorio;
- `checkPileDepthSanity()` bloqueia profundidade residencial de 25 cm acima de 15 m;
- `checkDecimalAmbiguity()` bloqueia ambiguidade `35 m` vs `3,5 m`;
- HITL obrigatorio;
- `blocks_consolidation = true`;
- `allowed_to_dispatch = false`;
- nenhum item oficial e gravado.

#### 11.23.10 Confirmacoes de conformidade

- Nenhuma IA real chamada.
- Gemini real nao foi chamado.
- OpenAI nao foi chamado.
- Claude API nao foi chamada.
- Nenhum OCR real executado.
- Nenhum PDF real processado.
- Nenhuma migration criada.
- Banco/schema nao alterado.
- Nenhum item gravado em `orcamento_itens`.
- Nenhuma consolidacao no orcamento oficial.
- Proposta nao alterada.
- Obra/Diario preservados.
- Rotas `/obras` e `/obras/:obraId` preservadas.

#### 11.23.11 Proximo passo recomendado

Executar teste real de uma unica pagina com o motor escolhido, colar o JSON retornado no pipeline manual, comparar com Verifier independente e registrar:

- aderencia ao schema;
- diferencas entre Reader e Verifier;
- sanity checks acionados;
- HITL exigido;
- motivo de bloqueio ou elegibilidade futura para dispatch.

---

### 11.24 Fase 3C: Missing Project Fallback & Estimated Scope Policy

> Status: implementado como politica local, mocks e UI experimental, sem IA real, sem banco e sem consolidacao.
> Escopo: projetos ausentes, estimativas controladas, avisos, HITL e bloqueios executivos.

#### 11.24.1 Objetivo aplicado

A Fase 3C criou a camada de fallback para quando uma disciplina nao possui projeto proprio, permitindo continuidade do orçamento preliminar sem tratar estimativa como fato.

Regras aplicadas:

- projeto ausente nao bloqueia automaticamente orçamento preliminar;
- projeto ausente bloqueia execucao e consolidacao final sem ressalva;
- item sem projeto nunca e classificado como identificado;
- item sem projeto usa `ESTIMATED_WITHOUT_PROJECT`, `MANUAL_ASSUMPTION` ou evidencia indireta;
- evidencias indiretas de outros documentos usam `INDIRECT_EVIDENCE_FROM_PROJECT_DOCUMENTS`;
- estimativa pode alimentar orçamento preliminar e proposta futura com aviso;
- estimativa nao pode alimentar execucao sem validacao;
- disciplinas criticas exigem HITL;
- escopo de seguranca/legalizacao bloqueia consolidacao executiva.

#### 11.24.2 Documento canonico criado

- `orcamentista/docs/EVIS_ORCAMENTISTA_MISSING_PROJECT_FALLBACK_POLICY.md`

O documento registra:

- objetivo da politica;
- diferenca entre projeto lido, inferencia, estimativa sem projeto, premissa manual e exclusao;
- quando permitir orçamento preliminar;
- quando bloquear consolidacao;
- quando exigir HITL;
- como estimar eletrica sem projeto;
- como estimar hidrossanitario sem projeto;
- como tratar sondagem, estrutural, PPCI, HVAC e acabamentos;
- exemplos JSON;
- relacao com SINAPI, CUB e historico interno;
- proibicao de tratar estimativa como fato.

#### 11.24.3 Tipos adicionados

Tipos em `src/types.ts`:

- `OrcamentistaScopeOriginType`
- `OrcamentistaMissingProjectDiscipline`
- `OrcamentistaScopeConfidenceLevel`
- `OrcamentistaFallbackDecisionType`
- `OrcamentistaEstimateBasisType`
- `OrcamentistaEstimateBasis`
- `OrcamentistaFallbackWarning`
- `OrcamentistaEstimatedScopeItem`
- `OrcamentistaMissingProjectFallback`
- `OrcamentistaFallbackSummary`

Origem critica adicionada:

```text
INDIRECT_EVIDENCE_FROM_PROJECT_DOCUMENTS
```

Essa origem e obrigatoria quando uma disciplina esta sem projeto proprio, mas o EVIS usa evidencias indiretas de arquitetonico, memorial, layout, implantacao ou interiores.

#### 11.24.4 Politica de projeto ausente

Arquivo criado:

- `src/lib/orcamentista/missingProjectPolicy.ts`

Funcoes puras:

```text
getMissingProjectPolicyForDiscipline()
canProceedWithoutProject()
shouldBlockFinalConsolidationWithoutProject()
shouldRequireHitlForMissingProject()
getFallbackModesForDiscipline()
getWarningForEstimatedScope()
```

Disciplinas cobertas:

- arquitetonico;
- sondagem;
- estrutural;
- eletrico;
- hidrossanitario;
- PPCI;
- HVAC/climatizacao;
- acabamentos/memorial.

Nenhuma funcao chama IA/API/banco.

#### 11.24.5 Mock de fallback

Arquivo criado:

- `src/lib/orcamentista/estimatedScopeFallbackMock.ts`

Casos simulados:

- projeto eletrico ausente com estimativa por evidencias indiretas do arquitetonico/memorial;
- projeto hidrossanitario ausente com estimativa por areas molhadas e aparelhos;
- sondagem ausente bloqueando fundacao para consolidacao;
- PPCI ausente permitindo verba, mas bloqueando execucao/legalizacao;
- memorial de acabamentos ausente com premissa de padrao medio;
- arquitetonico ausente bloqueando inicio racional;
- HVAC ausente com verba preliminar por ambientes/premissas.

#### 11.24.6 Utilitarios

Arquivo criado:

- `src/lib/orcamentista/estimatedScopeUtils.ts`

Funcoes puras:

```text
summarizeEstimatedFallbacks()
groupFallbacksByDiscipline()
getFallbackBlockingItems()
getFallbackWarnings()
canFeedPreliminaryBudget()
canFeedProposalWithWarnings()
canFeedExecution()
calculateEstimatedFallbackTotal()
getScopeOriginLabel()
getFallbackDecisionLabel()
```

Nenhuma funcao chama IA/API/banco.

#### 11.24.7 UI experimental

Arquivos:

- `src/pages/Oportunidade/OrcamentistaMissingProjectFallbackPanel.tsx`
- `src/pages/Oportunidade/OrcamentistaTab.tsx`

O painel foi integrado na secao Workspace IA logo apos Documentos:

```text
Documentos
→ Projetos ausentes / estimativas controladas
→ Processamento de paginas
→ Reader/Verifier
→ HITL
→ Agentes
→ Preview
→ Gate
→ Revisao humana
```

A UI mostra:

- disciplinas com projeto;
- disciplinas ausentes;
- estimativas permitidas;
- escopos bloqueados;
- HITLs pendentes;
- valor estimado preliminar;
- base de estimativa;
- itens estimados;
- avisos;
- botoes mockados de decisao local.

Avisos obrigatorios exibidos:

- `Estimado sem projeto.`
- `Nao e item identificado em projeto.`
- `Revisar após recebimento do projeto executivo.`
- `Nao consolidado no orçamento oficial nesta fase.`

#### 11.24.8 Evidencia indireta obrigatoria

Quando uma disciplina esta sem projeto proprio, mas existem outros documentos do mesmo projeto/orçamento, o EVIS pode usar evidencias indiretas como:

- area construida;
- quantidade e tipo de ambientes;
- banheiros;
- cozinha, lavanderia, area gourmet e areas externas;
- padrao da obra;
- pontos provaveis por ambiente;
- equipamentos especiais;
- forros/sancas/luminotecnica;
- memorial ou premissas do cliente.

Classificacao obrigatoria:

```text
INDIRECT_EVIDENCE_FROM_PROJECT_DOCUMENTS
```

Proibido classificar como:

```text
IDENTIFIED_FROM_PROJECT
IDENTIFIED_FROM_ELECTRICAL_PROJECT
```

Resultado:

- pode alimentar orçamento preliminar;
- pode alimentar proposta com aviso;
- exige HITL;
- baixa/media confianca;
- bloqueia execucao;
- bloqueia consolidacao final;
- revisao obrigatoria quando o projeto executivo chegar.

#### 11.24.9 Confirmacoes de conformidade

- Nenhuma IA real chamada.
- Gemini real nao foi chamado.
- OpenAI nao foi chamado.
- Claude API nao foi chamada.
- Nenhum OCR real executado.
- Nenhum PDF real processado.
- Nenhuma migration criada.
- Banco/schema nao alterado.
- Nenhum item gravado em `orcamento_itens`.
- Nenhuma consolidacao no orcamento oficial.
- Proposta nao alterada.
- Obra/Diario preservados.
- Rotas `/obras` e `/obras/:obraId` preservadas.

#### 11.24.10 Proximo passo recomendado

Implementar Guided Project Intake + Reading HITL Context, integrando essa politica ao inventario de documentos:

- detectar quais disciplinas estao ausentes;
- apresentar perguntas guiadas por disciplina;
- coletar premissas do usuario;
- anexar evidencias indiretas lidas pelo Reader;
- manter tudo como staging ate gate/HITL/revisao humana.

---

### 11.25 Fase 3D-A: Guided Project Intake + Reading HITL Context

> Status: implementado apenas como tipos, documento canonico e policy pura.
> Escopo: sem mock, sem utils, sem UI, sem banco e sem IA real.

#### 11.25.1 Objetivo aplicado

A Fase 3D-A criou a base canonica para guiar a entrada de documentos do Orçamentista IA na ordem racional de uma obra do zero e separar contexto de leitura em:

- validado;
- pendente;
- bloqueado.

Regras registradas:

- usuario nao precisa enviar todos os arquivos de uma vez;
- sistema solicita o proximo documento de forma inteligente;
- documento fora de ordem pode ser lido (`allowed_to_read = true`);
- documento fora de ordem fica com `context_status = incomplete`;
- contexto pendente nao alimenta quantitativos finais;
- correcoes humanas substituem leituras ambiguas;
- projetos ausentes acionam Missing Project Fallback da Fase 3C quando aplicavel.

#### 11.25.2 Documento canonico criado

- `orcamentista/docs/EVIS_ORCAMENTISTA_GUIDED_PROJECT_INTAKE_AND_READING_HITL_CONTEXT.md`

O documento explica:

- objetivo do intake guiado;
- diferenca entre leitura isolada e leitura contextual;
- storytelling tecnico da obra;
- ordem racional de documentos;
- documento fora de ordem;
- HITL por leitura;
- contexto validado, pendente e bloqueado;
- solicitacao inteligente do proximo documento;
- integracao com Missing Project Fallback;
- exemplo de fundacao enviada antes da sondagem;
- exemplo de projeto eletrico ausente com estimativa controlada.

#### 11.25.3 Tipos adicionados

Tipos em `src/types.ts`:

- `OrcamentistaReadingPhase`
- `OrcamentistaProjectReadingSession`
- `OrcamentistaProjectContextStory`
- `OrcamentistaReadingPhaseStatus`
- `OrcamentistaExpectedDocument`
- `OrcamentistaReceivedDocumentContext`
- `OrcamentistaReadingHitlQuestion`
- `OrcamentistaReadingValidationDecision`
- `OrcamentistaValidatedProjectContext`
- `OrcamentistaPendingProjectContext`
- `OrcamentistaBlockedProjectContext`
- `OrcamentistaNextDocumentRequest`
- `OrcamentistaContextPropagationStatus`

Nenhum tipo generico sem prefixo foi criado.

#### 11.25.4 Policy criada

Arquivo criado:

- `src/lib/orcamentista/guidedProjectIntakePolicy.ts`

Conteudo:

- configuracao estatica da ordem racional;
- documentos esperados por fase;
- classificacao de documento recebido;
- solicitacao do proximo documento;
- decisao de leitura fora de ordem;
- acionamento do Missing Project Fallback quando aplicavel.

Funcoes puras:

```text
getExpectedDocumentsForPhase()
getNextReadingPhase()
canAdvanceReadingPhase()
classifyReceivedDocumentForReadingPhase()
getMissingDocumentsForCurrentPhase()
buildNextDocumentRequest()
shouldAllowOutOfOrderReading()
shouldActivateMissingProjectFallback()
```

Nenhuma funcao chama IA, API, banco, Supabase, `fetch` ou `axios`.

#### 11.25.5 Confirmacoes de conformidade

- Nenhum mock criado.
- Nenhum util criado.
- Nenhum painel criado.
- `OrcamentistaTab.tsx` nao foi alterado.
- Nenhum arquivo de Obra/Diario foi alterado.
- Nenhuma migration criada.
- Banco/schema nao alterado.
- Nenhuma IA real chamada.
- Nenhum PDF real processado.
- Nenhum OCR executado.

#### 11.25.6 Proximo passo recomendado

Executar a subfase 3D-B:

```text
mock + utils
```

Somente depois da 3D-B considerar painel ou integracao visual em fase separada.

---

### 11.26 Fase 3D-B: Reading HITL Context Mock + Utils

> Status: implementado somente como mock e utilitarios puros.
> Escopo: sem painel, sem UI, sem integracao em `OrcamentistaTab.tsx`, sem banco e sem IA real.

#### 11.26.1 Objetivo aplicado

A Fase 3D-B criou a simulacao de uma sessao de leitura guiada com HITL por etapa para uma obra residencial do zero.

Cenario simulado:

- arquitetonico/implantacao recebido parcialmente;
- fase atual em sondagem/topografia;
- sondagem pendente;
- prancha de fundacao recebida fora de ordem;
- leitura permitida, mas contexto marcado como incompleto;
- HITLs gerados por ambiguidades e documentos ausentes;
- decisoes humanas simuladas;
- contexto validado, pendente e bloqueado separado;
- sistema solicita os proximos documentos corretos.

#### 11.26.2 Mock criado

Arquivo criado:

- `src/lib/orcamentista/readingHitlContextMock.ts`

Exports principais:

```text
MOCK_PROJECT_READING_SESSION
MOCK_READING_HITL_QUESTIONS
MOCK_READING_VALIDATION_DECISIONS
MOCK_VALIDATED_PROJECT_CONTEXT
MOCK_PENDING_PROJECT_CONTEXT
MOCK_BLOCKED_PROJECT_CONTEXT
```

#### 11.26.3 HITLs simulados

HITLs de leitura criados:

- quantidade de estacas: 21 unidades vs possivel ambiguidade textual;
- C25/R25 ou nomenclatura da estaca;
- P6 indicado como `nasce`;
- P23 aparecendo em corte, mas nao consolidado na tabela principal;
- sondagem ausente;
- relatorio de esforcos da fundacao ausente;
- fck/concreto por elemento divergente entre nota geral e tabela.

#### 11.26.4 Decisoes humanas simuladas

Decisoes mockadas:

- validar 21 estacas;
- validar C25 como estaca Ø25 cm;
- manter P6 como pendente ate prancha de superestrutura;
- marcar sondagem/topografia como documento pendente obrigatorio;
- manter fundacao bloqueada para consolidacao e solicitar relatorio de esforcos.

#### 11.26.5 Contextos separados

Contexto validado parcialmente:

- tipo de obra residencial;
- endereco mockado;
- arquitetonico/implantacao parcial como base de storytelling;
- fundacao com 21 estacas C25/Ø25 cm validada somente em quantidade/diametro;
- profundidade real das estacas nao validada.

Contexto pendente:

- sondagem/topografia;
- relatorio de esforcos;
- profundidade real das estacas;
- P6 como `nasce`;
- P23 em corte fora da tabela principal;
- confirmacao de fck por elemento.

Contexto bloqueado:

- consolidacao da fundacao;
- quantitativos finais de fundacao;
- uso da fundacao para orçamento executivo;
- inicio de custos finais.

#### 11.26.6 Utilitarios criados

Arquivo criado:

- `src/lib/orcamentista/readingHitlContextUtils.ts`

Funcoes puras:

```text
summarizeReadingSession()
groupHitlQuestionsByPhase()
getOpenReadingHitls()
getBlockingReadingHitls()
applyReadingValidationDecision()
buildValidatedContextFromDecisions()
getContextPropagationStatus()
canUseContextInNextPhase()
getNextDocumentRequests()
buildTechnicalStorytellingSummary()
```

Regras aplicadas:

- funcoes nao chamam IA/API/banco;
- funcoes nao usam `fetch`, Supabase ou axios;
- `applyReadingValidationDecision()` retorna nova sessao sem mutar entrada;
- contexto bloqueado impede quantitativos e custos;
- contexto pendente nao alimenta quantitativos finais;
- decisoes humanas podem mover informacao para validado, pendente ou bloqueado conforme tipo.

#### 11.26.7 Ajuste pequeno em tipos

Arquivo alterado:

- `src/types.ts`

Ajuste:

```typescript
question_id?: string
```

Foi adicionado em `OrcamentistaReadingValidationDecision` para vincular uma decisao humana a um HITL especifico sem depender de convencao textual.

#### 11.26.8 Confirmacoes de conformidade

- Nenhum painel criado.
- Nenhuma UI alterada.
- `OrcamentistaTab.tsx` nao foi alterado.
- Nenhum arquivo de Obra/Diario foi alterado.
- Nenhuma migration criada.
- Banco/schema nao alterado.
- Nenhuma IA real chamada.
- Nenhum PDF real processado.
- Nenhum OCR executado.
- Nenhum Supabase, `fetch` ou axios usado.

#### 11.26.9 Proximo passo recomendado

Executar a subfase 3D-C:

```text
painel + integracao visual
```

Essa proxima etapa deve consumir o mock e os utilitarios da 3D-B sem gravar no banco e sem consolidar orçamento oficial.

---

### 11.27 Fase 3D-C: Guided Intake Panel + Visual Integration

> Status: implementado como painel visual local, sem IA real, sem banco e sem processamento de PDF.
> Escopo: expor a leitura guiada, HITLs por etapa e contexto tecnico separado no Workspace IA.

#### 11.27.1 Objetivo aplicado

A Fase 3D-C criou a camada visual para consumir o mock e os utilitarios puros da Fase 3D-B.

O painel comunica o fluxo:

```text
Intake guiado
  -> ordem de leitura por fase
  -> documentos esperados/recebidos/ausentes
  -> HITLs de leitura
  -> contexto validado, pendente e bloqueado
  -> proximo documento solicitado
```

#### 11.27.2 Painel visual criado

Arquivo criado:

- `src/pages/Oportunidade/OrcamentistaGuidedIntakePanel.tsx`

O painel mostra:

- cabecalho "Intake guiado e contexto tecnico";
- timeline com 12 fases da leitura;
- fase atual, fases completas, pendentes e bloqueadas;
- documentos esperados;
- documentos recebidos;
- documentos ausentes;
- documento de fundacao recebido fora de ordem;
- proximo documento solicitado;
- storytelling tecnico da obra;
- HITLs por leitura;
- acoes mockadas locais para decisao humana;
- contexto validado, pendente e bloqueado em blocos separados.

#### 11.27.3 Integracao no Workspace IA

Arquivo alterado:

- `src/pages/Oportunidade/OrcamentistaTab.tsx`

O painel foi integrado no inicio da secao Workspace IA, antes de Documentos recebidos.

Sequencia visual atual:

```text
1. Intake guiado e contexto tecnico
2. Documentos recebidos
3. Projetos ausentes / estimativas controladas
4. Processamento de paginas
5. Reader + Verifier
6. HITL Orcamentista
7. Dispatch para agentes
8. Preview consolidado
9. Gate de consolidacao
10. Revisao humana do payload
```

Os blocos experimentais posteriores permanecem depois dessa sequencia.

#### 11.27.4 HITLs e decisoes visiveis

HITLs visiveis no painel:

- quantidade de estacas: 21 unidades vs ambiguidade textual;
- C25/R25 ou nomenclatura da estaca;
- P6 indicado como `nasce`;
- P23 em corte fora da tabela principal;
- sondagem/topografia ausente;
- relatorio de esforcos da fundacao ausente;
- fck/concreto por elemento divergente.

As acoes mockadas locais permitem simular:

- validar valor detectado;
- corrigir manualmente;
- solicitar novo documento;
- marcar como estimado;
- manter bloqueado.

Essas acoes alteram apenas estado local do componente.

#### 11.27.5 Contexto separado

O painel separa explicitamente:

- contexto validado: tipo de obra, endereco mockado, arquitetonico parcial, 21 estacas e C25/Ø25 cm;
- contexto pendente: sondagem, relatorio de esforcos, profundidade real, P6, P23 e fck por elemento;
- contexto bloqueado: consolidacao da fundacao, quantitativos finais e uso executivo da fundacao.

Avisos obrigatorios exibidos:

- `Contexto pendente nao alimenta quantitativos finais.`
- `Correcoes humanas substituem leituras ambiguas.`
- `Documento fora de ordem pode ser lido, mas bloqueia consolidacao ate completar contexto.`

#### 11.27.6 Confirmacoes de conformidade

- Nenhuma IA real chamada.
- Gemini real nao foi chamado.
- OpenAI nao foi chamado.
- Claude API nao foi chamada.
- Nenhum OCR real executado.
- Nenhum PDF real processado.
- Nenhum `fetch`, axios ou Supabase usado.
- Nenhuma migration criada.
- Banco/schema nao alterado.
- Nenhum item gravado em `orcamento_itens`.
- Nenhuma consolidacao no orcamento oficial.
- Proposta nao alterada.
- Obra/Diario preservados.
- Rotas `/obras` e `/obras/:obraId` preservadas.

#### 11.27.7 Proximo passo recomendado

Executar fase posterior para conectar esse painel a dados reais somente quando houver backend, persistencia auditavel de HITL e decisao explicita de liberar leitura real controlada.

---

### 11.28 Fase 3E: Manual Reader Result Ingestion + Safety Evaluation

> Status: implementado como ingestao manual local, sem API real, sem banco e sem processamento de PDF.
> Escopo: colar JSON retornado por motor externo, normalizar e aplicar gates de seguranca.

#### 11.28.1 Objetivo aplicado

A Fase 3E criou a ponte segura entre o teste manual com prancha real e uma futura integracao de API.

Fluxo implementado:

```text
Usuario roda Reader fora do EVIS
  -> cola JSON no painel sandbox
    -> EVIS valida JSON
      -> EVIS normaliza output
        -> EVIS aplica Safety Policy
          -> EVIS aplica Dimensional Sanity Checks
            -> EVIS mostra Verifier/HITL/bloqueios
              -> nada grava no banco
```

#### 11.28.2 Documento canonico criado

Arquivo criado:

- `orcamentista/docs/EVIS_ORCAMENTISTA_MANUAL_READER_INGESTION_AND_SAFETY_EVALUATION.md`

O documento registra:

- objetivo da ingestao manual;
- motivo para nao haver API real nesta fase;
- formato esperado do JSON colado;
- validacao de shape;
- normalizacao;
- aplicacao da Reader Safety Policy;
- aplicacao dos Dimensional Sanity Checks;
- Verifier/HITL/bloqueios;
- exemplo de fundacao/estacas;
- exemplo de bloqueio `35 m` vs `3,5 m`;
- garantia de que nada grava no orçamento oficial.

#### 11.28.3 Tipos adicionados

Arquivo alterado:

- `src/types.ts`

Tipos adicionados:

```text
OrcamentistaManualReaderIngestionStatus
OrcamentistaManualReaderIngestionResult
OrcamentistaManualReaderEvaluationSummary
```

#### 11.28.4 Ingestao manual criada

Arquivo criado:

- `src/lib/orcamentista/manualReaderIngestion.ts`

Funcoes puras:

```text
parseManualReaderJson()
ingestManualReaderOutput()
buildManualReaderEvaluationResult()
```

Comportamento:

- recebe string JSON;
- bloqueia input vazio;
- bloqueia JSON invalido;
- valida shape minimo com `validateReaderOutputShape()`;
- normaliza com `normalizeRawReaderOutput()`;
- aplica `runReaderSafetyGate()`;
- retorna status, output normalizado, safety gate, dimensional checks, Verifier, HITL, bloqueios, dispatch, erros e avisos.

#### 11.28.5 Utilitarios criados

Arquivo criado:

- `src/lib/orcamentista/manualReaderIngestionUtils.ts`

Funcoes puras:

```text
isValidJsonString()
getManualIngestionStatusLabel()
getManualIngestionBlockingReasons()
summarizeManualReaderEvaluation()
extractManualReaderHitlRequests()
extractManualReaderCriticalDimensions()
getManualReaderDispatchDecision()
```

Nenhuma funcao chama IA, API, banco, `fetch`, axios ou Supabase.

#### 11.28.6 Painel atualizado

Arquivo alterado:

- `src/pages/Oportunidade/OrcamentistaRealReaderSandboxPanel.tsx`

Area adicionada:

```text
Colar JSON real do Reader
```

A UI mostra:

- textarea para JSON;
- botao local "Avaliar JSON colado";
- status de parse;
- status de normalizacao;
- safety gate result;
- itens identificados;
- itens inferidos;
- informacoes pendentes;
- riscos;
- cotas criticas;
- dimensional checks;
- HITLs;
- `allowed_to_dispatch`;
- `requires_verifier`;
- `requires_hitl`;
- `blocks_consolidation`;
- bloqueios e avisos.

Avisos obrigatorios exibidos:

- `Este JSON foi colado manualmente.`
- `Nenhuma chamada de IA foi executada pelo EVIS.`
- `Nenhum dado foi gravado no banco.`
- `Resultado bloqueado não pode seguir para dispatch/consolidação.`

#### 11.28.7 Confirmacoes de conformidade

- Nenhuma IA real chamada.
- Gemini real nao foi chamado.
- OpenAI nao foi chamado.
- Claude API nao foi chamada.
- Nenhum `fetch` usado.
- Nenhum axios usado.
- Nenhum Supabase usado.
- Nenhum OCR real executado.
- Nenhum PDF real processado.
- Nenhuma migration criada.
- Banco/schema nao alterado.
- Nenhum item gravado em `orcamento_itens`.
- Nenhuma consolidacao no orçamento oficial.
- Nenhuma proposta criada.
- Obra/Diario preservados.
- Rotas `/obras` e `/obras/:obraId` preservadas.

#### 11.28.8 Proximo passo recomendado

Usar a ingestao manual para comparar outputs reais de motores externos e endurecer o schema de resposta antes de qualquer integracao automatica por API.

---

### 11.29 Fase 3F: Manual Verifier Result Ingestion

> Status: implementado como ingestao manual, comparacao local e UI experimental, sem IA real, sem API, sem banco e sem consolidacao oficial.
> Escopo: colar JSON externo do Verifier, comparar com Reader normalizado e manter gates de seguranca.

#### 11.29.1 Objetivo

Criar a etapa manual equivalente ao Verifier:

```text
Reader normalizado
  -> Verifier externo executado fora do EVIS
  -> JSON do Verifier colado manualmente
  -> validacao local
  -> normalizacao do Verifier
  -> comparacao Reader x Verifier
  -> agreement_score
  -> divergencias
  -> HITLs
  -> dispatch/consolidacao bloqueados quando necessario
```

#### 11.29.2 Documento canonico criado

- `orcamentista/docs/EVIS_ORCAMENTISTA_MANUAL_VERIFIER_INGESTION_AND_READER_COMPARISON.md`

O documento registra:

- objetivo da ingestao manual do Verifier;
- motivo de ainda nao haver API real;
- diferenca entre Reader e Verifier;
- shape flexivel aceito para JSON do Verifier;
- comparacao de identificados, inferidos, pendencias, riscos, HITLs e cotas criticas;
- calculo de `agreement_score`;
- classificacao de divergencias;
- regras de dispatch, HITL e bloqueio de consolidacao;
- exemplo com fundacao/estacas;
- proibicao de gravacao no orcamento oficial.

#### 11.29.3 Tipos adicionados

Arquivo alterado:

- `src/types.ts`

Tipos adicionados:

```text
OrcamentistaManualVerifierIngestionStatus
OrcamentistaManualVerifierIngestionResult
OrcamentistaVerifierComparisonResult
OrcamentistaVerifierAgreementScore
OrcamentistaVerifierDivergence
OrcamentistaVerifierDivergenceSeverity
OrcamentistaVerifierConfirmedItem
OrcamentistaVerifierDisputedItem
OrcamentistaVerifierHitlRequest
OrcamentistaVerifierDispatchDecision
OrcamentistaManualVerifierNormalizedOutput
```

#### 11.29.4 Ingestao manual criada

Arquivo criado:

- `src/lib/orcamentista/manualVerifierIngestion.ts`

Funcoes puras:

```text
parseManualVerifierJson()
ingestManualVerifierOutput()
buildManualVerifierEvaluationResult()
```

Comportamento:

- recebe string JSON;
- bloqueia input vazio;
- bloqueia JSON invalido;
- valida shape minimo por campos reconhecidos de Verifier;
- normaliza `verified_items`, `confirmed_items`, `disputed_items`, `divergence_points`, `critical_dimensions`, `risks`, `hitl_requests`, `agreement_score`, `requires_hitl` e `blocks_consolidation`;
- se houver Reader normalizado, executa comparacao local;
- retorna status, Verifier normalizado, resumo, comparacao, erros e avisos.

#### 11.29.5 Comparador criado

Arquivo criado:

- `src/lib/orcamentista/manualVerifierComparisonUtils.ts`

Funcoes puras:

```text
compareReaderAndVerifierOutputs()
calculateAgreementScore()
extractConfirmedItems()
extractDisputedItems()
extractVerifierDivergences()
classifyVerifierDivergenceSeverity()
buildVerifierHitlRequests()
getVerifierBlockingReasons()
getVerifierDispatchDecision()
summarizeVerifierComparison()
```

Regras:

- divergencia em quantidade de estacas vira `high` ou `critical`;
- divergencia em diametro de estaca vira `critical`;
- divergencia em comprimento/profundidade vira `critical`;
- divergencia em fck/resistencia vira `high`;
- divergencia em volume de concreto vira `high`;
- divergencia em P6/P23 vira `medium` ou `high`;
- divergencia em folha/prancha/carimbo vira `medium`;
- se houver divergencia `high` ou `critical`, dispatch fica bloqueado, HITL exigido e consolidacao bloqueada;
- se `agreement_score < 0.90`, HITL e exigido;
- se `agreement_score < 0.80`, consolidacao fica bloqueada.

#### 11.29.6 Painel atualizado

Arquivo alterado:

- `src/pages/Oportunidade/OrcamentistaRealReaderSandboxPanel.tsx`

Area adicionada:

```text
Colar JSON do Verifier
```

A UI mostra:

- textarea para JSON do Verifier;
- botao local "Comparar Reader x Verifier";
- status de parse do Verifier;
- `agreement_score`;
- itens confirmados;
- itens disputados;
- divergencias;
- HITLs do Verifier;
- dispatch decision;
- bloqueios, erros e avisos.

Avisos obrigatorios exibidos:

- `Este JSON do Verifier foi colado manualmente.`
- `Nenhuma chamada de IA foi executada pelo EVIS.`
- `Nenhum dado foi gravado no banco.`
- `Divergências críticas exigem HITL antes de qualquer dispatch ou consolidação.`

#### 11.29.7 Confirmacoes de conformidade

- Nenhuma IA real chamada.
- Gemini real nao foi chamado.
- OpenAI nao foi chamado.
- Claude API nao foi chamada.
- Nenhum `fetch` usado.
- Nenhum axios usado.
- Nenhum Supabase usado.
- Nenhum OCR real executado.
- Nenhum PDF real processado.
- Nenhuma migration criada.
- Banco/schema nao alterado.
- Nenhum item gravado em `orcamento_itens`.
- Nenhuma consolidacao no orcamento oficial.
- Nenhuma proposta criada.
- Obra/Diario preservados.
- Rotas `/obras` e `/obras/:obraId` preservadas.

#### 11.29.8 Proximo passo recomendado

Usar a ingestao manual do Verifier com outputs reais de motores externos para calibrar schema, severidade, agreement score e criterios de HITL antes de qualquer integracao automatica.

---

### 11.30 Fase 4A.0: Schema Audit for Reader / Verifier / HITL Persistence

> Status: auditoria e documentacao apenas, sem migration, sem alteracao de banco, sem escrita em tabelas.  
> Escopo: mapear lacunas de schema para persistencia futura rastreavel do fluxo Reader -> Verifier -> HITL.

#### 11.30.1 Objetivo aplicado

Auditar o contrato atual e definir uma arquitetura de persistencia futura para:

- Reader result bruto e normalizado;
- safety gate e dimensional checks;
- Verifier result normalizado;
- comparacao Reader x Verifier;
- divergencias deduplicadas e score de concordancia;
- fila HITL e decisoes humanas;
- contexto validado/pendente/bloqueado;
- rastreabilidade por oportunidade, orcamento, documento e pagina.

Nenhuma implementacao foi executada nesta fase.

#### 11.30.2 Tabelas existentes encontradas e relacionadas ao tema

Com base em `docs/06_CREATE_OPPORTUNITIES_MVP.sql`, `docs/08_CREATE_PROPOSTAS_MVP.sql`, `src/hooks/*` e `src/types.ts`, as estruturas ja existentes/referenciadas sao:

```text
contacts
opportunities
opportunity_events
opportunity_files
propostas
orcamentos
orcamento_itens
obras
```

Uso atual relevante:

- `opportunities` e ancora de ciclo comercial, com `orcamentista_workspace_id`, `orcamento_id` e `obra_id` opcional;
- `opportunity_files` guarda anexos por oportunidade (sem pagina estruturada por arquivo);
- `orcamentos` e `orcamento_itens` sustentam o orcamento oficial/manual;
- `propostas` persiste snapshot comercial;
- nao ha tabela persistente especifica para Reader/Verifier/HITL do fluxo manual seguro.

#### 11.30.3 Estruturas de persistencia inexistentes hoje

Nao foi encontrada estrutura relacional dedicada para armazenar, de forma auditavel:

- JSON bruto do Reader (`raw_reader_output`);
- JSON normalizado do Reader (`normalized_output`);
- resultado do safety gate (`safety_gate_result`);
- checagens dimensionais (`dimensional_checks`);
- JSON normalizado do Verifier (`normalized_verifier_output`);
- comparacao Reader x Verifier (`comparison_result`);
- divergencias deduplicadas com severidade e bloqueio;
- HITLs por origem Reader/Verifier;
- decisoes humanas de HITL com historico;
- estado de contexto tecnico (validado/pendente/bloqueado) por fase e por documento/pagina.

#### 11.30.4 Gap principal de rastreabilidade

O fluxo ja existe em memoria/local (tipos e utilitarios em `src/types.ts` e `src/lib/orcamentista/*`), mas sem persistencia canônica para:

- `opportunity_id` + `orcamento_id` + `opportunity_file_id` + `page_number`;
- lineage entre Reader run, Verifier run, comparacao, HITL e decisao humana;
- trilha de auditoria para liberar dispatch/consolidacao em fase futura.

#### 11.30.5 Proposta de modelo futuro (sem migration nesta fase)

Tabelas candidatas:

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

Campos-base recomendados para todas:

- `id` uuid;
- `opportunity_id` uuid not null como coluna direta obrigatoria nas 9 tabelas propostas;
- `orcamento_id` uuid null;
- `opportunity_file_id` uuid not null nas tabelas page-scoped; nullable apenas em tabelas contextuais/globais com source refs suficientes;
- `document_id` text null (compatibilidade com contratos atuais);
- `page_number` int not null nas tabelas page-scoped com `check (page_number > 0)`; nullable apenas em tabelas contextuais/globais;
- `status` text;
- JSONs semanticos conforme a funcao da tabela (`raw_output_json`, `normalized_output_json`, `safety_gate_json`, `dimensional_checks_json`, `verifier_output_json`, `comparison_json`, `dispatch_decision_json`, `context_snapshot_json`), sem `payload` generico como campo principal;
- `source_type` e `source_id`/`source_ref`/`source_refs_json` obrigatorios nas tabelas contextuais/globais quando `opportunity_file_id/page_number` nao forem suficientes;
- `created_at` timestamptz;
- `updated_at` timestamptz;
- `created_by` text null;
- `trace_id` text null.

Relacoes recomendadas:

- `orc_reader_outputs.reader_run_id -> orc_reader_runs.id`;
- `orc_reader_safety_evaluations.reader_output_id -> orc_reader_outputs.id`;
- `orc_verifier_runs.reader_output_id -> orc_reader_outputs.id`;
- `orc_reader_verifier_comparisons.reader_output_id -> orc_reader_outputs.id`;
- `orc_reader_verifier_comparisons.verifier_run_id -> orc_verifier_runs.id`;
- `orc_reader_verifier_divergences.comparison_id -> orc_reader_verifier_comparisons.id`;
- `orc_hitl_issues.comparison_id -> orc_reader_verifier_comparisons.id` (nullable para outras origens);
- `orc_hitl_decisions.hitl_issue_id -> orc_hitl_issues.id` com FK `RESTRICT`/`NO ACTION`, sem cascade delete.

Regra fixa para `opportunity_id`:

- `opportunity_id` deve existir como coluna direta obrigatoria em todas as 9 tabelas: `orc_reader_runs`, `orc_reader_outputs`, `orc_reader_safety_evaluations`, `orc_verifier_runs`, `orc_reader_verifier_comparisons`, `orc_reader_verifier_divergences`, `orc_hitl_issues`, `orc_hitl_decisions` e `orc_context_snapshots`.
- FKs e lineage continuam uteis para integridade, mas nao substituem a coluna direta.
- A coluna direta e obrigatoria para RLS, auditoria, rastreabilidade operacional e debug.

Regra de fonte por pagina:

- tabelas page-scoped devem preencher `opportunity_file_id` e `page_number`;
- `page_number` deve ser sempre maior que zero quando preenchido;
- `document_id` permanece textual, futuro e de compatibilidade, sem FK obrigatoria nesta fase;
- HITL/context snapshots podem ser contextuais, desde que tenham `source_type` e `source_id`/`source_ref`/`source_refs_json` suficientes.

Regras adicionais de auditoria:

- `orc_hitl_decisions` e append-only; decisoes humanas nao podem ser apagadas por cascade.
- `orc_hitl_issues.comparison_id` e nullable, pois HITLs podem nascer de baixa confianca do Reader, safety gate, dimensional check, projeto ausente, documento ilegivel, Verifier isolado ou divergencia de intake.
- `dedupe_key` de divergencia deve combinar categoria, campo tecnico, item afetado, fonte/pagina, valores divergentes e disciplina quando aplicavel; nao usar chave grosseira como apenas `fck` ou `profundidade`.
- `orc_context_snapshots` deve ser historico append-only, nao copia redundante sem proposito.

#### 11.30.6 Estados minimos sugeridos

- Reader run: `received`, `normalized`, `safety_evaluated`, `blocked`, `ready_for_verifier`;
- Verifier run: `received`, `normalized`, `compared`, `requires_hitl`, `blocked`, `approved`;
- Comparison: `pending`, `divergent`, `requires_hitl`, `dispatch_allowed`, `consolidation_blocked`;
- HITL issue: `pendente`, `em_revisao`, `aprovada_com_ressalva`, `bloqueada`, `documento_solicitado`, `convertida_em_verba`, `ignorada_nesta_fase`, `reanalisar_futuramente`;
- Context snapshot: `validated`, `pending`, `blocked`, `incomplete`.

#### 11.30.7 Regra inegociavel de escrita em orcamento oficial

Permanece obrigatorio:

- **nao gravar diretamente em `orcamento_itens`** a partir de Reader/Verifier;
- liberar escrita somente em fase futura, apos gate aprovado + HITL resolvido + aprovacao humana explicita + auditoria rastreavel.

#### 11.30.8 RLS e decisoes humanas pendentes antes de migration

Pontos que exigem decisao humana antes de qualquer SQL:

- estrategia de tenancy/autorizacao (por usuario, equipe ou empresa) para RLS nas novas tabelas;
- padrao de identificacao de ator humano (`decided_by`) e trilha de auditoria;
- definicao canonica de `document_id` (texto contratual atual) versus `opportunity_file_id` (uuid real);
- regra fixa: `orcamento_id` pode ser `NULL` nas fases iniciais de leitura/verificacao e passa a obrigatorio no gate de consolidacao/escrita oficial;
- politica de retencao/versionamento para payloads JSON brutos.

#### 11.30.9 Confirmacoes desta fase

- Nenhuma migration criada.
- Nenhuma tabela criada.
- Nenhuma alteracao de RLS.
- Nenhum dado gravado no banco.
- Nenhuma alteracao em Obra/Diario.
- Nenhuma alteracao de UI/rotas de Obras.
