/**
 * Serviço de Detecção de Docker e Fallback para Sistema Standalone
 * Detecta disponibilidade do Docker e configura modo de operação adequado
 */

export interface SystemStatus {
  dockerAvailable: boolean;
  dockerRunning: boolean;
  backendHealthy: boolean;
  recommendedMode: 'FULL_SYSTEM' | 'STANDALONE';
  lastCheck: Date;
}

export interface FallbackConfig {
  enableAutoFallback: boolean;
  standalonePort: number;
  maxRetryAttempts: number;
  healthCheckInterval: number;
}

class DockerDetectionService {
  private config: FallbackConfig = {
    enableAutoFallback: true,
    standalonePort: 3001,
    maxRetryAttempts: 3,
    healthCheckInterval: 30000
  };

  private lastStatus: SystemStatus | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;

  /**
   * Verifica se o Docker está instalado no sistema
   */
  async isDockerInstalled(): Promise<boolean> {
    try {
      // Simula verificação de Docker (em ambiente real usaria child_process)
      const dockerCheck = localStorage.getItem('docker_available');
      return dockerCheck === 'true';
    } catch (error) {
      console.warn('Erro ao verificar instalação do Docker:', error);
      return false;
    }
  }

  /**
   * Verifica se o Docker está rodando
   */
  async isDockerRunning(): Promise<boolean> {
    try {
      // Simula verificação de Docker rodando
      const dockerRunning = localStorage.getItem('docker_running');
      return dockerRunning === 'true';
    } catch (error) {
      console.warn('Erro ao verificar status do Docker:', error);
      return false;
    }
  }

  /**
   * Verifica saúde do backend
   */
  async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3000/health', {
        method: 'GET',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      console.warn('Backend não disponível:', error);
      return false;
    }
  }

  /**
   * Executa verificação completa do sistema
   */
  async checkSystemStatus(): Promise<SystemStatus> {
    const dockerAvailable = await this.isDockerInstalled();
    const dockerRunning = await this.isDockerRunning();
    const backendHealthy = await this.checkBackendHealth();

    const status: SystemStatus = {
      dockerAvailable,
      dockerRunning,
      backendHealthy,
      recommendedMode: (dockerAvailable && dockerRunning && backendHealthy) 
        ? 'FULL_SYSTEM' 
        : 'STANDALONE',
      lastCheck: new Date()
    };

    this.lastStatus = status;
    this.notifyStatusChange(status);

    return status;
  }

  /**
   * Inicia monitoramento contínuo do sistema
   */
  startHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(async () => {
      await this.checkSystemStatus();
    }, this.config.healthCheckInterval);
  }

  /**
   * Para monitoramento do sistema
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  /**
   * Força modo standalone
   */
  forceStandaloneMode(): void {
    localStorage.setItem('force_standalone', 'true');
    this.notifyModeChange('STANDALONE');
  }

  /**
   * Tenta reconectar ao sistema completo
   */
  async attemptFullSystemReconnection(): Promise<boolean> {
    localStorage.removeItem('force_standalone');
    
    const status = await this.checkSystemStatus();
    
    if (status.recommendedMode === 'FULL_SYSTEM') {
      this.notifyModeChange('FULL_SYSTEM');
      return true;
    }
    
    return false;
  }

  /**
   * Obtém status atual do sistema
   */
  getCurrentStatus(): SystemStatus | null {
    return this.lastStatus;
  }

  /**
   * Verifica se deve usar modo standalone
   */
  shouldUseStandaloneMode(): boolean {
    const forceStandalone = localStorage.getItem('force_standalone') === 'true';
    
    if (forceStandalone) return true;
    
    if (!this.lastStatus) return true;
    
    return this.lastStatus.recommendedMode === 'STANDALONE';
  }

  /**
   * Notifica mudança de status do sistema
   */
  private notifyStatusChange(status: SystemStatus): void {
    const event = new CustomEvent('systemStatusChange', {
      detail: status
    });
    window.dispatchEvent(event);
  }

  /**
   * Notifica mudança de modo de operação
   */
  private notifyModeChange(mode: 'FULL_SYSTEM' | 'STANDALONE'): void {
    const event = new CustomEvent('systemModeChange', {
      detail: { mode }
    });
    window.dispatchEvent(event);
  }

  /**
   * Configura dados de teste para simulação
   */
  setupTestEnvironment(): void {
    // Simula Docker não disponível para forçar modo standalone
    localStorage.setItem('docker_available', 'false');
    localStorage.setItem('docker_running', 'false');
  }

  /**
   * Limpa configurações de teste
   */
  clearTestEnvironment(): void {
    localStorage.removeItem('docker_available');
    localStorage.removeItem('docker_running');
    localStorage.removeItem('force_standalone');
  }
}

export const dockerDetectionService = new DockerDetectionService();

// Hook React para usar o serviço
export function useDockerDetection() {
  const [status, setStatus] = React.useState<SystemStatus | null>(null);
  const [isStandalone, setIsStandalone] = React.useState(false);

  React.useEffect(() => {
    // Verificação inicial
    dockerDetectionService.checkSystemStatus().then(setStatus);
    setIsStandalone(dockerDetectionService.shouldUseStandaloneMode());

    // Listeners para mudanças
    const handleStatusChange = (event: CustomEvent) => {
      setStatus(event.detail);
    };

    const handleModeChange = (event: CustomEvent) => {
      setIsStandalone(event.detail.mode === 'STANDALONE');
    };

    window.addEventListener('systemStatusChange', handleStatusChange as EventListener);
    window.addEventListener('systemModeChange', handleModeChange as EventListener);

    // Inicia monitoramento
    dockerDetectionService.startHealthMonitoring();

    return () => {
      window.removeEventListener('systemStatusChange', handleStatusChange as EventListener);
      window.removeEventListener('systemModeChange', handleModeChange as EventListener);
      dockerDetectionService.stopHealthMonitoring();
    };
  }, []);

  return {
    status,
    isStandalone,
    forceStandalone: () => dockerDetectionService.forceStandaloneMode(),
    attemptReconnection: () => dockerDetectionService.attemptFullSystemReconnection(),
    refreshStatus: () => dockerDetectionService.checkSystemStatus()
  };
}

export default dockerDetectionService;