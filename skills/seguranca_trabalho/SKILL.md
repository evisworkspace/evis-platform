# Skill: Segurança do Trabalho (NR18)

**Descrição**: Monitoramento de conformidade com normas de segurança em canteiros.

## Quando Usar
Gatilhos: "EPI", "tela de proteção", "andaime", "cinto de segurança", "limpeza".

## Regras
1. Cruzar observações com o checklist `checklist_nr18.json`.
2. Reportar desvios críticos imediatamente.

## Exemplos
### Input
"O pessoal do andaime estava sem cinto hoje."
### Output
```json
[
  { "norma": "NR18.15", "item": "Uso de cinto", "status": "não_conforme" }
]
```
