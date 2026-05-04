# EVIS — ORÇAMENTISTA IA

## Agent Knowledge Base — Base de Conhecimento Técnico dos Agentes

**Status:** Documento técnico complementar  
**Módulo:** Orçamentista IA  
**Área:** Pré-obra / Oportunidade / Proposta  
**Arquivo sugerido:** `orcamentista/docs/EVIS_ORCAMENTISTA_AGENT_KNOWLEDGE_BASE.md`  
**Dependências:**  
- `EVIS_ORCAMENTISTA_IA_CANONICAL.md`  
- `EVIS_ORCAMENTISTA_DOMAIN_AGENTS.md`  
- `EVIS_ORCAMENTISTA_PIPELINE.md`  
- `EVIS_ORCAMENTISTA_HITL_RULES.md`  
- `EVIS_ORCAMENTISTA_DATA_MODEL.md`  

---

# 1. Objetivo deste Documento

Este documento define a **base de conhecimento técnico** que deve orientar os agentes do Orçamentista IA EVIS.

Enquanto o documento `EVIS_ORCAMENTISTA_DOMAIN_AGENTS.md` define o papel e a saída esperada de cada agente, este documento define:

- qual conhecimento técnico cada agente deve carregar;
- como cada agente deve raciocinar;
- quais referências técnicas devem orientar a leitura;
- quais heurísticas de orçamento devem ser aplicadas;
- quais riscos devem ser reconhecidos;
- quais lacunas devem gerar HITL;
- quais repositórios, padrões abertos e bases externas podem servir de referência conceitual.

Este documento não é código.

Ele é a **camada semântica e técnica** dos agentes.

---

# 2. Definição da Base de Conhecimento dos Agentes

A Base de Conhecimento dos Agentes é o conjunto de regras, critérios, referências, checklists e heurísticas que permite que cada agente interprete documentos técnicos de forma especializada.

Ela deve permitir que o Orçamentista IA deixe de ser um leitor genérico de arquivos e passe a operar como um sistema técnico de pré-orçamento.

## Frase canônica

A Base de Conhecimento dos Agentes do Orçamentista IA EVIS é a camada técnica que orienta cada agente a interpretar documentos de engenharia, arquitetura e execução, convertendo sinais de projeto em escopo orçamentável, riscos, premissas, exclusões e validações humanas.

---

# 3. Diferença entre Agente de Domínio e Base de Conhecimento

## Agente de Domínio

Define **quem executa a análise**.

Exemplo:

```text
Agente Civil / Arquitetônico
Agente Elétrica / Dados / Automação
Agente Hidrossanitário
Agente PPCI / Incêndio
```

## Base de Conhecimento

Define **com qual inteligência o agente executa a análise**.

Exemplo:

```text
Como identificar demolição implícita.
Como reconhecer serviço de proteção necessário.
Como diferenciar fornecimento de instalação.
Como detectar conflito entre forro, ar-condicionado e sprinklers.
Como classificar risco estrutural.
Como decidir quando uma quantidade exige HITL.
```

## Regra

Um agente sem base de conhecimento vira apenas classificador.

Um agente com base de conhecimento vira especialista técnico operacional.

---

# 4. Referências Técnicas Gerais

A base de conhecimento deve considerar, quando aplicável:

```text
normas técnicas brasileiras
práticas executivas de construção civil
boas práticas de orçamento
histórico de obras da empresa
base própria de serviços
composições internas
SINAPI
fornecedores
catálogos técnicos
memoriais de projeto
checklists de execução
experiência prática do usuário
padrões de obra em condomínio
padrões de obra em shopping
exigências de aprovação externa
```

## Observação importante

O sistema pode usar normas, padrões e repositórios como referência, mas não deve afirmar conformidade normativa definitiva sem validação de responsável técnico.

---

# 5. Referências Abertas e Repositórios Úteis

As referências abaixo servem como inspiração técnica e arquitetural. Elas não são dependências obrigatórias do EVIS.

## 5.1 IFC / BIM / Open Standards

### buildingSMART IFC

O IFC é um padrão aberto internacional para descrição digital de ativos construídos, usado em fluxos BIM e mantido pela buildingSMART. A documentação IFC 4.3.2 é uma referência técnica atual para estrutura semântica de elementos BIM.

Uso conceitual no EVIS:

```text
entender classificação de elementos construtivos
inspirar estruturação futura para BIM/IFC
apoiar leitura futura de modelos IFC
mapear elementos para serviços orçamentáveis
preparar evolução para quantitativos BIM
```

### IfcOpenShell

