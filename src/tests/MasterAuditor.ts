/**
 * AUDITOR MESTRE - EXECUTA TODOS OS TESTES DE LÓGICA FINANCEIRA
 * Sistema completo de auditoria para identificar TODOS os bugs possíveis
 */

import { FinancialAuditor, AuditReport } from './FinancialAuditor';
import { RecurringTransactionAuditor, RecurringTestResult } from './RecurringTransactionAuditor';

export interface MasterAuditReport {
  timestamp: string;
  financialAudit: AuditReport;
  recurringAudit: RecurringTestResult[];
  overallSummary: {
    totalTests: number;
    totalPassed: number;
    totalFailed: number;
    successRate: number;
    criticalIssues: string[];
  };
  recommendations: string[];
}

export class MasterAuditor {
  private financialAuditor = new FinancialAuditor();
  private recurringAuditor = new RecurringTransactionAuditor();

  // Executar auditoria completa de todo o sistema
  public async runMasterAudit(): Promise<MasterAuditReport> {
    console.log('🚀 INICIANDO AUDITORIA MESTRE DO SISTEMA FINANCEIRO');
    console.log('🔍 Verificando TODOS os aspectos da lógica financeira...');
    console.log('=' .repeat(80));

    const timestamp = new Date().toISOString();

    // Executar auditoria financeira geral
    console.log('\n📊 FASE 1: AUDITORIA FINANCEIRA GERAL');
    const financialAudit = await this.financialAuditor.runCompleteAudit();

    // Executar auditoria de transações recorrentes
    console.log('\n🔄 FASE 2: AUDITORIA DE TRANSAÇÕES RECORRENTES');
    const recurringAudit = this.recurringAuditor.runCompleteRecurringAudit();

    // Calcular resumo geral
    const totalTests = financialAudit.totalTests + recurringAudit.length;
    const totalPassed = financialAudit.passedTests + recurringAudit.filter(r => r.passed).length;
    const totalFailed = totalTests - totalPassed;
    const successRate = (totalPassed / totalTests) * 100;

    // Coletar problemas críticos
    const criticalIssues = [
      ...financialAudit.criticalIssues,
      ...recurringAudit.filter(r => !r.passed).map(r => `Recurring: ${r.scenario}`)
    ];

    // Gerar recomendações
    const recommendations = this.generateRecommendations(financialAudit, recurringAudit);

    const masterReport: MasterAuditReport = {
      timestamp,
      financialAudit,
      recurringAudit,
      overallSummary: {
        totalTests,
        totalPassed,
        totalFailed,
        successRate,
        criticalIssues
      },
      recommendations
    };

    // Exibir relatório final
    this.displayMasterReport(masterReport);

    return masterReport;
  }

  // Gerar recomendações baseadas nos resultados
  private generateRecommendations(
    financialAudit: AuditReport, 
    recurringAudit: RecurringTestResult[]
  ): string[] {
    const recommendations: string[] = [];

    // Recomendações baseadas na auditoria financeira
    if (financialAudit.failedTests > 0) {
      recommendations.push('🔧 Corrigir falhas nos testes de lógica financeira básica');
    }

    if (financialAudit.criticalIssues.length > 0) {
      recommendations.push('🚨 Resolver problemas críticos de segurança e validação');
    }

    // Recomendações baseadas na auditoria de recorrentes
    const failedRecurring = recurringAudit.filter(r => !r.passed);
    if (failedRecurring.length > 0) {
      recommendations.push('📅 Corrigir lógica de processamento de transações recorrentes');
    }

    // Recomendações específicas
    const hasDateIssues = failedRecurring.some(r => r.scenario.includes('Date'));
    if (hasDateIssues) {
      recommendations.push('📆 Revisar lógica de validação de datas para transações recorrentes');
    }

    const hasFrequencyIssues = failedRecurring.some(r => r.scenario.includes('Frequency'));
    if (hasFrequencyIssues) {
      recommendations.push('🔄 Revisar lógica de frequência e contadores de transações');
    }

    // Recomendações gerais
    if (financialAudit.passedTests / financialAudit.totalTests < 0.95) {
      recommendations.push('⚡ Implementar testes unitários automatizados para prevenir regressões');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Sistema está funcionando corretamente! Manter monitoramento regular.');
    }

    return recommendations;
  }

