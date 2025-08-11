/**
 * Sistema de Otimização de Componentes React
 * Implementa memoização inteligente, lazy loading e otimizações de render
 */

import { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { advancedCache } from './advancedPerformanceCache';

// Tipos para otimização
interface OptimizationConfig {
  memoize: boolean;
  deepCompare: boolean;
  cacheResults: boolean;
  lazyRender: boolean;
  virtualizeList: boolean;
  debounceMs?: number;
}

interface RenderMetrics {
  componentName: string;
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  propsChanges: number;
  unnecessaryRenders: number;
}

// Métricas globais de render
const renderMetrics = new Map<string, RenderMetrics>();

// Comparador profundo otimizado
function deepEqual(a: any, b: any, maxDepth = 5, currentDepth = 0): boolean {
  if (currentDepth > maxDepth) return a === b;
  
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  
  if (typeof a === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual(a[key], b[key], maxDepth, currentDepth + 1)) return false;
    }
    
    return true;
  }
  
  return false;
}

// HOC para memoização inteligente
export function withSmartMemo<P extends object>(
  Component: React.ComponentType<P>,
  config: Partial<OptimizationConfig> = {}
) {
  const defaultConfig: OptimizationConfig = {
    memoize: true,
    deepCompare: false,
    cacheResults: true,
    lazyRender: false,
    virtualizeList: false,
    debounceMs: 0
  };
  
  const finalConfig = { ...defaultConfig, ...config };
  const componentName = Component.displayName || Component.name || 'Anonymous';
  
  // Inicializar métricas
  if (!renderMetrics.has(componentName)) {
    renderMetrics.set(componentName, {
      componentName,
      renderCount: 0,
      averageRenderTime: 0,
      lastRenderTime: 0,
      propsChanges: 0,
      unnecessaryRenders: 0
    });
  }

  const OptimizedComponent = memo((props: P) => {
    const renderStartTime = performance.now();
    const prevPropsRef = useRef<P>();
    const renderCountRef = useRef(0);
    
    // Detectar mudanças desnecessárias
    useEffect(() => {
      const metrics = renderMetrics.get(componentName)!;
      
      if (prevPropsRef.current) {
        const hasRealChanges = finalConfig.deepCompare 
          ? !deepEqual(prevPropsRef.current, props)
          : prevPropsRef.current !== props;
          
        if (!hasRealChanges) {
          metrics.unnecessaryRenders++;
        } else {
          metrics.propsChanges++;
        }
      }
      
      prevPropsRef.current = props;
      renderCountRef.current++;
      metrics.renderCount++;
      
      const renderTime = performance.now() - renderStartTime;
      metrics.lastRenderTime = renderTime;
      metrics.averageRenderTime = (metrics.averageRenderTime + renderTime) / 2;
      
      renderMetrics.set(componentName, metrics);
    });

    // Cache de resultado se habilitado
    const cacheKey = finalConfig.cacheResults 
      ? `render_${componentName}_${JSON.stringify(props)}`
      : null;

    if (finalConfig.cacheResults && cacheKey) {
      const cached = advancedCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const result = <Component {...props} />;
    
    if (finalConfig.cacheResults && cacheKey) {
      advancedCache.set(cacheKey, result, 30000); // Cache por 30s
    }

    return result;
  }, finalConfig.deepCompare ? deepEqual : undefined);

  OptimizedComponent.displayName = `SmartMemo(${componentName})`;
  return OptimizedComponent;
}

// Hook para memoização de valores computados
export function useSmartMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  options: {
    cache?: boolean;
    cacheKey?: string;
    ttl?: number;
    deepCompare?: boolean;
  } = {}
): T {
  const { cache = false, cacheKey, ttl = 60000, deepCompare = false } = options;
  
  // Cache externo se habilitado
  if (cache && cacheKey) {
    const cached = advancedCache.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  const result = useMemo(factory, deepCompare ? deps : deps);
  
  // Salvar no cache se habilitado
  if (cache && cacheKey) {
    advancedCache.set(cacheKey, result, ttl);
  }
  
  return result;
}

// Hook para callbacks otimizados
export function useSmartCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  options: {
    debounce?: number;
    throttle?: number;
    cache?: boolean;
  } = {}
): T {
  const { debounce = 0, throttle = 0, cache = false } = options;
  
  // Debounce
  const debouncedCallback = useCallback(
    debounce > 0 ? debounceFunction(callback, debounce) : callback,
    deps
  );
  
  // Throttle
  const throttledCallback = useCallback(
    throttle > 0 ? throttleFunction(debouncedCallback, throttle) : debouncedCallback,
    [debouncedCallback]
  );
  
  return throttledCallback as T;
}

