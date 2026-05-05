# EVIS Orçamentista IA: PDF Reader Verification Contract

## 1. Visão Geral e Princípios
Este documento define o contrato arquitetural e técnico para a leitura de documentos e projetos (PDFs) no contexto do **Orçamentista IA** da EVIS.

A premissa fundamental da EVIS é: **O PDF Reader NÃO gera orçamento.** O Reader é exclusivamente uma ferramenta de extração de evidências técnicas e metadados. A responsabilidade de consolidar essas evidências em um orçamento financeiro pertence a agentes posteriores ou a uma etapa determinística e humana (HITL - Human in the Loop).

### 1.1 Princípios Arquiteturais
- **Renderização Determinística**: A divisão de um PDF em páginas/imagens é feita via código determinístico (futuramente, algo como PDF.js ou pdf2image), não por um LLM. Cada página é tratada como um frame auditável.
- **Leitura Multimodal e Extração**: A IA processa imagem + texto extraído para identificar itens construtivos, notas, legendas e carimbos.
- **Zero Hallucination (Zero Inferência como Fato)**: A IA pode inferir (ex: ver um chuveiro e inferir tubulação de água fria), mas essa inferência deve ser estritamente tipada como `inferred`, nunca como `identified`.
- **Rastreabilidade Absoluta**: Todo item extraído deve apontar para `file_id` e `page_number`. Nenhuma extração existe no vácuo.

## 2. A Dupla Verificação (Auditoria Cruzada)
Para garantir a confiabilidade estrutural antes de enviar dados a especialistas (hidráulica, estrutural, elétrica), o processo adota um **Primary Reader** e um **Verifier/Auditor Independente**.

1. **Reader Primário (IA 1)**: Varre a página, classifica, extrai itens explícitos e itens inferidos.
2. **Verifier (IA 2)**: Lê a mesma página e verifica se as conclusões primárias são corroboradas.
3. **Mecanismo de Contrato**:
   - Um *Agreement Score* é calculado.
   - O Verifier aponta *Disagreement Points*.
   - Divergências críticas acionam regras de HITL.

## 3. O Fluxo de Dados (Gates e Dispatch)
O ciclo de vida da leitura de um documento segue *Gates* de controle de qualidade:

1. `CLASSIFIED`: A página foi categorizada (ex: Estrutural, Arquitetura, Memorial).
2. `PRIMARY_READ`: A primeira IA extraiu evidências estruturadas.
3. `VERIFIED`: A segunda IA auditou a leitura primária e gerou o relatório de concordância.
4. `DISPATCHED_TO_SPECIALIST`: (Se aprovado no Verifier) Os dados seguem para agentes verticais.
5. `HITL_REQUIRED`: (Se reprovado) A execução pausa para um orçamentista humano arbitrar a divergência.

### Regras de Bloqueio e Reanálise
- Se a página está ilegível ou faltam carimbos fundamentais, o Reader bloqueia a consolidação (`blocks_consolidation = true`).
- Se o Verifier discordar substancialmente (ex: identificação de fundação rasa vs profunda), o status exige HITL (`requires_hitl = true`).

## 4. Estrutura de Extração
Cada extração resulta em um objeto do tipo `OrcamentistaPrimaryPageReading`, alimentado iterativamente pelos estados primário e verificado.

**Exemplo JSON (Leitura Primária):**
```json
{
  "file_id": "doc_123",
  "page_number": 4,
  "classification": {
    "page_type": "PLANTA_BAIXA",
    "discipline": "ARQUITETURA",
    "confidence": 0.95
  },
  "identified_items": [
    {
      "element": "Parede Drywall",
      "quantity": "40m",
      "evidence_type": "DRAWING_ANNOTATION",
      "source_reference": "Legenda inferior direita"
    }
  ],
  "inferred_items": [
    {
      "element": "Perfil Metálico para Drywall",
      "reasoning": "Parede em Drywall exige perfis, não citados explicitamente."
    }
  ],
  "missing_information": ["Espessura da placa de Drywall"],
  "reading_confidence": 0.92
}
```

Valores válidos para `evidence_type`:
- `TEXT_EXPLICIT` — item mencionado diretamente em texto
- `TABLE_ROW` — item extraído de tabela ou quadro de acabamentos
- `DRAWING_ANNOTATION` — anotação ou legenda em planta/corte/detalhe
- `DRAWING_MEASUREMENT` — cota ou medida encontrada no desenho
- `INFERRED_FROM_CONTEXT` — deduzido por raciocínio técnico, não encontrado explicitamente

## 5. Resumo da Fase Atual (2B)
Nesta fase, **nenhum LLM é chamado e nenhum OCR é feito**. O objetivo é assentar as tipagens e interfaces TypeScript para garantir que, quando a IA real (Fase 2C) assumir o controle, ela seja forçada a devolver objetos tipados de acordo com este contrato inviolável.
