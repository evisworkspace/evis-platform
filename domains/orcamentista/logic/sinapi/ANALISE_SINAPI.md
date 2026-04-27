# Analise da Base SINAPI

## Decisao Adotada

Escopo validado para esta primeira versao:
- usar apenas a UF `PR`
- usar apenas o regime `SEM DESONERACAO`
- importar composições da SINAPI para consulta no projeto Orcamentista

Fonte principal escolhida:
- `SINAPI_Referência_2026_03.xlsx`, aba `CSD`

Fontes complementares:
- `SINAPI_Referência_2026_03.xlsx`, aba `Analítico`
- `SINAPI_mao_de_obra_2026_03.xlsx`, aba `SEM Desoneração`
- `SINAPI_Manutenções_2026_03.xlsx`, aba `Manutenções`

Arquivo analisado mas nao usado na tabela principal desta versao:
- `SINAPI_familias_e_coeficientes_2026_03.xlsx`

## Arquivos Oficiais Encontrados

### 1. SINAPI_Referência_2026_03.xlsx

Abas relevantes:
- `CSD`: custos de composições com encargos sociais sem desoneração
- `Analítico`: composicao analitica dos itens

Dados observados:
- `CSD` traz uma linha por composicao
- o codigo da composicao vem como formula `HYPERLINK`, entao precisa ser extraido da formula
- o valor para `PR` fica na coluna identificada por `PR` na linha de UFs
- o `%AS` de `PR` fica na coluna seguinte

Contagem relevante:
- composições unicas em `CSD`: `10.284`
- composições principais em `Analítico`: `10.284`
- itens analiticos em `Analítico`: `54.529`

### 2. SINAPI_mao_de_obra_2026_03.xlsx

Aba usada:
- `SEM Desoneração`

Dados observados:
- percentual de mao de obra por composicao e por UF
- coluna `PR` confirmada e preenchida

Contagem relevante:
- composições unicas com percentual de mao de obra em `SEM Desoneração`: `8.239`
- interseccao com `CSD`: `8.239`

### 3. SINAPI_Manutenções_2026_03.xlsx

Dados observados:
- lista manutencoes de `COMPOSICAO` e `INSUMO`
- pode enriquecer a tabela principal com historico/resumo de manutencoes do mes

Contagem relevante:
- registros de `COMPOSICAO`: `24.269`
- composições unicas em manutencoes: `15.437`
- interseccao com `CSD`: `9.712`

### 4. SINAPI_familias_e_coeficientes_2026_03.xlsx

Dados observados:
- relatorio de familias e coeficientes por insumo
- util para futuras tabelas auxiliares
- nao e necessario para a primeira versao da tabela de composicoes `PR sem desoneracao`

## Colunas Reais Utilizadas

### Fonte 1: CSD

Arquivo:
- `SINAPI_Referência_2026_03.xlsx`

Planilha:
- `CSD`

Cabecalho real:
- linha `9`: UFs
- linha `10`: nomes dos campos

Mapeamento:

| Origem Excel | Nome no banco | Tipo PostgreSQL | Observacao |
|---|---|---|---|
| `Grupo` | `categoria` | `TEXT` | grupo principal da composicao |
| `Código da Composição` | `codigo` | `TEXT` | extraido da formula HYPERLINK |
| `Descrição` | `descricao` | `TEXT` | descricao da composicao |
| `Unidade` | `unidade` | `TEXT` | unidade da composicao |
| `PR -> Custo (R$)` | `valor_unitario` | `NUMERIC(12,2)` | custo da composicao no PR |
| `PR -> %AS` | `percentual_atribuido_sp` | `NUMERIC(10,4)` | percentual atribuido a SP |

### Fonte 2: Analítico

Arquivo:
- `SINAPI_Referência_2026_03.xlsx`

Planilha:
- `Analítico`

Cabecalho real:
- linha `10`

Mapeamento:

| Origem Excel | Nome no banco | Tipo PostgreSQL | Observacao |
|---|---|---|---|
| `Código da Composição` | `codigo` | `TEXT` | vinculo com a composicao principal |
| `Tipo Item` | `tipo_item` | `TEXT` | COMPOSICAO ou INSUMO |
| `Código do Item` | `codigo_item` | `TEXT` | item filho |
| `Descrição` | `descricao_item` | `TEXT` | descricao do item filho |
| `Unidade` | `unidade_item` | `TEXT` | unidade do item |
| `Coeficiente` | `coeficiente` | `NUMERIC` | coeficiente do item |
| `Situação` | `situacao` | `TEXT` | COM CUSTO, COM PRECO etc |

