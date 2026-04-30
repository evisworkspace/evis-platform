import React from 'react';

export function MarkdownRenderer({ texto }: { texto: string }) {
  const html = React.useMemo(() => {
    // Implementação robusta de Markdown para relatórios de engenharia
    let out = texto
      .replace(/^### (.+)/gm, '<h3 class="oc-h3">$1</h3>')
      .replace(/^## (.+)/gm, '<h2 class="oc-h2">$1</h2>')
      .replace(/^# (.+)/gm, '<h1 class="oc-h1">$1</h1>')
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="oc-code">$1</code>')
      .replace(/^⚠️ \*\*(.+)\*\*/gm, '<div class="oc-warn">⚠️ $1</div>')
      .replace(/^✅ \*\*(.+)\*\*/gm, '<div class="oc-ok">✅ $1</div>')
      .replace(/^---+$/gm, '<hr class="oc-hr">')
      .replace(/\n/g, '<br>');

    // Tabelas Técnicas
    out = out.replace(/(\|.+\|(<br>)?)+/g, (block) => {
      const linhas = block.split('<br>').filter((l) => l.trim().startsWith('|'));
      if (linhas.length < 2) return block;
      const cabecalho = linhas[0].split('|').filter((c) => c.trim());
      const corpo = linhas.slice(2);
      let tabela = '<div class="oc-table-wrap"><table class="oc-table"><thead><tr>';
      tabela += cabecalho.map((c) => `<th>${c.trim()}</th>`).join('');
      tabela += '</tr></thead><tbody>';
      for (const linha of corpo) {
        const cels = linha.split('|').filter((c) => c.trim());
        if (cels.length === 0) continue;
        tabela += '<tr>' + cels.map((c) => `<td>${c.trim()}</td>`).join('') + '</tr>';
      }
      tabela += '</tbody></table></div>';
      return tabela;
    });

    return out;
  }, [texto]);

  return <div className="oc-markdown" dangerouslySetInnerHTML={{ __html: html }} />;
}
