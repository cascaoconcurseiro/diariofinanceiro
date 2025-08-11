/**
 * SISTEMA DE VALIDAÇÃO E SEGURANÇA AVANÇADO
 * 
 * Implementa validações rigorosas e proteções contra vulnerabilidades
 */

// Constantes de segurança
const SECURITY_LIMITS = {
  MAX_STRING_LENGTH: 1000,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_AMOUNT: 999999999.99,
  MIN_AMOUNT: -999999999.99,
  MAX_TRANSACTIONS_PER_DAY: 100,
  MAX_TOTAL_TRANSACTIONS: 10000,
  ADMIN_PASSWORD_MIN_LENGTH: 6,
  SESSION_TIMEOUT: 10 * 60 * 1000, // 10 minutos
};

// Regex patterns para validação
const SECURITY_PATTERNS = {
  SAFE_TEXT: /^[a-zA-Z0-9\s\-.,!?áéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ]*$/,
  CURRENCY: /^-?\d{1,10}([.,]\d{1,2})?$/,
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  NUMERIC: /^-?\d+([.,]\d+)?$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]*$/,
};

/**
 * Interface para resultado de validação
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: any;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Sanitiza strings removendo caracteres perigosos
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .slice(0, SECURITY_LIMITS.MAX_STRING_LENGTH)
    .replace(/[<>\"'&]/g, '') // Remove caracteres HTML perigosos
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/script/gi, '') // Remove script tags
    .replace(/eval\(/gi, '') // Remove eval calls
    .replace(/expression\(/gi, ''); // Remove CSS expressions
}

/**
 * Valida e sanitiza descrição de transação
 */
export function validateDescription(description: string): ValidationResult {
  const errors: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

  // Verificar tipo
  if (typeof description !== 'string') {
    errors.push('Descrição deve ser uma string');
    riskLevel = 'high';
  }

  // Verificar comprimento
  if (description.length > SECURITY_LIMITS.MAX_DESCRIPTION_LENGTH) {
    errors.push(`Descrição muito longa (máximo ${SECURITY_LIMITS.MAX_DESCRIPTION_LENGTH} caracteres)`);
    riskLevel = 'medium';
  }

  // Verificar caracteres perigosos
  if (description.includes('<') || description.includes('>')) {
    errors.push('Descrição contém caracteres HTML não permitidos');
    riskLevel = 'high';
  }

  if (description.toLowerCase().includes('script')) {
    errors.push('Descrição contém conteúdo potencialmente perigoso');
    riskLevel = 'critical';
  }

  // Sanitizar
  const sanitizedValue = sanitizeString(description);

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue,
    riskLevel
  };
}

/**
 * Valida valor monetário
 */
export function validateAmount(amount: number | string): ValidationResult {
  const errors: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let numericAmount: number;

  // Converter para número se for string
  if (typeof amount === 'string') {
    const cleanAmount = amount.replace(',', '.');
    numericAmount = parseFloat(cleanAmount);
  } else {
    numericAmount = amount;
  }

  // Verificar se é um número válido
  if (isNaN(numericAmount) || !isFinite(numericAmount)) {
    errors.push('Valor deve ser um número válido');
    riskLevel = 'high';
    return { isValid: false, errors, riskLevel };
  }

  // Verificar limites
  if (numericAmount > SECURITY_LIMITS.MAX_AMOUNT) {
    errors.push(`Valor muito alto (máximo ${SECURITY_LIMITS.MAX_AMOUNT})`);
    riskLevel = 'high';
  }

  if (numericAmount < SECURITY_LIMITS.MIN_AMOUNT) {
    errors.push(`Valor muito baixo (mínimo ${SECURITY_LIMITS.MIN_AMOUNT})`);
    riskLevel = 'high';
  }

  // Verificar precisão decimal
  const decimalPlaces = (numericAmount.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    errors.push('Valor não pode ter mais de 2 casas decimais');
    riskLevel = 'medium';
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: Math.round(numericAmount * 100) / 100,
    riskLevel
  };
}

/**
 * Valida data
 */
