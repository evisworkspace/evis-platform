# SKILL: Leitura de Projeto

> **Especialista em:** Interpretação de projetos arquitetônicos (PDF/DWG)  
> **Saída:** Ambientes, dimensões, materiais e sistemas identificados (TABELAS)

---

## 🎯 Objetivo

Analisar projeto arquitetônico e extrair:
- Ambientes com áreas e dimensões
- Materiais especificados
- Sistemas presentes (elétrico, hidráulico, estrutural)

---

## 📥 Entrada Esperada

- **PDF** ou **DWG** do projeto
- Tipos aceitos:
  - Planta baixa
  - Cortes
  - Fachadas  - Memorial descritivo

---

## 🔍 Processo de Análise

### **1. Identificar Tipo de Projeto**

| Tipo | Identificação |
|------|---------------|
| Arquitetônico | Planta baixa + ambientes + cotagem |
| Estrutural | Formas de laje, pilares, vigas |
| Elétrico | Pontos de luz, tomadas, quadro |
| Hidráulico | Pontos água, esgoto, tubulações |

### **2. Ler Legenda e Quadro de Áreas**

- Localizar tabela de áreas (geralmente no canto)
- Identificar escala (1:50, 1:100)
- Ler notas e especificações

### **3. Extrair Ambientes**

Para cada ambiente:
- Nome (sala, cozinha, quarto)
- Área (m²)
- Pé-direito (m)
- Materiais especificados (piso, parede)

### **4. Identificar Materiais Especificados**

Buscar em:
- Notas na planta
- Memorial descritivo
- Cortes (tipo de parede, laje)
- Fachadas (revestimentos externos)

### **5. Listar Sistemas**

Marcar presença de:
- ✅ Completo
- ⚠️ Parcial
- ❌ Não fornecido

---

## 📊 Formato de Saída (TABELAS)

```markdown
## ANÁLISE INICIAL (RASCUNHO)

### Tipo de Projeto
**Identificado:** [tipo]  
**Completude:** COMPLETO / PARCIAL / BÁSICO

---

### Ambientes Identificados

| Ambiente | Área (m²) | Pé-direito (m) | Piso Especificado | Parede | Observações |
|----------|-----------|----------------|-------------------|--------|-------------|
| Sala | 25,00 | 2,80 | Porcelanato 60×60 | Alvenaria | - |
| Cozinha | 12,00 | 2,80 | Cerâmica 45×45 | Alvenaria | Azulejo até 1,50m |
| Banheiro | 6,00 | 2,80 | Cerâmica 45×45 | Alvenaria | Azulejo total |
| Quarto 1 | 15,00 | 2,80 | Laminado | Alvenaria | - |
| Quarto 2 | 12,00 | 2,80 | Laminado | Alvenaria | - |

**TOTAL:** 70,00 m²

---

### Materiais Especificados

| Item | Especificação | Localização |
|------|---------------|-------------|
| Piso sala | Porcelanato 60×60 cor clara | Nota na planta |
| Piso cozinha/banheiro | Cerâmica 45×45 antiderrapante | Nota na planta |
| Piso quartos | Laminado eucafloor | Memorial |
| Parede | Bloco cerâmico 9×19×19 | Corte AA |
| Laje | Maciça 10cm fck 25MPa | Corte AA |
| Revestimento externo | Textura acrílica | Fachada |

---

### Sistemas Identificados

| Sistema | Status | Detalhamento |
|---------|--------|--------------|
| Arquitetônico | ✅ Completo | Planta + 2 cortes + 4 fachadas |
| Estrutural | ⚠️ Parcial | Indicação de laje, sem detalhamento |
| Elétrico | ❌ Não fornecido | - |
| Hidráulico | ❌ Não fornecido | - |
| SPDA | ❌ Não fornecido | - |

---

### Observações Importantes

- Projeto arquitetônico bem detalhado
- Falta projeto complementar (elétrico/hidráulico)
- Possível estimar instalações por padrão (m²)

---

### Recomendação

**Abordagem:** EXECUTIVO (com estimativa de complementares)

**Motivo:** Projeto arquitetônico completo permite quantitativos precisos. Instalações podem ser estimadas por m² usando padrões SINAPI.
```

---

## ✅ Validações

### **Antes de retornar:**

- [ ] Pelo menos 1 ambiente identificado
- [ ] Áreas > 0
- [ ] Pé-direito informado (se não houver, assumir 2,80m)
- [ ] Pelo menos 1 material especificado
- [ ] Status de cada sistema definido

### **Se informações faltarem:**

Apresentar o que foi identificado + perguntar ao usuário:

```markdown
⚠️ **Informações não identificadas no projeto:**

- Pé-direito não está especificado
- Material de piso não consta

**Opções:**
1. Assumir padrão (pé-direito 2,80m, piso cerâmica)
2. Usuário informa as especificações

❓ Como prefere prosseguir?
```

---

## 📚 Referências Técnicas

### **Leitura de Plantas (Mini Curso UFPA)**

**Elementos de uma planta:**
- Paredes (linha grossa contínua)
- Portas (arco de abertura)
- Janelas (linha tracejada)
- Cotagem (dimensões em cm ou m)
- Textos e notas

**Escalas comuns:**
- 1:50 (1cm = 50cm) — detalhamento
- 1:100 (1cm = 1m) — planta geral

**Vocabulário:**
- **Pé-direito:** Altura do piso ao teto
- **Peitoril:** Altura da base da janela ao piso
- **Vão:** Abertura (porta ou janela)
- **Cumeeira:** Ponto mais alto do telhado

### **Tipos de Cortes:**

- **Longitudinal:** Corta no sentido do comprimento
- **Transversal:** Corta no sentido da largura
- **Permite ver:** Lajes, vigas, pé-direito, fundação

---

## 🔧 Exemplos de Extração

### **Exemplo 1: Planta Simples**

**Identificado:**
- 3 ambientes (sala 20m², quarto 12m², banheiro 4m²)
- Pé-direito: 2,80m (lido em corte)
- Piso: Cerâmica (nota na planta)
- Área total: 36m²

### **Exemplo 2: Planta Complexa**

**Identificado:**
- 8 ambientes (especificados em quadro de áreas)
- 2 pavimentos (planta térreo + superior)
- Pé-direito variável: térreo 3,00m, superior 2,70m
- Materiais diversos por ambiente
- Área total: 145m²

---

## ⚠️ Casos Especiais

### **Projeto Incompleto:**

Se projeto está muito básico (ex: só planta sem cortes):
- Assumir padrões típicos
- Documentar suposições
- Alertar usuário sobre limitações

**Exemplo:**
```markdown
⚠️ **Projeto parcial detectado**

Informações assumidas (padrão):
- Pé-direito: 2,80m (padrão residencial)
- Laje: Maciça 10cm (padrão)
- Paredes: Bloco cerâmico (padrão)

✅ Confirma esses padrões ou prefere especificar?
```

### **PDF de Má Qualidade:**

Se PDF está escaneado/borrado:
- Extrair o que for legível
- Listar o que não foi possível ler
- Pedir confirmação ao usuário

---

## 🎯 Critérios de Sucesso

**Saída válida quando:**
- ✅ Todos os ambientes identificados
- ✅ Áreas somam corretamente
- ✅ Materiais principais especificados
- ✅ Status de sistemas claro
- ✅ Apresentado em formato de TABELAS

---

**FIM DA SKILL LEITURA DE PROJETO**
