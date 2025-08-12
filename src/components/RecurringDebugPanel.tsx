import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Bug, RefreshCw, Trash2 } from 'lucide-react';

const RecurringDebugPanel: React.FC = () => {
  const [recurringData, setRecurringData] = useState<any[]>([]);
  const [transactionData, setTransactionData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = () => {
    setIsLoading(true);
    try {
      // Carregar recorrentes
      const recurring = JSON.parse(localStorage.getItem('recurringTransactions') || '[]');
      setRecurringData(recurring);

      // Carregar transações
      const transactions = JSON.parse(localStorage.getItem('unifiedFinancialData') || '[]');
      setTransactionData(transactions);

      console.log('🔍 DEBUG: Recorrentes:', recurring);
      console.log('🔍 DEBUG: Transações:', transactions);
    } catch (error) {
      console.error('Erro ao carregar dados de debug:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const clearAllRecurring = () => {
    if (window.confirm('ATENÇÃO: Isso removerá TODOS os lançamentos recorrentes e suas transações geradas. Confirma?')) {
      localStorage.setItem('recurringTransactions', '[]');
      
      // Remover todas as transações recorrentes
      const transactions = JSON.parse(localStorage.getItem('unifiedFinancialData') || '[]');
      const filtered = transactions.filter((t: any) => !t.recurringId && !t.isRecurring);
      localStorage.setItem('unifiedFinancialData', JSON.stringify(filtered));
      
      // Forçar atualização
      window.dispatchEvent(new Event('storage'));
      
      loadData();
      alert('Todos os recorrentes foram removidos!');
    }
  };

  const forceReload = () => {
    window.dispatchEvent(new Event('storage'));
    setTimeout(loadData, 100);
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="w-5 h-5 text-orange-500" />
          Debug - Lançamentos Recorrentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button onClick={loadData} disabled={isLoading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Recarregar
          </Button>
          <Button onClick={forceReload} variant="outline">
            Forçar Atualização
          </Button>
          <Button onClick={clearAllRecurring} variant="outline" className="text-red-600">
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar Tudo
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recorrentes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Recorrentes Cadastrados ({recurringData.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {recurringData.map((rec, index) => (
                  <div key={index} className="p-2 bg-blue-50 rounded text-xs">
                    <div className="font-medium">{rec.description}</div>
                    <div className="text-gray-600">ID: {rec.id}</div>
                    <div className="text-gray-600">
                      Status: {rec.isActive ? '✅ Ativo' : '❌ Inativo'}
                    </div>
                    <div className="text-gray-600">
                      Valor: R$ {rec.amount} ({rec.type})
                    </div>
                  </div>
                ))}
                {recurringData.length === 0 && (
                  <div className="text-gray-500 text-center py-4">
                    Nenhum recorrente cadastrado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transações Geradas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Transações de Recorrentes ({transactionData.filter(t => t.recurringId || t.isRecurring).length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {transactionData
                  .filter(t => t.recurringId || t.isRecurring)
                  .map((trans, index) => (
                    <div key={index} className="p-2 bg-green-50 rounded text-xs">
                      <div className="font-medium">{trans.description}</div>
                      <div className="text-gray-600">Data: {trans.date}</div>
                      <div className="text-gray-600">
                        Recorrente ID: {trans.recurringId || 'N/A'}
                      </div>
                      <div className="text-gray-600">
                        Valor: R$ {trans.amount} ({trans.type})
                      </div>
                    </div>
                  ))}
                {transactionData.filter(t => t.recurringId || t.isRecurring).length === 0 && (
                  <div className="text-gray-500 text-center py-4">
                    Nenhuma transação de recorrente
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Análise */}
        <div className="mt-4 p-3 bg-yellow-50 rounded">
          <h4 className="font-medium text-yellow-800 mb-2">Análise:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Recorrentes cadastrados: {recurringData.length}</li>
            <li>• Recorrentes ativos: {recurringData.filter(r => r.isActive).length}</li>
            <li>• Transações geradas: {transactionData.filter(t => t.recurringId || t.isRecurring).length}</li>
            <li>• Total de transações: {transactionData.length}</li>
          </ul>
          
          {recurringData.length > 0 && transactionData.filter(t => t.recurringId || t.isRecurring).length === 0 && (
            <div className="mt-2 p-2 bg-red-50 rounded text-red-700 text-sm">
              ⚠️ Há recorrentes cadastrados mas nenhuma transação gerada. 
              Isso pode indicar problema na geração automática.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecurringDebugPanel;