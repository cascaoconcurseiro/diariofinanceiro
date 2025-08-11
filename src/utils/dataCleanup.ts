/**
 * SOLUÇÃO DEFINITIVA - Limpeza completa dos dados corrompidos
 */

export const clearAllFinancialData = (): void => {
  console.log('🧹 DEFINITIVO: Limpando TODOS os dados financeiros corrompidos');
  
  // Limpar dados financeiros principais
  localStorage.removeItem('financialData');
  
  // Limpar transações detalhadas
  localStorage.removeItem('detailedTransactions');
  
  // Limpar dados de recorrentes processados
  localStorage.removeItem('recurringProcessed');
  
  // Limpar qualquer cache
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.includes('financial') || key.includes('transaction') || key.includes('recurring')) {
      localStorage.removeItem(key);
      console.log('🧹 DEFINITIVO: Removed', key);
    }
  });
  
  console.log('✅ DEFINITIVO: Todos os dados financeiros foram limpos');
};

export const debugFinancialData = (): void => {
  console.log('🔍 DEFINITIVO: Debugging financial data');
  
  const financialData = localStorage.getItem('financialData');
  const detailedTransactions = localStorage.getItem('detailedTransactions');
  
  console.log('📊 Financial Data:', financialData ? JSON.parse(financialData) : 'None');
  console.log('📋 Detailed Transactions:', detailedTransactions ? JSON.parse(detailedTransactions) : 'None');
  
  // Check for phantom data
  if (financialData) {
    const parsed = JSON.parse(financialData);
    Object.keys(parsed).forEach(year => {
      Object.keys(parsed[year]).forEach(month => {
        Object.keys(parsed[year][month]).forEach(day => {
          const dayData = parsed[year][month][day];
          if (dayData.entrada !== 'R$ 0,00' || dayData.saida !== 'R$ 0,00' || dayData.diario !== 'R$ 0,00') {
            console.log(`🔍 PHANTOM DATA FOUND: ${year}-${month}-${day}:`, dayData);
          }
        });
      });
    });
  }
};