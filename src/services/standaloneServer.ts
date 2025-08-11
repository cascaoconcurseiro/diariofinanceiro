/**
 * Servidor Standalone Local
 * Fornece funcionalidade completa sem dependência do Docker
 */

import { Transaction, User, RecurringTransaction } from '../types/financial';

export interface StandaloneServerConfig {
  port: number;
  enableCORS: boolean;
  dataStorageKey: string;
  autoSave: boolean;
}

export interface StandaloneData {
  users: User[];
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  currentUser: User | null;
  lastUpdated: Date;
}

class StandaloneServer {
  private config: StandaloneServerConfig = {
    port: 3001,
    enableCORS: true,
    dataStorageKey: 'diario_financeiro_standalone',
    autoSave: true
  };

  private data: StandaloneData;
  private isRunning = false;

  constructor() {
    this.data = this.loadData();
    this.initializeTestData();
  }

  /**
   * Inicializa o servidor standalone
   */
  async initialize(): Promise<void> {
    if (this.isRunning) {
      console.log('Servidor standalone já está rodando');
      return;
    }

    try {
      // Em um ambiente real, iniciaria um servidor Express
      // Aqui simulamos com um service worker ou API local
      await this.setupLocalAPI();
      this.isRunning = true;
      
      console.log(`🚀 Servidor standalone iniciado na porta ${this.config.port}`);
      console.log('📊 Dados de teste carregados');
      console.log('🌐 Acesse: http://localhost:' + this.config.port);
      
      this.notifyServerStatus('RUNNING');
    } catch (error) {
      console.error('Erro ao iniciar servidor standalone:', error);
      throw error;
    }
  }

