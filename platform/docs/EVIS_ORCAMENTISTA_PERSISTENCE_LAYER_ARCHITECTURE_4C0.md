# EVIS - Orcamentista Persistence Layer Architecture

> Fase: 4C.0
> Tipo: arquitetura documental da camada oficial de persistencia
> Data: 2026-05-12
> Status: pronto para iniciar 4C.1
> Staging validado: `vtlepoljlqmjwuauygni`
> Producao bloqueada: `jwutiebpfauwzzltwgbb`

## 1. Objetivo da fase

Desenhar a arquitetura minima da camada oficial de persistencia do Orçamentista IA antes de implementar codigo.

A camada deve permitir gravar futuramente, de forma controlada e auditavel:

- `opportunity_files`
- `orc_reader_runs`
- `orc_reader_outputs`
- `orc_reader_safety_evaluations`
- `orc_verifier_runs`
- `orc_reader_verifier_comparisons`
- `orc_reader_verifier_divergences`
- `orc_hitl_issues`
- `orc_hitl_decisions`
- `orc_context_snapshots`

Regra critica: a IA nao pode escrever diretamente em `orcamento_itens` nesta fase. `orcamento_itens` permanece bloqueado ate uma fase futura de consolidacao controlada pos-HITL.

## 2. Estado atual validado

Baseado nas fases 4B.1.E, 4B.2.E e 4B.3.E:

- baseline operacional aplicado no staging;
- migration Reader/Verifier/HITL aplicada no staging;
- 9 tabelas pipeline criadas;
- constraints, FKs, UNIQUE/dedupe, triggers e RLS validados;
- RLS habilitado nas 9 tabelas pipeline, sem policies;
- smoke test tecnico aprovado em transacao rollbackavel;
- fluxo validado: `opportunity` -> `orcamento` -> `opportunity_file` -> Reader -> Verifier -> Divergence -> HITL -> Decision -> Context Snapshot;
- gate validado como `blocked`;
- nenhuma escrita direta em `orcamento_itens`;
- rollback limpo, zero residuos.

## 3. Arquivos lidos

Documentos:

- `platform/docs/EVIS_ORCAMENTISTA_SMOKE_TEST_EXECUTION_4B3E.md`
- `platform/docs/EVIS_ORCAMENTISTA_SMOKE_TEST_PLAN_4B3P.md`
- `platform/docs/EVIS_READER_VERIFIER_HITL_POST_MIGRATION_VALIDATION_EXECUTION_4B2E.md`
- `platform/docs/EVIS_READER_VERIFIER_HITL_MIGRATION_EXECUTION_REPORT_4B1E.md`
- `platform/docs/sql_proposals/ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_MIGRATION_CANDIDATE.sql`

Codigo principal:

- `src/pages/OrcamentistaChat.tsx`
- `src/pages/Oportunidade/OrcamentistaTab.tsx`
- `src/hooks/useOrcamento.ts`
- `src/hooks/useOportunidadeOrcamento.ts`
- `src/hooks/useOportunidades.ts`
- `src/lib/api.ts`
- `platform/server/routes/orcamentista.ts`
- `platform/server/orcamentista/contracts.ts`
- `platform/server/orcamentista/etapa0.ts`
- `platform/server/orcamentista/graphEtapa0.ts`
- `platform/server/orcamentista/engine.ts`
- `server/tools/supabaseTools.ts`
- `platform/server/tools/supabaseTools.ts`
- `src/lib/orcamentista/realReaderSandbox.ts`
- `src/lib/orcamentista/readerSafetyRunner.ts`
- `src/lib/orcamentista/readerVerifierUtils.ts`
- `src/lib/orcamentista/hitlUtils.ts`
- `src/lib/orcamentista/consolidationGateUtils.ts`
- `src/lib/orcamentista/payloadReviewUtils.ts`
- `src/lib/orcamentista/mockPipeline.ts`

Varredura local relacionada:

- `rg --files | rg -i "orcamentista|orcamento|oportunidade|reader|verifier|hitl|gate|etapa0|supabaseTools"`
- `rg -n "mock|preview|orcamento_itens|generate-official-budget|opportunity_files|orc_reader|orc_hitl|context_snapshot|consolidation|can_write|canWrite" src platform/server server -S`

## 4. Mapa do codigo atual

### 4.1 Fluxo oficial/manual existente

