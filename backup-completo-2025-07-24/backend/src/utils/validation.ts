import { z } from 'zod';
import { passwordUtils } from '@/utils/password';

// Schema para registro de usuário
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços')
    .transform(name => name.trim()),
  
  email: z
    .string()
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres')
    .transform(email => email.toLowerCase().trim()),
  
  password: z
    .string()
    .refine(
      (password) => passwordUtils.validateStrength(password).isValid,
      (password) => ({
        message: passwordUtils.validateStrength(password).errors.join(', ')
      })
    )
});

// Schema para login
export const loginSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .transform(email => email.toLowerCase().trim()),
  
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
});

// Schema para refresh token
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'Refresh token é obrigatório')
});

// Schema para esqueci senha
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .transform(email => email.toLowerCase().trim())
});

// Schema para reset de senha
export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, 'Token é obrigatório'),
  
  password: z
    .string()
    .refine(
      (password) => passwordUtils.validateStrength(password).isValid,
      (password) => ({
        message: passwordUtils.validateStrength(password).errors.join(', ')
      })
    )
});

// Schema para mudança de senha
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Senha atual é obrigatória'),
  
  newPassword: z
    .string()
    .refine(
      (password) => passwordUtils.validateStrength(password).isValid,
      (password) => ({
        message: passwordUtils.validateStrength(password).errors.join(', ')
      })
    )
}).refine(
  (data) => data.currentPassword !== data.newPassword,
  {
    message: 'Nova senha deve ser diferente da senha atual',
    path: ['newPassword']
  }
);

// Schema para atualização de perfil
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços')
    .transform(name => name.trim())
    .optional(),
  
  email: z
    .string()
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres')
    .transform(email => email.toLowerCase().trim())
    .optional()
});

// Validador de ID (UUID)
export const idSchema = z.object({
  id: z
    .string()
    .uuid('ID inválido')
});

// Validador de paginação
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => val ? parseInt(val) : 1)
    .refine(val => val > 0, 'Página deve ser maior que 0'),
  
  limit: z
    .string()
    .optional()
    .transform(val => val ? parseInt(val) : 10)
    .refine(val => val > 0 && val <= 100, 'Limit deve estar entre 1 e 100')
});

// Função utilitária para validar dados
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw error;
    }
    throw new Error('Validation failed');
  }
};

// Middleware de validação para Express
export const validate = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      // Validar body, params e query conforme necessário
      if (req.body && Object.keys(req.body).length > 0) {
        req.body = schema.parse(req.body);
      }
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      
      next(error);
    }
  };
};

// Validador de email específico
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

// Validador de nome específico
export const isValidName = (name: string): boolean => {
  const nameRegex = /^[a-zA-ZÀ-ÿ\s]+$/;
  return nameRegex.test(name) && name.length >= 2 && name.length <= 100;
};

// Sanitizar entrada de texto
export const sanitizeText = (text: string): string => {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Múltiplos espaços para um
    .replace(/[<>]/g, ''); // Remover < e >
};

