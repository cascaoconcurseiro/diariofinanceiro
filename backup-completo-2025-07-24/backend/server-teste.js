const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Backend funcionando!'
  });
});

// Test API endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Auth login endpoint (mock)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock users
  const users = {
    'joao@teste.com': { password: 'MinhaSenh@123', name: 'João Silva', id: '1' },
    'maria@teste.com': { password: 'OutraSenh@456', name: 'Maria Santos', id: '2' },
    'pedro@teste.com': { password: 'Pedro@789', name: 'Pedro Costa', id: '3' }
  };
  
  const user = users[email];
  
  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      error: 'Credenciais inválidas'
    });
  }
  
  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: email
      },
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      }
    }
  });
});

// User profile endpoint (mock)
app.get('/api/users/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Token não fornecido'
    });
  }
  
  res.json({
    success: true,
    data: {
      id: '1',
      name: 'Usuário Teste',
      email: 'teste@teste.com'
    }
  });
});

// Logout endpoint (mock)
app.post('/api/users/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor de teste rodando na porta ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 API test: http://localhost:${PORT}/api/test`);
  console.log(`🎯 CORS habilitado para: http://localhost:5173`);
});