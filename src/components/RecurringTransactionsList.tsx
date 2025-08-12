
import React from 'react';
import { Button } from './ui/button';
import { RecurringTransaction } from '../hooks/useRecurringTransactions';
import { formatCurrency } from '../utils/currencyUtils';
import { Trash2, Edit, Plus } from 'lucide-react';

interface RecurringTransactionsListProps {
  transactions: RecurringTransaction[];
  onEdit: (transaction: RecurringTransaction) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
}

const RecurringTransactionsList: React.FC<RecurringTransactionsListProps> = ({
  transactions,
  onEdit,
  onToggleActive,
  onDelete,
  onAddNew
}) => {
  const getFrequencyLabel = (transaction: RecurringTransaction) => {
    switch (transaction.frequency) {
      case 'until-cancelled':
        return 'Até cancelar';
      case 'fixed-count':
        return `${transaction.remainingCount || 0} vezes restantes`;
      case 'monthly-duration':
        return `${transaction.remainingMonths || 0} meses restantes`;
      default:
        return 'Indefinido';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Transações Cadastradas</h3>
        <Button
          onClick={onAddNew}
          className="bg-green-500 hover:bg-green-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Recorrência
        </Button>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Nenhuma transação recorrente cadastrada.</p>
          <p className="text-sm mt-2">
            ⚠️ Evite lançar entradas e saídas incertas ou bônus futuros
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className={`border rounded-lg p-4 relative ${
                transaction.isActive 
                  ? 'bg-white border-green-200' 
                  : 'bg-gray-50 border-gray-300 opacity-75'
              }`}
            >
              {/* Indicador de Status */}
              <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
                transaction.isActive ? 'bg-green-500' : 'bg-gray-400'
              }`} title={transaction.isActive ? 'Ativo' : 'Pausado'} />
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        transaction.type === 'entrada'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {transaction.type === 'entrada' ? '📈 Entrada' : '📉 Saída'}
                    </span>
                    <span className="font-semibold text-lg">
                      {formatCurrency(transaction.amount)}
                    </span>
                    <span className="text-gray-600">
                      📅 Dia {transaction.dayOfMonth}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      transaction.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {transaction.isActive ? '✅ Ativo' : '⏸️ Pausado'}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-1 font-medium">{transaction.description}</p>
                  <p className="text-sm text-gray-500 mb-2">
                    🔄 {getFrequencyLabel(transaction)}
                  </p>
                  {!transaction.isActive && (
                    <p className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                      ⚠️ Pausado - não gerará novos lançamentos
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(transaction)}
                    className="text-blue-600 hover:text-blue-700"
                    title="Editar recorrência"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={transaction.isActive ? "outline" : "default"}
                    size="sm"
                    onClick={() => onToggleActive(transaction.id, transaction.isActive)}
                    className={transaction.isActive ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
                    title={transaction.isActive ? "Pausar recorrência" : "Reativar recorrência"}
                  >
                    {transaction.isActive ? '⏸️ Pausar' : '▶️ Ativar'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(transaction.id)}
                    className="text-red-600 hover:text-red-700"
                    title="Cancelar ou excluir recorrência"
                  >
                    <Trash2 className="w-4 h-4" />
                    Gerenciar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecurringTransactionsList;
