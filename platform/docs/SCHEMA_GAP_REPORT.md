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

#### 11.17.10 Proximo passo recomendado

Avancar para a Fase 2G com um contrato de dispatch mockado para agentes especialistas, consumindo apenas paginas/leituras/HITLs liberados e mantendo a consolidacao oficial bloqueada.
