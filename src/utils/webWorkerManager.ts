/**
 * Gerenciador de Web Workers para Processamento Paralelo
 * Executa cálculos pesados em background sem bloquear a UI
 */

export enum WorkerType {
  FINANCIAL_CALCULATOR = 'financial_calculator',
  DATA_VALIDATOR = 'data_validator',
  SEARCH_INDEXER = 'search_indexer',
  BACKUP_PROCESSOR = 'backup_processor',
  REPORT_GENERATOR = 'report_generator'
}

export interface WorkerTask {
  id: string;
  type: WorkerType;
  data: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeout?: number;
  retries?: number;
  onProgress?: (progress: number) => void;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

export interface WorkerResult {
  taskId: string;
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  workerUsed: string;
}

export interface WorkerStats {
  workerId: string;
  type: WorkerType;
  tasksCompleted: number;
  tasksErrored: number;
  averageExecutionTime: number;
  isActive: boolean;
  lastUsed: number;
  memoryUsage: number;
}

class WebWorkerManager {
  private workers: Map<string, Worker> = new Map();
  private workerStats: Map<string, WorkerStats> = new Map();
  private taskQueue: WorkerTask[] = [];
  private activeTasks: Map<string, WorkerTask> = new Map();
  private maxWorkers = navigator.hardwareConcurrency || 4;
  private workerScripts: Map<WorkerType, string> = new Map();

  constructor() {
    this.initializeWorkerScripts();
    this.startTaskProcessor();
  }

  // Inicializar scripts dos workers
  private initializeWorkerScripts(): void {
    // Script para cálculos financeiros
    this.workerScripts.set(WorkerType.FINANCIAL_CALCULATOR, this.createFinancialCalculatorScript());
    
    // Script para validação de dados
    this.workerScripts.set(WorkerType.DATA_VALIDATOR, this.createDataValidatorScript());
    
    // Script para indexação de busca
    this.workerScripts.set(WorkerType.SEARCH_INDEXER, this.createSearchIndexerScript());
    
    // Script para processamento de backup
    this.workerScripts.set(WorkerType.BACKUP_PROCESSOR, this.createBackupProcessorScript());
    
    // Script para geração de relatórios
    this.workerScripts.set(WorkerType.REPORT_GENERATOR, this.createReportGeneratorScript());
  }

  // Criar worker para cálculos financeiros
  private createFinancialCalculatorScript(): string {
    return `
      self.onmessage = function(e) {
        const { taskId, type, data } = e.data;
        const startTime = performance.now();
        
        try {
          let result;
          
          switch(type) {
            case 'calculateBalance':
              result = calculateBalance(data);
              break;
            case 'calculateTrends':
              result = calculateTrends(data);
              break;
            case 'calculateProjections':
              result = calculateProjections(data);
              break;
            case 'calculateStatistics':
              result = calculateStatistics(data);
              break;
            default:
              throw new Error('Tipo de cálculo não suportado: ' + type);
          }
          
          const executionTime = performance.now() - startTime;
          
          self.postMessage({
            taskId,
            success: true,
            result,
            executionTime
          });
          
        } catch (error) {
          self.postMessage({
            taskId,
            success: false,
            error: error.message,
            executionTime: performance.now() - startTime
          });
        }
      };
      
      function calculateBalance(data) {
        const { transactions } = data;
        let balance = 0;
        
        for (const transaction of transactions) {
          if (transaction.type === 'income') {
            balance += transaction.amount || 0;
          } else if (transaction.type === 'expense') {
            balance -= transaction.amount || 0;
          }
        }
        
        return { balance, transactionCount: transactions.length };
      }
      
      function calculateTrends(data) {
        const { monthlyData } = data;
        const trends = [];
        
        for (let i = 1; i < monthlyData.length; i++) {
          const current = monthlyData[i];
          const previous = monthlyData[i - 1];
          
          const incomeChange = ((current.income - previous.income) / previous.income) * 100;
          const expenseChange = ((current.expenses - previous.expenses) / previous.expenses) * 100;
          
          trends.push({
            month: current.month,
            incomeChange: isFinite(incomeChange) ? incomeChange : 0,
            expenseChange: isFinite(expenseChange) ? expenseChange : 0
          });
        }
        
        return trends;
      }
      
      function calculateProjections(data) {
        const { historicalData, months } = data;
        const projections = [];
        
        // Calcular média móvel simples
        const avgIncome = historicalData.reduce((sum, d) => sum + d.income, 0) / historicalData.length;
        const avgExpenses = historicalData.reduce((sum, d) => sum + d.expenses, 0) / historicalData.length;
        
        for (let i = 0; i < months; i++) {
          projections.push({
            month: i + 1,
            projectedIncome: avgIncome,
            projectedExpenses: avgExpenses,
            projectedBalance: avgIncome - avgExpenses
          });
        }
        
        return projections;
      }
      
      function calculateStatistics(data) {
        const { transactions } = data;
        
        const income = transactions.filter(t => t.type === 'income');
        const expenses = transactions.filter(t => t.type === 'expense');
        
        const totalIncome = income.reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalExpenses = expenses.reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const avgIncome = income.length > 0 ? totalIncome / income.length : 0;
        const avgExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;
        
        return {
          totalIncome,
          totalExpenses,
          balance: totalIncome - totalExpenses,
          avgIncome,
          avgExpense,
          transactionCount: transactions.length,
          incomeCount: income.length,
          expenseCount: expenses.length
        };
      }
    `;
  }

  // Criar worker para validação de dados
  private createDataValidatorScript(): string {
    return `
      self.onmessage = function(e) {
        const { taskId, type, data } = e.data;
        const startTime = performance.now();
        
        try {
          let result;
          
          switch(type) {
            case 'validateTransactions':
              result = validateTransactions(data);
              break;
            case 'validateDataIntegrity':
              result = validateDataIntegrity(data);
              break;
            case 'findDuplicates':
              result = findDuplicates(data);
              break;
            case 'validateBalances':
              result = validateBalances(data);
              break;
            default:
              throw new Error('Tipo de validação não suportado: ' + type);
          }
          
          const executionTime = performance.now() - startTime;
          
          self.postMessage({
            taskId,
            success: true,
            result,
            executionTime
          });
          
        } catch (error) {
          self.postMessage({
            taskId,
            success: false,
            error: error.message,
            executionTime: performance.now() - startTime
          });
        }
      };
      
      function validateTransactions(data) {
        const { transactions } = data;
        const errors = [];
        const warnings = [];
        
        for (let i = 0; i < transactions.length; i++) {
          const transaction = transactions[i];
          
          if (!transaction.type || !['income', 'expense'].includes(transaction.type)) {
            errors.push({ index: i, field: 'type', message: 'Tipo inválido' });
          }
          
          if (typeof transaction.amount !== 'number' || transaction.amount <= 0) {
            errors.push({ index: i, field: 'amount', message: 'Valor inválido' });
          }
          
          if (!transaction.description || transaction.description.trim() === '') {
            warnings.push({ index: i, field: 'description', message: 'Descrição vazia' });
          }
          
          if (transaction.amount > 100000) {
            warnings.push({ index: i, field: 'amount', message: 'Valor muito alto' });
          }
        }
        
        return {
          valid: errors.length === 0,
          errors,
          warnings,
          transactionsChecked: transactions.length
        };
      }
      
      function validateDataIntegrity(data) {
        const issues = [];
        
        if (!data || typeof data !== 'object') {
          issues.push({ type: 'structure', message: 'Dados inválidos' });
          return { valid: false, issues };
        }
        
        if (!data.years || typeof data.years !== 'object') {
          issues.push({ type: 'structure', message: 'Estrutura de anos inválida' });
        }
        
        for (const [year, yearData] of Object.entries(data.years || {})) {
          if (!yearData || typeof yearData !== 'object') {
            issues.push({ type: 'year', year, message: 'Dados do ano inválidos' });
            continue;
          }
          
          const months = yearData.months;
          if (!months || typeof months !== 'object') {
            issues.push({ type: 'year', year, message: 'Estrutura de meses inválida' });
            continue;
          }
          
          for (const [month, monthData] of Object.entries(months)) {
            if (!monthData || typeof monthData !== 'object') {
              issues.push({ type: 'month', year, month, message: 'Dados do mês inválidos' });
            }
          }
        }
        
        return {
          valid: issues.length === 0,
          issues,
          yearsChecked: Object.keys(data.years || {}).length
        };
      }
      
      function findDuplicates(data) {
        const { transactions } = data;
        const duplicates = [];
        const seen = new Map();
        
        for (let i = 0; i < transactions.length; i++) {
          const transaction = transactions[i];
          const key = transaction.type + '_' + transaction.amount + '_' + transaction.description;
          
          if (seen.has(key)) {
            duplicates.push({
              index: i,
              duplicateOf: seen.get(key),
              transaction
            });
          } else {
            seen.set(key, i);
          }
        }
        
        return {
          duplicatesFound: duplicates.length,
          duplicates,
          transactionsChecked: transactions.length
        };
      }
      
      function validateBalances(data) {
        const inconsistencies = [];
        
        for (const [year, yearData] of Object.entries(data.years || {})) {
          const months = yearData.months || {};
          
          for (const [month, monthData] of Object.entries(months)) {
            const days = monthData.days || {};
            const storedBalance = monthData.balance || 0;
            
            let calculatedBalance = 0;
            for (const dayData of Object.values(days)) {
              const transactions = dayData.transactions || [];
              for (const transaction of transactions) {
                if (transaction.type === 'income') {
                  calculatedBalance += transaction.amount || 0;
                } else if (transaction.type === 'expense') {
                  calculatedBalance -= transaction.amount || 0;
                }
              }
            }
            
            const difference = Math.abs(calculatedBalance - storedBalance);
            if (difference > 0.01) {
              inconsistencies.push({
                year,
                month,
                storedBalance,
                calculatedBalance,
                difference
              });
            }
          }
        }
        
        return {
          consistent: inconsistencies.length === 0,
          inconsistencies,
          monthsChecked: Object.keys(data.years || {}).reduce((total, year) => {
            return total + Object.keys(data.years[year].months || {}).length;
          }, 0)
        };
      }
    `;
  }

