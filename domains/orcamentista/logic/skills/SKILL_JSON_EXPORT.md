# SKILL: Exportação JSON para EVIS

> **Especialista em:** Consolidação e exportação para EVIS Obra  
> **Saída:** JSON válido + Resumo executivo (TABELAS)

---

## 🎯 Objetivo

Consolidar todas as informações validadas e gerar:
- Resumo executivo completo (TABELAS)
- JSON estruturado para importação no EVIS Obra
- Validação de schema
- Arquivo pronto para entregar

---

## 📥 Entrada Esperada

Dados de todas as etapas anteriores:
- Análise inicial (ambientes, materiais)
- Quantitativos e composições
- BDI definido
- Cronograma físico-financeiro

---

## 📊 Formato de Saída

### **Parte 1: Resumo Executivo (TABELAS)**

```markdown
## ORÇAMENTO FINAL CONSOLIDADO

### Informações Gerais da Obra

| Item | Valor |
|------|-------|
| **Nome da Obra** | [Nome do projeto] |
| **Endereço** | [Endereço completo] |
| **Cliente** | [Nome do cliente] |
| **Tipo de Obra** | Reforma / Construção Nova / Ampliação |
| **Área Total** | [X] m² |
| **Data Início Prevista** | [DD/MM/AAAA] |
| **Data Fim Prevista** | [DD/MM/AAAA] |
| **Prazo Total** | [X] dias úteis |

---

### Resumo Financeiro

| Item | Valor | % |
|------|-------|---|
| Custos Diretos ([X] serviços) | R$ [valor] | - |
| BDI ([X]%) | R$ [valor] | - |
| **VALOR TOTAL** | **R$ [total]** | **100%** |

---

### Distribuição por Categoria

| Categoria | Qtd Serviços | Valor | % do Total |
|-----------|--------------|-------|------------|
| Demolições | [qtd] | R$ [valor] | [%] |
| Fundação | [qtd] | R$ [valor] | [%] |
| Alvenaria e Divisórias | [qtd] | R$ [valor] | [%] |
| Instalações Elétricas | [qtd] | R$ [valor] | [%] |
| Instalações Hidráulicas | [qtd] | R$ [valor] | [%] |
| Revestimentos | [qtd] | R$ [valor] | [%] |
| Pintura | [qtd] | R$ [valor] | [%] |
| Pisos | [qtd] | R$ [valor] | [%] |
| Cobertura | [qtd] | R$ [valor] | [%] |
| Esquadrias | [qtd] | R$ [valor] | [%] |
| Acabamentos | [qtd] | R$ [valor] | [%] |
| **TOTAL** | **[total]** | **R$ [total]** | **100%** |

---

### Cronograma Financeiro

| Período | % Físico | % Desembolso | Desembolso | Acumulado |
|---------|----------|--------------|------------|-----------|
| [Mês/Ano] | [%] | [%] | R$ [valor] | R$ [acum] |
| **TOTAL** | **100%** | **100%** | **R$ [total]** | **R$ [total]** |

---

### Equipes Previstas

| Equipe | Tipo | Status | Serviços Atribuídos | Observações |
|--------|------|--------|---------------------|-------------|
| EQ-001 | Demolição | ✅ Definida | 1.1, 1.2 | - |
| EQ-002 | Alvenaria | ✅ Definida | 1.4, 1.5 | - |
| EQ-003 | Elétrica | ⏳ A definir | 2.1, 2.2, 2.3 | Definir após aprovação |
| EQ-004 | Hidráulica | ⏳ A definir | 2.4, 2.5 | Definir após aprovação |
| EQ-005 | Acabamentos | ⏳ A definir | 3.3 a 4.3 | Definir após aprovação |

---

### Referências SINAPI Utilizadas

| Serviço | SINAPI | Valor SINAPI | Valor Utilizado | Divergência | Observação |
|---------|--------|--------------|-----------------|-------------|------------|
| 1.1 | 97631 | R$ 15,80 | R$ 15,80 | - | - |
| 1.4 | 87492 | R$ 85,00 | R$ 85,00 | - | - |
| 1.5 | - | - | R$ 120,00 | N/A | Sem SINAPI (inclui luminária) |
| 3.3 | 87265 | R$ 62,00 | R$ 45,00 | -27% | **Fornecedor negociado** |
| [demais] | ✅ | ✅ | ✅ | - | Valores SINAPI mantidos |

---

### Composição do BDI

| Item BDI | % Definido | Valor (R$) |
|----------|-----------|------------|
| Administração central | [%] | R$ [valor] |
| Seguro e garantia | [%] | R$ [valor] |
| Risco | [%] | R$ [valor] |
| Despesas financeiras | [%] | R$ [valor] |
| Lucro | [%] | R$ [valor] |
| Impostos ([regime]) | [%] | R$ [valor] |
| **TOTAL BDI** | **[%]** | **R$ [total]** |

---

📥 **Exportar JSON para EVIS Obra?**
```

---

### **Parte 2: Estrutura JSON — Schema Canônico v3.0**

> Este é o schema oficial. Todos os campos devem seguir exatamente estes nomes e estruturas.

