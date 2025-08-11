import { createClient, RedisClientType } from 'redis';
import { logger } from '@/utils/logger';

let redisClient: RedisClientType;

export const connectRedis = async (): Promise<void> => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis Client Connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis Client Ready');
    });

    redisClient.on('end', () => {
      logger.info('Redis Client Disconnected');
    });

    await redisClient.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

// Funções utilitárias para cache
export const cacheService = {
  // Definir cache com TTL
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      const client = getRedisClient();
      await client.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  },

  // Obter do cache
  async get<T>(key: string): Promise<T | null> {
    try {
      const client = getRedisClient();
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  },

  // Deletar do cache
  async del(key: string): Promise<void> {
    try {
      const client = getRedisClient();
      await client.del(key);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  },

  // Deletar múltiplas chaves por padrão
  async delPattern(pattern: string): Promise<void> {
    try {
      const client = getRedisClient();
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
      }
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
    }
  },

  // Verificar se existe
  async exists(key: string): Promise<boolean> {
    try {
      const client = getRedisClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  },

  // Definir TTL para chave existente
  async expire(key: string, ttlSeconds: number): Promise<void> {
    try {
      const client = getRedisClient();
      await client.expire(key, ttlSeconds);
    } catch (error) {
      logger.error('Cache expire error:', error);
    }
  }
};

// Funções específicas para sessões
export const sessionService = {
  // Salvar sessão
  async saveSession(sessionId: string, userId: string, ttlSeconds: number = 1800): Promise<void> {
    const key = `session:${sessionId}`;
    await cacheService.set(key, { userId, createdAt: new Date().toISOString() }, ttlSeconds);
  },

  // Obter sessão
  async getSession(sessionId: string): Promise<{ userId: string; createdAt: string } | null> {
    const key = `session:${sessionId}`;
    return await cacheService.get(key);
  },

  // Deletar sessão
  async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await cacheService.del(key);
  },

  // Deletar todas as sessões de um usuário
  async deleteUserSessions(userId: string): Promise<void> {
    const pattern = `session:*`;
    try {
      const client = getRedisClient();
      const keys = await client.keys(pattern);
      
      for (const key of keys) {
        const session = await cacheService.get(key);
        if (session && (session as any).userId === userId) {
          await cacheService.del(key);
        }
      }
    } catch (error) {
      logger.error('Delete user sessions error:', error);
    }
  },

  // Verificar se token está na blacklist
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = `blacklist:${token}`;
    return await cacheService.exists(key);
  },

  // Adicionar token à blacklist
  async blacklistToken(token: string, ttlSeconds: number): Promise<void> {
    const key = `blacklist:${token}`;
    await cacheService.set(key, 'true', ttlSeconds);
  }
};

// Funções para rate limiting
export const rateLimitService = {
  // Incrementar contador de rate limit
  async increment(key: string, windowSeconds: number = 900): Promise<number> {
    try {
      const client = getRedisClient();
      const current = await client.incr(key);
      
      if (current === 1) {
        await client.expire(key, windowSeconds);
      }
      
      return current;
    } catch (error) {
      logger.error('Rate limit increment error:', error);
      return 0;
    }
  },

  // Obter contador atual
  async get(key: string): Promise<number> {
    try {
      const client = getRedisClient();
      const value = await client.get(key);
      return value ? parseInt(value) : 0;
    } catch (error) {
      logger.error('Rate limit get error:', error);
      return 0;
    }
  }
};

// Serviço Redis principal com métodos básicos
export const redisService = {
  // Métodos básicos do Redis
  async get(key: string): Promise<string | null> {
    try {
      const client = getRedisClient();
      return await client.get(key);
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    try {
      const client = getRedisClient();
      await client.set(key, value);
    } catch (error) {
      logger.error('Redis set error:', error);
    }
  },

  async setex(key: string, seconds: number, value: string): Promise<void> {
    try {
      const client = getRedisClient();
      await client.setEx(key, seconds, value);
    } catch (error) {
      logger.error('Redis setex error:', error);
    }
  },

  async del(...keys: string[]): Promise<void> {
    try {
      const client = getRedisClient();
      if (keys.length > 0) {
        await client.del(keys);
      }
    } catch (error) {
      logger.error('Redis del error:', error);
    }
  },

  async keys(pattern: string): Promise<string[]> {
    try {
      const client = getRedisClient();
      return await client.keys(pattern);
    } catch (error) {
      logger.error('Redis keys error:', error);
      return [];
    }
  },

  async exists(key: string): Promise<boolean> {
    try {
      const client = getRedisClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error:', error);
      return false;
    }
  }
};