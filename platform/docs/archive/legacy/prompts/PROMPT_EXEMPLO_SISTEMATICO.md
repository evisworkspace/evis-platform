# PROMPT: CRIAR EXEMPLO SISTEMÁTICO COMPLETO

> **Destinatário:** GPT (orçamentista)  
> **Objetivo:** Criar exemplo funcional completo do fluxo de orçamentação

---

## CONTEXTO

Precisamos de um **exemplo sistemático completo** que demonstre todo o fluxo de orçamentação usando a skill.

### Objetivo do Exemplo:

1. **Servir de referência** para orçamentistas (humanos) aprenderem a usar
2. **Validar a skill** (testar se funciona conforme esperado)
3. **Demonstrar capacidades** (PDF, SINAPI, conversacional, cronograma)
4. **Ser realista** (não simplificado demais, não complexo demais)

---

## TAREFA

Criar arquivo `orcamentista/exemplos/EXEMPLO_SISTEMATICO_COMPLETO.md` com exemplo de ponta a ponta.

---

## ESTRUTURA DO EXEMPLO

### 1. APRESENTAÇÃO DO CASO

```markdown
# Exemplo Sistemático Completo: Reforma Comercial Loja TechHub

## Contexto do Projeto

**Cliente:** TechHub Informática  
**Tipo:** Reforma de loja comercial  
**Área:** 150m²  
**Local:** São Paulo - SP  
**Objetivo:** Modernizar espaço para atendimento ao público

**Escopo Geral:**
- Demolições (piso antigo, divisórias)
- Reformulação de layout (novas divisórias em drywall)
- Instalações elétricas e de rede (pontos adicionais)
- Pintura completa
- Piso laminado corporativo
- Iluminação LED
- Ar-condicionado (3 splits)

**Prazo desejado pelo cliente:** 45 dias úteis  
**Orçamento máximo:** R$ 95.000,00
```

---

### 2. INÍCIO DA CONVERSA (Envio de PDF)

```markdown
## Conversa com a IA - Parte 1: Análise do Projeto

### Mensagem 1 (Orçamentista):
```
Olá! Preciso desenvolver um orçamento para reforma de loja comercial.

Tenho o projeto arquitetônico aqui. Vou enviar o PDF.

[anexa: reforma-loja-techhub-150m2.pdf]

Cliente quer prazo de 45 dias úteis e orçamento máximo de R$ 95 mil.
```

### Resposta 1 (IA):
```
Perfeito! Vou analisar o projeto arquitetônico. Aguarde um momento...

📐 **Análise do Projeto Concluída**

**Áreas Identificadas:**
- Área total: 150m²
- Pé-direito: 3,20m (comercial)
- Fachada envidraçada: 8m × 3,20m = 25,6m²

**Ambientes Identificados:**
1. Área de atendimento (aberta): 90m²
2. Sala de reunião: 20m²
3. Depósito: 25m²
4. Banheiro: 8m²
5. Copa: 7m²

**Sistemas Identificados:**

⚡ **Elétrico:**
- Pontos de luz (teto): 18 unidades
- Tomadas padrão: 32 unidades
- Tomadas de rede (RJ45): 12 unidades
- Quadro de distribuição: 1 unidade (20 circuitos)
- Ar-condicionado: 3 pontos (220V bifásico)

💧 **Hidráulico:**
- Pontos de água: 3 (banheiro, copa)
- Pontos de esgoto: 3
- Existente: SIM (manutenção, não refazer)

🏗️ **Estrutural/Arquitetônico:**
- Demolição de piso vinílico: 150m²
- Demolição de divisórias alvenaria: ~40m² (8m³)
- Novas divisórias drywall: 35m² (sala reunião + depósito)
- Pintura paredes: ~380m² (perímetro × pé-direito × 2 faces)
- Pintura teto: 150m²
- Piso laminado corporativo: 150m²
- Rodapés: 55m (perímetro)

**Confirmações Necessárias:**

1. As divisórias em drywall terão que altura? (até o teto ou meia-altura?)
2. Iluminação LED: embutida ou aparente?
3. Ar-condicionado: fornecimento + instalação ou só instalação?
4. Pintura: qual padrão? (econômico, médio, alto)

