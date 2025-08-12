// Gerenciamento de sessão com expiração
interface SessionData {
  userId: string;
  email: string;
  name: string;
  expiresAt: number;
  createdAt: number;
}

class SessionManager {
  private readonly SESSION_KEY = 'user_session';
  private readonly SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias

  createSession(user: { id: string; email: string; name: string }): string {
    const now = Date.now();
    const sessionData: SessionData = {
      userId: user.id,
      email: user.email,
      name: user.name,
      expiresAt: now + this.SESSION_DURATION,
      createdAt: now
    };

    const token = `session_${now}_${Math.random().toString(36).substring(2)}`;
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
    localStorage.setItem('token', token);
    
    return token;
  }

  getSession(): SessionData | null {
    try {
      const sessionStr = localStorage.getItem(this.SESSION_KEY);
      if (!sessionStr) return null;

      const session: SessionData = JSON.parse(sessionStr);
      
      // Verificar expiração
      if (Date.now() > session.expiresAt) {
        this.clearSession();
        return null;
      }

      return session;
    } catch {
      this.clearSession();
      return null;
    }
  }

  isValid(): boolean {
    return this.getSession() !== null;
  }

  clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
  }

  getRemainingTime(): number {
    const session = this.getSession();
    if (!session) return 0;
    
    return Math.max(0, session.expiresAt - Date.now());
  }
}

export const sessionManager = new SessionManager();