IfcOpenShell é uma biblioteca open-source para ler, escrever e modificar modelos IFC, com suporte a múltiplas versões IFC e uso em plataformas AEC.

Uso conceitual no EVIS:

```text
referência para futura leitura IFC
extração de elementos BIM
quantitativos baseados em geometria
mapeamento de objetos IFC para serviços
evolução futura do Orçamentista para BIM takeoff
```

### Speckle

Speckle é uma plataforma AEC voltada a compartilhamento e análise de dados entre ferramentas CAD/BIM, com conectores e fluxos de integração entre softwares.

Uso conceitual no EVIS:

```text
referência para interoperabilidade AEC
modelo mental de hub de dados BIM
troca de dados entre ferramentas
estruturação futura de dados de projeto
visualização e análise de modelos
```

---

## 5.2 BOQ / Takeoff / Estimating

### OpenConstructionERP

OpenConstructionERP se apresenta como uma plataforma open-source de estimativa de construção com BOQ, 4D/5D, AI e CAD/BIM takeoff, incluindo uma base ampla de itens de custo.

Uso conceitual no EVIS:

```text
referência para estrutura BOQ
referência para fluxo de takeoff
referência para custo por item
referência para 4D/5D planning
referência para arquitetura de orçamento técnico
```

### GitHub Topics — BOQ / Takeoff

Os tópicos públicos de GitHub para BOQ e takeoff reúnem projetos menores e experimentais relacionados a cálculo de quantidades, orçamentos e billing. Eles servem como mapeamento de soluções abertas, não como fonte normativa.

Uso conceitual no EVIS:

```text
observar estruturas de BOQ
observar padrões simples de itemização
observar formatos de exportação
observar nomenclatura de serviços
```

---

# 6. Princípios Gerais de Raciocínio Técnico

Todos os agentes devem seguir os mesmos princípios fundamentais.

## 6.1 Ler documento como projeto, não como texto

O agente deve considerar:

```text
título da prancha
disciplina
escala
legenda
notas
cotas
símbolos
tabelas
ambientes
detalhes
cortes
elevações
memoriais
conflitos
ausências
```

## 6.2 Separar fato, inferência e pendência

Todo item deve ser classificado como:

```text
identificado
inferido
pendente
fora_do_escopo
verba
validado
```

## 6.3 Todo serviço deve ter lógica executiva

Um item só deve virar serviço orçamentável quando puder ser entendido como uma ação executável.

Exemplo correto:

```text
Execução de forro em drywall
Remoção de revestimento existente
Instalação de ponto elétrico
Teste de estanqueidade
Proteção de piso existente
```

Exemplo incorreto:

```text
Forro
Parede
Banheiro
Elétrica
```

## 6.4 Todo serviço deve sugerir unidade

Cada serviço deve sugerir unidade adequada:

```text
m²
m³
ml
unidade
ponto
conjunto
verba
diária
mês
hora
kg
tonelada
```

## 6.5 Todo risco relevante deve gerar HITL

Risco técnico, financeiro, comercial ou de responsabilidade não pode ficar escondido.

---

# 7. Núcleo de Inteligência Comum dos Agentes

Todos os agentes devem saber identificar:

```text
escopo direto
escopo implícito
escopo ausente
escopo excluído
serviços preparatórios
serviços acessórios
serviços de recomposição
serviços de teste
serviços de documentação
serviços de gestão
fornecimento
instalação
mão de obra
material
equipamento
taxa externa
aprovação externa
risco técnico
risco financeiro
risco comercial
risco operacional
```

---

# 8. Heurísticas Gerais de Orçamento

## 8.1 Reforma exige proteção

Em obras de reforma, retrofit, áreas ocupadas ou ambientes existentes, o agente deve verificar:

```text
proteção de piso
proteção de mobiliário
isolamento de área
tapume
controle de poeira
carga e descarga
remoção de entulho
limpeza intermediária
limpeza final
```

Se não estiver no projeto, pode ser inferido com HITL.

---

## 8.2 Demolição geralmente exige descarte

Quando houver demolição, remoção ou quebra, o sistema deve verificar:

```text
ensacamento
transporte interno
caçamba
descarte
limpeza
recomposição
```

Se não estiver explícito, gerar HITL.

---

## 8.3 Novo ponto embutido exige rasgo e recomposição

Quando houver ponto elétrico, hidráulico, dreno ou infraestrutura embutida, o sistema deve verificar:

```text
rasgo
passagem
fixação
fechamento
reboco
regularização
pintura/revestimento de recomposição
```

---

## 8.4 Acabamento exige base adequada

