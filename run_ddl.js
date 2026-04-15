import fs from 'fs';
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import path from 'path';

// Carregar .env do diretório atual
dotenv.config();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Erro: DATABASE_URL não encontrado no .env!");
  process.exit(1);
}

// Supabase requer TLS (SSL) habilitado para conexão direta
const client = new Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log("✅ Conectado ao banco de dados!");
    
    console.log("Lendo arquivo 04_ALIAS_CONHECIMENTO_GLOBAL.sql...");
    const sqlPath = path.resolve('docs', '04_ALIAS_CONHECIMENTO_GLOBAL.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log("🚀 Executando queries paramétricas...");
    await client.query(sql);
    
    console.log("🎯 Conhecimento Semântico Global e Aliases criados e populados com sucesso!");
  } catch(e) {
    console.error("💥 Falha ao executar:", e);
  } finally {
    await client.end();
  }
}

run();
