import { supabase } from '../tools/supabaseTools';
import { agentServicos } from './servicos';
import { agentEquipes } from './equipes';
import { agentNotas } from './notas';

// ─────────────────────────────────────────────
// INTERFACES PÚBLICAS
// ─────────────────────────────────────────────

export interface ObraContexto {
  obra_id: string;
  data_referencia: string;
  status_atual: any;
}

export interface EntradaDia {
  tipo: 'texto' | 'audio_transcrito' | 'foto' | 'pdf';
  conteudo: string;
  timestamp?: string;
}

// ─────────────────────────────────────────────
// CAMADA 0 — Normalização da entrada
// ─────────────────────────────────────────────

export interface EntradaNormalizada {
  texto_original: string;
  texto_normalizado: string;
  termos_resolvidos: Array<{
    original: string;
    normalizado: string;
  }>;
}

const TERMOS_REGIONAIS: Record<string, string> = {
  'reboco': 'revestimento argamassado',
  'massa': 'revestimento argamassado',
  'emboço': 'revestimento argamassado',
  'contrapiso': 'contrapiso',
  'laje': 'laje',
  'fundação': 'fundação',
  'alicerce': 'fundação',
  'baldrame': 'fundação',
  'fiação': 'instalação elétrica',
  'encanamento': 'instalação hidráulica',
  'hidráulica': 'instalação hidráulica',
  'elétrica': 'instalação elétrica',
  'marmoraria': 'revestimento em pedra',
  'piso': 'pavimentação',
  'forro': 'forro',
  'gesso': 'gesso',
  'drywall': 'parede seca',
  'azulejo': 'revestimento cerâmico',
  'cerâmica': 'revestimento cerâmico',
  'porcelanato': 'revestimento em porcelanato',
};

const TRATAMENTOS_HONORIFICOS = ['seu ', 'dona ', 'sr. ', 'sra. ', 'dr. ', 'eng. '];

function normalizarEntrada(entradas: EntradaDia[]): EntradaNormalizada {
  // Unificar todas as entradas do dia
  const textoOriginal = entradas.map(e => e.conteudo).join('\n\n');

  let textoNormalizado = textoOriginal
    // Limpar ruídos comuns de transcrição de áudio
    .replace(/\bé\s+é\b/gi, 'é')
    .replace(/\bum\s+um\b/gi, 'um')
    .replace(/\btá\b/gi, 'está')
    .replace(/\btô\b/gi, 'estou')
    .replace(/\bpro\b/gi, 'para o')
    .replace(/\bpra\b/gi, 'para a')
    .replace(/\bnum\b/gi, 'não')
    .replace(/\bnuma\b/gi, 'em uma')
    .replace(/\bvô\b/gi, 'vou')
    .replace(/\bsô\b/gi, 'senhor')
    // Normalizar pontuação de áudio
    .replace(/\s+/g, ' ')
    .trim();

  const termosResolvidos: Array<{ original: string; normalizado: string }> = [];

  // Remover tratamentos honoríficos para normalizar nomes
  TRATAMENTOS_HONORIFICOS.forEach(trat => {
    const regex = new RegExp(`\\b${trat}(\\w+)`, 'gi');
    textoNormalizado = textoNormalizado.replace(regex, (match, nome) => {
      termosResolvidos.push({ original: match.trim(), normalizado: nome });
      return nome;
    });
  });

  return {
    texto_original: textoOriginal,
    texto_normalizado: textoNormalizado,
    termos_resolvidos: termosResolvidos,
  };
}

// ─────────────────────────────────────────────
// CAMADA 1 — Leitura semântica
// ─────────────────────────────────────────────

export type TipoEvento =
  | 'execucao_servico'
  | 'chegada_material'
  | 'pedido_cliente'
  | 'problema_obra'
  | 'registro_financeiro'
  | 'visita_obra'
  | 'decisao_projeto'
  | 'registro_foto'
  | 'sem_atividade';

export interface EventoDetectado {
  tipo: TipoEvento;
  trecho_narrativa: string;
  certeza: 'explicito' | 'inferido';
}

const PADROES_EVENTO: Array<{
  tipo: TipoEvento;
  padroes: RegExp[];
  certeza: 'explicito' | 'inferido';
}> = [
  {
    tipo: 'execucao_servico',
    padroes: [
      /instalou|assentou|concluiu|finalizou|terminou|começou|iniciou|executou|colocou|fez|aplicou|montou/i,
      /está (sendo|pronto|feito|concluído)/i,
      /equipe.{0,40}(veio|trabalhou|fez|instalou)/i,
      /pessoal.{0,40}(veio|trabalhou|fez|instalou)/i,
    ],
    certeza: 'explicito',
  },
  {
    tipo: 'execucao_servico',
    padroes: [
      /pessoal da|equipe de|time de/i,
    ],
    certeza: 'inferido',
  },
  {
    tipo: 'chegada_material',
    padroes: [
      /chegou|entregou|recebeu|descarregou/i,
      /material|cimento|areia|tijolo|ferragem|vergalhão|tinta|argamassa/i,
    ],
    certeza: 'explicito',
  },
  {
    tipo: 'pedido_cliente',
    padroes: [
      /cliente (pediu|solicitou|quer|mandou|ligou|passou)/i,
      /dono (pediu|solicitou|quer|mandou)/i,
    ],
    certeza: 'explicito',
  },
  {
    tipo: 'problema_obra',
    padroes: [
      /faltou|falta|acabou|não tem|sem estoque/i,
      /problema|erro|falha|danificado|quebrou|vazamento/i,
      /atraso|atrasou|não veio|faltou/i,
    ],
    certeza: 'explicito',
  },
  {
    tipo: 'registro_financeiro',
    padroes: [
      /pagou|pagamento|nota fiscal|boleto|transferiu|pix/i,
      /R\$\s*[\d,.]+/,
      /reais|valor|custo|orçamento/i,
    ],
    certeza: 'explicito',
  },
  {
    tipo: 'visita_obra',
    padroes: [
      /cliente (veio|passou|visitou|apareceu)/i,
      /engenheiro (veio|passou|visitou)/i,
      /visita|vistoria|inspeção/i,
    ],
    certeza: 'explicito',
  },
  {
    tipo: 'decisao_projeto',
    padroes: [
      /decidiu|definiu|aprovado|alterou|mudou o projeto|mudou o plano/i,
      /pediu para mudar|quer mudar|vai mudar/i,
    ],
    certeza: 'explicito',
  },
  {
    tipo: 'sem_atividade',
    padroes: [
      /dia tranquilo|sem atividade|nada aconteceu|choveu|paralisado|feriado/i,
    ],
    certeza: 'explicito',
  },
];

function detectarEventos(texto: string): EventoDetectado[] {
  const eventos: EventoDetectado[] = [];
  const linhas = texto.split(/[.!?\n]+/).filter(l => l.trim().length > 5);

  for (const linha of linhas) {
    for (const def of PADROES_EVENTO) {
      const match = def.padroes.some(p => p.test(linha));
      if (match) {
        // Evitar duplicar o mesmo tipo no mesmo trecho
        const jaExiste = eventos.some(
          e => e.tipo === def.tipo && e.trecho_narrativa === linha.trim()
        );
        if (!jaExiste) {
          eventos.push({
            tipo: def.tipo,
            trecho_narrativa: linha.trim(),
            certeza: def.certeza,
          });
        }
        break;
      }
    }
  }

  if (eventos.length === 0) {
    eventos.push({
      tipo: 'sem_atividade',
      trecho_narrativa: texto.substring(0, 100),
      certeza: 'inferido',
    });
  }

  return eventos;
}

// ─────────────────────────────────────────────
// CAMADA 2 — Classificação por domínio
// ─────────────────────────────────────────────

export type Dominio =
  | 'equipe'
  | 'orcamento'
  | 'cronograma'
  | 'notas'
  | 'pendencias'
  | 'fotos'
  | 'financeiro';

const MAPA_EVENTO_DOMINIO: Record<TipoEvento, Dominio[]> = {
  execucao_servico: ['equipe', 'orcamento', 'cronograma'],
  chegada_material: ['notas', 'pendencias'],
  pedido_cliente: ['notas', 'pendencias'],
  problema_obra: ['pendencias', 'notas'],
  registro_financeiro: ['financeiro', 'notas'],
  visita_obra: ['notas'],
  decisao_projeto: ['notas', 'orcamento'],
  registro_foto: ['fotos'],
  sem_atividade: [],
};

function classificarDominios(eventos: EventoDetectado[]): Dominio[] {
  const dominiosSet = new Set<Dominio>();

  for (const evento of eventos) {
    const dominiosDoEvento = MAPA_EVENTO_DOMINIO[evento.tipo] || [];
    dominiosDoEvento.forEach(d => dominiosSet.add(d));
  }

  return Array.from(dominiosSet);
}

// ─────────────────────────────────────────────
// CAMADA 3 — Resolução de entidade
// ─────────────────────────────────────────────

export interface EntidadeResolvida {
  texto_original: string;
  tipo: 'servico' | 'equipe' | 'ambiente';
  entidade_id: string | null;
  nome_oficial: string | null;
  confianca: number;
  metodo: 'exato' | 'alias' | 'alias_global' | 'semantico' | 'nao_resolvido';
}

// Extrai candidatos de nomes a partir do texto
function extrairCandidatos(texto: string): Array<{ termo: string; tipo: 'servico' | 'equipe' | 'ambiente' }> {
  const candidatos: Array<{ termo: string; tipo: 'servico' | 'equipe' | 'ambiente' }> = [];

  // Padrões para capturar menções a equipes
  const padraoEquipe = /(?:pessoal da|equipe de|equipe da|time de|os da|o da)\s+([a-záéíóúãõâêîôûç\s]+?)(?:\s+(?:veio|veiu|trabalhou|fez|instalou|assentou|colocou|montou)|[,.!?]|$)/gi;
  let m;
  while ((m = padraoEquipe.exec(texto)) !== null) {
    candidatos.push({ termo: m[1].trim(), tipo: 'equipe' });
  }

  // Padrões para capturar nomes de serviços / atividades
  const padraoServico = /(?:instalou|assentou|fez|concluiu|finalizou|executou|colocou|aplicou|montou)\s+(?:os?\s+|as?\s+)?([a-záéíóúãõâêîôûç\s]+?)(?:\s+(?:da|do|de|no|na|em|com)\s+[a-záéíóúãõâêîôûç]+)?(?:[,.!?]|$)/gi;
  while ((m = padraoServico.exec(texto)) !== null) {
    const termo = m[1].trim();
    if (termo.length > 3) {
      candidatos.push({ termo, tipo: 'servico' });
    }
  }

  // Também capturar ambientes / locais
  const padraoAmbiente = /(?:da|do|no|na|em)\s+(cozinha|banheiro|sala|quarto|varanda|churrasqueira|garagem|fachada|corredor|escritório|área de serviço)/gi;
  while ((m = padraoAmbiente.exec(texto)) !== null) {
    candidatos.push({ termo: m[1].trim(), tipo: 'ambiente' });
  }

  return candidatos;
}

async function resolverEntidades(
  texto: string,
  obra_id: string
): Promise<EntidadeResolvida[]> {
  const candidatos = extrairCandidatos(texto);
  const resolvidas: EntidadeResolvida[] = [];

  for (const candidato of candidatos) {
    const termo = candidato.termo.toLowerCase().trim();

    if (candidato.tipo === 'servico') {
      // ── Nível 1: nome exato na obra (0.95) ──────────────────────
      const { data: exatos } = await supabase
        .from('servicos')
        .select('id, nome, aliases, categoria, equipe')
        .eq('obra_id', obra_id)
        .ilike('nome', `%${termo}%`)
        .limit(3);

      if (exatos && exatos.length > 0) {
        const melhor = exatos[0];
        const confianca = melhor.nome.toLowerCase().includes(termo) ? 0.95 : 0.80;
        resolvidas.push({
          texto_original: candidato.termo,
          tipo: 'servico',
          entidade_id: melhor.id,
          nome_oficial: melhor.nome,
          confianca,
          metodo: confianca >= 0.90 ? 'exato' : 'semantico',
        });
        continue;
      }

      // ── Nível 2: alias próprio da obra (0.85) ───────────────────
      const { data: porAlias } = await supabase
        .from('servicos')
        .select('id, nome, aliases')
        .eq('obra_id', obra_id)
        .contains('aliases', [termo])
        .limit(3);

      if (porAlias && porAlias.length > 0) {
        resolvidas.push({
          texto_original: candidato.termo,
          tipo: 'servico',
          entidade_id: porAlias[0].id,
          nome_oficial: porAlias[0].nome,
          confianca: 0.85,
          metodo: 'alias',
        });
        continue;
      }

      // ── Nível 3: conhecimento global → categoria → obra (0.80) ──
      const { data: global } = await supabase
        .from('alias_conhecimento')
        .select('categoria, confianca')
        .eq('alias', termo)
        .eq('tipo', 'servico')
        .single();

      if (global) {
        const { data: porCategoria } = await supabase
          .from('servicos')
          .select('id, nome')
          .eq('obra_id', obra_id)
          .ilike('categoria', `%${global.categoria}%`)
          .limit(1);

        if (porCategoria && porCategoria.length > 0) {
          resolvidas.push({
            texto_original: candidato.termo,
            tipo: 'servico',
            entidade_id: porCategoria[0].id,
            nome_oficial: porCategoria[0].nome,
            confianca: global.confianca,
            metodo: 'alias_global',
          });
          continue;
        }
      }

      // ── Nível 4: match semântico parcial na obra (0.65) ─────────
      const { data: parcial } = await supabase
        .from('servicos')
        .select('id, nome')
        .eq('obra_id', obra_id)
        .ilike('nome', `%${termo.split(' ')[0]}%`)
        .limit(1);

      if (parcial && parcial.length > 0) {
        resolvidas.push({
          texto_original: candidato.termo,
          tipo: 'servico',
          entidade_id: parcial[0].id,
          nome_oficial: parcial[0].nome,
          confianca: 0.65,
          metodo: 'semantico',
        });
        continue;
      }

      resolvidas.push({
        texto_original: candidato.termo,
        tipo: 'servico',
        entidade_id: null,
        nome_oficial: null,
        confianca: 0.0,
        metodo: 'nao_resolvido',
      });
    }

    if (candidato.tipo === 'equipe') {
      // ── Nível 1: nome/funcao exato na obra (0.90) ───────────────
      const { data: equipes } = await supabase
        .from('equipes_cadastro')
        .select('id, nome, funcao, aliases')
        .eq('obra_id', obra_id)
        .or(`nome.ilike.%${termo}%,funcao.ilike.%${termo}%`)
        .limit(3);

      if (equipes && equipes.length > 0) {
        resolvidas.push({
          texto_original: candidato.termo,
          tipo: 'equipe',
          entidade_id: equipes[0].id,
          nome_oficial: equipes[0].nome,
          confianca: 0.90,
          metodo: 'exato',
        });
        continue;
      }

      // ── Nível 2: alias próprio da equipe na obra (0.85) ─────────
      const { data: porAlias } = await supabase
        .from('equipes_cadastro')
        .select('id, nome, funcao, aliases')
        .eq('obra_id', obra_id)
        .contains('aliases', [termo])
        .limit(3);

      if (porAlias && porAlias.length > 0) {
        resolvidas.push({
          texto_original: candidato.termo,
          tipo: 'equipe',
          entidade_id: porAlias[0].id,
          nome_oficial: porAlias[0].nome,
          confianca: 0.85,
          metodo: 'alias',
        });
        continue;
      }

      // ── Nível 3: conhecimento global → funcao → equipe na obra (0.80) ──
      const { data: globalEquipe } = await supabase
        .from('alias_conhecimento')
        .select('categoria, confianca')
        .eq('alias', termo)
        .eq('tipo', 'equipe')
        .single();

      if (globalEquipe) {
        const { data: porFuncao } = await supabase
          .from('equipes_cadastro')
          .select('id, nome, funcao')
          .eq('obra_id', obra_id)
          .ilike('funcao', `%${globalEquipe.categoria}%`)
          .limit(1);

        if (porFuncao && porFuncao.length > 0) {
          resolvidas.push({
            texto_original: candidato.termo,
            tipo: 'equipe',
            entidade_id: porFuncao[0].id,
            nome_oficial: porFuncao[0].nome,
            confianca: globalEquipe.confianca,
            metodo: 'alias_global',
          });
          continue;
        }
      }

      resolvidas.push({
        texto_original: candidato.termo,
        tipo: 'equipe',
        entidade_id: null,
        nome_oficial: null,
        confianca: 0.0,
        metodo: 'nao_resolvido',
      });
    }

    if (candidato.tipo === 'ambiente') {
      // Ambientes não são entidades do banco — registrar como semântico sem ID
      resolvidas.push({
        texto_original: candidato.termo,
        tipo: 'ambiente',
        entidade_id: null,
        nome_oficial: candidato.termo,
        confianca: 0.70,
        metodo: 'semantico',
      });
    }
  }

  // Remover duplicatas pelo entidade_id (manter o de maior confiança)
  const mapa = new Map<string, EntidadeResolvida>();
  for (const e of resolvidas) {
    const chave = e.entidade_id ?? `nao_resolvido_${e.texto_original}`;
    const existente = mapa.get(chave);
    if (!existente || e.confianca > existente.confianca) {
      mapa.set(chave, e);
    }
  }

  return Array.from(mapa.values());
}

// ─────────────────────────────────────────────
// CAMADA 4 — Extração de intenção
// ─────────────────────────────────────────────

export interface Acao {
  dominio: Dominio;
  tipo: string;
  entidade_id: string | null;
  dados: Record<string, unknown>;
  confianca: number;
  motivo: string;
  requer_input_gestor: boolean;
  pergunta_gestor?: string;
}

function extrairAcoes(
  eventos: EventoDetectado[],
  entidades: EntidadeResolvida[],
  texto: string
): Acao[] {
  const acoes: Acao[] = [];

  const entidadesServico = entidades.filter(e => e.tipo === 'servico');
  const entidadesEquipe = entidades.filter(e => e.tipo === 'equipe');

  for (const evento of eventos) {
    const trecho = evento.trecho_narrativa;

    switch (evento.tipo) {
      case 'execucao_servico': {
        // Marcar presença das equipes mencionadas
        for (const equipe of entidadesEquipe) {
          const confianca = equipe.confianca;
          acoes.push({
            dominio: 'equipe',
            tipo: 'marcar_presenca',
            entidade_id: equipe.entidade_id,
            dados: { nome_equipe: equipe.nome_oficial ?? equipe.texto_original },
            confianca: confianca * (evento.certeza === 'explicito' ? 1.0 : 0.85),
            motivo: `Menção de execução: "${trecho}"`,
            requer_input_gestor: confianca < 0.65,
            pergunta_gestor: confianca < 0.65
              ? `Qual equipe executou o serviço de "${equipe.texto_original}"?`
              : undefined,
          });
        }

        // Atualizar avanço dos serviços detectados
        for (const servico of entidadesServico) {
          // Verificar se há percentual explícito no trecho
          const percentualMatch = trecho.match(/(\d+)\s*%/);
          const percentual = percentualMatch ? parseInt(percentualMatch[1], 10) : null;

          const confianca = servico.confianca;
          acoes.push({
            dominio: 'orcamento',
            tipo: percentual !== null ? 'atualizar_avanco' : 'iniciar_servico',
            entidade_id: servico.entidade_id,
            dados: {
              nome_servico: servico.nome_oficial ?? servico.texto_original,
              avanco_novo: percentual,
            },
            confianca: confianca * (percentual !== null ? 1.0 : 0.75),
            motivo: `Execução detectada: "${trecho}"`,
            requer_input_gestor: confianca < 0.65 || percentual === null,
            pergunta_gestor:
              confianca < 0.65
                ? `Qual serviço foi executado quando se diz "${servico.texto_original}"?`
                : percentual === null
                ? `Qual o percentual atual do serviço "${servico.nome_oficial ?? servico.texto_original}"?`
                : undefined,
          });

          // Registrar no cronograma
          acoes.push({
            dominio: 'cronograma',
            tipo: percentual === 100 ? 'registrar_conclusao' : 'registrar_inicio',
            entidade_id: servico.entidade_id,
            dados: { nome_servico: servico.nome_oficial ?? servico.texto_original },
            confianca: confianca * 0.90,
            motivo: `Consequência de execução de serviço`,
            requer_input_gestor: confianca < 0.65,
            pergunta_gestor: confianca < 0.65
              ? `O serviço "${servico.texto_original}" foi iniciado hoje?`
              : undefined,
          });
        }

        // Se não há serviço resolvido mas há execução, pedir ao gestor
        if (entidadesServico.length === 0) {
          acoes.push({
            dominio: 'orcamento',
            tipo: 'iniciar_servico',
            entidade_id: null,
            dados: { trecho_original: trecho },
            confianca: 0.40,
            motivo: `Execução mencionada mas serviço não identificado`,
            requer_input_gestor: true,
            pergunta_gestor: `Qual serviço foi executado? ("${trecho.substring(0, 80)}")`,
          });
        }
        break;
      }

      case 'problema_obra': {
        // Verificar se é falta de material
        const isFaltaMaterial = /faltou|falta|acabou|não tem|sem estoque/i.test(trecho);
        acoes.push({
          dominio: 'pendencias',
          tipo: 'criar_pendencia',
          entidade_id: null,
          dados: {
            descricao: trecho,
            prioridade: isFaltaMaterial ? 'media' : 'alta',
            categoria: isFaltaMaterial ? 'material' : 'problema_tecnico',
          },
          confianca: 0.90,
          motivo: `Problema identificado na narrativa`,
          requer_input_gestor: false,
        });

        acoes.push({
          dominio: 'notas',
          tipo: 'criar_nota',
          entidade_id: null,
          dados: { tipo: 'alerta', texto: trecho },
          confianca: 0.85,
          motivo: `Registro de ocorrência`,
          requer_input_gestor: false,
        });
        break;
      }

      case 'pedido_cliente': {
        acoes.push({
          dominio: 'notas',
          tipo: 'criar_nota',
          entidade_id: null,
          dados: { tipo: 'decisao', texto: trecho },
          confianca: 0.90,
          motivo: `Pedido do cliente registrado`,
          requer_input_gestor: false,
        });

        acoes.push({
          dominio: 'pendencias',
          tipo: 'criar_pendencia',
          entidade_id: null,
          dados: {
            descricao: trecho,
            prioridade: 'media',
            categoria: 'solicitacao_cliente',
          },
          confianca: 0.85,
          motivo: `Pedido de cliente gera pendência`,
          requer_input_gestor: false,
        });
        break;
      }

      case 'decisao_projeto': {
        acoes.push({
          dominio: 'notas',
          tipo: 'criar_nota',
          entidade_id: null,
          dados: { tipo: 'decisao', texto: trecho },
          confianca: 0.90,
          motivo: `Decisão de projeto registrada`,
          requer_input_gestor: false,
        });
        break;
      }

      case 'visita_obra': {
        acoes.push({
          dominio: 'notas',
          tipo: 'criar_nota',
          entidade_id: null,
          dados: { tipo: 'observacao', texto: trecho },
          confianca: 0.90,
          motivo: `Visita à obra registrada`,
          requer_input_gestor: false,
        });
        break;
      }

      case 'chegada_material': {
        acoes.push({
          dominio: 'notas',
          tipo: 'criar_nota',
          entidade_id: null,
          dados: { tipo: 'observacao', texto: trecho },
          confianca: 0.85,
          motivo: `Chegada de material registrada`,
          requer_input_gestor: false,
        });
        break;
      }

      case 'registro_financeiro': {
        acoes.push({
          dominio: 'financeiro',
          tipo: 'criar_nota',
          entidade_id: null,
          dados: { tipo: 'observacao', texto: trecho },
          confianca: 0.80,
          motivo: `Registro financeiro detectado — requer validação`,
          requer_input_gestor: true,
          pergunta_gestor: `Confirme os valores mencionados: "${trecho}"`,
        });
        break;
      }

      case 'sem_atividade':
      default:
        // Sem ações concretas — camada 5 filtrará
        break;
    }
  }

  return acoes;
}

// ─────────────────────────────────────────────
// CAMADA 5 — Filtro de relevância
// ─────────────────────────────────────────────

function filtrarAcoes(acoes: Acao[]): Acao[] {
  const consolidadas: Acao[] = [];
  const vistas = new Set<string>();

  for (const acao of acoes) {
    // Chave de deduplicação: domínio + tipo + entidade
    const chave = `${acao.dominio}|${acao.tipo}|${acao.entidade_id ?? 'null'}`;

    if (vistas.has(chave)) {
      // Consolidar: manter o de maior confiança
      const idx = consolidadas.findIndex(
        a => `${a.dominio}|${a.tipo}|${a.entidade_id ?? 'null'}` === chave
      );
      if (idx >= 0 && acao.confianca > consolidadas[idx].confianca) {
        consolidadas[idx] = acao;
      }
    } else {
      vistas.add(chave);
      consolidadas.push(acao);
    }
  }

  // Remover ações de sem_atividade se houver qualquer outra ação
  const temAcoesConcretas = consolidadas.some(a => a.confianca > 0.30);
  if (temAcoesConcretas) {
    return consolidadas.filter(a => a.entidade_id !== null || a.confianca > 0.30);
  }

  return consolidadas;
}

// ─────────────────────────────────────────────
// CAMADA 6 — Mapa de impacto e encadeamento
// ─────────────────────────────────────────────

export interface Impacto {
  origem: Dominio;
  afeta: Dominio[];
  tipo_impacto: 'automatico' | 'requer_calculo' | 'requer_confirmacao';
}

function calcularImpactos(acoes: Acao[]): Impacto[] {
  const impactos: Impacto[] = [];
  const dominiosAtivos = new Set(acoes.map(a => a.dominio));

  // Regra: orcamento atualizado → recalcular cronograma
  if (dominiosAtivos.has('orcamento')) {
    impactos.push({
      origem: 'orcamento',
      afeta: ['cronograma'],
      tipo_impacto: 'requer_calculo',
    });
  }

  // Regra: serviço concluído → verificar medição semanal
  const temConclusao = acoes.some(a => a.tipo === 'concluir_servico' || a.dados.avanco_novo === 100);
  if (temConclusao) {
    impactos.push({
      origem: 'orcamento',
      afeta: ['cronograma', 'financeiro'],
      tipo_impacto: 'requer_confirmacao',
    });
  }

  // Regra: presença registrada → vincular serviços do dia
  if (dominiosAtivos.has('equipe') && dominiosAtivos.has('orcamento')) {
    impactos.push({
      origem: 'equipe',
      afeta: ['orcamento'],
      tipo_impacto: 'automatico',
    });
  }

  return impactos;
}

// ─────────────────────────────────────────────
// CAMADA 7 — Distribuição para subagentes
// ─────────────────────────────────────────────

export type AgentName =
  | 'equipe_agent'
  | 'orcamento_agent'
  | 'cronograma_agent'
  | 'notas_agent'
  | 'pendencias_agent'
  | 'fotos_agent';

export interface Dispatch {
  agent: AgentName;
  payload: {
    acoes: Acao[];
    contexto_obra: ObraContexto;
    data_referencia: string;
  };
}

const DOMINIO_AGENTE: Record<Dominio, AgentName> = {
  equipe: 'equipe_agent',
  orcamento: 'orcamento_agent',
  cronograma: 'cronograma_agent',
  notas: 'notas_agent',
  pendencias: 'pendencias_agent',
  fotos: 'fotos_agent',
  financeiro: 'notas_agent', // Financeiro → notas_agent até ter agente dedicado
};

function montarDispatch(
  acoes: Acao[],
  contexto: ObraContexto
): Dispatch[] {
  const porAgente = new Map<AgentName, Acao[]>();

  for (const acao of acoes) {
    const agente = DOMINIO_AGENTE[acao.dominio];
    if (!porAgente.has(agente)) {
      porAgente.set(agente, []);
    }
    porAgente.get(agente)!.push(acao);
  }

  const dispatches: Dispatch[] = [];
  for (const [agent, acoesDoAgente] of porAgente.entries()) {
    dispatches.push({
      agent,
      payload: {
        acoes: acoesDoAgente,
        contexto_obra: contexto,
        data_referencia: contexto.data_referencia,
      },
    });
  }

  return dispatches;
}

// ─────────────────────────────────────────────
// CAMADA 8 — Saída para HITL
// ─────────────────────────────────────────────

export interface SaidaHITL {
  resumo: string;
  acoes_propostas: Acao[];
  dominios_afetados: Dominio[];
  entidades_resolvidas: EntidadeResolvida[];
  dispatch: Dispatch[];
  threshold_confirmacao: 0.85;
  threshold_aviso: 0.65;
  confianca_geral: number;
}

function montarSaidaHITL(
  acoes: Acao[],
  dominios: Dominio[],
  entidades: EntidadeResolvida[],
  dispatch: Dispatch[]
): SaidaHITL {
  const confiancas = acoes.map(a => a.confianca);
  const confiancaGeral =
    confiancas.length > 0
      ? confiancas.reduce((s, c) => s + c, 0) / confiancas.length
      : 0;

  // Resumo textual
  const equipes = entidades.filter(e => e.tipo === 'equipe' && e.nome_oficial).map(e => e.nome_oficial);
  const servicos = entidades.filter(e => e.tipo === 'servico' && e.nome_oficial).map(e => e.nome_oficial);
  const pendencias = acoes.filter(a => a.dominio === 'pendencias').length;
  const notas = acoes.filter(a => a.dominio === 'notas').length;

  const partes: string[] = [];
  if (equipes.length > 0) partes.push(`Equipes: ${equipes.join(', ')}`);
  if (servicos.length > 0) partes.push(`Serviços: ${servicos.join(', ')}`);
  if (pendencias > 0) partes.push(`${pendencias} pendência(s)`);
  if (notas > 0) partes.push(`${notas} nota(s)`);

  const resumo =
    partes.length > 0
      ? partes.join(' | ')
      : 'Nenhuma ação concreta identificada no diário.';

  return {
    resumo,
    acoes_propostas: acoes,
    dominios_afetados: dominios,
    entidades_resolvidas: entidades,
    dispatch,
    threshold_confirmacao: 0.85,
    threshold_aviso: 0.65,
    confianca_geral: Math.round(confiancaGeral * 100) / 100,
  };
}

// ─────────────────────────────────────────────
// MODELO COMPLETO DE PROCESSAMENTO
// ─────────────────────────────────────────────

export interface ProcessamentoOrquestrador {
  // Entrada
  obra_id: string;
  data_referencia: string;
  entradas_dia: EntradaDia[];

  // Camadas
  normalizacao: EntradaNormalizada;
  eventos: EventoDetectado[];
  dominios: Dominio[];
  entidades_resolvidas: EntidadeResolvida[];
  acoes: Acao[];
  impactos: Impacto[];
  dispatch: Dispatch[];

  // Saída HITL
  hitl: SaidaHITL;
}

// ─────────────────────────────────────────────
// PONTO DE ENTRADA PRINCIPAL
// ─────────────────────────────────────────────

/**
 * Processa entradas do dia e retorna o objeto completo de processamento.
 * NUNCA persiste — apenas retorna para validação HITL.
 */
export async function processarDia(
  entradas: EntradaDia[],
  contexto: ObraContexto
): Promise<ProcessamentoOrquestrador> {
  console.log(`[Orchestrator] Iniciando processamento — obra=${contexto.obra_id} data=${contexto.data_referencia}`);

  // CAMADA 0
  const normalizacao = normalizarEntrada(entradas);
  console.log(`[Orchestrator] C0 — Normalização concluída`);

  // CAMADA 1
  const eventos = detectarEventos(normalizacao.texto_normalizado);
  console.log(`[Orchestrator] C1 — ${eventos.length} eventos detectados`);

  // CAMADA 2
  const dominios = classificarDominios(eventos);
  console.log(`[Orchestrator] C2 — Domínios: ${dominios.join(', ')}`);

  // CAMADA 3
  const entidades_resolvidas = await resolverEntidades(
    normalizacao.texto_normalizado,
    contexto.obra_id
  );
  console.log(`[Orchestrator] C3 — ${entidades_resolvidas.length} entidades resolvidas`);

  // CAMADA 4
  const acoesRaw = extrairAcoes(eventos, entidades_resolvidas, normalizacao.texto_normalizado);
  console.log(`[Orchestrator] C4 — ${acoesRaw.length} ações extraídas`);

  // CAMADA 5
  const acoes = filtrarAcoes(acoesRaw);
  console.log(`[Orchestrator] C5 — ${acoes.length} ações após filtro`);

  // CAMADA 6
  const impactos = calcularImpactos(acoes);
  console.log(`[Orchestrator] C6 — ${impactos.length} impactos calculados`);

  // CAMADA 7
  const dispatch = montarDispatch(acoes, contexto);
  console.log(`[Orchestrator] C7 — ${dispatch.length} dispatches montados`);

  // CAMADA 8 (HITL)
  const hitl = montarSaidaHITL(acoes, dominios, entidades_resolvidas, dispatch);
  console.log(`[Orchestrator] C8 — HITL pronto. Confiança geral: ${hitl.confianca_geral}`);

  return {
    obra_id: contexto.obra_id,
    data_referencia: contexto.data_referencia,
    entradas_dia: entradas,
    normalizacao,
    eventos,
    dominios,
    entidades_resolvidas,
    acoes,
    impactos,
    dispatch,
    hitl,
  };
}

// ─────────────────────────────────────────────
// COMPATIBILIDADE COM API LEGADA
// ─────────────────────────────────────────────

/**
 * API legada — mantida para não quebrar integrações existentes.
 * @deprecated Use processarDia() com a nova interface ProcessamentoOrquestrador
 */
export async function orchestratorProcess(transcricao: string, contexto: ObraContexto) {
  console.warn('[Orchestrator] orchestratorProcess() é deprecated. Use processarDia().');

  const entradas: EntradaDia[] = [{ tipo: 'texto', conteudo: transcricao }];
  const resultado = await processarDia(entradas, contexto);

  // Manter contrato antigo
  const dominios = resultado.dominios;
  const dOrcamento = resultado.dispatch.find(d => d.agent === 'orcamento_agent') as Dispatch;
  const servicos = dominios.includes('orcamento') && dOrcamento ? await agentServicos(dOrcamento, transcricao) : [];
  
  const dEquipe = resultado.dispatch.find(d => d.agent === 'equipe_agent') as Dispatch;
  const equipes = dominios.includes('equipe') && dEquipe ? await agentEquipes(dEquipe, transcricao) : [];
  
  const dNotas = resultado.dispatch.find(d => d.agent === 'notas_agent') as Dispatch;
  const notas = dominios.includes('notas') && dNotas ? await agentNotas(dNotas, transcricao) : [];

  return {
    servicos,
    equipes,
    notas,
    semana_relativa: contexto.status_atual.semana_relativa,
    // Novos campos disponíveis via API legada
    processamento: resultado,
  };
}
