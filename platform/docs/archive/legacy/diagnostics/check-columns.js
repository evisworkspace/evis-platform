#!/usr/bin/env node

const SUPABASE_URL = "https://jwutiebpfauwzzltwgbb.supabase.co";
const SUPABASE_KEY = "[REDACTED_JWT_REMOVED]";

async function compareQueries() {
  console.log("🔍 Testando diferentes seleções de colunas...\n");

  const selectOptions = [
    { desc: "Sem select (tudo)", query: "?limit=1" },
    { desc: "Com select=*", query: "?select=*&limit=1" },
    { desc: "Com select simples", query: "?select=id,nome&limit=1" },
    { desc: "Com data_inicio,data_fim", query: "?select=id,data_inicio,data_fim&limit=1" },
    { desc: "Consulta do código (com categoria)", query: "?select=id,id_servico,nome,categoria,avanco_atual,status_atual,data_inicio,data_fim,equipe&limit=1" },
    { desc: "Sem categoria", query: "?select=id,id_servico,nome,avanco_atual,status_atual,data_inicio,data_fim,equipe&limit=1" },
  ];

  for (const opt of selectOptions) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/servicos${opt.query}`, {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
        },
      });
      
      const emoji = response.ok ? "✅" : "❌";
      console.log(`${emoji} ${opt.desc}: ${response.status}`);
      
      if (!response.ok && response.status === 400) {
        const text = await response.text();
        console.log(`   Error: ${text.substring(0, 80)}`);
      }
    } catch (e) {
      console.log(`❌ ${opt.desc}: NETWORK ERROR - ${e.message}`);
    }
  }

  console.log("\n\n📋 Testando com work_id em vez de id...\n");
  
  const workIdQueries = [
    "?select=work_id,name,status&limit=1",
    "?select=*&limit=1",
  ];

  for (const q of workIdQueries) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/servicos${q}`, {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
        },
      });
      console.log(`${response.ok ? "✅" : "❌"} Query ${q}: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          console.log("   Colunas presentes:", Object.keys(data[0]).join(", "));
        }
      }
    } catch (e) {
      console.log(`❌ Query ${q}: ERROR - ${e.message}`);
    }
  }
}

compareQueries();
