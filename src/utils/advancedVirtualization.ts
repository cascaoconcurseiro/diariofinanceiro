/**
 * Sistema de Virtualização Avançada
 * Renderiza apenas itens visíveis para listas grandes com performance otimizada
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

export interface VirtualizationConfig {
  itemHeight: number | ((index: number) => number);
  containerHeight: number;
  overscan: number;
  threshold: number;
  estimatedItemHeight?: number;
  scrollingDelay?: number;
  useIsScrolling?: boolean;
  horizontal?: boolean;
}

export interface VirtualItem {
  index: number;
  start: number;
  end: number;
  size: number;
}

export interface VirtualRange {
  start: number;
  end: number;
  overscanStart: number;
  overscanEnd: number;
}

export interface ScrollElement {
  scrollTop: number;
  scrollLeft: number;
  scrollHeight: number;
  scrollWidth: number;
  clientHeight: number;
  clientWidth: number;
}

export interface VirtualizationState {
  items: VirtualItem[];
  totalSize: number;
  range: VirtualRange;
  isScrolling: boolean;
  scrollDirection: 'forward' | 'backward';
  scrollOffset: number;
}

class AdvancedVirtualization {
  private config: VirtualizationConfig;
  private itemSizes: Map<number, number> = new Map();
  private measuredItems: Set<number> = new Set();
  private observers: ((state: VirtualizationState) => void)[] = [];
  private scrollTimeout?: NodeJS.Timeout;
  private lastScrollTime = 0;
  private lastScrollOffset = 0;
  private scrollDirection: 'forward' | 'backward' = 'forward';

  constructor(config: VirtualizationConfig) {
    this.config = config;
  }

  // Calcular itens virtuais
  calculateVirtualItems(
    totalCount: number,
    scrollOffset: number,
    containerSize: number
  ): VirtualizationState {
    const items: VirtualItem[] = [];
    let totalSize = 0;
    let currentOffset = 0;

    // Calcular tamanhos e posições dos itens
    for (let index = 0; index < totalCount; index++) {
      const size = this.getItemSize(index);
      
      items.push({
        index,
        start: currentOffset,
        end: currentOffset + size,
        size
      });

      currentOffset += size;
    }

    totalSize = currentOffset;

    // Calcular range visível
    const range = this.calculateVisibleRange(
      items,
      scrollOffset,
      containerSize,
      this.config.overscan
    );

    // Determinar direção do scroll
    if (scrollOffset > this.lastScrollOffset) {
      this.scrollDirection = 'forward';
    } else if (scrollOffset < this.lastScrollOffset) {
      this.scrollDirection = 'backward';
    }
    this.lastScrollOffset = scrollOffset;

    // Determinar se está rolando
    const now = Date.now();
    const isScrolling = now - this.lastScrollTime < (this.config.scrollingDelay || 150);
    this.lastScrollTime = now;

    const state: VirtualizationState = {
      items: items.slice(range.overscanStart, range.overscanEnd + 1),
      totalSize,
      range,
      isScrolling,
      scrollDirection: this.scrollDirection,
      scrollOffset
    };

    // Notificar observadores
    this.notifyObservers(state);

    return state;
  }

  // Calcular range visível
  private calculateVisibleRange(
    items: VirtualItem[],
    scrollOffset: number,
    containerSize: number,
    overscan: number
  ): VirtualRange {
    const totalCount = items.length;
    
    if (totalCount === 0) {
      return { start: 0, end: 0, overscanStart: 0, overscanEnd: 0 };
    }

    // Encontrar primeiro item visível
    let start = 0;
    let end = totalCount - 1;

    // Busca binária para encontrar o primeiro item visível
    while (start < end) {
      const middle = Math.floor((start + end) / 2);
      const item = items[middle];
      
      if (item.end <= scrollOffset) {
        start = middle + 1;
      } else {
        end = middle;
      }
    }

    const visibleStart = start;

    // Encontrar último item visível
    start = visibleStart;
    end = totalCount - 1;
    const scrollEnd = scrollOffset + containerSize;

    while (start < end) {
      const middle = Math.ceil((start + end) / 2);
      const item = items[middle];
      
      if (item.start >= scrollEnd) {
        end = middle - 1;
      } else {
        start = middle;
      }
    }

    const visibleEnd = end;

    // Aplicar overscan
    const overscanStart = Math.max(0, visibleStart - overscan);
    const overscanEnd = Math.min(totalCount - 1, visibleEnd + overscan);

    return {
      start: visibleStart,
      end: visibleEnd,
      overscanStart,
      overscanEnd
    };
  }

  // Obter tamanho do item
  private getItemSize(index: number): number {
    // Verificar se já foi medido
    if (this.itemSizes.has(index)) {
      return this.itemSizes.get(index)!;
    }

    // Usar função de cálculo se fornecida
    if (typeof this.config.itemHeight === 'function') {
      const size = this.config.itemHeight(index);
      this.itemSizes.set(index, size);
      return size;
    }

    // Usar altura fixa
    if (typeof this.config.itemHeight === 'number') {
      return this.config.itemHeight;
    }

    // Usar altura estimada
    return this.config.estimatedItemHeight || 50;
  }

  // Medir item real
  measureItem(index: number, size: number): void {
    const currentSize = this.itemSizes.get(index);
    
    if (currentSize !== size) {
      this.itemSizes.set(index, size);
      this.measuredItems.add(index);
      
      // Recalcular se necessário
      this.invalidateAfter(index);
    }
  }

  // Invalidar cálculos após um índice
  private invalidateAfter(index: number): void {
    // Remover medições após o índice alterado
    for (const measuredIndex of this.measuredItems) {
      if (measuredIndex > index) {
        this.itemSizes.delete(measuredIndex);
        this.measuredItems.delete(measuredIndex);
      }
    }
  }

  // Scroll para item específico
  scrollToItem(
    index: number,
    align: 'start' | 'center' | 'end' | 'auto' = 'auto'
  ): number {
    const totalCount = this.itemSizes.size || 0;
    
    if (index < 0 || index >= totalCount) {
      return 0;
    }

    // Calcular offset do item
    let itemOffset = 0;
    for (let i = 0; i < index; i++) {
      itemOffset += this.getItemSize(i);
    }

    const itemSize = this.getItemSize(index);
    const containerSize = this.config.containerHeight;

    let scrollOffset = itemOffset;

    switch (align) {
      case 'start':
        scrollOffset = itemOffset;
        break;
      case 'end':
        scrollOffset = itemOffset + itemSize - containerSize;
        break;
      case 'center':
        scrollOffset = itemOffset + itemSize / 2 - containerSize / 2;
        break;
      case 'auto':
        // Scroll apenas se necessário
        const currentScrollOffset = this.lastScrollOffset;
        const itemStart = itemOffset;
        const itemEnd = itemOffset + itemSize;
        const viewStart = currentScrollOffset;
        const viewEnd = currentScrollOffset + containerSize;

        if (itemStart < viewStart) {
          scrollOffset = itemStart;
        } else if (itemEnd > viewEnd) {
          scrollOffset = itemEnd - containerSize;
        } else {
          scrollOffset = currentScrollOffset;
        }
        break;
    }

    return Math.max(0, scrollOffset);
  }

  // Obter índice do item no offset
  getItemIndexAtOffset(offset: number): number {
    let currentOffset = 0;
    let index = 0;

    while (index < this.itemSizes.size && currentOffset < offset) {
      currentOffset += this.getItemSize(index);
      index++;
    }

    return Math.max(0, index - 1);
  }

  // Observadores
  subscribe(callback: (state: VirtualizationState) => void): () => void {
    this.observers.push(callback);
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  private notifyObservers(state: VirtualizationState): void {
    this.observers.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Erro no observer de virtualização:', error);
      }
    });
  }

  // Limpar cache
  clearCache(): void {
    this.itemSizes.clear();
    this.measuredItems.clear();
  }

  // Atualizar configuração
  updateConfig(newConfig: Partial<VirtualizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.clearCache();
  }
}

// Hook para virtualização
export function useVirtualization(
  totalCount: number,
  config: VirtualizationConfig
) {
  const [virtualizer] = useState(() => new AdvancedVirtualization(config));
  const [state, setState] = useState<VirtualizationState>({
    items: [],
    totalSize: 0,
    range: { start: 0, end: 0, overscanStart: 0, overscanEnd: 0 },
    isScrolling: false,
    scrollDirection: 'forward',
    scrollOffset: 0
  });

  const scrollElementRef = useRef<HTMLElement>();
  const [scrollOffset, setScrollOffset] = useState(0);

  // Atualizar configuração quando mudar
  useEffect(() => {
    virtualizer.updateConfig(config);
  }, [config, virtualizer]);

  // Calcular itens virtuais quando necessário
  useEffect(() => {
    const newState = virtualizer.calculateVirtualItems(
      totalCount,
      scrollOffset,
      config.containerHeight
    );
    setState(newState);
  }, [totalCount, scrollOffset, config.containerHeight, virtualizer]);

  // Handler de scroll
  const handleScroll = useCallback((e: Event) => {
    const element = e.target as HTMLElement;
    const newScrollOffset = config.horizontal ? element.scrollLeft : element.scrollTop;
    setScrollOffset(newScrollOffset);
  }, [config.horizontal]);

  // Configurar scroll listener
  useEffect(() => {
    const element = scrollElementRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        element.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll]);

  // Medir item
  const measureItem = useCallback((index: number, size: number) => {
    virtualizer.measureItem(index, size);
  }, [virtualizer]);

  // Scroll para item
  const scrollToItem = useCallback((
    index: number,
    align: 'start' | 'center' | 'end' | 'auto' = 'auto'
  ) => {
    const offset = virtualizer.scrollToItem(index, align);
    
    if (scrollElementRef.current) {
      if (config.horizontal) {
        scrollElementRef.current.scrollLeft = offset;
      } else {
        scrollElementRef.current.scrollTop = offset;
      }
    }
    
    return offset;
  }, [virtualizer, config.horizontal]);

  // Scroll para offset
  const scrollToOffset = useCallback((offset: number) => {
    if (scrollElementRef.current) {
      if (config.horizontal) {
        scrollElementRef.current.scrollLeft = offset;
      } else {
        scrollElementRef.current.scrollTop = offset;
      }
    }
  }, [config.horizontal]);

  return {
    // Estado
    items: state.items,
    totalSize: state.totalSize,
    range: state.range,
    isScrolling: state.isScrolling,
    scrollDirection: state.scrollDirection,
    scrollOffset: state.scrollOffset,

    // Refs
    scrollElementRef,

    // Métodos
    measureItem,
    scrollToItem,
    scrollToOffset,
    
    // Utilitários
    getItemIndexAtOffset: virtualizer.getItemIndexAtOffset.bind(virtualizer),
    clearCache: virtualizer.clearCache.bind(virtualizer)
  };
}

// Hook para lista virtual simples
export function useVirtualList<T>(
  items: T[],
  config: Omit<VirtualizationConfig, 'threshold'>
) {
  const virtualization = useVirtualization(items.length, {
    ...config,
    threshold: 0
  });

  const virtualItems = useMemo(() => {
    return virtualization.items.map(virtualItem => ({
      ...virtualItem,
      item: items[virtualItem.index]
    }));
  }, [virtualization.items, items]);

  return {
    ...virtualization,
    virtualItems
  };
}

// Componente de item virtual
export interface VirtualItemProps {
  index: number;
  style: React.CSSProperties;
  isScrolling?: boolean;
  children: React.ReactNode;
  onResize?: (size: number) => void;
}

export function VirtualItem({ 
  index, 
  style, 
  isScrolling, 
  children, 
  onResize 
}: VirtualItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasResized, setHasResized] = useState(false);

  useEffect(() => {
    if (ref.current && onResize && !hasResized) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const size = entry.contentRect.height;
          onResize(size);
          setHasResized(true);
        }
      });

      resizeObserver.observe(ref.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [onResize, hasResized]);

  return (
    <div
      ref={ref}
      style={style}
      data-index={index}
      data-scrolling={isScrolling}
    >
      {children}
    </div>
  );
}

// Hook para grid virtual
export function useVirtualGrid<T>(
  items: T[],
  config: VirtualizationConfig & {
    columnCount: number;
    rowHeight: number;
    columnWidth: number;
  }
) {
  const rowCount = Math.ceil(items.length / config.columnCount);
  
  const virtualization = useVirtualization(rowCount, {
    ...config,
    itemHeight: config.rowHeight
  });

  const virtualRows = useMemo(() => {
    return virtualization.items.map(virtualRow => {
      const startIndex = virtualRow.index * config.columnCount;
      const endIndex = Math.min(startIndex + config.columnCount, items.length);
      const rowItems = items.slice(startIndex, endIndex);

      return {
        ...virtualRow,
        items: rowItems,
        startIndex,
        endIndex
      };
    });
  }, [virtualization.items, items, config.columnCount]);

  return {
    ...virtualization,
    virtualRows,
    rowCount,
    columnCount: config.columnCount,
    columnWidth: config.columnWidth
  };
}

// Utilitários para cálculo de tamanho dinâmico
export function createDynamicSizeCalculator(
  baseSize: number,
  sizeVariations: { [index: number]: number } = {}
) {
  return (index: number): number => {
    return sizeVariations[index] || baseSize;
  };
}

export function createContentBasedSizeCalculator(
  getContent: (index: number) => string,
  baseSize: number = 50,
  charHeight: number = 1.2
) {
  return (index: number): number => {
    const content = getContent(index);
    const lines = content.split('\n').length;
    const estimatedHeight = Math.max(baseSize, lines * charHeight * 16); // 16px base font
    return estimatedHeight;
  };
}

// Componente de container virtual
export interface VirtualContainerProps {
  height: number;
  width?: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function VirtualContainer({ 
  height, 
  width, 
  children, 
  className, 
  style 
}: VirtualContainerProps) {
  return (
    <div
      className={className}
      style={{
        height,
        width,
        overflow: 'auto',
        position: 'relative',
        ...style
      }}
    >
      {children}
    </div>
  );
}

export default AdvancedVirtualization;