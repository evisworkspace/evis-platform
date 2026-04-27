# Especificacao Fechada - Codigo de Servico

> Status: aprovado para o repositorio  
> Escopo: Orcamentista + app EVIS + importacao/exportacao + relatorios + diario

---

## 1. Objetivo

Padronizar a identificacao dos servicos do orcamento com uma regra unica, legivel e orientada a estrutura do orcamento.

Esta especificacao substitui o uso de codigos sequenciais do tipo `SRV-001` como regra oficial para novos servicos.

---

## 2. Decisoes Obrigatorias

### 2.1 Campo interno

- `id` permanece como identificador interno do registro
- tipo: `UUID`
- invisivel para o usuario
- imutavel
- usado para banco, sincronizacao, update e relacoes internas

### 2.2 Campo de negocio

- `id_servico` deve ser renomeado para `codigo_servico`
- `codigo_servico` e o codigo oficial do item no orcamento
- `codigo_servico` e unico por obra
- `codigo_servico` e o campo exibido para usuario em telas, relatorios, diario, cronograma e importacao/exportacao

### 2.3 Regra descontinuada

- fica proibida a geracao automatica de codigos no formato `SRV-001`, `SRV-002`, etc
- exemplos, prompts e templates novos nao devem mais usar `SRV-*` como padrao oficial

---

## 3. Nomenclatura dos Campos

### 3.1 Banco e tipos internos

Tabela `servicos`:

- `id`: UUID interno
- `codigo_servico`: texto visivel de negocio

### 3.2 Frontend e backend

Objeto `Servico`:

- `id`: UUID interno
- `codigo_servico`: codigo de exibicao e referencia funcional

### 3.3 JSON de importacao/exportacao

Blocos que referenciam servicos devem usar `codigo_servico`, nao `id`.

Exemplos:

- `servicos[].codigo_servico`
- `equipes[].servicos_atribuidos[]`
- `cronograma_financeiro[].servicos_executados[]`
- referencias em narrativas e relatorios

### 3.4 Regra de compatibilidade temporaria

Durante a migracao:

- leitores podem aceitar `id_servico` como entrada legada
- toda saida nova deve emitir apenas `codigo_servico`

---

## 4. Formato do Codigo

## 4.1 Estrutura oficial

O `codigo_servico` deve seguir a estrutura do orcamento:

```text
1.0 - ETAPA / CATEGORIA
1.1 - primeiro item da etapa
1.2 - segundo item da etapa
1.3 - terceiro item da etapa
...
1.190 - centesimo nonagesimo item da etapa
```

### 4.2 Regra semantica

- parte antes do ponto = numero da etapa
- parte depois do ponto = numero do item dentro da etapa
- `N.0` e reservado exclusivamente para cabecalho de etapa
- servicos reais devem usar apenas `N.M`, com `M >= 1`

### 4.3 Formato valido de servico

Formato valido para servico persistido:

```text
^[1-9]\d*\.[1-9]\d*$
```

Exemplos validos:

- `1.1`
- `1.2`
- `4.17`
- `12.3`
- `12.190`

Exemplos invalidos:

- `0.1`
- `1.0` para servico real
- `01.02`
- `SRV-001`
- `1`
- `1,1`

---

## 5. Regra de Validacao

## 5.1 Validacoes obrigatorias por servico

- `id` deve ser UUID valido
- `codigo_servico` deve obedecer ao padrao `N.M`
- `codigo_servico` deve ser unico dentro da obra
- `categoria` e obrigatoria
- `nome` e obrigatorio

## 5.2 Validacoes obrigatorias por etapa

Para todos os servicos com mesma etapa `N`:

- todos devem compartilhar a mesma `categoria`
- o cabecalho renderizado da etapa deve ser `N.0 - NOME DA CATEGORIA`
- a etapa nao pode misturar categorias diferentes

Exemplo invalido:

- `4.1` categoria `Alvenaria`
- `4.2` categoria `Eletrica`

## 5.3 Regras de sequencia

Enquanto o orcamento estiver em rascunho:

- os itens da etapa devem ser renumerados de forma continua sempre que houver reorganizacao relevante
- a sequencia recomendada por etapa e `1.1`, `1.2`, `1.3` ...

Apos aprovacao:

- lacunas historicas podem existir
- codigos removidos nao devem ser reutilizados
- renumeracao retroativa fica proibida

---

## 6. Regra de Ordenacao

Ordenacao nunca deve ser feita como texto puro.

Deve-se ordenar por:

1. numero da etapa
2. numero do item dentro da etapa

Pseudo-regra:

```text
ordenar por parseInt(parte_antes_do_ponto), depois por parseInt(parte_depois_do_ponto)
```

Exemplo de ordem correta:

```text
1.1
1.2
1.10
2.1
2.2
10.1
```

Exemplo de ordem incorreta por texto:

```text
1.1
1.10
1.2
```

---

## 7. Regra de Agrupamento por Etapa

## 7.1 Agrupamento

Relatorios, tabelas de orcamento e visoes resumidas devem agrupar servicos pela parte inteira do `codigo_servico`.

Exemplo:

- etapa `1`: agrupa `1.1`, `1.2`, `1.3`
- etapa `2`: agrupa `2.1`, `2.2`

## 7.2 Cabecalho renderizado

Cada grupo deve renderizar um cabecalho no formato:

```text
N.0 - Nome da Categoria
```

Exemplos:

- `1.0 - SERVICOS PRELIMINARES`
- `2.0 - DEMOLICOES`
- `4.0 - ALVENARIA E VEDACAO`

## 7.3 Regra de persistencia

O cabecalho `N.0`:

- nao deve ser salvo como servico real
- nao deve entrar em cronograma, diario, medicao ou composicao
- existe apenas como agrupador visual e logico

---

## 8. Regra de Congelamento Apos Aprovacao

## 8.1 Momento do congelamento

`codigo_servico` e editavel apenas durante fase de rascunho/HITL.

O codigo deve ser congelado quando ocorrer qualquer um destes marcos:

1. aprovacao final do orcamento pelo gestor
2. geracao final do JSON marcado como validado
3. liberacao do arquivo para importacao
4. importacao do projeto no EVIS Obra

## 8.2 Efeitos do congelamento

Apos congelamento:

- `codigo_servico` nao pode ser editado manualmente
- nao pode haver renumeracao em massa
- nao pode haver reaproveitamento de codigo antigo
- referencias em diario, relatorios e cronograma devem continuar estaveis

## 8.3 Inclusao tardia de novos servicos

Se for necessario incluir servico novo apos congelamento:

- usar o proximo numero disponivel na etapa
- nao inserir codigo intermediario retroativamente

Exemplo:

Se existem `4.1`, `4.2`, `4.3`, o novo item vira:

```text
4.4
```

Nao vira:

```text
4.2A
4.2.1
4.0
```

---

## 9. Regras de Interface e Uso

## 9.1 Telas

Devem exibir:

- `codigo_servico`

Nao devem exibir como codigo principal:

- `id`

## 9.2 Diario e narrativas

Toda referencia funcional a servico deve usar `codigo_servico`.

Exemplos:

- `4.3 Alvenaria de vedacao concluida`
- `2.2 Remocao de entulho em andamento`

## 9.3 Relatorios

Devem:

- ordenar por etapa/item
- agrupar por etapa
- renderizar cabecalho `N.0 - Nome da Categoria`

## 9.4 Importacao/exportacao

Arquivos JSON e planilhas devem transportar `codigo_servico` como identificador de negocio do servico.

`id` nao deve ser exposto como referencia principal em artefatos externos.

---

## 10. Regras de Migracao no Repositorio

## 10.1 Renomeacao

No repositorio, a nomenclatura alvo e:

- `id_servico` -> `codigo_servico`

## 10.2 Abrangencia minima

A mudanca deve atingir:

- schema e contratos de dados
- tipos TypeScript
- telas
- diario
- cronograma
- relatorios
- importacao/exportacao
- prompts, skills, templates e exemplos

## 10.3 Compatibilidade temporaria

Enquanto houver legado:

- leitura pode mapear `id_servico` para `codigo_servico`
- escrita nova deve produzir apenas `codigo_servico`

---

## 11. Exemplos Oficiais

### 11.1 Estrutura de exibicao

```text
1.0 - SERVICOS PRELIMINARES
1.1 - Mobilizacao de canteiro
1.2 - Protecao de areas
1.3 - Tapume interno

2.0 - DEMOLICOES
2.1 - Remocao de piso existente
2.2 - Retirada de entulho

3.0 - ESTRUTURA
3.1 - Estrutura para suporte da caixa d'agua
```

### 11.2 Modelo de objeto

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "codigo_servico": "4.3",
  "categoria": "Alvenaria e Vedacao",
  "nome": "Contravergas pre-moldadas sob janelas"
}
```

---

## 12. Criterio de Aceite

Esta especificacao esta corretamente implementada quando:

- `id` e sempre UUID interno
- `codigo_servico` substitui `id_servico` como campo oficial
- nao existe nova geracao `SRV-*`
- ordenacao e numerica por etapa/item
- relatorios agrupam por etapa com cabecalho `N.0 - Categoria`
- `codigo_servico` congela apos aprovacao final

---

**Documento normativo para o repositorio EVIS / Orcamentista**
