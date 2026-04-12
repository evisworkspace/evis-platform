
const url = "https://jwutiebpfauwzzltwgbb.supabase.co/rest/v1/";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3dXRpZWJwZmF1d3p6bHR3Z2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MTYzOTIsImV4cCI6MjA5MTM5MjM5Mn0.KtzdQn2j1z4ugGFIyZgFDBfO--38FTBeKLT_RXMkflU";

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
