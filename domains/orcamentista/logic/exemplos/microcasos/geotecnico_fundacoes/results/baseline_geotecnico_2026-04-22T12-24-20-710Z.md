# Baseline Geotécnico e Fundações

- Total: 6
- Aprovados: 6
- Reprovados: 0
- Score médio: 95.8

## Resultados por microcaso

### MC-GEO-001 - Conflito entre estaca e sapata em documentos da fundação
- Status: APROVADO
- Score: 100
- Resumo: Aprovado com excelência. O especialista identificou corretamente o conflito entre estacas escavadas (planta) e sapatas isoladas (memorial), sinalizou a impossibilidade de prosseguir sem resolução, acionou HITL adequadamente e não fez escolhas silenciosas. Todos os critérios de aprovação foram atendidos.
- Checks:
  - schema_valido: ok
  - conflito_tipologia_sinalizado: ok
  - pergunta_hitl_presente: ok
  - escolha_silenciosa: falhou
  - fatos_minimos_presentes: ok
  - campos_obrigatorios_atendidos: ok
  - erros_proibidos_evitados: ok

### MC-GEO-002 - Ausência de laudo SPT para fechamento das fundações
- Status: APROVADO
- Score: 95
- Resumo: Excelente resposta do especialista. Reconheceu corretamente a dependência crítica do SPT, não inventou parâmetros geotécnicos, acionou HITL adequadamente, zerou quantitativos por falta de dados e sinalizou baixa confiança. Identificou todos os fatos mínimos esperados e tratou a ausência de SPT como bloqueador para fechamento de parâmetros. Única observação: segunda pergunta HITL sobre estudos históricos é desnecessária para o objetivo do microcaso.
- Erros detectados:
  - Pergunta HITL adicional desnecessária sobre estudos históricos
- Checks:
  - schema_valido: ok
  - dependencia_spt_sinalizada: ok
  - pergunta_hitl_presente: ok
  - capacidade_nao_inventada: ok
  - fatos_minimos_presentes: ok
  - conflitos_adequados: ok
  - quantitativos_zerados: ok
  - confianca_baixa: ok

### MC-GEO-003 - Estacas com diâmetro definido e profundidade indefinida
- Status: APROVADO
- Score: 95
- Resumo: Aprovado com excelência. O especialista identificou corretamente as 12 estacas Ø30cm, reconheceu a lacuna crítica de profundidade indefinida, não inventou dados, acionou HITL adequadamente e evitou quantificar volumes definitivos sem base documental. Único desvio menor: inclusão do diâmetro como quantitativo separado.
- Erros detectados:
  - Quantitativo de diâmetro desnecessário nos quantitativos_chave (deveria ser apenas observação)
- Checks:
  - schema_valido: ok
  - quantidade_estacas_identificada: ok
  - diametro_identificado: ok
  - profundidade_nao_inventada: ok
  - pergunta_hitl_presente: ok
  - fatos_minimos_presentes: ok
  - campos_obrigatorios_atendidos: ok
  - nao_fez_proibido: ok
  - erros_proibidos_evitados: ok
  - gatilhos_hitl_acionados: ok

### MC-GEO-004 - Fundações com escavação e reaterro omitidos no texto-base
- Status: APROVADO
- Score: 95
- Resumo: Aprovado com excelência. O especialista identificou corretamente todos os serviços auxiliares de solo (escavação, reaterro, lastro, regularização) mesmo não estando explícitos no texto-base. Listou 6 itens orçamentários candidatos (acima do mínimo de 3), não fechou volumes sem base técnica, e ativou adequadamente os gatilhos HITL para obter detalhamentos necessários. Demonstrou conhecimento técnico sólido ao reconhecer que fundações superficiais implicam necessariamente em serviços de preparo de solo.
- Checks:
  - schema_valido: ok
  - servicos_auxiliares_presentes: ok
  - nao_fechou_volume_sem_base: ok
  - itens_orcamentarios_candidatos_minimo: ok
  - fatos_minimos_atendidos: ok
  - nao_pode_fazer_respeitado: ok
  - erros_proibidos_ausentes: ok
  - gatilhos_hitl_ativados: ok

### MC-GEO-005 - Blocos e sapatas com dimensões parciais e quantitativo aberto
- Status: APROVADO
- Score: 95
- Resumo: Aprovado com excelência. O especialista identificou corretamente os elementos de fundação (bloco B1 e sapatas S1/S2), marcou todos os quantitativos como candidatos devido às dimensões incompletas, formulou perguntas HITL apropriadas e evitou inferências sem lastro. Atendeu todos os critérios obrigatórios e demonstrou comportamento conservador adequado ao não inventar dados ausentes.
- Erros detectados:
  - Confiança ligeiramente baixa (0.6) para cenário bem estruturado
- Checks:
  - schema_valido: ok
  - elementos_fundacao_identificados: ok
  - quantitativo_marcado_como_candidato: ok
  - pergunta_hitl_presente: ok
  - fatos_minimos_atendidos: ok
  - campos_obrigatorios_atendidos: ok
  - erros_proibidos_evitados: ok
  - gatilhos_hitl_ativados: ok

### MC-GEO-006 - Risco geotécnico com lençol freático e solo de baixa resistência
- Status: APROVADO
- Score: 95
- Resumo: Aprovado com excelência. O especialista identificou corretamente todos os riscos geotécnicos críticos (solo argiloso mole e lençol freático a 1,40m), sinalizou adequadamente a ausência de soluções executivas no projeto, acionou HITL com pergunta pertinente sobre mitigação de riscos, e sugeriu itens orçamentários apropriados sem assumir soluções definitivas. Atendeu integralmente aos critérios de aprovação e evitou todos os erros proibidos.
- Checks:
  - schema_valido: ok
  - risco_geotecnico_sinalizado: ok
  - agua_sinalizada: ok
  - pergunta_hitl_presente: ok
  - conflitos_identificados: ok
  - evidencias_criticas_presentes: ok
  - itens_orcamentarios_pertinentes: ok
  - nao_assumiu_solucao_fechada: ok
  - nao_ignorou_riscos: ok