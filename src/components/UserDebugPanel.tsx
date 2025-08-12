import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Bug, Database, Users, RefreshCw } from 'lucide-react';
import { accountsDB } from '../services/accountsDB';
import { enterpriseDB } from '../utils/enterpriseDB';
import { syncExistingUsers, forceSyncUser } from '../utils/userSync';

const UserDebugPanel: React.FC = () => {
  const [accountsDBUsers, setAccountsDBUsers] = useState<any[]>([]);
  const [enterpriseDBUsers, setEnterpriseDBUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Carregar do accountsDB
      const accounts = accountsDB.getAllAccounts();
      console.log('🔍 AccountsDB users:', accounts);
      setAccountsDBUsers(accounts);

      // Carregar do enterpriseDB
      await enterpriseDB.init();
      const users = await enterpriseDB.getAllFromStore('users');
      console.log('🔍 EnterpriseDB users:', users);
      setEnterpriseDBUsers(users);

      // Verificar localStorage também
      const userData = localStorage.getItem('userData');
      const lastUser = localStorage.getItem('diario_last_user');
      console.log('🔍 LocalStorage userData:', userData);
      console.log('🔍 LocalStorage lastUser:', lastUser);

    } catch (error) {
      console.error('Erro ao carregar dados de debug:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncAll = async () => {
    setIsLoading(true);
    try {
      await syncExistingUsers();
      await loadData();
    } catch (error) {
      console.error('Erro na sincronização:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceSyncUser = async (email: string) => {
    setIsLoading(true);
    try {
      await forceSyncUser(email);
      await loadData();
    } catch (error) {
      console.error('Erro na sincronização forçada:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-orange-500" />
            Debug - Estado dos Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button onClick={loadData} disabled={isLoading}>
              <Database className="w-4 h-4 mr-2" />
              Recarregar
            </Button>
            <Button onClick={handleSyncAll} disabled={isLoading} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Sincronizar Todos
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AccountsDB */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  AccountsDB ({accountsDBUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {accountsDBUsers.map((user, index) => (
                    <div key={index} className="p-2 bg-blue-50 rounded text-xs">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-gray-600">{user.email}</div>
                      <div className="text-gray-500">ID: {user.id}</div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-1"
                        onClick={() => handleForceSyncUser(user.email)}
                      >
                        Sincronizar
                      </Button>
                    </div>
                  ))}
                  {accountsDBUsers.length === 0 && (
                    <div className="text-gray-500 text-center py-4">
                      Nenhum usuário no AccountsDB
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* EnterpriseDB */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-green-500" />
                  EnterpriseDB ({enterpriseDBUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {enterpriseDBUsers.map((user, index) => (
                    <div key={index} className="p-2 bg-green-50 rounded text-xs">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-gray-600">{user.email}</div>
                      <div className="text-gray-500">ID: {user.id}</div>
                      <div className="text-gray-500">
                        Status: {user.isActive ? '✅ Ativo' : '❌ Inativo'}
                      </div>
                    </div>
                  ))}
                  {enterpriseDBUsers.length === 0 && (
                    <div className="text-gray-500 text-center py-4">
                      Nenhum usuário no EnterpriseDB
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
              <li>• AccountsDB: {accountsDBUsers.length} usuários (sistema de login)</li>
              <li>• EnterpriseDB: {enterpriseDBUsers.length} usuários (gerenciamento admin)</li>
              <li>• Diferença: {Math.abs(accountsDBUsers.length - enterpriseDBUsers.length)} usuários</li>
              {accountsDBUsers.length > enterpriseDBUsers.length && (
                <li className="text-red-600">⚠️ Há usuários não sincronizados!</li>
              )}
              {accountsDBUsers.length === enterpriseDBUsers.length && accountsDBUsers.length > 0 && (
                <li className="text-green-600">✅ Usuários sincronizados</li>
              )}
              {accountsDBUsers.length === 0 && enterpriseDBUsers.length === 0 && (
                <li className="text-red-600">❌ Nenhum usuário encontrado em ambos os bancos!</li>
              )}
              <li className="text-blue-600">📊 Usuário atual: {JSON.parse(localStorage.getItem('userData') || '{}').name || 'Não logado'}</li>
            </ul>
            
            <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
              <strong>Ações de Correção:</strong>
              <br />1. Clique em "Sincronizar Todos" se houver diferença
              <br />2. Se ainda não aparecer, clique em "Forçar Sync" em um usuário específico
              <br />3. Recarregue a página de gerenciamento após sincronizar
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDebugPanel;