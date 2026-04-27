# Fronteira: Orcamentista x EVIS Obra

## Objetivo

Este documento fixa a separacao oficial entre o que pertence ao `EVIS Orcamentista` e o que pertence ao `EVIS Obra`.

Essa fronteira existe para evitar acoplamento indevido entre:

- montagem do orcamento
- importacao inicial da obra
- operacao real da obra
- entrega final ao cliente

## EVIS Orcamentista

Pertence ao `EVIS Orcamentista`:

- leitura do material bruto do projeto
- estruturacao do escopo
- quantitativos
- composicao de custos
- referencias EVIS e SINAPI
- definicao manual de BDI
- cronograma fisico-financeiro inicial
- geracao do JSON de importacao
- classificacao de itens como `pontual_obra`, `avaliar_catalogo` ou `reutilizavel`

Saida final oficial do Orcamentista:

- `output/orcamento_final.json`
- consolidacao em `07_ENTREGA_JSON.md`

O Orcamentista termina quando o orcamento foi validado e o JSON ficou pronto para importacao.

## EVIS Obra

Pertence ao `EVIS Obra`:

- importacao do JSON e criacao da obra
- diario de obra
- presenca
- fotos
- notas
- pendencias
- medicao e acompanhamento real
- revisoes durante a execucao
- encerramento da obra
- entrega final ao cliente
- geracao de documentos de entrega
- garantias
- manuais
- personalizacao da entrega
- auditoria final da obra
- registro final para Obsidian

## Regra arquitetural

Nao pertence ao `EVIS Orcamentista`:

- auditoria final da obra
- narrativa de encerramento para Obsidian
- dossie de entrega ao cliente
- garantias e manuais finais
- fechamento institucional da execucao

Esses itens devem ser implementados futuramente no `EVIS Obra`, no momento de encerramento e entrega da obra.

## Regra operacional

Use esta pergunta de decisao quando surgir duvida:

`isso acontece antes da importacao da obra ou depois da obra estar operando?`

Se acontece:

- `antes da importacao` -> pertence ao `Orcamentista`
- `depois da obra criada/importada` -> pertence ao `EVIS Obra`

## Regra de memoria

- `Orcamentista` usa pasta local duplicada de `Orçamentos_2026/Orcamentista_base`
- `EVIS Obra` usa a estrutura operacional do sistema da obra
- Supabase serve como base oficial compartilhada, mas nao deve misturar as responsabilidades dos dois fluxos

## Status atual

No estado atual do projeto:

- o `Orcamentista` esta focado em preparar e entregar o JSON
- o fluxo de auditoria final e entrega ao cliente fica explicitamente reservado para evolucao futura no `EVIS Obra`
