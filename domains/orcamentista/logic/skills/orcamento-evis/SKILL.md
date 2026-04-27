---
name: orcamento-evis
description: Transforme orcamentos, propostas, planilhas, textos extraidos de PDF ou listas de servicos em JSON padronizado para importacao no EVIS. Use quando for necessario estruturar obra, equipes e servicos com IDs consistentes, categorias padrao, aliases e cronograma inicial, prontos para um fluxo externo de orcamentacao que acontece antes do EVIS Obra.
---

# SKILL: Orcamento para EVIS

## Objetivo

Transformar um orcamento bruto em um JSON unico, valido e pronto para importacao no EVIS.

Esta skill pertence a um fluxo externo ao EVIS Obra:
- o gestor ou orcamentista usa esta skill antes da obra entrar em operacao
- a skill nao depende do sistema EVIS estar aberto
- a saida final serve como ponte entre o projeto de orcamentacao e o projeto EVIS Obra

Gerar apenas estes blocos:
- `obra`
- `equipes`
- `servicos`

Nao gerar:
- `pendencias`
- `notas`
- `diario_obra`
- `equipes_presenca`
- `fotos`

Retornar um JSON sintaticamente valido quando o gestor pedir a versao final para importacao.

## Como Usar

1. Ler o material bruto enviado pelo gestor.
2. Identificar dados da obra: nome, cliente, descricao, data de inicio, prazo, etapas e fornecedores.
3. Estruturar equipes primeiro.
4. Estruturar servicos em ordem logica de execucao.
5. Atribuir uma equipe a cada servico.
6. Aplicar categorias padrao e aliases uteis para reconhecimento por IA.
7. Validar IDs, status, datas e consistencia geral.
8. Quando o gestor pedir "Gere o JSON para importacao no EVIS", retornar apenas o JSON final.

Se faltarem dados secundarios, assumir defaults seguros sem travar o processo.

## Schema do EVIS (Supabase)

Usar como referencia o contrato de importacao do EVIS, alinhado ao schema oficial.

Observacao importante:
- No banco real, `obras.id` e os IDs internos das tabelas sao UUIDs do Supabase.
- No JSON de importacao do EVIS, usar o identificador legivel de obra no campo `obra.id`, conforme o padrao abaixo.
- Nao incluir campos internos como `created_at`, `obra_id` ou UUIDs gerados pelo banco.

### Obra

Campos do JSON:
- `id` obrigatorio
- `nome` obrigatorio
- `cliente` opcional
- `status` opcional, default `ATIVA`
- `data_inicio` opcional, formato `YYYY-MM-DD`
- `data_fim` opcional, usar `null` se a obra estiver em andamento
- `descricao` opcional

Regras:
- `status` valido: `ATIVA`, `PAUSADA`, `CONCLUIDA`, `CANCELADA`
- `id` do JSON: `obra-{nome-simplificado}-{ano}`

### Servicos

Campos do JSON:
- `id_servico` obrigatorio
- `nome` obrigatorio
- `categoria` opcional, mas preencher sempre que possivel
- `avanco_atual` opcional, default `0`
- `status` opcional, default `nao_iniciado`
- `equipe` obrigatorio no JSON final
- `responsavel` opcional
- `data_prevista` opcional, formato `YYYY-MM-DD`
- `data_conclusao` opcional, usar `null` enquanto nao concluido
- `aliases` opcional, default `[]`

Regras:
- `status` valido: `nao_iniciado`, `em_andamento`, `concluido`, `pausado`
- `id_servico` sequencial: `SRV-001`, `SRV-002`, `SRV-003`...
- `avanco_atual` deve ficar entre `0` e `100`

### Equipes

Campos do JSON:
- `cod` obrigatorio
- `nome` obrigatorio
- `funcao` opcional
- `telefone` opcional
- `email` opcional
- `pix` opcional
- `contato` opcional
- `status` opcional
- `ativo` opcional, default `true`
- `aliases` opcional, default `[]`

Regras:
- `cod` no formato `EQ-{TIPO}-{NN}`
- `status` recomendado: `ativo`
- `ativo` default: `true`

## Regras de Transformacao

### 1. Identificar a obra

Extrair:
- nome do projeto
- cliente
- data de inicio ou mes/ano de inicio
- prazo total, se houver
- descricao resumida da obra

