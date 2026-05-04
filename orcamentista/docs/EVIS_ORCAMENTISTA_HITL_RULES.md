# EVIS — ORÇAMENTISTA IA

## HITL Rules — Regras de Validação Humana

**Status:** Documento técnico complementar  
**Módulo:** Orçamentista IA  
**Área:** Pré-obra / Oportunidade / Proposta  
**Arquivo sugerido:** `orcamentista/docs/EVIS_ORCAMENTISTA_HITL_RULES.md`  
**Dependências:**  
- `EVIS_ORCAMENTISTA_IA_CANONICAL.md`  
- `EVIS_ORCAMENTISTA_DOMAIN_AGENTS.md`  
- `EVIS_ORCAMENTISTA_PIPELINE.md`  

---

# 1. Objetivo deste Documento

Este documento define as regras de **HITL — Human in the Loop** do Orçamentista IA EVIS.

O objetivo é garantir que o sistema nunca transforme informação incerta, inferida, ambígua, financeiramente relevante ou tecnicamente crítica em dado definitivo sem validação humana.

O HITL é o mecanismo central de controle, segurança técnica e proteção comercial do Orçamentista IA.

---

# 2. Definição de HITL

HITL significa **Human in the Loop**, ou seja, validação humana obrigatória dentro do fluxo de decisão da IA.

No Orçamentista IA, HITL é o ponto em que o sistema interrompe, destaca ou condiciona o avanço de uma informação até que o usuário tome uma decisão.

## Frase canônica

O HITL do Orçamentista IA EVIS é o mecanismo de validação humana que impede a consolidação automática de informações incertas, inferidas, críticas ou financeiramente relevantes, garantindo que todo orçamento avance com rastreabilidade, controle técnico e responsabilidade comercial.

---

# 3. Posição do HITL no Pipeline

O HITL atua em vários pontos do pipeline, não apenas no final.

## Pontos de acionamento

```text
Input Handler
→ Reader Multimodal
→ Classificador de Documentos
→ Planner Técnico
→ Agentes de Domínio
→ Agente Quantitativo
→ Agente de Custos
→ BDI / Encargos / Margem
→ Auditor Técnico-Orçamentário
→ HITL Review
→ Cronograma Inicial
→ Proposta
→ Consolidação
```

## Regra central

Qualquer etapa pode gerar validação HITL.

O HITL Review consolida todas as validações abertas antes da consolidação do orçamento.

---

# 4. Princípio Central

O sistema pode trabalhar com incertezas, mas não pode ocultá-las.

## Regras

```text
Incerteza pode avançar como preliminar.
Incerteza relevante não pode virar definitivo.
Inferência pode existir.
Inferência deve ser declarada.
Risco pode ser aceito.
Risco deve ser validado.
Custo pode ser estimado.
Custo estimado deve ser marcado.
Quantidade pode ser estimada.
Quantidade estimada deve ter origem e validação.
```

---

# 5. Quando o HITL é Obrigatório

O HITL deve ser obrigatório sempre que houver:

```text
falta de dado essencial
inferência técnica relevante
risco financeiro
risco técnico
risco jurídico
risco contratual
responsabilidade técnica
conflito entre disciplinas
documento ausente
documento ilegível
documento contraditório
quantidade estimada relevante
custo estimado relevante
fornecimento indefinido
escopo ambíguo
aprovação externa necessária
PPCI crítico
risco estrutural
obra noturna não validada
taxa de shopping/condomínio não validada
administração de obra não validada
BDI/margem/preço final não validado
```

---

# 6. Quando o HITL é Recomendado

O HITL é recomendado, mas não necessariamente bloqueante, quando houver:

```text
ajuste de descrição
classificação de categoria com baixa relevância financeira
dúvida pequena de unidade
serviço de baixo impacto
item opcional
observação comercial
premissa padrão
escopo excluído de baixo impacto
risco operacional leve
```

## Regra

HITL recomendado pode ser agrupado como observação de revisão, sem bloquear o orçamento preliminar.

---

# 7. Quando o HITL Não é Necessário

O HITL não é necessário quando:

