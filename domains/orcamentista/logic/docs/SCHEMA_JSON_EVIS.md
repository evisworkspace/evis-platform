# Schema JSON EVIS — Documentação Completa

> **Versão:** 2.0 (Orçamentação Completa)  
> **Compatível com:** EVIS Obra + Supabase

> **Nota de nomenclatura:** o campo oficial de negócio do serviço passou a ser `codigo_servico`.
> `id` deve permanecer UUID interno quando existir em banco/app.
> Exemplos legados com `SRV-*` devem ser considerados em processo de migração.

---

## 🎯 Objetivo

Este schema documenta a estrutura JSON completa para orçamentos EVIS, incluindo:
- Obra (dados gerais)
- BDI detalhado (percentuais por componente)
- Serviços com composição (insumos + mão de obra + equipamentos)
- Cronograma físico-financeiro
- Equipes (podem ficar "a-definir")
- Aliases para busca semântica

---

## 📋 Estrutura Geral

```json
{
  "_meta": { ... },
  "obra": { ... },
  "bdi_detalhamento": { ... },
  "equipes": [ ... ],
  "servicos": [ ... ],
  "cronograma_financeiro": [ ... ]
}
```

---

## 🏗️ Bloco 1: Obra

Informações gerais do projeto.

### **Campos:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string | ✅ Sim | Identificador único (ex: "obra-reforma-casa-2026") |
| `nome` | string | ✅ Sim | Nome da obra |
| `endereco` | string | ⚪ Não | Endereço completo |
| `cliente` | string | ⚪ Não | Nome do cliente |
| `tipo_obra` | string | ⚪ Não | "Reforma" / "Construção Nova" / "Ampliação" |
| `area_total` | number | ⚪ Não | Área em m² |
| `data_inicio_prevista` | string | ⚪ Não | Data no formato "AAAA-MM-DD" |
| `data_fim_prevista` | string | ⚪ Não | Data no formato "AAAA-MM-DD" |
| `prazo_dias_uteis` | number | ⚪ Não | Prazo em dias úteis |
| `valor_custos_diretos` | number | ✅ Sim | Soma de todos os serviços (sem BDI) |
| `bdi_percentual` | number | ✅ Sim | BDI total em percentual |
| `bdi_valor` | number | ✅ Sim | Valor do BDI em reais |
| `valor_total_com_bdi` | number | ✅ Sim | Valor final (diretos + BDI) |
| `status` | string | ✅ Sim | "Planejada" / "ATIVA" / "Concluída" |
| `regime_tributario` | string | ⚪ Não | "Simples Nacional" / "Lucro Presumido" / "Lucro Real" |
| `observacoes` | string | ⚪ Não | Notas gerais |

### **Validações:**

```javascript
data_inicio_prevista < data_fim_prevista
valor_total_com_bdi === valor_custos_diretos × (1 + bdi_percentual/100)
status === "Planejada" (no orçamento inicial)
```

### **Exemplo:**

```json
{
  "obra": {
    "id": "obra-reforma-casa-silva-2026",
    "nome": "Reforma Residencial - Casa Silva",
    "endereco": "Rua das Flores, 123 - Curitiba/PR",
    "cliente": "João Silva",
    "tipo_obra": "Reforma",
    "area_total": 70,
    "data_inicio_prevista": "2026-06-01",
    "data_fim_prevista": "2026-08-23",
    "prazo_dias_uteis": 64,
    "valor_custos_diretos": 39830.00,
    "bdi_percentual": 20.77,
    "bdi_valor": 8272.69,
    "valor_total_com_bdi": 48102.69,
    "status": "Planejada",
    "regime_tributario": "Simples Nacional",
    "observacoes": "Cliente solicitou início após término do ano letivo"
  }
}
```

---

## 💰 Bloco 2: BDI Detalhamento

Composição detalhada do BDI.

### **Campos:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `administracao` | number | ✅ Sim | % de administração central |
| `seguro` | number | ✅ Sim | % de seguro e garantia |
| `risco` | number | ✅ Sim | % de risco |
| `despesas_financeiras` | number | ✅ Sim | % de despesas financeiras |
| `lucro` | number | ✅ Sim | % de lucro |
| `impostos` | number | ✅ Sim | % de impostos (conforme regime) |
| `total` | number | ✅ Sim | Soma de todos os percentuais |

### **Validações:**

```javascript
total === administracao + seguro + risco + despesas_financeiras + lucro + impostos
total === obra.bdi_percentual
```

### **Exemplo:**

```json
{
  "bdi_detalhamento": {
    "administracao": 4.0,
    "seguro": 0.8,
    "risco": 1.27,
    "despesas_financeiras": 1.3,
    "lucro": 7.4,
    "impostos": 6.0,
    "total": 20.77
  }
}
```

---

## 🔨 Bloco 3: Serviços

Lista de todos os serviços do orçamento.

### **Campos Principais:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `codigo_servico` | string | ✅ Sim | Código do orçamento no formato `N.M` (ex: "4.3") |
| `obra_id` | string | ✅ Sim | Referência à obra |
| `categoria` | string | ✅ Sim | Categoria do serviço |
| `descricao` | string | ✅ Sim | Descrição do serviço |
| `unidade` | string | ✅ Sim | Unidade (m², m³, un, m, kg, L) |
| `quantidade` | number | ✅ Sim | Quantidade |
| `composicao` | object | ✅ Sim | Composição detalhada (ver abaixo) |
| `valor_unitario_direto` | number | ✅ Sim | Valor por unidade (sem BDI) |
| `valor_total_direto` | number | ✅ Sim | Valor total (sem BDI) |
| `valor_unitario_com_bdi` | number | ✅ Sim | Valor por unidade (com BDI) |
| `valor_total_com_bdi` | number | ✅ Sim | Valor total (com BDI) |
| `referencia_preco` | object | ⚪ Não | Metadados da referencia de custo usada no item |
| `cronograma` | object | ✅ Sim | Cronograma do serviço (ver abaixo) |
| `equipe` | string/null | ⚪ Não | Referência à equipe (ex: "EQ-OBR-01") ou null ou "a-definir" |
| `status` | string | ✅ Sim | "Planejado" (no orçamento) |
| `observacoes` | string/null | ⚪ Não | Notas sobre o serviço |

### **Subobjeto: composicao**

```json
"composicao": {
  "sinapi_codigo": "97631" | null,
  "sinapi_descricao": "Demolição de piso cerâmico" | null,
  
  "insumos": [
    {
      "descricao": "Caçamba 5m³",
      "unidade": "un",
      "quantidade": 2.0,
      "valor_unitario": 250.00,
      "valor_total": 500.00
    }
  ],
  
  "mao_de_obra": [
    {
      "funcao": "Servente",
      "horas": 16,
      "valor_hora": 18.50,
      "valor_total": 296.00
    }
  ],
  
  "equipamentos": [
    {
      "descricao": "Martelete",
      "unidade": "hora",
      "quantidade": 8,
      "valor_unitario": 12.00,
      "valor_total": 96.00
    }
  ]
}
```

### **Subobjeto: referencia_preco**

```json
"referencia_preco": {
  "fonte": "catalogo_evis" | "sinapi_direto" | "sinapi_derivado" | "cotacao_real" | "composicao_propria",
  "codigo_referencia": "EVIS-REV-REBOCO" | "87529" | null,
  "competencia": "2026-03-01" | null,
  "fonte_preco": "SINAPI PR sem desoneracao" | "Fornecedor XYZ" | null,
  "confianca": 92,
  "observacoes": "Conversao de m3 para m2 com espessura de 2 cm"
}
```

### **Subobjeto: cronograma**

```json
"cronograma": {
  "data_inicio": "2026-06-01",
  "data_fim": "2026-06-04",
  "duracao_dias": 3,
  "percentual_fisico": 3.0,
  "desembolso_previsto": 1610.00
}
```

### **Validações:**

```javascript
// Valores
valor_total_direto === quantidade × valor_unitario_direto
valor_total_com_bdi === valor_total_direto × (1 + obra.bdi_percentual/100)

// Composição
soma(insumos.valor_total + mao_de_obra.valor_total + equipamentos.valor_total) ≈ valor_total_direto

// Cronograma
data_inicio >= obra.data_inicio_prevista
data_fim <= obra.data_fim_prevista

// Físico e financeiro
soma(todos_servicos.percentual_fisico) === 100%
soma(todos_servicos.desembolso_previsto) === obra.valor_total_com_bdi
```

### **Exemplo Completo:**

