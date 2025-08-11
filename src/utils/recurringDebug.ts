/**
 * SISTEMA DE DEBUG PARA TRANSAÇÕES RECORRENTES
 * Monitora e registra todas as operações para identificar problemas
 */

import { getRecurringStats, validateRecurringRecords } from './recurringTransactionControl';

class RecurringDebugger {
  private static instance: RecurringDebugger | null = null;
  private logs: string[] = [];
  private readonly MAX_LOGS = 100;

  private constructor() {}

  public static getInstance(): RecurringDebugger {
    if (!RecurringDebugger.instance) {
      RecurringDebugger.instance = new RecurringDebugger();
    }
    return RecurringDebugger.instance;
  }

  public log(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    
    this.logs.push(logEntry);
    
    // Manter apenas os últimos logs
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS);
    }
    
    console.log(`🔍 RECURRING DEBUG: ${logEntry}`);
  }

  public logRecurringAttempt(
    recurringId: string,
    year: number,
    month: number,
    day: number,
    amount: number,
    type: string,
    wasBlocked: boolean
  ): void {
    const status = wasBlocked ? '🚫 BLOCKED' : '✅ PROCESSED';
    this.log(`${status} - ID:${recurringId} Date:${year}-${month+1}-${day} Type:${type} Amount:${amount}`);
  }

  public logNavigationChange(fromYear: number, fromMonth: number, toYear: number, toMonth: number): void {
    this.log(`📅 NAVIGATION: ${fromYear}-${fromMonth+1} → ${toYear}-${toMonth+1}`);
  }

  public generateReport(): string {
    const stats = getRecurringStats();
    const validation = validateRecurringRecords();
    
    const report = [
      '📊 RECURRING TRANSACTIONS DEBUG REPORT',
      '=' .repeat(50),
      `Total Records: ${stats.totalRecords}`,
      `Current Year Records: ${stats.currentYearRecords}`,
      `Oldest Record: ${stats.oldestRecord}`,
      `Newest Record: ${stats.newestRecord}`,
      '',
      '🔍 VALIDATION RESULTS:',
      `Valid Records: ${validation.valid}`,
      `Invalid Records: ${validation.invalid}`,
      `Fixed Records: ${validation.fixed}`,
      '',
      '📝 RECENT LOGS:',
      ...this.logs.slice(-20) // Últimos 20 logs
    ].join('\n');
    
    return report;
  }

  public exportLogs(): string[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
    this.log('Logs cleared');
  }
}

// Exportar instância singleton
export const recurringDebugger = RecurringDebugger.getInstance();

// Funções de conveniência
export const logRecurringAttempt = (
  recurringId: string,
  year: number,
  month: number,
  day: number,
  amount: number,
  type: string,
  wasBlocked: boolean
) => recurringDebugger.logRecurringAttempt(recurringId, year, month, day, amount, type, wasBlocked);

export const logNavigationChange = (fromYear: number, fromMonth: number, toYear: number, toMonth: number) =>
  recurringDebugger.logNavigationChange(fromYear, fromMonth, toYear, toMonth);

export const generateRecurringReport = () => recurringDebugger.generateReport();

export const exportRecurringLogs = () => recurringDebugger.exportLogs();

export const clearRecurringLogs = () => recurringDebugger.clearLogs();