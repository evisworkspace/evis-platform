# EVIS — ORÇAMENTISTA IA

## Agentes de Domínio — Especificação Técnica

**Status:** Documento técnico complementar aprovado  
**Módulo:** Orçamentista IA  
**Área:** Pré-obra / Oportunidade / Proposta  
**Arquivo sugerido:** `orcamentista/docs/EVIS_ORCAMENTISTA_DOMAIN_AGENTS.md`  
**Dependência:** `EVIS_ORCAMENTISTA_IA_CANONICAL.md`  

---

# 1. Objetivo deste Documento

Este documento define a função, escopo, comportamento e entregáveis dos **Agentes de Domínio** do Orçamentista IA EVIS.

Os Agentes de Domínio são responsáveis por interpretar tecnicamente projetos, memoriais, imagens, tabelas, detalhes construtivos e informações comerciais, convertendo essas informações em **serviços orçamentáveis auditáveis**.

Eles não são agentes genéricos.

Eles representam especialidades técnicas de leitura, interpretação e decomposição de escopo de engenharia, arquitetura, instalações e execução de obra.

---

# 2. Definição dos Agentes de Domínio

Os Agentes de Domínio são especialistas técnicos acionados pelo Orçamentista IA após a etapa de leitura, classificação e planejamento inicial.

Eles recebem informações estruturadas pelo Reader, Classificador de Documentos e Planner Técnico, e devolvem análises específicas por disciplina.

## Frase canônica

Os agentes de domínio do Orçamentista IA não são apenas classificadores de categoria. Eles são especialistas técnicos de leitura e interpretação de projetos de engenharia, arquitetura e disciplinas complementares, responsáveis por converter documentos técnicos em escopo orçamentável auditável.

---

# 3. Posição no Pipeline do Orçamentista IA

Os Agentes de Domínio atuam depois da leitura e antes dos quantitativos finais.

## Fluxo

```text
Input Handler
→ Reader Multimodal
→ Classificador de Documentos
→ Planner Técnico
→ Agentes de Domínio
→ Agente Quantitativo
→ Agente de Custos
→ Auditor Técnico-Orçamentário
→ HITL Review
→ Consolidação
```

## Função dentro do pipeline

Os Agentes de Domínio transformam:

```text
Informação técnica lida
→ Interpretação especializada
→ Serviços executáveis
→ Pendências técnicas
→ Riscos
→ Quantitativos possíveis
→ Validações HITL
```

---

# 4. Regra de Acionamento dos Agentes

Os Agentes de Domínio não devem ser acionados indiscriminadamente.

Eles devem ser acionados conforme os documentos, disciplinas e elementos identificados na oportunidade.

## Regra

O Classificador de Documentos e o Planner Técnico devem indicar quais agentes precisam ser chamados.

## Exemplo correto

Se os arquivos recebidos contêm:

* planta arquitetônica;
* layout;
* memorial de acabamentos;
* planta elétrica;

devem ser acionados:

* Agente Civil / Arquitetônico;
* Agente Acabamentos;
* Agente Elétrica / Dados / Automação;
* Agente Compatibilização Técnica.

## Exemplo incorreto

Se não há projeto hidráulico, o Agente Hidrossanitário não deve criar escopo hidráulico como se houvesse projeto.

Ele pode apenas registrar:

```text
Projeto hidrossanitário não identificado nos arquivos recebidos.
Nenhum quantitativo hidráulico definitivo pode ser extraído.
Caso existam alterações de pontos hidráulicos, é necessária validação HITL.
```

---

# 5. Regra Geral de Saída de Todos os Agentes

Todos os Agentes de Domínio devem devolver sua análise seguindo obrigatoriamente esta estrutura:

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

---

# 6. Classificação da Informação

Cada informação extraída ou gerada por um agente deve ser classificada.

## 6.1 Identificado Diretamente

Informação presente de forma clara em:

* planta;
* corte;
* elevação;
* memorial;
* tabela;
* legenda;
* cota;
* detalhe;
* texto do usuário;
* documento comercial.

Exemplo:

```text
Item: Forro em drywall no Salão Principal
Status: identificado diretamente
Origem: Planta de forro
Confiança: alta
```

---

## 6.2 Inferido Tecnicamente

Informação não declarada explicitamente, mas tecnicamente provável com base no conjunto de documentos.

Exemplo:

```text
Item: Infraestrutura elétrica complementar para novos pontos de iluminação
Status: inferido tecnicamente
Motivo: layout luminotécnico indica novos pontos, mas não há detalhamento executivo de circuitos
Confiança: média
HITL: obrigatório
```

---

## 6.3 Ausente ou Ambíguo

Informação necessária para orçamento, mas não encontrada ou ilegível.

Exemplo:

```text
Item: Especificação das luminárias
Status: ausente
Impacto: impede precificação de fornecimento
Ação: validar se luminárias serão fornecidas pelo cliente ou pela construtora
```

---

# 7. Níveis de Confiança

Todo item deve receber um nível de confiança.

```text
ALTO
Informação clara em projeto, memorial, tabela ou dado validado pelo usuário.

MÉDIO
Informação inferida com base técnica razoável, mas dependente de confirmação.

BAIXO
Informação incerta, incompleta, ilegível, contraditória ou sem base documental suficiente.
```

---

# 8. Regra de HITL dos Agentes

Qualquer agente deve solicitar validação HITL quando houver:

* inferência relevante;
* impacto financeiro;
* risco técnico;
* risco contratual;
* risco de responsabilidade técnica;
* documento ausente;
* conflito entre disciplinas;
* quantidade estimada;
* fornecimento indefinido;
* escopo ambíguo;
* custo relevante sem referência;
* dependência de aprovação externa.

## Formato obrigatório

```text
Validação HITL:
- Item:
- Disciplina:
- Motivo:
- Impacto técnico:
- Impacto financeiro:
- Opções:
  A) Confirmar
  B) Corrigir
  C) Remover
  D) Manter como verba
  E) Solicitar mais informações
```

---

# 9. Agente Civil / Arquitetônico

## 9.1 Função

Interpretar projetos arquitetônicos, plantas de reforma, demolição, construção, layout, forro, paginação e elementos civis básicos, convertendo-os em serviços orçamentáveis.

---

## 9.2 Documentos que interpreta

* planta baixa;
* planta de layout;
* planta de demolição;
* planta de construção;
* planta de forro;
* planta de piso;
* planta de revestimentos;
* cortes;
* elevações;
* detalhes arquitetônicos;
* quadro de áreas;
* memorial descritivo;
* memorial de acabamentos;
* imagens do local;
* fotos de situação existente.

---

## 9.3 Elementos que deve identificar

* ambientes;
* áreas;
* perímetros;
* paredes existentes;
* paredes novas;
* paredes a demolir;
* vãos;
* portas;
* janelas;
* forros;
* sancas;
* tabicas;
* pisos;
* revestimentos;
* pintura;
* bancadas;
* shafts;
* divisórias;
* proteções;
* isolamentos;
* acessos;
* áreas em funcionamento;
* restrições de execução.

---

## 9.4 Serviços orçamentáveis possíveis

* mobilização;
* desmobilização;
* proteção de piso;
* proteção de mobiliário;
* isolamento de área;
* tapume;
* demolição de parede;
* demolição de piso;
* remoção de revestimento;
* remoção de forro;
* remoção de portas;
* remoção de esquadrias;
* descarte de entulho;
* carga e transporte interno;
* execução de alvenaria;
* execução de drywall;
* fechamento de vãos;
* execução de shaft;
* regularização de parede;
* regularização de piso;
* contrapiso;
* emboço;
* reboco;
* massa corrida;
* pintura;
* forro de drywall;
* sancas;
* tabicas;
* assentamento de piso;
* assentamento de revestimento;
* rejuntamento;
* rodapé;
* soleira;
* peitoril;
* limpeza grossa;
* limpeza fina;
* limpeza técnica de entrega.

---

## 9.5 Quantitativos possíveis

```text
m²:
- piso
- revestimento
- pintura
- forro
- parede
- drywall
- proteção

ml:
- rodapé
- soleira
- tabica
- junta
- perímetro de acabamento

unidade:
- portas
- vãos
- pontos de intervenção
- ambientes
```

---

## 9.6 Interferências que deve observar

* elétrica embutida em parede ou forro;
* hidráulica embutida em parede ou piso;
* climatização acima do forro;
* PPCI no forro;
* estrutura existente;
* impermeabilização em áreas molhadas;
* marcenaria apoiada em paredes;
* paginação de revestimentos;
* rotas de fuga;
* execução em ambiente em funcionamento.

---

## 9.7 Riscos técnicos

* projeto arquitetônico incompleto;
* ausência de cortes;
* ausência de cotas;
* demolição sem validação estrutural;
* incompatibilidade entre planta e memorial;
* áreas sem especificação de acabamento;
* execução em área ocupada;
* necessidade de proteção não prevista.

---

## 9.8 HITL típico

```text
- Confirmar se demolição está inclusa.
- Confirmar se descarte está incluso.
- Confirmar se materiais de acabamento serão fornecidos pelo cliente.
- Confirmar se execução será em horário comercial ou noturno.
- Confirmar se áreas estimadas estão corretas.
- Confirmar se proteções devem entrar como item separado.
```

---

# 10. Agente Estrutural

## 10.1 Função

Interpretar elementos estruturais e identificar escopos, riscos e validações ligados a fundações, pilares, vigas, lajes, reforços e intervenções com responsabilidade técnica.

---

## 10.2 Documentos que interpreta

* projeto estrutural;
* planta de forma;
* planta de armação;
* detalhes de reforço;
* laudos;
* memoriais estruturais;
* cortes estruturais;
* detalhes de fundação;
* detalhes metálicos;
* relatórios técnicos;
* fotos de elementos estruturais existentes.

---

## 10.3 Elementos que deve identificar

* fundações;
* sapatas;
* blocos;
* estacas;
* baldrames;
* pilares;
* vigas;
* lajes;
* vergas;
* contravergas;
* reforços;
* aberturas em estrutura;
* cortes em laje;
* furos em viga;
* bases para equipamentos;
* estrutura metálica;
* estrutura de madeira;
* elementos de contenção;
* riscos de interferência.

---

## 10.4 Serviços orçamentáveis possíveis

* execução de fundação;
* execução de base estrutural;
* reforço estrutural;
* estrutura metálica auxiliar;
* chumbadores;
* grauteamento;
* corte técnico;
* furação técnica;
* recuperação estrutural;
* recomposição;
* escoramento;
* laudo técnico;
* ART/RRT estrutural;
* acompanhamento técnico especializado.

---

## 10.5 Quantitativos possíveis

```text
m³:
- concreto
- escavação
- graute

kg:
- aço
- estrutura metálica

unidade:
- chumbadores
- bases
- pilares
- reforços
- pontos de intervenção

ml:
- vigas
- perfis metálicos
```

---

## 10.6 Interferências que deve observar

* demolições civis;
* furações para climatização;
* passagem de hidráulica;
* passagem de elétrica;
* cargas de equipamentos;
* bases para condensadoras;
* aberturas em laje;
* elementos existentes não documentados.

---

## 10.7 Riscos técnicos

* intervenção estrutural sem projeto;
* demolição em parede estrutural;
* furo indevido em viga ou laje;
* carga não verificada;
* ausência de laudo;
* ausência de ART/RRT;
* incompatibilidade entre arquitetura e estrutura.

---

## 10.8 Regra crítica

Qualquer risco estrutural deve bloquear a consolidação definitiva do orçamento até validação técnica.

## 10.9 HITL típico

```text
- Confirmar se existe projeto estrutural.
- Confirmar se haverá intervenção em estrutura.
- Confirmar se há responsável técnico.
- Confirmar necessidade de laudo ou ART/RRT.
- Confirmar se bases de equipamentos estão inclusas.
```

---

# 11. Agente Elétrica / Dados / Automação

## 11.1 Função

Interpretar projetos elétricos, luminotécnicos, rede, dados, automação, som, CFTV e infraestrutura seca, convertendo pontos e sistemas em serviços orçamentáveis.