  // Criar worker para indexação de busca
  private createSearchIndexerScript(): string {
    return `
      self.onmessage = function(e) {
        const { taskId, type, data } = e.data;
        const startTime = performance.now();
        
        try {
          let result;
          
          switch(type) {
            case 'createIndex':
              result = createIndex(data);
              break;
            case 'updateIndex':
              result = updateIndex(data);
              break;
            case 'searchIndex':
              result = searchIndex(data);
              break;
            default:
              throw new Error('Tipo de indexação não suportado: ' + type);
          }
          
          const executionTime = performance.now() - startTime;
          
          self.postMessage({
            taskId,
            success: true,
            result,
            executionTime
          });
          
        } catch (error) {
          self.postMessage({
            taskId,
            success: false,
            error: error.message,
            executionTime: performance.now() - startTime
          });
        }
      };
      
      function createIndex(data) {
        const { transactions } = data;
        const index = {
          byType: {},
          byAmount: {},
          byDescription: {},
          byDate: {}
        };
        
        for (let i = 0; i < transactions.length; i++) {
          const transaction = transactions[i];
          const id = transaction.id || i;
          
          // Índice por tipo
          if (!index.byType[transaction.type]) {
            index.byType[transaction.type] = [];
          }
          index.byType[transaction.type].push(id);
          
          // Índice por valor
          const amount = transaction.amount || 0;
          if (!index.byAmount[amount]) {
            index.byAmount[amount] = [];
          }
          index.byAmount[amount].push(id);
          
          // Índice por descrição
          const description = (transaction.description || '').toLowerCase();
          const words = description.split(/\\s+/);
          for (const word of words) {
            if (word.length > 2) {
              if (!index.byDescription[word]) {
                index.byDescription[word] = [];
              }
              index.byDescription[word].push(id);
            }
          }
          
          // Índice por data
          if (transaction.date) {
            if (!index.byDate[transaction.date]) {
              index.byDate[transaction.date] = [];
            }
            index.byDate[transaction.date].push(id);
          }
        }
        
        return {
          index,
          transactionsIndexed: transactions.length,
          indexSize: JSON.stringify(index).length
        };
      }
      
      function updateIndex(data) {
        const { index, newTransactions } = data;
        let added = 0;
        
        for (const transaction of newTransactions) {
          const id = transaction.id;
          
          // Atualizar índices
          if (!index.byType[transaction.type]) {
            index.byType[transaction.type] = [];
          }
          if (!index.byType[transaction.type].includes(id)) {
            index.byType[transaction.type].push(id);
            added++;
          }
          
          // Continuar com outros índices...
        }
        
        return {
          index,
          transactionsAdded: added
        };
      }
      
      function searchIndex(data) {
        const { index, query, type } = data;
        const results = [];
        
        if (type === 'description') {
          const words = query.toLowerCase().split(/\\s+/);
          const matchingIds = new Set();
          
          for (const word of words) {
            if (index.byDescription[word]) {
              for (const id of index.byDescription[word]) {
                matchingIds.add(id);
              }
            }
          }
          
          results.push(...Array.from(matchingIds));
        }
        
        return {
          results,
          resultCount: results.length
        };
      }
    `;
  }

