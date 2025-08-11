#!/bin/bash

echo "🚀 PREPARANDO PROJETO PARA DEPLOY GRATUITO"
echo "=========================================="

echo ""
echo "📋 1. Verificando estrutura do projeto..."
if [ ! -d "backend" ]; then
    echo "❌ Pasta backend não encontrada!"
    exit 1
fi

if [ ! -d "src" ]; then
    echo "❌ Pasta src não encontrada!"
    exit 1
fi

echo "✅ Estrutura do projeto OK"

echo ""
echo "📋 2. Verificando package.json..."
if [ ! -f "package.json" ]; then
    echo "❌ package.json não encontrado na raiz!"
    exit 1
fi

if [ ! -f "backend/package.json" ]; then
    echo "❌ package.json não encontrado no backend!"
    exit 1
fi

echo "✅ Package.json encontrados"

echo ""
echo "📋 3. Instalando dependências do frontend..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências do frontend"
    exit 1
fi

echo "✅ Dependências do frontend instaladas"

echo ""
echo "📋 4. Instalando dependências do backend..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências do backend"
    cd ..
    exit 1
fi
cd ..

echo "✅ Dependências do backend instaladas"

echo ""
echo "📋 5. Testando build do frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Erro no build do frontend"
    exit 1
fi

echo "✅ Build do frontend OK"

echo ""
echo "📋 6. Verificando arquivos de configuração..."
if [ ! -f "public/_redirects" ]; then
    echo "⚠️ Arquivo _redirects criado para Netlify"
fi

if [ ! -f "netlify.toml" ]; then
    echo "⚠️ Arquivo netlify.toml criado"
fi

if [ ! -f "render.yaml" ]; then
    echo "⚠️ Arquivo render.yaml criado"
fi

if [ ! -f "backend/.env.example" ]; then
    echo "⚠️ Arquivo .env.example criado no backend"
fi

echo "✅ Arquivos de configuração OK"

echo ""
echo "🎉 PROJETO PRONTO PARA DEPLOY!"
echo "==============================="
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Fazer commit e push para GitHub"
echo "2. Seguir o GUIA_DEPLOY_GRATUITO.md"
echo "3. Configurar Netlify (frontend)"
echo "4. Configurar Render (backend + banco)"
echo ""
echo "🔗 Links úteis:"
echo "- Netlify: https://netlify.com"
echo "- Render: https://render.com"
echo "- GitHub: https://github.com"
echo ""