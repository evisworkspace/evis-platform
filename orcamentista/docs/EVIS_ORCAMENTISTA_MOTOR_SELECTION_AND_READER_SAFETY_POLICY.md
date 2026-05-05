# EVIS_ORCAMENTISTA_MOTOR_SELECTION_AND_READER_SAFETY_POLICY

> Fase: 3A - Motor Selection & Reader Safety Policy do Orcamentista IA  
> Status: politica tecnica e contratual, sem IA real  
> Escopo: selecao de motores, seguranca do Reader e checagens dimensionais antes da primeira leitura real controlada  
> Proibido nesta fase: Gemini real, OpenAI real, Claude API, OCR real, PDF real, banco, `orcamento_itens`, proposta, Obra, Diario, migration

## 1. Objetivo

Formalizar como o Orcamentista IA deve escolher motores e proteger leituras tecnicas antes de qualquer integracao com IA real.

A politica existe para impedir que uma leitura isolada de LLM vire quantitativo, custo, payload oficial ou item em `orcamento_itens` sem:

- schema rigido;
- Reader primario;
- Verifier independente;
- safety rules;
- sanity checks deterministicos;
- HITL quando necessario;
- Gate e Revisao Humana antes de qualquer gravacao futura.

## 2. Resultado Do Benchmark Externo

Resultado observado no benchmark externo:

- GPT-5.5 teve melhor equilibrio geral, boa organizacao e boa capacidade de auditoria, mas ainda exige schema rigido.
- Claude teve boa leitura ampla, mas cometeu erro critico de dimensao: leu estaca como `35 m` quando o correto era `3,5 m`, com confianca alta e sem HITL.
- Gemini 3.1 foi conservador e bloqueou dados ilegíveis, mas falhou como Reader primario em tabelas/imagens comprimidas.

Conclusao operacional:

```text
Nenhum motor pode consolidar dimensao critica sozinho.
```

## 3. Funcao Recomendada Por Motor

### GPT-5.5

Papel recomendado:

- Reader primario inicial;
- Auditor final;
- estruturacao JSON rigida;
- organizacao de evidencias;
- revisao de consistencia.

Nao recomendado para:

- consolidacao automatica sem HITL;
- dimensao critica sem Verifier independente;
- quantitativo final sem checagem deterministica.

### Gemini 3.1

Papel recomendado:

- Verifier conservador;
- safety check;
- bloqueio quando leitura for incerta;
- segunda leitura para cotas criticas.

Nao recomendado para:

- Reader primario de tabelas pequenas;
- Reader primario de imagens comprimidas;
- extracao unica de quantitativos em baixa legibilidade.

### Claude

Papel recomendado:

- apoio tecnico/textual;
- documentacao;
- compatibilizacao qualitativa;
- revisao de narrativa tecnica;
- apoio a agentes especialistas sem decidir dimensao critica sozinho.

Nao recomendado para:

- leitura dimensional critica sem Verifier/HITL;
- profundidade de estaca como fonte unica;
- quantitativo final sem validacao deterministica.

## 4. Por Que Nenhum Motor Opera Sozinho Em Dimensoes Criticas

Dimensoes criticas afetam seguranca, custo, escopo e responsabilidade tecnica. Erros pequenos de leitura visual podem multiplicar custo e risco.

Exemplos:

- `3,5 m` lido como `35 m`;
- `350 cm` interpretado como `350 m`;
- cota visual usada como quantitativo oficial;
- area de laje derivada por escala visual;
- peso de aco estimado por coeficiente e tratado como item identificado.

Regra:

```text
Dimensao critica = Reader + Verifier + sanity check + HITL quando houver ambiguidade.
```

## 5. Papel Do Reader Primario

O Reader primario:

- classifica pagina;
- extrai evidencias explicitas;
- separa identificado de inferido;
- devolve JSON estrito;
- declara `confidence_score`;
- preserva pagina, fonte e evidencia.

O Reader primario nao:

- consolida orcamento;
- cria item oficial;
- resolve divergencia sozinho;
- transforma inferencia em fato.

## 6. Papel Do Verifier

O Verifier:

- le a mesma evidencia de forma independente;
- calcula ou informa base para `agreement_score`;
- aponta divergencias;
- reduz confianca quando fonte e ruim;
- bloqueia leitura incerta.

Verifier e obrigatorio quando:

- ha cota critica;
- ha fundacao;
- ha estaca;
- ha tabela ilegivel;
- ha PDF rasterizado com baixa resolucao;
- ha inferencia;
- `agreement_score < 0.90`;
- `confidence_score` excede o maximo permitido pela qualidade da fonte.

## 7. Papel Do Auditor Final

O Auditor final:

- revisa o pacote Reader + Verifier;
- verifica se as safety rules foram aplicadas;
- valida rastreabilidade;
- confirma se o item pode seguir para agente especialista, Gate ou HITL.

Auditor final nao grava no banco e nao substitui revisao humana.

## 8. Papel Dos Agentes Especialistas

Agentes especialistas:

- analisam disciplinas especificas;
- sugerem riscos, premissas e servicos;
- preservam origem e evidencia;
- nao criam itens oficiais.

Agentes nao podem superar bloqueios do Reader/Verifier. Se a leitura base estiver bloqueada, o output do agente tambem permanece bloqueado para consolidacao.

## 9. Regras Para PDF Rasterizado

