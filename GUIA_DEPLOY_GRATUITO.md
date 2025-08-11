# 🚀 GUIA COMPLETO: Deploy Gratuito do Diário Financeiro

## 🎯 Solução Escolhida: Netlify + Render (100% Grátis)

### **Frontend**: Netlify (Grátis)
- ✅ Deploy automático via Git
- ✅ SSL grátis
- ✅ CDN global
- ✅ Domínio personalizado

### **Backend**: Render (Grátis)
- ✅ Node.js + PostgreSQL
- ✅ 500MB de banco grátis
- ✅ SSL automático
- ✅ Deploy via Git

---

## 📋 **PASSO 1: Preparar o Projeto**

### 1.1 Criar repositório no GitHub
```bash
# Se ainda não tem, criar repositório
git init
git add .
git commit -m "Deploy: Diário Financeiro completo"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/diario-financeiro.git
git push -u origin main
```

### 1.2 Configurar variáveis de ambiente
Criar arquivo `.env.example` no backend:
```env
# Backend Environment Variables
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=seu_jwt_secret_super_seguro
REDIS_URL=redis://localhost:6379
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://seu-site.netlify.app
```

---

## 🎯 **PASSO 2: Deploy do Backend (Render)**

### 2.1 Acessar Render.com
1. Ir para [render.com](https://render.com)
2. Fazer login com GitHub
3. Clicar em "New +" → "Web Service"

### 2.2 Conectar repositório
1. Selecionar seu repositório do GitHub
2. Configurar:
   - **Name**: `diario-financeiro-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### 2.3 Configurar variáveis de ambiente
No painel do Render, adicionar:
```
JWT_SECRET = sua_chave_super_secreta_aqui
NODE_ENV = production
FRONTEND_URL = https://seu-site.netlify.app
```

### 2.4 Criar banco PostgreSQL
1. No Render, clicar "New +" → "PostgreSQL"
2. Configurar:
   - **Name**: `diario-financeiro-db`
   - **Plan**: Free (500MB)
3. Copiar a `DATABASE_URL` gerada
4. Adicionar no Web Service como variável de ambiente

---

## 🎨 **PASSO 3: Deploy do Frontend (Netlify)**

### 3.1 Acessar Netlify
1. Ir para [netlify.com](https://netlify.com)
2. Fazer login com GitHub
3. Clicar "Add new site" → "Import an existing project"

### 3.2 Configurar build
1. Selecionar repositório GitHub
2. Configurar:
   - **Base directory**: `./` (raiz)
   - **Build command**: `npm run build`
   - **Publish directory**: `dist` ou `build`

### 3.3 Configurar variáveis de ambiente
No painel Netlify → Site settings → Environment variables:
```
VITE_API_URL = https://seu-backend.onrender.com
VITE_APP_NAME = Diário Financeiro
```

### 3.4 Configurar redirecionamento SPA
Criar arquivo `public/_redirects`:
```
/*    /index.html   200
```

---

## ⚙️ **PASSO 4: Configurações Finais**

### 4.1 Atualizar CORS no backend
No arquivo `backend/src/server.ts`:
```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://seu-site.netlify.app' // Adicionar URL do Netlify
  ],
  credentials: true
}));
```

### 4.2 Configurar URLs no frontend
No arquivo `src/services/api.ts`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
```

### 4.3 Testar conexão
1. Aguardar deploy completo (5-10 minutos)
2. Acessar URL do Netlify
3. Testar login e funcionalidades

---

## 🔧 **ALTERNATIVAS GRATUITAS**

### **Opção A: Vercel + PlanetScale**
```bash
# Frontend: Vercel
npm i -g vercel
vercel --prod

# Backend: Vercel Serverless
# Banco: PlanetScale (MySQL grátis)
```

### **Opção B: GitHub Pages + Supabase**
```bash
# Frontend: GitHub Pages
npm run build
# Push para branch gh-pages

# Backend: Supabase (PostgreSQL + Auth)
# Muito fácil de configurar
```

### **Opção C: Firebase Hosting + Functions**
```bash
# Tudo no Firebase (Google)
npm i -g firebase-tools
firebase init
firebase deploy
```

---

## 📊 **Comparação de Custos**

| Plataforma | Frontend | Backend | Banco | Total/Mês |
|------------|----------|---------|-------|-----------|
| **Netlify + Render** | Grátis | Grátis | Grátis | **R$ 0** |
| Vercel + Railway | Grátis | $5 | Incluído | **R$ 25** |
| Firebase | Grátis | Grátis | Grátis | **R$ 0** |
| GitHub + Supabase | Grátis | Grátis | Grátis | **R$ 0** |

---

## 🚨 **Limitações Gratuitas**

### Render (Grátis)
- ⚠️ App "dorme" após 15min inativo
- ⚠️ 500MB de banco
- ⚠️ 750 horas/mês

### Netlify (Grátis)
- ✅ 100GB bandwidth/mês
- ✅ 300 build minutes/mês
- ✅ Sem limitação de sites

### Soluções para Limitações
```javascript
// Manter app acordado (opcional)
setInterval(() => {
  fetch('https://seu-backend.onrender.com/health');
}, 14 * 60 * 1000); // 14 minutos
```

---

## 🎯 **Próximos Passos**

1. **Escolher plataforma** (recomendo Netlify + Render)
2. **Seguir o guia passo a passo**
3. **Testar funcionalidades**
4. **Configurar domínio personalizado** (opcional)
5. **Monitorar uso** para não exceder limites

---

## 🆘 **Suporte e Troubleshooting**

### Problemas Comuns
1. **CORS Error**: Verificar URLs no backend
2. **Build Failed**: Verificar dependências
3. **Database Connection**: Verificar DATABASE_URL
4. **404 em rotas**: Adicionar `_redirects` no Netlify

### Logs e Debug
- **Render**: Painel → Logs
- **Netlify**: Painel → Functions → Logs
- **Browser**: F12 → Console

---

**🎉 Resultado Final**: Seu Diário Financeiro rodando 100% grátis na internet!