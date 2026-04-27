# SKILL: Quantitativos

> **Especialista em:** Cálculo de quantidades de serviços  
> **Saída:** Tabela de serviços com quantidades calculadas

---

## 🎯 Objetivo

Calcular quantitativos de todos os serviços baseado em:
- Ambientes identificados (Etapa 0)
- Materiais especificados
- Sequência construtiva lógica

---

## 📥 Entrada Esperada

Dados da **SKILL_LEITURA_PROJETO**:
- Tabela de ambientes (área, pé-direito)
- Materiais especificados
- Sistemas presentes

---

## 🔢 Cálculos por Categoria

### **1. DEMOLIÇÕES (se reforma)**

| Serviço | Fórmula | Unidade |
|---------|---------|---------|
| Demolição de piso | Área total | m² |
| Demolição de alvenaria | Área parede × Espessura | m³ |
| Remoção de entulho | Volume demolido × 1,5 (expansão) | m³ |

**Exemplo:**
```
Demolição piso: 70m² (área total do projeto)
Entulho: 70m² × 0,05m altura × 1,5 = 5,25m³
```

---

### **2. FUNDAÇÃO**

| Serviço | Fórmula | Unidade |
|---------|---------|---------|
| Escavação | Perímetro × Largura × Profundidade | m³ |
| Lastro de concreto | Perímetro × Largura × Espessura | m³ |
| Concreto fundação | Conforme projeto estrutural | m³ |

**Se não houver projeto estrutural:**
```
Estimativa: Área construída × 0,15m³/m² (fundação padrão)
Exemplo: 70m² × 0,15 = 10,5m³ de concreto
```

---

### **3. ALVENARIA**

| Serviço | Fórmula | Unidade |
|---------|---------|---------|
| Alvenaria de vedação | Perímetro × Pé-direito - Vãos | m² |
| Vergas e contravergas | Quantidade de vãos × Comprimento médio | m |

**Cálculo de perímetro:**
```
Perímetro interno = Soma de todas as paredes internas
Perímetro externo = Contorno da edificação

Exemplo:
Casa 70m² (8m × 8,75m)
Perímetro externo: 2×(8 + 8,75) = 33,5m
Paredes internas: 20m (estimado)
Total paredes: 53,5m

Área alvenaria: 53,5m × 2,80m - 12m² (vãos) = 137,8m²
```

**Vãos típicos:**
- Porta padrão: 0,80m × 2,10m = 1,68m²
- Janela padrão: 1,20m × 1,00m = 1,20m²

---

### **4. INSTALAÇÕES ELÉTRICAS**

| Serviço | Fórmula | Unidade |
|---------|---------|---------|
| Pontos de luz | Conforme projeto ou estimativa | un |
| Tomadas | Conforme projeto ou estimativa | un |
| Quadro distribuição | 1 por edificação | un |
| Eletrodutos e fiação | Pontos × 3m médio + prumadas | m |

**Estimativa quando não há projeto:**
```
Pontos de luz: 1 ponto por ambiente + 1 externo
Tomadas: 3 por quarto, 2 por sala, 4 por cozinha, 2 por banheiro

Exemplo (casa 70m² - 5 ambientes):
Luz: 5 ambientes + 1 externo = 6 pontos
Tomadas: 3+3+2+4+2 = 14 pontos
Quadro: 1 unidade (10 circuitos)
```

---

### **5. INSTALAÇÕES HIDRÁULICAS**

| Serviço | Fórmula | Unidade |
|---------|---------|---------|
| Pontos de água | Conforme projeto ou estimativa | un |
| Pontos de esgoto | Conforme projeto ou estimativa | un |
| Tubulações | Pontos × 4m médio + prumadas | m |

**Estimativa quando não há projeto:**
```
Água fria:
- Cozinha: 2 pontos (pia + máquina lavar)
- Banheiro: 3 pontos (lavatório + vaso + chuveiro)
- Lavanderia: 1 ponto (tanque)

Esgoto:
- Cozinha: 2 pontos (pia + máquina)
- Banheiro: 3 pontos (lavatório + vaso + chuveiro)

Exemplo (casa 70m²):
Água: 2 + 3 + 1 = 6 pontos
Esgoto: 2 + 3 = 5 pontos
```

