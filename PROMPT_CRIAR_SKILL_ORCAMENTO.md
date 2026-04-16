# PROMPT ORQUESTRADO: CRIAR SKILL DE ORÇAMENTO PARA EVIS

> **Destinatário:** GPT (agente externo)  
> **Objetivo:** Criar skill autocontida para transformar orçamentos em JSON padronizado para importação no sistema EVIS

---

## CONTEXTO

Você vai criar uma **SKILL completa e autocontida** que será usada por gestores de obra para transformar orçamentos/propostas em JSON estruturado compatível com o sistema EVIS (Engenharia e Vistorias Integradas de Obras).

Esta skill será usada em conversas externas (outro chat do Claude) onde o gestor desenvolve o orçamento e, ao final, recebe um JSON pronto para importar no EVIS.

---

## ARQUIVOS OBRIGATÓRIOS PARA CONSULTA

**ANTES de criar a skill, você DEVE ler e analisar:**

### 1. Schema Oficial do Supabase
**Arquivo:** `docs/SCHEMA_OFICIAL_V1.sql`
- Estrutura completa das tabelas
- Campos obrigatórios e opcionais
- Tipos de dados
- Constraints e relacionamentos

### 2. Mapeamento Real do Banco
**Resultado do diagnóstico:**
```
obras: id, nome, cliente, status, data_inicio, data_fim, descricao
servicos: id_servico, nome, categoria, avanco_atual, status, equipe, responsavel, data_prevista, data_conclusao, aliases
equipes_cadastro: cod, nome, funcao, telefone, email, pix, contato, status, ativo, aliases
```

### 3. Documentação do Fluxo
**Arquivo:** `docs/CONSOLIDACAO_FLUXO_EVIS.md`
- Fluxo completo do sistema
- O que é importado vs o que surge na gestão
- Boas práticas

### 4. Prompt de Padronização (referência)
**Arquivo:** `docs/PROMPT_PADRONIZACAO_ORCAMENTO.md`
- Regras de transformação
- Categorias padrão
- Códigos de equipes

---

## REQUISITOS DA SKILL

### FORMATO DA SKILL

A skill deve ser um arquivo Markdown (`SKILL.md`) com esta estrutura:

```markdown
# SKILL: Orçamento para EVIS

## Objetivo
[Explicação clara do que a skill faz]

## Como Usar
[Passo a passo para o gestor]

## Schema do EVIS (Supabase)
[Estrutura das tabelas com campos obrigatórios destacados]

## Regras de Transformação
[Como transformar dados brutos em JSON estruturado]

## Categorias Padrão
[Lista de categorias válidas para serviços]

## Códigos de Equipes
[Padrão de códigos: EQ-OBR-01, EQ-ELET-01, etc]

## Template de Saída
[Exemplo de JSON completo]

## Checklist de Validação
[Checklist para validar antes de entregar]

## Exemplos
[Pelo menos 2 exemplos: entrada → saída]
```

---

## ESPECIFICAÇÕES TÉCNICAS

### CAMPOS OBRIGATÓRIOS

**Obra:**
- `id` (string única, formato: obra-{nome-simplificado}-{ano})
- `nome` (string)

**Serviços:**
- `id_servico` (string, formato: SRV-001, SRV-002, etc)
- `nome` (string)

**Equipes:**
- `cod` (string, formato: EQ-TIPO-NN)
- `nome` (string)

### CAMPOS OPCIONAIS (com defaults)

**Obra:**
- `status` (default: "ATIVA")
- `data_inicio` (ISO date)
- `data_fim` (null se em andamento)

**Serviços:**
- `avanco_atual` (default: 0)
- `status` (default: "nao_iniciado")
- `categoria` (extrair do contexto)
- `equipe` (código da equipe responsável)

**Equipes:**
- `ativo` (default: true)
- `aliases` (array vazio se não especificado)

### STATUS VÁLIDOS