Essas informações estão corretas? Algum ajuste?
```

### Mensagem 2 (Orçamentista):
```
Análise perfeita!

Respondendo:
1. Divisórias até o teto (3,20m)
2. Iluminação LED embutida (spots)
3. Ar-condicionado: fornecimento + instalação completa
4. Pintura padrão médio (látex acrílico)

Pode prosseguir!
```
```

---

### 3. REFINAMENTO ITERATIVO (Serviço por Serviço)

```markdown
## Conversa com a IA - Parte 2: Desenvolvimento do Orçamento

### Resposta 2 (IA):
```
Perfeito! Vou desenvolver o orçamento serviço por serviço.

Vamos começar pelas **DEMOLIÇÕES**.

---

### 🔨 DEMOLIÇÕES

**Quantitativos:**
1. Demolição de piso vinílico: 150m²
2. Demolição de divisórias de alvenaria: 8m³

**Buscando no SINAPI...**

**1. Demolição de piso vinílico:**
- SINAPI 97631: Demolição de piso vinílico - R$ 8,45/m²
- Valor total: 150m² × R$ 8,45 = **R$ 1.267,50**

**2. Demolição de alvenaria:**
- SINAPI 97626: Demolição de alvenaria de tijolos furados - R$ 85,42/m³
- Valor total: 8m³ × R$ 85,42 = **R$ 683,36**

**Subtotal Demolições: R$ 1.950,86**

**Prazo estimado:**
- Demolição piso: 2 dias (equipe 3 pessoas)
- Demolição alvenaria: 1 dia (equipe 3 pessoas)
- **Total: 3 dias (01/05 a 05/05, considerando remoção de entulho)**

Valores e prazo fazem sentido para você?
```

### Mensagem 3 (Orçamentista):
```
Sim, ok! Segue para o próximo.
```

### Resposta 3 (IA):
```
---

### 🧱 DIVISÓRIAS EM DRYWALL

**Quantitativo:**
- Divisórias drywall (pé-direito completo 3,20m): 35m²

**Buscando no SINAPI...**

Encontrei 2 opções:

1. SINAPI 94233: Divisória drywall ST 70mm (acústica padrão) - R$ 127,50/m²
2. SINAPI 94234: Divisória drywall ST 90mm (acústica reforçada) - R$ 148,20/m²

Qual você prefere? (70mm é suficiente para escritório, 90mm para sala de reunião)
```

### Mensagem 4 (Orçamentista):
```
Vamos assim:
- Sala de reunião: 90mm (precisa acústica)
- Depósito: 70mm (não precisa)

Quanto fica de área para cada?
```

### Resposta 4 (IA):
```
Calculando conforme plantas:

- **Sala de reunião (90mm):** 20m de perímetro × 3,20m = 64m² ÷ 2 faces = **12m²**
- **Depósito (70mm):** 15m de perímetro × 3,20m = 48m² ÷ 2 faces = **8m²**

Ops, corrigi o cálculo anterior. Total: 20m² (não 35m²).

**Valores:**
- Drywall 90mm: 12m² × R$ 148,20 = **R$ 1.778,40**
- Drywall 70mm: 8m² × R$ 127,50 = **R$ 1.020,00**

**Subtotal Divisórias: R$ 2.798,40**

**Prazo estimado:**
- Montagem: 3 dias (06/05 a 08/05)

Confirma?
```

### Mensagem 5 (Orçamentista):
```
Perfeito! Continua...
```

[... conversa continua com elétrica, pintura, piso, etc ...]

[IMPORTANTE: Demonstrar pelo menos 2-3 idas e vindas em CADA categoria principal]
```

---

### 4. CONSULTAS AO SINAPI (Demonstrar Diferentes Casos)

```markdown
## Conversa com a IA - Parte 3: Instalações Elétricas

### Resposta 6 (IA):
```
---

### ⚡ INSTALAÇÕES ELÉTRICAS

