import { accountsDB } from '../services/accountsDB';
import { enterpriseDB } from './enterpriseDB';

/**
 * Sincroniza usuários existentes do accountsDB para o enterpriseDB
 * Garante que todos os usuários apareçam no gerenciamento
 */
export const syncExistingUsers = async (): Promise<void> => {
  try {
    await enterpriseDB.init();
    
    // Buscar usuários do accountsDB
    const accounts = accountsDB.getAllAccounts();
    
    // Buscar usuários já existentes no enterpriseDB
    const existingUsers = await enterpriseDB.getAllFromStore('users');
    const existingEmails = new Set(existingUsers.map(u => u.email));
    
    let syncedCount = 0;
    
    for (const account of accounts) {
      // Só sincronizar se não existir no enterpriseDB
      if (!existingEmails.has(account.email)) {
        const enterpriseUser = {
          id: account.id,
          email: account.email,
          name: account.name,
          createdAt: account.createdAt,
          isActive: true,
          loginAttempts: 0,
          role: 'user' as const,
          lastLogin: null
        };
        
        const transaction = enterpriseDB['db']!.transaction(['users'], 'readwrite');
        const store = transaction.objectStore('users');
        
        await new Promise<void>((resolve, reject) => {
          const request = store.add(enterpriseUser);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
        
        syncedCount++;
        console.log(`✅ Usuário sincronizado: ${account.name} (${account.email})`);
      }
    }
    
    if (syncedCount > 0) {
      console.log(`🔄 Sincronização concluída: ${syncedCount} usuários adicionados ao gerenciamento`);
    } else {
      console.log('✅ Todos os usuários já estão sincronizados');
    }
    
  } catch (error) {
    console.error('❌ Erro na sincronização de usuários:', error);
  }
};

/**
 * Verifica se um usuário específico existe no enterpriseDB
 */
export const checkUserInEnterpriseDB = async (email: string): Promise<boolean> => {
  try {
    await enterpriseDB.init();
    const users = await enterpriseDB.getAllFromStore('users');
    return users.some(u => u.email === email);
  } catch (error) {
    console.error('Erro ao verificar usuário no enterpriseDB:', error);
    return false;
  }
};

/**
 * Força a sincronização de um usuário específico
 */
export const forceSyncUser = async (email: string): Promise<boolean> => {
  try {
    const accounts = accountsDB.getAllAccounts();
    const account = accounts.find(acc => acc.email === email);
    
    if (!account) {
      console.warn(`Usuário ${email} não encontrado no accountsDB`);
      return false;
    }
    
    await enterpriseDB.init();
    
    const enterpriseUser = {
      id: account.id,
      email: account.email,
      name: account.name,
      createdAt: account.createdAt,
      isActive: true,
      loginAttempts: 0,
      role: 'user' as const,
      lastLogin: new Date().toISOString()
    };
    
    const transaction = enterpriseDB['db']!.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(enterpriseUser); // put para sobrescrever se existir
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    console.log(`✅ Usuário ${email} sincronizado forçadamente`);
    return true;
    
  } catch (error) {
    console.error(`❌ Erro ao sincronizar usuário ${email}:`, error);
    return false;
  }
};