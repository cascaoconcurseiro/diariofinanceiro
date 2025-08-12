# 🚀 DEPLOY SUPER RÁPIDO

## ⚡ OPÇÃO 1: SCRIPT AUTOMÁTICO

### Windows:
1. Clique duas vezes em `deploy-automatico.bat`
2. Aguarde terminar
3. Arraste a pasta `dist` no Netlify

### Linux/Mac:
1. Execute: `./deploy-automatico.sh`
2. Aguarde terminar  
3. Arraste a pasta `dist` no Netlify

## ⚡ OPÇÃO 2: MANUAL RÁPIDO

1. Execute: `npm install && npm run build`
2. Acesse: https://app.netlify.com/
3. Arraste a pasta `dist` criada
4. Adicione variável:
   - **Key**: `VITE_NEON_DATABASE_URL`
   - **Value**: `postgresql://neondb_owner:npg_ALdt46Yrgpqw@ep-bitter-grass-ae94ah92-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require`

## ✅ PRONTO!

Seu sistema estará online com:
- ✅ Sincronização em tempo real
- ✅ Banco de dados na nuvem
- ✅ Lançamentos recorrentes funcionando
- ✅ Acesso de qualquer dispositivo