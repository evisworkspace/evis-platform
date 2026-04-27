# Referencias de Engenharia Hidraulica e Sanitaria

## Objetivo

Servir como base tecnica resumida para leitura hidrossanitaria no Orcamentista.

## O que observar em plantas e memoriais

- ambientes molhados e seus equipamentos
- pontos de agua fria, agua quente e esgoto
- prumadas, caixas, ralos e ventilacoes
- reservatorio, pressurizacao, aquecimento e bombas quando houver
- materiais especificados e diametros relevantes

## Estrategia orcamentaria recomendada

- em obras residenciais, priorizar composicoes por ponto do catalogo EVIS quando a medicao por ponto for o modelo comercial correto
- usar SINAPI como referencia complementar ou fallback quando houver composicao aderente
- registrar explicitamente quando um item estiver em composicao propria e nao em SINAPI por ponto

## Quantitativos que costumam ser necessarios

- quantidade de pontos por tipo e por ambiente
- quantidade de loucas, metais e equipamentos
- extensao de tubulacoes quando a prancha permitir
- caixas, ralos, registros, conexoes e sistemas especiais

## Regra de representacao sugerida

- quando a leitura estiver fechada, `quantitativos_chave` deve consolidar totais por tipo de sistema
- o detalhamento por ambiente deve aparecer em `achados`, `observacao` ou `itens_orcamentarios_candidatos`
- evitar repetir o mesmo tipo de ponto varias vezes em `quantitativos_chave` quando o objetivo orcamentario for totalizacao por sistema

## Principais fontes de erro

- omitir pontos de cozinha, lavanderia e area externa
- contar apenas aparelho final e esquecer a infraestrutura
- misturar pluvial com esgoto
- assumir agua quente onde nao ha indicacao

## Regras de seguranca

- se a planta nao fechar, devolver ponto candidato e nao quantitativo definitivo
- se o sistema depender de compatibilizacao com arquitetura, registrar a dependencia
- quando faltar detalhamento, subir pergunta HITL por ambiente
