# PROMPT: REVISAR E AJUSTAR SISTEMA DE ORÇAMENTAÇÃO

> **Destinatário:** GPT (orçamentista)  
> **Objetivo:** Revisar sistema criado e ajustar se necessário

---

## CONTEXTO

O sistema de orçamentação foi criado com a seguinte estrutura:

```
orcamentista/
├── SKILL_ORQUESTRADOR.md
├── skills/
│   ├── SKILL_LEITURA_PROJETO.md
│   ├── SKILL_QUANTITATIVOS.md
│   ├── SKILL_COMPOSICAO_CUSTOS.md
│   ├── SKILL_BDI_ENCARGOS.md
│   ├── SKILL_CRONOGRAMA.md
│   └── SKILL_JSON_EXPORT.md
├── docs/
│   ├── REFERENCIAS_TECNICAS.md
│   ├── BASE_CONHECIMENTO.md (já existe)
│   ├── SCHEMA_EVIS.md (já existe)
│   └── REGRAS_DE_NEGOCIO.md (já existe)
└── templates/ (já existem)
```

---

## TAREFA

Revisar TODOS os arquivos criados e validar se estão:
1. Consistentes entre si
2. Seguindo as especificações corretas
3. Com formato de saída em TABELAS (não texto)
4. Com validação HITL (Human-in-the-Loop) obrigatória

---

## ESPECIFICAÇÕES CRÍTICAS (Validar)

### ✅ 1. Formato de Saída: TABELAS (SEMPRE)

**CORRETO:**
```markdown
| Cód | Descrição | Unid | Qtd | Valor |
|-----|-----------|------|-----|-------|
| 1.1 | Demo piso | m² | 70 | R$ 1.106 |
```

**ERRADO:**
```markdown
- Demolição de piso: 70m²
- Valor: R$ 1.106
```

**Validar:**
- [ ] Orquestrador apresenta tudo em tabelas
- [ ] Todas as skills retornam tabelas
- [ ] Nenhuma skill usa listas com bullets

---

### ✅ 2. SINAPI: Referência (NÃO Obrigatório)

**Regra:**
- SINAPI entra como REFERÊNCIA
- Usuário pode manter ou ajustar
- Sempre informar quando houver divergência

**Validar:**
- [ ] Skills mencionam "SINAPI como referência"
- [ ] Skills permitem ajuste pelo usuário
- [ ] Skills documentam divergências em coluna "Observações"

---

### ✅ 3. BDI: Usuário SEMPRE Define

**Regra:**
- Sistema NUNCA define BDI automaticamente
- Sistema apresenta valores de referência
- Usuário valida/ajusta cada percentual
- Sistema NÃO diferencia obra pública/privada

**Validar:**
- [ ] SKILL_BDI_ENCARGOS apresenta tabela com "% Definido pelo Usuário"
- [ ] SKILL_BDI_ENCARGOS aguarda definição explícita
- [ ] SKILL_BDI_ENCARGOS NÃO pergunta tipo de obra (público/privado)
- [ ] Orquestrador respeita esse fluxo

---

### ✅ 4. Equipes: Podem Ficar "A Definir"

**Regra:**
- Array `equipes` sempre presente na estrutura
- Vínculo `equipe_id` pode ser `null` ou `"a-definir"`
- Usuário pode definir depois da aprovação

**Validar:**
- [ ] SKILL_JSON_EXPORT inclui array `equipes`
- [ ] Permite equipes com status "A definir"
- [ ] JSON schema aceita `equipe_id: null`

---

### ✅ 5. HITL: Validação Obrigatória

**Regra:**
- Toda etapa apresenta RASCUNHO
- Sistema aguarda validação do usuário
- Sistema só prossegue após OK explícito

**Validar:**
- [ ] Orquestrador tem validação após CADA etapa
- [ ] Todas as skills terminam com perguntas de validação:
  ```markdown
  ✅ [Pergunta de confirmação]
  ❓ [Pergunta sobre ajustes]
  ```

---

### ✅ 6. Composição: Insumos + Mão de Obra

