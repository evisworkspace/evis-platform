# Exemplo: Orçamento por Estimativa

> **LEGADO — Schema v2.0.** Campos obsoletos: `equipe_id` → usar `equipe`; `metadados` → usar `_meta`; `data_prevista`/`data_conclusao` → usar `data_inicio`/`data_fim`. Schema canônico: `skills/SKILL_JSON_EXPORT.md`.

> **Cenário:** Projeto incompleto (apenas planta arquitetônica básica)  
> **Abordagem:** Estimativa com padrões SINAPI  
> **Tipo:** Reforma residencial

---

## 📄 Entrada do Cliente

```text
REFORMA CASA - CLIENTE: MARIA SOUZA
Endereço: Rua das Palmeiras, 456 - Curitiba/PR

Documentação disponível:
- Planta baixa básica (sem complementares)
- Área total: 85m²
- Pé-direito: 2,80m

Ambientes identificados:
- Sala: 30m²
- Cozinha: 15m²
- 2 Quartos: 12m² cada
- 1 Banheiro: 6m²
- Área externa: 10m²

Materiais (conforme nota na planta):
- Piso: cerâmica 45×45 (áreas molhadas), laminado (quartos/sala)
- Paredes: alvenaria, reboco, pintura
- Teto: laje existente, pintura

Projeto não inclui:
- Elétrico detalhado
- Hidráulico detalhado
- Estrutural
```

---

## 💬 Conversa com IA (Resumida)

```text
IA: Identifiquei o projeto. Não há complementares (elétrico/hidráulico).
    Posso estimar instalações usando padrões SINAPI por m² e tipo de ambiente.
    
Usuário: Pode estimar. Cliente quer orçamento rápido para aprovar.

IA: Vou usar:
    - Instalações elétricas: 1 ponto luz/ambiente + tomadas padrão residencial
    - Instalações hidráulicas: pontos típicos (cozinha: 2, banheiro: 3)
    - Valores SINAPI como referência

[Processo iterativo com validação HITL a cada etapa...]

IA: Orçamento completo. BDI: preciso que defina os percentuais.

Usuário: Regime Simples Nacional, alíquota 8%.
         Usar percentuais de referência para demais itens.

IA: Cronograma: 45 dias úteis estimados. Confirma?

Usuário: Confirmo. Pode gerar JSON final.
```

---

## 📊 JSON Gerado (Completo)

