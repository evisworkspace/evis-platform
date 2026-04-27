# Referencias de Engenharia de Custos e Orcamentacao

## Objetivo

Servir como base tecnica resumida para composicao de custos e consolidacao parcial no Orcamentista.

## Hierarquia de referencia recomendada

- estrutura e fundacoes: SINAPI oficial por codigo direto quando houver aderencia
- civil_execucao: SINAPI e catalogo EVIS conforme natureza do servico
- hidraulica e eletrica residenciais por ponto: catalogo EVIS primeiro
- itens comerciais especificos: fornecedor / catalogo EVIS com memoria de preco
- historico de obra: apoio para estimativa e calibracao, nunca substituto cego da evidencia atual

## Campos minimos de cada composicao candidata

- servico
- codigo_referencia
- origem da referencia
- unidade
- quantidade base
- custo unitario
- custo total candidato
- observacao / pendencia / confianca

## Principais fontes de erro

- escolher referencia pela palavra parecida e nao pela aderencia tecnica
- perder a competencia do preco
- usar base sem distinguir MAT e MO quando isso for necessario
- nao marcar quando o item depende de validacao humana
- deixar de registrar se o item pode ou nao subir ao catalogo principal

## Regras de seguranca

- toda composicao sem lastro deve sair como candidata ou pendente
- toda referencia precisa indicar origem e competencia quando disponiveis
- toda consolidacao deve preservar a rastreabilidade da disciplina de origem
- quando houver snapshot de referencia com codigo conhecido, esse codigo deve ser preservado explicitamente na saida
