/**
 * SISTEMA DE BACKUP AUTOMÁTICO E RECUPERAÇÃO
 * 
 * Implementa backup automático e recuperação de dados para garantir integridade
 */

interface BackupData {
  id: string;
  timestamp: string;
  data: any;
  checksum: string;
  version: string;
  size: number;
}

interface BackupMetadata {
  totalBackups: number;
  lastBackup: string;
  oldestBackup: string;
  totalSize: number;
}

const BACKUP_CONFIG = {
  MAX_BACKUPS: 5,
  BACKUP_INTERVAL: 5 * 60 * 1000, // 5 minutos
  AUTO_BACKUP_KEY: 'autoBackupEnabled',
  BACKUP_PREFIX: 'backup_',
  METADATA_KEY: 'backupMetadata'
};

/**
 * Gera checksum simples para verificação de integridade
 */
function generateChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Cria backup dos dados financeiros
 */
export function createBackup(data: any, manual: boolean = false): string {
  try {
    const backupId = `${manual ? 'manual' : 'auto'}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const timestamp = new Date().toISOString();
    const dataString = JSON.stringify(data);
    const checksum = generateChecksum(dataString);
    
    const backup: BackupData = {
      id: backupId,
      timestamp,
      data,
      checksum,
      version: '1.0',
      size: dataString.length
    };

    // Salvar backup
    const backupKey = BACKUP_CONFIG.BACKUP_PREFIX + backupId;
    localStorage.setItem(backupKey, JSON.stringify(backup));

    // Atualizar metadata
    updateBackupMetadata();

    // Limpar backups antigos
    cleanOldBackups();

    console.log(`✅ Backup criado: ${backupId} (${backup.size} bytes)`);
    return backupId;

  } catch (error) {
    console.error('❌ Erro ao criar backup:', error);
    throw new Error('Falha ao criar backup');
  }
}

/**
 * Lista todos os backups disponíveis
 */
export function listBackups(): BackupData[] {
  const backups: BackupData[] = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(BACKUP_CONFIG.BACKUP_PREFIX)) {
        const backupData = localStorage.getItem(key);
        if (backupData) {
          const backup = JSON.parse(backupData);
          backups.push(backup);
        }
      }
    }

    // Ordenar por timestamp (mais recente primeiro)
    return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  } catch (error) {
    console.error('❌ Erro ao listar backups:', error);
    return [];
  }
}

/**
 * Restaura dados de um backup específico
 */
export function restoreBackup(backupId: string): any {
  try {
    const backupKey = BACKUP_CONFIG.BACKUP_PREFIX + backupId;
    const backupData = localStorage.getItem(backupKey);
    
    if (!backupData) {
      throw new Error('Backup não encontrado');
    }

    const backup: BackupData = JSON.parse(backupData);
    
    // Verificar integridade
    const dataString = JSON.stringify(backup.data);
    const currentChecksum = generateChecksum(dataString);
    
    if (currentChecksum !== backup.checksum) {
      throw new Error('Backup corrompido - checksum inválido');
    }

    console.log(`✅ Backup restaurado: ${backupId}`);
    return backup.data;

  } catch (error) {
    console.error('❌ Erro ao restaurar backup:', error);
    throw error;
  }
}

/**
 * Remove backup específico
 */
export function deleteBackup(backupId: string): boolean {
  try {
    const backupKey = BACKUP_CONFIG.BACKUP_PREFIX + backupId;
    localStorage.removeItem(backupKey);
    updateBackupMetadata();
    
    console.log(`✅ Backup removido: ${backupId}`);
    return true;

  } catch (error) {
    console.error('❌ Erro ao remover backup:', error);
    return false;
  }
}

/**
 * Limpa backups antigos mantendo apenas os mais recentes
 */
function cleanOldBackups(): void {
  try {
    const backups = listBackups();
    
    if (backups.length > BACKUP_CONFIG.MAX_BACKUPS) {
      const backupsToDelete = backups.slice(BACKUP_CONFIG.MAX_BACKUPS);
      
      backupsToDelete.forEach(backup => {
        deleteBackup(backup.id);
      });
      
      console.log(`🧹 Removidos ${backupsToDelete.length} backups antigos`);
    }

  } catch (error) {
    console.error('❌ Erro ao limpar backups antigos:', error);
  }
}

/**
 * Atualiza metadata dos backups
 */
function updateBackupMetadata(): void {
  try {
    const backups = listBackups();
    
    const metadata: BackupMetadata = {
      totalBackups: backups.length,
      lastBackup: backups.length > 0 ? backups[0].timestamp : '',
      oldestBackup: backups.length > 0 ? backups[backups.length - 1].timestamp : '',
      totalSize: backups.reduce((sum, backup) => sum + backup.size, 0)
    };

    localStorage.setItem(BACKUP_CONFIG.METADATA_KEY, JSON.stringify(metadata));

  } catch (error) {
    console.error('❌ Erro ao atualizar metadata:', error);
  }
}

/**
 * Obtém metadata dos backups
 */
export function getBackupMetadata(): BackupMetadata {
  try {
    const metadata = localStorage.getItem(BACKUP_CONFIG.METADATA_KEY);
    return metadata ? JSON.parse(metadata) : {
      totalBackups: 0,
      lastBackup: '',
      oldestBackup: '',
      totalSize: 0
    };

  } catch (error) {
    console.error('❌ Erro ao obter metadata:', error);
    return {
      totalBackups: 0,
      lastBackup: '',
      oldestBackup: '',
      totalSize: 0
    };
  }
}

/**
 * Verifica se backup automático está habilitado
 */
export function isAutoBackupEnabled(): boolean {
  return localStorage.getItem(BACKUP_CONFIG.AUTO_BACKUP_KEY) === 'true';
}

/**
 * Habilita/desabilita backup automático
 */
export function setAutoBackup(enabled: boolean): void {
  localStorage.setItem(BACKUP_CONFIG.AUTO_BACKUP_KEY, enabled.toString());
  console.log(`${enabled ? '✅' : '❌'} Backup automático ${enabled ? 'habilitado' : 'desabilitado'}`);
}

/**
 * Executa backup automático se habilitado
 */
export function executeAutoBackup(data: any): void {
  if (!isAutoBackupEnabled()) {
    return;
  }

  try {
    const metadata = getBackupMetadata();
    const now = Date.now();
    const lastBackupTime = metadata.lastBackup ? new Date(metadata.lastBackup).getTime() : 0;
    
    // Verificar se é hora de fazer backup
    if (now - lastBackupTime >= BACKUP_CONFIG.BACKUP_INTERVAL) {
      createBackup(data, false);
    }

  } catch (error) {
    console.error('❌ Erro no backup automático:', error);
  }
}

/**
 * Recupera dados em caso de corrupção
 */
export function recoverFromCorruption(): any {
  try {
    console.log('🔄 Tentando recuperar dados corrompidos...');
    
    const backups = listBackups();
    
    if (backups.length === 0) {
      console.log('⚠️ Nenhum backup disponível para recuperação');
      return null;
    }

    // Tentar restaurar do backup mais recente
    for (const backup of backups) {
      try {
        const data = restoreBackup(backup.id);
        console.log(`✅ Dados recuperados do backup: ${backup.id}`);
        return data;
      } catch (error) {
        console.warn(`⚠️ Backup ${backup.id} corrompido, tentando próximo...`);
        continue;
      }
    }

    console.error('❌ Todos os backups estão corrompidos');
    return null;

  } catch (error) {
    console.error('❌ Erro na recuperação:', error);
    return null;
  }
}

/**
 * Exporta todos os dados para download
 */
export function exportAllData(): string {
  try {
    const mainData = localStorage.getItem('unifiedFinancialData');
    const backups = listBackups();
    const metadata = getBackupMetadata();
    
    const exportData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      mainData: mainData ? JSON.parse(mainData) : [],
      backups: backups,
      metadata: metadata,
      systemInfo: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        localStorage: {
          length: localStorage.length,
          size: JSON.stringify(localStorage).length
        }
      }
    };

    return JSON.stringify(exportData, null, 2);

  } catch (error) {
    console.error('❌ Erro ao exportar dados:', error);
    throw error;
  }
}

/**
 * Importa dados de um arquivo de exportação
 */
export function importData(jsonData: string): boolean {
  try {
    const importData = JSON.parse(jsonData);
    
    // Validar estrutura
    if (!importData.mainData || !Array.isArray(importData.mainData)) {
      throw new Error('Formato de dados inválido');
    }

    // Criar backup antes da importação
    const currentData = localStorage.getItem('unifiedFinancialData');
    if (currentData) {
      createBackup(JSON.parse(currentData), true);
    }

    // Importar dados principais
    localStorage.setItem('unifiedFinancialData', JSON.stringify(importData.mainData));
    
    console.log(`✅ Dados importados: ${importData.mainData.length} transações`);
    return true;

  } catch (error) {
    console.error('❌ Erro ao importar dados:', error);
    return false;
  }
}

// Inicializar sistema de backup
if (typeof window !== 'undefined') {
  // Habilitar backup automático por padrão
  if (localStorage.getItem(BACKUP_CONFIG.AUTO_BACKUP_KEY) === null) {
    setAutoBackup(true);
  }
  
  console.log('🔄 Sistema de backup inicializado');
}