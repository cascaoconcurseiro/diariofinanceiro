/**
 * CONTROLE AVANÇADO DE TRANSAÇÕES RECORRENTES
 * Sistema definitivo para evitar multiplicação de lançamentos
 */

interface RecurringRecord {
  recurringId: string;
  year: number;
  month: number;
  day: number;
  amount: number;
  type: string;
  processedAt: number;
  hash: string;
}

class RecurringTransactionControl {
  private static instance: RecurringTransactionControl | null = null;
  private readonly STORAGE_KEY = '__recurring_control__';
  private processedRecurrings: Map<string, RecurringRecord> = new Map();
  private isInitialized = false;

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): RecurringTransactionControl {
    if (!RecurringTransactionControl.instance) {
      RecurringTransactionControl.instance = new RecurringTransactionControl();
    }
    return RecurringTransactionControl.instance;
  }

  /**
   * Gera chave única para transação recorrente
   */
  private generateRecurringKey(recurringId: string, year: number, month: number): string {
    return `${recurringId}_${year}_${month}`;
  }

  /**
   * Gera hash para validação de integridade
   */
  private generateHash(recurringId: string, year: number, month: number, day: number, amount: number, type: string): string {
    const data = `${recurringId}|${year}|${month}|${day}|${amount}|${type}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Verifica se transação recorrente já foi processada para um mês específico
   */
  public isRecurringProcessedForMonth(
    recurringId: string, 
    year: number, 
    month: number, 
    day: number, 
    amount: number, 
    type: string
  ): boolean {
    const key = this.generateRecurringKey(recurringId, year, month);
    const record = this.processedRecurrings.get(key);
    
    if (!record) {
      return false;
    }

    // Verificar integridade do registro
    const expectedHash = this.generateHash(recurringId, year, month, day, amount, type);
    if (record.hash !== expectedHash) {
      console.warn(`⚠️ Hash mismatch for recurring ${recurringId} in ${year}-${month + 1}, removing record`);
      this.processedRecurrings.delete(key);
      this.saveToStorage();
      return false;
    }

    console.log(`✅ Recurring ${recurringId} already processed for ${year}-${month + 1}-${day}`);
    return true;
  }

  /**
   * Marca transação recorrente como processada para um mês
   */
  public markRecurringProcessedForMonth(
    recurringId: string, 
    year: number, 
    month: number, 
    day: number, 
    amount: number, 
    type: string
  ): void {
    const key = this.generateRecurringKey(recurringId, year, month);
    const hash = this.generateHash(recurringId, year, month, day, amount, type);
    
    const record: RecurringRecord = {
      recurringId,
      year,
      month,
      day,
      amount,
      type,
      processedAt: Date.now(),
      hash
    };

    this.processedRecurrings.set(key, record);
    this.saveToStorage();
    
    console.log(`🔒 Marked recurring ${recurringId} as processed for ${year}-${month + 1}-${day} [${hash}]`);
  }

  /**
   * Remove registro de transação recorrente (para reprocessamento)
   */
  public removeRecurringRecord(recurringId: string, year: number, month: number): void {
    const key = this.generateRecurringKey(recurringId, year, month);
    const removed = this.processedRecurrings.delete(key);
    
    if (removed) {
      this.saveToStorage();
      console.log(`🗑️ Removed recurring record ${recurringId} for ${year}-${month + 1}`);
    }
  }

  /**
   * Limpa registros de um mês específico
   */
  public clearMonth(year: number, month: number): void {
    let cleared = 0;
    const monthSuffix = `_${year}_${month}`;
    
    for (const [key] of this.processedRecurrings.entries()) {
      if (key.endsWith(monthSuffix)) {
        this.processedRecurrings.delete(key);
        cleared++;
      }
    }
    
    if (cleared > 0) {
      this.saveToStorage();
      console.log(`🧹 Cleared ${cleared} recurring records for ${year}-${month + 1}`);
    }
  }

  /**
   * Limpa registros antigos (mais de 1 ano)
   */
  public cleanupOldRecords(): void {
    const currentYear = new Date().getFullYear();
    const cutoffYear = currentYear - 1;
    let cleaned = 0;
    
    for (const [key, record] of this.processedRecurrings.entries()) {
      if (record.year < cutoffYear) {
        this.processedRecurrings.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.saveToStorage();
      console.log(`🧹 Cleaned ${cleaned} old recurring records`);
    }
  }

  /**
   * Obtém todos os registros de um ano
   */
  public getYearRecords(year: number): RecurringRecord[] {
    const records: RecurringRecord[] = [];
    
    for (const record of this.processedRecurrings.values()) {
      if (record.year === year) {
        records.push(record);
      }
    }
    
    return records.sort((a, b) => a.month - b.month);
  }

  /**
   * Verifica integridade de todos os registros
   */
  public validateAllRecords(): { valid: number; invalid: number; fixed: number } {
    let valid = 0;
    let invalid = 0;
    let fixed = 0;
    
    const toRemove: string[] = [];
    
    for (const [key, record] of this.processedRecurrings.entries()) {
      const expectedHash = this.generateHash(
        record.recurringId, 
        record.year, 
        record.month, 
        record.day, 
        record.amount, 
        record.type
      );
      
      if (record.hash === expectedHash) {
        valid++;
      } else {
        console.warn(`⚠️ Invalid record found: ${key}`);
        toRemove.push(key);
        invalid++;
      }
    }
    
    // Remover registros inválidos
    for (const key of toRemove) {
      this.processedRecurrings.delete(key);
      fixed++;
    }
    
    if (fixed > 0) {
      this.saveToStorage();
    }
    
    return { valid, invalid, fixed };
  }

  /**
   * Carrega dados do localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (Array.isArray(data)) {
          // Converter array para Map
          for (const record of data) {
            if (record && record.recurringId && record.year !== undefined && record.month !== undefined) {
              const key = this.generateRecurringKey(record.recurringId, record.year, record.month);
              this.processedRecurrings.set(key, record);
            }
          }
        } else if (data && typeof data === 'object') {
          // Formato Map serializado
          for (const [key, record] of Object.entries(data)) {
            if (record && typeof record === 'object') {
              this.processedRecurrings.set(key, record as RecurringRecord);
            }
          }
        }
        
        console.log(`📂 Loaded ${this.processedRecurrings.size} recurring records from storage`);
      }
    } catch (error) {
      console.error('❌ Error loading recurring records:', error);
      this.processedRecurrings.clear();
    }
    
    this.isInitialized = true;
  }

  /**
   * Salva dados no localStorage
   */
  private saveToStorage(): void {
    if (!this.isInitialized) return;
    
    try {
      // Converter Map para objeto para serialização
      const dataToSave: { [key: string]: RecurringRecord } = {};
      for (const [key, record] of this.processedRecurrings.entries()) {
        dataToSave[key] = record;
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('❌ Error saving recurring records:', error);
    }
  }

  /**
   * Obtém estatísticas
   */
  public getStats(): {
    totalRecords: number;
    currentYearRecords: number;
    oldestRecord: string;
    newestRecord: string;
  } {
    const currentYear = new Date().getFullYear();
    let currentYearRecords = 0;
    let oldestTimestamp = Date.now();
    let newestTimestamp = 0;
    
    for (const record of this.processedRecurrings.values()) {
      if (record.year === currentYear) {
        currentYearRecords++;
      }
      
      if (record.processedAt < oldestTimestamp) {
        oldestTimestamp = record.processedAt;
      }
      
      if (record.processedAt > newestTimestamp) {
        newestTimestamp = record.processedAt;
      }
    }
    
    return {
      totalRecords: this.processedRecurrings.size,
      currentYearRecords,
      oldestRecord: new Date(oldestTimestamp).toLocaleString(),
      newestRecord: new Date(newestTimestamp).toLocaleString()
    };
  }

  /**
   * Reset completo (apenas para emergências)
   */
  public reset(): void {
    this.processedRecurrings.clear();
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🔄 Recurring transaction control reset');
  }
}

// Exportar instância singleton
export const recurringControl = RecurringTransactionControl.getInstance();

// Funções de conveniência
export const isRecurringProcessedForMonth = (
  recurringId: string, 
  year: number, 
  month: number, 
  day: number, 
  amount: number, 
  type: string
) => recurringControl.isRecurringProcessedForMonth(recurringId, year, month, day, amount, type);

export const markRecurringProcessedForMonth = (
  recurringId: string, 
  year: number, 
  month: number, 
  day: number, 
  amount: number, 
  type: string
) => recurringControl.markRecurringProcessedForMonth(recurringId, year, month, day, amount, type);

export const clearRecurringMonth = (year: number, month: number) => 
  recurringControl.clearMonth(year, month);

export const removeRecurringRecord = (recurringId: string, year: number, month: number) =>
  recurringControl.removeRecurringRecord(recurringId, year, month);

export const getRecurringStats = () => recurringControl.getStats();

export const validateRecurringRecords = () => recurringControl.validateAllRecords();

export const cleanupOldRecurringRecords = () => recurringControl.cleanupOldRecords();