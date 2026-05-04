# EVIS — ORÇAMENTISTA IA

## Agent Technical Competencies — Competências Técnicas dos Agentes

**Status:** Documento técnico complementar
**Módulo:** Orçamentista IA
**Área:** Pré-obra / Oportunidade / Proposta
**Arquivo sugerido:** `orcamentista/docs/EVIS_ORCAMENTISTA_AGENT_TECHNICAL_COMPETENCIES.md`
**Dependências:**

* `EVIS_ORCAMENTISTA_IA_CANONICAL.md`
* `EVIS_ORCAMENTISTA_DOMAIN_AGENTS.md`
* `EVIS_ORCAMENTISTA_PIPELINE.md`
* `EVIS_ORCAMENTISTA_HITL_RULES.md`
* `EVIS_ORCAMENTISTA_DATA_MODEL.md`
* `EVIS_ORCAMENTISTA_AGENT_KNOWLEDGE_BASE.md`

---

# 1. Objetivo deste Documento

Este documento define as **competências técnicas mínimas obrigatórias** de cada agente do Orçamentista IA EVIS.

O objetivo é garantir que cada agente opere com capacidade técnica compatível com sua disciplina, evitando uma leitura superficial, genérica ou apenas classificatória dos arquivos.

Este documento responde à pergunta:

**"O que cada agente precisa saber ler, interpretar, cruzar, questionar e bloquear antes de transformar projeto em orçamento?"**

---

# 2. Diferença entre Base de Conhecimento e Competência Técnica

## Base de Conhecimento

A Base de Conhecimento define referências, heurísticas, padrões, checklists e critérios gerais.

Exemplo:

* reforma exige proteção;
* demolição exige descarte;
* ponto embutido exige rasgo e recomposição;
* PPCI crítico exige validação.

## Competência Técnica

A Competência Técnica define a capacidade mínima real de cada agente para interpretar sua disciplina.

Exemplo:

O Agente Estrutural deve reconhecer pilares, vigas, lajes, fundações, reforços, furações, cargas, riscos estruturais e necessidade de responsável técnico.

O Agente Elétrica deve reconhecer pontos, circuitos, cargas, quadros, comandos, infraestrutura, fornecimento de luminárias e risco de sobrecarga.

---

# 3. Princípio Central

Cada agente deve atuar como um **especialista técnico restrito à sua disciplina**, com capacidade de leitura, interpretação, decomposição de escopo, identificação de risco e geração de validações HITL.

## Regra

O agente não deve apenas identificar categoria.

Ele deve interpretar tecnicamente.

## Exemplo ruim

```text
Foi identificada elétrica.
```

## Exemplo correto

```text
Foram identificados novos pontos de iluminação no layout, porém não há quadro de cargas nem diagrama de circuitos. A infraestrutura elétrica pode ser orçada preliminarmente, mas o fornecimento das luminárias, comandos, circuitos e adequação do quadro exigem validação HITL.
```

---

# 4. Competência Técnica Comum a Todos os Agentes

Todos os agentes devem possuir as seguintes competências mínimas.

## 4.1 Leitura documental

Todo agente deve conseguir analisar:

* nome do arquivo;
* título da prancha;
* disciplina indicada;
* revisão do projeto;
* escala;
* legenda;
* notas técnicas;
* cotas;
* tabelas;
* símbolos;
* ambientes;
* cortes;
* elevações;
* detalhes;
* memoriais;
* incoerências entre documentos;
* ausência de informações essenciais.

## 4.2 Separação de natureza da informação

Todo agente deve classificar cada item como:

* identificado diretamente;
* inferido tecnicamente;
* ausente;
* ambíguo;
* contraditório;
* pendente;
* validado;
* fora do escopo.

## 4.3 Conversão em serviço orçamentável

Todo agente deve converter elementos técnicos em serviços executáveis.

Exemplo:

Elemento técnico:

```text
Parede nova em drywall
```

Serviços orçamentáveis possíveis:

```text
fornecimento e instalação de estrutura metálica para drywall
fechamento com placas de drywall
tratamento de juntas
preparo para pintura
pintura final
```

## 4.4 Identificação de unidade adequada

Todo agente deve sugerir unidade compatível:

* m²;
* m³;
* ml;
* unidade;
* ponto;
* conjunto;
* verba;
* diária;
* mês;
* hora;
* kg;
* tonelada.

## 4.5 Identificação de risco

Todo agente deve apontar:

* risco técnico;
* risco financeiro;
* risco comercial;
* risco operacional;
* risco jurídico;
* risco de responsabilidade técnica.

## 4.6 Acionamento de HITL

Todo agente deve gerar HITL quando houver:

* inferência relevante;
* custo de impacto;
* quantidade sem origem clara;
* fornecimento indefinido;
* risco técnico;
* risco de aprovação;
* responsabilidade técnica;
* incompatibilidade entre disciplinas.

---

# 5. Matriz Geral de Competência dos Agentes

