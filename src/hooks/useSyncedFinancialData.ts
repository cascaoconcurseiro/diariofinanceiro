import { useCallback } from 'react';
import { useFinancialData } from './useFinancialData';
import { debounceAnimationFrame } from '../utils/debounceUtils';

export const useSyncedFinancialData = () => {
  const financialData = useFinancialData();

  // Force COMPLETE recalculation
  const forceCompleteRecalculation = useCallback((): void => {
    console.log('🔄 Forcing COMPLETE recalculation with full propagation');
    debounceAnimationFrame('recalc-force-complete', () => {
      financialData.recalculateBalances();
    });
  }, [financialData]);

  return {
    ...financialData,
    forceRecalculation: forceCompleteRecalculation
  };
};