---

## 11.2 Documentos que interpreta

* planta elétrica;
* planta luminotécnica;
* quadro de cargas;
* diagrama unifilar;
* memorial elétrico;
* projeto de automação;
* projeto de dados;
* projeto de CFTV;
* projeto de som;
* planta de infraestrutura;
* layout com pontos aparentes;
* lista de luminárias;
* especificação de equipamentos.

---

## 11.3 Elementos que deve identificar

* tomadas;
* interruptores;
* pontos de iluminação;
* luminárias;
* fitas LED;
* drivers;
* fontes;
* sensores;
* quadros;
* disjuntores;
* circuitos;
* cargas;
* eletrodutos;
* eletrocalhas;
* perfilados;
* caixas;
* cabeamento;
* pontos de rede;
* pontos de CFTV;
* pontos de som;
* pontos de automação;
* comandos;
* infraestrutura aparente;
* infraestrutura embutida.

---

## 11.4 Serviços orçamentáveis possíveis

* infraestrutura elétrica embutida;
* infraestrutura elétrica aparente;
* instalação de eletrodutos;
* instalação de caixas;
* instalação de eletrocalhas;
* instalação de perfilados;
* passagem de cabos;
* montagem de quadro;
* instalação de disjuntores;
* identificação de circuitos;
* instalação de tomadas;
* instalação de interruptores;
* instalação de luminárias;
* instalação de fita LED;
* instalação de drivers e fontes;
* infraestrutura de rede;
* infraestrutura de CFTV;
* infraestrutura de som;
* automação;
* testes elétricos;
* adequação de carga;
* emissão de relatório técnico quando aplicável.

---

## 11.5 Quantitativos possíveis

```text
ponto:
- tomadas
- interruptores
- luminárias
- rede
- CFTV
- som
- automação

ml:
- eletroduto
- cabo
- eletrocalha
- perfilado
- fita LED

unidade:
- luminária
- disjuntor
- quadro
- fonte
- driver
- sensor
```

---

## 11.6 Interferências que deve observar

* forro;
* drywall;
* marcenaria;
* bancadas;
* hidráulica;
* climatização;
* PPCI;
* layout de mobiliário;
* capacidade do quadro existente;
* desligamentos necessários;
* normas de condomínio ou shopping.

---

## 11.7 Riscos técnicos

* ausência de quadro de cargas;
* ausência de diagrama;
* luminárias sem especificação;
* quadro existente insuficiente;
* circuitos não definidos;
* automação indefinida;
* fornecimento de luminárias não definido;
* conflito entre luminárias e sprinklers;
* pontos em marcenaria sem detalhamento.

---

## 11.8 HITL típico

```text
- Confirmar se luminárias estão inclusas.
- Confirmar se tomadas e interruptores serão fornecidos pela construtora.
- Confirmar se o quadro existente comporta a carga.
- Confirmar se automação está inclusa ou excluída.
- Confirmar se projeto elétrico é executivo.
- Confirmar se haverá trabalho noturno ou desligamento programado.
```

---

# 12. Agente Hidrossanitário

## 12.1 Função

Interpretar projetos e informações relacionadas a água fria, água quente, esgoto, ventilação sanitária, drenagem, louças, metais e pontos hidráulicos.

---

## 12.2 Documentos que interpreta

* projeto hidráulico;
* projeto sanitário;
* planta de pontos hidráulicos;
* planta de esgoto;
* detalhe de prumadas;
* memorial hidrossanitário;
* layout de banheiros;
* layout de cozinha;
* detalhamento de bancadas molhadas;
* fotos de pontos existentes.

---

## 12.3 Elementos que deve identificar

* ponto de água fria;
* ponto de água quente;
* esgoto;
* ventilação;
* ralos;
* caixas sifonadas;
* caixas de gordura;
* prumadas;
* registros;
* louças;
* metais;
* pias;
* lavatórios;
* tanques;
* máquinas;
* duchas;
* vasos sanitários;
* drenos;
* shafts;
* testes de estanqueidade.

---

## 12.4 Serviços orçamentáveis possíveis

* infraestrutura de água fria;
* infraestrutura de água quente;
* infraestrutura de esgoto;
* infraestrutura de ventilação;
* deslocamento de ponto hidráulico;
* instalação de ralos;
* instalação de caixas sifonadas;
* instalação de registros;
* ligação em prumada;
* instalação de louças;
* instalação de metais;
* ligação de equipamentos;
* execução de drenos;
* rasgos e recomposições;
* testes de estanqueidade;
* adequações em shaft.

---

## 12.5 Quantitativos possíveis

```text
ponto:
- água fria
- água quente
- esgoto
- dreno
- louça
- metal

ml:
- tubulação
- rasgo
- recomposição

unidade:
- ralo
- caixa sifonada
- registro
- louça
- metal
```

---

## 12.6 Interferências que deve observar

* impermeabilização;
* piso;
* contrapiso;
* revestimentos;
* drywall;
* shafts;
* estrutura;
* marcenaria;
* bancadas;
* forro;
* acesso a prumadas;
* normas de condomínio ou shopping.

---

## 12.7 Riscos técnicos

* ausência de acesso à prumada;
* ponto existente incompatível;
* ausência de teste;
* queda insuficiente de esgoto;
* interferência estrutural;
* falta de impermeabilização;
* louças e metais sem definição;
* incompatibilidade com layout.

---

## 12.8 HITL típico

```text
- Confirmar se haverá alteração de pontos hidráulicos.
- Confirmar se há acesso às prumadas.
- Confirmar se louças e metais estão inclusos.
- Confirmar se impermeabilização está no escopo.
- Confirmar se teste de estanqueidade está incluso.
- Confirmar se rasgos e recomposições estão inclusos.
```

---

# 13. Agente Impermeabilização

## 13.1 Função

Identificar áreas que exigem impermeabilização, sistemas aplicáveis, testes necessários e riscos de infiltração.

---

## 13.2 Documentos que interpreta

