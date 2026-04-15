# Skill: Avanço de Serviços

**Descrição**: Extrai o percentual de conclusão e o status de serviços da obra a partir de uma narrativa técnica.

## Quando Usar
Sempre que o usuário mencionar termos como "reboco", "alvenaria", "piso", "pintura", atrelados a valores percentuais, frações ou descrições de progresso (ex: "metade", "concluído", "quase pronto").

## Regras de Extração
1. Identificar o ID do serviço no contexto da obra.
2. Extrair o valor numérico do avanço (0-100%).
3. Mapear descrições vagas:
   - "Iniciado" -> 5%
   - "Metade" -> 50%
   - "Concluído/Finalizado" -> 100%
4. Definir status:
   - 0% -> `pendente`
   - 1-99% -> `em_andamento`
   - 100% -> `concluido`

## Exemplos
### Input
"O reboco da fachada avançou bem, estamos em 60%. A pintura começou hoje."
### Output
```json
[
  { "id": "REB-01", "avanco": 60, "status": "em_andamento" },
  { "id": "PIN-01", "avanco": 5, "status": "em_andamento" }
]
```
