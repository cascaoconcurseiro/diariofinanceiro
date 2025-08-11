import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { logger } from '@/utils/logger';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

export const passwordUtils = {
  // Hash da senha
  hash: async (password: string): Promise<string> => {
    try {
      const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      logger.error('Error hashing password:', error);
      throw new Error('Failed to hash password');
    }
  },

  // Verificar senha
  verify: async (password: string, hashedPassword: string): Promise<boolean> => {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      logger.error('Error verifying password:', error);
      throw new Error('Failed to verify password');
    }
  },

  // Validar força da senha
  validateStrength: (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Mínimo 8 caracteres
    if (password.length < 8) {
      errors.push('Senha deve ter pelo menos 8 caracteres');
    }

    // Máximo 128 caracteres
    if (password.length > 128) {
      errors.push('Senha deve ter no máximo 128 caracteres');
    }

    // Pelo menos uma letra minúscula
    if (!/[a-z]/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra minúscula');
    }

    // Pelo menos uma letra maiúscula
    if (!/[A-Z]/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra maiúscula');
    }

    // Pelo menos um número
    if (!/\d/.test(password)) {
      errors.push('Senha deve conter pelo menos um número');
    }

    // Pelo menos um caractere especial
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Senha deve conter pelo menos um caractere especial');
    }

    // Não pode conter espaços
    if (/\s/.test(password)) {
      errors.push('Senha não pode conter espaços');
    }

    // Verificar padrões comuns fracos
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /abc123/i,
      /admin/i,
      /letmein/i
    ];

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        errors.push('Senha contém padrões muito comuns');
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Gerar token de reset de senha
  generateResetToken: (): string => {
    return crypto.randomBytes(32).toString('hex');
  },

  // Hash do token de reset (para armazenar no banco)
  hashResetToken: (token: string): string => {
    return crypto.createHash('sha256').update(token).digest('hex');
  },

  // Gerar senha temporária
  generateTemporaryPassword: (length: number = 12): string => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Garantir pelo menos um de cada tipo
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // minúscula
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // maiúscula
    password += '0123456789'[Math.floor(Math.random() * 10)]; // número
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // especial
    
    // Preencher o resto
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Embaralhar
    return password.split('').sort(() => Math.random() - 0.5).join('');
  },

  // Verificar se senha foi comprometida (simulação - em produção usar APIs como HaveIBeenPwned)
  checkIfCompromised: async (password: string): Promise<boolean> => {
    // Lista básica de senhas comprometidas comuns
    const compromisedPasswords = [
      '123456',
      'password',
      '123456789',
      '12345678',
      '12345',
      '1234567',
      '1234567890',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      'letmein',
      'welcome',
      'monkey',
      'dragon'
    ];

    return compromisedPasswords.includes(password.toLowerCase());
  }
};

// Exportações individuais para compatibilidade
export const hashPassword = passwordUtils.hash;
export const comparePassword = passwordUtils.verify;
export const validatePassword = passwordUtils.validateStrength;