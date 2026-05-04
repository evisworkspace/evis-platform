# EVIS — ORÇAMENTISTA IA

## Data Model — Modelo de Dados Técnico-Funcional

**Status:** Documento técnico complementar  
**Módulo:** Orçamentista IA  
**Área:** Pré-obra / Oportunidade / Proposta  
**Arquivo sugerido:** `orcamentista/docs/EVIS_ORCAMENTISTA_DATA_MODEL.md`  
**Dependências:**  
- `EVIS_ORCAMENTISTA_IA_CANONICAL.md`  
- `EVIS_ORCAMENTISTA_DOMAIN_AGENTS.md`  
- `EVIS_ORCAMENTISTA_PIPELINE.md`  
- `EVIS_ORCAMENTISTA_HITL_RULES.md`  

---

# 1. Objetivo deste Documento

Este documento define o modelo de dados conceitual do **Orçamentista IA EVIS**.

O objetivo é orientar a implementação técnica do módulo sem misturar dados de pré-obra com dados de execução real.

Este documento não é uma migration SQL final.

Ele é uma especificação técnico-funcional para orientar:

- entidades;
- relacionamentos;
- campos mínimos;
- status;
- rastreabilidade;
- versionamento;
- validações HITL;
- saída para proposta;
- futura conversão em obra.

---

# 2. Princípio Central do Modelo de Dados

O Orçamentista IA opera dentro da fase de **Oportunidade**.

Ele cria dados de orçamento, escopo, quantitativo, custo e proposta, mas **não cria dados de execução**.

## Regra crítica

O modelo de dados do Orçamentista IA não deve gravar:

```text
avanço físico real
medição executada
diário de obra
produtividade real
pagamento de equipe executada
relatório semanal de obra ativa
registro de serviço concluído
```

## O que ele pode gravar

```text
oportunidade
orçamento
versões de orçamento
arquivos de orçamento
leituras técnicas
ambientes previstos
serviços previstos
quantitativos previstos
custos previstos
premissas
exclusões
riscos
HITLs
cronograma inicial
base de proposta
```

---

# 3. Separação entre Pré-obra e Obra

## Domínio do Orçamentista IA

```text
Lead / Oportunidade
→ Orçamento
→ Proposta
```

## Domínio da Obra

```text
Obra
→ Diário de Obra
→ Execução
→ Medições
→ Relatórios
→ Pagamentos operacionais
```

## Regra de fronteira

O Orçamentista IA pode preparar dados para conversão em obra, mas a conversão só deve ocorrer após proposta aprovada.

---

# 4. Entidades Principais

O modelo do Orçamentista IA deve considerar as seguintes entidades:

```text
oportunidades
orcamentos
orcamento_versoes
orcamento_arquivos
orcamento_leituras
orcamento_ambientes
orcamento_servicos
orcamento_quantitativos
orcamento_custos
orcamento_bdi_margens
orcamento_equipes_previstas
orcamento_cronograma_inicial
orcamento_riscos
orcamento_premissas
orcamento_exclusoes
orcamento_hitl_validacoes
orcamento_auditorias
orcamento_propostas_base
orcamento_agent_runs
```

---

# 5. Entidade — oportunidades

## Função

Representa a oportunidade comercial antes da obra existir.

O Orçamentista IA deve nascer dentro de uma oportunidade.

## Campos mínimos

```text
id
nome
cliente_id
status
origem
responsavel_id
data_criacao
data_atualizacao
observacoes
```

## Status possíveis

```text
lead
em_qualificacao
em_orcamento
proposta_em_preparacao
proposta_enviada
proposta_aprovada
proposta_rejeitada
convertida_em_obra
cancelada
```

## Relações

```text
oportunidade 1:N orcamentos
oportunidade 1:N propostas
oportunidade 0:1 obra após conversão
```

---

# 6. Entidade — orcamentos

## Função

Representa o orçamento principal criado dentro de uma oportunidade.

Cada oportunidade pode ter um ou mais orçamentos.

## Campos mínimos

```text
id
oportunidade_id
nome
descricao
tipo_orcamento
status
versao_atual
valor_custo_total
valor_venda_total
confianca_global
data_criacao
data_atualizacao
criado_por
observacoes
```

## Tipos de orçamento

```text
estimativa_preliminar
orcamento_tecnico_parcial
orcamento_executivo
comparativo_proposta
revisao_comercial
```

## Status possíveis

```text
rascunho
em_analise
aguardando_hitl
preliminar
validado
consolidado
proposta_gerada
proposta_enviada
aprovado
rejeitado
substituido
cancelado
```

## Regras

* Todo orçamento deve pertencer a uma oportunidade.
* Nenhum orçamento deve existir solto.
* Um orçamento pode ter várias versões.
* Apenas orçamento consolidado pode gerar proposta final.
* Apenas orçamento aprovado pode preparar conversão em obra.

---

# 7. Entidade — orcamento_versoes

## Função

Controlar versões do orçamento.

Cada alteração relevante deve gerar uma nova versão.

## Campos mínimos

```text
id
orcamento_id
numero_versao
status
motivo_versao
valor_custo_total
valor_venda_total
criada_em
criada_por
observacoes
```

## Status possíveis

```text
rascunho
em_validacao
validada
consolidada
enviada
substituida
cancelada
```

## Eventos que geram nova versão

```text
novo arquivo recebido
alteracao_de_escopo
alteracao_de_quantidade
alteracao_de_custo
alteracao_de_margem
alteracao_de_premissa
alteracao_de_exclusao
resolucao_hitl_relevante
nova_proposta
```

## Regra

Nenhuma versão anterior deve ser perdida.

---

# 8. Entidade — orcamento_arquivos

## Função

Registrar arquivos enviados para análise do orçamento.

## Campos mínimos

```text
id
orcamento_id
versao_id
nome_original
tipo_arquivo
mime_type
url_storage
tamanho_bytes
disciplina_detectada
subtipo_detectado
status_upload
status_leitura
confianca_classificacao
data_upload
observacoes
```

## Tipos de arquivo

```text
pdf
imagem
planilha
texto
dwg_futuro
ifc_futuro
outro
```

## Status de leitura

```text
recebido
aguardando_leitura
em_leitura
lido
lido_parcialmente
ilegivel
erro
descartado
```

## Disciplinas detectáveis

```text
arquitetura
layout
demolicao
construcao
forro
paginacao
revestimentos
luminotecnico
eletrica
hidraulica
sanitario
estrutural
ppci
climatizacao
exaustao
marcenaria
serralheria
acabamentos
documentacao
aprovacoes
orcamento_terceiro
foto_local
comercial
indefinido
```

---

# 9. Entidade — orcamento_leituras

## Função

Armazenar o resultado da leitura técnica dos arquivos.

## Campos mínimos

```text
id
orcamento_id
versao_id
arquivo_id
pagina
tipo_leitura
conteudo_extraido
elementos_detectados
ambientes_detectados
tabelas_detectadas
legendas_detectadas
notas_detectadas
pontos_ilegiveis
confianca_leitura
created_at
```

## Tipos de leitura

```text
texto_pdf
imagem
ocr
multimodal
manual
```

## Níveis de confiança

```text
alta
media
baixa
```

## Regra

A leitura não é orçamento.

Ela serve como base para classificação, agentes de domínio e rastreabilidade.

---

# 10. Entidade — orcamento_agent_runs

## Função

Registrar execuções dos agentes do Orçamentista IA.

Essa entidade é importante para auditoria, rastreabilidade e depuração.

## Campos mínimos

```text
id
orcamento_id
versao_id
agent_name
agent_type
status
input_refs
output_summary
output_json
confidence
started_at
finished_at
error_message
```

## Tipos de agente

```text
input_handler
reader_multimodal
classificador_documentos
planner_tecnico
civil_arquitetonico
estrutural
eletrica_dados_automacao
hidrossanitario
impermeabilizacao
climatizacao_exaustao_ventilacao
ppci_incendio
marcenaria_mobiliario_tecnico
vidros_esquadrias_serralheria
acabamentos
documentacao_aprovacoes
administracao_gestao_obra
compatibilizacao_tecnica
comparativo_propostas
quantitativo
custos
bdi_margem
auditor
cronograma_inicial
gerador_proposta
hitl_review
```

## Status possíveis

```text
pendente
em_execucao
concluido
concluido_com_alertas
erro
cancelado
```

---

# 11. Entidade — orcamento_ambientes

## Função

Registrar ambientes identificados ou inferidos no orçamento.

## Campos mínimos

```text
id
orcamento_id
versao_id
nome
tipo_ambiente
area_m2
perimetro_ml
pe_direito_m
status
confianca
origem_tipo
origem_arquivo_id
origem_pagina
origem_referencia
hitl_required
observacoes
```

## Tipos de ambiente

```text
sala
cozinha
banheiro
lavabo
quarto
circulacao
area_tecnica
salao
deposito
fachada
area_externa
ambiente_comercial
ambiente_indefinido
```

## Status

```text
identificado
inferido
pendente
validado
rejeitado
revisar
fora_do_escopo
```

## Regra

Ambientes inferidos ou sem área confiável devem gerar HITL quando impactarem quantitativos.

---

# 12. Entidade — orcamento_servicos

## Função

Registrar serviços orçamentáveis gerados pelo Planner Técnico e pelos Agentes de Domínio.

## Campos mínimos

```text
id
orcamento_id
versao_id
ambiente_id
categoria
disciplina
nome
descricao
unidade_padrao
status
confianca
origem_tipo
origem_arquivo_id
origem_pagina
origem_agente
hitl_required
fora_do_escopo
observacoes
```

## Categorias possíveis

```text
mobilizacao
protecoes
demolicoes
descarte
civil
drywall
forro
piso
revestimento
pintura
eletrica
dados_automacao
hidraulica
sanitario
impermeabilizacao
climatizacao
exaustao
ppci
marcenaria
vidros_esquadrias
serralheria
acabamentos
documentacao
aprovacoes
administracao
gestao
limpeza
outros
```

## Disciplinas possíveis

```text
civil_arquitetonico
estrutural
eletrica
hidrossanitario
impermeabilizacao
climatizacao
ppci
marcenaria
vidros_esquadrias_serralheria
acabamentos
documentacao
administracao
compatibilizacao
comercial
```

## Status possíveis

```text
identificado
inferido
pendente
validado
rejeitado
revisar
verba
fora_do_escopo
```

## Regra

Todo serviço deve ter:

```text
origem
status
confianca
unidade
disciplina
```

Serviço sem origem deve ser tratado como pendente ou inferido, nunca como definitivo.

---

# 13. Entidade — orcamento_quantitativos

## Função

Registrar quantidades associadas aos serviços.

## Campos mínimos

```text
id
orcamento_id
versao_id
servico_id
ambiente_id
quantidade
unidade
tipo_quantitativo
metodo_calculo
origem_tipo
origem_arquivo_id
origem_pagina
origem_referencia
confianca
hitl_required
observacoes
```

## Unidades aceitas

```text
m2
m3
ml
unidade
ponto
conjunto
verba
diaria
mes
percentual
hora
kg
tonelada
```

## Tipos de quantitativo

```text
medido
calculado
estimado
verba
pendente
manual
```

## Exemplos de método de cálculo

```text
area_extraida_de_planta
perimetro_calculado
contagem_de_pontos
estimativa_por_ambiente
valor_manual_usuario
verba_tecnica
sem_quantidade_definida
```

## Regra crítica

Quantidade relevante sem origem deve gerar HITL.

---

# 14. Entidade — orcamento_custos

## Função

Registrar custos unitários e totais dos serviços.

## Campos mínimos

```text
id
orcamento_id
versao_id
servico_id
quantitativo_id
custo_unitario
custo_total
moeda
fonte_custo
tipo_custo
confianca
material_incluso
mao_de_obra_inclusa
equipamento_incluso
origem_referencia
hitl_required
observacoes
```

## Fontes de custo

```text
base_propria
sinapi
historico
fornecedor
valor_usuario
verba_estimativa
manual
sem_referencia
```

## Tipos de custo

```text
definitivo
estimado
verba
manual
referencial
pendente
```

## Regra

Custo estimado deve ser explicitamente marcado como estimado, verba ou manual.

---

# 15. Entidade — orcamento_bdi_margens

## Função

Registrar cálculo comercial aplicado ao orçamento.

## Campos mínimos

```text
id
orcamento_id
versao_id
tipo_aplicacao
base_calculo
percentual_bdi
percentual_margem
valor_administracao
valor_impostos
valor_risco
valor_deslocamento
valor_estacionamento
valor_descarte
valor_urgencia
valor_obra_noturna
valor_taxa_shopping_condominio
custo_direto_total
preco_venda_total
hitl_required
status_validacao
observacoes
```

## Tipos de aplicação

```text
global
por_categoria
por_servico
manual
```

## Regra

Preço final não deve ser considerado validado sem validação da lógica comercial.

---

# 16. Entidade — orcamento_equipes_previstas

## Função

Registrar equipes previstas para execução futura.

Essas equipes não representam presença real nem equipe executando obra ativa.

## Campos mínimos

```text
id
orcamento_id
versao_id
servico_id
nome
categoria
tipo
status
fonte
observacoes
```

## Status possíveis

```text
definida
a_definir
sugerida
validada
fora_do_escopo
```

## Tipos

```text
mao_de_obra_interna
terceiro
fornecedor
especialista
responsavel_tecnico
a_definir
```

## Regra crítica

Equipes previstas não são equipes em campo.

Não podem alimentar diário de obra ou medição antes da conversão em obra.

---

# 17. Entidade — orcamento_cronograma_inicial

## Função

Registrar o cronograma preliminar gerado pelo Orçamentista IA.

## Campos mínimos

```text
id
orcamento_id
versao_id
servico_id
equipe_prevista_id
etapa
ordem_logica
duracao_estimada_dias
dependencias
inicio_estimado
fim_estimado
tipo_data
confianca
status
observacoes
```

## Tipo de data

```text
sem_data_fixa
estimada
validada
condicionada
```

## Status

```text
preliminar
validado
pendente
revisar
fora_do_escopo
```

## Regra

O cronograma inicial não representa execução real.

Ele só vira base operacional após aprovação da proposta e conversão em obra.

---

# 18. Entidade — orcamento_riscos

## Função

Registrar riscos técnicos, financeiros, comerciais e operacionais identificados no orçamento.

## Campos mínimos

```text
id
orcamento_id
versao_id
item_ref
tipo_item
tipo_risco
descricao
impacto_tecnico
impacto_financeiro
impacto_prazo
severidade
status
origem_agente
hitl_required
decisao_usuario
observacoes
```

## Tipos de risco

```text
tecnico
financeiro
comercial
operacional
juridico
responsabilidade_tecnica
aprovacao_externa
```

## Severidade

```text
baixa
media
alta
critica
```

## Status

```text
aberto
em_revisao
mitigado
aceito
rejeitado
bloqueante
resolvido
```

## Regra

Risco crítico deve gerar HITL e pode bloquear consolidação.

---

# 19. Entidade — orcamento_premissas

## Função

Registrar premissas usadas no orçamento e na proposta.

## Campos mínimos

```text
id
orcamento_id
versao_id
descricao
tipo_premissa
origem
status
visibilidade
hitl_required
observacoes
```

## Tipos de premissa

```text
tecnica
comercial
prazo
fornecimento
documentacao
aprovacao
execucao
pagamento
```

## Visibilidade

```text
interna
cliente
ambas
```

## Status

```text
sugerida
validada
rejeitada
revisar
```

## Exemplos

```text
Orçamento baseado nos arquivos recebidos até a data da análise.
Execução considerada em horário comercial.
Materiais de acabamento fornecidos pelo cliente, salvo indicação contrária.
Alterações de projeto podem gerar revisão de valores.
```

---

# 20. Entidade — orcamento_exclusoes

## Função

Registrar itens identificados ou possíveis, mas excluídos da proposta.

## Campos mínimos

```text
id
orcamento_id
versao_id
descricao
categoria
disciplina
motivo
origem
status
visibilidade
hitl_required
observacoes
```

## Status

```text
sugerida
confirmada
rejeitada
revisar
```

## Visibilidade

```text
interna
cliente
ambas
```

## Exemplos

```text
Fornecimento de luminárias não incluso.
Equipamentos de ar-condicionado não inclusos.
Taxas de condomínio/shopping não inclusas.
Projetos complementares não enviados não inclusos.
```

## Regra

Exclusões relevantes devem aparecer na proposta como proteção comercial.

---

# 21. Entidade — orcamento_hitl_validacoes

## Função

Registrar validações humanas obrigatórias ou recomendadas.

## Campos mínimos

```text
id
orcamento_id
versao_id
item_ref
tipo_item
hitl_type
disciplina
titulo
motivo
impacto_tecnico
impacto_financeiro
impacto_prazo
severidade
status
opcoes
decisao_usuario
comentario_usuario
created_by_agent
created_at
resolved_at
```

## Tipos HITL

```text
hitl_escopo
hitl_quantidade
hitl_custo
hitl_fornecimento
hitl_risco_tecnico
hitl_risco_financeiro
hitl_responsabilidade_tecnica
hitl_documentacao
hitl_aprovacao_externa
hitl_premissa
hitl_exclusao
hitl_margem_bdi
hitl_cronograma
hitl_compatibilizacao
hitl_comercial
```

## Status

```text
pendente
em_revisao
aprovada
corrigida
rejeitada
convertida_em_verba
fora_do_escopo
aguardando_documento
bloqueada
resolvida
cancelada
```

## Regra

HITL crítico pendente deve bloquear consolidação definitiva.

---

# 22. Entidade — orcamento_hitl_auditoria

## Função

Registrar histórico das decisões humanas sobre validações HITL.

## Campos mínimos

```text
id
hitl_id
orcamento_id
versao_id
usuario_id
decisao
valor_anterior
valor_novo
comentario
data_decisao
```

## Decisões possíveis

```text
aprovar
corrigir
rejeitar
marcar_como_verba
marcar_fora_do_escopo
solicitar_mais_informacoes
solicitar_novo_arquivo
aceitar_com_premissa
bloquear_item
desbloquear_item
```

## Regra

Toda decisão humana relevante deve ser auditável.

---

# 23. Entidade — orcamento_auditorias

## Função

Registrar auditorias automáticas feitas antes da consolidação.

## Campos mínimos

```text
id
orcamento_id
versao_id
item_ref
tipo_item
problema
gravidade
impacto
acao_recomendada
hitl_required
status
created_at
resolved_at
```

## Gravidade

```text
baixa
media
alta
critica
```

## Status

```text
aberta
em_revisao
resolvida
aceita_com_risco
cancelada
```

## Exemplos de problemas

```text
servico_sem_quantidade
servico_sem_custo
quantidade_sem_origem
custo_sem_referencia
risco_sem_hitl
conflito_critico
escopo_sem_premissa
exclusao_ausente
```

---

# 24. Entidade — orcamento_propostas_base

## Função

Registrar a base de proposta gerada pelo Orçamentista IA.

Essa entidade representa a preparação da proposta, não necessariamente a proposta enviada.

## Campos mínimos

```text
id
orcamento_id
versao_id
titulo
resumo_executivo
escopo_incluso
escopo_excluido
premissas
condicoes_comerciais
prazo_estimado
validade_proposta
observacoes_cliente
observacoes_internas
valor_total
status
created_at
updated_at
```

## Status

```text
rascunho
gerada
em_revisao
aprovada_para_envio
enviada
substituida
cancelada
```

## Regra

Observações internas não devem ser expostas automaticamente ao cliente.

---

# 25. Origem da Informação

Toda entidade relevante deve permitir rastreabilidade de origem.

## Campos recomendados

```text
origem_tipo
origem_arquivo_id
origem_pagina
origem_referencia
origem_texto
origem_agente
origem_usuario_id
created_at
updated_at
```

