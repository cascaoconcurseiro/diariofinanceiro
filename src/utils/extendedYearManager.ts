/**
 * Gerenciador de Anos Estendido
 * Suporte para 41 anos (2025-2065) com navegação otimizada
 */

export interface YearConfig {
  startYear: number;
  endYear: number;
  totalYears: number;
  currentYear: number;
  availableYears: number[];
}

export interface YearNavigationState {
  currentYear: number;
  previousYear: number | null;
  nextYear: number | null;
  yearIndex: number;
  totalYears: number;
  canNavigateBack: boolean;
  canNavigateForward: boolean;
}

export interface YearMetadata {
  year: number;
  isCurrentYear: boolean;
  isPastYear: boolean;
  isFutureYear: boolean;
  hasData: boolean;
  transactionCount: number;
  lastModified?: number;
  dataSize: number;
  isLoaded: boolean;
}

class ExtendedYearManager {
  private readonly config: YearConfig;
  private yearMetadata: Map<number, YearMetadata> = new Map();
  private loadedYears: Set<number> = new Set();
  private observers: ((state: YearNavigationState) => void)[] = [];
  
  constructor() {
    const currentYear = new Date().getFullYear();
    
    this.config = {
      startYear: 2025,
      endYear: 2065,
      totalYears: 41,
      currentYear,
      availableYears: this.generateYearRange(2025, 2065)
    };
    
    this.initializeYearMetadata();
  }

  // Gerar range de anos
  private generateYearRange(start: number, end: number): number[] {
    const years: number[] = [];
    for (let year = start; year <= end; year++) {
      years.push(year);
    }
    return years;
  }

  // Inicializar metadados dos anos
  private initializeYearMetadata(): void {
    const currentYear = new Date().getFullYear();
    
    for (const year of this.config.availableYears) {
      this.yearMetadata.set(year, {
        year,
        isCurrentYear: year === currentYear,
        isPastYear: year < currentYear,
        isFutureYear: year > currentYear,
        hasData: false,
        transactionCount: 0,
        dataSize: 0,
        isLoaded: false
      });
    }
    
    // Carregar metadados dos dados existentes
    this.loadExistingDataMetadata();
  }

