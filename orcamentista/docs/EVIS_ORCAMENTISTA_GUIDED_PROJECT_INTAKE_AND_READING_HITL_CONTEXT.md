# EVIS ORCAMENTISTA - GUIDED PROJECT INTAKE AND READING HITL CONTEXT

> Fase: 3D-A - Tipos, documento canonico e policy pura  
> Status: contrato tecnico sem mock, sem UI, sem banco e sem IA real  
> Escopo: intake guiado de documentos e contexto HITL de leitura

## 1. Objetivo

Criar a base canonica para o intake guiado do Orçamentista IA.

O sistema deve orientar o usuario na ordem racional dos documentos, permitir leitura isolada quando um arquivo chega fora de ordem e separar contexto validado, pendente e bloqueado antes de qualquer quantitativo final.

Esta subfase cria apenas:

- tipos TypeScript;
- documento canonico;
- policy pura em `guidedProjectIntakePolicy.ts`.

Nao cria painel, mock, utils, banco, migration, OCR ou chamada real de IA.

## 2. Leitura isolada vs leitura contextual

Leitura isolada:

- avalia um documento ou pagina sem depender de toda a historia tecnica;
- pode ser permitida mesmo fora de ordem;
- produz evidencias, riscos e HITLs;
- nao alimenta quantitativos finais quando o contexto anterior esta incompleto.

Leitura contextual:

- usa a sequencia validada da obra;
- propaga fatos aprovados entre fases;
- substitui leituras ambiguas por correcoes humanas;
- permite que fases posteriores dependam de premissas claras.

## 3. Storytelling tecnico da obra

O Orçamentista deve construir a historia tecnica da obra em ordem:

1. entender o que sera construido;
2. entender terreno, implantacao e restricoes;
3. validar fundacao;
4. validar estrutura;
5. validar cobertura, lajes e reservatorios;
6. validar instalacoes;
7. validar seguranca/legalizacao;
8. validar acabamento;
9. compatibilizar;
10. levantar quantitativos;
11. compor custos.

Esse storytelling evita que um item posterior seja tratado como definitivo sem base anterior.

## 4. Ordem racional de documentos

Ordem canonica para obra do zero:

```text
1. Arquitetônico / implantação
2. Sondagem / topografia
3. Estrutural — fundação
4. Estrutural — superestrutura
5. Lajes / cobertura / caixa d’água
6. Hidrossanitário
7. Elétrico / dados / automação
8. PPCI / gás / climatização
9. Memorial de acabamentos
10. Compatibilização
11. Quantitativos
12. Custos
```

O usuario nao precisa enviar tudo de uma vez. O sistema deve solicitar o proximo documento de forma inteligente.

## 5. Documento fora de ordem

Se um documento vier fora de ordem:

```text
allowed_to_read = true
context_status = incomplete
```

Exemplo:

- usuario envia projeto de fundacao antes da sondagem;
- Reader pode ler a fundacao;
- o contexto fica incompleto;
- fundacao nao alimenta quantitativo final;
- sistema solicita sondagem/topografia;
- se houver ambiguidade, gera HITL.

## 6. HITL por leitura

Cada leitura pode gerar HITLs especificos:

- confirmar cota ambigua;
- corrigir valor lido;
- bloquear leitura;
- solicitar documento;
- ativar fallback de projeto ausente;
- manter contexto pendente.

Correcoes humanas substituem leituras ambiguas. Quando o humano corrige uma leitura, o contexto validado deve carregar a correcao, nao a leitura original.

## 7. Contexto validado, pendente e bloqueado

Contexto validado:

- possui fatos aprovados;
- pode alimentar proximas fases;
- pode alimentar quantitativos finais se a fase permitir.

Contexto pendente:

- possui documento lido, mas ainda depende de HITL, documento anterior ou premissa;
- pode orientar leitura preliminar;
- nao alimenta quantitativos finais.

Contexto bloqueado:

- possui erro critico, falta de documento indispensavel ou decisao humana de bloqueio;
- bloqueia propagacao para fases posteriores quando necessario;
- exige acao antes de consolidar.

## 8. Solicitação inteligente do proximo documento

A policy deve responder:

- qual e a fase atual;
- quais documentos sao esperados;
- quais documentos faltam;
- se o proximo documento pode ser solicitado;
- se fallback da Fase 3C pode ser ativado;
- se leitura fora de ordem e permitida.

Mensagem esperada:

```text
Envie o proximo documento recomendado para completar o contexto antes de quantitativos finais.
```

Quando fallback existir:

```text
Você pode seguir com estimativa preliminar controlada, mas envie o projeto executivo para validar a fase.
```

## 9. Integração com Missing Project Fallback

Projetos ausentes acionam a politica da Fase 3C quando aplicavel.

Exemplo:

- projeto eletrico ausente;
- arquitetonico, layout ou memorial disponiveis;
- o EVIS pode usar evidencias indiretas;
- origem obrigatoria: `INDIRECT_EVIDENCE_FROM_PROJECT_DOCUMENTS`;
- exige HITL;
- alimenta apenas orçamento preliminar/proposta com ressalva;
- bloqueia execucao e consolidacao final.

## 10. Exemplo: fundação antes da sondagem

Entrada:

```text
current_phase = arquitetonico_implantacao
documento recebido = projeto de fundacao
detected_phase = estrutural_fundacao
```

Classificacao:

```json
{
  "allowed_to_read": true,
  "out_of_order": true,
  "context_status": "incomplete",
  "can_feed_final_quantities": false,
  "missing_prior_phases": [
    "arquitetonico_implantacao",
    "sondagem_topografia"
  ]
}
```

Resultado:

- leitura pode ocorrer;
- contexto nao propaga para quantitativo final;
- sistema solicita sondagem/topografia;
- HITL valida qualquer dimensao critica.

## 11. Exemplo: projeto eletrico ausente

Se a fase eletrica chega sem projeto proprio:

```text
shouldActivateMissingProjectFallback = true
```

O sistema pode solicitar:

- projeto eletrico executivo;
- premissas do usuario;
- validacao HITL;
- estimativa preliminar controlada por SINAPI/CUB/historico.

Se houver arquitetonico/memorial:

```text
origin_type = INDIRECT_EVIDENCE_FROM_PROJECT_DOCUMENTS
```

Nunca classificar como:

```text
IDENTIFIED_FROM_PROJECT
IDENTIFIED_FROM_ELECTRICAL_PROJECT
```

## 12. Nao escopo da Fase 3D-A

- Nao criar painel.
- Nao criar mock.
- Nao criar utils.
- Nao integrar em `OrcamentistaTab.tsx`.
- Nao chamar IA real.
- Nao processar PDF real.
- Nao gravar no banco.
- Nao criar migration.
- Nao alterar Obra/Diario.

## 13. Proxima subfase

A proxima subfase recomendada e 3D-B:

```text
mock + utils
```

Somente depois disso deve ser considerada qualquer UI ou integracao visual.
