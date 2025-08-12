import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Shield, Database, RefreshCw, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const ADMIN_PASSWORD = '834702';

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Senha incorreta');
      setPassword('');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Shield className="w-6 h-6 text-red-600" />
              Área Administrativa
            </CardTitle>
            <p className="text-sm text-gray-600">Acesso restrito</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha de administrador"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className={error ? 'border-red-500' : ''}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            
            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}
            
            <Button onClick={handleLogin} className="w-full">
              <Shield className="w-4 h-4 mr-2" />
              Acessar
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/')} 
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-6 h-6 text-red-600" />
                Painel Administrativo
              </h1>
              <p className="text-gray-600">Ferramentas avançadas do sistema</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Gestão de Usuários */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Gestão de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Gerenciar usuários, permissões e acessos
              </p>
              <Button 
                onClick={() => navigate('/user-management')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                👥 Gerenciar Usuários
              </Button>
            </CardContent>
          </Card>

          {/* Logs do Sistema */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-green-600" />
                Logs do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Auditoria completa de atividades
              </p>
              <Button 
                onClick={() => navigate('/system-logs')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                📋 Ver Logs
              </Button>
            </CardContent>
          </Card>

          {/* Gerenciamento de Banco */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-600" />
                Banco de Dados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Gerenciar e otimizar banco de dados
              </p>
              <Button 
                onClick={() => navigate('/database-admin')}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                🗄️ Gerenciar DB
              </Button>
            </CardContent>
          </Card>

          {/* Teste de Sincronização */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-orange-600" />
                Teste de Sincronização
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Testar sincronização real-time entre dispositivos
              </p>
              <Button 
                onClick={() => navigate('/sync-test')}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                📱💻 Abrir Teste
              </Button>
            </CardContent>
          </Card>

          {/* Dashboard de Segurança */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                Segurança Avançada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Monitoramento e auditoria de segurança
              </p>
              <Button 
                onClick={() => navigate('/security-dashboard')}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                🛡️ Dashboard
              </Button>
            </CardContent>
          </Card>

          {/* Configurações do Sistema */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-gray-600" />
                Configurações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Configurações avançadas do sistema
              </p>
              <Button 
                onClick={() => navigate('/system-settings')}
                className="w-full bg-gray-600 hover:bg-gray-700"
              >
                ⚙️ Configurar
              </Button>
            </CardContent>
          </Card>

          {/* Debug Panels */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-yellow-600" />
                Debug & Diagnóstico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Ferramentas de debug para recorrentes e sync
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={() => {
                    const event = new CustomEvent('showRecurringDebug');
                    window.dispatchEvent(event);
                  }}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-sm"
                >
                  🔄 Debug Recorrentes
                </Button>
                <Button 
                  onClick={() => {
                    const event = new CustomEvent('showSyncDebug');
                    window.dispatchEvent(event);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-sm"
                >
                  ☁️ Debug Sync
                </Button>
                <Button 
                  onClick={async () => {
                    const { neonDB } = await import('../services/neonDatabase');
                    await neonDB.recreateTestUsers();
                    alert('Usuários de teste recriados!');
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-sm"
                >
                  👥 Recriar Usuários Teste
                </Button>
                <Button 
                  onClick={async () => {
                    const { neonDB } = await import('../services/neonDatabase');
                    const password = prompt('Digite uma senha para testar:');
                    if (password) {
                      const hash = neonDB.testPasswordHash(password);
                      alert(`Hash gerado: ${hash}\nVerifique o console para detalhes.`);
                    }
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-sm"
                >
                  🧪 Testar Hash
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;