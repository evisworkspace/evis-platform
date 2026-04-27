# STATUS EVIS AI

> Atualizado em: 2026-04-17  
> Tipo: visão executiva de 2 minutos  
> Base: estado atual do produto + persistência auditável da camada de referências de custo

## Leitura rápida

| Item | Status |
| --- | --- |
| Maturidade geral estimada do ecossistema | **92%** |
| Fase atual | **Catálogo residencial EVIS em expansão para acabamentos e complementares de uso real** |
| Foco do momento | **ampliar a cobertura do catálogo residencial e preparar a próxima camada de histórico real de preços** |
| Próximo passo recomendado | **executar o seed expandido no Supabase e validar a nova cobertura de busca para acabamentos e complementares** |

## Score por núcleo

| Núcleo | Papel | Progresso estimado | Leitura prática |
| --- | --- | ---: | --- |
| `EVIS Obra` | operação da obra em produção de uso | **88%** | backend, sincronização, modal e banco já estão alinhados para consultar e persistir referências EVIS antes do SINAPI |
| `EVIS Orçamentista` | preparação do orçamento e JSON de importação | **94%** | MCP, skills, schema e catálogo residencial já consultam o EVIS antes do SINAPI com base ampliada |
| `Organização do repositório` | clareza da estrutura, entrada principal e limpeza | **79%** | raiz está limpa, histórico consolidado e prompts/ops já foram podados |

## O que já está consolidado

- `EVIS Obra` com frontend em `src/` e backend em `server/`
- `Portal do cliente`, `cronograma`, `relatórios`, `diário`, `equipes`, `notas` e `fotos`
- Orquestrador backend e integração com o frontend
- Núcleo `orcamentista/` separado do fluxo operacional
- Skills especialistas do orçamentista
- Templates e schema JSON do orçamentista
- Base SINAPI com importação e busca textual já validadas
- Catálogo residencial EVIS com seed inicial e view agregada no Supabase
- Rota `api/referencias/search` validada com catálogo EVIS priorizado
- Rota legada `api/sinapi/search` compatibilizada com a nova camada de referências
- MCP do orçamentista consultando catálogo EVIS antes do SINAPI
- Modal de `Serviços` no app aplicando referências de custo diretamente na edição
- Persistência dos metadados da referência aplicada no fluxo de sync do `EVIS Obra`
- Migração executada para armazenar código, origem, competência, fonte e confiança da referência em `servicos`
- Seed expandido do catálogo residencial preparado com novos acabamentos, pedras, esquadrias e complementares

## O que ainda precisa amadurecer

- executar o seed expandido no Supabase e validar o ganho de cobertura
- calibrar preços por competência, localidade e fornecedor real
- começar a registrar histórico de preços reais e cotações aprovadas
- revisar a atualização diária deste status para virar rotina leve

## Próxima ação recomendada

1. Rodar `docs/ops/SEED_CATALOGO_RESIDENCIAL_EVIS.sql` novamente no Supabase para aplicar a expansão `v2`
2. Validar buscas como `box`, `vinílico`, `soleira`, `bancada`, `selador`, `textura` e `gás`
3. Começar a registrar histórico real de preços e cotações por competência
4. Retomar a poda fina de `docs/archive/legacy/` sem perder rastreabilidade

## Regra para atualização no fim do dia

Atualize sempre estas 5 linhas:

| Campo | Preenchimento esperado |
| --- | --- |
| `Maturidade geral estimada` | percentual executivo do projeto |
| `Fase atual` | etapa macro em linguagem simples |
| `Foco do momento` | o que está sendo construído agora |
| `Próximo passo recomendado` | uma ação objetiva para o próximo ciclo |
| `Risco principal` | o que mais pode travar o avanço |

## Risco principal atual

O maior risco agora não é mais estrutural. O risco principal passou a ser de qualidade da referência:

- o catálogo residencial ainda é inicial
- os preços seed são operacionais, não definitivos
- sem rotina de atualização por competência, o valor pode envelhecer rápido
