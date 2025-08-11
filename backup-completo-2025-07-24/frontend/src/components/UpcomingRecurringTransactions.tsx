import React from 'react';
import { RecurringTransaction } from '../hooks/useRecurringTransactions';
import { calculateUpcomingRecurringDates, formatRecurringDate } from '../utils/recurringDateCalculator';
import { formatCurrency } from '../utils/currencyUtils';

interface UpcomingRecurringTransactionsProps {
  transactions: RecurringTransaction[];
  monthsAhead?: number;
}

const UpcomingRecurringTransactions: React.FC<UpcomingRecurringTransactionsProps> = ({
  transactions,
  monthsAhead = 3
}) => {
  const activeTransactions = transactions.filter(t => t.isActive);
  
  if (activeTransactions.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          📅 Próximos Lançamentos Recorrentes
        </h3>
        <p className="text-gray-500">Nenhum lançamento recorrente ativo.</p>
      </div>
    );
  }

  // Calcular próximas execuções para cada transação
  const upcomingExecutions = activeTransactions.flatMap(transaction => {
    const dates = calculateUpcomingRecurringDates(
      { dayOfMonth: transaction.dayOfMonth },
      monthsAhead
    );
    
    return dates.map(date => ({
      transaction,
      date,
      sortKey: date.getTime()
    }));
  }).sort((a, b) => a.sortKey - b.sortKey);

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        📅 Próximos Lançamentos Recorrentes
      </h3>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {upcomingExecutions.slice(0, 10).map((execution, index) => {
          const { transaction, date } = execution;
          const isIncome = transaction.type === 'entrada';
          
          return (
            <div
              key={`${transaction.id}-${date.getTime()}`}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  isIncome ? 'bg-green-500' : 'bg-red-500'
                }`} />
                
                <div>
                  <p className="font-medium text-gray-800">
                    {transaction.description}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatRecurringDate(date)} • Dia {transaction.dayOfMonth}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className={`font-semibold ${
                  isIncome ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
                </p>
                <p className="text-xs text-gray-400">
                  {transaction.frequency === 'until-cancelled' ? 'Contínuo' :
                   transaction.frequency === 'fixed-count' ? `${transaction.remainingCount || 0} restantes` :
                   `${transaction.remainingMonths || 0} meses restantes`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      {upcomingExecutions.length > 10 && (
        <p className="text-sm text-gray-500 mt-3 text-center">
          E mais {upcomingExecutions.length - 10} execuções...
        </p>
      )}
      
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            {activeTransactions.length} lançamento{activeTransactions.length !== 1 ? 's' : ''} ativo{activeTransactions.length !== 1 ? 's' : ''}
          </span>
          <span className="text-gray-600">
            Próximos {monthsAhead} meses
          </span>
        </div>
      </div>
    </div>
  );
};

export default UpcomingRecurringTransactions;