* planta de áreas molhadas;
* projeto de impermeabilização;
* memorial de impermeabilização;
* detalhes de ralos;
* detalhes de rodapés impermeáveis;
* detalhes de laje;
* fotos de áreas molhadas;
* memorial de acabamentos.

---

## 13.3 Elementos que deve identificar

* banheiros;
* cozinhas;
* áreas técnicas;
* lavanderias;
* sacadas;
* terraços;
* lajes;
* jardineiras;
* ralos;
* rodapés impermeáveis;
* juntas;
* áreas externas;
* áreas sujeitas a lavagem;
* pontos de infiltração existente.

---

## 13.4 Serviços orçamentáveis possíveis

* preparo da base;
* regularização;
* primer;
* argamassa polimérica;
* manta asfáltica;
* membrana líquida;
* impermeabilização flexível;
* tratamento de ralos;
* tratamento de juntas;
* rodapé impermeável;
* proteção mecânica;
* teste de estanqueidade;
* recomposição de acabamento.

---

## 13.5 Quantitativos possíveis

```text
m²:
- área impermeabilizada
- proteção mecânica

ml:
- rodapé impermeável
- juntas
- perímetro

unidade:
- ralos
- pontos críticos
```

---

## 13.6 Interferências que deve observar

* hidráulica;
* ralos;
* contrapiso;
* revestimentos;
* soleiras;
* esquadrias;
* tempo de cura;
* sequência de execução;
* garantia;
* teste antes do fechamento.

---

## 13.7 Riscos técnicos

* impermeabilização omitida;
* teste não previsto;
* base inadequada;
* ralos sem tratamento;
* prazo de cura ignorado;
* revestimento previsto antes do teste;
* infiltração existente não tratada.

---

## 13.8 HITL típico

```text
- Confirmar sistema de impermeabilização.
- Confirmar áreas exatas.
- Confirmar se teste de estanqueidade será feito.
- Confirmar prazo de cura.
- Confirmar se impermeabilização está inclusa ou excluída.
```

---

# 14. Agente Climatização / Exaustão / Ventilação

## 14.1 Função

Interpretar sistemas de ar-condicionado, ventilação, renovação de ar, exaustão, linhas frigorígenas, drenos, dutos, grelhas e equipamentos.

---

## 14.2 Documentos que interpreta

* projeto de climatização;
* projeto de exaustão;
* projeto de ventilação;
* planta de forro com grelhas;
* memorial de climatização;
* especificação de equipamentos;
* layout de condensadoras;
* detalhe de casa de máquinas;
* fotos de área técnica;
* normas de shopping ou condomínio.

---

## 14.3 Elementos que deve identificar

* evaporadoras;
* condensadoras;
* linhas frigorígenas;
* drenos;
* dutos;
* grelhas;
* difusores;
* exaustores;
* coifas;
* renovação de ar;
* casas de máquinas;
* suportes;
* furações;
* isolamento térmico;
* alimentação elétrica;
* interferência em forro;
* acesso para manutenção.

---

## 14.4 Serviços orçamentáveis possíveis

* infraestrutura frigorígena;
* passagem de linhas;
* isolamento de linhas;
* instalação de drenos;
* instalação de evaporadora;
* instalação de condensadora;
* suporte de condensadora;
* instalação de dutos;
* instalação de grelhas;
* instalação de difusores;
* instalação de exaustor;
* instalação de coifa;
* furações técnicas;
* recomposições;
* carga de gás;
* teste de sistema;
* balanceamento;
* adequação elétrica para equipamentos.

---

## 14.5 Quantitativos possíveis

```text
ml:
- linha frigorígena
- dreno
- duto

unidade:
- evaporadora
- condensadora
- grelha
- difusor
- exaustor
- suporte
- furação

m²:
- duto quando aplicável
- isolamento quando aplicável
```

---

## 14.6 Interferências que deve observar

* forro;
* elétrica;
* hidráulica;
* estrutura;
* PPCI;
* acesso à área técnica;
* normas de shopping;
* dreno disponível;
* ruído;
* manutenção futura;
* compatibilidade com layout.

---

## 14.7 Riscos técnicos

* equipamento sem especificação;
* ausência de dreno;
* ausência de área técnica;
* conflito com forro;
* conflito com sprinkler;
* carga elétrica não prevista;
* rota de linha inviável;
* ausência de acesso para manutenção;
* exigência de trabalho noturno.

---

## 14.8 HITL típico

```text
- Confirmar se equipamentos estão inclusos.
- Confirmar se há projeto de climatização.
- Confirmar acesso à área técnica.
- Confirmar se dutos estão inclusos.
- Confirmar se elétrica de alimentação está inclusa.
- Confirmar se drenos estão disponíveis.
```

---

# 15. Agente PPCI / Incêndio

## 15.1 Função

Interpretar projetos e exigências de prevenção e combate a incêndio, especialmente em obras comerciais, restaurantes, clínicas, condomínios e shopping centers.

---

## 15.2 Documentos que interpreta

* projeto PPCI;
* planta de sprinklers;
* planta de hidrantes;
* planta de sinalização;
* planta de iluminação de emergência;
* projeto de alarme;
* memorial PPCI;
* exigências do Corpo de Bombeiros;
* exigências de shopping;
* exigências de condomínio;
* relatórios de vistoria;
* OS de teste ou liberação.

---

## 15.3 Elementos que deve identificar

* sprinklers;
* bicos;
* tubulações;
* hidrantes;
* extintores;
* iluminação de emergência;
* placas de sinalização;
* detectores;
* alarme;
* central de alarme;
* rotas de fuga;
* portas corta-fogo;
* compartimentação;
* testes de estanqueidade;
* aprovações;
* documentação obrigatória.

---

## 15.4 Serviços orçamentáveis possíveis

* remanejamento de sprinklers;
* instalação de bicos;
* instalação de tubulação;
* adequação de hidrante;
* instalação de extintores;
* instalação de sinalização;
* instalação de iluminação de emergência;
* instalação de detectores;
* instalação de alarme;
* teste de estanqueidade;
* acompanhamento de teste;
* documentação;
* acompanhamento de vistoria;
* adequações para aprovação.

---

