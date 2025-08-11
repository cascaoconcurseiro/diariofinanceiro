export enum SystemMode {
  BACKEND = 'backend',
  STANDALONE = 'standalone',
  HYBRID = 'hybrid'
}

export interface ModeDetectionResult {
  mode: SystemMode;
  dockerAvailable: boolean;
  backendReachable: boolean;
  details: string;
}

export interface MigrationResult {
  success: boolean;
  migratedRecords: number;
  errors: string[];
}

export class SystemModeDetector {
  private currentMode: SystemMode = SystemMode.STANDALONE;
  private detectionCache: ModeDetectionResult | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 segundos

  /**
   * Detecta o modo de operação do sistema
   */
  async detectMode(): Promise<ModeDetectionResult> {
    // Usar cache se ainda válido
    if (this.detectionCache && Date.now() < this.cacheExpiry) {
      return this.detectionCache;
    }

    try {
      const dockerAvailable = await this.isDockerAvailable();
      const backendReachable = dockerAvailable ? await this.isBackendReachable() : false;

      let mode: SystemMode;
      let details: string;

      if (dockerAvailable && backendReachable) {
        mode = SystemMode.BACKEND;
        details = 'Docker disponível e backend acessível';
      } else if (dockerAvailable && !backendReachable) {
        mode = SystemMode.HYBRID;
        details = 'Docker disponível mas backend inacessível';
      } else {
        mode = SystemMode.STANDALONE;
        details = 'Docker não disponível, usando modo standalone';
      }

      const result: ModeDetectionResult = {
        mode,
        dockerAvailable,
        backendReachable,
        details
      };

      // Atualizar cache
      this.detectionCache = result;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;
      this.currentMode = mode;

      return result;
    } catch (error) {
      const fallbackResult: ModeDetectionResult = {
        mode: SystemMode.STANDALONE,
        dockerAvailable: false,
        backendReachable: false,
        details: `Erro na detecção: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };

      this.detectionCache = fallbackResult;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;
      this.currentMode = SystemMode.STANDALONE;

      return fallbackResult;
    }
  }

  /**
   * Verifica se o Docker está disponível
   */
  async isDockerAvailable(): Promise<boolean> {
    try {
      // Tentar fazer uma requisição para verificar se o backend está rodando
      const response = await fetch('http://localhost:3000/health', {
        method: 'GET',
        timeout: 5000,
        signal: AbortSignal.timeout(5000)
      });
      
      return response.ok;
    } catch (error) {
      // Verificar se existe algum indicador de que o Docker está instalado
      try {
        // Tentar detectar se estamos em um ambiente com Docker
        const userAgent = navigator.userAgent;
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        // Se estamos em localhost, assumir que Docker pode estar disponível
        return isLocalhost;
      } catch {
        return false;
      }
    }
  }

  /**
   * Verifica se o backend está acessível
   */
  async isBackendReachable(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3000/api/health', {
        method: 'GET',
        timeout: 3000,
        signal: AbortSignal.timeout(3000)
      });
      
      return response.ok;
    } catch (error) {
      console.warn('Backend não acessível:', error);
      return false;
    }
  }

  /**
   * Alterna para um modo específico
   */
  async switchMode(targetMode: SystemMode): Promise<ModeDetectionResult> {
    try {
      // Invalidar cache para forçar nova detecção
      this.detectionCache = null;
      this.cacheExpiry = 0;

      const currentDetection = await this.detectMode();
      
      if (targetMode === SystemMode.BACKEND && !currentDetection.backendReachable) {
        throw new Error('Não é possível alternar para modo backend: backend não acessível');
      }

      if (targetMode === SystemMode.HYBRID && !currentDetection.dockerAvailable) {
        throw new Error('Não é possível alternar para modo híbrido: Docker não disponível');
      }

      // Forçar o modo desejado
      this.currentMode = targetMode;
      
      const result: ModeDetectionResult = {
        ...currentDetection,
        mode: targetMode,
        details: `Modo alterado manualmente para ${targetMode}`
      };

      this.detectionCache = result;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;

      return result;
    } catch (error) {
      throw new Error(`Falha ao alternar modo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Migra dados entre modos de operação
   */
  async migrateData(fromMode: SystemMode, toMode: SystemMode): Promise<MigrationResult> {
    try {
      let migratedRecords = 0;
      const errors: string[] = [];

      if (fromMode === SystemMode.STANDALONE && toMode === SystemMode.BACKEND) {
        // Migrar do localStorage para backend
        const result = await this.migrateFromLocalStorageToBackend();
        migratedRecords = result.migratedRecords;
        errors.push(...result.errors);
      } else if (fromMode === SystemMode.BACKEND && toMode === SystemMode.STANDALONE) {
        // Migrar do backend para localStorage
        const result = await this.migrateFromBackendToLocalStorage();
        migratedRecords = result.migratedRecords;
        errors.push(...result.errors);
      } else if (fromMode === toMode) {
        // Nenhuma migração necessária
        return { success: true, migratedRecords: 0, errors: [] };
      }

      return {
        success: errors.length === 0,
        migratedRecords,
        errors
      };
    } catch (error) {
      return {
        success: false,
        migratedRecords: 0,
        errors: [error instanceof Error ? error.message : 'Erro na migração']
      };
    }
  }

  /**
   * Migra dados do localStorage para o backend
   */
  private async migrateFromLocalStorageToBackend(): Promise<MigrationResult> {
    const errors: string[] = [];
    let migratedRecords = 0;

    try {
      // Obter dados do localStorage
      const localData = localStorage.getItem('financialData');
      if (!localData) {
        return { success: true, migratedRecords: 0, errors: [] };
      }

      const parsedData = JSON.parse(localData);
      
      // Enviar dados para o backend
      for (const [monthKey, monthData] of Object.entries(parsedData)) {
        try {
          const response = await fetch('http://localhost:3000/api/migrate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              monthKey,
              data: monthData
            })
          });

          if (response.ok) {
            migratedRecords++;
          } else {
            errors.push(`Falha ao migrar dados do mês ${monthKey}`);
          }
        } catch (error) {
          errors.push(`Erro ao migrar ${monthKey}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }

      return { success: errors.length === 0, migratedRecords, errors };
    } catch (error) {
      return {
        success: false,
        migratedRecords,
        errors: [error instanceof Error ? error.message : 'Erro na migração do localStorage']
      };
    }
  }

  /**
   * Migra dados do backend para o localStorage
   */
  private async migrateFromBackendToLocalStorage(): Promise<MigrationResult> {
    const errors: string[] = [];
    let migratedRecords = 0;

    try {
      // Obter dados do backend
      const response = await fetch('http://localhost:3000/api/export', {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error('Falha ao obter dados do backend');
      }

      const backendData = await response.json();
      
      // Salvar no localStorage
      localStorage.setItem('financialData', JSON.stringify(backendData));
      migratedRecords = Object.keys(backendData).length;

      return { success: true, migratedRecords, errors };
    } catch (error) {
      return {
        success: false,
        migratedRecords,
        errors: [error instanceof Error ? error.message : 'Erro na migração do backend']
      };
    }
  }

  /**
   * Obtém o modo atual
   */
  getCurrentMode(): SystemMode {
    return this.currentMode;
  }

  /**
   * Limpa o cache de detecção
   */
  clearCache(): void {
    this.detectionCache = null;
    this.cacheExpiry = 0;
  }

  /**
   * Verifica se o sistema está em modo offline
   */
  isOfflineMode(): boolean {
    return this.currentMode === SystemMode.STANDALONE;
  }

  /**
   * Verifica se o sistema pode usar o backend
   */
  canUseBackend(): boolean {
    return this.currentMode === SystemMode.BACKEND || this.currentMode === SystemMode.HYBRID;
  }
}