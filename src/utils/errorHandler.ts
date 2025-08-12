// Sistema de tratamento de erros simplificado
export const getErrorLogs = (): any[] => {
  return [];
};

export const handleError = (error: any, context?: string): void => {
  console.error(`[${context || 'ERROR'}]`, error);
};