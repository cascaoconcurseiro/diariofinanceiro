/**
 * Script para Executar Todos os Testes
 * Executa análise completa e gera relatório final
 */

import { TestRunner } from './TestRunner';
import { BugAnalyzer } from './BugAnalyzer';

async function runCompleteAnalysis() {
  console.log('🚀 INICIANDO ANÁLISE COMPLETA DO SISTEMA FINANCEIRO');
  console.log('==================================================');
  
  try {
    // 1. Executar testes automatizados
    console.log('\n📋 FASE 1: Testes Automatizados');
    const testRunner = new TestRunner();
    const testReport = await testRunner.runAllTests();
    
    // 2. Análise específica de bugs
    console.log('\n🔍 FASE 2: Análise de Bugs Específicos');
    const bugAnalyzer = new BugAnalyzer();
    const bugReport = await bugAnalyzer.analyzeBugs();
    
    // 3. Relatório consolidado
    console.log('\n📊 FASE 3: Relatório Consolidado');
    
    const criticalBugs = bugAnalyzer.getBugsBySeverity('CRITICAL');
    const highBugs = bugAnalyzer.getBugsBySeverity('HIGH');
    const mediumBugs = bugAnalyzer.getBugsBySeverity('MEDIUM');
    const lowBugs = bugAnalyzer.getBugsBySeverity('LOW');
    
    console.log('\n🎯 RESUMO EXECUTIVO:');
    console.log('===================');
    console.log(`📊 Testes Executados: ${testReport.summary.totalTests}`);
    console.log(`✅ Testes Passaram: ${testReport.summary.totalPassed}`);
    console.log(`❌ Testes Falharam: ${testReport.summary.totalFailed}`);
    console.log(`📈 Taxa de Sucesso: ${testReport.summary.successRate.toFixed(1)}%`);
    console.log(`🐛 Bugs Encontrados: ${bugReport.length}`);
    console.log(`🚨 Bugs Críticos: ${criticalBugs.length}`);
    console.log(`🔴 Bugs Altos: ${highBugs.length}`);
    console.log(`🟡 Bugs Médios: ${mediumBugs.length}`);
    console.log(`🟢 Bugs Baixos: ${lowBugs.length}`);
    
    // 4. Prioridades de correção
    console.log('\n🎯 PRIORIDADES DE CORREÇÃO:');
    console.log('===========================');
    
    if (criticalBugs.length > 0) {
      console.log('\n🚨 URGENTE - Bugs Críticos (Corrigir IMEDIATAMENTE):');
      criticalBugs.forEach((bug, index) => {
        console.log(`   ${index + 1}. ${bug.title}`);
        console.log(`      📍 ${bug.location}`);
        console.log(`      💡 ${bug.recommendation}`);
        console.log('');
      });
    }
    
    if (highBugs.length > 0) {
      console.log('\n🔴 ALTA PRIORIDADE - Bugs Importantes:');
      highBugs.forEach((bug, index) => {
        console.log(`   ${index + 1}. ${bug.title}`);
        console.log(`      📍 ${bug.location}`);
        console.log(`      💡 ${bug.recommendation}`);
        console.log('');
      });
    }
    
    // 5. Recomendações gerais
    console.log('\n💡 RECOMENDAÇÕES GERAIS:');
    console.log('========================');
    
    if (testReport.summary.successRate < 95) {
      console.log('🔧 1. Taxa de sucesso baixa - Revisar implementação geral');
    }
    
    if (criticalBugs.length > 0) {
      console.log('🚨 2. Bugs críticos encontrados - NÃO FAZER DEPLOY até correção');
    }
    
    if (highBugs.length > 0) {
      console.log('🔴 3. Bugs de alta prioridade - Corrigir antes do próximo release');
    }
    
    console.log('🧪 4. Implementar testes automatizados no CI/CD');
    console.log('📊 5. Monitorar métricas de qualidade continuamente');
    console.log('🔄 6. Executar esta análise regularmente');
    
    // 6. Status final
    console.log('\n🏁 STATUS FINAL:');
    console.log('================');
    
    if (criticalBugs.length === 0 && testReport.summary.successRate >= 95) {
      console.log('✅ SISTEMA APROVADO - Pronto para produção');
    } else if (criticalBugs.length === 0 && testReport.summary.successRate >= 80) {
      console.log('⚠️ SISTEMA COM RESSALVAS - Corrigir bugs não-críticos');
    } else {
      console.log('❌ SISTEMA REPROVADO - Corrigir bugs críticos antes do deploy');
    }
    
    // 7. Salvar relatórios
    testRunner.saveReport(testReport);
    
    const bugReportJson = bugAnalyzer.generateJSONReport();
    localStorage.setItem('bugAnalysisReport', bugReportJson);
    
    console.log('\n💾 Relatórios salvos no localStorage');
    console.log('📋 testReport: lastTestReport');
    console.log('🐛 bugReport: bugAnalysisReport');
    
  } catch (error) {
    console.error('💥 ERRO CRÍTICO na análise:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (typeof window !== 'undefined') {
  // Browser environment
  (window as any).runCompleteAnalysis = runCompleteAnalysis;
  console.log('🌐 Função disponível globalmente: runCompleteAnalysis()');
} else {
  // Node environment
  runCompleteAnalysis().catch(console.error);
}

export { runCompleteAnalysis };