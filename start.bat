@echo off
echo 🚀 Iniciando Diário Financeiro...

echo.
echo 📦 Instalando dependências do frontend...
call npm install

echo.
echo 🔧 Instalando dependências do backend...
cd backend
call npm install

echo.
echo 🗄️ Configurando banco de dados...
call npx prisma migrate dev --name init

echo.
echo 🚀 Iniciando serviços...
start "Backend" cmd /k "npm run dev"
cd ..
start "Frontend" cmd /k "npm run dev"

echo.
echo ✅ Serviços iniciados!
echo 🌐 Frontend: http://localhost:5173
echo 🔧 Backend: http://localhost:3000
echo.
pause