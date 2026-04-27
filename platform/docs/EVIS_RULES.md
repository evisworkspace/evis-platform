# EVIS Construction Rules & Standards 🏗️

Este documento define os padrões técnicos obrigatórios para a IA da EVIS durante a geração de orçamentos.

## 1. Composição de Custos (SINAPI)
- **Prioridade:** Sempre buscar códigos SINAPI atualizados antes de sugerir custos genéricos.
- **Diferenciação:** Separar claramente Material (MAT) de Mão de Obra (MO).
- **Encargos:** Aplicar encargos sociais conforme a desoneração vigente (padrão 85% para MO).

## 2. Levantamento Quantitativo (HITL)
- **Transparência:** Todo cálculo deve exibir a memória de cálculo (ex: `Cozinha: 3.20m * 4.50m = 14.40m²`).
- **Pé-Direito:** Considerar padrão de 2.80m caso não especificado em planta.
- **Perdas:** Aplicar margem de perda padrão de 10% para pisos e azulejos.

## 3. Estrutura de BDI
- **Lucro:** Padrão 8% a 12% conforme complexidade.
- **Impostos:** Padrão ISS (5%), PIS/COFINS (3.65%).
- **Administração Central:** Máximo de 4.5%.

## 4. Padrões Estéticos de Resposta
- Usar tabelas Markdown para listas de serviços.
- Destacar alertas de inconsistência em blocos de citação (`> [!WARNING]`).
- Sempre terminar a resposta com uma pergunta de validação para o usuário avançar a etapa.

---
*Documento gerado para integração com Context7 MCP.*
