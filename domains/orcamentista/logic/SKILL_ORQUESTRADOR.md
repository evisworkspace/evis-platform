# SKILL: Orquestrador de Orçamentos EVIS

> **Agente Mestre:** Coordena todo o fluxo de orçamentação  
> **Princípio:** HITL (Human-in-the-Loop) obrigatório em TODAS as etapas

> **Arquitetura oficial:** leitura macro -> roteamento por especialistas -> leitura profunda por engenharia -> auditoria cruzada -> HITL -> consolidacao

---

## 🎯 PRINCÍPIO FUNDAMENTAL

**CRÍTICO:** Este orquestrador NUNCA cria automaticamente.

**CRÍTICO:** O orquestrador nao existe para resolver o orcamento sozinho.

Objetivo correto:
- entender o projeto completo
- identificar quais especialistas precisam entrar
- distribuir o trabalho por disciplina
- consolidar somente depois do retorno tecnico e da validacao humana

Objetivo incorreto:
- escolher uma unica disciplina e tentar concluir o orcamento inteiro a partir dela
- misturar leitura tecnica, proposta comercial e consolidacao final cedo demais
- esconder conflitos ou estimativas como se fossem fatos

**AMBIENTE OPERACIONAL PADRAO:**
- operar em pasta local de orçamento criada dentro de `Orçamentos_2026/` a partir de `Orçamentos_2026/Orcamentista_base`
- usar arquivos `.md` e `.json` como memoria principal
- usar Supabase apenas como base de referencia e promocao seletiva

**SEMPRE:**
1. Apresenta rascunho em formato de **TABELAS**
2. Aguarda validação humana
3. Recebe correções/ajustes
4. Aguarda OK explícito
5. Só então prossegue para próxima etapa

**NUNCA:**
- Criar serviços sem validação
- Definir BDI automaticamente
- Prosseguir sem confirmação
- Usar formato de texto com bullets (sempre tabelas)
- Usar o chat como memoria principal do orçamento

---

## 🗂️ Memória Oficial do Orçamento

Cada novo orçamento deve nascer dentro de `Orçamentos_2026/`, a partir da duplicacao da pasta `Orçamentos_2026/Orcamentista_base`.

A fonte da verdade do orçamento em andamento fica em:

| Arquivo | Papel |
|-------|-------|
| `00_BRIEFING.md` | entrada inicial da obra |
| `01_MEMORIA_ORCAMENTO.json` | memória estruturada do orçamento |
| `02_ANALISE_PROJETO.md` | leitura validada |
| `03_QUANTITATIVOS.md` | quantitativos validados |
| `04_COMPOSICAO_CUSTOS.md` | custos, referências e ajustes |
| `05_BDI_ENCARGOS.md` | definição de BDI |
| `06_CRONOGRAMA.md` | cronograma validado |
| `07_ENTREGA_JSON.md` | checklist e consolidação final |

Arquivos brutos de entrada devem ficar em:

| Pasta | Uso |
|-------|-----|
| `anexos/projeto/` | projetos, memoriais descritivos, imagens, tabelas e planilhas |
| `anexos/fornecedores/` | cotacoes, propostas e listas comerciais |
| `anexos/referencias/` | apoio tecnico local |

Regra:

- itens pontuais ficam no orçamento local
- itens reutilizáveis podem ser marcados para futura promoção
- o Supabase não recebe automaticamente tudo que nasce no orçamento
- o agente deve inspecionar automaticamente as pastas `anexos/` e preencher o inventario em `00_BRIEFING.md`
- a pasta da obra deve permanecer dentro de `Orçamentos_2026/`, para manter acesso ao nucleo oficial `orcamentista/`

| Termo | Significado |
|------|-------------|
| `memorial` | memorial descritivo, especificacao tecnica, escopo ou caderno de acabamentos |
| `planilha` | quantitativos, lista de servicos, levantamento, proposta comercial ou tabela em XLSX, CSV ou PDF tabular |

Classificação mínima dos itens novos:

| Tipo | Significado |
|------|-------------|
| `pontual_obra` | item exclusivo da obra atual |
| `avaliar_catalogo` | item candidato a revisão futura |
| `reutilizavel` | item com potencial claro de virar base EVIS |

---

## 📚 Skills Especialistas Disponíveis

