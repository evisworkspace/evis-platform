# Exemplo Complexo: Restaurante Badida - ParkShopping

> **LEGADO — Schema v2.0.** Campos obsoletos: `data_prevista`/`data_conclusao` → usar `data_inicio`/`data_fim`. Schema canônico: `skills/SKILL_JSON_EXPORT.md`.

## Entrada bruta

```text
Restaurante Badida - ParkShopping
Cliente: Badida Restaurante
Area: Salao 1 (200m2)

Etapas:
- Preliminares: isolamento, protecoes
- Demolicao: retirada de forro antigo
- PPCI: sistema de incendio
- AC: infraestrutura + equipamentos
- Eletrica: cabeamento + acabamentos
- Forro: estrutura + placas
- Pintura: preparacao + 2 demaos
- Marcenaria: mobiliario planejado
- Limpeza final
```

## Conversa com a IA

Exemplo de interacao:

```text
Usuario:
Quero montar um orcamento completo para importacao no EVIS. Organize as equipes e o cronograma inicial.

IA:
Vou estruturar em obra, equipes e servicos. Tambem vou distribuir os servicos em ordem logica para facilitar a importacao.

Usuario:
Quero um exemplo mais robusto, com varias equipes e servicos detalhados.

IA:
Perfeito. Vou separar em 8 equipes e 20 servicos, mantendo codigos padrao, aliases e datas previstas.
```

## JSON final

