# EVIS — Commercial Feedback Learning Loop

> Fase: 4A.L
> Tipo: arquitetura/documentacao
> Status: proposta documental; sem migration; sem SQL; sem banco alterado; sem codigo operacional/UI alterado
> Escopo: ciclo enxuto de aprendizado comercial baseado em feedback real de propostas/orcamentos

## 1. Objetivo

Criar uma camada de aprendizado comercial que registre acontecimentos relevantes apos a tratativa de uma proposta e transforme feedback real do cliente em inteligencia para proximas propostas.

A camada deve responder, ao longo do tempo, perguntas como:

- onde a proposta perdeu competitividade;
- onde houve erro de escopo;
- onde houve falha de apresentacao;
- onde o concorrente ofereceu preco menor com escopo diferente;
- quais pontos positivos devem ser repetidos;
- quais pontos negativos devem gerar alertas, correcoes ou automacoes futuras.

A camada nao calcula orcamento, nao gera proposta e nao substitui o Orcamentista IA. Ela aprende com o que aconteceu depois que a proposta saiu da Berti.

## 2. O que esta camada NAO deve ser

- Nao deve ser uma replica do orcamento tecnico.
- Nao deve recalcular custo, BDI, margem ou composicao SINAPI.
- Nao deve corrigir item de orcamento automaticamente.
- Nao deve alterar `orcamento_itens`, `orcamentos`, `propostas` ou qualquer tabela tecnica.
- Nao deve registrar todo comentario interno como entidade persistente.
- Nao deve criar dezenas de tabelas auxiliares.
- Nao deve virar CRM completo, pipeline kanban ou substituto de `opportunities`.
- Nao deve registrar dado puramente sentimental sem implicacao em decisao futura.
- Nao deve transformar concorrente mais barato automaticamente em "Berti estava cara".

## 3. Por que evitar excesso de tabelas/camadas

Cada nova tabela aumenta:

- custo de manutencao;
- risco de divergencia com schema oficial;
- complexidade de RLS e auditoria;
- complexidade de hooks/queries no frontend;
- chance de duplicar informacao ja existente em `opportunities`/`propostas`.

A regra central da Fase 4A.L:

```text
Se o dado nao melhora proposta, negociacao ou estrategia futura,
ele nao deve virar estrutura persistente.
```

Aprendizado sem destino operacional vira historico morto. Historico morto polui o schema sem retorno.

## 4. Fluxo cronologico do feedback

```text
Oportunidade
  -> Orcamento (manual ou Orcamentista IA)
    -> Proposta enviada ao cliente
      -> Tratativa comercial (negociacao, ajustes, contraproposta)
        -> Resultado: ganho / perdido / em negociacao / sem resposta
          -> Solicitacao de feedback ao cliente apos a tratativa
            -> Captura de feedback declarado e valores de concorrentes (quando disponiveis)
              -> Classificacao por categoria (preco, escopo, prazo, apresentacao, etc.)
                -> Geracao de insight comercial
                  -> Geracao de alerta/recomendacao para proximas propostas
                    -> Influencia em apresentacao, argumentacao e estrategia
                      -> Proxima proposta mais competitiva
```

O fluxo so comeca apos a tratativa. Nao se trata de um pipeline kanban; trata-se de um registro pos-evento que alimenta decisao futura.

## 5. Diferenca entre orcamento tecnico e aprendizado comercial

| Camada | Funcao | Fonte da verdade | O que altera |
|--------|--------|------------------|--------------|
| Orcamento tecnico | calcular custo, quantitativo, BDI, margem | projeto, memorial, SINAPI, composicoes Berti | `orcamentos`, `orcamento_itens` |
| Proposta | apresentar valor ao cliente | snapshot do orcamento + payload comercial | `propostas` |
| Aprendizado comercial | aprender com tratativa pos-proposta | feedback do cliente, concorrentes, decisao humana | apenas a propria camada de feedback |

Regra inviolavel:

- aprendizado comercial **nao corrige** custo tecnico validado;
- pode influenciar apresentacao, argumentacao, alertas e estrategia;
- pode sugerir revisao manual de uma composicao no Orcamentista IA, mas a revisao tecnica e responsabilidade humana e do Orcamentista IA, nao do feedback.