Quando houver piso, revestimento, pintura ou pedra, o sistema deve verificar:

```text
base regularizada
prumo
nível
contrapiso
emboço/reboco
impermeabilização quando aplicável
limpeza de base
cura
```

---

## 8.5 Obra com shopping ou condomínio exige administração adicional

Quando o projeto estiver em shopping, condomínio, prédio comercial, clínica, restaurante ou ambiente com operação, verificar:

```text
horário restrito
liberação de acesso
OS
documentação
ART/RRT
reuniões
fiscalização
proteção especial
execução noturna
deslocamento
estacionamento
relatórios
coordenação de terceiros
```

---

## 8.6 Projeto parcial não pode gerar orçamento definitivo

Quando faltar disciplina essencial, o sistema pode avançar como preliminar, mas deve marcar:

```text
documento ausente
escopo pendente
risco de aditivo
premissa
exclusão
HITL
```

---

# 9. Conhecimento Técnico — Agente Civil / Arquitetônico

## 9.1 Núcleo de conhecimento

O agente Civil / Arquitetônico deve entender:

```text
ambientes
layout
fluxo de obra
demolição
construção
alvenaria
drywall
forro
piso
parede
pintura
revestimento
bancadas
vãos
portas
esquadrias
proteções
isolamentos
limpeza
mobilização
desmobilização
```

## 9.2 Deve reconhecer em plantas

```text
paredes existentes
paredes novas
paredes a demolir
mudança de layout
áreas de piso
áreas de parede
vãos
eixos
cotas
forros
sancas
tabicas
rebaixos
paginação
quadro de áreas
notas de acabamento
```

## 9.3 Heurísticas específicas

```text
Se há parede nova, verificar acabamento dos dois lados.
Se há parede demolida, verificar piso/teto/parede a recompor.
Se há novo forro, verificar elétrica, climatização e PPCI.
Se há troca de piso, verificar remoção do piso existente.
Se há pintura, verificar massa/preparo.
Se há revestimento, verificar base e impermeabilização quando área molhada.
Se obra ocorre em ambiente existente, verificar proteção e limpeza.
```

## 9.4 Riscos típicos

```text
demolição sem escopo claro
ausência de cotas
área sem acabamento especificado
recomposição esquecida
proteção não considerada
descarte não considerado
forro incompatível com instalações
piso novo sem regularização
```

## 9.5 HITLs típicos

```text
Confirmar se demolição está inclusa.
Confirmar se descarte está incluso.
Confirmar se proteção de piso entra no orçamento.
Confirmar se materiais de acabamento serão fornecidos pelo cliente.
Confirmar se pintura inclui massa corrida.
Confirmar se forro inclui tabica/sanca/acabamento.
```

---

# 10. Conhecimento Técnico — Agente Estrutural

## 10.1 Núcleo de conhecimento

O agente Estrutural deve reconhecer:

```text
pilares
vigas
lajes
fundações
reforços
aberturas
furações
bases
cargas
escoramentos
recuperações
estrutura metálica
estrutura de madeira
responsabilidade técnica
```

## 10.2 Heurísticas específicas

```text
Se há demolição de parede sem clareza estrutural, gerar risco.
Se há furo em laje/viga, exigir validação técnica.
Se há equipamento pesado, verificar base/carga.
Se há alteração estrutural, exigir ART/RRT ou laudo.
Se não há projeto estrutural, não assumir viabilidade.
```

## 10.3 Riscos típicos

```text
intervenção estrutural sem projeto
demolição de parede estrutural
furação indevida
carga não verificada
base de equipamento ausente
ausência de responsável técnico
```

## 10.4 HITLs típicos

```text
Confirmar existência de projeto estrutural.
Confirmar se a parede é estrutural.
Confirmar necessidade de laudo.
Confirmar necessidade de ART/RRT.
Confirmar se bases de equipamentos entram no escopo.
```

## 10.5 Limite crítico

O agente Estrutural não pode validar segurança estrutural. Ele apenas aponta risco e exige validação de responsável técnico.

---

# 11. Conhecimento Técnico — Agente Elétrica / Dados / Automação

## 11.1 Núcleo de conhecimento

O agente Elétrica deve entender:

```text
tomadas
interruptores
luminárias
pontos de força
quadro elétrico
circuitos
cargas
eletrodutos
eletrocalhas
perfilados
cabos
infraestrutura seca
dados
CFTV
som
automação
sensores
drivers
fontes
fitas LED
```

## 11.2 Heurísticas específicas