// Função para validar atualização de perfil
export const validateUpdateProfile = (data: any) => {
  try {
    const validatedData = updateProfileSchema.parse(data);
    return { isValid: true, data: validatedData, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        data: null,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return { isValid: false, data: null, errors: [{ field: 'general', message: 'Erro de validação' }] };
  }
};

// Função para validar mudança de senha
export const validateChangePassword = (data: any) => {
  try {
    const validatedData = changePasswordSchema.parse(data);
    return { isValid: true, data: validatedData, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        data: null,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return { isValid: false, data: null, errors: [{ field: 'general', message: 'Erro de validação' }] };
  }
};

// Schema para transação
export const transactionSchema = z.object({
  date: z
    .string()
    .refine(date => !isNaN(Date.parse(date)), 'Data inválida'),
  
  description: z
    .string()
    .min(1, 'Descrição é obrigatória')
    .max(255, 'Descrição deve ter no máximo 255 caracteres')
    .transform(desc => desc.trim()),
  
  amount: z
    .number()
    .positive('Valor deve ser positivo')
    .max(999999999.99, 'Valor muito alto'),
  
  type: z.enum(['ENTRADA', 'SAIDA', 'DIARIO'], {
    errorMap: () => ({ message: 'Tipo deve ser ENTRADA, SAIDA ou DIARIO' })
  }),
  
  category: z
    .string()
    .max(100, 'Categoria deve ter no máximo 100 caracteres')
    .transform(cat => cat.trim())
    .optional(),
  
  source: z.enum(['MANUAL', 'RECURRING', 'QUICK_ENTRY', 'IMPORT'], {
    errorMap: () => ({ message: 'Origem inválida' })
  }).optional()
});

// Schema para filtros de transação
export const transactionFiltersSchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => val ? parseInt(val) : 1)
    .refine(val => val > 0, 'Página deve ser maior que 0'),
  
  limit: z
    .string()
    .optional()
    .transform(val => val ? parseInt(val) : 20)
    .refine(val => val > 0 && val <= 100, 'Limit deve estar entre 1 e 100'),
  
  startDate: z
    .string()
    .optional()
    .refine(date => !date || !isNaN(Date.parse(date)), 'Data inicial inválida'),
  
  endDate: z
    .string()
    .optional()
    .refine(date => !date || !isNaN(Date.parse(date)), 'Data final inválida'),
  
  type: z.enum(['ENTRADA', 'SAIDA', 'DIARIO']).optional(),
  
  category: z
    .string()
    .max(100, 'Categoria deve ter no máximo 100 caracteres')
    .optional(),
  
  description: z
    .string()
    .max(255, 'Descrição deve ter no máximo 255 caracteres')
    .optional(),
  
  minAmount: z
    .string()
    .optional()
    .transform(val => val ? parseFloat(val) : undefined)
    .refine(val => val === undefined || val >= 0, 'Valor mínimo deve ser positivo'),
  
  maxAmount: z
    .string()
    .optional()
    .transform(val => val ? parseFloat(val) : undefined)
    .refine(val => val === undefined || val >= 0, 'Valor máximo deve ser positivo'),
  
  source: z.enum(['MANUAL', 'RECURRING', 'QUICK_ENTRY', 'IMPORT']).optional(),
  
  isRecurring: z
    .string()
    .optional()
    .transform(val => val === 'true' ? true : val === 'false' ? false : undefined)
});

