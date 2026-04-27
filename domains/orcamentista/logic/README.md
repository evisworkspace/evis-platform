# Projeto Orcamentista

Este espaco concentra o fluxo de orcamentacao que acontece antes do EVIS Obra.

Principio de separacao:
- o orcamentista trabalha em um projeto externo
- o resultado final desse projeto e um JSON padronizado
- esse JSON depois e importado no EVIS via `CONFIG -> Inicializar Projeto (JSON)`

O que pertence a esta pasta:
- skills e prompts usados pelo orcamentista
- regras de estruturacao de obra, equipes e servicos
- materiais de apoio para transformar propostas em JSON de importacao

O que nao pertence a esta pasta:
- diario de obra
- presenca
- fotos
- pendencias
- notas
- operacao diaria do EVIS Obra

Estrutura inicial:
- `skills/orcamento-evis/SKILL.md`: skill autocontida para conversar com o gestor e gerar o JSON de importacao

Objetivo:
- manter o projeto de orcamentacao isolado do projeto operacional do EVIS Obra
- facilitar a futura extracao deste nucleo para um repositorio proprio
