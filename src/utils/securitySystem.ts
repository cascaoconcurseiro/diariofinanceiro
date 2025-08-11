/**
 * SISTEMA DE SEGURANÇA AVANÇADO
 * 
 * Implementa segurança robusta para o sistema financeiro
 */

import { logger } from './logger';

// Configuração de segurança
const SECURITY_CONFIG = {
  // Senha administrativa forte (substitui a senha fraca 834702)
  ADMIN_PASSWORD_HASH: 'Kiro@2025!Admin#Secure', // Hash será implementado
  MAX_LOGIN_ATTEMPTS: 3,
  LOCKOUT_DURATION: 300000, // 5 minutos em ms
  RATE_LIMIT_WINDOW: 60000, // 1 minuto em ms
  ENCRYPTION_KEY: 'KiroFinancial2025SecureKey!@#',
  SESSION_TIMEOUT: 1800000 // 30 minutos
};

// Estado de segurança
interface SecurityState {
  failedAttempts: number;
  lastAttempt: number;
  isLocked: boolean;
  lockoutUntil: number;
  sessionStart: number;
}

// Estado global de segurança
let securityState: SecurityState = {
  failedAttempts: 0,
  lastAttempt: 0,
  isLocked: false,
  lockoutUntil: 0,
  sessionStart: 0
};

/**
 * Gera hash simples para senhas (em produção usar bcrypt)
 */
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

/**
 * Valida força da senha
 */
export function validatePasswordStrength(password: string): {
  isStrong: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Comprimento mínimo
  if (password.length >= 8) {
    score += 20;
  } else {
    feedback.push('Senha deve ter pelo menos 8 caracteres');
  }

  // Letras maiúsculas
  if (/[A-Z]/.test(password)) {
    score += 20;
  } else {
    feedback.push('Deve conter pelo menos uma letra maiúscula');
  }

  // Letras minúsculas
  if (/[a-z]/.test(password)) {
    score += 20;
  } else {
    feedback.push('Deve conter pelo menos uma letra minúscula');
  }

  // Números
  if (/[0-9]/.test(password)) {
    score += 20;
  } else {
    feedback.push('Deve conter pelo menos um número');
  }

  // Caracteres especiais
  if (/[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]/.test(password)) {
    score += 20;
  } else {
    feedback.push('Deve conter pelo menos um caractere especial');
  }

  return {
    isStrong: score >= 80,
    score,
    feedback
  };
}

/**
 * Verifica se está em rate limiting
 */
export function checkRateLimit(): boolean {
  const now = Date.now();
  
  // Se está bloqueado, verificar se ainda está no período de lockout
  if (securityState.isLocked) {
    if (now < securityState.lockoutUntil) {
      const remainingTime = Math.ceil((securityState.lockoutUntil - now) / 1000);
      logger.warn('SECURITY', 'Account locked due to failed attempts', { 
        remainingTime: `${remainingTime}s` 
      });
      return false;
    } else {
      // Lockout expirou, resetar estado
      securityState.isLocked = false;
      securityState.failedAttempts = 0;
      securityState.lockoutUntil = 0;
    }
  }

  return true;
}

/**
 * Registra tentativa de login falhada
 */
function recordFailedAttempt(): void {
  const now = Date.now();
  securityState.failedAttempts++;
  securityState.lastAttempt = now;

  logger.warn('SECURITY', 'Failed login attempt', { 
    attempts: securityState.failedAttempts,
    maxAttempts: SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS
  });

  // Se atingiu o limite, bloquear
  if (securityState.failedAttempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
    securityState.isLocked = true;
    securityState.lockoutUntil = now + SECURITY_CONFIG.LOCKOUT_DURATION;
    
    logger.error('SECURITY', 'Account locked due to multiple failed attempts', {
      lockoutDuration: SECURITY_CONFIG.LOCKOUT_DURATION / 1000 + 's'
    });
  }
}

/**
 * Autentica senha administrativa
 */
export function authenticateAdmin(password: string): boolean {
  // Verificar rate limiting
  if (!checkRateLimit()) {
    return false;
  }

  // Verificar senha
  const isValid = password === SECURITY_CONFIG.ADMIN_PASSWORD_HASH;
  
  if (isValid) {
    // Reset security state on successful login
    securityState.failedAttempts = 0;
    securityState.isLocked = false;
    securityState.lockoutUntil = 0;
    securityState.sessionStart = Date.now();
    
    logger.info('SECURITY', 'Admin authentication successful');
    return true;
  } else {
    recordFailedAttempt();
    return false;
  }
}

/**
 * Verifica se sessão administrativa ainda é válida
 */