  // Criar worker para processamento de backup
  private createBackupProcessorScript(): string {
    return `
      self.onmessage = function(e) {
        const { taskId, type, data } = e.data;
        const startTime = performance.now();
        
        try {
          let result;
          
          switch(type) {
            case 'createBackup':
              result = createBackup(data);
              break;
            case 'compressData':
              result = compressData(data);
              break;
            case 'validateBackup':
              result = validateBackup(data);
              break;
            default:
              throw new Error('Tipo de backup não suportado: ' + type);
          }
          
          const executionTime = performance.now() - startTime;
          
          self.postMessage({
            taskId,
            success: true,
            result,
            executionTime
          });
          
        } catch (error) {
          self.postMessage({
            taskId,
            success: false,
            error: error.message,
            executionTime: performance.now() - startTime
          });
        }
      };
      
      function createBackup(data) {
        const backup = {
          version: '1.0',
          timestamp: Date.now(),
          data: JSON.parse(JSON.stringify(data)),
          checksum: calculateChecksum(data)
        };
        
        return {
          backup,
          size: JSON.stringify(backup).length
        };
      }
      
      function compressData(data) {
        // Implementação simplificada de compressão
        const compressed = JSON.stringify(data);
        const originalSize = compressed.length;
        
        // Simular compressão removendo espaços desnecessários
        const compressedData = compressed.replace(/\\s+/g, ' ').trim();
        
        return {
          compressed: compressedData,
          originalSize,
          compressedSize: compressedData.length,
          compressionRatio: ((originalSize - compressedData.length) / originalSize) * 100
        };
      }
      
      function validateBackup(data) {
        const { backup } = data;
        const issues = [];
        
        if (!backup.version) {
          issues.push('Versão do backup não encontrada');
        }
        
        if (!backup.timestamp) {
          issues.push('Timestamp do backup não encontrado');
        }
        
        if (!backup.data) {
          issues.push('Dados do backup não encontrados');
        }
        
        if (!backup.checksum) {
          issues.push('Checksum do backup não encontrado');
        } else {
          const calculatedChecksum = calculateChecksum(backup.data);
          if (calculatedChecksum !== backup.checksum) {
            issues.push('Checksum do backup não confere');
          }
        }
        
        return {
          valid: issues.length === 0,
          issues
        };
      }
      
      function calculateChecksum(data) {
        // Implementação simplificada de checksum
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
      }
    `;
  }