`src/hooks/useOportunidadeOrcamento.ts` e `src/hooks/useOrcamento.ts` ja escrevem em:

- `orcamentos`;
- `opportunities.orcamento_id`;
- `orcamento_itens` para criacao, atualizacao e remocao manual.

Esse fluxo e oficial/manual, nao e o pipeline IA. Ele deve continuar separado da persistencia Reader/Verifier/HITL.

### 4.2 Oportunidades e arquivos

`src/hooks/useOportunidades.ts` possui:

- CRUD parcial de oportunidades;
- leitura de eventos;
- leitura read-only de `opportunity_files`.

Nao foi encontrado hook ou endpoint canonico para registrar `opportunity_files` a partir do upload do Orçamentista. O upload atual em `OrcamentistaChat.tsx` salva arquivo em workspace local via `/api/orcamentista/workspaces/:id/files`, nao em `opportunity_files`.

### 4.3 UI e mocks

`src/pages/Oportunidade/OrcamentistaTab.tsx` organiza uma experiencia rica, mas ainda majoritariamente mockada:

- documentos recebidos e inventario;
- processamento de paginas;
- Reader/Verifier;
- HITL;
- dispatch;
- preview consolidado;
- gate;
- payload review;
- pipeline IA legado/mockado.

Os paineis deixam claro que a pre-visualizacao IA nao grava automaticamente no orcamento oficial.

### 4.4 Chat e escrita legada

`src/pages/OrcamentistaChat.tsx` chama rotas server para chat, preview e upload local. O botao legado de geracao oficial fica em quarentena por `VITE_LEGACY_ORCAMENTISTA_OFFICIAL_WRITE`.

`platform/server/routes/orcamentista.ts` possui o endpoint legado:

- `POST /api/orcamentista/workspaces/:workspaceId/generate-official-budget`

Esse endpoint escreve em `orcamentos` e `orcamento_itens` somente se `LEGACY_ORCAMENTISTA_OFFICIAL_WRITE_ENABLED=true` e `NODE_ENV !== 'production'`. Por padrao retorna `410` e declara que nao e o fluxo canonico.

### 4.5 Etapa 0 e processamento documental

Existe base server-side real parcial:

- `platform/server/orcamentista/etapa0.ts` define schema, instrucao, validador e formatador;
- `platform/server/orcamentista/engine.ts` usa `VertexDocumentRuntimeProvider`;
- `platform/server/routes/orcamentista.ts` expoe `/api/orcamentista/etapa0/extract`;
- `platform/server/orcamentista/graphEtapa0.ts` ainda tem nos mockados para grafo/HITL.

### 4.6 Regras locais de Reader, Verifier, HITL e Gate

Ja existem utilitarios puros para:

- normalizacao/sandbox de Reader;
- safety gate;
- verificacao secundaria e divergencias;
- fila/decisao HITL em memoria;
- gate de consolidacao;
- payload review simulado.

Pontos criticos ja presentes:

- `canWriteConsolidationToBudget()` retorna sempre `false`;
- `payloadReviewUtils` mantem `can_write_to_budget=false`;
- varios paineis comunicam que nada foi gravado em `orcamento_itens`.

## 5. Arquitetura proposta

### 5.1 Principio

Criar uma camada server-side unica e pequena para persistir o pipeline. A UI nao deve escrever diretamente nas 9 tabelas pipeline nem em `opportunity_files`. O client deve chamar endpoints do servidor, e o servidor deve validar contratos, ordenar inserts, aplicar guards e gravar com credencial backend autorizada.

Arquitetura minima:

1. **Contratos de dominio** em TypeScript: inputs/outputs e status permitidos.
2. **Repository Supabase** server-side: funcoes finas, uma por tabela, sem regra de negocio complexa.
3. **Service/Coordinator** server-side: orquestra ordem, valida lineage, cria snapshots e bloqueia consolidacao.
4. **Routes HTTP** server-side: endpoints pequenos para app/UI e execucoes tecnicas.
5. **Client hooks read/write controlados**: leitura e acoes humanas, sem acesso direto a tabelas pipeline pelo browser.

### 5.2 Local recomendado

| Responsabilidade | Local proposto |
|------------------|----------------|
| Tipos e contratos persistidos | `platform/server/orcamentista/persistence/contracts.ts` ou expansao controlada de `platform/server/orcamentista/contracts.ts` |
| Validadores e guards | `platform/server/orcamentista/persistence/guards.ts` |
| Repository Supabase | `platform/server/orcamentista/persistence/repository.ts` |
| Service/coordinator | `platform/server/orcamentista/persistence/service.ts` |
| Rotas HTTP | adicionar subrouter em `platform/server/routes/orcamentista.ts` ou novo `platform/server/routes/orcamentistaPersistence.ts` montado sob `/api/orcamentista` |
| Hooks client futuros | `src/hooks/useOrcamentistaPersistence.ts` e hooks read-only especificos por oportunidade |
| UI | somente consumir estados persistidos em fases posteriores |

Escolha enxuta recomendada: criar pasta `platform/server/orcamentista/persistence/` com tres arquivos iniciais (`contracts.ts`, `guards.ts`, `service.ts`) e um repository separado quando a primeira escrita real for implementada.

## 6. Responsabilidades por camada

### 6.1 Server-side

Deve ficar server-side:

- writes em `opportunity_files`;
- writes nas 9 tabelas pipeline;
- validacao de FK lineage antes/depois de gravar;
- aplicacao de status permitidos;
- traducao de outputs do Reader/Verifier para colunas persistidas;
- criacao de HITL issue quando qualquer regra exigir revisao humana;
- criacao append-only de HITL decisions;
- criacao de context snapshots;
- bloqueio de qualquer payload que tente escrever em `orcamento_itens`;
- logs estruturados de erro sem secrets;
- uso de credencial backend, nunca chave anon do client para pipeline.

### 6.2 Client-side

Deve ficar client-side:

- exibir status do pipeline por oportunidade;
- listar arquivos registrados;
- exibir Reader/Verifier/HITL/Gate;
- submeter decisao humana HITL via endpoint server;
- solicitar reprocessamento ou reanalise via endpoint server;
- nunca montar SQL;
- nunca chamar Supabase direto para as 9 tabelas pipeline enquanto RLS nao tiver policies definitivas;
- nunca escrever em `orcamento_itens` por caminho IA.

### 6.3 Banco

O banco ja fornece:

- FKs e CHECKs;
- UNIQUE/dedupe em divergencias;
- trigger de imutabilidade de `raw_output_json`;
- trigger append-only em `orc_hitl_decisions`;
- RLS habilitado sem policies.

Nesta fase de arquitetura, nao ha proposta de schema novo.

## 7. Funcoes, adapters e endpoints propostos

### 7.1 Repository functions

| Funcao | Tabela | Observacao |
|--------|--------|------------|
| `createOpportunityFile(input)` | `opportunity_files` | Registra metadata de arquivo ja salvo em workspace/GCS/storage |
| `createReaderRun(input)` | `orc_reader_runs` | Primeira ancora page-scoped do pipeline |
| `createReaderOutput(input)` | `orc_reader_outputs` | Grava raw imutavel e output normalizado |
| `createSafetyEvaluation(input)` | `orc_reader_safety_evaluations` | Grava safety/dimensional checks |
| `createVerifierRun(input)` | `orc_verifier_runs` | Grava output do Verifier |
| `createReaderVerifierComparison(input)` | `orc_reader_verifier_comparisons` | Grava score, band e dispatch decision |
| `createDivergence(input)` | `orc_reader_verifier_divergences` | Usa `dedupe_key`; tratar conflito UNIQUE como divergencia ja existente |
| `createHitlIssue(input)` | `orc_hitl_issues` | Cria fila HITL auditavel |
| `createHitlDecision(input)` | `orc_hitl_decisions` | Append-only; nunca atualizar/deletar |
| `createContextSnapshot(input)` | `orc_context_snapshots` | Snapshot historico do gate/contexto |

### 7.2 Service functions

| Funcao | Papel |
|--------|-------|
| `registerOpportunityDocument(input)` | Salvar ou vincular metadata de arquivo e retornar `opportunity_file_id` |
| `persistReaderPageResult(input)` | Criar reader run, reader output e safety evaluation para uma pagina |
| `persistVerifierComparison(input)` | Criar verifier run, comparison e divergences |
| `openHitlIssuesFromComparison(input)` | Materializar issues HITL a partir de divergencias, safety ou comparison |
| `recordHitlDecision(input)` | Registrar decisao append-only e snapshot consequente |
| `createContextSnapshotForGate(input)` | Registrar estado `validated`, `pending`, `blocked` ou `incomplete` |
| `persistPipelineErrorSnapshot(input)` | Registrar erro parcial em context snapshot quando ja houver fonte rastreavel |
| `assertNoBudgetItemWriteIntent(input)` | Bloquear qualquer payload com intencao de gravar `orcamento_itens` |

### 7.3 Endpoints HTTP recomendados

Para manter a superficie pequena:

| Endpoint | Metodo | Uso |
|----------|--------|-----|
| `/api/orcamentista/opportunities/:opportunityId/files` | `POST` | Registrar `opportunity_file` apos upload local/GCS |
| `/api/orcamentista/opportunities/:opportunityId/pipeline/reader-page` | `POST` | Persistir Reader Run + Output + Safety Evaluation |
| `/api/orcamentista/opportunities/:opportunityId/pipeline/verifier-comparison` | `POST` | Persistir Verifier Run + Comparison + Divergences |
| `/api/orcamentista/opportunities/:opportunityId/hitl/issues` | `POST` | Criar issue HITL quando necessario |
| `/api/orcamentista/opportunities/:opportunityId/hitl/issues/:issueId/decisions` | `POST` | Registrar HITL decision append-only |
| `/api/orcamentista/opportunities/:opportunityId/context-snapshots` | `POST` | Criar snapshot/gate explicito |
| `/api/orcamentista/opportunities/:opportunityId/pipeline` | `GET` | Ler estado agregado do pipeline |

Opcao alternativa para reduzir round-trips: um endpoint tecnico server-only `POST /api/orcamentista/opportunities/:opportunityId/pipeline/smoke-page-flow` para fluxo completo de pagina, usado apenas em testes controlados. Nao deve ser exposto como caminho UI canonico.

## 8. Contratos minimos

### 8.1 Base comum

Todo input persistivel deve carregar:

```ts
type PipelineBaseInput = {
  opportunity_id: string;
  orcamento_id?: string | null;
  opportunity_file_id?: string | null;
  page_number?: number | null;
  document_id?: string | null;
  source_refs_json?: Record<string, unknown>;
};
```

### 8.2 Arquivo / opportunity_file

```ts
type RegisterOpportunityFileInput = {
  opportunity_id: string;
  nome: string;
  url?: string | null;
  storage_path?: string | null;
  categoria?: string | null;
  mime_type?: string | null;
  tamanho_bytes?: number | null;
};
```

Output minimo:

```ts
type PersistedOpportunityFile = {
  id: string;
  opportunity_id: string;
  nome: string;
  storage_path?: string | null;
};
```

### 8.3 Reader run

```ts
type CreateReaderRunInput = PipelineBaseInput & {
  opportunity_file_id: string;
  page_number: number;
  reader_motor: string;
  source_quality: string;
  status: 'received' | 'normalized' | 'safety_evaluated' | 'blocked' | 'ready_for_verifier';
};
```

### 8.4 Reader output

```ts
type CreateReaderOutputInput = PipelineBaseInput & {
  reader_run_id: string;
  opportunity_file_id: string;
  page_number: number;
  raw_output_json: Record<string, unknown>;
  normalized_output_json: Record<string, unknown>;
  identified_count: number;
  inferred_count: number;
  missing_count: number;
  confidence_score?: number | null;
};
```

Regra: `raw_output_json` e imutavel. Correcoes devem criar novo output ou nova rodada, nunca update do raw.

### 8.5 Safety evaluation

```ts
type CreateSafetyEvaluationInput = PipelineBaseInput & {
  reader_run_id: string;
  reader_output_id: string;
  opportunity_file_id: string;
  page_number: number;
  safety_gate_json: Record<string, unknown>;
  dimensional_checks_json: Record<string, unknown>;
  requires_verifier: boolean;
  requires_hitl: boolean;
  blocks_consolidation: boolean;
  allowed_to_dispatch: boolean;
};
```

Regra: `blocks_consolidation=true` e `allowed_to_dispatch=true` nunca podem coexistir.

### 8.6 Verifier run

```ts
type CreateVerifierRunInput = PipelineBaseInput & {
  reader_run_id: string;
  reader_output_id: string;
  opportunity_file_id: string;
  page_number: number;
  verifier_motor: string;
  verifier_output_json: Record<string, unknown>;
  status: 'received' | 'normalized' | 'compared' | 'requires_hitl' | 'blocked' | 'approved';
};
```

### 8.7 Comparison

```ts
type CreateReaderVerifierComparisonInput = PipelineBaseInput & {
  reader_output_id: string;
  verifier_run_id: string;
  opportunity_file_id: string;
  page_number: number;
  agreement_score: number;
  agreement_band: 'low' | 'medium' | 'high';
  comparison_json: Record<string, unknown>;
  dispatch_decision_json: Record<string, unknown>;
  requires_hitl: boolean;
  blocks_consolidation: boolean;
  allowed_to_dispatch: boolean;
  status: 'pending' | 'divergent' | 'requires_hitl' | 'dispatch_allowed' | 'consolidation_blocked';
};
```

### 8.8 Divergence

```ts
type CreateDivergenceInput = PipelineBaseInput & {
  comparison_id: string;
  reader_output_id: string;
  verifier_run_id: string;
  opportunity_file_id: string;
  page_number: number;
  category: string;
  technical_field: string;
  affected_item?: string | null;
  discipline?: string | null;
  title: string;
  reader_value?: string | null;
  verifier_value?: string | null;
  reason: string;
  severity: 'baixa' | 'media' | 'alta' | 'critica';
  requires_hitl: boolean;
  blocks_consolidation: boolean;
  dedupe_key: string;
  status?: 'aberta' | 'aceita' | 'descartada' | 'resolvida';
};
```

Regra: conflito UNIQUE em `(comparison_id, dedupe_key)` deve ser tratado como dedupe esperado, nao como duplicacao silenciosa.

### 8.9 HITL issue

```ts
type CreateHitlIssueInput = PipelineBaseInput & {
  comparison_id?: string | null;
  reader_run_id?: string | null;
  reader_output_id?: string | null;
  verifier_run_id?: string | null;
  divergence_id?: string | null;
  opportunity_file_id?: string | null;
  source_type: string;
  source_id?: string | null;
  source_ref?: string | null;
  issue_type: string;
  severity: 'baixa' | 'media' | 'alta' | 'critica';
  status: 'pendente' | 'em_revisao' | 'aprovada_com_ressalva' | 'bloqueada' | 'documento_solicitado' | 'convertida_em_verba' | 'ignorada_nesta_fase' | 'reanalisar_futuramente';
  title: string;
  description: string;
  evidence_summary: string;
  recommended_action: string;
  blocks_dispatch: boolean;
  blocks_consolidation: boolean;
};
```

### 8.10 HITL decision

```ts
type CreateHitlDecisionInput = {
  hitl_issue_id: string;
  opportunity_id: string;
  orcamento_id?: string | null;
  decision_type: 'aprovar_com_ressalva' | 'manter_bloqueado' | 'solicitar_documento' | 'marcar_como_verba' | 'ignorar_nesta_fase' | 'reanalisar_futuramente';
  notes: string;
  decided_by: string;
  dispatch_released: boolean;
  consolidation_released: boolean;
  source_refs_json?: Record<string, unknown>;
  issue_snapshot_json?: Record<string, unknown>;
  decision_payload_json?: Record<string, unknown>;
};
```

Regra: decision e append-only. Nao atualizar, nao deletar, nao truncar.

### 8.11 Context snapshot

```ts
type CreateContextSnapshotInput = PipelineBaseInput & {
  reader_run_id?: string | null;
  reader_output_id?: string | null;
  verifier_run_id?: string | null;
  comparison_id?: string | null;
  hitl_issue_id?: string | null;
  source_type: string;
  source_id?: string | null;
  source_ref?: string | null;
  phase: string;
  context_status: 'validated' | 'pending' | 'blocked' | 'incomplete';
  context_snapshot_json: Record<string, unknown>;
  created_by: string;
};
```

## 9. Fluxo de persistencia proposto

### 9.1 Registro de documento

1. UI envia arquivo para workspace local/GCS como hoje.
2. Server registra metadata em `opportunity_files`.
3. Server retorna `opportunity_file_id`.
4. UI passa a exibir arquivo como persistido, nao apenas inventario mockado.

### 9.2 Reader

1. Server recebe pedido de leitura por `opportunity_id`, `opportunity_file_id`, `page_number`.
2. Server executa Reader ou recebe output ja produzido por componente aprovado.
3. Server cria `orc_reader_runs`.
4. Server cria `orc_reader_outputs`.
5. Server cria `orc_reader_safety_evaluations`.
6. Se safety exigir Verifier/HITL, status e flags permanecem bloqueantes.

