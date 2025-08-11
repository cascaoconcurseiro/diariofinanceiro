# 🚀 Deploy Netlify + Neon.tech - Projeto Existente

[![Netlify Status](https://api.netlify.com/api/v1/badges/a45da6df-8890-495f-a358-76b48066f7a6/deploy-status)](https://app.netlify.com/projects/diariofinanceirooficial/deploys)

## 📋 **CONFIGURAÇÃO COMPLETA**

### **ETAPA 1: Configurar Variáveis de Ambiente no Netlify**

1. **Acesse seu projeto**: https://app.netlify.com/projects/diariofinanceirooficial
2. **Vá em**: Site Settings → Environment Variables
3. **Adicione estas variáveis**:

```bash
# Neon.tech Database
DATABASE_URL=postgresql://neondb_owner:npg_kfC0loKWmOa9@ep-damp-mountain-adskjhfm-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

DIRECT_URL=postgresql://neondb_owner:npg_kfC0loKWmOa9@ep-damp-mountain-adskjhfm-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# JWT Secrets
JWT_SECRET=prod-jwt-secret-super-secure-2024
JWT_REFRESH_SECRET=prod-refresh-secret-ultra-secure-2024
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Server Config
NODE_ENV=production
PORT=8888
FRONTEND_URL=https://diariofinanceirooficial.netlify.app

# Security
BCRYPT_ROUNDS=12

# Logging
LOG_LEVEL=info
```

### **ETAPA 2: Configurar Build Settings**

No Netlify Dashboard:
1. **Site Settings** → **Build & Deploy**
2. **Build Settings**:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`

### **ETAPA 3: Integração Neon.tech + Netlify (AUTOMÁTICA)**

1. **No Neon.tech Dashboard**: https://console.neon.tech
2. **Vá em**: Integrations → Netlify
3. **Clique em**: Connect to Netlify
4. **Selecione**: diariofinanceirooficial
5. **Autorize**: A integração configurará as variáveis automaticamente

### **ETAPA 4: Deploy Automático**

Agora é só fazer push:

```bash
# Adicionar mudanças
git add .

# Commit
git commit -m "feat: Integração Netlify + Neon.tech PostgreSQL"

# Push (deploy automático)
git push origin main
```

## 🔧 **CONFIGURAÇÕES AVANÇADAS**

### **Headers de Segurança** (já configurado no netlify.toml)
- CSP com Neon.tech permitido
- Headers de segurança
- Cache otimizado

### **Redirects** (já configurado)
- SPA redirects para React Router
- API redirects para Netlify Functions

### **Functions** (já criadas)
- Backend completo como Netlify Functions
- Conexão direta com Neon.tech
- CORS configurado

## 📊 **MONITORAMENTO**

### **Status do Deploy**
- Badge automático no README
- Logs em tempo real no Netlify
- Métricas de performance

### **Banco de Dados**
- Dashboard Neon.tech para métricas
- Backup automático
- Monitoramento de uso

## 🎯 **VANTAGENS DA INTEGRAÇÃO**

### ✅ **Netlify**
- Deploy automático no Git push
- CDN global
- SSL automático
- Functions serverless

### ✅ **Neon.tech**
- PostgreSQL serverless
- Backup automático
- Branching de banco
- Escala automática

### ✅ **Integração**
- Variáveis sincronizadas
- Deploy coordenado
- Monitoramento unificado

## 🚨 **TROUBLESHOOTING**

### **Se o deploy falhar:**
1. Verifique os logs no Netlify Dashboard
2. Confirme as variáveis de ambiente
3. Teste a conexão Neon.tech localmente

### **Se a API não funcionar:**
1. Verifique se as Functions estão deployadas
2. Confirme os redirects no netlify.toml
3. Teste os endpoints diretamente

### **Se o banco não conectar:**
1. Verifique a DATABASE_URL
2. Confirme se o projeto Neon.tech está ativo
3. Teste a conexão com o script testar-neon.js

## 🎉 **RESULTADO FINAL**

Após o deploy você terá:

- **Frontend**: https://diariofinanceirooficial.netlify.app
- **API**: https://diariofinanceirooficial.netlify.app/api/
- **Banco**: PostgreSQL no Neon.tech
- **Monitoramento**: Dashboards integrados

---

## 📞 **LINKS ÚTEIS**

- **Netlify Dashboard**: https://app.netlify.com/projects/diariofinanceirooficial
- **Neon.tech Console**: https://console.neon.tech
- **Deploy Logs**: https://app.netlify.com/projects/diariofinanceirooficial/deploys
- **Status Badge**: Atualização automática no README