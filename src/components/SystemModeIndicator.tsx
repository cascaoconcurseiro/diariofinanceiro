/**
 * Indicador de Modo do Sistema
 * Mostra se está rodando em modo completo ou standalone
 */

import React from 'react';
import { useDockerDetection } from '../services/dockerDetectionService';

interface SystemModeIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export const SystemModeIndicator: React.FC<SystemModeIndicatorProps> = ({
  showDetails = false,
  className = ''
}) => {
  const { status, isStandalone, forceStandalone, attemptReconnection, refreshStatus } = useDockerDetection();

  const getModeIcon = () => {
    return isStandalone ? '🔧' : '🚀';
  };

  const getModeText = () => {
    return isStandalone ? 'Modo Standalone' : 'Sistema Completo';
  };

  const getModeColor = () => {
    return isStandalone ? '#ff9800' : '#4caf50';
  };

  const getStatusText = () => {
    if (!status) return 'Verificando...';
    
    if (isStandalone) {
      return 'Funcionando localmente';
    }
    
    return 'Conectado ao backend';
  };

  const handleModeToggle = async () => {
    if (isStandalone) {
      const success = await attemptReconnection();
      if (!success) {
        alert('Sistema completo não está disponível. Verifique se o Docker está rodando.');
      }
    } else {
      forceStandalone();
    }
  };

  if (!showDetails) {
    return (
      <div 
        className={`system-mode-indicator ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 8px',
          borderRadius: '4px',
          backgroundColor: getModeColor() + '20',
          color: getModeColor(),
          fontSize: '12px',
          fontWeight: 'bold'
        }}
      >
        <span>{getModeIcon()}</span>
        <span>{getModeText()}</span>
      </div>
    );
  }

  return (
    <div 
      className={`system-mode-details ${className}`}
      style={{
        padding: '16px',
        border: `2px solid ${getModeColor()}`,
        borderRadius: '8px',
        backgroundColor: getModeColor() + '10',
        marginBottom: '16px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>{getModeIcon()}</span>
          <div>
            <h3 style={{ margin: 0, color: getModeColor() }}>{getModeText()}</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>{getStatusText()}</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={refreshStatus}
            style={{
              padding: '6px 12px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#2196f3',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            🔄 Atualizar
          </button>
          
          <button
            onClick={handleModeToggle}
            style={{
              padding: '6px 12px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: isStandalone ? '#4caf50' : '#ff9800',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {isStandalone ? '🚀 Tentar Sistema Completo' : '🔧 Usar Standalone'}
          </button>
        </div>
      </div>

      {status && (
        <div style={{ fontSize: '12px', color: '#666' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
            <div>
              <strong>Docker Instalado:</strong> {status.dockerAvailable ? '✅ Sim' : '❌ Não'}
            </div>
            <div>
              <strong>Docker Rodando:</strong> {status.dockerRunning ? '✅ Sim' : '❌ Não'}
            </div>
            <div>
              <strong>Backend Saudável:</strong> {status.backendHealthy ? '✅ Sim' : '❌ Não'}
            </div>
            <div>
              <strong>Última Verificação:</strong> {status.lastCheck.toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {isStandalone && (
        <div 
          style={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <strong>ℹ️ Modo Standalone Ativo</strong>
          <p style={{ margin: '4px 0 0 0' }}>
            Você está usando uma versão local completa do sistema. Todos os dados são salvos no seu navegador.
            Para usar o sistema completo com banco de dados, inicie o Docker e clique em "Tentar Sistema Completo".
          </p>
        </div>
      )}
    </div>
  );
};

export default SystemModeIndicator;