```json
{
  "servicos": [
    {
      "codigo_servico": "2.1",
      "obra_id": "obra-reforma-casa-silva-2026",
      "categoria": "Demolição",
      "descricao": "Demolição de piso cerâmico",
      "unidade": "m²",
      "quantidade": 70.00,
      
      "composicao": {
        "sinapi_codigo": "97631",
        "sinapi_descricao": "Demolição de piso cerâmico, manual",
        
        "insumos": [
          {
            "descricao": "Caçamba 5m³",
            "unidade": "un",
            "quantidade": 2.0,
            "valor_unitario": 250.00,
            "valor_total": 500.00
          }
        ],
        
        "mao_de_obra": [
          {
            "funcao": "Servente",
            "horas": 16,
            "valor_hora": 18.50,
            "valor_total": 296.00
          }
        ],
        
        "equipamentos": []
      },
      
      "valor_unitario_direto": 11.37,
      "valor_total_direto": 796.00,
      "valor_unitario_com_bdi": 13.73,
      "valor_total_com_bdi": 961.00,

      "referencia_preco": {
        "fonte": "sinapi_direto",
        "codigo_referencia": "97631",
        "competencia": "2026-03-01",
        "fonte_preco": "SINAPI PR sem desoneracao",
        "confianca": 90,
        "observacoes": null
      },
      
      "cronograma": {
        "data_inicio": "2026-06-01",
        "data_fim": "2026-06-04",
        "duracao_dias": 3,
        "percentual_fisico": 3.0,
        "desembolso_previsto": 961.00
      },
      
      "equipe": "EQ-OBR-01",
      "aliases": ["demolição", "quebrar"],
      "data_inicio": "2026-06-01",
      "data_fim": "2026-06-04",
      "duracao_dias": 3,
      "percentual_fisico": 3.0,
      "status": "nao_iniciado"
    }
  ]
}
```

---

## 👥 Bloco 4: Equipes

Lista de equipes/fornecedores (podem ficar "a-definir").

### **Campos:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string | ✅ Sim | Identificador único (ex: "EQ-001") |
| `nome` | string | ✅ Sim | Nome da equipe/fornecedor |
| `tipo` | string | ✅ Sim | Tipo de serviço especializado |
| `status` | string | ✅ Sim | "Definida" / "A definir" |
| `composicao` | array | ⚪ Não | Composição da equipe (se definida) |
| `servicos_atribuidos` | array | ✅ Sim | Lista de IDs dos serviços |
| `observacoes` | string/null | ⚪ Não | Notas |

### **Subobjeto: composicao (se equipe definida)**

```json
"composicao": [
  {
    "funcao": "Pedreiro",
    "quantidade": 2,
    "valor_hora": 28.00
  },
  {
    "funcao": "Servente",
    "quantidade": 1,
    "valor_hora": 18.50
  }
]
```

### **Exemplo:**

```json
{
  "equipes": [
    {
      "id": "EQ-001",
      "nome": "Construtora Silva",
      "tipo": "Demolição",
      "status": "Definida",
      
      "composicao": [
        {
          "funcao": "Servente",
          "quantidade": 3,
          "valor_hora": 18.50
        }
      ],
      
      "servicos_atribuidos": ["1.1", "1.2"],
      "observacoes": null
    },
    {
      "id": "EQ-003",
      "nome": "A definir",
      "tipo": "Elétrica",
      "status": "A definir",
      
      "composicao": [],
      
      "servicos_atribuidos": ["2.1", "2.2", "2.3"],
      "observacoes": "Equipe será definida após aprovação do orçamento"
    }
  ]
}
```

---

## 📅 Bloco 5: Cronograma Financeiro

Distribuição mensal de físico e desembolso.

### **Campos:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `periodo` | string | ✅ Sim | Formato "AAAA-MM" |
| `mes_ano` | string | ✅ Sim | Formato legível "Mês/Ano" |
| `percentual_fisico` | number | ✅ Sim | % físico executado no período |
| `percentual_desembolso` | number | ✅ Sim | % do desembolso no período |
| `desembolso_mes` | number | ✅ Sim | Valor em R$ no mês |
| `desembolso_acumulado` | number | ✅ Sim | Valor acumulado até o mês |
| `servicos_executados` | array | ✅ Sim | Lista de IDs dos serviços |

### **Validações:**

```javascript
soma(percentual_fisico) === 100%
soma(desembolso_mes) === obra.valor_total_com_bdi
desembolso_acumulado[n] === soma(desembolso_mes[0..n])
```

### **Exemplo:**

