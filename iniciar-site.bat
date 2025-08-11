@echo off
title Diário Financeiro - Inicializador
color 0A

echo.
echo ========================================
echo    🚀 DIÁRIO FINANCEIRO MULTIUSUÁRIO
echo ========================================
echo.

echo 📋 Verificando pré-requisitos...

REM Verificar se Docker está rodando
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker não está rodando!
    echo    Por favor, inicie o Docker Desktop primeiro.
    echo.
    pause
    exit /b 1
)
echo ✅ Docker está rodando

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js não está instalado!
    echo    Por favor, instale o Node.js primeiro.
    echo.
    pause
    exit /b 1
)
echo ✅ Node.js está instalado

echo.
echo 🔧 Configurando backend...
cd backend

REM Copiar arquivo de ambiente se não existir
if not exist .env (
    echo 📄 Copiando arquivo .env...
    copy .env.example .env >nul
)

REM Instalar dependências do backend
echo 📦 Instalando dependências do backend...
call npm install >nul 2>&1

REM Parar containers existentes
echo 🛑 Parando containers existentes...
docker-compose down >nul 2>&1

REM Iniciar Docker services
echo 🐳 Iniciando PostgreSQL e Redis...
docker-compose up -d

REM Aguardar serviços iniciarem
echo ⏳ Aguardando serviços iniciarem...
timeout /t 15 /nobreak >nul

REM Executar migrações
echo 🗄️ Configurando banco de dados...
call npx prisma migrate dev --name init >nul 2>&1

REM Gerar cliente Prisma
echo ⚙️ Gerando cliente Prisma...
call npx prisma generate >nul 2>&1

REM Criar usuários de teste
echo 👥 Criando usuários de teste...
call npm run db:seed

echo.
echo 🌐 Configurando frontend...
cd ..

REM Instalar dependências do frontend
echo 📦 Instalando dependências do frontend...
call npm install >nul 2>&1

echo.
echo ========================================
echo    ✅ CONFIGURAÇÃO CONCLUÍDA!
echo ========================================
echo.
echo 🎯 USUÁRIOS DE TESTE CRIADOS:
echo.
echo 👤 João Silva
echo    Email: joao@teste.com
echo    Senha: MinhaSenh@123
echo.
echo 👤 Maria Santos  
echo    Email: maria@teste.com
echo    Senha: OutraSenh@456
echo.
echo 👤 Pedro Costa
echo    Email: pedro@teste.com
echo    Senha: Pedro@789
echo.
echo ========================================
echo.

REM Iniciar backend em nova janela
echo 🚀 Iniciando backend (porta 3000)...
start "Backend - Diário Financeiro" cmd /k "cd backend && npm run dev"

REM Aguardar um pouco para o backend iniciar
timeout /t 5 /nobreak >nul

REM Iniciar frontend
echo 🌐 Iniciando frontend (porta 5173)...
echo.
echo ========================================
echo    🎉 SITE INICIANDO!
echo ========================================
echo.
echo 🌐 Frontend: http://localhost:5173
echo 🔧 Backend:  http://localhost:3000
echo.
echo 💡 Use as credenciais acima para fazer login
echo.
echo ⚠️  Não feche esta janela!
echo    O frontend está rodando aqui.
echo.

REM Iniciar frontend (mantém a janela aberta)
npm run dev

echo.
echo ========================================
echo    👋 OBRIGADO POR USAR!
echo ========================================
pause