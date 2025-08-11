/**
 * GERENCIADOR DE ESTADO DE TESTES - PREVINE MEMORY LEAKS
 * Solução definitiva para evitar acúmulo de bugs entre execuções
 */

export class TestStateManager {
  private static instance: TestStateManager | null = null;
  private testResults: Map<string, any> = new Map();
  private executionCount = 0;
  private isRunning = false;

  private constructor() {}

  public static getInstance(): TestStateManager {
    if (!TestStateManager.instance) {
      TestStateManager.instance = new TestStateManager();
    }
    return TestStateManager.instance;
  }

  // Limpar completamente o estado antes de cada execução
  public clearAllState(): void {
    console.log('🧹 CLEARING ALL TEST STATE...');
    
    // Limpar resultados anteriores
    this.testResults.clear();
    
    // Resetar contadores
    this.executionCount = 0;
    this.isRunning = false;
    
    // Limpar timers e intervalos
    this.clearAllTimers();
    
    // Forçar garbage collection se disponível
    this.forceGarbageCollection();
    
    console.log('✅ Test state cleared successfully');
  }

  // Prevenir execuções simultâneas
  public canExecute(): boolean {
    if (this.isRunning) {
      console.warn('⚠️ Test already running, skipping execution');
      return false;
    }
    return true;
  }

  // Marcar início de execução
  public startExecution(): void {
    this.isRunning = true;
    this.executionCount++;
    console.log(`🚀 Starting test execution #${this.executionCount}`);
  }

  // Marcar fim de execução
  public endExecution(): void {
    this.isRunning = false;
    console.log(`✅ Test execution #${this.executionCount} completed`);
  }

  // Limpar todos os timers
  private clearAllTimers(): void {
    // Limpar todos os timeouts e intervals
    const highestTimeoutId = setTimeout(() => {}, 0);
    for (let i = 0; i < highestTimeoutId; i++) {
      clearTimeout(i);
      clearInterval(i);
    }
  }

  // Forçar garbage collection
  private forceGarbageCollection(): void {
    try {
      if ((window as any).gc) {
        (window as any).gc();
      }
      
      // Limpar referências globais de teste
      if ((window as any).__testResults) {
        delete (window as any).__testResults;
      }
      
      if ((window as any).__testState) {
        delete (window as any).__testState;
      }
      
    } catch (error) {
      // Ignorar erros de GC
    }
  }

  // Obter estatísticas de execução
  public getStats(): any {
    return {
      executionCount: this.executionCount,
      isRunning: this.isRunning,
      resultsCount: this.testResults.size
    };
  }
}