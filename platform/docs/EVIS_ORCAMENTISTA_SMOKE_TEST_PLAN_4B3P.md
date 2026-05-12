# EVIS - Orcamentista IA Smoke Test Plan

> Fase: 4B.3.P
> Tipo: plano documental de smoke test funcional minimo; sem execucao real
> Data: 2026-05-12
> Status: pronto para autorizar 4B.3.E com escopo controlado
> Staging autorizado: `vtlepoljlqmjwuauygni`
> Producao bloqueada: `jwutiebpfauwzzltwgbb`

## 1. Objetivo da fase

Planejar o primeiro smoke test funcional minimo do Orçamentista IA apos a validacao pos-migration 4B.2.E, sem executar SQL, sem alterar banco e sem rodar o smoke test ainda.

O smoke test planejado deve validar o fluxo minimo:

Lead/Oportunidade -> Documento/opportunity_file sintetico -> Reader Run -> Reader Output -> Safety Evaluation -> Verifier Run -> Reader/Verifier Comparison -> Divergence, se aplicavel -> HITL Issue -> HITL Decision -> Context Snapshot -> Gate de contexto validado/pendente/bloqueado -> confirmacao de que a IA nao escreve direto em `orcamento_itens`.

## 2. Ambiente autorizado e bloqueado

| Item | Valor |
|------|-------|
| Ambiente autorizado | Supabase staging |
| Project ref autorizado | `vtlepoljlqmjwuauygni` |
| Ambiente bloqueado | Producao |
| Project ref bloqueado | `jwutiebpfauwzzltwgbb` |
| `supabase/.temp` | Proibido como fonte de ambiente; aponta para producao |
| Secrets | Nao expor |
| `.env` | Nao alterar |
| Codigo/UI | Nao alterar nesta fase |
| SQL nesta fase 4B.3.P | Nao executar |
| Banco nesta fase 4B.3.P | Nao alterar |

## 3. Estado atual do staging

Baseado nas fases 4B.S5, 4B.1.E e 4B.2.E:

- baseline operacional aplicado;
- 26 tabelas publicas esperadas: 17 baseline + 9 pipeline;
- 9 tabelas Reader/Verifier/HITL criadas;
- constraints CHECK, FKs internas/externas, UNIQUE/dedupe, triggers e RLS validados;
- RLS habilitado nas 9 tabelas pipeline, sem policies;
- contagem final das 9 tabelas pipeline = 0;
- nenhum residuo de teste 4B.2;
- nenhuma escrita em `orcamento_itens` pelo pipeline Reader/Verifier/HITL.

## 4. Arquivos lidos

Documentos obrigatorios:

- `platform/docs/EVIS_READER_VERIFIER_HITL_POST_MIGRATION_VALIDATION_EXECUTION_4B2E.md`
- `platform/docs/EVIS_READER_VERIFIER_HITL_POST_MIGRATION_VALIDATION_PLAN_4B2P.md`
- `platform/docs/EVIS_READER_VERIFIER_HITL_MIGRATION_EXECUTION_REPORT_4B1E.md`
- `platform/docs/EVIS_READER_VERIFIER_HITL_MIGRATION_FINAL_REVIEW_4B1P.md`
- `platform/docs/sql_proposals/ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_MIGRATION_CANDIDATE.sql`
- `platform/docs/EVIS_SUPABASE_STAGING_POST_BASELINE_PREFLIGHT_4BS5.md`

Codigo obrigatorio e relacionado:

- `src/pages/OrcamentistaChat.tsx`
- `src/pages/Oportunidade/OrcamentistaTab.tsx`
- `src/hooks/useOrcamento.ts`
- `src/hooks/useOportunidadeOrcamento.ts`
- `src/hooks/useOportunidades.ts`
- `src/lib/api.ts`
- `platform/server/orcamentista/contracts.ts`
- `platform/server/orcamentista/etapa0.ts`
- `platform/server/orcamentista/graphEtapa0.ts`
- `platform/server/orcamentista/engine.ts`
- `platform/server/orcamentista/workspaces.ts`
- `platform/server/orcamentista/stateManager.ts`
- `platform/server/orcamentista/gcsWorkspaceSync.ts`
- `platform/server/orcamentista/providers/VertexDocumentRuntimeProvider.ts`
- `platform/server/routes/orcamentista.ts`
- `platform/server/scripts/run-etapa0-workspace.ts`
- `platform/server/scripts/spike-etapa0.ts`
- `server/tools/supabaseTools.ts`
- `src/lib/orcamentista/realReaderSandbox.ts`
- `src/lib/orcamentista/readerSafetyRunner.ts`
- `src/lib/orcamentista/readerVerifierUtils.ts`
- `src/lib/orcamentista/hitlUtils.ts`
- `src/lib/orcamentista/consolidationGateUtils.ts`
- `src/lib/orcamentista/payloadReviewUtils.ts`
- `src/pages/Oportunidade/OrcamentistaReaderVerifierPanel.tsx`
- `src/pages/Oportunidade/OrcamentistaHitlPanel.tsx`
- `src/pages/Oportunidade/OrcamentistaConsolidationGatePanel.tsx`

