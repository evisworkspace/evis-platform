# EVIS — ORÇAMENTISTA IA

## Agent Training and RAG Strategy — Estratégia de Especialização Técnica dos Agentes

**Status:** Documento técnico complementar  
**Módulo:** Orçamentista IA  
**Área:** Pré-obra / Oportunidade / Proposta  
**Arquivo sugerido:** `orcamentista/docs/EVIS_ORCAMENTISTA_AGENT_TRAINING_AND_RAG_STRATEGY.md`  
**Dependências:**

- `EVIS_ORCAMENTISTA_IA_CANONICAL.md`
- `EVIS_ORCAMENTISTA_DOMAIN_AGENTS.md`
- `EVIS_ORCAMENTISTA_PIPELINE.md`
- `EVIS_ORCAMENTISTA_HITL_RULES.md`
- `EVIS_ORCAMENTISTA_DATA_MODEL.md`
- `EVIS_ORCAMENTISTA_AGENT_KNOWLEDGE_BASE.md`
- `EVIS_ORCAMENTISTA_AGENT_TECHNICAL_COMPETENCIES.md`

---

## 1. Objetivo deste Documento

Este documento define a estratégia oficial para especializar tecnicamente os agentes do **Orçamentista IA EVIS** sem treinar modelos de linguagem do zero.

O objetivo é estruturar como cada agente deve adquirir comportamento técnico especializado por meio de:

- Prompt canônico
- Competências técnicas mínimas
- Base de conhecimento autorizada
- RAG
- Exemplos reais
- Saída estruturada em JSON
- Score de confiança
- Regras de bloqueio
- HITL
- Auditoria cruzada
- Persistência versionada em Supabase

Este documento transforma a ideia de "treinar agentes especialistas" em uma arquitetura prática, segura, auditável e compatível com o EVIS.

---

## 2. Princípio Central: O EVIS Não Treina LLM do Zero

O EVIS não deve iniciar treinando um modelo de linguagem do zero para cada agente.

Isso seria:

- Financeiramente inviável
- Tecnicamente complexo
- Difícil de auditar
- Difícil de manter
- Arriscado em termos de responsabilidade técnica
- Desnecessário para a fase atual do produto

### Estratégia correta

Os agentes devem ser especializados por camadas.

```
LLM base
→ Prompt canônico
→ Competências técnicas mínimas
→ Base de conhecimento autorizada
→ RAG
→ Few-shot examples reais
→ Schemas JSON obrigatórios
→ Score de confiança
→ Regras de bloqueio
→ HITL
→ Auditoria cruzada
→ Supabase versionado
```

### Frase canônica

Os agentes do Orçamentista IA EVIS não são treinados do zero. Eles são especializados por prompt, conhecimento técnico autorizado, exemplos reais, RAG, schemas estruturados, validação humana e auditoria.

---

## 3. Diferença entre Fine-Tuning, Prompting e RAG

### 3.1 Fine-tuning

Fine-tuning é o ajuste de pesos de um modelo com base em um conjunto de dados de treinamento.

No EVIS, fine-tuning não é prioridade inicial.

Pode ser avaliado no futuro somente se houver:

- Grande volume de dados próprios
- Padrões estáveis de entrada e saída
- Necessidade clara de reduzir custo operacional
- Base de exemplos validada
- Governança de qualidade

### 3.2 Prompting especializado

Prompting especializado define a identidade, função, limites e padrão de resposta do agente.

É a primeira camada de especialização.

### 3.3 RAG

RAG significa Retrieval-Augmented Generation.

No EVIS, RAG significa que o agente consulta uma base de documentos autorizados antes de responder ou gerar análise.

O RAG deve ser usado para:

- Buscar referências técnicas
- Buscar padrões internos
- Consultar memoriais
- Consultar checklists
- Consultar composições
- Consultar projetos anteriores
- Consultar exemplos aprovados
- Recuperar conhecimento específico de uma disciplina

### 3.4 Few-shot examples

Few-shot examples são exemplos concretos de entrada e saída esperada.

No EVIS, eles devem vir preferencialmente de casos reais da Berti/EVIS, devidamente higienizados e validados.

