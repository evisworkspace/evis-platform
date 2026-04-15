# Skill: Notas Técnicas e Pendências

**Descrição**: Categoriza ocorrências, problemas de material e observações gerais.

## Quando Usar
Gatilhos: "falta", "estragou", "entregou", "atraso", "visita do cliente", "chuva".

## Categorias
- **Material**: Falta ou entrega de insumos.
- **Pendência**: Algo que impede o fluxo.
- **Observação**: Fatos relevantes sem ação imediata.
- **Segurança**: Desvios de EPI ou riscos.

## Exemplos
### Input
"Não conseguimos terminar porque acabou o cimento."
### Output
```json
[
  { "tipo": "Material", "descricao": "Falta de cimento", "gravidade": "alta" }
]
```
