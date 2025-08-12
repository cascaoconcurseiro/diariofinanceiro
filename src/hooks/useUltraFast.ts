import { useState, useEffect, useCallback, useMemo } from 'react';
import { ultraCache } from '../utils/ultraCache';
import { encryptData, decryptData } from '../utils/ultraSecurity';

// Hook ultra-otimizado para performance máxima
export const useUltraFast = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Inicializar cache
  useEffect(() => {
    ultraCache.init().then(() => {
      loadData();
    });
  }, []);

  // Carregar dados com cache inteligente
  const loadData = useCallback(async () => {
    setIsLoading(true);
    
    // Tentar cache primeiro (ultra-rápido)
    let data = await ultraCache.get('transactions');
    
    if (!data) {
      // Carregar do localStorage com descriptografia
      const encrypted = localStorage.getItem('unifiedFinancialData');
      if (encrypted) {
        try {
          const decrypted = await decryptData(encrypted);
          data = JSON.parse(decrypted);
          
          // Salvar no cache para próxima vez
          await ultraCache.set('transactions', data);
        } catch (error) {
          console.error('Erro ao descriptografar dados:', error);
          data = [];
        }
      } else {
        data = [];
      }
    }
    
    setTransactions(data);
    setIsLoading(false);
  }, []);

  // Salvar dados com criptografia e cache
  const saveData = useCallback(async (newTransactions: any[]) => {
    setTransactions(newTransactions);
    
    // Salvar no cache (imediato)
    await ultraCache.set('transactions', newTransactions);
    
    // Salvar criptografado no localStorage (background)
    setTimeout(async () => {
      try {
        const encrypted = await encryptData(JSON.stringify(newTransactions));
        localStorage.setItem('unifiedFinancialData', encrypted);
      } catch (error) {
        console.error('Erro ao criptografar dados:', error);
      }
    }, 0);
  }, []);

  // Adicionar transação (ultra-rápido)
  const addTransaction = useCallback((transaction: any) => {
    const newTransactions = [...transactions, {
      ...transaction,
      id: `txn_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }];
    
    saveData(newTransactions);
    return newTransactions[newTransactions.length - 1].id;
  }, [transactions, saveData]);

  // Deletar transação (ultra-rápido)
  const deleteTransaction = useCallback((id: string) => {
    const newTransactions = transactions.filter(t => t.id !== id);
    saveData(newTransactions);
    return true;
  }, [transactions, saveData]);

  // Cálculos memoizados para performance
  const monthlyTotals = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Calcular apenas mês atual para performance
    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    return monthTransactions.reduce((acc, t) => {
      switch (t.type) {
        case 'entrada': acc.entradas += t.amount; break;
        case 'saida': acc.saidas += t.amount; break;
        case 'diario': acc.diario += t.amount; break;
      }
      return acc;
    }, { entradas: 0, saidas: 0, diario: 0 });
  }, [transactions]);

  return {
    transactions,
    isLoading,
    addTransaction,
    deleteTransaction,
    monthlyTotals,
    refreshData: loadData
  };
};