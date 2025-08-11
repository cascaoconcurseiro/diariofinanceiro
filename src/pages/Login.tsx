import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { TEST_USERS, handleAuthError } from '@/services/authService';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { login, isAuthenticated } = useAuth();
  const location = useLocation();

  // If already authenticated, redirect to intended page or home
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await login(email, password);
      setSuccess('Login realizado com sucesso! Redirecionando...');
      
      // Redirect will happen automatically via AuthContext
      setTimeout(() => {
        const from = location.state?.from?.pathname || '/';
        window.location.href = from;
      }, 1500);
    } catch (err: any) {
      const authError = handleAuthError(err);
      setError(authError.message);
    } finally {
      setLoading(false);
    }
  };

  const fillTestUser = (userId: string) => {
    const user = TEST_USERS.find(u => u.id === userId);
    if (user) {
      setEmail(user.email);
      setPassword(user.password);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Diário Financeiro</CardTitle>
          <CardDescription className="text-center">
            Faça login para acessar suas finanças
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription className="text-green-600">{success}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="text-sm text-gray-600 mb-3 font-medium">👥 Usuários de teste:</div>
            <div className="space-y-2">
              {TEST_USERS.map((user) => (
                <Button
                  key={user.id}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs justify-start"
                  onClick={() => fillTestUser(user.id)}
                  disabled={loading}
                >
                  <div className="text-left">
                    <div className="font-medium">👤 {user.name}</div>
                    <div className="text-gray-500">{user.description}</div>
                  </div>
                </Button>
              ))}
            </div>
            <div className="mt-3 text-xs text-gray-500">
              💡 Clique em um usuário para preencher automaticamente
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Não tem conta?{' '}
              <a href="/register" className="text-blue-600 hover:underline">
                Registre-se
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;