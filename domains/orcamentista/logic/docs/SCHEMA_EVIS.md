# Schema EVIS para o Orcamentista

Este documento explica apenas o que o orcamentista precisa saber para montar o JSON de importacao.

Voce nao precisa conhecer SQL, banco de dados ou backend.

## O que entra no JSON inicial

Na fase de orcamento, foque em 3 blocos:
- `obra`
- `equipes`
- `servicos`

## O que fica para depois, no EVIS Obra

Esses itens surgem durante a operacao da obra e nao precisam entrar no JSON inicial:
- pendencias
- notas
- diario de obra
- presenca
- fotos

## Bloco 1: Obra

A obra representa o projeto principal.

Campos mais importantes:
- `id`: identificador do projeto para importacao
- `nome`: nome da obra
- `cliente`: nome do cliente
- `status`: normalmente `ATIVA`
- `data_inicio`: data prevista de inicio
- `data_fim`: data final ou `null`
- `descricao`: resumo da obra

Obrigatorios:
- `id`
- `nome`

Importante:
- no banco real existe UUID interno
- no JSON do orcamentista use o ID legivel, por exemplo `obra-reforma-loja-abc-2026`

## Bloco 2: Equipes

As equipes representam fornecedores, empreiteiros ou frentes de trabalho.

Campos mais importantes:
- `cod`: codigo da equipe
- `nome`: nome da equipe ou fornecedor
- `funcao`: especialidade
- `telefone`
- `email`
- `pix`
- `contato`
- `status`
- `ativo`
- `aliases`

Obrigatorios:
- `cod`
- `nome`

Exemplo:

```json
{
  "cod": "EQ-ELET-01",
  "nome": "Eletrotecnica Luz",
  "funcao": "Instalacoes Eletricas",
  "ativo": true,
  "aliases": ["luz", "eletrica", "eletricista"]
}
```

## Bloco 3: Servicos

Os servicos representam o que sera executado na obra.

Campos mais importantes:
- `codigo_servico`
- `nome`
- `categoria`
- `avanco_atual`
- `status`
- `equipe`
- `responsavel`
- `data_prevista`
- `data_conclusao`
- `aliases`

Obrigatorios:
- `codigo_servico`
- `nome`

Recomendacao pratica:
- sempre preencher tambem `categoria`
- sempre preencher tambem `equipe`

Exemplo:

```json
{
  "codigo_servico": "1.1",
  "nome": "Instalacao Eletrica",
  "categoria": "Eletrica",
  "avanco_atual": 0,
  "status": "nao_iniciado",
  "equipe": "EQ-ELET-01",
  "responsavel": null,
  "data_prevista": "2026-03-15",
  "data_conclusao": null,
  "aliases": ["eletrica", "fiacao", "tomadas"]
}
```

## Defaults mais comuns

Use estes valores quando a informacao nao vier do material bruto:
- `obra.status`: `ATIVA`
- `obra.data_fim`: `null`
- `servicos.avanco_atual`: `0`
- `servicos.status`: `nao_iniciado`
- `servicos.data_conclusao`: `null`
- `equipes.ativo`: `true`
- `aliases`: `[]`

## Regras simples para nao errar

- cada servico deve ter uma equipe
- cada equipe deve ter um codigo unico
- cada servico deve ter um `codigo_servico` unico no formato `N.M`
- datas devem estar em `YYYY-MM-DD`
- o JSON final deve sair limpo, sem explicacao junto

## Ordem mental correta

Pense sempre assim:
1. Qual e a obra
2. Quais equipes vao executar
3. Quais servicos serao feitos
4. Quem faz cada servico
5. Quando cada servico deve acontecer
