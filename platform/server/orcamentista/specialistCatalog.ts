export type SpecialistId =
  | 'discipline_specialist_civil_execucao'
  | 'discipline_specialist_estrutural'
  | 'discipline_specialist_geotecnico_fundacoes'
  | 'discipline_specialist_hidraulica_sanitaria'
  | 'discipline_specialist_eletrica'
  | 'discipline_specialist_custos_orcamentacao'
  | 'discipline_specialist_telecom_dados'
  | 'discipline_specialist_climatizacao_hvac'
  | 'discipline_specialist_automacao_residencial'
  | 'discipline_specialist_seguranca_incendio_ppci'
  | 'discipline_specialist_impermeabilizacao'
  | 'discipline_specialist_acustica'
  | 'discipline_specialist_iluminacao_luminotecnica'
  | 'discipline_specialist_producao_gestao_obra';

export type Phase1SpecialistId = SpecialistId;

export interface SpecialistCatalogEntry {
  id: SpecialistId;
  nome: string;
  fase: 1 | 2 | 3;
  foco: string;
  erros_criticos: string[];
  entregavel: string;
  prioridade_base: number;
  knowledge_paths?: string[];
  discipline_aliases?: string[];
}

export const SPECIALISTS: SpecialistCatalogEntry[] = [
  {
    id: 'discipline_specialist_civil_execucao',
    nome: 'Civil e Execucao',
    fase: 1,
    foco:
      'alvenaria, vedacoes, revestimentos, forros, esquadrias basicas, acabamentos e logica executiva da obra civil',
    erros_criticos: [
      'medicao incorreta de forros e revestimentos',
      'confusao entre area liquida e area bruta',
      'omissao de servicos de preparo, regularizacao e acabamento',
    ],
    entregavel:
      'leitura tecnica da obra civil, quantitativos candidatos, conflitos de execucao e itens orcamentarios da disciplina',
    prioridade_base: 1,
    knowledge_paths: [
      'server/orcamentista/skills/SKILL_QUANTITATIVOS_GERAL.md',
    ],
    discipline_aliases: ['civil', 'arquitetura', 'execucao'],
  },
  {
    id: 'discipline_specialist_estrutural',
    nome: 'Estrutural',
    fase: 1,
    foco: 'estrutura de concreto, armacao, lajes, vigas, pilares, cargas e compatibilizacao estrutural',
    erros_criticos: [
      'confusao entre revisoes de prancha estrutural',
      'omissao de armacao, concreto ou formas',
      'leitura errada de dimensoes e quantitativos estruturais',
    ],
    entregavel:
      'leitura estrutural profunda, quantitativos-chave de estrutura e alertas de incompatibilidade ou incoerencia',
    prioridade_base: 1,
    knowledge_paths: [
      'server/orcamentista/skills/SKILL_ESTRUTURAL.md',
    ],
    discipline_aliases: ['estrutural', 'estrutura'],
  },
  {
    id: 'discipline_specialist_geotecnico_fundacoes',
    nome: 'Geotecnica e Fundacoes',
    fase: 1,
    foco: 'solo, sondagem, fundacoes, estacas, sapatas, blocos, baldrames e contencoes',
    erros_criticos: [
      'erro grosseiro de fundacao',
      'omissao de servicos de escavacao e reaterro',
      'uso incorreto de tipologia de fundacao sem lastro documental',
    ],
    entregavel:
      'leitura das fundacoes e do solo, quantitativos de fundacao e pendencias de validacao geotecnica',
    prioridade_base: 1,
    knowledge_paths: [
      'server/orcamentista/skills/SKILL_GEOTECNICA_FUNDACOES.md',
    ],
    discipline_aliases: ['fundacoes', 'fundação', 'geotecnica', 'geotécnica', 'solo'],
  },
  {
    id: 'discipline_specialist_hidraulica_sanitaria',
    nome: 'Hidraulica e Sanitaria',
    fase: 1,
    foco: 'agua fria, agua quente, esgoto, drenagem, reservacao, loucas, metais e pontos hidrossanitarios',
    erros_criticos: [
      'omissao de pontos hidraulicos e sanitarios',
      'subestimacao de tubulacoes e conexoes',
      'confusao entre drenagem, esgoto e agua pluvial',
    ],
    entregavel:
      'mapa hidrossanitario, quantitativos candidatos e itens orcamentarios da disciplina',
    prioridade_base: 1,
    knowledge_paths: [
      'skills/SKILL_ENGENHARIA_HIDRAULICA_SANITARIA.md',
      'docs/REFERENCIAS_ENGENHARIA_HIDRAULICA_SANITARIA.md',
    ],
    discipline_aliases: ['hidraulica', 'hidráulica', 'sanitaria', 'sanitário'],
  },
  {
    id: 'discipline_specialist_eletrica',
    nome: 'Eletrica',
    fase: 1,
    foco: 'infraestrutura, quadros, circuitos, eletrodutos, cabos, pontos, cargas e dispositivos',
    erros_criticos: [
      'omissao de infraestrutura eletrica',
      'subdimensionamento de pontos e circuitos',
      'confusao entre pontos previstos e itens efetivamente orcamentarios',
    ],
    entregavel:
      'mapa eletrico, quantitativos candidatos e itens orcamentarios da disciplina',
    prioridade_base: 1,
    knowledge_paths: [
      'skills/SKILL_ENGENHARIA_ELETRICA.md',
      'docs/REFERENCIAS_ENGENHARIA_ELETRICA.md',
    ],
    discipline_aliases: ['eletrica', 'elétrica'],
  },
  {
    id: 'discipline_specialist_custos_orcamentacao',
    nome: 'Custos e Orcamentacao',
    fase: 1,
    foco:
      'estrutura de servicos, classificacao orcamentaria, composicoes candidatas, referencias e coerencia de custo',
    erros_criticos: [
      'servicos duplicados ou mal classificados',
      'composicao de custo sem referencia adequada',
      'mistura indevida entre item global e item especifico da obra',
    ],
    entregavel:
      'estrutura orcamentaria da disciplina, itens candidatos, composicoes e pendencias de catalogo',
    prioridade_base: 1,
    knowledge_paths: [
      'skills/SKILL_ENGENHARIA_CUSTOS_ORCAMENTACAO.md',
      'docs/REFERENCIAS_ENGENHARIA_CUSTOS_ORCAMENTACAO.md',
    ],
    discipline_aliases: ['custos', 'orcamentacao', 'orçamentação'],
  },
  {
    id: 'discipline_specialist_telecom_dados',
    nome: 'Telecom e Dados',
    fase: 2,
    foco: 'infraestrutura seca, dados, voz, wi-fi, rack, patch panel, CFTV e pontos de telecom residenciais e comerciais leves',
    erros_criticos: [
      'misturar ponto de dados com ponto eletrico comum',
      'omitir infraestrutura seca, eletrocalhas ou tubulacoes dedicadas',
      'assumir topologia ou rack sem memoria ou projeto',
    ],
    entregavel:
      'mapa de pontos e infraestrutura de telecom, quantitativos candidatos e lacunas de compatibilizacao com eletrica',
    prioridade_base: 2,
    knowledge_paths: [
      'skills/SKILL_ENGENHARIA_TELECOM_DADOS.md',
      'docs/REFERENCIAS_ENGENHARIA_TELECOM_DADOS.md',
    ],
    discipline_aliases: ['telecom', 'dados', 'rede', 'cftv', 'infra seca'],
  },
  {
    id: 'discipline_specialist_climatizacao_hvac',
    nome: 'Climatizacao e HVAC',
    fase: 2,
    foco: 'ar-condicionado, renovacao de ar, ventilacao, exaustao, drenos, infraestrutura frigorifica e cargas de climatizacao',
    erros_criticos: [
      'assumir capacidade termica sem memorial ou calculo',
      'omitir dreno, alimentacao e infraestrutura de suporte',
      'misturar ventilacao/exaustao com climatizacao sem evidencias',
    ],
    entregavel:
      'leitura de sistemas HVAC, pontos e infraestrutura candidatos, interfaces com eletrica e civil e pendencias HITL',
    prioridade_base: 2,
    knowledge_paths: [
      'skills/SKILL_ENGENHARIA_CLIMATIZACAO_HVAC.md',
      'docs/REFERENCIAS_ENGENHARIA_CLIMATIZACAO_HVAC.md',
    ],
    discipline_aliases: ['hvac', 'climatizacao', 'climatização', 'ar condicionado', 'ventilacao', 'exaustao'],
  },
  {
    id: 'discipline_specialist_automacao_residencial',
    nome: 'Automacao Residencial',
    fase: 2,
    foco: 'cenas, comando, sensores, integracoes, persianas, audio, controle e infraestrutura de automacao residencial',
    erros_criticos: [
      'assumir escopo premium sem evidencias do cliente',
      'confundir automacao com instalacao eletrica basica',
      'omitir gateways, controladores ou infraestrutura dedicada quando previstos',
    ],
    entregavel:
      'mapa de sistemas e pontos de automacao candidatos, interfaces com eletrica/telecom e lacunas de especificacao',
    prioridade_base: 2,
    knowledge_paths: [
      'skills/SKILL_ENGENHARIA_AUTOMACAO_RESIDENCIAL.md',
      'docs/REFERENCIAS_ENGENHARIA_AUTOMACAO_RESIDENCIAL.md',
    ],
    discipline_aliases: ['automacao', 'automação', 'casa inteligente', 'smart home', 'domotica'],
  },
  {
    id: 'discipline_specialist_seguranca_incendio_ppci',
    nome: 'Seguranca Contra Incendio e PPCI',
    fase: 2,
    foco: 'rotas de fuga, extintores, iluminacao de emergencia, sinalizacao, alarme, hidrantes e exigencias de aprovacao',
    erros_criticos: [
      'usar regra residencial simples em edificacao com exigencia de PPCI',
      'omitir sistema de sinalizacao e iluminacao de emergencia',
      'assumir exigencias do corpo de bombeiros sem classificar ocupacao e risco',
    ],
    entregavel:
      'mapa preliminar de itens de seguranca contra incendio, exigencias candidatas e pendencias de enquadramento legal',
    prioridade_base: 2,
    knowledge_paths: [
      'skills/SKILL_ENGENHARIA_SEGURANCA_INCENDIO_PPCI.md',
      'docs/REFERENCIAS_ENGENHARIA_SEGURANCA_INCENDIO_PPCI.md',
    ],
    discipline_aliases: ['ppci', 'incendio', 'incêndio', 'bombeiros', 'sinalizacao de emergencia'],
  },
  {
    id: 'discipline_specialist_impermeabilizacao',
    nome: 'Impermeabilizacao',
    fase: 2,
    foco: 'areas molhadas, lajes, baldrames, reservatorios, rodapes tecnicos, detalhes de manta, argamassa e protecao mecanica',
    erros_criticos: [
      'omitir preparacao de base e protecao mecanica',
      'misturar sistema rigido e flexivel sem criterio',
      'assumir espessura ou sistema sem detalhe construtivo',
    ],
    entregavel:
      'mapa de superficies e sistemas candidatos de impermeabilizacao, interfaces com civil e pendencias de detalhamento',
    prioridade_base: 2,
    knowledge_paths: [
      'skills/SKILL_ENGENHARIA_IMPERMEABILIZACAO.md',
      'docs/REFERENCIAS_ENGENHARIA_IMPERMEABILIZACAO.md',
    ],
    discipline_aliases: ['impermeabilizacao', 'impermeabilização', 'manta', 'areas molhadas'],
  },
  {
    id: 'discipline_specialist_acustica',
    nome: 'Acustica',
    fase: 3,
    foco: 'isolamento, tratamento, vedacoes, forros, pisos flutuantes, mantas, absorcao e desempenho acustico aplicado',
    erros_criticos: [
      'tratar solucao decorativa como desempenho acustico garantido',
      'omitir interfaces criticas entre parede, piso, forro e esquadria',
      'assumir indice de desempenho sem ensaio ou especificacao',
    ],
    entregavel:
      'mapa de requisitos e solucoes acusticas candidatas, interfaces construtivas e lacunas de desempenho',
    prioridade_base: 3,
    knowledge_paths: [
      'skills/SKILL_ENGENHARIA_ACUSTICA.md',
      'docs/REFERENCIAS_ENGENHARIA_ACUSTICA.md',
    ],
    discipline_aliases: ['acustica', 'acústica', 'isolamento acustico', 'tratamento acustico'],
  },
  {
    id: 'discipline_specialist_iluminacao_luminotecnica',
    nome: 'Iluminacao e Luminotecnica',
    fase: 3,
    foco: 'camadas de iluminacao, temperatura de cor, controle, cenas, destaque, fluxo luminoso e compatibilizacao com arquitetura',
    erros_criticos: [
      'contar somente pontos sem considerar intencao luminotecnica',
      'assumir fluxo, potencia ou especificacao final sem memorial',
      'misturar iluminacao tecnica com decorativa sem separar escopo',
    ],
    entregavel:
      'mapa luminotecnico preliminar, quantitativos candidatos de luminarias e controles e pendencias de especificacao',
    prioridade_base: 3,
    knowledge_paths: [
      'skills/SKILL_ENGENHARIA_ILUMINACAO_LUMINOTECNICA.md',
      'docs/REFERENCIAS_ENGENHARIA_ILUMINACAO_LUMINOTECNICA.md',
    ],
    discipline_aliases: ['luminotecnica', 'luminotécnica', 'iluminacao', 'iluminação tecnica'],
  },
  {
    id: 'discipline_specialist_producao_gestao_obra',
    nome: 'Producao e Gestao de Obra',
    fase: 3,
    foco: 'sequenciamento, frentes, restricoes, suprimentos, produtividade, cronograma executivo e governanca de obra',
    erros_criticos: [
      'transformar plano tatico em prazo definitivo sem base',
      'ignorar restricoes de suprimento, acesso ou interfaces entre equipes',
      'misturar planejamento macro com medicao tecnica disciplinar',
    ],
    entregavel:
      'plano preliminar de execucao, riscos de sequencia, dependencias entre disciplinas e pendencias para cronograma',
    prioridade_base: 3,
    knowledge_paths: [
      'skills/SKILL_ENGENHARIA_PRODUCAO_GESTAO_OBRA.md',
      'docs/REFERENCIAS_ENGENHARIA_PRODUCAO_GESTAO_OBRA.md',
    ],
    discipline_aliases: ['producao', 'produção', 'gestao de obra', 'gestão de obra', 'planejamento de obra', 'cronograma'],
  },
];

export const PHASE1_SPECIALISTS = SPECIALISTS.filter((entry) => entry.fase === 1);
export const OPERATIONAL_SPECIALISTS = [...SPECIALISTS];

export const SPECIALISTS_BY_ID: Record<SpecialistId, SpecialistCatalogEntry> = Object.fromEntries(
  SPECIALISTS.map((entry) => [entry.id, entry])
) as Record<SpecialistId, SpecialistCatalogEntry>;

export const PHASE1_SPECIALISTS_BY_ID = SPECIALISTS_BY_ID;

export function listSpecialists(): SpecialistCatalogEntry[] {
  return SPECIALISTS;
}

export function listPhase1Specialists(): SpecialistCatalogEntry[] {
  return PHASE1_SPECIALISTS;
}