// Utilitários de debounce e throttle
function debounceFunction<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout;
  
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
}

function throttleFunction<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  let lastCall = 0;
  
  return ((...args: any[]) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func(...args);
    }
  }) as T;
}

// Hook para lazy rendering
export function useLazyRender(
  condition: boolean,
  delay: number = 100
): boolean {
  const [shouldRender, setShouldRender] = useState(false);
  
  useEffect(() => {
    if (condition) {
      const timer = setTimeout(() => setShouldRender(true), delay);
      return () => clearTimeout(timer);
    } else {
      setShouldRender(false);
    }
  }, [condition, delay]);
  
  return shouldRender;
}

// Hook para virtualização de listas
export function useVirtualList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    );
    
    return {
      start: Math.max(0, start - overscan),
      end,
      offsetY: start * itemHeight
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);
  
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index
    }));
  }, [items, visibleRange]);
  
  return {
    visibleItems,
    totalHeight: items.length * itemHeight,
    offsetY: visibleRange.offsetY,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }
  };
}

// Hook para detecção de mudanças de props
export function usePropsChanged<T extends object>(props: T): boolean {
  const prevPropsRef = useRef<T>();
  const [changed, setChanged] = useState(false);
  
  useEffect(() => {
    if (prevPropsRef.current) {
      const hasChanged = !deepEqual(prevPropsRef.current, props);
      setChanged(hasChanged);
    }
    prevPropsRef.current = props;
  }, [props]);
  
  return changed;
}

// Hook para monitoramento de performance de componente
export function useRenderMetrics(componentName: string) {
  const renderStartTime = useRef<number>();
  
  useEffect(() => {
    renderStartTime.current = performance.now();
    
    return () => {
      if (renderStartTime.current) {
        const renderTime = performance.now() - renderStartTime.current;
        
        let metrics = renderMetrics.get(componentName);
        if (!metrics) {
          metrics = {
            componentName,
            renderCount: 0,
            averageRenderTime: 0,
            lastRenderTime: 0,
            propsChanges: 0,
            unnecessaryRenders: 0
          };
        }
        
        metrics.renderCount++;
        metrics.lastRenderTime = renderTime;
        metrics.averageRenderTime = (metrics.averageRenderTime + renderTime) / 2;
        
        renderMetrics.set(componentName, metrics);
      }
    };
  });
  
  return renderMetrics.get(componentName);
}

// Componente para lazy loading de imagens
export const LazyImage = memo(({ src, alt, className, ...props }: {
  src: string;
  alt: string;
  className?: string;
  [key: string]: any;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <img
      ref={imgRef}
      src={isInView ? src : undefined}
      alt={alt}
      className={className}
      onLoad={() => setIsLoaded(true)}
      style={{
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 0.3s ease',
        ...props.style
      }}
      {...props}
    />
  );
});

// API para obter métricas de render
export function getRenderMetrics(): RenderMetrics[] {
  return Array.from(renderMetrics.values());
}

// Limpar métricas
export function clearRenderMetrics(): void {
  renderMetrics.clear();
}

// Relatório de performance
export function getPerformanceReport(): {
  totalComponents: number;
  totalRenders: number;
  averageRenderTime: number;
  slowestComponents: RenderMetrics[];
  mostRenderedComponents: RenderMetrics[];
  unnecessaryRenders: number;
} {
  const metrics = Array.from(renderMetrics.values());
  
  const totalRenders = metrics.reduce((sum, m) => sum + m.renderCount, 0);
  const averageRenderTime = metrics.reduce((sum, m) => sum + m.averageRenderTime, 0) / metrics.length;
  const unnecessaryRenders = metrics.reduce((sum, m) => sum + m.unnecessaryRenders, 0);
  
  const slowestComponents = [...metrics]
    .sort((a, b) => b.averageRenderTime - a.averageRenderTime)
    .slice(0, 5);
    
  const mostRenderedComponents = [...metrics]
    .sort((a, b) => b.renderCount - a.renderCount)
    .slice(0, 5);
  
  return {
    totalComponents: metrics.length,
    totalRenders,
    averageRenderTime: averageRenderTime || 0,
    slowestComponents,
    mostRenderedComponents,
    unnecessaryRenders
  };
}

export default {
  withSmartMemo,
  useSmartMemo,
  useSmartCallback,
  useLazyRender,
  useVirtualList,
  usePropsChanged,
  useRenderMetrics,
  LazyImage,
  getRenderMetrics,
  clearRenderMetrics,
  getPerformanceReport
};