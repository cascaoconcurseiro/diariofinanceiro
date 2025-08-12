import { useState, useEffect, useCallback } from 'react';
import { useUltraFast } from './useUltraFast';
import { realTimeSync } from '../utils/realTimeSync';
import { encryptData, decryptData } from '../utils/ultraSecurity';

// Hook com sincronização real-time entre dispositivos
export const useSyncedFinancial = () => {
  const { transactions, isLoading, addTransaction: addLocal, deleteTransaction: deleteLocal, monthlyTotals } = useUltraFast();
  const [syncStatus, setSyncStatus] = useState<'connected' | 'disconnected' | 'syncing'>('disconnected');
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Monitorar status de conexão
  useEffect(() => {
    const checkConnection = () => {
      setSyncStatus(realTimeSync.isConnected() ? 'connected' : 'disconnected');
    };

    const interval = setInterval(checkConnection, 5000);
    checkConnection();

    return () => clearInterval(interval);
  }, []);

  // Configurar sincronização
  useEffect(() => {
    realTimeSync.onSync(async (data) => {
      setSyncStatus('syncing');
      
      try {
        switch (data.type) {
          case 'transaction':
            if (data.action === 'add') {
              // Descriptografar dados recebidos
              const decryptedData = await decryptData(data.data.encrypted);
              const transaction = JSON.parse(decryptedData);
              
              // Verificar se já existe (evitar duplicatas)
              const exists = transactions.find(t => t.id === transaction.id);
              if (!exists) {
                addLocal(transaction);
                console.log('📱 Transação sincronizada de outro dispositivo');
              }
            } else if (data.action === 'delete') {
              deleteLocal(data.data.id);
              console.log('🗑️ Exclusão sincronizada de outro dispositivo');
            }
            break;

          case 'full_sync':
            // Sincronização completa (quando dispositivo volta online)
            console.log('🔄 Sincronização completa recebida');
            break;
        }
        
        setLastSync(new Date());
      } catch (error) {
        console.error('Erro na sincronização:', error);
      } finally {
        setSyncStatus('connected');
      }
    });
  }, [transactions, addLocal, deleteLocal]);

  // Adicionar transação com sincronização
  const addTransaction = useCallback(async (transaction: any) => {
    // Adicionar localmente primeiro (performance)
    const id = addLocal(transaction);
    
    // Sincronizar com outros dispositivos
    if (realTimeSync.isConnected()) {
      try {
        const encrypted = await encryptData(JSON.stringify({ ...transaction, id }));
        realTimeSync.syncTransaction('add', { encrypted });
      } catch (error) {
        console.error('Erro ao sincronizar adição:', error);
      }
    }
    
    return id;
  }, [addLocal]);

  // Deletar transação com sincronização
  const deleteTransaction = useCallback((id: string) => {
    // Deletar localmente primeiro
    const success = deleteLocal(id);
    
    // Sincronizar com outros dispositivos
    if (success && realTimeSync.isConnected()) {
      realTimeSync.syncTransaction('delete', { id });
    }
    
    return success;
  }, [deleteLocal]);

  // Forçar sincronização completa
  const forceSync = useCallback(async () => {
    if (realTimeSync.isConnected()) {
      setSyncStatus('syncing');
      
      try {
        // Criptografar todas as transações
        const encrypted = await encryptData(JSON.stringify(transactions));
        realTimeSync.forcSync({ encrypted });
        setLastSync(new Date());
      } catch (error) {
        console.error('Erro na sincronização forçada:', error);
      } finally {
        setSyncStatus('connected');
      }
    }
  }, [transactions]);

  return {
    transactions,
    isLoading,
    addTransaction,
    deleteTransaction,
    monthlyTotals,
    
    // Status de sincronização
    syncStatus,
    lastSync,
    forceSync,
    isConnected: realTimeSync.isConnected()
  };
};