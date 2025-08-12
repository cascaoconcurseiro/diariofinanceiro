@echo off
echo ========================================
echo    DEPLOY AUTOMATICO - DIARIO FINANCEIRO
echo ========================================
echo.

echo 1. Instalando dependencias...
call npm install

echo.
echo 2. Fazendo build do projeto...
call npm run build

echo.
echo 3. Build concluido! Pasta 'dist' criada.
echo.
echo ========================================
echo    PROXIMOS PASSOS:
echo ========================================
echo.
echo 1. Acesse: https://app.netlify.com/
echo 2. Clique em "Add new site" ^> "Deploy manually"
echo 3. Arraste a pasta 'dist' que foi criada
echo 4. Adicione a variavel de ambiente:
echo    Key: VITE_NEON_DATABASE_URL
echo    Value: postgresql://neondb_owner:npg_ALdt46Yrgpqw@ep-bitter-grass-ae94ah92-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require^&sslmode=require
echo.
echo ========================================
echo    DEPLOY PRONTO PARA UPLOAD!
echo ========================================
pause