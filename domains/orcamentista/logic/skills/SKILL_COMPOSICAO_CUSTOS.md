# SKILL: Composição de Custos

> **Especialista em:** Composição detalhada (insumos + mão de obra + equipamentos)  
> **Saída:** Tabela de serviços com valores e composições detalhadas

---

## 🎯 Objetivo

Para cada serviço identificado, criar composição com:
- Insumos (materiais)
- Mão de obra (funções, horas, valores)
- Equipamentos (se aplicável)
- Valor unitário e total

**Referência:** Catálogo EVIS + SINAPI (quando disponível)

---

## 📥 Entrada Esperada

Dados da **SKILL_QUANTITATIVOS**:
- Tabela de serviços com quantidades
- Categorias e descrições

---

## 🔍 Processo de Composição

### **1. Consultar Referências**

Para cada serviço:
1. Buscar primeiro no **catálogo residencial EVIS**
2. Se não encontrar: buscar **SINAPI direto**
3. Se não houver item direto: buscar **SINAPI derivado/similar**
4. Se não houver similar suficiente: estimar composição própria

Se o ambiente estiver usando MCP:
- usar `referencia_buscar` como comando preferencial
- aceitar `sinapi_buscar` como alias compatível da mesma busca agregada

### **Hierarquia oficial de fontes**

| Prioridade | Fonte | Uso |
|-----------|-------|-----|
| 1 | Catálogo residencial EVIS | Item residencial canônico já validado |
| 2 | SINAPI direto | Quando existir composição aderente |
| 3 | SINAPI derivado | Quando exigir conversão por consumo, espessura ou produtividade |
| 4 | Cotação real / histórico | Ajuste de mercado, fornecedor e localidade |
| 5 | Composição própria | Quando as camadas anteriores não atenderem |

### **2. Montar Composição**

Estrutura padrão:
```
Serviço
├── Insumos (materiais, consumíveis)
├── Mão de Obra (funções, horas)
└── Equipamentos (se necessário)
```

### **3. Calcular Valores**

```
Valor Unitário = (Insumos + Mão de Obra + Equipamentos) / Unidade
Valor Total = Valor Unitário × Quantidade
```

---

## 📊 Formato de Saída (TABELAS)

### **Tabela Geral:**

```markdown
## COMPOSIÇÃO DE CUSTOS (RASCUNHO)

### Tabela Geral de Serviços

| Cód | Descrição | Unid | Qtd | Referência | Origem | Competência | Valor Ref | Valor Ajustado | Valor Total | Observações |
|-----|-----------|------|-----|------------|--------|-------------|-----------|----------------|-------------|-------------|
| 1.1 | Demolição piso cerâmico | m² | 70,00 | 97631 | SINAPI direto | 2026-03 | R$ 15,80 | R$ 15,80 | R$ 1.106,00 | - |
| 1.2 | Remoção entulho | m³ | 5,25 | 98745 | SINAPI direto | 2026-03 | R$ 96,00 | R$ 96,00 | R$ 504,00 | - |
| 1.3 | Concreto fundação | m³ | 10,50 | 92261 | SINAPI direto | 2026-03 | R$ 580,00 | R$ 580,00 | R$ 6.090,00 | fck 25MPa |
| 1.4 | Alvenaria vedação | m² | 137,80 | 87492 | SINAPI direto | 2026-03 | R$ 85,00 | R$ 85,00 | R$ 11.713,00 | Bloco 9×19×19 |
| 1.5 | Ponto luz LED embutido | un | 6,00 | EVIS-ELE-PT-LUZ | Catálogo EVIS | 2026-04 | R$ 95,00 | R$ 120,00 | R$ 720,00 | Inclui luminária |
| ... | ... | ... | ... | ... | ... | ... | ... | ... |

**SUBTOTAL CUSTOS DIRETOS:** R$ [total]

---

### Divergências SINAPI

| Serviço | SINAPI | Valor SINAPI | Valor Ajustado | Motivo |
|---------|--------|--------------|----------------|--------|
| 1.5 | - | R$ 95,00 | R$ 120,00 | Inclui luminária LED (SINAPI não inclui) |
| 3.3 | 87265 | R$ 62,00 | R$ 45,00 | **Fornecedor negociado** |

---
```

### **Composição Detalhada (exemplos):**

