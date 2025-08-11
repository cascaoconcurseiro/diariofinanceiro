import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

/**
 * Error Boundary robusto para capturar e tratar erros
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Gerar ID único para o erro
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log detalhado do erro
    console.error('🚨 Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Salvar erro no localStorage para análise posterior
    try {
      const errorLog = {
        id: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      };

      const existingLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      existingLogs.push(errorLog);
      
      // Manter apenas os últimos 10 erros
      if (existingLogs.length > 10) {
        existingLogs.splice(0, existingLogs.length - 10);
      }
      
      localStorage.setItem('errorLogs', JSON.stringify(existingLogs));
    } catch (logError) {
      console.error('Failed to save error log:', logError);
    }

    this.setState({
      error,
      errorInfo
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: ''
    });
  };

  handleClearData = () => {
    if (window.confirm('⚠️ Isso irá limpar todos os dados e pode resolver o problema. Continuar?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Interface de erro padrão
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full border-red-200 bg-red-50">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="text-red-600" size={32} />
                </div>
              </div>
              <CardTitle className="text-red-800">
                Oops! Algo deu errado
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-center text-gray-600">
                <p className="mb-2">
                  Ocorreu um erro inesperado no sistema financeiro.
                </p>
                <p className="text-sm">
                  ID do Erro: <code className="bg-gray-200 px-2 py-1 rounded text-xs">{this.state.errorId}</code>
                </p>
              </div>

              {/* Detalhes do erro (apenas em desenvolvimento) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-gray-100 p-3 rounded text-xs">
                  <summary className="cursor-pointer font-medium mb-2">
                    Detalhes Técnicos (Desenvolvimento)
                  </summary>
                  <div className="space-y-2">
                    <div>
                      <strong>Erro:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="mt-1 overflow-auto max-h-32 text-xs">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Ações de recuperação */}
              <div className="space-y-2">
                <Button 
                  onClick={this.handleRetry}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Tentar Novamente
                </Button>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={this.handleGoHome}
                    variant="outline"
                    className="border-gray-300"
                  >
                    <Home size={16} className="mr-2" />
                    Início
                  </Button>
                  
                  <Button 
                    onClick={this.handleReload}
                    variant="outline"
                    className="border-gray-300"
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Recarregar
                  </Button>
                </div>

                <Button 
                  onClick={this.handleClearData}
                  variant="outline"
                  className="w-full border-red-300 text-red-600 hover:bg-red-50"
                >
                  Limpar Dados e Reiniciar
                </Button>
              </div>

              {/* Informações de suporte */}
              <div className="text-xs text-gray-500 text-center border-t pt-3">
                <p>
                  Se o problema persistir, anote o ID do erro e entre em contato com o suporte.
                </p>
                <p className="mt-1">
                  Seus dados financeiros estão seguros no navegador.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;