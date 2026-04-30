// This bridge provides the window.antigravity object if it's missing,
// communicating with our Express backend.

if (typeof window !== 'undefined' && !window.antigravity) {
  window.antigravity = {
    runCommand: async (config: { cmd: string; args: string[]; cwd?: string }) => {
      const response = await fetch('/api/antigravity/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!response.ok) throw new Error(`Run command failed: ${response.statusText}`);
      return response.json();
    },
    readFile: async (path: string) => {
      const response = await fetch(`/api/antigravity/read?path=${encodeURIComponent(path)}`);
      if (!response.ok) {
        let errorMessage = response.statusText;
        try {
          const body = await response.json();
          errorMessage = body.error || errorMessage;
        } catch {
          // Fallback to statusText
        }
        const error: any = new Error(`Read file failed: ${errorMessage}`);
        error.status = response.status;
        throw error;
      }
      return response.text();
    },
    writeFile: async (path: string, content: string) => {
      const response = await fetch('/api/antigravity/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, content }),
      });
      if (!response.ok) throw new Error(`Write file failed: ${response.statusText}`);
      return response.json();
    }
  };
}

export {};