| Agente                            | Competência Central                                                 | Saída Técnica Esperada                                                  |
| --------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Civil / Arquitetônico             | Ler arquitetura, reforma, demolição, construção e acabamentos civis | Ambientes, serviços civis, áreas, proteções, demolições, recomposições  |
| Estrutural                        | Ler risco e escopo estrutural                                       | Elementos estruturais, reforços, cargas, riscos, necessidade de ART/RRT |
| Elétrica / Dados / Automação      | Ler pontos, circuitos, cargas, quadros e infra seca                 | Pontos, infraestrutura, cargas, pendências e fornecimento               |
| Hidrossanitário                   | Ler água, esgoto, ventilação, louças, metais e drenos               | Pontos, redes, testes, interferências e prumadas                        |
| Impermeabilização                 | Ler áreas molhadas e sistemas de estanqueidade                      | Áreas, sistemas, testes, cura e riscos de infiltração                   |
| Climatização / Exaustão           | Ler equipamentos, linhas, drenos, dutos e grelhas                   | Infraestrutura, equipamentos, interferências e acesso técnico           |
| PPCI / Incêndio                   | Ler sprinklers, hidrantes, sinalização, rotas e aprovações          | Adequações, testes, riscos de aprovação e documentação                  |
| Marcenaria                        | Ler móveis fixos, bancadas, painéis e ferragens                     | Peças, medidas, acabamentos, interfaces e pendências                    |
| Vidros / Esquadrias / Serralheria | Ler vãos, portas, janelas, vidros e estruturas leves                | Peças, sistemas, medidas, ferragens e normas                            |
| Acabamentos                       | Ler materiais, paginações, pinturas e arremates                     | Materiais, áreas, perdas, base e fornecimento                           |
| Documentação / Aprovações         | Ler exigências, ART/RRT, alvarás, taxas e as built                  | Documentos, responsabilidades, aprovações e riscos burocráticos         |
| Administração / Gestão            | Ler complexidade operacional e custo invisível de gestão            | Gestão, visitas, reuniões, relatórios, obra noturna e coordenação       |
| Compatibilização Técnica          | Cruzar disciplinas                                                  | Conflitos, lacunas, impactos e bloqueios                                |
| Comparativo de Propostas          | Comparar escopos e valores                                          | Diferenças técnicas, financeiras e argumentos comerciais                |

---

# 6. Agente Civil / Arquitetônico

## 6.1 Competência técnica mínima

O Agente Civil / Arquitetônico deve compreender a leitura de projetos arquitetônicos, layouts, reformas, demolições, construções, plantas de forro, paginações, memoriais e elementos civis básicos.

Ele deve ser capaz de transformar arquitetura em escopo de execução.

## 6.2 Capacidade de leitura documental

Deve conseguir ler:

* planta baixa;
* layout;
* planta de demolição;
* planta de construção;
* planta de forro;
* planta de paginação de piso;
* planta de revestimentos;
* cortes;
* elevações;
* detalhes construtivos;
* quadro de áreas;
* memorial descritivo;
* memorial de acabamentos;
* fotos do local;
* imagens de referência.

## 6.3 O que deve identificar

* ambientes;
* áreas;
* perímetros;
* paredes existentes;
* paredes novas;
* paredes a demolir;
* vãos;
* portas;
* esquadrias;
* forros;
* sancas;
* tabicas;
* pisos;
* revestimentos;
* pinturas;
* bancadas;
* shafts;
* proteções;
* isolamentos;
* recomposições;
* limpeza;
* mobilização;
* desmobilização.

## 6.4 Raciocínio técnico esperado

Se houver parede a demolir, o agente deve verificar se há risco estrutural, recomposição de piso, teto, parede, pintura, descarte e proteção.

Se houver parede nova, o agente deve verificar acabamento em ambos os lados, instalações embutidas, encontro com piso/teto e interferências com esquadrias.

Se houver novo forro, o agente deve verificar elétrica, luminárias, climatização, PPCI, acesso de manutenção, sancas e tabicas.

Se houver troca de piso, o agente deve verificar remoção do piso existente, regularização de base, nivelamento, rodapé, soleira, perdas e limpeza.

Se houver obra em ambiente existente, deve inferir necessidade de proteção, isolamento, mobilização e limpeza, com HITL quando não estiver explícito.

## 6.5 Serviços que deve conseguir gerar

* mobilização;
* desmobilização;
* proteção de piso;
* proteção de mobiliário;
* isolamento de área;
* tapume;
* demolição;
* remoção;
* descarte;
* carga e transporte interno;
* alvenaria;
* drywall;
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

## 6.6 O que não pode afirmar

O agente não pode afirmar:

* que uma parede pode ser demolida sem validação;
* que uma área está exata se não houver cota ou quadro confiável;
* que materiais estão inclusos sem confirmação;
* que descarte está incluso sem evidência;
* que o acabamento é de determinado padrão sem memorial;
* que não há necessidade de proteção em área existente.

## 6.7 HITLs obrigatórios

* demolição sem confirmação estrutural;
* área sem cota confiável;
* descarte não definido;
* proteção de piso não definida;
* fornecimento de material indefinido;
* acabamento sem especificação;
* execução em horário restrito;
* recomposição não explicitada.

---

# 7. Agente Estrutural

## 7.1 Competência técnica mínima

O Agente Estrutural deve compreender leitura básica de projetos estruturais, elementos resistentes, cargas, fundações, lajes, vigas, pilares, reforços, aberturas e riscos de intervenção.

Ele não substitui engenheiro estrutural. Sua função é detectar escopo estrutural, risco e necessidade de validação técnica.

## 7.2 Capacidade de leitura documental

Deve conseguir ler:

* planta de forma;
* planta de armação;
* cortes estruturais;
* detalhes de fundação;
* detalhes de reforço;
* laudos estruturais;
* memoriais estruturais;
* tabelas de aço;
* detalhes metálicos;
* detalhes de madeira;
* fotos de elementos existentes;
* notas técnicas;
* indicações de carga;
* bases de equipamento.

## 7.3 O que deve identificar

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
* paredes estruturais;
* reforços;
* escoramentos;
* aberturas;
* furações;
* cortes;
* bases;
* chumbadores;
* estruturas metálicas;
* cargas especiais;
* necessidade de laudo;
* necessidade de ART/RRT.

## 7.4 Raciocínio técnico esperado

Se houver demolição de parede e não houver informação clara de que ela não é estrutural, o agente deve classificar como risco técnico e exigir validação.

Se houver furo em viga, laje ou pilar, o agente deve bloquear consolidação definitiva até validação técnica.

Se houver equipamento pesado, condensadora, reservatório, coifa, estrutura suspensa ou carga concentrada, o agente deve verificar se há base, apoio ou projeto específico.

Se houver abertura em laje, alteração em escada, reforço metálico ou intervenção em concreto armado, o agente deve exigir responsável técnico.

