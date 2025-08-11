/**
 * INTEGRAÇÃO OCULTA COM SISTEMA FINANCEIRO
 * Conecta o sistema de testes com os hooks financeiros existentes
 */

import { SilentTestEngine } from '../testing/SilentTestEngine';
import { FinancialCalculationValidator } from '../validators/FinancialCalculationValidator';
import { CurrencyFormattingValidator } from '../validators/CurrencyFormattingValidator';
import { RecurringTransactionValidator } from '../validators/RecurringTransactionValidator';
import { BalancePropagationValidator } from '../validators/BalancePropagationValidator';
import { TestSuite } from '../types/TestTypes';
import { isTestingEnabled, internalLog } from '../config/HiddenTestConfig';

export class HiddenTestIntegration {
  private static instance: HiddenTestIntegration | null = null;
  private testEngine: SilentTestEngine;
  private isIntegrated = false;

  private constructor() {
    this.testEngine = SilentTestEngine.getInstance();
  }

  public static getInstance(): HiddenTestIntegration {
    if (!HiddenTestIntegration.instance) {
      HiddenTestIntegration.instance = new HiddenTestIntegration();
    }
    return HiddenTestIntegration.instance;
  }

  // Inicializar integração completa
  public async initialize(): Promise<void> {
    if (this.isIntegrated || !isTestingEnabled()) return;

    try {
      internalLog('Initializing Hidden Test Integration...');

      // Inicializar test engine
      await this.testEngine.initialize();

      // Registrar test suites
      this.registerTestSuites();

      // Integrar com hooks existentes
      this.integrateWithFinancialHooks();

      // Configurar triggers automáticos
      this.setupAutomaticTriggers();

      this.isIntegrated = true;
      internalLog('Hidden Test Integration initialized successfully');

    } catch (error) {
      internalLog('Failed to initialize Hidden Test Integration:', error);
    }
  }

  // Registrar todas as test suites
  private registerTestSuites(): void {
    const validators = [
      new FinancialCalculationValidator(),
      new CurrencyFormattingValidator(),
      new RecurringTransactionValidator(),
      new BalancePropagationValidator()
    ];

    // Suite crítica para startup
    const criticalSuite: TestSuite = {
      name: 'critical_startup_tests',
      validators: [validators[0], validators[1]], // Cálculo e formatação
      priority: 10,
      frequency: 0, // Apenas no startup
      conditions: ['startup']
    };

    // Suite financeira para transações
    const financialSuite: TestSuite = {
      name: 'financial_transaction_tests',
      validators: [validators[0], validators[3]], // Cálculo e propagação
      priority: 9,
      frequency: 0, // Apenas em transações
      conditions: ['transaction']
    };

    // Suite de navegação
    const navigationSuite: TestSuite = {
      name: 'navigation_tests',
      validators: [validators[2], validators[3]], // Recorrentes e propagação
      priority: 7,
      frequency: 0, // Apenas em navegação
      conditions: ['navigation']
    };

    // Suite periódica
    const periodicSuite: TestSuite = {
      name: 'periodic_health_check',
      validators: validators, // Todos os validadores
      priority: 5,
      frequency: 60, // A cada hora
      conditions: ['periodic']
    };

    // Registrar todas as suites
    [criticalSuite, financialSuite, navigationSuite, periodicSuite].forEach(suite => {
      this.testEngine.registerTestSuite(suite);
    });

    internalLog(`Registered ${validators.length} validators in 4 test suites`);
  }

  // Integrar com hooks financeiros existentes
  private integrateWithFinancialHooks(): void {
    try {
      // Hook para transações
      this.hookIntoTransactions();
      
      // Hook para navegação
      this.hookIntoNavigation();
      
      // Hook para mudanças de dados
      this.hookIntoDataChanges();

      internalLog('Successfully integrated with financial hooks');
    } catch (error) {
      internalLog('Failed to integrate with financial hooks:', error);
    }
  }

