import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Wifi, WifiOff, RefreshCw, Check } from 'lucide-react';
import { syncService } from '../services/syncService';

const SyncStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      console.log('🔄 Forçando sincronização manual...');
      
      const localData = JSON.parse(localStorage.getItem('unifiedFinancialData') || '[]');
      await syncService.syncAllTransactions(localData);
      
      setLastSync(Date.now());
      window.dispatchEvent(new Event('storage'));
      
      console.log('✅ Sincronização manual concluída');
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
    
    if (diff < 60000) return 'Agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
    return `${Math.floor(diff / 3600000)}h`;
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
      
      <span className="hidden sm:inline text-xs">
        {!isOnline ? 'Offline' : 
         isSyncing ? 'Sync...' :
         `${formatLastSync(lastSync)}`}
      </span>
      
      <Button
        size="sm"
        variant="ghost"
        onClick={handleForceSync}
        disabled={isSyncing}
        className="h-6 px-2 text-xs bg-blue-50 hover:bg-blue-100"
        title="Sincronizar"
      >
        🔄
      </Button>
    </div>
  );
};

export default SyncStatus;