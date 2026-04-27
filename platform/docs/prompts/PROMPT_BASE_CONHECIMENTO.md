# PROMPT: COMPILAR BASE DE CONHECIMENTO TÉCNICO

> **Destinatário:** GPT (orçamentista)  
> **Objetivo:** Criar base de conhecimento técnico para orçamentação de obras

---

## CONTEXTO

A skill de orçamentista precisa de **conhecimento técnico** para:
- Interpretar projetos corretamente
- Sugerir sequências construtivas lógicas
- Validar quantitativos extraídos
- Identificar inconsistências
- Alertar sobre erros comuns

Este conhecimento deve ser **compilado em documento** para:
1. Ser injetado na skill (contexto)
2. Servir de referência para o orçamentista (humano)
3. Garantir consistência nas recomendações

---

## TAREFA

Criar arquivo `orcamentista/docs/BASE_CONHECIMENTO.md` com conhecimento técnico organizado.

---

## ESTRUTURA DO DOCUMENTO

### 1. SEQUÊNCIAS CONSTRUTIVAS

#### Obra Nova - Sequência Padrão

```markdown
## Sequência Construtiva - Obra Nova

### 1. Serviços Preliminares
**Ordem:**
1. Limpeza do terreno
2. Locação da obra (gabarito)
3. Instalação de canteiro (se necessário)

**Duração típica:** 2-5 dias  
**Dependências:** Nenhuma (início absoluto)

---

### 2. Fundação
**Ordem:**
1. Escavação
2. Compactação de fundo
3. Lastro de concreto
4. Armação e forma
5. Concretagem

**Duração típica:** 5-15 dias (conforme porte)  
**Dependências:** Serviços preliminares concluídos  
**Cura:** 7 dias antes de carregar

---

### 3. Estrutura
**Ordem:**
1. Pilares (1° pavimento)
2. Vigas e lajes (1° pavimento)
3. [Repetir para pavimentos superiores]

**Duração típica:** 10-30 dias (conforme porte)  
**Dependências:** Fundação curada (7 dias)  
**Cura:** 28 dias para resistência total (mas pode prosseguir com cuidado após 7 dias)

---

### 4. Alvenaria
**Ordem:**
1. Elevação de paredes (1° pavimento)
2. Vergas e contravergas
3. [Repetir para pavimentos superiores]

**Duração típica:** 15-40 dias  
**Dependências:** Estrutura concluída (pode começar após cura de 7 dias)  
**Atenção:** Esperar 24h entre cada 1,5m de altura (assentamento)

---

### 5. Instalações (Elétrica + Hidráulica)
**Ordem:**
1. Marcação de pontos
2. Rasgos (se alvenaria já rebocada)
3. Tubulações elétricas (eletrodutos, caixas)
4. Tubulações hidráulicas (água, esgoto)
5. Passagem de fiação (elétrica)

**Duração típica:** 10-25 dias  
**Dependências:** Alvenaria concluída  
**Simultâneo:** Elétrica e hidráulica podem ser feitas simultaneamente

---

### 6. Revestimentos
**Ordem:**
1. Chapisco (aderência)
2. Emboço/reboco
3. Contrapiso
4. Impermeabilização (áreas molhadas)
5. Revestimento final (cerâmica, porcelanato)

**Duração típica:** 20-50 dias  
**Dependências:** Instalações concluídas  
**Cura:** Reboco seco (7-14 dias) antes de pintura

---

### 7. Cobertura
**Ordem:**
1. Estrutura do telhado (madeiramento ou metálico)
2. Ripamento
3. Telhas
4. Calhas e rufos

**Duração típica:** 5-15 dias  
**Dependências:** Estrutura e alvenaria periférica concluídas  
**Atenção:** Fazer antes das chuvas (se possível)

---

### 8. Esquadrias
**Ordem:**
1. Marcos (portas e janelas)
2. Folhas de portas
3. Vidros (janelas)
4. Ferragens

**Duração típica:** 5-10 dias  
**Dependências:** Alvenaria e revestimento dos vãos concluídos  
**Atenção:** Proteger durante pintura

---

### 9. Pintura
**Ordem:**
1. Lixamento e correções
2. Massa corrida (se padrão médio/alto)
3. Selador
4. Pintura (2 demãos mínimo)

**Duração típica:** 10-20 dias  
**Dependências:** Reboco curado (14 dias) e seco  
**Atenção:** Umidade < 13% para pintar

---

### 10. Acabamentos Finais
**Ordem:**
1. Pisos finais (se ainda não instalados)
2. Louças e metais
3. Instalação elétrica final (luminárias, tomadas, interruptores)
4. Rodapés e soleiras
5. Limpeza final

**Duração típica:** 5-15 dias  
**Dependências:** Pintura concluída  
```

#### Reforma - Sequência Adaptada

```markdown
## Sequência Construtiva - Reforma

### Diferenças vs Obra Nova

1. **SEMPRE começar com:**
   - Proteção de áreas que não serão reformadas
   - Escoramento de lajes (se demolição estrutural)
   - Desligamento de instalações (água, luz, gás)

2. **Demolições ANTES de construção:**
   - Demolir paredes/pisos ANTES de elevar alvenaria nova
   - Remover instalações antigas ANTES de instalar novas
   - Rasgar reboco ANTES de embutir tubulações

3. **Sequência após demolições:**
   - Segue ordem similar a obra nova (fundação → estrutura → alvenaria → etc)
   - Mas com MAIS atenção a interfaces (novo × existente)

### Cuidados Especiais em Reformas

⚠️ **Estruturas existentes:**
- Verificar estado de conservação (pode precisar reforço)
- Nunca demolir sem laudo técnico (paredes estruturais)

⚠️ **Instalações:**
- Mapear instalações existentes (evitar perfurar canos/fios)
- Compatibilizar novo com existente (bitolas, pressões)

⚠️ **Interferências:**
- Obra pode estar ocupada (morador no local)
- Horários restritos (condomínios)
- Acesso limitado (elevador, escadas)

⚠️ **Descarte:**
- Entulho de demolição (volume maior que obra nova)
- Descarte legal (caçamba, bota-fora licenciado)
```

---

### 2. PRODUTIVIDADE E ESTIMATIVAS