  // Hook em transações
  private hookIntoTransactions(): void {
    // Interceptar chamadas para addToDay, updateDayData, etc.
    const originalAddToDay = (window as any).__originalAddToDay;
    
    if (typeof originalAddToDay === 'function') {
      (window as any).__originalAddToDay = (...args: any[]) => {
        const result = originalAddToDay.apply(this, args);
        
        // Trigger testes após transação
        this.testEngine.scheduleTests({
          type: 'transaction',
          priority: 'high',
          context: { args }
        });
        
        return result;
      };
    }
  }

  // Hook em navegação
  private hookIntoNavigation(): void {
    // Interceptar mudanças de mês/ano
    const originalSetSelectedMonth = (window as any).__originalSetSelectedMonth;
    const originalSetSelectedYear = (window as any).__originalSetSelectedYear;

    if (typeof originalSetSelectedMonth === 'function') {
      (window as any).__originalSetSelectedMonth = (...args: any[]) => {
        const result = originalSetSelectedMonth.apply(this, args);
        
        this.testEngine.scheduleTests({
          type: 'navigation',
          priority: 'medium',
          context: { type: 'month_change', args }
        });
        
        return result;
      };
    }

    if (typeof originalSetSelectedYear === 'function') {
      (window as any).__originalSetSelectedYear = (...args: any[]) => {
        const result = originalSetSelectedYear.apply(this, args);
        
        this.testEngine.scheduleTests({
          type: 'navigation',
          priority: 'medium',
          context: { type: 'year_change', args }
        });
        
        return result;
      };
    }
  }

  // Hook em mudanças de dados
  private hookIntoDataChanges(): void {
    // Interceptar localStorage changes
    const originalSetItem = localStorage.setItem;
    
    localStorage.setItem = function(key: string, value: string) {
      const result = originalSetItem.call(this, key, value);
      
      if (key === 'financialData') {
        HiddenTestIntegration.getInstance().testEngine.scheduleTests({
          type: 'transaction',
          priority: 'low',
          context: { type: 'data_save' }
        });
      }
      
      return result;
    };
  }

  // Configurar triggers automáticos
  private setupAutomaticTriggers(): void {
    // Trigger no load da página
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.testEngine.scheduleTests({
          type: 'startup',
          priority: 'high'
        });
      });
    } else {
      // Página já carregada
      setTimeout(() => {
        this.testEngine.scheduleTests({
          type: 'startup',
          priority: 'high'
        });
      }, 1000);
    }

    // Trigger em visibility change (quando usuário volta para a aba)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.testEngine.scheduleTests({
          type: 'periodic',
          priority: 'low'
        });
      }
    });

    internalLog('Automatic triggers configured');
  }

  // Trigger manual para testes (apenas em desenvolvimento)
  public triggerTests(type: 'startup' | 'transaction' | 'navigation' | 'periodic' = 'periodic'): void {
    if (!this.isIntegrated) return;

    this.testEngine.scheduleTests({
      type,
      priority: 'medium',
      context: { manual: true }
    });
  }

  // Shutdown da integração
  public shutdown(): void {
    if (this.isIntegrated) {
      this.testEngine.shutdown();
      this.isIntegrated = false;
      internalLog('Hidden Test Integration shut down');
    }
  }

  // Status da integração
  public isRunning(): boolean {
    return this.isIntegrated && this.testEngine.isEngineRunning();
  }
}

// Auto-inicializar quando o módulo é carregado
if (typeof window !== 'undefined' && isTestingEnabled()) {
  // Inicializar após um pequeno delay para não impactar o startup
  setTimeout(() => {
    HiddenTestIntegration.getInstance().initialize();
  }, 2000);
}

// Exportar instância global oculta (apenas em desenvolvimento)
if (typeof window !== 'undefined') {
  (window as any).__hiddenTestIntegration = HiddenTestIntegration.getInstance();
}