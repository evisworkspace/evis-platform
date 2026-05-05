# EVIS_ORCAMENTISTA_CONSOLIDATED_PREVIEW_CONTRACT

> Fase: 2H - Preview consolidado mockado a partir de agentes especialistas
> Status: contrato visual e tecnico, mockado, sem IA real
> Escopo: consolidacao tecnica de servicos, riscos e HITLs para validacao humana previa
> Proibido nesta fase: consolidacao oficial, persistencia em orcamento_itens, impacto na proposta ou diario de obra

## 1. Objetivo

A etapa de **Consolidated Preview** atua como a fronteira final entre o "Mundo IA" (leitura, inferencia e planejamento especialista) e o "Mundo Oficial" (orcamento consolidado EVIS). O preview visa organizar os dados de todos os agentes que atuaram no documento em uma visao unificada, dedupicada e auditavel, sem realizar gravacao oficial.

Fluxo conceitual:

```text
Reader/Verifier
  -> HITL
    -> Dispatch para agentes
      -> Outputs por disciplina
        -> Preview consolidado
          -> Validacao futura (HITL)
            -> Consolidacao oficial (futura)
```

## 2. Diferencas Conceituais

### Output do Agente
E o retorno individual de um especialista (ex: Agente de Eletrica). Contem sugestoes tecnicas, riscos isolados da disciplina e achados, mas nao tem uma visao holistica. Pode conter redundancias em relacao a outros agentes.

### Preview Consolidado
E a agregacao inteligente de multiplos outputs. Onde possivel, servicos duplicados sao cruzados. A previsao final de custo, cronograma e riscos torna-se centralizada. **Nenhum item do preview e oficial**. E estritamente pre-aprovacao.

### Orcamento Oficial
E a base de dados (`orcamento_itens`) que alimenta a Proposta Comercial, o Cronograma de Obra e o Diario de Obras. Somente itens **consolidados manualmente ou com aprovacao HITL explicita** entram nesta lista.

## 3. Rastreabilidade e Score

A rastreabilidade (`traceability_score`) e a metrica principal de saude do preview:
- Todo servico **deve** referenciar o(s) agente(s) que o propuseram (`source_agent_ids`).
- Todo servico **deve** apontar para a evidencia no documento base (`source_page_refs`, `source_evidence_refs`).
- Nenhuma modificacao feita na geracao do preview pode perder essas referencias.

## 4. Tipos de Identificacao

Os servicos mantem estrita definicao do modo como foram obtidos:
- **`identified`**: Encontrados factualmente nos documentos (ex: listado no memorial descritivo).
- **`inferred`**: Deduzidos tecnicamente pelo agente (ex: presenca de ar condicionado implica em instalacao de disjuntores e tubulacao, mesmo se nao listados no documento original).
- **`manual_assumption`**: Inseridos ou ajustados pelo usuario durante revisoes pre-consolidacao.

**Regra de Ouro:** Itens `inferred` sempre diminuem a confianca agregada e sinalizam a necessidade de cuidado extra.

## 5. Regras de Bloqueio e Consolidacao

A consolidacao (`can_consolidate = true`) so ocorre se e somente se:
- `blockers.length === 0`
- Nenhum risco possuir `blocks_consolidation = true`
- Nenhuma pendencia de `hitl` pendente no preview.

Se houver bloqueios criticos na geracao do preview, o preview fica bloqueado (`status = 'blocked'`) impedindo qualquer gravacao, mesmo futura.

## 6. Por que nao grava em orcamento_itens

Gravar em `orcamento_itens` a partir de um output direto de LLM viola o principio EVIS de que a IA **assiste** mas **nao autoriza** orcamentos. Custos e quantidades gerados sem validacao oficial de um humano iriam gerar propostas erradas para o cliente e diários de obra incoerentes. O preview serve exatamente para garantir a validacao humana (HITL) antes da transicao de dados.

## 7. Exemplo JSON (Contrato Mock)

```json
{
  "id": "prev-8821",
  "opportunity_id": "opp-9912",
  "status": "ready_for_validation",
  "generated_from_agent_output_ids": ["out-civil-1", "out-elec-1"],
  "services": [
    {
      "id": "srv-001",
      "category": "Civil",
      "discipline": "Acabamento",
      "description": "Execução de forro de gesso acartonado",
      "unit": "m2",
      "estimated_quantity": 45.5,
      "quantity_confidence": 0.95,
      "estimated_unit_cost": 120.0,
      "estimated_total": 5460.0,
      "cost_confidence": 0.88,
      "source_agent_ids": ["agent-civil-arch"],
      "source_page_refs": ["pg-rnd-02"],
      "source_evidence_refs": ["evd-001"],
      "identification_type": "identified",
      "requires_hitl": false,
      "blocks_consolidation": false
    }
  ],
  "risks": [],
  "hitls": [],
  "blockers": [],
  "confidence_score": 0.91,
  "traceability_score": 1.0,
  "can_consolidate": true
}
```
