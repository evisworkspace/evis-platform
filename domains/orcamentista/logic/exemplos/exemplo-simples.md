# Exemplo Simples: Reforma Loja ABC

> **LEGADO — Schema v2.0.** Campos obsoletos: `data_prevista`/`data_conclusao` → usar `data_inicio`/`data_fim`. Schema canônico: `skills/SKILL_JSON_EXPORT.md`.

## Entrada bruta

```text
Reforma Loja ABC
Cliente: Joao Silva
Inicio: Marco/2026

Servicos:
1. Demolicao de paredes - R$ 5.000 - Construtora Silva
2. Instalacao eletrica - R$ 15.000 - Eletrotecnica Luz
3. Pintura (2 demaos) - R$ 8.000 - Pinturas Artisticas
```

## Conversa com a IA

Exemplo de interacao:

```text
Usuario:
Quero estruturar este orcamento para importacao no EVIS.

IA:
Perfeito. Vou organizar em obra, equipes e servicos. Se eu precisar completar algo secundario, vou usar defaults seguros.

Usuario:
Pode quebrar pintura em etapas para ficar melhor no acompanhamento.

IA:
Vou separar em preparacao, 1a demao e 2a demao e depois gerar o JSON final.
```

## JSON final

```json
{
  "obra": {
    "id": "obra-reforma-loja-abc-2026",
    "nome": "Reforma Loja ABC",
    "cliente": "Joao Silva",
    "status": "ATIVA",
    "data_inicio": "2026-03-01",
    "data_fim": null,
    "descricao": "Reforma completa de loja comercial"
  },
  "equipes": [
    {
      "cod": "EQ-OBR-01",
      "nome": "Construtora Silva",
      "funcao": "Demolicao e Obra Civil",
      "telefone": null,
      "email": null,
      "pix": null,
      "contato": null,
      "status": "ativo",
      "ativo": true,
      "aliases": ["silva", "construtora", "pedreiro"]
    },
    {
      "cod": "EQ-ELET-01",
      "nome": "Eletrotecnica Luz",
      "funcao": "Instalacoes Eletricas",
      "telefone": null,
      "email": null,
      "pix": null,
      "contato": null,
      "status": "ativo",
      "ativo": true,
      "aliases": ["luz", "eletrica", "eletricista"]
    },
    {
      "cod": "EQ-PINT-01",
      "nome": "Pinturas Artisticas",
      "funcao": "Pintura",
      "telefone": null,
      "email": null,
      "pix": null,
      "contato": null,
      "status": "ativo",
      "ativo": true,
      "aliases": ["artisticas", "pintura", "pintor"]
    }
  ],
  "servicos": [
    {
      "codigo_servico": "1.1",
      "nome": "Demolicao de Paredes",
      "categoria": "Demolicoes",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-OBR-01",
      "responsavel": null,
      "data_prevista": null,
      "data_conclusao": null,
      "aliases": ["demolicao", "quebrar parede", "retirada de parede"]
    },
    {
      "codigo_servico": "1.2",
      "nome": "Instalacao Eletrica",
      "categoria": "Eletrica",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-ELET-01",
      "responsavel": null,
      "data_prevista": null,
      "data_conclusao": null,
      "aliases": ["eletrica", "fiacao", "tomadas", "pontos de luz"]
    },
    {
      "codigo_servico": "1.3",
      "nome": "Preparacao para Pintura",
      "categoria": "Pintura",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-PINT-01",
      "responsavel": null,
      "data_prevista": null,
      "data_conclusao": null,
      "aliases": ["massa", "lixamento", "preparacao"]
    },
    {
      "codigo_servico": "1.4",
      "nome": "Pintura - 1a Demao",
      "categoria": "Pintura",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-PINT-01",
      "responsavel": null,
      "data_prevista": null,
      "data_conclusao": null,
      "aliases": ["primeira demao", "pintura base"]
    },
    {
      "codigo_servico": "1.5",
      "nome": "Pintura - 2a Demao",
      "categoria": "Pintura",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-PINT-01",
      "responsavel": null,
      "data_prevista": null,
      "data_conclusao": null,
      "aliases": ["segunda demao", "acabamento de pintura"]
    }
  ]
}
```

## Como importar

1. Copie o JSON completo.
2. Abra o EVIS Obra.
3. Va em `CONFIG -> Inicializar Projeto (JSON)`.
4. Cole o conteudo.
5. Execute a importacao.

## O que este exemplo ensina

- como transformar um texto curto em estrutura formal
- como quebrar um servico amplo em etapas
- como vincular cada servico a uma equipe
