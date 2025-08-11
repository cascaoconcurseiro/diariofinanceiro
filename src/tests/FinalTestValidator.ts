/**
 * VALIDADOR FINAL - EXECUTA UMA ÚNICA VEZ PARA VERIFICAR CORREÇÕES
 */

import { formatCurrency, parseCurrency, calculateBalance, testCurrencyUtils } from '../utils/currencyUtils';

class FinalTestValidator {
  private static hasRun = false;

  public static runOnce(): void {
    if (FinalTestValidator.hasRun) {
      return;
    }
    
    FinalTestValidator.hasRun = true;
    
    console.log('🔧 VALIDAÇÃO FINAL DOS BUGS CORRIGIDOS');
    console.log('=' .repeat(50));
    
    // Teste 1: Formatação de Moeda
    console.log('\n💰 Teste: Formatação de Moeda');
    const formatTests = [
      { value: 100.50, name: 'Valor decimal' },
      { value: 0, name: 'Zero' },
      { value: -500.99, name: 'Valor negativo' },
      { value: 1000000.00, name: 'Valor grande' }
    ];
    
    let formatOk = true;
    formatTests.forEach(test => {
      const result = formatCurrency(test.value);
      const parsed = parseCurrency(result);
      const isValid = Math.abs(parsed - test.value) <= 0.01;
      
      if (isValid) {
        console.log(`✅ ${test.name}: ${result}`);
      } else {
        console.error(`❌ ${test.name}: ${result} → ${parsed}`);
        formatOk = false;
      }
    });
    
    // Teste 2: Cálculo de Saldo
    console.log('\n🧮 Teste: Cálculo de Saldo');
    const calcTests = [
      { prev: 100, entrada: 50, saida: 20, diario: 10, expected: 120 },
      { prev: 0, entrada: 1000, saida: 0, diario: 0, expected: 1000 },
      { prev: 500, entrada: 0, saida: 600, diario: 0, expected: -100 }
    ];
    
    let calcOk = true;
    calcTests.forEach((test, i) => {
      const result = calculateBalance(test.prev, test.entrada, test.saida, test.diario);
      const isValid = Math.abs(result - test.expected) <= 0.01;
      
      if (isValid) {
        console.log(`✅ Teste ${i+1}: ${result}`);
      } else {
        console.error(`❌ Teste ${i+1}: ${result} ≠ ${test.expected}`);
        calcOk = false;
      }
    });
    
    // Teste 3: Precisão Decimal
    console.log('\n🔢 Teste: Precisão Decimal');
    const precisionTests = [
      { a: 0.1, b: 0.2, expected: 0.3 },
      { a: 1.1, b: 2.2, expected: 3.3 }
    ];
    
    let precisionOk = true;
    precisionTests.forEach((test, i) => {
      const result = calculateBalance(0, test.a + test.b, 0, 0);
      const isValid = Math.abs(result - test.expected) <= 0.001;
      
      if (isValid) {
        console.log(`✅ Precisão ${i+1}: ${result}`);
      } else {
        console.error(`❌ Precisão ${i+1}: ${result} ≠ ${test.expected}`);
        precisionOk = false;
      }
    });
    
    // Teste 4: Totais Mensais (Simulado)
    console.log('\n📊 Teste: Totais Mensais');
    const mockData = [
      { entrada: 'R$ 1.000,00', saida: 'R$ 200,00', diario: 'R$ 50,00' },
      { entrada: 'R$ 500,00', saida: 'R$ 100,00', diario: 'R$ 25,00' }
    ];
    
    let totalEntradas = 0;
    let totalSaidas = 0;
    let totalDiario = 0;
    
    mockData.forEach(day => {
      totalEntradas += parseCurrency(day.entrada);
      totalSaidas += parseCurrency(day.saida);
      totalDiario += parseCurrency(day.diario);
    });
    
    totalEntradas = Math.round(totalEntradas * 100) / 100;
    totalSaidas = Math.round(totalSaidas * 100) / 100;
    totalDiario = Math.round(totalDiario * 100) / 100;
    
    const expectedEntradas = 1500;
    const expectedSaidas = 300;
    const expectedDiario = 75;
    
    const totalsOk = (
      Math.abs(totalEntradas - expectedEntradas) <= 0.01 &&
      Math.abs(totalSaidas - expectedSaidas) <= 0.01 &&
      Math.abs(totalDiario - expectedDiario) <= 0.01
    );
    
    if (totalsOk) {
      console.log(`✅ Totais: E:${totalEntradas} S:${totalSaidas} D:${totalDiario}`);
    } else {
      console.error(`❌ Totais incorretos`);
    }
    
    // Teste 5: Função interna
    console.log('\n🔧 Teste: Função Interna');
    const internalOk = testCurrencyUtils();
    
    if (internalOk) {
      console.log('✅ Teste interno: PASSOU');
    } else {
      console.error('❌ Teste interno: FALHOU');
    }
    
    // Resultado final
    console.log('\n' + '=' .repeat(50));
    const allOk = formatOk && calcOk && precisionOk && totalsOk && internalOk;
    
    if (allOk) {
      console.log('🎉 TODOS OS BUGS FORAM CORRIGIDOS!');
      console.log('✅ Sistema pronto para produção');
    } else {
      console.log('⚠️ Alguns bugs ainda existem');
    }
    
    console.log('=' .repeat(50));
  }
}

// Executar uma única vez após 2 segundos
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    FinalTestValidator.runOnce();
  }, 2000);
}

export { FinalTestValidator };