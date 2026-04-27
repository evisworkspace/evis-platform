# PROMPT: ATUALIZAR DOCUMENTAÇÃO DO ORÇAMENTISTA

> **Destinatário:** GPT (orçamentista)  
> **Objetivo:** Atualizar toda documentação para refletir mudanças no fluxo

---

## CONTEXTO

A documentação atual do projeto orçamentista precisa ser **ATUALIZADA** para refletir:

### ✅ Mudanças Confirmadas:

1. **SEM equipes no orçamento inicial**
   - Equipes são atribuídas DEPOIS da aprovação
   - JSON de orçamento NÃO tem array `equipes`

2. **COM valores SINAPI e cronograma**
   - Cada serviço tem `valor_unitario`, `valor_total`
   - Cada serviço tem `data_inicio`, `data_fim`
   - Referência SINAPI (`sinapi_codigo`, `sinapi_descricao`)

3. **Fluxo conversacional (não one-shot)**
   - Refinamento iterativo com usuário
   - Validação em cada etapa
   - Perguntas e respostas até finalizar

4. **Leitura de PDF**
   - IA lê projeto arquitetônico
   - Extrai áreas, dimensões, especificações
   - Identifica sistemas (elétrico, hidráulico, etc)

5. **Consulta ao banco SINAPI**
   - 10.284 composições disponíveis no Supabase
   - Busca textual (FTS)
   - Valores de referência atualizados

---

## TAREFA

Atualizar **TODOS** os arquivos de documentação do projeto orçamentista.

---

## ARQUIVOS A ATUALIZAR

### 1. orcamentista/README.md

**O que atualizar:**

- [ ] Seção "Diferença entre Orçamentista e EVIS Obra"
  - Adicionar: "Orçamentista define VALORES e CRONOGRAMA"
  - Adicionar: "Gestor atribui EQUIPES depois, no EVIS Obra"

- [ ] Seção "Como usar em resumo"
  - Atualizar passo 1: "Enviar PDF do projeto arquitetônico à IA"
  - Atualizar passo 3: "Desenvolver orçamento conversacionalmente (iterativo)"
  - Adicionar: "IA consulta SINAPI e sugere valores"

- [ ] Nova seção: "Capacidades da Skill"
  - Leitura de PDF
  - Consulta ao SINAPI (10.284 composições)
  - Estimativa de cronograma
  - Validação iterativa

**Exemplo de texto atualizado:**

```markdown
## Capacidades da Skill Orçamentista

A skill possui as seguintes capacidades técnicas:

### 📄 Leitura de Projetos (PDF)
- Interpreta plantas baixas
- Extrai áreas, dimensões e quantitativos
- Identifica sistemas (elétrico, hidráulico, estrutural)

### 💰 Consulta ao Banco SINAPI
- 10.284 composições de referência
- Valores atualizados (março/2026)
- Busca inteligente por descrição ou categoria

### 📅 Estimativa de Cronograma
- Sequenciamento lógico de serviços
- Produtividade típica da construção civil
- Validação de dependências (fundação → estrutura → acabamento)

### 🔄 Refinamento Conversacional
- Processo iterativo (não one-shot)
- Validação em cada etapa
- Ajustes conforme feedback do usuário

## O Que o Orçamento Inclui

✅ **INCLUÍDO no JSON de orçamento:**
- Obra (nome, endereço, cliente, datas previstas)
- Serviços (descrição, quantidade, unidade)
- **Valores de referência** (SINAPI quando aplicável)
- **Cronograma estimado** (data_inicio, data_fim de cada serviço)
- Aliases para facilitar referência

❌ **NÃO INCLUÍDO (atribuído depois no EVIS Obra):**
- Equipes (alocação de pessoas)
- Presença (registro de quem trabalhou)
- Diário de obra (andamento real)
- Fotos (progresso visual)
- Pendências (problemas encontrados)

**Razão:** Equipes dependem de disponibilidade real e são atribuídas pelo gestor APÓS aprovação do orçamento pelo cliente.
```

---

### 2. orcamentista/COMO_USAR.md

**O que atualizar:**

