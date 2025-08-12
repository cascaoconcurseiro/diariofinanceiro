import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { 
  securityMiddleware, 
  authMiddleware, 
  hashPassword, 
  verifyPassword, 
  generateToken,
  sanitizeForLog,
  sanitizeOutput
} from './utils/security';
import { 
  validate, 
  userRegistrationSchema, 
  userLoginSchema, 
  transactionSchema 
} from './utils/validation';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware de segurança
app.use(securityMiddleware);

// CORS seguro
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth routes com validação e segurança
app.post('/api/auth/register', validate(userRegistrationSchema), async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizeOutput(email) }
    });

    if (existingUser) {
      console.log(`Registration attempt for existing email: ${sanitizeForLog(email)}`);
      return res.status(400).json({ error: 'Email já está em uso' });
    }

    // Hash da senha
    const hashedPassword = await hashPassword(password);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: sanitizeOutput(email),
        password: hashedPassword,
        name: sanitizeOutput(name)
      }
    });

    // Gerar token
    const token = generateToken(user.id);

    console.log(`User registered successfully: ${sanitizeForLog(email)}`);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/auth/login', validate(userLoginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: sanitizeOutput(email) }
    });

    if (!user) {
      console.log(`Login attempt for non-existent email: ${sanitizeForLog(email)}`);
      return res.status(400).json({ error: 'Credenciais inválidas' });
    }

    // Verificar senha
    const validPassword = await verifyPassword(password, user.password);
    if (!validPassword) {
      console.log(`Invalid password attempt for: ${sanitizeForLog(email)}`);
      return res.status(400).json({ error: 'Credenciais inválidas' });
    }

    // Gerar token
    const token = generateToken(user.id);

    console.log(`User logged in successfully: ${sanitizeForLog(email)}`);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Transaction routes com autenticação e validação
app.get('/api/transactions', authMiddleware, async (req: any, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 1000 // Limitar resultados
    });

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Erro ao buscar transações' });
  }
});

app.post('/api/transactions', authMiddleware, validate(transactionSchema), async (req: any, res) => {
  try {
    const { date, description, amount, type, category, isRecurring, recurringId, source } = req.body;

    const transaction = await prisma.transaction.create({
      data: {
        date: sanitizeOutput(date),
        description: sanitizeOutput(description),
        amount: parseFloat(amount),
        type: sanitizeOutput(type),
        category: category ? sanitizeOutput(category) : 'Geral',
        isRecurring: isRecurring || false,
        recurringId: recurringId ? sanitizeOutput(recurringId) : null,
        source: source ? sanitizeOutput(source) : 'manual',
        userId: req.userId
      }
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Erro ao criar transação' });
  }
});

app.delete('/api/transactions/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.deleteMany({
      where: { 
        id: sanitizeOutput(id),
        userId: req.userId 
      }
    });

    if (transaction.count === 0) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Erro ao deletar transação' });
  }
});

// Error handler
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor seguro rodando na porta ${PORT}`);
  console.log(`🔒 Segurança: Helmet, Rate Limiting, CORS configurados`);
  console.log(`🛡️ Autenticação: JWT com bcrypt habilitado`);
});

export { app, prisma };