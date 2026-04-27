# Regras de Negocio do Orcamentista

Estas sao as regras que devem ser seguidas para gerar um JSON consistente e facil de importar no EVIS Obra.

## 1. Geracao de IDs da obra

Padrao:

```text
obra-{nome-simplificado}-{ano}
```

Exemplo:

```text
Reforma Loja ABC - 2026
-> obra-reforma-loja-abc-2026
```

Boas praticas:
- usar letras minusculas
- trocar espacos por hifens
- remover acentos
- evitar caracteres especiais

## 2. Codigo dos servicos

Padrao:

```text
1.0 - PRELIMINARES
1.1
1.2
2.0 - DEMOLICOES
2.1
```

Regras:
- usar `codigo_servico` no formato `N.M`
- `N.0` e apenas cabecalho visual da etapa/categoria
- servicos reais comecam em `N.1`
- `codigo_servico` deve ser unico por obra
- nao usar mais `SRV-*` como padrao oficial
- todos os itens da mesma etapa `N` devem compartilhar a mesma categoria

## 3. Codigos das equipes

Padrao:

```text
EQ-{TIPO}-{NN}
```

Exemplos:
- `EQ-OBR-01`
- `EQ-ELET-01`
- `EQ-HIDR-01`
- `EQ-PINT-01`
- `EQ-ACO-01`
- `EQ-PPCI-01`

Tipos mais usados:
- `EQ-OBR`: obra civil, alvenaria, demolicao, apoio geral
- `EQ-ELET`: eletrica
- `EQ-HIDR`: hidraulica
- `EQ-PINT`: pintura
- `EQ-ACO`: ar-condicionado
- `EQ-PPCI`: incendio e PPCI
- `EQ-DRY`: drywall e forro
- `EQ-MAR`: marcenaria
- `EQ-LIM`: limpeza
- `EQ-LOG`: logistica
- `EQ-ADM`: administracao e coordenacao

## 4. Categorias validas de servicos

Prefira sempre uma destas categorias:
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

Exemplos de associacao:
- isolamento, tapume, protecao -> `Preliminares`
- retirada, quebra, remocao -> `Demolicoes`
- cabos, tomadas, luminarias -> `Eletrica`
- drenos, dutos, evaporadora -> `Ar-condicionado`
- massa, lixamento, demaos -> `Pintura`

## 5. Relacionamento servico e equipe

Regra obrigatoria:
- todo servico precisa apontar para uma equipe

Campo usado:

```json
"equipe": "EQ-ELET-01"
```

Se houver duvida:
- escolha a equipe mais aderente a especialidade
- nao entregue servico sem equipe no JSON final

## 6. Aliases

Aliases sao palavras alternativas para facilitar reconhecimento por IA.

### Aliases de servicos

Exemplo:

```text
Instalacao Eletrica
-> ["eletrica", "fiacao", "pontos de luz", "tomadas"]
```

### Aliases de equipes

Exemplo:

```text
Construtora Silva
-> ["silva", "construtora", "pedreiro"]
```

Boas praticas:
- usar termos curtos
- incluir sinonimos comuns
- incluir nomes reduzidos
- evitar frases longas

## 7. Status validos

### Obra

Valores validos:
- `ATIVA`
- `PAUSADA`
- `CONCLUIDA`
- `CANCELADA`

### Servicos

Valores validos:
- `nao_iniciado`
- `em_andamento`
- `concluido`
- `pausado`

### Equipes

Uso recomendado:
- `status: "ativo"`
- `ativo: true`

## 8. Defaults recomendados

Quando a informacao nao existir, usar:
- `obra.status = "Planejada"`
- `servicos.status = "nao_iniciado"`
- `servicos.equipe = null` quando nao definida
- `servicos.data_inicio = null` quando nao definida
- `servicos.data_fim = null` quando nao definida
- `equipes.ativo = true`
- `equipes.aliases = []`

## 9. Datas

Formato correto:

```text
YYYY-MM-DD
```

Exemplos:
- `2026-03-01`
- `2026-04-15`

Se nao houver data confiavel:
- use `null` quando fizer sentido
- nao invente data sem combinar com o gestor

## 10. Checklist final

Antes de entregar:
- [ ] obra com `id` e `nome`
- [ ] equipes com `cod` e `nome`
- [ ] servicos com `codigo_servico` e `nome`
- [ ] servicos ligados a equipes
- [ ] `codigo_servico` unico por obra
- [ ] status validos
- [ ] datas em formato ISO
- [ ] JSON limpo e valido
