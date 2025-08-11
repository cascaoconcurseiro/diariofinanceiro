# 🔧 CORREÇÕES URGENTES - BUGS CRÍTICOS

## 🚨 IMPLEMENTAR IMEDIATAMENTE

### 1. **CORREÇÃO: Precisão Decimal (CALC-001)**

**Arquivo:** `src/utils/currencyUtils.ts`

```typescript
// ❌ CÓDIGO ATUAL (BUGADO)
export const calculateBalance = (
  previousBalance: number,
  entrada: number,
  saida: number,
  diario: number
): number => {
  const newBalance = previousBalance + entrada - saida - diario;
  return validateAmount(newBalance);
};

// ✅ CÓDIGO CORRIGIDO
export const calculateBalance = (
  previousBalance: number,
  entrada: number,
  saida: number,
  diario: number
): number => {
  // Trabalhar com centavos para evitar problemas de precisão
  const prevCents = Math.round(previousBalance * 100);
  const entrCents = Math.round(entrada * 100);
  const saidCents = Math.round(saida * 100);
  const diarCents = Math.round(diario * 100);
  
  const newBalanceCents = prevCents + entrCents - saidCents - diarCents;
  const newBalance = newBalanceCents / 100;
  
  return validateAmount(newBalance);
};
```

### 2. **CORREÇÃO: Parsing de Valores Negativos (PARSE-002)**

**Arquivo:** `src/utils/currencyUtils.ts`

```typescript
// ❌ CÓDIGO ATUAL (BUGADO)
export const parseCurrency = (value: string): number => {
  if (!value || value === "" || value === "R$ 0,00") return 0;
  return sanitizeAmount(value);
};

// ✅ CÓDIGO CORRIGIDO
export const parseCurrency = (value: string): number => {
  if (!value || value === "" || value === "R$ 0,00") return 0;
  
  const cleanValue = value.toString().trim();
  
  // Detectar se é negativo
  const isNegative = cleanValue.startsWith('-') || cleanValue.includes('(');
  
  // Remover símbolos e manter apenas números, vírgula e ponto
  let numericValue = cleanValue
    .replace(/[-()R$\s]/g, '')
    .replace(/\./g, '') // Remove separadores de milhares
    .replace(',', '.'); // Converte vírgula decimal para ponto
  
  const parsed = parseFloat(numericValue) || 0;
  const result = isNegative ? -Math.abs(parsed) : parsed;
  
  return sanitizeAmount(result);
};
```

### 3. **CORREÇÃO: Propagação Entre Anos (PROP-001)**

**Arquivo:** `src/hooks/useBalancePropagation.ts`

```typescript
// ✅ ADICIONAR esta função corrigida
const propagateYearEndBalance = useCallback((data: FinancialData, year: number): void => {
  console.log(`🔗 Propagating balance from ${year} to ${year + 1}`);
  
  // Obter saldo do último dia de dezembro
  const decemberBalance = getLastDecemberBalance(data, year);
  
  if (decemberBalance !== 0) {
    // Inicializar próximo ano se necessário
    initializeDataStructure(data, year + 1, 0, 1);
    
    // CRÍTICO: Aplicar saldo herdado no primeiro dia do próximo ano
    if (data[year + 1] && data[year + 1][0] && data[year + 1][0][1]) {
      // Preservar transações existentes, apenas herdar saldo base
      const existingEntrada = parseCurrency(data[year + 1][0][1].entrada);
      const existingSaida = parseCurrency(data[year + 1][0][1].saida);
      const existingDiario = parseCurrency(data[year + 1][0][1].diario);
      
      // Recalcular com saldo herdado
      const newBalance = calculateBalance(decemberBalance, existingEntrada, existingSaida, existingDiario);
      data[year + 1][0][1].balance = newBalance;
      
      console.log(`✅ Balance propagated: ${decemberBalance} → ${newBalance} (${year + 1}-01-01)`);
    }
  }
}, [getLastDecemberBalance, initializeDataStructure]);

// ✅ CORRIGIR a função principal
const recalculateWithFullPropagation = useCallback((
  data: FinancialData,
  startYear?: number,
  startMonth?: number,
  startDay?: number
): FinancialData => {
  // ... código existente ...
  
  // ADICIONAR após terminar cada ano:
  for (let year = firstYear; year <= maxYear; year++) {
    // ... código de recálculo do ano ...
    
    // CRÍTICO: Propagar para próximo ano
    if (year < maxYear) {
      propagateYearEndBalance(newData, year);
    }
  }
  
  return newData;
}, [/* dependencies */]);
```

### 4. **CORREÇÃO: Transações em Meses Passados (RECUR-001)**

**Arquivo:** `src/hooks/useRecurringProcessor.ts`

