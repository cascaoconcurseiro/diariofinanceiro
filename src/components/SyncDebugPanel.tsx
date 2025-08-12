import React, { useState, useEffect } from 'react';

export const SyncDebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [localData, setLocalData] = useState<any[]>([]);

  useEffect(() => {
    const handleShowDebug = () => setIsOpen(true);
    window.addEventListener('showSyncDebug', handleShowDebug);
    return () => window.removeEventListener('showSyncDebug', handleShowDebug);
  }, []);

  const updateStatus = () => {
    const local = JSON.parse(localStorage.getItem('unifiedFinancialData') || '[]');
    setLocalData(local);
  };

  useEffect(() => {
    if (isOpen) {
      updateStatus();
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
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

        <div className="bg-gray-50 p-4 rounded mb-4">
          <h3 className="font-semibold mb-2">Dados Locais ({localData.length})</h3>
          <div className="bg-gray-100 p-2 rounded text-xs max-h-40 overflow-y-auto">
            {localData.slice(0, 10).map(t => (
              <div key={t.id} className="mb-1">
                {t.date} - {t.description} - R$ {t.amount}
              </div>
            ))}
            {localData.length > 10 && <div>... e mais {localData.length - 10}</div>}
          </div>
        </div>

        <button
          onClick={updateStatus}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Atualizar
        </button>
      </div>
    </div>
  );
};