---

## 4. As 10 Camadas Oficiais de Especialização dos Agentes

Cada agente especialista do Orçamentista IA deve ser construído por meio das seguintes camadas:

| #  | Camada                        | Função                                             |
|----|-------------------------------|----------------------------------------------------|
| 1  | Prompt canônico               | Define identidade, função, limites e formato       |
| 2  | Competências técnicas mínimas | Define o que o agente deve saber ler e interpretar |
| 3  | RAG licenciado/autorizado     | Fornece conhecimento técnico consultável           |
| 4  | Few-shot examples reais       | Ensina padrão de raciocínio e saída                |
| 5  | JSON obrigatório              | Garante persistência e interoperabilidade          |
| 6  | Score de confiança            | Mede confiabilidade da análise                     |
| 7  | Regras de bloqueio            | Impede afirmações indevidas                        |
| 8  | HITL                          | Exige validação humana                             |
| 9  | Auditoria cruzada             | Cruza agentes e detecta conflitos                  |
| 10 | Supabase versionado           | Registra histórico e decisões                      |

---

## 5. Camada 1 — Prompt Canônico por Agente

### 5.1 Objetivo

O prompt canônico define a identidade operacional do agente.

Ele deve especificar:

- Papel do agente
- Escopo da disciplina
- Competências
- Limites
- O que pode afirmar
- O que não pode afirmar
- Quando acionar HITL
- Formato obrigatório da saída
- Regras de não invenção

### 5.2 Regras do prompt canônico

Todo prompt de agente deve conter:

```
1. Identidade técnica do agente
2. Fase de atuação: pré-obra / orçamento
3. Disciplina de atuação
4. Competências técnicas mínimas
5. Documentos que consegue interpretar
6. Serviços que pode gerar
7. Riscos que deve identificar
8. Limites técnicos
9. Regras de HITL
10. Formato JSON obrigatório
```

### 5.3 Exemplo conceitual — Agente Estrutural

```
Você é o Agente Estrutural do Orçamentista IA EVIS.

Você atua exclusivamente na fase de pré-obra/orçamento.

Sua função é interpretar documentos estruturais, identificar elementos, riscos, 
lacunas e serviços orçamentáveis relacionados a estrutura.

Você não substitui engenheiro estrutural, não valida segurança, não declara 
conformidade normativa definitiva e não autoriza execução.

Quando houver intervenção estrutural, carga, furação, demolição crítica, ausência 
de projeto ou necessidade de ART/RRT, você deve gerar HITL obrigatório.
```

### 5.4 Ajuste crítico de linguagem

O agente não deve dizer:

```
Está conforme a NBR.
A estrutura está segura.
A demolição pode ser executada.
A laje suporta a carga.
```

O agente deve dizer:

```
Foi identificado indício de risco técnico.
A informação exige validação por responsável técnico.
Não é possível consolidar como definitivo sem HITL.
O item deve permanecer como pendente ou bloqueante.
```

---

## 6. Camada 2 — Competências Técnicas Mínimas

### 6.1 Objetivo

Cada agente deve possuir competências técnicas mínimas documentadas em:

```
EVIS_ORCAMENTISTA_AGENT_TECHNICAL_COMPETENCIES.md
```

Essa camada define o "currículo operacional" de cada agente.

### 6.2 Competência técnica mínima

Cada agente deve saber:

- Quais documentos lê
- Quais elementos identifica
- Quais serviços gera
- Quais riscos detecta
- Quais validações exige
- Quais afirmações são proibidas
- Quais disciplinas devem ser cruzadas

### 6.3 Exemplo — Estrutural

O Agente Estrutural deve saber identificar:

- Pilares
- Vigas
- Lajes
- Fundações
- Reforços
- Furações
- Cargas
- Bases
- Demolições críticas
- Ausência de projeto
- Necessidade de ART/RRT
- Necessidade de laudo

Mas não pode afirmar segurança estrutural definitiva.

### 6.4 Exemplo — Elétrica

O Agente Elétrica deve saber identificar:

- Tomadas
- Pontos de iluminação
- Interruptores
- Quadros
- Circuitos
- Cargas
- Eletrodutos
- Eletrocalhas
- Rede
- CFTV
- Automação
- Luminárias
- Fontes
- Drivers

Mas não pode afirmar capacidade do quadro sem quadro de cargas ou validação técnica.

---

## 7. Camada 3 — RAG Licenciado ou Autorizado

### 7.1 Objetivo

O RAG fornece conhecimento consultável para cada agente.

Esse conhecimento deve vir apenas de fontes autorizadas, licenciadas, internas ou de uso permitido.

### 7.2 Fontes permitidas

Podem compor a base RAG:

- Documentos internos da Berti/EVIS
- Memoriais de obras anteriores
- Propostas antigas aprovadas
- Checklists próprios
- Composições próprias
- Aliases semânticos
- Tabelas de serviços próprias
- Histórico de custos
- Manuais técnicos com direito de uso
- Catálogos de fornecedores públicos/autorizados
- Normas e referências quando houver licença ou autorização de uso
- Documentos enviados pelo usuário para uma oportunidade específica
- Materiais públicos e abertos com licença compatível

### 7.3 Fontes com restrição

Normas ABNT e documentos técnicos protegidos por direito autoral não devem ser incorporados automaticamente na base RAG sem direito de uso/licença.

### 7.4 Regra jurídica

O EVIS não deve depender de base RAG irregular.

Se uma norma, manual ou documento tiver restrição de uso, ele só poderá ser utilizado se:

- O usuário possuir licença
- O uso for permitido
- O documento for interno/autorizado
- Houver autorização explícita para uso no sistema

### 7.5 Estrutura por especialidade

A base RAG deve ser separada por domínio.

```
knowledge_base/
├── civil_arquitetonico/
├── estrutural/
├── eletrica_dados_automacao/
├── hidrossanitario/
├── impermeabilizacao/
├── climatizacao_exaustao_ventilacao/
├── ppci_incendio/
├── marcenaria_mobiliario_tecnico/
├── vidros_esquadrias_serralheria/
├── acabamentos/
├── documentacao_aprovacoes/
├── administracao_gestao_obra/
├── compatibilizacao_tecnica/
└── comparativo_propostas/
```

### 7.6 RAG por oportunidade

Além da base permanente, cada oportunidade deve ter uma base temporária de contexto.

```
opportunity_context/
├── arquivos_recebidos
├── plantas
├── memoriais
├── fotos
├── conversas
├── orçamento_terceiro
└── observações_usuario
```

### 7.7 Prioridade de fontes

O agente deve priorizar fontes nesta ordem:

```
1. Dados validados pelo usuário
2. Documentos da oportunidade atual
3. Base interna EVIS/Berti
4. Composições próprias
5. Histórico de obras
6. Documentos técnicos autorizados
7. Referências públicas abertas
8. Inferência técnica com HITL
```

---

## 8. Camada 4 — Few-Shot Examples Reais

### 8.1 Objetivo

Few-shot examples ensinam ao agente o padrão correto de raciocínio e saída.

Eles devem ser baseados em casos reais da Berti/EVIS, quando possível.

### 8.2 Tipos de exemplos necessários

Cada agente deve ter exemplos de:

- Leitura correta
- Inferência correta
- Identificação de pendência
- Geração de HITL
- Geração de serviço orçamentável
- Identificação de risco
- Saída JSON válida
- Auditoria de conflito
- Proposta de premissa
- Proposta de exclusão

### 8.3 Exemplo — Estrutural

Entrada:

```
Projeto arquitetônico indica demolição de parede entre cozinha e sala.
Não há projeto estrutural anexado.
```

Saída esperada:

```json
{
  "agente": "estrutural",
  "item_analisado": "Demolição de parede entre cozinha e sala",
  "status": "pendente_hitl",
  "confianca": 0.65,
  "risco": "alto",
  "tipo_risco": "tecnico",
  "observacao": "Demolição identificada em projeto arquitetônico, porém não há confirmação de que o elemento não possui função estrutural.",
  "requer_hitl": true,
  "hitl_motivo": "Intervenção potencialmente estrutural sem projeto ou laudo anexado.",
  "bloqueia_consolidacao": true
}
```

