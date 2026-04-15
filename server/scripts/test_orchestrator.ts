import * as dotenv from 'dotenv';
dotenv.config({ path: '../.env' }); // carrega dotenv antes

import { processarDia, ObraContexto, EntradaDia } from '../agents/orchestrator';
import { supabase } from '../tools/supabaseTools';

async function main() {
  console.log("=== INICIANDO TESTE DO ORQUESTRADOR SEMÂNTICO (PASSO 6) ===");

  // Pegar a primeira obra para contexto (vamos usar a do banco)
  const { data: obras } = await supabase.from('obras').select('id').limit(1);
  if (!obras || obras.length === 0) {
    console.log("Nenhuma obra encontrada no banco!");
    return;
  }
  
  const obra_id = obras[0].id;
  const data_referencia = new Date().toISOString().split('T')[0];

  const contexto: ObraContexto = {
    obra_id,
    data_referencia,
    status_atual: { semana_relativa: "Semana 12" } // mock
  };

  const narrativaTeste = `
    Hoje o pessoal da marcenaria veio e instalou os móveis da cozinha.
    A bancada da churrasqueira também foi assentada.
    Faltou rejunte, vou pedir amanhã.
    Cliente passou e pediu para mudar a torneira da pia.
  `;

  const entradas: EntradaDia[] = [
    { tipo: 'texto', conteudo: narrativaTeste }
  ];

  try {
    const resultado = await processarDia(entradas, contexto);
    console.log("\n=== RESULTADO DO PROCESSAMENTO (ProcessamentoOrquestrador) ===\n");
    console.dir(resultado, { depth: null, colors: true });
  } catch (error) {
    console.error("Erro processando dia:", error);
  }
}

main();
