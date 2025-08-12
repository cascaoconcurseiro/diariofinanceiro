
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { RecurringTransaction } from '../hooks/useRecurringTransactions';
import { parseCurrency } from '../utils/currencyUtils';
import RecurringTransactionsList from './RecurringTransactionsList';
import RecurringTransactionForm from './RecurringTransactionForm';
import RecurringDeleteConfirmation from './RecurringDeleteConfirmation';
import { useToast } from './ui/use-toast';

interface RecurringTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<RecurringTransaction, 'id' | 'createdAt' | 'startDate'>) => void;
  onUpdate: (id: string, updates: Partial<RecurringTransaction>) => void;
  onDeleteComplete: (id: string) => { recurringDeleted: boolean; transactionsDeleted: number };
  onCancelRecurring: (id: string) => { recurringCancelled: boolean; futureTransactionsRemoved: number };
  currentTransactions: RecurringTransaction[];
}

interface FormData {
  type: 'entrada' | 'saida';
  amount: string;
  description: string;
  dayOfMonth: string;
  frequency: 'until-cancelled' | 'fixed-count' | 'monthly-duration';
  remainingCount: string;
  monthsDuration: string;
}

const RecurringTransactionsModal: React.FC<RecurringTransactionsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  onDeleteComplete,
  onCancelRecurring,
  currentTransactions
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<RecurringTransaction | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<RecurringTransaction | null>(null);
  const { toast } = useToast();

  const handleSubmit = (data: FormData) => {
    const transactionData = {
      type: data.type,
      amount: parseCurrency(data.amount),
      description: data.description,
      dayOfMonth: parseInt(data.dayOfMonth),
      frequency: data.frequency,
      remainingCount: data.frequency === 'fixed-count' ? parseInt(data.remainingCount) : undefined,
      monthsDuration: data.frequency === 'monthly-duration' ? parseInt(data.monthsDuration) : undefined,
      remainingMonths: data.frequency === 'monthly-duration' ? parseInt(data.monthsDuration) : undefined,
      isActive: true
    };

    if (editingTransaction) {
      onUpdate(editingTransaction.id, transactionData);
    } else {
      onSave(transactionData);
    }
    
    handleCancelEdit();
  };

  const handleEdit = (transaction: RecurringTransaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleAddNew = () => {
    setEditingTransaction(null);
    setShowForm(true);
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    onUpdate(id, { isActive: !isActive });
  };

  // ✅ SISTEMA DE EXCLUSÃO INTELIGENTE
  const handleDelete = (id: string) => {
    const transaction = currentTransactions.find(t => t.id === id);
    if (!transaction) return;

    setTransactionToDelete(transaction);
    setShowDeleteConfirmation(true);
  };

  const handleCancelRecurringConfirmed = () => {
    if (!transactionToDelete) return;

    try {
      const result = onCancelRecurring(transactionToDelete.id);
      
      toast({
        title: "Recorrência Cancelada",
        description: `"${transactionToDelete.description}" cancelada. ${result.futureTransactionsRemoved} lançamentos futuros removidos.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao cancelar a recorrência.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCompleteConfirmed = () => {
    if (!transactionToDelete) return;

    try {
      const result = onDeleteComplete(transactionToDelete.id);
      
      toast({
        title: "Exclusão Completa Realizada",
        description: `Recorrente e ${result.transactionsDeleted} lançamentos removidos permanentemente.`,
        variant: "destructive"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha na exclusão completa.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            🔄 Lançamentos Recorrentes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <RecurringTransactionsList
            transactions={currentTransactions}
            onEdit={handleEdit}
            onToggleActive={handleToggleActive}
            onDelete={handleDelete}
            onAddNew={handleAddNew}
          />

          {showForm && (
            <RecurringTransactionForm
              onSubmit={handleSubmit}
              onCancel={handleCancelEdit}
              editingTransaction={editingTransaction}
            />
          )}
        </div>

        <RecurringDeleteConfirmation
          isOpen={showDeleteConfirmation}
          onClose={() => {
            setShowDeleteConfirmation(false);
            setTransactionToDelete(null);
          }}
          transactionName={transactionToDelete?.description || ''}
          onCancel={handleCancelRecurringConfirmed}
          onDeleteComplete={handleDeleteCompleteConfirmed}
        />
      </DialogContent>
    </Dialog>
  );
};

export default RecurringTransactionsModal;