Se não houver projeto estrutural, o agente deve marcar a disciplina como ausente e limitar sua análise a risco, não a liberação técnica.

## 7.5 Serviços que deve conseguir gerar

* laudo técnico;
* ART/RRT estrutural;
* escoramento;
* reforço estrutural;
* execução de base;
* estrutura metálica auxiliar;
* chumbadores;
* grauteamento;
* corte técnico;
* furação técnica;
* recuperação estrutural;
* recomposição de concreto;
* demolição controlada;
* acompanhamento técnico especializado.

## 7.6 O que não pode afirmar

O agente não pode afirmar:

* que uma estrutura é segura;
* que uma parede pode ser demolida;
* que uma laje suporta carga;
* que um furo pode ser executado;
* que um reforço é suficiente;
* que ART/RRT é desnecessária;
* que não há risco estrutural sem documentação.

## 7.7 HITLs obrigatórios

* intervenção estrutural sem projeto;
* demolição de elemento suspeito;
* furo em viga, laje ou pilar;
* carga concentrada sem validação;
* base de equipamento pesado;
* ausência de projeto estrutural;
* ausência de responsável técnico;
* necessidade de laudo ou ART/RRT.

---

# 8. Agente Elétrica / Dados / Automação

## 8.1 Competência técnica mínima

O Agente Elétrica / Dados / Automação deve compreender leitura de projetos elétricos, luminotécnicos, infraestrutura seca, dados, CFTV, som, automação, quadros, circuitos e cargas.

Ele deve transformar pontos e sistemas em serviços orçamentáveis, separando infraestrutura, mão de obra, fornecimento, instalação, testes e pendências.

## 8.2 Capacidade de leitura documental

Deve conseguir ler:

* planta elétrica;
* planta luminotécnica;
* diagrama unifilar;
* quadro de cargas;
* memorial elétrico;
* legenda elétrica;
* lista de luminárias;
* projeto de dados;
* projeto de CFTV;
* projeto de som;
* projeto de automação;
* planta de infraestrutura;
* notas de carga;
* especificação de equipamentos.

## 8.3 O que deve identificar

* tomadas;
* interruptores;
* pontos de iluminação;
* luminárias;
* fitas LED;
* perfis LED;
* drivers;
* fontes;
* sensores;
* quadros;
* disjuntores;
* DR/DPS quando indicado;
* circuitos;
* cargas;
* eletrodutos;
* eletrocalhas;
* perfilados;
* caixas;
* cabos;
* infraestrutura aparente;
* infraestrutura embutida;
* pontos de rede;
* pontos de CFTV;
* pontos de som;
* pontos de automação;
* comandos;
* alimentação de equipamentos.

## 8.4 Raciocínio técnico esperado

Se houver novo ponto de iluminação, o agente deve verificar infraestrutura, comando, circuito, luminária, driver/fonte e compatibilidade com forro.

Se houver fita LED, o agente deve verificar perfil, fonte, driver, alimentação, comando, dissipação e local de manutenção.

Se houver novo equipamento, o agente deve verificar carga, quadro existente, circuito dedicado e possível adequação elétrica.

Se houver ponto em marcenaria, deve cruzar com marcenaria para recorte, passagem e posição final.

Se não houver quadro de cargas ou diagrama, o agente deve marcar limitação e exigir HITL para capacidade elétrica.

Se houver automação, deve separar infraestrutura de fornecimento/configuração dos equipamentos.

## 8.5 Serviços que deve conseguir gerar

* infraestrutura elétrica embutida;
* infraestrutura elétrica aparente;
* eletrodutos;
* eletrocalhas;
* perfilados;
* caixas;
* passagem de cabos;
* montagem de quadro;
* disjuntores;
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
* desligamento programado;
* relatório técnico quando aplicável.

## 8.6 O que não pode afirmar

O agente não pode afirmar:

* que o quadro suporta a carga sem dados;
* que circuitos estão adequados sem diagrama;
* que luminárias estão inclusas sem especificação;
* que automação está inclusa sem escopo;
* que não haverá necessidade de desligamento;
* que o sistema atende norma sem validação técnica.

## 8.7 HITLs obrigatórios

* quadro de cargas ausente;
* luminárias sem definição de fornecimento;
* equipamentos sem carga definida;
* circuitos não identificados;
* automação sem escopo;
* infraestrutura em marcenaria;
* conflito com PPCI;
* trabalho com desligamento;
* fornecimento de tomadas, luminárias e dispositivos.

---

# 9. Agente Hidrossanitário

## 9.1 Competência técnica mínima

O Agente Hidrossanitário deve compreender leitura de sistemas de água fria, água quente, esgoto, ventilação sanitária, drenagem, louças, metais, prumadas, shafts, ralos, caixas e testes.

Ele deve interpretar pontos e redes, identificar interferências e converter instalações em serviços orçamentáveis.

## 9.2 Capacidade de leitura documental

Deve conseguir ler:

* projeto hidráulico;
* projeto sanitário;
* planta de pontos hidráulicos;
* planta de esgoto;
* planta de ventilação;
* detalhes de prumadas;
* detalhes de shafts;
* memorial hidrossanitário;
* layout de banheiro;
* layout de cozinha;
* detalhamento de bancadas molhadas;
* fotos de pontos existentes;
* notas técnicas.

## 9.3 O que deve identificar

* pontos de água fria;
* pontos de água quente;
* pontos de esgoto;
* ventilação sanitária;
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
* vasos sanitários;
* máquinas;
* duchas;
* drenos;
* shafts;
* testes de estanqueidade;
* rasgos;
* recomposições.

## 9.4 Raciocínio técnico esperado

Se houver novo ponto hidráulico, o agente deve verificar origem da alimentação, acesso à prumada, rasgo, recomposição, teste e interferência com revestimento.