```javascript
obra.status: ["ATIVA", "PAUSADA", "CONCLUIDA", "CANCELADA"]
servico.status: ["nao_iniciado", "em_andamento", "concluido", "pausado"]
```

---

## REGRAS DE NEGÓCIO CRÍTICAS

### 1. Geração de IDs

**Obra:**
```
Entrada: "Reforma Loja ABC - 2026"
Saída: "obra-reforma-loja-abc-2026"
```

**Serviços:**
```
Sequencial: SRV-001, SRV-002, ..., SRV-999
```

**Equipes:**
```
Padrão: EQ-{TIPO}-{NUM}
Exemplos:
- EQ-OBR-01 (obra/construção)
- EQ-ELET-01 (elétrica)
- EQ-HIDR-01 (hidráulica)
- EQ-PINT-01 (pintura)
- EQ-ACO-01 (ar-condicionado)
```

### 2. Categorização de Serviços

**Categorias padrão:**
- Preliminares
- Demolições
- Estrutura
- Alvenaria
- Elétrica
- Hidráulica
- Ar-condicionado
- PPCI / Incêndio
- Drywall / Forro
- Pintura
- Revestimento
- Marcenaria
- Limpeza
- Administração

### 3. Aliases (Termos Alternativos)

**Para serviços:**
```
"Instalação Elétrica" → aliases: ["eletrica", "fiação", "pontos de luz", "tomadas"]
```

**Para equipes:**
```
"Construtora Silva" → aliases: ["silva", "construtora", "pedreiro"]
```

### 4. Relacionamento Serviço ↔ Equipe

Cada serviço DEVE ter uma equipe atribuída via campo `equipe` (código da equipe).

---

## FORMATO DE SAÍDA (JSON)

```json
{
  "obra": {
    "id": "obra-exemplo-2026",
    "nome": "Nome do Projeto",
    "cliente": "Nome do Cliente",
    "status": "ATIVA",
    "data_inicio": "2026-01-15",
    "data_fim": null,
    "descricao": "Descrição resumida"
  },
  
  "equipes": [
    {
      "cod": "EQ-OBR-01",
      "nome": "Nome da Equipe",
      "funcao": "Especialidade",
      "telefone": "(00) 00000-0000",
      "email": "email@example.com",
      "pix": "chave-pix",
      "contato": "Nome Contato",
      "status": "ativo",
      "ativo": true,
      "aliases": ["termo1", "termo2"]
    }
  ],
  
  "servicos": [
    {
      "id_servico": "SRV-001",
      "nome": "Nome do Serviço",
      "categoria": "Categoria",
      "avanco_atual": 0,
      "status": "nao_iniciado",
      "equipe": "EQ-OBR-01",
      "responsavel": "Nome Responsável",
      "data_prevista": "2026-02-01",
      "data_conclusao": null,
      "aliases": ["termo1", "termo2"]
    }
  ]
}
```

---

## COMPORTAMENTO ESPERADO DA SKILL

### FLUXO DE USO:

1. **Gestor abre novo chat do Claude**
2. **Cola a skill** (todo o conteúdo do SKILL.md)
3. **Desenvolve o orçamento** conversando com o agente
4. **Ao final, pede:** "Gere o JSON para importação no EVIS"
5. **Agente retorna:** JSON estruturado pronto para copiar/colar
6. **Gestor importa** no EVIS via CONFIG → "Inicializar Projeto (JSON)"

### VALIDAÇÕES AUTOMÁTICAS:

A skill deve incluir checklist de validação:
- [ ] Todos os IDs únicos e sequenciais
- [ ] Campos obrigatórios preenchidos
- [ ] Status dentro das opções válidas
- [ ] Datas no formato ISO (YYYY-MM-DD)
- [ ] Equipes atribuídas aos serviços
- [ ] Aliases gerados
- [ ] JSON válido (sem erros de sintaxe)

---

