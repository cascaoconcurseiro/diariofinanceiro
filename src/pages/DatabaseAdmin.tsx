import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Database, Download, Trash2, RefreshCw, BarChart3 } from 'lucide-react';
import { enterpriseDB } from '../utils/enterpriseDB';

const DatabaseAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastCleanup, setLastCleanup] = useState<Date | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      await enterpriseDB.init();
      const dbStats = await enterpriseDB.getDBStats();
      setStats(dbStats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanup = async () => {
    if (window.confirm('Limpar logs antigos (>30 dias)? Esta ação não pode ser desfeita.')) {
      try {
        const deletedCount = await enterpriseDB.cleanOldLogs(30);
        alert(`${deletedCount} logs antigos foram removidos.`);
        setLastCleanup(new Date());
        loadStats();
      } catch (error) {
        alert('Erro na limpeza: ' + error);
      }
    }
  };

  const handleExport = async () => {
    try {
      const data = await enterpriseDB.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Erro no backup: ' + error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
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
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Database className="w-6 h-6 text-green-600" />
                Administração do Banco
              </h1>
              <p className="text-gray-600">Gerenciamento e otimização do banco de dados</p>
            </div>
          </div>
          
          <Button onClick={loadStats} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Estatísticas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Transações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.transactions?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-gray-600">Registros armazenados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="w-4 h-4" />
                Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.users?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-gray-600">Contas cadastradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.auditLogs?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-gray-600">Registros de auditoria</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="w-4 h-4" />
                Cache
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.cacheEntries?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-gray-600">Entradas em cache</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Operações de Manutenção */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                Manutenção
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">Limpeza de Logs</h3>
                <p className="text-sm text-yellow-700 mb-3">
                  Remove logs de auditoria com mais de 30 dias para otimizar performance.
                </p>
                <Button 
                  onClick={handleCleanup}
                  variant="outline"
                  className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar Logs Antigos
                </Button>
              </div>
              
              {lastCleanup && (
                <div className="text-sm text-gray-600">
                  Última limpeza: {lastCleanup.toLocaleString('pt-BR')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Backup e Exportação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-600" />
                Backup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Exportar Dados</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Gera backup completo de todos os dados em formato JSON.
                </p>
                <Button 
                  onClick={handleExport}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Fazer Backup
                </Button>
              </div>
              
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                💡 <strong>Dica:</strong> Faça backups regulares para proteger seus dados.
                O arquivo será baixado automaticamente.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informações Técnicas */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>🔧 Informações Técnicas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">IndexedDB</h3>
                <p className="text-sm text-green-700">
                  Banco NoSQL nativo do navegador com índices otimizados para consultas rápidas.
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Criptografia AES-256</h3>
                <p className="text-sm text-blue-700">
                  Todos os dados são criptografados antes do armazenamento para máxima segurança.
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-2">Cache Inteligente</h3>
                <p className="text-sm text-purple-700">
                  Sistema de cache em memória + IndexedDB para performance ultra-rápida.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DatabaseAdmin;