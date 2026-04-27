import dotenv from 'dotenv';

let loaded = false;
const warnedLegacyVars = new Set<string>();

export function loadServerEnv() {
  if (loaded) {
    return;
  }

  dotenv.config({ override: true });
  loaded = true;
}

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function getServerEnv(name: string, legacyNames: string[] = []): string | undefined {
  loadServerEnv();

  const primary = readEnv(name);
  if (primary) {
    return primary;
  }

  for (const legacyName of legacyNames) {
    const legacyValue = readEnv(legacyName);
    if (!legacyValue) {
      continue;
    }

    if (!warnedLegacyVars.has(legacyName)) {
      warnedLegacyVars.add(legacyName);
      console.warn(
        `[Env] Variável legada detectada: ${legacyName}. Prefira ${name} no backend para evitar conflito com ambiente herdado.`
      );
    }

    return legacyValue;
  }

  return undefined;
}

export function hasServerEnv(name: string, legacyNames: string[] = []): boolean {
  return Boolean(getServerEnv(name, legacyNames));
}
