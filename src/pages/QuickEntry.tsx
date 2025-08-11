
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUnifiedFinancialSystem } from '../hooks/useUnifiedFinancialSystem';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../components/ui/use-toast';
import { formatCurrency } from '../utils/currencyUtils';
import { useIsMobile } from '../hooks/useMediaQuery';
import TransactionForm from '../components/TransactionForm';
import TransactionsList from '../components/TransactionsList';

const QuickEntry = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const {
    addTransaction,
    getTransactionsByDate,
    deleteTransaction
  } = useUnifiedFinancialSystem();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [transactionType, setTransactionType] = useState<'entrada' | 'saida' | 'diario'>('entrada');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [editingTransactionData, setEditingTransactionData] = useState<any>(null);

  // Helper function to get type label
  const getTypeLabel = (type: 'entrada' | 'saida' | 'diario') => {
    switch (type) {
      case 'entrada': return 'Entrada';
      case 'saida': return 'Saída';
      case 'diario': return 'Diário';
      default: return type;
    }
  };

  // Initialize date from URL params if provided - FIXED date parsing
  useEffect(() => {
    const dateParam = searchParams.get('date');
    const editParam = searchParams.get('edit');
    
    if (dateParam) {
      // Parse date correctly to avoid timezone issues
      const [year, month, day] = dateParam.split('-').map(Number);
      const correctDate = new Date(year, month - 1, day); // month - 1 because Date uses 0-based months
      console.log('📅 Setting date from URL param:', dateParam, '→', correctDate);
      setSelectedDate(correctDate);
    }

    // Check if editing a specific transaction
    if (editParam) {
      const dateString = dateParam || format(selectedDate, 'yyyy-MM-dd');
      const transactions = getTransactionsByDate(dateString);
      const transactionToEdit = transactions.find(t => t.id === editParam);
      
      if (transactionToEdit) {
        console.log('✏️ Loading transaction for edit:', transactionToEdit);
        setEditingTransaction(editParam);
        setEditingTransactionData(transactionToEdit);
        
        // Set form values
        setTransactionType(transactionToEdit.type);
        setAmount(transactionToEdit.amount.toString().replace('.', ','));
        setDescription(transactionToEdit.description);
      }
    }

    // Update document title
    document.title = editParam ? 'Editar Lançamento - Diário Financeiro' : 'Lançamento Rápido - Diário Financeiro';
  }, [searchParams, getTransactionsByDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount.replace(',', '.')) <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, insira um valor válido.",
        variant: "destructive"
      });
      return;
    }

    // FIXED: Use correct date formatting to avoid timezone issues
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    const numericAmount = parseFloat(amount.replace(',', '.'));

    console.log('🚀 Submitting transaction with CORRECT date:', { 
      date: dateString, 
      selectedDate: selectedDate,
      type: transactionType, 
      amount: numericAmount, 
      description 
    });

    if (editingTransaction) {
      console.log('✏️ Updating existing transaction:', editingTransaction);
      
      // For now, delete old and create new (simple approach)
      const deleteSuccess = deleteTransaction(editingTransaction);
      if (deleteSuccess) {
        const transactionId = addTransaction(
          dateString,
          description.trim() || `${getTypeLabel(transactionType)} - ${formatCurrency(numericAmount)}`,
          numericAmount,
          transactionType,
          editingTransactionData?.category,
          editingTransactionData?.isRecurring || false,
          editingTransactionData?.recurringId,
          editingTransactionData?.source || 'manual'
        );
        
        if (transactionId) {
          toast({
            title: "Sucesso",
            description: "Lançamento atualizado com sucesso!"
          });
          
          setEditingTransaction(null);
          setEditingTransactionData(null);
          
          // Remove edit parameter from URL
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete('edit');
          navigate(`/quick-entry?${newSearchParams.toString()}`, { replace: true });
        } else {
          toast({
            title: "Erro",
            description: "Falha ao atualizar o lançamento.",
            variant: "destructive"
          });
          return;
        }
      } else {
        toast({
          title: "Erro",
          description: "Falha ao atualizar o lançamento.",
          variant: "destructive"
        });
        return;
      }
    } else {
      console.log('➕ Adding new transaction using UNIFIED system');
      
      const transactionId = addTransaction(
        dateString,
        description.trim() || `${getTypeLabel(transactionType)} - ${formatCurrency(numericAmount)}`,
        numericAmount,
        transactionType,
        undefined, // category
        false, // isRecurring
        undefined, // recurringId
        'quick-entry' // source
      );
      
      if (transactionId) {
        toast({
          title: "Sucesso",
          description: "Lançamento adicionado com sucesso!"
        });
      } else {
        toast({
          title: "Erro",
          description: "Falha ao adicionar o lançamento.",
          variant: "destructive"
        });
        return;
      }
    }

    // Reset form
    setAmount('');
    setDescription('');
  };

  const handleEdit = (transaction: any) => {
    console.log('✏️ Editing transaction:', transaction);
    
    setEditingTransaction(transaction.id);
    setEditingTransactionData(transaction);
    
    // Parse transaction date correctly
    const [year, month, day] = transaction.date.split('-').map(Number);
    const correctDate = new Date(year, month - 1, day);
    
    setSelectedDate(correctDate);
    setTransactionType(transaction.type);
    setAmount(transaction.amount.toString().replace('.', ','));
    setDescription(transaction.description);
  };

  const handleDelete = (id: string, transactionDate: string) => {
    console.log('🗑️ Deleting transaction:', id);
    const deleteSuccess = deleteTransaction(id);
    
    if (deleteSuccess) {
      toast({
        title: "Sucesso",
        description: "Lançamento excluído com sucesso!"
      });
    } else {
      toast({
        title: "Erro",
        description: "Falha ao excluir o lançamento.",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    console.log('❌ Canceling edit');
    setEditingTransaction(null);
    setEditingTransactionData(null);
    setAmount('');
    setDescription('');
    
    // Remove edit parameter from URL
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('edit');
    navigate(`/quick-entry?${newSearchParams.toString()}`, { replace: true });
  };

  // Get transactions for selected date
  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const todayTransactions = getTransactionsByDate(dateString);
  console.log('📋 Transactions for', dateString, ':', todayTransactions.length, 'transactions found');

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <h1 className="text-2xl font-bold text-gray-900">Lançamento Rápido</h1>
              <p className="text-gray-600">Diário Financeiro - Sincronização Automática</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <TransactionForm
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            transactionType={transactionType}
            setTransactionType={setTransactionType}
            amount={amount}
            setAmount={setAmount}
            description={description}
            setDescription={setDescription}
            editingTransaction={editingTransaction}
            editingTransactionData={editingTransactionData}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />

          {/* Transactions List */}
          <TransactionsList
            selectedDate={selectedDate}
            transactions={todayTransactions}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
};

export default QuickEntry;
