# Microcasos Ouro - Hidráulica e Sanitária

## Objetivo

Servir como primeira bateria disciplinar do especialista hidrossanitário.

## Lote 01

Este lote cobre os erros mais relevantes para leitura hidrossanitária residencial:

- contagem por ambiente e por tipo de ponto
- arquitetura sem planta hidráulica completa
- pluvial x esgoto sanitário
- reservação e aquecimento como dependência
- risco de dupla contagem entre ambiente e detalhamento
- necessidade de usar composição por ponto residencial

## Arquivos

- `MC-HID-001_pontos_banheiro_cozinha.json`
- `MC-HID-002_sem_planta_hidraulica_fechada.json`
- `MC-HID-003_pluvial_vs_esgoto.json`
- `MC-HID-004_reservacao_aquecimento_dependencia.json`
- `MC-HID-005_dupla_contagem_detalhe.json`
- `MC-HID-006_composicao_por_ponto_residencial.json`

## Regra

Cada microcaso deve ser executado como teste unitário do especialista hidráulico/sanitário.

O especialista só passa quando:

- schema permanece válido
- diferencia sistemas corretamente
- não inventa pontos sem base
- sobe pergunta HITL quando faltar detalhe