// Função para validar dados de transação
export const validateTransactionData = (data: any, isPartial: boolean = false) => {
  try {
    const schema = isPartial ? transactionSchema.partial() : transactionSchema;
    const validatedData = schema.parse(data);
    return { isValid: true, data: validatedData, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        data: null,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return { isValid: false, data: null, errors: [{ field: 'general', message: 'Erro de validação' }] };
  }
};

// Função para validar filtros de transação
export const validateTransactionFilters = (data: any) => {
  try {
    const validatedData = transactionFiltersSchema.parse(data);
    return { isValid: true, data: validatedData, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        data: null,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return { isValid: false, data: null, errors: [{ field: 'general', message: 'Erro de validação' }] };
  }
};

// Schema para transação
export const transactionSchema = z.object({
  date: z
    .string()
    .or(z.date())
    .transform(val => typeof val === 'string' ? new Date(val) : val)
    .refine(date => !isNaN(date.getTime()), 'Data inválida'),
  
  description: z
    .string()
    .min(1, 'Descrição é obrigatória')
    .max(255, 'Descrição deve ter no máximo 255 caracteres')
    .transform(desc => desc.trim()),
  
  amount: z
    .number()
    .or(z.string().transform(val => parseFloat(val)))
    .refine(val => val > 0, 'Valor deve ser maior que zero')
    .refine(val => val <= 999999999.99, 'Valor muito alto'),
  
  type: z
    .enum(['ENTRADA', 'SAIDA', 'DIARIO'], {
      errorMap: () => ({ message: 'Tipo deve ser ENTRADA, SAIDA ou DIARIO' })
    }),
  
  category: z
    .string()
    .max(100, 'Categoria deve ter no máximo 100 caracteres')
    .optional()
    .transform(cat => cat?.trim()),
  
  isRecurring: z
    .boolean()
    .optional()
    .default(false),
  
  recurringId: z
    .string()
    .uuid('ID de recorrência inválido')
    .optional()
});

// Schema para atualização de transação
export const transactionUpdateSchema = transactionSchema.partial();

// Função para validar transação
export const validateTransaction = (data: any) => {
  try {
    const validatedData = transactionSchema.parse(data);
    return { isValid: true, data: validatedData, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        data: null,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return { isValid: false, data: null, errors: [{ field: 'general', message: 'Erro de validação' }] };
  }
};

// Função para validar atualização de transação
export const validateTransactionUpdate = (data: any) => {
  try {
    const validatedData = transactionUpdateSchema.parse(data);
    return { isValid: true, data: validatedData, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        data: null,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return { isValid: false, data: null, errors: [{ field: 'general', message: 'Erro de validação' }] };
  }
};

// Schema para transação recorrente
export const recurringTransactionSchema = z.object({
  description: z
    .string()
    .min(1, 'Descrição é obrigatória')
    .max(255, 'Descrição deve ter no máximo 255 caracteres')
    .transform(desc => desc.trim()),
  
  amount: z
    .number()
    .or(z.string().transform(val => parseFloat(val)))
    .refine(val => val > 0, 'Valor deve ser maior que zero')
    .refine(val => val <= 999999999.99, 'Valor muito alto'),
  
  type: z
    .enum(['ENTRADA', 'SAIDA'], {
      errorMap: () => ({ message: 'Tipo deve ser ENTRADA ou SAIDA' })
    }),
  
  dayOfMonth: z
    .number()
    .int('Dia do mês deve ser um número inteiro')
    .min(1, 'Dia do mês deve ser entre 1 e 31')
    .max(31, 'Dia do mês deve ser entre 1 e 31'),
  
  frequency: z
    .enum(['MONTHLY', 'FIXED_COUNT', 'MONTHLY_DURATION'], {
      errorMap: () => ({ message: 'Frequência inválida' })
    }),
  
  startDate: z
    .string()
    .or(z.date())
    .transform(val => typeof val === 'string' ? new Date(val) : val)
    .refine(date => !isNaN(date.getTime()), 'Data de início inválida'),
  
  endDate: z
    .string()
    .or(z.date())
    .transform(val => typeof val === 'string' ? new Date(val) : val)
    .refine(date => !isNaN(date.getTime()), 'Data de fim inválida')
    .optional(),
  
  remainingCount: z
    .number()
    .int('Contagem restante deve ser um número inteiro')
    .min(1, 'Contagem restante deve ser maior que zero')
    .optional(),
  
  remainingMonths: z
    .number()
    .int('Meses restantes deve ser um número inteiro')
    .min(1, 'Meses restantes deve ser maior que zero')
    .optional()
}).refine(
  (data) => {
    // Se frequência é FIXED_COUNT, remainingCount é obrigatório
    if (data.frequency === 'FIXED_COUNT' && !data.remainingCount) {
      return false;
    }
    
    // Se frequência é MONTHLY_DURATION, remainingMonths é obrigatório
    if (data.frequency === 'MONTHLY_DURATION' && !data.remainingMonths) {
      return false;
    }
    
    // Se endDate é fornecida, deve ser maior que startDate
    if (data.endDate && data.endDate <= data.startDate) {
      return false;
    }
    
    return true;
  },
  {
    message: 'Configuração de frequência inválida',
    path: ['frequency']
  }
);

// Schema para atualização de transação recorrente
export const recurringTransactionUpdateSchema = recurringTransactionSchema.partial();

// Função para validar transação recorrente
export const validateRecurringTransaction = (data: any) => {
  try {
    const validatedData = recurringTransactionSchema.parse(data);
    return { isValid: true, data: validatedData, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        data: null,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return { isValid: false, data: null, errors: [{ field: 'general', message: 'Erro de validação' }] };
  }
};

// Função para validar atualização de transação recorrente
export const validateRecurringTransactionUpdate = (data: any) => {
  try {
    const validatedData = recurringTransactionUpdateSchema.parse(data);
    return { isValid: true, data: validatedData, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        data: null,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return { isValid: false, data: null, errors: [{ field: 'general', message: 'Erro de validação' }] };
  }
};

// Schema para filtros de transação
export const transactionFiltersSchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => val ? parseInt(val) : 1)
    .refine(val => val > 0, 'Página deve ser maior que 0'),
  
  limit: z
    .string()
    .optional()
    .transform(val => val ? parseInt(val) : 20)
    .refine(val => val > 0 && val <= 100, 'Limit deve estar entre 1 e 100'),
  
  startDate: z
    .string()
    .optional()
    .refine(val => !val || !isNaN(new Date(val).getTime()), 'Data de início inválida'),
  
  endDate: z
    .string()
    .optional()
    .refine(val => !val || !isNaN(new Date(val).getTime()), 'Data de fim inválida'),
  
  type: z
    .enum(['ENTRADA', 'SAIDA', 'DIARIO'])
    .optional(),
  
  category: z
    .string()
    .max(100, 'Categoria deve ter no máximo 100 caracteres')
    .optional(),
  
  description: z
    .string()
    .max(255, 'Descrição deve ter no máximo 255 caracteres')
    .optional(),
  
  minAmount: z
    .string()
    .optional()
    .transform(val => val ? parseFloat(val) : undefined)
    .refine(val => val === undefined || val >= 0, 'Valor mínimo deve ser maior ou igual a zero'),
  
  maxAmount: z
    .string()
    .optional()
    .transform(val => val ? parseFloat(val) : undefined)
    .refine(val => val === undefined || val >= 0, 'Valor máximo deve ser maior ou igual a zero'),
  
  source: z
    .enum(['MANUAL', 'RECURRING', 'QUICK_ENTRY', 'IMPORT'])
    .optional(),
  
  isRecurring: z
    .string()
    .optional()
    .transform(val => val === 'true' ? true : val === 'false' ? false : undefined)
}).refine(
  (data) => {
    // Se ambos minAmount e maxAmount são fornecidos, minAmount deve ser <= maxAmount
    if (data.minAmount !== undefined && data.maxAmount !== undefined) {
      return data.minAmount <= data.maxAmount;
    }
    return true;
  },
  {
    message: 'Valor mínimo deve ser menor ou igual ao valor máximo',
    path: ['minAmount']
  }
).refine(
  (data) => {
    // Se ambas as datas são fornecidas, startDate deve ser <= endDate
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'Data de início deve ser menor ou igual à data de fim',
    path: ['startDate']
  }
);

// Função para validar dados de transação
export const validateTransactionData = (data: any, isUpdate: boolean = false) => {
  try {
    const schema = isUpdate ? transactionUpdateSchema : transactionSchema;
    const validatedData = schema.parse(data);
    return { isValid: true, data: validatedData, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        data: null,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return { isValid: false, data: null, errors: [{ field: 'general', message: 'Erro de validação' }] };
  }
};

// Função para validar filtros de transação
export const validateTransactionFilters = (data: any) => {
  try {
    const validatedData = transactionFiltersSchema.parse(data);
    return { isValid: true, data: validatedData, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        data: null,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return { isValid: false, data: null, errors: [{ field: 'general', message: 'Erro de validação' }] };
  }
};