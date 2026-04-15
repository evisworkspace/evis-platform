import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

/**
 * Hook para escutar atualizações em tempo real do Supabase
 * @param obraId ID da obra atual
 */
export function useRealtimeSync(obraId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!obraId) return;

    console.log(`[Realtime] Iniciando canal para obra: ${obraId}`);

    const channel = supabase
      .channel(`obra-updates-${obraId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'servicos', 
          filter: `obra_id=eq.${obraId}` 
        },
        () => {
          console.log('[Realtime] Mudança detectada em servicos, invalidando queries...');
          queryClient.invalidateQueries({ queryKey: ['servicos', obraId] });
        }
      )
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'diario_obra', 
          filter: `obra_id=eq.${obraId}` 
        },
        () => {
          console.log('[Realtime] Mudança detectada em diario_obra, invalidando queries...');
          queryClient.invalidateQueries({ queryKey: ['diario', obraId] });
        }
      )
      .subscribe();

    return () => {
      console.log(`[Realtime] Encerrando canal para obra: ${obraId}`);
      supabase.removeChannel(channel);
    };
  }, [obraId, queryClient]);
}
