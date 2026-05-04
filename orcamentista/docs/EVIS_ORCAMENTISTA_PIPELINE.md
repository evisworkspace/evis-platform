# EVIS — ORÇAMENTISTA IA

## Pipeline Operacional — Especificação Técnica

**Status:** Documento técnico complementar  
**Módulo:** Orçamentista IA  
**Área:** Pré-obra / Oportunidade / Proposta  
**Arquivo sugerido:** `orcamentista/docs/EVIS_ORCAMENTISTA_PIPELINE.md`  
**Dependências:**  
- `EVIS_ORCAMENTISTA_IA_CANONICAL.md`  
- `EVIS_ORCAMENTISTA_DOMAIN_AGENTS.md`  

---

# 1. Objetivo deste Documento

Este documento define o **pipeline operacional do Orçamentista IA EVIS**, descrevendo como a IA deve processar uma oportunidade desde o recebimento dos arquivos até a consolidação do orçamento e preparação da proposta.

O objetivo é impedir que o Orçamentista funcione como um chat solto.

O Orçamentista IA deve funcionar como um **fluxo técnico estruturado por etapas**, com agentes especializados, validação humana e rastreabilidade das informações.

---

# 2. Definição do Pipeline

O pipeline do Orçamentista IA é a sequência obrigatória de processamento técnico-comercial aplicada a uma oportunidade antes da proposta.

Ele transforma:

```text
Arquivos brutos + informações comerciais
→ leitura técnica
→ escopo estruturado
→ serviços orçamentáveis
→ quantitativos
→ custos
→ auditoria
→ validações HITL
→ cronograma inicial
→ base de proposta
```

---

# 3. Posição do Pipeline no Fluxo EVIS

O pipeline pertence exclusivamente à fase de **Oportunidade / Pré-obra**.

## Fluxo oficial

```text
Lead / Oportunidade
→ Orçamentista IA
→ Proposta
→ Conversão em Obra
→ Diário de Obra IA
→ Execução / Medições / Relatórios
```

## Regra crítica

O pipeline do Orçamentista IA não pode gravar execução real de obra.

Ele prepara a obra para ser contratada.

---

# 4. Estrutura Geral do Pipeline

O pipeline oficial do Orçamentista IA é:

```text
0. Criação do Lote de Orçamento
1. Input Handler
2. Reader Multimodal
3. Classificador de Documentos
4. Planner Técnico
5. Agentes de Domínio
6. Agente Quantitativo
7. Agente de Custos
8. Agente BDI / Encargos / Margem
9. Auditor Técnico-Orçamentário
10. HITL Review
11. Cronograma Inicial
12. Gerador de Proposta
13. Consolidação
14. Preparação para Conversão em Obra
```

---

# 5. Estado Inicial — Criação do Lote de Orçamento

## Função

Criar uma unidade de trabalho dentro da oportunidade.

Esse lote representa uma tentativa ou versão de orçamento.

## Quando ocorre

Sempre que o usuário inicia um novo orçamento dentro de uma oportunidade.

## Dados mínimos

```text
orcamento_id
oportunidade_id
nome_orcamento
versao
status
data_criacao
responsavel
observacoes
```

## Status inicial

```text
rascunho
```

## Regra

Toda análise do Orçamentista IA deve estar vinculada a um `orcamento_id`.

Nenhuma análise deve existir solta.

---

# 6. Etapa 1 — Input Handler

## Função

Receber, organizar e preparar os arquivos e dados enviados pelo usuário.

## Entradas

* PDFs;
* imagens;
* prints;
* planilhas;
* textos;
* observações comerciais;
* orçamento de terceiros;
* memoriais;
* fotos do local.

## Processamento

O Input Handler deve:

* registrar os arquivos recebidos;
* preservar nome original;
* identificar extensão;
* associar à oportunidade;
* associar ao orçamento;
* criar lote de análise;
* separar arquivos técnicos de arquivos comerciais;
* marcar arquivos não processáveis;
* registrar data de envio.

## Saída

```text
Arquivo:
- arquivo_id
- orcamento_id
- nome_original
- tipo
- tamanho
- origem
- status_upload
- status_leitura
- observacoes
```

## Status possíveis do arquivo

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

## Restrições

O Input Handler não interpreta engenharia.