```json
{
  "_meta": {
    "versao": "3.0",
    "data_geracao": "AAAA-MM-DD",
    "sistema": "EVIS Orçamentos",
    "status_orcamento": "rascunho | em_revisao | aprovado | finalizado",
    "total_servicos": 0,
    "itens_excluidos_escopo": []
  },

  "obra": {
    "id": "obra-[slug]-[ano]",
    "nome": "[Nome da Obra]",
    "endereco": "[Endereço completo]",
    "cliente": "[Nome do Cliente]",
    "tipo_obra": "Construção Nova | Reforma | Ampliação",
    "area_total_m2": 0,
    "status": "Planejada",
    "regime_tributario": "Simples Nacional | Lucro Presumido | Lucro Real",
    "rt_estrutural": null,
    "rt_arquitetonico": null,
    "data_inicio_prevista": "AAAA-MM-DD",
    "data_fim_prevista": "AAAA-MM-DD",
    "prazo_dias_uteis": 0,
    "valor_custos_diretos": 0,
    "bdi_percentual": 0,
    "bdi_valor": 0,
    "valor_total_com_bdi": 0,
    "custo_direto_por_m2": 0,
    "valor_total_por_m2": 0,
    "observacoes": null
  },

  "bdi_detalhamento": {
    "modelo": "[descrição do modelo, ex: Gerenciamento + Impostos Simples Nacional]",
    "gerenciamento_pct": 0,
    "gerenciamento_valor": 0,
    "impostos_pct": 0,
    "impostos_valor": 0,
    "total_pct": 0,
    "total_valor": 0,
    "observacao": null
  },

  "equipes": [
    {
      "cod": "EQ-OBR-01",
      "nome": "A definir | Nome real do fornecedor",
      "funcao": "[Especialidade: Obra Civil, Elétrica, Hidráulica, etc]",
      "telefone": null,
      "email": null,
      "pix": null,
      "contato": null,
      "status": "ativo",
      "ativo": true,
      "aliases": ["termo1", "termo2"]
    }
  ],

  "servicos": [
    {
      "codigo_servico": "1.1",
      "categoria": "[Categoria da etapa construtiva]",
      "descricao": "[Descrição clara do serviço]",
      "unidade": "m2 | m | un | m3 | kg | vb",
      "quantidade": 0,
      "composicao": {
        "mat_unit": 0,
        "mo_unit": 0,
        "total_unit": 0,
        "codigo_referencia": null,
        "origem": "Catálogo EVIS | SINAPI direto | SINAPI derivado | Cotação real | Composição própria",
        "origem_detalhe": null,
        "competencia": "MM/AAAA",
        "confianca": "Alta | Média | Baixa"
      },
      "valor_unitario_direto": 0,
      "valor_total_direto": 0,
      "valor_unitario_com_bdi": 0,
      "valor_total_com_bdi": 0,
      "equipe": "EQ-OBR-01",
      "aliases": ["alias1", "alias2"],
      "data_inicio": "AAAA-MM-DD",
      "data_fim": "AAAA-MM-DD",
      "duracao_dias": 0,
      "percentual_fisico": 0,
      "status": "nao_iniciado"
    }
  ],

  "cronograma_financeiro": [
    {
      "periodo": "AAAA-MM",
      "percentual_fisico": 0,
      "percentual_desembolso": 0,
      "desembolso_mes": 0,
      "desembolso_acumulado": 0,
      "servicos": ["1.1", "1.2"]
    }
  ]
}
```

**Regras de nomenclatura — nunca usar variantes:**

| Campo canônico | Variantes proibidas |
|---|---|
| `_meta` | `metadados`, `metadata`, `meta` |
| `equipes[].cod` | `id`, `equipe_id`, `equipe_cod` |
| `servicos[].descricao` | `nome`, `description` |
| `servicos[].equipe` | `equipe_id`, `equipe_cod`, `equipe_responsavel` |
| `servicos[].data_inicio` | `data_prevista`, `inicio` |
| `servicos[].data_fim` | `data_conclusao`, `fim` |
| `servicos[].composicao.mat_unit` | `custo_material`, `material` |
| `servicos[].composicao.mo_unit` | `custo_mao_obra`, `mao_de_obra` |

---

## ✅ Validações de Schema

### **Validações Obrigatórias:**

#### **Obra:**
- [ ] `id` único e bem formatado
- [ ] `nome` não-vazio
- [ ] `endereco` completo
- [ ] `data_inicio_prevista` < `data_fim_prevista`
- [ ] `valor_total_com_bdi` = `valor_custos_diretos` × (1 + `bdi_percentual`/100)
- [ ] `status` = "Planejada"

#### **Serviços:**
- [ ] Todos têm `codigo_servico` único no formato `N.M`
- [ ] `descricao` não vazio
- [ ] `quantidade` > 0
- [ ] `unidade` válida
- [ ] `valor_total_direto` = `quantidade` × `valor_unitario_direto`
- [ ] `valor_total_com_bdi` = `valor_total_direto` × (1 + BDI/100)
- [ ] `composicao.total_unit` = `composicao.mat_unit` + `composicao.mo_unit`
- [ ] `equipe` presente (pode ser `null` ou `"a-definir"`)
- [ ] `data_inicio` e `data_fim` presentes
- [ ] `percentual_fisico` > 0

