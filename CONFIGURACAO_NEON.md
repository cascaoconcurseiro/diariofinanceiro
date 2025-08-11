# 🚀 Configuração Neon.tech Database

## 📋 Passo a Passo Completo

### 1. Criar Conta no Neon.tech

1. **Acesse**: https://neon.tech
2. **Clique em "Sign Up"**
3. **Use sua conta GitHub** (recomendado)
4. **Crie um novo projeto**:
   - Nome: `diario-financeiro`
   - Região: `US East (Ohio)` (mais próxima do Brasil)
   - PostgreSQL Version: `15` (padrão)

### 2. Obter String de Conexão

1. **No Dashboard do projeto**, clique em **"Connection Details"**
2. **Copie a "Connection String"** (formato):
```
postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 3. Configurar no Projeto

**Opção A: Script Automático (Recomendado)**
```bash
cd backend
node setup-neon.js "sua-string-de-conexao-aqui"
```

**Opção B: Manual**
1. Abra `backend/.env.local`
2. Substitua a linha `DATABASE_URL=` pela sua string do Neon
3. Adicione `DIRECT_URL=` com a mesma string

### 4. Executar Migração

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
```

### 5. Testar Conexão

```bash
# Iniciar servidor
npm run dev

# Em outro terminal, testar
curl http://localhost:3000/api/health/database
```

## 🔍 Verificação de Sucesso

Se tudo funcionou, você verá:
```json
{
  "status": "connected",
  "connection": {
    "connected": true,
    "latency": 45,
    "provider": "postgresql",
    "database": "neondb"
  },
  "isNeon": true
}
```

## 🌐 Configuração no Netlify

### Para Deploy Automático:

1. **No Netlify Dashboard**:
   - Vá em **Site Settings** → **Environment Variables**
   - Adicione:
     - `DATABASE_URL`: sua string do Neon
     - `DIRECT_URL`: mesma string do Neon

2. **Integração Neon + Netlify**:
   - No Neon Dashboard, vá em **Integrations**
   - Clique em **Netlify**
   - Conecte sua conta e selecione o site
   - Isso configurará automaticamente as variáveis

## 💡 Vantagens do Neon.tech

### ✅ **Tier Gratuito Generoso**
- **3 GB** de storage
- **100 horas** de compute por mês
- **Branching** ilimitado
- **Backup** automático

### ✅ **Performance Superior**
- **Serverless**: Escala automaticamente
- **Edge**: Baixa latência global
- **Connection Pooling**: Otimização automática
- **Point-in-time Recovery**: Backup preciso

### ✅ **Recursos Avançados**
- **Database Branching**: Como Git para dados
- **Time Travel**: Consultas históricas
- **Auto-scaling**: Compute sob demanda
- **Monitoring**: Métricas detalhadas

## 🔧 Comandos Úteis

```bash
# Verificar status da conexão
curl http://localhost:3000/api/health

# Ver estatísticas do banco
curl http://localhost:3000/api/health/database/stats

# Resetar banco (cuidado!)
npx prisma db push --force-reset

# Ver logs do Prisma
npx prisma studio
```

## 🆘 Troubleshooting

### ❌ **Erro: "Connection refused"**
- Verifique se a string de conexão está correta
- Confirme se o projeto Neon está ativo
- Teste conectividade: `ping ep-xxx.neon.tech`

### ❌ **Erro: "SSL required"**
- Certifique-se que a string contém `?sslmode=require`
- Neon sempre requer SSL

### ❌ **Erro: "Database not found"**
- Verifique o nome do banco na string
- Padrão é `neondb`, mas pode ser diferente

### ❌ **Erro: "Too many connections"**
- Neon tem limite de conexões simultâneas
- Use connection pooling (já configurado)

## 📊 Monitoramento

### Dashboard Neon.tech
- **Compute Hours**: Uso mensal
- **Storage**: Espaço utilizado
- **Connections**: Conexões ativas
- **Queries**: Performance das consultas

### Endpoints de Monitoramento
- `GET /api/health` - Status geral
- `GET /api/health/database` - Status do banco
- `GET /api/health/database/stats` - Estatísticas detalhadas

## 🎯 Próximos Passos

Após configurar o Neon.tech:

1. ✅ **Conexão configurada**
2. 🔄 **Migrar dados existentes** (próxima tarefa)
3. 🔄 **Implementar sincronização**
4. 🔄 **Configurar cache inteligente**
5. 🔄 **Deploy em produção**

---

**🎉 Parabéns!** Seu diário financeiro agora usa um banco PostgreSQL profissional com backup automático e sincronização entre dispositivos!