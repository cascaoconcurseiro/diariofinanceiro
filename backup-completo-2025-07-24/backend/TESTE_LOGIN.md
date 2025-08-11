# 🧪 Guia de Teste do Sistema de Login

Este guia te ajuda a testar o sistema de autenticação e multiusuário que implementamos.

## 📋 Pré-requisitos

1. **Docker instalado e rodando**
2. **Node.js e npm instalados**
3. **Extensão REST Client no VS Code** (opcional, mas recomendado)

## 🚀 Passo 1: Iniciar o sistema

```bash
# No diretório backend
cd backend

# Copiar arquivo de ambiente
cp .env.example .env

# Instalar dependências
npm install

# Iniciar Docker (PostgreSQL + Redis)
docker-compose up -d

# Aguardar alguns segundos para os serviços iniciarem
sleep 10

# Executar migrações do banco
npx prisma migrate dev

# Iniciar servidor
npm run dev
```

## 🧪 Passo 2: Executar testes

### Opção A - Script Automatizado (Recomendado):
```bash
# Instalar dependências de teste (se ainda não instalou)
npm install axios colors

# Executar testes automatizados
node test-system.js
```

### Opção B - REST Client (VS Code):
1. Instale a extensão "REST Client" no VS Code
2. Abra o arquivo `test-login.http` que criei
3. Clique em "Send Request" em cada teste
4. Substitua os tokens nos testes subsequentes pelos tokens recebidos

### Opção C - Curl (Terminal):
```bash
# 1. Health Check
curl http://localhost:3000/health

# 2. Registrar usuário
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"João Silva","email":"joao@teste.com","password":"MinhaSenh@123"}'

# 3. Fazer login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@teste.com","password":"MinhaSenh@123"}'

# 4. Testar rota protegida (substitua SEU_TOKEN pelo token recebido)
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer SEU_TOKEN"
```

## 📊 Passo 3: Verificar se está funcionando

✅ **Sinais de que está funcionando:**
- Health check retorna `{"status": "ok"}`
- Registro retorna tokens JWT
- Login retorna tokens JWT
- Rotas protegidas funcionam com Authorization header
- Script automatizado mostra todos os testes passando

❌ **Possíveis problemas:**
- Erro de conexão com banco → Verificar se Docker está rodando
- Erro de migração → Executar `npx prisma migrate reset`
- Erro de dependências → Executar `npm install`
- Porta 3000 ocupada → Mudar PORT no .env

## 🔒 Passo 4: Testar isolamento de dados

1. Registre dois usuários diferentes
2. Faça login com cada um
3. Crie transações para cada usuário
4. Verifique se cada usuário só vê suas próprias transações

O script automatizado já testa isso automaticamente!

## 🔧 Comandos úteis para debug:

```bash
# Ver logs do Docker
docker-compose logs postgres
docker-compose logs redis

# Verificar se serviços estão rodando
docker-compose ps

# Resetar banco de dados
npx prisma migrate reset

# Ver logs do servidor
npm run dev

# Verificar se porta está ocupada
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Linux/Mac

# Parar todos os containers
docker-compose down

# Reiniciar tudo do zero
docker-compose down -v
docker-compose up -d
npx prisma migrate dev
```

## 🎯 Resultados esperados

Quando tudo estiver funcionando, você deve ver:

1. **Health Check**: `{"status":"ok","timestamp":"...","uptime":...}`
2. **Registro**: `{"success":true,"message":"Usuário registrado com sucesso","data":{"user":{...},"tokens":{...}}}`
3. **Login**: `{"success":true,"message":"Login realizado com sucesso","data":{"user":{...},"tokens":{...}}}`
4. **Profile**: `{"success":true,"data":{"user":{...}}}`
5. **Transações**: Cada usuário vê apenas suas próprias transações

## 🚨 Solução de problemas comuns

### Erro "ECONNREFUSED"
- Docker não está rodando ou serviços não iniciaram
- Execute: `docker-compose up -d` e aguarde alguns segundos

### Erro "relation does not exist"
- Migrações não foram executadas
- Execute: `npx prisma migrate dev`

### Erro "Port 3000 already in use"
- Outra aplicação está usando a porta
- Mude PORT=3001 no arquivo .env

### Erro "Cannot connect to Redis"
- Redis não está rodando
- Execute: `docker-compose restart redis`

Quer que eu te ajude com algum erro específico ou está tudo funcionando? 🚀