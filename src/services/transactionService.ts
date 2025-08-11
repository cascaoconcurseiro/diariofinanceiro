interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'ENTRADA' | 'SAIDA';
  category: string;
}

interface TransactionResponse {
  success: boolean;
  data: Transaction | Transaction[];
  error?: string;
}

const API_BASE_URL = 'http://localhost:8000/api';

export const transactionService = {
  async getTransactions(): Promise<Transaction[]> {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const response = await fetch(`${API_BASE_URL}/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data.data;
    } catch (error) {
      console.error('Get transactions error:', error);
      throw error;
    }
  },

  async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transaction)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data.data;
    } catch (error) {
      console.error('Create transaction error:', error);
      throw error;
    }
  }
};