### 8.4 Exemplo — Elétrica

Entrada:

```
Layout mostra novos pontos de iluminação no forro, mas não há quadro de cargas.
```

Saída esperada:

```json
{
  "agente": "eletrica_dados_automacao",
  "item_analisado": "Novos pontos de iluminação no forro",
  "status": "inferido",
  "confianca": 0.70,
  "risco": "medio",
  "tipo_risco": "tecnico_financeiro",
  "servicos_sugeridos": [
    "Infraestrutura elétrica para pontos de iluminação",
    "Passagem de cabos",
    "Instalação de comandos",
    "Instalação de luminárias se fornecimento for confirmado"
  ],
  "requer_hitl": true,
  "hitl_motivo": "Ausência de quadro de cargas e indefinição de fornecimento das luminárias.",
  "bloqueia_consolidacao": false
}
```

### 8.5 Exemplo — Administração

Entrada:

```
Obra em shopping center com execução noturna e múltiplas equipes.
```

Saída esperada:

```json
{
  "agente": "administracao_gestao_obra",
  "item_analisado": "Gestão de obra em shopping com execução noturna",
  "status": "inferido",
  "confianca": 0.85,
  "risco": "alto",
  "tipo_risco": "financeiro_comercial",
  "servicos_sugeridos": [
    "Administração de obra",
    "Coordenação de equipes",
    "Acompanhamento de shopping",
    "Gestão de liberações e OS",
    "Relatórios de acompanhamento"
  ],
  "requer_hitl": true,
  "hitl_motivo": "Definir se administração será cobrada como item separado, percentual, mensalidade ou embutida no BDI.",
  "bloqueia_consolidacao": false
}
```

---

## 9. Camada 5 — JSON Obrigatório de Saída

### 9.1 Objetivo

Os agentes não devem responder apenas em texto livre.

Cada agente deve retornar saída estruturada em JSON para persistência, auditoria e consumo pela interface.

### 9.2 Estrutura mínima obrigatória

```json
{
  "agent_name": "string",
  "agent_type": "string",
  "orcamento_id": "string",
  "versao_orcamento": "string",
  "item_analisado": "string",
  "disciplina": "string",
  "status": "string",
  "confianca": 0.0,
  "origem": {
    "tipo": "string",
    "arquivo_id": "string",
    "pagina": "string",
    "referencia": "string"
  },
  "itens_identificados": [],
  "itens_inferidos": [],
  "servicos_sugeridos": [],
  "quantitativos_possiveis": [],
  "riscos": [],
  "hitl": [],
  "premissas": [],
  "exclusoes": [],
  "bloqueia_consolidacao": false,
  "observacoes_tecnicas": "string",
  "observacoes_internas": "string"
}
```

### 9.3 Campos obrigatórios

Toda saída de agente deve conter:

```
agent_name
agent_type
orcamento_id
versao_orcamento
disciplina
status
confianca
origem
requer_hitl
bloqueia_consolidacao
```

### 9.4 Status permitidos

```
identificado
inferido
pendente
pendente_hitl
validado
rejeitado
verba
fora_do_escopo
revisar
bloqueado
```

---

## 10. Camada 6 — Score de Confiança

### 10.1 Objetivo

Cada análise deve possuir um score de confiança numérico de 0.0 a 1.0.

Esse score não representa verdade absoluta.

Ele representa a confiança operacional do agente na análise.

### 10.2 Escala

```
0.00 - 0.30 = baixa confiança
0.31 - 0.70 = média confiança
0.71 - 0.90 = alta confiança
0.91 - 1.00 = alta confiança com origem forte ou validação humana
```

### 10.3 Fatores que aumentam confiança

```
documento claro
cota legível
memorial compatível
dado validado pelo usuário
base interna validada
quantidade calculável
origem rastreável
agente especialista adequado
```

### 10.4 Fatores que reduzem confiança

```
imagem ilegível
projeto parcial
ausência de disciplina
inferência técnica
sem cota
sem memorial
conflito entre documentos
sem fonte de custo
fornecimento indefinido
risco técnico
```

### 10.5 Regra

Score baixo não impede análise preliminar, mas deve gerar HITL quando houver impacto relevante.

---

## 11. Camada 7 — Regras de Bloqueio e Não Afirmação

### 11.1 Objetivo

As regras de bloqueio impedem que o agente faça afirmações indevidas ou consolide dados críticos sem validação.

### 11.2 Afirmações proibidas

O agente não pode afirmar:

```
Está conforme norma.
Está seguro.
Pode executar.
Não há risco.
Não precisa ART/RRT.
Aprovado pelo shopping.
Aprovado pelo Corpo de Bombeiros.
A estrutura suporta.
A carga é suficiente.
O quadro elétrico comporta.
O fornecimento está incluso.
O custo é definitivo sem fonte.
A quantidade é definitiva sem origem.
```

### 11.3 Linguagem obrigatória

Quando houver dúvida técnica, usar:

```
Indício de possível risco técnico.
Informação não identificada nos arquivos.
Validação por responsável técnico necessária.
HITL obrigatório.
Não consolidar como definitivo.
Manter como pendência, verba ou premissa.
```

### 11.4 Bloqueios críticos

Bloquear consolidação quando houver:

```
risco estrutural sem validação
PPCI crítico sem validação
quantidade principal sem origem
custo principal sem fonte
escopo principal indefinido
fornecimento principal indefinido
auditoria crítica aberta
margem/preço final não validado
documento essencial ausente
```

---

## 12. Camada 8 — HITL

### 12.1 Objetivo

O HITL garante que decisões críticas passem por validação humana.

### 12.2 Quando acionar

Acionar HITL quando houver:

```
inferência relevante
risco técnico
risco financeiro
responsabilidade técnica
fornecimento indefinido
custo estimado relevante
quantidade estimada relevante
aprovação externa
conflito entre disciplinas
margem/BDI/preço final
```

### 12.3 Formato obrigatório

```json
{
  "hitl_required": true,
  "hitl_type": "hitl_risco_tecnico",
  "titulo": "Validar risco estrutural",
  "motivo": "Demolição identificada sem projeto estrutural anexado.",
  "impacto_tecnico": "Pode envolver elemento estrutural.",
  "impacto_financeiro": "Pode exigir laudo, reforço ou alteração de escopo.",
  "severidade": "alta",
  "opcoes": [
    "aprovar_com_premissa",
    "solicitar_laudo",
    "remover_do_escopo",
    "manter_pendente",
    "bloquear_consolidacao"
  ]
}
```

### 12.4 Relação com status

Se `hitl_required = true`, o item não pode ser tratado como definitivo até decisão do usuário.

---

## 13. Camada 9 — Auditoria Cruzada

### 13.1 Objetivo

A auditoria cruzada verifica conflitos entre agentes e impede que uma disciplina ignore impacto em outra.

### 13.2 Como funciona

Após execução dos agentes relevantes, o sistema deve acionar:

```
Agente Compatibilização Técnica
Auditor Técnico-Orçamentário
HITL Review
```

### 13.3 Exemplos de auditoria cruzada

```
Civil identificou novo forro.
Elétrica identificou luminárias.
Climatização identificou grelhas.
PPCI identificou sprinklers.
Compatibilização deve verificar conflito entre forro, luminárias, grelhas e sprinklers.
```

```
Marcenaria identificou bancada molhada.
Hidrossanitário não identificou ponto hidráulico.
Compatibilização deve gerar pendência/HITL.
```

```
Arquitetura identificou demolição.
Estrutural não recebeu projeto estrutural.
Auditoria deve bloquear consolidação se houver risco.
```

### 13.4 Saída obrigatória

```json
{
  "tipo": "auditoria_cruzada",
  "disciplinas_envolvidas": ["civil_arquitetonico", "ppci_incendio"],
  "conflito": "Novo forro pode interferir nos sprinklers existentes.",
  "gravidade": "alta",
  "impacto_tecnico": "Pode exigir remanejamento de bicos.",
  "impacto_financeiro": "Pode gerar custo adicional não previsto.",
  "hitl_required": true,
  "bloqueia_consolidacao": false
}
```

---

## 14. Camada 10 — Supabase Versionado

### 14.1 Objetivo

Todas as análises relevantes devem ser persistidas de forma versionada.

O orçamento deve preservar histórico e permitir auditoria.

### 14.2 Entidades relacionadas

```
orcamentos
orcamento_versoes
orcamento_agent_runs
orcamento_servicos
orcamento_quantitativos
orcamento_custos
orcamento_riscos
orcamento_hitl_validacoes
orcamento_hitl_auditoria
orcamento_auditorias
orcamento_propostas_base
```

### 14.3 Regra de versionamento

Gerar nova versão quando houver:

```
novo arquivo
alteração de escopo
alteração de quantidade
alteração de custo
alteração de margem
resolução HITL relevante
alteração de premissa
alteração de exclusão
nova proposta
```

### 14.4 Regra de rastreabilidade

Cada saída do agente deve registrar:

```
agent_name
agent_run_id
orcamento_id
versao_id
origem_documento
confianca
status
hitl_required
created_at
```

---

## 15. Stack Recomendada: Node Principal + Python como Camada IA/RAG

### 15.1 Princípio

O EVIS deve manter o fluxo principal em Node/TypeScript se esse for o stack atual do sistema.

Python pode ser usado como camada especializada para IA, RAG e processamento pesado.

### 15.2 Responsabilidade do Node/TypeScript

```
interface
fluxo principal do sistema
Supabase
oportunidade
orçamento
proposta
obra
HITL
permissões
persistência
API interna
orquestração determinística
```

### 15.3 Responsabilidade do Python

```
RAG
embeddings
parsing pesado de documentos
processamento de PDFs
protótipos de agentes
LangChain/LlamaIndex
vector store
extração multimodal futura
serviços auxiliares de IA
```

### 15.4 Integração recomendada

```
Frontend / EVIS App
→ Node/TypeScript API
→ Orçamentista Orchestrator
→ Python RAG Service quando necessário
→ LLM Provider
→ Supabase
```

### 15.5 Regra

Python não deve virar um sistema paralelo desconectado.

Ele deve operar como serviço auxiliar ou camada especializada chamada pelo núcleo EVIS.

---

## 16. Estratégia de Implementação por Fases

### Fase 1 — Especialização por Prompt + JSON

Objetivo: validar comportamento mínimo dos agentes sem RAG pesado.

Implementar:

```
prompts canônicos
schemas JSON
score de confiança
HITL
auditoria básica
persistência em Supabase ou mock local
```

Agentes prioritários:

```
Civil / Arquitetônico
Elétrica
Hidrossanitário
PPCI
Administração / Gestão
Compatibilização Técnica
```

### Fase 2 — Few-Shot EVIS/Berti

Objetivo: melhorar consistência com exemplos reais.

Implementar:

```
biblioteca de exemplos por agente
casos reais higienizados
entrada → análise → JSON esperado
casos de risco
casos de HITL
casos de proposta
```

### Fase 3 — RAG Interno

Objetivo: dar memória técnica própria ao EVIS.

Implementar base com:

```
serviços cadastrados
aliases semânticos
composições próprias
histórico de obras
propostas antigas
checklists próprios
premissas recorrentes
exclusões recorrentes
custos históricos
```

### Fase 4 — RAG Técnico Autorizado

Objetivo: ampliar conhecimento com fontes externas permitidas.

Adicionar:

```
catálogos técnicos
manuais autorizados
documentos licenciados
materiais públicos com licença compatível
normas apenas quando houver licença/uso autorizado
```

### Fase 5 — Auditoria Cruzada Avançada

Objetivo: reduzir risco de orçamento incompleto.

Implementar:

```
matriz de conflitos
agente compatibilizador
auditor técnico-orçamentário
bloqueios críticos
regras de consolidação
```

### Fase 6 — BIM/IFC Futuro

Objetivo: evoluir para leitura estruturada de modelos.

Possíveis integrações futuras:

```
IFC
BIM
QTO automático
extração geométrica
mapeamento objeto → serviço
4D/5D planning
```

---

## 17. Estratégia de Base RAG

### 17.1 Estrutura mínima

