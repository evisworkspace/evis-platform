# Microcasos Ouro - Custos e Orçamentação

## Objetivo

Servir como primeira bateria disciplinar do especialista de custos/orçamentação.

## Lote 01

Este lote cobre os erros mais relevantes para composição e consolidação parcial:

- SINAPI direto para estrutura/fundação
- EVIS para hidráulica residencial por ponto
- EVIS para elétrica residencial por ponto
- pendência quando falta referência
- duplicidade entre disciplinas
- item específico da obra x item global

## Arquivos

- `MC-CUS-001_sinapi_estrutural_direto.json`
- `MC-CUS-002_hidraulica_evis_por_ponto.json`
- `MC-CUS-003_eletrica_evis_por_ponto.json`
- `MC-CUS-004_pendencia_sem_referencia.json`
- `MC-CUS-005_duplicidade_entre_disciplinas.json`
- `MC-CUS-006_item_especifico_da_obra.json`

## Regra

Cada microcaso deve ser executado como teste unitário do especialista de custos/orçamentação.

O especialista só passa quando:

- schema permanece válido
- a origem da referência fica rastreável
- item sem lastro não vira custo definitivo
- conflito de duplicidade ou classificação é sinalizado