```text
Se há nova luminária, verificar infraestrutura e comando.
Se há fita LED, verificar fonte, perfil, alimentação e acionamento.
Se há novo equipamento, verificar carga e quadro.
Se há marcenaria com tomada, verificar ponto embutido.
Se há automação citada, separar infraestrutura de fornecimento de equipamentos.
Se não há quadro de cargas, marcar risco.
```

## 11.3 Riscos típicos

```text
quadro existente insuficiente
luminária sem especificação
fornecimento indefinido
circuitos não definidos
carga de equipamento não considerada
automação genérica
conflito com forro/PPCI/marcenaria
```

## 11.4 HITLs típicos

```text
Confirmar se luminárias estão inclusas.
Confirmar se tomadas e interruptores são fornecidos pela construtora.
Confirmar se quadro comporta novas cargas.
Confirmar se automação está inclusa.
Confirmar se cabeamento de rede/CFTV entra no escopo.
Confirmar se haverá desligamento programado.
```

---

# 12. Conhecimento Técnico — Agente Hidrossanitário

## 12.1 Núcleo de conhecimento

O agente Hidrossanitário deve entender:

```text
água fria
água quente
esgoto
ventilação sanitária
ralos
caixas sifonadas
prumadas
registros
louças
metais
pontos hidráulicos
pontos sanitários
drenos
testes
shafts
```

## 12.2 Heurísticas específicas

```text
Se há novo ponto hidráulico, verificar rasgo e recomposição.
Se há alteração de esgoto, verificar queda e prumada.
Se há área molhada, verificar impermeabilização.
Se há ar-condicionado, verificar dreno.
Se há cozinha/restaurante, verificar caixa de gordura e exigências específicas.
Se não há acesso à prumada, marcar risco.
```

## 12.3 Riscos típicos

```text
sem acesso à prumada
queda insuficiente
ponto existente incompatível
teste de estanqueidade omitido
impermeabilização esquecida
louças/metais sem definição
layout sem compatibilidade hidráulica
```

## 12.4 HITLs típicos

```text
Confirmar se haverá alteração de pontos.
Confirmar acesso às prumadas.
Confirmar se louças e metais estão inclusos.
Confirmar se teste de estanqueidade está incluso.
Confirmar se impermeabilização entra no escopo.
```

---

# 13. Conhecimento Técnico — Agente Impermeabilização

## 13.1 Núcleo de conhecimento

O agente Impermeabilização deve entender:

```text
áreas molhadas
banheiros
cozinhas
áreas técnicas
sacadas
lajes
terraços
jardineiras
ralos
rodapés impermeáveis
juntas
manta
argamassa polimérica
membrana líquida
teste de estanqueidade
proteção mecânica
```

## 13.2 Heurísticas específicas

```text
Área molhada com intervenção em piso deve verificar impermeabilização.
Impermeabilização deve ocorrer antes de revestimento final.
Teste de estanqueidade deve ser considerado quando aplicável.
Ralo exige tratamento específico.
Rodapé impermeável deve ser verificado.
Prazo de cura pode impactar cronograma.
```

## 13.3 Riscos típicos

```text
teste não previsto
base inadequada
ralo sem tratamento
revestimento antes de teste
prazo de cura ignorado
infiltração existente sem tratamento
```

## 13.4 HITLs típicos

```text
Confirmar sistema de impermeabilização.
Confirmar áreas exatas.
Confirmar teste de estanqueidade.
Confirmar prazo de cura.
Confirmar se impermeabilização está inclusa ou excluída.
```

---

# 14. Conhecimento Técnico — Agente Climatização / Exaustão / Ventilação

## 14.1 Núcleo de conhecimento

O agente deve entender:

```text
evaporadoras
condensadoras
linhas frigorígenas
drenos
dutos
grelhas
difusores
exaustores
coifas
renovação de ar
casa de máquinas
suportes
furações
isolamento térmico
carga elétrica
acesso para manutenção
```

## 14.2 Heurísticas específicas

```text
Evaporadora exige dreno.
Condensadora exige suporte/base e acesso técnico.
Duto exige compatibilização com forro.
Exaustão pode exigir furação, duto e descarga adequada.
Equipamento exige alimentação elétrica.
Shopping pode exigir acesso à área técnica e autorização.
Manutenção futura precisa de acesso.
```

## 14.3 Riscos típicos

```text
sem dreno
sem área técnica
conflito com forro
conflito com sprinkler
carga elétrica não prevista
rota de linha inviável
sem acesso para manutenção
obra noturna não considerada
```

## 14.4 HITLs típicos

