# EVIS — ORÇAMENTISTA IA

## Documento Canônico Técnico-Funcional

**Status:** Documento canônico oficial  
**Módulo:** Orçamentista IA  
**Área:** Pré-obra / Oportunidade / Proposta  
**Sistema:** EVIS  
**Última revisão:** a definir  
**Responsável conceitual:** Evandro / EVIS  

---

# 1. Definição Canônica

O **Orçamentista IA EVIS** é um motor técnico-comercial de pré-obra, responsável por transformar arquivos brutos, projetos, memoriais, imagens, textos e informações comerciais em uma estrutura orçamentária auditável, validável e pronta para proposta.

O Orçamentista IA **não é um chat genérico**.

Ele deve funcionar como um **pipeline multiagente**, composto por agentes especializados de leitura, interpretação técnica, estruturação de escopo, quantitativos, custos, auditoria, validação humana e geração de proposta.

Sua função é preparar tecnicamente a obra antes da contratação.

---

# 2. Posição no Fluxo Oficial do EVIS

O Orçamentista IA ocupa uma posição específica e inviolável dentro do fluxo do EVIS.

## Fluxo obrigatório

```text
Lead / Oportunidade
→ Orçamentista IA
→ Proposta
→ Conversão em Obra
→ Diário de Obra IA
→ Medições / Execução / Relatórios
```

## Regra central

O Orçamentista IA existe **antes da Obra** e **antes do Diário de Obra IA**.

Ele opera dentro da etapa de **Oportunidade** e sua saída principal é uma base técnica-comercial para geração de proposta.

---

# 3. Separação entre Orçamentista IA e Diário de Obra IA

## 3.1 Orçamentista IA

O Orçamentista IA pertence à fase de pré-obra.

Responsabilidades:

* interpretar arquivos de projeto;
* organizar escopo;
* identificar ambientes;
* identificar serviços;
* gerar quantitativos;
* aplicar composições de custo;
* apontar pendências;
* apontar riscos técnicos;
* apontar riscos financeiros;
* gerar cronograma inicial;
* preparar base para proposta;
* apoiar decisão comercial antes da contratação.

## 3.2 Diário de Obra IA

O Diário de Obra IA pertence à fase de obra ativa.

Responsabilidades:

* receber relatos diários;
* interpretar execução real;
* atualizar avanço físico;
* sugerir impactos no cronograma;
* sugerir impactos em custo;
* alimentar relatórios;
* apoiar medições;
* registrar evidências da execução.

## 3.3 Proibição Crítica

O Orçamentista IA **não pode executar funções do Diário de Obra IA**.

É proibido ao Orçamentista IA:

* atualizar progresso físico real;
* criar medições de obra executada;
* escrever em tabelas operacionais da obra;
* interpretar diário de obra;
* gerar relatório semanal de execução;
* registrar produtividade real;
* alterar cronograma executado;
* alimentar pagamento de equipes da obra ativa.

---

# 4. Função Principal

A função principal do Orçamentista IA é transformar arquivos e informações preliminares em um orçamento estruturado, validado e pronto para proposta.

## Entrada

O Orçamentista IA pode receber:

* PDFs de plantas;
* PDFs de memoriais;
* imagens;
* fotos do local;
* prints de projeto;
* texto livre do usuário;
* dados comerciais da oportunidade;
* orçamento de terceiros;
* planilhas de referência;
* futuramente arquivos DWG ou IFC.

## Saída

O Orçamentista IA deve gerar:

* estrutura de ambientes;
* estrutura de serviços;
* quantitativos;
* composições de custos;
* cronograma inicial;
* lista de pendências;
* lista de riscos;
* validações HITL;
* base técnica para proposta;
* escopo incluso;
* escopo excluído;
* premissas comerciais.

---

# 5. Princípios de Funcionamento

## 5.1 Estruturação antes de cálculo

O sistema não deve calcular custos antes de estruturar o escopo.

A ordem correta é:

```text
Leitura
→ Interpretação
→ Classificação
→ Ambientes
→ Serviços
→ Quantitativos
→ Custos
→ Auditoria
→ Validação HITL
→ Cronograma
→ Proposta
```

## 5.2 Nada é definitivo sem origem