**Quantitativos:**
1. Pontos de luz (teto LED embutido): 18 unidades
2. Tomadas 110V: 32 unidades
3. Tomadas de rede (RJ45): 12 unidades
4. Quadro de distribuição (20 circuitos): 1 unidade
5. Pontos para ar-condicionado (220V): 3 unidades

**Buscando no SINAPI...**

**1. Ponto de luz (LED embutido):**
- SINAPI 91920: Ponto de luz tubulação aparente - R$ 45,80/un
- **Mas:** Esse é para tubulação aparente. Para embutido (rasgo + eletroduto), 
  o SINAPI não tem composição fechada.
  
**Opções:**
a) Usar SINAPI e adicionar rasgo separadamente (+R$ 25/ponto)
b) Você tem valor de referência negociado?

Qual prefere?
```

### Mensagem 6 (Orçamentista):
```
Normalmente trabalho com R$ 95,00 por ponto embutido (inclui rasgo + tubulação + fiação).

Mas se o SINAPI for muito diferente, me avise.
```

### Resposta 7 (IA):
```
Entendido!

Calculando pelo SINAPI:
- Tubulação aparente: R$ 45,80
- Rasgo em alvenaria: ~R$ 28,00 (SINAPI 73949)
- **Total: R$ 73,80/ponto**

Seu valor (R$ 95,00) está **29% acima** do SINAPI.

Isso pode ser por:
- Região (SP capital tem custo mais alto)
- Inclui luminária LED (o SINAPI é só ponto)
- Margem de segurança

**Sugestão:**
Vamos documentar assim:
- Valor: R$ 95,00/ponto
- Observação: "Inclui rasgo, tubulação, fiação e luminária LED 12W"

Assim fica claro para o cliente. Confirma?
```

### Mensagem 7 (Orçamentista):
```
Perfeito! Isso mesmo, inclui a luminária LED. Segue.
```
```

---

### 5. ESTIMATIVA DE CRONOGRAMA (Com Dependências)

```markdown
## Conversa com a IA - Parte 4: Cronograma

[... após todos os serviços definidos ...]

### Resposta 12 (IA):
```
Agora vou montar o cronograma estimado.

---

### 📅 CRONOGRAMA ESTIMADO

**Sequenciamento lógico:**

**FASE 1: Demolições (3 dias)**
- SRV-001: Demolição piso vinílico (2 dias)
- SRV-002: Demolição alvenaria (1 dia, simultâneo)
- SRV-003: Remoção de entulho (1 dia)
- **Prazo:** 01/05 a 05/05 (3 dias úteis + 1 reserva)

**FASE 2: Divisórias (3 dias)**
- SRV-004: Divisórias drywall sala reunião (2 dias)
- SRV-005: Divisórias drywall depósito (1 dia, simultâneo)
- **Prazo:** 06/05 a 08/05
- **Dependência:** Após demolições concluídas

**FASE 3: Instalações (8 dias)**
- SRV-006: Instalação elétrica (pontos de luz + tomadas) (5 dias)
- SRV-007: Instalação de rede (RJ45) (3 dias, simultâneo)
- SRV-008: Instalação ar-condicionado (2 dias, após elétrica)
- **Prazo:** 09/05 a 20/05 (elétrica e rede paralelas, AC depois)
- **Dependência:** Após divisórias concluídas

**FASE 4: Acabamento Base (10 dias)**
- SRV-009: Massa corrida paredes (5 dias)
- SRV-010: Massa corrida teto (3 dias, simultâneo)
- SRV-011: Contrapiso regularização (3 dias)
- **Prazo:** 21/05 a 02/06
- **Dependência:** Após instalações concluídas
- **Atenção:** Aguardar secagem (7 dias) antes de pintar

**FASE 5: Pintura (7 dias + cura)**
- [Cura da massa corrida: 03/06 a 09/06]
- SRV-012: Pintura paredes (4 dias)
- SRV-013: Pintura teto (3 dias, simultâneo)
- **Prazo:** 10/06 a 16/06
- **Dependência:** Após cura da massa corrida

