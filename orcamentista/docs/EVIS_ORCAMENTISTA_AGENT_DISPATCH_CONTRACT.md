# EVIS_ORCAMENTISTA_AGENT_DISPATCH_CONTRACT

> Fase: 2G - Dispatch mockado para agentes especialistas do Orcamentista IA  
> Status: contrato tecnico e visual, mockado, sem IA real  
> Escopo: ponte entre Reader/Verifier + HITL e agentes especialistas de dominio  
> Proibido nesta fase: IA real, banco, orcamento_itens, consolidacao, proposta, Obra, Diario, OCR real, PDF real

## 1. Objetivo

Definir a camada de dispatch que encaminha evidencias liberadas para agentes especialistas mockados.

Fluxo conceitual:

```text
Documentos
  -> Paginas renderizadas
    -> Reader primario
      -> Verifier independente
        -> HITL Orcamentista
          -> Dispatch para agentes especialistas
            -> Outputs tecnicos mockados
              -> Preview futuro
                -> Consolidacao futura
```

Dispatch nao gera orcamento. Ele apenas prepara a execucao tecnica futura por disciplina.

## 2. Dispatch, Agente Especialista E Consolidacao

### Dispatch

Encaminhamento controlado de evidencias auditadas, referencias de pagina, leituras e pendencias HITL para um agente alvo.

Regra:

- dispatch nao cria item oficial;
- dispatch nao precifica;
- dispatch nao consolida;
- dispatch nao escreve no banco.

### Agente especialista

Unidade tecnica de dominio, como civil, estrutural, eletrica, PPCI, quantitativo, custos ou auditoria.

Nesta fase o agente e mockado e devolve apenas:

- achados tecnicos;
- servicos sugeridos mockados;
- riscos;
- pendencias;
- solicitacoes HITL;
- flags de bloqueio de preview ou consolidacao futura.

### Consolidacao

Etapa futura e separada. Nenhum output de agente pode virar `orcamento_itens` automaticamente.

## 3. Entrada Do Dispatch

O dispatch recebe dados das camadas anteriores:

- ids de paginas renderizadas;
- ids de leituras Reader;
- ids de pendencias HITL relacionadas;
- referencias de origem;
- resumo de evidencias;
- restricoes e premissas.

Exemplo:

```json
{
  "source_page_ids": ["rendered-page-e01"],
  "source_reader_run_ids": ["reader-elec-001"],
  "source_hitl_issue_ids": [],
  "source_references": ["Planta Eletrica.pdf · E-01"],
  "evidence_summary": "Pontos eletricos e QD-01 verificados com alta concordancia.",
  "constraints": [
    "Inferencias de metragem nao podem virar quantidade oficial.",
    "Output e previa tecnica."
  ]
}
```

## 4. Criterios Para Liberar Ou Bloquear

Um agente so pode receber dispatch quando:

- a pagina esta pronta para Reader;
- o Reader/Verifier nao bloqueia;
- o HITL nao bloqueia dispatch;
- existe agente alvo compativel;
- dependencias tecnicas anteriores foram satisfeitas.

Bloquear quando:

- ha pendencia critica;
- HITL bloqueia dispatch;
- Reader/Verifier bloqueia por divergencia;
- disciplina obrigatoria esta ausente;
- o agente depende de outputs ainda nao concluidos.

## 5. Status Possiveis

```text
waiting      = aguardando dependencias ou janela futura
released     = liberado para execucao futura
blocked      = bloqueado por gate tecnico ou HITL
running_mock = simulacao local em andamento
completed    = output mockado concluido
```

Status de output:

```text
not_started
completed
completed_with_warnings
blocked
waiting_dependencies
```

## 6. Output Mockado

Exemplo:

```json
{
  "id": "output-eletrica-001",
  "dispatch_job_id": "dispatch-eletrica-001",
  "agent_id": "eletrica_dados_automacao",
  "status": "completed_with_warnings",
  "confidence_score": 0.82,
  "findings": [
    {
      "title": "Pontos eletricos identificados",
      "description": "Quadro de pontos indica tomadas e QD-01.",
      "discipline": "eletrica",
      "source_references": ["Planta Eletrica.pdf · E-01"],
      "confidence_score": 0.9
    }
  ],
  "suggested_services": [
    {
      "description": "Instalacao de pontos de tomada",
      "unit": "ponto",
      "quantity_basis": "Identificado como escopo tecnico, sem quantidade oficial.",
      "confidence_score": 0.78,
      "is_official": false
    }
  ],
  "blocks_preview": false,
  "blocks_consolidation": true
}
```

## 7. Gates De Seguranca

- Dispatch nao gera orcamento.
- Output de agente e previa tecnica.
- Nenhum agente grava item oficial.
- Nenhum agente consolida orcamento.
- Nenhuma inferencia vira fato automaticamente.
- Pendencia critica bloqueia dispatch.
- Preview futuro depende de outputs concluidos e sem bloqueio de preview.
- Consolidacao futura depende de aprovacao humana e etapa propria.
- Obra, Diario e Proposta ficam fora do escopo.

