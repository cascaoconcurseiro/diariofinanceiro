/**
 * SILENT TEST ENGINE - NÚCLEO DO SISTEMA DE TESTES OCULTO
 * Executa testes em background sem impactar a experiência do usuário
 */

import { 
  SilentTestEngine as ISilentTestEngine,
  TestTrigger, 
  TestSuite, 
  TestResult,
  HiddenTestResult,
  ValidationResult
} from '../types/TestTypes';
import { HIDDEN_TEST_CONFIG, isTestingEnabled, internalLog } from '../config/HiddenTestConfig';
import { InternalLogger } from '../logging/InternalLogger';
import { PerformanceMonitor } from '../monitoring/PerformanceMonitor';

export class SilentTestEngine implements ISilentTestEngine {
  private static instance: SilentTestEngine | null = null;
  private isInitialized = false;
  private isRunning = false;
  private testSuites: Map<string, TestSuite> = new Map();
  private scheduledTests: Set<string> = new Set();
  private periodicTimer: NodeJS.Timeout | null = null;
  private logger: InternalLogger;
  private performanceMonitor: PerformanceMonitor;

  private constructor() {
    this.logger = InternalLogger.getInstance();
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  // Singleton pattern para garantir única instância
  public static getInstance(): SilentTestEngine {
    if (!SilentTestEngine.instance) {
      SilentTestEngine.instance = new SilentTestEngine();
    }
    return SilentTestEngine.instance;
  }

  // Inicialização silenciosa do sistema
  public async initialize(): Promise<void> {
    if (this.isInitialized || !isTestingEnabled()) {
      return;
    }

    try {
      internalLog('Initializing Silent Test Engine...');
      
      // Inicializar componentes
      await this.logger.initialize();
      await this.performanceMonitor.initialize();
      
      // Registrar test suites padrão
      this.registerDefaultTestSuites();
      
      // Configurar testes periódicos
      this.setupPeriodicTesting();
      
      // Executar testes de inicialização se habilitado
      if (HIDDEN_TEST_CONFIG.testFrequency.startup) {
        this.scheduleTests({
          type: 'startup',
          priority: 'high'
        });
      }
      
      this.isInitialized = true;
      this.isRunning = true;
      
      internalLog('Silent Test Engine initialized successfully');
      
    } catch (error) {
      // Falha silenciosa - não impactar o usuário
      this.logger.logCriticalIssue({
        id: 'engine_init_failure',
        timestamp: Date.now(),
        type: 'performance',
        severity: 'critical',
        description: 'Failed to initialize Silent Test Engine',
        context: { error: error.message }
      });
    }
  }

  // Agendar execução de testes
  public scheduleTests(trigger: TestTrigger): void {
    if (!this.isRunning || !isTestingEnabled()) {
      return;
    }

    // Verificar se deve throttle baseado na performance
    if (this.performanceMonitor.shouldThrottle()) {
      internalLog('Tests throttled due to performance constraints');
      return;
    }

    const testId = `${trigger.type}_${Date.now()}`;
    
    if (this.scheduledTests.has(testId)) {
      return; // Evitar duplicação
    }

    this.scheduledTests.add(testId);

    // Executar de forma assíncrona para não bloquear
    setTimeout(async () => {
      try {
        await this.executeTestsForTrigger(trigger);
      } catch (error) {
        this.logger.logCriticalIssue({
          id: 'test_execution_error',
          timestamp: Date.now(),
          type: 'performance',
          severity: 'critical',
          description: 'Error executing scheduled tests',
          context: { trigger, error: error.message }
        });
      } finally {
        this.scheduledTests.delete(testId);
      }
    }, 0);
  }

  // Executar suite de testes específica
  public async executeTestSuite(suite: TestSuite): Promise<TestResult> {
    const startTime = performance.now();
    const results: ValidationResult[] = [];
    const corrections: any[] = [];

    try {
      internalLog(`Executing test suite: ${suite.name}`);

      for (const validator of suite.validators) {
        // Verificar performance antes de cada validador
        if (this.performanceMonitor.shouldThrottle()) {
          internalLog(`Skipping validator ${validator.name} due to performance constraints`);
          continue;
        }

        try {
          const context = {
            type: validator.name,
            data: {},
            timestamp: Date.now(),
            source: 'silent_test_engine'
          };

          const result = await validator.validate(context);
          results.push(result);

          // Se há problemas e auto-correção está habilitada
          if (!result.passed && HIDDEN_TEST_CONFIG.autoCorrection.enabled) {
            for (const issue of result.issues) {
              if (issue.autoCorrectible && validator.canAutoCorrect()) {
                try {
                  const correction = await validator.autoCorrect(issue);
                  corrections.push(correction);
                  
                  if (correction.success) {
                    this.logger.logAutoCorrection(correction);
                  }
                } catch (correctionError) {
                  internalLog(`Auto-correction failed for ${issue.id}:`, correctionError);
                }
              }
            }
          }

        } catch (validatorError) {
          internalLog(`Validator ${validator.name} failed:`, validatorError);
          
          results.push({
            passed: false,
            issues: [{
              id: `validator_error_${Date.now()}`,
              severity: 'high',
              type: 'validator_failure',
              description: `Validator ${validator.name} threw an error`,
              data: { error: validatorError.message },
              autoCorrectible: false
            }],
            executionTime: 0,
            memoryUsage: 0
          });
        }
      }

      const totalTime = performance.now() - startTime;
      const overallStatus = results.every(r => r.passed) ? 'pass' : 
                           results.some(r => r.passed) ? 'partial' : 'fail';

      const testResult: TestResult = {
        suiteId: suite.name,
        results,
        overallStatus,
        totalTime,
        corrections
      };

      // Log resultado
      this.logger.logTestResult({
        id: `${suite.name}_${Date.now()}`,
        timestamp: Date.now(),
        suite: suite.name,
        validator: 'multiple',
        status: overallStatus,
        executionTime: totalTime,
        memoryUsage: this.performanceMonitor.measureImpact().memoryImpact
      });

      return testResult;

    } catch (error) {
      const errorResult: TestResult = {
        suiteId: suite.name,
        results: [],
        overallStatus: 'fail',
        totalTime: performance.now() - startTime,
        corrections: []
      };

      this.logger.logCriticalIssue({
        id: 'suite_execution_error',
        timestamp: Date.now(),
        type: 'performance',
        severity: 'critical',
        description: `Failed to execute test suite ${suite.name}`,
        context: { error: error.message }
      });

      return errorResult;
    }
  }

  // Verificar se está executando
  public isEngineRunning(): boolean {
    return this.isRunning && isTestingEnabled();
  }

  // Shutdown graceful
  public shutdown(): void {
    try {
      internalLog('Shutting down Silent Test Engine...');
      
      this.isRunning = false;
      
      if (this.periodicTimer) {
        clearInterval(this.periodicTimer);
        this.periodicTimer = null;
      }
      
      this.scheduledTests.clear();
      this.testSuites.clear();
      
      this.logger.shutdown();
      this.performanceMonitor.shutdown();
      
      internalLog('Silent Test Engine shut down successfully');
      
    } catch (error) {
      // Falha silenciosa no shutdown
    }
  }

  // Executar testes baseado no trigger
  private async executeTestsForTrigger(trigger: TestTrigger): Promise<void> {
    const suitesToRun: TestSuite[] = [];

    // Selecionar suites baseado no tipo de trigger
    for (const [name, suite] of this.testSuites) {
      const shouldRun = this.shouldRunSuiteForTrigger(suite, trigger);
      if (shouldRun) {
        suitesToRun.push(suite);
      }
    }

    // Ordenar por prioridade
    suitesToRun.sort((a, b) => b.priority - a.priority);

    // Executar suites
    for (const suite of suitesToRun) {
      if (!this.isRunning || this.performanceMonitor.shouldThrottle()) {
        break;
      }

      await this.executeTestSuite(suite);
      
      // Pequena pausa entre suites para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  // Verificar se deve executar suite para o trigger
  private shouldRunSuiteForTrigger(suite: TestSuite, trigger: TestTrigger): boolean {
    // Lógica simples - pode ser expandida
    switch (trigger.type) {
      case 'startup':
        return suite.name.includes('startup') || suite.name.includes('critical');
      case 'transaction':
        return suite.name.includes('financial') || suite.name.includes('calculation');
      case 'navigation':
        return suite.name.includes('propagation') || suite.name.includes('recurring');
      case 'periodic':
        return true; // Todos os testes periódicos
      default:
        return false;
    }
  }

  // Registrar test suites padrão
  private registerDefaultTestSuites(): void {
    // As suites serão registradas pelos validadores individuais
    // Este método será expandido conforme implementamos os validadores
    internalLog('Default test suites will be registered by validators');
  }

  // Configurar testes periódicos
  private setupPeriodicTesting(): void {
    if (!HIDDEN_TEST_CONFIG.testFrequency.periodic || HIDDEN_TEST_CONFIG.testFrequency.periodic <= 0) {
      return;
    }

    const intervalMs = HIDDEN_TEST_CONFIG.testFrequency.periodic * 60 * 1000; // Converter minutos para ms

    this.periodicTimer = setInterval(() => {
      if (this.isRunning && isTestingEnabled()) {
        this.scheduleTests({
          type: 'periodic',
          priority: 'low'
        });
      }
    }, intervalMs);

    internalLog(`Periodic testing configured: every ${HIDDEN_TEST_CONFIG.testFrequency.periodic} minutes`);
  }

  // Registrar uma nova test suite (usado pelos validadores)
  public registerTestSuite(suite: TestSuite): void {
    if (!this.isRunning) return;
    
    this.testSuites.set(suite.name, suite);
    internalLog(`Registered test suite: ${suite.name}`);
  }

  // Remover test suite
  public unregisterTestSuite(suiteName: string): void {
    this.testSuites.delete(suiteName);
    internalLog(`Unregistered test suite: ${suiteName}`);
  }
}