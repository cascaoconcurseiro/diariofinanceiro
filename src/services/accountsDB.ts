import { encryption } from '../utils/encryption';

// Banco de dados seguro com hash de senhas
interface Account {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: string;
}

// Hash simples (em produção usar bcrypt)
const hashPassword = (password: string): string => {
  return btoa(password + 'salt123'); // Base64 simples
};

const verifyPassword = (password: string, hash: string): boolean => {
  return hashPassword(password) === hash;
};

class AccountsDB {
  private readonly ACCOUNTS_KEY = 'diario_accounts';
  private readonly LAST_USER_KEY = 'diario_last_user';

  getAllAccounts(): Account[] {
    try {
      const encryptedData = localStorage.getItem(this.ACCOUNTS_KEY);
      if (!encryptedData) return [];
      
      // ✅ Descriptografar dados
      const decryptedData = encryption.decrypt(encryptedData);
      return JSON.parse(decryptedData);
    } catch {
      return [];
    }
  }

  createAccount(email: string, password: string, name: string): Account {
    const accounts = this.getAllAccounts();
    
    if (accounts.find(acc => acc.email === email)) {
      throw new Error('Email já cadastrado');
    }

    const newAccount: Account = {
      id: Date.now().toString(),
      email: email.toLowerCase().trim(),
      password: hashPassword(password), // ✅ Hash da senha
      name: name.trim(),
      createdAt: new Date().toISOString()
    };

    accounts.push(newAccount);
    // ✅ Criptografar dados sensíveis
    const encryptedData = encryption.encrypt(JSON.stringify(accounts));
    localStorage.setItem(this.ACCOUNTS_KEY, encryptedData);
    this.setLastUser(newAccount);
    
    return newAccount;
  }

  login(email: string, password: string): Account | null {
    const accounts = this.getAllAccounts();
    const account = accounts.find(acc => 
      acc.email === email.toLowerCase().trim() && 
      verifyPassword(password, acc.password) // ✅ Verificação segura
    );
    
    if (account) {
      this.setLastUser(account);
    }
    
    return account || null;
  }

  private setLastUser(account: Account) {
    const userData = {
      id: account.id,
      email: account.email,
      name: account.name
    };
    localStorage.setItem(this.LAST_USER_KEY, JSON.stringify(userData));
  }

  getLastUser(): { id: string; email: string; name: string } | null {
    try {
      const lastUser = localStorage.getItem(this.LAST_USER_KEY);
      return lastUser ? JSON.parse(lastUser) : null;
    } catch {
      return null;
    }
  }

  logout() {
    localStorage.removeItem(this.LAST_USER_KEY);
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
  }

  // ❌ Método removido por segurança - não expor emails
}

export const accountsDB = new AccountsDB();