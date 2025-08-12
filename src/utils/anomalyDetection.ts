// Detecção de anomalias e comportamentos suspeitos
interface UserBehavior {
  userId: string;
  loginTimes: number[];
  transactionAmounts: number[];
  sessionDurations: number[];
  ipAddresses: string[];
  lastActivity: number;
}

class AnomalyDetection {
  private readonly BEHAVIOR_KEY = 'user_behavior';

  // Registrar comportamento do usuário
  recordBehavior(userId: string, type: 'login' | 'transaction' | 'session_end', value?: number): void {
    try {
      const behaviors = this.getBehaviors();
      let userBehavior = behaviors.find(b => b.userId === userId);

      if (!userBehavior) {
        userBehavior = {
          userId,
          loginTimes: [],
          transactionAmounts: [],
          sessionDurations: [],
          ipAddresses: [],
          lastActivity: Date.now()
        };
        behaviors.push(userBehavior);
      }

      const now = Date.now();
      userBehavior.lastActivity = now;

      switch (type) {
        case 'login':
          userBehavior.loginTimes.push(now);
          // Manter apenas últimos 50 logins
          if (userBehavior.loginTimes.length > 50) {
            userBehavior.loginTimes.splice(0, userBehavior.loginTimes.length - 50);
          }
          break;

        case 'transaction':
          if (value !== undefined) {
            userBehavior.transactionAmounts.push(value);
            // Manter apenas últimas 100 transações
            if (userBehavior.transactionAmounts.length > 100) {
              userBehavior.transactionAmounts.splice(0, userBehavior.transactionAmounts.length - 100);
            }
          }
          break;

        case 'session_end':
          if (value !== undefined) {
            userBehavior.sessionDurations.push(value);
            // Manter apenas últimas 20 sessões
            if (userBehavior.sessionDurations.length > 20) {
              userBehavior.sessionDurations.splice(0, userBehavior.sessionDurations.length - 20);
            }
          }
          break;
      }

      localStorage.setItem(this.BEHAVIOR_KEY, JSON.stringify(behaviors));
    } catch (error) {
      console.error('Erro ao registrar comportamento:', error);
    }
  }

  // Detectar anomalias
  detectAnomalies(userId: string): string[] {
    const anomalies: string[] = [];
    const behavior = this.getUserBehavior(userId);

    if (!behavior) return anomalies;

    // Detectar logins em horários incomuns
    if (this.detectUnusualLoginTimes(behavior)) {
      anomalies.push('Login em horário incomum detectado');
    }

    // Detectar transações com valores anômalos
    if (this.detectUnusualTransactionAmounts(behavior)) {
      anomalies.push('Transação com valor anômalo detectada');
    }

    // Detectar sessões muito longas ou muito curtas
    if (this.detectUnusualSessionDurations(behavior)) {
      anomalies.push('Duração de sessão anômala detectada');
    }

    return anomalies;
  }

  private getBehaviors(): UserBehavior[] {
    try {
      const data = localStorage.getItem(this.BEHAVIOR_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private getUserBehavior(userId: string): UserBehavior | null {
    return this.getBehaviors().find(b => b.userId === userId) || null;
  }

  private detectUnusualLoginTimes(behavior: UserBehavior): boolean {
    if (behavior.loginTimes.length < 5) return false;

    const now = new Date();
    const currentHour = now.getHours();

    // Verificar se login atual está fora do padrão usual (2-22h)
    return currentHour < 2 || currentHour > 22;
  }

  private detectUnusualTransactionAmounts(behavior: UserBehavior): boolean {
    if (behavior.transactionAmounts.length < 10) return false;

    const amounts = behavior.transactionAmounts;
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const lastAmount = amounts[amounts.length - 1];

    // Detectar se última transação é 10x maior que a média
    return lastAmount > avg * 10;
  }

  private detectUnusualSessionDurations(behavior: UserBehavior): boolean {
    if (behavior.sessionDurations.length < 5) return false;

    const durations = behavior.sessionDurations;
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const lastDuration = durations[durations.length - 1];

    // Detectar sessões muito longas (>5x média) ou muito curtas (<10% média)
    return lastDuration > avg * 5 || lastDuration < avg * 0.1;
  }
}

export const anomalyDetection = new AnomalyDetection();