```
rag/
├── loaders/
├── chunkers/
├── embeddings/
├── retrievers/
├── vectorstores/
├── permissions/
└── evaluators/
```

### 17.2 Metadados obrigatórios por documento

```json
{
  "document_id": "string",
  "title": "string",
  "source_type": "interno | cliente | publico | licenciado | fornecedor",
  "license_status": "autorizado | restrito | desconhecido | proibido",
  "discipline": "string",
  "project_id": "string",
  "orcamento_id": "string",
  "created_at": "date",
  "tags": []
}
```

### 17.3 Regra de recuperação

O retriever só deve retornar documentos com:

```
license_status = autorizado
```

Ou documentos vinculados diretamente à oportunidade atual enviada pelo usuário.

### 17.4 Chunking

Os documentos devem ser divididos por lógica técnica, não apenas por tamanho fixo.

Preferir chunks por:

```
seção
tabela
item de memorial
ambiente
disciplina
serviço
detalhe técnico
premissa
exclusão
```

---

## 18. Estratégia de Few-Shot Library

### 18.1 Estrutura

```
few_shots/
├── civil_arquitetonico/
├── estrutural/
├── eletrica_dados_automacao/
├── hidrossanitario/
├── impermeabilizacao/
├── climatizacao_exaustao_ventilacao/
├── ppci_incendio/
├── marcenaria_mobiliario_tecnico/
├── vidros_esquadrias_serralheria/
├── acabamentos/
├── documentacao_aprovacoes/
├── administracao_gestao_obra/
├── compatibilizacao_tecnica/
└── comparativo_propostas/
```

### 18.2 Formato do exemplo

```json
{
  "example_id": "string",
  "agent_type": "string",
  "scenario": "string",
  "input_summary": "string",
  "expected_reasoning_summary": "string",
  "expected_json_output": {},
  "tags": [],
  "approved_by_user": true
}
```

### 18.3 Regra

Few-shots devem ser curtos, objetivos e aprovados.

Não devem conter dados sensíveis de clientes sem anonimização.

---

## 19. Estratégia de Avaliação dos Agentes

### 19.1 Métricas mínimas

Cada agente deve ser testado por:

```
extração correta de itens
não invenção
geração correta de HITL
classificação correta de risco
formato JSON válido
origem rastreável
score de confiança coerente
respeito aos limites técnicos
```

### 19.2 Testes obrigatórios

Criar cenários de teste para:

```
documento completo
documento parcial
documento contraditório
projeto sem disciplina essencial
fornecimento indefinido
risco estrutural
PPCI crítico
obra em shopping
orçamento concorrente
```

### 19.3 Critério de aprovação

Um agente só deve ser considerado pronto quando:

```
[ ] não inventar dados ausentes
[ ] gerar JSON válido
[ ] acionar HITL corretamente
[ ] respeitar limites técnicos
[ ] persistir origem/confiança/status
[ ] não misturar pré-obra com execução
```

---

## 20. Limites Jurídicos e Técnicos

### 20.1 Normas técnicas

Normas técnicas protegidas por direito autoral só devem ser usadas se houver licença ou autorização.

### 20.2 Responsabilidade profissional

O EVIS não substitui:

- Engenheiro
- Arquiteto
- Projetista
- Responsável técnico
- Fiscal
- Consultor normativo

### 20.3 Conformidade normativa

O agente não deve declarar conformidade normativa definitiva.

Deve apenas apontar:

- Indícios
- Lacunas
- Necessidade de validação
- Risco
- Documentação pendente
- HITL

### 20.4 Decisões comerciais

A IA não deve decidir margem, desconto, risco aceito ou proposta final sem validação do usuário.

---

## 21. Exemplo de System Prompt Base

### Agente Estrutural

