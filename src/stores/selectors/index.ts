/**
 * Store Selectors 統一匯出
 * 優化的 selector hooks，提升性能並減少不必要的重新渲染
 */

// Accounting Selectors
export {
  useAccountingStats,
  useAccountBalance,
  useCategoryTotal,
  useAccountBalanceMap,
  useCategoryTotalsMap,
  useAccountsByType,
  useMonthlyTransactions,
} from './accounting-selectors';

// Timebox Selectors
export {
  useWeekStatistics,
  useWorkoutTrends,
  useTodayScheduledBoxes,
  useWeekViewBoxes,
  useBoxCompletionByType,
} from './timebox-selectors';

// Sync Utilities
export {
  loadWithSync,
  createWithSync,
  updateWithSync,
  deleteWithSync,
  batchUpdateWithSync,
} from '../utils/sync-helper';

export type { SyncOptions, SyncResult } from '../utils/sync-helper';