```json
{
  "obra": {
    "id": "obra-restaurante-badida-parkshopping-2026",
    "nome": "Restaurante Badida - ParkShopping",
    "cliente": "Badida Restaurante",
    "status": "ATIVA",
    "data_inicio": "2026-02-15",
    "data_fim": null,
    "descricao": "Reforma completa do salao 1 do Restaurante Badida no ParkShopping"
  },
  "equipes": [
    {
      "cod": "EQ-OBR-01",
      "nome": "Valdeci Jose Empreiteiro",
      "funcao": "Obra Civil e Alvenaria",
      "telefone": "(41) 99999-0001",
      "email": "valdeci@obra.com",
      "pix": "valdeci@obra.com",
      "contato": "Valdeci Jose",
      "status": "ativo",
      "ativo": true,
      "aliases": ["valdeci", "empreiteiro", "pedreiro", "construcao"]
    },
    {
      "cod": "EQ-ACO-01",
      "nome": "Ademarcos AC",
      "funcao": "Ar-condicionado e Refrigeracao",
      "telefone": "(41) 99999-0002",
      "email": "ademarcos@ac.com",
      "pix": "12345678902",
      "contato": "Ademarcos",
      "status": "ativo",
      "ativo": true,
      "aliases": ["ademarcos", "ac", "ar condicionado", "refrigeracao"]
    },
    {
      "cod": "EQ-ELET-01",
      "nome": "Lumitech",
      "funcao": "Instalacoes Eletricas",
      "telefone": "(41) 99999-0003",
      "email": "contato@lumitech.com",
      "pix": "12345678903",
      "contato": "Carlos Eletrico",
      "status": "ativo",
      "ativo": true,
      "aliases": ["lumitech", "eletrica", "eletricista", "luz"]
    },
    {
      "cod": "EQ-FRG-01",
      "nome": "Dominio Refrigeracao",
      "funcao": "Instalacoes Frigorificas",
      "telefone": "(41) 99999-0004",
      "email": "dominio@refri.com",
      "pix": "12345678904",
      "contato": "Claudinei",
      "status": "ativo",
      "ativo": true,
      "aliases": ["dominio", "frigorifico", "refrigeracao", "frio"]
    },
    {
      "cod": "EQ-PPCI-01",
      "nome": "Pablo PPCI",
      "funcao": "PPCI e Sistemas de Incendio",
      "telefone": "(41) 99999-0005",
      "email": "pablo@ppci.com",
      "pix": "12345678905",
      "contato": "Pablo",
      "status": "ativo",
      "ativo": true,
      "aliases": ["pablo", "ppci", "incendio", "bombeiro"]
    },
    {
      "cod": "EQ-MAR-01",
      "nome": "Marcenaria Planejada",
      "funcao": "Moveis Planejados",
      "telefone": "(41) 99999-0006",
      "email": "marcenaria@moveis.com",
      "pix": "12345678906",
      "contato": "Joao Marceneiro",
      "status": "ativo",
      "ativo": true,
      "aliases": ["marcenaria", "marceneiro", "moveis", "planejados"]
    },
    {
      "cod": "EQ-LIM-01",
      "nome": "Clean Express",
      "funcao": "Limpeza Pos-obra",
      "telefone": "(41) 99999-0007",
      "email": "clean@limpeza.com",
      "pix": "12345678907",
      "contato": "Maria Limpeza",
      "status": "ativo",
      "ativo": true,
      "aliases": ["clean", "limpeza", "faxina", "pos obra"]
    },
    {
      "cod": "EQ-LOG-01",
      "nome": "Roberto Som",
      "funcao": "Som e Logistica",
      "telefone": "(41) 99999-0008",
      "email": "roberto@som.com",
      "pix": "12345678908",
      "contato": "Roberto",
      "status": "ativo",
      "ativo": true,
      "aliases": ["roberto", "som", "audio", "logistica"]
    }
  ],
  "servicos": [
    {
      "codigo_servico": "1.1",
      "nome": "Isolamento de Obra",
      "categoria": "Preliminares",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-OBR-01",
      "responsavel": "Valdeci Jose",
      "data_prevista": "2026-02-17",
      "data_conclusao": null,
      "aliases": ["isolamento", "tapume", "protecao"]
    },
    {
      "codigo_servico": "1.2",
      "nome": "Desmobilizacao de Mobiliario - Salao 1",
      "categoria": "Preliminares",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-OBR-01",
      "responsavel": "Valdeci Jose",
      "data_prevista": "2026-02-20",
      "data_conclusao": null,
      "aliases": ["retirar moveis", "desmontar", "esvaziar"]
    },
    {
      "codigo_servico": "1.3",
      "nome": "Protecao de Piso e Esquadrias - Salao 1",
      "categoria": "Preliminares",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-OBR-01",
      "responsavel": "Valdeci Jose",
      "data_prevista": "2026-02-21",
      "data_conclusao": null,
      "aliases": ["proteger piso", "proteger janela", "lona"]
    },
    {
      "codigo_servico": "1.4",
      "nome": "Mobilizacao de Canteiro - Salao 1",
      "categoria": "Preliminares",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-OBR-01",
      "responsavel": "Valdeci Jose",
      "data_prevista": "2026-02-22",
      "data_conclusao": null,
      "aliases": ["andaime", "estrutura", "canteiro"]
    },
    {
      "codigo_servico": "1.5",
      "nome": "Retirada de Elementos de Parede - Salao 1",
      "categoria": "Demolicoes",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-OBR-01",
      "responsavel": "Valdeci Jose",
      "data_prevista": "2026-02-25",
      "data_conclusao": null,
      "aliases": ["demolir parede", "quebrar", "retirar"]
    },
    {
      "codigo_servico": "2.1",
      "nome": "Retirada de Elementos de Teto - Salao 1",
      "categoria": "Demolicoes",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-OBR-01",
      "responsavel": "Valdeci Jose",
      "data_prevista": "2026-02-27",
      "data_conclusao": null,
      "aliases": ["demolir teto", "forro antigo", "retirar forro"]
    },
    {
      "codigo_servico": "2.2",
      "nome": "PPCI - Estrutura de Incendio - Salao 1",
      "categoria": "PPCI / Incendio",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-PPCI-01",
      "responsavel": "Pablo",
      "data_prevista": "2026-03-01",
      "data_conclusao": null,
      "aliases": ["ppci", "incendio", "sprinkler", "estrutura"]
    },
    {
      "codigo_servico": "2.3",
      "nome": "Desmontagem de Duto de AC - Salao 1",
      "categoria": "Ar-condicionado",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-ACO-01",
      "responsavel": "Ademarcos",
      "data_prevista": "2026-03-03",
      "data_conclusao": null,
      "aliases": ["duto", "ar condicionado", "desmontagem"]
    },
    {
      "codigo_servico": "2.4",
      "nome": "Infraestrutura de Drenos de AC - Salao 1",
      "categoria": "Ar-condicionado",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-ACO-01",
      "responsavel": "Ademarcos",
      "data_prevista": "2026-03-05",
      "data_conclusao": null,
      "aliases": ["dreno", "condensado", "esgoto ac"]
    },
    {
      "codigo_servico": "2.5",
      "nome": "Infraestrutura Eletrica - Salao 1",
      "categoria": "Eletrica",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-ELET-01",
      "responsavel": "Carlos Eletrico",
      "data_prevista": "2026-03-07",
      "data_conclusao": null,
      "aliases": ["eletrica", "fiacao", "eletroduto"]
    },
    {
      "codigo_servico": "3.1",
      "nome": "Infraestrutura da Rede Frigorifica - Salao 1",
      "categoria": "Ar-condicionado",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-FRG-01",
      "responsavel": "Claudinei",
      "data_prevista": "2026-03-09",
      "data_conclusao": null,
      "aliases": ["frigorifico", "tubulacao", "gas refrigerante"]
    },
    {
      "codigo_servico": "3.2",
      "nome": "Tarugamento de Forro - Salao 1",
      "categoria": "Drywall / Forro",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-OBR-01",
      "responsavel": "Valdeci Jose",
      "data_prevista": "2026-03-11",
      "data_conclusao": null,
      "aliases": ["tarugo", "estrutura forro", "perfil"]
    },
    {
      "codigo_servico": "3.3",
      "nome": "Fechamento de Forro com Placas - Salao 1",
      "categoria": "Drywall / Forro",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-OBR-01",
      "responsavel": "Valdeci Jose",
      "data_prevista": "2026-03-14",
      "data_conclusao": null,
      "aliases": ["placa forro", "gesso", "fechar forro"]
    },
    {
      "codigo_servico": "3.4",
      "nome": "Pontos e Regulagem de PPCI - Salao 1",
      "categoria": "PPCI / Incendio",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-PPCI-01",
      "responsavel": "Pablo",
      "data_prevista": "2026-03-16",
      "data_conclusao": null,
      "aliases": ["ppci pontos", "sprinkler pontos", "regulagem"]
    },
    {
      "codigo_servico": "3.5",
      "nome": "Preparacao para Pintura - Salao 1",
      "categoria": "Pintura",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-OBR-01",
      "responsavel": "Valdeci Jose",
      "data_prevista": "2026-03-18",
      "data_conclusao": null,
      "aliases": ["massa corrida", "lixar", "preparar parede"]
    },
    {
      "codigo_servico": "4.1",
      "nome": "1a Demao de Pintura - Salao 1",
      "categoria": "Pintura",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-OBR-01",
      "responsavel": "Valdeci Jose",
      "data_prevista": "2026-03-21",
      "data_conclusao": null,
      "aliases": ["primeira demao", "pintar", "pintura base"]
    },
    {
      "codigo_servico": "4.2",
      "nome": "Acabamentos de Eletrica - Salao 1",
      "categoria": "Eletrica",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-ELET-01",
      "responsavel": "Carlos Eletrico",
      "data_prevista": "2026-03-23",
      "data_conclusao": null,
      "aliases": ["tomada", "interruptor", "acabamento eletrico"]
    },
    {
      "codigo_servico": "4.3",
      "nome": "Acabamentos de AC - Salao 1",
      "categoria": "Ar-condicionado",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-ACO-01",
      "responsavel": "Ademarcos",
      "data_prevista": "2026-03-25",
      "data_conclusao": null,
      "aliases": ["acabamento ac", "grelha", "difusor"]
    },
    {
      "codigo_servico": "4.4",
      "nome": "Instalacao de Equipamento AC - Salao 1",
      "categoria": "Ar-condicionado",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-ACO-01",
      "responsavel": "Ademarcos",
      "data_prevista": "2026-03-27",
      "data_conclusao": null,
      "aliases": ["cassete", "evaporadora", "maquina ac"]
    },
    {
      "codigo_servico": "4.5",
      "nome": "Mobiliario Planejado - Salao 1",
      "categoria": "Marcenaria",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-MAR-01",
      "responsavel": "Joao Marceneiro",
      "data_prevista": "2026-03-30",
      "data_conclusao": null,
      "aliases": ["moveis", "marcenaria", "planejado"]
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

## Observacao importante

Para um caso ainda mais extenso, consulte tambem:
- `../templates/TEMPLATE_ORCAMENTO_COMPLETO_V3.json`

## O que este exemplo ensina

- como organizar um caso com varias equipes
- como detalhar servicos em ordem logica
- como usar datas previstas e aliases em um orcamento maior