**Regra:**
- Todos os serviços têm composição detalhada
- Insumos (mesmo estimados)
- Mão de obra (sempre)
- Equipamentos (se aplicável)

**Validar:**
- [ ] SKILL_COMPOSICAO_CUSTOS monta tabela de insumos
- [ ] SKILL_COMPOSICAO_CUSTOS monta tabela de mão de obra
- [ ] SKILL_COMPOSICAO_CUSTOS monta tabela de equipamentos (se houver)

---

### ✅ 7. Cronograma: Físico-Financeiro

**Regra:**
- NÃO apenas datas (data_inicio/data_fim)
- MAS TAMBÉM: percentual físico + desembolso

**Validar:**
- [ ] SKILL_CRONOGRAMA inclui coluna "% Físico"
- [ ] SKILL_CRONOGRAMA inclui coluna "Desembolso"
- [ ] SKILL_CRONOGRAMA apresenta curva mensal

---

## CHECKLIST DE REVISÃO

### **Etapa 1: Revisar SKILL_ORQUESTRADOR.md**

Verificar se tem:
- [ ] Princípio HITL explícito no início
- [ ] Validação obrigatória após CADA etapa
- [ ] Exemplo de saída em TABELAS (não texto)
- [ ] Menção clara: "apresenta rascunho e aguarda OK"
- [ ] Lista das 6 skills especialistas
- [ ] Fluxo: Etapa 0 → 1 → 2 → 3 → Final

**Se algo estiver errado:** Ajustar o arquivo.

---

### **Etapa 2: Revisar Skills Especialistas**

#### **SKILL_LEITURA_PROJETO.md**
- [ ] Saída em formato de TABELA (ambientes, materiais, sistemas)
- [ ] Pergunta de validação ao final
- [ ] Exemplo de tabela de ambientes

#### **SKILL_QUANTITATIVOS.md**
- [ ] Saída em TABELA (cód, descrição, unid, qtd)
- [ ] Fórmulas documentadas
- [ ] Pergunta de validação ao final

#### **SKILL_COMPOSICAO_CUSTOS.md**
- [ ] Tabela geral de serviços
- [ ] Composição detalhada (insumos + mão de obra + equipamentos)
- [ ] Coluna "Valor SINAPI" vs "Valor Ajustado"
- [ ] Permite ajuste pelo usuário
- [ ] Pergunta de validação ao final

#### **SKILL_BDI_ENCARGOS.md**
- [ ] Tabela com "% Definido pelo Usuário"
- [ ] Pergunta regime tributário
- [ ] AGUARDA definição (não calcula sozinho)
- [ ] NÃO diferencia obra pública/privada
- [ ] Pergunta de validação ao final

#### **SKILL_CRONOGRAMA.md**
- [ ] Tabela com etapas construtivas
- [ ] Colunas: duração, período, % físico, desembolso
- [ ] Curva de desembolso mensal
- [ ] Dependências críticas
- [ ] Pergunta de validação ao final

#### **SKILL_JSON_EXPORT.md**
- [ ] Resumo executivo em TABELAS
- [ ] Estrutura JSON completa documentada
- [ ] Inclui array `equipes` (pode ter status "A definir")
- [ ] Inclui `bdi_detalhamento`
- [ ] Inclui `cronograma_financeiro`
- [ ] Validações de schema

**Se algo estiver errado em QUALQUER skill:** Ajustar o arquivo.

---

### **Etapa 3: Revisar Documentação**

#### **docs/REFERENCIAS_TECNICAS.md**
- [ ] Links para IOPES, UFSC, UFPA, SINAPI
- [ ] Tabelas de produtividade
- [ ] Tabelas de consumo de materiais
- [ ] Tabelas de desperdícios

**Se faltar algo:** Adicionar.

---

### **Etapa 4: Validar Consistência Entre Arquivos**

#### **Exemplo de validação cruzada:**

**Orquestrador diz:**
> "Etapa 1: Chama SKILL_QUANTITATIVOS"

**SKILL_QUANTITATIVOS deve retornar:**
> Tabela de serviços conforme esperado pelo orquestrador

