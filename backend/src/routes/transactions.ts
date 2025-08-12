import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../server';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware de autenticação
const auth = (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Buscar todas as transações do usuário
router.get('/', auth, async (req: any, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.userId },
      orderBy: { date: 'desc' }
    });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar transações' });
  }
});

// Criar transação
router.post('/', auth, async (req: any, res) => {
  try {
    const { date, description, amount, type, category, isRecurring, recurringId, source } = req.body;

    const transaction = await prisma.transaction.create({
      data: {
        date,
        description,
        amount: parseFloat(amount),
        type,
        category: category || 'Geral',
        isRecurring: isRecurring || false,
        recurringId,
        source: source || 'manual',
        userId: req.userId
      }
    });

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar transação' });
  }
});

// Atualizar transação
router.put('/:id', auth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { date, description, amount, type, category } = req.body;

    const transaction = await prisma.transaction.updateMany({
      where: { 
        id,
        userId: req.userId 
      },
      data: {
        date,
        description,
        amount: parseFloat(amount),
        type,
        category
      }
    });

    if (transaction.count === 0) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar transação' });
  }
});

// Deletar transação
router.delete('/:id', auth, async (req: any, res) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.deleteMany({
      where: { 
        id,
        userId: req.userId 
      }
    });

    if (transaction.count === 0) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar transação' });
  }
});

// Sincronizar transações (upload do cliente)
router.post('/sync', auth, async (req: any, res) => {
  try {
    const { transactions } = req.body;

    // Deletar transações existentes do usuário
    await prisma.transaction.deleteMany({
      where: { userId: req.userId }
    });

    // Inserir novas transações
    const createdTransactions = await Promise.all(
      transactions.map((t: any) => 
        prisma.transaction.create({
          data: {
            ...t,
            id: undefined, // Deixar o banco gerar novo ID
            amount: parseFloat(t.amount),
            userId: req.userId
          }
        })
      )
    );

    res.json({ 
      success: true, 
      count: createdTransactions.length 
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao sincronizar transações' });
  }
});

export { router as transactionRoutes };