## Tipos de origem

```text
arquivo_pdf
imagem
texto_usuario
memorial
planta
tabela
legenda
inferencia_tecnica
base_preco
sinapi
historico
fornecedor
manual
validacao_usuario
agente_ia
```

## Regra

Nenhum serviço, quantitativo ou custo relevante deve existir sem origem.

---

# 26. Confiança

Diversas entidades devem registrar nível de confiança.

## Campos

```text
confianca
justificativa_confianca
```

## Valores

```text
alta
media
baixa
```

## Definições

### Alta

Informação clara em documento, base validada ou validação humana.

### Média

Informação inferida com base técnica razoável, mas ainda dependente de confirmação.

### Baixa

Informação incerta, incompleta, contraditória ou sem origem suficiente.

---

# 27. Status Canônicos dos Itens

## Status para serviços, ambientes e itens técnicos

```text
identificado
inferido
pendente
validado
rejeitado
revisar
verba
fora_do_escopo
validado_com_premissa
```

## Regra

Itens com status `inferido`, `pendente`, `verba` ou `validado_com_premissa` devem manter rastreabilidade e, quando relevantes, HITL associado.

---

# 28. Relações Principais

## Relação geral

```text
oportunidades
  └── orcamentos
        ├── orcamento_versoes
        ├── orcamento_arquivos
        ├── orcamento_leituras
        ├── orcamento_agent_runs
        ├── orcamento_ambientes
        ├── orcamento_servicos
        │     ├── orcamento_quantitativos
        │     ├── orcamento_custos
        │     └── orcamento_cronograma_inicial
        ├── orcamento_bdi_margens
        ├── orcamento_equipes_previstas
        ├── orcamento_riscos
        ├── orcamento_premissas
        ├── orcamento_exclusoes
        ├── orcamento_hitl_validacoes
        │     └── orcamento_hitl_auditoria
        ├── orcamento_auditorias
        └── orcamento_propostas_base
```

---

# 29. JSON Canônico — Orçamento Consolidado

O sistema deve ser capaz de montar um objeto consolidado semelhante a este:

```json
{
  "orcamento": {
    "id": "orc_001",
    "oportunidade_id": "opp_001",
    "nome": "Orçamento Reforma Comercial",
    "tipo_orcamento": "orcamento_tecnico_parcial",
    "status": "consolidado",
    "versao_atual": 3,
    "confianca_global": "media"
  },
  "ambientes": [
    {
      "id": "amb_001",
      "nome": "Salão Principal",
      "area_m2": 82.4,
      "status": "validado",
      "confianca": "alta"
    }
  ],
  "servicos": [
    {
      "id": "srv_001",
      "ambiente_id": "amb_001",
      "categoria": "forro",
      "disciplina": "civil_arquitetonico",
      "nome": "Execução de forro em drywall",
      "unidade_padrao": "m2",
      "status": "validado",
      "confianca": "alta"
    }
  ],
  "quantitativos": [
    {
      "servico_id": "srv_001",
      "quantidade": 82.4,
      "unidade": "m2",
      "tipo_quantitativo": "calculado",
      "confianca": "alta"
    }
  ],
  "custos": [
    {
      "servico_id": "srv_001",
      "custo_unitario": 0,
      "custo_total": 0,
      "fonte_custo": "base_propria",
      "tipo_custo": "referencial",
      "confianca": "media"
    }
  ],
  "hitl": [
    {
      "id": "hitl_001",
      "item_ref": "srv_001",
      "hitl_type": "hitl_quantidade",
      "status": "resolvida",
      "decisao_usuario": "aprovar"
    }
  ],
  "premissas": [
    {
      "descricao": "Orçamento baseado nos arquivos recebidos até a data da análise.",
      "visibilidade": "cliente"
    }
  ],
  "exclusoes": [
    {
      "descricao": "Fornecimento de luminárias não incluso.",
      "visibilidade": "cliente"
    }
  ],
  "cronograma_inicial": [
    {
      "servico_id": "srv_001",
      "etapa": "Fechamentos",
      "ordem_logica": 5,
      "duracao_estimada_dias": 3,
      "status": "preliminar"
    }
  ]
}
```