## 6. Como registrar propostas ganhas/perdidas

Apos a tratativa, registra-se um evento de feedback unico vinculado a:

- `opportunity_id` (sempre obrigatorio);
- `proposta_id` (quando houver proposta persistida);
- `orcamento_id` (quando aplicavel).

Resultado declarado por enum simples:

- `ganho`;
- `perdido`;
- `em_negociacao`;
- `sem_resposta`;
- `cancelado_pelo_cliente`;
- `cancelado_pela_berti`.

Nao criar mais variantes de status sem necessidade operacional clara.

## 7. Como registrar valores de concorrentes

Quando o cliente compartilhar valores de concorrentes, registrar dentro do mesmo evento de feedback:

- `valor_berti` (valor proposto pela Berti);
- `valor_concorrente` (valor mencionado, quando declarado);
- `diferenca_percentual` (calculada);
- `escopo_comparado` (texto curto ou JSON estruturado leve descrevendo se o escopo do concorrente era equivalente, reduzido, expandido ou desconhecido);
- `concorrente_identificado` (texto opcional; pode ser anonimizado).

Regras:

- nunca confiar em valor de concorrente sem registrar `escopo_comparado`;
- concorrente mais barato com escopo reduzido **nao** significa que a Berti estava cara;
- concorrente mais caro com escopo equivalente reforca posicionamento, nao justifica aumentar preco automaticamente;
- valor declarado pelo cliente e indicativo, nao prova; deve ser tratado como evidencia comercial, nao como fato tecnico.

## 8. Como classificar motivos de perda/ganho

Cada evento de feedback recebe:

- `motivo_declarado`: o que o cliente disse (texto curto livre ou referenciado a categoria);
- `motivo_inferido`: o que a Berti acredita que realmente aconteceu (texto curto + categoria);
- `categoria`: enum operacional curto.

Categorias sugeridas:

- `preco`;
- `prazo`;
- `escopo`;
- `clareza`;
- `apresentacao`;
- `confianca`;
- `condicao_pagamento`;
- `relacionamento`;
- `concorrencia`;
- `timing`;
- `diferenciais_mal_comunicados`;
- `documentacao_art_gestao`;
- `etapa_cinza_vs_acabamento`.

Regras:

- categoria e enum fechado, controlado por CHECK quando virar tabela real;
- adicao de nova categoria exige decisao explicita;
- evento pode citar mais de uma categoria via `categoria` principal + `categorias_secundarias` em campo JSON simples, mas a categoria principal deve ser unica.

## 9. Como transformar feedback em insights

Insight nao e o evento bruto. Insight e a leitura agregada de um conjunto de eventos.

Exemplos de insights derivaveis:

- "Proposta perde por preco em obras de acabamento alto, mas ganha em obras de cinza pesado." — categoria `preco` + `etapa_cinza_vs_acabamento`.
- "Cliente recorrente percebe valor em ART/gestao; cliente novo nao." — categoria `documentacao_art_gestao` + `relacionamento`.
- "Concorrentes ganham com prazo curto e escopo reduzido em obras pequenas." — categoria `prazo` + `escopo` + `concorrencia`.

Insights podem ser persistidos como linhas em uma estrutura simples (uma tabela), nao como entidades com sub-tabelas.

## 10. Como gerar alertas futuros

Alerta e a aplicacao de um insight a uma nova oportunidade/proposta.

Exemplos:

- "Esta oportunidade tem perfil de obra de acabamento alto. Em casos similares, a Berti perdeu 60% por preco. Reforcar diferenciais antes de competir por valor."
- "Cliente declarou nao priorizar ART/gestao. Reorientar argumentacao para risco de execucao informal."
- "Concorrente mencionado historicamente reduz escopo de impermeabilizacao. Antecipar este ponto na apresentacao."

Alertas devem:

- ser leves;
- aparecer no contexto da oportunidade ou da proposta em construcao;
- ser textuais e auditaveis;
- nao bloquear acoes; apenas informar.

## 11. Como influencia proposta/apresentacao/negociacao sem corromper o orcamento tecnico

A camada de aprendizado pode:

- exibir alertas na tela da oportunidade;
- exibir alertas na tela da proposta antes do envio;
- sugerir reforco de diferenciais (clareza, escopo, ART, gestao, prazo);
- sugerir revisao humana de margem em casos com historico de perda por preco;
- sugerir reorganizacao de apresentacao (ordem, foco, narrativa);
- alimentar dashboards comerciais.

A camada de aprendizado nao pode:

- alterar `orcamento_itens` automaticamente;
- alterar valores de proposta automaticamente;
- recalcular BDI;
- alterar composicoes do Orcamentista IA;
- escrever em `propostas` fora dos campos de payload comercial ja existentes.

A separacao e rigida. Aprendizado fala com humano. Humano fala com Orcamentista. Orcamentista fala com orcamento tecnico.

## 12. Sugestao minima de estrutura futura

A proposta minima e **uma tabela**. Quando justificavel, ate **duas**.

### 12.1 Tabela principal: `proposal_feedback_events`

Campo a campo:

| Campo | Tipo sugerido | Obrigatorio | Observacao |
|-------|---------------|-------------|------------|
| `id` | uuid PK | sim | `gen_random_uuid()` |
| `opportunity_id` | uuid | sim | ancora obrigatoria; FK futura |
| `proposta_id` | uuid | nao | nullable quando proposta nao chegou a ser persistida |
| `orcamento_id` | uuid | nao | nullable nas fases iniciais |
| `resultado` | text (enum) | sim | `ganho/perdido/em_negociacao/sem_resposta/cancelado_pelo_cliente/cancelado_pela_berti` |
| `valor_berti` | numeric | nao | valor proposto pela Berti, snapshot |
| `valor_concorrente` | numeric | nao | quando declarado |
| `diferenca_percentual` | numeric | nao | calculada quando ambos os valores existirem |
| `escopo_comparado` | text/jsonb | nao | descricao curta ou JSON leve |
| `concorrente_identificado` | text | nao | pode ser anonimizado |
| `motivo_declarado` | text | nao | o que o cliente disse |
| `motivo_inferido` | text | nao | o que a Berti acredita |
| `categoria` | text (enum) | sim | categoria principal |
| `categorias_secundarias` | jsonb | nao | array de strings, sem entidade propria |
| `pontos_positivos` | text | nao | o que repetir |
| `pontos_negativos` | text | nao | o que corrigir |
| `insight` | text | nao | leitura comercial sintetica |
| `alerta_futuro` | text | nao | alerta para proximas propostas similares |
| `acao_recomendada` | text | nao | acao concreta sugerida |
| `fonte_feedback` | text | sim | `cliente_direto/intermediario/observacao_interna/dado_publico` |
| `data_feedback` | date | sim | data em que o feedback foi recebido |
| `criado_por` | text | sim | autor do registro |
| `created_at` | timestamptz | sim | `now()` |
| `updated_at` | timestamptz | sim | `now()` |

Regras:

- `opportunity_id` obrigatorio sempre;
- `proposta_id` e `orcamento_id` opcionais por design;
- `categoria` validada por CHECK;
- `resultado` validado por CHECK;
- nada de FK para `orcamento_itens`;
- nenhuma escrita em `orcamento_itens`, `orcamentos` ou `propostas`.

### 12.2 Tabela opcional: `proposal_learning_insights`

Cabe quando insights derivados de varios eventos precisarem ser referenciados em alertas. Se for possivel viver com `insight` direto na tabela de eventos, **nao criar esta tabela**.

Quando criar, manter enxuta:

| Campo | Tipo sugerido | Obrigatorio | Observacao |
|-------|---------------|-------------|------------|
| `id` | uuid PK | sim | `gen_random_uuid()` |
| `titulo` | text | sim | resumo curto |
| `descricao` | text | sim | leitura agregada |
| `categoria` | text (enum) | sim | mesma lista da secao 8 |
| `confidence` | numeric(3,2) | nao | 0..1, opcional |
| `eventos_referenciados` | jsonb | nao | array de uuids de `proposal_feedback_events`, sem entidade propria |
| `acao_recomendada` | text | nao | acao concreta para proximas oportunidades |
| `ativo` | boolean | sim | permite "aposentar" insights que perderam validade |
| `created_at` | timestamptz | sim | `now()` |
| `updated_at` | timestamptz | sim | `now()` |

Sem tabela ponte. Sem entidade de "evento citado". Sem entidade de "categoria". Sem entidade de "acao". Tudo dentro destas duas tabelas, no maximo.

## 13. Regras

1. Feedback comercial nao altera custo tecnico validado.
2. Feedback pode influenciar apresentacao, argumentacao, alertas e estrategia.
3. Valor de concorrente sempre exige `escopo_comparado` registrado.
4. Concorrente mais barato nao significa automaticamente que a Berti estava cara.
5. Aprendizado deve gerar decisao futura, nao apenas historico morto.
6. Categoria e enum fechado; nova categoria exige decisao explicita.
7. Insight sem `acao_recomendada` ou sem `alerta_futuro` correspondente perde valor operacional.
8. `proposta_id` e `orcamento_id` permanecem opcionais por design.
9. Insights podem ser desativados (`ativo = false`) quando perderem validade.
10. Camada nao escreve em `orcamento_itens` em nenhuma hipotese.

## 14. Anti-poluicao arquitetural

Esta secao e inviolavel.

- Nao criar dezenas de tabelas.
- Nao transformar todo comentario em entidade.
- Nao criar tabela para "categoria", "acao", "fonte de feedback", "tipo de motivo" ou "vinculo evento-insight". Tudo isso e enum, JSON leve ou texto controlado.
- Nao criar tabela ponte `proposal_feedback_event_categories`. `categorias_secundarias` em JSONB resolve.
- Nao criar tabela `proposal_feedback_competitors`. `concorrente_identificado` em texto basta.
- Nao criar tabela `proposal_feedback_actions`. `acao_recomendada` em texto basta.
- Nao criar tabela `proposal_feedback_attachments` sem necessidade real; reutilizar `opportunity_files` quando possivel.
- Se o dado nao melhora proposta, negociacao ou estrategia, nao deve virar estrutura persistente.
- Limite arquitetonico: **1 tabela** por padrao, **2 tabelas** quando insight agregado precisar ser referenciado por mais de uma oportunidade.

Quando em duvida, escolher menos. Sempre.

## 15. Como isso conversa com o Orcamentista IA

A divisao de responsabilidades e simples:

```text
Orcamentista calcula.
Proposta convence.
Feedback ensina.
EVIS conecta os tres.
```

Detalhamento:

- **Orcamentista IA**: le projetos, valida com Reader/Verifier/HITL, gera quantitativos e custos. Fonte tecnica da verdade.
- **Proposta**: snapshot comercial do orcamento, com narrativa, escopo, prazo e condicoes. Fonte da verdade do que foi enviado ao cliente.
- **Feedback comercial (esta camada)**: registra o que aconteceu apos a proposta sair, transforma em insight, alimenta alertas para proximas oportunidades.
- **EVIS**: orquestra os tres, mantem rastreabilidade entre `opportunity_id`, `orcamento_id`, `proposta_id` e `proposal_feedback_events.id`, e exibe alertas no contexto certo.

A integracao e leve:

- alertas aparecem na tela da oportunidade quando ela "casar" com perfil de eventos historicos;
- alertas aparecem na tela da proposta antes do envio;
- insights podem ser citados manualmente em revisao de margem ou apresentacao;
- nenhuma escrita automatica em camada tecnica.

## 16. Confirmacoes desta fase

- Nenhum SQL executado.
- Nenhuma migration criada.
- Nenhuma tabela criada.
- Nenhum banco alterado.
- Nenhum codigo operacional alterado.
- Nenhuma UI alterada.
- Nenhum tipo TypeScript adicionado.
- Nenhum hook criado.
- Nenhum componente criado.
- Apenas documento arquitetural criado.

## 17. Proximos passos recomendados (fora desta fase)

1. Validar humanamente as 13 categorias propostas com o time comercial da Berti.
2. Validar enum de `resultado` com o processo real pos-tratativa.
3. Decidir se `proposal_learning_insights` sera necessaria desde o inicio ou se `proposal_feedback_events.insight` resolve sozinho.
4. Em fase futura (4A.L.1), criar SQL draft analogo ao 4A.2 para esta camada, sem migration.
5. Em fase posterior, definir RLS por papel (comercial, gestor, auditor) antes de qualquer aplicacao real.
6. Em fase posterior, definir como alertas serao exibidos na UI sem poluir as telas existentes.
