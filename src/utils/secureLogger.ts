// Logger seguro para prevenir Log Injection
class SecureLogger {
  private sanitizeLogInput(input: any): string {
    if (typeof input !== 'string') {
      input = JSON.stringify(input);
    }
    
    // Remover caracteres perigosos para logs
    return input
      .replace(/[\r\n\t]/g, ' ') // Remover quebras de linha
      .replace(/[<>]/g, '') // Remover tags HTML
      .replace(/javascript:/gi, '') // Remover javascript:
      .replace(/on\w+=/gi, '') // Remover event handlers
      .substring(0, 500); // Limitar tamanho
  }

  info(message: string, context?: any): void {
    const sanitizedMessage = this.sanitizeLogInput(message);
    const sanitizedContext = context ? this.sanitizeLogInput(context) : '';
    
    console.log(`[INFO] ${sanitizedMessage}`, sanitizedContext ? `Context: ${sanitizedContext}` : '');
  }

  warn(message: string, context?: any): void {
    const sanitizedMessage = this.sanitizeLogInput(message);
    const sanitizedContext = context ? this.sanitizeLogInput(context) : '';
    
    console.warn(`[WARN] ${sanitizedMessage}`, sanitizedContext ? `Context: ${sanitizedContext}` : '');
  }

  error(message: string, context?: any): void {
    const sanitizedMessage = this.sanitizeLogInput(message);
    const sanitizedContext = context ? this.sanitizeLogInput(context) : '';
    
    console.error(`[ERROR] ${sanitizedMessage}`, sanitizedContext ? `Context: ${sanitizedContext}` : '');
  }

  security(message: string, context?: any): void {
    const sanitizedMessage = this.sanitizeLogInput(message);
    const sanitizedContext = context ? this.sanitizeLogInput(context) : '';
    
    console.warn(`[SECURITY] ${sanitizedMessage}`, sanitizedContext ? `Context: ${sanitizedContext}` : '');
  }
}

export const secureLogger = new SecureLogger();