Toda informação relevante deve ter origem rastreável.

Exemplos de origem:

* arquivo PDF;
* prancha;
* memorial;
* imagem;
* texto do usuário;
* inferência técnica;
* base própria;
* SINAPI;
* fornecedor;
* histórico de obra;
* validação humana.

## 5.3 Inferência não é fato

O sistema pode inferir tecnicamente, mas deve marcar a inferência como inferência.

Exemplo:

```text
Serviço: execução de infraestrutura elétrica para novos pontos
Status: inferido
Motivo: há novos pontos indicados em layout, mas não há projeto elétrico executivo
Confiança: média
HITL: obrigatório
```

## 5.4 Omissão é risco

Quando um documento, disciplina ou informação estiver ausente, isso deve ser registrado como pendência ou risco.

O sistema nunca deve fingir completude.

---

# 6. Arquitetura Multiagente

O Orçamentista IA deve funcionar como um pipeline multiagente.

## Pipeline canônico

```text
Input Handler
→ Reader Multimodal
→ Classificador de Documentos
→ Planner Técnico
→ Agentes de Domínio
→ Agente Quantitativo
→ Agente de Custos
→ Agente BDI / Encargos / Margem
→ Auditor Técnico-Orçamentário
→ Agente de Cronograma Inicial
→ Agente Gerador de Proposta
→ HITL Review
→ Consolidação
```

---

# 7. Input Handler

## Função

Receber, organizar e preparar os dados enviados pelo usuário.

## Responsabilidades

* registrar arquivos recebidos;
* preservar nomes originais dos arquivos;
* associar arquivos à oportunidade;
* identificar tipo de arquivo;
* separar documentos técnicos de documentos comerciais;
* criar lote de análise;
* detectar ausência de arquivos esperados;
* preparar o material para leitura multimodal.

## Saída mínima

```text
Arquivo:
- nome_original
- tipo
- disciplina provável
- status de leitura
- observações
```

## Restrição

O Input Handler não interpreta tecnicamente o projeto.
Ele apenas organiza a entrada.

---

# 8. Reader Multimodal

## Função

Ler tecnicamente os arquivos recebidos.

## Responsabilidades

* extrair texto de PDFs;
* interpretar imagens;
* identificar títulos de pranchas;
* identificar escalas;
* identificar ambientes;
* identificar cotas;
* identificar legendas;
* identificar tabelas;
* identificar notas técnicas;
* identificar símbolos aparentes;
* identificar elementos construtivos;
* marcar pontos ilegíveis;
* marcar leitura parcial quando necessário.

## Saída mínima

```text
Elementos identificados:
- ambientes
- medidas aparentes
- notas técnicas
- tabelas
- legendas
- disciplinas
- elementos construtivos
- pontos ambíguos
```

## Restrição

O Reader não gera orçamento.
Ele apenas transforma arquivo bruto em informação legível.

---

# 9. Classificador de Documentos

## Função

Classificar cada arquivo ou prancha por disciplina.

## Classificações possíveis

* arquitetura;
* layout;
* demolição;
* construção;
* forro;
* paginação;
* revestimentos;
* luminotécnico;
* elétrica;
* hidráulica;
* sanitário;
* estrutural;
* PPCI;
* climatização;
* exaustão;
* marcenaria;
* serralheria;
* memorial;
* orçamento de terceiro;
* foto de local;
* documento comercial;
* documento indefinido.

## Saída mínima

```text
Documento:
- nome
- disciplina provável
- confiança
- justificativa
- agentes que devem ser acionados
```

## Regra crítica

Somente os agentes relevantes devem ser acionados.

Se não houver documento de determinada disciplina, o sistema não deve inventar escopo como se houvesse projeto.

---

# 10. Planner Técnico

## Função

Transformar a leitura inicial em uma estrutura lógica de orçamento.

## Responsabilidades

* organizar ambientes;
* organizar disciplinas;
* criar árvore de escopo;
* separar serviços por categoria;
* identificar macroetapas;
* separar execução, fornecimento, instalação, administração e documentação;
* preparar base para os agentes de domínio.

## Estrutura lógica mínima

```text
Obra / Oportunidade
→ Ambientes
→ Categorias
→ Serviços
→ Itens orçamentários
```

## Restrição

O Planner não deve precificar.
Ele estrutura o orçamento antes dos cálculos.

---

# 11. Agentes de Domínio

Os agentes de domínio são especialistas técnicos por disciplina.

Eles não são apenas classificadores de categoria.

Eles devem atuar como especialistas técnicos de leitura e interpretação de projetos de engenharia, arquitetura e disciplinas complementares, responsáveis por converter documentos técnicos em escopo orçamentável auditável.

## Função real

Cada agente de domínio deve ser capaz de interpretar:

* plantas;
* cortes;
* elevações;
* memoriais;
* detalhes construtivos;
* legendas;
* tabelas;
* notas técnicas;
* simbologias;
* quantitativos aparentes;
* incompatibilidades entre disciplinas.

## Agentes obrigatórios

* Civil / Arquitetônico;
* Estrutural;
* Elétrica / Dados / Automação;
* Hidrossanitário;
* Impermeabilização;
* Climatização / Exaustão / Ventilação;
* PPCI / Incêndio;
* Marcenaria / Mobiliário Técnico;
* Vidros / Esquadrias / Serralheria;
* Acabamentos;
* Documentação / Aprovações;
* Administração / Gestão de Obra;
* Compatibilização Técnica.

---

# 12. Regra Padrão dos Agentes de Domínio

Todos os agentes devem devolver obrigatoriamente:

```text
1. Itens identificados diretamente no projeto
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

## Níveis de confiança

```text
ALTO
Informação clara em projeto, memorial ou dado validado pelo usuário.

MÉDIO
Informação inferida a partir de elementos técnicos razoáveis.

