# EVIS_ORCAMENTISTA_PAYLOAD_REVIEW_CONTRACT

> Fase: 2J - Human Review / Payload Approval UI do Orcamentista IA  
> Status: contrato visual e tecnico, mockado, sem IA real  
> Escopo: revisao humana local do payload simulado gerado pelo Gate de Consolidacao  
> Proibido nesta fase: banco, insert real em `orcamento_itens`, migracao, proposta, Obra, Diario, OCR real, PDF real, Gemini real, OpenAI, Claude API

## 1. Objetivo

A revisao humana do payload e a camada entre o **payload simulado** da Fase 2I e uma futura gravacao controlada no orcamento oficial.

Ela permite revisar item por item antes de qualquer persistencia:

```text
Payload simulado
  -> revisao humana
    -> aprovar item
    -> rejeitar item
    -> editar item localmente
    -> manter pendente
    -> solicitar validacao
    -> resumo de aprovacao
    -> fase futura: gravacao controlada em orcamento_itens
```

Nesta fase, todas as decisoes sao locais/mockadas. Nenhum dado e enviado ao Supabase.

## 2. Payload Simulado, Item Aprovado E Item Gravado

### Payload simulado

E a estrutura gerada pelo Gate de Consolidacao com campos semelhantes a `orcamento_itens`, acrescida de rastreabilidade, confianca e `simulated_only = true`.

O payload simulado nao e oficial. Ele serve para revisao e auditoria de uma possivel gravacao futura.

### Item aprovado

E um item que recebeu decisao humana local `approve` dentro da sessao mockada de revisao.

Item aprovado nesta fase ainda nao e item oficial. Ele nao alimenta proposta, cronograma, obra ou Diario.

### Item gravado

E um registro real persistido em `orcamento_itens`. A Fase 2J nao cria itens gravados. Gravacao real exige fase futura, autorizacao explicita, validacao de schema/RLS e auditoria.

## 3. Por Que Esta Fase Nao Grava Em `orcamento_itens`

Gravar itens derivados de IA sem uma fase separada de revisao e autorizacao quebraria a separacao canonica do EVIS:

- IA sugere e estrutura;
- humano revisa e decide;
- sistema persiste somente depois de autorizacao explicita;
- proposta e Obra continuam protegidas contra dados prematuros.

A Fase 2J valida a UX, o contrato e os bloqueios antes de permitir escrita real.

## 4. Tipos De Decisao Humana

As decisoes previstas sao:

- `approve`: aprova localmente um item rastreavel e sem HITL pendente.
- `reject`: rejeita localmente um item e o exclui do valor revisado.
- `edit`: altera descricao, unidade, quantidade, custo unitario ou codigo apenas no estado local/mockado.
- `keep_pending`: mantem o item pendente para revisao posterior.
- `request_validation`: solicita validacao adicional, normalmente por falta de rastreabilidade, HITL pendente ou inferencia.

Todas as decisoes incluem `reason` e `decided_at`.

## 5. Regras Para Aprovar Item

Um item so pode ser aprovado quando:

- possui `source_agent_ids`;
- possui `source_page_refs`;
- possui `source_evidence_refs`;
- possui `traceability_score` suficiente;
- nao possui `requires_hitl = true`;
- nao possui `blocks_consolidation = true`;
- esta marcado como `simulated_only = true`;
- nao representa inferencia sem validacao humana explicita.

Itens sem rastreabilidade nao podem ser aprovados.

## 6. Regras Para Rejeitar Item

Um item pode ser rejeitado quando:

- esta fora do escopo comercial;
- e duplicado;
- depende de documento ausente;
- foi inferido sem sustentacao suficiente;
- possui risco tecnico ou financeiro incompatível com a proposta.

Rejeitar item nesta fase nao deleta nada do banco, porque o item ainda nao existe em `orcamento_itens`.

## 7. Regras Para Editar Item

Edicoes permitidas nesta fase:

- descricao;
- categoria;
- unidade;
- quantidade;
- valor unitario;
- codigo.

