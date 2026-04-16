#!/bin/bash
echo "════════════════════════════════════════════════════════════"
echo "  📊 STATUS DO PROJETO EVIS AI"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📍 Localização: $(pwd)"
echo "🌿 Branch: $(git branch --show-current)"
echo ""
echo "📦 Últimos commits:"
git log --oneline -3 --decorate
echo ""
echo "📝 Arquivos modificados (não commitados):"
git status --short || echo "   ✓ Nenhum"
echo ""
echo "🚀 Servidores:"
if netstat -ano | grep -q ":3001.*LISTEN"; then
  echo "   ✓ Backend rodando (porta 3001)"
else
  echo "   ✗ Backend parado"
fi
if netstat -ano | grep -q ":3000.*LISTEN"; then
  echo "   ✓ Frontend rodando (porta 3000)"
else
  echo "   ✗ Frontend parado"
fi
echo ""
echo "📚 Documentação da sessão atual:"
ls -1 docs/SESSAO_*.md 2>/dev/null | tail -2
echo ""
echo "════════════════════════════════════════════════════════════"
