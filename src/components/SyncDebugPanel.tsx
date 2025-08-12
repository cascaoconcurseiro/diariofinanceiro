import React, { useState, useEffect } from 'react';
import { syncService } from '../services/syncService';

export const SyncDebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>({});
  const [cloudData, setCloudData] = useState<any[]>([]);
  const [localData, setLocalData] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      updateStatus();
      const interval = setInterval(updateStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const updateStatus = async () => {
    const status = syncService.getSyncStatus();
    setSyncStatus(status);
    
    const cloud = await syncService.fetchTransactions();
    setCloudData(cloud);
    
    const local = JSON.parse(localStorage.getItem('unifiedFinancialData') || '[]');
    setLocalData(local);
  };

  const forceSync = async () => {
    await syncService.forceSync();
    updateStatus();
  };

  const clearCloud = async () => {
    if (confirm('Limpar dados da nuvem?')) {
      await syncService.syncTransactions([]);
      updateStatus();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg z-50"
        title="Debug Sync"
      >
        🔄
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Debug Sincronização</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold mb-2">Status</h3>
            <div className="text-sm space-y-1">
              <div>User ID: {syncStatus.userId || 'N/A'}</div>
              <div>Device ID: {syncStatus.deviceId?.substring(0, 20)}...</div>
              <div>Last Sync: {syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleString() : 'Never'}</div>
              <div>Online: {syncStatus.isOnline ? '✅' : '❌'}</div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold mb-2">Contadores</h3>
            <div className="text-sm space-y-1">
              <div>Local: {localData.length} transações</div>
              <div>Nuvem: {cloudData.length} transações</div>
              <div>Diferença: {Math.abs(localData.length - cloudData.length)}</div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={forceSync}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Forçar Sync
          </button>
          <button
            onClick={clearCloud}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Limpar Nuvem
          </button>
          <button
            onClick={updateStatus}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Atualizar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Dados Locais ({localData.length})</h3>
            <div className="bg-gray-100 p-2 rounded text-xs max-h-40 overflow-y-auto">
              {localData.slice(0, 5).map(t => (
                <div key={t.id} className="mb-1">
                  {t.date} - {t.description} - R$ {t.amount}
                </div>
              ))}
              {localData.length > 5 && <div>... e mais {localData.length - 5}</div>}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Dados da Nuvem ({cloudData.length})</h3>
            <div className="bg-gray-100 p-2 rounded text-xs max-h-40 overflow-y-auto">
              {cloudData.slice(0, 5).map(t => (
                <div key={t.id} className="mb-1">
                  {t.date} - {t.description} - R$ {t.amount}
                </div>
              ))}
              {cloudData.length > 5 && <div>... e mais {cloudData.length - 5}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};