# SKILL: Cronograma Físico-Financeiro

> **Especialista em:** Planejamento de prazos e desembolso  
> **Saída:** Cronograma com distribuição mensal (TABELAS)

---

## 🎯 Objetivo

Criar cronograma com:
- Sequenciamento lógico de serviços (dependências construtivas)
- Estimativa de duração (produtividade típica)
- Distribuição de desembolso mensal
- Percentual físico por período

---

## 📥 Entrada Esperada

Dados das etapas anteriores:
- Lista de serviços (com quantidades)
- Valores com BDI (Etapa 2)

---

## 📅 Processo de Planejamento

### **1. Sequenciar Serviços (Dependências)**

Sequência construtiva lógica:

```
1. Serviços Preliminares (limpeza, locação)
2. Demolições (se reforma)
3. Fundação
4. Estrutura (pilares, vigas, lajes)
5. Alvenaria e Divisórias
6. Instalações (elétrica + hidráulica)
7. Revestimentos (reboco, contrapiso)
8. Cobertura (se não for laje)
9. Esquadrias
10. Pintura
11. Pisos finais
12. Acabamentos finais
13. Limpeza final
```

### **2. Estimar Duração (Produtividade)**

| Serviço | Produtividade Típica | Equipe Padrão |
|---------|----------------------|---------------|
| Demolição piso | 40-60 m²/dia | 3 pessoas |
| Escavação manual | 3-5 m³/dia | 2 serventes |
| Concreto (lançamento) | 15-25 m³/dia | 5 pessoas |
| Alvenaria vedação | 15-20 m²/dia | 2 pedreiros + 1 servente |
| Instalação elétrica | 10-15 pontos/dia | 1 eletricista |
| Instalação hidráulica | 6-8 pontos/dia | 1 encanador |
| Reboco | 20-30 m²/dia | 2 pessoas |
| Pintura | 40-60 m²/dia | 2 pintores |
| Piso cerâmica | 8-12 m²/dia | 1 pedreiro + 1 servente |
| Piso laminado | 20-30 m²/dia | 1 instalador |

**Fórmula:**
```
Duração (dias) = Quantidade ÷ Produtividade
```

### **3. Considerar Curas e Folgas**

| Material | Tempo de Cura/Secagem |
|----------|----------------------|
| Concreto fundação | 7 dias (mínimo para carregar) |
| Concreto laje | 7 dias (mínimo, 28 dias ideal) |
| Reboco | 7-14 dias (antes de pintar) |
| Massa corrida | 7 dias (antes de pintar) |

**Folgas típicas:**
- 10-15% do prazo total (imprevistos)
- Adicionar 1-2 dias entre etapas críticas

---

## 📊 Formato de Saída (TABELAS)

```markdown
## CRONOGRAMA FÍSICO-FINANCEIRO (RASCUNHO)

### Duração Total Estimada
**Prazo:** [X] dias úteis ([data início] a [data fim])  
**Folga incluída:** [Y] dias (margem de segurança)

---

### Distribuição por Etapas Construtivas

| Etapa | Serviços | Duração | Período | % Físico | Desembolso | % Desembolso |
|-------|----------|---------|---------|----------|------------|--------------|
| 1. Demolições | 1.1, 1.2 | 3 dias | 01/06 - 04/06 | 3% | R$ 1.610,00 | 3,3% |
| 2. Fundação | 1.3 | 5 dias | 05/06 - 11/06 | 12% | R$ 6.090,00 | 12,7% |
| [cura fundação] | - | 7 dias | 12/06 - 20/06 | 0% | R$ 0,00 | 0% |
| 3. Alvenaria | 1.4, 1.5 | 12 dias | 21/06 - 06/07 | 28% | R$ 13.243,00 | 27,5% |
| 4. Instalações | 2.1 a 2.5 | 10 dias | 07/07 - 20/07 | 15% | R$ 7.215,00 | 15,0% |
| 5. Revestimentos | 3.1, 3.2 | 8 dias | 21/07 - 30/07 | 18% | R$ 8.659,00 | 18,0% |
| 6. Pintura | 3.3 | 6 dias | 31/07 - 07/08 | 10% | R$ 4.810,00 | 10,0% |
| 7. Pisos | 3.4 a 4.1 | 7 dias | 08/08 - 16/08 | 8% | R$ 3.849,00 | 8,0% |
| 8. Acabamentos | 4.2, 4.3 | 4 dias | 17/08 - 21/08 | 4% | R$ 1.924,00 | 4,0% |
| 9. Limpeza final | - | 2 dias | 22/08 - 23/08 | 2% | R$ 702,00 | 1,5% |
| **TOTAL** | **18 serviços** | **64 dias** | | **100%** | **R$ 48.102,00** | **100%** |

---

### Curva de Desembolso Mensal

| Mês | Etapas Executadas | % Físico Acum | Desembolso Mês | Desembolso Acum | % Desembolso |
|-----|-------------------|---------------|----------------|-----------------|--------------|
| Jun/2026 | Demolições + Fundação + Parte Alvenaria | 38% | R$ 18.280,00 | R$ 18.280,00 | 38,0% |
| Jul/2026 | Alvenaria + Instalações + Revestimentos | 61% | R$ 19.438,00 | R$ 37.718,00 | 78,4% |
| Ago/2026 | Pintura + Pisos + Acabamentos + Limpeza | 100% | R$ 10.384,00 | R$ 48.102,00 | 100% |

---

### Gráfico de Desembolso (Representação Simplificada)

```
R$ 20k |  ████████
R$ 18k |  ████████       ████████
R$ 16k |  ████████       ████████
R$ 14k |  ████████       ████████
R$ 12k |  ████████       ████████
R$ 10k |  ████████       ████████       █████
R$ 8k  |  ████████       ████████       █████
        ───────────────────────────────────────
           Jun/26         Jul/26         Ago/26