---

### **6. REVESTIMENTOS**

| Serviço | Fórmula | Unidade |
|---------|---------|---------|
| Chapisco | Área de parede | m² |
| Reboco | Área de parede | m² |
| Contrapiso | Área de piso | m² |
| Azulejo | Área conforme especificação | m² |

**Cálculo de área de parede:**
```
Área reboco = Área alvenaria (já descontados vãos)

Se azulejo parcial (ex: cozinha até 1,50m):
Azulejo = Perímetro cozinha × 1,50m
```

---

### **7. PINTURA**

| Serviço | Fórmula | Unidade |
|---------|---------|---------|
| Pintura de paredes | Área de parede × 2 (faces) | m² |
| Pintura de teto | Área de teto | m² |

**Atenção:**
- Descontar áreas com azulejo (não pintam)
- Incluir vergas/contravergas
- Incluir platibandas (se houver)

**Exemplo:**
```
Área parede: 137,8m² (alvenaria)
Menos azulejo: -20m² (cozinha + banheiro)
Área a pintar: 117,8m²
Pintura: 117,8m² × 2 faces = 235,6m²
Teto: 70m²
Total pintura: 305,6m²
```

---

### **8. PISOS**

| Serviço | Fórmula | Unidade |
|---------|---------|---------|
| Piso por ambiente | Área do ambiente | m² |
| Rodapés | Perímetro - vãos de porta | m |

**Adicionar desperdício:**
- Cerâmica/porcelanato: +10%
- Laminado: +5%

**Exemplo:**
```
Piso porcelanato sala: 25m² + 10% = 27,5m²
Piso cerâmica cozinha: 12m² + 10% = 13,2m²
Piso laminado quartos: 27m² + 5% = 28,35m²
```

---

### **9. COBERTURA**

| Serviço | Fórmula | Unidade |
|---------|---------|---------|
| Laje | Área de projeção | m² |
| Telhado | Área × (1 + inclinação) | m² |
| Madeiramento | Conforme projeto | m³ ou m |

**Cálculo telhado inclinado:**
```
Inclinação 30%: Área real = Área projeção × 1,15
Exemplo: 70m² × 1,15 = 80,5m² de telha
```

---

### **10. ESQUADRIAS**

| Serviço | Fórmula | Unidade |
|---------|---------|---------|
| Portas | Contagem de vãos | un |
| Janelas | Contagem de vãos | un |

**Dimensões padrão se não especificado:**
- Porta: 0,80m × 2,10m
- Janela: 1,20m × 1,00m

---

## 📊 Formato de Saída (TABELA)

