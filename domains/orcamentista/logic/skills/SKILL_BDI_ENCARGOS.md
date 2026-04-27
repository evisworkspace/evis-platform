# SKILL: BDI e Encargos

> **Especialista em:** Cálculo de BDI (Benefícios e Despesas Indiretas)  
> **Princípio:** Usuário SEMPRE define os percentuais (nunca automático)

---

## 🎯 Objetivo

Apresentar composição de BDI e aguardar definição pelo usuário:
- Estrutura de BDI com valores de referência
- Usuário valida/ajusta cada percentual
- Sistema calcula valor total com BDI

**CRÍTICO:** Sistema NUNCA define BDI automaticamente.

---

## 📥 Entrada Esperada

Dados da **SKILL_COMPOSICAO_CUSTOS**:
- Valor total dos custos diretos (soma de todos os serviços)

---

## 📊 Estrutura de BDI

### **Componentes Padrão:**

| Item | Descrição | % Referência |
|------|-----------|--------------|
| **Administração Central** | Custos administrativos da empresa | 3-5% |
| **Seguro e Garantia** | Seguros obrigatórios | 0,5-1,0% |
| **Risco** | Reserva para imprevistos | 1-2% |
| **Despesas Financeiras** | Custo de capital de giro | 1-2% |
| **Lucro** | Margem de lucro da empresa | 6-10% |
| **Impostos** | Conforme regime tributário | Variável |

---

## 📋 Formato de Saída (TABELA)

```markdown
## COMPOSIÇÃO DE BDI (RASCUNHO)

### Custos Diretos Consolidados
**Total de Serviços:** R$ [valor total de todos os serviços]

---

### Estrutura de BDI

| Item | % Base (Referência) | % Definido pelo Usuário | Valor (R$) |
|------|---------------------|-------------------------|------------|
| Administração central | 4,0% | ____ % | R$ _______ |
| Seguro e garantia | 0,8% | ____ % | R$ _______ |
| Risco | 1,27% | ____ % | R$ _______ |
| Despesas financeiras | 1,3% | ____ % | R$ _______ |
| Lucro | 7,4% | ____ % | R$ _______ |
| Impostos (regime tributário) | ? % | ____ % | R$ _______ |
| **TOTAL BDI** | **? %** | **____ %** | **R$ _______** |

---

### Informações Necessárias do Usuário

#### 1. Regime Tributário da Empresa

Selecione um:

- [ ] **Simples Nacional**  
  Alíquota conforme faixa de faturamento: _____%  
  (Tabela Anexo IV: 4,5% a 16,93%)

- [ ] **Lucro Presumido**  
  ISS: 2% a 5% (conforme município)  
  PIS: 0,65%  
  COFINS: 3,00%  
  IRPJ: 4,8%  
  CSLL: 2,88%  
  **Total estimado:** ~13-18%

- [ ] **Lucro Real**  
  ISS: 2% a 5%  
  PIS: 1,65%  
  COFINS: 7,6%  
  IRPJ: ~15% (sobre lucro real)  
  CSLL: ~9% (sobre lucro real)  
  **Total estimado:** ~15-25% (conforme resultado)

**Regime escolhido:** _____________  
**Alíquota de impostos:** _____%

---

#### 2. Percentuais de BDI

**Opção A:** Usar os percentuais de referência apresentados  
**Opção B:** Ajustar conforme política interna da empresa

| Item | Usar Referência? | Ou Informar Novo % |
|------|------------------|-------------------|
| Administração central | ☐ Sim (4,0%) | ☐ Novo: ___% |
| Seguro e garantia | ☐ Sim (0,8%) | ☐ Novo: ___% |
| Risco | ☐ Sim (1,27%) | ☐ Novo: ___% |
| Despesas financeiras | ☐ Sim (1,3%) | ☐ Novo: ___% |
| Lucro | ☐ Sim (7,4%) | ☐ Novo: ___% |
| Impostos | ☐ Conforme regime | ☐ Novo: ___% |

---

### Cálculo do Valor Total (após definição)

**Fórmula de BDI:**
```
BDI Total (%) = Soma de todos os percentuais definidos
Valor do BDI (R$) = Custos Diretos × (BDI% / 100)
Valor Total com BDI = Custos Diretos + Valor do BDI
```

**OU usando fórmula direta:**
```
Valor Total = Custos Diretos × (1 + BDI/100)
```

**Exemplo (aguardando definição do usuário):**
```
Custos Diretos: R$ 39.830,00
BDI: ___% (usuário define)
Valor BDI: R$ 39.830,00 × (___/100) = R$ _______
Valor Total: R$ 39.830,00 + R$ _______ = R$ _______
```

---

❓ **Qual o regime tributário da empresa?**  
❓ **Percentuais de BDI: usar referência ou ajustar?**  
✅ **Confirma a estrutura?**
```

