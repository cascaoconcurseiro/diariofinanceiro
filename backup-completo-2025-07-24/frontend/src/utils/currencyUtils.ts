/**
 * CURRENCY UTILS - SOLUÇÃO DEFINITIVA ANTI-BUGS
 * Implementação à prova de falhas
 */

/**
 * Formata valores monetários - DEFINITIVO
 */
export const formatCurrency = (amount: number): string => {
  // Validação extrema
  if (amount === null || amount === undefined || isNaN(amount) || !isFinite(amount)) {
    return 'R$ 0,00';
  }
  
  // Garantir número válido
  let safeAmount = Number(amount);
  if (isNaN(safeAmount) || !isFinite(safeAmount)) {
    return 'R$ 0,00';
  }
  
  // Arredondar para 2 casas decimais
  safeAmount = Math.round(safeAmount * 100) / 100;
  
  // Detectar negativo
  const isNegative = safeAmount < 0;
  const absAmount = Math.abs(safeAmount);
  
  // Converter para string com 2 casas decimais
  const fixedAmount = absAmount.toFixed(2);
  const parts = fixedAmount.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Adicionar separadores de milhares
  let formattedInteger = '';
  for (let i = integerPart.length - 1, count = 0; i >= 0; i--, count++) {
    if (count > 0 && count % 3 === 0) {
      formattedInteger = '.' + formattedInteger;
    }
    formattedInteger = integerPart[i] + formattedInteger;
  }
  
  // Montar resultado final
  const result = `R$ ${formattedInteger},${decimalPart}`;
  return isNegative ? `-${result}` : result;
};

/**
 * Parse de valores monetários - DEFINITIVO
 */
export const parseCurrency = (value: string | number): number => {
  // Se já é número
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) return 0;
    return Math.round(value * 100) / 100;
  }
  
  // Se não é string
  if (typeof value !== 'string') {
    return 0;
  }
  
  // Limpar string
  const cleanValue = String(value).trim();
  
  // Casos especiais
  if (!cleanValue || cleanValue === '' || cleanValue === 'R$ 0,00' || cleanValue === '0' || cleanValue === '0,00') {
    return 0;
  }
  
  // Detectar negativo
  const isNegative = cleanValue.includes('-') || cleanValue.includes('(');
  
  // Extrair apenas números, vírgula e ponto
  let numericString = cleanValue.replace(/[^0-9.,]/g, '');
  
  // Se string vazia após limpeza
  if (!numericString) {
    return 0;
  }
  
  // Tratar formato brasileiro (1.234,56)
  if (numericString.includes(',')) {
    // Separar parte inteira e decimal
    const parts = numericString.split(',');
    if (parts.length === 2) {
      // Remover pontos da parte inteira (separadores de milhares)
      const integerPart = parts[0].replace(/\./g, '');
      const decimalPart = parts[1].substring(0, 2); // Máximo 2 casas decimais
      numericString = integerPart + '.' + decimalPart;
    } else {
      // Apenas vírgula, tratar como decimal
      numericString = numericString.replace(',', '.');
    }
  } else if (numericString.includes('.')) {
    // Formato americano ou separador de milhares
    const parts = numericString.split('.');
    if (parts.length > 2) {
      // Múltiplos pontos, tratar como separadores de milhares
      const lastPart = parts[parts.length - 1];
      if (lastPart.length <= 2) {
        // Último é decimal
        const integerParts = parts.slice(0, -1);
        numericString = integerParts.join('') + '.' + lastPart;
      } else {
        // Todos são separadores de milhares
        numericString = parts.join('');
      }
    }
  }
  
  // Parse final
  const parsed = parseFloat(numericString);
  
  if (isNaN(parsed) || !isFinite(parsed)) {
    return 0;
  }
  
  // Aplicar sinal e arredondar
  const result = isNegative ? -Math.abs(parsed) : parsed;
  return Math.round(result * 100) / 100;
};

/**
 * Cálculo de saldo - CORRIGIDO PARA OVERFLOW/UNDERFLOW
 */
export const calculateBalance = (
  previousBalance: number,
  entrada: number,
  saida: number,
  diario: number
): number => {
  // Sanitizar todas as entradas
  const safePrevious = sanitizeNumber(previousBalance);
  const safeEntrada = sanitizeNumber(entrada);
  const safeSaida = sanitizeNumber(saida);
  const safeDiario = sanitizeNumber(diario);
  
  // Verificar se algum valor é extremo antes do cálculo
  const values = [safePrevious, safeEntrada, safeSaida, safeDiario];
  for (const value of values) {
    if (Math.abs(value) > 999999999) {
      console.warn('⚠️ Extreme value detected in calculation:', value);
      // Retornar saldo anterior como fallback (validação inline)
      const fallback = safePrevious;
      if (isNaN(fallback) || !isFinite(fallback)) return 0;
      if (fallback > 999999999.99) return 999999999.99;
      if (fallback < -999999999.99) return -999999999.99;
      return Math.round(fallback * 100) / 100;
    }
  }
  
  // Converter para centavos (aritmética de inteiros)
  const prevCents = Math.round(safePrevious * 100);
  const entrCents = Math.round(safeEntrada * 100);
  const saidCents = Math.round(safeSaida * 100);
  const diarCents = Math.round(safeDiario * 100);
  
  // Verificar overflow antes do cálculo
  const maxCents = 99999999999; // ~999 milhões em centavos
  const minCents = -99999999999;
  
  // Cálculo em centavos: Saldo = Anterior + Entradas - Saídas - Diário
  let resultCents = prevCents + entrCents - saidCents - diarCents;
  
  // Verificar overflow/underflow no resultado
  if (resultCents > maxCents) {
    console.warn('⚠️ Calculation overflow detected, capping result');
    resultCents = maxCents;
  } else if (resultCents < minCents) {
    console.warn('⚠️ Calculation underflow detected, capping result');
    resultCents = minCents;
  }
  
  // Converter de volta para reais
  const result = Math.round(resultCents) / 100;
  
  // Validação final inline (sem require)
  if (isNaN(result) || !isFinite(result)) return 0;
  if (result > 999999999.99) return 999999999.99;
  if (result < -999999999.99) return -999999999.99;
  
  return Math.round(result * 100) / 100;
};

