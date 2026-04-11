#!/usr/bin/env node
/**
 * Script de Diagnóstico: Verifica Schema e Configuração do Supabase
 */

const SUPABASE_URL = "https://jwutiebpfauwzzltwgbb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3dXRpZWJwZmF1d3p6bHR3Z2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MTYzOTIsImV4cCI6MjA5MTM5MjM5Mn0.KtzdQn2j1z4ugGFIyZgFDBfO--38FTBeKLT_RXMkflU";

async function checkSchema() {
  console.log("🔍 Verificando Schema do Supabase...\n");

  const expectedTables = [
    "obras",
    "servicos",
    "pendencias",
    "diario_obra",
    "notas",
    "fotos",
    "equipes_cadastro",
    "equipes_presenca",
  ];

  for (const table of expectedTables) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=1`, {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
        },
      });

      if (response.ok) {
        console.log(`✅ ${table}: EXISTS (status ${response.status})`);
      } else if (response.status === 404) {
        console.log(`❌ ${table}: NOT FOUND (404)`);
      } else if (response.status === 403) {
        console.log(`⚠️  ${table}: FORBIDDEN (403) - RLS problem?`);
      } else {
        console.log(`❌ ${table}: ERROR (${response.status})`);
      }
    } catch (e) {
      console.log(`❌ ${table}: NETWORK ERROR - ${e.message}`);
    }
  }

  console.log("\n📋 Testando query de servicos com parametro...\n");
  
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/servicos?obra_id=eq.test&limit=1`,
      {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    console.log(`servicos query: ${response.status}`);
    if (response.status === 400) {
      console.log("⚠️  Erro 400 - coluna 'obra_id' pode não existir ou query malformada");
    }
  } catch (e) {
    console.log("❌ Network error:", e.message);
  }
}

checkSchema();