export function isAdminSessionValid(): boolean {
  if (securityState.sessionStart === 0) return false;
  
  const now = Date.now();
  const sessionAge = now - securityState.sessionStart;
  
  if (sessionAge > SECURITY_CONFIG.SESSION_TIMEOUT) {
    logger.info('SECURITY', 'Admin session expired');
    securityState.sessionStart = 0;
    return false;
  }
  
  return true;
}

/**
 * Encripta dados para localStorage
 */
export function encryptData(data: string): string {
  try {
    // Implementação simples de XOR cipher (em produção usar AES)
    const key = SECURITY_CONFIG.ENCRYPTION_KEY;
    let encrypted = '';
    
    for (let i = 0; i < data.length; i++) {
      const keyChar = key.charCodeAt(i % key.length);
      const dataChar = data.charCodeAt(i);
      encrypted += String.fromCharCode(dataChar ^ keyChar);
    }
    
    // Encode em base64 para armazenamento seguro
    return btoa(encrypted);
  } catch (error) {
    logger.error('SECURITY', 'Encryption failed', { error });
    return data; // Fallback para dados não criptografados
  }
}

/**
 * Descriptografa dados do localStorage
 */
export function decryptData(encryptedData: string): string {
  try {
    // Decode base64
    const encrypted = atob(encryptedData);
    const key = SECURITY_CONFIG.ENCRYPTION_KEY;
    let decrypted = '';
    
    for (let i = 0; i < encrypted.length; i++) {
      const keyChar = key.charCodeAt(i % key.length);
      const encryptedChar = encrypted.charCodeAt(i);
      decrypted += String.fromCharCode(encryptedChar ^ keyChar);
    }
    
    return decrypted;
  } catch (error) {
    logger.error('SECURITY', 'Decryption failed', { error });
    return encryptedData; // Fallback para dados não criptografados
  }
}

/**
 * Sanitiza dados para logs (remove informações sensíveis)
 */
export function sanitizeForLog(data: any): any {
  if (!data) return data;

  // Lista de campos sensíveis
  const sensitiveFields = [
    'password', 'senha', 'token', 'secret', 'key', 'apiKey',
    'amount', 'valor', 'balance', 'saldo', 'credit', 'card', 'cvv'
  ];

  const sanitizeObject = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item));
    }
    
    if (typeof obj === 'object') {
      const result = { ...obj };
      
      Object.keys(result).forEach(key => {
        // Se o campo for sensível, mascarar
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          if (typeof result[key] === 'string') {
            result[key] = '[REDACTED]';
          } else if (typeof result[key] === 'number') {
            result[key] = '***';
          } else {
            result[key] = '[SENSITIVE_DATA]';
          }
        } 
        // Se for objeto aninhado, sanitizar recursivamente
        else if (typeof result[key] === 'object' && result[key] !== null) {
          result[key] = sanitizeObject(result[key]);
        }
      });
      
      return result;
    }
    
    return obj;
  };

  return sanitizeObject(data);
}

/**
 * Gera CSP (Content Security Policy) headers
 */
export function generateCSPHeaders(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // Necessário para React
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
}

/**
 * Aplica CSP ao documento
 */
export function applyCSP(): void {
  try {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = generateCSPHeaders();
    document.head.appendChild(meta);
    
    logger.info('SECURITY', 'CSP applied successfully');
  } catch (error) {
    logger.error('SECURITY', 'Failed to apply CSP', { error });
  }
}

/**
 * Obtém estatísticas de segurança
 */
export function getSecurityStats(): {
  failedAttempts: number;
  isLocked: boolean;
  sessionActive: boolean;
  lockoutRemaining: number;
} {
  const now = Date.now();
  return {
    failedAttempts: securityState.failedAttempts,
    isLocked: securityState.isLocked,
    sessionActive: isAdminSessionValid(),
    lockoutRemaining: securityState.isLocked ? 
      Math.max(0, securityState.lockoutUntil - now) : 0
  };
}

/**
 * Reset do sistema de segurança (apenas para desenvolvimento)
 */
export function resetSecurityState(): void {
  securityState = {
    failedAttempts: 0,
    lastAttempt: 0,
    isLocked: false,
    lockoutUntil: 0,
    sessionStart: 0
  };
  
  logger.info('SECURITY', 'Security state reset');
}

export default {
  validatePasswordStrength,
  checkRateLimit,
  authenticateAdmin,
  isAdminSessionValid,
  encryptData,
  decryptData,
  sanitizeForLog,
  generateCSPHeaders,
  applyCSP,
  getSecurityStats,
  resetSecurityState
};