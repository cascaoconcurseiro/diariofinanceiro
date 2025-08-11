/**
 * Sistema de Validação Avançada de Dados
 * Valida integridade, consistência e detecta anomalias nos dados financeiros
 */

export enum ValidationLevel {
  BASIC = 'basic',
  STANDARD = 'standard',
  COMPREHENSIVE = 'comprehensive',
  PARANOID = 'paranoid'
}

export enum ValidationSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  level: ValidationLevel;
  severity: ValidationSeverity;
  validator: (data: any, context: ValidationContext) => ValidationResult;
  autoFix?: (data: any, context: ValidationContext) => any;
}

export interface ValidationResult {
  valid: boolean;
  message: string;
  details?: any;
  suggestion?: string;
  autoFixable: boolean;
}

export interface ValidationReport {
  id: string;
  timestamp: number;
  level: ValidationLevel;
  totalRules: number;
  passedRules: number;
  failedRules: number;
  results: ValidationRuleResult[];
  summary: ValidationSummary;
  dataIntegrityScore: number;
  recommendations: string[];
}

export interface ValidationRuleResult {
  ruleId: string;
  ruleName: string;
  severity: ValidationSeverity;
  result: ValidationResult;
  executionTime: number;
}

export interface ValidationSummary {
  criticalIssues: number;
  errors: number;
  warnings: number;
  infos: number;
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}

export interface ValidationContext {
  currentYear: number;
  currentMonth: number;
  totalYears: number;
  totalTransactions: number;
  dataSize: number;
  lastValidation?: number;
}

export interface AnomalyDetection {
  type: 'statistical' | 'pattern' | 'business_rule' | 'temporal';
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  affectedData: any;
  suggestedAction: string;
}

class AdvancedDataValidator {
  private rules: ValidationRule[] = [];
  private validationHistory: ValidationReport[] = [];
  private anomalyDetectors: Map<string, (data: any) => AnomalyDetection[]> = new Map();
  
  constructor() {
    this.initializeRules();
    this.initializeAnomalyDetectors();
  }

  // Inicializar regras de validação
  private initializeRules(): void {
    this.rules = [
      // Validações básicas de estrutura
      {
        id: 'data_structure_integrity',
        name: 'Integridade da Estrutura de Dados',
        description: 'Verifica se a estrutura básica dos dados está íntegra',
        level: ValidationLevel.BASIC,
        severity: ValidationSeverity.CRITICAL,
        validator: this.validateDataStructure.bind(this),
        autoFix: this.fixDataStructure.bind(this)
      },
      
      {
        id: 'year_structure_validation',
        name: 'Validação da Estrutura de Anos',
        description: 'Verifica se todos os anos têm estrutura válida',
        level: ValidationLevel.BASIC,
        severity: ValidationSeverity.ERROR,
        validator: this.validateYearStructure.bind(this),
        autoFix: this.fixYearStructure.bind(this)
      },
      
      {
        id: 'month_structure_validation',
        name: 'Validação da Estrutura de Meses',
        description: 'Verifica se todos os meses têm estrutura válida',
        level: ValidationLevel.BASIC,
        severity: ValidationSeverity.ERROR,
        validator: this.validateMonthStructure.bind(this),
        autoFix: this.fixMonthStructure.bind(this)
      },
      
      // Validações de consistência de dados
      {
        id: 'balance_consistency',
        name: 'Consistência de Saldos',
        description: 'Verifica se os saldos estão consistentes com as transações',
        level: ValidationLevel.STANDARD,
        severity: ValidationSeverity.ERROR,
        validator: this.validateBalanceConsistency.bind(this),
        autoFix: this.fixBalanceConsistency.bind(this)
      },
      
      {
        id: 'transaction_integrity',
        name: 'Integridade de Transações',
        description: 'Verifica se todas as transações têm dados válidos',
        level: ValidationLevel.STANDARD,
        severity: ValidationSeverity.WARNING,
        validator: this.validateTransactionIntegrity.bind(this),
        autoFix: this.fixTransactionIntegrity.bind(this)
      },
      
      {
        id: 'duplicate_transaction_detection',
        name: 'Detecção de Transações Duplicadas',
        description: 'Identifica possíveis transações duplicadas',
        level: ValidationLevel.STANDARD,
        severity: ValidationSeverity.WARNING,
        validator: this.validateDuplicateTransactions.bind(this),
        autoFix: this.fixDuplicateTransactions.bind(this)
      },
      
      // Validações de formato e tipo
      {
        id: 'currency_format_validation',
        name: 'Validação de Formato de Moeda',
        description: 'Verifica se os valores monetários estão formatados corretamente',
        level: ValidationLevel.STANDARD,
        severity: ValidationSeverity.WARNING,
        validator: this.validateCurrencyFormat.bind(this),
        autoFix: this.fixCurrencyFormat.bind(this)
      },
      
      {
        id: 'date_format_validation',
        name: 'Validação de Formato de Data',
        description: 'Verifica se as datas estão em formato válido',
        level: ValidationLevel.STANDARD,
        severity: ValidationSeverity.ERROR,
        validator: this.validateDateFormat.bind(this),
        autoFix: this.fixDateFormat.bind(this)
      },
      
      // Validações avançadas
      {
        id: 'business_rule_validation',
        name: 'Validação de Regras de Negócio',
        description: 'Verifica conformidade com regras de negócio financeiras',
        level: ValidationLevel.COMPREHENSIVE,
        severity: ValidationSeverity.WARNING,
        validator: this.validateBusinessRules.bind(this)
      },
      
      {
        id: 'temporal_consistency',
        name: 'Consistência Temporal',
        description: 'Verifica se as datas e sequências temporais são consistentes',
        level: ValidationLevel.COMPREHENSIVE,
        severity: ValidationSeverity.ERROR,
        validator: this.validateTemporalConsistency.bind(this),
        autoFix: this.fixTemporalConsistency.bind(this)
      },
      
      {
        id: 'statistical_anomaly_detection',
        name: 'Detecção de Anomalias Estatísticas',
        description: 'Identifica valores estatisticamente anômalos',
        level: ValidationLevel.COMPREHENSIVE,
        severity: ValidationSeverity.INFO,
        validator: this.validateStatisticalAnomalies.bind(this)
      },
      
      // Validações paranóicas
      {
        id: 'deep_data_integrity',
        name: 'Integridade Profunda de Dados',
        description: 'Verificação exaustiva de integridade em todos os níveis',
        level: ValidationLevel.PARANOID,
        severity: ValidationSeverity.ERROR,
        validator: this.validateDeepDataIntegrity.bind(this)
      },
      
      {
        id: 'cross_reference_validation',
        name: 'Validação de Referências Cruzadas',
        description: 'Verifica consistência entre diferentes partes dos dados',
        level: ValidationLevel.PARANOID,
        severity: ValidationSeverity.WARNING,
        validator: this.validateCrossReferences.bind(this)
      },
      
      {
        id: 'performance_impact_analysis',
        name: 'Análise de Impacto na Performance',
        description: 'Analisa se os dados podem causar problemas de performance',
        level: ValidationLevel.PARANOID,
        severity: ValidationSeverity.INFO,
        validator: this.validatePerformanceImpact.bind(this)
      }
    ];
  }

