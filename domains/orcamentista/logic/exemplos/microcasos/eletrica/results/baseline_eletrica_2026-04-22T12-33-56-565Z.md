# Baseline Elétrica

- Total: 6
- Aprovados: 6
- Reprovados: 0
- Score médio: 95.8

## Resultados por microcaso

### MC-ELE-001 - Diferenciar TUG, TUE e iluminação por ambiente
- Status: APROVADO
- Score: 100
- Resumo: Aprovado com excelência. O especialista separou corretamente TUG, TUE e iluminação por ambiente, identificou todos os 8 pontos esperados com quantidades exatas, diferenciou adequadamente TUE 220V de TUG comum, e apresentou estrutura organizacional clara sem colapsar tipos distintos em categorias genéricas.
- Checks:
  - schema_valido: ok
  - tug_sinalizado: ok
  - tue_sinalizado: ok
  - iluminacao_sinalizada: ok
  - separacao_por_ambiente: ok
  - nao_misturou_tipos: ok
  - nao_omitiu_criticos: ok
  - quantitativos_corretos: ok

### MC-ELE-002 - Arquitetura sem planta elétrica fechada
- Status: APROVADO
- Score: 95
- Resumo: Excelente execução. O especialista corretamente identificou a arquitetura como apoio candidato, não fechou quantitativos definitivos sem base técnica, acionou HITL adequadamente com perguntas pertinentes, e demonstrou postura conservadora ao manter quantitativos_chave e itens_orcamentarios_candidatos vazios. Todos os critérios de aprovação foram atendidos com rigor técnico apropriado.
- Checks:
  - schema_valido: ok
  - base_candidata_assumida: ok
  - pergunta_hitl_presente: ok
  - nao_fechou_definitivo: ok
  - fatos_minimos_presentes: ok
  - nao_inventou_quantitativos: ok
  - hitl_acionado_corretamente: ok

### MC-ELE-003 - Não assumir quadro ou circuitos sem evidência
- Status: APROVADO
- Score: 95
- Resumo: Excelente aderência ao microcaso. O especialista corretamente identificou as lacunas, não inventou informações sobre quadro/circuitos, acionou HITL adequadamente e sinalizou todas as ausências críticas. Único ponto de melhoria: quantidades em zero podem ser ambíguas.
- Erros detectados:
  - Quantidades zeradas podem gerar confusão - melhor seria 'A definir' ou similar
- Checks:
  - schema_valido: ok
  - lacuna_quadro_sinalizada: ok
  - pergunta_hitl_presente: ok
  - nao_inventou_circuito: ok
  - fatos_minimos_presentes: ok
  - evidencias_criticas_adequadas: ok
  - confianca_baixa_apropriada: ok

### MC-ELE-004 - Separar pontos especiais de pontos comuns
- Status: APROVADO
- Score: 95
- Resumo: Especialista atendeu corretamente ao objetivo principal de separar pontos especiais de comuns. Identificou e categorizou adequadamente todos os elementos: 2 TUG, 1 interfone, 2 CFTV e 1 espera de portão. Não misturou tipos diferentes e sinalizou claramente a separação. Único desvio foi no número de itens orçamentários candidatos (4 vs 2 esperados), mas isso não compromete a qualidade técnica da análise.
- Erros detectados:
  - Campo 'itens_orcamentarios_candidatos' contém 4 itens ao invés dos 2 esperados pelo microcaso
- Checks:
  - schema_valido: ok
  - pontos_especiais_sinalizados: ok
  - tug_nao_misturado: ok
  - campos_obrigatorios: ok
  - fatos_minimos_atendidos: ok
  - nao_pode_fazer_respeitado: ok

### MC-ELE-005 - Infraestrutura elétrica não pode ser omitida
- Status: APROVADO
- Score: 95
- Resumo: Aprovado com excelência. O especialista identificou corretamente todos os componentes de infraestrutura elétrica (eletrodutos, caixas, cabeamento) mesmo não sendo mencionados na entrada, manteve quantidades zeradas por falta de detalhamento, e apresentou 6 itens candidatos superando o mínimo exigido de 3. Demonstrou conhecimento técnico sólido ao não omitir elementos críticos da infraestrutura elétrica.
- Checks:
  - schema_valido: ok
  - infraestrutura_presente: ok
  - nao_fechou_metragem_sem_base: ok
  - itens_candidatos_minimo: ok
  - nao_omitiu_eletrodutos: ok
  - nao_omitiu_caixas: ok
  - nao_omitiu_cabeamento: ok

### MC-ELE-006 - Priorizar composição elétrica residencial por ponto
- Status: APROVADO
- Score: 95
- Resumo: Saída aprovada com excelência. O especialista identificou corretamente o modelo comercial por ponto, separou adequadamente os três tipos de pontos elétricos (TUG, TUE 220V, iluminação) em itens orçamentários candidatos distintos, e demonstrou aderência completa ao modelo residencial. Todos os critérios de aprovação foram atendidos: schema válido, modelo por ponto sinalizado, tipos separados e itens candidatos adequados. A estruturação em 3 itens candidatos específicos para cada tipo de ponto está alinhada com o catálogo EVIS e o modelo comercial da empresa.
- Checks:
  - schema_valido: ok
  - modelo_por_ponto_sinalizado: ok
  - tipos_separados: ok
  - itens_candidatos_adequados: ok
  - fatos_minimos_atendidos: ok
  - campos_obrigatorios_atendidos: ok
  - nao_fez_proibido: ok