## 5. Fluxo funcional encontrado no codigo

### 5.1 Oportunidade e orcamento oficial

`src/hooks/useOportunidades.ts` possui:

- leitura/listagem de `opportunities`;
- leitura de detalhe de oportunidade;
- criacao de oportunidade via PostgREST;
- atualizacao de oportunidade;
- leitura de `opportunity_events`;
- criacao de evento;
- leitura read-only de `opportunity_files`.

`src/hooks/useOportunidadeOrcamento.ts` possui:

- leitura da oportunidade;
- leitura do `orcamento` vinculado por `opportunity.orcamento_id`;
- criacao de `orcamentos` e PATCH em `opportunities.orcamento_id`;
- criacao, atualizacao e remocao de itens manuais em `orcamento_itens`;
- guardas para bloquear operacao sem Supabase configurado ou sem `orcamento_id`.

`src/hooks/useOrcamento.ts` possui hooks genericos para `orcamentos` e `orcamento_itens`, incluindo CRUD de itens. Esses hooks sao de fluxo manual/oficial, nao do pipeline Reader/Verifier/HITL.

### 5.2 UI do Orçamentista

`src/pages/Oportunidade/OrcamentistaTab.tsx` separa explicitamente:

- orcamento oficial gravado no banco;
- itens oficiais em `orcamento_itens`;
- workspace IA como previa nao consolidada;
- paineis mockados de documentos, Reader/Verifier, HITL, dispatch, preview consolidado, gate e payload review;
- chat do Orçamentista como ambiente de analise separado.

`src/pages/OrcamentistaChat.tsx` possui:

- fluxo de chat e upload de anexos para workspace;
- endpoint `/api/orcamentista/chat/stream`;
- preview do workspace via `/api/orcamentista/workspaces/:id/preview`;
- botao legado "Gerar orcamento oficial" em quarentena por feature flag (`VITE_LEGACY_ORCAMENTISTA_OFFICIAL_WRITE`);
- mensagem de quarentena indicando que a consolidacao futura deve passar por Reader, Verifier, HITL e Gate.

### 5.3 Etapa 0 e processamento documental

`platform/server/orcamentista/etapa0.ts` define:

- schema estruturado da Etapa 0;
- instrucao de extracao factual;
- validador deterministico `validateEtapa0`;
- formatador Markdown.

`platform/server/orcamentista/engine.ts`, `graphEtapa0.ts` e `VertexDocumentRuntimeProvider.ts` indicam:

- desenho de extracao documental com Vertex/Gemini;
- cache/structured output;
- grafo Etapa 0 com mock temporario em `graphEtapa0.ts`;
- rota real `/api/orcamentista/etapa0/extract` em `platform/server/routes/orcamentista.ts`;
- script `platform/server/scripts/run-etapa0-workspace.ts` para executar Etapa 0 a partir de workspace local/GCS.

### 5.4 Reader, Verifier, HITL e gates

`src/lib/orcamentista/realReaderSandbox.ts` implementa um sandbox local/mockado:

- input de pagina sintetica;
- pacote de prompt do Reader;
- normalizacao de output bruto;
- safety gate;
- pacote de prompt do Verifier;
- status `blocked_by_safety_gate`, `ready_for_verifier`, etc.

`src/lib/orcamentista/readerSafetyRunner.ts` implementa:

- confidence cap por qualidade de fonte;
- regras de safety;
- sanity checks dimensionais;
- decisao de necessidade de Verifier;
- decisao de HITL;
- elegibilidade de dispatch.

`src/lib/orcamentista/readerVerifierUtils.ts` implementa:

