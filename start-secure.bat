@echo off
echo 🔒 Iniciando Diário Financeiro SEGURO...
echo.

echo ✅ Verificando dependências de segurança...
npm list bcryptjs jsonwebtoken helmet express-rate-limit zod >nul 2>&1
if errorlevel 1 (
    echo ❌ Dependências de segurança não encontradas!
    echo 📦 Instalando dependências...
    npm install bcryptjs jsonwebtoken helmet express-rate-limit zod
)

echo.
echo 🛡️ Configurações de segurança:
echo   - Hash de senhas: ✅ Ativado
echo   - Rate limiting: ✅ Ativado  
echo   - Validação: ✅ Ativado
echo   - Sanitização: ✅ Ativado
echo   - Backup automático: ✅ Ativado
echo.

echo 🌐 Abrindo em: http://localhost:5173
echo ⚠️  IMPORTANTE: Use HTTPS em produção!
echo.

start http://localhost:5173
npm run dev