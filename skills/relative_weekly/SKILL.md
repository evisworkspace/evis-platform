# Skill: Relative Weekly

**Descrição**: Converte datas de calendário em semanas relativas ao início da obra (S1, S2...).

## Quando Usar
Sempre que a data de referência do diário precisar ser processada para o cockpit.

## Regras
1. Recebe `data_inicio_obra` e `data_referencia`.
2. Chama o script `calcular_semana.ts`.
3. Retorna a string formatada "SX".

## Exemplos
### Input
`{ "inicio": "2026-01-01", "ref": "2026-02-15" }`
### Output
`{ "semana": "S7" }`