- bandas de score;
- regras de dispatch;
- regras de HITL;
- bloqueio de consolidacao.

`src/lib/orcamentista/hitlUtils.ts` implementa:

- agrupamento e resumo de issues;
- decisao mockada HITL;
- liberacao semantica de dispatch/consolidacao em memoria.

`src/lib/orcamentista/consolidationGateUtils.ts` e `payloadReviewUtils.ts` implementam:

- validacao de preview consolidado;
- payload simulado;
- `canWriteConsolidationToBudget()` retornando sempre `false`;
- `can_write_to_budget: false`;
- motivo explicito de bloqueio para escrita futura em `orcamento_itens`.

### 5.5 Server routes

`platform/server/routes/orcamentista.ts` possui:

- `/api/orcamentista/chat/stream`;
- `/api/orcamentista/chat`;
- workspace CRUD local;
- upload de arquivo para workspace local;
- sync de anexos para GCS;
- `/api/orcamentista/etapa0/extract`;
- preview read-only de workspace;
- endpoint legado `/api/orcamentista/workspaces/:workspaceId/generate-official-budget`, que escreve em `orcamentos`/`orcamento_itens` somente se `LEGACY_ORCAMENTISTA_OFFICIAL_WRITE_ENABLED=true` e `NODE_ENV !== 'production'`. O proprio codigo declara este caminho como quarentenado e nao canonico.

## 6. Lacunas encontradas

| Capacidade | Existe hoje? | Evidencia |
|------------|--------------|-----------|
| Criar oportunidade | Sim | `useCreateOportunidade` |
| Vincular orcamento a oportunidade | Sim | `criarOrcamentoParaOportunidade` |
| Registrar arquivo em `opportunity_files` | Nao como write app atual | Existe leitura `useOpportunityFiles`; upload do chat salva arquivo em workspace local, nao em `opportunity_files` |
| Criar `orc_reader_runs` | Nao | Sem endpoint/hook/adaptador encontrado |
| Salvar `orc_reader_outputs` | Nao | Sem endpoint/hook/adaptador encontrado |
| Salvar `orc_reader_safety_evaluations` | Nao | Sem endpoint/hook/adaptador encontrado |
| Criar `orc_verifier_runs` | Nao | Sem endpoint/hook/adaptador encontrado |
| Salvar `orc_reader_verifier_comparisons` | Nao | Sem endpoint/hook/adaptador encontrado |
| Salvar `orc_reader_verifier_divergences` | Nao | Sem endpoint/hook/adaptador encontrado |
| Criar `orc_hitl_issues` | Nao | UI/mock e utils existem; sem persistencia em tabela |
| Registrar `orc_hitl_decisions` | Nao | UI/mock e utils existem; sem persistencia em tabela |
| Criar `orc_context_snapshots` | Nao | Sem endpoint/hook/adaptador encontrado |
| Gate local que bloqueia escrita em `orcamento_itens` | Sim | `canWriteConsolidationToBudget()` retorna `false`; UI informa fase futura |
| Protecao server contra geracao oficial legada | Sim, por default | endpoint legado retorna 410 se feature flag nao estiver habilitada |

Lacuna principal: a aplicacao ainda nao tem camada service/server oficial para persistir o pipeline Reader/Verifier/HITL nas 9 tabelas novas. Portanto, um smoke test end-to-end via UI ou via endpoint canonico ainda estaria bloqueado por falta de implementacao.

## 7. Smoke test minimo proposto

### 7.1 Escopo recomendado para 4B.3.E

Executar um smoke test controlado de persistencia funcional no staging, fora da UI, usando script temporario/runner local que chama a Supabase Management API com endpoint hardcoded para `vtlepoljlqmjwuauygni`.

O teste deve:

1. confirmar alvo staging hardcoded;
2. recusar execucao se qualquer string de endpoint/ref contiver `jwutiebpfauwzzltwgbb`;
3. ignorar `supabase/.temp`;
4. abrir uma unica transacao `BEGIN; ... ROLLBACK;`;
5. criar dados sinteticos de oportunidade, arquivo e orcamento;
6. inserir o fluxo minimo nas 9 tabelas pipeline;
7. inserir divergencia e issue HITL em cenario controlado;
8. registrar decisao HITL append-only dentro da transacao;
9. criar context snapshot com `context_status` definido;
10. consultar `orcamento_itens` antes/depois dentro da transacao e confirmar que nao mudou;
11. executar rollback;
12. confirmar zero residuos nas 9 tabelas pipeline e zero marcador `EVIS_TEST_4B3`.