---

# 30. Campos Obrigatórios por Entidade Crítica

## Serviço

```text
id
orcamento_id
versao_id
nome
categoria
disciplina
unidade_padrao
status
confianca
origem_tipo
```

## Quantitativo

```text
id
servico_id
quantidade
unidade
tipo_quantitativo
origem_tipo
confianca
```

## Custo

```text
id
servico_id
custo_unitario
custo_total
fonte_custo
tipo_custo
confianca
```

## HITL

```text
id
orcamento_id
item_ref
hitl_type
motivo
severidade
status
```

## Premissa

```text
id
orcamento_id
descricao
visibilidade
status
```

## Exclusão

```text
id
orcamento_id
descricao
visibilidade
status
```

---

# 31. Regras de Integridade

## Regra 1 — Serviço sem orçamento é inválido

Todo serviço deve pertencer a um orçamento.

## Regra 2 — Quantitativo sem serviço é inválido

Todo quantitativo deve estar vinculado a um serviço.

## Regra 3 — Custo sem serviço é inválido

Todo custo deve estar vinculado a um serviço.

## Regra 4 — Custo sem quantitativo deve ser justificado

Pode existir custo tipo verba, mas deve ser marcado como `verba` ou `manual`.

## Regra 5 — HITL deve apontar item

Toda validação HITL deve apontar um item ou uma decisão do orçamento.

## Regra 6 — Consolidação exige auditoria

Orçamento consolidado deve ter auditoria executada.

## Regra 7 — Conversão exige proposta aprovada

Nenhum orçamento deve virar obra sem proposta aprovada.

---

# 32. Regras de Bloqueio no Modelo

O sistema deve impedir status `consolidado` se houver:

```text
HITL crítico pendente
auditoria crítica aberta
serviço principal sem quantidade
serviço principal sem custo
risco estrutural pendente
PPCI crítico pendente
fornecimento principal indefinido
margem/preço não validado
```

---

# 33. Relação com Proposta

A proposta deve ser gerada a partir de um orçamento validado ou consolidado.

## Fluxo

```text
orcamento
→ orcamento_versao
→ orcamento_propostas_base
→ proposta
```

## Regra

A proposta não deve usar dados soltos.

Ela deve referenciar uma versão específica do orçamento.

---

# 34. Relação com Conversão em Obra

Após aprovação da proposta, o sistema pode preparar migração para obra.

## Dados que podem migrar

```text
ambientes validados
serviços validados
quantitativos validados
custos aprovados
cronograma inicial
equipes previstas
escopo incluso
escopo excluído
premissas
anexos
observações técnicas
```

## Dados que não podem migrar como definitivos

```text
itens inferidos sem validação
verbas abertas
HITLs pendentes
custos de baixa confiança
quantitativos sem origem
riscos críticos não resolvidos
```

---

# 35. Tabela Conceitual de Migração para Obra

## De orçamento para obra

```text
orcamento_servicos.validado
→ obra_servicos_planejados

orcamento_cronograma_inicial.validado/preliminar
→ obra_cronograma_base

orcamento_equipes_previstas.validada/a_definir
→ obra_equipes_previstas

orcamento_premissas.cliente
→ obra_contrato_premissas

orcamento_exclusoes.cliente
→ obra_contrato_exclusoes
```

## Regra

A migração deve ser explícita e controlada.

Não deve ser automática sem aprovação.

---

# 36. Campos para Interface

A interface do Orçamentista IA deve conseguir renderizar:

```text
resumo_orcamento
status_pipeline
arquivos_recebidos
leituras
disciplinas_detectadas
ambientes
servicos
quantitativos
custos
margens
riscos
premissas
exclusoes
validacoes_hitl
auditorias
cronograma_inicial
proposta_base
versoes
```

---

# 37. Campos para Dashboard Resumido

## Indicadores sugeridos

```text
valor_custo_total
valor_venda_total
margem_estimativa
quantidade_servicos
quantidade_ambientes
quantidade_arquivos
quantidade_hitl_pendentes
quantidade_hitl_criticos
quantidade_riscos_abertos
confianca_global
status_orcamento
versao_atual
```

