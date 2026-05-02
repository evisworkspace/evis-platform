# EVIS — Direção Visual do Produto

> Documento de referência para design e desenvolvimento de interface.
> Não contém código. Não altera banco. Não gera migrations.

---

## 1. Princípio Geral

O EVIS suporta modo claro e modo escuro desde a fundação do sistema.
Os dois modos são cidadãos de primeira classe — não existe um "modo principal" com adaptação do outro.

| Modo | Contexto ideal |
|------|---------------|
| Dark mode | Cockpit operacional, IA, dashboards, diário de obra, visualizações técnicas |
| Light mode | Cadastros, leitura de propostas, áreas comerciais, telas de cliente |

**Regra de transição:** o usuário pode alternar o modo a qualquer momento. Nenhuma funcionalidade deve ser exclusiva de um modo.

---

## 2. Personalidade Visual

O EVIS é um SaaS técnico premium para construtoras, arquitetos, engenheiros e gestores de obra.

**Referências de personalidade:**
- Software de engenharia de alto padrão (AutoCAD, Revit, Procore)
- Dashboard de cockpit de gestão operacional
- Clareza comercial aliada a profundidade técnica
- Robusto, limpo e confiável — não minimalista por moda

**Tom visual:**
- Sólido e estruturado, com hierarquia clara
- Cores técnicas e neutras dominam; acentos de cor têm função semântica
- Tipografia de alta legibilidade em ambos os modos
- Ícones funcionais (`lucide-react`), nunca ilustrativos ou decorativos

**O que o EVIS não é:**
- Não é estética hacker ou terminal de código
- Não é visual gamer ou neon
- Não é cyberpunk com gradientes brilhantes
- Não é SaaS consumer colorido e lúdico
- Não é chatbot com interface de balões de conversa

---

## 3. Paleta — Dark Mode

Uso recomendado: cockpit, dashboards, diário de obra, orçamentista IA, tela de obra.

| Token | Hex | Uso |
|-------|-----|-----|
| `bg-primary` | `#0B0F14` | Canvas geral — fundo mais escuro |
| `bg-secondary` | `#111820` | Áreas de seção, painéis internos |
| `bg-card` | `#161D26` | Cards, modais, inputs |
| `border` | `#26313D` | Bordas de card, separadores |
| `text-primary` | `#F4F6F8` | Texto principal, títulos |
| `text-secondary` | `#A7B0BC` | Corpo de texto, legendas |
| `text-weak` | `#687384` | Placeholder, labels inativos |
| `color-primary` | `#2F6FED` | Azul — ação principal, navegação ativa |
| `color-premium` | `#C8A96A` | Champagne/bronze — destaque premium |
| `color-success` | `#21C878` | Verde — apenas status positivo |
| `color-warning` | `#E6A11F` | Âmbar — alerta, pendente |
| `color-error` | `#E05252` | Vermelho — erro, risco, exclusão |

**Superfícies dark (do mais escuro ao mais claro):**
```
#0B0F14  →  #111820  →  #161D26  →  #1E2A38
canvas       seção        card       card elevado
```

---

## 4. Paleta — Light Mode

Uso recomendado: oportunidades, propostas, cadastros, áreas comerciais, telas de cliente.

| Token | Hex | Uso |
|-------|-----|-----|
| `bg-primary` | `#F6F8FA` | Canvas geral — fundo base claro |
| `bg-secondary` | `#FFFFFF` | Áreas de seção, painéis internos |
| `bg-card` | `#FFFFFF` | Cards, modais, inputs |
| `border` | `#D8DEE6` | Bordas de card, separadores |
| `text-primary` | `#111827` | Texto principal, títulos |
| `text-secondary` | `#4B5563` | Corpo de texto, legendas |
| `text-weak` | `#7B8493` | Placeholder, labels inativos |
| `color-primary` | `#2563EB` | Azul — ação principal, navegação ativa |
| `color-premium` | `#B89145` | Champagne/bronze — destaque premium |
| `color-success` | `#16A66A` | Verde — apenas status positivo |
| `color-warning` | `#C98212` | Âmbar — alerta, pendente |
| `color-error` | `#D64545` | Vermelho — erro, risco, exclusão |

**Superfícies light (do mais claro ao com mais profundidade):**
```
#F6F8FA  →  #FFFFFF  →  #FFFFFF+border  →  #EEF2F7
canvas       seção         card           card com fundo
```

---

## 5. Regra de Uso das Cores

**Azul é a cor principal.** Navegação, botão primário, link ativo, elemento selecionado.

**Champagne/bronze é a cor premium.** Ações de destaque comercial, badge de plano, elementos de proposta, detalhes de valor.

