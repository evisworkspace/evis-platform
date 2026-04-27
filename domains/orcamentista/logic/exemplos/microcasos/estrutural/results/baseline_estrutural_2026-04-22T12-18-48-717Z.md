# Baseline Estrutural

- Total: 6
- Aprovados: 6
- Reprovados: 0
- Score médio: 96.7

## Resultados por microcaso

### MC-EST-001 - Conflito de FCK entre notas gerais e detalhe estrutural
- Status: APROVADO
- Score: 95
- Resumo: Aprovado com excelência. O especialista identificou corretamente o conflito entre C-30 e C-35, sinalizou que impede fechamento silencioso, acionou HITL adequadamente e evitou todos os erros proibidos. Atendeu rigorosamente aos critérios do microcaso ouro.
- Checks:
  - schema_valido: ok
  - conflito_sinalizado: ok
  - pergunta_hitl_presente: ok
  - escolha_silenciosa: falhou
  - fatos_minimos_identificados: ok
  - campos_obrigatorios_atendidos: ok
  - erros_proibidos_evitados: ok
  - gatilhos_hitl_acionados: ok

### MC-EST-002 - Leitura do quadro resumo de armaduras
- Status: APROVADO
- Score: 100
- Resumo: Aprovado. O especialista extraiu corretamente todas as bitolas (5.0, 8.0, 10.0 mm) com seus respectivos pesos, separou adequadamente peso total com e sem perda, manteve unidades em kg, não inventou dados inexistentes e atendeu todos os critérios obrigatórios. Quantitativos_chave=5 (>2 exigido), conflitos=0, perguntas_hitl=0.
- Checks:
  - schema_valido: ok
  - bitolas_corretas: ok
  - peso_total_correto: ok
  - unidade_em_kg: ok
  - quantitativos_chave: ok
  - conflitos: ok
  - perguntas_hitl: ok
  - fatos_minimos: ok
  - nao_inventou_dados: ok

### MC-EST-003 - Revisão conflitante entre prancha antiga e atual
- Status: APROVADO
- Score: 100
- Resumo: Aprovado com excelência. O especialista identificou corretamente a divergência de revisão na viga V205 (14x40 vs 14x50), sinalizou o conflito com severidade alta, acionou HITL adequadamente solicitando validação da revisão correta, e suspendeu a quantificação até resolução do conflito. Todos os critérios obrigatórios foram atendidos e nenhum erro proibido foi cometido.
- Checks:
  - schema_valido: ok
  - conflito_sinalizado: ok
  - pergunta_hitl_presente: ok
  - fatos_minimos_presentes: ok
  - campos_obrigatorios_atendidos: ok
  - erros_proibidos_evitados: ok

### MC-EST-004 - Laje pré-moldada sem quantitativo fechado
- Status: APROVADO
- Score: 95
- Resumo: Especialista estrutural atendeu plenamente aos critérios do microcaso. Identificou corretamente o sistema de laje pré-moldada com vigotas VT1026-271 e VT101c-201, marcou o quantitativo como candidato (quantidade=0) devido à ausência de somatório total, acionou adequadamente o HITL com perguntas específicas sobre comprimentos das vigotas, e não cometeu inferências sem lastro. A abordagem foi conservadora e tecnicamente correta.
- Checks:
  - schema_valido: ok
  - laje_premoldada_identificada: ok
  - quantitativo_marcado_como_candidato: ok
  - pergunta_hitl_presente: ok
  - fatos_minimos_atendidos: ok
  - campos_obrigatorios_atendidos: ok
  - erros_proibidos_evitados: ok
  - gatilhos_hitl_acionados: ok

### MC-EST-005 - Formas estruturais sem área consolidada
- Status: APROVADO
- Score: 95
- Resumo: Especialista atendeu criteriosamente ao microcaso. Reconheceu a necessidade de formas para vigas e lajes, identificou corretamente que a área não está consolidada na prancha, não inventou quantitativos, incluiu itens orçamentários candidatos apropriados e acionou HITL adequadamente. Pequena penalização pela quantidade zerada que poderia ser melhor representada como 'não determinado'.
- Erros detectados:
  - Quantidade zerada pode ser interpretada como omissão, mesmo com observação explicativa
- Checks:
  - schema_valido: ok
  - item_forma_presente: ok
  - quantitativo_como_lacuna_ou_candidato: ok
  - fatos_minimos_presentes: ok
  - campos_obrigatorios_completos: ok
  - nao_inventou_area: ok
  - nao_omitiu_forma: ok
  - nao_transformou_hipotese_em_definitivo: ok
  - gatilho_hitl_acionado: ok

### MC-EST-006 - Dependência geotécnica para fundações
- Status: APROVADO
- Score: 95
- Resumo: Aprovado com excelência. O especialista estrutural reconheceu corretamente a dependência geotécnica, sinalizou a ausência de SPT como crítica, acionou HITL adequadamente e não inventou dados. Todos os critérios de aprovação foram atendidos.
- Checks:
  - schema_valido: ok
  - dependencia_geotecnica_sinalizada: ok
  - pergunta_hitl_presente: ok
  - profundidade_nao_inventada: ok
  - conflitos_zero: ok
  - premissas_zero: ok
  - perguntas_hitl_uma: ok
  - fatos_minimos_presentes: ok
  - erros_proibidos_ausentes: ok
  - gatilhos_hitl_acionados: ok