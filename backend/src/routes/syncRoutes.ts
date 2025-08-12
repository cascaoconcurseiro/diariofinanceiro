import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Salvar dados de sincronização
router.post('/sync/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    const { data, deviceId, timestamp } = req.body;
    const userId = req.user.id;

    // Salvar ou atualizar dados de sincronização
    await prisma.syncData.upsert({
      where: {
        userId_key: {
          userId,
          key
        }
      },
      update: {
        data: JSON.stringify(data),
        deviceId,
        lastModified: new Date(timestamp),
        updatedAt: new Date()
      },
      create: {
        userId,
        key,
        data: JSON.stringify(data),
        deviceId,
        lastModified: new Date(timestamp)
      }
    });

    res.json({ success: true, message: 'Data synced successfully' });
  } catch (error) {
    console.error('Sync save error:', error);
    res.status(500).json({ error: 'Failed to sync data' });
  }
});

// Carregar dados de sincronização
router.get('/sync/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    const userId = req.user.id;

    const syncData = await prisma.syncData.findUnique({
      where: {
        userId_key: {
          userId,
          key
        }
      }
    });

    if (syncData) {
      res.json({
        data: JSON.parse(syncData.data),
        lastModified: syncData.lastModified,
        deviceId: syncData.deviceId
      });
    } else {
      res.status(404).json({ error: 'No sync data found' });
    }
  } catch (error) {
    console.error('Sync load error:', error);
    res.status(500).json({ error: 'Failed to load sync data' });
  }
});

// Listar todos os dispositivos sincronizados
router.get('/sync/devices', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const devices = await prisma.syncData.findMany({
      where: { userId },
      select: {
        deviceId: true,
        lastModified: true,
        key: true
      },
      distinct: ['deviceId']
    });

    res.json({ devices });
  } catch (error) {
    console.error('Devices list error:', error);
    res.status(500).json({ error: 'Failed to list devices' });
  }
});

// Resolver conflitos de sincronização
router.post('/sync/resolve-conflict/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    const { data, deviceId, forceOverwrite } = req.body;
    const userId = req.user.id;

    if (forceOverwrite) {
      // Sobrescrever dados existentes
      await prisma.syncData.upsert({
        where: {
          userId_key: {
            userId,
            key
          }
        },
        update: {
          data: JSON.stringify(data),
          deviceId,
          lastModified: new Date(),
          updatedAt: new Date()
        },
        create: {
          userId,
          key,
          data: JSON.stringify(data),
          deviceId,
          lastModified: new Date()
        }
      });

      res.json({ success: true, message: 'Conflict resolved by overwriting' });
    } else {
      // Retornar dados atuais para merge manual
      const currentData = await prisma.syncData.findUnique({
        where: {
          userId_key: {
            userId,
            key
          }
        }
      });

      res.json({
        currentData: currentData ? JSON.parse(currentData.data) : null,
        lastModified: currentData?.lastModified,
        deviceId: currentData?.deviceId
      });
    }
  } catch (error) {
    console.error('Conflict resolution error:', error);
    res.status(500).json({ error: 'Failed to resolve conflict' });
  }
});

export default router;