# Baseline Hidráulica e Sanitária

- Total: 6
- Aprovados: 5
- Reprovados: 1
- Score médio: 91.7

## Resultados por microcaso

### MC-HID-001 - Contagem de pontos em banheiro e cozinha
- Status: REPROVADO
- Score: 65
- Resumo: Embora o especialista tenha identificado corretamente todos os pontos e sistemas por ambiente, a estrutura de saída está inadequada para uso orçamentário. A duplicação de tipos de pontos nos quantitativos_chave viola o critério de ter exatamente 3 quantitativos consolidados (AF, AQ, ESG) e dificulta a aplicação direta em orçamentos.
- Erros detectados:
  - Duplicação desnecessária de itens nos quantitativos_chave - mesmo tipo de ponto aparece repetido por ambiente
  - Estrutura de dados inadequada para orçamentação - deveria consolidar totais por tipo de sistema
  - Violação do campo obrigatório 'quantitativos_chave': esperado 3 itens consolidados, encontrado 6 itens duplicados
  - Falta de totalização adequada: AF=4, AQ=2, ESG=3 deveriam aparecer como totais únicos
- Checks:
  - schema_valido: ok
  - ambientes_identificados: ok
  - sistemas_separados: ok
  - esgoto_presente: ok
  - quantitativos_chave_corretos: falhou
  - estrutura_dados_adequada: falhou

### MC-HID-002 - Arquitetura sem planta hidráulica completa
- Status: APROVADO
- Score: 95
- Resumo: Excelente resposta que atende todos os critérios principais. O especialista corretamente identificou a arquitetura como base candidata, não fechou quantitativos definitivos (marcando tudo como 'candidato'), acionou HITL adequadamente com 4 perguntas pertinentes, e demonstrou os fatos mínimos esperados. A confiança baixa (0.4) é apropriada. Único ponto de melhoria seria ser mais conservador nos quantitativos detalhados, mas isso não compromete a aprovação pois manteve sempre o caráter candidato.
- Erros detectados:
  - Quantitativos muito detalhados para base apenas candidata - poderia ser mais conservador
- Checks:
  - schema_valido: ok
  - base_candidata_assumida: ok
  - pergunta_hitl_presente: ok
  - nao_fechou_definitivo: ok
  - fatos_minimos_presentes: ok
  - erros_proibidos_evitados: ok
  - hitl_acionado_corretamente: ok

### MC-HID-003 - Diferenciar pluvial de esgoto sanitário
- Status: APROVADO
- Score: 100
- Resumo: Aprovado. O especialista identificou corretamente os dois sistemas distintos (pluvial e esgoto sanitário), não os misturou, e gerou 6 itens orçamentários candidatos que refletem adequadamente a separação entre os sistemas. Todos os critérios de aprovação foram atendidos.
- Checks:
  - schema_valido: ok
  - pluvial_sinalizado: ok
  - esgoto_sinalizado: ok
  - sistemas_nao_misturados: ok
  - campos_obrigatorios: ok
  - nao_pode_fazer: ok

### MC-HID-004 - Reservação e aquecimento como dependência de fechamento
- Status: APROVADO
- Score: 95
- Resumo: Especialista executou corretamente o microcaso. Identificou sistemas especiais sem detalhamento suficiente, sinalizou dependência através de quantidades zero com observações claras, acionou HITL com 4 perguntas específicas e técnicas, e não inventou especificações. Demonstrou disciplina ao não fechar quantitativos definitivos sem informações adequadas.
- Checks:
  - schema_valido: ok
  - dependencia_sinalizada: ok
  - pergunta_hitl_presente: ok
  - nao_inventou_equipamento: ok
  - fatos_minimos_identificados: ok
  - gatilhos_hitl_acionados: ok

### MC-HID-005 - Evitar dupla contagem entre ambiente e detalhe ampliado
- Status: APROVADO
- Score: 100
- Resumo: Aprovado. O especialista demonstrou compreensão correta do conceito de detalhe ampliado, evitou dupla contagem de forma explícita, contou corretamente 1 chuveiro e 1 ralo linear, e documentou adequadamente nas premissas que o detalhe é apenas representação gráfica para posicionamento.
- Checks:
  - schema_valido: ok
  - duplicidade_evitada: ok
  - detalhe_tratado_como_repeticao: ok
  - fatos_minimos_presentes: ok
  - campos_obrigatorios_atendidos: ok
  - erros_proibidos_ausentes: ok

### MC-HID-006 - Priorizar composição por ponto residencial
- Status: APROVADO
- Score: 95
- Resumo: Saída aprovada. O especialista corretamente identificou o modelo comercial por ponto residencial, separou os 3 tipos de pontos (água fria, água quente, esgoto) em itens orçamentários candidatos distintos e aderentes ao catálogo EVIS. Todos os critérios de aprovação foram atendidos sem erros proibidos.
- Checks:
  - schema_valido: ok
  - modelo_por_ponto_sinalizado: ok
  - tipos_separados: ok
  - itens_candidatos_adequados: ok