```markdown
## Produtividade Típica por Serviço

### Fundação

| Serviço | Produtividade | Equipe Padrão | Observações |
|---------|---------------|---------------|-------------|
| Escavação manual | 3-5 m³/dia | 2 serventes | Solo comum |
| Escavação mecanizada | 20-40 m³/dia | 1 operador + retro | Solo comum |
| Lastro de concreto | 15-25 m²/dia | 3 pessoas | Espessura 5cm |
| Sapata (forma + armação + concreto) | 1-2 sapatas/dia | 4 pessoas | Sapata média |

### Estrutura

| Serviço | Produtividade | Equipe Padrão | Observações |
|---------|---------------|---------------|-------------|
| Pilar (forma + armação + concreto) | 1-2 pilares/dia | 4-5 pessoas | Altura 3m |
| Laje (forma + armação + concreto) | 10-20 m²/dia | 6-8 pessoas | Laje maciça |
| Viga (forma + armação + concreto) | 5-10 m/dia | 5-6 pessoas | Viga padrão |

### Alvenaria

| Serviço | Produtividade | Equipe Padrão | Observações |
|---------|---------------|---------------|-------------|
| Alvenaria de vedação (tijolo furado) | 15-20 m²/dia | 2 pedreiros + 1 servente | Espessura 9cm |
| Alvenaria estrutural (bloco concreto) | 8-12 m²/dia | 2 pedreiros + 1 servente | Espessura 14cm |

### Revestimentos

| Serviço | Produtividade | Equipe Padrão | Observações |
|---------|---------------|---------------|-------------|
| Chapisco | 40-60 m²/dia | 2 pessoas | Manual |
| Reboco | 20-30 m²/dia | 2 pedreiros | Espessura 2cm |
| Contrapiso | 30-50 m²/dia | 3 pessoas | Espessura 5cm |
| Cerâmica piso | 8-12 m²/dia | 1 pedreiro + 1 servente | Padrão simples |
| Porcelanato | 5-8 m²/dia | 1 pedreiro + 1 servente | Padrão alto |

### Instalações

| Serviço | Produtividade | Equipe Padrão | Observações |
|---------|---------------|---------------|-------------|
| Instalação elétrica (tubulação) | 10-15 pontos/dia | 1 eletricista | Pontos simples |
| Instalação hidráulica (tubulação) | 5-8 pontos/dia | 1 encanador | Água fria |
| Instalação esgoto | 4-6 pontos/dia | 1 encanador | Tubos PVC |

### Pintura

| Serviço | Produtividade | Equipe Padrão | Observações |
|---------|---------------|---------------|-------------|
| Lixamento + massa corrida | 20-30 m²/dia | 2 pessoas | 2 demãos |
| Pintura látex | 40-60 m²/dia | 2 pintores | 2 demãos |
| Pintura esmalte | 25-35 m²/dia | 2 pintores | 2 demãos |

### Cobertura

| Serviço | Produtividade | Equipe Padrão | Observações |
|---------|---------------|---------------|-------------|
| Estrutura de madeira | 15-25 m²/dia | 2 carpinteiros | Telhado simples |
| Instalação de telhas cerâmicas | 20-30 m²/dia | 2 pessoas | Telhado simples |
| Instalação de telhas metálicas | 30-50 m²/dia | 2 pessoas | Telhado simples |

---

## Fatores que Afetam Produtividade

### ⬆️ Aumentam Produtividade:
- Equipe experiente
- Materiais de qualidade
- Equipamentos adequados
- Projeto bem detalhado
- Boa organização do canteiro
- Clima favorável

### ⬇️ Reduzem Produtividade:
- Equipe inexperiente
- Falta de materiais
- Retrabalho (erros de projeto)
- Acesso difícil (reformas, pavimentos altos)
- Chuva/clima adverso
- Interferências (outras equipes, morador no local)

**Margem de segurança recomendada:** +15% a +25% no prazo total
```

---

### 3. NORMAS TÉCNICAS (NBRs) RELEVANTES

```markdown
## NBRs Importantes para Orçamentação

### Fundação
- **NBR 6122** - Projeto e execução de fundações
- **Quando citar:** Ao sugerir tipo de fundação (sapata, radier, estaca)

### Estrutura de Concreto
- **NBR 6118** - Projeto de estruturas de concreto
- **Quando citar:** Ao falar de resistência do concreto (fck), cobrimento de armadura

### Alvenaria
- **NBR 15270** - Componentes cerâmicos (blocos e tijolos)
- **NBR 15812** - Alvenaria estrutural (blocos de concreto)
- **Quando citar:** Ao escolher tipo de bloco/tijolo

### Instalações Elétricas
- **NBR 5410** - Instalações elétricas de baixa tensão
- **Quando citar:** Ao dimensionar pontos elétricos, circuitos, quadro de distribuição

### Instalações Hidráulicas
- **NBR 5626** - Sistemas prediais de água fria
- **NBR 8160** - Sistemas prediais de esgoto sanitário
- **Quando citar:** Ao dimensionar tubulações, reservatórios

### Impermeabilização
- **NBR 9575** - Impermeabilização - Seleção e projeto
- **Quando citar:** Em áreas molhadas (banheiros, cozinha, laje de cobertura)

### Revestimentos
- **NBR 13755** - Revestimento de paredes externas e fachadas com placas cerâmicas
- **NBR 13817** - Classificação de placas cerâmicas (PEI, absorção de água)
- **Quando citar:** Ao especificar cerâmica/porcelanato (área interna vs externa, tráfego)

### Pintura
- **NBR 15079** - Tintas para edificações não industriais - Classificação
- **Quando citar:** Ao especificar tipo de tinta (acrílica, látex, esmalte)

### Acessibilidade
- **NBR 9050** - Acessibilidade a edificações
- **Quando citar:** Quando projeto incluir rampas, banheiros acessíveis

---

## Como Usar NBRs na Orçamentação

**NÃO é necessário:**
- Decorar toda a NBR
- Citar número da norma sempre

**É necessário:**
- Saber que existem normas para cada área
- Mencionar quando especificação pode estar fora do padrão
- Alertar usuário sobre requisitos mínimos

**Exemplo de uso:**

```
❌ ERRADO:
Serviço: Contrapiso 3cm
IA: OK, anotado.