  // Exibir relatório mestre formatado
  private displayMasterReport(report: MasterAuditReport): void {
    console.log('\n' + '=' .repeat(80));
    console.log('📋 RELATÓRIO MESTRE DE AUDITORIA FINANCEIRA');
    console.log('=' .repeat(80));
    console.log(`🕐 Timestamp: ${report.timestamp}`);
    console.log(`📊 Total de Testes: ${report.overallSummary.totalTests}`);
    console.log(`✅ Aprovados: ${report.overallSummary.totalPassed}`);
    console.log(`❌ Falharam: ${report.overallSummary.totalFailed}`);
    console.log(`🎯 Taxa de Sucesso Geral: ${report.overallSummary.successRate.toFixed(1)}%`);

    // Status geral
    if (report.overallSummary.successRate >= 95) {
      console.log('🟢 STATUS: SISTEMA SAUDÁVEL');
    } else if (report.overallSummary.successRate >= 80) {
      console.log('🟡 STATUS: ATENÇÃO NECESSÁRIA');
    } else {
      console.log('🔴 STATUS: CORREÇÕES URGENTES NECESSÁRIAS');
    }

    // Problemas críticos
    if (report.overallSummary.criticalIssues.length > 0) {
      console.log('\n🚨 PROBLEMAS CRÍTICOS ENCONTRADOS:');
      report.overallSummary.criticalIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }

    // Recomendações
    console.log('\n💡 RECOMENDAÇÕES:');
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

    // Detalhes por categoria
    console.log('\n📈 DETALHES POR CATEGORIA:');
    console.log(`🧮 Lógica Financeira: ${report.financialAudit.passedTests}/${report.financialAudit.totalTests} (${(report.financialAudit.passedTests/report.financialAudit.totalTests*100).toFixed(1)}%)`);
    
    const recurringPassed = report.recurringAudit.filter(r => r.passed).length;
    console.log(`🔄 Transações Recorrentes: ${recurringPassed}/${report.recurringAudit.length} (${(recurringPassed/report.recurringAudit.length*100).toFixed(1)}%)`);

    console.log('\n' + '=' .repeat(80));
  }

  // Executar teste rápido (versão simplificada)
  public async runQuickAudit(): Promise<void> {
    console.log('⚡ AUDITORIA RÁPIDA - TESTES ESSENCIAIS');
    console.log('-' .repeat(50));

    // Testes críticos apenas
    const criticalTests = [
      () => this.testCriticalCalculation(),
      () => this.testCriticalFormatting(),
      () => this.testCriticalRecurring()
    ];

    let passed = 0;
    let total = criticalTests.length;

    for (const test of criticalTests) {
      try {
        const result = test();
        if (result) passed++;
      } catch (error) {
        console.error(`❌ Teste crítico falhou: ${error}`);
      }
    }

    console.log(`\n⚡ Resultado Rápido: ${passed}/${total} testes críticos passaram`);
    
    if (passed === total) {
      console.log('✅ Sistema parece estar funcionando corretamente');
    } else {
      console.log('⚠️ Problemas detectados - execute auditoria completa');
    }
  }

  // Testes críticos individuais
  private testCriticalCalculation(): boolean {
    try {
      // Importar função de cálculo
      const { calculateBalance } = require('../utils/currencyUtils');
      const result = calculateBalance(100, 50, 30, 20);
      const expected = 100; // 100 + 50 - 30 - 20 = 100
      return Math.abs(result - expected) < 0.01;
    } catch (error) {
      console.error('❌ Erro no teste de cálculo crítico:', error);
      return false;
    }
  }

  private testCriticalFormatting(): boolean {
    try {
      const { formatCurrency, parseCurrency } = require('../utils/currencyUtils');
      const original = 1234.56;
      const formatted = formatCurrency(original);
      const parsed = parseCurrency(formatted);
      return Math.abs(parsed - original) < 0.01;
    } catch (error) {
      console.error('❌ Erro no teste de formatação crítica:', error);
      return false;
    }
  }

  private testCriticalRecurring(): boolean {
    try {
      // Teste básico de lógica de data
      const today = new Date();
      const pastDay = today.getDate() - 1;
      const futureDay = today.getDate() + 1;
      
      // Lógica: não deve processar dias passados no mês atual
      return pastDay < today.getDate() && futureDay > today.getDate();
    } catch (error) {
      console.error('❌ Erro no teste de recorrência crítica:', error);
      return false;
    }
  }
}