```markdown
## QUANTITATIVOS (RASCUNHO)

### Tabela de Serviços

| Cód | Categoria | Descrição | Unid | Qtd | Fórmula/Origem | Observações |
|-----|-----------|-----------|------|-----|----------------|-------------|
| 1.1 | Demolição | Demolição piso cerâmico | m² | 70,00 | Área total | - |
| 1.2 | Demolição | Remoção entulho | m³ | 5,25 | 70×0,05×1,5 | Fator expansão |
| 1.3 | Fundação | Concreto fundação | m³ | 10,50 | 70m² × 0,15 | Estimativa padrão |
| 1.4 | Alvenaria | Alvenaria vedação | m² | 137,80 | 53,5m×2,80-12 | Vãos descontados |
| 1.5 | Instalações | Ponto luz embutido | un | 6,00 | 5 amb + 1 ext | Estimativa |
| 2.1 | Instalações | Tomada 110V | un | 14,00 | Padrão por amb | Estimativa |
| 2.2 | Instalações | Quadro distribuição | un | 1,00 | 1 por obra | 10 circuitos |
| 2.3 | Hidráulica | Ponto água fria | un | 6,00 | 2+3+1 | Cozinha+banh+lav |
| 2.4 | Hidráulica | Ponto esgoto | un | 5,00 | 2+3 | Cozinha+banh |
| 2.5 | Revestimento | Reboco interno | m² | 137,80 | Área alvenaria | - |
| 3.1 | Revestimento | Contrapiso | m² | 70,00 | Área total | Espessura 5cm |
| 3.2 | Pintura | Pintura látex | m² | 305,60 | 235,6+70 | Paredes + teto |
| 3.3 | Piso | Porcelanato 60×60 | m² | 27,50 | 25 + 10% | Sala |
| 3.4 | Piso | Cerâmica 45×45 | m² | 19,80 | 18 + 10% | Cozinha+banh |
| 3.5 | Piso | Laminado | m² | 28,35 | 27 + 5% | Quartos |
| 4.1 | Cobertura | Laje maciça 10cm | m² | 70,00 | Área total | fck 25MPa |
| 4.2 | Esquadrias | Porta 80×210 | un | 5,00 | Contagem | Padrão |
| 4.3 | Esquadrias | Janela 120×100 | un | 4,00 | Contagem | Padrão |

**TOTAL:** 18 serviços identificados

---

### Resumo por Categoria

| Categoria | Qtd Serviços |
|-----------|--------------|
| Demolição | 2 |
| Fundação | 1 |
| Alvenaria | 1 |
| Instalações Elétricas | 3 |
| Instalações Hidráulicas | 2 |
| Revestimentos | 2 |
| Pintura | 1 |
| Pisos | 3 |
| Cobertura | 1 |
| Esquadrias | 2 |
| **TOTAL** | **18** |

---

✅ Quantitativos corretos?
❓ Algum serviço faltando?
📝 Alguma quantidade precisa ajustar?
```

---

## ✅ Validações

### **Antes de retornar:**

- [ ] Todas as quantidades > 0
- [ ] Todas as unidades válidas (m², m³, un, m, kg)
- [ ] Fórmulas/origem documentadas
- [ ] Categorias definidas
- [ ] Descrições claras

### **Verificações de Coerência:**

```
Área de piso ≈ Área de laje ≈ Área total do projeto
Área de reboco ≈ Área de alvenaria
Pintura < (Reboco × 2) + Teto
```

Se incoerência detectada:
```markdown
⚠️ **Verificação de coerência:**

Área de piso (70m²) ≠ Soma dos pisos (75,65m²)

Possível causa: Desperdício incluído

✅ Está correto ou precisa ajustar?
```

---

## 🔧 Casos Especiais

### **Obra Nova vs Reforma:**

**Obra Nova:**
- Incluir fundação
- Incluir estrutura
- NÃO incluir demolições

**Reforma:**
- Incluir demolições
- NÃO incluir fundação (já existe)
- Possível incluir reforço estrutural

### **Informação Incompleta:**

Se não houver detalhamento:
```markdown
⚠️ **Serviços estimados (sem projeto complementar):**

| Serviço | Método de Estimativa |
|---------|---------------------|
| Instalação elétrica | 1 ponto luz/ambiente + padrão tomadas |
| Instalação hidráulica | Padrão por tipo de ambiente |
| Fundação | 0,15m³/m² de área construída |

✅ Confirma essas estimativas ou tem informações adicionais?
```

---

## 📚 Referências

### **Desperdícios Típicos:**

| Material | Desperdício |
|----------|-------------|
| Cerâmica/Porcelanato | 10% |
| Laminado | 5% |
| Argamassa | 15% |
| Concreto | 5% |
| Pintura | 10% |
| Bloco cerâmico | 5% |

### **Produtividades (para validação):**

| Serviço | Produtividade Típica |
|---------|---------------------|
| Alvenaria | 15-20 m²/dia (2 pedreiros) |
| Reboco | 20-30 m²/dia |
| Pintura | 40-60 m²/dia |
| Piso cerâmica | 8-12 m²/dia |

---

## 🎯 Critérios de Sucesso

**Saída válida quando:**
- ✅ Todos os serviços necessários identificados
- ✅ Quantidades calculadas com fórmula documentada
- ✅ Unidades corretas
- ✅ Verificações de coerência passaram
- ✅ Apresentado em formato de TABELA

---

**FIM DA SKILL QUANTITATIVOS**
