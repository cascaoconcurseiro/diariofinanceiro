interface User {
  id: string;
  name: string;
  email: string;
}

interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
  error?: string;
}

interface AuthService {
  login(email: string, password: string): Promise<LoginResponse>;
  logout(): Promise<void>;
  verifyToken(token: string): Promise<boolean>;
  refreshToken(): Promise<string>;
}

const API_BASE_URL = 'http://localhost:8000/api';

export const authService: AuthService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Login service error:', error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        await fetch(`${API_BASE_URL}/users/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Logout service error:', error);
      // Don't throw error for logout, just log it
    }
  },

  async verifyToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  },

  async refreshToken(): Promise<string> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Token refresh failed');
      }

      return data.data.tokens.accessToken;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }
};

// Test users data
export const TEST_USERS = [
  {
    id: 'joao',
    name: 'João Silva',
    email: 'joao@teste.com',
    password: 'MinhaSenh@123',
    description: 'Funcionário CLT',
    profile: 'Tem salário fixo e gastos regulares'
  },
  {
    id: 'maria',
    name: 'Maria Santos',
    email: 'maria@teste.com',
    password: 'OutraSenh@456',
    description: 'Freelancer',
    profile: 'Renda variável de projetos'
  },
  {
    id: 'pedro',
    name: 'Pedro Costa',
    email: 'pedro@teste.com',
    password: 'Pedro@789',
    description: 'Consultor',
    profile: 'Consultor de TI independente'
  }
];

// Error types
export enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR'
}

export interface AuthError {
  type: AuthErrorType;
  message: string;
  details?: any;
}

// Utility function to handle auth errors
export const handleAuthError = (error: any): AuthError => {
  if (error.message?.includes('fetch')) {
    return {
      type: AuthErrorType.NETWORK_ERROR,
      message: 'Erro de conexão. Verifique se o servidor está rodando.',
      details: error
    };
  }

  if (error.message?.includes('Credenciais inválidas')) {
    return {
      type: AuthErrorType.INVALID_CREDENTIALS,
      message: 'Email ou senha incorretos.',
      details: error
    };
  }

  if (error.message?.includes('Token')) {
    return {
      type: AuthErrorType.TOKEN_EXPIRED,
      message: 'Sessão expirada. Faça login novamente.',
      details: error
    };
  }

  return {
    type: AuthErrorType.SERVER_ERROR,
    message: 'Erro interno do servidor. Tente novamente.',
    details: error
  };
};