**Verde é apenas status positivo.** Aprovado, concluído, sincronizado, confirmado. Nunca como cor de navegação ou botão genérico.

**Âmbar é alerta.** Pendente, em análise, atenção necessária, prazo próximo.

**Vermelho é erro ou risco.** Falha, exclusão, desvio crítico, dado inválido.

**Cinza/neutro é estrutura.** Bordas, fundos de seção, separadores, labels inativos.

**Hierarquia de uso por frequência:**
```
1. Neutros (fundos, bordas, texto)     ← 70% da interface
2. Azul primário                        ← 15% (ações, navegação)
3. Semânticas (verde/âmbar/vermelho)   ← 12% (status, alertas)
4. Champagne/bronze premium            ←  3% (destaque comercial)
```

---

## 6. Layout Base Recomendado

```
┌────────────────────────────────────────────────────────────┐
│  SIDEBAR GLOBAL (260px fixa)  │  ÁREA DE CONTEÚDO PRINCIPAL │
│                               │                              │
│  [Logo EVIS]                  │  [Header contextual]         │
│                               │  [Breadcrumb + Ações]        │
│  Navegação primária           │                              │
│  ─────────────────            │  [Cards / Painéis / Editor]  │
│  Módulos do processo          │                              │
│  ─────────────────            │  [Rodapé de ação ou IA]      │
│  Obra ativa (badge)           │                              │
│  Config / Perfil              │                              │
└────────────────────────────────────────────────────────────┘
```

**Grid interno da área de conteúdo:**
- Padding lateral: `px-6` a `px-8`
- Espaçamento entre seções: `gap-6`
- Máxima largura do conteúdo: 100% da área disponível
- Breakpoints relevantes: `lg` (1024px) e `xl` (1280px) — desktop é prioridade

---

## 7. Sidebar Global

A sidebar é fixa, sempre visível no desktop. É o mapa de navegação permanente.

**Estrutura:**

```
[Logo EVIS]              ← topo fixo, link para HUB

─── PROCESSO CANÔNICO ───

Oportunidades            ← ícone: Target ou Briefcase
Orçamentista IA          ← ícone: Calculator ou Layers
Propostas                ← ícone: FileText
Obras                    ← ícone: Building2
Diário de Obra           ← ícone: BookOpen

─── GESTÃO ─────────────

Equipes                  ← ícone: Users
Financeiro               ← ícone: TrendingUp
Relatórios               ← ícone: BarChart2

─── SISTEMA ─────────────

Configurações            ← ícone: Settings
Perfil / Sair            ← ícone: User

[Badge: Obra Ativa]      ← rodapé da sidebar
```

**Dark mode:**
- Fundo: `#0B0F14` com borda direita `#26313D`
- Item inativo: `#687384`, sem fundo
- Item hover: `#A7B0BC`, fundo `#161D26`
- Item ativo: `#2F6FED` com fundo `rgba(47,111,237,0.12)`, borda esquerda `2px solid #2F6FED`
- Badge obra ativa: pill azul no rodapé com nome truncado

**Light mode:**
- Fundo: `#FFFFFF` com borda direita `#D8DEE6`
- Item inativo: `#7B8493`, sem fundo
- Item hover: `#4B5563`, fundo `#F6F8FA`
- Item ativo: `#2563EB` com fundo `rgba(37,99,235,0.08)`, borda esquerda `2px solid #2563EB`
- Badge obra ativa: pill azul no rodapé com nome truncado

**Regras:**
- Nenhum item de sidebar abre modal — todos navegam para rota
- Submenu: evitar. Se necessário, expandir inline com `transition-all`
- Ícones: sempre 20px, `lucide-react`, stroke-width padrão

---

## 8. Cards e Dashboards

**Anatomia de um card analítico:**

```
┌──────────────────────────────────┐
│  [Ícone]  Título do Card         │  ← header do card
│  ─────────────────────────────   │
│                                  │
│  Valor Principal                 │  ← KPI em destaque
│  Subtítulo ou variação           │  ← dado secundário
│                                  │
│  [Indicador visual opcional]     │  ← barra, badge, mini-gráfico
└──────────────────────────────────┘
```

**Dark mode — classes de card:**
- Fundo: `#161D26`
- Borda: `1px solid #26313D`
- Arredondamento: `rounded-xl`
- Padding: `p-5`

**Light mode — classes de card:**
- Fundo: `#FFFFFF`
- Borda: `1px solid #D8DEE6`
- Arredondamento: `rounded-xl`
- Padding: `p-5`
- Sombra discreta: `box-shadow: 0 1px 4px rgba(0,0,0,0.06)`

