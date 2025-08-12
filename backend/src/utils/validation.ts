import { z } from 'zod';

// Schemas de validação
export const userRegistrationSchema = z.object({
  email: z.string().email('Email inválido').max(255),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres').max(128),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
});

export const userLoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const transactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  description: z.string().min(1, 'Descrição é obrigatória').max(255),
  amount: z.number().positive('Valor deve ser positivo').max(999999999),
  type: z.enum(['entrada', 'saida', 'diario']),
  category: z.string().max(100).optional(),
  isRecurring: z.boolean().optional(),
  recurringId: z.string().optional(),
  source: z.string().max(50).optional(),
});

// Middleware de validação
export const validate = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      res.status(400).json({ error: 'Erro de validação' });
    }
  };
};