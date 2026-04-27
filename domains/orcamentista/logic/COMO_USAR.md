# Manual de Uso do Orcamentista

Este manual explica como usar o `Evis Orcamentista` do inicio ao fim para transformar material bruto de uma obra em um JSON pronto para importacao no `EVIS Obra`.

---

## 1. O que e o Orcamentista

O Orcamentista e o nucleo do EVIS usado **antes** da obra entrar em operacao.

Funcao principal:

- receber material bruto de um projeto
- estruturar a obra com ajuda de IA
- montar servicos, equipes, custos e cronograma
- gerar um JSON padronizado
- entregar esse JSON para importacao no `EVIS Obra`

Resumo simples:

- `Orcamentista` prepara
- `EVIS Obra` executa e acompanha

---

## 2. Quando usar

Use o Orcamentista quando voce precisar:

- montar um orcamento novo
- transformar uma proposta em estrutura operacional
- organizar servicos e equipes previstas
- criar cronograma inicial
- exportar JSON compativel com o EVIS

Nao use o Orcamentista para:

- diario de obra
- presenca
- fotos de acompanhamento
- pendencias do dia a dia
- acompanhamento de execucao real

Esses itens pertencem ao `EVIS Obra`.

---

## 3. O que voce precisa ter em maos

O Orcamentista aceita projeto completo ou parcial.

Entradas mais comuns:

- nome da obra
- nome do cliente
- cidade ou endereco
- data prevista de inicio
- prazo desejado
- memorial descritivo, especificacao tecnica ou caderno de acabamentos
- texto copiado de PDF
- planilhas de quantitativos, listas de servicos, levantamentos ou propostas
- proposta comercial
- lista preliminar de servicos
- informacoes de equipes ou fornecedores

Quanto melhor o material de entrada, melhor o resultado.

Se o projeto estiver incompleto, o fluxo pode seguir por estimativa, desde que isso fique explicito.

---

## 4. Arquivos principais da pasta

Use estes arquivos como base:

| Arquivo | Funcao |
| --- | --- |
| `SKILL_ORQUESTRADOR.md` | ponto de entrada principal do fluxo |
| `docs/SCHEMA_JSON_EVIS.md` | schema oficial do JSON |
| `docs/REGRAS_DE_NEGOCIO.md` | padroes e regras do modelo |
| `docs/REFERENCIAS_TECNICAS.md` | apoio tecnico de construcao |
| `templates/TEMPLATE_ORCAMENTO_COMPLETO_V3.json` | template principal de referencia |
| `exemplos/exemplo-estimativa.md` | exemplo com projeto incompleto |
| `exemplos/exemplo-executivo.md` | exemplo com projeto completo |

Observacao:

- `templates/TEMPLATE_IMPORT_OBRA_V2.json`
- `templates/TEMPLATE_IMPORTACAO_OBRA.json`

ficam como referencia historica, nao como ponto de partida principal.

---

## 5. Como iniciar um novo orcamento

### Passo 1: duplicar a pasta base

Copie a pasta:

`../Orçamentos_2026/Orcamentista_base/`

para dentro de:

`../Orçamentos_2026/`

com um novo nome de trabalho, por exemplo:

`ORC_2026-001_Casa_Joao`

Atalho opcional:

```powershell
./nova-obra.bat -NomeObra "Casa Joao" -Cliente "Joao e Maria"
```

Ou:

```powershell
npm run orc:nova -- -NomeObra "Casa Joao" -Cliente "Joao e Maria"
```

### Passo 2: abrir a pasta duplicada no agente local

Abra o projeto EVIS em uma interface local de agentes, como Antigravity, mantendo a pasta da obra dentro de `Orçamentos_2026/`.

### Passo 3: usar o prompt inicial do agente

Copie o conteudo de:

`PROMPT_INICIAL_AGENTE.md`

da pasta duplicada e use como abertura da sessao.

### Passo 4: enviar o material bruto

Depois da skill, envie:

- texto do projeto
- resumo do escopo
- planilha
- informacoes do cliente
- prazo desejado
- qualquer observacao importante

### Passo 5: conduzir por etapas

O fluxo correto nao e one-shot.

Ele deve acontecer em etapas com validacao humana obrigatoria:

1. leitura do projeto
2. quantitativos
3. composicao de custos
4. BDI e encargos
5. cronograma fisico-financeiro
6. exportacao do JSON final

### Regra operacional nova

O orcamento em andamento deve viver nos arquivos locais da pasta duplicada.

Pasta oficial dos trabalhos reais:

- `../Orçamentos_2026/`

Arquivos principais da memoria do orcamento:

