import { Router } from 'express';
import { neonConnection } from '../services/neonConnectionService';

const router = Router();

/**
 * GET /api/health
 * Verifica saúde geral da aplicação
 */
router.get('/', async (req, res) => {
  try {
    const health = await neonConnection.testConnection();
    
    res.json({
      status: health.connected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: health.connected,
        provider: health.provider,
        database: health.database,
        latency: `${health.latency}ms`,
        error: health.error
      },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
      }
    });
    
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/health/database
 * Verifica especificamente a conexão com o banco
 */
router.get('/database', async (req, res) => {
  try {
    const health = await neonConnection.healthCheck();
    
    res.json({
      status: health.connected ? 'connected' : 'disconnected',
      connection: {
        connected: health.connected,
        latency: health.latency,
        provider: health.provider,
        database: health.database,
        error: health.error
      },
      metrics: health.metrics,
      isNeon: await neonConnection.isNeonDatabase()
    });
    
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/health/database/stats
 * Obtém estatísticas detalhadas do banco
 */
router.get('/database/stats', async (req, res) => {
  try {
    const stats = await neonConnection.getDatabaseStats();
    
    res.json({
      timestamp: new Date().toISOString(),
      statistics: stats
    });
    
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;