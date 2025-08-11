@echo off
echo 🚀 PREPARANDO PROJETO PARA DEPLOY GRATUITO
echo ==========================================

echo.
echo 📋 1. Verificando estrutura do projeto...
if not exist "backend" (
    echo ❌ Pasta backend não encontrada!
    pause
    exit /b 1
)

if not exist "src" (
    echo ❌ Pasta src não encontrada!
    pause
    exit /b 1
)

echo ✅ Estrutura do projeto OK

echo.
echo 📋 2. Verificando package.json...
if not exist "package.json" (
    echo ❌ package.json não encontrado na raiz!
    pause
    exit /b 1
)

if not exist "backend\package.json" (
    echo ❌ package.json não encontrado no backend!
    pause
    exit /b 1
)

echo ✅ Package.json encontrados

echo.
echo 📋 3. Instalando dependências do frontend...
call npm install
if errorlevel 1 (
    echo ❌ Erro ao instalar dependências do frontend
    pause
    exit /b 1
)

echo ✅ Dependências do frontend instaladas

echo.
echo 📋 4. Instalando dependências do backend...
cd backend
call npm install
if errorlevel 1 (
    echo ❌ Erro ao instalar dependências do backend
    cd ..
    pause
    exit /b 1
)
cd ..

echo ✅ Dependências do backend instaladas

echo.
echo 📋 5. Testando build do frontend...
call npm run build
if errorlevel 1 (
    echo ❌ Erro no build do frontend
    pause
    exit /b 1
)

echo ✅ Build do frontend OK

echo.
echo 📋 6. Verificando arquivos de configuração...
if not exist "public\_redirects" (
    echo ⚠️ Arquivo _redirects criado para Netlify
)

if not exist "netlify.toml" (
    echo ⚠️ Arquivo netlify.toml criado
)

if not exist "render.yaml" (
    echo ⚠️ Arquivo render.yaml criado
)

if not exist "backend\.env.example" (
    echo ⚠️ Arquivo .env.example criado no backend
)

echo ✅ Arquivos de configuração OK

echo.
echo 🎉 PROJETO PRONTO PARA DEPLOY!
echo ===============================
echo.
echo 📋 PRÓXIMOS PASSOS:
echo 1. Fazer commit e push para GitHub
echo 2. Seguir o GUIA_DEPLOY_GRATUITO.md
echo 3. Configurar Netlify (frontend)
echo 4. Configurar Render (backend + banco)
echo.
echo 🔗 Links úteis:
echo - Netlify: https://netlify.com
echo - Render: https://render.com
echo - GitHub: https://github.com
echo.

pause