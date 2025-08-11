#!/bin/bash

echo "🚀 Iniciando sistema de teste do Diário Financeiro..."

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker primeiro."
    exit 1
fi

# Copiar arquivo de ambiente se não existir
if [ ! -f .env ]; then
    echo "📄 Copiando arquivo .env..."
    cp .env.example .env
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Instalar dependências de teste
echo "🧪 Instalando dependências de teste..."
npm install axios colors

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down

# Iniciar Docker services
echo "🐳 Iniciando serviços Docker..."
docker-compose up -d

# Aguardar serviços iniciarem
echo "⏳ Aguardando serviços iniciarem..."
sleep 15

# Verificar se PostgreSQL está pronto
echo "🔍 Verificando PostgreSQL..."
until docker-compose exec -T postgres pg_isready -U diario_user -d diario_financeiro; do
    echo "Aguardando PostgreSQL..."
    sleep 2
done

# Executar migrações
echo "🗄️ Executando migrações do banco..."
npx prisma migrate dev --name init

# Gerar cliente Prisma
echo "⚙️ Gerando cliente Prisma..."
npx prisma generate

echo "✅ Sistema iniciado com sucesso!"
echo ""
echo "🧪 Para testar o sistema:"
echo "1. Execute: npm run dev (em outro terminal)"
echo "2. Execute: node test-system.js (para testes automatizados)"
echo "3. Ou use o arquivo test-login.http no VS Code"
echo ""
echo "📊 Para monitorar:"
echo "- Logs do servidor: npm run dev"
echo "- Logs do Docker: docker-compose logs -f"
echo "- Interface do banco: npx prisma studio"