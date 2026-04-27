# SKILL — Engenharia Estrutural

## Regras de Leitura de Projeto
- Extrair o FCK (MPa) de cada elemento (Fundação vs Superestrutura).
- Identificar bitolas de aço (CA-50, CA-60) e peso total por diâmetro.
- Verificar o recobrimento mínimo exigido pela classe de agressividade ambiental.

## Regras de Quantitativos
- **Aço**: Somar por bitola e aplicar 10% de perda de pontas/transpasse.
- **Formas**: Área de contato real (não usar estimativa por volume de concreto sem justificativa).
- **Concreto**: Volume exato das peças + 5% de perda operacional.

## Regras de Codificação e Equipes
- Usar formato de serviço `N.M` (ex: 3.1 para Pilares, 3.2 para Vigas).
- Equipe Obrigatória: `EQ-EST-01` (Carpintaria/Armação/Concretagem).
- Categoria: `ESTRUTURA`.

## Auditoria e HITL
- Bloquear se houver divergência entre o volume de concreto do projeto de formas e a tabela de resumo de materiais.
- Exigir validação humana (HITL) se o fck especificado for diferente do padrão Berti (C-30/C-35).