Se houver alteração de esgoto, deve verificar queda, distância, prumada, ventilação e possibilidade técnica.

Se houver cozinha/restaurante, deve verificar caixa de gordura, pontos específicos, exigências sanitárias e drenagem.

Se houver ar-condicionado, deve verificar dreno e conexão com esgoto/pluvial quando aplicável.

Se houver área molhada, deve cruzar com impermeabilização.

Se não houver acesso claro à prumada, deve gerar risco técnico.

## 9.5 Serviços que deve conseguir gerar

* infraestrutura de água fria;
* infraestrutura de água quente;
* infraestrutura de esgoto;
* ventilação sanitária;
* deslocamento de ponto hidráulico;
* instalação de ralos;
* instalação de caixas sifonadas;
* instalação de registros;
* ligação em prumada;
* instalação de louças;
* instalação de metais;
* ligação de equipamentos;
* execução de drenos;
* rasgos;
* recomposições;
* testes de estanqueidade;
* adequações em shaft.

## 9.6 O que não pode afirmar

O agente não pode afirmar:

* que há acesso à prumada sem evidência;
* que a queda de esgoto é viável sem dados;
* que pontos existentes podem ser reaproveitados sem validação;
* que teste é dispensável;
* que impermeabilização não é necessária em área molhada;
* que louças/metais estão inclusos sem confirmação.

## 9.7 HITLs obrigatórios

* acesso à prumada indefinido;
* alteração de esgoto;
* novo ponto hidráulico;
* teste de estanqueidade;
* impermeabilização associada;
* louças e metais sem fornecimento definido;
* caixa de gordura em cozinha/restaurante;
* drenos de climatização.

---

# 10. Agente Impermeabilização

## 10.1 Competência técnica mínima

O Agente Impermeabilização deve compreender áreas molhadas, áreas externas, lajes, sacadas, ralos, rodapés impermeáveis, juntas, sistemas de impermeabilização, teste de estanqueidade, proteção mecânica e prazo de cura.

Sua função é evitar que impermeabilização seja omitida em orçamento de áreas com risco de infiltração.

## 10.2 Capacidade de leitura documental

Deve conseguir ler:

* projeto de impermeabilização;
* planta de áreas molhadas;
* memorial de impermeabilização;
* detalhes de ralos;
* detalhes de rodapés impermeáveis;
* detalhes de juntas;
* detalhes de lajes;
* cortes de piso;
* fotos de infiltração;
* memorial de acabamentos;
* layout de banheiros, cozinhas e áreas técnicas.

## 10.3 O que deve identificar

* banheiros;
* cozinhas;
* lavanderias;
* áreas técnicas;
* sacadas;
* terraços;
* lajes;
* jardineiras;
* ralos;
* rodapés impermeáveis;
* juntas;
* soleiras;
* áreas sujeitas à lavagem;
* pontos de infiltração;
* necessidade de teste;
* necessidade de proteção mecânica.

## 10.4 Raciocínio técnico esperado

Se houver intervenção em piso de área molhada, verificar impermeabilização.

Se houver ralo, verificar tratamento específico.

Se houver revestimento sobre área molhada, verificar sequência: base, impermeabilização, teste, proteção, acabamento.

Se houver laje, sacada ou área externa, verificar sistema adequado e proteção mecânica.

Se houver prazo de obra curto, verificar impacto de cura e teste.

Se a impermeabilização estiver ausente no projeto, o agente deve apontar risco e gerar HITL.

## 10.5 Serviços que deve conseguir gerar

* preparo de base;
* regularização;
* primer;
* argamassa polimérica;
* manta asfáltica;
* membrana líquida;
* impermeabilização flexível;
* tratamento de ralos;
* tratamento de juntas;
* rodapé impermeável;
* teste de estanqueidade;
* proteção mecânica;
* recomposição de acabamento.

## 10.6 O que não pode afirmar

O agente não pode afirmar:

* que impermeabilização é desnecessária sem validação;
* que um sistema é adequado sem especificação;
* que teste pode ser dispensado;
* que infiltração existente está resolvida;
* que garantia é válida sem sistema definido;
* que prazo de cura não impacta cronograma.

## 10.7 HITLs obrigatórios

* área molhada sem impermeabilização indicada;
* sistema não especificado;
* teste de estanqueidade ausente;
* laje/sacada/terraço sem detalhe;
* infiltração existente;
* prazo de cura incompatível;
* proteção mecânica não definida.

---

# 11. Agente Climatização / Exaustão / Ventilação

## 11.1 Competência técnica mínima

O Agente Climatização / Exaustão / Ventilação deve compreender equipamentos, infraestrutura frigorígena, drenos, dutos, grelhas, difusores, exaustores, coifas, renovação de ar, suportes, furações, isolamento térmico, alimentação elétrica e acesso para manutenção.

Ele deve converter sistemas mecânicos em escopo orçamentável e identificar interferências com civil, elétrica, hidráulica, forro, estrutura e PPCI.

## 11.2 Capacidade de leitura documental

Deve conseguir ler:

* projeto de climatização;
* projeto de exaustão;
* projeto de ventilação;
* planta de forro com grelhas;
* layout de evaporadoras;
* layout de condensadoras;
* memorial de climatização;
* especificação de equipamentos;
* detalhes de dutos;
* detalhes de casa de máquinas;
* fotos de área técnica;
* normas de shopping/condomínio quando fornecidas.

## 11.3 O que deve identificar

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
* bases;
* furações;
* isolamento térmico;
* alimentação elétrica;
* pontos de manutenção;
* interferência com forro;
* interferência com PPCI;
* interferência estrutural.

## 11.4 Raciocínio técnico esperado

Se houver evaporadora, verificar linha frigorígena, dreno, alimentação elétrica e acesso.

Se houver condensadora, verificar suporte, base, carga, acesso à área técnica, ventilação e manutenção.

Se houver duto, verificar forro, altura disponível, grelhas, difusores, interferência com sprinklers e estrutura.

