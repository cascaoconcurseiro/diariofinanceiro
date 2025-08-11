@echo off
title Teste de Comunicação - Diário Financeiro
color 0A

echo.
echo ========================================
echo    🧪 TESTE DE COMUNICAÇÃO
echo ========================================
echo.

echo 📋 Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js não está instalado!
    pause
    exit /b 1
)
echo ✅ Node.js está instalado

echo.
echo 🔧 Iniciando backend de teste...
cd backend
start "Backend Teste" cmd /k "node server-teste.js"

echo ⏳ Aguardando backend iniciar...
timeout /t 3 /nobreak >nul

echo.
echo 🌐 Iniciando frontend...
cd ..

echo.
echo ========================================
echo    🎉 TESTE INICIANDO!
echo ========================================
echo.
echo 🌐 Frontend: http://localhost:5173
echo 🔧 Backend:  http://localhost:3000
echo 🏥 Health:   http://localhost:3000/health
echo.
echo ⚠️  Não feche esta janela!
echo.

npm run dev

pause