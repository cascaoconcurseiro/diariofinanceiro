import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../components/ui/use-toast';
import { accountsDB } from '../services/accountsDB';
import { validateEmail, validatePassword, validateName } from '../utils/security';
import { rateLimiter } from '../utils/rateLimit';

const Login = () => {
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [keepConnected, setKeepConnected] = useState(true);
  // ❌ REMOVIDO: Lista de emails é vulnerabilidade de privacidade

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validação mínima
    if (!formData.email || !formData.password) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    if (!isLogin && !formData.name) {
      toast({
        title: "Erro",
        description: "Preencha o nome",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    try {
      let success = false;
      
      if (isLogin) {
        success = await login(formData.email, formData.password);
        if (success) {
          toast({
            title: "Sucesso",
            description: `Bem-vindo de volta! ${keepConnected ? 'Você permanecerá conectado.' : ''}`
          });
        } else {
          toast({
            title: "Erro",
            description: "Email ou senha incorretos",
            variant: "destructive"
          });
        }
      } else {
        success = await register(formData.email, formData.password, formData.name);
        if (success) {
          toast({
            title: "Sucesso",
            description: `Conta criada com sucesso! Bem-vindo, ${formData.name}!`
          });
        } else {
          toast({
            title: "Erro",
            description: "Este email já está em uso",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro de conexão",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            💰 Diário Financeiro
          </CardTitle>
          <p className="text-gray-600">
            {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Seu nome"
                  required
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="seu@email.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Senha</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Sua senha"
                required
              />
            </div>

            {isLogin && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="keepConnected"
                  checked={keepConnected}
                  onChange={(e) => setKeepConnected(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="keepConnected" className="text-sm text-gray-600">
                  Manter conectado
                </label>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
            </Button>
          </form>
          

          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:underline"
            >
              {isLogin ? 'Não tem conta? Criar conta' : 'Já tem conta? Fazer login'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;