## 15.5 Quantitativos possíveis

```text
unidade:
- sprinkler
- bico
- extintor
- luminária de emergência
- placa
- detector
- ponto de alarme

ml:
- tubulação
- infraestrutura

verba:
- documentação
- vistoria
- aprovação
```

---

## 15.6 Interferências que deve observar

* forro;
* luminárias;
* climatização;
* marcenaria;
* layout;
* rota de fuga;
* pé-direito;
* compartimentação;
* normas de shopping;
* aprovação do Corpo de Bombeiros.

---

## 15.7 Riscos técnicos

* PPCI não aprovado;
* conflito entre sprinklers e luminárias;
* alteração de layout sem atualização PPCI;
* rota de fuga comprometida;
* ausência de teste;
* documentação pendente;
* exigência de OS ou autorização externa;
* execução condicionada a fiscalização.

---

## 15.8 Regra crítica

Em shopping, restaurante, clínica, escola, mercado, academia ou local com público, PPCI deve ser tratado como disciplina crítica.

## 15.9 HITL típico

```text
- Confirmar se projeto PPCI está aprovado.
- Confirmar se teste de estanqueidade está incluso.
- Confirmar se documentação está inclusa.
- Confirmar se há exigência do shopping.
- Confirmar se alterações de layout exigem revisão de PPCI.
```

---

# 16. Agente Marcenaria / Mobiliário Técnico

## 16.1 Função

Interpretar detalhamentos de marcenaria, mobiliário fixo, painéis, bancadas e interfaces com civil, elétrica, hidráulica e acabamentos.

---

## 16.2 Documentos que interpreta

* detalhamento de marcenaria;
* elevações;
* cortes;
* planta de mobiliário;
* memorial de acabamentos;
* especificação de ferragens;
* imagens de referência;
* layout de interiores;
* detalhes de iluminação integrada.

---

## 16.3 Elementos que deve identificar

* armários;
* painéis;
* bancadas;
* nichos;
* prateleiras;
* tamponamentos;
* móveis fixos;
* portas;
* gavetas;
* ferragens;
* puxadores;
* acabamentos;
* iluminação integrada;
* recortes técnicos;
* encontros com parede;
* encontros com piso;
* encontros com revestimento.

---

## 16.4 Serviços orçamentáveis possíveis

* fabricação de armário;
* fabricação de painel;
* instalação de painel;
* instalação de bancada;
* execução de nicho;
* tamponamento;
* instalação de ferragens;
* recortes técnicos;
* ajustes em obra;
* instalação de iluminação integrada;
* montagem final;
* regulagem final.

---

## 16.5 Quantitativos possíveis

```text
m²:
- painel
- chapa
- revestimento de marcenaria

ml:
- bancada
- prateleira
- rodapé de marcenaria

unidade:
- móvel
- porta
- gaveta
- ferragem
- nicho
```

---

## 16.6 Interferências que deve observar

* tomadas;
* interruptores;
* iluminação;
* hidráulica;
* bancadas molhadas;
* revestimentos;
* prumo de parede;
* piso acabado;
* rodapés;
* cronograma de instalação;
* medidas finais em obra.

---

## 16.7 Riscos técnicos

* projeto conceitual sem detalhamento executivo;
* medidas não conferidas em obra;
* interferência com tomadas;
* acabamento não especificado;
* ferragens não definidas;
* iluminação integrada sem elétrica prevista;
* bancada molhada sem hidráulica compatível.

---

## 16.8 HITL típico

```text
- Confirmar se marcenaria está inclusa.
- Confirmar padrão de acabamento.
- Confirmar ferragens.
- Confirmar se medidas são finais.
- Confirmar se iluminação integrada entra no escopo.
- Confirmar se instalação está inclusa.
```

---

# 17. Agente Vidros / Esquadrias / Serralheria

## 17.1 Função

Interpretar portas, janelas, divisórias, guarda-corpos, pele de vidro, box, espelhos, esquadrias metálicas, alumínio e elementos de serralheria.

---

## 17.2 Documentos que interpreta

* planta de esquadrias;
* quadro de esquadrias;
* cortes;
* elevações;
* detalhes de caixilhos;
* detalhes de serralheria;
* memorial de acabamentos;
* imagens de referência;
* fotos de vãos existentes.

---

## 17.3 Elementos que deve identificar

* portas;
* janelas;
* vãos;
* guarda-corpos;
* divisórias;
* pele de vidro;
* box;
* espelhos;
* caixilhos;
* ferragens;
* corrimãos;
* gradis;
* venezianas;
* estrutura metálica leve;
* acabamentos;
* sistemas de abertura;
* medidas de vão.

---

## 17.4 Serviços orçamentáveis possíveis

* fornecimento de esquadria;
* instalação de esquadria;
* ajuste de vão;
* instalação de vidro temperado;
* instalação de vidro laminado;
* instalação de divisória de vidro;
* instalação de guarda-corpo;
* instalação de box;
* instalação de espelho;
* fabricação de estrutura metálica;
* instalação de corrimão;
* instalação de gradil;
* pintura de serralheria.

---

## 17.5 Quantitativos possíveis

```text
m²:
- vidro
- esquadria
- espelho
- divisória

ml:
- corrimão
- guarda-corpo
- perfil

unidade:
- porta
- janela
- folha
- vão
- ferragem
```

---

## 17.6 Interferências que deve observar

* alvenaria;
* drywall;
* pintura;
* piso acabado;
* soleiras;
* impermeabilização;
* medidas finais;
* normas de segurança;
* carga de vento;
* acessibilidade;
* rota de fuga.

---

## 17.7 Riscos técnicos

* medidas não confirmadas;
* vão fora de prumo;
* tipo de vidro não definido;
* ferragens não especificadas;
* segurança não validada;
* guarda-corpo sem norma definida;
* prazo de fabricação não considerado.

---

## 17.8 HITL típico

```text
- Confirmar medidas finais.
- Confirmar tipo de vidro.
- Confirmar acabamento.
- Confirmar se fornecimento está incluso.
- Confirmar se instalação está inclusa.
- Confirmar se há exigência normativa específica.
```

