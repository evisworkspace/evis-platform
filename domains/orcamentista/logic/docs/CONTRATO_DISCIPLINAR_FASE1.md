# Contrato Disciplinar - Fase 1

## Objetivo

Definir o contrato mínimo de saída que todo especialista da Fase 1 deve obedecer.

## Estrutura comum obrigatória

Todos os especialistas devem devolver:

- escopo
- achados
- conflitos
- quantitativos
- itens orçamentários candidatos
- premissas
- perguntas_hitl
- evidencias_criticas
- confianca

## Campos e semântica

### fato

Informação diretamente sustentada por:

- prancha
- tabela
- memorial
- detalhe
- referência explícita de projeto

### candidato

Informação tecnicamente plausível, mas ainda sem fechamento documental suficiente.

### conflito

Divergência entre:

- documentos
- revisões
- disciplinas
- quantitativos
- referências de custo

### lacuna

Informação necessária para fechar a rodada, mas ausente ou insuficiente.

### pergunta_hitl

Pergunta obrigatória ao usuário quando houver:

- risco técnico
- base documental insuficiente
- conflito relevante
- necessidade de decisão comercial

## Schema mínimo por especialista

### Estrutural

- elementos_estruturais_identificados
- quantitativos_chave
- conflitos_de_fck
- conflitos_de_revisao
- dependencias_geotecnicas

### Geotecnico / Fundacoes

- tipo_fundacao
- quantitativos_fundacao
- dependencia_solo
- servicos_solo_apoio
- riscos_geotecnicos

### Hidraulica / Sanitaria

- ambiente
- ponto_tipo
- quantidade
- equipamento_relacionado
- pendencia_de_planta
- referencia_candidata

### Eletrica

- ambiente
- ponto_tipo
- quantidade
- circuito_relacionado
- quadro_ou_carga
- referencia_candidata

### Civil / Execucao

- sistema_construtivo
- area_ou_quantidade
- unidade
- camada_ou_etapa
- dependencia_execucao
- referencia_candidata

### Custos / Orcamentacao

- servico
- codigo_referencia
- origem_referencia
- unidade
- quantidade_base
- custo_unitario
- custo_total
- observacao

## Taxonomia oficial de erro

### Classe A - Crítico

- omissao_critica
- inferencia_sem_lastro
- conflito_nao_sinalizado
- referencia_errada_com_impacto_relevante
- hitl_nao_acionado

### Classe B - Alto

- quantitativo_errado
- unidade_errada
- classificacao_orcamentaria_errada
- interpretação_disciplinar_errada

### Classe C - Médio

- detalhe_irrelevante_omitido
- excesso_de_texto_sem_impacto
- nomenclatura_inconsistente

### Classe D - Técnico

- schema_invalido
- tipo_incorreto_em_campo
- campo_obrigatorio_ausente

## Formato do microcaso ouro

Cada microcaso deve conter:

- `id`
- `disciplina`
- `titulo`
- `objetivo`
- `entrada`
- `saida_esperada`
- `erros_proibidos`
- `gatilhos_hitl`
- `criterio_aprovacao`

## Exemplos de microcasos por disciplina

### Estrutural

- quadro de armaduras
- conflito C30 x C35
- forma de vigas
- laje premoldada

### Geotecnico

- bloco sobre estaca
- fundação sem SPT
- escavacao e reaterro omitidos

### Hidraulica

- banheiro com agua fria + esgoto
- cozinha com ponto de pia e filtro
- area de servico com tanque e maquina

### Eletrica

- quadro de cargas
- TUG x TUE
- iluminação + comando em forro

### Civil

- forro drywall
- revestimento de parede
- contrapiso e regularizacao

### Custos

- mapear item EVIS
- fallback SINAPI
- bloquear composição sem origem

## Gate de promoção

Um especialista só pode ser promovido quando:

- schema válido = 100%
- omissão crítica abaixo da meta
- falso positivo abaixo da meta
- HITL correto acima da meta
- regressão não piorar benchmark anterior
