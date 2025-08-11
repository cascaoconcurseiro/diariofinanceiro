/**
 * COMPONENTE DE STATUS DE SINCRONIZAÇÃO
 * 
 * Mostra se os dados estão sincronizados entre dispositivos
 */

import React, { useState, useEffect } from 'react';
import { useSyncService } from '../services/syncService';

const SyncStatus: React.FC = () => {
  const { getSyncStatus, forcSync } = useSyncService();
  const [status, setStatus] = useState(getSyncStatus());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getSyncStatus());
    }, 5000); // Atualizar a cada 5 segundos

    return () => clearInterval(interval);
  }, [getSyncStatus]);

  const handleForceSync = async () => {
    setIsLoading(true);
    try {
      await forcSync();
      setStatus(getSyncStatus());
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (isLoading) return '🔄';
    if (!status.online) return '📱';
    if (status.enabled) return '☁️';
    return '💾';
  };

  const getStatusText = () => {
    if (isLoading) return 'Sincronizando...';
    if (!status.online) return 'Offline - Dados locais';
    if (status.enabled) return 'Sincronizado na nuvem';
    return 'Apenas local';
  };

  const getStatusColor = () => {
    if (isLoading) return 'text-blue-600';
    if (!status.online) return 'text-orange-600';
    if (status.enabled) return 'text-green-600';
    return 'text-gray-600';
  };

  return (
    <div className="flex items-center space-x-2 text-sm">
      <span className="text-lg">{getStatusIcon()}</span>
      <span className={getStatusColor()}>{getStatusText()}</span>
      
      {status.lastSync && (
        <span className="text-xs text-gray-500">
          Última sync: {new Date(status.lastSync).toLocaleTimeString()}
        </span>
      )}

      {status.online && status.enabled && (
        <button
          onClick={handleForceSync}
          disabled={isLoading}
          className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
        >
          {isLoading ? '⏳' : '🔄'} Sync
        </button>
      )}
    </div>
  );
};

export default SyncStatus;