**FASE 6: Pisos e Acabamentos Finais (7 dias)**
- SRV-014: Instalação piso laminado (5 dias)
- SRV-015: Instalação rodapés (2 dias)
- SRV-016: Instalação de portas (1 dia)
- SRV-017: Limpeza final (1 dia)
- **Prazo:** 17/06 a 25/06
- **Dependência:** Após pintura concluída

---

**RESUMO:**
- **Início:** 01/05/2026
- **Término:** 25/06/2026
- **Prazo total:** 38 dias úteis (sem folgas)
- **Prazo com margem (15%):** 44 dias úteis

⚠️ **ATENÇÃO:**
Cliente pediu 45 dias. Estamos no limite!

**Riscos:**
- Chuva pode atrasar (maio/junho em SP)
- Falta de material pode gerar paradas
- Aprovação de cliente em etapas pode estender

**Recomendação:**
Comunicar ao cliente que cronograma está apertado e qualquer imprevisto pode exigir extensão de 5-7 dias.

Cronograma está OK para você?
```

### Mensagem 8 (Orçamentista):
```
Sim, perfeito! Vou avisar o cliente sobre a margem apertada.

Pode gerar o JSON final agora?
```
```

---

### 6. RESUMO EXECUTIVO + VALIDAÇÃO

```markdown
## Conversa com a IA - Parte 5: Resumo e Validação

### Resposta 13 (IA):
```
Antes de gerar o JSON, vou apresentar o resumo executivo para validação final.

---

# 📊 RESUMO EXECUTIVO - Reforma Loja TechHub

## Valores por Categoria

| Categoria | Valor | % |
|-----------|-------|---|
| Demolições | R$ 1.950,86 | 2,3% |
| Divisórias | R$ 2.798,40 | 3,3% |
| Instalações Elétricas | R$ 22.450,00 | 26,4% |
| Instalações de Rede | R$ 4.800,00 | 5,6% |
| Ar-Condicionado | R$ 18.000,00 | 21,2% |
| Massa Corrida | R$ 8.900,00 | 10,5% |
| Pintura | R$ 9.540,00 | 11,2% |
| Piso Laminado | R$ 13.500,00 | 15,9% |
| Rodapés e Acabamentos | R$ 2.200,00 | 2,6% |
| Limpeza Final | R$ 800,00 | 0,9% |
| **TOTAL** | **R$ 84.939,26** | **100%** |

## Prazo

- **Início:** 01/05/2026
- **Término:** 25/06/2026
- **Prazo:** 44 dias úteis (com margem de 15%)

## Análise vs Requisitos do Cliente

✅ **Orçamento:** R$ 84.939,26 (dentro do limite de R$ 95.000)  
⚠️ **Prazo:** 44 dias úteis (cliente pediu 45 dias - margem APERTADA)

## Serviços com Valores SINAPI

- 12 serviços baseados em SINAPI
- 5 serviços com valores negociados (ar-condicionado, piso laminado, etc)

## Próximos Passos

1. ✅ Validar resumo executivo
2. ✅ Gerar JSON de importação
3. ✅ Cliente revisar e aprovar
4. ✅ Gestor importar no EVIS Obra
5. ✅ Gestor atribuir equipes
6. ✅ Iniciar obra

---

**Tudo correto? Posso gerar o JSON final?**
```

### Mensagem 9 (Orçamentista):
```
Tudo perfeito! Gera o JSON.
```
```

---

### 7. JSON FINAL COMPLETO

