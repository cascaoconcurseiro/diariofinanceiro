import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Shield, Eye, EyeOff, Trash2, CheckCircle, AlertTriangle, Settings, X } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { logger } from '../utils/performanceLogger';
import { 
  authenticateAdmin, 
  isAdminSessionValid, 
  checkRateLimit, 
  getSecurityStats,
  validatePasswordStrength 
} from '../utils/securitySystem';

interface AdminPanelProps {
  onClearData: () => void;
  onSystemCheck: () => void;
}

const AUTO_COLLAPSE_TIMEOUT = 30 * 1000; // 30 segundos

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClearData, onSystemCheck }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState<NodeJS.Timeout | null>(null);
  const [collapseTimeout, setCollapseTimeout] = useState<NodeJS.Timeout | null>(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeout, setBlockTimeout] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Auto-logout por inatividade
  useEffect(() => {
    if (isAuthenticated) {
      const timeout = setTimeout(() => {
        handleLogout();
        toast({
          title: "Sessão Expirada",
          description: "Sessão administrativa expirada por inatividade",
          variant: "destructive"
        });
      }, SESSION_TIMEOUT);
      
      setSessionTimeout(timeout);
      
      return () => {
        if (timeout) clearTimeout(timeout);
      };
    }
  }, [isAuthenticated, lastActivity]);

  // Auto-collapse quando expandido mas não autenticado
  useEffect(() => {
    if (isExpanded && !isAuthenticated) {
      const timeout = setTimeout(() => {
        setIsExpanded(false);
        logger.debug('Admin panel auto-collapsed due to inactivity');
      }, AUTO_COLLAPSE_TIMEOUT);
      
      setCollapseTimeout(timeout);
      
      return () => {
        if (timeout) clearTimeout(timeout);
      };
    } else {
      if (collapseTimeout) {
        clearTimeout(collapseTimeout);
        setCollapseTimeout(null);
      }
    }
  }, [isExpanded, isAuthenticated]);

  // Limpar bloqueio após tempo determinado
  useEffect(() => {
    if (isBlocked) {
      const timeout = setTimeout(() => {
        setIsBlocked(false);
        setFailedAttempts(0);
        logger.debug('Admin panel unblocked after timeout');
        toast({
          title: "Bloqueio Removido",
          description: "Você pode tentar fazer login novamente",
          variant: "default"
        });
      }, BLOCK_DURATION);
      
      setBlockTimeout(timeout);
      
      return () => {
        if (timeout) clearTimeout(timeout);
      };
    }
  }, [isBlocked]);

  // Reset timeout em atividade
  const resetTimeout = useCallback(() => {
    setLastActivity(Date.now());
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
    }
    if (collapseTimeout) {
      clearTimeout(collapseTimeout);
      setCollapseTimeout(null);
    }
  }, [sessionTimeout, collapseTimeout]);

  // Expandir painel
  const handleExpand = useCallback(() => {
    if (isBlocked) {
      toast({
        title: "Acesso Bloqueado",
        description: `Muitas tentativas falhadas. Tente novamente em ${Math.ceil(BLOCK_DURATION / 60000)} minutos.`,
        variant: "destructive"
      });
      return;
    }
    
    setIsExpanded(true);
    logger.debug('Admin panel expanded');
  }, [isBlocked]);

  // Colapsar painel
  const handleCollapse = useCallback(() => {
    setIsExpanded(false);
    setPassword('');
    logger.debug('Admin panel collapsed');
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBlocked) {
      toast({
        title: "Acesso Bloqueado",
        description: `Muitas tentativas falhadas. Aguarde ${Math.ceil(BLOCK_DURATION / 60000)} minutos.`,
        variant: "destructive"
      });
      return;
    }
    
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setIsExpanded(true);
      setPassword('');
      setFailedAttempts(0);
      logger.debug('Admin authentication successful');
      toast({
        title: "Acesso Autorizado",
        description: "Painel administrativo ativado",
        variant: "default"
      });
    } else {
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);
      setPassword('');
      
      logger.warn('Admin authentication failed', { 
        attempts: newFailedAttempts,
        maxAttempts: MAX_FAILED_ATTEMPTS 
      });
      
      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        setIsBlocked(true);
        setIsExpanded(false);
        toast({
          title: "Acesso Bloqueado",
          description: `Muitas tentativas falhadas. Bloqueado por ${BLOCK_DURATION / 60000} minutos.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Acesso Negado",
          description: `Senha incorreta. ${MAX_FAILED_ATTEMPTS - newFailedAttempts} tentativas restantes.`,
          variant: "destructive"
        });
      }
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsExpanded(false);
    setPassword('');
    
    // Limpar todos os timeouts
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      setSessionTimeout(null);
    }
    if (collapseTimeout) {
      clearTimeout(collapseTimeout);
      setCollapseTimeout(null);
    }
    
    logger.debug('Admin logged out');
  };

  const handleClearData = () => {
    resetTimeout();
    if (window.confirm('⚠️ ATENÇÃO: Esta ação irá apagar TODOS os dados financeiros. Esta ação é IRREVERSÍVEL. Tem certeza?')) {
      onClearData();
      toast({
        title: "Dados Limpos",
        description: "Todos os dados financeiros foram removidos",
        variant: "destructive"
      });
    }
  };

  const handleSystemCheck = () => {
    resetTimeout();
    onSystemCheck();
    toast({
      title: "Verificação Iniciada",
      description: "Executando verificação do sistema...",
      variant: "default"
    });
  };

  // Interface retrátil - Estado fechado ou expandido
  if (!isAuthenticated) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        {!isExpanded ? (
          // Estado fechado - apenas ícone discreto
          <div className="group">
            <button
              onClick={handleExpand}
              disabled={isBlocked}
              className={`
                p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110
                ${isBlocked 
                  ? 'bg-red-100 text-red-400 cursor-not-allowed' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800'
                }
              `}
              title={isBlocked ? 'Bloqueado por tentativas excessivas' : 'Painel Administrativo'}
            >
              {isBlocked ? (
                <AlertTriangle size={20} />
              ) : (
                <Settings size={20} />
              )}
            </button>
            
            {/* Indicador de tentativas falhadas */}
            {failedAttempts > 0 && !isBlocked && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {failedAttempts}
              </div>
            )}
          </div>
        ) : (
          // Estado expandido - formulário de login
          <div className="animate-in slide-in-from-right duration-300">
            <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-xl min-w-[280px]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-gray-800 flex items-center gap-2 text-sm">
                    <Shield size={16} />
                    Admin
                  </CardTitle>
                  <button
                    onClick={handleCollapse}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-3">
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite a senha administrativa"
                      className="text-sm pr-10"
                      autoComplete="off"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {failedAttempts > 0 && (
                        <span className="text-red-500">
                          {MAX_FAILED_ATTEMPTS - failedAttempts} tentativas restantes
                        </span>
                      )}
                    </div>
                    <Button 
                      type="submit" 
                      size="sm" 
                      disabled={isBlocked || !password.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Shield size={14} className="mr-1" />
                      Entrar
                    </Button>
                  </div>
                </form>
                
                {/* Auto-collapse indicator */}
                <div className="mt-3 text-xs text-gray-400 text-center">
                  Fecha automaticamente em 30s
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Painel administrativo autenticado - interface elegante
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="animate-in slide-in-from-bottom duration-300">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-xl min-w-[320px]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <Shield className="text-blue-600" size={20} />
                Painel Administrativo
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-blue-600 font-medium">
                    Ativo
                  </span>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-300 hover:bg-blue-100 transition-colors"
                >
                  Sair
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={() => {
                  resetTimeout();
                  handleSystemCheck();
                }}
                variant="outline"
                className="flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50 transition-colors"
              >
                <CheckCircle size={16} />
                Verificar Sistema
              </Button>
              
              <Button
                onClick={() => {
                  resetTimeout();
                  handleClearData();
                }}
                variant="outline"
                className="flex items-center gap-2 border-red-300 text-red-700 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} />
                Limpar Dados
              </Button>
            </div>
            
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-800">
                  <p className="font-medium mb-1">Modo Administrativo Ativo</p>
                  <p className="text-amber-700">
                    Sessão expira em 10min de inatividade. Use com cuidado.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};