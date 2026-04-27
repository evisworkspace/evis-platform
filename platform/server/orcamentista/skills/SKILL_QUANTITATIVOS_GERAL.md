# SKILL — Regras Gerais de Quantitativos e Medição

## Metodologia de Medição Obrigatória
- **Paredes**: Perímetro (Eixo) * Pé-direito Médio. 
- **Descontos**: Descontar vãos (janelas/portas) conforme critério SINAPI (vãos > 2m²).
- **Pisos**: Área líquida (descontar projeção de paredes).
- **Rodapés**: Perímetro líquido (descontar vãos de portas).

## Classificação de Origem (Obrigatório)
Todo quantitativo deve ser classificado como:
1. `EXTRAIDO`: Dado literal do projeto/quadro de áreas.
2. `CALCULADO`: Resultado de fórmula (ex: Perímetro * Altura).
3. `INFERIDO`: Baseado em padrão técnico (ex: 2.5 pontos de tomada por dormitório).
4. `ESTIMADO`: Valor global por m² (usar apenas em caso de lacuna documental).

## Regras de Codificação e Equipes
- Código Final: `N.M` (Numeração sequencial por etapa).
- Todo serviço DEVE possuir um `alias` para busca no catálogo Berti.
- Todo serviço DEVE possuir uma `equipe_responsavel` no padrão `EQ-NN`.

## Auditoria e HITL
- Bloquear se o nível de confiança do levantamento for inferior a 80%.
- Exigir HITL para qualquer item `ESTIMADO` ou `INFERIDO`.