---

## 🔍 Processo de Definição

### **Passo 1: Perguntar Regime Tributário**

```markdown
### Regime Tributário

Para calcular os impostos no BDI, preciso saber o regime tributário:

**1. Simples Nacional**
- Mais comum para pequenas empresas
- Alíquota única conforme faturamento
- Tabela Anexo IV (serviços): 4,5% a 16,93%

**2. Lucro Presumido**
- Empresas de médio porte
- Impostos: ISS + PIS + COFINS + IRPJ + CSLL
- Total aproximado: 13% a 18%

**3. Lucro Real**
- Empresas de grande porte
- Impostos sobre lucro efetivo
- Total aproximado: 15% a 25%

❓ Qual o regime da sua empresa?
```

### **Passo 2: Apresentar Referências de BDI**

Após definir regime, mostrar:

```markdown
### Percentuais de Referência

Baseado em:
- Manual IOPES-ES (obras privadas)
- Acórdão TCU 2622/2013 (obras públicas - apenas referência)
- Prática de mercado

| Item | % Típico Mercado | Faixa Comum |
|------|------------------|-------------|
| Administração | 4,0% | 3% a 5% |
| Seguro | 0,8% | 0,5% a 1,0% |
| Risco | 1,27% | 1% a 2% |
| Despesas financeiras | 1,3% | 1% a 2% |
| Lucro | 7,4% | 6% a 10% |
| Impostos | [conforme regime] | Variável |

**BDI Total Típico:**
- Simples Nacional (alíquota baixa): 18% a 22%
- Simples Nacional (alíquota alta): 25% a 30%
- Lucro Presumido: 25% a 32%
- Lucro Real: 30% a 40%
```

### **Passo 3: Aguardar Definição do Usuário**

```markdown
### Definição dos Percentuais

**Opção A: Usar percentuais típicos**
```
Administração: 4,0%
Seguro: 0,8%
Risco: 1,27%
Despesas: 1,3%
Lucro: 7,4%
Impostos: [conforme regime informado]
Total BDI: [calculado]
```

**Opção B: Informar percentuais personalizados**
```
Administração: ____%
Seguro: ____%
Risco: ____%
Despesas: ____%
Lucro: ____%
Impostos: ____%
Total BDI: ____%
```

❓ Qual opção prefere: A (típicos) ou B (personalizados)?
```

### **Passo 4: Calcular e Apresentar**

Após usuário definir:

```markdown
### BDI Definido

| Item | % Definido | Valor (R$) |
|------|-----------|------------|
| Administração central | 4,0% | R$ 1.593,20 |
| Seguro e garantia | 0,8% | R$ 318,64 |
| Risco | 1,27% | R$ 505,84 |
| Despesas financeiras | 1,3% | R$ 517,79 |
| Lucro | 7,4% | R$ 2.947,42 |
| Impostos (Simples 6%) | 6,0% | R$ 2.389,80 |
| **TOTAL BDI** | **20,77%** | **R$ 8.272,69** |

---

### Valor Total do Orçamento

| Item | Valor |
|------|-------|
| Custos Diretos | R$ 39.830,00 |
| BDI (20,77%) | R$ 8.272,69 |
| **TOTAL COM BDI** | **R$ 48.102,69** |

---

✅ Confirma esses valores?
```

