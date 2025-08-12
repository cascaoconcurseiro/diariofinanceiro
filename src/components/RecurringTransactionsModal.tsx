
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { RecurringTransaction } from '../hooks/useRecurringTransactions';
import { parseCurrency } from '../utils/currencyUtils';
import RecurringTransactionsList from './RecurringTransactionsList';
import RecurringTransactionForm from './RecurringTransactionForm';
import { useToast } from './ui/use-toast';

interface RecurringTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<RecurringTransaction, 'id' | 'createdAt' | 'startDate'>) => void;
  onUpdate: (id: string, updates: Partial<RecurringTransaction>) => void;
  onDelete: (id: string, deleteGeneratedTransactions?: boolean) => { recurringDeleted: boolean; transactionsDeleted: number };
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
  onDelete,
  currentTransactions
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<RecurringTransaction | null>(null);
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

  // ✅ EXCLUSÃO COMPLETA: Recorrente + todas as instâncias
  const handleDelete = (id: string) => {
    const transaction = currentTransactions.find(t => t.id === id);
    if (!transaction) return;

    const confirmMessage = `Excluir completamente "${transaction.description}"?\n\n` +
      `⚠️ ATENÇÃO: Isso removerá:\n` +
      `• O lançamento recorrente\n` +
      `• TODOS os lançamentos já gerados\n` +
      `• Não gerará mais nos próximos meses\n\n` +
      `Para pausar sem deletar, use "Pausar".`;

    if (window.confirm(confirmMessage)) {
      try {
        const result = onDelete(id, true);
        
        toast({
          title: "Sucesso",
          description: `Recorrente excluído! ${result.transactionsDeleted} lançamentos removidos.`,
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Falha ao excluir o lançamento recorrente.",
          variant: "destructive"
        });
      }
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
      </DialogContent>
    </Dialog>
  );
};

export default RecurringTransactionsModal;
