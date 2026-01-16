'use client'

import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'

/**
 * 統一的異步操作狀態管理 Hook
 *
 * 解決的問題：
 * - 專案中有 50+ 種重複的 loading/error 狀態模式
 * - 每個 Hook 都自己寫 try/catch/finally
 * - 錯誤處理不一致（有些用 toast，有些用 state）
 *
 * 使用方式：
 * ```tsx
 * // 基本用法
 * const { loading, error, execute } = useAsyncData()
 * await execute(async () => {
 *   const data = await fetchData()
 *   return data
 * })
 *
 * // 帶 toast 回饋
 * const { execute } = useAsyncData({ showToast: true })
 * await execute(
 *   async () => { await saveData(); return 'ok' },
 *   { successMessage: '儲存成功' }
 * )
 *
 * // 多操作追蹤（如表單有多個按鈕）
 * const { loadingFor, executeFor } = useAsyncData()
 * await executeFor('save', async () => saveData())
 * await executeFor('delete', async () => deleteData())
 * // loadingFor('save') → true/false
 * ```
 */

export interface UseAsyncDataOptions {
  /** 是否顯示 toast 回饋 */
  showToast?: boolean
  /** 自動捕獲並顯示錯誤訊息 */
  onError?: (error: Error) => void
}

export interface ExecuteOptions {
  /** 成功時顯示的訊息 */
  successMessage?: string
  /** 失敗時顯示的訊息（會覆蓋 error.message） */
  errorMessage?: string
  /** 是否在此操作顯示 toast（覆蓋全域設定） */
  showToast?: boolean
}

export interface UseAsyncDataReturn<T = unknown> {
  /** 是否正在載入（任何操作） */
  loading: boolean
  /** 最後的錯誤 */
  error: Error | null
  /** 最後的執行結果 */
  data: T | null
  /** 清除錯誤 */
  clearError: () => void
  /** 重置所有狀態 */
  reset: () => void
  /** 執行異步操作 */
  execute: <R = T>(
    fn: () => Promise<R>,
    options?: ExecuteOptions
  ) => Promise<R | null>
  /** 檢查特定操作是否正在執行 */
  loadingFor: (key: string) => boolean
  /** 執行特定操作（可追蹤） */
  executeFor: <R = T>(
    key: string,
    fn: () => Promise<R>,
    options?: ExecuteOptions
  ) => Promise<R | null>
}

export function useAsyncData<T = unknown>(
  globalOptions?: UseAsyncDataOptions
): UseAsyncDataReturn<T> {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<T | null>(null)

  // 追蹤多個操作的 loading 狀態
  const loadingKeys = useRef<Set<string>>(new Set())
  const [, forceUpdate] = useState({})

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setData(null)
    loadingKeys.current.clear()
    forceUpdate({})
  }, [])

  const execute = useCallback(
    async <R = T>(
      fn: () => Promise<R>,
      options?: ExecuteOptions
    ): Promise<R | null> => {
      const showToast = options?.showToast ?? globalOptions?.showToast ?? false

      setLoading(true)
      setError(null)

      try {
        const result = await fn()
        setData(result as unknown as T)

        if (showToast && options?.successMessage) {
          toast.success(options.successMessage)
        }

        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)

        if (showToast) {
          toast.error(options?.errorMessage || error.message || '操作失敗')
        }

        globalOptions?.onError?.(error)
        return null
      } finally {
        setLoading(false)
      }
    },
    [globalOptions]
  )

  const loadingFor = useCallback((key: string) => {
    return loadingKeys.current.has(key)
  }, [])

  const executeFor = useCallback(
    async <R = T>(
      key: string,
      fn: () => Promise<R>,
      options?: ExecuteOptions
    ): Promise<R | null> => {
      const showToast = options?.showToast ?? globalOptions?.showToast ?? false

      loadingKeys.current.add(key)
      setLoading(true)
      setError(null)
      forceUpdate({})

      try {
        const result = await fn()
        setData(result as unknown as T)

        if (showToast && options?.successMessage) {
          toast.success(options.successMessage)
        }

        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)

        if (showToast) {
          toast.error(options?.errorMessage || error.message || '操作失敗')
        }

        globalOptions?.onError?.(error)
        return null
      } finally {
        loadingKeys.current.delete(key)
        setLoading(loadingKeys.current.size > 0)
        forceUpdate({})
      }
    },
    [globalOptions]
  )

  return {
    loading,
    error,
    data,
    clearError,
    reset,
    execute,
    loadingFor,
    executeFor,
  }
}

/**
 * 簡化版：只追蹤 loading 狀態
 *
 * 使用方式：
 * ```tsx
 * const [loading, withLoading] = useLoadingState()
 * await withLoading(async () => {
 *   await saveData()
 * })
 * ```
 */
export function useLoadingState(): [boolean, <T>(fn: () => Promise<T>) => Promise<T | null>] {
  const [loading, setLoading] = useState(false)

  const withLoading = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true)
    try {
      return await fn()
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      toast.error(error.message || '操作失敗')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return [loading, withLoading]
}

/**
 * 多 loading 狀態追蹤（適合表單有多個操作按鈕）
 *
 * 使用方式：
 * ```tsx
 * const { isLoading, withLoading } = useMultiLoadingState()
 *
 * <Button disabled={isLoading('save')} onClick={() => withLoading('save', saveData)}>
 *   {isLoading('save') ? '儲存中...' : '儲存'}
 * </Button>
 * <Button disabled={isLoading('delete')} onClick={() => withLoading('delete', deleteData)}>
 *   {isLoading('delete') ? '刪除中...' : '刪除'}
 * </Button>
 * ```
 */
export function useMultiLoadingState() {
  const loadingKeys = useRef<Set<string>>(new Set())
  const [, forceUpdate] = useState({})

  const isLoading = useCallback((key: string) => {
    return loadingKeys.current.has(key)
  }, [])

  const isAnyLoading = useCallback(() => {
    return loadingKeys.current.size > 0
  }, [])

  const withLoading = useCallback(async <T>(
    key: string,
    fn: () => Promise<T>,
    options?: { successMessage?: string; errorMessage?: string }
  ): Promise<T | null> => {
    loadingKeys.current.add(key)
    forceUpdate({})

    try {
      const result = await fn()
      if (options?.successMessage) {
        toast.success(options.successMessage)
      }
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      toast.error(options?.errorMessage || error.message || '操作失敗')
      return null
    } finally {
      loadingKeys.current.delete(key)
      forceUpdate({})
    }
  }, [])

  return {
    isLoading,
    isAnyLoading,
    withLoading,
  }
}