#### **Equipes:**
- [ ] Array presente (pode estar parcialmente preenchido)
- [ ] Cada equipe tem `cod` no formato `EQ-XXX-00`
- [ ] `funcao` não vazio
- [ ] `aliases` presente (pode ser array vazio)

#### **Cronograma Financeiro:**
- [ ] Soma dos `percentual_fisico` = 100
- [ ] Soma dos `desembolso_mes` = `obra.valor_total_com_bdi`
- [ ] `desembolso_acumulado` cresce progressivamente

#### **BDI:**
- [ ] `bdi_detalhamento.total_pct` = `obra.bdi_percentual`
- [ ] `bdi_detalhamento.total_valor` = `obra.bdi_valor`

---

## 🔍 Validação de Coerência

### **Verificações Cruzadas:**

```javascript
// 1. Soma dos serviços = Custos diretos
soma(servicos.valor_total_direto) === obra.valor_custos_diretos

// 2. Cronograma de serviços dentro do prazo da obra
min(servicos.data_inicio) >= obra.data_inicio_prevista
max(servicos.data_fim) <= obra.data_fim_prevista

// 3. Todos serviços têm equipe ou "a-definir"
servicos.every(s => s.equipe === null || s.equipe === "a-definir" || s.equipe.startsWith("EQ-"))

// 4. Percentual físico soma 100%
soma(servicos.percentual_fisico) === 100

// 5. Desembolso total
soma(cronograma_financeiro.desembolso_mes) === obra.valor_total_com_bdi

// 6. BDI consistente
obra.bdi_valor === obra.valor_total_com_bdi - obra.valor_custos_diretos
bdi_detalhamento.total_pct === obra.bdi_percentual
```

Se alguma validação falhar:
```markdown
⚠️ **Erro de validação detectado**

[Descrição do erro]

**Causa possível:** [explicação]

**Ação:** Revisar [etapa específica] antes de exportar.
```

---

## 📁 Geração do Arquivo

### **Formato:**

- **Nome:** `orcamento_[nome-obra]_[AAAAMMDD].json`
- **Encoding:** UTF-8
- **Formatação:** JSON pretty-print (indentado)

### **Exemplo de nome:**
```
orcamento_reforma-casa-silva_20260416.json
```

---

## 🎯 Entrega ao Usuário

### **Mensagem Final:**

```markdown
## ✅ ORÇAMENTO GERADO COM SUCESSO

### Arquivo Exportado

**Nome:** `[nome do arquivo]`  
**Tamanho:** [X] KB  
**Status:** ✅ Validado

---

### Resumo do Orçamento

| Item | Valor |
|------|-------|
| Serviços | [qtd] itens |
| Valor Total | R$ [total] |
| Prazo | [dias] dias úteis |
| Equipes | [qtd definidas] + [qtd a definir] |

---

### Próximos Passos

1. **Retornar à HUB** (`hub.html`)
   - Ponto de retorno padrão após qualquer entrega
   - Selecionar próxima ação pelo painel central

2. **Gerar Proposta Comercial** (via HUB → Evis Proposta)
   - Apresentar ao cliente com base no JSON aprovado
   - Obter aprovação ou ajustar

3. **Importar no EVIS Obra** (via HUB → Evis Obra)
   - Gestor define equipes restantes ("a-definir")
   - Iniciar execução da obra

---

### Dados para Importação

**Sistema destino:** EVIS Obra (Supabase)  
**Schema compatível:** ✅ Validado  
**Pronto para importar:** ✅ Sim

---

📥 **Arquivo disponível para download**
```

---

## 🔧 Casos Especiais

### **Orçamento Muito Grande:**

Se JSON > 5MB:
```markdown
⚠️ **Orçamento volumoso**

Tamanho: [X] MB

**Recomendação:**
1. Dividir em múltiplos arquivos (por etapa)
2. Ou comprimir (ZIP) antes de enviar

Prefere divisão ou compressão?
```

### **Informações Incompletas:**

Se algum campo obrigatório estiver faltando:
```markdown
❌ **Exportação bloqueada - Informações faltantes**

**Faltam:**
- [ ] Cliente (campo vazio)
- [ ] Data de início (não informada)
- [ ] Equipe EQ-003 sem composição

**Ação:** Completar informações antes de exportar.
```

---

## 📚 Referências

### **Schema Completo:**

Ver: `docs/SCHEMA_JSON_EVIS.md` - Documentação completa do schema

### **Exemplos:**

Ver: `exemplos/exemplo-executivo.md` - JSON completo de referência

---

## ✅ Critérios de Sucesso

**Exportação válida quando:**
- ✅ Resumo executivo apresentado (TABELAS)
- ✅ JSON gerado e validado
- ✅ Schema compliance OK
- ✅ Todas as validações passaram
- ✅ Arquivo pronto para importar no EVIS

---

**FIM DA SKILL EXPORTAÇÃO JSON**
