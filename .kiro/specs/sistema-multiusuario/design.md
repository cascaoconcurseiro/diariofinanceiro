# Design Document - Sistema Multi-usuário

## Overview

Este documento descreve a arquitetura completa para transformar o Diário Financeiro em uma aplicação multi-usuário robusta, escalável e segura.

## Architecture

### Stack Tecnológico Recomendado

#### Frontend (Mantém o atual + melhorias)
- **React + TypeScript** (atual)
- **Tailwind CSS** (atual)
- **React Query/TanStack Query** - Para cache e sincronização
- **React Hook Form** - Para formulários otimizados
- **Zustand** - Para gerenciamento de estado global
- **PWA** - Para funcionalidade offline

#### Backend
- **Node.js + Express** - API REST
- **TypeScript** - Tipagem completa
- **Prisma** - ORM moderno
- **PostgreSQL** - Banco de dados principal
- **Redis** - Cache e sessões
- **JWT** - Autenticação
- **Socket.io** - Sincronização em tempo real

#### Infraestrutura
- **Docker** - Containerização
- **AWS/Vercel** - Deploy e hosting
- **CloudFlare** - CDN e proteção
- **GitHub Actions** - CI/CD

### Arquitetura do Sistema

```mermaid
graph TB
    subgraph "Frontend (React)"
        A[Login/Register] --> B[Dashboard]
        B --> C[Transações]
        B --> D[Relatórios]
        B --> E[Configurações]
    end
    
    subgraph "Backend (Node.js)"
        F[Auth Service] --> G[User Service]
        G --> H[Transaction Service]
        H --> I[Report Service]
        I --> J[Sync Service]
    end
    
    subgraph "Database"
        K[(PostgreSQL)]
        L[(Redis Cache)]
    end
    
    subgraph "External"
        M[Email Service]
        N[File Storage]
        O[Monitoring]
    end
    
    A --> F
    C --> H
    D --> I
    E --> G
    
    F --> K
    H --> K
    G --> K
    J --> L
    
    F --> M
    H --> N
    J --> O
```

## Database Schema

### Tabelas Principais

```sql
-- Usuários
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Transações
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('entrada', 'saida', 'diario')),
    category VARCHAR(100),
    is_recurring BOOLEAN DEFAULT false,
    recurring_id UUID REFERENCES recurring_transactions(id),
    source VARCHAR(50) DEFAULT 'manual',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Transações Recorrentes
CREATE TABLE recurring_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    type VARCHAR(20) NOT NULL,
    day_of_month INTEGER NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Configurações do Usuário
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emergency_reserve_amount DECIMAL(15,2) DEFAULT 0,
    emergency_reserve_months INTEGER DEFAULT 6,
    currency VARCHAR(10) DEFAULT 'BRL',
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Sessões
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    device_info JSONB,
    ip_address INET,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## API Design

### Endpoints Principais

#### Autenticação
```typescript
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

#### Transações
```typescript
GET    /api/transactions              // Lista paginada
POST   /api/transactions              // Criar nova
GET    /api/transactions/:id          // Buscar por ID
PUT    /api/transactions/:id          // Atualizar
DELETE /api/transactions/:id          // Excluir
GET    /api/transactions/summary      // Resumos e totais
GET    /api/transactions/export       // Exportar dados
```

#### Transações Recorrentes
```typescript
GET    /api/recurring                 // Listar
POST   /api/recurring                 // Criar
PUT    /api/recurring/:id             // Atualizar
DELETE /api/recurring/:id             // Excluir
POST   /api/recurring/:id/process     // Processar manualmente
```

#### Relatórios
```typescript
GET /api/reports/monthly/:year/:month
GET /api/reports/yearly/:year
GET /api/reports/balance-history
GET /api/reports/categories
```

## Security Design

### Autenticação e Autorização

1. **JWT Tokens**
   - Access Token (15 min)
   - Refresh Token (30 dias)
   - Rotação automática

