import { PrismaClient } from '@prisma/client';

interface ConnectionHealth {
  connected: boolean;
  latency: number;
  provider: string;
  database: string;
  error?: string;
}

interface NeonMetrics {
  activeConnections: number;
  queryCount: number;
  avgLatency: number;
  lastCheck: Date;
}

export class NeonConnectionService {
  private prisma: PrismaClient;
  private metrics: NeonMetrics;

  constructor() {
    this.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
    
    this.metrics = {
      activeConnections: 0,
      queryCount: 0,
      avgLatency: 0,
      lastCheck: new Date()
    };
  }

  /**
   * Testa a conexão com o Neon.tech
   */
  async testConnection(): Promise<ConnectionHealth> {
    const startTime = Date.now();
    
    try {
      // Teste básico de conexão
      await this.prisma.$connect();
      
      // Query de teste para medir latência
      const result = await this.prisma.$queryRaw`SELECT 1 as test, NOW() as server_time`;
      
      const latency = Date.now() - startTime;
      
      // Obter informações do banco
      const dbInfo = await this.prisma.$queryRaw`
        SELECT 
          current_database() as database,
          version() as version,
          current_user as user
      ` as any[];

      return {
        connected: true,
        latency,
        provider: 'postgresql',
        database: dbInfo[0]?.database || 'unknown'
      };
      
    } catch (error) {
      return {
        connected: false,
        latency: Date.now() - startTime,
        provider: 'postgresql',
        database: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Executa health check completo
   */
  async healthCheck(): Promise<ConnectionHealth & { metrics: NeonMetrics }> {
    const health = await this.testConnection();
    
    if (health.connected) {
      await this.updateMetrics();
    }
    
    return {
      ...health,
      metrics: this.metrics
    };
  }

  /**
   * Atualiza métricas de performance
   */
  private async updateMetrics(): Promise<void> {
    try {
      // Contar conexões ativas (aproximação)
      const connections = await this.prisma.$queryRaw`
        SELECT count(*) as active_connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
      ` as any[];

      this.metrics = {
        activeConnections: parseInt(connections[0]?.active_connections || '0'),
        queryCount: this.metrics.queryCount + 1,
        avgLatency: this.metrics.avgLatency, // Será calculado posteriormente
        lastCheck: new Date()
      };
      
    } catch (error) {
      console.warn('Erro ao atualizar métricas:', error);
    }
  }

  /**
   * Executa query com retry automático
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Delay exponencial
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
      }
    }
    
    throw lastError!;
  }

  /**
   * Verifica se o banco está usando Neon.tech
   */
  async isNeonDatabase(): Promise<boolean> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT current_setting('server_version') as version
      ` as any[];
      
      // Neon usa PostgreSQL com identificadores específicos
      const version = result[0]?.version || '';
      return version.includes('PostgreSQL') && process.env.DATABASE_URL?.includes('neon.tech') || false;
      
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtém estatísticas do banco
   */
  async getDatabaseStats(): Promise<any> {
    try {
      const stats = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples
        FROM pg_stat_user_tables
        ORDER BY schemaname, tablename
      `;
      
      return stats;
    } catch (error) {
      console.warn('Erro ao obter estatísticas:', error);
      return [];
    }
  }

  /**
   * Fecha conexão
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// Instância singleton
export const neonConnection = new NeonConnectionService();