# EVIS_ORCAMENTISTA_PAGE_RENDERING_PROCESSING_CONTRACT

## 1. Objetivo da Renderização de Páginas

A etapa de **Page Rendering / Processing** atua como uma camada isolante e determinística entre os arquivos PDF recebidos brutos e a Inteligência Artificial. Seu principal objetivo é transformar documentos em formato PDF em unidades atômicas, rastreáveis e otimizadas para consumo de máquina (páginas auditáveis). 

Esta fase garante que a IA nunca interaja com o arquivo bruto, mas sim com um conjunto validado de assets (imagens e textos) por página.

## 2. Por que IA não gera prints?

Deixar que a IA (como Gemini ou Claude) "navegue" pelo PDF e escolha o que processar introduz problemas severos de compliance e rastreabilidade:
- **Alucinação visual:** A IA pode mesclar contextos de páginas diferentes.
- **Falta de reprodutibilidade:** Se a IA "olhar" pro PDF duas vezes, pode focar em trechos diferentes.
- **Dificuldade de HITL (Human-In-The-Loop):** Se o modelo não apontar exatamente *onde* no documento original encontrou uma informação, um humano não tem como auditar o orçamento gerado.

Logo, a plataforma EVIS é responsável por **desconstruir** o PDF em imagens e textos de forma determinística *antes* da IA atuar.

## 3. Diferenças Conceituais

- **Arquivo:** O PDF original (ex: `Projeto_Arquitetura.pdf`) anexado à oportunidade.
- **Página Renderizada:** A representação visual (PNG/JPEG) e de texto nativo de *uma* página específica do PDF (ex: `Página 12 - Corte A-A`). É determinística.
- **Leitura IA (Reader/Verifier):** A interpretação estruturada do conteúdo da página renderizada gerada pelo LLM.
- **Orçamento Oficial:** A tabela persistida no banco de dados contendo os itens consolidados após revisão HITL.

## 4. Etapas Futuras de Processamento

Embora nesta Fase 2D o processo seja mockado, o pipeline futuro seguirá os seguintes passos:
1. **Receber PDF:** Arquivo chega da Oportunidade.
2. **Validar arquivo:** Checksum, corrupção, senha.
3. **Contar páginas:** Obter número exato.
4. **Renderizar imagem por página:** Converter vetor/rasterização PDF para imagem de alta resolução (ex: 300 DPI).
5. **Gerar thumbnail:** Versão leve para UI.
6. **Extrair texto nativo:** Extrair a camada de texto do PDF (se existir).
7. **Marcar páginas escaneadas:** Se não há camada de texto e há uma imagem cobrindo a página toda, sinalizar `is_scanned = true`.
8. **Preparar páginas para Reader:** Atualizar status do job para `COMPLETED` indicando que a página pode ir para fila do *Reader IA*.

## 5. Status Possíveis e Prontidão

### Status da Renderização (Render Status)
- `PENDING`
- `RENDERING_IMAGE`
- `EXTRACTING_TEXT`
- `COMPLETED`
- `FAILED`
- `BLOCKED`

### Prontidão para o Reader IA (Readiness For Reader)
- `READY`: Tem texto nativo e imagem boa.
- `READY_WITH_WARNINGS`: Tem imagem, não tem texto, mas não aparenta ser escaneamento, ou qualidade incerta.
- `REQUIRES_OCR`: É claramente uma imagem/escaneamento (plantas antigas). Precisará de OCR especializado futuro.
- `BLOCKED`: PDF corrompido, bloqueado por senha, etc.

## 6. Erros Possíveis e Regras de Retry
- **Timeout:** Tentar novamente em 5 minutos.
- **Out of Memory (OOM) no rasterizador:** Reduzir DPI (ex: de 300 para 200) e tentar novamente.
- **Corrupted PDF / Encrypted:** Falha terminante, requer ação humana (BLOCKED).

## 7. Relação com Reader/Verifier

O *Page Processing* é um pré-requisito estrito. O *Reader IA* nunca lê o `document_id`. Ele consome um array de `OrcamentistaRenderedPage`. Se uma página não está `READY` ou `READY_WITH_WARNINGS`, o *Reader* não a recebe na fila primária, garantindo eficiência e evitando custos de token inúteis.

## 8. Gates de Segurança

1. **Nenhum PDF real processado:** O código atual apenas provê o contrato.
2. **Separação de Preocupações:** Renderizar $\neq$ Entender. O renderizador não sabe o que é uma "parede", ele só gera pixels e strings cruas.
3. **Independência do Orçamento:** Nenhuma página renderizada gera itens de orçamento automaticamente.

## 9. Exemplos JSON (Contrato)

```json
{
  "id": "pg-render-8821",
  "document_id": "doc-9912",
  "page_number": 4,
  "render_status": "COMPLETED",
  "has_text_layer": true,
  "is_scanned": false,
  "ready_for_reader": "READY",
  "requires_ocr_future": false,
  "image_ref": {
    "asset_type": "image/webp",
    "storage_ref": "gs://evis-assets/docs/doc-9912/pg-4-high.webp",
    "mime_type": "image/webp",
    "size_bytes": 1048576,
    "generated_by": "evis-pdf-renderer-v1",
    "generated_at": "2026-05-05T10:00:00Z"
  }
}
```
