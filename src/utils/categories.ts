/**
 * SISTEMA DE CATEGORIAS FINANCEIRAS
 */

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'entrada' | 'saida' | 'both';
  isDefault: boolean;
  userId?: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  // Entradas
  { id: 'salary', name: 'Salário', icon: '💰', color: '#10B981', type: 'entrada', isDefault: true },
  { id: 'freelance', name: 'Freelance', icon: '💻', color: '#059669', type: 'entrada', isDefault: true },
  { id: 'investment', name: 'Investimentos', icon: '📈', color: '#0D9488', type: 'entrada', isDefault: true },
  { id: 'bonus', name: 'Bônus', icon: '🎁', color: '#0891B2', type: 'entrada', isDefault: true },
  
  // Saídas
  { id: 'food', name: 'Alimentação', icon: '🍽️', color: '#EF4444', type: 'saida', isDefault: true },
  { id: 'transport', name: 'Transporte', icon: '🚗', color: '#F97316', type: 'saida', isDefault: true },
  { id: 'housing', name: 'Moradia', icon: '🏠', color: '#EAB308', type: 'saida', isDefault: true },
  { id: 'health', name: 'Saúde', icon: '🏥', color: '#EC4899', type: 'saida', isDefault: true },
  { id: 'education', name: 'Educação', icon: '📚', color: '#8B5CF6', type: 'saida', isDefault: true },
  { id: 'entertainment', name: 'Lazer', icon: '🎬', color: '#06B6D4', type: 'saida', isDefault: true },
  { id: 'shopping', name: 'Compras', icon: '🛍️', color: '#F59E0B', type: 'saida', isDefault: true },
  { id: 'bills', name: 'Contas', icon: '📄', color: '#6B7280', type: 'saida', isDefault: true },
  
  // Ambos
  { id: 'other', name: 'Outros', icon: '📝', color: '#6B7280', type: 'both', isDefault: true }
];

class CategoryManager {
  private readonly STORAGE_KEY = 'financial_categories';

  getAllCategories(userId?: string): Category[] {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    const customCategories = saved ? JSON.parse(saved) : [];
    
    // Filtrar categorias do usuário
    const userCategories = customCategories.filter((cat: Category) => cat.userId === userId);
    
    return [...DEFAULT_CATEGORIES, ...userCategories];
  }

  getCategoriesByType(type: 'entrada' | 'saida', userId?: string): Category[] {
    return this.getAllCategories(userId).filter(cat => 
      cat.type === type || cat.type === 'both'
    );
  }

  getCategory(id: string, userId?: string): Category | null {
    return this.getAllCategories(userId).find(cat => cat.id === id) || null;
  }

  addCategory(category: Omit<Category, 'id' | 'isDefault'>, userId?: string): Category {
    const newCategory: Category = {
      ...category,
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      isDefault: false,
      userId
    };

    const saved = localStorage.getItem(this.STORAGE_KEY);
    const categories = saved ? JSON.parse(saved) : [];
    categories.push(newCategory);
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(categories));
    
    return newCategory;
  }

  updateCategory(id: string, updates: Partial<Category>, userId?: string): boolean {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    const categories = saved ? JSON.parse(saved) : [];
    
    const index = categories.findIndex((cat: Category) => 
      cat.id === id && cat.userId === userId
    );
    
    if (index >= 0) {
      categories[index] = { ...categories[index], ...updates };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(categories));
      return true;
    }
    
    return false;
  }

  deleteCategory(id: string, userId?: string): boolean {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    const categories = saved ? JSON.parse(saved) : [];
    
    const filtered = categories.filter((cat: Category) => 
      !(cat.id === id && cat.userId === userId)
    );
    
    if (filtered.length !== categories.length) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      return true;
    }
    
    return false;
  }

  getCategoryStats(userId?: string): any {
    // Buscar transações para estatísticas
    const transactions = JSON.parse(localStorage.getItem('unifiedFinancialData') || '[]');
    const categories = this.getAllCategories(userId);
    
    const stats = categories.map(category => {
      const categoryTransactions = transactions.filter((t: any) => t.category === category.name);
      const total = categoryTransactions.reduce((sum: number, t: any) => sum + t.amount, 0);
      
      return {
        category: category.name,
        icon: category.icon,
        color: category.color,
        total,
        count: categoryTransactions.length,
        percentage: 0 // Será calculado depois
      };
    });
    
    // Calcular percentuais
    const totalAmount = stats.reduce((sum, stat) => sum + stat.total, 0);
    stats.forEach(stat => {
      stat.percentage = totalAmount > 0 ? (stat.total / totalAmount) * 100 : 0;
    });
    
    return stats.sort((a, b) => b.total - a.total);
  }
}

export const categoryManager = new CategoryManager();