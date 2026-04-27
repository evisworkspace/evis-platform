import fs from 'fs';
import path from 'path';

export interface OrcamentoSessionState {
  projetoId: string;
  revisaoAtual: number;
  etapaAtiva: string;
  timestamp: string;
}

/**
 * Gerenciador de Estado Arquitetural do EVIS
 * Persiste o estado de orçamento em fragmentos independentes (Checkpoint Incremental).
 */
export class StateManager {
  private baseDir: string;

  constructor(workspaceId: string, rootDir: string) {
    this.baseDir = path.join(rootDir, workspaceId, 'state');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  // Grafo de Dependência: Define o que deve ser invalidado se uma etapa mudar
  private dependencyGraph: Record<string, string[]> = {
    'etapa0': ['1_planner', '2_quantitativos', '3_composicao', '4_auditoria'],
    'registry': ['0_reader', '1_planner', '2_quantitativos', '3_composicao', '4_auditoria'],
    '0_reader': ['1_planner', '2_quantitativos', '3_composicao', '4_auditoria'],
    '1_planner': ['2_quantitativos', '3_composicao', '4_auditoria'],
    '2_quantitativos': ['3_composicao', '4_auditoria'],
    '3_composicao': ['4_auditoria'],
    '4_auditoria': []
  };

  /**
   * Salva um fragmento de estado com escrita atômica (tmp → rename)
   */
  public saveFragment(etapa: string, data: any): void {
    const tempPath = path.join(this.baseDir, `stage_${etapa}.tmp`);
    const finalPath = path.join(this.baseDir, `stage_${etapa}.json`);

    const payload = {
      _metadata: {
        etapa,
        timestamp: new Date().toISOString(),
        version: '1.1',
        checksum: this.generateChecksum(data)
      },
      data
    };

    try {
      fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2), 'utf-8');
      fs.renameSync(tempPath, finalPath); // Escrita Atômica
      this.invalidateDownstream(etapa);
      this.updateSessionIndex(etapa);
      console.log(`[StateManager] ✅ Fragmento '${etapa}' consolidado.`);
    } catch (err) {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      throw new Error(`Falha na escrita atômica do fragmento ${etapa}: ${err}`);
    }
  }

  /**
   * Carrega um fragmento específico de estado
   */
  public loadFragment<T>(etapa: string): T | null {
    const filePath = path.join(this.baseDir, `stage_${etapa}.json`);
    if (fs.existsSync(filePath)) {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return content.data as T;
    }
    return null;
  }

  /**
   * Invalida em cascata baseado no Grafo de Dependência
   * Marca como .stale (não deleta, para manter histórico auditável)
   */
  private invalidateDownstream(etapa: string): void {
    const dependentes = this.dependencyGraph[etapa] || [];
    dependentes.forEach(dep => {
      const depPath = path.join(this.baseDir, `stage_${dep}.json`);
      if (fs.existsSync(depPath)) {
        fs.renameSync(depPath, depPath + '.stale');
        console.warn(`[StateManager] ⚠️ Fragmento ${dep} marcado como STALE (origem: ${etapa})`);
      }
    });
  }

  /**
   * Mantém o session_index.json como trilha de auditoria leve
   */
  private updateSessionIndex(ultimaEtapa: string): void {
    const indexPath = path.join(this.baseDir, 'session_index.json');
    let index: any = { history: [] };
    if (fs.existsSync(indexPath)) {
      try { index = JSON.parse(fs.readFileSync(indexPath, 'utf-8')); } catch { /* início limpo */ }
    }
    index.ultimaEtapa = ultimaEtapa;
    index.updatedAt = new Date().toISOString();
    if (!Array.isArray(index.history)) index.history = [];
    index.history.push({ etapa: ultimaEtapa, ts: index.updatedAt });
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8');
  }

  private generateChecksum(data: any): string {
    return Buffer.from(JSON.stringify(data)).toString('base64').slice(-10);
  }
}
