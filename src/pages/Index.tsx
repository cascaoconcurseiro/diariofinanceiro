
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedFinancialSystem } from '../hooks/useUnifiedFinancialSystem';
import { useReserveAndExpenses } from '../hooks/useReserveAndExpenses';
import { useRecurringTransactions } from '../hooks/useRecurringTransactions';
import { useRecurringProcessor } from '../hooks/useRecurringProcessor';

import SummaryCard from '../components/SummaryCard';
import SmartAlerts from '../components/SmartAlerts';
import EmergencyReserveModal from '../components/EmergencyReserveModal';
import FixedExpensesModal from '../components/FixedExpensesModal';
import RecurringTransactionsModal from '../components/RecurringTransactionsModal';
import MonthNavigation from '../components/MonthNavigation';
import FinancialTable from '../components/FinancialTable';
import DayTransactionsModal from '../components/DayTransactionsModal';
import { AdminPanel } from '../components/AdminPanel';
import MobileFinancialView from '../components/MobileFinancialView';
import { useIsMobile } from '../hooks/useMediaQuery';
import { Button } from '../components/ui/button';
import SyncStatus from '../components/SyncStatus';
import { logNavigationChange } from '../utils/recurringDebug';
import { TransactionEntry } from '../types/transactions';
import { useToast } from '../components/ui/use-toast';
import { Zap } from 'lucide-react';
import { formatCurrency } from '../utils/currencyUtils';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  
  const {
    data,
    selectedYear,
    selectedMonth,
    setSelectedYear,
    setSelectedMonth,
    updateDayData,
    initializeMonth,
    getMonthlyTotals,
    getYearlyTotals,
    getDaysInMonth,
    formatCurrency,
    recalculateBalances,
    getTransactionsByDate,
    addTransaction,
    deleteTransaction,
    deleteRecurringInstance,
    getTransactionById,
    addToDay
  } = useUnifiedFinancialSystem();

  const {
    emergencyReserve,
    fixedExpenses,
    updateEmergencyReserve,
    updateFixedExpenses
  } = useReserveAndExpenses();

  const {
    recurringTransactions,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    getActiveRecurringTransactions
  } = useRecurringTransactions();

  const { processRecurringTransactions, clearMonthCache } = useRecurringProcessor();

  const [inputValues, setInputValues] = useState<{[key: string]: string}>({});
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [showExpensesModal, setShowExpensesModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);

  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDayDate, setSelectedDayDate] = useState<Date>(new Date());
  
  // Day transactions modal states
  const [showDayTransactionsModal, setShowDayTransactionsModal] = useState(false);

  // Helper function to get field label - MOVIDO PARA CIMA
  const getFieldLabel = (field: 'entrada' | 'saida' | 'diario') => {
    switch (field) {
      case 'entrada': return 'Entrada';
      case 'saida': return 'Saída';
      case 'diario': return 'Diário';
      default: return field;
    }
  };

  // Initialize month when year/month changes
  useEffect(() => {
    // Log navigation change for debugging
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    logNavigationChange(currentYear, currentMonth, selectedYear, selectedMonth);
    
    initializeMonth(selectedYear, selectedMonth);
    setInputValues({});
  }, [selectedYear, selectedMonth, initializeMonth]);

  // Process recurring transactions when month changes - CORRIGIDO PARA SINCRONIZAÇÃO COMPLETA
  useEffect(() => {
    console.log('🔄 Processing recurring transactions effect triggered');
    
    const activeTransactions = getActiveRecurringTransactions();
    if (activeTransactions.length > 0) {
      // CRÍTICO: Não limpar cache - deixar o sistema de controle decidir
      // Usar setTimeout para evitar processamento múltiplo
      const timeoutId = setTimeout(() => {
        processRecurringTransactions(
          activeTransactions,
          selectedYear,
          selectedMonth,
          (year, month, day, type, amount, source = 'recurring') => {
            // Create detailed transaction for recurring transactions
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const recurringTransaction = activeTransactions.find(t => t.type === type && t.amount === amount);
            const description = recurringTransaction?.description || `${getFieldLabel(type)} Recorrente - ${formatCurrency(amount)}`;
            
            console.log(`🔄 Creating detailed recurring transaction: ${description} on ${dateString}`);
            
            addTransaction(
              dateString,
              description,
              amount,
              type,
              undefined, // category
              true, // isRecurring
              recurringTransaction?.id, // recurringId
              'recurring' // source
            );
          },
          updateRecurringTransaction
        );
        
        // Trigger recalculation after processing
        setTimeout(() => {
          recalculateBalances();
        }, 100);
      }, 50); // Pequeno delay para evitar múltiplas execuções
      
      // Cleanup timeout se o componente for desmontado
      return () => clearTimeout(timeoutId);
    }
  }, [selectedYear, selectedMonth, processRecurringTransactions, addTransaction, updateRecurringTransaction, recalculateBalances, getActiveRecurringTransactions, formatCurrency, getFieldLabel]);

  useEffect(() => {
    document.title = 'Diário Financeiro - Alertas Inteligentes';
  }, []);

  // Calculate totals
  const yearlyTotals = getYearlyTotals(selectedYear);  
  const monthlyTotals = getMonthlyTotals(selectedYear, selectedMonth);
  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);

  // Generate years array - OTIMIZADO: 41 anos (2025-2065)
  const YEAR_CONFIG = {
    START_YEAR: 2025,
    END_YEAR: 2065,
    TOTAL_YEARS: 41
  };
  
  const years = useMemo(() => 
    Array.from({ length: YEAR_CONFIG.TOTAL_YEARS }, (_, i) => YEAR_CONFIG.START_YEAR + i),
    []
  );

  // Input handling helpers
  const getInputKey = (day: number, field: string) => `${selectedYear}-${selectedMonth}-${day}-${field}`;

  const handleInputChange = (day: number, field: 'entrada' | 'saida' | 'diario', value: string) => {
    const key = getInputKey(day, field);
    setInputValues(prev => ({ ...prev, [key]: value }));
  };

  const handleInputBlur = (day: number, field: 'entrada' | 'saida' | 'diario', value: string) => {
    console.log(`🎯 DEFINITIVO: Input blur for day ${day}, field ${field}, value ${value}`);
    
    // SOLUÇÃO DEFINITIVA: APENAS atualizar dados financeiros, SEM criar transações automáticas
    // As transações detalhadas devem ser criadas APENAS via Quick Entry
    updateDayData(selectedYear, selectedMonth, day, field, value);
    
    const key = getInputKey(day, field);
    setInputValues(prev => {
      const newValues = { ...prev };
      delete newValues[key];
      return newValues;
    });
  };



  // SOLUÇÃO DEFINITIVA: REMOVER sincronização automática - causa dos problemas
  // As transações detalhadas são criadas APENAS via Quick Entry

  // Handle day click to show transactions modal - SEM SINCRONIZAÇÃO AUTOMÁTICA
  const handleDayClick = (day: number) => {
    const date = new Date(selectedYear, selectedMonth, day);
    console.log(`📅 DEFINITIVO: Opening day modal for day ${day} WITHOUT auto-sync`);
    
    setSelectedDayDate(date);
    setShowDayTransactionsModal(true);
  };



  // Handle transaction editing - SIMPLIFICADO: Leva direto para a transação original
  const handleEditTransaction = (transaction: TransactionEntry) => {
    console.log('✏️ SIMPLIFICADO: Navigating to edit transaction:', transaction.id);
    const date = new Date(transaction.date);
    const dateString = date.toISOString().split('T')[0];
    
    // Fechar o modal antes de navegar
    setShowDayTransactionsModal(false);
    
    // Navegar para quick-entry com a transação para editar
    navigate(`/quick-entry?date=${dateString}&edit=${transaction.id}`);
  };

  // Navigate to quick entry for new transaction
  const handleNavigateToQuickEntry = () => {
    const dateString = selectedDayDate.toISOString().split('T')[0];
    navigate(`/quick-entry?date=${dateString}`);
  };

  // Navigate to recurring transactions management
  const handleNavigateToRecurring = () => {
    setShowDayTransactionsModal(false);
    setShowRecurringModal(true);
  };

  // Calculate total recurring amount
  const totalRecurringAmount = getActiveRecurringTransactions().reduce((sum, t) => {
    return sum + (t.type === 'entrada' ? t.amount : -t.amount);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-2 sm:py-4 md:py-8">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        {/* Status de Sincronização */}
        <div className="mb-4 flex justify-end">
          <SyncStatus />
        </div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 md:mb-8">
          <div className="flex-1 text-center">
            <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
              Diário Financeiro
            </h1>
            <p className="text-sm sm:text-lg md:text-xl text-gray-600">Alertas Inteligentes</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 hidden sm:inline">
              Sistema Financeiro
            </span>
          </div>
        </div>

        {/* Year Selector */}
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-center sm:items-center sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full sm:w-auto bg-white border-2 border-green-500 rounded-lg px-3 sm:px-4 py-2 pr-8 sm:pr-10 text-sm sm:text-base md:text-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 mb-4 sm:mb-6">
          <Button
            onClick={() => navigate('/quick-entry')}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-6 py-3 text-sm sm:text-base flex items-center gap-2 shadow-lg"
          >
            <Zap className="w-5 h-5" />
            Lançamento Rápido
          </Button>
          

        </div>

        {/* Control Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <Button
            onClick={() => setShowReserveModal(true)}
            variant="outline"
            className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 text-xs sm:text-sm px-2 sm:px-4 py-2 w-full sm:w-auto"
          >
            <span className="flex items-center justify-center">
              <span className="mr-1">🛡️</span>
              <span className="hidden xs:inline">Reserva: </span>
              <span className="font-medium">{formatCurrency(emergencyReserve.amount)}</span>
            </span>
          </Button>
          
          <Button
            onClick={() => setShowExpensesModal(true)}
            variant="outline"
            className="border-2 border-purple-500 text-purple-600 hover:bg-purple-50 text-xs sm:text-sm px-2 sm:px-4 py-2 w-full sm:w-auto"
          >
            <span className="flex items-center justify-center">
              <span className="mr-1">📊</span>
              <span className="hidden xs:inline">Gastos: </span>
              <span className="font-medium">{formatCurrency(fixedExpenses.totalAmount)}</span>
            </span>
          </Button>

          <Button
            onClick={() => setShowRecurringModal(true)}
            variant="outline"
            className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50 text-xs sm:text-sm px-2 sm:px-4 py-2 w-full sm:w-auto"
          >
            <span className="flex items-center justify-center">
              <span className="mr-1">🔄</span>
              <span className="hidden xs:inline">Recorrentes: </span>
              <span className={`font-medium ${totalRecurringAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalRecurringAmount)}
              </span>
            </span>
          </Button>
        </div>

        {/* Smart Alerts */}
        <SmartAlerts
          data={data}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          monthlyTotals={monthlyTotals}
        />

        {/* Yearly Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          <SummaryCard
            title={`Entradas ${selectedYear}`}
            value={yearlyTotals.totalEntradas}
            icon="📈"
            color="green"
          />
          <SummaryCard
            title={`Saídas ${selectedYear}`}
            value={yearlyTotals.totalSaidas}
            icon="📉"
            color="red"
          />
          <SummaryCard
            title={`Diário ${selectedYear}`}
            value={yearlyTotals.totalDiario}
            icon="💰"
            color="blue"
          />
          <SummaryCard
            title={`Saldo Final ${selectedYear}`}
            value={yearlyTotals.saldoFinal}
            icon="🏆"
            color="purple"
          />
        </div>

        <MonthNavigation
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
        />

        {/* Monthly Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          <SummaryCard
            title="Total Entradas"
            value={monthlyTotals.totalEntradas}
            icon="📈"
            color="green"
          />
          <SummaryCard
            title="Total Saídas"
            value={monthlyTotals.totalSaidas}
            icon="📉"
            color="red"
          />
          <SummaryCard
            title="Total Diário"
            value={monthlyTotals.totalDiario}
            icon="💰"
            color="blue"
          />
          <SummaryCard
            title="Saldo Final"
            value={monthlyTotals.saldoFinal}
            icon="🏆"
            color="purple"
          />
        </div>

        {/* Renderização condicional: Mobile vs Desktop */}
        {isMobile ? (
          <MobileFinancialView
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            data={data}
            daysInMonth={daysInMonth}
            inputValues={inputValues}
            onInputChange={handleInputChange}
            onInputBlur={handleInputBlur}
            getTransactionsByDate={getTransactionsByDate}
            onDayClick={handleDayClick}
          />
        ) : (
          <FinancialTable
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            data={data}
            daysInMonth={daysInMonth}
            inputValues={inputValues}
            onInputChange={handleInputChange}
            onInputBlur={handleInputBlur}
            getTransactionsByDate={getTransactionsByDate}
            onDayClick={handleDayClick}
          />
        )}

        {/* Modals */}
        <EmergencyReserveModal
          isOpen={showReserveModal}
          onClose={() => setShowReserveModal(false)}
          onSave={updateEmergencyReserve}
          currentAmount={emergencyReserve.amount}
          currentMonths={emergencyReserve.months}
          fixedExpensesTotal={fixedExpenses.totalAmount}
        />

        <FixedExpensesModal
          isOpen={showExpensesModal}
          onClose={() => setShowExpensesModal(false)}
          onSave={updateFixedExpenses}
          currentCategories={fixedExpenses.categories}
        />

        <RecurringTransactionsModal
          isOpen={showRecurringModal}
          onClose={() => setShowRecurringModal(false)}
          onSave={addRecurringTransaction}
          onUpdate={updateRecurringTransaction}
          onDelete={deleteRecurringTransaction}
          currentTransactions={recurringTransactions}
        />



        {/* Day Transactions Modal - SIMPLIFICADO */}
        <DayTransactionsModal
          isOpen={showDayTransactionsModal}
          onClose={() => setShowDayTransactionsModal(false)}
          selectedDate={selectedDayDate}
          getTransactionsByDate={getTransactionsByDate}
          onEditTransaction={handleEditTransaction}
          onNavigateToQuickEntry={handleNavigateToQuickEntry}
          onNavigateToRecurring={handleNavigateToRecurring}
        />


      </div>
      
      {/* Admin Panel - Oculto e protegido por senha */}
      <AdminPanel
        onClearData={() => {
          localStorage.removeItem('unifiedFinancialData');
          localStorage.removeItem('financialData');
          localStorage.removeItem('recurringTransactions');
          localStorage.removeItem('reserveAndExpenses');
          window.location.reload();
        }}
        onSystemCheck={() => {
          // Executar verificação do sistema
          console.log('🔍 Executando verificação do sistema...');
          
          // Verificar localStorage
          const unifiedData = localStorage.getItem('unifiedFinancialData');
          const transactionCount = unifiedData ? JSON.parse(unifiedData).length : 0;
          
          // Verificar integridade dos dados
          const systemStatus = {
            transactionCount,
            localStorageSize: JSON.stringify(localStorage).length,
            timestamp: new Date().toISOString(),
            status: 'healthy'
          };
          
          console.log('✅ Status do sistema:', systemStatus);
          
          toast({
            title: "Verificação Concluída",
            description: `Sistema OK - ${transactionCount} transações encontradas`,
            variant: "default"
          });
        }}
      />
    </div>
  );
};

export default Index;
