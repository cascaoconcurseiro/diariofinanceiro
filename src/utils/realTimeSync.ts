// Sincronização real-time entre dispositivos
class RealTimeSync {
  private ws: WebSocket | null = null;
  private deviceId: string;
  private syncCallbacks: ((data: any) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.deviceId = this.generateDeviceId();
    this.connect();
  }

  private generateDeviceId(): string {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  private connect(): void {
    try {
      // Usar WebSocket público para teste (substitua por seu servidor)
      this.ws = new WebSocket('wss://echo.websocket.org');
      
      this.ws.onopen = () => {
        console.log('🔄 Sincronização conectada');
        this.reconnectAttempts = 0;
        
        // Registrar dispositivo
        this.send({
          type: 'register',
          deviceId: this.deviceId,
          timestamp: Date.now()
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Ignorar mensagens do próprio dispositivo
          if (data.deviceId === this.deviceId) return;
          
          // Notificar callbacks
          this.syncCallbacks.forEach(callback => callback(data));
        } catch (error) {
          console.error('Erro ao processar mensagem:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('🔄 Conexão perdida, tentando reconectar...');
        this.reconnect();
      };

      this.ws.onerror = (error) => {
        console.error('Erro na conexão:', error);
      };

    } catch (error) {
      console.error('Erro ao conectar:', error);
      this.reconnect();
    }
  }

  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Máximo de tentativas de reconexão atingido');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    setTimeout(() => {
      console.log(`🔄 Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      this.connect();
    }, delay);
  }

  // Enviar dados para outros dispositivos
  send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        ...data,
        deviceId: this.deviceId,
        timestamp: Date.now()
      }));
    }
  }

  // Sincronizar transação
  syncTransaction(action: 'add' | 'update' | 'delete', transaction: any): void {
    this.send({
      type: 'transaction',
      action,
      data: transaction
    });
  }

  // Registrar callback para receber dados
  onSync(callback: (data: any) => void): void {
    this.syncCallbacks.push(callback);
  }

  // Status da conexão
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Forçar sincronização completa
  forcSync(allTransactions: any[]): void {
    this.send({
      type: 'full_sync',
      data: allTransactions
    });
  }
}

export const realTimeSync = new RealTimeSync();