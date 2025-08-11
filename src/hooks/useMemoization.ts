/**
 * HOOKS DE MEMOIZAÇÃO AVANÇADA
 * 
 * Implementa estratégias avançadas de memoização para otimizar performance
 */

import { useMemo, useCallback, useRef, useEffect, useState, DependencyList } from 'react';

/**
 * Hook para memoização com deep comparison
 */
export function useDeepMemo<T>(factory: () => T, deps: DependencyList): T {
  const ref = useRef<{ deps: DependencyList; value: T }>();

  // Comparação profunda de dependências
  const depsChanged = !ref.current || deps.some((dep, i) => {
    return JSON.stringify(dep) !== JSON.stringify(ref.current!.deps[i]);
  });

  if (depsChanged) {
    ref.current = { deps, value: factory() };
  }

  return ref.current!.value;
}

/**
 * Hook para memoização com TTL (time to live)
 */
export function useTTLMemo<T>(factory: () => T, deps: DependencyList, ttl: number): T {
  const ref = useRef<{ value: T; timestamp: number }>();
  const [, forceUpdate] = useState({});

  // Calcular valor se não existir ou expirou
  if (!ref.current || Date.now() - ref.current.timestamp > ttl) {
    ref.current = { value: factory(), timestamp: Date.now() };
  }

  // Forçar recálculo quando deps mudarem
  useEffect(() => {
    ref.current = { value: factory(), timestamp: Date.now() };
    forceUpdate({});
  }, deps);

  // Forçar recálculo quando TTL expirar
  useEffect(() => {
    const timer = setTimeout(() => {
      forceUpdate({});
    }, ttl);

    return () => clearTimeout(timer);
  }, [ttl, ...deps]);

  return ref.current.value;
}

/**
 * Hook para memoização com limite de tamanho
 */
export function useSizedMemo<T>(
  factory: () => T[],
  deps: DependencyList,
  maxSize: number
): T[] {
  return useMemo(() => {
    const result = factory();
    return result.slice(0, maxSize);
  }, deps);
}

/**
 * Hook para memoização com debounce
 */
export function useDebouncedMemo<T>(
  factory: () => T,
  deps: DependencyList,
  delay: number
): T {
  const [value, setValue] = useState<T>(() => factory());

  useEffect(() => {
    const handler = setTimeout(() => {
      setValue(factory());
    }, delay);

    return () => clearTimeout(handler);
  }, deps);

  return value;
}

/**
 * Hook para memoização com throttle
 */
export function useThrottledMemo<T>(
  factory: () => T,
  deps: DependencyList,
  limit: number
): T {
  const [value, setValue] = useState<T>(() => factory());
  const lastRun = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRun.current;

    if (timeSinceLastRun >= limit) {
      setValue(factory());
      lastRun.current = now;
    } else {
      const timeout = setTimeout(() => {
        setValue(factory());
        lastRun.current = Date.now();
      }, limit - timeSinceLastRun);

      return () => clearTimeout(timeout);
    }
  }, deps);

  return value;
}

/**
 * Hook para memoização com cache LRU (Least Recently Used)
 */
export function useLRUMemo<K, V>(
  keyFactory: () => K,
  valueFactory: (key: K) => V,
  deps: DependencyList,
  maxSize: number = 100
): V {
  const cacheRef = useRef<Map<string, V>>(new Map());
  const key = keyFactory();
  const keyString = JSON.stringify(key);

  // Usar valor do cache se existir
  if (cacheRef.current.has(keyString)) {
    // Mover para o final (mais recente)
    const value = cacheRef.current.get(keyString)!;
    cacheRef.current.delete(keyString);
    cacheRef.current.set(keyString, value);
    return value;
  }

  // Calcular novo valor
  const value = valueFactory(key);

  // Adicionar ao cache
  cacheRef.current.set(keyString, value);

  // Limitar tamanho do cache
  if (cacheRef.current.size > maxSize) {
    // Remover o item mais antigo (primeiro inserido)
    const oldestKey = cacheRef.current.keys().next().value;
    cacheRef.current.delete(oldestKey);
  }

  return value;
}