  // Criar worker para geração de relatórios
  private createReportGeneratorScript(): string {
    return `
      self.onmessage = function(e) {
        const { taskId, type, data } = e.data;
        const startTime = performance.now();
        
        try {
          let result;
          
          switch(type) {
            case 'generateMonthlyReport':
              result = generateMonthlyReport(data);
              break;
            case 'generateYearlyReport':
              result = generateYearlyReport(data);
              break;
            case 'generateCategoryReport':
              result = generateCategoryReport(data);
              break;
            default:
              throw new Error('Tipo de relatório não suportado: ' + type);
          }
          
          const executionTime = performance.now() - startTime;
          
          self.postMessage({
            taskId,
            success: true,
            result,
            executionTime
          });
          
        } catch (error) {
          self.postMessage({
            taskId,
            success: false,
            error: error.message,
            executionTime: performance.now() - startTime
          });
        }
      };
      
      function generateMonthlyReport(data) {
        const { year, month, transactions } = data;
        
        let totalIncome = 0;
        let totalExpenses = 0;
        const dailyData = {};
        
        for (const transaction of transactions) {
          if (transaction.type === 'income') {
            totalIncome += transaction.amount || 0;
          } else if (transaction.type === 'expense') {
            totalExpenses += transaction.amount || 0;
          }
          
          const day = transaction.day || 1;
          if (!dailyData[day]) {
            dailyData[day] = { income: 0, expenses: 0 };
          }
          
          if (transaction.type === 'income') {
            dailyData[day].income += transaction.amount || 0;
          } else {
            dailyData[day].expenses += transaction.amount || 0;
          }
        }
        
        return {
          period: year + '/' + month,
          totalIncome,
          totalExpenses,
          balance: totalIncome - totalExpenses,
          transactionCount: transactions.length,
          dailyData,
          averageDailyIncome: totalIncome / 30,
          averageDailyExpenses: totalExpenses / 30
        };
      }
      
      function generateYearlyReport(data) {
        const { year, monthlyData } = data;
        
        let totalIncome = 0;
        let totalExpenses = 0;
        const monthlyBreakdown = [];
        
        for (const monthData of monthlyData) {
          totalIncome += monthData.income || 0;
          totalExpenses += monthData.expenses || 0;
          
          monthlyBreakdown.push({
            month: monthData.month,
            income: monthData.income || 0,
            expenses: monthData.expenses || 0,
            balance: (monthData.income || 0) - (monthData.expenses || 0)
          });
        }
        
        return {
          year,
          totalIncome,
          totalExpenses,
          balance: totalIncome - totalExpenses,
          monthlyBreakdown,
          averageMonthlyIncome: totalIncome / 12,
          averageMonthlyExpenses: totalExpenses / 12
        };
      }
      
      function generateCategoryReport(data) {
        const { transactions } = data;
        const categories = {};
        
        for (const transaction of transactions) {
          const category = categorizeTransaction(transaction);
          
          if (!categories[category]) {
            categories[category] = {
              income: 0,
              expenses: 0,
              count: 0
            };
          }
          
          if (transaction.type === 'income') {
            categories[category].income += transaction.amount || 0;
          } else if (transaction.type === 'expense') {
            categories[category].expenses += transaction.amount || 0;
          }
          
          categories[category].count++;
        }
        
        return {
          categories,
          totalCategories: Object.keys(categories).length
        };
      }
      
      function categorizeTransaction(transaction) {
        const description = (transaction.description || '').toLowerCase();
        
        if (description.includes('alimentação') || description.includes('comida')) {
          return 'Alimentação';
        } else if (description.includes('transporte') || description.includes('combustível')) {
          return 'Transporte';
        } else if (description.includes('casa') || description.includes('aluguel')) {
          return 'Moradia';
        } else if (description.includes('saúde') || description.includes('médico')) {
          return 'Saúde';
        } else {
          return 'Outros';
        }
      }
    `;
  }

