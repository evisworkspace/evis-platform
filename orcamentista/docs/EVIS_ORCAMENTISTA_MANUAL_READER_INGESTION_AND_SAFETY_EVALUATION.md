# EVIS Orçamentista IA — Manual Reader Result Ingestion + Safety Evaluation

> Fase: 3E  
> Status: contrato e implementação local sem API real  
> Escopo: ingestão manual de JSON retornado por motor externo, normalização e avaliação de segurança  
> Fora de escopo: chamada de IA, OCR, leitura de PDF, Supabase, banco, proposta e orçamento oficial

## 1. Objetivo

A Fase 3E cria uma ponte segura entre o teste manual de leitura de prancha e a futura integração real com API.

O fluxo esperado é:

```text
Usuário roda o Reader fora do EVIS
  -> cola o JSON retornado no painel sandbox
    -> EVIS valida JSON
      -> EVIS normaliza o output
        -> EVIS aplica Reader Safety Policy
          -> EVIS aplica Dimensional Sanity Checks
            -> EVIS mostra Verifier/HITL/bloqueios
              -> nada é gravado no banco
```

## 2. Por Que Não Há API Real Nesta Fase

Nesta fase o objetivo não é automatizar a chamada ao motor. O objetivo é testar se o EVIS consegue receber um output real, colado manualmente, e aplicar os contratos de segurança já definidos.

Isso reduz risco porque:

- separa qualidade do prompt da integração de infraestrutura;
- permite comparar outputs de GPT, Gemini ou Claude sem acoplar credenciais;
- evita custo automático;
- evita ingestão acidental de dados ruins no orçamento oficial;
- preserva auditoria humana antes de qualquer persistência.

## 3. Como O Usuário Cola O JSON

O usuário executa o prompt do Reader em um motor externo e cola o JSON retornado no painel:

```text
Colar JSON real do Reader
```

O JSON deve seguir o shape mínimo:

```json
{
  "page_summary": "Resumo da página",
  "source_quality": "raster_pdf_clear",
  "confidence_score": 0.82,
  "identified_items": [],
  "inferred_items": [],
  "missing_information": [],
  "risks": [],
  "hitl_requests": [],
  "critical_dimensions": []
}
```

## 4. Validação De Shape

O EVIS valida se o output é um objeto JSON e se os arrays principais existem:

```text
identified_items
inferred_items
missing_information
risks
hitl_requests
```

Se o JSON for inválido ou o shape estiver incompleto, o resultado fica bloqueado.

## 5. Normalização

Após parse e validação, o EVIS aplica o normalizador:

```text
normalizeRawReaderOutput()
```

O normalizador:

- limita confidence score;
- separa itens identificados de itens inferidos;
- mantém inferências como `can_be_treated_as_fact = false`;
- preserva riscos, HITLs e informações pendentes;
- extrai cotas críticas;
- sinaliza fontes ausentes.

## 6. Reader Safety Policy

Depois da normalização, o EVIS aplica:

```text
runReaderSafetyGate()
```

O runner aplica:

- teto de confiança por qualidade de fonte;
- regras de PDF rasterizado;
- regra de dimensão crítica;
- regra de fundação;
- regra de estacas;
- regra de inferência nunca virar fato;
- decisão de Verifier;
- decisão de HITL;
- bloqueio de consolidação;
- elegibilidade para dispatch.

## 7. Dimensional Sanity Checks

As cotas críticas normalizadas passam por checagens dimensionais, incluindo:

- profundidade de estaca;
- ambiguidade decimal;
- volume de estaca;
- área de laje;
- quantidade de aço e origem da leitura.

Quando uma dimensão falha, o EVIS marca:

```text
requires_hitl = true
blocks_consolidation = true
allowed_to_dispatch = false
```

quando aplicável.

## 8. Verifier, HITL E Bloqueios

O painel mostra:

- se Verifier independente é obrigatório;
- se HITL é obrigatório;
- se a consolidação está bloqueada;
- se o dispatch está liberado;
- motivos de bloqueio;
- riscos;
- cotas críticas;
- sanity checks.

Nenhuma decisão automática transforma leitura em orçamento.

## 9. Por Que Nada É Gravado No Orçamento Oficial

O JSON colado manualmente é apenas um artefato de avaliação local.

Ele não grava em:

```text
orcamentos
orcamento_itens
propostas
obras
diario_obra
```

O orçamento oficial só pode receber dados em fase futura, com:

- `orcamento_id` confirmado;
- HITLs resolvidos;
- Verifier aplicado;
- payload final revisado;
- autorização explícita do usuário.

## 10. Exemplo: Fundação / Estacas

Exemplo de leitura válida, mas ainda bloqueada:

```json
{
  "page_summary": "Página de fundação com quadro de estacas.",
  "source_quality": "raster_pdf_clear",
  "confidence_score": 0.86,
  "identified_items": [
    {
      "label": "Estacas C25",
      "description": "Tabela indica 21 estacas C25.",
      "quantity": "21 un",
      "confidence_score": 0.82,
      "source_reference": "F01 · tabela de estacas",
      "evidence_type": "TABLE_ROW"
    }
  ],
  "inferred_items": [],
  "missing_information": [
    {
      "description": "Sondagem não anexada.",
      "impact": "Não valida profundidade de fundação.",
      "severity": "critical",
      "suggested_action": "Solicitar sondagem antes de consolidar."
    }
  ],
  "risks": [],
  "hitl_requests": [],
  "critical_dimensions": [
    {
      "dimension_type": "pile_quantity",
      "label": "Quantidade de estacas",
      "value": 21,
      "unit": "un",
      "source_text": "Total 21 estacas C25",
      "source_reference": "F01 · tabela de estacas",
      "confidence_score": 0.82,
      "context_tags": ["fundacao", "estaca", "quantidade_estaca"]
    }
  ],
  "contains_foundation_or_pile": true
}
```

Mesmo com itens identificados, fundação e estacas exigem Verifier/HITL antes de qualquer uso oficial.

## 11. Exemplo De Bloqueio: 35 m vs 3,5 m

Exemplo crítico:

```json
{
  "critical_dimensions": [
    {
      "dimension_type": "pile_depth",
      "label": "Profundidade da estaca E1",
      "value": 35,
      "unit": "m",
      "source_text": "E1 Ø25 h=35m",
      "source_reference": "F01 · detalhe E1",
      "confidence_score": 0.91,
      "context_tags": ["fundacao", "estaca", "profundidade_estaca"],
      "pile_diameter_cm": 25,
      "source_type": "visual_calculation"
    }
  ],
  "identified_items": [],
  "inferred_items": [],
  "missing_information": [],
  "risks": [],
  "hitl_requests": []
}
```

Resultado esperado:

```text
requires_verifier = true
requires_hitl = true
blocks_consolidation = true
allowed_to_dispatch = false
```

Motivo:

```text
Ambiguidade crítica: 35 m pode representar 3,5 m.
```

## 12. Confirmações De Segurança

- Nenhuma chamada de IA é executada pelo EVIS.
- Nenhuma API externa é chamada.
- Nenhum PDF real é processado.
- Nenhum OCR é executado.
- Nenhum dado é gravado no banco.
- Nenhum item é gravado em `orcamento_itens`.
- Nenhuma proposta é criada.
- Obra e Diário permanecem preservados.
