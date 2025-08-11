import { Server } from 'socket.io';
import { jwtUtils } from '@/utils/jwt';
import { logger, logUserActivity } from '@/utils/logger';

export const setupSocketIO = (io: Server) => {
  // Middleware de autenticação para Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const payload = jwtUtils.verifyAccessToken(token);
      
      // Adicionar informações do usuário ao socket
      (socket as any).userId = payload.userId;
      (socket as any).userEmail = payload.email;
      
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  // Conexão estabelecida
  io.on('connection', (socket) => {
    const userId = (socket as any).userId;
    const userEmail = (socket as any).userEmail;
    
    logger.info(`User connected via WebSocket: ${userEmail} (${userId})`);
    
    // Juntar usuário ao seu room pessoal
    socket.join(`user:${userId}`);
    
    logUserActivity(userId, 'WEBSOCKET_CONNECTED', {
      socketId: socket.id,
      ip: socket.handshake.address
    });

    // Eventos do cliente
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Sincronização de dados em tempo real
    socket.on('sync_request', (data) => {
      // TODO: Implementar sincronização de dados
      socket.emit('sync_response', {
        success: true,
        data: {},
        timestamp: new Date().toISOString()
      });
    });

    // Desconexão
    socket.on('disconnect', (reason) => {
      logger.info(`User disconnected: ${userEmail} (${userId}) - Reason: ${reason}`);
      
      logUserActivity(userId, 'WEBSOCKET_DISCONNECTED', {
        reason,
        socketId: socket.id
      });
    });

    // Tratamento de erros
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${userId}:`, error);
    });
  });

  // Funções utilitárias para enviar dados para usuários específicos
  return {
    // Enviar dados para um usuário específico
    sendToUser: (userId: string, event: string, data: any) => {
      io.to(`user:${userId}`).emit(event, data);
    },

    // Enviar notificação para um usuário
    sendNotification: (userId: string, notification: any) => {
      io.to(`user:${userId}`).emit('notification', {
        ...notification,
        timestamp: new Date().toISOString()
      });
    },

    // Enviar atualização de dados para um usuário
    sendDataUpdate: (userId: string, type: string, data: any) => {
      io.to(`user:${userId}`).emit('data_update', {
        type,
        data,
        timestamp: new Date().toISOString()
      });
    },

    // Broadcast para todos os usuários conectados (usar com cuidado)
    broadcast: (event: string, data: any) => {
      io.emit(event, data);
    }
  };
};