  // Inicializar detectores de anomalia
  private initializeAnomalyDetectors(): void {
    this.anomalyDetectors.set('statistical', this.detectStatisticalAnomalies.bind(this));
    this.anomalyDetectors.set('pattern', this.detectPatternAnomalies.bind(this));
    this.anomalyDetectors.set('business_rule', this.detectBusinessRuleAnomalies.bind(this));
    this.anomalyDetectors.set('temporal', this.detectTemporalAnomalies.bind(this));
  }

  // Executar validação completa
  async validateData(level: ValidationLevel = ValidationLevel.STANDARD): Promise<ValidationReport> {
    const startTime = performance.now();
    const data = this.loadFinancialData();
    const context = this.buildValidationContext(data);
    
    const applicableRules = this.rules.filter(rule => 
      this.shouldApplyRule(rule, level)
    );
    
    const results: ValidationRuleResult[] = [];
    let passedRules = 0;
    let failedRules = 0;
    
    for (const rule of applicableRules) {
      const ruleStartTime = performance.now();
      
      try {
        const result = rule.validator(data, context);
        const executionTime = performance.now() - ruleStartTime;
        
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          result,
          executionTime
        });
        
        if (result.valid) {
          passedRules++;
        } else {
          failedRules++;
        }
        
      } catch (error) {
        const executionTime = performance.now() - ruleStartTime;
        
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          severity: ValidationSeverity.ERROR,
          result: {
            valid: false,
            message: `Erro na validação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
            autoFixable: false
          },
          executionTime
        });
        
        failedRules++;
      }
    }
    
    const summary = this.generateSummary(results);
    const dataIntegrityScore = this.calculateIntegrityScore(results);
    const recommendations = this.generateRecommendations(results);
    
    const report: ValidationReport = {
      id: `validation_${Date.now()}`,
      timestamp: Date.now(),
      level,
      totalRules: applicableRules.length,
      passedRules,
      failedRules,
      results,
      summary,
      dataIntegrityScore,
      recommendations
    };
    
    this.validationHistory.push(report);
    
    // Manter apenas os últimos 10 relatórios
    if (this.validationHistory.length > 10) {
      this.validationHistory.shift();
    }
    
    console.log(`Validação concluída em ${(performance.now() - startTime).toFixed(2)}ms`);
    console.log(`Score de integridade: ${dataIntegrityScore}%`);
    
    return report;
  }

  // Implementações das validações
  private validateDataStructure(data: any, context: ValidationContext): ValidationResult {
    if (!data || typeof data !== 'object') {
      return {
        valid: false,
        message: 'Dados não encontrados ou formato inválido',
        suggestion: 'Inicializar estrutura básica de dados',
        autoFixable: true
      };
    }
    
    if (!data.years || typeof data.years !== 'object') {
      return {
        valid: false,
        message: 'Estrutura de anos não encontrada',
        suggestion: 'Criar estrutura de anos',
        autoFixable: true
      };
    }
    
    return {
      valid: true,
      message: 'Estrutura de dados válida',
      autoFixable: false
    };
  }

  private validateYearStructure(data: any, context: ValidationContext): ValidationResult {
    const issues: string[] = [];
    
    for (const [year, yearData] of Object.entries(data.years || {})) {
      if (!yearData || typeof yearData !== 'object') {
        issues.push(`Ano ${year} tem estrutura inválida`);
        continue;
      }
      
      const months = (yearData as any).months;
      if (!months || typeof months !== 'object') {
        issues.push(`Ano ${year} não tem estrutura de meses`);
      }
    }
    
    if (issues.length > 0) {
      return {
        valid: false,
        message: `Problemas na estrutura de anos: ${issues.join(', ')}`,
        details: issues,
        suggestion: 'Corrigir estrutura de anos problemáticos',
        autoFixable: true
      };
    }
    
    return {
      valid: true,
      message: 'Estrutura de anos válida',
      autoFixable: false
    };
  }

  private validateMonthStructure(data: any, context: ValidationContext): ValidationResult {
    const issues: string[] = [];
    
    for (const [year, yearData] of Object.entries(data.years || {})) {
      const months = (yearData as any)?.months || {};
      
      for (const [month, monthData] of Object.entries(months)) {
        if (!monthData || typeof monthData !== 'object') {
          issues.push(`${year}/${month} tem estrutura inválida`);
          continue;
        }
        
        const days = (monthData as any).days;
        if (!days || typeof days !== 'object') {
          issues.push(`${year}/${month} não tem estrutura de dias`);
        }
        
        const balance = (monthData as any).balance;
        if (typeof balance !== 'number') {
          issues.push(`${year}/${month} não tem saldo válido`);
        }
      }
    }
    
    if (issues.length > 0) {
      return {
        valid: false,
        message: `Problemas na estrutura de meses: ${issues.slice(0, 5).join(', ')}${issues.length > 5 ? '...' : ''}`,
        details: issues,
        suggestion: 'Corrigir estrutura de meses problemáticos',
        autoFixable: true
      };
    }
    
    return {
      valid: true,
      message: 'Estrutura de meses válida',
      autoFixable: false
    };
  }

  private validateBalanceConsistency(data: any, context: ValidationContext): ValidationResult {
    const inconsistencies: string[] = [];
    
    for (const [year, yearData] of Object.entries(data.years || {})) {
      const months = (yearData as any)?.months || {};
      
      for (const [month, monthData] of Object.entries(months)) {
        const days = (monthData as any)?.days || {};
        const storedBalance = (monthData as any)?.balance || 0;
        
        // Calcular saldo baseado nas transações
        let calculatedBalance = 0;
        for (const [day, dayData] of Object.entries(days)) {
          const transactions = (dayData as any)?.transactions || [];
          for (const transaction of transactions) {
            if (transaction.type === 'income') {
              calculatedBalance += transaction.amount || 0;
            } else if (transaction.type === 'expense') {
              calculatedBalance -= transaction.amount || 0;
            }
          }
        }
        
        // Verificar discrepância (tolerância de 1 centavo)
        const difference = Math.abs(calculatedBalance - storedBalance);
        if (difference > 0.01) {
          inconsistencies.push(
            `${year}/${month}: Saldo armazenado (${storedBalance.toFixed(2)}) ≠ Calculado (${calculatedBalance.toFixed(2)})`
          );
        }
      }
    }
    
    if (inconsistencies.length > 0) {
      return {
        valid: false,
        message: `${inconsistencies.length} inconsistências de saldo encontradas`,
        details: inconsistencies,
        suggestion: 'Recalcular todos os saldos',
        autoFixable: true
      };
    }
    
    return {
      valid: true,
      message: 'Saldos consistentes',
      autoFixable: false
    };
  }

  private validateTransactionIntegrity(data: any, context: ValidationContext): ValidationResult {
    const issues: string[] = [];
    let totalTransactions = 0;
    
    for (const [year, yearData] of Object.entries(data.years || {})) {
      const months = (yearData as any)?.months || {};
      
      for (const [month, monthData] of Object.entries(months)) {
        const days = (monthData as any)?.days || {};
        
        for (const [day, dayData] of Object.entries(days)) {
          const transactions = (dayData as any)?.transactions || [];
          
          for (let i = 0; i < transactions.length; i++) {
            const transaction = transactions[i];
            totalTransactions++;
            
            // Verificar campos obrigatórios
            if (!transaction.type || !['income', 'expense'].includes(transaction.type)) {
              issues.push(`${year}/${month}/${day} transação ${i}: tipo inválido`);
            }
            
            if (typeof transaction.amount !== 'number' || transaction.amount <= 0) {
              issues.push(`${year}/${month}/${day} transação ${i}: valor inválido`);
            }
            
            if (!transaction.description || typeof transaction.description !== 'string') {
              issues.push(`${year}/${month}/${day} transação ${i}: descrição inválida`);
            }
            
            // Verificar valores extremos
            if (transaction.amount > 1000000) {
              issues.push(`${year}/${month}/${day} transação ${i}: valor muito alto (${transaction.amount})`);
            }
          }
        }
      }
    }
    
    if (issues.length > 0) {
      return {
        valid: false,
        message: `${issues.length} problemas de integridade em ${totalTransactions} transações`,
        details: issues.slice(0, 10), // Mostrar apenas os primeiros 10
        suggestion: 'Corrigir transações com problemas',
        autoFixable: true
      };
    }
    
    return {
      valid: true,
      message: `${totalTransactions} transações íntegras`,
      autoFixable: false
    };
  }

  private validateDuplicateTransactions(data: any, context: ValidationContext): ValidationResult {
    const duplicates: string[] = [];
    const transactionMap = new Map<string, string>();
    
    for (const [year, yearData] of Object.entries(data.years || {})) {
      const months = (yearData as any)?.months || {};
      
      for (const [month, monthData] of Object.entries(months)) {
        const days = (monthData as any)?.days || {};
        
        for (const [day, dayData] of Object.entries(days)) {
          const transactions = (dayData as any)?.transactions || [];
          
          for (let i = 0; i < transactions.length; i++) {
            const transaction = transactions[i];
            
            // Criar chave única para a transação
            const key = `${transaction.type}_${transaction.amount}_${transaction.description}_${year}_${month}_${day}`;
            
            if (transactionMap.has(key)) {
              const existing = transactionMap.get(key);
              duplicates.push(`Duplicata: ${key} (original: ${existing})`);
            } else {
              transactionMap.set(key, `${year}/${month}/${day}[${i}]`);
            }
          }
        }
      }
    }
    
    if (duplicates.length > 0) {
      return {
        valid: false,
        message: `${duplicates.length} possíveis transações duplicadas`,
        details: duplicates,
        suggestion: 'Revisar e remover duplicatas',
        autoFixable: true
      };
    }
    
    return {
      valid: true,
      message: 'Nenhuma duplicata detectada',
      autoFixable: false
    };
  }

  private validateCurrencyFormat(data: any, context: ValidationContext): ValidationResult {
    const issues: string[] = [];
    
    for (const [year, yearData] of Object.entries(data.years || {})) {
      const months = (yearData as any)?.months || {};
      
      for (const [month, monthData] of Object.entries(months)) {
        const days = (monthData as any)?.days || {};
        
        for (const [day, dayData] of Object.entries(days)) {
          const transactions = (dayData as any)?.transactions || [];
          
          for (let i = 0; i < transactions.length; i++) {
            const transaction = transactions[i];
            
            if (typeof transaction.amount === 'number') {
              // Verificar se tem mais de 2 casas decimais
              const decimalPlaces = (transaction.amount.toString().split('.')[1] || '').length;
              if (decimalPlaces > 2) {
                issues.push(`${year}/${month}/${day}[${i}]: muitas casas decimais (${decimalPlaces})`);
              }
              
              // Verificar valores negativos em campos que deveriam ser positivos
              if (transaction.amount < 0) {
                issues.push(`${year}/${month}/${day}[${i}]: valor negativo`);
              }
            }
          }
        }
      }
    }
    
    if (issues.length > 0) {
      return {
        valid: false,
        message: `${issues.length} problemas de formato de moeda`,
        details: issues.slice(0, 10),
        suggestion: 'Corrigir formatação de valores monetários',
        autoFixable: true
      };
    }
    
    return {
      valid: true,
      message: 'Formato de moeda válido',
      autoFixable: false
    };
  }

  private validateDateFormat(data: any, context: ValidationContext): ValidationResult {
    const issues: string[] = [];
    
    for (const [year, yearData] of Object.entries(data.years || {})) {
      // Verificar se o ano é válido
      const yearNum = parseInt(year);
      if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
        issues.push(`Ano inválido: ${year}`);
        continue;
      }
      
      const months = (yearData as any)?.months || {};
      
      for (const [month, monthData] of Object.entries(months)) {
        // Verificar se o mês é válido
        const monthNum = parseInt(month);
        if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
          issues.push(`Mês inválido: ${year}/${month}`);
          continue;
        }
        
        const days = (monthData as any)?.days || {};
        
        for (const day of Object.keys(days)) {
          // Verificar se o dia é válido
          const dayNum = parseInt(day);
          if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
            issues.push(`Dia inválido: ${year}/${month}/${day}`);
            continue;
          }
          
          // Verificar se a data existe (ex: 31 de fevereiro)
          const date = new Date(yearNum, monthNum - 1, dayNum);
          if (date.getFullYear() !== yearNum || 
              date.getMonth() !== monthNum - 1 || 
              date.getDate() !== dayNum) {
            issues.push(`Data inexistente: ${year}/${month}/${day}`);
          }
        }
      }
    }
    
    if (issues.length > 0) {
      return {
        valid: false,
        message: `${issues.length} problemas de formato de data`,
        details: issues,
        suggestion: 'Corrigir datas inválidas',
        autoFixable: true
      };
    }
    
    return {
      valid: true,
      message: 'Formato de data válido',
      autoFixable: false
    };
  }

  private validateBusinessRules(data: any, context: ValidationContext): ValidationResult {
    const violations: string[] = [];
    
    // Regra: Não deve haver transações muito antigas ou futuras
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    for (const [year, yearData] of Object.entries(data.years || {})) {
      const yearNum = parseInt(year);
      
      if (yearNum < currentYear - 5) {
        violations.push(`Dados muito antigos: ${year} (mais de 5 anos)`);
      }
      
      if (yearNum > currentYear + 1) {
        violations.push(`Dados futuros: ${year} (mais de 1 ano no futuro)`);
      }
    }
    
    // Regra: Saldos muito negativos podem indicar problemas
    for (const [year, yearData] of Object.entries(data.years || {})) {
      const months = (yearData as any)?.months || {};
      
      for (const [month, monthData] of Object.entries(months)) {
        const balance = (monthData as any)?.balance || 0;
        
        if (balance < -100000) {
          violations.push(`Saldo muito negativo: ${year}/${month} (${balance})`);
        }
      }
    }
    
    if (violations.length > 0) {
      return {
        valid: false,
        message: `${violations.length} violações de regras de negócio`,
        details: violations,
        suggestion: 'Revisar dados que violam regras de negócio',
        autoFixable: false
      };
    }
    
    return {
      valid: true,
      message: 'Regras de negócio respeitadas',
      autoFixable: false
    };
  }

  private validateTemporalConsistency(data: any, context: ValidationContext): ValidationResult {
    const issues: string[] = [];
    
    // Verificar ordem cronológica dos dados
    const years = Object.keys(data.years || {}).map(y => parseInt(y)).sort((a, b) => a - b);
    
    for (let i = 1; i < years.length; i++) {
      if (years[i] - years[i-1] > 1) {
        issues.push(`Gap temporal: falta ano ${years[i-1] + 1} entre ${years[i-1]} e ${years[i]}`);
      }
    }
    
    // Verificar consistência de meses
    for (const [year, yearData] of Object.entries(data.years || {})) {
      const months = Object.keys((yearData as any)?.months || {}).map(m => parseInt(m)).sort((a, b) => a - b);
      
      for (let i = 1; i < months.length; i++) {
        if (months[i] - months[i-1] > 1) {
          issues.push(`Gap mensal em ${year}: falta mês ${months[i-1] + 1}`);
        }
      }
    }
    
    if (issues.length > 0) {
      return {
        valid: false,
        message: `${issues.length} problemas de consistência temporal`,
        details: issues,
        suggestion: 'Preencher gaps temporais ou verificar ordem cronológica',
        autoFixable: true
      };
    }
    
    return {
      valid: true,
      message: 'Consistência temporal válida',
      autoFixable: false
    };
  }

  private validateStatisticalAnomalies(data: any, context: ValidationContext): ValidationResult {
    const anomalies = this.detectStatisticalAnomalies(data);
    
    if (anomalies.length > 0) {
      return {
        valid: false,
        message: `${anomalies.length} anomalias estatísticas detectadas`,
        details: anomalies.map(a => a.description),
        suggestion: 'Revisar valores estatisticamente anômalos',
        autoFixable: false
      };
    }
    
    return {
      valid: true,
      message: 'Nenhuma anomalia estatística detectada',
      autoFixable: false
    };
  }

  private validateDeepDataIntegrity(data: any, context: ValidationContext): ValidationResult {
    const issues: string[] = [];
    
    try {
      // Verificar se os dados podem ser serializados/deserializados
      const serialized = JSON.stringify(data);
      const deserialized = JSON.parse(serialized);
      
      // Verificação profunda de igualdade
      if (!this.deepEqual(data, deserialized)) {
        issues.push('Dados não podem ser serializados corretamente');
      }
      
      // Verificar referências circulares
      this.checkCircularReferences(data, new Set(), '');
      
    } catch (error) {
      issues.push(`Erro na verificação de integridade: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
    
    if (issues.length > 0) {
      return {
        valid: false,
        message: `Problemas de integridade profunda: ${issues.join(', ')}`,
        details: issues,
        suggestion: 'Reconstruir estrutura de dados',
        autoFixable: false
      };
    }
    
    return {
      valid: true,
      message: 'Integridade profunda válida',
      autoFixable: false
    };
  }

  private validateCrossReferences(data: any, context: ValidationContext): ValidationResult {
    const issues: string[] = [];
    
    // Verificar se todos os anos referenciados existem
    const referencedYears = new Set<string>();
    const existingYears = new Set(Object.keys(data.years || {}));
    
    // Coletar anos referenciados em configurações
    if (data.currentYear) {
      referencedYears.add(data.currentYear.toString());
    }
    
    // Verificar se anos referenciados existem
    for (const year of referencedYears) {
      if (!existingYears.has(year)) {
        issues.push(`Ano referenciado não existe: ${year}`);
      }
    }
    
    if (issues.length > 0) {
      return {
        valid: false,
        message: `${issues.length} problemas de referência cruzada`,
        details: issues,
        suggestion: 'Corrigir referências quebradas',
        autoFixable: true
      };
    }
    
    return {
      valid: true,
      message: 'Referências cruzadas válidas',
      autoFixable: false
    };
  }

  private validatePerformanceImpact(data: any, context: ValidationContext): ValidationResult {
    const warnings: string[] = [];
    
    // Verificar tamanho dos dados
    const dataSize = JSON.stringify(data).length;
    if (dataSize > 5 * 1024 * 1024) { // 5MB
      warnings.push(`Dados muito grandes: ${(dataSize / 1024 / 1024).toFixed(2)}MB`);
    }
    
    // Verificar número de transações
    if (context.totalTransactions > 10000) {
      warnings.push(`Muitas transações: ${context.totalTransactions}`);
    }
    
    // Verificar profundidade de aninhamento
    const maxDepth = this.calculateMaxDepth(data);
    if (maxDepth > 10) {
      warnings.push(`Estrutura muito profunda: ${maxDepth} níveis`);
    }
    
    if (warnings.length > 0) {
      return {
        valid: false,
        message: `${warnings.length} possíveis impactos na performance`,
        details: warnings,
        suggestion: 'Otimizar estrutura de dados para melhor performance',
        autoFixable: false
      };
    }
    
    return {
      valid: true,
      message: 'Impacto na performance aceitável',
      autoFixable: false
    };
  }

  // Métodos de correção automática
  private fixDataStructure(data: any, context: ValidationContext): any {
    if (!data || typeof data !== 'object') {
      data = {};
    }
    
    if (!data.years || typeof data.years !== 'object') {
      data.years = {};
    }
    
    if (!data.currentYear) {
      data.currentYear = new Date().getFullYear();
    }
    
    if (!data.currentMonth) {
      data.currentMonth = new Date().getMonth() + 1;
    }
    
    return data;
  }

  private fixYearStructure(data: any, context: ValidationContext): any {
    for (const [year, yearData] of Object.entries(data.years || {})) {
      if (!yearData || typeof yearData !== 'object') {
        data.years[year] = { months: {} };
      } else if (!(yearData as any).months || typeof (yearData as any).months !== 'object') {
        (yearData as any).months = {};
      }
    }
    
    return data;
  }

  private fixMonthStructure(data: any, context: ValidationContext): any {
    for (const [year, yearData] of Object.entries(data.years || {})) {
      const months = (yearData as any)?.months || {};
      
      for (const [month, monthData] of Object.entries(months)) {
        if (!monthData || typeof monthData !== 'object') {
          months[month] = { days: {}, balance: 0 };
        } else {
          if (!(monthData as any).days || typeof (monthData as any).days !== 'object') {
            (monthData as any).days = {};
          }
          if (typeof (monthData as any).balance !== 'number') {
            (monthData as any).balance = 0;
          }
        }
      }
    }
    
    return data;
  }

  private fixBalanceConsistency(data: any, context: ValidationContext): any {
    for (const [year, yearData] of Object.entries(data.years || {})) {
      const months = (yearData as any)?.months || {};
      
      for (const [month, monthData] of Object.entries(months)) {
        const days = (monthData as any)?.days || {};
        
        // Recalcular saldo baseado nas transações
        let calculatedBalance = 0;
        for (const [day, dayData] of Object.entries(days)) {
          const transactions = (dayData as any)?.transactions || [];
          for (const transaction of transactions) {
            if (transaction.type === 'income') {
              calculatedBalance += transaction.amount || 0;
            } else if (transaction.type === 'expense') {
              calculatedBalance -= transaction.amount || 0;
            }
          }
        }
        
        (monthData as any).balance = calculatedBalance;
      }
    }
    
    return data;
  }

  private fixTransactionIntegrity(data: any, context: ValidationContext): any {
    for (const [year, yearData] of Object.entries(data.years || {})) {
      const months = (yearData as any)?.months || {};
      
      for (const [month, monthData] of Object.entries(months)) {
        const days = (monthData as any)?.days || {};
        
        for (const [day, dayData] of Object.entries(days)) {
          const transactions = (dayData as any)?.transactions || [];
          
          for (let i = transactions.length - 1; i >= 0; i--) {
            const transaction = transactions[i];
            
            // Remover transações inválidas
            if (!transaction.type || !['income', 'expense'].includes(transaction.type) ||
                typeof transaction.amount !== 'number' || transaction.amount <= 0 ||
                !transaction.description) {
              transactions.splice(i, 1);
            } else {
              // Corrigir valores
              transaction.amount = Math.round(transaction.amount * 100) / 100; // 2 casas decimais
              transaction.description = transaction.description.toString().trim();
            }
          }
        }
      }
    }
    
    return data;
  }

  private fixDuplicateTransactions(data: any, context: ValidationContext): any {
    const seen = new Set<string>();
    
    for (const [year, yearData] of Object.entries(data.years || {})) {
      const months = (yearData as any)?.months || {};
      
      for (const [month, monthData] of Object.entries(months)) {
        const days = (monthData as any)?.days || {};
        
        for (const [day, dayData] of Object.entries(days)) {
          const transactions = (dayData as any)?.transactions || [];
          
          for (let i = transactions.length - 1; i >= 0; i--) {
            const transaction = transactions[i];
            const key = `${transaction.type}_${transaction.amount}_${transaction.description}_${year}_${month}_${day}`;
            
            if (seen.has(key)) {
              transactions.splice(i, 1); // Remover duplicata
            } else {
              seen.add(key);
            }
          }
        }
      }
    }
    
    return data;
  }

  private fixCurrencyFormat(data: any, context: ValidationContext): any {
    for (const [year, yearData] of Object.entries(data.years || {})) {
      const months = (yearData as any)?.months || {};
      
      for (const [month, monthData] of Object.entries(months)) {
        const days = (monthData as any)?.days || {};
        
        for (const [day, dayData] of Object.entries(days)) {
          const transactions = (dayData as any)?.transactions || [];
          
          for (const transaction of transactions) {
            if (typeof transaction.amount === 'number') {
              // Arredondar para 2 casas decimais
              transaction.amount = Math.round(Math.abs(transaction.amount) * 100) / 100;
            }
          }
        }
        
        // Corrigir saldo também
        if (typeof (monthData as any).balance === 'number') {
          (monthData as any).balance = Math.round((monthData as any).balance * 100) / 100;
        }
      }
    }
    
    return data;
  }

  private fixDateFormat(data: any, context: ValidationContext): any {
    const validYears: { [key: string]: any } = {};
    
    for (const [year, yearData] of Object.entries(data.years || {})) {
      const yearNum = parseInt(year);
      if (!isNaN(yearNum) && yearNum >= 2000 && yearNum <= 2100) {
        const validMonths: { [key: string]: any } = {};
        const months = (yearData as any)?.months || {};
        
        for (const [month, monthData] of Object.entries(months)) {
          const monthNum = parseInt(month);
          if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
            const validDays: { [key: string]: any } = {};
            const days = (monthData as any)?.days || {};
            
            for (const [day, dayData] of Object.entries(days)) {
              const dayNum = parseInt(day);
              if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
                // Verificar se a data existe
                const date = new Date(yearNum, monthNum - 1, dayNum);
                if (date.getFullYear() === yearNum && 
                    date.getMonth() === monthNum - 1 && 
                    date.getDate() === dayNum) {
                  validDays[day] = dayData;
                }
              }
            }
            
            validMonths[month] = { ...monthData, days: validDays };
          }
        }
        
        validYears[year] = { ...yearData, months: validMonths };
      }
    }
    
