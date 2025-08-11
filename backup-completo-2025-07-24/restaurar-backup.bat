@echo off
echo 🔄 RESTAURANDO BACKUP COMPLETO DO SISTEMA
echo.

set /p confirm="⚠️  ATENÇÃO: Isso substituirá os arquivos atuais. Continuar? (S/N): "
if /i not "%confirm%"=="S" (
    echo ❌ Operação cancelada pelo usuário
    pause
    exit /b
)

echo.
echo 📁 Restaurando arquivos...

REM Restaurar frontend
echo 📱 Restaurando frontend...
xcopy "frontend\*" "..\src\" /E /I /Y >nul 2>&1
copy "frontend\package.json" "..\" >nul 2>&1

REM Restaurar backend
echo 🖥️  Restaurando backend...
xcopy "backend\*" "..\backend\" /E /I /Y >nul 2>&1

REM Restaurar documentação
echo 📚 Restaurando documentação...
copy "documentacao\*" "..\" >nul 2>&1

REM Restaurar testes
echo 🧪 Restaurando testes...
copy "testes\*.html" "..\" >nul 2>&1
copy "testes\*.ts" "..\src\tests\" >nul 2>&1

REM Restaurar scripts
echo 📜 Restaurando scripts...
copy "scripts\*" "..\" >nul 2>&1

echo.
echo ✅ BACKUP RESTAURADO COM SUCESSO!
echo.
echo 🚀 Próximos passos:
echo 1. cd ..
echo 2. npm install (para instalar dependências)
echo 3. npm run dev (para iniciar o frontend)
echo 4. cd backend && npm install && npm run dev (para o backend)
echo.
echo 💡 Consulte README_BACKUP.md para instruções detalhadas
echo.
pause