---

# 18. Agente Acabamentos

## 18.1 Função

Interpretar especificações de acabamentos, materiais aparentes, paginações, pinturas, revestimentos, rodapés, soleiras, metais aparentes e memoriais de acabamento.

---

## 18.2 Documentos que interpreta

* memorial de acabamentos;
* tabela de materiais;
* planta de paginação de piso;
* planta de paginação de revestimento;
* elevações de paredes;
* imagens de referência;
* projeto de interiores;
* detalhamento de bancadas;
* especificações do arquiteto.

---

## 18.3 Elementos que deve identificar

* pisos;
* revestimentos;
* rodapés;
* soleiras;
* filetes;
* pedras;
* pintura;
* textura;
* papel de parede;
* metais aparentes;
* louças aparentes;
* bancadas;
* rejuntes;
* arremates;
* encontros;
* paginações;
* perdas previstas.

---

## 18.4 Serviços orçamentáveis possíveis

* preparo de base;
* assentamento de piso;
* assentamento de revestimento;
* rejuntamento;
* instalação de rodapé;
* instalação de soleira;
* instalação de filete;
* instalação de pedra;
* pintura acrílica;
* pintura esmalte;
* textura;
* papel de parede;
* proteção de acabamento;
* limpeza final.

---

## 18.5 Quantitativos possíveis

```text
m²:
- piso
- revestimento
- pintura
- textura
- papel de parede

ml:
- rodapé
- soleira
- filete
- arremate

unidade:
- peça especial
- bancada
- acabamento específico
```

---

## 18.6 Interferências que deve observar

* base civil;
* contrapiso;
* prumo;
* impermeabilização;
* paginação;
* perdas;
* recortes;
* fornecimento pelo cliente;
* prazo de entrega dos materiais;
* compatibilidade entre memorial e planta.

---

## 18.7 Riscos técnicos

* material não especificado;
* paginação ausente;
* perda não considerada;
* base inadequada;
* conflito entre memorial e planta;
* item de alto padrão sem fornecedor definido;
* prazo de entrega incompatível.

---

## 18.8 HITL típico

```text
- Confirmar se materiais estão inclusos.
- Confirmar percentual de perda.
- Confirmar padrão de acabamento.
- Confirmar fornecedor.
- Confirmar paginação executiva.
- Confirmar se pedras e metais aparentes entram no escopo.
```

---

# 19. Agente Documentação / Aprovações

## 19.1 Função

Identificar necessidades de documentação, responsabilidade técnica, aprovações, liberações externas, normas internas e custos burocráticos.

---

## 19.2 Documentos que interpreta

* exigências de condomínio;
* exigências de shopping;
* regulamento interno;
* alvará;
* ART;
* RRT;
* PPCI;
* manuais técnicos;
* e-mails de aprovação;
* checklists de obra;
* documentos de fiscalização;
* memoriais;
* projetos aprovados;
* solicitações de as built.

---

## 19.3 Elementos que deve identificar

* necessidade de ART/RRT;
* necessidade de alvará;
* necessidade de aprovação de projeto;
* necessidade de PPCI;
* necessidade de as built;
* necessidade de laudo;
* necessidade de seguro;
* necessidade de OS;
* normas de horário;
* normas de acesso;
* taxas;
* documentos obrigatórios.

---

## 19.4 Serviços orçamentáveis possíveis

* ART/RRT;
* atualização de projeto;
* compatibilização documental;
* as built;
* emissão de laudo;
* acompanhamento de aprovação;
* protocolo em shopping;
* protocolo em condomínio;
* organização de anexos;
* reuniões técnicas;
* vistorias;
* acompanhamento de fiscalização.

---

## 19.5 Quantitativos possíveis

```text
unidade:
- ART/RRT
- laudo
- protocolo
- projeto revisado
- vistoria

verba:
- taxas
- aprovações
- acompanhamento burocrático

hora:
- reuniões
- compatibilização
- análise técnica
```

---

## 19.6 Interferências que deve observar

* início de obra condicionado à aprovação;
* necessidade de projeto atualizado;
* necessidade de responsabilidade técnica;
* prazo de terceiros;
* exigência do shopping;
* exigência do condomínio;
* documentação de bombeiros;
* impacto no cronograma.

---

## 19.7 Riscos técnicos e comerciais

* obra impedida de iniciar;
* aprovação atrasada;
* projeto desatualizado;
* as built não previsto;
* responsabilidade técnica indefinida;
* taxa não considerada;
* escopo burocrático não cobrado.

---

## 19.8 HITL típico

```text
- Confirmar se documentação está inclusa.
- Confirmar responsável técnico.
- Confirmar se taxas estão inclusas.
- Confirmar se haverá as built.
- Confirmar prazos de aprovação.
- Confirmar se o cliente ou a construtora assume protocolos.
```

---

# 20. Agente Administração / Gestão de Obra

## 20.1 Função

Identificar custos de gestão, administração, coordenação, planejamento, visitas técnicas, acompanhamento e operação gerencial da obra.

Este agente é essencial para evitar que a gestão da obra fique invisível no orçamento.

---

## 20.2 Informações que considera

* tipo de obra;
* duração estimada;
* complexidade;
* padrão de acabamento;
* quantidade de equipes;
* necessidade de compras;
* necessidade de fiscalização;
* necessidade de reuniões;
* necessidade de relatórios;
* obra em shopping;
* obra em condomínio;
* obra noturna;
* distância;
* deslocamento;
* estacionamento;
* tempo de coordenação;
* intensidade de comunicação com cliente;
* risco operacional.

---

## 20.3 Serviços orçamentáveis possíveis

* administração de obra;
* gestão técnica;
* coordenação de equipes;
* planejamento inicial;
* reuniões;
* acompanhamento de shopping;
* acompanhamento de condomínio;
* controle de fornecedores;
* controle de compras;
* emissão de relatórios;
* controle de cronograma;
* controle de escopo;
* visitas técnicas;
* mobilização administrativa;
* gestão de liberações.

---

## 20.4 Quantitativos possíveis