  /**
   * Para o servidor standalone
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.saveData();
    this.isRunning = false;
    this.notifyServerStatus('STOPPED');
    
    console.log('🛑 Servidor standalone parado');
  }

  /**
   * Configura API local simulada
   */
  private async setupLocalAPI(): Promise<void> {
    // Intercepta chamadas fetch para simular API
    const originalFetch = window.fetch;
    
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString();
      
      // Intercepta chamadas para API local
      if (url.includes('localhost:3000') || url.includes('/api/')) {
        return this.handleAPIRequest(url, init);
      }
      
      // Chamadas normais passam pelo fetch original
      return originalFetch(input, init);
    };
  }

  /**
   * Manipula requisições da API
   */
  private async handleAPIRequest(url: string, init?: RequestInit): Promise<Response> {
    const method = init?.method || 'GET';
    const body = init?.body ? JSON.parse(init.body as string) : null;
    
    try {
      let result: any;
      
      // Roteamento das APIs
      if (url.includes('/auth/login')) {
        result = await this.handleLogin(body);
      } else if (url.includes('/auth/logout')) {
        result = await this.handleLogout();
      } else if (url.includes('/transactions')) {
        result = await this.handleTransactions(method, body, url);
      } else if (url.includes('/recurring-transactions')) {
        result = await this.handleRecurringTransactions(method, body, url);
      } else if (url.includes('/health')) {
        result = { status: 'OK', mode: 'standalone' };
      } else {
        throw new Error('Endpoint não encontrado');
      }

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: error.message || 'Erro interno do servidor' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Manipula login
   */
  private async handleLogin(credentials: { email: string; password: string }) {
    const user = this.data.users.find(u => 
      u.email === credentials.email && u.password === credentials.password
    );
    
    if (!user) {
      throw new Error('Credenciais inválidas');
    }
    
    this.data.currentUser = user;
    this.saveData();
    
    return {
      user: { ...user, password: undefined },
      token: 'standalone_token_' + user.id,
      message: 'Login realizado com sucesso'
    };
  }

  /**
   * Manipula logout
   */
  private async handleLogout() {
    this.data.currentUser = null;
    this.saveData();
    
    return { message: 'Logout realizado com sucesso' };
  }

  /**
   * Manipula transações
   */
  private async handleTransactions(method: string, body: any, url: string) {
    if (!this.data.currentUser) {
      throw new Error('Usuário não autenticado');
    }

    const userId = this.data.currentUser.id;

    switch (method) {
      case 'GET':
        return this.data.transactions.filter(t => t.userId === userId);
        
      case 'POST':
        const newTransaction: Transaction = {
          ...body,
          id: Date.now().toString(),
          userId,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.data.transactions.push(newTransaction);
        this.saveData();
        return newTransaction;
        
      case 'PUT':
        const transactionId = url.split('/').pop();
        const transactionIndex = this.data.transactions.findIndex(
          t => t.id === transactionId && t.userId === userId
        );
        
        if (transactionIndex === -1) {
          throw new Error('Transação não encontrada');
        }
        
        this.data.transactions[transactionIndex] = {
          ...this.data.transactions[transactionIndex],
          ...body,
          updatedAt: new Date()
        };
        this.saveData();
        return this.data.transactions[transactionIndex];
        
      case 'DELETE':
        const deleteId = url.split('/').pop();
        const deleteIndex = this.data.transactions.findIndex(
          t => t.id === deleteId && t.userId === userId
        );
        
        if (deleteIndex === -1) {
          throw new Error('Transação não encontrada');
        }
        
        this.data.transactions.splice(deleteIndex, 1);
        this.saveData();
        return { message: 'Transação excluída com sucesso' };
        
      default:
        throw new Error('Método não suportado');
    }
  }

  /**
   * Manipula transações recorrentes
   */
  private async handleRecurringTransactions(method: string, body: any, url: string) {
    if (!this.data.currentUser) {
      throw new Error('Usuário não autenticado');
    }

    const userId = this.data.currentUser.id;

    switch (method) {
      case 'GET':
        return this.data.recurringTransactions.filter(rt => rt.userId === userId);
        
      case 'POST':
        const newRecurring: RecurringTransaction = {
          ...body,
          id: Date.now().toString(),
          userId,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.data.recurringTransactions.push(newRecurring);
        this.saveData();
        return newRecurring;
        
      default:
        throw new Error('Método não suportado');
    }
  }

  /**
   * Carrega dados do localStorage
   */
  private loadData(): StandaloneData {
    try {
      const stored = localStorage.getItem(this.config.dataStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          lastUpdated: new Date(parsed.lastUpdated)
        };
      }
    } catch (error) {
      console.warn('Erro ao carregar dados:', error);
    }

    return {
      users: [],
      transactions: [],
      recurringTransactions: [],
      currentUser: null,
      lastUpdated: new Date()
    };
  }

  /**
   * Salva dados no localStorage
   */
  private saveData(): void {
    if (!this.config.autoSave) return;

    try {
      this.data.lastUpdated = new Date();
      localStorage.setItem(this.config.dataStorageKey, JSON.stringify(this.data));
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
    }
  }

  /**
   * Inicializa dados de teste
   */
  private initializeTestData(): void {
    if (this.data.users.length > 0) return;

    // Usuários de teste
    this.data.users = [
      {
        id: '1',
        name: 'João Silva',
        email: 'joao@teste.com',
        password: 'MinhaSenh@123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '2',
        name: 'Maria Santos',
        email: 'maria@teste.com',
        password: 'OutraSenh@456',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '3',
        name: 'Pedro Costa',
        email: 'pedro@teste.com',
        password: 'Pedro@789',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ];

    // Transações de teste para João
    this.data.transactions = [
      {
        id: '1',
        userId: '1',
        description: 'Salário Janeiro',
        amount: 5000,
        type: 'ENTRADA',
        category: 'Trabalho',
        date: new Date('2024-01-15'),
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: '2',
        userId: '1',
        description: 'Supermercado',
        amount: 250,
        type: 'SAIDA',
        category: 'Alimentação',
        date: new Date('2024-01-16'),
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-16')
      },
      {
        id: '3',
        userId: '1',
        description: 'Combustível',
        amount: 120.50,
        type: 'SAIDA',
        category: 'Transporte',
        date: new Date('2024-01-17'),
        createdAt: new Date('2024-01-17'),
        updatedAt: new Date('2024-01-17')
      },
      // Transações para Maria
      {
        id: '4',
        userId: '2',
        description: 'Freelance Design',
        amount: 1500,
        type: 'ENTRADA',
        category: 'Trabalho',
        date: new Date('2024-01-15'),
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: '5',
        userId: '2',
        description: 'Aluguel',
        amount: 800,
        type: 'SAIDA',
        category: 'Moradia',
        date: new Date('2024-01-16'),
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-16')
      },
      // Transações para Pedro
      {
        id: '6',
        userId: '3',
        description: 'Consultoria TI',
        amount: 3000,
        type: 'ENTRADA',
        category: 'Trabalho',
        date: new Date('2024-01-15'),
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: '7',
        userId: '3',
        description: 'Curso Online',
        amount: 199.90,
        type: 'SAIDA',
        category: 'Educação',
        date: new Date('2024-01-16'),
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-16')
      }
    ];

    this.saveData();
    console.log('✅ Dados de teste inicializados');
  }

  /**
   * Notifica status do servidor
   */
  private notifyServerStatus(status: 'RUNNING' | 'STOPPED'): void {
    const event = new CustomEvent('standaloneServerStatus', {
      detail: { status, port: this.config.port }
    });
    window.dispatchEvent(event);
  }

  /**
   * Obtém estatísticas do servidor
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      usersCount: this.data.users.length,
      transactionsCount: this.data.transactions.length,
      currentUser: this.data.currentUser?.name || 'Nenhum',
      lastUpdated: this.data.lastUpdated
    };
  }

  /**
   * Exporta dados para backup
   */
  exportData(): StandaloneData {
    return { ...this.data };
  }

  /**
   * Importa dados de backup
   */
  importData(data: StandaloneData): void {
    this.data = data;
    this.saveData();
  }

  /**
   * Limpa todos os dados
   */
  clearData(): void {
    this.data = {
      users: [],
      transactions: [],
      recurringTransactions: [],
      currentUser: null,
      lastUpdated: new Date()
    };
    localStorage.removeItem(this.config.dataStorageKey);
  }
}

export const standaloneServer = new StandaloneServer();
export default standaloneServer;