**Hierarquia de dados no card:**
- KPI principal: `text-3xl font-bold` na cor `text-primary` do modo
- Legenda: `text-sm` na cor `text-secondary` do modo
- Variação positiva: verde semântico do modo
- Variação negativa: vermelho semântico do modo
- Variação neutra: âmbar semântico do modo

**Grid de dashboard:**
- 4 colunas em `xl`, 2 em `lg`, 1 em `md`
- Cards de KPI: `col-span-1`
- Cards de gráfico ou tabela: `col-span-2` ou `col-span-full`

**Dashboard vivo:**
- `refetchInterval` de 30s a 2min conforme o módulo
- Spinner discreto no header do card durante atualização, nunca no centro
- Skeleton loading obrigatório no primeiro carregamento — nunca tela em branco

---

## 9. Botões

**Hierarquia de botões:**

| Tipo | Dark mode | Light mode | Quando usar |
|------|-----------|------------|-------------|
| Primário | Azul `#2F6FED` sólido, texto branco | Azul `#2563EB` sólido, texto branco | Ação principal da tela |
| Premium | Champagne `#C8A96A` sólido, texto escuro | Champagne `#B89145` sólido, texto escuro | Proposta, aprovação comercial |
| Secundário | Fundo `#161D26`, borda `#26313D`, texto `#A7B0BC` | Fundo `#FFF`, borda `#D8DEE6`, texto `#4B5563` | Ação secundária |
| Sucesso | Verde `#21C878` | Verde `#16A66A` | Confirmar, aprovar, concluir |
| Destrutivo | Vermelho controlado com fundo suave | Vermelho controlado com fundo suave | Excluir, cancelar irreversível |
| Ghost | Apenas texto, sem fundo nem borda | Apenas texto, sem fundo nem borda | Ação terciária, cancelar |

**Regra absoluta:** botões azuis para ação. Botões verdes apenas para aprovação, conclusão ou status positivo. Nunca usar verde como cor genérica de "salvar" ou "confirmar" sem semântica de sucesso.

---

## 10. Telas Principais

### Oportunidades
- **Modo recomendado:** light mode ou híbrido
- **Motivo:** área comercial, leitura de dados de cliente, interface de apresentação
- Lista principal à esquerda (70%) com cards de oportunidade
- Painel lateral direito (30%) com detalhes do item selecionado
- Status badges semânticos (azul, âmbar, verde, vermelho) em ambos os modos
- Ação principal: "Gerar Orçamento IA" — botão azul primário

### Orçamentista IA
- **Modo recomendado:** dark mode
- **Motivo:** cockpit técnico com tabela densa e painel de IA lateral
- Layout em três zonas: header de totais + tabela de itens (60%) + painel IA (40%) + rodapé de ações
- Tabela de itens: origens com badges (IA = azul, SINAPI = champagne, Manual = neutro)
- Painel IA: output estruturado, nunca chat de balões
- Saída da IA processada por `mdToHtml()` — zero markdown bruto visível

### Propostas
- **Modo recomendado:** light mode ou híbrido
- **Motivo:** documento comercial enviado ao cliente, leitura limpa e profissional
- Layout limpo, tipografia clara, logo EVIS e dados da construtora em destaque
- Cor champagne/bronze pode aparecer como acento premium nos totais e assinatura
- Exportação PDF deve respeitar o design light

### Obra
- **Modo recomendado:** dark mode operacional
- **Motivo:** uso em campo, tablets, monitoramento contínuo
- Header fixo com nome da obra, status e barra de progresso
- Abas: Serviços · Equipes · Financeiro · Fotos · Notas
- Aba Financeiro: cards KPI com Orçado vs Realizado, desvio percentual e projeção

### Diário de Obra IA
- **Modo recomendado:** dark mode (cockpit primário) com versão clara disponível
- **Motivo:** uso operacional intenso, cockpit de IA protagonista
- Seletor de data no topo
- Layout dividido: registro do dia (55%) | cockpit IA (45%)
- Linha do tempo horizontal dos últimos 7 dias no rodapé
- Cockpit IA exibe: Resumo · Alertas · Recomendações em blocos distintos
- Alertas: borda esquerda âmbar com ícone `AlertTriangle`
- Recomendações: borda esquerda azul com ícone `Lightbulb`
- A IA ocupa espaço nobre — não é nota de rodapé nem botão escondido

---

## 11. Microinterações e Animações Permitidas

**Biblioteca:** `motion/react` (Framer Motion)

**Animações aprovadas:**

| Contexto | Animação | Configuração |
|----------|----------|--------------|
| Entrada de cards | fade + translateY(8px) | 200ms, ease out |
| Abertura de painel lateral | slideInFromRight | 250ms |
| Hover em botão primário | scale(1.02) | 100ms |
| Hover em linha de tabela | bg transition | 100ms |
| Loading de IA | pulse sutil no container | iteração contínua |
| Toast/notificação | slideInFromTop + fadeOut | 300ms in, 200ms out |
| Troca de aba | fadeIn do conteúdo | 150ms |
| Troca de modo claro/escuro | fade suave do fundo | 200ms |
| Badge de status | sem animação | estático |