```
Você é o Agente Estrutural do Orçamentista IA EVIS.

Você atua exclusivamente na fase de pré-obra/orçamento.

Sua função é interpretar documentos estruturais, identificar elementos estruturais, 
riscos, lacunas, serviços orçamentáveis e pontos que exigem validação humana.

Você deve analisar:
- fundações
- pilares
- vigas
- lajes
- reforços
- furações
- bases
- cargas
- demolições críticas
- ausência de projeto estrutural
- necessidade de laudo ou ART/RRT

Você não substitui engenheiro estrutural.
Você não declara segurança estrutural.
Você não declara conformidade normativa definitiva.
Você não autoriza execução.

Quando houver intervenção estrutural, risco, ausência de documento, carga indefinida, 
furação ou demolição crítica, gere HITL obrigatório.

Retorne sempre JSON válido seguindo o schema do Orçamentista IA.
```

---

## 22. Exemplo de Schema Final de Agente

```json
{
  "agent_name": "estrutural",
  "agent_type": "domain_agent",
  "orcamento_id": "orc_001",
  "versao_orcamento": "v1",
  "disciplina": "estrutural",
  "item_analisado": "Demolição de parede entre salão e cozinha",
  "status": "pendente_hitl",
  "confianca": 0.62,
  "origem": {
    "tipo": "planta",
    "arquivo_id": "arq_003",
    "pagina": "2",
    "referencia": "Planta de demolição"
  },
  "itens_identificados": [
    {
      "nome": "Demolição de parede",
      "status": "identificado",
      "confianca": 0.80
    }
  ],
  "itens_inferidos": [
    {
      "nome": "Possível risco estrutural",
      "motivo": "Não há projeto estrutural anexado para confirmar natureza da parede.",
      "confianca": 0.62
    }
  ],
  "servicos_sugeridos": [
    {
      "nome": "Validação técnica estrutural",
      "unidade": "verba",
      "status": "pendente"
    }
  ],
  "riscos": [
    {
      "tipo": "tecnico",
      "severidade": "alta",
      "descricao": "Intervenção potencialmente estrutural sem validação."
    }
  ],
  "hitl": [
    {
      "hitl_required": true,
      "hitl_type": "hitl_risco_tecnico",
      "titulo": "Validar demolição com risco estrutural",
      "motivo": "Ausência de projeto ou laudo estrutural.",
      "severidade": "alta"
    }
  ],
  "premissas": [],
  "exclusoes": [],
  "bloqueia_consolidacao": true,
  "observacoes_tecnicas": "Não consolidar demolição como executável sem validação de responsável técnico.",
  "observacoes_internas": "Pode exigir laudo, ART/RRT ou revisão do escopo."
}
```

---

## 23. Checklist de Implementação

A estratégia estará corretamente implementada quando:

```
[ ] Cada agente tiver prompt canônico
[ ] Cada agente tiver competências técnicas documentadas
[ ] Cada agente retornar JSON obrigatório
[ ] Cada saída tiver score de confiança
[ ] Cada saída tiver origem rastreável
[ ] RAG usar apenas fontes autorizadas
[ ] Few-shots reais estiverem higienizados
[ ] HITL for acionado em incertezas relevantes
[ ] Bloqueios críticos impedirem consolidação
[ ] Auditoria cruzada for executada
[ ] Supabase registrar versão, agente, saída e decisão humana
[ ] Node/TypeScript continuar como núcleo do EVIS
[ ] Python operar apenas como camada IA/RAG quando necessário
```

---

## 24. Critério de Sucesso

A estratégia será considerada correta quando os agentes conseguirem operar de forma especializada sem fine-tuning, gerando análises técnicas estruturadas, auditáveis e rastreáveis, com limites claros, base autorizada, validação humana e persistência versionada.

O objetivo não é criar agentes que "dão parecer técnico definitivo".

O objetivo é criar agentes que **pré-analisam, estruturam, alertam, classificam, orçam preliminarmente e encaminham decisões críticas para validação humana**.

---

## 25. Frase Canônica Final

A estratégia de especialização dos agentes do Orçamentista IA EVIS não depende de treinar modelos do zero. Ela combina prompts canônicos, competências técnicas mínimas, RAG com documentos autorizados, exemplos reais, saída JSON obrigatória, score de confiança, regras de bloqueio, HITL, auditoria cruzada e persistência versionada em Supabase.

**A IA não substitui o responsável técnico.**

**A IA organiza a leitura, estrutura o orçamento e aponta riscos.**

**O usuário valida.**

**O EVIS consolida.**
