import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Shield, AlertTriangle, Activity, Database } from 'lucide-react';
import { auditSystem } from '../utils/audit';
import { dataIntegrity } from '../utils/integrity';
import { anomalyDetection } from '../utils/anomalyDetection';
import { getErrorLogs } from '../utils/errorHandler';

const SecurityDashboard: React.FC = () => {
  const [securityStatus, setSecurityStatus] = useState<any>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible) {
      loadSecurityData();
    }
  }, [isVisible]);

  const loadSecurityData = () => {
    // Verificar integridade
    const integrityStatus = dataIntegrity.checkAllData();
    
    // Eventos de segurança
    const securityEvents = auditSystem.getSecurityEvents(24);
    
    // Logs de erro
    const errorLogs = getErrorLogs().slice(0, 10);
    
    // Anomalias (usuário atual)
    const userId = localStorage.getItem('userData') ? 
      JSON.parse(localStorage.getItem('userData')!).id : null;
    const anomalies = userId ? anomalyDetection.detectAnomalies(userId) : [];

    setSecurityStatus({
      integrity: integrityStatus,
      securityEvents: securityEvents.length,
      errorCount: errorLogs.length,
      anomalies: anomalies.length,
      lastCheck: new Date().toLocaleString()
    });
  };

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50"
      >
        <Shield className="w-4 h-4 mr-2" />
        Segurança
      </Button>
    );
  }

  const allIntegrityOk = Object.values(securityStatus.integrity || {}).every(Boolean);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Dashboard de Segurança
            </h2>
            <Button onClick={() => setIsVisible(false)} variant="outline">
              Fechar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Status de Integridade */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Integridade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${allIntegrityOk ? 'text-green-600' : 'text-red-600'}`}>
                  {allIntegrityOk ? '✅' : '❌'}
                </div>
                <p className="text-xs text-gray-600">
                  {allIntegrityOk ? 'Dados íntegros' : 'Verificar dados'}
                </p>
              </CardContent>
            </Card>

            {/* Eventos de Segurança */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Eventos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {securityStatus.securityEvents || 0}
                </div>
                <p className="text-xs text-gray-600">Últimas 24h</p>
              </CardContent>
            </Card>

            {/* Erros */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Erros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {securityStatus.errorCount || 0}
                </div>
                <p className="text-xs text-gray-600">Logs recentes</p>
              </CardContent>
            </Card>

            {/* Anomalias */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Anomalias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {securityStatus.anomalies || 0}
                </div>
                <p className="text-xs text-gray-600">Detectadas</p>
              </CardContent>
            </Card>
          </div>

          {/* Ações */}
          <div className="flex gap-2 mb-4">
            <Button onClick={loadSecurityData} size="sm">
              Atualizar
            </Button>
            <Button 
              onClick={() => {
                auditSystem.clearLogs();
                loadSecurityData();
              }} 
              variant="outline" 
              size="sm"
            >
              Limpar Logs
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            Última verificação: {securityStatus.lastCheck}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;