BAIXO
Informação incerta, ilegível, incompleta ou dependente de confirmação.
```

---

# 13. Agente Civil / Arquitetônico

## Lê e interpreta

* planta baixa;
* layout;
* demolição;
* construção;
* alvenaria;
* drywall;
* forro;
* revestimentos;
* pisos;
* pintura;
* bancadas;
* esquadrias;
* portas;
* detalhes arquitetônicos;
* cortes;
* elevações;
* quadro de áreas;
* memorial descritivo.

## Entrega

* ambientes;
* áreas;
* acabamentos por ambiente;
* serviços civis;
* demolições;
* construções;
* fechamentos;
* interferências com outras disciplinas;
* itens pendentes de especificação.

## Serviços possíveis

* proteção de área;
* isolamento de obra;
* demolição;
* remoção;
* descarte;
* alvenaria;
* drywall;
* forro;
* contrapiso;
* regularização;
* emboço;
* reboco;
* massa corrida;
* pintura;
* assentamento de piso;
* assentamento de revestimento;
* rodapé;
* soleira;
* limpeza técnica.

## HITL típico

* confirmar áreas;
* confirmar escopo de demolição;
* confirmar se descarte está incluso;
* confirmar padrão de acabamento;
* confirmar fornecimento de materiais;
* confirmar horário de execução.

---

# 14. Agente Estrutural

## Lê e interpreta

* fundações;
* pilares;
* vigas;
* lajes;
* reforços;
* aberturas estruturais;
* demolições com risco estrutural;
* projetos de concreto;
* estrutura metálica;
* estrutura de madeira;
* bases para equipamentos;
* cargas especiais.

## Entrega

* escopo estrutural;
* quantitativos preliminares;
* riscos técnicos;
* riscos de intervenção;
* necessidade de ART/RRT;
* pontos que exigem validação de engenheiro.

## Serviços possíveis

* reforço estrutural;
* base de equipamento;
* chumbadores;
* estrutura metálica auxiliar;
* corte técnico;
* furação técnica;
* recuperação estrutural;
* laudo;
* ART/RRT estrutural.

## Regra crítica

Se houver risco estrutural, o sistema deve travar a consolidação até validação técnica.

---

# 15. Agente Elétrica / Dados / Automação

## Lê e interpreta

* pontos elétricos;
* tomadas;
* interruptores;
* luminárias;
* quadros;
* circuitos;
* cargas;
* eletrodutos;
* eletrocalhas;
* perfilados;
* infraestrutura seca;
* dados;
* CFTV;
* som;
* automação;
* rede;
* sensores;
* comandos;
* quadro de cargas;
* memorial elétrico.

## Entrega

* pontos por ambiente;
* circuitos identificados;
* infraestrutura necessária;
* cargas aparentes;
* itens sem carga definida;
* pendências de projeto executivo;
* incompatibilidades.

## Serviços possíveis

* infraestrutura elétrica;
* passagem de eletrodutos;
* instalação de caixas;
* passagem de cabos;
* montagem de quadro;
* instalação de disjuntores;
* instalação de tomadas;
* instalação de interruptores;
* instalação de luminárias;
* infraestrutura de rede;
* infraestrutura de CFTV;
* testes elétricos.

## HITL típico

* confirmar se luminárias estão inclusas;
* confirmar se quadro existente comporta carga;
* confirmar se automação está inclusa;
* confirmar padrão de tomadas;
* confirmar fornecimento de materiais.

---

# 16. Agente Hidrossanitário

## Lê e interpreta

* água fria;
* água quente;
* esgoto;
* ventilação;
* ralos;
* caixas sifonadas;
* prumadas;
* registros;
* louças;
* metais;
* pontos hidráulicos;
* pontos sanitários;
* drenos;
* testes necessários.

## Entrega

* pontos hidráulicos;
* redes aparentes ou embutidas;
* serviços de instalação;
* testes;
* interferências com civil, piso, parede, shaft e forro.

## Serviços possíveis

* infraestrutura de água fria;
* infraestrutura de água quente;
* infraestrutura de esgoto;
* instalação de ralos;
* instalação de caixas sifonadas;
* ligação em prumada;
* instalação de registros;
* instalação de louças;
* instalação de metais;
* teste de estanqueidade;
* adequação de pontos.

## HITL típico

* confirmar alteração de pontos;
* confirmar acesso às prumadas;
* confirmar fornecimento de louças e metais;
* confirmar se impermeabilização está inclusa;
* confirmar se testes estão inclusos.

---

# 17. Agente Impermeabilização

## Lê e interpreta

* áreas molhadas;
* banheiros;
* cozinhas;
* áreas técnicas;
* áreas externas;
* lajes;
* sacadas;
* jardineiras;
* ralos;
* rodapés impermeáveis;
* detalhes de manta;
* memorial de impermeabilização.

## Entrega

* áreas impermeabilizáveis;
* sistema sugerido ou especificado;
* serviços necessários;
* testes necessários;
* riscos de infiltração;
* interfaces com hidráulica e revestimentos.

## Serviços possíveis

* regularização de base;
* primer;
* manta asfáltica;
* argamassa polimérica;
* impermeabilização flexível;
* teste de estanqueidade;
* proteção mecânica;
* tratamento de ralos;
* tratamento de juntas.

---

# 18. Agente Climatização / Exaustão / Ventilação

## Lê e interpreta

* evaporadoras;
* condensadoras;
* drenos;
* linhas frigorígenas;
* dutos;
* grelhas;
* difusores;
* exaustores;
* renovação de ar;
* casas de máquinas;
* suportes;
* furações;
* interferências no forro;
* memorial de climatização.

## Entrega

* equipamentos;
* infraestrutura;
* linhas;
* drenos;
* furações;
* suportes;
* impactos em forro, elétrica, hidráulica e estrutura.

## Serviços possíveis

* infraestrutura frigorígena;
* instalação de dreno;
* instalação de evaporadora;
* instalação de condensadora;
* instalação de dutos;
* instalação de grelhas;
* instalação de exaustor;
* isolamento térmico;
* teste de sistema;
* carga de gás;
* adequação elétrica.

---

# 19. Agente PPCI / Incêndio

## Lê e interpreta

* sprinklers;
* hidrantes;
* extintores;
* iluminação de emergência;
* sinalização;
* detectores;
* alarme;
* rotas de fuga;
* compartimentação;
* portas corta-fogo;
* tubulações;
* bicos;
* testes de estanqueidade;
* exigências de shopping;
* exigências de condomínio;
* exigências do Corpo de Bombeiros.

## Entrega

* serviços de incêndio;
* adequações obrigatórias;
* testes;
* documentação pendente;
* riscos de aprovação;
* interferências com forro, luminárias, climatização e layout.

## Serviços possíveis

* remanejamento de sprinklers;
* instalação de bicos;
* instalação de tubulação;
* instalação de extintores;
* instalação de sinalização;
* iluminação de emergência;
* detectores;
* alarme;
* teste de estanqueidade;
* documentação;
* acompanhamento de vistoria.

## Regra crítica

Em shopping, restaurante, clínica ou local com público, PPCI deve ser tratado como disciplina crítica.

---

# 20. Agente Marcenaria / Mobiliário Técnico

## Lê e interpreta

* bancadas;
* armários;
* painéis;
* nichos;
* móveis fixos;
* detalhamentos;
* acabamentos;
* ferragens;
* encaixes com civil;
* encaixes com elétrica;
* iluminação integrada;
* cortes;
* elevações.

## Entrega

* peças;
* dimensões quando identificáveis;
* acabamentos;
* pendências de detalhamento;
* interferências com tomadas, iluminação, hidráulica e revestimentos.

## Serviços possíveis

* fabricação de móvel;
* instalação de móvel;
* painel;
* bancada;
* tamponamento;
* nicho;
* ferragens;
* recortes técnicos;
* ajustes em obra;
* iluminação integrada.

---

# 21. Agente Vidros / Esquadrias / Serralheria

## Lê e interpreta

* portas;
* janelas;
* guarda-corpos;
* peles de vidro;
* divisórias;
* caixilhos;
* ferragens;
* esquadrias metálicas;
* esquadrias de alumínio;
* serralheria;
* corrimãos;
* gradis;
* vãos.

## Entrega

* vãos;
* peças;
* medidas;
* sistemas;
* acabamentos;
* pendências de especificação.

## Serviços possíveis

* fornecimento de esquadria;
* instalação de esquadria;
* vidro temperado;
* vidro laminado;
* divisória de vidro;
* guarda-corpo;
* estrutura metálica;
* porta metálica;
* corrimão;
* ajustes de vão.

---

# 22. Agente Acabamentos

## Lê e interpreta

* paginação de pisos;
* paginação de revestimentos;
* pintura;
* rodapés;
* soleiras;
* filetes;
* pedras;
* metais aparentes;
* especificações por ambiente;
* memorial de acabamentos;
* tabela de materiais.

## Entrega

* materiais por ambiente;
* áreas estimadas;
* perdas;
* pontos sem especificação;
* conflitos entre memorial e planta;
* serviços de acabamento.

## Serviços possíveis

* assentamento de piso;
* assentamento de revestimento;
* rejuntamento;
* instalação de rodapé;
* instalação de soleira;
* instalação de pedra;
* pintura;
* textura;
* preparo de base;
* proteção de acabamento.

---

# 23. Agente Documentação / Aprovações

## Lê e interpreta

* exigências de condomínio;
* exigências de shopping;
* alvarás;
* ART;
* RRT;
* PPCI;
* documentação técnica;
* licenças;
* autorizações;
* normas internas;
* necessidade de as built.

## Entrega

* documentação necessária;
* aprovações pendentes;
* custos administrativos;
* riscos burocráticos;
* impacto no início da obra.

## Serviços possíveis

* ART/RRT;
* atualização de projeto;
* as built;
* compatibilização documental;
* acompanhamento de aprovação;
* emissão de laudo;
* organização de anexos;
* protocolo em shopping/condomínio.

---

# 24. Agente Administração / Gestão de Obra

## Função

Identificar custos de administração, gestão e coordenação da obra.

## Considera

* complexidade;
* duração;
* visitas técnicas;
* obra noturna;
* shopping;
* condomínio;
* múltiplas equipes;
* fiscalização;
* comunicação com cliente;
* compras;
* reuniões;
* relatórios;
* deslocamento;
* estacionamento;
* acompanhamento técnico.

## Serviços possíveis

* administração de obra;
* coordenação de equipes;
* gestão técnica;
* planejamento;
* reuniões;
* acompanhamento de shopping;
* emissão de relatórios;
* controle de cronograma;
* controle de fornecedores;
* mobilização administrativa.

---

# 25. Agente Compatibilização Técnica

## Função

Cruzar as leituras dos demais agentes e identificar conflitos.

Esse agente é obrigatório.

## Verifica

* elétrica passando onde há hidráulica;
* forro incompatível com climatização;
* sprinklers conflitantes com luminárias;
* exaustão interferindo em estrutura;
* revestimento sem base civil prevista;
* ambiente presente na arquitetura e ausente nos complementares;
* projeto executivo incompleto;
* diferença entre memorial e planta;
* marcenaria conflitante com tomadas;
* layout conflitante com rota de fuga;
* PPCI conflitante com forro ou iluminação.

## Entrega

* matriz de conflitos;
* lacunas;
* riscos financeiros;
* riscos técnicos;
* validações HITL obrigatórias.

## Saída mínima

```text
Conflito:
- Disciplina A
- Disciplina B
- Descrição
- Impacto técnico
- Impacto financeiro
- Impacto no prazo
- Validação necessária
```

---

# 26. Agente Quantitativo

## Função

Transformar serviços em quantidades mensuráveis.

## Unidades possíveis

* m²;
* m³;
* ml;
* unidade;
* ponto;
* conjunto;
* verba;
* diária;
* mês;
* percentual;
* hora;
* kg;
* tonelada.

## Tipos de quantitativo

```text
Medido:
extraído diretamente de projeto.

