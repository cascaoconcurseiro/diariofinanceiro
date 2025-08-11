const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');

// Importar as rotas do backend
const { apiRoutes } = require('../../backend/src/routes');
const healthRoutes = require('../../backend/src/routes/healthRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.use('/health', healthRoutes);

// API Routes
app.use('/api', apiRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

module.exports.handler = serverless(app);