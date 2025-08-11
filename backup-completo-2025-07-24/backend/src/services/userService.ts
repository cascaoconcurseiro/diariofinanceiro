import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { redisService } from './redisService';
import { logger } from '../utils/logger';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class UserService {
  // Obter perfil do usuário (sem dados sensíveis)
  async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        isActive: true
      }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return user;
  }

  // Atualizar perfil do usuário
  async updateProfile(userId: string, data: { name?: string; email?: string }) {
    // Verificar se o email já está em uso por outro usuário
    if (data.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: data.email,
          id: { not: userId }
        }
      });

      if (existingUser) {
        throw new Error('Email já está em uso');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        isActive: true
      }
    });

    logger.info(`Perfil atualizado para usuário ${userId}`);
    return updatedUser;
  }

  // Alterar senha
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Senha atual incorreta');
    }

    // Hash da nova senha
    const hashedNewPassword = await hashPassword(newPassword);

    // Atualizar senha no banco
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date()
      }
    });

    // Invalidar todas as sessões do usuário (forçar novo login)
    await this.invalidateAllUserSessions(userId);

    logger.info(`Senha alterada para usuário ${userId}`);
  }

  // Solicitar recuperação de senha
  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Por segurança, não revelamos se o email existe ou não
    if (!user) {
      logger.info(`Tentativa de recuperação de senha para email inexistente: ${email}`);
      return;
    }

    // Gerar token de recuperação
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    // Salvar token no banco
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // TODO: Enviar email com o token
    // Por enquanto, apenas logamos o token (em produção, enviar por email)
    logger.info(`Token de recuperação gerado para ${email}: ${resetToken}`);
    
    // Em desenvolvimento, você pode acessar o token nos logs
    console.log(`🔑 Token de recuperação para ${email}: ${resetToken}`);
  }

  // Redefinir senha com token
  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      throw new Error('Token inválido ou expirado');
    }

    // Hash da nova senha
    const hashedPassword = await hashPassword(newPassword);

    // Atualizar senha e limpar token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date()
      }
    });

    // Invalidar todas as sessões do usuário
    await this.invalidateAllUserSessions(user.id);

    logger.info(`Senha redefinida para usuário ${user.id}`);
  }

  // Excluir conta do usuário
  async deleteAccount(userId: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Verificar senha
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Senha incorreta');
    }

    // Iniciar transação para excluir todos os dados do usuário
    await prisma.$transaction(async (tx) => {
      // Excluir transações recorrentes
      await tx.recurringTransaction.deleteMany({
        where: { userId }
      });

      // Excluir transações
      await tx.transaction.deleteMany({
        where: { userId }
      });

      // Excluir usuário
      await tx.user.delete({
        where: { id: userId }
      });
    });

    // Invalidar todas as sessões
    await this.invalidateAllUserSessions(userId);

    logger.info(`Conta excluída para usuário ${userId}`);
  }

  // Obter estatísticas do usuário
  async getUserStats(userId: string) {
    const [
      totalTransactions,
      totalRecurringTransactions,
      firstTransaction,
      lastTransaction
    ] = await Promise.all([
      prisma.transaction.count({
        where: { userId }
      }),
      prisma.recurringTransaction.count({
        where: { userId }
      }),
      prisma.transaction.findFirst({
        where: { userId },
        orderBy: { date: 'asc' },
        select: { date: true }
      }),
      prisma.transaction.findFirst({
        where: { userId },
        orderBy: { date: 'desc' },
        select: { date: true }
      })
    ]);

    return {
      totalTransactions,
      totalRecurringTransactions,
      firstTransactionDate: firstTransaction?.date || null,
      lastTransactionDate: lastTransaction?.date || null,
      accountAge: await this.calculateAccountAge(userId)
    };
  }

  // Invalidar todas as sessões do usuário
  private async invalidateAllUserSessions(userId: string) {
    try {
      // Buscar todas as chaves de sessão do usuário no Redis
      const pattern = `session:${userId}:*`;
      const keys = await redisService.keys(pattern);
      
      if (keys.length > 0) {
        await redisService.del(...keys);
      }

      // Também invalidar refresh tokens
      const refreshTokenPattern = `refresh_token:${userId}:*`;
      const refreshKeys = await redisService.keys(refreshTokenPattern);
      
      if (refreshKeys.length > 0) {
        await redisService.del(...refreshKeys);
      }

      logger.info(`Invalidadas ${keys.length + refreshKeys.length} sessões para usuário ${userId}`);
    } catch (error) {
      logger.error('Erro ao invalidar sessões do usuário:', error);
    }
  }

  // Logout do usuário (invalidar token atual)
  async logout(userId: string, token: string) {
    try {
      // Adicionar token à blacklist
      const tokenExpiry = Math.floor(Date.now() / 1000) + 3600; // 1 hora padrão
      const ttl = tokenExpiry - Math.floor(Date.now() / 1000);
      
      if (ttl > 0) {
        await redisService.setex(`blacklist:${token}`, ttl, 'true');
      }

      logger.info(`Logout realizado para usuário ${userId}`);
    } catch (error) {
      logger.error('Erro no logout:', error);
      throw error;
    }
  }

  // Logout de todos os dispositivos
  async logoutAll(userId: string): Promise<number> {
    try {
      // Buscar e invalidar todas as sessões do usuário
      const sessionPattern = `session:${userId}:*`;
      const refreshTokenPattern = `refresh_token:${userId}:*`;
      
      const [sessionKeys, refreshKeys] = await Promise.all([
        redisService.keys(sessionPattern),
        redisService.keys(refreshTokenPattern)
      ]);

      // Deletar todas as chaves encontradas
      const allKeys = [...sessionKeys, ...refreshKeys];
      if (allKeys.length > 0) {
        await redisService.del(...allKeys);
      }

      logger.info(`Logout de todos os dispositivos para usuário ${userId} (${allKeys.length} sessões invalidadas)`);
      return allKeys.length;
    } catch (error) {
      logger.error('Erro no logout de todos os dispositivos:', error);
      throw error;
    }
  }

  // Calcular idade da conta em dias
  private async calculateAccountAge(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true }
    });

    if (!user) return 0;

    const now = new Date();
    const created = new Date(user.createdAt);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }
}

export const userService = new UserService();