Calculado:
derivado de medidas identificadas.

Estimado:
usado quando não há dados suficientes.

Verba:
reservado para item sem definição completa.

Pendente:
depende de validação.
```

## Regra crítica

Toda quantidade deve ter origem e nível de confiança.

---

# 27. Agente de Custos

## Função

Aplicar custos aos serviços estruturados.

## Fontes possíveis

* base própria;
* composições internas;
* histórico de obras;
* SINAPI;
* fornecedores;
* valor informado pelo usuário;
* verba estimada;
* custo manual.

## Campos mínimos

```text
Serviço
Unidade
Quantidade
Custo unitário
Custo total
Fonte do custo
Confiança
Observações
```

## Regra crítica

O Agente de Custos não deve esconder quando o preço é estimado.

---

# 28. Agente BDI / Encargos / Margem

## Função

Transformar custo direto em preço de venda.

## Componentes possíveis

* mão de obra;
* material;
* equipamentos;
* ferramentas;
* deslocamento;
* estacionamento;
* descarte;
* administração;
* risco;
* impostos;
* margem;
* BDI;
* taxa de urgência;
* taxa de obra noturna;
* taxa de shopping/condomínio.

## Responsabilidades

* separar custo direto e preço de venda;
* aplicar margem global ou por categoria;
* aplicar BDI global ou por item;
* destacar itens de risco;
* permitir simulação comercial;
* permitir override humano.

---

# 29. Auditor Técnico-Orçamentário

## Função

Auditar a coerência do orçamento antes da consolidação.

## Verifica

* serviços duplicados;
* serviços ausentes;
* serviços sem unidade;
* serviços sem quantidade;
* serviços sem custo;
* quantidade incompatível;
* categoria errada;
* disciplina ausente;
* escopo sem base técnica;
* custo com baixa confiança;
* conflitos entre agentes;
* riscos não tratados;
* itens que exigem HITL.

## Níveis de gravidade

```text
BAIXA:
ajuste de descrição ou classificação.

