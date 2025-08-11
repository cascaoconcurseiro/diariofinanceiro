/**
 * SISTEMA DE CONTROLE ÚNICO DE TRANSAÇÕES
 * Previne duplicação e garante unicidade de lançamentos
 */

interface TransactionRecord {
  id: string;
  timestamp: number;
  hash: string;
  processed: boolean;
}

class TransactionController {
  private static instance: TransactionController | null = null;
  private processedTransactions: Map<string, TransactionRecord> = new Map();
  private processingQueue: Set<string> = new Set();
  private readonly CLEANUP_INTERVAL = 60000; // 1 minuto
  private readonly MAX_AGE = 300000; // 5 minutos

  private constructor() {
    // Iniciar limpeza automática
    setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL);
  }

  public static getInstance(): TransactionController {
    if (!TransactionController.instance) {
      TransactionController.instance = new TransactionController();
    }
    return TransactionController.instance;
  }

  /**
   * Gera hash único para uma transação
   */
  private generateTransactionHash(
    year: number,
    month: number,
    day: number,
    type: string,
    amount: number,
    source: string = 'manual'
  ): string {
    const data = `${year}-${month}-${day}-${type}-${amount}-${source}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Verifica se uma transação pode ser processada
   */
  public canProcessTransaction(
    year: number,
    month: number,
    day: number,
    type: 'entrada' | 'saida' | 'diario',
    amount: number,
    source: string = 'manual'
  ): { canProcess: boolean; transactionId: string; reason?: string } {
    const hash = this.generateTransactionHash(year, month, day, type, amount, source);
    const transactionId = `${hash}_${Date.now()}`;

    // Verificar se já está sendo processada
    if (this.processingQueue.has(hash)) {
      return {
        canProcess: false,
        transactionId,
        reason: 'Transaction already being processed'
      };
    }

    // Verificar se já foi processada recentemente
    const existing = this.processedTransactions.get(hash);
    if (existing && existing.processed && (Date.now() - existing.timestamp) < 5000) {
      return {
        canProcess: false,
        transactionId,
        reason: 'Transaction processed recently'
      };
    }

    return { canProcess: true, transactionId };
  }

  /**
   * Marca transação como sendo processada
   */
  public startProcessing(
    year: number,
    month: number,
    day: number,
    type: 'entrada' | 'saida' | 'diario',
    amount: number,
    source: string = 'manual'
  ): string {
    const hash = this.generateTransactionHash(year, month, day, type, amount, source);
    const transactionId = `${hash}_${Date.now()}`;

    // Adicionar à fila de processamento
    this.processingQueue.add(hash);

    // Registrar transação
    this.processedTransactions.set(hash, {
      id: transactionId,
      timestamp: Date.now(),
      hash,
      processed: false
    });

    console.log(`🔒 Started processing transaction: ${transactionId}`);
    return transactionId;
  }

  /**
   * Marca transação como concluída
   */
  public finishProcessing(
    year: number,
    month: number,
    day: number,
    type: 'entrada' | 'saida' | 'diario',
    amount: number,
    source: string = 'manual'
  ): void {
    const hash = this.generateTransactionHash(year, month, day, type, amount, source);

    // Remover da fila de processamento
    this.processingQueue.delete(hash);

    // Marcar como processada
    const record = this.processedTransactions.get(hash);
    if (record) {
      record.processed = true;
      record.timestamp = Date.now();
      console.log(`✅ Finished processing transaction: ${record.id}`);
    }
  }

  /**
   * Cancela processamento de transação
   */
  public cancelProcessing(
    year: number,
    month: number,
    day: number,
    type: 'entrada' | 'saida' | 'diario',
    amount: number,
    source: string = 'manual'
  ): void {
    const hash = this.generateTransactionHash(year, month, day, type, amount, source);

    // Remover da fila de processamento
    this.processingQueue.delete(hash);

    // Remover registro
    this.processedTransactions.delete(hash);

    console.log(`❌ Cancelled processing transaction with hash: ${hash}`);
  }

  /**
   * Verifica se transação recorrente já foi processada para um mês
   */
  public isRecurringProcessed(
    recurringId: string,
    year: number,
    month: number,
    day: number
  ): boolean {
    const key = `recurring_${recurringId}_${year}_${month}_${day}`;
    return this.processedTransactions.has(key);
  }

  /**
   * Marca transação recorrente como processada
   */
  public markRecurringProcessed(
    recurringId: string,
    year: number,
    month: number,
    day: number
  ): void {
    const key = `recurring_${recurringId}_${year}_${month}_${day}`;
    this.processedTransactions.set(key, {
      id: key,
      timestamp: Date.now(),
      hash: key,
      processed: true
    });
    console.log(`🔄 Marked recurring transaction as processed: ${key}`);
  }

  /**
   * Limpa registros antigos
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, record] of this.processedTransactions.entries()) {
      if (now - record.timestamp > this.MAX_AGE) {
        this.processedTransactions.delete(key);
        cleaned++;
      }
    }

    // Limpar fila de processamento de itens órfãos
    for (const hash of this.processingQueue) {
      if (!this.processedTransactions.has(hash)) {
        this.processingQueue.delete(hash);
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} old transaction records`);
    }
  }

  /**
   * Limpa cache para um mês específico
   */
  public clearMonthCache(year: number, month: number): void {
    let cleared = 0;
    const monthPrefix = `recurring_`;
    const monthPattern = `_${year}_${month}_`;

    for (const [key] of this.processedTransactions.entries()) {
      if (key.startsWith(monthPrefix) && key.includes(monthPattern)) {
        this.processedTransactions.delete(key);
        cleared++;
      }
    }

    console.log(`🧹 Cleared ${cleared} transaction records for ${year}-${month + 1}`);
  }

  /**
   * Obtém estatísticas do controlador
   */
  public getStats(): {
    processed: number;
    processing: number;
    oldestRecord: number;
  } {
    let oldestTimestamp = Date.now();
    
    for (const record of this.processedTransactions.values()) {
      if (record.timestamp < oldestTimestamp) {
        oldestTimestamp = record.timestamp;
      }
    }

    return {
      processed: this.processedTransactions.size,
      processing: this.processingQueue.size,
      oldestRecord: Date.now() - oldestTimestamp
    };
  }

  /**
   * Reset completo (apenas para emergências)
   */
  public reset(): void {
    this.processedTransactions.clear();
    this.processingQueue.clear();
    console.log('🔄 Transaction controller reset');
  }
}