Uso na modelagem:
- armazenar os itens analiticos em `composicao JSONB`
- armazenar a situacao da composicao em `situacao`

### Fonte 3: Mao de obra

Arquivo:
- `SINAPI_mao_de_obra_2026_03.xlsx`

Planilha:
- `SEM Desoneração`

Mapeamento:

| Origem Excel | Nome no banco | Tipo PostgreSQL | Observacao |
|---|---|---|---|
| `Grupo` | `categoria_mao_de_obra` | `TEXT` | usado apenas para conferencias |
| `Código da Composição` | `codigo` | `TEXT` | vinculo com a composicao |
| `PR` | `percentual_mao_de_obra` | `NUMERIC(10,4)` | percentual para PR |

### Fonte 4: Manutenções

Arquivo:
- `SINAPI_Manutenções_2026_03.xlsx`

Planilha:
- `Manutenções`

Mapeamento:

| Origem Excel | Nome no banco | Tipo PostgreSQL | Observacao |
|---|---|---|---|
| `Referência` | `competencia_evento` | `DATE` | data do evento |
| `Tipo` | `tipo_registro` | `TEXT` | filtrar `COMPOSICAO` |
| `Código` | `codigo` | `TEXT` | vinculo com composicao |
| `Descrição` | `descricao_evento` | `TEXT` | descricao do item |
| `Manutenção` | `manutencao` | `TEXT` | descricao da alteracao |

Uso na modelagem:
- armazenar eventos em `manutencoes JSONB`

## Qualidade dos Dados

### Pontos positivos

- estrutura consistente nas planilhas oficiais
- `PR` identificado e preenchido nas bases relevantes
- forte aderencia entre `CSD` e `Analítico`
- percentual de mao de obra disponivel para boa parte das composicoes

### Pontos de atencao

- `CSD` usa formula HYPERLINK para exibir o codigo, nao valor simples
- nem toda composicao de `CSD` aparece na planilha de mao de obra
- ha composicoes com custo `0` e/ou `%AS` nulo
- a aba `Manutenções` contem insumos e composicoes; precisa filtrar

## Modelagem Recomendada

Tabela principal:
- `public.sinapi_composicoes`

Registro unico por:
- `codigo`
- `uf`
- `regime_desoneracao`
- `competencia`

Campos prioritarios:
- `codigo`
- `descricao`
- `descricao_tsv`
- `unidade`
- `categoria`
- `uf`
- `regime_desoneracao`
- `competencia`
- `valor_unitario`
- `percentual_atribuido_sp`
- `percentual_mao_de_obra`
- `situacao`
- `composicao`
- `manutencoes`

## Busca Textual no Supabase

Correcao aplicada no DDL para compatibilidade com Supabase PostgreSQL:
- a expressao do indice FTS nao usa mais `to_tsvector(...)` diretamente no `CREATE INDEX`
- foi adicionada a coluna gerada `descricao_tsv`
- essa coluna e recalculada automaticamente a partir de `descricao`
- o indice GIN agora fica sobre `descricao_tsv`

Ponto importante:
- o erro `functions in index expression must be marked IMMUTABLE` vinha do uso de `unaccent(...)` dentro da expressao indexada
- para manter busca sem acentos, foi criada a funcao `public.sinapi_normalize_text(...)`, marcada como `IMMUTABLE`
- a coluna `descricao_tsv` usa `to_tsvector('portuguese', public.sinapi_normalize_text(descricao))`

Exemplo de consulta FTS:

```sql
SELECT codigo, descricao, unidade, valor_unitario
FROM public.sinapi_composicoes
WHERE descricao_tsv
      @@ plainto_tsquery('portuguese', public.sinapi_normalize_text('demolicao'))
  AND uf = 'PR'
  AND regime_desoneracao = 'SEM_DESONERACAO'
LIMIT 10;
```

## Conclusao

Para o objetivo atual do Orcamentista, a melhor base e:
- `PR`
- `SEM DESONERACAO`
- custo vindo de `CSD`
- estrutura analitica vinda de `Analítico`

Essa combinacao entrega uma tabela forte para:
- busca textual por descricao
- consulta por codigo
- valor unitario de referencia
- leitura da composicao analitica
- apoio a IA na montagem de orcamentos
