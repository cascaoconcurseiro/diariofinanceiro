import React, { useState } from 'react';
import { useSyncedFinancial } from '../hooks/useSyncedFinancial';
import SyncStatus from '../components/SyncStatus';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SyncTest: React.FC = () => {
  const navigate = useNavigate();
  const {
    transactions,
    addTransaction,
    deleteTransaction,
    syncStatus,
    lastSync,
    forceSync,
    isConnected
  } = useSyncedFinancial();

  const [testAmount, setTestAmount] = useState('100');
  const [testDescription, setTestDescription] = useState('Teste de Sincronização');

  const handleAddTest = () => {
    const amount = parseFloat(testAmount.replace(',', '.'));
    if (amount > 0) {
      addTransaction({
        date: new Date().toISOString().split('T')[0],
        description: `${testDescription} - ${new Date().toLocaleTimeString()}`,
        amount,
        type: 'entrada',
        category: 'Teste',
        source: 'sync-test'
      });
      
      // Limpar campos
      setTestAmount('');
      setTestDescription('Teste de Sincronização');
    }
  };

  const testTransactions = transactions.filter(t => t.source === 'sync-test');

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
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
              <h1 className="text-2xl font-bold text-gray-900">Teste de Sincronização</h1>
              <p className="text-gray-600">Teste a sincronização entre dispositivos</p>
            </div>
          </div>
          
          <SyncStatus
            status={syncStatus}
            lastSync={lastSync}
            onForceSync={forceSync}
            isConnected={isConnected}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Painel de Teste */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Adicionar Teste
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Valor</label>
                <Input
                  type="text"
                  value={testAmount}
                  onChange={(e) => setTestAmount(e.target.value)}
                  placeholder="100,00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <Input
                  type="text"
                  value={testDescription}
                  onChange={(e) => setTestDescription(e.target.value)}
                  placeholder="Descrição do teste"
                />
              </div>
              
              <Button
                onClick={handleAddTest}
                className="w-full"
                disabled={!testAmount || parseFloat(testAmount.replace(',', '.')) <= 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Transação de Teste
              </Button>
              
              <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
                💡 <strong>Como testar:</strong><br/>
                1. Abra esta página em outro dispositivo/aba<br/>
                2. Adicione uma transação aqui<br/>
                3. Veja aparecer automaticamente no outro dispositivo<br/>
                4. Status de sincronização mostra em tempo real
              </div>
            </CardContent>
          </Card>

          {/* Lista de Transações de Teste */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Transações de Teste</span>
                <span className="text-sm font-normal text-gray-500">
                  {testTransactions.length} itens
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Plus className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>Nenhuma transação de teste</p>
                  <p className="text-sm">Adicione uma para testar a sincronização</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {testTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <p className="text-xs text-gray-500">
                          {transaction.date} • R$ {transaction.amount.toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTransaction(transaction.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instruções */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>📱💻 Como Testar a Sincronização</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">1. Abrir em Múltiplos Dispositivos</h3>
                <p className="text-sm text-blue-700">
                  Abra esta página no celular e computador simultaneamente
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">2. Adicionar Transação</h3>
                <p className="text-sm text-green-700">
                  Adicione uma transação em um dispositivo
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-2">3. Ver Sincronização</h3>
                <p className="text-sm text-purple-700">
                  Veja aparecer automaticamente no outro dispositivo
                </p>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>⚡ Performance:</strong> Dados criptografados com AES-256 + Cache ultra-rápido + Sincronização real-time
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SyncTest;