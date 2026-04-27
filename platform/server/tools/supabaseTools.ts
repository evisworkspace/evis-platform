import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { getSemanaRelativaFormatada } from '../../skills/relative_weekly/calcular_semana';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ObraStatus {
  servicos_em_andamento: any[];
  equipes_presentes: any[];
  pendencias_abertas: any[];
  semana_relativa: string;
}

/**
 * Retorna o estado completo da obra para dar contexto à IA
 */
export async function getStatusObraHoje(obra_id: string, data: string): Promise<ObraStatus> {
  // 1. Buscar serviços ativos
  const { data: servicos } = await supabase
    .from('servicos')
    .select('*')
    .eq('obra_id', obra_id)
    .neq('status', 'concluido');

  // 2. Buscar equipes cadastradas
  const { data: equipes } = await supabase
    .from('equipes_cadastro')
    .select('*')
    .eq('obra_id', obra_id);

  // 3. Buscar pendências
  const { data: pendencias } = await supabase
    .from('pendencias')
    .select('*')
    .eq('obra_id', obra_id)
    .eq('resolvido', false);

  // 4. Buscar data de início da obra (para calcular semana)
  // Assumindo que a data de início está na tabela 'obras' ou no primeiro serviço
  const { data: obra } = await supabase
    .from('obras')
    .select('data_inicio')
    .eq('id', obra_id)
    .single();

  const dataInicio = obra?.data_inicio || '2026-01-01'; // Fallback
  const semana_relativa = getSemanaRelativaFormatada(dataInicio, data);

  return {
    servicos_em_andamento: servicos || [],
    equipes_presentes: equipes || [],
    pendencias_abertas: pendencias || [],
    semana_relativa
  };
}
