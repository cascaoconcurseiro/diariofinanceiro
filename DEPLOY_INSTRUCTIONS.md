# 🚀 INSTRUÇÕES COMPLETAS DE DEPLOY

## ✅ PASSO A PASSO PARA NETLIFY

### 1. FAZER UPLOAD DO CÓDIGO
1. Acesse: https://app.netlify.com/
2. Clique em "Add new site" > "Deploy manually"
3. Arraste a pasta `diariofinanceiro-94-main` inteira
4. Aguarde o deploy terminar

### 2. CONFIGURAR VARIÁVEIS DE AMBIENTE
1. No painel do Netlify, vá em "Site settings"
2. Clique em "Environment variables"
3. Clique em "Add a variable"
4. Adicione:
   - **Key**: `VITE_NEON_DATABASE_URL`
   - **Value**: `postgresql://neondb_owner:npg_ALdt46Yrgpqw@ep-bitter-grass-ae94ah92-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require`

### 3. CONFIGURAR BUILD
1. Vá em "Site settings" > "Build & deploy"
2. Em "Build settings":
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

### 4. FAZER REDEPLOY
1. Vá em "Deploys"
2. Clique em "Trigger deploy" > "Deploy site"
3. Aguarde terminar

## ✅ ALTERNATIVA: GITHUB + NETLIFY

### 1. SUBIR PARA GITHUB
1. Crie um repositório no GitHub
2. Faça upload da pasta `diariofinanceiro-94-main`

### 2. CONECTAR NO NETLIFY
1. No Netlify: "Add new site" > "Import from Git"
2. Conecte com GitHub
3. Selecione o repositório
4. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

### 3. ADICIONAR VARIÁVEL
1. Em "Site settings" > "Environment variables"
2. Adicione `VITE_NEON_DATABASE_URL` com o valor do banco

## 🔧 VERIFICAÇÃO

Após o deploy, teste:
1. Faça login no sistema
2. Crie uma transação
3. Verifique se sincroniza entre abas/dispositivos
4. Se aparecer "🐘 Neon PostgreSQL connected" no console = funcionando

## 🆘 PROBLEMAS COMUNS

**Erro de build**: Verifique se o Node.js é versão 18+
**Não sincroniza**: Verifique se a variável de ambiente foi adicionada corretamente
**Página em branco**: Verifique se o "Publish directory" é `dist`

## 📞 SUPORTE

Se tiver problemas, verifique:
1. Console do navegador (F12)
2. Logs de build no Netlify
3. Se a variável de ambiente está configurada