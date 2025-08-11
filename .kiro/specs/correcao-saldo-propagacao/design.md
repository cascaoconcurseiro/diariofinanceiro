# Design Document - Correção de Saldo e Propagação

## Overview

Este documento descreve o design técnico para corrigir os problemas críticos de cálculo de saldo e propagação entre períodos. O sistema atual não está atualizando saldos corretamente nem propagando valores entre anos, causando inconsistências nos dados financeiros.

## Architecture

### Fluxo de Dados Atual (Problemático)
```
Input → updateDayData → data state → (saldo não atualiza)
```

### Fluxo de Dados Corrigido
```
Input → updateDayData → triggerRecalculation → propagateBalances → updateUI
```

### Componentes Principais

1. **BalanceCalculator**: Motor de cálculo com precisão decimal
2. **PropagationEngine**: Sistema de propagação entre períodos
3. **DataValidator**: Validador de integridade de dados
4. **RecalculationTrigger**: Gatilho automático de recálculos

## Components and Interfaces

### 1. Enhanced Balance Calculator

```typescript
interface EnhancedBalanceCalculator {
  calculateDayBalance(
    previousBalance: number,
    entrada: number,
    saida: number,
    diario: number
  ): number;
  
  recalculateFromPoint(
    data: FinancialData,
    startYear: number,
    startMonth: number,
    startDay: number
  ): FinancialData;
  
  validateCalculation(
    expected: number,
    actual: number
  ): boolean;
}
```

### 2. Propagation Engine

```typescript
interface PropagationEngine {
  propagateDayToDay(
    data: FinancialData,
    year: number,
    month: number,
    day: number
  ): void;
  
  propagateMonthToMonth(
    data: FinancialData,
    year: number,
    month: number
  ): void;
  
  propagateYearToYear(
    data: FinancialData,
    year: number
  ): void;
  
  fullPropagation(
    data: FinancialData,
    startPoint: DatePoint
  ): FinancialData;
}
```

### 3. Real-time Update System

```typescript
interface RealTimeUpdater {
  onValueChange(
    year: number,
    month: number,
    day: number,
    field: 'entrada' | 'saida' | 'diario',
    value: string
  ): void;
  
  triggerImmediateRecalculation(
    startPoint: DatePoint
  ): Promise<void>;
  
  updateUIWithNewBalances(
    updatedData: FinancialData
  ): void;
}
```

## Data Models

### Enhanced Day Data Structure

```typescript
interface EnhancedDayData {
  entrada: string;
  saida: string;
  diario: string;
  balance: number;
  calculatedAt: string; // timestamp
  isValid: boolean;
  previousBalance: number; // for debugging
  calculationLog?: string; // for debugging
}
```

### Calculation Context

```typescript
interface CalculationContext {
  startPoint: DatePoint;
  affectedPeriods: DateRange[];
  calculationTime: number;
  errors: CalculationError[];
  warnings: CalculationWarning[];
}
```

### Date Point

```typescript
interface DatePoint {
  year: number;
  month: number;
  day: number;
}
```

## Error Handling

### Calculation Errors

1. **Precision Errors**: Detectar e corrigir problemas de precisão decimal
2. **Propagation Failures**: Recuperar de falhas na propagação
3. **Data Corruption**: Detectar e corrigir dados corrompidos
4. **Performance Issues**: Otimizar cálculos lentos

### Error Recovery Strategy

```typescript
interface ErrorRecovery {
  detectInconsistency(data: FinancialData): InconsistencyReport;
  repairData(data: FinancialData, report: InconsistencyReport): FinancialData;
  validateRepair(originalData: FinancialData, repairedData: FinancialData): boolean;
}
```

## Testing Strategy

### Unit Tests

1. **Balance Calculation Tests**
   - Precisão decimal
   - Valores negativos
   - Valores extremos
   - Arredondamento

2. **Propagation Tests**
   - Dia para dia
   - Mês para mês
   - Ano para ano
   - Propagação completa

3. **Real-time Update Tests**
   - Atualização imediata
   - Múltiplas atualizações
   - Concorrência

### Integration Tests

1. **End-to-End Scenarios**
   - Inserir valor e verificar propagação
   - Modificar valor antigo e verificar recálculo
   - Transição de ano
   - Recuperação de dados corrompidos

2. **Performance Tests**
   - Cálculo com 1000+ transações
   - Propagação de múltiplos anos
   - Responsividade da interface

### Validation Tests

1. **Data Integrity Tests**
   - Consistência de saldos
   - Continuidade entre períodos
   - Validação de fórmulas

## Implementation Plan

### Phase 1: Core Balance Calculator (Crítico)

```typescript
// Implementar cálculo com precisão decimal
const calculateBalanceWithPrecision = (prev: number, entrada: number, saida: number, diario: number): number => {
  // Converter para centavos
  const prevCents = Math.round(prev * 100);
  const entrCents = Math.round(entrada * 100);
  const saidCents = Math.round(saida * 100);
  const diarCents = Math.round(diario * 100);
  
  // Calcular em centavos
  const resultCents = prevCents + entrCents - saidCents - diarCents;
  
  // Converter de volta para reais
  return Math.round(resultCents) / 100;
};
```

