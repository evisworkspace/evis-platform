
const url = "https://jwutiebpfauwzzltwgbb.supabase.co/rest/v1/";
const key = "[REDACTED_JWT_REMOVED]";

const tables = ['servicos', 'pendencias', 'diario_obra', 'notas', 'brain_narrativas', 'equipes_presenca'];

async function check() {
  for (const table of tables) {
    try {
      const res = await fetch(`${url}${table}?limit=1`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });
      if (res.ok) {
        console.log(`✅ Table '${table}' exists.`);
      } else {
        const err = await res.text();
        console.log(`❌ Table '${table}' error: ${res.status} - ${err}`);
      }
    } catch (e) {
      console.log(`❌ Table '${table}' failed: ${e.message}`);
    }
  }
}

check();