### 9.3 Verifier e comparison

1. Server executa Verifier ou recebe output aprovado.
2. Server cria `orc_verifier_runs`.
3. Server cria `orc_reader_verifier_comparisons`.
4. Server cria divergencias deduplicadas em `orc_reader_verifier_divergences`.
5. Se houver divergencia relevante, cria HITL issue ou retorna indicacao obrigatoria para etapa seguinte.

### 9.4 HITL

1. Server cria `orc_hitl_issues` para divergencias, safety blocks, inferencias relevantes ou lacunas.
2. Client exibe fila HITL.
3. Usuario humano submete decisao.
4. Server cria `orc_hitl_decisions` append-only.
5. Server cria `orc_context_snapshots` com estado resultante.

### 9.5 Gate/contexto

1. Gate le `safety`, `comparison`, `divergences`, `hitl_issues` e `hitl_decisions`.
2. Gate calcula `context_status`:
   - `blocked`: bloqueio ativo ou decisao `manter_bloqueado`;
   - `pending`: HITL/documento/reanalise pendente;
   - `validated`: sem bloqueios e decisoes suficientes;
   - `incomplete`: erro parcial ou fonte insuficiente.
3. Server persiste snapshot historico.
4. Mesmo `validated` nao autoriza gravar `orcamento_itens` nesta fase.

## 10. Bloqueios obrigatorios

- Nenhum endpoint IA pode chamar hooks ou repository de `orcamento_itens`.
- Nenhum contrato de pipeline deve aceitar `budget_items`, `orcamento_itens`, `items_to_insert` ou campo equivalente de escrita oficial.
- `consolidation_released=true` em HITL decision significa apenas liberacao semantica futura, nao escrita.
- `context_status='validated'` significa contexto validado, nao consolidacao oficial.
- O endpoint legado `/generate-official-budget` deve permanecer quarentenado e fora do fluxo canonico.
- Qualquer rota nova deve rejeitar payloads que contenham intencao de gravar item oficial.
- Logs e snapshots podem mencionar payload simulado, mas devem manter `can_write_to_budget=false`.

## 11. Regra explicita contra escrita direta em `orcamento_itens`

Nesta fase e nas subfases 4C iniciais:

> A camada de persistencia do Orçamentista IA esta proibida de executar `INSERT`, `UPDATE`, `DELETE`, `UPSERT` ou qualquer chamada equivalente contra `public.orcamento_itens`.

Implementacao futura deve conter pelo menos estes guards:

- `assertNoBudgetItemWriteIntent(payload)` no service;
- teste unitario que falha se repository/import do pipeline referenciar `orcamento_itens`;
- lint/test textual em rotas de persistencia para bloquear `.from('orcamento_itens')`;
- endpoint legado mantido fora do fluxo canonico;
- `canWriteConsolidationToBudget()` permanecendo `false` ate fase explicitamente autorizada.

## 12. Integracao com Reader/Verifier/HITL/Gate

### Reader

O output de `realReaderSandbox`, normalizacao e safety runner deve ser convertido em:

- `orc_reader_runs`;
- `orc_reader_outputs`;
- `orc_reader_safety_evaluations`.

### Verifier

As funcoes de comparison devem produzir:

- `orc_verifier_runs`;
- `orc_reader_verifier_comparisons`;
- `orc_reader_verifier_divergences`.

### HITL

`hitlUtils` hoje aplica decisao mockada em memoria. A camada oficial deve substituir isso por:

- criacao de `orc_hitl_issues`;
- registro append-only em `orc_hitl_decisions`;
- nunca atualizar decision;
- contexto posterior via snapshot.

### Gate

`consolidationGateUtils` e `payloadReviewUtils` devem continuar simulados para escrita oficial. A primeira integracao persistente deve gravar apenas `orc_context_snapshots`.

## 13. Erros e estados parciais

Sem criar novas tabelas, a estrategia minima e:

- erro antes de qualquer fonte persistida: retornar erro HTTP estruturado e nao gravar nada;
- erro apos `reader_run`: criar context snapshot `incomplete` apontando para `reader_run_id`;
- erro apos `reader_output`: snapshot `incomplete` apontando para `reader_output_id`;
- erro apos comparison/divergence: criar HITL issue ou snapshot `blocked/incomplete`;
- conflito UNIQUE de divergence: tratar como dedupe e retornar divergence existente quando possivel;
- falha ao registrar HITL decision: retornar erro e nao simular liberacao;
- falha de snapshot: retornar erro, mas nunca liberar consolidacao oficial.

