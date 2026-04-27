# Referências Técnicas — Orçamentação de Obras

> Base de conhecimento técnico para suporte às skills de orçamentação

---

## 📚 Fontes Oficiais

### 1. SINAPI — Sistema Nacional de Pesquisa de Custos e Índices

**Fonte:** Caixa Econômica Federal + IBGE  
**URL:** https://www.caixa.gov.br/poder-publico/modernizacao-gestao/sinapi/

**O que é:**
- Tabela oficial de composições de custos para construção civil
- Atualização mensal com preços de insumos e mão de obra por estado
- Obrigatório em obras públicas (Decreto 7.983/2013)
- Referência confiável também para obras privadas

**Como usar:**
- Banco já importado no Supabase (10.284 composições - março/2026)
- Buscar por código SINAPI ou por descrição
- Usar como referência de valores
- Usuário pode ajustar se houver negociação com fornecedor

**Livro de Metodologias SINAPI:**
https://www.caixa.gov.br/Downloads/sinapi-metodologia/Livro_SINAPI_Metodologias_Conceitos.pdf

---

### 2. Manual de Elaboração de Orçamentos — IOPES-ES

**Fonte:** Instituto de Obras Públicas do Espírito Santo  
**URL:** https://iopes.es.gov.br/Media/iopes/Fa%C3%A7a%20Certo/Manual%20de%20Elabora%C3%A7%C3%A3o%20de%20Or%C3%A7amentos%20-%20Obras.pdf

**Conteúdo relevante:**
- Checklist para recebimento de projetos
- Levantamento e quantificação de serviços
- Composição de custos (cotações, BDI, encargos sociais)
- BDI diferenciado por tipo de obra
- Planilha de quantitativos e discriminação orçamentária
- Processo completo de elaboração de orçamentos

**Uso nas skills:**
- `SKILL_LEITURA_PROJETO`: Checklist de recebimento
- `SKILL_QUANTITATIVOS`: Metodologia de levantamento
- `SKILL_BDI_ENCARGOS`: Composição de BDI (referências)

---

### 3. Livro "Orçamento de Obras" — UFSC

**Fonte:** Repositório Institucional UFSC (acesso livre, CC BY-NC 4.0)  
**URL:** https://repositorio.ufsc.br/bitstream/handle/123456789/210029/or%C3%A7amento%20de%20obras%2C%20segunda%20edi%C3%A7%C3%A3o%20revisada%20e%20ampliada.pdf

**Autores:** Ávila, Librelotto e Lopes

**Conteúdo relevante:**
- Interação entre projetos e execução de obras
- Elementos de um projeto (arquitetônico, estrutural, instalações)
- Quantitativos para orçamento analítico
- Planilhas orçamentárias com referência TCPO
- Custos diretos e indiretos

**Uso nas skills:**
- `SKILL_LEITURA_PROJETO`: Identificação de elementos de projeto
- `SKILL_QUANTITATIVOS`: Metodologia de cálculo de quantitativos
- `SKILL_COMPOSICAO_CUSTOS`: Estrutura de composições

---

### 4. Mini Curso — Interpretação de Projetos Arquitetônicos

**Fonte:** Faculdade de Engenharia Civil da UFPA  
**URL:** https://www.novaconcursos.com.br/arquivos-digitais/erratas/13994/18010/mini-curso-interpretacao-projetos-arquitetonicos.pdf

**Conteúdo relevante:**
- Plantas, elevações, fachadas e cortes
- Normas ABNT NBR 8196 (escalas)
- Vocabulário técnico: pé-direito, peitoril, cumeeira
- Leitura de projetos de execução
- Softwares: AutoCAD, Revit, ArchiCAD

**Uso nas skills:**
- `SKILL_LEITURA_PROJETO`: Interpretação de plantas (PRINCIPAL)
- Vocabulário técnico correto
- Identificação de elementos construtivos

---

## 🎓 Conceitos Técnicos Aplicados

### BDI — Benefícios e Despesas Indiretas

**Definição:**  
Percentual aplicado sobre custos diretos para cobrir despesas administrativas, impostos, lucro e riscos.

**Componentes:**
- Administração central (3-5%)
- Seguro e garantia (0,5-1,0%)
- Risco (1-2%)
- Despesas financeiras (1-2%)
- Lucro (6-10%)
- Impostos (conforme regime tributário)

**Fórmula:**
```
Valor Total = Custos Diretos × (1 + BDI/100)
```

**Referências:**
- Manual IOPES-ES: Obras privadas
- Acórdão TCU 2622/2013: Obras públicas (apenas referência)

