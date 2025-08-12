import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// ✅ Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' }
});

// ✅ Sanitização simples
const sanitize = (str: string) => str?.replace(/[<>]/g, '').trim().substring(0, 1000);

// Middleware
app.use(limiter);
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));

// Rotas simples inline para evitar problemas de importação circular
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }

    // ✅ Validar e sanitizar
    if (!email?.includes('@') || password?.length < 6 || !name?.trim()) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    // Criar usuário (sem hash por simplicidade)
    const user = await prisma.user.create({
      data: {
        email: sanitize(email.toLowerCase()),
        password: sanitize(password), // Em produção, usar bcrypt
        name: sanitize(name)
      }
    });

    res.json({
      token: `token_${user.id}`, // Token simples
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Validar entrada
    if (!email?.includes('@') || !password) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    const user = await prisma.user.findUnique({
      where: { email: sanitize(email.toLowerCase()) }
    });

    if (!user || user.password !== password) {
      return res.status(400).json({ error: 'Credenciais inválidas' });
    }

    res.json({
      token: `token_${user.id}`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Middleware de auth simples
const auth = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !token.startsWith('token_')) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  req.userId = token.replace('token_', '');
  next();
};

// Transaction routes
app.get('/api/transactions', auth, async (req: any, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(transactions);
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    res.status(500).json({ error: 'Erro ao buscar transações' });
  }
});

app.post('/api/transactions', auth, async (req: any, res) => {
  try {
    const { date, description, amount, type, category, isRecurring, recurringId, source } = req.body;

    // ✅ Validar e sanitizar
    if (!date || !description || !amount || !type) {
      return res.status(400).json({ error: 'Dados obrigatórios ausentes' });
    }

    const transaction = await prisma.transaction.create({
      data: {
        date: sanitize(date),
        description: sanitize(description),
        amount: Math.abs(parseFloat(amount)) || 0,
        type: sanitize(type),
        category: sanitize(category || 'Geral'),
        isRecurring: isRecurring || false,
        recurringId: recurringId ? sanitize(recurringId) : null,
        source: sanitize(source || 'manual'),
        userId: req.userId
      }
    });

    res.json(transaction);
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    res.status(500).json({ error: 'Erro ao criar transação' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Frontend: http://localhost:5173`);
  console.log(`🔧 Backend: http://localhost:${PORT}`);
});

export { app, prisma };