```

---

### Dependências Críticas

| Serviço | Depende de | Folga (dias) | Impacto se Atrasar |
|---------|------------|--------------|-------------------|
| Estrutura | Fundação curada | 0 | Atrasa toda obra |
| Alvenaria | Estrutura concluída | 0 | Atrasa instalações |
| Instalações | Alvenaria concluída | 0 | Atrasa revestimentos |
| Pintura | Reboco curado | 7 | Atrasa acabamentos |
| Piso final | Pintura concluída | 0 | Atrasa entrega |

---

### Marcos (Milestones)

| Data | Marco | Descrição |
|------|-------|-----------|
| 04/06/2026 | Demolições concluídas | Terreno limpo, pronto para fundação |
| 20/06/2026 | Fundação curada | Pronto para elevar estrutura/alvenaria |
| 06/07/2026 | Alvenaria concluída | Paredes elevadas, pronto para instalações |
| 30/07/2026 | Revestimentos concluídos | Reboco seco, pronto para pintura |
| 23/08/2026 | Obra concluída | Pronto para entrega ao cliente |

---

✅ Cronograma viável?
❓ Prazo de [X] dias úteis suficiente?
🔄 Cliente pediu prazo diferente?
📅 Data de início flexível ou fixa?
```

---

## 🔍 Regras de Sequenciamento

### **Dependências Obrigatórias:**

```
NÃO PODE:
- Estrutura antes de fundação curada (7 dias)
- Alvenaria antes de estrutura concluída
- Instalações antes de alvenaria concluída
- Revestimento antes de instalações embutidas
- Pintura antes de reboco seco (7-14 dias)
- Piso final antes de pintura concluída
```

### **Serviços Simultâneos (Possíveis):**

```
PODE SOBREPOR:
- Instalação elétrica + hidráulica (após alvenaria)
- Pintura de ambientes diferentes
- Revestimento de áreas independentes
- Acabamentos finais (louças, luminárias, etc)
```

---

## ⚙️ Cálculo de Percentual Físico

**Método:** Proporcional ao valor do serviço

```
% Físico do Serviço = (Valor Serviço / Valor Total) × 100

Exemplo:
Alvenaria: R$ 11.713 / R$ 48.102 = 24,3% do físico total
```

**Distribuição mensal:**
```
% Físico Mês = Soma dos % dos serviços executados no mês
```

---

## ⚙️ Cálculo de Desembolso

**Desembolso = Valor dos serviços executados no período**

Considerar:
- Pagamento conforme medição (serviços concluídos)
- Materiais podem ser pagos antecipadamente
- Mão de obra geralmente semanal/quinzenal

---

## ✅ Validações

### **Antes de retornar:**

- [ ] Sequência construtiva lógica (fundação → estrutura → acabamento)
- [ ] Dependências respeitadas (curas, folgas)
- [ ] Prazo total calculado
- [ ] Percentual físico soma 100%
- [ ] Desembolso total = Valor com BDI
- [ ] Apresentado em formato de TABELAS

### **Verificações de Coerência:**

```
Soma dos % físicos = 100%
Soma dos desembolsos = Valor total com BDI
Prazo >= Soma das durações (considerando simultaneidades)
```

---

## 🔧 Casos Especiais

### **Cliente Pediu Prazo Específico:**

```markdown
ℹ️ **Prazo solicitado pelo cliente**

**Prazo estimado:** 64 dias úteis  
**Prazo desejado:** 45 dias úteis  
**Diferença:** -19 dias (-30%)

**Para reduzir prazo, opções:**
1. Aumentar equipes (↑ custo ~15-20%)
2. Trabalhar sábados (↑ custo ~10%)
3. Reduzir folgas (↑ risco de atraso)

❓ Cliente aceita prazo estimado ou prefere acelerar?
```

### **Projeto Complexo (Múltiplas Frentes):**

Se obra grande:
```markdown
### Distribuição por Frentes de Trabalho

**Frente 1: Área A**
- Serviços: [lista]
- Prazo: [dias]

**Frente 2: Área B (simultânea)**
- Serviços: [lista]
- Prazo: [dias]

**Ganho:** Redução de [X] dias no prazo total
```

### **Reforma com Ocupação:**

Se prédio ocupado:
```markdown
⚠️ **Reforma com ocupação**

**Restrições:**
- Horário: 8h às 17h (sem ruído noturno)
- Finais de semana: não permitido
- Acesso: via elevador de serviço

**Impacto:** +20% no prazo estimado
(Produtividade reduzida por restrições)
```

---

## 📚 Referências

### **Produtividades e Sequencias Construtivas:**

Ver: `docs/REFERENCIAS_TECNICAS.md` - produtividades, desperdicios e referencias de planejamento

---

## 🎯 Critérios de Sucesso

**Saída válida quando:**
- ✅ Sequência construtiva lógica
- ✅ Dependências respeitadas
- ✅ Prazos calculados
- ✅ Distribuição mensal coerente
- ✅ Percentuais somam 100%
- ✅ Apresentado em formato de TABELAS
- ✅ Usuário validou e confirmou

---

**FIM DA SKILL CRONOGRAMA**