MÉDIA:
pode afetar clareza ou pequena variação de custo.

ALTA:
pode afetar preço, prazo, contrato ou responsabilidade técnica.

CRÍTICA:
impede consolidação confiável.
```

---

# 30. Cronograma Inicial

## Função

Criar cronograma preliminar a partir do escopo orçamentário.

## Macroetapas típicas

```text
1. Mobilização
2. Proteções
3. Demolições / Remoções
4. Infraestrutura
5. Fechamentos
6. Revestimentos / Acabamentos
7. Instalações finais
8. Testes
9. Limpeza
10. Entrega
```

## Campos mínimos

```text
Serviço
Categoria
Equipe
Duração estimada
Dependência
Ordem lógica
Observações
```

## Regra crítica

O cronograma do Orçamentista é preliminar.
Ele não representa execução real até a conversão em obra.

---

# 31. HITL — Human in the Loop

## Regra absoluta

O sistema **não avança sem validação do usuário** quando houver informação incerta, inferida, crítica ou financeiramente relevante.

## Deve travar quando houver

* falta de dado;
* inferência relevante;
* risco financeiro;
* risco técnico;
* conflito entre disciplinas;
* projeto ausente;
* documento ilegível;
* serviço de alto impacto;
* responsabilidade técnica;
* dúvida sobre escopo;
* ausência de definição de fornecimento;
* necessidade de aprovação externa.

## Formato da validação

```text
Validação necessária:
- Item:
- Motivo:
- Impacto:
- Opções:
  A) Confirmar
  B) Corrigir
  C) Remover
  D) Manter como verba
  E) Solicitar mais informações
