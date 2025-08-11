# 🔄 INSTRUÇÕES DE RESTAURAÇÃO DO BACKUP

## 🚀 Restauração Rápida (Recomendada)

### Windows
```batch
# Executar o script automático
restaurar-backup.bat
```

### Manual
```bash
# 1. Restaurar frontend
cp -r backup-completo-2025-07-24/frontend/* ./src/
cp backup-completo-2025-07-24/frontend/package.json ./

# 2. Restaurar backend
cp -r backup-completo-2025-07-24/backend/* ./backend/

# 3. Instalar dependências
npm install
cd backend && npm install

# 4. Iniciar sistema
npm run dev
# Em outro terminal:
cd backend && npm run dev
```

## 📋 Restauração Seletiva

### Apenas Correções de Lançamentos Recorrentes
```bash
# Copiar arquivos específicos
cp backup-completo-2025-07-24/frontend/src/hooks/useRecurringTransactions.ts ./src/hooks/
cp backup-completo-2025-07-24/frontend/src/hooks/useRecurringTransactionManager.ts ./src/hooks/
cp backup-completo-2025-07-24/frontend/src/utils/recurringDateCalculator.ts ./src/utils/
cp backup-completo-2025-07-24/backend/src/services/recurringTransactionService.ts ./backend/src/services/
```

### Apenas Sistema Financeiro Principal
```bash
# Copiar hook principal
cp backup-completo-2025-07-24/frontend/src/hooks/useUnifiedFinancialSystem.ts ./src/hooks/
cp backup-completo-2025-07-24/frontend/src/utils/currencyUtils.ts ./src/utils/
```

### Apenas Interface
```bash
# Copiar páginas e componentes
cp backup-completo-2025-07-24/frontend/src/pages/Dashboard.tsx ./src/pages/
cp backup-completo-2025-07-24/frontend/src/pages/QuickEntry.tsx ./src/pages/
cp backup-completo-2025-07-24/frontend/src/components/RecurringTransactionManager.tsx ./src/components/
```

## 🔧 Configuração Pós-Restauração

### 1. Frontend
```bash
# Instalar dependências
npm install

# Verificar se todas as dependências estão corretas
npm audit fix

# Iniciar em modo desenvolvimento
npm run dev
```

### 2. Backend
```bash
cd backend

# Instalar dependências
npm install

# Configurar banco de dados
npx prisma generate
npx prisma db push

# Executar seeds (opcional)
npx prisma db seed

# Iniciar servidor
npm run dev
```

### 3. Banco de Dados
```bash
# Se usando Docker
cd backend
docker-compose up -d

# Se usando PostgreSQL local
# Criar banco: diario_financeiro
# Executar: npx prisma db push
```

## ✅ Verificação de Funcionamento

### 1. Testes Automáticos
```bash
# Abrir no navegador
./testes/teste-correcao-recorrentes.html
./testes/teste-exclusao-recorrentes.html
```

### 2. Testes Manuais
1. **Sistema Principal**:
   - Acessar Dashboard
   - Criar lançamento
   - Verificar cálculos

2. **Lançamentos Recorrentes**:
   - Criar recorrente para dia que já passou
   - Verificar que data é futura
   - Excluir recorrente
   - Verificar que lançamentos gerados foram removidos

3. **Autenticação** (se backend ativo):
   - Fazer login
   - Verificar isolamento de dados

## 🐛 Solução de Problemas

### Erro: "Module not found"
```bash
# Verificar se todos os arquivos foram copiados
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Cannot connect to database"
```bash
# Verificar se PostgreSQL está rodando
# Verificar variáveis de ambiente no .env
# Executar: npx prisma db push
```

### Erro: "Port already in use"
```bash
# Frontend (porta 3000)
npx kill-port 3000

# Backend (porta 5000)
npx kill-port 5000
```

### Erro: "TypeScript errors"
```bash
# Verificar se todos os tipos estão corretos
# Reinstalar dependências TypeScript
npm install --save-dev typescript @types/react @types/node
```

## 📊 Validação de Restauração

### Checklist Pós-Restauração
- [ ] Frontend inicia sem erros
- [ ] Backend conecta ao banco
- [ ] Dashboard carrega corretamente
- [ ] Lançamentos podem ser criados
- [ ] Lançamentos recorrentes funcionam
- [ ] Exclusão funciona corretamente
- [ ] Cálculos estão corretos
- [ ] Testes passam

### Comandos de Verificação
```bash
# Verificar se serviços estão rodando
curl http://localhost:3000  # Frontend
curl http://localhost:5000/health  # Backend (se disponível)

# Verificar logs
# Frontend: Console do navegador
# Backend: Terminal onde rodou npm run dev
```

## 🆘 Suporte

### Se algo não funcionar:
1. Verificar se todos os arquivos foram copiados
2. Reinstalar dependências
3. Verificar logs de erro
4. Consultar documentação específica em `/documentacao/`
5. Executar testes para identificar problema

### Arquivos de Log:
- Frontend: Console do navegador (F12)
- Backend: Terminal
- Banco: Logs do PostgreSQL

---

**Backup**: 24/07/2025 19:41:05  
**Status**: ✅ TESTADO E FUNCIONAL  
**Suporte**: Documentação completa incluída