### Phase 2: Real-time Propagation (Crítico)

```typescript
// Implementar propagação imediata
const propagateFromPoint = (data: FinancialData, startYear: number, startMonth: number, startDay: number): FinancialData => {
  const newData = { ...data };
  
  // Propagar a partir do ponto especificado
  for (let year = startYear; year <= getCurrentYear() + 1; year++) {
    for (let month = (year === startYear ? startMonth : 0); month < 12; month++) {
      if (!newData[year] || !newData[year][month]) continue;
      
      const daysInMonth = getDaysInMonth(year, month);
      for (let day = (year === startYear && month === startMonth ? startDay : 1); day <= daysInMonth; day++) {
        if (!newData[year][month][day]) continue;
        
        // Calcular saldo do dia
        const dayData = newData[year][month][day];
        const previousBalance = getPreviousBalance(newData, year, month, day);
        const newBalance = calculateBalanceWithPrecision(
          previousBalance,
          parseCurrency(dayData.entrada),
          parseCurrency(dayData.saida),
          parseCurrency(dayData.diario)
        );
        
        dayData.balance = newBalance;
        dayData.calculatedAt = new Date().toISOString();
        dayData.isValid = true;
      }
    }
  }
  
  return newData;
};
```

### Phase 3: Year-to-Year Propagation (Crítico)

```typescript
// Implementar propagação entre anos
const propagateYearEndBalance = (data: FinancialData, year: number): void => {
  // Obter saldo do último dia de dezembro
  const decemberBalance = getLastDayBalance(data, year, 11);
  
  if (decemberBalance !== undefined && decemberBalance !== 0) {
    // Inicializar próximo ano se necessário
    if (!data[year + 1]) data[year + 1] = {};
    if (!data[year + 1][0]) data[year + 1][0] = {};
    if (!data[year + 1][0][1]) {
      data[year + 1][0][1] = {
        entrada: "R$ 0,00",
        saida: "R$ 0,00",
        diario: "R$ 0,00",
        balance: decemberBalance,
        calculatedAt: new Date().toISOString(),
        isValid: true,
        previousBalance: decemberBalance
      };
    } else {
      // Recalcular com saldo herdado
      const dayData = data[year + 1][0][1];
      const newBalance = calculateBalanceWithPrecision(
        decemberBalance,
        parseCurrency(dayData.entrada),
        parseCurrency(dayData.saida),
        parseCurrency(dayData.diario)
      );
      dayData.balance = newBalance;
      dayData.previousBalance = decemberBalance;
      dayData.calculatedAt = new Date().toISOString();
      dayData.isValid = true;
    }
  }
};
```

### Phase 4: Real-time UI Updates (Crítico)

```typescript
// Implementar atualização imediata da interface
const updateDayDataWithImmediateRecalculation = (
  year: number,
  month: number,
  day: number,
  field: 'entrada' | 'saida' | 'diario',
  value: string
): void => {
  // Atualizar valor
  setData(prevData => {
    const newData = { ...prevData };
    
    // Garantir estrutura existe
    if (!newData[year]) newData[year] = {};
    if (!newData[year][month]) newData[year][month] = {};
    if (!newData[year][month][day]) {
      newData[year][month][day] = {
        entrada: "R$ 0,00",
        saida: "R$ 0,00",
        diario: "R$ 0,00",
        balance: 0,
        calculatedAt: new Date().toISOString(),
        isValid: false,
        previousBalance: 0
      };
    }
    
    // Atualizar campo
    newData[year][month][day][field] = formatCurrency(parseCurrency(value));
    
    // CRÍTICO: Recalcular imediatamente a partir deste ponto
    const recalculatedData = propagateFromPoint(newData, year, month, day);
    
    return recalculatedData;
  });
};
```

## Performance Optimizations

### 1. Lazy Calculation
- Calcular apenas períodos visíveis inicialmente
- Expandir cálculo conforme necessário

### 2. Memoization
- Cache de cálculos frequentes
- Invalidação inteligente de cache

### 3. Batch Updates
- Agrupar múltiplas atualizações
- Debounce para evitar cálculos excessivos

### 4. Worker Threads
- Cálculos pesados em background
- Interface responsiva durante processamento

## Monitoring and Debugging

### 1. Calculation Logs
```typescript
interface CalculationLog {
  timestamp: string;
  operation: string;
  input: any;
  output: any;
  duration: number;
  errors: string[];
}
```

### 2. Health Checks
```typescript
interface HealthCheck {
  checkDataIntegrity(): IntegrityReport;
  validateCalculations(): ValidationReport;
  checkPerformance(): PerformanceReport;
}
```

### 3. Debug Interface
- Visualização de logs de cálculo
- Inspeção de dados internos
- Ferramentas de diagnóstico

## Migration Strategy

### 1. Data Migration
- Converter dados existentes para novo formato
- Recalcular todos os saldos
- Validar integridade após migração

### 2. Backward Compatibility
- Suportar formato antigo temporariamente
- Migração gradual de dados
- Fallback para formato antigo em caso de erro

### 3. Rollback Plan
- Backup de dados antes da migração
- Capacidade de reverter mudanças
- Validação de rollback