---

## ⚠️ Regras Importantes

### **1. Sistema NUNCA Define Automaticamente**

- Sistema apresenta referências
- Usuário valida ou ajusta
- Sistema aguarda OK explícito

### **2. NÃO Diferenciar Obra Pública/Privada**

- Sistema NÃO pergunta tipo de obra
- Sistema NÃO ajusta BDI automaticamente
- Usuário tem controle total

### **3. Transparência Total**

Sempre mostrar:
- De onde vieram os percentuais (referência)
- Como foi calculado
- Qual o impacto no valor total

### **4. Validação de Coerência**

Se BDI total estiver fora da faixa típica:
```markdown
⚠️ **BDI fora da faixa típica**

BDI definido: ___%
Faixa típica para [regime]: 18% a 32%

Isso está correto ou houve erro de digitação?
```

---

## 📚 Referências

### **Manual IOPES-ES (Obras Privadas)**

Composição típica:
- Administração central: 4%
- Seguro e garantia: 0,8%
- Risco: 1,27%
- Despesas financeiras: 1,3%
- Lucro: 7,4%
- Impostos: conforme regime

### **Acórdão TCU 2622/2013 (Referência)**

BDI para obras públicas (apenas referência):
- Edificações: 24,23%
- Instalações: 22,12%

⚠️ **Nota:** Nosso sistema NÃO diferencia público/privado. Estes valores são apenas referência técnica.

---

## ✅ Validações

### **Antes de retornar:**

- [ ] Usuário informou regime tributário
- [ ] Usuário definiu TODOS os percentuais
- [ ] BDI total calculado
- [ ] Valor total com BDI calculado
- [ ] Apresentado em formato de TABELA

### **Verificações:**

```
BDI Total >= 10% e <= 50%
(Se fora dessa faixa, alertar usuário)

Valor Total > Custos Diretos
(Óbvio, mas validar para evitar erro)
```

---

## 🔧 Casos Especiais

### **Usuário Não Sabe Regime Tributário:**

```markdown
❓ **Não sabe qual o regime tributário?**

**Como descobrir:**
1. Verificar no contrato social da empresa
2. Consultar contador
3. Acessar portal da Receita Federal

**Estimativa temporária:**
Se for pequena empresa (faturamento < R$ 4,8 milhões/ano):
- Provavelmente: Simples Nacional
- Alíquota típica: 6% a 11%

Posso usar 8% como estimativa temporária?
Você pode ajustar depois quando confirmar.
```

### **Usuário Quer BDI Diferenciado por Serviço:**

```markdown
ℹ️ **BDI diferenciado não suportado neste fluxo**

O BDI é aplicado sobre o total de custos diretos (padrão de mercado).

BDI diferenciado por serviço é mais complexo e usado principalmente em licitações públicas.

Para este orçamento, recomendo:
- BDI único sobre total
- Se necessário, ajustar valores individuais de serviços
```

### **Margem de Lucro Muito Alta/Baixa:**

```markdown
⚠️ **Margem de lucro atípica**

Lucro definido: ___%
Típico de mercado: 6% a 10%

**Se muito alta (>15%):**
Cliente pode questionar orçamento.

**Se muito baixa (<3%):**
Margem insuficiente para cobrir riscos.

✅ Confirma esse percentual?
```

---

## 🎯 Critérios de Sucesso

**Saída válida quando:**
- ✅ Regime tributário informado
- ✅ Todos os percentuais definidos pelo usuário
- ✅ BDI total calculado
- ✅ Valor total com BDI calculado
- ✅ Apresentado em formato de TABELA
- ✅ Usuário validou e confirmou

---

**FIM DA SKILL BDI E ENCARGOS**
