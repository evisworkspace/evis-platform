# Exemplo: Orçamento Executivo Completo

> **LEGADO — Schema v2.0.** Campos obsoletos: `equipe_id` → usar `equipe`; `metadados` → usar `_meta`; `data_prevista`/`data_conclusao` → usar `data_inicio`/`data_fim`. Schema canônico: `skills/SKILL_JSON_EXPORT.md`.

> **Cenário:** Projeto completo (arquitetônico + complementares)  
> **Abordagem:** Orçamento executivo com quantitativos precisos  
> **Tipo:** Ampliação residencial

---

## 📄 Entrada do Cliente

```text
AMPLIAÇÃO RESIDENCIAL - CLIENTE: PEDRO COSTA
Endereço: Rua dos Pinheiros, 789 - Curitiba/PR

Documentação completa:
✅ Projeto arquitetônico (planta + cortes + fachadas)
✅ Projeto estrutural (formas de laje, detalhamento)
✅ Projeto elétrico (pontos, circuitos, quadro)
✅ Projeto hidráulico (pontos água e esgoto)
✅ Memorial descritivo completo

Área da ampliação: 50m² (novo pavimento)

Ambientes:
- Suíte master: 20m²
- Closet: 8m²
- Banheiro suíte: 6m²
- Varanda: 16m²

Materiais especificados:
- Piso: porcelanato 60×60 (suíte + closet), deck madeira (varanda)
- Paredes: alvenaria estrutural, reboco, pintura latex premium
- Teto: forro gesso acartonado com sancas
- Esquadrias: alumínio bronze com vidro temperado
- Metais: Deca linha premium
- Iluminação: spots LED embutidos + fita LED sancas
```

---

## 💬 Conversa com IA (Resumida)

```text
IA: Projeto completo identificado. Posso fazer orçamento executivo com valores SINAPI precisos.

Usuário: Perfeito. Cliente quer orçamento detalhado para aprovação bancária.

[Etapa 0: Análise completa dos projetos - VALIDADO]

IA: Quantitativos calculados. 22 serviços identificados.
    [Tabela de quantitativos apresentada]

Usuário: Correto. Prossiga com composição de custos.

[Etapa 1: Quantitativos + Composição - VALIDADO]

IA: Composições montadas. Tenho fornecedor negociado para:
    - Porcelanato: R$ 95/m² (SINAPI: R$ 120/m²)
    - Deck: R$ 180/m² (SINAPI não tem)

Usuário: Confirmo valores negociados. Prossiga com BDI.

[Etapa 2: BDI - USUÁRIO DEFINE]

IA: Preciso dos percentuais de BDI.

Usuário: Regime Lucro Presumido.
         Impostos: 15,5%
         Lucro: 10% (obra de alto padrão)
         Demais itens: usar referência

[Etapa 3: Cronograma - VALIDADO]

IA: Cronograma: 85 dias úteis (4 meses).

Usuário: Cliente pediu 70 dias. É viável?

IA: Possível com 2 equipes simultâneas (estrutura + instalações).
    Custo adicional: +8% (R$ 5.200)

Usuário: Cliente aprovou. Ajuste o cronograma.

[Etapa Final: JSON gerado]
```

---

## 📊 JSON Gerado (Completo)

