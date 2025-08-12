import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { ArrowLeft, Settings, Save, RefreshCw } from 'lucide-react';

const SystemSettings: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    // Segurança
    maxLoginAttempts: 5,
    sessionTimeout: 30, // minutos
    passwordMinLength: 6,
    enableTwoFactor: false,
    
    // Performance
    cacheSize: 100, // MB
    maxTransactionsPerPage: 50,
    autoBackupInterval: 24, // horas
    
    // Sistema
    logLevel: 'info',
    enableAnalytics: true,
    maintenanceMode: false,
    
    // Notificações
    emailNotifications: true,
    securityAlerts: true,
    systemUpdates: true
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Simular salvamento (em produção salvaria no banco)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Salvar no localStorage para persistência
      localStorage.setItem('systemSettings', JSON.stringify(settings));
      
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      alert('Erro ao salvar configurações: ' + error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Restaurar configurações padrão? Esta ação não pode ser desfeita.')) {
      setSettings({
        maxLoginAttempts: 5,
        sessionTimeout: 30,
        passwordMinLength: 6,
        enableTwoFactor: false,
        cacheSize: 100,
        maxTransactionsPerPage: 50,
        autoBackupInterval: 24,
        logLevel: 'info',
        enableAnalytics: true,
        maintenanceMode: false,
        emailNotifications: true,
        securityAlerts: true,
        systemUpdates: true
      });
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="w-6 h-6 text-gray-600" />
                Configurações do Sistema
              </h1>
              <p className="text-gray-600">Configurações avançadas e parâmetros do sistema</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleReset} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Restaurar Padrão
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Configurações de Segurança */}
          <Card>
            <CardHeader>
              <CardTitle>🔒 Segurança</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Máximo de tentativas de login
                  </label>
                  <Input
                    type="number"
                    min="3"
                    max="10"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => updateSetting('maxLoginAttempts', parseInt(e.target.value))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Timeout de sessão (minutos)
                  </label>
                  <Input
                    type="number"
                    min="5"
                    max="120"
                    value={settings.sessionTimeout}
                    onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tamanho mínimo da senha
                  </label>
                  <Input
                    type="number"
                    min="4"
                    max="20"
                    value={settings.passwordMinLength}
                    onChange={(e) => updateSetting('passwordMinLength', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="twoFactor"
                    checked={settings.enableTwoFactor}
                    onChange={(e) => updateSetting('enableTwoFactor', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="twoFactor" className="text-sm font-medium">
                    Habilitar autenticação de dois fatores
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Performance */}
          <Card>
            <CardHeader>
              <CardTitle>⚡ Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tamanho do cache (MB)
                  </label>
                  <Input
                    type="number"
                    min="50"
                    max="500"
                    value={settings.cacheSize}
                    onChange={(e) => updateSetting('cacheSize', parseInt(e.target.value))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Transações por página
                  </label>
                  <Input
                    type="number"
                    min="10"
                    max="200"
                    value={settings.maxTransactionsPerPage}
                    onChange={(e) => updateSetting('maxTransactionsPerPage', parseInt(e.target.value))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Intervalo de backup automático (horas)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="168"
                    value={settings.autoBackupInterval}
                    onChange={(e) => updateSetting('autoBackupInterval', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle>🖥️ Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nível de log
                  </label>
                  <select
                    value={settings.logLevel}
                    onChange={(e) => updateSetting('logLevel', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="error">Error</option>
                    <option value="warn">Warning</option>
                    <option value="info">Info</option>
                    <option value="debug">Debug</option>
                  </select>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="analytics"
                      checked={settings.enableAnalytics}
                      onChange={(e) => updateSetting('enableAnalytics', e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="analytics" className="text-sm font-medium">
                      Habilitar analytics
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="maintenance"
                      checked={settings.maintenanceMode}
                      onChange={(e) => updateSetting('maintenanceMode', e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="maintenance" className="text-sm font-medium">
                      Modo de manutenção
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Notificações */}
          <Card>
            <CardHeader>
              <CardTitle>🔔 Notificações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    checked={settings.emailNotifications}
                    onChange={(e) => updateSetting('emailNotifications', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="emailNotifications" className="text-sm font-medium">
                    Notificações por email
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="securityAlerts"
                    checked={settings.securityAlerts}
                    onChange={(e) => updateSetting('securityAlerts', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="securityAlerts" className="text-sm font-medium">
                    Alertas de segurança
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="systemUpdates"
                    checked={settings.systemUpdates}
                    onChange={(e) => updateSetting('systemUpdates', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="systemUpdates" className="text-sm font-medium">
                    Atualizações do sistema
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle>ℹ️ Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Versão:</strong> 2.0.0-enterprise</p>
                  <p><strong>Build:</strong> 20240315.1</p>
                  <p><strong>Ambiente:</strong> Production</p>
                </div>
                <div>
                  <p><strong>Banco:</strong> IndexedDB v3</p>
                  <p><strong>Cache:</strong> Ultra-Cache v2</p>
                  <p><strong>Segurança:</strong> AES-256-GCM</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;