```json
{
  "obra": {
    "id": "obra-reforma-casa-souza-2026",
    "nome": "Reforma Residencial - Casa Maria Souza",
    "endereco": "Rua das Palmeiras, 456 - Curitiba/PR",
    "cliente": "Maria Souza",
    "tipo_obra": "Reforma",
    "area_total": 85,
    "data_inicio_prevista": "2026-05-15",
    "data_fim_prevista": "2026-07-10",
    "prazo_dias_uteis": 45,
    "valor_custos_diretos": 28450.00,
    "bdi_percentual": 18.57,
    "bdi_valor": 5283.00,
    "valor_total_com_bdi": 33733.00,
    "status": "Planejada",
    "regime_tributario": "Simples Nacional",
    "observacoes": "Orçamento por estimativa - complementares não disponíveis"
  },
  
  "bdi_detalhamento": {
    "administracao": 4.0,
    "seguro": 0.8,
    "risco": 1.27,
    "despesas_financeiras": 1.3,
    "lucro": 7.4,
    "impostos": 3.8,
    "total": 18.57
  },
  
  "servicos": [
    {
      "codigo_servico": "1.1",
      "obra_id": "obra-reforma-casa-souza-2026",
      "categoria": "Demolição",
      "descricao": "Demolição de piso cerâmico",
      "unidade": "m²",
      "quantidade": 85.00,
      
      "composicao": {
        "sinapi_codigo": "97631",
        "sinapi_descricao": "Demolição de piso cerâmico, manual",
        
        "insumos": [
          {
            "descricao": "Caçamba 5m³",
            "unidade": "un",
            "quantidade": 3,
            "valor_unitario": 250.00,
            "valor_total": 750.00
          }
        ],
        
        "mao_de_obra": [
          {
            "funcao": "Servente",
            "horas": 20,
            "valor_hora": 18.50,
            "valor_total": 370.00
          }
        ],
        
        "equipamentos": []
      },
      
      "valor_unitario_direto": 13.18,
      "valor_total_direto": 1120.00,
      "valor_unitario_com_bdi": 15.63,
      "valor_total_com_bdi": 1328.00,
      
      "cronograma": {
        "data_inicio": "2026-05-15",
        "data_fim": "2026-05-18",
        "duracao_dias": 3,
        "percentual_fisico": 4.0,
        "desembolso_previsto": 1328.00
      },
      
      "equipe_id": "EQ-001",
      "status": "Planejado",
      "observacoes": null
    },
    
    {
      "codigo_servico": "1.2",
      "obra_id": "obra-reforma-casa-souza-2026",
      "categoria": "Alvenaria",
      "descricao": "Alvenaria de vedação - bloco cerâmico 9×19×19",
      "unidade": "m²",
      "quantidade": 120.00,
      
      "composicao": {
        "sinapi_codigo": "87492",
        "sinapi_descricao": "Alvenaria de vedação de bloco cerâmico",
        
        "insumos": [
          {
            "descricao": "Bloco cerâmico 9×19×19",
            "unidade": "un",
            "quantidade": 3000,
            "valor_unitario": 1.20,
            "valor_total": 3600.00
          },
          {
            "descricao": "Argamassa AC-II",
            "unidade": "kg",
            "quantidade": 1200,
            "valor_unitario": 0.45,
            "valor_total": 540.00
          }
        ],
        
        "mao_de_obra": [
          {
            "funcao": "Pedreiro",
            "horas": 60,
            "valor_hora": 28.00,
            "valor_total": 1680.00
          },
          {
            "funcao": "Servente",
            "horas": 60,
            "valor_hora": 18.50,
            "valor_total": 1110.00
          }
        ],
        
        "equipamentos": [
          {
            "descricao": "Betoneira 400L",
            "unidade": "hora",
            "quantidade": 12,
            "valor_unitario": 12.00,
            "valor_total": 144.00
          }
        ]
      },
      
      "valor_unitario_direto": 58.95,
      "valor_total_direto": 7074.00,
      "valor_unitario_com_bdi": 69.89,
      "valor_total_com_bdi": 8387.00,
      
      "cronograma": {
        "data_inicio": "2026-05-19",
        "data_fim": "2026-05-30",
        "duracao_dias": 10,
        "percentual_fisico": 25.0,
        "desembolso_previsto": 8387.00
      },
      
      "equipe_id": "EQ-001",
      "status": "Planejado",
      "observacoes": null
    },
    
    {
      "codigo_servico": "1.3",
      "obra_id": "obra-reforma-casa-souza-2026",
      "categoria": "Elétrica",
      "descricao": "Instalação elétrica completa (estimativa)",
      "unidade": "un",
      "quantidade": 1,
      
      "composicao": {
        "sinapi_codigo": null,
        "sinapi_descricao": null,
        
        "insumos": [
          {
            "descricao": "Kit elétrico completo (estimativa por m²)",
            "unidade": "m²",
            "quantidade": 85,
            "valor_unitario": 45.00,
            "valor_total": 3825.00
          }
        ],
        
        "mao_de_obra": [
          {
            "funcao": "Eletricista",
            "horas": 60,
            "valor_hora": 32.00,
            "valor_total": 1920.00
          }
        ],
        
        "equipamentos": []
      },
      
      "valor_unitario_direto": 5745.00,
      "valor_total_direto": 5745.00,
      "valor_unitario_com_bdi": 6812.00,
      "valor_total_com_bdi": 6812.00,
      
      "cronograma": {
        "data_inicio": "2026-06-02",
        "data_fim": "2026-06-12",
        "duracao_dias": 9,
        "percentual_fisico": 20.0,
        "desembolso_previsto": 6812.00
      },
      
      "equipe_id": "a-definir",
      "status": "Planejado",
      "observacoes": "Estimativa - projeto elétrico não disponível. Inclui: 6 pontos luz, 15 tomadas, quadro distribuição 10 circuitos"
    },
    
    {
      "codigo_servico": "1.4",
      "obra_id": "obra-reforma-casa-souza-2026",
      "categoria": "Hidráulica",
      "descricao": "Instalação hidráulica completa (estimativa)",
      "unidade": "un",
      "quantidade": 1,
      
      "composicao": {
        "sinapi_codigo": null,
        "sinapi_descricao": null,
        
        "insumos": [
          {
            "descricao": "Kit hidráulico completo (estimativa)",
            "unidade": "m²",
            "quantidade": 85,
            "valor_unitario": 38.00,
            "valor_total": 3230.00
          }
        ],
        
        "mao_de_obra": [
          {
            "funcao": "Encanador",
            "horas": 50,
            "valor_hora": 30.00,
            "valor_total": 1500.00
          }
        ],
        
        "equipamentos": []
      },
      
      "valor_unitario_direto": 4730.00,
      "valor_total_direto": 4730.00,
      "valor_unitario_com_bdi": 5608.00,
      "valor_total_com_bdi": 5608.00,
      
      "cronograma": {
        "data_inicio": "2026-06-02",
        "data_fim": "2026-06-11",
        "duracao_dias": 8,
        "percentual_fisico": 17.0,
        "desembolso_previsto": 5608.00
      },
      
      "equipe_id": "a-definir",
      "status": "Planejado",
      "observacoes": "Estimativa - projeto hidráulico não disponível. Inclui: 5 pontos água, 4 pontos esgoto"
    },
    
    {
      "codigo_servico": "1.5",
      "obra_id": "obra-reforma-casa-souza-2026",
      "categoria": "Revestimento",
      "descricao": "Reboco interno",
      "unidade": "m²",
      "quantidade": 120.00,
      
      "composicao": {
        "sinapi_codigo": "87879",
        "sinapi_descricao": "Reboco interno, espessura 2cm",
        
        "insumos": [
          {
            "descricao": "Argamassa para reboco",
            "unidade": "kg",
            "quantidade": 3600,
            "valor_unitario": 0.38,
            "valor_total": 1368.00
          }
        ],
        
        "mao_de_obra": [
          {
            "funcao": "Pedreiro",
            "horas": 48,
            "valor_hora": 28.00,
            "valor_total": 1344.00
          },
          {
            "funcao": "Servente",
            "horas": 48,
            "valor_hora": 18.50,
            "valor_total": 888.00
          }
        ],
        
        "equipamentos": []
      },
      
      "valor_unitario_direto": 30.00,
      "valor_total_direto": 3600.00,
      "valor_unitario_com_bdi": 35.57,
      "valor_total_com_bdi": 4268.00,
      
      "cronograma": {
        "data_inicio": "2026-06-13",
        "data_fim": "2026-06-20",
        "duracao_dias": 6,
        "percentual_fisico": 13.0,
        "desembolso_previsto": 4268.00
      },
      
      "equipe_id": "EQ-001",
      "status": "Planejado",
      "observacoes": null
    },
    
    {
      "codigo_servico": "2.1",
      "obra_id": "obra-reforma-casa-souza-2026",
      "categoria": "Pintura",
      "descricao": "Pintura látex acrílico",
      "unidade": "m²",
      "quantidade": 240.00,
      
      "composicao": {
        "sinapi_codigo": "88486",
        "sinapi_descricao": "Pintura látex acrílico, 2 demãos",
        
        "insumos": [
          {
            "descricao": "Tinta látex",
            "unidade": "L",
            "quantidade": 72,
            "valor_unitario": 45.00,
            "valor_total": 3240.00
          }
        ],
        
        "mao_de_obra": [
          {
            "funcao": "Pintor",
            "horas": 36,
            "valor_hora": 22.00,
            "valor_total": 792.00
          }
        ],
        
        "equipamentos": []
      },
      
      "valor_unitario_direto": 16.80,
      "valor_total_direto": 4032.00,
      "valor_unitario_com_bdi": 19.92,
      "valor_total_com_bdi": 4781.00,
      
      "cronograma": {
        "data_inicio": "2026-06-23",
        "data_fim": "2026-06-30",
        "duracao_dias": 6,
        "percentual_fisico": 14.0,
        "desembolso_previsto": 4781.00
      },
      
      "equipe_id": "a-definir",
      "status": "Planejado",
      "observacoes": null
    },
    
    {
      "codigo_servico": "2.2",
      "obra_id": "obra-reforma-casa-souza-2026",
      "categoria": "Piso",
      "descricao": "Piso cerâmico 45×45 (áreas molhadas)",
      "unidade": "m²",
      "quantidade": 23.10,
      
      "composicao": {
        "sinapi_codigo": "87260",
        "sinapi_descricao": "Revestimento cerâmico para piso",
        
        "insumos": [
          {
            "descricao": "Cerâmica 45×45",
            "unidade": "m²",
            "quantidade": 23.10,
            "valor_unitario": 35.00,
            "valor_total": 808.50
          },
          {
            "descricao": "Argamassa colante",
            "unidade": "kg",
            "quantidade": 115,
            "valor_unitario": 0.85,
            "valor_total": 97.75
          },
          {
            "descricao": "Rejunte",
            "unidade": "kg",
            "quantidade": 4.62,
            "valor_unitario": 18.00,
            "valor_total": 83.16
          }
        ],
        
        "mao_de_obra": [
          {
            "funcao": "Pedreiro",
            "horas": 12,
            "valor_hora": 28.00,
            "valor_total": 336.00
          },
          {
            "funcao": "Servente",
            "horas": 12,
            "valor_hora": 18.50,
            "valor_total": 222.00
          }
        ],
        
        "equipamentos": []
      },
      
      "valor_unitario_direto": 67.00,
      "valor_total_direto": 1547.41,
      "valor_unitario_com_bdi": 79.44,
      "valor_total_com_bdi": 1834.00,
      
      "cronograma": {
        "data_inicio": "2026-07-01",
        "data_fim": "2026-07-05",
        "duracao_dias": 4,
        "percentual_fisico": 5.0,
        "desembolso_previsto": 1834.00
      },
      
      "equipe_id": "EQ-001",
      "status": "Planejado",
      "observacoes": "Cozinha + banheiro"
    },
    
    {
      "codigo_servico": "2.3",
      "obra_id": "obra-reforma-casa-souza-2026",
      "categoria": "Piso",
      "descricao": "Piso laminado (sala + quartos)",
      "unidade": "m²",
      "quantidade": 60.90,
      
      "composicao": {
        "sinapi_codigo": null,
        "sinapi_descricao": null,
        
        "insumos": [
          {
            "descricao": "Piso laminado eucafloor",
            "unidade": "m²",
            "quantidade": 60.90,
            "valor_unitario": 65.00,
            "valor_total": 3958.50
          },
          {
            "descricao": "Manta isolante",
            "unidade": "m²",
            "quantidade": 60.90,
            "valor_unitario": 8.00,
            "valor_total": 487.20
          }
        ],
        
        "mao_de_obra": [
          {
            "funcao": "Instalador",
            "horas": 20,
            "valor_hora": 25.00,
            "valor_total": 500.00
          }
        ],
        
        "equipamentos": []
      },
      
      "valor_unitario_direto": 81.20,
      "valor_total_direto": 4945.70,
      "valor_unitario_com_bdi": 96.28,
      "valor_total_com_bdi": 5863.00,
      
      "cronograma": {
        "data_inicio": "2026-07-06",
        "data_fim": "2026-07-09",
        "duracao_dias": 3,
        "percentual_fisico": 2.0,
        "desembolso_previsto": 5863.00
      },
      
      "equipe_id": "a-definir",
      "status": "Planejado",
      "observacoes": null
    }
  ],
  
  "equipes": [
    {
      "id": "EQ-001",
      "nome": "Construtora Boa Obra",
      "tipo": "Obra Civil",
      "status": "Definida",
      
      "composicao": [
        {
          "funcao": "Pedreiro",
          "quantidade": 2,
          "valor_hora": 28.00
        },
        {
          "funcao": "Servente",
          "quantidade": 2,
          "valor_hora": 18.50
        }
      ],
      
      "servicos_atribuidos": ["1.1", "1.2", "1.5", "2.2"],
      "observacoes": null
    },
    {
      "id": "EQ-002",
      "nome": "A definir - Elétrica",
      "tipo": "Elétrica",
      "status": "A definir",
      
      "composicao": [],
      
      "servicos_atribuidos": ["1.3"],
      "observacoes": "Equipe será definida após aprovação do orçamento"
    },
    {
      "id": "EQ-003",
      "nome": "A definir - Hidráulica",
      "tipo": "Hidráulica",
      "status": "A definir",
      
      "composicao": [],
      
      "servicos_atribuidos": ["1.4"],
      "observacoes": "Equipe será definida após aprovação do orçamento"
    },
    {
      "id": "EQ-004",
      "nome": "A definir - Pintura",
      "tipo": "Pintura",
      "status": "A definir",
      
      "composicao": [],
      
      "servicos_atribuidos": ["2.1"],
      "observacoes": "Equipe será definida após aprovação do orçamento"
    },
    {
      "id": "EQ-005",
      "nome": "A definir - Pisos",
      "tipo": "Pisos",
      "status": "A definir",
      
      "composicao": [],
      
      "servicos_atribuidos": ["2.3"],
      "observacoes": "Equipe será definida após aprovação do orçamento"
    }
  ],
  
  "cronograma_financeiro": [
    {
      "periodo": "2026-05",
      "mes_ano": "Mai/2026",
      "percentual_fisico": 29,
      "percentual_desembolso": 29.0,
      "desembolso_mes": 9715.00,
      "desembolso_acumulado": 9715.00,
      "servicos_executados": ["1.1", "1.2"]
    },
    {
      "periodo": "2026-06",
      "mes_ano": "Jun/2026",
      "percentual_fisico": 64,
      "percentual_desembolso": 51.0,
      "desembolso_mes": 17069.00,
      "desembolso_acumulado": 26784.00,
      "servicos_executados": ["1.3", "1.4", "1.5"]
    },
    {
      "periodo": "2026-07",
      "mes_ano": "Jul/2026",
      "percentual_fisico": 100,
      "percentual_desembolso": 20.0,
      "desembolso_mes": 6949.00,
      "desembolso_acumulado": 33733.00,
      "servicos_executados": ["2.1", "2.2", "2.3"]
    }
  ],
  
  "aliases": [
    {
      "alias": "reforma casa souza",
      "tipo": "obra",
      "referencia_id": "obra-reforma-casa-souza-2026"
    },
    {
      "alias": "demolição",
      "tipo": "servico",
      "referencia_id": "1.1"
    },
    {
      "alias": "elétrica",
      "tipo": "servico",
      "referencia_id": "1.3"
    }
  ],
  
  "metadados": {
    "versao_schema": "2.0",
    "data_geracao": "2026-04-16T19:00:00Z",
    "gerado_por": "Evis Orçamentos",
    "sistema_destino": "EVIS Obra",
    "status_validacao": "validado",
    "observacoes": "Orçamento por estimativa - complementares não disponíveis. Instalações estimadas por padrões SINAPI"
  }
}
```