## EXEMPLOS OBRIGATÓRIOS

### Exemplo 1: Orçamento Simples

**Entrada (bruto):**
```
Reforma Loja ABC
Cliente: João Silva
Início: Março/2026

Serviços:
1. Demolição de paredes - R$ 5.000 - Construtora Silva
2. Instalação elétrica - R$ 15.000 - Eletrotécnica Luz
3. Pintura (2 demãos) - R$ 8.000 - Pinturas Artísticas
```

**Saída (JSON estruturado):**
```json
{
  "obra": {
    "id": "obra-reforma-loja-abc-2026",
    "nome": "Reforma Loja ABC",
    "cliente": "João Silva",
    "status": "ATIVA",
    "data_inicio": "2026-03-01",
    "data_fim": null,
    "descricao": "Reforma completa de loja comercial"
  },
  "equipes": [...],
  "servicos": [...]
}
```

### Exemplo 2: Orçamento Complexo

**Entrada (bruto):**
```
Restaurante Badida - ParkShopping
Cliente: Badida Restaurante
Área: Salão 1 (200m²)

Etapas:
- Preliminares: isolamento, proteções
- Demolição: retirada de forro antigo
- PPCI: sistema de incêndio
- AC: infraestrutura + equipamentos
- Elétrica: cabeamento + acabamentos
- Forro: estrutura + placas
- Pintura: preparação + 2 demãos
- Limpeza final
```

**Saída:** JSON completo com 8 equipes e 20+ serviços categorizados

---

## INSTRUÇÕES FINAIS PARA O GPT

### ANTES DE CRIAR A SKILL:

1. ✅ **Leia** `docs/SCHEMA_OFICIAL_V1.sql` completamente
2. ✅ **Analise** `docs/CONSOLIDACAO_FLUXO_EVIS.md`
3. ✅ **Consulte** `docs/PROMPT_PADRONIZACAO_ORCAMENTO.md`
4. ✅ **Valide** campos obrigatórios vs opcionais
5. ✅ **Confirme** formatos de IDs e códigos

### AO CRIAR A SKILL:

1. ✅ **Seja completo** - skill deve ser autocontida
2. ✅ **Seja claro** - gestor não técnico deve entender
3. ✅ **Seja preciso** - seguir schema EXATO do Supabase
4. ✅ **Inclua exemplos** - pelo menos 2 casos de uso
5. ✅ **Valide JSON** - garantir sintaxe perfeita

### FORMATO DE ENTREGA:

```
skills/orcamento-evis/SKILL.md
```

---

## CHECKLIST FINAL (para o GPT)

Antes de entregar a skill, verifique:

- [ ] Leu SCHEMA_OFICIAL_V1.sql
- [ ] Leu CONSOLIDACAO_FLUXO_EVIS.md
- [ ] Consultou PROMPT_PADRONIZACAO_ORCAMENTO.md
- [ ] Incluiu todos os campos obrigatórios
- [ ] Incluiu defaults corretos
- [ ] Incluiu status válidos
- [ ] Incluiu categorias padrão
- [ ] Incluiu códigos de equipes
- [ ] Incluiu regras de aliases
- [ ] Incluiu template de saída
- [ ] Incluiu checklist de validação
- [ ] Incluiu pelo menos 2 exemplos completos
- [ ] JSON de exemplo é sintaticamente válido
- [ ] Skill é autocontida (não precisa de arquivos externos)
- [ ] Linguagem clara para não-técnicos

---

## OBJETIVO FINAL

**Criar uma skill que permita a QUALQUER gestor:**
1. Abrir Claude em novo chat
2. Colar a skill
3. Desenvolver orçamento conversando
4. Receber JSON perfeito para importar no EVIS

**SEM precisar:**
- Conhecer schema do banco
- Saber programação
- Ler documentação técnica
- Fazer ajustes manuais no JSON

---

**AGORA CRIE A SKILL COMPLETA!**
