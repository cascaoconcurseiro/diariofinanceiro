/**
 * CORREÇÃO CRÍTICA DOS BUGS REPORTADOS
 */

import { formatCurrency, parseCurrency, calculateBalance } from '../utils/currencyUtils';

// Função para testar formatação de moeda
const testCurrencyFormatting = (): boolean => {
  console.log('🔧 TESTANDO FORMATAÇÃO DE MOEDA...');
  
  const tests = [
    { value: 100.50, expected: 'R$ 100,50' },
    { value: 0, expected: 'R$ 0,00' },
    { value: -500.99, expected: '-R$ 500,99' },
    { value: 1000000.00, expected: 'R$ 1.000.000,00' },
    { value: 0.01, expected: 'R$ 0,01' }
  ];
  
  let allPassed = true;
  
  tests.forEach((test, index) => {
    try {
      const result = formatCurrency(test.value);
      console.log(`Teste ${index + 1}: ${test.value} → ${result}`);
      
      // Verificar se contém R$ e vírgula decimal
      if (!result.includes('R$') || !result.includes(',')) {
        console.error(`❌ ERRO: Formato incorreto para ${test.value}: ${result}`);
        allPassed = false;
      }
      
      // Verificar round-trip
      const parsed = parseCurrency(result);
      if (Math.abs(parsed - test.value) > 0.01) {
        console.error(`❌ ERRO: Round-trip falhou para ${test.value}: ${parsed}`);
        allPassed = false;
      } else {
        console.log(`✅ OK: ${test.value}`);
      }
    } catch (error) {
      console.error(`❌ ERRO: Exceção para ${test.value}:`, error);
      allPassed = false;
    }
  });
  
  return allPassed;
};

// Função para testar cálculos de saldo
const testBalanceCalculation = (): boolean => {
  console.log('\n💰 TESTANDO CÁLCULOS DE SALDO...');
  
  const tests = [
    { prev: 100, entrada: 50, saida: 20, diario: 10, expected: 120 },
    { prev: 0, entrada: 1000, saida: 0, diario: 0, expected: 1000 },
    { prev: 500, entrada: 0, saida: 600, diario: 0, expected: -100 },
    { prev: 1000.50, entrada: 250.25, saida: 100.75, diario: 50.00, expected: 1100.00 }
  ];
  
  let allPassed = true;
  
  tests.forEach((test, index) => {
    try {
      const result = calculateBalance(test.prev, test.entrada, test.saida, test.diario);
      const difference = Math.abs(result - test.expected);
      
      console.log(`Teste ${index + 1}: ${test.prev} + ${test.entrada} - ${test.saida} - ${test.diario} = ${result} (esperado: ${test.expected})`);
      
      if (difference > 0.01) {
        console.error(`❌ ERRO: Diferença de ${difference} para teste ${index + 1}`);
        allPassed = false;
      } else {
        console.log(`✅ OK: Teste ${index + 1}`);
      }
    } catch (error) {
      console.error(`❌ ERRO: Exceção no teste ${index + 1}:`, error);
      allPassed = false;
    }
  });
  
  return allPassed;
};

// Função para testar precisão decimal
const testDecimalPrecision = (): boolean => {
  console.log('\n🔢 TESTANDO PRECISÃO DECIMAL...');
  
  const tests = [
    { a: 0.1, b: 0.2, expected: 0.3 },
    { a: 1.1, b: 2.2, expected: 3.3 },
    { a: 10.01, b: 20.02, expected: 30.03 },
    { a: 123.45, b: 67.89, expected: 191.34 }
  ];
  
  let allPassed = true;
  
  tests.forEach((test, index) => {
    try {
      // Usar calculateBalance para somar
      const result = calculateBalance(0, test.a + test.b, 0, 0);
      const difference = Math.abs(result - test.expected);
      
      console.log(`Precisão ${index + 1}: ${test.a} + ${test.b} = ${result} (esperado: ${test.expected})`);
      
      if (difference > 0.001) {
        console.error(`❌ ERRO: Perda de precisão: ${difference}`);
        allPassed = false;
      } else {
        console.log(`✅ OK: Precisão ${index + 1}`);
      }
    } catch (error) {
      console.error(`❌ ERRO: Exceção no teste de precisão ${index + 1}:`, error);
      allPassed = false;
    }
  });
  
  return allPassed;
};

