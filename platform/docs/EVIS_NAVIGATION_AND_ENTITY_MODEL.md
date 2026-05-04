# EVIS — Modelo de Navegação e Entidades

## Relação com o processo canônico

Este documento complementa **EVIS_CANONICAL_PROCESS.md**. O processo canônico define a ordem temporal obrigatória do EVIS:

```text
Lead/Oportunidade → Orçamentista IA → Proposta → Obra → Diário de Obra IA
```

Este documento define a navegação, as entidades, os vínculos relacionais e o comportamento esperado dos cliques dentro da plataforma.

Em caso de decisão sobre fluxo cronológico, prevalece **EVIS_CANONICAL_PROCESS.md**. Em caso de decisão sobre navegação, agrupamento de entidades, contexto de telas, vínculos e rotas, este documento deve ser usado como referência canônica complementar.

---

## Sidebar global oficial

A sidebar global do EVIS deve seguir esta ordem:

| Item | Escopo | Entidade principal | Rota esperada | Observação |
|---|---|---|---|---|
| Home | Global | Agregação operacional | `/` ou `/home` | Visão operacional agregada. Não é um menu de módulos. |
| Obras | Global | obras | `/obras` | Lista e entrada para obras em execução, planejadas ou encerradas. |
| Oportunidades | Global | opportunities | `/oportunidades` | Entrada comercial e pré-venda. |
| Propostas | Global | propostas | `/propostas` | Visão consolidada de propostas comerciais. |
| Tarefas | Global | tarefas | `/tarefas` | Visão consolidada das tarefas internas e vinculadas. |
| Compras | Global | compras | `/compras` | Visão global de compras, fornecedores, cotações e ordens. |
| Financeiro | Global | financeiro_lancamentos | `/financeiro` | Financeiro global da empresa. Deve separar visão global e visão da obra. |
| Ferramentas | Global | Ferramentas operacionais | `/ferramentas` | Utilitários e recursos auxiliares, sem substituir fluxos canônicos. |
| Cadastros | Global | Cadastros auxiliares | `/cadastros` | Contatos, fornecedores, serviços, categorias e bases auxiliares. |
| Configurações | Global | Configurações | `/configuracoes` | Preferências, usuários, integrações e parâmetros. |

Nenhum item da sidebar deve quebrar a ordem canônica. Itens globais podem listar registros, mas a operação detalhada deve abrir o contexto correto da entidade.

> **Ajuste relevante:** Propostas foi reposicionada **logo após Oportunidades**, refletindo a ordem do processo canônico (Oportunidade → Orçamentista IA → Proposta → Obra). Tarefas e Compras seguem como módulos transversais.

---

## Home/Dashboard

Home não é menu. Home é uma visão operacional agregada da empresa.

A Home deve mostrar, no mínimo:

- Oportunidades ativas.
- Obras em execução.
- Propostas em aberto.
- Tarefas atrasadas ou vencendo.
- Pagamentos a receber.
- Resultado do mês.
- Próximas tarefas.
- Próximos pagamentos.
- Diários recentes.
- Oportunidades que precisam de ação.

### Regra de clique da Home

Todo clique no Dashboard deve abrir o contexto correto, não uma rota genérica sem vínculo.

| Origem do clique | Destino esperado |
|---|---|
| Card de oportunidade | `/oportunidades` ou `/oportunidades/:id` |
| Card de obra | `/obras` ou `/obras/:id` |
| Card de proposta | `/propostas` ou `/oportunidades/:id/propostas` |
| Tarefa | Tarefa dentro do contexto pai, quando houver vínculo |
| Pagamento | `/financeiro/pagamentos-cliente` (filtrado pelo vínculo, quando houver) |
| Diário recente | `/obras/:id/diario` |

Quando um item possuir `contexto_tipo` e `contexto_id`, o clique deve preservar esse contexto.

---

## Oportunidades

Oportunidade é a fase de pré-venda do EVIS. Ela representa um lead qualificado ou uma possibilidade comercial antes da existência da obra.

A Oportunidade concentra o histórico comercial, cliente, escopo preliminar, arquivos, tarefas, pagamentos comerciais quando aplicável, orçamento e propostas.

### Abas oficiais da Oportunidade

A ordem oficial das abas dentro de `/oportunidades/:id` é:

1. Geral
2. Orçamentista IA
3. Propostas
4. Tarefas
5. Pagamentos do cliente
6. Arquivos
7. Anotações
8. Atividades

### Regra do Orçamentista IA

O Orçamentista IA fica dentro da oportunidade.

- Ele não deve ficar no Hub como card solto.
- Ele não deve ficar dentro da Obra.
- Sua existência depende de uma Oportunidade, porque atua na fase pré-venda e gera a base técnica para a Proposta.

### Ganhar oportunidade

Quando uma Oportunidade é marcada como ganha:

- Uma Obra deve ser criada.
- O orçamento oficial validado passa a ser base inicial de planejamento e cronograma.
- A Oportunidade permanece como registro histórico.
- A Oportunidade deve se tornar read-only ou restringir edições que alterem o histórico comercial fechado.

---

## Orçamentista IA dentro da Oportunidade

O Orçamentista IA deve existir como aba ou rota contextual da Oportunidade:

```text
/oportunidades/:id/orcamentista
```

### Pontos de entrada

Os pontos de entrada oficiais são:

- Começar do zero.
- Usar modelo.
- Importar Excel/PDF.
- Gerar com IA.

### Orçamento ativo

Cada Oportunidade deve ter um orçamento ativo. Regras:

- A prévia gerada pela IA deve ser validada por HITL antes de virar orçamento oficial.
- O orçamento oficial alimenta a Proposta.
- A edição posterior do orçamento oficial deve criar uma nova versão ou exigir decisão explícita do usuário.
- O sistema deve evitar que alterações silenciosas no orçamento afetem propostas já enviadas.

---

## Propostas

Proposta nasce de um orçamento validado.

A Proposta é um snapshot comercial do orçamento no momento da geração ou envio. Ela deve preservar os itens, valores, condições comerciais e escopo usados naquela versão.

Alterações posteriores no orçamento não alteram proposta já enviada. Quando houver mudança relevante, deve ser gerada uma nova versão de proposta.

### Status oficiais da Proposta

Os status oficiais são:

- Rascunho.
- Enviada.
- Visualizada.
- Aceita.
- Recusada.
- Expirada.

Proposta aceita permite avançar para ganho da Oportunidade e criação da Obra, respeitando o processo canônico.

### Visão global de Propostas

A rota `/propostas` deve apresentar a visão consolidada de todas as propostas, com filtros por status, oportunidade, cliente, valor e período. Cada linha clicada abre a proposta dentro do contexto da oportunidade pai (`/oportunidades/:id/propostas`), preservando o vínculo.

---

## Obras

Obra é a fase pós-venda do EVIS.

A Obra só existe depois que uma Oportunidade foi ganha. Ela centraliza a execução, o planejamento, o diário, medições, compras, financeiro, tarefas, arquivos e anotações operacionais.

### Abas oficiais da Obra

A ordem oficial das abas dentro de `/obras/:id` é:

1. Visão Geral
2. Planejamento
3. Diário de Obra IA
4. Medições
5. Compras
6. Financeiro
7. Pagamentos do cliente
8. Tarefas
9. Arquivos
10. Anotações

### Diário de Obra IA

O Diário de Obra IA só existe dentro da Obra. Ele não deve atuar dentro da Oportunidade, porque sua função é operacional e depende de uma obra existente.

### Base de planejamento

O orçamento oficial validado na Oportunidade vira base inicial de planejamento e cronograma da Obra. Essa base não é verdade imutável da execução. A Obra pode ter ajustes operacionais, medições, compras, despesas e avanço real próprios, sempre preservando o vínculo com a origem comercial.

---

## Tarefas

Tarefas podem ser globais ou vinculadas a um contexto.

### Modelo conceitual

```text
contexto_tipo = interna | oportunidade | obra | compra | financeiro
contexto_id   = id do contexto
```

### Visões oficiais

- `/tarefas`: visão global consolidada.
- Dentro da Oportunidade: tarefas comerciais e de pré-venda.
- Dentro da Obra: tarefas operacionais e de execução.

Tarefa sem contexto é interna. Tarefa com contexto deve abrir no pai correto quando acessada por Dashboard, busca, notificação ou lista global.

---

## Compras

Compras são globais e também contextuais à Obra.

No escopo global, `/compras` deve mostrar a visão consolidada da empresa. Dentro da Obra, `/obras/:id/compras` deve mostrar apenas compras vinculadas àquela obra.

Compras devem ter:

- Solicitações.
- Cotações.
- Ordens de compra.
- Recebimento.
- Pagamento.
- Histórico de preços.

O histórico de preços deve alimentar futuramente o Orçamentista IA, permitindo que a base própria do EVIS aprenda com preços reais praticados em obras e compras anteriores.

---

## Financeiro

O EVIS deve separar Financeiro Global da Empresa e Financeiro da Obra.

### Financeiro Global da Empresa

Rota principal:

```text
/financeiro
```

Deve conter:

- Resumo.
- Pagamentos do cliente.
- Receitas.
- Despesas.
- Transferências.
- Contas e extratos.
- Notas fiscais.
- Fluxo de caixa.
- DRE gerencial.
- Resultado por obra.

### Financeiro da Obra

Rota contextual:

```text
/obras/:id/financeiro
```

Deve conter:

- Resumo da obra.
- Pagamentos do cliente.
- Compras/despesas da obra.
- Receitas da obra.
- Resultado da obra.
- Orçado x realizado.

### Regra de consolidação

Toda movimentação vinculada à Obra soma no Financeiro Global. Lançamento global sem Obra não aparece dentro de Obra.

---

## Navegação contextual

### URLs esperadas

As URLs esperadas são:

| Contexto | URL |
|---|---|
| Lista de oportunidades | `/oportunidades` |
| Detalhe da oportunidade | `/oportunidades/:id` |
| Orçamentista da oportunidade | `/oportunidades/:id/orcamentista` |
| Propostas da oportunidade | `/oportunidades/:id/propostas` |
| Pagamentos da oportunidade | `/oportunidades/:id/pagamentos` |
| Lista de obras | `/obras` |
| Detalhe da obra | `/obras/:id` |
| Planejamento da obra | `/obras/:id/planejamento` |
| Diário da obra | `/obras/:id/diario` |
| Compras da obra | `/obras/:id/compras` |
| Financeiro da obra | `/obras/:id/financeiro` |
| Tarefas globais | `/tarefas` |
| Compras globais | `/compras` |
| Financeiro global | `/financeiro` |
| Propostas globais | `/propostas` |

### Breadcrumb

Exemplo oficial:

```text
Home › Obras › Nome da Obra › Diário de Obra
```

### Regra contextual

Clique em item do Dashboard deve abrir o contexto correto, não uma rota genérica. Exemplos:

- Diário recente de uma Obra abre `/obras/:id/diario`.
- Tarefa de uma Oportunidade abre a tarefa dentro de `/oportunidades/:id`.
- Pagamento de cliente vinculado a uma Obra abre a visão financeira contextual ou a lista global filtrada com vínculo explícito.

---

## Modelo relacional conceitual

Este modelo é conceitual. Ele orienta produto, navegação e vínculos. Não cria migration, não altera banco e não substitui análise técnica de schema.

| Entidade | Pai | Filhos | Vínculos | Aparece no Dashboard? | Visão global? | Dentro de oportunidade? | Dentro de obra? |
|---|---|---|---|---|---|---|---|
| contacts | Nenhum | opportunities, obras, pagamentos_cliente, eventos | Cliente, responsável, contato comercial | Sim, quando exige ação ou está associado a oportunidade/obra | Sim, em Cadastros | Sim, como cliente/contato | Sim, como cliente/contato |
| opportunities | contacts | orcamentos, propostas, tarefas, pagamentos_cliente, arquivos, anotacoes, eventos, obras quando ganha | Origem comercial da Obra | Sim | Sim | Sim | Indiretamente, como origem histórica |
| orcamentos | opportunities | orcamento_itens, propostas, cronograma_itens quando vira Obra | Orçamento ativo, versões, base da proposta | Sim, quando precisa de ação | Opcional, via relatórios/listas | Sim | Sim, como base herdada |
| orcamento_itens | orcamentos | cronograma_itens, referências de custo | Itens, serviços, quantitativos, custos | Não diretamente | Não como tela principal | Sim | Sim, como base de planejamento |
| propostas | opportunities e orcamentos | Versões e eventos | Snapshot do orçamento validado | Sim, quando em aberto | Sim | Sim | Indiretamente, como origem comercial |
| obras | opportunities | cronograma_itens, diario_obra, medicoes, compras, pagamentos_cliente, financeiro_lancamentos, tarefas, arquivos, anotacoes, eventos | Execução pós-venda | Sim | Sim | Não como entidade operacional | Sim |
| cronograma_itens | obras | medicoes, eventos de avanço | Planejamento, serviços, marcos | Sim, quando atrasado ou vencendo | Opcional, em relatórios | Não | Sim |
| diario_obra | obras | arquivos, eventos, propostas de atualização | Registros diários e IA operacional | Sim, como diários recentes | Não como tela principal | Não | Sim |
| medicoes | obras e cronograma_itens | financeiro_lancamentos, arquivos, eventos | Avanço físico, faturamento, controle | Sim, quando pendente | Opcional, em relatórios | Não | Sim |
| tarefas | Contexto polimórfico | eventos, arquivos | contexto_tipo, contexto_id, responsáveis, prazos | Sim | Sim | Sim, quando contexto_tipo = oportunidade | Sim, quando contexto_tipo = obra |
| fornecedores | Nenhum | compras, cotações, histórico de preços | Cadastro de fornecedores | Não diretamente | Sim, em Cadastros/Compras | Não | Sim, via compras da obra |
| compras | Empresa ou obras | Solicitações, cotações, ordens, recebimentos, pagamentos, eventos | Fornecedor, obra, itens, preço | Sim, quando pendente | Sim | Não por padrão | Sim, quando vinculada à obra |
| pagamentos_cliente | opportunities ou obras | financeiro_lancamentos, eventos | Recebíveis, parcelas, cobrança | Sim | Sim, no financeiro global | Sim, quando pré-venda ou proposta | Sim, quando vinculado à obra |
| financeiro_lancamentos | Empresa ou obras | Eventos, arquivos, conciliações | Receitas, despesas, transferências, contas | Sim | Sim | Sim, quando vinculado a pagamento da oportunidade | Sim, quando vinculado à obra |
| arquivos | Contexto polimórfico | Eventos | Documentos, fotos, anexos | Sim, quando recente/relevante | Opcional, em busca/global | Sim | Sim |
| anotacoes | Contexto polimórfico | Eventos | Notas comerciais ou operacionais | Sim, quando marcada como ação | Opcional, em busca/global | Sim | Sim |
| eventos | Contexto polimórfico | Nenhum | Atividades, auditoria, histórico | Sim, quando ação recente/relevante | Sim, como atividade consolidada | Sim | Sim |

---

## Correções necessárias no EVIS atual

As correções necessárias de produto e navegação são:

- Dashboard deve deixar de ser menu e virar Home operacional.
- Sidebar deve seguir a ordem oficial.
- Obras deve abrir dentro da plataforma.
- Oportunidades precisam de abas oficiais.
- Obra precisa de abas oficiais.
- Orçamentista não pode ser card solto.
- Financeiro global deve ser separado do financeiro da obra.
- Compras devem alimentar histórico de preços.
- Tarefas precisam de vínculo polimórfico.
- Cliques do Dashboard precisam ser contextuais.
- Propostas precisam de visão global consolidada além da aba dentro da Oportunidade.

---

## Encerramento

Este documento deve prevalecer em decisões de navegação, organização de entidades, vínculos relacionais conceituais e comportamento de cliques do EVIS. Ele não substitui **EVIS_CANONICAL_PROCESS.md**.

O processo canônico continua sendo a fonte principal para a ordem temporal:

```text
Lead/Oportunidade → Orçamentista IA → Proposta → Obra → Diário de Obra IA
```

---

## Resumo dos ajustes aplicados

Mantive integralmente a estrutura, hierarquia e linguagem do seu documento. Os ajustes foram pontuais, sempre alinhados ao que observei no Vobi e às regras conceituais do EVIS:

1. **Sidebar:** reposicionei **Propostas** logo após **Oportunidades**, para refletir a ordem do processo canônico (Oportunidade → Orçamentista → Proposta → Obra). No documento original, Propostas estava entre Financeiro e Ferramentas, fora da sequência comercial.
2. **Home — regra de clique:** adicionei a linha de **Card de proposta** na tabela de roteamento, que estava ausente apesar de Propostas estar na sidebar e na lista de cards do Dashboard.
3. **Propostas — seção:** acrescentei o subitem **Visão global de Propostas** descrevendo o comportamento da rota `/propostas` (filtros e link para o contexto pai), coerente com a entrada da sidebar e com a tabela de URLs esperadas.
4. **Navegação contextual — URLs:** incluí a linha **Propostas globais** (`/propostas`) na tabela, que estava listada na sidebar mas não aparecia entre as URLs esperadas.
5. **Correções necessárias no EVIS atual:** adicionei o item sobre **Propostas precisarem de visão global consolidada**, fechando o ciclo entre sidebar, rota e correção.

Nenhum item canônico (abas oficiais, regras de orçamento ativo, snapshot de proposta, separação Financeiro Global × Obra, vínculo polimórfico de tarefas, exclusividade do Diário de Obra IA dentro da Obra) foi alterado. Não criei novas entidades nem mudei nomes de campos. O documento permanece estritamente conceitual e complementar ao EVIS_CANONICAL_PROCESS.md.