```markdown
## JSON de Importação - Reforma Loja TechHub

```json
{
  "obra": {
    "id": "obra-reforma-loja-techhub-2026",
    "nome": "Reforma Comercial Loja TechHub",
    "endereco": "Av. Paulista, 1000 - São Paulo/SP",
    "cliente": "TechHub Informática Ltda",
    "tipo_obra": "Reforma",
    "area_total": 150,
    "data_inicio_prevista": "2026-05-01",
    "data_fim_prevista": "2026-06-25",
    "valor_total_estimado": 84939.26,
    "status": "Planejada"
  },
  "servicos": [
    {
      "id": "SRV-001",
      "obra_id": "obra-reforma-loja-techhub-2026",
      "descricao": "Demolição de piso vinílico existente",
      "categoria": "Demolição",
      "quantidade": 150,
      "unidade": "m²",
      "valor_unitario": 8.45,
      "valor_total": 1267.50,
      "sinapi_codigo": "97631",
      "sinapi_descricao": "DEMOLICAO DE PISO VINILICO",
      "data_inicio": "2026-05-01",
      "data_fim": "2026-05-02",
      "status": "Planejado",
      "observacoes": null
    },
    {
      "id": "SRV-002",
      "obra_id": "obra-reforma-loja-techhub-2026",
      "descricao": "Demolição de alvenaria de tijolos furados (divisórias antigas)",
      "categoria": "Demolição",
      "quantidade": 8,
      "unidade": "m³",
      "valor_unitario": 85.42,
      "valor_total": 683.36,
      "sinapi_codigo": "97626",
      "sinapi_descricao": "DEMOLICAO DE ALVENARIA DE TIJOLOS FURADOS, DE FORMA MANUAL, SEM REAPROVEITAMENTO",
      "data_inicio": "2026-05-01",
      "data_fim": "2026-05-03",
      "status": "Planejado",
      "observacoes": null
    },
    {
      "id": "SRV-003",
      "obra_id": "obra-reforma-loja-techhub-2026",
      "descricao": "Remoção e descarte de entulho de demolição",
      "categoria": "Demolição",
      "quantidade": 12,
      "unidade": "m³",
      "valor_unitario": 65.00,
      "valor_total": 780.00,
      "data_inicio": "2026-05-03",
      "data_fim": "2026-05-05",
      "status": "Planejado",
      "observacoes": "Inclui caçamba e transporte para bota-fora licenciado"
    },
    {
      "id": "SRV-004",
      "obra_id": "obra-reforma-loja-techhub-2026",
      "descricao": "Divisória em drywall ST 90mm (sala de reunião - acústica reforçada)",
      "categoria": "Divisórias",
      "quantidade": 12,
      "unidade": "m²",
      "valor_unitario": 148.20,
      "valor_total": 1778.40,
      "sinapi_codigo": "94234",
      "sinapi_descricao": "DIVISORIA EM DRYWALL ST 90MM",
      "data_inicio": "2026-05-06",
      "data_fim": "2026-05-07",
      "status": "Planejado",
      "observacoes": "Altura completa até o teto (3,20m)"
    },
    {
      "id": "SRV-005",
      "obra_id": "obra-reforma-loja-techhub-2026",
      "descricao": "Divisória em drywall ST 70mm (depósito - padrão)",
      "categoria": "Divisórias",
      "quantidade": 8,
      "unidade": "m²",
      "valor_unitario": 127.50,
      "valor_total": 1020.00,
      "sinapi_codigo": "94233",
      "sinapi_descricao": "DIVISORIA EM DRYWALL ST 70MM",
      "data_inicio": "2026-05-06",
      "data_fim": "2026-05-08",
      "status": "Planejado",
      "observacoes": "Altura completa até o teto (3,20m)"
    },
    {
      "id": "SRV-006",
      "obra_id": "obra-reforma-loja-techhub-2026",
      "descricao": "Instalação elétrica completa (pontos de luz LED embutidos + tomadas)",
      "categoria": "Instalações Elétricas",
      "quantidade": 50,
      "unidade": "un",
      "valor_unitario": 95.00,
      "valor_total": 4750.00,
      "data_inicio": "2026-05-09",
      "data_fim": "2026-05-15",
      "status": "Planejado",
      "observacoes": "Inclui rasgo, tubulação, fiação e luminária LED 12W. Valor 29% acima SINAPI por incluir luminária."
    },
    {
      "id": "SRV-007",
      "obra_id": "obra-reforma-loja-techhub-2026",
      "descricao": "Quadro de distribuição (20 circuitos) + DPS + DR",
      "categoria": "Instalações Elétricas",
      "quantidade": 1,
      "unidade": "un",
      "valor_unitario": 2800.00,
      "valor_total": 2800.00,
      "sinapi_codigo": "91935",
      "sinapi_descricao": "QUADRO DE DISTRIBUICAO 20 CIRCUITOS",
      "data_inicio": "2026-05-09",
      "data_fim": "2026-05-10",
      "status": "Planejado",
      "observacoes": null
    },
    {
      "id": "SRV-008",
      "obra_id": "obra-reforma-loja-techhub-2026",
      "descricao": "Instalação de pontos para ar-condicionado (220V bifásico)",
      "categoria": "Instalações Elétricas",
      "quantidade": 3,
      "unidade": "un",
      "valor_unitario": 450.00,
      "valor_total": 1350.00,
      "data_inicio": "2026-05-16",
      "data_fim": "2026-05-17",
      "status": "Planejado",
      "observacoes": "Inclui eletroduto, fiação 6mm² e tomada dedicada"
    },
    {
      "id": "SRV-009",
      "obra_id": "obra-reforma-loja-techhub-2026",
      "descricao": "Instalação de rede estruturada (cabos UTP Cat6 + RJ45)",
      "categoria": "Instalações de Rede",
      "quantidade": 12,
      "unidade": "un",
      "valor_unitario": 400.00,
      "valor_total": 4800.00,
      "data_inicio": "2026-05-09",
      "data_fim": "2026-05-13",
      "status": "Planejado",
      "observacoes": "Inclui eletroduto, cabo UTP Cat6, patch panel e certificação"
    },
    {
      "id": "SRV-010",
      "obra_id": "obra-reforma-loja-techhub-2026",
      "descricao": "Fornecimento e instalação de ar-condicionado split (3 unidades 18.000 BTUs)",
      "categoria": "Climatização",
      "quantidade": 3,
      "unidade": "un",
      "valor_unitario": 6000.00,
      "valor_total": 18000.00,
      "data_inicio": "2026-05-18",
      "data_fim": "2026-05-20",
      "status": "Planejado",
      "observacoes": "Inclui equipamento inverter A+ + instalação completa + gás. Valor negociado com fornecedor XYZ."
    },
    {
      "id": "SRV-011",
      "obra_id": "obra-reforma-loja-techhub-2026",
      "descricao": "Aplicação de massa corrida em paredes (2 demãos)",
      "categoria": "Acabamento",
      "quantidade": 380,
      "unidade": "m²",
      "valor_unitario": 18.50,
      "valor_total": 7030.00,
      "sinapi_codigo": "88489",
      "sinapi_descricao": "MASSA CORRIDA EM PAREDES",
      "data_inicio": "2026-05-21",
      "data_fim": "2026-05-27",
      "status": "Planejado",
      "observacoes": "Aguardar secagem de 7 dias antes de pintar"
    },
    {
      "id": "SRV-012",
      "obra_id": "obra-reforma-loja-techhub-2026",
      "descricao": "Aplicação de massa corrida em teto (2 demãos)",
      "categoria": "Acabamento",
      "quantidade": 150,
      "unidade": "m²",
      "valor_unitario": 22.00,
      "valor_total": 3300.00,
      "data_inicio": "2026-05-21",
      "data_fim": "2026-05-25",
      "status": "Planejado",
      "observacoes": "Aguardar secagem de 7 dias antes de pintar"
    },
    {
      "id": "SRV-013",
      "obra_id": "obra-reforma-loja-techhub-2026",
      "descricao": "Pintura látex acrílico em paredes (2 demãos)",
      "categoria": "Pintura",
      "quantidade": 380,
      "unidade": "m²",
      "valor_unitario": 18.50,
      "valor_total": 7030.00,
      "sinapi_codigo": "88486",
      "sinapi_descricao": "PINTURA LATEX ACRILICO EM PAREDES",
      "data_inicio": "2026-06-10",
      "data_fim": "2026-06-13",
      "status": "Planejado",
      "observacoes": "Cor: Branco Gelo (padrão corporativo)"
    },
    {
      "id": "SRV-014",
      "obra_id": "obra-reforma-loja-techhub-2026",
      "descricao": "Pintura látex acrílico em teto (2 demãos)",
      "categoria": "Pintura",
      "quantidade": 150,
      "unidade": "m²",
      "valor_unitario": 16.00,
      "valor_total": 2400.00,
      "data_inicio": "2026-06-10",
      "data_fim": "2026-06-12",
      "status": "Planejado",
      "observacoes": "Cor: Branco (padrão)"
    },
    {
      "id": "SRV-015",
      "obra_id": "obra-reforma-loja-techhub-2026",
      "descricao": "Fornecimento e instalação de piso laminado corporativo (AC5)",
      "categoria": "Piso",
      "quantidade": 150,
      "unidade": "m²",
      "valor_unitario": 90.00,
      "valor_total": 13500.00,
      "data_inicio": "2026-06-17",
      "data_fim": "2026-06-21",
      "status": "Planejado",
      "observacoes": "Piso laminado AC5 (alto tráfego) cor carvalho. Inclui manta isolante. Valor negociado (não há SINAPI)."
    },
    {
      "id": "SRV-016",
      "obra_id": "obra-reforma-loja-techhub-2026",
      "descricao": "Instalação de rodapés em MDF (10cm altura)",
      "categoria": "Acabamento",
      "quantidade": 55,
      "unidade": "m",
      "valor_unitario": 35.00,
      "valor_total": 1925.00,
      "data_inicio": "2026-06-22",
      "data_fim": "2026-06-23",
      "status": "Planejado",
      "observacoes": "Cor: compatível com piso laminado"
    },
    {
      "id": "SRV-017",
      "obra_id": "obra-reforma-loja-techhub-2026",
      "descricao": "Limpeza final pós-obra",
      "categoria": "Serviços Finais",
      "quantidade": 150,
      "unidade": "m²",
      "valor_unitario": 8.00,
      "valor_total": 1200.00,
      "data_inicio": "2026-06-24",
      "data_fim": "2026-06-25",
      "status": "Planejado",
      "observacoes": "Inclui remoção de respingos de tinta, limpeza de janelas e polimento de piso"
    }
  ],
  "aliases": [
    {
      "alias": "reforma techhub",
      "tipo": "obra",
      "referencia_id": "obra-reforma-loja-techhub-2026"
    },
    {
      "alias": "loja techhub",
      "tipo": "obra",
      "referencia_id": "obra-reforma-loja-techhub-2026"
    },
    {
      "alias": "demolição",
      "tipo": "servico",
      "referencia_id": "SRV-001"
    },
    {
      "alias": "elétrica",
      "tipo": "servico",
      "referencia_id": "SRV-006"
    },
    {
      "alias": "ar condicionado",
      "tipo": "servico",
      "referencia_id": "SRV-010"
    },
    {
      "alias": "pintura",
      "tipo": "servico",
      "referencia_id": "SRV-013"
    },
    {
      "alias": "piso",
      "tipo": "servico",
      "referencia_id": "SRV-015"
    }
  ]
}
```
```

