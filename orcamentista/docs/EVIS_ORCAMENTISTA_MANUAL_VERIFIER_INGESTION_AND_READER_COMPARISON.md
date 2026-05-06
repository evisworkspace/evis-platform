# EVIS Orçamentista - Manual Verifier Ingestion And Reader Comparison

> Status: contrato tecnico e UI local, sem API real, sem IA real, sem banco e sem consolidacao oficial.

## 1. Objetivo

Permitir que o usuario execute um Verifier externo fora do EVIS, cole manualmente o JSON retornado e compare esse resultado com o Reader ja normalizado na sandbox.

O EVIS deve:

- validar o JSON colado;
- normalizar a resposta do Verifier;
- comparar Reader x Verifier;
- calcular `agreement_score`;
- listar itens confirmados e disputados;
- listar divergencias;
- gerar HITLs derivados da verificacao;
- manter dispatch e consolidacao bloqueados quando houver divergencia relevante.

## 2. Por Que Ainda Nao Ha API Real

A fase e manual porque a integracao automatica com um motor de Verifier ainda depende de decisoes de custo, observabilidade, armazenamento, politica de retries, versionamento de prompt e auditoria.

Nesta fase:

- nenhuma IA real e chamada;
- nenhuma chave de API e usada;
- nenhum `fetch`, axios ou Supabase e usado;
- nenhum resultado e persistido;
- nenhum item e gravado em `orcamento_itens`.

## 3. Fluxo Manual

```text
Reader externo
  -> JSON colado no EVIS
  -> normalizacao Reader
  -> safety gate
  -> dimensional checks
  -> Verifier externo
  -> JSON do Verifier colado no EVIS
  -> normalizacao Verifier
  -> comparacao Reader x Verifier
  -> agreement_score
  -> divergencias / HITL / bloqueios
```

## 4. Reader Versus Verifier

O Reader extrai evidencias da pagina. Ele identifica, infere e aponta riscos, mas nao aprova uso executivo.

O Verifier revisa o Reader de forma independente. Ele deve confirmar, disputar ou bloquear leituras criticas.

O Verifier tambem nao gera orcamento. Ele apenas aumenta ou reduz confianca, aponta divergencias e exige HITL quando necessario.

## 5. Estrutura Aceita Do Verifier

O JSON do Verifier pode ser flexivel, desde que contenha alguns destes campos:

```json
{
  "agreement_score": 0.74,
  "verified_items": [],
  "confirmed_items": [],
  "disputed_items": [],
  "divergence_points": [],
  "critical_dimensions": [],
  "risks": [],
  "hitl_requests": [],
  "recommendations": [],
  "requires_hitl": true,
  "blocks_consolidation": true
}
```

## 6. Comparacoes Obrigatorias

A comparacao deve considerar:

- `identified_items` do Reader contra confirmacoes/disputas do Verifier;
- `inferred_items` do Reader contra inferencias disputadas pelo Verifier;
- `critical_dimensions` do Reader contra cotas verificadas;
- `risks` do Reader contra riscos confirmados ou novos;
- `hitl_requests` do Reader contra HITLs do Verifier;
- `missing_information` do Reader contra pendencias apontadas pelo Verifier.

## 7. Agreement Score

O `agreement_score` combina:

- score fornecido pelo Verifier, quando existir;
- score calculado localmente por correspondencia textual entre Reader e Verifier;
- penalidade por divergencias explicitas.

Regras:

- `agreement_score >= 0.90`: alta concordancia;
- `agreement_score < 0.90`: exige HITL;
- `agreement_score < 0.80`: bloqueia consolidacao.

## 8. Classificacao De Divergencias

Divergencias sao classificadas por severidade:

```text
low
medium
high
critical
```

Regras minimas:

- quantidade de estacas: `high` ou `critical`;
- diametro de estaca: `critical`;
- comprimento/profundidade de estaca: `critical`;
- fck/resistencia do concreto: `high`;
- volume de concreto: `high`;
- P6/P23: `medium` ou `high`;
- folha, prancha, carimbo ou revisao: `medium`;
- divergencia sem impacto executivo: `low`.

## 9. Dispatch E Consolidacao

Se houver divergencia `high` ou `critical`:

```text
allowed_to_dispatch = false
requires_hitl = true
blocks_consolidation = true
```

Se `agreement_score < 0.90`:

```text
requires_hitl = true
```

Se `agreement_score < 0.80`:

```text
blocks_consolidation = true
```

## 10. Exemplo Fundacao / Estacas

Caso esperado:

- Reader identifica `C25`, diametro `25 cm`, quantidade `21`, comprimento `600 cm`, fck e volume de concreto.
- Verifier confirma diametro e quantidade.
- Verifier disputa se `600 cm` representa profundidade executiva ou comprimento de barra.

Resultado:

```text
agreement_score < 0.90
requires_hitl = true
blocks_consolidation = true
allowed_to_dispatch = false
```

## 11. Divergencias Criticas Exemplo

Exemplos que bloqueiam:

- quantidade de estacas difere entre tabela e chamada visual;
- diametro C25 foi lido como R25 ou outro valor;
- comprimento/profundidade de estaca foi confundido com comprimento de barra;
- fck 30 MPa diverge de 300/350 kgf/cm2 sem decisao por elemento;
- volume de concreto nao bate com diametro, quantidade e profundidade.

## 12. Nao Persistencia

Nada desta fase e gravado no banco.

O resultado do Verifier:

- nao cria item oficial;
- nao altera `orcamento_itens`;
- nao cria proposta;
- nao altera Obra;
- nao altera Diario de Obra;
- nao substitui HITL humano.

Persistencia futura deve exigir schema proprio, auditoria, versao de leitura, versao de Verifier e aceite humano.
