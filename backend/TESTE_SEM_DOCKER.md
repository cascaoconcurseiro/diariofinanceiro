# 🚀 Teste Rápido Sem Docker

Se você está tendo problemas com o Docker, pode testar o sistema usando SQLite temporariamente.

## Passo 1: Configurar SQLite

1. **Instalar dependências:**
```bash
npm install sqlite3 @types/sqlite3
```

2. **Criar arquivo .env.test:**
```env
# Configuração para teste sem Docker
DATABASE_URL="file:./test.db"
JWT_SECRET="test-jwt-secret-123"
JWT_REFRESH_SECRET="test-refresh-secret-456"
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Redis desabilitado para teste
REDIS_DISABLED=true
```

3. **Atualizar schema.prisma temporariamente:**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

## Passo 2: Executar

```bash
# Usar arquivo de ambiente de teste
cp .env.test .env

# Gerar cliente Prisma
npx prisma generate

# Executar migrações
npx prisma migrate dev --name init

# Iniciar servidor
npm run dev
```

## Passo 3: Testar

Agora você pode usar o arquivo `test-login.http` normalmente!

## ⚠️ Importante

Este é apenas para teste. Para produção, use PostgreSQL com Docker.

## Voltar ao Docker

Quando conseguir rodar o Docker:

1. Restaure o .env original
2. Restaure o schema.prisma original  
3. Execute `docker-compose up -d`
4. Execute `npx prisma migrate dev`