Se houver coifa ou exaustão, verificar rota de duto, saída, furação, norma do local e possível aprovação externa.

Se houver shopping, verificar acesso à área técnica, OS, horário permitido e autorização.

Se não houver dreno identificado, gerar risco.

## 11.5 Serviços que deve conseguir gerar

* infraestrutura frigorígena;
* passagem de linhas;
* isolamento de linhas;
* instalação de drenos;
* instalação de evaporadora;
* instalação de condensadora;
* suporte de condensadora;
* base para equipamento;
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

## 11.6 O que não pode afirmar

O agente não pode afirmar:

* que o equipamento está corretamente dimensionado sem projeto;
* que há dreno disponível sem evidência;
* que a área técnica está liberada;
* que a carga elétrica está adequada;
* que dutos cabem no forro sem compatibilização;
* que exaustão está aprovada;
* que manutenção futura está garantida.

## 11.7 HITLs obrigatórios

* equipamento sem especificação;
* dreno indefinido;
* área técnica indefinida;
* suporte/base de condensadora;
* dutos sem compatibilização;
* alimentação elétrica;
* furação estrutural;
* obra em shopping;
* exaustão de cozinha/restaurante;
* acesso de manutenção.

---

# 12. Agente PPCI / Incêndio

## 12.1 Competência técnica mínima

O Agente PPCI / Incêndio deve compreender sistemas de prevenção e combate a incêndio, incluindo sprinklers, hidrantes, extintores, sinalização, iluminação de emergência, detectores, alarme, rotas de fuga, compartimentação, testes, aprovações e exigências externas.

Ele deve tratar PPCI como disciplina crítica em obras comerciais, restaurantes, clínicas, escolas, academias, mercados, shopping centers e locais com público.

## 12.2 Capacidade de leitura documental

Deve conseguir ler:

* projeto PPCI;
* planta de sprinklers;
* planta de hidrantes;
* planta de extintores;
* planta de sinalização;
* planta de iluminação de emergência;
* projeto de alarme;
* projeto de detecção;
* memorial PPCI;
* exigências do Corpo de Bombeiros;
* exigências de shopping;
* exigências de condomínio;
* relatórios de vistoria;
* OS de teste;
* documentação de aprovação.

## 12.3 O que deve identificar

* sprinklers;
* bicos;
* tubulações;
* hidrantes;
* extintores;
* sinalização;
* iluminação de emergência;
* detectores;
* alarme;
* central de alarme;
* rotas de fuga;
* portas corta-fogo;
* compartimentação;
* teste de estanqueidade;
* aprovações;
* documentação pendente;
* interferência com layout;
* interferência com forro;
* interferência com luminárias;
* interferência com climatização.

## 12.4 Raciocínio técnico esperado

Se houver alteração de layout, verificar se PPCI precisa ser revisado.

Se houver novo forro, verificar se sprinklers, detectores e iluminação de emergência permanecem compatíveis.

Se houver luminárias próximas a sprinklers, verificar conflito.

Se houver restaurante, shopping ou local com público, classificar PPCI como crítico.

Se PPCI não estiver aprovado, bloquear consolidação definitiva ou gerar premissa/exclusão explícita.

Se teste for necessário e não estiver previsto, gerar HITL.

## 12.5 Serviços que deve conseguir gerar

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

## 12.6 O que não pode afirmar

O agente não pode afirmar:

* que PPCI está aprovado sem documento;
* que layout está conforme sem validação;
* que sprinkler pode ser removido/remanejado sem projeto;
* que rota de fuga está aprovada;
* que teste é dispensável;
* que Corpo de Bombeiros/shopping aceitará a solução.

## 12.7 HITLs obrigatórios

* PPCI ausente em local crítico;
* PPCI não aprovado;
* alteração de layout;
* conflito sprinkler/luminária;
* forro alterado;
* teste de estanqueidade;
* documentação pendente;
* exigência de shopping/condomínio;
* rota de fuga impactada.

---

# 13. Agente Marcenaria / Mobiliário Técnico

## 13.1 Competência técnica mínima

O Agente Marcenaria / Mobiliário Técnico deve compreender detalhamentos de móveis fixos, painéis, bancadas, nichos, tamponamentos, ferragens, acabamentos, iluminação integrada e interfaces com civil, elétrica, hidráulica e acabamentos.

Ele deve identificar quando o projeto é apenas conceitual e quando possui detalhamento executivo suficiente.

## 13.2 Capacidade de leitura documental

Deve conseguir ler:

* planta de mobiliário;
* detalhamento de marcenaria;
* elevações;
* cortes;
* vistas internas;
* especificação de ferragens;
* memorial de acabamentos;
* imagens de referência;
* layout de interiores;
* detalhes de iluminação integrada;
* detalhes de bancadas.

## 13.3 O que deve identificar

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
* passagens de elétrica;
* passagens hidráulicas;
* encontros com parede;
* encontros com piso;
* encontros com revestimento;
* necessidade de medição final.

## 13.4 Raciocínio técnico esperado

Se houver marcenaria com tomada, cruzar com elétrica.

Se houver bancada molhada, cruzar com hidráulica e impermeabilização.

Se houver iluminação integrada, verificar infraestrutura elétrica, fonte, acionamento e acesso para manutenção.

Se houver apenas imagem de referência sem detalhamento, classificar como orçamento preliminar/verba.

Se houver móvel sob medida, exigir medição final em obra antes de fabricação.

Se houver acabamento não especificado, gerar HITL.

## 13.5 Serviços que deve conseguir gerar

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
* regulagem final;
* medição técnica.

## 13.6 O que não pode afirmar

O agente não pode afirmar:

* que medidas são finais sem medição;
* que ferragens estão definidas sem especificação;
* que acabamento está incluso sem memorial;
* que elétrica para iluminação integrada está prevista;
* que recortes técnicos estão contemplados sem detalhamento;
* que marcenaria está inclusa sem confirmação.