**Validar:**
- [ ] Formato de saída de cada skill bate com o que orquestrador espera
- [ ] Terminologia consistente (todos usam "Cód" ou todos usam "Código")
- [ ] Unidades padronizadas (m², m³, un)

**Se houver inconsistência:** Ajustar arquivos.

---

### **Etapa 5: Criar Arquivos Faltantes**

#### **docs/SCHEMA_JSON_EVIS.md** (se não existir ou estiver incompleto)

Criar documentação completa da estrutura JSON:
- Campos obrigatórios vs opcionais
- Tipos de dados
- Exemplos de valores válidos
- Validações

#### **exemplos/exemplo-estimativa.md** (se não existir)

Criar exemplo completo de orçamento por estimativa:
- Projeto incompleto (só planta básica)
- Conversa com IA
- Quantitativos estimados
- JSON final

#### **exemplos/exemplo-executivo.md** (se não existir)

Criar exemplo completo de orçamento executivo:
- Projeto completo
- Conversa iterativa com IA
- Quantitativos precisos
- Composições SINAPI
- BDI definido pelo usuário
- Cronograma detalhado
- JSON final completo

---

## FORMATO DE ENTREGA

Retornar:

### **1. Relatório de Revisão**

```markdown
# RELATÓRIO DE REVISÃO — Sistema de Orçamentação

## Arquivos Revisados

- [x] SKILL_ORQUESTRADOR.md
- [x] SKILL_LEITURA_PROJETO.md
- [x] SKILL_QUANTITATIVOS.md
- [x] SKILL_COMPOSICAO_CUSTOS.md
- [x] SKILL_BDI_ENCARGOS.md
- [x] SKILL_CRONOGRAMA.md
- [x] SKILL_JSON_EXPORT.md
- [x] docs/REFERENCIAS_TECNICAS.md

## Ajustes Realizados

### SKILL_ORQUESTRADOR.md
- [x] ✅ Já estava correto
- [ ] ❌ Ajustado: [descrição do ajuste]

### SKILL_LEITURA_PROJETO.md
- [x] ✅ Já estava correto
- [ ] ❌ Ajustado: [descrição do ajuste]

[... para cada arquivo ...]

## Arquivos Criados

- [x] docs/SCHEMA_JSON_EVIS.md (completo)
- [x] exemplos/exemplo-estimativa.md
- [x] exemplos/exemplo-executivo.md

## Validações Críticas

- [x] Formato de saída: TABELAS (100% dos arquivos)
- [x] SINAPI: Referência (não obrigatório)
- [x] BDI: Usuário define (não automático)
- [x] Equipes: Podem ficar "a-definir"
- [x] HITL: Validação obrigatória em todas etapas
- [x] Composição: Insumos + Mão de obra
- [x] Cronograma: Físico-financeiro

## Consistência Entre Arquivos

- [x] Terminologia padronizada
- [x] Formato de saída consistente
- [x] Fluxo entre skills validado

## Status Final

✅ **Sistema validado e pronto para uso**
```

### **2. Arquivos Ajustados (se houver)**

Se algum arquivo precisou de ajuste, retornar o arquivo completo corrigido.

### **3. Arquivos Criados**

- `docs/SCHEMA_JSON_EVIS.md` (se criado)
- `exemplos/exemplo-estimativa.md` (se criado)
- `exemplos/exemplo-executivo.md` (se criado)

---

## OBSERVAÇÕES IMPORTANTES

### **Não Altere a Essência**

Se os arquivos estão tecnicamente corretos, apenas:
- Validar consistência
- Corrigir pequenos erros
- Padronizar terminologia
- Criar faltantes

### **Foco em Validação**

A tarefa principal é **VALIDAR** se tudo está conforme especificações:
- Formato tabelas ✅
- SINAPI referência ✅
- BDI usuário define ✅
- HITL obrigatório ✅

### **Reportar Problemas**

Se encontrar algo inconsistente ou errado, documentar claramente:
- O que estava errado
- Por que estava errado
- O que foi ajustado

---

**AGORA REVISE O SISTEMA COMPLETO E RETORNE O RELATÓRIO!**