/**
 * Hook para memoização com cache de dois níveis
 */
export function useTwoTierMemo<T>(
  factory: () => T,
  deps: DependencyList,
  options: { l1Size?: number; l2TTL?: number } = {}
): T {
  const { l1Size = 10, l2TTL = 60000 } = options;
  const l1CacheRef = useRef<Map<string, T>>(new Map());
  const l2CacheRef = useRef<Map<string, { value: T; timestamp: number }>>(new Map());
  
  const depsKey = JSON.stringify(deps);

  // Verificar L1 cache (mais rápido)
  if (l1CacheRef.current.has(depsKey)) {
    return l1CacheRef.current.get(depsKey)!;
  }

  // Verificar L2 cache (com TTL)
  const l2Entry = l2CacheRef.current.get(depsKey);
  if (l2Entry && Date.now() - l2Entry.timestamp < l2TTL) {
    // Promover para L1
    l1CacheRef.current.set(depsKey, l2Entry.value);
    
    // Limitar L1
    if (l1CacheRef.current.size > l1Size) {
      const oldestKey = l1CacheRef.current.keys().next().value;
      l1CacheRef.current.delete(oldestKey);
    }
    
    return l2Entry.value;
  }

  // Calcular novo valor
  const value = factory();

  // Armazenar em ambos os caches
  l1CacheRef.current.set(depsKey, value);
  l2CacheRef.current.set(depsKey, { value, timestamp: Date.now() });

  // Limitar tamanhos
  if (l1CacheRef.current.size > l1Size) {
    const oldestKey = l1CacheRef.current.keys().next().value;
    l1CacheRef.current.delete(oldestKey);
  }

  if (l2CacheRef.current.size > l1Size * 5) {
    // Limpar entradas expiradas do L2
    const now = Date.now();
    for (const [key, entry] of l2CacheRef.current.entries()) {
      if (now - entry.timestamp > l2TTL) {
        l2CacheRef.current.delete(key);
      }
    }
  }

  return value;
}

/**
 * Hook para memoização otimizada de cálculos financeiros
 */
export function useFinancialMemo<T>(
  factory: () => T,
  transactions: any[],
  additionalDeps: DependencyList = []
): T {
  // Usar hash das transações em vez de array completo para melhor performance
  const transactionsHash = useMemo(() => {
    if (!transactions || transactions.length === 0) return 'empty';
    
    // Criar hash baseado em propriedades críticas
    const criticalData = transactions.map(t => ({
      id: t.id,
      date: t.date,
      amount: t.amount,
      type: t.type
    }));
    
    return JSON.stringify(criticalData);
  }, [transactions]);

  return useMemo(factory, [transactionsHash, ...additionalDeps]);
}

/**
 * Hook para callback otimizado com memoização
 */
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList
): T {
  const memoizedCallback = useCallback(callback, deps);
  
  // Adicionar debounce para callbacks frequentes
  const debouncedCallback = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    
    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        memoizedCallback(...args);
      }, 16); // ~60fps
    }) as T;
  }, [memoizedCallback]);

  return debouncedCallback;
}

/**
 * Hook para limpeza automática de recursos
 */
export function useAutoCleanup<T>(
  factory: () => T,
  cleanup: (value: T) => void,
  deps: DependencyList
): T {
  const valueRef = useRef<T>();

  const value = useMemo(() => {
    // Limpar valor anterior se existir
    if (valueRef.current) {
      cleanup(valueRef.current);
    }
    
    const newValue = factory();
    valueRef.current = newValue;
    return newValue;
  }, deps);

  // Limpar na desmontagem
  useEffect(() => {
    return () => {
      if (valueRef.current) {
        cleanup(valueRef.current);
      }
    };
  }, []);

  return value;
}

export default {
  useDeepMemo,
  useTTLMemo,
  useSizedMemo,
  useDebouncedMemo,
  useThrottledMemo,
  useLRUMemo,
  useTwoTierMemo,
  useFinancialMemo,
  useOptimizedCallback,
  useAutoCleanup
};