Ele apenas organiza a entrada.

---

# 7. Etapa 2 — Reader Multimodal

## Função

Ler o conteúdo dos arquivos recebidos.

## Entradas

* arquivos organizados pelo Input Handler;
* textos associados;
* imagens;
* PDFs;
* planilhas.

## Processamento

O Reader deve:

* extrair texto;
* identificar títulos de pranchas;
* identificar notas;
* identificar legendas;
* identificar tabelas;
* identificar cotas;
* identificar escalas;
* identificar ambientes;
* descrever elementos visuais;
* apontar trechos ilegíveis;
* apontar leitura parcial;
* preservar referência de origem.

## Saída

```text
Leitura Técnica:
- arquivo_id
- páginas_lidas
- textos_extraidos
- ambientes_detectados
- tabelas_detectadas
- legendas_detectadas
- notas_detectadas
- elementos_visuais
- pontos_ilegiveis
- confianca_leitura
```

## Níveis de confiança de leitura

```text
alta
media
baixa
```

## Regra

Se a leitura for insuficiente, o sistema deve prosseguir apenas como análise preliminar e registrar pendência.

---

# 8. Etapa 3 — Classificador de Documentos

## Função

Classificar cada arquivo ou prancha conforme disciplina técnica.

## Entradas

* saída do Reader Multimodal;
* nomes dos arquivos;
* títulos das pranchas;
* legendas;
* conteúdo textual extraído.

## Classificações possíveis

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

## Saída

```text
Classificação:
- arquivo_id
- disciplina_detectada
- subtipo
- confiança
- justificativa
- agentes_recomendados
```

## Regra de acionamento

O Classificador deve indicar quais agentes devem ser acionados.

Exemplo:

```text
Arquivo: ARQ_FORRO_REV02.pdf
Disciplina: arquitetura / forro
Agentes recomendados:
- Civil / Arquitetônico
- Climatização, se houver grelhas/dutos
- PPCI, se houver sprinklers
- Compatibilização Técnica
```

---

# 9. Etapa 4 — Planner Técnico

## Função

Transformar a leitura inicial em uma estrutura lógica de orçamento.

## Entradas

* leitura técnica;
* classificação dos documentos;
* dados comerciais da oportunidade;
* observações do usuário.

## Processamento

O Planner deve:

* organizar ambientes;
* organizar disciplinas;
* criar árvore preliminar de escopo;
* identificar macroetapas;
* separar execução, fornecimento, instalação, documentação e gestão;
* identificar disciplinas ausentes;
* preparar pacotes para agentes de domínio.

## Estrutura lógica mínima

```text
Oportunidade
→ Orçamento
→ Ambientes
→ Disciplinas
→ Categorias
→ Serviços candidatos
```

## Saída

```text
Plano Técnico Inicial:
- ambientes
- disciplinas_detectadas
- disciplinas_ausentes
- macroetapas
- serviços_candidatos
- agentes_a_acionar
- riscos_iniciais
- pendencias_iniciais
```

## Restrição

O Planner não deve calcular custo.

Ele estrutura o caminho.

---

# 10. Etapa 5 — Agentes de Domínio

## Função

Interpretar tecnicamente cada disciplina e transformar a leitura em serviços orçamentáveis.

## Entradas

* Plano Técnico Inicial;
* documentos classificados;
* informações extraídas pelo Reader;
* contexto comercial.

## Agentes possíveis

```text
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
```

## Saída obrigatória de cada agente

```text
1. Itens identificados diretamente
2. Itens inferidos tecnicamente
3. Itens ausentes ou ambíguos
4. Serviços orçamentáveis gerados
5. Quantitativos possíveis
6. Interferências com outras disciplinas
7. Riscos técnicos
8. Riscos financeiros
9. Validações HITL necessárias
10. Grau de confiança
```

## Regra

Os agentes não devem precificar definitivamente.

Eles preparam escopo técnico para o Agente Quantitativo e o Agente de Custos.

---

# 11. Etapa 6 — Agente Quantitativo

## Função

Transformar serviços orçamentáveis em quantidades mensuráveis.

## Entradas

* serviços gerados pelos agentes de domínio;
* ambientes;
* áreas;
* medidas;
* cotas;
* tabelas;
* inferências técnicas;
* validações existentes.