```text
Confirmar se equipamentos estão inclusos.
Confirmar se infraestrutura frigorígena está inclusa.
Confirmar se drenos estão disponíveis.
Confirmar se elétrica de alimentação está inclusa.
Confirmar acesso à área técnica.
Confirmar se dutos/grelhas estão inclusos.
```

---

# 15. Conhecimento Técnico — Agente PPCI / Incêndio

## 15.1 Núcleo de conhecimento

O agente PPCI deve entender:

```text
sprinklers
hidrantes
extintores
iluminação de emergência
sinalização
detectores
alarme
rotas de fuga
compartimentação
portas corta-fogo
testes de estanqueidade
aprovações
exigências de shopping
exigências do Corpo de Bombeiros
```

## 15.2 Heurísticas específicas

```text
Alteração de layout pode exigir revisão de PPCI.
Forro novo pode exigir remanejamento de sprinklers.
Luminárias podem conflitar com sprinklers.
Rota de fuga não pode ser bloqueada por layout/marcenaria.
Ambiente com público aumenta criticidade.
Shopping exige autorização e testes específicos.
```

## 15.3 Riscos típicos

```text
PPCI não aprovado
sprinkler conflitante com luminária
layout alterado sem revisão
rota de fuga comprometida
teste não previsto
documentação pendente
execução condicionada a aprovação externa
```

## 15.4 HITLs típicos

```text
Confirmar se projeto PPCI está aprovado.
Confirmar se teste de estanqueidade está incluso.
Confirmar se documentação está inclusa.
Confirmar se alterações de layout exigem revisão.
Confirmar se há exigências do shopping/condomínio.
```

## 15.5 Regra crítica

Em restaurante, shopping, clínica, escola, academia, mercado ou local com público, PPCI deve ser tratado como disciplina crítica.

---

# 16. Conhecimento Técnico — Agente Marcenaria / Mobiliário Técnico

## 16.1 Núcleo de conhecimento

O agente deve entender:

```text
armários
painéis
bancadas
nichos
tamponamentos
móveis fixos
portas
gavetas
ferragens
acabamentos
iluminação integrada
recortes técnicos
encontros com parede/piso/revestimento
medidas finais em obra
```

## 16.2 Heurísticas específicas

```text
Marcenaria depende de medida final em obra.
Tomadas em marcenaria exigem compatibilização elétrica.
Bancada molhada exige hidráulica compatível.
Iluminação integrada exige infraestrutura elétrica.
Ferragens devem ser especificadas.
Acabamento precisa estar definido.
```

## 16.3 Riscos típicos

```text
projeto conceitual sem detalhamento
medidas não conferidas
interferência com tomadas
ferragens indefinidas
acabamento indefinido
iluminação sem elétrica
bancada molhada sem hidráulica
```

## 16.4 HITLs típicos

```text
Confirmar se marcenaria está inclusa.
Confirmar padrão de acabamento.
Confirmar ferragens.
Confirmar se iluminação integrada está inclusa.
Confirmar se instalação entra no escopo.
Confirmar necessidade de medição final.
```

---

# 17. Conhecimento Técnico — Agente Vidros / Esquadrias / Serralheria

## 17.1 Núcleo de conhecimento

O agente deve entender:

```text
portas
janelas
vãos
guarda-corpos
divisórias
pele de vidro
box
espelhos
caixilhos
ferragens
corrimãos
gradis
venezianas
estrutura metálica leve
acabamentos
sistemas de abertura
```

## 17.2 Heurísticas específicas

```text
Esquadria depende de medida final do vão.
Vidro exige tipo, espessura e acabamento.
Guarda-corpo exige validação normativa.
Vão fora de prumo pode gerar ajuste.
Serralheria pode exigir pintura/acabamento.
Prazo de fabricação deve entrar no cronograma.
```

## 17.3 Riscos típicos

```text
medidas não confirmadas
vão fora de prumo
tipo de vidro indefinido
ferragem sem especificação
guarda-corpo sem validação
prazo de fabricação ignorado
```

## 17.4 HITLs típicos

```text
Confirmar medidas finais.
Confirmar tipo de vidro.
Confirmar acabamento.
Confirmar se fornecimento está incluso.
Confirmar se instalação está inclusa.
Confirmar exigência normativa.
```

---

# 18. Conhecimento Técnico — Agente Acabamentos

## 18.1 Núcleo de conhecimento

O agente deve entender:

```text
pisos
revestimentos
rodapés
soleiras
filetes
pedras
pintura
textura
papel de parede
metais aparentes
louças aparentes
bancadas
rejuntes
arremates
paginação
perdas
```

## 18.2 Heurísticas específicas

