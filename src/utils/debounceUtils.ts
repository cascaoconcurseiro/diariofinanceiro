/**
 * Utilitários de Debounce para prevenir race conditions e múltiplas execuções
 */

// Map para armazenar timeouts de debounce
const debounceTimeouts = new Map<string, NodeJS.Timeout>();

/**
 * Debounce para recálculos financeiros
 * Previne múltiplos recálculos simultâneos
 */
export const debounceRecalculation = (
  key: string,
  callback: () => void,
  delay: number = 100
): void => {
  // Cancela timeout anterior se existir
  const existingTimeout = debounceTimeouts.get(key);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  // Cria novo timeout
  const newTimeout = setTimeout(() => {
    callback();
    debounceTimeouts.delete(key);
  }, delay);

  debounceTimeouts.set(key, newTimeout);
};

/**
 * Cancela todos os debounces pendentes
 */
export const cancelAllDebounces = (): void => {
  debounceTimeouts.forEach((timeout) => {
    clearTimeout(timeout);
  });
  debounceTimeouts.clear();
};

/**
 * Verifica se há debounces pendentes
 */
export const hasPendingDebounces = (): boolean => {
  return debounceTimeouts.size > 0;
};

/**
 * Debounce específico para requestAnimationFrame
 * Evita múltiplas chamadas de recálculo no mesmo frame
 */
const animationFrameCallbacks = new Map<string, number>();

export const debounceAnimationFrame = (
  key: string,
  callback: () => void
): void => {
  // Cancela frame anterior se existir
  const existingFrame = animationFrameCallbacks.get(key);
  if (existingFrame) {
    cancelAnimationFrame(existingFrame);
  }

  // Agenda novo frame
  const newFrame = requestAnimationFrame(() => {
    callback();
    animationFrameCallbacks.delete(key);
  });

  animationFrameCallbacks.set(key, newFrame);
};

/**
 * Cancela todos os animation frames pendentes
 */
export const cancelAllAnimationFrames = (): void => {
  animationFrameCallbacks.forEach((frameId) => {
    cancelAnimationFrame(frameId);
  });
  animationFrameCallbacks.clear();
};