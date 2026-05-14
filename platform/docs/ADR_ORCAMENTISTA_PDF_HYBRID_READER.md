# ADR — Orçamentista IA: Leitura Híbrida de PDFs

**Status:** Aceito  
**Data:** 2025-05  
**Autores:** time EVIS + Claude Opus 4.7  
**Etapa:** 5

---

## Contexto

O módulo Orçamentista IA precisa extrair texto e quantitativos de documentos enviados
como arquivos de oportunidade. A maioria dos documentos de obra chega em PDF e pode
ser de dois tipos fundamentalmente diferentes:

1. **PDF de texto**: contratos, planilhas exportadas, memoriais descritivos digitados —
   o texto está embutido na camada de texto do PDF e pode ser extraído diretamente.

2. **PDF de desenho técnico**: plantas, cortes, fachadas — o conteúdo é uma imagem
   rasterizada ou vetorial sem camada de texto. Requer leitura visual (multimodal).

Escolher uma estratégia única para ambos é subótima: OCR/LLM em texto já embutido
é desperdício; parser de texto em desenho retorna vazio ou lixo.

---

## Opções consideradas

### A — pdf-parse / pdfjs (Node.js, local)

**Como funciona:** `pdf-parse` usa `pdfjs-dist` para extrair a camada de texto
do PDF sem nenhuma dependência externa. 100% local, zero custo de API.

**Vantagens:**
- Zero latência de rede, zero custo por chamada.
- Funciona offline. Sem risco de vazamento de dados para terceiros.
- Ideal para PDFs bem formados (texto embutido).

**Desvantagens:**
- Retorna vazio ou caracteres ilegíveis em PDFs de imagem/scan.
- Não entende layout (tabelas, colunas) — texto sai como fluxo linear.
- Plantas baixas com anotações de cotas saem como ruído ininteligível.

**Veredicto:** excelente para PDFs de texto, inútil para técnicos visuais.

---

### B — Docling / Python sidecar

**Como funciona:** Docling é uma biblioteca Python (IBM Research) que entende
estrutura de documentos — tabelas, listas, hierarquias de títulos — e exporta
Markdown ou JSON estruturado. Rodaria como um processo sidecar (spawn ou HTTP).

**Vantagens:**
- Extrai tabelas de forma estruturada, muito melhor que pdf-parse.
- Suporta DOC, DOCX, XLSX além de PDF.

**Desvantagens:**
- Adiciona Python runtime ao stack Node.js + Vite. Complexidade operacional alta.
- Sidecar HTTP exige processo extra em produção (Render/Railway).
- Latência de inicialização do processo Python (~2–5 s cold start).
- Não resolve PDFs de imagem sem OCR adicional (Tesseract).

**Veredicto:** interessante para o médio prazo (quando houver planilhas XLSX reais),
mas overhead injustificável neste sprint.

---

### C — Gemini multimodal (Google AI)

**Como funciona:** Envio da imagem/página do PDF para Gemini Vision. O modelo
descreve o conteúdo visual, incluindo tabelas de quantitativos, cotas e legendas.

**Vantagens:**
- Único método capaz de ler plantas baixas, cortes e fachadas.
- Extrai cotas, especificações de materiais e símbolos de convenção arquitetônica.
- Não requer instalação local de OCR.

**Desvantagens:**
- Custo por chamada de API (token de imagem é mais caro que texto).
- Latência de rede (300–2000 ms por página).
- Envolve envio de documentos possivelmente confidenciais para API externa.
- Qualidade varia conforme resolução da imagem e complexidade do desenho.
- Requer `GEMINI_API_KEY` configurado.

**Veredicto:** indispensável para desenhos técnicos, mas deve ser opt-in e
sinalizado como "Laboratório IA" na UI.

---

### D (Escolhida) — Abordagem Híbrida Local + Multimodal LAB

Combina A e C com fallback explícito e sinalização clara ao usuário.

---

## Decisão

**Adotar leitura híbrida em duas faixas:**

### Faixa 1 — Extração local (produção, sprint atual)

Usado em `extractTextEvidenceFromFile()` já implementado:

1. Verificar MIME type do arquivo.
2. Para `.txt`, `.csv`, `.json`, `.md`: extração direta (string UTF-8).
3. Para `.pdf` com flag `EVIS_ORCAMENTISTA_ENABLE_PDF_PARSE=true`:
   - Chamar `pdf-parse` sobre o buffer em memória.
   - Se `text.trim().length < 50`: classificar como `pdf_image_detected`, não extrair.
   - Se texto extraído: retornar como `text_excerpt` evidence.
4. Para outros tipos: retornar `unsupported_file_type`.

Sem dependência de rede. Sem custo de API.

### Faixa 2 — Leitura multimodal (LAB, gated por flag)

Habilitada com `EVIS_ORCAMENTISTA_ENABLE_AI_ANALYZE=true`:

1. Converter cada página do PDF para PNG (via `pdfjs-dist` renderer ou `pdf2pic`).
2. Enviar para `geminiService.analyzeImage()` com prompt especializado:
   - "Liste quantitativos, dimensões, materiais e serviços visíveis nesta planta."
3. Resultado retorna como evidence com `evidence_type = 'ai_extracted'` e
   `confidence` preenchida pelo modelo.
4. UI sinaliza: badge "LABORATÓRIO IA" em laranja. Usuário deve revisar via HITL.

### Sinalização na UI

| Situação | Badge | Texto de apoio |
|----------|-------|----------------|
| Texto extraído localmente | TEXTO EXTRAÍDO | Evidência rastreável, sem IA |
| PDF sem texto (imagem) | LEITURA VISUAL | Requer Lab IA habilitado |
| Multimodal LAB ativo | LABORATÓRIO IA | Revisar via HITL obrigatório |
| Formato não suportado | NÃO SUPORTADO | Converter para TXT/CSV |

---

## Consequências

**Positivas:**
- Sprint atual funciona sem Gemini: arquivos TXT/CSV já geram evidências reais.
- PDFs de texto funcionam assim que `pdf-parse` for adicionado ao projeto.
- PDFs de desenho têm caminho claro via LAB sem bloquear o sprint atual.
- Custo de API zero para a maioria dos documentos.

**Negativas / trade-offs:**
- PDFs de imagem ficam em `pdf_image_detected` sem extração até LAB ser habilitado.
- Múltiplas flags de feature aumentam superfície de configuração.
- pdf2pic requer `graphicsmagick` ou `imagemagick` instalado no servidor — requer
  provisioning extra em produção.

**Decisão técnica registrada:** não adicionar `pdf-parse` nem `pdf2pic` neste sprint
até o primeiro PDF real de cliente ser fornecido para teste. Manter o stub
`pdf_parser_unavailable` no `fileTextExtraction.ts` e documentar que a integração
segue este ADR.

---

## Referências

- [pdf-parse npm](https://www.npmjs.com/package/pdf-parse) — extração de texto local
- [pdfjs-dist](https://www.npmjs.com/package/pdfjs-dist) — renderização de página para PNG
- [Docling (IBM)](https://github.com/DS4SD/docling) — parsing estruturado Python
- [pdf2pic](https://www.npmjs.com/package/pdf2pic) — wrapper Node para ImageMagick
- [Gemini Vision API](https://ai.google.dev/gemini-api/docs/vision) — leitura multimodal
- `src/services/geminiService.ts` — wrapper existente no projeto
- `platform/server/orcamentista/fileTextExtraction.ts` — implementação atual (Faixa 1)
