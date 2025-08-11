
import React from 'react';
import { FluidNumberInput } from './FluidNumberInput';
import { FinancialData } from '../hooks/useFinancialData';
import { formatCurrency } from '../utils/currencyUtils';
import { TransactionEntry } from '../types/transactions';

interface FinancialTableProps {
  selectedYear: number;
  selectedMonth: number;
  data: FinancialData;
  daysInMonth: number;
  inputValues: {[key: string]: string};
  onInputChange: (day: number, field: 'entrada' | 'saida' | 'diario', value: string) => void;
  onInputBlur: (day: number, field: 'entrada' | 'saida' | 'diario', value: string) => void;
  getTransactionsByDate: (date: string) => TransactionEntry[];
  onDayClick: (day: number) => void;
}

const FinancialTable: React.FC<FinancialTableProps> = ({
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

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const getInputKey = (day: number, field: string) => `${selectedYear}-${selectedMonth}-${day}-${field}`;

  // Handle day cell click to show transactions modal
  const handleDayClick = (day: number) => {
    onDayClick(day);
  };

  const renderDayRow = (day: number) => {
    const dayData = data[selectedYear]?.[selectedMonth]?.[day] || {
      entrada: "R$ 0,00",
      saida: "R$ 0,00",
      diario: "R$ 0,00",
      balance: 0
    };

    // Check if there are detailed transactions for this day
    const dateString = new Date(selectedYear, selectedMonth, day).toISOString().split('T')[0];
    const hasTransactions = getTransactionsByDate(dateString).length > 0;

    return (
      <tr key={day} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <td 
          className={`py-2 sm:py-3 px-2 sm:px-4 text-center font-medium text-sm sm:text-base cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors ${
            hasTransactions ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
          }`}
          onClick={() => handleDayClick(day)}
          title="Clique para ver todos os lançamentos do dia"
        >
          <div className="flex items-center justify-center gap-1">
            {day}
            {hasTransactions && <span className="text-xs">📝</span>}
          </div>
        </td>
        <td className="py-2 sm:py-3 px-1 sm:px-4">
          <FluidNumberInput
            value={inputValues[getInputKey(day, 'entrada')] ?? dayData.entrada}
            onChange={(value) => onInputChange(day, 'entrada', value)}
            onBlur={(value) => onInputBlur(day, 'entrada', value)}
            color="green"
            className="w-full text-xs sm:text-sm"
          />
        </td>
        <td className="py-2 sm:py-3 px-1 sm:px-4">
          <FluidNumberInput
            value={inputValues[getInputKey(day, 'saida')] ?? dayData.saida}
            onChange={(value) => onInputChange(day, 'saida', value)}
            onBlur={(value) => onInputBlur(day, 'saida', value)}
            color="red"
            className="w-full text-xs sm:text-sm"
          />
        </td>
        <td className="py-2 sm:py-3 px-1 sm:px-4">
          <FluidNumberInput
            value={inputValues[getInputKey(day, 'diario')] ?? dayData.diario}
            onChange={(value) => onInputChange(day, 'diario', value)}
            onBlur={(value) => onInputBlur(day, 'diario', value)}
            color="blue"
            className="w-full text-xs sm:text-sm"
          />
        </td>
        <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
          <span className={`text-xs sm:text-sm font-medium ${dayData.balance < 0 ? 'text-red-600' : 'text-purple-600'}`}>
            {formatCurrency(dayData.balance)}
          </span>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg mb-4 sm:mb-6 md:mb-8 overflow-hidden">
      <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200">
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
          {monthNames[selectedMonth]} {selectedYear}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          💡 Clique no número do dia para ver todos os lançamentos (📝 indica dias com lançamentos)
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Dia
              </th>
              <th className="py-2 sm:py-3 px-1 sm:px-4 text-left text-xs font-medium text-green-600 uppercase tracking-wider">
                Entrada
              </th>
              <th className="py-2 sm:py-3 px-1 sm:px-4 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                Saída
              </th>
              <th className="py-2 sm:py-3 px-1 sm:px-4 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                Diário
              </th>
              <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs font-medium text-purple-600 uppercase tracking-wider">
                Saldo
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {Array.from({ length: daysInMonth }, (_, i) => renderDayRow(i + 1))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(FinancialTable);
