// Sistema de backup automático
class BackupSystem {
  private readonly BACKUP_KEY = 'diario_backup';
  private readonly MAX_BACKUPS = 5;
  
  createBackup(data: any): void {
    try {
      const backups = this.getBackups();
      const newBackup = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        data: JSON.stringify(data),
        size: JSON.stringify(data).length
      };
      
      backups.unshift(newBackup);
      
      // Manter apenas os últimos backups
      if (backups.length > this.MAX_BACKUPS) {
        backups.splice(this.MAX_BACKUPS);
      }
      
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backups));
    } catch (error) {
      console.error('Erro ao criar backup:', error);
    }
  }
  
  getBackups(): any[] {
    try {
      const backups = localStorage.getItem(this.BACKUP_KEY);
      return backups ? JSON.parse(backups) : [];
    } catch {
      return [];
    }
  }
  
  restoreBackup(backupId: string): any | null {
    try {
      const backups = this.getBackups();
      const backup = backups.find(b => b.id === backupId);
      return backup ? JSON.parse(backup.data) : null;
    } catch {
      return null;
    }
  }
  
  exportData(): string {
    const accounts = localStorage.getItem('diario_accounts') || '[]';
    const transactions = localStorage.getItem('unifiedFinancialData') || '[]';
    
    return JSON.stringify({
      accounts: JSON.parse(accounts),
      transactions: JSON.parse(transactions),
      exportDate: new Date().toISOString()
    }, null, 2);
  }
}

export const backupSystem = new BackupSystem();