```json
{
  "obra": {
    "id": "obra-ampliacao-costa-2026",
    "nome": "Ampliação Residencial - Casa Pedro Costa",
    "endereco": "Rua dos Pinheiros, 789 - Curitiba/PR",
    "cliente": "Pedro Costa",
    "tipo_obra": "Ampliação",
    "area_total": 50,
    "data_inicio_prevista": "2026-04-20",
    "data_fim_prevista": "2026-07-20",
    "prazo_dias_uteis": 70,
    "valor_custos_diretos": 68500.00,
    "bdi_percentual": 25.07,
    "bdi_valor": 17173.00,
    "valor_total_com_bdi": 85673.00,
    "status": "Planejada",
    "regime_tributario": "Lucro Presumido",
    "observacoes": "Prazo acelerado (70 dias) com equipes simultâneas. Acabamento alto padrão."
  },
  
  "bdi_detalhamento": {
    "administracao": 4.0,
    "seguro": 0.8,
    "risco": 1.27,
    "despesas_financeiras": 1.5,
    "lucro": 10.0,
    "impostos": 15.5,
    "total": 33.07
  },
  
  "servicos": [
    {
      "codigo_servico": "1.1",
      "obra_id": "obra-ampliacao-costa-2026",
      "categoria": "Fundação",
      "descricao": "Escavação manual de valas",
      "unidade": "m³",
      "quantidade": 12.50,
      
      "composicao": {
        "sinapi_codigo": "93358",
        "sinapi_descricao": "Escavação manual de valas",
        
        "insumos": [],
        
        "mao_de_obra": [
          {
            "funcao": "Servente",
            "horas": 50,
            "valor_hora": 18.50,
            "valor_total": 925.00
          }
        ],
        
        "equipamentos": []
      },
      
      "valor_unitario_direto": 74.00,
      "valor_total_direto": 925.00,
      "valor_unitario_com_bdi": 92.76,
      "valor_total_com_bdi": 1159.50,
      
      "cronograma": {
        "data_inicio": "2026-04-20",
        "data_fim": "2026-04-23",
        "duracao_dias": 3,
        "percentual_fisico": 1.4,
        "desembolso_previsto": 1159.50
      },
      
      "equipe_id": "EQ-001",
      "status": "Planejado",
      "observacoes": null
    },
    
    {
      "codigo_servico": "1.2",
      "obra_id": "obra-ampliacao-costa-2026",
      "categoria": "Fundação",
      "descricao": "Concreto fck 25MPa para fundação",
      "unidade": "m³",
      "quantidade": 8.00,
      
      "composicao": {
        "sinapi_codigo": "92261",
        "sinapi_descricao": "Concreto fck 25MPa, lançamento manual",
        
        "insumos": [
          {
            "descricao": "Concreto usinado fck 25MPa",
            "unidade": "m³",
            "quantidade": 8.00,
            "valor_unitario": 420.00,
            "valor_total": 3360.00
          },
          {
            "descricao": "Aço CA-50 (armadura)",
            "unidade": "kg",
            "quantidade": 640,
            "valor_unitario": 6.80,
            "valor_total": 4352.00
          }
        ],
        
        "mao_de_obra": [
          {
            "funcao": "Pedreiro",
            "horas": 24,
            "valor_hora": 28.00,
            "valor_total": 672.00
          },
          {
            "funcao": "Servente",
            "horas": 24,
            "valor_hora": 18.50,
            "valor_total": 444.00
          }
        ],
        
        "equipamentos": [
          {
            "descricao": "Betoneira 400L",
            "unidade": "hora",
            "quantidade": 8,
            "valor_unitario": 12.00,
            "valor_total": 96.00
          }
        ]
      },
      
      "valor_unitario_direto": 1115.50,
      "valor_total_direto": 8924.00,
      "valor_unitario_com_bdi": 1398.50,
      "valor_total_com_bdi": 11188.00,
      
      "cronograma": {
        "data_inicio": "2026-04-24",
        "data_fim": "2026-04-28",
        "duracao_dias": 4,
        "percentual_fisico": 13.0,
        "desembolso_previsto": 11188.00
      },
      
      "equipe_id": "EQ-001",
      "status": "Planejado",
      "observacoes": "Aguardar 7 dias de cura antes de carregar"
    },
    
    {
      "codigo_servico": "1.3",
      "obra_id": "obra-ampliacao-costa-2026",
      "categoria": "Estrutura",
      "descricao": "Laje pré-moldada treliçada h=12cm",
      "unidade": "m²",
      "quantidade": 50.00,
      
      "composicao": {
        "sinapi_codigo": "92551",
        "sinapi_descricao": "Laje pré-moldada treliçada, h=12cm",
        
        "insumos": [
          {
            "descricao": "Laje pré-moldada treliçada",
            "unidade": "m²",
            "quantidade": 50.00,
            "valor_unitario": 85.00,
            "valor_total": 4250.00
          },
          {
            "descricao": "Concreto capeamento fck 25MPa",
            "unidade": "m³",
            "quantidade": 3.00,
            "valor_unitario": 420.00,
            "valor_total": 1260.00
          }
        ],
        
        "mao_de_obra": [
          {
            "funcao": "Pedreiro",
            "horas": 40,
            "valor_hora": 28.00,
            "valor_total": 1120.00
          },
          {
            "funcao": "Servente",
            "horas": 40,
            "valor_hora": 18.50,
            "valor_total": 740.00
          }
        ],
        
        "equipamentos": [
          {
            "descricao": "Guindaste (locação)",
            "unidade": "hora",
            "quantidade": 4,
            "valor_unitario": 180.00,
            "valor_total": 720.00
          }
        ]
      },
      
      "valor_unitario_direto": 162.60,
      "valor_total_direto": 8130.00,
      "valor_unitario_com_bdi": 203.86,
      "valor_total_com_bdi": 10193.00,
      
      "cronograma": {
        "data_inicio": "2026-05-05",
        "data_fim": "2026-05-10",
        "duracao_dias": 5,
        "percentual_fisico": 12.0,
        "desembolso_previsto": 10193.00
      },
      
      "equipe_id": "EQ-001",
      "status": "Planejado",
      "observacoes": "Aguardar cura fundação (7 dias). Laje aguardar 7 dias antes de carregar"
    },
    
    {
      "codigo_servico": "1.4",
      "obra_id": "obra-ampliacao-costa-2026",
      "categoria": "Alvenaria",
      "descricao": "Alvenaria estrutural - bloco 14×19×29",
      "unidade": "m²",
      "quantidade": 95.00,
      
      "composicao": {
        "sinapi_codigo": "87540",
        "sinapi_descricao": "Alvenaria estrutural, bloco cerâmico 14×19×29",
        
        "insumos": [
          {
            "descricao": "Bloco cerâmico estrutural 14×19×29",
            "unidade": "un",
            "quantidade": 2375,
            "valor_unitario": 2.80,
            "valor_total": 6650.00
          },
          {
            "descricao": "Argamassa estrutural",
            "unidade": "kg",
            "quantidade": 950,
            "valor_unitario": 0.85,
            "valor_total": 807.50
          },
          {
            "descricao": "Graute estrutural",
            "unidade": "m³",
            "quantidade": 0.95,
            "valor_unitario": 520.00,
            "valor_total": 494.00
          }
        ],
        
        "mao_de_obra": [
          {
            "funcao": "Pedreiro especializado",
            "horas": 76,
            "valor_hora": 32.00,
            "valor_total": 2432.00
          },
          {
            "funcao": "Servente",
            "horas": 76,
            "valor_hora": 18.50,
            "valor_total": 1406.00
          }
        ],
        
        "equipamentos": [
          {
            "descricao": "Betoneira 400L",
            "unidade": "hora",
            "quantidade": 15,
            "valor_unitario": 12.00,
            "valor_total": 180.00
          }
        ]
      },
      
      "valor_unitario_direto": 125.70,
      "valor_total_direto": 11941.50,
      "valor_unitario_com_bdi": 157.64,
      "valor_total_com_bdi": 14976.00,
      
      "cronograma": {
        "data_inicio": "2026-05-11",
        "data_fim": "2026-05-24",
        "duracao_dias": 12,
        "percentual_fisico": 17.5,
        "desembolso_previsto": 14976.00
      },
      
      "equipe_id": "EQ-001",
      "status": "Planejado",
      "observacoes": "Alvenaria estrutural - atenção especial no grauteamento"
    },
    
    {
      "codigo_servico": "1.5",
      "obra_id": "obra-ampliacao-costa-2026",
      "categoria": "Elétrica",
      "descricao": "Ponto de luz LED embutido no forro",
      "unidade": "un",
      "quantidade": 18,
      
      "composicao": {
        "sinapi_codigo": "91920",
        "sinapi_descricao": "Ponto de luz, tubulação embutida",
        
        "insumos": [
          {
            "descricao": "Eletroduto PVC 3/4\"",
            "unidade": "m",
            "quantidade": 54,
            "valor_unitario": 3.80,
            "valor_total": 205.20
          },
          {
            "descricao": "Fio 2,5mm² (3 conduítes)",
            "unidade": "m",
            "quantidade": 162,
            "valor_unitario": 2.10,
            "valor_total": 340.20
          },
          {
            "descricao": "Spot LED 7W embutido",
            "unidade": "un",
            "quantidade": 18,
            "valor_unitario": 42.00,
            "valor_total": 756.00
          },
          {
            "descricao": "Caixa octogonal",
            "unidade": "un",
            "quantidade": 18,
            "valor_unitario": 3.50,
            "valor_total": 63.00
          }
        ],
        
        "mao_de_obra": [
          {
            "funcao": "Eletricista",
            "horas": 36,
            "valor_hora": 32.00,
            "valor_total": 1152.00
          }
        ],
        
        "equipamentos": []
      },
      
      "valor_unitario_direto": 142.03,
      "valor_total_direto": 2556.40,
      "valor_unitario_com_bdi": 178.13,
      "valor_total_com_bdi": 3206.34,
      
      "cronograma": {
        "data_inicio": "2026-05-25",
        "data_fim": "2026-06-02",
        "duracao_dias": 7,
        "percentual_fisico": 4.0,
        "desembolso_previsto": 3206.34
      },
      
      "equipe_id": "EQ-002",
      "status": "Planejado",
      "observacoes": "Spots LED 7W, luz branca neutra 4000K"
    },
    
    {
      "codigo_servico": "2.1",
      "obra_id": "obra-ampliacao-costa-2026",
      "categoria": "Elétrica",
      "descricao": "Tomada 110V padrão NBR",
      "unidade": "un",
      "quantidade": 12,
      
      "composicao": {
        "sinapi_codigo": "91922",
        "sinapi_descricao": "Tomada 110V, tubulação embutida",
        
        "insumos": [
          {
            "descricao": "Eletroduto PVC 3/4\"",
            "unidade": "m",
            "quantidade": 36,
            "valor_unitario": 3.80,
            "valor_total": 136.80
          },
          {
            "descricao": "Fio 2,5mm²",
            "unidade": "m",
            "quantidade": 108,
            "valor_unitario": 2.10,
            "valor_total": 226.80
          },
          {
            "descricao": "Tomada 110V 2P+T",
            "unidade": "un",
            "quantidade": 12,
            "valor_unitario": 18.50,
            "valor_total": 222.00
          },
          {
            "descricao": "Caixa 4×2\"",
            "unidade": "un",
            "quantidade": 12,
            "valor_unitario": 2.80,
            "valor_total": 33.60
          }
        ],
        
        "mao_de_obra": [
          {
            "funcao": "Eletricista",
            "horas": 24,
            "valor_hora": 32.00,
            "valor_total": 768.00
          }
        ],
        
        "equipamentos": []
      },
      
      "valor_unitario_direto": 115.60,
      "valor_total_direto": 1387.20,
      "valor_unitario_com_bdi": 144.94,
      "valor_total_com_bdi": 1739.28,
      
      "cronograma": {
        "data_inicio": "2026-05-25",
        "data_fim": "2026-06-02",
        "duracao_dias": 7,
        "percentual_fisico": 2.0,
        "desembolso_previsto": 1739.28
      },
      
      "equipe_id": "EQ-002",
      "status": "Planejado",
      "observacoes": null
    },
    
    {
      "codigo_servico": "2.2",
      "obra_id": "obra-ampliacao-costa-2026",
      "categoria": "Elétrica",
      "descricao": "Quadro de distribuição 16 circuitos",
      "unidade": "un",
      "quantidade": 1,
      
      "composicao": {
        "sinapi_codigo": "91935",
        "sinapi_descricao": "Quadro de distribuição 16 circuitos",
        
        "insumos": [
          {
            "descricao": "Quadro distribuição 16 disjuntores",
            "unidade": "un",
            "quantidade": 1,
            "valor_unitario": 380.00,
            "valor_total": 380.00
          },
          {
            "descricao": "Disjuntor termomagnético (conjunto)",
            "unidade": "un",
            "quantidade": 16,
            "valor_unitario": 28.00,
            "valor_total": 448.00
          },
          {
            "descricao": "DPS (proteção surto)",
            "unidade": "un",
            "quantidade": 1,
            "valor_unitario": 185.00,
            "valor_total": 185.00
          }
        ],
        
        "mao_de_obra": [
          {
            "funcao": "Eletricista",
            "horas": 8,
            "valor_hora": 32.00,
            "valor_total": 256.00
          }
        ],
        
        "equipamentos": []
      },
      
      "valor_unitario_direto": 1269.00,
      "valor_total_direto": 1269.00,
      "valor_unitario_com_bdi": 1591.27,
      "valor_total_com_bdi": 1591.27,
      
      "cronograma": {
        "data_inicio": "2026-06-03",
        "data_fim": "2026-06-05",
        "duracao_dias": 2,
        "percentual_fisico": 2.0,
        "desembolso_previsto": 1591.27
      },
      
      "equipe_id": "EQ-002",
      "status": "Planejado",
      "observacoes": "Quadro com DPS (proteção contra surto)"
    },
    
    {
      "codigo_servico": "2.3",
      "obra_id": "obra-ampliacao-costa-2026",
      "categoria": "Hidráulica",
      "descricao": "Ponto de água fria PEX",
      "unidade": "un",
      "quantidade": 8,
      
      "composicao": {
        "sinapi_codigo": "92105",
        "sinapi_descricao": "Ponto de água fria, tubulação PEX",
        
        "insumos": [
          {
            "descricao": "Tubo PEX 3/4\"",
            "unidade": "m",
            "quantidade": 40,
            "valor_unitario": 6.80,
            "valor_total": 272.00
          },
          {
            "descricao": "Conexões PEX (conjunto)",
            "unidade": "un",
            "quantidade": 16,
            "valor_unitario": 8.50,
            "valor_total": 136.00
          }
        ],
        
        "mao_de_obra": [
          {
            "funcao": "Encanador",
            "horas": 20,
            "valor_hora": 30.00,
            "valor_total": 600.00
          }
        ],
        
        "equipamentos": []
      },
      
      "valor_unitario_direto": 126.00,
      "valor_total_direto": 1008.00,
      "valor_unitario_com_bdi": 158.01,
      "valor_total_com_bdi": 1264.08,
      
      "cronograma": {
        "data_inicio": "2026-05-25",
        "data_fim": "2026-06-01",
        "duracao_dias": 6,
        "percentual_fisico": 1.5,
        "desembolso_previsto": 1264.08
      },
      
      "equipe_id": "EQ-003",
      "status": "Planejado",
      "observacoes": "Sistema PEX (superior ao PVC)"
    },
    
    {
      "codigo_servico": "2.4",
      "obra_id": "obra-ampliacao-costa-2026",
      "categoria": "Hidráulica",
      "descricao": "Ponto de esgoto PVC 100mm",
      "unidade": "un",
      "quantidade": 6,
      
      "composicao": {
        "sinapi_codigo": "92110",
        "sinapi_descricao": "Ponto de esgoto, tubulação PVC 100mm",
        
        "insumos": [
          {
            "descricao": "Tubo PVC esgoto 100mm",
            "unidade": "m",
            "quantidade": 30,
            "valor_unitario": 18.00,
            "valor_total": 540.00
          },
          {
            "descricao": "Conexões PVC 100mm (joelhos, tês)",
            "unidade": "un",
            "quantidade": 18,
            "valor_unitario": 12.00,
            "valor_total": 216.00
          }
        ],
        
        "mao_de_obra": [
          {
            "funcao": "Encanador",
            "horas": 18,
            "valor_hora": 30.00,
            "valor_total": 540.00
          }
        ],
        
        "equipamentos": []
      },
      
      "valor_unitario_direto": 216.00,
      "valor_total_direto": 1296.00,
      "valor_unitario_com_bdi": 270.88,
      "valor_total_com_bdi": 1625.28,
      
      "cronograma": {
        "data_inicio": "2026-05-25",
        "data_fim": "2026-06-01",
        "duracao_dias": 6,
        "percentual_fisico": 2.0,
        "desembolso_previsto": 1625.28
      },
      
      "equipe_id": "EQ-003",
      "status": "Planejado",
      "observacoes": null
    },
    
    {
      "codigo_servico": "2.5",
      "obra_id": "obra-ampliacao-costa-2026",
      "categoria": "Revestimento",
      "descricao": "Reboco interno espessura 2cm",
      "unidade": "m²",
      "quantidade": 95.00,
      
      "composicao": {
        "sinapi_codigo": "87879",
        "sinapi_descricao": "Reboco interno, espessura 2cm",
        
        "insumos": [
          {
            "descricao": "Argamassa para reboco",
            "unidade": "kg",
            "quantidade": 2850,
            "valor_unitario": 0.38,
            "valor_total": 1083.00
          }
        ],
        
        "mao_de_obra": [
          {
            "funcao": "Pedreiro",
            "horas": 38,
            "valor_hora": 28.00,
            "valor_total": 1064.00
          },
          {
            "funcao": "Servente",
            "horas": 38,
            "valor_hora": 18.50,
            "valor_total": 703.00
          }
        ],
        
        "equipamentos": []
      },
      
      "valor_unitario_direto": 30.00,
      "valor_total_direto": 2850.00,
      "valor_unitario_com_bdi": 37.62,
      "valor_total_com_bdi": 3573.90,
      
      "cronograma": {
        "data_inicio": "2026-06-03",
        "data_fim": "2026-06-10",
        "duracao_dias": 6,
        "percentual_fisico": 4.0,
        "desembolso_previsto": 3573.90
      },
      
      "equipe_id": "EQ-001",
      "status": "Planejado",
      "observacoes": null
    },
    
    {
      "codigo_servico": "3.1",
      "obra_id": "obra-ampliacao-costa-2026",
      "categoria": "Forro",
      "descricao": "Forro gesso acartonado com sanca iluminação",
      "unidade": "m²",
      "quantidade": 50.00,
      
      "composicao": {
        "sinapi_codigo": "94250",
        "sinapi_descricao": "Forro gesso acartonado, com estrutura",
        
        "insumos": [
          {
            "descricao": "Placas gesso acartonado",
            "unidade": "m²",
            "quantidade": 50.00,
            "valor_unitario": 28.00,
            "valor_total": 1400.00
          },
          {
            "descricao": "Perfis metálicos (estrutura)",
            "unidade": "m",
            "quantidade": 150,
            "valor_unitario": 8.50,
            "valor_total": 1275.00
          },
          {
            "descricao": "Parafusos e massa (conjunto)",
            "unidade": "m²",
            "quantidade": 50,
            "valor_unitario": 5.00,
            "valor_total": 250.00
          },
          {
            "descricao": "Sanca iluminação (moldura + fita LED)",
            "unidade": "m",
            "quantidade": 30,
            "valor_unitario": 45.00,
            "valor_total": 1350.00
          }
        ],
        
        "mao_de_obra": [
          {
            "funcao": "Gesseiro",
            "horas": 50,
            "valor_hora": 30.00,
            "valor_total": 1500.00
          },
          {
            "funcao": "Ajudante",
            "horas": 50,
            "valor_hora": 18.50,
            "valor_total": 925.00
          }
        ],
        
        "equipamentos": []
      },
      
      "valor_unitario_direto": 134.00,
      "valor_total_direto": 6700.00,
      "valor_unitario_com_bdi": 168.06,
      "valor_total_com_bdi": 8403.00,
      
      "cronograma": {
        "data_inicio": "2026-06-11",
        "data_fim": "2026-06-18",
        "duracao_dias": 6,
        "percentual_fisico": 10.0,
        "desembolso_previsto": 8403.00
      },
      
      "equipe_id": "EQ-004",
      "status": "Planejado",
      "observacoes": "Forro com sanca iluminação indireta (fita LED RGB)"
    },
    
    {
      "codigo_servico": "3.2",
      "obra_id": "obra-ampliacao-costa-2026",
      "categoria": "Pintura",
      "descricao": "Pintura latex premium (3 demãos)",
      "unidade": "m²",
      "quantidade": 190.00,
      
      "composicao": {
        "sinapi_codigo": "88486",
        "sinapi_descricao": "Pintura látex acrílico premium",
        
        "insumos": [
          {
            "descricao": "Tinta látex premium (Suvinil/Coral)",
            "unidade": "L",
            "quantidade": 76,
            "valor_unitario": 85.00,
            "valor_total": 6460.00
          },
          {
            "descricao": "Massa corrida premium",
            "unidade": "kg",
            "quantidade": 190,
            "valor_unitario": 12.00,
            "valor_total": 2280.00
          }
        ],
        
        "mao_de_obra": [
          {
            "funcao": "Pintor",
            "horas": 57,
            "valor_hora": 22.00,
            "valor_total": 1254.00
          }
        ],
        
        "equipamentos": []
      },
      
      "valor_unitario_direto": 52.60,
      "valor_total_direto": 9994.00,
      "valor_unitario_com_bdi": 65.97,
      "valor_total_com_bdi": 12534.30,
      
      "cronograma": {
        "data_inicio": "2026-06-19",
        "data_fim": "2026-06-27",
        "duracao_dias": 7,
        "percentual_fisico": 14.5,
        "desembolso_previsto": 12534.30
      },
      
      "equipe_id": "EQ-005",
      "status": "Planejado",
      "observacoes": "Pintura premium linha Suvinil Premium ou Coral Requinte"
    },
    
    {
      "codigo_servico": "3.3",
      "obra_id": "obra-ampliacao-costa-2026",
      "categoria": "Piso",
      "descricao": "Piso porcelanato 60×60 retificado",
      "unidade": "m²",
      "quantidade": 30.80,
      
      "composicao": {
        "sinapi_codigo": "87265",
        "sinapi_descricao": "Revestimento porcelanato para piso",
        
        "insumos": [
          {
            "descricao": "Porcelanato 60×60 Portobello (negociado)",
            "unidade": "m²",
            "quantidade": 30.80,
            "valor_unitario": 95.00,
            "valor_total": 2926.00
          },
          {
            "descricao": "Argamassa colante AC-III",
            "unidade": "kg",
            "quantidade": 154,
            "valor_unitario": 0.85,
            "valor_total": 130.90
          },
          {
            "descricao": "Rejunte epóxi premium",
            "unidade": "kg",
            "quantidade": 6.16,
            "valor_unitario": 48.00,
            "valor_total": 295.68
          }
        ],
        
        "mao_de_obra": [
          {
            "funcao": "Pedreiro especializado",
            "horas": 16,
            "valor_hora": 32.00,
            "valor_total": 512.00
          },
          {
            "funcao": "Servente",
            "horas": 16,
            "valor_hora": 18.50,
            "valor_total": 296.00
          }
        ],
        
        "equipamentos": []
      },
      
      "valor_unitario_direto": 140.60,
      "valor_total_direto": 4330.48,
      "valor_unitario_com_bdi": 176.34,
      "valor_total_com_bdi": 5431.27,
      
      "cronograma": {
        "data_inicio": "2026-06-28",
        "data_fim": "2026-07-03",
        "duracao_dias": 4,
        "percentual_fisico": 6.0,
        "desembolso_previsto": 5431.27
      },
      
      "equipe_id": "EQ-001",
      "status": "Planejado",
      "observacoes": "Porcelanato Portobello negociado (R$ 95/m² vs SINAPI R$ 120/m²). Rejunte epóxi premium"
    },
    
    {
      "codigo_servico": "3.4",
      "obra_id": "obra-ampliacao-costa-2026",
      "categoria": "Piso",
      "descricao": "Deck madeira cumaru (varanda)",
      "unidade": "m²",
      "quantidade": 16.00,
      
      "composicao": {
        "sinapi_codigo": null,
        "sinapi_descricao": null,
        
        "insumos": [
          {
            "descricao": "Tábua cumaru deck 10×2cm",
            "unidade": "m²",
            "quantidade": 16.00,
            "valor_unitario": 145.00,
            "valor_total": 2320.00
          },
          {
            "descricao": "Estrutura metálica galvanizada",
            "unidade": "m²",
            "quantidade": 16.00,
            "valor_unitario": 35.00,
            "valor_total": 560.00
          },
          {
            "descricao": "Parafusos inox (conjunto)",
            "unidade": "m²",
            "quantidade": 16.00,
            "valor_unitario": 8.00,
            "valor_total": 128.00
          }
        ],
        
        "mao_de_obra": [
          {
            "funcao": "Carpinteiro",
            "horas": 24,
            "valor_hora": 28.00,
            "valor_total": 672.00
          }
        ],
        
        "equipamentos": []
      },
      
      "valor_unitario_direto": 230.00,
      "valor_total_direto": 3680.00,
      "valor_unitario_com_bdi": 288.46,
      "valor_total_com_bdi": 4615.36,
      
      "cronograma": {
        "data_inicio": "2026-07-04",
        "data_fim": "2026-07-09",
        "duracao_dias": 4,
        "percentual_fisico": 5.0,
        "desembolso_previsto": 4615.36
      },
      
      "equipe_id": "EQ-006",
      "status": "Planejado",
      "observacoes": "Madeira cumaru - SINAPI não possui composição para deck. Estrutura metálica galvanizada (durabilidade)"
    },
    
    {
      "codigo_servico": "3.5",
      "obra_id": "obra-ampliacao-costa-2026",
      "categoria": "Esquadrias",
      "descricao": "Janela alumínio bronze + vidro temp 8mm",
      "unidade": "m²",
      "quantidade": 12.00,
      
      "composicao": {
        "sinapi_codigo": "94105",
        "sinapi_descricao": "Esquadria alumínio com vidro temperado",
        
        "insumos": [
          {
            "descricao": "Janela alumínio linha 25 bronze",
            "unidade": "m²",
            "quantidade": 12.00,
            "valor_unitario": 480.00,
            "valor_total": 5760.00
          },
          {
            "descricao": "Vidro temperado 8mm",
            "unidade": "m²",
            "quantidade": 12.00,
            "valor_unitario": 120.00,
            "valor_total": 1440.00
          }
        ],
        
        "mao_de_obra": [
          {
            "funcao": "Serralheiro/Vidraceiro",
            "horas": 16,
            "valor_hora": 35.00,
            "valor_total": 560.00
          }
        ],
        
        "equipamentos": []
      },
      
      "valor_unitario_direto": 646.67,
      "valor_total_direto": 7760.00,
      "valor_unitario_com_bdi": 811.05,
      "valor_total_com_bdi": 9732.60,
      
      "cronograma": {
        "data_inicio": "2026-07-10",
        "data_fim": "2026-07-15",
        "duracao_dias": 4,
        "percentual_fisico": 11.0,
        "desembolso_previsto": 9732.60
      },
      
      "equipe_id": "EQ-007",
      "status": "Planejado",
      "observacoes": "Linha 25 bronze com vidro temperado 8mm - alto padrão"
    },
    
    {
      "codigo_servico": "4.1",
      "obra_id": "obra-ampliacao-costa-2026",
      "categoria": "Acabamentos",
      "descricao": "Louças e metais Deca linha premium",
      "unidade": "un",
      "quantidade": 1,
      
      "composicao": {
        "sinapi_codigo": null,
        "sinapi_descricao": null,
        
        "insumos": [
          {
            "descricao": "Cuba de embutir Deca",
            "unidade": "un",
            "quantidade": 2,
            "valor_unitario": 380.00,
            "valor_total": 760.00
          },
          {
            "descricao": "Torneira monocomando Deca Link",
            "unidade": "un",
            "quantidade": 2,
            "valor_unitario": 520.00,
            "valor_total": 1040.00
          },
          {
            "descricao": "Vaso sanitário Deca suspendo",
            "unidade": "un",
            "quantidade": 1,
            "valor_unitario": 1280.00,
            "valor_total": 1280.00
          },
          {
            "descricao": "Chuveiro Deca Hydra Duo",
            "unidade": "un",
            "quantidade": 1,
            "valor_unitario": 850.00,
            "valor_total": 850.00
          },
          {
            "descricao": "Acessórios (papeleira, toalheiro, etc)",
            "unidade": "conjunto",
            "quantidade": 1,
            "valor_unitario": 420.00,
            "valor_total": 420.00
          }
        ],
        
        "mao_de_obra": [
          {
            "funcao": "Encanador",
            "horas": 12,
            "valor_hora": 30.00,
            "valor_total": 360.00
          }
        ],
        
        "equipamentos": []
      },
      
      "valor_unitario_direto": 4710.00,
      "valor_total_direto": 4710.00,
      "valor_unitario_com_bdi": 5908.30,
      "valor_total_com_bdi": 5908.30,
      
      "cronograma": {
        "data_inicio": "2026-07-16",
        "data_fim": "2026-07-18",
        "duracao_dias": 2,
        "percentual_fisico": 7.0,
        "desembolso_previsto": 5908.30
      },
      
      "equipe_id": "EQ-003",
      "status": "Planejado",
      "observacoes": "Louças e metais linha premium Deca - alto padrão"
    },
    
    {
      "codigo_servico": "4.2",
      "obra_id": "obra-ampliacao-costa-2026",
      "categoria": "Limpeza",
      "descricao": "Limpeza final pós-obra",
      "unidade": "m²",
      "quantidade": 50.00,
      
      "composicao": {
        "sinapi_codigo": "99721",
        "sinapi_descricao": "Limpeza final de obra",
        
        "insumos": [
          {
            "descricao": "Material de limpeza (conjunto)",
            "unidade": "m²",
            "quantidade": 50.00,
            "valor_unitario": 3.50,
            "valor_total": 175.00
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
      
      "valor_unitario_direto": 9.42,
      "valor_total_direto": 471.00,
      "valor_unitario_com_bdi": 11.82,
      "valor_total_com_bdi": 591.00,
      
      "cronograma": {
        "data_inicio": "2026-07-19",
        "data_fim": "2026-07-20",
        "duracao_dias": 2,
        "percentual_fisico": 1.0,
        "desembolso_previsto": 591.00
      },
      
      "equipe_id": "EQ-001",
      "status": "Planejado",
      "observacoes": null
    }
  ],
  
  "equipes": [
    {
      "id": "EQ-001",
      "nome": "Construtora Silva & Cia",
      "tipo": "Obra Civil",
      "status": "Definida",
      
      "composicao": [
        {
          "funcao": "Pedreiro",
          "quantidade": 3,
          "valor_hora": 28.00
        },
        {
          "funcao": "Servente",
          "quantidade": 3,
          "valor_hora": 18.50
        }
      ],
      
      "servicos_atribuidos": ["1.1", "1.2", "1.3", "1.4", "2.5", "3.3", "4.2"],
      "observacoes": "Equipe principal - obra civil estrutural e acabamentos"
    },
    {
      "id": "EQ-002",
      "nome": "Elétrica Total",
      "tipo": "Elétrica",
      "status": "Definida",
      
      "composicao": [
        {
          "funcao": "Eletricista",
          "quantidade": 2,
          "valor_hora": 32.00
        }
      ],
      
      "servicos_atribuidos": ["1.5", "2.1", "2.2"],
      "observacoes": "Instalações elétricas completas"
    },
    {
      "id": "EQ-003",
      "nome": "Hidráulica Plus",
      "tipo": "Hidráulica",
      "status": "Definida",
      
      "composicao": [
        {
          "funcao": "Encanador",
          "quantidade": 1,
          "valor_hora": 30.00
        }
      ],
      
      "servicos_atribuidos": ["2.3", "2.4", "4.1"],
      "observacoes": "Instalações hidráulicas + louças e metais"
    },
    {
      "id": "EQ-004",
      "nome": "Gesso Master",
      "tipo": "Gesso/Forro",
      "status": "Definida",
      
      "composicao": [
        {
          "funcao": "Gesseiro",
          "quantidade": 2,
          "valor_hora": 30.00
        },
        {
          "funcao": "Ajudante",
          "quantidade": 1,
          "valor_hora": 18.50
        }
      ],
      
      "servicos_atribuidos": ["3.1"],
      "observacoes": "Forro gesso acartonado com sanca"
    },
    {
      "id": "EQ-005",
      "nome": "Pintura Perfeita",
      "tipo": "Pintura",
      "status": "Definida",
      
      "composicao": [
        {
          "funcao": "Pintor",
          "quantidade": 2,
          "valor_hora": 22.00
        }
      ],
      
      "servicos_atribuidos": ["3.2"],
      "observacoes": "Pintura premium linha Suvinil/Coral"
    },
    {
      "id": "EQ-006",
      "nome": "Madeira & Arte",
      "tipo": "Carpintaria/Deck",
      "status": "Definida",
      
      "composicao": [
        {
          "funcao": "Carpinteiro",
          "quantidade": 1,
          "valor_hora": 28.00
        }
      ],
      
      "servicos_atribuidos": ["3.4"],
      "observacoes": "Deck cumaru varanda"
    },
    {
      "id": "EQ-007",
      "nome": "Alumínio & Vidros",
      "tipo": "Esquadrias",
      "status": "Definida",
      
      "composicao": [
        {
          "funcao": "Serralheiro/Vidraceiro",
          "quantidade": 1,
          "valor_hora": 35.00
        }
      ],
      
      "servicos_atribuidos": ["3.5"],
      "observacoes": "Esquadrias alumínio linha 25"
    }
  ],
  
  "cronograma_financeiro": [
    {
      "periodo": "2026-04",
      "mes_ano": "Abr/2026",
      "percentual_fisico": 14.4,
      "percentual_desembolso": 14.4,
      "desembolso_mes": 12347.50,
      "desembolso_acumulado": 12347.50,
      "servicos_executados": ["1.1", "1.2"]
    },
    {
      "periodo": "2026-05",
      "mes_ano": "Mai/2026",
      "percentual_fisico": 54.4,
      "percentual_desembolso": 40.0,
      "desembolso_mes": 34269.00,
      "desembolso_acumulado": 46616.50,
      "servicos_executados": ["1.3", "1.4", "1.5", "2.1", "2.3", "2.4"]
    },
    {
      "periodo": "2026-06",
      "mes_ano": "Jun/2026",
      "percentual_fisico": 85.4,
      "percentual_desembolso": 31.0,
      "desembolso_mes": 26558.47,
      "desembolso_acumulado": 73174.97,
      "servicos_executados": ["2.2", "2.5", "3.1", "3.2"]
    },
    {
      "periodo": "2026-07",
      "mes_ano": "Jul/2026",
      "percentual_fisico": 100,
      "percentual_desembolso": 14.6,
      "desembolso_mes": 12498.03,
      "desembolso_acumulado": 85673.00,
      "servicos_executados": ["3.3", "3.4", "3.5", "4.1", "4.2"]
    }
  ],
  
  "aliases": [
    {
      "alias": "ampliação costa",
      "tipo": "obra",
      "referencia_id": "obra-ampliacao-costa-2026"
    },
    {
      "alias": "fundação",
      "tipo": "servico",
      "referencia_id": "1.1"
    },
    {
      "alias": "forro sanca",
      "tipo": "servico",
      "referencia_id": "3.1"
    },
    {
      "alias": "deck varanda",
      "tipo": "servico",
      "referencia_id": "3.4"
    }
  ],
  
  "metadados": {
    "versao_schema": "2.0",
    "data_geracao": "2026-04-16T20:00:00Z",
    "gerado_por": "Evis Orçamentos",
    "sistema_destino": "EVIS Obra",
    "status_validacao": "validado",
    "observacoes": "Orçamento executivo completo - projeto detalhado com todos complementares. Prazo acelerado com equipes simultâneas. Acabamento alto padrão."
  }
}
```

