# EVIS — Contrato de Linguagem Operacional

> Este documento define como o EVIS fala, quando fala e quando se cala.
> É obrigatório para qualquer código que produza texto visível ao usuário.

---

## Princípio central

O EVIS fala como um **colaborador competente e calmo** — não como um sistema de software.

O usuário não deve perceber a tecnologia por trás. Deve perceber a intenção.

---

## 1. Tom

| Situação | Tom | Exemplo |
|---|---|---|
| Confirmação de rotina | Calmo, passado simples | "Orçamento criado." |
| Alerta operacional | Direto, sem alarmismo | "3 serviços com prazo vencido." |
| Erro recuperável | Informativo + orientador | "Não foi possível salvar. Tente novamente." |
| Erro crítico | Claro + próxima ação | "Sem conexão com o servidor. Verifique a internet." |
| Estado vazio | Orientador, sem culpa | "Nenhum serviço cadastrado ainda." |

---

## 2. Pontuação

- Toda mensagem termina com **ponto final**
- **Sem exclamações** em confirmações de rotina
- Exclamações são reservadas para eventos excepcionais (ex: proposta aceita por cliente)

```
✅  "Orçamento criado."
✅  "Proposta gerada."
❌  "Orçamento criado!"
❌  "Totais sincronizados com sucesso!"
```

---

## 3. Erros

### Regra absoluta: nenhum código técnico exposto

O usuário nunca vê:
- Códigos HTTP (422, 404, 500)
- Nomes de biblioteca (Supabase, ImgBB, PostgREST)
- Termos internos (RLS, HITL, query, JSON, sync)
- Stack traces ou mensagens de exceção brutas

### Formato de erro

```
[O que não foi possível fazer]. [O que o usuário pode fazer.]
```

**Mapeamento de status HTTP para linguagem humana:**

| Status | Mensagem |
|---|---|
| 401 / 403 | "Sem permissão para acessar estes dados." |
| 404 | "Registro não encontrado." |
| 409 | "Este registro já existe." |
| 422 | "Os dados enviados são inválidos. Verifique as informações." |
| 500+ | "O servidor encontrou um erro. Tente novamente em instantes." |
| Sem conexão | "Sem conexão com o servidor. Verifique a internet." |
| Default | "Não foi possível completar a operação. Tente novamente." |

### Exemplos de correção

```
❌  "Erro na requisição (422)"
✅  "Os dados enviados são inválidos. Verifique as informações."

❌  "Erro de Permissão (RLS): Você não tem autorização."
✅  "Sem permissão para acessar estes dados."

❌  "Erro ao carregar: Cannot read properties of undefined"
✅  "Não foi possível carregar os dados da obra."

❌  "Erro IA: JSON parse error at position 145"
✅  "O processamento encontrou um problema. Tente novamente."
```

---

## 4. Confirmações

Passado simples, sem adjetivos de superação:

```
❌  "Dados carregados com sucesso!"
✅  "Dados carregados."

❌  "IMPORTAÇÃO CONCLUÍDA: Dados salvos diretamente no Supabase."
✅  "Dados importados."

❌  "Totais sincronizados com sucesso!"
✅  "Totais atualizados."

❌  "Fornecedores originais injetados para Sincronização!"
✅  "Equipes pré-carregadas. Salve para enviar ao servidor."
```

---

## 5. Estados de carregamento

Presente contínuo com reticências:

```
✅  "Salvando..."
✅  "Gerando relatório..."
✅  "Verificando situação operacional..."
❌  "Iniciando importação direta para o Supabase..."
❌  "Processando requisição ao servidor de IA..."
```

---

## 6. Silêncio obrigatório

O sistema **não deve falar** quando:
- Uma ação ocorreu exatamente como esperado sem impacto operacional
- O usuário está em fluxo e interromper seria ruído

Exemplos de mensagens que devem ser removidas ou suprimidas:
- "Nada a sincronizar." — simplesmente não faz nada
- Confirmações de salvamento automático — sem toast, apenas estado visual
- "Carregando dados..." em telas que carregam em menos de 500ms

---

## 7. Jargão proibido em mensagens de usuário

| Termo técnico | Substituição |
|---|---|
| Supabase | sistema, servidor |
| API | conexão, serviço |
| RLS | permissão |
| HITL | revisão, aprovação |
| sync / sincronizar | salvar, enviar |
| ID da obra | código da obra |
| JSON | dados |
| query | busca |
| hook | — (nunca usar) |
| mutation | — (nunca usar) |
| ImgBB | serviço de imagens |

---

## 8. Glossário de ações (verbos canônicos)

O mesmo conceito deve usar sempre o mesmo verbo:

| Ação | Verbo canônico |
|---|---|
| Persistir dado localmente | "Salvo." |
| Enviar para servidor | "Enviado." |
| Criar novo registro | "Criado." |
| Atualizar registro | "Atualizado." |
| Remover registro | "Excluído." / "Removido." |
| Aprovar item | "Aprovado." |
| Gerar documento | "Gerado." |
| Carregar dados | "Carregado." |

---

## 9. Hierarquia de severidade (alertas e badges)

| Nível | Cor | Quando usar |
|---|---|---|
| Crítico | Vermelho | Bloqueia operação. Exige ação imediata. |
| Alto | Âmbar | Compromete resultado. Exige ação hoje. |
| Médio | Azul | Requer atenção em breve. |
| Baixo | Cinza | Informativo. Não urgente. |

---

## 10. Empty states

Todo empty state tem três elementos:

1. **O que está vazio** — sem culpar o usuário
2. **Por que ainda está vazio** (opcional, se não óbvio)
3. **O que o usuário pode fazer agora**

```
❌  "Nenhum item encontrado."
✅  "Nenhum serviço cadastrado ainda. Adicione o primeiro serviço para começar o cronograma."

❌  "Sem dados disponíveis."
✅  "Nenhuma entrada no diário esta semana."
```

---

*Versão: 1.0*
*Data: 2026-05-18*
*Revisão: após obra piloto Vila Mariana*
