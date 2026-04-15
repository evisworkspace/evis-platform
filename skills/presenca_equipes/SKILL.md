# Skill: Presença de Equipes

**Descrição**: Sincroniza a lista de trabalhadores presentes e suas categorias a partir do relato do mestre.

## Quando Usar
Gatilhos: nomes de pessoas (João, Carlos), nomes de funções (pedreiro, ajudante, encanador) ou contagem de pessoal ("tinha 5 pessoas da elétrica").

## Regras de Extração
1. Buscar correspondência entre nomes citados e a `equipe_cadastro`.
2. Normalizar nomes (ex: "seu joão" -> "João").
3. Se citar apenas a função e quantidade, distribuir conforme lógica de presença.
4. Preencher `presenca_status` como `true`.

## Exemplos
### Input
"Hoje o João e o ajudante dele vieram."
### Output
```json
[
  { "cod": "PED-01", "nome": "João", "presente": true },
  { "cod": "AJU-01", "nome": "Ajudante Silva", "presente": true }
]
```
