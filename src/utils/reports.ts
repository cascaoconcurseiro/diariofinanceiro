/**
 * SISTEMA DE RELATÓRIOS FINANCEIROS
 */

import { TransactionEntry } from '../types/transactions';
import { categoryManager } from './categories';

export interface ReportData {
  period: string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  categories: CategoryReport[];
  trends: TrendData[];
  insights: string[];
}

export interface CategoryReport {
  name: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
  transactions: number;
}

export interface TrendData {
  date: string;
  income: number;
  expenses: number;
  balance: number;
}

class ReportGenerator {
  
  generateMonthlyReport(year: number, month: number, transactions: TransactionEntry[]): ReportData {
    const monthTransactions = this.filterTransactionsByMonth(transactions, year, month);
    
    const totalIncome = this.calculateTotal(monthTransactions, 'entrada');
    const totalExpenses = this.calculateTotal(monthTransactions, 'saida') + 
                         this.calculateTotal(monthTransactions, 'diario');
    const balance = totalIncome - totalExpenses;
    
    const categories = this.generateCategoryReport(monthTransactions);
    const trends = this.generateTrendData(transactions, year, month);
    const insights = this.generateInsights(monthTransactions, totalIncome, totalExpenses);
    
    return {
      period: `${this.getMonthName(month)} ${year}`,
      totalIncome,
      totalExpenses,
      balance,
      categories,
      trends,
      insights
    };
  }

  generateYearlyReport(year: number, transactions: TransactionEntry[]): ReportData {
    const yearTransactions = transactions.filter(t => {
      const transactionYear = parseInt(t.date.split('-')[0]);
      return transactionYear === year;
    });
    
    const totalIncome = this.calculateTotal(yearTransactions, 'entrada');
    const totalExpenses = this.calculateTotal(yearTransactions, 'saida') + 
                         this.calculateTotal(yearTransactions, 'diario');
    const balance = totalIncome - totalExpenses;
    
    const categories = this.generateCategoryReport(yearTransactions);
    const trends = this.generateYearlyTrends(yearTransactions, year);
    const insights = this.generateYearlyInsights(yearTransactions, totalIncome, totalExpenses);
    
    return {
      period: `Ano ${year}`,
      totalIncome,
      totalExpenses,
      balance,
      categories,
      trends,
      insights
    };
  }

  generateCustomReport(startDate: string, endDate: string, transactions: TransactionEntry[]): ReportData {
    const filteredTransactions = transactions.filter(t => 
      t.date >= startDate && t.date <= endDate
    );
    
    const totalIncome = this.calculateTotal(filteredTransactions, 'entrada');
    const totalExpenses = this.calculateTotal(filteredTransactions, 'saida') + 
                         this.calculateTotal(filteredTransactions, 'diario');
    const balance = totalIncome - totalExpenses;
    
    const categories = this.generateCategoryReport(filteredTransactions);
    const trends = this.generateCustomTrends(filteredTransactions, startDate, endDate);
    const insights = this.generateInsights(filteredTransactions, totalIncome, totalExpenses);
    
    return {
      period: `${startDate} a ${endDate}`,
      totalIncome,
      totalExpenses,
      balance,
      categories,
      trends,
      insights
    };
  }

  private filterTransactionsByMonth(transactions: TransactionEntry[], year: number, month: number): TransactionEntry[] {
    return transactions.filter(t => {
      const [tYear, tMonth] = t.date.split('-').map(Number);
      return tYear === year && tMonth === month + 1;
    });
  }

  private calculateTotal(transactions: TransactionEntry[], type: string): number {
    return transactions
      .filter(t => t.type === type)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  private generateCategoryReport(transactions: TransactionEntry[]): CategoryReport[] {
    const categoryTotals = new Map<string, { amount: number; count: number }>();
    
    transactions.forEach(t => {
      const category = t.category || 'Outros';
      const current = categoryTotals.get(category) || { amount: 0, count: 0 };
      categoryTotals.set(category, {
        amount: current.amount + t.amount,
        count: current.count + 1
      });
    });
    
    const totalAmount = Array.from(categoryTotals.values())
      .reduce((sum, cat) => sum + cat.amount, 0);
    
    const categories = categoryManager.getAllCategories();
    
    return Array.from(categoryTotals.entries()).map(([name, data]) => {
      const category = categories.find(c => c.name === name);
      return {
        name,
        icon: category?.icon || '📝',
        color: category?.color || '#6B7280',
        amount: data.amount,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
        transactions: data.count
      };
    }).sort((a, b) => b.amount - a.amount);
  }

  private generateTrendData(transactions: TransactionEntry[], year: number, month: number): TrendData[] {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const trends: TrendData[] = [];
    
    let cumulativeBalance = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayTransactions = transactions.filter(t => t.date === date);
      
      const dayIncome = this.calculateTotal(dayTransactions, 'entrada');
      const dayExpenses = this.calculateTotal(dayTransactions, 'saida') + 
                         this.calculateTotal(dayTransactions, 'diario');
      
      cumulativeBalance += dayIncome - dayExpenses;
      
      trends.push({
        date,
        income: dayIncome,
        expenses: dayExpenses,
        balance: cumulativeBalance
      });
    }
    
    return trends;
  }