- [ ] Passo 1: Preparação
  - Adicionar: "Tenha o PDF do projeto arquitetônico em mãos"

- [ ] Passo 2: Usar a Skill
  - Atualizar: "Envie o PDF à IA"
  - Adicionar: "IA analisará o projeto e extrairá quantitativos"
  - Adicionar: "Valide os quantitativos extraídos"

- [ ] Novo Passo 2.5: Refinamento Iterativo
  - "Converse com a IA sobre cada serviço"
  - "IA buscará composições SINAPI e sugerirá valores"
  - "Valide ou ajuste conforme necessário"

- [ ] Passo 3: Gerar JSON
  - Adicionar: "JSON incluirá valores e cronograma"
  - Adicionar: "JSON NÃO incluirá equipes (atribuídas depois)"

- [ ] Passo 5: Entregar para EVIS
  - Expandir: "Gestor importa JSON → Atribui equipes → Inicia obra"

**Exemplo de texto atualizado:**

```markdown
## Passo 2: Enviar Projeto e Iniciar Orçamento

### 2.1 Enviar PDF
```
Você: Tenho um projeto de reforma de 120m². Vou enviar o PDF.
[anexar arquivo PDF]

IA: Perfeito! Vou analisar o projeto arquitetônico.
    
    📐 Análise Concluída:
    - Área construída: 120m²
    - Ambientes: 3 quartos, 1 sala, 1 cozinha, 2 banheiros
    - Sistemas identificados: elétrico, hidráulico, pintura, piso
    
    Confirma essas informações?
```

### 2.2 Validar Quantitativos
```
Você: Sim, correto!

IA: Ótimo! Vou começar a desenvolver o orçamento.
    Identifiquei os seguintes quantitativos preliminares:
    
    - Demolição de piso: 120m²
    - Instalação elétrica: ~35 pontos
    - Pintura: ~480m² (paredes × 2 faces + teto)
    - Piso cerâmico: 120m²
    
    Esses valores fazem sentido para seu projeto?
```

### 2.3 Refinamento Conversacional
```
Você: A pintura parece muito. Por quê 480m²?

IA: Calculei assim:
    - Perímetro das paredes × pé-direito (2,80m) × 2 faces = 336m²
    - Teto: 120m²
    - Vergas/contravergas: ~24m²
    - Total: 480m²
    
    Se alguma parede já tem acabamento bom (azulejo, etc), 
    podemos descontar. Há paredes que não serão pintadas?

Você: Sim, banheiros são azulejados. Desconta 40m².

IA: Perfeito! Ajustado:
    - Pintura: 440m² (descontado azulejo dos banheiros)
    
    Agora vou buscar valores de referência no SINAPI...
    
    Encontrei:
    - Pintura látex acrílica (2 demãos): R$ 18,50/m²
    - Pintura látex PVA (2 demãos): R$ 14,20/m²
    
    Qual padrão você prefere?
```

[... conversa continua iterativamente até finalizar todos os serviços ...]
```

---

### 3. orcamentista/docs/SCHEMA_EVIS.md

**O que atualizar:**

- [ ] Seção sobre a tabela `servicos`
  - Adicionar campos: `valor_unitario`, `valor_total`, `sinapi_codigo`, `sinapi_descricao`
  - Adicionar campos: `data_inicio`, `data_fim`
  - Marcar como obrigatórios no orçamento

- [ ] Seção sobre a tabela `equipes`
  - Adicionar nota: "NÃO faz parte do orçamento inicial"
  - Explicar: "Equipes são atribuídas pelo gestor APÓS aprovação"

- [ ] Nova seção: "Fluxo de Dados"
  - Orçamentista → JSON (obra + serviços COM valores/cronograma)
  - Cliente → Aprovação
  - Gestor → Importa JSON no EVIS Obra
  - Gestor → Atribui equipes aos serviços
  - Gestor → Inicia execução

**Exemplo de texto atualizado:**

