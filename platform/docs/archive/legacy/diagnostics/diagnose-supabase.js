#!/usr/bin/env node
/**
 * Script de Diagnóstico: Verifica Schema e Configuração do Supabase
 */

const SUPABASE_URL = "https://jwutiebpfauwzzltwgbb.supabase.co";
const SUPABASE_KEY = "[REDACTED_JWT_REMOVED]";

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
