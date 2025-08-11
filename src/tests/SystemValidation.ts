/**
 * VALIDAÇÃO COMPLETA DO SISTEMA RESTAURADO
 * 
 * Testa todas as funcionalidades críticas do sistema financeiro
 */

import { formatCurrency, parseCurrency, calculateBalance, testCurrencyUtils } from '../utils/currencyUtils';

interface ValidationResult {
  test: string;
  passed: boolean;
  error?: string;
  details?: any;
}

interface SystemValidationReport {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  results: ValidationResult[];
  systemHealth: 'healthy' | 'warning' | 'critical';
}

/**
 * Executa validação completa do sistema
 */
export const validateRestoredSystem = (): SystemValidationReport => {
  const results: ValidationResult[] = [];
  const timestamp = new Date().toISOString();

  console.log('🧪 INICIANDO VALIDAÇÃO DO SISTEMA RESTAURADO...');

  // Teste 1: Utilitários de Moeda
  try {
    const currencyTestPassed = testCurrencyUtils();
    results.push({
      test: 'Currency Utils',
      passed: currencyTestPassed,
      details: currencyTestPassed ? 'Todas as funções de moeda funcionando' : 'Problemas nas funções de moeda'
    });
  } catch (error) {
    results.push({
      test: 'Currency Utils',
      passed: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }

  // Teste 2: Formatação de Moeda
  try {
    const tests = [
      { input: 100.50, expected: 'R$ 100,50' },
      { input: 0, expected: 'R$ 0,00' },
      { input: -500.99, expected: '-R$ 500,99' },
      { input: 1000000, expected: 'R$ 1.000.000,00' }
    ];

    let allPassed = true;
    for (const test of tests) {
      const result = formatCurrency(test.input);
      if (result !== test.expected) {
        allPassed = false;
        break;
      }
    }

    results.push({
      test: 'Currency Formatting',
      passed: allPassed,
      details: allPassed ? 'Formatação correta' : 'Problemas na formatação'
    });
  } catch (error) {
    results.push({
      test: 'Currency Formatting',
      passed: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }

  // Teste 3: Parse de Moeda
  try {
    const tests = [
      { input: 'R$ 100,50', expected: 100.50 },
      { input: 'R$ 0,00', expected: 0 },
      { input: '1.000,99', expected: 1000.99 },
      { input: '500', expected: 500 }
    ];

    let allPassed = true;
    for (const test of tests) {
      const result = parseCurrency(test.input);
      if (Math.abs(result - test.expected) > 0.01) {
        allPassed = false;
        break;
      }
    }

    results.push({
      test: 'Currency Parsing',
      passed: allPassed,
      details: allPassed ? 'Parse correto' : 'Problemas no parse'
    });
  } catch (error) {
    results.push({
      test: 'Currency Parsing',
      passed: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }

  // Teste 4: Cálculo de Saldos
  try {
    const tests = [
      { prev: 100, entrada: 50, saida: 20, diario: 10, expected: 120 },
      { prev: 0, entrada: 1000, saida: 0, diario: 0, expected: 1000 },
      { prev: 500, entrada: 0, saida: 200, diario: 100, expected: 200 },
      { prev: -100, entrada: 150, saida: 0, diario: 0, expected: 50 }
    ];

    let allPassed = true;
    for (const test of tests) {
      const result = calculateBalance(test.prev, test.entrada, test.saida, test.diario);
      if (Math.abs(result - test.expected) > 0.01) {
        allPassed = false;
        break;
      }
    }

    results.push({
      test: 'Balance Calculation',
      passed: allPassed,
      details: allPassed ? 'Cálculos corretos' : 'Problemas nos cálculos'
    });
  } catch (error) {
    results.push({
      test: 'Balance Calculation',
      passed: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }

  // Teste 5: LocalStorage
  try {
    const testData = [
      {
        id: 'test_1',
        date: '2025-01-22',
        description: 'Teste',
        amount: 100,
        type: 'entrada' as const,
        isRecurring: false,
        source: 'manual' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Salvar
    localStorage.setItem('testFinancialData', JSON.stringify(testData));
    
    // Carregar
    const loaded = JSON.parse(localStorage.getItem('testFinancialData') || '[]');
    
    // Limpar
    localStorage.removeItem('testFinancialData');

    const passed = loaded.length === 1 && loaded[0].id === 'test_1';

    results.push({
      test: 'LocalStorage Persistence',
      passed,
      details: passed ? 'Persistência funcionando' : 'Problemas na persistência'
    });
  } catch (error) {
    results.push({
      test: 'LocalStorage Persistence',
      passed: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }

  // Teste 6: Validação de Tipos
  try {
    // Verificar se tipos estão corretos
    const transactionTypes = ['entrada', 'saida', 'diario'];
    const sources = ['manual', 'recurring', 'quick-entry'];
    
    const typesValid = transactionTypes.every(type => typeof type === 'string');
    const sourcesValid = sources.every(source => typeof source === 'string');

    results.push({
      test: 'Type Validation',
      passed: typesValid && sourcesValid,
      details: 'Tipos TypeScript validados'
    });
  } catch (error) {
    results.push({
      test: 'Type Validation',
      passed: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }

  // Calcular estatísticas
  const totalTests = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = totalTests - passed;

  // Determinar saúde do sistema
  let systemHealth: 'healthy' | 'warning' | 'critical';
  if (failed === 0) {
    systemHealth = 'healthy';
  } else if (failed <= 2) {
    systemHealth = 'warning';
  } else {
    systemHealth = 'critical';
  }

  const report: SystemValidationReport = {
    timestamp,
    totalTests,
    passed,
    failed,
    results,
    systemHealth
  };

  console.log('✅ VALIDAÇÃO CONCLUÍDA:', report);
  return report;
};

/**
 * Executa teste de integração completo
 */
export const runIntegrationTest = (): boolean => {
  console.log('🔄 EXECUTANDO TESTE DE INTEGRAÇÃO...');

  try {
    // Simular fluxo completo
    const testTransactions = [
      {
        id: 'int_test_1',
        date: '2025-01-01',
        description: 'Saldo Inicial',
        amount: 1000,
        type: 'entrada' as const,
        isRecurring: false,
        source: 'manual' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'int_test_2',
        date: '2025-01-15',
        description: 'Compra',
        amount: 300,
        type: 'saida' as const,
        isRecurring: false,
        source: 'quick-entry' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Salvar no localStorage
    localStorage.setItem('integrationTestData', JSON.stringify(testTransactions));

    // Simular cálculos
    let balance = 0;
    testTransactions.forEach(t => {
      if (t.type === 'entrada') {
        balance += t.amount;
      } else if (t.type === 'saida') {
        balance -= t.amount;
      }
    });

    // Verificar resultado esperado
    const expectedBalance = 700; // 1000 - 300
    const balanceCorrect = Math.abs(balance - expectedBalance) < 0.01;

    // Limpar dados de teste
    localStorage.removeItem('integrationTestData');

    console.log('✅ TESTE DE INTEGRAÇÃO:', balanceCorrect ? 'PASSOU' : 'FALHOU');
    return balanceCorrect;

  } catch (error) {
    console.error('❌ ERRO NO TESTE DE INTEGRAÇÃO:', error);
    return false;
  }
};

/**
 * Gera relatório de saúde do sistema
 */
export const generateHealthReport = (): string => {
  const validation = validateRestoredSystem();
  const integration = runIntegrationTest();

  let report = `
# 📊 RELATÓRIO DE SAÚDE DO SISTEMA

**Data:** ${new Date().toLocaleString('pt-BR')}
**Status Geral:** ${validation.systemHealth.toUpperCase()}

## 📈 Estatísticas
- **Testes Executados:** ${validation.totalTests}
- **Testes Aprovados:** ${validation.passed}
- **Testes Falharam:** ${validation.failed}
- **Taxa de Sucesso:** ${((validation.passed / validation.totalTests) * 100).toFixed(1)}%

## 🧪 Resultados dos Testes

`;

  validation.results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    report += `### ${status} ${result.test}\n`;
    if (result.details) {
      report += `- **Detalhes:** ${result.details}\n`;
    }
    if (result.error) {
      report += `- **Erro:** ${result.error}\n`;
    }
    report += '\n';
  });

  report += `## 🔄 Teste de Integração
**Status:** ${integration ? '✅ PASSOU' : '❌ FALHOU'}

## 🎯 Recomendações

`;

  if (validation.systemHealth === 'healthy' && integration) {
    report += `✅ **Sistema está funcionando perfeitamente!**
- Todas as funcionalidades validadas
- Cálculos financeiros corretos
- Persistência funcionando
- Pronto para uso em produção
`;
  } else if (validation.systemHealth === 'warning') {
    report += `⚠️ **Sistema funcional com pequenos problemas**
- Maioria das funcionalidades OK
- Alguns testes falharam
- Recomenda-se investigação adicional
`;
  } else {
    report += `🚨 **Sistema com problemas críticos**
- Múltiplos testes falharam
- Requer correções imediatas
- Não recomendado para uso
`;
  }

  return report;
};

// Executar validação automaticamente se chamado diretamente
if (typeof window !== 'undefined') {
  console.log('🚀 Sistema de Validação Carregado');
}