---

## ✅ Características deste Exemplo

### **1. Projeto Incompleto**
- Apenas planta arquitetônica básica
- Sem projetos complementares (elétrico/hidráulico)

### **2. Abordagem por Estimativa**
- Instalações estimadas por m² (padrão SINAPI)
- Composições simplificadas onde não há SINAPI
- Documentado em "observacoes"

### **3. SINAPI como Referência**
- Usado quando disponível (demolição, alvenaria, reboco, pintura, piso cerâmico)
- Estimativa própria quando não disponível (elétrica, hidráulica, laminado)

### **4. BDI Definido pelo Usuário**
- Sistema apresentou referências
- Usuário definiu regime tributário (Simples 8%)
- Usuário confirmou demais percentuais

### **5. Equipes Flexíveis**
- 1 equipe definida (Construtora Boa Obra)
- 4 equipes "a-definir" (serão contratadas depois)

### **6. Cronograma Simplificado**
- 45 dias úteis
- 3 meses de desembolso
- Curva típica (início 29%, meio 51%, fim 20%)

---

## 📊 Resumo Executivo

| Item | Valor |
|------|-------|
| **Serviços** | 8 itens |
| **Custos Diretos** | R$ 28.450,00 |
| **BDI (18,57%)** | R$ 5.283,00 |
| **VALOR TOTAL** | **R$ 33.733,00** |
| **Prazo** | 45 dias úteis |
| **Equipes Definidas** | 1 de 5 |
| **Equipes A Definir** | 4 de 5 |

---

**Exemplo de orçamento por estimativa — EVIS Orçamentos**
