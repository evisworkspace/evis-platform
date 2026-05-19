# CICLO DE VALIDAÇÃO OPERACIONAL — ORÇAMENTISTA IA MVP

> **Objetivo:** Mudar o foco da engenharia estrutural para o ajuste fino operacional. Garantir previsibilidade, rastreabilidade e zero alucinação na extração de memoriais descritivos reais, validando o tripé: **IA interpreta → código valida → humano aprova**.

## 1. Critérios de Sucesso e Score Operacional

Para transformar a percepção de qualidade em uma **métrica objetiva e quantitativa**, adotaremos o seguinte peso por critério, gerando um score de 0 a 100 para cada teste:

| Critério | Peso | O que avalia |
|:---|:---|:---|
| **Extração Factual** | 30 | Omitiu algum quantitativo ou serviço? Capturou 100%? |
| **Hallucination** | 25 | Inventou preço, material, quantidade ou serviço inexistente? (Penalidade máxima se falhar) |
| **Normalização** | 20 | Unidades (m², un, vb, cj, m³) estão em formato padrão no JSON? |
| **Segmentação** | 15 | As disciplinas (Demolição, Elétrica, etc.) foram agrupadas de forma lógica? |
| **Evidência** | 10 | O texto que comprova o item está intacto e correto na evidência? |
| **Total** | **100** | **Meta mínima de aceitação: 90/100** |

*O acompanhamento desse score permitirá avaliar cientificamente melhorias no prompt ou comparações entre diferentes LLMs (ex: Gemini Flash vs Pro vs Claude).*

---

## 2. Registro de Padrões de Falha

Para criar **inteligência operacional acumulativa**, cada erro detectado no HITL receberá um código padronizado. Com o tempo, isso guiará a construção de parsers e regex híbridos:

| Código | Tipo de Falha | Frequência Prevista |
|:---|:---|:---|
| **HF-001** | Inventou preço (hallucination monetário) | Baixa |
| **HF-002** | Ignorou quantitativo explícito (omissão) | Alta |
| **HF-003** | Confundiu ou truncou unidade (ex: `m` por `m²`) | Alta |
| **HF-004** | Categoria incorreta (agrupamento ruim) | Média |
| **HF-005** | Evidência truncada ou não encontrada | Média |
| **HF-006** | Adicionou item redundante (duplicidade semântica) | Média |

---

## 3. Matriz de Testes (Dataset Operacional)

Arquivos serão criados no diretório `testes_qa/` para servirem como dataset canônico de calibração.

| ID | Perfil do Documento | Foco do Teste de Stress na IA | Status | Score Final |
|:---|:---|:---|:---|:---|
| `TEST-01` | **Reforma Simples** (Baseline) | Extração direta, formatação de tópicos claros. | ⏳ Pendente | - |
| `TEST-02` | **Alto Padrão** | Identificação de materiais nobres, especificações densas. | ⏳ Pendente | - |
| `TEST-03` | **Obra Comercial (Escala)** | Grandes quantitativos, repetição de itens em múltiplos andares. | ⏳ Pendente | - |
| `TEST-04` | **Obra Estrutural** | Unidades complexas (`m³`, `kg`), fundações e peso. | ⏳ Pendente | - |
| `TEST-05` | **Hidráulica Pesada** | Sistemas pressurizados, diâmetros específicos (`mm`, `pol`). | ⏳ Pendente | - |
| `TEST-06` | **Elétrica Industrial** | Circuitos, quadros complexos, cabeamento longo (`m`). | ⏳ Pendente | - |
| `TEST-07` | **Memorial Desestruturado** | Texto corrido denso, sem tópicos, lista não demarcada. | ⏳ Pendente | - |
| `TEST-08` | **Memorial com Lacunas** | Quantitativos ausentes em alguns itens (deve avisar/ignorar). | ⏳ Pendente | - |
| `TEST-09` | **Manutenção Predial** | Serviços de reparo (pintura de fachada, impermeabilização). | ⏳ Pendente | - |
| `TEST-10` | **Multidisciplinar Massivo** | Todas as disciplinas misturadas num documento grande. | ⏳ Pendente | - |

---

## 4. Próxima Fronteira: Parser Híbrido

O objetivo desta fase é colher dados estatísticos e mapear os padrões de falha. A evolução técnica documentada para depois destes testes será:

* **Regra de Ouro Híbrida:** 
  * A IA fornecerá *Contexto* e *Categoria*.
  * O Parser clássico/Regex será responsável por blindar *Quantitativo* e *Unidade*.
  * O *Grounding* garantirá a precisão da *Evidência*. 
* Essa abordagem hibridizada é muito mais confiável para SaaS técnico do que uma arquitetura 100% LLM-dependente.
