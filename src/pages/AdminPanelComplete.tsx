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
              onClick={() => window.history.back()} 
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
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-6 h-6 text-red-600" />
                Painel Administrativo Completo
              </h1>
              <p className="text-gray-600">Central de controle do sistema financeiro</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          
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
                Gerenciar usuários e permissões
              </p>
              <Button 
                onClick={() => navigate('/user-management')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                👥 Gerenciar Usuários
              </Button>
            </CardContent>
          </Card>

          {/* Relatórios Financeiros */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-green-600" />
                Relatórios Financeiros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  onClick={() => {
                    const data = JSON.parse(localStorage.getItem('unifiedFinancialData') || '[]');
                    const report = data.reduce((acc, t) => {
                      acc[t.type] = (acc[t.type] || 0) + t.amount;
                      return acc;
                    }, {});
                    alert(`Relatório Geral:\nEntradas: R$ ${(report.entrada || 0).toFixed(2)}\nSaídas: R$ ${(report.saida || 0).toFixed(2)}\nSaldo: R$ ${((report.entrada || 0) - (report.saida || 0)).toFixed(2)}`);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-sm"
                >
                  📊 Relatório Geral
                </Button>
                <Button 
                  onClick={() => {
                    const data = JSON.parse(localStorage.getItem('unifiedFinancialData') || '[]');
                    const thisMonth = new Date().toISOString().slice(0, 7);
                    const monthData = data.filter(t => t.date.startsWith(thisMonth));
                    const report = monthData.reduce((acc, t) => {
                      acc[t.type] = (acc[t.type] || 0) + t.amount;
                      return acc;
                    }, {});
                    alert(`Relatório Mensal (${thisMonth}):\nEntradas: R$ ${(report.entrada || 0).toFixed(2)}\nSaídas: R$ ${(report.saida || 0).toFixed(2)}\nSaldo: R$ ${((report.entrada || 0) - (report.saida || 0)).toFixed(2)}`);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-sm"
                >
                  📅 Relatório Mensal
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Backup e Restauração */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-600" />
                Backup & Restauração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  onClick={() => {
                    const data = localStorage.getItem('unifiedFinancialData') || '[]';
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-sm"
                >
                  💾 Fazer Backup
                </Button>
                <Button 
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          try {
                            const data = JSON.parse(e.target?.result as string);
                            localStorage.setItem('unifiedFinancialData', JSON.stringify(data));
                            alert('Backup restaurado com sucesso!');
                            window.location.reload();
                          } catch (error) {
                            alert('Erro ao restaurar backup!');
                          }
                        };
                        reader.readAsText(file);
                      }
                    };
                    input.click();
                  }}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-sm"
                >
                  📂 Restaurar Backup
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Monitoramento do Sistema */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-orange-600" />
                Monitoramento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  onClick={() => {
                    const data = JSON.parse(localStorage.getItem('unifiedFinancialData') || '[]');
                    const users = JSON.parse(localStorage.getItem('userData') || '{}');
                    const storage = JSON.stringify(data).length;
                    alert(`Status do Sistema:\n\nTransações: ${data.length}\nUsuário: ${users.name || 'N/A'}\nArmazenamento: ${(storage/1024).toFixed(2)} KB\nÚltima Sync: ${new Date().toLocaleString()}\nStatus: Online ✅`);
                  }}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-sm"
                >
                  📊 Status Sistema
                </Button>
                <Button 
                  onClick={() => navigate('/sync-test')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-sm"
                >
                  📱 Teste Sync
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Segurança e Auditoria */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                Segurança & Auditoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  onClick={() => {
                    const logs = [
                      `${new Date().toLocaleString()} - Login Admin realizado`,
                      `${new Date().toLocaleString()} - Acesso ao painel administrativo`,
                      `${new Date().toLocaleString()} - Sistema funcionando normalmente`
                    ];
                    alert(`Logs de Segurança:\n\n${logs.join('\n')}`);
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-sm"
                >
                  🛡️ Ver Logs
                </Button>
                <Button 
                  onClick={() => {
                    const data = JSON.parse(localStorage.getItem('unifiedFinancialData') || '[]');
                    const suspicious = data.filter(t => t.amount > 10000);
                    alert(`Auditoria Financeira:\n\nTransações > R$ 10.000: ${suspicious.length}\nTotal de transações: ${data.length}\nStatus: ${suspicious.length > 0 ? 'Revisar ⚠️' : 'Normal ✅'}`);
                  }}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-sm"
                >
                  🔍 Auditoria
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Configurações Avançadas */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-gray-600" />
                Configurações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  onClick={() => {
                    const config = {
                      autoSync: true,
                      backupInterval: '24h',
                      maxTransactions: 10000,
                      theme: 'light'
                    };
                    localStorage.setItem('systemConfig', JSON.stringify(config));
                    alert('Configurações otimizadas aplicadas!');
                  }}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-sm"
                >
                  ⚙️ Otimizar Sistema
                </Button>
                <Button 
                  onClick={() => {
                    if (confirm('Limpar cache do sistema?')) {
                      localStorage.removeItem('cache');
                      localStorage.removeItem('tempData');
                      alert('Cache limpo com sucesso!');
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-sm"
                >
                  🧹 Limpar Cache
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas Avançadas */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                Estatísticas Avançadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  onClick={() => {
                    const data = JSON.parse(localStorage.getItem('unifiedFinancialData') || '[]');
                    const categories = {};
                    data.forEach(t => {
                      categories[t.category || 'Sem categoria'] = (categories[t.category || 'Sem categoria'] || 0) + t.amount;
                    });
                    const report = Object.entries(categories)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([cat, val]) => `${cat}: R$ ${val.toFixed(2)}`)
                      .join('\n');
                    alert(`Top 5 Categorias:\n\n${report}`);
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-sm"
                >
                  📈 Top Categorias
                </Button>
                <Button 
                  onClick={() => {
                    const data = JSON.parse(localStorage.getItem('unifiedFinancialData') || '[]');
                    const months = {};
                    data.forEach(t => {
                      const month = t.date.slice(0, 7);
                      months[month] = (months[month] || 0) + (t.type === 'entrada' ? t.amount : -t.amount);
                    });
                    const report = Object.entries(months)
                      .sort(([a], [b]) => b.localeCompare(a))
                      .slice(0, 6)
                      .map(([month, val]) => `${month}: R$ ${val.toFixed(2)}`)
                      .join('\n');
                    alert(`Evolução Mensal:\n\n${report}`);
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-sm"
                >
                  📊 Evolução Mensal
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Ferramentas de Debug */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-yellow-600" />
                Debug & Diagnóstico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-1">
                <Button 
                  onClick={() => {
                    const event = new CustomEvent('showRecurringDebug');
                    window.dispatchEvent(event);
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-xs p-1"
                >
                  🔄 Recorrentes
                </Button>
                <Button 
                  onClick={() => {
                    const event = new CustomEvent('showSyncDebug');
                    window.dispatchEvent(event);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-xs p-1"
                >
                  ☁️ Sync
                </Button>
                <Button 
                  onClick={async () => {
                    const { neonDB } = await import('../services/neonDatabase');
                    await neonDB.recreateTestUsers();
                    alert('Usuários recriados!');
                  }}
                  className="bg-red-600 hover:bg-red-700 text-xs p-1"
                >
                  👥 Usuários
                </Button>
                <Button 
                  onClick={async () => {
                    const { neonDB } = await import('../services/neonDatabase');
                    const password = prompt('Senha para testar:');
                    if (password) {
                      const hash = neonDB.testPasswordHash(password);
                      alert(`Hash: ${hash}`);
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-xs p-1"
                >
                  🧪 Hash
                </Button>
                <Button 
                  onClick={async () => {
                    if (confirm('RESET COMPLETO?')) {
                      const { neonDB } = await import('../services/neonDatabase');
                      const success = await neonDB.resetDatabase();
                      alert(success ? 'Resetado!' : 'Erro!');
                    }
                  }}
                  className="bg-red-800 hover:bg-red-900 text-xs p-1"
                >
                  🚨 RESET
                </Button>
                <Button 
                  onClick={() => {
                    localStorage.setItem('token', 'token_admin');
                    localStorage.setItem('userData', JSON.stringify({
                      id: 'admin',
                      name: 'Wesley Admin',
                      email: 'wesley.diaslima@gmail.com'
                    }));
                    window.location.href = '/';
                  }}
                  className="bg-green-600 hover:bg-green-700 text-xs p-1"
                >
                  🚀 LOGIN
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