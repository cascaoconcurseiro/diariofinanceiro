/**
 * COMPONENTE PARA GERENCIAMENTO CORRETO DE LANÇAMENTOS RECORRENTES
 * 
 * Usa a lógica correta de exclusão (mesma do QuickEntry)
 */

import React, { useState } from 'react';
import { Button } from './ui/button';
import { useRecurringTransactionManager } from '../hooks/useRecurringTransactionManager';
import RecurringTransactionsModal from './RecurringTransactionsModal';
import { RecurringTransaction } from '../hooks/useRecurringTransactions';
import { useToast } from './ui/use-toast';

const RecurringTransactionManager: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  
  const {
    recurringTransactions,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction, // CORRIGIDA
    getActiveRecurringTransactions
  } = useRecurringTransactionManager();

  const handleSave = (transactionData: Omit<RecurringTransaction, 'id' | 'createdAt' | 'startDate'>) => {
    try {
      const newTransaction = addRecurringTransaction(transactionData);
      
      toast({
        title: "Sucesso",
        description: `Lançamento recorrente "${newTransaction.description}" criado com sucesso!`
      });
      
      console.log('✅ MANAGER: Created recurring transaction:', newTransaction);
    } catch (error) {
      console.error('❌ MANAGER: Error creating recurring transaction:', error);
      toast({
        title: "Erro",
        description: "Falha ao criar o lançamento recorrente.",
        variant: "destructive"
      });
    }
  };

  const handleUpdate = (id: string, updates: Partial<RecurringTransaction>) => {
    try {
      updateRecurringTransaction(id, updates);
      
      toast({
        title: "Sucesso",
        description: "Lançamento recorrente atualizado com sucesso!"
      });
      
      console.log('✅ MANAGER: Updated recurring transaction:', id, updates);
    } catch (error) {
      console.error('❌ MANAGER: Error updating recurring transaction:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar o lançamento recorrente.",
        variant: "destructive"
      });
    }
  };

  // CORREÇÃO: Função de exclusão que usa a lógica correta
  const handleDelete = (id: string, deleteGeneratedTransactions: boolean = true) => {
    try {
      const result = deleteRecurringTransaction(id, deleteGeneratedTransactions);
      
      console.log('✅ MANAGER: Delete result:', result);
      
      return result;
    } catch (error) {
      console.error('❌ MANAGER: Error deleting recurring transaction:', error);
      throw error;
    }
  };

  const activeCount = getActiveRecurringTransactions().length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            🔄 Lançamentos Recorrentes
          </h2>
          <p className="text-sm text-gray-600">
            {activeCount} lançamento{activeCount !== 1 ? 's' : ''} ativo{activeCount !== 1 ? 's' : ''}
          </p>
        </div>
        
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Gerenciar Recorrências
        </Button>
      </div>

      <RecurringTransactionsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        onUpdate={handleUpdate}
        onDelete={handleDelete} // CORRIGIDA
        currentTransactions={recurringTransactions}
      />
    </div>
  );
};

export default RecurringTransactionManager;