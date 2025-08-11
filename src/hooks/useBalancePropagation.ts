
import { useCallback } from 'react';
import { FinancialData } from './useFinancialData';
import { parseCurrency, calculateBalance } from '../utils/currencyUtils';
// validateAmount removido - não usado neste arquivo

export const useBalancePropagation = () => {
  // Função para obter o saldo do último dia disponível de dezembro
  const getLastDecemberBalance = useCallback((data: FinancialData, year: number): number => {
    if (!data[year] || !data[year][11]) return 0;
    
    // Procura o último dia disponível em dezembro (pode não ser 31)
    const decemberDays = Object.keys(data[year][11]).map(Number).sort((a, b) => b - a);
    for (const day of decemberDays) {
      if (data[year][11][day] && typeof data[year][11][day].balance === 'number') {
        console.log(`📊 Last December balance for ${year}: ${data[year][11][day].balance} (day ${day})`);
        return data[year][11][day].balance;
      }
    }
    return 0;
  }, []);

  // Função para obter saldo anterior de qualquer dia
  const getPreviousBalance = useCallback((data: FinancialData, year: number, month: number, day: number): number => {
    if (day === 1) {
      if (month === 0) {
        // Primeiro dia do ano - herdar do ano anterior
        return getLastDecemberBalance(data, year - 1);
      } else {
        // Primeiro dia do mês - herdar do último dia do mês anterior
        const prevMonth = month - 1;
        if (data[year] && data[year][prevMonth]) {
          const daysInPrevMonth = new Date(year, month, 0).getDate();
          for (let d = daysInPrevMonth; d >= 1; d--) {
            if (data[year][prevMonth][d] && typeof data[year][prevMonth][d].balance === 'number') {
              return data[year][prevMonth][d].balance;
            }
          }
        }
        return 0;
      }
    } else {
      // Dia normal - herdar do dia anterior ou último dia disponível
      if (data[year] && data[year][month]) {
        // Primeiro tentar o dia anterior direto
        if (data[year][month][day - 1] && typeof data[year][month][day - 1].balance === 'number') {
          return data[year][month][day - 1].balance;
        }
        
        // Se não encontrou, procurar o último dia disponível no mês
        for (let d = day - 1; d >= 1; d--) {
          if (data[year][month][d] && typeof data[year][month][d].balance === 'number') {
            console.log(`📊 Using balance from day ${d} for day ${day}: ${data[year][month][d].balance}`);
            return data[year][month][d].balance;
          }
        }
        
        // Se não encontrou nenhum dia no mês, buscar no mês anterior
        if (month > 0) {
          const prevMonth = month - 1;
          if (data[year][prevMonth]) {
            const daysInPrevMonth = new Date(year, month, 0).getDate();
            for (let d = daysInPrevMonth; d >= 1; d--) {
              if (data[year][prevMonth][d] && typeof data[year][prevMonth][d].balance === 'number') {
                console.log(`📊 Using balance from previous month day ${d}: ${data[year][prevMonth][d].balance}`);
                return data[year][prevMonth][d].balance;
              }
            }
          }
        } else {
          // Janeiro - buscar no ano anterior
          return getLastDecemberBalance(data, year - 1);
        }
      }
      return 0;
    }
  }, [getLastDecemberBalance]);

  // Função para inicializar um ano/mês/dia se não existir
  const initializeDataStructure = useCallback((data: FinancialData, year: number, month?: number, day?: number): void => {
    if (!data[year]) {
      data[year] = {};
      console.log(`🏗️ Initialized year ${year}`);
    }
    
    if (month !== undefined) {
      if (!data[year][month]) {
        data[year][month] = {};
        console.log(`🏗️ Initialized month ${month + 1}/${year}`);
      }
      
      if (day !== undefined && !data[year][month][day]) {
        data[year][month][day] = {
          entrada: "R$ 0,00",
          saida: "R$ 0,00",
          diario: "R$ 0,00",
          balance: 0 // Será recalculado pela função de recálculo
        };
        console.log(`🏗️ Initialized day ${day}/${month + 1}/${year}`);
      }
    }
  }, []);

  // Função CRÍTICA para propagar saldo entre anos E MESES
  const propagateYearEndBalance = useCallback((data: FinancialData, year: number): void => {
    console.log(`🔗 CRITICAL: Propagating balance from ${year} to ${year + 1}`);
    
    // Obter saldo do último dia de dezembro
    const decemberBalance = getLastDecemberBalance(data, year);
    
    console.log(`📊 December ${year} balance: ${decemberBalance}`);
    
    // SEMPRE propagar, mesmo se for zero (para garantir continuidade)
    // Inicializar próximo ano se necessário
    if (!data[year + 1]) {
      data[year + 1] = {};
      console.log(`🏗️ Created year ${year + 1}`);
    }
    if (!data[year + 1][0]) {
      data[year + 1][0] = {};
      console.log(`🏗️ Created month 01/${year + 1}`);
    }
    
    // CRÍTICO: Inicializar TODOS os dias de janeiro com propagação correta
    const daysInJanuary = new Date(year + 1, 1, 0).getDate(); // 31 dias
    
    for (let day = 1; day <= daysInJanuary; day++) {
      if (!data[year + 1][0][day]) {
        // Criar dia com saldo herdado do dia anterior ou dezembro
        const previousBalance = day === 1 ? decemberBalance : 
          (data[year + 1][0][day - 1] ? data[year + 1][0][day - 1].balance : decemberBalance);
        
        data[year + 1][0][day] = {
          entrada: "R$ 0,00",
          saida: "R$ 0,00",
          diario: "R$ 0,00",
          balance: previousBalance
        };
        console.log(`🏗️ Created day ${day}/01/${year + 1} with balance: ${previousBalance}`);
      } else {
        // CRÍTICO: Recalcular com saldo herdado preservando transações existentes
        const dayData = data[year + 1][0][day];
        const existingEntrada = parseCurrency(dayData.entrada);
        const existingSaida = parseCurrency(dayData.saida);
        const existingDiario = parseCurrency(dayData.diario);
        
        // Usar saldo correto como base
        const baseBalance = day === 1 ? decemberBalance : 
          (data[year + 1][0][day - 1] ? data[year + 1][0][day - 1].balance : decemberBalance);
        
        // Aplicar transações do dia
        const newBalance = calculateBalance(baseBalance, existingEntrada, existingSaida, existingDiario);
        dayData.balance = newBalance;
        
        console.log(`✅ CRITICAL: Balance updated day ${day}/01/${year + 1}: ${baseBalance} + ${existingEntrada} - ${existingSaida} - ${existingDiario} = ${newBalance}`);
      }
    }
  }, [getLastDecemberBalance, calculateBalance]);

  // Função principal de recálculo COMPLETO e AUTOMÁTICO
  const recalculateWithFullPropagation = useCallback((
    data: FinancialData,
    startYear?: number,
    startMonth?: number,
    startDay?: number
  ): FinancialData => {
    console.log(`🧮 CRITICAL: Starting COMPLETE balance recalculation from ${startYear || 'beginning'}-${(startMonth || 0) + 1}-${startDay || 1}`);
    
    // Deep clone para evitar mutação
    const newData = JSON.parse(JSON.stringify(data));
    const years = Object.keys(newData).map(Number).sort();
    const currentYear = new Date().getFullYear();
    
    // Expandir range para incluir próximo ano se necessário
    const maxYear = Math.max(...years, currentYear + 1);
    
    // Define ponto de início
    const firstYear = startYear || (years.length > 0 ? Math.min(...years) : currentYear);
    const firstMonth = startMonth !== undefined ? startMonth : 0;
    const firstDay = startDay !== undefined ? startDay : 1;
    
    console.log(`🎯 CRITICAL: Recalculation range: ${firstYear}-${firstMonth + 1}-${firstDay} to ${maxYear}-12-31`);
    
    // Recalcula TODOS os saldos a partir do ponto especificado
    for (let year = firstYear; year <= maxYear; year++) {
      if (!newData[year]) continue;
      
      const startMonthForYear = (year === firstYear) ? firstMonth : 0;
      
      for (let month = startMonthForYear; month < 12; month++) {
        if (!newData[year][month]) continue;
        
        const startDayForMonth = (year === firstYear && month === firstMonth) ? firstDay : 1;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Percorre todos os dias do mês
        for (let day = startDayForMonth; day <= daysInMonth; day++) {
          if (!newData[year][month][day]) continue;
          
          const dayData = newData[year][month][day];
          const entrada = parseCurrency(dayData.entrada);
          const saida = parseCurrency(dayData.saida);
          const diario = parseCurrency(dayData.diario);
          
          // Obter saldo anterior
          const previousBalance = getPreviousBalance(newData, year, month, day);
          
          // CRÍTICO: Usar função de cálculo com precisão decimal
          const newBalance = calculateBalance(previousBalance, entrada, saida, diario);
          dayData.balance = newBalance;
          
          console.log(`💰 CALC: ${year}-${month+1}-${day}: ${previousBalance} + ${entrada} - ${saida} - ${diario} = ${newBalance}`);
        }
      }
      
      // CRÍTICO: Propagar para próximo ano após terminar cada ano
      if (year < maxYear || year === currentYear) {
        propagateYearEndBalance(newData, year);
      }
    }
    
    console.log('✅ CRITICAL: Complete balance recalculation finished with full propagation');
    return newData;
  }, [getPreviousBalance, getLastDecemberBalance, propagateYearEndBalance, calculateBalance]);

  // Função simplificada para uso externo
  const recalculateBalances = useCallback((
    data: FinancialData,
    startYear?: number,
    startMonth?: number,
    startDay?: number
  ): FinancialData => {
    return recalculateWithFullPropagation(data, startYear, startMonth, startDay);
  }, [recalculateWithFullPropagation]);

  return {
    recalculateBalances,
    recalculateWithFullPropagation,
    getLastDecemberBalance,
    initializeDataStructure
  };
};
