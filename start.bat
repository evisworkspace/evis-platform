@echo off
REM ============================================
REM EVIS AI - Script de Inicializacao (Windows)
REM ============================================

echo.
echo ========================================
echo   EVIS AI - Inicializando Sistema
echo ========================================
echo.

REM Verifica se estamos no diretório correto
if not exist "package.json" (
    echo [ERRO] package.json nao encontrado!
    echo Execute este script da raiz do projeto.
    pause
    exit /b 1
)

REM Verifica se Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Node.js nao encontrado!
    echo Instale Node.js de: https://nodejs.org
    pause
    exit /b 1
)

echo [1/3] Verificando dependencias...
if not exist "node_modules" (
    echo [INFO] Instalando dependencias...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERRO] Falha ao instalar dependencias
        pause
        exit /b 1
    )
)

echo [2/3] Iniciando Backend (porta 3001)...
start "EVIS Backend" cmd /k "npm run server"
timeout /t 3 /nobreak >nul

echo [3/3] Iniciando Frontend (porta 3000)...
start "EVIS Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo   Sistema Iniciado com Sucesso!
echo ========================================
echo.
echo   Backend:  http://localhost:3001
echo   Frontend: http://localhost:3000
echo.
echo   Pressione Ctrl+C nas janelas para parar
echo ========================================
echo.
pause
