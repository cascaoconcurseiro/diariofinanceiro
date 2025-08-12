import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { ArrowLeft, Users, Search, Shield, Trash2, Eye, Ban, RefreshCw, Bug } from 'lucide-react';
import { enterpriseDB } from '../utils/enterpriseDB';
import { syncExistingUsers } from '../utils/userSync';
import UserDebugPanel from '../components/UserDebugPanel';

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
  loginAttempts: number;
  role: 'user' | 'admin';
}

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    blocked: 0,
    admins: 0
  });
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      await enterpriseDB.init();
      
      // ✅ FORÇAR SINCRONIZAÇÃO IMEDIATA
      console.log('🔄 Forçando sincronização de usuários...');
      await syncExistingUsers();
      
      // Aguardar um pouco para garantir sincronização
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Carregar usuários reais do banco
      const realUsers = await enterpriseDB.getAllFromStore('users');
      console.log('📊 Usuários carregados do enterpriseDB:', realUsers.length);
      
      // Converter para formato da interface
      const formattedUsers: User[] = realUsers.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin || null,
        isActive: user.isActive !== false,
        loginAttempts: user.loginAttempts || 0,
        role: user.role || 'user'
      }));

      setUsers(formattedUsers);
      console.log('✅ Usuários formatados:', formattedUsers);
      
      // Calcular estatísticas dos usuários reais
      const newStats = {
        total: formattedUsers.length,
        active: formattedUsers.filter(u => u.isActive).length,
        blocked: formattedUsers.filter(u => !u.isActive).length,
        admins: formattedUsers.filter(u => u.role === 'admin').length
      };
      setStats(newStats);
      
      if (formattedUsers.length === 0) {
        console.log('⚠️ Nenhum usuário encontrado - tentando sincronização forçada...');
        // Tentar sincronização forçada novamente
        await syncExistingUsers();
        const retryUsers = await enterpriseDB.getAllFromStore('users');
        if (retryUsers.length > 0) {
          const retryFormatted = retryUsers.map(user => ({
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin || null,
            isActive: user.isActive !== false,
            loginAttempts: user.loginAttempts || 0,
            role: user.role || 'user'
          }));
          setUsers(retryFormatted);
          console.log('✅ Usuários encontrados na segunda tentativa:', retryFormatted.length);
        }
      }

    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    if (!searchTerm) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const handleBlockUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const confirmMessage = `${user.isActive ? 'Bloquear' : 'Desbloquear'} usuário "${user.name}"?`;
    
    if (window.confirm(confirmMessage)) {
      try {
        // Atualizar no banco
        await enterpriseDB.updateUser(userId, { isActive: !user.isActive });
        
        // Atualizar estado local
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, isActive: !u.isActive } : u
        ));
        
        // Log da ação
        await enterpriseDB.logAction(
          'admin', 
          user.isActive ? 'user.blocked' : 'user.unblocked',
          { targetUserId: userId, targetUserEmail: user.email }
        );
        
      } catch (error) {
        alert('Erro ao atualizar usuário: ' + error);
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const confirmMessage = `ATENÇÃO: Excluir usuário "${user.name}" permanentemente?\n\nEsta ação:\n• Remove o usuário do sistema\n• Exclui TODOS os dados financeiros\n• NÃO PODE ser desfeita\n\nDigite "CONFIRMAR" para prosseguir:`;
    
    const confirmation = prompt(confirmMessage);
    if (confirmation === 'CONFIRMAR') {
      try {
        // Excluir do banco
        await enterpriseDB.deleteUser(userId);
        
        // Excluir transações do usuário
        await enterpriseDB.deleteUserTransactions(userId);
        
        // Atualizar estado local
        setUsers(prev => prev.filter(u => u.id !== userId));
        
        // Log da ação crítica
        await enterpriseDB.logAction(
          'admin',
          'user.deleted',
          { targetUserId: userId, targetUserEmail: user.email }
        );
        
        alert('Usuário excluído permanentemente.');
        
      } catch (error) {
        alert('Erro ao excluir usuário: ' + error);
      }
    }
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'text-red-600 bg-red-100' : 'text-blue-600 bg-blue-100';
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 animate-pulse text-blue-600 mx-auto mb-4" />
          <p>Carregando usuários...</p>
        </div>
      </div>
    );
  }

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
                <Users className="w-6 h-6 text-blue-600" />
                Gestão de Usuários
              </h1>
              <p className="text-gray-600">Administração completa de usuários do sistema</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={loadUsers} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button 
              onClick={async () => {
                setIsLoading(true);
                await syncExistingUsers();
                await loadUsers();
              }} 
              variant="outline"
              className="text-blue-600"
            >
              <Users className="w-4 h-4 mr-2" />
              Sincronizar
            </Button>
            <Button 
              onClick={() => setShowDebug(!showDebug)}
              variant="outline"
              className="text-orange-600"
            >
              <Bug className="w-4 h-4 mr-2" />
              Debug
            </Button>
            <Button 
              onClick={async () => {
                setIsLoading(true);
                try {
                  // Forçar sincronização completa
                  console.log('🔧 Iniciando correção automática...');
                  
                  // 1. Verificar usuário atual
                  const currentUser = JSON.parse(localStorage.getItem('userData') || '{}');
                  if (currentUser.id) {
                    console.log('👤 Usuário atual:', currentUser);
                    
                    // 2. Forçar adição ao enterpriseDB
                    await enterpriseDB.init();
                    const transaction = enterpriseDB['db']!.transaction(['users'], 'readwrite');
                    const store = transaction.objectStore('users');
                    
                    const enterpriseUser = {
                      id: currentUser.id,
                      email: currentUser.email,
                      name: currentUser.name,
                      createdAt: new Date().toISOString(),
                      isActive: true,
                      loginAttempts: 0,
                      role: 'user' as const,
                      lastLogin: new Date().toISOString()
                    };
                    
                    await new Promise<void>((resolve, reject) => {
                      const request = store.put(enterpriseUser); // put para sobrescrever
                      request.onsuccess = () => resolve();
                      request.onerror = () => reject(request.error);
                    });
                    
                    console.log('✅ Usuário adicionado ao enterpriseDB');
                  }
                  
                  // 3. Sincronizar todos os outros
                  await syncExistingUsers();
                  
                  // 4. Recarregar
                  await loadUsers();
                  
                  alert('✅ Correção concluída! Usuários sincronizados.');
                } catch (error) {
                  console.error('Erro na correção:', error);
                  alert('❌ Erro na correção: ' + error);
                } finally {
                  setIsLoading(false);
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={isLoading}
            >
              <Shield className="w-4 h-4 mr-2" />
              Corrigir Agora
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ativos</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <Shield className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Bloqueados</p>
                  <p className="text-2xl font-bold text-red-600">{stats.blocked}</p>
                </div>
                <Ban className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Admins</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
                </div>
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Busca */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Debug Panel */}
        {showDebug && (
          <UserDebugPanel />
        )}

        {/* Lista de Usuários */}
        <Card>
          <CardHeader>
            <CardTitle>Usuários Cadastrados ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Usuário</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Função</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Último Login</th>
                    <th className="text-left p-3">Tentativas</th>
                    <th className="text-left p-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <Users className="w-16 h-16 text-gray-300" />
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              Nenhum usuário encontrado
                            </h3>
                            <p className="text-gray-600 mb-4">
                              Os usuários cadastrados não estão aparecendo no gerenciamento.
                            </p>
                            <div className="bg-blue-50 p-4 rounded-lg text-left max-w-md">
                              <h4 className="font-medium text-blue-800 mb-2">Como corrigir:</h4>
                              <ol className="text-sm text-blue-700 space-y-1">
                                <li>1. Clique em "Corrigir Agora" (botão verde acima)</li>
                                <li>2. Ou clique em "Debug" para ver detalhes</li>
                                <li>3. Ou clique em "Sincronizar" para tentar novamente</li>
                              </ol>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-gray-500">
                              Criado: {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </td>
                        <td className="p-3 text-sm">{user.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {user.role === 'admin' ? 'Admin' : 'Usuário'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.isActive)}`}>
                            {user.isActive ? 'Ativo' : 'Bloqueado'}
                          </span>
                        </td>
                        <td className="p-3 text-sm">
                          {user.lastLogin ? 
                            new Date(user.lastLogin).toLocaleDateString('pt-BR') : 
                            'Nunca'
                          }
                        </td>
                        <td className="p-3">
                          <span className={`font-medium ${user.loginAttempts >= 3 ? 'text-red-600' : 'text-gray-600'}`}>
                            {user.loginAttempts}/5
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBlockUser(user.id)}
                              className={user.isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}
                            >
                              {user.isActive ? <Ban className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                            </Button>
                            
                            {user.role !== 'admin' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserManagement;