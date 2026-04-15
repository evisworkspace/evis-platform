#!/bin/bash
# ============================================
# EVIS AI - Script de Inicialização (Linux/Mac)
# ============================================

set -e  # Exit on error

echo ""
echo "========================================"
echo "  EVIS AI - Inicializando Sistema"
echo "========================================"
echo ""

# Verifica se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "[ERRO] package.json não encontrado!"
    echo "Execute este script da raiz do projeto."
    exit 1
fi

# Verifica se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "[ERRO] Node.js não encontrado!"
    echo "Instale Node.js de: https://nodejs.org"
    exit 1
fi

echo "[1/3] Verificando dependências..."
if [ ! -d "node_modules" ]; then
    echo "[INFO] Instalando dependências..."
    npm install
fi

echo "[2/3] Iniciando Backend (porta 3001)..."
npm run server > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend iniciado (PID: $BACKEND_PID)"
sleep 3

echo "[3/3] Iniciando Frontend (porta 3000)..."
npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend iniciado (PID: $FRONTEND_PID)"

echo ""
echo "========================================"
echo "  Sistema Iniciado com Sucesso!"
echo "========================================"
echo ""
echo "  Backend:  http://localhost:3001"
echo "  Frontend: http://localhost:3000"
echo ""
echo "  Backend PID:  $BACKEND_PID"
echo "  Frontend PID: $FRONTEND_PID"
echo ""
echo "  Logs:"
echo "    Backend:  logs/backend.log"
echo "    Frontend: logs/frontend.log"
echo ""
echo "  Para parar:"
echo "    kill $BACKEND_PID $FRONTEND_PID"
echo "========================================"
echo ""