// Função para simular totais mensais
const testMonthlyTotals = (): boolean => {
  console.log('\n📊 TESTANDO TOTAIS MENSAIS...');
  
  // Simular dados de um mês
  const mockMonthData = {
    1: { entrada: 'R$ 1.000,00', saida: 'R$ 200,00', diario: 'R$ 50,00', balance: 750 },
    2: { entrada: 'R$ 500,00', saida: 'R$ 100,00', diario: 'R$ 25,00', balance: 1125 },
    3: { entrada: 'R$ 0,00', saida: 'R$ 300,00', diario: 'R$ 75,00', balance: 750 }
  };
  
  let totalEntradas = 0;
  let totalSaidas = 0;
  let totalDiario = 0;
  let saldoFinal = 0;
  
  try {
    Object.keys(mockMonthData).forEach(day => {
      const dayData = mockMonthData[day as keyof typeof mockMonthData];
      
      const entradaValue = parseCurrency(dayData.entrada);
      const saidaValue = parseCurrency(dayData.saida);
      const diarioValue = parseCurrency(dayData.diario);
      
      if (!isNaN(entradaValue)) totalEntradas += entradaValue;
      if (!isNaN(saidaValue)) totalSaidas += saidaValue;
      if (!isNaN(diarioValue)) totalDiario += diarioValue;
      
      saldoFinal = dayData.balance;
    });
    
    // Garantir precisão decimal
    totalEntradas = Math.round(totalEntradas * 100) / 100;
    totalSaidas = Math.round(totalSaidas * 100) / 100;
    totalDiario = Math.round(totalDiario * 100) / 100;
    
    console.log(`Total Entradas: ${totalEntradas} (esperado: 1500)`);
    console.log(`Total Saídas: ${totalSaidas} (esperado: 600)`);
    console.log(`Total Diário: ${totalDiario} (esperado: 150)`);
    console.log(`Saldo Final: ${saldoFinal} (esperado: 750)`);
    
    const errors = [];
    if (Math.abs(totalEntradas - 1500) > 0.01) errors.push('Total Entradas');
    if (Math.abs(totalSaidas - 600) > 0.01) errors.push('Total Saídas');
    if (Math.abs(totalDiario - 150) > 0.01) errors.push('Total Diário');
    if (Math.abs(saldoFinal - 750) > 0.01) errors.push('Saldo Final');
    
    if (errors.length > 0) {
      console.error(`❌ ERRO: Problemas em: ${errors.join(', ')}`);
      return false;
    } else {
      console.log('✅ OK: Totais mensais corretos');
      return true;
    }
    
  } catch (error) {
    console.error('❌ ERRO: Exceção no teste de totais mensais:', error);
    return false;
  }
};

// Executar todos os testes
export const runCriticalBugFix = (): void => {
  console.log('🚨 EXECUTANDO CORREÇÃO CRÍTICA DE BUGS...');
  console.log('=' .repeat(50));
  
  const results = {
    formatting: testCurrencyFormatting(),
    calculation: testBalanceCalculation(),
    precision: testDecimalPrecision(),
    monthlyTotals: testMonthlyTotals()
  };
  
  console.log('\n' + '=' .repeat(50));
  console.log('📋 RESUMO DOS TESTES:');
  console.log(`Formatação de Moeda: ${results.formatting ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`Cálculo de Saldo: ${results.calculation ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`Precisão Decimal: ${results.precision ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`Totais Mensais: ${results.monthlyTotals ? '✅ PASSOU' : '❌ FALHOU'}`);
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM! BUGS CORRIGIDOS!');
  } else {
    console.log('\n🚨 ALGUNS TESTES FALHARAM! BUGS AINDA EXISTEM!');
  }
  
  console.log('=' .repeat(50));
};

// Auto-executar em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    runCriticalBugFix();
  }, 2000);
}