- PDF rasterizado reduz confianca maxima.
- Baixa resolucao exige Verifier.
- Imagem comprimida nao pode sustentar quantitativo critico sozinha.
- Cota extraida de imagem exige sanity check.
- Leitura de tabela rasterizada pequena deve bloquear quantitativo se ilegivel.

## 10. Regras Para PDF Vetorial

- PDF vetorial claro permite confianca maior, mas nao elimina Verifier em dimensao critica.
- Texto selecionavel deve ser preferido a leitura visual.
- Cota vetorial ainda precisa preservar pagina, camada ou referencia de evidencia.
- Se houver conflito entre texto e desenho, abrir HITL.

## 11. Regras Para Tabelas Ilegiveis

- Tabela ilegivel bloqueia extracao quantitativa.
- Nao usar tentativa visual como fonte oficial.
- Se a tabela for importante para custo, solicitar documento melhor ou HITL.
- Confidence maxima deve ser baixa.

## 12. Regras Para Cotas Criticas

Cotas criticas incluem:

- profundidade de estaca;
- diametro de estaca;
- quantidade de estacas;
- area de laje;
- volume de concreto;
- peso de aco;
- cotas de fundacao e estrutura.

Regras:

- exigir Verifier;
- rodar sanity check deterministico;
- exigir HITL se houver ambiguidade;
- bloquear consolidacao se a divergencia impactar seguranca, custo ou escopo.

## 13. Regras Para Quantitativos

- Quantitativo final deve ser deterministico + HITL quando necessario.
- Quantidade inferida permanece `inferred`.
- Peso de aco por coeficiente e inferido, nao identificado.
- Sem quadro de armacao, aco nao consolida.
- Volume de concreto derivado de cota visual exige comparacao com resumo ou memoria.

## 14. Regras Para `confidence_score`

- Confianca nao pode ultrapassar o maximo permitido pela qualidade da fonte.
- PDF rasterizado e imagem comprimida reduzem teto de confianca.
- Tabela ilegivel deve ter confianca baixa e bloquear quantitativo.
- Alta confianca nao libera consolidacao se houver HITL, cota critica ou ambiguidade.

## 15. Regras Para `agreement_score`

- `agreement_score >= 0.90`: pode seguir se nao houver outra regra bloqueante.
- `agreement_score < 0.90`: exige revisao.
- Divergencia em dimensao critica exige HITL.
- Divergencia que altera escopo, seguranca ou custo bloqueia consolidacao.

## 16. HITL Obrigatorio

HITL e obrigatorio quando:

- ha fundacao;
- ha estaca;
- ha profundidade, diametro ou quantidade de estaca;
- ha inferencia;
- ha fonte ilegivel;
- ha ambiguidade decimal;
- ha leitura de aco sem quadro de armacao;
- ha sondagem com endereco divergente;
- Reader e Verifier divergem em dado essencial.

## 17. Bloqueio De Consolidacao

Consolidacao deve ficar bloqueada quando:

- falta rastreabilidade;
- fonte e ilegivel;
- leitura e inferida e nao validada;
- dimensao critica diverge;
- sanity check falha;
- HITL esta pendente;
- custo ou quantidade nao tem fonte confiavel;
- sondagem nao pertence ao mesmo endereco;
- o Gate ou Revisao Humana ainda nao liberou fase futura.

## 18. Falhas Esperadas

Falhas que a politica deve antecipar:

- OCR/visao confundir separador decimal;
- motor manter confianca alta em numero errado;
- tabela comprimida gerar quantidade aproximada;
- cota visual virar area;
- memoria textual conflitar com prancha;
- agente especialista tratar inferencia como fato.

## 19. Exemplo Critico: Estaca 35 m Vs 3,5 m

Cenario:

```text
Prancha indica profundidade de estaca como 3,5 m.
Um motor le 35 m com alta confianca.
```

Politica:

- Reader primario pode registrar a leitura, mas marcada como critica;
- Verifier independente e obrigatorio;
- sanity check deve detectar ambiguidade `35 m` vs `3,5 m`;
- estaca residencial de diametro 25 cm acima de 15 m vira severidade critica;
- HITL e obrigatorio;
- consolidacao fica bloqueada;
- nenhum quantitativo de concreto, aco ou servico derivado pode virar payload aprovado.

## 20. Politica De Custo X Beneficio

- Usar GPT-5.5 quando a prioridade for schema, rastreabilidade e auditoria.
- Usar Gemini 3.1 como Verifier conservador para reduzir falso positivo de leitura.
- Usar Claude onde a tarefa for texto, narrativa ou compatibilizacao qualitativa.
- Evitar rodar multiplos motores para texto simples de baixo risco.
- Rodar multiplos motores e checks deterministicos para dimensao critica.
- Nunca economizar motor em cota que pode alterar estrutura, seguranca ou valor relevante.

## 21. Estado Desta Fase

A Fase 3A cria apenas contrato e funcoes puras locais:

- politica de selecao de motor;
- politica de seguranca do Reader;
- sanity checks dimensionais.

Nenhuma IA real e chamada. Nenhum PDF real e processado. Nenhum dado e gravado no banco. O orcamento oficial permanece separado.

## 22. Proxima Fase Recomendada

Primeira leitura real controlada de uma pagina isolada, somente depois de aplicar:

- schema de output estrito;
- policy de motor;
- safety rules;
- sanity checks;
- Verifier obrigatorio quando aplicavel;
- HITL e bloqueio de consolidacao antes de qualquer uso orcamentario.
