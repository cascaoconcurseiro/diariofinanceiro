# 💰 Diário Financeiro

Sistema financeiro pessoal **multiusuário** com **sincronização automática** entre dispositivos.

## 🚀 Como usar

### 1. Backend (Obrigatório para multiusuário)
```bash
cd backend
cp .env.example .env
# Configure DATABASE_URL e JWT_SECRET no .env
npm install
npx prisma migrate dev
npm run dev
```

### 2. Frontend
```bash
cp .env.example .env
# Configure VITE_API_URL no .env
npm install
npm run dev
```

## 📱 Funcionalidades

- ✅ **Sistema multiusuário** com login/registro
- ✅ **Sincronização automática** entre dispositivos
- ✅ Controle de entradas e saídas
- ✅ Lançamentos recorrentes
- ✅ Reserva de emergência
- ✅ Gastos fixos
- ✅ Interface responsiva
- ✅ Funciona offline (dados locais como backup)

## 🛠️ Tecnologias

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Prisma (opcional)
- **Banco**: SQLite (local) ou PostgreSQL (produção)

## 📦 Deploy

### Netlify (Frontend)
1. Conecte seu repositório
2. Configure build: `npm run build`
3. Pasta de publicação: `dist`

### Render/Railway (Backend - opcional)
1. Conecte o repositório
2. Configure variáveis de ambiente
3. Deploy automático

## 🔧 Configuração

### Variáveis de ambiente

**Backend (.env)**
```
DATABASE_URL="postgresql://user:password@localhost:5432/diario_financeiro"
JWT_SECRET="your-super-secret-jwt-key-here"
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:3000/api
```

### Como funciona a sincronização

1. **Com login**: Dados sincronizam automaticamente entre dispositivos
2. **Sem login**: Funciona offline, dados salvos apenas localmente
3. **Primeiro login**: Dados locais são enviados para o servidor
4. **Dispositivos novos**: Baixam dados do servidor automaticamente

## 📄 Licença

MIT License - use como quiser!