```text
Acabamento depende de base adequada.
Paginação altera perdas e recortes.
Material de alto padrão exige especificação.
Pedras e bancadas exigem medição final.
Pintura exige preparo.
Revestimento em área molhada exige impermeabilização prévia.
```

## 18.3 Riscos típicos

```text
material não especificado
paginação ausente
perda não considerada
base inadequada
conflito entre memorial e planta
fornecedor indefinido
prazo de entrega incompatível
```

## 18.4 HITLs típicos

```text
Confirmar se material está incluso.
Confirmar percentual de perda.
Confirmar padrão de acabamento.
Confirmar fornecedor.
Confirmar paginação executiva.
Confirmar se pedras/metais aparentes entram no escopo.
```

---

# 19. Conhecimento Técnico — Agente Documentação / Aprovações

## 19.1 Núcleo de conhecimento

O agente deve entender:

```text
ART
RRT
alvará
PPCI
as built
laudos
aprovação de condomínio
aprovação de shopping
taxas
licenças
autorizações
normas internas
responsabilidade técnica
```

## 19.2 Heurísticas específicas

```text
Shopping quase sempre exige documentação e aprovação.
Condomínio pode exigir ART/RRT e manual de obra.
Alteração de PPCI exige aprovação.
Intervenção estrutural exige responsável técnico.
As built deve ser previsto quando exigido.
Taxas externas precisam ser incluídas ou excluídas.
```

## 19.3 Riscos típicos

```text
obra impedida de iniciar
aprovação atrasada
projeto desatualizado
as built não previsto
responsabilidade técnica indefinida
taxa não considerada
escopo burocrático não cobrado
```

## 19.4 HITLs típicos

```text
Confirmar se documentação está inclusa.
Confirmar responsável técnico.
Confirmar se taxas estão inclusas.
Confirmar se haverá as built.
Confirmar prazos de aprovação.
Confirmar quem assume protocolos.
```

---

# 20. Conhecimento Técnico — Agente Administração / Gestão de Obra

## 20.1 Núcleo de conhecimento

O agente deve entender:

```text
coordenação de equipes
planejamento
compras
reuniões
visitas técnicas
fiscalização
relatórios
deslocamento
estacionamento
obra noturna
shopping
condomínio
cliente exigente
múltiplas equipes
logística
```

## 20.2 Heurísticas específicas

```text
Obra com múltiplas equipes exige gestão.
Obra em shopping exige acompanhamento adicional.
Obra noturna deve ter acréscimo.
Obra distante deve considerar deslocamento.
Estacionamento deve ser considerado quando recorrente.
Relatórios e reuniões consomem horas.
Coordenação de terceiros deve ser cobrada.
```

## 20.3 Riscos típicos

```text
gestão invisível
administração não cobrada
visitas subestimadas
obra noturna sem adicional
deslocamento ignorado
estacionamento ignorado
reuniões não consideradas
coordenação sem remuneração
```

## 20.4 HITLs típicos

```text
Confirmar se administração entra separada.
Confirmar se será mensal ou percentual.
Confirmar frequência de visitas.
Confirmar se obra terá turno noturno.
Confirmar se relatórios estão inclusos.
Confirmar se gestão de terceiros será cobrada.
```

---

# 21. Conhecimento Técnico — Agente Compatibilização Técnica

## 21.1 Núcleo de conhecimento

O agente deve cruzar disciplinas e detectar conflitos.

## 21.2 Matriz de conflitos obrigatória

```text
Arquitetura x Estrutura
Arquitetura x Elétrica
Arquitetura x Hidráulica
Forro x Climatização
Forro x PPCI
Elétrica x PPCI
Marcenaria x Elétrica
Marcenaria x Hidráulica
Acabamentos x Civil
Impermeabilização x Hidráulica
Layout x Rota de fuga
Memorial x Planta
Orçamento x Escopo técnico
```

## 21.3 Heurísticas específicas

```text
Forro novo deve cruzar com elétrica, ar-condicionado e sprinklers.
Layout alterado deve cruzar com PPCI.
Marcenaria deve cruzar com tomadas e hidráulica.
Piso/revestimento deve cruzar com base e impermeabilização.
Demolição deve cruzar com estrutura.
Equipamentos devem cruzar com elétrica e bases.
```

## 21.4 Riscos típicos

```text
serviço faltante por conflito não detectado
custo omitido por disciplina ausente
execução inviável
aditivo futuro
atraso por incompatibilidade
responsabilidade técnica mal definida
```

## 21.5 HITLs típicos

```text
Confirmar disciplina prevalente.
Solicitar revisão de projeto.
Tratar conflito como verba.
Excluir item com premissa.
Bloquear consolidação.
```

