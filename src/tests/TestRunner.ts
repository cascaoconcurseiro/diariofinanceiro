/**
 * Executor Principal de Todos os Testes
 * Coordena execução de testes unitários e de integração
 */

import { FinancialLogicTester, TestSuite } from './FinancialLogicTester';
import { IntegrationTester } from './IntegrationTester';
import { validateAllFixes, FixValidationResult } from './validateFixes';

export interface TestReport {
  timestamp: string;
  unitTests: TestSuite[];
  integrationTests: TestSuite[];
  fixValidation: FixValidationResult[];
  summary: {
    totalTests: number;
    totalPassed: number;
    totalFailed: number;
    successRate: number;
    criticalBugs: string[];
    recommendations: string[];
    fixesValidated: number;
    fixesPassed: number;
  };
  performance: {
    executionTime: number;
    testsPerSecond: number;
  };
}

export class TestRunner {
  private unitTester: FinancialLogicTester;
  private integrationTester: IntegrationTester;

  constructor() {
    this.unitTester = new FinancialLogicTester();
    this.integrationTester = new IntegrationTester();
  }

  /**
   * Executa todos os testes e gera relatório completo
   */
  public async runAllTests(): Promise<TestReport> {
    console.log('🚀 INICIANDO BATERIA COMPLETA DE TESTES');
    console.log('=====================================');
    
    const startTime = performance.now();

    try {
      // 1. Testes Unitários
      console.log('\n📋 Executando testes unitários...');
      const unitTests = this.unitTester.runAllTests();

      // 2. Testes de Integração
      console.log('\n🔄 Executando testes de integração...');
      const integrationTests = this.integrationTester.runIntegrationTests();

      // 3. Validação de Correções
      console.log('\n🔧 Validando correções implementadas...');
      const fixValidation = validateAllFixes();

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // 4. Gerar Relatório
      const report = this.generateReport(unitTests, integrationTests, fixValidation, executionTime);

      // 4. Análise de Bugs Críticos
      this.analyzeCriticalBugs(report);

      // 5. Recomendações
      this.generateRecommendations(report);

      console.log('\n✅ BATERIA DE TESTES CONCLUÍDA');
      console.log(`⏱️ Tempo de execução: ${executionTime.toFixed(2)}ms`);
      
      return report;

    } catch (error) {
      console.error('💥 ERRO CRÍTICO durante execução dos testes:', error);
      throw error;
    }
  }

  /**
   * Gera relatório consolidado
   */
  private generateReport(
    unitTests: TestSuite[], 
    integrationTests: TestSuite[], 
    fixValidation: FixValidationResult[],
    executionTime: number
  ): TestReport {
    const allSuites = [...unitTests, ...integrationTests];
    
    const totalTests = allSuites.reduce((sum, suite) => sum + suite.total, 0);
    const totalPassed = allSuites.reduce((sum, suite) => sum + suite.passed, 0);
    const totalFailed = allSuites.reduce((sum, suite) => sum + suite.failed, 0);
    const successRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;

    const fixesPassed = fixValidation.filter(f => f.passed).length;
    const fixesValidated = fixValidation.length;

    return {
      timestamp: new Date().toISOString(),
      unitTests,
      integrationTests,
      fixValidation,
      summary: {
        totalTests,
        totalPassed,
        totalFailed,
        successRate,
        criticalBugs: [],
        recommendations: [],
        fixesValidated,
        fixesPassed
      },
      performance: {
        executionTime,
        testsPerSecond: totalTests / (executionTime / 1000)
      }
    };
  }

  /**
   * Analisa bugs críticos encontrados
   */
  private analyzeCriticalBugs(report: TestReport): void {
    const criticalBugs: string[] = [];
    const allSuites = [...report.unitTests, ...report.integrationTests];

    allSuites.forEach(suite => {
      suite.results.filter(r => !r.passed).forEach(result => {
        // Identifica bugs críticos baseado no tipo de falha
        if (this.isCriticalBug(suite.suiteName, result.testName, result.expected, result.actual)) {
          criticalBugs.push(`🚨 CRÍTICO: ${suite.suiteName} - ${result.testName}`);
        } else {
          criticalBugs.push(`⚠️ ${suite.suiteName} - ${result.testName}`);
        }
      });
    });

    report.summary.criticalBugs = criticalBugs;

    if (criticalBugs.length > 0) {
      console.log('\n🚨 BUGS ENCONTRADOS:');
      criticalBugs.forEach((bug, index) => {
        console.log(`   ${index + 1}. ${bug}`);
      });
    }
  }

  /**
   * Determina se um bug é crítico
   */
  private isCriticalBug(suiteName: string, testName: string, expected: any, actual: any): boolean {
    // Bugs críticos que podem causar perda de dinheiro ou dados
    const criticalPatterns = [
      'Cálculo de Saldo',
      'Propagação de Saldo',
      'Saldo Final',
      'Overflow',
      'Underflow',
      'Precisão Decimal'
    ];

    const isCriticalSuite = criticalPatterns.some(pattern => 
      suiteName.includes(pattern) || testName.includes(pattern)
    );

    // Diferenças grandes em valores monetários são críticas
    if (typeof expected === 'number' && typeof actual === 'number') {
      const difference = Math.abs(expected - actual);
      if (difference > 0.01) { // Mais de 1 centavo de diferença
        return true;
      }
    }

    return isCriticalSuite;
  }

