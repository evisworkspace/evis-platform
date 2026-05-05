# EVIS_ORCAMENTISTA_HITL_UI_CONTRACT

> Fase: 2F - HITL visual especifico do Orcamentista IA  
> Status: contrato visual e tecnico, mockado, sem IA real  
> Escopo: revisao humana pre-orcamento antes de dispatch futuro ou consolidacao futura  
> Proibido nesta fase: banco, orcamento oficial, orcamento_itens, proposta, Obra, Diario, OCR real, PDF real, IA real

## 1. Objetivo

Definir a camada de HITL do Orcamentista IA para revisar pendencias, divergencias e bloqueios gerados por Document Intake, Page Processing, Reader/Verifier, agentes especialistas futuros e custos futuros.

Fluxo conceitual:

```text
Documento
  -> Pagina renderizada
    -> Reader primario
      -> Verifier independente
        -> Divergencia / pendencia / bloqueio
          -> HITL Orcamentista
            -> Decisao humana
              -> Liberar dispatch futuro ou manter bloqueado
```

O HITL desta fase e uma validacao pre-orcamento. Ele nao grava itens oficiais, nao consolida valores e nao altera proposta.

## 2. HITL Do Orcamentista Versus HITL Do Diario

### HITL do Orcamentista

Atua antes da obra existir ou antes da obra estar ativa. O contexto e comercial/tecnico de pre-orcamento.

Exemplos:

- divergencia entre Reader e Verifier;
- inferencia tecnica sem evidencia suficiente;
- falta de disciplina tecnica;
- custo sem fonte;
- PPCI pendente;
- risco estrutural antes de precificar.

### HITL do Diario de Obra

Atua depois da obra existir e trata captura operacional de campo, avancos, equipes, pendencias de obra e diario.

Regra:

- o HITL do Orcamentista nao deve usar `src/components/HITLReview.tsx`;
- o HITL do Orcamentista nao escreve em Diario de Obra;
- o HITL do Orcamentista nao altera servicos da obra ativa.

## 3. Tipos De Pendencia

```text
divergencia_reader_verifier
risco_tecnico
quantidade_inferida
disciplina_ausente
custo_sem_fonte
documento_pendente
ppci_pendente
```

Cada pendencia deve ter:

- origem (`source_type`, `source_id`);
- documento e pagina quando aplicavel;
- agente relacionado quando aplicavel;
- severidade;
- resumo de evidencia;
- acao recomendada;
- flags `blocks_dispatch` e `blocks_consolidation`.

## 4. Tipos De Decisao Humana

```text
aprovar_com_ressalva
manter_bloqueado
solicitar_documento
marcar_como_verba
ignorar_nesta_fase
reanalisar_futuramente
```

### aprovar_com_ressalva

Libera uso futuro com observacao explicita. Nao transforma inferencia em fato.

### manter_bloqueado

Mantem dispatch e consolidacao bloqueados.

### solicitar_documento

Marca pendencia como dependente de novo documento.

### marcar_como_verba

Permite tratar assunto como verba futura, sem virar item oficial automaticamente.

### ignorar_nesta_fase

Remove a pendencia do escopo desta fase, sem confirmar a informacao como fato.

### reanalisar_futuramente

Mantem o assunto para nova leitura ou novo Verifier em fase futura.

## 5. Quando Bloquear Consolidacao

`blocks_consolidation` deve permanecer verdadeiro quando:

- ha risco critico estrutural, legal, eletrico ou de seguranca;
- Reader/Verifier divergem em informacao essencial;
- a pendencia depende de documento tecnico ausente;
- o custo nao possui fonte confiavel;
- PPCI ou aprovacao obrigatoria esta pendente;
- a decisao humana foi `manter_bloqueado`, `solicitar_documento` ou `reanalisar_futuramente`.

## 6. Quando Liberar Dispatch Futuro

Dispatch futuro para agentes especialistas pode ser liberado apenas quando:

- nao ha bloqueio de dispatch pendente;
- uma decisao humana explicita removeu o bloqueio;
- a pendencia nao exige documento adicional;
- a informacao inferida continua marcada como inferencia;
- a decisao nao implica consolidacao automatica.

Liberar dispatch nao significa consolidar no orcamento oficial.

## 7. Exemplo JSON

```json
{
  "id": "hitl-arch-demolicao-001",
  "source_type": "reader_verifier",
  "source_id": "summary-arch-blocked",
  "document_id": "doc-intake-arq",
  "document_name": "Projeto Arquitetonico.pdf",
  "page_number": 3,
  "agent_id": "estrutural",
  "issue_type": "divergencia_reader_verifier",
  "severity": "critica",
  "title": "Demolicao sem validacao estrutural",
  "description": "Reader identificou parede a demolir, mas Verifier nao descartou interferencia estrutural.",
  "evidence_summary": "A-03 marca DEM-01; sem detalhe estrutural associado.",
  "recommended_action": "Manter bloqueado e solicitar validacao estrutural.",
  "status": "pendente",
  "blocks_consolidation": true,
  "blocks_dispatch": true
}
```

Exemplo de decisao mockada:

```json
{
  "issue_id": "hitl-arch-demolicao-001",
  "decision_type": "manter_bloqueado",
  "decided_by": "mock_user",
  "decided_at": "2026-05-05T12:00:00.000Z",
  "notes": "Aguardando projeto estrutural ou validacao do responsavel tecnico."
}
```

## 8. Regras De Seguranca

- HITL do Orcamentista nao e HITL do Diario de Obra.
- Nenhuma decisao desta fase grava no banco.
- Nenhuma decisao desta fase cria item em `orcamento_itens`.
- Nenhuma decisao desta fase consolida no orcamento oficial.
- Nenhuma inferencia vira fato automaticamente.
- Divergencia critica permanece bloqueada ate decisao humana explicita.
- Decisao mockada altera apenas estado local de UI.
- Obra, Diario e Proposta ficam fora do escopo.
