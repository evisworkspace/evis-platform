# Baseline Hidráulica e Sanitária

- Total: 6
- Aprovados: 6
- Reprovados: 0
- Score médio: 95.8

## Resultados por microcaso

### MC-HID-001 - Contagem de pontos em banheiro e cozinha
- Status: APROVADO
- Score: 95
- Resumo: Aprovado com excelência. O especialista identificou corretamente todos os ambientes (banheiro suíte e cozinha), separou adequadamente os sistemas (água fria, água quente e esgoto), contabilizou todos os pontos sem omissões críticas e evitou contagem genérica. A análise é detalhada, precisa e atende todos os critérios de aprovação. Única observação menor: o campo quantitativos_chave expandiu além do mínimo esperado, mas isso demonstra completude ao invés de deficiência.
- Erros detectados:
  - Pequena inconsistência: quantitativos_chave tem 8 itens ao invés dos 3 esperados pelo critério, mas todos os itens principais estão corretos
- Checks:
  - schema_valido: ok
  - ambientes_identificados: ok
  - sistemas_separados: ok
  - esgoto_presente: ok
  - quantitativos_chave_corretos: ok
  - sem_omissao_critica: ok
  - sem_mistura_sistemas: ok
  - sem_contagem_generica: ok

### MC-HID-002 - Arquitetura sem planta hidráulica completa
- Status: APROVADO
- Score: 95
- Resumo: Excelente execução do microcaso. O especialista corretamente identificou a arquitetura como base candidata, não fechou quantitativos definitivos, acionou HITL com 5 perguntas pertinentes, e demonstrou consciência das limitações. Reconheceu explicitamente que sem planta hidráulica a leitura não é definitiva. Evitou todos os erros proibidos: não inventou diâmetros/materiais, não assumiu água quente sem evidência, não fez inferências sem lastro. Única observação menor: poderia ter indicado contagens candidatas ao invés de zerar todos os quantitativos.
- Erros detectados:
  - Quantitativos zerados desnecessariamente - poderia ter indicado contagem candidata mesmo que preliminar
- Checks:
  - schema_valido: ok
  - base_candidata_assumida: ok
  - pergunta_hitl_presente: ok
  - nao_fechou_definitivo: ok
  - fatos_minimos_presentes: ok
  - erros_proibidos_evitados: ok

### MC-HID-003 - Diferenciar pluvial de esgoto sanitário
- Status: APROVADO
- Score: 95
- Resumo: Aprovado com excelência. O especialista demonstrou clara diferenciação entre sistemas pluvial e esgoto sanitário, identificando corretamente 6 itens orçamentários candidatos (superando o mínimo de 2). Os achados evidenciam tratamento adequado dos sistemas como entidades distintas. Não houve mistura de sistemas nem omissões críticas. A classificação de calhas/descidas como pluviais e dos pontos do banheiro como esgoto sanitário está tecnicamente correta.
- Checks:
  - schema_valido: ok
  - pluvial_sinalizado: ok
  - esgoto_sinalizado: ok
  - sistemas_nao_misturados: ok
  - campos_obrigatorios: ok

### MC-HID-004 - Reservação e aquecimento como dependência de fechamento
- Status: APROVADO
- Score: 95
- Resumo: Especialista executou corretamente o protocolo HITL. Identificou sistemas especiais sem detalhamento suficiente, sinalizou dependência crítica através de conflito de alta severidade, zerou quantitativos por impossibilidade de especificação, formulou 4 perguntas HITL específicas e manteve confiança baixa (0.3). Não inventou especificações e seguiu critérios conservadores.
- Checks:
  - schema_valido: ok
  - dependencia_sinalizada: ok
  - pergunta_hitl_presente: ok
  - nao_inventou_equipamento: ok
  - fatos_minimos_identificados: ok
  - conflitos_adequados: ok
  - quantitativos_zerados: ok
  - confianca_baixa: ok

### MC-HID-005 - Evitar dupla contagem entre ambiente e detalhe ampliado
- Status: APROVADO
- Score: 95
- Resumo: Especialista demonstrou excelente compreensão do microcaso, evitando corretamente a dupla contagem entre planta e detalhe ampliado. Identificou que o detalhe serve apenas para posicionamento, não representando peças adicionais. Quantificou adequadamente 1 chuveiro e 1 ralo linear, com justificativas claras nas evidências críticas. Schema válido e todos os critérios de aprovação atendidos.
- Checks:
  - schema_valido: ok
  - duplicidade_evitada: ok
  - detalhe_tratado_como_repeticao: ok
  - fatos_minimos_presentes: ok
  - campos_obrigatorios_atendidos: ok
  - erros_proibidos_ausentes: ok

### MC-HID-006 - Priorizar composição por ponto residencial
- Status: APROVADO
- Score: 100
- Resumo: Aprovado. O especialista corretamente identificou o modelo comercial por ponto residencial, separou os 3 tipos de pontos (água fria, água quente, esgoto) em itens orçamentários candidatos distintos e aderentes ao catálogo EVIS, atendendo todos os critérios obrigatórios do microcaso.
- Checks:
  - schema_valido: ok
  - modelo_por_ponto_sinalizado: ok
  - tipos_separados: ok
  - itens_candidatos_adequados: ok