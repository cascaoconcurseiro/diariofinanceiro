import React, { createContext, useContext, useState, useEffect } from 'react';
import { neonDB } from '../services/neonDatabase';
import { sanitizeInput, sanitizeEmail, validateEmail, validatePassword, validateName } from '../utils/security';
import { handleError } from '../utils/errorHandler';
import { trackEvent, trackError } from '../utils/monitoring';
import { syncService } from '../services/syncService';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  // Verificar se há usuário logado
  useEffect(() => {
    const checkAuth = () => {
      const savedUser = localStorage.getItem('userData');
      const savedToken = localStorage.getItem('token');
      
      if (savedUser && savedToken) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setToken(savedToken);
        
        // ✅ INICIALIZAR SINCRONIZAÇÃO
        syncService.setUserId(userData.id);
        
        console.log('✅ Login automático:', userData.name);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const cleanEmail = sanitizeEmail(email);
      if (!validateEmail(cleanEmail)) {
        return false;
      }
      
      // Tentar Neon primeiro, fallback para localStorage
      try {
        const result = await neonDB.authenticateUser(cleanEmail, password);
        
        if (result.success && result.user) {
          const userData = {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name
          };
          
          const token = `token_${result.user.id}`;
          setToken(token);
          setUser(userData);
          localStorage.setItem('token', token);
          localStorage.setItem('userData', JSON.stringify(userData));
          
          syncService.setUserId(userData.id);
          console.log('✅ Login Neon:', userData.name);
          return true;
        }
      } catch (neonError) {
        console.warn('Neon login failed, trying localStorage:', neonError);
      }
      
      // Fallback: usuários locais (apenas para desenvolvimento)
      const localUsers = process.env.NODE_ENV === 'development' ? [
        { id: 'wesley', name: 'Wesley', email: 'wesley@teste.com', password: '123456' },
        { id: 'joao', name: 'João Silva', email: 'joao@teste.com', password: 'MinhaSenh@123' },
        { id: 'maria', name: 'Maria Santos', email: 'maria@teste.com', password: 'OutraSenh@456' }
      ] : [];
      
      const user = localUsers.find(u => u.email === cleanEmail && u.password === password);
      
      if (user) {
        const userData = {
          id: user.id,
          email: user.email,
          name: user.name
        };
        
        const token = `token_${user.id}`;
        setToken(token);
        setUser(userData);
        localStorage.setItem('token', token);
        localStorage.setItem('userData', JSON.stringify(userData));
        
        syncService.setUserId(userData.id);
        console.log('✅ Login Local:', userData.name);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      // ✅ Validação e sanitização
      const cleanEmail = sanitizeEmail(email);
      const cleanName = sanitizeInput(name);
      
      if (!validateEmail(cleanEmail) || !validatePassword(password) || !validateName(cleanName)) {
        return false;
      }
      
      // Tentar criar no Neon primeiro
      const result = await neonDB.createUser(cleanEmail, password, cleanName);
      
      if (result.success && result.user) {
        const userData = {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name
        };
        
        // Login automático após registro
        const token = `token_${result.user.id}`;
        setToken(token);
        setUser(userData);
        localStorage.setItem('token', token);
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // ✅ INICIALIZAR SINCRONIZAÇÃO
        syncService.setUserId(userData.id);
        
        console.log('✅ Usuário registrado e logado:', cleanName);
        return true;
      } else {
        console.error('Erro no registro:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Erro no registro:', error);
      handleError(error, 'AuthContext.register');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    setUser(null);
    setToken(null);
    console.log('✅ Logout realizado');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};