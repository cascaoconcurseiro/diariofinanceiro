@echo off
echo ========================================
echo    🔧 DIÁRIO FINANCEIRO - MODO STANDALONE
echo ========================================
echo.

echo 🚀 Iniciando sistema em modo standalone...
echo ℹ️  Este modo não requer Docker ou backend
echo.

REM Verifica se Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado!
    echo    Por favor, instale o Node.js primeiro.
    echo    Download: https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js encontrado
echo.

REM Verifica se as dependências estão instaladas
if not exist "node_modules" (
    echo 📦 Instalando dependências...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Erro ao instalar dependências
        pause
        exit /b 1
    )
    echo ✅ Dependências instaladas
    echo.
)

echo 🌐 Configurando modo standalone...

REM Configura variáveis de ambiente para modo standalone
set REACT_APP_MODE=standalone
set REACT_APP_API_URL=http://localhost:3001
set PORT=5173

echo ✅ Configuração concluída
echo.

echo 🚀 Iniciando servidor de desenvolvimento...
echo.
echo 📊 URLs disponíveis:
echo    Frontend: http://localhost:5173
echo    API Local: http://localhost:3001
echo.
echo 👥 Usuários de teste:
echo    📧 joao@teste.com   - 🔑 MinhaSenh@123
echo    📧 maria@teste.com  - 🔑 OutraSenh@456  
echo    📧 pedro@teste.com  - 🔑 Pedro@789
echo.
echo ⚠️  MODO STANDALONE ATIVO
echo    - Dados salvos no navegador
echo    - Não requer Docker
echo    - Funcionalidade completa
echo.
echo 🛑 Para parar: Ctrl + C
echo ========================================
echo.

REM Inicia o servidor de desenvolvimento
npm start

pause