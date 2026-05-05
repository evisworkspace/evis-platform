# EVIS_ORCAMENTISTA_CONSOLIDATION_GATE_CONTRACT

> Fase: 2I - Gate de Consolidacao do Orcamentista IA  
> Status: contrato visual e tecnico, mockado, sem IA real  
> Escopo: validacao final do preview consolidado e geracao de payload simulado para futura gravacao em `orcamento_itens`  
> Proibido nesta fase: banco, insert real, migracao, proposta, Obra, Diario, OCR real, PDF real, Gemini real, OpenAI, Claude API

## 1. Objetivo

O Gate de Consolidacao e a camada contratual entre o **preview consolidado** e o **orcamento oficial**. Ele valida se cada servico sugerido possui rastreabilidade, confianca e liberacao HITL suficientes para compor um payload simulado com formato semelhante ao futuro `orcamento_itens`.

Fluxo conceitual:

```text
Preview consolidado
  -> Gate de consolidacao
    -> validacao de rastreabilidade
    -> validacao HITL
    -> validacao de bloqueios
    -> payload simulado para orcamento_itens
    -> revisao humana
    -> fase futura: gravacao real controlada
```

Nesta fase, o Gate **nao grava nada**. Ele apenas mostra o que poderia ser enviado em uma fase futura, depois de revisao humana explicita.

## 2. Preview Consolidado, Payload Simulado E Orcamento Oficial

### Preview consolidado

E a previa tecnica-orcamentaria criada a partir dos outputs dos agentes especialistas. Ainda contem inferencias, pendencias, riscos, premissas e itens nao oficiais.

### Payload simulado

E uma representacao local, mockada e auditavel do que poderia virar `orcamento_itens` no futuro. O payload tem campos parecidos com o item oficial, mas possui flags de simulacao e nunca e enviado ao Supabase nesta fase.

### Orcamento oficial

E o registro persistido no banco que alimenta proposta, cronograma e fluxo futuro. O orcamento oficial permanece separado do Gate. A Fase 2I nao cria, altera ou remove itens oficiais.

## 3. Por Que Esta Fase Nao Grava Em `orcamento_itens`

Gravar diretamente a partir de preview IA quebraria o principio EVIS de separacao entre:

- analise assistida por IA;
- revisao humana;
- persistencia oficial;
- proposta comercial;
- execucao/obra/diario.

A Fase 2I existe para auditar a transicao antes da persistencia. O payload simulado permite revisar a estrutura futura sem risco de gerar item oficial incorreto, proposta incorreta ou vinculo indevido com Obra/Diario.

## 4. Criterios Para Item Aprovado

Um candidato entra em `approved_items` e no `simulated_payload` apenas quando:

- `requires_hitl = false`;
- `blocks_consolidation = false`;
- possui `source_agent_ids`;
- possui `source_page_refs`;
- possui `source_evidence_refs`;
- `quantity_confidence` nao e baixa;
- `cost_confidence` nao e baixa;
- nao e inferencia nao validada;
- nao e premissa manual sem revisao;
- nao possui issue de validacao que bloqueie payload.

Mesmo aprovado para payload simulado, o item continua **nao oficial**.

## 5. Criterios Para Item Bloqueado

Um candidato entra em `blocked_items` quando:

- falta agente de origem;
- falta pagina de origem;
- falta evidencia de origem;
- a confianca de quantidade e baixa;
- a confianca de custo e baixa;
- existe `blocks_consolidation = true`;
- existe bloqueio critico vindo do preview consolidado.

Item bloqueado nao entra no payload simulado aprovado.

## 6. Criterios Para Item Pendente De HITL

Um candidato entra em `pending_hitl_items` quando:

- `requires_hitl = true`;
- `identification_type = inferred`;
- `identification_type = manual_assumption`;
- uma decisao humana e obrigatoria para manter, converter em verba, ignorar nesta fase ou reanalisar.

Itens inferidos nunca viram fato automaticamente. Eles devem permanecer marcados como inferencia ate decisao humana futura.

