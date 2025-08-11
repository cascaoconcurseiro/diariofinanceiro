# Diário Financeiro - Backend API

Backend multi-usuário para o sistema de Diário Financeiro, construído com Node.js, Express, TypeScript e PostgreSQL.

## 🚀 Tecnologias

- **Node.js** + **Express** - Framework web
- **TypeScript** - Tipagem estática
- **Prisma** - ORM moderno
- **PostgreSQL** - Banco de dados principal
- **Redis** - Cache e sessões
- **JWT** - Autenticação
- **Socket.io** - Comunicação em tempo real
- **Winston** - Logging
- **Docker** - Containerização

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker (opcional)

## 🛠️ Instalação

### Opção 1: Docker (Recomendado)

```bash
# Clonar repositório
git clone <repo-url>
cd backend

# Copiar variáveis de ambiente
cp .env.example .env

# Editar .env com suas configurações
nano .env

# Iniciar com Docker
docker-compose up -d

# Executar migrações
docker-compose exec backend npx prisma migrate dev

# Ver logs
docker-compose logs -f backend
```

### Opção 2: Instalação Local

```bash
# Instalar dependências
npm install

# Configurar banco de dados
createdb diario_financeiro

# Copiar e configurar .env
cp .env.example .env

# Executar migrações
npx prisma migrate dev

# Gerar Prisma Client
npx prisma generate

# Iniciar em desenvolvimento
npm run dev
```

## 🗄️ Banco de Dados

### Executar Migrações

```bash
# Desenvolvimento
npx prisma migrate dev

# Produção
npx prisma migrate deploy

# Reset (cuidado!)
npx prisma migrate reset
```

### Visualizar Dados

```bash
# Prisma Studio
npx prisma studio

# Ou via Adminer (Docker)
# http://localhost:8080
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Iniciar com hot reload
npm run build        # Build para produção
npm run start        # Iniciar produção

# Banco de dados
npm run db:generate  # Gerar Prisma Client
npm run db:push      # Push schema para DB
npm run db:migrate   # Executar migrações
npm run db:studio    # Abrir Prisma Studio
npm run db:seed      # Popular banco com dados

# Testes
npm test             # Executar testes
npm run test:watch   # Testes em watch mode

# Qualidade de código
npm run lint         # Verificar código
npm run lint:fix     # Corrigir automaticamente
```

## 📡 API Endpoints

### Autenticação
```
POST   /api/auth/register     # Registrar usuário
POST   /api/auth/login        # Login
POST   /api/auth/logout       # Logout
POST   /api/auth/refresh      # Renovar token
POST   /api/auth/forgot       # Esqueci senha
POST   /api/auth/reset        # Resetar senha
```

### Transações
```
GET    /api/transactions      # Listar transações
POST   /api/transactions      # Criar transação
GET    /api/transactions/:id  # Buscar por ID
PUT    /api/transactions/:id  # Atualizar
DELETE /api/transactions/:id  # Excluir
GET    /api/transactions/export # Exportar dados
```

### Transações Recorrentes
```
GET    /api/recurring         # Listar recorrentes
POST   /api/recurring         # Criar recorrente
PUT    /api/recurring/:id     # Atualizar
DELETE /api/recurring/:id     # Excluir
POST   /api/recurring/:id/process # Processar
```

### Relatórios
```
GET /api/reports/monthly/:year/:month  # Relatório mensal
GET /api/reports/yearly/:year          # Relatório anual
GET /api/reports/balance-history       # Histórico de saldos
GET /api/reports/categories            # Por categorias
```

### Usuários
```
GET    /api/users/profile     # Perfil do usuário
PUT    /api/users/profile     # Atualizar perfil
GET    /api/users/settings    # Configurações
PUT    /api/users/settings    # Atualizar configurações
DELETE /api/users/account     # Excluir conta
```

## 🔐 Autenticação

O sistema usa JWT com refresh tokens:

```javascript
// Headers necessários
{
  "Authorization": "Bearer <access_token>",
  "Content-Type": "application/json"
}
```

### Fluxo de Autenticação

1. **Login**: `POST /api/auth/login`
   - Retorna `accessToken` (15min) e `refreshToken` (30 dias)

2. **Usar API**: Incluir `Authorization: Bearer <accessToken>`

3. **Renovar**: `POST /api/auth/refresh` com `refreshToken`

4. **Logout**: `POST /api/auth/logout` para invalidar tokens

## 🏗️ Estrutura do Projeto

```
src/
├── controllers/     # Controladores da API
├── middleware/      # Middlewares personalizados
├── models/          # Modelos de dados
├── routes/          # Definição de rotas
├── services/        # Lógica de negócio
├── utils/           # Utilitários
├── types/           # Tipos TypeScript
└── server.ts        # Ponto de entrada

prisma/
├── schema.prisma    # Schema do banco
├── migrations/      # Migrações
└── seed.ts          # Dados iniciais
```

## 🔒 Segurança

### Medidas Implementadas

- **Helmet** - Headers de segurança
- **CORS** - Controle de origem
- **Rate Limiting** - Limite de requisições
- **JWT** - Tokens seguros
- **Bcrypt** - Hash de senhas
- **Validação** - Zod para validação de dados
- **Logs** - Auditoria completa

### Configurações de Segurança

```javascript
// Rate Limiting
windowMs: 15 * 60 * 1000, // 15 minutos
max: 100 // máximo 100 requisições

// JWT
accessToken: 15 minutos
refreshToken: 30 dias

// Bcrypt
rounds: 12
```

## 📊 Monitoramento

### Logs

```bash
# Ver logs em tempo real
tail -f logs/combined.log

# Logs de erro
tail -f logs/error.log

# Via Docker
docker-compose logs -f backend
```

### Health Check

```bash
# Verificar saúde da API
curl http://localhost:3000/health

# Resposta esperada
{
  "status": "ok",
  "timestamp": "2025-01-20T10:00:00.000Z",
  "uptime": 3600,
  "environment": "development"
}
```

### Métricas

- Tempo de resposta das APIs
- Taxa de erro por endpoint
- Usuários ativos
- Volume de transações
- Performance do banco

## 🚀 Deploy

### Produção com Docker

```bash
# Build da imagem
docker build -t diario-backend .

# Executar
docker run -d \
  --name diario-backend \
  -p 3000:3000 \
  --env-file .env.production \
  diario-backend
```

### Variáveis de Ambiente (Produção)

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
JWT_SECRET=<strong-secret>
JWT_REFRESH_SECRET=<strong-refresh-secret>
FRONTEND_URL=https://yourdomain.com
```

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Testes com coverage
npm run test:coverage

# Testes específicos
npm test -- --grep "auth"
```

## 📝 Logs e Debug

### Níveis de Log

- **error**: Erros críticos
- **warn**: Avisos importantes
- **info**: Informações gerais
- **debug**: Debug detalhado

### Configuração

```bash
# .env
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- **Issues**: [GitHub Issues](link-para-issues)
- **Documentação**: [Wiki](link-para-wiki)
- **Email**: suporte@diariofinanceiro.com

---

**Desenvolvido com ❤️ pela equipe do Diário Financeiro**