```text
informação aparece claramente em projeto
informação foi validada anteriormente pelo usuário
quantidade foi extraída diretamente com origem clara
custo veio de base própria validada
item é meramente informativo
classificação é óbvia e sem impacto financeiro relevante
serviço já faz parte de modelo padrão aprovado
```

## Exemplo

```text
Serviço: pintura acrílica em parede
Origem: memorial de acabamentos
Quantidade: extraída de quadro de áreas
Confiança: alta
HITL: não obrigatório
```

---

# 8. Tipos de HITL

O sistema deve classificar cada validação por tipo.

## Tipos oficiais

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

---

# 9. HITL de Escopo

## Quando ocorre

Quando há dúvida sobre se determinado serviço deve ou não entrar no orçamento.

## Exemplos

```text
demolição incluída ou não
descarte incluído ou não
proteção de piso incluída ou não
fornecimento de material incluído ou não
marcenaria incluída ou não
documentação incluída ou não
administração incluída ou embutida
```

## Decisões possíveis

```text
confirmar_inclusao
remover_do_escopo
marcar_fora_do_escopo
manter_como_verba
solicitar_mais_informacoes
```

---

# 10. HITL de Quantidade

## Quando ocorre

Quando a quantidade não foi medida diretamente ou possui baixa confiança.

## Exemplos

```text
área estimada por imagem
comprimento inferido de tubulação
quantidade de pontos sem projeto executivo
área de pintura derivada de planta sem cotas
volume estimado de demolição
perdas aplicadas sem validação
```

## Decisões possíveis

```text
aprovar_quantidade
corrigir_quantidade
manter_estimativa
marcar_como_verba
solicitar_novo_arquivo
```

## Regra

Quantidade relevante sem origem não pode ser consolidada como definitiva.

---

# 11. HITL de Custo

## Quando ocorre

Quando o custo unitário ou total não possui referência confiável.

## Exemplos

```text
custo sem base própria
custo sem SINAPI
custo informado por fornecedor sem validação
verba estimada
custo manual inserido pela IA
custo de item de alto padrão sem especificação
custo muito abaixo da referência
custo muito acima da referência
```

## Decisões possíveis

```text
aprovar_custo
corrigir_custo
buscar_referencia
manter_como_verba
remover_item
```

## Regra

Custo estimado deve aparecer com fonte `verba_estimativa` ou `manual`, nunca como custo definitivo sem validação.

---

# 12. HITL de Fornecimento

## Quando ocorre

Quando não está definido quem fornece material, equipamento ou item acabado.

## Exemplos

```text
luminárias
porcelanato
louças
metais
ar-condicionado
móveis
vidros
ferragens
equipamentos de cozinha
pedras
bancadas
```

## Decisões possíveis

```text
fornecimento_cliente
fornecimento_construtora
mao_de_obra_apenas
fornecimento_e_instalacao
fora_do_escopo
pendente
```

## Regra crítica

Fornecimento indefinido é risco comercial e deve ser validado antes da proposta.

---

# 13. HITL de Risco Técnico

## Quando ocorre

Quando há risco de execução, compatibilização ou responsabilidade técnica.

## Exemplos

```text
demolição com possível impacto estrutural
furo em laje
ausência de acesso à prumada
dreno de ar-condicionado não identificado
PPCI incompatível com layout
forro conflitante com dutos
impermeabilização sem teste
estrutura sem laudo
```

## Decisões possíveis

```text
aceitar_risco_com_premissa
exigir_projeto
exigir_laudo
manter_como_pendencia
remover_do_escopo
bloquear_consolidacao
```

---

# 14. HITL de Risco Financeiro

## Quando ocorre

Quando uma incerteza pode alterar o valor da proposta.

## Exemplos

```text
quantidade estimada de alto valor
material sem especificação
serviço omitido em projeto
obra noturna sem adicional
taxa externa não considerada
administração não cobrada
prazo agressivo
fornecedor sem cotação
```

## Decisões possíveis

```text
aceitar_risco
incluir_verba
corrigir_valor
excluir_item
solicitar_cotacao
marcar_como_premissa
```

---

# 15. HITL de Responsabilidade Técnica

## Quando ocorre

Quando o item envolve ART, RRT, laudo, projeto, aprovação ou responsabilidade profissional.

## Exemplos

```text
intervenção estrutural
PPCI
alteração elétrica relevante
alteração hidráulica relevante
aprovação em shopping
aprovação em condomínio
as built
laudo técnico
projeto complementar
```

## Decisões possíveis

```text
incluir_art_rrt
excluir_responsabilidade
solicitar_profissional_responsavel
manter_pendente
bloquear_consolidacao
```

## Regra crítica

Responsabilidade técnica não pode ser assumida implicitamente.

---

# 16. HITL de Documentação

## Quando ocorre

Quando a documentação necessária para execução, aprovação ou proposta não está clara.

## Exemplos

```text
alvará
ART
RRT
as built
PPCI aprovado
manual de condomínio
regulamento de shopping
taxas
licenças
autorizações
```

## Decisões possíveis

```text
incluir_documentacao
excluir_documentacao
cliente_responsavel
construtora_responsavel
manter_pendente
solicitar_documento
```

---

# 17. HITL de Aprovação Externa

## Quando ocorre

Quando a execução depende de terceiros externos.

## Exemplos

```text
shopping
condomínio
síndico
administradora
Corpo de Bombeiros
vigilância sanitária
prefeitura
concessionária
fornecedor homologado
```

## Decisões possíveis

```text
aguardar_aprovacao
orcamento_com_premissa
incluir_acompanhamento
excluir_taxas
cliente_responsavel
bloquear_inicio
```

---

# 18. HITL de Premissa

## Quando ocorre

Quando o sistema precisa assumir uma condição para seguir.

## Exemplos

```text
execução em horário comercial
materiais fornecidos pelo cliente
projeto recebido como base válida
sem intervenção estrutural
sem alteração de layout
taxas externas não inclusas
prazo sujeito a aprovações
```

## Decisões possíveis

```text
aprovar_premissa
corrigir_premissa
remover_premissa
transformar_em_pendencia
```

---

# 19. HITL de Exclusão

## Quando ocorre

Quando um item identificado ou provável deve ser explicitamente excluído da proposta.

## Exemplos

```text
fornecimento de luminárias excluído
equipamentos de ar-condicionado excluídos
projetos complementares excluídos
taxas de condomínio excluídas
mobiliário solto excluído
aprovações externas excluídas
```

## Decisões possíveis

```text
confirmar_exclusao
incluir_no_escopo
manter_como_premissa
remover_da_lista
```

## Regra

Escopo excluído deve ser registrado como proteção comercial.

---

# 20. HITL de Margem / BDI

## Quando ocorre

Quando o sistema aplica margem, BDI, administração, impostos ou risco.

## Exemplos

```text
margem global
margem por categoria
BDI global
administração mensal
administração percentual
taxa de risco
taxa de urgência
taxa de obra noturna
taxa de shopping/condomínio
```

## Decisões possíveis

```text
aprovar_margem
corrigir_margem
aplicar_bdi_global
aplicar_por_categoria
remover_taxa
simular_cenario
```

## Regra

Preço final não deve ser considerado validado sem aprovação da lógica comercial.

---

# 21. HITL de Cronograma

## Quando ocorre

Quando o cronograma contém estimativas ou dependências relevantes.

## Exemplos

```text
prazo agressivo
execução noturna
dependência de aprovação
dependência de fornecedor
cura de impermeabilização
testes obrigatórios
entrega parcial
obra em operação
```

## Decisões possíveis

```text
aprovar_prazo
corrigir_duracao
adicionar_dependencia
marcar_como_premissa
bloquear_data_final
```

---

# 22. HITL de Compatibilização

## Quando ocorre

Quando há conflito entre disciplinas.

## Exemplos

```text
forro versus climatização
luminária versus sprinkler
marcenaria versus tomada
hidráulica versus estrutura
layout versus rota de fuga
memorial versus planta
arquitetura versus elétrica
```

## Decisões possíveis

```text
confirmar_disciplina_prevalente
solicitar_revisao_projeto
tratar_como_verba
excluir_item
manter_premissa
bloquear_consolidacao
```

---

# 23. HITL Comercial

## Quando ocorre

Quando a decisão envolve estratégia de venda, negociação ou exposição ao cliente.

## Exemplos

```text
mostrar ou ocultar administração
separar mão de obra e material
apresentar valor global ou detalhado
incluir desconto
criar condição especial
destacar riscos na proposta
omitir riscos internos da proposta
usar orçamento como comparativo
```

## Decisões possíveis

```text
proposta_detalhada
proposta_resumida
valor_global
valor_por_etapa
aplicar_desconto
manter_preco
criar_observacao_interna
criar_observacao_cliente
```

---

# 24. Níveis de Severidade HITL

Cada validação deve ter severidade.

## Severidades oficiais

```text
baixa
media
alta
critica
```

## Baixa

Não bloqueia o orçamento.

Exemplo:

```text
Descrição de serviço pode ser refinada.
```

## Média

Pode impactar clareza, escopo ou pequeno custo.

Exemplo:

```text
Unidade de medição precisa ser validada.
```

## Alta

Pode impactar preço, prazo, responsabilidade ou contrato.

Exemplo:

```text
Fornecimento de luminárias indefinido.
```

## Crítica

Impede consolidação confiável.

Exemplo:

```text
Intervenção estrutural sem projeto ou validação técnica.
```

---

# 25. Regras de Bloqueio

## Bloqueia consolidação definitiva

```text
hitl crítico pendente
risco estrutural pendente
PPCI crítico pendente
quantidade principal sem origem
custo principal sem referência
escopo principal indefinido
fornecimento principal indefinido
auditoria crítica aberta
margem/preço final não validado
documento essencial ausente
```

## Não bloqueia orçamento preliminar

```text
pendência de baixo impacto
escopo opcional
item fora do escopo já marcado
observação comercial
custo de item pequeno estimado
premissa padrão aceita temporariamente
```

---

# 26. Estados de uma Validação HITL

Cada validação deve possuir status.

## Status oficiais

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

## Definições

### pendente

Criada pelo sistema e ainda não avaliada pelo usuário.

### em_revisao

Usuário iniciou análise, mas não decidiu.

### aprovada

Usuário confirmou a sugestão da IA.

### corrigida

Usuário alterou dado, valor, escopo ou premissa.

### rejeitada

Usuário negou a sugestão da IA.

### convertida_em_verba

Item permanece no orçamento como verba estimada.

### fora_do_escopo

Item foi reconhecido, mas excluído da proposta.

### aguardando_documento

Depende de novo arquivo ou informação externa.

### bloqueada

Impede avanço definitivo.

### resolvida

Validação concluída e incorporada ao orçamento.

### cancelada

Validação anulada por mudança de escopo ou versão.

---

# 27. Decisões Permitidas ao Usuário

O usuário deve poder decidir:

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

---

# 28. Consequência de Cada Decisão

## Aprovar

O item passa a ser validado.

```text
status_item = validado
hitl_status = resolvida
```

## Corrigir

O sistema atualiza o item e registra origem como validação do usuário.

```text
status_item = validado
origin_type = validacao_usuario
hitl_status = corrigida
```

## Rejeitar

O item é removido ou mantido como rejeitado.

```text
status_item = rejeitado
hitl_status = rejeitada
```

## Marcar como verba

O item permanece no orçamento como estimativa controlada.

```text
status_item = verba
tipo_custo = verba_estimativa
hitl_status = convertida_em_verba
```

## Marcar fora do escopo

O item é excluído do preço, mas registrado como exclusão.

```text
status_item = fora_do_escopo
hitl_status = resolvida
```

## Solicitar mais informações

O item permanece pendente.

```text
status_item = pendente
hitl_status = aguardando_documento
```

## Aceitar com premissa

O item avança, mas com premissa registrada.

```text
status_item = validado_com_premissa
hitl_status = resolvida
```

---

# 29. Estrutura de Dados Sugerida

## Objeto HITL

```json
{
  "hitl_id": "string",
  "orcamento_id": "string",
  "versao_orcamento": 1,
  "item_ref": "string",
  "tipo_item": "servico | quantidade | custo | risco | premissa | exclusao | cronograma",
  "hitl_type": "hitl_escopo",
  "disciplina": "civil",
  "titulo": "Confirmar se proteção de piso está inclusa",
  "motivo": "Item tecnicamente necessário em obra de reforma, mas não identificado explicitamente nos arquivos",
  "impacto_tecnico": "Protege áreas existentes durante execução",
  "impacto_financeiro": "Pode alterar custo de mobilização/proteção",
  "severidade": "media",
  "status": "pendente",
  "opcoes": [
    "confirmar_inclusao",
    "remover_do_escopo",
    "manter_como_verba",
    "solicitar_mais_informacoes"
  ],
  "decisao_usuario": null,
  "comentario_usuario": null,
  "created_by_agent": "civil_arquitetonico",
  "created_at": "date",
  "resolved_at": null
}
```

---

# 30. Estrutura de Auditoria HITL

Toda decisão humana deve ser registrada.

## Campos mínimos

```text
hitl_id
usuario_id
decisao
valor_anterior
valor_novo
comentario
data_decisao
versao_orcamento
```

## Motivo

Permitir rastreabilidade de:

* quem validou;
* o que foi alterado;
* por que foi alterado;
* qual versão foi impactada;
* qual valor anterior existia.

---

# 31. Origem Após Validação

Quando o usuário valida uma informação, a origem deve mudar ou ser complementada.

## Exemplo

Antes:

```text
origem = inferencia_tecnica
confianca = media
hitl_required = true
```

Depois:

```text
origem = inferencia_tecnica + validacao_usuario
confianca = alta
hitl_required = false
status = validado
```

---

# 32. Relação entre HITL e Confiança

## Regra

A validação humana pode elevar o nível de confiança.

```text
baixa + validação humana = média ou alta
média + validação humana = alta
alta sem validação = pode permanecer alta se a origem documental for clara
```

## Exceção

Se o usuário validar algo contra evidência técnica, o sistema deve registrar:

```text
validado_por_usuario_com_alerta_tecnico
```

Exemplo:

```text
O usuário optou por não incluir impermeabilização em área molhada. O sistema deve registrar alerta técnico e manter essa exclusão como risco aceito.
```

---

# 33. HITL e Risco Aceito

Quando o usuário decide seguir apesar de um risco, o sistema deve registrar como risco aceito.

## Estrutura

```text
risco
motivo
impacto
decisao_usuario
premissa_associada
responsavel_pela_decisao
data
```

## Exemplo

```text
Risco: ausência de teste de estanqueidade
Decisão: seguir sem incluir teste
Impacto: risco de infiltração não mitigado
Status: risco aceito pelo usuário
```

---

# 34. HITL e Proposta Comercial

O HITL deve alimentar a proposta.

## Pode aparecer para o cliente

```text
premissas
escopo excluído
condições comerciais
validade
dependências de aprovação
observações técnicas controladas
```

## Deve permanecer interno

```text
margem
risco comercial interno
estratégia de negociação
custo real
comentários sensíveis
comparativo de concorrente
alertas internos
```

## Regra

O sistema deve separar:

```text
observacao_interna
observacao_cliente
```

---

# 35. HITL e Versionamento

Toda resolução HITL relevante deve atualizar a versão do orçamento.

## Gera nova versão quando

```text
altera escopo
altera quantidade
altera custo
altera margem
altera premissa
altera exclusão
resolve bloqueio crítico
altera cronograma
```

## Não precisa gerar nova versão quando

```text
corrige texto sem impacto
marca observação interna
resolve pendência informativa
```

---

# 36. HITL e Consolidação

## Orçamento preliminar

Pode existir com HITLs pendentes.

## Orçamento validado

Exige HITLs principais resolvidos.

## Orçamento consolidado

Exige:

```text
sem HITL crítico pendente
sem auditoria crítica aberta
escopo principal validado
custos principais validados
quantitativos principais com origem
premissas registradas
exclusões registradas
preço final validado
```

---

# 37. HITL e Conversão em Obra

Antes de converter proposta aprovada em obra, o sistema deve verificar:

```text
[ ] proposta aprovada
[ ] orçamento consolidado
[ ] escopo aprovado
[ ] exclusões registradas
[ ] premissas registradas
[ ] itens pendentes tratados
[ ] riscos aceitos registrados
[ ] cronograma inicial validado ou marcado como preliminar
```

## Regra crítica

Itens pendentes, verbas abertas e inferências não validadas não devem migrar como dados definitivos da obra.

---

# 38. Interface HITL — Requisitos Funcionais

A interface deve permitir ao usuário:

```text
visualizar validações pendentes
filtrar por severidade
filtrar por disciplina
filtrar por tipo
abrir detalhes da validação
ver origem da informação
ver impacto técnico
ver impacto financeiro
aprovar
corrigir
rejeitar
marcar como verba
marcar fora do escopo
solicitar mais informações
adicionar comentário
ver histórico de decisões
```

---

# 39. Interface HITL — Visualização Recomendada

## Card de validação

```text
Título
Disciplina
Severidade
Status
Motivo
Impacto técnico
Impacto financeiro
Origem
Opções de decisão
Comentário do usuário
```

## Painel consolidado

```text
Total de HITLs pendentes
Críticos
Altos
Médios
Baixos
Resolvidos
Bloqueantes
```

---

# 40. HITL Batch Review

O sistema pode permitir revisão em lote para itens de baixa ou média severidade.

## Permitido em lote

```text
aprovar premissas padrão
marcar itens pequenos como verba
confirmar exclusões padrão
aprovar descrições sem impacto financeiro
```

## Proibido em lote

```text
risco estrutural
PPCI crítico
margem/preço final
escopo principal
fornecimento principal
custo relevante
quantidade relevante
responsabilidade técnica
```

---

# 41. HITL e Agentes de Domínio

Cada agente deve poder gerar HITLs específicos.

## Exemplo

```text
Agente Civil:
- proteção de piso inferida
- descarte não especificado
- área de pintura estimada

Agente Elétrica:
- luminárias sem definição de fornecimento
- quadro existente sem validação de carga

Agente PPCI:
- projeto PPCI não aprovado
- sprinkler conflitante com luminária

Agente Administração:
- obra noturna não considerada
- gestão de shopping não precificada
```

---

# 42. HITL e Auditoria

O Auditor Técnico-Orçamentário deve verificar se todos os HITLs obrigatórios foram criados.

## Auditor deve acusar erro quando

```text
há item inferido sem HITL
há custo estimado relevante sem HITL
há quantidade estimada relevante sem HITL
há risco técnico sem HITL
há fornecimento indefinido sem HITL
há conflito crítico sem HITL
```

---

# 43. Regras de Segurança Comercial

O HITL deve proteger a proposta contra ambiguidades comerciais.

## Deve validar

```text
o que está incluso
o que está excluído
quem fornece material
quem fornece equipamento
quem paga taxa externa
quem aprova projeto
quem assume documentação
qual é a margem
qual é a validade da proposta
quais alterações geram aditivo
```

---

# 44. Regras de Segurança Técnica

O HITL deve proteger contra responsabilidade técnica indevida.

## Deve validar

```text
intervenção estrutural
PPCI
hidráulica crítica
elétrica crítica
impermeabilização
aprovações externas
laudos
ART/RRT
projetos complementares
as built
```

---

# 45. Regras de Linguagem da IA no HITL

A IA deve usar linguagem objetiva e técnica.

## Deve evitar

```text
talvez esteja tudo certo
provavelmente não tem problema
acho que pode seguir
isso parece simples
```

## Deve usar

```text
Informação não identificada nos arquivos.
Item inferido tecnicamente.
Validação humana obrigatória.
Pode impactar custo final.
Pode impactar responsabilidade técnica.
Consolidação bloqueada até validação.
```

---

# 46. Exemplos Práticos de HITL

## Exemplo 1 — Proteção de piso

```text
Validação HITL:
- Item: Proteção de piso existente
- Tipo: hitl_escopo
- Disciplina: Civil / Arquitetônico
- Motivo: obra em ambiente existente, mas proteção não aparece nos documentos
- Impacto técnico: risco de dano ao acabamento existente
- Impacto financeiro: acréscimo de custo de proteção e mobilização
- Severidade: média
- Opções:
  A) Incluir proteção
  B) Excluir e registrar premissa
  C) Manter como verba
  D) Solicitar confirmação do cliente
```

---

## Exemplo 2 — Luminárias

```text
Validação HITL:
- Item: Fornecimento de luminárias
- Tipo: hitl_fornecimento
- Disciplina: Elétrica / Luminotécnico
- Motivo: pontos de iluminação identificados, mas modelos e fornecimento não definidos
- Impacto técnico: instalação depende de especificação
- Impacto financeiro: fornecimento pode alterar significativamente o valor
- Severidade: alta
- Opções:
  A) Cliente fornece luminárias
  B) Construtora fornece e instala
  C) Considerar apenas instalação
  D) Manter fornecimento como verba
```

---

## Exemplo 3 — PPCI

```text
Validação HITL:
- Item: Compatibilização PPCI com novo layout
- Tipo: hitl_compatibilizacao
- Disciplina: PPCI / Incêndio
- Motivo: layout foi alterado, mas não há confirmação de PPCI aprovado
- Impacto técnico: pode exigir remanejamento de sprinklers e sinalização
- Impacto financeiro: pode gerar custo adicional e atraso
- Severidade: crítica
- Opções:
  A) Solicitar projeto PPCI aprovado
  B) Incluir verba para adequações
  C) Excluir PPCI do escopo com premissa
  D) Bloquear consolidação
```

---

## Exemplo 4 — Administração de obra

```text
Validação HITL:
- Item: Administração / Gestão de obra
- Tipo: hitl_comercial
- Disciplina: Administração / Gestão
- Motivo: obra envolve múltiplas equipes e possível acompanhamento contínuo
- Impacto técnico: coordenação necessária para evitar conflito entre etapas
- Impacto financeiro: gestão não cobrada reduz margem real
- Severidade: alta
- Opções:
  A) Incluir administração como item separado
  B) Embutir administração no BDI
  C) Cobrar mensalmente
  D) Não considerar e registrar risco comercial
```

---

# 47. Checklist HITL do Orçamentista IA

O HITL estará corretamente implementado quando:

```text
[ ] Todo item incerto gera validação
[ ] Todo item inferido relevante gera validação
[ ] Todo custo estimado relevante gera validação
[ ] Toda quantidade estimada relevante gera validação
[ ] Todo risco técnico gera validação
[ ] Todo risco financeiro relevante gera validação
[ ] Todo fornecimento indefinido gera validação
[ ] Todo conflito crítico gera validação
[ ] Validações possuem severidade
[ ] Validações possuem status
[ ] Validações possuem origem
[ ] Usuário pode aprovar/corrigir/rejeitar
[ ] Decisão humana altera status do item
[ ] Decisão humana fica registrada
[ ] HITL crítico bloqueia consolidação
[ ] Orçamento preliminar pode existir com pendências
[ ] Orçamento consolidado exige HITLs críticos resolvidos
[ ] Conversão em obra não leva pendências como definitivas
```

---

# 48. Critério de Sucesso

O sistema de HITL será considerado correto quando impedir que o Orçamentista IA entregue orçamento definitivo com:

```text
escopo principal indefinido
quantidade relevante sem origem
custo relevante sem fonte
fornecimento indefinido
risco técnico não tratado
PPCI crítico pendente
risco estrutural pendente
margem/preço não validado
premissas comerciais ausentes
exclusões comerciais ausentes
```

---

# 49. Frase Canônica Final

O HITL do Orçamentista IA EVIS é o mecanismo que transforma inteligência artificial em decisão técnica controlada: a IA pode ler, inferir, sugerir, calcular e auditar, mas toda incerteza relevante, risco técnico, impacto financeiro ou decisão comercial crítica deve passar pela validação humana antes de se tornar parte definitiva do orçamento.

A IA propõe.

O usuário valida.

O sistema consolida.
