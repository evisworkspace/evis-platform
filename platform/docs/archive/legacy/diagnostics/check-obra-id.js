#!/usr/bin/env node

const SUPABASE_URL = "https://jwutiebpfauwzzltwgbb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3dXRpZWJwZmF1d3p6bHR3Z2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MTYzOTIsImV4cCI6MjA5MTM5MjM5Mn0.KtzdQn2j1z4ugGFIyZgFDBfO--38FTBeKLT_RXMkflU";

async function checkUsedObraId() {
  console.log("🔍 Testando com obra_id dos testes: 3c7ade92-5078-4db3-996c-1390a9a2bb27\n");

  const testObraId = "3c7ade92-5078-4db3-996c-1390a9a2bb27";

  // Testa se existe obra com esse ID
  console.log("1️⃣  Verificando se obra existe...");
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/obras?id=eq.${testObraId}`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
    });
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Encontrada: ${data.length > 0 ? "SIM" : "NÃO"}`);
    if (data.length > 0) {
      console.log(`   Dados: ${JSON.stringify(data[0])}`);
    }
  } catch (e) {
    console.log(`   Erro: ${e.message}`);
  }

  // Testa query de servicos com essa obra_id
  console.log("\n2️⃣  Testando servicos com essa obra_id...");
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/servicos?obra_id=eq.${testObraId}&select=id,id_servico,nome,categoria,avanco_atual,status_atual,data_inicio,data_fim,equipe&limit=5`,
      {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    console.log(`   Status: ${response.status}`);
    if (response.ok) {
      const data = await response.json();
      console.log(`   Registros encontrados: ${data.length}`);
    } else {
      const text = await response.text();
      console.log(`   Erro: ${text}`);
    }
  } catch (e) {
    console.log(`   Erro: ${e.message}`);
  }

  // Lista todas as obras disponíveis
  console.log("\n3️⃣  Listando TODAS as obras disponíveis...");
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/obras?limit=10`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
    });
    const data = await response.json();
    console.log(`   Total: ${data.length}`);
    data.forEach((o, i) => {
      console.log(`   ${i+1}. ID: ${o.id} | Nome: ${o.nome || o.name || "N/A"}`);
    });
  } catch (e) {
    console.log(`   Erro: ${e.message}`);
  }
}

checkUsedObraId();
