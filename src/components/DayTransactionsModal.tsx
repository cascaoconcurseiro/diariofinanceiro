import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { X, Plus, Settings, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TransactionEntry } from '../types/transactions';
import { formatCurrency } from '../utils/currencyUtils';
import { cn } from '@/lib/utils';
import RecurringInstanceModal from './RecurringInstanceModal';
import { useRecurringTransactionManager } from '../hooks/useRecurringTransactionManager';

interface DayTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  getTransactionsByDate: (date: string) => TransactionEntry[];
  onEditTransaction: (transaction: TransactionEntry) => void;
  onNavigateToQuickEntry: () => void;
  onNavigateToRecurring: () => void;
}

const DayTransactionsModal: React.FC<DayTransactionsModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  getTransactionsByDate,
  onEditTransaction,
  onNavigateToQuickEntry,
  onNavigateToRecurring
}) => {
  const [transactions, setTransactions] = useState<TransactionEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [selectedRecurringTransaction, setSelectedRecurringTransaction] = useState<TransactionEntry | null>(null);
  
  const { deleteRecurringInstance, isRecurringTransaction } = useRecurringTransactionManager();

  // SOLUÇÃO DEFINITIVA: Carregar transações IMEDIATAMENTE sem delay
  useEffect(() => {
    if (isOpen) {
      console.log('🔄 Loading transactions IMMEDIATELY for date:', format(selectedDate, 'yyyy-MM-dd'));
      
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const dayTransactions = getTransactionsByDate(dateString);
      console.log('📋 Found transactions IMMEDIATELY:', dayTransactions.length, 'for date:', dateString);
      setTransactions(dayTransactions);
      setIsLoading(false);
    } else {
      setTransactions([]);
      setIsLoading(false);
    }
  }, [isOpen, selectedDate, getTransactionsByDate]);

  // SOLUÇÃO ADICIONAL: Recarregar quando as transações mudarem externamente
  useEffect(() => {
    if (isOpen) {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const dayTransactions = getTransactionsByDate(dateString);
      setTransactions(dayTransactions);
    }
  }, [isOpen, selectedDate, getTransactionsByDate]);

  // Separar transações por tipo
  const recurringTransactions = transactions.filter(t => t.isRecurring || t.source === 'recurring');
  const manualTransactions = transactions.filter(t => !t.isRecurring && t.source !== 'recurring');

  // Calcular totais
  const totals = transactions.reduce((acc, transaction) => {
    switch (transaction.type) {
      case 'entrada':
        acc.totalEntrada += transaction.amount;
        break;
      case 'saida':
        acc.totalSaida += transaction.amount;
        break;
      case 'diario':
        acc.totalDiario += transaction.amount;
        break;
    }
    return acc;
  }, {
    totalEntrada: 0,
    totalSaida: 0,
    totalDiario: 0
  });

  const netTotal = totals.totalEntrada - totals.totalSaida - totals.totalDiario;

  // SOLUÇÃO DEFINITIVA: Usar a mesma lógica que funciona no QuickEntry
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'entrada': return 'text-green-600 bg-green-50';
      case 'saida': return 'text-red-600 bg-red-50';
      case 'diario': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'entrada': return 'Entrada';
      case 'saida': return 'Saída';
      case 'diario': return 'Diário';
      default: return type;
    }
  };

  // Lidar com edição/exclusão de transações
  const handleEditTransaction = (transaction: TransactionEntry) => {
    const isRecurring = isRecurringTransaction(transaction.id);
    
    if (isRecurring) {
      // Para recorrentes, mostrar modal de opções
      setSelectedRecurringTransaction(transaction);
      setShowRecurringModal(true);
    } else {
      // Para manuais, editar normalmente
      onEditTransaction(transaction);
    }
  };
  
  const handleDeleteInstance = (transactionId: string) => {
    console.log('🗑️ Deleting ONLY this instance:', transactionId);
    
    // Usar deleteRecurringInstance que só remove a instância específica
    const success = deleteRecurringInstance(transactionId);
    
    if (success) {
      console.log('✅ Instance deleted successfully');
      
      // Recarregar transações da data atual
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const updatedTransactions = getTransactionsByDate(dateString);
      setTransactions(updatedTransactions);
      
      // Forçar atualização da interface
      window.dispatchEvent(new Event('storage'));
    } else {
      console.error('❌ Failed to delete instance');
    }
  };

  const renderTransactionItem = (transaction: TransactionEntry) => {
    const isRecurring = transaction.isRecurring || transaction.source === 'recurring';
    
    return (
      <div
        key={transaction.id}
        className={cn(
          "flex items-center justify-between p-3 rounded-lg border transition-all hover:shadow-md",
          isRecurring ? "bg-orange-50 border-orange-200" : "bg-white border-gray-200"
        )}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getTypeColor(transaction.type))}>
              {getTypeLabel(transaction.type)}
            </span>
            <span className="font-medium">{formatCurrency(transaction.amount)}</span>
            {isRecurring && (
              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                🔄 RECORRENTE
              </span>
            )}
          </div>
          {transaction.description && (
            <p className="text-sm text-gray-600">{transaction.description}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {isRecurring ? '💡 Use o botão para gerenciar este lançamento recorrente' : '💡 Use o botão para editar esta transação'}
          </p>
        </div>
        <div className="flex items-center">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleEditTransaction(transaction);
            }}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            title={isRecurring ? 'Gerenciar recorrente' : 'Editar transação'}
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              Lançamentos de {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Resumo do dia */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-gray-600">Entradas</p>
              <p className="font-semibold text-green-600">{formatCurrency(totals.totalEntrada)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600">Saídas</p>
              <p className="font-semibold text-red-600">{formatCurrency(totals.totalSaida)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600">Diário</p>
              <p className="font-semibold text-blue-600">{formatCurrency(totals.totalDiario)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600">Saldo do Dia</p>
              <p className={`font-semibold ${netTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netTotal)}
              </p>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2 mt-4">
            <Button
              onClick={onNavigateToQuickEntry}
              className="flex items-center gap-2"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              Novo Lançamento
            </Button>
            {recurringTransactions.length > 0 && (
              <Button
                onClick={onNavigateToRecurring}
                variant="outline"
                className="flex items-center gap-2"
                size="sm"
              >
                <Settings className="w-4 h-4" />
                Gerenciar Recorrentes
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 mt-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-gray-600">Carregando transações...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum lançamento para esta data
              </h3>
              <p className="text-gray-600 mb-4">
                Adicione um novo lançamento para começar
              </p>
              <Button onClick={onNavigateToQuickEntry} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Lançamento
              </Button>
            </div>
          ) : (
            <>
              {/* Transações Recorrentes */}
              {recurringTransactions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-orange-700">
                      🔄 Transações Recorrentes ({recurringTransactions.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {recurringTransactions.map(renderTransactionItem)}
                  </div>
                </div>
              )}

              {/* Transações Manuais */}
              {manualTransactions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-gray-700">
                      ✏️ Lançamentos Manuais ({manualTransactions.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {manualTransactions.map(renderTransactionItem)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
      
      {/* Modal de Instância Recorrente */}
      {selectedRecurringTransaction && (
        <RecurringInstanceModal
          isOpen={showRecurringModal}
          onClose={() => {
            setShowRecurringModal(false);
            setSelectedRecurringTransaction(null);
          }}
          transaction={selectedRecurringTransaction}
          onDeleteInstance={handleDeleteInstance}
          onManageRecurring={onNavigateToRecurring}
        />
      )}
    </Dialog>
  );
};

export default React.memo(DayTransactionsModal);