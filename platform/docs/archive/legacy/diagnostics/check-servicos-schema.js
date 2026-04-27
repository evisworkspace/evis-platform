#!/usr/bin/env node

const SUPABASE_URL = "https://jwutiebpfauwzzltwgbb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3dXRpZWJwZmF1d3p6bHR3Z2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MTYzOTIsImV4cCI6MjA5MTM5MjM5Mn0.KtzdQn2j1z4ugGFIyZgFDBfO--38FTBeKLT_RXMkflU";

async function checkServicosColumns() {
  console.log("🔍 Verificando colunas da tabela 'servicos'...\n");

  // Tenta SELECT sem WHERE para pegar schema
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/servicos?limit=0`, {
      method: "GET",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Accept": "application/json",
      },
    });

    console.log(`Response status: ${response.status}`);
    
    // Pega os headers de resposta que contêm info de schema
    const contentRange = response.headers.get("content-range");
    const contentType = response.headers.get("content-type");
    
    console.log(`Content-Range: ${contentRange}`);
    console.log(`Content-Type: ${contentType}`);

    const data = await response.json();
    console.log("\nResposta JSON:", JSON.stringify(data, null, 2));
    
  } catch (e) {
    console.log("Network error:", e.message);
  }

  // Agora tenta uma query que deveria funcionar
  console.log("\n\n📋 Testando diferentes queries...\n");

  const testQueries = [
    "?limit=1",
    "?select=*&limit=1",
    "?obra_id=eq.3c7ade92-5078-4db3-996c-1390a9a2bb27&limit=1",
    "?id_obra=eq.3c7ade92-5078-4db3-996c-1390a9a2bb27&limit=1",
  ];

  for (const query of testQueries) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/servicos${query}`, {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
        },
      });
      console.log(`${query}: ${response.status}`);
    } catch (e) {
      console.log(`${query}: ERROR - ${e.message}`);
    }
  }
}

checkServicosColumns();