```markdown
## Tabela: servicos

Armazena os serviços planejados para a obra.

### Campos Principais

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | TEXT | ✅ | Identificador único (SRV-001, SRV-002, etc) |
| obra_id | TEXT | ✅ | Referência à obra |
| descricao | TEXT | ✅ | Descrição do serviço |
| categoria | TEXT | ✅ | Categoria (Demolição, Fundação, etc) |
| quantidade | DECIMAL | ✅ | Quantidade numérica |
| unidade | TEXT | ✅ | Unidade (m², m³, un, kg, etc) |
| **valor_unitario** | DECIMAL | ✅ | **Valor por unidade (R$)** |
| **valor_total** | DECIMAL | ✅ | **Valor total (quantidade × unitário)** |
| **data_inicio** | DATE | ✅ | **Data prevista de início** |
| **data_fim** | DATE | ✅ | **Data prevista de término** |
| status | TEXT | ✅ | Status (Planejado, Em Andamento, Concluído) |
| sinapi_codigo | TEXT | ⭕ | Código SINAPI de referência |
| sinapi_descricao | TEXT | ⭕ | Descrição oficial SINAPI |
| observacoes | TEXT | ⭕ | Notas adicionais |

### Sobre Valores e SINAPI

**No orçamento inicial:**
- Todos os serviços DEVEM ter `valor_unitario` e `valor_total`
- Quando aplicável, incluir `sinapi_codigo` e `sinapi_descricao`
- Valores podem ser:
  - Baseados em SINAPI (10.284 composições disponíveis)
  - Negociados com fornecedores
  - Estimados (se serviço muito específico)

**Exemplo de serviço com SINAPI:**

```json
{
  "id": "SRV-001",
  "obra_id": "obra-reforma-loja-abc-2026",
  "descricao": "Demolição de alvenaria de tijolos furados",
  "categoria": "Demolição",
  "quantidade": 15.5,
  "unidade": "m³",
  "valor_unitario": 85.42,
  "valor_total": 1324.01,
  "sinapi_codigo": "97626",
  "sinapi_descricao": "DEMOLICAO DE ALVENARIA DE TIJOLOS FURADOS, DE FORMA MANUAL, SEM REAPROVEITAMENTO",
  "data_inicio": "2026-05-01",
  "data_fim": "2026-05-03",
  "status": "Planejado"
}
```

---

## Tabela: equipes

⚠️ **IMPORTANTE:** Esta tabela NÃO faz parte do orçamento inicial.

### Quando as Equipes São Criadas?

**DEPOIS da aprovação do orçamento:**
1. Cliente aprova orçamento (valores e cronograma)
2. Gestor importa JSON no EVIS Obra
3. Gestor cria equipes conforme disponibilidade real
4. Gestor atribui equipes aos serviços
5. Obra inicia execução

**Por quê não no orçamento?**
- Equipes dependem de disponibilidade (não conhecida na fase de orçamento)
- Alocação pode mudar (férias, outros projetos, contratações)
- Orçamento foca em ESCOPO e CUSTO, não em ALOCAÇÃO

### Estrutura (quando criada no EVIS Obra)

[... estrutura da tabela equipes ...]
```

---

### 4. orcamentista/docs/REGRAS_DE_NEGOCIO.md

**O que atualizar:**

- [ ] Seção sobre geração de IDs
  - Manter regras (SRV-001, etc)

- [ ] Nova seção: "Valores de Referência"
  - Como usar SINAPI
  - Quando divergir do SINAPI
  - Como documentar valores negociados

- [ ] Nova seção: "Cronograma"
  - Regras de sequenciamento
  - Como estimar durações
  - Validação de dependências

- [ ] Atualizar seção: "O Que NÃO Incluir no Orçamento"
  - Explicar: SEM equipes
  - Explicar: SEM registros operacionais (presença, diário, fotos)

**Exemplo de texto atualizado:**