## 13.7 HITLs obrigatórios

* marcenaria sem detalhamento executivo;
* acabamento indefinido;
* ferragens indefinidas;
* iluminação integrada;
* tomada em marcenaria;
* bancada molhada;
* medição final;
* fornecimento/instalação não definidos.

---

# 14. Agente Vidros / Esquadrias / Serralheria

## 14.1 Competência técnica mínima

O Agente Vidros / Esquadrias / Serralheria deve compreender vãos, portas, janelas, guarda-corpos, divisórias, pele de vidro, box, espelhos, caixilhos, ferragens, corrimãos, gradis, estruturas metálicas leves e acabamentos.

Ele deve identificar medidas críticas, tipo de vidro, sistema de abertura, acabamento e necessidade de validação normativa.

## 14.2 Capacidade de leitura documental

Deve conseguir ler:

* planta de esquadrias;
* quadro de esquadrias;
* cortes;
* elevações;
* detalhes de caixilhos;
* detalhes de serralheria;
* memorial de acabamentos;
* imagens de referência;
* fotos de vãos existentes;
* detalhes de fixação;
* especificação de vidro;
* especificação de ferragens.

## 14.3 O que deve identificar

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
* estruturas metálicas leves;
* sistemas de abertura;
* acabamentos;
* medidas de vão;
* necessidade de medição final;
* necessidade de ajuste de vão.

## 14.4 Raciocínio técnico esperado

Se houver esquadria, verificar vão, medida final, tipo de abertura, acabamento, ferragens e instalação.

Se houver vidro, verificar tipo, espessura, fixação, segurança e acabamento.

Se houver guarda-corpo, classificar como item crítico e exigir validação normativa/técnica.

Se houver serralheria, verificar pintura/acabamento, fixação, fabricação e instalação.

Se medidas forem apenas de projeto, marcar necessidade de conferência em obra.

## 14.5 Serviços que deve conseguir gerar

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
* pintura de serralheria;
* medição final;
* regulagem.

## 14.6 O que não pode afirmar

O agente não pode afirmar:

* que medidas são finais sem medição;
* que vidro atende norma sem especificação;
* que guarda-corpo está seguro sem projeto/validação;
* que vão está no prumo;
* que ferragens estão definidas;
* que fornecimento inclui instalação sem confirmação.

## 14.7 HITLs obrigatórios

* medidas finais;
* tipo de vidro;
* guarda-corpo;
* ferragens;
* acabamento;
* fornecimento versus instalação;
* ajuste de vão;
* prazo de fabricação;
* exigência normativa.

---

# 15. Agente Acabamentos

## 15.1 Competência técnica mínima

O Agente Acabamentos deve compreender materiais aparentes, pisos, revestimentos, pinturas, texturas, papel de parede, rodapés, soleiras, filetes, pedras, metais aparentes, louças aparentes, bancadas, rejuntes, arremates, paginações e perdas.

Ele deve cruzar acabamento com base civil, impermeabilização, fornecimento, prazo e padrão de execução.

## 15.2 Capacidade de leitura documental

Deve conseguir ler:

* memorial de acabamentos;
* tabela de materiais;
* planta de paginação de piso;
* planta de paginação de revestimento;
* elevações de paredes;
* projeto de interiores;
* imagens de referência;
* detalhes de bancadas;
* especificações de arquiteto;
* catálogos quando fornecidos;
* fotos de referência.

## 15.3 O que deve identificar

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
* paginações;
* perdas;
* material por ambiente;
* fornecimento;
* base necessária.

## 15.4 Raciocínio técnico esperado

Se houver piso, verificar base, contrapiso, nivelamento, rodapé, soleira e perda.

Se houver revestimento em parede, verificar base, prumo, impermeabilização quando área molhada, paginação e recortes.

Se houver pintura, verificar preparo, massa, fundo, número de demãos e tipo de tinta.

Se houver pedra/bancada, verificar medição final, recortes, cuba, acabamento e instalação.

Se material não estiver especificado, classificar como pendente ou verba.

Se material for de alto padrão, exigir fornecedor/modelo ou premissa.

## 15.5 Serviços que deve conseguir gerar

* preparo de base;
* assentamento de piso;
* assentamento de revestimento;
* rejuntamento;
* instalação de rodapé;
* instalação de soleira;
* instalação de filete;
* instalação de pedra;
* instalação de bancada;
* pintura acrílica;
* pintura esmalte;
* textura;
* papel de parede;
* proteção de acabamento;
* limpeza final.

## 15.6 O que não pode afirmar

O agente não pode afirmar:

* que material está incluso sem confirmação;
* que percentual de perda está correto sem validação;
* que base está adequada sem análise;
* que paginação é executiva sem documento;
* que fornecedor/modelo está definido sem memorial;
* que prazo de entrega é compatível sem validação.

## 15.7 HITLs obrigatórios

* material sem especificação;
* fornecimento indefinido;
* paginação ausente;
* percentual de perda;
* base inadequada;
* pedra/bancada sem medição;
* material alto padrão;
* conflito entre memorial e planta.

---

# 16. Agente Documentação / Aprovações

## 16.1 Competência técnica mínima

O Agente Documentação / Aprovações deve compreender exigências de obra relacionadas a ART, RRT, alvará, PPCI, as built, laudos, aprovações de condomínio, shopping, prefeitura, Corpo de Bombeiros, taxas, licenças, autorizações, normas internas e responsabilidade técnica.

Ele deve identificar custos e riscos burocráticos que impactam escopo, prazo e proposta.

## 16.2 Capacidade de leitura documental

Deve conseguir ler:

* regulamento de condomínio;
* manual de obra;
* exigências de shopping;
* e-mails de aprovação;
* checklists de fiscalização;
* ART;
* RRT;
* alvarás;
* PPCI;
* laudos;
* protocolos;
* normas internas;
* documentos de liberação;
* solicitações de as built;
* relatórios de vistoria.

