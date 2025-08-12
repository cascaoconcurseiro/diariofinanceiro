import { useState, useEffect, useCallback } from 'react';

export interface ExpenseCategory {
  id: string;
  name: string;
  amount: number;
}

export interface EmergencyReserve {
  amount: number;
  months: number;
}

export interface FixedExpenses {
  categories: ExpenseCategory[];
  totalAmount: number;
}

const STORAGE_KEY = 'reserveAndExpenses';

export const useReserveAndExpenses = () => {
  const [emergencyReserve, setEmergencyReserve] = useState<EmergencyReserve>({
    amount: 0,
    months: 6
  });

  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenses>({
    categories: [],
    totalAmount: 0
  });

  // Carregar dados
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.emergencyReserve) {
          setEmergencyReserve(data.emergencyReserve);
        }
        if (data.fixedExpenses) {
          setFixedExpenses(data.fixedExpenses);
        }
      } catch (error) {
        console.error('Erro ao carregar reserva e gastos:', error);
      }
    }
  }, []);

  // Salvar dados
  const saveData = useCallback((reserve: EmergencyReserve, expenses: FixedExpenses) => {
    const data = {
      emergencyReserve: reserve,
      fixedExpenses: expenses
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  const updateEmergencyReserve = useCallback((amount: number, months: number) => {
    const newReserve = { amount, months };
    setEmergencyReserve(newReserve);
    saveData(newReserve, fixedExpenses);
  }, [fixedExpenses, saveData]);

  const updateFixedExpenses = useCallback((categories: ExpenseCategory[]) => {
    const totalAmount = categories.reduce((sum, cat) => sum + cat.amount, 0);
    const newExpenses = { categories, totalAmount };
    setFixedExpenses(newExpenses);
    saveData(emergencyReserve, newExpenses);
  }, [emergencyReserve, saveData]);

  return {
    emergencyReserve,
    fixedExpenses,
    updateEmergencyReserve,
    updateFixedExpenses
  };
};