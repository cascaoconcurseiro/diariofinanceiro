import React from 'react';
import { Wifi, WifiOff, RefreshCw, Smartphone, Monitor } from 'lucide-react';
import { Button } from './ui/button';

interface SyncStatusProps {
  status: 'connected' | 'disconnected' | 'syncing';
  lastSync: Date | null;
  onForceSync: () => void;
  isConnected: boolean;
}

const SyncStatus: React.FC<SyncStatusProps> = ({ 
  status, 
  lastSync, 
  onForceSync, 
  isConnected 
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'syncing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <WifiOff className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Sincronizado';
      case 'syncing':
        return 'Sincronizando...';
      default:
        return 'Desconectado';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'syncing':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getStatusColor()}`}>
      {getStatusIcon()}
      
      <div className="flex flex-col">
        <span className="text-xs font-medium">{getStatusText()}</span>
        {lastSync && (
          <span className="text-xs opacity-75">
            {lastSync.toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 ml-2">
        <Smartphone className="w-3 h-3 opacity-60" />
        <Monitor className="w-3 h-3 opacity-60" />
      </div>

      {isConnected && (
        <Button
          onClick={onForceSync}
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          disabled={status === 'syncing'}
        >
          <RefreshCw className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
};

export default SyncStatus;