  // Carregar metadados dos dados existentes
  private loadExistingDataMetadata(): void {
    try {
      const financialData = JSON.parse(localStorage.getItem('financialData') || '{}');
      const years = financialData.years || {};
      
      for (const [yearStr, yearData] of Object.entries(years)) {
        const year = parseInt(yearStr);
        if (this.yearMetadata.has(year)) {
          const metadata = this.yearMetadata.get(year)!;
          
          // Contar transações
          let transactionCount = 0;
          const months = (yearData as any)?.months || {};
          
          for (const monthData of Object.values(months)) {
            const days = (monthData as any)?.days || {};
            for (const dayData of Object.values(days)) {
              const transactions = (dayData as any)?.transactions || [];
              transactionCount += transactions.length;
            }
          }
          
          // Calcular tamanho dos dados
          const dataSize = JSON.stringify(yearData).length;
          
          // Atualizar metadados
          metadata.hasData = transactionCount > 0;
          metadata.transactionCount = transactionCount;
          metadata.dataSize = dataSize;
          metadata.isLoaded = true;
          
          this.loadedYears.add(year);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar metadados dos anos:', error);
    }
  }

  // Obter configuração dos anos
  getYearConfig(): YearConfig {
    return { ...this.config };
  }

  // Obter todos os anos disponíveis
  getAvailableYears(): number[] {
    return [...this.config.availableYears];
  }

  // Obter anos com dados
  getYearsWithData(): number[] {
    return Array.from(this.yearMetadata.values())
      .filter(metadata => metadata.hasData)
      .map(metadata => metadata.year)
      .sort((a, b) => a - b);
  }

  // Obter anos carregados
  getLoadedYears(): number[] {
    return Array.from(this.loadedYears).sort((a, b) => a - b);
  }

  // Verificar se um ano é válido
  isValidYear(year: number): boolean {
    return year >= this.config.startYear && year <= this.config.endYear;
  }

  // Obter metadados de um ano
  getYearMetadata(year: number): YearMetadata | null {
    return this.yearMetadata.get(year) || null;
  }

  // Obter todos os metadados
  getAllYearMetadata(): YearMetadata[] {
    return Array.from(this.yearMetadata.values()).sort((a, b) => a.year - b.year);
  }

  // Obter estado de navegação para um ano
  getNavigationState(currentYear: number): YearNavigationState {
    const yearIndex = this.config.availableYears.indexOf(currentYear);
    const previousYear = yearIndex > 0 ? this.config.availableYears[yearIndex - 1] : null;
    const nextYear = yearIndex < this.config.availableYears.length - 1 ? 
      this.config.availableYears[yearIndex + 1] : null;
    
    return {
      currentYear,
      previousYear,
      nextYear,
      yearIndex,
      totalYears: this.config.totalYears,
      canNavigateBack: previousYear !== null,
      canNavigateForward: nextYear !== null
    };
  }

  // Navegar para o próximo ano
  navigateToNextYear(currentYear: number): number | null {
    const state = this.getNavigationState(currentYear);
    if (state.canNavigateForward && state.nextYear) {
      this.notifyObservers(this.getNavigationState(state.nextYear));
      return state.nextYear;
    }
    return null;
  }

  // Navegar para o ano anterior
  navigateToPreviousYear(currentYear: number): number | null {
    const state = this.getNavigationState(currentYear);
    if (state.canNavigateBack && state.previousYear) {
      this.notifyObservers(this.getNavigationState(state.previousYear));
      return state.previousYear;
    }
    return null;
  }

  // Navegar para um ano específico
  navigateToYear(targetYear: number): boolean {
    if (!this.isValidYear(targetYear)) {
      return false;
    }
    
    this.notifyObservers(this.getNavigationState(targetYear));
    return true;
  }

  // Obter anos próximos (para pré-carregamento)
  getNearbyYears(currentYear: number, radius: number = 2): number[] {
    const nearbyYears: number[] = [];
    const currentIndex = this.config.availableYears.indexOf(currentYear);
    
    if (currentIndex === -1) return [];
    
    const startIndex = Math.max(0, currentIndex - radius);
    const endIndex = Math.min(this.config.availableYears.length - 1, currentIndex + radius);
    
    for (let i = startIndex; i <= endIndex; i++) {
      nearbyYears.push(this.config.availableYears[i]);
    }
    
    return nearbyYears;
  }

  // Obter anos por década
  getYearsByDecade(): { [decade: string]: number[] } {
    const decades: { [decade: string]: number[] } = {};
    
    for (const year of this.config.availableYears) {
      const decade = Math.floor(year / 10) * 10;
      const decadeKey = `${decade}s`;
      
      if (!decades[decadeKey]) {
        decades[decadeKey] = [];
      }
      
      decades[decadeKey].push(year);
    }
    
    return decades;
  }

  // Obter estatísticas dos anos
  getYearStatistics(): {
    totalYears: number;
    yearsWithData: number;
    loadedYears: number;
    totalTransactions: number;
    totalDataSize: number;
    averageTransactionsPerYear: number;
    mostActiveYear: number | null;
    leastActiveYear: number | null;
  } {
    const yearsWithData = Array.from(this.yearMetadata.values()).filter(m => m.hasData);
    const totalTransactions = yearsWithData.reduce((sum, m) => sum + m.transactionCount, 0);
    const totalDataSize = yearsWithData.reduce((sum, m) => sum + m.dataSize, 0);
    
    let mostActiveYear: number | null = null;
    let leastActiveYear: number | null = null;
    let maxTransactions = 0;
    let minTransactions = Infinity;
    
    for (const metadata of yearsWithData) {
      if (metadata.transactionCount > maxTransactions) {
        maxTransactions = metadata.transactionCount;
        mostActiveYear = metadata.year;
      }
      
      if (metadata.transactionCount < minTransactions) {
        minTransactions = metadata.transactionCount;
        leastActiveYear = metadata.year;
      }
    }
    
    return {
      totalYears: this.config.totalYears,
      yearsWithData: yearsWithData.length,
      loadedYears: this.loadedYears.size,
      totalTransactions,
      totalDataSize,
      averageTransactionsPerYear: yearsWithData.length > 0 ? totalTransactions / yearsWithData.length : 0,
      mostActiveYear,
      leastActiveYear
    };
  }

  // Marcar ano como carregado
  markYearAsLoaded(year: number): void {
    if (this.isValidYear(year)) {
      this.loadedYears.add(year);
      
      const metadata = this.yearMetadata.get(year);
      if (metadata) {
        metadata.isLoaded = true;
        metadata.lastModified = Date.now();
      }
    }
  }

  // Descarregar ano da memória
  unloadYear(year: number): void {
    if (this.loadedYears.has(year)) {
      this.loadedYears.delete(year);
      
      const metadata = this.yearMetadata.get(year);
      if (metadata) {
        metadata.isLoaded = false;
      }
    }
  }

  // Atualizar metadados de um ano
  updateYearMetadata(year: number, updates: Partial<YearMetadata>): void {
    const metadata = this.yearMetadata.get(year);
    if (metadata) {
      Object.assign(metadata, updates);
      metadata.lastModified = Date.now();
    }
  }

  // Obter anos que precisam ser limpos da memória
  getYearsToUnload(currentYear: number, keepRadius: number = 3): number[] {
    const nearbyYears = new Set(this.getNearbyYears(currentYear, keepRadius));
    const yearsToUnload: number[] = [];
    
    for (const year of this.loadedYears) {
      if (!nearbyYears.has(year)) {
        yearsToUnload.push(year);
      }
    }
    
    return yearsToUnload;
  }

  // Obter sugestões de navegação
  getNavigationSuggestions(currentYear: number): {
    quickAccess: number[];
    recentYears: number[];
    yearsWithMostData: number[];
    nearbyYears: number[];
  } {
    const currentYearNum = new Date().getFullYear();
    const yearsWithData = this.getYearsWithData();
    
    // Anos de acesso rápido (atual, anterior, próximo)
    const quickAccess = [
      currentYearNum,
      currentYearNum - 1,
      currentYearNum + 1
    ].filter(year => this.isValidYear(year));
    
    // Anos recentes com dados
    const recentYears = yearsWithData
      .filter(year => year >= currentYearNum - 5)
      .slice(0, 5);
    
    // Anos com mais dados
    const yearsWithMostData = Array.from(this.yearMetadata.values())
      .filter(m => m.hasData)
      .sort((a, b) => b.transactionCount - a.transactionCount)
      .slice(0, 5)
      .map(m => m.year);
    
    // Anos próximos
    const nearbyYears = this.getNearbyYears(currentYear, 2);
    
    return {
      quickAccess,
      recentYears,
      yearsWithMostData,
      nearbyYears
    };
  }

  // Validar range de anos
  validateYearRange(startYear: number, endYear: number): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (startYear > endYear) {
      errors.push('Ano inicial não pode ser maior que o ano final');
    }
    
    if (startYear < this.config.startYear) {
      errors.push(`Ano inicial não pode ser menor que ${this.config.startYear}`);
    }
    
    if (endYear > this.config.endYear) {
      errors.push(`Ano final não pode ser maior que ${this.config.endYear}`);
    }
    
    const yearSpan = endYear - startYear + 1;
    if (yearSpan > 10) {
      warnings.push(`Range muito grande (${yearSpan} anos) pode afetar a performance`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Obter anos em formato de opções para select
  getYearOptions(): { value: number; label: string; disabled?: boolean }[] {
    const currentYear = new Date().getFullYear();
    
    return this.config.availableYears.map(year => {
      const metadata = this.yearMetadata.get(year);
      let label = year.toString();
      
      if (year === currentYear) {
        label += ' (Atual)';
      } else if (metadata?.hasData) {
        label += ` (${metadata.transactionCount} transações)`;
      }
      
      return {
        value: year,
        label,
        disabled: year > currentYear + 1 // Desabilitar anos muito futuros
      };
    });
  }

  // Obter anos agrupados por período
  getYearsByPeriod(): {
    past: number[];
    current: number[];
    near_future: number[];
    far_future: number[];
  } {
    const currentYear = new Date().getFullYear();
    
    return {
      past: this.config.availableYears.filter(year => year < currentYear),
      current: this.config.availableYears.filter(year => year === currentYear),
      near_future: this.config.availableYears.filter(year => year > currentYear && year <= currentYear + 5),
      far_future: this.config.availableYears.filter(year => year > currentYear + 5)
    };
  }

  // Buscar anos por critério
  searchYears(query: string): number[] {
    const queryLower = query.toLowerCase();
    const results: number[] = [];
    
    // Busca exata por ano
    const exactYear = parseInt(query);
    if (!isNaN(exactYear) && this.isValidYear(exactYear)) {
      results.push(exactYear);
    }
    
    // Busca por década
    if (queryLower.includes('202') || queryLower.includes('203') || queryLower.includes('204') || queryLower.includes('205') || queryLower.includes('206')) {
      const decade = parseInt(queryLower.replace(/\D/g, ''));
      if (!isNaN(decade)) {
        const decadeStart = Math.floor(decade / 10) * 10;
        for (let year = decadeStart; year < decadeStart + 10; year++) {
          if (this.isValidYear(year) && !results.includes(year)) {
            results.push(year);
          }
        }
      }
    }
    
    // Busca por anos com dados
    if (queryLower.includes('dados') || queryLower.includes('transaç')) {
      const yearsWithData = this.getYearsWithData();
      for (const year of yearsWithData) {
        if (!results.includes(year)) {
          results.push(year);
        }
      }
    }
    
    return results.sort((a, b) => a - b);
  }

  // Observadores para mudanças de navegação
  subscribe(callback: (state: YearNavigationState) => void): () => void {
    this.observers.push(callback);
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  private notifyObservers(state: YearNavigationState): void {
    this.observers.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Erro no observer de navegação:', error);
      }
    });
  }

  // Exportar configuração para backup
  exportConfig(): any {
    return {
      config: this.config,
      metadata: Array.from(this.yearMetadata.entries()),
      loadedYears: Array.from(this.loadedYears)
    };
  }

  // Importar configuração de backup
  importConfig(data: any): void {
    if (data.metadata) {
      this.yearMetadata.clear();
      for (const [year, metadata] of data.metadata) {
        this.yearMetadata.set(year, metadata);
      }
    }
    
    if (data.loadedYears) {
      this.loadedYears = new Set(data.loadedYears);
    }
  }

  // Limpar cache de metadados
  clearMetadataCache(): void {
    for (const metadata of this.yearMetadata.values()) {
      metadata.isLoaded = false;
      metadata.lastModified = undefined;
    }
    this.loadedYears.clear();
  }

  // Recarregar metadados
  reloadMetadata(): void {
    this.clearMetadataCache();
    this.loadExistingDataMetadata();
  }
}

// Instância global
export const yearManager = new ExtendedYearManager();

// Hook para usar o gerenciador de anos
export function useExtendedYearManager() {
  const [navigationState, setNavigationState] = useState<YearNavigationState | null>(null);
  const [yearMetadata, setYearMetadata] = useState<YearMetadata[]>([]);
  
  useEffect(() => {
    // Carregar metadados iniciais
    setYearMetadata(yearManager.getAllYearMetadata());
    
    // Inscrever-se para mudanças de navegação
    const unsubscribe = yearManager.subscribe(setNavigationState);
    
    return unsubscribe;
  }, []);
  
  const navigateToYear = useCallback((year: number) => {
    return yearManager.navigateToYear(year);
  }, []);
  
  const navigateNext = useCallback((currentYear: number) => {
    return yearManager.navigateToNextYear(currentYear);
  }, []);
  
  const navigatePrevious = useCallback((currentYear: number) => {
    return yearManager.navigateToPreviousYear(currentYear);
  }, []);
  
  const getNavigationState = useCallback((year: number) => {
    return yearManager.getNavigationState(year);
  }, []);
  
  return {
    // Estado
    navigationState,
    yearMetadata,
    
    // Configuração
    config: yearManager.getYearConfig(),
    availableYears: yearManager.getAvailableYears(),
    yearsWithData: yearManager.getYearsWithData(),
    
    // Navegação
    navigateToYear,
    navigateNext,
    navigatePrevious,
    getNavigationState,
    
    // Utilidades
    isValidYear: yearManager.isValidYear.bind(yearManager),
    getYearMetadata: yearManager.getYearMetadata.bind(yearManager),
    getNearbyYears: yearManager.getNearbyYears.bind(yearManager),
    getYearOptions: yearManager.getYearOptions.bind(yearManager),
    getNavigationSuggestions: yearManager.getNavigationSuggestions.bind(yearManager),
    searchYears: yearManager.searchYears.bind(yearManager),
    
    // Estatísticas
    getStatistics: yearManager.getYearStatistics.bind(yearManager),
    getYearsByPeriod: yearManager.getYearsByPeriod.bind(yearManager),
    getYearsByDecade: yearManager.getYearsByDecade.bind(yearManager)
  };
}

export default yearManager;