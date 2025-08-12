import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Wifi, WifiOff, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { syncService } from '../services/syncService';
import { realTimeSync } from '../utils/realTimeSync';

const SyncStatus: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<any>({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      const status = syncService.getSyncStatus();
      setSyncStatus(status);
      setLastSync(status.lastSync);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await syncService.forceSync();
      const status = syncService.getSyncStatus();
      setSyncStatus(status);
      setLastSync(Date.now());
    } catch (error) {
      console.error('Erro na sincronização:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (timestamp: number) => {
    if (!timestamp) return 'Nunca';
    
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Agora mesmo';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min atrás`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getSyncIcon = () => {
    if (isSyncing) return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (!isOnline) return <WifiOff className="w-4 h-4 text-red-500" />;
    if (lastSync && Date.now() - lastSync < 60000) return <Check className="w-4 h-4 text-green-500" />;
    return <Wifi className="w-4 h-4 text-blue-500" />;
  };

  const getSyncColor = () => {
    if (!isOnline) return 'text-red-600 bg-red-50';
    if (lastSync && Date.now() - lastSync < 60000) return 'text-green-600 bg-green-50';
    return 'text-blue-600 bg-blue-50';
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${getSyncColor()}`}>
      {getSyncIcon()}
      
      <span className="hidden sm:inline">
        {!isOnline ? 'Offline' : `Sync: ${formatLastSync(lastSync)}`}
      </span>
      
      {syncStatus.userId && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleForceSync}
          disabled={isSyncing || !isOnline}
          className="h-6 px-2 text-xs"
        >
          {isSyncing ? 'Sincronizando...' : 'Sync'}
        </Button>
      )}
      
      {realTimeSync.isConnected() && (
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Real-time ativo" />
      )}
    </div>
  );
};

export default SyncStatus;