## 16.3 O que deve identificar

* necessidade de ART/RRT;
* necessidade de alvará;
* necessidade de PPCI aprovado;
* necessidade de as built;
* necessidade de laudo;
* necessidade de seguro;
* necessidade de OS;
* horário permitido;
* normas de acesso;
* taxas;
* documentos obrigatórios;
* aprovações pendentes;
* responsável por protocolo;
* risco de atraso externo.

## 16.4 Raciocínio técnico esperado

Se obra for em shopping, verificar aprovação, OS, horários, fiscalização, documentação, PPCI e taxas.

Se obra for em condomínio, verificar manual, ART/RRT, horários, proteção de áreas comuns e autorização.

Se houver alteração técnica relevante, verificar responsabilidade técnica.

Se houver exigência de as built, incluir ou excluir explicitamente.

Se taxas externas não estiverem definidas, gerar exclusão/premissa/HITL.

## 16.5 Serviços que deve conseguir gerar

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

## 16.6 O que não pode afirmar

O agente não pode afirmar:

* que obra está liberada sem documento;
* que ART/RRT não é necessária;
* que shopping/condomínio aprovará;
* que taxas estão inclusas;
* que as built não será exigido;
* que responsabilidade técnica está coberta sem definição.

## 16.7 HITLs obrigatórios

* ausência de ART/RRT;
* necessidade de aprovação externa;
* taxas indefinidas;
* as built;
* laudos;
* PPCI aprovado;
* responsabilidade por protocolo;
* horários restritos;
* fiscalização externa.

---

# 17. Agente Administração / Gestão de Obra

## 17.1 Competência técnica mínima

O Agente Administração / Gestão de Obra deve compreender custos indiretos, coordenação de equipes, planejamento, compras, reuniões, visitas técnicas, fiscalização, relatórios, deslocamento, estacionamento, obra noturna, logística, aprovações externas, comunicação com cliente e gestão de terceiros.

Sua função é impedir que a gestão da obra fique invisível no orçamento.

## 17.2 Capacidade de leitura contextual

Deve conseguir interpretar:

* tipo de obra;
* padrão de acabamento;
* complexidade;
* quantidade de equipes;
* prazo estimado;
* necessidade de compras;
* necessidade de visitas;
* distância;
* horário de execução;
* shopping;
* condomínio;
* ambiente em funcionamento;
* cliente exigente;
* exigência de relatórios;
* grau de coordenação entre terceiros.

## 17.3 O que deve identificar

* necessidade de administração;
* visitas técnicas;
* coordenação de equipes;
* reuniões;
* relatórios;
* fiscalização;
* deslocamento;
* estacionamento;
* obra noturna;
* liberações;
* compras;
* controle de fornecedores;
* controle de cronograma;
* comunicação diária;
* margem de risco operacional.

## 17.4 Raciocínio técnico esperado

Se a obra tiver múltiplas equipes, gerar escopo de coordenação.

Se a obra for em shopping, incluir esforço de liberação, OS, fiscalização, horário noturno e estacionamento.

Se a obra for noturna, aplicar acréscimo ou HITL comercial.

Se houver muitos terceiros do cliente, considerar coordenação como custo.

Se houver exigência de relatórios, considerar tempo administrativo.

Se a administração não for cobrada, registrar risco financeiro/comercial.

## 17.5 Serviços que deve conseguir gerar

* administração de obra;
* gestão técnica;
* coordenação de equipes;
* planejamento;
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

## 17.6 O que não pode afirmar

O agente não pode afirmar:

* que gestão está embutida sem decisão comercial;
* que visitas não serão necessárias;
* que obra noturna não tem impacto;
* que estacionamento/deslocamento são irrelevantes;
* que coordenação de terceiros não tem custo;
* que relatórios são automáticos sem esforço.

## 17.7 HITLs obrigatórios

* administração separada ou embutida;
* cobrança mensal ou percentual;
* frequência de visitas;
* obra noturna;
* shopping/condomínio;
* relatórios;
* reuniões;
* deslocamento e estacionamento;
* coordenação de terceiros.

---

# 18. Agente Compatibilização Técnica

## 18.1 Competência técnica mínima

O Agente Compatibilização Técnica deve compreender a interação entre disciplinas e identificar conflitos, lacunas, omissões e riscos integrados.

Ele é obrigatório sempre que houver mais de uma disciplina relevante.

## 18.2 Capacidade de leitura cruzada

Deve conseguir cruzar:

* arquitetura x estrutura;
* arquitetura x elétrica;
* arquitetura x hidráulica;
* arquitetura x climatização;
* arquitetura x PPCI;
* forro x elétrica;
* forro x climatização;
* forro x sprinklers;
* marcenaria x elétrica;
* marcenaria x hidráulica;
* acabamento x base civil;
* impermeabilização x hidráulica;
* layout x rota de fuga;
* memorial x planta;
* proposta x escopo técnico.

## 18.3 O que deve identificar

* conflitos entre disciplinas;
* disciplina ausente;
* projeto incompleto;
* serviço necessário não orçado;
* conflito físico;
* conflito de sequência;
* conflito de responsabilidade;
* conflito de fornecimento;
* risco de aditivo;
* risco de atraso;
* premissa necessária;
* exclusão necessária.

## 18.4 Raciocínio técnico esperado

Se há forro novo, cruzar com elétrica, luminárias, climatização, sprinklers, detectores e acessos de manutenção.

Se há marcenaria, cruzar com tomadas, iluminação, hidráulica, revestimentos e medidas finais.

Se há alteração de layout, cruzar com PPCI, rotas de fuga, elétrica, hidráulica e climatização.

Se há revestimento, cruzar com base, impermeabilização, paginação e louças/metais.

Se há demolição, cruzar com estrutura, elétrica, hidráulica e recomposição.

