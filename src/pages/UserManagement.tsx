import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Users, Edit, Trash2, Lock, Unlock, Eye, EyeOff } from 'lucide-react';
import { neonDB } from '../services/neonDatabase';
import { useToast } from '../hooks/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  is_blocked?: boolean;
}

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const userList = await neonDB.getAllUsers();
      setUsers(userList);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!editingUser || !newPassword) return;

    try {
      const success = await neonDB.updateUserPassword(editingUser.id, newPassword);
      if (success) {
        toast({
          title: "Sucesso",
          description: "Senha atualizada com sucesso"
        });
        setEditingUser(null);
        setNewPassword('');
      } else {
        toast({
          title: "Erro",
          description: "Erro ao atualizar senha",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar senha",
        variant: "destructive"
      });
    }
  };

  const handleBlockUser = async (userId: string, block: boolean) => {
    try {
      const success = await neonDB.blockUser(userId, block);
      if (success) {
        toast({
          title: "Sucesso",
          description: `Usuário ${block ? 'bloqueado' : 'desbloqueado'} com sucesso`
        });
        loadUsers();
      } else {
        toast({
          title: "Erro",
          description: `Erro ao ${block ? 'bloquear' : 'desbloquear'} usuário`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao bloquear/desbloquear usuário:', error);
      toast({
        title: "Erro",
        description: `Erro ao ${block ? 'bloquear' : 'desbloquear'} usuário`,
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const success = await neonDB.deleteUser(userId);
      if (success) {
        toast({
          title: "Sucesso",
          description: "Usuário excluído com sucesso"
        });
        loadUsers();
      } else {
        toast({
          title: "Erro",
          description: "Erro ao excluir usuário",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir usuário",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando usuários...</p>
        </div>
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
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                Gerenciamento de Usuários
              </h1>
              <p className="text-gray-600">Gerencie usuários, senhas e acessos</p>
            </div>
          </div>
        </div>

        {/* Lista de Usuários */}
        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id} className={`${user.is_blocked ? 'bg-red-50 border-red-200' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{user.name}</h3>
                      {user.is_blocked && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          Bloqueado
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-500">
                      Criado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingUser(user)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="w-4 h-4" />
                      Senha
                    </Button>
                    
                    <Button
                      variant={user.is_blocked ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleBlockUser(user.id, !user.is_blocked)}
                      className={`flex items-center gap-1 ${
                        user.is_blocked 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'text-orange-600 border-orange-600 hover:bg-orange-50'
                      }`}
                    >
                      {user.is_blocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      {user.is_blocked ? 'Desbloquear' : 'Bloquear'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      className="flex items-center gap-1 text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {users.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum usuário encontrado</p>
            </CardContent>
          </Card>
        )}

        {/* Modal de Edição de Senha */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Alterar Senha - {editingUser.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nova senha (mínimo 6 caracteres)"
                    className="pr-10"
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
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdatePassword}
                    disabled={newPassword.length < 6}
                    className="flex-1"
                  >
                    Atualizar Senha
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingUser(null);
                      setNewPassword('');
                      setShowPassword(false);
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;