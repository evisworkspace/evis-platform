# Microcasos Ouro - Elétrica

## Objetivo

Servir como primeira bateria disciplinar do especialista elétrico.

## Lote 01

Este lote cobre os erros mais relevantes para leitura elétrica residencial:

- diferenciação entre TUG, TUE e iluminação
- arquitetura sem planta elétrica fechada
- quadro/circuito sem evidência suficiente
- pontos especiais
- infraestrutura elétrica não pode ser omitida
- composição residencial por ponto

## Arquivos

- `MC-ELE-001_tug_tue_iluminacao.json`
- `MC-ELE-002_sem_planta_eletrica_fechada.json`
- `MC-ELE-003_quadro_sem_evidencia.json`
- `MC-ELE-004_pontos_especiais.json`
- `MC-ELE-005_infraestrutura_nao_omitida.json`
- `MC-ELE-006_composicao_por_ponto_residencial.json`

## Regra

Cada microcaso deve ser executado como teste unitário do especialista elétrico.

O especialista só passa quando:

- schema permanece válido
- tipos de ponto são diferenciados corretamente
- não assume quadro ou circuito sem base
- sobe pergunta HITL quando faltar evidência