  // Criar worker
  private createWorker(type: WorkerType): Worker {
    const script = this.workerScripts.get(type);
    if (!script) {
      throw new Error(`Script não encontrado para o tipo: ${type}`);
    }

    const blob = new Blob([script], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    
    const workerId = `${type}_${Date.now()}`;
    
    // Configurar listener para mensagens do worker
    worker.onmessage = (e) => {
      this.handleWorkerMessage(workerId, e.data);
    };
    
    worker.onerror = (error) => {
      this.handleWorkerError(workerId, error);
    };
    
    // Inicializar estatísticas
    this.workerStats.set(workerId, {
      workerId,
      type,
      tasksCompleted: 0,
      tasksErrored: 0,
      averageExecutionTime: 0,
      isActive: false,
      lastUsed: Date.now(),
      memoryUsage: 0
    });
    
    this.workers.set(workerId, worker);
    return worker;
  }

  // Processar fila de tarefas
  private startTaskProcessor(): void {
    const processQueue = () => {
      if (this.taskQueue.length === 0) {
        setTimeout(processQueue, 100);
        return;
      }

      // Ordenar por prioridade
      this.taskQueue.sort((a, b) => {
        const priorities = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorities[b.priority] - priorities[a.priority];
      });

      const task = this.taskQueue.shift();
      if (task) {
        this.executeTask(task);
      }

      setTimeout(processQueue, 10);
    };

    processQueue();
  }

  // Executar tarefa
  private async executeTask(task: WorkerTask): Promise<void> {
    try {
      // Encontrar worker disponível ou criar novo
      let worker = this.findAvailableWorker(task.type);
      let workerId: string;

      if (!worker) {
        if (this.workers.size < this.maxWorkers) {
          worker = this.createWorker(task.type);
          workerId = Array.from(this.workers.keys()).find(id => this.workers.get(id) === worker)!;
        } else {
          // Recolocar na fila se não há workers disponíveis
          this.taskQueue.unshift(task);
          return;
        }
      } else {
        workerId = Array.from(this.workers.keys()).find(id => this.workers.get(id) === worker)!;
      }

      // Marcar worker como ativo
      const stats = this.workerStats.get(workerId)!;
      stats.isActive = true;
      stats.lastUsed = Date.now();

      // Adicionar à lista de tarefas ativas
      this.activeTasks.set(task.id, task);

      // Configurar timeout se especificado
      if (task.timeout) {
        setTimeout(() => {
          if (this.activeTasks.has(task.id)) {
            this.handleTaskTimeout(task.id);
          }
        }, task.timeout);
      }

      // Enviar tarefa para o worker
      worker.postMessage({
        taskId: task.id,
        type: task.data.type,
        data: task.data
      });

    } catch (error) {
      this.handleTaskError(task.id, error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }

  // Encontrar worker disponível
  private findAvailableWorker(type: WorkerType): Worker | null {
    for (const [workerId, worker] of this.workers.entries()) {
      const stats = this.workerStats.get(workerId);
      if (stats && stats.type === type && !stats.isActive) {
        return worker;
      }
    }
    return null;
  }

  // Manipular mensagem do worker
  private handleWorkerMessage(workerId: string, data: any): void {
    const { taskId, success, result, error, executionTime } = data;
    const task = this.activeTasks.get(taskId);
    
    if (!task) return;

    // Atualizar estatísticas do worker
    const stats = this.workerStats.get(workerId)!;
    stats.isActive = false;
    stats.lastUsed = Date.now();
    
    if (success) {
      stats.tasksCompleted++;
      stats.averageExecutionTime = (stats.averageExecutionTime + executionTime) / 2;
      
      if (task.onComplete) {
        task.onComplete(result);
      }
    } else {
      stats.tasksErrored++;
      
      if (task.onError) {
        task.onError(error);
      }
    }

    // Remover da lista de tarefas ativas
    this.activeTasks.delete(taskId);
  }

  // Manipular erro do worker
  private handleWorkerError(workerId: string, error: ErrorEvent): void {
    console.error(`Erro no worker ${workerId}:`, error);
    
    const stats = this.workerStats.get(workerId);
    if (stats) {
      stats.tasksErrored++;
      stats.isActive = false;
    }

    // Reiniciar worker se necessário
    this.restartWorker(workerId);
  }

  // Manipular timeout de tarefa
  private handleTaskTimeout(taskId: string): void {
    const task = this.activeTasks.get(taskId);
    if (!task) return;

    if (task.onError) {
      task.onError('Timeout da tarefa');
    }

    this.activeTasks.delete(taskId);
  }

  // Manipular erro de tarefa
  private handleTaskError(taskId: string, error: string): void {
    const task = this.activeTasks.get(taskId);
    if (!task) return;

    if (task.onError) {
      task.onError(error);
    }

    this.activeTasks.delete(taskId);
  }

  // Reiniciar worker
  private restartWorker(workerId: string): void {
    const worker = this.workers.get(workerId);
    const stats = this.workerStats.get(workerId);
    
    if (worker && stats) {
      worker.terminate();
      this.workers.delete(workerId);
      this.workerStats.delete(workerId);
      
      // Criar novo worker do mesmo tipo
      setTimeout(() => {
        this.createWorker(stats.type);
      }, 1000);
    }
  }

  // API pública
  async executeTask(task: Omit<WorkerTask, 'id'>): Promise<any> {
    return new Promise((resolve, reject) => {
      const fullTask: WorkerTask = {
        ...task,
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        onComplete: resolve,
        onError: reject
      };

      this.taskQueue.push(fullTask);
    });
  }

  // Executar cálculo financeiro
  async calculateBalance(transactions: any[]): Promise<any> {
    return this.executeTask({
      type: WorkerType.FINANCIAL_CALCULATOR,
      data: { type: 'calculateBalance', transactions },
      priority: 'medium'
    });
  }

  async calculateTrends(monthlyData: any[]): Promise<any> {
    return this.executeTask({
      type: WorkerType.FINANCIAL_CALCULATOR,
      data: { type: 'calculateTrends', monthlyData },
      priority: 'low'
    });
  }

  async calculateProjections(historicalData: any[], months: number): Promise<any> {
    return this.executeTask({
      type: WorkerType.FINANCIAL_CALCULATOR,
      data: { type: 'calculateProjections', historicalData, months },
      priority: 'low'
    });
  }

  // Executar validação de dados
  async validateTransactions(transactions: any[]): Promise<any> {
    return this.executeTask({
      type: WorkerType.DATA_VALIDATOR,
      data: { type: 'validateTransactions', transactions },
      priority: 'high'
    });
  }

  async validateDataIntegrity(data: any): Promise<any> {
    return this.executeTask({
      type: WorkerType.DATA_VALIDATOR,
      data: { type: 'validateDataIntegrity', ...data },
      priority: 'high'
    });
  }

  // Executar indexação
  async createSearchIndex(transactions: any[]): Promise<any> {
    return this.executeTask({
      type: WorkerType.SEARCH_INDEXER,
      data: { type: 'createIndex', transactions },
      priority: 'medium'
    });
  }

  // Executar backup
  async createBackup(data: any): Promise<any> {
    return this.executeTask({
      type: WorkerType.BACKUP_PROCESSOR,
      data: { type: 'createBackup', ...data },
      priority: 'high'
    });
  }

  // Gerar relatórios
  async generateMonthlyReport(year: number, month: number, transactions: any[]): Promise<any> {
    return this.executeTask({
      type: WorkerType.REPORT_GENERATOR,
      data: { type: 'generateMonthlyReport', year, month, transactions },
      priority: 'low'
    });
  }

  // Obter estatísticas
  getWorkerStats(): WorkerStats[] {
    return Array.from(this.workerStats.values());
  }

  getActiveTaskCount(): number {
    return this.activeTasks.size;
  }

  getQueuedTaskCount(): number {
    return this.taskQueue.length;
  }

  // Limpar recursos
  terminate(): void {
    for (const worker of this.workers.values()) {
      worker.terminate();
    }
    
    this.workers.clear();
    this.workerStats.clear();
    this.taskQueue.length = 0;
    this.activeTasks.clear();
  }
}

// Instância global
export const webWorkerManager = new WebWorkerManager();

// Hook para usar web workers
export function useWebWorkers() {
  const [stats, setStats] = useState<WorkerStats[]>([]);
  const [activeTaskCount, setActiveTaskCount] = useState(0);
  const [queuedTaskCount, setQueuedTaskCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(webWorkerManager.getWorkerStats());
      setActiveTaskCount(webWorkerManager.getActiveTaskCount());
      setQueuedTaskCount(webWorkerManager.getQueuedTaskCount());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return {
    stats,
    activeTaskCount,
    queuedTaskCount,
    
    // Métodos de cálculo
    calculateBalance: webWorkerManager.calculateBalance.bind(webWorkerManager),
    calculateTrends: webWorkerManager.calculateTrends.bind(webWorkerManager),
    calculateProjections: webWorkerManager.calculateProjections.bind(webWorkerManager),
    
    // Métodos de validação
    validateTransactions: webWorkerManager.validateTransactions.bind(webWorkerManager),
    validateDataIntegrity: webWorkerManager.validateDataIntegrity.bind(webWorkerManager),
    
    // Métodos de indexação
    createSearchIndex: webWorkerManager.createSearchIndex.bind(webWorkerManager),
    
    // Métodos de backup
    createBackup: webWorkerManager.createBackup.bind(webWorkerManager),
    
    // Métodos de relatório
    generateMonthlyReport: webWorkerManager.generateMonthlyReport.bind(webWorkerManager),
    
    // Método genérico
    executeTask: webWorkerManager.executeTask.bind(webWorkerManager)
  };
}

export default webWorkerManager;