  private generateYearlyTrends(transactions: TransactionEntry[], year: number): TrendData[] {
    const trends: TrendData[] = [];
    let cumulativeBalance = 0;
    
    for (let month = 0; month < 12; month++) {
      const monthTransactions = this.filterTransactionsByMonth(transactions, year, month);
      
      const monthIncome = this.calculateTotal(monthTransactions, 'entrada');
      const monthExpenses = this.calculateTotal(monthTransactions, 'saida') + 
                           this.calculateTotal(monthTransactions, 'diario');
      
      cumulativeBalance += monthIncome - monthExpenses;
      
      trends.push({
        date: `${year}-${String(month + 1).padStart(2, '0')}`,
        income: monthIncome,
        expenses: monthExpenses,
        balance: cumulativeBalance
      });
    }
    
    return trends;
  }

  private generateCustomTrends(transactions: TransactionEntry[], startDate: string, endDate: string): TrendData[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const trends: TrendData[] = [];
    let cumulativeBalance = 0;
    
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const dayTransactions = transactions.filter(t => t.date === dateStr);
      
      const dayIncome = this.calculateTotal(dayTransactions, 'entrada');
      const dayExpenses = this.calculateTotal(dayTransactions, 'saida') + 
                         this.calculateTotal(dayTransactions, 'diario');
      
      cumulativeBalance += dayIncome - dayExpenses;
      
      trends.push({
        date: dateStr,
        income: dayIncome,
        expenses: dayExpenses,
        balance: cumulativeBalance
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return trends;
  }

  private generateInsights(transactions: TransactionEntry[], totalIncome: number, totalExpenses: number): string[] {
    const insights: string[] = [];
    
    // Análise de saldo
    const balance = totalIncome - totalExpenses;
    if (balance > 0) {
      insights.push(`✅ Saldo positivo de ${this.formatCurrency(balance)}`);
    } else if (balance < 0) {
      insights.push(`⚠️ Déficit de ${this.formatCurrency(Math.abs(balance))}`);
    } else {
      insights.push(`⚖️ Receitas e gastos equilibrados`);
    }
    
    // Análise de gastos
    if (totalExpenses > totalIncome * 0.9) {
      insights.push(`🚨 Gastos representam ${((totalExpenses / totalIncome) * 100).toFixed(1)}% da renda`);
    }
    
    // Categoria com maior gasto
    const categories = this.generateCategoryReport(transactions);
    if (categories.length > 0) {
      const topCategory = categories[0];
      insights.push(`📊 Maior gasto: ${topCategory.name} (${topCategory.percentage.toFixed(1)}%)`);
    }
    
    // Frequência de transações
    const avgPerDay = transactions.length / 30; // Assumindo período de 30 dias
    if (avgPerDay > 3) {
      insights.push(`📈 Alta atividade: ${avgPerDay.toFixed(1)} transações/dia`);
    } else if (avgPerDay < 1) {
      insights.push(`📉 Baixa atividade: ${avgPerDay.toFixed(1)} transações/dia`);
    }
    
    return insights;
  }

  private generateYearlyInsights(transactions: TransactionEntry[], totalIncome: number, totalExpenses: number): string[] {
    const insights = this.generateInsights(transactions, totalIncome, totalExpenses);
    
    // Análises específicas do ano
    const monthlyAvgIncome = totalIncome / 12;
    const monthlyAvgExpenses = totalExpenses / 12;
    
    insights.push(`💰 Renda média mensal: ${this.formatCurrency(monthlyAvgIncome)}`);
    insights.push(`💸 Gasto médio mensal: ${this.formatCurrency(monthlyAvgExpenses)}`);
    
    return insights;
  }

  private getMonthName(month: number): string {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month];
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  }

  // Exportar relatório para CSV
  exportToCSV(report: ReportData, transactions: TransactionEntry[]): string {
    const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor'];
    const rows = transactions.map(t => [
      t.date,
      t.description,
      t.category || 'Outros',
      t.type,
      t.amount.toString()
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    return csvContent;
  }

  // Exportar relatório para JSON
  exportToJSON(report: ReportData, transactions: TransactionEntry[]): string {
    return JSON.stringify({
      report,
      transactions,
      exportDate: new Date().toISOString()
    }, null, 2);
  }
}

export const reportGenerator = new ReportGenerator();