**Regras de animação:**
- Nunca animar dados numéricos em contadores
- Nunca usar bounce, elastic ou spring em interfaces técnicas
- `staggerChildren` permitido em listas de até 6 itens — nunca em tabelas
- `prefers-reduced-motion`: todas as animações devem ter fallback `duration: 0`

---

## 12. O Que Evitar

**Visual geral:**
- Verde neon como cor principal ou de navegação
- Aparência hacker, terminal ou cyberpunk
- Aparência gamer com gradientes brilhantes
- Glassmorphism com blur excessivo
- Gradientes de fundo com 3+ cores
- Sombras coloridas em cards comuns
- Bordas arredondadas excessivas (`rounded-3xl` em painéis)
- Ícones ilustrativos, emojis decorativos ou mascotes

**Modo claro específico:**
- Contraste baixo entre texto e fundo
- Fundos muito brancos sem separação entre seções
- Sombras pesadas que parecem Material Design datado
- Paleta fria demais que parece planilha corporativa

**Modo escuro específico:**
- Preto puro `#000000` — usar `#0B0F14` como base
- Texto branco puro `#FFFFFF` — usar `#F4F6F8`
- Bordas escuras demais que desaparecem no fundo
- Excesso de transparência que cria ilegibilidade

**UX:**
- Modais para ações destrutivas sem confirmação explícita
- Tooltips obrigatórios para entender o que um botão faz
- Spinners de página inteira — usar skeleton por seção
- Placeholder como label — label deve estar sempre visível acima do input
- Botões de ação primária duplicados na mesma tela

**IA:**
- Chatbox flutuante estilo assistente virtual
- Balões de conversa (bubble chat) para output da IA
- Loading de IA bloqueando a tela inteira
- Markdown bruto renderizado no HTML (`**texto**` visível ao usuário)

---

## 13. Regras de Consistência Visual

**Cores semânticas — nunca inverter:**

| Significado | Dark mode | Light mode | Uso |
|-------------|-----------|------------|-----|
| Ação principal | `#2F6FED` | `#2563EB` | Botão primário, item ativo, link |
| Premium / comercial | `#C8A96A` | `#B89145` | Proposta, destaque de valor |
| Sucesso / positivo | `#21C878` | `#16A66A` | Aprovado, concluído, confirmado |
| Alerta / atenção | `#E6A11F` | `#C98212` | Pendente, atraso, atenção |
| Erro / perigo | `#E05252` | `#D64545` | Exclusão, negativo, falha |

**Tipografia — dark mode:**
- Título de seção: `text-lg font-semibold` cor `#F4F6F8`
- Label de campo: `text-xs uppercase tracking-wider` cor `#687384`
- KPI: `text-2xl font-bold` cor `#F4F6F8`
- Corpo: `text-sm` cor `#A7B0BC`
- Referência técnica: `font-mono text-sm` cor `#2F6FED`

**Tipografia — light mode:**
- Título de seção: `text-lg font-semibold` cor `#111827`
- Label de campo: `text-xs uppercase tracking-wider` cor `#7B8493`
- KPI: `text-2xl font-bold` cor `#111827`
- Corpo: `text-sm` cor `#4B5563`
- Referência técnica: `font-mono text-sm` cor `#2563EB`

**Espaçamento (igual em ambos os modos):**
- Entre seções: `gap-8`
- Dentro de cards: `p-5` ou `p-6`
- Entre label e valor: `mt-1`
- Entre ícone e texto no botão: `gap-2`

**Inputs — dark mode:**
- Fundo: `#161D26`
- Borda padrão: `#26313D`
- Borda foco: `#2F6FED` com outline removido
- Texto: `#F4F6F8`
- Placeholder: `#687384`

**Inputs — light mode:**
- Fundo: `#FFFFFF`
- Borda padrão: `#D8DEE6`
- Borda foco: `#2563EB` com outline removido
- Texto: `#111827`
- Placeholder: `#7B8493`

**Estados de dados (ambos os modos):**
- Vazio: ícone neutro + texto `text-weak` do modo — nunca tela em branco
- Loading: skeleton com `animate-pulse` na cor de borda do modo — nunca spinner centralizado
- Erro: banner com borda esquerda vermelha, ícone `AlertCircle` e botão de retry

---

*Documento criado para orientação de design e desenvolvimento do EVIS ERP.*
*Não contém código executável. Não altera banco de dados. Não gera migrations.*
