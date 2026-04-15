const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const obraId = '3c7ade92-5078-4db3-996c-1390a9a2bb27';

  console.log('--- ETAPA 1: INSERIR EQUIPES ---');
  const teams = [
    { cod: 'EQ-FRG-01', nome: 'Domínio Refrigeração', funcao: 'Câmara Fria / Rede Frigorífica', contato: 'Claudinei', status: 'ativo', ativo: true, obra_id: obraId },
    { cod: 'EQ-LIM-01', nome: '[Limpeza]', funcao: 'Limpeza', contato: '', status: 'ativo', ativo: true, obra_id: obraId }
  ];

  for (const team of teams) {
    const { error } = await supabase.from('equipes_cadastro').insert([team]);
    if (error) console.error(`Erro ao inserir ${team.cod}:`, error.message);
    else console.log(`Equipe ${team.cod} inserida.`);
  }

  console.log('\n--- ETAPA 2: ATUALIZAR DATAS ---');
  const updates = [
    { id: 'SRV-001', start: '2026-03-09', end: '2026-03-11' },
    { id: 'SRV-002', start: '2026-03-09', end: '2026-03-10' },
    { id: 'SRV-003', start: '2026-03-09', end: '2026-03-10' },
    { id: 'SRV-004', start: '2026-03-09', end: '2026-03-11' },
    { id: 'SRV-005', start: '2026-03-10', end: '2026-03-12' },
    { id: 'SRV-006', start: '2026-03-10', end: '2026-03-12' },
    { id: 'SRV-007', start: '2026-03-12', end: '2026-03-14' },
    { id: 'SRV-008', start: '2026-03-12', end: '2026-03-13' },
    { id: 'SRV-009', start: '2026-03-13', end: '2026-03-18' },
    { id: 'SRV-010', start: '2026-03-13', end: '2026-03-17' },
    { id: 'SRV-011', start: '2026-03-13', end: '2026-03-17' },
    { id: 'SRV-012', start: '2026-03-16', end: '2026-03-18' },
    { id: 'SRV-013', start: '2026-03-18', end: '2026-03-20' },
    { id: 'SRV-014', start: '2026-03-23', end: '2026-03-28' },
    { id: 'SRV-015', start: '2026-03-23', end: '2026-03-24' },
    { id: 'SRV-016', start: '2026-03-24', end: '2026-03-25' },
    { id: 'SRV-017', start: '2026-03-24', end: '2026-03-26' },
    { id: 'SRV-018', start: '2026-03-20', end: '2026-03-25' },
    { id: 'SRV-019', start: '2026-03-25', end: '2026-03-27' },
    { id: 'SRV-020', start: '2026-03-28', end: '2026-04-11' },
    { id: 'SRV-021', start: '2026-03-26', end: '2026-03-27' },
    { id: 'SRV-022', start: '2026-03-27', end: '2026-03-28' },
    { id: 'SRV-023', start: '2026-03-28', end: '2026-03-29' },
    { id: 'SRV-024', start: '2026-03-28', end: '2026-03-30' },
    { id: 'SRV-025', start: '2026-03-30', end: '2026-04-11' },
    { id: 'SRV-026', start: '2026-03-30', end: '2026-04-11' },
    { id: 'SRV-027', start: '2026-03-30', end: '2026-04-11' },
    { id: 'SRV-028', start: '2026-03-28', end: '2026-03-30' },
    { id: 'SRV-029', start: '2026-03-30', end: '2026-04-11' },
    { id: 'SRV-030', start: '2026-03-30', end: '2026-04-02' },
    { id: 'SRV-031', start: '2026-04-01', end: '2026-04-11' },
    { id: 'SRV-032', start: '2026-04-01', end: '2026-04-11' },
    { id: 'SRV-033', start: '2026-04-03', end: '2026-04-11' },
    { id: 'SRV-034', start: '2026-04-06', end: '2026-04-11' },
    { id: 'SRV-035', start: '2026-04-06', end: '2026-04-11' },
    { id: 'SRV-036', start: '2026-04-07', end: '2026-04-11' },
    { id: 'SRV-037', start: '2026-04-07', end: '2026-04-11' },
    { id: 'SRV-038', start: '2026-04-08', end: '2026-04-11' },
    { id: 'SRV-039', start: '2026-04-08', end: '2026-04-11' },
    { id: 'SRV-040', start: '2026-04-08', end: '2026-04-11' },
    { id: 'SRV-041', start: '2026-04-09', end: '2026-04-11' },
    { id: 'SRV-042', start: '2026-04-10', end: '2026-04-11' },
    { id: 'SRV-043', start: '2026-04-10', end: '2026-04-11' },
    { id: 'SRV-044', start: '2026-04-04', end: '2026-04-11' },
    { id: 'SRV-045', start: '2026-04-06', end: '2026-04-11' },
    { id: 'SRV-046', start: '2026-04-06', end: '2026-04-11' },
    { id: 'SRV-047', start: '2026-04-06', end: '2026-04-11' },
    { id: 'SRV-048', start: '2026-04-07', end: '2026-04-11' },
    { id: 'SRV-049', start: '2026-04-09', end: '2026-04-11' },
    { id: 'SRV-050', start: '2026-04-11', end: '2026-04-11' },
    { id: 'SRV-051', start: '2026-04-11', end: '2026-04-11' }
  ];

  for (const update of updates) {
    const { error } = await supabase
      .from('servicos')
      .update({ data_prevista: update.start, data_conclusao: update.end })
      .eq('id_servico', update.id)
      .eq('obra_id', obraId);

    if (error) console.error(`Erro ao atualizar ${update.id}:`, error.message);
    else console.log(`Serviço ${update.id} atualizado.`);
  }

  console.log('\n--- VERIFICAÇÃO FINAL ---');
  const { data: finalTeams } = await supabase.from('equipes_cadastro').select('cod, nome').order('cod');
  console.log('Equipes Cadastradas:', finalTeams.map(t => t.cod).join(', '));

  const { data: finalServicos } = await supabase
    .from('servicos')
    .select('id_servico, data_prevista, data_conclusao')
    .eq('obra_id', obraId)
    .order('data_prevista', { ascending: true });
  
  console.log('Total de serviços com datas:', finalServicos.filter(s => s.data_prevista).length);
}

run();