export function validateDate(date: string): ValidationResult {
  const errors: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

  // Verificar formato
  if (!SECURITY_PATTERNS.DATE.test(date)) {
    errors.push('Data deve estar no formato YYYY-MM-DD');
    riskLevel = 'high';
  }

  // Verificar se é uma data válida
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    errors.push('Data inválida');
    riskLevel = 'high';
  }

  // Verificar se não é muito no futuro (mais de 10 anos)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 10);
  if (dateObj > maxDate) {
    errors.push('Data muito distante no futuro');
    riskLevel = 'medium';
  }

  // Verificar se não é muito no passado (mais de 50 anos)
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 50);
  if (dateObj < minDate) {
    errors.push('Data muito distante no passado');
    riskLevel = 'medium';
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: date,
    riskLevel
  };
}

/**
 * Valida tipo de transação
 */
export function validateTransactionType(type: string): ValidationResult {
  const errors: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

  const validTypes = ['entrada', 'saida', 'diario'];
  
  if (!validTypes.includes(type)) {
    errors.push('Tipo de transação inválido');
    riskLevel = 'high';
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: type,
    riskLevel
  };
}

/**
 * Valida transação completa
 */
export function validateTransaction(transaction: any): ValidationResult {
  const errors: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

  // Validar campos obrigatórios
  if (!transaction.date) {
    errors.push('Data é obrigatória');
    riskLevel = 'high';
  }

  if (!transaction.description) {
    errors.push('Descrição é obrigatória');
    riskLevel = 'high';
  }

  if (transaction.amount === undefined || transaction.amount === null) {
    errors.push('Valor é obrigatório');
    riskLevel = 'high';
  }

  if (!transaction.type) {
    errors.push('Tipo é obrigatório');
    riskLevel = 'high';
  }

  // Validar cada campo
  const dateValidation = validateDate(transaction.date);
  const descValidation = validateDescription(transaction.description);
  const amountValidation = validateAmount(transaction.amount);
  const typeValidation = validateTransactionType(transaction.type);

  // Combinar erros
  errors.push(...dateValidation.errors);
  errors.push(...descValidation.errors);
  errors.push(...amountValidation.errors);
  errors.push(...typeValidation.errors);

  // Determinar nível de risco mais alto
  const riskLevels = [dateValidation.riskLevel, descValidation.riskLevel, amountValidation.riskLevel, typeValidation.riskLevel];
  if (riskLevels.includes('critical')) riskLevel = 'critical';
  else if (riskLevels.includes('high')) riskLevel = 'high';
  else if (riskLevels.includes('medium')) riskLevel = 'medium';

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: {
      date: dateValidation.sanitizedValue,
      description: descValidation.sanitizedValue,
      amount: amountValidation.sanitizedValue,
      type: typeValidation.sanitizedValue,
      id: transaction.id || `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      isRecurring: Boolean(transaction.isRecurring),
      source: transaction.source || 'manual',
      createdAt: transaction.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    riskLevel
  };
}

/**
 * Valida dados do localStorage
 */
export function validateLocalStorageData(data: string): ValidationResult {
  const errors: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

  try {
    // Verificar se é JSON válido
    const parsed = JSON.parse(data);

    // Verificar se é array
    if (!Array.isArray(parsed)) {
      errors.push('Dados devem ser um array');
      riskLevel = 'high';
    }

    // Verificar quantidade de transações
    if (parsed.length > SECURITY_LIMITS.MAX_TOTAL_TRANSACTIONS) {
      errors.push(`Muitas transações (máximo ${SECURITY_LIMITS.MAX_TOTAL_TRANSACTIONS})`);
      riskLevel = 'medium';
    }

    // Validar cada transação
    const validTransactions = [];
    for (const transaction of parsed) {
      const validation = validateTransaction(transaction);
      if (validation.isValid) {
        validTransactions.push(validation.sanitizedValue);
      } else {
        console.warn('Transação inválida removida:', validation.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: validTransactions,
      riskLevel
    };

  } catch (error) {
    errors.push('Dados não são JSON válido');
    riskLevel = 'critical';
  }

  return {
    isValid: false,
    errors,
    riskLevel
  };
}

/**
 * Valida senha administrativa
 */
export function validateAdminPassword(password: string): ValidationResult {
  const errors: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

  if (typeof password !== 'string') {
    errors.push('Senha deve ser uma string');
    riskLevel = 'high';
  }

  if (password.length < SECURITY_LIMITS.ADMIN_PASSWORD_MIN_LENGTH) {
    errors.push(`Senha muito curta (mínimo ${SECURITY_LIMITS.ADMIN_PASSWORD_MIN_LENGTH} caracteres)`);
    riskLevel = 'high';
  }

  if (!SECURITY_PATTERNS.ALPHANUMERIC.test(password)) {
    errors.push('Senha contém caracteres não permitidos');
    riskLevel = 'high';
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: password,
    riskLevel
  };
}

/**
 * Executa auditoria completa de segurança
 */
export function executeSecurityAudit(): {
  timestamp: string;
  vulnerabilities: any[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
} {
  const vulnerabilities = [];
  const recommendations = [];
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

  // Verificar localStorage
  try {
    const data = localStorage.getItem('unifiedFinancialData');
    if (data) {
      const validation = validateLocalStorageData(data);
      if (!validation.isValid) {
        vulnerabilities.push({
          type: 'localStorage_corruption',
          severity: validation.riskLevel,
          description: 'Dados corrompidos no localStorage',
          errors: validation.errors
        });
      }
    }
  } catch (error) {
    vulnerabilities.push({
      type: 'localStorage_access_error',
      severity: 'high',
      description: 'Erro ao acessar localStorage',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }

  // Verificar CSP (Content Security Policy)
  const metaTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
  if (metaTags.length === 0) {
    vulnerabilities.push({
      type: 'missing_csp',
      severity: 'medium',
      description: 'Content Security Policy não configurado'
    });
    recommendations.push('Implementar Content Security Policy');
  }

  // Verificar HTTPS
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    vulnerabilities.push({
      type: 'insecure_connection',
      severity: 'high',
      description: 'Conexão não segura (HTTP)'
    });
    recommendations.push('Usar HTTPS em produção');
  }

  // Verificar console logs em produção
  if (process.env.NODE_ENV === 'production') {
    const originalLog = console.log;
    let logCount = 0;
    console.log = (...args) => {
      logCount++;
      originalLog(...args);
    };

    if (logCount > 0) {
      vulnerabilities.push({
        type: 'console_logs_in_production',
        severity: 'low',
        description: 'Console logs ativos em produção'
      });
      recommendations.push('Remover console logs em produção');
    }
  }

  // Determinar nível de risco geral
  const severities = vulnerabilities.map(v => v.severity);
  if (severities.includes('critical')) riskLevel = 'critical';
  else if (severities.includes('high')) riskLevel = 'high';
  else if (severities.includes('medium')) riskLevel = 'medium';

  // Recomendações gerais
  recommendations.push(
    'Validar todos os inputs do usuário',
    'Implementar rate limiting para ações administrativas',
    'Monitorar tentativas de acesso não autorizado',
    'Fazer backup regular dos dados',
    'Implementar logs de auditoria'
  );

  return {
    timestamp: new Date().toISOString(),
    vulnerabilities,
    riskLevel,
    recommendations
  };
}

/**
 * Limpa dados sensíveis da memória
 */
export function secureCleanup(): void {
  // Limpar variáveis sensíveis
  if (typeof window !== 'undefined') {
    // Limpar possíveis referências em window
    const sensitiveKeys = ['password', 'token', 'auth', 'admin'];
    sensitiveKeys.forEach(key => {
      if ((window as any)[key]) {
        delete (window as any)[key];
      }
    });
  }

  // Forçar garbage collection se disponível
  if (typeof window !== 'undefined' && (window as any).gc) {
    (window as any).gc();
  }
}

/**
 * Gera hash simples para verificação de integridade
 */
export function generateSimpleHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}