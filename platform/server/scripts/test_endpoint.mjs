// Test orchestrator endpoint
const response = await fetch('http://localhost:3001/api/diario/processar-diario', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    transcricao: 'Hoje instalou o forro',
    obra_id: '3c7ade92-5078-4db3-996c-1390a9a2bb27',
    data_referencia: '2026-04-15'
  })
});

const data = await response.json();
console.log(JSON.stringify(data, null, 2));