---

## ✅ Características deste Exemplo

### **1. Projeto Completo**
- Arquitetônico + Estrutural + Elétrico + Hidráulico
- Quantitativos precisos (não estimados)
- Memorial descritivo completo

### **2. Orçamento Executivo**
- 17 serviços detalhados
- Composições completas (insumos + mão de obra + equipamentos)
- Valores SINAPI quando disponíveis
- Fornecedores negociados documentados

### **3. SINAPI como Referência**
- Usado em 14 de 17 serviços
- 2 serviços com fornecedor negociado (documentado)
- 1 serviço sem SINAPI (deck cumaru - composição própria)

### **4. BDI Personalizado**
- Obra alto padrão: Lucro 10% (vs 7,4% referência)
- Lucro Presumido: Impostos 15,5%
- Total BDI: 33,07% (acima da média pelo alto padrão)

### **5. Todas Equipes Definidas**
- 7 equipes especializadas
- Composição detalhada de cada equipe
- Nenhuma "a-definir"

### **6. Cronograma Acelerado**
- Prazo original: 85 dias
- Prazo negociado: 70 dias (-18%)
- Custo adicional: +8%
- Equipes simultâneas (estrutura + instalações)

### **7. Alto Padrão**
- Porcelanato Portobello
- Deck cumaru
- Esquadrias alumínio linha 25
- Louças Deca premium
- Pintura Suvinil/Coral Premium
- Forro gesso com sanca LED

---

## 📊 Resumo Executivo

| Item | Valor |
|------|-------|
| **Serviços** | 17 itens |
| **Custos Diretos** | R$ 68.500,00 |
| **BDI (33,07%)** | R$ 17.173,00 |
| **VALOR TOTAL** | **R$ 85.673,00** |
| **Prazo** | 70 dias úteis (acelerado) |
| **Equipes Definidas** | 7 de 7 (100%) |
| **Acabamento** | Alto padrão |

### **Distribuição Financeira:**
- Abril: R$ 12.347 (14%)
- Maio: R$ 34.269 (40%)
- Junho: R$ 26.558 (31%)
- Julho: R$ 12.498 (15%)

---

**Exemplo de orçamento executivo completo — EVIS Orçamentos**
