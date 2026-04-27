# Plano de Conhecimento dos Subagentes

## Objetivo

Definir quais fontes publicas e legais devem alimentar cada especialista do Orcamentista EVIS, com foco em:

- leitura fiel de projeto
- reducao de alucinacao
- uso de referencias oficiais e rastreaveis
- pergunta obrigatoria ao usuario quando a evidencia nao fechar

## Regra principal

Nenhum subagente deve concluir quantitativo, tipologia, ponto ou custo definitivo quando faltar uma destas bases:

- evidencia de projeto
- referencia tecnica
- referencia de custo aderente

Se qualquer uma dessas tres bases estiver incompleta, a saida obrigatoria deve ser:

- candidato
- pendencia
- pergunta HITL ao usuario

## O que e fonte de verdade

### Fonte de verdade operacional

- projeto anexado pelo usuario
- memoria oficial do workspace
- base EVIS no Supabase
- SINAPI / ORSE / SICRO quando aderentes

### Fonte de apoio tecnico

- cadernos tecnicos e manuais oficiais
- guias tecnicos de fabricantes
- materiais publicos de orgaos reguladores e institucionais

### Fonte que NAO deve virar verdade sozinha

- blog generico
- video informal
- resumo sem autoria tecnica
- resposta de IA sem referencia

## Aviso importante sobre normas ABNT

As normas ABNT completas normalmente nao sao gratuitas. Portanto:

- usar pagina oficial da ABNT apenas para catalogacao
- se a empresa possuir copia licenciada, armazenar internamente no acervo privado
- nao baixar copia nao autorizada
- quando a norma nao estiver disponivel legalmente, usar como apoio os cadernos oficiais, manuais tecnicos e regras de negocio internas

## Prioridade de ingestao

### Fase 1 - obrigatoria para colocar em operacao assistida

- civil_execucao
- estrutural
- geotecnico_fundacoes
- hidraulica_sanitaria
- eletrica
- custos_orcamentacao

### Fase 2 - importante para ampliar cobertura

- telecom_dados
- climatizacao_hvac
- automacao_residencial
- seguranca_incendio_ppci
- impermeabilizacao

### Fase 3 - aprofundamento

- acustica
- iluminacao_luminotecnica
- producao_gestao_obra

## O que baixar agora por especialista

### 1. Civil / Execucao

Baixar:

- relatorios e cadernos tecnicos SINAPI aderentes ao grupo de servicos da obra
- Livro SINAPI Metodologias e Conceitos
- ORSE para composicoes complementares
- materiais tecnicos de acabamento e pintura quando o projeto exigir

Uso:

- sequencia executiva
- criterio de medicao
- produtividade referencial
- evitar erro de area bruta x area liquida

### 2. Estrutural

Baixar:

- relatorios e cadernos tecnicos SINAPI do grupo estrutural
- Livro SINAPI Metodologias e Conceitos
- referencias internas de leitura estrutural
- normas licenciadas da empresa, se existirem

Uso:

- vigas, pilares, lajes, armacao, formas, concreto
- conflitos de fck
- cruzamento de quadro resumo com detalhe

### 3. Geotecnica / Fundacoes

Baixar:

- cadernos e composicoes SINAPI de fundacoes
- materiais SICRO e manuais DNIT apenas como apoio metodologico quando fizer sentido
- mapas geologicos e geodiversidade do PR via SGB / IAT
- laudos SPT enviados pelo usuario, sempre que existirem

Uso:

- nunca assumir solo sem laudo
- tratar mapa geologico apenas como contexto regional, nunca como substituto do SPT da obra

### 4. Hidraulica / Sanitaria

Baixar:

- cadernos SINAPI de instalacoes hidraulicas quando houver aderencia
- catalogo EVIS residencial por ponto
- manuais tecnicos de fabricantes como Tigre e Deca
- memoriais enviados pelo usuario

Uso:

- contagem por ambiente
- agua fria, quente, esgoto, drenagem
- composicao por ponto residencial

### 5. Eletrica

Baixar:

- cadernos SINAPI de instalacoes eletricas quando houver aderencia
- catalogo EVIS residencial por ponto
- manuais e guias de fabricantes como Schneider e WEG
- documentos do usuario: planta eletrica, quadro de cargas, memorial

Uso:

- TUG, TUE, iluminacao, quadro, circuitos
- evitar usar referencia industrial/incendio como se fosse residencial

### 6. Custos / Orcamentacao

Baixar:

- base SINAPI PR da competencia ativa
- base ORSE quando houver gap
- materiais SICRO quando a obra realmente exigir infraestrutura
- catalogo EVIS
- historico interno de orcamentos aprovados e validados

Uso:

- classificar servico
- escolher referencia correta
- marcar origem, competencia, confianca e pendencia

## Fontes publicas e oficiais recomendadas

### Base de custo e metodologia

