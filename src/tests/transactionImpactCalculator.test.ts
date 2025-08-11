import { TransactionImpactCalculator, TransactionOperation } from '../utils/transactionImpactCalculator';

describe('TransactionImpactCalculator', () => {
  let calculator: TransactionImpactCalculator;

  beforeEach(() => {
    calculator = new TransactionImpactCalculator();
  });

  describe('calculateImpact', () => {
    const mockTransaction = {
      id: 'test-1',
      date: '2025-01-15',
      amount: 500,
      type: 'entrada',
      description: 'Test transaction'
    };

    test('should calculate CREATE impact correctly', () => {
      const impact = calculator.calculateImpact('CREATE', mockTransaction);
      
      expect(impact.transactionId).toBe('test-1');
      expect(impact.oldValue).toBe(0);
      expect(impact.newValue).toBe(500);
      expect(impact.difference).toBe(500);
      expect(impact.operationType).toBe('CREATE');
      expect(impact.affectedPeriods.length).toBeGreaterThan(0);
    });

    test('should calculate DELETE impact correctly', () => {
      const impact = calculator.calculateImpact('DELETE', mockTransaction);
      
      expect(impact.oldValue).toBe(500);
      expect(impact.newValue).toBe(0);
      expect(impact.difference).toBe(-500);
      expect(impact.operationType).toBe('DELETE');
    });

    test('should calculate UPDATE impact correctly', () => {
      const oldTransaction = { ...mockTransaction, amount: 300 };
      const newTransaction = { ...mockTransaction, amount: 800 };
      
      const impact = calculator.calculateImpact('UPDATE', newTransaction, oldTransaction);
      
      expect(impact.oldValue).toBe(300);
      expect(impact.newValue).toBe(800);
      expect(impact.difference).toBe(500);
      expect(impact.operationType).toBe('UPDATE');
    });

    test('should handle saida transactions correctly', () => {
      const saidaTransaction = { ...mockTransaction, type: 'saida' };
      const impact = calculator.calculateImpact('CREATE', saidaTransaction);
      
      expect(impact.newValue).toBe(-500); // Negativo para saída
      expect(impact.difference).toBe(-500);
    });

    test('should handle diario transactions correctly', () => {
      const diarioTransaction = { ...mockTransaction, type: 'diario' };
      const impact = calculator.calculateImpact('CREATE', diarioTransaction);
      
      expect(impact.newValue).toBe(-500); // Negativo para diário
      expect(impact.difference).toBe(-500);
    });

    test('should throw error for UPDATE without oldTransaction', () => {
      expect(() => {
        calculator.calculateImpact('UPDATE', mockTransaction);
      }).toThrow('oldTransaction é obrigatório para operação UPDATE');
    });
  });

  describe('calculateBatchImpact', () => {
    test('should calculate batch impact correctly', () => {
      const operations: TransactionOperation[] = [
        {
          type: 'CREATE',
          transaction: {
            id: 'test-1',
            date: '2025-01-15',
            amount: 500,
            type: 'entrada'
          }
        },
        {
          type: 'CREATE',
          transaction: {
            id: 'test-2',
            date: '2025-02-15',
            amount: 300,
            type: 'saida'
          }
        }
      ];

      const result = calculator.calculateBatchImpact(operations);
      
      expect(result.impacts).toHaveLength(2);
      expect(result.totalAffectedMonths).toBeGreaterThan(0);
      expect(result.estimatedProcessingTime).toBeGreaterThan(0);
      expect(typeof result.requiresFullRecalculation).toBe('boolean');
    });

    test('should optimize impact order correctly', () => {
      const operations: TransactionOperation[] = [
        {
          type: 'CREATE',
          transaction: {
            id: 'test-low',
            date: '2025-03-15',
            amount: 50, // Baixa prioridade
            type: 'entrada'
          }
        },
        {
          type: 'CREATE',
          transaction: {
            id: 'test-high',
            date: '2025-01-15',
            amount: 5000, // Alta prioridade
            type: 'entrada'
          }
        }
      ];

      const result = calculator.calculateBatchImpact(operations);
      
      // O impacto de alta prioridade deve vir primeiro
      expect(result.impacts[0].priority).toBeLessThanOrEqual(result.impacts[1].priority);
    });

    test('should handle errors gracefully', () => {
      const operations: TransactionOperation[] = [
        {
          type: 'UPDATE',
          transaction: {
            id: 'test-error',
            date: '2025-01-15',
            amount: 500,
            type: 'entrada'
          }
          // Sem oldTransaction - deve causar erro
        }
      ];

      const result = calculator.calculateBatchImpact(operations);
      
      // Deve continuar funcionando mesmo com erro
      expect(result.impacts).toHaveLength(0);
      expect(result.totalAffectedMonths).toBe(0);
    });
  });

  describe('optimizeImpactOrder', () => {
    test('should sort by priority first', () => {
      const impacts = [
        {
          transactionId: 'low',
          priority: 3,
          transactionDate: '2025-01-15',
          difference: 100,
          oldValue: 0,
          newValue: 100,
          affectedPeriods: [],
          operationType: 'CREATE' as const
        },
        {
          transactionId: 'high',
          priority: 1,
          transactionDate: '2025-01-15',
          difference: 100,
          oldValue: 0,
          newValue: 100,
          affectedPeriods: [],
          operationType: 'CREATE' as const
        }
      ];

      const optimized = calculator.optimizeImpactOrder(impacts);
      
      expect(optimized[0].priority).toBe(1);
      expect(optimized[1].priority).toBe(3);
    });

    test('should sort by date when priority is equal', () => {
      const impacts = [
        {
          transactionId: 'later',
          priority: 1,
          transactionDate: '2025-02-15',
          difference: 100,
          oldValue: 0,
          newValue: 100,
          affectedPeriods: [],
          operationType: 'CREATE' as const
        },
        {
          transactionId: 'earlier',
          priority: 1,
          transactionDate: '2025-01-15',
          difference: 100,
          oldValue: 0,
          newValue: 100,
          affectedPeriods: [],
          operationType: 'CREATE' as const
        }
      ];

      const optimized = calculator.optimizeImpactOrder(impacts);
      
      expect(optimized[0].transactionDate).toBe('2025-01-15');
      expect(optimized[1].transactionDate).toBe('2025-02-15');
    });
  });

  describe('priority calculation', () => {
    test('should assign high priority to large amounts', () => {
      const highAmountTransaction = {
        id: 'high-amount',
        date: '2025-01-15',
        amount: 5000,
        type: 'entrada'
      };

      const impact = calculator.calculateImpact('CREATE', highAmountTransaction);
      expect(impact.priority).toBe(1); // Alta prioridade
    });

    test('should assign low priority to small amounts', () => {
      const lowAmountTransaction = {
        id: 'low-amount',
        date: '2025-01-15',
        amount: 50,
        type: 'entrada'
      };

      const impact = calculator.calculateImpact('CREATE', lowAmountTransaction);
      expect(impact.priority).toBe(3); // Baixa prioridade
    });
  });

  describe('affected periods calculation', () => {
    test('should calculate affected periods from transaction date', () => {
      const transaction = {
        id: 'test',
        date: '2025-01-15',
        amount: 500,
        type: 'entrada'
      };

      const impact = calculator.calculateImpact('CREATE', transaction);
      
      expect(impact.affectedPeriods).toContain('2025-01');
      expect(impact.affectedPeriods).toContain('2025-02');
      expect(impact.affectedPeriods.length).toBeGreaterThan(12); // Pelo menos um ano
    });

    test('should include future periods for propagation', () => {
      const transaction = {
        id: 'test',
        date: '2025-01-15',
        amount: 500,
        type: 'entrada'
      };

      const impact = calculator.calculateImpact('CREATE', transaction);
      
      // Deve incluir períodos futuros (até 2 anos)
      expect(impact.affectedPeriods).toContain('2026-01');
      expect(impact.affectedPeriods).toContain('2027-01');
    });
  });
});

// Teste de integração simples
describe('TransactionImpactCalculator Integration', () => {
  test('should handle real-world scenario', () => {
    const calculator = new TransactionImpactCalculator();
    
    // Cenário: Usuário adiciona salário, depois edita o valor
    const salarioOriginal = {
      id: 'salario-jan',
      date: '2025-01-05',
      amount: 3000,
      type: 'entrada',
      description: 'Salário Janeiro'
    };

    const salarioEditado = {
      ...salarioOriginal,
      amount: 3500 // Aumento de R$ 500
    };

    // Calcular impacto da criação
    const createImpact = calculator.calculateImpact('CREATE', salarioOriginal);
    expect(createImpact.difference).toBe(3000);
    expect(createImpact.priority).toBe(1); // Alta prioridade por ser valor alto

    // Calcular impacto da edição
    const updateImpact = calculator.calculateImpact('UPDATE', salarioEditado, salarioOriginal);
    expect(updateImpact.difference).toBe(500); // Diferença de R$ 500
    expect(updateImpact.affectedPeriods.length).toBeGreaterThan(20); // Muitos meses afetados

    console.log('✅ INTEGRATION TEST: Real-world scenario completed successfully');
  });
});