  /**
   * Gera recomendações baseadas nos resultados
   */
  private generateRecommendations(report: TestReport): void {
    const recommendations: string[] = [];
    const { successRate, totalFailed } = report.summary;

    if (successRate < 95) {
      recommendations.push('🔧 Taxa de sucesso baixa - Revisar implementação geral');
    }

    if (totalFailed > 0) {
      recommendations.push('🐛 Bugs encontrados - Priorizar correções antes do deploy');
    }

    // Análise por categoria
    const failedSuites = [...report.unitTests, ...report.integrationTests]
      .filter(suite => suite.failed > 0);

    failedSuites.forEach(suite => {
      switch (suite.suiteName) {
        case 'Cálculo de Saldo':
          recommendations.push('💰 Revisar fórmula de cálculo de saldo em currencyUtils.ts');
          break;
        case 'Parsing de Moeda':
          recommendations.push('💱 Melhorar parsing de valores monetários');
          break;
        case 'Propagação de Saldo':
          recommendations.push('🔗 Verificar lógica de propagação entre períodos');
          break;
        case 'Transações Recorrentes':
          recommendations.push('🔄 Revisar processamento de transações recorrentes');
          break;
        case 'Integridade de Dados':
          recommendations.push('🛡️ Fortalecer validações de segurança');
          break;
      }
    });

    // Recomendações de performance
    if (report.performance.testsPerSecond < 100) {
      recommendations.push('⚡ Performance baixa - Otimizar algoritmos');
    }

    report.summary.recommendations = recommendations;

    if (recommendations.length > 0) {
      console.log('\n💡 RECOMENDAÇÕES:');
      recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }
  }

  /**
   * Executa apenas testes críticos (para CI/CD)
   */
  public async runCriticalTests(): Promise<boolean> {
    console.log('🎯 Executando apenas testes críticos...');
    
    const report = await this.runAllTests();
    const criticalFailures = report.summary.criticalBugs.filter(bug => 
      bug.includes('🚨 CRÍTICO')
    );

    if (criticalFailures.length > 0) {
      console.log('❌ TESTES CRÍTICOS FALHARAM - DEPLOY BLOQUEADO');
      return false;
    }

    console.log('✅ TODOS OS TESTES CRÍTICOS PASSARAM');
    return true;
  }

  /**
   * Executa testes de regressão
   */
  public async runRegressionTests(): Promise<TestReport> {
    console.log('🔄 Executando testes de regressão...');
    
    // Para testes de regressão, executamos todos os testes
    // mas com foco em cenários que já falharam antes
    return this.runAllTests();
  }

  /**
   * Salva relatório em arquivo
   */
  public saveReport(report: TestReport, filename?: string): void {
    const fileName = filename || `test-report-${Date.now()}.json`;
    
    try {
      const reportJson = JSON.stringify(report, null, 2);
      
      // Em um ambiente real, salvaria em arquivo
      // Para este exemplo, apenas logamos
      console.log(`💾 Relatório salvo: ${fileName}`);
      console.log(`📊 Tamanho do relatório: ${reportJson.length} caracteres`);
      
      // Salvar no localStorage para visualização
      localStorage.setItem('lastTestReport', reportJson);
      
    } catch (error) {
      console.error('❌ Erro ao salvar relatório:', error);
    }
  }

  /**
   * Carrega último relatório salvo
   */
  public loadLastReport(): TestReport | null {
    try {
      const saved = localStorage.getItem('lastTestReport');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar relatório:', error);
    }
    return null;
  }

  /**
   * Compara dois relatórios para detectar regressões
   */
  public compareReports(current: TestReport, previous: TestReport): {
    improved: string[];
    regressed: string[];
    new: string[];
  } {
    const comparison = {
      improved: [] as string[],
      regressed: [] as string[],
      new: [] as string[]
    };

    // Comparar taxa de sucesso geral
    if (current.summary.successRate > previous.summary.successRate) {
      comparison.improved.push(`Taxa de sucesso: ${previous.summary.successRate.toFixed(1)}% → ${current.summary.successRate.toFixed(1)}%`);
    } else if (current.summary.successRate < previous.summary.successRate) {
      comparison.regressed.push(`Taxa de sucesso: ${previous.summary.successRate.toFixed(1)}% → ${current.summary.successRate.toFixed(1)}%`);
    }

    // Comparar bugs críticos
    const currentCritical = current.summary.criticalBugs.length;
    const previousCritical = previous.summary.criticalBugs.length;
    
    if (currentCritical < previousCritical) {
      comparison.improved.push(`Bugs críticos: ${previousCritical} → ${currentCritical}`);
    } else if (currentCritical > previousCritical) {
      comparison.regressed.push(`Bugs críticos: ${previousCritical} → ${currentCritical}`);
    }

    return comparison;
  }
}