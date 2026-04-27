# Orcamentista Base

Esta pasta e o molde oficial para criar um novo orcamento do `EVIS Orcamentista` dentro do proprio projeto EVIS, como uma interface tipo Antigravity.

Uso recomendado:

1. Duplicar esta pasta para dentro de `../`, por exemplo:
   `../ORC_2026-001_Casa_Joao`
2. Abrir o projeto EVIS no agente local.
3. Alimentar o agente com o arquivo `PROMPT_INICIAL_AGENTE.md`.
4. Trabalhar etapa por etapa, salvando tudo na pasta da obra dentro de `Orçamentos_2026/`.
5. Promover para o Supabase apenas o que for reutilizavel ou aprovado como referencia do sistema.

## Estrutura

| Arquivo / pasta | Funcao |
| --- | --- |
| `PROMPT_INICIAL_AGENTE.md` | prompt de abertura para o agente local |
| `00_BRIEFING.md` | entrada inicial da obra |
| `01_MEMORIA_ORCAMENTO.json` | memoria estruturada do orcamento em andamento |
| `02_ANALISE_PROJETO.md` | leitura inicial validada |
| `03_QUANTITATIVOS.md` | servicos, unidades, quantidades e formulas |
| `04_COMPOSICAO_CUSTOS.md` | referencias, custos e ajustes |
| `05_BDI_ENCARGOS.md` | BDI e encargos definidos pelo usuario |
| `06_CRONOGRAMA.md` | cronograma fisico-financeiro |
| `07_ENTREGA_JSON.md` | resumo final e checklist de exportacao |
| `output/orcamento_final.json` | saida final do orcamento |
| `anexos/projeto/` | PDF, imagens, memoriais descritivos, especificacoes e planilhas do projeto |
| `anexos/fornecedores/` | cotacoes, propostas e listas comerciais |
| `anexos/referencias/` | apoio tecnico local |
| `decisoes/` | registros curtos de validacoes e ajustes do usuario |
| `referencias/` | apoio local para consulta durante o orcamento |

## Regras operacionais

- o historico do orcamento vive nesta pasta
- o agente deve editar os arquivos locais, nao depender de memoria longa do chat
- o Supabase e base de referencia, nao memoria do orcamento em andamento
- item novo e pontual fica no orcamento local
- item reutilizavel pode ser promovido depois para `sugestoes_catalogo` ou `catalogo_servicos_evis`
- o orcamento deve nascer dentro da pasta raiz `Orçamentos_2026/`, para manter acesso ao nucleo oficial `orcamentista/`

## Como anexar arquivos para leitura

Use esta estrutura:

- `anexos/projeto/`
- `anexos/fornecedores/`
- `anexos/referencias/`

O agente deve inspecionar automaticamente essas pastas e preencher o inventario em `00_BRIEFING.md`.

Definicoes praticas:

- `memorial` = memorial descritivo, especificacao tecnica, escopo ou caderno de acabamentos
- `planilha` = qualquer arquivo de quantitativos, lista de servicos, proposta comercial ou levantamento em XLSX, CSV ou PDF tabular

Exemplo de inventario gerado pelo agente:

| Arquivo | Tipo | Uso |
| --- | --- | --- |
| projeto_arquitetonico.pdf | projeto | leitura principal |
| memorial_descritivo.pdf | projeto | apoio tecnico |
| cotacao_esquadrias.pdf | fornecedor | ajuste de custo |
| referencia_acabamento.pdf | referencia | padrao da obra |

## O que sobe para o Supabase

Somente quando fizer sentido:

- item recorrente e reutilizavel
- nova composicao validada
- preco real relevante
- cotacao aprovada

## O que fica so no orcamento local

- itens exclusivos da obra
- agrupamentos comerciais do cliente
- descricoes muito especificas
- premissas pontuais e solucoes temporarias
