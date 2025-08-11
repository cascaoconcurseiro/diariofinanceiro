@echo off
echo 🚀 Iniciando sistema de teste do Diário Financeiro...

REM Verificar se Docker está rodando
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker não está rodando. Por favor, inicie o Docker primeiro.
    pause
    exit /b 1
)

REM Copiar arquivo de ambiente se não existir
if not exist .env (
    echo 📄 Copiando arquivo .env...
    copy .env.example .env
)

REM Instalar dependências
echo 📦 Instalando dependências...
npm install

REM Instalar dependências de teste
echo 🧪 Instalando dependências de teste...
npm install axios colors

REM Parar containers existentes
echo 🛑 Parando containers existentes...
docker-compose down

REM Iniciar Docker services
echo 🐳 Iniciando serviços Docker...
docker-compose up -d

REM Aguardar serviços iniciarem
echo ⏳ Aguardando serviços iniciarem...
timeout /t 15 /nobreak >nul

REM Executar migrações
echo 🗄️ Executando migrações do banco...
npx prisma migrate dev --name init

REM Gerar cliente Prisma
echo ⚙️ Gerando cliente Prisma...
npx prisma generate

echo ✅ Sistema iniciado com sucesso!
echo.
echo 🧪 Para testar o sistema:
echo 1. Execute: npm run dev (em outro terminal)
echo 2. Execute: node test-system.js (para testes automatizados)
echo 3. Ou use o arquivo test-login.http no VS Code
echo.
echo 📊 Para monitorar:
echo - Logs do servidor: npm run dev
echo - Logs do Docker: docker-compose logs -f
echo - Interface do banco: npx prisma studio
echo.
pause