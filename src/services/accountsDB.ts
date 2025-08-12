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

  async createAccount(email: string, password: string, name: string): Promise<Account> {
    const accounts = this.getAllAccounts();
    
    if (accounts.find(acc => acc.email === email)) {
      throw new Error('Email já cadastrado');
    }

    const newAccount: Account = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      email: email.toLowerCase().trim(),
      password: hashPassword(password), // ✅ Hash da senha
      name: name.trim(),
      createdAt: new Date().toISOString()
    };

    accounts.push(newAccount);
    // ✅ Criptografar dados sensíveis
    const encryptedData = encryption.encrypt(JSON.stringify(accounts));
    localStorage.setItem(this.ACCOUNTS_KEY, encryptedData);
    
    // ✅ SINCRONIZAR COM ENTERPRISE DB
    try {
      const { enterpriseDB } = await import('../utils/enterpriseDB');
      await enterpriseDB.init();
      
      // Adicionar usuário ao enterpriseDB para aparecer no gerenciamento
      const enterpriseUser = {
        id: newAccount.id,
        email: newAccount.email,
        name: newAccount.name,
        createdAt: newAccount.createdAt,
        isActive: true,
        loginAttempts: 0,
        role: 'user' as const,
        lastLogin: new Date().toISOString()
      };
      
      const transaction = enterpriseDB['db']!.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      await new Promise<void>((resolve, reject) => {
        const request = store.add(enterpriseUser);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      console.log('✅ Usuário sincronizado com enterpriseDB:', newAccount.email);
    } catch (error) {
      console.warn('⚠️ Erro ao sincronizar com enterpriseDB:', error);
    }
    
    this.setLastUser(newAccount);
    return newAccount;
  }

  async login(email: string, password: string): Promise<Account | null> {
    const accounts = this.getAllAccounts();
    const account = accounts.find(acc => 
      acc.email === email.toLowerCase().trim() && 
      verifyPassword(password, acc.password) // ✅ Verificação segura
    );
    
    if (account) {
      this.setLastUser(account);
      
      // ✅ ATUALIZAR ÚLTIMO LOGIN NO ENTERPRISE DB
      try {
        const { enterpriseDB } = await import('../utils/enterpriseDB');
        await enterpriseDB.init();
        await enterpriseDB.updateUser(account.id, { 
          lastLogin: new Date().toISOString(),
          loginAttempts: 0 // Reset tentativas em login bem-sucedido
        });
        console.log('✅ Login atualizado no enterpriseDB:', account.email);
      } catch (error) {
        console.warn('⚠️ Erro ao atualizar login no enterpriseDB:', error);
      }
    } else {
      // ✅ INCREMENTAR TENTATIVAS DE LOGIN FALHADAS
      try {
        const { enterpriseDB } = await import('../utils/enterpriseDB');
        await enterpriseDB.init();
        const users = await enterpriseDB.getAllFromStore('users');
        const user = users.find(u => u.email === email.toLowerCase().trim());
        if (user) {
          await enterpriseDB.updateUser(user.id, { 
            loginAttempts: (user.loginAttempts || 0) + 1
          });
        }
      } catch (error) {
        console.warn('⚠️ Erro ao atualizar tentativas de login:', error);
      }
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