```markdown
## Valores de Referência

### Usar SINAPI Sempre Que Possível

O banco SINAPI possui 10.284 composições de referência com valores atualizados.

**Vantagens:**
- Valores oficiais (governo)
- Aceitos em licitações públicas
- Auditáveis
- Detalhados (insumos, produtividade)

**Como buscar:**
1. Identificar serviço (ex: "demolição de alvenaria")
2. Buscar no SINAPI por palavras-chave
3. Apresentar 3-5 opções ao usuário
4. Validar escolha
5. Incluir `sinapi_codigo` e `sinapi_descricao` no JSON

### Quando Divergir do SINAPI

**Situações válidas:**
- Negociação com fornecedor (volume grande = desconto)
- Região específica (custos locais muito diferentes)
- Método construtivo alternativo (industrializado, pré-moldado)

**Como documentar:**
```json
{
  "id": "SRV-015",
  "descricao": "Fornecimento e instalação de estrutura metálica",
  "valor_unitario": 450.00,
  "observacoes": "Valor negociado com fornecedor XYZ (20% abaixo SINAPI por volume)"
}
```

**Alertar usuário se divergência > 30%:**

```
⚠️ Atenção: Valor informado é 35% menor que a referência SINAPI.

SINAPI: R$ 650,00/m²
Informado: R$ 450,00/m²

Essa diferença tem justificativa (negociação, método diferente)?
```

---

## Cronograma Estimado

### Regras de Sequenciamento

**Dependências obrigatórias:**
```
Fundação → Estrutura → Alvenaria → Instalações → Acabamento
```

**Nunca:**
- Estrutura antes de fundação curada (mínimo 7 dias)
- Alvenaria antes de estrutura concluída
- Pintura antes de reboco seco (mínimo 14 dias)
- Revestimento antes de instalações embutidas

**Pode sobrepor:**
- Instalação elétrica + hidráulica (ambas após alvenaria)
- Pintura de ambientes diferentes
- Revestimentos de áreas independentes

### Estimativa de Duração

**Fórmula:**
```
Duração (dias) = Quantidade ÷ Produtividade Típica
```

**Produtividades de referência:**
[Consultar orcamentista/docs/BASE_CONHECIMENTO.md]

**Exemplo:**
```
Serviço: Alvenaria de vedação
Quantidade: 80m²
Produtividade: 18m²/dia (2 pedreiros + 1 servente)
Duração: 80 ÷ 18 ≈ 5 dias úteis

data_inicio: "2026-05-01"
data_fim: "2026-05-07" (5 dias úteis considerando sábado/domingo)
```

### Validação de Cronograma

**Antes de gerar JSON final, verificar:**

- [ ] Nenhum serviço começa antes de `obra.data_inicio_prevista`
- [ ] Nenhum serviço termina depois de `obra.data_fim_prevista`
- [ ] Dependências respeitadas (fundação antes de estrutura)
- [ ] Curas respeitadas (concreto, reboco)
- [ ] Folgas para imprevistos (+15% margem recomendada)

**Alertar usuário:**

```
⚠️ Cronograma Apertado

Estimativa sem folgas: 45 dias úteis
Estimativa com 15% margem: 52 dias úteis

Cronograma definido pelo cliente: 45 dias

Recomendo comunicar ao cliente o risco de atraso caso haja:
- Chuvas prolongadas
- Falta de materiais
- Imprevistos de campo
```

---

## O Que NÃO Incluir no Orçamento

### ❌ Equipes

**NÃO criar array `equipes` no JSON de orçamento.**

**Razão:**
- Equipes dependem de disponibilidade real (férias, outros projetos)
- Gestor decide alocação APÓS aprovação do orçamento
- Orçamento define ESCOPO e CUSTO, não ALOCAÇÃO

**Fluxo correto:**
1. Orçamentista → JSON (obra + serviços + valores + cronograma)
2. Cliente → Aprova orçamento
3. Gestor → Importa JSON no EVIS Obra
4. Gestor → Cria equipes conforme disponibilidade
5. Gestor → Atribui equipes aos serviços
6. Obra → Inicia execução

### ❌ Registros Operacionais

**NÃO incluir:**
- Presença (quem trabalhou, horas)
- Diário de obra (andamento real)
- Fotos (progresso visual)
- Pendências (problemas encontrados)
- Notas (comunicações)

**Razão:** Isso pertence ao EVIS Obra (fase de execução), não ao orçamento (fase de planejamento).
```

---

### 5. orcamentista/templates/

**O que atualizar:**

