import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Wifi } from 'lucide-react';

const SyncNotification: React.FC = () => {
  const [notification, setNotification] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
    show: boolean;
  }>({ type: 'info', message: '', show: false });

  useEffect(() => {
    // Escutar eventos de sincronização
    const handleStorageChange = () => {
      setNotification({
        type: 'success',
        message: 'Dados sincronizados entre dispositivos',
        show: true
      });

      // Ocultar após 3 segundos
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);
    };

    // Escutar mudanças no localStorage
    window.addEventListener('storage', handleStorageChange);

    // Escutar eventos customizados de sync
    const handleSyncEvent = (event: any) => {
      const { type, message } = event.detail;
      setNotification({
        type,
        message,
        show: true
      });

      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);
    };

    window.addEventListener('syncNotification', handleSyncEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('syncNotification', handleSyncEvent);
    };
  }, []);

  if (!notification.show) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Wifi className="w-4 h-4 text-blue-500" />;
    }
  };

  const getColors = () => {
    switch (notification.type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 p-3 rounded-lg border shadow-lg ${getColors()} animate-in slide-in-from-right duration-300`}>
      <div className="flex items-center gap-2">
        {getIcon()}
        <span className="text-sm font-medium">{notification.message}</span>
      </div>
    </div>
  );
};

export default SyncNotification;