✅ CERTO:
Serviço: Contrapiso 3cm
IA: Entendido. Para contrapiso, a espessura mínima recomendada 
    é 5cm (NBR 15575 - desempenho de edificações). 
    Contrapiso de 3cm pode apresentar problemas de fissuração.
    
    Deseja manter 3cm ou ajustar para 5cm?
```
```

---

### 4. ERROS COMUNS E COMO EVITAR

```markdown
## Erros Comuns em Orçamentação

### 1. Quantitativos Errados

#### Erro: Esquecer desperdício
```
❌ ERRADO:
Área de piso: 100m²
Cerâmica a comprar: 100m²

✅ CERTO:
Área de piso: 100m²
Cerâmica a comprar: 110m² (desperdício 10%)
```

**Desperdícios típicos:**
- Cerâmica/porcelanato: +10% a +15%
- Pintura: +10%
- Argamassa: +15% a +20%
- Concreto: +5% a +10%

#### Erro: Esquecer áreas não visíveis
```
❌ ERRADO:
Pintura: área de piso × 2 faces = 200m²

✅ CERTO:
Pintura: (perímetro × pé-direito × 2 faces) + teto + vergas/contravergas
```

#### Erro: Confundir unidades
```
❌ ERRADO:
Demolição de alvenaria: 50m² (área da parede)

✅ CERTO:
Demolição de alvenaria: 50m² × 0,15m (espessura) = 7,5m³
```

---

### 2. Sequenciamento Impossível

#### Erro: Pintar antes do reboco secar
```
❌ ERRADO:
Reboco: 01/05 a 15/05
Pintura: 16/05 a 25/05 (começar no dia seguinte)

✅ CERTO:
Reboco: 01/05 a 15/05
Cura/secagem: 15/05 a 29/05 (14 dias)
Pintura: 30/05 a 08/06
```

#### Erro: Estrutura antes de fundação curar
```
❌ ERRADO:
Fundação: 01/05 a 05/05
Estrutura: 06/05 a 20/05 (começar no dia seguinte)

✅ CERTO:
Fundação: 01/05 a 05/05
Cura: 05/05 a 12/05 (7 dias mínimo)
Estrutura: 13/05 a 27/05
```

---

### 3. Valores Incompatíveis

#### Erro: Valor muito abaixo do SINAPI sem justificativa
```
❌ ERRADO:
Alvenaria: R$ 25,00/m² (SINAPI: R$ 85,00/m²)

✅ CERTO:
Alvenaria: R$ 85,00/m² (SINAPI)
[Se usuário insistir em R$ 25,00, perguntar razão]
```

**Quando valor pode ser diferente do SINAPI:**
- Negociação direta com fornecedor (materiais em grande volume)
- Região específica (custos locais muito diferentes)
- Método construtivo alternativo (industrializado)

**Sempre perguntar ao usuário se valor divergir >30% do SINAPI.**

---

### 4. Falta de Serviços Essenciais

#### Serviços frequentemente esquecidos:

```markdown
✅ CHECKLIST de Serviços Essenciais:

**Antes da obra:**
- [ ] Limpeza do terreno
- [ ] Locação (gabarito)
- [ ] Ligações provisórias (água, luz)
- [ ] Tapume/proteção (se necessário)

**Demolição (reformas):**
- [ ] Proteção de áreas não reformadas
- [ ] Escoramento (se estrutural)
- [ ] Descarte de entulho

**Fundação:**
- [ ] Escavação
- [ ] Lastro
- [ ] Impermeabilização (se lençol freático alto)

**Estrutura:**
- [ ] Forma + escoramento
- [ ] Armação
- [ ] Concreto + adensamento

**Instalações:**
- [ ] Água fria
- [ ] Esgoto
- [ ] Elétrica
- [ ] [Gás, se aplicável]
- [ ] [Telefone/internet, se aplicável]

**Acabamento:**
- [ ] Pintura de fundo (selador)
- [ ] Impermeabilização (áreas molhadas)
- [ ] Rodapés
- [ ] Soleiras
- [ ] Limpeza final

**Após a obra:**
- [ ] Limpeza final
- [ ] Retirada de entulho
- [ ] Vistoria técnica (se aplicável)
```
```

---

### 5. CÁLCULOS E FÓRMULAS ÚTEIS

```markdown
## Fórmulas Comuns

### Áreas e Volumes

**Área de parede:**
```
Área = Perímetro × Pé-direito - Vãos (portas/janelas)
```

**Volume de alvenaria:**
```
Volume (m³) = Área da parede (m²) × Espessura (m)
```

**Volume de concreto (laje):**
```
Volume = Área da laje × Espessura
```

**Volume de escavação:**
```
Volume = Comprimento × Largura × Profundidade
```

### Quantidades de Materiais

**Blocos/tijolos por m²:**
```
Tijolo furado 9cm (10×20×20): 25 unidades/m²
Bloco concreto 14cm (14×19×39): 12,5 unidades/m²
```

**Argamassa para reboco:**
```
Espessura 2cm: ~30 kg/m² (argamassa seca)
Espessura 3cm: ~45 kg/m²
```

**Concreto usinado:**
```
Laje 10cm: 0,10 m³/m²
Laje 12cm: 0,12 m³/m²
```

**Pintura (rendimento):**
```
Látex: 1 galão (3,6L) rende 35-50m² (2 demãos)
Esmalte: 1 galão (3,6L) rende 25-35m² (2 demãos)
```

### Conversões Úteis

```
1 m³ = 1.000 litros
1 saco de cimento (50kg) = 36 litros
1 m³ de areia = ~1.500 kg
1 m³ de brita = ~1.450 kg
```
```

---

## CHECKLIST FINAL

Antes de finalizar o documento de conhecimento:

- [ ] Sequência construtiva obra nova documentada
- [ ] Sequência construtiva reforma documentada
- [ ] Diferenças obra nova vs reforma explicadas
- [ ] Tabela de produtividades completa
- [ ] NBRs principais listadas (com quando usar)
- [ ] Erros comuns identificados (com exemplos)
- [ ] Checklist de serviços essenciais
- [ ] Fórmulas e cálculos úteis
- [ ] Exemplos práticos em cada seção
- [ ] Linguagem clara (não-técnico entende)

---

## FORMATO DE ENTREGA

Retornar o arquivo completo:

✅ **orcamentista/docs/BASE_CONHECIMENTO.md**

---

## OBSERVAÇÃO IMPORTANTE

Este documento será usado:
1. **Pela skill (IA):** Contexto para tomar decisões técnicas
2. **Pelo orçamentista (humano):** Referência para tirar dúvidas

Por isso:
- Linguagem CLARA (não-técnico entende)
- Exemplos PRÁTICOS (não teoria acadêmica)
- Foco em ORÇAMENTAÇÃO (não execução detalhada)

---

**AGORA COMPILE A BASE DE CONHECIMENTO TÉCNICO!**