- [ ] TEMPLATE_ORCAMENTO_COMPLETO_V3.json
  - Adicionar comentários sobre valores (SINAPI)
  - Adicionar comentários sobre cronograma (estimado)
  - Remover array `equipes` (se existir)
  - Adicionar campos `sinapi_codigo`, `sinapi_descricao` nos serviços

**Exemplo de comentário atualizado:**

```json
{
  "obra": {
    "id": "obra-reforma-loja-abc-2026",
    "nome": "Reforma Loja ABC",
    "// COMENTÁRIO": "data_inicio_prevista e data_fim_prevista são ESTIMATIVAS baseadas no cronograma dos serviços",
    "data_inicio_prevista": "2026-05-01",
    "data_fim_prevista": "2026-06-30"
  },
  "servicos": [
    {
      "id": "SRV-001",
      "descricao": "Demolição de alvenaria",
      "// COMENTÁRIO": "valor_unitario pode vir do SINAPI ou ser negociado. Se SINAPI, incluir sinapi_codigo",
      "valor_unitario": 85.42,
      "valor_total": 1324.01,
      "sinapi_codigo": "97626",
      "sinapi_descricao": "DEMOLICAO DE ALVENARIA DE TIJOLOS FURADOS...",
      "// COMENTÁRIO": "data_inicio e data_fim são ESTIMATIVAS baseadas em produtividade típica",
      "data_inicio": "2026-05-01",
      "data_fim": "2026-05-03"
    }
  ],
  "// COMENTÁRIO IMPORTANTE": "Array 'equipes' NÃO faz parte do orçamento. Equipes são atribuídas pelo gestor APÓS aprovação do orçamento no EVIS Obra."
}
```

---

### 6. orcamentista/exemplos/

**O que atualizar:**

- [ ] exemplo-simples.md
  - Atualizar entrada: incluir "Tenho PDF do projeto"
  - Atualizar conversa: mostrar análise de PDF
  - Atualizar conversa: mostrar consulta ao SINAPI
  - Atualizar JSON: incluir valores, cronograma, SINAPI
  - Remover equipes do JSON

- [ ] exemplo-complexo.md
  - Mesmas atualizações do exemplo-simples
  - Mostrar refinamento iterativo (múltiplas idas e vindas)
  - Mostrar divergência do SINAPI (valor negociado)
  - Mostrar cronograma com dependências complexas

**Estrutura atualizada do exemplo-simples.md:**

```markdown
# Exemplo Simples: Reforma Apartamento 80m²

## 1. Entrada (Início da Conversa)

```
Orçamentista: Olá! Preciso orçar uma reforma de apartamento de 80m².
              Tenho o PDF do projeto arquitetônico aqui.
              [anexa: reforma-apto-80m2.pdf]

IA: Perfeito! Vou analisar o projeto. Aguarde um momento...
    
    📐 Análise Concluída:
    
    **Identificado no Projeto:**
    - Área total: 80m²
    - Ambientes: 2 quartos, 1 sala, 1 cozinha, 1 banheiro
    - Pé-direito: 2,80m
    
    **Serviços Principais:**
    - Demolição de piso existente: 80m²
    - Instalação elétrica: ~25 pontos
    - Pintura: ~360m² (paredes + teto)
    - Piso laminado: 80m²
    
    Essas informações estão corretas?
```

## 2. Validação e Refinamento

```
Orçamentista: Sim, correto. Mas a cozinha será azulejada, não laminado.

IA: Entendido! Ajustado:
    - Piso laminado: 68m² (total - cozinha)
    - Piso cerâmico (cozinha): 12m²
    
    Vou buscar valores de referência no SINAPI...
    
    **Demolição de piso:**
    Encontrei: SINAPI 97630 - Demolição de piso cerâmico - R$ 15,80/m²
    
    **Piso laminado:**
    SINAPI não tem composição específica. Qual valor você trabalha?
    
    **Piso cerâmico:**
    Encontrei: SINAPI 87260 - Piso cerâmico 45x45cm - R$ 62,50/m²
    
    Confirma esses valores ou prefere ajustar?