```typescript
// ✅ CÓDIGO CORRIGIDO
const processRecurringTransactions = useCallback((
  recurringTransactions: RecurringTransaction[],
  year: number,
  month: number,
  addToDay: (year: number, month: number, day: number, type: 'entrada' | 'saida' | 'diario', amount: number) => void,
  updateRecurringTransaction: (id: string, updates: Partial<RecurringTransaction>) => void
) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();
  
  // CRÍTICO: Verificação rigorosa de data
  const targetDate = new Date(year, month, 1);
  const currentDate = new Date(currentYear, currentMonth, 1);
  
  // NÃO processar meses passados (exceto o atual)
  if (targetDate < currentDate) {
    console.log(`⏭️ BLOCKED: Cannot process past month ${year}-${month + 1}`);
    return;
  }
  
  const activeTransactions = recurringTransactions.filter(t => t.isActive);
  
  activeTransactions.forEach(transaction => {
    const { dayOfMonth, type, amount, frequency, startDate, id } = transaction;
    
    // Verificar se transação já deveria ter começado
    const startDateObj = new Date(startDate);
    if (targetDate < new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1)) {
      console.log(`⏭️ Transaction ${id} hasn't started yet`);
      return;
    }
    
    // Para mês atual, só processar dias futuros
    const isCurrentMonth = year === currentYear && month === currentMonth;
    if (isCurrentMonth && dayOfMonth <= currentDay) {
      console.log(`⏭️ Day ${dayOfMonth} already passed in current month`);
      return;
    }
    
    // Ajustar dia para meses com menos dias
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const targetDay = Math.min(dayOfMonth, daysInMonth);
    
    console.log(`💰 Processing recurring ${type}: ${amount} on ${year}-${month+1}-${targetDay}`);
    addToDay(year, month, targetDay, type, amount);
    
    // Atualizar contadores apenas para meses futuros
    if (!isCurrentMonth) {
      // ... código de atualização de contadores ...
    }
  });
}, []);
```

### 5. **CORREÇÃO: Gestão de Quota do localStorage (STOR-001)**

**Arquivo:** `src/hooks/useFinancialData.ts`

```typescript
// ✅ ADICIONAR função de limpeza automática
const cleanupOldDataIfNeeded = useCallback((newData: FinancialData): FinancialData => {
  try {
    const dataString = JSON.stringify(newData);
    const sizeInMB = new Blob([dataString]).size / (1024 * 1024);
    
    // Se dados excedem 3MB, fazer limpeza
    if (sizeInMB > 3) {
      console.log(`🧹 Data size ${sizeInMB.toFixed(2)}MB - cleaning up old data`);
      
      const currentYear = new Date().getFullYear();
      const cleanedData: FinancialData = {};
      
      // Manter apenas últimos 3 anos
      Object.keys(newData).forEach(yearStr => {
        const year = parseInt(yearStr);
        if (year >= currentYear - 2) {
          cleanedData[yearStr] = newData[yearStr];
        }
      });
      
      console.log(`✅ Cleaned data: ${Object.keys(newData).length} → ${Object.keys(cleanedData).length} years`);
      return cleanedData;
    }
    
    return newData;
  } catch (error) {
    console.error('❌ Error in cleanup:', error);
    return newData;
  }
}, []);

// ✅ CORRIGIR função de salvamento
useEffect(() => {
  if (Object.keys(data).length === 0) return;
  
  try {
    // Limpar dados antigos se necessário
    const cleanedData = cleanupOldDataIfNeeded(data);
    
    const dataString = JSON.stringify(cleanedData);
    
    // Verificar quota antes de salvar
    if (dataString.length > 4 * 1024 * 1024) { // 4MB
      console.error('❌ Data too large for localStorage');
      // Forçar limpeza mais agressiva
      const currentYear = new Date().getFullYear();
      const emergencyCleanData = { [currentYear]: cleanedData[currentYear] };
      localStorage.setItem('financialData', JSON.stringify(emergencyCleanData));
    } else {
      localStorage.setItem('financialData', dataString);
    }
    
    console.log('💾 Data saved successfully');
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.error('❌ localStorage quota exceeded - emergency cleanup');
      // Manter apenas ano atual
      const currentYear = new Date().getFullYear();
      const emergencyData = { [currentYear]: data[currentYear] };
      localStorage.setItem('financialData', JSON.stringify(emergencyData));
    } else {
      console.error('❌ Error saving data:', error);
    }
  }
}, [data, cleanupOldDataIfNeeded]);
```

---

## 🧪 TESTES PARA VALIDAR CORREÇÕES

### Teste 1: Precisão Decimal
```javascript
// Deve retornar exatamente 0.30
const result = calculateBalance(0, 0.1, 0, 0) + 0.2;
console.assert(result === 0.30, 'Decimal precision failed');
```

### Teste 2: Valores Negativos
```javascript
// Deve retornar -50.25
const result = parseCurrency('-R$ 50,25');
console.assert(result === -50.25, 'Negative parsing failed');
```

### Teste 3: Propagação de Anos
```javascript
// Criar transação em dezembro e verificar janeiro
// Saldo deve ser propagado corretamente
```

### Teste 4: Meses Passados
```javascript
// Tentar processar transação recorrente em mês passado
// Deve ser bloqueado
```

### Teste 5: Quota do Storage
```javascript
// Preencher dados até limite
// Deve fazer limpeza automática
```

---

## ⚡ IMPLEMENTAÇÃO RÁPIDA

### Ordem de Implementação:
1. **Precisão Decimal** (30 min) - Mais crítico
2. **Parsing Negativo** (20 min) - Impacta cálculos
3. **Quota Storage** (45 min) - Evita perda de dados
4. **Propagação Anos** (60 min) - Mais complexo
5. **Meses Passados** (30 min) - Proteção de dados

### Total: ~3 horas de desenvolvimento

---

## ✅ CHECKLIST DE VALIDAÇÃO

- [ ] Precisão decimal corrigida
- [ ] Parsing de negativos funcionando
- [ ] Propagação entre anos testada
- [ ] Bloqueio de meses passados ativo
- [ ] Gestão de quota implementada
- [ ] Testes automatizados passando
- [ ] Performance mantida
- [ ] Dados existentes preservados

**Após implementar todas as correções, executar:**
```javascript
runCompleteAnalysis()
```

**Meta:** Taxa de sucesso > 95% e 0 bugs críticos.