---

### Encargos Sociais

**Definição:**  
Custos adicionais sobre mão de obra (INSS, FGTS, férias, 13º, etc).

**Percentuais típicos:**
- COM desoneração: ~80%
- SEM desoneração: ~120%

⚠️ **Nota:** SINAPI já inclui encargos sociais nos valores.

---

### Cronograma Físico-Financeiro

**Definição:**  
Planejamento que relaciona execução física da obra com desembolso financeiro.

**Componentes:**
- **Físico:** Percentual de avanço da obra
- **Financeiro:** Desembolso previsto por período

**Curva S:**  
Gráfico típico de desembolso (início lento, meio acelerado, fim lento).

---

## 📖 Vocabulário Técnico

### Termos de Projeto

| Termo | Definição |
|-------|-----------|
| **Pé-direito** | Altura do piso ao teto |
| **Peitoril** | Altura da base da janela ao piso |
| **Vão** | Abertura (porta ou janela) |
| **Cumeeira** | Ponto mais alto do telhado |
| **Platibanda** | Prolongamento da parede acima do telhado |
| **Beiral** | Prolongamento do telhado além da parede |
| **Verga** | Elemento estrutural acima da abertura |
| **Contraverga** | Elemento estrutural abaixo da abertura |

### Termos de Quantitativo

| Termo | Unidade | Aplicação |
|-------|---------|-----------|
| **Área** | m² | Pisos, revestimentos, pintura |
| **Volume** | m³ | Concreto, escavação, demolição |
| **Comprimento** | m | Tubulações, rodapés, vergas |
| **Quantidade** | un | Esquadrias, pontos, peças |
| **Peso** | kg | Argamassa, aço, materiais |
| **Capacidade** | L | Tintas, impermeabilizantes |

---

## 🔢 Tabelas de Referência

### Consumo de Materiais por m²

| Material | Consumo | Serviço |
|----------|---------|---------|
| Bloco cerâmico 9×19×19 | 25 un/m² | Alvenaria |
| Argamassa para alvenaria | 10 kg/m² | Assentamento |
| Argamassa para reboco | 30 kg/m² | Reboco 2cm |
| Argamassa colante | 5 kg/m² | Piso/azulejo |
| Rejunte | 0,2 kg/m² | Piso/azulejo |
| Pintura látex | 0,3 L/m² | Pintura (2 demãos) |
| Concreto laje | 0,10 m³/m² | Laje 10cm |

### Produtividade Típica (Dia/Equipe)

| Serviço | Produtividade | Equipe Típica |
|---------|---------------|---------------|
| Alvenaria vedação | 15-20 m²/dia | 2 pedreiros + 1 servente |
| Reboco | 20-30 m²/dia | 2 pessoas |
| Pintura | 40-60 m²/dia | 2 pintores |
| Piso cerâmica | 8-12 m²/dia | 1 pedreiro + 1 servente |
| Piso laminado | 20-30 m²/dia | 1 instalador |
| Instalação elétrica | 10-15 pontos/dia | 1 eletricista |
| Instalação hidráulica | 6-8 pontos/dia | 1 encanador |

### Desperdícios Típicos

| Material | Desperdício |
|----------|-------------|
| Cerâmica/Porcelanato | +10% |
| Laminado | +5% |
| Argamassa | +15% |
| Concreto | +5% |
| Pintura | +10% |
| Bloco cerâmico | +5% |

---

## 📐 Normas ABNT Relevantes

| NBR | Título | Aplicação |
|-----|--------|-----------|
| 6122 | Projeto e execução de fundações | Fundação |
| 6118 | Projeto de estruturas de concreto | Estrutura |
| 15270 | Componentes cerâmicos | Alvenaria |
| 5410 | Instalações elétricas de baixa tensão | Elétrica |
| 5626 | Sistemas prediais de água fria | Hidráulica |
| 8160 | Sistemas prediais de esgoto | Esgoto |
| 9575 | Impermeabilização | Áreas molhadas |
| 13755 | Revestimento de fachadas | Fachada |
| 9050 | Acessibilidade | Rampas, banheiros |

---

## 🎯 Como Usar Este Documento

### **Para Skills:**
- Consultar fórmulas e consumos
- Validar produtividades
- Verificar referências técnicas

### **Para Usuários:**
- Entender termos técnicos
- Validar valores sugeridos
- Conferir desperdícios aplicados

---

**Documento de suporte técnico — Atualizado em 16/04/2026**