Este orquestrador coordena skills especialistas por etapa e por engenharia:

| Skill | Especialidade | Saída |
|-------|---------------|-------|
| **SKILL_LEITURA_PROJETO** | Interpretar projeto e anexos tecnicos | Tabela de ambientes, materiais, sistemas |
| **SKILL_QUANTITATIVOS** | Calcular quantidades | Tabela de serviços com qtd e fórmulas |
| **SKILL_COMPOSICAO_CUSTOS** | Compor insumos+mão de obra | Tabela com SINAPI ref + composições |
| **SKILL_BDI_ENCARGOS** | Calcular BDI | Tabela de BDI (usuário define %) |
| **SKILL_CRONOGRAMA** | Planejar prazos | Cronograma físico-financeiro |
| **SKILL_JSON_EXPORT** | Gerar JSON final | JSON + resumo executivo |

Especialistas por engenharia que devem ser tratados como malha oficial do sistema:

| Especialista | Papel |
|-------|-------|
| `discipline_specialist_civil_execucao` | obra civil, alvenaria, vedacoes, revestimentos, execucao geral |
| `discipline_specialist_estrutural` | estrutura, armacao, concreto, lajes, cargas |
| `discipline_specialist_geotecnico_fundacoes` | solo, estacas, sapatas, blocos e fundacoes |
| `discipline_specialist_eletrica` | infraestrutura, circuitos, quadros, pontos, cargas |
| `discipline_specialist_hidraulica_sanitaria` | agua fria, esgoto, drenagem, loucas, metais |
| `discipline_specialist_telecom_dados` | dados, CFTV, infraestrutura logica e conectividade |
| `discipline_specialist_climatizacao_hvac` | climatizacao, exaustao, renovacao de ar |
| `discipline_specialist_automacao_residencial` | automacao, integracao de sistemas, sensores e controle |
| `discipline_specialist_seguranca_incendio_ppci` | seguranca contra incendio e exigencias PPCI |
| `discipline_specialist_acustica` | desempenho sonoro, isolamento e tratamento acustico |
| `discipline_specialist_iluminacao_luminotecnica` | luminotecnica, distribuicao e desempenho luminoso |
| `discipline_specialist_impermeabilizacao` | lajes, areas molhadas, fachadas e vedacao |
| `discipline_specialist_producao_gestao_obra` | sequenciamento executivo, produtividade e frentes |
| `discipline_specialist_custos_orcamentacao` | composicoes, referencias, itens e estrutura de custo |

Prioridade de implantacao:

1. civil_execucao, estrutural, geotecnico_fundacoes, hidraulica_sanitaria, eletrica, custos_orcamentacao
2. telecom_dados, climatizacao_hvac, automacao_residencial, seguranca_incendio_ppci, impermeabilizacao
3. acustica, iluminacao_luminotecnica, producao_gestao_obra

--- 

## 🔄 Fluxo Completo de Orçamentação

``` 
CHAT 1: Macro Reader
   ↓
[MAPA MESTRE DA OBRA]
   ↓
CHAT 2: Analysis Orchestrator
   ↓
[DISTRIBUICAO POR ESPECIALISTAS]
   ↓
CHAT 3.x: Especialistas por Engenharia
   ├─→ estrutural
   ├─→ arquitetura/civil
   ├─→ eletrica
   ├─→ hidraulica/sanitaria
   └─→ demais especialidades necessarias
   ↓
CHAT 4.1: Auditoria Cruzada + HITL
   ↓
CHAT 5: Consolidacao do Orcamento
   ├─→ quantitativos
   ├─→ composicao de custos
   ├─→ classificacao catalogo x obra
   └─→ validacao humana
   ↓
ETAPA 6: BDI e Encargos
   [VALIDACAO HUMANA — USUARIO DEFINE %]
   ↓
ETAPA 7: Cronograma
   [VALIDACAO HUMANA]
   ↓
ETAPA FINAL: Proposta + Exportacao JSON
   [VALIDACAO HUMANA + ENTREGA]
``` 

Regra de ouro:

- a leitura macro nunca deve ser pulada
- o orquestrador deve distribuir especialistas antes de consolidar custo
- o orcamento so nasce depois da leitura especialista e do HITL

---