## 7. Regras De Rastreabilidade

Cada candidato precisa preservar:

- `source_agent_ids`: agentes que sugeriram ou validaram o item;
- `source_page_refs`: paginas renderizadas/processadas que sustentam o item;
- `source_evidence_refs`: achados, linhas, evidencias Reader/Verifier ou outputs dos agentes;
- score de rastreabilidade por item;
- score de confianca por quantidade e custo.

Sem rastreabilidade minima, o Gate bloqueia o item.

## 8. Itens Identificados, Inferidos E Premissas Manuais

### Identificados

Podem entrar no payload simulado se tiverem rastreabilidade completa, confianca suficiente e nenhum bloqueio HITL.

### Inferidos

Devem ir para HITL. Uma inferencia pode ser util para revisao, mas nao pode virar item oficial sem validacao explicita.

### Premissas manuais

Devem ir para HITL ou revisao futura. Premissa manual sem fonte nao entra no payload aprovado.

## 9. Formato Do Payload Simulado

O payload simulado se parece com `orcamento_itens`, mas inclui rastreabilidade e flags de simulacao:

```json
{
  "id": "simulated-orcamento-item-preview-service-civil-pintura-001",
  "preview_service_id": "preview-service-civil-pintura-001",
  "descricao": "Pintura acrilica interna em paredes existentes",
  "categoria": "Pintura",
  "unidade": "m2",
  "quantidade": 80,
  "valor_unitario": 38,
  "valor_total": 3040,
  "origem": "consolidated_preview_mock",
  "source_agent_ids": ["civil_arquitetonico"],
  "source_page_refs": ["rendered-page-md03"],
  "source_evidence_refs": ["finding-civil-piso-001", "svc-civil-pintura-001"],
  "confidence_score": 0.87,
  "traceability_score": 1,
  "requires_hitl": false,
  "blocks_consolidation": false,
  "simulated_only": true
}
```

## 10. Exemplo De Gate Bloqueado

```json
{
  "id": "gate-consolidation-mock-2i-001",
  "preview_id": "prev-mock-1001",
  "opportunity_id": "opp-123",
  "orcamento_id": null,
  "status": "blocked",
  "approved_items": ["gate-candidate-preview-service-civil-pintura-001"],
  "blocked_items": [
    {
      "preview_service_id": "preview-service-civil-impermeabilizacao-001",
      "reason": "Item nao possui referencia de pagina. Item nao possui referencia de evidencia.",
      "missing_fields": ["source_page_refs", "source_evidence_refs"],
      "required_action": "Vincular pagina renderizada/processada antes de simular payload aprovado."
    }
  ],
  "pending_hitl_items": [
    {
      "preview_service_id": "preview-service-acabamentos-rodape-001",
      "reason": "Item inferido nao pode virar fato sem validacao humana.",
      "required_human_action": "Enviar para fila HITL e manter marcado como inferencia."
    }
  ],
  "can_write_to_budget": false,
  "write_blocked_reason": "Ha itens bloqueados por rastreabilidade, confianca ou bloqueio de consolidacao."
}
```

## 11. Regras De Seguranca

- Gate de Consolidacao nao grava no banco.
- Gate de Consolidacao nao chama Supabase para insert.
- Payload simulado nao altera `orcamento_itens`.
- Payload simulado nao alimenta proposta.
- Payload simulado nao altera Obra, Diario, Servicos, Cronograma ou Relatorios.
- Nenhuma IA real e chamada nesta fase.
- Nenhum OCR/PDF real e processado nesta fase.
- Consolidacao real sera fase futura, com autorizacao humana e gravacao controlada.

## 12. Fase Futura

A proxima fase recomendada e revisar o payload simulado com aceite humano explicito. Somente depois disso uma etapa separada podera:

- recalcular payload final;
- confirmar `orcamento_id`;
- validar permissao de escrita;
- executar insert controlado em `orcamento_itens`;
- registrar auditoria;
- manter proposta e obra fora do fluxo ate nova decisao explicita.