---

# 22. Conhecimento Técnico — Agente Comparativo de Propostas

## 22.1 Núcleo de conhecimento

O agente deve comparar orçamento EVIS com orçamento externo.

## 22.2 Deve identificar

```text
itens ausentes no concorrente
itens ausentes no EVIS
diferença de unidade
diferença de quantidade
diferença de fornecimento
itens genéricos
itens sem premissa
valores fora de curva
escopo escondido
escopo não equivalente
```

## 22.3 Heurísticas comerciais

```text
Preço menor pode ser escopo menor.
Item genérico pode esconder exclusão.
Mão de obra sem material não compara com fornecimento completo.
Administração omitida distorce valor.
Proteções, descarte, limpeza e documentação costumam ser esquecidos.
Comparar apenas total é erro comercial.
```

## 22.4 Saída esperada

```text
Item
Valor EVIS
Valor terceiro
Diferença técnica
Diferença financeira
Risco
Argumento comercial
Validação necessária
```

---

# 23. Checklists de Leitura Técnica por Documento

## 23.1 Planta baixa

```text
ambientes
cotas
áreas
paredes existentes
paredes novas
vãos
portas
janelas
layout
interferências
notas
escala
```

## 23.2 Planta de demolição

```text
elementos a remover
paredes a demolir
pisos a remover
forros a remover
portas/esquadrias a remover
entulho
recomposição
risco estrutural
proteções
```

## 23.3 Planta de forro

```text
áreas de forro
sancas
tabicas
luminárias
grelhas
sprinklers
acessos de manutenção
níveis
interferência com instalações
```

## 23.4 Memorial de acabamentos

```text
material por ambiente
piso
parede
teto
rodapé
soleira
bancada
metais
louças
fornecedor
modelo
fornecimento
observações
```

## 23.5 Projeto elétrico

```text
pontos
circuitos
quadro
cargas
eletrodutos
cabos
luminárias
tomadas
interruptores
infraestrutura de dados
notas
```

## 23.6 Projeto hidrossanitário

```text
pontos de água
esgoto
ventilação
ralos
prumadas
registros
louças/metais
testes
shafts
drenos
```

## 23.7 Projeto PPCI

```text
sprinklers
hidrantes
extintores
sinalização
iluminação de emergência
rotas de fuga
detectores
alarme
testes
aprovação
```

---

# 24. Heurísticas de Quantitativo

## 24.1 Quantitativo por área

Usar para:

```text
piso
forro
pintura
revestimento
impermeabilização
proteção
drywall em área
```

## 24.2 Quantitativo por metro linear

Usar para:

```text
rodapé
soleira
tabica
perfil
tubulação
eletroduto
eletrocalha
linha frigorígena
dreno
corrimão
guarda-corpo
```

## 24.3 Quantitativo por ponto

Usar para:

```text
tomada
interruptor
ponto de luz
ponto hidráulico
ponto de esgoto
ponto de rede
ponto de CFTV
ponto de sprinkler
```

## 24.4 Quantitativo por unidade

Usar para:

```text
porta
janela
luminária
ralo
registro
louça
metal
equipamento
móvel
extintor
detector
```

## 24.5 Quantitativo por verba

Usar quando:

```text
escopo existe, mas não há definição suficiente
serviço depende de cotação
item depende de aprovação
item depende de visita técnica
item depende de fornecedor
```

---

# 25. Heurísticas de Risco

## 25.1 Risco técnico

```text
projeto incompleto
disciplina ausente
conflito entre projetos
intervenção estrutural
PPCI sem aprovação
hidráulica sem prumada
climatização sem dreno
impermeabilização sem teste
```

## 25.2 Risco financeiro

```text
fornecimento indefinido
quantidade estimada
custo sem referência
obra noturna
shopping/condomínio
material alto padrão
prazo agressivo
gestão não cobrada
```

## 25.3 Risco comercial

```text
escopo mal delimitado
exclusões ausentes
premissas ausentes
comparativo desigual
cliente comparando apenas total
administração invisível
validade indefinida
```

## 25.4 Risco operacional

```text
acesso restrito
horário restrito
equipe especializada
dependência de terceiros
aprovação externa
ambiente em funcionamento
logística complexa
```

---

# 26. Conhecimentos que Devem Vir da Base Interna EVIS

O Orçamentista IA deve aprender progressivamente com a base interna.

## Bases internas futuras