    data.years = validYears;
    return data;
  }

  private fixTemporalConsistency(data: any, context: ValidationContext): any {
    // Por enquanto, apenas log - correção temporal é complexa
    console.log('Correção de consistência temporal não implementada automaticamente');
    return data;
  }

  // Detectores de anomalia
  private detectStatisticalAnomalies(data: any): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];
    const amounts: number[] = [];
    
    // Coletar todos os valores
    for (const [year, yearData] of Object.entries(data.years || {})) {
      const months = (yearData as any)?.months || {};
      
      for (const [month, monthData] of Object.entries(months)) {
        const days = (monthData as any)?.days || {};
        
        for (const [day, dayData] of Object.entries(days)) {
          const transactions = (dayData as any)?.transactions || [];
          for (const transaction of transactions) {
            if (typeof transaction.amount === 'number') {
              amounts.push(transaction.amount);
            }
          }
        }
      }
    }
    
    if (amounts.length > 10) {
      // Calcular estatísticas
      const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);
      
      // Detectar outliers (valores > 3 desvios padrão)
      const outliers = amounts.filter(amount => Math.abs(amount - mean) > 3 * stdDev);
      
      if (outliers.length > 0) {
        anomalies.push({
          type: 'statistical',
          description: `${outliers.length} valores estatisticamente anômalos detectados`,
          confidence: 0.95,
          impact: outliers.length > amounts.length * 0.1 ? 'high' : 'medium',
          affectedData: outliers,
          suggestedAction: 'Revisar valores extremos'
        });
      }
    }
    
    return anomalies;
  }

  private detectPatternAnomalies(data: any): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];
    
    // Detectar padrões suspeitos (ex: muitas transações com valores idênticos)
    const valueFrequency = new Map<number, number>();
    
    for (const [year, yearData] of Object.entries(data.years || {})) {
      const months = (yearData as any)?.months || {};
      
      for (const [month, monthData] of Object.entries(months)) {
        const days = (monthData as any)?.days || {};
        
        for (const [day, dayData] of Object.entries(days)) {
          const transactions = (dayData as any)?.transactions || [];
          for (const transaction of transactions) {
            if (typeof transaction.amount === 'number') {
              const count = valueFrequency.get(transaction.amount) || 0;
              valueFrequency.set(transaction.amount, count + 1);
            }
          }
        }
      }
    }
    
    // Detectar valores muito frequentes
    for (const [amount, frequency] of valueFrequency.entries()) {
      if (frequency > 20) { // Mais de 20 ocorrências do mesmo valor
        anomalies.push({
          type: 'pattern',
          description: `Valor ${amount} aparece ${frequency} vezes (possível padrão suspeito)`,
          confidence: 0.8,
          impact: 'medium',
          affectedData: { amount, frequency },
          suggestedAction: 'Verificar se as transações são legítimas'
        });
      }
    }
    
    return anomalies;
  }

  private detectBusinessRuleAnomalies(data: any): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];
    
    // Detectar gastos muito altos em um único dia
    for (const [year, yearData] of Object.entries(data.years || {})) {
      const months = (yearData as any)?.months || {};
      
      for (const [month, monthData] of Object.entries(months)) {
        const days = (monthData as any)?.days || {};
        
        for (const [day, dayData] of Object.entries(days)) {
          const transactions = (dayData as any)?.transactions || [];
          let dailyExpenses = 0;
          
          for (const transaction of transactions) {
            if (transaction.type === 'expense') {
              dailyExpenses += transaction.amount || 0;
            }
          }
          
          if (dailyExpenses > 10000) { // Mais de R$ 10.000 em um dia
            anomalies.push({
              type: 'business_rule',
              description: `Gastos muito altos em ${year}/${month}/${day}: R$ ${dailyExpenses.toFixed(2)}`,
              confidence: 0.9,
              impact: 'high',
              affectedData: { year, month, day, amount: dailyExpenses },
              suggestedAction: 'Verificar se os gastos são corretos'
            });
          }
        }
      }
    }
    
    return anomalies;
  }

  private detectTemporalAnomalies(data: any): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];
    
    // Detectar atividade em datas futuras
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    
    for (const [year, yearData] of Object.entries(data.years || {})) {
      const yearNum = parseInt(year);
      if (yearNum > currentYear) {
        anomalies.push({
          type: 'temporal',
          description: `Dados em ano futuro: ${year}`,
          confidence: 1.0,
          impact: 'medium',
          affectedData: { year },
          suggestedAction: 'Verificar se as datas estão corretas'
        });
      }
    }
    
    return anomalies;
  }

  // Métodos utilitários
  private loadFinancialData(): any {
    try {
      return JSON.parse(localStorage.getItem('financialData') || '{}');
    } catch (error) {
      return {};
    }
  }

  private buildValidationContext(data: any): ValidationContext {
    let totalTransactions = 0;
    
    for (const [year, yearData] of Object.entries(data.years || {})) {
      const months = (yearData as any)?.months || {};
      
      for (const [month, monthData] of Object.entries(months)) {
        const days = (monthData as any)?.days || {};
        
        for (const [day, dayData] of Object.entries(days)) {
          const transactions = (dayData as any)?.transactions || [];
          totalTransactions += transactions.length;
        }
      }
    }
    
    return {
      currentYear: new Date().getFullYear(),
      currentMonth: new Date().getMonth() + 1,
      totalYears: Object.keys(data.years || {}).length,
      totalTransactions,
      dataSize: JSON.stringify(data).length,
      lastValidation: this.validationHistory.length > 0 ? 
        this.validationHistory[this.validationHistory.length - 1].timestamp : undefined
    };
  }

  private shouldApplyRule(rule: ValidationRule, level: ValidationLevel): boolean {
    const levelOrder = [
      ValidationLevel.BASIC,
      ValidationLevel.STANDARD,
      ValidationLevel.COMPREHENSIVE,
      ValidationLevel.PARANOID
    ];
    
    const ruleIndex = levelOrder.indexOf(rule.level);
    const targetIndex = levelOrder.indexOf(level);
    
    return ruleIndex <= targetIndex;
  }

  private generateSummary(results: ValidationRuleResult[]): ValidationSummary {
    let criticalIssues = 0;
    let errors = 0;
    let warnings = 0;
    let infos = 0;
    
    for (const result of results) {
      if (!result.result.valid) {
        switch (result.severity) {
          case ValidationSeverity.CRITICAL:
            criticalIssues++;
            break;
          case ValidationSeverity.ERROR:
            errors++;
            break;
          case ValidationSeverity.WARNING:
            warnings++;
            break;
          case ValidationSeverity.INFO:
            infos++;
            break;
        }
      }
    }
    
    let overallHealth: ValidationSummary['overallHealth'];
    if (criticalIssues > 0) {
      overallHealth = 'critical';
    } else if (errors > 5) {
      overallHealth = 'poor';
    } else if (errors > 0 || warnings > 10) {
      overallHealth = 'fair';
    } else if (warnings > 0) {
      overallHealth = 'good';
    } else {
      overallHealth = 'excellent';
    }
    
    return {
      criticalIssues,
      errors,
      warnings,
      infos,
      overallHealth
    };
  }

  private calculateIntegrityScore(results: ValidationRuleResult[]): number {
    if (results.length === 0) return 100;
    
    let totalWeight = 0;
    let weightedScore = 0;
    
    for (const result of results) {
      let weight = 1;
      
      switch (result.severity) {
        case ValidationSeverity.CRITICAL:
          weight = 10;
          break;
        case ValidationSeverity.ERROR:
          weight = 5;
          break;
        case ValidationSeverity.WARNING:
          weight = 2;
          break;
        case ValidationSeverity.INFO:
          weight = 1;
          break;
      }
      
      totalWeight += weight;
      if (result.result.valid) {
        weightedScore += weight;
      }
    }
    
    return Math.round((weightedScore / totalWeight) * 100);
  }

  private generateRecommendations(results: ValidationRuleResult[]): string[] {
    const recommendations: string[] = [];
    
    const criticalIssues = results.filter(r => 
      !r.result.valid && r.severity === ValidationSeverity.CRITICAL
    );
    
    const errors = results.filter(r => 
      !r.result.valid && r.severity === ValidationSeverity.ERROR
    );
    
    if (criticalIssues.length > 0) {
      recommendations.push('🚨 Corrigir problemas críticos imediatamente');
      recommendations.push('💾 Fazer backup dos dados antes de qualquer correção');
    }
    
    if (errors.length > 5) {
      recommendations.push('⚠️ Muitos erros detectados - considerar restauração de backup');
    }
    
    const autoFixableIssues = results.filter(r => 
      !r.result.valid && r.result.autoFixable
    );
    
    if (autoFixableIssues.length > 0) {
      recommendations.push(`🔧 ${autoFixableIssues.length} problemas podem ser corrigidos automaticamente`);
    }
    
    const duplicateIssues = results.find(r => r.ruleId === 'duplicate_transaction_detection');
    if (duplicateIssues && !duplicateIssues.result.valid) {
      recommendations.push('🔍 Revisar transações duplicadas manualmente');
    }
    
    return recommendations;
  }

  private deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return a === b;
    if (typeof a !== typeof b) return false;
    
    if (typeof a === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) return false;
      
      for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!this.deepEqual(a[key], b[key])) return false;
      }
      
      return true;
    }
    
    return false;
  }

  private checkCircularReferences(obj: any, visited: Set<any>, path: string): void {
    if (obj === null || typeof obj !== 'object') return;
    
    if (visited.has(obj)) {
      throw new Error(`Referência circular detectada em: ${path}`);
    }
    
    visited.add(obj);
    
    for (const [key, value] of Object.entries(obj)) {
      this.checkCircularReferences(value, visited, `${path}.${key}`);
    }
    
    visited.delete(obj);
  }

  private calculateMaxDepth(obj: any, currentDepth: number = 0): number {
    if (obj === null || typeof obj !== 'object') return currentDepth;
    
    let maxDepth = currentDepth;
    
    for (const value of Object.values(obj)) {
      const depth = this.calculateMaxDepth(value, currentDepth + 1);
      maxDepth = Math.max(maxDepth, depth);
    }
    
    return maxDepth;
  }

  // API pública
  async quickValidation(): Promise<ValidationReport> {
    return await this.validateData(ValidationLevel.BASIC);
  }

  async fullValidation(): Promise<ValidationReport> {
    return await this.validateData(ValidationLevel.COMPREHENSIVE);
  }

  async paranoidValidation(): Promise<ValidationReport> {
    return await this.validateData(ValidationLevel.PARANOID);
  }

  getValidationHistory(): ValidationReport[] {
    return [...this.validationHistory];
  }

  getLastValidation(): ValidationReport | null {
    return this.validationHistory.length > 0 ? 
      this.validationHistory[this.validationHistory.length - 1] : null;
  }

  async autoFixIssues(reportId: string): Promise<boolean> {
    const report = this.validationHistory.find(r => r.id === reportId);
    if (!report) return false;
    
    const data = this.loadFinancialData();
    const context = this.buildValidationContext(data);
    let fixed = false;
    
    for (const result of report.results) {
      if (!result.result.valid && result.result.autoFixable) {
        const rule = this.rules.find(r => r.id === result.ruleId);
        if (rule?.autoFix) {
          try {
            const fixedData = rule.autoFix(data, context);
            localStorage.setItem('financialData', JSON.stringify(fixedData));
            fixed = true;
          } catch (error) {
            console.error(`Erro ao corrigir regra ${rule.id}:`, error);
          }
        }
      }
    }
    
    return fixed;
  }

  addCustomRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  getRules(): ValidationRule[] {
    return [...this.rules];
  }

  async detectAnomalies(): Promise<AnomalyDetection[]> {
    const data = this.loadFinancialData();
    const allAnomalies: AnomalyDetection[] = [];
    
    for (const [type, detector] of this.anomalyDetectors.entries()) {
      try {
        const anomalies = detector(data);
        allAnomalies.push(...anomalies);
      } catch (error) {
        console.error(`Erro no detector ${type}:`, error);
      }
    }
    
    return allAnomalies;
  }
}

// Instância global
export const dataValidator = new AdvancedDataValidator();

// Hook para usar o validador
export function useDataValidator() {
  const [isValidating, setIsValidating] = useState(false);
  const [lastReport, setLastReport] = useState<ValidationReport | null>(null);
  
  const validate = useCallback(async (level: ValidationLevel = ValidationLevel.STANDARD) => {
    setIsValidating(true);
    try {
      const report = await dataValidator.validateData(level);
      setLastReport(report);
      return report;
    } finally {
      setIsValidating(false);
    }
  }, []);
  
  const quickValidate = useCallback(() => validate(ValidationLevel.BASIC), [validate]);
  const fullValidate = useCallback(() => validate(ValidationLevel.COMPREHENSIVE), [validate]);
  
  return {
    validate,
    quickValidate,
    fullValidate,
    isValidating,
    lastReport,
    history: dataValidator.getValidationHistory(),
    autoFix: dataValidator.autoFixIssues.bind(dataValidator),
    detectAnomalies: dataValidator.detectAnomalies.bind(dataValidator)
  };
}

export default dataValidator;