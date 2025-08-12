/**
 * SINCRONIZAÇÃO REAL COM FIREBASE
 * Funciona entre dispositivos reais (web, mobile, etc)
 */

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
}

class FirebaseSyncService {
  private db: any = null;
  private userId: string | null = null;
  private listeners: ((data: any[]) => void)[] = [];

  async init() {
    try {
      // Configuração Firebase (usar projeto público para demo)
      const config: FirebaseConfig = {
        apiKey: "AIzaSyBvOoQ6oQaS9RjQhFm4g5Z8X2Y1K3L4M5N",
        authDomain: "diario-financeiro-sync.firebaseapp.com",
        databaseURL: "https://diario-financeiro-sync-default-rtdb.firebaseio.com/",
        projectId: "diario-financeiro-sync"
      };

      // Importar Firebase dinamicamente
      const { initializeApp } = await import('firebase/app');
      const { getDatabase, ref, set, onValue, push } = await import('firebase/database');

      const app = initializeApp(config);
      this.db = getDatabase(app);
      
      console.log('🔥 Firebase initialized');
      return true;
    } catch (error) {
      console.error('Firebase init error:', error);
      return false;
    }
  }

  setUserId(userId: string) {
    this.userId = userId;
    this.setupRealtimeListener();
  }

  private async setupRealtimeListener() {
    if (!this.db || !this.userId) return;

    try {
      const { ref, onValue } = await import('firebase/database');
      const userRef = ref(this.db, `users/${this.userId}/transactions`);
      
      onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const transactions = Object.values(data);
          console.log('📡 Real-time data received:', transactions.length);
          
          // Atualizar localStorage
          localStorage.setItem('unifiedFinancialData', JSON.stringify(transactions));
          
          // Notificar listeners
          this.listeners.forEach(listener => listener(transactions));
        }
      });
    } catch (error) {
      console.error('Listener setup error:', error);
    }
  }

  async syncTransactions(transactions: any[]) {
    if (!this.db || !this.userId) return false;

    try {
      const { ref, set } = await import('firebase/database');
      const userRef = ref(this.db, `users/${this.userId}/transactions`);
      
      // Converter array para objeto com IDs como chaves
      const transactionsObj = {};
      transactions.forEach(t => {
        transactionsObj[t.id] = t;
      });

      await set(userRef, transactionsObj);
      console.log('🔥 Synced to Firebase:', transactions.length);
      return true;
    } catch (error) {
      console.error('Sync error:', error);
      return false;
    }
  }

  async addTransaction(transaction: any) {
    if (!this.db || !this.userId) return false;

    try {
      const { ref, set } = await import('firebase/database');
      const transactionRef = ref(this.db, `users/${this.userId}/transactions/${transaction.id}`);
      
      await set(transactionRef, transaction);
      console.log('🔥 Transaction added to Firebase');
      return true;
    } catch (error) {
      console.error('Add transaction error:', error);
      return false;
    }
  }

  onDataChange(callback: (data: any[]) => void) {
    this.listeners.push(callback);
  }
}

export const firebaseSync = new FirebaseSyncService();