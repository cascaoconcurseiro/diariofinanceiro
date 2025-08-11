const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Usuários em memória (para teste rápido)
const users = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@teste.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' // MinhaSenh@123
  },
  {
    id: '2', 
    name: 'Maria Santos',
    email: 'maria@teste.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' // OutraSenh@456
  },
  {
    id: '3',
    name: 'Pedro Costa', 
    email: 'pedro@teste.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' // Pedro@789
  }
];

// Transações em memória
const transactions = {
  '1': [
    { id: '1', date: '2024-01-15', description: 'Salário', amount: 5000, type: 'ENTRADA', category: 'Trabalho' },
    { id: '2', date: '2024-01-16', description: 'Supermercado', amount: 250, type: 'SAIDA', category: 'Alimentação' }
  ],
  '2': [
    { id: '3', date: '2024-01-15', description: 'Freelance', amount: 1500, type: 'ENTRADA', category: 'Trabalho' },
    { id: '4', date: '2024-01-16', description: 'Aluguel', amount: 800, type: 'SAIDA', category: 'Moradia' }
  ],
  '3': [
    { id: '5', date: '2024-01-15', description: 'Consultoria', amount: 3000, type: 'ENTRADA', category: 'Trabalho' },
    { id: '6', date: '2024-01-16', description: 'Curso', amount: 200, type: 'SAIDA', category: 'Educação' }
  ]
};

// Função para gerar token simples
function generateToken(userId) {
  return `token_${userId}_${Date.now()}`;
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', email);
    
    // Encontrar usuário
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    // Verificar senha (simplificado para teste)
    const validPasswords = {
      'joao@teste.com': 'MinhaSenh@123',
      'maria@teste.com': 'OutraSenh@456', 
      'pedro@teste.com': 'Pedro@789'
    };
    
    if (validPasswords[email] !== password) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    // Gerar token
    const token = generateToken(user.id);
    
    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        tokens: {
          accessToken: token,
          refreshToken: `refresh_${token}`
        }
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Perfil do usuário
app.get('/api/users/profile', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  // Extrair userId do token (simplificado)
  const userId = token.split('_')[1];
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  
  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    }
  });
});

// Listar transações
app.get('/api/transactions', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = token?.split('_')[1];
  
  if (!userId) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  
  const userTransactions = transactions[userId] || [];
  
  res.json({
    success: true,
    data: userTransactions
  });
});

// Criar transação
app.post('/api/transactions', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = token?.split('_')[1];
  
  if (!userId) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  
  const { date, description, amount, type, category } = req.body;
  
  const newTransaction = {
    id: Date.now().toString(),
    date,
    description,
    amount: parseFloat(amount),
    type,
    category
  };
  
  if (!transactions[userId]) {
    transactions[userId] = [];
  }
  
  transactions[userId].push(newTransaction);
  
  res.status(201).json({
    success: true,
    data: newTransaction
  });
});

// Logout
app.post('/api/users/logout', (req, res) => {
  res.json({ success: true, message: 'Logout realizado com sucesso' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🚀 Servidor backend rodando na porta', PORT);
  console.log('');
  console.log('👥 Usuários de teste:');
  console.log('📧 joao@teste.com - 🔑 MinhaSenh@123');
  console.log('📧 maria@teste.com - 🔑 OutraSenh@456');
  console.log('📧 pedro@teste.com - 🔑 Pedro@789');
  console.log('');
  console.log('🌐 Acesse: http://localhost:5173');
  console.log('✅ Backend pronto!');
});