- SINAPI oficial CAIXA: https://www.caixa.gov.br/poder-publico/modernizacao-gestao/sinapi/Paginas/default.aspx
- Livro SINAPI Metodologias e Conceitos: https://www.caixa.gov.br/Downloads/sinapi-metodologia/Livro_SINAPI_Metodologias_Conceitos.pdf
- SICRO / DNIT: https://www.gov.br/dnit/pt-br/assuntos/noticias/dnit-divulga-a-2a-edicao-dos-manuais-de-custos-de-infraestrutura
- Volume de composições SICRO: https://www.gov.br/dnit/pt-br/assuntos/planejamento-e-pesquisa/custos-referenciais/sistemas-de-custos/sicro/manuais/copy_of_manuais-de-custos-de-infraestrutura-de-transportes/volume-11-composicoes-de-custos.rar/view

### Geologia e contexto regional

- GeoSGB / dados geologicos: https://opendata.sgb.gov.br/pages/sobre/
- Mapa geologico da Bacia do Parana: https://rigeo.sgb.gov.br/handle/doc/23037
- Mapa Geodiversidade do Estado do Parana: https://rigeo.sgb.gov.br/handle/doc/16856
- Mapeamento geologico IAT PR: https://www.iat.pr.gov.br/index.php/Pagina/Mapeamento-Geologico

### Hidraulica / acabamento / impermeabilizacao

- Educa Tigre: https://www.tigre.com.br/es/educatigre
- Manual de tintas imobiliarias ABRAFATI: https://abrafati.com.br/wp-content/uploads/2022/05/Manual-de-aplicacao-uso-limpeza-e-manutencao-de-Tintas-Imobiliarias_08_09-1.pdf
- Viapol impermeabilizacao: https://viapol.com.br/media/227893/apostila-1pdftestecompressed.pdf
- Manual de instalacao Amphibia Viapol: https://viapol.com.br/media/600693/manual-de-instala%C3%A7%C3%A3o-do-sistema-amphibia-020622-baixa-sem-marcas-de-corte.pdf

### Eletrica / automacao / iluminacao

- Schneider Electric Brasil: https://www.se.com/br/pt/
- WEG Home downloads: https://www.weg.net/weghome/downloads/
- Philips Lighting profissional: https://www.lighting.philips.com.br/prof/controles-de-iluminacao
- Philips LED / componentes profissionais: https://www.lighting.philips.com.br/prof/eletronicos-de-led

### Acustica / HVAC

- Isover Wallfelt / guia de bolso: https://cloud.mkt.isover.com.br/walfelt
- Manual de instalacao Isosound: https://www.isover.com.br/documents/manual/manual-instalacao-isosound-ver2-2.pdf
- Catalogos e solucoes termoacusticas Isover: https://www.isover.com.br/download-documents/catalogo/catalogo-optima-4-isover-rev1.pdf
- Daikin Brasil: https://www.daikin.com.br/

### PPCI / seguranca contra incendio

- CBMPR / NPTs e materiais tecnicos: https://www.bombeiros.pr.gov.br/Arquivo/npt001parte1pdf
- Exemplo de NPT atualizada de iluminacao de emergencia: https://www.bombeiros.pr.gov.br/sites/bombeiros/arquivos_restritos/files/documento/2025-09/NPT018Iluminacaodeemergencia1%20%281%29.pdf

### Gestao e producao de obra

- Universidade CAIXA - poder publico: https://universidade.caixa.gov.br/poderpublico/
- Guias e manuais CBIC: https://cbic.org.br/cbic-disponibiliza-guias-cartilhas-relatorios-e-manuais-confira/

## Cursos gratuitos: como usar

Cursos gratuitos sao uteis para onboarding do time e para criar glossario tecnico, mas nao devem ser a fonte principal de verdade do agente.

Usar como apoio:

- Educa Tigre
- portais e ebooks WEG Home
- oportunidades regionais do SENAI

Nao usar curso gratuito como criterio final de medicao, custo ou norma.

## Estrutura recomendada do acervo local

```text
orcamentista/
  knowledge/
    comum/
      sinapi/
      orse/
      regras_negocio/
    estrutural/
      skills/
      referencias/
      normas_licenciadas_privadas/
    geotecnico_fundacoes/
      skills/
      referencias/
      contexto_regional/
    hidraulica_sanitaria/
      skills/
      referencias/
      fabricantes/
    eletrica/
      skills/
      referencias/
      fabricantes/
    civil_execucao/
      skills/
      referencias/
      acabamentos/
    custos_orcamentacao/
      skills/
      referencias/
      catalogo_evis/
      historico_validado/
```

## Regra anti-alucinacao operacional

Todo especialista deve devolver:

- fato confirmado
- candidato
- conflito
- lacuna
- pergunta HITL

Quando houver duvida:

- perguntar ao usuario
- nunca completar silenciosamente
- nunca transformar inferencia em fato

## Proximo passo recomendado

1. Baixar e organizar as fontes da Fase 1.
2. Subir um manifesto por especialista com:
   - nome do arquivo
   - origem
   - data
   - escopo
   - confianca
3. Ensinar cada especialista a citar a origem usada.
4. So depois ampliar para Fase 2 e Fase 3.