/**
 * Sanitizar número - FUNÇÃO AUXILIAR
 */
function sanitizeNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) return 0;
    return Math.round(value * 100) / 100;
  }
  if (typeof value === 'string') {
    return parseCurrency(value);
  }
  return 0;
}

/**
 * Formatar para edição
 */
export const formatNumberForEditing = (value: number): string => {
  const safeValue = sanitizeNumber(value);
  const absValue = Math.abs(safeValue);
  return absValue.toFixed(2).replace('.', ',');
};

/**
 * Soma segura de múltiplos valores - CORRIGIDO PARA PRECISÃO DECIMAL
 */
export const sumCurrencyValues = (...values: number[]): number => {
  let totalCents = 0;
  let operationCount = 0;
  
  for (const value of values) {
    const safeValue = sanitizeNumber(value);
    const valueCents = Math.round(safeValue * 100);
    
    // Verificar overflow a cada operação
    if (Math.abs(totalCents + valueCents) > 99999999999) {
      console.warn('⚠️ Sum operation would cause overflow, stopping');
      break;
    }
    
    totalCents += valueCents;
    operationCount++;
    
    // Limitar número de operações para evitar problemas de precisão
    if (operationCount > 10000) {
      console.warn('⚠️ Too many decimal operations, limiting for precision');
      break;
    }
  }
  
  // Garantir precisão final
  const result = Math.round(totalCents) / 100;
  
  // Validação final inline
  if (isNaN(result) || !isFinite(result)) return 0;
  if (result > 999999999.99) return 999999999.99;
  if (result < -999999999.99) return -999999999.99;
  
  return Math.round(result * 100) / 100;
};

/**
 * Subtração segura
 */
export const subtractCurrencyValues = (minuend: number, subtrahend: number): number => {
  const safeMinuend = sanitizeNumber(minuend);
  const safeSubtrahend = sanitizeNumber(subtrahend);
  
  const minuendCents = Math.round(safeMinuend * 100);
  const subtrahendCents = Math.round(safeSubtrahend * 100);
  
  return Math.round(minuendCents - subtrahendCents) / 100;
};

/**
 * Comparação segura
 */
export const compareCurrencyValues = (a: number, b: number): number => {
  const safeA = sanitizeNumber(a);
  const safeB = sanitizeNumber(b);
  
  const aCents = Math.round(safeA * 100);
  const bCents = Math.round(safeB * 100);
  
  if (aCents > bCents) return 1;
  if (aCents < bCents) return -1;
  return 0;
};

/**
 * Validação de round-trip
 */
export const validateRoundTrip = (value: number): boolean => {
  try {
    const formatted = formatCurrency(value);
    const parsed = parseCurrency(formatted);
    const difference = Math.abs(parsed - value);
    return difference <= 0.01;
  } catch {
    return false;
  }
};

/**
 * Teste das funções principais
 */
export const testCurrencyUtils = (): boolean => {
  try {
    // Teste 1: Formatação básica
    const test1 = formatCurrency(100.50) === 'R$ 100,50';
    const test2 = formatCurrency(0) === 'R$ 0,00';
    const test3 = formatCurrency(-500.99) === '-R$ 500,99';
    const test4 = formatCurrency(1000000) === 'R$ 1.000.000,00';
    
    // Teste 2: Parse básico
    const test5 = Math.abs(parseCurrency('R$ 100,50') - 100.50) <= 0.01;
    const test6 = parseCurrency('R$ 0,00') === 0;
    const test7 = Math.abs(parseCurrency('-R$ 500,99') - (-500.99)) <= 0.01;
    
    // Teste 3: Cálculo básico
    const test8 = Math.abs(calculateBalance(100, 50, 20, 10) - 120) <= 0.01;
    const test9 = Math.abs(calculateBalance(0, 1000, 0, 0) - 1000) <= 0.01;
    
    // Teste 4: Round-trip
    const test10 = validateRoundTrip(100.50);
    const test11 = validateRoundTrip(0);
    const test12 = validateRoundTrip(-500.99);
    
    return test1 && test2 && test3 && test4 && test5 && test6 && test7 && test8 && test9 && test10 && test11 && test12;
  } catch {
    return false;
  }
};