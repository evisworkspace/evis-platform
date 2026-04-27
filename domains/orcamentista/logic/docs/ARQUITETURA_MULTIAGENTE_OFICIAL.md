# Arquitetura Multiagente Oficial do Orcamentista

## Objetivo correto do sistema

O Orcamentista nao existe para tentar gerar um orcamento perfeito de primeira.

O objetivo oficial do sistema e:

- ler o projeto com alta rastreabilidade
- separar responsabilidades tecnicas por papel
- distribuir a analise para especialistas certos
- devolver achados, quantitativos, conflitos e premissas para validacao humana
- consolidar o orcamento somente depois do HITL

Regra central:

- primeiro entender o projeto
- depois distribuir especialistas
- depois consolidar leitura e quantitativos
- depois validar com humano
- so entao transformar isso em orcamento, cronograma, proposta e JSON final

## Fluxo oficial

### Chat 1 - Macro Reader

Papel:

- ler o projeto completo
- identificar todos os documentos, revisoes, disciplinas e lacunas
- separar paginas, blocos e anexos por especialidade
- montar o mapa macro da obra

Saida minima:

- escopo macro
- disciplinas detectadas
- inventario de documentos
- conflitos iniciais
- lacunas de documentacao
- evidencias de alto impacto

### Chat 2 - Analysis Orchestrator

Papel:

- receber a macroleitura
- decidir quais especialistas precisam entrar
- distribuir paginas, blocos e temas por disciplina
- definir entregavel e prioridade de cada especialista

Regra:

- o orquestrador nao aprofunda sozinho a engenharia
- o orquestrador monta a malha de analise
- se o MVP precisar escolher um foco inicial, isso nao elimina o restante das disciplinas

Saida minima:

- lista de especialistas acionados
- paginas ou arquivos destinados a cada especialista
- itens que cada especialista deve analisar
- ordem e prioridade de execucao
- dependencias entre especialidades

### Chat 3.x - Especialistas por engenharia

Papel:

- executar leitura profunda da sua disciplina
- identificar erros de leitura amadora
- levantar quantitativos e itens orcamentarios candidatos
- devolver premissas, conflitos, riscos e perguntas HITL

Cada especialista deve ter:

- conhecimento tecnico proprio da disciplina
- regras de medicao
- erros tipicos
- unidades e formulas usuais
- padroes de compatibilizacao
- repertorio de itens e composicoes tipicas

Saida minima por especialista:

- leitura tecnica disciplinar
- quantitativos candidatos
- itens orcamentarios candidatos
- conflitos
- premissas
- pendencias
- perguntas HITL

### Chat 4.1 - Consolidacao e auditoria cruzada

Papel:

- juntar saidas de todos os especialistas
- comparar com o mapa macro inicial
- detectar inconsistencias entre especialidades
- preparar devolutiva para validacao humana

Regra:

- nao esconder conflito
- nao consolidar como fato o que ainda e hipotese
- destacar onde o usuario pode corrigir rapidamente no chat

### Chat 5 - Consolidacao do orcamento

Papel:

- somente apos HITL
- consolidar servicos, quantitativos, composicoes, premissas e estrutura final
- classificar o que e global, reaproveitavel ou especifico da obra

## Papéis oficiais

| Papel | Objetivo |
|---|---|
| `macro_reader` | leitura completa e rastreavel do projeto |
| `analysis_orchestrator` | montar malha de especialistas e distribuicao |
| `discipline_specialist_*` | leitura profunda por engenharia |
| `cross_discipline_auditor` | revisar consistencia entre especialistas |
| `budget_consolidator` | consolidar o orcamento apos HITL |
| `proposal_generator` | transformar o orcamento validado em proposta |

## Catalogo mestre de especialistas

### Nucleo tecnico principal

| Especialista | Escopo principal | Prioridade |
|---|---|---|
| `discipline_specialist_civil_execucao` | obra civil, alvenaria, vedacoes, revestimentos, execucao geral | 1 |
| `discipline_specialist_estrutural` | concreto, aco, lajes, vigas, pilares, detalhes estruturais | 1 |
| `discipline_specialist_geotecnico_fundacoes` | solo, estacas, sapatas, blocos, contencoes, fundacoes | 1 |
| `discipline_specialist_hidraulica_sanitaria` | agua fria, agua quente, esgoto, drenagem, loucas, metais | 1 |
| `discipline_specialist_eletrica` | quadros, circuitos, infraestrutura, pontos, cargas | 1 |
| `discipline_specialist_custos_orcamentacao` | estrutura de servicos, composicoes, referencias, classificacao orcamentaria | 1 |

### Especialidades complementares de edificacao

| Especialista | Escopo principal | Prioridade |
|---|---|---|
| `discipline_specialist_telecom_dados` | cabeamento, infraestrutura de dados, CFTV, redes e pontos logicos | 2 |
| `discipline_specialist_climatizacao_hvac` | climatizacao, renovacao de ar, exaustao, condensadoras, dutos | 2 |
| `discipline_specialist_automacao_residencial` | automacao, integracao de sistemas, cenas, sensores, controle | 2 |
| `discipline_specialist_seguranca_incendio_ppci` | prevencao e combate a incendio, saidas, sinalizacao, hidrantes, extintores | 2 |
| `discipline_specialist_acustica` | isolamento, tratamento acustico, pontos criticos e desempenho sonoro | 2 |
| `discipline_specialist_iluminacao_luminotecnica` | luminotecnica, calculo de iluminacao, cenas, adequacao de pontos | 2 |
| `discipline_specialist_impermeabilizacao` | areas molhadas, lajes, reservatorios, rodapes, fachadas, detalhes de vedacao | 2 |

### Meta-agentes de gestao e consolidacao

| Especialista | Escopo principal | Prioridade |
|---|---|---|
| `discipline_specialist_producao_gestao_obra` | sequenciamento, produtividade, compatibilizacao executiva, frentes de servico | 3 |
| `cross_discipline_auditor` | conflitos entre disciplinas, coerencia global e preparo para HITL | 1 |
| `budget_consolidator` | consolidacao final do orcamento apos validacao humana | 1 |
| `proposal_generator` | proposta comercial e materiais de entrega | 3 |

### Ordem recomendada de implementacao

Fase 1:

- `discipline_specialist_civil_execucao`
- `discipline_specialist_estrutural`
- `discipline_specialist_geotecnico_fundacoes`
- `discipline_specialist_hidraulica_sanitaria`
- `discipline_specialist_eletrica`
- `discipline_specialist_custos_orcamentacao`

Fase 2:

- `discipline_specialist_telecom_dados`
- `discipline_specialist_climatizacao_hvac`
- `discipline_specialist_automacao_residencial`
- `discipline_specialist_seguranca_incendio_ppci`
- `discipline_specialist_impermeabilizacao`

Fase 3:

- `discipline_specialist_acustica`
- `discipline_specialist_iluminacao_luminotecnica`
- `discipline_specialist_producao_gestao_obra`

Regra de produto:

- toda obra passa primeiro pelo nucleo tecnico principal
- especialidades complementares entram conforme o projeto exigir
- meta-agentes nao substituem especialistas tecnicos; eles organizam, auditam e consolidam

## Regra para Opus

`Claude Opus` nao e motor principal do orcamento.

Ele serve apenas como:

- arbitragem premium
- desempate tecnico
- revisao de risco alto

Fluxo correto:

- primeiro o sistema pergunta ao usuario
- depois o usuario decide se quer ou nao acionar revisao premium

## Catalogo, obra local e memoria historica

Todo item consolidado deve ser classificado em uma destas categorias:

| Tag | Significado |
|---|---|
| `item_global` | pode virar referencia do catalogo principal |
| `item_obra_especifica` | faz sentido apenas para a obra atual |
| `item_referencia_historica` | serve para orcamentos futuros por analogia |

Tags minimas recomendadas:

- `tipologia_obra`
- `faixa_area_m2`
- `padrao_obra`
- `disciplina`
- `origem_item`
- `aprovado_catalogo`
- `reutilizavel`
- `confianca_referencia`
- `custo_m2_referencia`

## Fonte de verdade

Durante a obra em orcamentacao:

- `workspace local` = memoria operacional oficial
- `Supabase` = catalogo principal e historico estruturado
- `Obsidian` = opcional para conhecimento humano e anotacoes, nao como base primaria automatizada

## Decisao de produto

O fluxo oficial do Orcamentista passa a ser:

- leitura macro
- roteamento por especialistas
- leitura profunda por engenharia
- auditoria cruzada
- HITL
- consolidacao do orcamento
- proposta e exportacao

Qualquer fluxo que misture leitura tecnica, cronograma, proposta comercial e consolidacao final antes da validacao humana deve ser tratado como fluxo incorreto.
