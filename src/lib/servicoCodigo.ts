import { Servico } from '../types';
import { normalizarServicoStatus } from './servicoStatus';

export const CODIGO_SERVICO_REGEX = /^[1-9]\d*\.[1-9]\d*$/;

type LegacyServico = Partial<Servico> & {
  id_servico?: string;
  cod?: string;
  codigo?: string;
};

export type ServicoPersistenciaPayload = {
  id?: string;
  codigo_servico: string;
  codigo_referencia?: string;
  nome: string;
  categoria: string;
  avanco_atual: number;
  status: Servico['status'];
  data_prevista: string | null;
  data_conclusao: string | null;
  responsavel: string | null;
  equipe: string | null;
  unidade: string | null;
  quantidade: number | null;
  valor_unitario: number | null;
  valor_total: number | null;
  custo_mao_obra: number | null;
  custo_material: number | null;
  origem_preco?: string;
  origem_preco_detalhe?: string;
  competencia_preco?: string;
  fonte_preco?: string;
  confianca_referencia?: number;
};

export type CodigoServicoPartes = {
  etapa: number;
  item: number;
};

export function extrairCodigoServico(
  servico:
    | LegacyServico
    | (Pick<Servico, 'codigo_servico'> & { id_servico?: string; cod?: string; codigo?: string })
): string {
  return servico.codigo_servico || servico.id_servico || servico.cod || servico.codigo || '';
}

export function parseCodigoServico(codigo?: string | null): CodigoServicoPartes | null {
  if (!codigo || !CODIGO_SERVICO_REGEX.test(codigo)) {
    return null;
  }

  const [etapa, item] = codigo.split('.').map(Number);
  return { etapa, item };
}

export function compareCodigoServico(a?: string | null, b?: string | null): number {
  const parsedA = parseCodigoServico(a);
  const parsedB = parseCodigoServico(b);

  if (parsedA && parsedB) {
    if (parsedA.etapa !== parsedB.etapa) {
      return parsedA.etapa - parsedB.etapa;
    }
    return parsedA.item - parsedB.item;
  }

  return (a || '').localeCompare(b || '', undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

export function validarCodigoServico(codigo?: string | null): string | null {
  if (!codigo?.trim()) {
    return 'Informe o código do serviço no formato N.M.';
  }

  if (!CODIGO_SERVICO_REGEX.test(codigo)) {
    return 'Use o formato N.M com etapa e item numéricos, por exemplo 4.3.';
  }

  return null;
}

export function obterCabecalhoEtapa(etapa: number, categoria: string): string {
  return `${etapa}.0 — ${categoria || 'Sem categoria'}`;
}

export function normalizarServico(raw: LegacyServico): Servico {
  return {
    ...raw,
    codigo_servico: extrairCodigoServico(raw),
    nome: raw.nome || '',
    categoria: raw.categoria || '',
    avanco_atual: Number(raw.avanco_atual || 0),
    status: normalizarServicoStatus(raw.status, Number(raw.avanco_atual || 0)),
    confianca_referencia:
      raw.confianca_referencia === null || raw.confianca_referencia === undefined
        ? undefined
        : Number(raw.confianca_referencia),
  };
}

export function normalizarServicos(raw: LegacyServico[] | undefined | null): Servico[] {
  return (raw || [])
    .map(normalizarServico)
    .sort((a, b) => compareCodigoServico(extrairCodigoServico(a), extrairCodigoServico(b)));
}

export function encontrarServicoPorCodigoOuId(servicos: Servico[], idOuCodigo: string): number {
  return servicos.findIndex((servico) => {
    const codigo = extrairCodigoServico(servico as Servico & { id_servico?: string });
    return servico.id === idOuCodigo || codigo === idOuCodigo;
  });
}

export function servicoTemCodigoDuplicado(
  servicos: Servico[],
  codigo: string,
  idAtual?: string
): boolean {
  return servicos.some((servico) => {
    if (idAtual && servico.id === idAtual) {
      return false;
    }

    return extrairCodigoServico(servico as Servico & { id_servico?: string }) === codigo;
  });
}

export function etapaTemCategoriaDivergente(
  servicos: Servico[],
  codigo: string,
  categoria: string,
  idAtual?: string
): string | null {
  const partes = parseCodigoServico(codigo);
  if (!partes) {
    return null;
  }

  const divergente = servicos.find((servico) => {
    if (idAtual && servico.id === idAtual) {
      return false;
    }

    const codigoServico = extrairCodigoServico(servico as Servico & { id_servico?: string });
    const partesServico = parseCodigoServico(codigoServico);

    return (
      partesServico?.etapa === partes.etapa &&
      (servico.categoria || '').trim().toLowerCase() !== categoria.trim().toLowerCase()
    );
  });

  return divergente ? divergente.categoria || 'Sem categoria' : null;
}

export function agruparServicosPorEtapa(servicos: Servico[]) {
  const grupos = new Map<number, { categoria: string; servicos: Servico[] }>();

  servicos
    .slice()
    .sort((a, b) => compareCodigoServico(extrairCodigoServico(a), extrairCodigoServico(b)))
    .forEach((servico) => {
      const codigo = extrairCodigoServico(servico as Servico & { id_servico?: string });
      const partes = parseCodigoServico(codigo);
      const etapa = partes?.etapa;

      if (!etapa) {
        return;
      }

      const existente = grupos.get(etapa);
      if (existente) {
        existente.servicos.push(servico);
        return;
      }

      grupos.set(etapa, {
        categoria: servico.categoria || 'Sem categoria',
        servicos: [servico],
      });
    });

  return Array.from(grupos.entries())
    .sort(([a], [b]) => a - b)
    .map(([etapa, grupo]) => ({
      etapa,
      categoria: grupo.categoria,
      cabecalho: obterCabecalhoEtapa(etapa, grupo.categoria),
      servicos: grupo.servicos.sort((a, b) =>
        compareCodigoServico(extrairCodigoServico(a), extrairCodigoServico(b))
      ),
    }));
}

export function prepararServicoParaPersistencia(servico: Servico): ServicoPersistenciaPayload {
  const payload: ServicoPersistenciaPayload = {
    id: servico.id,
    codigo_servico: (servico.codigo_servico || extrairCodigoServico(servico as any) || '').trim(),
    nome: servico.nome,
    categoria: servico.categoria,
    avanco_atual: servico.avanco_atual,
    status: normalizarServicoStatus(servico.status, servico.avanco_atual),
    data_prevista: servico.data_prevista || null,
    data_conclusao: servico.data_conclusao || null,
    responsavel: servico.responsavel || null,
    equipe: servico.equipe || null,
    unidade: servico.unidade || null,
    quantidade: servico.quantidade ?? null,
    valor_unitario: servico.valor_unitario ?? null,
    valor_total: servico.valor_total ?? null,
    custo_mao_obra: servico.custo_mao_obra ?? null,
    custo_material: servico.custo_material ?? null,
  };

  if (servico.codigo_referencia?.trim()) {
    Object.assign(payload, { codigo_referencia: servico.codigo_referencia.trim() });
  }

  if (servico.origem_preco) {
    Object.assign(payload, { origem_preco: servico.origem_preco });
  }

  if (servico.origem_preco_detalhe) {
    Object.assign(payload, { origem_preco_detalhe: servico.origem_preco_detalhe });
  }

  if (servico.competencia_preco) {
    Object.assign(payload, { competencia_preco: servico.competencia_preco });
  }

  if (servico.fonte_preco) {
    Object.assign(payload, { fonte_preco: servico.fonte_preco });
  }

  if (servico.confianca_referencia !== null && servico.confianca_referencia !== undefined) {
    Object.assign(payload, { confianca_referencia: servico.confianca_referencia });
  }

  return payload;
}