- `00_BRIEFING.md`
- `01_MEMORIA_ORCAMENTO.json`
- `02_ANALISE_PROJETO.md`
- `03_QUANTITATIVOS.md`
- `04_COMPOSICAO_CUSTOS.md`
- `05_BDI_ENCARGOS.md`
- `06_CRONOGRAMA.md`
- `07_ENTREGA_JSON.md`

O Supabase nao e a memoria principal do orcamento em andamento.

O Supabase deve ser usado para:

- consultar referencias EVIS
- consultar SINAPI
- consultar historico real e cotacoes
- promover itens reutilizaveis depois da validacao

Regra estrutural:

- `Orçamentos_2026/Orcamentista_base` = molde
- `Orçamentos_2026/` = obras reais em andamento
- `orcamentista/` = nucleo oficial de skills, docs e regras

## Como anexar arquivos para leitura

Dentro de cada copia da pasta base, coloque os materiais em:

- `anexos/projeto/`
- `anexos/fornecedores/`
- `anexos/referencias/`

O agente deve inspecionar essas pastas automaticamente e preencher o inventario em `00_BRIEFING.md`.

Recomendacao de prioridade de leitura:

1. PDF
2. imagens
3. planilhas e tabelas
4. texto

Definicoes:

- `memorial` = memorial descritivo, especificacao tecnica, escopo ou caderno de acabamentos
- `planilha` = qualquer arquivo de quantitativos, lista de servicos, proposta comercial ou levantamento em XLSX, CSV ou PDF tabular

---

## 6. Regra mais importante: HITL obrigatorio

O Orcamentista foi desenhado para funcionar com `Human-in-the-Loop`.

Isso significa:

- a IA apresenta rascunho
- voce revisa
- voce corrige ou aprova
- so depois ela pode seguir

Nunca aceite fluxo que:

- pule etapa sem validacao
- invente BDI automaticamente
- gere tudo sem sua confirmacao
- esconda formulas ou premissas

---

## 7. Fluxo completo de uso

## Etapa 0 - Analise inicial

Objetivo:

- entender o projeto
- listar ambientes
- identificar sistemas
- reconhecer o que esta claro e o que esta faltando

Voce deve validar:

- ambientes
- materiais
- padrao da obra
- se o projeto esta completo ou parcial

Se faltar informacao, a saida deve registrar isso com transparencia.

## Etapa 1 - Quantitativos

Objetivo:

- quebrar a obra em servicos
- calcular quantidades
- documentar formulas e premissas

Voce deve validar:

- servicos faltantes
- servicos redundantes
- unidades
- quantidades
- formulas

Boa pratica:

prefira servicos quebrados em etapas menores.

Exemplo ruim:

- pintura completa

Exemplo melhor:

- preparo de superficie
- massa e correcoes
- 1a demao
- 2a demao

## Etapa 2 - Composicao de custos

Objetivo:

- associar composicoes aos servicos
- usar SINAPI como referencia
- permitir ajuste por fornecedor, mercado ou padrao da obra

Voce deve validar:

- composicao de insumos
- mao de obra
- equipamentos
- valor SINAPI
- valor ajustado
- subtotal de custos diretos

Regra:

SINAPI e referencia, nao imposicao.

### Consulta de referencias de custo

No fluxo atual do EVIS, a consulta de custo nao depende mais de `SINAPI puro`.

A ordem oficial passou a ser:

- `catalogo residencial EVIS`
- `SINAPI direto`
- `SINAPI derivado`
- `cotacao real ou historico`
- `composicao propria`

Se voce estiver usando o MCP do Orcamentista:

- prefira `referencia_buscar`
- `sinapi_buscar` continua funcionando como alias compativel

Na pratica, ambos agora consultam:

1. catalogo EVIS
2. SINAPI oficial como fallback

Quando houver resultado, valide sempre:

- `origem`
- `origem_detalhe`
- `competencia`
- `fonte_preco`
- `custo_referencia`

## Etapa 3 - BDI e encargos

Objetivo:

- aplicar a estrutura do BDI
- consolidar o valor final da obra

Regra critica:

o sistema **nunca** define o BDI sozinho.

Voce precisa informar:

- regime tributario
- percentuais de administracao
- seguro
- risco
- despesas financeiras
- lucro
- impostos

Sem isso, o fluxo nao deve seguir.

## Etapa 4 - Cronograma fisico-financeiro

Objetivo:

- sequenciar os servicos
- distribuir duracoes
- calcular desembolso por periodo

Voce deve validar:

- ordem construtiva
- prazo total
- coerencia entre servicos dependentes
- desembolso mensal
- distribuicao do percentual fisico

## Etapa final - JSON de exportacao

Objetivo:

- consolidar tudo em um unico JSON
- deixar pronto para importacao no EVIS

Antes de aceitar a entrega final, valide:

- _meta
- obra
- bdi_detalhamento
- equipes
- servicos
- cronograma_financeiro

---

## 8. O que o JSON final deve conter

Estrutura esperada:

```json
{
  "_meta": {},
  "obra": {},
  "bdi_detalhamento": {},
  "equipes": [],
  "servicos": [],
  "cronograma_financeiro": []
}
```

Nao deve conter:

- `pendencias`
- `notas`
- `diario`
- `fotos`
- `presenca`

Esses blocos surgem depois, ja dentro do `EVIS Obra`.

---

## 9. Regras praticas de validacao

Antes de fechar o trabalho, confira:

- `obra.id` no formato coerente
- `obra.valor_total_com_bdi` consistente com os custos diretos + BDI
- servicos com `codigo_servico` no formato `N.M`, como `1.1`, `1.2`, `1.3`
- equipes com codigo consistente
- todos os servicos com campo `equipe` valido (`"EQ-XXX-00"`), `null` ou `"a-definir"`
- datas `data_inicio` e `data_fim` em `YYYY-MM-DD`
- composicoes com `mat_unit`, `mo_unit`, `total_unit`, `origem` e `competencia`
- cronograma financeiro coerente com o valor final
- JSON sem comentarios e sem texto fora da estrutura

Se precisar validar em profundidade, use:

- `docs/SCHEMA_JSON_EVIS.md`
- `docs/REGRAS_DE_NEGOCIO.md`

---

## 10. Como usar os templates

O template principal hoje e:

`templates/TEMPLATE_ORCAMENTO_COMPLETO_V3.json`

Use para:

- comparar formato
- validar nomes de blocos
- conferir nivel de detalhamento esperado

Nao use template como substituto da skill.

A ordem correta e:

1. skill
2. validacao por etapa
3. schema
4. template
5. JSON final

---

## 11. Como usar os exemplos

Os exemplos existem para calibrar profundidade e linguagem.

### `exemplos/exemplo-estimativa.md`

Use quando:

- o projeto estiver incompleto
- voce quiser validar orcamento por estimativa
- ainda faltarem projetos complementares

### `exemplos/exemplo-executivo.md`

Use quando:

- o projeto estiver mais completo
- voce precisar de composicao mais robusta
- quiser referencia de nivel executivo

---

## 12. Perguntas uteis para conduzir a IA

Voce pode usar comandos como:

```text
Leia este material e apresente apenas a analise inicial em tabelas.
```

```text
Monte os quantitativos, mas aguarde minha validacao antes de avancar.
```

```text
Use SINAPI como referencia e destaque onde houver ajuste manual.
```

```text
Busque referencias de custo priorizando o catalogo EVIS e use SINAPI como fallback.
```

```text
Nao defina o BDI. Primeiro me apresente a estrutura e aguarde meus percentuais.
```

```text
Monte o cronograma fisico-financeiro com base nos servicos validados.
```

```text
Agora gere o JSON final no schema EVIS.
```

---

## 13. Erros comuns que devem ser evitados

Nao aceite quando a IA:

- pula da leitura direto para o JSON
- cria BDI sem sua autorizacao
- entrega servicos muito genericos
- nao mostra formulas
- nao separa composicao em `insumos`, `mao_de_obra` e `equipamentos`
- entrega cronograma sem coerencia construtiva
- mistura dados do Orcamentista com dados operacionais do EVIS Obra

---

## 14. Entrega final para o EVIS Obra

Quando o JSON estiver validado:

1. entregue o arquivo final
2. leve para o `EVIS Obra`
3. use o caminho:

`CONFIG -> Inicializar Projeto (JSON)`

Depois disso, a gestao continua no sistema operacional da obra.

---

## 15. Checklist final de uso

- [ ] Abri um chat novo
- [ ] Colei `SKILL_ORQUESTRADOR.md`
- [ ] Enviei o material bruto da obra
- [ ] Validei a analise inicial
- [ ] Validei os quantitativos
- [ ] Validei a composicao de custos
- [ ] Defini explicitamente o BDI
- [ ] Validei o cronograma fisico-financeiro
- [ ] Revisei o JSON final
- [ ] Confirmei schema, IDs e datas
- [ ] Entreguei para importacao no `EVIS Obra`

---

## 16. Resumo de operacao

Se voce quiser a versao mais curta possivel, use esta logica:

1. cole a skill
2. mande o material
3. valide cada etapa
4. defina o BDI manualmente
5. gere o JSON final
6. importe no EVIS Obra

Esse e o fluxo oficial recomendado do Orcamentista.
