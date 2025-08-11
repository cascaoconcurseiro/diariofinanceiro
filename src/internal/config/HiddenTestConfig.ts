/**
 * CONFIGURAÇÃO OCULTA DO SISTEMA DE TESTES
 * Configurações diferentes para desenvolvimento e produção
 */

import { HiddenTestConfig } from '../types/TestTypes';

// Detectar ambiente automaticamente
const isDevelopment = process.env.NODE_ENV === 'development' || 
                     window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1';

// Configuração para desenvolvimento - logs detalhados
const DEV_CONFIG: HiddenTestConfig = {
  enabled: true,
  environment: 'development',
  testFrequency: {
    startup: true,
    onTransaction: true,
    periodic: 5, // A cada 5 minutos
    onNavigation: true
  },
  logging: {
    level: 'detailed',
    encryption: false, // Não criptografar em dev para debug
    retention: 7 // 7 dias
  },
  autoCorrection: {
    enabled: true,
    maxAttempts: 3,
    rollbackOnFailure: true
  },
  performance: {
    maxCpuUsage: 10, // 10% máximo
    maxMemoryUsage: 50, // 50MB máximo
    throttleThreshold: 5 // Throttle após 5% CPU
  }
};

// Configuração para produção - logs mínimos e criptografados
const PROD_CONFIG: HiddenTestConfig = {
  enabled: true,
  environment: 'production',
  testFrequency: {
    startup: true,
    onTransaction: true,
    periodic: 60, // A cada 1 hora
    onNavigation: false // Reduzir testes em produção
  },
  logging: {
    level: 'minimal',
    encryption: true, // Sempre criptografar em produção
    retention: 3 // 3 dias apenas
  },
  autoCorrection: {
    enabled: true,
    maxAttempts: 1, // Apenas 1 tentativa em produção
    rollbackOnFailure: true
  },
  performance: {
    maxCpuUsage: 3, // Máximo 3% em produção
    maxMemoryUsage: 20, // 20MB máximo
    throttleThreshold: 2 // Throttle mais agressivo
  }
};

// Exportar configuração baseada no ambiente
export const HIDDEN_TEST_CONFIG: HiddenTestConfig = isDevelopment ? DEV_CONFIG : PROD_CONFIG;

// Função para verificar se testes estão habilitados
export const isTestingEnabled = (): boolean => {
  try {
    // Verificar se há flag para desabilitar testes
    const disableTests = localStorage.getItem('__disable_hidden_tests');
    if (disableTests === 'true') return false;
    
    return HIDDEN_TEST_CONFIG.enabled;
  } catch {
    return false; // Se localStorage não disponível, desabilitar
  }
};

// Função para obter configuração atual
export const getTestConfig = (): HiddenTestConfig => {
  return { ...HIDDEN_TEST_CONFIG };
};

// Função para verificar se está em modo de desenvolvimento
export const isDevelopmentMode = (): boolean => {
  return isDevelopment;
};

// Chave secreta para criptografia (gerada dinamicamente)
export const getEncryptionKey = (): string => {
  const key = 'hidden_test_key_' + btoa(window.location.origin).slice(0, 16);
  return key;
};

// Função para logging interno (não aparece no console do usuário)
export const internalLog = (message: string, data?: any): void => {
  if (!isDevelopment) return; // Só em desenvolvimento
  
  try {
    // Usar um namespace oculto para logs
    const hiddenConsole = (window as any).__hiddenTestConsole;
    if (hiddenConsole) {
      hiddenConsole.log(`[HIDDEN_TEST] ${message}`, data);
    }
  } catch {
    // Silenciosamente ignorar erros de log
  }
};

// Inicializar console oculto apenas em desenvolvimento
if (isDevelopment && typeof window !== 'undefined') {
  (window as any).__hiddenTestConsole = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console)
  };
}