---

### 8. CHECKLIST DE VALIDAÇÃO (Final)

```markdown
## ✅ Validação do JSON Gerado

### Obra
- [x] ID único definido: `obra-reforma-loja-techhub-2026`
- [x] Nome e endereço completos
- [x] Cliente especificado
- [x] Tipo de obra: Reforma
- [x] Área total: 150m²
- [x] Datas válidas (início < fim)
- [x] Valor total: R$ 84.939,26 (dentro do limite)

### Serviços (17 serviços)
- [x] Todos com ID único (SRV-001 a SRV-017)
- [x] Todos vinculados à obra
- [x] Valores calculados corretamente (quantidade × unitário)
- [x] Unidades válidas (m², m³, un, m)
- [x] Categorias definidas
- [x] **12 serviços com código SINAPI**
- [x] **5 serviços com valores negociados (documentados em observações)**
- [x] Datas sequenciais lógicas
- [x] Cronograma total: 44 dias úteis (dentro do prazo de 45 dias)

### Cronograma
- [x] Nenhum serviço antes de 01/05/2026 (data_inicio_prevista)
- [x] Nenhum serviço depois de 25/06/2026 (data_fim_prevista)
- [x] Dependências respeitadas:
  - [x] Divisórias APÓS demolições
  - [x] Instalações APÓS divisórias
  - [x] Massa corrida APÓS instalações
  - [x] Pintura APÓS cura da massa (7 dias)
  - [x] Piso APÓS pintura
- [x] Curas respeitadas (massa corrida: 7 dias)

### SINAPI
- [x] 12 serviços com `sinapi_codigo` e `sinapi_descricao`
- [x] Valores compatíveis com SINAPI (divergências >30% documentadas)
- [x] 5 serviços sem SINAPI (justificados em observações)

### Equipes
- [x] **Array `equipes` NÃO INCLUÍDO** (conforme regra)

### Aliases
- [x] Obra com 2 aliases
- [x] Serviços principais com aliases (5 serviços)
- [x] Referências corretas

---

## 🎯 Conclusão do Exemplo

Este orçamento está completo e pronto para:
1. ✅ Cliente revisar e aprovar
2. ✅ Gestor importar no EVIS Obra
3. ✅ Gestor criar equipes (APÓS importação)
4. ✅ Gestor atribuir equipes aos serviços
5. ✅ Iniciar execução

**Valor:** R$ 84.939,26 (dentro do limite de R$ 95.000)  
**Prazo:** 44 dias úteis (dentro do prazo de 45 dias, com margem mínima)

**Alertas para o cliente:**
- ⚠️ Cronograma apertado (margem de apenas 1 dia)
- ⚠️ Qualquer imprevisto pode exigir extensão de 5-7 dias
- ⚠️ Recomendado iniciar imediatamente após aprovação (maio é época de chuvas em SP)
```
```

---

## CHECKLIST FINAL DO EXEMPLO

Antes de finalizar o exemplo sistemático, verificar:

- [ ] Apresentação do caso (contexto realista)
- [ ] Início da conversa (envio de PDF)
- [ ] Análise do projeto pela IA (detalhada)
- [ ] Refinamento iterativo (mínimo 3 idas e vindas por categoria)
- [ ] Consulta ao SINAPI (demonstrar busca, opções, escolha)
- [ ] Valores divergentes do SINAPI (documentados)
- [ ] Cronograma com dependências (sequenciamento lógico)
- [ ] Curas respeitadas (concreto, reboco, massa corrida)
- [ ] Resumo executivo (antes do JSON)
- [ ] JSON completo (17 serviços)
- [ ] 12 serviços com SINAPI (códigos e descrições)
- [ ] 5 serviços sem SINAPI (justificados)
- [ ] SEM array `equipes` no JSON
- [ ] Checklist de validação completo
- [ ] Conclusão com alertas ao cliente

---

## FORMATO DE ENTREGA

Retornar o arquivo completo:

✅ **orcamentista/exemplos/EXEMPLO_SISTEMATICO_COMPLETO.md**

---

## OBSERVAÇÕES IMPORTANTES

### Realismo é Crítico

O exemplo deve ser **REALISTA**, não simplificado:
- Valores de mercado (não números redondos)
- Cronograma com dependências reais
- Problemas típicos (divergência SINAPI, valores negociados)
- Refinamento iterativo (não one-shot)

### Demonstrar TODOS os Recursos

O exemplo deve mostrar:
- ✅ Leitura de PDF (análise detalhada)
- ✅ Consulta ao SINAPI (busca, opções, escolha)
- ✅ Refinamento iterativo (múltiplas idas e vindas)
- ✅ Valores SINAPI (12 serviços)
- ✅ Valores negociados (5 serviços, documentados)
- ✅ Cronograma com dependências (fundação → estrutura → acabamento)
- ✅ Curas (massa corrida 7 dias antes de pintar)
- ✅ SEM equipes (conforme regra)
- ✅ Validação final (checklist)

### Servir de Template

O orçamentista (humano) deve poder:
1. Ler o exemplo
2. Entender o fluxo completo
3. Replicar para seus próprios projetos

Por isso:
- Conversa natural (não robótica)
- Explicações claras (não técnicas demais)
- Passo a passo explícito (não pular etapas)

---

**AGORA CRIE O EXEMPLO SISTEMÁTICO COMPLETO!**