```markdown
## COMPOSIÇÕES DETALHADAS

---

### 1.1: Demolição de piso cerâmico (70m²)

**SINAPI:** 97631 - Demolição de piso cerâmico, manual

#### Insumos
| Item | Unid | Qtd | Valor Unit | Valor Total |
|------|------|-----|------------|-------------|
| Caçamba 5m³ | un | 2,00 | R$ 250,00 | R$ 500,00 |
| **SUBTOTAL INSUMOS** | | | | **R$ 500,00** |

#### Mão de Obra
| Função | Horas | Valor/Hora | Valor Total |
|--------|-------|------------|-------------|
| Servente | 16h | R$ 18,50 | R$ 296,00 |
| **SUBTOTAL MÃO DE OBRA** | | | **R$ 296,00** |

**TOTAL COMPOSIÇÃO:** R$ 796,00  
**VALOR UNITÁRIO:** R$ 796,00 ÷ 70m² = R$ 11,37/m²  
⚠️ **SINAPI:** R$ 15,80/m² (já inclui encargos e BDI do serviço)

---

### 1.4: Alvenaria de vedação (137,80m²)

**SINAPI:** 87492 - Alvenaria de vedação, bloco cerâmico 9×19×19

#### Insumos
| Item | Unid | Qtd | Valor Unit | Valor Total |
|------|------|-----|------------|-------------|
| Bloco cerâmico 9×19×19 | un | 3.445 | R$ 1,20 | R$ 4.134,00 |
| Argamassa AC-II | kg | 1.378 | R$ 0,45 | R$ 620,10 |
| **SUBTOTAL INSUMOS** | | | | **R$ 4.754,10** |

#### Mão de Obra
| Função | Horas | Valor/Hora | Valor Total |
|--------|-------|------------|-------------|
| Pedreiro | 69h | R$ 28,00 | R$ 1.932,00 |
| Servente | 69h | R$ 18,50 | R$ 1.276,50 |
| **SUBTOTAL MÃO DE OBRA** | | | **R$ 3.208,50** |

#### Equipamentos
| Item | Unid | Qtd | Valor Unit | Valor Total |
|------|------|-----|------------|-------------|
| Betoneira 400L | hora | 14h | R$ 12,00 | R$ 168,00 |
| **SUBTOTAL EQUIPAMENTOS** | | | | **R$ 168,00** |

**TOTAL COMPOSIÇÃO:** R$ 8.130,60  
**VALOR UNITÁRIO:** R$ 8.130,60 ÷ 137,80m² = R$ 59,00/m²  
⚠️ **SINAPI:** R$ 85,00/m² (já inclui encargos e BDI)

**Nota:** Diferença porque SINAPI inclui encargos sociais (~47%) + BDI da composição.

---

### 3.3: Piso porcelanato 60×60 (27,50m²)

**SINAPI:** 87265 - Revestimento cerâmico para piso

#### Insumos
| Item | Unid | Qtd | Valor Unit | Valor Total |
|------|------|-----|------------|-------------|
| Porcelanato 60×60 | m² | 27,50 | R$ 45,00 | R$ 1.237,50 |
| Argamassa colante AC-III | kg | 137,50 | R$ 0,85 | R$ 116,88 |
| Rejunte | kg | 5,50 | R$ 18,00 | R$ 99,00 |
| **SUBTOTAL INSUMOS** | | | | **R$ 1.453,38** |

#### Mão de Obra
| Função | Horas | Valor/Hora | Valor Total |
|--------|-------|------------|-------------|
| Pedreiro | 14h | R$ 28,00 | R$ 392,00 |
| Servente | 14h | R$ 18,50 | R$ 259,00 |
| **SUBTOTAL MÃO DE OBRA** | | | **R$ 651,00** |

**TOTAL COMPOSIÇÃO:** R$ 2.104,38  
**VALOR UNITÁRIO:** R$ 2.104,38 ÷ 27,50m² = R$ 76,52/m²  
**SINAPI:** R$ 62,00/m² (com porcelanato padrão)  
**AJUSTADO:** R$ 45,00/m² do porcelanato (fornecedor) → **Total: R$ 59,52/m²**

**Observação:** Porcelanato negociado com fornecedor (R$ 45/m² vs R$ 62/m² SINAPI).

---
```

---

## 🔍 Regras de Composição

### **Consumo de Materiais (referências):**

| Material | Consumo por m² |
|----------|----------------|
| Bloco cerâmico 9×19×19 | 25 un/m² |
| Argamassa para alvenaria | 10 kg/m² |
| Argamassa para reboco | 30 kg/m² (esp. 2cm) |
| Argamassa colante piso | 5 kg/m² |
| Rejunte | 0,2 kg/m² |
| Pintura látex | 0,3 L/m² (2 demãos) |
| Arame recozido | 0,05 kg/m² (amarração) |

### **Horas de Mão de Obra (referências):**