Aplicar:
- Se houver apenas mes/ano, converter para o primeiro dia do mes.
- Se o ano nao aparecer claramente no titulo, inferir a partir da data de inicio.
- Se nao houver data confiavel, usar a data atual do contexto da conversa.

### 2. Gerar o ID da obra

Normalizar para minusculas e hifens.

Aplicar estas regras:
- remover acentos
- remover caracteres especiais
- trocar espacos por hifens
- eliminar duplicidade de hifens
- manter apenas o necessario para identificacao humana

Exemplo:
- `Reforma Loja ABC - 2026` -> `obra-reforma-loja-abc-2026`

### 3. Estruturar equipes

Criar uma equipe para cada fornecedor, empreiteiro ou frente de trabalho claramente identificavel.

Quando o nome comercial nao aparecer:
- criar equipe descritiva a partir da especialidade
- usar nomes claros, por exemplo `Equipe de Pintura`, `Equipe de Eletrica`, `Equipe de PPCI`

Nao duplicar equipes que representem o mesmo executor.

Preencher:
- `funcao` com a especialidade principal
- `aliases` com nome reduzido, sobrenome, especialidade, termos populares e variacoes sem acento

### 4. Gerar codigos de equipe

Usar o padrao `EQ-{TIPO}-{NN}`.

Contador:
- reiniciar por tipo
- usar 2 digitos

Exemplos:
- `EQ-OBR-01`
- `EQ-ELET-01`
- `EQ-HIDR-01`
- `EQ-PINT-01`
- `EQ-ACO-01`

Se existir mais de uma equipe do mesmo tipo:
- `EQ-OBR-01`, `EQ-OBR-02`

### 5. Estruturar servicos

Transformar cada item do orcamento em um ou mais servicos executaveis.

Separar em servicos distintos quando o item agrupar fases diferentes, por exemplo:
- `Pintura: preparacao + 2 demaos`
- virar `Preparacao para Pintura`, `1a Demao de Pintura`, `2a Demao de Pintura`

Manter granularidade util para gestao sem exagerar no detalhamento.

Boa regra:
- um servico deve representar uma entrega monitoravel no EVIS

### 6. Gerar IDs dos servicos

Usar sequencia continua:
- `SRV-001`
- `SRV-002`
- `SRV-003`

Nao pular numeros.
Nao reutilizar IDs.

### 7. Categorizar servicos

Escolher a categoria mais aderente ao contexto do item.

Se um servico parecer pertencer a mais de uma categoria:
- priorizar a atividade principal
- evitar categorias genericas demais

Exemplos:
- retirada de forro antigo -> `Demolicoes`
- cabeamento e eletrodutos -> `Eletrica`
- drenos e evaporadoras -> `Ar-condicionado`
- massa, lixamento e demaos -> `Pintura`

### 8. Relacionar servico e equipe

Todo servico deve sair com `equipe` preenchido.

Se houver incerteza:
- escolher a equipe mais provavel pela especialidade
- registrar o nome da pessoa em `responsavel` apenas se ela estiver claramente associada ao servico

Nao deixar servico sem equipe no JSON final.

### 9. Tratar datas

Aplicar estas regras:
- usar formato ISO: `YYYY-MM-DD`
- se houver cronograma explicito, respeitar a ordem informada
- se houver apenas prazo total, distribuir datas de forma coerente
- se nao houver informacao suficiente, deixar `data_prevista: null`
- usar `data_conclusao: null` na importacao inicial

### 10. Gerar aliases

Gerar aliases curtos e uteis para reconhecimento futuro por IA.

Para servicos, incluir:
- forma reduzida
- sinonimos comuns
- termos de canteiro
- grafias sem acento

Para equipes, incluir:
- nome curto
- sobrenome ou marca
- especialidade
- termos populares da funcao

Evitar:
- frases longas
- aliases redundantes
- alias identico ao nome completo sem necessidade

## Categorias Padrao

Usar preferencialmente uma destas categorias:
- `Preliminares`
- `Demolicoes`
- `Estrutura`
- `Alvenaria`
- `Eletrica`
- `Hidraulica`
- `Ar-condicionado`
- `PPCI / Incendio`
- `Drywall / Forro`
- `Pintura`
- `Revestimento`
- `Marcenaria`
- `Limpeza`
- `Administracao`

