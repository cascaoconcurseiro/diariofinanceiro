#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "========================================"
echo "   🚀 DIÁRIO FINANCEIRO MULTIUSUÁRIO"
echo "========================================"
echo -e "${NC}"

echo -e "${BLUE}📋 Verificando pré-requisitos...${NC}"

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker não está rodando!${NC}"
    echo "   Por favor, inicie o Docker primeiro."
    exit 1
fi
echo -e "${GREEN}✅ Docker está rodando${NC}"

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não está instalado!${NC}"
    echo "   Por favor, instale o Node.js primeiro."
    exit 1
fi
echo -e "${GREEN}✅ Node.js está instalado${NC}"

echo ""
echo -e "${BLUE}🔧 Configurando backend...${NC}"
cd backend

# Copiar arquivo de ambiente se não existir
if [ ! -f .env ]; then
    echo -e "${YELLOW}📄 Copiando arquivo .env...${NC}"
    cp .env.example .env
fi

# Instalar dependências do backend
echo -e "${YELLOW}📦 Instalando dependências do backend...${NC}"
npm install > /dev/null 2>&1

# Parar containers existentes
echo -e "${YELLOW}🛑 Parando containers existentes...${NC}"
docker-compose down > /dev/null 2>&1

# Iniciar Docker services
echo -e "${YELLOW}🐳 Iniciando PostgreSQL e Redis...${NC}"
docker-compose up -d

# Aguardar serviços iniciarem
echo -e "${YELLOW}⏳ Aguardando serviços iniciarem...${NC}"
sleep 15

# Executar migrações
echo -e "${YELLOW}🗄️ Configurando banco de dados...${NC}"
npx prisma migrate dev --name init > /dev/null 2>&1

# Gerar cliente Prisma
echo -e "${YELLOW}⚙️ Gerando cliente Prisma...${NC}"
npx prisma generate > /dev/null 2>&1

# Criar usuários de teste
echo -e "${YELLOW}👥 Criando usuários de teste...${NC}"
npm run db:seed

echo ""
echo -e "${BLUE}🌐 Configurando frontend...${NC}"
cd ..

# Instalar dependências do frontend
echo -e "${YELLOW}📦 Instalando dependências do frontend...${NC}"
npm install > /dev/null 2>&1

echo ""
echo -e "${GREEN}"
echo "========================================"
echo "   ✅ CONFIGURAÇÃO CONCLUÍDA!"
echo "========================================"
echo -e "${NC}"
echo -e "${CYAN}🎯 USUÁRIOS DE TESTE CRIADOS:${NC}"
echo ""
echo -e "${GREEN}👤 João Silva${NC}"
echo "   Email: joao@teste.com"
echo "   Senha: MinhaSenh@123"
echo ""
echo -e "${GREEN}👤 Maria Santos${NC}"
echo "   Email: maria@teste.com"
echo "   Senha: OutraSenh@456"
echo ""
echo -e "${GREEN}👤 Pedro Costa${NC}"
echo "   Email: pedro@teste.com"
echo "   Senha: Pedro@789"
echo ""
echo "========================================"
echo ""

# Função para cleanup ao sair
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Parando serviços...${NC}"
    kill $BACKEND_PID 2>/dev/null
    cd backend
    docker-compose down > /dev/null 2>&1
    echo -e "${GREEN}✅ Serviços parados${NC}"
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT SIGTERM

# Iniciar backend em background
echo -e "${BLUE}🚀 Iniciando backend (porta 3000)...${NC}"
cd backend
npm run dev > backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Aguardar um pouco para o backend iniciar
sleep 5

# Iniciar frontend
echo -e "${BLUE}🌐 Iniciando frontend (porta 5173)...${NC}"
echo ""
echo -e "${GREEN}"
echo "========================================"
echo "   🎉 SITE INICIANDO!"
echo "========================================"
echo -e "${NC}"
echo -e "${CYAN}🌐 Frontend: http://localhost:5173${NC}"
echo -e "${CYAN}🔧 Backend:  http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}💡 Use as credenciais acima para fazer login${NC}"
echo ""
echo -e "${RED}⚠️  Pressione Ctrl+C para parar todos os serviços${NC}"
echo ""

# Iniciar frontend (mantém o script rodando)
npm run dev

# Se chegou aqui, o frontend foi fechado
cleanup