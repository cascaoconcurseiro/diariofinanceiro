import { Request, Response } from 'express';
import { userService } from '../services/userService';
import { logger } from '../utils/logger';
import { validateUpdateProfile, validateChangePassword } from '../utils/validation';

export class UserController {
  // Obter perfil do usuário
  async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const user = await userService.getUserProfile(userId);
      res.json(user);
    } catch (error) {
      logger.error('Erro ao obter perfil do usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Atualizar perfil do usuário
  async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const validation = validateUpdateProfile(req.body);
      if (!validation.isValid) {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: validation.errors 
        });
      }

      const updatedUser = await userService.updateProfile(userId, req.body);
      res.json(updatedUser);
    } catch (error) {
      logger.error('Erro ao atualizar perfil:', error);
      if (error.message === 'Email já está em uso') {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Alterar senha
  async changePassword(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const validation = validateChangePassword(req.body);
      if (!validation.isValid) {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: validation.errors 
        });
      }

      await userService.changePassword(userId, req.body.currentPassword, req.body.newPassword);
      res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
      logger.error('Erro ao alterar senha:', error);
      if (error.message === 'Senha atual incorreta') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Solicitar recuperação de senha
  async requestPasswordReset(req: Request, res: Response) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório' });
      }

      await userService.requestPasswordReset(email);
      // Sempre retorna sucesso por segurança (não revela se email existe)
      res.json({ message: 'Se o email existir, você receberá instruções para redefinir sua senha' });
    } catch (error) {
      logger.error('Erro ao solicitar recuperação de senha:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Redefinir senha com token
  async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Nova senha deve ter pelo menos 8 caracteres' });
      }

      await userService.resetPassword(token, newPassword);
      res.json({ message: 'Senha redefinida com sucesso' });
    } catch (error) {
      logger.error('Erro ao redefinir senha:', error);
      if (error.message === 'Token inválido ou expirado') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Excluir conta
  async deleteAccount(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ error: 'Senha é obrigatória para excluir a conta' });
      }

      await userService.deleteAccount(userId, password);
      res.json({ message: 'Conta excluída com sucesso' });
    } catch (error) {
      logger.error('Erro ao excluir conta:', error);
      if (error.message === 'Senha incorreta') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Obter estatísticas do usuário
  async getUserStats(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const stats = await userService.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      logger.error('Erro ao obter estatísticas do usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Logout do usuário (invalidar token atual)
  async logout(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const token = (req as any).token; // Token atual extraído do middleware de auth
      
      if (!userId || !token) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      await userService.logout(userId, token);
      res.json({ message: 'Logout realizado com sucesso' });
    } catch (error) {
      logger.error('Erro no logout:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Logout de todos os dispositivos
  async logoutAll(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const sessionsInvalidated = await userService.logoutAll(userId);
      res.json({ 
        message: 'Logout realizado em todos os dispositivos',
        sessionsInvalidated
      });
    } catch (error) {
      logger.error('Erro no logout de todos os dispositivos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

export const userController = new UserController();