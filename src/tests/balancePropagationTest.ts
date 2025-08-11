import { TransactionImpactCalculator } from '../utils/transactionImpactCalculator';
import { CascadeBalanceManager } from '../utils/cascadeBalanceManager';

/**
 * TESTE RÁPIDO: Sistema de Propagação de Saldo
 * 
 * Execute este teste para verificar se o sistema está funcionando
 */
export class BalancePropagationTest {
  private impactCalculator: TransactionImpactCalculator;
  private cascadeManager: CascadeBalanceManager;

  constructor() {
    this.impactCalculator = new TransactionImpactCalculator();
    this.cascadeManager = new CascadeBalanceManager();
  }

  /**
   * Executa teste completo do sistema de propagação
   */
  async runCompleteTest(): Promise<{
    success: boolean;
    results: any[];
    errors: string[];
    summary: string;
  }> {
    console.log('🧪 TESTE: Iniciando teste completo do sistema de propagação');
    
    const results: any[] = [];
    const errors: string[] = [];

    try {
      // Teste 1: Cálculo de impacto para nova transação
      console.log('\n📊 TESTE 1: Calculando impacto de nova transação');
      const novaTransacao = {
        id: 'teste-salario-jan',
        date: '2025-01-15',
        amount: 3000,
        type: 'entrada',
        description: 'Salário Janeiro - Teste'
      };

      const impactoCreate = this.impactCalculator.calculateImpact('CREATE', novaTransacao);
      results.push({
        teste: 'Impacto CREATE',
        resultado: impactoCreate,
        sucesso: impactoCreate.difference === 3000
      });

      console.log('✅ Impacto calculado:', {
        diferenca: impactoCreate.difference,
        mesesAfetados: impactoCreate.affectedPeriods.length,
        prioridade: impactoCreate.priority
      });

      // Teste 2: Cálculo de impacto para edição de transação
      console.log('\n📊 TESTE 2: Calculando impacto de edição de transação');
      const transacaoEditada = { ...novaTransacao, amount: 3500 };
      
      const impactoUpdate = this.impactCalculator.calculateImpact('UPDATE', transacaoEditada, novaTransacao);
      results.push({
        teste: 'Impacto UPDATE',
        resultado: impactoUpdate,
        sucesso: impactoUpdate.difference === 500
      });

      console.log('✅ Impacto de edição calculado:', {
        diferenca: impactoUpdate.difference,
        valorAntigo: impactoUpdate.oldValue,
        valorNovo: impactoUpdate.newValue
      });

      // Teste 3: Cálculo de impacto para exclusão
      console.log('\n📊 TESTE 3: Calculando impacto de exclusão de transação');
      const impactoDelete = this.impactCalculator.calculateImpact('DELETE', novaTransacao);
      results.push({
        teste: 'Impacto DELETE',
        resultado: impactoDelete,
        sucesso: impactoDelete.difference === -3000
      });

      console.log('✅ Impacto de exclusão calculado:', {
        diferenca: impactoDelete.difference,
        valorRemovido: impactoDelete.oldValue
      });

      // Teste 4: Processamento em lote
      console.log('\n📊 TESTE 4: Processamento em lote de múltiplas transações');
      const operacoes = [
        {
          type: 'CREATE' as const,
          transaction: {
            id: 'teste-conta-luz',
            date: '2025-01-10',
            amount: 150,
            type: 'saida',
            description: 'Conta de Luz'
          }
        },
        {
          type: 'CREATE' as const,
          transaction: {
            id: 'teste-supermercado',
            date: '2025-01-12',
            amount: 300,
            type: 'diario',
            description: 'Supermercado'
          }
        }
      ];

      const resultadoLote = this.impactCalculator.calculateBatchImpact(operacoes);
      results.push({
        teste: 'Processamento em Lote',
        resultado: resultadoLote,
        sucesso: resultadoLote.impacts.length === 2
      });

      console.log('✅ Processamento em lote concluído:', {
        impactos: resultadoLote.impacts.length,
        mesesAfetados: resultadoLote.totalAffectedMonths,
        tempoEstimado: resultadoLote.estimatedProcessingTime
      });

      // Teste 5: Propagação em cascata
      console.log('\n📊 TESTE 5: Testando propagação em cascata');
      const opcoesPropagacao = {
        startDate: '2025-01-15',
        batchSize: 5,
        validateIntegrity: true,
        rollbackOnError: true
      };

      const resultadoPropagacao = await this.cascadeManager.propagateFromDate(
        '2025-01-15',
        3000,
        opcoesPropagacao
      );

      results.push({
        teste: 'Propagação em Cascata',
        resultado: resultadoPropagacao,
        sucesso: resultadoPropagacao.success
      });

      console.log('✅ Propagação em cascata concluída:', {
        sucesso: resultadoPropagacao.success,
        mesesProcessados: resultadoPropagacao.processedMonths.length,
        tempoExecucao: resultadoPropagacao.executionTime,
        erros: resultadoPropagacao.errors.length
      });

      // Teste 6: Validação de integridade
      console.log('\n📊 TESTE 6: Validando integridade do sistema');
      const validacao = await this.cascadeManager.validatePropagationIntegrity();
      results.push({
        teste: 'Validação de Integridade',
        resultado: validacao,
        sucesso: validacao.isValid
      });

      console.log('✅ Validação de integridade concluída:', {
        valido: validacao.isValid,
        erros: validacao.errors.length,
        avisos: validacao.warnings.length
      });

      // Resumo final
      const testesComSucesso = results.filter(r => r.sucesso).length;
      const totalTestes = results.length;
      const taxaSucesso = (testesComSucesso / totalTestes) * 100;

      const summary = `
🎯 RESUMO DO TESTE:
- Testes executados: ${totalTestes}
- Testes com sucesso: ${testesComSucesso}
- Taxa de sucesso: ${taxaSucesso.toFixed(1)}%
- Erros encontrados: ${errors.length}

${taxaSucesso === 100 ? '✅ TODOS OS TESTES PASSARAM!' : '⚠️ ALGUNS TESTES FALHARAM'}
      `;

      console.log(summary);

      return {
        success: taxaSucesso === 100,
        results,
        errors,
        summary
      };

    } catch (error) {
      const errorMsg = `Erro durante execução dos testes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      errors.push(errorMsg);
      console.error('❌ TESTE FALHOU:', errorMsg);

      return {
        success: false,
        results,
        errors,
        summary: `❌ TESTE FALHOU: ${errorMsg}`
      };
    }
  }

  /**
   * Teste rápido para verificar funcionamento básico
   */
  async quickTest(): Promise<boolean> {
    console.log('⚡ TESTE RÁPIDO: Verificando funcionamento básico');

    try {
      // Teste básico de cálculo de impacto
      const transacao = {
        id: 'teste-rapido',
        date: '2025-01-15',
        amount: 1000,
        type: 'entrada'
      };

      const impacto = this.impactCalculator.calculateImpact('CREATE', transacao);
      
      const funcionando = (
        impacto.difference === 1000 &&
        impacto.affectedPeriods.length > 0 &&
        impacto.priority > 0
      );

      console.log(funcionando ? '✅ TESTE RÁPIDO: Sistema funcionando!' : '❌ TESTE RÁPIDO: Sistema com problemas');
      
      return funcionando;
    } catch (error) {
      console.error('❌ TESTE RÁPIDO FALHOU:', error);
      return false;
    }
  }

  /**
   * Simula cenário real de uso
   */
  async simulateRealScenario(): Promise<void> {
    console.log('🎭 SIMULAÇÃO: Cenário real de uso do sistema');

    try {
      // Cenário: Usuário adiciona salário, depois algumas despesas, depois edita o salário
      
      // 1. Adicionar salário
      const salario = {
        id: 'salario-fev-2025',
        date: '2025-02-05',
        amount: 4000,
        type: 'entrada',
        description: 'Salário Fevereiro'
      };

      const impactoSalario = this.impactCalculator.calculateImpact('CREATE', salario);
      console.log('💰 Salário adicionado - Impacto:', impactoSalario.difference);

      // 2. Adicionar despesas
      const despesas = [
        { id: 'aluguel-fev', date: '2025-02-10', amount: 1200, type: 'saida', description: 'Aluguel' },
        { id: 'mercado-fev', date: '2025-02-12', amount: 400, type: 'diario', description: 'Supermercado' },
        { id: 'gasolina-fev', date: '2025-02-15', amount: 200, type: 'diario', description: 'Gasolina' }
      ];

      const operacoesDespesas = despesas.map(despesa => ({
        type: 'CREATE' as const,
        transaction: despesa
      }));

      const impactoDespesas = this.impactCalculator.calculateBatchImpact(operacoesDespesas);
      console.log('💸 Despesas adicionadas - Total de impactos:', impactoDespesas.impacts.length);

      // 3. Editar salário (aumento)
      const salarioEditado = { ...salario, amount: 4500 };
      const impactoEdicao = this.impactCalculator.calculateImpact('UPDATE', salarioEditado, salario);
      console.log('📈 Salário editado - Diferença:', impactoEdicao.difference);

      // 4. Propagar todas as mudanças
      const todoImpactos = [impactoSalario, ...impactoDespesas.impacts, impactoEdicao];
      const propagacao = await this.cascadeManager.propagateBatch(todoImpactos);
      
      console.log('🔗 Propagação completa:', {
        sucesso: propagacao.success,
        mesesProcessados: propagacao.processedMonths.length,
        transacoesAfetadas: propagacao.affectedTransactions,
        tempo: propagacao.executionTime
      });

      console.log('✅ SIMULAÇÃO: Cenário real concluído com sucesso!');

    } catch (error) {
      console.error('❌ SIMULAÇÃO FALHOU:', error);
    }
  }
}

// Instância para uso direto
export const balancePropagationTest = new BalancePropagationTest();

// Função para executar teste rápido via console
export async function testarPropagacaoSaldo(): Promise<void> {
  console.log('🚀 INICIANDO TESTE DO SISTEMA DE PROPAGAÇÃO DE SALDO');
  
  const teste = new BalancePropagationTest();
  
  // Teste rápido primeiro
  const testeRapido = await teste.quickTest();
  if (!testeRapido) {
    console.log('❌ Teste rápido falhou - sistema pode ter problemas');
    return;
  }

  // Teste completo
  const resultado = await teste.runCompleteTest();
  
  if (resultado.success) {
    console.log('🎉 SISTEMA DE PROPAGAÇÃO FUNCIONANDO PERFEITAMENTE!');
    
    // Executar simulação de cenário real
    await teste.simulateRealScenario();
  } else {
    console.log('⚠️ Sistema com problemas - verifique os erros:', resultado.errors);
  }
}