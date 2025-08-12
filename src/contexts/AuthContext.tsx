import React, { createContext, useContext, useState, useEffect } from 'react';
import { accountsDB } from '../services/accountsDB';
import { sanitizeInput, sanitizeEmail, validateEmail, validatePassword, validateName } from '../utils/security';
import { handleError } from '../utils/errorHandler';
import { trackEvent, trackError } from '../utils/monitoring';

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
      
      const account = accountsDB.login(cleanEmail, password);
      
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
        trackEvent('login.success', { email: cleanEmail });
        return true;
      }
      trackEvent('login.failed', { email: cleanEmail });
      return false;
    } catch (error) {
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
      
      const account = accountsDB.createAccount(cleanEmail, password, cleanName);
      
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
      
      return true;
    } catch (error) {
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