Mapeamentos comuns:
- isolamento, mobilizacao, protecao -> `Preliminares`
- remocao, retirada, quebra, desmontagem -> `Demolicoes`
- fiacao, tomadas, luminarias, quadros -> `Eletrica`
- tubos, esgoto, agua fria, agua quente -> `Hidraulica`
- dreno, duto, cassete, evaporadora -> `Ar-condicionado`
- sprinkler, extintor, sinalizacao -> `PPCI / Incendio`
- tarugamento, placas, fechamento de forro -> `Drywall / Forro`
- massa, lixamento, selador, demaos -> `Pintura`
- limpeza fina, limpeza pos-obra -> `Limpeza`

## Codigos de Equipes

Usar estes prefixos como padrao:
- `EQ-OBR` para obra civil, demolicacao, alvenaria, apoio geral
- `EQ-ELET` para eletrica
- `EQ-HIDR` para hidraulica
- `EQ-PINT` para pintura
- `EQ-ACO` para ar-condicionado
- `EQ-PPCI` para PPCI e incendio
- `EQ-DRY` para drywall e forro
- `EQ-MAR` para marcenaria
- `EQ-LIM` para limpeza
- `EQ-ADM` para administracao e apoio tecnico
- `EQ-LOG` para logistica

Se a especialidade nao estiver na lista:
- escolher o prefixo mais proximo
- manter consistencia no mesmo JSON

## Template de Saida

```json
{
  "obra": {
    "id": "obra-exemplo-2026",
    "nome": "Nome do Projeto",
    "cliente": "Nome do Cliente",
    "status": "ATIVA",
    "data_inicio": "2026-01-15",
    "data_fim": null,
    "descricao": "Descricao resumida do projeto"
  },
  "equipes": [
    {
      "cod": "EQ-OBR-01",
      "nome": "Nome da Equipe",
      "funcao": "Especialidade",
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
      "id_servico": "SRV-001",
      "nome": "Nome do Servico",
      "categoria": "Categoria",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-OBR-01",
      "responsavel": null,
      "data_prevista": "2026-02-01",
      "data_conclusao": null,
      "aliases": ["termo1", "termo2"]
    }
  ]
}
```

## Checklist de Validacao

Antes de entregar o JSON final, validar:

- [ ] `obra.id` presente e no formato `obra-{nome-simplificado}-{ano}`
- [ ] `obra.nome` preenchido
- [ ] `obra.status` dentro de `ATIVA | PAUSADA | CONCLUIDA | CANCELADA`
- [ ] todos os `id_servico` unicos e sequenciais
- [ ] todos os `cod` de equipe unicos
- [ ] todo servico com `nome`
- [ ] toda equipe com `nome`
- [ ] todo servico com `equipe` preenchido
- [ ] `avanco_atual` iniciado em `0`, salvo instrucao explicita em contrario
- [ ] `status` de servicos dentro de `nao_iniciado | em_andamento | concluido | pausado`
- [ ] datas em `YYYY-MM-DD` ou `null`
- [ ] `aliases` presentes como array, mesmo que vazio
- [ ] nenhuma estrutura fora de `obra`, `equipes`, `servicos`
- [ ] JSON valido, sem comentarios, sem reticencias, sem texto extra

## Exemplos

### Exemplo 1: Orcamento Simples

Entrada bruta:

```text
Reforma Loja ABC
Cliente: Joao Silva
Inicio: Marco/2026

Servicos:
1. Demolicao de paredes - R$ 5.000 - Construtora Silva
2. Instalacao eletrica - R$ 15.000 - Eletrotecnica Luz
3. Pintura (2 demaos) - R$ 8.000 - Pinturas Artisticas
```

Saida estruturada:

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
      "id_servico": "SRV-001",
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
      "id_servico": "SRV-002",
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
      "id_servico": "SRV-003",
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
      "id_servico": "SRV-004",
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
      "id_servico": "SRV-005",
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

### Exemplo 2: Orcamento Complexo

Entrada bruta:

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
- Limpeza final
```

Saida estruturada:

```json
{
  "obra": {
    "id": "obra-restaurante-badida-parkshopping-2026",
    "nome": "Restaurante Badida - ParkShopping",
    "cliente": "Badida Restaurante",
    "status": "ATIVA",
    "data_inicio": "2026-04-15",
    "data_fim": null,
    "descricao": "Reforma do salao 1 do Restaurante Badida no ParkShopping"
  },
  "equipes": [
    {
      "cod": "EQ-OBR-01",
      "nome": "Equipe de Obra Civil",
      "funcao": "Preliminares e Demolicao",
      "telefone": null,
      "email": null,
      "pix": null,
      "contato": null,
      "status": "ativo",
      "ativo": true,
      "aliases": ["obra civil", "demolicao", "protecao"]
    },
    {
      "cod": "EQ-PPCI-01",
      "nome": "Equipe de PPCI",
      "funcao": "PPCI e Incendio",
      "telefone": null,
      "email": null,
      "pix": null,
      "contato": null,
      "status": "ativo",
      "ativo": true,
      "aliases": ["ppci", "incendio", "sprinkler"]
    },
    {
      "cod": "EQ-ACO-01",
      "nome": "Equipe de Ar-condicionado",
      "funcao": "Ar-condicionado",
      "telefone": null,
      "email": null,
      "pix": null,
      "contato": null,
      "status": "ativo",
      "ativo": true,
      "aliases": ["ac", "ar condicionado", "dutos"]
    },
    {
      "cod": "EQ-ELET-01",
      "nome": "Equipe de Eletrica",
      "funcao": "Instalacoes Eletricas",
      "telefone": null,
      "email": null,
      "pix": null,
      "contato": null,
      "status": "ativo",
      "ativo": true,
      "aliases": ["eletrica", "cabeamento", "tomadas"]
    },
    {
      "cod": "EQ-DRY-01",
      "nome": "Equipe de Forro",
      "funcao": "Drywall e Forro",
      "telefone": null,
      "email": null,
      "pix": null,
      "contato": null,
      "status": "ativo",
      "ativo": true,
      "aliases": ["forro", "placas", "estrutura de forro"]
    },
    {
      "cod": "EQ-PINT-01",
      "nome": "Equipe de Pintura",
      "funcao": "Pintura",
      "telefone": null,
      "email": null,
      "pix": null,
      "contato": null,
      "status": "ativo",
      "ativo": true,
      "aliases": ["pintura", "massa", "lixamento"]
    },
    {
      "cod": "EQ-LIM-01",
      "nome": "Equipe de Limpeza",
      "funcao": "Limpeza Pos-obra",
      "telefone": null,
      "email": null,
      "pix": null,
      "contato": null,
      "status": "ativo",
      "ativo": true,
      "aliases": ["limpeza", "faxina", "limpeza final"]
    },
    {
      "cod": "EQ-ADM-01",
      "nome": "Coordenacao da Obra",
      "funcao": "Administracao",
      "telefone": null,
      "email": null,
      "pix": null,
      "contato": null,
      "status": "ativo",
      "ativo": true,
      "aliases": ["coordenacao", "obra", "gestao"]
    }
  ],
  "servicos": [
    {
      "id_servico": "SRV-001",
      "nome": "Isolamento de Area",
      "categoria": "Preliminares",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-OBR-01",
      "responsavel": null,
      "data_prevista": null,
      "data_conclusao": null,
      "aliases": ["isolamento", "tapume", "protecao"]
    },
    {
      "id_servico": "SRV-002",
      "nome": "Protecoes de Obra",
      "categoria": "Preliminares",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-OBR-01",
      "responsavel": null,
      "data_prevista": null,
      "data_conclusao": null,
      "aliases": ["protecao", "isolamento interno", "cobertura"]
    },
    {
      "id_servico": "SRV-003",
      "nome": "Retirada de Forro Antigo",
      "categoria": "Demolicoes",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-OBR-01",
      "responsavel": null,
      "data_prevista": null,
      "data_conclusao": null,
      "aliases": ["demolicao de forro", "retirada de forro", "remocao"]
    },
    {
      "id_servico": "SRV-004",
      "nome": "Infraestrutura de PPCI",
      "categoria": "PPCI / Incendio",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-PPCI-01",
      "responsavel": null,
      "data_prevista": null,
      "data_conclusao": null,
      "aliases": ["ppci", "incendio", "sprinkler"]
    },
    {
      "id_servico": "SRV-005",
      "nome": "Instalacao de Pontos de PPCI",
      "categoria": "PPCI / Incendio",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-PPCI-01",
      "responsavel": null,
      "data_prevista": null,
      "data_conclusao": null,
      "aliases": ["pontos ppci", "bicos", "sistema de incendio"]
    },
    {
      "id_servico": "SRV-006",
      "nome": "Infraestrutura de Ar-condicionado",
      "categoria": "Ar-condicionado",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-ACO-01",
      "responsavel": null,
      "data_prevista": null,
      "data_conclusao": null,
      "aliases": ["infra ac", "dutos", "drenos"]
    },
    {
      "id_servico": "SRV-007",
      "nome": "Instalacao de Equipamentos de Ar-condicionado",
      "categoria": "Ar-condicionado",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-ACO-01",
      "responsavel": null,
      "data_prevista": null,
      "data_conclusao": null,
      "aliases": ["equipamentos ac", "cassete", "evaporadora"]
    },
    {
      "id_servico": "SRV-008",
      "nome": "Cabeamento Eletrico",
      "categoria": "Eletrica",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-ELET-01",
      "responsavel": null,
      "data_prevista": null,
      "data_conclusao": null,
      "aliases": ["cabeamento", "fiacao", "eletrodutos"]
    },
    {
      "id_servico": "SRV-009",
      "nome": "Acabamentos Eletricos",
      "categoria": "Eletrica",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-ELET-01",
      "responsavel": null,
      "data_prevista": null,
      "data_conclusao": null,
      "aliases": ["acabamento eletrico", "tomadas", "interruptores"]
    },
    {
      "id_servico": "SRV-010",
      "nome": "Estrutura de Forro",
      "categoria": "Drywall / Forro",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-DRY-01",
      "responsavel": null,
      "data_prevista": null,
      "data_conclusao": null,
      "aliases": ["estrutura forro", "perfil", "tarugamento"]
    },
    {
      "id_servico": "SRV-011",
      "nome": "Fechamento com Placas",
      "categoria": "Drywall / Forro",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-DRY-01",
      "responsavel": null,
      "data_prevista": null,
      "data_conclusao": null,
      "aliases": ["placas", "fechamento de forro", "drywall"]
    },
    {
      "id_servico": "SRV-012",
      "nome": "Preparacao para Pintura",
      "categoria": "Pintura",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-PINT-01",
      "responsavel": null,
      "data_prevista": null,
      "data_conclusao": null,
      "aliases": ["massa", "lixamento", "selador"]
    },
    {
      "id_servico": "SRV-013",
      "nome": "Pintura - 1a Demao",
      "categoria": "Pintura",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-PINT-01",
      "responsavel": null,
      "data_prevista": null,
      "data_conclusao": null,
      "aliases": ["primeira demao", "base de pintura", "pintura inicial"]
    },
    {
      "id_servico": "SRV-014",
      "nome": "Pintura - 2a Demao",
      "categoria": "Pintura",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-PINT-01",
      "responsavel": null,
      "data_prevista": null,
      "data_conclusao": null,
      "aliases": ["segunda demao", "acabamento de pintura", "retoque final"]
    },
    {
      "id_servico": "SRV-015",
      "nome": "Limpeza Final",
      "categoria": "Limpeza",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-LIM-01",
      "responsavel": null,
      "data_prevista": null,
      "data_conclusao": null,
      "aliases": ["limpeza", "faxina", "limpeza pos-obra"]
    },
    {
      "id_servico": "SRV-016",
      "nome": "Coordenacao e Liberacao Final",
      "categoria": "Administracao",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-ADM-01",
      "responsavel": null,
      "data_prevista": null,
      "data_conclusao": null,
      "aliases": ["coordenacao", "vistoria final", "liberacao"]
    }
  ]
}
```

## Modo de Resposta

Durante a conversa:
- fazer perguntas objetivas apenas se faltarem dados criticos
- sugerir organizacao quando o material vier confuso
- consolidar premissas explicitamente antes da versao final

Quando o gestor pedir o JSON final:
- responder com apenas um bloco JSON
- nao incluir explicacoes
- nao incluir markdown fora do bloco JSON