---

# 38. Status Global de Confiança do Orçamento

## Cálculo conceitual

A confiança global pode considerar:

```text
percentual de serviços com origem clara
percentual de custos com fonte confiável
percentual de quantitativos medidos/calculados
quantidade de HITLs críticos pendentes
quantidade de documentos ausentes
gravidade dos riscos
```

## Valores

```text
alta
media
baixa
```

## Regra

Orçamento com HITL crítico pendente não deve ter confiança global alta.

---

# 39. Regras para Supabase

## Observação

Este documento não define SQL final.

Mas a implementação em Supabase deve respeitar:

```text
chaves primárias UUID
foreign keys entre entidades principais
timestamps created_at / updated_at
campos JSONB para outputs ricos de agentes quando necessário
campos text para descrições legíveis
campos enum ou check constraints para status críticos
índices por oportunidade_id, orcamento_id e versao_id
```

## Campos JSONB recomendados

```text
elementos_detectados
output_json
input_refs
opcoes_hitl
dependencias
escopo_incluso
escopo_excluido
premissas
observacoes_internas
```

## Regra

JSONB pode apoiar flexibilidade, mas entidades críticas devem ter campos relacionais próprios.

Serviço, quantidade, custo, HITL e proposta não devem existir apenas dentro de JSON solto.

---

# 40. Regras de Segurança de Dados

## Dados internos

Não devem ser expostos automaticamente ao cliente:

```text
custo real
margem
estratégia comercial
comentários internos
comparativo sensível de concorrente
alertas internos
risco aceito internamente
```

## Dados que podem ir para cliente

```text
escopo incluso
escopo excluído
premissas
condições comerciais
prazo estimado
validade
observações técnicas controladas
valor final
```

---

# 41. Checklist de Implementação do Modelo

O modelo estará minimamente correto quando permitir:

```text
[ ] Criar orçamento dentro de oportunidade
[ ] Criar versões de orçamento
[ ] Vincular arquivos ao orçamento
[ ] Armazenar leitura dos arquivos
[ ] Registrar execução dos agentes
[ ] Criar ambientes previstos
[ ] Criar serviços previstos
[ ] Criar quantitativos com origem
[ ] Criar custos com fonte
[ ] Registrar BDI/margem
[ ] Registrar equipes previstas
[ ] Registrar cronograma inicial
[ ] Registrar riscos
[ ] Registrar premissas
[ ] Registrar exclusões
[ ] Registrar HITLs
[ ] Auditar decisões HITL
[ ] Registrar auditoria técnica
[ ] Gerar base de proposta
[ ] Preservar versionamento
[ ] Separar pré-obra de execução
[ ] Impedir consolidação com bloqueios críticos
[ ] Preparar migração para obra somente após aprovação
```

---

# 42. Critérios de Sucesso

O modelo de dados será considerado correto quando:

```text
[ ] Nenhum dado de orçamento existir sem oportunidade
[ ] Nenhum serviço existir sem orçamento
[ ] Nenhum quantitativo relevante existir sem origem
[ ] Nenhum custo relevante existir sem fonte
[ ] Nenhum HITL crítico pendente permitir consolidação definitiva
[ ] Nenhuma proposta final existir sem versão de orçamento
[ ] Nenhuma obra for criada antes da proposta aprovada
[ ] Dados internos e dados do cliente estiverem separados
[ ] Versionamento preservar histórico
[ ] Agentes puderem registrar suas saídas
[ ] Supabase puder consultar os dados de forma relacional
```

---

# 43. Frase Canônica Final

O Modelo de Dados do Orçamentista IA EVIS organiza a fase de pré-obra em entidades rastreáveis, versionadas e auditáveis, permitindo que arquivos, leituras, agentes, escopos, quantitativos, custos, riscos, HITLs, premissas, exclusões, cronograma inicial e proposta sejam estruturados antes da conversão em obra.

Ele não representa execução.

Ele representa preparação técnica e comercial para contratação.
