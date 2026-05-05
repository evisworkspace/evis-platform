# EVIS ORCAMENTISTA - MISSING PROJECT FALLBACK POLICY

> Fase: 3C - Missing Project Fallback & Estimated Scope Policy  
> Status: contrato tecnico implementado como funcoes puras, mocks e UI local  
> Escopo: estimativas controladas sem banco, sem IA real e sem consolidacao oficial

## 1. Objetivo

Permitir que o Orçamentista IA continue um orçamento preliminar quando uma disciplina nao possui projeto proprio, sem transformar estimativa em fato.

A politica define:

- quando o projeto ausente permite estimativa preliminar;
- quando o projeto ausente bloqueia execucao;
- quando exige HITL;
- quais origens podem ser usadas;
- como registrar evidencia indireta;
- como avisar usuario e proposta futura;
- como impedir consolidacao final sem ressalva.

## 2. Conceitos

### Projeto lido

Informacao extraida do projeto especifico da disciplina. Exemplo: ponto de tomada lido no projeto eletrico.

Origem permitida:

```text
IDENTIFIED_FROM_DISCIPLINE_PROJECT
IDENTIFIED_FROM_ELECTRICAL_PROJECT
```

### Inferencia

Hipotese derivada de uma leitura, sem fonte direta suficiente. Nunca e fato.

### Estimativa sem projeto

Valor preliminar criado quando o projeto especifico nao existe. Pode usar SINAPI, CUB, historico interno, referencia tecnica ou evidencias indiretas.

Origem:

```text
ESTIMATED_WITHOUT_PROJECT
```

### Premissa manual

Valor ou criterio informado pelo usuario ou assumido explicitamente.

Origem:

```text
MANUAL_ASSUMPTION
```

### Evidencia indireta

Evidencia extraida de outros documentos do mesmo projeto/orcamento, quando a disciplina propria esta ausente.

Origem obrigatoria:

```text
INDIRECT_EVIDENCE_FROM_PROJECT_DOCUMENTS
```

Essa origem nunca pode ser classificada como:

```text
IDENTIFIED_FROM_PROJECT
IDENTIFIED_FROM_ELECTRICAL_PROJECT
```

### Exclusao

Escopo removido do orçamento por decisao explicita.

Origem:

```text
EXCLUDED_FROM_SCOPE
```

## 3. Regra geral

Projeto ausente nao bloqueia automaticamente o orçamento preliminar.

Projeto ausente bloqueia:

- execucao;
- consolidacao final sem ressalva;
- classificacao como item identificado;
- uso como verdade tecnica definitiva.

Todo item sem projeto deve exibir:

```text
Estimado sem projeto. Revisar após recebimento do projeto executivo.
```

Quando usar documentos indiretos, deve exibir:

```text
Estimado sem projeto específico, com base em evidências indiretas de outros documentos e referências técnicas. Revisar após recebimento do projeto executivo.
```

## 4. Decisoes permitidas ao usuario

Quando projeto estiver ausente, a UI deve permitir:

- estimar por referência técnica;
- solicitar projeto;
- excluir escopo;
- inserir verba manual;
- manter pendente.

Na Fase 3C essas decisoes sao estado local/mockado e nao gravam no banco.

## 5. Disciplinas

### Arquitetonico

Ausencia bloqueia o inicio racional da obra.

Motivo:

- faltam areas;
- faltam ambientes;
- faltam referencias base para outras disciplinas.

Fallback:

- nao permitido para escopo principal;
- solicitar projeto ou manter pendente.

### Sondagem

Ausencia nao bloqueia orçamento preliminar geral, mas bloqueia validacao de fundacao.

Permitido:

- verba tecnica preliminar;
- premissa manual com HITL.

Bloqueia:

- execucao;
- fundacao definitiva;
- consolidacao final.

### Estrutural

Ausencia bloqueia orçamento estrutural detalhado.

Permitido:

- verba tecnica preliminar por CUB/SINAPI/historico;
- sem detalhar aço, concreto, forma ou fundacao como fato.

Exige HITL e bloqueia execucao.

### Eletrico sem projeto

Se o projeto eletrico estiver ausente, mas houver arquitetonico, implantacao, layout, memorial ou interiores, o EVIS pode usar:

- area construida;
- quantidade e tipo de ambientes;
- quantidade de banheiros;
- cozinha, lavanderia, area gourmet e areas externas;
- padrao da obra;
- pontos provaveis por ambiente;
- equipamentos especiais identificados;
- forros, sancas ou luminotecnica indicados;
- memorial ou premissas do cliente.

Origem:

```text
INDIRECT_EVIDENCE_FROM_PROJECT_DOCUMENTS
```

Resultado:

- pode alimentar orçamento preliminar;
- pode alimentar proposta com aviso;
- exige HITL;
- recebe baixa/media confianca;
- bloqueia execucao;
- bloqueia consolidacao final;
- deve ser revisado quando o projeto eletrico executivo for recebido.

### Hidrossanitario sem projeto

Pode estimar por:

- quantidade de banheiros;
- cozinha;
- lavanderia;
- area gourmet;
- areas molhadas;
- loucas/metais citados em memorial;
- pontos provaveis por ambiente;
- SINAPI e historico interno.

Origem:

```text
INDIRECT_EVIDENCE_FROM_PROJECT_DOCUMENTS
ESTIMATED_WITHOUT_PROJECT
```

Nao pode tratar ponto provavel como ponto identificado em projeto hidraulico.

### PPCI sem projeto

PPCI impacta seguranca e legalizacao.

Permitido:

- verba preliminar;
- solicitação de projeto;
- manter pendente ou excluir escopo com decisao explicita.

Bloqueia:

- consolidacao executiva;
- legalizacao definitiva;
- execucao sem projeto aprovado.

Exige alerta alto/HITL.

### HVAC/climatizacao sem projeto

Pode estimar verba quando o escopo for conhecido por:

- ambientes climatizados;
- area dos ambientes;
- padrao da obra;
- premissas do cliente;
- equipamentos especiais identificados.

Nao dimensiona carga termica definitiva.

### Memorial/acabamentos ausente

Permite premissas por padrao de acabamento:

- baixo;
- medio;
- alto;
- marcas ou linhas assumidas manualmente;
- CUB/SINAPI como baliza.

Nao identifica materiais reais sem memorial.

## 6. Relação com SINAPI, CUB e historico interno

SINAPI:

- fonte de composicoes e custos referenciais;
- util para itens estimados por referencia tecnica;
- nao transforma estimativa em item identificado.

CUB:

- baliza macro de ordem de grandeza;
- util para validar coerencia de padrao e area;
- nao substitui quantitativo.

Historico interno:

- apoia estimativas por obras similares;
- deve ser marcado como referencia interna;
- exige validacao humana antes de proposta final.

## 7. JSON esperado

Exemplo de fallback eletrico:

```json
{
  "discipline": "eletrico",
  "required_project": true,
  "project_available": false,
  "fallback_allowed": true,
  "fallback_mode": ["estimate_by_reference", "request_project", "manual_allowance", "keep_pending"],
  "estimated_items": [
    {
      "description": "Pontos elétricos preliminares por ambientes",
      "origin_type": "INDIRECT_EVIDENCE_FROM_PROJECT_DOCUMENTS",
      "confidence_level": "media",
      "can_feed_preliminary_budget": true,
      "can_feed_proposal_with_warning": true,
      "can_feed_execution": false,
      "blocks_final_consolidation": true,
      "warning_message": "Estimado sem projeto específico, com base em evidências indiretas de outros documentos e referências técnicas. Revisar após recebimento do projeto executivo."
    }
  ],
  "requires_hitl": true,
  "blocks_execution": true,
  "blocks_final_consolidation": true
}
```

## 8. UI e proposta futura

A UI deve mostrar:

- `Estimado sem projeto`;
- `Nao e item identificado em projeto`;
- `Revisar após recebimento do projeto executivo`;
- `Nao consolidado no orçamento oficial nesta fase`.

Proposta futura pode usar estimativa somente com ressalva clara, nunca como escopo executivo fechado.

## 9. Confirmacoes de nao escopo

- Nao chama Gemini real.
- Nao chama OpenAI.
- Nao chama Claude API.
- Nao processa PDF real.
- Nao executa OCR.
- Nao grava em `orcamento_itens`.
- Nao consolida orçamento oficial.
- Nao cria proposta.
- Nao cria Obra.
- Nao altera banco/schema.
- Nao cria migration.
- Nao altera Diario de Obra.
- Nao altera `/obras` ou `/obras/:obraId`.
