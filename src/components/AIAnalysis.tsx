import React, { useState } from 'react';
import { processarDiarioOrchestrator } from '../lib/api';
import { Servico, Equipe, IAResult, Config } from '../types';

interface AIAnalysisProps {
  transcricao: string;
  servicos: Servico[];
  equipes: Equipe[];
  dataReferencia: string;
  config: Config;
  onResultado: (resultado: IAResult) => void;
  onLoading?: (isLoading: boolean) => void;
  onError?: (msg: string) => void;
}

/**
 * IA MAESTRA (Integração com Orquestrador Backend)
 *
 * Conecta o frontend com o orquestrador de 8 camadas no backend.
 * O backend processa: normalização → eventos → domínios → entidades →
 * ações → impactos → dispatch → HITL.
 */
export default function AIAnalysis({ 
  transcricao, 
  servicos, 
  equipes, 
  dataReferencia, 
  config,
  onResultado, 
  onLoading,
  onError 
}: AIAnalysisProps) {

  const runAnalysis = async () => {
    if (!transcricao.trim()) return;
    if (!config.obraId) {
      onError?.('Configure obra_id nas Configurações.');
      return;
    }

    onLoading?.(true);

    try {
      // Chama orquestrador backend (8 camadas)
      const resultado = await processarDiarioOrchestrator(
        transcricao,
        config.obraId,
        dataReferencia
      );

      // Adapta formato do orquestrador para o formato esperado pelo frontend
      const iaFinal: IAResult = {
        resumo: resultado.processamento?.hitl?.resumo || "Processamento concluído",
        narrativa: transcricao,

        // Extrai equipes resolvidas
        equipes_presentes: resultado.processamento?.entidades_resolvidas
          ?.filter((e: any) => e.tipo === 'equipe' && e.entidade_id)
          .map((e: any) => e.entidade_id) || [],

        // Extrai serviços das ações propostas
        servicos_atualizar: resultado.processamento?.acoes
          ?.filter((a: any) => a.dominio === 'orcamento' && a.tipo === 'atualizar_avanco')
          .map((a: any) => ({
            id_servico: a.entidade_id,
            avanco_novo: a.dados?.avanco_novo,
            status_novo: a.dados?.status_novo,
            data_prevista: a.dados?.data_prevista,
            data_conclusao: a.dados?.data_conclusao
          })) || [],

        // Extrai pendências das ações
        pendencias_novas: resultado.processamento?.acoes
          ?.filter((a: any) => a.dominio === 'pendencias')
          .map((a: any) => ({
            descricao: a.dados?.descricao || a.motivo,
            prioridade: a.dados?.prioridade || 'media'
          })) || [],

        pendencias_resolver: [],

        // Extrai notas das ações
        notas_adicionar: resultado.processamento?.acoes
          ?.filter((a: any) => a.dominio === 'notas')
          .map((a: any) => ({
            texto: a.dados?.conteudo || a.motivo,
            tipo: a.dados?.categoria || 'observacao'
          })) || []
      };

      onResultado(iaFinal);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      onError?.("Orquestrador falhou: " + msg);
    } finally {
      onLoading?.(false);
    }
  };

  return (
    <button 
      onClick={runAnalysis}
      className="px-2.5 py-1.5 rounded-md text-[11px] font-extrabold tracking-[0.05em] bg-brand-amber text-[#0a0d0a] hover:bg-[#f59e0b] transition-colors"
    >
      ★ Processar com IA
    </button>
  );
}
