import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';

const router = Router();
const workspaceRoot = path.resolve(process.cwd());

function resolveWorkspacePath(inputPath: string): string {
  const fullPath = path.isAbsolute(inputPath) ? path.resolve(inputPath) : path.resolve(workspaceRoot, inputPath);
  const relative = path.relative(workspaceRoot, fullPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Path fora do workspace atual.');
  }
  return fullPath;
}

router.post('/run', async (req, res) => {
  const { cmd, args, cwd } = req.body ?? {};
  if (!cmd || !Array.isArray(args)) {
    return res.status(400).json({ error: 'Payload invalido. Informe cmd e args.' });
  }

  let resolvedCwd = workspaceRoot;
  try {
    if (cwd) {
      resolvedCwd = resolveWorkspacePath(String(cwd));
    }
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'cwd invalido.' });
  }

  const child = spawn(String(cmd), args.map((item: unknown) => String(item)), {
    cwd: resolvedCwd,
    shell: true,
  });

  let stdout = '';
  let stderr = '';

  child.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  child.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  child.on('close', (code) => {
    res.json({ exitCode: code ?? 0, stdout, stderr });
  });

  child.on('error', (error) => {
    res.status(500).json({ error: error.message, stdout, stderr });
  });
});

router.get('/read', async (req, res) => {
  const filePath = req.query.path;
  if (typeof filePath !== 'string' || !filePath.trim()) {
    return res.status(400).json({ error: 'Missing path' });
  }

  try {
    const fullPath = resolveWorkspacePath(filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    res.type('text/plain').send(content);
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return res.status(404).json({ error: 'File not found' });
    }
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Falha ao ler arquivo.' });
  }
});

router.post('/write', async (req, res) => {
  const filePath = req.body?.path;
  const content = req.body?.content;
  if (typeof filePath !== 'string' || !filePath.trim()) {
    return res.status(400).json({ error: 'Missing path' });
  }

  try {
    const fullPath = resolveWorkspacePath(filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, typeof content === 'string' ? content : String(content ?? ''), 'utf-8');
    res.json({ success: true, path: filePath });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Falha ao escrever arquivo.' });
  }
});

export default router;
