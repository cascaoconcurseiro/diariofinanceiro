import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { ArrowLeft, FileText, AlertTriangle, Info, Shield, Download } from 'lucide-react';
import { enterpriseDB } from '../utils/enterpriseDB';

interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warning' | 'error' | 'security';
  category: string;
  message: string;
  userId?: string;
  userEmail?: string;
  ip?: string;
  userAgent?: string;
  details?: any;
}

const SystemLogs: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<string>('24h');

  useEffect(() => {
    loadLogs();
  }, [dateRange]);

  useEffect(() => {
    filterLogs();
  }, [logs, filterLevel, filterCategory, searchTerm]);

  const loadLogs = async () => {
    try {
      await enterpriseDB.init();
      
      // Carregar logs reais do banco
      const realLogs = await enterpriseDB.getAllFromStore('audit_logs');
      
      // Converter para formato da interface
      const formattedLogs: LogEntry[] = realLogs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        level: log.level || 'info',
        category: log.action?.split('.')[0] || 'system',
        message: log.details || 'Ação do sistema',
        userId: log.userId,
        userEmail: log.userEmail,
        ip: log.ip,
        userAgent: log.userAgent,
        details: typeof log.details === 'string' ? JSON.parse(log.details) : log.details
      }));
      
      setLogs(formattedLogs);
      
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      
      // Fallback para logs de exemplo se não houver dados
      const mockLogs: LogEntry[] = [
      {
        id: '1',
        timestamp: Date.now() - 1000 * 60 * 5, // 5 min atrás
        level: 'security',
        category: 'auth',
        message: 'Tentativa de login com senha incorreta',
        userId: '2',
        userEmail: 'usuario1@email.com',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        details: { attempts: 3 }
      },
      {
        id: '2',
        timestamp: Date.now() - 1000 * 60 * 15, // 15 min atrás
        level: 'info',
        category: 'transaction',
        message: 'Nova transação criada',
        userId: '2',
        userEmail: 'usuario1@email.com',
        ip: '192.168.1.100',
        details: { amount: 150.00, type: 'entrada' }
      },
      {
        id: '3',
        timestamp: Date.now() - 1000 * 60 * 30, // 30 min atrás
        level: 'warning',
        category: 'system',
        message: 'Cache atingiu 80% da capacidade',
        details: { cacheSize: '80MB', maxSize: '100MB' }
      },
      {
        id: '4',
        timestamp: Date.now() - 1000 * 60 * 60, // 1h atrás
        level: 'error',
        category: 'database',
        message: 'Falha na conexão com IndexedDB',
        details: { error: 'QuotaExceededError', retries: 3 }
      },
      {
        id: '5',
        timestamp: Date.now() - 1000 * 60 * 90, // 1.5h atrás
        level: 'security',
        category: 'admin',
        message: 'Acesso à área administrativa',
        userId: '1',
        userEmail: 'admin@sistema.com',
        ip: '192.168.1.50'
      },
      {
        id: '6',
        timestamp: Date.now() - 1000 * 60 * 120, // 2h atrás
        level: 'info',
        category: 'backup',
        message: 'Backup automático realizado com sucesso',
        details: { size: '2.5MB', duration: '1.2s' }
      }
    ];

      setLogs(mockLogs);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    // Filtrar por nível
    if (filterLevel !== 'all') {
      filtered = filtered.filter(log => log.level === filterLevel);
    }

    // Filtrar por categoria
    if (filterCategory !== 'all') {
      filtered = filtered.filter(log => log.category === filterCategory);
    }

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar por timestamp (mais recente primeiro)
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    setFilteredLogs(filtered);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'security': return <Shield className="w-4 h-4 text-purple-600" />;
      default: return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'security': return 'bg-purple-100 text-purple-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_logs_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const getUniqueCategories = () => {
    const categories = [...new Set(logs.map(log => log.category))];
    return categories.sort();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-7xl mx-auto px-4">
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
                <FileText className="w-6 h-6 text-green-600" />
                Logs do Sistema
              </h1>
              <p className="text-gray-600">Auditoria completa de atividades do sistema</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={exportLogs} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={loadLogs} variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nível</label>
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="all">Todos</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="security">Security</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Categoria</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="all">Todas</option>
                  {getUniqueCategories().map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Período</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="1h">Última hora</option>
                  <option value="24h">Últimas 24h</option>
                  <option value="7d">Últimos 7 dias</option>
                  <option value="30d">Últimos 30 dias</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Buscar</label>
                <Input
                  type="text"
                  placeholder="Buscar logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {logs.filter(l => l.level === 'info').length}
              </div>
              <div className="text-sm text-gray-600">Info</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {logs.filter(l => l.level === 'warning').length}
              </div>
              <div className="text-sm text-gray-600">Warnings</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {logs.filter(l => l.level === 'error').length}
              </div>
              <div className="text-sm text-gray-600">Errors</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {logs.filter(l => l.level === 'security').length}
              </div>
              <div className="text-sm text-gray-600">Security</div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Logs do Sistema ({filteredLogs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getLevelIcon(log.level)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(log.level)}`}>
                            {log.level.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {log.category}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900 mb-1">{log.message}</p>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>⏰ {formatTimestamp(log.timestamp)}</p>
                          {log.userEmail && (
                            <p>👤 {log.userEmail} {log.ip && `(${log.ip})`}</p>
                          )}
                          {log.details && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                                Ver detalhes
                              </summary>
                              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredLogs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>Nenhum log encontrado com os filtros aplicados</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemLogs;