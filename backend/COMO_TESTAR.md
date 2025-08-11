# 🚀 Como Testar o Sistema - Guia Rápido

## ⚡ Início Rápido (Recomendado)

### Windows:
```bash
# No diretório backend
cd backend
quick-start.bat
```

### Linux/Mac:
```bash
# No diretório backend
cd backend
chmod +x quick-start.sh
./quick-start.sh
```

## 🧪 Executar Testes

### 1. Iniciar o servidor (em um terminal):
```bash
npm run dev
```

### 2. Executar testes automatizados (em outro terminal):
```bash
node test-system.js
```

## ✅ O que você deve ver se tudo estiver funcionando:

```
🧪 Iniciando testes do sistema...

✅ PASS Health Check
✅ PASS User Registration
✅ PASS User Login
✅ PASS Protected Route (Profile)
✅ PASS Create Transaction
✅ PASS List Transactions
✅ PASS Data Isolation

📊 Resumo dos testes:
✅ Passou: 7
❌ Falhou: 0
📈 Total: 7

🎉 Todos os testes passaram! Sistema funcionando corretamente.
```

## 🔧 Se algo der errado:

### Erro de conexão:
```bash
# Verificar se Docker está rodando
docker ps

# Reiniciar serviços
docker-compose down
docker-compose up -d
```

### Erro de migração:
```bash
# Resetar banco
npx prisma migrate reset
npx prisma migrate dev
```

### Erro de dependências:
```bash
# Reinstalar
rm -rf node_modules
npm install
```

## 📱 Testar manualmente (opcional):

Use o arquivo `test-login.http` no VS Code com a extensão REST Client, ou use curl:

```bash
# 1. Health check
curl http://localhost:3000/health

# 2. Registrar usuário
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"João","email":"joao@teste.com","password":"MinhaSenh@123"}'

# 3. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@teste.com","password":"MinhaSenh@123"}'
```

## 🎯 Funcionalidades testadas:

- ✅ Registro de usuário com validação de senha
- ✅ Login com JWT tokens
- ✅ Autenticação em rotas protegidas
- ✅ Criação de transações
- ✅ Listagem de transações
- ✅ Isolamento de dados entre usuários
- ✅ Rate limiting
- ✅ Logs de segurança
- ✅ Sessões no Redis

## 🚨 Problemas comuns:

| Erro | Solução |
|------|---------|
| `ECONNREFUSED` | Docker não está rodando |
| `relation does not exist` | Execute `npx prisma migrate dev` |
| `Port 3000 already in use` | Mude PORT no .env ou mate o processo |
| `Cannot connect to Redis` | Execute `docker-compose restart redis` |

## 📞 Suporte:

Se ainda tiver problemas, verifique:
1. Docker está rodando: `docker ps`
2. Serviços estão up: `docker-compose ps`
3. Logs do servidor: `npm run dev`
4. Logs do Docker: `docker-compose logs`

**Sistema pronto para produção!** 🎉