// Exportar instância singleton
export const transactionController = TransactionController.getInstance();

// Funções de conveniência
export const canProcessTransaction = (
  year: number,
  month: number,
  day: number,
  type: 'entrada' | 'saida' | 'diario',
  amount: number,
  source?: string
) => transactionController.canProcessTransaction(year, month, day, type, amount, source);

export const startProcessingTransaction = (
  year: number,
  month: number,
  day: number,
  type: 'entrada' | 'saida' | 'diario',
  amount: number,
  source?: string
) => transactionController.startProcessing(year, month, day, type, amount, source);

export const finishProcessingTransaction = (
  year: number,
  month: number,
  day: number,
  type: 'entrada' | 'saida' | 'diario',
  amount: number,
  source?: string
) => transactionController.finishProcessing(year, month, day, type, amount, source);

export const cancelProcessingTransaction = (
  year: number,
  month: number,
  day: number,
  type: 'entrada' | 'saida' | 'diario',
  amount: number,
  source?: string
) => transactionController.cancelProcessing(year, month, day, type, amount, source);

export const isRecurringProcessed = (
  recurringId: string,
  year: number,
  month: number,
  day: number
) => transactionController.isRecurringProcessed(recurringId, year, month, day);

export const markRecurringProcessed = (
  recurringId: string,
  year: number,
  month: number,
  day: number
) => transactionController.markRecurringProcessed(recurringId, year, month, day);

export const clearMonthTransactionCache = (year: number, month: number) => 
  transactionController.clearMonthCache(year, month);

export const getTransactionControllerStats = () => transactionController.getStats();