A edicao recalcula `valor_total` localmente. Ela nao altera o payload original, nao grava no banco e nao substitui auditoria futura.

Se a edicao nao resolver rastreabilidade ou HITL, o item continua bloqueado para gravacao futura.

## 8. Regras Para Manter Pendente

Um item deve permanecer pendente quando:

- existe HITL em aberto;
- a evidencia ainda nao foi validada;
- a quantidade ou custo depende de decisao humana;
- o escopo precisa de confirmacao comercial;
- o item e inferido e ainda nao recebeu validacao explicita.

Itens com HITL pendente devem iniciar como pendentes.

## 9. Rastreabilidade Obrigatoria

Cada item precisa preservar:

- `source_agent_ids`: agentes responsaveis;
- `source_page_refs`: paginas de origem;
- `source_evidence_refs`: evidencias de leitura/verificacao/agente;
- `confidence_score`: confianca geral;
- `traceability_score`: qualidade da rastreabilidade;
- `simulated_only`: indicacao obrigatoria de que nao e oficial.

Sem rastreabilidade minima, a UI deve bloquear aprovacao e sugerir `request_validation`.

## 10. Exemplo JSON - Item Em Revisao

```json
{
  "id": "payload-review-item-simulated-orcamento-item-preview-service-civil-pintura-001",
  "payload_item_id": "simulated-orcamento-item-preview-service-civil-pintura-001",
  "status": "pending",
  "decision_type": "keep_pending",
  "requires_traceability": true,
  "has_required_traceability": true,
  "requires_hitl_resolution": false,
  "blocks_write": true,
  "original_payload": {
    "descricao": "Pintura acrilica interna em paredes existentes",
    "unidade": "m2",
    "quantidade": 80,
    "valor_unitario": 38,
    "valor_total": 3040,
    "source_agent_ids": ["civil_arquitetonico"],
    "source_page_refs": ["rendered-page-md03"],
    "source_evidence_refs": ["finding-civil-piso-001"],
    "confidence_score": 0.87,
    "traceability_score": 1,
    "simulated_only": true
  }
}
```

## 11. Exemplo JSON - Decisao De Edicao

```json
{
  "item_id": "payload-review-item-simulated-orcamento-item-preview-service-civil-pintura-001",
  "decision_type": "edit",
  "reason": "Quantidade ajustada apos revisao humana local.",
  "edit_patch": {
    "descricao": "Pintura acrilica interna em paredes e teto revisada localmente",
    "quantidade": 92,
    "valor_unitario": 39
  },
  "decided_at": "2026-05-05T13:07:00.000Z"
}
```

## 12. Exemplo JSON - Resumo De Revisao

```json
{
  "total_items": 5,
  "approved_count": 1,
  "edited_count": 1,
  "rejected_count": 1,
  "pending_count": 1,
  "blocked_count": 1,
  "can_write_to_budget": false,
  "write_blocked_reason": "Fase 2J e simulada: gravacao real em orcamento_itens exige autorizacao explicita em fase futura."
}
```

## 13. Regras De Seguranca

- Revisao humana nao grava no banco.
- Nenhuma decisao local e persistida.
- Item aprovado nao e enviado ao Supabase.
- Item rejeitado nao deleta registro algum.
- Edicao altera apenas estado local/mockado.
- Botao de gravacao real deve permanecer desabilitado.
- Nenhuma IA real deve ser chamada nesta fase.
- Proposta, Obra, Diario, Servicos, Cronograma e Relatorios permanecem fora do fluxo.

## 14. Fase Futura De Gravacao Real Controlada

Uma fase futura podera transformar itens aprovados em registros reais somente se:

- houver autorizacao explicita do usuario;
- `orcamento_id` estiver confirmado;
- todos os itens aprovados tiverem rastreabilidade completa;
- HITLs estiverem resolvidos;
- RLS/schema estiverem auditados;
- payload final for recalculado imediatamente antes da escrita;
- insert em `orcamento_itens` for transacional ou idempotente;
- auditoria de decisao humana for persistida.

Essa fase futura deve continuar separada de proposta e Obra ate nova decisao explicita.