Formato minimo de erro:

```ts
type OrcamentistaPersistenceError = {
  code: string;
  message: string;
  stage: 'file' | 'reader' | 'safety' | 'verifier' | 'comparison' | 'divergence' | 'hitl_issue' | 'hitl_decision' | 'context_snapshot';
  retryable: boolean;
  source_ref?: string;
};
```

## 14. Riscos

| Risco | Mitigacao |
|-------|-----------|
| Escrever pipeline pelo client com anon key | Manter writes server-side; RLS segue sem policies para pipeline |
| Partial writes entre varias tabelas | Preferir transacao server-side quando houver driver apropriado; senao registrar snapshots `incomplete` e manter fluxo append-only |
| Confundir contexto validado com consolidacao oficial | Nomear campos e UI como contexto/gate, nao como item oficial |
| Endpoint legado voltar a ser usado | Manter flag off, 410 por default e excluir do fluxo canonico |
| HITL decision liberar consolidacao cedo demais | Interpretar `consolidation_released` apenas como semantica futura; `can_write_to_budget=false` |
| Duplicidade de divergencias | Usar `dedupe_key` e tratar UNIQUE como dedupe |
| Expor secrets no client | Nenhuma credencial backend no frontend |
| Falta de transaction support via PostgREST | Decidir no 4C.1 entre adapter com `pg` server-side ou operacoes append-only com compensacao documental |

## 15. Pendencias

- Definir mecanismo transacional oficial do backend: `pg` server-side, RPC futura ou sequencia append-only controlada.
- Definir autenticacao/autorizacao das rotas server do Orçamentista.
- Definir como associar workspace local/GCS a `opportunity_files`.
- Criar contratos TypeScript especificos do pipeline persistido.
- Criar repository Supabase server-side sem dependencia de config client.
- Criar endpoints write apenas para backend/app autenticado.
- Criar queries agregadas read-only para UI.
- Planejar testes unitarios e teste controlado de staging.
- Manter consolidacao real em `orcamento_itens` fora do escopo.

## 16. Sequencia recomendada de implementacao

### 4C.1 - Contracts and Guards

- Criar contratos TypeScript da persistencia.
- Criar guards de status, lineage e bloqueio de `orcamento_itens`.
- Testar guards localmente sem banco.

### 4C.2 - Server Repository Skeleton

- Criar repository server-side para `opportunity_files` e 9 tabelas pipeline.
- Sem ligar UI ainda.
- Incluir testes de shape/serializacao.

### 4C.3 - Reader Persistence

- Implementar `registerOpportunityDocument`.
- Implementar `persistReaderPageResult`.
- Persistir Reader Run, Reader Output e Safety Evaluation.

### 4C.4 - Verifier and Divergence Persistence

- Implementar `persistVerifierComparison`.
- Persistir Verifier Run, Comparison e Divergences.
- Tratar dedupe por `dedupe_key`.

### 4C.5 - HITL and Context Snapshot Persistence

- Implementar `openHitlIssuesFromComparison`.
- Implementar `recordHitlDecision`.
- Implementar `createContextSnapshotForGate`.
- Garantir append-only e snapshots `blocked/pending/validated/incomplete`.

### 4C.6 - Read Models and UI Wiring

- Criar endpoint agregado `GET /pipeline`.
- Substituir mocks por leitura persistida gradualmente.
- Manter UI de preview e gate sem escrita oficial.

### 4C.7 - Controlled Staging Validation

- Executar testes controlados em staging.
- Validar zero escrita em `orcamento_itens`.
- Validar lineage persistente e snapshots.

### Fase futura - Controlled Consolidation

- Somente apos nova autorizacao, desenhar camada separada para transformar payload aprovado em `orcamento_itens`.
- Essa fase deve ter migration/guards/tests proprios e HITL explicito.

## 17. Decisao objetiva

**Pronto para iniciar 4C.1.**

Nao ha lacuna tecnica bloqueante para iniciar a arquitetura de contratos e guards. A principal decisao tecnica pendente e escolher o mecanismo transacional server-side antes de implementar writes multi-tabela em ambiente real.

Recomendacao: iniciar 4C.1 por contratos e guards, sem tocar em UI e sem criar escrita em `orcamento_itens`.