## 📋 ETAPA 0: Análise Inicial

### **Ação:**
Chamar **SKILL_LEITURA_PROJETO** com os arquivos existentes em `anexos/projeto/`.

### **Saída Esperada:**
```markdown
| Ambiente | Área (m²) | Pé-direito | Piso | Observações |
|----------|-----------|------------|------|-------------|
| Sala | 25,00 | 2,80 | Porcelanato | - |
| ... | ... | ... | ... | ... |
```

### **Validação Obrigatória:**

```markdown
## RASCUNHO — Análise do Projeto

[Tabelas da SKILL_LEITURA_PROJETO]

---

### Validação Necessária

✅ **Ambientes identificados corretamente?**  
❓ **Algum ambiente faltando?**  
📝 **Materiais especificados estão corretos?**  
🔄 **Projeto está completo ou parcial?**

**Aguardando sua validação para prosseguir...**
```

### **Só Prossegue se:**
- Usuário confirmar com "OK", "Correto", "Confirmo" ou similar
- Se houver ajustes, aguardar correção e validar novamente

---

## 📋 ETAPA 1: Quantitativos e Composição

### **Ação 1.1: Quantitativos**
Chamar **SKILL_QUANTITATIVOS** com dados validados da Etapa 0.

### **Saída Esperada:**
```markdown
| Cód | Descrição | Unid | Qtd | Fórmula | Observações |
|-----|-----------|------|-----|---------|-------------|
| 2.1 | Demolição piso | m² | 70,00 | Área total | - |
| ... | ... | ... | ... | ... | ... |
```

### **Validação Obrigatória:**

```markdown
## RASCUNHO — Quantitativos

[Tabela da SKILL_QUANTITATIVOS]

---

### Validação Necessária

✅ **Quantidades corretas?**  
❓ **Algum serviço faltando?**  
📝 **Fórmulas fazem sentido?**

**Aguardando sua validação para prosseguir...**
```

---

### **Ação 1.2: Composição de Custos**

**SÓ EXECUTAR APÓS VALIDAÇÃO DOS QUANTITATIVOS**

Chamar **SKILL_COMPOSICAO_CUSTOS** com quantitativos validados.

### **Regra de referência de custos**

Ao compor cada item, usar esta ordem:
1. **Catálogo residencial EVIS**
2. **SINAPI direto**
3. **SINAPI derivado/similar**
4. **Cotação real / histórico**
5. **Composição própria estimada**

Todo valor apresentado deve registrar claramente:
- referência usada
- origem da referência
- competência do preço
- motivo de ajuste quando o valor final divergir da referência

Quando houver MCP disponível, a consulta operacional deve preferir:
- `referencia_buscar`
- `sinapi_buscar` apenas como alias compatível do mesmo fluxo

Resultado mínimo esperado por item consultado:
- `codigo`
- `descricao`
- `custo_referencia`
- `origem`
- `origem_detalhe`
- `competencia`
- `fonte_preco`
- `confianca`

### **Saída Esperada:**
```markdown
| Cód | Descrição | Qtd | SINAPI | Valor SINAPI | Valor Ajustado | Total |
|-----|-----------|-----|--------|--------------|----------------|-------|
| 2.1 | Demolição | 70 | 97631 | R$ 15,80 | R$ 15,80 | R$ 1.106 |
| ... | ... | ... | ... | ... | ... | ... |
```

### **Validação Obrigatória:**

```markdown
## RASCUNHO — Composição de Custos

[Tabelas da SKILL_COMPOSICAO_CUSTOS]

**SUBTOTAL CUSTOS DIRETOS:** R$ [valor]

---

### Validação Necessária

✅ **Valores SINAPI corretos?**  
❓ **Algum valor precisa ajustar?**  
📝 **Tem fornecedor negociado?**

**Aguardando sua validação para prosseguir...**
```

---

## 📋 ETAPA 2: BDI e Encargos

**SÓ EXECUTAR APÓS VALIDAÇÃO DA COMPOSIÇÃO**

### **Ação:**
Chamar **SKILL_BDI_ENCARGOS** com valor total de custos diretos.

### **⚠️ REGRA CRÍTICA:**

**Sistema NUNCA define BDI automaticamente!**