```

[... conversa continua com elétrica, pintura, cronograma ...]

## 3. JSON Final

```json
{
  "obra": {
    "id": "obra-reforma-apto-silva-2026",
    "nome": "Reforma Apartamento Silva",
    "endereco": "Rua Exemplo, 123 - Apto 45",
    "cliente": "João Silva",
    "tipo_obra": "Reforma",
    "area_total": 80,
    "data_inicio_prevista": "2026-05-01",
    "data_fim_prevista": "2026-05-28",
    "valor_total_estimado": 18500.00,
    "status": "Planejada"
  },
  "servicos": [
    {
      "id": "SRV-001",
      "obra_id": "obra-reforma-apto-silva-2026",
      "descricao": "Demolição de piso cerâmico existente",
      "categoria": "Demolição",
      "quantidade": 80,
      "unidade": "m²",
      "valor_unitario": 15.80,
      "valor_total": 1264.00,
      "sinapi_codigo": "97630",
      "sinapi_descricao": "DEMOLICAO DE PISO CERAMICO",
      "data_inicio": "2026-05-01",
      "data_fim": "2026-05-02",
      "status": "Planejado"
    },
    {
      "id": "SRV-002",
      "obra_id": "obra-reforma-apto-silva-2026",
      "descricao": "Instalação de piso laminado (quartos e sala)",
      "categoria": "Acabamento",
      "quantidade": 68,
      "unidade": "m²",
      "valor_unitario": 85.00,
      "valor_total": 5780.00,
      "observacoes": "Valor negociado com fornecedor XYZ (não há SINAPI para laminado)",
      "data_inicio": "2026-05-20",
      "data_fim": "2026-05-24",
      "status": "Planejado"
    }
    // ... outros serviços
  ],
  "aliases": [
    {
      "alias": "reforma apto silva",
      "tipo": "obra",
      "referencia_id": "obra-reforma-apto-silva-2026"
    }
  ]
}
```

## 4. Como Importar no EVIS Obra

[... passo a passo visual ...]
```

---

## CHECKLIST FINAL

Antes de finalizar as atualizações:

- [ ] README.md atualizado (capacidades, fluxo)
- [ ] COMO_USAR.md atualizado (PDF, refinamento iterativo)
- [ ] SCHEMA_EVIS.md atualizado (valores, cronograma, sem equipes)
- [ ] REGRAS_DE_NEGOCIO.md atualizado (SINAPI, cronograma)
- [ ] Templates atualizados (comentários sobre valores/cronograma)
- [ ] Exemplos atualizados (PDF, SINAPI, sem equipes)
- [ ] Linguagem consistente em todos os arquivos
- [ ] Referências cruzadas corretas
- [ ] SEM equipes em TODOS os exemplos/templates

---

## FORMATO DE ENTREGA

Retornar os arquivos atualizados:

1. ✅ orcamentista/README.md
2. ✅ orcamentista/COMO_USAR.md
3. ✅ orcamentista/docs/SCHEMA_EVIS.md
4. ✅ orcamentista/docs/REGRAS_DE_NEGOCIO.md
5. ✅ orcamentista/templates/TEMPLATE_ORCAMENTO_COMPLETO_V3.json
6. ✅ orcamentista/exemplos/exemplo-simples.md
7. ✅ orcamentista/exemplos/exemplo-complexo.md

---

## OBSERVAÇÃO IMPORTANTE

### Consistência é Crítica

Todos os documentos devem estar **ALINHADOS**:
- Mesma terminologia
- Mesmo fluxo
- Mesmas regras

**Se README diz "SEM equipes", TODOS os outros devem dizer "SEM equipes".**

### Validação Cruzada

Antes de entregar, verificar:
- [ ] Nenhum exemplo tem array `equipes` no JSON
- [ ] Todos os templates têm `valor_unitario`, `valor_total`, `data_inicio`, `data_fim`
- [ ] Todas as referências ao SINAPI estão corretas (10.284 composições)
- [ ] Todos os guias mencionam processo conversacional (não one-shot)

---

**AGORA ATUALIZE TODA A DOCUMENTAÇÃO DO ORÇAMENTISTA!**