```json
{
  "cronograma_financeiro": [
    {
      "periodo": "2026-06",
      "mes_ano": "Jun/2026",
      "percentual_fisico": 38,
      "percentual_desembolso": 38.0,
      "desembolso_mes": 18280.00,
      "desembolso_acumulado": 18280.00,
      "servicos_executados": ["1.1", "1.2", "1.3", "1.4"]
    },
    {
      "periodo": "2026-07",
      "mes_ano": "Jul/2026",
      "percentual_fisico": 61,
      "percentual_desembolso": 40.4,
      "desembolso_mes": 19438.00,
      "desembolso_acumulado": 37718.00,
      "servicos_executados": ["1.5", "2.1", "2.2", "2.3"]
    },
    {
      "periodo": "2026-08",
      "mes_ano": "Ago/2026",
      "percentual_fisico": 100,
      "percentual_desembolso": 21.6,
      "desembolso_mes": 10384.00,
      "desembolso_acumulado": 48102.00,
      "servicos_executados": ["3.3", "3.4", "3.5"]
    }
  ]
}
```

---

## 🔖 Bloco 6: Aliases

Aliases para busca semântica.

### **Campos:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `alias` | string | ✅ Sim | Texto de busca |
| `tipo` | string | ✅ Sim | "obra" / "servico" / "equipe" |
| `referencia_id` | string | ✅ Sim | ID do objeto referenciado |

### **Exemplo:**

```json
{
  "aliases": [
    {
      "alias": "reforma casa silva",
      "tipo": "obra",
      "referencia_id": "obra-reforma-casa-silva-2026"
    },
    {
      "alias": "demolição",
      "tipo": "servico",
      "referencia_id": "1.1"
    },
    {
      "alias": "quebrar piso",
      "tipo": "servico",
      "referencia_id": "1.1"
    }
  ]
}
```

---

## ⚙️ Bloco 7: Metadados

Informações técnicas da geração.

### **Campos:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `versao_schema` | string | ✅ Sim | Versão do schema (ex: "2.0") |
| `data_geracao` | string | ✅ Sim | ISO 8601 timestamp |
| `gerado_por` | string | ✅ Sim | "Evis Orçamentos" |
| `sistema_destino` | string | ✅ Sim | "EVIS Obra" |
| `status_validacao` | string | ✅ Sim | "validado" / "pendente" |
| `observacoes` | string/null | ⚪ Não | Notas técnicas |

### **Exemplo:**

```json
{
  "_meta": {
    "versao": "3.0",
    "data_geracao": "2026-04-16",
    "sistema": "EVIS Orçamentos",
    "status_orcamento": "finalizado",
    "total_servicos": 25,
    "itens_excluidos_escopo": []
  }
}
```

---

## ✅ Checklist de Validação

Antes de gerar o JSON final, validar:

### **Obra:**
- [ ] ID único e bem formatado
- [ ] Nome não-vazio
- [ ] Datas consistentes (início < fim)
- [ ] Valor total = diretos × (1 + BDI/100)

### **BDI:**
- [ ] Soma dos componentes = BDI total
- [ ] BDI total = obra.bdi_percentual

### **Serviços:**
- [ ] Todos têm ID único
- [ ] Todos vinculados à obra
- [ ] Quantidade > 0
- [ ] Composição presente (insumos + mão de obra)
- [ ] Valor total direto = qtd × valor unitário
- [ ] Cronograma presente
- [ ] Soma físico de todos = 100%
- [ ] Soma desembolso = valor total obra

### **Equipes:**
- [ ] Array presente (mesmo que vazio)
- [ ] Se "Definida": tem composição
- [ ] Se "A definir": composição vazia

### **Cronograma Financeiro:**
- [ ] Soma físico = 100%
- [ ] Soma desembolso mês = valor total obra
- [ ] Desembolso acumulado progressivo

---

## 📚 Notas Técnicas

### **Unidades Válidas:**
- Área: `m²`
- Volume: `m³`
- Comprimento: `m`
- Quantidade: `un`
- Peso: `kg`
- Capacidade: `L`

### **Status Válidos:**
- Obra: `"Planejada"` / `"ATIVA"` / `"Concluída"`
- Serviço: `"Planejado"` / `"nao_iniciado"` / `"em_andamento"` / `"concluido"` / `"pausado"`
- Equipe: `"Definida"` / `"A definir"`

### **Formato de Datas:**
- Datas: `"AAAA-MM-DD"`
- Períodos: `"AAAA-MM"`
- Timestamp: ISO 8601

---

**Schema EVIS v2.0 — Orçamentação Completa**