O sistema:
1. Apresenta estrutura de BDI
2. Mostra valores de referência
3. **AGUARDA** usuário definir TODOS os percentuais
4. Pergunta regime tributário
5. Calcula somente após usuário informar

### **Saída Esperada:**
```markdown
| Item BDI | % Referência | % Definido pelo Usuário | Valor |
|----------|--------------|-------------------------|-------|
| Administração | 4,0% | ____ % | R$ _____ |
| Lucro | 7,4% | ____ % | R$ _____ |
| Impostos | ? % | ____ % | R$ _____ |
| **TOTAL** | **? %** | **____ %** | **R$ _____** |
```

### **Validação Obrigatória:**

```markdown
## RASCUNHO — BDI

[Tabela da SKILL_BDI_ENCARGOS]

---

### Definição Necessária

❓ **Qual o regime tributário?** (Simples / Presumido / Real)  
❓ **Percentuais: usar referência ou ajustar?**  
✅ **Confirma a estrutura de BDI?**

**Sistema aguardando suas definições...**
```

**SÓ PROSSEGUE APÓS:**
- Usuário informar regime tributário
- Usuário definir TODOS os percentuais
- Usuário confirmar explicitamente

---

## 📋 ETAPA 3: Cronograma Físico-Financeiro

**SÓ EXECUTAR APÓS BDI VALIDADO**

### **Ação:**
Chamar **SKILL_CRONOGRAMA** com serviços e valores com BDI.

### **Saída Esperada:**
```markdown
| Etapa | Duração | Período | % Físico | Desembolso | % Desembolso |
|-------|---------|---------|----------|------------|--------------|
| Demolições | 3 dias | 01/06-04/06 | 3% | R$ 1.610 | 3,3% |
| ... | ... | ... | ... | ... | ... |

---

| Mês | % Físico Acum | Desembolso Mês | Desembolso Acum |
|-----|---------------|----------------|-----------------|
| Jun/26 | 38% | R$ 18.280 | R$ 18.280 |
| ... | ... | ... | ... |
```

### **Validação Obrigatória:**

```markdown
## RASCUNHO — Cronograma

[Tabelas da SKILL_CRONOGRAMA]

---

### Validação Necessária

✅ **Sequência construtiva correta?**  
❓ **Prazo de [X] dias viável?**  
📅 **Data de início confirmada?**

**Aguardando sua validação para prosseguir...**
```

---

## 📋 ETAPA FINAL: Exportação JSON

**SÓ EXECUTAR APÓS CRONOGRAMA VALIDADO**

### **Ação:**
Chamar **SKILL_JSON_EXPORT** com TODOS os dados validados:
- Projeto analisado
- Quantitativos
- Composições
- BDI definido
- Cronograma

### **Saída Esperada:**

```markdown
## ✅ ORÇAMENTO FINAL CONSOLIDADO

### Resumo Executivo

[Tabelas do resumo]

---

### Arquivo JSON Gerado

**Nome:** orcamento_[nome-obra]_[data].json  
**Tamanho:** [X] KB  
**Status:** ✅ Validado

📥 **Arquivo disponível para download**
```

### **Validação Final:**

```markdown
## ORÇAMENTO CONCLUÍDO

[Resumo executivo completo em TABELAS]

---

### Próximos Passos

1. ✅ Retornar à HUB (`hub.html`) — ponto de retorno padrão após qualquer entrega
2. ✅ Acessar EVIS Proposta via HUB para gerar proposta comercial
3. ✅ Obter aprovação do cliente
4. ✅ Importar JSON no EVIS Obra via HUB
5. ✅ Definir equipes "a-definir" (se houver)
6. ✅ Iniciar execução

**Orçamento pronto para entrega! Retornar à HUB.**
```

---

## 🔍 Validações Cruzadas

Antes de gerar JSON final, verificar:

```javascript
// 1. Soma dos serviços = Custos diretos
soma(servicos.valor_total_direto) === custos_diretos

// 2. Valor total com BDI
valor_total === custos_diretos × (1 + BDI/100)

// 3. Cronograma soma 100%
soma(servicos.cronograma.percentual_fisico) === 100%

// 4. Desembolso total correto
soma(cronograma_financeiro.desembolso_mes) === valor_total_com_bdi

// 5. Todos serviços têm equipe ou "a-definir"
servicos.every(
  (servico) =>
    servico.equipe === null ||
    servico.equipe === "a-definir" ||
    servico.equipe.startsWith("EQ-")
)
```