| Serviço | Horas por Unidade |
|---------|-------------------|
| Alvenaria | 0,5h/m² (pedreiro + servente) |
| Reboco | 0,4h/m² |
| Piso cerâmica | 0,5h/m² |
| Pintura | 0,15h/m² |
| Instalação elétrica (ponto) | 2h/un |
| Instalação hidráulica (ponto) | 2,5h/un |

### **Valores de Mão de Obra (referências):**

| Função | Valor/Hora |
|--------|-----------|
| Servente | R$ 18,50 |
| Pedreiro | R$ 28,00 |
| Eletricista | R$ 32,00 |
| Encanador | R$ 30,00 |
| Pintor | R$ 22,00 |
| Carpinteiro | R$ 28,00 |

⚠️ **Nota:** Valores sem encargos sociais. BDI será aplicado depois (Etapa 2).

---

## ✅ Validações

### **Antes de retornar:**

- [ ] Todos os serviços têm composição
- [ ] Insumos com quantidades calculadas
- [ ] Mão de obra com horas e valores
- [ ] Valores unitários > 0
- [ ] Referência SINAPI quando disponível
- [ ] Divergências documentadas

### **Verificações de Coerência:**

```
Valor unitário calculado ≈ 60-70% do SINAPI
(Porque SINAPI já inclui encargos ~47% + BDI ~20-30%)

Se divergência > 50%: alertar usuário
```

---

## 🔧 Casos Especiais

### **SINAPI Não Encontrado:**

```markdown
⚠️ **Composição sem referência SINAPI**

**Serviço:** Instalação de piso laminado  
**SINAPI:** Não possui composição para laminado

**Composição estimada:**

Insumos:
- Laminado: R$ 65,00/m² (mercado)
- Manta isolante: R$ 8,00/m²

Mão de obra:
- Instalador: 0,3h/m² × R$ 25,00 = R$ 7,50/m²

**Total:** R$ 80,50/m²

✅ Valor parece razoável ou prefere ajustar?
```

### **Fornecedor Negociado:**

Quando usuário informa valor negociado:
```markdown
✅ **Valor ajustado conforme negociação**

**Serviço:** Porcelanato 60×60  
**SINAPI:** R$ 62,00/m²  
**Fornecedor:** R$ 45,00/m² (negociado)  
**Economia:** R$ 17,00/m² (-27%)

Composição atualizada com novo valor.
```

### **Serviço Customizado:**

Se serviço não tem padrão:
```markdown
❓ **Serviço personalizado detectado**

**Serviço:** Instalação de sistema de automação

Não há referência SINAPI ou padrão.

**Opções:**
1. Usuário informa valor (cotação)
2. Estimativa por analogia (serviço similar)

Como prefere prosseguir?
```

---

## 📚 Referências SINAPI

### **Códigos SINAPI Comuns:**

| Código | Descrição | Unidade |
|--------|-----------|---------|
| 97631 | Demolição piso cerâmico | m² |
| 98745 | Remoção entulho | m³ |
| 92261 | Concreto fck 25MPa | m³ |
| 87492 | Alvenaria vedação bloco cerâmico | m² |
| 94233 | Divisória drywall ST 70mm | m² |
| 91920 | Ponto de luz (tubulação) | un |
| 91922 | Tomada 110V | un |
| 91935 | Quadro distribuição | un |
| 92105 | Ponto água fria | un |
| 92110 | Ponto esgoto | un |
| 88486 | Pintura látex acrílico | m² |
| 87265 | Piso porcelanato | m² |
| 87260 | Piso cerâmica | m² |

### **Como Usar SINAPI:**

1. Identificar serviço
2. Consultar primeiro o catálogo EVIS e depois o código correspondente no SINAPI, se necessário
3. Usar valor como referência
4. Lembrar: SINAPI já inclui encargos + BDI do item

### **Campos mínimos da referência consultada:**

| Campo | Uso |
|--------|-----|
| `codigo` | Identificador da referência |
| `custo_referencia` | Valor-base retornado |
| `origem` | Camada usada: `catalogo_evis` ou `sinapi` |
| `origem_detalhe` | Tipo da referência: direto, derivado, composição própria etc |
| `competencia` | Data-base do preço |
| `fonte_preco` | Nome da fonte |
| `confianca` | Grau de aderência da referência |

---

## 🎯 Critérios de Sucesso

**Saída válida quando:**
- ✅ Todos os serviços têm valor unitário e total
- ✅ Composições detalhadas (insumos + mão de obra)
- ✅ Referências SINAPI documentadas
- ✅ Divergências justificadas
- ✅ Apresentado em formato de TABELAS
- ✅ Usuário pode validar e ajustar valores

---

**FIM DA SKILL COMPOSIÇÃO DE CUSTOS**