```text
serviços cadastrados
aliases semânticos
composições próprias
histórico de obras
produtividade real pós-obra
custos reais pagos
fornecedores usados
equipes cadastradas
padrões de proposta
premissas frequentes
exclusões frequentes
riscos recorrentes
```

## Regra

Conhecimento interno validado pelo usuário tem prioridade sobre referência genérica.

---

# 27. Relação com SINAPI

## Uso esperado

SINAPI pode ser usado como referência de custo, composição ou comparação.

## Limites

```text
SINAPI não substitui custo real da empresa.
SINAPI pode não refletir alto padrão.
SINAPI pode não refletir obra noturna.
SINAPI pode não refletir shopping/condomínio.
SINAPI pode exigir adaptação para realidade local.
```

## Regra

Quando custo vier do SINAPI, marcar:

```text
fonte_custo = sinapi
confianca = referencial
necessita_validação_comercial = true quando aplicável
```

---

# 28. Relação com Repositórios Externos

Repositórios externos podem servir para inspiração, mas não devem ser acoplados automaticamente ao EVIS sem análise.

## Podem inspirar

```text
estrutura BOQ
nomenclatura de itens
modelo de takeoff
estrutura de custos
fluxo 4D/5D
leitura IFC
interoperabilidade BIM
```

## Não devem ser usados automaticamente para

```text
preço final
responsabilidade técnica
norma brasileira definitiva
composição comercial da Berti/EVIS
decisão de escopo sem HITL
```

---

# 29. Limites Técnicos dos Agentes

Os agentes não podem afirmar:

```text
segurança estrutural definitiva
conformidade normativa definitiva
aprovação garantida
quantidade definitiva sem origem
custo definitivo sem fonte
fornecimento definido sem confirmação
prazo garantido sem validação
viabilidade executiva sem projeto suficiente
```

## Devem dizer

```text
não identificado nos arquivos
inferido tecnicamente
depende de validação
exige responsável técnico
exige documentação complementar
orçamento preliminar
risco de revisão de valor
```

---

# 30. Como esta Base Alimenta o Pipeline

## Reader

Usa a base para saber o que observar nos documentos.

## Classificador

Usa a base para identificar disciplinas e agentes relevantes.

## Planner

Usa a base para estruturar ambientes, categorias e serviços.

## Agentes de Domínio

Usam a base para interpretar tecnicamente cada disciplina.

## Quantitativo

Usa a base para sugerir unidades e métodos de medição.

## Custos

Usa a base para aplicar fontes e classificar confiabilidade.

## Auditor

Usa a base para encontrar omissões, conflitos e riscos.

## HITL

Usa a base para definir o que precisa de validação humana.

## Proposta

Usa a base para gerar premissas, exclusões e proteção comercial.

---

# 31. Checklist de Implementação da Base de Conhecimento

A base estará corretamente incorporada quando o sistema conseguir:

```text
[ ] Diferenciar serviço direto de inferência técnica
[ ] Gerar serviço orçamentável com unidade sugerida
[ ] Detectar proteções e descarte em reformas
[ ] Detectar recomposições implícitas
[ ] Detectar fornecimento indefinido
[ ] Detectar administração invisível
[ ] Detectar conflitos entre disciplinas
[ ] Detectar riscos estruturais
[ ] Detectar criticidade PPCI
[ ] Detectar impacto de shopping/condomínio
[ ] Gerar premissas comerciais
[ ] Gerar exclusões comerciais
[ ] Gerar HITL para incertezas relevantes
[ ] Evitar afirmações definitivas sem base
[ ] Usar base própria como prioridade quando existir
[ ] Usar referências externas apenas como apoio conceitual
```

---

# 32. Critérios de Sucesso

O arquivo será considerado funcional quando permitir que cada agente opere com inteligência técnica suficiente para:

```text
ler documentos de sua disciplina
interpretar sinais técnicos
converter projeto em serviço
sugerir unidade de medição
apontar quantitativo possível
apontar risco técnico
apontar risco financeiro
gerar HITL
gerar premissa
gerar exclusão
alimentar orçamento
não inventar dado
não assumir responsabilidade técnica indevida
```

---

# 33. Frase Canônica Final

A Base de Conhecimento dos Agentes do Orçamentista IA EVIS é o conjunto de referências, heurísticas, checklists e critérios técnicos que permite aos agentes interpretar projetos, reconhecer escopos explícitos e implícitos, detectar riscos, estruturar serviços orçamentáveis e acionar validação humana quando necessário.

Ela não substitui engenheiro, arquiteto, projetista ou responsável técnico.

Ela organiza a inteligência de pré-orçamento para que a decisão humana seja mais rápida, rastreável e tecnicamente protegida.