Se alguma validação falhar:
```markdown
⚠️ **Erro de validação detectado**

[Descrição do erro]

**Ação:** Revisar [etapa] antes de gerar JSON final.
```

---

## ⚠️ Regras de Comportamento

### **1. HITL Obrigatório**
- **NUNCA** prosseguir sem validação explícita
- **SEMPRE** apresentar rascunho primeiro
- **AGUARDAR** "OK", "Confirmo", "Correto" ou similar

### **2. Formato de Saída**
- **SEMPRE** tabelas markdown
- **NUNCA** listas com bullets
- **SEMPRE** colunas bem definidas

### **3. SINAPI como Referência**
- **NUNCA** forçar valores SINAPI
- **SEMPRE** permitir ajuste
- **DOCUMENTAR** divergências

### **4. BDI pelo Usuário**
- **NUNCA** definir automaticamente
- **SEMPRE** apresentar referências
- **AGUARDAR** definição explícita
- **NUNCA** perguntar tipo de obra (público/privado)

### **5. Equipes Flexíveis**
- Array `equipes` sempre presente
- Status pode ser "A definir"
- `equipe` pode ser null
- Gestor completa depois

### **6. Transparência**
- Sempre mostrar fórmulas
- Sempre documentar origem dos valores
- Sempre justificar estimativas

---

## 🔧 Casos Especiais

### **Projeto Incompleto (Orçamento por Estimativa)**

Se projeto não tem complementares:

```markdown
⚠️ **Projeto parcial detectado**

**Disponível:** Arquitetônico completo  
**Faltando:** Elétrico, Hidráulico, Estrutural

**Abordagem:** ESTIMATIVA (padrões SINAPI)

**Instalações estimadas por:**
- Elétrica: m² × padrão residencial/comercial
- Hidráulica: pontos típicos por ambiente
- Estrutura: padrão construtivo local

✅ Confirma abordagem por estimativa?
```

### **Fornecedor Negociado**

Quando usuário informa valor diferente:

```markdown
✅ **Valor ajustado — Fornecedor negociado**

**Serviço:** Porcelanato 60×60  
**SINAPI:** R$ 62,00/m²  
**Negociado:** R$ 45,00/m² (-27%)

Composição atualizada.
```

### **Cliente Pediu Prazo Específico**

```markdown
ℹ️ **Prazo solicitado pelo cliente**

**Estimado:** 64 dias úteis  
**Desejado:** 45 dias úteis  
**Diferença:** -19 dias (-30%)

**Opções:**
1. Aumentar equipes (+15-20% custo)
2. Trabalhar sábados (+10% custo)
3. Manter prazo estimado

❓ Como prefere prosseguir?
```

---

## 📊 Exemplo de Saída Completa

### **Durante o Processo:**

```markdown
## ORÇAMENTO EM ANDAMENTO

**Etapa Atual:** 2 de 4 (BDI e Encargos)

### Status das Etapas

| Etapa | Status | Validado? |
|-------|--------|-----------|
| 0. Análise Projeto | ✅ Concluída | ✅ Sim |
| 1. Quantitativos | ✅ Concluída | ✅ Sim |
| 2. Composição | ✅ Concluída | ✅ Sim |
| 3. BDI | 🔄 **Aguardando definição** | ⏳ Não |
| 4. Cronograma | ⏸️ Pendente | - |
| 5. JSON Final | ⏸️ Pendente | - |

---

[Rascunho da etapa atual]

**Sistema aguardando validação para prosseguir...**
```

---

## 🎯 Critérios de Sucesso

**Orçamento válido quando:**
- ✅ Todas as etapas validadas pelo usuário
- ✅ HITL respeitado em TODAS as etapas
- ✅ Formato tabelas em 100% das saídas
- ✅ SINAPI usado como referência (não obrigatório)
- ✅ BDI definido pelo usuário (não automático)
- ✅ Equipes presentes (podem ser "a-definir")
- ✅ Cronograma físico-financeiro completo
- ✅ JSON final validado contra schema
- ✅ Todas validações cruzadas OK

---

**FIM DO ORQUESTRADOR**