```

---

# 32. Status dos Itens Orçamentários

Cada item deve possuir status.

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

## Definições

### identificado

O item aparece claramente em projeto, memorial ou informação do usuário.

### inferido

O item não aparece diretamente, mas é tecnicamente provável.

### pendente

Falta informação para orçar corretamente.

### validado

O usuário confirmou.

### rejeitado

O usuário removeu do escopo.

### revisar

Há inconsistência ou dúvida.

### verba

Item previsto por valor estimado sem definição completa.

### fora_do_escopo

Item identificado, mas não será considerado no orçamento.

---

# 33. Estrutura de Dados Mínima

## Serviços

```text
id
orcamento_id
ambiente_id
nome
categoria
descricao
unidade
quantidade
status
confianca
origem
hitl_required
```

## Custos

```text
id
servico_id
custo_unitario
custo_total
fonte
tipo
confianca
observacoes
```

## Equipes

```text
id
nome
categoria
status
```

## Cronograma

```text
id
servico_id
equipe_id
duracao_estimada
sequencia_logica
dependencias
observacoes
```

## Validações HITL

```text
id
orcamento_id
item_ref
tipo_item
motivo
impacto
status
decisao_usuario
```

---

# 34. Etapas Oficiais de Execução

## ETAPA 0 — Análise Inicial

Objetivo:

* ler arquivos;
* identificar disciplinas;
* identificar ambientes;
* listar documentos ausentes;
* gerar diagnóstico preliminar.

Saída:

```text
1. Arquivos analisados
2. Disciplinas identificadas
3. Ambientes identificados
4. Escopo aparente
5. Informações ausentes
6. Riscos iniciais
7. Próximas validações
```

A etapa 0 não gera orçamento final.

---

## ETAPA 1 — Estruturação de Escopo e Quantitativos

Objetivo:

* transformar leitura em serviços;
* organizar categorias;
* calcular ou estimar quantidades;
* separar identificado, inferido e pendente.

Saída:

```text
Serviço
Ambiente
Categoria
Unidade
Quantidade
Origem
Confiança
Status
Validação necessária
```

---

## ETAPA 1B — Composição de Custos

Objetivo:

* aplicar custos unitários;
* indicar fonte dos preços;
* separar custos com alta, média e baixa confiança;
* marcar itens sem referência.

Saída:

```text
Serviço
Quantidade
Custo unitário
Custo total
Fonte
Confiança
Observações
```

---

## ETAPA 2 — BDI / Encargos / Margem

Objetivo:

* transformar custo direto em preço de venda;
* aplicar margem;
* aplicar administração;
* aplicar impostos;
* aplicar risco.

Saída:

```text
Custo direto
Administração
Impostos
Margem
Risco
Preço final
```

---

## ETAPA 3 — Cronograma Inicial

Objetivo:

* gerar sequência lógica;
* estimar duração;
* vincular equipes;
* preparar base para futura obra.

Saída:

```text
Etapa
Serviço
Equipe
Duração
Dependência
Observação
```

---

## ETAPA FINAL — Consolidação

Objetivo:

* consolidar orçamento validado;
* gerar base de proposta;
* listar pendências finais;
* liberar para proposta comercial.

Saída:

```text
1. Orçamento consolidado
2. Escopo incluso
3. Escopo excluído
4. Premissas
5. Pendências
6. Riscos
7. Cronograma inicial
8. Base da proposta
```

---

# 35. Tipos de Orçamento Suportados

## Estimativa preliminar

Usada quando há poucos dados.

Características:

* maior uso de verba;
* menor precisão;
* mais alertas;
* mais pendências.

## Orçamento técnico parcial

Usado quando há alguns projetos, mas não todos.

Características:

* disciplinas identificadas;
* lacunas documentadas;
* quantitativos parciais;
* custos parcialmente confiáveis.

## Orçamento executivo

Usado quando há projeto completo.

Características:

* maior precisão;
* menos inferências;
* quantitativos detalhados;
* base forte para proposta final.

## Comparativo de proposta

Usado para comparar orçamento próprio com orçamento de terceiro.

Características:

* identifica itens ausentes;
* identifica diferenças de escopo;
* aponta distorções;
* gera argumento comercial.

---

# 36. Escopo Incluso e Escopo Excluído

O sistema deve separar claramente o que está dentro e fora da proposta.

## Escopo incluso

Itens considerados no orçamento.

## Escopo excluído

Itens identificados ou possíveis, mas não considerados.

Exemplo:

```text
Escopo excluído:
- fornecimento de luminárias;
- fornecimento de porcelanato;
- projeto estrutural;
- taxas de aprovação;
- equipamentos de ar-condicionado.
```

## Regra crítica

Escopo excluído deve ser tratado como proteção comercial.

---

# 37. Premissas do Orçamento

Toda proposta deve ter premissas.

Exemplos:

```text
- orçamento baseado nos arquivos recebidos até a data da análise;
- alterações de projeto podem gerar revisão de valores;
- itens sem detalhamento foram tratados como verba;
- materiais de acabamento considerados conforme memorial recebido;
- serviços não listados não estão inclusos;
- execução considerada em horário comercial, salvo validação contrária;
- taxas de condomínio/shopping não inclusas, salvo indicação.
```

---

# 38. Relação com Supabase

O Orçamentista IA deve gerar dados em formato compatível com persistência posterior.

## Pode ser salvo na fase de oportunidade

* oportunidade;
* arquivos;
* análises;
* ambientes;
* serviços previstos;
* quantitativos;
* custos;
* validações;
* versões de orçamento;
* proposta gerada.

## Não deve ser salvo como execução de obra

* avanço físico;
* medição;
* diário de obra;
* produtividade real;
* fotos executivas;
* relatório semanal;
* pagamentos de equipes da obra ativa.

---

# 39. Conversão em Obra

Após aprovação da proposta, o orçamento validado pode alimentar a obra.

## Dados que podem migrar

* serviços;
* categorias;
* equipes previstas;
* cronograma inicial;
* valores contratados;
* escopo aprovado;
* premissas;
* exclusões;
* anexos;
* observações técnicas.

## Dados que não devem migrar como definitivos sem revisão

* inferências não validadas;
* verbas abertas;
* itens pendentes;
* custos de baixa confiança;
* cronograma sem aprovação.

---

# 40. Checklist de Funcionamento

O Orçamentista IA estará funcional quando permitir:

```text
[ ] Criar orçamento dentro de uma oportunidade
[ ] Anexar arquivos
[ ] Listar arquivos recebidos
[ ] Classificar documentos por disciplina
[ ] Executar Etapa 0
[ ] Apresentar identificado / inferido / pendente
[ ] Acionar agentes de domínio corretos
[ ] Gerar serviços orçamentáveis
[ ] Gerar quantitativos com origem
[ ] Aplicar custos com fonte
[ ] Marcar confiança dos itens
[ ] Criar validações HITL
[ ] Permitir aprovação / correção / rejeição de itens
[ ] Gerar cronograma inicial
[ ] Gerar base de proposta
[ ] Manter separação com Diário de Obra
[ ] Não gravar execução antes da conversão em obra
```

---

# 41. Frase Canônica Final

O Orçamentista IA EVIS é o motor técnico-comercial de pré-obra responsável por interpretar projetos, estruturar escopos, gerar quantitativos, aplicar custos, auditar riscos e preparar propostas, sempre com validação humana obrigatória para informações incertas, inferidas ou financeiramente relevantes.

Ele não executa obra.

Ele prepara a obra para ser contratada corretamente.
