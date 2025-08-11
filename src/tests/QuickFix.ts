/**
 * TESTE RÁPIDO PARA VERIFICAR CORREÇÕES CRÍTICAS
 */

import { formatCurrency, parseCurrency, calculateBalance } from '../utils/currencyUtils';

export const runQuickFixTests = (): void => {
  console.log('🔧 EXECUTANDO TESTES RÁPIDOS DE CORREÇÃO...');
  
  // Teste 1: Formatação de moeda
  console.log('\n📊 Teste de Formatação:');
  const testValues = [100.50, 0, -500.99, 1000000.00, 0.01];
  
  testValues.forEach(value => {
    try {
      const formatted = formatCurrency(value);
      const parsed = parseCurrency(formatted);
      const roundTrip = formatCurrency(parsed);
      
      console.log(`${value} → ${formatted} → ${parsed} → ${roundTrip}`);
      
      if (Math.abs(parsed - value) > 0.01) {
        console.error(`❌ ERRO: Valor ${value} perdeu precisão`);
      } else if (formatted !== roundTrip) {
        console.error(`❌ ERRO: Round-trip inconsistente para ${value}`);
      } else {
        console.log(`✅ OK: ${value}`);
      }
    } catch (error) {
      console.error(`❌ ERRO: Formatação falhou para ${value}:`, error);
    }
  });
  
  // Teste 2: Cálculo de saldo
  console.log('\n💰 Teste de Cálculo de Saldo:');
  const balanceTests = [
    { prev: 100, entrada: 50, saida: 20, diario: 10, expected: 120 },
    { prev: 0, entrada: 1000, saida: 0, diario: 0, expected: 1000 },
    { prev: 500, entrada: 0, saida: 600, diario: 0, expected: -100 },
    { prev: 1000.50, entrada: 250.25, saida: 100.75, diario: 50.00, expected: 1100.00 }
  ];
  
  balanceTests.forEach((test, index) => {
    try {
      const result = calculateBalance(test.prev, test.entrada, test.saida, test.diario);
      const difference = Math.abs(result - test.expected);
      
      console.log(`Teste ${index + 1}: ${test.prev} + ${test.entrada} - ${test.saida} - ${test.diario} = ${result} (esperado: ${test.expected})`);
      
      if (difference > 0.01) {
        console.error(`❌ ERRO: Diferença de ${difference}`);
      } else {
        console.log(`✅ OK: Teste ${index + 1}`);
      }
    } catch (error) {
      console.error(`❌ ERRO: Cálculo falhou no teste ${index + 1}:`, error);
    }
  });
  
  // Teste 3: Precisão decimal
  console.log('\n🔢 Teste de Precisão Decimal:');
  const precisionTests = [
    { a: 0.1, b: 0.2, expected: 0.3 },
    { a: 1.1, b: 2.2, expected: 3.3 },
    { a: 10.01, b: 20.02, expected: 30.03 }
  ];
  
  precisionTests.forEach((test, index) => {
    try {
      const result = calculateBalance(0, test.a + test.b, 0, 0);
      const difference = Math.abs(result - test.expected);
      
      console.log(`Precisão ${index + 1}: ${test.a} + ${test.b} = ${result} (esperado: ${test.expected})`);
      
      if (difference > 0.001) {
        console.error(`❌ ERRO: Perda de precisão: ${difference}`);
      } else {
        console.log(`✅ OK: Precisão ${index + 1}`);
      }
    } catch (error) {
      console.error(`❌ ERRO: Teste de precisão ${index + 1} falhou:`, error);
    }
  });
  
  console.log('\n🎯 TESTES RÁPIDOS CONCLUÍDOS');
};

// Executar automaticamente se em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    runQuickFixTests();
  }, 3000);
}