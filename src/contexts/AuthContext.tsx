import React, { createContext, useContext, useState, useEffect } from 'react';
import { accountsDB } from '../services/accountsDB';
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
      const lastUser = accountsDB.getLastUser();
      const savedToken = localStorage.getItem('token');
      
      if (lastUser && savedToken) {
        setUser(lastUser);
        setToken(savedToken);
        
        // ✅ INICIALIZAR SINCRONIZAÇÃO
        syncService.setUserId(lastUser.id);
        
        console.log('✅ Login automático:', lastUser.name);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // ✅ Validação e sanitização
      const cleanEmail = sanitizeEmail(email);
      if (!validateEmail(cleanEmail) || !validatePassword(password)) {
        return false;
      }
      
      const account = await accountsDB.login(cleanEmail, password);
      
      if (account) {
        const userData = {
          id: account.id,
          email: account.email,
          name: account.name
        };
        
        const token = `token_${account.id}`;
        setToken(token);
        setUser(userData);
        localStorage.setItem('token', token);
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // ✅ INICIALIZAR SINCRONIZAÇÃO
        syncService.setUserId(userData.id);
        
        trackEvent('login.success', { email: cleanEmail });
        return true;
      }
      trackEvent('login.failed', { email: cleanEmail });
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      trackError('login.error', { email: cleanEmail });
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
      
      const account = await accountsDB.createAccount(cleanEmail, password, cleanName);
      
      const userData = {
        id: account.id,
        email: account.email,
        name: account.name
      };
      
      // Login automático após registro
      const token = `token_${account.id}`;
      setToken(token);
      setUser(userData);
      localStorage.setItem('token', token);
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // ✅ INICIALIZAR SINCRONIZAÇÃO
      syncService.setUserId(userData.id);
      
      console.log('✅ Usuário registrado e logado:', cleanName);
      return true;
    } catch (error) {
      console.error('Erro no registro:', error);
      handleError(error, 'AuthContext.register');
      return false;
    }
  };

  const logout = () => {
    accountsDB.logout();
    setUser(null);
    setToken(null);
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