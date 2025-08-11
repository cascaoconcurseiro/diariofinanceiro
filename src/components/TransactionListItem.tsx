import React from 'react';
import { Button } from './ui/button';
import { Edit, Trash2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '../utils/currencyUtils';
import { TransactionEntry } from '../types/transactions';

interface TransactionListItemProps {
  transaction: TransactionEntry;
  onEdit: (transaction: TransactionEntry) => void;
  onDelete: (transactionId: string, isRecurring: boolean) => void;
  isRecurring: boolean;
}

const TransactionListItem: React.FC<TransactionListItemProps> = ({
  transaction,
  onEdit,
  onDelete,
  isRecurring
}) => {
  // Double check if transaction is actually recurring
  const actuallyRecurring = isRecurring || transaction.isRecurring || transaction.source === 'recurring' || !!transaction.recurringId;
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'entrada': return 'text-green-600 bg-green-50 border-green-200';
      case 'saida': return 'text-red-600 bg-red-50 border-red-200';
      case 'diario': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
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

  const getSourceIcon = (source: string, isRecurring: boolean) => {
    if (isRecurring) return '🔄';
    switch (source) {
      case 'manual': return '✏️';
      case 'quick-entry': return '⚡';
      case 'recurring': return '🔄';
      default: return '📝';
    }
  };

  return (
    <div className={cn(
      "flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-md",
      actuallyRecurring ? "bg-orange-50 border-orange-200" : "bg-white border-gray-200"
    )}>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn("px-3 py-1 rounded-full text-xs font-medium border", getTypeColor(transaction.type))}>
            {getTypeLabel(transaction.type)}
          </span>
          <span className="font-semibold text-lg">{formatCurrency(transaction.amount)}</span>
          <span className="text-lg" title={actuallyRecurring ? 'Transação Recorrente' : `Origem: ${transaction.source}`}>
            {getSourceIcon(transaction.source, actuallyRecurring)}
          </span>
          {actuallyRecurring && (
            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
              RECORRENTE
            </span>
          )}
        </div>
        {transaction.description && (
          <p className="text-sm text-gray-600 mb-1">{transaction.description}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>ID: {transaction.id.slice(-8)}</span>
          <span>Criado: {new Date(transaction.createdAt).toLocaleString('pt-BR')}</span>
          {transaction.source === 'recurring' && transaction.recurringId && (
            <span>Recorrente ID: {transaction.recurringId.slice(-8)}</span>
          )}
        </div>
      </div>
      <div className="flex gap-2 ml-4">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEdit(transaction)}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          title="Editar transação"
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(transaction.id, actuallyRecurring)}
          className={cn(
            "hover:bg-red-50",
            actuallyRecurring ? "text-orange-600 hover:text-orange-700" : "text-red-600 hover:text-red-700"
          )}
          title={actuallyRecurring ? "Excluir apenas desta data (Recorrente)" : "Excluir transação"}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default TransactionListItem;