```text
mês:
- administração mensal
- gestão mensal

diária:
- acompanhamento técnico
- visitas técnicas

hora:
- reuniões
- planejamento
- compatibilização
- gestão comercial/técnica

verba:
- deslocamentos
- estacionamento
- custos administrativos
```

---

## 20.5 Interferências que deve observar

* cronograma;
* número de equipes;
* obra noturna;
* exigências de shopping;
* exigências de condomínio;
* disponibilidade do cliente;
* aprovações externas;
* compras;
* logística;
* fiscalização;
* pressão comercial.

---

## 20.6 Riscos financeiros

* administração não cobrada;
* visitas subestimadas;
* obra noturna sem adicional;
* deslocamento não considerado;
* estacionamento não considerado;
* reuniões não consideradas;
* coordenação de terceiros sem remuneração;
* cliente comparando apenas mão de obra e material.

---

## 20.7 HITL típico

```text
- Confirmar se administração entra como item separado.
- Confirmar se será cobrada mensalmente ou percentual.
- Confirmar frequência de visitas.
- Confirmar se obra terá turno noturno.
- Confirmar se shopping/condomínio exige acompanhamento extra.
- Confirmar se relatórios estão inclusos.
```

---

# 21. Agente Compatibilização Técnica

## 21.1 Função

Cruzar as leituras dos demais Agentes de Domínio e identificar conflitos, lacunas, incompatibilidades e riscos integrados.

Este agente é obrigatório em todo orçamento com mais de uma disciplina.

---

## 21.2 O que verifica

* arquitetura versus elétrica;
* arquitetura versus hidráulica;
* arquitetura versus estrutura;
* forro versus climatização;
* forro versus PPCI;
* luminárias versus sprinklers;
* exaustão versus estrutura;
* marcenaria versus tomadas;
* marcenaria versus hidráulica;
* revestimento versus base civil;
* piso versus impermeabilização;
* layout versus rota de fuga;
* memorial versus planta;
* orçamento versus projeto;
* escopo comercial versus escopo técnico;
* projeto executivo completo versus projeto parcial.

---

## 21.3 Conflitos típicos

```text
- Forro previsto sem compatibilização com dutos de ar-condicionado.
- Sprinklers conflitantes com luminárias.
- Bancada prevista sem ponto hidráulico identificado.
- Marcenaria prevista bloqueando tomadas.
- Revestimento previsto sem regularização de parede.
- Demolição prevista em parede com possível função estrutural.
- Layout alterado sem atualização PPCI.
- Memorial indica material diferente da planta.
- Projeto elétrico ausente, mas layout indica novos equipamentos.
```

---

## 21.4 Saída obrigatória

```text
Matriz de Compatibilização:
- Conflito
- Disciplina A
- Disciplina B
- Origem
- Impacto técnico
- Impacto financeiro
- Impacto no prazo
- Gravidade
- HITL necessário
- Ação recomendada
```

---

## 21.5 Níveis de gravidade

```text
BAIXA
Não impede orçamento, mas exige observação.

MÉDIA
Pode alterar escopo, quantidade ou prazo.

ALTA
Pode alterar preço, responsabilidade ou execução.

CRÍTICA
Impede consolidação confiável sem validação.
```

---

## 21.6 HITL típico

```text
- Confirmar qual disciplina prevalece.
- Confirmar se haverá revisão de projeto.
- Confirmar se o item será tratado como verba.
- Confirmar se o conflito será excluído do escopo.
- Confirmar se o orçamento seguirá com premissa.
```

---

# 22. Agente Especial — Comparativo de Propostas

## 22.1 Função

Comparar orçamento EVIS com orçamento de terceiro, identificando diferenças de escopo, omissões, distorções e riscos comerciais.

Este agente deve ser acionado quando o usuário enviar orçamento concorrente ou orçamento anterior para comparação.

---

## 22.2 Documentos que interpreta

* orçamento de concorrente;
* planilha de terceiro;
* proposta comercial recebida;
* escopo enviado pelo cliente;
* memorial comparativo;
* orçamento antigo;
* medição ou estimativa preliminar.

---

## 22.3 O que verifica

* itens presentes no EVIS e ausentes no terceiro;
* itens presentes no terceiro e ausentes no EVIS;
* diferenças de unidade;
* diferenças de quantidade;
* diferenças de escopo;
* diferenças de fornecimento;
* diferença entre mão de obra e material;
* itens genéricos demais;
* itens sem premissa;
* valores muito abaixo da referência;
* valores muito acima da referência;
* riscos ocultos no orçamento concorrente.

---

## 22.4 Saída obrigatória

```text
Comparativo:
- Item
- EVIS
- Terceiro
- Diferença identificada
- Impacto técnico
- Impacto financeiro
- Argumento comercial
- Validação necessária
```

---

## 22.5 Uso comercial

O resultado deve ajudar o usuário a argumentar com cliente ou arquiteto.

Exemplo:

```text
O orçamento concorrente aparenta estar mais baixo porque não explicita proteção, descarte, regularização e administração de obra. Esses itens precisam ser esclarecidos para que a comparação seja equivalente.
```

---

# 23. Formato Padrão de Resposta dos Agentes

Cada agente deve produzir uma resposta estruturada em formato legível por humanos e compatível com persistência futura.

## Template

```text
## Agente Acionado
Nome do agente

## Documentos Considerados
- Documento 1
- Documento 2

## Itens Identificados Diretamente
| Item | Origem | Ambiente | Confiança |

## Itens Inferidos Tecnicamente
| Item | Motivo da Inferência | Ambiente | Confiança | HITL |

## Itens Ausentes ou Ambíguos
| Item | Impacto | Ação Recomendada |

## Serviços Orçamentáveis Gerados
| Serviço | Categoria | Ambiente | Unidade | Status | Confiança |

## Quantitativos Possíveis
| Serviço | Quantidade | Unidade | Tipo | Origem | Confiança |

## Interferências
| Interferência | Disciplinas | Impacto | Gravidade |

## Riscos
| Risco | Tipo | Gravidade | Ação |

## Validações HITL
| Item | Motivo | Opções |

## Observações Técnicas
Texto objetivo e técnico.
```

