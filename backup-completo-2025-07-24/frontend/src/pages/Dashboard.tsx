import React, { useState } from 'react';

import { useUnifiedFinancialSystem } from '../hooks/useUnifiedFinancialSystem';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../components/ui/use-toast';
import { formatCurrency as formatCurrencyUtil } from '../utils/currencyUtils';

const Dashboard = () => {

  const { transactions, addTransaction, getMonthlyTotals, selectedYear, selectedMonth } = useUnifiedFinancialSystem();
  const { toast } = useToast();

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: 'entrada' as 'entrada' | 'saida',
    category: 'Geral'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      addTransaction(
        formData.date,
        formData.description,
        parseFloat(formData.amount),
        formData.type,
        formData.category
      );

      toast({
        title: "Sucesso",
        description: "Transação adicionada com sucesso!"
      });

      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        type: 'entrada',
        category: 'Geral'
      });
      setShowAddForm(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar transação",
        variant: "destructive"
      });
    }
  };

  const monthlyTotals = getMonthlyTotals(selectedYear, selectedMonth);
  const balance = monthlyTotals.saldoFinal;
  const entradas = transactions.filter(t => t.type === 'entrada').reduce((sum, t) => sum + t.amount, 0);
  const saidas = transactions.filter(t => t.type === 'saida').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">💰 Diário Financeiro</h1>
            <p className="text-gray-600">Sistema Financeiro Local</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Saldo Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrencyUtil(balance)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Entradas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrencyUtil(entradas)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Saídas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrencyUtil(saidas)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Transaction Button */}
        <div className="mb-6">
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cancelar' : '+ Nova Transação'}
          </Button>
        </div>

        {/* Add Transaction Form */}
        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Nova Transação</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Tipo</Label>
                    <Select value={formData.type} onValueChange={(value: 'entrada' | 'saida') => setFormData({...formData, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada">💰 Entrada</SelectItem>
                        <SelectItem value="saida">💸 Saída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Ex: Salário, Supermercado, etc."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Valor</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      placeholder="0,00"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Trabalho">💼 Trabalho</SelectItem>
                        <SelectItem value="Alimentação">🍽️ Alimentação</SelectItem>
                        <SelectItem value="Transporte">🚗 Transporte</SelectItem>
                        <SelectItem value="Moradia">🏠 Moradia</SelectItem>
                        <SelectItem value="Educação">📚 Educação</SelectItem>
                        <SelectItem value="Saúde">🏥 Saúde</SelectItem>
                        <SelectItem value="Lazer">🎮 Lazer</SelectItem>
                        <SelectItem value="Utilidades">⚡ Utilidades</SelectItem>
                        <SelectItem value="Geral">📋 Geral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    Salvar
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>Suas Transações</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                Nenhuma transação encontrada. Adicione sua primeira transação!
              </p>
            )}

            {transactions.length > 0 && (
              <div className="space-y-2">
                {transactions
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((transaction) => (
                    <div
                      key={transaction.id}
                      className={`flex justify-between items-center p-3 rounded-lg border ${
                        transaction.type === 'entrada' 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(transaction.date).toLocaleDateString('pt-BR')} • {transaction.category || 'Geral'}
                        </div>
                      </div>
                      <div className={`font-bold ${
                        transaction.type === 'entrada' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'entrada' ? '+' : '-'} {formatCurrencyUtil(transaction.amount)}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;