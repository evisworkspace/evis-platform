# EVIS ORCAMENTISTA - FIRST REAL READER SANDBOX

> Fase: 3B - Primeira leitura real controlada de uma pagina isolada  
> Status: contrato tecnico implementado como sandbox local/manual, sem chamada real de IA  
> Escopo: uma pagina, JSON auditavel, safety gate, sanity checks e Verifier prompt package

## 1. Objetivo

Criar a primeira estrutura segura para leitura real futura do Orçamentista IA sobre uma unica pagina renderizada, sem afetar o orcamento oficial.

A sandbox prepara:

- contrato de entrada da pagina isolada;
- prompt package do Reader primario;
- prompt package do Verifier independente;
- schema JSON esperado;
- normalizacao do output do Reader;
- aplicacao de `readerSafetyPolicy`;
- aplicacao de `dimensionalSanityChecks`;
- decisao final de bloqueio, HITL, Verifier e dispatch.

Nesta fase, a execucao e `manual model run ready`: o sistema gera o pacote de prompt, mas nao chama API de IA.

## 2. Por que apenas uma pagina

A leitura de projeto contem risco alto de contaminacao entre paginas, memoria de contexto e inferencia indevida. A primeira leitura real deve ser limitada a uma pagina porque:

- isola a evidencia visual/textual;
- reduz risco de o modelo completar lacunas com informacao de outra prancha;
- permite comparar Reader e Verifier sobre a mesma fonte;
- facilita auditar a origem de cada cota, tabela, anotacao ou trecho;
- impede processamento acidental de PDF inteiro.

Qualquer leitura multipagina fica fora desta fase.

## 3. Por que nao grava no banco

O Reader nao e fonte oficial de orcamento. Ele produz evidencias, pendencias e riscos para revisao.

Por isso, a sandbox:

- nao grava em `orcamento_itens`;
- nao altera `orcamentos`;
- nao cria proposta;
- nao cria obra;
- nao cria migrations;
- nao altera schema;
- nao dispara consolidacao;
- nao altera Diario de Obra.

A escrita futura so pode acontecer depois de Verifier, sanity checks, HITL, gate de consolidacao e revisao humana explicita.

## 4. Entrada canonica da sandbox

Campos minimos:

```json
{
  "document_id": "doc-sandbox-fundacao",
  "file_name": "Projeto Estrutural - Fundacoes.pdf",
  "page_number": 1,
  "page_image_ref": "manual://page-image/fundacoes-p1.png",
  "page_text_ref": "manual://page-text/fundacoes-p1.txt",
  "source_quality": "raster_pdf_clear",
  "reader_motor": "gpt_5_5",
  "verifier_motor": "gemini_3_1"
}
```

`page_image_ref` e `page_text_ref` podem apontar para referencias manuais, storage futuro ou assets renderizados. Nesta fase nao ha download, OCR ou renderizacao real.

## 5. Prompt do Reader

O prompt do Reader deve conter:

- papel do modelo: Reader tecnico;
- limite: uma pagina isolada;
- proibicao de gerar orcamento, item oficial, proposta ou obra;
- proibicao de inventar;
- obrigacao de separar identificado, inferido, faltante, risco e HITL;
- obrigacao de fonte/evidencia em cada ponto;
- obrigacao de marcar dimensao critica;
- obrigacao de marcar fundacao/estaca;
- resposta somente em JSON valido.

O Reader deve responder no formato:

```json
{
  "page_summary": "string",
  "source_quality": "raster_pdf_clear",
  "confidence_score": 0.74,
  "identified_items": [],
  "inferred_items": [],
  "missing_information": [],
  "risks": [],
  "hitl_requests": [],
  "critical_dimensions": [],
  "contains_foundation_or_pile": false,
  "notes": []
}
```

## 6. Prompt do Verifier

O Verifier recebe:

- a mesma pagina isolada;
- a qualidade da fonte;
- o JSON normalizado do Reader;
- a regra de ser conservador;
- a proibicao de consolidar sozinho.

O Verifier deve procurar:

- erro decimal;
- troca de unidade;
- fonte fraca;
- evidencia ausente;
- inferencia marcada como fato;
- omissao de item possivel;
- divergencia de leitura;
- risco que exige HITL.

Fundacao, estaca, cota critica, baixa legibilidade e inferencia devem inclinar o Verifier para bloqueio ou HITL.

## 7. Aplicacao das policies da Fase 3A

A sandbox aplica:

- `motorSelectionPolicy.ts`: GPT-5.5 como Reader primario e Gemini 3.1 como Verifier conservador;
- `readerSafetyPolicy.ts`: regras de fonte, inferencia, fundacao, estaca, cota critica, aco e concreto;
- `dimensionalSanityChecks.ts`: checagens deterministicas sobre cotas criticas.

Nenhum motor tem permissao para consolidar dimensao critica sozinho.

## 8. Regras para PDF rasterizado

Fonte rasterizada recebe teto de confianca. Mesmo que o Reader declare confianca alta, o normalizador/safety runner limita o score permitido.

Exemplo:

```text
source_quality = raster_pdf_clear
confidence_score declarado = 0.91
max_confidence_allowed = 0.74
confidence_score efetivo = 0.74
requires_verifier = true
```

Se a fonte for `raster_pdf_low_resolution`, `compressed_image` ou `illegible_table`, o bloqueio e mais forte e pode exigir HITL.

## 9. Dimensoes criticas

Toda cota critica deve ir para `critical_dimensions`.

Campos obrigatorios:

- `dimension_type`;
- `value`;
- `unit`;
- `source_text`;
- `source_reference`;
- `confidence_score`;
- `context_tags`.

Exemplos de dimensoes criticas:

- profundidade de estaca;
- diametro de estaca;
- quantidade de estacas;
- volume de concreto;
- quantidade de aco;
- area de laje por leitura visual;
- nivel critico;
- dimensao de fundacao.

## 10. Erro 35 m vs 3,5 m

O erro de referencia da Fase 3A deve bloquear a sandbox:

```json
{
  "dimension_type": "pile_depth",
  "value": 35,
  "unit": "m",
  "source_text": "E1 Ø25 h=35m",
  "context_tags": ["fundacao", "estaca", "cota_critica"]
}
```

Tratamento esperado:

- `checkDecimalAmbiguity()` identifica possibilidade de `35 m` vs `3,5 m`;
- `checkPileDepthSanity()` identifica estaca residencial de 25 cm acima de 15 m como critica;
- `readerSafetyPolicy` exige Verifier e HITL por fundacao/estaca;
- `blocks_consolidation = true`;
- `allowed_to_dispatch = false`;
- nenhum item oficial e gravado.

## 11. Resultado final esperado da sandbox

A saida final deve declarar:

```json
{
  "allowed_to_dispatch": false,
  "requires_verifier": true,
  "requires_hitl": true,
  "blocks_consolidation": true,
  "safety_gate_result": {},
  "dimensional_checks": []
}
```

Esse resultado nao e orcamento, nao e quantitativo oficial e nao e proposta. E apenas leitura auditavel de uma pagina.

## 12. Criterios para avancar

So avancar para leitura real de mais paginas quando:

- uma pagina real for processada com Reader externo e JSON valido;
- o mesmo caso for revisado por Verifier independente;
- o normalizador rejeitar formatos invalidos;
- o safety runner bloquear o caso `35 m` vs `3,5 m`;
- PDF rasterizado tiver teto de confianca aplicado;
- fundacao/estaca exigir Verifier + HITL;
- nao houver caminho de escrita automatica no banco;
- a UI deixar claro que a leitura e sandbox;
- logs/auditoria forem suficientes para comparar Reader e Verifier.

## 13. Confirmacoes de nao escopo

- Nao ler PDF inteiro.
- Nao processar multiplas paginas.
- Nao chamar IA/API nesta fase.
- Nao inserir API key.
- Nao gravar no banco.
- Nao consolidar no orcamento oficial.
- Nao gerar proposta.
- Nao criar obra.
- Nao alterar Diario de Obra.
- Nao alterar migrations/schema.