---

# 24. Formato Estruturado para Sistema

Além da resposta visual, cada agente deve poder gerar estrutura de dados.

## Exemplo

```json
{
  "agent": "civil_arquitetonico",
  "discipline": "civil",
  "identified_items": [
    {
      "name": "Forro em drywall",
      "origin": "Planta de forro",
      "environment": "Salão Principal",
      "confidence": "alta"
    }
  ],
  "inferred_items": [
    {
      "name": "Proteção de piso existente",
      "reason": "Obra em ambiente existente com acabamento preservado",
      "confidence": "media",
      "hitl_required": true
    }
  ],
  "budget_services": [
    {
      "name": "Execução de forro em drywall",
      "category": "Forro",
      "unit": "m2",
      "status": "identificado",
      "confidence": "alta"
    }
  ],
  "risks": [
    {
      "description": "Área de forro sem cota completa",
      "type": "financeiro",
      "severity": "media"
    }
  ],
  "hitl_validations": [
    {
      "item": "Proteção de piso",
      "reason": "Item tecnicamente necessário, mas não explicitado",
      "impact": "Pode alterar custo",
      "status": "pendente"
    }
  ]
}
```

---

# 25. Regras de Não Invenção

Os Agentes de Domínio não podem:

* inventar área;
* inventar quantidade;
* inventar custo;
* inventar projeto ausente;
* assumir fornecimento;
* assumir padrão de acabamento;
* assumir horário de execução;
* assumir aprovação;
* assumir responsabilidade técnica;
* assumir que um serviço está incluso sem evidência ou validação.

## Quando houver dúvida

O agente deve usar:

```text
Status: pendente
Confiança: baixa
HITL: obrigatório
```

---

# 26. Regras de Inferência Permitida

A inferência técnica é permitida, desde que marcada.

## Inferências aceitáveis

* proteção de piso em reforma com área existente preservada;
* descarte após demolição;
* rasgo e recomposição quando há novo ponto embutido;
* infraestrutura elétrica para novos pontos;
* regularização de base antes de acabamento;
* teste de estanqueidade após intervenção hidráulica;
* compatibilização de forro com climatização;
* administração em obra com múltiplas equipes.

## Condição

Toda inferência deve conter:

```text
- motivo da inferência;
- impacto;
- nível de confiança;
- necessidade ou não de HITL.
```

---

# 27. Priorização dos Agentes

Quando múltiplos agentes forem acionados, a ordem recomendada é:

```text
1. Civil / Arquitetônico
2. Estrutural
3. Hidrossanitário
4. Impermeabilização
5. Elétrica / Dados / Automação
6. Climatização / Exaustão / Ventilação
7. PPCI / Incêndio
8. Marcenaria / Mobiliário Técnico
9. Vidros / Esquadrias / Serralheria
10. Acabamentos
11. Documentação / Aprovações
12. Administração / Gestão de Obra
13. Compatibilização Técnica
14. Comparativo de Propostas, quando aplicável
```

## Regra

Compatibilização Técnica deve ser executada depois dos demais agentes relevantes.

---

# 28. Relação dos Agentes com Quantitativo

Os Agentes de Domínio podem sugerir quantitativos possíveis, mas o cálculo consolidado deve ser responsabilidade do Agente Quantitativo.

## Correto

```text
Agente Civil:
Serviço sugerido: execução de forro em drywall
Quantidade possível: área do ambiente indicada em planta, pendente de validação pelo Quantitativo
```

## Incorreto

```text
Agente Civil consolida custo final e preço de venda.
```

---

# 29. Relação dos Agentes com Custos

Os Agentes de Domínio não devem precificar definitivamente.

Eles podem indicar:

* tipo de serviço;
* complexidade;
* unidade adequada;
* necessidade de composição;
* risco de custo;
* fonte sugerida.

A precificação deve ocorrer no Agente de Custos.

---

# 30. Relação dos Agentes com Proposta

Os Agentes de Domínio não escrevem a proposta final.

Eles alimentam a proposta com:

* escopo técnico;
* exclusões;
* premissas;
* riscos;
* observações técnicas;
* itens que exigem validação.

O Agente Gerador de Proposta transforma isso em linguagem comercial.

---

# 31. Critérios de Qualidade dos Agentes

Um Agente de Domínio será considerado funcional quando:

```text
[ ] Interpreta apenas sua disciplina
[ ] Não inventa projeto ausente
[ ] Separa identificado, inferido e pendente
[ ] Gera serviços orçamentáveis
[ ] Sugere unidades corretas
[ ] Aponta interferências
[ ] Aponta riscos técnicos
[ ] Aponta riscos financeiros
[ ] Gera validações HITL
[ ] Informa grau de confiança
[ ] Mantém origem da informação
[ ] Não precifica definitivamente
[ ] Não atualiza obra
[ ] Não cria medição
```

---

# 32. Checklist Geral de Agentes Obrigatórios

```text
[ ] Agente Civil / Arquitetônico
[ ] Agente Estrutural
[ ] Agente Elétrica / Dados / Automação
[ ] Agente Hidrossanitário
[ ] Agente Impermeabilização
[ ] Agente Climatização / Exaustão / Ventilação
[ ] Agente PPCI / Incêndio
[ ] Agente Marcenaria / Mobiliário Técnico
[ ] Agente Vidros / Esquadrias / Serralheria
[ ] Agente Acabamentos
[ ] Agente Documentação / Aprovações
[ ] Agente Administração / Gestão de Obra
[ ] Agente Compatibilização Técnica
[ ] Agente Comparativo de Propostas
```

---

# 33. Frase Canônica Final

Os Agentes de Domínio do Orçamentista IA EVIS são especialistas técnicos responsáveis por interpretar disciplinas específicas de projeto, transformar leitura técnica em serviços orçamentáveis, identificar riscos e lacunas, sugerir quantitativos possíveis e acionar validação humana sempre que houver incerteza, inferência ou impacto técnico-financeiro relevante.

Eles não executam orçamento final isoladamente.

Eles alimentam o pipeline do Orçamentista IA com leitura técnica especializada.
