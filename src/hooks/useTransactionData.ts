import { useMemo } from 'react';
import { TransactionEntry } from '../types/transactions';

// Hook especializado para cálculos de dados
export const useTransactionData = (
  transactions: TransactionEntry[],
  selectedYear: number
) => {
  // Otimizar cálculo de dados com cache inteligente
  const data = useMemo(() => {
    const result: any = {};
    
    // Processar apenas ano selecionado para performance
    const yearTransactions = transactions.filter(t => 
      t.date.startsWith(selectedYear.toString())
    );
    
    if (yearTransactions.length === 0) {
      // Retornar estrutura vazia se não há transações
      result[selectedYear] = {};
      for (let month = 0; month < 12; month++) {
        result[selectedYear][month] = {};
      }
      return result;
    }
    
    // Agrupar por mês para otimização
    const transactionsByMonth = new Map<string, TransactionEntry[]>();
    yearTransactions.forEach(t => {
      const monthKey = t.date.substring(0, 7); // YYYY-MM
      if (!transactionsByMonth.has(monthKey)) {
        transactionsByMonth.set(monthKey, []);
      }
      transactionsByMonth.get(monthKey)!.push(t);
    });
    
    result[selectedYear] = {};
    
    for (let month = 0; month < 12; month++) {
      const monthKey = `${selectedYear}-${String(month + 1).padStart(2, '0')}`;
      const monthTransactions = transactionsByMonth.get(monthKey) || [];
      
      result[selectedYear][month] = {};
      
      const daysInMonth = new Date(selectedYear, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${monthKey}-${String(day).padStart(2, '0')}`;
        const dayTransactions = monthTransactions.filter(t => t.date === dateKey);
        
        let entrada = 0, saida = 0, diario = 0, balance = 0;
        
        dayTransactions.forEach(t => {
          switch (t.type) {
            case 'entrada': entrada += t.amount; break;
            case 'saida': saida += t.amount; break;
            case 'diario': diario += t.amount; break;
          }
        });
        
        // Calcular saldo apenas se necessário
        if (entrada > 0 || saida > 0 || diario > 0) {
          const allUpToDay = transactions.filter(t => t.date <= dateKey);
          balance = allUpToDay.reduce((sum, t) => {
            switch (t.type) {
              case 'entrada': return sum + t.amount;
              case 'saida': return sum - t.amount;
              case 'diario': return sum - t.amount;
              default: return sum;
            }
          }, 0);
        }
        
        result[selectedYear][month][day] = {
          entrada: entrada === 0 ? 'R$ 0,00' : `R$ ${entrada.toFixed(2).replace('.', ',')}`,
          saida: saida === 0 ? 'R$ 0,00' : `R$ ${saida.toFixed(2).replace('.', ',')}`,
          diario: diario === 0 ? 'R$ 0,00' : `R$ ${diario.toFixed(2).replace('.', ',')}`,
          balance
        };
      }
    }
    
    return result;
  }, [transactions, selectedYear]);
  
  return data;
};