### 7.2 Tipo de execucao

| Opcao | Avaliacao |
|-------|-----------|
| Via SQL controlado | Mais seguro para 4B.3.E; valida schema e fluxo minimo sem depender de UI/prod config |
| Via service/server function | Desejavel futuramente, mas falta adaptador de persistencia para as 9 tabelas |
| Via UI | Nao recomendado agora; UI usa config do app e tem painéis mockados, nao persistencia pipeline |
| Via script Node temporario | Recomendado como wrapper seguro para SQL controlado, logs e asserts |
| Hibrido | Recomendado: script Node temporario + SQL transacional + auditoria local de codigo/gates |

Recomendacao: **script Node temporario ou one-off runner**, sem commit obrigatorio, usando Management API e SQL transacional. O script deve ser descartavel ou mantido fora de commit, salvo aprovacao humana posterior.

## 8. Dados sinteticos planejados

Marcador obrigatorio: `EVIS_TEST_4B3`.

Dados minimos:

| Entidade | Dados sinteticos |
|----------|------------------|
| `opportunities` | titulo `EVIS_TEST_4B3 Smoke Opportunity`, cliente snapshot `EVIS_TEST_4B3 Synthetic Client` |
| `opportunity_files` | nome `EVIS_TEST_4B3_document.pdf`, storage path `EVIS_TEST_4B3/document.pdf` |
| `orcamentos` | nome `EVIS_TEST_4B3 Smoke Budget`, cliente sintetico, total 0 |
| Reader | motor `EVIS_TEST_4B3_reader_v1`, status `ready_for_verifier` |
| Reader output | JSON bruto/normalizado com marcador `EVIS_TEST_4B3` |
| Safety | `requires_verifier=true`, `requires_hitl=true`, `blocks_consolidation=true`, `allowed_to_dispatch=false` |
| Verifier | motor `EVIS_TEST_4B3_verifier_v1`, status `requires_hitl` |
| Comparison | `agreement_score` medio/baixo, status `requires_hitl` ou `consolidation_blocked` |
| Divergence | severidade `media` ou `alta`, `dedupe_key=EVIS_TEST_4B3_DEDUPE_*` |
| HITL Issue | status `pendente`, fonte vinculada ao comparison/divergence |
| HITL Decision | `decision_type='manter_bloqueado'` ou `aprovar_com_ressalva` conforme variante |
| Context Snapshot | `context_status='blocked'` para cenario bloqueado ou `pending/validated` em variantes |
| `orcamento_itens` | nenhuma insercao, update ou delete |

Nenhum dado real de cliente, CPF, CNPJ, obra real, valor real ou documento real deve ser usado.

## 9. O que sera validado

- Oportunidade, arquivo e orcamento sinteticos conseguem ancorar o pipeline em staging.
- As 9 tabelas pipeline recebem um fluxo minimo coerente.
- Lineage de Reader -> Output -> Safety -> Verifier -> Comparison -> Divergence -> HITL -> Decision -> Snapshot fica consistente.
- `context_status` aceita gate `validated`, `pending` ou `blocked`, conforme cenario planejado.
- HITL decision e gravavel apenas como append-only dentro da transacao.
- O smoke test nao grava em `orcamento_itens`.
- A contagem de `orcamento_itens` nao muda antes/depois do fluxo.
- Rollback remove todos os dados sinteticos.
- Producao nao e acessada.

## 10. O que nao sera validado ainda

- Execucao real completa via UI.
- Persistencia via endpoint canonico da aplicacao para as 9 tabelas pipeline.
- Upload real em `opportunity_files` via UI.
- Extracao real de PDF por modelo.
- Qualidade semantica do Reader/Verifier real.
- Policies RLS de usuario autenticado/tenant.
- Consolidacao oficial em `orcamento_itens`.
- Geracao de proposta comercial.
- Conversao em obra.

## 11. Protecao contra escrita direta em `orcamento_itens`

Protecoes ja encontradas:

- migration Reader/Verifier/HITL nao cria FK, trigger, procedure ou function que escreva em `orcamento_itens`;
- `consolidationGateUtils.canWriteConsolidationToBudget()` retorna sempre `false`;
- `payloadReviewUtils` mantem `can_write_to_budget=false`;
- UI de Gate/Payload informa explicitamente que nenhum item e gravado em `orcamento_itens`;
- endpoint legado de geracao oficial esta em quarentena e retorna 410 por default;
- chat legado tambem depende de feature flag para expor caminho de gravacao oficial.

Protecoes planejadas para 4B.3.E:

- nao chamar `/generate-official-budget`;
- nao usar hooks de item manual;
- nao executar `INSERT`, `UPDATE` ou `DELETE` em `orcamento_itens`;
- executar apenas `SELECT count(*)` em `orcamento_itens` para provar ausencia de mudanca;
- abortar se o SQL planejado contiver `insert into public.orcamento_itens`, `update public.orcamento_itens` ou `delete from public.orcamento_itens`;
- abortar se qualquer resposta indicar escrita em `orcamento_itens`.

## 12. Estrategia de rollback/cleanup

Principio: toda escrita do smoke test 4B.3.E deve acontecer em uma unica chamada transacional:

```sql
BEGIN;
  -- anchors sinteticas
  -- pipeline sintetico
  -- asserts de contagem e lineage
ROLLBACK;
```

Cleanup esperado: automatico via `ROLLBACK`.

Pós-checks obrigatorios:

- `count(*) = 0` nas 9 tabelas pipeline;
- zero ocorrencias persistidas de `EVIS_TEST_4B3` nas 9 tabelas pipeline;
- zero ocorrencias persistidas de `EVIS_TEST_4B3` nas anchors criadas (`opportunities`, `opportunity_files`, `orcamentos`);
- contagem de `orcamento_itens` igual ao baseline read-only obtido antes do teste;
- 26 tabelas publicas preservadas;
- nenhuma tabela/policy/schema novo criado.

Cleanup defensivo por marcador so deve ser considerado se nao houver linha em `orc_hitl_decisions`. Se uma decision escapar da transacao, deve-se parar e bloquear: a tabela e append-only e nao deve ser limpa por DELETE.

## 13. Criterios de sucesso

- Alvo confirmado como `vtlepoljlqmjwuauygni` antes da execucao.
- Nenhuma referencia a `jwutiebpfauwzzltwgbb` no endpoint ou chamadas.
- `supabase/.temp` nao usado.
- Dados sinteticos `EVIS_TEST_4B3` usados em todas as linhas de teste.
- Fluxo minimo insere uma linha em cada tabela pipeline dentro da transacao.
- Gate de contexto registrado em `orc_context_snapshots`.
- Contagem de `orcamento_itens` nao muda.
- Nenhum comando proibido (`DROP`, schema change, policy, RLS change, migration) executado.
- `ROLLBACK` confirmado.
- Pos-checks finais zerados para pipeline e marcadores.
- Nenhum secret exposto.

## 14. Criterios de abortar

Abortar imediatamente se:

- o alvo ativo nao puder ser confirmado como `vtlepoljlqmjwuauygni`;
- qualquer endpoint, log ou variavel operacional apontar para `jwutiebpfauwzzltwgbb`;
- `supabase/.temp` for necessario para executar;
- o runner tentar usar config da UI/app em vez de endpoint hardcoded staging;
- qualquer teste tentar escrever em `orcamento_itens`;
- qualquer linha persistir apos rollback;
- `orc_hitl_decisions` receber linha persistida fora da transacao;
- surgir erro que sugira alvo errado ou permissao inesperada;
- algum comando de schema/RLS/policy/migration for necessario;
- houver necessidade de dados reais de cliente.

## 15. Decisao objetiva

**Pronto para autorizar 4B.3.E com escopo controlado.**

Escopo autorizado recomendado para 4B.3.E:

- smoke test transacional no staging `vtlepoljlqmjwuauygni`;
- dados sinteticos `EVIS_TEST_4B3`;
- SQL controlado executado por runner local seguro ou script Node temporario;
- nenhuma execucao via UI;
- nenhuma escrita direta em `orcamento_itens`;
- rollback obrigatorio.

Observacao: smoke end-to-end real via aplicacao fica bloqueado ate existir camada service/server para persistir as 9 tabelas pipeline. Essa lacuna nao bloqueia o smoke controlado 4B.3.E, mas deve ser registrada como proxima implementacao antes de promover o fluxo para uso operacional.