2. **Middleware de Segurança**
   ```typescript
   // Middleware de autenticação
   const authenticateToken = (req, res, next) => {
     const token = req.headers.authorization?.split(' ')[1];
     if (!token) return res.status(401).json({ error: 'Token required' });
     
     jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
       if (err) return res.status(403).json({ error: 'Invalid token' });
       req.user = user;
       next();
     });
   };
   
   // Middleware de autorização
   const authorizeUser = (req, res, next) => {
     const { userId } = req.params;
     if (req.user.id !== userId) {
       return res.status(403).json({ error: 'Access denied' });
     }
     next();
   };
   ```

3. **Isolamento de Dados**
   - Todas as queries incluem `user_id`
   - Row Level Security no PostgreSQL
   - Validação dupla no backend

### Criptografia

```typescript
// Criptografia de senhas
import bcrypt from 'bcrypt';

const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 12);
};

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// Criptografia de dados sensíveis
import crypto from 'crypto';

const encryptSensitiveData = (data: string): string => {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};
```

## Frontend Architecture

### State Management

```typescript
// Zustand store para usuário
interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

// Zustand store para transações
interface TransactionStore {
  transactions: Transaction[];
  loading: boolean;
  addTransaction: (transaction: CreateTransactionDto) => Promise<void>;
  updateTransaction: (id: string, updates: UpdateTransactionDto) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  syncTransactions: () => Promise<void>;
}
```

### React Query Integration

```typescript
// Hooks para API calls
export const useTransactions = (filters?: TransactionFilter) => {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => api.transactions.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.transactions.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};
```

## Offline Support

### PWA Configuration

```typescript
// Service Worker para cache
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchResponse) => {
          const responseClone = fetchResponse.clone();
          caches.open('api-cache').then((cache) => {
            cache.put(event.request, responseClone);
          });
          return fetchResponse;
        });
      })
    );
  }
});

// Sincronização em background
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncPendingTransactions());
  }
});
```

## Deployment Strategy

### Docker Configuration

```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]

# Frontend Dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: diario_financeiro
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/diario_financeiro
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    ports:
      - "3000:3000"

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

## Migration Strategy

### Fase 1: Preparação
1. Manter sistema atual funcionando
2. Desenvolver backend em paralelo
3. Criar sistema de migração de dados

### Fase 2: Implementação
1. Deploy do backend
2. Implementar autenticação no frontend
3. Migrar dados do localStorage para backend

### Fase 3: Otimização
1. Implementar sincronização em tempo real
2. Adicionar funcionalidades offline
3. Otimizar performance

### Script de Migração

```typescript
// Migração de dados do localStorage para backend
const migrateUserData = async (userId: string) => {
  const localData = localStorage.getItem('unifiedFinancialData');
  if (!localData) return;
  
  const transactions = JSON.parse(localData);
  
  for (const transaction of transactions) {
    await api.transactions.create({
      ...transaction,
      userId,
    });
  }
  
  // Limpar dados locais após migração
  localStorage.removeItem('unifiedFinancialData');
};
```

## Monitoring and Analytics

### Métricas Importantes
- Tempo de resposta da API
- Taxa de erro por endpoint
- Número de usuários ativos
- Volume de transações por dia
- Performance do banco de dados

### Logging Strategy
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

## Cost Estimation

### Infraestrutura Mensal (estimativa)
- **Servidor Backend**: $20-50/mês
- **Banco PostgreSQL**: $15-30/mês  
- **Redis Cache**: $10-20/mês
- **CDN/Storage**: $5-15/mês
- **Monitoring**: $10-25/mês
- **Email Service**: $5-10/mês

**Total estimado**: $65-150/mês para até 1000 usuários ativos

### Escalabilidade
- **1K usuários**: $100/mês
- **10K usuários**: $300/mês
- **100K usuários**: $1000/mês

Esta arquitetura fornece uma base sólida para transformar o sistema atual em uma aplicação multi-usuário profissional, mantendo a funcionalidade existente enquanto adiciona segurança, escalabilidade e sincronização multi-dispositivo.