## Tipos de quantidade

```text
medida
calculada
estimada
verba
pendente
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

## Processamento

O Agente Quantitativo deve:

* calcular áreas;
* calcular perímetros;
* calcular volumes;
* contar pontos;
* contar peças;
* aplicar perdas quando autorizado;
* separar quantidade medida de quantidade estimada;
* registrar origem da quantidade;
* marcar confiança;
* criar HITL quando necessário.

## Saída

```text
Quantitativo:
- servico_id
- ambiente_id
- quantidade
- unidade
- tipo_quantitativo
- origem
- confianca
- hitl_required
- observacoes
```

## Regra crítica

Nenhuma quantidade pode ser definitiva sem origem.

---

# 12. Etapa 7 — Agente de Custos

## Função

Aplicar custos aos serviços estruturados e quantificados.

## Entradas

* serviços;
* quantitativos;
* base própria;
* SINAPI, quando disponível;
* histórico;
* fornecedores;
* valores manuais informados pelo usuário.

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

## Processamento

O Agente de Custos deve:

* localizar referência de custo;
* aplicar custo unitário;
* calcular custo total;
* separar material e mão de obra quando houver base;
* marcar fonte;
* marcar confiança;
* criar pendência quando não houver referência;
* permitir override humano.

## Saída

```text
Custo:
- servico_id
- unidade
- quantidade
- custo_unitario
- custo_total
- fonte
- tipo_custo
- confianca
- observacoes
- hitl_required
```

## Regra

Custo estimado deve ser explicitamente marcado.

---

# 13. Etapa 8 — Agente BDI / Encargos / Margem

## Função

Transformar custo direto em preço de venda.

## Entradas

* custos diretos;
* estratégia comercial;
* margem desejada;
* impostos;
* administração;
* riscos;
* tipo de obra;
* urgência;
* condição de execução.

## Componentes possíveis

```text
custo_direto
mao_de_obra
material
equipamentos
ferramentas
deslocamento
estacionamento
descarte
administracao
risco
impostos
margem
bdi
taxa_urgencia
taxa_obra_noturna
taxa_shopping_condominio
```

## Processamento

O agente deve:

* separar custo e preço;
* aplicar margem;
* aplicar BDI;
* aplicar administração;
* aplicar risco;
* simular cenários;
* permitir ajustes humanos;
* registrar premissas comerciais.

## Saída

```text
Preço:
- custo_direto_total
- administracao
- impostos
- risco
- margem
- bdi
- preco_final
- premissas
- hitl_required
```

## Regra

A aplicação de margem, BDI e risco deve ser explícita e ajustável.

---

# 14. Etapa 9 — Auditor Técnico-Orçamentário

## Função

Auditar a coerência do orçamento antes da validação e consolidação.

## Entradas

* serviços;
* quantitativos;
* custos;
* riscos;
* conflitos;
* pendências;
* validações abertas.

## Verificações obrigatórias

```text
serviços sem unidade
serviços sem quantidade
serviços sem custo
serviços duplicados
serviços sem origem
quantidades incompatíveis
custos sem referência
itens com baixa confiança
itens críticos sem HITL
conflitos entre disciplinas
escopo sem premissa
escopo sem exclusão necessária
risco técnico não tratado
risco financeiro não tratado
```

## Níveis de gravidade

```text
baixa
media
alta
critica
```

## Saída

```text
Auditoria:
- item
- problema
- gravidade
- impacto
- ação_recomendada
- hitl_required
```

## Regra crítica

Itens com gravidade crítica bloqueiam a consolidação.

---

# 15. Etapa 10 — HITL Review

## Função

Apresentar ao usuário tudo que precisa de validação humana antes da consolidação.

## Entradas

* validações geradas pelos agentes;
* pendências;
* conflitos;
* itens de baixa confiança;
* riscos técnicos;
* riscos financeiros;
* auditoria.

## Tipos de validação

```text
confirmar
corrigir
remover
manter_como_verba
solicitar_mais_informacoes
marcar_fora_do_escopo
```

## Formato obrigatório

```text
Validação HITL:
- item
- tipo_item
- disciplina
- motivo
- impacto_tecnico
- impacto_financeiro
- opções
- status
```

## Decisões possíveis do usuário

```text
aprovado
corrigido
rejeitado
verba
fora_do_escopo
pendente
```

## Regra

Sem HITL resolvido, o orçamento pode permanecer como preliminar, mas não pode ser consolidado como definitivo.

---

# 16. Etapa 11 — Cronograma Inicial

## Função

Gerar cronograma preliminar baseado no escopo orçamentário validado ou parcialmente validado.

## Entradas

* serviços;
* categorias;
* equipes previstas;
* dependências;
* macroetapas;
* complexidade;
* restrições comerciais;
* restrições operacionais.

## Macroetapas típicas

```text
1. Mobilização
2. Proteções
3. Demolições / Remoções
4. Infraestrutura
5. Fechamentos
6. Impermeabilização
7. Revestimentos / Acabamentos
8. Instalações finais
9. Testes
10. Limpeza
11. Entrega
```

## Saída

```text
Cronograma:
- etapa
- servico_id
- categoria
- equipe_prevista
- duracao_estimada
- dependencia
- ordem_logica
- observacoes
```

## Regra

O cronograma gerado pelo Orçamentista é preliminar.

Ele só se torna base operacional após proposta aprovada e conversão em obra.

---

# 17. Etapa 12 — Gerador de Proposta

## Função

Transformar o orçamento validado em base de proposta comercial.

## Entradas

* orçamento;
* escopo validado;
* custos;
* preço final;
* cronograma;
* premissas;
* exclusões;
* riscos que podem ser comunicados;
* observações comerciais.

## Saída

```text
Base de Proposta:
- resumo_executivo
- escopo_incluso
- escopo_excluido
- premissas
- prazo_estimado
- condições_comerciais
- validade
- observações_técnicas
- observações_internas
```

## Regra

A proposta deve proteger comercialmente a empresa.

Deve explicitar premissas e exclusões.

---

# 18. Etapa 13 — Consolidação

## Função

Gerar a versão consolidada do orçamento.

## Condições para consolidação definitiva

```text
[ ] Itens críticos validados
[ ] Custos principais definidos
[ ] Quantitativos principais com origem
[ ] Riscos críticos tratados
[ ] Escopo incluso definido
[ ] Escopo excluído definido
[ ] Premissas registradas
[ ] Auditoria sem bloqueios críticos
```

## Status possíveis do orçamento

```text
rascunho
em_analise
aguardando_hitl
preliminar
validado
consolidado
proposta_gerada
enviado
aprovado
rejeitado
substituido
cancelado
```

Observação: caso o código utilize `hitl`, manter o termo técnico `hitl`. Se houver erro de digitação em implementação como `hilt`, corrigir para `hitl`.

## Saída

```text
Orçamento Consolidado:
- versão
- serviços
- quantitativos
- custos
- preço final
- cronograma inicial
- escopo incluso
- escopo excluído
- premissas
- pendências remanescentes
- riscos aceitos
```

---

# 19. Etapa 14 — Preparação para Conversão em Obra

## Função

Preparar os dados que poderão migrar para a obra após aprovação da proposta.

## Dados migráveis

```text
serviços validados
categorias
ambientes
equipes previstas
cronograma inicial
valores contratados
escopo aprovado
premissas
exclusões
anexos
observações técnicas
```

## Dados que não devem migrar como definitivos

```text
inferências não validadas
verbas abertas
itens pendentes
custos de baixa confiança
cronograma sem aprovação
riscos não tratados
```

## Regra crítica

A conversão em obra deve acontecer apenas após proposta aprovada.

Antes disso, tudo permanece no domínio da oportunidade.

---

# 20. Estados Gerais do Pipeline

## Estados possíveis

```text
idle
recebendo_arquivos
arquivos_recebidos
em_leitura
leitura_concluida
classificando_documentos
planejando_escopo
acionando_agentes
quantificando
precificando
aplicando_bdi
auditando
aguardando_hitl
gerando_cronograma
gerando_proposta
consolidado
erro
cancelado
```

## Uso

Esses estados podem alimentar a interface do usuário, indicando em que fase o orçamento está.

---

# 21. Transições Permitidas

## Fluxo normal

```text
idle
→ recebendo_arquivos
→ arquivos_recebidos
→ em_leitura
→ leitura_concluida
→ classificando_documentos
→ planejando_escopo
→ acionando_agentes
→ quantificando
→ precificando
→ aplicando_bdi
→ auditando
→ aguardando_hitl
→ gerando_cronograma
→ gerando_proposta
→ consolidado
```

## Fluxo com pendência

```text
auditando
→ aguardando_hitl
→ planejando_escopo
→ quantificando
→ precificando
→ auditando
```

## Fluxo com novo arquivo

```text
consolidado
→ recebendo_arquivos
→ em_leitura
→ classificando_documentos
→ planejando_escopo
→ nova_versao
```

---

# 22. Versionamento do Orçamento

## Regra

Toda alteração relevante deve gerar versão.

## Eventos que geram nova versão

```text
novo arquivo recebido
correção de escopo
alteração de quantidade
alteração de custo
alteração de margem
alteração de premissa
mudança em escopo incluso
mudança em escopo excluído
nova validação HITL
proposta revisada
```

## Status de versão

```text
rascunho
em_validacao
validada
enviada
substituida
cancelada
```

---

# 23. Rastreabilidade

Cada item gerado pelo pipeline deve guardar origem.

## Campos recomendados

```text
origin_type
origin_file_id
origin_page
origin_reference
origin_text
origin_agent
created_by
created_at
confidence
hitl_required
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
```

---

# 24. Tratamento de Incertezas

## Regra

Incerteza não bloqueia necessariamente o avanço preliminar, mas bloqueia consolidação definitiva quando tiver impacto relevante.

## Classificação

```text
baixa_incerteza
media_incerteza
alta_incerteza
bloqueante
```

## Exemplo

```text
Item: fornecimento de luminárias
Incerteza: alta
Motivo: projeto luminotécnico indica pontos, mas não especifica fornecedor nem modelo
Impacto: pode alterar custo final
HITL: obrigatório
```

---

# 25. Tratamento de Documentos Incompletos

## Status de completude

```text
completo
parcial
insuficiente
ilegivel
contraditorio
```

## Comportamento

Se o conjunto documental for parcial, o pipeline pode continuar como orçamento preliminar.

Exemplo:

```text
O orçamento pode avançar como preliminar.
Não pode ser consolidado como definitivo porque não foram identificados:
- projeto elétrico executivo;
- memorial de acabamentos;
- definição de fornecimento de luminárias;
- detalhamento hidráulico.
```

---

# 26. Tratamento de Comparativo de Propostas

## Quando acionar

Quando o usuário enviar orçamento de concorrente, orçamento antigo ou planilha externa para comparação.

## Fluxo

```text
Receber orçamento terceiro
→ classificar como orçamento_terceiro
→ acionar Agente Comparativo de Propostas
→ cruzar com escopo EVIS
→ identificar diferenças
→ gerar argumentos comerciais
```

## Saída

```text
Comparativo:
- item
- valor_evis
- valor_terceiro
- diferença
- possível_motivo
- risco
- argumento_comercial
```

---

# 27. Tratamento de Escopo Incluso e Excluído

## Escopo Incluso

Itens considerados no orçamento.

## Escopo Excluído

Itens identificados ou possíveis, mas não considerados no preço.

## Regra

Todo item relevante excluído deve aparecer como proteção comercial.

Exemplo:

```text
Escopo excluído:
- fornecimento de luminárias;
- fornecimento de porcelanato;
- equipamentos de ar-condicionado;
- taxas de condomínio;
- projetos complementares não enviados;
- adequações estruturais não identificadas.
```

---

# 28. Premissas do Pipeline

O pipeline deve gerar premissas automaticamente com base nos dados disponíveis.

## Premissas típicas

```text
- Orçamento baseado nos arquivos recebidos até a data da análise.
- Alterações de projeto podem gerar revisão de valores.
- Serviços não listados não estão inclusos.
- Itens sem detalhamento foram tratados como verba ou pendência.
- Materiais de acabamento considerados conforme memorial recebido.
- Execução considerada em horário comercial, salvo validação contrária.
- Taxas de condomínio/shopping não inclusas, salvo indicação expressa.
- Fornecimentos não especificados precisam de validação.
```

---

# 29. Bloqueios de Consolidação

O pipeline deve bloquear consolidação definitiva quando houver:

```text
risco estrutural não validado
PPCI crítico sem validação
quantidade relevante sem origem
custo relevante sem referência
documento essencial ausente
conflito técnico crítico
escopo principal indefinido
fornecimento principal indefinido
margem/preço não validado
auditoria crítica aberta
```

---

# 30. Saídas Visuais Esperadas na Interface

A interface do Orçamentista deve permitir visualizar:

```text
Resumo da oportunidade
Arquivos recebidos
Status de leitura
Disciplinas identificadas
Etapa atual do pipeline
Agentes acionados
Itens identificados
Itens inferidos
Itens pendentes
Serviços orçamentáveis
Quantitativos
Custos
BDI / margem
Riscos
Validações HITL
Cronograma inicial
Base de proposta
Histórico de versões
```

---

# 31. Ações do Usuário na Interface

O usuário deve conseguir:

```text
anexar arquivos
remover arquivos
executar análise inicial
reexecutar etapa
validar item
corrigir item
rejeitar item
marcar item como verba
marcar item fora do escopo
alterar quantidade
alterar custo
alterar margem
aprovar versão
gerar proposta
converter proposta aprovada em obra
```

---

# 32. Ações Proibidas no Pipeline

O pipeline do Orçamentista não deve permitir:

```text
atualizar avanço físico
criar medição de obra executada
registrar diário de obra
alimentar relatório semanal de execução
criar pagamento de equipe de obra ativa
alterar produtividade real
marcar serviço como executado
gerar foto executiva
salvar entrada em diário operacional
```

---

# 33. Checklist Técnico de Implementação

O pipeline estará minimamente implementado quando existir:

```text
[ ] Criação de orçamento dentro da oportunidade
[ ] Upload/listagem de arquivos vinculados ao orçamento
[ ] Classificação de documentos
[ ] Execução de Etapa 0
[ ] Estado atual do pipeline
[ ] Registro de agentes acionados
[ ] Estrutura de serviços candidatos
[ ] Estrutura de quantitativos
[ ] Estrutura de custos
[ ] Registro de confiança
[ ] Registro de origem
[ ] Registro de HITL
[ ] Auditoria de bloqueios
[ ] Cronograma inicial
[ ] Base de proposta
[ ] Versionamento
[ ] Separação total de Obra/Diário
```

---

# 34. Checklist de Validação Funcional

Um teste funcional básico deve conseguir executar o seguinte cenário:

```text
1. Criar oportunidade.
2. Criar orçamento dentro da oportunidade.
3. Anexar PDF arquitetônico.
4. Rodar análise inicial.
5. Classificar documento como arquitetura/layout.
6. Acionar Agente Civil / Arquitetônico.
7. Gerar serviços candidatos.
8. Marcar itens inferidos.
9. Gerar validação HITL.
10. Aprovar ou corrigir item.
11. Gerar quantitativo preliminar.
12. Aplicar custo manual ou base própria.
13. Rodar auditoria.
14. Gerar cronograma inicial.
15. Gerar base de proposta.
16. Confirmar que nada foi gravado como execução de obra.
```

---

# 35. Critérios de Sucesso

O pipeline será considerado correto quando:

```text
[ ] Respeitar a ordem Lead/Oportunidade → Orçamentista → Proposta → Obra
[ ] Não misturar pré-obra com execução
[ ] Trabalhar por etapas
[ ] Separar identificado, inferido e pendente
[ ] Acionar agentes de domínio corretamente
[ ] Gerar serviços orçamentáveis auditáveis
[ ] Gerar quantitativos com origem
[ ] Gerar custos com fonte
[ ] Exigir HITL para incertezas relevantes
[ ] Auditar conflitos e riscos
[ ] Gerar proposta a partir de orçamento validado
[ ] Preparar dados para conversão em obra somente após aprovação
```

---

# 36. Frase Canônica Final

O Pipeline Operacional do Orçamentista IA EVIS é a sequência técnica obrigatória que transforma uma oportunidade com arquivos brutos em um orçamento estruturado, auditável, validado e pronto para proposta, mantendo rastreabilidade, controle de incertezas, validação humana e separação absoluta entre pré-obra e execução.

Ele não executa obra.

Ele estrutura a decisão técnica e comercial antes da contratação.
