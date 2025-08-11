import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ChevronDown, ChevronUp, Plus, Minus, DollarSign } from 'lucide-react';
import { formatCurrency, parseCurrency } from '../utils/currencyUtils';
import { TransactionEntry } from '../types/transactions';
import { useDebounce } from '../hooks/useDebounce';

interface MobileFinancialViewProps {
  selectedYear: number;
  selectedMonth: number;
  data: any;
  daysInMonth: number;
  inputValues: {[key: string]: string};
  onInputChange: (day: number, field: 'entrada' | 'saida' | 'diario', value: string) => void;
  onInputBlur: (day: number, field: 'entrada' | 'saida' | 'diario', value: string) => void;
  getTransactionsByDate: (date: string) => TransactionEntry[];
  onDayClick: (day: number) => void;
}

const MobileFinancialView: React.FC<MobileFinancialViewProps> = ({
  selectedYear,
  selectedMonth,
  data,
  daysInMonth,
  inputValues,
  onInputChange,
  onInputBlur,
  getTransactionsByDate,
  onDayClick
}) => {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [activeInput, setActiveInput] = useState<string | null>(null);

  const toggleDay = (day: number) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(day)) {
      newExpanded.delete(day);
    } else {
      newExpanded.add(day);
    }
    setExpandedDays(newExpanded);
  };

  const getDayData = (day: number) => {
    if (!data[selectedYear] || !data[selectedYear][selectedMonth] || !data[selectedYear][selectedMonth][day]) {
      return { entrada: 'R$ 0,00', saida: 'R$ 0,00', diario: 'R$ 0,00', balance: 0 };
    }
    return data[selectedYear][selectedMonth][day];
  };

  const getDateString = (day: number) => {
    return `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getInputValue = (day: number, field: 'entrada' | 'saida' | 'diario') => {
    const key = `${day}-${field}`;
    if (inputValues[key] !== undefined) {
      return inputValues[key];
    }
    const dayData = getDayData(day);
    const value = parseCurrency(dayData[field]);
    return value > 0 ? value.toFixed(2).replace('.', ',') : '';
  };

  const handleInputChange = (day: number, field: 'entrada' | 'saida' | 'diario', value: string) => {
    onInputChange(day, field, value);
  };

  const handleInputBlur = (day: number, field: 'entrada' | 'saida' | 'diario', value: string) => {
    onInputBlur(day, field, value);
    setActiveInput(null);
  };

  const handleInputFocus = (day: number, field: 'entrada' | 'saida' | 'diario') => {
    setActiveInput(`${day}-${field}`);
  };

  const renderDayCard = (day: number) => {
    const dayData = getDayData(day);
    const dateString = getDateString(day);
    const transactions = getTransactionsByDate(dateString);
    const isExpanded = expandedDays.has(day);
    const hasTransactions = transactions.length > 0;
    const balance = dayData.balance || 0;

    return (
      <Card 
        key={day} 
        className={`mb-3 transition-all duration-200 ${
          hasTransactions ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
        } ${isExpanded ? 'shadow-md' : 'shadow-sm'}`}
      >
        <CardHeader 
          className="pb-2 cursor-pointer"
          onClick={() => toggleDay(day)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              Dia {day}
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${
                balance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(balance)}
              </span>
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>
          {hasTransactions && (
            <div className="text-xs text-blue-600">
              {transactions.length} transação{transactions.length !== 1 ? 'ões' : ''}
            </div>
          )}
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            {/* Inputs de valores */}
            <div className="space-y-3 mb-4">
              {/* Entrada */}
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                  <Plus className="text-green-600" size={16} />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-600 block mb-1">Entrada</label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={getInputValue(day, 'entrada')}
                    onChange={(e) => handleInputChange(day, 'entrada', e.target.value)}
                    onBlur={(e) => handleInputBlur(day, 'entrada', e.target.value)}
                    onFocus={() => handleInputFocus(day, 'entrada')}
                    placeholder="0,00"
                    className="text-right h-10 text-green-600 font-medium"
                  />
                </div>
              </div>

              {/* Saída */}
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                  <Minus className="text-red-600" size={16} />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-600 block mb-1">Saída</label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={getInputValue(day, 'saida')}
                    onChange={(e) => handleInputChange(day, 'saida', e.target.value)}
                    onBlur={(e) => handleInputBlur(day, 'saida', e.target.value)}
                    onFocus={() => handleInputFocus(day, 'saida')}
                    placeholder="0,00"
                    className="text-right h-10 text-red-600 font-medium"
                  />
                </div>
              </div>

              {/* Diário */}
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full">
                  <DollarSign className="text-orange-600" size={16} />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-600 block mb-1">Diário</label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={getInputValue(day, 'diario')}
                    onChange={(e) => handleInputChange(day, 'diario', e.target.value)}
                    onBlur={(e) => handleInputBlur(day, 'diario', e.target.value)}
                    onFocus={() => handleInputFocus(day, 'diario')}
                    placeholder="0,00"
                    className="text-right h-10 text-orange-600 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Botão para ver transações */}
            {hasTransactions && (
              <Button
                onClick={() => onDayClick(day)}
                variant="outline"
                className="w-full text-sm"
              >
                Ver Transações ({transactions.length})
              </Button>
            )}

            {/* Resumo do dia */}
            <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
              <div className="flex justify-between">
                <span>Saldo do dia:</span>
                <span className={balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(balance)}
                </span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-2 pb-20">
      {/* Header mobile */}
      <div className="sticky top-0 bg-white z-10 p-3 border-b border-gray-200 mb-4">
        <h2 className="text-lg font-semibold text-center">
          {new Date(selectedYear, selectedMonth).toLocaleDateString('pt-BR', { 
            month: 'long', 
            year: 'numeric' 
          })}
        </h2>
      </div>

      {/* Lista de dias */}
      <div className="px-3">
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(renderDayCard)}
      </div>

      {/* Botão flutuante para lançamento rápido */}
      <div className="fixed bottom-20 right-4 z-40">
        <Button
          onClick={() => window.location.href = '/quick-entry'}
          className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
        >
          <Plus className="text-white" size={24} />
        </Button>
      </div>
    </div>
  );
};

export default React.memo(MobileFinancialView);