
import { useState, useEffect, useCallback } from 'react';
import { formatCurrency, parseCurrency } from '../utils/currencyUtils';
import { useBalancePropagation } from './useBalancePropagation';
import { 
  canProcessTransaction, 
  startProcessingTransaction, 
  finishProcessingTransaction,
  cancelProcessingTransaction
} from '../utils/transactionControl';

export interface DayData {
  entrada: string;
  saida: string;
  diario: string;
  balance: number;
}

export interface FinancialData {
  [year: string]: {
    [month: string]: {
      [day: string]: DayData;
    };
  };
}

export const useFinancialData = () => {
  const [data, setData] = useState<FinancialData>({});
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

  const { recalculateBalances } = useBalancePropagation();

  // Load data from localStorage on mount - CORRIGIDO: melhor tratamento de erros
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('financialData');
      if (savedData && savedData.trim() !== '') {
        const parsed = JSON.parse(savedData);
        // CORRIGIDO: Validação adicional do formato dos dados
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          console.log('💾 Loading financial data from localStorage');
          setData(parsed);
        } else {
          console.warn('⚠️ Invalid financial data format, resetting');
          setData({});
        }
      }
    } catch (error) {
      console.error('❌ Error loading financial data:', error);
      // CORRIGIDO: Limpar dados corrompidos
      localStorage.removeItem('financialData');
      setData({});
    }
  }, []);

  // Função de limpeza automática de dados antigos
  const cleanupOldDataIfNeeded = useCallback((newData: FinancialData): FinancialData => {
    try {
      const dataString = JSON.stringify(newData);
      const sizeInMB = new Blob([dataString]).size / (1024 * 1024);
      
      // Se dados excedem 3MB, fazer limpeza
      if (sizeInMB > 3) {
        console.log(`🧹 Data size ${sizeInMB.toFixed(2)}MB - cleaning up old data`);
        
        const currentYear = new Date().getFullYear();
        const cleanedData: FinancialData = {};
        
        // Manter apenas últimos 3 anos
        Object.keys(newData).forEach(yearStr => {
          const year = parseInt(yearStr);
          if (year >= currentYear - 2) {
            cleanedData[yearStr] = newData[yearStr];
          }
        });
        
        console.log(`✅ Cleaned data: ${Object.keys(newData).length} → ${Object.keys(cleanedData).length} years`);
        return cleanedData;
      }
      
      return newData;
    } catch (error) {
      console.error('❌ Error in cleanup:', error);
      return newData;
    }
  }, []);

  // Save data to localStorage - CORRIGIDO: com proteção contra overflow e limpeza automática
  useEffect(() => {
    if (Object.keys(data).length === 0) return;
    
    try {
      // Limpar dados antigos se necessário
      const cleanedData = cleanupOldDataIfNeeded(data);
      
      const dataString = JSON.stringify(cleanedData);
      
      // Verificar quota antes de salvar
      if (dataString.length > 4 * 1024 * 1024) { // 4MB
        console.error('❌ Data too large for localStorage');
        // Forçar limpeza mais agressiva
        const currentYear = new Date().getFullYear();
        const emergencyCleanData = { [currentYear]: cleanedData[currentYear] };
        localStorage.setItem('financialData', JSON.stringify(emergencyCleanData));
        console.log('🚨 Emergency cleanup: kept only current year data');
      } else {
        localStorage.setItem('financialData', dataString);
        console.log('💾 Financial data saved successfully');
      }
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('❌ localStorage quota exceeded - emergency cleanup');
        // Manter apenas ano atual
        const currentYear = new Date().getFullYear();
        const emergencyData = { [currentYear]: data[currentYear] };
        try {
          localStorage.setItem('financialData', JSON.stringify(emergencyData));
          console.log('🚨 Emergency cleanup successful: kept only current year');
        } catch (secondError) {
          console.error('❌ Critical: Cannot save even current year data');
          // Limpar completamente se necessário
          localStorage.removeItem('financialData');
        }
      } else {
        console.error('❌ Error saving financial data:', error);
      }
    }
  }, [data, cleanupOldDataIfNeeded]);

  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const initializeMonth = useCallback((year: number, month: number): void => {
    console.log(`🏗️ Initializing month ${month + 1}/${year}`);
    
    setData(prevData => {
      const newData = { ...prevData };
      
      if (!newData[year]) {
        newData[year] = {};
      }
      
      if (!newData[year][month]) {
        newData[year][month] = {};
        const daysInMonth = getDaysInMonth(year, month);
        
        for (let day = 1; day <= daysInMonth; day++) {
          newData[year][month][day] = {
            entrada: "R$ 0,00",
            saida: "R$ 0,00",
            diario: "R$ 0,00",
            balance: 0
          };
        }
        
        // CRÍTICO: Recalcular saldos após inicialização para propagar corretamente
        console.log(`🔄 CRITICAL: Recalculating balances after month initialization for ${year}-${month + 1}`);
        const recalculatedData = recalculateBalances(newData, year, month, 1);
        return recalculatedData;
      }
      
      return newData;
    });
  }, [recalculateBalances]);

  const addToDay = useCallback((year: number, month: number, day: number, type: 'entrada' | 'saida' | 'diario', amount: number, source: string = 'manual'): void => {
    console.log(`💰 CRITICAL: Adding ${amount} to ${type} on ${year}-${month+1}-${day} from ${source}`);
    
    // CRÍTICO: Verificar se pode processar esta transação
    const { canProcess, transactionId, reason } = canProcessTransaction(year, month, day, type, amount, source);
    
    if (!canProcess) {
      console.warn(`⚠️ Transaction blocked: ${reason} - ${transactionId}`);
      return;
    }
    
    // Iniciar processamento
    const processingId = startProcessingTransaction(year, month, day, type, amount, source);
    
    try {
      setData(prevData => {
        const newData = { ...prevData };
        
        // Initialize structures if needed
        if (!newData[year]) newData[year] = {};
        if (!newData[year][month]) newData[year][month] = {};
        if (!newData[year][month][day]) {
          newData[year][month][day] = {
            entrada: "R$ 0,00",
            saida: "R$ 0,00",
            diario: "R$ 0,00",
            balance: 0
          };
        }
        
        // Add to existing value
        const currentValue = parseCurrency(newData[year][month][day][type]);
        const newValue = currentValue + amount;
        newData[year][month][day][type] = formatCurrency(newValue);
        
        console.log(`✅ CRITICAL: Updated ${type}: ${formatCurrency(currentValue)} + ${formatCurrency(amount)} = ${formatCurrency(newValue)} [${processingId}]`);
        
        // CRITICAL: IMMEDIATE RECALCULATION INSIDE setData
        const recalculatedData = recalculateBalances(newData, year, month, day);
        console.log(`🔄 CRITICAL: Balances recalculated for impact on summaries [${processingId}]`);
        
        return recalculatedData;
      });
      
      // Finalizar processamento
      finishProcessingTransaction(year, month, day, type, amount, source);
      
    } catch (error) {
      console.error(`❌ Error processing transaction: ${error}`);
      // Cancelar processamento em caso de erro
      cancelProcessingTransaction(year, month, day, type, amount, source);
    }
  }, [recalculateBalances]);

  // FUNÇÃO CRÍTICA: updateDayData com recálculo AUTOMÁTICO e IMEDIATO
  const updateDayData = useCallback((year: number, month: number, day: number, field: keyof Omit<DayData, 'balance'>, value: string): void => {
    const numericValue = parseCurrency(value);
    const formattedValue = formatCurrency(numericValue);
    
    console.log(`📝 CRITICAL UPDATE: ${year}-${month+1}-${day} ${field} = ${formattedValue}`);
    
    // CRÍTICO: Verificar se pode processar esta atualização
    const { canProcess, transactionId, reason } = canProcessTransaction(year, month, day, field, numericValue, 'update');
    
    if (!canProcess) {
      console.warn(`⚠️ Update blocked: ${reason} - ${transactionId}`);
      return;
    }
    
    // Iniciar processamento
    const processingId = startProcessingTransaction(year, month, day, field, numericValue, 'update');
    
    try {
      setData(prevData => {
        const newData = JSON.parse(JSON.stringify(prevData)); // Deep clone para evitar mutação
        
        // Garantir estrutura existe
        if (!newData[year]) newData[year] = {};
        if (!newData[year][month]) newData[year][month] = {};
        if (!newData[year][month][day]) {
          newData[year][month][day] = {
            entrada: "R$ 0,00",
            saida: "R$ 0,00",
            diario: "R$ 0,00",
            balance: 0
          };
        }
        
        // Atualizar o valor
        newData[year][month][day][field] = formattedValue;
        
        // CRÍTICO: Recalcular IMEDIATAMENTE a partir deste ponto
        console.log(`🔄 IMMEDIATE recalculation starting from ${year}-${month+1}-${day} [${processingId}]`);
        
        // Recalcular todos os saldos a partir deste ponto
        const recalculatedData = recalculateBalances(newData, year, month, day);
        
        console.log(`✅ IMMEDIATE recalculation completed [${processingId}]`);
        return recalculatedData;
      });
      
      // Finalizar processamento
      finishProcessingTransaction(year, month, day, field, numericValue, 'update');
      
    } catch (error) {
      console.error(`❌ Error updating day data: ${error}`);
      // Cancelar processamento em caso de erro
      cancelProcessingTransaction(year, month, day, field, numericValue, 'update');
    }
  }, [recalculateBalances]);

  // Função principal de recálculo manual (se necessário)
  const triggerCompleteRecalculation = useCallback((startYear?: number, startMonth?: number, startDay?: number): void => {
    console.log(`🧮 Manual trigger for complete recalculation`);
    
    setData(prevData => {
      const recalculatedData = recalculateBalances(prevData, startYear, startMonth, startDay);
      return recalculatedData;
    });
  }, [recalculateBalances]);

  const getMonthlyTotals = useCallback((year: number, month: number) => {
    // SOLUÇÃO SENIOR: Implementação completamente nova e robusta
    
    // Validação básica
    if (!data || typeof data !== 'object') {
      return { totalEntradas: 0, totalSaidas: 0, totalDiario: 0, saldoFinal: 0 };
    }
    
    if (!data[year] || typeof data[year] !== 'object') {
      return { totalEntradas: 0, totalSaidas: 0, totalDiario: 0, saldoFinal: 0 };
    }
    
    if (!data[year][month] || typeof data[year][month] !== 'object') {
      return { totalEntradas: 0, totalSaidas: 0, totalDiario: 0, saldoFinal: 0 };
    }
    
    // Implementação robusta com tratamento de erro individual
    let totalEntradas = 0;
    let totalSaidas = 0;
    let totalDiario = 0;
    let saldoFinal = 0;
    
    const monthData = data[year][month];
    
    // Processar cada dia individualmente com try-catch
    for (const dayKey in monthData) {
      try {
        const dayNum = parseInt(dayKey);
        if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) continue;
        
        const dayData = monthData[dayKey];
        if (!dayData || typeof dayData !== 'object') continue;
        
        // Parse individual com fallback
        let entradaValue = 0;
        let saidaValue = 0;
        let diarioValue = 0;
        
        try {
          entradaValue = parseCurrency(dayData.entrada || 'R$ 0,00');
          if (isNaN(entradaValue) || !isFinite(entradaValue)) entradaValue = 0;
        } catch { entradaValue = 0; }
        
        try {
          saidaValue = parseCurrency(dayData.saida || 'R$ 0,00');
          if (isNaN(saidaValue) || !isFinite(saidaValue)) saidaValue = 0;
        } catch { saidaValue = 0; }
        
        try {
          diarioValue = parseCurrency(dayData.diario || 'R$ 0,00');
          if (isNaN(diarioValue) || !isFinite(diarioValue)) diarioValue = 0;
        } catch { diarioValue = 0; }
        
        // Acumular com verificação de overflow
        if (Math.abs(totalEntradas + entradaValue) < 999999999) {
          totalEntradas += entradaValue;
        }
        if (Math.abs(totalSaidas + saidaValue) < 999999999) {
          totalSaidas += saidaValue;
        }
        if (Math.abs(totalDiario + diarioValue) < 999999999) {
          totalDiario += diarioValue;
        }
        
        // Saldo final (último dia válido)
        if (typeof dayData.balance === 'number' && isFinite(dayData.balance)) {
          saldoFinal = dayData.balance;
        }
        
      } catch (dayError) {
        // Ignorar dias com erro e continuar
        continue;
      }
    }
    
    // Garantir precisão final
    totalEntradas = Math.round((totalEntradas || 0) * 100) / 100;
    totalSaidas = Math.round((totalSaidas || 0) * 100) / 100;
    totalDiario = Math.round((totalDiario || 0) * 100) / 100;
    saldoFinal = Math.round((saldoFinal || 0) * 100) / 100;
    
    // Validação final
    if (isNaN(totalEntradas) || !isFinite(totalEntradas)) totalEntradas = 0;
    if (isNaN(totalSaidas) || !isFinite(totalSaidas)) totalSaidas = 0;
    if (isNaN(totalDiario) || !isFinite(totalDiario)) totalDiario = 0;
    if (isNaN(saldoFinal) || !isFinite(saldoFinal)) saldoFinal = 0;
    
    return {
      totalEntradas,
      totalSaidas,
      totalDiario,
      saldoFinal
    };
  }, [data]);

  const getYearlyTotals = useCallback((year: number) => {
    // DEFINITIVO: Validação robusta para totais anuais
    if (!data || !data[year]) {
      return {
        totalEntradas: 0,
        totalSaidas: 0,
        totalDiario: 0,
        saldoFinal: 0
      };
    }
    
    let totalEntradas = 0;
    let totalSaidas = 0;
    let totalDiario = 0;
    let saldoFinal = 0;
    
    try {
      // Processar todos os 12 meses
      for (let month = 0; month < 12; month++) {
        const monthlyTotals = getMonthlyTotals(year, month);
        
        totalEntradas += monthlyTotals.totalEntradas;
        totalSaidas += monthlyTotals.totalSaidas;
        totalDiario += monthlyTotals.totalDiario;
        
        // Saldo final é sempre o último mês com dados
        if (data[year][month] && monthlyTotals.saldoFinal !== 0) {
          saldoFinal = monthlyTotals.saldoFinal;
        }
      }
      
      // CRÍTICO: Garantir precisão decimal final
      totalEntradas = Math.round(totalEntradas * 100) / 100;
      totalSaidas = Math.round(totalSaidas * 100) / 100;
      totalDiario = Math.round(totalDiario * 100) / 100;
      saldoFinal = Math.round(saldoFinal * 100) / 100;
      
    } catch (error) {
      console.error('Error in getYearlyTotals:', error);
      return {
        totalEntradas: 0,
        totalSaidas: 0,
        totalDiario: 0,
        saldoFinal: 0
      };
    }
    
    return {
      totalEntradas,
      totalSaidas,
      totalDiario,
      saldoFinal
    };
  }, [getMonthlyTotals, data]);

  return {
    data,
    selectedYear,
    selectedMonth,
    setSelectedYear,
    setSelectedMonth,
    updateDayData,
    addToDay,
    initializeMonth,
    getMonthlyTotals,
    getYearlyTotals,
    getDaysInMonth,
    formatCurrency,
    recalculateBalances: triggerCompleteRecalculation
  };
};
