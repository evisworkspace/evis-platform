# EVIS_ORCAMENTISTA_READER_VERIFIER_UI_CONTRACT

> Fase: 2E - Reader/Verifier UI Contract  
> Status: contrato visual e tecnico, mockado, sem IA real  
> Escopo: camada de leitura auditada antes de agentes especialistas  
> Proibido nesta fase: OCR real, PDF real, IA real, banco, consolidacao, orcamento oficial

## 1. Objetivo

Definir a camada visual e contratual que separa:

```text
Documento
  -> Pagina renderizada
    -> Reader primario
      -> Verifier independente
        -> divergencias
          -> HITL
            -> bloqueio/liberacao
              -> dispatch futuro para agentes especialistas
```

Esta camada existe para transformar paginas renderizadas em evidencias estruturadas e auditaveis. Ela nao gera orcamento e nao grava itens oficiais.

## 2. Diferenca Entre Documento, Pagina, Reader E Verifier

### Documento

Arquivo recebido na oportunidade ou no orcamento. Exemplo: PDF de arquitetura, memorial ou projeto eletrico.

Regra:

- documento recebido nao e leitura validada;
- documento nao e orcamento;
- documento nao pode ser despachado diretamente para agente especialista.

### Pagina renderizada

Unidade tecnica deterministica criada a partir do documento na Fase 2D. Representa uma pagina isolada, com imagem, texto nativo quando existir, status de processamento e readiness para Reader.

Regra:

- pagina renderizada ainda nao e leitura IA;
- pagina renderizada apenas prepara a entrada auditavel.

### Reader primario

Camada que le a pagina renderizada e devolve:

- itens identificados;
- itens inferidos;
- informacoes pendentes;
- evidencias;
- referencias de origem;
- confidence_score;
- flags de HITL e bloqueio.

Regra:

- Reader nao gera orcamento;
- Reader nao calcula preco;
- Reader nao cria item oficial;
- Reader nao transforma inferencia em fato.

### Verifier independente

Camada que audita a leitura do Reader de forma independente. Ela compara o que o Reader declarou contra a pagina renderizada e devolve:

- agreement_score;
- status de verificacao;
- divergencias;
- itens confirmados;
- itens disputados;
- itens possivelmente omitidos;
- necessidade de reanalise;
- necessidade de HITL;
- bloqueio de consolidacao.

Regra:

- Verifier nao consolida orcamento;
- Verifier nao corrige o orcamento oficial;
- Verifier apenas decide se a leitura pode seguir, precisa de HITL ou deve bloquear.

## 3. Identificado, Inferido E Pendente

### Identificado

Informacao localizada diretamente na pagina por texto explicito, linha de tabela, anotacao grafica ou medicao visivel.

Exemplo:

```json
{
  "label": "Parede a demolir",
  "evidence_status": "IDENTIFIED",
  "evidence_type": "DRAWING_ANNOTATION",
  "source_reference": "A-03, marca DEM-01",
  "confidence_score": 0.91
}
```

### Inferido

Informacao derivada por raciocinio a partir do contexto. Nao pode ser tratada como fato e deve continuar marcada como inferencia ate validacao.

Exemplo:

```json
{
  "element": "Reforco local em verga",
  "reasoning": "Inferido por abertura criada em parede existente.",
  "confidence_score": 0.62,
  "can_be_treated_as_fact": false
}
```

### Pendente

Informacao que falta para leitura segura.

Exemplo:

```json
{
  "description": "Nao ha detalhe estrutural da parede indicada para demolicao.",
  "impact": "Pode alterar escopo, custo e risco tecnico.",
  "severity": "critical",
  "suggested_action": "Solicitar validacao estrutural antes de consolidar qualquer item."
}
```

## 4. Scores

### confidence_score

Score produzido pelo Reader para indicar confianca da propria leitura.

Bandas recomendadas:

```text
0.00 - 0.69 = baixa
0.70 - 0.84 = media
0.85 - 1.00 = alta
```

### agreement_score

Score produzido pelo Verifier para indicar concordancia com o Reader.

Bandas recomendadas:

```text
0.00 - 0.69 = baixa concordancia
0.70 - 0.89 = concordancia parcial
0.90 - 1.00 = alta concordancia
```

Baixo agreement_score deve acionar HITL ou bloqueio conforme severidade das divergencias.

## 5. Divergencias

`disagreement_points` registram qualquer conflito relevante entre Reader e Verifier.

Exemplo critico:

```json
{
  "field": "identified_items[demolicao]",
  "reader_value": "Parede a demolir",
  "verifier_value": "Nao e possivel descartar interferencia estrutural",
  "severity": "critical",
  "requires_hitl": true,
  "blocks_consolidation": true,
  "target_agents": ["estrutural", "compatibilizacao_tecnica"]
}
```

## 6. Gates De Seguranca

### requires_hitl

Deve ser verdadeiro quando:

- ha divergencia high ou critical;
- agreement_score esta abaixo do minimo;
- confidence_score esta baixo;
- a pagina tem informacao tecnica pendente com impacto relevante;
- ha inferencia com risco tecnico.

### blocks_consolidation

Deve ser verdadeiro quando:

- ha divergencia critical;
- Verifier nao consegue confirmar leitura essencial;
- existe risco estrutural, legal, eletrico ou de seguranca;
- a pagina esta corrompida, incompleta ou sem informacao suficiente.

### dispatch_to_agents

Dispatch futuro para agentes especialistas so pode ocorrer quando:

- a leitura primaria existe;
- a verificacao independente foi executada;
- nao ha bloqueio;
- nao ha HITL obrigatorio pendente;
- ha agentes alvo definidos;
- a decisao esta marcada como `allowed_to_dispatch = true`.

## 7. Exemplo De Summary

```json
{
  "reader_run": {
    "id": "reader-arch-001",
    "rendered_page_id": "rendered-page-a03",
    "document_id": "doc-arq-001",
    "page_number": 3,
    "page_type": "PLANTA_BAIXA",
    "discipline": "ARQUITETURA",
    "confidence_score": 0.78,
    "requires_hitl": true,
    "blocks_consolidation": true
  },
  "verifier_run": {
    "id": "verifier-arch-001",
    "reader_run_id": "reader-arch-001",
    "agreement_score": 0.61,
    "verification_status": "BLOCKED",
    "requires_hitl": true,
    "blocks_consolidation": true
  },
  "dispatch_decision": {
    "allowed_to_dispatch": false,
    "dispatch_status": "blocked",
    "target_agents": ["estrutural", "compatibilizacao_tecnica"],
    "blocked_reason": "Divergencia critica sobre demolicao e interferencia estrutural."
  }
}
```

## 8. Regras Inviolaveis

- Reader nao gera orcamento.
- Verifier nao consolida orcamento.
- Inferido nao e fato.
- Leitura nao vira item oficial automaticamente.
- Nenhum resultado desta camada grava em `orcamento_itens`.
- Nenhum resultado desta camada altera proposta.
- Obra e Diario permanecem fora do escopo.
- Toda consolidacao e fase futura e exige aprovacao humana.
