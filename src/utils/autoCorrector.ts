import { Transaction, MonthlyData } from '../types/financial';
import { BalancePropagationEngine } from './balancePropagationEngine';
import { DataIntegrityValidator, ValidationError } from './dataIntegrityValidator';

export interface CorrectionResult {
  success: boolean;
  correctionsMade: number;
  errors: string[];
  details: string[];
  backupCreated: boolean;
}

export interface BackupResult {
  success: boolean;
  backupId: string;
  timestamp: Date;
  error?: string;
}

export class AutoCorrector {
  private data: Map<string, MonthlyData>;
  private propagationEngine: BalancePropagationEngine;
  private validator: DataIntegrityValidator;

  constructor(data: Map<string, MonthlyData>) {
    this.data = new Map(data);
    this.propagationEngine = new BalancePropagationEngine(this.data);
    this.validator = new DataIntegrityValidator(this.data);
  }

  /**
   * Executa correção automática completa
   */
  async executeAutoCorrection(): Promise<CorrectionResult> {
    const details: string[] = [];
    const errors: string[] = [];
    let correctionsMade = 0;

    try {
      // 1. Criar backup antes de qualquer correção
      details.push('🔄 Criando backup de segurança...');
      const backupResult = await this.createBackupBeforeCorrection();
      
      if (!backupResult.success) {
        errors.push(`Falha ao criar backup: ${backupResult.error}`);
        return {
          success: false,
          correctionsMade: 0,
          errors,
          details,
          backupCreated: false
        };
      }

      details.push(`✅ Backup criado: ${backupResult.backupId}`);

      // 2. Corrigir propagação de saldos
      details.push('🔧 Corrigindo propagação de saldos...');
      const balanceResult = await this.fixBalancePropagation();
      if (balanceResult.success) {
        correctionsMade += balanceResult.correctionsMade;
        details.push(...balanceResult.details);
      } else {
        errors.push(...balanceResult.errors);
      }

      // 3. Corrigir transações recorrentes
      details.push('🔄 Corrigindo transações recorrentes...');
      const recurringResult = await this.fixRecurringTransactions();
      if (recurringResult.success) {
        correctionsMade += recurringResult.correctionsMade;
        details.push(...recurringResult.details);
      } else {
        errors.push(...recurringResult.errors);
      }

      // 4. Corrigir formatação de moeda
      details.push('💱 Corrigindo formatação de valores...');
      const currencyResult = await this.fixCurrencyFormatting();
      if (currencyResult.success) {
        correctionsMade += currencyResult.correctionsMade;
        details.push(...currencyResult.details);
      } else {
        errors.push(...currencyResult.errors);
      }

      // 5. Validação final
      details.push('✅ Executando validação final...');
      const finalValidation = this.validator.generateIntegrityReport();
      
      if (finalValidation.isValid) {
        details.push('🎉 Correção concluída com sucesso!');
      } else {
        details.push(`⚠️ ${finalValidation.errors.length} problemas ainda persistem`);
        errors.push(...finalValidation.errors.map(e => e.message));
      }

      return {
        success: errors.length === 0,
        correctionsMade,
        errors,
        details,
        backupCreated: backupResult.success
      };

    } catch (error) {
      errors.push(`Erro durante correção automática: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      
      return {
        success: false,
        correctionsMade,
        errors,
        details,
        backupCreated: backupResult?.success || false
      };
    }
  }

  /**
   * Corrige propagação de saldos
   */
  async fixBalancePropagation(): Promise<CorrectionResult> {
    const details: string[] = [];
    const errors: string[] = [];
    let correctionsMade = 0;

    try {
      // Validar integridade atual
      const validation = this.validator.generateIntegrityReport();
      const balanceErrors = validation.errors.filter(e => 
        e.type === 'BALANCE_MISMATCH' || e.type === 'CONTINUITY_BREAK'
      );

      if (balanceErrors.length === 0) {
        details.push('✅ Propagação de saldos já está correta');
        return { success: true, correctionsMade: 0, errors: [], details, backupCreated: false };
      }

      details.push(`🔍 Encontrados ${balanceErrors.length} problemas de saldo`);

      // Recalcular todos os saldos desde o primeiro mês
      const sortedMonths = Array.from(this.data.keys()).sort();
      if (sortedMonths.length === 0) {
        details.push('ℹ️ Nenhum dado para corrigir');
        return { success: true, correctionsMade: 0, errors: [], details, backupCreated: false };
      }

      const firstMonthKey = sortedMonths[0];
      const [year, month] = firstMonthKey.split('-').map(Number);
      const firstDate = new Date(year, month - 1, 1);

      const propagationResult = this.propagationEngine.recalculateFromDate(firstDate);
      
      if (propagationResult.success) {
        // Atualizar dados com os valores corrigidos
        this.data = this.propagationEngine.getData();
        this.validator.updateData(this.data);
        
        correctionsMade = propagationResult.affectedMonths.length;
        details.push(`✅ Saldos recalculados para ${correctionsMade} meses`);
        details.push(`📊 Meses afetados: ${propagationResult.affectedMonths.join(', ')}`);
      } else {
        errors.push(...propagationResult.errors);
        details.push('❌ Falha no recálculo de saldos');
      }

      return {
        success: propagationResult.success,
        correctionsMade,
        errors,
        details,
        backupCreated: false
      };

    } catch (error) {
      errors.push(`Erro na correção de saldos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return { success: false, correctionsMade, errors, details, backupCreated: false };
    }
  }

  /**
   * Corrige transações recorrentes
   */
  async fixRecurringTransactions(): Promise<CorrectionResult> {
    const details: string[] = [];
    const errors: string[] = [];
    let correctionsMade = 0;

    try {
      const validation = this.validator.generateIntegrityReport();
      const recurringErrors = validation.errors.filter(e => e.type === 'RECURRING_ERROR');

      if (recurringErrors.length === 0) {
        details.push('✅ Transações recorrentes já estão corretas');
        return { success: true, correctionsMade: 0, errors: [], details, backupCreated: false };
      }

      details.push(`🔍 Encontrados ${recurringErrors.length} problemas em recorrências`);

      // Agrupar transações recorrentes
      const recurringGroups = new Map<string, { transactions: Transaction[], monthKeys: string[] }>();
      
      for (const [monthKey, monthData] of this.data.entries()) {
        for (const transaction of monthData.transactions) {
          if (transaction.isRecurring && transaction.recurringId) {
            if (!recurringGroups.has(transaction.recurringId)) {
              recurringGroups.set(transaction.recurringId, { transactions: [], monthKeys: [] });
            }
            const group = recurringGroups.get(transaction.recurringId)!;
            group.transactions.push(transaction);
            group.monthKeys.push(monthKey);
          }
        }
      }

      // Corrigir cada grupo
      for (const [recurringId, group] of recurringGroups.entries()) {
        if (group.transactions.length < 2) continue;

        // Usar a primeira transação como referência
        const referenceTransaction = group.transactions[0];
        let groupCorrectionsMade = 0;

        for (let i = 1; i < group.transactions.length; i++) {
          const transaction = group.transactions[i];
          let transactionChanged = false;

          // Corrigir valor se diferente
          if (transaction.amount !== referenceTransaction.amount) {
            transaction.amount = referenceTransaction.amount;
            transactionChanged = true;
            groupCorrectionsMade++;
          }

          // Corrigir tipo se diferente
          if (transaction.type !== referenceTransaction.type) {
            transaction.type = referenceTransaction.type;
            transactionChanged = true;
            groupCorrectionsMade++;
          }

          // Corrigir categoria se diferente
          if (transaction.category !== referenceTransaction.category) {
            transaction.category = referenceTransaction.category;
            transactionChanged = true;
            groupCorrectionsMade++;
          }

          if (transactionChanged) {
            details.push(`🔧 Corrigida transação recorrente ${transaction.id} em ${group.monthKeys[i]}`);
          }
        }

        if (groupCorrectionsMade > 0) {
          correctionsMade += groupCorrectionsMade;
          details.push(`✅ Grupo ${recurringId}: ${groupCorrectionsMade} correções`);
        }
      }

      // Se houve correções, recalcular saldos
      if (correctionsMade > 0) {
        const sortedMonths = Array.from(this.data.keys()).sort();
        if (sortedMonths.length > 0) {
          const firstMonthKey = sortedMonths[0];
          const [year, month] = firstMonthKey.split('-').map(Number);
          const firstDate = new Date(year, month - 1, 1);
          
          this.propagationEngine.updateData(this.data);
          this.propagationEngine.recalculateFromDate(firstDate);
          this.data = this.propagationEngine.getData();
        }
      }

      return {
        success: true,
        correctionsMade,
        errors,
        details,
        backupCreated: false
      };

    } catch (error) {
      errors.push(`Erro na correção de recorrências: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return { success: false, correctionsMade, errors, details, backupCreated: false };
    }
  }

  /**
   * Corrige formatação de valores monetários
   */
  async fixCurrencyFormatting(): Promise<CorrectionResult> {
    const details: string[] = [];
    const errors: string[] = [];
    let correctionsMade = 0;

    try {
      for (const [monthKey, monthData] of this.data.entries()) {
        let monthCorrectionsMade = 0;

        // Corrigir saldos do mês
        if (isNaN(monthData.initialBalance)) {
          monthData.initialBalance = 0;
          monthCorrectionsMade++;
        }

        if (isNaN(monthData.finalBalance)) {
          monthData.finalBalance = monthData.initialBalance;
          monthCorrectionsMade++;
        }

        // Arredondar para 2 casas decimais
        monthData.initialBalance = Math.round(monthData.initialBalance * 100) / 100;
        monthData.finalBalance = Math.round(monthData.finalBalance * 100) / 100;

        // Corrigir transações
        for (const transaction of monthData.transactions) {
          if (isNaN(transaction.amount) || transaction.amount <= 0) {
            // Tentar recuperar valor válido ou remover transação
            if (transaction.description.includes('R$')) {
              const match = transaction.description.match(/R\$\s*(\d+(?:,\d{2})?)/);
              if (match) {
                transaction.amount = parseFloat(match[1].replace(',', '.'));
                monthCorrectionsMade++;
              }
            }
            
            if (isNaN(transaction.amount) || transaction.amount <= 0) {
              // Remover transação inválida
              const index = monthData.transactions.indexOf(transaction);
              monthData.transactions.splice(index, 1);
              monthCorrectionsMade++;
              details.push(`🗑️ Removida transação inválida: ${transaction.description}`);
            }
          } else {
            // Arredondar para 2 casas decimais
            transaction.amount = Math.round(transaction.amount * 100) / 100;
          }
        }

        if (monthCorrectionsMade > 0) {
          correctionsMade += monthCorrectionsMade;
          details.push(`💱 ${monthKey}: ${monthCorrectionsMade} correções de formatação`);
        }
      }

      if (correctionsMade > 0) {
        details.push(`✅ Total: ${correctionsMade} correções de formatação`);
      } else {
        details.push('✅ Formatação de valores já está correta');
      }

      return {
        success: true,
        correctionsMade,
        errors,
        details,
        backupCreated: false
      };

    } catch (error) {
      errors.push(`Erro na correção de formatação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return { success: false, correctionsMade, errors, details, backupCreated: false };
    }
  }

  /**
   * Cria backup antes de correções
   */
  async createBackupBeforeCorrection(): Promise<BackupResult> {
    try {
      const timestamp = new Date();
      const backupId = `backup_${timestamp.getTime()}`;
      
      const backupData = {
        id: backupId,
        timestamp: timestamp.toISOString(),
        data: Object.fromEntries(this.data.entries())
      };

      // Salvar no localStorage
      const existingBackups = JSON.parse(localStorage.getItem('financialBackups') || '[]');
      existingBackups.push(backupData);
      
      // Manter apenas os 10 backups mais recentes
      if (existingBackups.length > 10) {
        existingBackups.splice(0, existingBackups.length - 10);
      }
      
      localStorage.setItem('financialBackups', JSON.stringify(existingBackups));

      return {
        success: true,
        backupId,
        timestamp
      };

    } catch (error) {
      return {
        success: false,
        backupId: '',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Erro ao criar backup'
      };
    }
  }

  /**
   * Restaura backup específico
   */
  async restoreBackup(backupId: string): Promise<CorrectionResult> {
    try {
      const existingBackups = JSON.parse(localStorage.getItem('financialBackups') || '[]');
      const backup = existingBackups.find((b: any) => b.id === backupId);

      if (!backup) {
        return {
          success: false,
          correctionsMade: 0,
          errors: [`Backup ${backupId} não encontrado`],
          details: [],
          backupCreated: false
        };
      }

      // Restaurar dados
      this.data = new Map(Object.entries(backup.data));
      this.propagationEngine.updateData(this.data);
      this.validator.updateData(this.data);

      return {
        success: true,
        correctionsMade: 1,
        errors: [],
        details: [`✅ Backup ${backupId} restaurado com sucesso`],
        backupCreated: false
      };

    } catch (error) {
      return {
        success: false,
        correctionsMade: 0,
        errors: [`Erro ao restaurar backup: ${error instanceof Error ? error.message : 'Erro desconhecido'}`],
        details: [],
        backupCreated: false
      };
    }
  }

  /**
   * Lista backups disponíveis
   */
  getAvailableBackups(): Array<{ id: string; timestamp: string; size: number }> {
    try {
      const existingBackups = JSON.parse(localStorage.getItem('financialBackups') || '[]');
      return existingBackups.map((backup: any) => ({
        id: backup.id,
        timestamp: backup.timestamp,
        size: Object.keys(backup.data).length
      }));
    } catch {
      return [];
    }
  }

  /**
   * Obtém dados corrigidos
   */
  getCorrectedData(): Map<string, MonthlyData> {
    return new Map(this.data);
  }

  /**
   * Atualiza dados para correção
   */
  updateData(newData: Map<string, MonthlyData>): void {
    this.data = new Map(newData);
    this.propagationEngine.updateData(this.data);
    this.validator.updateData(this.data);
  }
}