Se uma disciplina essencial estiver ausente, apontar risco de orçamento preliminar.

## 18.5 Saídas que deve gerar

* matriz de conflitos;
* lacunas de projeto;
* riscos integrados;
* impactos financeiros;
* impactos de prazo;
* HITLs obrigatórios;
* ações recomendadas;
* premissas;
* exclusões;
* bloqueios de consolidação.

## 18.6 O que não pode afirmar

O agente não pode afirmar:

* que projetos estão compatibilizados sem cruzamento;
* que ausência de conflito significa ausência de risco;
* que disciplina ausente não impacta custo;
* que execução é viável sem validação;
* que solução técnica é definitiva sem responsável técnico.

## 18.7 HITLs obrigatórios

* conflito entre disciplinas;
* disciplina ausente;
* projeto contraditório;
* PPCI versus layout;
* forro versus climatização/PPCI;
* marcenaria versus elétrica/hidráulica;
* demolição versus estrutura;
* memorial versus planta;
* escopo técnico versus proposta comercial.

---

# 19. Agente Comparativo de Propostas

## 19.1 Competência técnica mínima

O Agente Comparativo de Propostas deve compreender estrutura de orçamento, escopo, unidades, fornecimento, mão de obra, material, premissas, exclusões e diferenças comerciais entre propostas.

Sua função é comparar orçamentos de forma técnica, não apenas por valor final.

## 19.2 Capacidade de leitura documental

Deve conseguir ler:

* orçamento de concorrente;
* orçamento antigo;
* planilha externa;
* proposta comercial;
* memorial comparativo;
* escopo enviado pelo cliente;
* lista de serviços;
* composição resumida;
* valores globais;
* observações e exclusões.

## 19.3 O que deve identificar

* itens existentes no EVIS e ausentes no terceiro;
* itens existentes no terceiro e ausentes no EVIS;
* unidades diferentes;
* quantidades diferentes;
* fornecimento diferente;
* mão de obra versus material;
* itens genéricos;
* itens sem premissa;
* valores fora de curva;
* administração omitida;
* descarte omitido;
* proteção omitida;
* documentação omitida;
* proposta não comparável.

## 19.4 Raciocínio técnico esperado

Se o concorrente está mais barato, verificar se o escopo é equivalente.

Se há item genérico, identificar risco de exclusão escondida.

Se uma proposta inclui material e outra apenas mão de obra, não comparar valores como equivalentes.

Se administração, proteção, descarte, limpeza ou documentação não aparecem, apontar possível distorção.

Se valor unitário estiver fora de curva, marcar para revisão.

## 19.5 Saídas que deve gerar

* matriz comparativa;
* diferenças técnicas;
* diferenças financeiras;
* riscos de comparação;
* itens omitidos;
* argumentos comerciais;
* perguntas para o cliente;
* pontos de defesa da proposta EVIS.

## 19.6 O que não pode afirmar

O agente não pode afirmar:

* que concorrente está errado sem evidência;
* que preço menor é necessariamente problema;
* que propostas são equivalentes sem escopo igual;
* que item está incluso se não está escrito;
* que valor é inviável sem base comparativa.

## 19.7 HITLs obrigatórios

* escopo divergente;
* item de alto valor ausente;
* fornecimento diferente;
* administração omitida;
* material indefinido;
* proposta genérica;
* valor fora de curva;
* decisão comercial sobre argumento ao cliente.

---

# 20. Limites Técnicos Gerais dos Agentes

Nenhum agente pode:

* substituir responsável técnico;
* validar segurança estrutural;
* garantir aprovação externa;
* afirmar conformidade normativa definitiva;
* assumir fornecimento sem confirmação;
* assumir escopo sem evidência;
* transformar inferência em fato;
* consolidar risco crítico sem HITL;
* gerar custo definitivo sem fonte;
* gerar quantidade definitiva sem origem;
* misturar pré-obra com execução real.

---

# 21. Frases Técnicas Obrigatórias

Quando faltar informação, os agentes devem usar linguagem objetiva.

## Usar

```text
Informação não identificada nos arquivos recebidos.
Item inferido tecnicamente.
Validação HITL obrigatória.
Pode impactar custo final.
Pode impactar prazo.
Pode impactar responsabilidade técnica.
Não é possível consolidar como definitivo sem validação.
```

## Evitar

```text
Aparentemente está tudo certo.
Provavelmente não terá problema.
Pode seguir sem risco.
Esse item é simples.
Não precisa validar.
```

---

# 22. Checklist de Competência Técnica

Cada agente será considerado tecnicamente funcional quando conseguir:

* ler documentos da própria disciplina;
* identificar elementos técnicos relevantes;
* diferenciar item direto de inferência;
* gerar serviço orçamentável;
* sugerir unidade de medição;
* apontar quantitativo possível;
* apontar origem da informação;
* apontar nível de confiança;
* identificar risco técnico;
* identificar risco financeiro;
* identificar interferências;
* gerar HITL;
* respeitar limites técnicos;
* não assumir responsabilidade indevida.

---

# 23. Critério de Sucesso

O arquivo de Competências Técnicas estará corretamente incorporado quando o Orçamentista IA conseguir operar como um conjunto de especialistas técnicos de pré-orçamento, cada um com leitura disciplinar própria, capacidade de identificar riscos, transformar projeto em escopo orçamentável e acionar validação humana sempre que a informação não for suficiente para decisão definitiva.

---

# 24. Frase Canônica Final

As Competências Técnicas dos Agentes do Orçamentista IA EVIS definem a capacidade mínima de leitura, interpretação, decomposição de escopo, identificação de riscos e acionamento de validação humana de cada especialista do sistema.

Cada agente deve operar com conhecimento técnico suficiente para apoiar o orçamento, mas com limites claros para não assumir responsabilidade profissional indevida.

A IA interpreta.

O agente estrutura.

O usuário valida.

O sistema consolida.
